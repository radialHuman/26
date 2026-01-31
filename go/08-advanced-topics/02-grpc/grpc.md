# gRPC and Protocol Buffers

## What is gRPC?

**gRPC** (gRPC Remote Procedure Call) is a high-performance, open-source RPC framework developed by Google. It uses:
- **HTTP/2**: Multiplexing, streaming, header compression
- **Protocol Buffers**: Efficient binary serialization
- **Code Generation**: Auto-generate client/server code
- **Multiple Languages**: Polyglot support

## Why Use gRPC?

- **Performance**: Binary protocol, HTTP/2 multiplexing
- **Type Safety**: Strong typing with Protocol Buffers
- **Streaming**: Bidirectional streaming support
- **Language Agnostic**: Works across languages
- **Code Generation**: Less boilerplate

## vs REST

| Feature | gRPC | REST |
|---------|------|------|
| Protocol | HTTP/2 | HTTP/1.1 |
| Format | Protocol Buffers (binary) | JSON (text) |
| Performance | Faster, smaller payloads | Slower, larger payloads |
| Streaming | Built-in | Complex (SSE, WebSocket) |
| Browser Support | Limited | Excellent |
| Human Readable | No | Yes |
| Use Case | Microservices, internal APIs | Public APIs, web |

## Installation

```bash
# Install Protocol Buffer compiler
# Windows: Download from https://github.com/protocolbuffers/protobuf/releases
# Mac: brew install protobuf
# Linux: apt-get install protobuf-compiler

# Install Go plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Install gRPC library
go get google.golang.org/grpc
go get google.golang.org/protobuf
```

## Protocol Buffers Basics

### Define .proto File

Create `user.proto`:

```protobuf
syntax = "proto3";

package user;

option go_package = "myapp/proto/user";

// User message
message User {
  int32 id = 1;
  string name = 2;
  string email = 3;
  int32 age = 4;
  repeated string tags = 5;
}

// Request/Response messages
message GetUserRequest {
  int32 id = 1;
}

message GetUserResponse {
  User user = 1;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
  int32 age = 3;
}

message CreateUserResponse {
  User user = 1;
}

message ListUsersRequest {
  int32 page = 1;
  int32 page_size = 2;
}

message ListUsersResponse {
  repeated User users = 1;
  int32 total = 2;
}

// Service definition
service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
  
  // Streaming
  rpc StreamUsers(ListUsersRequest) returns (stream User);
  rpc RecordUsers(stream CreateUserRequest) returns (CreateUserResponse);
  rpc ChatUsers(stream CreateUserRequest) returns (stream User);
}
```

### Generate Go Code

```bash
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    user.proto
```

This generates:
- `user.pb.go`: Message types
- `user_grpc.pb.go`: Service interfaces and client

## Basic gRPC Server

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net"
    
    "google.golang.org/grpc"
    pb "myapp/proto/user"
)

// Implement UserService server
type server struct {
    pb.UnimplementedUserServiceServer
    users map[int32]*pb.User
    nextID int32
}

func NewServer() *server {
    return &server{
        users: make(map[int32]*pb.User),
        nextID: 1,
    }
}

func (s *server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
    user, exists := s.users[req.Id]
    if !exists {
        return nil, fmt.Errorf("user not found")
    }
    
    return &pb.GetUserResponse{User: user}, nil
}

func (s *server) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.CreateUserResponse, error) {
    user := &pb.User{
        Id:    s.nextID,
        Name:  req.Name,
        Email: req.Email,
        Age:   req.Age,
    }
    
    s.users[s.nextID] = user
    s.nextID++
    
    return &pb.CreateUserResponse{User: user}, nil
}

func (s *server) ListUsers(ctx context.Context, req *pb.ListUsersRequest) (*pb.ListUsersResponse, error) {
    users := make([]*pb.User, 0, len(s.users))
    for _, user := range s.users {
        users = append(users, user)
    }
    
    return &pb.ListUsersResponse{
        Users: users,
        Total: int32(len(users)),
    }, nil
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("Failed to listen: %v", err)
    }
    
    grpcServer := grpc.NewServer()
    pb.RegisterUserServiceServer(grpcServer, NewServer())
    
    log.Println("gRPC server listening on :50051")
    if err := grpcServer.Serve(lis); err != nil {
        log.Fatalf("Failed to serve: %v", err)
    }
}
```

## gRPC Client

```go
package main

import (
    "context"
    "log"
    "time"
    
    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
    pb "myapp/proto/user"
)

