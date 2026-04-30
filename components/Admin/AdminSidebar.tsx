'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  ClipboardList,
  Users,
  LayoutDashboard,
  Layers,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { authService } from '@/services/api'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/admin/dashboard/questionnaires', label: 'Questionnaires', icon: ClipboardList },
      { href: '/admin/dashboard/users', label: 'Users', icon: Users },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await authService.logout()
      router.push('/admin')
    } catch {
      router.push('/admin')
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-slate-950 border-r border-slate-800/60 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800/60">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none font-display">
              MedPredict<span className="text-teal-400">AI</span>
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5 uppercase tracking-widest">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = href === '/admin/dashboard'
                    ? pathname === '/admin/dashboard'
                    : pathname === href || pathname.startsWith(href + '/')
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                        active
                          ? 'bg-teal-500/12 text-teal-300 border border-teal-500/20'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active ? 'text-teal-400' : 'text-slate-600 group-hover:text-slate-400'
                        }`}
                      />
                      <span className="flex-1">{label}</span>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-800/60 space-y-0.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/8 border border-transparent transition-all group"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-600 group-hover:text-red-400 transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}