# REST (Representational State Transfer)

## What is REST?

Imagine you're at a restaurant. You don't go into the kitchen and cook your own food. Instead, you look at a menu (available resources), tell the waiter what you want (make a request), and the waiter brings you your food (sends a response). REST works the same way for computer programs.

REST is an **architectural style** (a set of design principles) for building web services where everything is treated as a "resource" that can be accessed through standard web URLs.

## How It Came to Be

**Timeline:**
- **2000**: Roy Fielding introduced REST in his PhD dissertation
- **Context**: The web was growing rapidly, and developers needed a simpler way to build APIs compared to SOAP
- **Inspiration**: Based on the principles that made the World Wide Web successful

**The Problem It Solved:**

Before REST, APIs were complex:
- **SOAP** required tons of XML configuration and was heavyweight
- No standard way to organize web services
- Developers reinvented the wheel for each API

REST said: "Let's use the web the way it was designed to work!"

## Core Principles (The 6 Constraints)

1. **Client-Server Separation**: Your phone app (client) is separate from the backend server
2. **Stateless**: Each request contains ALL information needed (server doesn't remember you)
3. **Cacheable**: Responses can be stored to speed things up
4. **Uniform Interface**: Standard ways to interact (HTTP methods)
5. **Layered System**: Can have proxies, load balancers in between
6. **Code on Demand (Optional)**: Server can send executable code (like JavaScript)

## How REST Works

**The Building Blocks:**

1. **Resources**: Everything is a "thing" with a URL
   - User: `/users/123`
   - Product: `/products/456`
   - Order: `/orders/789`

2. **HTTP Methods** (Verbs):
   - `GET`: Read/retrieve data (like browsing a catalog)
   - `POST`: Create new data (like placing an order)
   - `PUT`: Update/replace data (like changing your entire address)
   - `PATCH`: Partially update data (like just changing your phone number)
   - `DELETE`: Remove data (like canceling an order)

3. **Status Codes** (Restaurant analogy):
   - `200 OK`: Here's your food! (Success)
   - `201 Created`: We made your custom dish! (Resource created)
   - `400 Bad Request`: We don't understand your order (Client error)
   - `404 Not Found`: That dish isn't on our menu (Resource doesn't exist)
   - `500 Internal Server Error`: Our kitchen is broken (Server error)

## Example: A Blog API

```
GET    /posts           → Get all blog posts
GET    /posts/5         → Get blog post #5
POST   /posts           → Create a new blog post
PUT    /posts/5         → Replace blog post #5 completely
PATCH  /posts/5         → Update part of blog post #5
DELETE /posts/5         → Delete blog post #5
GET    /posts/5/comments → Get all comments on post #5
```

## Pros and Cons

### ✅ Pros

1. **Simple and Intuitive**: Uses familiar HTTP protocols
2. **Flexible**: Works with any data format (JSON, XML, HTML)
3. **Scalable**: Stateless nature makes it easy to scale horizontally
4. **Cacheable**: Built-in HTTP caching improves performance
5. **Widely Supported**: Every programming language has HTTP libraries
6. **Browser-Friendly**: Can test APIs directly in browsers
7. **Loosely Coupled**: Client and server can evolve independently

### ❌ Cons

1. **Over-fetching**: Getting more data than you need (whole user object when you just want the name)
2. **Under-fetching**: Need multiple requests to get related data (user, then posts, then comments)
3. **No Standard Schema**: Unlike GraphQL or gRPC, no built-in way to describe your API
4. **Versioning Challenges**: Hard to manage API changes over time
5. **Limited Real-time**: Not designed for live updates (need WebSockets)
6. **Inconsistent Implementations**: "RESTful" means different things to different people
7. **No Built-in Type Safety**: Easy to make mistakes with field names/types

## When to Use REST

### ✅ Great For:

- **Public APIs**: Easy for third parties to integrate
- **CRUD Operations**: Simple Create, Read, Update, Delete workflows
- **Microservices**: Service-to-service communication
- **Mobile Apps**: When you need caching and offline support
- **Web Applications**: Traditional web backends
- **Resource-Oriented Systems**: When your domain maps well to resources

### ❌ Not Ideal For:

- **Real-time Applications**: Chat, live dashboards (use WebSockets)
- **Complex Queries**: When you need very specific data (consider GraphQL)
- **High-Performance RPC**: Internal microservices with strict performance needs (consider gRPC)
- **Bi-directional Streaming**: Continuous data flow in both directions

