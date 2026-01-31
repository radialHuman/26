# Pagination Patterns

## What is Pagination?

**Pagination** divides large datasets into smaller pages:
- **Offset-Based**: `LIMIT 20 OFFSET 40` (page 3)
- **Cursor-Based**: `WHERE id > last_id LIMIT 20`
- **Keyset**: `WHERE created_at < last_timestamp LIMIT 20`

## Why Paginate?

Without pagination:
```go
// Returns ALL users (could be millions!)
func getUsers(c *gin.Context) {
    var users []User
    db.Find(&users)
    c.JSON(200, users) // Huge response, slow query, high memory
}
```

With pagination:
```go
// Returns only 20 users
func getUsers(c *gin.Context) {
    page := 1
    perPage := 20
    
    var users []User
    db.Limit(perPage).Offset((page - 1) * perPage).Find(&users)
    c.JSON(200, users) // Fast, efficient
}
```

## Offset-Based Pagination

Most common, simple to implement.

### Basic Implementation

```go
package pagination

import (
    "math"
    "strconv"
    
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type PaginationParams struct {
    Page    int `form:"page" binding:"omitempty,gte=1"`
    PerPage int `form:"per_page" binding:"omitempty,gte=1,lte=100"`
}

type PaginatedResponse struct {
    Data       interface{} `json:"data"`
    Pagination Pagination  `json:"pagination"`
}

type Pagination struct {
    CurrentPage int   `json:"current_page"`
    PerPage     int   `json:"per_page"`
    TotalPages  int   `json:"total_pages"`
    TotalItems  int64 `json:"total_items"`
    HasNext     bool  `json:"has_next"`
    HasPrev     bool  `json:"has_prev"`
}

func GetPaginationParams(c *gin.Context) PaginationParams {
    var params PaginationParams
    
    // Defaults
    params.Page = 1
    params.PerPage = 20
    
    if err := c.ShouldBindQuery(&params); err == nil {
        // Override defaults if provided
        if params.Page < 1 {
            params.Page = 1
        }
        if params.PerPage < 1 || params.PerPage > 100 {
            params.PerPage = 20
        }
    }
    
    return params
}

func Paginate(db *gorm.DB, params PaginationParams, dest interface{}) (*PaginatedResponse, error) {
    var total int64
    
    // Count total items
    if err := db.Count(&total).Error; err != nil {
        return nil, err
    }
    
    // Calculate offset
    offset := (params.Page - 1) * params.PerPage
    
    // Fetch data
    if err := db.Limit(params.PerPage).Offset(offset).Find(dest).Error; err != nil {
        return nil, err
    }
    
    // Calculate total pages
    totalPages := int(math.Ceil(float64(total) / float64(params.PerPage)))
    
    pagination := Pagination{
        CurrentPage: params.Page,
        PerPage:     params.PerPage,
        TotalPages:  totalPages,
        TotalItems:  total,
        HasNext:     params.Page < totalPages,
        HasPrev:     params.Page > 1,
    }
    
    return &PaginatedResponse{
        Data:       dest,
        Pagination: pagination,
    }, nil
}

// Usage
func listUsers(c *gin.Context) {
    params := GetPaginationParams(c)
    
    var users []User
    query := db.Model(&User{})
    
    result, err := Paginate(query, params, &users)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(200, result)
}
```

### With Filters and Sorting

```go
type UserQueryParams struct {
    PaginationParams
    Status  string `form:"status" binding:"omitempty,oneof=active inactive"`
    Search  string `form:"search" binding:"omitempty,min=3"`
    SortBy  string `form:"sort_by" binding:"omitempty,oneof=name email created_at"`
    Order   string `form:"order" binding:"omitempty,oneof=asc desc"`
}

func listUsers(c *gin.Context) {
    var params UserQueryParams
    params.Page = 1
    params.PerPage = 20
    params.SortBy = "created_at"
    params.Order = "desc"
    
    if err := c.ShouldBindQuery(&params); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // Build query
    query := db.Model(&User{})
    
    // Filter by status
    if params.Status != "" {
        query = query.Where("status = ?", params.Status)
    }
    
    // Search
    if params.Search != "" {
        searchTerm := "%" + params.Search + "%"
        query = query.Where("name LIKE ? OR email LIKE ?", searchTerm, searchTerm)
    }
    
    // Sort
    sortClause := params.SortBy + " " + params.Order
    query = query.Order(sortClause)
    
    // Paginate
    var users []User
    result, err := Paginate(query, params.PaginationParams, &users)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(200, result)
}
```

### Response Example

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ],
  "pagination": {
    "current_page": 2,
    "per_page": 20,
    "total_pages": 10,
    "total_items": 198,
    "has_next": true,
    "has_prev": true
  }
}
```

## Cursor-Based Pagination

Better for real-time data and large datasets.

### Implementation

```go
package pagination

