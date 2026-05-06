import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register } from '../api/auth'
import { registerSchema, type RegisterForm } from '../schemas'
import { Input, Select } from '../components/ui/Input'
import logo from '../assets/logo.png'

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
      await login(result.data.email, result.data.password)
      navigate('/')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string; fieldErrors?: Record<string, string[]> } } }
        const data = axiosErr.response?.data
        if (data?.fieldErrors) {
          const fe: FormErrors = {}
          Object.entries(data.fieldErrors).forEach(([key, msgs]) => {
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
    <div className="min-h-screen flex bg-slate-100">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center px-10 py-2">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Pulso" className="h-50" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Crear cuenta</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="firstName"
                label="Nombre"
                type="text"
                placeholder="Ana"
                value={form.firstName}
                onChange={(e) => onChange('firstName', e.target.value)}
                autoComplete="given-name"
                error={errors.firstName}
                variant="auth"
              />
              <Input
                id="lastName"
                label="Apellido"
                type="text"
                placeholder="García"
                value={form.lastName}
                onChange={(e) => onChange('lastName', e.target.value)}
                autoComplete="family-name"
                error={errors.lastName}
                variant="auth"
              />
            </div>

            <Input
              id="email"
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
              autoComplete="email"
              error={errors.email}
              variant="auth"
            />

            <Input
              id="password"
              label="Contraseña"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={(e) => onChange('password', e.target.value)}
              autoComplete="new-password"
              error={errors.password}
              variant="auth"
            />

            <Select
              id="timezone"
              label="Zona horaria"
              value={form.timezone}
              onChange={(e) => onChange('timezone', e.target.value)}
              options={TIMEZONE_OPTS}
              error={errors.timezone}
              variant="auth"
            />

            <Select
              id="language"
              label="Idioma"
              value={form.language ?? 'es'}
              onChange={(e) => onChange('language', e.target.value)}
              options={LANGUAGE_OPTS}
              variant="auth"
            />

            {apiError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{apiError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-400 hover:bg-teal-500 active:bg-teal-600 text-white font-semibold text-sm transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-8">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-teal-500 hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Decoration (same as Login) */}
      <div className="hidden lg:flex flex-1 bg-[#0f2744] items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full bg-white/5" />

        <div className="relative w-72 h-80">
          {/* Chart card — top right */}
          <div className="absolute -top-10 right-0 bg-white rounded-2xl p-4 shadow-2xl w-52">
            <p className="text-xs text-gray-400 mb-3">Ahorro mensual</p>
            <div className="flex items-end gap-1.5 h-14">
              {[30, 45, 35, 60, 45, 75, 55].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background: i === 5 ? '#2dd4bf' : i === 3 ? '#818cf8' : '#e5e7eb',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Phone mockup */}
          <div className="absolute inset-x-8 top-8 bottom-0 bg-[#0a1e38] rounded-3xl border-4 border-[#1e3a60] shadow-2xl overflow-hidden flex flex-col">
            <div className="h-6 bg-[#071529] flex items-center justify-center">
              <div className="w-12 h-1.5 rounded-full bg-[#1e3a60]" />
            </div>
            <div className="flex-1 p-3 space-y-2">
              {[100, 80, 100, 60].map((w, i) => (
                <div
                  key={i}
                  className="h-2 rounded-full bg-[#1e3a60]"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>

          {/* Stats card — bottom left */}
          <div className="absolute -bottom-6 -left-4 bg-white rounded-2xl p-4 shadow-2xl w-44">
            <p className="text-xs text-gray-400 mb-2">Meta de ahorro</p>
            <div className="space-y-1.5 mb-3">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 rounded-full" style={{ width: '72%' }} />
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full" style={{ width: '48%' }} />
              </div>
            </div>
            <div className="w-16 h-6 bg-indigo-500 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
