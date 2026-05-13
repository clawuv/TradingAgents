// 设计提醒：新闻页是行情事件雷达，强调时效、影响级别、关联标的和快速处置状态。
import { useMemo, useState, useEffect } from 'react'
import { BellRing, Bookmark, CheckCircle2, Eye, Newspaper, Radio, Search, SlidersHorizontal, Zap } from 'lucide-react'
import StatCard from '@/components/common/StatCard'
import DataTable, { type Column } from '@/components/common/DataTable'
import { mockNewsItems, type NewsCategory, type NewsImpact, type NewsItem } from '@/mock/data'
import { useAuth } from '@/contexts/AuthContext'

const categories = ['全部', '市场快讯', '政策监管', '项目动态', '交易所公告', '宏观财经'] as const
const impacts = ['全部', '高', '中', '低'] as const
const timeRanges = ['全部时间', '今日', '近24小时', '近3天', '近7天'] as const
const impactWeight: Record<NewsImpact, number> = { 高: 3, 中: 2, 低: 1 }
const now = new Date('2026-05-11 12:00'.replace(' ', 'T'))

function parseNewsTime(value: string) {
  return new Date(value.replace(' ', 'T'))
}

function matchTimeRange(value: string, range: (typeof timeRanges)[number]) {
  if (range === '全部时间') return true
  const time = parseNewsTime(value)
  const diffHours = (now.getTime() - time.getTime()) / 36e5
  if (range === '今日') return time.toDateString() === now.toDateString()
  if (range === '近24小时') return diffHours <= 24
  if (range === '近3天') return diffHours <= 72
  return diffHours <= 168
}

