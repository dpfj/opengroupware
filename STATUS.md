# OpenGroupware — 현재 상태 분석 (Phase 0 Report)

> 생성일: 2026-03-22
> 분석 대상: groupware-sdk (Go) + groupware-web (Next.js)

---

## 1. 프로젝트 구조

```
groupware/
├── groupware-sdk/          # Go 백엔드 서버
│   ├── cmd/server/         # 서버 진입점
│   ├── config/             # 설정 관리 (Viper)
│   ├── internal/           # 내부 모듈
│   │   ├── model/          # 도메인 모델
│   │   ├── auth/           # 인증 서비스 (JWT)
│   │   ├── approval/       # 전자결재 서비스
│   │   └── middleware/     # HTTP 미들웨어
│   └── pkg/                # 공용 패키지
│       ├── logger/         # 구조화 로깅 (zap)
│       └── response/       # API 응답 헬퍼
│
└── groupware-web/          # Next.js 15 프론트엔드
    └── src/
        ├── types/          # TypeScript 타입
        ├── lib/            # API 클라이언트, 유틸리티
        ├── hooks/          # React Custom Hooks
        ├── stores/         # Zustand 전역 상태
        ├── components/     # React 컴포넌트
        │   ├── layout/     # 레이아웃 (Providers, Sidebar)
        │   ├── approval/   # 전자결재 UI
        │   └── realtime/   # SSE Provider
        └── app/            # Next.js App Router
            ├── dashboard/  # 동기화 대시보드
            ├── files/      # 파일 관리
            └── approval/   # 전자결재 페이지
```

---

## 2. 의존성 분석

### 2-1. groupware-sdk (Go)

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `github.com/gin-gonic/gin` | 1.10.0 | HTTP 프레임워크 |
| `github.com/spf13/viper` | 1.18.2 | 설정 관리 (YAML) |
| `go.uber.org/zap` | 1.27.0 | 구조화 로깅 |
| `github.com/golang-jwt/jwt/v5` | 5.2.1 | JWT 인증 |
| `golang.org/x/crypto` | 0.26.0 | bcrypt 비밀번호 해싱 |
| `github.com/google/uuid` | 1.6.0 | UUID 생성 |
| `github.com/gin-contrib/cors` | 1.7.2 | CORS 미들웨어 |
| `github.com/gin-contrib/requestid` | 1.0.3 | Request ID 추적 |

**Entry Point**: `cmd/server/main.go`
**Scripts**: `Makefile` 포함 (run, build, watch)

### 2-2. groupware-web (Next.js)

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `next` | 15.2.1 | React 프레임워크 |
| `react` | 19.0.0 | UI 라이브러리 |
| `@tanstack/react-query` | 5.56.2 | 데이터 페칭 + 캐싱 |
| `zustand` | 4.5.5 | 전역 상태 관리 |
| `zod` | 3.23.8 | 스키마 검증 |
| `react-hook-form` | 7.53.0 | 폼 관리 |
| `sonner` | 1.5.0 | 토스트 알림 |
| `lucide-react` | 0.441.0 | 아이콘 |
| `recharts` | 2.13.0 | 차트 라이브러리 |
| `react-dropzone` | 14.2.9 | 파일 드래그 드롭 |
| `@radix-ui/*` | 1.x | UI 컴포넌트 |
| `tailwindcss` | 4.0.0 | CSS 프레임워크 |

**Entry Point**: `src/app/layout.tsx` → `src/app/page.tsx`
**Scripts**: `dev`, `build`, `start`, `lint`, `type-check`

---

## 3. Public API Export 목록

### 3-1. Go 백엔드 Public 함수/타입

#### config/config.go
- `Config`, `ServerConfig`, `DBConfig`, `CacheConfig`, `AuthConfig`, `StorageConfig`, `LogConfig`
- `Load() (*Config, error)`

#### pkg/logger/logger.go
- `Init(level, format string)` — Singleton 초기화
- `Get() *zap.Logger` — 로거 인스턴스 반환

#### pkg/response/response.go
- `Response`, `APIError`
- `OK()`, `Created()`, `BadRequest()`, `Unauthorized()`, `Forbidden()`, `NotFound()`, `Conflict()`, `InternalError()`

