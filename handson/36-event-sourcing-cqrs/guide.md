# Event Sourcing + CQRS

## What it is
**Event sourcing**: instead of storing current state, store the sequence of events that led to it. Current state is derived by replaying events. **CQRS** (Command Query Responsibility Segregation): separate the write model (commands that produce events) from the read model (projections optimized for queries).

## Why it matters
Used in banking (every transaction is an event), audit systems, collaboration tools (Google Docs — every keystroke is an event that can be replayed). Provides free audit log, time-travel debugging, and the ability to build new read models by replaying history. Senior interviews ask about this for any system needing audit trails or complex read requirements.

## What to know before starting
- The WAL pattern from `28-write-ahead-log` — event sourcing is WAL as an application pattern
- What an aggregate is in DDD terms: a cluster of objects treated as one unit (e.g., a bank Account)
- Why current-state storage loses information (you know balance is $500 but not the 20 transactions that got there)

## How to approach it
An event store is an append-only log. Each event: `{aggregate_id, event_type, payload, timestamp, sequence_number}`. To get current state: load all events for an aggregate, replay them in sequence.

A projection is a read model built by processing the event stream. Example: `AccountBalanceProjection` listens to `MoneyDeposited` and `MoneyWithdrawn` events and maintains a current balance table — optimized for the "what is the balance?" query.

## What to build (minimal working version)
- `EventStore`: append events, load events for an aggregate_id
- `BankAccount` aggregate: `deposit(amount)` and `withdraw(amount)` produce events instead of mutating state
- Replay: reconstruct account balance by replaying `MoneyDeposited` and `MoneyWithdrawn` events
- `BalanceProjection`: process events asynchronously and maintain a balance cache
- Test: deposit $100 twice, withdraw $30. Replay from scratch. Confirm balance is $170.

## Knobs to turn
- Corrupt the events table at event #5. Can you detect where state diverges?
- Add snapshots: after 100 events, store current state. Replay only loads snapshot + events after it.
- Build a second projection from the same events: `TransactionHistoryProjection` for a statement view.
- Delete all projections; rebuild them by replaying the full event stream. This is the power.

## How it connects to other components
- `28-write-ahead-log` — event sourcing IS a WAL at the application layer
- `10-pub-sub` — new events are published to a stream; projections subscribe and update read models
- `09-message-queue` — events fan out to multiple projections via a queue

## Real tool / production system
EventStoreDB (purpose-built). Axon Framework (Java). Using Kafka as the event store. What you're missing: snapshot strategies, event versioning (what happens when event schema changes), event compaction, and eventual consistency between write and read models.
