import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { forgotPasswordSchema, type ForgotPasswordForm } from '../schemas'
import { Input } from '../components/ui/Input'
import logo from '../assets/logo.png'

export function ForgotPassword() {
  const [form, setForm] = useState<ForgotPasswordForm>({ email: '' })
  const [fieldError, setFieldError] = useState('')
  const [apiError, setApiError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError('')
    setApiError('')

    const result = forgotPasswordSchema.safeParse(form)
    if (!result.success) {
      setFieldError(result.error.issues[0].message)
      return
    }

    try {
      setLoading(true)
      await forgotPassword(result.data.email)
      setSent(true)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } }
        setApiError(axiosErr.response?.data?.error ?? 'Error al enviar el correo')
      } else {
        setApiError('Error al enviar el correo')
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

          {sent ? (
            /* Success state */
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-teal-50">
                <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Revisa tu correo</h1>
              <p className="text-sm text-gray-500 mb-8">
                Te enviamos un enlace para restablecer tu contraseña a <span className="font-medium text-gray-700">{form.email}</span>.
              </p>
              <Link
                to="/login"
                className="text-sm text-teal-500 hover:underline font-medium"
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Recuperar contraseña</h1>
              <p className="text-sm text-gray-500 mb-8">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  id="email"
                  label="Correo electrónico"
                  type="email"
                  placeholder="tu@correo.com"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ email: e.target.value })
                    setFieldError('')
                  }}
                  autoComplete="email"
                  error={fieldError}
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
                  {loading ? 'Enviando...' : 'Enviar enlace'}
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
