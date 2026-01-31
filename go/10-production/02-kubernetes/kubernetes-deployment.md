# Kubernetes Deployment

## What is Kubernetes?

**Kubernetes (K8s)** is a container orchestration platform for:
- **Automated Deployment**: Deploy containers at scale
- **Self-Healing**: Restart failed containers automatically
- **Scaling**: Horizontal and vertical autoscaling
- **Load Balancing**: Distribute traffic across pods
- **Service Discovery**: Find services automatically
- **Rolling Updates**: Zero-downtime deployments

## Why Kubernetes for Go?

Go applications are perfect for Kubernetes:
- **Statically Compiled**: Single binary, minimal images
- **Fast Startup**: Quick pod initialization
- **Low Resource Usage**: Efficient memory/CPU utilization
- **Concurrent**: Handle multiple requests efficiently

## Core Concepts

### Pod
Smallest deployable unit containing one or more containers.

```yaml
# pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: go-app
  labels:
    app: go-backend
spec:
  containers:
  - name: go-backend
    image: myapp:v1.0.0
    ports:
    - containerPort: 8080
    env:
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: url
    resources:
      requests:
        memory: "64Mi"
        CPU: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
```

### Deployment
Manages replica sets and rolling updates.

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: go-backend
  labels:
    app: go-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: go-backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: go-backend
        version: v1.0.0
    spec:
      containers:
      - name: go-backend
        image: myregistry/go-backend:v1.0.0
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        - name: metrics
          containerPort: 9090
          protocol: TCP
        env:
        - name: ENV
          value: "production"
        - name: PORT
          value: "8080"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: redis-config
              key: url
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        volumeMounts:
        - name: config
          mountPath: /etc/config
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: app-config
      restartPolicy: Always
```

### Service
Exposes pods as network service.

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: go-backend-service
  labels:
    app: go-backend
spec:
  type: ClusterIP
  selector:
    app: go-backend
  ports:
  - name: http
    port: 80
    targetPort: 8080
    protocol: TCP
  - name: metrics
    port: 9090
    targetPort: 9090
    protocol: TCP
  sessionAffinity: None
```

### Ingress
External access with routing.

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: go-backend-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.example.com
    secretName: api-tls-cert
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: go-backend-service
            port:
              number: 80
```

## ConfigMap and Secrets

### ConfigMap
Non-sensitive configuration.

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  app.env: "production"
  log.level: "info"
  redis.url: "redis://redis-service:6379"
  feature.flags: |
    {
      "new_ui": true,
      "beta_features": false
    }
```

### Secret
Sensitive data (base64 encoded).

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
data:
  url: cG9zdGdyZXM6Ly91c2VyOnBhc3NAZGI6NTQzMi9teWRi # postgres://user:pass@db:5432/mydb
  username: dXNlcg== # user
  password: cGFzcw== # pass
```

Create secret from command:
```bash
kubectl create secret generic postgres-secret \
  --from-literal=url='postgres://user:pass@db:5432/mydb' \
  --from-literal=username='user' \
  --from-literal=password='pass'
```

## Health Checks (Go Implementation)

```go
package health

import (
    "context"
    "database/sql"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/go-redis/redis/v8"
)

type HealthChecker struct {
    DB    *sql.DB
    Redis *redis.Client
}

// Liveness probe - is app running?
func (h *HealthChecker) Liveness(c *gin.Context) {
    c.JSON(200, gin.H{
        "status": "alive",
        "timestamp": time.Now().Unix(),
    })
}

// Readiness probe - can app handle traffic?
func (h *HealthChecker) Readiness(c *gin.Context) {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()
    
    checks := make(map[string]string)
    ready := true
    
    // Check database
    if err := h.DB.PingContext(ctx); err != nil {
        checks["database"] = "unhealthy"
        ready = false
    } else {
        checks["database"] = "healthy"
    }
    
    // Check Redis
    if err := h.Redis.Ping(ctx).Err(); err != nil {
        checks["redis"] = "unhealthy"
        ready = false
    } else {
        checks["redis"] = "healthy"
    }
    
    status := 200
    if !ready {
        status = 503
    }
    
    c.JSON(status, gin.H{
        "status": map[string]bool{"ready": ready},
        "checks": checks,
        "timestamp": time.Now().Unix(),
    })
}

// Setup routes
func SetupHealthChecks(r *gin.Engine, checker *HealthChecker) {
    r.GET("/health/live", checker.Liveness)
    r.GET("/health/ready", checker.Readiness)
}
```

## Horizontal Pod Autoscaler (HPA)

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: go-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: go-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
```

## Persistent Volume

```yaml
# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: go-app-storage
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard
```

Use in deployment:
```yaml
spec:
  template:
    spec:
      containers:
      - name: go-backend
        volumeMounts:
        - name: data
          mountPath: /app/data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: go-app-storage
```

## StatefulSet
For stateful applications (databases, caches).

```yaml
# statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
spec:
  serviceName: redis
  replicas: 3
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
          name: client
        volumeMounts:
        - name: data
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 1Gi
```

## Jobs and CronJobs

### Job (One-time task)
```yaml
# job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: database-migration
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: myregistry/go-backend:v1.0.0
        command: ["./migrate", "up"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: url
      restartPolicy: OnFailure
  backoffLimit: 3
```

### CronJob (Scheduled task)
```yaml
# cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cleanup-job
spec:
  schedule: "0 2 * * *" # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: cleanup
            image: myregistry/go-backend:v1.0.0
            command: ["./cleanup"]
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: url
          restartPolicy: OnFailure
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
```

## Deployment Strategies

### Rolling Update (Default)
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max new pods above desired
      maxUnavailable: 0  # Max pods unavailable during update
