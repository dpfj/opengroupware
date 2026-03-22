"use client"
// src/components/approval/CreateApprovalModal.tsx

import { useState }          from "react"
import { useForm }           from "react-hook-form"
import { zodResolver }       from "@hookform/resolvers/zod"
import { z }                 from "zod"
import { useMutation }       from "@tanstack/react-query"
import { approvalApi }        from "@/lib/api"
import { toast }             from "sonner"
import { Plus, Trash2, X }  from "lucide-react"

const schema = z.object({
  title:       z.string().min(1, "제목을 입력하세요"),
  template_id: z.string().min(1, "양식을 선택하세요"),
  content:     z.string().min(1, "내용을 입력하세요"),
  approvers:   z.array(z.string().min(1)).min(1, "결재자를 1명 이상 추가하세요"),
})

type FormData = z.infer<typeof schema>

const TEMPLATES = [
  { id: "general",  label: "일반 기안서" },
  { id: "vacation", label: "휴가 신청서" },
  { id: "expense",  label: "지출 품의서" },
  { id: "contract", label: "계약서 검토" },
]

export function CreateApprovalModal({
  open, workspaceId, onClose, onCreated,
}: {
  open:        boolean
  workspaceId: string
  onClose:     () => void
  onCreated:   () => void
}) {
  const [approvers, setApprovers] = useState<string[]>([""])
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate: createDoc, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      approvalApi.create({
        workspace_id: workspaceId,
        title:        data.title,
        template_id:  data.template_id,
        content:      { body: data.content },
        steps:        approvers.filter(Boolean).map(id => ({ approver_id: id })),
      }),
    onSuccess: () => {
      toast.success("기안이 생성됐습니다")
      reset()
      setApprovers([""])
      onCreated()
    },
    onError: () => toast.error("기안 생성 실패"),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-card shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">새 기안</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 폼 */}
        <form
          onSubmit={handleSubmit(d => createDoc(d))}
          className="space-y-4 px-6 py-5"
        >
          {/* 제목 */}
          <div>
            <label className="mb-1 block text-sm font-medium">제목</label>
            <input
              {...register("title")}
              placeholder="기안 제목"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* 양식 선택 */}
          <div>
            <label className="mb-1 block text-sm font-medium">양식</label>
            <select
              {...register("template_id")}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">양식 선택...</option>
              {TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            {errors.template_id && (
              <p className="mt-1 text-xs text-destructive">{errors.template_id.message}</p>
            )}
          </div>

          {/* 내용 */}
          <div>
            <label className="mb-1 block text-sm font-medium">내용</label>
            <textarea
              {...register("content")}
              rows={4}
              placeholder="기안 내용을 입력하세요"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            {errors.content && (
              <p className="mt-1 text-xs text-destructive">{errors.content.message}</p>
            )}
          </div>

          {/* 결재선 */}
          <div>
            <label className="mb-1 block text-sm font-medium">결재선</label>
            <div className="space-y-2">
              {approvers.map((_, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={approvers[i]}
                    onChange={e => {
                      const next = [...approvers]
                      next[i] = e.target.value
                      setApprovers(next)
                    }}
                    placeholder={`${i + 1}차 결재자 ID`}
                    className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  {approvers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setApprovers(approvers.filter((_, j) => j !== i))}
                      className="rounded-lg border p-2 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setApprovers([...approvers, ""])}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Plus className="h-4 w-4" />
                결재자 추가
              </button>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border py-2 text-sm hover:bg-accent"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {isPending ? "기안 중..." : "기안하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 결재 상세 모달
// ─────────────────────────────────────────────

import { useMutation as useMut2, useQuery } from "@tanstack/react-query"
import type { ApprovalDoc } from "@/types"
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react"

export function ApprovalDetailModal({
  doc, currentUserId, onClose, onUpdated,
}: {
  doc:           ApprovalDoc
  currentUserId: string
  onClose:       () => void
  onUpdated:     () => void
}) {
  const [comment, setComment] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [showReject, setShowReject] = useState(false)

  const currentStep = doc.steps.find(s => s.status === "PENDING")
  const isMyTurn    = currentStep?.approver_id === currentUserId
  const isAuthor    = doc.author_id === currentUserId

  // 이력 조회
  const { data: historyData } = useQuery({
    queryKey: ["approval-history", doc.id],
    queryFn:  () => approvalApi.history(doc.id),
  })

  const { mutate: approve, isPending: approving } = useMut2({
    mutationFn: () => approvalApi.approve(doc.id, comment),
    onSuccess:  () => { toast.success("승인했습니다"); onUpdated() },
    onError:    () => toast.error("승인 실패"),
  })

  const { mutate: reject, isPending: rejecting } = useMut2({
    mutationFn: () => approvalApi.reject(doc.id, rejectReason),
    onSuccess:  () => { toast.success("반려했습니다"); onUpdated() },
    onError:    () => toast.error("반려 실패"),
  })

  const { mutate: withdraw, isPending: withdrawing } = useMut2({
    mutationFn: () => approvalApi.withdraw(doc.id),
    onSuccess:  () => { toast.success("회수했습니다"); onUpdated() },
    onError:    () => toast.error("회수 실패"),
  })

  const STATUS_STEP_COLORS: Record<string, string> = {
    APPROVED: "bg-emerald-500",
    REVIEWED: "bg-emerald-400",
    REJECTED: "bg-red-500",
    PENDING:  "bg-blue-400",
    SKIPPED:  "bg-muted",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-2xl">
        {/* 헤더 */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-card px-6 py-4">
          <h2 className="text-lg font-semibold truncate">{doc.title}</h2>
          <button onClick={onClose} className="shrink-0 rounded-md p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* 상태 */}
          <div className="flex items-center gap-3">
            <span className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              doc.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
              doc.status === "REJECTED" ? "bg-red-100 text-red-700" :
              doc.status === "IN_REVIEW"? "bg-blue-100 text-blue-700" :
              "bg-muted text-muted-foreground"
            )}>
              {{
                DRAFT: "작성 중", IN_REVIEW: "결재 진행",
                APPROVED: "승인", REJECTED: "반려", WITHDRAWN: "회수"
              }[doc.status]}
            </span>
            {doc.reject_reason && (
              <p className="text-sm text-red-600">사유: {doc.reject_reason}</p>
            )}
          </div>

          {/* 결재선 */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">결재선</h3>
            <div className="space-y-2">
              {doc.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    STATUS_STEP_COLORS[step.status]
                  )} />
                  <span className="text-sm">
                    {i + 1}차 — {step.approver_id.slice(0, 12)}
                  </span>
                  {step.comment && (
                    <span className="text-xs text-muted-foreground">"{step.comment}"</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 내용 */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">내용</h3>
            <div className="rounded-lg bg-muted p-3 text-sm">
              {String(doc.content.body ?? JSON.stringify(doc.content))}
            </div>
          </div>

          {/* 이력 */}
          {historyData?.data && historyData.data.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">처리 이력</h3>
              <div className="space-y-1.5">
                {historyData.data.map((evt, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{evt.action}</span>
                    <span>by {evt.actor_id.slice(0, 8)}</span>
                    {evt.comment && <span>— "{evt.comment}"</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 승인 코멘트 입력 */}
          {isMyTurn && doc.status === "IN_REVIEW" && (
            <div>
              <label className="mb-1 block text-sm font-medium">코멘트 (선택)</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
                placeholder="승인 코멘트..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          )}

          {/* 반려 사유 입력 */}
          {showReject && (
            <div>
              <label className="mb-1 block text-sm font-medium text-destructive">반려 사유 *</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={2}
                placeholder="반려 사유를 입력하세요"
                className="w-full rounded-lg border border-destructive/50 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-destructive resize-none"
              />
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex flex-wrap gap-2 border-t pt-4">
            {/* 결재자: 승인 / 반려 */}
            {isMyTurn && doc.status === "IN_REVIEW" && (
              <>
                <button
                  onClick={() => approve()}
                  disabled={approving}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {approving ? "처리 중..." : "승인"}
                </button>
                {!showReject ? (
                  <button
                    onClick={() => setShowReject(true)}
                    className="flex items-center gap-2 rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="h-4 w-4" />
                    반려
                  </button>
                ) : (
                  <button
                    onClick={() => reject()}
                    disabled={!rejectReason.trim() || rejecting}
                    className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" />
                    {rejecting ? "처리 중..." : "반려 확정"}
                  </button>
                )}
              </>
            )}

            {/* 기안자: 회수 */}
            {isAuthor && doc.status === "IN_REVIEW" && (
              <button
                onClick={() => { if (confirm("회수하시겠습니까?")) withdraw() }}
                disabled={withdrawing}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-accent"
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