export default function News() {
  const { can } = useAuth()
  const [category, setCategory] = useState<(typeof categories)[number]>('全部')
  const [impact, setImpact] = useState<(typeof impacts)[number]>('全部')
  const [keyword, setKeyword] = useState('')
  const [timeRange, setTimeRange] = useState<(typeof timeRanges)[number]>('全部时间')
  const [pinImportant, setPinImportant] = useState(true)
  const [selected, setSelected] = useState<NewsItem>(mockNewsItems[0])
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('news_readIds')
      if (stored) return new Set(JSON.parse(stored))
    } catch {}
    return new Set(mockNewsItems.filter((item) => item.read).map((item) => item.id))
  })
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('news_bookmarkIds')
      if (stored) return new Set(JSON.parse(stored))
    } catch {}
    return new Set(mockNewsItems.filter((item) => item.bookmarked).map((item) => item.id))
  })

  useEffect(() => {
    localStorage.setItem('news_readIds', JSON.stringify([...readIds]))
  }, [readIds])

  useEffect(() => {
    localStorage.setItem('news_bookmarkIds', JSON.stringify([...bookmarkIds]))
  }, [bookmarkIds])
  const [message, setMessage] = useState('')

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    const result = mockNewsItems.filter((item) => (category === '全部' || item.category === category) &&
      (impact === '全部' || item.impact === impact) &&
      matchTimeRange(item.publishedAt, timeRange) &&
      (!q || item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q) || item.source.toLowerCase().includes(q)))

    return [...result].sort((a, b) => {
      if (pinImportant) {
        const impactDiff = impactWeight[b.impact] - impactWeight[a.impact]
        if (impactDiff !== 0) return impactDiff
      }
      return parseNewsTime(b.publishedAt).getTime() - parseNewsTime(a.publishedAt).getTime()
    })
  }, [category, impact, keyword, timeRange, pinImportant])

  const unreadCount = filtered.filter((item) => !readIds.has(item.id)).length
  const highImpactCount = filtered.filter((item) => item.impact === '高').length
  const bookmarkedCount = filtered.filter((item) => bookmarkIds.has(item.id)).length

  const preview = (item: NewsItem) => {
    setSelected(item)
    setMessage(`正在查看新闻：${item.title}`)
    if (can('news.markRead') && !readIds.has(item.id)) {
      setReadIds((prev) => new Set(prev).add(item.id))
    }
  }

  const markRead = (item: NewsItem) => {
    if (!can('news.markRead')) {
      setMessage('当前角色无标记已读权限。')
      return
    }
    setReadIds((prev) => new Set(prev).add(item.id))
    setMessage(`${item.id} 已标记为已读。`)
  }

  const toggleBookmark = (item: NewsItem) => {
    if (!can('news.bookmark')) {
      setMessage('当前角色无收藏新闻权限。')
      return
    }
    setBookmarkIds((prev) => {
      const next = new Set(prev)
      if (next.has(item.id)) next.delete(item.id)
      else next.add(item.id)
      return next
    })
    setMessage(`${item.id} 收藏状态已更新。`)
  }

  const columns: Column<NewsItem>[] = [
    { key: 'title', title: '新闻标题', render: (row) => <div className="max-w-lg"><div className="flex items-center gap-2"><p className="font-semibold text-slate-950">{row.title}</p>{!readIds.has(row.id) && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700">NEW</span>}</div><p className="mt-1 line-clamp-1 text-xs text-slate-500">{row.summary}</p></div> },
    { key: 'category', title: '分类', render: (row) => <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">{row.category}</span> },
    { key: 'impact', title: '影响', render: (row) => <ImpactBadge impact={row.impact} /> },
    { key: 'symbols', title: '关联标的', render: (row) => <div className="flex flex-wrap gap-1">{row.symbols.map((symbol) => <span key={symbol} className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700">{symbol}</span>)}</div> },
    { key: 'source', title: '来源' },
    { key: 'publishedAt', title: '发布时间' },
    { key: 'action', title: '操作', render: (row) => <div className="flex gap-2"><button className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100" onClick={() => preview(row)}><Eye className="mr-1 inline h-4 w-4" />详情</button><button disabled={!can('news.markRead')} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => markRead(row)}><CheckCircle2 className="mr-1 inline h-4 w-4" />已读</button><button disabled={!can('news.bookmark')} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${bookmarkIds.has(row.id) ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`} onClick={() => toggleBookmark(row)}><Bookmark className="mr-1 inline h-4 w-4" />收藏</button></div> },
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="新闻总数" value={String(filtered.length)} icon={Newspaper} change="当前筛选结果" tone="cyan" />
        <StatCard title="未读新闻" value={String(unreadCount)} icon={BellRing} change="建议优先处理" tone="amber" />
        <StatCard title="高影响事件" value={String(highImpactCount)} icon={Zap} change="可能影响行情波动" tone="rose" />
        <StatCard title="收藏新闻" value={String(bookmarkedCount)} icon={Bookmark} change="当前会话保存" tone="emerald" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-rose-400/20 blur-3xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">News Radar</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">新闻资讯</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">追踪市场快讯、监管政策、项目动态、交易所公告和宏观财经信息，辅助交易和风控决策。</p>
            <div className="mt-6 space-y-4">
              <label className="block space-y-2 text-sm font-medium text-slate-300"><span>关键词搜索</span><div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3"><Search className="h-4 w-4 text-slate-500" /><input className="w-full bg-transparent text-white outline-none" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索标题、摘要或来源" /></div></label>
              <div className="grid gap-3 sm:grid-cols-3">
                <Select label="分类" value={category} options={categories} onChange={(value) => setCategory(value as NewsCategory | '全部')} />
                <Select label="影响级别" value={impact} options={impacts} onChange={(value) => setImpact(value as NewsImpact | '全部')} />
                <Select label="时间范围" value={timeRange} options={timeRanges} onChange={(value) => setTimeRange(value as typeof timeRange)} />
              </div>
              <button className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${pinImportant ? 'border-rose-400/40 bg-rose-400/10 text-rose-100' : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'}`} onClick={() => setPinImportant((value) => !value)}>
                <span className="inline-flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />按重要级别置顶</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{pinImportant ? '已开启' : '已关闭'}</span>
              </button>
            </div>
            {message && <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">{message}</div>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-cyan-700">当前详情</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{selected.title}</h3>
            </div>
            <ImpactBadge impact={selected.impact} />
          </div>
          <p className="text-sm leading-7 text-slate-600">{selected.summary}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Info label="来源" value={selected.source} />
            <Info label="分类" value={selected.category} />
            <Info label="时间" value={selected.publishedAt.slice(5)} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">{selected.symbols.map((symbol) => <span key={symbol} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{symbol}</span>)}</div>
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600"><Radio className="mr-2 inline h-4 w-4 text-cyan-600" />提示：详情预览会切换右侧内容；已读和收藏状态已实现本地缓存持久化。</div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">新闻列表</h3>
          <p className="text-sm text-slate-500">按分类、影响级别、时间范围和关键词联动筛选；开启置顶后高影响新闻优先展示，同级再按时间倒序。</p>
        </div>
        <DataTable columns={columns} data={filtered} showPagination={false} />
      </section>
    </div>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="space-y-2 text-sm font-medium text-slate-300"><span>{label}</span><select className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
}

function ImpactBadge({ impact }: { impact: NewsImpact }) {
  const style = impact === '高' ? 'bg-rose-50 text-rose-700 ring-rose-100' : impact === '中' ? 'bg-amber-50 text-amber-700 ring-amber-100' : 'bg-slate-100 text-slate-700 ring-slate-200'
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ring-1 ${style}`}>{impact}影响</span>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-950">{value}</p></div>
}
