# Back-of-Envelope Estimation

## What it is
Fast, approximate math done before designing a system to understand its scale. You're estimating requests per second, storage per day, bandwidth, and cache size — not computing exact numbers, but getting the right order of magnitude.

## Why it matters
Every FAANG system design interview starts with this. If you skip it, interviewers assume you don't think about scale. If you do it well, it guides every design decision: whether you need a cache, how many DB replicas, whether sharding is required, how much bandwidth your CDN must handle.

## What to know before starting
- Powers of 10: 1K, 1M, 1B, 1T and what they mean in context
- Common conversions: 1 day = 86,400 seconds (~10^5), 1 month = 2.5M seconds
- Rough data sizes: tweet = 280 bytes, user profile = 1KB, photo = 300KB, video = 50MB/min
- Latency numbers: L1 cache = 1ns, RAM = 100ns, SSD = 100μs, network = 1ms, disk = 10ms

## How to approach it
The formula is always: `(users) × (actions per user per day) ÷ (86,400 seconds) = QPS`

Then: `QPS × (size per request) = bandwidth`

Then: `QPS × (size per record) × (retention days) = storage`

Write these three lines for every system before anything else. Round aggressively. 86,400 → 10^5. 300M users, 10% active = 30M DAU.

## What to build (minimal working version)
Work through these 4 systems on paper, then in a Python script that prints all estimates:

1. **Twitter**: 300M users, 50M tweets/day, 100:1 read/write. Estimate: write QPS, read QPS, storage per year, bandwidth.
2. **Uber**: 10M rides/day, driver sends location every 4 seconds. Estimate: location updates/sec, storage, WebSocket connections.
3. **WhatsApp**: 2B users, 100B messages/day, avg message = 100 bytes. Estimate: message QPS, storage, fanout load.
4. **URL Shortener** (TinyURL): 100M URLs created/day, 10B redirects/day. Estimate: write QPS, read QPS, storage for 5 years.

## Knobs to turn
- Double the DAU. How does that change storage and bandwidth?
- Change read:write ratio from 100:1 to 10:1. Which component is now the bottleneck?
- For Uber: what if drivers update location every 1 second instead of 4? What breaks?
- For WhatsApp: if messages are end-to-end encrypted, what can you cache?

## How it connects to other components
This isn't a component — it's a skill that tells you WHEN to use every other component. High QPS → need a cache. High write volume → need a queue. Large storage → need sharding. 

## Real tool / production system
There's no tool. The goal is to do this in your head in 5 minutes. Practice until the formulas are automatic. Alex Xu's "System Design Interview" has worked examples for every common system. Compare your estimates to his.
