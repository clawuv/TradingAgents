import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage, getResearchWsUrl, getStoredAuthToken, listResearchJobs, type ResearchJob } from '@/services/api'
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
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = useRef(0)
  const mountedRef = useRef(true)

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
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Status-change toast detection
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

  // WebSocket connection management
  useEffect(() => {
    if (isLoading || !isAuthenticated) return

    void refreshJobs()

    const connect = () => {
      const token = getStoredAuthToken()
      if (!token || !mountedRef.current) return

      const ws = new WebSocket(getResearchWsUrl(token))
      wsRef.current = ws

      ws.onmessage = (event) => {
        try {
          const job: ResearchJob = JSON.parse(event.data)
          upsertJob(job)
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = (event) => {
        wsRef.current = null
        if (!mountedRef.current) return
        // Auth failure — don't reconnect
        if (event.code === 4001) return
        // Reconnect with exponential backoff
        const delay = Math.min(3000 * Math.pow(2, reconnectAttemptRef.current), 30000)
        reconnectAttemptRef.current += 1
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect()
        }, delay)
      }

      ws.onerror = () => {
        // onclose will fire after onerror, reconnect handled there
      }

      reconnectAttemptRef.current = 0
    }

    connect()

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [isAuthenticated, isLoading, refreshJobs, upsertJob])

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setJobs([])
      setUnreadIds(new Set())
      previousStatusesRef.current = {}
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
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