func main() {
    // Connect to server
    conn, err := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
    if err != nil {
        log.Fatalf("Failed to connect: %v", err)
    }
    defer conn.Close()
    
    client := pb.NewUserServiceClient(conn)
    
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    // Create user
    createResp, err := client.CreateUser(ctx, &pb.CreateUserRequest{
        Name:  "John Doe",
        Email: "john@example.com",
        Age:   30,
    })
    if err != nil {
        log.Fatalf("CreateUser failed: %v", err)
    }
    log.Printf("Created user: %v", createResp.User)
    
    // Get user
    getResp, err := client.GetUser(ctx, &pb.GetUserRequest{
        Id: createResp.User.Id,
    })
    if err != nil {
        log.Fatalf("GetUser failed: %v", err)
    }
    log.Printf("Retrieved user: %v", getResp.User)
    
    // List users
    listResp, err := client.ListUsers(ctx, &pb.ListUsersRequest{})
    if err != nil {
        log.Fatalf("ListUsers failed: %v", err)
    }
    log.Printf("Total users: %d", listResp.Total)
}
```

## Streaming

### Server Streaming

```go
// Server
func (s *server) StreamUsers(req *pb.ListUsersRequest, stream pb.UserService_StreamUsersServer) error {
    for _, user := range s.users {
        if err := stream.Send(user); err != nil {
            return err
        }
        time.Sleep(100 * time.Millisecond) // Simulate delay
    }
    return nil
}

// Client
func streamUsers(client pb.UserServiceClient) {
    stream, err := client.StreamUsers(context.Background(), &pb.ListUsersRequest{})
    if err != nil {
        log.Fatal(err)
    }
    
    for {
        user, err := stream.Recv()
        if err == io.EOF {
            break
        }
        if err != nil {
            log.Fatal(err)
        }
        log.Printf("Received: %v", user)
    }
}
```

### Client Streaming

```go
// Server
func (s *server) RecordUsers(stream pb.UserService_RecordUsersServer) error {
    count := 0
    
    for {
        req, err := stream.Recv()
        if err == io.EOF {
            return stream.SendAndClose(&pb.CreateUserResponse{
                User: &pb.User{
                    Name: fmt.Sprintf("Processed %d users", count),
                },
            })
        }
        if err != nil {
            return err
        }
        
        // Process user
        count++
        log.Printf("Recording user: %s", req.Name)
    }
}

// Client
func recordUsers(client pb.UserServiceClient) {
    stream, err := client.RecordUsers(context.Background())
    if err != nil {
        log.Fatal(err)
    }
    
    users := []*pb.CreateUserRequest{
        {Name: "User 1", Email: "user1@example.com", Age: 25},
        {Name: "User 2", Email: "user2@example.com", Age: 30},
        {Name: "User 3", Email: "user3@example.com", Age: 35},
    }
    
    for _, user := range users {
        if err := stream.Send(user); err != nil {
            log.Fatal(err)
        }
    }
    
    resp, err := stream.CloseAndRecv()
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("Response: %v", resp)
}
```

### Bidirectional Streaming

```go
// Server
func (s *server) ChatUsers(stream pb.UserService_ChatUsersServer) error {
    for {
        req, err := stream.Recv()
        if err == io.EOF {
            return nil
        }
        if err != nil {
            return err
        }
        
        // Echo back
        user := &pb.User{
            Name:  req.Name,
            Email: req.Email,
            Age:   req.Age,
        }
        
        if err := stream.Send(user); err != nil {
            return err
        }
    }
}

// Client
func chatUsers(client pb.UserServiceClient) {
    stream, err := client.ChatUsers(context.Background())
    if err != nil {
        log.Fatal(err)
    }
    
    waitc := make(chan struct{})
    
    // Receive responses
    go func() {
        for {
            user, err := stream.Recv()
            if err == io.EOF {
                close(waitc)
                return
            }
            if err != nil {
                log.Fatal(err)
            }
            log.Printf("Received: %v", user)
        }
    }()
    
    // Send requests
    users := []*pb.CreateUserRequest{
        {Name: "Alice", Email: "alice@example.com", Age: 25},
        {Name: "Bob", Email: "bob@example.com", Age: 30},
    }
    
    for _, user := range users {
        if err := stream.Send(user); err != nil {
            log.Fatal(err)
        }
    }
    
    stream.CloseSend()
    <-waitc
}
```

## Middleware (Interceptors)

### Unary Interceptor

```go
import "google.golang.org/grpc"

func loggingInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    start := time.Now()
    
    log.Printf("Request: %s", info.FullMethod)
    
    resp, err := handler(ctx, req)
    
    log.Printf("Response: %s (took %v)", info.FullMethod, time.Since(start))
    
    return resp, err
}

// Use interceptor
grpcServer := grpc.NewServer(
    grpc.UnaryInterceptor(loggingInterceptor),
)
```

### Authentication Interceptor

```go
func authInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    // Extract metadata
    md, ok := metadata.FromIncomingContext(ctx)
    if !ok {
        return nil, status.Error(codes.Unauthenticated, "missing metadata")
    }
    
    // Get token
    tokens := md.Get("authorization")
    if len(tokens) == 0 {
        return nil, status.Error(codes.Unauthenticated, "missing token")
    }
    
    token := tokens[0]
    
    // Validate token
    claims, err := ValidateJWT(token)
    if err != nil {
        return nil, status.Error(codes.Unauthenticated, "invalid token")
    }
    
    // Add user info to context
    ctx = context.WithValue(ctx, "user_id", claims.UserID)
    
    return handler(ctx, req)
}
```

### Client Interceptor

```go
func clientLoggingInterceptor(
    ctx context.Context,
    method string,
    req, reply interface{},
    cc *grpc.ClientConn,
    invoker grpc.UnaryInvoker,
    opts ...grpc.CallOption,
) error {
    start := time.Now()
    
    err := invoker(ctx, method, req, reply, cc, opts...)
    
    log.Printf("Method: %s, Duration: %v, Error: %v", method, time.Since(start), err)
    
    return err
}

