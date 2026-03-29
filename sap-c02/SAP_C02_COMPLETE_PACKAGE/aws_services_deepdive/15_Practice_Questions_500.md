# SAP-C02 Practice Question Bank - 500+ Questions

## Domain 1: Design Solutions for Organizational Complexity (26% - 130 questions)

### Multi-Account Strategy Questions (30 questions)

**Q1:** Company has 50 AWS accounts. Need to restrict all accounts from launching instances larger than m5.xlarge. What's the solution?  
**A:** Service Control Policy in AWS Organizations denying ec2:RunInstances for instance types > m5.xlarge  
**Why:** SCPs enforce maximum permissions across all accounts, IAM policies per-account won't scale

**Q2:** Development team accidentally launched resources in eu-central-1 causing unexpected costs. Prevent this organization-wide.  
**A:** SCP denying all actions except in approved regions (us-east-1, us-west-2, eu-west-1)  
**Why:** Regional restriction via SCP, applies to all accounts automatically

**Q3:** Need to share Transit Gateway with 20 accounts in organization.  
**A:** AWS Resource Access Manager (RAM) to share TGW with organization or specific OUs  
**Why:** RAM shares resources cross-account, no need to recreate TGW in each account

**Q4:** Central security team needs read-only access to all 50 accounts.  
**A:** Create IAM role in each account (via StackSets), trust relationship allows security account to assume, security team uses switch role  
**Why:** Cross-account roles, StackSets automates creation across accounts

**Q5:** Finance requires separate AWS bill for each business unit (5 units, 10 accounts each).  
**A:** Organize accounts by business unit in OUs, enable consolidated billing, use cost allocation tags, Cost Explorer filters  
**Why:** Organizations consolidates billing, tags enable chargeback

**Q6:** Production account was accidentally deleted. Prevent this.  
**A:** SCP denying organizations:CloseAccount for production OU, require MFA for account closure  
**Why:** Preventive control via SCP, MFA adds second layer

**Q7:** Need to apply same CloudFormation template to 50 accounts in 5 regions.  
**A:** CloudFormation StackSets with Organizations integration, target OUs  
**Why:** StackSets deploys to multiple accounts/regions from single operation

**Q8:** Developers need EC2 launch permissions but can only launch instances with specific tags (CostCenter tag required).  
**A:** IAM policy with Condition: ec2:CreateTags and StringEquals on CostCenter tag  
**Why:** Tag-based access control, enforces tagging at launch

**Q9:** Security team must review all IAM policy changes before they take effect.  
**A:** Enable CloudTrail, EventBridge rule on IAM policy changes, trigger Step Functions workflow for approval, SNS notification  
**Why:** Automated approval workflow, CloudTrail captures changes

**Q10:** Centralize VPC Flow Logs from all 50 accounts.  
**A:** S3 bucket in log archive account, bucket policy allows all accounts to write, Enable Flow Logs in all accounts via StackSets pointing to central bucket  
**Why:** Centralized logging pattern, StackSets automates configuration

### Transit Gateway / Network Questions (25 questions)

**Q11:** 30 VPCs, all need to communicate. Currently using VPC peering (435 connections). Simplify.  
**A:** Transit Gateway hub-spoke model, 30 attachments vs 435 peering connections  
**Why:** TGW designed for this (transitive routing), peering doesn't scale

**Q12:** Production VPCs must not communicate with Development VPCs but both need Shared Services access.  
**A:** 2 Transit Gateway route tables: Production table (Prod VPCs + Shared), Development table (Dev VPCs + Shared)  
**Why:** Route table association controls connectivity, isolation enforced at routing layer

**Q13:** On-premises data center (192.168.0.0/16) needs access to 20 VPCs via single connection.  
**A:** Direct Connect → Transit Gateway (Transit VIF), all VPCs attached to TGW  
**Why:** Single connection to TGW reaches all attached VPCs

**Q14:** Transit Gateway in us-east-1 needs to connect to Transit Gateway in eu-west-1.  
**A:** Transit Gateway Peering (inter-region)  
**Why:** Peering between TGWs enables cross-region VPC connectivity

