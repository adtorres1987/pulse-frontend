import React, { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  variant?: 'default' | 'auth'
}

export function Input({ label, error, className = '', id, variant = 'default', ...props }: InputProps) {
  const base =
    variant === 'auth'
      ? `w-full px-4 py-3 rounded-xl border bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition ${error ? 'border-red-400' : 'border-gray-200'} ${className}`
      : `border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} ${className}`

  const labelCls =
    variant === 'auth'
      ? 'block text-sm font-medium text-gray-700 mb-1.5'
      : 'text-sm font-medium text-gray-700'

  const errorCls = variant === 'auth' ? 'text-xs text-red-500 mt-1' : 'text-xs text-red-500'

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className={labelCls}>
          {label}
        </label>
      )}
      <input id={id} className={base} {...props} />
      {error && <p className={errorCls}>{error}</p>}
    </div>
  )
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  variant?: 'default' | 'auth'
}

export function Select({ label, error, className = '', id, options, variant = 'default', ...props }: SelectProps) {
  const base =
    variant === 'auth'
      ? `w-full px-4 py-3 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition ${error ? 'border-red-400' : 'border-gray-200'} ${className}`
      : `border rounded-lg px-3 py-2 text-sm outline-none transition-colors bg-white ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} ${className}`

  const labelCls =
    variant === 'auth'
      ? 'block text-sm font-medium text-gray-700 mb-1.5'
      : 'text-sm font-medium text-gray-700'

  const errorCls = variant === 'auth' ? 'text-xs text-red-500 mt-1' : 'text-xs text-red-500'

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className={labelCls}>
          {label}
        </label>
      )}
      <select id={id} className={base} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className={errorCls}>{error}</p>}
    </div>
  )
}

interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  rows?: number
}

export function Textarea({ label, error, className = '', id, rows = 3, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`border rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none
          ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}
          ${className}`}
        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
