# Bloom Filter

## What it is
A probabilistic data structure that answers "is this item in the set?" with either "definitely not" or "probably yes." It can have false positives (says yes when the answer is no) but never false negatives. Uses a fraction of the memory of a hash set.

## Why it matters
Used in databases (RocksDB, Cassandra) to avoid reading disk for keys that don't exist. Used in caching layers to avoid cache misses hitting the database. Chrome uses one to check malicious URLs. Interviewers ask about it when you're designing systems where a "definitely not here" fast-path is valuable.

## What to know before starting
- What a hash function is and why different hash functions produce different outputs for the same input
- What a bit array is: a sequence of 0s and 1s indexed by position
- The concept of false positives: the filter says "maybe yes" even though the answer is "no"

## How to approach it
Use a bit array of size M. Choose K hash functions. To add an item: hash it K ways, set those K bit positions to 1. To check: hash it K ways, check all K positions — if any is 0, the item is definitely absent; if all are 1, it's probably present.

False positive rate depends on M (array size), K (number of hashes), and N (number of items inserted). Larger M = fewer false positives. More K = more accurate but more work.

## What to build (minimal working version)
- `BloomFilter(size, num_hashes)` using a `bytearray` for the bit array
- Use Python's `hashlib` with different seeds to simulate K hash functions
- `add(item)`: hash K ways, set bits
- `contains(item)`: hash K ways, check all bits
- Insert 1000 strings. Test 1000 never-inserted strings. Count false positives.

## Knobs to turn
- Vary size from 1000 to 100,000 bits (same N=1000). Plot false positive rate.
- Vary num_hashes from 1 to 10. Find the optimal value.
- Insert 10,000 items into a filter sized for 1,000. Observe false positive rate explosion.
- Use case: before querying DB for a user ID, check bloom filter. Measure DB call reduction.

## How it connects to other components
- `01-lru-cache` — bloom filter can sit in front of the cache: "definitely not cached" skips cache lookup
- `50-inverted-index` — Cassandra uses bloom filters per SSTable to avoid unnecessary disk reads

## Real tool / production system
RocksDB and LevelDB use per-file bloom filters to skip SSTables during lookup. Cassandra uses them per partition. Redis has a BloomFilter module. What you're missing: counting bloom filters (support deletions), scalable bloom filters (grow as needed), and optimal parameter calculation formula: `k = (m/n) * ln(2)`.
