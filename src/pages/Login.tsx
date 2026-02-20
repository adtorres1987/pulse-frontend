import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginSchema, type LoginForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ZodError } from 'zod'

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-600">Pulso</h1>
          <p className="text-sm text-gray-500 mt-1">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => onChange('password', e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />

          {apiError && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{apiError}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
