# OpenGroupware — Project Specification v2.0

> **이 문서는 프로젝트의 단일 진실 원천(Single Source of Truth)이다.**
> Claude Code는 이 spec을 읽고 자동으로 작업을 수행한다.

---

## 0. 메타

| 항목 | 값 |
|------|-----|
| 저장소 | https://github.com/dpfj/opengroupware |
| 구조 | 모노레포 (`groupware-sdk` + `groupware-web`) |
| 언어 | JavaScript 99.3% |
| 라이선스 | MIT |
| 목표 | 퍼블릭 오픈소스 그룹웨어 SDK 라이브러리 |

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

> 각 모듈 구조: `interfaces.js` → `entities.js` → `service.js` → `repository.js` → `factory.js` → `index.js` → `__tests__/`

### 5-1. Calendar 모듈

- [ ] `modules/calendar/interfaces.js` — ICalendarService, ICalendarRepository
- [ ] `modules/calendar/entities.js` — CalendarEvent, Recurrence, Reminder, Calendar
- [ ] `modules/calendar/calendar.repository.js`
- [ ] `modules/calendar/calendar.service.js` — 충돌 감지, 반복 일정 확장
- [ ] `modules/calendar/strategies/RecurrenceStrategy.js` — Daily, Weekly, Monthly, Yearly
- [ ] `modules/calendar/calendar.factory.js`
- [ ] `modules/calendar/index.js`
- [ ] `modules/calendar/__tests__/calendar.service.test.js` — 최소 15개
- [ ] `modules/calendar/__tests__/calendar.repository.test.js`
- [ ] `modules/calendar/__tests__/RecurrenceStrategy.test.js`
- [ ] iCal 직렬화 연동

### 5-2. Contact 모듈

- [ ] `modules/contact/interfaces.js`
- [ ] `modules/contact/entities.js` — Contact, ContactGroup, Address, Phone, Email
- [ ] `modules/contact/contact.repository.js`
- [ ] `modules/contact/contact.service.js` — 검색, 그룹, 중복 감지
- [ ] `modules/contact/strategies/SearchStrategy.js` — ExactMatch, FuzzySearch, FullText
- [ ] `modules/contact/contact.factory.js`
- [ ] `modules/contact/index.js`
- [ ] `modules/contact/__tests__/contact.service.test.js` — 최소 15개
- [ ] `modules/contact/__tests__/SearchStrategy.test.js`
- [ ] vCard 직렬화 연동

### 5-3. Task 모듈

- [ ] `modules/task/interfaces.js`
- [ ] `modules/task/entities.js` — Task, Priority, Assignment, TaskStatus
- [ ] `modules/task/task.repository.js`
- [ ] `modules/task/task.service.js` — 할당, 마감일, 우선순위
- [ ] `modules/task/TaskStateMachine.js` — State 패턴
- [ ] `modules/task/commands/AssignTaskCommand.js` — Command 패턴
- [ ] `modules/task/commands/CompleteTaskCommand.js`
- [ ] `modules/task/task.factory.js`
- [ ] `modules/task/index.js`
- [ ] `modules/task/__tests__/task.service.test.js` — 최소 15개
- [ ] `modules/task/__tests__/TaskStateMachine.test.js`
- [ ] `modules/task/__tests__/commands.test.js`

### 5-4. Message 모듈

- [ ] `modules/message/interfaces.js`
- [ ] `modules/message/entities.js` — Channel, Message, Thread, Reaction
- [ ] `modules/message/message.repository.js`
- [ ] `modules/message/message.service.js` — 채널, 스레드, 읽음
- [ ] `modules/message/transports/InMemoryTransport.js`
- [ ] `modules/message/transports/WebSocketTransport.js` — 인터페이스
- [ ] `modules/message/message.factory.js`
- [ ] `modules/message/index.js`
- [ ] `modules/message/__tests__/message.service.test.js` — 최소 15개

### 5-5. Storage 모듈

- [ ] `modules/storage/interfaces.js`
- [ ] `modules/storage/entities.js` — FileEntry, Folder, FileVersion
- [ ] `modules/storage/storage.service.js` — 업로드, 다운로드, 버전
- [ ] `modules/storage/adapters/MemoryStorageAdapter.js`
- [ ] `modules/storage/adapters/LocalFSAdapter.js`
- [ ] `modules/storage/commands/UploadCommand.js`
- [ ] `modules/storage/commands/DeleteCommand.js`
- [ ] `modules/storage/storage.factory.js`
- [ ] `modules/storage/index.js`
- [ ] `modules/storage/__tests__/storage.service.test.js` — 최소 15개

### 5-6. Notification 모듈

- [ ] `modules/notification/interfaces.js`
- [ ] `modules/notification/entities.js`
- [ ] `modules/notification/notification.service.js`
- [ ] `modules/notification/channels/InAppChannel.js`
- [ ] `modules/notification/channels/EmailChannel.js` — 인터페이스
- [ ] `modules/notification/notification.factory.js`
- [ ] `modules/notification/index.js`
- [ ] `modules/notification/__tests__/notification.service.test.js`

### 5-7. Auth 모듈

- [ ] `modules/auth/interfaces.js`
- [ ] `modules/auth/entities.js` — User, Session, Token, Permission
- [ ] `modules/auth/auth.service.js`
- [ ] `modules/auth/strategies/BasicAuthStrategy.js`
- [ ] `modules/auth/strategies/TokenAuthStrategy.js`
- [ ] `modules/auth/auth.factory.js`
- [ ] `modules/auth/index.js`
- [ ] `modules/auth/__tests__/auth.service.test.js`

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
