'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail } from 'lucide-react'
import { AuthCard, AuthInput, AuthButton, AuthAlert } from "@/components/AuthCard"
import { api } from '@/services/api'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.username.trim()) e.username = 'Username is required'
    else if (form.username.length < 3) e.username = 'Username must be at least 3 characters'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      await api.post('/api/auth/register/', {
        username: form.username,
        email: form.email,
        password: form.password,
      })
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle="A verification link has been sent to your email"
      >
        <div className="text-center py-4 space-y-6">
          <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-teal-400" />
          </div>

          <div className="space-y-2">
            <p className="text-white font-medium">Email verification sent!</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              We sent a verification link to{' '}
              <span className="text-teal-300 font-medium">{form.email}</span>.
              Click the link in your email to activate your account.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Didn&apos;t receive it?</p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure <span className="text-slate-300">{form.email}</span> is correct</li>
              <li>• Allow up to 5 minutes for delivery</li>
            </ul>
          </div>

          <p className="text-sm text-slate-500">
            Already verified?{' '}
            <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join thousands of clinicians using AI-powered risk prediction"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AuthAlert type="error" message={error} />}

        <AuthInput
          label="Username"
          type="text"
          placeholder="dr.smith"
          value={form.username}
          onChange={handleChange('username')}
          error={errors.username}
          autoComplete="username"
        />

        <AuthInput
          label="Email address"
          type="email"
          placeholder="you@hospital.org"
          value={form.email}
          onChange={handleChange('email')}
          error={errors.email}
          autoComplete="email"
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange('password')}
              autoComplete="new-password"
              className={`w-full bg-slate-800 border rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${errors.password ? 'border-red-500/50' : 'border-slate-700 hover:border-slate-600'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
        </div>

        <AuthInput
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <div className="pt-2">
          <AuthButton loading={loading}>Create Account</AuthButton>
        </div>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}