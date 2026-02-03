# Complete Kubernetes & Container Deployment Guide
## From Zero to Production

---

## PART 1: PREREQUISITES - UNDERSTANDING CONTAINERS

### 1.1 What Problem Does Containerization Solve?

**The Core Idea:**
- Your application runs on your laptop perfectly
- It breaks on your colleague's machine (different OS, different Python version, missing dependencies)
- It breaks in production (environment is completely different)
- Solution: Bundle your entire application WITH its dependencies, OS libraries, and configuration into a single unit

**Analogy:**
Instead of shipping car parts separately (engine, wheels, dashboard), you ship a ready-to-run car. Anyone who gets the car can run it immediately, anywhere.

### 1.2 Docker - The Container Technology

**What Docker Does:**
- Takes your application code + all dependencies + OS libraries
- Creates a standardized "container" - a lightweight virtual machine
- This container runs identically everywhere (your laptop, CI/CD pipeline, production server)

**Key Docker Concepts:**

**Images:** Blueprint/template (like a recipe or architectural plan)
- Immutable - never changes after creation
- Contains: base OS (lightweight Linux), your code, all libraries, configuration
- Stored in registries (Docker Hub, AWS ECR, private registries)

**Containers:** Running instance of an image (like a running app)
- Can be started, stopped, killed
- Multiple containers can run from the same image
- Each container is isolated from others

**Dockerfile:** Instructions to build an image
```dockerfile
# Start from a base image (lightweight Linux with Node.js)
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy your code into the container
COPY package.json package-lock.json ./

# Run commands to install dependencies
RUN npm install

# Copy the rest of your code
COPY . .

# Expose port 3000
EXPOSE 3000

# Command to run when container starts
CMD ["npm", "start"]
```

**Registry:** Central place to store and retrieve images (like GitHub for code)
- Docker Hub (public)
- AWS ECR, Google GCR, Azure ACR (cloud registries)
- Private registries in your company

**Key Points:**
- Docker solves: "works on my machine" problem
- Containers are lightweight (MB, not GB like VMs)
- Containers start in milliseconds
- You control exactly what's inside

### 1.3 Container Networking Basics

**Port Mapping:** How connections reach your container
- Container runs on port 3000 internally
- You map it to port 8080 on the host machine
- External traffic: localhost:8080 → container:3000

**Environment Variables:** Pass configuration to containers
```bash
docker run -e DATABASE_URL=postgres://... -e API_KEY=secret myapp
```

**Volumes:** Persistent data outside container
- Container is temporary - data inside is lost when container stops
- Volumes let containers write to host machine or network storage
- Used for databases, logs, user uploads

---

## PART 2: KUBERNETES FUNDAMENTALS

### 2.1 Why Kubernetes? The Problem It Solves

**With Docker Alone:**
- You have containers running on your laptop - easy ✓
- Now you need to run 100 containers across 20 servers in production
- Servers fail, need to restart containers automatically
- Traffic spikes - need to scale from 5 to 50 containers instantly
- How do you manage networking between containers?
- How do you do zero-downtime deployments?
- How do you monitor and update 100+ containers?

**Kubernetes Solution:** Automates all of this
- Automatically restarts failed containers
- Scales containers up/down based on traffic
- Distributes containers across servers
- Manages networking between them
- Zero-downtime deployments (rolling updates)
- Monitors health, auto-heals

### 2.2 Kubernetes Architecture - The High Level

```
┌─────────────────────────────────────────────────┐
│         KUBERNETES CLUSTER                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐      ┌──────────────┐       │
│  │  NODE 1      │      │  NODE 2      │       │
│  │              │      │              │       │
│  │  ┌────────┐  │      │  ┌────────┐  │       │
│  │  │Pod (ct)│  │      │  │Pod (ct)│  │       │
│  │  └────────┘  │      │  └────────┘  │       │
│  │              │      │              │       │
│  │  ┌────────┐  │      │  ┌────────┐  │       │
│  │  │Pod (ct)│  │      │  │Pod (ct)│  │       │
│  │  └────────┘  │      │  └────────┘  │       │
│  └──────────────┘      └──────────────┘       │
│                                                 │
│  ┌────────────────────────────────────────┐   │
│  │     Control Plane (Master)             │   │
│  │  - API Server                          │   │
│  │  - Scheduler                           │   │
│  │  - Controller Manager                  │   │
│  │  - etcd (state database)               │   │
│  └────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Cluster:** Your entire Kubernetes system
- Collection of servers (called Nodes)
- Running on-premises or in cloud (AWS, GCP, Azure)

**Control Plane (Master):** The brain
- API Server: All commands go through here (kubectl talk to API Server)
- Scheduler: Decides which node gets new containers
- Controller Manager: Ensures desired state matches actual state
- etcd: Database storing all cluster state

**Nodes:** Worker machines (can be VMs or physical servers)
- Run your containers
- Kubelet: Agent that talks to Control Plane
- Container runtime: Docker (or containerd, etc.)

**Pod:** Smallest deployable unit (usually = 1 container)
- Can contain multiple containers, but rare
- Containers in a pod share networking, storage
- Think: "container wrapper" in Kubernetes terms

### 2.3 Core Kubernetes Objects (What YAML Files Define)

**Deployment:** "Run this container image in 5 replicas"
- Most common way to deploy applications
- Handles rolling updates, rollbacks
- Automatically replaces failed pods

**Service:** "How to reach my deployment"
- Network abstraction
- Gives stable IP/DNS name
- Load balances traffic across pods
- Types: ClusterIP (internal), NodePort (external), LoadBalancer (cloud LB)

**ConfigMap:** Non-sensitive configuration
- Key-value pairs: API_ENV=prod, LOG_LEVEL=debug
- Mounted as files or environment variables

**Secret:** Sensitive data (passwords, API keys, certificates)
- Stored encrypted (at rest)
- Mounted as files or environment variables
- Never commit to git

**PersistentVolume (PV):** Storage resource in cluster
- Actual storage (disk, network storage, cloud storage)
- Similar to "reserving disk space"

**PersistentVolumeClaim (PVC):** "I need storage"
- Your deployment requests storage via PVC
- Kubernetes connects it to a PV

**Namespace:** Virtual cluster within cluster
- Isolates resources (production, staging, development)
- Access control boundaries

**Ingress:** Route external HTTP/HTTPS traffic
- "For domain example.com, route to my service"
- Replaces need for LoadBalancer service in many cases

---

## PART 3: YAML FILES EXPLAINED

### 3.1 YAML Basics (Syntax)

```yaml
# Comments start with #

# Key-value pairs
name: John
age: 30

