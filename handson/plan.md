# Hands-On System Design: Master Plan

> **Goal:** Build intuitive understanding of system design components by coding them from scratch in Python.
> Each folder has a `guide.md` with: what it is, why it matters, how to approach it, what to build, and what to observe.
>
> **Rules:**
> - Write code by hand. Don't copy-paste.
> - After each component: write 3 things that surprised you.
> - Connect each build to a real system (Twitter, Uber, WhatsApp, Netflix, Stripe).
> - Use the imported tools AFTER you've built the thing yourself — compare the two.

---

## Tooling Prerequisites

```bash
pip install fastapi uvicorn httpx pytest redis pika sqlalchemy aiosqlite cryptography msgpack structlog
docker run -d -p 6379:6379 redis
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:management
docker run -d -p 16686:16686 -p 4317:4317 jaegertracing/all-in-one
```

---

## Priority Table

| Priority | # | Component | Folder | Real Tool to Compare |
|----------|---|-----------|--------|---------------------|
| 🔴 | 1 | LRU Cache | `01-lru-cache` | Redis |
| 🔴 | 2 | Load Balancer | `02-load-balancer` | Nginx |
| 🔴 | 3 | Rate Limiter | `03-rate-limiter` | Redis + Kong |
| 🔴 | 4 | Retry + Backoff | `04-retry-and-backoff` | tenacity |
| 🔴 | 5 | Fan-out on Write vs Read | `05-fanout-write-vs-read` | Twitter architecture |
| 🔴 | 6 | Back-of-Envelope Estimation | `06-back-of-envelope` | — |
| 🟠 | 7 | Circuit Breaker | `07-circuit-breaker` | pybreaker / Resilience4j |
| 🟠 | 8 | Consistent Hash Ring | `08-consistent-hash-ring` | Cassandra, Redis Cluster |
| 🟠 | 9 | Message Queue | `09-message-queue` | RabbitMQ, Kafka |
| 🟠 | 10 | Pub/Sub | `10-pub-sub` | Redis Pub/Sub, Kafka |
| 🟠 | 11 | Connection Pool | `11-connection-pool` | SQLAlchemy, PgBouncer |
| 🟠 | 12 | Health Check | `12-health-check` | K8s probes, ALB |
| 🟠 | 13 | Idempotency | `13-idempotency` | Stripe idempotency keys |
| 🟠 | 14 | Task Queue + Worker | `14-task-queue-worker` | Celery, RQ |
| 🟠 | 15 | Cache Invalidation | `15-cache-invalidation` | Redis + events |
| 🟠 | 16 | Saga Pattern | `16-saga-pattern` | AWS Step Functions |
| 🟠 | 17 | WebSocket / Real-time | `17-websocket-realtime` | Socket.IO |
| 🟠 | 18 | Pagination (cursor vs offset) | `18-pagination` | GitHub / Stripe APIs |
| 🟠 | 19 | Request Validation | `19-request-validation` | FastAPI + Pydantic |
| 🟠 | 20 | Long Polling + SSE | `20-long-polling-sse` | EventSource API |
| 🟠 | 21 | Outbox Pattern | `21-outbox-pattern` | Debezium |
| 🟠 | 22 | Backpressure | `22-backpressure` | Kafka consumer lag, KEDA |
| 🟠 | 23 | Read Replicas + Replication Lag | `23-read-replicas` | PostgreSQL streaming |
| 🟠 | 24 | Hotspot Mitigation | `24-hotspot-mitigation` | DynamoDB Adaptive Capacity |
| 🟠 | 25 | Unique ID Generation | `25-unique-id-generation` | Twitter Snowflake |
| 🟡 | 26 | Bloom Filter | `26-bloom-filter` | RocksDB, Cassandra |
| 🟡 | 27 | Distributed Lock | `27-distributed-lock` | Redlock, etcd |
| 🟡 | 28 | Write-Ahead Log | `28-write-ahead-log` | PostgreSQL WAL |
| 🟡 | 29 | Service Discovery | `29-service-discovery` | Consul, K8s CoreDNS |
| 🟡 | 30 | API Gateway | `30-api-gateway` | Kong, AWS API GW |
| 🟡 | 31 | Token Auth (JWT) | `31-token-auth` | Auth0, Keycloak |
| 🟡 | 32 | Structured Logging | `32-structured-logging` | structlog + ELK |
| 🟡 | 33 | Metrics Collector | `33-metrics-collector` | Prometheus + Grafana |
| 🟡 | 34 | Webhook Delivery | `34-webhook-delivery` | Stripe webhooks |
| 🟡 | 35 | Job Scheduler | `35-job-scheduler` | Celery Beat, APScheduler |
| 🟡 | 36 | Event Sourcing + CQRS | `36-event-sourcing-cqrs` | EventStoreDB |
| 🟡 | 37 | Leader Election | `37-leader-election` | etcd, ZooKeeper |
| 🟡 | 38 | Distributed Tracing | `38-distributed-tracing` | Jaeger, OpenTelemetry |
| 🟡 | 39 | GraphQL Resolver + N+1 | `39-graphql-resolver` | strawberry-graphql |
| 🟡 | 40 | Binary Serialization | `40-binary-serialization` | Protobuf, MessagePack |
| 🟡 | 41 | API Versioning | `41-api-versioning` | Stripe, GitHub |
| 🟡 | 42 | OAuth2 Flow | `42-oauth2-flow` | Google, GitHub OAuth |
| 🟡 | 43 | Optimistic vs Pessimistic Locking | `43-optimistic-pessimistic-locking` | SQLAlchemy, PostgreSQL |
| 🟡 | 44 | Bulkhead Pattern | `44-bulkhead-pattern` | Hystrix, Resilience4j |
| 🟡 | 45 | CDN + Edge Caching | `45-cdn-edge-caching` | CloudFront, Cloudflare |
| 🟡 | 46 | Database-per-Service | `46-database-per-service` | Microservices pattern |
| 🟡 | 47 | Exactly-Once Delivery | `47-exactly-once-delivery` | Kafka EOS |
| 🟡 | 48 | CORS + CSRF | `48-cors-csrf` | FastAPI CORSMiddleware |
| 🟢 | 49 | Sharding | `49-sharding` | Vitess, DynamoDB |
| 🟢 | 50 | Inverted Index | `50-inverted-index` | Elasticsearch, Whoosh |
| 🟢 | 51 | Two-Phase Commit | `51-two-phase-commit` | PostgreSQL PREPARE TX |
| 🟢 | 52 | mTLS Service Auth | `52-mtls-service-auth` | Istio, Linkerd |

