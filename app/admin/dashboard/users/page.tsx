'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, Search, X, Check, Loader2, AlertCircle,
  ArrowLeft, Activity, Users, Shield, ShieldOff, UserX, UserCheck,
  Ban, ChevronDown, Mail, Phone, Calendar, Hash, MoreHorizontal,
  RefreshCw, UserPlus, Crown, Eye, EyeOff
} from 'lucide-react'
import Link from 'next/link'
import { adminService } from '@/services/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  user_id: string
  first_name: string
  last_name: string
  email: string
  username: string
  is_admin: boolean
  is_active: boolean
  is_banned: boolean
  date_joined: string
}

interface DashboardStats {
  total_users: number
  total_active_users: number
  total_banned_users: number
  total_admin_users: number
  total_draft_questions: number
  total_assessment_types: number
}

interface CreateUserPayload {
  first_name: string
  last_name: string
  email: string
  username: string
  phone_number: string
  is_admin: boolean
  is_active: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  } catch { return iso }
}

const getInitials = (user: User) => {
  if (user.first_name || user.last_name) {
    return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.username?.[0]?.toUpperCase() || '?'
  }
  return user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'
}

const getDisplayName = (user: User) => {
  if (user.first_name || user.last_name) {
    return `${user.first_name} ${user.last_name}`.trim()
  }
  return user.username || user.email
}

const AVATAR_COLORS = [
  'from-teal-500 to-teal-600',
  'from-violet-500 to-violet-600',
  'from-blue-500 to-blue-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-emerald-500 to-emerald-600',
  'from-orange-500 to-orange-600',
  'from-cyan-500 to-cyan-600',
]

const getAvatarColor = (id: string) => {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

function StatusBadge({ user }: { user: User }) {
  if (user.is_banned) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">
        <Ban className="w-3 h-3" /> Banned
      </span>
    )
  }
  if (!user.is_active) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-slate-600/20 text-slate-500 border-slate-600/20">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Inactive
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-teal-500/10 text-teal-400 border-teal-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Active
    </span>
  )
}

