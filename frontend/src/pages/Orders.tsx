// 设计提醒：订单页强调筛选效率和操作反馈，按钮与状态色必须一眼可辨。
import { useMemo, useState } from 'react'
import { Filter } from 'lucide-react'
import DataTable, { type Column } from '@/components/common/DataTable'
import { mockOrders, type Order, type OrderStatus } from '@/mock/data'

const pairs = ['全部', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT'] as const
const statuses = ['全部', '已完成', '部分成交', '已取消'] as const
const money = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Orders() {
  const [pair, setPair] = useState<(typeof pairs)[number]>('全部')
  const [status, setStatus] = useState<(typeof statuses)[number]>('全部')

  const filtered = useMemo(() => mockOrders.filter((order) => (pair === '全部' || order.pair === pair) && (status === '全部' || order.status === status)), [pair, status])

  const columns: Column<Order>[] = [
    { key: 'id', title: '订单ID', render: (row) => <span className="font-mono text-xs text-slate-600">{row.id}</span> },
    { key: 'pair', title: '交易对', render: (row) => <span className="font-semibold text-slate-950">{row.pair}</span> },
    { key: 'direction', title: '方向', render: (row) => <span className={row.direction === '买' ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>{row.direction}</span> },
    { key: 'price', title: '价格', render: (row) => money(row.price) },
    { key: 'quantity', title: '数量', render: (row) => row.quantity.toFixed(2) },
    { key: 'status', title: '状态', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'time', title: '时间' },
    { key: 'action', title: '操作', render: (row) => <button className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100" onClick={() => alert(`订单ID：${row.id}`)}>详情</button> },
  ]

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-950">
          <Filter className="h-5 w-5 text-cyan-600" />
          <h3 className="text-lg font-semibold">订单筛选</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <Select label="状态筛选" value={status} onChange={(value) => setStatus(value as OrderStatus | '全部')} options={statuses} />
          <Select label="交易对筛选" value={pair} onChange={(value) => setPair(value as typeof pair)} options={pairs} />
        </div>
      </div>
      <DataTable columns={columns} data={filtered} pageSize={10} />
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[] }) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-600">
      <span>{label}</span>
      <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  )
}

function StatusBadge({ status }: { status: string }) {
  const style = status === '已完成' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : status === '部分成交' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-100 text-slate-600 ring-slate-200'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${style}`}>{status}</span>
}
