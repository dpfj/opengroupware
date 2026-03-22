"use client"
// src/hooks/useSSE.ts
// Go 백엔드 SSE 엔드포인트와 실시간 연결

import { useEffect, useRef, useCallback, useState } from "react"
import type { SSEEvent, SSEEventType } from "@/types"

interface UseSSEOptions {
  workspaceId: string
  topics?:     string[]
  onEvent?:    (event: SSEEvent) => void
  onError?:    (error: Event) => void
}

interface SSEState {
  connected: boolean
  lastEvent: SSEEvent | null
  error:     string | null
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

export function useSSE({
  workspaceId,
  topics = [],
  onEvent,
  onError,
}: UseSSEOptions) {
  const [state, setState] = useState<SSEState>({
    connected: false,
    lastEvent: null,
    error:     null,
  })

  const esRef      = useRef<EventSource | null>(null)
  const retryRef   = useRef<ReturnType<typeof setTimeout>>()
  const retryCount = useRef(0)
  const MAX_RETRY  = 5

  const connect = useCallback(() => {
    const token = localStorage.getItem("access_token") ?? ""
    const topicParams = topics.length > 0
      ? topics.map(t => `topic=${encodeURIComponent(t)}`).join("&")
      : `topic=workspace:${workspaceId}`

    const url = `${BASE_URL}/api/v1/events?${topicParams}&token=${token}`
    const es  = new EventSource(url)
    esRef.current = es

    es.onopen = () => {
      setState(prev => ({ ...prev, connected: true, error: null }))
      retryCount.current = 0
    }

    es.onmessage = (raw) => {
      try {
        const event: SSEEvent = JSON.parse(raw.data)
        setState(prev => ({ ...prev, lastEvent: event }))
        onEvent?.(event)
      } catch (e) {
        console.warn("SSE 파싱 오류:", e)
      }
    }

    es.onerror = (err) => {
      setState(prev => ({ ...prev, connected: false }))
      onError?.(err)
      es.close()

      // 지수 백오프 재연결
      if (retryCount.current < MAX_RETRY) {
        const delay = Math.min(1000 * 2 ** retryCount.current, 30000)
        retryCount.current++
        retryRef.current = setTimeout(connect, delay)
      } else {
        setState(prev => ({
          ...prev,
          error: "SSE 연결 실패 — 최대 재시도 횟수 초과"
        }))
      }
    }
  }, [workspaceId, topics, onEvent, onError])

  useEffect(() => {
    connect()
    return () => {
      esRef.current?.close()
      clearTimeout(retryRef.current)
    }
  }, [connect])

  const disconnect = useCallback(() => {
    esRef.current?.close()
    clearTimeout(retryRef.current)
    setState(prev => ({ ...prev, connected: false }))
  }, [])

  return { ...state, disconnect }
}

// ── 이벤트 타입별 특화 훅 ──────────────────────────────────

export function useNotifications(workspaceId: string) {
  const [notifications, setNotifications] = useState<SSEEvent[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)

  const { connected } = useSSE({
    workspaceId,
    onEvent: (event) => {
      // 알림 관련 이벤트만 수집
      const notifTypes: SSEEventType[] = [
        "approval.approved",
        "approval.rejected",
        "approval.step_moved",
        "notice.published",
        "file.uploaded",
        "watcher.alert",
      ]
      if (notifTypes.includes(event.type)) {
        setNotifications(prev => [event, ...prev].slice(0, 50))
        setUnreadCount(prev => prev + 1)
      }
    },
  })

  const markAllRead = useCallback(() => setUnreadCount(0), [])
  const clear       = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return { notifications, unreadCount, connected, markAllRead, clear }
}

export function useSyncEvents(workspaceId: string) {
  const [lastSync, setLastSync] = useState<SSEEvent | null>(null)

  const { connected } = useSSE({
    workspaceId,
    topics: [`workspace:${workspaceId}`],
    onEvent: (event) => {
      if (event.type === "sync.completed") {
        setLastSync(event)
      }
    },
  })

  return { lastSync, connected }
}
