# Service Discovery

## What is Service Discovery?

**Service Discovery** dynamically locates services in a distributed system:
- **Dynamic Registration**: Services register themselves
- **Health Checks**: Monitor service availability
- **Load Balancing**: Distribute requests across instances
- **Failover**: Automatically remove unhealthy instances

## Why Service Discovery?

In microservices:
- **Dynamic IPs**: Containers get new IPs on restart
- **Auto-Scaling**: Number of instances changes
- **Multi-Region**: Services deployed across zones
- **Resilience**: Automatic failover to healthy instances

## Service Discovery Patterns

### Client-Side Discovery
Client queries registry and chooses instance.

### Server-Side Discovery
Load balancer queries registry.

## Popular Tools

1. **Consul**: HashiCorp's service mesh solution
2. **etcd**: Distributed key-value store
3. **Kubernetes**: Built-in service discovery
4. **Eureka**: Netflix's service registry

## Installation

```bash
go get github.com/hashicorp/consul/api
go get go.etcd.io/etcd/client/v3
```

## Consul Service Discovery

### Service Registration

```go
package discovery

import (
    "fmt"
    "log"
    
    "github.com/hashicorp/consul/api"
)

type ServiceRegistry struct {
    client *api.Client
}

func NewServiceRegistry(consulAddr string) (*ServiceRegistry, error) {
    config := api.DefaultConfig()
    config.Address = consulAddr
    
    client, err := api.NewClient(config)
    if err != nil {
        return nil, err
    }
    
    return &ServiceRegistry{client: client}, nil
}

func (sr *ServiceRegistry) Register(serviceName, serviceID, address string, port int) error {
    registration := &api.AgentServiceRegistration{
        ID:      serviceID,
        Name:    serviceName,
        Address: address,
        Port:    port,
        Check: &api.AgentServiceCheck{
            HTTP:                           fmt.Sprintf("http://%s:%d/health", address, port),
            Interval:                       "10s",
            Timeout:                        "3s",
            DeregisterCriticalServiceAfter: "30s",
        },
        Tags: []string{
            "version-1.0",
            "environment-production",
        },
    }
    
    return sr.client.Agent().ServiceRegister(registration)
}

func (sr *ServiceRegistry) Deregister(serviceID string) error {
    return sr.client.Agent().ServiceDeregister(serviceID)
}

// Usage
func main() {
    registry, err := NewServiceRegistry("localhost:8500")
    if err != nil {
        log.Fatal(err)
    }
    
    // Register service
    err = registry.Register(
        "user-service",
        "user-service-1",
        "192.168.1.100",
        8080,
    )
    if err != nil {
        log.Fatal(err)
    }
    
    // Deregister on shutdown
    defer registry.Deregister("user-service-1")
    
    // Start server
    startServer()
}
```

### Service Discovery

```go
package discovery

import (
    "errors"
    "math/rand"
    
    "github.com/hashicorp/consul/api"
)

func (sr *ServiceRegistry) Discover(serviceName string) (string, error) {
    services, _, err := sr.client.Health().Service(serviceName, "", true, nil)
    if err != nil {
        return nil, err
    }
    
    if len(services) == 0 {
        return nil, errors.New("no healthy instances found")
    }
    
    // Random load balancing
    service := services[rand.Intn(len(services))]
    
    address := service.Service.Address
    port := service.Service.Port
    
    return fmt.Sprintf("http://%s:%d", address, port), nil
}

// Get all instances
func (sr *ServiceRegistry) DiscoverAll(serviceName string) ([]string, error) {
    services, _, err := sr.client.Health().Service(serviceName, "", true, nil)
    if err != nil {
        return nil, err
    }
    
    addresses := make([]string, len(services))
    for i, service := range services {
        addresses[i] = fmt.Sprintf("http://%s:%d", 
            service.Service.Address, 
            service.Service.Port,
        )
    }
    
    return addresses, nil
}

// Usage
func callUserService() (*User, error) {
    registry, _ := NewServiceRegistry("localhost:8500")
    
    // Discover service
    serviceURL, err := registry.Discover("user-service")
    if err != nil {
        return nil, err
    }
    
    // Make request
    resp, err := http.Get(serviceURL + "/users/123")
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var user User
    json.NewDecoder(resp.Body).Decode(&user)
    return &user, nil
}
```

