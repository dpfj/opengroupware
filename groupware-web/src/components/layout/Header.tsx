"use client"
// src/components/layout/Header.tsx

import { Bell, Wifi, WifiOff } from "lucide-react"
import { useNotificationStore }  from "@/stores"
import { useSSEContext }          from "@/components/realtime/SSEProvider"
import { cn }                     from "@/lib/utils"
import { useState }               from "react"
import { formatDistanceToNow }    from "date-fns"
import { ko }                     from "date-fns/locale"

const EVENT_LABELS: Record<string, string> = {
  "approval.approved":    "✅ 결재 승인",
  "approval.rejected":    "❌ 결재 반려",
  "approval.step_moved":  "📋 결재 단계 이동",
  "file.uploaded":        "📁 파일 업로드",
  "notice.published":     "📢 공지사항",
  "watcher.alert":        "⚠️  시스템 알림",
  "sync.completed":       "🔄 동기화 완료",
}

export function Header() {
  const { notifications, unreadCount, markRead, clear } = useNotificationStore()
  const { connected }                                    = useSSEContext()
  const [open, setOpen]                                  = useState(false)

  const handleOpen = () => {
    setOpen(true)
    markRead()
  }

  return (
    <header className="flex h-16 items-center justify-end border-b bg-card px-6 gap-4">
      {/* SSE 연결 상태 */}
      <div className={cn(
        "flex items-center gap-1.5 text-xs",
        connected ? "text-emerald-600" : "text-muted-foreground"
      )}>
        {connected
          ? <><Wifi className="h-3.5 w-3.5" /> 실시간 연결</>
          : <><WifiOff className="h-3.5 w-3.5" /> 연결 끊김</>
        }
      </div>

      {/* 알림 벨 */}
      <div className="relative">
        <button
          onClick={handleOpen}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* 드롭다운 */}
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-10 z-20 w-80 rounded-xl border bg-card shadow-xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="text-sm font-semibold">알림</span>
                <button
                  onClick={clear}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  모두 지우기
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    새 알림이 없습니다
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="border-b px-4 py-3 last:border-0 hover:bg-accent/50"
                    >
                      <p className="text-sm font-medium">
                        {EVENT_LABELS[n.type] ?? n.type}
                      </p>
                      {n.payload.title && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {String(n.payload.title)}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(n.payload.occurred_at as string ?? Date.now()),
                          { addSuffix: true, locale: ko }
                        )}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
