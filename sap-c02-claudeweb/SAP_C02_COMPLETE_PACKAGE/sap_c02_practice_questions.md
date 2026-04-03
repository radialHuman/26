# SAP-C02 Practice Questions & Scenarios

## Domain 1: Design Solutions for Organizational Complexity (26%)

### Question Set 1: Multi-Account Management

**Q1:** A large enterprise with 200+ AWS accounts needs centralized governance. They require:
- Centralized billing
- Restrict services in development accounts
- Share common resources (VPCs, AMIs) across accounts
- Automated account provisioning

Which combination provides the MOST comprehensive solution?

A) AWS Organizations with SCPs + AWS Control Tower + AWS Resource Access Manager  
B) AWS Organizations + Consolidated Billing + AWS Config Rules  
C) AWS SSO + IAM roles + AWS CloudFormation StackSets  
D) AWS Control Tower + AWS Service Catalog + AWS Systems Manager

**Answer: A**

**Explanation:**
- AWS Organizations provides account structure and consolidated billing
- Service Control Policies (SCPs) restrict services at account/OU level
- AWS Control Tower automates account provisioning with guardrails
- RAM enables resource sharing across accounts
- This combination addresses all requirements comprehensively

**Key Takeaway:** Control Tower is purpose-built for multi-account setup with best practices

---

**Q2:** A company has multiple AWS accounts and needs to share a private AMI catalog with only production accounts. What's the most secure approach?

A) Make AMIs public and use IAM policies to restrict access  
B) Copy AMIs to each production account manually  
C) Use AWS Resource Access Manager to share AMIs with specific accounts  
D) Store AMI IDs in Systems Manager Parameter Store and reference them

**Answer: C**

**Explanation:**
- RAM allows secure, controlled sharing of resources across accounts
- AMIs can be shared without making them public
- Permissions are managed centrally
- No need for manual copying or maintenance

---

### Question Set 2: Hybrid Connectivity

**Q3:** A company needs to connect their on-premises data center to AWS with the following requirements:
- Consistent network performance (not internet-dependent)
- Access to multiple VPCs in different regions
- Bandwidth: 10 Gbps
- Private connectivity to AWS services

Which solution is MOST appropriate?

A) Site-to-Site VPN with Virtual Private Gateway in each VPC  
B) Direct Connect with Direct Connect Gateway + VPN for backup  
C) Multiple Direct Connect connections with LAG  
D) AWS PrivateLink endpoints in each VPC

**Answer: B**

**Explanation:**
- Direct Connect provides dedicated 10 Gbps private connection
- Direct Connect Gateway enables access to multiple VPCs across regions
- VPN provides backup for resilience
- PrivateLink alone doesn't solve on-premises connectivity

**Key Concept:** Direct Connect Gateway vs Transit Gateway
- DX Gateway: For accessing multiple VPCs/regions from on-premises
- Transit Gateway: For inter-VPC routing and centralized on-premises connectivity

---

**Q4:** A multinational company has 50 VPCs across 5 regions and needs:
- Centralized egress to internet
- On-premises connectivity to all VPCs
- Simplified routing
- Cost optimization

What architecture should they implement?

A) VPC Peering mesh with NAT Gateways in each VPC  
B) Transit Gateway in each region + Transit Gateway Peering + Centralized egress VPC  
C) Direct Connect to each VPC individually  
D) AWS PrivateLink for all VPC-to-VPC communication

**Answer: B**

**Explanation:**
- Transit Gateway centralizes routing within each region (up to 5,000 VPCs)
- Transit Gateway Peering connects regions
- Centralized egress VPC with NAT Gateway/Firewall reduces costs
- Much simpler than managing 1,225 VPC peering connections (50×49/2)

**Cost Comparison:**
- 50 NAT Gateways: ~$1,500/month + data charges
- 1 centralized NAT + Transit Gateway: ~$500/month + TGW attachment fees

---

### Question Set 3: Identity & Access Management

**Q5:** A company acquires another company that uses a different identity provider. Both companies need to:
- Maintain separate identity sources
- Access shared AWS resources
- Use existing corporate credentials
- Minimize operational overhead

What solution provides this?

A) Create IAM users for all employees from both companies  
B) AWS IAM Identity Center (SSO) with multiple identity sources + attribute-based access control  
C) Active Directory Federation Services with IAM roles  
D) AWS Organizations with separate OUs for each company