# Lists (arrays)
hobbies:
  - reading
  - gaming
  - coding

# Nested objects
person:
  name: John
  age: 30
  address:
    city: NYC
    zip: "10001"

# Strings
string1: hello
string2: "hello world"  # quotes for strings with spaces
string3: 'single quotes also work'

# Numbers and booleans
count: 5
enabled: true
disabled: false

# Multi-line strings
description: |
  This is a multi-line string
  It preserves newlines
  Useful for scripts

# Indentation matters! (2 spaces typical in Kubernetes)
```

### 3.2 Basic Deployment YAML

```yaml
apiVersion: apps/v1                    # Kubernetes API version
kind: Deployment                       # What type of object (Deployment, Service, etc.)
metadata:
  name: my-app                         # Name of this deployment
  namespace: default                   # Namespace
  labels:
    app: my-app                        # Labels (key-value tags for grouping)
    version: v1

spec:                                  # Specification/desired state
  replicas: 3                          # Run 3 copies of this pod
  
  selector:                            # Which pods this deployment manages
    matchLabels:
      app: my-app                      # Must match pod labels below
  
  template:                            # Pod template
    metadata:
      labels:
        app: my-app                    # Pods created from this template get these labels
        version: v1
    
    spec:
      containers:                      # List of containers in the pod
      - name: app                      # Container name
        image: myregistry/myapp:1.0    # Container image (registry/name:tag)
        imagePullPolicy: IfNotPresent  # IfNotPresent, Always, Never
        
        ports:
        - name: http                   # Port name (arbitrary, for readability)
          containerPort: 3000          # Port container listens on
          protocol: TCP
        
        env:                           # Environment variables
        - name: DATABASE_URL
          value: "postgres://localhost/mydb"
        
        - name: API_KEY                # Sensitive values from Secrets
          valueFrom:
            secretKeyRef:
              name: api-secret         # Secret object name
              key: api-key             # Key within that secret
        
        resources:
          requests:
            memory: "64Mi"             # Container needs minimum 64MB RAM
            cpu: "100m"                # 100 millicores (0.1 CPU)
          limits:
            memory: "128Mi"            # Container can use max 128MB RAM
            cpu: "200m"                # Max 0.2 CPU
        
        livenessProbe:                 # Is container alive? Restart if not
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        
        readinessProbe:                # Is container ready for traffic?
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        
        volumeMounts:                  # Mount storage
        - name: config
          mountPath: /etc/config       # Where to mount in container
          readOnly: true
      
      volumes:                         # Define volumes
      - name: config
        configMap:
          name: app-config             # Reference ConfigMap object
```

**What This Does:**
1. Creates 3 pods with your container image
2. Assigns labels for identification
3. Sets up environment variables
4. Defines resource limits
5. Sets up health checks
6. Mounts configuration files

### 3.3 Service YAML

A **Service YAML** in Kubernetes is a configuration file (written in YAML format) that defines a **Service** resource. A Service provides a stable network endpoint to access a set of Pods, enabling reliable communication within your cluster or from outside.

### Why use a Service YAML?
- **Pod IPs are ephemeral:** Pods can be recreated, changing their IPs. Services provide a consistent way to reach them.
- **Load balancing:** Services distribute traffic across multiple Pods.
- **Discovery:** Other components can find and connect to your app via the Service name.

### When to use a Service?
- When you want to expose your app to other Pods or users.
- When you need load balancing across multiple replicas.
- When you want to expose your app outside the cluster (using a Service of type `NodePort` or `LoadBalancer`).

### Example: Exposing a Deployment with a Service

````yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: ClusterIP
````

**Explanation:**
- `selector`: Matches Pods with `app: my-app` label.
- `ports`: Maps port 80 on the Service to port 8080 on the Pods.
- `type: ClusterIP`: Exposes the Service internally within the cluster.

**Gotcha:**  
If you want external access, use `type: NodePort` or `LoadBalancer` instead of `ClusterIP`.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service               # DNS name for internal access
  namespace: default
  labels:
    app: my-app

spec:
  type: ClusterIP                     # ClusterIP, NodePort, or LoadBalancer
  
  ports:
  - name: http
    port: 80                          # Port exposed by service (external)
    targetPort: 3000                  # Port on pod (internal)
    protocol: TCP
  
  selector:
    app: my-app                       # Routes to pods with this label
  
  sessionAffinity: None               # or ClientIP for sticky sessions
```

**Types Explained:**

**ClusterIP** (default):
- Internal only, accessible only within cluster
- Other pods reach it at: http://my-app-service:80
- Use this for internal services (databases, cache, APIs)

**NodePort**:
- Exposes on all nodes at a specific port
- Access from outside: http://nodeIP:nodePort
- Kubernetes assigns port 30000-32767
- Use for development/testing

**LoadBalancer**:
- Creates external load balancer (requires cloud provider)
- Gets external IP automatically
- Used for public APIs, web apps
- Most common for production public services

### 3.4 ConfigMap YAML

rdlcci: write here explaination of whats a config map yaml? whay to use and when to, give exmaple

GitHub Copilot: A **ConfigMap YAML** in Kubernetes is a way to store non-sensitive configuration data as key-value pairs, separate from your application code. This allows you to manage and update configuration without rebuilding your container images.

### Why use a ConfigMap?
- **Decouples configuration from code:** You can change settings without modifying or redeploying your app.
- **Centralized management:** Store all config in one place, making it easier to update and maintain.
- **Environment flexibility:** Use different configs for dev, staging, and production environments.

### When to use a ConfigMap?
- When you need to provide environment variables, command-line arguments, or configuration files to your pods.
- For settings like log levels, feature flags, or connection strings that aren't secrets.

### Example

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "info"
  FEATURE_X_ENABLED: "true"
  config.json: |
    {
      "maxConnections": 100,
      "timeout": 30
    }
```

You can then mount this ConfigMap as environment variables or files in your pods. For sensitive data (like passwords), use a **Secret** instead of a ConfigMap.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: default

data:
  # Simple key-value pairs
  LOG_LEVEL: "debug"
  DATABASE_POOL_SIZE: "10"
  CACHE_TTL: "3600"
  
  # Or complex files
  nginx.conf: |
    server {
      listen 80;
      location / {
        proxy_pass http://localhost:3000;
      }
    }
  
  app-settings.json: |
    {
      "features": {
        "cache": true,
        "analytics": false
      }
    }
```

**Usage in Deployment:**
```yaml
containers:
- name: app
  env:
  - name: LOG_LEVEL
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: LOG_LEVEL
  
  volumeMounts:
  - name: nginx-config
    mountPath: /etc/nginx

volumes:
- name: nginx-config
  configMap:
    name: app-config
    items:
    - key: nginx.conf
      path: nginx.conf
```

