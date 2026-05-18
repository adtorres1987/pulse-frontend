import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function AppHeader() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/login')
  }

  const firstName = profile?.person?.firstName ?? ''
  const lastName = profile?.person?.lastName ?? ''
  const displayName = firstName || lastName
    ? `${firstName} ${lastName}`.trim()
    : (user?.email ?? 'Usuario')
  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : displayName[0]?.toUpperCase() ?? 'U'

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    support: 'Soporte',
    user: 'Usuario',
  }

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
      {/* Left — intentionally empty; space for future breadcrumbs */}
      <div />

      {/* Right — user dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-lg p-1 text-gray-700 transition-colors hover:bg-gray-100"
        >
          {/* Avatar */}
          {profile?.person?.avatarUrl ? (
            <img
              src={profile.person.avatarUrl}
              alt={displayName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#465fff] text-sm font-semibold text-white select-none">
              {initials}
            </span>
          )}

          {/* Name + role */}
          <div className="hidden text-left lg:block">
            <p className="text-sm font-medium leading-tight text-gray-800">{displayName}</p>
            {user?.role && (
              <p className="text-xs text-gray-500">{roleLabel[user.role] ?? user.role}</p>
            )}
          </div>

          {/* Chevron */}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown panel */}
        {open && (
          <div className="absolute right-0 top-full mt-3 flex w-64 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
            {/* User info */}
            <div className="flex items-center gap-3 border-b border-gray-100 px-2 pb-3 pt-1">
              {profile?.person?.avatarUrl ? (
                <img
                  src={profile.person.avatarUrl}
                  alt={displayName}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#465fff] text-base font-semibold text-white select-none">
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-800">{displayName}</p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* Links */}
            <div className="py-2">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Editar perfil
              </Link>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 pt-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
