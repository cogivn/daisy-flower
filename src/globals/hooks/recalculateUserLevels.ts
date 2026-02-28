import type { GlobalAfterChangeHook } from 'payload'
import type { UserLevel } from '@/config/userLevels'
import { USER_LEVELS } from '@/config/userLevels'

interface LevelThreshold {
  level: UserLevel
  minSpending: number
}

const LEVEL_RANK: Record<UserLevel, number> = Object.fromEntries(
  USER_LEVELS.map((l, i) => [l, i]),
) as Record<UserLevel, number>

/**
 * Determines the appropriate level for a given totalSpent.
 * Thresholds must be pre-sorted descending by minSpending.
 */
function resolveLevel(totalSpent: number, thresholds: LevelThreshold[]): UserLevel {
  for (const t of thresholds) {
    if (totalSpent >= t.minSpending) return t.level
  }
  return 'bronze'
}

/**
 * afterChange hook on UserLevelSettings global.
 *
 * - Unlocked users: upgrade or downgrade freely
 * - Locked users: only upgrade (skip downgrade), auto-unlock on upgrade
 */
export const recalculateUserLevels: GlobalAfterChangeHook = async ({ doc, req }) => {
  const levels = doc?.levels as LevelThreshold[] | undefined

  const sorted = (levels || [])
    .filter((l) => l.level && typeof l.minSpending === 'number')
    .sort((a, b) => b.minSpending - a.minSpending)

  // Empty thresholds → resolveLevel returns 'bronze' for everyone

  // Fetch ALL users (including locked)
  const { docs: users } = await req.payload.find({
    collection: 'users',
    limit: 0,
    pagination: false,
    select: {
      totalSpent: true,
      level: true,
      levelLocked: true,
    },
    overrideAccess: true,
    req,
  })

  const updates: Promise<unknown>[] = []

  for (const user of users) {
    const totalSpent = (user.totalSpent as number) || 0
    const currentLevel = (user.level as UserLevel) || 'bronze'
    const isLocked = Boolean(user.levelLocked)
    const newLevel = resolveLevel(totalSpent, sorted)

    if (newLevel === currentLevel) continue

    const isUpgrade = LEVEL_RANK[newLevel] > LEVEL_RANK[currentLevel]

    if (isLocked && !isUpgrade) continue

    // Upgrade locked user → unlock; otherwise just update level
    const data: Record<string, unknown> = { level: newLevel }
    if (isLocked && isUpgrade) {
      data.levelLocked = false
    }

    updates.push(
      req.payload.update({
        collection: 'users',
        id: user.id,
        data,
        select: { name: true },
        overrideAccess: true,
        req,
      }),
    )
  }

  if (updates.length > 0) {
    await Promise.all(updates)
    req.payload.logger.info(
      `User levels recalculated: ${updates.length} user(s) upgraded/downgraded.`,
    )
  }

  return doc
}
