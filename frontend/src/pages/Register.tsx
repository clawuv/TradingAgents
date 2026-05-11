// 设计提醒：注册页作为模板辅助页，保持安全、简洁，并提示这是演示创建流程。
import { useState, type FormEvent } from 'react'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { type RoleKey } from '@/mock/permission'

export default function Register() {
  const [, navigate] = useLocation()
  const { login } = useAuth()
  const [role] = useState<RoleKey>('auditor')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    login(role)
    navigate('/dashboard', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_28%),linear-gradient(135deg,#020617,#0f172a)] p-5 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/85 p-7 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-cyan-300"><ArrowLeft className="h-4 w-4" />返回登录</Link>
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300 ring-1 ring-emerald-400/20"><UserPlus className="h-7 w-7" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">注册演示账号</h1>
            <p className="mt-1 text-sm text-slate-400">默认创建为“审计员”只读角色，可登录后在顶部切换角色体验权限差异。</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-300"><span>姓名</span><input className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" defaultValue="演示用户" /></label>
          <label className="space-y-2 text-sm font-medium text-slate-300"><span>手机号</span><input className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" defaultValue="13800000000" /></label>
        </div>
        <label className="mt-4 block space-y-2 text-sm font-medium text-slate-300"><span>邮箱</span><input type="email" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" defaultValue="demo@example.com" /></label>
        <label className="mt-4 block space-y-2 text-sm font-medium text-slate-300"><span>密码</span><input type="password" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" defaultValue="123456" /></label>
        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">注册成功后将进入后台，默认角色为审计员，菜单和按钮权限会受到限制。</div>
        <button className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:-translate-y-0.5 hover:bg-emerald-300" type="submit">创建并进入后台</button>
      </form>
    </main>
  )
}
