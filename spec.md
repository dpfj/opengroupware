# OpenGroupware — Project Specification v3.0

> **이 문서는 프로젝트의 단일 진실 원천(Single Source of Truth)이다.**
> Claude Code는 이 spec을 읽고 자동으로 작업을 수행한다.

---

## 0. 메타

| 항목 | 값 |
|------|-----|
| 저장소 | https://github.com/dpfj/opengroupware |
| 구조 | 모노레포 (`groupware-sdk` + `groupware-web`) |
| 백엔드 | Go 1.24+ (Gin 프레임워크) |
| 프론트엔드 | TypeScript + Next.js 15 + React 19 |
| 라이선스 | MIT |
| 목표 | 퍼블릭 오픈소스 그룹웨어 풀스택 애플리케이션 |

---

## 1. 아키텍처 개요

### 1-1. 전체 구조

```
┌─────────────────────────────────────────────┐
│         Next.js 15 Frontend (Web)           │
│  React 19 + TanStack Query + Zustand + SSE │
├─────────────────────────────────────────────┤
│              HTTP/REST API                  │
├─────────────────────────────────────────────┤
│         Go Backend (groupware-sdk)          │
│      Gin + JWT + In-Memory Storage          │
├──────┬──────┬─────────┬──────────┬──────────┤
│ Auth │Approv│ File    │ Message  │ Calendar │
├──────┴──────┴─────────┴──────────┴──────────┤
│         Domain Models & Services            │
├─────────────────────────────────────────────┤
│    Infrastructure (Future: PostgreSQL)      │
└─────────────────────────────────────────────┘
```

### 1-2. 디자인 패턴 (현재 적용됨)

| 패턴 | 용도 | 적용 위치 |
|------|------|-----------|
| **Handler** | HTTP 요청 처리 | `internal/*/handler.go` |
| **Service** | 비즈니스 로직 | `internal/*/service.go` |
| **Dependency Injection** | 의존성 관리 | 모든 `NewXxx()` 생성자 |
| **Middleware** | 요청/응답 파이프라인 | `internal/middleware/` |
| **Singleton** | 전역 인스턴스 관리 | `pkg/logger/` |
| **Repository** | 데이터 접근 추상화 | Service 내부 in-memory store |
| **Observer** | 이벤트 기반 통신 | Approval 콜백 (OnApproved, OnRejected) |
| **Event Sourcing** (부분) | 이벤트 기록 | Approval 히스토리 |
| **Hook** (React) | 로직 재사용 | `src/hooks/useSSE.ts` |
| **Provider** (React) | Context 제공 | `src/components/layout/Providers.tsx` |
| **State Management** | 전역 상태 | Zustand (`src/stores/`) |
| **Adapter** | API 래핑 | `src/lib/api.ts` |

### 1-3. 개발 원칙

1. **Handler → Service → Store** 3계층 분리
2. **의존성 주입** — 생성자 기반 DI
3. **에러 처리** — 구조화된 에러 응답 (`pkg/response`)
4. **로깅** — 구조화 로깅 (zap)
5. **테스트** — 모든 Service, Handler에 단위 테스트 작성
6. **문서화** — 모든 Public API에 주석 작성
7. **Conventional Commits** — feat, fix, docs, test, refactor, chore

---

## 2. Phase 0 — 현재 상태 분석

> Claude Code 최초 실행 시 반드시 이 Phase부터 수행.

- [x] 전체 디렉토리 트리 출력 (node_modules 제외)
- [x] 모든 package.json, go.mod 분석
- [x] 모든 .go/.ts/.tsx 파일의 export 목록 수집
- [x] import 의존관계 그래프 생성
- [x] 현재 적용된 디자인 패턴 식별
- [x] TODO/FIXME/HACK 주석 수집 (결과: 0개)
- [x] 테스트 파일 존재 여부 확인 (결과: 0개)
- [x] STATUS.md 생성
- [x] .DS_Store 파일 삭제 및 .gitignore 추가

---

## 3. Phase 1 — 오픈소스 인프라 구축

### 3-1. 리포지토리 정비

