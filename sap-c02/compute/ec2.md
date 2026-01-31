# Amazon EC2 (Elastic Compute Cloud)

## What is EC2?

Amazon EC2 is a web service that provides secure, resizable compute capacity in the cloud. It allows you to launch virtual servers (called instances) on-demand, paying only for what you use. Think of EC2 as renting computers in AWS data centers that you can configure and control remotely.

## Why Use EC2?

### Key Benefits
- **Complete Control**: Full root/admin access to instances
- **Flexibility**: Choose OS, instance type, network, storage
- **Scalability**: Scale up/down based on demand
- **Integration**: Works seamlessly with other AWS services
- **Pay-as-you-go**: Only pay for compute time used
- **Global Reach**: Deploy in multiple regions worldwide
- **Security**: VPC isolation, security groups, IAM integration

### Use Cases
- Web application hosting
- Batch processing
- High-performance computing (HPC)
- Machine learning training
- Gaming servers
- Development and test environments
- Disaster recovery
- Enterprise applications (SAP, Oracle, etc.)

## How EC2 Works

### Basic Workflow
1. **Choose AMI** (Amazon Machine Image): Pre-configured template with OS and software
2. **Select Instance Type**: CPU, memory, storage, and networking capacity
3. **Configure Instance**: Network, IAM role, monitoring, user data
4. **Add Storage**: EBS volumes, instance store
5. **Configure Security**: Security groups, key pairs
6. **Launch Instance**: Instance starts running
7. **Connect**: SSH (Linux) or RDP (Windows)

### Instance Lifecycle
```
Pending → Running → Stopping → Stopped → Terminating → Terminated
                ↓
           Rebooting
```

## EC2 Instance Types (Deep Dive)

### Instance Type Naming Convention
Example: `m5.2xlarge`
- **m**: Instance family (general purpose)
- **5**: Generation number
- **2xlarge**: Size (vCPU and memory)

### Instance Families

#### 1. **General Purpose (T, M, Mac)**
**T-series (T3, T3a, T4g)** - Burstable Performance
- **What**: CPU credits for baseline performance with burst capability
- **When**: Variable workloads, development, small databases
- **Cost**: $0.0104/hour (t3.micro) - $0.3328/hour (t3.2xlarge)
- **Example**: Small web server with occasional traffic spikes
```
Baseline: 20% CPU
Credits accumulate when below baseline
Burst: Up to 100% CPU when needed
```

**M-series (M5, M6i, M7g)** - Balanced
- **What**: Balance of compute, memory, networking
- **When**: Application servers, mid-size databases, enterprise apps
- **vCPU**: 1-192 cores
- **Memory**: 4-768 GB
- **Cost**: $0.096/hour (m5.large) - $9.216/hour (m5.24xlarge)

#### 2. **Compute Optimized (C)**
**C-series (C5, C6i, C7g)**
- **What**: High CPU-to-memory ratio
- **When**: Batch processing, HPC, gaming servers, scientific modeling
- **vCPU**: 2-192 cores
- **Performance**: Up to 3.5 GHz sustained all-core turbo
- **Cost**: $0.085/hour (c5.large) - $8.16/hour (c5.24xlarge)
- **Example**: Video encoding, machine learning inference

#### 3. **Memory Optimized (R, X, Z, High Memory)**
**R-series (R5, R6i, R7g)**
- **What**: High memory-to-CPU ratio
- **When**: In-memory databases (Redis, SAP HANA), real-time analytics
- **Memory**: 16 GB - 768 GB
- **Cost**: $0.126/hour (r5.large) - $12.096/hour (r5.24xlarge)

**X-series (X1, X2)**
- **What**: Lowest cost per GB of RAM
- **When**: Enterprise databases (SAP HANA, Apache Spark)
- **Memory**: Up to 4 TB per instance
- **Cost**: Higher than R-series but optimized for massive memory

**Z-series (Z1d)**
- **What**: High compute + high memory + high frequency
- **When**: EDA workloads, gaming, financial applications
- **Clock Speed**: Up to 4.0 GHz

#### 4. **Storage Optimized (I, D, H)**
**I-series (I3, I3en, I4i)**
- **What**: NVMe SSD instance storage, high IOPS
- **When**: NoSQL databases (Cassandra, MongoDB), data warehouses
- **Storage**: Up to 60 TB NVMe SSD
- **IOPS**: Millions of random read IOPS
- **Cost**: $0.156/hour (i3.large) - $14.976/hour (i3.16xlarge)

**D-series (D2, D3, D3en)**
- **What**: High sequential read/write, HDD-based
- **When**: MapReduce, Hadoop, log processing
- **Storage**: Up to 336 TB HDD

**H-series (H1)**
- **What**: High disk throughput, HDD-based
- **When**: Big data, distributed file systems

#### 5. **Accelerated Computing (P, G, F, Inf, Trn)**
**P-series (P3, P4, P5)** - GPU instances
- **What**: NVIDIA GPUs for parallel processing
- **When**: Machine learning training, HPC, computational finance
- **GPUs**: Up to 8 NVIDIA A100 GPUs
- **Cost**: $3.06/hour (p3.2xlarge) - $32.77/hour (p3dn.24xlarge)

