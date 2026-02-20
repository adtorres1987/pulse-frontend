import { useEffect, useState } from 'react'
import { getHabits, createHabit, updateHabit, deleteHabit, logHabit } from '../api'
import type { Habit } from '../types'
import { habitSchema, type HabitForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

const FREQ_OPTS = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
]

const emptyForm = (): HabitForm => ({ name: '', frequency: 'daily' })

export function Habits() {
  const [items, setItems] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [form, setForm] = useState<HabitForm>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof HabitForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState('')

  async function load() {
    setLoading(true)
    const data = await getHabits()
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

  function openEdit(habit: Habit) {
    setEditing(habit)
    setForm({ name: habit.name, frequency: habit.frequency })
    setErrors({})
    setApiErr('')
    setModal('edit')
  }

  function set(field: keyof HabitForm, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
    setErrors((p) => ({ ...p, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiErr('')
    const result = habitSchema.safeParse(form)
    if (!result.success) {
      const fe: typeof errors = {}
      result.error.issues.forEach((e) => { fe[e.path[0] as keyof HabitForm] = e.message })
      setErrors(fe)
      return
    }
    try {
      setSaving(true)
      if (modal === 'edit' && editing) {
        await updateHabit(editing.id, result.data)
      } else {
        await createHabit(result.data)
      }
      setModal(null)
      load()
    } catch {
      setApiErr('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(habit: Habit) {
    await updateHabit(habit.id, { active: !habit.active })
    load()
  }

  async function handleLogToday(habit: Habit) {
    await logHabit(habit.id, true)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar hábito?')) return
    await deleteHabit(id)
    load()
  }

  const active = items.filter((h) => h.active)
  const archived = items.filter((h) => !h.active)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Hábitos</h2>
        <Button onClick={openCreate}>+ Nuevo hábito</Button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <>
          {active.length === 0 && <p className="text-gray-400 text-sm">Sin hábitos activos.</p>}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {active.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{habit.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{habit.frequency === 'daily' ? 'Diario' : 'Semanal'}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handleLogToday(habit)}
                    className="text-xs text-green-600 hover:underline"
                  >
                    ✓ Hoy
                  </button>
                  <button onClick={() => openEdit(habit)} className="text-xs text-blue-500 hover:underline">Editar</button>
                  <button onClick={() => handleToggleActive(habit)} className="text-xs text-yellow-500 hover:underline">Archivar</button>
                  <button onClick={() => handleDelete(habit.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                </div>
              </div>
            ))}
          </div>

          {archived.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-gray-400 mt-4">Archivados</h3>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden opacity-60">
                {archived.map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-500">{habit.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{habit.frequency === 'daily' ? 'Diario' : 'Semanal'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleToggleActive(habit)} className="text-xs text-blue-500 hover:underline">Restaurar</button>
                      <button onClick={() => handleDelete(habit.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Editar hábito' : 'Nuevo hábito'}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input id="hname" label="Nombre" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
          <Select id="frequency" label="Frecuencia" value={form.frequency} options={FREQ_OPTS}
            onChange={(e) => set('frequency', e.target.value)} />
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
