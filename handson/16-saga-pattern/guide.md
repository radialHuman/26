# Saga Pattern

## What it is
A way to handle distributed transactions across multiple services without a central coordinator. A saga is a sequence of local transactions, each in a different service, with compensating transactions that undo previous steps if something fails.

## Why it matters
Distributed transactions (2PC) are fragile and slow. Sagas are the industry-standard alternative for microservices. Comes up in any system with multi-service workflows: e-commerce checkout (reserve inventory → charge payment → ship order), booking systems (reserve hotel → reserve flight → confirm).

## What to know before starting
- Why you can't use a single DB transaction across two different services
- What a compensating transaction is: the undo of a step (cancel reservation, refund payment)
- The message queue pattern from `09-message-queue`

## How to approach it
Two styles:

**Choreography**: Each service publishes an event when its local transaction completes. Other services listen and react. No central coordinator. Hard to trace the overall flow.

**Orchestration**: A central orchestrator service tells each service what to do and handles failures. Easier to trace. Central point of failure.

For each step, define: the action and its compensation. If step 3 fails, run compensation for steps 2 and 1 in reverse order.

## What to build (minimal working version)
- Three fake services: `InventoryService`, `PaymentService`, `ShipmentService`
- Orchestrator: calls each in sequence; on any failure, calls compensations in reverse
- `reserve_inventory()` + compensation `release_inventory()`
- `charge_payment()` + compensation `refund_payment()`
- Test: payment fails → inventory is released → order is cancelled

## Knobs to turn
- Make `refund_payment()` also fail. What happens? (Compensation failure — the hard problem)
- Switch to choreography: each service publishes events; others subscribe. Remove the orchestrator.
- Make each step idempotent: if re-executed after failure, it doesn't double-process.
- Add a timeout: if a service doesn't respond in 5 seconds, trigger compensation.

## How it connects to other components
- `09-message-queue` — choreography-style sagas communicate through events
- `13-idempotency` — saga steps must be idempotent since they may be re-executed
- `21-outbox-pattern` — reliable event publishing for saga steps uses the outbox
- `51-two-phase-commit` — saga is the alternative to 2PC; build both to understand why saga wins

## Real tool / production system
AWS Step Functions implements orchestration-style sagas. Temporal.io (open source) is a popular saga orchestrator. Netflix Conductor. What you're missing: saga state persistence (survive coordinator crash), timeout handling, partial failure visibility, and distributed tracing across saga steps.
