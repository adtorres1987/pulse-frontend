import { useEffect, useRef, useState } from 'react'
import { listClientUsers, updateClientUser, resetClientUserPassword } from '../api'
import type { AdminUser, AdminUserFilters, AdminUserSubscription, UpdateAdminUserData } from '../types'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { DataTable, type Column } from '../components/ui/DataTable'

const STATUS_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
]

const LANGUAGE_OPTS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
]

const TIMEZONE_OPTS = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (CST)' },
  { value: 'America/Cancun', label: 'Cancún (EST)' },
  { value: 'America/Chihuahua', label: 'Chihuahua (MST)' },
  { value: 'America/Tijuana', label: 'Tijuana (PST)' },
  { value: 'America/Bogota', label: 'Bogotá (COT)' },
  { value: 'America/Lima', label: 'Lima (PET)' },
  { value: 'America/Santiago', label: 'Santiago (CLT)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'America/New_York', label: 'Nueva York (ET)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (PT)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)' },
  { value: 'UTC', label: 'UTC' },
]

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

const STATUS_COLORS: Record<string, string> = {
  trial:     'bg-amber-100 text-amber-700',
  active:    'bg-green-100 text-green-700',
  expired:   'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  trial:     'Trial',
  active:    'Activa',
  expired:   'Expirada',
  cancelled: 'Cancelada',
}

function SubscriptionCell({ sub, groups }: { sub: AdminUserSubscription | null; groups: AdminUser['groupMemberships'] }) {
  if (!sub) return <span className="text-xs text-gray-400">—</span>

  const hasGroupDiscount = parseFloat(sub.discountPercent) > 0
  const inGroups = groups.length > 0

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-medium text-gray-800 truncate max-w-[120px]">{sub.plan.name}</span>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[sub.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {STATUS_LABELS[sub.status] ?? sub.status}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {inGroups ? (
          groups.map((gm) => (
            <span key={gm.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600">
              👥 {gm.group.name}
              {gm.role === 'owner' && <span className="text-[9px] opacity-70">(admin)</span>}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-gray-400">Individual</span>
        )}
        {hasGroupDiscount && (
          <span className="text-[10px] text-green-600 font-medium">-{sub.discountPercent}%</span>
        )}
      </div>
      <span className="text-[10px] text-gray-400">
        Vence {formatDate(sub.currentPeriodEnd)}
      </span>
    </div>
  )
}

const emptyForm = (user: AdminUser): UpdateAdminUserData => ({
  firstName: user.person?.firstName ?? '',
  lastName: user.person?.lastName ?? '',
  isActive: user.isActive,
  language: user.language as UpdateAdminUserData['language'],
  timezone: user.timezone,
})

export function AdminUsers() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [apiErr, setApiErr] = useState('')

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
      setUsers(data)
    } catch {
      setApiErr('Error al cargar los usuarios. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const filters: AdminUserFilters = {
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(statusFilter !== '' ? { isActive: statusFilter === 'true' } : {}),
    }
    load(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  // Debounce para el campo de búsqueda (400 ms)
  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const filters: AdminUserFilters = {
        ...(value.trim() ? { search: value.trim() } : {}),
        ...(statusFilter !== '' ? { isActive: statusFilter === 'true' } : {}),
      }
      load(filters)
    }, 400)
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value)
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
      const filters: AdminUserFilters = {
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

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (u) => (
        <div className="whitespace-nowrap">
          <p className="font-medium text-gray-900">{fullName(u)}</p>
          {u.role && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 mt-0.5">
              {u.role.name}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Correo',
      render: (u) => <span className="text-gray-600 whitespace-nowrap">{u.email}</span>,
    },
    {
      key: 'subscription',
      header: 'Suscripción / Grupos',
      render: (u) => <SubscriptionCell sub={u.subscription} groups={u.groupMemberships ?? []} />,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (u) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
          {u.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Registro',
      render: (u) => <span className="text-gray-500 whitespace-nowrap">{formatDate(u.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      render: (u) => (
        <div className="flex items-center justify-end gap-3">
          <button onClick={() => openEdit(u)} className="text-xs text-blue-500 hover:underline">Editar</button>
          {isSuperAdmin && (
            <button onClick={() => openResetPassword(u)} className="text-xs text-amber-500 hover:underline">Contraseña</button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usuarios clientes</h2>
          {!loading && (
            <p className="text-xs text-gray-400 mt-0.5">{users.length} usuario{users.length !== 1 ? 's' : ''} en total</p>
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

      <DataTable
        columns={columns}
        data={users}
        keyExtractor={(u) => u.id}
        loading={loading}
        error={apiErr}
        emptyMessage="No se encontraron usuarios con los filtros aplicados."
      />

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

          <div className="flex gap-3">
            <div className="flex-1">
              <Select
                id="edit-language"
                label="Idioma"
                value={form.language ?? 'es'}
                options={LANGUAGE_OPTS}
                onChange={(e) => setForm((p) => ({ ...p, language: e.target.value as UpdateAdminUserData['language'] }))}
              />
            </div>
            <div className="flex-1">
              <Select
                id="edit-timezone"
                label="Zona horaria"
                value={form.timezone ?? 'America/Mexico_City'}
                options={TIMEZONE_OPTS}
                onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
              />
            </div>
          </div>

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