#### internal/model/types.go
- **엔티티**: `User`, `TokenPair`, `FileMetadata`, `ApprovalDoc`, `ApprovalStep`, `ApprovalEvent`, `Post`, `Comment`, `Channel`, `Message`, `CalEvent`, `Attendee`, `SSEEvent`
- **타입 Aliases**: `FileStatus`, `DocStatus`, `StepType`, `StepStatus`, `ChannelType`, `BoardType`, `PostStatus`

#### internal/auth/service.go
- `Service`, `Identity`
- `NewService(cfg config.AuthConfig) *Service`
- `Register(email, password, displayName string) (*Identity, error)`
- `Login(email, password string) (accessToken, refreshToken string, expiresAt time.Time, err error)`
- `Verify(tokenStr string) (*Identity, error)`
- `Refresh(refreshToken string) (accessToken, newRefresh string, expiresAt time.Time, err error)`
- `Logout(accessToken string) error`

#### internal/auth/handler.go
- `Handler`
- `NewHandler(svc *Service) *Handler`
- `RegisterRoutes(rg *gin.RouterGroup)`
- `Register(c *gin.Context)`, `Login(c *gin.Context)`, `Refresh(c *gin.Context)`, `Logout(c *gin.Context)`

#### internal/approval/service.go
- `Service`
- `NewService() *Service`
- `Create(...)(*model.ApprovalDoc, error)`
- `Submit(docID, submitterID string) (*model.ApprovalDoc, error)`
- `Approve(docID, approverID, comment string) (*model.ApprovalDoc, error)`
- `Reject(docID, approverID, reason string) (*model.ApprovalDoc, error)`
- `Withdraw(docID, requesterID string) (*model.ApprovalDoc, error)`
- `Get(docID string) (*model.ApprovalDoc, error)`
- `History(docID string) ([]model.ApprovalEvent, error)`
- `ListPending(approverID, workspaceID string) []*model.ApprovalDoc`
- `ListByAuthor(authorID, workspaceID string) []*model.ApprovalDoc`

#### internal/approval/handler.go
- `Handler`
- `NewHandler(svc *Service) *Handler`
- `RegisterRoutes(rg *gin.RouterGroup)`
- `Create()`, `List()`, `ListPending()`, `Get()`, `GetHistory()`, `Submit()`, `Approve()`, `Reject()`, `Withdraw()`

#### internal/middleware/auth.go
- `Auth(svc *auth.Service) gin.HandlerFunc` — JWT 인증 미들웨어
- `WorkspaceID() gin.HandlerFunc` — 워크스페이스 ID 추출
- `CurrentUserID(c *gin.Context) string`
- `CurrentWorkspaceID(c *gin.Context) string`

### 3-2. TypeScript/React Export 목록

#### src/types/index.ts
- **Interfaces**: `FileMetadata`, `ApprovalStep`, `ApprovalDoc`, `ApprovalEvent`, `SyncStatus`, `WatcherReport`, `SyncResult`, `User`, `TokenPair`, `ApiResponse<T>`, `PageResult<T>`, `SSEEvent`
- **Type Aliases**: `FileStatus`, `DocStatus`, `StepType`, `StepStatus`, `SSEEventType`

#### src/lib/api.ts
- `ApiError` (class)
- `authApi` — `login()`, `register()`, `refresh()`, `logout()`
- `fileApi` — `list()`, `get()`, `upload()`, `delete()`
- `approvalApi` — `listByAuthor()`, `listPending()`, `get()`, `history()`, `create()`, `submit()`, `approve()`, `reject()`, `withdraw()`
- `syncApi` — `status()`, `triggerSync()`, `watcherReport()`, `health()`

#### src/hooks/useSSE.ts
- `useSSE()` — SSE 연결 훅
- `useNotifications()` — 알림 전문화 훅
- `useSyncEvents()` — 동기화 이벤트 훅

#### src/stores/index.ts
- `useAuthStore` — 인증 상태 (Zustand)
- `useWorkspaceStore` — 워크스페이스 상태
- `useNotificationStore` — 알림 상태

#### src/lib/utils.ts
- `cn()` — className 병합 (clsx + tailwind-merge)

