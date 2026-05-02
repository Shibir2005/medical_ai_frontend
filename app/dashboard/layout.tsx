'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Activity, LayoutDashboard, LogOut, User, Bell, ChevronRight, Loader2, Stethoscope, Heart, Brain, Wind, Shield, Zap, Menu, X } from 'lucide-react'
import { authService } from '@/services/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

// Icon map for common assessment types by keyword
function getAssessmentIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('cardio') || lower.includes('heart')) return Heart
  if (lower.includes('neuro') || lower.includes('brain') || lower.includes('diabetes')) return Brain
  if (lower.includes('respiratory') || lower.includes('lung') || lower.includes('breath')) return Wind
  if (lower.includes('general')) return Shield
  return Stethoscope
}

interface AssessmentType {
  reference_id: string
  name: string
  description: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    const id = searchParams.get('assessment')
    setActiveId(id)
  }, [searchParams])

  const checkAuth = async () => {
    const res: any = await authService.checkAuth()
    if (res.isAuthenticated === true) {
      fetchAssessmentTypes()
    } else {
      router.push('/login')
    }
  }

  const fetchAssessmentTypes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health/assessment-types/`, {
        credentials: 'include',
      })
      const response = await authService.getUser() 
      setProfile(response.data)
      const data = await res.json()
      setAssessmentTypes(data.data || [])
    } catch (err) {
      console.error('Failed to fetch assessment types', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      router.push('/login')
    } catch (err: any) {
      console.log(err)
    }
  }

  const handleSelectAssessment = (id: string) => {
    setActiveId(id)
    setSidebarOpen(false)
    router.push(`/dashboard?assessment=${id}`)
  }

  const handleOverview = () => {
    setActiveId(null)
    setSidebarOpen(false)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0d12] flex font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0f1318] border-r border-white/5 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              MedPredict<span className="text-teal-400">AI</span>
            </span>
          </Link>
          <button className="md:hidden text-slate-500" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {/* Overview */}
          <button
            onClick={handleOverview}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
              !activeId
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${!activeId ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span>Overview</span>
          </button>

          {/* Assessments */}
          <div className="pt-4 pb-1">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
              Assessments
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-slate-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          ) : (
            assessmentTypes.map((type) => {
              const Icon = getAssessmentIcon(type.name)
              const isActive = activeId === type.reference_id
              return (
                <button
                  key={type.reference_id}
                  onClick={() => handleSelectAssessment(type.reference_id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="truncate text-left">{type.name}</span>
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                </button>
              )
            })
          )}
        </nav>

        {/* User Section */}
        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3">
            <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name || "-"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-[#0f1318]/80 backdrop-blur-md border-b border-white/5 flex items-center px-5 gap-4 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button className="relative p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-teal-400 rounded-full" />
          </button>
          <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-teal-400" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-5 md:p-6">{children}</main>
      </div>
    </div>
  )
}