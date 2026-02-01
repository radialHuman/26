# Compliance for Production Go Applications

## GDPR Compliance

### Data Anonymization
```go
package compliance

import (
    "crypto/sha256"
    "fmt"
)

func AnonymizeEmail(email string) string {
    hash := sha256.Sum256([]byte(email))
    return fmt.Sprintf("%x@anonymized.com", hash[:8])
}

func AnonymizeUser(user *User) *AnonymizedUser {
    return &AnonymizedUser{
        ID: user.ID,
        Email: AnonymizeEmail(user.Email),
        CreatedAt: user.CreatedAt,
    }
}
```

### Right to be Forgotten
```go
package compliance

type UserDeletionService struct {
    db *sql.DB
}

func (s *UserDeletionService) DeleteUserData(ctx context.Context, userID string) error {
    tx, err := s.db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()
    
    // Delete user data from all tables
    tables := []string{"users", "orders", "preferences", "audit_logs"}
    for _, table := range tables {
        query := fmt.Sprintf("DELETE FROM %s WHERE user_id = $1", table)
        if _, err := tx.ExecContext(ctx, query, userID); err != nil {
            return err
        }
    }
    
    return tx.Commit()
}
```

## Audit Logging

```go
package compliance

import (
    "context"
    "encoding/json"
    "time"
)

type AuditLog struct {
    ID        string    `json:"id"`
    UserID    string    `json:"user_id"`
    Action    string    `json:"action"`
    Resource  string    `json:"resource"`
    Timestamp time.Time `json:"timestamp"`
    IPAddress string    `json:"ip_address"`
    Details   map[string]interface{} `json:"details"`
}

type AuditLogger struct {
    db *sql.DB
}

func (al *AuditLogger) Log(ctx context.Context, log AuditLog) error {
    log.Timestamp = time.Now()
    log.ID = uuid.New().String()
    
    details, _ := json.Marshal(log.Details)
    
    query := `INSERT INTO audit_logs (id, user_id, action, resource, timestamp, ip_address, details)
              VALUES ($1, $2, $3, $4, $5, $6, $7)`
    
    _, err := al.db.ExecContext(ctx, query,
        log.ID, log.UserID, log.Action, log.Resource,
        log.Timestamp, log.IPAddress, details,
    )
    
    return err
}
```

## Data Retention Policies

```go
package compliance

type RetentionPolicy struct {
    db *sql.DB
}

func (rp *RetentionPolicy) DeleteExpiredData(ctx context.Context) error {
    // Delete data older than retention period
    query := `DELETE FROM user_sessions WHERE created_at < NOW() - INTERVAL '90 days'`
    _, err := rp.db.ExecContext(ctx, query)
    return err
}
```

## Access Controls

```go
package compliance

type AccessControl struct {
    permissions map[string][]string
}

func (ac *AccessControl) CanAccess(userRole, resource, action string) bool {
    allowedActions, exists := ac.permissions[fmt.Sprintf("%s:%s", userRole, resource)]
    if !exists {
        return false
    }
    
    for _, allowed := range allowedActions {
        if allowed == action || allowed == "*" {
            return true
        }
    }
    
    return false
}
```

## Summary
Compliance involves data anonymization, user data deletion, audit logging, retention policies, and access controls to meet regulatory requirements like GDPR.
