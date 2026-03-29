# SAP-C02 Service Integration Architectures - 20 Real-World Patterns

## Architecture 1: Three-Tier Web Application (High Availability)

### Complete Architecture
```
Internet
  ↓
Route 53 (DNS: example.com → ALB)
  ↓
CloudFront (CDN for static assets)
  ├→ S3 (static: HTML, CSS, JS, images)
  └→ ALB (dynamic API requests)
      ↓
      Multi-AZ across us-east-1a, 1b, 1c
      ↓
      Target Group: Web Tier
      ├→ EC2 Auto Scaling Group (2-10 instances)
      │  ├→ us-east-1a: 2 instances
      │  ├→ us-east-1b: 2 instances
      │  └→ us-east-1c: 2 instances
      ↓
      Application queries
      ↓
      RDS PostgreSQL Multi-AZ
      ├→ Primary (us-east-1a)
      ├→ Standby (us-east-1b)
      └→ Read Replica (us-east-1c) for reports
      ↓
      ElastiCache Redis (session storage)
      ├→ Primary (us-east-1a)
      └→ Replica (us-east-1b, 1c)
```

### Services Used
- Route 53 (DNS)
- CloudFront (CDN)
- S3 (static assets)
- ALB (load balancing)
- Auto Scaling (instance management)
- EC2 (compute)
- RDS Multi-AZ (database HA)
- RDS Read Replica (read scaling)
- ElastiCache (caching + sessions)

### Networking Details
**VPC:** 10.0.0.0/16
**Public Subnets:**
- 10.0.1.0/24 (us-east-1a) - ALB, NAT Gateway
- 10.0.2.0/24 (us-east-1b) - ALB, NAT Gateway
- 10.0.3.0/24 (us-east-1c) - ALB, NAT Gateway

**Private Subnets (Web Tier):**
- 10.0.11.0/24 (us-east-1a) - EC2 instances
- 10.0.12.0/24 (us-east-1b) - EC2 instances
- 10.0.13.0/24 (us-east-1c) - EC2 instances

**Private Subnets (Database Tier):**
- 10.0.21.0/24 (us-east-1a) - RDS primary, ElastiCache primary
- 10.0.22.0/24 (us-east-1b) - RDS standby, ElastiCache replica
- 10.0.23.0/24 (us-east-1c) - RDS read replica, ElastiCache replica

### Security Configuration
**ALB Security Group:**
- Inbound: 443 from 0.0.0.0/0
- Outbound: 80 to Web-Tier-SG

**Web Tier Security Group:**
- Inbound: 80 from ALB-SG
- Outbound: 5432 to DB-SG, 6379 to Cache-SG, 443 to 0.0.0.0/0 (for API calls)

**Database Security Group:**
- Inbound: 5432 from Web-Tier-SG only
- Outbound: None needed

**Cache Security Group:**
- Inbound: 6379 from Web-Tier-SG only

### IAM Roles
**EC2 Instance Role:** S3 read (for assets), CloudWatch write (logs/metrics), Secrets Manager read (DB password)

### Monitoring
- CloudWatch: CPU, memory, disk, network per instance
- CloudWatch Logs: Application logs from all instances
- CloudWatch Alarms: UnhealthyHostCount > 0 → SNS alert
- RDS Performance Insights: Slow query detection

### Cost (Monthly)
- Route 53: $0.50 + $5 (queries)
- CloudFront: $50 (1 TB)
- S3: $23 (1 TB)
- ALB: $250 (with traffic)
- EC2 (5 t3.medium Reserved): $165
- RDS (db.m5.large Multi-AZ Reserved): $212
- Read Replica: $106
- ElastiCache (cache.r6g.large): $147
**Total: ~$958/month** (with Reserved Instances)

### Disaster Recovery
**RPO:** 1 minute (RDS automated backups + ElastiCache replica)  
**RTO:** 2 minutes (Multi-AZ automatic failover)  
**Backup:** Daily RDS snapshots retained 7 days, cross-region copy to us-west-2

---

## Architecture 2: Serverless Web Application

