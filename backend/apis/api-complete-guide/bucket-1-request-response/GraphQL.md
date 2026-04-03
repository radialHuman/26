# GraphQL

## What is GraphQL?

Imagine you're at a build-your-own sandwich shop (like Subway). Instead of ordering a pre-made sandwich and getting ingredients you don't want, you tell them **exactly** what you want: "Wheat bread, turkey, lettuce, tomatoes, no mayo, extra pickles." You get precisely what you asked for, nothing more, nothing less.

GraphQL works the same way for data. It's a **query language** that lets clients ask for exactly the data they need in a single request.

## How It Came to Be

**Timeline:**
- **2012**: Facebook developed GraphQL internally for their mobile apps
- **Problem**: REST APIs required multiple round-trips, wasting bandwidth on mobile
- **2015**: Facebook open-sourced GraphQL
- **2016**: GitHub launched their GraphQL API
- **2018**: GraphQL Foundation formed (Linux Foundation)
- **Today**: Used by Facebook, GitHub, Shopify, Twitter, Netflix, and many more

**The Problem It Solved:**

REST API challenges:
```
// Want user info + their posts + comments on each post?

GET /users/123           → Over-fetching (gets fields you don't need)
GET /users/123/posts     → Need multiple requests
GET /posts/1/comments    → One request per post!
GET /posts/2/comments
GET /posts/3/comments
```

This is called the **N+1 problem** – you make 1 request for the user, then N requests for related data.

**GraphQL's solution:** One request, exactly the data you need!

```graphql
query {
  user(id: 123) {
    name
    email
    posts {
      title
      comments {
        text
        author
      }
    }
  }
}
```

## Core Concepts

### 1. Schema (The Contract)

The schema defines what data is available and how it's structured:

```graphql
# Define types
type User {
  id: ID!           # ! means required
  name: String!
  email: String!
  age: Int
  posts: [Post!]!   # Array of posts
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  comments: [Comment!]!
}

type Comment {
  id: ID!
  text: String!
  author: User!
}

# Define what queries are possible
type Query {
  user(id: ID!): User
  users: [User!]!
  post(id: ID!): Post
  posts(limit: Int): [Post!]!
}

# Define what mutations (changes) are possible
type Mutation {
  createUser(name: String!, email: String!): User!
  updateUser(id: ID!, name: String): User
  deleteUser(id: ID!): Boolean!
}

# Define real-time subscriptions
type Subscription {
  newPost: Post!
  commentAdded(postId: ID!): Comment!
}
```

### 2. Queries (Reading Data)

```graphql
# Simple query
query {
  user(id: "123") {
    name
    email
  }
}

# Query with variables
query GetUser($userId: ID!) {
  user(id: $userId) {
    name
    email
    posts {
      title
    }
  }
}

# Multiple queries in one request
query {
  user1: user(id: "123") {
    name
  }
  user2: user(id: "456") {
    name
  }
  allPosts: posts(limit: 10) {
    title
  }
}

# Nested queries
query {
  user(id: "123") {
    name
    posts {
      title
      comments {
        text
        author {
          name
        }
      }
    }
  }
}
```

### 3. Mutations (Changing Data)

```graphql
mutation {
  createUser(name: "Alice", email: "alice@example.com") {
    id
    name
    email
  }
}

mutation UpdateUser($id: ID!, $name: String!) {
  updateUser(id: $id, name: $name) {
    id
    name
    email
  }
}
```

### 4. Subscriptions (Real-time Updates)

```graphql
subscription {
  newPost {
    id
    title
    author {
      name
    }
  }
}
```

## Pros and Cons

### ✅ Pros

1. **No Over-fetching**: Get exactly what you ask for
2. **No Under-fetching**: Get related data in one request
3. **Single Endpoint**: Just `/graphql` instead of many endpoints
4. **Strongly Typed**: Schema provides clear contract
5. **Self-Documenting**: Schema serves as documentation
6. **Versionless**: Add new fields without breaking existing clients
7. **Developer Experience**: Great tooling (GraphiQL, Playground)
8. **Efficient Mobile**: Reduces bandwidth for mobile apps
9. **Real-time Support**: Built-in subscriptions
10. **Flexible**: Clients control their data requirements