**Answer: B**

**Explanation:**
- IAM Identity Center supports multiple identity sources simultaneously
- ABAC (Attribute-Based Access Control) manages permissions based on user attributes
- Users maintain existing credentials (SAML 2.0 federation)
- Centralized access management

**IAM Identity Center vs ADFS:**
- Identity Center: AWS-native, multi-account support, easier management
- ADFS: Legacy approach, requires infrastructure maintenance

---

## Domain 2: Design for New Solutions (29%)

### Question Set 4: Microservices Architecture

**Q6:** A company is migrating a monolithic application to microservices on AWS. Requirements:
- 20+ microservices
- Service-to-service authentication
- Distributed tracing
- Blue/green deployments
- Minimal operational overhead

Which combination is MOST suitable?

A) ECS Fargate + App Mesh + X-Ray + CodeDeploy  
B) EKS + Istio + Prometheus + Jenkins  
C) Lambda + API Gateway + CloudWatch + SAM  
D) EC2 Auto Scaling + ALB + CloudWatch + CodeDeploy

**Answer: A**

**Explanation:**
- ECS Fargate: Serverless containers (no server management)
- App Mesh: Service mesh for service discovery, traffic management, observability
- X-Ray: Distributed tracing across services
- CodeDeploy: Native blue/green deployment support for ECS

**Why not EKS?** While capable, requires more operational overhead (Kubernetes expertise, cluster management)

---

**Q7:** A microservices application needs asynchronous communication between services with:
- Message deduplication
- Guaranteed message ordering
- Message retention for 14 days
- Fan-out to multiple consumers

Which services combination achieves this?

A) SQS FIFO queue only  
B) SNS Standard topic + SQS Standard queues  
C) SNS FIFO topic + SQS FIFO queues  
D) Kinesis Data Streams

**Answer: C**

**Explanation:**
- SNS FIFO: Guarantees ordering and deduplication at topic level
- SQS FIFO: Guarantees ordering at queue level
- Fan-out: SNS topic distributes to multiple SQS queues
- Message retention: SQS supports up to 14 days

**Service Comparison:**
- SNS: Pub/sub, no retention, push-based
- SQS: Queue, 14-day retention, pull-based
- Kinesis: Streaming, 365-day retention, ordered, multiple consumers

---

### Question Set 5: Serverless Solutions

**Q8:** A company needs to process uploaded images:
1. User uploads image to S3
2. Generate 3 thumbnails (small, medium, large)
3. Extract metadata
4. Store results in DynamoDB
5. Process within 30 seconds
6. Cost-optimized for variable load (10-10,000 images/hour)

What's the MOST cost-effective architecture?

A) S3 event → Lambda (processes all) → DynamoDB  
B) S3 event → SQS → EC2 Auto Scaling → DynamoDB  
C) S3 event → Step Functions → Parallel Lambda functions → DynamoDB  
D) S3 event → Kinesis → Lambda → DynamoDB

**Answer: C**

**Explanation:**
- S3 event triggers Step Functions
- Step Functions orchestrates parallel Lambda executions (thumbnail generation + metadata extraction)
- Lambda is cost-effective for variable load (pay per execution)
- 30-second SLA easily met
- DynamoDB scales automatically

**Why Step Functions?**
- Parallel processing (faster than sequential)
- Built-in error handling and retries
- Visual workflow
- No code for orchestration logic

---

**Q9:** A Lambda function processes API requests but experiences cold starts causing latency spikes. The function:
- Uses 512 MB memory
- Takes 2 seconds to initialize (loading ML model)
- Receives steady traffic: 100 requests/minute
- Latency SLA: <500ms

How can cold starts be minimized?

A) Increase memory to 3 GB to reduce initialization time  
B) Enable Provisioned Concurrency to keep functions warm  
C) Use Lambda layers to optimize package size  
D) Implement connection pooling in the function code

**Answer: B**

**Explanation:**
- Provisioned Concurrency keeps functions initialized and ready
- Eliminates cold starts for provisioned instances
- Cost trade-off: Pay for provisioned capacity vs occasional cold starts
- For steady traffic with latency SLA, worth the cost

