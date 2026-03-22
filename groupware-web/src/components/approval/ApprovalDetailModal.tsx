"use client"
// src/components/approval/ApprovalDetailModal.tsx

import { useState }                        from "react"
import { useMutation, useQuery }           from "@tanstack/react-query"
import { approvalApi }                      from "@/lib/api"
import { toast }                           from "sonner"
import { cn }                              from "@/lib/utils"
import { X, CheckCircle2, XCircle, RotateCcw } from "lucide-react"
import { formatDistanceToNow, parseISO }   from "date-fns"
import { ko }                              from "date-fns/locale"
import type { ApprovalDoc, DocStatus, StepStatus } from "@/types"

// ── 상태 색상 맵 ─────────────────────────────────────────────

const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  DRAFT:     "작성 중",
  IN_REVIEW: "결재 진행",
  APPROVED:  "승인",
  REJECTED:  "반려",
  WITHDRAWN: "회수",
}

const DOC_STATUS_CLASS: Record<DocStatus, string> = {
  DRAFT:     "bg-muted text-muted-foreground",
  IN_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED:  "bg-emerald-100 text-emerald-700",
  REJECTED:  "bg-red-100 text-red-700",
  WITHDRAWN: "bg-amber-100 text-amber-700",
}

const STEP_DOT: Record<StepStatus, string> = {
  APPROVED: "bg-emerald-500",
  REVIEWED: "bg-emerald-400",
  REJECTED: "bg-red-500",
  PENDING:  "bg-blue-400 animate-pulse",
  SKIPPED:  "bg-muted-foreground/30",
}

// ── ApprovalDetailModal ──────────────────────────────────────