### ❌ Cons

1. **Complexity**: Steeper learning curve than REST
2. **Caching Challenges**: HTTP caching doesn't work well
3. **File Uploads**: Requires workarounds
4. **Query Complexity**: Clients can write expensive queries
5. **Performance Monitoring**: Harder to track than REST endpoints
6. **N+1 Query Problem**: Can cause database performance issues without DataLoader
7. **Overhead for Simple APIs**: Overkill for basic CRUD
8. **No HTTP Semantics**: Status codes, methods not utilized
9. **Rate Limiting**: Harder to implement than with REST
10. **Learning Curve**: Team needs to learn new concepts

## When to Use GraphQL

### ✅ Great For:

- **Mobile Applications**: Minimize data transfer
- **Complex Data Requirements**: Many relationships between entities
- **Multiple Client Types**: Web, mobile, desktop with different needs
- **Rapidly Evolving APIs**: Add fields without versioning
- **Aggregating Multiple Data Sources**: Combine REST APIs, databases, etc.
- **Developer Portals**: GitHub-style APIs for developers
- **Real-time Dashboards**: With subscriptions
- **Microservices Aggregation**: Single GraphQL gateway

### ❌ Not Ideal For:

- **Simple CRUD APIs**: REST is simpler
- **File Upload Heavy**: Requires complex multipart handling
- **Heavy Caching Needs**: HTTP caching works better with REST
- **Small Teams New to GraphQL**: Learning curve
- **Public Rate-Limited APIs**: Harder to implement rate limits
- **Legacy System Integration**: If existing REST APIs work fine

## Implementation Examples

### Python Implementation (Using Strawberry)

