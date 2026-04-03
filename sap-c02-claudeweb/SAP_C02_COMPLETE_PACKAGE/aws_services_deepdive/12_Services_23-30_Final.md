# Services 23-30: Analytics, Migration, Governance

# 23. Redshift - Complete Deep Dive

## 1. Problem Solved
**Before:** Relational databases can't handle petabyte analytics, slow complex queries on billions of rows  
**After:** Columnar storage optimized for analytics, queries on petabytes in seconds

## 2. History
**2013:** Redshift launches (based on ParAccel technology)  
**2019:** RA3 instances (separate compute/storage)  
**2021:** Redshift Serverless  
**Evolution:** Spectrum (query S3), data sharing, ML integration

## 3. When to Use
✅ Data warehouse (OLAP)  
✅ Business intelligence  
✅ Complex analytics (billions of rows)  
✅ Historical analysis  
✅ Aggregations, joins across large datasets  
❌ OLTP (transactions) - use RDS, simple queries (use RDS/DynamoDB), ad-hoc infrequent (use Athena - cheaper)

## 4. vs Similar
**Redshift vs RDS:** Redshift=analytics/petabytes/columnar, RDS=transactions/terabytes/row-based  
**Redshift vs Athena:** Redshift=frequent queries/faster/expensive, Athena=ad-hoc/pay-per-query/cheaper  
**Redshift vs DynamoDB:** Redshift=complex SQL/BI tools, DynamoDB=simple queries/high throughput

## 5. How It Works
Columnar storage (each column stored separately), massively parallel processing (MPP) - leader node distributes to compute nodes, compression (10:1 typical), zone maps (skip irrelevant blocks), result caching.

## 6. Cost
RA3 nodes: ra3.xlplus $1.086/hour = $793/month (4 vCPU, 32 GB, 32 TB managed storage)  
DC2 nodes (legacy): dc2.large $0.25/hour = $182/month (2 vCPU, 15 GB, 160 GB SSD)  
Serverless: $0.375 per RPU-hour (Redshift Processing Unit)  
Storage (RA3): First 32 TB included, then $0.024/GB/month  
Spectrum: $5 per TB scanned from S3

## 7. Pros and Cons
**Pros:** Petabyte scale, SQL interface (use existing BI tools), fast analytics, columnar compression, Spectrum (extend to S3), Serverless option, data sharing (query across clusters)  
**Cons:** Not for OLTP, expensive for small datasets (minimum 2 nodes = $364/month DC2), resize takes hours (now faster with elastic resize), PostgreSQL 8.x compatible (not latest)

## 8. SAP-C02 Questions
**Q:** 5-year sales analysis → Redshift  
**Q:** BI dashboard on petabytes → Redshift + QuickSight  
**Q:** Query S3 data lake from Redshift → Redshift Spectrum  
**Q:** Variable workload → Redshift Serverless  
**Q:** Reduce Redshift costs → Pause cluster when not in use, use Spectrum for cold data, RA3 for storage flexibility

## 9. Configurations
**Cluster:** Node type (DC2, RA3, Serverless), Number of nodes (2-128), VPC + subnet group (Multi-AZ for snapshots, single-AZ for cluster)  
**Distribution styles:** KEY (join optimization), ALL (broadcast small tables), EVEN (round-robin), AUTO (Redshift decides)  
**Sort keys:** Compound (multiple columns), Interleaved (equal importance)  
**Compression:** Automatic encoding suggestions  
**Snapshots:** Automated (retention 1-35 days), manual, cross-region copy

## 10. Additional
**Concurrency Scaling:** Auto-scales for bursts, charged per-second for additional clusters  
**Materialized views:** Pre-aggregated results, auto-refresh  
**Federated query:** Join Redshift with RDS/Aurora data  
**WLM (Workload Management):** Query prioritization, resource allocation  
**RA3 vs DC2:** RA3=separate storage (can scale independently), DC2=compute+storage coupled (legacy)

---

# 24. Athena

