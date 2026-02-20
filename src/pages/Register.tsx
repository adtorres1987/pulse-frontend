import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register } from '../api/auth'
import { registerSchema, type RegisterForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'

const LANGUAGE_OPTS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
]

const TIMEZONE_OPTS = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (CST)' },
  { value: 'America/Cancun', label: 'Cancún (EST)' },
  { value: 'America/Chihuahua', label: 'Chihuahua (MST)' },
  { value: 'America/Tijuana', label: 'Tijuana (PST)' },
  { value: 'America/Bogota', label: 'Bogotá (COT)' },
  { value: 'America/Lima', label: 'Lima (PET)' },
  { value: 'America/Santiago', label: 'Santiago (CLT)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'America/New_York', label: 'Nueva York (ET)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (PT)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)' },
  { value: 'UTC', label: 'UTC' },
]

function detectTimezone(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  return TIMEZONE_OPTS.find((o) => o.value === tz)?.value ?? 'America/Mexico_City'
}

type FormErrors = Partial<Record<keyof RegisterForm, string>>

const emptyForm = (): RegisterForm => ({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  timezone: detectTimezone(),
  language: 'es',
})

export function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<RegisterForm>(emptyForm())
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function onChange(field: keyof RegisterForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')

    const result = registerSchema.safeParse(form)
    if (!result.success) {
      const fe: FormErrors = {}
      result.error.issues.forEach((issue) => {
        fe[issue.path[0] as keyof RegisterForm] = issue.message
      })
      setErrors(fe)
      return
    }

    try {
      setLoading(true)
      await register(result.data)
      // Auto-login after successful registration
      await login(result.data.email, result.data.password)
      navigate('/')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string; errors?: Record<string, string[]> } } }
        const data = axiosErr.response?.data
        if (data?.errors) {
          const fe: FormErrors = {}
          Object.entries(data.errors).forEach(([key, msgs]) => {
            fe[key as keyof RegisterForm] = msgs[0]
          })
          setErrors(fe)
        } else {
          setApiError(data?.error ?? 'Error al registrarse')
        }
      } else {
        setApiError('Error al registrarse')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-600">Pulso</h1>
          <p className="text-sm text-gray-500 mt-1">Crea tu cuenta gratuita</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="firstName"
              label="Nombre"
              placeholder="Ana"
              value={form.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              error={errors.firstName}
              autoComplete="given-name"
            />
            <Input
              id="lastName"
              label="Apellido"
              placeholder="García"
              value={form.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              error={errors.lastName}
              autoComplete="family-name"
            />
          </div>

          <Input
            id="email"
            label="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            id="password"
            label="Contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={(e) => onChange('password', e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />

          <Select
            id="timezone"
            label="Zona horaria"
            value={form.timezone}
            options={TIMEZONE_OPTS}
            onChange={(e) => onChange('timezone', e.target.value)}
            error={errors.timezone}
          />

          <Select
            id="language"
            label="Idioma"
            value={form.language ?? 'es'}
            options={LANGUAGE_OPTS}
            onChange={(e) => onChange('language', e.target.value)}
          />

          {apiError && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{apiError}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
