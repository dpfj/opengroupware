"use client"
// src/app/files/page.tsx

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCallback, useState }       from "react"
import { useDropzone }                 from "react-dropzone"
import { fileApi }                     from "@/lib/api"
import { useWorkspaceStore }           from "@/stores"
import {
  Upload, FileText, Trash2, Download,
  Search, RefreshCw, CloudUpload,
} from "lucide-react"
import { formatDistanceToNow, parseISO } from "date-fns"
import { ko }                          from "date-fns/locale"
import { toast }                       from "sonner"
import { cn }                          from "@/lib/utils"
import type { FileMetadata }           from "@/types"
import bytes                           from "bytes"

// ── 파일 아이콘 ─────────────────────────────────────────────

function FileIcon({ contentType }: { contentType: string }) {
  const ext = contentType.split("/")[1] ?? ""
  const colors: Record<string, string> = {
    pdf:  "text-red-500",
    png:  "text-blue-400",
    jpg:  "text-blue-400",
    jpeg: "text-blue-400",
    zip:  "text-amber-500",
  }
  return (
    <div className={cn(
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold",
      colors[ext] ?? "text-muted-foreground"
    )}>
      {ext.toUpperCase().slice(0, 3) || "FILE"}
    </div>
  )
}

// ── 파일 행 ────────────────────────────────────────────────

function FileRow({
  file,
  onDelete,
}: {
  file:     FileMetadata
  onDelete: (key: string) => void
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 hover:shadow-sm transition-shadow">
      <FileIcon contentType={file.content_type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.key.split("/").pop()}</p>
        <p className="text-xs text-muted-foreground">{file.key}</p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-sm tabular-nums">{bytes(file.size)}</p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(parseISO(file.updated_at), { addSuffix: true, locale: ko })}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <span className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          file.status === "ACTIVE"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-muted text-muted-foreground"
        )}>
          {file.status}
        </span>
        <button
          onClick={() => onDelete(file.key)}
          className="ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── 업로드 드롭존 ───────────────────────────────────────────

function DropZone({
  workspaceId,
  onUploaded,
}: {
  workspaceId: string
  onUploaded:  () => void
}) {
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (files: File[]) => {
    setUploading(true)
    for (const file of files) {
      try {
        await fileApi.upload(workspaceId, file, (pct) => {
          setProgress(prev => ({ ...prev, [file.name]: pct }))
        })
        toast.success(`${file.name} 업로드 완료`)
      } catch {
        toast.error(`${file.name} 업로드 실패`)
      }
    }
    setProgress({})
    setUploading(false)
    onUploaded()
  }, [workspaceId, onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-accent/30"
      )}
    >
      <input {...getInputProps()} />
      <CloudUpload className={cn(
        "h-10 w-10 transition-colors",
        isDragActive ? "text-primary" : "text-muted-foreground"
      )} />
      <div className="text-center">
        <p className="text-sm font-medium">
          {isDragActive ? "여기에 놓으세요" : "파일을 드래그하거나 클릭하여 선택"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          모든 파일 형식 지원 · 최대 100MB
        </p>
      </div>
      {uploading && Object.keys(progress).length > 0 && (
        <div className="w-full max-w-xs space-y-2">
          {Object.entries(progress).map(([name, pct]) => (
            <div key={name}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="truncate">{name}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 메인 파일 관리 페이지 ────────────────────────────────────

export default function FilesPage() {
  const workspaceId = useWorkspaceStore(s => s.currentWorkspaceId)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["files", workspaceId, page],
    queryFn:  () => fileApi.list(workspaceId, page, 20),
  })

  const { mutate: deleteFile } = useMutation({
    mutationFn: (key: string) => fileApi.delete(key, workspaceId),
    onSuccess: () => {
      toast.success("파일 삭제 완료")
      qc.invalidateQueries({ queryKey: ["files"] })
    },
    onError: () => toast.error("파일 삭제 실패"),
  })

  const files = (data?.data ?? []).filter(f =>
    search ? f.key.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">파일 관리</h1>
          <p className="text-sm text-muted-foreground">
            워크스페이스: <code className="text-xs">{workspaceId}</code>
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" />
          새로고침
        </button>
      </div>

      {/* 드롭존 */}
      <DropZone
        workspaceId={workspaceId}
        onUploaded={() => qc.invalidateQueries({ queryKey: ["files"] })}
      />

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="파일 검색..."
          className="w-full rounded-lg border bg-card py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* 파일 목록 */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-muted-foreground">
          <FileText className="h-10 w-10" />
          <p className="text-sm">파일이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(file => (
            <FileRow
              key={file.key}
              file={file}
              onDelete={(key) => {
                if (confirm("파일을 삭제하시겠습니까?")) deleteFile(key)
              }}
            />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {(data?.total ?? 0) > 20 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-accent"
          >
            이전
          </button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            {page} / {Math.ceil((data?.total ?? 0) / 20)}
          </span>
          <button
            disabled={page * 20 >= (data?.total ?? 0)}
            onClick={() => setPage(p => p + 1)}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-accent"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
