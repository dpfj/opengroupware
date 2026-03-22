"use client"
// src/app/dashboard/page.tsx

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { syncApi }          from "@/lib/api"
import { useSSEContext }    from "@/components/realtime/SSEProvider"
import {
  Database, HardDrive, Zap, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, Clock,
} from "lucide-react"
import { formatDistanceToNow, parseISO } from "date-fns"
import { ko }               from "date-fns/locale"
import { toast }            from "sonner"
import { cn }               from "@/lib/utils"
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { useState, useEffect } from "react"

// ── 상태 아이콘 ─────────────────────────────────────────────

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg border px-4 py-3",
      ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
    )}>
      {ok
        ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        : <XCircle      className="h-5 w-5 text-red-500" />
      }
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-semibold", ok ? "text-emerald-700" : "text-red-600")}>
          {ok ? "정상" : "오류"}
        </p>
      </div>
    </div>
  )
}

// ── 메트릭 카드 ─────────────────────────────────────────────

function MetricCard({
  icon: Icon, label, value, sub, color = "default"
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color?: "default" | "warning" | "success" | "danger"
}) {
  const colors = {
    default: "text-foreground",
    warning: "text-amber-600",
    success: "text-emerald-600",
    danger:  "text-red-600",
  }
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className={cn("mt-2 text-2xl font-bold tabular-nums", colors[color])}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── 메인 대시보드 ────────────────────────────────────────────

export default function DashboardPage() {
  const { connected, lastEvent } = useSSEContext()
  const qc = useQueryClient()

  // 동기화 상태
  const { data: syncStatus, isLoading: syncLoading } = useQuery({
    queryKey: ["sync-status"],
    queryFn:  syncApi.status,
    refetchInterval: 10_000, // 10초마다 자동 갱신
  })

  // Watcher 리포트
  const { data: watcher } = useQuery({
    queryKey: ["watcher-report"],
    queryFn:  syncApi.watcherReport,
    refetchInterval: 30_000,
  })

  // SSE 이벤트로 즉시 갱신
  useEffect(() => {
    if (lastEvent?.type === "sync.completed") {
      qc.invalidateQueries({ queryKey: ["sync-status"] })
    }
    if (lastEvent?.type === "watcher.alert") {
      qc.invalidateQueries({ queryKey: ["watcher-report"] })
      toast.warning("Watcher 이상 감지 — 대시보드 확인")
    }
  }, [lastEvent, qc])

  // 수동 동기화
  const { mutate: triggerSync, isPending: syncing } = useMutation({
    mutationFn: syncApi.triggerSync,
    onSuccess: (result) => {
      toast.success(`동기화 완료 — ${result.upserted}건 처리`)
      qc.invalidateQueries({ queryKey: ["sync-status"] })
    },
    onError: () => toast.error("동기화 실패"),
  })

  // 더미 차트 데이터 (실제로는 API에서 수집)
  const [chartData] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      time:     `${i * 5}분 전`,
      dirty:    Math.floor(Math.random() * 200),
      upserted: Math.floor(Math.random() * 500),
    })).reverse()
  )

  const lagSeconds = syncStatus?.sync_lag
    ? parseFloat(syncStatus.sync_lag.replace("s", ""))
    : 0

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">동기화 대시보드</h1>
          <p className="text-sm text-muted-foreground">
            Storage ↔ DragonflyDB ↔ ScyllaDB 실시간 현황
          </p>
        </div>
        <button
          onClick={() => triggerSync()}
          disabled={syncing}
          className={cn(
            "flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity",
            syncing && "opacity-60 cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          {syncing ? "동기화 중..." : "즉시 동기화"}
        </button>
      </div>

      {/* 서비스 헬스 */}
      <div className="grid grid-cols-3 gap-3">
        <StatusBadge ok={watcher?.storage_ok ?? true} label="Storage" />
        <StatusBadge ok={watcher?.cache_ok   ?? true} label="DragonflyDB" />
        <StatusBadge ok={watcher?.db_ok      ?? true} label="ScyllaDB" />
      </div>

      {/* 메트릭 카드 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={Zap}
          label="동기화 대기"
          value={syncStatus?.dirty_count ?? 0}
          sub="캐시에서 DB로 미전송"
          color={
            (syncStatus?.dirty_count ?? 0) > 100 ? "warning" :
            (syncStatus?.dirty_count ?? 0) === 0 ? "success" : "default"
          }
        />
        <MetricCard
          icon={Clock}
          label="동기화 지연"
          value={`${lagSeconds.toFixed(0)}s`}
          sub={syncStatus?.last_sync_at
            ? formatDistanceToNow(parseISO(syncStatus.last_sync_at), { locale: ko, addSuffix: true })
            : "아직 없음"
          }
          color={lagSeconds > 300 ? "danger" : lagSeconds > 120 ? "warning" : "success"}
        />
        <MetricCard
          icon={HardDrive}
          label="고아 파일"
          value={watcher?.orphan_files ?? 0}
          sub="Storage에만 있는 파일"
          color={(watcher?.orphan_files ?? 0) > 0 ? "warning" : "success"}
        />
        <MetricCard
          icon={Database}
          label="유령 레코드"
          value={watcher?.ghost_records ?? 0}
          sub="DB에만 있는 레코드"
          color={(watcher?.ghost_records ?? 0) > 0 ? "warning" : "success"}
        />
      </div>

      {/* 동기화 추이 차트 */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">동기화 추이 (최근 1시간)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area
              type="monotone" dataKey="upserted"
              name="처리됨"
              stroke="#10b981" fill="#d1fae5" strokeWidth={2}
            />
            <Area
              type="monotone" dataKey="dirty"
              name="대기"
              stroke="#f59e0b" fill="#fef3c7" strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Watcher 에러 목록 */}
      {watcher?.errors && watcher.errors.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-semibold text-destructive">감지된 오류</h2>
          </div>
          <ul className="space-y-1">
            {watcher.errors.map((e, i) => (
              <li key={i} className="text-xs font-mono text-destructive/80">
                • {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SSE 연결 상태 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn(
          "h-2 w-2 rounded-full",
          connected ? "bg-emerald-500 animate-pulse" : "bg-muted"
        )} />
        {connected
          ? "실시간 업데이트 수신 중"
          : "실시간 연결 없음 — 10초마다 폴링"
        }
      </div>
    </div>
  )
}
