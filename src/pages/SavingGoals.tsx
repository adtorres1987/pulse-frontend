import { useEffect, useState } from 'react'
import {
  getSavingGoals,
  createSavingGoal,
  updateSavingGoal,
  deleteSavingGoal,
  depositToGoal,
} from '../api'
import type { SavingGoal } from '../types'
import { savingGoalSchema, depositSchema, type SavingGoalForm, type DepositForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { formatCurrency } from '../utils/formatters'

const emptyForm = (): SavingGoalForm => ({ name: '', targetAmount: 0, targetDate: '' })

export function SavingGoals() {
  const [items, setItems] = useState<SavingGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | 'deposit' | null>(null)
  const [editing, setEditing] = useState<SavingGoal | null>(null)
  const [form, setForm] = useState<SavingGoalForm>(emptyForm())
  const [depositForm, setDepositForm] = useState<DepositForm>({ amount: 0 })
  const [errors, setErrors] = useState<Partial<Record<keyof SavingGoalForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState('')

  async function load() {
    setLoading(true)
    const data = await getSavingGoals()
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

  function openEdit(goal: SavingGoal) {
    setEditing(goal)
    setForm({
      name: goal.name,
      targetAmount: parseFloat(goal.targetAmount),
      targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : '',
    })
    setErrors({})
    setApiErr('')
    setModal('edit')
  }

  function openDeposit(goal: SavingGoal) {
    setEditing(goal)
    setDepositForm({ amount: 0 })
    setApiErr('')
    setModal('deposit')
  }

  function set(field: keyof SavingGoalForm, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }))
    setErrors((p) => ({ ...p, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiErr('')
    const result = savingGoalSchema.safeParse({ ...form, targetAmount: Number(form.targetAmount) })
    if (!result.success) {
      const fe: typeof errors = {}
      result.error.issues.forEach((e) => { fe[e.path[0] as keyof SavingGoalForm] = e.message })
      setErrors(fe)
      return
    }
    const payload = {
      ...result.data,
      targetDate: result.data.targetDate || undefined,
    }
    try {
      setSaving(true)
      if (modal === 'edit' && editing) {
        await updateSavingGoal(editing.id, payload)
      } else {
        await createSavingGoal(payload)
      }
      setModal(null)
      load()
    } catch {
      setApiErr('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault()
    setApiErr('')
    const result = depositSchema.safeParse({ amount: Number(depositForm.amount) })
    if (!result.success) { setApiErr('Monto inválido'); return }
    try {
      setSaving(true)
      await depositToGoal(editing!.id, result.data.amount)
      setModal(null)
      load()
    } catch {
      setApiErr('Error al depositar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar meta?')) return
    await deleteSavingGoal(id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Metas de ahorro</h2>
        <Button onClick={openCreate}>+ Nueva meta</Button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400 text-sm">Sin metas de ahorro.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((goal) => {
            const current = parseFloat(goal.currentAmount)
            const target = parseFloat(goal.targetAmount)
            const pct = Math.min(100, Math.round((current / target) * 100))
            return (
              <div key={goal.id} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(goal)} className="text-blue-500 text-xs hover:underline">Editar</button>
                    <button onClick={() => handleDelete(goal.id)} className="text-red-500 text-xs hover:underline">Eliminar</button>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{formatCurrency(current)}</span>
                    <span>{formatCurrency(target)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{pct}% completado</p>
                </div>
                {goal.targetDate && (
                  <p className="text-xs text-gray-500">Fecha límite: {goal.targetDate.slice(0, 10)}</p>
                )}
                <Button variant="secondary" className="w-full text-xs" onClick={() => openDeposit(goal)}>
                  + Depositar
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Editar meta' : 'Nueva meta'}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input id="name" label="Nombre" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
          <Input id="targetAmount" label="Monto objetivo" type="number" min={0} step="0.01"
            value={form.targetAmount || ''} onChange={(e) => set('targetAmount', parseFloat(e.target.value))} error={errors.targetAmount} />
          <Input id="targetDate" label="Fecha límite (opcional)" type="date"
            value={form.targetDate ?? ''} onChange={(e) => set('targetDate', e.target.value)} />
          {apiErr && <p className="text-xs text-red-500">{apiErr}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === 'deposit'} onClose={() => setModal(null)} title={`Depositar a "${editing?.name}"`}>
        <form onSubmit={handleDeposit} className="space-y-3">
          <Input id="depositAmount" label="Monto a depositar" type="number" min={0} step="0.01"
            value={depositForm.amount || ''} onChange={(e) => setDepositForm({ amount: parseFloat(e.target.value) })} />
          {apiErr && <p className="text-xs text-red-500">{apiErr}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Depositar'}</Button>
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
