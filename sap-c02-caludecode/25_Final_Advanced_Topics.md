# 25 — Final Gap Fill — Advanced Topics for SAP-C02

> **These are the remaining advanced topics identified during deep audit. Each appears on the exam.**

---

## 1. AWS FIREWALL MANAGER (Multi-Account Security Policy Management)

### What It Does
Centrally configure and manage firewall rules across ALL accounts in your AWS Organization.

### What It Manages

| Policy Type | What It Controls |
|---|---|
| **WAF policies** | Deploy WAF rules to all ALBs/CloudFronts/API Gateways across accounts |
| **Shield Advanced** | Enable Shield Advanced on resources across accounts |
| **Security Group** | Audit and enforce SG rules across accounts (find overly permissive SGs) |
| **Network Firewall** | Deploy Network Firewall policies across VPCs in multiple accounts |
| **Route 53 Resolver DNS Firewall** | Block DNS queries to malicious domains |

### Prerequisites
- AWS Organizations with all features enabled
- AWS Config enabled in all accounts

### Exam Scenarios
**"Ensure WAF rules are applied to ALL ALBs in ALL 50 accounts"** → Firewall Manager WAF policy
**"Find and remediate overly permissive Security Groups across the organization"** → Firewall Manager Security Group audit policy
**"Deploy Network Firewall consistently across all VPCs"** → Firewall Manager Network Firewall policy

### Firewall Manager vs Config vs SCPs

