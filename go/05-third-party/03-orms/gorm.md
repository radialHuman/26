# GORM - Go ORM Library

## What is GORM?

GORM is a feature-rich ORM (Object-Relational Mapping) library for Go, providing a developer-friendly API for database operations.

## Installation

```bash
# GORM core
go get -u gorm.io/gorm

# Database drivers
go get -u gorm.io/driver/postgres
go get -u gorm.io/driver/mysql
go get -u gorm.io/driver/sqlite
```

## Database Connection

### PostgreSQL

```go
package main

import (
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "log"
)

func main() {
    dsn := "host=localhost user=postgres password=secret dbname=mydb port=5432 sslmode=disable"
    
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        log.Fatal("Failed to connect:", err)
    }
    
    log.Println("Connected to database")
}
```

### MySQL

```go
package main

import (
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

func main() {
    dsn := "user:password@tcp(127.0.0.1:3306)/dbname?charset=utf8mb4&parseTime=True&loc=Local"
    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        panic(err)
    }
}
```

### SQLite

```go
package main

import (
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

func main() {
    db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
    if err != nil {
        panic(err)
    }
}
```

## Model Definition

### Basic Model

```go
package main

import (
    "time"
    "gorm.io/gorm"
)

type User struct {
    ID        uint           `gorm:"primaryKey"`
    Name      string         `gorm:"not null"`
    Email     string         `gorm:"uniqueIndex;not null"`
    Age       int
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"`
}
```

### Using gorm.Model

```go
package main

import (
    "gorm.io/gorm"
)

// gorm.Model includes ID, CreatedAt, UpdatedAt, DeletedAt
type User struct {
    gorm.Model
    Name  string
    Email string `gorm:"uniqueIndex"`
}

// Equivalent to:
// type User struct {
//     ID        uint
//     CreatedAt time.Time
//     UpdatedAt time.Time
//     DeletedAt gorm.DeletedAt `gorm:"index"`
//     Name      string
//     Email     string
// }
```

### Field Tags

```go
package main

import "gorm.io/gorm"

type User struct {
    ID       uint   `gorm:"primaryKey"`
    Name     string `gorm:"size:100;not null"`
    Email    string `gorm:"size:255;uniqueIndex;not null"`
    Age      int    `gorm:"default:0"`
    Active   bool   `gorm:"default:true"`
    Password string `gorm:"size:255;not null"`
    Bio      string `gorm:"type:text"`
    
    // Skip this field
    TempData string `gorm:"-"`
}
```

## Auto Migration

```go
package main

import (
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "log"
)

type User struct {
    gorm.Model
    Name  string
    Email string `gorm:"uniqueIndex"`
}

type Product struct {
    gorm.Model
    Name  string
    Price float64
}

func main() {
    db, err := gorm.Open(postgres.Open("..."), &gorm.Config{})
    if err != nil {
        log.Fatal(err)
    }
    
    // Auto migrate schemas
    db.AutoMigrate(&User{}, &Product{})
}
```

## CRUD Operations

### Create

```go
package main

import (
    "fmt"
    "gorm.io/gorm"
)

func createUser(db *gorm.DB) {
    user := User{
        Name:  "John Doe",
        Email: "john@example.com",
        Age:   30,
    }
    
    result := db.Create(&user)
    
    if result.Error != nil {
        fmt.Println("Error:", result.Error)
        return
    }
    
    fmt.Println("Created user ID:", user.ID)
    fmt.Println("Rows affected:", result.RowsAffected)
}

// Create multiple records
func createUsers(db *gorm.DB) {
    users := []User{
        {Name: "Alice", Email: "alice@example.com"},
        {Name: "Bob", Email: "bob@example.com"},
    }
    
    db.Create(&users)
}

// Create in batches
func createUsersBatch(db *gorm.DB, users []User) {
    db.CreateInBatches(users, 100) // Batch size 100
}
```

### Read

```go
package main

import (
    "fmt"
    "gorm.io/gorm"
)