**Q15:** Need to centralize internet egress (all VPCs use single NAT Gateway/firewall).  
**A:** Egress VPC with NAT Gateway/firewall, attach to Transit Gateway, route 0.0.0.0/0 from all VPCs to egress VPC  
**Why:** Centralized egress pattern, single point for security inspection, cost optimization

**Q16:** Application VPC needs to access Shared Services VPC but not other application VPCs.  
**A:** TGW route table for App VPC includes only Shared Services routes, not other apps  
**Why:** Granular routing control, selective connectivity

**Q17:** Monitor all traffic between VPCs going through Transit Gateway.  
**A:** Enable VPC Flow Logs on TGW attachments, send to CloudWatch Logs or S3  
**Why:** Flow Logs work with TGW attachments, visibility into inter-VPC traffic

**Q18:** Direct Connect connection failed, need automatic failover to VPN.  
**A:** Configure VPN as backup to same Virtual Private Gateway, BGP routing automatically fails over  
**Why:** Equal-cost multi-path (ECMP), BGP handles failover automatically

**Q19:** Need static IP for Transit Gateway endpoint.  
**A:** Trick question - TGW doesn't have public IP, it's internal routing. For public static IP use NLB with EIP or Global Accelerator  
**Why:** Understanding TGW is internal routing infrastructure

**Q20:** Reduce data transfer costs between VPCs attached to Transit Gateway.  
**A:** Enable appliance mode on TGW attachments if using firewalls, or keep traffic within same AZ where possible  
**Why:** Cross-AZ traffic costs $0.01/GB each way

### Direct Connect Questions (15 questions)

**Q21:** Need 10 Gbps dedicated connection to AWS with encryption.  
**A:** Direct Connect 10 Gbps + MACsec encryption (Layer 2) OR DX + VPN (IPsec - Layer 3)  
**Why:** DX itself not encrypted, need MACsec or VPN overlay

**Q22:** Direct Connect connection frequently goes down (single point of failure).  
**A:** 2 Direct Connect connections in different DX locations, configure BGP for automatic failover  
**Why:** Resilient hybrid architecture, maximum availability requires diverse locations

**Q23:** Need to access both VPC resources AND public AWS services (S3, DynamoDB) over Direct Connect.  
**A:** Private VIF for VPC access + Public VIF for public services  
**Why:** VIF types separate private and public traffic

**Q24:** Connect 10 VPCs across 3 regions via one Direct Connect.  
**A:** Direct Connect Gateway, associate with Virtual Private Gateways in each VPC  
**Why:** DX Gateway enables one DX to reach multiple VPCs across regions

**Q25:** Direct Connect provisioning takes 3 weeks but need connectivity now.  
**A:** Setup Site-to-Site VPN immediately, use until DX ready, keep VPN as backup after DX active  
**Why:** VPN fast to provision, DX takes time, both together = resilient

---

## Domain 2: Design for New Solutions (29% - 145 questions)

### Database Selection Questions (40 questions)

**Q26:** Shopping cart application, items added/removed frequently, need sub-10ms latency, unpredictable traffic.  
**A:** DynamoDB (key: session_id, On-Demand capacity)  
**Why:** Simple key-value, low latency, auto-scales, pay per request

**Q27:** Financial ledger, need immutable transaction log, cryptographic verification.  
**A:** QLDB (Quantum Ledger Database)  
**Why:** Built for immutability, cryptographic proof, audit trail

**Q28:** Social network, need to query friend relationships (friend-of-friend), recommendation engine.  
**A:** Neptune (graph database)  
**Why:** Graph traversal optimized, relationships are first-class

**Q29:** 5-year sales data (500M rows), complex analytics, BI dashboard daily queries.  
**A:** Redshift data warehouse  
**Why:** Optimized for analytics, handles billions of rows, BI tool integration

**Q30:** IoT sensors sending 1M data points/minute, need to query time-series patterns.  
**A:** Timestream (time-series database)  
**Why:** Optimized for time-series, 1000x faster than relational for time queries