## 1. Problem Solved
**Before:** Query data in S3 = load into database first (time/money), maintain database for ad-hoc queries  
**After:** Query S3 directly with SQL, no infrastructure, pay per query

## 2. History
**2016:** Athena launches (based on Presto)  
**2020:** Federated queries  
**2023:** Apache Spark support

## 3. When to Use
✅ Ad-hoc queries on S3 (logs, data lake)  
✅ Infrequent analysis  
✅ Quick insights without database setup  
✅ Cost-conscious (pay per query not infrastructure)  
✅ Unstructured/semi-structured data (CSV, JSON, Parquet)  
❌ Frequent queries (Redshift faster/cheaper at scale), need sub-second latency, complex workloads 24/7 (Redshift better)

## 4. vs Similar
**Athena vs Redshift:** Athena=serverless/ad-hoc/$5 per TB scanned, Redshift=cluster/frequent/$182/month+  
**Athena vs S3 Select:** S3 Select=single file queries, Athena=full SQL across multiple files  
**Athena vs Glue:** Glue=ETL/transformation, Athena=querying

## 5. How It Works
SQL query → Athena service (managed Presto) → Reads data from S3 → Parses (CSV/JSON/Parquet) → Executes query → Returns results → Data never moves from S3. Glue Data Catalog provides schema.

## 6. Cost
$5 per TB scanned (compressed data counts as compressed size)  
**Example:** Query 100 GB = $0.50, query 10 TB = $50  
**Optimization:** Use Parquet (columnar, only scans needed columns), partition data (year=2026/month=03), compress (gzip 10:1 reduces cost 90%)

## 7. Pros and Cons
**Pros:** Serverless (no infrastructure), SQL interface, integrates with QuickSight, partition pruning (skip irrelevant data), federated (query RDS/DynamoDB), works with compressed formats  
**Cons:** Pay per query (costs unpredictable), slow for frequent queries, no indexes (full scans), eventual consistency (S3 listing), 30-min timeout

## 8. SAP-C02 Questions
**Q:** Analyze logs in S3 without database → Athena  
**Q:** Reduce Athena costs → Partition data, use Parquet, compress  
**Q:** Query multiple sources → Athena federated query  
**Q:** Scheduled reports → Athena queries triggered by Lambda/Step Functions

## 9. Configurations
**Data Catalog:** Glue crawler creates schema, or manual table definition  
**Partitioning:** year/month/day folders, MSCK REPAIR TABLE to add partitions  
**Workgroups:** Separate queries by team, cost allocation, query limits  
**Output:** S3 bucket for results (required)  
**Formats:** CSV, JSON, ORC, Parquet (recommended), Avro

## 10. Additional
**CTAS (Create Table As Select):** Create new table from query results, optimized format  
**Views:** Reusable queries, abstraction layer  
**Federated query:** Query RDS, DynamoDB, on-prem via Lambda connectors  
**Iceberg tables:** ACID transactions on S3, time travel, schema evolution

---

# 25. ElastiCache

## 1. Problem Solved
**Before:** Database overwhelmed by repeated queries for same data, high latency, expensive database scaling  
**After:** In-memory caching, sub-millisecond latency, reduced database load

## 2. History
**2011:** ElastiCache launches (Memcached)  
**2013:** Redis support  
**Evolution:** Redis cluster mode, encryption, backup/restore, Global Datastore (2019)

## 3. When to Use
✅ Cache database queries (reduce RDS load)  
✅ Session storage (web apps)  
✅ Real-time leaderboards (gaming)  
✅ Pub/sub messaging (Redis)  
✅ Rate limiting counters  
❌ Long-term storage (ephemeral - data lost on failure unless Redis with persistence), complex queries (use database)

## 4. vs Similar
**Redis vs Memcached:** Redis=advanced features/persistence/pub-sub, Memcached=simple/multi-threaded/faster for simple caching  
**ElastiCache vs DAX:** ElastiCache=general Redis/Memcached, DAX=DynamoDB-specific caching  
**ElastiCache vs RDS Read Replica:** Cache=sub-ms/eventual consistency, Read Replica=ms/consistent but heavier

