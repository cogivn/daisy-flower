import * as React from 'react'

import { cn } from '@/utilities/cn'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex w-full min-w-0 h-12 bg-background px-4 border border-input text-sm text-foreground placeholder:text-placeholder focus:border-primary outline-none focus:ring-0 focus-visible:ring-0 rounded-none transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
