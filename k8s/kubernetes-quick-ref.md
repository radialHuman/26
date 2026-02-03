# Kubernetes Quick Reference & Common Tasks

## Essential kubectl Commands

```bash
# Get resources
kubectl get pods                           # List pods
kubectl get pods -n production             # In specific namespace
kubectl get nodes                          # List worker nodes
kubectl get services                       # List services
kubectl get deployments                    # List deployments
kubectl get all -n production              # Everything in namespace

# Get detailed info
kubectl describe pod <pod-name> -n prod    # Full pod details
kubectl describe node <node-name>          # Node details
kubectl describe service <svc-name>        # Service details

# View logs
kubectl logs deployment/myapp -n prod      # Last 100 lines
kubectl logs deployment/myapp -n prod -f   # Follow logs (tail -f)
kubectl logs deployment/myapp -n prod --since=1h  # Last hour
kubectl logs pod-name -n prod --previous   # Previous pod (if crashed)

# Execute commands
kubectl exec -it pod-name -n prod -- /bin/sh    # Interactive shell
kubectl exec pod-name -n prod -- python -c "print('hello')"

# Port forwarding
kubectl port-forward svc/myapp 8080:80 -n prod   # Forward to local

# Apply and manage
kubectl apply -f deployment.yaml           # Deploy
kubectl apply -f k8s/                      # Deploy all YAMLs in folder
kubectl delete -f deployment.yaml          # Delete
kubectl delete pod pod-name -n production  # Delete specific pod

# Monitoring
kubectl top nodes                          # Node resource usage
kubectl top pods -n production             # Pod resource usage
kubectl get events -n production --sort-by='.lastTimestamp'

# Rollouts
kubectl rollout status deployment/myapp -n prod
kubectl rollout history deployment/myapp -n prod
kubectl rollout undo deployment/myapp -n prod      # Rollback
kubectl rollout undo deployment/myapp -n prod --to-revision=2
kubectl rollout pause deployment/myapp -n prod
kubectl rollout resume deployment/myapp -n prod

# Image updates
kubectl set image deployment/myapp app=myregistry/myapp:1.1 -n prod

# Scaling
kubectl scale deployment/myapp --replicas=5 -n prod

# Labels and selectors
kubectl get pods -l app=myapp -n prod      # Filter by label
kubectl label pods pod-name env=prod       # Add label
kubectl label pods pod-name env=prod --overwrite  # Update label

# Dry-run and validation
kubectl apply -f file.yaml --dry-run=client       # Test before applying
kubectl apply -f file.yaml --dry-run=client -o yaml  # See result

# Get YAML
kubectl get deployment myapp -n prod -o yaml      # Export as YAML
kubectl get pod pod-name -n prod -o yaml --export

# Context management
kubectl config get-contexts                # List available contexts
kubectl config use-context context-name    # Switch context
kubectl cluster-info                       # Cluster info
```

---

## Common Problem-Solving Patterns

### Pod Won't Start

```bash
# 1. Check status
kubectl describe pod <pod-name> -n production

# 2. Common statuses and solutions
# Pending: Waiting for resources
#   → Check: kubectl top nodes
#   → Fix: Add nodes or reduce resource requests

# ImagePullBackOff: Can't pull image
#   → Check: kubectl logs <pod-name> --previous
#   → Fix: Check image name, registry access, credentials

# CrashLoopBackOff: Application keeps crashing
#   → Check: kubectl logs <pod-name> --previous
#   → Fix: Check app logs, fix error, redeploy

# Check logs for actual error
kubectl logs <pod-name> -n production --previous
```

### Service Not Accessible

```bash
# 1. Check service exists
kubectl get svc -n production

# 2. Check endpoints
kubectl get endpoints <service-name> -n production
# Should show pod IPs if pods are running and ready

# 3. Test from pod
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
wget -O- http://service-name:port

# 4. Check port mapping
kubectl get svc <service-name> -n production -o yaml
# Port (external) should match targetPort (pod port)

# 5. Check network policies
kubectl get networkpolicies -n production
# May be blocking traffic
```

