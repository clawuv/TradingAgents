import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage, listResearchJobs, type ResearchJob } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

type ResearchNotificationsContextValue = {
  jobs: ResearchJob[]
  unreadCount: number
  hasActiveJobs: boolean
  refreshJobs: () => Promise<void>
  upsertJob: (job: ResearchJob) => void
  markJobRead: (jobId: string) => void
  markAllJobsRead: () => void
}

const ResearchNotificationsContext = createContext<ResearchNotificationsContextValue | null>(null)

export function ResearchNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const [jobs, setJobs] = useState<ResearchJob[]>([])
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set())
  const previousStatusesRef = useRef<Record<string, string>>({})

  const refreshJobs = useCallback(async () => {
    if (!isAuthenticated) {
      setJobs([])
      setUnreadIds(new Set())
      previousStatusesRef.current = {}
      return
    }
    try {
      const items = await listResearchJobs()
      setJobs(items)
    } catch (error) {
      console.warn(getApiErrorMessage(error))
    }
  }, [isAuthenticated])

  const upsertJob = useCallback((job: ResearchJob) => {
    setJobs((prev) => [job, ...prev.filter((item) => item.id !== job.id)])
  }, [])

  const markJobRead = useCallback((jobId: string) => {
    setUnreadIds((prev) => {
      const next = new Set(prev)
      next.delete(jobId)
      return next
    })
  }, [])

  const markAllJobsRead = useCallback(() => {
    setUnreadIds(new Set())
  }, [])

  useEffect(() => {
    if (isLoading) return
    void refreshJobs()
    if (!isAuthenticated) return
    const timer = window.setInterval(() => {
      void refreshJobs()
    }, 5000)
    return () => window.clearInterval(timer)
  }, [isAuthenticated, isLoading, refreshJobs])

  useEffect(() => {
    const previousStatuses = previousStatusesRef.current
    for (const job of jobs) {
      const previousStatus = previousStatuses[job.id]
      if (previousStatus && previousStatus !== job.status) {
        if (job.status === 'completed') {
          setUnreadIds((prev) => new Set(prev).add(job.id))
          toast.success(`${job.ticker} 研报已生成完成`)
        } else if (job.status === 'failed') {
          setUnreadIds((prev) => new Set(prev).add(job.id))
          toast.error(job.error_message || `${job.ticker} 研报生成失败`)
        }
      }
      previousStatuses[job.id] = job.status
    }
  }, [jobs])

  useEffect(() => {
    if (!isAuthenticated) {
      setJobs([])
      setUnreadIds(new Set())
      previousStatusesRef.current = {}
    }
  }, [isAuthenticated])

  const value = useMemo<ResearchNotificationsContextValue>(
    () => ({
      jobs,
      unreadCount: unreadIds.size,
      hasActiveJobs: jobs.some((job) => job.status === 'queued' || job.status === 'running'),
      refreshJobs,
      upsertJob,
      markJobRead,
      markAllJobsRead,
    }),
    [jobs, markAllJobsRead, markJobRead, refreshJobs, unreadIds.size, upsertJob],
  )

  return <ResearchNotificationsContext.Provider value={value}>{children}</ResearchNotificationsContext.Provider>
}

export function useResearchNotifications() {
  const context = useContext(ResearchNotificationsContext)
  if (!context) throw new Error('useResearchNotifications must be used within ResearchNotificationsProvider')
  return context
}