### Complete Architecture
```
User Browser
  ↓
Route 53: example.com
  ↓
CloudFront Distribution
  ├→ S3: React SPA (index.html, app.js, assets)
  └→ API Gateway: /api/*
      ↓
      API Gateway (REST API)
      ├→ /users → Lambda (UserFunction) → DynamoDB (Users table)
      ├→ /orders → Lambda (OrderFunction) → DynamoDB (Orders table)
      └→ /reports → Lambda (ReportFunction) → S3 (generated PDFs)
          ↓
          SQS Queue: ReportQueue
          ↓
          Lambda (Background worker)
          ↓
          S3: Generated reports
```

### Services Used
- Route 53, CloudFront, S3 (frontend)
- API Gateway (API layer)
- Lambda (compute - no servers!)
- DynamoDB (database)
- SQS (async processing)
- S3 (file storage)
- Cognito (user authentication - added)
- CloudWatch (monitoring)

### Authentication Flow
```
User signs up
  ↓
Cognito User Pool (manages users)
  ↓
API Gateway Authorizer (validates JWT token)
  ↓
Lambda (processes authenticated request)
```

### Data Flow Example
```
User clicks "Generate Report":
1. Frontend → API Gateway /reports (POST)
2. API Gateway validates token (Cognito)
3. Lambda (ReportFunction):
   - Validates request
   - Sends message to SQS: {"userId": "123", "reportType": "monthly"}
   - Returns: {"status": "queued", "requestId": "abc"}
4. User gets immediate response (async processing)

Background (seconds later):
5. SQS triggers Lambda (Background worker)
6. Lambda:
   - Queries DynamoDB (user's data)
   - Generates PDF report
   - Uploads to S3
   - Updates DynamoDB (report status: "ready")
7. SNS notification sent to user (report ready)
```

### Cost (Monthly, 100K users, 1M API calls/month)
- S3: $23 (static files)
- CloudFront: $15
- API Gateway: $3.50 (1M REST requests)
- Lambda: $20 (compute)
- DynamoDB: $25 (On-Demand)
- Cognito: $50 (50K MAU)
- SQS: $0.40
**Total: ~$137/month** (vs $500+ with EC2)

### Scaling Characteristics
- Lambda: 0 to 1,000 concurrent executions automatically
- DynamoDB: Auto-scales to any throughput
- API Gateway: Handles 10,000 req/sec per region
- No server management
- True pay-per-use

---

## Architecture 3: Real-Time Data Analytics Platform

### Complete Architecture
```
Data Producers (IoT devices, applications, logs)
  ↓
Kinesis Data Streams (50,000 records/sec)
  ├→ Consumer 1: Lambda → DynamoDB (current state)
  ├→ Consumer 2: Lambda → ElastiCache (real-time dashboard)
  ├→ Consumer 3: Kinesis Data Analytics (SQL processing)
  │   ↓
  │   Kinesis Data Streams (processed data)
  │   ↓
  │   Lambda → SNS (alerts for anomalies)
  └→ Consumer 4: Kinesis Firehose
      ↓
      Transform (Lambda - anonymize PII)
      ↓
      S3 (data lake)
      ├→ Raw data in Parquet format
      ├→ Partitioned: year/month/day/hour
      └→ Lifecycle: 30 days Standard → Glacier Instant
          ↓
          Glue Crawler (creates schema)
          ↓
          Glue Data Catalog
          ├→ Athena (ad-hoc SQL queries)
          └→ Redshift Spectrum (complex analytics)
              ↓
              QuickSight (BI dashboards)
```

### Data Flow Timeline
```
t=0ms: IoT device sends event
t=50ms: Kinesis receives, distributes to shards
t=100ms: Lambda 1 processes, writes to DynamoDB
t=150ms: Lambda 2 updates ElastiCache (real-time dashboard shows)
t=200ms: Kinesis Analytics detects anomaly
t=250ms: SNS sends alert to operations team
t=60000ms (1 min): Firehose batch writes to S3
t=300000ms (5 min): Glue Crawler updates schema
t=instant: Athena can query new data
```

