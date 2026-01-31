# JSON Encoding and Decoding

## What is JSON in Go?

Go's `encoding/json` package provides functionality to convert Go data structures to JSON (marshaling) and JSON to Go data structures (unmarshaling).

## Why JSON?

- **API Communication**: Most REST APIs use JSON
- **Configuration**: Store settings in JSON files
- **Data Exchange**: Universal format for data transfer
- **Human Readable**: Easy to debug and understand

## Basic JSON Operations

### Marshal (Go → JSON)

```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
)

type Person struct {
    Name string
    Age  int
}

func main() {
    person := Person{
        Name: "John Doe",
        Age:  30,
    }
    
    // Marshal to JSON bytes
    jsonBytes, err := json.Marshal(person)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Println(string(jsonBytes))
    // Output: {"Name":"John Doe","Age":30}
}
```

### Unmarshal (JSON → Go)

```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
)

type Person struct {
    Name string
    Age  int
}

func main() {
    jsonData := `{"Name":"John Doe","Age":30}`
    
    var person Person
    err := json.Unmarshal([]byte(jsonData), &person)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("%+v\n", person)
    // Output: {Name:John Doe Age:30}
}
```

## Struct Tags

Control JSON field names and behavior with struct tags.

### Basic Tags

```go
package main

import (
    "encoding/json"
    "fmt"
)

type User struct {
    ID        int    `json:"id"`
    FirstName string `json:"first_name"`
    LastName  string `json:"last_name"`
    Email     string `json:"email"`
}

func main() {
    user := User{
        ID:        1,
        FirstName: "John",
        LastName:  "Doe",
        Email:     "john@example.com",
    }
    
    jsonBytes, _ := json.MarshalIndent(user, "", "  ")
    fmt.Println(string(jsonBytes))
}

// Output:
// {
//   "id": 1,
//   "first_name": "John",
//   "last_name": "Doe",
//   "email": "john@example.com"
// }
```

### omitempty Tag

Omit field if zero value:

```go
package main

import (
    "encoding/json"
    "fmt"
)

type User struct {
    ID       int    `json:"id"`
    Name     string `json:"name"`
    Email    string `json:"email,omitempty"`     // Omit if empty
    Age      int    `json:"age,omitempty"`       // Omit if 0
    IsActive bool   `json:"is_active,omitempty"` // Omit if false
}

func main() {
    user := User{
        ID:   1,
        Name: "John",
        // Email, Age, IsActive not set (zero values)
    }
    
    jsonBytes, _ := json.MarshalIndent(user, "", "  ")
    fmt.Println(string(jsonBytes))
}

// Output:
// {
//   "id": 1,
//   "name": "John"
// }
```

### Ignore Field

```go
type User struct {
    ID       int    `json:"id"`
    Name     string `json:"name"`
    Password string `json:"-"`  // Never include in JSON
}
```

### Embedded Structs

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Address struct {
    Street  string `json:"street"`
    City    string `json:"city"`
    Country string `json:"country"`
}

type User struct {
    ID      int     `json:"id"`
    Name    string  `json:"name"`
    Address Address `json:"address"`  // Nested object
}

func main() {
    user := User{
        ID:   1,
        Name: "John",
        Address: Address{
            Street:  "123 Main St",
            City:    "New York",
            Country: "USA",
        },
    }
    
    jsonBytes, _ := json.MarshalIndent(user, "", "  ")
    fmt.Println(string(jsonBytes))
}

// Output:
// {
//   "id": 1,
//   "name": "John",
//   "address": {
//     "street": "123 Main St",
//     "city": "New York",
//     "country": "USA"
//   }
// }
```

### Inline Embedded Structs

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Timestamps struct {
    CreatedAt string `json:"created_at"`
    UpdatedAt string `json:"updated_at"`
}

type User struct {
    ID         int    `json:"id"`
    Name       string `json:"name"`
    Timestamps        // Embedded inline (no field name)
}

func main() {
    user := User{
        ID:   1,
        Name: "John",
        Timestamps: Timestamps{
            CreatedAt: "2024-01-01",
            UpdatedAt: "2024-01-02",
        },
    }
    
    jsonBytes, _ := json.MarshalIndent(user, "", "  ")
    fmt.Println(string(jsonBytes))
}

// Output:
// {
//   "id": 1,
//   "name": "John",
//   "created_at": "2024-01-01",
//   "updated_at": "2024-01-02"
// }
```

## Handling Different Types

### Arrays and Slices

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Response struct {
    Users []string `json:"users"`
    Tags  []int    `json:"tags"`
}

func main() {
    resp := Response{
        Users: []string{"Alice", "Bob", "Charlie"},
        Tags:  []int{1, 2, 3},
    }
    
    jsonBytes, _ := json.MarshalIndent(resp, "", "  ")
    fmt.Println(string(jsonBytes))
}