### 3.5 Secret YAML


rdlcci: write here explaination of whats a secret map yaml? whay to use and when to, give exmaple

GitHub Copilot: A **Secret map YAML** in Kubernetes is a configuration file (written in YAML) used to define a `Secret` object. Secrets are designed to securely store sensitive data such as passwords, API keys, tokens, or certificates. Unlike ConfigMaps, which are intended for non-sensitive configuration data, Secrets ensure that confidential information is not exposed in plain text within your application manifests or container images.

### Why Use a Secret YAML?

- **Security:** Secrets are stored in base64-encoded form and can be restricted with RBAC, reducing the risk of accidental exposure.
- **Separation of Concerns:** Keeps sensitive data separate from application code and configuration.
- **Dynamic Updates:** You can update secrets without rebuilding or redeploying your application containers.
- **Integration:** Kubernetes can inject secrets as environment variables or mount them as files inside pods.

### When to Use a Secret?

- When you need to provide sensitive information (like database passwords, API tokens, TLS certificates) to your applications running in Kubernetes.
- When you want to avoid hardcoding secrets in your application code or Docker images.

### Example: Secret YAML

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-app-secret
type: Opaque
data:
  username: YWRtaW4=          # base64 for "admin"
  password: c2VjdXJlcGFzcw==  # base64 for "securepass"
```

**How to use:**  
You can reference this secret in your Pod or Deployment to inject the values as environment variables or mount them as files.

---

**Tip:**  
Always encode your secret values using base64 before placing them in the YAML. For example, to encode a password:

```sh
echo -n "securepass" | base64
```

---

**Summary:**  
Use Secret YAMLs whenever you need to manage sensitive data in Kubernetes, keeping your cluster secure and your configuration clean.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: api-secret
  namespace: default

type: Opaque                          # Generic secret type

data:
  # Base64 encoded values (echo -n "password" | base64)
  api-key: c2VjcmV0YXBpa2V5           # base64 encoded "secretapikey"
  db-password: cGFzc3dvcmQMTIz         # base64 encoded
```

**Creating Secrets (Better Method):**
```bash
# Don't put plaintext in YAML files!
# Create from command line or files

kubectl create secret generic api-secret \
  --from-literal=api-key=secretapikey \
  --from-literal=db-password=password123

# Or from files
kubectl create secret generic certs \
  --from-file=tls.crt=./cert.pem \
  --from-file=tls.key=./key.pem
```

**Usage in Deployment:**
```yaml
env:
- name: API_KEY
  valueFrom:
    secretKeyRef:
      name: api-secret
      key: api-key
```

### 3.6 PersistentVolumeClaim YAML

rdlcci: write here explaination of whats a PersistentVolumeClaim yaml? whay to use and when to, give exmaple

GitHub Copilot: A **PersistentVolumeClaim (PVC)** in Kubernetes is a YAML configuration that describes a user's request for storage resources. It acts as a bridge between your application and the underlying storage (like disks or network storage) managed by Kubernetes.

### What is a PersistentVolumeClaim YAML?

A PVC YAML file defines:
- **How much storage** you need (e.g., 5Gi).
- **What kind of storage** you want (e.g., SSD, HDD, access modes).
- **Other requirements** (like storage class).

Kubernetes uses this claim to find a suitable **PersistentVolume (PV)**—a piece of storage already provisioned or dynamically created.

### Why and When to Use a PVC?

- **Why:**  
  - Decouples storage from pods, making your apps portable.
  - Lets Kubernetes manage storage lifecycle.
  - Supports dynamic provisioning (storage is created on demand).

- **When:**  
  - When your app needs to store data persistently (e.g., databases, file uploads).
  - When you want to share storage between pods.
  - When you need storage that outlives pod restarts or rescheduling.

### Example PVC YAML

````yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard
````

**Explanation:**
- `accessModes`: How the volume can be mounted (e.g., `ReadWriteOnce` means one node can write).
- `resources.requests.storage`: Amount of storage requested.
- `storageClassName`: Type of storage (must match a StorageClass in your cluster).

**Usage:**  
You reference this PVC in your Pod or Deployment YAML to mount the storage:

````yaml
volumes:
  - name: my-storage
    persistentVolumeClaim:
      claimName: my-pvc
````

This ensures your app has reliable, persistent storage managed by Kubernetes.


```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: default

spec:
  accessModes:
    - ReadWriteOnce              # Can be mounted by one pod at a time
  
  storageClassName: fast         # Storage class (SSD, HDD, etc.)
  
  resources:
    requests:
      storage: 10Gi              # Request 10 gigabytes
```

**Access Modes:**
- ReadWriteOnce: Mounted by one pod, read-write
- ReadOnlyMany: Multiple pods, read-only
- ReadWriteMany: Multiple pods, read-write

**Used in Deployment:**
```yaml
containers:
- name: postgres
  volumeMounts:
  - name: db-storage
    mountPath: /var/lib/postgresql/data

volumes:
- name: db-storage
  persistentVolumeClaim:
    claimName: postgres-data
```

### 3.7 Ingress YAML (External Traffic)

rdlcci: write here explaination of whats a ingress yaml? whay to use and when to, give exmaple

GitHub Copilot: Certainly! Here’s a concise explanation you can add before your Ingress YAML example:

---

### What is an Ingress YAML in Kubernetes?

An **Ingress YAML** is a configuration file used in Kubernetes to define how external HTTP and HTTPS traffic is routed to services inside your cluster. It acts as a smart router, letting you expose multiple services under different URLs or domains, all through a single external IP address.

#### Why use Ingress?

- **Centralized Routing:** Manage access to multiple services using one resource.
- **TLS/HTTPS Support:** Easily enable SSL certificates for secure connections.
- **Path and Host-based Routing:** Route traffic based on URL paths or domain names.
- **Advanced Features:** Supports authentication, rate limiting, and more via annotations.

#### When should you use Ingress?

- When you want to expose multiple services externally under different domains or paths.
- When you need HTTPS/SSL termination for your services.
- When you want to manage routing rules in a single place.

#### Example Use Case

Suppose you have two services: a public API (`api.example.com`) and an admin dashboard (`admin.example.com`). Instead of exposing each service separately, you use an Ingress to route traffic to the correct service based on the domain name, and handle HTTPS certificates automatically.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod  # Enable HTTPS