**Other Optimizations:**
- Increasing memory also increases CPU (may help initialization)
- Lambda layers reduce deployment package size (minor impact on cold starts)
- Connection pooling helps with DB connections, not cold starts

---

### Question Set 6: Data Analytics

**Q10:** A streaming analytics platform needs to:
- Ingest 100,000 events/second
- Real-time analytics (windowing, aggregations)
- Store raw data for 7 days for reprocessing
- Query historical data with SQL
- Cost-optimized

Which architecture is BEST?

A) Kinesis Data Streams → Lambda → DynamoDB + S3 for backup  
B) Kinesis Data Streams → Kinesis Data Analytics → S3 → Athena  
C) SQS → Lambda → RDS → S3 data lake  
D) MSK (Managed Kafka) → Spark on EMR → Redshift

**Answer: B**

**Explanation:**
- Kinesis Data Streams: Ingests 100K events/sec, 7-day retention
- Kinesis Data Analytics: Real-time SQL queries with windowing
- S3: Cost-effective long-term storage
- Athena: Serverless SQL queries on S3

**Why not MSK + EMR?**
- More operational overhead (cluster management)
- Higher cost for this use case
- Use when you need Kafka-specific features or complex Spark processing

---

## Domain 3: Continuous Improvement for Existing Solutions (25%)

### Question Set 7: Performance Optimization

**Q11:** A web application on EC2 behind an ALB experiences:
- High CPU during traffic spikes (Auto Scaling handles this)
- Database query latency during peaks (RDS PostgreSQL)
- Redundant computations for popular content

What optimizations provide the MOST impact?

A) Upgrade to larger RDS instance + enable Enhanced Monitoring  
B) Add RDS Read Replicas + Implement ElastiCache + CloudFront  
C) Move to Aurora Serverless + Lambda for compute  
D) Enable RDS Performance Insights + Add CloudWatch alarms

**Answer: B**

**Explanation:**
- Read Replicas: Offload read traffic from primary database
- ElastiCache: Cache frequent queries and computations (Redis for complex objects, Memcached for simple)
- CloudFront: Cache static/semi-static content at edge, reduce origin load

**Impact Hierarchy:**
1. Caching (biggest impact for reads): ElastiCache + CloudFront
2. Read scaling: RDS Read Replicas
3. Vertical scaling: Larger instance (last resort, limited gains)

---

**Q12:** A DynamoDB table experiences throttling during daily batch jobs. The table:
- Provisioned capacity: 1,000 WCU
- Batch job: 1-hour window, 50,000 writes
- Rest of day: 100 writes/minute
- Cost optimization is important

What's the BEST solution?

A) Increase provisioned WCU to 1,500 permanently  
B) Switch to On-Demand capacity mode  
C) Use Application Auto Scaling for DynamoDB  
D) Distribute batch writes over longer time period

**Answer: C**

**Explanation:**
- Application Auto Scaling adjusts WCU based on utilization
- Scales up during batch job, scales down afterward
- More cost-effective than over-provisioning or On-Demand for this pattern

**When to use each:**
- Provisioned: Predictable, steady traffic
- On-Demand: Unpredictable, spiky traffic, or new tables
- Auto Scaling: Predictable patterns with variations (like this batch job)

---

### Question Set 8: Cost Optimization

**Q13:** Cost analysis shows:
- 40% of spend: EC2 instances running 24/7 (production)
- 30% of spend: Dev/test instances (used 9am-6pm weekdays)
- 20% of spend: Data transfer
- 10% of spend: S3 storage

What optimizations save the MOST?

A) Reserved Instances for all EC2, S3 Intelligent-Tiering  
B) Reserved Instances for production, Instance Scheduler for dev/test, S3 lifecycle policies  
C) Spot Instances for all workloads, S3 Glacier for all data  
D) Savings Plans for compute, CloudFront to reduce data transfer

**Answer: B**

**Explanation:**
- Reserved Instances (1 or 3-year): Up to 72% savings on production 24/7 workloads
- Instance Scheduler: Automatically stop/start dev instances (save ~65% on dev costs)
- S3 lifecycle: Move infrequent data to cheaper tiers

**Calculated Savings:**
- Production RIs: ~30% savings on 40% of spend = 12% total
- Dev scheduler: ~65% savings on 30% of spend = 19.5% total
- **Total: ~31.5% cost reduction**

---

