// 设计提醒：登录页是交易后台入口，采用深色安全终端风格，突出账户、角色和访问安全感。
import { useState, type FormEvent } from 'react'
import { LockKeyhole, ShieldAlert, ShieldCheck, TrendingUp } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { getApiErrorMessage } from '@/services/api'

export default function Login() {
  const [, navigate] = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('123456')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await login({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
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
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">现在登录页已经接上 backend 的真实用户与 token 认证，不再是前端本地模拟。</p>
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-3">
            {['真实注册登录', 'Bearer Token 会话', '菜单权限过滤'].map((item) => (
              <div key={item} className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">{item}</div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-5">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300 ring-1 ring-cyan-400/20"><LockKeyhole className="h-7 w-7" /></div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">登录交易后台</h2>
                <p className="text-sm text-slate-400">默认管理员账号会在后端自动初始化</p>
              </div>
            </div>

            <label className="mb-4 block space-y-2 text-sm font-medium text-slate-300">
              <span>邮箱</span>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
              />
            </label>
            <label className="mb-4 block space-y-2 text-sm font-medium text-slate-300">
              <span>密码</span>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
              />
            </label>

            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              <ShieldCheck className="h-5 w-5" />
              {submitting ? '登录中...' : '进入后台'}
            </button>
            <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
              <span>还没有账号？</span>
              <Link href="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">创建账号</Link>
            </div>
          </form>
        </section>
      </div>
      <div className="pointer-events-none fixed bottom-6 left-6 hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm text-slate-300 lg:flex"><TrendingUp className="h-4 w-4 text-emerald-300" /> BTC/USDT 模拟行情在线</div>
    </main>
  )
}
