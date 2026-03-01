/**
 * Currency Utility
 *
 * Standardizes how we handle monetary values across the system.
 *
 * IMPORTANT:
 * We configure the @payloadcms/plugin-ecommerce to use 'VND' with `decimals: 0`.
 * This means `priceInVND` fields are stored exactly as entered by the admin.
 * No conversion or multiplication is necessary.
 *
 * Example: admin enters 4999 -> DB stores 4999. Stripe receives amount: 4999 (VND is zero-decimal).
 *
 * Custom fields (e.g. SaleEvents.salePrice, Vouchers) are also plain numbers
 * and store the value as-is.
 */

export type CurrencyCode = 'VND'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  label: string
  minorUnitFactor: number // For VND, 1 VND = 1 unit (no subunits)
  decimalPlaces: number
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  VND: {
    code: 'VND',
    symbol: 'VND',
    label: 'Việt Nam Đồng',
    minorUnitFactor: 1,
    decimalPlaces: 0,
  },
}

export const DEFAULT_CURRENCY: CurrencyCode = 'VND'

/**
 * Convert major unit to minor unit. For VND this is a no-op (factor = 1).
 */
export function toMinorUnit(amount: number, currencyCode: CurrencyCode = DEFAULT_CURRENCY): number {
  const config = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY]
  return Math.round(amount * config.minorUnitFactor)
}

/**
 * Convert minor unit to major unit. For VND this is a no-op (factor = 1).
 */
export function fromMinorUnit(
  amount: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY,
): number {
  const config = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY]
  return amount / config.minorUnitFactor
}

/**
 * Format a VND amount for display.
 * Outputs e.g. "4.999 VND" or "500.000 VND".
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY,
): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY]

  // Format number with dot as thousand separator, no decimals
  const formatted = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  }).format(amount)

  return `${formatted} ${config.symbol}`
}

/**
 * Helper to ensure a value is treated as minor units even if it might be passed as major.
 */
export function ensureMinorUnit(amount: number, isAlreadyMinor: boolean): number {
  return isAlreadyMinor ? amount : toMinorUnit(amount)
}