**Q14:** A company stores 500 TB in S3 Standard. Access patterns:
- 20% accessed weekly (hot data)
- 50% accessed monthly (warm data)
- 30% rarely accessed (cold data, regulatory retention)

What storage strategy optimizes cost while maintaining access?

A) S3 Intelligent-Tiering for all data  
B) S3 Standard for hot, S3 Standard-IA for warm, S3 Glacier Instant Retrieval for cold  
C) S3 One Zone-IA for all data  
D) S3 Standard for all with lifecycle policy to Glacier after 30 days

**Answer: B**

**Explanation:**
- S3 Standard: Frequent access, lowest latency
- S3 Standard-IA: Infrequent access (monthly), 40% cheaper than Standard
- S3 Glacier Instant Retrieval: Rare access, millisecond retrieval, 68% cheaper than Standard

**Cost Comparison (500 TB):**
- All Standard: ~$11,500/month
- Optimized mix: ~$5,500/month (~52% savings)
- Intelligent-Tiering: Similar savings but monitoring/automation fees add up

---

### Question Set 9: Operational Excellence

**Q15:** A company wants to track configuration changes across 200 AWS accounts and detect:
- Unauthorized security group changes
- S3 buckets made public
- Unencrypted EBS volumes
- IAM policy changes

What's the MOST centralized approach?

A) AWS Config in each account with aggregator + AWS Config Rules + SNS notifications  
B) CloudTrail in each account + CloudWatch Logs + Lambda for analysis  
C) AWS Security Hub with AWS Config integration  
D) AWS Systems Manager Inventory + Parameter Store

**Answer: C**

**Explanation:**
- Security Hub aggregates findings from multiple accounts
- Integrates with Config, GuardDuty, Inspector, Macie
- Centralized security posture dashboard
- Built-in compliance frameworks (CIS, PCI-DSS)

**Why Security Hub over Config alone?**
- Security Hub provides unified view across security services
- Pre-built compliance checks
- Automated remediation with Security Hub → EventBridge → Lambda
- Config is component, Security Hub is aggregator

---

## Domain 4: Accelerate Workload Migration & Modernization (20%)

### Question Set 10: Database Migration

**Q16:** Migrating Oracle database (5 TB) to AWS with requirements:
- Minimize downtime (<1 hour)
- Heterogeneous migration (Oracle → PostgreSQL Aurora)
- Preserve stored procedures (need conversion)
- Ongoing replication during cutover testing

What's the recommended approach?

A) Database Migration Service (DMS) with Schema Conversion Tool (SCT)  
B) AWS Snowball with SCT  
C) Native Oracle Data Pump + EC2-based PostgreSQL  
D) AWS DataSync + manual schema conversion

**Answer: A**

**Explanation:**
- SCT: Converts schema, stored procedures, functions (Oracle → PostgreSQL)
- DMS: Continuous data replication (CDC - Change Data Capture)
- Workflow:
  1. Use SCT to convert schema
  2. Set up DMS replication task (full load + CDC)
  3. Cutover when replication lag is minimal

**DMS Migration Types:**
- Full Load: One-time migration
- Full Load + CDC: Minimal downtime (recommended)
- CDC only: For ongoing replication

---

**Q17:** A company has 50 TB database that must be migrated with zero downtime. Network bandwidth: 100 Mbps. Timeline: 1 month.

What strategy meets requirements?

A) DMS over internet connection  
B) Snowball Edge to transfer initial dataset + DMS CDC for changes  
C) Direct Connect + DMS  
D) Native database replication over VPN

**Answer: B**

**Explanation:**
- **Data Transfer Calculation:**
  - 50 TB over 100 Mbps = ~46 days (too slow)
  - Even with compression, won't meet 1-month timeline
  
- **Solution:**
  - Snowball Edge: Transfer initial 50 TB (ships overnight)
  - DMS CDC: Replicate changes while Snowball in transit
  - Cutover when sync'd

**When to use Snowball:**
- Data > 10 TB and limited bandwidth
- Formula: If transfer time > 1 week, consider Snowball

---

### Question Set 11: Application Migration

**Q18:** Migrating 500 on-premises VMs to AWS. Requirements:
- Minimize downtime
- Test migrated workloads before cutover
- Rollback capability
- Automated at scale

Which service is BEST for this?

