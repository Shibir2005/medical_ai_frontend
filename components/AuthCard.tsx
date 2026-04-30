'use client'

import Link from 'next/link'
import { Activity } from 'lucide-react'

interface AuthCardProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center group-hover:bg-teal-400 transition-colors">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white tracking-tight">
              MedPredict<span className="text-teal-400">AI</span>
            </span>
          </Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold text-white mb-1">{title}</h1>
            <p className="text-slate-400 text-sm">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function AuthInput({ label, error, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <input
        {...props}
        className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
          error ? 'border-red-500/50' : 'border-slate-700 hover:border-slate-600'
        }`}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  children: React.ReactNode
}

export function AuthButton({ loading, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-teal-500/50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Processing...</span>
        </>
      ) : children}
    </button>
  )
}

interface AlertProps {
  type: 'error' | 'success' | 'info'
  message: string
}

export function AuthAlert({ type, message }: AlertProps) {
  const styles = {
    error: 'bg-red-500/10 border-red-500/20 text-red-300',
    success: 'bg-teal-500/10 border-teal-500/20 text-teal-300',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
  }

  return (
    <div className={`border rounded-xl px-4 py-3 text-sm ${styles[type]}`}>
      {message}
    </div>
  )
}