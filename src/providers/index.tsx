import { AuthProvider } from '@/providers/Auth'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import { stripeAdapterClient } from '@payloadcms/plugin-ecommerce/payments/stripe'
import React from 'react'

import { HeaderThemeProvider } from '@/providers/HeaderTheme'
import { SonnerProvider } from '@/providers/Sonner'
import { ThemeProvider } from '@/providers/Theme'
import { WishlistProvider } from '@/providers/Wishlist'
import { payosAdapterClient } from '@/payments/payos'
import { codAdapterClient } from '@/payments/cod'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WishlistProvider>
          <HeaderThemeProvider>
            <SonnerProvider />
            <EcommerceProvider
              enableVariants={true}
              currenciesConfig={{
                defaultCurrency: 'VND',
                supportedCurrencies: [
                  {
                    code: 'VND',
                    decimals: 0,
                    label: 'Vietnamese Dong',
                    symbol: '₫',
                  },
                ],
              }}
              api={{
                cartsFetchQuery: {
                  depth: 2,
                  // Ensure guest checkout can still show tax/exclusive-inclusive totals
                  // by fetching tax fields into `cart` client state.
                  select: {
                    items: true,
                    subtotal: true,
                    originalSubtotal: true,
                    voucherCode: true,
                    voucherDiscount: true,
                    levelDiscount: true,
                    taxAmount: true,
                    taxRates: true,
                  },
                  populate: {
                    products: {
                      slug: true,
                      title: true,
                      gallery: true,
                      inventory: true,
                    },
                    variants: {
                      title: true,
                      inventory: true,
                    },
                  },
                },
              }}
              paymentMethods={[
                payosAdapterClient({ label: 'PayOS' }),
                stripeAdapterClient({
                  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
                }),
                codAdapterClient({ label: 'Cash on Delivery (COD)' }),
              ]}
            >
              {children}
            </EcommerceProvider>
          </HeaderThemeProvider>
        </WishlistProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
