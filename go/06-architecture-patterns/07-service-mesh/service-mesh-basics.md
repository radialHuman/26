# Service Mesh Basics

## What is a Service Mesh?

**Service Mesh** is infrastructure layer for service-to-service communication:
- **Traffic Management**: Control request routing
- **Security**: mTLS, encryption
- **Observability**: Distributed tracing, metrics
- **Resilience**: Retries, circuit breakers, timeouts

## Why Service Mesh?

- **Centralized Configuration**: No code changes needed
- **Security**: Automatic encryption between services
- **Observability**: Built-in tracing and metrics
- **Traffic Control**: Canary deployments, A/B testing
- **Resilience**: Automatic retries and failover

## Architecture

### Data Plane
Sidecar proxies (Envoy) handle all traffic.

### Control Plane
Manages and configures proxies.

## Popular Service Meshes

1. **Istio**: Most feature-rich
2. **Linkerd**: Lightweight, simple
3. **Consul Connect**: HashiCorp ecosystem
4. **AWS App Mesh**: AWS-native

## Istio Basics

### Installation

```bash
# Download Istio
curl -L https://istio.io/downloadIstio | sh -
cd istio-*
export PATH=$PWD/bin:$PATH

# Install Istio
istioctl install --set profile=demo -y

# Enable sidecar injection
kubectl label namespace default istio-injection=enabled
```

### Deploy Application

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
        version: v1
    spec:
      containers:
      - name: user-service
        image: myregistry/user-service:v1
        ports:
        - containerPort: 8080
        env:
        - name: PORT
          value: "8080"
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
  - port: 8080
    targetPort: 8080
```

## Virtual Service (Traffic Routing)

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
  - user-service
  http:
  - match:
    - headers:
        user-agent:
          prefix: "mobile"
    route:
    - destination:
        host: user-service
        subset: v2
  - route:
    - destination:
        host: user-service
        subset: v1
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: user-service
spec:
  host: user-service
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

## Canary Deployment

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
  - user-service
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: user-service
        subset: v2
  - route:
    - destination:
        host: user-service
        subset: v1
      weight: 90
    - destination:
        host: user-service
        subset: v2
      weight: 10
```

## Circuit Breaker

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: user-service
spec:
  host: user-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 40
```

## Retries and Timeouts

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
  - user-service
  http:
  - route:
    - destination:
        host: user-service
    timeout: 10s
    retries:
      attempts: 3
      perTryTimeout: 2s
      retryOn: 5xx,reset,connect-failure,refused-stream
```

## Mutual TLS (mTLS)

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: default
spec:
  mtls:
    mode: STRICT
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: user-service
spec:
  host: user-service
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
```

## Authorization Policies

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: user-service-authz
  namespace: default
spec:
  selector:
    matchLabels:
      app: user-service
  action: ALLOW
  rules:
  - from:
    - source:
        principals:
        - cluster.local/ns/default/sa/api-gateway
    to:
    - operation:
        methods: ["GET", "POST"]
        paths: ["/users/*"]
```

## Service-to-Service Communication in Go

No code changes needed! Istio sidecar handles everything.

```go
package main

import (
    "encoding/json"
    "net/http"
    
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()
    
    r.GET("/users/:id", getUser)
    r.POST("/orders", createOrder)
    
    r.Run(":8080")
}

func createOrder(c *gin.Context) {
    var order Order
    c.BindJSON(&order)
    
    // Call user-service - Istio handles mTLS, retries, tracing
    resp, err := http.Get("http://user-service:8080/users/" + order.UserID)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    defer resp.Body.Close()
    
    var user User
    json.NewDecoder(resp.Body).Decode(&user)
    
    // Process order
    order.UserEmail = user.Email
    
    c.JSON(200, order)
}
```

## Distributed Tracing

Istio automatically integrates with Jaeger.