// Find by primary key
func getUserByID(db *gorm.DB, id uint) (*User, error) {
    var user User
    result := db.First(&user, id)
    
    if result.Error != nil {
        return nil, result.Error
    }
    
    return &user, nil
}

// Find one by condition
func getUserByEmail(db *gorm.DB, email string) (*User, error) {
    var user User
    result := db.Where("email = ?", email).First(&user)
    
    if result.Error != nil {
        return nil, result.Error
    }
    
    return &user, nil
}

// Find all
func getAllUsers(db *gorm.DB) ([]User, error) {
    var users []User
    result := db.Find(&users)
    
    if result.Error != nil {
        return nil, result.Error
    }
    
    return users, nil
}

// Find with conditions
func getUsersByAge(db *gorm.DB, minAge int) ([]User, error) {
    var users []User
    result := db.Where("age >= ?", minAge).Find(&users)
    
    if result.Error != nil {
        return nil, result.Error
    }
    
    return users, nil
}

// Find with multiple conditions
func getActiveUsers(db *gorm.DB) ([]User, error) {
    var users []User
    result := db.Where("active = ? AND age >= ?", true, 18).Find(&users)
    
    if result.Error != nil {
        return nil, result.Error
    }
    
    return users, nil
}
```

### Update

```go
package main

import "gorm.io/gorm"

// Update single field
func updateUserName(db *gorm.DB, id uint, name string) error {
    return db.Model(&User{}).Where("id = ?", id).Update("name", name).Error
}

// Update multiple fields with struct
func updateUser(db *gorm.DB, id uint, updates User) error {
    return db.Model(&User{}).Where("id = ?", id).Updates(updates).Error
}

// Update multiple fields with map
func updateUserMap(db *gorm.DB, id uint) error {
    return db.Model(&User{}).Where("id = ?", id).Updates(map[string]interface{}{
        "name": "Jane",
        "age":  25,
    }).Error
}

// Update all records
func deactivateAllUsers(db *gorm.DB) error {
    return db.Model(&User{}).Update("active", false).Error
}

// Save (update all fields)
func saveUser(db *gorm.DB, user *User) error {
    return db.Save(user).Error
}
```

### Delete

```go
package main

import "gorm.io/gorm"

// Soft delete (sets DeletedAt)
func deleteUser(db *gorm.DB, id uint) error {
    return db.Delete(&User{}, id).Error
}

// Permanent delete
func permanentDeleteUser(db *gorm.DB, id uint) error {
    return db.Unscoped().Delete(&User{}, id).Error
}

// Delete with conditions
func deleteInactiveUsers(db *gorm.DB) error {
    return db.Where("active = ?", false).Delete(&User{}).Error
}

// Find deleted records
func getDeletedUsers(db *gorm.DB) ([]User, error) {
    var users []User
    result := db.Unscoped().Where("deleted_at IS NOT NULL").Find(&users)
    return users, result.Error
}
```

## Querying

### Where Conditions

```go
package main

import "gorm.io/gorm"

// Basic where
db.Where("name = ?", "John").Find(&users)

// Multiple conditions
db.Where("name = ? AND age >= ?", "John", 18).Find(&users)

// OR conditions
db.Where("name = ?", "John").Or("name = ?", "Jane").Find(&users)

// NOT conditions
db.Not("name = ?", "John").Find(&users)

// IN
db.Where("name IN ?", []string{"John", "Jane"}).Find(&users)

// LIKE
db.Where("name LIKE ?", "%john%").Find(&users)

// Between
db.Where("age BETWEEN ? AND ?", 18, 65).Find(&users)

// Struct conditions
db.Where(&User{Name: "John", Age: 30}).Find(&users)

// Map conditions
db.Where(map[string]interface{}{"name": "John", "age": 30}).Find(&users)
```

### Select Fields

```go
package main

// Select specific fields
db.Select("name", "email").Find(&users)

