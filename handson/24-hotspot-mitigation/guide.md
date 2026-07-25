# Hotspot / Hot Partition Mitigation

## What it is
A hotspot occurs when a disproportionate amount of traffic concentrates on one server, shard, or cache key — overwhelming it while others sit idle. Common causes: a celebrity user, a trending topic, a viral post.

## Why it matters
You can have perfect sharding and still have one shard receive 90% of the traffic because one key is extremely hot. This is the failure mode that takes down systems after going viral. Interviewers specifically ask "how would you handle a celebrity with 50 million followers posting?" — that's a hotspot question.

## What to know before starting
- Hash-based sharding: all requests for user_id=1 go to shard 1
- What cache stampede is: everyone's cache key expires simultaneously, all requests hit the DB at once
- The consistent hash ring from `08-consistent-hash-ring`

## How to approach it
Mitigation strategies:

1. **Key salting**: instead of caching `celebrity_user:posts`, split into `celebrity_user:posts:0` through `:99`. Reads randomly pick one salt. Writes update all 100. Spreads cache load across 100 keys.

2. **Local caching**: add a tiny in-memory cache in front of Redis. First request misses and populates local cache; next 1000 requests from the same server instance hit local cache.

3. **Async fan-out limiting**: for celebrities, don't fan-out on write. At read time, fetch and merge (from `05-fanout-write-vs-read`).

4. **Adaptive routing**: detect hot keys in real time; route them to dedicated "hot-key" nodes.

## What to build (minimal working version)
- Simulate 10 shards; route requests by `hash(user_id) % 10`
- Generate traffic: 99% of requests for user_id=5 (one hot shard)
- Measure: request distribution per shard
- Implement salted cache: split hot key into 10 salted variants; reads pick randomly
- Measure cache load distribution before and after salting

## Knobs to turn
- Increase salting from 10 to 100 variants. How much does write amplification increase?
- Add local in-process cache (Python dict, max 100 entries, 1s TTL). How many Redis calls does it eliminate?
- Simulate cache stampede: expire a hot key; have 100 threads all miss simultaneously. Add probabilistic early recomputation to prevent it.

## How it connects to other components
- `08-consistent-hash-ring` — virtual nodes help but don't solve hotspots caused by hot keys
- `05-fanout-write-vs-read` — the celebrity problem is a hotspot in the fan-out layer
- `01-lru-cache` — local caching as a hotspot buffer

## Real tool / production system
Twitter solves celebrity hotspots with a special handling path. DynamoDB Adaptive Capacity automatically detects and routes hot partitions. Redis Cluster has hot key detection. What you're missing: real-time hotspot detection (track request count per key), automatic promotion to dedicated nodes, and cool-down detection to un-promote.