spec:
  ingressClassName: nginx              # nginx, alb, etc.
  
  rules:
  - host: api.example.com              # Domain name
    http:
      paths:
      - path: /                        # URL path
        pathType: Prefix
        backend:
          service:
            name: my-app-service       # Route to this service
            port:
              number: 80
  
  - host: admin.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 8080
  
  # HTTPS certificates
  tls:
  - hosts:
    - api.example.com
    - admin.example.com
    secretName: api-tls-cert           # Secret with certificate
```

---

## PART 4: COMPLETE EXAMPLE - DEPLOYING A PYTHON WEB APP

### 4.1 The Application Structure

```
my-python-app/
├── app.py                    # Your Flask/FastAPI application
├── requirements.txt          # Python dependencies
├── Dockerfile               # Instructions to build image
├── .dockerignore            # What to exclude
└── k8s/                     # Kubernetes manifests
    ├── namespace.yaml
    ├── configmap.yaml
    ├── secret.yaml
    ├── deployment.yaml
    ├── service.yaml
    └── ingress.yaml
```

### 4.2 Example Python Application

```python
# app.py
from flask import Flask, jsonify
import os
import logging

app = Flask(__name__)

# Configuration from environment
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
DB_URL = os.getenv("DATABASE_URL", "sqlite:///app.db")
API_KEY = os.getenv("API_KEY", "default-key")

logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

@app.route("/health", methods=["GET"])
def health_check():
    """Used by Kubernetes liveness probe"""
    return jsonify({"status": "healthy"}), 200

@app.route("/ready", methods=["GET"])
def readiness_check():
    """Used by Kubernetes readiness probe"""
    try:
        # Check database connection, cache, etc.
        logger.info("App is ready")
        return jsonify({"status": "ready"}), 200
    except Exception as e:
        logger.error(f"Not ready: {e}")
        return jsonify({"status": "not ready", "error": str(e)}), 503

@app.route("/api/data", methods=["GET"])
def get_data():
    """Sample API endpoint"""
    return jsonify({
        "message": "Hello from Kubernetes!",
        "log_level": LOG_LEVEL,
        "environment": "production"
    }), 200

if __name__ == "__main__":
    logger.info(f"Starting app with DB: {DB_URL}")
    app.run(host="0.0.0.0", port=3000, debug=False)
```

### 4.3 Dockerfile

```dockerfile
# Build stage
FROM python:3.11-slim as builder

WORKDIR /tmp
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage (smaller final image)
FROM python:3.11-slim

WORKDIR /app

# Copy only what's needed from builder
COPY --from=builder /root/.local /root/.local
COPY app.py .

# Set environment variables
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

# Create non-root user (security best practice)
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check (docker-level, backup to Kubernetes probes)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:3000/health')"

EXPOSE 3000

CMD ["python", "app.py"]
```

### 4.4 Complete Kubernetes Manifests

**namespace.yaml** - Isolate resources
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
```

**configmap.yaml** - Non-sensitive config
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production

data:
  LOG_LEVEL: "INFO"
  DATABASE_POOL_SIZE: "5"
  CACHE_TTL: "3600"
```

**secret.yaml** - Sensitive data (CREATE SEPARATELY!)
```yaml
# DO NOT commit this to Git!
# Create with: kubectl create secret...
# But if defining in file:

apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: production

type: Opaque
stringData:  # plaintext - will be base64 encoded by Kubernetes
  api-key: "your-secret-api-key"
  db-password: "your-db-password"
```

**deployment.yaml** - The main deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-app
  namespace: production
  labels:
    app: python-app
    version: v1

spec:
  replicas: 3
  
  strategy:
    type: RollingUpdate          # Update pods one at a time
    rollingUpdate:
      maxSurge: 1                # Max 1 extra pod during update
      maxUnavailable: 0          # Keep all pods available
  
  selector:
    matchLabels:
      app: python-app
  
  template:
    metadata:
      labels:
        app: python-app
        version: v1
      annotations:
        prometheus.io/scrape: "true"  # Monitor this pod
        prometheus.io/port: "3000"
    
    spec:
      # Pod scheduling preferences
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - python-app
              topologyKey: kubernetes.io/hostname
      
      # Security context
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      
      # Service account (for RBAC)
      serviceAccountName: app-sa
      
      containers:
      - name: app
        image: myregistry.azurecr.io/python-app:1.0.0
        imagePullPolicy: IfNotPresent
        
        ports:
        - name: http
          containerPort: 3000
          protocol: TCP
        
        # Environment from ConfigMap
        envFrom:
        - configMapRef:
            name: app-config
        
        # Additional environment variables
        env:
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        
        # Sensitive data from Secret
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: api-key
        
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: db-password
        
        # Resource management
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        # Health checks
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        
        # Graceful shutdown
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sleep", "15"]  # Allow 15s for connection drain
        
        # Log collection
        volumeMounts:
        - name: log-volume
          mountPath: /var/log/app
      
      # Pod-level volumes
      volumes:
      - name: log-volume
        emptyDir: {}              # Temporary per-pod storage
      
      # Cleanup and restart policy
      restartPolicy: Always       # Restart failed pods
      terminationGracePeriodSeconds: 30  # Time to gracefully shutdown
```

**service.yaml** - Internal networking
```yaml
apiVersion: v1
kind: Service
metadata:
  name: python-app
  namespace: production
  labels:
    app: python-app

spec:
  type: ClusterIP
  
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
  
  selector:
    app: python-app
  
  sessionAffinity: None
```

**ingress.yaml** - External traffic
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: python-app-ingress
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/rate-limit: "100"

spec:
  ingressClassName: nginx
  
  tls:
  - hosts:
    - api.example.com
    secretName: python-app-tls
  
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: python-app
            port:
              number: 80
```

### 4.5 Deployment Commands

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create configmap
kubectl apply -f k8s/configmap.yaml

# Create secret (DO THIS SEPARATELY, DON'T COMMIT)
kubectl create secret generic app-secret \
  --namespace=production \
  --from-literal=api-key=your-key \
  --from-literal=db-password=your-password

# Or if you have a secret YAML file:
kubectl apply -f k8s/secret.yaml

# Deploy everything
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl get deployment -n production
kubectl get pods -n production
kubectl describe pod <pod-name> -n production
kubectl logs <pod-name> -n production

# Port forward for testing
kubectl port-forward -n production svc/python-app 8080:80

# Update deployment (new image)
kubectl set image deployment/python-app app=myregistry/python-app:1.0.1 -n production

# Rollback if needed
kubectl rollout undo deployment/python-app -n production
```

---

## PART 5: DATABASES AND STATEFUL SERVICES

### 5.1 PostgreSQL Deployment