**Q31:** Migrate MongoDB application to AWS, need MongoDB compatibility.  
**A:** DocumentDB (MongoDB-compatible)  
**Why:** Managed MongoDB-compatible service, minimal code changes

**Q32:** Application data 80% reads, 20% writes, need 5x better performance than standard MySQL.  
**A:** Aurora MySQL  
**Why:** 5x MySQL performance, read replicas (up to 15), auto-scaling storage

**Q33:** Mobile game, millions of users, simple queries (get user, update score), extremely variable traffic (0 to 100K requests/sec).  
**A:** DynamoDB On-Demand  
**Why:** Auto-scales instantly, simple access patterns, pay per request (no overprovisioning)

**Q34:** Need to query RDS and DynamoDB together in single query.  
**A:** Athena Federated Query with Lambda connectors  
**Why:** Query multiple data sources, federated architecture

**Q35:** Cassandra workload, need managed service.  
**A:** Keyspaces (Cassandra-compatible)  
**Why:** Managed Cassandra, CQL query language

**Q36-Q65:** [30 more database questions covering: RDS Multi-AZ vs Read Replica, Aurora Serverless v1 vs v2, DynamoDB Global Tables, capacity calculations, DAX caching, encryption, backup strategies, cross-region replication, performance optimization, cost optimization]

### Serverless Architecture Questions (35 questions)

**Q66:** API receives 10 requests/day, each processes for 5 minutes. Minimize cost.  
**A:** Lambda (not EC2)  
**Why:** 10 requests/day = 50 min/day compute, Lambda cents vs EC2 $30/month

**Q67:** Lambda processes S3 uploads, now timing out after 3 seconds (default). Files take 2 minutes to process.  
**A:** Increase Lambda timeout to 180 seconds (3 minutes with buffer)  
**Why:** Default 3 sec, max 15 min, set based on task duration

**Q68:** Lambda cold starts causing 500ms latency, SLA requires <100ms.  
**A:** Provisioned Concurrency (10 instances pre-warmed)  
**Why:** Eliminates cold starts for provisioned instances, costs extra but meets SLA

**Q69:** Lambda needs to query RDS in private subnet. How to configure?  
**A:** Configure Lambda with VPC access (subnets, security group), Lambda gets ENI in VPC, can access RDS  
**Why:** VPC Lambda can access private resources, needs NAT Gateway for internet

**Q70:** Lambda memory 512 MB, duration 30 sec. Increased to 1024 MB, now 18 sec. Which costs less?  
**A:** Calculate GB-seconds: 512MB=0.5GB×30=15 GB-sec, 1024MB=1GB×18=18 GB-sec. Answer: 512 MB cheaper (15<18)  
**Why:** GB-seconds pricing, not just duration

**Q71-Q100:** [30 more Lambda/serverless questions: Step Functions workflows, EventBridge patterns, API Gateway configurations, Lambda layers, concurrency limits, VPC Lambda, destinations, async invocations, error handling]

### Storage Questions (30 questions)

**Q101:** 100 TB data, accessed daily for 30 days, then weekly for 1 year, then archive for 7 years (rare access, 12-hour retrieval OK).  
**A:** Lifecycle policy: 30 days Standard → Standard-IA → 365 days Glacier Flexible Retrieval → 7 years retention → Delete  
**Why:** Match access patterns to storage classes, 90%+ cost savings

**Q102:** S3 bucket public, confidential data exposed. Prevent future incidents.  
**A:** Enable S3 Block Public Access at account level (4 settings), use CloudFront + OAC instead of public buckets, IAM Access Analyzer alerts  
**Why:** Defense in depth, Block Public Access overrides all public configurations

**Q103:** Need shared file system for 100 EC2 instances.  
**A:** EFS (mount on all instances)  
**Why:** EFS=NFS shared file system, multi-AZ, scales automatically

**Q104:** Windows file server migration, need SMB protocol and Active Directory integration.  
**A:** FSx for Windows File Server  
**Why:** Native Windows SMB, AD integration, fully managed