```python
import strawberry
from typing import List, Optional
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
import asyncio

# ============================================
# TYPE DEFINITIONS
# ============================================

@strawberry.type
class Comment:
    id: str
    text: str
    author_id: str
    
    @strawberry.field
    def author(self) -> "User":
        """Resolve the author of this comment"""
        return users_db.get(self.author_id)


@strawberry.type
class Post:
    id: str
    title: str
    content: str
    author_id: str
    
    @strawberry.field
    def author(self) -> "User":
        """Resolve the author of this post"""
        return users_db.get(self.author_id)
    
    @strawberry.field
    def comments(self) -> List[Comment]:
        """Resolve comments for this post"""
        return [c for c in comments_db.values() if c.post_id == self.id]


@strawberry.type
class User:
    id: str
    name: str
    email: str
    age: Optional[int] = None
    
    @strawberry.field
    def posts(self) -> List[Post]:
        """Resolve posts by this user"""
        return [p for p in posts_db.values() if p.author_id == self.id]


# ============================================
# IN-MEMORY DATABASE
# ============================================

users_db = {
    "1": User(id="1", name="Alice", email="alice@example.com", age=30),
    "2": User(id="2", name="Bob", email="bob@example.com", age=25),
    "3": User(id="3", name="Charlie", email="charlie@example.com", age=35),
}

posts_db = {
    "1": Post(id="1", title="GraphQL Intro", content="GraphQL is awesome!", author_id="1"),
    "2": Post(id="2", title="Python Tips", content="Use type hints!", author_id="1"),
    "3": Post(id="3", title="Go vs Rust", content="Both are great!", author_id="2"),
}

comments_db = {
    "1": Comment(id="1", text="Great post!", author_id="2", post_id="1"),
    "2": Comment(id="2", text="Very helpful", author_id="3", post_id="1"),
    "3": Comment(id="3", text="I agree!", author_id="3", post_id="2"),
}


# ============================================
# INPUT TYPES (For mutations)
# ============================================

@strawberry.input
class CreateUserInput:
    name: str
    email: str
    age: Optional[int] = None


@strawberry.input
class CreatePostInput:
    title: str
    content: str
    author_id: str


# ============================================
# QUERIES
# ============================================

@strawberry.type
class Query:
    
    @strawberry.field
    def user(self, id: str) -> Optional[User]:
        """Get a single user by ID"""
        return users_db.get(id)
    
    @strawberry.field
    def users(self) -> List[User]:
        """Get all users"""
        return list(users_db.values())
    
    @strawberry.field
    def post(self, id: str) -> Optional[Post]:
        """Get a single post by ID"""
        return posts_db.get(id)
    
    @strawberry.field
    def posts(self, limit: Optional[int] = None) -> List[Post]:
        """Get all posts, optionally limited"""
        posts = list(posts_db.values())
        if limit:
            return posts[:limit]
        return posts
    
    @strawberry.field
    def search_users(self, name: str) -> List[User]:
        """Search users by name (case-insensitive)"""
        return [
            user for user in users_db.values()
            if name.lower() in user.name.lower()
        ]


# ============================================
# MUTATIONS
# ============================================

@strawberry.type
class Mutation:
    
    @strawberry.mutation
    def create_user(self, input: CreateUserInput) -> User:
        """Create a new user"""
        user_id = str(len(users_db) + 1)
        user = User(
            id=user_id,
            name=input.name,
            email=input.email,
            age=input.age
        )
        users_db[user_id] = user
        return user
    
    @strawberry.mutation
    def update_user(
        self,
        id: str,
        name: Optional[str] = None,
        email: Optional[str] = None,
        age: Optional[int] = None
    ) -> Optional[User]:
        """Update an existing user"""
        user = users_db.get(id)
        if not user:
            return None
        
        if name:
            user.name = name
        if email:
            user.email = email
        if age:
            user.age = age
        
        return user
    
    @strawberry.mutation
    def delete_user(self, id: str) -> bool:
        """Delete a user"""
        if id in users_db:
            del users_db[id]
            return True
        return False
    
    @strawberry.mutation
    def create_post(self, input: CreatePostInput) -> Post:
        """Create a new post"""
        post_id = str(len(posts_db) + 1)
        post = Post(
            id=post_id,
            title=input.title,
            content=input.content,
            author_id=input.author_id
        )
        posts_db[post_id] = post
        return post


# ============================================
# SUBSCRIPTIONS
# ============================================

@strawberry.type
class Subscription:
    
    @strawberry.subscription
    async def new_post(self) -> Post:
        """Subscribe to new posts"""
        # In a real app, this would listen to a message queue
        while True:
            await asyncio.sleep(5)  # Check every 5 seconds
            if posts_db:
                # Return the latest post
                latest_post = list(posts_db.values())[-1]
                yield latest_post


# ============================================
# CREATE SCHEMA
# ============================================

schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription
)


# ============================================
# FASTAPI APPLICATION
# ============================================

app = FastAPI()

# Add GraphQL route
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")


@app.get("/")
def root():
    return {
        "message": "GraphQL API",
        "graphql_endpoint": "/graphql",
        "graphql_playground": "/graphql"  # GraphiQL interface
    }


# ============================================
# CLIENT EXAMPLE (Using httpx)
# ============================================

async def graphql_client_example():
    """
    Example of making GraphQL requests from Python
    """
    import httpx
    
    async with httpx.AsyncClient() as client:
        
        # Query example
        query = """
        query {
          users {
            id
            name
            email
            posts {
              title
            }
          }
        }
        """
        
        response = await client.post(
            "http://localhost:8000/graphql",
            json={"query": query}
        )
        
        print("Users with posts:")
        print(response.json())
        
        # Mutation example
        mutation = """
        mutation CreateUser($name: String!, $email: String!) {
          createUser(input: {name: $name, email: $email}) {
            id
            name
            email
          }
        }
        """
        
        variables = {
            "name": "Diana",
            "email": "diana@example.com"
        }
        
        response = await client.post(
            "http://localhost:8000/graphql",
            json={
                "query": mutation,
                "variables": variables
            }
        )
        
        print("\nCreated user:")
        print(response.json())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Go Implementation (Using gqlgen)

```go
package main

import (
	"context"
	"log"
	"net/http"
	"strconv"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
)

