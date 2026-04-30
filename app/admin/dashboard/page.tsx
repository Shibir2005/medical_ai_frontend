'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, ClipboardList, Layers, Ban, UserCheck, Crown,
  TrendingUp, Activity, ArrowRight, Loader2, RefreshCw,
  FileQuestion, ShieldAlert, CheckCircle2, Circle
} from 'lucide-react'
import { adminService } from '@/services/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  total_users: number
  total_active_users: number
  total_banned_users: number
  total_admin_users: number
  total_draft_questions: number
  total_assessment_types: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
      <p className="text-sm text-slate-500">Loading dashboard...</p>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─── Animated Number ──────────────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) return
    const duration = 800
    const steps = 40
    const increment = value / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current = Math.min(Math.round(increment * step), value)
      setDisplay(current)
      if (step >= steps) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return <span>{display}</span>
}

// ─── Donut Chart (SVG) ────────────────────────────────────────────────────────

function DonutChart({
  segments,
  size = 120,
  thickness = 18,
}: {
  segments: { value: number; color: string; label: string }[]
  size?: number
  thickness?: number
}) {
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const total = segments.reduce((s, seg) => s + seg.value, 0)

  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={thickness} />
        <text x={cx} y={cy + 5} textAnchor="middle" fill="#475569" fontSize="12">No data</text>
      </svg>
    )
  }

  let offset = 0
  const arcs = segments.map((seg) => {
    const pct = seg.value / total
    const dash = pct * circumference
    const gap = circumference - dash
    const strokeDashoffset = circumference * (1 - offset / total) - circumference * 0.25
    offset += seg.value
    return { ...seg, dash, gap, strokeDashoffset }
  })

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0f172a" strokeWidth={thickness} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={thickness}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={arc.strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      ))}
    </svg>
  )
}

// ─── Bar Chart (SVG) ──────────────────────────────────────────────────────────