## HTTP Client with Service Discovery

```go
package client

import (
    "context"
    "errors"
    "net/http"
    "sync"
    "time"
)

type ServiceClient struct {
    registry      *ServiceRegistry
    serviceName   string
    cache         []string
    cacheMutex    sync.RWMutex
    cacheExpiry   time.Time
    cacheDuration time.Duration
}

func NewServiceClient(registry *ServiceRegistry, serviceName string) *ServiceClient {
    return &ServiceClient{
        registry:      registry,
        serviceName:   serviceName,
        cacheDuration: 30 * time.Second,
    }
}

func (sc *ServiceClient) getServiceURL() (string, error) {
    sc.cacheMutex.RLock()
    if time.Now().Before(sc.cacheExpiry) && len(sc.cache) > 0 {
        url := sc.cache[rand.Intn(len(sc.cache))]
        sc.cacheMutex.RUnlock()
        return url, nil
    }
    sc.cacheMutex.RUnlock()
    
    // Refresh cache
    sc.cacheMutex.Lock()
    defer sc.cacheMutex.Unlock()
    
    urls, err := sc.registry.DiscoverAll(sc.serviceName)
    if err != nil {
        return "", err
    }
    
    if len(urls) == 0 {
        return "", errors.New("no instances available")
    }
    
    sc.cache = urls
    sc.cacheExpiry = time.Now().Add(sc.cacheDuration)
    
    return urls[rand.Intn(len(urls))], nil
}

func (sc *ServiceClient) Get(ctx context.Context, path string) (*http.Response, error) {
    serviceURL, err := sc.getServiceURL()
    if err != nil {
        return nil, err
    }
    
    req, err := http.NewRequestWithContext(ctx, "GET", serviceURL+path, nil)
    if err != nil {
        return nil, err
    }
    
    return http.DefaultClient.Do(req)
}
```

## etcd Service Discovery

```go
package discovery

import (
    "context"
    "encoding/json"
    "fmt"
    "time"
    
    clientv3 "go.etcd.io/etcd/client/v3"
)

type EtcdRegistry struct {
    client  *clientv3.Client
    leaseID clientv3.LeaseID
}

type ServiceInstance struct {
    ID      string `json:"id"`
    Name    string `json:"name"`
    Address string `json:"address"`
    Port    int    `json:"port"`
}

func NewEtcdRegistry(endpoints []string) (*EtcdRegistry, error) {
    client, err := clientv3.New(clientv3.Config{
        Endpoints:   endpoints,
        DialTimeout: 5 * time.Second,
    })
    if err != nil {
        return nil, err
    }
    
    return &EtcdRegistry{client: client}, nil
}

func (er *EtcdRegistry) Register(ctx context.Context, instance *ServiceInstance, ttl int64) error {
    // Create lease
    lease, err := er.client.Grant(ctx, ttl)
    if err != nil {
        return err
    }
    er.leaseID = lease.ID
    
    // Register service
    key := fmt.Sprintf("/services/%s/%s", instance.Name, instance.ID)
    value, _ := json.Marshal(instance)
    
    _, err = er.client.Put(ctx, key, string(value), clientv3.WithLease(lease.ID))
    if err != nil {
        return err
    }
    
    // Keep alive
    ch, err := er.client.KeepAlive(ctx, lease.ID)
    if err != nil {
        return err
    }
    
    go func() {
        for range ch {
            // Lease renewed
        }
    }()
    
    return nil
}

func (er *EtcdRegistry) Discover(ctx context.Context, serviceName string) ([]*ServiceInstance, error) {
    prefix := fmt.Sprintf("/services/%s/", serviceName)
    
    resp, err := er.client.Get(ctx, prefix, clientv3.WithPrefix())
    if err != nil {
        return nil, err
    }
    
    instances := make([]*ServiceInstance, len(resp.Kvs))
    for i, kv := range resp.Kvs {
        var instance ServiceInstance
        json.Unmarshal(kv.Value, &instance)
        instances[i] = &instance
    }
    
    return instances, nil
}

func (er *EtcdRegistry) Watch(ctx context.Context, serviceName string) clientv3.WatchChan {
    prefix := fmt.Sprintf("/services/%s/", serviceName)
    return er.client.Watch(ctx, prefix, clientv3.WithPrefix())
}

func (er *EtcdRegistry) Deregister(ctx context.Context) error {
    if er.leaseID != 0 {
        _, err := er.client.Revoke(ctx, er.leaseID)
        return err
    }
    return nil
}

func (er *EtcdRegistry) Close() error {
    return er.client.Close()
}
```

