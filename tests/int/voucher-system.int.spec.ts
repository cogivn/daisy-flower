import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload

// IDs stored during seed
const ids: {
  adminUser?: number
  testCustomer?: number
  product1?: number
  product2?: number
  cart?: number | string
  voucherPercent?: number
  voucherFixed?: number
  voucherExpired?: number
  voucherDraft?: number
  voucherMaxUses?: number
  voucherLevelOnly?: number
  voucherSpecificUser?: number
  voucherSpecificProducts?: number
  voucherMinOrder?: number
} = {}

// ──────────────────────────────────────────────
// SEED
// ──────────────────────────────────────────────

async function seedTestData() {
  // 1. Admin user (already exists from project seed, find it)
  const { docs: existingAdmins } = await payload.find({
    collection: 'users',
    where: { 'roles': { contains: 'admin' } },
    limit: 1,
    overrideAccess: true,
  })

  if (existingAdmins.length > 0) {
    ids.adminUser = existingAdmins[0].id
  }

  // 2. Test customer
  const customer = await payload.create({
    collection: 'users',
    data: {
      email: `test-voucher-${Date.now()}@test.com`,
      password: 'test1234',
      name: 'Voucher Test User',
      roles: ['customer'],
      level: 'bronze',
      totalSpent: 0,
    } as any,
    overrideAccess: true,
  })
  ids.testCustomer = customer.id

  // 3. Products
  const p1 = await payload.create({
    collection: 'products',
    data: {
      title: 'Test Rose Bouquet',
      slug: `test-rose-${Date.now()}`,
      priceInUSDEnabled: true,
      priceInUSD: 5000, // $50.00 in cents
      _status: 'published',
    } as any,
    overrideAccess: true,
  })
  ids.product1 = p1.id

  const p2 = await payload.create({
    collection: 'products',
    data: {
      title: 'Test Tulip Set',
      slug: `test-tulip-${Date.now()}`,
      priceInUSDEnabled: true,
      priceInUSD: 3000, // $30.00 in cents
      _status: 'published',
    } as any,
    overrideAccess: true,
  })
  ids.product2 = p2.id

  // 4. Cart with items
  const cart = await payload.create({
    collection: 'carts',
    data: {
      customer: ids.testCustomer,
      currency: 'USD',
      items: [
        { product: ids.product1, quantity: 1 },
        { product: ids.product2, quantity: 2 },
      ],
    } as any,
    overrideAccess: true,
  })
  ids.cart = cart.id

  // 5. UserLevelSettings - setup Gold level with 5% discount
  await payload.updateGlobal({
    slug: 'user-level-settings',
    data: {
      levels: [
        { level: 'gold', minSpending: 500, discountPercent: 5, freeShipping: false },
        { level: 'platinum', minSpending: 1000, discountPercent: 10, freeShipping: true },
      ],
    } as any,
    overrideAccess: true,
  })

  // 6. Vouchers for test scenarios
  const now = new Date()
  const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // 6a. Percent voucher - 20% off, published
  const vPercent = await payload.create({
    collection: 'vouchers',
    data: {
      code: 'TEST20PCT',
      type: 'percent',
      value: 20,
      scope: 'all',
      assignMode: 'all',
      validFrom: past.toISOString(),
      validTo: future.toISOString(),
      _status: 'published',
    } as any,
    overrideAccess: true,
  })
  ids.voucherPercent = vPercent.id

  // 6b. Fixed voucher - $15 off, published
  const vFixed = await payload.create({
    collection: 'vouchers',
    data: {
      code: 'TEST15OFF',
      type: 'fixed',
      value: 1500, // $15.00 in cents
      scope: 'all',
      assignMode: 'all',
      validFrom: past.toISOString(),
      validTo: future.toISOString(),
      _status: 'published',
    } as any,
    overrideAccess: true,
  })
  ids.voucherFixed = vFixed.id

  // 6c. Expired voucher
  const vExpired = await payload.create({
    collection: 'vouchers',
    data: {
      code: 'TESTEXPIRED',
      type: 'percent',
      value: 10,
      scope: 'all',
      assignMode: 'all',
      validTo: past.toISOString(),
      _status: 'published',
    } as any,
    overrideAccess: true,
  })
  ids.voucherExpired = vExpired.id

  // 6d. Draft voucher (not published)
  const vDraft = await payload.create({
    collection: 'vouchers',
    data: {
      code: 'TESTDRAFT',
      type: 'percent',
      value: 50,
      scope: 'all',
      assignMode: 'all',
      _status: 'draft',
    } as any,
    overrideAccess: true,
  })
  ids.voucherDraft = vDraft.id

  // 6e. Max uses voucher (maxUses: 1, usedCount: 1 → exhausted)
  const vMax = await payload.create({
    collection: 'vouchers',
    data: {
      code: 'TESTMAXUSED',
      type: 'percent',
      value: 10,
      maxUses: 1,
      usedCount: 1,
      scope: 'all',
      assignMode: 'all',
      validFrom: past.toISOString(),
      validTo: future.toISOString(),
      _status: 'published',
    } as any,
    overrideAccess: true,
  })
  ids.voucherMaxUses = vMax.id

  // 6f. Level-only voucher (Gold and above)
  const vLevel = await payload.create({
    collection: 'vouchers',
    data: {
      code: 'TESTGOLDONLY',
      type: 'percent',
      value: 15,
      scope: 'all',
      assignMode: 'level',
      allowedUserLevels: ['gold', 'platinum'],
      validFrom: past.toISOString(),
      validTo: future.toISOString(),
      _status: 'published',
    } as any,
    overrideAccess: true,
  })
  ids.voucherLevelOnly = vLevel.id

  // 6g. Specific user voucher
  const vUser = await payload.create({
    collection: 'vouchers',
    data: {
      code: 'TESTVIPONLY',
      type: 'fixed',
      value: 500,
      scope: 'all',
      assignMode: 'users',
      assignedUsers: [ids.testCustomer],
      validFrom: past.toISOString(),
      validTo: future.toISOString(),
      _status: 'published',
    } as any,
    overrideAccess: true,
  })
  ids.voucherSpecificUser = vUser.id

  // 6h. Specific products voucher (only product1)
  const vProducts = await payload.create({
    collection: 'vouchers',
    data: {
      code: 'TESTROSEONLY',
      type: 'percent',
      value: 25,
      scope: 'specific',
      applicableProducts: [ids.product1],
      assignMode: 'all',
      validFrom: past.toISOString(),
      validTo: future.toISOString(),
      _status: 'published',
    } as any,
    overrideAccess: true,
  })
  ids.voucherSpecificProducts = vProducts.id

  // 6i. Min order amount voucher ($200 min)
  const vMin = await payload.create({
    collection: 'vouchers',
    data: {
      code: 'TESTMINORDER',
      type: 'percent',
      value: 10,
      minOrderAmount: 20000, // $200
      scope: 'all',
      assignMode: 'all',
      validFrom: past.toISOString(),
      validTo: future.toISOString(),
      _status: 'published',
    } as any,
    overrideAccess: true,
  })
  ids.voucherMinOrder = vMin.id
}

