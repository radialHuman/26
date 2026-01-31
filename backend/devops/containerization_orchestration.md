# Docker & Kubernetes: Complete Container Orchestration Guide

## Table of Contents
1. [Introduction & History](#introduction--history)
2. [Why Containers & Orchestration](#why-containers--orchestration)
3. [Docker Deep Dive](#docker-deep-dive)
4. [Docker Networking](#docker-networking)
5. [Docker Storage](#docker-storage)
6. [Docker Compose](#docker-compose)
7. [Kubernetes Architecture](#kubernetes-architecture)
8. [Kubernetes Core Concepts](#kubernetes-core-concepts)
9. [Kubernetes Networking](#kubernetes-networking)
10. [Kubernetes Storage](#kubernetes-storage)
11. [Production Best Practices](#production-best-practices)
12. [Hands-On Projects](#hands-on-projects)

---

## Introduction & History

### The Evolution of Deployment

**2000s: Physical Servers**
- **Problem**: One app per server = expensive, wasteful (10-15% utilization).
- **Challenges**: Long provisioning times (weeks), no isolation.

**2006: Virtualization (VMware, Xen)**
- **Solution**: Multiple VMs on one physical server.
- **Benefits**: Better utilization (60-70%), isolation, snapshots.
- **Drawbacks**: Guest OS overhead (~1GB RAM, slow boot).

**2013: Docker & Containers**
- **Problem**: VMs too heavyweight, portability issues ("works on my machine").
- **Solomon Hykes** presented Docker at PyCon.
- **Innovation**: Containerization using Linux namespaces + cgroups.
- **Result**: Lightweight (MBs vs GBs), fast startup (seconds vs minutes).

**2014: Kubernetes**
- **Problem**: Managing thousands of containers across hundreds of machines.
- **Google** open-sourced Kubernetes (based on internal Borg system).
- **Impact**: Became industry standard for container orchestration.

**Timeline**:
```
2000: Physical servers
2006: VMware ESX (virtualization)
2008: Linux cgroups (resource isolation)
2013: Docker released
2014: Kubernetes v1.0
2015: Docker Swarm, Mesos
2017: Kubernetes wins orchestration war
2020: Kubernetes everywhere (cloud, edge, on-prem)
```

---

## Why Containers & Orchestration

### The What: Containers vs VMs

**Virtual Machines**:
```
┌─────────────────────────────────┐
│         Hardware                │
├─────────────────────────────────┤
│         Hypervisor              │
├─────────┬─────────┬─────────────┤
│  VM 1   │  VM 2   │   VM 3      │
│  ┌───┐  │  ┌───┐  │   ┌───┐    │
│  │App│  │  │App│  │   │App│    │
│  ├───┤  │  ├───┤  │   ├───┤    │
│  │Lib│  │  │Lib│  │   │Lib│    │
│  ├───┤  │  ├───┤  │   ├───┤    │
│  │ OS│  │  │ OS│  │   │ OS│    │ ← Guest OS overhead
│  └───┘  │  └───┘  │   └───┘    │
└─────────┴─────────┴─────────────┘
```

**Containers**:
```
┌─────────────────────────────────┐
│         Hardware                │
├─────────────────────────────────┤
│         Host OS (Linux)         │
├─────────────────────────────────┤
│    Container Runtime (Docker)   │
├─────────┬─────────┬─────────────┤
│  Ctr 1  │  Ctr 2  │   Ctr 3     │
│  ┌───┐  │  ┌───┐  │   ┌───┐    │
│  │App│  │  │App│  │   │App│    │
│  ├───┤  │  ├───┤  │   ├───┤    │
│  │Lib│  │  │Lib│  │   │Lib│    │ ← Shared kernel
│  └───┘  │  └───┘  │   └───┘    │
└─────────┴─────────┴─────────────┘
```

**Comparison**:

| Aspect | VM | Container |
|--------|-----|-----------|
| Size | GBs | MBs |
| Startup | Minutes | Seconds |
| Isolation | Strong (separate kernel) | Process-level |
| Overhead | High | Low |
| Portability | OS-dependent | Highly portable |

### The Why: Business & Technical Benefits

**1. Consistency ("Works on My Machine" → "Works Everywhere")**
```bash
# Developer laptop
docker run myapp

# Staging server
docker run myapp

# Production (same image)
docker run myapp
```

**2. Resource Efficiency**
```
100 VMs:  
- 100 x 1GB (OS) = 100GB wasted
- 100 x 5GB (app) = 500GB
- Total: 600GB

100 Containers:
- 1 x Host OS = 5GB
- 100 x 50MB (app) = 5GB
- Total: 10GB (60x reduction!)
```

**3. Scalability**
```bash
# Scale from 1 to 100 instances in seconds
kubectl scale deployment myapp --replicas=100
```

**4. Microservices Enablement**
```
Monolith: One giant app
Microservices: 20 small containers
            - Independently deployable
            - Different languages
            - Isolated failures
```

---

## Docker Deep Dive

### How Docker Works

**Under the Hood (Linux)**:

**1. Namespaces** (Isolation):
```
PID namespace:  Process IDs isolated (PID 1 inside container)
NET namespace:  Network stack isolated
MNT namespace:  Filesystem mounts isolated
UTS namespace:  Hostname isolated
IPC namespace:  Inter-process communication isolated
USER namespace: User IDs isolated
```

**2. cgroups** (Resource Limits):
```
CPU:    Limit CPU usage (e.g., 1 core)
Memory: Limit RAM (e.g., 512MB)
Disk I/O: Limit read/write
Network: Limit bandwidth
```

**3. Union File System** (Layered Images):
```
Image Layers (read-only):
Layer 4: App code       ← 10MB
Layer 3: Dependencies   ← 50MB
Layer 2: Python         ← 100MB
Layer 1: Ubuntu base    ← 200MB

Container Layer (read-write): ← 0MB (initially)
All layers merged via OverlayFS
```

### Dockerfile Best Practices

```dockerfile
# Multi-stage build (smaller final image)
# Stage 1: Build
FROM golang:1.21-alpine AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o app

# Stage 2: Runtime (minimal)
FROM alpine:3.18
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /build/app .
EXPOSE 8080
CMD ["./app"]

# Result: 
# builder stage: 500MB (not in final image)
# final image: 15MB
```

**Best Practices**:

```dockerfile
# 1. Use specific tags (not 'latest')
FROM node:18.17-alpine  # ✓ Good
FROM node:latest        # ✗ Bad (unpredictable)

# 2. Minimize layers (combine RUN commands)
RUN apt-get update && \
    apt-get install -y package1 package2 && \
    rm -rf /var/lib/apt/lists/*  # Cleanup in same layer

# 3. Order layers by change frequency (leverage cache)
COPY package.json package-lock.json ./  # Changes rarely
RUN npm install                         # Only re-runs if package.json changed
COPY . .                                # Changes often (last)

# 4. Use .dockerignore
# .dockerignore file:
node_modules
.git
*.log
```

### Docker Commands Cheat Sheet

```bash
# Build
docker build -t myapp:v1 .
docker build -t myapp:v1 -f Dockerfile.prod .

# Run
docker run -d -p 8080:80 --name web nginx
docker run -it --rm alpine sh  # Interactive + auto-remove
docker run -e DB_HOST=localhost myapp  # Environment variables
docker run -v $(pwd):/app myapp  # Mount volume

# Inspect
docker ps                # Running containers
docker ps -a             # All containers
docker logs container_id
docker logs -f container_id  # Follow logs
docker exec -it container_id sh  # Shell into container
docker inspect container_id

# Images
docker images
docker pull nginx:1.25
docker push myregistry.com/myapp:v1
docker rmi image_id

# Cleanup
docker rm container_id
docker rmi image_id
docker system prune -a  # Remove all unused images, containers
docker volume prune     # Remove unused volumes
```

---

## Docker Networking

### Network Modes

**1. Bridge (Default)**
```
┌─────────────────────────────┐
│         Host                │
│  ┌──────────────────────┐   │
│  │  Docker Bridge       │   │
│  │  (docker0: 172.17.0.1)│  │
│  │   ┌────────┬────────┐│   │
│  │   │ Cont 1 │ Cont 2 ││   │
│  │   │.17.0.2 │.17.0.3 ││   │
│  │   └────────┴────────┘│   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

```bash
# Create custom bridge network
docker network create mynetwork
docker run --network=mynetwork --name app1 nginx
docker run --network=mynetwork --name app2 nginx

# Containers can communicate by name
# app1 can ping app2 by hostname
```

**2. Host**
```
Container shares host's network stack
No network isolation
Performance: Lowest overhead
```

```bash
docker run --network=host nginx
# Container uses host's IP directly
```

**3. None**
```
No networking
Fully isolated
```

**4. Overlay** (Multi-host)
```
Used in Docker Swarm, Kubernetes
Containers on different hosts communicate
```

---

## Docker Compose

### What is Docker Compose?

Tool for defining multi-container applications.

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8080:80"
    environment:
      - DB_HOST=db
    depends_on:
      - db
      - redis
    networks:
      - backend
    volumes:
      - ./app:/app
    restart: unless-stopped
  
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - backend
  
  redis:
    image: redis:7-alpine
    networks:
      - backend

networks:
  backend:
    driver: bridge

volumes:
  db-data:
```

**Commands**:
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale service
docker-compose up -d --scale web=3

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

## Kubernetes Architecture

### Control Plane vs Worker Nodes

```
┌───────────────────────────────────────────┐
│         Control Plane                     │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │ API Server   │  │ Scheduler        │  │
│  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │ etcd         │  │ Controller Mgr   │  │
│  └──────────────┘  └──────────────────┘  │
└───────────────────────────────────────────┘
           │
      ┌────┴────┬────────────┐
      ▼         ▼            ▼
┌──────────┬──────────┬──────────┐
│  Node 1  │  Node 2  │  Node 3  │
│  ┌────┐  │  ┌────┐  │  ┌────┐  │
│  │Pod │  │  │Pod │  │  │Pod │  │
│  └────┘  │  └────┘  │  └────┘  │
│  ┌────────────┐     │           │
│  │ kubelet    │     │           │
│  │ kube-proxy │     │           │
│  └────────────┘     │           │
└──────────┴──────────┴──────────┘
```

**Control Plane Components**:

**1. API Server** (`kube-apiserver`):
- Front-end for Kubernetes
- All communication goes through it
- RESTful API

**2. etcd**:
- Distributed key-value store
- Stores cluster state
- Source of truth

**3. Scheduler** (`kube-scheduler`):
- Assigns pods to nodes
- Considers: resources, constraints, affinity

**4. Controller Manager** (`kube-controller-manager`):
- Runs controllers (replication, endpoints, etc.)
- Ensures desired state = actual state

**Worker Node Components**:

**1. kubelet**:
- Agent on each node
- Ensures containers are running
- Reports to API server

**2. kube-proxy**:
- Network proxy
- Maintains network rules
- Enables service communication

**3. Container Runtime**:
- Docker, containerd, CRI-O
- Runs containers

---

## Kubernetes Core Concepts

### Pods

**Smallest deployable unit** in Kubernetes.

**Pod = 1+ Containers + Shared Resources**:
```
┌────────────────────────────┐
│          Pod               │
│  ┌──────────┐ ┌─────────┐ │
│  │Container │ │ Sidecar │ │
│  │  (App)   │ │ (Logs)  │ │
│  └──────────┘ └─────────┘ │
│  Shared:                   │
│  - Network (localhost)     │
│  - Volumes                 │
│  - IP Address              │
└────────────────────────────┘
```

**YAML**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  containers:
  - name: app
    image: myapp:v1
    ports:
    - containerPort: 8080
    env:
    - name: DB_HOST
      value: "postgres"
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
```

### Deployments

**Manages ReplicaSets**, which manage Pods.

```
Deployment
    │
    ▼
ReplicaSet (v1)      ReplicaSet (v2)
    │                     │
    ▼                     ▼
Pod  Pod  Pod         Pod  Pod  Pod
```

**YAML**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:v1
        ports:
        - containerPort: 8080
```

**Rolling Update**:
```bash
# Update image
kubectl set image deployment/myapp app=myapp:v2

# Rollback
kubectl rollout undo deployment/myapp

# Status
kubectl rollout status deployment/myapp
```

### Services

**Exposes Pods** (pods are ephemeral, services are stable).

**Types**:

**1. ClusterIP** (default):
```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  type: ClusterIP  # Only accessible within cluster
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
```

**2. NodePort**:
```yaml
spec:
  type: NodePort  # Accessible on each node's IP at static port
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30001  # 30000-32767
```

**3. LoadBalancer**:
```yaml
spec:
  type: LoadBalancer  # Provisions cloud load balancer (AWS ELB, etc.)
  ports:
  - port: 80
    targetPort: 8080
```

**4. ExternalName**:
```yaml
spec:
  type: ExternalName
  externalName: my.database.example.com  # CNAME
```

### ConfigMaps & Secrets

**ConfigMap** (non-sensitive):
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_URL: "postgres://localhost:5432/db"
  LOG_LEVEL: "info"
```

**Secret** (sensitive, base64-encoded):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
data:
  password: cGFzc3dvcmQxMjM=  # base64("password123")
```

**Usage**:
```yaml
spec:
  containers:
  - name: app
    envFrom:
    - configMapRef:
        name: app-config
    - secretRef:
        name: app-secret
    
    # Or individual values
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: app-secret
          key: password
```

---

## Hands-On: Complete Application Deployment

### Project Structure
```
myapp/
├── Dockerfile
├── docker-compose.yml
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── ingress.yaml
│   └── hpa.yaml
└── app/
    └── main.go
```

### 1. Application Code

**main.go**:
```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	http.HandleFunc("/", handler)
	http.HandleFunc("/health", healthHandler)
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func handler(w http.ResponseWriter, r *http.Request) {
	hostname, _ := os.Hostname()
	env := os.Getenv("ENVIRONMENT")
	fmt.Fprintf(w, "Hello from %s\nEnvironment: %s\n", hostname, env)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "OK")
}
```

### 2. Dockerfile

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /build
COPY app/ .
RUN go build -o server main.go

FROM alpine:3.18
COPY --from=builder /build/server /server
EXPOSE 8080
CMD ["/server"]
```

### 3. Kubernetes Manifests

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:v1
        ports:
        - containerPort: 8080
        env:
        - name: ENVIRONMENT
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: environment
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 3
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
```

**service.yaml**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

**configmap.yaml**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  environment: "production"
```

**hpa.yaml** (Horizontal Pod Autoscaler):
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 4. Deployment Commands

```bash
# Build image
docker build -t myapp:v1 .

# Test locally
docker run -p 8080:8080 myapp:v1

# Start Minikube (local Kubernetes)
minikube start

# Load image into Minikube
minikube image load myapp:v1

# Deploy to Kubernetes
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml

# Check status
kubectl get pods
kubectl get services
kubectl get deployments

# View logs
kubectl logs -f deployment/myapp

# Scale manually
kubectl scale deployment myapp --replicas=5

# Update image
kubectl set image deployment/myapp app=myapp:v2

# Rollback
kubectl rollout undo deployment/myapp

# Delete resources
kubectl delete -f k8s/
```

---

## Production Best Practices

### 1. Resource Management
```yaml
resources:
  requests:  # Guaranteed resources
    memory: "64Mi"
    cpu: "100m"
  limits:    # Maximum resources
    memory: "128Mi"
    cpu: "200m"
```

### 2. Health Checks
```yaml
livenessProbe:   # Restart if fails
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  
readinessProbe:  # Remove from service if fails
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
```

### 3. Security
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  capabilities:
    drop:
    - ALL
```

### 4. Logging
```bash
# Centralized logging with EFK stack
# Elasticsearch + Fluentd + Kibana
```

### 5. Monitoring
```bash
# Prometheus + Grafana
kubectl apply -f prometheus-operator.yaml
```

---

This comprehensive guide covers Docker and Kubernetes from fundamentals to production deployment. Let me continue creating more files.
