import { Crown, Gift, TrendingUp, Truck } from 'lucide-react'
import React from 'react'

type LevelConfig = {
  level: string
  minSpending: number
  discountPercent: number
  freeShipping: boolean
  description?: string
}

type UserLevelCardProps = {
  currentLevel: string
  totalSpent: number
  levelSettings: LevelConfig[]
}

const LEVEL_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  bronze: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-800/40',
    text: 'text-orange-700 dark:text-orange-400',
    icon: 'text-orange-500',
  },
  silver: {
    bg: 'bg-slate-50 dark:bg-slate-900/30',
    border: 'border-slate-300 dark:border-slate-700/50',
    text: 'text-slate-600 dark:text-slate-300',
    icon: 'text-slate-400',
  },
  gold: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-700/40',
    text: 'text-amber-700 dark:text-amber-400',
    icon: 'text-amber-500',
  },
  platinum: {
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-200 dark:border-violet-700/40',
    text: 'text-violet-700 dark:text-violet-400',
    icon: 'text-violet-500',
  },
}

const DEFAULT_COLORS = LEVEL_COLORS.bronze

export const UserLevelCard: React.FC<UserLevelCardProps> = ({
  currentLevel,
  totalSpent,
  levelSettings,
}) => {
  const colors = LEVEL_COLORS[currentLevel] || DEFAULT_COLORS
  const currentConfig = levelSettings.find((l) => l.level === currentLevel)

  // Find next level
  const sortedLevels = [...levelSettings].sort((a, b) => a.minSpending - b.minSpending)
  const currentIndex = sortedLevels.findIndex((l) => l.level === currentLevel)
  const nextLevel =
    currentIndex >= 0 && currentIndex < sortedLevels.length - 1
      ? sortedLevels[currentIndex + 1]
      : null

  // Progress calculation
  const currentThreshold = currentConfig?.minSpending ?? 0
  const nextThreshold = nextLevel?.minSpending ?? 0
  const progressRange = nextThreshold - currentThreshold
  const progressAmount = totalSpent - currentThreshold
  const progressPercent = nextLevel
    ? Math.min(100, Math.max(0, (progressAmount / progressRange) * 100))
    : 100
  const amountToNext = nextLevel ? Math.max(0, nextThreshold - totalSpent) : 0

  return (
    <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-6 space-y-5`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2.5 ${colors.bg} border ${colors.border}`}>
            <Crown className={`h-6 w-6 ${colors.icon}`} />
          </div>
          <div>
            <h3 className={`font-semibold text-lg capitalize ${colors.text}`}>{currentLevel}</h3>
            <p className="text-xs text-muted-foreground">Member since joining</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total spent</p>
          <p className="font-semibold text-lg">${totalSpent.toFixed(2)}</p>
        </div>
      </div>

      {/* Current benefits */}
      {currentConfig && (currentConfig.discountPercent > 0 || currentConfig.freeShipping) && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your benefits
          </p>
          <div className="flex flex-wrap gap-2">
            {currentConfig.discountPercent > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                <Gift className="h-3 w-3" />
                {currentConfig.discountPercent}% off all orders
              </span>
            )}
            {currentConfig.freeShipping && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                <Truck className="h-3 w-3" />
                Free shipping
              </span>
            )}
          </div>
          {currentConfig.description && (
            <p className="text-sm text-muted-foreground">{currentConfig.description}</p>
          )}
        </div>
      )}

      {/* Progress to next level */}
      {nextLevel && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Progress to <span className="font-medium capitalize">{nextLevel.level}</span>
            </span>
            <span className="text-muted-foreground font-medium">
              ${amountToNext.toFixed(2)} to go
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-primary/60 to-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${currentThreshold.toFixed(0)}</span>
            <span>${nextThreshold.toFixed(0)}</span>
          </div>
        </div>
      )}

      {/* Max level reached */}
      {!nextLevel && (
        <div className="text-center py-2">
          <p className={`text-sm font-medium ${colors.text}`}>
            🎉 You&apos;ve reached the highest level!
          </p>
        </div>
      )}

      {/* All levels overview */}
      {levelSettings.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            All levels
          </p>
          <div className="grid grid-cols-2 gap-2">
            {sortedLevels.map((level) => {
              const isActive = level.level === currentLevel
              const lColors = LEVEL_COLORS[level.level] || DEFAULT_COLORS
              return (
                <div
                  key={level.level}
                  className={`rounded-lg px-3 py-2 text-xs border transition-colors ${
                    isActive
                      ? `${lColors.border} ${lColors.bg} ring-1 ring-offset-1 ring-primary/20`
                      : 'border-border/30 bg-card/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium capitalize ${isActive ? lColors.text : ''}`}>
                      {level.level}
                    </span>
                    {isActive && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-muted-foreground space-y-0.5">
                    {level.discountPercent > 0 && <p>{level.discountPercent}% discount</p>}
                    {level.freeShipping && <p>Free shipping</p>}
                    <p className="opacity-70">Min. ${level.minSpending.toFixed(0)} spent</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
