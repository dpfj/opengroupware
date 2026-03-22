// src/types/index.ts
// 서버 Go 모델과 1:1 대응하는 TypeScript 타입

// ── 파일 메타데이터 ────────────────────────────────────────
export type FileStatus = "ACTIVE" | "DELETED" | "ORPHAN" | "GHOST" | "MISMATCH"

export interface FileMetadata {
  key:          string
  workspace_id: string
  size:         number
  etag:         string
  content_type: string
  status:       FileStatus
  uploader_id:  string
  created_at:   string
  updated_at:   string
  synced_at:    string
}

// ── 전자결재 ───────────────────────────────────────────────
export type DocStatus  = "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "WITHDRAWN"
export type StepType   = "APPROVAL" | "REVIEW" | "REFERENCE"
export type StepStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVIEWED" | "SKIPPED"

export interface ApprovalStep {
  order:       number
  approver_id: string
  step_type:   StepType
  status:      StepStatus
  comment:     string
  acted_at:    string | null
}

export interface ApprovalDoc {
  id:            string
  workspace_id:  string
  author_id:     string
  title:         string
  template_id:   string
  content:       Record<string, unknown>
  steps:         ApprovalStep[]
  status:        DocStatus
  attach_keys:   string[]
  reject_reason: string
  created_at:    string
  updated_at:    string
  submitted_at:  string | null
  closed_at:     string | null
}

export interface ApprovalEvent {
  doc_id:      string
  actor_id:    string
  action:      string
  comment:     string
  step_order:  number | null
  occurred_at: string
}

// ── 동기화 현황 (대시보드) ────────────────────────────────
export interface SyncStatus {
  dirty_count:   number
  last_sync_at:  string | null
  sync_lag:      string
  cache_stats:   Record<string, unknown>
}

export interface WatcherReport {
  storage_ok:    boolean
  cache_ok:      boolean
  db_ok:         boolean
  sync_lag:      string
  mismatches:    number
  orphan_files:  number
  ghost_records: number
  checked_at:    string
  errors:        string[]
}

export interface SyncResult {
  total:      number
  upserted:   number
  skipped:    number
  failed:     number
  duration:   string
  started_at: string
  errors:     string[]
}

// ── 사용자 / 인증 ──────────────────────────────────────────
export interface User {
  user_id:      string
  email:        string
  display_name: string
  roles:        string[]
}

export interface TokenPair {
  access_token:  string
  refresh_token: string
  expires_at:    string
}

// ── 공통 ──────────────────────────────────────────────────
export interface ApiResponse<T> {
  data:    T
  source?: "cache" | "db"
  error?:  string
}

export interface PageResult<T> {
  items:      T[]
  total:      number
  page:       number
  page_size:  number
}

// ── SSE 이벤트 ─────────────────────────────────────────────
export type SSEEventType =
  | "file.uploaded"
  | "approval.approved"
  | "approval.rejected"
  | "approval.step_moved"
  | "notice.published"
  | "chat.message"
  | "sync.completed"
  | "watcher.alert"

export interface SSEEvent {
  id:           string
  type:         SSEEventType
  topic:        string
  payload:      Record<string, unknown>
  workspace_id: string
}