#### src/components/layout/Providers.tsx
- `Providers` — React Query + SSE Provider

#### src/components/realtime/SSEProvider.tsx
- `SSEProvider` — SSE 컨텍스트 제공
- `useSSEContext()` — SSE 컨텍스트 훅

#### src/components/approval/*.tsx
- `CreateApprovalModal`
- `ApprovalDetailModal`

---

## 4. 디자인 패턴 식별

### ✓ 현재 적용된 패턴 (13가지)

| 패턴 | 위치 | 구현 상태 |
|------|------|-----------|
| **Handler** | `internal/auth/handler.go`, `internal/approval/handler.go` | ✓ |
| **Service** | `internal/auth/service.go`, `internal/approval/service.go` | ✓ |
| **Dependency Injection** | 모든 `NewXxx()` 생성자 | ✓ |
| **Middleware** | `internal/middleware/auth.go`, `cmd/server/main.go` | ✓ |
| **Singleton** | `pkg/logger/logger.go` (`sync.Once`) | ✓ |
| **Repository/Store** | Service 내부 in-memory store (`map[string]`) | ✓ |
| **Observer/Callback** | `approval.Service.OnApproved`, `OnRejected`, `OnSubmitted`, `OnStepMoved` | ✓ |
| **Event Sourcing** (부분) | `approval.Service.history` (결재 이벤트 기록) | ✓ |
| **Hook** (React) | `src/hooks/useSSE.ts` | ✓ |
| **Provider** (React) | `src/components/layout/Providers.tsx`, `src/components/realtime/SSEProvider.tsx` | ✓ |
| **State Management** | `src/stores/index.ts` (Zustand) | ✓ |
| **Adapter/Wrapper** | `src/lib/api.ts` (API 객체 인터페이스) | ✓ |
| **CQRS** (부분) | Service의 Query/Command 분리 | ✓ |

### ✗ spec.md에 있지만 미구현된 패턴

| 패턴 | 상태 |
|------|------|
| **Factory** | ✗ — 생성자 함수만 있고 복잡한 Factory 패턴 없음 |
| **Strategy** | ✗ — 다중 알고리즘 교체 구조 없음 |
| **Builder** | ✗ — Query Builder, Event Builder 없음 |
| **Iterator** | ✗ — 커스텀 Iterator 없음 (Go의 range, TS의 for...of 사용) |
| **Proxy** | ✗ — Cache Proxy 없음 |
| **Decorator** | ✗ — 로깅/인증 래퍼가 미들웨어로만 구현 |
| **State** | ✗ — 상태 전이 머신 없음 (단순 if-else로 상태 변경) |
| **Command** | ✗ — Undo/Redo 미구현 |

---

## 5. 의존관계 그래프

### Go 모듈 의존성

```
cmd/server/main.go (진입점)
  ├── config.Load()
  ├── logger.Init()
  ├── middleware.Auth()
  ├── auth.NewService() → auth.NewHandler()
  └── approval.NewService() → approval.NewHandler()

internal/auth/service.go
  ├── config.AuthConfig
  ├── golang.org/x/crypto/bcrypt
  └── github.com/golang-jwt/jwt/v5

internal/approval/service.go
  └── internal/model (도메인 모델)

internal/middleware/auth.go
  └── internal/auth.Service
```

### TypeScript 모듈 의존성

```
app/layout.tsx (루트)
  ├── components/layout/Providers
  │   ├── @tanstack/react-query
  │   ├── sonner (Toaster)
  │   └── components/realtime/SSEProvider
  │       └── stores (useNotificationStore, useWorkspaceStore)
  └── components/layout/Sidebar

app/dashboard/page.tsx
  ├── lib/api (syncApi)
  ├── recharts (차트)
  └── stores (useWorkspaceStore)

app/approval/page.tsx
  ├── lib/api (approvalApi)
  ├── stores (useAuthStore, useWorkspaceStore)
  ├── components/approval/* (모달)
  └── @tanstack/react-query

app/files/page.tsx
  ├── lib/api (fileApi)
  ├── react-dropzone
  └── bytes (파일 크기 포맷)
```

---

## 6. TODO/FIXME/HACK 주석 수집

**검색 결과**: ✓ **0개**

