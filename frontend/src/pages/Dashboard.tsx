// 设计提醒：仪表盘是交易后台的“战情室”，用深色行情区块与清晰统计卡片制造实时掌控感。
import { useEffect, useMemo, useState } from 'react'
import { Activity, DollarSign, LineChart, ShoppingCart, TrendingUp } from 'lucide-react'
import StatCard from '@/components/common/StatCard'
import DataTable, { type Column } from '@/components/common/DataTable'
import VolumeChart from '@/components/charts/VolumeChart'
import { mockOrders, mockStats, mockVolumeData, type Order } from '@/mock/data'

const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Dashboard() {
  const [btcPrice, setBtcPrice] = useState(64218.72)
  const [change, setChange] = useState(2.38)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBtcPrice((price) => Number((price + (Math.random() - 0.48) * 42).toFixed(2)))
      setChange((value) => Number((value + (Math.random() - 0.5) * 0.08).toFixed(2)))
    }, 5000)
    return () => window.clearInterval(timer)
  }, [])

  const recentOrders = useMemo(() => mockOrders.slice(0, 5), [])
  const columns: Column<Order>[] = [
    { key: 'id', title: '订单ID', render: (row) => <span className="font-mono text-xs text-slate-600">{row.id}</span> },
    { key: 'pair', title: '交易对', render: (row) => <span className="font-semibold text-slate-900">{row.pair}</span> },
    { key: 'direction', title: '方向', render: (row) => <span className={row.direction === '买' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>{row.direction}</span> },
    { key: 'price', title: '价格', render: (row) => money(row.price) },
    { key: 'quantity', title: '数量', render: (row) => row.quantity.toFixed(2) },
    { key: 'status', title: '状态', render: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="总资产折合 USDT" value={`$${money(mockStats.totalAssets)}`} icon={DollarSign} change="较昨日 +1.86%" tone="cyan" />
        <StatCard title="今日盈亏" value={`+$${money(mockStats.todayPnl)}`} icon={TrendingUp} change="净收益率 +2.21%" tone="emerald" />
        <StatCard title="总交易量" value={`$${money(mockStats.totalVolume)}`} icon={LineChart} change="7日峰值稳定" tone="amber" />
        <StatCard title="活跃订单数" value={String(mockStats.activeOrders)} icon={ShoppingCart} change="3 条待撮合" tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <VolumeChart data={mockVolumeData} />
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
          <div className="absolute -right-16 top-8 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">模拟实时价格</p>
                <h3 className="mt-2 text-2xl font-semibold">BTC/USDT</h3>
              </div>
              <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300 ring-1 ring-emerald-400/20">
                <Activity className="h-6 w-6 animate-pulse" />
              </div>
            </div>
            <p className="mt-10 text-5xl font-bold tracking-tight">${money(btcPrice)}</p>
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <span className="text-sm text-slate-400">24h 涨跌幅</span>
              <span className="text-lg font-semibold text-emerald-300">+{change.toFixed(2)}%</span>
            </div>
            <p className="mt-4 text-xs text-slate-500">价格每 5 秒随机微调，组件卸载时会清理定时器。</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">最近 5 笔订单</h3>
            <p className="text-sm text-slate-500">快速查看最新委托与成交状态</p>
          </div>
        </div>
        <DataTable columns={columns} data={recentOrders} showPagination={false} />
      </section>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const style = status === '已完成' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : status === '部分成交' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-100 text-slate-600 ring-slate-200'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${style}`}>{status}</span>
}
