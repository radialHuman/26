# Request Validation

## What is Request Validation?

**Request validation** ensures incoming data meets requirements before processing. It:
- **Prevents Errors**: Catch bad data early
- **Improves Security**: Prevent injection attacks
- **Enhances UX**: Provide clear error messages
- **Maintains Data Integrity**: Ensure consistent data

## Why Validate?

Without validation:
```go
func createUser(c *gin.Context) {
    var user User
    c.BindJSON(&user)
    
    // What if email is empty? Invalid format? SQL injection?
    db.Create(&user) // Dangerous!
}
```

With validation:
```go
func createUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // Data is validated and safe to use
    user := User{Name: req.Name, Email: req.Email}
    db.Create(&user)
}
```

## Built-in Gin Validation

Gin uses `go-playground/validator` for struct tag validation.

### Basic Struct Tags

```go
package main

import (
    "net/http"
    
    "github.com/gin-gonic/gin"
)

type CreateUserRequest struct {
    Name     string `json:"name" binding:"required,min=2,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Age      int    `json:"age" binding:"required,gte=18,lte=120"`
    Password string `json:"password" binding:"required,min=8"`
    Phone    string `json:"phone" binding:"omitempty,e164"` // Optional but validated if provided
}

func createUser(c *gin.Context) {
    var req CreateUserRequest
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
        })
        return
    }
    
    // Request is valid
    c.JSON(http.StatusCreated, gin.H{
        "message": "User created",
        "data":    req,
    })
}
```

### Common Validation Tags

```go
type Product struct {
    // Required field
    Name string `binding:"required"`
    
    // String length
    Description string `binding:"min=10,max=500"`
    
    // Numeric range
    Price float64 `binding:"required,gt=0"`
    Stock int     `binding:"gte=0"`
    
    // Email format
    ContactEmail string `binding:"email"`
    
    // URL format
    Website string `binding:"url"`
    
    // Enum values
    Status string `binding:"oneof=active inactive pending"`
    
    // Array/Slice
    Tags []string `binding:"required,min=1,max=5,dive,min=2"`
    
    // UUID
    ID string `binding:"uuid"`
    
    // Date
    CreatedAt time.Time `binding:"required"`
    
    // Custom validation
    CustomField string `binding:"custom_validator"`
}
```

## Custom Error Messages

```go
package validation

import (
    "fmt"
    
    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
)

type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}

func HandleValidationErrors(c *gin.Context, err error) {
    var errors []ValidationError
    
    for _, err := range err.(validator.ValidationErrors) {
        var element ValidationError
        element.Field = err.Field()
        element.Message = getErrorMessage(err)
        errors = append(errors, element)
    }
    
    c.JSON(http.StatusBadRequest, gin.H{
        "error":   "Validation failed",
        "details": errors,
    })
}

func getErrorMessage(err validator.FieldError) string {
    field := err.Field()
    
    switch err.Tag() {
    case "required":
        return fmt.Sprintf("%s is required", field)
    case "email":
        return fmt.Sprintf("%s must be a valid email", field)
    case "min":
        return fmt.Sprintf("%s must be at least %s characters", field, err.Param())
    case "max":
        return fmt.Sprintf("%s must be at most %s characters", field, err.Param())
    case "gte":
        return fmt.Sprintf("%s must be greater than or equal to %s", field, err.Param())
    case "lte":
        return fmt.Sprintf("%s must be less than or equal to %s", field, err.Param())
    case "oneof":
        return fmt.Sprintf("%s must be one of [%s]", field, err.Param())
    default:
        return fmt.Sprintf("%s is invalid", field)
    }
}

// Usage
func createUser(c *gin.Context) {
    var req CreateUserRequest
    
    if err := c.ShouldBindJSON(&req); err != nil {
        HandleValidationErrors(c, err)
        return
    }
    
    // Process...
}
```

## Custom Validators

```go
package main

import (
    "regexp"
    
    "github.com/gin-gonic/gin"
    "github.com/gin-gonic/gin/binding"
    "github.com/go-playground/validator/v10"
)

// Register custom validators
func init() {
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        v.RegisterValidation("username", validateUsername)
        v.RegisterValidation("strongpassword", validateStrongPassword)
        v.RegisterValidation("past", validatePastDate)
    }
}

// Username: alphanumeric, 3-20 chars
func validateUsername(fl validator.FieldLevel) bool {
    username := fl.Field().String()
    matched, _ := regexp.MatchString("^[a-zA-Z0-9_]{3,20}$", username)
    return matched
}

