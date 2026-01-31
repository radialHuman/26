# JWT Authentication

## What is JWT?

**JSON Web Token (JWT)** is a compact, URL-safe token format for securely transmitting information between parties as a JSON object. JWTs are commonly used for authentication and authorization in web applications.

## JWT Structure

A JWT consists of three Base64URL-encoded parts separated by dots:

```
header.payload.signature
```

### Example JWT

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### Parts Breakdown

1. **Header**: Algorithm and token type
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

2. **Payload**: Claims (data)
```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022,
  "exp": 1516242622
}
```

3. **Signature**: Verification signature
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

## Why Use JWT?

- **Stateless**: No server-side session storage
- **Scalable**: Works across distributed systems
- **Self-Contained**: Carries all necessary information
- **Secure**: Cryptographically signed
- **Standard**: RFC 7519 specification

## Basic JWT Implementation

### Using golang-jwt/jwt

```go
package main

import (
    "fmt"
    "time"
    
    "github.com/golang-jwt/jwt/v5"
)

// Secret key for signing
var jwtSecret = []byte("your-secret-key")

// Custom claims
type Claims struct {
    UserID   int    `json:"user_id"`
    Username string `json:"username"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}

// Generate JWT token
func GenerateToken(userID int, username, role string) (string, error) {
    claims := Claims{
        UserID:   userID,
        Username: username,
        Role:     role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            NotBefore: jwt.NewNumericDate(time.Now()),
            Issuer:    "myapp",
            Subject:   fmt.Sprintf("%d", userID),
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}

// Validate and parse JWT token
func ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        // Validate signing method
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return jwtSecret, nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }
    
    return nil, fmt.Errorf("invalid token")
}

func main() {
    // Generate token
    token, err := GenerateToken(123, "john.doe", "admin")
    if err != nil {
        panic(err)
    }
    
    fmt.Println("Token:", token)
    
    // Validate token
    claims, err := ValidateToken(token)
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("User: %s (ID: %d, Role: %s)\n", claims.Username, claims.UserID, claims.Role)
}
```

## HTTP Middleware Authentication

```go
package main

import (
    "context"
    "net/http"
    "strings"
    
    "github.com/golang-jwt/jwt/v5"
)

type contextKey string

const ClaimsKey contextKey = "claims"

// Authentication middleware
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Extract token from Authorization header
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            http.Error(w, "Missing authorization header", http.StatusUnauthorized)
            return
        }
        
        // Check Bearer prefix
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            http.Error(w, "Invalid authorization header", http.StatusUnauthorized)
            return
        }
        
        tokenString := parts[1]
        
        // Validate token
        claims, err := ValidateToken(tokenString)
        if err != nil {
            http.Error(w, "Invalid token: "+err.Error(), http.StatusUnauthorized)
            return
        }
        
        // Add claims to context
        ctx := context.WithValue(r.Context(), ClaimsKey, claims)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Get claims from context
func GetClaims(r *http.Request) (*Claims, bool) {
    claims, ok := r.Context().Value(ClaimsKey).(*Claims)
    return claims, ok
}

// Protected handler
func protectedHandler(w http.ResponseWriter, r *http.Request) {
    claims, ok := GetClaims(r)
    if !ok {
        http.Error(w, "No claims found", http.StatusUnauthorized)
        return
    }
    
    fmt.Fprintf(w, "Hello, %s! Your role is: %s", claims.Username, claims.Role)
}

func main() {
    mux := http.NewServeMux()
    
    // Public endpoint
    mux.HandleFunc("/login", loginHandler)
    
    // Protected endpoint with middleware
    mux.Handle("/protected", AuthMiddleware(http.HandlerFunc(protectedHandler)))
    
    http.ListenAndServe(":8080", mux)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
    // Validate credentials (simplified)
    username := r.FormValue("username")
    password := r.FormValue("password")
    
    if username == "admin" && password == "secret" {
        token, _ := GenerateToken(1, username, "admin")
        w.Header().Set("Content-Type", "application/json")
        fmt.Fprintf(w, `{"token": "%s"}`, token)
        return
    }
    
    http.Error(w, "Invalid credentials", http.StatusUnauthorized)
}
```

## Gin Framework Integration

```go
package main

import (
    "net/http"
    "strings"
    
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

// Gin middleware
func JWTAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
            c.Abort()
            return
        }
        
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
            c.Abort()
            return
        }
        
        claims, err := ValidateToken(parts[1])
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }
        
        c.Set("claims", claims)
        c.Next()
    }
}

