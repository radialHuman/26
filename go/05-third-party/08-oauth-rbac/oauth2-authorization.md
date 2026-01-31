# OAuth2 and RBAC Authorization

## What is OAuth2?

**OAuth2** is an authorization framework for delegated access:
- **Token-Based**: Access tokens instead of credentials
- **Scopes**: Fine-grained permissions
- **Third-Party Access**: Allow apps to access user data
- **Secure**: Never share passwords

## Why OAuth2?

- **Single Sign-On (SSO)**: Login once, access multiple services
- **Third-Party Integration**: Google/GitHub login
- **API Security**: Protect resources with access tokens
- **Granular Permissions**: Scopes limit what apps can do

## OAuth2 Flows

### Authorization Code Flow
Most secure, for server-side apps.

### Client Credentials Flow
For machine-to-machine (M2M) communication.

### Password Grant Flow
For trusted first-party apps (deprecated).

### Refresh Token Flow
Obtain new access tokens without re-authentication.

## Installation

```bash
go get golang.org/x/oauth2
go get github.com/coreos/go-oidc/v3/oidc
go get github.com/golang-jwt/jwt/v5
```

## OAuth2 Authorization Code Flow

```go
package auth

import (
    "context"
    "encoding/json"
    "net/http"
    
    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
)

var googleOauthConfig = &oauth2.Config{
    ClientID:     "your-client-id",
    ClientSecret: "your-client-secret",
    RedirectURL:  "http://localhost:8080/callback",
    Scopes: []string{
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
    },
    Endpoint: google.Endpoint,
}

// Step 1: Redirect user to Google
func HandleLogin(w http.ResponseWriter, r *http.Request) {
    state := generateRandomState() // CSRF protection
    
    // Store state in session
    session, _ := store.Get(r, "session")
    session.Values["oauth_state"] = state
    session.Save(r, w)
    
    // Generate authorization URL
    url := googleOauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
    http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// Step 2: Handle OAuth callback
func HandleCallback(w http.ResponseWriter, r *http.Request) {
    // Verify state (CSRF protection)
    session, _ := store.Get(r, "session")
    savedState := session.Values["oauth_state"].(string)
    
    if r.FormValue("state") != savedState {
        http.Error(w, "Invalid state", http.StatusBadRequest)
        return
    }
    
    // Exchange authorization code for access token
    code := r.FormValue("code")
    token, err := googleOauthConfig.Exchange(context.Background(), code)
    if err != nil {
        http.Error(w, "Failed to exchange token", http.StatusInternalServerError)
        return
    }
    
    // Get user info
    client := googleOauthConfig.Client(context.Background(), token)
    resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
    if err != nil {
        http.Error(w, "Failed to get user info", http.StatusInternalServerError)
        return
    }
    defer resp.Body.Close()
    
    var userInfo GoogleUser
    json.NewDecoder(resp.Body).Decode(&userInfo)
    
    // Create session
    createUserSession(w, r, &userInfo, token)
    
    http.Redirect(w, r, "/dashboard", http.StatusFound)
}

type GoogleUser struct {
    ID            string `json:"id"`
    Email         string `json:"email"`
    VerifiedEmail bool   `json:"verified_email"`
    Name          string `json:"name"`
    Picture       string `json:"picture"`
}
```

## GitHub OAuth Example

```go
package auth

import (
    "golang.org/x/oauth2"
    "golang.org/x/oauth2/github"
)

var githubOauthConfig = &oauth2.Config{
    ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
    ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
    RedirectURL:  "http://localhost:8080/auth/github/callback",
    Scopes:       []string{"user:email", "read:user"},
    Endpoint:     github.Endpoint,
}

func HandleGitHubLogin(w http.ResponseWriter, r *http.Request) {
    state := generateRandomState()
    storeState(w, r, state)
    
    url := githubOauthConfig.AuthCodeURL(state)
    http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func HandleGitHubCallback(w http.ResponseWriter, r *http.Request) {
    if !verifyState(r) {
        http.Error(w, "Invalid state", http.StatusBadRequest)
        return
    }
    
    token, err := githubOauthConfig.Exchange(context.Background(), r.FormValue("code"))
    if err != nil {
        http.Error(w, "Failed to exchange token", http.StatusInternalServerError)
        return
    }
    
    // Get GitHub user
    client := githubOauthConfig.Client(context.Background(), token)
    resp, _ := client.Get("https://api.github.com/user")
    defer resp.Body.Close()
    
    var githubUser struct {
        ID    int    `json:"id"`
        Login string `json:"login"`
        Email string `json:"email"`
        Name  string `json:"name"`
    }
    json.NewDecoder(resp.Body).Decode(&githubUser)
    
    // Create user in database if not exists
    user := findOrCreateUser(githubUser.Email, githubUser.Name)
    
    // Create JWT session
    jwtToken := generateJWT(user)
    
    http.SetCookie(w, &http.Cookie{
        Name:     "token",
        Value:    jwtToken,
        Path:     "/",
        HttpOnly: true,
        Secure:   true,
        SameSite: http.SameSiteStrictMode,
    })
    
    http.Redirect(w, r, "/dashboard", http.StatusFound)
}
```