import (
    "encoding/base64"
    "encoding/json"
    "strconv"
    
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type CursorParams struct {
    Cursor string `form:"cursor"`
    Limit  int    `form:"limit" binding:"omitempty,gte=1,lte=100"`
}

type CursorResponse struct {
    Data       interface{} `json:"data"`
    NextCursor string      `json:"next_cursor"`
    HasMore    bool        `json:"has_more"`
}

type Cursor struct {
    ID        int    `json:"id"`
    CreatedAt string `json:"created_at"`
}

func EncodeCursor(id int, createdAt string) string {
    cursor := Cursor{
        ID:        id,
        CreatedAt: createdAt,
    }
    
    data, _ := json.Marshal(cursor)
    return base64.StdEncoding.EncodeToString(data)
}

func DecodeCursor(encodedCursor string) (*Cursor, error) {
    data, err := base64.StdEncoding.DecodeString(encodedCursor)
    if err != nil {
        return nil, err
    }
    
    var cursor Cursor
    err = json.Unmarshal(data, &cursor)
    if err != nil {
        return nil, err
    }
    
    return &cursor, nil
}

func GetCursorParams(c *gin.Context) CursorParams {
    var params CursorParams
    params.Limit = 20 // Default
    
    c.ShouldBindQuery(&params)
    
    if params.Limit < 1 || params.Limit > 100 {
        params.Limit = 20
    }
    
    return params
}

// Usage for posts ordered by creation date
func listPosts(c *gin.Context) {
    params := GetCursorParams(c)
    
    query := db.Model(&Post{}).Order("created_at DESC, id DESC")
    
    // Decode cursor
    if params.Cursor != "" {
        cursor, err := DecodeCursor(params.Cursor)
        if err != nil {
            c.JSON(400, gin.H{"error": "Invalid cursor"})
            return
        }
        
        // Fetch records after cursor
        query = query.Where("(created_at < ? OR (created_at = ? AND id < ?))", 
            cursor.CreatedAt, cursor.CreatedAt, cursor.ID)
    }
    
    // Fetch limit + 1 to check if there are more
    var posts []Post
    if err := query.Limit(params.Limit + 1).Find(&posts).Error; err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    hasMore := len(posts) > params.Limit
    if hasMore {
        posts = posts[:params.Limit] // Remove extra item
    }
    
    // Generate next cursor
    var nextCursor string
    if hasMore && len(posts) > 0 {
        lastPost := posts[len(posts)-1]
        nextCursor = EncodeCursor(lastPost.ID, lastPost.CreatedAt.Format(time.RFC3339))
    }
    
    c.JSON(200, CursorResponse{
        Data:       posts,
        NextCursor: nextCursor,
        HasMore:    hasMore,
    })
}
```

### Client Usage

```javascript
// First request
fetch('/api/posts?limit=20')

// Next page (use cursor from previous response)
fetch('/api/posts?limit=20&cursor=eyJpZCI6MTIzLCJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMVQxMjowMDowMFoifQ==')
```

## Keyset Pagination

Efficient for time-series data.

```go
package pagination

import (
    "time"
    
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type KeysetParams struct {
    Since  string `form:"since"` // ISO8601 timestamp
    Until  string `form:"until"` // ISO8601 timestamp
    Limit  int    `form:"limit" binding:"omitempty,gte=1,lte=100"`
}

func listEvents(c *gin.Context) {
    var params KeysetParams
    params.Limit = 50
    
    if err := c.ShouldBindQuery(&params); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    query := db.Model(&Event{}).Order("created_at DESC")
    
    // Filter by time range
    if params.Since != "" {
        since, err := time.Parse(time.RFC3339, params.Since)
        if err == nil {
            query = query.Where("created_at >= ?", since)
        }
    }
    
    if params.Until != "" {
        until, err := time.Parse(time.RFC3339, params.Until)
        if err == nil {
            query = query.Where("created_at <= ?", until)
        }
    }
    
    var events []Event
    if err := query.Limit(params.Limit).Find(&events).Error; err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    // Include timestamps for next request
    var nextSince, nextUntil string
    if len(events) > 0 {
        nextUntil = events[len(events)-1].CreatedAt.Format(time.RFC3339)
    }
    
    c.JSON(200, gin.H{
        "data":       events,
        "next_since": nextSince,
        "next_until": nextUntil,
    })
}
```

## Reusable Middleware

```go
package middleware

import (
    "strconv"
    
    "github.com/gin-gonic/gin"
)

func Pagination() gin.HandlerFunc {
    return func(c *gin.Context) {
        page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
        perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
        
        if page < 1 {
            page = 1
        }
        if perPage < 1 || perPage > 100 {
            perPage = 20
        }
        
        c.Set("page", page)
        c.Set("per_page", perPage)
        c.Set("offset", (page-1)*perPage)
        
        c.Next()
    }
}

// Usage
r.GET("/users", middleware.Pagination(), func(c *gin.Context) {
    page := c.GetInt("page")
    perPage := c.GetInt("per_page")
    offset := c.GetInt("offset")
    
    var users []User
    db.Limit(perPage).Offset(offset).Find(&users)
    
    var total int64
    db.Model(&User{}).Count(&total)
    
    c.JSON(200, gin.H{
        "data":        users,
        "page":        page,
        "per_page":    perPage,
        "total_items": total,
    })
})
```

## GORM Scopes for Pagination

```go
package scopes

import (
    "gorm.io/gorm"
)

func Paginate(page, perPage int) func(db *gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        if page < 1 {
            page = 1
        }
        if perPage < 1 || perPage > 100 {
            perPage = 20
        }
        
        offset := (page - 1) * perPage
        return db.Offset(offset).Limit(perPage)
    }
}

// Usage
var users []User
db.Scopes(Paginate(page, perPage)).Find(&users)

// Combine with other scopes
db.Scopes(
    Paginate(page, perPage),
    FilterByStatus("active"),
    OrderByCreatedAt("desc"),
).Find(&users)
```

## Pagination Links (HATEOAS)

```go
type PaginationLinks struct {
    First string `json:"first,omitempty"`
    Prev  string `json:"prev,omitempty"`
    Next  string `json:"next,omitempty"`
    Last  string `json:"last,omitempty"`
}

func GenerateLinks(c *gin.Context, currentPage, totalPages, perPage int) PaginationLinks {
    baseURL := c.Request.URL.Path
    
    links := PaginationLinks{}
    
    // First page
    links.First = fmt.Sprintf("%s?page=1&per_page=%d", baseURL, perPage)
    
    // Previous page
    if currentPage > 1 {
        links.Prev = fmt.Sprintf("%s?page=%d&per_page=%d", baseURL, currentPage-1, perPage)
    }
    
    // Next page
    if currentPage < totalPages {
        links.Next = fmt.Sprintf("%s?page=%d&per_page=%d", baseURL, currentPage+1, perPage)
    }
    
    // Last page
    links.Last = fmt.Sprintf("%s?page=%d&per_page=%d", baseURL, totalPages, perPage)
    
    return links
}

// Response with links
type PaginatedResponseWithLinks struct {
    Data       interface{}     `json:"data"`
    Pagination Pagination      `json:"pagination"`
    Links      PaginationLinks `json:"links"`
}
```

## Performance Optimization

### 1. Index Pagination Columns

```sql
-- For offset pagination
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- For cursor pagination
CREATE INDEX idx_posts_created_at_id ON posts(created_at DESC, id DESC);

-- For filtered pagination
CREATE INDEX idx_users_status_created_at ON users(status, created_at DESC);
```

### 2. Avoid COUNT(*) for Large Tables

```go
// Instead of accurate count
var total int64
db.Model(&User{}).Count(&total) // Slow on millions of rows

// Use estimated count or cache
cachedTotal := cache.Get("users:total")
if cachedTotal == nil {
    db.Model(&User{}).Count(&total)
    cache.Set("users:total", total, 5*time.Minute)
} else {
    total = cachedTotal.(int64)
}

// Or use "has_more" without total count (cursor pagination)
```

### 3. Select Only Needed Fields

```go
var users []User
db.Select("id", "name", "email").
    Limit(perPage).
    Offset(offset).
    Find(&users)
```

## Best Practices

1. **Default Limits**: Always set reasonable defaults (20-50)
2. **Max Limits**: Prevent excessive requests (max 100)
3. **Use Cursor for Real-Time**: Better for feeds, infinite scroll
4. **Use Offset for Static**: Good for page numbers, reports
5. **Index Wisely**: Index sort and filter columns
6. **Cache Counts**: Cache total counts for large tables
7. **Validate Params**: Sanitize page numbers, limits
8. **Consistent Ordering**: Always include ORDER BY for predictable results

## Summary

Pagination types:
- **Offset**: Simple, page numbers, good for static data
- **Cursor**: Efficient, real-time feeds, no page skipping
- **Keyset**: Time-series, event logs, analytics

Choose based on:
- **Dataset Size**: Offset for small/medium, cursor for large
- **Data Volatility**: Cursor for frequently changing data
- **UI Needs**: Offset for page numbers, cursor for infinite scroll

Essential for scalable APIs.
