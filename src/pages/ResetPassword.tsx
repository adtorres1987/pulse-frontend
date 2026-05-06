import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { resetPasswordSchema, type ResetPasswordForm } from '../schemas'
import { Input } from '../components/ui/Input'
import logo from '../assets/logo.png'

export function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [form, setForm] = useState<ResetPasswordForm>({ newPassword: '', confirm: '' })
  const [errors, setErrors] = useState<Partial<ResetPasswordForm>>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function onChange(field: keyof ResetPasswordForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')

    const result = resetPasswordSchema.safeParse(form)
    if (!result.success) {
      const fe: Partial<ResetPasswordForm> = {}
      result.error.issues.forEach((issue) => {
        fe[issue.path[0] as keyof ResetPasswordForm] = issue.message
      })
      setErrors(fe)
      return
    }

    if (!token) {
      setApiError('Enlace inválido o expirado')
      return
    }

    try {
      setLoading(true)
      await resetPassword(token, result.data.newPassword)
      navigate('/login')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        setApiError(axiosErr.response?.data?.error ?? 'Error al restablecer la contraseña')
      } else {
        setApiError('Error al restablecer la contraseña')
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

          {!token ? (
            <div className="text-center">
              <p className="text-sm text-red-500 mb-4">Enlace inválido o expirado.</p>
              <Link to="/forgot-password" className="text-teal-500 hover:underline text-sm font-medium">
                Solicitar un nuevo enlace
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Nueva contraseña</h1>
              <p className="text-sm text-gray-500 mb-8">
                Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  id="newPassword"
                  label="Nueva contraseña"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.newPassword}
                  onChange={(e) => onChange('newPassword', e.target.value)}
                  autoComplete="new-password"
                  error={errors.newPassword}
                  variant="auth"
                />

                <Input
                  id="confirm"
                  label="Confirmar contraseña"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={form.confirm}
                  onChange={(e) => onChange('confirm', e.target.value)}
                  autoComplete="new-password"
                  error={errors.confirm}
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
                  {loading ? 'Guardando...' : 'Restablecer contraseña'}
                </button>
              </form>

              <p className="text-sm text-center text-gray-500 mt-8">
                <Link to="/login" className="text-teal-500 hover:underline font-medium">
                  ← Volver al inicio de sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right — Decoration */}
      <div className="hidden lg:flex flex-1 bg-[#0f2744] items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full bg-white/5" />

        <div className="relative w-72 h-80">
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