### Services Used
- Kinesis Data Streams (ingestion)
- Lambda (processing)
- DynamoDB (current state)
- ElastiCache (real-time cache)
- Kinesis Data Analytics (stream SQL)
- SNS (alerting)
- Kinesis Firehose (S3 delivery)
- S3 (data lake)
- Glue (catalog)
- Athena (queries)
- Redshift Spectrum (analytics)
- QuickSight (visualization)

### Cost (100M events/day)
- Kinesis Streams (50 shards): $548/month
- Lambda (processing): $100/month
- DynamoDB (On-Demand): $150/month
- ElastiCache: $147/month
- Firehose: $435/month (15 TB)
- S3: $345/month (15 TB Standard)
- Glue Crawler: $0.44/hour when running
- Athena: Pay per query (~$50/month for 500 queries)
**Total: ~$1,775/month**

---

## Architecture 4: Multi-Region Active-Passive DR

### Complete Architecture
```
Primary Region (us-east-1):
  Route 53 (Failover Primary)
  ↓
  CloudFront → ALB
  ↓
  Auto Scaling Group (EC2)
  ↓
  RDS Multi-AZ (Primary)
  ├→ Automated backups
  └→ Cross-Region Read Replica → us-west-2
  ↓
  S3 (application data)
  └→ Cross-Region Replication → us-west-2

Secondary Region (us-west-2 - Warm Standby):
  Route 53 (Failover Secondary)
  ↓
  CloudFront (same distribution, multi-origin)
  ↓
  ALB (ready)
  ↓
  Auto Scaling (Min: 1, Desired: 2, Max: 10)
  ├→ Smaller capacity than primary
  └→ Can scale up during failover
  ↓
  RDS Read Replica (can be promoted)
  ↓
  S3 Replica bucket

Failover Process:
1. Route 53 health check fails on us-east-1 ALB (30 sec)
2. Route 53 switches to us-west-2 (DNS TTL: 60 sec)
3. Auto Scaling in us-west-2 scales to match primary (2 min)
4. Promote Read Replica to standalone (3 min)
5. Total RTO: ~6 minutes
6. RPO: ~1 minute (replication lag)
```

### Services Used
- Route 53 (failover routing + health checks)
- CloudFront (multi-region origin failover)
- 2x ALB (each region)
- 2x Auto Scaling Groups
- 2x RDS (Multi-AZ primary + promoted replica)
- 2x S3 (CRR)
- CloudWatch (monitoring both regions)

### Cost
**Primary region:** $958/month (from Architecture 1)  
**Secondary region:** $450/month (smaller capacity)  
**Data replication:** $100/month (RDS + S3 CRR)  
**Total DR cost:** $550/month (insurance against regional failure)  
**Business value:** Prevents $100K+ revenue loss from extended outage

---

## Architecture 5: Serverless Event-Driven Microservices

### Complete Architecture
```
API Gateway (HTTP API)
  ├→ POST /orders → Lambda (CreateOrder)
  ├→ GET /orders → Lambda (GetOrders)
  └→ PUT /orders/{id} → Lambda (UpdateOrder)
      ↓
      DynamoDB (Orders table)
      ↓
      DynamoDB Streams (change capture)
      ↓
      Lambda (Stream processor)
      ├→ Order created? → SNS Topic (OrderCreated)
      │   ├→ SQS: InventoryQueue → Lambda (UpdateInventory) → DynamoDB (Inventory)
      │   ├→ SQS: EmailQueue → Lambda (SendEmail) → SES
      │   ├→ SQS: AnalyticsQueue → Lambda → S3 (analytics data)
      │   └→ EventBridge rule → Step Functions (multi-step fulfillment)
      │       ├→ Lambda (ValidatePayment)
      │       ├→ Lambda (ReserveInventory)
      │       ├→ Wait (30 sec)
      │       ├→ Choice (payment success?)
      │       ├→ Lambda (ConfirmOrder) or Lambda (CancelOrder)
      │       └→ SNS (notify customer)
      └→ Order updated? → Lambda → ElastiCache (invalidate cache)
```

### Event Flow
```
1. User places order (API Gateway POST /orders)
2. Lambda creates order in DynamoDB
3. DynamoDB Stream triggers processing Lambda
4. SNS fan-out to 4 SQS queues (parallel processing):
   - Inventory update (immediate)
   - Email notification (async)
   - Analytics logging (eventual)
   - Step Functions workflow (complex multi-step)
5. Step Functions orchestrates payment → inventory → confirmation
6. All async, user gets immediate response
```

