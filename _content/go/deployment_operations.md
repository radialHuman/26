# Deployment and Operations for Go Applications

Deploying and operating Go applications efficiently is key to scalability and reliability. This chapter covers building, deploying, Docker, CI/CD, health checks, and zero-downtime deployments.

---

## Building Go Binaries
- Use `go build` to create statically linked binaries.
- Cross-compile for different platforms:
  ```sh
  GOOS=linux GOARCH=amd64 go build -o app-linux
  ```

---

## Dockerizing Go Applications
- Use multi-stage builds for small images:
  ```dockerfile
  FROM golang:1.21 AS builder
  WORKDIR /app
  COPY . .
  RUN go build -o app

  FROM alpine:latest
  WORKDIR /root/
  COPY --from=builder /app/app .
  CMD ["./app"]
  ```

---

## CI/CD Pipelines
- Use tools like GitHub Actions, GitLab CI, or Jenkins.
- Automate build, test, and deployment steps.

---

## Health Checks
- Implement HTTP endpoints for liveness/readiness probes:
  ```go
  http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
      w.WriteHeader(http.StatusOK)
  })
  ```
- Integrate with Kubernetes or cloud platforms.

---

## Zero-Downtime Deployments
- Use rolling updates in Kubernetes or blue/green deployments.
- Gracefully handle shutdowns using `context` and `http.Server.Shutdown`.

---

## Best Practices
- Build minimal, static binaries for easy deployment.
- Use environment variables for configuration.
- Monitor deployments and roll back on failure.
- Automate as much as possible.

---

A solid deployment and operations strategy ensures your Go applications are reliable and scalable in production.