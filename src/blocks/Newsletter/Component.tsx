'use client'

import { RichText } from '@/components/RichText'
import { getClientSideURL } from '@/utilities/getURL'
import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'
import type { DefaultDocumentIDType } from 'payload'
import React, { useCallback, useState } from 'react'

export type NewsletterBlockProps = {
  blockName?: string | null
  blockType: 'newsletter'
  title: string
  description?: string | null
  form: FormType | number
  id?: DefaultDocumentIDType
}

export const NewsletterBlock: React.FC<NewsletterBlockProps> = (props) => {
  const { title, description, form: formFromProps } = props

  if (!formFromProps) return null

  const formID = typeof formFromProps === 'number' ? formFromProps : formFromProps.id
  const confirmationMessage =
    typeof formFromProps === 'number' ? undefined : formFromProps.confirmationMessage
  const confirmationType =
    typeof formFromProps === 'number' ? 'message' : formFromProps.confirmationType
  const submitButtonLabel =
    typeof formFromProps === 'number' ? 'Subscribe' : formFromProps.submitButtonLabel || 'Subscribe'

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [alreadySubscribed, setAlreadySubscribed] = useState(false)
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!email) return

      setError(undefined)

      const loadingTimer = setTimeout(() => setIsLoading(true), 300)

      fetch(`${getClientSideURL()}/api/form-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: formID,
          submissionData: [
            {
              field: 'email',
              value: email,
            },
          ],
        }),
      })
        .then(async (res) => {
          const json = await res.json().catch(() => ({} as any))
          clearTimeout(loadingTimer)
          setIsLoading(false)

          const apiMessage = (json as any)?.message as string | undefined

          if (!res.ok) {
            // Duplicate newsletter subscription signalled by the backend
            if (apiMessage === 'newsletter-already-subscribed' || res.status === 409) {
              setError(undefined)
              setAlreadySubscribed(true)
              setHasSubmitted(true)
              return
            }

            const validationMessage = (json as any)?.errors?.[0]?.message as string | undefined
            setError({
              message: validationMessage || apiMessage || 'Something went wrong.',
              status: String((json as any)?.status || res.status),
            })
            return
          }

          setAlreadySubscribed(false)
          setHasSubmitted(true)
        })
        .catch(() => {
          clearTimeout(loadingTimer)
          setIsLoading(false)
          setError({ message: 'Something went wrong.' })
        })
    },
    [email, formID],
  )

  return (
    <div className="bg-neutral-100 py-16 border-t">
      <div className="container flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="max-w-xl">
          <h3 className="text-3xl font-bold mb-3 uppercase tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground text-lg">
              {description}
            </p>
          )}
        </div>
        <div className="w-full max-w-lg">
          {hasSubmitted ? (
            alreadySubscribed ? (
              <p className="text-muted-foreground text-sm">
                You’re already subscribed with this email. We’ve kept your preferences.
              </p>
            ) : confirmationType === 'message' && confirmationMessage ? (
              <RichText data={confirmationMessage} />
            ) : (
              <p className="text-muted-foreground text-sm">
                Thanks for subscribing! We’ve recorded your email.
              </p>
            )
          ) : (
            <>
              {error && (
                <p className="text-destructive text-sm mb-4">
                  {error.message}
                </p>
              )}
              <form
                className="flex shadow-sm border-2 border-primary/20 bg-white"
                onSubmit={onSubmit}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Your email address..."
                  className="grow px-6 py-5 rounded-none border-none outline-none focus:outline-none focus:ring-0 focus:border-none text-black bg-white"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary text-white px-10 py-5 font-bold hover:bg-foreground transition-all duration-300 uppercase tracking-widest text-xs shrink-0 disabled:opacity-70"
                >
                  {isLoading ? '...' : submitButtonLabel}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