**G-series (G4, G5)** - Graphics intensive
- **What**: NVIDIA GPUs for graphics workloads
- **When**: Video transcoding, game streaming, 3D visualization
- **Cost**: $1.14/hour (g4dn.xlarge) - $16.26/hour (g4dn.16xlarge)

**F-series (F1)** - FPGA instances
- **What**: Field Programmable Gate Arrays
- **When**: Genomics, financial analytics, real-time video processing

**Inf-series (Inf1, Inf2)** - AWS Inferentia chips
- **What**: Custom machine learning inference chips
- **When**: High throughput, low-latency ML inference
- **Cost**: 45% lower cost than comparable GPU instances

**Trn-series (Trn1)** - AWS Trainium chips
- **What**: Custom ML training chips
- **When**: Deep learning training

## EC2 Purchasing Options

### 1. **On-Demand Instances**
**What**: Pay per second (Linux/Windows) with no commitment
**Pricing**: Most expensive, but most flexible
**When to Use**:
- Short-term workloads
- Unpredictable workloads
- Development/testing
- First-time applications

**Cost Example**:
- m5.large: $0.096/hour = $70.08/month (730 hours)
- Can stop anytime, only pay for running time

**Pros**:
- No upfront costs
- No commitments
- Full flexibility

**Cons**:
- Highest per-hour cost
- Can be interrupted if capacity constrained

### 2. **Reserved Instances (RIs)**
**What**: 1 or 3-year commitment for significant discounts (up to 72%)

**Types**:

**a) Standard Reserved Instances**
- Discount: Up to 72% vs On-Demand
- Flexibility: Cannot change instance type
- When: Steady-state applications (databases, always-on servers)
- Cost Example: m5.large 3-year: $0.037/hour (62% savings)

**b) Convertible Reserved Instances**
- Discount: Up to 66% vs On-Demand
- Flexibility: Can change instance family, OS, tenancy
- When: Long-term but uncertain about instance needs
- Cost Example: m5.large 3-year: $0.042/hour (56% savings)

**Payment Options**:
1. **All Upfront**: Maximum discount, pay everything upfront
2. **Partial Upfront**: Pay some upfront, lower hourly rate
3. **No Upfront**: No upfront payment, discount on hourly rate

**Regional vs Zonal RIs**:
- **Regional**: Apply across AZs, instance size flexible within family
- **Zonal**: Specific AZ, capacity reservation, no size flexibility

**Pros**:
- Significant cost savings
- Capacity reservation (Zonal)
- Can be sold on RI Marketplace

**Cons**:
- Long-term commitment
- Less flexibility (Standard)
- Upfront payment required (some options)

### 3. **Savings Plans**
**What**: Hourly spend commitment for 1 or 3 years (up to 72% discount)

**Types**:

**a) Compute Savings Plans**
- Flexibility: Any instance family, size, OS, tenancy, region
- Services: EC2, Fargate, Lambda
- Discount: Up to 66%
- When: Most flexible option for diverse workloads

**b) EC2 Instance Savings Plans**
- Flexibility: Any size, OS, tenancy within instance family in region
- Services: EC2 only
- Discount: Up to 72%
- When: Committed to instance family (e.g., M5)

**Example**:
- Commit to $10/hour for 3 years
- Any compute over that is billed at On-Demand rates
- Automatically applies to lowest-cost instances

**Pros**:
- More flexible than RIs
- Applies to Lambda and Fargate
- Easy to understand (just commit to $/hour)

**Cons**:
- Still requires commitment
- Doesn't provide capacity reservation

### 4. **Spot Instances**
**What**: Unused EC2 capacity at up to 90% discount

**How it Works**:
- AWS has spare capacity
- You bid for instances at discounted rates
- AWS can reclaim with 2-minute warning
- Price fluctuates based on supply/demand

**Pricing Example**:
- On-Demand m5.large: $0.096/hour
- Spot m5.large: $0.029/hour (70% savings)
- Historical average discount: 70-90%

**When to Use**:
- Fault-tolerant workloads
- Batch processing
- Big data analytics
- CI/CD pipelines
- Containerized workloads
- Web servers with load balancers

**When NOT to Use**:
- Databases (unless replicated)
- Critical applications without redundancy
- Stateful applications

**Spot Instance Strategies**:

**1. Spot Blocks** (deprecated but important to know)
- Reserved for 1-6 hours
- Won't be interrupted during block

**2. Spot Fleet**
- Launch combination of Spot and On-Demand
- Automatically request Spot across multiple pools
- Define target capacity and instance types
- Allocation strategies:
  - **lowestPrice**: Cheapest instances
  - **diversified**: Distributed across pools
  - **capacityOptimized**: Pools with optimal capacity
  - **priceCapacityOptimized**: Best of both (recommended)

**3. Spot Interruption Handling**:
```bash
# EC2 Instance Metadata Service
curl http://169.254.169.254/latest/meta-data/spot/instance-action

# Interruption notice format:
{
  "action": "terminate",
  "time": "2026-01-31T12:00:00Z"
}
```

