# Amazon EFS (Elastic File System)

## What is EFS?

Amazon Elastic File System (EFS) is a fully managed, elastic, shared file system that can be mounted on multiple EC2 instances simultaneously. It automatically grows and shrinks as you add and remove files.

## Why Use EFS?

### Key Benefits
- **Elastic**: Automatically scales to petabytes
- **Shared Access**: Thousands of concurrent connections
- **High Availability**: Multi-AZ by default
- **Performance**: Up to 10 GB/sec throughput
- **Compatibility**: NFS v4.1 and v4.0
- **Fully Managed**: No capacity planning
- **Cost-Effective**: Pay for what you use

### Use Cases
- Content management systems (WordPress, Drupal)
- Web serving and content delivery
- Container storage (ECS, EKS)
- Big data analytics
- Machine learning training data
- Home directories
- Application migrations (lift-and-shift)

## Core Concepts

### Storage Classes

**Standard**:
- Frequently accessed data
- Multi-AZ durability
- $0.30 per GB-month

**Infrequent Access (IA)**:
- Infrequently accessed data
- Multi-AZ durability
- $0.025 per GB-month storage
- $0.01 per GB retrieval

**One Zone**:
- Frequently accessed, single AZ
- Lower durability
- $0.16 per GB-month

**One Zone-IA**:
- Infrequent access, single AZ
- $0.0133 per GB-month storage
- $0.01 per GB retrieval

### Performance Modes

**General Purpose** (default):
- Latency: <1ms per operation
- Max throughput: 7,000+ file ops/sec
- Use: Most workloads

**Max I/O**:
- Latency: Low-double-digit ms
- Throughput: 500,000+ file ops/sec
- Use: Big data, media processing

**Cannot change** after creation

### Throughput Modes

**Bursting** (default):
- Throughput scales with file system size
- Baseline: 50 MB/s per TB
- Burst: Up to 100 MB/s per TB
- Burst credits accumulate when below baseline
- Good for: Variable workloads

**Provisioned**:
- Set throughput independent of size
- Up to 1,024 MB/s
- Pay extra: $6.00 per MB/s-month
- Good for: Consistent high throughput needs

**Elastic** (recommended):
- Automatic scaling up to 3 GB/s read, 1 GB/s write
- No burst credits
- Pay per GB transferred
- Good for: Unpredictable workloads

## Creating EFS File System

```python
import boto3

efs = boto3.client('efs')

# Create file system
fs = efs.create_file_system(
    CreationToken='my-efs-token',
    PerformanceMode='generalPurpose',  # or 'maxIO'
    ThroughputMode='elastic',  # or 'bursting', 'provisioned'
    Encrypted=True,
    KmsKeyId='arn:aws:kms:us-east-1:123456789012:key/...',
    Tags=[
        {'Key': 'Name', 'Value': 'my-efs'},
        {'Key': 'Environment', 'Value': 'Production'}
    ],
    AvailabilityZoneName='us-east-1a',  # For One Zone
    BackupPolicy='ENABLED'
)

file_system_id = fs['FileSystemId']
```

**Wait for Available**:
```python
import time

while True:
    response = efs.describe_file_systems(FileSystemId=file_system_id)
    state = response['FileSystems'][0]['LifeCycleState']
    if state == 'available':
        break
    print(f"File system state: {state}")
    time.sleep(5)
```

## Mount Targets

**Concept**: Network interfaces in VPC subnets for mounting

**Create Mount Target** (one per AZ):
```python
# AZ 1
mt1 = efs.create_mount_target(
    FileSystemId=file_system_id,
    SubnetId='subnet-12345',  # Private subnet in AZ 1
    SecurityGroups=['sg-efs']
)

# AZ 2
mt2 = efs.create_mount_target(
    FileSystemId=file_system_id,
    SubnetId='subnet-67890',  # Private subnet in AZ 2
    SecurityGroups=['sg-efs']
)
```

**Security Group** (allow NFS):
```python
ec2 = boto3.client('ec2')

sg = ec2.create_security_group(
    GroupName='efs-mount-target-sg',
    Description='Security group for EFS mount targets',
    VpcId='vpc-12345'
)

sg_id = sg['GroupId']

# Allow NFS from EC2 instances
ec2.authorize_security_group_ingress(
    GroupId=sg_id,
    IpPermissions=[
        {
            'IpProtocol': 'tcp',
            'FromPort': 2049,
            'ToPort': 2049,
            'UserIdGroupPairs': [
                {'GroupId': 'sg-ec2-instances'}  # EC2 security group
            ]
        }
    ]
)
```

## Mounting EFS

### On EC2 (Amazon Linux 2)

**Install EFS Utils**:
```bash
sudo yum install -y amazon-efs-utils
```

