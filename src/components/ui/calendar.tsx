'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DayButtonProps } from 'react-day-picker'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/utilities/cn'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'relative flex flex-col gap-y-4 sm:flex-row sm:gap-y-0',
        month: 'relative flex flex-col gap-y-4 rounded-md',
        month_caption: 'relative flex items-center justify-center pt-1 px-10 mb-2',
        caption_label: 'text-sm font-semibold truncate text-[#1A1A1C]',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'absolute left-0 z-10 size-8 bg-transparent p-0 border-[#F0F0F2] hover:bg-accent hover:border-[#6E9E6E] hover:text-[#6E9E6E] opacity-70 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'absolute right-0 z-10 size-8 bg-transparent p-0 border-[#F0F0F2] hover:bg-accent hover:border-[#6E9E6E] hover:text-[#6E9E6E] opacity-70 hover:opacity-100',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex mb-1',
        weekday: 'text-[#6E6E70] w-9 rounded-md font-medium text-[13px]',
        week: 'flex w-full mt-1',
        day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-transparent',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-9 p-0 font-normal transition-colors text-[#1A1A1C]! hover:bg-[#6E9E6E]/10 hover:text-[#6E9E6E]! rounded-none',
        ),
        range_start: 'day-range-start',
        range_end: 'day-range-end',
        selected: 'bg-[#6E9E6E]! text-white! opacity-100! hover:bg-[#6E9E6E]! hover:text-white! focus:bg-[#6E9E6E]! focus:text-white! active:bg-[#6E9E6E]! active:text-white!',
        today: 'border border-[#6E9E6E] text-[#6E9E6E]! font-bold',
        outside: 'day-outside text-[#6E6E70]/40 opacity-50 aria-selected:bg-accent/50',
        disabled: 'text-[#6E6E70]/30 opacity-30 cursor-not-allowed',
        range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
          return <Icon className="size-4" />
        },
        DayButton: ({ className, ...props }: DayButtonProps) => {
          const { modifiers } = props
          return (
            <button
              className={cn(
                className,
                modifiers.today && 'border border-[#6E9E6E] text-[#6E9E6E]!',
                modifiers.selected && 'bg-[#6E9E6E]! text-white! border-none! hover:bg-[#6E9E6E]! hover:text-white!'
              )}
              {...props}
            />
          )
        }
      }}
      {...props}
    />
  )
}

export { Calendar }
