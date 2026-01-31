# Database Operations with database/sql

## What is database/sql?

The `database/sql` package provides a generic interface for SQL databases in Go. It works with database drivers to execute queries, manage connections, and handle transactions.

## Why is database/sql Important?

- **Standard Interface**: Works with any SQL database (PostgreSQL, MySQL, SQLite, etc.)
- **Connection Pooling**: Built-in connection management
- **Type Safety**: Compile-time checks for query preparation
- **Transaction Support**: ACID compliance
- **Production Ready**: Battle-tested, robust
- **Concurrent Safe**: Multiple goroutines can use the same DB instance

## Database Drivers

The `database/sql` package requires a driver for the specific database.

### Popular Drivers

```go
import (
    "database/sql"
    
    // PostgreSQL
    _ "github.com/lib/pq"
    // or
    _ "github.com/jackc/pgx/v5/stdlib"
    
    // MySQL
    _ "github.com/go-sql-driver/mysql"
    
    // SQLite
    _ "github.com/mattn/go-sqlite3"
    // or
    _ "modernc.org/sqlite"
    
    // SQL Server
    _ "github.com/denisenkom/go-mssqldb"
)
```

## Connecting to Database

### Basic Connection

```go
package main

import (
    "database/sql"
    "fmt"
    "log"
    
    _ "github.com/lib/pq"
)

func main() {
    // Connection string format varies by database
    // PostgreSQL: "postgres://user:password@localhost/dbname?sslmode=disable"
    // MySQL: "user:password@tcp(localhost:3306)/dbname"
    // SQLite: "file:test.db?cache=shared&mode=rwc"
    
    connStr := "postgres://user:password@localhost/mydb?sslmode=disable"
    
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()
    
    // Verify connection
    if err := db.Ping(); err != nil {
        log.Fatal(err)
    }
    
    fmt.Println("Connected to database!")
}
```

### Connection Pool Configuration

```go
package main

import (
    "database/sql"
    "time"
)

func configureDB(connStr string) (*sql.DB, error) {
    db, err := sql.Open("postgres", connStr)
    if err != nil {
        return nil, err
    }
    
    // Maximum number of open connections
    db.SetMaxOpenConns(25)
    
    // Maximum number of idle connections
    db.SetMaxIdleConns(5)
    
    // Maximum lifetime of a connection
    db.SetConnMaxLifetime(5 * time.Minute)
    
    // Maximum idle time for a connection
    db.SetConnMaxIdleTime(10 * time.Minute)
    
    // Verify connection
    if err := db.Ping(); err != nil {
        return nil, err
    }
    
    return db, nil
}
```

## Executing Queries

### Query (SELECT returning multiple rows)

```go
package main

import (
    "database/sql"
    "fmt"
    "log"
)

type User struct {
    ID    int
    Name  string
    Email string
    Age   int
}

func getAllUsers(db *sql.DB) ([]User, error) {
    query := "SELECT id, name, email, age FROM users"
    
    rows, err := db.Query(query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var users []User
    
    for rows.Next() {
        var user User
        err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Age)
        if err != nil {
            return nil, err
        }
        users = append(users, user)
    }
    
    // Check for errors during iteration
    if err := rows.Err(); err != nil {
        return nil, err
    }
    
    return users, nil
}

// With parameters (prevents SQL injection)
func getUsersByAge(db *sql.DB, minAge int) ([]User, error) {
    query := "SELECT id, name, email, age FROM users WHERE age >= $1"
    
    rows, err := db.Query(query, minAge)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var users []User
    for rows.Next() {
        var user User
        if err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Age); err != nil {
            return nil, err
        }
        users = append(users, user)
    }
    
    return users, rows.Err()
}
```

### QueryRow (SELECT returning single row)

```go
package main

import (
    "database/sql"
    "errors"
)

func getUserByID(db *sql.DB, id int) (*User, error) {
    query := "SELECT id, name, email, age FROM users WHERE id = $1"
    
    var user User
    err := db.QueryRow(query, id).Scan(&user.ID, &user.Name, &user.Email, &user.Age)
    
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, errors.New("user not found")
        }
        return nil, err
    }
    
    return &user, nil
}

func getUserEmail(db *sql.DB, id int) (string, error) {
    query := "SELECT email FROM users WHERE id = $1"
    
    var email string
    err := db.QueryRow(query, id).Scan(&email)
    if err != nil {
        return "", err
    }
    
    return email, nil
}
```

