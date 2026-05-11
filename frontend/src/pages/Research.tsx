// 设计提醒：研报页是信息决策中心，采用“研究卡片 + 市场观点 + 权限操作”结构，强调可信度与可读性。
import { useMemo, useState } from 'react'
import { Bookmark, BookOpenCheck, Download, Eye, FileText, Search, Sparkles, TrendingUp } from 'lucide-react'
import StatCard from '@/components/common/StatCard'
import DataTable, { type Column } from '@/components/common/DataTable'
import { mockResearchReports, type ResearchCategory, type ResearchRating, type ResearchReport } from '@/mock/data'
import { useAuth } from '@/contexts/AuthContext'

const categories = ['全部', '宏观策略', '链上数据', '技术分析', '行业专题', '风险提示'] as const
const ratings = ['全部', '看多', '中性', '谨慎'] as const

export default function Research() {
  const { can } = useAuth()
  const [category, setCategory] = useState<(typeof categories)[number]>('全部')
  const [rating, setRating] = useState<(typeof ratings)[number]>('全部')
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<ResearchReport>(mockResearchReports[0])
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set(mockResearchReports.filter((item) => item.bookmarked).map((item) => item.id)))
  const [message, setMessage] = useState('')

  const filtered = useMemo(() => mockResearchReports.filter((item) => {
    const matchCategory = category === '全部' || item.category === category
    const matchRating = rating === '全部' || item.rating === rating
    const q = keyword.trim().toLowerCase()
    const matchKeyword = !q || item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q) || item.tags.some((tag) => tag.toLowerCase().includes(q))
    return matchCategory && matchRating && matchKeyword
  }), [category, rating, keyword])

  const avgConfidence = filtered.length ? filtered.reduce((sum, item) => sum + item.confidence, 0) / filtered.length : 0
  const bullishCount = filtered.filter((item) => item.rating === '看多').length
  const riskCount = filtered.filter((item) => item.category === '风险提示' || item.rating === '谨慎').length

  const toggleBookmark = (report: ResearchReport) => {
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

  const previewReport = (report: ResearchReport) => {
    setSelected(report)
    setMessage(`正在预览研报：${report.title}`)
  }

  const downloadReport = (report: ResearchReport) => {
    if (!can('research.download')) {
      setMessage('当前角色无下载研报权限。')
      return
    }
    setMessage(`${report.id} 已模拟生成 PDF 下载任务。`)
  }

  const columns: Column<ResearchReport>[] = [
    { key: 'title', title: '研报标题', render: (row) => <div className="max-w-md"><p className="font-semibold text-slate-950">{row.title}</p><p className="mt-1 line-clamp-1 text-xs text-slate-500">{row.summary}</p></div> },
    { key: 'category', title: '分类', render: (row) => <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-100">{row.category}</span> },
    { key: 'rating', title: '观点', render: (row) => <RatingBadge rating={row.rating} /> },
    { key: 'symbols', title: '标的', render: (row) => <div className="flex flex-wrap gap-1">{row.symbols.map((symbol) => <span key={symbol} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{symbol}</span>)}</div> },
    { key: 'confidence', title: '可信度', render: (row) => <div className="min-w-24"><div className="mb-1 flex justify-between text-xs text-slate-500"><span>{row.confidence}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-cyan-500" style={{ width: `${row.confidence}%` }} /></div></div> },
    { key: 'publishedAt', title: '发布时间' },
    { key: 'action', title: '操作', render: (row) => <div className="flex gap-2"><button className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100" onClick={() => previewReport(row)}><Eye className="mr-1 inline h-4 w-4" />预览</button><button disabled={!can('research.download')} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => downloadReport(row)}><Download className="mr-1 inline h-4 w-4" />下载</button><button disabled={!can('research.bookmark')} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${bookmarkedIds.has(row.id) ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`} onClick={() => toggleBookmark(row)}><Bookmark className="mr-1 inline h-4 w-4" />{bookmarkedIds.has(row.id) ? '已藏' : '收藏'}</button></div> },
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="研报总数" value={String(filtered.length)} icon={FileText} change="当前筛选结果" tone="cyan" />
        <StatCard title="看多观点" value={String(bullishCount)} icon={TrendingUp} change="偏强策略信号" tone="emerald" />
        <StatCard title="平均可信度" value={`${avgConfidence.toFixed(1)}%`} icon={BookOpenCheck} change="基于研究置信评分" tone="amber" />
        <StatCard title="风险提示" value={String(riskCount)} icon={Sparkles} change="需重点阅读" tone="rose" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Research Center</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">研报中心</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">集中管理宏观策略、链上数据、技术分析、行业专题和风险提示类研报，支持预览、下载与收藏。</p>
            <div className="mt-6 space-y-4">
              <label className="block space-y-2 text-sm font-medium text-slate-300"><span>关键词搜索</span><div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3"><Search className="h-4 w-4 text-slate-500" /><input className="w-full bg-transparent text-white outline-none" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索标题、摘要或标签" /></div></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="分类" value={category} options={categories} onChange={(value) => setCategory(value as ResearchCategory | '全部')} />
                <Select label="观点" value={rating} options={ratings} onChange={(value) => setRating(value as ResearchRating | '全部')} />
              </div>
            </div>
            {message && <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">{message}</div>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-cyan-700">当前预览</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{selected.title}</h3>
            </div>
            <RatingBadge rating={selected.rating} />
          </div>
          <p className="text-sm leading-7 text-slate-600">{selected.summary}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PreviewInfo label="作者" value={selected.author} />
            <PreviewInfo label="阅读时长" value={`${selected.readTime} 分钟`} />
            <PreviewInfo label="可信度" value={`${selected.confidence}%`} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">{selected.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">#{tag}</span>)}</div>
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">模拟功能：预览会切换右侧详情；下载会生成任务提示；收藏状态保存在当前前端会话中。</div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">研报列表</h3>
          <p className="text-sm text-slate-500">按分类、观点和关键词筛选，操作按钮受角色权限控制。</p>
        </div>
        <DataTable columns={columns} data={filtered} showPagination={false} />
      </section>
    </div>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="space-y-2 text-sm font-medium text-slate-300"><span>{label}</span><select className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
}

function RatingBadge({ rating }: { rating: ResearchRating }) {
  const style = rating === '看多' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : rating === '中性' ? 'bg-slate-100 text-slate-700 ring-slate-200' : 'bg-rose-50 text-rose-700 ring-rose-100'
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ring-1 ${style}`}>{rating}</span>
}

function PreviewInfo({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-950">{value}</p></div>
}
