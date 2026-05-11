// 设计提醒：仪表盘是交易后台的“战情室”，用深色行情区块与清晰统计卡片制造实时掌控感。
import { useEffect, useMemo, useState } from 'react'
import { Activity, DollarSign, LineChart, ShoppingCart, TrendingUp } from 'lucide-react'
import StatCard from '@/components/common/StatCard'
import DataTable, { type Column } from '@/components/common/DataTable'
import VolumeChart from '@/components/charts/VolumeChart'
import { mockVolumeData } from '@/mock/data'
import {
  bootstrapDefaultAccount,
  createSnapshot,
  getApiErrorMessage,
  getDefaultAccount,
  getLatestSnapshot,
  getPortfolio,
  type AccountSummary,
  type PositionView,
  type SnapshotResponse,
} from '@/services/api'

const money = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Dashboard() {
  const [btcPrice, setBtcPrice] = useState(64218.72)
  const [change, setChange] = useState(2.38)
  const [account, setAccount] = useState<AccountSummary | null>(null)
  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null)
  const [positions, setPositions] = useState<PositionView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBtcPrice((price) => Number((price + (Math.random() - 0.48) * 42).toFixed(2)))
      setChange((value) => Number((value + (Math.random() - 0.5) * 0.08).toFixed(2)))
    }, 5000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError(null)

      try {
        await bootstrapDefaultAccount()

        const [accountData, portfolioData, snapshotData] = await Promise.all([
          getDefaultAccount(),
          getPortfolio(),
          getLatestSnapshot().catch(async () => createSnapshot()),
        ])

        if (cancelled) return

        setAccount(accountData)
        setPositions(portfolioData.positions)
        setSnapshot(snapshotData)
      } catch (err) {
        if (cancelled) return
        setError(getApiErrorMessage(err))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const exposureRatio = useMemo(() => {
    if (!snapshot || !snapshot.equity) return 0
    return (snapshot.gross_exposure / snapshot.equity) * 100
  }, [snapshot])

  const topPosition = useMemo(() => {
    return [...positions].sort((a, b) => b.market_value - a.market_value)[0] ?? null
  }, [positions])

  const positionColumns: Column<PositionView>[] = [
    {
      key: 'symbol',
      title: '资产',
      render: (row) => <span className="font-semibold text-slate-900">{row.symbol}</span>,
    },
    {
      key: 'qty',
      title: '持仓数量',
      render: (row) => row.qty.toFixed(4),
    },
    {
      key: 'avg_cost',
      title: '持仓成本',
      render: (row) => `$${money(row.avg_cost)}`,
    },
    {
      key: 'market_price',
      title: '最新价格',
      render: (row) => `$${money(row.market_price)}`,
    },
    {
      key: 'market_value',
      title: '市值',
      render: (row) => <span className="font-medium text-slate-900">${money(row.market_value)}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="账户净值"
          value={loading ? '加载中...' : `$${money(snapshot?.equity ?? account?.equity ?? 0)}`}
          icon={DollarSign}
          change={snapshot ? `快照时间 ${formatSnapshotTime(snapshot.snapshot_at)}` : '等待首个组合快照'}
          tone="cyan"
        />
        <StatCard
          title="可用现金"
          value={loading ? '加载中...' : `$${money(account?.cash_balance ?? 0)}`}
          icon={TrendingUp}
          change={account ? `账户 ${account.account_id}` : '尚未初始化账户'}
          tone="emerald"
        />
        <StatCard
          title="总风险敞口"
          value={loading ? '加载中...' : `$${money(snapshot?.gross_exposure ?? 0)}`}
          icon={LineChart}
          change={loading ? '正在同步组合状态' : `敞口率 ${exposureRatio.toFixed(2)}%`}
          tone="amber"
        />
        <StatCard
          title="持仓标的数"
          value={loading ? '加载中...' : String(positions.length)}
          icon={ShoppingCart}
          change={topPosition ? `最大仓位 ${topPosition.symbol}` : '当前没有持仓'}
          tone="rose"
        />
      </section>

      {error && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          后端数据暂时不可用：{error}
        </section>
      )}

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
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">账户概览</p>
              <div className="mt-3 grid gap-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">当前持仓</span>
                  <span>{positions.length} 个</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">净敞口</span>
                  <span>${money(snapshot?.net_exposure ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">最大仓位</span>
                  <span>{topPosition ? `${topPosition.symbol} / $${money(topPosition.market_value)}` : '暂无'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">当前持仓</h3>
            <p className="text-sm text-slate-500">从 backend 实时读取账户组合状态</p>
          </div>
        </div>
        <DataTable columns={positionColumns} data={positions} pageSize={5} showPagination={false} />
      </section>
    </div>
  )
}

function formatSnapshotTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}
