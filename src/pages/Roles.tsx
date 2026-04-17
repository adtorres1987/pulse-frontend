import { useEffect, useState } from 'react'
import { getRoles, createRole, updateRole, deleteRole } from '../api'
import type { Role, RoleType } from '../types'
import { roleCreateSchema, roleUpdateSchema, type RoleCreateForm, type RoleUpdateForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

const ROLE_OPTS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'support', label: 'Soporte' },
  { value: 'user', label: 'Usuario' },
]

const ROLE_LABELS: Record<RoleType, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  support: 'Soporte',
  user: 'Usuario',
}

const ROLE_COLORS: Record<RoleType, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  support: 'bg-yellow-100 text-yellow-800',
  user: 'bg-gray-100 text-gray-700',
}

const emptyCreate = (): RoleCreateForm => ({ name: 'user', description: '' })
const emptyUpdate = (): RoleUpdateForm => ({ description: '' })

export function Roles() {
  const [items, setItems] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Role | null>(null)
  const [createForm, setCreateForm] = useState<RoleCreateForm>(emptyCreate())
  const [updateForm, setUpdateForm] = useState<RoleUpdateForm>(emptyUpdate())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [apiErr, setApiErr] = useState('')

  async function load() {
    setLoading(true)
    const data = await getRoles()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setCreateForm(emptyCreate())
    setErrors({})
    setApiErr('')
    setEditing(null)
    setModal('create')
  }

  function openEdit(role: Role) {
    setEditing(role)
    setUpdateForm({ description: role.description ?? '' })
    setErrors({})
    setApiErr('')
    setModal('edit')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiErr('')

    if (modal === 'create') {
      const result = roleCreateSchema.safeParse(createForm)
      if (!result.success) {
        const fe: Record<string, string> = {}
        result.error.issues.forEach((issue) => { fe[String(issue.path[0])] = issue.message })
        setErrors(fe)
        return
      }
      try {
        setSaving(true)
        await createRole({ ...result.data, description: result.data.description || undefined })
        setModal(null)
        load()
      } catch {
        setApiErr('Error al crear el rol')
      } finally {
        setSaving(false)
      }
    } else if (modal === 'edit' && editing) {
      const result = roleUpdateSchema.safeParse(updateForm)
      if (!result.success) {
        const fe: Record<string, string> = {}
        result.error.issues.forEach((issue) => { fe[String(issue.path[0])] = issue.message })
        setErrors(fe)
        return
      }
      try {
        setSaving(true)
        await updateRole(editing.id, { description: result.data.description || undefined })
        setModal(null)
        load()
      } catch {
        setApiErr('Error al guardar')
      } finally {
        setSaving(false)
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este rol?')) return
    await deleteRole(id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Roles y permisos</h2>
        <Button onClick={openCreate}>+ Nuevo rol</Button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {items.length === 0 && (
            <p className="text-gray-400 text-sm px-4 py-3">Sin roles registrados.</p>
          )}
          {items.map((role) => (
            <div key={role.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-start gap-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-0.5 ${ROLE_COLORS[role.name]}`}>
                  {ROLE_LABELS[role.name]}
                </span>
                <div>
                  {role.description && (
                    <p className="text-sm text-gray-600">{role.description}</p>
                  )}
                  {role.permissions.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {role.permissions.length} permiso{role.permissions.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => openEdit(role)} className="text-xs text-blue-500 hover:underline">
                  Editar
                </button>
                <button onClick={() => handleDelete(role.id)} className="text-xs text-red-500 hover:underline">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Editar rol' : 'Nuevo rol'}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {modal === 'create' && (
            <Select
              id="rname"
              label="Rol"
              value={createForm.name}
              options={ROLE_OPTS}
              onChange={(e) => {
                setCreateForm((p) => ({ ...p, name: e.target.value as RoleType }))
                setErrors((p) => ({ ...p, name: '' }))
              }}
              error={errors.name}
            />
          )}

          <Input
            id="rdesc"
            label="Descripción"
            value={modal === 'create' ? (createForm.description ?? '') : (updateForm.description ?? '')}
            onChange={(e) => {
              if (modal === 'create') {
                setCreateForm((p) => ({ ...p, description: e.target.value }))
              } else {
                setUpdateForm((p) => ({ ...p, description: e.target.value }))
              }
              setErrors((p) => ({ ...p, description: '' }))
            }}
            error={errors.description}
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
