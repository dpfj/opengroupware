# OpenGroupware — Project Specification v2.0

> **이 문서는 프로젝트의 단일 진실 원천(Single Source of Truth)이다.**
> Claude Code는 이 spec을 읽고 자동으로 작업을 수행한다.

---

## 0. 메타

| 항목 | 값 |
|------|-----|
| 저장소 | https://github.com/dpfj/opengroupware |
| 구조 | 모노레포 (`groupware-sdk` + `groupware-web`) |
| 언어 | Go (백엔드) + TypeScript (프론트엔드) |
| 라이선스 | MIT |
| 목표 | 퍼블릭 오픈소스 그룹웨어 풀스택 애플리케이션 |

---

## 1. 아키텍처 원칙

### 1-1. 디자인 패턴 (모든 모듈 필수 적용)

| 패턴 | 용도 | 적용 위치 |
|------|------|-----------|
| **Repository** | 데이터 접근 추상화 | 모든 데이터 레이어 |
| **Factory** | 객체 생성 캡슐화 | 모듈/서비스 인스턴스 생성 |
| **Observer/EventEmitter** | 이벤트 기반 통신 | 모듈 간 느슨한 결합 |
| **Strategy** | 알고리즘 교체 | 인증, 스토리지, 직렬화 |
| **Adapter** | 외부 인터페이스 변환 | API, 스토리지 백엔드 |
| **Facade** | 서브시스템 단순화 | SDK 메인 진입점 |
| **Command** | 작업 캡슐화 | Undo/Redo, 태스크 큐 |
| **Middleware/Pipeline** | 요청/응답 체인 | API 호출, 데이터 변환 |
| **State** | 상태 전이 관리 | Task 상태, 연결 상태 |
| **Singleton** | 전역 인스턴스 제어 | EventBus, Config, Logger |
| **Builder** | 복잡한 객체 조립 | Query Builder, Event Builder |
| **Iterator** | 순회 추상화 | 페이지네이션, 컬렉션 순회 |
| **Proxy** | 접근 제어/캐싱 | Cache Proxy, Lazy Loading |
| **Decorator** | 기능 동적 추가 | 로깅, 인증 래퍼 |

### 1-2. 마이그레이션 친화적 설계 규칙

1. 인터페이스 먼저 → JSDoc `@interface`로 계약 정의 후 구현
2. 의존성 주입(DI) → `new` 직접 호출 금지, 팩토리/컨테이너 사용
3. 순수 함수 선호 → 사이드 이펙트 최소화
4. 데이터 구조 명시 → JSDoc `@typedef`로 모든 엔티티 스키마 정의
5. 표준 에러 코드 → 상수로 관리 (언어 무관 매핑)
6. 계층 분리 → Presentation → Application → Domain → Infrastructure
7. 프레임워크 매직 금지 → 데코레이터, 매직 메서드 사용하지 않는다
8. 직렬화 가능 → 모든 상태 객체는 JSON 직렬화/역직렬화 가능
9. 3단계 이상 상속 금지 → Composition over Inheritance
10. 순환 의존 금지 → 단방향 의존만 허용

```
┌─────────────────────────────────────────────┐
│            Facade (SDK Entry)               │
├─────────────────────────────────────────────┤
│         Application / UseCase               │
├──────┬────────┬──────┬─────────┬────────────┤
│ Cal  │Contact │ Task │ Message │  Storage   │
├──────┴────────┴──────┴─────────┴────────────┤
│         Domain Interfaces                   │
├─────────────────────────────────────────────┤
│    Infrastructure (Adapters)                │
│  ┌──────┐ ┌──────────┐ ┌────────┐ ┌──────┐ │
│  │ REST │ │IndexedDB │ │ Memory │ │WSocket│ │
│  └──────┘ └──────────┘ └────────┘ └──────┘ │
└─────────────────────────────────────────────┘
```

---

## 2. Phase 0 — 현재 상태 분석

> Claude Code 최초 실행 시 반드시 이 Phase부터 수행.

- [ ] 전체 디렉토리 트리 출력 (node_modules 제외)
- [ ] 모든 package.json 분석 (deps, scripts, entry points)
- [ ] 모든 .js/.ts 파일의 export 목록 수집
- [ ] import 의존관계 그래프 생성
- [ ] 현재 적용된 디자인 패턴 식별
- [ ] TODO/FIXME/HACK 주석 수집
- [ ] 테스트 파일 존재 여부 및 프레임워크 식별
- [ ] STATUS.md 생성 (위 결과 종합)
- [ ] spec.md Phase 5의 모듈 목록을 실제 코드에 맞게 갱신
- [ ] .DS_Store 파일이 있으면 즉시 삭제 및 .gitignore에 추가