// Exclude fields
db.Omit("password").Find(&users)
```

### Order, Limit, Offset

```go
package main

// Order by
db.Order("created_at desc").Find(&users)
db.Order("age desc, name").Find(&users)

// Limit
db.Limit(10).Find(&users)

// Offset
db.Offset(20).Limit(10).Find(&users)

// Pagination
func getUsers(db *gorm.DB, page, pageSize int) ([]User, error) {
    var users []User
    offset := (page - 1) * pageSize
    
    result := db.Offset(offset).Limit(pageSize).Find(&users)
    return users, result.Error
}
```

### Group By and Having

```go
package main

type Result struct {
    Age   int
    Count int
}

// Group by
func getUserCountByAge(db *gorm.DB) ([]Result, error) {
    var results []Result
    err := db.Model(&User{}).
        Select("age, count(*) as count").
        Group("age").
        Having("count > ?", 5).
        Scan(&results).Error
    
    return results, err
}
```

## Associations

### Has One

```go
package main

import "gorm.io/gorm"

type User struct {
    gorm.Model
    Name    string
    Profile Profile
}

type Profile struct {
    gorm.Model
    UserID uint
    Bio    string
    Avatar string
}

// Create with association
func createUserWithProfile(db *gorm.DB) {
    user := User{
        Name: "John",
        Profile: Profile{
            Bio:    "Software Developer",
            Avatar: "avatar.jpg",
        },
    }
    
    db.Create(&user)
}

// Preload association
func getUserWithProfile(db *gorm.DB, id uint) (*User, error) {
    var user User
    result := db.Preload("Profile").First(&user, id)
    return &user, result.Error
}
```

### Has Many

```go
package main

import "gorm.io/gorm"

type User struct {
    gorm.Model
    Name  string
    Posts []Post
}

type Post struct {
    gorm.Model
    UserID uint
    Title  string
    Body   string
}

// Create with associations
func createUserWithPosts(db *gorm.DB) {
    user := User{
        Name: "John",
        Posts: []Post{
            {Title: "First Post", Body: "Content 1"},
            {Title: "Second Post", Body: "Content 2"},
        },
    }
    
    db.Create(&user)
}

// Preload posts
func getUserWithPosts(db *gorm.DB, id uint) (*User, error) {
    var user User
    result := db.Preload("Posts").First(&user, id)
    return &user, result.Error
}
```

### Belongs To

```go
package main

type Post struct {
    gorm.Model
    UserID uint
    User   User  // Belongs to User
    Title  string
}

// Preload user
func getPostWithUser(db *gorm.DB, id uint) (*Post, error) {
    var post Post
    result := db.Preload("User").First(&post, id)
    return &post, result.Error
}
```

### Many to Many

```go
package main

import "gorm.io/gorm"

type User struct {
    gorm.Model
    Name  string
    Roles []Role `gorm:"many2many:user_roles;"`
}

type Role struct {
    gorm.Model
    Name  string
    Users []User `gorm:"many2many:user_roles;"`
}

// Assign roles
func assignRoles(db *gorm.DB) {
    user := User{Name: "John"}
    db.Create(&user)
    
    roles := []Role{
        {Name: "Admin"},
        {Name: "User"},
    }
    db.Create(&roles)
    
    db.Model(&user).Association("Roles").Append(&roles)
}

// Get user with roles
func getUserWithRoles(db *gorm.DB, id uint) (*User, error) {
    var user User
    result := db.Preload("Roles").First(&user, id)
    return &user, result.Error
}
```

## Transactions

```go
package main

import (
    "errors"
    "gorm.io/gorm"
)

// Manual transaction
func transferMoney(db *gorm.DB, fromID, toID uint, amount float64) error {
    return db.Transaction(func(tx *gorm.DB) error {
        // Deduct from sender
        if err := tx.Model(&Account{}).Where("id = ?", fromID).
            Update("balance", gorm.Expr("balance - ?", amount)).Error; err != nil {
            return err
        }
        
        // Add to receiver
        if err := tx.Model(&Account{}).Where("id = ?", toID).
            Update("balance", gorm.Expr("balance + ?", amount)).Error; err != nil {
            return err
        }
        
        return nil
    })
}

