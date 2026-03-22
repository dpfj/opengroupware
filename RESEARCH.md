# OpenGroupware 리서치 — 그룹웨어 최적화 사례 & 아키텍처 레퍼런스

> 이 문서는 Claude Code가 개발 작업 중 참고하는 리서치 자료입니다.
> spec.md와 함께 프로젝트 루트에 배치하세요.

---

## 1. 오픈소스 그룹웨어 레퍼런스 프로젝트

### 1-1. 주요 프로젝트 비교

| 프로젝트 | 언어 | 프로토콜 | 특징 | 교훈 |
|---------|------|---------|------|------|
| **SOGo** | Objective-C | CalDAV, CardDAV, IMAP | OGo에서 포크, 확장성 중심 리아키텍처 | 확장성을 위해 기능을 줄이는 것도 전략 |
| **EGroupware** | PHP | CalDAV, CardDAV, WebDAV | 풀스택 그룹웨어, 엔터프라이즈 | 모듈 간 강결합이 유지보수 부담 |
| **Radicale** | Python | CalDAV, CardDAV | 미니멀, 의존성 최소 | 단순함이 경쟁력 — 설치 3줄이면 끝 |
| **sabre/dav** | PHP | CalDAV, CardDAV, WebDAV | OOP 추상화 레이어, 라이브러리로 사용 가능 | SDK형 설계의 모범 — 서버가 아니라 라이브러리 |
| **GroupOffice** | PHP/JS | IMAP, ActiveSync, CalDAV, CardDAV, WebDAV | 상용+오픈소스 하이브리드 | 오픈 프로토콜 + 커스텀 확장 전략 |
| **Fennel** | JavaScript/Node.js | CalDAV, CardDAV | 경량 Node.js 서버 | JS 생태계에서 그룹웨어 구현 가능 증명 |
| **Xandikos** | Python | CalDAV, CardDAV + Git 백엔드 | Git으로 데이터 저장 | 스토리지 백엔드를 자유롭게 교체 가능한 설계 |
| **DAViCal** | PHP/PostgreSQL | CalDAV, CardDAV | 성숙한 코드베이스 (2006~) | 위임/ACL 구현 참고 |

### 1-2. 핵심 교훈

1. **sabre/dav처럼 라이브러리 우선**: 서버 애플리케이션이 아닌 SDK/라이브러리로 설계하면 다양한 환경에 임베드 가능
2. **표준 프로토콜 준수**: CalDAV(RFC 4791), CardDAV(RFC 6352), iCalendar, vCard 지원이 생태계 진입 필수
3. **Radicale의 미니멀 전략**: 의존성 최소화 + 즉시 사용 가능 = 빠른 채택
4. **SOGo의 확장성 교훈**: OGo가 기능은 풍부했지만 확장성 부족으로 쇠퇴 → SOGo가 핵심만 남기고 확장성 확보
5. **Xandikos의 스토리지 추상화**: 백엔드를 Git으로 한 것은 Repository 패턴의 실제 적용 사례

---

## 2. 그룹웨어 아키텍처 최적화 패턴

### 2-1. 분산 시스템에서의 그룹웨어 설계

**핵심 도전 과제:**
- 네트워크 지연으로 인한 실시간 협업 성능 저하
- 분산 인스턴스 간 데이터 동기화 및 충돌 해결
- 보안: 인증, 암호화, 접근 제어
- 크로스 플랫폼 호환: 다양한 디바이스/OS 지원

**최적화 전략:**
- API 기반 통합: REST/GraphQL로 느슨한 결합
- 이벤트 기반 아키텍처: Observer 패턴으로 실시간 알림
- 버전 관리: 문서/일정 충돌 시 자동 머지 또는 수동 해결
- 캐싱: Proxy 패턴으로 반복 조회 최적화
- 오프라인 우선: 로컬 저장 후 동기화 (IndexedDB + 큐)

### 2-2. 마이크로서비스 아키텍처 적용

그룹웨어 모듈별 독립 서비스화:
- **DDD(Domain Driven Design)** 적용 → 각 모듈이 독립 도메인
- 모듈 간 통신은 이벤트 버스 (Observer 패턴)
- 독립 배포, 독립 스케일링 가능
- 각 모듈이 자체 Repository를 갖고 스토리지 전략 독립

### 2-3. 미들웨어 & 메시징 최적화

- 비동기 통신 (Message Queue) → 높은 부하에서도 안정
- Circuit Breaker 패턴 → 장애 전파 방지
- Rate Limiting → API 남용 방지
- 재시도 전략 (Exponential Backoff)

---

## 3. 표준 프로토콜 & 데이터 포맷

### 3-1. 지원해야 할 프로토콜

| 프로토콜 | RFC | 용도 |
|---------|-----|------|
| CalDAV | RFC 4791 | 캘린더 접근/동기화 |
| CardDAV | RFC 6352 | 연락처 접근/동기화 |
| WebDAV | RFC 4918 | 파일 관리 |
| WebDAV Sync | RFC 6578 | 효율적 동기화 |
| iCalendar | RFC 5545 | 캘린더 데이터 포맷 |
| vCard | RFC 6350 | 연락처 데이터 포맷 |
| JMAP | RFC 8620 | 메일/캘린더 현대적 API |