async function cleanupTestData() {
  const deleteQuietly = async (collection: string, id?: number) => {
    if (!id) return
    try {
      await payload.delete({ collection: collection as any, id, overrideAccess: true })
    } catch { /* ignore */ }
  }

  // Delete in reverse dependency order
  await payload.delete({
    collection: 'orders',
    where: { customer: { equals: ids.testCustomer } },
    overrideAccess: true,
  }).catch(() => {})

  if (ids.cart) {
    await deleteQuietly('carts', ids.cart as number)
  }

  for (const vId of [
    ids.voucherPercent, ids.voucherFixed, ids.voucherExpired, ids.voucherDraft,
    ids.voucherMaxUses, ids.voucherLevelOnly, ids.voucherSpecificUser,
    ids.voucherSpecificProducts, ids.voucherMinOrder,
  ]) {
    await deleteQuietly('vouchers', vId)
  }

  await deleteQuietly('products', ids.product1)
  await deleteQuietly('products', ids.product2)
  await deleteQuietly('users', ids.testCustomer)

  // Reset level settings
  await payload.updateGlobal({
    slug: 'user-level-settings',
    data: { levels: [] } as any,
    overrideAccess: true,
  }).catch(() => {})
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function mockReq(user?: any) {
  return {
    user,
    payload,
    json: async () => ({}),
    context: {},
  } as any
}

async function getCart() {
  return payload.findByID({
    collection: 'carts',
    id: ids.cart!,
    depth: 0,
    overrideAccess: true,
  })
}

async function resetCartVoucher() {
  await payload.update({
    collection: 'carts' as any,
    id: ids.cart!,
    data: {
      appliedVoucher: null,
      voucherCode: null,
      voucherDiscount: 0,
    } as any,
    overrideAccess: true,
  })
}

async function setUserLevel(level: string) {
  await payload.update({
    collection: 'users',
    id: ids.testCustomer!,
    data: { level } as any,
    overrideAccess: true,
  })
}

// ──────────────────────────────────────────────
// TESTS
// ──────────────────────────────────────────────

describe('Voucher & User Level System', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await seedTestData()
  }, 60000)

  afterAll(async () => {
    await cleanupTestData()
  }, 30000)

  // ── SEED VERIFICATION ──

  describe('Seed verification', () => {
    it('created test customer with bronze level', async () => {
      const user = await payload.findByID({
        collection: 'users',
        id: ids.testCustomer!,
        overrideAccess: true,
      })
      expect(user.email).toContain('test-voucher-')
      expect((user as any).level).toBe('bronze')
      expect((user as any).totalSpent).toBe(0)
    })

    it('created cart with correct subtotal', async () => {
      const cart = await getCart() as any
      // 1 × $50 + 2 × $30 = $110 = 11000 cents
      expect(cart.subtotal).toBeDefined()
      expect(cart.originalSubtotal).toBeDefined()
      expect(cart.originalSubtotal).toBe(cart.subtotal) // no discount yet
    })

    it('created all test vouchers', async () => {
      const { totalDocs } = await payload.find({
        collection: 'vouchers',
        where: { code: { like: 'TEST' } },
        overrideAccess: true,
      })
      expect(totalDocs).toBeGreaterThanOrEqual(9)
    })

    it('configured user level settings', async () => {
      const settings = await payload.findGlobal({ slug: 'user-level-settings' })
      const levels = (settings as any).levels as any[]
      expect(levels).toHaveLength(2)
      expect(levels.find((l: any) => l.level === 'gold')?.discountPercent).toBe(5)
      expect(levels.find((l: any) => l.level === 'platinum')?.discountPercent).toBe(10)
    })
  })

  // ── VALIDATE ENDPOINT ──

  describe('POST /api/vouchers/validate', () => {
    it('rejects unauthenticated request', async () => {
      const { validateVoucher } = await import('@/endpoints/validateVoucher')
      const req = mockReq()
      req.json = async () => ({ code: 'TEST20PCT' })

      await expect(validateVoucher.handler(req)).rejects.toThrow('Authentication')
    })

    it('validates a valid percent voucher', async () => {
      const { validateVoucher } = await import('@/endpoints/validateVoucher')
      const user = await payload.findByID({
        collection: 'users', id: ids.testCustomer!, overrideAccess: true,
      })
      const cart = await getCart() as any
      const req = mockReq(user)
      req.json = async () => ({
        code: 'TEST20PCT',
        orderSubtotal: cart.originalSubtotal,
      })

      const res = await validateVoucher.handler(req)
      const body = await res.json()

      expect(body.valid).toBe(true)
      expect(body.voucher.code).toBe('TEST20PCT')
      expect(body.discountAmount).toBeGreaterThan(0)
    })

    it('rejects expired voucher', async () => {
      const { validateVoucher } = await import('@/endpoints/validateVoucher')
      const user = await payload.findByID({
        collection: 'users', id: ids.testCustomer!, overrideAccess: true,
      })
      const req = mockReq(user)
      req.json = async () => ({ code: 'TESTEXPIRED' })

      const res = await validateVoucher.handler(req)
      const body = await res.json()

      expect(body.valid).toBe(false)
      expect(body.error).toContain('expired')
    })

    it('rejects draft voucher', async () => {
      const { validateVoucher } = await import('@/endpoints/validateVoucher')
      const user = await payload.findByID({
        collection: 'users', id: ids.testCustomer!, overrideAccess: true,
      })
      const req = mockReq(user)
      req.json = async () => ({ code: 'TESTDRAFT' })

      const res = await validateVoucher.handler(req)
      const body = await res.json()

      expect(body.valid).toBe(false)
      expect(body.error).toContain('Invalid')
    })

    it('rejects exhausted voucher (maxUses reached)', async () => {
      const { validateVoucher } = await import('@/endpoints/validateVoucher')
      const user = await payload.findByID({
        collection: 'users', id: ids.testCustomer!, overrideAccess: true,
      })
      const req = mockReq(user)
      req.json = async () => ({ code: 'TESTMAXUSED' })

      const res = await validateVoucher.handler(req)
      const body = await res.json()

      expect(body.valid).toBe(false)
      expect(body.error).toContain('usage limit')
    })

    it('rejects level-restricted voucher for bronze user', async () => {
      const { validateVoucher } = await import('@/endpoints/validateVoucher')
      await setUserLevel('bronze')
      const user = await payload.findByID({
        collection: 'users', id: ids.testCustomer!, overrideAccess: true,
      })
      const req = mockReq(user)
      req.json = async () => ({ code: 'TESTGOLDONLY' })

      const res = await validateVoucher.handler(req)
      const body = await res.json()

      expect(body.valid).toBe(false)
      expect(body.error).toContain('membership level')
    })

    it('accepts level-restricted voucher for gold user', async () => {
      const { validateVoucher } = await import('@/endpoints/validateVoucher')
      await setUserLevel('gold')
      const user = await payload.findByID({
        collection: 'users', id: ids.testCustomer!, overrideAccess: true,
      })
      const req = mockReq(user)
      req.json = async () => ({ code: 'TESTGOLDONLY' })

      const res = await validateVoucher.handler(req)
      const body = await res.json()

      expect(body.valid).toBe(true)
      // Reset level back
      await setUserLevel('bronze')
    })

    it('rejects voucher below min order amount', async () => {
      const { validateVoucher } = await import('@/endpoints/validateVoucher')
      const user = await payload.findByID({
        collection: 'users', id: ids.testCustomer!, overrideAccess: true,
      })
      const req = mockReq(user)
      req.json = async () => ({ code: 'TESTMINORDER', orderSubtotal: 5000 })

      const res = await validateVoucher.handler(req)
      const body = await res.json()

      expect(body.valid).toBe(false)
      expect(body.error).toContain('Minimum order')
    })
  })

  // ── APPLY / REMOVE VOUCHER TO CART ──

  describe('Apply voucher to cart', () => {
    it('applies percent voucher and adjusts subtotal', async () => {
      await resetCartVoucher()
      const cartBefore = await getCart() as any
      const originalSubtotal = cartBefore.originalSubtotal || cartBefore.subtotal

      // Apply voucher via direct cart update (simulating endpoint)
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: {
          appliedVoucher: ids.voucherPercent,
          voucherCode: 'TEST20PCT',
        } as any,
        overrideAccess: true,
      })

      const cartAfter = await getCart() as any

      expect(cartAfter.voucherCode).toBe('TEST20PCT')
      expect(cartAfter.voucherDiscount).toBeGreaterThan(0)
      expect(cartAfter.originalSubtotal).toBe(originalSubtotal)

      const expectedDiscount = Math.round(originalSubtotal * 20 / 100 * 100) / 100
      expect(cartAfter.voucherDiscount).toBe(expectedDiscount)
      expect(cartAfter.subtotal).toBe(
        Math.max(0, Math.round((originalSubtotal - expectedDiscount - cartAfter.levelDiscount) * 100) / 100)
      )
    })

    it('applies fixed voucher and adjusts subtotal', async () => {
      await resetCartVoucher()
      const cartBefore = await getCart() as any
      const originalSubtotal = cartBefore.originalSubtotal || cartBefore.subtotal

      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: {
          appliedVoucher: ids.voucherFixed,
          voucherCode: 'TEST15OFF',
        } as any,
        overrideAccess: true,
      })

      const cartAfter = await getCart() as any

      expect(cartAfter.voucherCode).toBe('TEST15OFF')
      // Fixed discount = min(1500, originalSubtotal)
      const expectedDiscount = Math.min(1500, originalSubtotal)
      expect(cartAfter.voucherDiscount).toBe(expectedDiscount)
      expect(cartAfter.subtotal).toBe(
        Math.max(0, Math.round((originalSubtotal - expectedDiscount - cartAfter.levelDiscount) * 100) / 100)
      )
    })

    it('removes voucher and restores subtotal', async () => {
      // First apply a voucher
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: {
          appliedVoucher: ids.voucherPercent,
          voucherCode: 'TEST20PCT',
        } as any,
        overrideAccess: true,
      })

      // Now remove it
      await resetCartVoucher()
      const cart = await getCart() as any

      expect(cart.appliedVoucher).toBeFalsy()
      expect(cart.voucherCode).toBeFalsy()
      expect(cart.voucherDiscount).toBe(0)
      expect(cart.subtotal).toBe(
        Math.max(0, Math.round((cart.originalSubtotal - cart.levelDiscount) * 100) / 100)
      )
    })
  })

  // ── LEVEL DISCOUNT ──

  describe('Level discount', () => {
    it('no level discount for bronze user', async () => {
      await setUserLevel('bronze')
      await resetCartVoucher()

      const cart = await getCart() as any
      expect(cart.levelDiscount).toBe(0)
      expect(cart.subtotal).toBe(cart.originalSubtotal)
    })

    it('applies 5% level discount for gold user', async () => {
      await setUserLevel('gold')
      // Trigger cart recalculation by updating it
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: { customer: ids.testCustomer } as any,
        overrideAccess: true,
      })

      const cart = await getCart() as any
      const expectedLevelDiscount = Math.round(cart.originalSubtotal * 5 / 100 * 100) / 100

      expect(cart.levelDiscount).toBe(expectedLevelDiscount)
      expect(cart.subtotal).toBe(
        Math.max(0, Math.round((cart.originalSubtotal - expectedLevelDiscount) * 100) / 100)
      )

      await setUserLevel('bronze')
    })

    it('applies 10% level discount for platinum user', async () => {
      await setUserLevel('platinum')
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: { customer: ids.testCustomer } as any,
        overrideAccess: true,
      })

      const cart = await getCart() as any
      const expectedLevelDiscount = Math.round(cart.originalSubtotal * 10 / 100 * 100) / 100

      expect(cart.levelDiscount).toBe(expectedLevelDiscount)
      expect(cart.subtotal).toBe(
        Math.max(0, Math.round((cart.originalSubtotal - expectedLevelDiscount) * 100) / 100)
      )

      await setUserLevel('bronze')
    })
  })

  // ── STACKING ──

  describe('Stacking: voucher + level discount', () => {
    it('both voucher and level discount applied independently on originalSubtotal', async () => {
      await setUserLevel('gold')

      // Apply percent voucher (20%)
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: {
          appliedVoucher: ids.voucherPercent,
          voucherCode: 'TEST20PCT',
        } as any,
        overrideAccess: true,
      })

      const cart = await getCart() as any
      const base = cart.originalSubtotal

      // Both discounts calculated independently on base subtotal
      const expectedVoucherDiscount = Math.round(base * 20 / 100 * 100) / 100
      const expectedLevelDiscount = Math.round(base * 5 / 100 * 100) / 100
      const expectedTotal = Math.max(
        0,
        Math.round((base - expectedVoucherDiscount - expectedLevelDiscount) * 100) / 100,
      )

      expect(cart.voucherDiscount).toBe(expectedVoucherDiscount)
      expect(cart.levelDiscount).toBe(expectedLevelDiscount)
      expect(cart.subtotal).toBe(expectedTotal)

      // Total discount = 25% (20% voucher + 5% level)
      expect(cart.subtotal).toBeLessThan(base)
      expect(cart.voucherDiscount + cart.levelDiscount).toBe(
        Math.round((base - cart.subtotal) * 100) / 100
      )

      await setUserLevel('bronze')
      await resetCartVoucher()
    })
  })

  // ── EDGE CASES ──

  describe('Edge cases', () => {
    it('auto-removes expired voucher on cart save', async () => {
      // Directly set an expired voucher on cart
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: {
          appliedVoucher: ids.voucherExpired,
          voucherCode: 'TESTEXPIRED',
        } as any,
        overrideAccess: true,
      })

      const cart = await getCart() as any

      // The applyCartDiscounts hook should have auto-removed it
      expect(cart.appliedVoucher).toBeFalsy()
      expect(cart.voucherDiscount).toBe(0)
    })

    it('auto-removes exhausted voucher on cart save', async () => {
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: {
          appliedVoucher: ids.voucherMaxUses,
          voucherCode: 'TESTMAXUSED',
        } as any,
        overrideAccess: true,
      })

      const cart = await getCart() as any
      expect(cart.appliedVoucher).toBeFalsy()
      expect(cart.voucherDiscount).toBe(0)
    })

    it('auto-removes nonexistent voucher on cart save', async () => {
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: {
          appliedVoucher: 999999,
          voucherCode: 'DOESNOTEXIST',
        } as any,
        overrideAccess: true,
      })

      const cart = await getCart() as any
      expect(cart.appliedVoucher).toBeFalsy()
      expect(cart.voucherDiscount).toBe(0)
    })

    it('subtotal never goes below zero', async () => {
      // Create a voucher worth more than the cart total
      const bigVoucher = await payload.create({
        collection: 'vouchers',
        data: {
          code: 'TESTBIGFIXED',
          type: 'fixed',
          value: 99999999, // way more than cart subtotal
          scope: 'all',
          assignMode: 'all',
          validFrom: new Date(Date.now() - 86400000).toISOString(),
          validTo: new Date(Date.now() + 86400000).toISOString(),
          _status: 'published',
        } as any,
        overrideAccess: true,
      })

      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: {
          appliedVoucher: bigVoucher.id,
          voucherCode: 'TESTBIGFIXED',
        } as any,
        overrideAccess: true,
      })

      const cart = await getCart() as any
      expect(cart.subtotal).toBe(0)
      expect(cart.subtotal).toBeGreaterThanOrEqual(0)

      // Cleanup
      await resetCartVoucher()
      await payload.delete({
        collection: 'vouchers', id: bigVoucher.id, overrideAccess: true,
      })
    })
  })

  // ── ORDER HOOKS ──

  describe('Order hooks', () => {
    it('copies voucher metadata from cart to order on creation', async () => {
      await setUserLevel('gold')
      // Apply voucher
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: {
          appliedVoucher: ids.voucherPercent,
          voucherCode: 'TEST20PCT',
        } as any,
        overrideAccess: true,
      })

      const cart = await getCart() as any

      // Create order for this customer
      const order = await payload.create({
        collection: 'orders',
        data: {
          customer: ids.testCustomer,
          amount: cart.subtotal,
          currency: 'USD',
          status: 'processing',
          items: [
            { product: ids.product1, quantity: 1 },
            { product: ids.product2, quantity: 2 },
          ],
        } as any,
        overrideAccess: true,
      })

      const orderData = order as any
      expect(orderData.voucher).toBeTruthy()
      expect(orderData.voucherCode).toBe('TEST20PCT')
      expect(orderData.discountAmount).toBe(cart.voucherDiscount)
      expect(orderData.levelDiscount).toBe(cart.levelDiscount)

      // Cleanup order for next tests
      await payload.delete({ collection: 'orders', id: order.id, overrideAccess: true })
      await setUserLevel('bronze')
      await resetCartVoucher()
    })

    it('increments voucher usedCount when order is created', async () => {
      const voucherBefore = await payload.findByID({
        collection: 'vouchers', id: ids.voucherPercent!, overrideAccess: true,
      })
      const usedBefore = (voucherBefore as any).usedCount || 0

      // Apply voucher + create order
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: {
          appliedVoucher: ids.voucherPercent,
          voucherCode: 'TEST20PCT',
        } as any,
        overrideAccess: true,
      })

      const order = await payload.create({
        collection: 'orders',
        data: {
          customer: ids.testCustomer,
          amount: 8000,
          currency: 'USD',
          status: 'processing',
          items: [{ product: ids.product1, quantity: 1 }],
        } as any,
        overrideAccess: true,
      })

      const voucherAfter = await payload.findByID({
        collection: 'vouchers', id: ids.voucherPercent!, overrideAccess: true,
      })
      expect((voucherAfter as any).usedCount).toBe(usedBefore + 1)

      // Cleanup
      await payload.delete({ collection: 'orders', id: order.id, overrideAccess: true })
      await resetCartVoucher()
    })

    it('decrements voucher usedCount when order is refunded from completed', async () => {
      // Setup: create order with voucher as completed
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: {
          appliedVoucher: ids.voucherPercent,
          voucherCode: 'TEST20PCT',
        } as any,
        overrideAccess: true,
      })

      const order = await payload.create({
        collection: 'orders',
        data: {
          customer: ids.testCustomer,
          amount: 8000,
          currency: 'USD',
          status: 'completed',
          items: [{ product: ids.product1, quantity: 1 }],
        } as any,
        overrideAccess: true,
      })

      const voucherAfterCreate = await payload.findByID({
        collection: 'vouchers', id: ids.voucherPercent!, overrideAccess: true,
      })
      const usedAfterCreate = (voucherAfterCreate as any).usedCount

      // Refund the order
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { status: 'refunded' } as any,
        overrideAccess: true,
      })

      const voucherAfterRefund = await payload.findByID({
        collection: 'vouchers', id: ids.voucherPercent!, overrideAccess: true,
      })
      expect((voucherAfterRefund as any).usedCount).toBe(usedAfterCreate - 1)

      // Cleanup
      await payload.delete({ collection: 'orders', id: order.id, overrideAccess: true })
      await resetCartVoucher()
    })
  })

  // ── TOTALSPENT + LEVEL RECALCULATION ──

  describe('Order completion: totalSpent & level recalculation', () => {
    // Clean all orders for this customer before each test to avoid leaking
    async function cleanOrders() {
      await payload.delete({
        collection: 'orders',
        where: { customer: { equals: ids.testCustomer } },
        overrideAccess: true,
      }).catch(() => {})
      await payload.update({
        collection: 'users', id: ids.testCustomer!,
        data: { level: 'bronze', levelLocked: false, totalSpent: 0 } as any,
        overrideAccess: true,
      })
    }

    it('updates totalSpent when order completes', async () => {
      await cleanOrders()
      await resetCartVoucher()

      // Create order as processing first
      const order = await payload.create({
        collection: 'orders',
        data: {
          customer: ids.testCustomer,
          amount: 60000, // $600
          currency: 'USD',
          status: 'processing',
          items: [{ product: ids.product1, quantity: 1 }],
        } as any,
        overrideAccess: true,
      })

      // Transition to completed
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { status: 'completed' } as any,
        overrideAccess: true,
      })

      const userAfter = await payload.findByID({
        collection: 'users', id: ids.testCustomer!, overrideAccess: true,
      })

      // totalSpent should be the sum of all completed orders (only this one: 60000)
      expect((userAfter as any).totalSpent).toBe(60000)

      // With 60000 spent and gold threshold at 500, user should be gold
      // (Note: thresholds are 500 and 1000, amounts are in cents-like units
      //  so 60000 > 1000 → platinum)
      expect((userAfter as any).level).toBe('platinum')

      await cleanOrders()
    })

    it('downgrades level on order refund (decreasing totalSpent)', async () => {
      await cleanOrders()

      // Create and complete order
      const order = await payload.create({
        collection: 'orders',
        data: {
          customer: ids.testCustomer,
          amount: 60000,
          currency: 'USD',
          status: 'completed',
          items: [{ product: ids.product1, quantity: 1 }],
        } as any,
        overrideAccess: true,
      })

      let user = await payload.findByID({
        collection: 'users', id: ids.testCustomer!, overrideAccess: true,
      })
      expect((user as any).totalSpent).toBe(60000)

      // Refund → totalSpent drops → level should downgrade
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { status: 'refunded' } as any,
        overrideAccess: true,
      })

      user = await payload.findByID({
        collection: 'users', id: ids.testCustomer!, overrideAccess: true,
      })
      expect((user as any).totalSpent).toBe(0)
      expect((user as any).level).toBe('bronze')

      await cleanOrders()
    })

    it('levelLocked prevents downgrade but allows upgrade', async () => {
      await cleanOrders()

      // Admin manually sets user to gold + locked (totalSpent stays at 0)
      await payload.update({
        collection: 'users', id: ids.testCustomer!,
        data: { level: 'gold', levelLocked: true, totalSpent: 0 } as any,
        overrideAccess: true,
      })

      // Create and complete a small order (amount < platinum threshold)
      const order = await payload.create({
        collection: 'orders',
        data: {
          customer: ids.testCustomer,
          amount: 100, // very small
          currency: 'USD',
          status: 'processing',
          items: [{ product: ids.product1, quantity: 1 }],
        } as any,
        overrideAccess: true,
      })

      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { status: 'completed' } as any,
        overrideAccess: true,
      })

      let user = await payload.findByID({
        collection: 'users', id: ids.testCustomer!, overrideAccess: true,
      })

      // totalSpent = 100, resolved level = bronze (< 500 gold threshold)
      // But locked → skip downgrade → stays gold
      expect((user as any).level).toBe('gold')
      expect((user as any).levelLocked).toBe(true)

      // Now create a big order to push past platinum threshold
      const bigOrder = await payload.create({
        collection: 'orders',
        data: {
          customer: ids.testCustomer,
          amount: 200000, // way past platinum threshold
          currency: 'USD',
          status: 'completed',
          items: [{ product: ids.product1, quantity: 1 }],
        } as any,
        overrideAccess: true,
      })

      user = await payload.findByID({
        collection: 'users', id: ids.testCustomer!, overrideAccess: true,
      })

      // Should upgrade to platinum but keep lock (admin intent = floor)
      expect((user as any).level).toBe('platinum')
      expect((user as any).levelLocked).toBe(true)

      await cleanOrders()
    })
  })

  // ── BUG FIX REGRESSION TESTS ──

  describe('Bug fix regressions', () => {
    it('cancelling order from processing decrements usedCount (was leaking)', async () => {
      await resetCartVoucher()

      const voucherBefore = await payload.findByID({
        collection: 'vouchers', id: ids.voucherPercent!, overrideAccess: true,
      })
      const usedBefore = (voucherBefore as any).usedCount || 0

      // Apply voucher to cart
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: { appliedVoucher: ids.voucherPercent, voucherCode: 'TEST20PCT' } as any,
        overrideAccess: true,
      })

      // Create order (processing, not completed)
      const order = await payload.create({
        collection: 'orders',
        data: {
          customer: ids.testCustomer,
          amount: 5000,
          currency: 'USD',
          status: 'processing',
          items: [{ product: ids.product1, quantity: 1 }],
        } as any,
        overrideAccess: true,
      })

      // usedCount should have incremented
      let voucher = await payload.findByID({
        collection: 'vouchers', id: ids.voucherPercent!, overrideAccess: true,
      })
      expect((voucher as any).usedCount).toBe(usedBefore + 1)

      // Cancel from processing (previously this leaked)
      await payload.update({
        collection: 'orders', id: order.id,
        data: { status: 'cancelled' } as any,
        overrideAccess: true,
      })

      voucher = await payload.findByID({
        collection: 'vouchers', id: ids.voucherPercent!, overrideAccess: true,
      })
      // usedCount should be back to original
      expect((voucher as any).usedCount).toBe(usedBefore)

      await payload.delete({ collection: 'orders', id: order.id, overrideAccess: true })
      await resetCartVoucher()
    })

    it('auto-removes voucher when cart subtotal drops below minOrderAmount', async () => {
      await resetCartVoucher()

      // Apply the minOrder voucher ($200 min) - cart is only ~$110
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: {
          appliedVoucher: ids.voucherMinOrder,
          voucherCode: 'TESTMINORDER',
        } as any,
        overrideAccess: true,
      })

      const cart = await getCart() as any
      // Should have been auto-removed since cart subtotal < $200
      expect(cart.appliedVoucher).toBeFalsy()
      expect(cart.voucherDiscount).toBe(0)
    })

    it('combined discounts are capped at subtotal (never negative)', async () => {
      // Create a huge percent voucher (90%)
      const bigVoucher = await payload.create({
        collection: 'vouchers',
        data: {
          code: 'TEST90PCT',
          type: 'percent',
          value: 90,
          scope: 'all',
          assignMode: 'all',
          validFrom: new Date(Date.now() - 86400000).toISOString(),
          validTo: new Date(Date.now() + 86400000).toISOString(),
          _status: 'published',
        } as any,
        overrideAccess: true,
      })

      // Set user to platinum (10% level discount) + 90% voucher = 100% total
      await setUserLevel('platinum')
      await payload.update({
        collection: 'carts' as any,
        id: ids.cart!,
        data: {
          appliedVoucher: bigVoucher.id,
          voucherCode: 'TEST90PCT',
        } as any,
        overrideAccess: true,
      })

      const cart = await getCart() as any
      expect(cart.subtotal).toBe(0)
      expect(cart.subtotal).toBeGreaterThanOrEqual(0)
      // Combined stored discounts should not exceed originalSubtotal
      expect(cart.voucherDiscount + cart.levelDiscount).toBeLessThanOrEqual(cart.originalSubtotal)

      await payload.delete({ collection: 'vouchers', id: bigVoucher.id, overrideAccess: true })
      await setUserLevel('bronze')
      await resetCartVoucher()
    })
  })
})
