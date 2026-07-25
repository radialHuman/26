# Distributed Lock

## What it is
A lock that works across multiple processes or servers. When two servers try to process the same order simultaneously, a distributed lock ensures only one proceeds at a time.

## Why it matters
Regular Python `threading.Lock` only works within a single process. In a distributed system with 10 servers, you need a lock all of them respect. Without it: double charges, double bookings, duplicate email sends. Redis `SET NX` (set if not exists) is the standard building block.

## What to know before starting
- What a mutex/lock is in single-process programming
- Redis `SET key value NX PX milliseconds` — atomically sets key only if it doesn't exist, with expiry
- Why TTL on the lock is critical: if the lock holder crashes, the lock expires automatically

## How to approach it
The Redis command `SET lock_key unique_token NX PX 30000` atomically acquires the lock with a 30s TTL. Returns OK if acquired, nil if already held.

The `unique_token` is critical for safe release: when releasing, check that the stored value is YOUR token before deleting. This prevents accidentally releasing someone else's lock (race condition if your TTL expired but you try to release).

Use a Lua script for atomic check-and-delete on release.

## What to build (minimal working version)
- `DistributedLock(redis_client, key, ttl_ms)` class
- `acquire()`: `SET key uuid NX PX ttl`; return True if acquired
- `release()`: Lua script: `if GET key == uuid then DEL key end` (atomic)
- `__enter__` / `__exit__` for context manager usage
- Test: two threads both try to acquire same lock; confirm only one succeeds

## Knobs to turn
- Crash the lock holder before release (raise an exception). Confirm lock expires after TTL.
- Try releasing without the UUID check. Show how you can accidentally release another owner's lock.
- Implement lock renewal: if your task takes longer than TTL, extend the lock with `PEXPIRE`.
- Test with 10 concurrent processes all trying to lock the same key. Only 1 should succeed at a time.

## How it connects to other components
- `13-idempotency` — distributed lock prevents duplicate processing; idempotency catches cases where lock fails
- `37-leader-election` — leader election uses a distributed lock variant
- `03-rate-limiter` — Redis-based rate limiters use similar atomic Redis operations

## Real tool / production system
Redlock algorithm (multi-node Redis) improves on single-node for high-availability scenarios. Zookeeper ephemeral nodes. etcd leases. What you're missing: Redlock (acquire on N/2+1 Redis nodes), lock fairness (FIFO ordering), and fencing tokens (pass a monotonically increasing token with each lock to detect stale operations).
