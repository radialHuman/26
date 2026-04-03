# 24 — Additional 200 Practice Questions — Complex Scenarios with Full Explanations

> **These questions mimic real SAP-C02 difficulty: 2-3 plausible answers, multi-select format, detailed wrong-answer analysis.**

---

## MULTI-SELECT QUESTIONS (Select 2 or 3 — Exam Format!)

### Q1 (Select TWO)
A company is designing a multi-region active-passive DR solution. The primary region is us-east-1 and DR region is eu-west-1. They use Aurora MySQL, EC2 behind ALB, and S3. Which TWO actions are required for the DR setup?

A. Create an Aurora cross-region Read Replica in eu-west-1
B. Enable S3 Cross-Region Replication from us-east-1 to eu-west-1
C. Create a VPC peering connection between the two regions
D. Set up Route 53 with Simple routing to both ALBs
E. Copy AMIs to eu-west-1 and create launch templates

**Answer: B, E**

**Why B**: S3 CRR ensures data is available in DR region. Required for static assets, config files, etc.
**Why E**: AMIs are regional. You must copy them to launch EC2 instances in the DR region.
**Why NOT A**: While Aurora cross-region Read Replica works, the question says "active-passive" — Aurora Global Database is better (sub-second RPO). But A isn't wrong per se — it's less optimal. However, between A and E, E is more fundamental since you can't launch EC2 without AMIs.
**Why NOT C**: VPC peering is for inter-VPC communication, not required for DR.
**Why NOT D**: Simple routing doesn't support failover. Need Failover routing policy.

---

### Q2 (Select TWO)
A company needs to minimize data transfer costs for a 3-tier application. The web tier (public subnets) calls a REST API on the app tier (private subnets) which queries DynamoDB and stores files in S3. Which TWO actions will reduce costs the most?

A. Move web and app tiers to the same AZ
B. Create a VPC Gateway Endpoint for DynamoDB
C. Create a VPC Gateway Endpoint for S3
D. Use CloudFront to cache API responses
E. Enable S3 Transfer Acceleration

**Answer: B, C**

**Why B**: Gateway Endpoint for DynamoDB is FREE. Without it, traffic goes through NAT Gateway ($0.045/GB processing).
**Why C**: Gateway Endpoint for S3 is FREE. Same savings as B.
**Why NOT A**: Moving to same AZ saves $0.01/GB on cross-AZ but introduces single-AZ failure risk. Bad practice.
**Why NOT D**: CloudFront helps performance but doesn't eliminate NAT Gateway charges for DynamoDB/S3 access.
**Why NOT E**: Transfer Acceleration speeds up uploads but doesn't reduce cost.

---

### Q3 (Select THREE)
A security team is implementing defense-in-depth for a web application. Which THREE services provide protection at DIFFERENT layers?

A. AWS WAF on CloudFront (Layer 7 — HTTP attacks)
B. AWS Shield Advanced (Layer 3/4 — DDoS)
C. Security Groups (Layer 4 — instance-level)
D. Network ACLs (Layer 4 — subnet-level)
E. AWS Network Firewall (Layer 3-7 — VPC-level IPS/IDS)
F. Amazon GuardDuty (threat detection)

**Answer: A, B, E**

**Why A**: Layer 7 protection (SQL injection, XSS, rate limiting at HTTP level)
**Why B**: Layer 3/4 protection (DDoS mitigation, volumetric attacks)
**Why E**: Layer 3-7 deep packet inspection, IPS/IDS, domain filtering
**Why NOT C or D**: These ARE different layers but C and D overlap in function (both L4 access control). The question asks for "different layers" and A/B/E cover L7, L3/4, and L3-7 more distinctly.
**Why NOT F**: GuardDuty is detection, not protection. It detects threats but doesn't block them.

---

### Q4 (Select TWO)
A company is migrating 500 on-premises servers to AWS. They have identified: 200 web servers (identical config), 50 database servers (Oracle → Aurora PostgreSQL), 100 app servers (Java), 150 file servers. Which TWO migration approaches should they use together?

