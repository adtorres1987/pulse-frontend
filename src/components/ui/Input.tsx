import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`border rounded-lg px-3 py-2 text-sm outline-none transition-colors
          ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, className = '', id, options, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`border rounded-lg px-3 py-2 text-sm outline-none transition-colors bg-white
          ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}
          ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
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

// fix: avoid spreading InputHTMLAttributes onto textarea directly
import React from 'react'
