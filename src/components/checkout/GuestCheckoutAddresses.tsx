'use client'

import React from 'react'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { Address } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { Check, Plus } from 'lucide-react'

type GuestAddress = Partial<Address> & { __guestId: string }

type Props = {
  addresses: GuestAddress[]
  selectedAddressId: string | null
  initialData?: {
    firstName: string
    lastName: string
    phone: string
  }
  onSelectAddress: (address: GuestAddress) => void
  onAddAddress: (data: Partial<Address>) => void
}

export const GuestCheckoutAddresses: React.FC<Props> = ({
  addresses,
  selectedAddressId,
  initialData,
  onSelectAddress,
  onAddAddress,
}) => {
  const current = addresses.find((a) => a.__guestId === selectedAddressId) ?? addresses[0] ?? null

  const hasCurrentAddress = Boolean(current)
  const actionLabel = hasCurrentAddress ? 'Edit address' : 'Add address'

  return (
    <div className="space-y-4">
      {/* Address Cards */}
      <div className="space-y-3">
        {!current ? (
          <div className="p-8 border border-dashed border-border text-center space-y-4">
            <p className="text-sm text-muted-foreground">Add an address to continue checkout.</p>
          </div>
        ) : (
          (() => {
            const address = current
            const isSelected = address.__guestId === selectedAddressId

            const title =
              address.title ||
              (address.firstName || address.lastName
                ? `${address.firstName ?? ''} ${address.lastName ?? ''}`.trim()
                : 'Mr/Ms')

            return (
              <div
                onClick={() => onSelectAddress(address)}
                className={cn(
                  'flex items-start gap-5 p-5 border cursor-pointer transition-all bg-white',
                  isSelected ? 'border-primary bg-white' : 'border-border hover:border-primary/50',
                )}
              >
                {/* Selection Indicator */}
                <div
                  className={cn(
                    'w-5 h-5 shrink-0 flex items-center justify-center mt-0.5',
                    isSelected ? 'bg-primary' : 'border border-border',
                  )}
                >
                  {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>

                {/* Address Info */}
                <div className="flex-1 space-y-1">
                  <p className="text-[15px] font-bold text-foreground">
                    {(address.firstName || address.lastName) &&
                      `${address.firstName ?? ''} ${address.lastName ?? ''}`.trim()}
                    {!address.firstName && !address.lastName ? title || 'Mr/Ms' : null}
                  </p>
                  {address.phone && (
                    <p className="text-[13px] text-muted-foreground">{address.phone}</p>
                  )}
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    {[address.addressLine1, address.addressLine2].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )
          })()
        )}
      </div>

      {/* Edit Address Button */}
      <CreateAddressModal
        callback={(address) => {
          onAddAddress(address)
        }}
        buttonText={actionLabel}
        modalTitle={actionLabel}
        skipSubmission
        trigger={
          <button className="w-full flex items-center justify-center gap-3 p-4 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            <Plus size={18} />
            <span className="text-sm font-semibold">{actionLabel}</span>
          </button>
        }
        initialData={{
          // Prefill all address fields from the selected guest address.
          // For "add first address" case (no current address yet), fall back to checkout full name/phone.
          title: 'Mr/Ms',
          firstName: (current?.firstName ?? initialData?.firstName) || '',
          lastName: (current?.lastName ?? initialData?.lastName) || '',
          phone: (current?.phone ?? initialData?.phone) || '',
          addressLine1: current?.addressLine1 || '',
          addressLine2: current?.addressLine2,
          city: current?.city,
          state: current?.state,
          postalCode: current?.postalCode,
          country: current?.country,
        }}
      />
    </div>
  )
}