### Services Integration
- API Gateway ↔ Lambda (HTTP → function invocation)
- Lambda ↔ DynamoDB (IAM role, no credentials)
- DynamoDB Streams ↔ Lambda (event source mapping)
- Lambda ↔ SNS (publish messages)
- SNS ↔ SQS (fan-out pattern)
- SQS ↔ Lambda (poll-based trigger)
- Lambda ↔ Step Functions (start execution)
- Step Functions ↔ Multiple Lambdas (orchestration)

### Monitoring
- X-Ray (distributed tracing across all services)
- CloudWatch Logs (all Lambda logs)
- CloudWatch metrics (custom business metrics)
- CloudWatch Insights (query logs across functions)
- Step Functions execution history (audit trail)

### Cost (1M orders/month)
- API Gateway HTTP: $1 (1M requests)
- Lambda (7 functions): $50
- DynamoDB: $75 (On-Demand)
- SNS: $0.50
- SQS: $0.40
- Step Functions: $25 (1M state transitions)
- ElastiCache: $12 (small instance)
**Total: ~$164/month** (extreme cost efficiency)

---

## Architecture 6: Hybrid Cloud with Direct Connect

### Complete Architecture
```
On-Premises Data Center
  ├→ Corporate DNS (192.168.1.10)
  ├→ Active Directory (192.168.1.100)
  └→ Application Servers (192.168.10.0/24)
      ↓
      Direct Connect (1 Gbps dedicated fiber)
      ├→ Primary: DX Location 1 (New York)
      └→ Backup: VPN over internet
          ↓
          AWS Virtual Private Gateway (attached to VPC)
          ↓
          Transit Gateway (central routing hub)
          ├→ Production VPC (10.0.0.0/16)
          │   ├→ Private subnets (apps, databases)
          │   ├→ Route 53 Resolver Inbound Endpoint (DNS from on-prem)
          │   └→ Route 53 Resolver Outbound Endpoint (DNS to on-prem)
          │       ├→ Forwarding rules: *.onprem.local → 192.168.1.10
          │       └→ Conditional forwarding
          ├→ Development VPC (10.1.0.0/16)
          ├→ Shared Services VPC (10.2.0.0/16)
          │   ├→ AWS Managed AD (synced with on-prem AD)
          │   ├→ Centralized logging (CloudWatch)
          │   └→ Centralized security (GuardDuty, Security Hub)
          └→ Egress VPC (10.3.0.0/16)
              └→ Centralized NAT Gateway / Firewall

Storage Gateway (on-prem):
  ↓
  S3 (cloud backup of on-prem files)
  
AWS Backup:
  ├→ Backup on-prem VMs
  └→ Backup AWS resources (EBS, RDS, DynamoDB)
```

### Routing Configuration
**Transit Gateway Route Tables:**

Production Route Table:
- 10.0.0.0/16 → Production VPC ✅
- 10.2.0.0/16 → Shared Services VPC ✅
- 192.168.0.0/16 → Virtual Private Gateway (on-prem) ✅
- 0.0.0.0/0 → Egress VPC (for internet) ✅
- 10.1.0.0/16 → BLACKHOLE (Dev isolated) ❌

Development Route Table:
- 10.1.0.0/16 → Development VPC ✅
- 10.2.0.0/16 → Shared Services VPC ✅
- 192.168.0.0/16 → Virtual Private Gateway ✅ (can access on-prem for testing)
- 10.0.0.0/16 → BLACKHOLE (Prod isolated) ❌

### DNS Resolution
**On-prem → AWS:**
```
Query: database.aws.internal
  ↓
On-prem DNS server (conditional forwarder)
  ↓
Route 53 Resolver Inbound Endpoint (10.2.0.10, 10.2.0.11)
  ↓
Private Hosted Zone: aws.internal
  ↓
Returns: RDS endpoint (10.0.21.5)
```