## Kubernetes Service Discovery

Kubernetes has built-in DNS-based service discovery.

```go
package k8s

import (
    "encoding/json"
    "fmt"
    "net/http"
)

// Service discovery via Kubernetes DNS
func CallUserService() (*User, error) {
    // DNS: <service-name>.<namespace>.svc.cluster.local
    serviceURL := "http://user-service.default.svc.cluster.local:8080"
    
    resp, err := http.Get(serviceURL + "/users/123")
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var user User
    json.NewDecoder(resp.Body).Decode(&user)
    return &user, nil
}

// Using Kubernetes API
import (
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/client-go/kubernetes"
    "k8s.io/client-go/rest"
)

func GetServiceEndpoints(serviceName, namespace string) ([]string, error) {
    config, _ := rest.InClusterConfig()
    clientset, _ := kubernetes.NewForConfig(config)
    
    endpoints, err := clientset.CoreV1().Endpoints(namespace).Get(
        context.TODO(), 
        serviceName, 
        metav1.GetOptions{},
    )
    if err != nil {
        return nil, err
    }
    
    var addresses []string
    for _, subset := range endpoints.Subsets {
        for _, addr := range subset.Addresses {
            for _, port := range subset.Ports {
                addresses = append(addresses, 
                    fmt.Sprintf("http://%s:%d", addr.IP, port.Port),
                )
            }
        }
    }
    
    return addresses, nil
}
```

## Health Checks

```go
package health

import (
    "context"
    "time"
    
    "github.com/gin-gonic/gin"
)

type HealthChecker struct {
    db    *gorm.DB
    redis *redis.Client
}

func (hc *HealthChecker) LivenessCheck(c *gin.Context) {
    // Simple check - is the service running?
    c.JSON(200, gin.H{"status": "alive"})
}

func (hc *HealthChecker) ReadinessCheck(c *gin.Context) {
    // Check dependencies
    ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
    defer cancel()
    
    checks := map[string]bool{
        "database": hc.checkDatabase(ctx),
        "redis":    hc.checkRedis(ctx),
    }
    
    allHealthy := true
    for _, healthy := range checks {
        if !healthy {
            allHealthy = false
            break
        }
    }
    
    status := 200
    if !allHealthy {
        status = 503
    }
    
    c.JSON(status, gin.H{
        "status": checks,
        "ready":  allHealthy,
    })
}

func (hc *HealthChecker) checkDatabase(ctx context.Context) bool {
    return hc.db.WithContext(ctx).Exec("SELECT 1").Error == nil
}

func (hc *HealthChecker) checkRedis(ctx context.Context) bool {
    return hc.redis.Ping(ctx).Err() == nil
}

// Setup routes
func SetupHealthRoutes(r *gin.Engine, hc *HealthChecker) {
    r.GET("/health/live", hc.LivenessCheck)
    r.GET("/health/ready", hc.ReadinessCheck)
}
```

## Load Balancing Strategies