**Spot Best Practices**:
- Use multiple instance types and AZs
- Implement checkpointing for long-running jobs
- Monitor Spot Instance Advisor for interruption rates
- Use EC2 Auto Scaling with Spot
- Combine with On-Demand for reliability

**Pros**:
- Massive cost savings (up to 90%)
- Good for stateless, fault-tolerant workloads
- Can use Spot Fleet for reliability

**Cons**:
- Can be interrupted with 2-minute notice
- Not suitable for critical applications
- Requires interrupt-tolerant architecture

### 5. **Dedicated Hosts**
**What**: Physical EC2 server dedicated for your use

**Pricing**:
- On-Demand: $2.50+/hour depending on instance family
- Reservation: 1 or 3 years (up to 70% savings)

**When to Use**:
- Regulatory requirements (server-bound software licenses)
- Licensing that doesn't support multi-tenancy (Windows Server, SQL Server, SUSE Linux)
- Compliance requirements (HIPAA, PCI-DSS)
- Need visibility into sockets/physical cores

**Features**:
- Socket and core visibility
- Host affinity (instance runs on specific host)
- Host recovery (automatic instance recovery)
- Bring Your Own License (BYOL)

**Pros**:
- Software license compliance
- Full physical server control
- Regulatory compliance

**Cons**:
- Most expensive option
- Over-provisioning (pay for entire host)
- Complex management

### 6. **Dedicated Instances**
**What**: Instances run on hardware dedicated to your account

**Pricing**:
- $2/hour per region fee
- Plus instance charges (similar to On-Demand)

**Difference from Dedicated Hosts**:
- No control over placement
- No socket/core visibility
- Cannot use BYOL
- Simpler pricing and management

**When to Use**:
- Compliance requires physical isolation
- Don't need BYOL
- Simpler than Dedicated Hosts

### 7. **Capacity Reservations**
**What**: Reserve capacity in specific AZ, no discount

**Pricing**: Pay On-Demand rate whether you use it or not