// Role-based access control
func RequireRole(role string) gin.HandlerFunc {
    return func(c *gin.Context) {
        claimsValue, exists := c.Get("claims")
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "No claims found"})
            c.Abort()
            return
        }
        
        claims := claimsValue.(*Claims)
        if claims.Role != role {
            c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
            c.Abort()
            return
        }
        
        c.Next()
    }
}

func main() {
    r := gin.Default()
    
    // Public routes
    r.POST("/login", func(c *gin.Context) {
        var req struct {
            Username string `json:"username" binding:"required"`
            Password string `json:"password" binding:"required"`
        }
        
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        // Validate credentials
        if req.Username == "admin" && req.Password == "secret" {
            token, _ := GenerateToken(1, req.Username, "admin")
            c.JSON(http.StatusOK, gin.H{"token": token})
            return
        }
        
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
    })
    
    // Protected routes
    protected := r.Group("/api")
    protected.Use(JWTAuthMiddleware())
    {
        protected.GET("/profile", func(c *gin.Context) {
            claims := c.MustGet("claims").(*Claims)
            c.JSON(http.StatusOK, gin.H{
                "user_id":  claims.UserID,
                "username": claims.Username,
                "role":     claims.Role,
            })
        })
        
        // Admin-only route
        admin := protected.Group("/admin")
        admin.Use(RequireRole("admin"))
        {
            admin.GET("/users", func(c *gin.Context) {
                c.JSON(http.StatusOK, gin.H{"users": []string{"user1", "user2"}})
            })
        }
    }
    
    r.Run(":8080")
}
```

## Refresh Tokens

```go
package main

import (
    "fmt"
    "time"
    
    "github.com/golang-jwt/jwt/v5"
)

type TokenPair struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
}

// Generate access token (short-lived)
func GenerateAccessToken(userID int, username, role string) (string, error) {
    claims := Claims{
        UserID:   userID,
        Username: username,
        Role:     role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}

// Generate refresh token (long-lived)
func GenerateRefreshToken(userID int) (string, error) {
    claims := jwt.RegisteredClaims{
        Subject:   fmt.Sprintf("%d", userID),
        ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
        IssuedAt:  jwt.NewNumericDate(time.Now()),
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}

// Generate token pair
func GenerateTokenPair(userID int, username, role string) (*TokenPair, error) {
    accessToken, err := GenerateAccessToken(userID, username, role)
    if err != nil {
        return nil, err
    }
    
    refreshToken, err := GenerateRefreshToken(userID)
    if err != nil {
        return nil, err
    }
    
    return &TokenPair{
        AccessToken:  accessToken,
        RefreshToken: refreshToken,
    }, nil
}

// Refresh access token using refresh token
func RefreshAccessToken(refreshTokenString string) (string, error) {
    // Validate refresh token
    token, err := jwt.ParseWithClaims(refreshTokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
        return jwtSecret, nil
    })
    
    if err != nil || !token.Valid {
        return "", fmt.Errorf("invalid refresh token")
    }
    
    claims := token.Claims.(*jwt.RegisteredClaims)
    
    // Get user info from database (simplified)
    userID := claims.Subject
    // userInfo := getUserFromDB(userID)
    
    // Generate new access token
    return GenerateAccessToken(1, "john.doe", "admin")
}
```

## RSA Key Pair (Public/Private Keys)

```go
package main

import (
    "crypto/rsa"
    "crypto/x509"
    "encoding/pem"
    "fmt"
    "os"
    
    "github.com/golang-jwt/jwt/v5"
)

var (
    privateKey *rsa.PrivateKey
    publicKey  *rsa.PublicKey
)

// Load RSA keys
func LoadKeys() error {
    // Load private key
    privateKeyData, err := os.ReadFile("private.pem")
    if err != nil {
        return err
    }
    
    privateBlock, _ := pem.Decode(privateKeyData)
    privateKey, err = x509.ParsePKCS1PrivateKey(privateBlock.Bytes)
    if err != nil {
        return err
    }
    
    // Load public key
    publicKeyData, err := os.ReadFile("public.pem")
    if err != nil {
        return err
    }
    
    publicBlock, _ := pem.Decode(publicKeyData)
    publicKeyInterface, err := x509.ParsePKIXPublicKey(publicBlock.Bytes)
    if err != nil {
        return err
    }
    
    publicKey = publicKeyInterface.(*rsa.PublicKey)
    return nil
}

// Generate token with RSA
func GenerateRSAToken(userID int, username string) (string, error) {
    claims := Claims{
        UserID:   userID,
        Username: username,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
    return token.SignedString(privateKey)
}

// Validate RSA token
func ValidateRSAToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
            return nil, fmt.Errorf("unexpected signing method")
        }
        return publicKey, nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }
    
    return nil, fmt.Errorf("invalid token")
}
```

## Token Blacklisting (Logout)

```go
package main

