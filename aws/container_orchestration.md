# Container Orchestration: ECS, EKS, Fargate & ECR

## Table of Contents
1. [Container Fundamentals](#container-fundamentals)
2. [Amazon ECS (Elastic Container Service)](#amazon-ecs-elastic-container-service)
3. [Amazon EKS (Elastic Kubernetes Service)](#amazon-eks-elastic-kubernetes-service)
4. [AWS Fargate](#aws-fargate)
5. [Amazon ECR (Elastic Container Registry)](#amazon-ecr-elastic-container-registry)
6. [Service Discovery & Mesh](#service-discovery--mesh)
7. [Container Security](#container-security)
8. [LocalStack & Docker Examples](#localstack--docker-examples)
9. [Production Patterns](#production-patterns)
10. [Interview Questions](#interview-questions)

---

## Container Fundamentals

### What are Containers?

**Definition**: Lightweight, standalone packages containing everything needed to run an application (code, runtime, libraries, dependencies).

**Containers vs Virtual Machines**:
```
Virtual Machine:
┌─────────────────────────────┐
│  App A   │   App B   │ App C│ ← Applications
├──────────┼───────────┼──────┤
│ Guest OS │ Guest OS  │Guest │ ← Full OS (GB each)
├──────────┴───────────┴──────┤
│      Hypervisor              │
├──────────────────────────────┤
│      Host Operating System   │
├──────────────────────────────┤
│      Physical Hardware       │
└──────────────────────────────┘
Size: ~1-5 GB per VM
Boot time: 1-2 minutes

Container:
┌─────────────────────────────┐
│  App A   │   App B   │ App C│ ← Applications
├──────────┼───────────┼──────┤
│  Bins/   │  Bins/    │Bins/ │ ← Libraries only (MB)
│  Libs    │  Libs     │Libs  │
├──────────┴───────────┴──────┤
│    Container Runtime (Docker)│
├──────────────────────────────┤
│      Host Operating System   │
├──────────────────────────────┤
│      Physical Hardware       │
└──────────────────────────────┘
Size: ~50-500 MB per container
Boot time: 1-5 seconds
```

**Benefits**:
- **Portability**: Run anywhere (laptop, on-prem, cloud)
- **Consistency**: Same environment dev → prod
- **Efficiency**: Share OS kernel, less overhead
- **Fast Startup**: Seconds vs minutes
- **Isolation**: Process-level isolation
- **Scalability**: Easy horizontal scaling

### Docker Basics

**Dockerfile Example**:
```dockerfile
# Multi-stage build for efficiency
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image (smaller)
FROM node:18-alpine

WORKDIR /app

# Copy only production dependencies and built app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "dist/index.js"]
```

**Docker Commands**:
```bash
# Build image
docker build -t myapp:v1.0 .

# Run container
docker run -d -p 3000:3000 --name myapp myapp:v1.0

# View running containers
docker ps

# View logs
docker logs myapp

# Execute command in container
docker exec -it myapp sh

# Stop container
docker stop myapp

# Remove container
docker rm myapp

# Tag image
docker tag myapp:v1.0 123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:v1.0

# Push to registry
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:v1.0
```

**Docker Compose Example**:
```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=myapp
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    networks:
      - app-network

volumes:
  db-data:

networks:
  app-network:
    driver: bridge
```

---

## Amazon ECS (Elastic Container Service)

### ECS Architecture

```
ECS Cluster
├─ EC2 Launch Type                  ├─ Fargate Launch Type
│  ├─ EC2 Instance 1 (t3.medium)    │  ├─ Fargate Task 1 (0.5 vCPU, 1 GB)
│  │  ├─ ECS Agent                  │  ├─ Fargate Task 2 (1 vCPU, 2 GB)
│  │  ├─ Task 1 (2 containers)      │  └─ Fargate Task 3 (2 vCPU, 4 GB)
│  │  └─ Task 2 (1 container)       │
│  └─ EC2 Instance 2 (t3.medium)    └─ Managed by AWS
│     ├─ ECS Agent                     (No EC2 management)
│     └─ Task 3 (3 containers)

Service 1: Maintains 3 tasks (always running)
Service 2: Maintains 5 tasks
Service 3: Scales 1-10 tasks based on CPU
```

**Key Concepts**:
- **Cluster**: Logical grouping of tasks/services
- **Task Definition**: Blueprint (like Dockerfile) defining containers
- **Task**: Running instance of task definition
- **Service**: Maintains desired count of tasks, load balancing
- **Container**: Docker container running in task

### History & Evolution

```
2015: ECS Launch
      - EC2 launch type only
      - Docker support
      - ECS Agent on EC2 instances

2017: Fargate Launch (re:Invent)
      - Serverless containers
      - No EC2 management

2018: ECS CLI
      - Docker Compose compatibility

2019: ECS Capacity Providers
      - Mix EC2 + Fargate
      - Auto Scaling integration

2020: ECS Exec
      - SSH into containers (like kubectl exec)

2021: ECS Anywhere
      - Run on-premises

2022: Service Connect
      - Built-in service discovery
      - No ALB needed for internal comms

2023: Enhanced container insights
      - Better observability
```

### Task Definitions

**Complete Task Definition** (EC2 Launch Type):
```json
{
  "family": "web-app",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["EC2"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "nginx",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/nginx:latest",
      "cpu": 512,
      "memory": 1024,
      "memoryReservation": 512,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "hostPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-password-abc123"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/web-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "nginx"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "dependsOn": [
        {
          "containerName": "app",
          "condition": "START"
        }
      ]
    },
    {
      "name": "app",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/app:v1.0",
      "cpu": 512,
      "memory": 1024,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PORT",
          "value": "3000"
        },
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:database-url-xyz789"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/web-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "app"
        }
      },
      "ulimits": [
        {
          "name": "nofile",
          "softLimit": 65536,
          "hardLimit": 65536
        }
      ]
    }
  ],
  "volumes": [
    {
      "name": "shared-data",
      "dockerVolumeConfiguration": {
        "scope": "shared",
        "autoprovision": true,
        "driver": "local"
      }
    }
  ],
  "placementConstraints": [
    {
      "type": "memberOf",
      "expression": "attribute:ecs.availability-zone in [us-east-1a, us-east-1b]"
    }
  ],
  "tags": [
    {
      "key": "Environment",
      "value": "production"
    }
  ]
}
```

**Fargate Task Definition**:
```json
{
  "family": "web-app-fargate",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "runtimePlatform": {
    "cpuArchitecture": "ARM64",
    "operatingSystemFamily": "LINUX"
  },
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/app:v1.0",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/web-app-fargate",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "app"
        }
      }
    }
  ]
}
```

**CPU & Memory Configurations** (Fargate):
```
Valid CPU/Memory combinations:
CPU (vCPU) │ Memory (GB)
───────────┼──────────────────────────────
0.25       │ 0.5, 1, 2
0.5        │ 1, 2, 3, 4
1          │ 2, 3, 4, 5, 6, 7, 8
2          │ 4-16 (1 GB increments)
4          │ 8-30 (1 GB increments)
8          │ 16-60 (4 GB increments)
16         │ 32-120 (8 GB increments)

Pricing (us-east-1):
- CPU: $0.04048 per vCPU per hour
- Memory: $0.004445 per GB per hour

Example: 1 vCPU, 2 GB
= (1 × $0.04048) + (2 × $0.004445)
= $0.04048 + $0.00889
= $0.04937/hour = $35.55/month
```

### ECS Services

**Service with ALB**:
```json
{
  "serviceName": "web-service",
  "cluster": "production-cluster",
  "taskDefinition": "web-app:5",
  "desiredCount": 3,
  "launchType": "FARGATE",
  "platformVersion": "LATEST",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": [
        "subnet-abc123",
        "subnet-def456"
      ],
      "securityGroups": ["sg-123456"],
      "assignPublicIp": "DISABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/web-tg/abc123",
      "containerName": "nginx",
      "containerPort": 80
    }
  ],
  "deploymentConfiguration": {
    "maximumPercent": 200,
    "minimumHealthyPercent": 100,
    "deploymentCircuitBreaker": {
      "enable": true,
      "rollback": true
    }
  },
  "deploymentController": {
    "type": "ECS"
  },
  "healthCheckGracePeriodSeconds": 60,
  "enableECSManagedTags": true,
  "propagateTags": "SERVICE",
  "enableExecuteCommand": true
}
```

**Deployment Strategies**:
```
Rolling Update (default):
Desired: 3 tasks
maximumPercent: 200 (max 6 tasks)
minimumHealthyPercent: 100 (min 3 tasks)

Process:
1. Start 3 new tasks (v2.0) → Total: 6 tasks
2. Wait for new tasks healthy
3. Stop 3 old tasks (v1.0) → Total: 3 tasks
4. Deployment complete

Downtime: None
Duration: ~5 minutes

Blue-Green Deployment (via CodeDeploy):
1. Deploy new (green) task set
2. Route 10% traffic to green
3. Monitor for 5 minutes
4. Route 50% traffic
5. Monitor for 5 minutes
6. Route 100% traffic
7. Terminate blue task set

Downtime: None
Duration: ~15 minutes
Rollback: Instant (shift traffic back)
```

### Auto Scaling

**Target Tracking**:
```json
{
  "TargetTrackingScalingPolicyConfiguration": {
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }
}

// When CPU > 70%: Scale out (add tasks)
// When CPU < 70%: Scale in (remove tasks)
```

**Step Scaling**:
```json
{
  "StepScalingPolicyConfiguration": {
    "AdjustmentType": "PercentChangeInCapacity",
    "StepAdjustments": [
      {
        "MetricIntervalLowerBound": 0,
        "MetricIntervalUpperBound": 10,
        "ScalingAdjustment": 10
      },
      {
        "MetricIntervalLowerBound": 10,
        "MetricIntervalUpperBound": 20,
        "ScalingAdjustment": 20
      },
      {
        "MetricIntervalLowerBound": 20,
        "ScalingAdjustment": 30
      }
    ],
    "Cooldown": 60
  }
}

// CPU 70-80%: +10% capacity
// CPU 80-90%: +20% capacity
// CPU >90%:   +30% capacity
```

**Scheduled Scaling**:
```json
{
  "ScheduledActions": [
    {
      "ScheduledActionName": "scale-up-morning",
      "Schedule": "cron(0 9 * * MON-FRI *)",
      "ScalableTargetAction": {
        "MinCapacity": 5,
        "MaxCapacity": 20
      }
    },
    {
      "ScheduledActionName": "scale-down-evening",
      "Schedule": "cron(0 19 * * MON-FRI *)",
      "ScalableTargetAction": {
        "MinCapacity": 2,
        "MaxCapacity": 10
      }
    }
  ]
}
```

### AWS CLI Examples

```bash
# Create cluster
aws ecs create-cluster --cluster-name production-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster production-cluster \
  --service-name web-service \
  --task-definition web-app:5 \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-abc123,subnet-def456],securityGroups=[sg-123456],assignPublicIp=DISABLED}"

# Update service (deploy new version)
aws ecs update-service \
  --cluster production-cluster \
  --service web-service \
  --task-definition web-app:6 \
  --force-new-deployment

# List tasks
aws ecs list-tasks --cluster production-cluster --service-name web-service

# Describe task
aws ecs describe-tasks \
  --cluster production-cluster \
  --tasks arn:aws:ecs:us-east-1:123456789012:task/production-cluster/abc123

# Execute command in container (ECS Exec)
aws ecs execute-command \
  --cluster production-cluster \
  --task abc123 \
  --container app \
  --interactive \
  --command "/bin/sh"

# Scale service
aws ecs update-service \
  --cluster production-cluster \
  --service web-service \
  --desired-count 10

# Delete service
aws ecs delete-service \
  --cluster production-cluster \
  --service web-service \
  --force
```

---

## Amazon EKS (Elastic Kubernetes Service)

### Kubernetes Fundamentals

**Architecture**:
```
EKS Control Plane (AWS Managed)
├─ API Server (kubectl commands)
├─ etcd (cluster state)
├─ Scheduler (assigns pods to nodes)
└─ Controller Manager (maintains desired state)

Worker Nodes (EC2 or Fargate)
├─ Node 1 (t3.medium)
│  ├─ kubelet (node agent)
│  ├─ kube-proxy (networking)
│  ├─ Pod 1 (nginx + app containers)
│  └─ Pod 2 (redis container)
├─ Node 2 (t3.medium)
│  ├─ kubelet
│  ├─ kube-proxy
│  └─ Pod 3 (postgres container)
```

**Key Kubernetes Concepts**:
- **Pod**: Smallest deployable unit (1+ containers)
- **Deployment**: Manages replica sets (desired state)
- **Service**: Stable endpoint for pods (load balancing)
- **Namespace**: Virtual cluster (isolation)
- **ConfigMap**: Configuration data
- **Secret**: Sensitive data (passwords, tokens)
- **Ingress**: HTTP routing to services
- **PersistentVolume**: Storage
- **StatefulSet**: Stateful applications (databases)

### EKS Cluster Setup

**Create Cluster** (AWS CLI):
```bash
# Create cluster (AWS managed control plane)
aws eks create-cluster \
  --name production-cluster \
  --role-arn arn:aws:iam::123456789012:role/eks-cluster-role \
  --resources-vpc-config \
    subnetIds=subnet-abc123,subnet-def456,securityGroupIds=sg-123456 \
  --kubernetes-version 1.28

# Wait for cluster to be active (10-15 minutes)
aws eks wait cluster-active --name production-cluster

# Update kubeconfig
aws eks update-kubeconfig --name production-cluster --region us-east-1

# Verify connection
kubectl get svc
```

**Node Group** (EC2 worker nodes):
```bash
# Create node group
aws eks create-nodegroup \
  --cluster-name production-cluster \
  --nodegroup-name standard-nodes \
  --node-role arn:aws:iam::123456789012:role/eks-node-role \
  --subnets subnet-abc123 subnet-def456 \
  --instance-types t3.medium \
  --scaling-config minSize=2,maxSize=10,desiredSize=3 \
  --disk-size 20

# Wait for node group (5-10 minutes)
aws eks wait nodegroup-active \
  --cluster-name production-cluster \
  --nodegroup-name standard-nodes

# Verify nodes
kubectl get nodes
```

### Kubernetes Manifests

**Deployment**:
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
  labels:
    app: web
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
        version: v1
    spec:
      containers:
      - name: nginx
        image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/nginx:latest
        ports:
        - containerPort: 80
          name: http
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 500m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: ENVIRONMENT
          value: production
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        volumeMounts:
        - name: config
          mountPath: /etc/nginx/nginx.conf
          subPath: nginx.conf
      volumes:
      - name: config
        configMap:
          name: nginx-config
```

**Service** (Load Balancer):
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: web-service
  namespace: production
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
    name: http
  sessionAffinity: None
```

**Ingress** (ALB):
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/healthcheck-path: /health
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/abc123
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
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
              number: 80
```

**ConfigMap**:
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  app.properties: |
    environment=production
    log_level=info
    max_connections=1000
  nginx.conf: |
    server {
      listen 80;
      location / {
        proxy_pass http://localhost:3000;
      }
    }
```

**Secret**:
```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: production
type: Opaque
data:
  username: YWRtaW4=  # base64 encoded "admin"
  password: cGFzc3dvcmQxMjM=  # base64 encoded "password123"
```

### Horizontal Pod Autoscaler (HPA)

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
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
        value: 10
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
      selectPolicy: Max
```

### IRSA (IAM Roles for Service Accounts)

**Problem**: Pods need AWS permissions (S3, DynamoDB, etc.)

**Old Solution**: Put AWS credentials in pods (insecure)

**New Solution (IRSA)**: Associate IAM role with Kubernetes service account

**Setup**:
```bash
# 1. Create IAM OIDC provider
eksctl utils associate-iam-oidc-provider \
  --cluster production-cluster \
  --approve

# 2. Create IAM role with trust policy
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE:sub": "system:serviceaccount:production:web-sa"
        }
      }
    }
  ]
}
EOF

aws iam create-role \
  --role-name web-app-role \
  --assume-role-policy-document file://trust-policy.json

# 3. Attach policy
aws iam attach-role-policy \
  --role-name web-app-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# 4. Create Kubernetes service account
kubectl create serviceaccount web-sa -n production

kubectl annotate serviceaccount web-sa -n production \
  eks.amazonaws.com/role-arn=arn:aws:iam::123456789012:role/web-app-role

# 5. Use in pod
apiVersion: v1
kind: Pod
metadata:
  name: web-pod
  namespace: production
spec:
  serviceAccountName: web-sa
  containers:
  - name: app
    image: myapp:latest
    # Now has S3 read permissions via IAM role
```

### kubectl Commands

```bash
# Get resources
kubectl get pods
kubectl get deployments
kubectl get services
kubectl get nodes

# Describe resource (detailed info)
kubectl describe pod web-app-abc123
kubectl describe deployment web-app

# Logs
kubectl logs web-app-abc123
kubectl logs -f web-app-abc123  # Follow
kubectl logs web-app-abc123 -c nginx  # Specific container

# Execute command in pod
kubectl exec -it web-app-abc123 -- /bin/sh
kubectl exec web-app-abc123 -- ls /app

# Port forward (local testing)
kubectl port-forward pod/web-app-abc123 8080:80

# Apply manifest
kubectl apply -f deployment.yaml
kubectl apply -f .  # All files in directory

# Delete resource
kubectl delete pod web-app-abc123
kubectl delete deployment web-app
kubectl delete -f deployment.yaml

# Scale deployment
kubectl scale deployment web-app --replicas=5

# Rollout
kubectl rollout status deployment/web-app
kubectl rollout history deployment/web-app
kubectl rollout undo deployment/web-app

# Debug
kubectl get events
kubectl top nodes
kubectl top pods
```

---

## AWS Fargate

### What is Fargate?

**Definition**: Serverless compute engine for containers (no EC2 instance management).

**Fargate vs EC2 Launch Type**:
```
EC2 Launch Type:
You manage:
❌ EC2 instances (provisioning, patching, scaling)
❌ ECS agent
❌ Instance type selection
❌ Cluster capacity
✅ Container configuration

Fargate:
AWS manages:
✅ Infrastructure (no EC2 visible)
✅ Scaling (per-task)
✅ Patching
✅ Security
You manage:
✅ Task definition
✅ Container configuration
```

**Pricing Comparison**:
```
EC2 Launch Type (t3.medium: 2 vCPU, 4 GB):
Cost: $0.0416/hour = $30/month per instance
Tasks per instance: ~4 (1 vCPU, 1 GB each)
Cost per task: $7.50/month

Fargate (1 vCPU, 2 GB):
Cost: $35.55/month per task

When to use EC2:
- High utilization (>80% capacity)
- Many small tasks (efficient packing)
- Cost-sensitive workloads

When to use Fargate:
- Variable workloads (low utilization)
- Simplicity over cost
- Don't want to manage EC2
- Quick prototyping
```

### Fargate Task Definition

```json
{
  "family": "web-app-fargate",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "runtimePlatform": {
    "cpuArchitecture": "ARM64",
    "operatingSystemFamily": "LINUX"
  },
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsExecutionRole",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/web-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "fargate"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### EKS on Fargate

**Fargate Profile**:
```bash
# Create Fargate profile
aws eks create-fargate-profile \
  --cluster-name production-cluster \
  --fargate-profile-name production-profile \
  --pod-execution-role-arn arn:aws:iam::123456789012:role/eks-fargate-role \
  --subnets subnet-abc123 subnet-def456 \
  --selectors namespace=production
  
# Now pods in "production" namespace run on Fargate
kubectl create namespace production

kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: app
        image: nginx:latest
        ports:
        - containerPort: 80
EOF

# Pods run on Fargate (no EC2 nodes needed)
kubectl get pods -n production -o wide
```

---

## Amazon ECR (Elastic Container Registry)

### What is ECR?

**Definition**: Fully managed Docker container registry (like Docker Hub, but AWS-native).

**Features**:
- **Private repositories** (default)
- **Image scanning** (vulnerability detection)
- **Lifecycle policies** (auto-delete old images)
- **Replication** (cross-region, cross-account)
- **IAM integration** (fine-grained access)
- **Encryption** (at-rest and in-transit)

### ECR Setup

**Create Repository**:
```bash
# Create repository
aws ecr create-repository \
  --repository-name myapp \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Output:
{
  "repository": {
    "repositoryUri": "123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp",
    "registryId": "123456789012",
    "repositoryName": "myapp"
  }
}
```

**Push Image**:
```bash
# 1. Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# 2. Build image
docker build -t myapp:v1.0 .

# 3. Tag image
docker tag myapp:v1.0 \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:v1.0

# 4. Push image
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:v1.0

# 5. Pull image (from ECS/EKS)
docker pull 123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:v1.0
```

### Image Scanning

**Scan on Push**:
```bash
# Enable scan on push
aws ecr put-image-scanning-configuration \
  --repository-name myapp \
  --image-scanning-configuration scanOnPush=true

# Manual scan
aws ecr start-image-scan \
  --repository-name myapp \
  --image-id imageTag=v1.0

# Get scan results
aws ecr describe-image-scan-findings \
  --repository-name myapp \
  --image-id imageTag=v1.0

# Output:
{
  "imageScanFindings": {
    "findings": [
      {
        "name": "CVE-2023-1234",
        "severity": "HIGH",
        "description": "Buffer overflow in libssl",
        "uri": "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-1234"
      }
    ],
    "findingSeverityCounts": {
      "CRITICAL": 0,
      "HIGH": 1,
      "MEDIUM": 5,
      "LOW": 10
    }
  }
}
```

### Lifecycle Policies

```json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 10 production images",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["prod-"],
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    },
    {
      "rulePriority": 2,
      "description": "Delete untagged images older than 7 days",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 7
      },
      "action": {
        "type": "expire"
      }
    },
    {
      "rulePriority": 3,
      "description": "Keep only last 3 dev images",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["dev-"],
        "countType": "imageCountMoreThan",
        "countNumber": 3
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
```

**Apply Lifecycle Policy**:
```bash
aws ecr put-lifecycle-policy \
  --repository-name myapp \
  --lifecycle-policy-text file://lifecycle-policy.json
```

### Cross-Region Replication

```json
{
  "rules": [
    {
      "destinations": [
        {
          "region": "us-west-2",
          "registryId": "123456789012"
        },
        {
          "region": "eu-west-1",
          "registryId": "123456789012"
        }
      ],
      "repositoryFilters": [
        {
          "filter": "myapp",
          "filterType": "PREFIX_MATCH"
        }
      ]
    }
  ]
}
```

---

## Service Discovery & Mesh

### ECS Service Discovery

**AWS Cloud Map Integration**:
```bash
# Create private DNS namespace
aws servicediscovery create-private-dns-namespace \
  --name local \
  --vpc vpc-abc123 \
  --description "Service discovery namespace"

# Create service
aws servicediscovery create-service \
  --name web-service \
  --dns-config 'NamespaceId="ns-abc123",DnsRecords=[{Type="A",TTL=60}]' \
  --health-check-custom-config FailureThreshold=1

# ECS Service with Service Discovery
aws ecs create-service \
  --cluster production-cluster \
  --service-name web-service \
  --task-definition web-app:1 \
  --desired-count 3 \
  --service-registries registryArn=arn:aws:servicediscovery:us-east-1:123456789012:service/srv-abc123

# Now tasks are accessible via DNS:
# web-service.local (resolves to task IPs)
```

**Service Connect** (newer, simpler):
```json
{
  "serviceConnectConfiguration": {
    "enabled": true,
    "namespace": "local",
    "services": [
      {
        "portName": "http",
        "discoveryName": "web-service",
        "clientAliases": [
          {
            "port": 80,
            "dnsName": "web.local"
          }
        ]
      }
    ]
  }
}
```

### App Mesh

**Service Mesh** for microservices communication:
```
App Mesh:
├─ Virtual Nodes (services)
│  ├─ web-service
│  ├─ api-service
│  └─ db-service
├─ Virtual Services (DNS names)
│  ├─ web.local → web-service
│  └─ api.local → api-service
├─ Virtual Routers (traffic routing)
│  └─ api-router → 90% v1, 10% v2
└─ Routes (path-based routing)
   └─ /api/v1 → api-service-v1
   └─ /api/v2 → api-service-v2

Benefits:
✅ Traffic shaping (canary deployments)
✅ Circuit breaking
✅ Retries and timeouts
✅ Observability (distributed tracing)
```

---

## Container Security

### Image Security

**1. Minimal Base Images**:
```dockerfile
# ❌ BAD: Full OS (1 GB, many vulnerabilities)
FROM ubuntu:22.04

# ✅ GOOD: Alpine (5 MB, minimal attack surface)
FROM alpine:3.18

# ✅ BETTER: Distroless (only app + dependencies)
FROM gcr.io/distroless/nodejs:18

# ✅ BEST: Scratch (empty, for static binaries)
FROM scratch
COPY myapp /
CMD ["/myapp"]
```

**2. Multi-Stage Builds**:
```dockerfile
# Build stage (large, has build tools)
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage (small, no build tools)
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist/index.js"]

# Result: 1.2 GB → 150 MB
```

**3. Non-Root User**:
```dockerfile
# ❌ BAD: Runs as root (UID 0)
CMD ["node", "index.js"]

# ✅ GOOD: Runs as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
CMD ["node", "index.js"]
```

**4. Image Scanning**:
```bash
# Scan image with ECR
aws ecr start-image-scan \
  --repository-name myapp \
  --image-id imageTag=v1.0

# Scan with Trivy (open-source)
trivy image myapp:v1.0

# Output:
# CRITICAL: 2, HIGH: 5, MEDIUM: 15, LOW: 30
# CVE-2023-1234: libssl buffer overflow
# Recommendation: Upgrade to libssl 3.0.8
```

### Runtime Security

**1. Read-Only Root Filesystem**:
```json
{
  "containerDefinitions": [
    {
      "readonlyRootFilesystem": true,
      "mountPoints": [
        {
          "sourceVolume": "tmp",
          "containerPath": "/tmp",
          "readOnly": false
        }
      ]
    }
  ],
  "volumes": [
    {
      "name": "tmp",
      "host": {}
    }
  ]
}
```

**2. Drop Capabilities**:
```yaml
# Kubernetes
spec:
  containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false
      runAsNonRoot: true
      runAsUser: 1001
      capabilities:
        drop:
        - ALL
      readOnlyRootFilesystem: true
```

**3. Resource Limits**:
```json
{
  "cpu": "1024",
  "memory": "2048",
  "memoryReservation": "1024",
  "ulimits": [
    {
      "name": "nofile",
      "softLimit": 1024,
      "hardLimit": 2048
    }
  ]
}
```

**4. Secrets Management**:
```json
{
  "secrets": [
    {
      "name": "DB_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-password"
    },
    {
      "name": "API_KEY",
      "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/api-key"
    }
  ]
}
```

---

## LocalStack & Docker Examples

### ECS on LocalStack

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=ecs,ecr,secretsmanager,logs
      - DEBUG=1
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "./localstack:/tmp/localstack"
```

**ECS Setup Script**:
```bash
#!/bin/bash

ENDPOINT="http://localhost:4566"

# Create ECR repository
aws ecr create-repository \
  --repository-name myapp \
  --endpoint-url=$ENDPOINT

# Build and push image
docker build -t myapp:latest .
docker tag myapp:latest localhost:4566/myapp:latest
docker push localhost:4566/myapp:latest

# Create ECS cluster
aws ecs create-cluster \
  --cluster-name test-cluster \
  --endpoint-url=$ENDPOINT

# Create task definition
cat > task-def.json <<EOF
{
  "family": "myapp",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "localhost:4566/myapp:latest",
      "memory": 512,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "development"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/myapp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "app"
        }
      }
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512"
}
EOF

aws ecs register-task-definition \
  --cli-input-json file://task-def.json \
  --endpoint-url=$ENDPOINT

# Create log group
aws logs create-log-group \
  --log-group-name /ecs/myapp \
  --endpoint-url=$ENDPOINT

# Run task
aws ecs run-task \
  --cluster test-cluster \
  --task-definition myapp \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-abc123],securityGroups=[sg-123456],assignPublicIp=ENABLED}" \
  --endpoint-url=$ENDPOINT

# List tasks
aws ecs list-tasks \
  --cluster test-cluster \
  --endpoint-url=$ENDPOINT

# View logs
aws logs tail /ecs/myapp --follow --endpoint-url=$ENDPOINT
```

### Complete Microservices Example

**Application Code** (Go):
```go
// main.go
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/dynamodb"
)

type User struct {
    ID    string `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

var db *dynamodb.DynamoDB

func main() {
    // AWS session
    sess := session.Must(session.NewSession(&aws.Config{
        Region: aws.String(os.Getenv("AWS_REGION")),
    }))
    db = dynamodb.New(sess)
    
    // Routes
    http.HandleFunc("/health", healthHandler)
    http.HandleFunc("/users", usersHandler)
    
    port := os.Getenv("PORT")
    if port == "" {
        port = "3000"
    }
    
    log.Printf("Server starting on port %s", port)
    log.Fatal(http.ListenAndServe(":"+port, nil))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "status": "healthy",
    })
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case "GET":
        getUsers(w, r)
    case "POST":
        createUser(w, r)
    default:
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
    }
}

func getUsers(w http.ResponseWriter, r *http.Request) {
    result, err := db.Scan(&dynamodb.ScanInput{
        TableName: aws.String("Users"),
    })
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(result.Items)
}

func createUser(w http.ResponseWriter, r *http.Request) {
    var user User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    _, err := db.PutItem(&dynamodb.PutItemInput{
        TableName: aws.String("Users"),
        Item: map[string]*dynamodb.AttributeValue{
            "ID":    {S: aws.String(user.ID)},
            "Name":  {S: aws.String(user.Name)},
            "Email": {S: aws.String(user.Email)},
        },
    })
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(user)
}
```

**Dockerfile**:
```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM alpine:3.18

RUN apk --no-cache add ca-certificates curl

WORKDIR /app

COPY --from=builder /app/server .

RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["./server"]
```

**Python Version**:
```python
# app.py
from flask import Flask, request, jsonify
import boto3
import os
from datetime import datetime

app = Flask(__name__)

# DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
table = dynamodb.Table('Users')

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/users', methods=['GET', 'POST'])
def users():
    if request.method == 'GET':
        response = table.scan()
        return jsonify({'users': response.get('Items', [])})
    
    elif request.method == 'POST':
        user = request.json
        table.put_item(Item=user)
        return jsonify(user), 201

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port)
```

```dockerfile
# Dockerfile (Python)
FROM python:3.11-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

FROM python:3.11-slim

WORKDIR /app

COPY --from=builder /app /app

RUN adduser --disabled-password --gecos '' appuser
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:3000/health')"

CMD ["python", "app.py"]
```

---

## Production Patterns

### 1. Blue-Green Deployment

**ECS Blue-Green with CodeDeploy**:
```json
{
  "version": 0.0,
  "Resources": [
    {
      "TargetService": {
        "Type": "AWS::ECS::Service",
        "Properties": {
          "TaskDefinition": "arn:aws:ecs:us-east-1:123456789012:task-definition/web-app:5",
          "LoadBalancerInfo": {
            "ContainerName": "app",
            "ContainerPort": 3000
          },
          "PlatformVersion": "LATEST"
        }
      }
    }
  ],
  "Hooks": [
    {
      "BeforeInstall": "LambdaFunctionToValidateBeforeInstall"
    },
    {
      "AfterInstall": "LambdaFunctionToValidateAfterInstall"
    },
    {
      "AfterAllowTestTraffic": "LambdaFunctionToValidateAfterTestTrafficStart"
    },
    {
      "BeforeAllowTraffic": "LambdaFunctionToValidateBeforeAllowingTraffic"
    },
    {
      "AfterAllowTraffic": "LambdaFunctionToValidateAfterAllowingTraffic"
    }
  ]
}
```

**Deployment Configuration**:
```json
{
  "deploymentConfigName": "CodeDeployDefault.ECSCanary10Percent5Minutes",
  "trafficRoutingConfig": {
    "type": "TimeBasedCanary",
    "timeBasedCanary": {
      "canaryPercentage": 10,
      "canaryInterval": 5
    }
  }
}

// Process:
// 1. Deploy green task set
// 2. Route 10% traffic to green
// 3. Wait 5 minutes
// 4. If healthy, route 100% to green
// 5. Terminate blue task set
// Total time: ~10 minutes
// Rollback: Instant (shift traffic back)
```

### 2. Microservices Architecture

```
┌─────────────────────────────────────────────────┐
│                 Application Load Balancer        │
└─────────────┬───────────────────────┬───────────┘
              │                       │
    ┌─────────▼────────┐   ┌─────────▼────────┐
    │  ECS Service 1   │   │  ECS Service 2   │
    │   (API Gateway)  │   │   (Auth Service) │
    │   Tasks: 3       │   │   Tasks: 2       │
    └─────────┬────────┘   └─────────┬────────┘
              │                       │
    ┌─────────▼────────┐   ┌─────────▼────────┐
    │  ECS Service 3   │   │  ECS Service 4   │
    │  (User Service)  │   │  (Order Service) │
    │   Tasks: 5       │   │   Tasks: 3       │
    └─────────┬────────┘   └─────────┬────────┘
              │                       │
    ┌─────────▼────────────────────────▼────────┐
    │         DynamoDB / RDS / ElastiCache       │
    └────────────────────────────────────────────┘
```

**Service Discovery**:
```yaml
# API Gateway Service
spec:
  serviceConnectConfiguration:
    enabled: true
    namespace: production
    services:
    - portName: http
      discoveryName: api-gateway
      clientAliases:
      - port: 80
        dnsName: api.local

# User Service (calls Auth Service)
Environment:
  - Name: AUTH_SERVICE_URL
    Value: http://auth.local
```

### 3. Multi-Region Active-Active

```
us-east-1                          us-west-2
├─ ECS Cluster                     ├─ ECS Cluster
│  ├─ Service (10 tasks)           │  ├─ Service (10 tasks)
│  └─ ALB                          │  └─ ALB
├─ DynamoDB Global Table           ├─ DynamoDB Global Table
└─ Aurora Global Database          └─ Aurora Global Database (replica)

Route 53 Latency Routing:
- us-east-1 users → us-east-1 ECS
- us-west-2 users → us-west-2 ECS
- Automatic failover if region down

Replication:
- DynamoDB: <1 second latency
- Aurora: ~1 second latency
```

### 4. Cost Optimization

**Spot Instances for Batch**:
```json
{
  "capacityProviders": [
    "FARGATE",
    "FARGATE_SPOT"
  ],
  "defaultCapacityProviderStrategy": [
    {
      "capacityProvider": "FARGATE_SPOT",
      "weight": 4,
      "base": 0
    },
    {
      "capacityProvider": "FARGATE",
      "weight": 1,
      "base": 2
    }
  ]
}

// 2 tasks on Fargate (guaranteed)
// Remaining tasks: 80% Spot, 20% Fargate
// Cost savings: ~70% for Spot workloads
```

**Graviton2 (ARM)**:
```json
{
  "runtimePlatform": {
    "cpuArchitecture": "ARM64",
    "operatingSystemFamily": "LINUX"
  }
}

// Graviton2 pricing: 20% cheaper than x86
// Same performance for most workloads
```

**Right-Sizing**:
```
Before:
- 10 tasks × 2 vCPU × 4 GB = 20 vCPU, 40 GB
- Cost: $355/month
- Average utilization: 30% CPU, 40% memory

After:
- 10 tasks × 1 vCPU × 2 GB = 10 vCPU, 20 GB
- Cost: $177/month
- Average utilization: 60% CPU, 80% memory

Savings: 50% ($178/month)
```

---

## Interview Questions

### Basic Questions

**Q1: What is the difference between ECS and EKS?**

**Answer**:

**ECS (Elastic Container Service)**:
- AWS-proprietary container orchestration
- Simpler, AWS-native
- No Kubernetes knowledge needed
- Task definitions (JSON)
- Fargate or EC2 launch types

**EKS (Elastic Kubernetes Service)**:
- Managed Kubernetes
- Industry-standard, portable
- Kubernetes knowledge required
- Kubernetes manifests (YAML)
- Community ecosystem (Helm, operators)

**When to use ECS**:
- AWS-only shop
- Simpler workloads
- Team not familiar with Kubernetes
- Quick setup (minutes vs hours)

**When to use EKS**:
- Multi-cloud or hybrid cloud
- Complex orchestration needs
- Existing Kubernetes expertise
- Need Kubernetes ecosystem tools

**Comparison**:
```
Feature         │ ECS          │ EKS
────────────────┼──────────────┼─────────────
Learning Curve  │ Low          │ High
Setup Time      │ 10 minutes   │ 30-60 minutes
Portability     │ AWS-only     │ Any cloud
Ecosystem       │ Limited      │ Rich (Helm, etc.)
Control Plane   │ Free         │ $0.10/hour ($73/month)
```

---

**Q2: Fargate vs EC2 launch type - when to use each?**

**Answer**:

**Fargate**:
```
✅ Use when:
- Don't want to manage EC2 instances
- Variable workloads (spiky traffic)
- Rapid scaling needed
- Security/compliance (isolated compute)
- Small team (no ops overhead)

❌ Avoid when:
- High, consistent utilization (>80%)
- Cost-sensitive (EC2 cheaper at scale)
- Need GPUs or custom instance types
- Require host-level access
```

**EC2 Launch Type**:
```
✅ Use when:
- Predictable, steady workloads
- Cost optimization (pack tasks efficiently)
- Need specific instance types
- Require host-level customization
- Large-scale deployments (100+ tasks)

❌ Avoid when:
- Don't want to manage infrastructure
- Small team (no ops capacity)
- Rapid prototyping
```

**Cost Example**:
```
Workload: 10 tasks, 1 vCPU, 2 GB each
Running 24/7

Fargate:
10 tasks × $35.55/month = $355/month

EC2 (t3.large: 2 vCPU, 8 GB):
1 instance × $60/month = $60/month
(Can fit ~4 tasks per instance)
3 instances × $60 = $180/month

Winner: EC2 (49% cheaper)

But: Add EC2 management time ($$ for ops team)
```

---

**Q3: How does container networking work in AWS?**

**Answer**:

**Network Modes**:

**1. awsvpc** (recommended for Fargate, EKS):
```
Each task gets:
- Dedicated ENI (Elastic Network Interface)
- Private IP from VPC
- Own security group
- Full VPC networking features

Pros:
✅ Security (task-level security groups)
✅ VPC Flow Logs (per-task visibility)
✅ Direct VPC routing

Cons:
❌ ENI limits (instance type dependent)
❌ IP address consumption
```

**2. bridge** (default for EC2):
```
Docker bridge network:
- Containers share host network namespace
- Port mapping required (host:80 → container:3000)
- One security group per instance

Pros:
✅ Less IP consumption
✅ More tasks per instance

Cons:
❌ Port conflicts (can't run two containers on port 80)
❌ Less isolation
```

**3. host**:
```
- Container uses host network directly
- No isolation
- Maximum performance

Use case: Network-intensive apps needing low latency
```

**Example** (awsvpc):
```
VPC: 10.0.0.0/16
Subnet: 10.0.1.0/24

Task 1: 10.0.1.10 (ENI)
Task 2: 10.0.1.11 (ENI)
Task 3: 10.0.1.12 (ENI)

Security Group: Allow 443 from ALB security group
```

---

### Intermediate Questions

**Q4: Design a microservices architecture using ECS**

**Answer**:

**Architecture**:
```
┌─────────────────────────────────────┐
│   Route 53 (api.example.com)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  CloudFront (CDN, DDoS protection)  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Application Load Balancer        │
│  /api/users → User Service          │
│  /api/orders → Order Service        │
│  /api/auth → Auth Service           │
└──────┬───────┬────────┬─────────────┘
       │       │        │
   ┌───▼──┐ ┌──▼───┐ ┌─▼────┐
   │User  │ │Order │ │Auth  │
   │Svc   │ │Svc   │ │Svc   │
   │(ECS) │ │(ECS) │ │(ECS) │
   └───┬──┘ └──┬───┘ └─┬────┘
       │       │        │
   ┌───▼───────▼────────▼────┐
   │   DynamoDB, RDS,         │
   │   ElastiCache            │
   └──────────────────────────┘
```

**ECS Configuration**:

**1. Cluster**:
```bash
aws ecs create-cluster \
  --cluster-name production \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE,weight=1,base=2 \
    capacityProvider=FARGATE_SPOT,weight=4
```

**2. Task Definitions** (per service):
```json
// user-service task definition
{
  "family": "user-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "user-service",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/user-service:v1.0",
      "portMappings": [{"containerPort": 3000}],
      "environment": [
        {"name": "SERVICE_NAME", "value": "user-service"},
        {"name": "AUTH_SERVICE_URL", "value": "http://auth.local"}
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:user-db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/user-service",
          "awslogs-stream-prefix": "app"
        }
      }
    }
  ]
}
```

**3. Services** (with Service Connect):
```json
{
  "serviceName": "user-service",
  "cluster": "production",
  "taskDefinition": "user-service:1",
  "desiredCount": 3,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["subnet-abc123", "subnet-def456"],
      "securityGroups": ["sg-service"],
      "assignPublicIp": "DISABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/user-tg",
      "containerName": "user-service",
      "containerPort": 3000
    }
  ],
  "serviceConnectConfiguration": {
    "enabled": true,
    "namespace": "production",
    "services": [
      {
        "portName": "http",
        "discoveryName": "user-service",
        "clientAliases": [
          {"port": 3000, "dnsName": "user.local"}
        ]
      }
    ]
  }
}
```

**4. ALB Listener Rules**:
```bash
# /api/users/* → User Service
aws elbv2 create-rule \
  --listener-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/alb/abc123 \
  --priority 10 \
  --conditions Field=path-pattern,Values='/api/users/*' \
  --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/user-tg

# /api/orders/* → Order Service
aws elbv2 create-rule \
  --listener-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/alb/abc123 \
  --priority 20 \
  --conditions Field=path-pattern,Values='/api/orders/*' \
  --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/order-tg
```

**Benefits**:
- **Isolation**: Each service scales independently
- **Resilience**: Failure in one service doesn't affect others
- **Deployment**: Deploy services independently
- **Scaling**: Auto-scale per service based on metrics

---

**Q5: How would you implement zero-downtime deployments?**

**Answer**:

**Strategy 1: Rolling Update**:
```json
{
  "deploymentConfiguration": {
    "maximumPercent": 200,
    "minimumHealthyPercent": 100
  }
}

Process:
1. Current: 3 tasks (v1.0)
2. Start 3 new tasks (v2.0) → Total: 6 tasks
3. Wait for new tasks healthy (health checks pass)
4. Stop 3 old tasks (v1.0) → Total: 3 tasks (v2.0)

Downtime: 0 seconds
Duration: ~5 minutes
```

**Strategy 2: Blue-Green with CodeDeploy**:
```
Timeline:
0:00 - Deploy green task set (v2.0)
0:05 - Green tasks healthy
0:05 - Route 10% traffic to green (canary)
0:10 - Monitor metrics (error rate, latency)
0:10 - Route 50% traffic to green
0:15 - Monitor metrics
0:15 - Route 100% traffic to green
0:20 - Terminate blue task set (v1.0)

Rollback: Change traffic routing (instant)
```

**Strategy 3: EKS Rolling Update**:
```yaml
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 0

# Process:
# 1. Start 2 new pods (v2.0) → Total: 7 pods
# 2. Wait for new pods ready
# 3. Terminate 2 old pods (v1.0) → Total: 5 pods
# 4. Repeat until all pods updated
```

**Health Checks** (critical for zero downtime):
```json
{
  "healthCheck": {
    "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
    "interval": 30,
    "timeout": 5,
    "retries": 3,
    "startPeriod": 60
  }
}

// Task not marked healthy until:
// - 60 seconds elapsed (startPeriod)
// - 3 consecutive successful health checks
// - Total: ~2 minutes before receiving traffic
```

**Circuit Breaker** (automatic rollback):
```json
{
  "deploymentCircuitBreaker": {
    "enable": true,
    "rollback": true
  }
}

// If deployment fails (tasks unhealthy), automatic rollback
```

---

### Advanced Questions

**Q6: Design a multi-region, highly available container platform**

**Answer**:

**Architecture**:
```
Region 1 (us-east-1)               Region 2 (us-west-2)
├─ ECS Cluster                     ├─ ECS Cluster
│  ├─ Service: 10 tasks            │  ├─ Service: 10 tasks
│  └─ ALB                          │  └─ ALB
├─ DynamoDB Global Table           ├─ DynamoDB Global Table
├─ Aurora Global Database          ├─ Aurora Global Database (writer)
│  (writer)                        │
└─ ECR Replication →               ← ECR Replication

Route 53:
- Latency-based routing
- Health checks on each ALB
- Automatic failover

CloudFront:
- Global CDN
- Origin: Both ALBs
- Failover origin group
```

**Implementation**:

**1. ECR Cross-Region Replication**:
```json
{
  "rules": [
    {
      "destinations": [
        {"region": "us-west-2", "registryId": "123456789012"}
      ],
      "repositoryFilters": [
        {"filter": "*", "filterType": "PREFIX_MATCH"}
      ]
    }
  ]
}
```

**2. DynamoDB Global Table**:
```bash
aws dynamodb create-global-table \
  --global-table-name Users \
  --replication-group \
    RegionName=us-east-1 \
    RegionName=us-west-2

# Replication lag: <1 second
```

**3. Aurora Global Database**:
```bash
aws rds create-global-cluster \
  --global-cluster-identifier prod-global \
  --engine aurora-mysql

aws rds create-db-cluster \
  --db-cluster-identifier prod-us-east-1 \
  --global-cluster-identifier prod-global \
  --engine aurora-mysql \
  --region us-east-1

aws rds create-db-cluster \
  --db-cluster-identifier prod-us-west-2 \
  --global-cluster-identifier prod-global \
  --engine aurora-mysql \
  --region us-west-2

# Replication lag: ~1 second
# Failover: <1 minute (promote read replica to writer)
```

**4. Route 53 Failover**:
```bash
# Primary record (us-east-1)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "A",
        "SetIdentifier": "primary",
        "Failover": "PRIMARY",
        "AliasTarget": {
          "HostedZoneId": "Z123456",
          "DNSName": "alb-us-east-1.amazonaws.com",
          "EvaluateTargetHealth": true
        },
        "HealthCheckId": "abc123"
      }
    }]
  }'

# Secondary record (us-west-2)
# Similar but Failover: "SECONDARY"
```

**5. ECS Task Definition** (multi-region):
```json
{
  "family": "web-app",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest",
      "environment": [
        {"name": "REGION", "value": "us-east-1"},
        {"name": "DYNAMODB_ENDPOINT", "value": "https://dynamodb.us-east-1.amazonaws.com"},
        {"name": "AURORA_ENDPOINT", "value": "prod-us-east-1.cluster-abc123.us-east-1.rds.amazonaws.com"}
      ]
    }
  ]
}

// us-west-2: Same task definition, different environment variables
```

**Disaster Recovery Process**:
```
Normal Operation:
- Both regions active (active-active)
- Route 53 routes based on latency
- DynamoDB/Aurora replicate bi-directionally

us-east-1 Failure:
1. Route 53 health check fails (3 failures × 30s = 90s)
2. DNS fails over to us-west-2 (automatic)
3. All traffic now goes to us-west-2
4. Promote Aurora read replica to writer (if needed)
5. RTO: ~2 minutes
6. RPO: <1 second (replication lag)

Recovery:
1. Fix us-east-1 issues
2. Verify health checks pass
3. Route 53 automatically re-includes us-east-1
4. Traffic distributes based on latency again
```

**Cost**:
```
Single Region:
- ECS: $355/month (10 tasks Fargate)
- DynamoDB: $50/month
- Aurora: $150/month
- ALB: $25/month
- Total: $580/month

Multi-Region (2x):
- ECS: $710/month
- DynamoDB Global Table: $100/month (2x writes)
- Aurora Global: $300/month
- ALB: $50/month
- Route 53: $1/month
- Total: $1,161/month

Additional cost: $581/month (100% increase)
Benefit: 99.99% availability, <2min RTO
```

---

This completes the comprehensive Container Orchestration guide covering ECS, EKS, Fargate, ECR, service discovery, security, LocalStack examples, production patterns, and in-depth interview questions. Ready for the next file!