### 3-2. SDK에서의 구현 우선순위

1. **iCalendar/vCard 파싱 & 직렬화** (Core Serializer)
2. **CalDAV/CardDAV 클라이언트** (Infrastructure Adapter)
3. **WebDAV 기본 지원** (Storage Adapter)
4. **JMAP 지원** (차세대 프로토콜, Phase 6)

---

## 4. 디자인 패턴 실제 적용 사례

### 4-1. sabre/dav의 패턴 사용

- **Adapter**: 다양한 백엔드(MySQL, SQLite, Files)에 대한 통합 인터페이스
- **Strategy**: 인증 방식 교체 (Basic, Digest, Bearer)
- **Observer**: 이벤트 시스템으로 플러그인 확장
- **Facade**: DAV\Server 클래스가 전체 기능의 단일 진입점

### 4-2. SOGo의 확장성 패턴

- **Proxy**: IMAP 서버 앞에 프록시 레이어로 캐싱
- **Factory**: 다양한 DB 백엔드(MySQL, PostgreSQL, Oracle) 생성
- **Adapter**: CalDAV/CardDAV/ActiveSync 각각의 어댑터

### 4-3. Radicale의 미니멀 패턴

- **Strategy**: 스토리지(파일시스템 vs 커스텀), 인증(htpasswd, LDAP, PAM)
- **Repository**: 파일시스템 기반 단순 저장소
- **Singleton**: 서버 인스턴스 관리

---

## 5. 성능 최적화 벤치마크 참고

### 5-1. 확장성 지표 (SOGo 사례)

- 60,000 사용자 배포 성공 (SKYRiX → SOGo 포크 계기)
- 핵심: 무거운 기능을 줄이고 핵심(메일, 캘린더, 연락처)에 집중
- 데이터베이스 최적화: PostgreSQL 인덱싱, 커넥션 풀링
- 프론트엔드: 점진적 로딩, 가상 스크롤

### 5-2. SDK 레벨 최적화 전략

- **Lazy Loading**: 필요할 때만 모듈 초기화
- **Batch Operations**: 여러 CRUD를 한 번에 처리
- **Connection Pooling**: REST API 호출 최적화
- **캐싱 레이어**: TTL 기반 메모리 캐시 (CacheProxy)
- **페이지네이션**: Iterator 패턴으로 대량 데이터 처리

---

## 6. 크롤링 소스 목록

> Claude Code가 추가 리서치 시 참고할 URL 목록

### 오픈소스 프로젝트
- SOGo: https://github.com/Alinto/sogo
- EGroupware: https://github.com/EGroupware/egroupware
- Radicale: https://github.com/Kozea/Radicale
- sabre/dav: https://sabre.io/
- GroupOffice: https://www.group-office.com/
- Xandikos: https://github.com/jelmer/xandikos
- Fennel (Node.js CalDAV): https://github.com/nicofrand/fennel
- DAViCal: https://www.davical.org/
- Nextcloud: https://github.com/nextcloud/server (캘린더/연락처 앱)

### 표준 문서
- CalDAV: https://devguide.calconnect.org/CalDAV/
- CardDAV: https://devguide.calconnect.org/CardDAV/
- CalDAV 서버 구현 목록: https://devguide.calconnect.org/CalDAV/Server-Implementations/
- iCalendar (RFC 5545): https://datatracker.ietf.org/doc/html/rfc5545
- vCard (RFC 6350): https://datatracker.ietf.org/doc/html/rfc6350
- JMAP (RFC 8620): https://datatracker.ietf.org/doc/html/rfc8620

### 아키텍처 참고
- 마이크로서비스 베스트 프랙티스: https://www.geeksforgeeks.org/blogs/best-practices-for-microservices-architecture/
- 그룹웨어 분산 시스템: https://www.geeksforgeeks.org/what-is-groupware-in-distributed-system/
- 미들웨어 패턴: https://avadasoftware.com/best-of-2024-insights-and-innovations-in-middleware-and-messaging/

---

## 7. Claude Code 크롤링 작업 지시

> run_nightly.sh 또는 Ralph 루프에서 병렬로 실행할 크롤링 태스크.

Claude Code에게 아래 지시를 별도 세션으로 실행:

```
RESEARCH.md를 읽어.
섹션 6의 URL 목록에서 아직 분석하지 않은 프로젝트를 선택해.
해당 프로젝트의 GitHub 저장소를 분석해:
1. 디렉토리 구조
2. 아키텍처 패턴
3. API 설계 방식
4. 테스트 전략
5. 문서화 방식
분석 결과를 RESEARCH.md에 추가해.
git commit.
```

이 작업은 개발 작업과 **병렬로** 진행한다.
별도 터미널에서 실행하면 된다.
