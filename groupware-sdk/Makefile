.PHONY: up down restart logs status test build

# ── 전체 실행 ─────────────────────────────────────────────────
up:
	docker compose up -d
	@echo ""
	@echo "✅ 시작 완료"
	@echo "  Backend  → http://localhost:8080"
	@echo "  Frontend → http://localhost:3000"
	@echo ""
	@echo "로그: make logs"

# ── 전체 종료 ─────────────────────────────────────────────────
down:
	docker compose down

# ── 재시작 ───────────────────────────────────────────────────
restart:
	docker compose restart backend

# ── 로그 ─────────────────────────────────────────────────────
logs:
	docker compose logs -f --tail=50

logs-backend:
	docker compose logs -f --tail=50 backend

logs-frontend:
	docker compose logs -f --tail=50 frontend

# ── 상태 확인 ─────────────────────────────────────────────────
status:
	@echo "=== 컨테이너 상태 ==="
	@docker compose ps
	@echo ""
	@echo "=== 헬스체크 ==="
	@curl -sf http://localhost:8080/health && echo "✅ Backend :8080" || echo "❌ Backend :8080"
	@curl -sf http://localhost:3000 > /dev/null && echo "✅ Frontend :3000" || echo "❌ Frontend :3000"

# ── 인프라만 ──────────────────────────────────────────────────
infra:
	docker compose up -d dragonfly scylla
	@echo "✅ DragonflyDB :6379"
	@echo "✅ ScyllaDB    :9042"

# ── 테스트 (컨테이너 안에서 실행) ─────────────────────────────
test:
	docker compose exec backend go test ./... -v -timeout 60s

# ── 빌드 ─────────────────────────────────────────────────────
build:
	docker compose build backend

# ── Go 커맨드 (컨테이너 안) ───────────────────────────────────
tidy:
	docker compose exec backend go mod tidy

shell-backend:
	docker compose exec backend sh

shell-scylla:
	docker exec -it gw-scylla cqlsh
