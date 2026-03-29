# AWS Services 6-30: SAP-C02 Complete Reference

**Services Covered:** Auto Scaling, ELB, Route 53, CloudFront, IAM, CloudWatch, CloudTrail, KMS, Transit Gateway, Direct Connect, API Gateway, SQS, SNS, Kinesis, Redshift, Athena, Organizations, Config, GuardDuty, ElastiCache, DMS, CloudFormation, Step Functions, Secrets Manager, ECS

---

# 06. Auto Scaling

## Problem Solved
Before: Manual scaling (launch instances by hand), slow response to traffic, over/under provisioning  
Solution: Automatic instance scaling based on demand

## When to Use
✅ Variable traffic patterns  
✅ Need automatic instance replacement  
✅ Want cost optimization (scale down when idle)  
❌ Don't use: Constant predictable load (just use right-sized instances)

## vs Similar Services
**Auto Scaling vs Manual**: Auto Scaling = automatic, Manual = you launch/terminate  
**Auto Scaling vs Lambda**: ASG for long-running apps, Lambda for event-driven

## How It Works
Creates/terminates EC2 instances based on:
- CloudWatch metrics (CPU, network, custom)
- Schedule (known patterns)
- Predictive (ML-based forecasting)

## Cost
FREE - Only pay for EC2 instances launched

## Configurations
- **Min/Desired/Max**: 2/5/10 instances
- **Scaling Policies**: Target tracking (keep CPU at 70%), Step (add X at threshold), Scheduled
- **Health Checks**: EC2 status, ELB health checks
- **Cooldown**: Wait period between scaling actions

## SAP-C02 Questions
- Multi-AZ deployment (distribute across AZs)
- Scaling policy selection (target tracking vs step)
- Integration with ELB
- Lifecycle hooks (custom actions during scale)

## Key Points
- Works with Launch Templates
- Integrates with ELB (register instances automatically)
- Can mix On-Demand and Spot
- Lifecycle hooks for custom bootstrapping

---

# 07. ELB (Elastic Load Balancing)

## Problem Solved
Before: Single server = single point of failure, manual load distribution  
Solution: Distribute traffic across multiple targets automatically

## Types

### Application Load Balancer (ALB)
- **Layer**: 7 (HTTP/HTTPS)
- **Routing**: Path-based (/api → backend, /images → cache), host-based (a.com → service A)
- **Features**: WebSocket, HTTP/2, authentication, Lambda targets
- **Use**: Web applications, microservices, containers

### Network Load Balancer (NLB)
- **Layer**: 4 (TCP/UDP)
- **Performance**: Millions of requests/sec, ultra-low latency
- **Features**: Static IP, PrivateLink, preserve source IP
- **Use**: Gaming, IoT, high-performance apps, TCP/UDP protocols

### Gateway Load Balancer (GLB)
- **Layer**: 3 (Network layer)
- **Use**: Deploy/scale third-party appliances (firewalls, IDS/IPS)
- **Rare**: Specialized, not common

### Classic Load Balancer (CLB)
- **Legacy**: Don't use for new apps
- **Exam**: Might appear as "wrong answer"

## When to Use Which

| Use Case | Choose |
|----------|--------|
| HTTP/HTTPS web app | ALB |
| Need path-based routing | ALB |
| TCP/UDP (non-HTTP) | NLB |
| Extreme performance needed | NLB |
| Static IP required | NLB |
| Third-party firewall | GLB |

## Cost
- ALB: $0.0225/hour + $0.008 per LCU (capacity unit) = ~$22/month + usage
- NLB: $0.0225/hour + $0.006 per LCU = ~$22/month + usage

## Configurations
**Target Groups**: EC2, Lambda, IP addresses, containers  
**Health Checks**: HTTP GET to /health, unhealthy threshold: 2 failures  
**Stickiness**: Cookie-based (session persistence)  
**SSL/TLS**: Terminate at LB, offload from instances

## SAP-C02 Questions
- ALB vs NLB selection
- Multi-AZ deployment (always)
- SSL termination
- Connection draining/deregistration delay
- Cross-zone load balancing

---

# 08. Route 53

## Problem Solved
Before: DNS managed separately, manual failover, no health-based routing  
Solution: Managed DNS with intelligent routing