// Use interceptor
conn, err := grpc.Dial(
    "localhost:50051",
    grpc.WithTransportCredentials(insecure.NewCredentials()),
    grpc.WithUnaryInterceptor(clientLoggingInterceptor),
)
```

## Error Handling

```go
import (
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
)

func (s *server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
    if req.Id <= 0 {
        return nil, status.Error(codes.InvalidArgument, "invalid user ID")
    }
    
    user, exists := s.users[req.Id]
    if !exists {
        return nil, status.Error(codes.NotFound, "user not found")
    }
    
    return &pb.GetUserResponse{User: user}, nil
}

// Client error handling
resp, err := client.GetUser(ctx, req)
if err != nil {
    st, ok := status.FromError(err)
    if ok {
        switch st.Code() {
        case codes.NotFound:
            log.Println("User not found")
        case codes.InvalidArgument:
            log.Println("Invalid argument")
        default:
            log.Printf("Error: %v", st.Message())
        }
    }
}
```

## Metadata (Headers)

```go
import "google.golang.org/grpc/metadata"

// Server: Read metadata
func (s *server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
    md, ok := metadata.FromIncomingContext(ctx)
    if ok {
        requestID := md.Get("request-id")
        log.Printf("Request ID: %v", requestID)
    }
    
    // Send metadata in response
    header := metadata.Pairs("response-id", "12345")
    grpc.SendHeader(ctx, header)
    
    // ...
}

// Client: Send metadata
md := metadata.Pairs("request-id", "abc-123")
ctx := metadata.NewOutgoingContext(context.Background(), md)

resp, err := client.GetUser(ctx, req)
```

## Complete Example with Database

```go
package main

import (
    "context"
    "database/sql"
    "log"
    "net"
    
    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
    pb "myapp/proto/user"
)

type server struct {
    pb.UnimplementedUserServiceServer
    db *sql.DB
}

func (s *server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
    var user pb.User
    
    err := s.db.QueryRowContext(ctx, 
        "SELECT id, name, email, age FROM users WHERE id = $1", 
        req.Id,
    ).Scan(&user.Id, &user.Name, &user.Email, &user.Age)
    
    if err == sql.ErrNoRows {
        return nil, status.Error(codes.NotFound, "user not found")
    }
    if err != nil {
        return nil, status.Error(codes.Internal, "database error")
    }
    
    return &pb.GetUserResponse{User: &user}, nil
}

func (s *server) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.CreateUserResponse, error) {
    var user pb.User
    
    err := s.db.QueryRowContext(ctx,
        "INSERT INTO users (name, email, age) VALUES ($1, $2, $3) RETURNING id, name, email, age",
        req.Name, req.Email, req.Age,
    ).Scan(&user.Id, &user.Name, &user.Email, &user.Age)
    
    if err != nil {
        return nil, status.Error(codes.Internal, "failed to create user")
    }
    
    return &pb.CreateUserResponse{User: &user}, nil
}

func main() {
    db, _ := sql.Open("postgres", "...")
    
    lis, _ := net.Listen("tcp", ":50051")
    
    grpcServer := grpc.NewServer(
        grpc.UnaryInterceptor(loggingInterceptor),
    )
    
    pb.RegisterUserServiceServer(grpcServer, &server{db: db})
    
    log.Println("gRPC server listening on :50051")
    grpcServer.Serve(lis)
}
```

## Best Practices

### 1. Use Context for Timeouts

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

resp, err := client.GetUser(ctx, req)
```

### 2. Handle Graceful Shutdown

```go
grpcServer := grpc.NewServer()
// Register services...

go grpcServer.Serve(lis)

// Wait for interrupt
quit := make(chan os.Signal, 1)
signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
<-quit

grpcServer.GracefulStop()
```

### 3. Use Connection Pooling

```go
conn, err := grpc.Dial(
    "localhost:50051",
    grpc.WithTransportCredentials(insecure.NewCredentials()),
    grpc.WithDefaultCallOptions(grpc.MaxCallRecvMsgSize(10 * 1024 * 1024)),
)
```

## Summary

gRPC provides:
- **High Performance**: Binary protocol, HTTP/2
- **Type Safety**: Protocol Buffers
- **Streaming**: Unary, server, client, bidirectional
- **Interceptors**: Middleware for logging, auth
- **Code Generation**: Less boilerplate

Ideal for microservices and internal APIs.