### Exec (INSERT, UPDATE, DELETE)

```go
package main

import (
    "database/sql"
    "fmt"
)

// INSERT
func createUser(db *sql.DB, name, email string, age int) (int64, error) {
    query := `
        INSERT INTO users (name, email, age)
        VALUES ($1, $2, $3)
        RETURNING id
    `
    
    var id int64
    err := db.QueryRow(query, name, email, age).Scan(&id)
    if err != nil {
        return 0, err
    }
    
    return id, nil
}

// Alternative without RETURNING
func createUserAlt(db *sql.DB, name, email string, age int) (int64, error) {
    query := "INSERT INTO users (name, email, age) VALUES ($1, $2, $3)"
    
    result, err := db.Exec(query, name, email, age)
    if err != nil {
        return 0, err
    }
    
    // Get last inserted ID (not supported by all databases)
    id, err := result.LastInsertId()
    if err != nil {
        return 0, err
    }
    
    return id, nil
}

// UPDATE
func updateUser(db *sql.DB, id int, name, email string) error {
    query := "UPDATE users SET name = $1, email = $2 WHERE id = $3"
    
    result, err := db.Exec(query, name, email, id)
    if err != nil {
        return err
    }
    
    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return err
    }
    
    if rowsAffected == 0 {
        return errors.New("user not found")
    }
    
    return nil
}

// DELETE
func deleteUser(db *sql.DB, id int) error {
    query := "DELETE FROM users WHERE id = $1"
    
    result, err := db.Exec(query, id)
    if err != nil {
        return err
    }
    
    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return err
    }
    
    if rowsAffected == 0 {
        return errors.New("user not found")
    }
    
    return nil
}
```

## Prepared Statements

Prepared statements improve performance when executing the same query multiple times.

```go
package main

import (
    "database/sql"
)

func insertManyUsers(db *sql.DB, users []User) error {
    // Prepare statement
    stmt, err := db.Prepare("INSERT INTO users (name, email, age) VALUES ($1, $2, $3)")
    if err != nil {
        return err
    }
    defer stmt.Close()
    
    // Execute multiple times
    for _, user := range users {
        _, err := stmt.Exec(user.Name, user.Email, user.Age)
        if err != nil {
            return err
        }
    }
    
    return nil
}

func getUsersWithPrepared(db *sql.DB, ids []int) ([]User, error) {
    stmt, err := db.Prepare("SELECT id, name, email, age FROM users WHERE id = $1")
    if err != nil {
        return nil, err
    }
    defer stmt.Close()
    
    var users []User
    for _, id := range ids {
        var user User
        err := stmt.QueryRow(id).Scan(&user.ID, &user.Name, &user.Email, &user.Age)
        if err != nil && !errors.Is(err, sql.ErrNoRows) {
            return nil, err
        }
        if err == nil {
            users = append(users, user)
        }
    }
    
    return users, nil
}
```

## Transactions

Transactions ensure ACID properties for multiple database operations.