- Go 파일: 0개
- TypeScript 파일: 0개

**상태**: 코드베이스가 깨끗함 (기술부채 주석 없음)

---

## 7. 테스트 파일 분석

**발견된 테스트 파일**: ✗ **0개**

- `*_test.go`: 0개
- `*.test.ts`: 0개
- `*.test.tsx`: 0개

**상태**: 테스트 미작성

**권장사항**:
1. Go: 표준 `testing` 패키지 사용, `*_test.go` 파일 작성
2. TypeScript: `vitest` 또는 `jest` 설정 후 테스트 파일 추가
3. 최소 커버리지 목표: 80% (spec.md 기준)

---

## 8. 기능 구현 현황

### ✓ 구현된 기능

| 기능 | 상태 | 파일 |
|------|------|------|
| 인증 (JWT) | ✓ | `internal/auth/service.go` |
| 회원가입/로그인 | ✓ | `internal/auth/handler.go` |
| 토큰 갱신 (Refresh) | ✓ | `internal/auth/service.go` |
| 토큰 블랙리스트 | ✓ | `internal/auth/service.go` (in-memory) |
| 전자결재 (Approval) | ✓ | `internal/approval/service.go` |
| 결재 상태 관리 | ✓ | Draft → In Review → Approved/Rejected |
| 결재 이벤트 기록 | ✓ | `approval.Service.history` |
| 실시간 알림 (SSE) | ✓ | `src/hooks/useSSE.ts`, `src/components/realtime/SSEProvider.tsx` |
| 파일 관리 페이지 | ✓ | `src/app/files/page.tsx` |
| 대시보드 | ✓ | `src/app/dashboard/page.tsx` |

### ✗ 모델은 정의되었지만 미구현된 기능

| 기능 | 상태 | 모델 위치 |
|------|------|-----------|
| 파일 스토리지 API | ✗ | `internal/model/types.go` (`FileMetadata`) |
| 공지사항 (Notice) | ✗ | `internal/model/types.go` (`Post`, `Comment`) |
| 메신저 (Messenger) | ✗ | `internal/model/types.go` (`Channel`, `Message`) |
| 캘린더 (Calendar) | ✗ | `internal/model/types.go` (`CalEvent`, `Attendee`) |
| 검색 (Search) | ✗ | 언급만 됨 |
| 큐 (Queue) | ✗ | 언급만 됨 |

---

## 9. 아키텍처 특징

### 9-1. 백엔드 아키텍처

```
HTTP Request
  ↓
Middleware (CORS → RequestID → Logging → Auth)
  ↓
Handler (HTTP 엔드포인트)
  ↓
Service (비즈니스 로직)
  ↓
In-Memory Store (map[string])
```

**특징**:
- 계층형 아키텍처 (Handler → Service → Store)
- 의존성 주입 (생성자 주입)
- In-memory 저장소 (데이터베이스 미연동)
- 구조화 로깅 (zap)
- JWT 인증 (액세스 + 리프레시 토큰)

### 9-2. 프론트엔드 아키텍처

```
App Router (Next.js 15)
  ↓
Layout (Providers)
  ├── React Query (데이터 페칭)
  ├── Zustand (전역 상태)
  └── SSE Provider (실시간)
  ↓
Page Components
  ↓
lib/api (API 클라이언트)
  ↓
Backend API
```

**특징**:
- Server Components + Client Components 혼용
- React Query로 서버 상태 캐싱
- Zustand로 클라이언트 상태 관리
- SSE로 실시간 알림
- Zod로 폼 검증
- localStorage 자동 동기화 (persist 미들웨어)

---

## 10. 데이터 흐름 예시

### 인증 흐름

```
1. 로그인 (Client)
   authApi.login(email, password)
   ↓
2. POST /api/v1/auth/login (Handler)
   handler.Login() → service.Login()
   ↓
3. 비밀번호 검증 (Service)
   bcrypt.CompareHashAndPassword()
   ↓
4. JWT 발급
   jwt.NewWithClaims() → 액세스 토큰 + 리프레시 토큰
   ↓
5. 클라이언트 저장
   useAuthStore.login() → localStorage + Zustand
```

### 전자결재 흐름

