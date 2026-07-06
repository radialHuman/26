## The Full Category — Task Queues, Workflow Engines, Job Schedulers

Three subcategories. Different levels of the same problem.

---

### Level 1 — Raw Queues (just holds messages)

| Tool | Made by | Language agnostic |
|---|---|---|
| SQS | AWS | Yes |
| RabbitMQ | Pivotal / VMware | Yes |
| Redis (as queue) | Salvatore Sanfilippo | Yes |
| Kafka | LinkedIn → Apache | Yes |
| Google Pub/Sub | Google | Yes |
| Azure Service Bus | Microsoft | Yes |

Just pipes. You build the worker yourself.

---

### Level 2 — Task Queues (runs the work for you)

| Tool | Made by | Language |
|---|---|---|
| Celery | Open source | Python |
| RQ (Redis Queue) | Open source | Python |
| Dramatiq | Open source | Python |
| Huey | Open source | Python |
| Sidekiq | Open source | Ruby |
| Bull / BullMQ | Open source | Node.js |
| Faktory | Open source | Language agnostic |
| Quirrel | Open source | Node.js |

These wrap a queue and give you a task execution framework. Pick the one that matches your language.

---

### Level 3 — Workflow Engines (multi step, stateful, durable)

| Tool | Made by | Language |
|---|---|---|
| Temporal | Ex-Uber engineers | Any |
| Cadence | Uber | Any |
| Apache Airflow | Airbnb → Apache | Python |
| Prefect | Prefect Technologies | Python |
| Dagster | Dagster Labs | Python |
| Conductor | Netflix → open source | Any |
| Zeebe / Camunda | Camunda | Any |
| Step Functions | AWS | Any |
| Windmill | Open source | Any |

---

### Level 4 — Schedulers (run things on a timer)

| Tool | Made by | Notes |
|---|---|---|
| Cron | Unix, 1975 | The original, runs on one machine |
| APScheduler | Open source | Python in-process scheduler |
| Celery Beat | Celery project | Cron-like scheduler for Celery |
| Sidekiq-Cron | Open source | Ruby |
| EventBridge Scheduler | AWS | Managed cron at cloud scale |
| Cloud Scheduler | Google | Managed cron |
| Kubernetes CronJob | CNCF | Cron inside k8s |

---

### How They Stack

```
Scheduler          →  triggers work on a timer
        ↓
Queue              →  holds the job message
        ↓
Task Queue         →  picks it up, runs it, retries
        ↓
Workflow Engine    →  orchestrates multi step jobs,
                      survives crashes, tracks state
```

Most real systems use multiple levels together:

```
Airflow schedules a pipeline      ← scheduler
  → triggers Celery tasks         ← task queue
    → tasks publish to SQS        ← raw queue
      → workers consume           ← your code
```

---

### Simple Decision Tree

```
Do you need steps that depend on each other
and must survive crashes?
  → Temporal / Airflow / Step Functions

Do you just need background tasks with retries?
  → Celery / Sidekiq / BullMQ

Do you need language agnostic message passing?
  → SQS / RabbitMQ / Kafka

Do you need to run something on a schedule?
  → Cron / Celery Beat / EventBridge Scheduler

Do you need to process millions of events in real time?
  → Kafka / Kinesis
```