import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

const userNavItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/transactions', label: 'Transacciones', icon: '💸' },
  { to: '/saving-goals', label: 'Metas de ahorro', icon: '🎯' },
  { to: '/habits', label: 'Hábitos', icon: '✅' },
  { to: '/snapshots', label: 'Snapshots', icon: '🧠' },
  { to: '/investment-profiles', label: 'Inversiones', icon: '📈' },
]

const adminNavItems = [
  { to: '/categories', label: 'Categorías', icon: '🏷️' },
  { to: '/roles', label: 'Roles', icon: '🔐' },
  { to: '/admin/permissions', label: 'Permisos', icon: '🛡️' },
  { to: '/admin/users', label: 'Usuarios', icon: '👥' },
  { to: '/admin/subscription-plans', label: 'Planes', icon: '💳' },
  { to: '/admin/app-config', label: 'Config', icon: '⚙️' },
]

function NavItem({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-[#465fff]/10 text-[#465fff]'
            : 'text-[#8A99AF] hover:bg-[#333A48] hover:text-white'
        }`
      }
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </NavLink>
  )
}

function NavGroup({ label, items }: { label: string; items: typeof userNavItems }) {
  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-[#4B5563]">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </div>
  )
}

export function Sidebar() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-[#1C2434] min-h-screen">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[#2E3A4E] px-6">
        <img src={logo} alt="Pulso" className="h-8" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <NavGroup label="Menú" items={userNavItems} />
        {isAdmin && <NavGroup label="Admin" items={adminNavItems} />}
      </nav>
    </aside>
  )
}
