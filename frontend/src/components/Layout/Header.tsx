// 设计提醒：顶部栏为页面上下文与账户状态区，加入角色切换和退出入口，形成完整后台会话体验。
import { Bell, CheckCheck, LoaderCircle, LogOut, Menu, Search, Square, User } from 'lucide-react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { useResearchNotifications } from '@/contexts/ResearchNotificationsContext'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { setPendingResearchJobError, setPendingResearchReportId } from '@/lib/research-notification'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cancelResearchJob, getApiErrorMessage } from '@/services/api'
import { toast } from 'sonner'

type HeaderProps = { title: string; onMenuClick: () => void }

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { currentUser, roleInfo, logout } = useAuth()
  const { jobs, unreadCount, hasActiveJobs, markAllJobsRead, markJobRead, upsertJob } = useResearchNotifications()
  const [, navigate] = useLocation()
  const runningJobs = jobs.filter((job) => job.status === 'queued' || job.status === 'running')
  const completedJobs = jobs.filter((job) => job.status === 'completed')
  const failedJobs = jobs.filter((job) => job.status === 'failed' || job.status === 'cancelled')

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleCancelJob = async (jobId: string) => {
    try {
      const updated = await cancelResearchJob(jobId)
      upsertJob(updated)
      toast.success('研报任务已取消')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const formatJobTime = (job: (typeof jobs)[number]) => {
    const now = Date.now()
    const parse = (value: string | null) => (value ? new Date(value).getTime() : null)
    const createdAt = parse(job.created_at)
    const startedAt = parse(job.started_at)
    const finishedAt = parse(job.finished_at)

    const formatMinutes = (ms: number) => {
      const minutes = Math.max(1, Math.floor(ms / 60000))
      if (minutes < 60) return `${minutes} 分钟`
      const hours = Math.floor(minutes / 60)
      const remain = minutes % 60
      return remain > 0 ? `${hours} 小时 ${remain} 分钟` : `${hours} 小时`
    }

    if (job.status === 'queued') {
      return createdAt ? `已排队 ${formatMinutes(now - createdAt)}` : '排队中'
    }
    if (job.status === 'running') {
      const baseline = startedAt ?? createdAt
      return baseline ? `已运行 ${formatMinutes(now - baseline)}` : '生成中'
    }
    if (job.status === 'completed') {
      return finishedAt ? `完成于 ${new Date(finishedAt).toLocaleString('zh-CN', { hour12: false })}` : '已完成'
    }
    return finishedAt ? `失败于 ${new Date(finishedAt).toLocaleString('zh-CN', { hour12: false })}` : '失败'
  }

  const renderJobGroup = (groupTitle: string, items: typeof jobs, emptyText: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold tracking-wide text-slate-500">{groupTitle}</p>
        <span className="text-[11px] text-slate-400">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-xs text-slate-400">{emptyText}</div>
      ) : (
        items.slice(0, 4).map((job) => (
          <button
            key={job.id}
            type="button"
            onClick={() => {
              markJobRead(job.id)
              if (job.report_id) {
                setPendingResearchReportId(job.report_id)
              } else if (job.status === 'failed') {
                setPendingResearchJobError({
                  ticker: job.ticker,
                  tradeDate: job.trade_date,
                  errorMessage: job.error_message || '任务执行失败',
                })
              }
              navigate('/research')
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {job.ticker} · {job.trade_date}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{formatJobTime(job)}</p>
                      </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  job.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700'
                    : job.status === 'failed' || job.status === 'cancelled'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                }`}
              >
                {job.status === 'queued'
                  ? '排队中'
                  : job.status === 'running'
                    ? '生成中'
                    : job.status === 'completed'
                      ? '已完成'
                      : job.status === 'cancelled'
                        ? '已取消'
                        : '失败'}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="line-clamp-2 text-left text-xs leading-5 text-slate-500">
                    {job.status === 'failed' || job.status === 'cancelled'
                      ? job.error_message || (job.status === 'cancelled' ? '任务已取消' : '任务执行失败')
                      : job.status === 'completed'
                        ? '点击前往研报中心查看结果'
                        : '系统正在后台生成，请稍候'}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm text-xs leading-5">
                  {job.status === 'failed' || job.status === 'cancelled'
                    ? job.error_message || (job.status === 'cancelled' ? '任务已取消' : '任务执行失败')
                    : job.status === 'completed'
                      ? '点击前往研报中心查看结果'
                      : '系统正在后台生成，请稍候'}
                </TooltipContent>
              </Tooltip>
              <div className="flex items-center gap-2">
                {job.status === 'queued' || job.status === 'running' ? (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        void handleCancelJob(job.id)
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                      title="取消任务"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                    </button>
                    <LoaderCircle className="h-4 w-4 animate-spin text-amber-500" />
                  </>
                ) : null}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  )

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-xl lg:px-8">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          </div>
        </div>
        <div className="hidden flex-1 justify-center md:flex">
          <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-400">
            <Search className="h-4 w-4" />
            <span className="text-sm">搜索订单、交易对、用户或资产</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <Bell className="h-5 w-5" />
                {(unreadCount > 0 || hasActiveJobs) && (
                  <span className={`absolute right-2 top-2 rounded-full ${unreadCount > 0 ? 'h-2 w-2 bg-rose-500' : 'h-2 w-2 bg-amber-500'}`} />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[380px] rounded-2xl border-slate-200 p-0 shadow-xl">
              <div className="border-b border-slate-100 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">研报任务通知</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {hasActiveJobs ? '后台仍有研报任务执行中' : unreadCount > 0 ? `有 ${unreadCount} 条未读通知` : '当前没有新的任务通知'}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                      onClick={markAllJobsRead}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      全部已读
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-[420px] overflow-y-auto p-3">
                {jobs.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">暂无研报任务</div>
                ) : (
                  <div className="space-y-4">
                    {renderJobGroup('进行中', runningJobs, '当前没有正在执行的研报任务')}
                    {renderJobGroup('已完成', completedJobs, '当前没有已完成的研报任务')}
                    {renderJobGroup('失败 / 已取消', failedJobs, '当前没有失败或已取消的研报任务')}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex h-10 items-center gap-2 rounded-2xl px-2 text-slate-700 transition hover:bg-slate-100">
            <div className="text-slate-500"><User className="h-4 w-4" /></div>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">{currentUser?.name ?? roleInfo.name}</span>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            onClick={handleLogout}
            title="退出登录"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
