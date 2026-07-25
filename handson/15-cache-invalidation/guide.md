# Cache Invalidation

## What it is
The strategies for keeping cache contents consistent with the source of truth (database). When data changes in the DB, you need a plan for what happens to the cached copy.

## Why it matters
Stale cache data causes bugs: users see old profile photos, prices, inventory counts. Cache invalidation is famously described as one of the two hard problems in computer science. Getting it wrong causes either correctness issues (stale reads) or performance issues (too many cache misses).

## What to know before starting
- What a cache hit vs. cache miss is
- The read-aside (lazy loading) pattern: check cache first, if miss load from DB and populate cache
- TTL: every cache entry expires after N seconds regardless

## How to approach it
There are four main strategies, each with different consistency vs. performance trade-offs:

1. **TTL (time-to-live)**: Let stale data age out. Simplest. Bounded staleness.
2. **Write-through**: On every DB write, also update the cache. Cache is always fresh. Slower writes, wasted cache space if data is rarely read.
3. **Write-behind (write-back)**: Write to cache first, async write to DB later. Fastest writes. Risk of data loss if cache crashes before DB write.
4. **Event-driven invalidation**: When data changes, publish an event; cache listens and deletes or updates the key.

## What to build (minimal working version)
- A simple in-memory cache + fake DB (dict)
- Read-aside pattern: `get(key)` checks cache → on miss, loads DB → populates cache
- TTL: entries expire after 30 seconds; test that a DB update becomes visible after TTL
- Write-through: `update(key, value)` writes to both DB and cache atomically
- Event-driven: publish a "user_updated" event; a cache listener deletes the stale key

## Knobs to turn
- Set TTL=5s. Update DB. How long until cache reflects the change?
- With write-through: what is the cost of caching every write even for rarely-read keys?
- With event-driven: what happens if the event is lost (queue failure)? The cache is now permanently stale.
- Combine TTL + event-driven as a safety net: event invalidates immediately; TTL catches missed events.

## How it connects to other components
- `01-lru-cache` — eviction is about space; invalidation is about correctness — they're different problems
- `21-outbox-pattern` — reliable event publishing for invalidation uses the outbox pattern
- `23-read-replicas` — replication lag causes a similar "stale read" problem as bad cache invalidation

## Real tool / production system
Redis with `DEL` or `SET` on write. Memcached with `delete`. CDN purge APIs for content invalidation. What you're missing: distributed cache invalidation across multiple cache nodes, cache stampede prevention (many misses hit DB simultaneously after invalidation), and partial invalidation (invalidate only part of a cached aggregate).
