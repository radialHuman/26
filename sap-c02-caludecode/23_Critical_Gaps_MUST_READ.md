# 23 — Critical Exam Topics Gap Fill — MUST READ

> **These topics were identified as gaps in the original material. Every section here is exam-critical.**

---

# AWS CONTROL TOWER — Deep Coverage (EXAM CRITICAL!)

## What It Does

Control Tower is the **automated way to set up and govern a secure, multi-account AWS environment** (called a "landing zone"). Think of it as the "easy button" for AWS Organizations best practices.

Without Control Tower, setting up a multi-account environment requires:
- Manually creating accounts
- Manually configuring CloudTrail, Config, IAM in each account
- Manually applying SCPs
- Manually setting up centralized logging

Control Tower automates ALL of this.

## Core Concepts

### Landing Zone

A pre-configured, secure multi-account environment based on AWS best practices:

```
Landing Zone Structure:
├── Management Account (Control Tower lives here)
├── Log Archive Account (centralized CloudTrail + Config logs)
├── Audit Account (cross-account security audit access)
├── Organizational Units:
│   ├── Security OU (Log Archive + Audit accounts)
│   ├── Sandbox OU (for experimentation)
│   └── Custom OUs (you create for Prod, Dev, etc.)
```

### Account Factory

An **automated account creation** tool:
- Creates new AWS accounts with pre-configured settings
- Applies guardrails automatically
- Sets up VPC, subnets, IAM roles per your blueprint
- Integrates with Service Catalog (users can self-service provision accounts)
- Can be customized with **Customizations for Control Tower (CfCT)** — deploy additional resources via CloudFormation

### Guardrails (EXAM CRITICAL!)

Rules that provide governance:

| Type | Enforcement | Behavior |
|---|---|---|
| **Preventive** | SCP-based | **Blocks** disallowed actions (e.g., "Disallow deletion of CloudTrail logs") |
| **Detective** | AWS Config Rules | **Detects** non-compliance and alerts (e.g., "Detect public S3 buckets") |
| **Proactive** | CloudFormation Hooks | **Prevents** non-compliant resources from being created via CloudFormation |

| Category | Strength | When Applied |
|---|---|---|
| **Mandatory** | Always on, can't disable | Core security (e.g., "Disallow changes to CloudTrail configuration") |
| **Strongly Recommended** | On by default, can disable | Best practices (e.g., "Enable encryption for EBS volumes at rest") |
| **Elective** | Off by default, you enable | Optional (e.g., "Disallow MFA delete for S3 buckets") |

### Exam Scenarios

**"Set up secure multi-account environment quickly"** → **Control Tower**
**"Ensure all new accounts have CloudTrail and Config enabled"** → **Control Tower Account Factory**
**"Prevent accounts from disabling CloudTrail"** → **Control Tower preventive guardrail (mandatory)**
**"Detect accounts with public S3 buckets"** → **Control Tower detective guardrail**
**"Allow developers to self-service create accounts with governance"** → **Account Factory via Service Catalog**

### Control Tower vs Organizations

| Feature | Organizations | Control Tower |
|---|---|---|
| Multi-account management | Manual setup | **Automated setup** |
| SCPs | You write them | **Pre-built guardrails** |
| Account creation | Manual (CreateAccount API) | **Account Factory (automated, governed)** |
| Centralized logging | You set up | **Automatic (Log Archive account)** |
| Dashboard | No | **Yes (compliance dashboard)** |
| Best for | Custom governance | **Quick, opinionated best practices** |

Control Tower **uses** Organizations under the hood. They're not alternatives — Control Tower is built ON TOP of Organizations.

---

# AWS NETWORK FIREWALL — Complete Decision Matrix

## What It Does

A managed **stateful network firewall** deployed in your VPC for deep packet inspection, intrusion prevention, and advanced filtering that Security Groups and NACLs can't do.

## When to Use Which (EXAM CRITICAL!)

