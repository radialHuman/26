# Message Queue

## What it is
A buffer between a producer (something that creates work) and a consumer (something that does the work). The producer enqueues messages; the consumer dequeues and processes them independently and asynchronously.

## Why it matters
Decouples services: the producer doesn't need to wait for the consumer, doesn't need to know if the consumer is slow or down. Used in Twitter for tweet processing, Instagram for image resizing, Uber for ride matching. Interviewers look for this whenever you say "async processing."

## What to know before starting
- What FIFO (first-in, first-out) means
- Python's `collections.deque` — O(1) append and popleft
- What a thread is and why concurrent access to shared data causes race conditions
- What `threading.Lock` does

## How to approach it
Start with a simple FIFO queue. Add a producer thread that enqueues messages on a timer. Add a consumer thread that dequeues and processes. Immediately you'll hit race conditions — both threads touching the same queue.

Then add: acknowledgment (don't remove message until consumer confirms success), dead-letter queue (messages that fail N times go to a separate queue), priority (high-priority messages jump the line).

## What to build (minimal working version)
- `MessageQueue` class with `enqueue(msg)`, `dequeue()` using `deque`
- `Producer` thread: enqueues a message every 0.5 seconds
- `Consumer` thread: dequeues, prints, sleeps 1 second (slower than producer)
- Add `threading.Lock` — observe what breaks without it first
- Add message IDs; implement `ack(msg_id)` to mark processed

## Knobs to turn
- Make consumer sleep 2 seconds. Watch the queue depth grow. This is backpressure building up.
- Remove the lock. Run 2 producers simultaneously. Can you cause a corruption?
- Implement dead-letter: if processing fails (random 20%), retry up to 3 times, then DLQ
- Add priority: `enqueue(msg, priority=HIGH/LOW)`. Use a heap instead of deque.

## How it connects to other components
- `10-pub-sub` — pub/sub is one-to-many; a queue is one-to-one (one consumer gets each message)
- `22-backpressure` — queue depth is the signal; backpressure is the response
- `14-task-queue-worker` — task queue is a higher-level pattern built on a message queue
- `21-outbox-pattern` — outbox uses a persistent queue to guarantee delivery

## Real tool / production system
RabbitMQ: durable queues, ack/nack, dead-letter exchange, routing keys. Kafka: partitioned log, ordered per partition, consumers track their own offset. Your implementation is missing: persistence (messages lost on crash), distributed consumers, ordering guarantees, and at-least-once delivery semantics.