```go
package main

import (
    "net/http"
    
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()
    
    // Add tracing headers middleware
    r.Use(PropagateTracingHeaders())
    
    r.GET("/users/:id", getUser)
    
    r.Run(":8080")
}

func PropagateTracingHeaders() gin.HandlerFunc {
    tracingHeaders := []string{
        "x-request-id",
        "x-b3-traceid",
        "x-b3-spanid",
        "x-b3-parentspanid",
        "x-b3-sampled",
        "x-b3-flags",
        "x-ot-span-context",
    }
    
    return func(c *gin.Context) {
        // Store headers for downstream requests
        headers := make(map[string]string)
        for _, header := range tracingHeaders {
            if value := c.GetHeader(header); value != "" {
                headers[header] = value
            }
        }
        
        c.Set("tracing_headers", headers)
        c.Next()
    }
}

func getUser(c *gin.Context) {
    userID := c.Param("id")
    
    // Call another service
    req, _ := http.NewRequest("GET", "http://profile-service:8080/profiles/"+userID, nil)
    
    // Propagate tracing headers
    if headers, exists := c.Get("tracing_headers"); exists {
        for k, v := range headers.(map[string]string) {
            req.Header.Set(k, v)
        }
    }
    
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    
    // Process response
    c.JSON(200, gin.H{"user_id": userID})
}
```

## Observability

### Prometheus Metrics

Istio automatically exports metrics.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: istio-system
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
```

### Grafana Dashboard

```bash
# Access Grafana
kubectl port-forward -n istio-system svc/grafana 3000:3000
```

### Kiali (Service Graph)

```bash
# Access Kiali
kubectl port-forward -n istio-system svc/kiali 20001:20001
```

## Traffic Shifting (Blue-Green)

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
  - user-service
  http:
  - route:
    - destination:
        host: user-service
        subset: v1
      weight: 100
    - destination:
        host: user-service
        subset: v2
      weight: 0
```

Shift traffic to v2:
```bash
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
  - user-service
  http:
  - route:
    - destination:
        host: user-service
        subset: v1
      weight: 0
    - destination:
        host: user-service
        subset: v2
      weight: 100
EOF
```

## Fault Injection

Test resilience by injecting failures.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
  - user-service
  http:
  - fault:
      delay:
        percentage:
          value: 10
        fixedDelay: 5s
      abort:
        percentage:
          value: 5
        httpStatus: 503
    route:
    - destination:
        host: user-service
```

## Linkerd Alternative

Simpler, lighter alternative to Istio.

```bash
# Install Linkerd
curl -sL https://run.linkerd.io/install | sh
linkerd install | kubectl apply -f -

# Inject Linkerd proxy
kubectl get deploy -o yaml | linkerd inject - | kubectl apply -f -
```

### Linkerd Service Profile

```yaml
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: user-service.default.svc.cluster.local
  namespace: default
spec:
  routes:
  - name: GET /users/{id}
    condition:
      method: GET
      pathRegex: /users/\d+
    timeout: 5s
    retries:
      limit: 3
      retryableStatusCodes:
      - 500
      - 502
      - 503
```

## Consul Connect

```yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service
  annotations:
    "consul.hashicorp.com/connect-inject": "true"
spec:
  selector:
    app: user-service
  ports:
  - port: 8080
```

## Best Practices

1. **Start Simple**: Use Linkerd for simplicity
2. **Gradual Rollout**: Enable mesh per namespace
3. **Monitor**: Use Grafana, Kiali
4. **Test Fault Injection**: Validate resilience
5. **Secure by Default**: Enable mTLS
6. **Resource Limits**: Set sidecar CPU/memory
7. **Trace Propagation**: Forward headers
8. **Circuit Breakers**: Protect services
9. **Timeouts**: Set appropriate values
10. **Versioning**: Use subsets for versions

## When to Use Service Mesh?

### Use When:
- Multiple microservices (10+)
- Need mTLS everywhere
- Complex traffic routing
- Advanced observability
- Polyglot services

### Avoid When:
- Monolith or few services
- Simple architecture
- Resource-constrained
- Team lacks expertise

## Comparison

| Feature | Istio | Linkerd | Consul |
|---------|-------|---------|--------|
| Complexity | High | Low | Medium |
| Performance | Good | Excellent | Good |
| Features | Most | Essential | Medium |
| CPU/Memory | High | Low | Medium |
| Learning Curve | Steep | Gentle | Medium |

## Summary

Service Mesh provides:
- **Traffic Management**: Routing, load balancing
- **Security**: mTLS, authorization
- **Observability**: Tracing, metrics
- **Resilience**: Retries, circuit breakers
- **No Code Changes**: Infrastructure layer

Essential for large-scale microservices but adds complexity. Consider alternatives like API Gateway or libraries for simpler use cases.
