import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginSchema, type LoginForm } from '../schemas'
import { ZodError } from 'zod'
import logo from '../assets/logo.png'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<LoginForm>>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function onChange(field: keyof LoginForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')

    const result = loginSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<LoginForm> = {}
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof LoginForm
        fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    try {
      setLoading(true)
      await login(result.data.email, result.data.password)
      navigate('/')
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        setApiError('Error de validación')
      } else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        setApiError(axiosErr.response?.data?.error ?? 'Credenciales inválidas')
      } else {
        setApiError('Error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center px-10 py-12">
        <div className="w-full max-w-sm">
          
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Pulso" className="h-50" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Iniciar sesión</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="username@gmail.com"
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="password"
                value={form.password}
                onChange={(e) => onChange('password', e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-teal-500 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {apiError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{apiError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-400 hover:bg-teal-500 active:bg-teal-600 text-white font-semibold text-sm transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">O inicia sesión con</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Github
            </button>
          </div> */}

          <p className="text-sm text-center text-gray-500 mt-8">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-teal-500 hover:underline font-medium">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Decoration */}
      <div className="hidden lg:flex flex-1 bg-[#0f2744] items-center justify-center relative overflow-hidden">
        {/* Background circles */}
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