```go
package loadbalancer

import (
    "errors"
    "sync/atomic"
)

type LoadBalancer interface {
    Next() (string, error)
}

// Round Robin
type RoundRobinLB struct {
    servers []string
    current uint64
}

func NewRoundRobinLB(servers []string) *RoundRobinLB {
    return &RoundRobinLB{servers: servers}
}

func (lb *RoundRobinLB) Next() (string, error) {
    if len(lb.servers) == 0 {
        return "", errors.New("no servers available")
    }
    
    idx := atomic.AddUint64(&lb.current, 1) % uint64(len(lb.servers))
    return lb.servers[idx], nil
}

// Random
type RandomLB struct {
    servers []string
}

func NewRandomLB(servers []string) *RandomLB {
    return &RandomLB{servers: servers}
}

func (lb *RandomLB) Next() (string, error) {
    if len(lb.servers) == 0 {
        return "", errors.New("no servers available")
    }
    
    return lb.servers[rand.Intn(len(lb.servers))], nil
}

// Weighted Round Robin
type WeightedServer struct {
    Address string
    Weight  int
}

type WeightedRoundRobinLB struct {
    servers []*WeightedServer
    current int
    total   int
}

func NewWeightedRoundRobinLB(servers []*WeightedServer) *WeightedRoundRobinLB {
    total := 0
    for _, s := range servers {
        total += s.Weight
    }
    
    return &WeightedRoundRobinLB{
        servers: servers,
        total:   total,
    }
}

func (lb *WeightedRoundRobinLB) Next() (string, error) {
    if len(lb.servers) == 0 {
        return "", errors.New("no servers available")
    }
    
    lb.current++
    for _, server := range lb.servers {
        if lb.current%lb.total < server.Weight {
            return server.Address, nil
        }
    }
    
    return lb.servers[0].Address, nil
}
```

## Complete Service Example

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    "os/signal"
    "syscall"
    
    "github.com/gin-gonic/gin"
)

func main() {
    // Service configuration
    serviceName := "user-service"
    serviceID := fmt.Sprintf("%s-%s", serviceName, os.Getenv("HOSTNAME"))
    servicePort := 8080
    
    // Connect to Consul
    registry, err := NewServiceRegistry("consul:8500")
    if err != nil {
        log.Fatal(err)
    }
    
    // Register service
    err = registry.Register(
        serviceName,
        serviceID,
        os.Getenv("SERVICE_IP"),
        servicePort,
    )
    if err != nil {
        log.Fatal(err)
    }
    
    // Deregister on shutdown
    defer func() {
        log.Println("Deregistering service...")
        registry.Deregister(serviceID)
    }()
    
    // Setup Gin
    r := gin.Default()
    
    // Health checks
    healthChecker := &HealthChecker{db: db, redis: rdb}
    SetupHealthRoutes(r, healthChecker)
    
    // Business routes
    r.GET("/users/:id", getUser)
    
    // Graceful shutdown
    srv := &http.Server{
        Addr:    fmt.Sprintf(":%d", servicePort),
        Handler: r,
    }
    
    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Server error: %v", err)
        }
    }()
    
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    log.Println("Shutting down server...")
    
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown:", err)
    }
    
    log.Println("Server exited")
}
```

## Docker Compose with Consul

```yaml
version: '3.8'

services:
  consul:
    image: consul:latest
    ports:
      - "8500:8500"
      - "8600:8600/udp"
    command: agent -server -ui -bootstrap-expect=1 -client=0.0.0.0
    
  user-service-1:
    build: ./user-service
    environment:
      - SERVICE_IP=user-service-1
      - CONSUL_ADDR=consul:8500
    depends_on:
      - consul
      
  user-service-2:
    build: ./user-service
    environment:
      - SERVICE_IP=user-service-2
      - CONSUL_ADDR=consul:8500
    depends_on:
      - consul
      
  api-gateway:
    build: ./api-gateway
    ports:
      - "8080:8080"
    environment:
      - CONSUL_ADDR=consul:8500
    depends_on:
      - consul
```

## Best Practices

1. **Health Checks**: Implement liveness and readiness probes
2. **Graceful Shutdown**: Deregister before shutting down
3. **Cache Discovery Results**: Reduce registry load
4. **Retry Logic**: Handle temporary registry failures
5. **Heartbeats**: Keep service registration alive
6. **Service Metadata**: Include version, tags
7. **Load Balancing**: Use appropriate strategy
8. **Circuit Breakers**: Handle service failures
9. **Monitoring**: Track service availability
10. **Security**: Use TLS for registry communication

## Summary

Service Discovery enables:
- **Dynamic Registration**: Services self-register
- **Automatic Failover**: Remove unhealthy instances
- **Load Balancing**: Distribute traffic
- **Scalability**: Handle dynamic instance counts
- **Resilience**: Health checks and monitoring

Essential for microservices and cloud-native applications.