// Strong password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
func validateStrongPassword(fl validator.FieldLevel) bool {
    password := fl.Field().String()
    
    if len(password) < 8 {
        return false
    }
    
    var (
        hasUpper   = regexp.MustCompile(`[A-Z]`).MatchString
        hasLower   = regexp.MustCompile(`[a-z]`).MatchString
        hasNumber  = regexp.MustCompile(`[0-9]`).MatchString
        hasSpecial = regexp.MustCompile(`[!@#$%^&*(),.?":{}|<>]`).MatchString
    )
    
    return hasUpper(password) && hasLower(password) && hasNumber(password) && hasSpecial(password)
}

// Past date
func validatePastDate(fl validator.FieldLevel) bool {
    date := fl.Field().Interface().(time.Time)
    return date.Before(time.Now())
}

// Usage
type RegisterRequest struct {
    Username string    `json:"username" binding:"required,username"`
    Password string    `json:"password" binding:"required,strongpassword"`
    Birthday time.Time `json:"birthday" binding:"required,past"`
}
```

## Struct-Level Validation

Validate relationships between fields.

```go
package main

import (
    "github.com/go-playground/validator/v10"
)

type BookingRequest struct {
    CheckInDate  time.Time `json:"check_in_date" binding:"required"`
    CheckOutDate time.Time `json:"check_out_date" binding:"required,gtfield=CheckInDate"`
    Adults       int       `json:"adults" binding:"required,min=1"`
    Children     int       `json:"children" binding:"gte=0"`
    Rooms        int       `json:"rooms" binding:"required,min=1"`
}

// Register struct-level validator
func init() {
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        v.RegisterStructValidation(BookingRequestStructLevelValidation, BookingRequest{})
    }
}

func BookingRequestStructLevelValidation(sl validator.StructLevel) {
    booking := sl.Current().Interface().(BookingRequest)
    
    // Total guests
    totalGuests := booking.Adults + booking.Children
    
    // At least 1 guest per room
    if booking.Rooms > totalGuests {
        sl.ReportError(booking.Rooms, "rooms", "Rooms", "toomanyrooms", "")
    }
    
    // Max 4 guests per room
    if totalGuests > booking.Rooms*4 {
        sl.ReportError(booking.Rooms, "rooms", "Rooms", "toofewrooms", "")
    }
    
    // Check-in must be at least 24 hours from now
    if booking.CheckInDate.Before(time.Now().Add(24 * time.Hour)) {
        sl.ReportError(booking.CheckInDate, "check_in_date", "CheckInDate", "toosoon", "")
    }
}
```

## Validator Package (Alternative)

More flexible alternative to struct tags.

```bash
go get github.com/go-playground/validator/v10
```

```go
package validation

import (
    "github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
    validate = validator.New()
    
    // Register custom validators
    validate.RegisterValidation("custom", customValidator)
}

func ValidateStruct(s interface{}) error {
    return validate.Struct(s)
}

func ValidateField(field interface{}, tag string) error {
    return validate.Var(field, tag)
}

// Usage
type User struct {
    Name  string `validate:"required,min=2,max=50"`
    Email string `validate:"required,email"`
    Age   int    `validate:"gte=18,lte=120"`
}

func createUser(req User) error {
    if err := validation.ValidateStruct(req); err != nil {
        return err
    }
    
    // Valid, proceed...
    return nil
}

// Validate single field
email := "test@example.com"
if err := validation.ValidateField(email, "required,email"); err != nil {
    // Invalid email
}
```

## Ozzo-Validation (Programmatic)

Code-based validation instead of struct tags.

```bash
go get github.com/go-ozzo/ozzo-validation/v4
```

```go
package main

import (
    "github.com/go-ozzo/ozzo-validation/v4"
    "github.com/go-ozzo/ozzo-validation/v4/is"
)

type User struct {
    Name     string
    Email    string
    Age      int
    Password string
}

func (u User) Validate() error {
    return validation.ValidateStruct(&u,
        validation.Field(&u.Name, validation.Required, validation.Length(2, 50)),
        validation.Field(&u.Email, validation.Required, is.Email),
        validation.Field(&u.Age, validation.Required, validation.Min(18), validation.Max(120)),
        validation.Field(&u.Password, validation.Required, validation.Length(8, 100)),
    )
}

// Custom rule
var PasswordStrength = validation.NewStringRule(func(s string) bool {
    // Check strength
    return len(s) >= 8 && hasUpperCase(s) && hasLowerCase(s) && hasNumber(s)
}, "must contain uppercase, lowercase, and number")

func (u User) ValidateWithCustomRule() error {
    return validation.ValidateStruct(&u,
        validation.Field(&u.Password, validation.Required, PasswordStrength),
    )
}

// Conditional validation
func (u User) ValidateConditional(isUpdate bool) error {
    return validation.ValidateStruct(&u,
        validation.Field(&u.Name, validation.When(!isUpdate, validation.Required)),
        validation.Field(&u.Email, validation.Required, is.Email),
    )
}

