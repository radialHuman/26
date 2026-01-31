# Database Migrations

## What are Database Migrations?

**Database migrations** are version-controlled database schema changes:
- **Create Tables**: Initial schema
- **Add Columns**: New fields
- **Modify Columns**: Change types, constraints
- **Create Indexes**: Performance optimization
- **Data Migrations**: Transform existing data

## Why Use Migrations?

Without migrations:
```sql
-- Manual SQL scripts, no tracking
CREATE TABLE users (id INT, name VARCHAR(100));

-- Later... (no record of when/why)
ALTER TABLE users ADD COLUMN email VARCHAR(255);
```

With migrations:
```go
// 20240101_create_users.go
// Tracked, versioned, reproducible
```

## Migration Tools

### 1. golang-migrate

Most popular migration tool.

```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

### Create Migrations

```bash
# Create migration files
migrate create -ext sql -dir db/migrations -seq create_users_table

# Creates:
# db/migrations/000001_create_users_table.up.sql
# db/migrations/000001_create_users_table.down.sql
```

### Up Migration

`db/migrations/000001_create_users_table.up.sql`:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### Down Migration

`db/migrations/000001_create_users_table.down.sql`:
```sql
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS users;
```

### Run Migrations

```bash
# Run all up migrations
migrate -path db/migrations -database "postgresql://user:pass@localhost:5432/mydb?sslmode=disable" up

# Run specific number
migrate -path db/migrations -database "..." up 2

# Rollback
migrate -path db/migrations -database "..." down

# Rollback specific number
migrate -path db/migrations -database "..." down 1

# Check version
migrate -path db/migrations -database "..." version

# Force version (if stuck)
migrate -path db/migrations -database "..." force 1
```

### Programmatic Migrations

```go
package database

import (
    "database/sql"
    "fmt"
    
    "github.com/golang-migrate/migrate/v4"
    "github.com/golang-migrate/migrate/v4/database/postgres"
    _ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigrations(db *sql.DB, migrationsPath string) error {
    driver, err := postgres.WithInstance(db, &postgres.Config{})
    if err != nil {
        return fmt.Errorf("could not create driver: %w", err)
    }
    
    m, err := migrate.NewWithDatabaseInstance(
        "file://"+migrationsPath,
        "postgres",
        driver,
    )
    if err != nil {
        return fmt.Errorf("could not create migrate instance: %w", err)
    }
    
    // Run migrations
    if err := m.Up(); err != nil && err != migrate.ErrNoChange {
        return fmt.Errorf("could not run migrations: %w", err)
    }
    
    return nil
}

// Usage in main.go
func main() {
    db, err := sql.Open("postgres", "postgresql://user:pass@localhost:5432/mydb")
    if err != nil {
        log.Fatal(err)
    }
    
    // Run migrations
    if err := RunMigrations(db, "db/migrations"); err != nil {
        log.Fatal(err)
    }
    
    // Continue with app
}
```

### More Migration Examples

`000002_add_users_phone.up.sql`:
```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
CREATE INDEX idx_users_phone ON users(phone);
```

`000002_add_users_phone.down.sql`:
```sql
DROP INDEX IF EXISTS idx_users_phone;
ALTER TABLE users DROP COLUMN phone;
```

`000003_create_posts_table.up.sql`:
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at);
```

## GORM Auto Migrate

Simple but limited.

```go
package main

import (
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

type User struct {
    ID        uint      `gorm:"primaryKey"`
    Name      string    `gorm:"size:100;not null"`
    Email     string    `gorm:"size:255;uniqueIndex;not null"`
    Password  string    `gorm:"size:255;not null"`
    Status    string    `gorm:"size:20;default:active"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

type Post struct {
    ID          uint `gorm:"primaryKey"`
    UserID      uint `gorm:"not null;index"`
    User        User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
    Title       string
    Content     string
    Status      string `gorm:"default:draft"`
    PublishedAt *time.Time
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

func main() {
    dsn := "host=localhost user=postgres password=secret dbname=mydb"
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        log.Fatal(err)
    }
    
    // Auto migrate
    db.AutoMigrate(&User{}, &Post{})
    
    // Continue...
}
```

**Limitations**:
- ❌ No down migrations
- ❌ Can't drop columns
- ❌ Can't rename columns
- ❌ Limited control
- ✅ Good for development

## Atlas (Declarative Migrations)

Modern migration tool.

```bash
go install ariga.io/atlas@latest
```

### Define Schema

`schema.hcl`:
```hcl
table "users" {
  schema = schema.public
  
  column "id" {
    type = serial
  }
  
  column "name" {
    type = varchar(100)
    null = false
  }
  
  column "email" {
    type = varchar(255)
    null = false
  }
  
  column "password" {
    type = varchar(255)
    null = false
  }
  
  column "status" {
    type    = varchar(20)
    default = "active"
  }
  
  column "created_at" {
    type    = timestamp
    default = sql("CURRENT_TIMESTAMP")
  }
  
  primary_key {
    columns = [column.id]
  }
  
  index "idx_email" {
    unique  = true
    columns = [column.email]
  }
}
```

### Apply Schema

```bash
# Generate migration
atlas schema apply \
  --url "postgres://user:pass@localhost:5432/mydb?sslmode=disable" \
  --to "file://schema.hcl" \
  --dev-url "docker://postgres/15"

# Dry run
atlas schema apply --url "..." --to "file://schema.hcl" --dry-run
```

## Data Migrations

Transform existing data during migration.

```sql
-- Add column with default
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

-- Populate from existing data
UPDATE users SET full_name = CONCAT(first_name, ' ', last_name);

-- Make NOT NULL after population
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

-- Drop old columns
ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;
```

### Complex Data Migration

```sql
-- Create new table
CREATE TABLE user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    bio TEXT,
    avatar_url VARCHAR(255),
    preferences JSONB
);