**Why Stateful Services Are Different:**
- Deployments assume pods are interchangeable (stateless)
- Databases need persistent identity and storage
- Use StatefulSet instead

**postgres-statefulset.yaml:**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: databases

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: databases
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast
  resources:
    requests:
      storage: 50Gi

---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: databases
stringData:
  password: "strong-password-change-me"

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: databases
data:
  postgresql.conf: |
    max_connections = 200
    shared_buffers = 256MB
    effective_cache_size = 1GB
    maintenance_work_mem = 64MB
    checkpoint_completion_target = 0.9
    wal_buffers = 16MB
    default_statistics_target = 100

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: databases
spec:
  serviceName: postgres  # Required for StatefulSet
  replicas: 1
  
  selector:
    matchLabels:
      app: postgres
  
  template:
    metadata:
      labels:
        app: postgres
    
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        
        env:
        - name: POSTGRES_DB
          value: "myapp"
        - name: POSTGRES_USER
          value: "appuser"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        - name: postgres-config
          mountPath: /etc/postgresql
          readOnly: true
        
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - pg_isready -U appuser
          initialDelaySeconds: 30
          periodSeconds: 10
        
        readinessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - pg_isready -U appuser
          initialDelaySeconds: 10
          periodSeconds: 5
      
      volumes:
      - name: postgres-config
        configMap:
          name: postgres-config
  
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: fast
      resources:
        requests:
          storage: 50Gi

---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: databases
spec:
  clusterIP: None  # Headless service for StatefulSet
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

**Usage in Application:**
```yaml
# In your app deployment
env:
- name: DATABASE_URL
  value: "postgresql://appuser:password@postgres.databases.svc.cluster.local:5432/myapp"
```

### 5.2 Redis Cache Deployment

**redis-deployment.yaml:**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: caching

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: caching
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  
  template:
    metadata:
      labels:
        app: redis
    
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        
        args:
          - redis-server
          - "--appendonly"
          - "yes"
          - "--requirepass"
          - "redis-password"
        
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        
        volumeMounts:
        - name: redis-data
          mountPath: /data
        
        livenessProbe:
          exec:
            command:
            - redis-cli
            - ping
          initialDelaySeconds: 30
          periodSeconds: 10
      
      volumes:
      - name: redis-data
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: caching
spec:
  type: ClusterIP
  ports:
  - port: 6379
    targetPort: 6379
  selector:
    app: redis
```

**Usage in Application:**
```python
import redis
cache = redis.Redis(
    host='redis.caching.svc.cluster.local',
    port=6379,
    password='redis-password',
    decode_responses=True
)
```

---

## PART 6: NETWORKING AND SERVICE MESH CONCEPTS

### 6.1 Network Policies (Firewall Rules)

**Deny all traffic by default, allow only what's needed:**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app-network-policy
  namespace: production

spec:
  podSelector:
    matchLabels:
      app: python-app
  
  policyTypes:
  - Ingress
  - Egress
  
  ingress:
  # Allow from ingress controller
  - from:
    - podSelector:
        matchLabels:
          app: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  
  # Allow from monitoring
  - from:
    - podSelector: {}
      namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 3000
  
  egress:
  # Allow DNS
  - to:
    - podSelector: {}
      namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
  
  # Allow to database
  - to:
    - podSelector:
        matchLabels:
          app: postgres
      namespaceSelector:
        matchLabels:
          name: databases
    ports:
    - protocol: TCP
      port: 5432
  
  # Allow to cache
  - to:
    - podSelector:
        matchLabels:
          app: redis
      namespaceSelector:
        matchLabels:
          name: caching
    ports:
    - protocol: TCP
      port: 6379
  
  # Allow external HTTPS
  - to:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 443
```

### 6.2 Service-to-Service Communication

**Internal DNS naming:**
```
[service-name].[namespace].svc.cluster.local:[port]

Examples:
- postgres.databases.svc.cluster.local:5432
- redis.caching.svc.cluster.local:6379
- python-app.production.svc.cluster.local:80
```

---

## PART 7: LOAD BALANCING AND TRAFFIC MANAGEMENT

### 7.1 Multiple Replicas with Load Balancing

**Service automatically load balances across replicas:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-app
spec:
  replicas: 5  # 5 pods running
  # ... rest of config

---
apiVersion: v1
kind: Service
metadata:
  name: python-app
spec:
  type: ClusterIP
  selector:
    app: python-app  # Routes to all 5 pods
  ports:
  - port: 80
    targetPort: 3000
```

**How it works:**
- Service gets requests on :80
- Automatically distributes to all 5 pods on :3000
- Default is round-robin load balancing
- If pod crashes, traffic automatically reroutes

### 7.2 Advanced Load Balancing with Nginx Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: advanced-ingress
  namespace: production
  annotations:
    # Load balancing algorithm
    nginx.ingress.kubernetes.io/upstream-hash-by: "$http_x_user_id"  # Sticky sessions
    
    # Rate limiting
    nginx.ingress.kubernetes.io/limit-rps: "1000"
    nginx.ingress.kubernetes.io/limit-connections: "100"
    
    # SSL redirect
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    
    # CORS
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "*"

spec:
  ingressClassName: nginx
  
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api/v1
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      
      - path: /api/v2
        pathType: Prefix
        backend:
          service:
            name: api-v2-service
            port:
              number: 80
      
      - path: /uploads
        pathType: Prefix
        backend:
          service:
            name: storage-service
            port:
              number: 80
```

---

## PART 8: MONITORING AND LOGGING

### 8.1 Health Checks (Probes)

**Three types of probes:**

```yaml
containers:
- name: app
  
  # Liveness: Is the app still running?
  # If fails, kill and restart the pod
  livenessProbe:
    httpGet:
      path: /health
      port: 3000
    initialDelaySeconds: 30
    periodSeconds: 10
    timeoutSeconds: 5
    failureThreshold: 3
  
  # Readiness: Is the app ready to accept traffic?
  # If fails, remove from load balancer but don't restart
  readinessProbe:
    httpGet:
      path: /ready
      port: 3000
    initialDelaySeconds: 10
    periodSeconds: 5
    timeoutSeconds: 3
    failureThreshold: 3
  
  # Startup: Is the app still starting up?
  # For slow-starting apps
  startupProbe:
    httpGet:
      path: /startup
      port: 3000
    failureThreshold: 30
    periodSeconds: 10
```

