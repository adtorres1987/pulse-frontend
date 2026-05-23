import { useEffect, useState } from 'react'
import { getPermissions, createPermission, updatePermission, deletePermission } from '../api'
import type { Permission } from '../types'
import { permissionSchema, type PermissionForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { DataTable, type Column } from '../components/ui/DataTable'

const LIMIT = 20

const emptyForm = (): PermissionForm => ({ action: '', description: '' })

export function Permissions() {
  const [items, setItems] = useState<Permission[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [deleteErr, setDeleteErr] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Permission | null>(null)
  const [form, setForm] = useState<PermissionForm>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof PermissionForm, string>>>({})
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState('')

  async function load(p = page) {
    setLoading(true)
    setLoadErr('')
    try {
      const result = await getPermissions(p, LIMIT)
      setItems(result.items)
      setTotal(result.total)
    } catch {
      setLoadErr('Error al cargar los permisos. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page])

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
      load(page)
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
      load(page)
    } catch {
      setDeleteErr('Error al eliminar el permiso. Intenta de nuevo.')
    }
  }

  const columns: Column<Permission>[] = [
    {
      key: 'action',
      header: 'Acción',
      render: (perm) => (
        <code className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
          {perm.action}
        </code>
      ),
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (perm) => <span className="text-gray-500">{perm.description ?? '—'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Creado',
      render: (perm) => <span className="text-gray-400 text-xs">{perm.createdAt.slice(0, 10)}</span>,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-20',
      render: (perm) => (
        <div className="flex gap-3 justify-end">
          <button onClick={() => openEdit(perm)} className="text-blue-500 hover:underline text-xs">Editar</button>
          <button onClick={() => handleDelete(perm.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Permisos</h2>
        <Button onClick={openCreate}>+ Nuevo</Button>
      </div>

      {deleteErr && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{deleteErr}</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(p) => p.id}
        loading={loading}
        error={loadErr}
        emptyMessage="Sin permisos registrados."
        page={page}
        total={total}
        limit={LIMIT}
        onPageChange={setPage}
      />

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
