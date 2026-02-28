export const USER_LEVELS = ['bronze', 'silver', 'gold', 'platinum'] as const
export type UserLevel = (typeof USER_LEVELS)[number]
