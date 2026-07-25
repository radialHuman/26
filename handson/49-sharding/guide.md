# Sharding / Partitioning

## What it is
Splitting a database or dataset across multiple machines (shards) so that each machine holds only a subset of the data. Queries and writes go to the specific shard that owns the relevant data, rather than a single machine that holds everything.

## Why it matters
When your data outgrows a single machine's storage or write throughput, sharding is the answer. Interviewers ask about it in any large-scale system design. The design of your shard key determines whether your system scales or creates hotspots.

## What to know before starting
- Consistent hashing from `08-consistent-hash-ring` — the preferred sharding strategy
- What write throughput means: how many writes per second a single DB can handle
- What a cross-shard query is: a query that needs data from multiple shards (expensive and complex)

## How to approach it
Three strategies:

1. **Hash-based**: `shard = hash(user_id) % N`. Even distribution. But changing N moves most data.
2. **Range-based**: user IDs 1–1M on shard 1, 1M–2M on shard 2. Simple routing. Risk of hotspots if recent IDs get all traffic.
3. **Directory-based**: a lookup table maps every key to its shard. Most flexible. The lookup table becomes a bottleneck.

Choose a shard key based on: access patterns (keys that are always queried together should be on the same shard), cardinality (enough unique values to distribute evenly), and immutability (changing a shard key requires moving the data).

## What to build (minimal working version)
- `ShardedKVStore(num_shards)`: list of N in-memory dicts, one per shard
- `hash_shard(key)`: `hash(key) % num_shards`
- `get(key)`, `set(key, value)`, `delete(key)` routing to correct shard
- Insert 10,000 keys. Measure distribution across shards. Is it even?
- Simulation: add a 4th shard. How many keys need to move with naive modulo? Replace with consistent hash ring. How many move?
- Simulate a multi-key operation: `transfer(from_key, to_key)` where the two keys are on different shards — what breaks?

## Knobs to turn
- Use range-based sharding on timestamps (recent data on shard 3). Simulate a "recent posts" workload. Watch shard 3 get 90% of traffic.
- Add replication per shard: each shard has a primary and one replica. Route reads to replicas.
- Implement a resharding operation: add a 5th shard, move only the affected keys, keep the store available during migration.
- Implement cross-shard aggregation: count total keys across all shards. How does this scale with N shards?

## How it connects to other components
- `08-consistent-hash-ring` — the routing algorithm
- `24-hotspot-mitigation` — bad shard key choice causes hotspots
- `43-optimistic-pessimistic-locking` — cross-shard transactions require distributed locking or saga
- `25-unique-id-generation` — shard keys should be high-cardinality; Snowflake IDs work well

## Real tool / production system
MongoDB sharding with shard keys. DynamoDB partition keys. Cassandra partition keys. Vitess for MySQL sharding. What you're missing: shard rebalancing without downtime, cross-shard transactions (2PC or Saga), shard key selection tooling, and hot partition detection/mitigation.
