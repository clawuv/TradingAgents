// 设计提醒：资产页需要像资金账户总览，突出总额、冻结风险与币种分布。
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, WalletCards } from 'lucide-react'
import DataTable, { type Column } from '@/components/common/DataTable'
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

type AssetRow = {
  coin: string
  available: number
  frozen: number
  valuation: number
  allocation: number
}

const money = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Assets() {
  const [account, setAccount] = useState<AccountSummary | null>(null)
  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null)
  const [positions, setPositions] = useState<PositionView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadAssets() {
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

    loadAssets()

    return () => {
      cancelled = true
    }
  }, [])

  const assets = useMemo<AssetRow[]>(() => {
    const equityBase = snapshot?.equity ?? account?.equity ?? 0
    const cashRow: AssetRow | null =
      (account?.cash_balance ?? 0) > 0
        ? {
            coin: account?.base_currency ?? 'USD',
            available: account?.cash_balance ?? 0,
            frozen: 0,
            valuation: account?.cash_balance ?? 0,
            allocation: equityBase > 0 ? ((account?.cash_balance ?? 0) / equityBase) * 100 : 0,
          }
        : null

    const positionRows = positions.map((position) => ({
      coin: position.symbol,
      available: position.qty,
      frozen: 0,
      valuation: position.market_value,
      allocation: equityBase > 0 ? (position.market_value / equityBase) * 100 : 0,
    }))

    return cashRow ? [cashRow, ...positionRows] : positionRows
  }, [account, positions, snapshot])

  const largestAsset = useMemo(() => {
    return [...assets].sort((a, b) => b.valuation - a.valuation)[0] ?? null
  }, [assets])

  const columns: Column<AssetRow>[] = [
    {
      key: 'coin',
      title: '资产',
      render: (row) => <span className="font-bold text-slate-950">{row.coin}</span>,
    },
    {
      key: 'available',
      title: '可用数量',
      render: (row) => row.available.toLocaleString(undefined, { maximumFractionDigits: 6 }),
    },
    {
      key: 'frozen',
      title: '冻结数量',
      render: (row) => row.frozen.toLocaleString(undefined, { maximumFractionDigits: 6 }),
    },
    {
      key: 'valuation',
      title: '估值（USD）',
      render: (row) => <span className="font-semibold text-slate-950">${money(row.valuation)}</span>,
    },
    {
      key: 'allocation',
      title: '组合占比',
      render: (row) => (
        <div className="flex min-w-[140px] items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-400"
              style={{ width: `${Math.min(row.allocation, 100)}%` }}
            />
          </div>
          <span className="w-14 text-right text-xs font-semibold text-slate-600">
            {row.allocation.toFixed(2)}%
          </span>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-5 inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-300 ring-1 ring-cyan-400/20">
              <WalletCards className="h-7 w-7" />
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Portfolio Equity</p>
            <h3 className="mt-3 text-5xl font-bold tracking-tight">
              {loading ? '加载中...' : `$${money(snapshot?.equity ?? account?.equity ?? 0)}`}
            </h3>
            <p className="mt-3 text-slate-400">
              资产页直接读取 backend 的账户余额、组合持仓和最新快照。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400">资产项数量</p>
              <p className="mt-2 text-2xl font-semibold">{loading ? '--' : assets.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400">现金余额</p>
              <p className="mt-2 text-2xl font-semibold">
                {loading ? '--' : `$${money(account?.cash_balance ?? 0)}`}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400">总敞口</p>
              <p className="mt-2 text-2xl font-semibold">
                {loading ? '--' : `$${money(snapshot?.gross_exposure ?? 0)}`}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-400">最大资产</p>
              <p className="mt-2 text-2xl font-semibold">{loading ? '--' : largestAsset?.coin ?? '暂无'}</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <section className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>资产数据加载失败：{error}</div>
        </section>
      )}

      <DataTable columns={columns} data={assets} showPagination={false} />
    </div>
  )
}