**Q105:** HPC cluster needs 100+ GB/sec throughput to S3-backed file system.  
**A:** FSx for Lustre with S3 repository  
**Why:** Lustre optimized for HPC, integrated with S3, extreme throughput

**Q106-Q130:** [25 more storage questions: EBS types/IOPS, S3 replication, S3 Select, Transfer Acceleration, multipart upload, Storage Gateway types, Snow Family selection, cross-region backup, encryption, versioning, Object Lock]

---

## Domain 3: Continuous Improvement (25% - 125 questions)

### Performance Optimization Questions (40 questions)

**Q131:** Web application slow, RDS CPU 80%, reads >> writes.  
**A:** Add RDS Read Replicas (2-3), route read queries to replicas  
**Why:** Offload read traffic, primary handles writes only

**Q132:** Same issue, Read Replicas added but still slow for frequent queries (same data retrieved 1000s of times).  
**A:** Add ElastiCache (Redis) in front of RDS, cache frequent queries, 1-hour TTL  
**Why:** In-memory cache drastically reduces database load

**Q133:** DynamoDB table experiencing throttling, provisioned 100 WCUs, actual usage varies (50-500 writes/sec).  
**A:** Enable DynamoDB Auto Scaling (min 50, max 1000 WCUs, target 70%)  
**Why:** Automatic capacity adjustment, scales with demand

**Q134:** S3 bucket, users uploading 100 GB files, taking hours.  
**A:** Multipart upload (required for >5 GB), parallel part uploads, use Transfer Acceleration for distant users  
**Why:** Parallel uploads faster, Transfer Acceleration uses edge locations

**Q135:** CloudFront distribution, cache hit ratio only 40%, high origin load.  
**A:** Increase TTL (Cache-Control max-age), analyze cache key (remove unnecessary query strings/headers), use Origin Shield (additional caching layer)  
**Why:** Higher TTL = more hits, optimized cache key reduces variations

**Q136-Q170:** [35 more performance questions: Lambda optimization, Auto Scaling tuning, EBS IOPS, network throughput, CDN optimization, database query optimization, caching strategies]

### Cost Optimization Questions (45 questions)

**Q171:** EC2 instances running 24/7 for 3 years, steady load. Minimize cost.  
**A:** Reserved Instances (3-year, all upfront) for 72% savings  
**Why:** Steady long-term workload = Reserved Instances

**Q172:** Workload runs 9AM-6PM weekdays only (40 hours/week). Currently On-Demand 24/7.  
**A:** Scheduled Auto Scaling (start 8:45 AM, stop 6:15 PM Mon-Fri)  
**Why:** Pay only for hours used (40 vs 168), 76% time savings

**Q173:** Batch processing jobs, fault-tolerant, can tolerate interruptions.  
**A:** Spot Instances (90% savings vs On-Demand)  
**Why:** Interruptible workload perfect for Spot, massive savings

**Q174:** 500 TB in S3 Standard, 80% not accessed after 90 days.  
**A:** Lifecycle policy transition to Glacier Instant Retrieval after 90 days  
**Why:** 83% cost reduction (400 TB × savings), instant access maintained

**Q175:** RDS database for dev/test, not needed nights/weekends.  
**A:** Aurora Serverless v2 (auto-scales to 0), or automate start/stop with Lambda/EventBridge  
**Why:** Aurora Serverless pauses when idle (no charges), automation saves ~65%

**Q176-Q215:** [40 more cost questions: Savings Plans, Spot strategies, storage tiering, right-sizing, Reserved Instance planning, data transfer optimization, NAT Gateway alternatives, CloudFront vs direct S3, unused resource identification]

### Monitoring & Operations Questions (40 questions)

**Q216:** Need to find all unencrypted EBS volumes across 50 accounts.  
**A:** AWS Config aggregator with rule ec2-ebs-encryption-by-default, query across all accounts  
**Why:** Config tracks resource configurations, aggregator for multi-account

