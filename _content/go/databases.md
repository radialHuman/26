# Working with Databases in Go

Go supports both SQL and NoSQL databases with robust libraries and patterns. This chapter covers connection pooling, transactions, migrations, and ORMs.

---

## SQL Databases
- Use the `database/sql` package for database access.
- Popular drivers: `github.com/lib/pq` (Postgres), `github.com/go-sql-driver/mysql` (MySQL).

```go
import (
    "database/sql"
    _ "github.com/lib/pq"
)
db, err := sql.Open("postgres", "user=foo dbname=bar sslmode=disable")
```

---

## Connection Pooling
- Managed automatically by `database/sql`.
- Tune with `SetMaxOpenConns`, `SetMaxIdleConns`, `SetConnMaxLifetime`.

---

## Transactions
- Use `db.Begin()` and `tx.Commit()`/`tx.Rollback()` for atomic operations.

```go
tx, err := db.Begin()
// ...
err = tx.Commit()
```

---

## Migrations
- Use tools like `golang-migrate/migrate` or `pressly/goose` for schema migrations.

---

## ORMs
- Popular ORMs: `gorm.io/gorm`, `entgo.io/ent`.
- ORMs simplify CRUD but may add overhead; use raw SQL for performance-critical paths.

---

## NoSQL Databases
- Libraries: `go.mongodb.org/mongo-driver` (MongoDB), `github.com/go-redis/redis/v8` (Redis).

---

## Best Practices
- Use context for timeouts and cancellation.
- Handle errors and close connections properly.
- Use migrations for schema changes.
- Benchmark ORMs vs. raw SQL for your use case.

---

Go's database ecosystem is mature and production-ready for both SQL and NoSQL workloads.