# Backpressure

## What it is
A mechanism for a slow consumer to signal upstream producers to slow down or stop sending data. Without it, a fast producer overwhelms a slow consumer, causing queue buildup, memory exhaustion, or dropped messages.

## Why it matters
Comes up whenever you design an async pipeline, streaming system, or message queue. The naive design is "fast producer, slow consumer → queue grows unbounded → OOM crash." Backpressure is the solution. Interviewers test this when asking about queue depth, consumer lag, and system stability under load.

## What to know before starting
- The producer-consumer problem
- Python's `queue.Queue(maxsize=N)` — blocks producers when full
- What consumer lag means: the queue depth is growing because the consumer can't keep up

## How to approach it
There are three responses to backpressure:
1. **Block**: producer waits until consumer catches up (Python's full queue blocks on `put()`)
2. **Drop**: producer drops new messages when queue is full (lossy but bounded)
3. **Signal**: producer is notified to slow down (TCP uses this natively via window size)

The tricky part: backpressure propagates upstream. If service C is slow, it should slow down service B, which should slow down service A. This is called backpressure propagation.

## What to build (minimal working version)
- Producer that generates 1000 messages as fast as possible
- Consumer that processes 1 message per second (deliberately slow)
- Bounded queue with maxsize=10: observe producer blocking
- Switch to unbounded queue: observe queue growing to 1000
- Implement drop with metrics: count dropped messages, log when queue is 80% full
- Add backpressure signal: producer checks queue depth before sending; if >80% full, sleeps

## Knobs to turn
- Set maxsize=1. See maximum backpressure — producer and consumer are perfectly coupled.
- Remove all backpressure. Run for 60 seconds. What is peak memory usage?
- Add multiple consumers. Does backpressure ease? By how much?
- Implement adaptive producer: if queue depth > 50%, halve production rate; if < 10%, double it.

## How it connects to other components
- `09-message-queue` — queue depth is the backpressure signal
- `12-health-check` — a readiness probe can return 503 when under backpressure to stop load balancer routing
- `03-rate-limiter` — rate limiting is a form of backpressure at the API boundary
- `22-backpressure` is the concept that links `14-task-queue-worker` → `09-message-queue` → `22-backpressure`

## Real tool / production system
Kafka consumer lag (measured by `__consumer_offsets`) is the signal. KEDA scales Kubernetes pods based on Kafka lag. TCP flow control is backpressure at the network level. Reactive Streams (RxJava, Project Reactor) formalizes backpressure as a first-class concept. What you're missing: cross-service backpressure propagation, adaptive throttling, and lag alerting.