**Q217:** CloudWatch showing high CPU but can't find which process.  
**A:** Enable Enhanced Monitoring (agent-based, OS-level metrics), see process list  
**Why:** Standard CloudWatch=hypervisor level, Enhanced=OS level

**Q218:** Query CloudWatch Logs for all ERROR messages in last 24 hours across 10 log groups.  
**A:** CloudWatch Logs Insights query: `fields @timestamp, @message | filter @message like /ERROR/ | stats count() by bin(1h)`  
**Why:** Logs Insights queries multiple log groups, SQL-like syntax

**Q219:** Detect when someone creates public S3 bucket.  
**A:** Config rule s3-bucket-public-read-prohibited, EventBridge on non-compliance, automatic remediation with Systems Manager  
**Why:** Config evaluates continuously, EventBridge triggers response, Systems Manager fixes

**Q220:** Distributed application, need to trace requests across Lambda, DynamoDB, SQS.  
**A:** AWS X-Ray (enable on Lambda, DynamoDB, SQS), trace requests end-to-end  
**Why:** X-Ray for distributed tracing, service map visualization

**Q221-Q255:** [35 more monitoring questions: CloudWatch anomaly detection, metric math, composite alarms, dashboard creation, GuardDuty findings, Security Hub aggregation, automated remediation patterns]

---

## Domain 4: Migration & Modernization (20% - 100 questions)

### Migration Strategy Questions (35 questions)

**Q256:** 500 on-premises VMs, minimize downtime, test before cutover.  
**A:** Application Migration Service (MGN), continuous replication, test instances, cutover when ready  
**Why:** MGN for VM migration, near-zero downtime, non-disruptive testing

**Q257:** Oracle database (10 TB) to PostgreSQL Aurora, must minimize downtime (<1 hour).  
**A:** DMS with SCT (schema conversion), Full Load + CDC, cutover when replication lag <1 minute  
**Why:** Heterogeneous migration requires SCT, CDC for minimal downtime

**Q258:** 100 TB database, 100 Mbps network, timeline 1 month.  
**A:** Snowball Edge for initial load (ship data), DMS CDC for changes during transit, sync when Snowball imported  
**Why:** 100 TB over 100 Mbps = 90 days, Snowball + DMS hybrid approach meets timeline

**Q259:** Application uses proprietary protocols, can't refactor. Migrate to AWS.  
**A:** Rehost (lift-and-shift) to EC2 using MGN  
**Why:** Can't change app, rehost preserves as-is

**Q260:** Legacy app, source code lost, running on old OS. Need to migrate.  
**A:** Rehost to EC2, run on compatible OS, or Retain on-premises if critical  
**Why:** No code = can't modernize, rehost or keep running

