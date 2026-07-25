# Outbox Pattern

## What it is
A way to atomically write to a database and publish an event without using a distributed transaction. Instead of writing to DB and publishing to a queue in two separate operations (which can fail independently), you write the event into an "outbox" table in the same DB transaction. A separate process reads the outbox and publishes to the queue.

## Why it matters
The dual-write problem: you write to DB, then queue publish fails. Now DB has the record but no event was published. Or: queue publishes, then DB write fails. Now an event fired for something that didn't happen. The outbox pattern solves this without 2PC. It's a senior-level pattern — most engineers know queues but don't know how to make them reliable.

## What to know before starting
- Why a DB transaction is atomic (all or nothing within one DB)
- Why you can't make a DB write and a queue publish atomic across two systems
- What "at-least-once delivery" means

## How to approach it
The insight: your DB is already durable and transactional. Use it as the reliable staging area.

In the same transaction as your business write:
```
INSERT INTO orders (id, user_id, ...) VALUES (...)
INSERT INTO outbox (event_type, payload, status) VALUES ('order_created', {...}, 'pending')
COMMIT
```

A separate "relay" process polls the outbox table, publishes each pending event to the queue, marks it `published`. If the relay crashes mid-publish, it will re-publish on restart — at-least-once delivery. The consumer must be idempotent.

## What to build (minimal working version)
- SQLite DB with `orders` table and `outbox` table
- `create_order()`: inserts order + outbox event in one transaction
- Relay process: polls outbox every second for `status='pending'`; publishes to Redis list; marks `status='published'`
- Simulate relay crash: have it crash after publishing 5 events. Restart. Confirm no events lost.
- Consumer: idempotent (uses event ID to skip duplicates)

## Knobs to turn
- Remove the outbox. Fail the queue publish after the DB commit. How many events are lost?
- Make the relay crash between publish and marking published. Restart. How many duplicates? (This is why consumers must be idempotent)
- Use Postgres `LISTEN/NOTIFY` instead of polling for lower latency
- Add outbox cleanup: delete published events older than 7 days

## How it connects to other components
- `16-saga-pattern` — saga steps use outbox for reliable event publishing
- `13-idempotency` — consumers of outbox events must be idempotent
- `09-message-queue` — outbox is the reliable bridge to any queue

## Real tool / production system
Debezium (CDC — change data capture) reads PostgreSQL WAL to achieve the same effect without polling. Transactional outbox is a standard microservices pattern. What you're missing: high-throughput relay (poll is slow at scale), ordering guarantees (multiple relay instances can reorder), and outbox table size management.