---

## Component Dependency Map

Start at the top. Each arrow means "you'll understand this better if you've done that first."

```
01-lru-cache ──────────────────────────────► 15-cache-invalidation
                                              └──► 45-cdn-edge-caching

02-load-balancer ──────────────────────────► 08-consistent-hash-ring
                                              └──► 49-sharding
                                                   └──► 24-hotspot-mitigation

03-rate-limiter ────────────────────────────► 30-api-gateway
         │                                    └──► 27-distributed-lock (Redis)

04-retry-and-backoff ──────────────────────► 07-circuit-breaker
         │                                    └──► 44-bulkhead-pattern
         └──────────────────────────────────► 34-webhook-delivery
         └──────────────────────────────────► 13-idempotency
                                              └──► 47-exactly-once-delivery

09-message-queue ──────────────────────────► 10-pub-sub
         │                                    └──► 05-fanout-write-vs-read
         └──────────────────────────────────► 22-backpressure
         └──────────────────────────────────► 14-task-queue-worker
                                              └──► 35-job-scheduler

16-saga-pattern ────────────────────────────► 21-outbox-pattern
         └──────────────────────────────────► 51-two-phase-commit (build to compare)

28-write-ahead-log ────────────────────────► 36-event-sourcing-cqrs
         └──────────────────────────────────► 23-read-replicas

31-token-auth ──────────────────────────────► 42-oauth2-flow
         └──────────────────────────────────► 48-cors-csrf

32-structured-logging ─────────────────────► 38-distributed-tracing
         └──────────────────────────────────► 33-metrics-collector
```

---

## Cross-Cutting Habits (for every component)

- [ ] Before coding: draw the data structures and flow on paper
- [ ] After coding: write what breaks when the system scales 100×
- [ ] After coding: identify which real system (Twitter/Uber/Stripe/Netflix) relies on this
- [ ] After coding: answer "when would I NOT use this?"
- [ ] After each session: one-line note on what clicked that wasn't obvious before

---

## Systems This List Covers

| System | Key Components Used |
|--------|-------------------|
| **Twitter** | 01, 02, 03, 05, 08, 09, 10, 18, 24, 25, 32, 49, 50 |
| **Uber** | 02, 03, 04, 07, 08, 12, 17, 22, 25, 27, 37 |
| **WhatsApp** | 06, 09, 10, 13, 17, 20, 25, 47 |
| **Netflix** | 01, 02, 07, 44, 45, 15, 33, 38 |
| **Stripe/Payment** | 03, 04, 13, 16, 21, 27, 34, 42, 47, 51 |
| **Instagram** | 01, 02, 05, 14, 15, 18, 24, 45, 49 |

---

## Phase Suggestions

| Phase | Components | Rough Duration |
|-------|-----------|----------------|
| Phase 1 — Fundamentals | 01–06 | 1–2 weeks |
| Phase 2 — Distributed Primitives | 07–14 | 2–3 weeks |
| Phase 3 — Data + Async Patterns | 15–25 | 2–3 weeks |
| Phase 4 — Observability + APIs | 26–42 | 3–4 weeks |
| Phase 5 — Advanced + Staff Level | 43–52 | 2–3 weeks |