## Client Credentials Flow (M2M)

```go
package auth

import (
    "context"
    
    "golang.org/x/oauth2/clientcredentials"
)

func NewServiceClient() *http.Client {
    config := &clientcredentials.Config{
        ClientID:     os.Getenv("CLIENT_ID"),
        ClientSecret: os.Getenv("CLIENT_SECRET"),
        TokenURL:     "https://oauth2.provider.com/token",
        Scopes:       []string{"api.read", "api.write"},
    }
    
    // Returns HTTP client that automatically handles token refresh
    return config.Client(context.Background())
}

// Usage
func CallProtectedAPI() (*Response, error) {
    client := NewServiceClient()
    
    // Client automatically adds Authorization header
    resp, err := client.Get("https://api.example.com/protected")
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    return parseResponse(resp)
}
```

## OpenID Connect (OIDC)

OAuth2 + Authentication (ID Token).

```go
package auth

import (
    "context"
    
    "github.com/coreos/go-oidc/v3/oidc"
    "golang.org/x/oauth2"
)

type OIDCProvider struct {
    provider     *oidc.Provider
    verifier     *oidc.IDTokenVerifier
    oauth2Config *oauth2.Config
}

func NewOIDCProvider(ctx context.Context, issuerURL, clientID, clientSecret, redirectURL string) (*OIDCProvider, error) {
    provider, err := oidc.NewProvider(ctx, issuerURL)
    if err != nil {
        return nil, err
    }
    
    return &OIDCProvider{
        provider: provider,
        verifier: provider.Verifier(&oidc.Config{ClientID: clientID}),
        oauth2Config: &oauth2.Config{
            ClientID:     clientID,
            ClientSecret: clientSecret,
            RedirectURL:  redirectURL,
            Endpoint:     provider.Endpoint(),
            Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
        },
    }, nil
}

func (op *OIDCProvider) HandleCallback(w http.ResponseWriter, r *http.Request) {
    // Exchange code for token
    oauth2Token, err := op.oauth2Config.Exchange(r.Context(), r.FormValue("code"))
    if err != nil {
        http.Error(w, "Failed to exchange token", http.StatusInternalServerError)
        return
    }
    
    // Extract ID Token
    rawIDToken, ok := oauth2Token.Extra("id_token").(string)
    if !ok {
        http.Error(w, "No id_token", http.StatusInternalServerError)
        return
    }
    
    // Verify ID Token
    idToken, err := op.verifier.Verify(r.Context(), rawIDToken)
    if err != nil {
        http.Error(w, "Failed to verify ID token", http.StatusInternalServerError)
        return
    }
    
    // Extract claims
    var claims struct {
        Email         string `json:"email"`
        EmailVerified bool   `json:"email_verified"`
        Name          string `json:"name"`
        Picture       string `json:"picture"`
    }
    
    if err := idToken.Claims(&claims); err != nil {
        http.Error(w, "Failed to parse claims", http.StatusInternalServerError)
        return
    }
    
    // Create user session
    user := findOrCreateUser(claims.Email, claims.Name)
    createSession(w, r, user)
    
    http.Redirect(w, r, "/dashboard", http.StatusFound)
}
```

## Role-Based Access Control (RBAC)

```go
package rbac

import (
    "errors"
)

type Role string

const (
    RoleAdmin     Role = "admin"
    RoleEditor    Role = "editor"
    RoleViewer    Role = "viewer"
    RoleGuest     Role = "guest"
)

type Permission string

const (
    PermissionCreateUser   Permission = "user:create"
    PermissionReadUser     Permission = "user:read"
    PermissionUpdateUser   Permission = "user:update"
    PermissionDeleteUser   Permission = "user:delete"
    PermissionCreatePost   Permission = "post:create"
    PermissionReadPost     Permission = "post:read"
    PermissionUpdatePost   Permission = "post:update"
    PermissionDeletePost   Permission = "post:delete"
)

var rolePermissions = map[Role][]Permission{
    RoleAdmin: {
        PermissionCreateUser, PermissionReadUser, PermissionUpdateUser, PermissionDeleteUser,
        PermissionCreatePost, PermissionReadPost, PermissionUpdatePost, PermissionDeletePost,
    },
    RoleEditor: {
        PermissionReadUser,
        PermissionCreatePost, PermissionReadPost, PermissionUpdatePost,
    },
    RoleViewer: {
        PermissionReadUser, PermissionReadPost,
    },
    RoleGuest: {
        PermissionReadPost,
    },
}

type User struct {
    ID    string
    Email string
    Roles []Role
}

func (u *User) HasPermission(perm Permission) bool {
    for _, role := range u.Roles {
        perms, ok := rolePermissions[role]
        if !ok {
            continue
        }
        
        for _, p := range perms {
            if p == perm {
                return true
            }
        }
    }
    
    return false
}

func (u *User) HasRole(role Role) bool {
    for _, r := range u.Roles {
        if r == role {
            return true
        }
    }
    return false
}
```