- [ ] `.gitignore` 갱신 — Go, Node.js, Next.js, .DS_Store, IDE 관련
- [ ] `LICENSE` 파일 생성 (MIT)
- [ ] `CODE_OF_CONDUCT.md` 생성 (Contributor Covenant v2.1)
- [ ] `CONTRIBUTING.md` 생성 — PR 규칙, 브랜치 전략, 커밋 컨벤션
- [ ] `CHANGELOG.md` 생성 (Keep a Changelog 형식)
- [ ] `README.md` 갱신 — 프로젝트 소개, 아키텍처, Quick Start, API 개요
- [ ] `.github/ISSUE_TEMPLATE/bug_report.md` 생성
- [ ] `.github/ISSUE_TEMPLATE/feature_request.md` 생성
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` 생성
- [ ] `.editorconfig` 생성

### 3-2. 모노레포 설정

- [ ] 루트 `package.json` 생성 — npm workspaces 설정
- [ ] `@opengroupware/sdk` 패키지 이름 설정 (groupware-sdk)
- [ ] `@opengroupware/web` 패키지 이름 설정 (groupware-web)
- [ ] 루트 스크립트: `npm run lint`, `npm test`, `npm run build` 전체 실행

### 3-3. 코드 품질 도구

**Go 백엔드**:
- [ ] `.golangci.yml` 생성 — golangci-lint 설정
- [ ] `Makefile` 갱신 — lint, test, coverage 타겟 추가
- [ ] Go 테스트 실행 환경 구축

**Next.js 프론트엔드**:
- [ ] ESLint flat config 설정 (`eslint.config.js`)
- [ ] Prettier 설정 (`.prettierrc`)
- [ ] `.prettierignore` 생성
- [ ] 전체 코드에 `prettier --write` 적용
- [ ] Husky 설치 및 `.husky/pre-commit` 설정
- [ ] lint-staged 설정
- [ ] commitlint 설정 (conventional commits)

### 3-4. 테스트 인프라

**Go 백엔드**:
- [ ] `internal/auth/service_test.go` 작성
- [ ] `internal/approval/service_test.go` 작성
- [ ] 테스트 커버리지 80% 목표

**TypeScript 프론트엔드**:
- [ ] Vitest 설치 및 설정
- [ ] API 클라이언트 테스트 작성
- [ ] 컴포넌트 테스트 작성 (React Testing Library)

### 3-5. CI/CD

- [ ] `.github/workflows/backend.yml` — Go lint, test, build
- [ ] `.github/workflows/frontend.yml` — Next.js lint, type-check, test, build
- [ ] README 배지 추가: CI, license

---

## 4. Phase 2 — 백엔드 기능 강화

### 4-1. 데이터 영속성

- [ ] PostgreSQL 연동 — `database/sql` + `sqlx` 또는 GORM
- [ ] 마이그레이션 시스템 — `golang-migrate/migrate`
- [ ] 환경 변수 관리 — `.env` 파일 + Viper
- [ ] Repository 패턴 구현 — `internal/repository/`

### 4-2. 파일 스토리지 구현

- [ ] `internal/storage/service.go` — 파일 업로드, 다운로드, 삭제
- [ ] `internal/storage/handler.go` — HTTP 엔드포인트
- [ ] 로컬 파일 시스템 저장
- [ ] (선택) S3 호환 스토리지 연동

### 4-3. 공지사항 (Notice) 구현

- [ ] `internal/notice/service.go` — 게시판 CRUD, 댓글
- [ ] `internal/notice/handler.go` — HTTP 엔드포인트
- [ ] 테스트 작성

### 4-4. 메신저 (Message) 구현

- [ ] `internal/message/service.go` — 채널, 메시지 CRUD
- [ ] `internal/message/handler.go` — HTTP 엔드포인트 + WebSocket
- [ ] 실시간 메시지 전달
- [ ] 테스트 작성

### 4-5. 캘린더 (Calendar) 구현

- [ ] `internal/calendar/service.go` — 일정 CRUD, 반복 일정
- [ ] `internal/calendar/handler.go` — HTTP 엔드포인트
- [ ] iCal 포맷 지원
- [ ] 테스트 작성

### 4-6. 알림 (Notification) 구현

- [ ] `internal/notification/service.go` — 알림 생성, 조회
- [ ] `internal/notification/handler.go` — HTTP + SSE 엔드포인트
- [ ] 알림 타입별 라우팅 (결재, 메시지, 일정 등)

---

## 5. Phase 3 — 프론트엔드 기능 강화

### 5-1. 파일 관리 페이지 완성

- [ ] 파일 업로드 기능 (드래그 앤 드롭)
- [ ] 파일 다운로드
- [ ] 파일 삭제
- [ ] 파일 미리보기 (이미지, PDF)

### 5-2. 공지사항 페이지

- [ ] `src/app/notice/page.tsx` — 게시판 목록
- [ ] 공지사항 작성 모달
- [ ] 공지사항 상세 + 댓글

### 5-3. 메신저 페이지

- [ ] `src/app/messenger/page.tsx` — 채널 목록 + 메시지
- [ ] WebSocket 연결
- [ ] 실시간 메시지 수신
- [ ] 파일 전송

### 5-4. 캘린더 페이지

- [ ] `src/app/calendar/page.tsx` — 월간/주간/일간 뷰
- [ ] 일정 생성 모달
- [ ] 일정 드래그 앤 드롭
- [ ] 일정 공유

### 5-5. 알림 센터

- [ ] 헤더에 알림 아이콘 + 드롭다운
- [ ] 알림 읽음 처리
- [ ] 알림 클릭 시 해당 페이지 이동

---

## 6. Phase 4 — 고도화

### 6-1. 권한 관리 (RBAC)

- [ ] 역할 정의 (Admin, Manager, Member, Guest)
- [ ] 권한 체크 미들웨어
- [ ] 프론트엔드 권한별 UI 표시

### 6-2. 검색 기능

- [ ] 전체 검색 (파일, 공지사항, 결재, 일정)
- [ ] 검색 API 엔드포인트
- [ ] 검색 페이지

### 6-3. 다국어 지원

- [ ] i18n 설정 (next-intl)
- [ ] 한국어, 영어 지원

### 6-4. 모바일 반응형

- [ ] 모바일 레이아웃
- [ ] 터치 제스처

### 6-5. 성능 최적화

- [ ] API 응답 캐싱 (Redis)
- [ ] 이미지 최적화
- [ ] 코드 스플리팅

---

## 7. Phase 5 — 문서화 & 배포

### 7-1. 문서화

- [ ] `docs/architecture.md` — 아키텍처 다이어그램
- [ ] `docs/api.md` — REST API 문서
- [ ] `docs/deployment.md` — 배포 가이드
- [ ] Swagger/OpenAPI 스펙 생성

### 7-2. 배포

- [ ] Docker 이미지 생성 (백엔드 + 프론트엔드)
- [ ] Docker Compose 설정 (로컬 개발 환경)
- [ ] 프로덕션 배포 가이드 (AWS, GCP, Azure)

### 7-3. 데모

- [ ] 라이브 데모 사이트 구축
- [ ] 샘플 데이터 스크립트

---

## 8. Claude Code 규칙

1. **spec.md를 먼저 읽는다**
2. **STATUS.md로 현재 상태 파악**
3. **가장 낮은 미완료 Phase의 첫 번째 [ ] 항목부터 처리**
4. **한 라운드에 관련 항목은 묶어서 최대한 많이 처리**
5. **변경마다 git commit (conventional commits)**
6. **완료 항목은 `[x]`로 체크**
7. **테스트 실행 및 통과 확인**
8. **CHANGELOG.md 갱신**
9. **Go 코드**: 주석 작성, 에러 처리, 테스트 작성
10. **TypeScript 코드**: 타입 안정성, 주석 작성, 테스트 작성

---

## 9. 현재 구현 상태 (STATUS.md 참조)

### ✓ 완료

- 인증 (JWT) — 회원가입, 로그인, 토큰 갱신, 로그아웃
- 전자결재 — 기안, 상신, 승인, 반려, 회수, 이벤트 기록
- 실시간 알림 (SSE) — 프론트엔드만
- 대시보드 — 동기화 상태 UI
- 파일 관리 — UI만 (백엔드 미완)

### ✗ 미완료

- 파일 스토리지 백엔드 API
- 공지사항 (모델만 정의)
- 메신저 (모델만 정의)
- 캘린더 (모델만 정의)
- 알림 백엔드 서비스
- 데이터베이스 연동 (현재 in-memory)
- 테스트 (0개)

---

## 10. 모듈 개요

### 10-1. 백엔드 (Go)

**엔트리 포인트**: `groupware-sdk/cmd/server/main.go`

**핵심 모듈**:
- `config/` — Viper 기반 설정 관리
- `pkg/logger/` — zap 구조화 로깅
- `pkg/response/` — API 응답 헬퍼
- `internal/middleware/` — 인증, CORS, 로깅 미들웨어
- `internal/model/` — 도메인 엔티티
- `internal/auth/` — JWT 인증 서비스
- `internal/approval/` — 전자결재 서비스

**향후 추가 예정**:
- `internal/storage/` — 파일 스토리지
- `internal/notice/` — 공지사항
- `internal/message/` — 메신저
- `internal/calendar/` — 캘린더
- `internal/notification/` — 알림
- `internal/repository/` — 데이터베이스 레이어

### 10-2. 프론트엔드 (Next.js)

**엔트리 포인트**: `groupware-web/src/app/layout.tsx`

**핵심 모듈**:
- `src/types/` — TypeScript 타입 정의
- `src/lib/api.ts` — API 클라이언트
- `src/lib/utils.ts` — 유틸리티 함수
- `src/stores/` — Zustand 전역 상태
- `src/hooks/` — React Custom Hooks
- `src/components/layout/` — 레이아웃 (Header, Sidebar, Providers)
- `src/components/realtime/` — SSE Provider
- `src/components/approval/` — 전자결재 컴포넌트
- `src/app/` — Next.js App Router 페이지

**라이브러리**:
- TanStack Query (React Query) — 데이터 페칭 + 캐싱
- Zustand — 전역 상태 관리
- Zod — 스키마 검증
- React Hook Form — 폼 관리
- Sonner — 토스트 알림
- Radix UI — Headless UI 컴포넌트
- Tailwind CSS v4 — 스타일링

---

## 11. 참고 문서

- [STATUS.md](./STATUS.md) — Phase 0 분석 결과
- [CHANGELOG.md](./CHANGELOG.md) — 변경 이력
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 기여 가이드
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) — 행동 강령
- docs/ — 상세 문서
