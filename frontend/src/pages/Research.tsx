import { useEffect, useMemo, useState } from 'react'
import { Bookmark, BookOpenCheck, Download, Eye, FileText, Search, Sparkles, TrendingUp } from 'lucide-react'
import { Streamdown } from 'streamdown'
import { toast } from 'sonner'
import StatCard from '@/components/common/StatCard'
import DataTable, { type Column } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/AuthContext'
import {
  downloadResearchReport,
  getApiErrorMessage,
  getResearchReport,
  listResearchReports,
  type ResearchReportDetail,
  type ResearchReportListItem,
} from '@/services/api'

const ratings = ['全部', '看多', '中性', '谨慎', '未知'] as const

export default function Research() {
  const { can } = useAuth()
  const [keyword, setKeyword] = useState('')
  const [rating, setRating] = useState<(typeof ratings)[number]>('全部')
  const [reports, setReports] = useState<ResearchReportListItem[]>([])
  const [selected, setSelected] = useState<ResearchReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [previewOpen, setPreviewOpen] = useState(false)

  const loadReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await listResearchReports()
      setReports(items)
      setSelected(null)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReports()
  }, [])

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return reports.filter((item) => {
      const matchRating = rating === '全部' || item.rating === rating
      const matchKeyword =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.ticker.toLowerCase().includes(q)
      return matchRating && matchKeyword
    })
  }, [keyword, rating, reports])

  const avgCoverage = filtered.length
    ? filtered.reduce((sum, item) => sum + item.summary.length, 0) / filtered.length
    : 0
  const bullishCount = filtered.filter((item) => item.rating === '看多').length
  const cautiousCount = filtered.filter((item) => item.rating === '谨慎').length
  const coveredTickers = new Set(filtered.map((item) => item.ticker)).size

  const previewReport = async (report: ResearchReportListItem) => {
    setDetailLoading(true)
    setPreviewOpen(true)
    try {
      const detail = await getResearchReport(report.id)
      setSelected(detail)
      setMessage(`正在预览研报：${report.title}`)
    } catch (err) {
      const msg = getApiErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDownload = async (report: ResearchReportListItem | ResearchReportDetail) => {
    if (!can('research.download')) {
      setMessage('当前角色无下载研报权限。')
      return
    }
    try {
      const content = await downloadResearchReport(report.id)
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${report.ticker}_${report.report_date}.md`
      link.click()
      URL.revokeObjectURL(url)
      setMessage(`${report.title} 已生成 Markdown 下载。`)
    } catch (err) {
      const msg = getApiErrorMessage(err)
      setError(msg)
      toast.error(msg)
    }
  }

  const toggleBookmark = (report: ResearchReportListItem | ResearchReportDetail) => {
    if (!can('research.bookmark')) {
      setMessage('当前角色无收藏研报权限。')
      return
    }
    setBookmarkedIds((prev) => {
      const next = new Set(prev)
      if (next.has(report.id)) next.delete(report.id)
      else next.add(report.id)
      return next
    })
    setMessage(`${report.title} 已更新收藏状态。`)
  }

  const columns: Column<ResearchReportListItem>[] = [
    {
      key: 'title',
      title: '研报标题',
      render: (row) => (
        <div className="max-w-md">
          <p className="font-semibold text-slate-950">{row.title}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{row.summary}</p>
        </div>
      ),
    },
    {
      key: 'ticker',
      title: '标的',
      render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{row.ticker}</span>,
    },
    {
      key: 'rating',
      title: '观点',
      render: (row) => <RatingBadge rating={row.rating} />,
    },
    {
      key: 'generated_at',
      title: '生成时间',
    },
    {
      key: 'source_label',
      title: '来源',
      render: (row) => <span className="text-sm text-slate-600">{row.source_label}</span>,
    },
    {
      key: 'action',
      title: '操作',
      render: (row) => (
        <div className="flex gap-2">
          <button
            className="rounded-lg bg-slate-950 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
            onClick={() => void previewReport(row)}
          >
            <Eye className="mr-1 inline h-4 w-4" />
            预览
          </button>
          <button
            disabled={!can('research.download')}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => void handleDownload(row)}
          >
            <Download className="mr-1 inline h-4 w-4" />
            下载
          </button>
          <button
            disabled={!can('research.bookmark')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              bookmarkedIds.has(row.id) ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
            }`}
            onClick={() => toggleBookmark(row)}
          >
            <Bookmark className="mr-1 inline h-4 w-4" />
            {bookmarkedIds.has(row.id) ? '已藏' : '收藏'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="研报总数" value={loading ? '--' : String(filtered.length)} icon={FileText} change="当前可读报告" tone="cyan" />
        <StatCard title="覆盖标的" value={loading ? '--' : String(coveredTickers)} icon={TrendingUp} change="来自 TradingAgents 输出" tone="emerald" />
        <StatCard title="看多观点" value={loading ? '--' : String(bullishCount)} icon={BookOpenCheck} change="按报告评级统计" tone="amber" />
        <StatCard title="谨慎提示" value={loading ? '--' : String(cautiousCount)} icon={Sparkles} change={`平均摘要长度 ${avgCoverage.toFixed(0)}`} tone="rose" />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Research Center</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">研报中心</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">直接读取 TradingAgents 生成的真实 Markdown 报告。列表视图负责检索和筛选，报告内容通过右侧抽屉展开。</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] xl:w-[560px]">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-600">关键词搜索</span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索标题、摘要或标的代码"
                />
              </div>
            </label>
            <LightSelect label="观点" value={rating} options={ratings} onChange={(value) => setRating(value as (typeof ratings)[number])} />
          </div>
        </div>
        {message && <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-700">{message}</div>}
        {error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">研报列表</h3>
            <p className="text-sm text-slate-500">从 TradingAgents 报告目录和运行日志中自动聚合，点击预览后从右侧展开完整报告。</p>
          </div>
          <div className="text-sm text-slate-500">
            最近选中：
            <span className="ml-2 font-medium text-slate-900">{selected?.ticker ?? '暂无'} {selected?.report_date ?? ''}</span>
          </div>
        </div>
        <DataTable columns={columns} data={filtered} showPagination={false} />
      </section>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right" className="w-full border-l border-slate-200 bg-slate-50 p-0 sm:max-w-3xl">
          <SheetHeader className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="pr-10">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                {selected && <RatingBadge rating={selected.rating} />}
                {selected && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{selected.source_label}</span>}
              </div>
              <SheetTitle className="text-2xl font-bold tracking-tight text-slate-950">{selected?.title ?? '暂无研报'}</SheetTitle>
              <SheetDescription className="mt-2 text-sm leading-6 text-slate-500">
                {selected ? `${selected.ticker} · ${selected.report_date} · ${selected.generated_at}` : '当前没有可展示的 TradingAgents 报告。'}
              </SheetDescription>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {detailLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">正在加载研报内容...</div>
            ) : selected ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <PreviewInfo label="标的" value={selected.ticker} />
                  <PreviewInfo label="报告日期" value={selected.report_date} />
                  <PreviewInfo label="评级" value={selected.rating} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm leading-7 text-slate-600">{selected.summary}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="streamdown-body text-sm leading-7 text-slate-700">
                    <Streamdown>{selected.content}</Streamdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">当前没有可展示的 TradingAgents 报告。</div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white px-6 py-4">
            <div className="flex flex-wrap items-center justify-end gap-3">
              {selected && (
                <Button
                  variant="outline"
                  onClick={() => void handleDownload(selected)}
                  disabled={!can('research.download')}
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  下载报告
                </Button>
              )}
              {selected && (
                <Button
                  variant="outline"
                  onClick={() => toggleBookmark(selected)}
                  disabled={!can('research.bookmark')}
                  className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  <Bookmark className="h-4 w-4" />
                  {bookmarkedIds.has(selected.id) ? '取消收藏' : '收藏报告'}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function LightSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-slate-600">{label}</span><select className="h-[50px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-slate-400" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
}

function RatingBadge({ rating }: { rating: string }) {
  const style = rating === '看多' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : rating === '中性' ? 'bg-slate-100 text-slate-700 ring-slate-200' : rating === '谨慎' ? 'bg-rose-50 text-rose-700 ring-rose-100' : 'bg-slate-100 text-slate-500 ring-slate-200'
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ring-1 ${style}`}>{rating}</span>
}

function PreviewInfo({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-950">{value}</p></div>
}
