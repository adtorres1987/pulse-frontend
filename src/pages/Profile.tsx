import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateMe, changePassword } from '../api'
import { updateProfileSchema, changePasswordSchema, type UpdateProfileForm, type ChangePasswordForm } from '../schemas'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Profile() {
  const { profile, refreshProfile } = useAuth()

  const [profileForm, setProfileForm] = useState<UpdateProfileForm>({
    firstName: profile?.person?.firstName ?? '',
    lastName: profile?.person?.lastName ?? '',
    phone: profile?.person?.phone ?? '',
    birthDate: profile?.person?.birthDate?.slice(0, 10) ?? '',
    country: profile?.person?.country ?? '',
  })
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof UpdateProfileForm, string>>>({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileOk, setProfileOk] = useState('')
  const [profileApiErr, setProfileApiErr] = useState('')

  const [pwForm, setPwForm] = useState<ChangePasswordForm>({ currentPassword: '', newPassword: '' })
  const [pwErrors, setPwErrors] = useState<Partial<Record<keyof ChangePasswordForm, string>>>({})
  const [pwSaving, setPwSaving] = useState(false)
  const [pwOk, setPwOk] = useState('')
  const [pwApiErr, setPwApiErr] = useState('')

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileOk('')
    setProfileApiErr('')
    const result = updateProfileSchema.safeParse(profileForm)
    if (!result.success) {
      const fe: typeof profileErrors = {}
      result.error.issues.forEach((e) => { fe[e.path[0] as keyof UpdateProfileForm] = e.message })
      setProfileErrors(fe)
      return
    }
    try {
      setProfileSaving(true)
      await updateMe(result.data)
      await refreshProfile()
      setProfileOk('Perfil actualizado.')
    } catch {
      setProfileApiErr('Error al actualizar')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePwSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwOk('')
    setPwApiErr('')
    const result = changePasswordSchema.safeParse(pwForm)
    if (!result.success) {
      const fe: typeof pwErrors = {}
      result.error.issues.forEach((e) => { fe[e.path[0] as keyof ChangePasswordForm] = e.message })
      setPwErrors(fe)
      return
    }
    try {
      setPwSaving(true)
      await changePassword(result.data.currentPassword, result.data.newPassword)
      setPwForm({ currentPassword: '', newPassword: '' })
      setPwOk('Contraseña actualizada.')
    } catch {
      setPwApiErr('Contraseña actual incorrecta')
    } finally {
      setPwSaving(false)
    }
  }

  function setP(field: keyof UpdateProfileForm, value: string) {
    setProfileForm((p) => ({ ...p, [field]: value }))
    setProfileErrors((p) => ({ ...p, [field]: '' }))
  }

  function setPw(field: keyof ChangePasswordForm, value: string) {
    setPwForm((p) => ({ ...p, [field]: value }))
    setPwErrors((p) => ({ ...p, [field]: '' }))
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-bold text-gray-900">Perfil</h2>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Información personal</h3>
        <form onSubmit={handleProfileSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input id="firstName" label="Nombre" value={profileForm.firstName ?? ''} onChange={(e) => setP('firstName', e.target.value)} error={profileErrors.firstName} />
            <Input id="lastName" label="Apellido" value={profileForm.lastName ?? ''} onChange={(e) => setP('lastName', e.target.value)} error={profileErrors.lastName} />
          </div>
          <Input id="phone" label="Teléfono" value={profileForm.phone ?? ''} onChange={(e) => setP('phone', e.target.value)} />
          <Input id="birthDate" label="Fecha de nacimiento" type="date" value={profileForm.birthDate ?? ''} onChange={(e) => setP('birthDate', e.target.value)} />
          <Input id="country" label="País" value={profileForm.country ?? ''} onChange={(e) => setP('country', e.target.value)} />
          {profileApiErr && <p className="text-xs text-red-500">{profileApiErr}</p>}
          {profileOk && <p className="text-xs text-green-600">{profileOk}</p>}
          <Button type="submit" disabled={profileSaving}>{profileSaving ? 'Guardando...' : 'Guardar cambios'}</Button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Cambiar contraseña</h3>
        <form onSubmit={handlePwSubmit} className="space-y-3">
          <Input id="currentPassword" label="Contraseña actual" type="password" value={pwForm.currentPassword}
            onChange={(e) => setPw('currentPassword', e.target.value)} error={pwErrors.currentPassword} />
          <Input id="newPassword" label="Nueva contraseña" type="password" value={pwForm.newPassword}
            onChange={(e) => setPw('newPassword', e.target.value)} error={pwErrors.newPassword} />
          {pwApiErr && <p className="text-xs text-red-500">{pwApiErr}</p>}
          {pwOk && <p className="text-xs text-green-600">{pwOk}</p>}
          <Button type="submit" disabled={pwSaving}>{pwSaving ? 'Guardando...' : 'Cambiar contraseña'}</Button>
        </form>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 space-y-1">
        <p><span className="font-medium">Email:</span> {profile?.email}</p>
        <p><span className="font-medium">Idioma:</span> {profile?.language}</p>
        <p><span className="font-medium">Zona horaria:</span> {profile?.timezone}</p>
      </div>
    </div>
  )
}