```go
package main

import (
    "context"
    "database/sql"
    "errors"
)

func transferMoney(db *sql.DB, fromID, toID int, amount float64) error {
    // Start transaction
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    
    // Defer rollback (no-op if committed)
    defer tx.Rollback()
    
    // Deduct from sender
    _, err = tx.Exec("UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, fromID)
    if err != nil {
        return err
    }
    
    // Add to receiver
    _, err = tx.Exec("UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, toID)
    if err != nil {
        return err
    }
    
    // Commit transaction
    if err := tx.Commit(); err != nil {
        return err
    }
    
    return nil
}

// Transaction with context
func transferMoneyWithContext(ctx context.Context, db *sql.DB, fromID, toID int, amount float64) error {
    tx, err := db.BeginTx(ctx, &sql.TxOptions{
        Isolation: sql.LevelSerializable,
        ReadOnly:  false,
    })
    if err != nil {
        return err
    }
    defer tx.Rollback()
    
    // Check sender balance
    var balance float64
    err = tx.QueryRowContext(ctx, "SELECT balance FROM accounts WHERE id = $1", fromID).Scan(&balance)
    if err != nil {
        return err
    }
    
    if balance < amount {
        return errors.New("insufficient funds")
    }
    
    // Perform transfer
    _, err = tx.ExecContext(ctx, "UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, fromID)
    if err != nil {
        return err
    }
    
    _, err = tx.ExecContext(ctx, "UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, toID)
    if err != nil {
        return err
    }
    
    return tx.Commit()
}

// Transaction helper function
func withTransaction(db *sql.DB, fn func(*sql.Tx) error) error {
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    
    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p)
        } else if err != nil {
            tx.Rollback()
        }
    }()
    
    err = fn(tx)
    if err != nil {
        return err
    }
    
    return tx.Commit()
}

// Usage
func createUserWithProfile(db *sql.DB, user User, profile Profile) error {
    return withTransaction(db, func(tx *sql.Tx) error {
        // Insert user
        var userID int
        err := tx.QueryRow(
            "INSERT INTO users (name, email, age) VALUES ($1, $2, $3) RETURNING id",
            user.Name, user.Email, user.Age,
        ).Scan(&userID)
        if err != nil {
            return err
        }
        
        // Insert profile
        _, err = tx.Exec(
            "INSERT INTO profiles (user_id, bio, avatar) VALUES ($1, $2, $3)",
            userID, profile.Bio, profile.Avatar,
        )
        return err
    })
}

type Profile struct {
    Bio    string
    Avatar string
}
```

## NULL Values

Handling NULL values from database.

```go
package main

import (
    "database/sql"
)

type User struct {
    ID      int
    Name    string
    Email   sql.NullString  // Can be NULL
    Age     sql.NullInt64   // Can be NULL
    Active  sql.NullBool    // Can be NULL
}

func getUserWithNulls(db *sql.DB, id int) (*User, error) {
    query := "SELECT id, name, email, age, active FROM users WHERE id = $1"
    
    var user User
    err := db.QueryRow(query, id).Scan(
        &user.ID,
        &user.Name,
        &user.Email,
        &user.Age,
        &user.Active,
    )
    
    if err != nil {
        return nil, err
    }
    
    return &user, nil
}

// Converting to regular types
func (u *User) GetEmail() string {
    if u.Email.Valid {
        return u.Email.String
    }
    return ""
}

func (u *User) GetAge() int {
    if u.Age.Valid {
        return int(u.Age.Int64)
    }
    return 0
}

// Inserting NULL values
func insertUserWithNulls(db *sql.DB, name string, email *string) error {
    var emailValue sql.NullString
    if email != nil {
        emailValue = sql.NullString{String: *email, Valid: true}
    }
    
    _, err := db.Exec(
        "INSERT INTO users (name, email) VALUES ($1, $2)",
        name, emailValue,
    )
    
    return err
}
```

## Context Support

Using context for cancellation and timeouts.

```go
package main

import (
    "context"
    "database/sql"
    "time"
)

func getUserWithTimeout(db *sql.DB, id int) (*User, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    query := "SELECT id, name, email, age FROM users WHERE id = $1"
    
    var user User
    err := db.QueryRowContext(ctx, query, id).Scan(
        &user.ID, &user.Name, &user.Email, &user.Age,
    )
    
    if err != nil {
        return nil, err
    }
    
    return &user, nil
}

func getAllUsersWithContext(ctx context.Context, db *sql.DB) ([]User, error) {
    query := "SELECT id, name, email, age FROM users"
    
    rows, err := db.QueryContext(ctx, query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var users []User
    for rows.Next() {
        // Check if context cancelled
        select {
        case <-ctx.Done():
            return nil, ctx.Err()
        default:
        }
        
        var user User
        if err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Age); err != nil {
            return nil, err
        }
        users = append(users, user)
    }
    
    return users, rows.Err()
}
```

## Complete Repository Pattern Example

