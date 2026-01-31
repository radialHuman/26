# API Design: REST, GraphQL & Best Practices

## Table of Contents
1. [REST API Fundamentals](#rest-api-fundamentals)
2. [RESTful Design Principles](#restful-design-principles)
3. [API Versioning](#api-versioning)
4. [Authentication & Authorization](#authentication--authorization)
5. [GraphQL](#graphql)
6. [gRPC](#grpc)
7. [API Documentation](#api-documentation)
8. [Production Best Practices](#production-best-practices)
9. [Complete API Implementation](#complete-api-implementation)

---

## REST API Fundamentals

### What is REST?

**REST** (Representational State Transfer):
- Architectural style for networked applications
- Uses HTTP methods for CRUD operations
- Stateless client-server communication

**Roy Fielding** (2000): Defined REST in his PhD dissertation

**Key Principles**:
```
1. Client-Server: Separation of concerns
2. Stateless: Each request contains all needed info
3. Cacheable: Responses must define if cacheable
4. Uniform Interface: Consistent URL patterns
5. Layered System: Client can't tell if connected directly to server
6. Code on Demand (Optional): Server can send executable code
```

### HTTP Methods

```
GET     - Retrieve resource
POST    - Create resource
PUT     - Update/Replace resource (full)
PATCH   - Update resource (partial)
DELETE  - Delete resource
HEAD    - Same as GET but no response body
OPTIONS - Get supported methods
```

**Idempotency**:
```
Idempotent (same result if called multiple times):
- GET, PUT, DELETE, HEAD, OPTIONS

Non-Idempotent:
- POST (creates new resource each time)
- PATCH (depends on implementation)
```

### HTTP Status Codes

**Success (2xx)**:
```
200 OK              - Success (GET, PUT, PATCH)
201 Created         - Resource created (POST)
204 No Content      - Success but no response body (DELETE)
```

**Client Errors (4xx)**:
```
400 Bad Request     - Invalid syntax
401 Unauthorized    - Authentication required
403 Forbidden       - Authenticated but no permission
404 Not Found       - Resource doesn't exist
409 Conflict        - Conflict with current state (e.g., duplicate)
422 Unprocessable   - Validation error
429 Too Many Requests - Rate limit exceeded
```

**Server Errors (5xx)**:
```
500 Internal Server Error - Generic server error
502 Bad Gateway          - Invalid response from upstream
503 Service Unavailable  - Temporarily down
504 Gateway Timeout      - Upstream timeout
```

---

## RESTful Design Principles

### Resource Naming

**Good Practices**:
```
✅ Use nouns (not verbs)
   GET /users          (not /getUsers)
   POST /orders        (not /createOrder)

✅ Use plural for collections
   GET /users          (not /user)
   
✅ Use hierarchical structure
   GET /users/123/orders
   GET /orders/456/items

✅ Use hyphens (not underscores)
   /user-profiles      (not /user_profiles)

✅ Lowercase URLs
   /users              (not /Users)
```

**Bad Practices**:
```
❌ Verbs in URLs
   /getUser/123
   /createOrder

❌ Mixed singular/plural
   /user/123
   /users/123/order

❌ Deep nesting (>3 levels)
   /users/123/orders/456/items/789/details
```

### URL Examples

**Users Resource**:
```
GET    /users           - List all users
GET    /users/123       - Get user 123
POST   /users           - Create user
PUT    /users/123       - Update user 123 (full replacement)
PATCH  /users/123       - Update user 123 (partial)
DELETE /users/123       - Delete user 123
```

**Nested Resources**:
```
GET /users/123/orders          - Get orders for user 123
POST /users/123/orders         - Create order for user 123
GET /users/123/orders/456      - Get specific order
```

**Filtering, Sorting, Pagination**:
```
GET /users?status=active&role=admin  - Filter
GET /users?sort=created_at&order=desc - Sort
GET /users?page=2&limit=20           - Pagination
GET /users?fields=id,name,email      - Field selection
```

### Request/Response Format

**Request** (Create User):
```http
POST /users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGc...

{
  "name": "Alice",
  "email": "alice@example.com",
  "role": "admin"
}
```

**Response** (Success):
```http
HTTP/1.1 201 Created
Location: /users/123
Content-Type: application/json

{
  "id": 123,
  "name": "Alice",
  "email": "alice@example.com",
  "role": "admin",
  "created_at": "2024-01-01T10:00:00Z"
}
```

**Response** (Error):
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## API Versioning

### Strategies

**1. URL Versioning** (Most Common):
```
GET /v1/users/123
GET /v2/users/123

Pros: Clear, easy to test
Cons: Multiple URLs for same resource
```

**2. Header Versioning**:
```
GET /users/123
Accept: application/vnd.myapp.v1+json

Pros: Clean URLs
Cons: Harder to test, less discoverable
```

**3. Query Parameter**:
```
GET /users/123?version=1

Pros: Easy to implement
Cons: Pollutes query string
```

**Best Practice**: Use URL versioning for major breaking changes.

### Breaking vs Non-Breaking Changes

**Non-Breaking** (No version bump):
```
✅ Adding new endpoints
✅ Adding optional request fields
✅ Adding response fields
✅ Adding new HTTP methods
```

**Breaking** (Requires new version):
```
❌ Removing endpoints
❌ Removing request/response fields
❌ Changing field types
❌ Renaming fields
❌ Changing authentication
```

---

## Authentication & Authorization

### API Key (Simple)

**Request**:
```http
GET /users
X-API-Key: abc123...
```

**Pros**: Simple  
**Cons**: No user context, hard to rotate

**Implementation** (Go):
```go
func apiKeyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("X-API-Key")
		
		if !isValidAPIKey(apiKey) {
			http.Error(w, "Invalid API Key", http.StatusUnauthorized)
			return
		}
		
		next.ServeHTTP(w, r)
	})
}
```

### JWT (JSON Web Token)

**Flow**:
```
1. Client: POST /login (username, password)
2. Server: Returns JWT token
3. Client: GET /users (Authorization: Bearer <token>)
4. Server: Verifies token, returns data
```

**JWT Structure**:
```
eyJhbGc... (Header: algorithm)
.eyJzdWI... (Payload: user data)
.SflKxwR... (Signature: verify integrity)
```

**Implementation** (Python):
```python
import jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key"

def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=1),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        raise Exception("Token expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")

# Usage
@app.route('/login', methods=['POST'])
def login():
    # Verify credentials...
    token = generate_token(user_id=123)
    return jsonify({'token': token})

@app.route('/users', methods=['GET'])
def get_users():
    token = request.headers.get('Authorization').replace('Bearer ', '')
    user_id = verify_token(token)
    # Fetch users...
```

### OAuth 2.0 (Third-Party)

**Flow** (Authorization Code):
```
1. Client: Redirect to /authorize
2. User: Logs in, grants permission
3. Server: Redirects back with code
4. Client: POST /token (code)
5. Server: Returns access_token
6. Client: GET /users (Authorization: Bearer <access_token>)
```

---

## GraphQL

### What is GraphQL?

**Alternative to REST**:
- Client specifies exactly what data it needs
- Single endpoint (`/graphql`)
- Strongly typed schema

**Example**:
```graphql
# Query (Client specifies fields)
query {
  user(id: 123) {
    name
    email
    posts {
      title
      comments {
        text
      }
    }
  }
}

# Response
{
  "data": {
    "user": {
      "name": "Alice",
      "email": "alice@example.com",
      "posts": [
        {
          "title": "Hello World",
          "comments": [
            {"text": "Great post!"}
          ]
        }
      ]
    }
  }
}
```

### GraphQL vs REST

| Aspect | REST | GraphQL |
|--------|------|---------|
| **Endpoints** | Multiple (`/users`, `/posts`) | Single (`/graphql`) |
| **Data Fetching** | Over-fetching / Under-fetching | Precise |
| **Versioning** | URL versioning | Schema evolution |
| **Caching** | HTTP caching | Complex |
| **Learning Curve** | Low | Medium |

**Use REST when**:
- Simple CRUD
- HTTP caching important
- Public API

**Use GraphQL when**:
- Complex, nested data
- Mobile apps (bandwidth-sensitive)
- Rapid iteration

### GraphQL Implementation (Python)

```python
import graphene
from graphene import ObjectType, String, Int, List, Schema

class Comment(ObjectType):
    text = String()

class Post(ObjectType):
    title = String()
    comments = List(Comment)

class User(ObjectType):
    id = Int()
    name = String()
    email = String()
    posts = List(Post)

class Query(ObjectType):
    user = graphene.Field(User, id=Int(required=True))
    
    def resolve_user(self, info, id):
        # Fetch from database
        return {
            'id': id,
            'name': 'Alice',
            'email': 'alice@example.com',
            'posts': [
                {
                    'title': 'Hello World',
                    'comments': [{'text': 'Great!'}]
                }
            ]
        }

schema = Schema(query=Query)

# Execute query
query = '''
    query {
        user(id: 123) {
            name
            posts {
                title
            }
        }
    }
'''
result = schema.execute(query)
print(result.data)
```

---

## API Documentation

### OpenAPI (Swagger)

**Specification** (openapi.yaml):
```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0

servers:
  - url: https://api.example.com/v1

paths:
  /users:
    get:
      summary: List all users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    
    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string
    
    CreateUserRequest:
      type: object
      required:
        - name
        - email
      properties:
        name:
          type: string
        email:
          type: string
          format: email
```

**Auto-Generate Docs** (Python):
```python
from flask import Flask
from flask_restx import Api, Resource, fields

app = Flask(__name__)
api = Api(app, version='1.0', title='User API',
          description='A simple User API')

user_model = api.model('User', {
    'id': fields.Integer,
    'name': fields.String(required=True),
    'email': fields.String(required=True)
})

@api.route('/users')
class UserList(Resource):
    @api.doc('list_users')
    @api.marshal_list_with(user_model)
    def get(self):
        """List all users"""
        return [{'id': 1, 'name': 'Alice', 'email': 'alice@example.com'}]
    
    @api.doc('create_user')
    @api.expect(user_model)
    @api.marshal_with(user_model, code=201)
    def post(self):
        """Create a user"""
        return api.payload, 201

# Access: http://localhost:5000 (Swagger UI auto-generated)
```

---

## Production Best Practices

### Rate Limiting

**Fixed Window**:
```python
from flask import Flask, request, jsonify
from functools import wraps
import time

app = Flask(__name__)

# In-memory store (use Redis in production)
requests_store = {}

def rate_limit(max_requests=10, window=60):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ip = request.remote_addr
            now = int(time.time())
            window_start = now - (now % window)
            
            key = f"{ip}:{window_start}"
            
            if key not in requests_store:
                requests_store[key] = 0
            
            requests_store[key] += 1
            
            if requests_store[key] > max_requests:
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'retry_after': window - (now % window)
                }), 429
            
            return f(*args, **kwargs)
        
        return wrapper
    return decorator

@app.route('/users')
@rate_limit(max_requests=10, window=60)
def get_users():
    return jsonify([{'id': 1, 'name': 'Alice'}])
```

### Pagination

**Offset-based**:
```python
@app.route('/users')
def get_users():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    offset = (page - 1) * limit
    
    users = db.execute("""
        SELECT * FROM users
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    """, limit, offset).fetchall()
    
    return jsonify({
        'data': users,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': db.count_users()
        }
    })
```

**Cursor-based** (Better for large datasets):
```python
@app.route('/users')
def get_users():
    cursor = request.args.get('cursor')  # last_seen_id
    limit = request.args.get('limit', 20, type=int)
    
    if cursor:
        users = db.execute("""
            SELECT * FROM users
            WHERE id > ?
            ORDER BY id
            LIMIT ?
        """, cursor, limit).fetchall()
    else:
        users = db.execute("""
            SELECT * FROM users
            ORDER BY id
            LIMIT ?
        """, limit).fetchall()
    
    next_cursor = users[-1]['id'] if users else None
    
    return jsonify({
        'data': users,
        'next_cursor': next_cursor
    })
```

### Error Handling

**Consistent Error Format**:
```python
from flask import jsonify

class APIError(Exception):
    def __init__(self, message, status_code=400, payload=None):
        self.message = message
        self.status_code = status_code
        self.payload = payload

@app.errorhandler(APIError)
def handle_api_error(error):
    response = {
        'error': {
            'message': error.message,
            'code': error.status_code
        }
    }
    if error.payload:
        response['error']['details'] = error.payload
    
    return jsonify(response), error.status_code

# Usage
@app.route('/users/<int:user_id>')
def get_user(user_id):
    user = db.get_user(user_id)
    if not user:
        raise APIError('User not found', status_code=404)
    return jsonify(user)
```

---

This comprehensive API design guide covers REST principles, versioning, authentication, GraphQL, documentation, and production best practices with complete implementations!