// Nested transactions
func nestedTransaction(db *gorm.DB) error {
    return db.Transaction(func(tx *gorm.DB) error {
        tx.Create(&User{Name: "John"})
        
        return tx.Transaction(func(tx2 *gorm.DB) error {
            tx2.Create(&User{Name: "Jane"})
            return nil
        })
    })
}
```

## Hooks

```go
package main

import (
    "gorm.io/gorm"
    "time"
)

type User struct {
    gorm.Model
    Name      string
    Email     string
    CreatedBy string
}

// Before create
func (u *User) BeforeCreate(tx *gorm.DB) error {
    u.CreatedBy = "system"
    return nil
}

// After create
func (u *User) AfterCreate(tx *gorm.DB) error {
    // Send welcome email
    return nil
}

// Before update
func (u *User) BeforeUpdate(tx *gorm.DB) error {
    if u.Email == "" {
        return errors.New("email cannot be empty")
    }
    return nil
}

// After find
func (u *User) AfterFind(tx *gorm.DB) error {
    // Decrypt sensitive data
    return nil
}
```

## Scopes

```go
package main

import (
    "gorm.io/gorm"
    "time"
)

// Reusable query scopes
func ActiveUsers(db *gorm.DB) *gorm.DB {
    return db.Where("active = ?", true)
}

func RecentUsers(db *gorm.DB) *gorm.DB {
    oneWeekAgo := time.Now().AddDate(0, 0, -7)
    return db.Where("created_at > ?", oneWeekAgo)
}

func AdultUsers(db *gorm.DB) *gorm.DB {
    return db.Where("age >= ?", 18)
}

// Usage
func getActiveAdultUsers(db *gorm.DB) ([]User, error) {
    var users []User
    result := db.Scopes(ActiveUsers, AdultUsers).Find(&users)
    return users, result.Error
}

// Parameterized scope
func AgeGreaterThan(age int) func(db *gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Where("age > ?", age)
    }
}

// Usage
db.Scopes(AgeGreaterThan(21)).Find(&users)
```

## Complete Example

```go
package main

import (
    "fmt"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "log"
    "time"
)

type User struct {
    ID        uint      `gorm:"primaryKey"`
    Name      string    `gorm:"not null"`
    Email     string    `gorm:"uniqueIndex;not null"`
    Age       int
    Active    bool      `gorm:"default:true"`
    Posts     []Post
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"`
}

type Post struct {
    ID        uint   `gorm:"primaryKey"`
    UserID    uint
    User      User
    Title     string `gorm:"not null"`
    Body      string `gorm:"type:text"`
    Published bool   `gorm:"default:false"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

func main() {
    dsn := "host=localhost user=postgres password=secret dbname=mydb port=5432 sslmode=disable"
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        log.Fatal(err)
    }
    
    // Auto migrate
    db.AutoMigrate(&User{}, &Post{})
    
    // Create user
    user := User{
        Name:  "John Doe",
        Email: "john@example.com",
        Age:   30,
    }
    db.Create(&user)
    
    // Create post
    post := Post{
        UserID: user.ID,
        Title:  "First Post",
        Body:   "This is my first post",
    }
    db.Create(&post)
    
    // Query with associations
    var users []User
    db.Preload("Posts").Find(&users)
    
    for _, u := range users {
        fmt.Printf("User: %s (%d posts)\n", u.Name, len(u.Posts))
    }
}
```

## Summary

GORM provides:
- **Auto Migration**: Schema management
- **CRUD**: Full create, read, update, delete
- **Associations**: One-to-one, one-to-many, many-to-many
- **Transactions**: ACID compliance
- **Hooks**: Lifecycle callbacks
- **Scopes**: Reusable queries

Perfect for database operations in Go applications.
