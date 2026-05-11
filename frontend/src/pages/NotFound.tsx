// 设计提醒：404 页面同样保持交易终端风格，提供清晰返回路径，避免路由死角。
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react'
import { Link } from 'wouter'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.16),transparent_34%)]" />
      <section className="relative max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/20"><AlertTriangle className="h-10 w-10" /></div>
        <p className="text-sm uppercase tracking-[0.5em] text-cyan-300">404 / Route Missing</p>
        <h1 className="mt-5 text-6xl font-black tracking-tight">页面不存在</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-400">你访问的页面没有配置在交易后台模板中，可能是路径错误，也可能是当前模块尚未启用。</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"><Home className="h-5 w-5" />返回仪表盘</Link>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-bold text-slate-200 transition hover:bg-slate-900"><ArrowLeft className="h-5 w-5" />返回登录</Link>
        </div>
      </section>
    </main>
  )
}
