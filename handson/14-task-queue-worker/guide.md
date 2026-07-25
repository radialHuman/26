# Task Queue + Background Worker

## What it is
A pattern where incoming requests enqueue a job (send email, resize image, process payment) instead of doing the work synchronously. A separate worker process pulls jobs from the queue and executes them.

## Why it matters
Some operations are too slow for a request/response cycle (video encoding, email sending, ML inference). Doing them synchronously blocks the user and ties up a web server thread. Task queues decouple "accepting work" from "doing work," letting you scale each independently.

## What to know before starting
- The message queue pattern from `09-message-queue`
- What a worker process is: a separate running program that consumes from a queue
- Python's `multiprocessing` or `subprocess` basics

## How to approach it
A task queue has three parts: a broker (the queue storage), a producer (web app that enqueues jobs), and a worker (process that dequeues and runs jobs).

A job is a serializable unit of work: function name + arguments. The worker deserializes and calls the function. Failed jobs go to a dead-letter queue or get retried with backoff.

The key insight: the web server returns 202 Accepted immediately. The job ID lets the client poll for status.

## What to build (minimal working version)
- Broker: Redis list (LPUSH to enqueue, BRPOP to dequeue with blocking wait)
- Producer: FastAPI `POST /jobs` that serializes `{"func": "send_email", "args": {...}}` and pushes to Redis
- Worker: a script that loops forever, BRPOPs jobs, deserializes, calls the function
- Return a job ID on enqueue; `GET /jobs/{id}` returns current status (pending/running/done/failed)

## Knobs to turn
- Enqueue 100 jobs. Run 1 worker. Time completion. Run 5 workers. Compare throughput.
- Make a job fail randomly. Implement retry with max_attempts before marking failed.
- Add job priority: two Redis lists (high/low); workers check high-priority first.
- Add job timeout: if a worker takes >30s on a job, mark it as failed and re-enqueue.

## How it connects to other components
- `09-message-queue` — Redis list is the underlying queue
- `04-retry-and-backoff` — failed jobs retry with backoff
- `35-job-scheduler` — scheduler enqueues jobs on a timer; worker executes them
- `13-idempotency` — jobs should be idempotent in case of requeue after failure

## Real tool / production system
Celery (Python): Redis or RabbitMQ as broker, workers as separate processes, flower UI for monitoring. RQ (Redis Queue): simpler Celery alternative. What you're missing: task result storage, task cancellation, worker heartbeats, and priority queues with fair scheduling.