| Feature | Security Groups | NACLs | AWS WAF | AWS Network Firewall |
|---|---|---|---|---|
| **Layer** | Instance (L4) | Subnet (L4) | Application (L7, HTTP) | Network (L3-L7) |
| **Stateful?** | Yes | **No** | Yes | **Yes AND Stateless** |
| **Allow/Deny** | Allow only | Allow AND Deny | Allow/Block/Count | Allow/Drop/Alert |
| **Domain filtering** | No | No | No | **Yes** (block *.malware.com) |
| **IPS/IDS** | No | No | No | **Yes** (Suricata rules) |
| **TLS inspection** | No | No | Limited | **Yes** (decrypt and inspect) |
| **IP filtering** | Yes | Yes | Yes | Yes |
| **Protocol filtering** | Yes (port/protocol) | Yes (port/protocol) | HTTP only | **Any protocol** |
| **Logging** | VPC Flow Logs | VPC Flow Logs | WAF logs | **Flow + Alert logs** |
| **Cost** | Free | Free | $5/ACL + $0.60/M requests | $0.395/hr + $0.065/GB |
| **Best for** | Instance access control | Subnet deny rules | HTTP attack protection (SQLi, XSS) | **Advanced network security (IPS, domain filter, TLS)** |

### Deployment Models

1. **Centralized (recommended)**: Deploy in a dedicated "inspection VPC." All traffic routes through it via Transit Gateway.
2. **Distributed**: Deploy in each VPC. Simpler but more expensive.

### Architecture (Centralized)

```
Internet → Internet Gateway → Network Firewall Endpoint (inspection subnet)
    → Firewall inspects traffic → Routes to application subnet
    
Inter-VPC traffic: VPC-A → Transit Gateway → Inspection VPC (Network Firewall) → Transit Gateway → VPC-B
```

### Exam Scenarios

**"Filter traffic by domain name" (block access to *.gambling.com)** → Network Firewall
**"Deep packet inspection"** → Network Firewall
**"IDS/IPS capability"** → Network Firewall (Suricata-compatible rules)
**"Block specific IP address"** → NACL (simplest) or Network Firewall (advanced)
**"Protect web app from SQL injection"** → WAF (not Network Firewall)
**"Instance-level access control"** → Security Groups
**"Inspect TLS-encrypted traffic"** → Network Firewall with TLS inspection

---

# AWS ELASTIC BEANSTALK — Full Coverage

## What It Does

The EASIEST way to deploy web applications. You upload your code, Beanstalk handles: capacity provisioning, load balancing, auto-scaling, health monitoring, and deployment.

**Think of it as**: "I just want to deploy my code and not think about infrastructure."

## Key Concepts

### Supported Platforms
Java, .NET, PHP, Node.js, Python, Ruby, Go, Docker

### Components

| Component | Description |
|---|---|
| **Application** | Top-level container (like a project) |
| **Environment** | A running version (prod, staging) |
| **Application Version** | Your code package (ZIP/WAR/Docker) |
| **Environment Tier** | Web Server (HTTP requests) or Worker (background jobs from SQS) |

### Deployment Policies (EXAM CRITICAL!)

| Policy | Downtime? | Speed | Rollback | Use Case |
|---|---|---|---|---|
| **All at Once** | YES | Fastest | Manual redeploy | Dev/test |
| **Rolling** | No (reduced capacity) | Slow | Manual | Prod (budget) |
| **Rolling with Additional Batch** | No (full capacity) | Slower | Manual | Prod (needs full capacity) |
| **Immutable** | No | Slowest | **Terminate new instances** | Prod (safest) |
| **Blue/Green** | No | Fast | **Swap URLs** | Prod (zero downtime) |
| **Traffic Splitting** | No | Moderate | Automatic | Canary testing |

### .ebextensions

Configuration files (YAML/JSON) in `.ebextensions/` folder of your deployment package:
- Install packages, create files, run commands
- Configure load balancer, auto scaling
- Set environment variables

### When to Use