## RBAC Middleware

```go
package middleware

import (
    "github.com/gin-gonic/gin"
)

func RequirePermission(perm Permission) gin.HandlerFunc {
    return func(c *gin.Context) {
        user, exists := c.Get("user")
        if !exists {
            c.JSON(401, gin.H{"error": "Unauthorized"})
            c.Abort()
            return
        }
        
        u := user.(*User)
        if !u.HasPermission(perm) {
            c.JSON(403, gin.H{"error": "Forbidden"})
            c.Abort()
            return
        }
        
        c.Next()
    }
}

func RequireRole(role Role) gin.HandlerFunc {
    return func(c *gin.Context) {
        user, exists := c.Get("user")
        if !exists {
            c.JSON(401, gin.H{"error": "Unauthorized"})
            c.Abort()
            return
        }
        
        u := user.(*User)
        if !u.HasRole(role) {
            c.JSON(403, gin.H{"error": "Forbidden - requires role: " + string(role)})
            c.Abort()
            return
        }
        
        c.Next()
    }
}

// Usage
func SetupRoutes(r *gin.Engine) {
    r.POST("/users", RequirePermission(PermissionCreateUser), createUser)
    r.GET("/users/:id", RequirePermission(PermissionReadUser), getUser)
    r.PUT("/users/:id", RequirePermission(PermissionUpdateUser), updateUser)
    r.DELETE("/users/:id", RequirePermission(PermissionDeleteUser), deleteUser)
    
    r.POST("/admin/settings", RequireRole(RoleAdmin), updateSettings)
}
```

## Attribute-Based Access Control (ABAC)

More flexible than RBAC.

```go
package abac

import (
    "context"
)

type Policy struct {
    Subject  map[string]interface{} // User attributes
    Resource map[string]interface{} // Resource attributes
    Action   string
    Effect   string // "allow" or "deny"
}

type Enforcer struct {
    policies []Policy
}

func NewEnforcer() *Enforcer {
    return &Enforcer{
        policies: []Policy{
            // Users can read their own posts
            {
                Subject:  map[string]interface{}{"role": "user"},
                Resource: map[string]interface{}{"owner": "{user.id}"},
                Action:   "read",
                Effect:   "allow",
            },
            // Admins can do anything
            {
                Subject:  map[string]interface{}{"role": "admin"},
                Resource: map[string]interface{}{},
                Action:   "*",
                Effect:   "allow",
            },
            // Editors can update any post
            {
                Subject:  map[string]interface{}{"role": "editor"},
                Resource: map[string]interface{}{"type": "post"},
                Action:   "update",
                Effect:   "allow",
            },
        },
    }
}

func (e *Enforcer) Enforce(user *User, resource interface{}, action string) bool {
    for _, policy := range e.policies {
        if e.matchPolicy(policy, user, resource, action) {
            return policy.Effect == "allow"
        }
    }
    return false
}

func (e *Enforcer) matchPolicy(policy Policy, user *User, resource interface{}, action string) bool {
    // Match subject
    if role, ok := policy.Subject["role"]; ok {
        if !user.HasRole(Role(role.(string))) && role != "*" {
            return false
        }
    }
    
    // Match action
    if policy.Action != action && policy.Action != "*" {
        return false
    }
    
    // Match resource attributes
    // (simplified - in production, use reflection or type assertions)
    
    return true
}
```

## Casbin Integration

Powerful authorization library.

```bash
go get github.com/casbin/casbin/v2
go get github.com/casbin/gorm-adapter/v3
```