### Deployment Stuck During Update

```bash
# 1. Check status
kubectl rollout status deployment/<name> -n production

# 2. See what's happening
kubectl describe deployment/<name> -n production

# 3. If stuck, check readiness probe
kubectl describe pod <pod-name> -n production
# If readiness failing, probe config wrong or app not ready

# 4. Troubleshoot probe manually
kubectl exec -it <pod-name> -- curl http://localhost:3000/ready

# 5. Fix and try again
# Edit readiness probe timing, or fix application issue
kubectl apply -f deployment.yaml --record
```

### Out of Resources

```bash
# 1. Check node resources
kubectl top nodes

# 2. Check what's using resources
kubectl top pods -n production | sort -k2 -rn  # By CPU
kubectl top pods -n production | sort -k3 -rn  # By memory

# 3. Scale down non-essential services
kubectl scale deployment/<name> --replicas=1 -n namespace

# 4. Increase resource requests in deployment for actual needs
# Edit: spec.containers.resources.requests

# 5. Add new nodes (cloud provider specific)
# EKS: eksctl scale nodegroup --cluster=name --name=nodegroup --nodes=5
# GKE: gcloud container node-pools update pool-name --num-nodes=5
# AKS: az aks scale --resource-group group --name cluster --node-count 5
```

### Data Loss from Pod Crash

```bash
# 1. Prevent it: Use PersistentVolumeClaim for data
# 2. If happened and pod was running:
kubectl logs <pod-name> -n production --previous
# 3. Check if backup exists (if configured)
# 4. Restore from backup

# Prevention:
# Always mount PVC for data that needs to persist
volumeMounts:
- name: data
  mountPath: /data
volumes:
- name: data
  persistentVolumeClaim:
    claimName: myapp-data
```

---

## Deployment Templates

### Basic Python/Go Web App

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  
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
        image: myregistry/myapp:1.0
        ports:
        - containerPort: 3000
        
        env:
        - name: LOG_LEVEL
          value: "INFO"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: db-url
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: myapp
  namespace: production
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: myapp

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.example.com
    secretName: myapp-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp
            port:
              number: 80
```

### With Database and Cache

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production

---
# PostgreSQL
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: production
spec:
  serviceName: postgres
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
          value: myapp
        - name: POSTGRES_USER
          value: appuser
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  
  volumeClaimTemplates:
  - metadata:
      name: data
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
  namespace: production
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
  - port: 5432

---
# Redis Cache
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: production
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
        
        command:
        - redis-server
        - "--requirepass"
        - "redis-pass"
        - "--appendonly"
        - "yes"
        
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        
        volumeMounts:
        - name: data
          mountPath: /data
      
      volumes:
      - name: data
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: production
spec:
  type: ClusterIP
  ports:
  - port: 6379
  selector:
    app: redis

---
# App uses: postgresql://appuser@postgres:5432/myapp
# App uses: redis://redis:6379
```

### With ConfigMap and Secrets

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  LOG_LEVEL: "INFO"
  LOG_FORMAT: "json"
  CACHE_TTL: "3600"
  SESSION_TIMEOUT: "1800"

---
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: production
type: Opaque
stringData:
  db-url: "postgresql://user:pass@postgres:5432/myapp"
  api-key: "secret-key-here"
  jwt-secret: "jwt-secret-here"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
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
        image: myregistry/myapp:1.0
        
        # Load all ConfigMap values as env vars
        envFrom:
        - configMapRef:
            name: app-config
        
        # Additional specific env vars
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: db-url
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: api-key
        
        # Or mount as files
        volumeMounts:
        - name: config
          mountPath: /etc/config
          readOnly: true
      
      volumes:
      - name: config
        configMap:
          name: app-config
```

### Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  
  minReplicas: 3
  maxReplicas: 20
  
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
        periodSeconds: 30
```

### Job and CronJob

```yaml
# One-time job
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  namespace: production
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: myregistry/migrations:1.0
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: db-url
      restartPolicy: Never
  backoffLimit: 3

---
# Scheduled job
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-backup
  namespace: production
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: myregistry/backup:1.0
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secret
                  key: db-url
            - name: BACKUP_PATH
              value: "s3://backups/"
          restartPolicy: OnFailure
```

