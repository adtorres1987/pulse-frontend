import { useEffect, useState } from 'react'
import { getSubscriptionPlans, createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan } from '../api'
import type { SubscriptionPlan } from '../types'
import { subscriptionPlanSchema, type SubscriptionPlanForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { DataTable, type Column } from '../components/ui/DataTable'

const emptyForm = (): SubscriptionPlanForm => ({
  name: '',
  description: '',
  priceAmount: 0,
  currency: 'USD',
  intervalDays: 30,
  isActive: true,
  stripePriceId: '',
})

export function AdminSubscriptionPlans() {
  const [items, setItems] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [deleteErr, setDeleteErr] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null)
  const [form, setForm] = useState<SubscriptionPlanForm>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof SubscriptionPlanForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState('')

  async function load() {
    setLoading(true)
    setLoadErr('')
    try {
      const data = await getSubscriptionPlans()
      setItems(data)
    } catch {
      setLoadErr('Error al cargar los planes. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(emptyForm())
    setErrors({})
    setApiErr('')
    setEditing(null)
    setModal('create')
  }

  function openEdit(plan: SubscriptionPlan) {
    setEditing(plan)
    setForm({
      name: plan.name,
      description: plan.description ?? '',
      priceAmount: parseFloat(plan.priceAmount),
      currency: plan.currency,
      intervalDays: plan.intervalDays,
      isActive: plan.isActive,
      stripePriceId: plan.stripePriceId ?? '',
    })
    setErrors({})
    setApiErr('')
    setModal('edit')
  }

  function set<K extends keyof SubscriptionPlanForm>(field: K, value: SubscriptionPlanForm[K]) {
    setForm((p) => ({ ...p, [field]: value }))
    setErrors((p) => ({ ...p, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiErr('')
    const result = subscriptionPlanSchema.safeParse({ ...form, priceAmount: Number(form.priceAmount), intervalDays: Number(form.intervalDays) })
    if (!result.success) {
      const fe: typeof errors = {}
      result.error.issues.forEach((issue) => { fe[issue.path[0] as keyof SubscriptionPlanForm] = issue.message })
      setErrors(fe)
      return
    }
    const payload = {
      ...result.data,
      description: result.data.description || undefined,
      stripePriceId: result.data.stripePriceId || undefined,
    }
    try {
      setSaving(true)
      if (modal === 'edit' && editing) {
        await updateSubscriptionPlan(editing.id, payload)
      } else {
        const { isActive: _, ...createPayload } = payload
        await createSubscriptionPlan(createPayload)
      }
      setModal(null)
      load()
    } catch {
      setApiErr('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este plan?')) return
    setDeleteErr('')
    try {
      await deleteSubscriptionPlan(id)
      load()
    } catch {
      setDeleteErr('Error al eliminar el plan. Intenta de nuevo.')
    }
  }

  const columns: Column<SubscriptionPlan>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (plan) => (
        <div>
          <p className="font-medium text-gray-900">{plan.name}</p>
          {plan.description && <p className="text-xs text-gray-400">{plan.description}</p>}
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Precio',
      render: (plan) => (
        <span className="font-semibold text-gray-800">
          {parseFloat(plan.priceAmount).toFixed(2)} {plan.currency}
        </span>
      ),
    },
    {
      key: 'interval',
      header: 'Ciclo',
      render: (plan) => <span className="text-gray-500">{plan.intervalDays} días</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (plan) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {plan.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'stripeId',
      header: 'Stripe ID',
      className: 'max-w-xs truncate text-gray-400 text-xs',
      render: (plan) => <>{plan.stripePriceId ?? '—'}</>,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-20',
      render: (plan) => (
        <div className="flex gap-3 justify-end">
          <button onClick={() => openEdit(plan)} className="text-blue-500 hover:underline text-xs">Editar</button>
          <button onClick={() => handleDelete(plan.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Planes de suscripción</h2>
        <Button onClick={openCreate}>+ Nuevo plan</Button>
      </div>

      {deleteErr && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{deleteErr}</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(plan) => plan.id}
        loading={loading}
        error={loadErr}
        emptyMessage="Sin planes registrados."
      />

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Editar plan' : 'Nuevo plan'}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            id="sp-name"
            label="Nombre"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
          />
          <Input
            id="sp-desc"
            label="Descripción"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="sp-price"
              label="Precio"
              type="number"
              min={0}
              step="0.01"
              value={form.priceAmount || ''}
              onChange={(e) => set('priceAmount', parseFloat(e.target.value))}
              error={errors.priceAmount}
            />
            <Input
              id="sp-currency"
              label="Moneda (ISO)"
              placeholder="USD"
              value={form.currency}
              onChange={(e) => set('currency', e.target.value.toUpperCase())}
              error={errors.currency}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="sp-interval"
              label="Días de ciclo"
              type="number"
              min={1}
              step={1}
              value={form.intervalDays || ''}
              onChange={(e) => set('intervalDays', parseInt(e.target.value))}
              error={errors.intervalDays}
            />
            <Input
              id="sp-stripe"
              label="Stripe Price ID"
              placeholder="price_..."
              value={form.stripePriceId ?? ''}
              onChange={(e) => set('stripePriceId', e.target.value)}
            />
          </div>
          {modal === 'edit' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={(e) => set('isActive', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Plan activo</span>
            </label>
          )}
          {apiErr && <p className="text-xs text-red-500">{apiErr}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