```go
package authorization

import (
    "github.com/casbin/casbin/v2"
    gormadapter "github.com/casbin/gorm-adapter/v3"
    "gorm.io/gorm"
)

func InitCasbin(db *gorm.DB) (*casbin.Enforcer, error) {
    // Use GORM adapter for persistence
    adapter, err := gormadapter.NewAdapterByDB(db)
    if err != nil {
        return nil, err
    }
    
    // Load model from file
    enforcer, err := casbin.NewEnforcer("model.conf", adapter)
    if err != nil {
        return nil, err
    }
    
    // Load policies from database
    enforcer.LoadPolicy()
    
    return enforcer, nil
}

// model.conf
/*
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
*/

// Add policies
func setupPolicies(enforcer *casbin.Enforcer) {
    // Role hierarchy
    enforcer.AddGroupingPolicy("alice", "admin")
    enforcer.AddGroupingPolicy("bob", "editor")
    
    // Permissions
    enforcer.AddPolicy("admin", "/users/*", "*")
    enforcer.AddPolicy("editor", "/posts/*", "read")
    enforcer.AddPolicy("editor", "/posts/*", "write")
    enforcer.AddPolicy("viewer", "/posts/*", "read")
}

// Check permission
func checkPermission(enforcer *casbin.Enforcer, user, resource, action string) bool {
    ok, err := enforcer.Enforce(user, resource, action)
    if err != nil {
        log.Printf("Error checking permission: %v", err)
        return false
    }
    return ok
}

// Middleware
func CasbinMiddleware(enforcer *casbin.Enforcer) gin.HandlerFunc {
    return func(c *gin.Context) {
        user, _ := c.Get("user")
        u := user.(*User)
        
        path := c.Request.URL.Path
        method := c.Request.Method
        
        ok, err := enforcer.Enforce(u.Email, path, method)
        if err != nil {
            c.JSON(500, gin.H{"error": "Authorization error"})
            c.Abort()
            return
        }
        
        if !ok {
            c.JSON(403, gin.H{"error": "Forbidden"})
            c.Abort()
            return
        }
        
        c.Next()
    }
}
```

## Resource-Level Authorization

```go
package service

import (
    "context"
    "errors"
)

type PostService struct {
    db *gorm.DB
}

func (s *PostService) GetPost(ctx context.Context, postID string, user *User) (*Post, error) {
    var post Post
    if err := s.db.First(&post, "id = ?", postID).Error; err != nil {
        return nil, err
    }
    
    // Check if user can read this post
    if !s.canReadPost(user, &post) {
        return nil, errors.New("forbidden")
    }
    
    return &post, nil
}

func (s *PostService) UpdatePost(ctx context.Context, postID string, updates *PostUpdate, user *User) error {
    var post Post
    if err := s.db.First(&post, "id = ?", postID).Error; err != nil {
        return err
    }
    
    // Check if user can update this post
    if !s.canUpdatePost(user, &post) {
        return errors.New("forbidden")
    }
    
    return s.db.Model(&post).Updates(updates).Error
}

func (s *PostService) canReadPost(user *User, post *Post) bool {
    // Public posts: anyone can read
    if post.Visibility == "public" {
        return true
    }
    
    // Private posts: only owner or admin
    if post.Visibility == "private" {
        return post.UserID == user.ID || user.HasRole(RoleAdmin)
    }
    
    return false
}

func (s *PostService) canUpdatePost(user *User, post *Post) bool {
    // Owner can always update
    if post.UserID == user.ID {
        return true
    }
    
    // Admins and editors can update
    return user.HasRole(RoleAdmin) || user.HasRole(RoleEditor)
}
```

## JWT with Roles

```go
package auth

import (
    "time"
    
    "github.com/golang-jwt/jwt/v5"
)

type Claims struct {
    UserID string   `json:"user_id"`
    Email  string   `json:"email"`
    Roles  []string `json:"roles"`
    jwt.RegisteredClaims
}

func GenerateToken(user *User) (string, error) {
    roles := make([]string, len(user.Roles))
    for i, role := range user.Roles {
        roles[i] = string(role)
    }
    
    claims := Claims{
        UserID: user.ID,
        Email:  user.Email,
        Roles:  roles,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "myapp",
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        return []byte(os.Getenv("JWT_SECRET")), nil
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

## Best Practices

1. **Use HTTPS**: Always encrypt OAuth2 flows
2. **State Parameter**: Prevent CSRF attacks
3. **PKCE**: Use for mobile/SPA apps
4. **Short-Lived Tokens**: Access tokens expire quickly
5. **Refresh Tokens**: Rotate and store securely
6. **Scopes**: Request minimal permissions
7. **Validate Tokens**: Always verify signatures
8. **Principle of Least Privilege**: Grant minimum required access
9. **Audit Logs**: Track authorization decisions
10. **Role Hierarchy**: Admin inherits editor permissions

## Summary

OAuth2 and RBAC provide:
- **Secure Authentication**: Token-based access
- **Authorization**: Role and permission-based control
- **Flexibility**: RBAC, ABAC, or Casbin
- **Integration**: Third-party login (Google, GitHub)
- **Scalability**: Centralized permission management

Essential for enterprise applications and multi-tenant systems.