```
1. 기안 (Draft)
   Create() → in-memory store

2. 상신 (In Review)
   Submit() → OnSubmitted 콜백 → OnStepMoved 콜백

3. 결재 (Approval/Reject)
   Approve() or Reject()
   → currentStep 변경
   → history 기록
   → OnStepMoved 콜백

4. 최종 (Approved/Rejected/Withdrawn)
   Status 변경 → ClosedAt 설정
   → OnApproved/OnRejected 콜백
```

---

## 11. spec.md와의 차이점

| spec.md 기대 | 실제 구현 | 차이 |
|--------------|-----------|------|
| JavaScript 99.3% | Go + TypeScript | 언어 불일치 |
| SDK 라이브러리 | 백엔드 + 프론트엔드 풀스택 | 구조 불일치 |
| Calendar, Contact, Task 모듈 | 인증 + 전자결재만 구현 | 기능 부족 |
| Repository 패턴 (DB) | In-memory map | 영속성 없음 |
| 테스트 80% 커버리지 | 테스트 파일 0개 | 테스트 부재 |
| JSDoc | 코멘트 거의 없음 | 문서화 부족 |

**결론**: spec.md는 JavaScript SDK 라이브러리를 목표로 하지만, 실제 코드는 Go 백엔드 + Next.js 프론트엔드 웹 애플리케이션입니다. spec.md를 실제 프로젝트에 맞게 갱신해야 합니다.

---

## 12. 개선 가능 영역

### 우선순위 높음
1. **테스트 추가** — `*_test.go`, `*.test.ts` 파일 작성
2. **데이터 영속성** — PostgreSQL/MySQL 연동 (현재 in-memory)
3. **미구현 기능** — 파일, 공지사항, 메신저, 캘린더 API 구현
4. **에러 로깅** — 요청 실패 시 상세 로그 추가
5. **입력 검증** — Go의 validator 태그 추가

### 우선순위 중간
6. **권한 관리** — RBAC (Role-Based Access Control) 구현
7. **페이지네이션** — 결재 목록 페이지네이션
8. **API 문서** — Swagger/OpenAPI 스펙 생성
9. **Docker Compose** — 로컬 개발 환경 통합

### 우선순위 낮음
10. **성능 최적화** — 쿼리 최적화, 캐싱
11. **보안 강화** — Rate limiting, CSRF 방어
12. **다국어 지원** — i18n
13. **E2E 테스트** — Playwright/Cypress

---

## 13. 다음 단계 (Phase 1 시작 전 준비)

spec.md를 실제 프로젝트에 맞게 갱신한 후, Phase 1 작업을 시작해야 합니다.

**Phase 1 체크리스트** (spec.md 기준):
- [ ] `.gitignore` 갱신 (`.DS_Store` 추가 필요)
- [ ] `LICENSE` 파일 생성 (MIT)
- [ ] `CODE_OF_CONDUCT.md` 생성
- [ ] `CONTRIBUTING.md` 생성
- [ ] `CHANGELOG.md` 생성
- [ ] `README.md` 갱신 (현재 기본 템플릿만 존재)
- [ ] GitHub Issue/PR 템플릿 생성
- [ ] ESLint/Prettier 설정 (프론트엔드)
- [ ] golangci-lint 설정 (백엔드)
- [ ] pre-commit 훅 설정
- [ ] CI/CD 워크플로우 (.github/workflows)

---

## 요약

- **프로젝트 유형**: Go 백엔드 + Next.js 프론트엔드 (모노레포)
- **구현된 기능**: 인증(JWT), 전자결재, 실시간 알림(SSE), 파일 관리 UI
- **미구현 기능**: 공지사항, 메신저, 캘린더, 실제 파일 스토리지
- **디자인 패턴**: 13가지 적용 (Handler, Service, DI, Middleware, Singleton, Repository, Observer 등)
- **테스트**: 0개 (작성 필요)
- **데이터베이스**: in-memory (영속성 없음)
- **TODO 주석**: 0개 (깨끗함)
- **다음 작업**: spec.md 갱신 + Phase 1 오픈소스 인프라 구축

---

**생성 완료**: STATUS.md는 Phase 0 분석 결과를 종합한 문서입니다.
