# Connection Pool

## What it is
A cache of pre-opened connections to a resource (database, external service). Instead of opening and closing a connection for every request, connections are borrowed from the pool, used, and returned.

## Why it matters
Opening a DB connection takes 50–200ms (TCP handshake, authentication, SSL). Under load, creating a new connection per request serializes your throughput and exhausts DB connection limits. Every production DB-backed service uses pooling. Interviewers expect you to mention it when discussing database access patterns.

## What to know before starting
- What establishing a TCP connection involves (handshake, authentication)
- Python's `threading.Semaphore` — limits concurrent access to a resource
- What `queue.Queue` does: thread-safe FIFO, blocks on get if empty (good for pool)

## How to approach it
Model a connection as an object that takes 1 second to create (`time.sleep(1)`). Pool starts with 0 connections (lazy) or pre-fills to min_size (eager). `acquire()` either returns an idle connection or creates one if under max_size, or blocks until one is returned. `release()` puts the connection back.

The key insight: under concurrent load, the pool reuses connections, so 100 concurrent requests don't require 100 DB connections — just whatever the pool max is.

## What to build (minimal working version)
- `Connection` class with `connect()` (sleeps 1s), `query()`, `close()`
- `ConnectionPool(max_size=3)` with `acquire()` and `release()`
- Test: 10 concurrent threads each acquire, query, release
- Without pool: measure total time. With pool of 3: measure time. Compare.

## Knobs to turn
- Set max_size=1. What happens under concurrent load? (Serialization)
- Set max_size=10. What happens to the DB (simulated by connection count)?
- Add connection validation in `acquire()`: if connection has been idle >30s, discard and create fresh
- Add max_lifetime: discard connections older than 5 minutes regardless of use

## How it connects to other components
- `11-connection-pool` feeds into every component that talks to a database
- `27-distributed-lock` — lock acquisition should go through a pool if the lock service is Redis
- `22-backpressure` — pool exhaustion (all connections busy) is a form of backpressure signal

## Real tool / production system
SQLAlchemy's `create_engine(pool_size=5, max_overflow=10)`. PgBouncer is a standalone connection pooler for PostgreSQL. HikariCP for Java. What you're missing: pool monitoring (connection wait time), dead connection detection, adaptive pool sizing.