**When to Use**:
- Critical workloads that need guaranteed capacity
- Disaster recovery (reserve but don't run)
- Short-term capacity needs in constrained AZs
- Combine with Savings Plans for cost + capacity

**Types**:
- **On-Demand Capacity Reservation**: Open or targeted
- **Open**: Any account instance can use
- **Targeted**: Specific instances use

**Pros**:
- Guaranteed capacity
- No long-term commitment
- Can combine with Savings Plans

**Cons**:
- Pay even if not using
- No discount on its own

## EC2 Storage Options

### 1. **EBS (Elastic Block Store)**
**What**: Network-attached persistent storage

**Volume Types**:

**General Purpose SSD (gp3, gp2)**:
- **gp3**: 
  - 3,000-16,000 IOPS baseline
  - 125-1000 MB/s throughput
  - Cost: $0.08/GB-month + $0.005/provisioned IOPS over 3000
  - When: Most workloads (99% of use cases)
  
- **gp2**:
  - 3 IOPS per GB (100-16,000 IOPS)
  - Burstable to 3,000 IOPS
  - Cost: $0.10/GB-month
  - When: Legacy, gp3 is better

**Provisioned IOPS SSD (io2, io1)**:
- **io2 Block Express**:
  - Up to 256,000 IOPS
  - Up to 4,000 MB/s throughput
  - 99.999% durability
  - Cost: $0.125/GB-month + $0.065/IOPS
  - When: Mission-critical databases (SAP HANA, Oracle)

- **io1**:
  - Up to 64,000 IOPS
  - 50 IOPS per GB
  - Cost: $0.125/GB-month + $0.065/IOPS
  - When: Legacy, use io2 instead

**Throughput Optimized HDD (st1)**:
- 500 IOPS max
- 500 MB/s throughput
- Cost: $0.045/GB-month
- When: Big data, data warehouses, log processing

**Cold HDD (sc1)**:
- 250 IOPS max
- 250 MB/s throughput
- Cost: $0.015/GB-month
- When: Infrequent access, lowest cost

**EBS Features**:
- **Snapshots**: Incremental backups to S3
- **Encryption**: AES-256 at rest and in transit
- **Multi-Attach**: Attach io1/io2 to multiple instances (up to 16)
- **Elastic Volumes**: Resize without downtime

### 2. **Instance Store**
**What**: Physically attached ephemeral storage

**Characteristics**:
- Very high IOPS (millions)
- Data lost on stop/terminate
- No additional cost (included)
- Size varies by instance type

**When to Use**:
- Temporary data (cache, buffers, scratch data)
- Replicated data (Hadoop, Cassandra)
- High IOPS requirements

**When NOT to Use**:
- Any data you need to persist
- Databases without replication

### 3. **EFS (Elastic File System)**
**What**: NFSv4 network file system, shared across instances

**When to Use with EC2**:
- Shared file storage across instances
- Content management systems
- Web serving
- Container storage

**Cost**: $0.30/GB-month (Standard) - $0.0133/GB-month (Infrequent Access)

## EC2 Networking

### IP Addressing

**Private IP**:
- Assigned from VPC CIDR
- Persists across stop/start
- Used for internal communication

**Public IP**:
- Dynamic, changes on stop/start
- Lost when stopped
- Free

**Elastic IP**:
- Static public IP
- Persists across stop/start
- Cost: $0.005/hour when NOT attached
- Limited to 5 per region (soft limit)

**IPv6**:
- Global unicast address
- Free
- Persists across stop/start

### Elastic Network Interface (ENI)

**What**: Virtual network card

**Features**:
- Primary private IPv4 + secondary IPs
- One Elastic IP per private IPv4
- One public IP
- Security groups
- MAC address

**Use Cases**:
- Dual-homed instances (multiple networks)
- Low-budget high availability (move ENI on failure)
- Licensing tied to MAC address

**Example Configuration**:
```
Instance: i-1234567890abcdef0
├── eth0 (Primary ENI)
│   ├── Private IP: 10.0.1.50
│   ├── Public IP: 54.123.45.67
│   └── Security Group: web-sg
├── eth1 (Secondary ENI)
│   ├── Private IP: 10.0.2.100
│   └── Security Group: management-sg
```

### Enhanced Networking

**What**: SR-IOV for higher I/O performance

**Types**:
1. **Elastic Network Adapter (ENA)**: Up to 100 Gbps
2. **Intel 82599 VF**: Up to 10 Gbps (legacy)

**Benefits**:
- Higher bandwidth
- Higher PPS (packets per second)
- Lower latency
- No additional cost

**Enabled by default** on current generation instances

### Placement Groups

**1. Cluster Placement Group**:
- **What**: Instances in single AZ, low-latency network
- **Bandwidth**: 10-100 Gbps between instances
- **When**: HPC, tightly coupled applications
- **Limitation**: Single AZ, homogenous instance types recommended
- **Exam Tip**: Highest network performance

**2. Spread Placement Group**:
- **What**: Instances on different hardware
- **Limit**: 7 instances per AZ
- **When**: Critical instances that must be isolated
- **Use Case**: Distributed databases, Kafka brokers
- **Exam Tip**: Maximum failure isolation

**3. Partition Placement Group**:
- **What**: Instances divided into partitions (different hardware)
- **Partitions**: Up to 7 per AZ
- **When**: Hadoop, Cassandra, Kafka (large distributed systems)
- **Benefit**: Balance between performance and isolation
- **Exam Tip**: Large distributed and replicated workloads

**Comparison**:
```
Cluster:    [AZ-1: All instances close together]
            Use: HPC, lowest latency

Spread:     [AZ-1: i1 | i2 | i3] [AZ-2: i4 | i5 | i6]
            Use: Critical instances, max isolation

Partition:  [AZ-1: P1(i1,i2,i3) | P2(i4,i5,i6) | P3(i7,i8,i9)]
            Use: Distributed systems (Hadoop, Kafka)
```

## EC2 Auto Scaling (Deep Dive)

### Components

**1. Launch Template / Launch Configuration**:
- AMI ID
- Instance type
- Key pair
- Security groups
- User data script
- IAM role
- Storage configuration

**Launch Template vs Configuration**:
- **Template**: Versioning, multiple instance types, Spot support (use this)
- **Configuration**: Legacy, immutable, limited features

**2. Auto Scaling Group (ASG)**:
- Min/Max/Desired capacity
- VPC and subnets
- Health check type (EC2 or ELB)
- Health check grace period

**3. Scaling Policies**:
Define when to scale

### Scaling Policies

**1. Target Tracking Scaling**:
```
If Average CPU > 70%, add instances
If Average CPU < 70%, remove instances
```
- **Metrics**: CPU, Network, ALB Request Count, Custom
- **Best for**: Most use cases
- **Example**: Keep CPU at 70% utilization

**2. Step Scaling**:
```
If CPU > 80%, add 2 instances
If CPU > 90%, add 4 instances
If CPU < 40%, remove 1 instance
```
- **Best for**: Multiple thresholds
- **Faster**: No cooldown between alarm states

**3. Simple Scaling**:
```
If CPU > 70%, add 1 instance, wait 300 seconds
```
- **Legacy**: Use Target Tracking instead
- **Cooldown**: Wait period between scaling actions

**4. Scheduled Scaling**:
```
Every Monday 9 AM: Set desired capacity to 10
Every Friday 6 PM: Set desired capacity to 2
```
- **Best for**: Predictable patterns
- **Use Case**: Business hours scaling

**5. Predictive Scaling**:
- **What**: ML-based, forecasts load
- **When**: Regular patterns in load
- **Benefit**: Proactive scaling

### Scaling Cooldown

**Default**: 300 seconds

**Purpose**: Prevent thrashing (rapid scale in/out)

**Best Practice**: 
- Use Target Tracking (has built-in cooldown logic)
- For custom: Set based on instance startup time

### Health Checks

**EC2 Health Check**:
- System status checks
- Instance status checks
- Replaces failed instances

**ELB Health Check**:
- Monitors application health via load balancer
- More comprehensive (application-aware)
- **Recommended** for web applications

**Grace Period**: Time before first health check (default 300 seconds)

### Lifecycle Hooks

**What**: Pause instance launch/termination for custom actions

**Use Cases**:
- Install software
- Extract logs before termination
- Register with external systems
- Run backups

**Example Workflow**:
```
Launch: Pending → Pending:Wait → Pending:Proceed → InService
Terminate: Terminating → Terminating:Wait → Terminating:Proceed → Terminated
```

**Actions During Wait**:
- Run scripts via User Data
- SNS notification triggers Lambda
- Complete lifecycle action when done

### Termination Policies

**Order of Evaluation**:
1. Which AZ has most instances?
2. Within that AZ, which instance to terminate?

**Default Policy**:
1. Oldest launch template/configuration
2. Closest to next billing hour
3. Random selection

**Other Policies**:
- **OldestInstance**: Terminate oldest
- **NewestInstance**: Terminate newest
- **OldestLaunchConfiguration**: Upgrade fleet gradually
- **ClosestToNextInstanceHour**: Cost optimization
- **AllocationStrategy**: For Spot (terminate based on allocation)

### Instance Refresh

**What**: Replace instances in ASG with new configuration

**Use Case**:
- Deploy new AMI
- Change instance type
- Update configuration

**Process**:
1. Set minimum healthy percentage (e.g., 90%)
2. Terminate old instances in batches
3. Launch new instances with updated template
4. Wait for health check

**Example**:
```json
{
  "MinHealthyPercentage": 90,
  "InstanceWarmup": 300,
  "CheckpointPercentages": [25, 50, 75],
  "CheckpointDelay": 3600
}
```

### Warm Pools

**What**: Pre-initialized instances ready to serve traffic

**States**:
- **Stopped**: Instances stopped, fast startup
- **Running**: Instances running but not in service
- **Hibernated**: Fastest startup, RAM preserved

**Use Case**:
- Applications with long initialization time
- Sudden traffic spikes
- Gaming servers

**Cost**: Only pay for storage (stopped) or reduced rate (running)

### ASG with Load Balancer Integration

**Attachment**:
```
ASG → Target Group → Load Balancer
```

**Benefits**:
- Automatic registration/deregistration
- ELB health checks
- Connection draining
- Traffic distribution

**Connection Draining** (Deregistration Delay):
- Default: 300 seconds
- Allows in-flight requests to complete
- Then terminates instance

## EC2 Security

### Security Groups

**What**: Virtual firewall for instances

**Characteristics**:
- **Stateful**: Return traffic automatically allowed
- **Default**: All inbound blocked, all outbound allowed
- **Rules**: Only Allow rules (no Deny)
- **References**: Can reference other security groups

**Example Rules**:
```
Inbound:
- Port 80 (HTTP) from 0.0.0.0/0
- Port 443 (HTTPS) from 0.0.0.0/0
- Port 22 (SSH) from sg-1234abcd (bastion SG)
- Port 3306 (MySQL) from sg-app123 (app tier SG)

Outbound:
- All traffic to 0.0.0.0/0
```

**Best Practices**:
- Least privilege principle
- Reference security groups instead of IPs
- Separate SGs for different tiers (web, app, db)
- Regular audit unused rules

### IAM Roles for EC2

**What**: Grant AWS permissions to applications on EC2

**How it Works**:
1. Create IAM role with policies
2. Attach role to EC2 instance
3. Applications use temporary credentials from metadata service

**Benefits**:
- No credentials in code
- Automatic credential rotation
- Audit via CloudTrail

**Example**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:GetObject",
      "s3:PutObject"
    ],
    "Resource": "arn:aws:s3:::my-bucket/*"
  }]
}
```

**Metadata Service**:
```bash
# IMDSv2 (recommended)
TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME
```

### EC2 Instance Connect

**What**: Browser-based SSH connection

**Requirements**:
- Amazon Linux 2 or Ubuntu 16.04+
- Security group allows SSH from AWS IP ranges
- IAM permissions for ec2-instance-connect

**Benefits**:
- No SSH key management
- IAM-based access control
- Session logging in CloudTrail

### Systems Manager Session Manager

**What**: Browser or CLI-based shell access

**Benefits**:
- No SSH keys required
- No open inbound ports (uses SSM agent)
- Session logging to S3/CloudWatch
- IAM-based access control
- Works through NAT/Internet Gateway

**Requirements**:
- SSM agent installed (pre-installed on Amazon Linux 2, Windows Server 2016+)
- IAM role with SSM permissions
- Outbound HTTPS to SSM endpoints

## EC2 Monitoring

### CloudWatch Metrics

**Basic Monitoring** (Free, 5-minute intervals):
- CPU Utilization
- Network In/Out
- Disk Read/Write (Ops and Bytes)
- Status Check Failed

**Detailed Monitoring** (Paid, 1-minute intervals):
- Cost: $2.10 per instance per month
- Same metrics, higher frequency

**Important**: 
- **No memory or disk utilization metrics by default**
- Must use CloudWatch agent for custom metrics

### Status Checks

**System Status Check**:
- AWS infrastructure issues
- Loss of network connectivity
- Loss of system power
- Hardware issues
- **Recovery**: Stop/Start instance (moves to new hardware)

**Instance Status Check**:
- Instance OS issues
- Corrupted file system
- Incorrect networking/startup config
- Kernel panic
- **Recovery**: Reboot instance or fix OS

**Auto Recovery**:
```
Create CloudWatch Alarm on StatusCheckFailed_System
Action: Recover this instance
```
- Moves instance to new hardware
- Same private IP, Elastic IP, metadata, placement group

### CloudWatch Agent

**What**: Collects additional metrics and logs

**Metrics Collected**:
- Memory utilization
- Disk utilization
- Disk swap
- Network metrics
- Process metrics

**Configuration**:
```json
{
  "metrics": {
    "namespace": "CWAgent",
    "metrics_collected": {
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MemoryUtilization"}
        ]
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DiskUtilization"}
        ]
      }
    }
  }
}
```

## EC2 User Data and Metadata

### User Data

**What**: Script that runs once at instance first boot

**Use Cases**:
- Install software
- Configure instance
- Download application code
- Join domain

**Example**:
```bash
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname)</h1>" > /var/www/html/index.html
```

**Important**:
- Runs as root
- Logged to /var/log/cloud-init-output.log
- Can modify to run on every boot (not recommended)
- 16 KB limit

### Instance Metadata

**What**: Data about your instance accessible from within instance

**Endpoint**: http://169.254.169.254/latest/meta-data/

**Available Data**:
- AMI ID
- Instance ID
- Instance type
- Public/private IP
- Security groups
- IAM role credentials
- User data

**IMDSv1** (Original):
```bash
curl http://169.254.169.254/latest/meta-data/instance-id
```

**IMDSv2** (Session-oriented, recommended):
```bash
TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id
```

**Security**:
- IMDSv2 protects against SSRF attacks
- Require IMDSv2 in production

## Hibernate

**What**: Suspend-to-disk, saves RAM contents to EBS root volume

**Requirements**:
- Supported instance families: C3, C4, C5, M3, M4, M5, R3, R4, R5
- RAM: Less than 150 GB
- Root volume: EBS, encrypted, large enough for RAM
- Instance size: Not all sizes supported

**Use Cases**:
- Long-running processes
- Applications that take time to initialize
- Save RAM state

**Limitations**:
- Max hibernation: 60 days
- Not supported for Spot instances
- Cannot hibernate running instance

**How it Works**:
1. Hibernate signal sent
2. RAM dumped to EBS root
3. Instance stopped
4. On start, RAM loaded from EBS
5. Processes resume

## High Availability Patterns

### Multi-AZ Deployment
```
Region
├── AZ-1: ASG (min 2 instances) + ELB
├── AZ-2: ASG (min 2 instances) + ELB
└── AZ-3: ASG (min 2 instances) + ELB
```

### Cross-Region Deployment
```
Region US-East-1          Region EU-West-1
├── Multi-AZ ASG         ├── Multi-AZ ASG
├── ELB                  ├── ELB
└── Route 53 ← Failover → └── Route 53
```

### Bastion Host Pattern
```
Internet
    ↓
