import { useEffect, useState } from 'react'
import { getAppConfig, updateAppConfig } from '../api'
import type { AppConfig } from '../types'
import { appConfigValueSchema, type AppConfigValueForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

export function AdminAppConfig() {
  const [items, setItems] = useState<AppConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [editing, setEditing] = useState<AppConfig | null>(null)
  const [form, setForm] = useState<AppConfigValueForm>({ value: '' })
  const [formErr, setFormErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState('')

  async function load() {
    setLoading(true)
    setLoadErr('')
    try {
      const data = await getAppConfig()
      setItems(data)
    } catch {
      setLoadErr('Error al cargar la configuración. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openEdit(config: AppConfig) {
    setEditing(config)
    setForm({ value: config.value })
    setFormErr('')
    setApiErr('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiErr('')
    const result = appConfigValueSchema.safeParse(form)
    if (!result.success) {
      setFormErr(result.error.issues[0]?.message ?? 'Valor inválido')
      return
    }
    if (!editing) return
    try {
      setSaving(true)
      await updateAppConfig(editing.key, result.data.value)
      setEditing(null)
      load()
    } catch {
      setApiErr('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Configuración de la app</h2>

      {loadErr && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{loadErr}</p>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : !loadErr && items.length === 0 ? (
        <p className="text-gray-400 text-sm">Sin configuración disponible.</p>
      ) : !loadErr && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Clave</th>
                <th className="px-4 py-3 text-left">Valor</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">Actualizado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((cfg) => (
                <tr key={cfg.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">{cfg.key}</code>
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{cfg.value}</td>
                  <td className="px-4 py-3 text-gray-500">{cfg.description ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{cfg.updatedAt.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(cfg)} className="text-blue-500 hover:underline text-xs">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Editar: ${editing?.key ?? ''}`}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {editing?.description && (
            <p className="text-sm text-gray-500">{editing.description}</p>
          )}
          <Input
            id="cfg-value"
            label="Valor"
            value={form.value}
            onChange={(e) => { setForm({ value: e.target.value }); setFormErr('') }}
            error={formErr}
          />
          {apiErr && <p className="text-xs text-red-500">{apiErr}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
