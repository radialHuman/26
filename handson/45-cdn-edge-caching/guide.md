# CDN + Edge Caching

## What it is
A Content Delivery Network (CDN) is a geographically distributed network of cache servers (edge nodes) that serve content from locations physically close to users. Edge caching stores responses at these nodes so requests never reach the origin server.

## Why it matters
Netflix serving video, Instagram serving images, Twitter serving JS bundles — all use CDNs. Without one, every global user's request hits your origin server (slow, expensive). With one, a user in Tokyo gets content from a Tokyo edge node. Interviewers expect you to mention CDN for any static content or high-read-volume system.

## What to know before starting
- HTTP `Cache-Control` header: instructs caches on how long to store a response
- `ETag` and `If-None-Match`: conditional requests — "give me this file only if it changed"
- The difference between public caches (CDN, shared) and private caches (browser, one user)

## How to approach it
CDN edge nodes work like a shared LRU cache. On first request: cache miss → edge fetches from origin, caches response, serves to user. On subsequent requests from any user: cache hit → served from edge.

Key controls:
- `Cache-Control: public, max-age=31536000` — cache for 1 year (for versioned static files)
- `Cache-Control: no-cache` — always revalidate with origin before serving
- `Cache-Control: private` — browser only, not CDN
- Cache busting: when you update a file, change its URL (`app.v2.js` instead of `app.js`)

## What to build (minimal working version)
- FastAPI server serving static files with `Cache-Control` headers
- Simulate an edge cache: a Python dict storing `url → (response, cached_at, max_age)`
- `get(url)`: check cache; if valid hit, return; if stale, revalidate with `If-None-Match`; if miss, fetch and cache
- Implement ETags: hash the content; if `If-None-Match` matches, return 304 Not Modified
- Test: first request fetches from origin (slow 200ms). Second request: instant from cache.

## Knobs to turn
- Set max-age=5. After 6 seconds, confirm the next request revalidates.
- Serve a file without Cache-Control. Confirm your cache never stores it.
- Implement cache invalidation: origin can purge a URL from the edge cache (CDN purge API)
- Vary header: `Vary: Accept-Language` — cache separate versions for different languages. How does cache size change?

## How it connects to other components
- `15-cache-invalidation` — CDN invalidation is the same problem at the network edge layer
- `01-lru-cache` — edge nodes use LRU to evict cold content
- `05-fanout-write-vs-read` — CDN caching celebrity profile images reduces origin load

## Real tool / production system
Cloudflare, AWS CloudFront, Fastly, Akamai. Nginx can act as a reverse proxy cache (`proxy_cache`). What you're missing: cache warming (pre-populating edge before traffic hits), stale-while-revalidate (serve stale content while fetching fresh in background), and cache shielding (one "shield" edge node fetches from origin; other edge nodes fetch from shield).
