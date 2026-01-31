# Docker and Containerization

## What is Docker?

Docker packages applications and dependencies into containers - lightweight, portable, isolated environments that run consistently across different systems.

## Why Docker for Go?

- **Consistency**: Same environment dev to production
- **Isolation**: No dependency conflicts
- **Portability**: Run anywhere Docker runs
- **Efficiency**: Smaller images, faster deployments
- **Scalability**: Easy to replicate and scale

## Basic Dockerfile for Go

### Simple Dockerfile

```dockerfile
# Use official Go image
FROM golang:1.22-alpine

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build application
RUN go build -o main .

# Expose port
EXPOSE 8080

# Run application
CMD ["./main"]
```

### Building and Running

```bash
# Build image
docker build -t myapp:latest .

# Run container
docker run -p 8080:8080 myapp:latest

# Run with environment variables
docker run -p 8080:8080 -e DB_HOST=postgres -e PORT=8080 myapp:latest

# Run in detached mode
docker run -d -p 8080:8080 --name myapp myapp:latest

# View logs
docker logs myapp

# Stop container
docker stop myapp

# Remove container
docker rm myapp
```

## Multi-Stage Build

### Optimized Dockerfile

```dockerfile
# Stage 1: Build
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build with optimizations
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o main .

# Stage 2: Runtime
FROM alpine:latest

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Run
CMD ["./main"]
```

### Size Comparison

```bash
# Single stage: ~800MB
# Multi-stage: ~15MB (50x smaller!)
```

## Distroless Images

### Using Distroless

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Runtime stage with distroless
FROM gcr.io/distroless/static-debian11

COPY --from=builder /app/main /

EXPOSE 8080

CMD ["/main"]
```

### Benefits of Distroless

- **Security**: Minimal attack surface (no shell, package managers)
- **Size**: Even smaller images (~5-10MB)
- **Performance**: Faster startup, less overhead

## Docker Compose

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASSWORD=secret
      - DB_NAME=myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - app-network
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=myapp
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - app-network
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:

networks:
  app-network:
    driver: bridge
```

### Using Docker Compose

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs
docker-compose logs app

# Follow logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild images
docker-compose build

# Restart service
docker-compose restart app
```

## Complete Project Structure

```
myapp/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── config/
│   ├── handlers/
│   └── repository/
├── migrations/
│   └── 001_create_users.sql
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── go.mod
└── go.sum
```

### .dockerignore

```dockerignore
# Ignore unnecessary files
.git
.gitignore
README.md
.env
.env.local
docker-compose.yml
Dockerfile
*.md

# Ignore test files
*_test.go
testdata/

# Ignore build artifacts
bin/
dist/
*.exe
*.dll
*.so
*.dylib

# Ignore IDE files
.vscode/
.idea/
*.swp
*.swo
```

### Development Dockerfile

```dockerfile
# Dockerfile.dev
FROM golang:1.22-alpine

# Install air for live reload
RUN go install github.com/cosmtrek/air@latest

WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Expose port
EXPOSE 8080

# Run with air
CMD ["air"]
```

### docker-compose.dev.yml

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
      - DB_HOST=postgres
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app  # Mount source for live reload
    depends_on:
      - postgres
      - redis
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=myapp_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres-dev:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - app-network

volumes:
  postgres-dev:

networks:
  app-network:
```

## Production Best Practices

### 1. Health Checks

```dockerfile
FROM alpine:latest

COPY --from=builder /app/main .

EXPOSE 8080

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./main"]
```

```go
// Health check endpoint
func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("OK"))
}

func main() {
    http.HandleFunc("/health", healthHandler)
    http.ListenAndServe(":8080", nil)
}
```

### 2. Non-Root User

```dockerfile
FROM alpine:latest

# Create non-root user
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

COPY --from=builder /app/main .

# Change ownership
RUN chown -R appuser:appuser /root

# Switch to non-root user
USER appuser

EXPOSE 8080

CMD ["./main"]
```

### 3. Security Scanning

```bash
# Scan image for vulnerabilities
docker scan myapp:latest

# Using Trivy
trivy image myapp:latest
```

### 4. Resource Limits

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 5. Logging

```dockerfile
# Use JSON logging for container logs
FROM alpine:latest

ENV LOG_FORMAT=json

COPY --from=builder /app/main .

CMD ["./main"]
```

## Database Migrations

### With golang-migrate

```dockerfile
# Dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY . .
RUN go build -o main .

# Install migrate tool
FROM migrate/migrate AS migrate

FROM alpine:latest

COPY --from=builder /app/main .
COPY --from=migrate /usr/local/bin/migrate /usr/local/bin/migrate
COPY migrations /migrations

EXPOSE 8080

# Entry script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
```

### entrypoint.sh

```bash
#!/bin/sh

# Run migrations
migrate -path /migrations -database "$DATABASE_URL" up

# Start application
./main
```

## CI/CD with Docker

### GitHub Actions Example

```yaml
# .github/workflows/docker.yml
name: Docker Build and Push

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            myapp:latest
            myapp:${{ github.sha }}
```

## Makefile for Docker

```makefile
# Makefile
.PHONY: build run stop clean dev prod

# Build Docker image
build:
	docker build -t myapp:latest .

# Run container
run:
	docker run -p 8080:8080 --name myapp myapp:latest

# Stop and remove container
stop:
	docker stop myapp || true
	docker rm myapp || true

# Clean up
clean:
	docker-compose down -v
	docker rmi myapp:latest || true

# Development environment
dev:
	docker-compose -f docker-compose.dev.yml up

# Production environment
prod:
	docker-compose up -d

# View logs
logs:
	docker-compose logs -f app

# Rebuild
rebuild:
	docker-compose build --no-cache

# Database shell
db:
	docker-compose exec postgres psql -U postgres -d myapp
```

## Multi-Architecture Builds

```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest .

# Push multi-arch image
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest --push .
```

## Debugging Containers

```bash
# Execute shell in running container
docker exec -it myapp sh

# View container stats
docker stats myapp

# Inspect container
docker inspect myapp

# View container processes
docker top myapp

# Copy files from container
docker cp myapp:/app/logs/app.log ./app.log
```

## Common Issues and Solutions

### 1. Large Image Size

```dockerfile
# Problem: Large image
FROM golang:1.22
COPY . .
RUN go build -o main .
CMD ["./main"]

# Solution: Multi-stage build
FROM golang:1.22 AS builder
COPY . .
RUN go build -o main .

FROM alpine:latest
COPY --from=builder /app/main .
CMD ["./main"]
```

### 2. Slow Builds

```dockerfile
# Problem: Reinstalls deps every time
COPY . .
RUN go mod download

# Solution: Cache dependencies
COPY go.mod go.sum ./
RUN go mod download
COPY . .
```

### 3. Time Zone Issues

```dockerfile
# Set timezone in container
FROM alpine:latest

RUN apk add --no-cache tzdata
ENV TZ=America/New_York

COPY --from=builder /app/main .
CMD ["./main"]
```

## Summary

Docker provides:
- **Containerization**: Package app with dependencies
- **Multi-stage Builds**: Optimize image size
- **Docker Compose**: Multi-container orchestration
- **Portability**: Run anywhere consistently
- **CI/CD**: Automated builds and deployments
- **Security**: Isolation and scanning

Essential for modern application deployment and scalability.
