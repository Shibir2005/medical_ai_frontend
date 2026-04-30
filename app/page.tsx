'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Activity, Brain, Shield, TrendingUp, ChevronRight, Heart, Zap, Database, BarChart2, Menu, X } from 'lucide-react'

const stats = [
  { label: 'Prediction Accuracy', value: '94.7%', icon: TrendingUp },
  { label: 'Diseases Covered', value: '12+', icon: Heart },
  { label: 'Datasets Analysed', value: '50K+', icon: Database },
  { label: 'Clinical Metrics', value: '30+', icon: BarChart2 },
]

const features = [
  {
    icon: Brain,
    title: 'Multi-Algorithm Engine',
    description: 'Combines Logistic Regression, Random Forests, and Deep Neural Networks to deliver the most reliable risk assessment for each patient profile.',
  },
  {
    icon: Shield,
    title: 'Clinical-Grade Validation',
    description: 'Every model is validated using k-fold cross-validation and evaluated against AUC-ROC, precision, recall, and F1-score metrics.',
  },
  {
    icon: Zap,
    title: 'Real-Time Predictions',
    description: 'Input patient data and receive instant risk scores via our seamless web interface — no technical expertise required.',
  },
  {
    icon: Activity,
    title: 'Interpretable Results',
    description: 'Feature importance visualisations explain what drives each prediction, ensuring transparency and clinical trust in every output.',
  },
]

const diseases = ['Cardiovascular Disease', 'Type 2 Diabetes', 'Respiratory Conditions', 'Cancer Risk Screening']

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeDisease, setActiveDisease] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDisease(prev => (prev + 1) % diseases.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">MedPredict<span className="text-teal-400">AI</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How It Works</a>
            <a href="#stats" className="text-sm text-slate-400 hover:text-white transition-colors">Research</a>
            <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Get Started
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-slate-400 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col gap-4">
            <a href="#features" className="text-sm text-slate-400">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-400">How It Works</a>
            <Link href="/login" className="text-sm text-slate-300">Sign In</Link>
            <Link href="/register" className="bg-teal-500 text-white text-sm font-medium px-4 py-2 rounded-lg text-center">Get Started</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-30" />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-300 text-sm font-medium">ML-Powered Healthcare Prediction</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight">
            Predict Disease Risk
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-300 to-cyan-400">
              Before It Strikes
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
            Leveraging advanced machine learning — from Random Forests to Deep Neural Networks — to identify
            high-risk patients early and enable proactive clinical intervention.
          </p>

          {/* Rotating disease tags */}
          <div className="flex items-center justify-center gap-2 mb-10 h-8">
            <span className="text-slate-500 text-sm">Currently screening:</span>
            <span className="text-teal-300 text-sm font-medium transition-all duration-500">
              {diseases[activeDisease]}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="group bg-teal-500 hover:bg-teal-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25">
              Start Free Analysis
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
              Sign In to Dashboard
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-8 bg-linear-to-b from-transparent to-slate-600" />
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 px-6 border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-500/20 transition-colors">
                <Icon className="w-5 h-5 text-teal-400" />
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-teal-400 text-sm font-medium uppercase tracking-widest mb-3">Platform Capabilities</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Designed for Clinical Reality
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Built on peer-reviewed methodologies, our platform balances predictive accuracy with the interpretability clinicians need to trust AI-driven insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="group p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-teal-500/30 hover:bg-slate-800/50 transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-colors">
                  <Icon className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-teal-400 text-sm font-medium uppercase tracking-widest mb-3">Workflow</p>
            <h2 className="font-display text-4xl font-bold text-white">From Data to Decision in Seconds</h2>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-800 md:left-1/2" />
            {[
              { step: '01', title: 'Input Patient Data', desc: 'Enter demographic, clinical, and physiological parameters into the secure interface.' },
              { step: '02', title: 'Preprocessing Pipeline', desc: 'Automatic normalisation, missing-value imputation, and SMOTE-based class balancing.' },
              { step: '03', title: 'Model Inference', desc: 'Ensemble of trained ML models generates probability scores across disease categories.' },
              { step: '04', title: 'Interpret & Act', desc: 'Review risk scores, feature importance charts, and recommended follow-up actions.' },
            ].map((item, i) => (
              <div key={item.step} className={`relative flex gap-8 mb-12 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className="shrink-0 w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center z-10 text-sm font-bold text-white font-mono">
                  {item.step}
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1 hover:border-teal-500/30 transition-colors">
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-linear-to-br from-teal-900/50 to-slate-900 border border-teal-500/20 rounded-3xl p-12">
            <h2 className="font-display text-4xl font-bold text-white mb-4">Ready to Predict Risk?</h2>
            <p className="text-slate-400 mb-8">Join clinicians and researchers using MedPredict AI to deliver earlier, better-informed care.</p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/25">
              Create Free Account <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-teal-500 flex items-center justify-center">
              <Activity className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-display font-bold">MedPredict<span className="text-teal-400">AI</span></span>
          </div>
          <p className="text-slate-600 text-xs text-center">
            For research and decision-support purposes only. Not a substitute for professional medical advice.
          </p>
          <div className="flex gap-4">
            <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Sign In</Link>
            <Link href="/register" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}