**AWS → On-prem:**
```
EC2 queries: fileserver.onprem.local
  ↓
VPC DNS (10.0.0.2)
  ↓
Route 53 Resolver Outbound Endpoint
  ↓
Forwarding rule: *.onprem.local → 192.168.1.10
  ↓
On-prem DNS
  ↓
Returns: 192.168.10.50
```

### Cost (Monthly)
- Direct Connect (1 Gbps): $219
- VPN (backup): $37
- Transit Gateway: $37 + (4 VPCs × $37) = $185
- Route 53 Resolver: $182 (2 endpoints)
- Storage Gateway: Free (software), S3 storage costs
- AWS Managed AD: $146/month
**Total hybrid connectivity: ~$769/month**

---

## Architecture 7: Multi-Account Organization Structure

### Complete Setup
```
Organization Root
  ├→ Security OU
  │   ├→ Log Archive Account (centralized CloudTrail, Config, VPC Flow Logs)
  │   └→ Security Tooling Account (GuardDuty admin, Security Hub admin, Config aggregator)
  ├→ Infrastructure OU
  │   ├→ Network Account (Transit Gateway, Direct Connect, shared VPCs)
  │   └→ Shared Services Account (AD, DNS, monitoring)
  ├→ Production OU
  │   ├→ Prod-WebApp Account
  │   ├→ Prod-DataPlatform Account
  │   └→ Prod-ML Account
  ├→ Development OU
  │   ├→ Dev-TeamA Account
  │   ├→ Dev-TeamB Account
  │   └→ Dev-Sandbox Account
  └→ Suspended OU
      └→ Deprecated accounts (SCP denies all)
```

### Service Control Policies (SCPs)
**Root level (applies to ALL):**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Action": ["ec2:RunInstances"],
    "Resource": "*",
    "Condition": {
      "StringNotEquals": {
        "ec2:Region": ["us-east-1", "us-west-2", "eu-west-1"]
      }
    }
  }]
}
```
Restricts to approved regions only (prevent accidental launch in expensive regions)

**Production OU:**
```json
{
  "Effect": "Deny",
  "Action": ["ec2:RequestSpotInstances"],
  "Resource": "*"
}
```
No Spot instances in production (stability)

**Development OU:**
```json
{
  "Effect": "Deny",
  "Action": ["rds:CreateDBInstance"],
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "rds:DatabaseClass": ["db.t3.micro", "db.t3.small"]
    }
  }
}
```
Dev can only use small instances (cost control)

### Centralized Services
**Log Archive Account:**
- S3 bucket: organization-cloudtrail-logs
- Bucket policy: Allows all accounts to write
- Lifecycle: 90 days Standard → Glacier Deep Archive (7 years)
- S3 Object Lock: Compliance mode (immutable)

**Security Tooling Account:**
- GuardDuty: Delegated administrator, findings from all accounts
- Security Hub: Aggregates findings, compliance standards
- Config Aggregator: All account configurations visible

**Network Account:**
- Transit Gateway: Shared by all VPCs across all accounts
- RAM (Resource Access Manager): Shares TGW with other accounts
- Direct Connect: Single connection serves all accounts
- Route 53 Resolver: Shared DNS resolution

### Cost Allocation
- Tags enforced: Environment, Owner, CostCenter, Application
- Tag policies: Standardize tags across organization
- Cost allocation tags activated
- Cost Explorer: Filter by tag, chargeback to teams
- Budgets: Per account, per tag, organization-wide

### Services Used
- Organizations (foundation)
- SCPs (policy enforcement)
- CloudTrail (organization trail)
- Config (organization aggregator)
- GuardDuty (delegated admin)
- Security Hub (central dashboard)
- Transit Gateway (network hub)
- RAM (resource sharing)
- SSO / IAM Identity Center (single sign-on)
- Control Tower (automated setup)

---

## Architecture 8: Container-Based Microservices

### Complete Architecture
```
Users
  ↓
Route 53
  ↓
