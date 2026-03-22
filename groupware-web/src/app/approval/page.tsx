"use client"
// src/app/approval/page.tsx

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState }                from "react"
import { approvalApi }             from "@/lib/api"
import { useWorkspaceStore, useAuthStore } from "@/stores"
import {
  ClipboardCheck, Plus, Clock, CheckCircle2,
  XCircle, ChevronRight, User, Calendar,
} from "lucide-react"
import { formatDistanceToNow, parseISO } from "date-fns"
import { ko }                      from "date-fns/locale"
import { toast }                   from "sonner"
import { cn }                      from "@/lib/utils"
import type { ApprovalDoc, DocStatus } from "@/types"
import { CreateApprovalModal }     from "@/components/approval/CreateApprovalModal"
import { ApprovalDetailModal }     from "@/components/approval/ApprovalDetailModal"

// ── 상태 배지 ──────────────────────────────────────────────

const STATUS_CONFIG: Record<DocStatus, { label: string; className: string }> = {
  DRAFT:      { label: "작성 중",   className: "bg-muted text-muted-foreground" },
  IN_REVIEW:  { label: "결재 진행", className: "bg-blue-100 text-blue-700" },
  APPROVED:   { label: "승인",      className: "bg-emerald-100 text-emerald-700" },
  REJECTED:   { label: "반려",      className: "bg-red-100 text-red-700" },
  WITHDRAWN:  { label: "회수",      className: "bg-amber-100 text-amber-700" },
}

function StatusBadge({ status }: { status: DocStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  )
}

// ── 결재 카드 ──────────────────────────────────────────────

function ApprovalCard({
  doc,
  onClick,
  isPending,
}: {
  doc:       ApprovalDoc
  onClick:   () => void
  isPending: boolean
}) {
  const currentStep = doc.steps.find(s => s.status === "PENDING")

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md",
        isPending && "border-blue-200 ring-1 ring-blue-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <StatusBadge status={doc.status} />
            {isPending && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                내 차례
              </span>
            )}
          </div>
          <h3 className="truncate font-semibold">{doc.title}</h3>
          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {doc.author_id.slice(0, 8)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(parseISO(doc.created_at), { addSuffix: true, locale: ko })}
            </span>
            {currentStep && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {currentStep.order}/{doc.steps.length} 단계
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      {/* 결재선 진행바 */}
      <div className="mt-3 flex gap-1">
        {doc.steps.map((step, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              step.status === "APPROVED" || step.status === "REVIEWED"
                ? "bg-emerald-500"
                : step.status === "REJECTED"
                ? "bg-red-500"
                : step.status === "PENDING"
                ? "bg-blue-400"
                : "bg-muted"
            )}
          />
        ))}
      </div>
    </button>
  )
}

// ── 탭 필터 ────────────────────────────────────────────────

type TabType = "pending" | "mine" | "all"

const TABS: { id: TabType; label: string }[] = [
  { id: "pending", label: "결재 요청" },
  { id: "mine",    label: "내 기안" },
]

// ── 메인 전자결재 페이지 ────────────────────────────────────

export default function ApprovalPage() {
  const workspaceId  = useWorkspaceStore(s => s.currentWorkspaceId)
  const user         = useAuthStore(s => s.user)
  const [tab, setTab]         = useState<TabType>("pending")
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<ApprovalDoc | null>(null)
  const qc = useQueryClient()

  // 결재 대기
  const { data: pendingData } = useQuery({
    queryKey: ["approval-pending", workspaceId],
    queryFn:  () => approvalApi.listPending(workspaceId),
    refetchInterval: 30_000,
  })

  // 내 기안
  const { data: mineData } = useQuery({
    queryKey: ["approval-mine", workspaceId],
    queryFn:  () => approvalApi.listByAuthor(workspaceId),
  })

  const pendingDocs = pendingData?.data ?? []
  const mineDocs    = mineData?.data    ?? []
  const currentDocs = tab === "pending" ? pendingDocs : mineDocs

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["approval-pending"] })
    qc.invalidateQueries({ queryKey: ["approval-mine"] })
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">전자결재</h1>
          <p className="text-sm text-muted-foreground">
            결재 대기 <strong className="text-foreground">{pendingDocs.length}</strong>건
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          새 기안
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            {t.id === "pending" && pendingDocs.length > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">
                {pendingDocs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {currentDocs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-muted-foreground">
          <ClipboardCheck className="h-10 w-10" />
          <p className="text-sm">
            {tab === "pending" ? "결재 요청이 없습니다" : "기안한 문서가 없습니다"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentDocs.map(doc => (
            <ApprovalCard
              key={doc.id}
              doc={doc}
              isPending={tab === "pending"}
              onClick={() => setSelectedDoc(doc)}
            />
          ))}
        </div>
      )}

      {/* 기안 모달 */}
      <CreateApprovalModal
        open={createOpen}
        workspaceId={workspaceId}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); invalidate() }}
      />

      {/* 상세/결재 처리 모달 */}
      {selectedDoc && (
        <ApprovalDetailModal
          doc={selectedDoc}
          currentUserId={user?.user_id ?? ""}
          onClose={() => setSelectedDoc(null)}
          onUpdated={() => { setSelectedDoc(null); invalidate() }}
        />
      )}
    </div>
  )
}
