import { useEffect, useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AppHeader } from './AppHeader'
import { useAuth } from '../../context/AuthContext'
import { getActivePlans, createCheckoutSession } from '../../api/subscriptions'
import type { SubscriptionPlan } from '../../types'
import logo from '../../assets/logo.png'

const STATUS_LABELS: Record<string, string> = {
  expired:   'Expirada',
  cancelled: 'Cancelada',
}

function formatPrice(amount: string, currency: string, intervalDays: number) {
  const price = parseFloat(amount)
  const period = intervalDays === 30 ? 'mes' : intervalDays === 365 ? 'año' : `${intervalDays} días`
  return { price, period, currency: currency.toUpperCase() }
}

function PlanCard({
  plan,
  onSelect,
  loading,
}: {
  plan: SubscriptionPlan
  onSelect: (id: string) => void
  loading: boolean
}) {
  const { price, period, currency } = formatPrice(plan.priceAmount, plan.currency, plan.intervalDays)
  const hasStripe = !!plan.stripePriceId

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
      {plan.description && (
        <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
      )}

      <div className="mt-4 flex items-end gap-1">
        <span className="text-3xl font-extrabold text-gray-900">
          {currency} {price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
        <span className="mb-1 text-sm text-gray-400">/ {period}</span>
      </div>

      <div className="mt-6">
        {hasStripe ? (
          <button
            onClick={() => onSelect(plan.id)}
            disabled={loading}
            className="w-full rounded-xl bg-[#465fff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a52d4] disabled:opacity-50"
          >
            {loading ? 'Redirigiendo...' : 'Seleccionar plan'}
          </button>
        ) : (
          <p className="text-center text-xs text-gray-400">
            Contacta a soporte para activar este plan
          </p>
        )}
      </div>
    </div>
  )
}

function SubscriptionWall() {
  const { user, subscription, logout } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getActivePlans()
      .then(setPlans)
      .catch(() => setError('No se pudieron cargar los planes. Intenta recargar la página.'))
      .finally(() => setPlansLoading(false))
  }, [])

  async function handleSelect(planId: string) {
    setCheckoutLoading(planId)
    setError('')
    try {
      const url = await createCheckoutSession(planId)
      window.location.href = url
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Error al iniciar el pago. Intenta de nuevo.')
      setCheckoutLoading(null)
    }
  }

  const statusLabel = subscription ? (STATUS_LABELS[subscription.status] ?? subscription.status) : null

  return (
    <div className="flex min-h-screen flex-col bg-[#F1F5F9]">
      {/* Minimal header */}
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
        <img src={logo} alt="Pulso" className="h-8" />
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-gray-500 sm:block">{user?.email}</span>
          <button
            onClick={logout}
            className="text-sm font-medium text-red-500 transition-colors hover:text-red-600"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          {/* Status banner */}
          <div className="mb-8 text-center">
            {subscription ? (
              <>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                  Suscripción {statusLabel?.toLowerCase()}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Renueva tu acceso a Pulso</h1>
                <p className="mt-2 text-sm text-gray-500">
                  Tu plan <span className="font-medium">{subscription.plan.name}</span> ya no está activo.
                  Elige un plan para continuar.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900">Elige tu plan</h1>
                <p className="mt-2 text-sm text-gray-500">
                  Selecciona el plan que mejor se adapte a ti para comenzar a usar Pulso.
                </p>
              </>
            )}
          </div>

          {/* Plans */}
          {plansLoading ? (
            <p className="text-center text-sm text-gray-400">Cargando planes...</p>
          ) : plans.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">
                No hay planes disponibles en este momento.
                <br />
                <Link to="/profile" className="mt-2 inline-block text-[#465fff] hover:underline">
                  Ir a mi perfil
                </Link>
              </p>
            </div>
          ) : (
            <div className={`grid gap-4 ${plans.length === 1 ? 'max-w-sm mx-auto' : 'sm:grid-cols-2'}`}>
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={handleSelect}
                  loading={checkoutLoading === plan.id}
                />
              ))}
            </div>
          )}

          {error && (
            <p className="mt-4 text-center text-sm text-red-500">{error}</p>
          )}

          <p className="mt-8 text-center text-xs text-gray-400">
            ¿Necesitas ayuda?{' '}
            <a href="mailto:soporte@pulso.app" className="text-[#465fff] hover:underline">
              Contacta a soporte
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

export function AppLayout() {
  const { user, subscription } = useAuth()

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const hasValidSubscription = subscription?.status === 'trial' || subscription?.status === 'active'

  if (!isAdmin && !hasValidSubscription) {
    return <SubscriptionWall />
  }

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
