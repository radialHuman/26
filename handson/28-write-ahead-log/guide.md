# Write-Ahead Log (WAL)

## What it is
Before making any change to data, first write a record of that change to an append-only log file. On crash, replay the log to reconstruct the correct state. The log is the source of truth; the data store is derived from it.

## Why it matters
This is how every serious database achieves durability — PostgreSQL, MySQL, SQLite all use WAL. Understanding it explains how databases survive crashes, how replication works, and how event sourcing is just "WAL as a design pattern." Interviewers ask about durability and crash recovery at senior level.

## What to know before starting
- What "durable" means: data survives a crash (it's on disk, not just in memory)
- What an append-only file is: you only write new lines, never modify old ones
- Python file I/O: `open(path, 'a')` for append mode, `flush()`, `fsync()` for durability

## How to approach it
Every write operation goes through two steps:
1. Append `{operation, key, value, timestamp}` to the log file (fast, sequential write)
2. Apply the operation to the in-memory data store

On startup: read the log file from the beginning; re-apply every operation in order. This reconstructs the state even after a crash.

Optimization: periodically take a snapshot of current state; on recovery, load snapshot then replay only log entries after it.

## What to build (minimal working version)
- `WAL` class: appends JSON lines to `wal.log` with `fsync()` after each write
- `KVStore` class: in-memory dict, uses WAL for every `set()` and `delete()`
- On `KVStore.__init__`: read and replay `wal.log` if it exists
- Test crash recovery: write 10 entries, exit Python (simulate crash), restart, confirm state is correct
- Add snapshots: `snapshot()` writes current state to `snapshot.json`; recovery loads snapshot then replays only newer log entries

## Knobs to turn
- Remove `fsync()`. Is data durable? (No — OS buffers the write; power loss loses it)
- Replay a log with 100,000 entries. How long does startup take?
- Add a snapshot every 1000 entries. How does startup time change?
- Corrupt the last log entry. How do you detect and handle partial writes? (CRC checksum per entry)

## How it connects to other components
- `36-event-sourcing-cqrs` — event sourcing is WAL as an application-level pattern
- `23-read-replicas` — PostgreSQL WAL is streamed to replicas for replication
- `21-outbox-pattern` — outbox is a WAL-like pattern for reliable event publishing

## Real tool / production system
PostgreSQL WAL (`pg_wal` directory). MySQL binary log. SQLite WAL mode. What you're missing: WAL compaction (the log grows forever otherwise), WAL shipping for replication, group commit (batch multiple transactions into one fsync for throughput), and crash-safe file operations (write to temp file, rename atomically).
