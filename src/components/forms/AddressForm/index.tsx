'use client'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { Address, Config } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { deepMergeSimple } from 'payload/shared'
import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'

type AddressFormValues = {
  fullName?: string | null
  addressLine1?: string | null
  phone?: string | null
}

type Props = {
  addressID?: Config['db']['defaultIDType']
  initialData?: Omit<Address, 'country' | 'id' | 'updatedAt' | 'createdAt'> & { country?: string }
  callbackAction?: (data: Partial<Address>) => void
  /**
   * If true, the form will not submit to the API.
   */
  skipSubmission?: boolean
}

export const AddressForm: React.FC<Props> = ({
  addressID,
  initialData,
  callbackAction,
  skipSubmission,
}) => {
  const { user } = useAuth()
  const userId = user?.id
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormValues>({
    defaultValues: {
      fullName:
        `${initialData?.firstName ?? ''} ${initialData?.lastName ?? ''}`.trim() || undefined,
      phone: initialData?.phone ?? undefined,
      addressLine1: initialData?.addressLine1 ?? undefined,
    },
  })

  const { createAddress, updateAddress } = useAddresses()

  const prefillKey = useMemo(() => {
    const full = `${initialData?.firstName ?? ''} ${initialData?.lastName ?? ''}`.trim()
    return [
      full,
      initialData?.phone ?? '',
      initialData?.addressLine1 ?? '',
      (initialData as any)?.title ?? '',
    ].join('|')
  }, [initialData])

  const formRef = useRef<HTMLFormElement | null>(null)

  // Auto-focus the next field based on what was prefilled from checkout.
  // Order: fullName -> phone -> address
  useEffect(() => {
    const fullNamePrefilled =
      `${initialData?.firstName ?? ''} ${initialData?.lastName ?? ''}`.trim().length > 0
    const phonePrefilled = Boolean((initialData as any)?.phone)

    const nextId = fullNamePrefilled ? (phonePrefilled ? 'addressLine1' : 'phone') : 'fullName'

    // Avoid duplicate IDs with the checkout page (we scope the query to this modal form).
    const selector =
      nextId === 'fullName'
        ? '#addressFullName'
        : nextId === 'phone'
          ? '#addressPhone'
          : '#addressLine1'

    const el = formRef.current?.querySelector<HTMLInputElement>(selector) ?? null
    if (!el) return

    // Dialog content may mount a tick after initial render; retry once shortly.
    const t = window.setTimeout(() => {
      el.focus()
    }, 50)

    return () => window.clearTimeout(t)
  }, [prefillKey, initialData])

  const onSubmit = useCallback(
    async (data: AddressFormValues) => {
      const fullName = (data.fullName || '').trim()
      const parts = fullName.split(/\s+/).filter(Boolean)
      const firstName = parts[0] || ''
      const lastName = parts.slice(1).join(' ')

      const newData = deepMergeSimple(initialData || {}, {
        // Hardcode title used by the underlying ecommerce address schema.
        // This prevents old/typo'd values from persisting (e.g. "Hone").
        title: 'Mr/Ms',
        firstName,
        lastName,
        phone: data.phone ?? (initialData as any)?.phone,
        addressLine1: data.addressLine1 ?? (initialData as any)?.addressLine1,

        // These are required by the underlying address schema, but we hide them from UI.
        city: (initialData as any)?.city ?? 'N/A',
        state: (initialData as any)?.state ?? 'N/A',
        postalCode: (initialData as any)?.postalCode ?? '00000',
        country: (initialData as any)?.country ?? 'VN',
      })

      // Ensure the address is owned by the logged-in user.
      // The Checkout UI filters addresses by `address.customer`.
      if (userId && (newData as any).customer == null) {
        ;(newData as any).customer = userId
      }

      if (!skipSubmission) {
        if (addressID) {
          await updateAddress(addressID, newData)
        } else {
          await createAddress(newData)
        }
      }

      if (callbackAction) {
        callbackAction(newData)
      }
    },
    [initialData, skipSubmission, callbackAction, addressID, updateAddress, createAddress, userId],
  )

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-4 mb-8">
        <FormItem>
          <Label htmlFor="addressFullName" className="text-[13px] font-semibold text-[#1A1A1C]">
            Full Name *
          </Label>
          <Input
            id="addressFullName"
            autoComplete="name"
            className="h-12 px-4 border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md"
            {...register('fullName', { required: 'Full name is required.' })}
          />
          {errors.fullName && <FormError message={errors.fullName.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="addressPhone" className="text-[13px] font-semibold text-[#1A1A1C]">
            Phone Number *
          </Label>
          <Input
            type="tel"
            id="addressPhone"
            autoComplete="mobile tel"
            className="h-12 px-4 border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md"
            {...register('phone')}
          />
          {errors.phone && <FormError message={errors.phone.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="addressLine1" className="text-[13px] font-semibold text-[#1A1A1C]">
            Address *
          </Label>
          <Input
            id="addressLine1"
            autoComplete="address-line1"
            className="h-12 px-4 border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md"
            {...register('addressLine1', { required: 'Address line 1 is required.' })}
          />
          {errors.addressLine1 && <FormError message={errors.addressLine1.message} />}
        </FormItem>
      </div>

      <Button type="submit" className="w-full">
        Submit
      </Button>
    </form>
  )
}
