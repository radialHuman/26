# Amazon ECS (Elastic Container Service)

## What is ECS?

Amazon Elastic Container Service (ECS) is a fully managed container orchestration service that allows you to run, stop, and manage Docker containers on a cluster. ECS eliminates the need to install, operate, and scale your own cluster management infrastructure.

## Why Use ECS?

### Key Benefits
- **Fully Managed**: No control plane to manage
- **AWS Integration**: Deep integration with ALB, CloudWatch, IAM, Secrets Manager
- **Flexible**: Launch types (EC2, Fargate), scheduling strategies
- **Scalable**: Auto-scaling for services and clusters
- **Secure**: Task-level IAM roles, VPC networking
- **Cost-Effective**: No ECS charges (pay for compute only)
- **Service Discovery**: Built-in with Cloud Map

### Use Cases
- Microservices architecture
- Batch processing jobs
- Machine learning training
- Web applications
- CI/CD pipelines
- Hybrid deployments

## Core Concepts

### Clusters

**What**: Logical grouping of tasks or services

**Types**:
- **EC2**: Manage EC2 instances yourself
- **Fargate**: Serverless (no instances to manage)
- **External**: On-premises or other cloud (ECS Anywhere)

**Creating Cluster**:
```python
import boto3

ecs = boto3.client('ecs')

# Fargate cluster
response = ecs.create_cluster(
    clusterName='my-fargate-cluster',
    capacityProviders=['FARGATE', 'FARGATE_SPOT'],
    defaultCapacityProviderStrategy=[
        {
            'capacityProvider': 'FARGATE',
            'weight': 1,
            'base': 0
        }
    ],
    tags=[
        {'key': 'Environment', 'value': 'production'}
    ]
)

# EC2 cluster
response = ecs.create_cluster(
    clusterName='my-ec2-cluster',
    capacityProviders=['my-asg-capacity-provider'],
    settings=[
        {
            'name': 'containerInsights',
            'value': 'enabled'
        }
    ]
)
```

### Task Definitions

**What**: Blueprint for application (Docker image, CPU, memory, networking)

**Components**:
- Container definitions
- Task role (IAM for tasks)
- Execution role (IAM for ECS agent)
- Network mode
- Volumes
- Resource requirements

**Example Task Definition**:
```json
{
  "family": "my-app",
  "taskRoleArn": "arn:aws:iam::123456789012:role/MyTaskRole",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/my-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**Registering Task Definition**:
```python
response = ecs.register_task_definition(
    family='my-app',
    taskRoleArn='arn:aws:iam::123456789012:role/MyTaskRole',
    executionRoleArn='arn:aws:iam::123456789012:role/ecsTaskExecutionRole',
    networkMode='awsvpc',
    requiresCompatibilities=['FARGATE'],
    cpu='256',
    memory='512',
    containerDefinitions=[
        {
            'name': 'web',
            'image': '123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:latest',
            'portMappings': [
                {'containerPort': 80, 'protocol': 'tcp'}
            ],
            'essential': True,
            'logConfiguration': {
                'logDriver': 'awslogs',
                'options': {
                    'awslogs-group': '/ecs/my-app',
                    'awslogs-region': 'us-east-1',
                    'awslogs-stream-prefix': 'ecs'
                }
            }
        }
    ]
)
```

### Tasks

**What**: Running instance of a task definition

**Types**:
- **Standalone**: Run once (batch jobs)
- **Service**: Long-running (web applications)

**Running Task**:
```python
response = ecs.run_task(
    cluster='my-cluster',
    taskDefinition='my-app:1',
    launchType='FARGATE',
    networkConfiguration={
        'awsvpcConfiguration': {
            'subnets': ['subnet-12345', 'subnet-67890'],
            'securityGroups': ['sg-12345'],
            'assignPublicIp': 'ENABLED'
        }
    },
    count=1
)
```

### Services

**What**: Maintain desired number of task instances

**Features**:
- Auto-scaling
- Load balancer integration
- Service discovery
- Rolling deployments
- Circuit breaker

**Creating Service**:
```python
response = ecs.create_service(
    cluster='my-cluster',
    serviceName='my-service',
    taskDefinition='my-app:1',
    desiredCount=3,
    launchType='FARGATE',
    networkConfiguration={
        'awsvpcConfiguration': {
            'subnets': ['subnet-12345', 'subnet-67890'],
            'securityGroups': ['sg-12345'],
            'assignPublicIp': 'DISABLED'
        }
    },
    loadBalancers=[
        {
            'targetGroupArn': 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/my-tg/xxx',
            'containerName': 'web',
            'containerPort': 80
        }
    ],
    healthCheckGracePeriodSeconds=60,
    deploymentConfiguration={
        'maximumPercent': 200,
        'minimumHealthyPercent': 100,
        'deploymentCircuitBreaker': {
            'enable': True,
            'rollback': True
        }
    },
    enableECSManagedTags=True,
    propagateTags='SERVICE'
)
```

## Launch Types

### Fargate

**What**: Serverless compute for containers

**Characteristics**:
- No EC2 instances to manage
- Pay for vCPU and memory per second
- Automatic scaling
- VPC networking (awsvpc mode)

**CPU/Memory Combinations**:
```
0.25 vCPU: 0.5 GB, 1 GB, 2 GB
0.5 vCPU: 1 GB - 4 GB (1 GB increments)
1 vCPU: 2 GB - 8 GB (1 GB increments)
2 vCPU: 4 GB - 16 GB (1 GB increments)
4 vCPU: 8 GB - 30 GB (1 GB increments)
8 vCPU: 16 GB - 60 GB (4 GB increments)
16 vCPU: 32 GB - 120 GB (8 GB increments)
```

**Pricing** (us-east-1):
```
vCPU: $0.04048 per vCPU-hour
Memory: $0.004445 per GB-hour