## Implementation Examples

### Python Implementation (Flask)

```python
from flask import Flask, jsonify, request
from dataclasses import dataclass
from typing import List, Optional
import uuid

app = Flask(__name__)

# Simple in-memory database
posts = {}

@dataclass
class Post:
    id: str
    title: str
    content: str
    author: str
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'author': self.author
        }

# GET all posts
@app.route('/api/posts', methods=['GET'])
def get_posts():
    """
    Retrieve all blog posts
    Query params: ?author=john (optional filtering)
    """
    author = request.args.get('author')
    
    result = list(posts.values())
    
    if author:
        result = [p for p in result if p.author == author]
    
    return jsonify([p.to_dict() for p in result]), 200

# GET single post
@app.route('/api/posts/<post_id>', methods=['GET'])
def get_post(post_id):
    """Retrieve a specific blog post by ID"""
    post = posts.get(post_id)
    
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    
    return jsonify(post.to_dict()), 200

# POST - Create new post
@app.route('/api/posts', methods=['POST'])
def create_post():
    """
    Create a new blog post
    Body: {"title": "...", "content": "...", "author": "..."}
    """
    data = request.get_json()
    
    # Validation
    if not data or not all(k in data for k in ['title', 'content', 'author']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Create post
    post_id = str(uuid.uuid4())
    post = Post(
        id=post_id,
        title=data['title'],
        content=data['content'],
        author=data['author']
    )
    
    posts[post_id] = post
    
    return jsonify(post.to_dict()), 201

# PUT - Replace entire post
@app.route('/api/posts/<post_id>', methods=['PUT'])
def update_post(post_id):
    """
    Replace an entire blog post
    Body: {"title": "...", "content": "...", "author": "..."}
    """
    if post_id not in posts:
        return jsonify({'error': 'Post not found'}), 404
    
    data = request.get_json()
    
    if not data or not all(k in data for k in ['title', 'content', 'author']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Replace the post
    posts[post_id] = Post(
        id=post_id,
        title=data['title'],
        content=data['content'],
        author=data['author']
    )
    
    return jsonify(posts[post_id].to_dict()), 200

# PATCH - Partially update post
@app.route('/api/posts/<post_id>', methods=['PATCH'])
def patch_post(post_id):
    """
    Partially update a blog post
    Body: {"title": "new title"} (only fields you want to change)
    """
    post = posts.get(post_id)
    
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    
    data = request.get_json()
    
    # Update only provided fields
    if 'title' in data:
        post.title = data['title']
    if 'content' in data:
        post.content = data['content']
    if 'author' in data:
        post.author = data['author']
    
    return jsonify(post.to_dict()), 200

# DELETE post
@app.route('/api/posts/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    """Delete a blog post"""
    if post_id not in posts:
        return jsonify({'error': 'Post not found'}), 404
    
    del posts[post_id]
    
    return '', 204  # No content

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

### Go Implementation (Using Gin)

```go
package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Post represents a blog post
type Post struct {
	ID      string `json:"id"`
	Title   string `json:"title" binding:"required"`
	Content string `json:"content" binding:"required"`
	Author  string `json:"author" binding:"required"`
}

// In-memory database
var posts = make(map[string]Post)

func main() {
	router := gin.Default()
	
	// API routes
	api := router.Group("/api")
	{
		api.GET("/posts", getPosts)
		api.GET("/posts/:id", getPost)
		api.POST("/posts", createPost)
		api.PUT("/posts/:id", updatePost)
		api.PATCH("/posts/:id", patchPost)
		api.DELETE("/posts/:id", deletePost)
	}
	
	router.Run(":8080")
}

// GET all posts
func getPosts(c *gin.Context) {
	author := c.Query("author") // Optional filter
	
	result := []Post{}
	
	for _, post := range posts {
		if author == "" || post.Author == author {
			result = append(result, post)
		}
	}
	
	c.JSON(http.StatusOK, result)
}

// GET single post
func getPost(c *gin.Context) {
	id := c.Param("id")
	
	post, exists := posts[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}
	
	c.JSON(http.StatusOK, post)
}

// POST - Create new post
func createPost(c *gin.Context) {
	var newPost Post
	
	// Bind and validate JSON
	if err := c.ShouldBindJSON(&newPost); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Generate ID
	newPost.ID = uuid.New().String()
	
	// Save to database
	posts[newPost.ID] = newPost
	
	c.JSON(http.StatusCreated, newPost)
}