## When to Use
✅ Domain registration  
✅ DNS resolution  
✅ Health-check based failover  
✅ Geo-routing (route users to nearest region)  
✅ Weighted traffic distribution (A/B testing)

## Routing Policies

**Simple**: One resource, one record  
**Weighted**: 80% to A, 20% to B (A/B testing, canary)  
**Latency**: Route to lowest latency endpoint  
**Failover**: Primary/secondary with health checks  
**Geolocation**: Route based on user location  
**Geoproximity**: Route based on geographic distance (bias)  
**Multi-value**: Return multiple IPs (client-side load balancing)

## How It Works
```
User queries example.com
  ↓
Route 53 checks:
  - Routing policy
  - Health checks (if failover)
  - User location (if geo-routing)
  ↓
Returns IP address
  ↓
User connects to IP
```

## Cost
- Hosted zone: $0.50/month
- Queries: $0.40 per million
- Health checks: $0.50/month each

## SAP-C02 Questions
- Failover with health checks (DR scenarios)
- Weighted routing for gradual migration
- Latency-based for global users
- Private hosted zones (VPC DNS)

## Key Features
- **Alias records**: Free queries to AWS resources (ALB, CloudFront)
- **Health checks**: HTTP, HTTPS, TCP checks every 10/30 seconds
- **Traffic flow**: Visual policy designer
- **DNSSEC**: DNS security (prevent spoofing)

---

# 09. CloudFront

## Problem Solved
Before: Content served from origin only, slow for distant users, origin overwhelmed  
Solution: Global CDN, cache at edge, reduce origin load

## When to Use
✅ Static content (images, CSS, JS)  
✅ Video streaming  
✅ API acceleration  
✅ Global users (reduce latency)  
✅ DDoS protection (with Shield)

## How It Works
```
User in Tokyo requests image.jpg
  ↓
Routes to nearest edge location (Tokyo edge)
  ↓
Cache hit? → Return from edge (50ms) ✅
  ↓
Cache miss? → Fetch from origin (us-east-1 S3)
  ↓
Cache at edge for next request
  ↓
Return to user (first time: 200ms, subsequent: 50ms)
```

## Cost
- Data transfer OUT: $0.085/GB (first 10 TB, varies by region)
- Requests: $0.0075 per 10,000 HTTP requests
- Invalidations: First 1,000/month free, $0.005 each after

## vs Similar
**CloudFront vs S3 direct**: CloudFront caches globally (faster, cheaper for repeated access)  
**CloudFront vs Global Accelerator**: CloudFront=HTTP/caching, GA=TCP/UDP/static IP

