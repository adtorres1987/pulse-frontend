import { useEffect, useState } from 'react'
import { getPermissions, createPermission, updatePermission, deletePermission } from '../api'
import type { Permission } from '../types'
import { permissionSchema, type PermissionForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

const emptyForm = (): PermissionForm => ({ action: '', description: '' })

export function Permissions() {
  const [items, setItems] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [deleteErr, setDeleteErr] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Permission | null>(null)
  const [form, setForm] = useState<PermissionForm>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof PermissionForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState('')

  async function load() {
    setLoading(true)
    setLoadErr('')
    try {
      const data = await getPermissions()
      setItems(data)
    } catch {
      setLoadErr('Error al cargar los permisos. Intenta de nuevo.')
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

  function openEdit(perm: Permission) {
    setEditing(perm)
    setForm({ action: perm.action, description: perm.description ?? '' })
    setErrors({})
    setApiErr('')
    setModal('edit')
  }

  function set(field: keyof PermissionForm, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
    setErrors((p) => ({ ...p, [field]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiErr('')
    const result = permissionSchema.safeParse(form)
    if (!result.success) {
      const fe: typeof errors = {}
      result.error.issues.forEach((issue) => { fe[issue.path[0] as keyof PermissionForm] = issue.message })
      setErrors(fe)
      return
    }
    const payload = {
      action: result.data.action,
      description: result.data.description || undefined,
    }
    try {
      setSaving(true)
      if (modal === 'edit' && editing) {
        await updatePermission(editing.id, payload)
      } else {
        await createPermission(payload)
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
    if (!confirm('¿Eliminar este permiso?')) return
    setDeleteErr('')
    try {
      await deletePermission(id)
      load()
    } catch {
      setDeleteErr('Error al eliminar el permiso. Intenta de nuevo.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Permisos</h2>
        <Button onClick={openCreate}>+ Nuevo</Button>
      </div>

      {loadErr && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{loadErr}</p>
        </div>
      )}

      {deleteErr && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{deleteErr}</p>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : !loadErr && items.length === 0 ? (
        <p className="text-gray-400 text-sm">Sin permisos registrados.</p>
      ) : !loadErr && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Acción</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">Creado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((perm) => (
                <tr key={perm.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                      {perm.action}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{perm.description ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{perm.createdAt.slice(0, 10)}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button onClick={() => openEdit(perm)} className="text-blue-500 hover:underline text-xs">Editar</button>
                    <button onClick={() => handleDelete(perm.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Editar permiso' : 'Nuevo permiso'}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            id="paction"
            label="Acción"
            placeholder="recurso:operación"
            value={form.action}
            onChange={(e) => set('action', e.target.value)}
            error={errors.action}
          />
          <Input
            id="pdesc"
            label="Descripción"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
          />
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
