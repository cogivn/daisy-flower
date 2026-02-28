import type { CollectionAfterChangeHook } from 'payload'
import type { UserLevel } from '@/config/userLevels'
import { USER_LEVELS } from '@/config/userLevels'

interface LevelThreshold {
  level: UserLevel
  minSpending: number
}

const LEVEL_RANK: Record<UserLevel, number> = Object.fromEntries(
  USER_LEVELS.map((l, i) => [l, i]),
) as Record<UserLevel, number>

function resolveLevel(totalSpent: number, thresholds: LevelThreshold[]): UserLevel {
  for (const t of thresholds) {
    if (totalSpent >= t.minSpending) return t.level
  }
  return 'bronze'
}

/**
 * Orders afterChange hook.
 *
 * When an order status changes to 'completed':
 * 1. Recalculate user's totalSpent from all completed orders
 * 2. Resolve new level from UserLevelSettings thresholds
 * 3. Update user (respecting levelLocked: only upgrade, no downgrade)
 *
 * When an order changes FROM 'completed' to something else (refund/cancel):
 * Same flow — totalSpent decreases, level may downgrade.
 */
export const syncUserOnOrderChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (context.skipUserSync) return doc

  const statusChanged = doc.status !== previousDoc?.status
  const wasCompleted = previousDoc?.status === 'completed'
  const isCompleted = doc.status === 'completed'

  // Only act when status transitions involve 'completed'
  if (!statusChanged || (!wasCompleted && !isCompleted)) return doc

  const customerId =
    typeof doc.customer === 'object' && doc.customer !== null ? doc.customer.id : doc.customer

  if (!customerId) return doc

  // 1. Sum totalSpent from all completed orders for this user — single aggregate query
  const { docs: completedOrders } = await req.payload.find({
    collection: 'orders',
    where: {
      and: [{ customer: { equals: customerId } }, { status: { equals: 'completed' } }],
    },
    select: { amount: true },
    limit: 0,
    pagination: false,
    overrideAccess: true,
    req,
  })

  const totalSpent = completedOrders.reduce((sum, order) => sum + ((order.amount as number) || 0), 0)

  // 2. Fetch level thresholds
  const settings = await req.payload.findGlobal({
    slug: 'user-level-settings',
    req,
  })

  const thresholds = ((settings?.levels as LevelThreshold[]) || [])
    .filter((l) => l.level && typeof l.minSpending === 'number')
    .sort((a, b) => b.minSpending - a.minSpending)

  const newLevel = resolveLevel(totalSpent, thresholds)

  // 3. Fetch current user state
  const user = await req.payload.findByID({
    collection: 'users',
    id: customerId,
    select: { level: true, levelLocked: true },
    overrideAccess: true,
    req,
  })

  const currentLevel = (user.level as UserLevel) || 'bronze'
  const isLocked = Boolean(user.levelLocked)
  const isUpgrade = LEVEL_RANK[newLevel] > LEVEL_RANK[currentLevel]
  const levelChanged = newLevel !== currentLevel

  // Build update data
  const data: Record<string, unknown> = { totalSpent }

  if (levelChanged) {
    if (isLocked && !isUpgrade) {
      // Locked + downgrade → skip level change, only update totalSpent
    } else {
      data.level = newLevel
      // Keep levelLocked on upgrade — admin set it as a floor,
      // upgrading respects that intent without removing the protection
    }
  }

  await req.payload.update({
    collection: 'users',
    id: customerId,
    data,
    select: { name: true },
    overrideAccess: true,
    context: { skipUserSync: true },
    req,
  })

  return doc
}
