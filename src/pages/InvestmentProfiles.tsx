import { useEffect, useState } from 'react'
import {
  getInvestmentProfiles,
  createInvestmentProfile,
  updateInvestmentProfile,
  deleteInvestmentProfile,
} from '../api'
import type { InvestmentProfile } from '../types'
import { investmentProfileSchema, type InvestmentProfileForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { formatCurrency } from '../utils/formatters'

const STRATEGY_OPTS = [
  { value: 'conservative', label: 'Conservador' },
  { value: 'balanced', label: 'Balanceado' },
  { value: 'long_term', label: 'Largo plazo' },
]

const strategyLabel: Record<string, string> = {
  conservative: 'Conservador', balanced: 'Balanceado', long_term: 'Largo plazo',
}

const emptyForm = (): InvestmentProfileForm => ({
  strategy: 'conservative',
  monthlyAmount: 0,
  expectedReturn: 0,
})

export function InvestmentProfiles() {
  const [items, setItems] = useState<InvestmentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<InvestmentProfile | null>(null)
  const [form, setForm] = useState<InvestmentProfileForm>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof InvestmentProfileForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState('')

  async function load() {
    setLoading(true)
    const data = await getInvestmentProfiles()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(emptyForm())
    setErrors({})
    setApiErr('')
    setEditing(null)
    setModal('create')
  }

  function openEdit(profile: InvestmentProfile) {
    setEditing(profile)
    setForm({
      strategy: profile.strategy,
      monthlyAmount: parseFloat(profile.monthlyAmount),
      expectedReturn: parseFloat(profile.expectedReturn),
    })
    setErrors({})
    setApiErr('')
    setModal('edit')
  }

  function set(field: keyof InvestmentProfileForm, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }))
    setErrors((p) => ({ ...p, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiErr('')
    const result = investmentProfileSchema.safeParse({
      ...form,
      monthlyAmount: Number(form.monthlyAmount),
      expectedReturn: Number(form.expectedReturn),
    })
    if (!result.success) {
      const fe: typeof errors = {}
      result.error.issues.forEach((e) => { fe[e.path[0] as keyof InvestmentProfileForm] = e.message })
      setErrors(fe)
      return
    }
    try {
      setSaving(true)
      if (modal === 'edit' && editing) {
        await updateInvestmentProfile(editing.id, result.data)
      } else {
        await createInvestmentProfile(result.data)
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
    if (!confirm('¿Eliminar perfil de inversión?')) return
    await deleteInvestmentProfile(id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Perfiles de inversión</h2>
        <Button onClick={openCreate}>+ Nuevo perfil</Button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400 text-sm">Sin perfiles de inversión.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((profile) => (
            <div key={profile.id} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {strategyLabel[profile.strategy]}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(profile)} className="text-xs text-blue-500 hover:underline">Editar</button>
                  <button onClick={() => handleDelete(profile.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Monto mensual</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(parseFloat(profile.monthlyAmount))}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Retorno esperado</p>
                <p className="text-lg font-semibold text-green-600">{parseFloat(profile.expectedReturn).toFixed(2)}%</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Editar perfil' : 'Nuevo perfil'}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select id="strategy" label="Estrategia" value={form.strategy} options={STRATEGY_OPTS}
            onChange={(e) => set('strategy', e.target.value)} />
          <Input id="monthlyAmount" label="Monto mensual" type="number" min={0} step="0.01"
            value={form.monthlyAmount || ''} onChange={(e) => set('monthlyAmount', parseFloat(e.target.value))}
            error={errors.monthlyAmount} />
          <Input id="expectedReturn" label="Retorno esperado (%)" type="number" min={0} max={100} step="0.01"
            value={form.expectedReturn || ''} onChange={(e) => set('expectedReturn', parseFloat(e.target.value))}
            error={errors.expectedReturn} />
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