---

## Creating and Managing Secrets

```bash
# Create generic secret
kubectl create secret generic app-secret \
  --from-literal=api-key=myapikey \
  --from-literal=db-password=mydbpass \
  -n production

# Create from file
kubectl create secret generic app-secret \
  --from-file=config.json \
  --from-file=certs/ \
  -n production

# View secret (base64 encoded)
kubectl get secret app-secret -n production -o yaml

# Decode secret value
kubectl get secret app-secret -o jsonpath='{.data.api-key}' | base64 -d

# Delete secret
kubectl delete secret app-secret -n production
```

---

## Building and Pushing Docker Images

```bash
# Build image
docker build -t myregistry/myapp:1.0 .
docker build -t myregistry/myapp:1.0 -f Dockerfile.prod .

# Login to registry
docker login myregistry.azurecr.io  # Azure
aws ecr get-login-password | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com  # AWS
gcloud auth configure-docker  # Google

# Push image
docker push myregistry/myapp:1.0

# Tag image with multiple tags
docker tag myapp:1.0 myregistry/myapp:1.0
docker tag myapp:1.0 myregistry/myapp:latest
docker push myregistry/myapp:1.0
docker push myregistry/myapp:latest

# View images
docker images
```

---

## Useful One-Liners

```bash
# Get all pods with their node assignments
kubectl get pods -o wide

# Watch pods in real-time
kubectl get pods -w

# Delete all failed pods
kubectl delete pods --field-selector status.phase=Failed

# Get CPU/Memory in more readable format
kubectl top pods --no-headers | sort --reverse --key 2 --numeric

# Port forward to multiple services
for svc in postgres redis; do
  kubectl port-forward svc/$svc 5432:5432 &
done

# Get all events sorted by time
kubectl get events --all-namespaces --sort-by='.lastTimestamp'

# Check pod resource usage vs limits
kubectl get pods -o custom-columns=NAME:.metadata.name,CPU_REQUEST:.spec.containers[].resources.requests.cpu,CPU_LIMIT:.spec.containers[].resources.limits.cpu

# Get imagePullSecrets for debugging registry issues
kubectl get serviceaccount default -o yaml

# Execute script from local file in pod
kubectl exec -i <pod-name> -- bash < script.sh
```

---

## Helm Quick Start

```bash
# Add repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Search chart
helm search repo postgres

# Install chart
helm install my-postgres bitnami/postgresql --namespace production

# Install with values
helm install my-postgres bitnami/postgresql \
  --set auth.postgresPassword=secretpwd \
  --set primary.persistence.size=100Gi \
  --namespace production

# List releases
helm list -n production

# Upgrade release
helm upgrade my-postgres bitnami/postgresql --set replica.replicaCount=3

# Rollback release
helm rollback my-postgres 1

# Uninstall
helm uninstall my-postgres -n production
```

---

## Kustomize Quick Start

```
kustomize/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   ├── replicas.yaml
│   │   └── env-patch.yaml
│   └── prod/
│       ├── kustomization.yaml
│       ├── replicas.yaml
│       └── env-patch.yaml

# kustomize/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml

# kustomize/overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
- ../../base
patchesStrategicMerge:
- replicas.yaml
- env-patch.yaml

# Deploy
kubectl apply -k kustomize/overlays/prod/
```

---

## Git Workflow for Kubernetes

```bash
# Typical workflow
git clone myrepo
cd myrepo

# Create feature branch
git checkout -b feature/new-service

# Edit k8s files
edit k8s/deployment.yaml

# Test locally
kubectl apply -f k8s/ --dry-run=client

# Commit
git add k8s/
git commit -m "feat: add new service"

# Push
git push origin feature/new-service

# Create PR, get approval

# Merge to main
git merge feature/new-service
git push origin main

# ArgoCD/Flux automatically deploys
# (if configured)

# Verify deployment
kubectl get pods -n production
kubectl logs deployment/newservice -n production
```