function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  if (!isAdmin) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
      <Crown className="w-3 h-3" /> Admin
    </span>
  )
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatsCards({ stats }: { stats: DashboardStats | null }) {
  const cards = [
    { label: 'Total Users', value: stats?.total_users ?? '—', color: 'text-white', icon: Users },
    { label: 'Active', value: stats?.total_active_users ?? '—', color: 'text-teal-400', icon: UserCheck },
    { label: 'Banned', value: stats?.total_banned_users ?? '—', color: 'text-red-400', icon: Ban },
    { label: 'Admins', value: stats?.total_admin_users ?? '—', color: 'text-amber-400', icon: Crown },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">{c.label}</span>
            <c.icon className={`w-4 h-4 ${c.color} opacity-60`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${c.color}`}>{c.value}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Create User Modal ────────────────────────────────────────────────────────

function CreateUserModal({
  onSave,
  onCancel,
}: {
  onSave: (user: User) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<CreateUserPayload>({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone_number: '',
    is_admin: false,
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const validate = () => {
    if (!form.email.trim()) return 'Email is required.'
    if (!form.username.trim()) return 'Username is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setSaving(true)
    try {
      const result = await adminService.createUser(form)
      toast.success('User created successfully')
      onSave(result.data)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Something went wrong. Please try again.'
      setError(msg)
      toast.error('Failed to create user.')
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between sticky top-0 bg-slate-900 pb-2">
          <div>
            <h3 className="text-base font-semibold text-white">
              Create New User
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add a new user to the platform
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                First Name
              </label>

              <input
                value={form.first_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, first_name: e.target.value }))
                }
                placeholder="John"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5"
              />
            </div>

             <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                Last Name
              </label>

              <input
                value={form.last_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, last_name: e.target.value }))
                }
                placeholder="Doe"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5"
              />
            </div>
          </div>

           <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                Email <span className="text-red-400">*</span>
              </label>

              <input
               type='email'
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="john@example.com"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5"
              />
            </div>
         <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                Username <span className="text-red-400">*</span>
              </label>

              <input
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                placeholder="john_doe"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5"
              />
            </div>
           <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                Phone Number
              </label>

              <input
                value={form.phone_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone_number: e.target.value }))
                }
                placeholder="9800000000"
                type="tel"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5"
              />
            </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                Role
              </label>
              <div className="flex gap-3">
                {[
                  { val: false, label: "User" },
                  { val: true, label: "Admin" },
                ].map((opt) => (
                  <label
                    key={String(opt.val)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="is_admin"
                      checked={form.is_admin === opt.val}
                      onChange={() =>
                        setForm((f) => ({ ...f, is_admin: opt.val }))
                      }
                      className="accent-teal-500"
                    />
                    <span className="text-sm text-slate-300">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                Status
              </label>
              <div className="flex gap-3">
                {[
                  { val: true, label: "Active" },
                  { val: false, label: "Inactive" },
                ].map((opt) => (
                  <label
                    key={String(opt.val)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="is_active"
                      checked={form.is_active === opt.val}
                      onChange={() =>
                        setForm((f) => ({ ...f, is_active: opt.val }))
                      }
                      className="accent-teal-500"
                    />
                    <span className="text-sm text-slate-300">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-500/50 text-white text-sm font-semibold transition-all shadow-lg shadow-teal-500/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Action Confirm Modal ─────────────────────────────────────────────────────

function ActionConfirm({
  title,
  subtitle,
  confirmLabel,
  confirmClass,
  icon: Icon,
  onConfirm,
  onCancel,
}: {
  title: string
  subtitle: string
  confirmLabel: string
  confirmClass: string
  icon: React.ElementType
  onConfirm: () => Promise<void>
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-all">
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${confirmClass}`}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Working...</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── User Detail Drawer ───────────────────────────────────────────────────────

function UserDrawer({
  user,
  onClose,
  onBanToggle,
  onAdminToggle,
}: {
  user: User
  onClose: () => void
  onBanToggle: (user: User) => void
  onAdminToggle: (user: User) => void
}) {
  const initials = getInitials(user)
  const avatarColor = getAvatarColor(user.user_id)
  const displayName = getDisplayName(user)

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border-l border-slate-800 w-full max-w-sm h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">User Details</span>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${avatarColor} flex items-center justify-center shrink-0 shadow-lg`}>
              <span className="text-xl font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white truncate">{displayName}</h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">@{user.username}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge user={user} />
                {user.is_admin && <RoleBadge isAdmin={user.is_admin} />}
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-6 space-y-4 flex-1">
          <div className="space-y-3">
            {[
              { icon: Mail, label: 'Email', value: user.email },
              { icon: Hash, label: 'User ID', value: user.user_id.slice(0, 18) + '…' },
              { icon: Calendar, label: 'Joined', value: formatDate(user.date_joined) },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                <item.icon className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm text-white font-medium truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Permissions & Status</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Active', active: user.is_active },
                { label: 'Admin', active: user.is_admin },
                { label: 'Banned', active: user.is_banned },
              ].map(p => (
                <div key={p.label} className="flex items-center gap-2 p-2.5 bg-slate-800/40 rounded-lg">
                  <span className={`w-2 h-2 rounded-full ${p.active ? 'bg-teal-400' : 'bg-slate-600'}`} />
                  <span className="text-xs text-slate-400">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-800 space-y-3">
          <button
            onClick={() => onAdminToggle(user)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              user.is_admin
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
            }`}
          >
            <Crown className="w-4 h-4" />
            {user.is_admin ? 'Remove Admin Role' : 'Grant Admin Role'}
          </button>
          <button
            onClick={() => onBanToggle(user)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              user.is_banned
                ? 'border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'
                : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
            }`}
          >
            <Ban className="w-4 h-4" />
            {user.is_banned ? 'Unban User' : 'Ban User'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow({
  user,
  onView,
  onBanToggle,
  onAdminToggle,
}: {
  user: User
  onView: () => void
  onBanToggle: () => void
  onAdminToggle: () => void
}) {
  const initials = getInitials(user)
  const avatarColor = getAvatarColor(user.user_id)
  const displayName = getDisplayName(user)

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-slate-800/30 transition-colors group">
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${avatarColor} flex items-center justify-center shrink-0 shadow`}>
        <span className="text-sm font-bold text-white">{initials}</span>
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-white text-sm truncate">{displayName}</span>
          {user.is_admin && <RoleBadge isAdmin />}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{user.email} · @{user.username}</p>
      </div>

      {/* Status */}
      <StatusBadge user={user} />

      {/* Date */}
      <span className="text-xs text-slate-500 hidden md:block whitespace-nowrap">{formatDate(user.date_joined)}</span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onView} className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="View details">
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={onAdminToggle}
          className={`p-2 rounded-lg transition-all ${user.is_admin ? 'text-amber-400 hover:bg-amber-500/10' : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'}`}
          title={user.is_admin ? 'Remove admin' : 'Make admin'}
        >
          <Crown className="w-4 h-4" />
        </button>
        <button
          onClick={onBanToggle}
          className={`p-2 rounded-lg transition-all ${user.is_banned ? 'text-teal-400 hover:bg-teal-500/10' : 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'}`}
          title={user.is_banned ? 'Unban user' : 'Ban user'}
        >
          <Ban className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type ConfirmAction = {
  type: 'ban' | 'unban' | 'make-admin' | 'remove-admin'
  user: User
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [drawerUser, setDrawerUser] = useState<User | null>(null)
  const router = useRouter()

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const res = await adminService.getDashboardStats()
      setStats(res.data)
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await adminService.getUsers()
      setUsers(res.data || [])
    } catch (err) {
      console.error('Error loading users:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadUsers()
  }, [loadStats, loadUsers])

  const handleBanToggle = async (user: User) => {
    try {
      const newBanned = !user.is_banned
      await adminService.banUser(user.user_id, { is_banned: newBanned })
      setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, is_banned: newBanned } : u))
      if (drawerUser?.user_id === user.user_id) setDrawerUser(prev => prev ? { ...prev, is_banned: newBanned } : prev)
      toast.success(newBanned ? 'User banned successfully' : 'User unbanned successfully')
      loadStats()
    } catch (err: any) {
      toast.error('Failed to update user ban status.')
    }
    setConfirmAction(null)
  }

  const handleAdminToggle = async (user: User) => {
    try {
      const newAdmin = !user.is_admin
      await adminService.userAdminRole(user.user_id, { is_admin: newAdmin })
      setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, is_admin: newAdmin } : u))
      if (drawerUser?.user_id === user.user_id) setDrawerUser(prev => prev ? { ...prev, is_admin: newAdmin } : prev)
      toast.success(newAdmin ? 'Admin role granted' : 'Admin role removed')
      loadStats()
    } catch (err: any) {
      toast.error('Failed to update admin role.')
    }
    setConfirmAction(null)
  }

  const handleUserCreated = (user: User) => {
    setUsers(prev => [user, ...prev])
    setShowCreateModal(false)
    loadStats()
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q)
    const matchRole = filterRole === 'all' || (filterRole === 'admin' ? u.is_admin : !u.is_admin)
    const matchStatus = filterStatus === 'all' || (filterStatus === 'banned' ? u.is_banned : !u.is_banned && u.is_active)
    return matchSearch && matchRole && matchStatus
  })

  const getConfirmProps = (action: ConfirmAction) => {
    const { type, user } = action
    const name = getDisplayName(user)
    if (type === 'ban') return {
      title: 'Ban this user?',
      subtitle: `${name} will lose access to the platform immediately.`,
      confirmLabel: 'Ban User',
      confirmClass: 'bg-red-500 hover:bg-red-400 disabled:bg-red-500/50',
      icon: Ban,
      onConfirm: () => handleBanToggle(user),
    }
    if (type === 'unban') return {
      title: 'Unban this user?',
      subtitle: `${name} will regain access to the platform.`,
      confirmLabel: 'Unban User',
      confirmClass: 'bg-teal-500 hover:bg-teal-400 disabled:bg-teal-500/50',
      icon: UserCheck,
      onConfirm: () => handleBanToggle(user),
    }
    if (type === 'make-admin') return {
      title: 'Grant admin role?',
      subtitle: `${name} will have full administrative access.`,
      confirmLabel: 'Grant Admin',
      confirmClass: 'bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50',
      icon: Crown,
      onConfirm: () => handleAdminToggle(user),
    }
    return {
      title: 'Remove admin role?',
      subtitle: `${name} will lose administrative privileges.`,
      confirmLabel: 'Remove Admin',
      confirmClass: 'bg-slate-600 hover:bg-slate-500 disabled:bg-slate-600/50',
      icon: ShieldOff,
      onConfirm: () => handleAdminToggle(user),
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 mr-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-sm font-bold text-white hidden sm:block">
              MedPredict<span className="text-teal-400">AI</span>
            </span>
          </Link>
          <div className="w-px h-5 bg-slate-800" />
          <Users className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-semibold text-white">User Management</span>
          <div className="flex-1" />
          <button
            onClick={() => { loadUsers(); loadStats() }}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-teal-500/20"
          >
            <UserPlus className="w-4 h-4" /> New User
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email or username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {(['all', 'admin', 'user'] as const).map(r => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filterRole === r ? 'bg-teal-500/20 text-teal-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {(['all', 'active', 'banned'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filterStatus === s ? 'bg-teal-500/20 text-teal-300' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-xs text-slate-600">
            Showing <span className="text-slate-400 font-medium">{filtered.length}</span> of {users.length} users
          </p>
        )}

        {/* Table */}
        {loading ? (
          <LoadingSpinner label="Loading users..." />
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
            <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">
              {users.length === 0 ? 'No users yet' : 'No users found'}
            </p>
            <p className="text-slate-600 text-sm mt-1">
              {users.length === 0 ? 'Create your first user to get started' : 'Try adjusting your search or filters'}
            </p>
            {users.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              >
                <UserPlus className="w-4 h-4" /> New User
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-5 py-3 border-b border-slate-800 bg-slate-800/30">
              <div className="w-9" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">User</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Status</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest hidden md:block">Joined</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Actions</span>
            </div>

            <div className="divide-y divide-slate-800">
              {filtered.map(user => (
                <UserRow
                  key={user.user_id}
                  user={user}
                  onView={() => setDrawerUser(user)}
                  onBanToggle={() => setConfirmAction({ type: user.is_banned ? 'unban' : 'ban', user })}
                  onAdminToggle={() => setConfirmAction({ type: user.is_admin ? 'remove-admin' : 'make-admin', user })}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals & Overlays */}
      {showCreateModal && (
        <CreateUserModal
          onSave={handleUserCreated}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {confirmAction && (
        <ActionConfirm
          {...getConfirmProps(confirmAction)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {drawerUser && (
        <UserDrawer
          user={drawerUser}
          onClose={() => setDrawerUser(null)}
          onBanToggle={u => {
            setDrawerUser(null)
            setConfirmAction({ type: u.is_banned ? 'unban' : 'ban', user: u })
          }}
          onAdminToggle={u => {
            setDrawerUser(null)
            setConfirmAction({ type: u.is_admin ? 'remove-admin' : 'make-admin', user: u })
          }}
        />
      )}
    </div>
  )
}