## 5. How It Works
In-memory key-value store. App checks cache first (GET key) → Hit: return value (microseconds) → Miss: query database, store in cache (SET key value TTL), return value. Eviction: LRU (least recently used) when memory full.

## 6. Cost
cache.t3.micro: $0.017/hour = $12/month, cache.r6g.large: $0.201/hour = $147/month  
Redis cluster mode: Per node costs  
Backup storage: $0.085/GB/month (Redis only)

## 7. Pros and Cons
**Pros:** Sub-millisecond latency, reduces database load 80-90%, supports complex data structures (Redis: lists, sets, sorted sets), pub/sub (Redis), persistence (Redis), automatic failover (Redis)  
**Cons:** Data loss risk (in-memory), cache invalidation complexity, added architectural component, eventual consistency (stale data possible), costs (memory expensive)

## 8. SAP-C02 Questions
**Q:** Reduce RDS read load → ElastiCache  
**Q:** Session storage → ElastiCache Redis  
**Q:** Redis vs Memcached → Redis for advanced features, Memcached for simple  
**Q:** Multi-AZ → Redis cluster mode with replica in each AZ  
**Q:** Global → Redis Global Datastore (cross-region replication)

## 9. Configurations
**Redis:** Cluster mode ON (sharding, multiple primaries) or OFF (single primary, up to 5 replicas), Replication (Multi-AZ automatic failover), Persistence (AOF, RDB snapshots), Auth token (password), Encryption (at rest + in transit)  
**Memcached:** Nodes (1-40), Auto Discovery (clients find nodes automatically), Multi-threaded (uses all vCPUs)  
**Parameter groups:** maxmemory-policy (allkeys-lru, volatile-lru, etc.), timeout values

## 10. Additional
**Redis cluster mode:** Data sharded across multiple primaries (shards), each shard has replicas, scales write throughput  
**Failover:** Automatic (promote replica to primary, 60 sec), manual (for maintenance)  
**Backup/Restore:** Redis only, daily snapshots, point-in-time, restore to new cluster  
**Global Datastore:** Cross-region replication, sub-second replication lag, read locally, write anywhere  
**Redis Sorted Sets:** Leaderboards, time-series, ranking use cases

---

# 26. DMS - Complete Deep Dive

## 1. Problem Solved
**Before:** Database migration = dump/restore (hours of downtime), manual replication setup (complex)  
**After:** Continuous replication, minimal downtime, heterogeneous migration (Oracle→PostgreSQL)

## 2. History
**2016:** DMS launches  
**Evolution:** Ongoing replication, validation, transformation rules, Serverless (2023)

## 3. When to Use
✅ Migrate databases to AWS  
✅ Minimize downtime (<1 hour)  
✅ Heterogeneous (Oracle→PostgreSQL, SQL Server→Aurora)  
✅ Ongoing replication (hybrid)  
✅ Database consolidation  
❌ Same database type simple migration (use native tools faster), very small databases (<1 GB - manual faster)

## 4. vs Similar
**DMS vs Native tools:** DMS=heterogeneous/continuous, Native=faster for homogeneous/one-time  
**DMS vs Snowball:** DMS=network transfer, Snowball=physical device (>10 TB slow network)  
**DMS vs AWS SCT:** SCT=schema conversion tool (used WITH DMS), DMS=data migration

## 5. How It Works
Replication instance (EC2-based) reads source → Applies transformations → Writes to target. Full load (initial copy) + CDC (Change Data Capture - ongoing changes). CDC uses database logs (binary log MySQL, archive log Oracle).

## 6. Cost
Replication instance: dms.t3.medium $0.146/hour = $106/month during migration  
Data transfer: Same region free, cross-region $0.02/GB  
Storage (for replication logs): $0.115/GB/month  
**One-time cost:** Stop instance after migration complete

