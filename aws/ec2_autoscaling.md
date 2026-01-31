# Amazon EC2 & Auto Scaling: Complete Guide

## Table of Contents
1. [EC2 History & Evolution](#ec2-history--evolution)
2. [Instance Types & Families](#instance-types--families)
3. [AMIs (Amazon Machine Images)](#amis-amazon-machine-images)
4. [Instance Lifecycle](#instance-lifecycle)
5. [User Data & Metadata](#user-data--metadata)
6. [Auto Scaling Groups](#auto-scaling-groups)
7. [Scaling Policies](#scaling-policies)
8. [Launch Templates](#launch-templates)
9. [Placement Groups](#placement-groups)
10. [Docker Simulation](#docker-simulation)
11. [Interview Questions](#interview-questions)

---

## EC2 History & Evolution

### Before Cloud (Pre-2006)

**Physical Servers**:
```
❌ Capital expenditure (buy servers upfront)
❌ Long procurement (weeks/months)
❌ Overprovisioning (buy for peak capacity)
❌ Underutilization (5-15% average utilization)
❌ Maintenance burden (hardware, OS, security)
```

**Example**:
```
Black Friday capacity:
- Peak: 10,000 servers
- Average: 1,000 servers
- Wasted: 9,000 servers × 51 weeks = 90% of the year

Cost: $1M for 10,000 servers sitting idle
```

### EC2 Launch (August 2006)

**Elastic Compute Cloud**: Virtual servers in the cloud.

**Revolutionary Concepts**:
```
✅ Pay-per-use (hourly billing)
✅ Elastic scaling (launch/terminate on demand)
✅ No upfront investment
✅ Global infrastructure
✅ API-driven provisioning
```

**First Instance Type**:
```
m1.small
- 1.7 GB RAM
- 1 EC2 Compute Unit (1 core)
- 160 GB storage
- 32-bit platform

Cost: $0.10/hour = $72/month
```

### Evolution Timeline

```
2006: EC2 Launch (Linux instances)
2008: Windows instances
2009: Reserved Instances (1-3 year commitment)
2010: Cluster Compute instances (HPC)
2011: Spot Instances (bid for unused capacity)
2012: High I/O instances (SSD)
2013: T2 instances (burstable CPU)
2014: C4 (compute optimized), R3 (memory optimized)
2015: EBS-only instances (no instance store)
2016: Elastic GPUs
2017: T2 Unlimited (unlimited burst credits)
2018: A1 instances (ARM processors)
2019: Nitro System (custom hardware, better performance)
2020: Graviton2 (ARM, 40% better price/performance)
2021: Mac instances (macOS on AWS)
2022: Graviton3 (3x better performance)
2023: 7th generation instances (C7g, R7g)
```

### Why EC2 Was Created

**Problems Solved**:

1. **Capital Expense → Operating Expense**:
```
Before: Buy $1M servers → Use for 3 years
After: Pay $0.10/hour → Use as needed

ROI: Immediate cost savings, no depreciation
```

2. **Time to Market**:
```
Before: 6 weeks to procure servers
After: 5 minutes to launch instances

Impact: Faster innovation, faster product launches
```

3. **Elasticity**:
```
Before: Provision for peak capacity (90% waste)
After: Scale up/down based on demand

Example: E-commerce site
- Normal: 10 instances
- Black Friday: 100 instances (for 1 day)
- Cost: Only pay for what you use
```

---

## Instance Types & Families

### Naming Convention

**Example**: `c5.2xlarge`
```
c        5       2x      large
↓        ↓       ↓       ↓
Family   Gen     Size    Size
```

**Components**:
```
c: Compute optimized
5: 5th generation
2xlarge: 8 vCPUs, 16 GB RAM
```

### Instance Families

#### General Purpose (T, M, A)

**T3/T3a (Burstable)**:
```
Use case: Web servers, dev/test, small databases
CPU: Burstable (accumulate credits when idle)
Price: Lowest cost

t3.micro:
- 2 vCPUs
- 1 GB RAM
- $0.0104/hour = $7.50/month

CPU Credits:
- Earn: 12 credits/hour (idle)
- Spend: 1 credit = 1 vCPU minute at 100%
- Burst: Can use accumulated credits for high load
```

**M5/M5a/M6i (Balanced)**:
```
Use case: Application servers, small databases
CPU: Sustained high performance
Memory: Balanced ratio

m5.large:
- 2 vCPUs
- 8 GB RAM
- $0.096/hour = $70/month
```

**A1 (ARM-based Graviton)**:
```
Use case: Scale-out workloads (web servers, containers)
CPU: ARM processors
Price: 40% cheaper than M5

a1.medium:
- 1 vCPU
- 2 GB RAM
- $0.0255/hour = $18.50/month
```

#### Compute Optimized (C)

**C5/C6g (High-performance CPU)**:
```
Use case: Batch processing, HPC, gaming servers, ad serving
CPU: High-frequency Intel/AMD processors
Memory: Lower ratio (prioritize CPU)

c5.xlarge:
- 4 vCPUs (3.4 GHz)
- 8 GB RAM
- $0.17/hour = $124/month

Performance: 2x faster than general purpose
```

#### Memory Optimized (R, X, Z)

**R5/R6i (High memory)**:
```
Use case: In-memory databases (Redis, Memcached), big data
Memory: High ratio (8 GB per vCPU)

r5.xlarge:
- 4 vCPUs
- 32 GB RAM (8:1 ratio)
- $0.252/hour = $184/month
```

**X1e (Extreme memory)**:
```
Use case: SAP HANA, in-memory databases
Memory: Up to 16 TB RAM

x1e.32xlarge:
- 128 vCPUs
- 3,904 GB RAM
- $26.688/hour = $19,482/month
```

#### Storage Optimized (I, D, H)

**I3/I3en (NVMe SSD)**:
```
Use case: NoSQL databases, data warehouses, Elasticsearch
Storage: Up to 60 TB NVMe SSD
IOPS: Millions of IOPS

i3.xlarge:
- 4 vCPUs
- 30.5 GB RAM
- 950 GB NVMe SSD
- $0.312/hour = $228/month
```

**D2 (HDD)**:
```
Use case: MapReduce, Hadoop, log processing
Storage: Up to 48 TB HDD

d2.xlarge:
- 4 vCPUs
- 30.5 GB RAM
- 6 TB HDD
- $0.69/hour = $504/month
```

#### Accelerated Computing (P, G, F)

**P3 (GPU - ML training)**:
```
Use case: Deep learning training, HPC
GPU: NVIDIA V100 Tensor Core

p3.2xlarge:
- 8 vCPUs
- 61 GB RAM
- 1 V100 GPU (16 GB)
- $3.06/hour = $2,234/month
```

**G4 (GPU - Inference)**:
```
Use case: ML inference, video encoding, graphics
GPU: NVIDIA T4

g4dn.xlarge:
- 4 vCPUs
- 16 GB RAM
- 1 T4 GPU (16 GB)
- $0.526/hour = $384/month
```

### Choosing Instance Type

**Decision Matrix**:
```
Web Server (low traffic):
→ t3.micro (burstable, cheap)

Web Server (consistent traffic):
→ m5.large (balanced)

Database (OLTP):
→ r5.xlarge (high memory)

Database (Analytics):
→ i3.xlarge (high IOPS)

Batch Processing:
→ c5.xlarge (high CPU)

ML Training:
→ p3.2xlarge (GPU)

Container Host:
→ a1.medium (ARM, cheap for scale-out)
```

---

## AMIs (Amazon Machine Images)

### What is an AMI?

**Template for EC2 instances**:
```
AMI = OS + Software + Configuration

Components:
- Root volume (OS)
- Block device mappings
- Launch permissions
- Architecture (x86_64, ARM)
```

### AMI Types

**1. AWS-Provided AMIs**:
```
Amazon Linux 2023
Ubuntu 22.04
Windows Server 2022
Red Hat Enterprise Linux 8
```

**2. Marketplace AMIs**:
```
Pre-configured software:
- WordPress
- GitLab
- MongoDB
- SAP

Pricing: Software cost + EC2 cost
```

**3. Custom AMIs**:
```
Your own images:
- Install software
- Configure OS
- Create AMI
- Launch identical instances

Benefit: Faster deployment
```

### Creating Custom AMI

**Process**:
```
1. Launch EC2 instance
2. Install software
   - apt-get install nginx
   - Configure application
3. Create AMI (snapshot)
4. Launch new instances from AMI
```

**AWS CLI**:
```bash
# Create AMI from running instance
aws ec2 create-image \
  --instance-id i-1234567890abcdef0 \
  --name "My Web Server v1.0" \
  --description "Nginx + Node.js"

# Launch instance from AMI
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.micro \
  --key-name my-key-pair \
  --security-group-ids sg-12345
```

### Golden AMI Pattern

**Bake software into AMI**:
```
Traditional:
1. Launch EC2
2. Run user data script
3. Install software (5-10 minutes)
4. Application ready

Golden AMI:
1. Launch EC2 from AMI
2. Application ready (1 minute)

Benefit: Faster scaling, consistent deployments
```

**Example**:
```bash
# Build golden AMI with Packer
{
  "builders": [{
    "type": "amazon-ebs",
    "region": "us-east-1",
    "source_ami": "ami-0c55b159cbfafe1f0",
    "instance_type": "t3.micro",
    "ssh_username": "ubuntu",
    "ami_name": "web-server-{{timestamp}}"
  }],
  "provisioners": [{
    "type": "shell",
    "inline": [
      "sudo apt-get update",
      "sudo apt-get install -y nginx nodejs npm",
      "sudo systemctl enable nginx"
    ]
  }]
}
```

---

## Instance Lifecycle

### Instance States

```
┌─────────┐
│ Pending │ ← Launch instance
└────┬────┘
     │
     ▼
┌─────────┐     Stop      ┌─────────┐
│ Running ├──────────────→│ Stopped │
│         │←──────────────┤         │
└────┬────┘     Start     └─────────┘
     │
     │ Terminate
     ▼
┌─────────┐
│Terminated│ (cannot restart)
└─────────┘
```

**Billing**:
```
Running: Billed per second (minimum 60 seconds)
Stopped: No EC2 charge, but EBS storage charged
Terminated: No charges
```

### Instance Store vs EBS

**Instance Store** (Ephemeral):
```
✅ High IOPS (millions)
✅ No additional cost
❌ Data lost on stop/terminate
❌ Can't detach/attach

Use case: Temporary data, cache
```

**EBS** (Persistent):
```
✅ Data persists on stop
✅ Can detach/attach
✅ Snapshots to S3
❌ Additional cost

Use case: Root volume, databases
```

### Spot Instances

**Bid for unused EC2 capacity**:
```
Pricing: Up to 90% discount
Risk: Can be terminated with 2-minute notice

Spot Price: Fluctuates based on supply/demand

Example:
On-Demand: $0.096/hour
Spot: $0.029/hour (70% savings)
```

**Use Cases**:
```
✅ Batch jobs
✅ Big data analysis
✅ CI/CD builds
✅ Stateless web servers

❌ Databases
❌ Long-running jobs
```

**Spot Request**:
```bash
aws ec2 request-spot-instances \
  --spot-price "0.05" \
  --instance-count 5 \
  --type "one-time" \
  --launch-specification file://specification.json
```

### Reserved Instances

**Commit to 1 or 3 years**:
```
1 Year: 40% discount
3 Years: 60% discount

Payment Options:
- All Upfront (highest discount)
- Partial Upfront
- No Upfront (lowest discount)

Example:
m5.large On-Demand: $0.096/hour = $840/year
m5.large Reserved (1 year, all upfront): $504/year
Savings: $336/year (40%)
```

**Convertible Reserved Instances**:
```
Can change instance family
Lower discount (30-50%)
Flexibility to upgrade
```

---

## User Data & Metadata

### User Data

**Bootstrap script** (runs on first boot):
```bash
#!/bin/bash
# Update packages
yum update -y

# Install web server
yum install -y httpd

# Start service
systemctl start httpd
systemctl enable httpd

# Create index page
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
```

**Launch with User Data**:
```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --user-data file://user-data.sh
```

### Instance Metadata

**Retrieve instance information**:
```bash
# Metadata endpoint (from instance)
curl http://169.254.169.254/latest/meta-data/

# Common metadata
curl http://169.254.169.254/latest/meta-data/instance-id
# i-1234567890abcdef0

curl http://169.254.169.254/latest/meta-data/public-ipv4
# 54.123.45.67

curl http://169.254.169.254/latest/meta-data/placement/availability-zone
# us-east-1a

curl http://169.254.169.254/latest/meta-data/iam/security-credentials/my-role
# {temporary credentials}
```

**Use Case**:
```bash
# Auto-register instance with load balancer
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=$INSTANCE_ID
```

---

## Auto Scaling Groups

### What is Auto Scaling?

**Automatically adjust capacity**:
```
Goal: Right number of instances at the right time

Benefits:
✅ Handle traffic spikes
✅ Maintain availability
✅ Optimize costs
✅ Automatic health checks
```

### Auto Scaling Group Components

**Launch Template**: What to launch.
```yaml
Instance Type: t3.micro
AMI: ami-0c55b159cbfafe1f0
Security Groups: sg-12345
Key Pair: my-key-pair
User Data: bootstrap script
```

**Desired Capacity**: Target number of instances.
```
Desired: 4 instances
ASG maintains exactly 4 instances
If one fails, launch replacement
```

**Min/Max Capacity**:
```
Min: 2 instances (always running)
Desired: 4 instances
Max: 10 instances (peak capacity)

Scaling:
- Scale out: Launch up to 10
- Scale in: Terminate down to 2
```

**Health Checks**:
```
EC2 Health Check: Instance running?
ELB Health Check: Application responding?

Grace Period: 300 seconds (don't terminate during startup)
```

### Creating Auto Scaling Group

```bash
# Create launch template
aws ec2 create-launch-template \
  --launch-template-name my-template \
  --version-description v1 \
  --launch-template-data '{
    "ImageId": "ami-0c55b159cbfafe1f0",
    "InstanceType": "t3.micro",
    "KeyName": "my-key-pair",
    "SecurityGroupIds": ["sg-12345"],
    "UserData": "IyEvYmluL2Jhc2g..."
  }'

# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name my-asg \
  --launch-template LaunchTemplateName=my-template,Version='$Latest' \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 4 \
  --vpc-zone-identifier "subnet-12345,subnet-67890" \
  --target-group-arns arn:aws:elasticloadbalancing:...
```

---

## Scaling Policies

### Target Tracking Scaling

**Maintain target metric**:
```
Metric: Average CPU Utilization
Target: 50%

Behavior:
- CPU > 50% → Scale out
- CPU < 50% → Scale in
```

**Example**:
```bash
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name my-asg \
  --policy-name cpu-target-tracking \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    },
    "TargetValue": 50.0
  }'
```

**Metrics**:
```
ASGAverageCPUUtilization: CPU usage
ASGAverageNetworkIn: Network incoming bytes
ASGAverageNetworkOut: Network outgoing bytes
ALBRequestCountPerTarget: Requests per instance
```

### Step Scaling

**Scale based on CloudWatch alarms**:
```
CPU > 70%: Add 2 instances
CPU > 85%: Add 4 instances
CPU < 30%: Remove 1 instance
```

**Example**:
```bash
# Create alarm
aws cloudwatch put-metric-alarm \
  --alarm-name cpu-high \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 70 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Create scaling policy
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name my-asg \
  --policy-name scale-out \
  --policy-type StepScaling \
  --adjustment-type ChangeInCapacity \
  --metric-aggregation-type Average \
  --step-adjustments '[
    {"MetricIntervalLowerBound": 0, "MetricIntervalUpperBound": 15, "ScalingAdjustment": 2},
    {"MetricIntervalLowerBound": 15, "ScalingAdjustment": 4}
  ]'
```

### Scheduled Scaling

**Scale at specific times**:
```
Weekdays 9 AM: Scale to 10 instances
Weekdays 6 PM: Scale to 2 instances
```

**Example**:
```bash
# Scale up at 9 AM
aws autoscaling put-scheduled-action \
  --auto-scaling-group-name my-asg \
  --scheduled-action-name scale-up-morning \
  --recurrence "0 9 * * 1-5" \
  --desired-capacity 10

# Scale down at 6 PM
aws autoscaling put-scheduled-action \
  --auto-scaling-group-name my-asg \
  --scheduled-action-name scale-down-evening \
  --recurrence "0 18 * * 1-5" \
  --desired-capacity 2
```

### Predictive Scaling

**Machine learning forecast**:
```
Analyze historical load patterns
Predict future traffic
Pre-scale before demand spike

Example:
- Every Monday 10 AM: Traffic spike
- Predictive scaling: Launch instances at 9:45 AM
```

---

## Launch Templates

### Launch Configuration vs Launch Template

**Launch Configuration** (Legacy):
```
❌ Immutable (can't modify)
❌ No versioning
❌ Limited features
```

**Launch Template** (Recommended):
```
✅ Versioning ($Latest, $Default)
✅ Modifiable
✅ More features (Spot, multiple instance types)
```

### Launch Template

```json
{
  "LaunchTemplateName": "my-template",
  "LaunchTemplateData": {
    "ImageId": "ami-0c55b159cbfafe1f0",
    "InstanceType": "t3.micro",
    "KeyName": "my-key-pair",
    "SecurityGroupIds": ["sg-12345"],
    "IamInstanceProfile": {
      "Arn": "arn:aws:iam::123456789012:instance-profile/my-role"
    },
    "BlockDeviceMappings": [{
      "DeviceName": "/dev/xvda",
      "Ebs": {
        "VolumeSize": 20,
        "VolumeType": "gp3",
        "DeleteOnTermination": true
      }
    }],
    "NetworkInterfaces": [{
      "DeviceIndex": 0,
      "AssociatePublicIpAddress": true,
      "SubnetId": "subnet-12345"
    }],
    "UserData": "IyEvYmluL2Jhc2g...",
    "TagSpecifications": [{
      "ResourceType": "instance",
      "Tags": [
        {"Key": "Name", "Value": "Web Server"},
        {"Key": "Environment", "Value": "Production"}
      ]
    }]
  }
}
```

### Mixed Instances Policy

**Multiple instance types + Spot**:
```yaml
Instance Types:
  - t3.micro (1st priority)
  - t3a.micro (2nd priority - cheaper)
  - t2.micro (3rd priority - fallback)

Capacity:
  On-Demand: 2 instances (base capacity)
  Spot: 80% (cost savings)
  On-Demand: 20% (stability)

Strategy:
  Spot: Lowest price
  On-Demand: Prioritized
```

**Example**:
```bash
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name my-asg \
  --mixed-instances-policy '{
    "LaunchTemplate": {
      "LaunchTemplateSpecification": {
        "LaunchTemplateName": "my-template",
        "Version": "$Latest"
      },
      "Overrides": [
        {"InstanceType": "t3.micro"},
        {"InstanceType": "t3a.micro"},
        {"InstanceType": "t2.micro"}
      ]
    },
    "InstancesDistribution": {
      "OnDemandBaseCapacity": 2,
      "OnDemandPercentageAboveBaseCapacity": 20,
      "SpotAllocationStrategy": "lowest-price"
    }
  }' \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 5
```

---

## Placement Groups

### Cluster Placement Group

**Pack instances together**:
```
Same AZ
Same rack (low latency)
10 Gbps network

Use case: HPC, big data, low-latency
```

**Limitation**:
```
❌ Single AZ (no HA)
✅ Highest network performance
```

### Spread Placement Group

**Spread instances across hardware**:
```
Different racks
Different AZs
Max 7 instances per AZ

Use case: Critical applications, HA
```

**Limitation**:
```
❌ 7 instances per AZ limit
✅ Maximum fault isolation
```

### Partition Placement Group

**Divide instances into partitions**:
```
Each partition on different rack
Up to 7 partitions per AZ
100s of instances per partition

Use case: Distributed databases (Hadoop, Cassandra)
```

**Example**:
```
Partition 1: HDFS NameNode
Partition 2: HDFS DataNode (Rack 1)
Partition 3: HDFS DataNode (Rack 2)

Benefit: Rack failure only affects one partition
```

---

## Docker Simulation

### Simulating Auto Scaling with Docker

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  load-balancer:
    image: nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - web1
      - web2

  web1:
    image: python:3.9-slim
    command: |
      sh -c "echo 'from http.server import HTTPServer, SimpleHTTPRequestHandler
import socket
class MyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header(\"Content-type\", \"text/html\")
        self.end_headers()
        self.wfile.write(f\"<h1>Server: {socket.gethostname()}</h1>\".encode())
HTTPServer((\"\", 8000), MyHandler).serve_forever()' > server.py && python server.py"

  web2:
    image: python:3.9-slim
    command: |
      sh -c "echo 'from http.server import HTTPServer, SimpleHTTPRequestHandler
import socket
class MyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header(\"Content-type\", \"text/html\")
        self.end_headers()
        self.wfile.write(f\"<h1>Server: {socket.gethostname()}</h1>\".encode())
HTTPServer((\"\", 8000), MyHandler).serve_forever()' > server.py && python server.py"
```

**nginx.conf** (Load Balancer):
```nginx
events {}

http {
    upstream backend {
        server web1:8000;
        server web2:8000;
    }

    server {
        listen 80;
        location / {
            proxy_pass http://backend;
        }
    }
}
```

### Simulating Scaling

**Scale up**:
```bash
docker-compose up -d --scale web=5

# Nginx auto-detects new containers
```

**Health Check**:
```bash
# Check running containers
docker ps

# Test load balancing
for i in {1..10}; do curl http://localhost; done
```

---

## Interview Questions

### Conceptual

**Q: When to use Spot Instances?**
```
✅ Batch jobs (can handle interruptions)
✅ Big data analysis (checkpointing)
✅ CI/CD (rebuild on termination)
✅ Stateless web servers (behind ALB)

❌ Databases (data loss risk)
❌ Long-running jobs (> 3 hours)
❌ Single instance (no redundancy)

Best Practice:
- Combine On-Demand + Spot
- On-Demand: Base capacity (2 instances)
- Spot: Variable capacity (up to 8 instances)
- Mixed Instances Policy with multiple instance types
```

**Q: Burstable vs Fixed Performance instances?**
```
Burstable (T3):
- CPU Credits system
- Baseline: 20% CPU
- Burst: 100% CPU (using credits)
- Cost: Cheapest

Use case:
- Web servers (low average, high spikes)
- Dev/test
- Microservices

Fixed (M5, C5):
- Sustained high CPU
- Predictable performance
- Cost: Higher

Use case:
- Databases
- Always-on applications
- Consistent load

Example:
Web server: 5% avg, 80% peak (5 min/hour)
→ T3: Accumulate credits at 5%, burst to 80%
→ Cost: $7.50/month (vs $70 for M5)
```

**Q: Instance Store vs EBS?**
```
Instance Store:
✅ Included (no extra cost)
✅ High IOPS (millions)
✅ Low latency
❌ Ephemeral (lost on stop/terminate)
❌ Can't snapshot

Use case: Cache, temp data, shuffle data

EBS:
✅ Persistent
✅ Snapshots
✅ Encryption
❌ Cost ($0.10/GB/month)
❌ IOPS limits (16,000 for gp3)

Use case: Root volume, databases, persistent storage
```

### Design

**Q: Design Auto Scaling for e-commerce site (10x traffic on Black Friday)**
```
Requirements:
- Normal: 100 req/sec → 10 instances
- Black Friday: 1,000 req/sec → 100 instances
- Budget: $500/month

Design:

1. Launch Template:
   - AMI: Golden AMI (pre-baked app)
   - Instance Type: t3.small
   - User Data: Minimal (fetch config from S3)

2. Auto Scaling Group:
   - Min: 5 instances (handle overnight traffic)
   - Desired: 10 instances
   - Max: 150 instances (safety buffer)
   - VPC: 3 AZs (HA)

3. Scaling Policies:
   - Target Tracking: ALBRequestCountPerTarget = 100
     (Each instance handles 100 req/sec)
   - Warmup: 120 seconds (app startup time)
   - Scale-out: Fast (add 10% every 60 sec)
   - Scale-in: Slow (remove 1 instance every 300 sec)

4. Scheduled Scaling (Black Friday):
   - Nov 24, 11:00 PM: Desired = 50 (pre-scale)
   - Nov 25, 6:00 AM: Max = 150 (peak capacity)
   - Nov 25, 11:59 PM: Max = 50 (reduce limit)

5. Cost Optimization:
   - On-Demand: 20% (20 instances baseline)
   - Spot: 80% (80 instances, 70% savings)
   - Mixed Instances: t3.small, t3a.small, t2.small

6. Health Checks:
   - ELB Health Check: /health endpoint
   - Grace Period: 180 seconds
   - Unhealthy Threshold: 2 consecutive failures

Capacity Calculation:
- 1,000 req/sec ÷ 100 req/sec per instance = 10 instances
- Buffer: 10 × 1.5 = 15 instances
- Scheduled scaling ensures capacity before spike

Cost:
- Normal: 10 × t3.small × $0.0208/hour × 730 hours = $152
- Black Friday: 100 × t3.small × $0.0208/hour × 24 hours = $50
- Total: ~$200/month (well under budget)
```

**Q: How to handle Auto Scaling during deployment?**
```
Problem: Rolling deployments can cause downtime

Solution 1: Suspend Auto Scaling
aws autoscaling suspend-processes \
  --auto-scaling-group-name my-asg \
  --scaling-processes AlarmNotification ScheduledActions

Deploy → Resume processes

Issue: Can't handle traffic spike during deployment

Solution 2: Blue/Green with ASG
1. Create new ASG (Green) with new AMI
2. Attach to same Target Group
3. Wait for instances to be healthy
4. Detach old ASG (Blue)
5. Terminate old ASG

Benefit: Zero downtime, instant rollback

Solution 3: Instance Refresh
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name my-asg \
  --preferences '{
    "MinHealthyPercentage": 90,
    "InstanceWarmup": 120
  }'

Process:
- Launch new instance with updated launch template
- Wait for health check
- Terminate old instance
- Repeat (maintains 90% capacity)

Benefit: Automated, rolling update
```

---

This comprehensive EC2 & Auto Scaling guide covers instance types, AMIs, lifecycle, auto scaling strategies, and production patterns with complete Docker simulations! 🚀

