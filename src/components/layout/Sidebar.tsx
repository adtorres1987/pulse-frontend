import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', adminOnly: false },
  { to: '/transactions', label: 'Transacciones', icon: '💸', adminOnly: false },
  { to: '/saving-goals', label: 'Metas de ahorro', icon: '🎯', adminOnly: false },
  { to: '/habits', label: 'Hábitos', icon: '✅', adminOnly: false },
  { to: '/snapshots', label: 'Snapshots', icon: '🧠', adminOnly: false },
  { to: '/categories', label: 'Categorías', icon: '🏷️', adminOnly: true },
  { to: '/roles', label: 'Roles y permisos', icon: '🔐', adminOnly: true },
  { to: '/admin/users', label: 'Usuarios', icon: '👥', adminOnly: true },
  { to: '/investment-profiles', label: 'Inversiones', icon: '📈', adminOnly: false },
  { to: '/profile', label: 'Perfil', icon: '👤', adminOnly: false },
]

export function Sidebar() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <img src={logo} alt="Pulso" className="h-8" />
        {profile?.person && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {profile.person.firstName} {profile.person.lastName}
          </p>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <span>🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