**Mount with EFS Helper** (recommended):
```bash
# Create mount point
sudo mkdir /mnt/efs

# Mount
sudo mount -t efs -o tls fs-12345678:/ /mnt/efs
```

**Mount with NFS**:
```bash
# Get DNS name
# fs-12345678.efs.us-east-1.amazonaws.com

sudo mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport fs-12345678.efs.us-east-1.amazonaws.com:/ /mnt/efs
```

**Automatic Mount** (/etc/fstab):
```bash
# Add to /etc/fstab
fs-12345678:/ /mnt/efs efs _netdev,tls,iam 0 0

# Mount all
sudo mount -a
```

**IAM Authorization**:
```bash
# Mount with IAM
sudo mount -t efs -o tls,iam fs-12345678:/ /mnt/efs
```

**EC2 IAM Role**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticfilesystem:ClientMount",
        "elasticfilesystem:ClientWrite"
      ],
      "Resource": "arn:aws:elasticfilesystem:us-east-1:123456789012:file-system/fs-12345678"
    }
  ]
}
```

### On ECS/Fargate

**Task Definition**:
```json
{
  "family": "my-task",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "nginx",
      "mountPoints": [
        {
          "sourceVolume": "efs-volume",
          "containerPath": "/usr/share/nginx/html",
          "readOnly": false
        }
      ]
    }
  ],
  "volumes": [
    {
      "name": "efs-volume",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-12345678",
        "rootDirectory": "/",
        "transitEncryption": "ENABLED",
        "authorizationConfig": {
          "iam": "ENABLED"
        }
      }
    }
  ]
}
```

### On EKS

**Install EFS CSI Driver** (see EKS guide)

**StorageClass**:
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: efs-sc
provisioner: efs.csi.aws.com
parameters:
  provisioningMode: efs-ap
  fileSystemId: fs-12345678
  directoryPerms: "700"
```

**PersistentVolume**:
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: efs-pv
spec:
  capacity:
    storage: 5Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: efs-sc
  csi:
    driver: efs.csi.aws.com
    volumeHandle: fs-12345678
```

**PersistentVolumeClaim**:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: efs-pvc
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: efs-sc
  resources:
    requests:
      storage: 5Gi
```

## Lifecycle Management

**Concept**: Automatically move files to IA after N days

**Enable**:
```python
efs.put_lifecycle_configuration(
    FileSystemId=file_system_id,
    LifecyclePolicies=[
        {
            'TransitionToIA': 'AFTER_30_DAYS'  # or 7, 14, 60, 90 days
        },
        {
            'TransitionToPrimaryStorageClass': 'AFTER_1_ACCESS'  # Move back on access
        }
    ]
)
```

**Cost Savings Example**:
```
File system: 1 TB
Access pattern: 20% frequently accessed, 80% infrequent

Without lifecycle:
  1000 GB × $0.30 = $300/month

With lifecycle (30-day policy):
  Frequent: 200 GB × $0.30 = $60
  Infrequent: 800 GB × $0.025 = $20
  Total: $80/month

Savings: $220/month (73%)
```

## Access Points

**Concept**: Application-specific entry points with enforced user/permissions

**Create**:
```python
ap = efs.create_access_point(
    FileSystemId=file_system_id,
    PosixUser={
        'Uid': 1000,
        'Gid': 1000,
        'SecondaryGids': [1001, 1002]
    },
    RootDirectory={
        'Path': '/app1',
        'CreationInfo': {
            'OwnerUid': 1000,
            'OwnerGid': 1000,
            'Permissions': '755'
        }
    },
    Tags=[
        {'Key': 'Application', 'Value': 'App1'}
    ]
)

access_point_id = ap['AccessPointId']
```

**Mount Access Point**:
```bash
sudo mount -t efs -o tls,accesspoint=fsap-12345678 fs-12345678:/ /mnt/app1
```

**Use Cases**:
- Multi-tenant applications (isolate tenants)
- Enforce permissions per application
- Simplify access control
- Lambda function access

## Encryption

### Encryption at Rest

**Enable** (at creation only):
```python
fs = efs.create_file_system(
    CreationToken='encrypted-efs',
    Encrypted=True,
    KmsKeyId='arn:aws:kms:us-east-1:123456789012:key/...'  # Optional, uses aws/elasticfilesystem by default
)
```

**Cannot enable after creation**

### Encryption in Transit

**Enable** (TLS):
```bash
sudo mount -t efs -o tls fs-12345678:/ /mnt/efs
```

