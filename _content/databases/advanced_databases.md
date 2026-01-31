# Advanced Database Topics

This chapter covers sharding, partitioning, replication, backup/restore, online migrations, and schema evolution for large-scale systems.

---

## Replication
- Replicate data for read scalability and high availability.
- Master-slave vs multi-master replication.

---

## Partitioning & Sharding
- Partition data by key ranges or hash to distribute load.
- Sharding splits data across multiple database instances.

---

## Backup and Restore
- Regular backups, point-in-time recovery (PITR), and restore testing.
- Use logical (dump) and physical backups.

---

## Online Migrations
- Techniques: rolling schema changes, feature flags, expand-then-contract pattern.
- Use zero-downtime migration strategies where possible.

---

## Schema Evolution
- Backward/forward compatible changes: add nullable columns, avoid dropping columns.
- Manage migrations with tools (Flyway, Liquibase, golang-migrate, Alembic).

---

## Best Practices
- Test migrations in staging with production-like data.
- Monitor replication lag and recovery metrics.

---

Advanced data strategies ensure your system scales without sacrificing availability.