---

## 3. Phase 1 — 오픈소스 인프라 구축

### 3-1. 리포지토리 정비

- [ ] `.gitignore` 생성 — node_modules, dist, .DS_Store, .env, coverage, *.log
- [ ] `.DS_Store` git history에서 완전 제거 (`git rm --cached`)
- [ ] `LICENSE` 파일 생성 (MIT)
- [ ] `CODE_OF_CONDUCT.md` 생성 (Contributor Covenant v2.1)
- [ ] `CONTRIBUTING.md` 생성 — PR 규칙, 브랜치 전략, 코드 스타일, 커밋 컨벤션
- [ ] `CHANGELOG.md` 생성 (Keep a Changelog 형식)
- [ ] `README.md` 생성 — 프로젝트 소개, 아키텍처 다이어그램, Quick Start, 설치, API 개요, 기여 방법, 라이선스
- [ ] `.github/ISSUE_TEMPLATE/bug_report.md` 생성
- [ ] `.github/ISSUE_TEMPLATE/feature_request.md` 생성
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` 생성
- [ ] `.editorconfig` 생성 (indent_style=space, indent_size=2, end_of_line=lf)

### 3-2. 모노레포 설정

- [ ] 루트 `package.json` 생성 — npm workspaces 설정
- [ ] `@opengroupware/sdk` 패키지 이름 설정 (groupware-sdk/package.json)
- [ ] `@opengroupware/web` 패키지 이름 설정 (groupware-web/package.json)
- [ ] 공통 devDependencies를 루트로 호이스팅
- [ ] 루트 스크립트: `npm run lint`, `npm test`, `npm run build` 전 패키지 동작

### 3-3. 코드 품질 도구

- [ ] ESLint flat config 설정 (`eslint.config.js`)
- [ ] ESLint 규칙: no-unused-vars, consistent-return, prefer-const, no-var, eqeqeq, curly
- [ ] Prettier 설정 (`.prettierrc`): semi:true, singleQuote:true, tabWidth:2, trailingComma:es5
- [ ] `.prettierignore` 생성
- [ ] 전체 코드에 `npx prettier --write .` 적용
- [ ] 전체 코드에 `npx eslint --fix .` 적용
- [ ] Husky 설치 및 `.husky/pre-commit` 설정
- [ ] lint-staged 설정 (package.json 또는 `.lintstagedrc`)
- [ ] commitlint 설정 (`commitlint.config.js`, conventional commits)
- [ ] `.husky/commit-msg` 훅 추가

### 3-4. JSDoc 타입 시스템

- [ ] `jsconfig.json` 생성 (checkJs: true, strict: true)
- [ ] `groupware-sdk/src/types/` 디렉토리 생성
- [ ] `types/common.js` — 공통 타입 (@typedef: ID, Timestamp, Pagination, SortOrder)
- [ ] `types/errors.js` — 에러 코드 상수 및 GroupwareError 클래스
- [ ] `types/events.js` — 이벤트 타입 정의
- [ ] 기존 모든 함수에 JSDoc `@param`, `@returns`, `@throws` 추가
- [ ] 기존 모든 클래스에 JSDoc `@class`, `@implements` 추가
- [ ] 타입 체크 스크립트: `"typecheck": "tsc --noEmit --allowJs --checkJs"`

### 3-5. 테스트 인프라

- [ ] Vitest 설치 및 `vitest.config.js` 설정
- [ ] 테스트 헬퍼: `__tests__/helpers/` — mock factory, test fixtures
- [ ] 테스트 유틸: `createMockRepository()`, `createMockEventBus()`
- [ ] 커버리지 설정 (v8 provider, 최소 80% threshold)
- [ ] `npm test`, `npm run test:coverage`, `npm run test:watch` 스크립트

### 3-6. CI/CD

- [ ] `.github/workflows/ci.yml` — PR마다: install → lint → typecheck → test → coverage
- [ ] `.github/workflows/release.yml` — main push 시: version bump → npm publish → GitHub Release
- [ ] README에 배지 추가: CI, coverage, npm version, license

---

## 4. Phase 2 — Core 인프라 (디자인 패턴 기반)

> 모든 도메인 모듈이 의존하는 핵심. 인터페이스 → 구현 → 테스트 순서.

### 4-1. EventBus (Observer + Singleton)

- [ ] `core/interfaces/IEventBus.js` — @interface (on, off, once, emit)
- [ ] `core/EventBus.js` — 구현 (wildcard, 에러 격리)
- [ ] `core/__tests__/EventBus.test.js` — 최소 10개 테스트
- [ ] 이벤트 타입 상수 (`core/events.js`)

### 4-2. DI Container (Factory + Singleton)

- [ ] `core/interfaces/IContainer.js` — @interface (register, resolve, has, reset)
- [ ] `core/Container.js` — 구현 (lazy resolution, scope, 순환 의존 감지)
- [ ] `core/__tests__/Container.test.js`

### 4-3. Repository 베이스 (Repository + Strategy + Builder)

- [ ] `core/interfaces/IRepository.js` — @interface (findById, findAll, save, delete, count, exists)
- [ ] `core/repositories/MemoryRepository.js` — 인메모리 구현
- [ ] `core/repositories/MemoryRepository.test.js` — CRUD 전체 테스트
- [ ] `core/interfaces/IQueryBuilder.js` — @interface (where, orderBy, limit, offset, execute)
- [ ] `core/repositories/QueryBuilder.js` — Builder 패턴 구현
- [ ] `core/repositories/QueryBuilder.test.js`

### 4-4. Middleware Pipeline (Pipeline + Chain of Responsibility)

- [ ] `core/interfaces/IPipeline.js` — @interface (use, execute)
- [ ] `core/Pipeline.js` — 구현 (async, 에러 핸들링)
- [ ] `core/__tests__/Pipeline.test.js`
- [ ] `core/middlewares/LoggingMiddleware.js` + test
- [ ] `core/middlewares/ValidationMiddleware.js` + test
- [ ] `core/middlewares/RetryMiddleware.js` + test

### 4-5. 에러 체계

- [ ] `core/errors/ErrorCodes.js` — 상수 (NOT_FOUND, UNAUTHORIZED, VALIDATION, CONFLICT, INTERNAL, TIMEOUT, RATE_LIMITED)
- [ ] `core/errors/GroupwareError.js` — 커스텀 에러
- [ ] `core/errors/ErrorFactory.js` — Factory 패턴
- [ ] `core/errors/__tests__/errors.test.js`

### 4-6. Config Manager (Strategy + Singleton)

- [ ] `core/interfaces/IConfigProvider.js` — @interface (get, set, getAll, has, merge)
- [ ] `core/config/ConfigManager.js` — 구현 (병합, validation)
- [ ] `core/config/ConfigManager.test.js`

### 4-7. Logger (Decorator + Strategy)

- [ ] `core/interfaces/ILogger.js` — @interface (debug, info, warn, error)
- [ ] `core/logger/Logger.js` — 구현 (레벨, 포맷 Strategy)
- [ ] `core/logger/Logger.test.js`
- [ ] 포맷터: `JsonFormatter`, `PrettyFormatter`

### 4-8. Validator (Strategy)

- [ ] `core/interfaces/IValidator.js` — @interface (validate, addRule, getErrors)
- [ ] `core/validation/Validator.js` — 규칙 체인, 커스텀 규칙
- [ ] `core/validation/rules.js` — required, minLength, maxLength, email, pattern, range
- [ ] `core/validation/__tests__/Validator.test.js`

### 4-9. Serializer (Strategy + Adapter)

- [ ] `core/interfaces/ISerializer.js` — @interface (serialize, deserialize)
- [ ] `core/serializers/JsonSerializer.js`
- [ ] `core/serializers/ICalSerializer.js` — iCal Adapter
- [ ] `core/serializers/VCardSerializer.js` — vCard Adapter
- [ ] 각 serializer 테스트

### 4-10. Cache (Proxy + Strategy)

- [ ] `core/interfaces/ICache.js` — @interface (get, set, has, delete, clear)
- [ ] `core/cache/MemoryCache.js` — TTL 기반
- [ ] `core/cache/CacheProxy.js` — Repository 래핑 Proxy
- [ ] 캐시 무효화 전략
- [ ] 각 캐시 테스트

---

## 5. Phase 3 — 도메인 모듈 구현

> 각 모듈 구조: Go의 경우 `service.go` → `handler.go` → `__tests__/`, TypeScript의 경우 컴포넌트 + API 클라이언트

### 현재 구현 상태

**✓ 구현 완료**:
- Auth (인증) — JWT 기반 인증, 회원가입, 로그인, 토큰 갱신
- Approval (전자결재) — 기안, 상신, 승인, 반려, 회수, 이벤트 기록

**✗ 미구현** (모델만 정의됨):
- Calendar (캘린더)
- Contact (연락처)
- Task (태스크)
- Message (메신저)
- Storage (파일 저장소)
- Notification (알림)

### 5-1. Auth 모듈 (✓ 구현됨)

**Go 백엔드**:
- [x] `internal/model/types.go` — User, TokenPair 엔티티
- [x] `internal/auth/service.go` — JWT 인증 서비스
  - Register, Login, Verify, Refresh, Logout
  - bcrypt 비밀번호 해싱
  - 액세스 토큰 + 리프레시 토큰
  - 토큰 블랙리스트 관리
- [x] `internal/auth/handler.go` — HTTP 엔드포인트
  - POST /auth/register
  - POST /auth/login
  - POST /auth/refresh
  - POST /auth/logout
- [x] `internal/middleware/auth.go` — JWT 인증 미들웨어
- [ ] `internal/auth/service_test.go` — 단위 테스트 (미작성)

**TypeScript 프론트엔드**:
- [x] `src/lib/api.ts` — authApi (login, register, refresh, logout)
- [x] `src/stores/index.ts` — useAuthStore (Zustand 상태 관리)

### 5-2. Approval 모듈 (✓ 구현됨)

**Go 백엔드**:
- [x] `internal/model/types.go` — ApprovalDoc, ApprovalStep, ApprovalEvent 엔티티
- [x] `internal/approval/service.go` — 전자결재 서비스
  - Create, Submit, Approve, Reject, Withdraw
  - Get, History, ListPending, ListByAuthor
  - 이벤트 기록 (Event Sourcing)
  - 콜백 함수 (Observer 패턴)
- [x] `internal/approval/handler.go` — HTTP 엔드포인트
  - POST /approvals (생성)
  - GET /approvals (목록)
  - GET /approvals/pending (대기 목록)
  - GET /approvals/:id (조회)
  - GET /approvals/:id/history (이력)
  - POST /approvals/:id/submit (상신)
  - POST /approvals/:id/approve (승인)
  - POST /approvals/:id/reject (반려)
  - POST /approvals/:id/withdraw (회수)
- [ ] `internal/approval/service_test.go` — 단위 테스트 (미작성)

**TypeScript 프론트엔드**:
- [x] `src/lib/api.ts` — approvalApi (전체 CRUD + 상태 변경)
- [x] `src/app/approval/page.tsx` — 결재 목록 페이지
- [x] `src/components/approval/CreateApprovalModal.tsx` — 기안 모달
- [x] `src/components/approval/ApprovalDetailModal.tsx` — 상세 + 승인/반려 모달

### 5-3. Calendar 모듈 (✗ 미구현)

**모델만 정의됨**:
- [x] `internal/model/types.go` — CalEvent, Attendee 엔티티
- [ ] 서비스, 핸들러, 프론트엔드 UI 미구현

**향후 구현 계획**:
- [ ] `internal/calendar/service.go` — 일정 CRUD, 반복 일정, 충돌 감지
- [ ] `internal/calendar/handler.go` — HTTP 엔드포인트
- [ ] `src/app/calendar/page.tsx` — 캘린더 UI

### 5-4. Message 모듈 (✗ 미구현)

**모델만 정의됨**:
- [x] `internal/model/types.go` — Channel, Message 엔티티
- [ ] 서비스, 핸들러, 프론트엔드 UI 미구현

**향후 구현 계획**:
- [ ] `internal/message/service.go` — 채널, 메시지 CRUD, 스레드
- [ ] `internal/message/handler.go` — HTTP 엔드포인트 + WebSocket
- [ ] `src/app/messenger/page.tsx` — 메신저 UI

### 5-5. Storage 모듈 (✗ 부분 구현)

**프론트엔드 UI만 구현됨**:
- [x] `src/app/files/page.tsx` — 파일 관리 페이지 (업로드/다운로드 UI)
- [x] `src/lib/api.ts` — fileApi (list, get, upload, delete)
- [x] `internal/model/types.go` — FileMetadata 엔티티
- [ ] 백엔드 파일 서비스/핸들러 미구현

**향후 구현 계획**:
- [ ] `internal/storage/service.go` — 파일 업로드, 다운로드, 버전 관리
- [ ] `internal/storage/handler.go` — HTTP 엔드포인트
- [ ] 파일 저장소 (로컬 FS, S3 등) 연동

### 5-6. Notice 모듈 (✗ 미구현)

**모델만 정의됨**:
- [x] `internal/model/types.go` — Post, Comment 엔티티
- [ ] 서비스, 핸들러, 프론트엔드 UI 미구현

**향후 구현 계획**:
- [ ] `internal/notice/service.go` — 게시판 CRUD, 댓글
- [ ] `internal/notice/handler.go` — HTTP 엔드포인트
- [ ] `src/app/notice/page.tsx` — 공지사항 UI

### 5-7. Notification 모듈 (✓ 부분 구현)

**실시간 알림 (SSE)만 구현됨**:
- [x] `src/hooks/useSSE.ts` — SSE 연결 훅
- [x] `src/components/realtime/SSEProvider.tsx` — SSE Provider
- [x] `src/stores/index.ts` — useNotificationStore
- [x] `internal/model/types.go` — SSEEvent 엔티티
- [ ] 백엔드 알림 서비스 미구현

**향후 구현 계획**:
- [ ] `internal/notification/service.go` — 알림 생성, 조회, 읽음 처리
- [ ] `internal/notification/handler.go` — HTTP 엔드포인트
- [ ] 이메일, 푸시 알림 채널 추가

---

## 6. Phase 4 — SDK Facade & 통합

- [ ] `sdk/OpenGroupware.js` — Facade (모든 모듈 통합)
- [ ] `sdk/OpenGroupware.test.js` — 통합 테스트
- [ ] `sdk/plugins/logger.plugin.js`
- [ ] `sdk/plugins/cache.plugin.js`
- [ ] `sdk/plugins/retry.plugin.js`
- [ ] `sdk/index.js` — 최종 export
- [ ] `__tests__/integration/sdk.integration.test.js`
- [ ] `__tests__/integration/cross-module.test.js`
- [ ] `__tests__/integration/plugin.integration.test.js`
- [ ] 커버리지 80% 이상 확인
- [ ] `infrastructure/rest/RestClient.js` + test
- [ ] `infrastructure/rest/RestRepository.js` + test
- [ ] `infrastructure/indexeddb/IndexedDBRepository.js` + test

---

## 7. Phase 5 — 문서화 & 배포

- [ ] JSDoc → HTML 생성 설정 + `npm run docs`
- [ ] `docs/architecture.md` — 계층, 패턴 맵, 데이터 흐름
- [ ] `docs/migration-guide.md` — 타 언어 포팅 참고
- [ ] `docs/plugin-guide.md` — 커스텀 플러그인 작성법
- [ ] `docs/storage-adapters.md` — 커스텀 어댑터 작성법
- [ ] `examples/basic-usage.js`
- [ ] `examples/custom-storage.js`
- [ ] `examples/plugin-system.js`
- [ ] `examples/cross-module.js`
- [ ] `examples/query-builder.js`
- [ ] 패키지 배포 설정 (main, module, exports, types, files)
- [ ] 시맨틱 버저닝 0.1.0
- [ ] GitHub Topics, description 설정
- [ ] README 배지 최종 정리

---

## 8. Phase 6 — 고도화

- [ ] TypeScript 마이그레이션 (.js → .ts, strict mode)
- [ ] 다국어 지원 (i18n)
- [ ] WebSocket Transport 구현
- [ ] 오프라인 지원 (IndexedDB + 동기화)
- [ ] GraphQL Adapter
- [ ] React 바인딩 (`@opengroupware/react`)
- [ ] Vue 바인딩 (`@opengroupware/vue`)
- [ ] 벤치마크 테스트
- [ ] E2E 테스트
- [ ] 보안 감사

---

## 9. Claude Code 규칙

1. spec.md를 먼저 읽는다
2. STATUS.md로 현재 상태 파악
3. 가장 낮은 미완료 Phase의 첫 번째 [ ] 항목부터 처리
4. 한 라운드에 관련 항목은 묶어서 최대한 많이 처리
5. 변경마다 git commit (conventional commits)
6. 완료 항목은 `[x]`로 체크
7. 테스트 실행 및 통과 확인
8. 디자인 패턴을 커밋 메시지에 명시
9. 3단계 이상 중첩/상속 금지
10. 인터페이스 먼저 정의 후 구현
11. 모든 public API에 JSDoc
12. CHANGELOG.md 갱신
