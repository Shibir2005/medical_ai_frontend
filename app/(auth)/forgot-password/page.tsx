'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { AuthCard, AuthInput, AuthButton, AuthAlert } from '@/components/AuthCard'
import { api } from '@/services/api'

type Step = 'email' | 'otp' | 'password' | 'done'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password/', { email })
      setStep('otp')
    } catch (err: unknown) {
      // For demo, proceed anyway
      setStep('otp')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const code = otp.join('')
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP.')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password/verify-otp/', { email, otp: code })
      setStep('password')
    } catch (err: unknown) {
      setStep("otp")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password/reset-password/', { email, new_password: password, confirm_password: confirmPassword })
      setStep('done')
    } catch (err: unknown) {
      setStep('password')
    } finally {
      setLoading(false)
    }
  }

  const stepTitles: Record<Step, { title: string; subtitle: string }> = {
    email: { title: 'Reset your password', subtitle: "Enter your email and we'll send you a one-time code" },
    otp: { title: 'Enter verification code', subtitle: `We sent a 6-digit code to ${email}` },
    password: { title: 'Set new password', subtitle: 'Choose a strong password for your account' },
    done: { title: 'Password updated!', subtitle: 'Your password has been successfully changed' },
  }

  return (
    <AuthCard title={stepTitles[step].title} subtitle={stepTitles[step].subtitle}>
      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-6">
        {(['email', 'otp', 'password'] as const).map((s, i) => (
          <div
            key={s}
            className={`h-1 rounded-full flex-1 transition-all duration-500 ${
              step === 'done' || (['email', 'otp', 'password'] as const).indexOf(step) >= i
                ? 'bg-teal-500'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {error && <AuthAlert type="error" message={error} />}
          <AuthInput
            label="Email address"
            type="email"
            placeholder="you@hospital.org"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
          <div className="pt-2">
            <AuthButton loading={loading}>Send OTP Code</AuthButton>
          </div>
          <div className="flex items-center justify-center">
            <Link href="/login" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </Link>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-6">
          {error && <AuthAlert type="error" message={error} />}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">6-Digit OTP</label>
            <div className="flex gap-2 justify-between">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold text-white bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              Didn&apos;t receive a code?{' '}
              <button
                type="button"
                onClick={() => { setError(''); setOtp(['', '', '', '', '', '']) }}
                className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
              >
                Resend
              </button>
            </p>
          </div>

          <AuthButton loading={loading}>Verify Code</AuthButton>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setStep('email')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Use a different email
            </button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {error && <AuthAlert type="error" message={error} />}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <AuthInput
            label="Confirm new password"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />

          <div className="pt-2">
            <AuthButton loading={loading}>Update Password</AuthButton>
          </div>
        </form>
      )}

      {step === 'done' && (
        <div className="text-center py-4 space-y-6">
          <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-teal-400" />
          </div>
          <div className="space-y-2">
            <p className="text-white font-medium">You&apos;re all set!</p>
            <p className="text-slate-400 text-sm">Your password has been updated. You can now sign in with your new credentials.</p>
          </div>
          <Link
            href="/login"
            className="block w-full bg-teal-500 hover:bg-teal-400 text-white font-semibold py-3 rounded-xl transition-all text-center shadow-lg shadow-teal-500/20"
          >
            Go to Sign In
          </Link>
        </div>
      )}
    </AuthCard>
  )
}