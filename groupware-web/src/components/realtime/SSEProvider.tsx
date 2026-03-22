"use client"
// src/components/realtime/SSEProvider.tsx

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { toast }                    from "sonner"
import { useNotificationStore }     from "@/stores"
import { useWorkspaceStore }        from "@/stores"
import type { SSEEvent, SSEEventType } from "@/types"

interface SSEContextValue {
  connected: boolean
  lastEvent: SSEEvent | null
}

const SSEContext = createContext<SSEContextValue>({
  connected: false,
  lastEvent: null,
})

export const useSSEContext = () => useContext(SSEContext)

// 토스트 알림을 띄울 이벤트 타입
const TOAST_EVENTS: Partial<Record<SSEEventType, (p: SSEEvent["payload"]) => void>> = {
  "approval.approved":   (p) => toast.success(`결재 승인: ${p.title}`),
  "approval.rejected":   (p) => toast.error(`결재 반려: ${p.reason}`),
  "approval.step_moved": (p) => toast.info("결재 단계가 이동됐습니다"),
  "file.uploaded":       (p) => toast.success(`파일 업로드: ${p.filename}`),
  "notice.published":    (p) => toast.info(`새 공지: ${p.title}`),
  "watcher.alert":       (p) => toast.warning("시스템 이상 감지", { duration: 10000 }),
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null)

  const esRef        = useRef<EventSource | null>(null)
  const retryRef     = useRef<ReturnType<typeof setTimeout>>()
  const retryCount   = useRef(0)

  const addNotif     = useNotificationStore(s => s.addNotif)
  const workspaceId  = useWorkspaceStore(s => s.currentWorkspaceId)

  const connect = useCallback(() => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("access_token") ?? ""
      : ""

    // 로그인 안 된 경우 연결 안 함
    if (!token) return

    const url = `${BASE_URL}/api/v1/events?topic=workspace:${workspaceId}&token=${encodeURIComponent(token)}`
    const es  = new EventSource(url)
    esRef.current = es

    es.onopen = () => {
      setConnected(true)
      retryCount.current = 0
    }

    es.onmessage = (raw) => {
      try {
        const event: SSEEvent = JSON.parse(raw.data)
        setLastEvent(event)

        // 알림 스토어에 추가
        addNotif(event)

        // 토스트 알림
        const showToast = TOAST_EVENTS[event.type]
        showToast?.(event.payload)

      } catch (e) {
        console.warn("SSE 파싱 오류:", e)
      }
    }

    es.onerror = () => {
      setConnected(false)
      es.close()

      if (retryCount.current < 5) {
        const delay = Math.min(1000 * 2 ** retryCount.current, 30000)
        retryCount.current++
        retryRef.current = setTimeout(connect, delay)
      }
    }
  }, [workspaceId, addNotif])

  useEffect(() => {
    connect()
    return () => {
      esRef.current?.close()
      clearTimeout(retryRef.current)
    }
  }, [connect])

  return (
    <SSEContext.Provider value={{ connected, lastEvent }}>
      {children}
    </SSEContext.Provider>
  )
}