import (
    "context"
    "time"
    
    "github.com/go-redis/redis/v8"
)

var redisClient *redis.Client

func init() {
    redisClient = redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })
}

// Blacklist token
func BlacklistToken(token string, exp time.Time) error {
    ctx := context.Background()
    ttl := time.Until(exp)
    
    return redisClient.Set(ctx, "blacklist:"+token, "1", ttl).Err()
}

// Check if token is blacklisted
func IsTokenBlacklisted(token string) bool {
    ctx := context.Background()
    _, err := redisClient.Get(ctx, "blacklist:"+token).Result()
    return err == nil
}

// Enhanced validation with blacklist check
func ValidateTokenWithBlacklist(tokenString string) (*Claims, error) {
    // Check blacklist first
    if IsTokenBlacklisted(tokenString) {
        return nil, fmt.Errorf("token has been revoked")
    }
    
    // Validate token
    return ValidateToken(tokenString)
}

// Logout handler
func logoutHandler(w http.ResponseWriter, r *http.Request) {
    authHeader := r.Header.Get("Authorization")
    parts := strings.Split(authHeader, " ")
    
    if len(parts) != 2 {
        http.Error(w, "Invalid header", http.StatusBadRequest)
        return
    }
    
    tokenString := parts[1]
    
    // Parse to get expiration
    claims, err := ValidateToken(tokenString)
    if err != nil {
        http.Error(w, "Invalid token", http.StatusBadRequest)
        return
    }
    
    // Blacklist token
    if err := BlacklistToken(tokenString, claims.ExpiresAt.Time); err != nil {
        http.Error(w, "Failed to logout", http.StatusInternalServerError)
        return
    }
    
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("Logged out successfully"))
}
```

## Best Practices

### 1. Use Strong Secrets

```go
// Generate secure random secret
import "crypto/rand"

func GenerateSecret() ([]byte, error) {
    secret := make([]byte, 32)
    _, err := rand.Read(secret)
    return secret, err
}

// Use environment variables
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))
```

### 2. Set Appropriate Expiration

```go
// Access tokens: 15-30 minutes
ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute))

// Refresh tokens: 7-30 days
ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour))
```

### 3. Validate All Claims

```go
func ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        // 1. Check signing method
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method")
        }
        return jwtSecret, nil
    })
    
    if err != nil {
        return nil, err
    }
    
    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, fmt.Errorf("invalid token")
    }
    
    // 2. Check expiration (already done by jwt library)
    // 3. Check custom claims
    if claims.Role == "" {
        return nil, fmt.Errorf("missing role claim")
    }
    
    return claims, nil
}
```

### 4. Use HTTPS

Always transmit JWTs over HTTPS to prevent token interception.

### 5. Store Tokens Securely

```javascript
// Frontend: Use httpOnly cookies
// Backend: Set cookie
http.SetCookie(w, &http.Cookie{
    Name:     "token",
    Value:    tokenString,
    HttpOnly: true,  // Prevent XSS
    Secure:   true,  // HTTPS only
    SameSite: http.SameSiteStrictMode,
    MaxAge:   3600,
})
```

## Common Pitfalls

❌ **Don't store sensitive data in JWT**
```go
// Bad: Sensitive info visible
claims := Claims{
    Password: "secret123", // Don't do this!
}
```

❌ **Don't use weak secrets**
```go
// Bad: Predictable secret
var jwtSecret = []byte("secret")
```

❌ **Don't ignore token expiration**
```go
// Bad: No expiration check
token, _ := jwt.Parse(tokenString, keyFunc)
// Always check token.Valid and ExpiresAt
```

## Summary

JWT authentication provides:
- **Stateless**: No server-side sessions
- **Scalable**: Works across services
- **Flexible**: Custom claims
- **Secure**: Cryptographically signed

Use with refresh tokens, proper expiration, and HTTPS for production.