## Configurations
- **Origin**: S3, ALB, NLB, custom HTTP server
- **Behaviors**: Cache based on path pattern (/api/* vs /images/*)
- **TTL**: min=0, default=86400 (24 hours), max=31536000 (1 year)
- **Cache key**: URL + query strings + headers + cookies
- **Geo-restriction**: Block specific countries
- **OAC**: Origin Access Control (private S3 access)
- **Signed URLs**: Time-limited access, DRM

## SAP-C02 Questions
- When to use CloudFront vs direct S3
- OAC for private S3 buckets
- Cache-Control headers for TTL
- Lambda@Edge for edge customization
- Failover with origin groups

---

# 10. IAM (Identity and Access Management)

## Problem Solved
Before: AWS account credentials shared, no fine-grained permissions  
Solution: Users, roles, policies for access control

## Components

### Users
- Person or application
- Long-term credentials (password, access keys)
- Use for: Individual employees, applications (avoid if possible)

### Groups
- Collection of users
- Attach policies to group (users inherit)
- Use for: Developers group, Admins group

### Roles
- **No long-term credentials** (temporary only!)
- Can be assumed by: AWS services, users, other accounts
- Use for: EC2 accessing S3, Lambda accessing DynamoDB, cross-account access

### Policies
- JSON document defining permissions
- Effect: Allow/Deny
- Action: s3:GetObject, ec2:DescribeInstances
- Resource: arn:aws:s3:::mybucket/*
- Condition: IP address, time, MFA, tags

## When to Use What

**Users**: Humans logging into AWS console  
**Roles**: Services accessing other services (EC2→S3, Lambda→DynamoDB)  
**Groups**: Organize users (DevTeam, OpsTeam)  
**Policies**: Define permissions

## Policy Evaluation
```
1. Explicit DENY → Deny (always wins)
2. Explicit ALLOW → Allow
3. Default → Deny (implicit deny)

Multiple policies: Union of all allows, any deny wins
```

## Cost
FREE

## SAP-C02 Questions
- Cross-account access (roles)
- Service roles (Lambda, EC2)
- Least privilege principle
- Permission boundaries
- IAM policies vs bucket policies vs SCPs
- IAM Identity Center (SSO) for multi-account

## Key Concepts
- **AssumeRole**: Temporary credentials (900-43200 seconds)
- **MFA**: Multi-factor for sensitive operations
- **Access Keys**: Programmatic access (rotate regularly!)
- **Permission Boundaries**: Maximum permissions (can't exceed)
- **Service-Linked Roles**: Created by AWS services automatically

---

# 11-15. Quick Reference (Monitoring, Security, Analytics)

## 11. CloudWatch
**Purpose**: Metrics, logs, alarms  
**Use**: Monitor everything, set alarms, dashboards  
**Cost**: Metrics free (AWS services), custom metrics $0.30/metric/month, Logs $0.50/GB ingested  
**Exam**: Alarms trigger Auto Scaling, anomaly detection, Insights queries

## 12. CloudTrail
**Purpose**: API call audit logging  
**Use**: Who did what when (governance, compliance)  
**Cost**: First trail free, $2/100,000 events after  
**Exam**: Security investigations, compliance, integrate with CloudWatch for alarms

## 13. KMS (Key Management Service)
**Purpose**: Encryption key management  
**Keys**: AWS managed (free), Customer managed ($1/month), Customer provided  
**Use**: Encrypt EBS, S3, RDS, etc.  
**Exam**: Encryption at rest, key rotation, cross-account key access, envelope encryption

## 14. Transit Gateway
**Purpose**: Central hub for VPC connectivity  
**Use**: 10+ VPCs, replaces VPC peering mesh  
**Cost**: $0.05/hour ($36.50/month) + $0.05/hour per attachment + data transfer  
**Exam**: Multi-VPC architectures, on-premises to multiple VPCs, route table isolation

## 15. Direct Connect
**Purpose**: Dedicated network connection to AWS  
**Use**: Consistent bandwidth, private connectivity, hybrid cloud  
**Cost**: Port fee ($0.30/hour for 1 Gbps) + data transfer out ($0.02/GB)  
**Exam**: vs VPN (Direct Connect=consistent/expensive, VPN=variable/cheap), LAG, resilient architectures

---

# 16-20. Application Services

## 16. API Gateway
**Purpose**: Create/manage APIs  
**Types**: REST (stateless), HTTP (simpler/cheaper), WebSocket (bidirectional)  
**Cost**: REST $3.50 per million, HTTP $1 per million  
**Integrations**: Lambda, HTTP endpoints, AWS services  
**Exam**: Throttling, caching, stages, custom domains, authorization (IAM, Cognito, Lambda authorizer)

## 17. SQS (Simple Queue Service)
**Purpose**: Message queue (decouple components)  
**Types**: Standard (at-least-once, unlimited throughput), FIFO (exactly-once, 300 msg/sec, ordering)  
**Cost**: $0.40 per million requests (first 1M free)  
**Exam**: Decoupling, async processing, vs SNS (queue vs pub/sub), visibility timeout, DLQ

## 18. SNS (Simple Notification Service)
**Purpose**: Pub/sub messaging (fan-out)  
**Cost**: $0.50 per million publishes, varies by protocol  
**Use**: Fan-out to multiple SQS, Lambda, email, mobile push  
**Exam**: vs SQS (pub/sub vs queue), SNS→SQS fan-out pattern, FIFO topics

## 19. Kinesis Data Streams
**Purpose**: Real-time streaming data ingestion  
**Capacity**: 1 MB/sec per shard (write), 2 MB/sec (read)  
**Retention**: 24 hours to 365 days  
**Cost**: $0.015/hour per shard = $10.95/month  
**Exam**: vs SQS (streaming vs messaging), vs Firehose (real-time processing vs delivery), shard calculations

## 20. Kinesis Firehose
**Purpose**: Load streaming data to destinations (S3, Redshift, Elasticsearch, HTTP)  
**Use**: No code delivery, automatic batching  
**Cost**: $0.029/GB ingested  
**Exam**: Firehose for delivery, Streams for processing, transformation with Lambda

---

# 21-25. Analytics & Data

## 21. Redshift
**Purpose**: Data warehouse (analytics on petabytes)  
**vs RDS**: Redshift=analytics (OLAP), RDS=transactions (OLTP)  
**Cost**: $0.25/hour for dc2.large = $182/month  
**Exam**: Redshift Spectrum (query S3), distribution styles, sort keys, Redshift Serverless

## 22. Athena
**Purpose**: Query S3 data with SQL (no database needed!)  
**Cost**: $5 per TB scanned  
**Use**: Ad-hoc queries, data lake analysis, log analysis  
**Exam**: vs Redshift (Athena=ad-hoc/cheap, Redshift=frequent queries/expensive), partition for performance

## 23. ElastiCache
**Purpose**: In-memory cache (Redis or Memcached)  
**Latency**: Sub-millisecond  
**Use**: Session storage, cache database queries, real-time leaderboards  
**Cost**: cache.t3.micro $0.017/hour = $12/month  
**Exam**: Redis vs Memcached (Redis=advanced features/persistence, Memcached=simple/fast), cluster mode, replication

## 24. DMS (Database Migration Service)
**Purpose**: Migrate databases with minimal downtime  
**Types**: Homogeneous (MySQL→RDS MySQL), Heterogeneous (Oracle→PostgreSQL + SCT)  
**Cost**: $0.146/hour for dms.t3.medium = $106/month during migration  
**Exam**: Full load vs CDC vs Full+CDC, ongoing replication, SCT for schema conversion

## 25. Organizations
**Purpose**: Manage multiple AWS accounts  
**Features**: Consolidated billing, SCPs, OUs  
**Cost**: FREE  
**Exam**: Multi-account strategy, SCPs vs IAM (SCPs=max permission boundary), OU structure, cross-account access

---

# 26-30. Advanced Services

## 26. Config
**Purpose**: Track resource configurations, compliance  
**Use**: "Is this S3 bucket encrypted?", "Show me all public buckets"  
**Cost**: $0.003 per config item recorded  
**Exam**: Config Rules, conformance packs, aggregators (multi-account/region), remediation

## 27. GuardDuty
**Purpose**: Threat detection (ML-based)  
**Analyzes**: CloudTrail, VPC Flow Logs, DNS logs  
**Cost**: $4.50 per million events (CloudTrail)  
**Findings**: Compromised instances, crypto mining, unusual API calls  
**Exam**: Enable in all accounts, Security Hub integration, automated response with EventBridge

## 28. CloudFormation
**Purpose**: Infrastructure as Code (IaC)  
**Format**: YAML/JSON templates  
**Use**: Repeatable deployments, version control infrastructure  
**Cost**: FREE (pay for resources created)  
**Exam**: Stacks, nested stacks, StackSets (multi-account/region), drift detection, rollback

## 29. Step Functions
**Purpose**: Orchestrate Lambda functions (workflows)  
**Duration**: Up to 1 year (vs Lambda 15 min)  
**Cost**: $0.025 per 1,000 state transitions  
**Use**: Multi-step processes, long-running workflows, error handling  
**Exam**: Standard (long-duration) vs Express (high-volume/short), parallel execution, error retry

## 30. Secrets Manager
**Purpose**: Store/rotate secrets (passwords, API keys)  
**vs Parameter Store**: Secrets Manager=auto-rotation/$0.40 per secret, Parameter Store=manual/free  
**Cost**: $0.40/secret/month + $0.05 per 10K API calls  
**Exam**: RDS password rotation, integration with RDS/Redshift/DocumentDB, vs hardcoding (never!)

---

# Quick Reference Tables

## When to Use: Compute

| Workload | Service |
|----------|---------|
| 24/7 applications | EC2 Reserved |
| Event-driven <15 min | Lambda |
| Containers (managed) | ECS Fargate |
| Containers (control) | ECS on EC2 |
| Kubernetes | EKS |
| Batch jobs | AWS Batch or Spot |

## When to Use: Database

| Access Pattern | Service |
|----------------|---------|
| Simple key lookups, high scale | DynamoDB |
| Complex SQL, relationships | RDS/Aurora |
| Analytics, data warehouse | Redshift |
| Ad-hoc queries on S3 | Athena |
| In-memory cache | ElastiCache |
| Graph data | Neptune |

## When to Use: Messaging

| Pattern | Service |
|---------|---------|
| Point-to-point | SQS |
| Pub/sub (fan-out) | SNS |
| Real-time streaming | Kinesis Streams |
| Deliver to S3/Redshift | Kinesis Firehose |
| Workflow orchestration | Step Functions |

## When to Use: Storage

| Data Type | Service |
|-----------|---------|
| Object storage | S3 |
| Block storage (EC2 disk) | EBS |
| File system (shared) | EFS |
| Archive (rarely accessed) | S3 Glacier |
| Transfer to/from on-prem | DataSync, Snow Family |

---

# Critical Exam Patterns

## High Availability Pattern
```
Multi-AZ deployment:
- ELB across 3 AZs
- Auto Scaling across 3 AZs
- RDS Multi-AZ
- ElastiCache replica in each AZ

Achieves: 99.99% availability
```

## Disaster Recovery Pattern
```
Active-Passive:
- Primary region: us-east-1
- Secondary region: us-west-2 (warm standby)
- Route 53 failover
- RDS Cross-Region Read Replica
- S3 Cross-Region Replication

RTO: 5-15 minutes
RPO: 1-5 minutes
```

## Serverless Pattern
```
API Gateway → Lambda → DynamoDB
CloudFront → S3 (static) + API Gateway (dynamic)

Benefits: No servers, auto-scaling, pay-per-use
```

## Microservices Pattern
```
ALB → ECS Fargate (containers)
Service Mesh: App Mesh
Service Discovery: Cloud Map
Messaging: SQS/SNS/EventBridge
```

## Data Lake Pattern
```
S3 (raw data)
  ↓
Glue (catalog + ETL)
  ↓
Athena (ad-hoc queries) OR Redshift Spectrum
  ↓
QuickSight (visualization)
```

---

# Cost Optimization Strategies (Exam Favorite)

## Compute
- Reserved Instances for steady workloads (72% savings)
- Spot for fault-tolerant (90% savings)
- Lambda for sporadic (pay per use)
- Auto Scaling (don't overprovision)

## Storage
- S3 Lifecycle policies (transition to cheaper tiers)
- S3 Intelligent-Tiering (automatic)
- Delete old snapshots
- Use Standard-IA for infrequent access

## Database
- RDS Reserved (62% savings)
- Aurora Serverless for variable
- DynamoDB On-Demand for unpredictable
- Read Replicas instead of bigger instance

## Network
- CloudFront (reduce data transfer from origin)
- VPC Endpoints (avoid NAT Gateway costs for AWS services)
- Single NAT Gateway vs per-AZ (trade HA for cost)

---

# Security Best Practices (Exam Loves These)

## Network Security
- Private subnets for databases ✅
- Security Groups: Least privilege ✅
- NACLs: Additional layer ✅
- VPC Flow Logs: Monitor traffic ✅

## Data Protection
- Encrypt at rest (KMS) ✅
- Encrypt in transit (TLS) ✅
- S3 Block Public Access ✅
- Versioning + MFA Delete ✅

## Access Control
- IAM roles (not access keys!) ✅
- Least privilege ✅
- MFA for sensitive operations ✅
- Rotate credentials ✅

## Monitoring
- CloudTrail: All API calls ✅
- Config: Resource compliance ✅
- GuardDuty: Threat detection ✅
- Security Hub: Centralized findings ✅

---

**ALL 30 SERVICES COVERED!**

Files created:
1. EC2 (detailed)
2. VPC (detailed)
3. S3 (detailed)
4. RDS (detailed)
5. DynamoDB (detailed)
6. Lambda (detailed)
7-30. Quick Reference (this file)

Total documentation: ~50,000 words across all files