**In Your Python App:**
```python
@app.route("/health", methods=["GET"])
def health():
    # Quick check: is process alive?
    return jsonify({"status": "alive"}), 200

@app.route("/ready", methods=["GET"])
def ready():
    # Detailed check: dependencies working?
    try:
        # Check database connection
        db.execute("SELECT 1")
        # Check cache
        cache.ping()
        return jsonify({"status": "ready"}), 200
    except Exception as e:
        return jsonify({"status": "not ready", "error": str(e)}), 503

@app.route("/startup", methods=["GET"])
def startup():
    # Still initializing?
    if not app.initialized:
        return jsonify({"status": "starting"}), 503
    return jsonify({"status": "started"}), 200
```

### 8.2 Metrics and Prometheus

**Enable metrics in your app:**

```python
from prometheus_client import Counter, Histogram, start_http_server
import time

# Create metrics
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

db_errors = Counter(
    'database_errors_total',
    'Total database errors'
)

# Start metrics server on port 8000
start_http_server(8000)

@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    # Record metrics
    duration = time.time() - request.start_time
    request_duration.labels(
        method=request.method,
        endpoint=request.endpoint
    ).observe(duration)
    
    request_count.labels(
        method=request.method,
        endpoint=request.endpoint,
        status=response.status_code
    ).inc()
    
    return response
```

**Scrape metrics with Prometheus:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    
    scrape_configs:
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
```

### 8.3 Logging Best Practices

**Write logs to stdout (for container log collection):**

```python
import logging
import sys
import json

# Structured logging (JSON format for parsing)
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'request_id': getattr(request, 'id', None),
        }
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        return json.dumps(log_data)

# Configure logging
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JSONFormatter())
logger = logging.getLogger()
logger.addHandler(handler)
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))
```

**View logs:**
```bash
# Current logs
kubectl logs -n production deployment/python-app

# Follow logs (tail -f)
kubectl logs -n production deployment/python-app -f

# Last hour
kubectl logs -n production deployment/python-app --since=1h

# From specific pod
kubectl logs -n production python-app-5d4f4c5d7-abc12 -f

# Previous pod (if crashed)
kubectl logs -n production python-app-5d4f4c5d7-abc12 --previous
```

---

## PART 9: DEPLOYMENT STRATEGIES AND ZERO-DOWNTIME UPDATES

### 9.1 Rolling Update (Default)

**Deploy new version gradually, keep service always available:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-app
spec:
  replicas: 5
  
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max 1 extra pod during update (6 total temporarily)
      maxUnavailable: 0  # Keep all 5 pods running during update
  
  template:
    metadata:
      labels:
        app: python-app
    spec:
      # Graceful shutdown
      terminationGracePeriodSeconds: 30
      
      containers:
      - name: app
        image: myregistry/python-app:1.0.1
        
        # Allow connections to drain
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sleep", "15"]
        
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

**How it works:**
1. Start 1 new pod with v1.0.1 (6 pods now: 5 old, 1 new)
2. Wait for new pod to be ready
3. Stop 1 old pod (5 pods: 4 old, 1 new)
4. Start another new pod (6 pods: 4 old, 2 new)
5. Repeat until all pods updated
6. During entire process, service remains available

**Commands:**
```bash
# Check rollout status
kubectl rollout status deployment/python-app -n production

# Pause rollout (investigate issues)
kubectl rollout pause deployment/python-app -n production

# Resume rollout
kubectl rollout resume deployment/python-app -n production

# Rollback to previous version
kubectl rollout undo deployment/python-app -n production

# View rollout history
kubectl rollout history deployment/python-app -n production

# Rollback to specific revision
kubectl rollout undo deployment/python-app -n production --to-revision=2
```

### 9.2 Canary Deployment (Advanced)

**Deploy to small % of traffic first, expand if successful:**

```yaml
# v1.0 (stable) - 90% traffic
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-app-stable
spec:
  replicas: 9
  selector:
    matchLabels:
      app: python-app
      version: stable
  template:
    metadata:
      labels:
        app: python-app
        version: stable
    spec:
      containers:
      - name: app
        image: myregistry/python-app:1.0.0

---
# v1.1 (canary) - 10% traffic
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-app-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: python-app
      version: canary
  template:
    metadata:
      labels:
        app: python-app
        version: canary
    spec:
      containers:
      - name: app
        image: myregistry/python-app:1.1.0

---
# Service routes to both (proportional to replicas)
apiVersion: v1
kind: Service
metadata:
  name: python-app
spec:
  selector:
    app: python-app
  ports:
  - port: 80
    targetPort: 3000
```

**Monitoring:**
```bash
# Get metrics on canary version
kubectl logs -n production -l version=canary -f

# Check error rates
# If errors low: scale up canary, scale down stable
# If errors high: kill canary, keep stable
```

---

## PART 10: SECURITY BEST PRACTICES

### 10.1 Security Context

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-app
spec:
  template:
    spec:
      # Pod-level security
      securityContext:
        runAsNonRoot: true           # Don't run as root
        runAsUser: 1000              # Run as specific user
        fsGroup: 1000                # Files owned by this group
        seccompProfile:
          type: RuntimeDefault       # Use container runtime's default
      
      containers:
      - name: app
        image: myregistry/python-app:1.0
        
        # Container-level security
        securityContext:
          allowPrivilegeEscalation: false  # Can't elevate privileges
          readOnlyRootFilesystem: true     # Read-only filesystem
          runAsNonRoot: true
          capabilities:
            drop:
            - ALL                    # Drop all Linux capabilities
```

### 10.2 RBAC (Role-Based Access Control)

**Create service account for app:**

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: production

---
# Role: What can be done
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-role
  namespace: production

rules:
# Can read ConfigMaps
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch"]

# Can read Secrets
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]

---
# RoleBinding: Connect SA to Role
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-rolebinding
  namespace: production

roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: app-role

subjects:
- kind: ServiceAccount
  name: app-sa
  namespace: production
```

**Use in deployment:**
```yaml
spec:
  template:
    spec:
      serviceAccountName: app-sa
```

### 10.3 Network Policies

Already covered in Part 6.

### 10.4 Secret Management

**Never commit secrets to Git!**

**Option 1: External Secret Manager**
```yaml
# Use AWS Secrets Manager, Azure Key Vault, HashiCorp Vault
# Install external-secrets controller
# Reference secrets from external system

apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: app-sa

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secret
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets
    kind: SecretStore
  target:
    name: app-secret
    creationPolicy: Owner
  data:
  - secretKey: api-key
    remoteRef:
      key: /myapp/api-key
  - secretKey: db-password
    remoteRef:
      key: /myapp/db-password
```

**Option 2: Sealed Secrets**
```bash
# Encrypt secrets before committing to Git
# Install sealed-secrets controller

kubeseal -f secret.yaml -w sealed-secret.yaml