**Enforce in Transit Encryption**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "elasticfilesystem:ClientMount",
      "Resource": "arn:aws:elasticfilesystem:us-east-1:123456789012:file-system/fs-12345678",
      "Condition": {
        "Bool": {
          "elasticfilesystem:Encrypted": "true"
        }
      }
    }
  ]
}
```

## Replication

**Concept**: Automatic, continuous replication to another region

**Create**:
```python
replication = efs.create_replication_configuration(
    SourceFileSystemId=file_system_id,
    Destinations=[
        {
            'Region': 'us-west-2',
            'FileSystemId': 'fs-87654321',  # Optional, creates new if not specified
            'AvailabilityZoneName': 'us-west-2a'  # For One Zone
        }
    ]
)
```

**Features**:
- RPO: 15 minutes typically
- One-way replication
- Continuous, automatic
- No performance impact
- Failover: Manual promotion

**Cost**:
- Replication data transfer: $0.02 per GB
- Destination storage: Standard rates

**Use Cases**:
- Disaster recovery
- Multi-region workloads
- Data migration

## Performance Optimization

### Throughput Calculation

**Bursting Mode**:
```
Baseline: 50 MB/s per TB of data stored
Burst: 100 MB/s per TB

Example (100 GB stored):
  Baseline: 100 GB × 50 MB/s / 1000 GB = 5 MB/s
  Burst: 100 GB × 100 MB/s / 1000 GB = 10 MB/s
  
Burst credits:
  Earn: When below baseline
  Spend: When above baseline
  Max: 2.1 TB of credits (can burst at 100 MB/s for 12 hours)
```

**Elastic Mode**:
```
Read: Up to 3 GB/s
Write: Up to 1 GB/s

Cost: $0.03 per GB read, $0.06 per GB written
```

**Provisioned Mode**:
```
Set throughput: 1-1,024 MB/s
Independent of file system size
Cost: $6.00 per MB/s-month

Example (100 MB/s provisioned):
  Cost: 100 × $6.00 = $600/month
```

### Best Practices

**1. Use General Purpose** unless:
- Need >7,000 file operations/sec
- Highly parallel workloads
- Big data analytics

**2. Parallel I/O**:
```bash
# Multiple threads
time dd if=/dev/zero of=/mnt/efs/file1 bs=1M count=1000 &
time dd if=/dev/zero of=/mnt/efs/file2 bs=1M count=1000 &
wait
```

**3. Large I/O Sizes**:
```bash
# Better: 1 MB blocks
dd if=/dev/zero of=/mnt/efs/testfile bs=1M count=1000

# Worse: 1 KB blocks
dd if=/dev/zero of=/mnt/efs/testfile bs=1K count=1000000
```

**4. Multiple Mount Targets**:
- One per AZ for high availability
- Reduces cross-AZ traffic
- Lower latency

## Monitoring

### CloudWatch Metrics

**File System Metrics**:
- `BurstCreditBalance`: Remaining burst credits (bursting mode)
- `PermittedThroughput`: Maximum throughput allowed
- `MeteredIOBytes`: Data transferred (for billing)
- `TotalIOBytes`: Total I/O
- `DataReadIOBytes`, `DataWriteIOBytes`
- `ClientConnections`: Number of connected clients

**Alarms**:
```python
cloudwatch = boto3.client('cloudwatch')

# Low burst credits
cloudwatch.put_metric_alarm(
    AlarmName='EFS-Low-Burst-Credits',
    MetricName='BurstCreditBalance',
    Namespace='AWS/EFS',
    Statistic='Average',
    Period=300,
    EvaluationPeriods=2,
    Threshold=100000000000,  # 100 GB in bytes
    ComparisonOperator='LessThanThreshold',
    Dimensions=[
        {'Name': 'FileSystemId', 'Value': file_system_id}
    ]
)

# High client connections
cloudwatch.put_metric_alarm(
    AlarmName='EFS-High-Connections',
    MetricName='ClientConnections',
    Namespace='AWS/EFS',
    Statistic='Sum',
    Period=60,
    EvaluationPeriods=1,
    Threshold=1000,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'FileSystemId', 'Value': file_system_id}
    ]
)
```

## Cost Optimization

### Storage Class Selection

**Standard** ($0.30/GB-month):
- Frequently accessed (>1/month)
- Low latency required

**IA** ($0.025/GB-month + $0.01/GB retrieval):
- Infrequently accessed
- Retrieval cost acceptable

**Break-even**:
```
IA becomes cheaper when access rate <27.5 times/month

Example (100 GB):
  Standard: 100 × $0.30 = $30/month
  
  IA with 10 retrievals:
    Storage: 100 × $0.025 = $2.50
    Retrievals: 100 × 10 × $0.01 = $10
    Total: $12.50/month (58% savings)
  
  IA with 30 retrievals:
    Storage: $2.50
    Retrievals: 100 × 30 × $0.01 = $30
    Total: $32.50/month (more expensive)
