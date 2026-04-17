import { useEffect, useRef, useState } from 'react'
import { listClientUsers, updateClientUser, resetClientUserPassword } from '../api'
import type { AdminUser, AdminUserFilters, UpdateAdminUserData } from '../types'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

const STATUS_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
]

const PAGE_SIZE = 10

function fullName(user: AdminUser): string {
  if (!user.person) return '—'
  return `${user.person.firstName} ${user.person.lastName}`.trim()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const emptyForm = (user: AdminUser): UpdateAdminUserData => ({
  firstName: user.person?.firstName ?? '',
  lastName: user.person?.lastName ?? '',
  phone: user.person?.phone ?? '',
  email: user.email,
  isActive: user.isActive,
})

export function AdminUsers() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [apiErr, setApiErr] = useState('')

  // Paginación
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filtros
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Modal de edición
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [form, setForm] = useState<UpdateAdminUserData>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  // Modal de cambio de contraseña (solo super_admin)
  const [pwTarget, setPwTarget] = useState<AdminUser | null>(null)
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' })
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [pwSaving, setPwSaving] = useState(false)
  const [pwErr, setPwErr] = useState('')

  async function load(filters: AdminUserFilters) {
    setLoading(true)
    setApiErr('')
    try {
      const data = await listClientUsers(filters)
      setUsers(data.users)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      setApiErr('Error al cargar los usuarios. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Carga inicial y cuando cambia la página o el filtro de estado
  useEffect(() => {
    const filters: AdminUserFilters = {
      page,
      limit: PAGE_SIZE,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(statusFilter !== '' ? { isActive: statusFilter === 'true' } : {}),
    }
    load(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter])

  // Debounce para el campo de búsqueda (400 ms)
  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1) // Reinicia a la primera página al buscar
      const filters: AdminUserFilters = {
        page: 1,
        limit: PAGE_SIZE,
        ...(value.trim() ? { search: value.trim() } : {}),
        ...(statusFilter !== '' ? { isActive: statusFilter === 'true' } : {}),
      }
      load(filters)
    }, 400)
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value)
    setPage(1) // Reinicia paginación al cambiar filtro
  }

  function openEdit(user: AdminUser) {
    setEditing(user)
    setForm(emptyForm(user))
    setFormErrors({})
    setSaveErr('')
  }

  function validateForm(): boolean {
    const errs: Record<string, string> = {}
    if (!form.firstName?.trim()) errs.firstName = 'El nombre es requerido'
    if (!form.lastName?.trim()) errs.lastName = 'El apellido es requerido'
    if (!form.email?.trim()) errs.email = 'El correo es requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Correo inválido'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    if (!validateForm()) return

    setSaving(true)
    setSaveErr('')
    try {
      await updateClientUser(editing.id, form)
      setEditing(null)
      // Recarga la página actual con los filtros activos
      const filters: AdminUserFilters = {
        page,
        limit: PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(statusFilter !== '' ? { isActive: statusFilter === 'true' } : {}),
      }
      load(filters)
    } catch {
      setSaveErr('Error al guardar los cambios. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  function openResetPassword(user: AdminUser) {
    setPwTarget(user)
    setPwForm({ newPassword: '', confirmPassword: '' })
    setPwErrors({})
    setPwErr('')
  }

  function validatePwForm(): boolean {
    const errs: Record<string, string> = {}
    if (pwForm.newPassword.length < 8) errs.newPassword = 'Mínimo 8 caracteres'
    if (!pwForm.confirmPassword) errs.confirmPassword = 'Requerido'
    else if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden'
    setPwErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!pwTarget || !validatePwForm()) return
    setPwSaving(true)
    setPwErr('')
    try {
      await resetClientUserPassword(pwTarget.id, pwForm.newPassword, pwForm.confirmPassword)
      setPwTarget(null)
    } catch {
      setPwErr('Error al cambiar la contraseña. Intenta de nuevo.')
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usuarios clientes</h2>
          {!loading && (
            <p className="text-xs text-gray-400 mt-0.5">{total} usuario{total !== 1 ? 's' : ''} en total</p>
          )}
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            id="user-search"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            id="user-status"
            options={STATUS_OPTS}
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
          />
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <p className="text-gray-400 text-sm">Cargando...</p>
      )}

      {/* Estado de error */}
      {!loading && apiErr && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{apiErr}</p>
        </div>
      )}

      {/* Tabla */}
      {!loading && !apiErr && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {users.length === 0 ? (
            <p className="text-gray-400 text-sm px-4 py-6 text-center">
              No se encontraron usuarios con los filtros aplicados.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Correo</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Registro</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {fullName(user)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {user.person?.phone ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEdit(user)}
                            className="text-xs text-blue-500 hover:underline"
                          >
                            Editar
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => openResetPassword(user)}
                              className="text-xs text-amber-500 hover:underline"
                            >
                              Contraseña
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="text-xs px-3 py-1.5"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="text-xs px-3 py-1.5"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal de cambio de contraseña (super_admin) */}
      <Modal
        open={!!pwTarget}
        onClose={() => setPwTarget(null)}
        title={`Cambiar contraseña — ${pwTarget ? fullName(pwTarget) : ''}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-3">
          <Input
            id="pw-new"
            label="Nueva contraseña"
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => { setPwForm((p) => ({ ...p, newPassword: e.target.value })); setPwErrors((p) => ({ ...p, newPassword: '' })) }}
            error={pwErrors.newPassword}
          />
          <Input
            id="pw-confirm"
            label="Confirmar contraseña"
            type="password"
            value={pwForm.confirmPassword}
            onChange={(e) => { setPwForm((p) => ({ ...p, confirmPassword: e.target.value })); setPwErrors((p) => ({ ...p, confirmPassword: '' })) }}
            error={pwErrors.confirmPassword}
          />
          {pwErr && <p className="text-xs text-red-500">{pwErr}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={pwSaving}>
              {pwSaving ? 'Guardando...' : 'Cambiar contraseña'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setPwTarget(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de edición */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar usuario"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                id="edit-firstName"
                label="Nombre"
                value={form.firstName ?? ''}
                onChange={(e) => {
                  setForm((p) => ({ ...p, firstName: e.target.value }))
                  setFormErrors((p) => ({ ...p, firstName: '' }))
                }}
                error={formErrors.firstName}
              />
            </div>
            <div className="flex-1">
              <Input
                id="edit-lastName"
                label="Apellido"
                value={form.lastName ?? ''}
                onChange={(e) => {
                  setForm((p) => ({ ...p, lastName: e.target.value }))
                  setFormErrors((p) => ({ ...p, lastName: '' }))
                }}
                error={formErrors.lastName}
              />
            </div>
          </div>

          <Input
            id="edit-email"
            label="Correo electrónico"
            type="email"
            value={form.email ?? ''}
            onChange={(e) => {
              setForm((p) => ({ ...p, email: e.target.value }))
              setFormErrors((p) => ({ ...p, email: '' }))
            }}
            error={formErrors.email}
          />

          <Input
            id="edit-phone"
            label="Teléfono"
            value={form.phone ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />

          {/* Toggle isActive */}
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium text-gray-700">Cuenta activa</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                form.isActive ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {saveErr && <p className="text-xs text-red-500">{saveErr}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
