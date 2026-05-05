import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'


const buttonVariants = cva(
  
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium text-sm leading-none',
    'rounded-[10px] border border-transparent',
    'transition-all duration-150 ease-out',
    'cursor-pointer select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5ef6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.97]',
  ],
  {
    variants: {
      variant: {
        
        primary: [
          'bg-[#7c5ef6] text-white',
          'hover:bg-[#6b3eee]',
          'shadow-[0_0_24px_rgba(124,94,246,0.25)]',
          'hover:shadow-[0_0_32px_rgba(124,94,246,0.4)]',
        ],
        
        secondary: [
          'bg-[#1c1c28] text-[#f0efff]',
          'border-[rgba(255,255,255,0.06)]',
          'hover:bg-[#242432] hover:border-[rgba(255,255,255,0.12)]',
        ],
      
        ghost: [
          'bg-transparent text-[#a8a4c8]',
          'hover:bg-[#1c1c28] hover:text-[#f0efff]',
        ],
       
        danger: [
          'bg-transparent text-[#f87171]',
          'border-[rgba(248,113,113,0.2)]',
          'hover:bg-[rgba(248,113,113,0.08)] hover:border-[rgba(248,113,113,0.4)]',
        ],
        // Gradient — hero / onboarding
        gradient: [
          'text-white',
          'bg-gradient-to-r from-[#7c5ef6] via-[#38bdf8] to-[#34d399]',
          'bg-[length:200%_100%] bg-left',
          'hover:bg-right',
          'transition-[background-position,box-shadow] duration-300',
          'shadow-[0_0_32px_rgba(124,94,246,0.3)]',
        ],
      },
      size: {
        sm:   'h-8  px-3  text-xs',
        md:   'h-10 px-4  text-sm',
        lg:   'h-12 px-6  text-base',
        icon: 'h-9  w-9   text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  },
)

Button.displayName = 'Button'

export { Button, buttonVariants }