```

### One Zone vs Standard

**One Zone** ($0.16/GB-month):
- 47% cheaper
- Single AZ (lower durability)
- Use for: Non-critical data, dev/test

**Standard** ($0.30/GB-month):
- Multi-AZ
- Higher durability
- Use for: Production data

### Lifecycle Management

**Enable** for all file systems with infrequent access

### Elastic vs Provisioned Throughput

**Elastic**:
- Pay per GB transferred
- Read: $0.03/GB, Write: $0.06/GB
- Better for: Variable workloads

**Provisioned**:
- Pay per MB/s-month ($6.00)
- Better for: Consistent high throughput

**Comparison** (100 MB/s average):
```
Elastic:
  Daily: 100 MB/s × 86400s = 8.64 TB
  Read (50%): 4.32 TB × $0.03 = $129.60
  Write (50%): 4.32 TB × $0.06 = $259.20
  Monthly: ($129.60 + $259.20) × 30 = $11,664/month

Provisioned:
  100 MB/s × $6.00 = $600/month
  
Provisioned is 95% cheaper for consistent workloads!
```

## Real-World Scenarios

### Scenario 1: WordPress on ECS

**Architecture**: ECS Fargate + EFS + RDS

**Setup**:
- EFS for /wp-content (shared across containers)
- Standard storage class
- Elastic throughput
- Multi-AZ mount targets

**Cost** (50 GB, 5 GB transfers/day):
```
Storage: 50 GB × $0.30 = $15/month
Throughput: 
  Read: 2.5 GB × 30 × $0.03 = $2.25
  Write: 2.5 GB × 30 × $0.06 = $4.50
Total: $21.75/month
```

### Scenario 2: Machine Learning Training

**Architecture**: EKS + EFS + S3

**Setup**:
- EFS for training data (5 TB)
- Max I/O performance mode
- Provisioned throughput (500 MB/s)
- Standard storage class

**Cost**:
```
Storage: 5000 GB × $0.30 = $1,500/month
Throughput: 500 MB/s × $6.00 = $3,000/month
Total: $4,500/month
```

### Scenario 3: Home Directories (1000 users)

**Architecture**: EC2 + EFS + Active Directory

**Setup**:
- EFS for /home directories
- 30-day lifecycle policy to IA
- General Purpose mode
- Bursting throughput

**Cost** (1 TB total, 200 GB active, 800 GB inactive):
```
Storage:
  Standard: 200 GB × $0.30 = $60
  IA: 800 GB × $0.025 = $20
Throughput: Bursting (included)
Total: $80/month

vs without lifecycle:
  1000 GB × $0.30 = $300/month
Savings: $220/month (73%)
```

### Scenario 4: Big Data Analytics

**Architecture**: EMR + EFS

**Setup**:
- EFS for intermediate data (10 TB)
- Max I/O mode
- Elastic throughput
- One Zone (cost optimization)

**Cost** (10 TB storage, 100 TB throughput/month):
```
Storage: 10000 GB × $0.16 = $1,600/month
Throughput:
  Read: 50 TB × $0.03 = $1,500
  Write: 50 TB × $0.06 = $3,000
Total: $6,100/month
```

## Exam Tips (SAP-C02)

### Key Decision Points

**EFS vs EBS**:
```
Multiple EC2 instances → EFS
Single EC2 instance → EBS
Shared file system → EFS
Block storage → EBS
Linux only → EFS
Windows or Linux → EBS
```

**EFS vs S3**:
```
File system operations → EFS
Object storage → S3
POSIX permissions → EFS
HTTP access → S3
Lower cost archival → S3
Shared file access → EFS
```

**Performance Mode**:
```
General workloads → General Purpose
>7K ops/sec → Max I/O
Can accept latency → Max I/O
Low latency critical → General Purpose
```

**Throughput Mode**:
```
Variable workload → Elastic
Consistent high → Provisioned
Cost-sensitive → Bursting
Predictable → Provisioned
```

### Common Scenarios

**"Shared storage for containers"**:
- EFS with ECS/EKS
- Multi-AZ mount targets
- IAM authorization
- Encryption in transit

**"Lift-and-shift NFS workload"**:
- EFS with NFS v4.1
- Same AZ mount targets
- Security groups for access
- Lifecycle policies for cost

**"High availability web app"**:
- EFS for shared content
- Multi-AZ mount targets
- Auto Scaling group
- Standard storage class

**"Cost optimization"**:
- Lifecycle policies to IA
- One Zone for non-critical
- Monitor burst credits
- Right-size throughput mode

**"Disaster recovery"**:
- EFS Replication to another region
- Automated, continuous
- 15-minute RPO
- Manual failover

This comprehensive EFS guide covers file systems, performance modes, lifecycle management, and cost optimization for SAP-C02 mastery.
