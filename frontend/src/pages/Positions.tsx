// 设计提醒：持仓页是风险与收益的集中面板，必须让未实现盈亏、杠杆风险和平仓动作一眼可见。
import { useMemo, useState } from 'react'
import { AlertTriangle, Gauge, ShieldAlert, Target, TrendingDown, TrendingUp, WalletCards } from 'lucide-react'
import StatCard from '@/components/common/StatCard'
import DataTable, { type Column } from '@/components/common/DataTable'
import { mockPositions, type Position } from '@/mock/data'
import { useAuth } from '@/contexts/AuthContext'

const pairs = ['全部', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT'] as const
const sides = ['全部', '多', '空'] as const
const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Positions() {
  const { can } = useAuth()
  const [pair, setPair] = useState<(typeof pairs)[number]>('全部')
  const [side, setSide] = useState<(typeof sides)[number]>('全部')
  const [message, setMessage] = useState('')

  const filtered = useMemo(() => mockPositions.filter((item) => (pair === '全部' || item.pair === pair) && (side === '全部' || item.side === side)), [pair, side])
  const totalPnl = filtered.reduce((sum, item) => sum + item.unrealizedPnl, 0)
  const totalMargin = filtered.reduce((sum, item) => sum + item.margin, 0)
  const avgRoe = filtered.length ? filtered.reduce((sum, item) => sum + item.roe, 0) / filtered.length : 0
  const highRiskCount = filtered.filter((item) => item.riskLevel === '高').length

  const columns: Column<Position>[] = [
    { key: 'id', title: '持仓ID', render: (row) => <span className="font-mono text-xs text-slate-600">{row.id}</span> },
    { key: 'pair', title: '交易对', render: (row) => <span className="font-semibold text-slate-950">{row.pair}</span> },
    { key: 'side', title: '方向', render: (row) => <span className={row.side === '多' ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>{row.side === '多' ? '多头' : '空头'}</span> },
    { key: 'marginMode', title: '保证金', render: (row) => `${row.marginMode} · ${row.leverage}x` },
    { key: 'size', title: '仓位数量', render: (row) => row.size.toFixed(4) },
    { key: 'entryPrice', title: '开仓价', render: (row) => money(row.entryPrice) },
    { key: 'markPrice', title: '标记价', render: (row) => money(row.markPrice) },
    { key: 'liquidationPrice', title: '强平价', render: (row) => <span className="text-rose-600">{money(row.liquidationPrice)}</span> },
    { key: 'unrealizedPnl', title: '未实现盈亏', render: (row) => <div><p className={row.unrealizedPnl >= 0 ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>{row.unrealizedPnl >= 0 ? '+' : ''}${money(row.unrealizedPnl)}</p><p className="text-xs text-slate-400">ROE {row.roe.toFixed(2)}%</p></div> },
    { key: 'riskLevel', title: '风险', render: (row) => <RiskBadge level={row.riskLevel} /> },
    { key: 'action', title: '操作', render: (row) => <div className="flex gap-2"><button disabled={!can('positions.risk')} className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => setMessage(`${row.id} 已模拟打开止盈止损设置。`)}>止盈止损</button><button disabled={!can('positions.close')} className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => setMessage(`${row.id} 已模拟按市价平仓，预计释放保证金 $${money(row.margin)}。`)}>平仓</button></div> },
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="持仓总保证金" value={`$${money(totalMargin)}`} icon={WalletCards} change="含全仓与逐仓保证金" tone="cyan" />
        <StatCard title="未实现盈亏" value={`${totalPnl >= 0 ? '+' : '-'}$${money(Math.abs(totalPnl))}`} icon={totalPnl >= 0 ? TrendingUp : TrendingDown} change={`平均 ROE ${avgRoe.toFixed(2)}%`} tone={totalPnl >= 0 ? 'emerald' : 'rose'} />
        <StatCard title="持仓数量" value={String(filtered.length)} icon={Gauge} change="当前筛选结果" tone="amber" />
        <StatCard title="高风险持仓" value={String(highRiskCount)} icon={ShieldAlert} change="建议关注强平距离" tone="rose" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="relative">
            <div className="mb-5 inline-flex rounded-2xl bg-amber-400/10 p-3 text-amber-300 ring-1 ring-amber-400/20"><AlertTriangle className="h-7 w-7" /></div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Position Risk</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">持仓风险监控</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">集中查看多空方向、杠杆、强平价、未实现盈亏和风险等级。操作按钮受角色权限控制。</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Select label="交易对筛选" value={pair} options={pairs} onChange={(value) => setPair(value as typeof pair)} />
              <Select label="方向筛选" value={side} options={sides} onChange={(value) => setSide(value as typeof side)} />
            </div>
            {message && <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">{message}</div>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">风险分布</h3>
              <p className="text-sm text-slate-500">按风险等级展示持仓数量和处置建议</p>
            </div>
            <Target className="h-5 w-5 text-cyan-600" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <RiskPanel label="低风险" count={filtered.filter((item) => item.riskLevel === '低').length} desc="强平距离充足，保持监控" tone="emerald" />
            <RiskPanel label="中风险" count={filtered.filter((item) => item.riskLevel === '中').length} desc="建议检查保证金与止损" tone="amber" />
            <RiskPanel label="高风险" count={highRiskCount} desc="建议优先处理或减仓" tone="rose" />
          </div>
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">模拟规则：当持仓杠杆更高、强平距离更近时标记为中/高风险；实际生产环境应接入风控引擎与实时行情。</div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">当前持仓</h3>
          <p className="text-sm text-slate-500">支持按交易对和方向筛选，模拟止盈止损和平仓操作。</p>
        </div>
        <DataTable columns={columns} data={filtered} showPagination={false} />
      </section>
    </div>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="space-y-2 text-sm font-medium text-slate-300"><span>{label}</span><select className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
}

function RiskBadge({ level }: { level: Position['riskLevel'] }) {
  const style = level === '低' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : level === '中' ? 'bg-amber-50 text-amber-700 ring-amber-100' : 'bg-rose-50 text-rose-700 ring-rose-100'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${style}`}>{level}风险</span>
}

function RiskPanel({ label, count, desc, tone }: { label: string; count: number; desc: string; tone: 'emerald' | 'amber' | 'rose' }) {
  const style = tone === 'emerald' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : tone === 'amber' ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-rose-100 bg-rose-50 text-rose-700'
  return <div className={`rounded-2xl border p-4 ${style}`}><p className="text-sm font-semibold">{label}</p><p className="mt-2 text-3xl font-black">{count}</p><p className="mt-2 text-xs opacity-80">{desc}</p></div>
}
