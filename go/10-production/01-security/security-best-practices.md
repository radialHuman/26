# Security Best Practices

## What is Backend Security?

**Security** protects your application from:
- **Injection Attacks**: SQL, NoSQL, command injection
- **Authentication Bypass**: Weak passwords, session hijacking
- **Data Exposure**: Sensitive data leaks
- **XSS**: Cross-site scripting
- **CSRF**: Cross-site request forgery
- **DoS**: Denial of service attacks

## SQL Injection Prevention

### Vulnerable Code

```go
// NEVER DO THIS
func getUser(c *gin.Context) {
    email := c.Query("email")
    
    // Vulnerable to SQL injection
    query := "SELECT * FROM users WHERE email = '" + email + "'"
    db.Raw(query).Scan(&user)
}

// Attack: ?email=' OR '1'='1
// Query becomes: SELECT * FROM users WHERE email = '' OR '1'='1'
// Returns ALL users!
```

### Safe Code (Parameterized Queries)

```go
func getUser(c *gin.Context) {
    email := c.Query("email")
    
    // Safe: Parameterized query
    var user User
    db.Where("email = ?", email).First(&user)
    
    // Or with raw SQL
    db.Raw("SELECT * FROM users WHERE email = ?", email).Scan(&user)
    
    c.JSON(200, user)
}
```

### GORM is Safe by Default

```go
// All GORM methods use parameterized queries
db.Where("email = ?", email).Find(&users)
db.Where("status = ? AND role = ?", status, role).Find(&users)
db.Create(&user) // Safe
db.Updates(map[string]interface{}{"name": name}) // Safe
```

## Input Validation and Sanitization

### Validate All Input

```go
package validation

import (
    "html"
    "regexp"
    "strings"
)

func SanitizeString(input string) string {
    // Trim whitespace
    input = strings.TrimSpace(input)
    
    // Escape HTML
    input = html.EscapeString(input)
    
    return input
}

func ValidateEmail(email string) bool {
    re := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
    return re.MatchString(email)
}

func ValidateUsername(username string) bool {
    // Only alphanumeric and underscore, 3-20 chars
    re := regexp.MustCompile(`^[a-zA-Z0-9_]{3,20}$`)
    return re.MatchString(username)
}

func SanitizeFilename(filename string) string {
    // Remove path traversal attempts
    filename = strings.ReplaceAll(filename, "..", "")
    filename = strings.ReplaceAll(filename, "/", "")
    filename = strings.ReplaceAll(filename, "\\", "")
    
    return filename
}

// Usage
func createUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "Invalid input"})
        return
    }
    
    // Validate email
    if !ValidateEmail(req.Email) {
        c.JSON(400, gin.H{"error": "Invalid email"})
        return
    }
    
    // Sanitize name
    req.Name = SanitizeString(req.Name)
    
    // Proceed...
}
```

## Password Security

### Never Store Plain Text Passwords

```go
package auth

import (
    "golang.org/x/crypto/bcrypt"
)

// Hash password
func HashPassword(password string) (string, error) {
    // Cost 14 (2^14 iterations)
    hash, err := bcrypt.GenerateFromPassword([]byte(password), 14)
    if err != nil {
        return "", err
    }
    
    return string(hash), nil
}

// Verify password
func VerifyPassword(hashedPassword, password string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
    return err == nil
}

// Usage
func register(c *gin.Context) {
    var req RegisterRequest
    c.ShouldBindJSON(&req)
    
    // Hash password
    hashedPassword, err := HashPassword(req.Password)
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to hash password"})
        return
    }
    
    user := User{
        Email:    req.Email,
        Password: hashedPassword, // Store hashed, not plain
    }
    
    db.Create(&user)
    c.JSON(201, user)
}

func login(c *gin.Context) {
    var req LoginRequest
    c.ShouldBindJSON(&req)
    
    // Get user
    var user User
    if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }
    
    // Verify password
    if !VerifyPassword(user.Password, req.Password) {
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }
    
    // Generate token
    token := generateJWT(user.ID)
    c.JSON(200, gin.H{"token": token})
}
```

### Password Strength Validation

```go
package validation

import (
    "errors"
    "regexp"
)

func ValidatePasswordStrength(password string) error {
    if len(password) < 8 {
        return errors.New("password must be at least 8 characters")
    }
    
    if len(password) > 100 {
        return errors.New("password too long")
    }
    
    var (
        hasUpper   = regexp.MustCompile(`[A-Z]`).MatchString
        hasLower   = regexp.MustCompile(`[a-z]`).MatchString
        hasNumber  = regexp.MustCompile(`[0-9]`).MatchString
        hasSpecial = regexp.MustCompile(`[!@#$%^&*(),.?":{}|<>]`).MatchString
    )
    
    if !hasUpper(password) {
        return errors.New("password must contain uppercase letter")
    }
    
    if !hasLower(password) {
        return errors.New("password must contain lowercase letter")
    }
    
    if !hasNumber(password) {
        return errors.New("password must contain number")
    }
    
    if !hasSpecial(password) {
        return errors.New("password must contain special character")
    }
    
    return nil
}
```

## JWT Security

### Secure JWT Implementation

```go
package auth

