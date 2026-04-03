# SAP-C02 Flashcards - Set 1: Baseline Assessment Terms

**Instructions:**
- Use these with Anki, Quizlet, or physical cards
- Study Front → Back first
- Once comfortable, practice Back → Front (given AWS term, explain it)
- Mark difficult cards and review daily

**Format:**
- **Front:** Your concept / What you said
- **Back:** AWS official term + key details

---

## COMPUTE SERVICES

### Card 1
**Front:** "Pay beforehand for a discount to guarantee you'll use the instance"
**Back:** **Reserved Instances (RI)**
- Commit to 1 or 3 years
- Up to 72% savings vs On-Demand
- Types: Standard (can't change), Convertible (can change instance family)
- Payment: All upfront, partial upfront, or no upfront

---

### Card 2
**Front:** "Pay only when the instance is running, no commitment"
**Back:** **On-Demand Instances**
- Pay by the second (minimum 60 seconds)
- No long-term commitment
- Most expensive option
- Use for: Unpredictable workloads, short-term, testing

---

### Card 3
**Front:** "Use spare AWS capacity for up to 90% discount, can be interrupted"
**Back:** **Spot Instances**
- Bid on unused EC2 capacity
- Up to 90% savings vs On-Demand
- AWS can terminate with 2-minute warning
- Use for: Fault-tolerant, flexible workloads (batch, big data)

---

### Card 4
**Front:** "Flexible pricing where you commit to $/hour instead of specific instance"
**Back:** **Savings Plans**
- Commit to $/hour for 1 or 3 years
- Up to 72% savings vs On-Demand
- More flexible than Reserved Instances (can change instance family)
- Types: Compute Savings Plan, EC2 Savings Plan, SageMaker Savings Plan

---

### Card 5
**Front:** "Lambda pricing = memory × time"
**Back:** **GB-seconds**
- Formula: Memory (GB) × Duration (seconds)
- Example: 1 GB × 30 sec = 30 GB-seconds
- More memory = more CPU (AWS scales together)
- Use Lambda Power Tuning to find optimal memory

---

### Card 6
**Front:** "Keep Lambda warm to avoid cold starts"
**Back:** **Provisioned Concurrency**
- Keeps functions initialized and ready
- Eliminates cold start latency
- Pay for provisioned capacity even when idle
- Use for: Latency-sensitive applications with predictable traffic

---

## NETWORKING SERVICES

### Card 7
**Front:** "Allows resources in VPC to access the internet directly (two-way)"
**Back:** **Internet Gateway (IGW)**
- Enables internet access for VPC
- Bidirectional (inbound and outbound)
- One per VPC
- Free (no charges)
- Attach to VPC, add route in route table (0.0.0.0/0 → IGW)

---

### Card 8
**Front:** "Proxy server that converts private IP to public for outbound internet only"
**Back:** **NAT Gateway**
- Network Address Translation
- Enables private subnet resources to reach internet
- Outbound-only (stateful - responses allowed back)
- Must be in public subnet
- ~$0.045/hour + data transfer costs
- Managed by AWS (highly available in one AZ)

---

### Card 9
**Front:** "Old way to do NAT using EC2 instance"
**Back:** **NAT Instance**
- EC2 instance configured for NAT
- You manage it (patching, failover, etc.)
- Legacy approach (use NAT Gateway instead)
- Cheaper for very low traffic
- Single point of failure unless you configure HA

---

### Card 10
**Front:** "What makes a subnet 'public' vs 'private'?"
**Back:** **Route Table Configuration**
- **Public subnet:** Route table has 0.0.0.0/0 → Internet Gateway
- **Private subnet:** Route table has 0.0.0.0/0 → NAT Gateway (or no internet route)
- The route table determines internet accessibility
- Instances in public subnet also need public IP or Elastic IP

---

### Card 11
**Front:** "DNS service for routing, also does health checks"
**Back:** **Route 53**
- AWS's DNS service
- Register domains or use existing
- Routing policies: Simple, Weighted, Latency, Failover, Geolocation, Geoproximity, Multi-value
- Health checks for failover
- $0.50/hosted zone/month + $0.40 per million queries

---

### Card 12
**Front:** "Gradual traffic shifting like AB testing or canary release"
**Back:** **Route 53 Weighted Routing**
- Distribute traffic across multiple resources
- Assign weights (0-255) to each record
- Example: 90% to new version, 10% to old (canary deployment)
- Use for: A/B testing, gradual migration, blue/green deployments

---

### Card 13
**Front:** "Automatic DNS failover to secondary region"
**Back:** **Route 53 Failover Routing**
- Primary and secondary resources
- Health checks on primary
- If primary fails → automatic failover to secondary
- Use for: Active-passive DR architecture
- Can combine with weighted routing for more control

---

## STORAGE SERVICES

### Card 14
**Front:** "S3 storage tiers based on access frequency"
**Back:** **S3 Storage Classes**
- 7 classes total (Standard, Standard-IA, One Zone-IA, Intelligent-Tiering, Glacier Instant, Glacier Flexible, Glacier Deep Archive)
- Choose based on: Access frequency, retrieval time needs, durability needs
- Lifecycle policies automatically transition between classes

---

### Card 15
**Front:** "S3 tier for frequent access (most expensive)"
**Back:** **S3 Standard**
- $0.023/GB/month (first 50 TB)
- Millisecond latency
- 99.99% availability
- 11 9's durability (99.999999999%)
- Use for: Active data, frequently accessed

---

### Card 16
**Front:** "S3 tier for data accessed monthly, cheaper than Standard"
**Back:** **S3 Standard-IA (Infrequent Access)**
- $0.0125/GB/month (~45% cheaper than Standard)
- Millisecond latency (same as Standard!)
- 99.9% availability
- Minimum storage duration: 30 days
- Retrieval fee: $0.01/GB
- Use for: Backups, disaster recovery, infrequently accessed files

---

### Card 17
**Front:** "S3 archive tier with instant access (no delay)"
**Back:** **S3 Glacier Instant Retrieval**
- $0.004/GB/month (~68% cheaper than Standard)
- Millisecond latency (instant access!)
- 99.9% availability
- Minimum storage duration: 90 days
- Retrieval fee: $0.03/GB
- Use for: Rarely accessed data that must be instant when needed

---

### Card 18
**Front:** "S3 archive tier with minutes-to-hours retrieval"
**Back:** **S3 Glacier Flexible Retrieval**
- $0.0036/GB/month (~84% cheaper than Standard)
- Retrieval times: 1-5 min (Expedited), 3-5 hrs (Standard), 5-12 hrs (Bulk)
- Minimum storage duration: 90 days
- Use for: Long-term backups, archives where delay is acceptable

---

### Card 19
**Front:** "S3 cheapest tier, 12-48 hour retrieval"
**Back:** **S3 Glacier Deep Archive**
- $0.00099/GB/month (~96% cheaper than Standard)
- Retrieval time: 12 hours (Standard), 48 hours (Bulk)
- Minimum storage duration: 180 days
- Use for: Compliance archives, data that will rarely/never be accessed

---

### Card 20
**Front:** "Automatically transition S3 objects between storage classes"
**Back:** **S3 Lifecycle Policies**
- Rules to automatically manage object lifecycle
- Actions: Transition (change storage class), Expiration (delete)
- Based on: Object age, prefix, tags
- Example: Standard → IA after 30 days → Glacier after 90 days → Delete after 7 years

---

### Card 21
**Front:** "Replicate S3 objects to another bucket/region automatically"
**Back:** **S3 Cross-Region Replication (CRR)**
- Automatic, asynchronous copying to destination bucket
- Can be same or different region
- Requires versioning enabled on both buckets
- Use for: Disaster recovery, compliance, latency optimization
- Only replicates NEW objects (not existing unless you use Batch Replication)

---

### Card 22
**Front:** "Block all public access to S3 bucket (safety feature)"
**Back:** **S3 Block Public Access**
- Four settings to prevent public access
- Can be set at account or bucket level
- Overrides bucket policies and ACLs
- Best practice: Enable by default, disable only when needed
- Use for: Preventing accidental public exposure (like Q9 incident!)

---

### Card 23
**Front:** "Cache S3 content at edge locations globally"
**Back:** **CloudFront**
- Content Delivery Network (CDN)
- Caches content at 400+ edge locations worldwide
- Reduces latency for global users
- Can cache: S3 objects, API Gateway responses, custom origins
- Supports: HTTP/HTTPS, WebSocket, video streaming

---

### Card 24
**Front:** "HTTP header that controls how long CloudFront caches content"
**Back:** **Cache-Control Header**
- `Cache-Control: max-age=3600` (cache for 1 hour)
- `Cache-Control: public, max-age=600` (cache for 10 minutes)
- `Cache-Control: no-cache` (always revalidate)
- Controls TTL (Time To Live) at CloudFront edge
- Set by origin server (S3, API Gateway, etc.)

---

### Card 25
**Front:** "CloudFront identity to access private S3 bucket"
**Back:** **Origin Access Control (OAC) / Origin Access Identity (OAI)**
- Special CloudFront identity
- S3 bucket policy grants access to OAC only
- S3 bucket stays private (no public access)
- Users access via CloudFront only
- OAC is newer, recommended over legacy OAI

---

## DATABASE SERVICES

### Card 26
**Front:** "NoSQL database, flexible schema, auto-scales"
**Back:** **DynamoDB**
- Fully managed NoSQL (key-value/document)
- Millisecond latency at any scale
- No schema (flexible structure)
- Auto-scaling (can handle spikes)
- Use for: Mobile/gaming apps, IoT, session stores
- Pricing: Pay per request OR provisioned capacity

---

### Card 27
**Front:** "DynamoDB pricing where you pay per read/write"
**Back:** **DynamoDB On-Demand Mode**
- Pay per request (read/write)
- No capacity planning needed
- Automatically scales to any workload
- More expensive per request than Provisioned
- Use for: Unpredictable traffic, new applications, spiky workloads

---

### Card 28
**Front:** "DynamoDB pricing where you reserve capacity upfront"
**Back:** **DynamoDB Provisioned Mode**
- Specify Read/Write Capacity Units (RCUs/WCUs)
- Cheaper per request than On-Demand
- Can use Auto Scaling
- Use for: Predictable traffic patterns
- Can get throttled if you exceed capacity

---

### Card 29
**Front:** "DynamoDB cache for microsecond latency"
**Back:** **DAX (DynamoDB Accelerator)**
- In-memory cache for DynamoDB
- Microsecond latency (vs milliseconds)
- Fully managed
- Compatible with existing DynamoDB API
- Use for: Read-heavy workloads needing extreme performance

---

### Card 30
**Front:** "Managed relational database service"
**Back:** **RDS (Relational Database Service)**
- Managed SQL databases (MySQL, PostgreSQL, MariaDB, Oracle, SQL Server)
- AWS handles: Patching, backups, replication
- You choose instance size
- Multi-AZ for high availability
- Read Replicas for scaling reads

---

### Card 31
**Front:** "RDS automatic failover to standby in another AZ"
**Back:** **RDS Multi-AZ**
- Synchronous replication to standby in different AZ
- Automatic failover (~60 seconds)
- Single endpoint (DNS switches automatically)
- Use for: High availability (99.95%)
- NOT for read scaling (standby is not accessible)

---

### Card 32
**Front:** "RDS copy for offloading read traffic"
**Back:** **RDS Read Replica**
- Asynchronous replication from primary
- Can be in same region or cross-region
- Up to 15 Read Replicas per primary
- Each has its own endpoint
- Use for: Read scaling, analytics workloads, DR (can be promoted)

---

### Card 33
**Front:** "MySQL/PostgreSQL compatible with better performance and HA"
**Back:** **Aurora**
- AWS's cloud-native relational database
- MySQL or PostgreSQL compatible
- 5x faster than MySQL, 3x faster than PostgreSQL
- Storage auto-scales (10GB to 128TB)
- Up to 15 Read Replicas
- Multi-AZ by default (6 copies across 3 AZs)

---

### Card 34
**Front:** "Aurora that auto-scales compute capacity based on load"
**Back:** **Aurora Serverless**
- Automatically scales compute (ACUs - Aurora Capacity Units)
- Can pause when idle (no charges during pause)
- Use for: Infrequent/unpredictable workloads, dev/test
- v2: Better scaling, more features (recommended)

---

### Card 35
**Front:** "Aurora with primary in one region, replicas in other regions"
**Back:** **Aurora Global Database**
- Primary cluster in one region
- Up to 5 secondary regions (read replicas)
- Sub-second replication lag
- Disaster recovery: Promote secondary to primary in <1 minute
- Use for: Global applications, DR

---

## SECURITY & IDENTITY

### Card 36
**Front:** "AWS identity that can be assumed by services (no passwords)"
**Back:** **IAM Role**
- Identity with permissions
- No long-term credentials
- Can be assumed by: AWS services (Lambda, EC2), users, other accounts
- Uses temporary security credentials (auto-rotated)
- Use for: AWS-to-AWS service access

---

### Card 37
**Front:** "Document that defines what actions are allowed/denied"
**Back:** **IAM Policy**
- JSON document with permissions
- Elements: Effect (Allow/Deny), Action (what), Resource (where), Condition (when)
- Types: Managed (AWS/customer created), Inline (embedded in user/role)
- Evaluation: Explicit deny > explicit allow > implicit deny

---

### Card 38
**Front:** "Store API keys, passwords, database credentials securely"
**Back:** **AWS Secrets Manager**
- Encrypted secret storage
- Automatic rotation of secrets
- Integration with RDS, Redshift, DocumentDB
- Versioning of secrets
- Use for: Database passwords, API keys for 3rd party services
- Cost: $0.40/secret/month + $0.05 per 10,000 API calls

---

### Card 39
**Front:** "Store configuration values and simple secrets (cheaper alternative)"
**Back:** **Systems Manager Parameter Store**
- Store: Configuration data, secrets, license keys
- Free tier: Standard parameters (up to 10,000)
- Supports: String, StringList, SecureString (encrypted with KMS)
- No automatic rotation (unlike Secrets Manager)
- Use for: App config, non-critical secrets, cost optimization

---

### Card 40
**Front:** "Encryption key management service"
**Back:** **KMS (Key Management Service)**
- Create and manage encryption keys
- Integrates with most AWS services
- Types: AWS managed keys (free), Customer managed keys ($1/month)
- Automatic key rotation (yearly for customer managed)
- Audit key usage with CloudTrail

---

## MIGRATION & DISASTER RECOVERY

### Card 41
**Front:** "Move database with minimal downtime using continuous replication"
**Back:** **DMS (Database Migration Service)**
- Migrate databases to/from AWS
- Supports: Homogeneous (Oracle→RDS Oracle) and Heterogeneous (Oracle→Aurora)
- Migration types: Full load, Full load + CDC (Change Data Capture), CDC only
- Minimal downtime (continuous replication)
- Use Schema Conversion Tool (SCT) for schema conversion

---

### Card 42
**Front:** "6 ways to migrate applications to cloud"
**Back:** **6 R's of Migration**
1. **Rehost** (Lift-and-Shift) - Move as-is to cloud
2. **Replatform** (Lift-Tinker-Shift) - Minor cloud optimizations
3. **Repurchase** (Drop-and-Shop) - Switch to SaaS
4. **Refactor** (Re-architect) - Redesign for cloud-native
5. **Retire** - Decommission unneeded systems
6. **Retain** - Keep on-premises (for now)

---

### Card 43
**Front:** "How long to recover after disaster"
**Back:** **RTO (Recovery Time Objective)**
- Time from disaster to full recovery
- Example: "Must be back online in 4 hours"
- Lower RTO = More expensive (need warm/hot standby)
- Measured in: Minutes, hours, or days

---

### Card 44
**Front:** "How much data can you afford to lose"
**Back:** **RPO (Recovery Point Objective)**
- Maximum acceptable data loss
- Example: "Can lose max 1 hour of data"
- Lower RPO = More expensive (need frequent backups/replication)
- Measured in: Minutes, hours, or days

---

### Card 45
**Front:** "One region active, other region on standby"
**Back:** **Active-Passive Architecture**
- Primary region handles all traffic
- Secondary region is standby (warm or cold)
- Failover when primary fails
- Strong consistency (no split-brain)
- Use for: Most DR scenarios
- Examples: Multi-AZ RDS, Route 53 failover

---

### Card 46
**Front:** "Both regions active, serving traffic simultaneously"
**Back:** **Active-Active Architecture**
- Multiple regions serve traffic simultaneously
- Route 53 distributes traffic (latency, geolocation)
- Higher availability (99.99%+)
- Complexity: Need conflict resolution, data synchronization
- Use for: Global applications, very high availability needs
- Examples: DynamoDB Global Tables, Aurora Global Database

---

## MONITORING & COST

### Card 47
**Front:** "AWS monitoring service for metrics and logs"
**Back:** **CloudWatch**
- Collect and track metrics
- Collect and monitor log files
- Set alarms and automated actions
- Standard metrics: CPU, disk, network (free)
- Custom metrics: Application-specific (paid)
- Retention: 15 months (metrics), configurable (logs)

---

### Card 48
**Front:** "Track all API calls and changes in AWS account"
**Back:** **CloudTrail**
- Records all API calls (who did what when)
- Use for: Security auditing, compliance, troubleshooting
- Events: Management events (control plane), Data events (data plane)
- Delivers logs to S3
- Can create alarms for specific API calls

---

### Card 49
**Front:** "Set spending limits and get alerts"
**Back:** **AWS Budgets**
- Set custom cost/usage budgets
- Alerts via email/SNS when threshold exceeded
- Types: Cost budgets, Usage budgets, Reservation budgets
- Can set actions (stop instances, send notification)
- First 2 budgets free, $0.02/day per budget after

---

### Card 50
**Front:** "Queue for messages that failed processing"
**Back:** **Dead Letter Queue (DLQ)**
- SQS queue for failed messages
- Messages sent to DLQ after max receive count exceeded
- Use for: Debugging, ensuring no message loss, manual review
- Separate from main queue
- Example: Lambda failures, SQS processing failures

---

## 🎯 STUDY RECOMMENDATIONS

### Daily Practice:
1. **Morning (10 min):** Review all 50 cards
2. **Evening (10 min):** Focus on cards you got wrong
3. **Weekend (30 min):** Test both directions (Front→Back and Back→Front)

### Mastery Levels:
- **Day 1-3:** Front → Back (recognition)
- **Day 4-7:** Back → Front (recall)
- **Week 2:** Random order, both directions
- **Week 3:** Can explain each term to someone else

### Tips:
- ✅ Say answers out loud (strengthens memory)
- ✅ Write difficult cards on physical cards
- ✅ Group by category (Compute, Network, Storage, etc.)
- ✅ Connect terms to your baseline questions
- ✅ Add your own notes to each card

---

## 📚 NEXT STEPS

After mastering these 50 cards:

**Set 2: Advanced Networking** (Transit Gateway, Direct Connect, VPN)  
**Set 3: Container Services** (ECS, EKS, Fargate)  
**Set 4: Serverless** (Lambda, API Gateway, Step Functions)  
**Set 5: Advanced Security** (Organizations, SCPs, GuardDuty)  

But FIRST, master these 50! They cover 70% of what you need from your baseline assessment.

---

## 🎯 YOUR GOAL

**By end of Week 2:**
- [ ] Can recall all 50 terms instantly
- [ ] Can explain each in your own words
- [ ] Can identify which service to use for given scenario
- [ ] Ready for Set 2 flashcards!

**You've got this!** These are the exact terms that will transform your 40% baseline to 60%+ in just 2 weeks!

---

*Flashcard Set 1 - Created from Baseline Assessment - March 20, 2026*