Example (1 vCPU, 2 GB):
  vCPU: $0.04048/hr
  Memory: 2 × $0.004445 = $0.00889/hr
  Total: $0.04937/hr = $36/month

Example (4 vCPU, 8 GB):
  vCPU: 4 × $0.04048 = $0.16192/hr
  Memory: 8 × $0.004445 = $0.03556/hr
  Total: $0.19748/hr = $144/month
```

**Fargate Spot**:
- Up to 70% discount
- Can be interrupted with 2-minute warning
- Good for fault-tolerant workloads

**Use Cases**:
- Variable workloads
- Batch jobs
- Microservices
- No ops overhead desired

### EC2 Launch Type

**What**: Run containers on EC2 instances you manage

**Characteristics**:
- Full control over instances
- More instance types available
- Reserved Instances / Savings Plans
- Better for sustained workloads

**ECS-Optimized AMIs**:
```
Amazon Linux 2023 (AL2023)
Amazon Linux 2 (AL2)
Windows Server 2022
Windows Server 2019
Bottlerocket (security-focused)
```

**Instance Types**:
```
General: t3, m5, m6i
Compute: c5, c6i
Memory: r5, r6i
GPU: p3, g4dn
Graviton: t4g, m6g, c6g, r6g (cost-optimized)
```

**User Data** (EC2 instance registration):
```bash
#!/bin/bash
echo ECS_CLUSTER=my-cluster >> /etc/ecs/ecs.config
echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config
echo ECS_ENABLE_TASK_IAM_ROLE=true >> /etc/ecs/ecs.config
```

**Cost Comparison**:
```
Fargate (1 vCPU, 2 GB): $36/month
EC2 t3.small (2 vCPU, 2 GB): $15/month (on-demand)
  + EBS: $8/month (gp3 80 GB)
  Total: $23/month

EC2 cheaper for sustained workloads
Fargate cheaper for variable/short-lived workloads
```

### Capacity Providers

**What**: Link between cluster and compute capacity (EC2 Auto Scaling, Fargate)

**Benefits**:
- Mixed launch types (EC2 + Fargate)
- Auto Scaling based on capacity
- Cost optimization (Spot, Savings Plans)

**Creating Capacity Provider** (EC2):
```python
# Create Auto Scaling group first
autoscaling = boto3.client('autoscaling')

asg_response = autoscaling.create_auto_scaling_group(
    AutoScalingGroupName='my-ecs-asg',
    LaunchTemplate={
        'LaunchTemplateId': 'lt-xxx',
        'Version': '$Latest'
    },
    MinSize=0,
    MaxSize=10,
    DesiredCapacity=2,
    VPCZoneIdentifier='subnet-12345,subnet-67890',
    NewInstancesProtectedFromScaleIn=True  # For managed scaling
)

# Create capacity provider
response = ecs.create_capacity_provider(
    name='my-asg-capacity-provider',
    autoScalingGroupProvider={
        'autoScalingGroupArn': 'arn:aws:autoscaling:us-east-1:123456789012:autoScalingGroup:xxx:autoScalingGroupName/my-ecs-asg',
        'managedScaling': {
            'status': 'ENABLED',
            'targetCapacity': 80,  # Target 80% utilization
            'minimumScalingStepSize': 1,
            'maximumScalingStepSize': 10
        },
        'managedTerminationProtection': 'ENABLED'
    }
)

