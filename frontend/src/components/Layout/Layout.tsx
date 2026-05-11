// 设计提醒：主布局强调“左侧稳定导航 + 右侧高密度内容”，侧边栏折叠时要同步调整内容偏移。
import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import Sidebar from './Sidebar'
import Header from './Header'

const titles: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/exchange': '买卖交易',
  '/positions': '持仓管理',
  '/orders': '订单管理',
  '/assets': '资产',
  '/trades': '成交记录',
  '/research': '研报中心',
  '/news': '新闻资讯',
  '/users': '用户/权限管理',
  '/': '仪表盘',
}

type LayoutProps = { children: React.ReactNode }

export default function Layout({ children }: LayoutProps) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [location] = useLocation()
  const title = useMemo(() => titles[location] ?? '仪表盘', [location])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Sidebar open={open} collapsed={collapsed} onClose={() => setOpen(false)} onToggleCollapse={() => setCollapsed((value) => !value)} />
      {open && <div className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className={`transition-[padding] duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Header title={title} onMenuClick={() => setOpen(true)} />
        <main className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_28%),linear-gradient(180deg,#f8fafc,#f1f5f9)] p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