```go
package repository

import (
    "context"
    "database/sql"
    "errors"
    "time"
)

type User struct {
    ID        int
    Name      string
    Email     string
    CreatedAt time.Time
    UpdatedAt time.Time
}

type UserRepository struct {
    db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
    return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *User) error {
    query := `
        INSERT INTO users (name, email, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `
    
    now := time.Now()
    err := r.db.QueryRowContext(ctx, query, user.Name, user.Email, now, now).Scan(&user.ID)
    if err != nil {
        return err
    }
    
    user.CreatedAt = now
    user.UpdatedAt = now
    return nil
}

func (r *UserRepository) GetByID(ctx context.Context, id int) (*User, error) {
    query := `
        SELECT id, name, email, created_at, updated_at
        FROM users
        WHERE id = $1
    `
    
    var user User
    err := r.db.QueryRowContext(ctx, query, id).Scan(
        &user.ID,
        &user.Name,
        &user.Email,
        &user.CreatedAt,
        &user.UpdatedAt,
    )
    
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, errors.New("user not found")
        }
        return nil, err
    }
    
    return &user, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
    query := `
        SELECT id, name, email, created_at, updated_at
        FROM users
        WHERE email = $1
    `
    
    var user User
    err := r.db.QueryRowContext(ctx, query, email).Scan(
        &user.ID,
        &user.Name,
        &user.Email,
        &user.CreatedAt,
        &user.UpdatedAt,
    )
    
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, nil  // Not found, not an error
        }
        return nil, err
    }
    
    return &user, nil
}

func (r *UserRepository) List(ctx context.Context, limit, offset int) ([]User, error) {
    query := `
        SELECT id, name, email, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
    `
    
    rows, err := r.db.QueryContext(ctx, query, limit, offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var users []User
    for rows.Next() {
        var user User
        err := rows.Scan(
            &user.ID,
            &user.Name,
            &user.Email,
            &user.CreatedAt,
            &user.UpdatedAt,
        )
        if err != nil {
            return nil, err
        }
        users = append(users, user)
    }
    
    return users, rows.Err()
}

func (r *UserRepository) Update(ctx context.Context, user *User) error {
    query := `
        UPDATE users
        SET name = $1, email = $2, updated_at = $3
        WHERE id = $4
    `
    
    user.UpdatedAt = time.Now()
    result, err := r.db.ExecContext(ctx, query, user.Name, user.Email, user.UpdatedAt, user.ID)
    if err != nil {
        return err
    }
    
    rows, err := result.RowsAffected()
    if err != nil {
        return err
    }
    
    if rows == 0 {
        return errors.New("user not found")
    }
    
    return nil
}

func (r *UserRepository) Delete(ctx context.Context, id int) error {
    query := "DELETE FROM users WHERE id = $1"
    
    result, err := r.db.ExecContext(ctx, query, id)
    if err != nil {
        return err
    }
    
    rows, err := result.RowsAffected()
    if err != nil {
        return err
    }
    
    if rows == 0 {
        return errors.New("user not found")
    }
    
    return nil
}

func (r *UserRepository) Count(ctx context.Context) (int, error) {
    query := "SELECT COUNT(*) FROM users"
    
    var count int
    err := r.db.QueryRowContext(ctx, query).Scan(&count)
    return count, err
}
```

## Best Practices

### 1. Always Use Parameterized Queries

```go
// GOOD - prevents SQL injection
db.Query("SELECT * FROM users WHERE id = $1", userID)

// BAD - vulnerable to SQL injection
db.Query(fmt.Sprintf("SELECT * FROM users WHERE id = %d", userID))
```

### 2. Close Rows

```go
rows, err := db.Query("SELECT * FROM users")
if err != nil {
    return err
}
defer rows.Close()  // IMPORTANT!
```

### 3. Check rows.Err()

```go
for rows.Next() {
    // Scan rows
}
if err := rows.Err(); err != nil {  // IMPORTANT!
    return err
}
```

### 4. Use Context

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

rows, err := db.QueryContext(ctx, query)
```

### 5. Configure Connection Pool

```go
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)
```

### 6. Handle Errors Properly

```go
if err != nil {
    if errors.Is(err, sql.ErrNoRows) {
        // Not found - handle specifically
    }
    // Other errors
}
```

## Common Pitfalls

1. **Forgetting to close rows** - Resource leak
2. **Not checking rows.Err()** - Missing iteration errors
3. **SQL injection** - Not using parameterized queries
4. **Scanning wrong number of columns** - Runtime panic
5. **Not handling NULL values** - Use sql.Null* types
6. **Connection pool exhaustion** - Configure limits properly

## Summary

The `database/sql` package provides:
- Standard SQL database interface
- Connection pooling
- Transaction support
- Prepared statements
- NULL value handling
- Context support for cancellation

Essential for building robust, production-ready database-backed applications.