```

### Blue-Green Deployment
```yaml
# blue-deployment.yaml (current)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: go-backend-blue
  labels:
    app: go-backend
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: go-backend
      version: blue
  template:
    metadata:
      labels:
        app: go-backend
        version: blue
    spec:
      containers:
      - name: go-backend
        image: myregistry/go-backend:v1.0.0

---
# green-deployment.yaml (new version)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: go-backend-green
  labels:
    app: go-backend
    version: green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: go-backend
      version: green
  template:
    metadata:
      labels:
        app: go-backend
        version: green
    spec:
      containers:
      - name: go-backend
        image: myregistry/go-backend:v2.0.0

---
# service.yaml - switch traffic by changing selector
apiVersion: v1
kind: Service
metadata:
  name: go-backend-service
spec:
  selector:
    app: go-backend
    version: blue  # Change to "green" to switch traffic
  ports:
  - port: 80
    targetPort: 8080
```

### Canary Deployment
```bash
# Deploy canary with 10% traffic
kubectl apply -f deployment-stable.yaml  # 90% traffic (9 replicas)
kubectl apply -f deployment-canary.yaml  # 10% traffic (1 replica)

# Monitor metrics, then increase canary
kubectl scale deployment go-backend-canary --replicas=5  # 50%

# If successful, promote canary
kubectl delete deployment go-backend-stable
kubectl apply -f deployment-stable.yaml  # New version as stable
```

## Kubectl Commands

```bash
# Apply manifests
kubectl apply -f deployment.yaml
kubectl apply -f .  # All files in directory

# Get resources
kubectl get pods
kubectl get deployments
kubectl get services
kubectl get ingress

# Describe resource
kubectl describe pod go-backend-xyz123
kubectl describe deployment go-backend

# Logs
kubectl logs go-backend-xyz123
kubectl logs -f go-backend-xyz123  # Follow
kubectl logs go-backend-xyz123 --previous  # Previous container

# Execute command in pod
kubectl exec -it go-backend-xyz123 -- /bin/sh
kubectl exec go-backend-xyz123 -- env

# Port forward (local testing)
kubectl port-forward pod/go-backend-xyz123 8080:8080
kubectl port-forward service/go-backend-service 8080:80

# Scale deployment
kubectl scale deployment go-backend --replicas=5

# Update image
kubectl set image deployment/go-backend go-backend=myregistry/go-backend:v2.0.0

# Rollout status
kubectl rollout status deployment/go-backend

# Rollback
kubectl rollout undo deployment/go-backend
kubectl rollout undo deployment/go-backend --to-revision=2

# Rollout history
kubectl rollout history deployment/go-backend

# Delete resources
kubectl delete pod go-backend-xyz123
kubectl delete deployment go-backend
kubectl delete -f deployment.yaml
```

## Helm Charts

Package manager for Kubernetes.

### Chart Structure
```
go-backend/
├── Chart.yaml
├── values.yaml
├── values-prod.yaml
├── values-staging.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── configmap.yaml
    ├── secret.yaml
    └── hpa.yaml
```

### Chart.yaml
```yaml
apiVersion: v2
name: go-backend
description: Go Backend API
type: application
version: 1.0.0
appVersion: "1.0.0"
```

### values.yaml
```yaml
replicaCount: 3

image:
  repository: myregistry/go-backend
  tag: "v1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: api-tls
      hosts:
        - api.example.com

resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "500m"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

env:
  - name: ENV
    value: "production"
  - name: PORT
    value: "8080"

secrets:
  databaseUrl: "postgres://user:pass@db:5432/mydb"

configMap:
  logLevel: "info"
  redisUrl: "redis://redis:6379"
```

### templates/deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "go-backend.fullname" . }}
  labels:
    {{- include "go-backend.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "go-backend.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "go-backend.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.service.targetPort }}
          protocol: TCP
        env:
        {{- toYaml .Values.env | nindent 8 }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
```

### Helm Commands
```bash
# Install chart
helm install my-app ./go-backend

# Install with custom values
helm install my-app ./go-backend -f values-prod.yaml

# Upgrade
helm upgrade my-app ./go-backend

# Rollback
helm rollback my-app 1

# List releases
helm list

# Uninstall
helm uninstall my-app

# Dry run (test without applying)
helm install my-app ./go-backend --dry-run --debug
```

## CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yaml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.22'
    
    - name: Run tests
      run: go test -v ./...
    
    - name: Build binary
      run: CGO_ENABLED=0 GOOS=linux go build -o app
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
    
    - name: Set up kubectl
      uses: azure/setup-kubectl@v3
    
    - name: Configure kubeconfig
      run: |
        echo "${{ secrets.KUBECONFIG }}" > kubeconfig
        export KUBECONFIG=kubeconfig
    
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/go-backend \
          go-backend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
        kubectl rollout status deployment/go-backend
```

## Best Practices

1. **Resource Limits**: Always set requests and limits
2. **Health Checks**: Implement liveness and readiness probes
3. **Graceful Shutdown**: Handle SIGTERM signal properly
4. **Horizontal Scaling**: Use HPA for auto-scaling
5. **Monitoring**: Expose Prometheus metrics
6. **Security**: Use secrets, not ConfigMaps for sensitive data
7. **Namespaces**: Isolate environments (dev, staging, prod)
8. **Labels**: Use consistent labeling for organization
9. **Rolling Updates**: Ensure zero-downtime deployments
10. **Resource Quotas**: Prevent resource exhaustion

## Summary

Kubernetes deployment provides:
- **Scalability**: Horizontal pod autoscaling
- **Reliability**: Self-healing, rolling updates
- **Flexibility**: Multiple deployment strategies
- **Automation**: CI/CD integration
- **Observability**: Health checks, metrics

Essential for production Go applications at scale.
