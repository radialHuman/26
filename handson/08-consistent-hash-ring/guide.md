# Consistent Hash Ring

## What it is
A way to distribute keys (requests, data) across N nodes so that when you add or remove a node, only the minimum necessary keys move. Naive modulo (`hash(key) % N`) requires moving almost all keys when N changes.

## Why it matters
Used in distributed caches (Memcached), databases (Cassandra, DynamoDB), and load balancers to route requests consistently. Interviewers ask about it whenever you propose sharding or distributed caching.

## What to know before starting
- Why `hash(key) % N` breaks when N changes: change N from 3 to 4 and most keys map to different buckets
- What a sorted data structure is and why binary search gives O(log N) lookup
- The concept of a hash function mapping any string to a number in a fixed range

## How to approach it
Picture a circle (ring) with positions 0 to 2^32. Each node gets hashed to a position on the ring. Each key also gets hashed to a position. To find which node owns a key, go clockwise from the key's position until you hit a node.

When you add a node, only the keys between the new node and the previous node in the clockwise direction need to move. When you remove a node, its keys go to the next clockwise node.

Virtual nodes: each physical node maps to multiple positions. This smooths out the distribution.

## What to build (minimal working version)
- A sorted list of `(hash_value, node_name)` tuples representing the ring
- `add_node(node)` — hash the node name, insert into sorted list
- `remove_node(node)` — remove all entries for this node
- `get_node(key)` — hash the key, binary search for first node clockwise
- Test: 3 nodes, 1000 keys. Record distribution. Remove 1 node. Count how many keys moved.

## Knobs to turn
- With 3 nodes and no virtual nodes: check how evenly 1000 keys distribute. Is it 333/333/334?
- Add 100 virtual nodes per physical node. Re-check distribution evenness.
- Increase virtual nodes to 500. Compare to 100. Is there a diminishing return?
- Compare: naive modulo — add a 4th node. How many keys move? Consistent hashing — add a 4th node. How many move?

## How it connects to other components
- `02-load-balancer` — consistent hashing is an alternative to round-robin for sticky routing
- `49-sharding` — consistent hashing is the sharding strategy that minimizes data migration
- `24-hotspot-mitigation` — virtual nodes help prevent hotspots

## Real tool / production system
Memcached clients use consistent hashing to route to cache nodes. Cassandra uses a consistent hash ring for its data distribution. Redis Cluster uses hash slots (a variant). What you're missing: replication factor (data on multiple nodes), handling node failure with replication, and the gossip protocol for ring updates.