## 7. Pros and Cons
**Pros:** Minimal downtime, heterogeneous migrations, ongoing replication, automatic schema conversion help (SCT), validation (compare source/target)  
**Cons:** Replication instance costs (during migration), complex for large databases (>10 TB), transformation limitations, some data types not supported

## 8. SAP-C02 Questions
**Q:** Migrate 5 TB MySQL, <1 hour downtime → DMS with Full Load + CDC  
**Q:** Oracle to PostgreSQL → DMS + SCT (Schema Conversion Tool)  
**Q:** Ongoing replication hybrid → DMS continuous replication (don't stop)  
**Q:** Large database (50 TB), slow network → Snowball Edge + DMS CDC  
**Q:** Validate migration → DMS validation (compare row counts, data)

## 9. Configurations
**Source endpoint:** Database type, hostname, port, credentials, SSL  
**Target endpoint:** RDS, Aurora, Redshift, S3, DynamoDB, Kinesis  
**Replication instance:** Size (dms.t3.medium - dms.r5.24xlarge), VPC, Multi-AZ (HA), Storage  
**Task:** Full load, CDC, or Full load + CDC, Table mappings (which tables), Transformations (column filtering, renaming)  
**Task settings:** LOB mode (limited, full), validation (compare data), logging level

## 10. Additional
**SCT (Schema Conversion Tool):** Desktop app, converts schema (Oracle PL/SQL → PostgreSQL functions), assessment report (compatibility), some manual work needed  
**Ongoing replication:** Keep DMS task running, hybrid architecture (read from cloud, write to on-prem), eventual cutover  
**Validation:** Compare source vs target, row count, data sampling, latency metrics  
**CDC:** Captures INSERT/UPDATE/DELETE, applies to target, replication lag monitoring  
**Snowball with DMS:** Large databases - full load to Snowball, ship to AWS, import to S3, DMS loads from S3, CDC catches up

---

# 27. Organizations

## 1. Problem Solved
**Before:** Multiple AWS accounts = separate billing, no unified policies, hard to manage  
**After:** Consolidated billing, central policies, account hierarchy

## 2. History
**2017:** Organizations launches  
**2018:** Service Control Policies  
**Evolution:** Backup policies, tag policies, AI services opt-out

## 3. When to Use
✅ Multiple AWS accounts (always use if >1 account)  
✅ Consolidated billing  
✅ Enforce policies across accounts (SCPs)  
✅ Cost allocation  
✅ Resource sharing (RAM)  
❌ Single account (not needed)

## 4. vs Similar
**Organizations vs Control Tower:** Organizations=foundation, Control Tower=automated setup on Organizations  
**Organizations vs IAM:** Organizations=account-level controls (SCPs), IAM=user-level permissions  
**SCPs vs IAM policies:** SCPs=maximum boundary (can't exceed), IAM=grant permissions (within SCP limits)

## 5. How It Works
Organization root → OUs (organizational units) → AWS accounts. SCPs attached to root/OUs/accounts. Policies inherited down tree. Consolidated billing = one bill for all accounts. Member accounts can't leave without approval.

## 6. Cost
**FREE** - No charge for Organizations

## 7. Pros and Cons
**Pros:** Centralized management, consolidated billing (volume discounts), policy enforcement, free, simple account creation (automated), cross-account resource sharing  
**Cons:** Complex for small orgs, SCP conflicts hard to debug, can't have multiple organizations per account

## 8. SAP-C02 Questions
**Q:** Prevent production accounts from using Spot → SCP deny ec2:RequestSpotInstances  
**Q:** Centralized logging → Organization trail (CloudTrail)  
**Q:** Cost allocation by team → Tag policy + cost allocation tags  
**Q:** Automate account creation → Organizations API + Control Tower Account Factory  
**Q:** Restrict regions → SCP deny for unauthorized regions

## 9. Configurations
**OU structure:** Root → Production OU (Prod accounts) → Dev OU (Dev accounts) → Sandbox OU  
**SCPs:** Deny policies (blacklist) or allow policies (whitelist), explicit deny wins  
**Policies:** Service control (SCPs), tag policies, backup policies, AI opt-out  
**Trusted access:** Enable AWS services to access Organization (CloudTrail, Config, etc.)

## 10. Additional
**SCP inheritance:** Root policy affects all, OU policy affects OU + children, account policy affects account only  
**SCP evaluation:** Intersection of all applicable policies (must be allowed at ALL levels)  
**Member accounts:** Can't create Organizations, limited independence, root account controls  
**Consolidated billing:** Volume discounts apply across accounts (S3, data transfer), reserved instance sharing, savings plans sharing  
**CloudFormation StackSets:** Deploy to all accounts in Organization

---

# 28. Config

## 1. Problem Solved
**Before:** No configuration history, manual compliance checks, can't track changes  
**After:** Continuous configuration monitoring, compliance automation, change tracking

## 2. History
**2014:** Config launches  
**Evolution:** Conformance packs (2019), Aggregators (multi-account/region)

## 3. When to Use
✅ Compliance monitoring (is S3 encrypted?)  
✅ Configuration history (what changed?)  
✅ Resource inventory  
✅ Automated remediation  
✅ Security audits  
❌ Real-time enforcement (Config is eventual - delay), API logging (use CloudTrail)

## 4. vs Similar
**Config vs CloudTrail:** Config=configuration state over time, CloudTrail=API actions  
**Config vs GuardDuty:** Config=compliance/configuration, GuardDuty=threat detection  
**Config vs IAM/SCPs:** Config=assess compliance, IAM/SCPs=enforce permissions

## 5. How It Works
Config records resource configurations → Stores snapshots → Evaluates against rules → Non-compliant? Trigger remediation (Systems Manager, Lambda). Configuration items (CI) capture state. Rules evaluate (AWS managed or custom Lambda). Conformance packs = groups of rules.

## 6. Cost
Configuration items: $0.003 per item recorded, Rules: $0.001 per evaluation  
Conformance packs: $0.0012 per evaluation  
**Example:** 1000 resources, 50 rules, monthly checks = ~$150/month

## 7. Pros and Cons
**Pros:** Continuous monitoring, historical configuration, automated remediation, multi-account/region aggregation, compliance frameworks (PCI-DSS, HIPAA templates)  
**Cons:** Not real-time (eventual consistency), costs scale with resources, complex rule creation (Lambda), false positives need tuning

## 8. SAP-C02 Questions
**Q:** Ensure all S3 buckets encrypted → Config rule s3-bucket-server-side-encryption-enabled  
**Q:** Track configuration changes → Config configuration history  
**Q:** Automatic remediation → Config rule + Systems Manager automation  
**Q:** Multi-account compliance → Config aggregator  
**Q:** When was security group modified? → Config timeline

## 9. Configurations
**Rules:** AWS managed (170+ rules), custom (Lambda function), trigger (configuration change or periodic)  
**Remediation:** Automatic (SSM automation), manual (alert only)  
**Aggregator:** Central account collects from multiple accounts/regions  
**Delivery channel:** S3 bucket (snapshots), SNS topic (notifications)  
**Recording:** All resources or specific types, global resources (IAM, etc.)

## 10. Additional
**Conformance packs:** Pre-built compliance frameworks, OPA (Operational Best Practices), deploy across Organization  
**Advanced queries:** SQL-like queries on configuration database  
**Change detection:** Relationships (security group → EC2), configuration timeline  
**Retention:** 7 years configuration history

---

# 29. GuardDuty

## 1. Problem Solved
**Before:** Manual security monitoring, log analysis by humans, threats detected too late  
**After:** Automated threat detection, ML-based anomaly detection, real-time alerts

## 2. History
**2017:** GuardDuty launches  
**2020:** S3 protection  
**2023:** EKS protection, Lambda protection, RDS protection, Malware protection

## 3. When to Use
✅ Threat detection (compromised instances, unusual API calls)  
✅ Security monitoring  
✅ Anomaly detection  
✅ Compliance requirements  
✅ 24/7 monitoring without security team

## 4. vs Similar
**GuardDuty vs Config:** GuardDuty=threats/anomalies, Config=compliance/configuration  
**GuardDuty vs CloudTrail:** GuardDuty analyzes CloudTrail (plus VPC/DNS logs), CloudTrail stores logs  
**GuardDuty vs Security Hub:** Security Hub aggregates findings (including GuardDuty), GuardDuty generates findings

## 5. How It Works
Analyzes: CloudTrail management/data events, VPC Flow Logs, DNS logs, S3 logs, EKS audit logs. ML models detect: Unusual API calls, crypto mining, compromised instances, reconnaissance (port scanning), credential exfiltration, unauthorized access. Findings with severity (low/medium/high).

## 6. Cost
CloudTrail events: $4.50 per million events, VPC Flow Logs: $1.13 per GB analyzed, DNS Logs: $1.18 per million queries  
S3 protection: $0.50 per million objects monitored  
30-day free trial to estimate costs  
**Example:** Typical account ~$50-200/month depending on activity

## 7. Pros and Cons
**Pros:** Automated (no manual log analysis), ML-based (finds new threats), integrates multiple data sources, actionable findings, low false positives, easy setup (click enable)  
**Cons:** Not preventive (detects after fact), not blocking (use WAF/Security Groups for prevention), costs scale with activity, can't customize ML models

## 8. SAP-C02 Questions
**Q:** Detect compromised EC2 → GuardDuty  
**Q:** Unusual API calls from IAM user → GuardDuty finding  
**Q:** Cryptocurrency mining detection → GuardDuty (recognizes crypto mining behavior)  
**Q:** Centralized security → GuardDuty in all accounts + Security Hub aggregation  
**Q:** Automated response → GuardDuty → EventBridge → Lambda (isolate instance)

## 9. Configurations
Enable per region (not global), Auto-enable for new accounts (Organization feature), Trusted IPs/threat lists (whitelist/blacklist), Finding export (S3, CloudWatch Events), Suppression rules (ignore known false positives), S3/EKS/Lambda/RDS/Malware protection (optional add-ons)

## 10. Additional
**Multi-account:** Delegated administrator account, auto-enable for new accounts, centralized findings  
**Threat intelligence:** AWS threat intel + third-party feeds (Proofpoint, CrowdStrike)  
**Finding types:** 50+ finding types (Backdoor:EC2/C&CActivity, UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration, etc.)  
**Automated remediation:** EventBridge rule → Lambda → Isolate instance, revoke credentials, snapshot for forensics

---

# 30. CloudFormation

## 1. Problem Solved
**Before:** Manual resource creation (click consoles), not repeatable, no version control, error-prone  
**After:** Infrastructure as Code, repeatable deployments, version control, automated

## 2. History
**2011:** CloudFormation launches  
**Evolution:** Drift detection (2018), StackSets (2017 - multi-account), nested stacks

## 3. When to Use
✅ Repeatable infrastructure  
✅ Version control (Git)  
✅ Multi-environment (dev/test/prod from same template)  
✅ Disaster recovery (recreate infrastructure quickly)  
✅ Multi-account deployment (StackSets)  
❌ One-off resources (faster to click), extremely complex custom logic (use CDK/Terraform)

## 4. vs Similar
**CloudFormation vs Terraform:** CF=AWS-native/free, Terraform=multi-cloud/more features  
**CloudFormation vs CDK:** CDK=code (Python/TypeScript) generates CloudFormation  
**CloudFormation vs Manual:** CF=repeatable/auditable, Manual=quick/one-time

## 5. How It Works
YAML/JSON template describes resources → Submit to CloudFormation → Creates stack → Resources created in dependency order → Stack manages lifecycle (update, delete). Rollback on failure automatic.

## 6. Cost
**FREE** - Only pay for resources created (EC2, RDS, etc.)  
Handler operations (custom resources): $0.00009 per request

## 7. Pros and Cons
**Pros:** Free, version control, repeatable, multi-region deployment (StackSets), drift detection (find manual changes), rollback on failure, change sets (preview changes)  
**Cons:** YAML/JSON verbose, complex syntax, debugging difficult (stack failures), limited logic (use CDK for complex), eventual consistency issues

## 8. SAP-C02 Questions
**Q:** Deploy same infrastructure to 10 accounts → StackSets  
**Q:** Ensure infrastructure matches template → Drift detection  
**Q:** Preview changes before applying → Change sets  
**Q:** Nested stacks vs single → Nested for reusable components (network stack, app stack)  
**Q:** Rollback failed stack → Automatic (default) or retain for debugging

## 9. Configurations
**Template sections:** Parameters (inputs), Resources (required - EC2, VPC, etc.), Outputs (export values), Mappings (lookup tables), Conditions (if/else), Metadata  
**Intrinsic functions:** Ref (reference parameter/resource), Fn::GetAtt (get attribute), Fn::Join (concatenate), Fn::Sub (substitute variables), Fn::If (conditional)  
**DependsOn:** Control creation order (database before application)  
**DeletionPolicy:** Retain, Delete, Snapshot (for RDS/EBS)

## 10. Additional
**StackSets:** Deploy to multiple accounts/regions from one template, automatic account enrollment (Organizations integration)  
**Drift detection:** Compare actual vs template, find manual changes, per-resource drift status  
**Change sets:** Preview what will change (add/modify/delete), approve before execute  
**Nested stacks:** Modular templates, network stack + app stack + database stack, reusability  
**Custom resources:** Lambda-backed (create resources CF doesn't support), cleanup logic

---

# Final Services Quick Reference (NAT Gateway, Secrets Manager)

## NAT Gateway
**Problem:** Private subnet can't reach internet  
**Solution:** Network address translation, outbound only  
**Cost:** $0.045/hour + $0.045/GB = ~$33/month + data  
**vs NAT Instance:** NAT Gateway=managed/HA, NAT Instance=self-managed/cheaper for low traffic  
**Exam:** Multi-AZ (one NAT per AZ for HA), private subnet route 0.0.0.0/0 → NAT, public subnet required

## Secrets Manager
**Problem:** Passwords in code/env vars, no rotation, compromised credentials  
**Solution:** Encrypted storage, automatic rotation  
**Cost:** $0.40/secret/month + $0.05 per 10K API calls  
**vs Parameter Store:** Secrets Manager=auto-rotation/$0.40, Parameter Store=manual rotation/free  
**Exam:** RDS password rotation, Lambda retrieve secrets (not hardcode), cross-account secrets

## ECS (Elastic Container Service)
**Problem:** Run containers at scale, orchestration  
**Solution:** Managed container orchestration  
**Launch types:** EC2 (you manage instances), Fargate (serverless)  
**Components:** Clusters (group containers), Services (maintain desired count), Tasks (running containers), Task definitions (container config)  
**vs EKS:** ECS=AWS-native/simpler, EKS=Kubernetes/more complex  
**Cost:** Free (pay for EC2/Fargate only)  
**Exam:** Fargate for serverless, EC2 for control/savings, task placement strategies, service auto-scaling

---

**ALL 30 SERVICES COMPLETE!**

Files created:
1. EC2 ✅
2. VPC ✅
3. S3 ✅
4. RDS ✅
5. DynamoDB ✅
6. Lambda ✅
7. Auto Scaling ✅
8. ELB ✅
9. Route 53 ✅
10. CloudFront + IAM + CloudWatch + CloudTrail + KMS + Transit Gateway ✅
11. Direct Connect + API Gateway + SQS + SNS + Kinesis Streams + Kinesis Firehose + Step Functions ✅
12. Redshift + Athena + ElastiCache + DMS + Organizations + Config + GuardDuty + CloudFormation + NAT Gateway + Secrets Manager + ECS ✅

**Total documentation: ~60,000+ words covering all 30 top SAP-C02 services**