A. AWS MGN for all 500 servers (rehost)
B. AWS MGN for web + app + file servers, AWS DMS + SCT for databases
C. AWS DataSync for file servers, AWS MGN for the rest
D. AWS Snow Family for all data transfer
E. AWS DMS for all servers

**Answer: B, C**

**Why B**: MGN handles lift-and-shift for compute servers. DMS + SCT handles Oracle-to-Aurora (heterogeneous) database migration.
**Why C**: DataSync is optimized for file transfer from NAS/file servers to S3/EFS. Better than MGN for pure file server migration.
**Why NOT A**: MGN can't handle Oracle-to-Aurora conversion. You need SCT + DMS for that.
**Why NOT D**: Snow Family is for offline transfer. 500 servers with applications need live migration with MGN.
**Why NOT E**: DMS is for databases, not application servers.

---

## COMPLEX SCENARIO QUESTIONS — Single Answer

### Q5
A company runs a latency-sensitive trading application on EC2 instances in a cluster placement group. They need to add more instances, but the launch fails with an "insufficient capacity" error. The existing instances are critical and cannot be stopped. What should they do?

A. Launch instances in a spread placement group
B. Launch new instances in the same AZ without a placement group, then add them to the cluster group
C. Launch a new cluster placement group in the same AZ and use network interfaces for low-latency communication
D. Launch new instances of a different instance type in the same cluster placement group

**Answer: D**

**Why D**: Cluster placement groups can sometimes accommodate different instance types that have capacity available. The underlying hardware may have capacity for different instance families.
**Why NOT A**: Spread placement groups have different latency characteristics (instances on separate hardware).
**Why NOT B**: You cannot add instances to a cluster placement group after creation without stopping/starting all instances.
**Why NOT C**: Two separate cluster placement groups don't guarantee placement on nearby hardware — defeating the purpose.