// PUT - Replace entire post
func updatePost(c *gin.Context) {
	id := c.Param("id")
	
	// Check if exists
	if _, exists := posts[id]; !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}
	
	var updatedPost Post
	if err := c.ShouldBindJSON(&updatedPost); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Keep the same ID
	updatedPost.ID = id
	posts[id] = updatedPost
	
	c.JSON(http.StatusOK, updatedPost)
}

// PATCH - Partially update post
func patchPost(c *gin.Context) {
	id := c.Param("id")
	
	post, exists := posts[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}
	
	// Partial update struct
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Update only provided fields
	if title, ok := updates["title"].(string); ok {
		post.Title = title
	}
	if content, ok := updates["content"].(string); ok {
		post.Content = content
	}
	if author, ok := updates["author"].(string); ok {
		post.Author = author
	}
	
	posts[id] = post
	c.JSON(http.StatusOK, post)
}

// DELETE post
func deletePost(c *gin.Context) {
	id := c.Param("id")
	
	if _, exists := posts[id]; !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}
	
	delete(posts, id)
	c.Status(http.StatusNoContent)
}
```

## Best Practices for REST APIs

### 1. Use Nouns, Not Verbs in URLs
```
✅ Good: GET /users/123
❌ Bad:  GET /getUser?id=123
```

### 2. Use Plural Nouns for Collections
```
✅ Good: GET /users
❌ Bad:  GET /user
```

### 3. Use HTTP Status Codes Correctly
- `200`: Success (GET, PUT, PATCH)
- `201`: Created (POST)
- `204`: No Content (DELETE)
- `400`: Bad Request (validation failed)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (logged in but no permission)
- `404`: Not Found
- `500`: Server Error

### 4. Version Your API
```
/api/v1/users
/api/v2/users
```

### 5. Use Query Parameters for Filtering/Sorting
```
GET /posts?author=john&sort=date&limit=10
```

### 6. Return Meaningful Error Messages
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "age": "Must be at least 18"
  }
}
```

### 7. Use HATEOAS (Advanced)
Include links to related resources:
```json
{
  "id": "123",
  "title": "My Post",
  "links": {
    "self": "/posts/123",
    "author": "/users/456",
    "comments": "/posts/123/comments"
  }
}
```

## Alternatives to REST

| When REST Falls Short | Consider Instead |
|----------------------|------------------|
| Need real-time updates | WebSockets, SSE |
| Complex nested queries | GraphQL |
| Internal microservices with high performance needs | gRPC |
| Type safety across client/server | tRPC, gRPC |
| Specific data requirements (avoid over-fetching) | GraphQL |

## Common REST Anti-Patterns to Avoid

1. **Using GET for State-Changing Operations**
   - ❌ `GET /deleteUser?id=123`
   - ✅ `DELETE /users/123`

2. **Ignoring HTTP Methods**
   - ❌ Everything as POST
   - ✅ Use appropriate HTTP verbs

3. **Not Using Status Codes**
   - ❌ Always returning 200 with error in body
   - ✅ Return proper status codes

4. **Deep Nesting**
   - ❌ `/companies/123/departments/456/teams/789/members/000`
   - ✅ `/members/000?team=789` or direct resource access

5. **Storing State on Server**
   - ❌ Session-dependent APIs
   - ✅ Stateless with tokens (JWT)

## Real-World Examples

- **Twitter API**: `GET /tweets/:id`, `POST /tweets`
- **GitHub API**: `GET /repos/:owner/:repo`, `POST /repos/:owner/:repo/issues`
- **Stripe API**: `POST /v1/charges`, `GET /v1/customers/:id`
- **Google Maps API**: `GET /maps/api/geocode/json?address=...`

## Further Learning Resources

- **Richardson Maturity Model**: Levels of REST compliance (0-3)
- **OpenAPI/Swagger**: Documenting REST APIs
- **REST vs RESTful**: Understanding the difference
- **API Design Patterns**: Collections, pagination, filtering

## Key Takeaway

REST is like a universal language for web services. It's not perfect, but it's simple, flexible, and gets the job done for most use cases. Think of it as the "standard English" of APIs – everyone understands it, even if there are more specialized languages for specific situations.