// ============================================
// MODELS
// ============================================

type User struct {
	ID    string
	Name  string
	Email string
	Age   *int
}

type Post struct {
	ID       string
	Title    string
	Content  string
	AuthorID string
}

type Comment struct {
	ID       string
	Text     string
	AuthorID string
	PostID   string
}

// ============================================
// IN-MEMORY DATABASE
// ============================================

var (
	usersDB = map[string]*User{
		"1": {ID: "1", Name: "Alice", Email: "alice@example.com"},
		"2": {ID: "2", Name: "Bob", Email: "bob@example.com"},
	}
	
	postsDB = map[string]*Post{
		"1": {ID: "1", Title: "GraphQL Intro", Content: "GraphQL is awesome!", AuthorID: "1"},
		"2": {ID: "2", Title: "Go Tips", Content: "Use interfaces!", AuthorID: "1"},
	}
	
	commentsDB = map[string]*Comment{
		"1": {ID: "1", Text: "Great post!", AuthorID: "2", PostID: "1"},
	}
	
	nextUserID    = 3
	nextPostID    = 3
	nextCommentID = 2
)

// ============================================
// RESOLVER
// ============================================

type Resolver struct{}

// Query resolver
func (r *Resolver) Query() QueryResolver {
	return &queryResolver{r}
}

// Mutation resolver
func (r *Resolver) Mutation() MutationResolver {
	return &mutationResolver{r}
}

// User resolver
func (r *Resolver) User() UserResolver {
	return &userResolver{r}
}

// Post resolver
func (r *Resolver) Post() PostResolver {
	return &postResolver{r}
}

// ============================================
// QUERY RESOLVER
// ============================================

type queryResolver struct{ *Resolver }

func (r *queryResolver) User(ctx context.Context, id string) (*User, error) {
	user, exists := usersDB[id]
	if !exists {
		return nil, nil
	}
	return user, nil
}

func (r *queryResolver) Users(ctx context.Context) ([]*User, error) {
	users := make([]*User, 0, len(usersDB))
	for _, user := range usersDB {
		users = append(users, user)
	}
	return users, nil
}

func (r *queryResolver) Post(ctx context.Context, id string) (*Post, error) {
	post, exists := postsDB[id]
	if !exists {
		return nil, nil
	}
	return post, nil
}

func (r *queryResolver) Posts(ctx context.Context, limit *int) ([]*Post, error) {
	posts := make([]*Post, 0, len(postsDB))
	for _, post := range postsDB {
		posts = append(posts, post)
		if limit != nil && len(posts) >= *limit {
			break
		}
	}
	return posts, nil
}

// ============================================
// MUTATION RESOLVER
// ============================================

type mutationResolver struct{ *Resolver }

func (r *mutationResolver) CreateUser(ctx context.Context, input CreateUserInput) (*User, error) {
	id := strconv.Itoa(nextUserID)
	nextUserID++
	
	user := &User{
		ID:    id,
		Name:  input.Name,
		Email: input.Email,
		Age:   input.Age,
	}
	
	usersDB[id] = user
	return user, nil
}

func (r *mutationResolver) UpdateUser(ctx context.Context, id string, name *string, email *string) (*User, error) {
	user, exists := usersDB[id]
	if !exists {
		return nil, nil
	}
	
	if name != nil {
		user.Name = *name
	}
	if email != nil {
		user.Email = *email
	}
	
	return user, nil
}

func (r *mutationResolver) DeleteUser(ctx context.Context, id string) (bool, error) {
	if _, exists := usersDB[id]; !exists {
		return false, nil
	}
	delete(usersDB, id)
	return true, nil
}

// ============================================
// FIELD RESOLVERS
// ============================================

type userResolver struct{ *Resolver }

func (r *userResolver) Posts(ctx context.Context, obj *User) ([]*Post, error) {
	posts := make([]*Post, 0)
	for _, post := range postsDB {
		if post.AuthorID == obj.ID {
			posts = append(posts, post)
		}
	}
	return posts, nil
}

type postResolver struct{ *Resolver }

