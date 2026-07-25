# Pagination (Cursor vs Offset)

## What it is
The mechanism for returning large datasets in chunks. **Offset pagination**: skip N rows, take M (`LIMIT 20 OFFSET 100`). **Cursor pagination**: start from a specific record ID or timestamp and take the next N.

## Why it matters
Offset pagination breaks at scale: `OFFSET 10000` requires the DB to scan and discard 10,000 rows. It also produces incorrect results when items are inserted or deleted between pages (items skipped or duplicated). Every feed system (Twitter, Instagram, Slack) uses cursor-based pagination. Interviewers test whether you know the difference.

## What to know before starting
- SQL `LIMIT` and `OFFSET` clauses
- What a primary key and index are — cursor pagination relies on indexed lookups
- How HTTP query parameters work (`?cursor=abc&limit=20`)

## How to approach it
Offset: `SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET page*20`. Works fine for small datasets. Breaks at high offsets and under concurrent writes.

Cursor: `SELECT * FROM posts WHERE created_at < :cursor ORDER BY created_at DESC LIMIT 20`. Return the `created_at` of the last item as the cursor for the next page. Each query is an indexed seek — O(log N) not O(N).

The cursor must be opaque to the client (usually base64-encoded) to prevent clients from constructing arbitrary cursors.

## What to build (minimal working version)
- SQLite table with 10,000 posts with timestamps
- `GET /posts?page=1&limit=20` — offset pagination
- `GET /posts?cursor=<token>&limit=20` — cursor pagination
- Measure query time for page 1 vs page 500 with offset
- Measure query time for equivalent position with cursor. Compare.
- Simulate: insert a new post between page 1 and 2 requests. Show the offset duplicate.

## Knobs to turn
- Jump to "page 500" with offset. How long does it take? Compare with cursor.
- Insert a post mid-pagination with offset: is a post skipped or duplicated?
- What happens with cursor if two posts have the exact same timestamp? (Tie-breaking: include ID in cursor)
- Implement bidirectional cursor: next page and previous page.

## How it connects to other components
- `30-api-gateway` — pagination should be enforced at the gateway (max page size)
- `01-lru-cache` — cache the first page (most frequently accessed); cursor pages are harder to cache
- `49-sharding` — cursor pagination across shards is non-trivial (each shard has its own order)

## Real tool / production system
Twitter, Slack, GitHub APIs all use cursor-based pagination. Facebook's Graph API uses `after` cursors. Stripe uses `starting_after` and `ending_before` with object IDs. What you're missing: stable cursors across schema changes, cursor encryption to prevent enumeration attacks, and total count (expensive to compute without offset).