Internet Gateway
    ↓
Public Subnet: Bastion (SSH port 22 from your IP)
    ↓
Private Subnet: Application (SSH port 22 from Bastion SG)
```

### NAT Instance Pattern (Legacy, use NAT Gateway)
```
Private Subnet Instance
    ↓
NAT Instance (public subnet, Source/Dest Check disabled)
    ↓
Internet Gateway
```

## AMI (Amazon Machine Image)

### What is AMI?

**Components**:
- Root volume template (OS, application)
- Launch permissions
- Block device mapping

**Types by Root Volume**:
1. **EBS-backed**: Root is EBS snapshot (most common)
   - Fast boot (usually < 1 minute)
   - Can be stopped
   - Data persists

2. **Instance Store-backed**: Root is instance store
   - Slower boot (usually < 5 minutes)
   - Cannot be stopped (only terminate or reboot)
   - Data lost on termination

### AMI Lifecycle

**Creating AMI**:
1. Customize instance
2. Create image (creates snapshot)
3. AMI ready to launch

**Sharing**:
- Private (default)
- Specific AWS accounts
- Public (everyone)
- AWS Marketplace

**Copying**:
- Cross-region (for DR/low latency)
- Encryption can be changed during copy

**Deregistering**:
- AMI deleted
- Snapshots remain (manual deletion needed)

### Golden AMI Pattern

**What**: Pre-configured AMI with all software

**Benefits**:
- Fast launch time
- Consistent configuration
- Less user data script needed

**Best Practice**:
```
Base AMI (Amazon Linux 2)
    ↓
