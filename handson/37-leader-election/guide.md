# Leader Election

## What it is
A process where distributed nodes agree on which one is "the leader" — the single node responsible for a coordinating task. All others are followers/standbys. If the leader dies, a new one is elected.

## Why it matters
Distributed systems often need one coordinator: the primary DB, the Kafka controller, the scheduler that runs cron jobs. Without leader election, you get either split-brain (two nodes think they're primary, both write — data corruption) or no progress (no one coordinates). Interviewers ask "how do you prevent multiple masters?" or "how does your scheduler run on only one instance?"

## What to know before starting
- What a distributed lock is (from `27-distributed-lock`) — leader election uses a lock variant
- What split-brain means: two nodes both believe they're the leader simultaneously
- Fencing tokens: a monotonically increasing number issued with each lock acquisition; prevents a zombie leader from acting on stale data

## How to approach it
The simplest approach: use Redis `SET leader_key node_id NX PX 10000`. Whoever acquires the lock is the leader. Leaders must renew the lock every 3 seconds. If a leader fails to renew (crashes, network partition), the TTL expires and another node can acquire it.

The fencing token: each time leadership changes, Redis increments a counter. The leader includes this counter in all operations. Downstream services reject operations with a lower counter than they've seen.

## What to build (minimal working version)
- 3 nodes (threads) each trying to acquire a Redis lock as leader
- Leader renews lock every 3 seconds; followers retry acquisition every 5 seconds
- Simulate leader crash: kill the leader thread; confirm one follower becomes leader within TTL seconds
- Add fencing token: Redis `INCR election_counter` on each election; include in leader's actions
- Test split-brain prevention: two nodes both believe they're leader (simulate by disabling lock check); fencing token rejects the stale one

## Knobs to turn
- Set TTL=1s, renewal=0.9s. Observe tight leadership handoff.
- Set TTL=30s. Kill the leader. How long until a new one is elected?
- Add an observer: a thread that watches leadership changes and logs them.
- What happens during a network partition where the leader can't reach Redis? (It can't renew; leadership transfers even though the node is still running)

## How it connects to other components
- `27-distributed-lock` — leader election IS a distributed lock with renewals
- `35-job-scheduler` — schedulers use leader election to ensure one instance runs jobs
- `29-service-discovery` — the leader registers itself with a special role in the registry

## Real tool / production system
etcd: Kubernetes uses etcd leader election for its control plane. ZooKeeper ephemeral sequential nodes. Raft consensus algorithm (used in etcd, CockroachDB) is the principled approach. What you're missing: Raft proper (leader election is just one part), term numbers, log replication, and handling network partitions with quorum.