// Usage
func createUser(c *gin.Context) {
    var user User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    if err := user.Validate(); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // Valid, proceed...
}
```

## Middleware Validation

Reusable validation middleware.

```go
package middleware

import (
    "reflect"
    
    "github.com/gin-gonic/gin"
)

// ValidateRequest validates request and binds to struct
func ValidateRequest(obj interface{}) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Create new instance
        val := reflect.New(reflect.TypeOf(obj)).Interface()
        
        if err := c.ShouldBindJSON(val); err != nil {
            c.JSON(400, gin.H{"error": err.Error()})
            c.Abort()
            return
        }
        
        // Store in context
        c.Set("validated_request", val)
        c.Next()
    }
}

// Usage
r.POST("/users", 
    middleware.ValidateRequest(CreateUserRequest{}),
    func(c *gin.Context) {
        req := c.MustGet("validated_request").(*CreateUserRequest)
        // Use validated request
    },
)
```

## Query Parameter Validation

```go
type ListUsersQuery struct {
    Page     int    `form:"page" binding:"omitempty,gte=1"`
    PerPage  int    `form:"per_page" binding:"omitempty,gte=1,lte=100"`
    Sort     string `form:"sort" binding:"omitempty,oneof=name email created_at"`
    Order    string `form:"order" binding:"omitempty,oneof=asc desc"`
    Status   string `form:"status" binding:"omitempty,oneof=active inactive"`
    Search   string `form:"search" binding:"omitempty,min=3"`
}

func listUsers(c *gin.Context) {
    var query ListUsersQuery
    query.Page = 1      // Defaults
    query.PerPage = 20
    query.Order = "asc"
    
    if err := c.ShouldBindQuery(&query); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // Query validated
    users := getUsersWithQuery(query)
    c.JSON(200, users)
}
```

## File Upload Validation

```go
type UploadRequest struct {
    File *multipart.FileHeader `form:"file" binding:"required"`
}

func uploadFile(c *gin.Context) {
    var req UploadRequest
    
    if err := c.ShouldBind(&req); err != nil {
        c.JSON(400, gin.H{"error": "File is required"})
        return
    }
    
    file := req.File
    
    // Validate file size (max 5MB)
    if file.Size > 5*1024*1024 {
        c.JSON(400, gin.H{"error": "File too large (max 5MB)"})
        return
    }
    
    // Validate file type
    allowedTypes := map[string]bool{
        "image/jpeg": true,
        "image/png":  true,
        "image/gif":  true,
    }
    
    contentType := file.Header.Get("Content-Type")
    if !allowedTypes[contentType] {
        c.JSON(400, gin.H{"error": "Invalid file type"})
        return
    }
    
    // Save file
    c.SaveUploadedFile(file, "./uploads/"+file.Filename)
    c.JSON(200, gin.H{"message": "File uploaded"})
}
```

## Domain-Specific Validation

```go
package domain

type User struct {
    ID       int
    Email    string
    Password string
    Role     string
}

func (u *User) Validate() error {
    if u.Email == "" {
        return errors.New("email is required")
    }
    
    if !isValidEmail(u.Email) {
        return errors.New("invalid email format")
    }
    
    if len(u.Password) < 8 {
        return errors.New("password must be at least 8 characters")
    }
    
    validRoles := map[string]bool{
        "admin": true,
        "user":  true,
        "guest": true,
    }
    
    if !validRoles[u.Role] {
        return errors.New("invalid role")
    }
    
    return nil
}

func isValidEmail(email string) bool {
    re := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
    return re.MatchString(email)
}
```

## Best Practices

### 1. Validate Early

```go
func createUser(c *gin.Context) {
    var req CreateUserRequest
    
    // Validate immediately
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // Proceed with valid data
}
```

### 2. Provide Clear Error Messages

```go
// Good
{"error": "Email is required"}
{"error": "Password must be at least 8 characters"}

// Bad
{"error": "validation failed"}
{"error": "invalid input"}
```

### 3. Validate at Multiple Layers

```go
// 1. Request validation (format, types)
if err := c.ShouldBindJSON(&req); err != nil { ... }

// 2. Business rules validation (domain)
if err := user.Validate(); err != nil { ... }

// 3. Database constraints (uniqueness, etc.)
```

### 4. Sanitize Input

```go
import "html"

func sanitize(input string) string {
    // Trim whitespace
    input = strings.TrimSpace(input)
    
    // Escape HTML
    input = html.EscapeString(input)
    
    return input
}

user.Name = sanitize(req.Name)
```

## Summary

Request validation:
- **Struct Tags**: Simple, declarative validation
- **Custom Validators**: Complex, reusable rules
- **Error Handling**: Clear, actionable messages
- **Multiple Layers**: Format, business, persistence
- **Security**: Prevent injection and bad data

Essential for robust, secure APIs.