Install common tools (monitoring, security agents)
    ↓
Golden AMI v1.0
    ↓
Deploy to Auto Scaling
```

**Update Process**:
1. Create new version (Golden AMI v1.1)
2. Update Launch Template
3. Instance Refresh in ASG

## Troubleshooting

### Instance Won't Start

**Possible Causes**:
1. **InstanceLimitExceeded**: Hit instance limit (20 On-Demand per region)
   - Solution: Request limit increase or use different region

2. **InsufficientInstanceCapacity**: AWS out of capacity in AZ
   - Solution: Wait, try different instance type, try different AZ

3. **Instance won't boot**: AMI or config issue
   - Solution: Check system logs, try different AMI

### Can't Connect

**SSH/RDP Connection Issues**:
1. **Security group**: Ensure port 22/3389 open from your IP
2. **Network ACL**: Ensure not blocking traffic
3. **Route table**: Ensure internet gateway route
4. **Public IP**: Ensure instance has public IP
5. **Key pair**: Ensure correct private key, correct permissions (chmod 400)

### Performance Issues

**High CPU**:
- Right-size instance (use Compute Optimizer)
- Enable Auto Scaling
- Optimize application

**Network Bottleneck**:
- Use enhanced networking
- Increase instance size
- Use placement groups (cluster)

**Disk I/O**:
- Use Provisioned IOPS (io2)
- Increase gp3 IOPS/throughput
- Use instance store for temporary data

## Cost Optimization Strategies

### 1. Right-Sizing
- Use CloudWatch metrics (2-week minimum)
- AWS Compute Optimizer recommendations
- Downsize over-provisioned instances
- Potential savings: 30-50%

### 2. Purchasing Options Mix
```
Baseline: Reserved Instances/Savings Plans (60%)
Variable: On-Demand (20%)
Interruptible: Spot Instances (20%)
```

### 3. Auto Scaling
- Scale down during off-hours
- Use scheduled scaling
- Target tracking for dynamic workloads

### 4. Storage Optimization
- Delete unused EBS volumes
- Delete old snapshots
- Use gp3 instead of gp2
- Use st1/sc1 for throughput workloads

### 5. Spot Instances
- Batch processing
- CI/CD
- Containerized workloads
- Stateless web servers

### 6. Modernize
- Serverless (Lambda) for intermittent workloads
- Containers (ECS/EKS with Fargate) for better utilization
- Managed services instead of self-managed on EC2

## EC2 vs Alternatives

### EC2 vs Lambda
| Factor | EC2 | Lambda |
|--------|-----|--------|
| Control | Full OS control | Function-level only |
| Runtime | Unlimited | 15 min max |
| Cost | Always running cost | Pay per invocation |
| Scaling | Manual/Auto Scaling | Automatic |
| Use Case | Long-running, stateful | Event-driven, short tasks |

### EC2 vs ECS/EKS
| Factor | EC2 | ECS/EKS |
|--------|-----|---------|
| Management | Manual | Container orchestration |
| Scaling | Instance-level | Container-level |
| Utilization | Lower | Higher |
| Complexity | Lower | Higher |
| Use Case | Traditional apps | Microservices |

### EC2 vs Elastic Beanstalk
| Factor | EC2 | Elastic Beanstalk |
|--------|-----|-------------------|
| Management | Full control | Managed platform |
| Responsibility | You manage everything | AWS manages infrastructure |
| Flexibility | Maximum | Limited to supported platforms |
| Use Case | Custom needs | Standard web apps |

## Real-World Scenarios

### Scenario 1: E-commerce Website
**Requirements**:
- Handle Black Friday traffic (10x normal)
- Database must persist
- 99.9% availability

**Solution**:
```
- Load Balancer: ALB across 3 AZs
- Compute: Auto Scaling Group
  - Base: 6 m5.large (RI/Savings Plan)
  - Scale: Up to 60 instances (On-Demand + Spot)
  - Target Tracking: 70% CPU