func (r *postResolver) Author(ctx context.Context, obj *Post) (*User, error) {
	return usersDB[obj.AuthorID], nil
}

func (r *postResolver) Comments(ctx context.Context, obj *Post) ([]*Comment, error) {
	comments := make([]*Comment, 0)
	for _, comment := range commentsDB {
		if comment.PostID == obj.ID {
			comments = append(comments, comment)
		}
	}
	return comments, nil
}

// ============================================
// INPUT TYPES
// ============================================

type CreateUserInput struct {
	Name  string
	Email string
	Age   *int
}

// ============================================
// INTERFACES (for gqlgen)
// ============================================

type QueryResolver interface {
	User(ctx context.Context, id string) (*User, error)
	Users(ctx context.Context) ([]*User, error)
	Post(ctx context.Context, id string) (*Post, error)
	Posts(ctx context.Context, limit *int) ([]*Post, error)
}

type MutationResolver interface {
	CreateUser(ctx context.Context, input CreateUserInput) (*User, error)
	UpdateUser(ctx context.Context, id string, name *string, email *string) (*User, error)
	DeleteUser(ctx context.Context, id string) (bool, error)
}

type UserResolver interface {
	Posts(ctx context.Context, obj *User) ([]*Post, error)
}

type PostResolver interface {
	Author(ctx context.Context, obj *Post) (*User, error)
	Comments(ctx context.Context, obj *Post) ([]*Comment, error)
}

// ============================================
// MAIN
// ============================================

func main() {
	// Create GraphQL server
	srv := handler.NewDefaultServer(NewExecutableSchema(Config{Resolvers: &Resolver{}}))
	
	// GraphQL playground
	http.Handle("/", playground.Handler("GraphQL playground", "/query"))
	
	// GraphQL endpoint
	http.Handle("/query", srv)
	
	log.Println("GraphQL server running on http://localhost:8080")
	log.Println("Playground: http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

## Best Practices

### 1. Use DataLoader to Avoid N+1 Queries

```python
from strawberry.dataloader import DataLoader

async def load_users(keys: List[str]) -> List[User]:
    # Batch load users in one database query
    users = await db.query("SELECT * FROM users WHERE id IN (?)", keys)
    return users

user_loader = DataLoader(load_fn=load_users)

# Use in resolver
user = await user_loader.load(user_id)
```

### 2. Implement Query Complexity Limits

```python
# Prevent expensive queries
max_complexity = 1000
max_depth = 10
```

### 3. Use Fragments for Reusability

```graphql
fragment UserFields on User {
  id
  name
  email
}

query {
  user1: user(id: "1") {
    ...UserFields
  }
  user2: user(id: "2") {
    ...UserFields
  }
}
```

### 4. Implement Proper Error Handling

```python
from strawberry.types import Info
import strawberry

@strawberry.type
class UserNotFoundError:
    message: str = "User not found"
    user_id: str

@strawberry.type
class Query:
    @strawberry.field
    def user(self, id: str) -> Union[User, UserNotFoundError]:
        user = users_db.get(id)
        if not user:
            return UserNotFoundError(user_id=id)
        return user
```

## GraphQL vs REST

| Aspect | GraphQL | REST |
|--------|---------|------|
| **Endpoints** | Single `/graphql` | Multiple (`/users`, `/posts`) |
| **Data Fetching** | Request exactly what you need | Fixed response structure |
| **Over-fetching** | No | Yes |
| **Under-fetching** | No | Yes (need multiple requests) |
| **Versioning** | Not needed | Required (`/v1`, `/v2`) |
| **Caching** | Complex | Simple (HTTP caching) |
| **Learning Curve** | Steeper | Gentler |
| **Tooling** | Excellent (GraphiQL, Playground) | Good (Postman, Swagger) |

## Key Takeaway

GraphQL is like a restaurant where you can customize every detail of your meal. Instead of choosing from preset combos (REST), you specify exactly what you want. It's powerful and flexible, but requires more setup and understanding. Perfect when you need precise control over your data, but might be overkill for simple applications.
