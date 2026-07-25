# Optimistic vs Pessimistic Locking

## What it is
Two strategies for handling concurrent writes to the same data. **Pessimistic locking**: lock the row before reading, hold the lock until you're done writing — no one else can touch it. **Optimistic locking**: don't lock; instead, track a version number and check at write time that nobody else modified the row since you read it.

## Why it matters
Every database-backed system faces concurrent writes. The wrong strategy causes lost updates (two users overwrite each other) or deadlocks (two threads wait for each other's locks forever). Interviewers ask about this in any scenario with multiple writers: inventory, seat booking, bank transfers.

## What to know before starting
- What a race condition is: two operations interleave in a way that produces incorrect results
- SQL `SELECT FOR UPDATE`: acquires a row-level lock for the duration of the transaction
- What a version column is: an integer that increments on every update

## How to approach it
**Pessimistic**: `SELECT * FROM inventory WHERE id=1 FOR UPDATE` — DB locks the row. Other transactions trying to read-for-update block until you commit. Correct, but slow under high contention. Risk of deadlocks if locks are acquired in different orders.

**Optimistic**: `SELECT id, quantity, version FROM inventory WHERE id=1`. Do your logic. `UPDATE inventory SET quantity=new_qty, version=version+1 WHERE id=1 AND version=<version_you_read>`. If 0 rows updated, someone else modified it — retry.

Optimistic is better when conflicts are rare. Pessimistic is better when conflicts are frequent (high contention).

## What to build (minimal working version)
- SQLite DB with `inventory` table: `(id, product, quantity, version)`
- Pessimistic: `buy_pessimistic(product_id, qty)` using `SELECT ... FOR UPDATE` (use PostgreSQL for real locks)
- Optimistic: `buy_optimistic(product_id, qty)` with version check in UPDATE; retry on 0 rows affected
- Race test: 10 threads all try to buy the last item simultaneously — only 1 should succeed
- Deadlock demo with pessimistic: two transactions each lock resource A then try to lock B (and B then A)

## Knobs to turn
- With optimistic: increase contention (100 threads). Count retries needed. At what point does retry storm occur?
- With pessimistic: create a deadlock by having thread 1 lock row A then row B, and thread 2 lock row B then row A simultaneously.
- Implement "lost update" without any locking. Show that two concurrent reads + writes corrupt the quantity.
- Use `SKIP LOCKED` (PostgreSQL): skip locked rows instead of waiting — useful for queue-like patterns.

## How it connects to other components
- `27-distributed-lock` — distributed lock is pessimistic locking across services (not just within a DB)
- `23-read-replicas` — reading from replica + writing to primary without locks can cause lost updates
- `13-idempotency` — optimistic lock failures require retry; retries require idempotency

## Real tool / production system
PostgreSQL `SELECT FOR UPDATE`, `NOWAIT`, `SKIP LOCKED`. SQLAlchemy supports both via `with_for_update()` and version column via `__version_id_col__`. Django has `select_for_update()`. Hibernate ORM's `@Version` annotation for optimistic locking. What you're missing: lock timeout (don't wait forever), deadlock detection and automatic retry, and application-level optimistic locking across service boundaries.