# Commit sealed-secret.yaml to Git
# Only cluster can decrypt it
```

---

## PART 11: STORAGE AND PERSISTENCE

### 11.1 Storage Classes

**Define different storage types:**

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
allowVolumeExpansion: true

---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: slow
provisioner: ebs.csi.aws.com
parameters:
  type: gp2
allowVolumeExpansion: true

---
# Default storage class
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: default
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
```

### 11.2 Persistent Volumes

**Explicit PV creation (AWS EBS example):**

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: ebs-volume-1
spec:
  capacity:
    storage: 100Gi
  
  accessModes:
  - ReadWriteOnce
  
  storageClassName: fast
  
  awsElasticBlockStore:
    volumeID: vol-12345
    fsType: ext4
```

**PVC (automatic provisioning):**

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data
  namespace: production
spec:
  accessModes:
  - ReadWriteOnce
  
  storageClassName: fast
  
  resources:
    requests:
      storage: 50Gi
```

### 11.3 StatefulSet with Persistent Storage

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: database
spec:
  serviceName: database
  replicas: 1
  
  selector:
    matchLabels:
      app: database
  
  template:
    metadata:
      labels:
        app: database
    spec:
      containers:
      - name: db
        image: postgres:15
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  
  # Automatic PVC creation per pod
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: fast
      resources:
        requests:
          storage: 100Gi
```

---

## PART 12: ADVANCED PATTERNS

### 12.1 Init Containers (Setup Before App Starts)

```yaml
spec:
  template:
    spec:
      initContainers:
      # Run database migrations before app starts
      - name: migrate-db
        image: myregistry/migrations:1.0
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: db-url
      
      # Wait for dependencies to be ready
      - name: wait-for-db
        image: busybox:1.28
        command: ['sh', '-c', 'until nc -z postgres:5432; do echo waiting for db; sleep 2; done']
      
      containers:
      - name: app
        image: myregistry/app:1.0
```

### 12.2 Sidecar Containers (Helper Containers)

```yaml
spec:
  template:
    spec:
      containers:
      # Main application
      - name: app
        image: myregistry/app:1.0
        ports:
        - containerPort: 3000
      
      # Sidecar: log collector
      - name: log-collector
        image: fluent/fluent-bit:latest
        volumeMounts:
        - name: app-logs
          mountPath: /var/log/app
        - name: fluent-bit-config
          mountPath: /fluent-bit/etc
      
      # Sidecar: metrics exporter
      - name: prometheus-exporter
        image: prom/statsd-exporter:latest
        ports:
        - containerPort: 9102
      
      volumes:
      - name: app-logs
        emptyDir: {}
      - name: fluent-bit-config
        configMap:
          name: fluent-bit-config
```

### 12.3 Jobs and CronJobs (One-Time and Scheduled Tasks)

**One-time job (database backup):**

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: backup-db
  namespace: production
spec:
  template:
    spec:
      containers:
      - name: backup
        image: myregistry/backup-tool:1.0
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: db-url
        - name: BACKUP_DESTINATION
          value: "s3://backups/$(date +%Y-%m-%d)"
      
      restartPolicy: Never
  
  backoffLimit: 3  # Retry up to 3 times
```

**Scheduled job (daily backup):**

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-backup
  namespace: production
spec:
  schedule: "0 2 * * *"  # 2 AM daily (cron format)
  
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: myregistry/backup-tool:1.0
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secret
                  key: db-url
          
          restartPolicy: OnFailure
```

---

## PART 13: KUBERNETES IN THE CLOUD

### 13.1 AWS (EKS)

**Setup EKS cluster:**

```bash
# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Create cluster
eksctl create cluster \
  --name my-cluster \
  --region us-east-1 \
  --nodegroup-name standard-nodes \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 10

# Configure kubectl
aws eks update-kubeconfig --name my-cluster --region us-east-1

# Verify
kubectl get nodes
```

**ECR (AWS Container Registry):**

```bash
# Create repository
aws ecr create-repository --repository-name my-app

# Login Docker
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t my-app:1.0 .
docker tag my-app:1.0 123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:1.0
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:1.0

# Use in deployment
image: 123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:1.0
```

**Auto-scaling:**

```bash
# Install metrics server (for HPA)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Install cluster autoscaler
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm install autoscaler autoscaler/cluster-autoscaler \
  --set autoDiscovery.clusterName=my-cluster \
  --set awsRegion=us-east-1
```

**Horizontal Pod Autoscaling (HPA):**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: python-app
  
  minReplicas: 3
  maxReplicas: 100
  
  metrics:
  # Scale based on CPU usage
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  
  # Scale based on memory usage
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  
  # Scale based on custom metrics
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 min before scaling down
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0    # Scale up immediately
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
```

### 13.2 Google Cloud (GKE)

```bash
# Create cluster
gcloud container clusters create my-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-1

# Get credentials
gcloud container clusters get-credentials my-cluster --zone us-central1-a

# Push to Google Container Registry
gcloud auth configure-docker
docker tag my-app:1.0 gcr.io/my-project/my-app:1.0
docker push gcr.io/my-project/my-app:1.0
```

### 13.3 Azure (AKS)

```bash
# Create resource group
az group create --name myResourceGroup --location eastus

# Create AKS cluster
az aks create \
  --resource-group myResourceGroup \
  --name myAKSCluster \
  --node-count 3 \
  --vm-set-type VirtualMachineScaleSets

# Get credentials
az aks get-credentials --resource-group myResourceGroup --name myAKSCluster

# Push to Azure Container Registry
az acr build --registry myacr --image my-app:1.0 .
```

---

## PART 14: TROUBLESHOOTING GUIDE

### 14.1 Common Issues and Solutions

**Pod stuck in Pending:**
```bash
# Check events
kubectl describe pod <pod-name> -n production

# Likely causes:
# 1. Not enough resources
kubectl top nodes  # Check node CPU/memory

# 2. PVC not bound
kubectl get pvc -n production

# 3. Image pull error
kubectl logs <pod-name> -n production
```

**Pod crashing (CrashLoopBackOff):**
```bash
# Check logs
kubectl logs <pod-name> -n production --previous

# Check events
kubectl describe pod <pod-name> -n production

# Likely causes:
# 1. Application error (check logs)
# 2. Resource limits too low
# 3. Dependencies not available
```

**Service unreachable:**
```bash
# Test connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
wget -O- http://service-name:port

# Check endpoints
kubectl get endpoints -n production

# Check network policies
kubectl get networkpolicies -n production
```

