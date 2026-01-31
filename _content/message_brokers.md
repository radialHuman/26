# Message Brokers & Streaming

Message brokers and streaming platforms are essential for decoupling services and processing large volumes of data. This chapter covers Kafka, RabbitMQ, delivery semantics, partitioning, and consumer groups.

---

## RabbitMQ
- Message broker using exchanges and queues.
- Routing types: direct, topic, fanout, headers.
- Best for work queues, request/reply patterns.

---

## Kafka
- Distributed commit log optimized for throughput.
- Concepts: topic, partition, offset, consumer group.
- Use cases: event streaming, log aggregation, stream processing.

---

## Delivery Semantics
- **At-most-once:** Messages may be lost, but not duplicated.
- **At-least-once:** Messages are retried; consumers must handle duplicates.
- **Exactly-once:** Hard to achieve; requires idempotency or transactional guarantees (Kafka transactions + idempotent producers).

---

## Partitioning
- Partition keys determine message distribution and ordering.
- Design partition keys to balance load and maintain ordering where needed.

---

## Consumer Groups
- Multiple consumers in a group share partitions for parallel processing.
- Consumer rebalances on membership changes — handle rebalancing gracefully.

---

## Best Practices
- Use idempotency keys to handle duplicate deliveries.
- Monitor lag (Kafka consumer lag) to detect slow consumers.
- Use compacted topics for changelog/state patterns.

---

Message brokers enable scalable, resilient architectures; choose the right tool and delivery semantics for your use case.