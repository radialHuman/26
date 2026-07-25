# LRU Cache

## What it is
A cache that evicts the **Least Recently Used** item when full. When you access an item, it moves to the "most recently used" position. When you need space, you remove from the other end.

## Why it matters
Every read-heavy system uses caching. Twitter, Instagram, and Netflix cache user profiles, timelines, and media metadata. Without eviction logic, caches grow unbounded or serve stale data forever. Interviewers use this to test if you understand O(1) data structure design.

## What to know before starting
- What a hash map is and why lookup is O(1)
- What a doubly linked list is: each node has a pointer to both prev and next
- Why you need both structures together: hash map for fast lookup, linked list for fast reordering

## How to approach it
The insight is that you need two things at the same time: find any item instantly (hash map), and maintain order so you always know what's oldest (linked list). Neither structure alone gives you both.

Think about what happens on a `get`: you find the node, then move it to the front. Think about what happens on a `put`: insert at front, and if over capacity, remove from the back. The two sentinel nodes (dummy head and tail) remove edge cases.

## What to build (minimal working version)
- `Node` class with key, value, prev, next
- `LRUCache(capacity)` with a dict and dummy head/tail
- `get(key)` → move to head, return value or -1
- `put(key, value)` → insert at head, evict tail if over capacity
- Test: capacity=3, put 4 items, assert the first is gone

## Knobs to turn
- Set capacity=1. Put two items. What survives?
- Access item A, then B, then A again. Fill to capacity. Which gets evicted?
- Add TTL per key: keys expire after N seconds regardless of access. How does this change the data structure?
- Switch to LFU: evict by frequency instead of recency. When does LFU beat LRU?

## How it connects to other components
- `15-cache-invalidation` — what triggers a cache entry to be removed or updated
- `45-cdn-edge-caching` — CDN edge nodes use LRU-like eviction
- `27-distributed-lock` — needed if multiple threads write to the same cache

## Real tool / production system
Redis uses an approximated LRU (samples a subset of keys rather than tracking exact order). Memcached uses true LRU per slab. Your implementation is exact LRU — simpler but not distributed. What you're missing: expiry, persistence, distribution across nodes.
