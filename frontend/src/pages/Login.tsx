// 设计提醒：登录页是交易控制台入口，采用深色安全终端风格，突出账户、角色和访问安全感。
import { useState, type FormEvent } from 'react'
import { LockKeyhole, ShieldCheck, TrendingUp } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { mockRoles, type RoleKey } from '@/mock/permission'

export default function Login() {
  const [, navigate] = useLocation()
  const { login } = useAuth()
  const [role, setRole] = useState<RoleKey>('super_admin')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    login(role)
    navigate('/dashboard', { replace: true })
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute left-[-10%] top-[-10%] h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute bottom-[-12%] right-[-8%] h-[28rem] w-[28rem] rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden border-r border-slate-800 p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Exchange Admin</p>
            <h1 className="mt-5 max-w-xl text-6xl font-black leading-tight tracking-tight">面向交易系统的后台管理终端</h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">集成行情概览、订单管理、资产核对、成交追溯和 RBAC 权限控制，适合作为交易后台模板起点。</p>
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-3">
            {['菜单权限过滤', '角色切换模拟', '路由访问守卫'].map((item) => <div key={item} className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">{item}</div>)}
          </div>
        </section>

        <section className="flex items-center justify-center p-5">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300 ring-1 ring-cyan-400/20"><LockKeyhole className="h-7 w-7" /></div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">登录交易后台</h2>
                <p className="text-sm text-slate-400">演示账号可直接进入系统</p>
              </div>
            </div>

            <label className="mb-4 block space-y-2 text-sm font-medium text-slate-300">
              <span>邮箱</span>
              <input className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" defaultValue="admin@example.com" type="email" />
            </label>
            <label className="mb-4 block space-y-2 text-sm font-medium text-slate-300">
              <span>密码</span>
              <input className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" defaultValue="123456" type="password" />
            </label>
            <label className="mb-6 block space-y-2 text-sm font-medium text-slate-300">
              <span>登录角色</span>
              <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" value={role} onChange={(e) => setRole(e.target.value as RoleKey)}>
                {mockRoles.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}
              </select>
            </label>

            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-300" type="submit"><ShieldCheck className="h-5 w-5" />进入后台</button>
            <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
              <span>还没有账号？</span>
              <Link href="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">创建演示账号</Link>
            </div>
          </form>
        </section>
      </div>
      <div className="pointer-events-none fixed bottom-6 left-6 hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm text-slate-300 lg:flex"><TrendingUp className="h-4 w-4 text-emerald-300" /> BTC/USDT 模拟行情在线</div>
    </main>
  )
}
