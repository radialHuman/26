# Advanced Container Optimization for Go Applications

## Multi-Stage Docker Builds

### Optimized Dockerfile
```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Copy dependency files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a \
    -installsuffix cgo \
    -o /app/bin/server \
    ./cmd/server

# Final stage - use scratch or distroless
FROM gcr.io/distroless/static:nonroot

WORKDIR /

# Copy binary from builder
COPY --from=builder /app/bin/server /server

# Copy timezone data if needed
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Use non-root user
USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/server"]
```

### Scratch-Based Image
```dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o server .

# Scratch image - smallest possible
FROM scratch

COPY --from=builder /app/server /server
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080
ENTRYPOINT ["/server"]
```

## Docker Compose for Local Development

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:pass@postgres:5432/mydb
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
    depends_on:
      - postgres
      - redis
    command: air  # Live reload with air
  
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Container Security Best Practices

### Secure Dockerfile
```dockerfile
FROM golang:1.22-alpine AS builder

# Create non-root user
RUN adduser -D -g '' appuser

WORKDIR /app
COPY . .
RUN go build -o server .

FROM scratch

# Copy user from builder
COPY --from=builder /etc/passwd /etc/passwd

# Copy binary
COPY --from=builder /app/server /server

# Use non-root user
USER appuser

EXPOSE 8080
ENTRYPOINT ["/server"]
```

## Summary
Container optimization involves multi-stage builds, minimal base images (distroless/scratch), security best practices, and efficient Docker Compose configurations for local development.
