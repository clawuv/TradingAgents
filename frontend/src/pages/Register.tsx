// 设计提醒：注册页保持安全、简洁，并明确这是接到后端真实注册流程的入口。
import { useState, type FormEvent } from 'react'
import { ArrowLeft, ShieldAlert, UserPlus } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { getApiErrorMessage } from '@/services/api'

const allowedRoles = [
  { key: 'auditor', label: '审计员' },
  { key: 'finance_operator', label: '财务运营' },
  { key: 'risk_manager', label: '风控经理' },
] as const

export default function Register() {
  const [, navigate] = useLocation()
  const { register } = useAuth()
  const [name, setName] = useState('演示用户')
  const [phone, setPhone] = useState('13800000000')
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('123456')
  const [role, setRole] = useState<(typeof allowedRoles)[number]['key']>('auditor')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await register({ name, phone, email, password, role })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_28%),linear-gradient(135deg,#020617,#0f172a)] p-5 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/85 p-7 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-cyan-300"><ArrowLeft className="h-4 w-4" />返回登录</Link>
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300 ring-1 ring-emerald-400/20"><UserPlus className="h-7 w-7" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">注册账号</h1>
            <p className="mt-1 text-sm text-slate-400">注册后会自动登录，并以真实 token 进入后台。</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-300">
            <span>姓名</span>
            <input className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-300">
            <span>手机号</span>
            <input className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
        </div>
        <label className="mt-4 block space-y-2 text-sm font-medium text-slate-300">
          <span>邮箱</span>
          <input type="email" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="mt-4 block space-y-2 text-sm font-medium text-slate-300">
          <span>密码</span>
          <input type="password" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label className="mt-4 block space-y-2 text-sm font-medium text-slate-300">
          <span>默认角色</span>
          <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
            {allowedRoles.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          注册默认不开放超级管理员角色，避免把演示授权做成前端随便提权。
        </div>
        <button className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={submitting}>
          {submitting ? '创建中...' : '创建并进入后台'}
        </button>
      </form>
    </main>
  )
}
