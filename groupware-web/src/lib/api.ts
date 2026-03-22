// src/lib/api.ts
// Go Fiber 백엔드와 통신하는 타입 안전 API 클라이언트

import type {
  ApprovalDoc, ApprovalEvent, ApprovalStep,
  FileMetadata, SyncStatus, SyncResult,
  WatcherReport, TokenPair, User,
} from "@/types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

// ── 공통 fetch 래퍼 ────────────────────────────────────────

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

async function request<T>(
  path:    string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("access_token")
    : null

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new ApiError(res.status, body.error ?? "요청 실패")
  }

  return res.json()
}

// ── 인증 ────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ data: TokenPair }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, displayName: string) =>
    request<{ data: User }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, display_name: displayName }),
    }),

  refresh: (refreshToken: string) =>
    request<{ data: TokenPair }>("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  logout: () =>
    request<void>("/api/v1/auth/logout", { method: "POST" }),
}

// ── 파일 관리 ────────────────────────────────────────────────

export const fileApi = {
  // 파일 목록 조회
  list: (workspaceId: string, page = 1, pageSize = 20) =>
    request<{ data: FileMetadata[]; total: number }>(
      `/api/v1/files?workspace_id=${workspaceId}&page=${page}&page_size=${pageSize}`
    ),

  // 단건 조회
  get: (key: string, workspaceId: string) =>
    request<{ data: FileMetadata; source: string }>(
      `/api/v1/files/${encodeURIComponent(key)}?workspace_id=${workspaceId}`
    ),

  // 파일 업로드 (multipart)
  upload: async (
    workspaceId: string,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<FileMetadata> => {
    const token = localStorage.getItem("access_token") ?? ""
    const formData = new FormData()
    formData.append("file", file)
    formData.append("workspace_id", workspaceId)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", `${BASE_URL}/api/v1/files/upload`)
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress)
          onProgress(Math.round((e.loaded / e.total) * 100))
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText).data)
        } else {
          reject(new ApiError(xhr.status, "업로드 실패"))
        }
      }
      xhr.onerror = () => reject(new ApiError(0, "네트워크 오류"))
      xhr.send(formData)
    })
  },

  // 파일 삭제
  delete: (key: string, workspaceId: string) =>
    request<void>(`/api/v1/files/${encodeURIComponent(key)}`, {
      method: "DELETE",
      body: JSON.stringify({ workspace_id: workspaceId }),
    }),
}

// ── 전자결재 ─────────────────────────────────────────────────

export const approvalApi = {
  // 결재 문서 목록 (내가 기안한)
  listByAuthor: (workspaceId: string) =>
    request<{ data: ApprovalDoc[] }>(
      `/api/v1/approval/docs?workspace_id=${workspaceId}&by=author`
    ),

  // 결재 대기 목록 (내가 결재해야 할)
  listPending: (workspaceId: string) =>
    request<{ data: ApprovalDoc[] }>(
      `/api/v1/approval/docs/pending?workspace_id=${workspaceId}`
    ),

  // 단건 조회
  get: (docId: string) =>
    request<{ data: ApprovalDoc }>(`/api/v1/approval/docs/${docId}`),

  // 결재 문서 이력
  history: (docId: string) =>
    request<{ data: ApprovalEvent[] }>(`/api/v1/approval/docs/${docId}/history`),

  // 기안
  create: (payload: {
    workspace_id:  string
    title:         string
    template_id:   string
    content:       Record<string, unknown>
    steps:         Array<{ approver_id: string; step_type?: string }>
    attach_keys?:  string[]
  }) =>
    request<{ data: ApprovalDoc }>("/api/v1/approval/docs", {
      method: "POST",
      body:   JSON.stringify(payload),
    }),

  // 상신
  submit: (docId: string) =>
    request<{ data: ApprovalDoc }>(`/api/v1/approval/docs/${docId}/submit`, {
      method: "POST",
    }),

  // 승인
  approve: (docId: string, comment: string) =>
    request<{ data: ApprovalDoc }>(`/api/v1/approval/docs/${docId}/approve`, {
      method: "POST",
      body:   JSON.stringify({ comment }),
    }),

  // 반려
  reject: (docId: string, reason: string) =>
    request<{ data: ApprovalDoc }>(`/api/v1/approval/docs/${docId}/reject`, {
      method: "POST",
      body:   JSON.stringify({ reason }),
    }),

  // 회수
  withdraw: (docId: string) =>
    request<{ data: ApprovalDoc }>(`/api/v1/approval/docs/${docId}/withdraw`, {
      method: "POST",
    }),
}

// ── 동기화 / 대시보드 ─────────────────────────────────────────

export const syncApi = {
  status: () =>
    request<SyncStatus>("/api/v1/sync/status"),

  triggerSync: () =>
    request<SyncResult>("/api/v1/sync/trigger", { method: "POST" }),

  watcherReport: () =>
    request<WatcherReport>("/api/v1/watcher/report"),

  health: () =>
    request<{ status: string; storage_ok: boolean; cache_ok: boolean; db_ok: boolean }>(
      "/health"
    ),
}
