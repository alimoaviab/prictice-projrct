# Multi-stage build for the Eduplexo Go backend.
#
# Stage 1: compile a static-ish Linux binary.
# Stage 2: copy into a minimal distroless image so the final container is
# tiny and CVE-light (no shell, no package manager).

FROM golang:alpine AS builder

WORKDIR /src

# Cache module downloads on a separate layer.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO disabled so the resulting binary runs on distroless without glibc.
ENV CGO_ENABLED=0 GOOS=linux

RUN go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# ──────────────────────────────────────────────────────────────────────────
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app
COPY --from=builder /out/server /app/server

EXPOSE 8080

USER nonroot
ENTRYPOINT ["/app/server"]
