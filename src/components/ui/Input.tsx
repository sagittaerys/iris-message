import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  prefixIcon?: React.ReactNode
  suffixIcon?: React.ReactNode
  containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      hint,
      prefixIcon,
      suffixIcon,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const hasError = Boolean(error)

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[#a8a4c8] tracking-wide uppercase"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {prefixIcon && (
            <div className="absolute left-3 flex items-center text-[#6b6785] pointer-events-none">
              {prefixIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // layout
              'w-full h-11 rounded-[10px]',
              'px-4 py-2.5',
              // typography
              'text-sm text-[#f0efff] placeholder:text-[#3d3a52]',
              // background & border
              'bg-[#1c1c28]',
              'border border-[rgba(255,255,255,0.06)]',
              // transitions
              'transition-all duration-150',
              // focus
              'focus:outline-none focus:border-[rgba(124,94,246,0.5)] focus:shadow-[0_0_0_3px_rgba(124,94,246,0.12)]',
              // error state
              hasError && 'border-[rgba(248,113,113,0.4)] focus:border-[rgba(248,113,113,0.6)] focus:shadow-[0_0_0_3px_rgba(248,113,113,0.1)]',
              // disabled
              'disabled:opacity-40 disabled:cursor-not-allowed',
              // icon padding adjustments
              prefixIcon && 'pl-10',
              suffixIcon && 'pr-10',
              className,
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />

          {suffixIcon && (
            <div className="absolute right-3 flex items-center text-[#6b6785]">
              {suffixIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-[#f87171] flex items-center gap-1.5 animate-fade-in"
          >
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[#6b6785]">
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input }