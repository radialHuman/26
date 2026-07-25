# Two-Phase Commit (2PC) — Why It Fails + Alternatives

## What it is
A distributed transaction protocol that attempts to ensure all participants either commit or all roll back. Phase 1 (prepare): coordinator asks all participants "can you commit?" Phase 2 (commit/abort): if all say yes, coordinator tells all to commit. If any say no, coordinator tells all to abort.

## Why it matters
You need to understand 2PC to understand WHY Saga pattern exists. 2PC is taught as the distributed transaction solution, but it has fundamental failure modes that make it unsuitable for microservices. Senior engineers who propose "just use distributed transactions" without knowing the failure modes get pushback in interviews.

## What to know before starting
- What an atomic transaction is: all or nothing within a single database
- What network partition means: two nodes cannot communicate
- The Saga pattern from `16-saga-pattern` — the alternative to 2PC

## How to approach it
**Phase 1 (Prepare)**: Coordinator sends PREPARE to all participants. Each participant:
- Writes to local WAL
- Acquires all locks needed for the transaction
- Responds READY or ABORT

**Phase 2 (Commit/Abort)**: If all READY → coordinator sends COMMIT. If any ABORT → coordinator sends ROLLBACK.

**The fundamental failure modes**:
1. Coordinator crashes after PREPARE but before COMMIT: all participants are locked waiting, holding resources. They can't decide on their own.
2. Participant crashes after sending READY but before receiving COMMIT: on recovery, it doesn't know whether to commit or abort — it must ask the coordinator (which may also be down).
3. Network partition during Phase 2: some participants get COMMIT, others get nothing. Inconsistent state.

## What to build (minimal working version)
- `Coordinator` and 3 `Participant` services (FastAPI)
- Phase 1: coordinator POSTs `/prepare` to all participants; each responds READY/ABORT
- Phase 2: coordinator POSTs `/commit` or `/rollback` to all
- Test happy path: all participants commit
- Simulate coordinator crash between Phase 1 and Phase 2: participants hold locks forever — observe the stuck state
- Implement a timeout-based resolution: if participants don't hear from coordinator in 30s, query peers for their decision

## Knobs to turn
- Crash one participant after sending READY. What does the coordinator do? (Abort all)
- Crash coordinator after all participants say READY. How do participants resolve? (They can't without coordinator)
- Compare: how long does your Saga (from `16-saga-pattern`) take for the same 3-service transaction vs. 2PC?
- Implement 3PC (three-phase commit) — adds a pre-commit phase to eliminate the blocking problem. Is it actually better?

## How it connects to other components
- `16-saga-pattern` — the alternative pattern; build both to understand the trade-off
- `27-distributed-lock` — 2PC participants hold locks throughout the protocol — this is why it's slow
- `43-optimistic-pessimistic-locking` — 2PC uses pessimistic locking across services

## Real tool / production system
PostgreSQL supports 2PC via `PREPARE TRANSACTION` / `COMMIT PREPARED`. XA transactions (Java). Why nobody uses it in microservices: blocking, coordinator single point of failure, lock contention. Modern systems use Saga for business transactions and accept eventual consistency. What you're missing: recovery protocol (how to complete a prepared transaction after coordinator restarts), and heuristic decisions (manually deciding to commit or abort a stuck transaction).