# Associate with cluster
ecs.put_cluster_capacity_providers(
    cluster='my-cluster',
    capacityProviders=['my-asg-capacity-provider', 'FARGATE', 'FARGATE_SPOT'],
    defaultCapacityProviderStrategy=[
        {'capacityProvider': 'my-asg-capacity-provider', 'weight': 2, 'base': 2},
        {'capacityProvider': 'FARGATE', 'weight': 1}
    ]
)
```

**Strategy**:
```
Base: Minimum tasks on capacity provider
Weight: Proportion of tasks beyond base

Example:
  EC2: base=2, weight=2
  Fargate: weight=1

10 tasks:
  EC2: 2 (base) + 8 × 2/3 = 7 tasks
  Fargate: 8 × 1/3 = 3 tasks
```

## Networking

### Network Modes

**awsvpc** (Recommended, required for Fargate):
- Each task gets own ENI
- VPC security groups
- Private IP address
- Better isolation

**bridge** (EC2 only):
- Docker bridge network
- Port mapping required
- Host port conflicts possible

**host** (EC2 only):
- Share host network
- No port mapping
- Maximum performance

**none**:
- No networking
- Loopback only

### Service Discovery

**What**: DNS-based service discovery with Route 53

**How It Works**:
```
Service → Cloud Map Namespace → Route 53 Private Hosted Zone
Tasks registered automatically with DNS names
```

**Creating Namespace**:
```python
servicediscovery = boto3.client('servicediscovery')

response = servicediscovery.create_private_dns_namespace(
    Name='my-app.local',
    Vpc='vpc-12345',
    Description='Service discovery namespace'
)

namespace_id = response['OperationId']
```

**Service with Discovery**:
```python
response = ecs.create_service(
    cluster='my-cluster',
    serviceName='api-service',
    taskDefinition='api:1',
    desiredCount=3,
    launchType='FARGATE',
    networkConfiguration={...},
    serviceRegistries=[
        {
            'registryArn': 'arn:aws:servicediscovery:us-east-1:123456789012:service/srv-xxx',
            'containerName': 'api',
            'containerPort': 8080
        }
    ]
)

# DNS: api-service.my-app.local
# Returns IPs of all healthy tasks
```

**Usage**:
```python
import socket

# Resolve service
ips = socket.gethostbyname_ex('api-service.my-app.local')
# Returns: ['10.0.1.5', '10.0.1.6', '10.0.1.7']
```

### Load Balancing

**Application Load Balancer** (Recommended):
```python
# Create target group
elbv2 = boto3.client('elbv2')

tg_response = elbv2.create_target_group(
    Name='my-ecs-tg',
    Protocol='HTTP',
    Port=80,
    VpcId='vpc-12345',
    TargetType='ip',  # For awsvpc mode
    HealthCheckPath='/health',
    HealthCheckIntervalSeconds=30,
    HealthyThresholdCount=2,
    UnhealthyThresholdCount=3
)

# Create service with ALB
ecs.create_service(
    cluster='my-cluster',
    serviceName='web-service',
    taskDefinition='web:1',
    desiredCount=3,
    launchType='FARGATE',
    loadBalancers=[
        {
            'targetGroupArn': tg_response['TargetGroups'][0]['TargetGroupArn'],
            'containerName': 'web',
            'containerPort': 80
        }
    ],
    healthCheckGracePeriodSeconds=60,
    networkConfiguration={
        'awsvpcConfiguration': {
            'subnets': ['subnet-12345', 'subnet-67890'],
            'securityGroups': ['sg-12345']
        }
    }
)
```

**Network Load Balancer**:
```
Target type: ip (awsvpc)
Use case: High throughput, low latency, TCP/UDP
```

## Auto Scaling

### Service Auto Scaling

**Target Tracking**:
```python
appautoscaling = boto3.client('application-autoscaling')

# Register scalable target
appautoscaling.register_scalable_target(
    ServiceNamespace='ecs',
    ResourceId='service/my-cluster/my-service',
    ScalableDimension='ecs:service:DesiredCount',
    MinCapacity=2,
    MaxCapacity=10
)

# CPU-based scaling
appautoscaling.put_scaling_policy(
    PolicyName='cpu-scaling',
    ServiceNamespace='ecs',
    ResourceId='service/my-cluster/my-service',
    ScalableDimension='ecs:service:DesiredCount',
    PolicyType='TargetTrackingScaling',
    TargetTrackingScalingPolicyConfiguration={
        'TargetValue': 70.0,
        'PredefinedMetricSpecification': {
            'PredefinedMetricType': 'ECSServiceAverageCPUUtilization'
        },
        'ScaleInCooldown': 300,
        'ScaleOutCooldown': 60
    }
)