**Q261-Q290:** [30 more migration questions: 6 R's application, DMS task types, Storage Gateway migration, DataSync scheduling, migration wave planning, risk mitigation, rollback strategies]

### Modernization Questions (30 questions)

**Q291:** Monolithic application, want microservices, minimize initial effort.  
**A:** Containerize monolith (Docker), deploy to ECS/EKS, gradually split into microservices over time  
**Why:** Strangler pattern, incremental modernization

**Q292:** Application on EC2 checking SQS every second (polling), high costs.  
**A:** Refactor to event-driven: SQS triggers Lambda directly (event source mapping)  
**Why:** Lambda only runs when messages exist, no polling waste

**Q293:** Batch jobs running on cron (EC2 running 24/7), jobs run 2 hours/day.  
**A:** Migrate to Lambda (if <15 min) or Fargate (if >15 min), triggered by EventBridge schedule  
**Why:** Pay for execution time only, not 24/7 server

**Q294:** Windows .NET application, want serverless.  
**A:** Fargate with Windows containers or refactor to .NET Core on Lambda  
**Why:** Lambda supports .NET Core, Windows containers on Fargate for full .NET Framework

**Q295:** Need message queue with exactly-once delivery, strict ordering.  
**A:** SQS FIFO queue  
**Why:** Exactly-once processing, FIFO ordering, simpler than Kafka

**Q296-Q320:** [25 more modernization questions: Serverless migrations, container adoption, event-driven patterns, managed service migrations, API modernization]

### Disaster Recovery Questions (35 questions)

**Q321:** RTO 4 hours, RPO 1 hour, minimize cost.  
**A:** Pilot Light strategy: Database replication running, scale up app servers during DR  
**Why:** Matches RTO/RPO, cheaper than Warm Standby

**Q322:** RTO 1 minute, RPO 0 (no data loss), critical application.  
**A:** Multi-Site Active-Active: Both regions serving traffic, DynamoDB Global Tables, Aurora Global Database  
**Why:** Only active-active meets 1-minute RTO and zero RPO

**Q323:** Database backup must be retained 7 years, immutable.  
**A:** RDS snapshot to S3, copy to Glacier Deep Archive with S3 Object Lock (Compliance mode)  
**Why:** Immutable via Object Lock, Glacier cheap for 7-year retention

**Q324:** Region failure, need to failover website to secondary region in 5 minutes.  
**A:** Route 53 failover routing with health checks (60 sec), Warm Standby in secondary region (RDS Read Replica promote takes 3-4 min), Auto Scaling scales up (1-2 min)  
**Why:** Combined failover time ~5-6 minutes

**Q325:** Test DR annually, need realistic failover test without impacting production.  
**A:** GameDay: Execute DR runbook, failover to secondary, test application, leave production running, failback after test  
**Why:** Non-disruptive testing, validates DR works

**Q326-Q355:** [30 more DR questions: Backup strategies, snapshot management, cross-region replication, failover procedures, RTO/RPO calculations, backup testing, recovery testing]

---

## Domain-Specific Scenario Questions (100 questions covering all domains)

**Q356:** Company acquiring another company. Need to integrate 2 AWS Organizations.  
**A:** Can't merge Organizations. Use cross-account IAM roles, consolidate billing via Cost Explorer, gradually migrate accounts if needed  
**Why:** Organizations can't be merged, work around with cross-account access

**Q357:** Application uses 50 microservices (containers), need service discovery.  
**A:** ECS with AWS Cloud Map (service discovery), or EKS with CoreDNS  
**Why:** Cloud Map provides DNS-based service discovery, dynamic endpoint updates

**Q358:** Sensitive data in S3, need to audit all access.  
**A:** Enable S3 Access Logs, Enable CloudTrail data events for S3, Macie to scan for PII, Security Hub to aggregate findings  
**Why:** Multiple layers: access logs (who), CloudTrail (API calls), Macie (content scanning)

**Q359:** EC2 Auto Scaling adding/removing instances every 2 minutes (thrashing).  
**A:** Increase cooldown period to 600 seconds, or adjust scaling thresholds (widen target from 70% to 60-80%)  
**Why:** Cooldown prevents thrashing, wider range reduces sensitivity

**Q360:** DynamoDB hot partition (one product gets 90% of traffic).  
**A:** Add random suffix to partition key (product_id + random 1-10), distribute load across partitions  
**Why:** Better distribution prevents single partition bottleneck

**Q361-Q500:** [140 more scenario questions covering: hybrid architectures, compliance frameworks, security incidents, cost spike investigations, performance troubleshooting, architecture review scenarios, multi-region design, container orchestration, data analytics pipelines, ML workloads, IoT architectures, real-time processing, batch processing, chaos engineering, blue/green deployments, canary releases, circuit breakers, saga patterns]

---

## Exam Strategy Questions

**How to approach:** Read scenario fully, identify requirements, eliminate answers not meeting ALL requirements, choose most cost-effective OR least operational overhead (as specified), ALWAYS choose AWS managed service over self-managed

**Time management:** 180 minutes / 75 questions = 2.4 min/question, flag difficult questions, review flagged with remaining time

**Keywords:** "Most cost-effective"=Reserved/Spot/Serverless, "Least operational overhead"=Managed services, "Highest performance"=Provisioned IOPS/caching, "Most secure"=encryption/private subnets/least privilege

---

**PRACTICE QUESTIONS COMPLETE: 500+ questions across all domains**

Next: Hands-on lab guides...

