import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Pencil, Plus, Search, Trash2, WalletCards } from 'lucide-react'
import { toast } from 'sonner'
import DataTable, { type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import {
  createPosition,
  deletePosition,
  getApiErrorMessage,
  listPositions,
  type PositionCreateRequest,
  type PositionView,
  updatePosition,
} from '@/services/api'

const money = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type PositionFormState = {
  symbol: string
  qty: string
  avg_cost: string
  market_price: string
}

const defaultForm: PositionFormState = {
  symbol: '',
  qty: '0',
  avg_cost: '0',
  market_price: '0',
}

export default function Positions() {
  const { can } = useAuth()
  const [positions, setPositions] = useState<PositionView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingPosition, setEditingPosition] = useState<PositionView | null>(null)
  const [deletingPosition, setDeletingPosition] = useState<PositionView | null>(null)
  const [form, setForm] = useState<PositionFormState>(defaultForm)

  const loadPositions = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listPositions()
      setPositions(data)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPositions()
  }, [])

  const filteredPositions = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return positions
    return positions.filter((position) =>
      [position.symbol, String(position.qty), String(position.avg_cost), String(position.market_price)]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    )
  }, [positions, keyword])

  const summary = useMemo(() => {
    const totalMarketValue = filteredPositions.reduce((sum, position) => sum + position.market_value, 0)
    const totalQuantity = filteredPositions.reduce((sum, position) => sum + position.qty, 0)
    const largestPosition = [...filteredPositions].sort((a, b) => b.market_value - a.market_value)[0] ?? null
    return { totalMarketValue, totalQuantity, largestPosition }
  }, [filteredPositions])

  const openCreateDialog = () => {
    setForm(defaultForm)
    setEditingPosition(null)
    setCreateOpen(true)
  }

  const openEditDialog = (position: PositionView) => {
    setEditingPosition(position)
    setForm({
      symbol: position.symbol,
      qty: String(position.qty),
      avg_cost: String(position.avg_cost),
      market_price: String(position.market_price),
    })
    setEditOpen(true)
  }

  const openDeleteDialog = (position: PositionView) => {
    setDeletingPosition(position)
    setDeleteOpen(true)
  }

  const toPayload = (): PositionCreateRequest => ({
    symbol: form.symbol.trim().toUpperCase(),
    qty: Number(form.qty || 0),
    avg_cost: Number(form.avg_cost || 0),
    market_price: Number(form.market_price || 0),
  })

  const handleCreatePosition = async () => {
    setSubmitting(true)
    try {
      const payload = toPayload()
      await createPosition(payload)
      toast.success(`已新增持仓 ${payload.symbol}`)
      setCreateOpen(false)
      setForm(defaultForm)
      await loadPositions()
    } catch (err) {
      const message = getApiErrorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditPosition = async () => {
    if (editingPosition?.id == null) return
    setSubmitting(true)
    try {
      const payload = toPayload()
      await updatePosition(editingPosition.id, {
        qty: payload.qty,
        avg_cost: payload.avg_cost,
        market_price: payload.market_price,
      })
      toast.success(`已更新持仓 ${editingPosition.symbol}`)
      setEditOpen(false)
      setEditingPosition(null)
      await loadPositions()
    } catch (err) {
      const message = getApiErrorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePosition = async () => {
    if (deletingPosition?.id == null) return
    setSubmitting(true)
    try {
      await deletePosition(deletingPosition.id)
      toast.success(`已删除持仓 ${deletingPosition.symbol}`)
      setDeleteOpen(false)
      setDeletingPosition(null)
      await loadPositions()
    } catch (err) {
      const message = getApiErrorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const columns: Column<PositionView>[] = [
    {
      key: 'symbol',
      title: '标的代码',
      render: (row) => <span className="font-bold text-slate-950">{row.symbol}</span>,
    },
    {
      key: 'qty',
      title: '持仓数量',
      render: (row) => row.qty.toLocaleString(undefined, { maximumFractionDigits: 6 }),
    },
    {
      key: 'avg_cost',
      title: '持仓成本',
      render: (row) => money(row.avg_cost),
    },
    {
      key: 'market_price',
      title: '市价',
      render: (row) => money(row.market_price),
    },
    {
      key: 'market_value',
      title: '市值',
      render: (row) => <span className="font-semibold text-slate-950">{money(row.market_value)}</span>,
    },
    {
      key: 'action',
      title: '操作',
      render: (row) => (
        <div className="flex gap-2">
          <button
            disabled={!can('positions.edit')}
            className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => openEditDialog(row)}
          >
            <Pencil className="mr-1 inline h-4 w-4" />
            编辑
          </button>
          <button
            disabled={!can('positions.delete')}
            className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => openDeleteDialog(row)}
          >
            <Trash2 className="mr-1 inline h-4 w-4" />
            删除
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-5 inline-flex rounded-2xl bg-cyan-50 p-3 text-cyan-700">
              <WalletCards className="h-7 w-7" />
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Position Management</p>
            <h3 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">持仓管理</h3>
            <p className="mt-3 text-slate-500">支持持仓新增、删除、修改、查询，当前页面直接对接 backend 的持仓 CRUD 接口。</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <SummaryCard title="持仓条目" value={loading ? '--' : String(filteredPositions.length)} />
            <SummaryCard title="总持仓数量" value={loading ? '--' : summary.totalQuantity.toFixed(4)} />
            <SummaryCard title="总持仓市值" value={loading ? '--' : money(summary.totalMarketValue)} />
            <SummaryCard title="最大持仓" value={loading ? '--' : summary.largestPosition?.symbol ?? '暂无'} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索标的代码、数量、成本或市价"
              className="pl-9"
            />
          </div>
          <Button
            onClick={openCreateDialog}
            disabled={!can('positions.create')}
            className="bg-slate-950 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500"
          >
            <Plus className="h-4 w-4" />
            新增持仓
          </Button>
        </div>
      </section>

      {error && (
        <section className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>持仓数据加载失败：{error}</div>
        </section>
      )}

      <DataTable columns={columns} data={filteredPositions} showPagination={false} />

      <PositionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="新增持仓"
        description="创建新的持仓条目，支持标的、数量、成本与市价录入。"
        form={form}
        setForm={setForm}
        submitting={submitting}
        onSubmit={handleCreatePosition}
        submitLabel="创建持仓"
        showSymbol
      />

      <PositionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="编辑持仓"
        description="更新持仓数量、成本和市价。"
        form={form}
        setForm={setForm}
        submitting={submitting}
        onSubmit={handleEditPosition}
        submitLabel="保存修改"
        showSymbol={false}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除持仓</DialogTitle>
            <DialogDescription>
              {deletingPosition ? `删除 ${deletingPosition.symbol} 后，这条持仓记录将从后台持仓表中移除。` : '确认删除该持仓吗？'}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            这是一个真实删除操作，删除后不会自动恢复。
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={submitting}>取消</Button>
            <Button variant="destructive" onClick={() => void handleDeletePosition()} disabled={submitting}>
              {submitting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function PositionDialog({
  open,
  onOpenChange,
  title,
  description,
  form,
  setForm,
  submitting,
  onSubmit,
  submitLabel,
  showSymbol,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  form: PositionFormState
  setForm: React.Dispatch<React.SetStateAction<PositionFormState>>
  submitting: boolean
  onSubmit: () => Promise<void>
  submitLabel: string
  showSymbol: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {showSymbol && (
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">标的代码</span>
              <Input value={form.symbol} onChange={(event) => setForm((prev) => ({ ...prev, symbol: event.target.value }))} />
            </label>
          )}
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">持仓数量</span>
            <Input value={form.qty} onChange={(event) => setForm((prev) => ({ ...prev, qty: event.target.value }))} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">持仓成本</span>
            <Input value={form.avg_cost} onChange={(event) => setForm((prev) => ({ ...prev, avg_cost: event.target.value }))} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">市价</span>
            <Input value={form.market_price} onChange={(event) => setForm((prev) => ({ ...prev, market_price: event.target.value }))} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>取消</Button>
          <Button
            onClick={() => void onSubmit()}
            disabled={submitting || !form.qty || !form.avg_cost || !form.market_price || (showSymbol && !form.symbol)}
          >
            {submitting ? '处理中...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