# Memory-based scaling
appautoscaling.put_scaling_policy(
    PolicyName='memory-scaling',
    ServiceNamespace='ecs',
    ResourceId='service/my-cluster/my-service',
    ScalableDimension='ecs:service:DesiredCount',
    PolicyType='TargetTrackingScaling',
    TargetTrackingScalingPolicyConfiguration={
        'TargetValue': 80.0,
        'PredefinedMetricSpecification': {
            'PredefinedMetricType': 'ECSServiceAverageMemoryUtilization'
        }
    }
)

# ALB request count scaling
appautoscaling.put_scaling_policy(
    PolicyName='alb-request-scaling',
    ServiceNamespace='ecs',
    ResourceId='service/my-cluster/my-service',
    ScalableDimension='ecs:service:DesiredCount',
    PolicyType='TargetTrackingScaling',
    TargetTrackingScalingPolicyConfiguration={
        'TargetValue': 1000.0,
        'PredefinedMetricSpecification': {
            'PredefinedMetricType': 'ALBRequestCountPerTarget',
            'ResourceLabel': 'app/my-alb/xxx/targetgroup/my-tg/yyy'
        }
    }
)
```

**Step Scaling**:
```python
# Create CloudWatch alarm
cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_alarm(
    AlarmName='high-cpu',
    MetricName='CPUUtilization',
    Namespace='AWS/ECS',
    Statistic='Average',
    Period=60,
    EvaluationPeriods=2,
    Threshold=80,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'ClusterName', 'Value': 'my-cluster'},
        {'Name': 'ServiceName', 'Value': 'my-service'}
    ]
)

# Step scaling policy
appautoscaling.put_scaling_policy(
    PolicyName='step-scaling',
    ServiceNamespace='ecs',
    ResourceId='service/my-cluster/my-service',
    ScalableDimension='ecs:service:DesiredCount',
    PolicyType='StepScaling',
    StepScalingPolicyConfiguration={
        'AdjustmentType': 'PercentChangeInCapacity',
        'StepAdjustments': [
            {
                'MetricIntervalLowerBound': 0,
                'MetricIntervalUpperBound': 10,
                'ScalingAdjustment': 10
            },
            {
                'MetricIntervalLowerBound': 10,
                'ScalingAdjustment': 30
            }
        ],
        'Cooldown': 60
    }
)
```

**Scheduled Scaling**:
```python
# Scale up at 8 AM
appautoscaling.put_scheduled_action(
    ServiceNamespace='ecs',
    ScheduledActionName='scale-up-morning',
    ResourceId='service/my-cluster/my-service',
    ScalableDimension='ecs:service:DesiredCount',
    Schedule='cron(0 8 * * ? *)',
    ScalableTargetAction={
        'MinCapacity': 10,
        'MaxCapacity': 20
    }
)

# Scale down at 6 PM
appautoscaling.put_scheduled_action(
    ServiceNamespace='ecs',
    ScheduledActionName='scale-down-evening',
    ResourceId='service/my-cluster/my-service',
    ScalableDimension='ecs:service:DesiredCount',
    Schedule='cron(0 18 * * ? *)',
    ScalableTargetAction={
        'MinCapacity': 2,
        'MaxCapacity': 5
    }
)
```

## Deployments

### Rolling Update

**Default**: Replace tasks gradually

**Configuration**:
```python
deploymentConfiguration={
    'maximumPercent': 200,  # Max 2× desired during deployment
    'minimumHealthyPercent': 100  # Keep 100% healthy during deployment
}

# Example: 4 tasks desired
# maximumPercent=200: Up to 8 tasks during deployment
# minimumHealthyPercent=100: Keep 4 healthy always

# Deployment:
# 1. Start 4 new tasks (total: 8)
# 2. Wait for new tasks healthy
# 3. Stop 4 old tasks (total: 4 new)
```

**Aggressive Update** (Faster):
```python
deploymentConfiguration={
    'maximumPercent': 200,
    'minimumHealthyPercent': 50
}

# Allows more aggressive replacement
# Stop half old tasks, start new tasks
```

**Conservative Update** (Safer):
```python
deploymentConfiguration={
    'maximumPercent': 100,
    'minimumHealthyPercent': 100
}

# One-by-one replacement
# Very slow, safest
```

### Blue/Green Deployment (CodeDeploy)

**Setup**:
```python
codedeploy = boto3.client('codedeploy')

# Create application
codedeploy.create_application(
    applicationName='my-ecs-app',
    computePlatform='ECS'
)