ALB (HTTPS)
  ├→ Host: api.example.com
  │   ├→ Path: /users/* → Target Group (UserService)
  │   ├→ Path: /orders/* → Target Group (OrderService)
  │   └→ Path: /inventory/* → Target Group (InventoryService)
  ↓
  ECS Cluster (Fargate launch type - serverless containers)
  ├→ UserService
  │   ├→ Task definition (Docker image from ECR)
  │   ├→ Service (desired: 3 tasks across 3 AZs)
  │   ├→ Service Auto Scaling (target: CPU 70%)
  │   ├→ IAM Task Role (DynamoDB access)
  │   └→ Connects to DynamoDB (Users table)
  ├→ OrderService
  │   ├→ Sends events to EventBridge
  │   └→ Connects to RDS (Orders database)
  └→ InventoryService
      └→ Reads from ElastiCache, writes to RDS

EventBridge:
  Order.Created event
  ├→ Rule 1: Send to SQS (email queue)
  ├→ Rule 2: Trigger Step Functions (fulfillment workflow)
  └→ Rule 3: Lambda (update analytics)

Service Discovery (AWS Cloud Map):
  - UserService.local → IP addresses of running tasks
  - Services find each other via DNS

App Mesh (Service Mesh - optional):
  - Traffic management between services
  - Retry logic, timeouts, circuit breakers
  - Observability (X-Ray integration)
```

### Container Deployment Flow
```
1. Developer pushes code to GitHub
2. CodePipeline detects change
3. CodeBuild:
   - Runs tests
   - Builds Docker image
   - Tags image: user-service:v1.2.3
   - Pushes to ECR
4. CodeDeploy:
   - Updates ECS task definition (new image tag)
   - Triggers ECS blue/green deployment
   - Launches new tasks (green)
   - Health checks pass
   - Shifts traffic from old (blue) to new (green)
   - Terminates old tasks
5. Total deployment time: 5-10 minutes, zero downtime
```

### Services Used
- ALB (routing)
- ECS Fargate (serverless containers)
- ECR (container registry)
- EventBridge (event bus)
- SQS (decoupling)
- Step Functions (workflows)
- RDS (relational data)
- DynamoDB (NoSQL data)
- ElastiCache (caching)
- Cloud Map (service discovery)
- App Mesh (optional service mesh)
- X-Ray (tracing)
- CodePipeline, CodeBuild, CodeDeploy (CI/CD)

### Cost (moderate traffic)
- ALB: $250/month
- ECS Fargate (10 tasks avg): $300/month
- ECR: $1/month (image storage)
- RDS: $212/month
- DynamoDB: $50/month
- ElastiCache: $147/month
- EventBridge: Free (1M events/month)
- SQS: $0.40
- Step Functions: $10/month
**Total: ~$970/month**

---

## Architecture 9: Data Lake with Analytics

### Complete Architecture
```
Data Sources:
├→ S3 (direct upload): Logs, files, exports
├→ Kinesis Firehose: Real-time streams
├→ DMS: Database CDC (ongoing replication)
└→ DataSync: On-premises file sync
    ↓
    S3 Data Lake (Raw Zone)
    ├→ /raw/logs/2026/03/29/*.json
    ├→ /raw/database-cdc/2026/03/29/*.parquet
    └→ /raw/files/2026/03/29/*.*
        ↓
        Glue ETL Jobs (Spark-based)
        ├→ Clean data (remove nulls, deduplicate)
        ├→ Transform (normalize, enrich)
        ├→ Convert to Parquet (columnar)
        └→ Partition by date
            ↓
            S3 Data Lake (Processed Zone)
            /processed/orders/year=2026/month=03/day=29/*.parquet
                ↓
                Glue Crawler (runs daily)
                ↓
                Glue Data Catalog (central metadata)
                ├→ Athena (ad-hoc SQL queries)
                │   ↓
                │   Results → S3 bucket
                ├→ Redshift Spectrum (complex analytics)
                │   ↓
                │   Redshift cluster (curated data warehouse)
                └→ SageMaker (ML model training)
                    ↓
                    QuickSight (BI dashboards)
                    ├→ Athena data source
                    └→ Redshift data source
```

### Data Governance
- Lake Formation: Access control per table/column
- IAM policies: Who can access data lake
- S3 bucket policies: Cross-account access
- Glue Data Catalog: Schema versioning
- Encryption: SSE-S3 or SSE-KMS
- Tagging: PII, sensitive, public classifications
- Macie: Scan for PII in S3 (GDPR compliance)

### Services Used
- S3 (storage - 3 layers: raw, processed, curated)
- Glue (ETL, crawler, catalog)
- Lake Formation (governance)
- Kinesis Firehose (streaming ingestion)
- DMS (database replication)
- DataSync (file sync)
- Athena (querying)
- Redshift Spectrum + Redshift
- SageMaker (ML)
- QuickSight (visualization)
- Macie (data security)
- KMS (encryption)

### Cost (10 TB data lake)
- S3 (raw 10 TB): $230/month
- S3 (processed 8 TB Parquet): $184/month
- Glue ETL: $0.44/hour when running (~$50/month)
- Glue Crawler: $0.44/hour (~$10/month)
- Athena: ~$50/month (500 queries)
- Redshift: $182/month (if needed)
- QuickSight: $24/user/month
- Lake Formation: Free
**Total: ~$730/month** (without Redshift)

---

## Architecture 10: Large-Scale Migration (On-Premises to AWS)

### Phase 1: Discovery & Planning
```
On-Premises (500 servers, 50 databases, 100 TB data):
  ↓
  Application Discovery Service
  ├→ Agentless (VMware integration)
  └→ Agent-based (installed on servers)
      ↓
      Migration Hub (central dashboard)
      ├→ Server dependencies mapped
      ├→ Application groupings identified
      └→ Migration waves planned

Migration Evaluator:
  - TCO analysis (on-prem vs AWS costs)
  - Right-sizing recommendations
  - Business case for migration
```

### Phase 2: Network Setup
```
AWS Landing Zone (Control Tower):
  ├→ Production Account
  ├→ Development Account
  ├→ Shared Services Account
  └→ Security Account

Network Account:
  ├→ Transit Gateway (hub for all VPCs)
  ├→ Direct Connect (1 Gbps + 1 Gbps redundant)
  ├→ VPN backup connections
  └→ Hybrid DNS (Route 53 Resolver)
```

### Phase 3: Migration Execution
```
Wave 1 (Low-risk, 2 weeks):
  Non-critical file servers
  └→ DataSync: On-prem → S3
      ↓
      S3 (replaces file servers)
      Storage Gateway (if need file share interface)

Wave 2 (Medium-risk, 1 month):
  Application servers (stateless)
  └→ Application Migration Service (MGN)
      ├→ Continuous replication
      ├→ Test launches (verify)
      └→ Cutover (minimal downtime)
          ↓
          EC2 instances in AWS

Wave 3 (High-risk, 6 weeks):
  Databases
  └→ Database Migration Service (DMS)
      ├→ Schema Conversion Tool (SCT) for Oracle → PostgreSQL
      ├→ Full Load + CDC
      ├→ Validation (compare source/target)
      └→ Cutover during maintenance window
          ↓
          RDS / Aurora

Wave 4 (Critical, 2 months):
  Core business applications
  └→ Detailed testing
      ├→ Pilot user groups
      ├→ Performance testing
      ├→ Disaster recovery drills
      └→ Final cutover
```

### Services Used Migration
- Application Discovery Service (mapping)
- Migration Hub (tracking)
- Migration Evaluator (TCO)
- Control Tower (account setup)
- Application Migration Service/MGN (VMs)
- DataSync (files)
- DMS (databases)
- SCT (schema conversion)
- CloudEndure (legacy - disaster recovery)
- Snow Family (if >10 TB, slow network)

### Post-Migration Optimization
```
Month 1-3: Optimize
  ├→ Compute Optimizer: Right-size instances (save 30%)
  ├→ Trusted Advisor: Reserved Instance recommendations
  ├→ Cost Explorer: Analyze spending patterns
  └→ Buy Reserved Instances (save $500K+/year)

Month 3-6: Modernize
  ├→ Containerize applications (ECS/EKS)
  ├→ Serverless where applicable (Lambda)
  ├→ Managed services (RDS instead of EC2 databases)
  └→ Auto Scaling (optimize capacity)
```

---

## Architecture 11: Video Streaming Platform

### Complete Architecture
```
Content Upload:
  Users upload videos
  ↓
  S3 (source bucket)
  ↓
  S3 Event → Lambda (ProcessVideo)
  ↓
  MediaConvert (transcode to multiple formats)
  ├→ 1080p MP4
  ├→ 720p MP4
  ├→ 480p MP4
  └→ HLS adaptive streaming
      ↓
      S3 (transcoded bucket)
      ├→ Lifecycle: 90 days Standard → Glacier (archive originals)
      └→ Metadata → DynamoDB (video catalog)

Content Delivery:
  User requests video
  ↓
  Route 53
  ↓
  CloudFront (video streaming distribution)
  ├→ Origin: S3 (transcoded videos)
  ├→ Signed URLs (authenticated access)
  ├→ Geo-restriction (licensed content regions)
  └→ Lambda@Edge (generate playback token)
      ↓
      Edge location serves video (HLS chunks)
      ↓
      Client player (adaptive bitrate)

Analytics:
  CloudFront access logs → S3
  ↓
  Kinesis Firehose (real-time)
  ↓
  Lambda (process logs)
  ├→ DynamoDB (viewer statistics)
  └→ CloudWatch (custom metrics)
      ↓
      QuickSight (dashboard: views, bandwidth, popular content)
```

### Services Used
- S3 (storage)
- MediaConvert (transcoding)
- Lambda (processing)
- DynamoDB (metadata + analytics)
- CloudFront (CDN with signed URLs)
- Lambda@Edge (auth at edge)
- Kinesis Firehose (log processing)
- QuickSight (analytics)

### Cost (1M video views/month, 100 TB delivered)
- S3 storage (50 TB): $1,150/month
- MediaConvert: $0.024/minute transcoded (~$500/month for uploads)
- CloudFront (100 TB): $5,000/month
- Lambda: $50/month
- DynamoDB: $100/month
**Total: ~$6,800/month** (vs traditional CDN $15K+/month)

---

## Architecture 12: Machine Learning Pipeline

### Complete Architecture
```
Data Collection:
  IoT sensors, applications, logs
  ↓
  Kinesis Data Streams
  ↓
  Firehose → S3 (raw data)

Data Preparation:
  S3 Raw Data
  ↓
  Glue ETL (clean, normalize)
  ↓
  S3 Processed Data (Parquet)
  ↓
  SageMaker Data Wrangler (feature engineering)
  ↓
  SageMaker Feature Store (reusable features)

Model Training:
  S3 Processed → SageMaker Training Job
  ├→ Spot instances (90% cost savings)
  ├→ Distributed training (multi-GPU)
  ├→ Hyperparameter tuning (automatic)
  └→ Model artifacts → S3

Model Deployment:
  S3 Model → SageMaker Endpoint
  ├→ Real-time inference (synchronous)
  ├→ Auto-scaling (based on invocations)
  └→ Multi-model endpoint (multiple models, one endpoint)

OR Batch Inference:
  S3 Data → SageMaker Batch Transform
  ↓
  S3 Predictions

Inference at Scale (alternative):
  API Gateway
  ↓
  Lambda (load model from S3, inference)
  ↓
  Prediction returned
  (For small models, cheaper than SageMaker endpoint)

Monitoring:
  SageMaker Model Monitor
  ├→ Data quality drift detection
  ├→ Model quality degradation
  └→ Bias detection
      ↓
      CloudWatch alarm → SNS (retrain needed)

MLOps Pipeline:
  Code/model changes → CodePipeline
  ├→ CodeBuild (build container)
  ├→ Deploy to SageMaker (Blue/Green)
  └→ Step Functions (orchestrate training/deploy)
```

### Services Used
- Kinesis (data ingestion)
- S3 (data + model storage)
- Glue (data preparation)
- SageMaker (Feature Store, Training, Endpoint, Model Monitor)
- Lambda (inference alternative)
- API Gateway (API layer)
- Step Functions (MLOps orchestration)
- CodePipeline (CI/CD)
- EventBridge (event-driven retraining)
- CloudWatch (monitoring)

---

**COMPLETED: Architecture patterns 1-12**

Creating more patterns + practice questions + hands-on labs...

