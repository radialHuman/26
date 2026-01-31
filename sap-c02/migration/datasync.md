# AWS DataSync

## Table of Contents
1. [DataSync Fundamentals](#datasync-fundamentals)
2. [Supported Data Sources & Destinations](#supported-data-sources--destinations)
3. [DataSync Agents](#datasync-agents)
4. [Task Configuration & Scheduling](#task-configuration--scheduling)
5. [Bandwidth Management](#bandwidth-management)
6. [Data Verification & Integrity](#data-verification--integrity)
7. [Migration Patterns](#migration-patterns)
8. [DataSync vs Alternatives](#datasync-vs-alternatives)
9. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
10. [Best Practices](#best-practices)
11. [Interview Questions](#interview-questions)

---

## DataSync Fundamentals

### What is AWS DataSync?

**AWS DataSync** is a data transfer service that simplifies, automates, and accelerates moving data between on-premises storage and AWS storage services, or between AWS storage services.

**Core Capabilities**:
```
Data Transfer
├── Online transfer (network-based, not physical)
├── Automated sync (schedule-based or on-demand)
├── Incremental transfer (only changed files)
└── Parallel transfer (multi-threaded, 10× faster than open source)

Supported Protocols
├── NFS (Network File System, Linux/Unix)
├── SMB (Server Message Block, Windows)
├── HDFS (Hadoop Distributed File System)
├── Object storage (S3, compatible APIs)
└── Self-managed storage (file/object)

Destinations
├── Amazon S3 (all storage classes)
├── Amazon EFS (Elastic File System)
├── Amazon FSx for Windows File Server
├── Amazon FSx for Lustre
├── Amazon FSx for NetApp ONTAP
└── Amazon FSx for OpenZFS

Key Features
✅ Data verification (end-to-end integrity checks)
✅ Encryption (in-transit TLS, at-rest KMS)
✅ Bandwidth throttling (limit network impact)
✅ Filtering (include/exclude patterns)
✅ Task scheduling (cron/rate expressions)
✅ Incremental sync (only changed/new files)
```

### How DataSync Works

```
Architecture:

On-Premises                    AWS
┌─────────────────┐           ┌─────────────────┐
│ NFS/SMB Server  │           │   Amazon S3     │
│  /data/files    │           │   my-bucket/    │
└────────┬────────┘           └────────▲────────┘
         │                             │
         │                             │
┌────────▼────────┐           ┌────────┴────────┐
│ DataSync Agent  │──────────▶│ DataSync Service│
│  (VM/EC2)       │  TLS 1.2  │   (Managed)     │
│  10.0.1.50      │           │   Endpoints     │
└─────────────────┘           └─────────────────┘

Transfer Process:
1. Agent scans source (NFS/SMB share)
2. Compares with destination (S3/EFS)
3. Transfers only changed files (incremental)
4. Verifies data integrity (checksums)
5. Updates metadata (timestamps, permissions)

Network Requirements:
- Port 443 (HTTPS, agent → DataSync service)
- Port 80 (HTTP, activation only)
- NFS port 2049 or SMB port 445 (agent → source)
- AWS PrivateLink supported (private connectivity)
```

### Pricing

```
Data Transfer Pricing:
├── Per-GB copied: $0.0125/GB
└── Minimum charge: $0.0125 per file

Example Costs:
1. Initial Migration (100 TB):
   - 100,000 GB × $0.0125 = $1,250

2. Daily Incremental (1 TB/day):
   - 1,000 GB × $0.0125 = $12.50/day
   - 30 days = $375/month

3. Small Files (1 million files, 100 GB total):
   - 100 GB × $0.0125 = $1.25
   - 1M files × $0.0125 = $12,500
   - Total: $12,501.25 (file count matters!)

Cost Optimization:
✅ Archive small files before transfer
✅ Use filtering (exclude unnecessary files)
✅ Schedule during off-peak (bandwidth cheaper)
✅ Direct Connect (reduce data transfer costs)

vs Alternatives:
- AWS Snowball: $300 + shipping (>10 TB, offline)
- S3 Transfer Acceleration: $0.04/GB (single files)
- DataSync: $0.0125/GB (automated, scheduled)

Breakeven:
- DataSync cheaper for: Ongoing sync, incremental updates
- Snowball cheaper for: One-time >80 TB, no network bandwidth
```

---

## Supported Data Sources & Destinations

### Source Locations

**1. NFS (Network File System)**:
```bash
# Create NFS location
aws datasync create-location-nfs \
  --server-hostname nfs.example.com \
  --subdirectory /exports/data \
  --on-prem-config '{
    "AgentArns": ["arn:aws:datasync:us-east-1:123:agent/agent-abc123"]
  }'

# NFS version support: NFSv3, NFSv4.0, NFSv4.1
# Mount options: rsize, wsize, timeo, retrans
# Permissions: Preserve POSIX permissions
# Use case: Linux/Unix file servers
```

**2. SMB (Server Message Block)**:
```bash
# Create SMB location
aws datasync create-location-smb \
  --server-hostname smb.example.com \
  --subdirectory /share/data \
  --user "DOMAIN\username" \
  --password "password" \
  --agent-arns arn:aws:datasync:us-east-1:123:agent/agent-abc123 \
  --domain "DOMAIN.LOCAL"

# SMB version support: SMBv2, SMBv3
# Authentication: Domain or local accounts
# Permissions: Preserve Windows ACLs
# Use case: Windows file servers
```

**3. HDFS (Hadoop)**:
```bash
# Create HDFS location
aws datasync create-location-hdfs \
  --name-nodes '[
    {"Hostname": "namenode1.example.com", "Port": 8020},
    {"Hostname": "namenode2.example.com", "Port": 8020}
  ]' \
  --subdirectory /user/hadoop/data \
  --block-size 134217728 \
  --replication-factor 3 \
  --authentication-type SIMPLE \
  --agent-arns arn:aws:datasync:us-east-1:123:agent/agent-abc123

# Hadoop versions: 2.x, 3.x
# Authentication: SIMPLE, KERBEROS
# Use case: Migrate Hadoop data to S3/FSx for Lustre
```

**4. Self-Managed Object Storage**:
```bash
# Create object storage location (S3-compatible)
aws datasync create-location-object-storage \
  --server-hostname minio.example.com \
  --server-port 9000 \
  --server-protocol HTTPS \
  --subdirectory /bucket-name \
  --access-key "AKIAIOSFODNN7EXAMPLE" \
  --secret-key "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" \
  --agent-arns arn:aws:datasync:us-east-1:123:agent/agent-abc123

# Compatible with: MinIO, Ceph, Wasabi, Google Cloud Storage
# Protocol: HTTP or HTTPS
# Use case: Multi-cloud data migration
```

### Destination Locations

**1. Amazon S3**:
```bash
# Create S3 location
aws datasync create-location-s3 \
  --s3-bucket-arn arn:aws:s3:::my-datasync-bucket \
  --s3-storage-class INTELLIGENT_TIERING \
  --s3-config '{
    "BucketAccessRoleArn": "arn:aws:iam::123:role/DataSyncS3Role"
  }'

# Storage classes:
# - STANDARD (default)
# - INTELLIGENT_TIERING (automatic cost optimization)
# - STANDARD_IA (infrequent access)
# - ONE_ZONE_IA (single AZ)
# - GLACIER_INSTANT_RETRIEVAL (archive with instant access)
# - GLACIER_FLEXIBLE_RETRIEVAL (archive, 1-5 min retrieval)
# - GLACIER_DEEP_ARCHIVE (lowest cost, 12-hour retrieval)

# IAM role policy:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectTagging",
        "s3:PutObjectTagging",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-datasync-bucket",
        "arn:aws:s3:::my-datasync-bucket/*"
      ]
    }
  ]
}
```

**2. Amazon EFS**:
```bash
# Create EFS location
aws datasync create-location-efs \
  --efs-filesystem-arn arn:aws:elasticfilesystem:us-east-1:123:file-system/fs-abc123 \
  --ec2-config '{
    "SubnetArn": "arn:aws:ec2:us-east-1:123:subnet/subnet-abc123",
    "SecurityGroupArns": ["arn:aws:ec2:us-east-1:123:security-group/sg-abc123"]
  }' \
  --subdirectory /datasync-target

# EFS mount target required in subnet
# Security group: Allow NFS (port 2049) from DataSync
# Permissions: Preserve POSIX permissions
# Use case: File server migration to managed NFS
```

**3. FSx for Windows File Server**:
```bash
# Create FSx Windows location
aws datasync create-location-fsx-windows \
  --fsx-filesystem-arn arn:aws:fsx:us-east-1:123:file-system/fs-abc123 \
  --security-group-arns arn:aws:ec2:us-east-1:123:security-group/sg-abc123 \
  --user "Admin" \
  --password "password" \
  --domain "corp.example.com" \
  --subdirectory /share

# Active Directory integration required
# Preserve Windows ACLs
# Use case: Windows file server to managed SMB
```

**4. FSx for Lustre**:
```bash
# Create FSx Lustre location
aws datasync create-location-fsx-lustre \
  --fsx-filesystem-arn arn:aws:fsx:us-east-1:123:file-system/fs-abc123 \
  --security-group-arns arn:aws:ec2:us-east-1:123:security-group/sg-abc123

# High-performance computing (HPC)
# Linked to S3 bucket (automatic sync)
# Use case: HPC workloads, ML training data
```

### Cross-Region & Cross-Account

```bash
# Cross-region transfer (S3 to S3)
# Source: us-east-1
aws datasync create-location-s3 \
  --s3-bucket-arn arn:aws:s3:::source-bucket-us-east-1 \
  --s3-config '{"BucketAccessRoleArn": "arn:aws:iam::123:role/DataSyncRole"}' \
  --region us-east-1

# Destination: eu-west-1
aws datasync create-location-s3 \
  --s3-bucket-arn arn:aws:s3:::dest-bucket-eu-west-1 \
  --s3-config '{"BucketAccessRoleArn": "arn:aws:iam::123:role/DataSyncRole"}' \
  --region eu-west-1

# Cross-account transfer
# Account A (source): Grant DataSync role in Account B access
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::ACCOUNT_B:role/DataSyncRole"
    },
    "Action": ["s3:GetObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::source-bucket-account-a",
      "arn:aws:s3:::source-bucket-account-a/*"
    ]
  }]
}

# Account B (destination): Create task with cross-account source
```

---

## DataSync Agents

### Agent Deployment

**Agent Options**:
```
Deployment Types:
├── VMware ESXi (on-premises hypervisor)
├── Microsoft Hyper-V (on-premises hypervisor)
├── Linux KVM (on-premises hypervisor)
├── Amazon EC2 (cloud-based agent)
└── AWS Outposts (local AWS infrastructure)

Requirements:
├── vCPUs: 4 (minimum), 8 (recommended)
├── RAM: 32 GB (minimum), 64 GB (recommended for high throughput)
├── Disk: 80 GB (agent OS + cache)
└── Network: 1 Gbps (minimum), 10 Gbps (high performance)
```

**Deploy VMware Agent**:
```bash
# 1. Download OVA from AWS Console
# 2. Deploy in VMware ESXi
# 3. Configure network (static or DHCP)
# 4. Activate agent

# Activation (one-time, from workstation that can reach agent)
aws datasync create-agent \
  --agent-name "OnPrem-DataSync-Agent-1" \
  --activation-key "ACTIVATION_KEY_FROM_AGENT_CONSOLE"

# Get activation key by accessing:
# http://AGENT_IP/?gatewayType=SYNC&activationRegion=us-east-1

# Output:
{
  "AgentArn": "arn:aws:datasync:us-east-1:123456789012:agent/agent-abc123"
}
```

**Deploy EC2 Agent**:
```bash
# Launch from AWS Marketplace AMI
# "AWS DataSync Agent - AMI"

# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-datasync-agent-us-east-1 \
  --instance-type m5.xlarge \
  --key-name my-key \
  --security-group-ids sg-abc123 \
  --subnet-id subnet-abc123 \
  --iam-instance-profile Name=DataSyncAgentProfile

# Activate (agent in same VPC as source/destination)
aws datasync create-agent \
  --agent-name "EC2-DataSync-Agent" \
  --activation-key "KEY_FROM_EC2_INSTANCE"

# Use case:
# - S3 to EFS (same region, no on-prem)
# - FSx to S3 (no on-prem)
# - Testing without on-prem infrastructure
```

### Agent Networking

```
Network Configuration:

Agent must reach:
1. DataSync service endpoints (HTTPS port 443)
   - datasync.us-east-1.amazonaws.com
   - Via internet gateway or AWS PrivateLink

2. Source storage (NFS port 2049 or SMB port 445)
   - On-premises file server
   - Local network connectivity

3. Destination storage (depends on type)
   - S3: VPC endpoint or internet
   - EFS: NFS port 2049 in VPC
   - FSx: SMB/Lustre ports in VPC

Firewall Rules:
Agent → DataSync service:
- Outbound TCP 443 (HTTPS)
- Destination: datasync.region.amazonaws.com

Agent → Source storage:
- NFS: TCP/UDP 2049, 111 (portmapper)
- SMB: TCP 445, 139 (NetBIOS)
- HDFS: TCP 8020 (NameNode), 50010 (DataNode)

Agent → Destination (S3 via VPC endpoint):
- TCP 443 to S3 VPC endpoint

PrivateLink Configuration (no internet access):
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-abc123 \
  --service-name com.amazonaws.us-east-1.datasync \
  --route-table-ids rtb-abc123 \
  --subnet-ids subnet-abc123 \
  --security-group-ids sg-abc123

# Agent uses PrivateLink endpoint instead of public internet
# All traffic stays on AWS network
```

### Multi-Agent Setup

```
Use Cases for Multiple Agents:
1. High throughput (parallel transfers)
2. Network redundancy (failover)
3. Geographically distributed sources

Example: 4 Agents for 100 TB Migration

Agent 1: /data/folder1 (25 TB)
Agent 2: /data/folder2 (25 TB)
Agent 3: /data/folder3 (25 TB)
Agent 4: /data/folder4 (25 TB)

# Create 4 tasks (one per agent)
for i in {1..4}; do
  aws datasync create-task \
    --source-location-arn arn:aws:datasync:us-east-1:123:location/loc-folder$i \
    --destination-location-arn arn:aws:s3:::my-bucket/folder$i \
    --name "Migration-Task-$i"
done

# Run all tasks in parallel
for i in {1..4}; do
  aws datasync start-task-execution \
    --task-arn arn:aws:datasync:us-east-1:123:task/task-$i &
done

# Throughput:
# Single agent: ~10 Gbps (1.25 GB/s)
# 4 agents: ~40 Gbps (5 GB/s) aggregate
# 100 TB transfer time: 5.5 hours (vs 22 hours single agent)
```

---

## Task Configuration & Scheduling

### Create DataSync Task

```bash
# Complete task configuration
aws datasync create-task \
  --source-location-arn arn:aws:datasync:us-east-1:123:location/loc-abc123 \
  --destination-location-arn arn:aws:datasync:us-east-1:123:location/loc-def456 \
  --name "DailyBackupToS3" \
  --options '{
    "VerifyMode": "POINT_IN_TIME_CONSISTENT",
    "OverwriteMode": "ALWAYS",
    "Atime": "BEST_EFFORT",
    "Mtime": "PRESERVE",
    "Uid": "INT_VALUE",
    "Gid": "INT_VALUE",
    "PreserveDeletedFiles": "PRESERVE",
    "PreserveDevices": "NONE",
    "PosixPermissions": "PRESERVE",
    "BytesPerSecond": 104857600,
    "TaskQueueing": "ENABLED",
    "LogLevel": "TRANSFER",
    "TransferMode": "CHANGED"
  }' \
  --excludes '[
    {"FilterType": "SIMPLE_PATTERN", "Value": "*.tmp"},
    {"FilterType": "SIMPLE_PATTERN", "Value": ".snapshot"},
    {"FilterType": "SIMPLE_PATTERN", "Value": "/logs/*"}
  ]' \
  --schedule '{
    "ScheduleExpression": "cron(0 2 * * ? *)"
  }' \
  --cloud-watch-log-group-arn arn:aws:logs:us-east-1:123:log-group:/aws/datasync \
  --tags '[
    {"Key": "Environment", "Value": "Production"},
    {"Key": "Application", "Value": "FileBackup"}
  ]'
```

### Task Options Explained

```
VerifyMode:
├── POINT_IN_TIME_CONSISTENT (default)
│   - Verify checksums during transfer
│   - Detect changes made during transfer
│   - Re-transfer changed files
├── ONLY_FILES_TRANSFERRED
│   - Verify only transferred files (not all)
│   - Faster, less thorough
└── NONE
    - No verification
    - Fastest, not recommended

OverwriteMode:
├── ALWAYS (default)
│   - Overwrite destination files always
│   - Use for mirrors/backups
├── NEVER
│   - Skip files that exist at destination
│   - Use for one-time migration

TransferMode:
├── CHANGED (default, incremental)
│   - Transfer only changed/new files
│   - Compare metadata (size, mtime)
│   - Efficient for regular syncs
└── ALL
    - Transfer all files (full copy)
    - Use for initial migration

PreserveDeletedFiles:
├── PRESERVE (default)
│   - Keep files deleted from source
│   - Destination becomes superset
├── REMOVE
│   - Delete files not in source
│   - True mirror/replica

BytesPerSecond:
├── -1: Unlimited (default)
├── 104857600: 100 MB/s (bandwidth throttle)
└── 1048576: 1 MB/s (minimal impact)

LogLevel:
├── OFF: No logging
├── BASIC: Task start/end
├── TRANSFER: Per-file transfer logs
└── Use TRANSFER for troubleshooting
```

### Scheduling

**Cron Expressions**:
```bash
# Daily at 2 AM UTC
cron(0 2 * * ? *)

# Every 6 hours
cron(0 */6 * * ? *)

# Weekdays at 10 PM
cron(0 22 ? * MON-FRI *)

# First day of month at midnight
cron(0 0 1 * ? *)

# Every Sunday at 3 AM
cron(0 3 ? * SUN *)

# Rate-based (simpler)
rate(1 hour)   # Every hour
rate(12 hours) # Every 12 hours
rate(1 day)    # Daily
rate(7 days)   # Weekly

# Create scheduled task
aws datasync create-task \
  --source-location-arn arn:aws:datasync:us-east-1:123:location/loc-source \
  --destination-location-arn arn:aws:datasync:us-east-1:123:location/loc-dest \
  --schedule '{"ScheduleExpression": "rate(1 day)"}'

# Task runs automatically every day
# EventBridge rule created automatically
```

**On-Demand Execution**:
```bash
# Manual execution (override schedule)
aws datasync start-task-execution \
  --task-arn arn:aws:datasync:us-east-1:123:task/task-abc123 \
  --override-options '{
    "VerifyMode": "ONLY_FILES_TRANSFERRED",
    "BytesPerSecond": 524288000
  }'

# Output:
{
  "TaskExecutionArn": "arn:aws:datasync:us-east-1:123:task/task-abc123/execution/exec-xyz789"
}

# Check execution status
aws datasync describe-task-execution \
  --task-execution-arn arn:aws:datasync:us-east-1:123:task/task-abc123/execution/exec-xyz789

# Output:
{
  "Status": "TRANSFERRING",
  "BytesTransferred": 10737418240,  # 10 GB
  "FilesTransferred": 1024,
  "EstimatedFilesToTransfer": 10000,
  "EstimatedBytesToTransfer": 107374182400  # 100 GB
}
```

---

## Bandwidth Management

### Bandwidth Throttling

```
Purpose:
- Limit network impact during business hours
- Prevent saturating network links
- QoS integration for prioritized traffic

Configuration Levels:
├── Task-level: Applied to entire task
├── Time-based: Different limits by schedule
└── Dynamic: Adjust during execution

Example: Business Hours vs Off-Hours

Business Hours (8 AM - 6 PM): 100 MB/s (limit)
Off-Hours (6 PM - 8 AM): Unlimited

Implementation:
# Task 1: Business hours (limited)
aws datasync create-task \
  --source-location-arn arn:aws:datasync:us-east-1:123:location/loc-source \
  --destination-location-arn arn:aws:datasync:us-east-1:123:location/loc-dest \
  --options '{"BytesPerSecond": 104857600}' \
  --schedule '{"ScheduleExpression": "cron(0 8-17 ? * MON-FRI *)"}'

# Task 2: Off-hours (unlimited)
aws datasync create-task \
  --source-location-arn arn:aws:datasync:us-east-1:123:location/loc-source \
  --destination-location-arn arn:aws:datasync:us-east-1:123:location/loc-dest \
  --options '{"BytesPerSecond": -1}' \
  --schedule '{"ScheduleExpression": "cron(0 18-7 ? * * *)"}'

# Or use Lambda to dynamically adjust
```

**Dynamic Bandwidth Adjustment**:
```python
import boto3
from datetime import datetime

datasync = boto3.client('datasync')

def adjust_bandwidth(event, context):
    """
    Adjust DataSync bandwidth based on time of day
    Lambda triggered by EventBridge every hour
    """
    current_hour = datetime.now().hour
    
    # Business hours: 8 AM - 6 PM (limit to 100 MB/s)
    if 8 <= current_hour < 18:
        bandwidth_limit = 104857600  # 100 MB/s
    else:
        bandwidth_limit = -1  # Unlimited
    
    # Update running task execution
    task_execution_arn = event['task_execution_arn']
    
    try:
        datasync.update_task_execution(
            TaskExecutionArn=task_execution_arn,
            Options={
                'BytesPerSecond': bandwidth_limit
            }
        )
        print(f"Bandwidth adjusted to: {bandwidth_limit} bytes/sec")
    except Exception as e:
        print(f"Error: {e}")
```

### Network Optimization

```
Optimization Techniques:

1. Direct Connect (Dedicated Network):
   - Consistent bandwidth (1/10/100 Gbps)
   - Lower latency (5-15ms vs 50-100ms internet)
   - Cost: $0.02/GB vs $0.09/GB internet
   - Breakeven: >3 TB/month

2. VPN Compression:
   - Enable compression at VPN endpoints
   - 2-5× reduction for text files
   - Minimal CPU overhead

3. Multi-Agent Parallelism:
   - 1 agent: ~10 Gbps (1.25 GB/s)
   - 4 agents: ~40 Gbps (5 GB/s)
   - Linear scaling up to network capacity

4. Task Timing:
   - Schedule during low-traffic periods
   - Overnight/weekend transfers
   - Reduce business impact

Example: 500 TB Migration

Scenario 1: Internet (100 Mbps)
- Bandwidth: 12.5 MB/s
- Time: 500,000 GB ÷ 12.5 MB/s ≈ 463 days
- Cost: 500,000 GB × $0.0125 = $6,250 (DataSync)
        500,000 GB × $0.09 = $45,000 (internet egress)
- Total: $51,250

Scenario 2: Direct Connect (1 Gbps)
- Bandwidth: 125 MB/s
- Time: 500,000 GB ÷ 125 MB/s ≈ 46 days
- Cost: 500,000 GB × $0.0125 = $6,250 (DataSync)
        500,000 GB × $0.02 = $10,000 (DX transfer)
        $1,620/month × 2 months = $3,240 (DX port)
- Total: $19,490

Savings: $31,760 (63% cheaper) + 10× faster
```

---

## Data Verification & Integrity

### Verification Process

```
DataSync Verification Stages:

1. Pre-Transfer Comparison:
   - Compare source vs destination metadata
   - Size, modification time, checksum (optional)
   - Determine files to transfer

2. During Transfer:
   - Checksum calculation (source)
   - Encrypted transfer (TLS 1.2)
   - Checksum recalculation (destination)

3. Post-Transfer Verification:
   - Full checksum comparison
   - Identify mismatches
   - Re-transfer corrupted files

Checksum Algorithm:
- Default: CRC32C (Cyclic Redundancy Check)
- Fast, low CPU overhead
- Detects data corruption
```

**Verification Modes**:
```bash
# POINT_IN_TIME_CONSISTENT (strictest)
# - Verify all files
# - Detect changes during transfer
# - Re-transfer changed files
aws datasync create-task \
  --options '{"VerifyMode": "POINT_IN_TIME_CONSISTENT"}' \
  ...

# Scenario:
# T+0s: Start transfer (100 GB)
# T+30s: File1.txt modified at source (during transfer)
# T+60s: Transfer completes
# T+61s: Verification detects File1.txt mismatch
# T+62s: Re-transfer File1.txt
# Result: Destination guaranteed consistent with source at completion

# ONLY_FILES_TRANSFERRED (faster)
# - Verify only transferred files (skip unchanged)
aws datasync create-task \
  --options '{"VerifyMode": "ONLY_FILES_TRANSFERRED"}' \
  ...

# NONE (not recommended)
# - No verification
# - Fastest but no integrity guarantee
```

### Handling Verification Failures

```python
# Monitor verification failures
import boto3

datasync = boto3.client('datasync')
cloudwatch = boto3.client('cloudwatch')

def check_task_execution(task_execution_arn):
    """
    Check DataSync task for verification failures
    Alert if files failed verification
    """
    response = datasync.describe_task_execution(
        TaskExecutionArn=task_execution_arn
    )
    
    status = response['Status']
    
    if status == 'ERROR':
        result = response.get('Result', {})
        
        # Check verification failures
        verification_failed = result.get('ErrorCode') == 'VERIFICATION_FAILED'
        
        if verification_failed:
            files_failed = result.get('ErrorDetail', 'Unknown files failed')
            
            # Send CloudWatch metric
            cloudwatch.put_metric_data(
                Namespace='DataSync/Verification',
                MetricData=[{
                    'MetricName': 'VerificationFailures',
                    'Value': 1,
                    'Unit': 'Count'
                }]
            )
            
            # Alert via SNS
            sns = boto3.client('sns')
            sns.publish(
                TopicArn='arn:aws:sns:us-east-1:123:datasync-alerts',
                Subject='DataSync Verification Failed',
                Message=f'Task {task_execution_arn} failed verification.\nDetails: {files_failed}'
            )
    
    return status

# Retry failed files
if status == 'ERROR':
    # Re-run task with ONLY_FILES_TRANSFERRED
    datasync.start_task_execution(
        TaskArn=task_arn,
        OverrideOptions={
            'TransferMode': 'ALL',  # Re-transfer all
            'VerifyMode': 'POINT_IN_TIME_CONSISTENT'
        }
    )
```

### Encryption

```
In-Transit Encryption:
- TLS 1.2 (agent → DataSync service)
- All data encrypted over network
- Automatic (no configuration needed)

At-Rest Encryption:

S3 Destination:
aws datasync create-location-s3 \
  --s3-bucket-arn arn:aws:s3:::encrypted-bucket \
  --s3-config '{
    "BucketAccessRoleArn": "arn:aws:iam::123:role/DataSyncRole"
  }'

# S3 bucket encryption (server-side)
aws s3api put-bucket-encryption \
  --bucket encrypted-bucket \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "arn:aws:kms:us-east-1:123:key/abc-123"
      },
      "BucketKeyEnabled": true
    }]
  }'

# DataSync automatically encrypts with KMS key
# No additional configuration needed

EFS Destination (encryption at rest):
# EFS must be created with encryption enabled
aws efs create-file-system \
  --encrypted \
  --kms-key-id arn:aws:kms:us-east-1:123:key/abc-123

# DataSync respects EFS encryption automatically
```

---

## Migration Patterns

### Pattern 1: One-Time Migration (On-Prem to S3)

```
Scenario: 100 TB file server to S3

Architecture:
On-Premises File Server (NFS)
  ├─→ /data (100 TB, 10 million files)
  └─→ DataSync Agent (VMware)

AWS S3 Bucket
  └─→ s3://company-archive/data

Implementation:
# Step 1: Deploy agent
# (Download OVA, deploy in VMware, activate)

# Step 2: Create source location
aws datasync create-location-nfs \
  --server-hostname fileserver.company.local \
  --subdirectory /data \
  --on-prem-config '{
    "AgentArns": ["arn:aws:datasync:us-east-1:123:agent/agent-abc123"]
  }'

# Step 3: Create destination location
aws datasync create-location-s3 \
  --s3-bucket-arn arn:aws:s3:::company-archive \
  --s3-storage-class GLACIER_FLEXIBLE_RETRIEVAL \
  --s3-config '{
    "BucketAccessRoleArn": "arn:aws:iam::123:role/DataSyncS3Role"
  }'

# Step 4: Create task (one-time, all files)
aws datasync create-task \
  --source-location-arn arn:aws:datasync:us-east-1:123:location/loc-nfs \
  --destination-location-arn arn:aws:datasync:us-east-1:123:location/loc-s3 \
  --name "OnPremToS3Migration" \
  --options '{
    "VerifyMode": "POINT_IN_TIME_CONSISTENT",
    "TransferMode": "ALL",
    "PreserveDeletedFiles": "PRESERVE",
    "BytesPerSecond": 1048576000
  }'

# Step 5: Execute task
aws datasync start-task-execution \
  --task-arn arn:aws:datasync:us-east-1:123:task/task-abc123

# Timeline:
# - Bandwidth: 1 Gbps (125 MB/s throttled for business hours)
# - Transfer time: 100,000 GB ÷ 125 MB/s ≈ 9.25 days
# - Verification: +2 days (checksum all files)
# - Total: ~12 days

# Step 6: Cutover validation
# - Compare file counts (source vs S3)
# - Spot-check critical files
# - Run read-only test application

# Step 7: Decommission on-prem (after validation period)
```

### Pattern 2: Continuous Sync (Hybrid Cloud)

```
Scenario: Active file server with daily sync to S3

Architecture:
On-Premises File Server (SMB)
  ├─→ /shares/projects (10 TB, daily changes 100 GB)
  └─→ DataSync Agent (Hyper-V)

AWS S3 Bucket
  └─→ s3://company-backup/projects

Implementation:
# Daily incremental backup at 2 AM
aws datasync create-task \
  --source-location-arn arn:aws:datasync:us-east-1:123:location/loc-smb \
  --destination-location-arn arn:aws:datasync:us-east-1:123:location/loc-s3 \
  --name "DailyProjectBackup" \
  --options '{
    "VerifyMode": "POINT_IN_TIME_CONSISTENT",
    "TransferMode": "CHANGED",
    "OverwriteMode": "ALWAYS",
    "PreserveDeletedFiles": "PRESERVE",
    "BytesPerSecond": -1
  }' \
  --schedule '{
    "ScheduleExpression": "cron(0 2 * * ? *)"
  }'

# Daily sync behavior:
Day 1: 10 TB initial (full copy)
Day 2: 100 GB changed files (incremental)
Day 3: 100 GB changed files
...

# Cost:
# Day 1: 10,000 GB × $0.0125 = $125
# Day 2-30: 100 GB/day × 30 days × $0.0125 = $37.50
# Month 1 total: $162.50
# Month 2+ (incremental only): $37.50/month

# S3 storage cost:
# 10 TB × $0.023/GB-month = $230/month (S3 Standard)
# Or: 10 TB × $0.004/GB-month = $40/month (Glacier Flexible)

# Retention policy (S3 Lifecycle):
aws s3api put-bucket-lifecycle-configuration \
  --bucket company-backup \
  --lifecycle-configuration '{
    "Rules": [{
      "Id": "MoveToGlacier",
      "Status": "Enabled",
      "Transitions": [{
        "Days": 30,
        "StorageClass": "GLACIER_FLEXIBLE_RETRIEVAL"
      }],
      "NoncurrentVersionTransitions": [{
        "NoncurrentDays": 7,
        "StorageClass": "GLACIER_FLEXIBLE_RETRIEVAL"
      }]
    }]
  }'

# Result:
# - Current files: S3 Standard (fast access)
# - 30+ day files: Glacier (archived, cheaper)
```

### Pattern 3: Multi-Region Replication

```
Scenario: Replicate S3 bucket across regions for DR

Architecture:
S3 Bucket (us-east-1)
  └─→ s3://prod-data-us-east-1 (50 TB)

S3 Bucket (eu-west-1)
  └─→ s3://prod-data-eu-west-1 (replica)

Implementation:
# Create EC2-based agent in us-east-1 (no on-prem)
aws ec2 run-instances \
  --image-id ami-datasync-agent \
  --instance-type m5.2xlarge \
  --subnet-id subnet-us-east-1

# Create task (S3 to S3 cross-region)
aws datasync create-task \
  --source-location-arn arn:aws:datasync:us-east-1:123:location/loc-s3-source \
  --destination-location-arn arn:aws:datasync:eu-west-1:123:location/loc-s3-dest \
  --name "CrossRegionReplication" \
  --options '{
    "VerifyMode": "ONLY_FILES_TRANSFERRED",
    "TransferMode": "CHANGED",
    "BytesPerSecond": -1
  }' \
  --schedule '{
    "ScheduleExpression": "rate(6 hours)"
  }'

# vs S3 Replication:
# S3 Replication: Real-time, $0.02/GB
# DataSync: Scheduled (6 hours RPO), $0.0125/GB + cross-region transfer
# Use S3 Replication for real-time, DataSync for scheduled/cost-optimized
```

### Pattern 4: Migrate to EFS (NFS to Managed NFS)

```
Scenario: Migrate Linux file server to Amazon EFS

Architecture:
On-Premises NFS Server
  ├─→ /exports/home (5 TB, user home directories)
  └─→ DataSync Agent

Amazon EFS
  └─→ fs-abc123.efs.us-east-1.amazonaws.com:/

Implementation:
# Step 1: Create EFS file system
aws efs create-file-system \
  --performance-mode generalPurpose \
  --throughput-mode elastic \
  --encrypted \
  --tags Key=Name,Value=UserHomeDirs

# Step 2: Create mount target in VPC
aws efs create-mount-target \
  --file-system-id fs-abc123 \
  --subnet-id subnet-abc123 \
  --security-groups sg-abc123

# Step 3: Create DataSync task
aws datasync create-task \
  --source-location-arn arn:aws:datasync:us-east-1:123:location/loc-nfs-onprem \
  --destination-location-arn arn:aws:datasync:us-east-1:123:location/loc-efs \
  --name "MigrateToEFS" \
  --options '{
    "VerifyMode": "POINT_IN_TIME_CONSISTENT",
    "TransferMode": "ALL",
    "PosixPermissions": "PRESERVE",
    "Uid": "INT_VALUE",
    "Gid": "INT_VALUE",
    "Atime": "BEST_EFFORT",
    "Mtime": "PRESERVE"
  }'

# Step 4: Execute migration
aws datasync start-task-execution \
  --task-arn arn:aws:datasync:us-east-1:123:task/task-abc123

# Step 5: Cutover
# - Mount EFS on Linux instances
# - Update /etc/fstab
# - Test user access
# - Decommission on-prem NFS

# EFS mount on Linux:
sudo mount -t nfs4 -o nfsvers=4.1 \
  fs-abc123.efs.us-east-1.amazonaws.com:/ /mnt/efs

# Permanent mount (/etc/fstab):
fs-abc123.efs.us-east-1.amazonaws.com:/ /mnt/efs nfs4 defaults,_netdev 0 0

# Benefits:
# ✅ Managed service (no NFS server maintenance)
# ✅ Elastic capacity (no provisioning)
# ✅ Multi-AZ (automatic replication)
# ✅ Backup integration (AWS Backup)
```

---

## DataSync vs Alternatives

### Comparison Matrix

```
Service              Use Case                   Speed           Cost
--------------------------------------------------------------------------------
DataSync             Automated sync             10× faster      $0.0125/GB
                     Incremental backups        (vs rsync)
                     NFS/SMB to AWS

Snowball Edge        >10 TB offline             80 TB device    $300 + shipping
                     No network bandwidth       10 days ship
                     Physical transfer

S3 Transfer Accel    Single large files         3-5× faster     $0.04/GB
                     Global uploads             (vs direct)
                     Direct to S3 only

AWS DMS              Database migration         Schema convert  $0.30/hour (inst)
                     Homogeneous/hetero         CDC replication + data transfer
                     Minimal downtime

Storage Gateway      Hybrid cloud cache         Local cache     $0.01/GB cached
                     On-prem + cloud            iSCSI/NFS/SMB   + storage costs
                     Gradual migration

rsync/scp            Manual scripts             Slow            $0.09/GB egress
                     One-off transfers          No verification
                     Simple requirements
```

### DataSync vs Snowball

```
Decision Criteria:

Use DataSync when:
✅ Network bandwidth available (>100 Mbps)
✅ Ongoing sync required (not one-time)
✅ <80 TB transfer (Snowball breakeven)
✅ Time-flexible (days/weeks acceptable)
✅ Automated schedule needed

Use Snowball when:
✅ No network (airgapped, limited bandwidth)
✅ >80 TB one-time transfer
✅ Faster than network (10-day ship + upload)
✅ Physical security required (encrypted device)

Breakeven Calculation:

Scenario: 100 TB migration, 1 Gbps network

DataSync:
- Transfer time: 100,000 GB ÷ 125 MB/s ≈ 9.25 days
- Cost: 100,000 GB × $0.0125 = $1,250
- Total: 9.25 days, $1,250

Snowball Edge (80 TB device, need 2):
- Device 1: 80 TB
- Device 2: 20 TB
- Ship time: 2 days each way × 2 = 8 days
- Upload time: 3 days (on-prem to device)
- Ingest time: 1 day (AWS to S3)
- Cost: $300 × 2 = $600
- Total: 12 days (4 days shipping + 3 days upload + 1 day ingest), $600

Winner: DataSync (faster, but higher cost)

Scenario: 100 TB migration, 100 Mbps network

DataSync:
- Transfer time: 100,000 GB ÷ 12.5 MB/s ≈ 92.5 days
- Cost: $1,250

Snowball:
- Total: 12 days, $600

Winner: Snowball (8× faster, 50% cheaper)

Breakeven:
- <80 TB + good network (>500 Mbps) → DataSync
- >80 TB or limited network (<500 Mbps) → Snowball
```

### DataSync vs Storage Gateway

```
Storage Gateway:
- Hybrid cloud storage (on-prem cache + cloud storage)
- Real-time access (users access gateway, gateway syncs to S3)
- Use cases: Active file shares, backup, DR

DataSync:
- Scheduled data transfer (batch sync)
- Migration focus (move data to cloud)
- Use cases: Data migration, scheduled backups

Combined Use:
Phase 1: DataSync (initial migration)
- Migrate 50 TB historical data to S3

Phase 2: Storage Gateway (ongoing access)
- Deploy File Gateway for user access
- Users access gateway (local cache)
- Gateway syncs changes to S3

Example:
# DataSync: Migrate historical data
aws datasync create-task \
  --source-location-arn arn:aws:datasync:us-east-1:123:location/loc-nfs \
  --destination-location-arn arn:aws:datasync:us-east-1:123:location/loc-s3-archive

# Storage Gateway: Active file share
aws storagegateway create-nfs-file-share \
  --gateway-arn arn:aws:storagegateway:us-east-1:123:gateway/sgw-abc123 \
  --location-arn arn:aws:s3:::active-files \
  --role arn:aws:iam::123:role/StorageGatewayRole
```

---

## Monitoring & Troubleshooting

### CloudWatch Metrics

```bash
# Key metrics
aws cloudwatch list-metrics \
  --namespace AWS/DataSync

Metrics:
├── BytesTransferred: Total bytes copied
├── BytesVerified: Bytes verified
├── BytesWritten: Bytes written to destination
├── FilesTransferred: Number of files copied
├── FilesPrepared: Files scanned for transfer
└── FilesFailed: Files that failed transfer

# Get transfer progress
aws cloudwatch get-metric-statistics \
  --namespace AWS/DataSync \
  --metric-name BytesTransferred \
  --dimensions Name=TaskId,Value=task-abc123 Name=TaskExecutionId,Value=exec-xyz789 \
  --start-time 2026-01-31T00:00:00Z \
  --end-time 2026-01-31T23:59:59Z \
  --period 300 \
  --statistics Sum

# Create alarm for failed files
aws cloudwatch put-metric-alarm \
  --alarm-name "DataSync-Failed-Files" \
  --alarm-description "Alert when files fail to transfer" \
  --metric-name FilesFailed \
  --namespace AWS/DataSync \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=TaskId,Value=task-abc123 \
  --alarm-actions arn:aws:sns:us-east-1:123:datasync-alerts
```

### Task Execution Status

```python
import boto3
from datetime import datetime, timedelta

datasync = boto3.client('datasync')

def monitor_task_execution(task_arn):
    """
    Monitor DataSync task execution
    Calculate transfer speed, ETA, success rate
    """
    # List recent executions
    response = datasync.list_task_executions(
        TaskArn=task_arn,
        MaxResults=10
    )
    
    for execution in response['TaskExecutions']:
        exec_arn = execution['TaskExecutionArn']
        
        # Get detailed status
        details = datasync.describe_task_execution(
            TaskExecutionArn=exec_arn
        )
        
        status = details['Status']
        
        if status == 'TRANSFERRING':
            # Calculate progress
            bytes_transferred = details.get('BytesTransferred', 0)
            bytes_total = details.get('EstimatedBytesToTransfer', 0)
            
            if bytes_total > 0:
                progress = (bytes_transferred / bytes_total) * 100
            else:
                progress = 0
            
            # Calculate transfer speed
            start_time = details['StartTime']
            now = datetime.now(start_time.tzinfo)
            elapsed = (now - start_time).total_seconds()
            
            if elapsed > 0:
                speed_mbps = (bytes_transferred / elapsed) / 1048576  # MB/s
            else:
                speed_mbps = 0
            
            # Calculate ETA
            bytes_remaining = bytes_total - bytes_transferred
            if speed_mbps > 0:
                eta_seconds = (bytes_remaining / 1048576) / speed_mbps
                eta = timedelta(seconds=eta_seconds)
            else:
                eta = "Unknown"
            
            print(f"Execution: {exec_arn}")
            print(f"Status: {status}")
            print(f"Progress: {progress:.2f}%")
            print(f"Transferred: {bytes_transferred / (1024**3):.2f} GB")
            print(f"Total: {bytes_total / (1024**3):.2f} GB")
            print(f"Speed: {speed_mbps:.2f} MB/s")
            print(f"ETA: {eta}")
            print("-" * 50)
        
        elif status == 'SUCCESS':
            # Get result details
            result = details.get('Result', {})
            
            total_duration = result.get('TotalDuration', 0) / 1000  # ms to seconds
            prep_duration = result.get('PrepareDuration', 0) / 1000
            transfer_duration = result.get('TransferDuration', 0) / 1000
            verify_duration = result.get('VerifyDuration', 0) / 1000
            
            files_transferred = result.get('FilesTransferred', 0)
            bytes_transferred = result.get('BytesTransferred', 0)
            
            print(f"Execution: {exec_arn}")
            print(f"Status: SUCCESS")
            print(f"Total Duration: {total_duration / 3600:.2f} hours")
            print(f"  - Prepare: {prep_duration / 60:.2f} minutes")
            print(f"  - Transfer: {transfer_duration / 3600:.2f} hours")
            print(f"  - Verify: {verify_duration / 60:.2f} minutes")
            print(f"Files: {files_transferred:,}")
            print(f"Data: {bytes_transferred / (1024**3):.2f} GB")
            print(f"Avg Speed: {(bytes_transferred / transfer_duration) / 1048576:.2f} MB/s")
            print("-" * 50)
        
        elif status == 'ERROR':
            # Get error details
            result = details.get('Result', {})
            error_code = result.get('ErrorCode', 'Unknown')
            error_detail = result.get('ErrorDetail', 'No details')
            
            print(f"Execution: {exec_arn}")
            print(f"Status: ERROR")
            print(f"Error Code: {error_code}")
            print(f"Error Detail: {error_detail}")
            print("-" * 50)

# Example usage
monitor_task_execution('arn:aws:datasync:us-east-1:123:task/task-abc123')
```

### Common Issues

**Issue 1: Slow Transfer Speed**:
```
Symptoms: Transfer speed <10 MB/s (expected >100 MB/s)

Causes:
1. Network bandwidth limited
2. Agent CPU/memory constrained
3. Small files (overhead per file)
4. Source storage slow (disk I/O)

Troubleshooting:
# Check agent resources
aws datasync describe-agent \
  --agent-arn arn:aws:datasync:us-east-1:123:agent/agent-abc123

# Look for:
# - High CPU utilization (>80%)
# - Low memory available (<10%)

# Check network bandwidth
# Run iperf3 from agent to AWS endpoint
iperf3 -c datasync.us-east-1.amazonaws.com -p 443

Solutions:
1. Upgrade agent (more vCPUs, RAM)
2. Use Direct Connect (higher bandwidth)
3. Deploy multiple agents (parallel transfers)
4. Increase BytesPerSecond limit (if throttled)
5. Transfer large files first (better throughput)
```

**Issue 2: Task Execution Fails**:
```
Error: "InternalServerException"

Causes:
- Temporary AWS service issue
- Network connectivity lost
- Source storage unreachable

Solution:
# Retry task execution
aws datasync start-task-execution \
  --task-arn arn:aws:datasync:us-east-1:123:task/task-abc123

# Enable detailed logging
aws datasync update-task \
  --task-arn arn:aws:datasync:us-east-1:123:task/task-abc123 \
  --cloud-watch-log-group-arn arn:aws:logs:us-east-1:123:log-group:/aws/datasync \
  --options '{"LogLevel": "TRANSFER"}'

# Check CloudWatch Logs for detailed errors
aws logs tail /aws/datasync/task-abc123 --follow
```

**Issue 3: Verification Failures**:
```
Error: "VerificationFailed"

Causes:
- File modified during transfer
- Data corruption (network/storage)
- Checksum mismatch

Solution:
# Re-run with stricter verification
aws datasync start-task-execution \
  --task-arn arn:aws:datasync:us-east-1:123:task/task-abc123 \
  --override-options '{
    "VerifyMode": "POINT_IN_TIME_CONSISTENT",
    "TransferMode": "ALL"
  }'

# If persistent, check source storage health
# Run disk checks (fsck, chkdsk)
```

---

## Best Practices

### Design

```
✅ Do:
- Deploy agents with sufficient resources (8 vCPUs, 64 GB RAM)
- Use Direct Connect for large transfers (>10 TB)
- Schedule tasks during off-peak hours
- Enable verification (POINT_IN_TIME_CONSISTENT)
- Use multiple agents for parallel transfers (>100 TB)
- Filter unnecessary files (exclude patterns)
- Monitor CloudWatch metrics and logs
- Test with small subset before full migration

❌ Don't:
- Undersize agent (4 vCPUs, 32 GB RAM insufficient for high throughput)
- Transfer during business hours (bandwidth impact)
- Skip verification (risk data corruption)
- Transfer everything (backup files, temp files, logs)
- Forget to test (verify small batch first)
```

### Security

```
✅ Strategies:
1. Use IAM roles (not access keys)
2. Enable encryption in-transit (TLS 1.2, automatic)
3. Enable encryption at-rest (KMS for S3/EFS)
4. Use VPC endpoints (PrivateLink, no internet)
5. Restrict agent network access (security groups)
6. Enable CloudTrail (audit all API calls)
7. Use S3 bucket policies (restrict access)

Example S3 bucket policy:
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DataSyncOnly",
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::123456789012:role/DataSyncS3Role"
    },
    "Action": [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ],
    "Resource": [
      "arn:aws:s3:::my-datasync-bucket",
      "arn:aws:s3:::my-datasync-bucket/*"
    ]
  }]
}
```

### Cost Optimization

```
Strategies:
1. Use filtering (exclude .tmp, .log, cache files)
2. Use incremental transfers (TransferMode: CHANGED)
3. Schedule during off-peak (bandwidth cheaper)
4. Right-size agent (don't over-provision)
5. Delete task after migration (no ongoing cost)
6. Use S3 Intelligent-Tiering (automatic cost optimization)
7. Archive to Glacier (long-term storage)

Example filter (exclude logs, temps):
aws datasync create-task \
  --excludes '[
    {"FilterType": "SIMPLE_PATTERN", "Value": "*.log"},
    {"FilterType": "SIMPLE_PATTERN", "Value": "*.tmp"},
    {"FilterType": "SIMPLE_PATTERN", "Value": "/temp/*"},
    {"FilterType": "SIMPLE_PATTERN", "Value": "/cache/*"},
    {"FilterType": "SIMPLE_PATTERN", "Value": ".snapshot"}
  ]'

# Result:
# Without filtering: 100 TB (includes 20 TB logs/temps)
# With filtering: 80 TB (20% reduction)
# Savings: 20,000 GB × $0.0125 = $250
```

---

## Interview Questions

### Q1: You need to migrate 150 TB of data from an on-premises NFS server to Amazon S3. The network has 1 Gbps bandwidth, and you want to minimize the migration time. Should you use DataSync, Snowball, or a combination? Explain your decision with calculations.

**Answer**:

**Scenario Analysis**:
```
Data: 150 TB
Network: 1 Gbps (125 MB/s theoretical)
Goal: Minimize migration time
```

**Option 1: DataSync Only**:
```
Network Assumptions:
- 1 Gbps link (125 MB/s theoretical)
- Realistic utilization: 70% (87.5 MB/s)
- Reason: Network overhead, other traffic, protocol inefficiency

DataSync Performance:
- Single agent: ~80-90 MB/s sustained
- 4 agents (parallel): ~320 MB/s (limited by 1 Gbps link = 125 MB/s)
- Actual: 87.5 MB/s (network-limited)

Transfer Time:
150 TB = 150,000 GB
150,000 GB ÷ 87.5 MB/s ÷ 86,400 seconds/day = 19.8 days

Cost:
- DataSync: 150,000 GB × $0.0125 = $1,875
- Network egress: 150,000 GB × $0.09 = $13,500
- Agent: Free (VMware VM)
- Total: $15,375

Timeline:
- Day 0: Deploy agent (1 day)
- Day 1-20: Transfer (19.8 days)
- Day 21: Verification (1 day)
- Total: ~22 days
```

**Option 2: Snowball Edge Only**:
```
Snowball Edge Capacity: 80 TB per device
Devices Needed: 150 TB ÷ 80 TB = 2 devices (80 TB + 70 TB)

Timeline (Sequential):
Device 1:
- Day 0-2: Ship to customer (2 days)
- Day 2-4: Copy 80 TB (2 days @ 500 MB/s local transfer)
- Day 4-6: Ship to AWS (2 days)
- Day 6-7: Ingest to S3 (1 day)

Device 2:
- Day 7-9: Ship to customer (2 days)
- Day 9-11: Copy 70 TB (1.5 days)
- Day 11-13: Ship to AWS (2 days)
- Day 13-14: Ingest to S3 (1 day)

Total: 14 days

Cost:
- Device 1: $300
- Device 2: $300
- Shipping: Included (round-trip)
- Total: $600

Pros:
✅ Faster (14 days vs 22 days)
✅ Much cheaper ($600 vs $15,375)
✅ No network bandwidth used

Cons:
❌ Physical device handling
❌ Security consideration (data on device)
❌ Coordination overhead (2 devices)
```

**Option 3: Hybrid Approach (Recommended)**:
```
Strategy:
1. Snowball for initial bulk (120 TB, 80%)
2. DataSync for final sync (30 TB, 20%)

Reasoning:
- Snowball: Fast bulk transfer
- DataSync: Incremental sync during Snowball shipping
- Minimize downtime (continuous sync)

Implementation:

Phase 1: Snowball for 120 TB
- Order 2 Snowball Edge devices (80 TB + 40 TB)
- Copy 120 TB "cold" data (historical, unchanging files)
- Ship back to AWS

Timeline:
- Day 0: Deploy DataSync agent (preparation)
- Day 0-2: Snowball 1 ships to customer
- Day 2-4: Copy 80 TB to Snowball 1
- Day 4-6: Snowball 1 ships to AWS, Snowball 2 ships to customer
- Day 6-8: Copy 40 TB to Snowball 2
- Day 8-10: Snowball 2 ships to AWS, Snowball 1 ingested
- Day 10: Snowball 2 ingested

Phase 2: DataSync for 30 TB + incremental changes
- Day 0-10: Set up DataSync task (while Snowball in transit)
- Day 10: Snowball complete, start DataSync for remaining 30 TB
- Day 10-13: DataSync transfers 30 TB (3 days @ 87.5 MB/s)

# Incremental changes during migration:
# - Day 0-10: ~1 TB/day × 10 days = 10 TB new/changed files
# - Day 13-14: Final incremental sync (10 TB)
# Total DataSync: 30 TB + 10 TB = 40 TB

Total Timeline: 14 days
- Snowball: 10 days (parallel with DataSync setup)
- DataSync initial: 3 days (30 TB remaining)
- DataSync incremental: 1 day (10 TB changes)

Cost:
- Snowball: $600 (2 devices)
- DataSync: 40,000 GB × $0.0125 = $500
- Network egress: 40,000 GB × $0.09 = $3,600
- Total: $4,700

Comparison:
                  Time      Cost      Network Impact
----------------------------------------------------------
DataSync Only     22 days   $15,375   High (150 TB)
Snowball Only     14 days   $600      None
Hybrid            14 days   $4,700    Low (40 TB)

Recommendation: Hybrid Approach
✅ Same speed as Snowball-only (14 days)
✅ Lower network impact than DataSync-only (40 TB vs 150 TB)
✅ Continuous sync (minimize cutover downtime)
✅ Incremental changes captured (not missed during Snowball)
✅ Reasonable cost ($4,700, middle ground)
```

**Implementation Plan**:
```bash
# Day 0: Deploy DataSync agent
# (Download OVA, deploy in VMware)

# Day 0: Create DataSync task (but don't run yet)
aws datasync create-task \
  --source-location-arn arn:aws:datasync:us-east-1:123:location/loc-nfs \
  --destination-location-arn arn:aws:datasync:us-east-1:123:location/loc-s3 \
  --name "IncrementalSync" \
  --options '{
    "TransferMode": "CHANGED",
    "VerifyMode": "POINT_IN_TIME_CONSISTENT"
  }'

# Day 0-10: Snowball transfer (120 TB cold data)
# - Filter: Older than 90 days (unchanging files)
# - Copy to Snowball devices
# - Ship to AWS

# Day 10: Snowball complete, start DataSync
aws datasync start-task-execution \
  --task-arn arn:aws:datasync:us-east-1:123:task/task-abc123

# DataSync transfers:
# - 30 TB remaining "hot" data (frequently accessed)
# - 10 TB incremental changes (during Snowball transit)

# Day 14: Cutover
# - Final DataSync sync (capture last-minute changes)
# - Switch applications to S3
# - Verify data integrity

# Post-cutover: Keep DataSync task for ongoing sync
aws datasync update-task \
  --task-arn arn:aws:datasync:us-east-1:123:task/task-abc123 \
  --schedule '{"ScheduleExpression": "rate(1 day)"}'

# Daily incremental backups (1 TB/day changes)
```

**Decision Tree**:
```
if data_size < 80 TB and network > 1 Gbps:
    use DataSync  # Fast enough, no physical device
elif data_size > 500 TB or network < 100 Mbps:
    use Snowball  # Network infeasible
elif need_continuous_sync:
    use Hybrid (Snowball bulk + DataSync incremental)
else:
    calculate_cost_time_tradeoff()
    # DataSync: Higher cost, uses network, no physical handling
    # Snowball: Lower cost, faster for >80 TB, physical device
```

### Q2: Design a DataSync solution for continuous synchronization between an on-premises Windows file server and Amazon FSx for Windows File Server. Include bandwidth management to limit impact during business hours.

**Answer**:

**Architecture**:
```
On-Premises                          AWS VPC
┌──────────────────────┐            ┌──────────────────────┐
│ Windows File Server  │            │ FSx for Windows      │
│ \\fileserver\shares  │            │ \\fsx-prod\shares    │
│ - SMBv3              │            │ - Multi-AZ           │
│ - Active Directory   │            │ - AD-integrated      │
│ - 20 TB data         │            │ - Auto backup        │
│ - 500 GB/day changes │            │ - Elastic capacity   │
└──────────┬───────────┘            └──────────▲───────────┘
           │                                   │
           │                                   │
┌──────────▼───────────┐            ┌──────────┴───────────┐
│ DataSync Agent       │───────────▶│ DataSync Service     │
│ - Hyper-V VM         │  TLS 1.2   │ - VPC Endpoints      │
│ - 8 vCPUs, 64 GB RAM │            │ - Bandwidth control  │
│ - Access to AD       │            │ - Scheduled tasks    │
└──────────────────────┘            └──────────────────────┘

Business Requirements:
- Business hours: 8 AM - 6 PM (100 MB/s limit, minimal impact)
- Off-hours: 6 PM - 8 AM (unlimited, maximum throughput)
- Continuous sync (capture changes within hours)
- Preserve Windows ACLs (permissions)
- Active Directory integration
```

**Implementation**:

**Step 1: Deploy FSx for Windows**:
```bash
# Create FSx file system with AD integration
aws fsx create-file-system \
  --file-system-type WINDOWS \
  --storage-capacity 32768 \
  --subnet-ids subnet-abc123 subnet-def456 \
  --security-group-ids sg-abc123 \
  --windows-configuration '{
    "ActiveDirectoryId": "d-abc123",
    "ThroughputCapacity": 1024,
    "DeploymentType": "MULTI_AZ_1",
    "AutomaticBackupRetentionDays": 7,
    "DailyAutomaticBackupStartTime": "03:00",
    "WeeklyMaintenanceStartTime": "7:03:00"
  }' \
  --tags Key=Name,Value=fsx-prod

# Output:
{
  "FileSystem": {
    "FileSystemId": "fs-0abc123def456",
    "DNSName": "fs-0abc123def456.corp.example.com",
    "StorageCapacity": 32768,  # 32 TB
    "WindowsConfiguration": {
      "ThroughputCapacity": 1024  # MB/s
    }
  }
}

# Mount on Windows instances (domain-joined):
# net use Z: \\fs-0abc123def456.corp.example.com\share
```

**Step 2: Deploy DataSync Agent** (Hyper-V on-premises):
```powershell
# Download DataSync Agent VHD
# Import to Hyper-V
# Configure network (static IP or DHCP)

# Activate agent (from workstation that can reach agent)
aws datasync create-agent `
  --agent-name "OnPrem-DataSync-Agent" `
  --activation-key "ACTIVATION_KEY" `
  --region us-east-1

# Output:
{
  "AgentArn": "arn:aws:datasync:us-east-1:123:agent/agent-abc123"
}
```

**Step 3: Create Source Location** (SMB):
```bash
# On-premises SMB share
aws datasync create-location-smb \
  --server-hostname fileserver.corp.example.com \
  --subdirectory /shares \
  --user "CORP\datasync-svc" \
  --password "SecurePassword123!" \
  --agent-arns arn:aws:datasync:us-east-1:123:agent/agent-abc123 \
  --domain "CORP.EXAMPLE.COM"

# Service account permissions:
# - Read access to all shares
# - List directory contents
# - Read attributes
# - Read permissions (to preserve ACLs)
```

**Step 4: Create Destination Location** (FSx):
```bash
# FSx for Windows File Server
aws datasync create-location-fsx-windows \
  --fsx-filesystem-arn arn:aws:fsx:us-east-1:123:file-system/fs-0abc123def456 \
  --security-group-arns arn:aws:ec2:us-east-1:123:security-group/sg-abc123 \
  --user "CORP\datasync-svc" \
  --password "SecurePassword123!" \
  --domain "CORP.EXAMPLE.COM" \
  --subdirectory /shares

# Security group (sg-abc123):
# - Inbound: SMB (TCP 445) from DataSync agent subnet
# - Inbound: AD ports (TCP/UDP 389, 636, 88) from AD controllers
```

**Step 5: Create Tasks with Bandwidth Management**:

**Task 1: Business Hours (Limited Bandwidth)**:
```bash
# 8 AM - 6 PM: 100 MB/s limit (minimal impact)
aws datasync create-task \
  --source-location-arn arn:aws:datasync:us-east-1:123:location/loc-smb-source \
  --destination-location-arn arn:aws:datasync:us-east-1:123:location/loc-fsx-dest \
  --name "BusinessHoursSync" \
  --options '{
    "VerifyMode": "POINT_IN_TIME_CONSISTENT",
    "TransferMode": "CHANGED",
    "OverwriteMode": "ALWAYS",
    "PreserveDeletedFiles": "PRESERVE",
    "BytesPerSecond": 104857600,
    "Atime": "BEST_EFFORT",
    "Mtime": "PRESERVE",
    "Uid": "NONE",
    "Gid": "NONE",
    "SecurityDescriptorCopyFlags": "OWNER_DACL_SACL",
    "LogLevel": "TRANSFER"
  }' \
  --schedule '{
    "ScheduleExpression": "cron(0 8-17 ? * MON-FRI *)"
  }' \
  --cloud-watch-log-group-arn arn:aws:logs:us-east-1:123:log-group:/aws/datasync/business-hours

# Runs: Every hour from 8 AM to 5 PM, Monday-Friday
# Bandwidth: 100 MB/s (104857600 bytes/sec)
# Result: ~360 GB/hour max, minimal network impact
```

**Task 2: Off-Hours (Unlimited Bandwidth)**:
```bash
# 6 PM - 8 AM: Unlimited (maximum throughput)
aws datasync create-task \
  --source-location-arn arn:aws:datasync:us-east-1:123:location/loc-smb-source \
  --destination-location-arn arn:aws:datasync:us-east-1:123:location/loc-fsx-dest \
  --name "OffHoursSync" \
  --options '{
    "VerifyMode": "POINT_IN_TIME_CONSISTENT",
    "TransferMode": "CHANGED",
    "OverwriteMode": "ALWAYS",
    "PreserveDeletedFiles": "PRESERVE",
    "BytesPerSecond": -1,
    "SecurityDescriptorCopyFlags": "OWNER_DACL_SACL",
    "LogLevel": "TRANSFER"
  }' \
  --schedule '{
    "ScheduleExpression": "cron(0 18-7 * * ? *)"
  }' \
  --cloud-watch-log-group-arn arn:aws:logs:us-east-1:123:log-group:/aws/datasync/off-hours

# Runs: Every hour from 6 PM to 7 AM, every day
# Bandwidth: Unlimited (-1)
# Result: ~800 MB/s max (limited by FSx throughput 1024 MB/s)
```

**Step 6: ACL and Permission Preservation**:
```bash
# SecurityDescriptorCopyFlags options:
# - OWNER_DACL: Owner + Discretionary ACL (permissions)
# - OWNER_DACL_SACL: Owner + DACL + System ACL (audit)
# - NONE: Don't preserve (use default FSx permissions)

# Example ACL preservation:
Source (on-prem):
  File: \\fileserver\shares\finance\report.xlsx
  Owner: CORP\finance-admin
  DACL: 
    - CORP\finance-team (Read, Write)
    - CORP\managers (Read)

Destination (FSx):
  File: \\fsx-prod\shares\finance\report.xlsx
  Owner: CORP\finance-admin (preserved)
  DACL:
    - CORP\finance-team (Read, Write) (preserved)
    - CORP\managers (Read) (preserved)

# Active Directory integration required for ACL preservation
# FSx must be joined to same AD or trusted domain
```

**Step 7: Monitoring and Alerting**:
```python
import boto3
from datetime import datetime

cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')

def monitor_datasync_bandwidth(task_arn, max_bandwidth_mbps):
    """
    Monitor DataSync bandwidth usage
    Alert if exceeds threshold during business hours
    """
    current_hour = datetime.now().hour
    
    # Business hours: 8 AM - 6 PM
    is_business_hours = 8 <= current_hour < 18
    
    if is_business_hours:
        # Get current bandwidth
        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/DataSync',
            MetricName='BytesTransferred',
            Dimensions=[{'Name': 'TaskId', 'Value': task_arn.split('/')[-1]}],
            StartTime=datetime.now() - timedelta(minutes=5),
            EndTime=datetime.now(),
            Period=300,
            Statistics=['Sum']
        )
        
        if response['Datapoints']:
            bytes_transferred = response['Datapoints'][0]['Sum']
            bandwidth_mbps = (bytes_transferred / 300) / 1048576  # MB/s
            
            if bandwidth_mbps > max_bandwidth_mbps:
                # Alert: Bandwidth exceeded
                sns.publish(
                    TopicArn='arn:aws:sns:us-east-1:123:datasync-alerts',
                    Subject='DataSync Bandwidth Exceeded',
                    Message=f'Bandwidth: {bandwidth_mbps:.2f} MB/s exceeds limit {max_bandwidth_mbps} MB/s during business hours'
                )

# CloudWatch Dashboard
dashboard = {
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    ["AWS/DataSync", "BytesTransferred", {"stat": "Sum"}],
                    [".", "FilesTransferred", {"stat": "Sum"}]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "DataSync Transfer Metrics"
            }
        }
    ]
}

cloudwatch.put_dashboard(
    DashboardName='DataSync-Windows-Sync',
    DashboardBody=json.dumps(dashboard)
)
```

**Cutover and Migration**:
```
Phase 1: Initial Sync (Off-hours only)
- Week 1: Run off-hours task only (20 TB initial)
- Transfer time: 20,000 GB ÷ 800 MB/s ÷ 3600 s/hr ≈ 7 hours
- Schedule: Single execution at 6 PM Friday

Phase 2: Continuous Sync (Hybrid schedule)
- Week 2+: Enable both tasks
  - Business hours: Every hour (incremental)
  - Off-hours: Every hour (incremental)
- Daily changes: 500 GB/day
  - Business hours (10 hours): 100 MB/s × 10 hrs = 3.6 TB capacity
  - Off-hours (14 hours): 800 MB/s × 14 hrs = 40.3 TB capacity
  - Total capacity: 43.9 TB/day >> 500 GB/day (plenty of headroom)

Phase 3: Validation (Parallel run)
- Week 3: Users access both file servers
- Compare: File counts, permissions, access patterns
- Test: Application compatibility with FSx

Phase 4: Cutover
- Week 4: Switch users to FSx
- Update DFS namespace: \\corp.example.com\shares → \\fsx-prod\shares
- Keep DataSync running (backup to S3 via FSx S3 integration)
```

**Cost Analysis**:
```
DataSync:
- Daily sync: 500 GB × 30 days = 15,000 GB/month
- Cost: 15,000 GB × $0.0125 = $187.50/month

FSx for Windows:
- Storage: 32 TB × $0.13/GB-month = $4,160/month
- Throughput: 1024 MB/s included
- Backups: 32 TB × 7 days × $0.05/GB-month = $224/month

Total: $4,571.50/month

vs On-Premises:
- Windows Server licenses: $1,000/month
- Storage hardware: $500/month (amortized)
- Backup infrastructure: $300/month
- IT maintenance: $2,000/month (staff time)
- Total: $3,800/month

FSx slightly higher ($771.50/month) but:
✅ Managed service (no maintenance)
✅ Multi-AZ (automatic HA)
✅ Automatic backups
✅ Elastic capacity (no over-provisioning)
✅ AWS integration (S3, Lambda, etc.)
```

---

This comprehensive AWS DataSync guide covers all aspects needed for SAP-C02 certification with migration patterns, bandwidth management, data verification, and real-world hybrid cloud synchronization scenarios!
