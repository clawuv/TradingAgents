// 设计提醒：顶部栏为页面上下文与账户状态区，加入角色切换和退出入口，形成完整后台会话体验。
import { Bell, LogOut, Menu, Search, User } from 'lucide-react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'

type HeaderProps = { title: string; onMenuClick: () => void }

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { currentUser, roleInfo, logout } = useAuth()
  const [, navigate] = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-xl lg:px-8">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          </div>
        </div>
        <div className="hidden flex-1 justify-center md:flex">
          <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-400">
            <Search className="h-4 w-4" />
            <span className="text-sm">搜索订单、交易对、用户或资产</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          <div className="flex h-10 items-center gap-2 rounded-2xl px-2 text-slate-700 transition hover:bg-slate-100">
            <div className="text-slate-500"><User className="h-4 w-4" /></div>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">{currentUser?.name ?? roleInfo.name}</span>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            onClick={handleLogout}
            title="退出登录"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