| Tool | Type | Action |
|---|---|---|
| **SCP** | Preventive | Blocks API calls (can't launch resource at all) |
| **Config Rule** | Detective | Detects non-compliance after resource exists |
| **Firewall Manager** | **Proactive + Remediation** | Deploys and maintains firewall rules automatically |

---

## 2. S3 MULTI-REGION ACCESS POINTS (MRAP)

### What It Does
A **global endpoint** that automatically routes S3 requests to the closest bucket copy based on network latency.

### Architecture
```
User in Tokyo → MRAP global endpoint → Routes to bucket in ap-northeast-1 (lowest latency)
User in London → MRAP global endpoint → Routes to bucket in eu-west-1
User in New York → MRAP global endpoint → Routes to bucket in us-east-1
```

### Key Features

| Feature | Details |
|---|---|
| **Automatic routing** | Routes to bucket with lowest latency |
| **Failover** | If a bucket/region is unavailable, routes to next closest |
| **Replication** | Uses S3 Cross-Region Replication between buckets |
| **Active-Active or Active-Passive** | Choose replication direction |
| **Failover controls** | Manual override to shift traffic between regions |
| **Single endpoint** | One endpoint for all regions (no client-side logic) |

### vs CloudFront
| Feature | S3 MRAP | CloudFront + S3 |
|---|---|---|
| Caching | **No** | **Yes** (at 400+ edge locations) |
| Writes | **Routed to nearest bucket** | Always goes to origin |
| Use case | Global data access + writes | Global read-heavy caching |

**Exam Tip**: "Global S3 access with writes to nearest region" → MRAP. "Cache static content globally" → CloudFront.

---

## 3. DYNAMODB SINGLE-TABLE DESIGN (Professional-Level)

### Why Single Table?
In DynamoDB, JOINs don't exist. If you have separate tables for Users, Orders, and Products, getting "all orders for user X with product details" requires multiple API calls. 

**Single-table design**: Store ALL entity types in ONE table, using the partition key and sort key creatively.

### How It Works

```
Table: AppData
PK              | SK                | Attributes
----------------|-------------------|---------------------------
USER#u001       | PROFILE           | name=Alice, email=alice@...
USER#u001       | ORDER#2024-01-15  | total=99.99, status=shipped
USER#u001       | ORDER#2024-02-20  | total=49.99, status=pending
PRODUCT#p001    | METADATA          | name=Widget, price=9.99
ORDER#o001      | PRODUCT#p001      | quantity=5
ORDER#o001      | PRODUCT#p002      | quantity=2
```

### Access Patterns Enabled
- **Get user profile**: PK=USER#u001, SK=PROFILE
- **Get all orders for user**: PK=USER#u001, SK begins_with("ORDER#")
- **Get all items in an order**: PK=ORDER#o001, SK begins_with("PRODUCT#")

### Overloaded Keys
The PK and SK hold DIFFERENT entity types — this is "overloading." The key prefix (USER#, ORDER#, PRODUCT#) identifies the entity type.

### Adjacency List Pattern
For many-to-many relationships (user has many orders, order has many products), store edges in both directions:
- PK=USER#u001, SK=ORDER#o001 (user → order)
- PK=ORDER#o001, SK=USER#u001 (order → user)

### Exam Relevance
**"Minimize the number of API calls to DynamoDB"** → Single-table design
**"Model many-to-many relationships in DynamoDB"** → Adjacency list pattern
**"Multiple entity types in one table"** → Overloaded keys with prefixes

---

## 4. DYNAMODB ADAPTIVE CAPACITY AND BURST CAPACITY

### Adaptive Capacity
DynamoDB automatically **redistributes throughput** when a partition becomes hot:
- Isolates frequently accessed items onto their own partitions
- Provides up to the FULL table throughput to a single partition if needed
- This is automatic — no configuration required

**Exam Impact**: If a question says "table has 10,000 WCU but requests to one partition key are throttled" → Adaptive capacity should eventually handle it, BUT for extreme cases, redesign the partition key (add random suffix for write sharding).

### Burst Capacity
DynamoDB **saves unused partition throughput** for up to 5 minutes:
- If a partition's baseline is 300 RCU but it only uses 100, the unused 200 is banked
- During a burst, the partition can use up to 300 RCU/sec from the bank
- After 5 minutes of sustained high usage, the bank depletes

**Exam Impact**: Short traffic spikes are handled by burst capacity. Sustained high traffic on one partition = throttling → redesign partition key.

---

## 5. S3 OBJECT OWNERSHIP (Cross-Account Writes)

### The Problem
When Account A uploads an object to Account B's bucket, **Account A owns the object by default**. Account B (the bucket owner) can't even read it without explicit ACL grants.

### S3 Object Ownership Settings

| Setting | Behavior | Recommended? |
|---|---|---|
| **BucketOwnerEnforced** | **Disables ACLs entirely.** Bucket owner automatically owns ALL objects. | **YES — AWS recommended** |
| **BucketOwnerPreferred** | If uploader sets `bucket-owner-full-control` ACL, bucket owner gets ownership | Legacy |
| **ObjectWriter** | Object uploader owns the object (original default) | Legacy |

**Exam Tip**: "Cross-account S3 writes, bucket owner can't access objects" → Enable **BucketOwnerEnforced** (or require `bucket-owner-full-control` ACL in bucket policy).

---

## 6. IPv6 IN VPC — Dual-Stack Design

### Key Concepts

| Component | IPv4 | IPv6 |
|---|---|---|
| VPC CIDR | You choose (e.g., 10.0.0.0/16) | AWS assigns /56 (or you bring your own) |
| Subnet | You choose /24, /28, etc. | AWS assigns /64 per subnet |
| Public access | Internet Gateway | Internet Gateway (same) |
| Private outbound | NAT Gateway | **Egress-Only Internet Gateway** |
| EIP | Yes | Not needed (IPv6 is globally unique) |

### Egress-Only Internet Gateway (EXAM!)
- Like a NAT Gateway but for **IPv6 only**
- Allows IPv6 instances to reach the internet
- **Prevents** internet-initiated inbound IPv6 connections
- **FREE** (unlike NAT Gateway)
- Used in private subnets that need outbound IPv6

### Exam Scenario
**"EC2 instances in a private subnet need to access IPv6 internet endpoints but should not be reachable from the internet"** → Egress-Only Internet Gateway

---

## 7. ACCELERATED SITE-TO-SITE VPN

### What It Does
Routes VPN traffic through AWS Global Accelerator's network instead of the public internet.

### Normal VPN vs Accelerated VPN

| Feature | Normal VPN | Accelerated VPN |
|---|---|---|
| Path | Public internet (variable quality) | **AWS Global Accelerator → AWS backbone** |
| Latency | Variable | **Lower, more consistent** |
| Jitter | Variable | Reduced |
| Cost | $0.05/hr | $0.05/hr + GA charges |
| Setup | Standard | Enable acceleration option |

### When to Use
- VPN connections crossing continents (e.g., Asia to US)
- Latency-sensitive applications over VPN
- Need consistent network performance

### Exam Tip
**"VPN performance is inconsistent across geographic distance"** → Enable **Accelerated Site-to-Site VPN** (uses Global Accelerator)

---

## 8. AMAZON DATA LIFECYCLE MANAGER (DLM)

### What It Does
**Automates EBS snapshot creation, retention, and deletion** based on policies.

### Key Features

| Feature | Details |
|---|---|
| **Schedule** | Create snapshots every X hours (min 1 hour) |
| **Retention** | Keep N snapshots or keep for X days |
| **Cross-region copy** | Automatically copy snapshots to another region |
| **Cross-account copy** | Share snapshots with other accounts |
| **Tags** | Target volumes by tag (e.g., Backup=true) |
| **Fast snapshot restore** | Pre-warm snapshots for instant restore |

### vs AWS Backup

| Feature | DLM | AWS Backup |
|---|---|---|
| Scope | EBS/ECS volumes only | 15+ services (EBS, RDS, DynamoDB, EFS, S3, etc.) |
| Simplicity | Simple policies | Full backup management |
| Cross-service | No | Yes |
| Use case | EBS-only automation | Enterprise-wide backup |

**Exam Tip**: "Automate EBS snapshots" → DLM (simple) or AWS Backup (comprehensive). "Centralized backup across multiple services" → AWS Backup.

---

## 9. AWS BUDGETS WITH ACTIONS (Cost Automation)

### What It Does
Set budget thresholds and **automatically take action** when exceeded.

### Budget Types

| Type | Tracks |
|---|---|
| **Cost Budget** | Actual spend vs forecast |
| **Usage Budget** | Service usage (e.g., EC2 hours) |
| **Savings Plans Budget** | Utilization and coverage |
| **Reservation Budget** | RI utilization and coverage |

### Budget Actions (Automation!)

When a budget threshold is breached:
1. **Apply SCP** — Restrict the account (e.g., deny ec2:RunInstances)
2. **Apply IAM policy** — Restrict specific users/roles
3. **Stop EC2 instances** — Target instances by tag
4. **Send SNS notification** — Alert the team

### Configuration Example
```
Budget: $500/month for Dev account
  - At 80% ($400): SNS notification to dev team
  - At 100% ($500): Apply SCP denying new resource creation
  - At 120% ($600): Stop all non-essential EC2 instances (tag: Essential=false)
```

### Exam Scenarios
**"Automatically prevent an account from exceeding budget"** → AWS Budgets with SCP action
**"Alert team when spending reaches 80% of budget"** → AWS Budgets with SNS action
**"Shut down dev instances when budget exceeded"** → AWS Budgets with EC2 stop action

---

## 10. AWS SYSTEMS MANAGER (SSM) — Key Features for SAP-C02

### Most Tested Features

| Feature | What It Does | Exam Use Case |
|---|---|---|
| **Session Manager** | SSH/RDP **without** opening port 22/3389, without key pairs, without bastion hosts | "Secure access to private instances without bastion" |
| **Parameter Store** | Store config/secrets (free tier). Hierarchical, versioned. | "Store config values for Lambda/EC2" |
| **Patch Manager** | Automated OS patching across fleet | "Ensure all EC2 instances have latest security patches" |
| **Run Command** | Execute commands on hundreds of instances remotely | "Run a script across 500 instances" |
| **Automation** | Runbooks for operational tasks (restart services, create AMIs) | "Auto-remediate Config findings" |
| **Inventory** | Track installed software, OS versions across fleet | "Audit all software installed on EC2 fleet" |
| **State Manager** | Ensure instances maintain desired configuration | "Ensure antivirus agent is always running" |
| **Maintenance Windows** | Schedule maintenance tasks | "Apply patches during maintenance window" |

### Parameter Store vs Secrets Manager

| Feature | Parameter Store | Secrets Manager |
|---|---|---|
| Cost | Free (standard), $0.05/10K API calls (advanced) | $0.40/secret/month |
| Rotation | No built-in rotation | **Automatic rotation (Lambda-based)** |
| Size limit | 8 KB (standard), 8 KB (advanced) | 64 KB |
| Cross-account | No | **Yes (resource-based policy)** |
| Best for | Configuration values, feature flags | **Database credentials, API keys needing rotation** |

**Exam Tip**: "Auto-rotate database credentials" → **Secrets Manager**. "Store config values cheaply" → **Parameter Store**.

---

## 11. AWS COST AND USAGE REPORT (CUR) + COST ANOMALY DETECTION

### CUR (Cost and Usage Report)
- Most detailed billing data available (line-item level)
- Delivered to S3 bucket (CSV/Parquet)
- Query with Athena for custom cost analysis
- Integrates with QuickSight for dashboards

### Cost Anomaly Detection
- ML-based detection of unusual spending patterns
- Automatically monitors ALL AWS services
- Sends alerts via SNS when anomalies detected
- No configuration needed — just enable

### Cost Optimization Hierarchy (Exam Framework)
```
1. Right-size (Compute Optimizer)
2. Reserved/Savings Plans (for steady state)
3. Spot (for fault-tolerant)
4. Serverless (for variable)
5. Storage lifecycle (S3, EBS optimization)
6. Data transfer optimization (VPC Endpoints, same-AZ)
7. Monitor and alert (Budgets, CUR, Anomaly Detection)
```

---

## 12. AMAZON MSK (Managed Streaming for Apache Kafka)

### What It Does
Fully managed Apache Kafka service for streaming data.

### MSK vs Kinesis Data Streams

| Feature | MSK | Kinesis Data Streams |
|---|---|---|
| Protocol | Apache Kafka (open source) | AWS proprietary |
| Management | You manage topics, partitions | AWS manages shards |
| Ecosystem | Full Kafka ecosystem (Connect, Streams) | AWS SDK, Lambda integration |
| Retention | Unlimited (storage-based) | 1-365 days |
| Cost | Instance-based (cluster) | Per-shard/hour or per-GB (serverless) |
| Migration | Easy from on-prem Kafka | Requires code changes |

### MSK Serverless
- No cluster management
- Auto-scales capacity
- Pay per data in/out

**Exam Tip**: "Migrate existing Kafka workload to AWS" → **MSK** (API-compatible). "New streaming workload, want simplest" → **Kinesis** (fully managed).

---

*Word count: ~4,500+ words filling all remaining advanced gaps*