// Output:
// {
//   "users": ["Alice", "Bob", "Charlie"],
//   "tags": [1, 2, 3]
// }
```

### Maps

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Config struct {
    Settings map[string]interface{} `json:"settings"`
}

func main() {
    config := Config{
        Settings: map[string]interface{}{
            "theme":    "dark",
            "fontSize": 14,
            "enabled":  true,
        },
    }
    
    jsonBytes, _ := json.MarshalIndent(config, "", "  ")
    fmt.Println(string(jsonBytes))
}

// Output:
// {
//   "settings": {
//     "enabled": true,
//     "fontSize": 14,
//     "theme": "dark"
//   }
// }
```

### Pointers and Null Values

```go
package main

import (
    "encoding/json"
    "fmt"
)

type User struct {
    ID    int     `json:"id"`
    Name  string  `json:"name"`
    Email *string `json:"email"`  // Pointer allows null
}

func main() {
    // With value
    email := "john@example.com"
    user1 := User{ID: 1, Name: "John", Email: &email}
    
    // Without value (null)
    user2 := User{ID: 2, Name: "Jane", Email: nil}
    
    json1, _ := json.Marshal(user1)
    json2, _ := json.Marshal(user2)
    
    fmt.Println(string(json1))  // {"id":1,"name":"John","email":"john@example.com"}
    fmt.Println(string(json2))  // {"id":2,"name":"Jane","email":null}
}
```

## Custom JSON Marshaling

### MarshalJSON Method

```go
package main

import (
    "encoding/json"
    "fmt"
    "time"
)

type Event struct {
    Name      string
    Timestamp time.Time
}

// Custom JSON marshaling
func (e Event) MarshalJSON() ([]byte, error) {
    type Alias Event  // Prevent recursion
    
    return json.Marshal(&struct {
        Alias
        Timestamp string `json:"timestamp"`
    }{
        Alias:     (Alias)(e),
        Timestamp: e.Timestamp.Format(time.RFC3339),
    })
}

func main() {
    event := Event{
        Name:      "User Login",
        Timestamp: time.Now(),
    }
    
    jsonBytes, _ := json.MarshalIndent(event, "", "  ")
    fmt.Println(string(jsonBytes))
}
```

### UnmarshalJSON Method

```go
package main

import (
    "encoding/json"
    "fmt"
    "time"
)

type Event struct {
    Name      string
    Timestamp time.Time
}

func (e *Event) UnmarshalJSON(data []byte) error {
    type Alias Event
    
    aux := &struct {
        *Alias
        Timestamp string `json:"timestamp"`
    }{
        Alias: (*Alias)(e),
    }
    
    if err := json.Unmarshal(data, &aux); err != nil {
        return err
    }
    
    t, err := time.Parse(time.RFC3339, aux.Timestamp)
    if err != nil {
        return err
    }
    
    e.Timestamp = t
    return nil
}

func main() {
    jsonData := `{
        "Name": "User Login",
        "timestamp": "2024-01-01T10:00:00Z"
    }`
    
    var event Event
    json.Unmarshal([]byte(jsonData), &event)
    
    fmt.Printf("%+v\n", event)
}
```

## Streaming JSON

### Encoder (Stream writing)

```go
package main

import (
    "encoding/json"
    "os"
)

type User struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}

func main() {
    users := []User{
        {ID: 1, Name: "Alice"},
        {ID: 2, Name: "Bob"},
    }
    
    // Create encoder writing to stdout
    encoder := json.NewEncoder(os.Stdout)
    encoder.SetIndent("", "  ")
    
    for _, user := range users {
        encoder.Encode(user)
    }
}
```

### Decoder (Stream reading)

```go
package main

import (
    "encoding/json"
    "fmt"
    "strings"
)

type User struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}

func main() {
    jsonStream := `
        {"id":1,"name":"Alice"}
        {"id":2,"name":"Bob"}
        {"id":3,"name":"Charlie"}
    `
    
    decoder := json.NewDecoder(strings.NewReader(jsonStream))
    
    for decoder.More() {
        var user User
        if err := decoder.Decode(&user); err != nil {
            fmt.Println("Error:", err)
            break
        }
        fmt.Printf("%+v\n", user)
    }
}
```

## HTTP API Examples

### Sending JSON Response

```go
package main

import (
    "encoding/json"
    "net/http"
)

type Response struct {
    Status  string `json:"status"`
    Message string `json:"message"`
    Data    any    `json:"data,omitempty"`
}

func handleAPI(w http.ResponseWriter, r *http.Request) {
    resp := Response{
        Status:  "success",
        Message: "Request processed",
        Data: map[string]string{
            "id":   "123",
            "name": "John",
        },
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    
    json.NewEncoder(w).Encode(resp)
}

func main() {
    http.HandleFunc("/api", handleAPI)
    http.ListenAndServe(":8080", nil)
}
```