A) AWS Server Migration Service (SMS)  
B) AWS Application Migration Service (MGN)  
C) VM Import/Export  
D) AWS Database Migration Service

**Answer: B**

**Explanation:**
- MGN (formerly CloudEndure): Continuous block-level replication
- Non-disruptive testing (create test instances without stopping replication)
- Automated, minimal downtime cutover
- Rollback: Keep source VMs running until confirmed
- Supports Windows, Linux at scale

**SMS vs MGN:**
- SMS: Agentless, incremental snapshots (older, being phased out)
- MGN: Agent-based, continuous replication, recommended for migrations

---

**Q19:** A containerized application on on-premises Kubernetes needs migration to AWS. The application:
- 50 microservices
- Uses Helm charts
- Requires minimal code changes
- Team has Kubernetes expertise

What migration path is MOST appropriate?

A) Refactor to Lambda functions  
B) Migrate to EKS and import existing Helm charts  
C) Replatform to ECS Fargate  
D) Lift-and-shift to EC2 and install Kubernetes

**Answer: B**

**Explanation:**
- EKS: Managed Kubernetes (minimize code changes)
- Helm charts: Portable, work on EKS without modification
- Team expertise: Leverages existing knowledge
- AWS-managed control plane: Reduced operational burden

**6 R's Applied:**
- **Rehost** (lift-and-shift): VMs to EC2
- **Replatform** (lift-tinker-shift): Kubernetes to EKS ✓
- **Refactor**: Completely redesign (unnecessary here)

---

## Key Exam Strategies

### 1. Elimination Technique
Most questions can be narrowed to 2 choices. Eliminate wrong answers by identifying:
- ❌ Solutions that don't meet ALL requirements
- ❌ Overcomplicated solutions when simple ones exist
- ❌ Non-AWS services or outdated approaches
- ❌ Missing HA/DR when required

### 2. Cost vs. Performance Trade-offs
When choosing between solutions:
- **If cost-optimized**: Choose serverless, auto-scaling, on-demand
- **If performance-critical**: Choose provisioned capacity, caching, CDN
- **If balanced**: Choose reserved instances, auto-scaling, managed services

### 3. Keywords Matter
- **"Most cost-effective"** → Serverless, Spot, S3 IA/Glacier, Reserved Instances
- **"Least operational overhead"** → Managed services, serverless, automation
- **"Highest performance"** → Provisioned IOPS, caching, CDN, larger instances
- **"Most secure"** → Encryption, private subnets, least privilege, MFA
- **"Minimal downtime"** → Multi-AZ, Blue/Green, CDC replication

### 4. Service Selection Patterns

**For Compute:**
- Steady, long-running: EC2 Reserved Instances
- Variable: EC2 Auto Scaling or Fargate
- Event-driven, short: Lambda
- Batch processing: Batch (Spot)

**For Storage:**
- Frequent access: S3 Standard, EBS gp3
- Infrequent: S3 IA, EBS sc1
- Archive: S3 Glacier
- Shared file system: EFS, FSx

**For Database:**
- Relational, managed: RDS/Aurora
- NoSQL, key-value: DynamoDB
- In-memory cache: ElastiCache
- Data warehouse: Redshift
- Graph: Neptune

### 5. HA/DR Checklist
When designing for high availability:
- [ ] Multi-AZ deployment?
- [ ] Auto Scaling configured?
- [ ] Health checks implemented?
- [ ] Data replication in place?
- [ ] Backup strategy defined (RPO)?
- [ ] Failover mechanism (RTO)?
- [ ] Multi-region if critical?

---

## Practice Exam Score Interpretation

**70-75%:** Keep studying, focus on weak domains  
**76-82%:** Close, review practice mistakes thoroughly  
**83-88%:** Good position, practice time management  
**89%+:** Ready to schedule exam!

**Remember:** Official exam may be harder than practice tests. Aim for 85%+ on practice exams.

---

## Final Tips

1. **Read every word carefully:** "NOT," "EXCEPT," "LEAST" reverse the question
2. **All requirements must be met:** If solution misses one requirement, it's wrong
3. **Choose AWS over third-party:** Unless specifically needed
4. **Multi-AZ > Multi-Region:** Unless global users or DR requirements stated
5. **Managed > Unmanaged:** Unless cost or control specified

Good luck! 🚀
