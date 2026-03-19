import * as React from 'react'

import { cn } from '@/utilities/cn'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full p-4 bg-background border border-input text-sm text-foreground placeholder:text-placeholder focus:border-primary outline-none focus:ring-0 focus-visible:ring-0 rounded-none transition-colors resize-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