export function ApprovalDetailModal({
  doc,
  currentUserId,
  onClose,
  onUpdated,
}: {
  doc:           ApprovalDoc
  currentUserId: string
  onClose:       () => void
  onUpdated:     () => void
}) {
  const [comment,      setComment]      = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [showReject,   setShowReject]   = useState(false)

  const currentStep = doc.steps.find(s => s.status === "PENDING")
  const isMyTurn    = currentStep?.approver_id === currentUserId
  const isAuthor    = doc.author_id === currentUserId

  // 이력 조회
  const { data: historyData } = useQuery({
    queryKey: ["approval-history", doc.id],
    queryFn:  () => approvalApi.history(doc.id),
  })

  // 승인
  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: () => approvalApi.approve(doc.id, comment),
    onSuccess:  () => { toast.success("승인했습니다"); onUpdated() },
    onError:    () => toast.error("승인 실패"),
  })

  // 반려
  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: () => approvalApi.reject(doc.id, rejectReason),
    onSuccess:  () => { toast.success("반려했습니다"); onUpdated() },
    onError:    () => toast.error("반려 실패"),
  })

  // 상신 (DRAFT 상태에서 기안자가)
  const { mutate: submit, isPending: submitting } = useMutation({
    mutationFn: () => approvalApi.submit(doc.id),
    onSuccess:  () => { toast.success("상신했습니다"); onUpdated() },
    onError:    () => toast.error("상신 실패"),
  })

  // 회수
  const { mutate: withdraw, isPending: withdrawing } = useMutation({
    mutationFn: () => approvalApi.withdraw(doc.id),
    onSuccess:  () => { toast.success("회수했습니다"); onUpdated() },
    onError:    () => toast.error("회수 실패"),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-2xl">

        {/* ── 헤더 ─────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{doc.title}</h2>
            <span className={cn(
              "mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
              DOC_STATUS_CLASS[doc.status]
            )}>
              {DOC_STATUS_LABEL[doc.status]}
            </span>
          </div>
          <button onClick={onClose} className="ml-3 shrink-0 rounded-md p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">

          {/* ── 반려 사유 ─────────────────────────────────── */}
          {doc.status === "REJECTED" && doc.reject_reason && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-600">반려 사유</p>
              <p className="mt-0.5 text-sm text-red-700">{doc.reject_reason}</p>
            </div>
          )}

          {/* ── 결재선 ───────────────────────────────────── */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">결재선</h3>
            <div className="space-y-2.5">
              {doc.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  {/* 스텝 번호 + 상태 도트 */}
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                      step.status === "APPROVED" || step.status === "REVIEWED"
                        ? "bg-emerald-500"
                        : step.status === "REJECTED"
                        ? "bg-red-500"
                        : step.status === "PENDING"
                        ? "bg-blue-500"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {i + 1}
                    </div>
                    {i < doc.steps.length - 1 && (
                      <div className="h-4 w-px bg-border" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {step.approver_id.slice(0, 16)}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {step.step_type === "REVIEW"
                          ? "(검토)"
                          : step.step_type === "REFERENCE"
                          ? "(참조)"
                          : ""
                        }
                      </span>
                      {step.status === "PENDING" && step.approver_id === currentUserId && (
                        <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          내 차례
                        </span>
                      )}
                    </div>
                    {step.comment && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        "{step.comment}"
                      </p>
                    )}
                    {step.acted_at && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDistanceToNow(parseISO(step.acted_at), {
                          addSuffix: true, locale: ko,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 문서 내용 ─────────────────────────────────── */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">내용</h3>
            <div className="rounded-lg bg-muted/50 p-4 text-sm whitespace-pre-wrap">
              {typeof doc.content.body === "string"
                ? doc.content.body
                : JSON.stringify(doc.content, null, 2)
              }
            </div>
          </div>

          {/* ── 첨부파일 ──────────────────────────────────── */}
          {doc.attach_keys.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                첨부파일 ({doc.attach_keys.length})
              </h3>
              <div className="space-y-1.5">
                {doc.attach_keys.map((key, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
                  >
                    <span className="truncate text-primary">{key.split("/").pop()}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {key}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 처리 이력 ─────────────────────────────────── */}
          {historyData?.data && historyData.data.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">처리 이력</h3>
              <div className="space-y-1.5 rounded-lg border bg-muted/30 px-4 py-3">
                {historyData.data.map((evt, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      "font-semibold",
                      evt.action === "approve" ? "text-emerald-600" :
                      evt.action === "reject"  ? "text-red-600"     :
                      evt.action === "submit"  ? "text-blue-600"    :
                      "text-muted-foreground"
                    )}>
                      {{
                        submit:   "상신",
                        approve:  "승인",
                        reject:   "반려",
                        withdraw: "회수",
                        review:   "검토",
                      }[evt.action] ?? evt.action}
                    </span>
                    <span className="text-muted-foreground">
                      by {evt.actor_id.slice(0, 12)}
                    </span>
                    {evt.comment && (
                      <span className="text-muted-foreground">— "{evt.comment}"</span>
                    )}
                    <span className="ml-auto text-muted-foreground">
                      {formatDistanceToNow(parseISO(evt.occurred_at), {
                        addSuffix: true, locale: ko,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 승인 코멘트 입력 ──────────────────────────── */}
          {isMyTurn && doc.status === "IN_REVIEW" && !showReject && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                코멘트 <span className="text-muted-foreground">(선택)</span>
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
                placeholder="승인 코멘트를 입력하세요"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          )}

          {/* ── 반려 사유 입력 ────────────────────────────── */}
          {showReject && (
            <div>
              <label className="mb-1 block text-sm font-medium text-destructive">
                반려 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="반려 사유를 입력하세요 (필수)"
                className="w-full rounded-lg border border-destructive/40 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-destructive resize-none"
              />
            </div>
          )}

          {/* ── 액션 버튼 ─────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2 border-t pt-4">

            {/* DRAFT: 상신 */}
            {isAuthor && doc.status === "DRAFT" && (
              <button
                onClick={() => submit()}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:bg-blue-700"
              >
                {submitting ? "처리 중..." : "상신하기"}
              </button>
            )}

            {/* IN_REVIEW + 내 차례: 승인 / 반려 */}
            {isMyTurn && doc.status === "IN_REVIEW" && (
              <>
                {!showReject ? (
                  <>
                    <button
                      onClick={() => approve()}
                      disabled={approving}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {approving ? "처리 중..." : "승인"}
                    </button>
                    <button
                      onClick={() => setShowReject(true)}
                      className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      반려
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => reject()}
                      disabled={!rejectReason.trim() || rejecting}
                      className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:bg-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                      {rejecting ? "처리 중..." : "반려 확정"}
                    </button>
                    <button
                      onClick={() => { setShowReject(false); setRejectReason("") }}
                      className="rounded-lg border px-4 py-2 text-sm hover:bg-accent"
                    >
                      취소
                    </button>
                  </>
                )}
              </>
            )}

            {/* IN_REVIEW: 회수 (기안자만) */}
            {isAuthor && doc.status === "IN_REVIEW" && (
              <button
                onClick={() => {
                  if (confirm("진행 중인 결재를 회수하시겠습니까?")) withdraw()
                }}
                disabled={withdrawing}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-accent disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" />
                {withdrawing ? "처리 중..." : "회수"}
              </button>
            )}

            <button
              onClick={onClose}
              className="ml-auto rounded-lg border px-4 py-2 text-sm hover:bg-accent"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
