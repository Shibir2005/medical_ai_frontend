'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Shield, AlertCircle, ChevronRight } from 'lucide-react'
import { authService } from '@/services/api'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Both fields are required.')
      return
    }
    setLoading(true)
    try {
     const apiData = {
             email, password
           }
           await authService.login(apiData);
      router.push('/admin/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex overflow-hidden">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-14 overflow-hidden">
        {/* Geometric grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,212,180,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,180,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Corner accent lines */}
        <div className="absolute top-0 left-0 w-48 h-px bg-linear-to-r from-teal-400/60 to-transparent" />
        <div className="absolute top-0 left-0 w-px h-48 bg-linear-to-b from-teal-400/60 to-transparent" />
        <div className="absolute bottom-0 right-0 w-48 h-px bg-linear-to-l from-teal-400/20 to-transparent" />
        <div className="absolute bottom-0 right-0 w-px h-48 bg-linear-to-t from-teal-400/20 to-transparent" />

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 border border-teal-400/40 flex items-center justify-center"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            <Shield className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <span className="text-white font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif', fontSize: '18px' }}>
              MedPredict<span className="text-teal-400">AI</span>
            </span>
            <div className="text-[10px] text-teal-400/60 tracking-[0.2em] uppercase font-mono">Admin Console</div>
          </div>
        </div>

        {/* Central visual — abstract data viz */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="relative w-72 h-72">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border border-teal-400/10" />
            <div className="absolute inset-4 rounded-full border border-teal-400/15" />
            <div className="absolute inset-8 rounded-full border border-teal-400/20" />

            {/* Animated orbit dot */}
            {mounted && (
              <>
                <div className="absolute inset-0 rounded-full"
                  style={{ animation: 'spin 8s linear infinite' }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-teal-400 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
                </div>
                <div className="absolute inset-4 rounded-full"
                  style={{ animation: 'spin 12s linear infinite reverse' }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-300 rounded-full shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
                </div>
              </>
            )}

            {/* Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-white font-mono mb-1">94.7<span className="text-teal-400 text-2xl">%</span></div>
                <div className="text-[10px] text-slate-500 tracking-[0.15em] uppercase">Model AUC-ROC</div>
              </div>
            </div>

            {/* Data points around the ring */}
            {[
              { angle: 45, label: 'Users', val: '312', color: 'text-teal-300' },
              { angle: 135, label: 'Active Q', val: '3', color: 'text-cyan-300' },
              { angle: 225, label: 'Analyses', val: '47', color: 'text-slate-300' },
              { angle: 315, label: 'Alerts', val: '8', color: 'text-amber-300' },
            ].map(({ angle, label, val, color }) => {
              const rad = (angle - 90) * Math.PI / 180
              const r = 148
              const x = 144 + r * Math.cos(rad)
              const y = 144 + r * Math.sin(rad)
              return (
                <div
                  key={label}
                  className="absolute text-center"
                  style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`text-xs font-bold font-mono ${color}`}>{val}</div>
                  <div className="text-[9px] text-slate-600 uppercase tracking-wider">{label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom copy */}
        <div className="relative z-10 space-y-1">
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs" style={{ fontFamily: 'Georgia, serif' }}>
            Centralised control over prediction models, patient questionnaires, and clinical data pipelines.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <div className="w-8 h-px bg-teal-400/40" />
            <span className="text-xs text-slate-600 font-mono tracking-widest uppercase">Restricted Access</span>
          </div>
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 relative">
        {/* Vertical rule on left edge (large screens only) */}
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-teal-400/20 to-transparent" />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-12">
          <Shield className="w-5 h-5 text-teal-400" />
          <span className="text-white font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            MedPredict<span className="text-teal-400">AI</span>
          </span>
          <span className="text-xs text-slate-600 font-mono ml-1">ADMIN</span>
        </div>

        <div className="max-w-sm w-full">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-6 bg-teal-400" />
              <span className="text-xs font-mono text-teal-400 tracking-[0.2em] uppercase">Secure Login</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.5px' }}>
              Admin Access
            </h1>
            <p className="text-slate-500 text-sm">Authorised personnel only. All sessions are logged.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-950/40 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-500 tracking-widest uppercase">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@medpredict.ai"
                autoComplete="email"
                className="w-full bg-white/3 border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm placeholder:text-slate-700 focus:outline-none focus:border-teal-400/50 focus:bg-white/5 transition-all font-mono"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-500 tracking-widest uppercase">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white/3 border border-white/10 rounded-lg px-4 py-3.5 pr-12 text-white text-sm placeholder:text-slate-700 focus:outline-none focus:border-teal-400/50 focus:bg-white/5 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-teal-500 hover:bg-teal-400 disabled:bg-teal-500/40 text-white font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-2"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Console
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-10 pt-6 border-t border-white/5">
            <p className="text-xs text-slate-700 font-mono text-center">
              MEDPREDICT·AI ADMIN CONSOLE · v2.4.1
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}