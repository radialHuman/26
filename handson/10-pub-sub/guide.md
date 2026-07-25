# Pub/Sub

## What it is
A messaging pattern where publishers send messages to named topics, and subscribers receive copies of all messages on topics they've subscribed to. Unlike a queue (one consumer per message), pub/sub delivers each message to all subscribers of that topic.

## Why it matters
Used for event fan-out: a new tweet notifies follower feeds, activity trackers, ML pipelines, and analytics — all independently. Powers notification systems, real-time feeds, and event-driven architectures. Every large system has some form of pub/sub.

## What to know before starting
- The queue pattern from `09-message-queue` — pub/sub is a generalization
- What a callback function is (function passed as an argument)
- The difference between synchronous (caller waits) and asynchronous (caller returns immediately) delivery

## How to approach it
The core is a dict: `topic → list of subscriber callbacks`. Publishing means iterating the list and calling each callback. The tricky parts are: what if a subscriber is slow (blocks others), what if it crashes (kills the loop), and what if it's offline.

The fix for slow subscribers: give each subscriber their own buffer queue. Publish puts a message in every subscriber's buffer; subscribers drain their own buffers independently.

## What to build (minimal working version)
- `PubSub` class: `subscribe(topic, callback)`, `publish(topic, message)`, `unsubscribe(topic, callback)`
- Test: 3 subscribers on "orders" topic; publish 1 message; all 3 receive it
- Make delivery asynchronous: `publish` returns immediately; use threads to call subscribers
- Give each subscriber their own `deque` buffer; publish puts into buffers; subscribers poll their own buffer

## Knobs to turn
- Make subscriber 2 sleep for 5 seconds. Does it block subscriber 3 from receiving? Fix it.
- Make subscriber 2 raise an exception. Does it stop subscriber 3? Add exception isolation.
- Unsubscribe subscriber 1 after 5 messages. Confirm it stops receiving.
- Add message filtering: subscriber only receives messages where `msg["type"] == "premium"`

## How it connects to other components
- `09-message-queue` — each subscriber's buffer is a queue
- `05-fanout-write-vs-read` — pub/sub is the mechanism; fan-out is the pattern
- `17-websocket-realtime` — in real-time systems, pub/sub delivers to WebSocket connections

## Real tool / production system
Redis Pub/Sub: fast, but no persistence — if subscriber is offline, message is lost. Kafka: messages persist in a log; subscribers (consumer groups) track their own position and can replay. Your implementation misses: persistence, at-least-once delivery, consumer groups, and backpressure.