import (
    "errors"
    "time"
    
    "github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("your-256-bit-secret-here") // Load from env

type Claims struct {
    UserID int    `json:"user_id"`
    Email  string `json:"email"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

func GenerateToken(userID int, email, role string) (string, error) {
    claims := Claims{
        UserID: userID,
        Email:  email,
        Role:   role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "my-app",
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}

func ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        // Verify signing method
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("invalid signing method")
        }
        return jwtSecret, nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }
    
    return nil, errors.New("invalid token")
}
```

### Secure JWT Middleware

```go
package middleware

import (
    "strings"
    
    "github.com/gin-gonic/gin"
)

func JWTAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{"error": "Authorization header required"})
            c.Abort()
            return
        }
        
        // Extract token
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.JSON(401, gin.H{"error": "Invalid authorization format"})
            c.Abort()
            return
        }
        
        tokenString := parts[1]
        
        // Validate token
        claims, err := auth.ValidateToken(tokenString)
        if err != nil {
            c.JSON(401, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }
        
        // Store claims in context
        c.Set("user_id", claims.UserID)
        c.Set("user_email", claims.Email)
        c.Set("user_role", claims.Role)
        
        c.Next()
    }
}

// Usage
r.GET("/profile", middleware.JWTAuth(), func(c *gin.Context) {
    userID := c.GetInt("user_id")
    // Use userID
})
```

## CORS Configuration

```go
package main

import (
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()
    
    // CORS middleware
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"https://example.com", "https://app.example.com"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
        AllowHeaders:     []string{"Authorization", "Content-Type"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }))
    
    // Routes
    r.Run(":8080")
}

// Development (less restrictive)
func developmentCORS() gin.HandlerFunc {
    return cors.New(cors.Config{
        AllowOrigins:     []string{"*"},
        AllowMethods:     []string{"*"},
        AllowHeaders:     []string{"*"},
        AllowCredentials: false,
    })
}
```

## Rate Limiting

Prevent brute force and DoS attacks.

```bash
go get github.com/ulule/limiter/v3
```

```go
package middleware

import (
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/ulule/limiter/v3"
    "github.com/ulule/limiter/v3/drivers/middleware/gin"
    "github.com/ulule/limiter/v3/drivers/store/memory"
)

func RateLimiter() gin.HandlerFunc {
    // 100 requests per minute
    rate := limiter.Rate{
        Period: 1 * time.Minute,
        Limit:  100,
    }
    
    store := memory.NewStore()
    middleware := gin.NewMiddleware(limiter.New(store, rate))
    
    return middleware
}

// Different limits for different endpoints
func LoginRateLimiter() gin.HandlerFunc {
    // 5 login attempts per minute
    rate := limiter.Rate{
        Period: 1 * time.Minute,
        Limit:  5,
    }
    
    store := memory.NewStore()
    return gin.NewMiddleware(limiter.New(store, rate))
}

// Usage
r.POST("/login", LoginRateLimiter(), loginHandler)
r.Use(RateLimiter()) // Global rate limit
```

## XSS Prevention

### Escape User Content

```go
package main

import (
    "html/template"
)

func renderTemplate(c *gin.Context) {
    userInput := c.Query("name")
    
    // Automatically escapes HTML
    tmpl := template.Must(template.New("page").Parse(`
        <h1>Hello, {{.Name}}</h1>
    `))
    
    tmpl.Execute(c.Writer, map[string]string{
        "Name": userInput, // Automatically escaped
    })
}

// For JSON responses (already safe)
func getPost(c *gin.Context) {
    var post Post
    db.First(&post, c.Param("id"))
    
    // Gin automatically escapes JSON
    c.JSON(200, post) // Safe
}
```

### Content Security Policy

```go
package middleware

import (
    "github.com/gin-gonic/gin"
)

func SecurityHeaders() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Prevent XSS
        c.Header("Content-Security-Policy", "default-src 'self'")
        
        // Prevent clickjacking
        c.Header("X-Frame-Options", "DENY")
        
        // Prevent MIME sniffing
        c.Header("X-Content-Type-Options", "nosniff")
        
        // Enable XSS filter
        c.Header("X-XSS-Protection", "1; mode=block")
        
        // HTTPS only
        c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        
        c.Next()
    }
}

// Usage
r.Use(SecurityHeaders())
```

## CSRF Protection

```bash
go get github.com/utrack/gin-csrf
```

```go
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/utrack/gin-csrf"
)

func main() {
    r := gin.Default()
    
    // CSRF middleware
    r.Use(csrf.Middleware(csrf.Options{
        Secret: "your-secret-key-32-chars-long",
        ErrorFunc: func(c *gin.Context) {
            c.JSON(403, gin.H{"error": "CSRF token invalid"})
            c.Abort()
        },
    }))
    
    // Return CSRF token
    r.GET("/csrf-token", func(c *gin.Context) {
        c.JSON(200, gin.H{"csrf_token": csrf.GetToken(c)})
    })
    
    // Protected route
    r.POST("/transfer", func(c *gin.Context) {
        // Automatically validated by middleware
        // Process transfer
    })
    
    r.Run(":8080")
}
```

## Secrets Management

### Never Hardcode Secrets

```go
// BAD
var dbPassword = "mypassword123"
var jwtSecret = "supersecret"
var apiKey = "sk_live_123456"

// GOOD
var dbPassword = os.Getenv("DB_PASSWORD")
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))
var apiKey = os.Getenv("API_KEY")
```

### Use .env Files

```bash
go get github.com/joho/godotenv
```

```go
package main

import (
    "log"
    "os"
    
    "github.com/joho/godotenv"
)

func init() {
    // Load .env file
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found")
    }
}

func main() {
    dbHost := os.Getenv("DB_HOST")
    dbPassword := os.Getenv("DB_PASSWORD")
    jwtSecret := os.Getenv("JWT_SECRET")
    
    // Use secrets
}
```

`.env`:
```
DB_HOST=localhost
DB_PASSWORD=SecurePassword123!
JWT_SECRET=your-256-bit-secret-here
API_KEY=sk_live_123456
```

## Logging Securely

### Never Log Sensitive Data

```go
package logging

import (
    "log"
)

// BAD
func loginUser(email, password string) {
    log.Printf("Login attempt: email=%s, password=%s", email, password) // NEVER!
}

// GOOD
func loginUserSecure(email, password string) {
    log.Printf("Login attempt: email=%s", email) // No password
    
    // Or hash sensitive data
    log.Printf("Login attempt: email=%s, password_hash=%s", email, hashForLogging(password))
}

func hashForLogging(data string) string {
    h := sha256.Sum256([]byte(data))
    return hex.EncodeToString(h[:])[:8] // First 8 chars
}
```

## File Upload Security

```go
package upload

import (
    "errors"
    "mime/multipart"
    "path/filepath"
    "strings"
)

func ValidateUpload(file *multipart.FileHeader) error {
    // Max size (5MB)
    if file.Size > 5*1024*1024 {
        return errors.New("file too large")
    }
    
    // Allowed extensions
    ext := strings.ToLower(filepath.Ext(file.Filename))
    allowed := map[string]bool{
        ".jpg":  true,
        ".jpeg": true,
        ".png":  true,
        ".pdf":  true,
    }
    
    if !allowed[ext] {
        return errors.New("file type not allowed")
    }
    
    // Sanitize filename (prevent path traversal)
    filename := filepath.Base(file.Filename)
    if strings.Contains(filename, "..") {
        return errors.New("invalid filename")
    }
    
    return nil
}
```

## Best Practices Checklist

- [ ] Use parameterized queries (prevent SQL injection)
- [ ] Hash passwords with bcrypt (cost >= 12)
- [ ] Validate and sanitize all input
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Set security headers (CSP, X-Frame-Options, etc.)
- [ ] Use CORS properly
- [ ] Store secrets in environment variables
- [ ] Never log sensitive data
- [ ] Validate file uploads
- [ ] Use JWT with expiration
- [ ] Implement CSRF protection for state-changing operations
- [ ] Keep dependencies updated
- [ ] Run security scans (gosec, Snyk)

## Security Scanning

```bash
# Install gosec
go install github.com/securego/gosec/v2/cmd/gosec@latest

# Run security scan
gosec ./...

# Output
[HIGH] G104: Errors unhandled
[MEDIUM] G401: Use of weak cryptographic primitive
```

## Summary

Security requires:
- **Input Validation**: Never trust user input
- **Authentication**: Strong passwords, secure tokens
- **Authorization**: Verify permissions
- **Encryption**: HTTPS, bcrypt, secure secrets
- **Headers**: CSP, CORS, security headers
- **Monitoring**: Rate limiting, logging, alerts

Essential for protecting user data and system integrity.