- Database: RDS Multi-AZ (separate from web tier)
- Storage: S3 for static content + CloudFront CDN
- Monitoring: CloudWatch + SNS alerts
```

**Cost Optimization**:
- Reserved Instances for base capacity: $350/month
- Spot for peak: $50/month average
- Total: ~$400/month vs $1,200 all On-Demand

### Scenario 2: Video Encoding Pipeline
**Requirements**:
- Process uploaded videos
- Variable workload
- Cost-sensitive

**Solution**:
```
- Trigger: S3 event → SQS queue
- Compute: Auto Scaling with Spot Fleet
  - Instance types: c5.2xlarge, c5.4xlarge, c5a.2xlarge
  - Allocation: price-capacity-optimized
  - Target: Queue depth / instance
- Storage: S3 for input/output
- Notification: SNS when complete
```

**Cost Savings**:
- Spot vs On-Demand: 80% savings
- Only run when videos uploaded
- Monthly cost: $200 vs $3,000 On-Demand

### Scenario 3: Machine Learning Training
**Requirements**:
- Train models overnight
- Need GPU
- Checkpointing every 30 min

**Solution**:
```
- Instance: p3.8xlarge Spot (4 V100 GPUs)
- AMI: Deep Learning AMI
- Storage: FSx for Lustre (high-speed data access)
- Checkpointing: S3
- Spot interruption: Resume from last checkpoint
```

**Cost**:
- On-Demand: $12.24/hour = $293/day
- Spot: ~$3.50/hour = $84/day
- Savings: 71%

### Scenario 4: Disaster Recovery
**Requirements**:
- RPO: 1 hour
- RTO: 4 hours
- Primary: us-east-1

**Solution**:
```
Primary Region (us-east-1):
- Production environment running

DR Region (us-west-2):
- AMIs replicated (cross-region copy)
- EBS snapshots replicated (automated)
- Capacity Reservations (unused, ready)
- CloudFormation template ready
- Route 53 health checks with failover