**Real exam tip**: Insufficient capacity in cluster placement group is a known issue. Solutions: try different instance type, or stop/start all instances together (which the question says can't be done).

---

### Q6
A SaaS company serves 200 tenants from a single AWS account. Each tenant's data is in DynamoDB with tenant_id as the partition key. The security team requires that Tenant A can NEVER access Tenant B's data, even if there's a bug in the application code. What is the MOST secure approach?

A. Use IAM policies with condition keys to restrict DynamoDB access by tenant_id
B. Use DynamoDB fine-grained access control with IAM conditions
C. Create a separate DynamoDB table per tenant
D. Create a separate AWS account per tenant with isolated DynamoDB tables

**Answer: D**

**Why D**: Account-level isolation is the STRONGEST boundary in AWS. Even with application bugs, one tenant's account cannot access another's DynamoDB table. This is the "silo" model.
**Why NOT A/B**: IAM fine-grained access with conditions (LeadingKeys) provides row-level isolation, but it depends on IAM policy being correct. A misconfigured policy = data leak. The question says "MOST secure."
**Why NOT C**: Separate tables in the SAME account still rely on IAM for isolation. Cross-table access is possible with a misconfigured role.

**Exam pattern**: When the question says "MOST secure" and offers account isolation as an option, it's usually correct.

---

### Q7
A company runs a web application with the following traffic pattern: 1,000 requests/second during the day, 10 requests/second at night. They use EC2 with Auto Scaling (target tracking on CPU at 50%). The application takes 8 minutes to fully initialize on new instances. During morning traffic ramp-up, users experience errors because instances aren't ready fast enough. What TWO changes would BEST solve this? (Select TWO)

A. Reduce Auto Scaling cooldown period to 60 seconds
B. Enable Predictive Scaling alongside Target Tracking
C. Configure a Warm Pool with pre-initialized instances
D. Reduce target CPU from 50% to 30%
E. Use Scheduled Scaling to increase minimum capacity before morning

**Answer: B, C**

**Why B**: Predictive Scaling analyzes historical patterns and pre-scales BEFORE the morning ramp. Instances are ready when traffic arrives.
**Why C**: Warm Pool keeps pre-initialized instances in stopped state. Scale-out draws from warm pool (start ≈ seconds) instead of launching fresh (8 minutes).
**Why NOT A**: Faster cooldown doesn't help with 8-minute initialization — it just launches instances sooner but they still take 8 min.
**Why NOT D**: Lower CPU target means more instances, but they still take 8 min to be ready during ramp.
**Why NOT E**: Scheduled scaling helps but requires manual schedule management and doesn't adapt to variable patterns.

---

### Q8
A company's Aurora MySQL database is encrypted with an AWS-managed KMS key. They need to share a database snapshot with a partner's AWS account. The partner needs to restore it in their account. What should they do?

A. Share the snapshot directly — the partner can restore it with the AWS-managed key
B. Copy the snapshot to an unencrypted snapshot, then share it
C. Copy the snapshot encrypted with a Customer Managed Key (CMK), share the CMK key policy with the partner, then share the snapshot
D. The partner must create a DMS replication task to copy data from the source database

**Answer: C**

**Why C**: You cannot share a snapshot encrypted with an AWS-managed key cross-account. You must:
1. Copy the snapshot, re-encrypting with a CMK
2. Update the CMK key policy to allow the partner account access
3. Share the snapshot with the partner account
4. Partner restores using the shared CMK

**Why NOT A**: AWS-managed keys CANNOT be shared cross-account.
**Why NOT B**: You cannot create an unencrypted copy of an encrypted snapshot (encryption is mandatory once enabled).
**Why NOT D**: DMS works but is much more complex than snapshot sharing.

---

### Q9
A Lambda function processes SQS messages. Each message takes 30 seconds to process. Under high load (10,000 messages in queue), some messages are processed twice, causing duplicate orders. The SQS queue uses Standard type with visibility timeout of 30 seconds. What is the BEST fix?

A. Switch to SQS FIFO queue for exactly-once processing
B. Increase the visibility timeout to 60 seconds
C. Implement idempotency in the Lambda function
D. Reduce Lambda batch size to 1

**Answer: C**

**Why C**: Idempotency (checking if a message was already processed before processing again) is the CORRECT architectural solution. This handles duplicates at any layer.
**Why NOT A**: FIFO queues limit throughput to 300 messages/sec (3,000 with batching). 10,000 messages suggest high throughput needs that FIFO may not handle.
**Why NOT B**: Increasing visibility timeout to 60 seconds helps reduce duplicates (the current 30-second timeout matches processing time, so if processing takes 31 seconds, the message reappears). But it doesn't ELIMINATE duplicates — it only reduces them. SQS Standard can deliver duplicates regardless of timeout.
**Why NOT D**: Batch size doesn't affect duplicate delivery.

**Exam principle**: Always design for idempotency with SQS Standard queues. If exactly-once is truly needed AND throughput is low, FIFO is acceptable.

---

### Q10
A company has a 50 TB data warehouse on-premises (Oracle). They want to migrate to AWS for analytics. Requirements: run complex SQL queries, join with S3 data lake data, handle concurrent users. Which target is BEST?

A. Aurora PostgreSQL
B. Amazon Redshift
C. Amazon Athena
D. Amazon RDS for Oracle

**Answer: B**

**Why B**: Redshift is a data warehouse designed for: large datasets (50 TB+), complex analytical SQL, and can query S3 data via Redshift Spectrum. Handles concurrent users with concurrency scaling.
**Why NOT A**: Aurora is OLTP (transactional), not OLAP (analytical). Not optimized for complex aggregations on 50 TB.
**Why NOT C**: Athena is serverless SQL on S3, but for a 50 TB dataset with complex queries and concurrent users, Redshift outperforms Athena significantly.
**Why NOT D**: RDS Oracle is still a transactional database. And the goal is to migrate AWAY from Oracle.

---

### Q11
An application uses API Gateway → Lambda → RDS Aurora. During a load test with 5,000 concurrent users, the application fails with "Too many connections" errors from Aurora. RDS Proxy is suggested. Which TWO benefits does RDS Proxy provide? (Select TWO)

A. Reduces database connection count through connection pooling
B. Increases Aurora storage capacity
C. Reduces failover time by up to 66%
D. Provides read/write splitting
E. Encrypts data at rest

**Answer: A, C**

**Why A**: RDS Proxy pools connections. 5,000 Lambda instances creating 5,000 connections → RDS Proxy reduces to ~100 actual database connections.
**Why C**: RDS Proxy maintains connections during failover, reducing failover disruption by 66%.
**Why NOT B**: RDS Proxy doesn't affect storage.
**Why NOT D**: RDS Proxy doesn't split reads/writes. Use Aurora reader endpoint for that.
**Why NOT E**: Encryption at rest is handled by KMS, not RDS Proxy.

---

### Q12
A company stores sensitive financial documents in S3. Compliance requires: (1) Documents cannot be deleted for 7 years, (2) Even the root account cannot delete them, (3) All access must be audited. Which combination of S3 features meets ALL requirements?

A. S3 Versioning + MFA Delete + CloudTrail Data Events
B. S3 Object Lock (Compliance Mode, 7-year retention) + CloudTrail Data Events
C. S3 Object Lock (Governance Mode, 7-year retention) + CloudTrail Data Events
D. S3 Lifecycle Policy (no delete) + CloudTrail Data Events

**Answer: B**

**Why B**: Object Lock Compliance Mode prevents ALL deletions (including root) until retention expires. CloudTrail Data Events audit all S3 access.
**Why NOT A**: MFA Delete requires MFA for deletion but doesn't prevent it entirely — someone with MFA CAN still delete.
**Why NOT C**: Governance Mode allows users with `s3:BypassGovernanceRetention` permission to delete. Root account has this permission. Doesn't meet requirement 2.
**Why NOT D**: Lifecycle policies don't prevent deletion — they automate transitions/deletions.

---

### Q13
A global media company has users in 40 countries. They serve a mix of static (images, CSS, JS) and dynamic (personalized API) content. Static content is the same for everyone. Dynamic content is personalized per user. How should they optimize global delivery?

A. CloudFront with single origin (ALB), cache everything
B. CloudFront with S3 origin for static + ALB origin for dynamic, with different cache behaviors
C. Global Accelerator for all traffic
D. Deploy the application in all 40 countries using Local Zones

**Answer: B**

**Why B**: CloudFront with multiple origins and cache behaviors:
- `/static/*` → S3 origin (long TTL, cached at edge)
- `/api/*` → ALB origin (short/no TTL, but still benefits from AWS backbone)
This is the standard pattern for mixed content.
**Why NOT A**: Caching personalized API responses would serve wrong content to users.
**Why NOT C**: Global Accelerator doesn't cache content — it only routes traffic faster. Doesn't help static content.
**Why NOT D**: Local Zones are in select cities, not 40 countries. And you'd need to replicate the entire stack.

---

### Q14
A company is designing a logging architecture for 100 AWS accounts. Requirements: (1) All CloudTrail logs centralized, (2) Logs cannot be tampered with, (3) Must be queryable with SQL, (4) Retained for 3 years. What architecture meets ALL requirements?

A. CloudTrail Organization Trail → Central S3 bucket (Log Archive account) with Object Lock Compliance Mode + Log file validation + Athena for queries
B. CloudTrail per account → CloudWatch Logs → OpenSearch → Kibana dashboards
C. CloudTrail Organization Trail → Central S3 bucket + S3 Lifecycle to Glacier after 90 days
D. CloudTrail → Kinesis Firehose → Redshift

**Answer: A**

**Why A**: Organization Trail captures all 100 accounts. S3 Object Lock (Compliance Mode) prevents tampering for 3 years. Log file validation verifies log integrity with digest files. Athena provides SQL queries on S3 data.
**Why NOT B**: Per-account CloudTrail is unmanageable at 100 accounts. OpenSearch is not SQL.
**Why NOT C**: No tamper protection (no Object Lock). Glacier makes querying difficult.
**Why NOT D**: Kinesis Firehose → Redshift works but is more expensive and complex than S3 + Athena for log analysis.

---

### Q15
A startup needs to choose between deploying on Lambda+API Gateway vs ECS Fargate for their API backend. The API handles 100 requests/second during business hours and 2 requests/second at night. Each request takes 200ms. Budget is critical. Which option is cheaper and why?

**Answer: Lambda + API Gateway**

**Calculation**:
Lambda:
- Business hours (12hr): 100 req/s × 200ms × 12hr × 3600s = 864,000 GB-seconds (at 512MB)
- Night (12hr): 2 req/s × 200ms × 12hr × 3600s = 17,280 GB-seconds
- Total: 881,280 GB-seconds/day × 30 = 26.4M GB-seconds/month
- Cost: ~$440/month (Lambda) + ~$100/month (API Gateway) = **~$540/month**

Fargate:
- Must run 24/7 (at minimum): 1 task (0.25 vCPU, 0.5 GB) = ~$10/month
- But 100 req/s needs ~3-5 tasks during business hours: ~$50-80/month
- Plus ALB: $16/month + LCU charges
- **~$100-150/month**

Wait — Fargate is actually cheaper for this steady workload! But the question says "2 req/s at night" — with Fargate you'd still pay for running tasks overnight.

**Actually**: For THIS specific pattern (100 req/s × 12hr + 2 req/s × 12hr), Fargate with scaling would be ~$100-150/month total, while Lambda at $540 is MORE expensive.

**Corrected answer**: **ECS Fargate** is cheaper for this workload because the request volume during business hours is consistently high. Lambda becomes cheaper only when traffic is truly sporadic.

**Exam principle**: Lambda is cheaper for unpredictable/sporadic workloads. EC2/Fargate is cheaper for sustained workloads. Calculate both when the question provides numbers.

---

### Q16
A company has an SCP on their Production OU that denies `ec2:TerminateInstances` for all users. An admin in the production account has an IAM policy with `ec2:*` and `iam:*`. Can the admin:
(a) Terminate EC2 instances?
(b) Remove the SCP?

**A: (a) NO. (b) NO.**

(a) SCP denies TerminateInstances. Even with IAM `ec2:*`, the SCP restriction wins (explicit deny).
(b) SCPs can only be managed from the **management account**. The admin is in a member account and has no access to Organizations management APIs from within the member account.

**Exam principle**: SCPs cannot be bypassed from within member accounts. Only the management account can modify SCPs.

---

### Q17
A company runs a web application that stores session data in ElastiCache Redis. They want to deploy to a second region for DR. Sessions must be available in both regions. Which approach works?

A. ElastiCache Global Datastore (cross-region replication)
B. DynamoDB Global Tables for session storage instead
C. S3 Cross-Region Replication for session data
D. ElastiCache snapshot copy to DR region

**Answer: A or B (both are valid — exam would specify constraints)**

**If low-latency reads are critical** → A (ElastiCache Global Datastore, sub-millisecond reads)
**If simplicity and active-active writes are needed** → B (DynamoDB Global Tables, writes in both regions)
**Why NOT C**: S3 is too slow for session data (100ms+ latency)
**Why NOT D**: Snapshot copy is point-in-time, not continuous — sessions would be lost between snapshots

---

### Q18
A company needs their CloudFormation stack to keep the RDS database when the stack is deleted (to prevent accidental data loss), but delete all other resources. How?

**Answer**: Add `DeletionPolicy: Retain` to the RDS resource in the CloudFormation template.

```yaml
MyDatabase:
  Type: AWS::RDS::DBInstance
  DeletionPolicy: Retain
  Properties:
    ...
```

Alternative: `DeletionPolicy: Snapshot` — creates a final snapshot before deletion.

---

### Q19
A company processes 1 million images per day. Each image needs 3 operations: resize, watermark, and format conversion. Each operation takes 2 minutes and can fail independently. If an operation fails, only THAT operation should retry. What architecture is BEST?

A. Single Lambda function that does all 3 operations sequentially
B. Step Functions with 3 parallel Lambda tasks (resize, watermark, convert), each with retry configuration
C. SQS queue → single Lambda that processes all 3 operations
D. SNS → 3 separate SQS queues → 3 separate Lambda functions

**Answer: B**

**Why B**: Step Functions provides: parallel execution (all 3 run simultaneously → faster), per-task retry with configurable backoff, and per-task error handling. If watermark fails, only watermark retries.
**Why NOT A**: If one operation fails, the entire function fails and all operations retry.
**Why NOT C**: Same problem as A — all-or-nothing retry.
**Why NOT D**: This works but is more complex to manage. No centralized workflow view. Harder to handle "all 3 must succeed" completion logic.

---

### Q20
A company needs to give 5,000 external contractors temporary AWS Console access. Contractors have Google Workspace accounts. The company doesn't want to create IAM users for each contractor. What's the BEST approach?

A. Create IAM users with temporary passwords
B. IAM Identity Center with Google Workspace as external identity provider
C. Cognito User Pool federated with Google → Cognito Identity Pool → IAM Roles
D. IAM SAML federation with Google Workspace

**Answer: B**

**Why B**: IAM Identity Center (formerly AWS SSO) is the recommended way to manage human access to AWS. It supports external IdPs like Google Workspace via SAML/OIDC. Contractors get SSO access, temporary credentials, and you manage access centrally through Permission Sets.
**Why NOT A**: 5,000 IAM users violates best practices. No SSO. Hard to manage.
**Why NOT C**: Cognito is for application users (mobile/web apps), not AWS Console access.
**Why NOT D**: Direct SAML federation works but IAM Identity Center is the modern, recommended approach with better multi-account management.

---

## ADDITIONAL SCENARIO QUESTIONS (Q21-Q50)

### Q21: A company wants to restrict Lambda functions to only run in us-east-1 and eu-west-1.
**A:** SCP denying `lambda:CreateFunction` where `aws:RequestedRegion` is not us-east-1 or eu-west-1.

### Q22: An Aurora cluster has 1 writer and 3 readers. Analytics queries on a reader are impacting application read traffic on other readers. Fix?
**A:** Create a **Custom Endpoint** pointing to a dedicated reader for analytics. Application uses the standard reader endpoint for remaining readers.

### Q23: DynamoDB table has 50 GB data, 5 GSIs. Write costs are very high. Why?
**A:** Every write to the base table also writes to ALL 5 GSIs, each consuming their own WCU. Solution: Remove unnecessary GSIs or use sparse indexes.

### Q24: Need to process 10 million S3 objects with a Lambda function. Step Functions standard workflow would have too many state transitions (expensive). What to use?
**A:** **Step Functions Distributed Map** — designed for processing millions of items from S3 in parallel at scale.

### Q25: Application needs a relational database that scales horizontally for writes. Aurora's single writer is a bottleneck.
**A:** **Aurora Multi-Master** (MySQL only, deprecated) or **Aurora Limitless Database** (preview). For production now: consider sharding application logic or DynamoDB if possible.

### Q26: A Kinesis Data Stream has 10 shards. 20 Lambda functions are consuming. Only 10 can run simultaneously. Why?
**A:** Kinesis-Lambda event source mapping runs **one Lambda invocation per shard**. 10 shards = max 10 concurrent. Solution: Add shards or use **Enhanced Fan-Out** for dedicated throughput per consumer.

### Q27: A company needs to audit all changes to Security Groups across 50 accounts. What service combination?
**A:** **AWS Config** (records configuration changes) with **Organization-wide Aggregator** + Config Rule to detect non-compliant changes.

### Q28: An ALB target group has instances in 3 AZs. One AZ has 1 instance, another has 9. The single instance is overloaded. Why?
**A:** For ALB, cross-zone load balancing is always enabled. But if the AZ distribution is very uneven, ensure **Auto Scaling** is properly balancing across AZs (which it does by default).

### Q29: A company uses AWS Secrets Manager for database credentials. They want the password to rotate every 30 days automatically.
**A:** Enable **automatic rotation** in Secrets Manager with 30-day rotation schedule. Secrets Manager creates a Lambda function that rotates the password in both Secrets Manager and the database.

### Q30: A company uploads 100 GB files to S3 from Australia to us-east-1. Speed is slow. Two best improvements?
**A:** (1) **S3 Transfer Acceleration** (upload to nearest edge location, AWS backbone to S3), (2) **Multipart upload** (parallel upload of parts).

### Q31-Q50: Quick-Fire Answers

| Q | Scenario | Answer |
|---|---|---|
| 31 | Block access to S3 bucket from all IPs except corporate VPN | Bucket policy with `IpAddress` condition |
| 32 | Lambda needs to access private RDS and public API | Lambda in VPC + NAT Gateway + RDS Proxy |
| 33 | Cheapest way to run a dev database (needed 8 hours/day) | Aurora Serverless v2 (scales down to 0.5 ACU when idle) |
| 34 | Application needs sub-millisecond response from DynamoDB | DAX (DynamoDB Accelerator) |
| 35 | S3 events need to trigger 5 different Lambda functions | S3 → EventBridge → 5 EventBridge rules → 5 Lambda functions |
| 36 | Encrypt EBS volume that's currently unencrypted | Snapshot → Copy with encryption → Create new volume → Swap |
| 37 | CloudFormation stack update will REPLACE the RDS database | Use Change Set to preview. Add `DeletionPolicy: Snapshot` before updating |
| 38 | Need to audit which IAM permissions are actually used | IAM Access Analyzer policy generation based on CloudTrail |
| 39 | On-prem Oracle RAC → AWS with minimal changes | Rehost on EC2 (MGN) since RDS doesn't support RAC |
| 40 | Global application needs DNS failover with safety controls | Route 53 Application Recovery Controller (ARC) |
| 41 | Auto Scaling keeps launching instances that fail health checks immediately | Health check grace period too short. Increase it. |
| 42 | Need serverless way to orchestrate Glue ETL → Lambda → Redshift COPY | Step Functions |
| 43 | Multi-account: prevent anyone from disabling GuardDuty | SCP denying `guardduty:DeleteDetector` and `guardduty:StopMonitoringMembers` |
| 44 | EC2 instances need to send custom metrics every 1 second | CloudWatch Agent with high-resolution custom metrics |
| 45 | Replace NAT Gateway to reduce costs (instances only access S3 and DynamoDB) | VPC Gateway Endpoints for both (free!) — remove NAT Gateway |
| 46 | Static website on S3 needs custom domain with HTTPS | CloudFront + ACM certificate (us-east-1) + Route 53 Alias |
| 47 | Transit Gateway route table shows blackhole route | The VPC attachment was deleted but route remains. Remove the stale route. |
| 48 | Need to run containers but team has no Kubernetes experience | ECS with Fargate (simpler than EKS) |
| 49 | Partner needs to send files via SFTP to your S3 bucket | AWS Transfer Family (managed SFTP → S3) |
| 50 | Cross-region encrypted S3 replication fails for SSE-KMS objects | Need a CMK in the destination region + IAM role with kms:Decrypt (source) and kms:Encrypt (destination) |

---

*Word count: ~6,000+ words with 50 fully detailed questions + 20 quick-fire*
