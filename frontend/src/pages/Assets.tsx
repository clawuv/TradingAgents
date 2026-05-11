// 设计提醒：资产页需要像资金账户总览，突出总额、冻结风险与币种分布。
import { WalletCards } from 'lucide-react'
import DataTable, { type Column } from '@/components/common/DataTable'
import { mockAssets, mockStats, type Asset } from '@/mock/data'

const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Assets() {
  const columns: Column<Asset>[] = [
    { key: 'coin', title: '币种', render: (row) => <span className="font-bold text-slate-950">{row.coin}</span> },
    { key: 'available', title: '可用余额', render: (row) => row.available.toLocaleString(undefined, { maximumFractionDigits: 6 }) },
    { key: 'frozen', title: '冻结余额', render: (row) => row.frozen.toLocaleString(undefined, { maximumFractionDigits: 6 }) },
    { key: 'valuation', title: '总估值（USDT）', render: (row) => <span className="font-semibold text-slate-950">${money(row.valuation)}</span> },
  ]

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-5 inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-300 ring-1 ring-cyan-400/20"><WalletCards className="h-7 w-7" /></div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total Equity</p>
            <h3 className="mt-3 text-5xl font-bold tracking-tight">${money(mockStats.totalAssets)}</h3>
            <p className="mt-3 text-slate-400">账户资产折合 USDT，含冻结余额和可用余额。</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-slate-400">币种数量</p><p className="mt-2 text-2xl font-semibold">{mockAssets.length}</p></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-slate-400">冻结估值</p><p className="mt-2 text-2xl font-semibold">$24,840+</p></div>
          </div>
        </div>
      </section>
      <DataTable columns={columns} data={mockAssets} showPagination={false} />
    </div>
  )
}