On Failure:
1. Route 53 detects failure
2. Manual/automated CloudFormation stack launch
3. Restore EBS from snapshots
4. Update Route 53 (or automatic failover)
```

**Cost**:
- DR costs: Snapshots + AMI storage: ~$50/month
- Active-Active would cost: ~$5,000/month

### Scenario 5: CI/CD Pipeline
**Requirements**:
- Run builds on commits
- Multiple concurrent builds
- Cost-effective

**Solution**:
```
- Trigger: Git commit → CodePipeline → CodeBuild
- Compute: EC2 Spot Fleet for build agents
  - On-demand: 2 m5.large (always available)
  - Spot: Up to 10 m5.large (burst capacity)
  - ASG based on queue depth
- Artifacts: S3
- Deployment: CodeDeploy to production ASG
```

**Cost**:
- Base On-Demand: $70/month
- Spot for bursts: ~$20/month
- Total: $90/month vs $450 all On-Demand

## Exam Tips (SAP-C02 Specific)

### Key Differentiation Points

**When to Use Each Purchasing Option**:
- **On-Demand**: Unpredictable, short-term, first-time
- **Reserved/Savings Plans**: Steady-state, 1-3 year workloads
- **Spot**: Fault-tolerant, flexible start/end times
- **Dedicated Hosts**: Licensing, compliance, socket/core visibility

**Placement Groups**:
- **Cluster**: "Lowest latency" = Cluster
- **Spread**: "Maximum isolation" = Spread (7 per AZ limit)
- **Partition**: "Hadoop/Cassandra" = Partition

**High Availability**:
- Multi-AZ with Auto Scaling + ELB
- Health checks: Use ELB health checks for application-aware
- Cross-region: Route 53 + replicated infrastructure

**Scaling Triggers**:
- **Predictable**: Scheduled Scaling
- **Metrics-based**: Target Tracking (preferred) or Step Scaling
- **ML-predicted**: Predictive Scaling

**Storage Choice**:
- **Persistent, network**: EBS
- **Persistent, shared**: EFS
- **Temporary, highest IOPS**: Instance Store
- **Object storage**: S3

**Security**:
- **Firewall**: Security Groups (stateful, allow only)
- **OS hardening**: Systems Manager
- **Access logs**: VPC Flow Logs
- **No SSH keys**: Session Manager

**Cost Optimization Questions**:
- Look for keywords: "minimize cost", "most cost-effective"
- Usually answer involves: Spot, Reserved, right-sizing, or Auto Scaling

**Instance Metadata**:
- IMDSv2 for security
- User data runs at boot
- Metadata for instance info from within

**Common Trap Answers**:
- NAT Instance (outdated, use NAT Gateway)
- Classic Load Balancer (outdated, use ALB/NLB)
- Launch Configuration (outdated, use Launch Template)

### Practice Questions Pattern

**Question Type 1**: Cost Optimization
- Always consider: Spot, Reserved/Savings Plans, Auto Scaling, right-sizing

**Question Type 2**: High Availability
- Always include: Multi-AZ, Auto Scaling, ELB, health checks

**Question Type 3**: Performance
- Look for: Instance type, Enhanced Networking, Placement Groups, Storage type

**Question Type 4**: Security
- Consider: Security Groups, IAM roles, no hardcoded credentials, encryption

**Question Type 5**: Migration
- Think about: Application Discovery, Migration Hub, DMS, phased approach

## Quick Reference Guide

### Instance Type Selection
```
Web Server: t3.medium → m5.large (depending on traffic)
Application Server: m5.xlarge → m5.2xlarge
Database: r5.xlarge → r5.4xlarge (memory-optimized)
Cache: r5.large (memory-optimized)
Batch Processing: c5.2xlarge (compute-optimized)
Big Data: i3.2xlarge (storage-optimized)
Machine Learning: p3.2xlarge (GPU)
Video Encoding: c5.4xlarge (compute-optimized)
```

### Common Port Numbers
```
SSH: 22
RDP: 3389
HTTP: 80
HTTPS: 443
MySQL/Aurora: 3306
PostgreSQL: 5432
Oracle: 1521
MSSQL: 1433
MongoDB: 27017
Redis: 6379
```

### Pricing Examples (us-east-1, approximate)
```
t3.micro:    $0.0104/hour  = $7.50/month
t3.small:    $0.0208/hour  = $15/month
t3.medium:   $0.0416/hour  = $30/month
m5.large:    $0.096/hour   = $70/month
m5.xlarge:   $0.192/hour   = $140/month
c5.2xlarge:  $0.34/hour    = $248/month
r5.xlarge:   $0.252/hour   = $184/month
p3.2xlarge:  $3.06/hour    = $2,234/month
```

**Spot Pricing** (typical):
- 70-90% discount vs On-Demand
- Varies by region, AZ, instance type, time

**Reserved Instance Savings**:
- 1-year: ~40% savings
- 3-year: ~60-72% savings
- Convertible: Slightly less discount

This comprehensive guide covers everything you need to know about EC2 for both practical implementation and the SAP-C02 exam. Focus on understanding the trade-offs, cost implications, and when to use each feature.
