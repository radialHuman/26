# Fan-out on Write vs Fan-out on Read

## What it is
When a user posts something, you have two choices: immediately push a copy to every follower's feed (fan-out on write), or store nothing and compute each user's feed at read time by pulling from all accounts they follow (fan-out on read). Most real systems use a hybrid.

## Why it matters
This is one of the top-5 system design topics. It's the core trade-off in designing Twitter, Instagram, or any social feed. The choice determines your write amplification, read latency, and storage cost. Interviewers always ask "how do you handle celebrities with 50M followers?"

## What to know before starting
- What a write-amplification problem is: one write causes many downstream writes
- What a read-amplification problem is: one read requires fetching from many sources
- Basic pub/sub pattern: one producer, many consumers

## How to approach it
**Fan-out on write**: When user A posts, look up all of A's followers, write the post ID into each follower's feed table. Reads are fast (one lookup). Writes are expensive for users with millions of followers.

**Fan-out on read**: Store nothing on write. On read, query all accounts the user follows, merge and sort results. Reads are slow and expensive. Writes are instant.

**Hybrid** (what Twitter actually does): Fan-out on write for regular users. For celebrities (>N followers), skip fan-out. At read time, inject celebrity posts into the feed. This caps write amplification while keeping reads fast for most users.

## What to build (minimal working version)
- In-memory user store, follower lists, and per-user feed lists
- `post(user_id, content)` that fans out to all followers
- Simulate 1 celebrity with 10,000 followers; measure how long `post()` takes
- Implement the hybrid: skip fan-out for users with >1000 followers; inject at read time

## Knobs to turn
- Increase follower count from 100 → 10,000 → 100,000. Plot write latency.
- With hybrid: vary the celebrity threshold. What's the right cutoff?
- Make fan-out async: put each follower write into a queue instead of doing it synchronously
- What happens if a follower joins after the post? Does fan-out on write miss them?

## How it connects to other components
- `09-message-queue` — async fan-out is done via a message queue; one post → N messages
- `10-pub-sub` — pub/sub is the mechanism; fan-out is the pattern
- `01-lru-cache` — celebrity posts are cached separately; one cache entry serves millions

## Real tool / production system
Twitter uses a hybrid approach with a feed cache (Redis sorted sets) per user. Instagram pre-computes feeds for most users. Facebook uses a similar hybrid. What you're missing: feed ranking (chronological vs. algorithmic), handling unfollows, and feed pagination.
