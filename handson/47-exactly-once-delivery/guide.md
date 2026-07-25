# Exactly-Once Delivery

## What it is
The guarantee that a message is processed exactly once — not zero times (lost) and not more than once (duplicate). In distributed systems, exactly-once delivery is theoretically impossible to guarantee at the network layer. The practical solution is at-least-once delivery + idempotent consumers.

## Why it matters
This is a senior-level conceptual question. Interviewers ask "can you guarantee exactly-once delivery?" The correct answer is "no, not at the network layer — here's why, and here's how we achieve it in practice." Confusing "exactly-once semantics" with "exactly-once delivery" is a common mistake.

## What to know before starting
- The Two Generals' Problem: two generals coordinating an attack by messenger; no matter how many confirmations they exchange, they can never be certain both will attack simultaneously — applies to distributed systems
- At-least-once: the sender retries until it gets an acknowledgment; the message may be processed multiple times
- At-most-once: fire and forget; message may be lost but never duplicated
- The idempotency pattern from `13-idempotency`

## How to approach it
Why it's impossible: for the sender to know the message was processed exactly once, it needs an acknowledgment. But the acknowledgment can be lost. So the sender retries. Now the message was processed twice. To prevent double-processing, the receiver needs to remember it already processed this message. But that memory can be lost too. This is the fundamental problem.

The practical solution: at-least-once delivery (always retry) + idempotent processing (detect and skip duplicates using a message ID).

"Exactly-once semantics" in Kafka means: the producer doesn't duplicate, and the consumer's offset commit and processing are atomic. This is a specific implementation, not a general solution.

## What to build (minimal working version)
- Implement at-most-once: send message, don't retry, receiver processes immediately. Simulate 30% message loss.
- Implement at-least-once: send with ack, retry until ack received. Simulate ack loss. Count duplicate processing.
- Add idempotency layer: receiver maintains `processed_ids` set; skip if ID seen before
- Combine: at-least-once + idempotency = exactly-once semantics. Test: no losses, no duplicates.

## Knobs to turn
- Expire the `processed_ids` after 1 hour. What messages can now be duplicated?
- Simulate the scenario where processing succeeds but the ack is lost. Without idempotency, what happens?
- Make the idempotency store crash between processing and storing the ID. What's the window for duplicates?
- Implement Kafka-style: processing and offset commit in the same transaction (using SQLite).

## How it connects to other components
- `13-idempotency` — the consumer-side mechanism that makes at-least-once safe
- `09-message-queue` — at-least-once is the default delivery guarantee of most queues
- `21-outbox-pattern` — outbox gives at-least-once delivery; consumers handle deduplication

## Real tool / production system
Kafka's exactly-once semantics (EOS): idempotent producer + transactional API. AWS SQS message deduplication IDs (FIFO queues). Google Pub/Sub at-least-once with ack IDs. What you're missing: the distributed transaction that atomically commits processing state + offset (Kafka transactions do this), and the performance cost of EOS vs at-least-once.
