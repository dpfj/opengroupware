# Groupware Web — Next.js 클라이언트

Go 백엔드와 연동하는 그룹웨어 웹 클라이언트

## 기술 스택

| 항목 | 버전 |
|------|------|
| **Next.js** | 15.2 (App Router) |
| **React** | 19 |
| **TypeScript** | 5.6 |
| **Tailwind CSS** | v4 |
| **shadcn/ui** | Radix UI 기반 |
| **TanStack Query** | v5 (서버 상태) |
| **Zustand** | v4 (클라이언트 상태) |
| **SSE** | 네이티브 EventSource |

## 구현된 기능

| 기능 | 경로 | 설명 |
|------|------|------|
| 대시보드 | `/dashboard` | 동기화 현황, 헬스체크, 차트 |
| 파일 관리 | `/files` | 드래그앤드롭 업로드, 목록, 삭제 |
| 전자결재 | `/approval` | 기안, 승인, 반려, 회수 |
| 실시간 알림 | 전역 (헤더) | SSE 알림 벨 |

## 시작하기

```bash
# 압축 해제 후
cd groupware-web

# 의존성 설치
npm install

# 환경 변수 설정 (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080

# 개발 서버
npm run dev        # → http://localhost:3000

# 프로덕션 빌드
npm run build
npm start
```

## 백엔드 연결

Go 서버가 `localhost:8080` 에서 실행 중이어야 합니다:

```bash
# Go 서버 실행
cd groupware-sync
go run cmd/server/main.go
```

## 프로젝트 구조

```
src/
├── app/
│   ├── dashboard/page.tsx     ← 동기화 대시보드
│   ├── files/page.tsx         ← 파일 관리
│   ├── approval/page.tsx      ← 전자결재 목록
│   ├── layout.tsx             ← 루트 레이아웃
│   └── globals.css            ← Tailwind v4
│
├── components/
│   ├── approval/
│   │   ├── CreateApprovalModal.tsx   ← 기안 모달
│   │   └── ApprovalDetailModal.tsx  ← 상세/처리 모달
│   ├── layout/
│   │   ├── Sidebar.tsx   ← 사이드 네비게이션
│   │   ├── Header.tsx    ← 알림 벨 + SSE 상태
│   │   └── Providers.tsx ← TanStack Query + Sonner
│   └── realtime/
│       └── SSEProvider.tsx  ← SSE 전역 연결
│
├── hooks/
│   └── useSSE.ts         ← SSE 훅
│
├── lib/
│   ├── api.ts            ← Go API 타입 안전 클라이언트
│   └── utils.ts          ← cn() 유틸
│
├── stores/
│   └── index.ts          ← Zustand (Auth + Workspace + Notifications)
│
└── types/
    └── index.ts          ← Go 모델과 1:1 TypeScript 타입
```

## API 연결 구조

```
Go Fiber (8080)
    │
    ├── GET  /api/v1/files          → fileApi.list()
    ├── POST /api/v1/files/upload   → fileApi.upload()
    ├── GET  /api/v1/approval/docs  → approvalApi.listByAuthor()
    ├── POST /api/v1/approval/docs/:id/approve → approvalApi.approve()
    ├── GET  /api/v1/sync/status    → syncApi.status()
    ├── GET  /api/v1/watcher/report → syncApi.watcherReport()
    └── GET  /api/v1/events         → SSEProvider (EventSource)
```