# Create deployment group
codedeploy.create_deployment_group(
    applicationName='my-ecs-app',
    deploymentGroupName='my-deployment-group',
    serviceRoleArn='arn:aws:iam::123456789012:role/CodeDeployServiceRole',
    deploymentConfigName='CodeDeployDefault.ECSAllAtOnce',  # Or Linear10PercentEvery3Minutes
    ecsServices=[
        {
            'serviceName': 'my-service',
            'clusterName': 'my-cluster'
        }
    ],
    loadBalancerInfo={
        'targetGroupPairInfoList': [
            {
                'targetGroups': [
                    {'name': 'my-tg-blue'},
                    {'name': 'my-tg-green'}
                ],
                'prodTrafficRoute': {
                    'listenerArns': ['arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/my-alb/xxx/yyy']
                }
            }
        ]
    },
    blueGreenDeploymentConfiguration={
        'terminateBlueInstancesOnDeploymentSuccess': {
            'action': 'TERMINATE',
            'terminationWaitTimeInMinutes': 5
        },
        'deploymentReadyOption': {
            'actionOnTimeout': 'CONTINUE_DEPLOYMENT'
        }
    }
)
```

**Deployment Strategies**:
```
AllAtOnce: Immediate cutover
Linear10PercentEvery3Minutes: Gradual shift
Canary10Percent5Minutes: 10% canary, then all
```

### Circuit Breaker

**What**: Automatic rollback on deployment failures

**Configuration**:
```python
deploymentConfiguration={
    'deploymentCircuitBreaker': {
        'enable': True,
        'rollback': True
    }
}

# Monitors:
# - Task failures
# - Health check failures
# - If threshold exceeded: Rollback to previous version
```

## Monitoring

### CloudWatch Container Insights

**Enable**:
```python
ecs.update_cluster_settings(
    cluster='my-cluster',
    settings=[
        {
            'name': 'containerInsights',
            'value': 'enabled'
        }
    ]
)
```

**Metrics**:
- CPU utilization (task, container, cluster)
- Memory utilization (task, container, cluster)
- Network (bytes in/out)
- Disk I/O

**Dashboards**: Automatic CloudWatch dashboards

**Cost**: $0.50 per monitored resource/month

### Task Metadata Endpoint

**V4 Endpoint** (Fargate, EC2):
```python
import requests
import os

# Task metadata
task_metadata_url = os.environ['ECS_CONTAINER_METADATA_URI_V4'] + '/task'
response = requests.get(task_metadata_url)
task_metadata = response.json()

# Get task ARN, cluster, availability zone
task_arn = task_metadata['TaskARN']
cluster = task_metadata['Cluster']
az = task_metadata['AvailabilityZone']

# Container metadata
container_metadata_url = os.environ['ECS_CONTAINER_METADATA_URI_V4']
response = requests.get(container_metadata_url)
container_metadata = response.json()

# Get container ID, image, etc.
```

## Security

### Task IAM Roles

**Task Role** (for application):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/my-table"
    }
  ]
}
```

**Execution Role** (for ECS agent):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    }
  ]
}
```

### Secrets Management

**Secrets Manager**:
```json
{
  "secrets": [
    {
      "name": "DB_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-password-xxx"
    },
    {
      "name": "API_KEY",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-key-xxx:apikey::"
    }
  ]
}
```

**Systems Manager Parameter Store**:
```json
{
  "secrets": [
    {
      "name": "CONFIG",
      "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/my-app/config"
    }
  ]
}
```

## Exam Tips (SAP-C02)

### Key Decision Points

**Fargate vs EC2**:
```
Variable workloads → Fargate
Sustained workloads → EC2 (cheaper)
No ops overhead → Fargate
Need GPU/special instance → EC2
```

**Cluster Mode**:
```
Disabled: Traditional (1 primary + replicas)
Enabled: Sharded (horizontal scaling, >350 GB)
```

**Auto Scaling**:
```
CPU/Memory → Target tracking
Custom metrics → Step scaling
Predictable patterns → Scheduled scaling
```

### Common Scenarios

**"Deploy microservices"**:
- ECS Fargate
- Service discovery (Cloud Map)
- ALB for routing

**"Batch processing"**:
- ECS EC2 or Fargate
- Run task (not service)
- EventBridge schedule

**"Cost optimization"**:
- Fargate Spot (70% discount)
- EC2 Reserved Instances
- Graviton instances

**"High availability"**:
- Multi-AZ deployment
- Service with desired count >1
- ALB with health checks

This comprehensive ECS guide covers all aspects for SAP-C02 exam success.
