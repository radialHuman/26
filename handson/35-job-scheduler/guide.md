# Job Scheduler (Cron-style)

## What it is
A system that executes jobs on a defined schedule — every minute, every hour, every day at 3am. Like cron, but programmable and observable.

## Why it matters
Every system has scheduled work: send daily digest emails, generate reports, clean up expired sessions, recompute recommendations, archive old data. Understanding how schedulers work — tick loops, missed job detection, distributed scheduling — is expected at senior level.

## What to know before starting
- What a cron expression is: `"0 3 * * *"` = 3am every day
- What a tick loop is: a loop that wakes up every second, checks what needs to run
- Python's `datetime`, `timedelta`, and `schedule` concepts

## How to approach it
A scheduler has two parts: a registry of jobs (function + schedule), and a runner loop (checks every second if any job is due, runs it).

The tricky parts: what if a job takes longer than its interval? (Overlapping runs — allow or prevent?). What if the scheduler was down for an hour? (Missed jobs — run once on recovery or skip?). In distributed deployments: who runs the job when there are 5 scheduler instances? (Leader election or distributed lock).

## What to build (minimal working version)
- `Job(func, interval_seconds, name)` dataclass with `last_run` timestamp
- `Scheduler` class: `add_job(job)`, `run_forever()` — tick loop checking every second
- Test: register a job that prints "hello" every 5 seconds; confirm it runs exactly on schedule
- Add a job that takes 7 seconds but runs every 5 seconds — what happens? Implement `skip_if_running` flag
- Implement missed job detection: on scheduler startup, check if any job's `last_run` was > 2× its interval ago

## Knobs to turn
- Run 3 scheduler instances. All three will try to run the same job. Add a distributed lock so only one runs it.
- Add cron expression parsing: parse `"*/5 * * * *"` (every 5 minutes). Use `croniter` library.
- Add job persistence: store `last_run` in a file or Redis so it survives scheduler restart.
- Add max_duration: if a job runs > 30s, kill it and mark as timed out.

## How it connects to other components
- `14-task-queue-worker` — scheduler enqueues jobs; workers execute them (don't run in scheduler process)
- `27-distributed-lock` — prevent multiple scheduler instances from running the same job
- `37-leader-election` — alternative: elect one scheduler as leader, others stand by

## Real tool / production system
Linux cron. Python's `APScheduler`. Celery Beat for distributed scheduling. Airflow for DAG-based workflows. What you're missing: job dependency management (run B after A succeeds), retry on failure, job history and status UI, timezone handling, and DST edge cases.