-- Migrate data
INSERT INTO user_profiles (user_id, bio, avatar_url)
SELECT id, bio, avatar FROM users;

-- Drop old columns from users
ALTER TABLE users DROP COLUMN bio;
ALTER TABLE users DROP COLUMN avatar;
```

## Migration Best Practices

### 1. Always Reversible

```sql
-- UP
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- DOWN
ALTER TABLE users DROP COLUMN phone;
```

### 2. Sequential Naming

```
000001_create_users.sql
000002_add_email_index.sql
000003_create_posts.sql
000004_add_user_phone.sql
```

### 3. Atomic Migrations

```sql
-- BAD: Multiple unrelated changes
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE posts ADD COLUMN views INTEGER DEFAULT 0;
CREATE TABLE comments (...);

-- GOOD: One migration per logical change
-- 000004_add_user_phone.sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- 000005_add_post_views.sql
ALTER TABLE posts ADD COLUMN views INTEGER DEFAULT 0;

-- 000006_create_comments.sql
CREATE TABLE comments (...);
```

### 4. Test Migrations

```go
func TestMigrations(t *testing.T) {
    // Create test database
    db := setupTestDB(t)
    defer db.Close()
    
    // Run migrations
    err := RunMigrations(db, "../../db/migrations")
    if err != nil {
        t.Fatalf("Migrations failed: %v", err)
    }
    
    // Verify schema
    var count int
    db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
    // Table should exist
}
```

### 5. Handle Failures

```go
func RunMigrationsWithRetry(db *sql.DB, path string) error {
    maxRetries := 3
    
    for i := 0; i < maxRetries; i++ {
        err := RunMigrations(db, path)
        if err == nil {
            return nil
        }
        
        if err == migrate.ErrNoChange {
            return nil
        }
        
        log.Printf("Migration failed (attempt %d/%d): %v", i+1, maxRetries, err)
        time.Sleep(2 * time.Second)
    }
    
    return fmt.Errorf("migrations failed after %d retries", maxRetries)
}
```

## Migration Workflow

### Development

```bash
# 1. Create migration
migrate create -ext sql -dir db/migrations -seq add_user_phone

# 2. Write SQL
# Edit 000004_add_user_phone.up.sql and .down.sql

# 3. Test locally
migrate -path db/migrations -database "..." up

# 4. Verify
psql -d mydb -c "\d users"

# 5. Test rollback
migrate -path db/migrations -database "..." down 1

# 6. Test up again
migrate -path db/migrations -database "..." up
```

### Production

```bash
# 1. Backup database
pg_dump mydb > backup_$(date +%Y%m%d).sql

# 2. Run migrations
migrate -path db/migrations -database "..." up

# 3. Verify
migrate -path db/migrations -database "..." version

# 4. Monitor application
# Check logs, metrics

# 5. Rollback if needed
migrate -path db/migrations -database "..." down 1
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Migrations

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install migrate
        run: |
          curl -L https://github.com/golang-migrate/migrate/releases/download/v4.15.2/migrate.linux-amd64.tar.gz | tar xvz
          sudo mv migrate /usr/bin/
      
      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          migrate -path db/migrations -database "$DATABASE_URL" up
```

## Docker Integration

```dockerfile
FROM golang:1.22 AS builder

WORKDIR /app
COPY . .
RUN go build -o main .

# Install migrate
RUN curl -L https://github.com/golang-migrate/migrate/releases/download/v4.15.2/migrate.linux-amd64.tar.gz | tar xvz
RUN mv migrate /usr/bin/

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/main .
COPY --from=builder /usr/bin/migrate /usr/bin/migrate
COPY db/migrations ./db/migrations

CMD ["./main"]
```

`entrypoint.sh`:
```bash
#!/bin/sh

# Run migrations
migrate -path /root/db/migrations -database "$DATABASE_URL" up

# Start application
exec /root/main
```

## Summary

Database migrations provide:
- **Version Control**: Track schema changes
- **Reproducibility**: Same schema everywhere
- **Rollback**: Undo changes safely
- **Automation**: CI/CD integration
- **Team Collaboration**: Consistent database state

Essential for managing database evolution in production.
