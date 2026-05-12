// 设计提醒：资产页现在是管理台，不只是看板，要把新增、修改、删除、查询做成一套完整后台流程。
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Pencil, Plus, Search, Trash2, WalletCards } from 'lucide-react'
import { toast } from 'sonner'
import DataTable, { type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import {
  createAsset,
  deleteAsset,
  getApiErrorMessage,
  listAssets,
  type AssetCreateRequest,
  type AssetItem,
  updateAsset,
} from '@/services/api'

const money = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type AssetFormState = {
  asset_code: string
  asset_name: string
  category: string
  quantity: string
  frozen_quantity: string
  unit_price: string
  currency: string
  status: string
  note: string
}

const defaultForm: AssetFormState = {
  asset_code: '',
  asset_name: '',
  category: '证券',
  quantity: '0',
  frozen_quantity: '0',
  unit_price: '0',
  currency: 'USD',
  status: 'active',
  note: '',
}

const categoryOptions = ['证券', '基金', '银行理财']

const currencyOptions = [
  { value: 'CNY', label: '人民币' },
  { value: 'USD', label: '美元' },
  { value: 'HKD', label: '港币' },
]

export default function Assets() {
  const { can } = useAuth()
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<AssetItem | null>(null)
  const [form, setForm] = useState<AssetFormState>(defaultForm)

  const loadAssets = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listAssets()
      setAssets(data)
    } catch (err) {
      const message = getApiErrorMessage(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAssets()
  }, [])

  const filteredAssets = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return assets
    return assets.filter((asset) =>
      [asset.asset_code, asset.asset_name, asset.category, asset.currency, asset.status]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    )
  }, [assets, keyword])

  const summary = useMemo(() => {
    const totalValuation = filteredAssets.reduce((sum, asset) => sum + asset.valuation, 0)
    const totalFrozen = filteredAssets.reduce((sum, asset) => sum + asset.frozen_quantity, 0)
    const activeCount = filteredAssets.filter((asset) => asset.status === 'active').length
    const largestAsset = [...filteredAssets].sort((a, b) => b.valuation - a.valuation)[0] ?? null
    return { totalValuation, totalFrozen, activeCount, largestAsset }
  }, [filteredAssets])

  const openCreateDialog = () => {
    setForm(defaultForm)
    setEditingAsset(null)
    setCreateOpen(true)
  }

  const openEditDialog = (asset: AssetItem) => {
    setEditingAsset(asset)
    setForm({
      asset_code: asset.asset_code,
      asset_name: asset.asset_name,
      category: asset.category,
      quantity: String(asset.quantity),
      frozen_quantity: String(asset.frozen_quantity),
      unit_price: String(asset.unit_price),
      currency: asset.currency,
      status: asset.status,
      note: asset.note ?? '',
    })
    setEditOpen(true)
  }

  const openDeleteDialog = (asset: AssetItem) => {
    setDeletingAsset(asset)
    setDeleteOpen(true)
  }

  const toPayload = (): AssetCreateRequest => ({
    asset_code: form.asset_code.trim().toUpperCase(),
    asset_name: form.asset_name.trim(),
    category: form.category.trim(),
    quantity: Number(form.quantity || 0),
    frozen_quantity: Number(form.frozen_quantity || 0),
    unit_price: Number(form.unit_price || 0),
    currency: form.currency.trim().toUpperCase(),
    status: form.status.trim(),
    note: form.note.trim() || undefined,
  })

  const handleCreateAsset = async () => {
    setSubmitting(true)
    try {
      const payload = toPayload()
      await createAsset(payload)
      toast.success(`已新增资产 ${payload.asset_code}`)
      setCreateOpen(false)
      setForm(defaultForm)
      await loadAssets()
    } catch (err) {
      const message = getApiErrorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditAsset = async () => {
    if (editingAsset == null) return
    setSubmitting(true)
    try {
      const payload = toPayload()
      await updateAsset(editingAsset.id, {
        asset_name: payload.asset_name,
        category: payload.category,
        quantity: payload.quantity,
        frozen_quantity: payload.frozen_quantity,
        unit_price: payload.unit_price,
        currency: payload.currency,
        status: payload.status,
        note: payload.note,
      })
      toast.success(`已更新资产 ${editingAsset.asset_code}`)
      setEditOpen(false)
      setEditingAsset(null)
      await loadAssets()
    } catch (err) {
      const message = getApiErrorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAsset = async () => {
    if (deletingAsset == null) return
    setSubmitting(true)
    try {
      await deleteAsset(deletingAsset.id)
      toast.success(`已删除资产 ${deletingAsset.asset_code}`)
      setDeleteOpen(false)
      setDeletingAsset(null)
      await loadAssets()
    } catch (err) {
      const message = getApiErrorMessage(err)
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const columns: Column<AssetItem>[] = [
    {
      key: 'asset_code',
      title: '资产代码',
      render: (row) => <span className="font-bold text-slate-950">{row.asset_code}</span>,
    },
    { key: 'asset_name', title: '资产名称' },
    { key: 'category', title: '分类' },
    {
      key: 'quantity',
      title: '数量',
      render: (row) => row.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 }),
    },
    {
      key: 'frozen_quantity',
      title: '冻结',
      render: (row) => row.frozen_quantity.toLocaleString(undefined, { maximumFractionDigits: 6 }),
    },
    {
      key: 'valuation',
      title: '估值',
      render: (row) => <span className="font-semibold text-slate-950">{row.currency} {money(row.valuation)}</span>,
    },
    {
      key: 'status',
      title: '状态',
      render: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${row.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      render: (row) => (
        <div className="flex gap-2">
          <button
            disabled={!can('assets.edit')}
            className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => openEditDialog(row)}
          >
            <Pencil className="mr-1 inline h-4 w-4" />
            编辑
          </button>
          <button
            disabled={!can('assets.delete')}
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
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Asset Management</p>
            <h3 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">资产管理</h3>
            <p className="mt-3 text-slate-500">支持资产新增、删除、修改、查询，当前页面直接对接 backend 的资产 CRUD 接口。</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <SummaryCard title="资产条目" value={loading ? '--' : String(filteredAssets.length)} />
            <SummaryCard title="活跃资产" value={loading ? '--' : String(summary.activeCount)} />
            <SummaryCard title="冻结总量" value={loading ? '--' : summary.totalFrozen.toFixed(4)} />
            <SummaryCard title="最大资产" value={loading ? '--' : summary.largestAsset?.asset_code ?? '暂无'} />
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
              placeholder="搜索资产代码、名称、分类或状态"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-slate-700">
              总估值: <span className="text-slate-950">USD {money(summary.totalValuation)}</span>
            </div>
            <Button
              onClick={openCreateDialog}
              disabled={!can('assets.create')}
              className="bg-slate-950 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500"
            >
              <Plus className="h-4 w-4" />
              新增资产
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <section className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>资产数据加载失败：{error}</div>
        </section>
      )}

      <DataTable columns={columns} data={filteredAssets} showPagination={false} />

      <AssetDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="新增资产"
        description="创建新的资产条目，支持代码、分类、数量、估值和状态录入。"
        form={form}
        setForm={setForm}
        submitting={submitting}
        onSubmit={handleCreateAsset}
        submitLabel="创建资产"
        showAssetCode
      />

      <AssetDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="编辑资产"
        description="更新资产数量、冻结值、单价、分类和状态。"
        form={form}
        setForm={setForm}
        submitting={submitting}
        onSubmit={handleEditAsset}
        submitLabel="保存修改"
        showAssetCode={false}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除资产</DialogTitle>
            <DialogDescription>
              {deletingAsset ? `删除 ${deletingAsset.asset_code} 后，这条资产记录将从后台资产表中移除。` : '确认删除该资产吗？'}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            这是一个真实删除操作，删除后不会自动恢复。
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={submitting}>取消</Button>
            <Button variant="destructive" onClick={() => void handleDeleteAsset()} disabled={submitting}>
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

function AssetDialog({
  open,
  onOpenChange,
  title,
  description,
  form,
  setForm,
  submitting,
  onSubmit,
  submitLabel,
  showAssetCode,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  form: AssetFormState
  setForm: React.Dispatch<React.SetStateAction<AssetFormState>>
  submitting: boolean
  onSubmit: () => Promise<void>
  submitLabel: string
  showAssetCode: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {showAssetCode && (
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">资产代码</span>
              <Input value={form.asset_code} onChange={(event) => setForm((prev) => ({ ...prev, asset_code: event.target.value }))} />
            </label>
          )}
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">资产名称</span>
            <Input value={form.asset_name} onChange={(event) => setForm((prev) => ({ ...prev, asset_name: event.target.value }))} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">分类</span>
            <select
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">数量</span>
            <Input value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">冻结数量</span>
            <Input value={form.frozen_quantity} onChange={(event) => setForm((prev) => ({ ...prev, frozen_quantity: event.target.value }))} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">单价</span>
            <Input value={form.unit_price} onChange={(event) => setForm((prev) => ({ ...prev, unit_price: event.target.value }))} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">币种</span>
            <select
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
              value={form.currency}
              onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value }))}
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">状态</span>
            <select className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">备注</span>
            <Input value={form.note} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>取消</Button>
          <Button
            onClick={() => void onSubmit()}
            disabled={submitting || !form.asset_name || (showAssetCode && !form.asset_code)}
          >
            {submitting ? '处理中...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
