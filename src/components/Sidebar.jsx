import { NavLink } from 'react-router-dom'
import {
  Home,
  Activity,
  Target,
  BookOpen,
  Anchor,
  Zap,
  Newspaper,
  CalendarDays,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/health', icon: Activity, label: 'Health' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/thesis', icon: BookOpen, label: 'Thesis' },
  { to: '/sjomatradet', icon: Anchor, label: 'Sjømatrådet' },
  { to: '/elkjop', icon: Zap, label: 'Elkjøp' },
  { to: '/news', icon: Newspaper, label: 'News' },
  { to: '/weekly-review', icon: CalendarDays, label: 'Review' },
]

const activeCls =
  'bg-indigo-600/20 text-indigo-400 border-r-2 border-indigo-500'
const defaultCls =
  'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { currentUser, logout } = useAuth()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-200 h-screen sticky top-0 shrink-0 ${
          collapsed ? 'w-14' : 'w-52'
        }`}
      >
        {/* Logo / title */}
        <div className="flex items-center gap-2 px-3 py-4 border-b border-slate-700">
          {!collapsed && (
            <span className="font-bold text-slate-100 text-sm truncate flex-1">
              Dashboard
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 mx-1 my-0.5 rounded-lg text-sm font-medium transition ${
                  isActive ? activeCls : defaultCls
                }`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-slate-700 p-3">
          {!collapsed && currentUser && (
            <p className="mb-2 truncate text-xs text-slate-500">
              {currentUser.email}
            </p>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition"
            title="Sign out"
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-slate-800 border-t border-slate-700 safe-area-bottom">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition ${
                isActive ? 'text-indigo-400' : 'text-slate-500'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] leading-none">{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
