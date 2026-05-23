import { useEffect, useState } from 'react'
import { getHabits, createHabit, updateHabit, deleteHabit, logHabit } from '../api'
import type { Habit } from '../types'
import { habitSchema, type HabitForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { DataTable, type Column } from '../components/ui/DataTable'

const LIMIT = 20

const FREQ_OPTS = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
]

const ACTIVE_FILTER_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Archivados' },
]

const emptyForm = (): HabitForm => ({ name: '', frequency: 'daily' })

export function Habits() {
  const [items, setItems] = useState<Habit[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState('true')
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [form, setForm] = useState<HabitForm>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof HabitForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState('')

  function activeParam(): boolean | undefined {
    if (activeFilter === 'true') return true
    if (activeFilter === 'false') return false
    return undefined
  }

  async function load(p = page) {
    setLoading(true)
    setLoadErr('')
    try {
      const result = await getHabits(activeParam(), p, LIMIT)
      setItems(result.items)
      setTotal(result.total)
    } catch {
      setLoadErr('Error al cargar los hábitos. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter])

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

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
      load(page)
    } catch {
      setApiErr('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(habit: Habit) {
    await updateHabit(habit.id, { active: !habit.active })
    load(page)
  }

  async function handleLogToday(habit: Habit) {
    await logHabit(habit.id, true)
    load(page)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar hábito?')) return
    await deleteHabit(id)
    load(page)
  }

  const columns: Column<Habit>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (h) => <span className="font-medium text-gray-900">{h.name}</span>,
    },
    {
      key: 'frequency',
      header: 'Frecuencia',
      render: (h) => (
        <span className="text-sm text-gray-500">{h.frequency === 'daily' ? 'Diario' : 'Semanal'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (h) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${h.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {h.active ? 'Activo' : 'Archivado'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-40',
      render: (h) => (
        <div className="flex gap-3 justify-end">
          {h.active && (
            <button onClick={() => handleLogToday(h)} className="text-xs text-green-600 hover:underline">
              ✓ Hoy
            </button>
          )}
          <button onClick={() => openEdit(h)} className="text-xs text-blue-500 hover:underline">Editar</button>
          <button onClick={() => handleToggleActive(h)} className="text-xs text-yellow-500 hover:underline">
            {h.active ? 'Archivar' : 'Restaurar'}
          </button>
          <button onClick={() => handleDelete(h.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Hábitos</h2>
        <Button onClick={openCreate}>+ Nuevo hábito</Button>
      </div>

      <div className="w-44">
        <Select
          id="habit-filter"
          options={ACTIVE_FILTER_OPTS}
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(h) => h.id}
        loading={loading}
        error={loadErr}
        emptyMessage="Sin hábitos."
        page={page}
        total={total}
        limit={LIMIT}
        onPageChange={setPage}
      />

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