function BarChart({
  bars,
  height = 80,
}: {
  bars: { label: string; value: number; color: string }[]
  height?: number
}) {
  const max = Math.max(...bars.map(b => b.value), 1)
  const barWidth = 28
  const gap = 16
  const width = bars.length * (barWidth + gap) - gap + 16

  return (
    <svg width="100%" height={height + 24} viewBox={`0 0 ${width} ${height + 24}`} preserveAspectRatio="xMidYMid meet">
      {bars.map((bar, i) => {
        const barH = Math.max((bar.value / max) * height, bar.value > 0 ? 4 : 0)
        const x = i * (barWidth + gap)
        const y = height - barH
        return (
          <g key={i}>
            {/* bg track */}
            <rect x={x} y={0} width={barWidth} height={height} rx={6} fill="#0f172a" />
            {/* filled bar */}
            <rect x={x} y={y} width={barWidth} height={barH} rx={6} fill={bar.color} opacity={0.85} />
            {/* label */}
            <text x={x + barWidth / 2} y={height + 16} textAnchor="middle" fill="#475569" fontSize="9" fontFamily="monospace">
              {bar.label}
            </text>
            {/* value */}
            {bar.value > 0 && (
              <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">
                {bar.value}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
  href,
}: {
  label: string
  value: number
  icon: React.ElementType
  accent: string
  sub?: string
  href?: string
}) {
  const inner = (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
        {href && (
          <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
        )}
      </div>
      <div className="text-3xl font-bold font-mono text-white mb-1">
        <AnimatedNumber value={value} />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-700 mt-1">{sub}</p>}
    </div>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}

// ─── User Breakdown Card ──────────────────────────────────────────────────────

function UserBreakdownCard({ stats }: { stats: DashboardStats }) {
  const segments = [
    { label: 'Active', value: stats.total_active_users, color: '#2dd4bf' },
    { label: 'Banned', value: stats.total_banned_users, color: '#f87171' },
    { label: 'Admins', value: stats.total_admin_users, color: '#fbbf24' },
  ]

  const regularUsers = stats.total_users - stats.total_admin_users
  const activeRate = stats.total_users > 0
    ? Math.round((stats.total_active_users / stats.total_users) * 100)
    : 0

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white">User Breakdown</h3>
          <p className="text-xs text-slate-500 mt-0.5">Composition at a glance</p>
        </div>
        <Link href="/admin/dashboard/users" className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors">
          Manage <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0">
          <DonutChart segments={segments} size={120} thickness={16} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold font-mono text-white">{stats.total_users}</span>
            <span className="text-[10px] text-slate-600 uppercase tracking-widest">total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {[
            { label: 'Active users', value: stats.total_active_users, color: 'bg-teal-400' },
            { label: 'Admin users', value: stats.total_admin_users, color: 'bg-amber-400' },
            { label: 'Banned users', value: stats.total_banned_users, color: 'bg-red-400' },
            { label: 'Regular users', value: regularUsers, color: 'bg-slate-600' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${item.color}`} />
              <span className="text-xs text-slate-400 flex-1">{item.label}</span>
              <span className="text-xs font-mono font-bold text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active rate bar */}
      <div className="mt-5 pt-5 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Active rate</span>
          <span className="text-xs font-mono font-bold text-teal-400">{activeRate}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-1000"
            style={{ width: `${activeRate}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Platform Overview Card ───────────────────────────────────────────────────

function PlatformOverviewCard({ stats }: { stats: DashboardStats }) {
  const bars = [
    { label: 'Users', value: stats.total_users, color: '#2dd4bf' },
    { label: 'Active', value: stats.total_active_users, color: '#34d399' },
    { label: 'Admins', value: stats.total_admin_users, color: '#fbbf24' },
    { label: 'Banned', value: stats.total_banned_users, color: '#f87171' },
    { label: 'Types', value: stats.total_assessment_types, color: '#a78bfa' },
    { label: 'Drafts', value: stats.total_draft_questions, color: '#64748b' },
  ]

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white">Platform Overview</h3>
          <p className="text-xs text-slate-500 mt-0.5">All metrics side by side</p>
        </div>
        <Activity className="w-4 h-4 text-slate-600" />
      </div>
      <BarChart bars={bars} height={90} />
    </div>
  )
}

// ─── Quick Links ──────────────────────────────────────────────────────────────

function QuickLinks() {
  const links = [
    {
      href: '/admin/dashboard/users',
      label: 'Manage Users',
      description: 'View, ban, and assign admin roles',
      icon: Users,
      accent: 'from-teal-500/20 to-teal-600/5 border-teal-500/20',
      iconColor: 'text-teal-400',
    },
    {
      href: '/admin/dashboard/questionnaires',
      label: 'Questionnaires',
      description: 'Build and manage assessment forms',
      icon: ClipboardList,
      accent: 'from-violet-500/20 to-violet-600/5 border-violet-500/20',
      iconColor: 'text-violet-400',
    },
  ]

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-white mb-4">Quick Access</h3>
      <div className="space-y-3">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-4 p-4 rounded-xl bg-linear-to-r border ${link.accent} hover:opacity-80 transition-all group`}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900/60 flex items-center justify-center shrink-0">
              <link.icon className={`w-4 h-4 ${link.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{link.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{link.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Health Indicators ────────────────────────────────────────────────────────

function HealthCard({ stats }: { stats: DashboardStats }) {
  const checks = [
    {
      label: 'Users registered',
      ok: stats.total_users > 0,
      note: stats.total_users > 0 ? `${stats.total_users} users` : 'No users yet',
    },
    {
      label: 'Assessment types configured',
      ok: stats.total_assessment_types > 0,
      note: stats.total_assessment_types > 0 ? `${stats.total_assessment_types} types` : 'None created',
    },
    {
      label: 'No banned users',
      ok: stats.total_banned_users === 0,
      note: stats.total_banned_users === 0 ? 'All clear' : `${stats.total_banned_users} banned`,
    },
    {
      label: 'Admin coverage',
      ok: stats.total_admin_users > 0,
      note: stats.total_admin_users > 0 ? `${stats.total_admin_users} admin(s)` : 'No admins',
    },
  ]

  const passing = checks.filter(c => c.ok).length

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">System Health</h3>
          <p className="text-xs text-slate-500 mt-0.5">Quick status checks</p>
        </div>
        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
          passing === checks.length
            ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          {passing}/{checks.length} OK
        </span>
      </div>
      <div className="space-y-3">
        {checks.map(check => (
          <div key={check.label} className="flex items-center gap-3">
            {check.ok
              ? <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              : <Circle className="w-4 h-4 text-amber-400 shrink-0" />
            }
            <span className="text-sm text-slate-300 flex-1">{check.label}</span>
            <span className={`text-xs font-medium ${check.ok ? 'text-slate-600' : 'text-amber-500'}`}>
              {check.note}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true)
      const res = await adminService.getDashboardStats()
      setStats(res.data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="min-h-screen bg-slate-950">
      <LoadingSpinner />
    </div>
  )

  if (!stats) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-400 font-medium">Failed to load dashboard</p>
        <button onClick={() => load()} className="mt-3 text-sm text-teal-400 hover:text-teal-300">
          Try again
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-600 uppercase tracking-widest mb-1">{getGreeting()}</p>
            <h1 className="text-2xl font-bold text-white font-display">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">
              Here's what's happening on your platform today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <p className="text-xs text-slate-700 hidden sm:block">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-500 hover:text-white hover:border-slate-700 text-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Users"
            value={stats.total_users}
            icon={Users}
            accent="bg-teal-500/10 text-teal-400 border-teal-500/20"
            sub="All registered accounts"
            href="/admin/dashboard/users"
          />
          <StatCard
            label="Active Users"
            value={stats.total_active_users}
            icon={UserCheck}
            accent="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            sub={`${stats.total_users > 0 ? Math.round((stats.total_active_users / stats.total_users) * 100) : 0}% of total`}
          />
          <StatCard
            label="Admin Users"
            value={stats.total_admin_users}
            icon={Crown}
            accent="bg-amber-500/10 text-amber-400 border-amber-500/20"
            sub="With elevated access"
            href="/admin/dashboard/users"
          />
          <StatCard
            label="Banned Users"
            value={stats.total_banned_users}
            icon={Ban}
            accent="bg-red-500/10 text-red-400 border-red-500/20"
            sub="Restricted accounts"
            href="/admin/dashboard/users"
          />
          <StatCard
            label="Assessment Types"
            value={stats.total_assessment_types}
            icon={Layers}
            accent="bg-violet-500/10 text-violet-400 border-violet-500/20"
            sub="Questionnaire categories"
            href="/admin/dashboard/questionnaires"
          />
          <StatCard
            label="Draft Questions"
            value={stats.total_draft_questions}
            icon={FileQuestion}
            accent="bg-slate-500/10 text-slate-400 border-slate-500/20"
            sub="Unpublished questions"
          />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-4">
          <UserBreakdownCard stats={stats} />
          <PlatformOverviewCard stats={stats} />
        </div>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-2 gap-4">
          <HealthCard stats={stats} />
          <QuickLinks />
        </div>

      </div>
    </div>
  )
}