# GraphQL-style Resolver + N+1 Problem

## What it is
A resolver is a function that fetches data for a single field in a GraphQL schema. The N+1 problem occurs when fetching a list of N items, and for each item you make 1 additional query — resulting in N+1 total queries instead of 2.

## Why it matters
The N+1 problem is the most common GraphQL performance bug, and it's a classic interview question even in non-GraphQL contexts. Understanding it teaches you about query batching, lazy loading, and the DataLoader pattern. Interviewers ask "what are the drawbacks of GraphQL?" — N+1 is the top answer.

## What to know before starting
- What a resolver is: a function `resolve(parent, args, context)` that returns a value for one field
- What lazy loading is: loading related data only when accessed
- Python's `asyncio.gather()` for concurrent async operations

## How to approach it
Build a simple resolver tree. Query: "give me 10 users and their posts."

**Without DataLoader (N+1)**:
- 1 query: `SELECT * FROM users LIMIT 10` → 10 users
- For each user: `SELECT * FROM posts WHERE user_id = ?` → 10 more queries
- Total: 11 queries

**With DataLoader (batching)**:
- 1 query: `SELECT * FROM users LIMIT 10` → 10 users
- Collect all user IDs, batch: `SELECT * FROM posts WHERE user_id IN (1,2,...10)` → 1 query
- Total: 2 queries

DataLoader: buffer all requested IDs within a single event loop tick, then execute one batched query.

## What to build (minimal working version)
- SQLite DB with `users` and `posts` tables (10 users, 50 posts)
- Simple resolver: `get_users()` returns users; `get_posts_for_user(user_id)` returns posts
- N+1 version: for each user, call `get_posts_for_user()` individually — log all DB queries, count them
- DataLoader version: `PostLoader` that buffers user_ids and executes one batched query
- Compare: N+1 makes 11 queries; DataLoader makes 2

## Knobs to turn
- Increase to 100 users. N+1 makes 101 queries vs DataLoader's 2. Measure timing difference.
- Add a second level: posts have comments. Now you have N+1 at two levels (users → posts → comments). DataLoader still makes 3 queries total.
- Apply the same pattern to REST: you have an endpoint that returns orders with customer details — same N+1 problem exists.
- Implement a simple query depth limiter: reject GraphQL queries nested more than 5 levels deep.

## How it connects to other components
- `11-connection-pool` — N+1 without a connection pool creates N+1 new connections
- `01-lru-cache` — DataLoader caches within a request; combine with LRU cache across requests
- `30-api-gateway` — gateway can enforce query complexity limits before hitting resolvers

## Real tool / production system
Facebook's DataLoader (JavaScript, but the pattern is universal). `strawberry-graphql` (Python GraphQL library). `aiodataloader` for Python async. What you're missing: query complexity analysis (prevent expensive queries), persisted queries (hash the query, only send hash), and subscription resolvers (real-time GraphQL).