**Slow deployment:**
```bash
# Check pod readiness
kubectl get pods -n production -o wide

# Check node resources
kubectl top nodes

# Check image pull
kubectl describe pod <pod-name> | grep -i pull

# Increase resources
kubectl set resources deployment/app --limits=cpu=1000m,memory=1Gi -n production
```

### 14.2 Debugging Commands

```bash
# Get cluster info
kubectl cluster-info
kubectl get nodes -o wide

# Detailed pod info
kubectl describe pod <pod-name> -n production

# Execute command in pod
kubectl exec -it <pod-name> -n production -- /bin/sh

# Port forward for testing
kubectl port-forward <pod-name> 8080:3000 -n production

# Check resource usage
kubectl top pods -n production
kubectl top nodes

# Get all events in namespace
kubectl get events -n production --sort-by='.lastTimestamp'

# Check YAML of running object
kubectl get deployment <name> -n production -o yaml

# Dry-run apply
kubectl apply -f file.yaml --dry-run=client -o yaml

# Check rollout history
kubectl rollout history deployment/<name> -n production
```

---

## PART 15: DEPLOYMENT CHECKLIST

### Pre-Deployment Checklist

- [ ] Application has health checks (/health, /ready endpoints)
- [ ] Dockerfile is optimized (multi-stage builds)
- [ ] Image is pushed to registry
- [ ] ConfigMaps defined for non-sensitive config
- [ ] Secrets created separately (not in YAML)
- [ ] Resource requests and limits set
- [ ] Probes configured (liveness, readiness)
- [ ] Environment variables properly mapped
- [ ] Database migrations tested
- [ ] Graceful shutdown implemented
- [ ] Rollback plan documented

### Post-Deployment Checklist

- [ ] Pods are running and ready
- [ ] Service endpoints working
- [ ] Ingress routes traffic correctly
- [ ] Health checks passing
- [ ] Metrics being collected
- [ ] Logs being collected
- [ ] Database connectivity working
- [ ] Cache connectivity working
- [ ] Load balancer distributing traffic
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place

---

## PART 16: TOOLS AND ECOSYSTEM

### Essential Tools

**kubectl**: Main command-line tool
```bash
kubectl get pods
kubectl apply -f manifests/
kubectl logs deployment/myapp
kubectl describe pod podname
```

**Helm**: Package manager for Kubernetes
```bash
# Install PostgreSQL with one command
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgres bitnami/postgresql

# Create your own chart
helm create mychart
helm install myapp ./mychart
```

**kustomize**: Template-free Kubernetes customization
```bash
# Organize YAMLs by environment
kustomize/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── dev/
│   │   ├── replicas.yaml
│   │   └── kustomization.yaml
│   ├── prod/
│   │   ├── replicas.yaml
│   │   └── kustomization.yaml
```

**ArgoCD**: GitOps - Keep cluster in sync with Git
```yaml
# Push to Git, ArgoCD automatically deploys
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
spec:
  repo: https://github.com/myorg/myrepo
  path: k8s/
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Prometheus + Grafana**: Monitoring
```bash
helm install prometheus prometheus-community/kube-prometheus-stack
```

**ELK (Elasticsearch, Logstash, Kibana)**: Logging
```bash
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch
```

**Istio**: Service mesh (advanced networking)
```bash
# Automatic retry, circuit breaking, traffic shaping
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm install istio-base istio/base
```

---

## PART 17: BEST PRACTICES SUMMARY

### Application Design

1. **12-Factor App Methodology**
   - Configuration via environment variables
   - Dependencies explicitly declared (requirements.txt)
   - Stateless processes
   - Logs to stdout

2. **Health Checks**
   - /health: Is app alive?
   - /ready: Can it serve traffic?
   - Check dependencies, not just process running

3. **Graceful Shutdown**
   - Handle SIGTERM signal
   - Stop accepting new requests
   - Complete existing requests (30s timeout)
   - Clean up resources

### Kubernetes Design

4. **Resource Management**
   - Always set resource requests/limits
   - CPU in millicores (100m = 0.1 CPU)
   - Memory in Mi/Gi
   - Match to actual needs

5. **Replicas and High Availability**
   - Minimum 2 replicas for availability
   - 3+ for production
   - Pod anti-affinity to spread across nodes

6. **Zero-Downtime Deployments**
   - Rolling updates (default)
   - Readiness probes to detect ready pods
   - Graceful termination
   - Test before going to production

### Security

7. **Never Store Secrets in Git**
   - Use external secret managers
   - Seal secrets before committing
   - Rotate regularly

8. **Run as Non-Root**
   - Create user in Dockerfile
   - Set securityContext.runAsNonRoot=true
   - Drop all capabilities

9. **Network Policies**
   - Deny all traffic by default
   - Allow only necessary connections
   - Isolate namespaces

### Operations

10. **Monitoring**
    - Metrics: Prometheus/custom
    - Logs: ELK, Loki, etc.
    - Alerts: PagerDuty, Slack, etc.
    - Dashboards: Grafana

11. **Disaster Recovery**
    - Regular backups (databases, etcd)
    - Test restore process
    - Document runbooks
    - Have on-call procedure

12. **GitOps**
    - Infrastructure as code in Git
    - All changes via pull requests
    - Automated deployment on merge
    - ArgoCD or Flux for sync

---

## QUICK START - Your First Deployment

1. **Write your app (app.py)**
   - Create /health and /ready endpoints
   - Read config from environment
   - Log to stdout

2. **Create Dockerfile**
   - Use official language image
   - Multi-stage for optimization
   - Non-root user

3. **Build and push image**
```bash
docker build -t myregistry/myapp:1.0 .
docker push myregistry/myapp:1.0
```

4. **Create YAML files**
   - namespace.yaml
   - configmap.yaml
   - secret.yaml (created separately)
   - deployment.yaml
   - service.yaml
   - ingress.yaml

5. **Deploy**
```bash
kubectl apply -f k8s/
```

6. **Monitor**
```bash
kubectl get pods
kubectl logs deployment/myapp
kubectl port-forward svc/myapp 8080:80
```

7. **Update**
```bash
# New code in app.py
docker build -t myregistry/myapp:1.1 .
docker push myregistry/myapp:1.1
kubectl set image deployment/myapp app=myregistry/myapp:1.1
kubectl rollout status deployment/myapp
```

---

## Additional Resources

- Official Kubernetes Docs: https://kubernetes.io/docs/
- Kubernetes by Example: https://www.kubernetesbyexample.com/
- Play with Kubernetes: https://www.katacoda.com/courses/kubernetes
- CNCF Landscape: https://landscape.cncf.io/
- Kubernetes Slack Community
- Annual Kubecon conferences
