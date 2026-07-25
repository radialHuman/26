# Read Replicas + Replication Lag

## What it is
Read replicas are copies of the primary database that receive all writes via replication and serve read queries. The time between a write on the primary and it being visible on a replica is replication lag.

## Why it matters
Read-heavy systems (Instagram, Twitter) would saturate a single DB with reads. Replicas scale read throughput horizontally. But replication lag means a user might write something and immediately read a stale version — the "read-your-own-writes" consistency problem. Interviewers probe this in any system that separates reads and writes.

## What to know before starting
- Primary-replica (master-slave) replication model: writes go to primary; replicated asynchronously to replicas
- What eventual consistency means: replicas will catch up, but not instantly
- Python's `sqlite3` and how to simulate two DB instances

## How to approach it
Build two SQLite databases: `primary.db` and `replica.db`. A "replication thread" runs every 1 second, copying new rows from primary to replica. This simulates async replication with lag.

Now route writes to primary and reads to replica. Show the lag: insert a row, immediately query replica — it's not there yet. Wait 1 second — now it is.

Then implement read-your-own-writes: route reads for the writing user to the primary for a short window after their write.

## What to build (minimal working version)
- Two SQLite DBs: primary and replica
- Replication thread: every 1 second, copies rows from primary where `id > last_replicated_id`
- Write `create_post()` → primary
- Read `get_posts()` → replica
- Test: create post, immediately read → not found. Wait 1.1s → found. Measure lag.
- Implement read-your-own-writes: after write, route this user's reads to primary for 2 seconds

## Knobs to turn
- Increase replication delay to 5 seconds. What is the user experience impact?
- Add a replication lag metric. Alert when lag > 3 seconds.
- What happens if the primary crashes? Can the replica be promoted? (Simulate: stop writing to primary, promote replica)
- Route 90% of reads to replicas, 10% to primary (for data freshness checks). Observe primary load reduction.

## How it connects to other components
- `15-cache-invalidation` — replication lag and cache staleness are the same problem in different layers
- `43-optimistic-pessimistic-locking` — read from replica then write to primary can cause lost update if not handled
- `49-sharding` — each shard can have its own replica set

## Real tool / production system
PostgreSQL streaming replication. MySQL Group Replication. AWS RDS read replicas. PgBouncer routes read/write queries to appropriate endpoints. What you're missing: semi-synchronous replication (wait for at least one replica to confirm), automatic failover, and split-brain prevention on primary failure.
