# Eduplexo — Go backend Makefile.
#
# Phase 2 deliverables: real Go service backing the React frontend, replacing
# the MSW mocks introduced in Phase 1.
#
# Common tasks:
#   make run     — start the HTTP server on :8080 with the in-memory store
#   make build   — produce ./bin/server
#   make vet     — go vet across all packages
#   make test    — run unit tests (none yet — placeholder)
#   make tidy    — go mod tidy
#   make smoke   — quick health probe + login round-trip against a running
#                  server on :8080 (handy in CI)

.PHONY: run build vet test tidy smoke up down logs migrate-up migrate-down

run:
	go run ./cmd/server

build:
	mkdir -p bin
	go build -o bin/server ./cmd/server

vet:
	go vet ./...

test:
	go test ./... ./...

tidy:
	go mod tidy

smoke:
	@echo "→ /health"
	@curl -s http://localhost:8080/health
	@echo
	@echo "→ /api/auth/login"
	@curl -s -X POST http://localhost:8080/api/auth/login \
		-H "content-type: application/json" \
		-d '{"email":"admin@school.test","password":"admin123","role":"admin"}' \
		| python3 -m json.tool || true

# Docker convenience targets — run from the repo root via `make -C .. up`.
up:
	cd .. && docker compose up --build -d

down:
	cd .. && docker compose down

logs:
	cd .. && docker compose logs -f

# golang-migrate against a running compose stack.
migrate-up:
	cd .. && docker compose run --rm migrate \
		-path /migrations \
		-database "postgres://school_user:school_password@postgres:5432/school_db?sslmode=disable" \
		up

migrate-down:
	cd .. && docker compose run --rm migrate \
		-path /migrations \
		-database "postgres://school_user:school_password@postgres:5432/school_db?sslmode=disable" \
		down 1
