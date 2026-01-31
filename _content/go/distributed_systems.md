# Distributed Systems Patterns in Go

Building scalable distributed systems requires robust patterns and tools. This chapter covers service discovery, load balancing, rate limiting, circuit breakers, retries, and backoff strategies in Go.

---

## Service Discovery
- Use tools like Consul, etcd, or Kubernetes for dynamic service registration and lookup.
- Libraries: `github.com/hashicorp/consul/api`, `go.etcd.io/etcd/client/v3`.

---

## Load Balancing
- Use reverse proxies (e.g., NGINX, HAProxy) or Go libraries for client-side load balancing.
- Example: `github.com/afex/hystrix-go/hystrix` for circuit breaking and load balancing.

---

## Rate Limiting
- Prevent abuse and ensure fair usage.
- Libraries: `golang.org/x/time/rate`, `github.com/ulule/limiter`.

```go
import "golang.org/x/time/rate"
limiter := rate.NewLimiter(1, 5) // 1 request/sec, burst of 5
```

---

## Circuit Breakers
- Prevent cascading failures by stopping calls to failing services.
- Libraries: `github.com/sony/gobreaker`, `github.com/afex/hystrix-go/hystrix`.

---

## Retries and Backoff
- Retry failed operations with exponential backoff.
- Libraries: `github.com/cenkalti/backoff`, `github.com/sethgrid/pester`.

```go
import "github.com/cenkalti/backoff/v4"
err := backoff.Retry(operation, backoff.NewExponentialBackOff())
```

---

## Best Practices
- Use context for timeouts and cancellation.
- Monitor and log all distributed operations.
- Test failure scenarios and recovery.

---

Mastering these patterns is essential for building resilient, scalable distributed systems in Go.