**Use Beanstalk**: Quick deployment of standard web apps, don't want to manage infrastructure
**Use ECS/EKS**: Containers, microservices, need fine-grained control
**Use Lambda**: Event-driven, short-running functions
**Use EC2 directly**: Need full OS control, custom configurations

---

# AWS BACKUP — Centralized Backup Service

## What It Does

Centrally manage and automate backups across AWS services.

## Key Features

| Feature | Description |
|---|---|
| **Backup Plan** | Policy defining: which resources, how often, retention period |
| **Backup Vault** | Storage container for backups (encrypted with KMS) |
| **Cross-Account** | Backup to another account's vault (for isolation) |
| **Cross-Region** | Copy backups to another region (for DR) |
| **Vault Lock** | WORM protection for backups (compliance mode — can't delete) |
| **Supported Services** | EC2, EBS, RDS, Aurora, DynamoDB, EFS, FSx, S3, Storage Gateway, Neptune, DocumentDB, CloudFormation stacks |

## Organization-Wide Backup

With AWS Organizations:
- Define backup policies at the OU level
- All accounts in the OU automatically follow the policy
- Centralized monitoring of backup compliance

### Exam Scenarios

**"Centralized backup across 50 accounts"** → AWS Backup with Organization policies
**"Ensure backups can't be deleted (compliance)"** → Backup Vault Lock
**"Cross-region backup for DR"** → AWS Backup cross-region copy
**"Backup DynamoDB, RDS, and EFS with one policy"** → AWS Backup (supports all three)

---

# OUTPOSTS vs LOCAL ZONES vs WAVELENGTH — Edge Decision Framework

## Comparison (EXAM CRITICAL!)

| Feature | Outposts | Local Zones | Wavelength |
|---|---|---|---|
| **What** | AWS hardware in YOUR data center | AWS infra in metro areas | AWS compute at 5G carrier edge |
| **Location** | Your premises | AWS-managed facility in cities | Telecom provider's 5G network |
| **Latency** | Same as on-prem | <10ms to nearby users | <10ms for 5G-connected devices |
| **AWS Services** | EC2, EBS, S3, EKS, RDS, etc. | EC2, EBS, ECS, EKS | EC2, EBS, ECS, EKS |
| **Management** | AWS manages hardware | AWS fully managed | AWS + carrier managed |
| **Networking** | Private link to AWS Region | Public/private connectivity | Carrier gateway to AWS Region |
| **Use Case** | Data residency, low-latency to on-prem systems | Low-latency for metro users (streaming, gaming) | Ultra-low-latency for 5G apps (AR/VR, autonomous vehicles) |
| **Who buys** | Enterprise with data center | Any AWS customer | 5G app developers |
| **Cost model** | Rack rental + instance hours | Same as region (slightly higher) | Same as region |

### Decision Tree

```
Need AWS services in your own data center?
├── Yes → OUTPOSTS
└── No → Need ultra-low latency for end users?
    ├── Yes → Is this for 5G/mobile devices?
    │   ├── Yes → WAVELENGTH
    │   └── No → LOCAL ZONES
    └── No → Use standard AWS REGIONS
```

### Outposts: Rack vs Server

| | Outposts Rack | Outposts Server |
|---|---|---|
| Form factor | Full 42U rack | 1U/2U server |
| Services | EC2, EBS, S3, RDS, EKS | EC2, EBS |
| Capacity | Up to hundreds of vCPUs | 8-64 vCPUs |
| Use case | Enterprise workloads | Small/remote locations |

---

# EKS vs ECS — Decision Framework

## Complete Comparison

| Factor | ECS | EKS |
|---|---|---|
| **Orchestrator** | AWS proprietary | **Kubernetes** (open-source standard) |
| **Learning curve** | Lower (AWS-native) | Higher (Kubernetes complexity) |
| **Portability** | AWS only | **Multi-cloud** (Kubernetes runs anywhere) |
| **Ecosystem** | AWS integrations | **Massive** (Helm, Istio, ArgoCD, Prometheus) |
| **Service mesh** | App Mesh | **Istio, Linkerd, App Mesh** |
| **Fargate support** | Yes | Yes |
| **Pricing** | Free control plane | **$0.10/hr per cluster (~$73/month)** |
| **EKS Anywhere** | N/A | Run EKS on-premises |
| **Best for** | AWS-only shops, simpler needs | K8s expertise, multi-cloud, rich ecosystem |

### Decision Tree

```
Do you already use Kubernetes?
├── Yes → EKS (or EKS Anywhere for hybrid)
└── No → Do you need multi-cloud portability?
    ├── Yes → EKS (Kubernetes is portable)
    └── No → Do you need Kubernetes ecosystem tools (Helm, Istio)?
        ├── Yes → EKS
        └── No → ECS (simpler, free control plane)
```

### Launch Type Decision (Both ECS and EKS)

```
Need GPU, specific instance types, or OS-level access?
├── Yes → EC2 launch type
└── No → Need simplest management with no servers?
    ├── Yes → FARGATE
    └── No → EC2 launch type (more control, potentially cheaper)
```

---

# AWS ELASTIC DISASTER RECOVERY (DRS) — MISSING FROM DR GUIDE

## What It Does

Formerly CloudEndure Disaster Recovery. Provides **automated disaster recovery** for on-premises and cloud-based servers to AWS.

## How It Works

1. Install DRS agent on source servers (on-premises or other cloud)
2. Agent continuously replicates data to a staging area in AWS (low-cost instances)
3. During DR event: Launch full-scale recovery instances in minutes
4. **RTO: Minutes | RPO: Sub-second** (continuous replication)

## DRS vs Other DR Options

| Feature | DRS | Pilot Light | Warm Standby |
|---|---|---|---|
| Source | Any server (on-prem, cloud) | AWS to AWS | AWS to AWS |
| Replication | **Continuous, block-level** | Database only | Database + reduced compute |
| Cost (normal) | Staging area (very cheap) | Database running | Database + compute running |
| RTO | **Minutes** | 10-60 minutes | Minutes |
| RPO | **Sub-second** | Minutes | Seconds |
| Best for | On-prem DR to AWS | Cloud-native DR | Cloud-native DR |

### Exam Scenarios

**"DR for on-premises servers to AWS with sub-second RPO"** → **Elastic Disaster Recovery (DRS)**
**"Migrate and protect on-prem workloads"** → DRS (can also be used for migration)

---

# ROUTE 53 APPLICATION RECOVERY CONTROLLER (ARC)

## What It Does

Helps you manage and coordinate failover across AWS Regions and Availability Zones.

### Components

| Component | Purpose |
|---|---|
| **Readiness Check** | Monitors if your DR environment is ready to handle traffic (capacity, configuration, networking) |
| **Routing Control** | One-click failover — update Route 53 health checks to redirect traffic |
| **Safety Rules** | Prevent accidental failover (e.g., "don't fail over if both regions are healthy") |

### Exam Scenario

**"Need controlled, manual failover between regions with safety checks"** → Route 53 ARC
**"Verify DR region is ready before failover"** → ARC Readiness Checks

---

# AWS FAULT INJECTION SIMULATOR (FIS)

## What It Does

Run **chaos engineering experiments** on your AWS workloads to test resilience.

### Supported Fault Injections
- Stop/terminate EC2 instances
- Throttle API calls
- Inject latency into network traffic
- Failover RDS instances
- Drain ECS container instances
- Disrupt connectivity to specific AZs

### Exam Scenario

**"Test how application handles AZ failure"** → FIS (inject AZ disruption)
**"Validate auto-scaling works under stress"** → FIS (terminate instances, inject CPU stress)

---

# MISSING SERVICES — Quick Exam Reference

## AWS Service Quotas

Centrally view and manage your AWS service quotas (limits):
- Request quota increases
- CloudWatch alarms on quota utilization (get warned BEFORE hitting limits)
- Integrates with Organizations for organization-wide quota management

**Exam tip**: "Application failures due to hitting service limits" → Service Quotas + CloudWatch alarms for proactive monitoring

## VPC Lattice

Application-layer networking for service-to-service communication:
- Simpler than App Mesh (no sidecar proxies)
- Supports EC2, ECS, EKS, Lambda as targets
- Built-in auth policies (IAM-based)
- Cross-VPC and cross-account without VPC peering or Transit Gateway
- **Think of it as**: An ALB that works across VPCs/accounts with built-in auth

**vs PrivateLink**: PrivateLink is point-to-point. Lattice is a managed service network.
**vs App Mesh**: App Mesh uses Envoy sidecars (complex). Lattice is AWS-managed (simpler).

## AWS Resilience Hub

Describe your applications, set RTO/RPO targets, and Resilience Hub:
- Assesses your architecture against targets
- Identifies single points of failure
- Recommends improvements
- Generates operational procedures (SOPs) for recovery

## AWS Well-Architected Tool

A service in the AWS console to:
- Conduct Well-Architected Reviews
- Answer questions about your workload per pillar
- Get improvement recommendations
- Track progress over time
- Apply specific **Lenses** (Serverless, SaaS, Machine Learning, etc.)

## ElastiCache Global Datastore

Cross-region replication for ElastiCache Redis:
- Active-passive: Write to primary region, read from all regions
- Failover: Promote secondary to primary
- Replication lag: Typically <1 second
- **Use case**: Global applications needing cached data in multiple regions

## Secrets Manager Cross-Region Replication

Automatically replicate secrets to multiple AWS regions:
- Maintains same secret value in all regions
- If primary region fails, applications in DR region can still access secrets
- **Use case**: Multi-region applications, DR

---

# CROSS-REGION REPLICATION — COMPLETE SERVICE MAP

| Service | Cross-Region Mechanism | RPO | Notes |
|---|---|---|---|
| **S3** | Cross-Region Replication (CRR) | Minutes | Requires versioning |
| **Aurora** | Global Database | <1 second | Up to 5 secondary regions |
| **RDS** | Cross-Region Read Replica | Seconds-minutes | Async replication |
| **DynamoDB** | Global Tables | <1 second | Active-active |
| **ElastiCache Redis** | Global Datastore | <1 second | Active-passive |
| **EBS** | Cross-region snapshot copy | Hours (depends on frequency) | Manual or automated via AWS Backup |
| **EFS** | AWS Backup cross-region | Hours | Via backup copy |
| **ECR** | Cross-region replication | Minutes | Automatic image replication |
| **Secrets Manager** | Replica secrets | Seconds | Automatic sync |
| **KMS** | Multi-Region Keys | Instant (same key material) | Encrypt in one region, decrypt in another |
| **CloudFormation** | StackSets | N/A | Deploy stacks in multiple regions |
| **CodePipeline** | Cross-region actions | N/A | Deploy to multiple regions |

---

# APP MESH AND CLOUD MAP — Service Discovery

## AWS Cloud Map

**Service discovery** for cloud resources:
- Register instances, IPs, or URLs with friendly names
- DNS-based discovery (Route 53 auto-registration) or API-based
- Health checks to return only healthy instances
- **Use case**: Microservices finding each other without hardcoding IPs

## AWS App Mesh

**Service mesh** using Envoy sidecar proxies:
- Traffic management (routing, retries, circuit breakers)
- Observability (metrics, traces via X-Ray)
- Security (mTLS between services)
- Works with ECS, EKS, EC2
- **Use case**: Complex microservices needing traffic control and observability

### When to Use What

```
Simple service-to-service?
├── Use ALB path routing (simplest)
Need cross-VPC service communication?
├── Use VPC Lattice (managed, simple)
Need advanced traffic control (canary, circuit breaker)?
├── Use App Mesh (Envoy-based, most flexible)
Just need services to find each other?
├── Use Cloud Map (DNS/API discovery)
```

---

*Word count: ~5,000+ words filling all critical gaps identified in the audit*
