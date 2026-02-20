import { useEffect, useState } from 'react'
import { getSnapshots, getTodaySnapshot, createSnapshot, updateTodaySnapshot } from '../api'
import type { DailySnapshot } from '../types'
import { snapshotSchema, type SnapshotForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { formatDate } from '../utils/formatters'

const MOOD_OPTS = [
  { value: '', label: '— sin estado de ánimo —' },
  { value: 'calm', label: '😌 Tranquilo' },
  { value: 'stressed', label: '😰 Estresado' },
  { value: 'confident', label: '💪 Seguro' },
  { value: 'neutral', label: '😐 Neutral' },
]

const emptyForm = (): SnapshotForm => ({ mood: undefined, reflection: '', consciousScore: undefined })

export function Snapshots() {
  const [items, setItems] = useState<DailySnapshot[]>([])
  const [today, setToday] = useState<DailySnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<SnapshotForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState('')

  async function load() {
    setLoading(true)
    const [all, todaySnap] = await Promise.all([getSnapshots(), getTodaySnapshot()])
    setItems(all)
    setToday(todaySnap)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openModal() {
    if (today) {
      setForm({
        mood: today.mood ?? undefined,
        reflection: today.reflection ?? '',
        consciousScore: today.consciousScore ?? undefined,
      })
    } else {
      setForm(emptyForm())
    }
    setApiErr('')
    setModal(true)
  }

  function set(field: keyof SnapshotForm, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiErr('')
    const result = snapshotSchema.safeParse({
      ...form,
      consciousScore: form.consciousScore ? Number(form.consciousScore) : undefined,
      mood: form.mood || undefined,
    })
    if (!result.success) { setApiErr('Datos inválidos'); return }
    try {
      setSaving(true)
      if (today) {
        await updateTodaySnapshot(result.data)
      } else {
        await createSnapshot(result.data)
      }
      setModal(false)
      load()
    } catch {
      setApiErr('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const moodLabel: Record<string, string> = {
    calm: '😌 Tranquilo', stressed: '😰 Estresado', confident: '💪 Seguro', neutral: '😐 Neutral',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Snapshots diarios</h2>
        <Button onClick={openModal}>{today ? 'Editar hoy' : '+ Snapshot de hoy'}</Button>
      </div>

      {today && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">
          <p className="text-sm font-semibold text-blue-700">Hoy</p>
          {today.mood && <p className="text-sm text-blue-600">{moodLabel[today.mood]}</p>}
          {today.consciousScore && (
            <p className="text-sm text-blue-600">Puntaje consciente: {today.consciousScore}/10</p>
          )}
          {today.reflection && <p className="text-sm text-gray-600 italic">"{today.reflection}"</p>}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400 text-sm">Sin snapshots registrados.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Estado de ánimo</th>
                <th className="px-4 py-3 text-left">Puntaje</th>
                <th className="px-4 py-3 text-left">Reflexión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{formatDate(s.date)}</td>
                  <td className="px-4 py-3">{s.mood ? moodLabel[s.mood] : '—'}</td>
                  <td className="px-4 py-3">{s.consciousScore ? `${s.consciousScore}/10` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{s.reflection ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={today ? 'Editar snapshot de hoy' : 'Nuevo snapshot'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select id="mood" label="Estado de ánimo" value={form.mood ?? ''} options={MOOD_OPTS}
            onChange={(e) => set('mood', e.target.value || undefined)} />
          <Input id="consciousScore" label="Puntaje consciente (1-10)" type="number" min={1} max={10}
            value={form.consciousScore ?? ''} onChange={(e) => set('consciousScore', e.target.value ? parseInt(e.target.value) : undefined)} />
          <Textarea id="reflection" label="Reflexión" value={form.reflection ?? ''}
            onChange={(e) => set('reflection', (e.target as HTMLTextAreaElement).value)} />
          {apiErr && <p className="text-xs text-red-500">{apiErr}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