### Receiving JSON Request

```go
package main

import (
    "encoding/json"
    "net/http"
)

type CreateUserRequest struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

type CreateUserResponse struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

func createUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    
    // Decode JSON body
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }
    
    // Validate
    if req.Name == "" || req.Email == "" {
        http.Error(w, "Name and email required", http.StatusBadRequest)
        return
    }
    
    // Create response
    resp := CreateUserResponse{
        ID:    123,
        Name:  req.Name,
        Email: req.Email,
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(resp)
}

func main() {
    http.HandleFunc("/users", createUser)
    http.ListenAndServe(":8080", nil)
}
```

### Complete REST API Example

```go
package main

import (
    "encoding/json"
    "net/http"
    "strconv"
    "sync"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

type Store struct {
    mu     sync.RWMutex
    users  map[int]*User
    nextID int
}

func NewStore() *Store {
    return &Store{
        users:  make(map[int]*User),
        nextID: 1,
    }
}

func (s *Store) Create(name, email string) *User {
    s.mu.Lock()
    defer s.mu.Unlock()
    
    user := &User{
        ID:    s.nextID,
        Name:  name,
        Email: email,
    }
    s.users[user.ID] = user
    s.nextID++
    
    return user
}

func (s *Store) GetAll() []*User {
    s.mu.RLock()
    defer s.mu.RUnlock()
    
    users := make([]*User, 0, len(s.users))
    for _, user := range s.users {
        users = append(users, user)
    }
    return users
}

func (s *Store) Get(id int) *User {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.users[id]
}

type Handler struct {
    store *Store
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        h.handleGet(w, r)
    case http.MethodPost:
        h.handlePost(w, r)
    default:
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
    }
}

func (h *Handler) handleGet(w http.ResponseWriter, r *http.Request) {
    idStr := r.URL.Query().Get("id")
    
    w.Header().Set("Content-Type", "application/json")
    
    if idStr != "" {
        // Get single user
        id, _ := strconv.Atoi(idStr)
        user := h.store.Get(id)
        
        if user == nil {
            http.Error(w, "User not found", http.StatusNotFound)
            return
        }
        
        json.NewEncoder(w).Encode(user)
    } else {
        // Get all users
        users := h.store.GetAll()
        json.NewEncoder(w).Encode(users)
    }
}

func (h *Handler) handlePost(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Name  string `json:"name"`
        Email string `json:"email"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }
    
    if req.Name == "" || req.Email == "" {
        http.Error(w, "Name and email required", http.StatusBadRequest)
        return
    }
    
    user := h.store.Create(req.Name, req.Email)
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(user)
}

func main() {
    store := NewStore()
    handler := &Handler{store: store}
    
    http.Handle("/users", handler)
    http.ListenAndServe(":8080", nil)
}
```

## Error Handling

### Validation Errors

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
)

type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}

type ErrorResponse struct {
    Error  string            `json:"error"`
    Errors []ValidationError `json:"errors,omitempty"`
}

func sendError(w http.ResponseWriter, message string, status int) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    
    json.NewEncoder(w).Encode(ErrorResponse{
        Error: message,
    })
}

func sendValidationErrors(w http.ResponseWriter, errors []ValidationError) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusBadRequest)
    
    json.NewEncoder(w).Encode(ErrorResponse{
        Error:  "Validation failed",
        Errors: errors,
    })
}
```

## Best Practices

### 1. Use Struct Tags

```go
type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email,omitempty"`
}
```

### 2. Validate Input

```go
func createUser(w http.ResponseWriter, r *http.Request) {
    var user User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }
    
    // Validate
    if user.Name == "" {
        http.Error(w, "Name required", http.StatusBadRequest)
        return
    }
}
```

### 3. Set Content-Type Header

```go
w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(data)
```

### 4. Use Encoder for HTTP Responses

```go
// GOOD - streams directly
json.NewEncoder(w).Encode(data)

// Less efficient - creates intermediate bytes
bytes, _ := json.Marshal(data)
w.Write(bytes)
```

### 5. Handle Null vs Omit

```go
type User struct {
    Email *string `json:"email"`           // null if nil
    Phone string  `json:"phone,omitempty"` // omitted if empty
}
```

## Summary

JSON encoding/decoding provides:
- **Marshal/Unmarshal**: Convert between Go and JSON
- **Struct Tags**: Control field names and behavior
- **Streaming**: Efficient encoder/decoder for large data
- **Custom Marshaling**: Implement custom JSON format
- **HTTP Integration**: Easy API request/response handling

Essential for building RESTful APIs and data interchange in Go.
