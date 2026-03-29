# Additional 40 AWS Services for SAP-C02

## Storage Services

### EBS (Elastic Block Store)
**Problem:** Need persistent disk for EC2  
**When:** EC2 boot volumes, databases on EC2, persistent storage  
**Types:** gp3 (general, $0.08/GB/month, 16K IOPS), gp2 (legacy), io2 (high IOPS, $0.125/GB + $0.065/IOPS), st1 (throughput HDD, $0.045/GB), sc1 (cold HDD, $0.015/GB)  
**vs:** Instance store=ephemeral, EBS=persistent, EFS=shared file system  
**How:** Network-attached block storage, can snapshot, can encrypt, can resize, can change type  
**Exam:** gp3 for most, io2 for databases >16K IOPS, snapshots cross-region for DR, encryption with KMS

### EFS (Elastic File System)
**Problem:** Multiple EC2 need shared file system  
**When:** Shared storage, content management, home directories, container persistent storage  
**vs:** EBS=one EC2, EFS=many EC2, S3=object storage not file system  
**How:** NFS protocol, multi-AZ by default, scales automatically, regional service  
**Cost:** $0.30/GB/month (Standard), $0.16/GB/month (IA - infrequent access), lifecycle management  
**Exam:** EFS for shared files, mount targets in each AZ, performance modes (General Purpose, Max I/O), throughput modes (Bursting, Provisioned)

### FSx
**Problem:** Need Windows file shares or high-performance file systems  
**Types:** FSx for Windows (SMB, AD integration), FSx for Lustre (HPC, ML, 100+ GB/sec), FSx for NetApp ONTAP (enterprise), FSx for OpenZFS  
**When:** Windows workloads (FSx Windows), HPC/ML (FSx Lustre), enterprise migration (NetApp/OpenZFS)  
**Cost:** FSx Windows $0.013/GB/month + throughput, Lustre $0.14-0.19/GB/month  
**Exam:** FSx Windows for SMB/AD, FSx Lustre for S3-backed high-performance compute

### Storage Gateway
**Problem:** On-premises needs cloud backup or hybrid storage  
**Types:** File Gateway (NFS/SMB to S3), Volume Gateway (iSCSI to S3 - cached or stored), Tape Gateway (VTL to S3/Glacier)  
**How:** Virtual appliance on-prem, caches frequently accessed, async uploads to S3, low-latency local access  
**Exam:** File Gateway for NFS/SMB users, Volume Gateway for block storage backup, Tape Gateway for tape backup replacement

### DataSync
**Problem:** Transfer large datasets to/from AWS quickly  
**When:** On-prem to S3/EFS migration, AWS to AWS transfer, ongoing sync  
**vs:** Storage Gateway=hybrid access, DataSync=migration/sync, Snow Family=>10TB  
**How:** Agent on-premises, optimized transfer (10x faster than tools), incremental sync, encryption, validation  
**Cost:** $0.0125/GB transferred  
**Exam:** DataSync for large transfers, Schedule sync jobs, integrates with Storage Gateway

### Snow Family
**Problem:** Network too slow for large data transfer (weeks/months)  
**Devices:** Snowcone (8 TB), Snowball Edge (80 TB), Snowmobile (100 PB - truck!)  
**When:** >10 TB with slow connection, offline migration, edge computing  
**How:** Ship device, load data locally, ship back, AWS imports to S3  
**Cost:** Snowball ~$250 per job + shipping  
**Exam:** >10 TB + slow network = Snow Family, Snowball Edge has compute (run Lambda locally), time calculation (100 TB over 100 Mbps = 90+ days, Snowball = 1 week)

---

## Database Services (Additional)

### Aurora
**Problem:** Need better MySQL/PostgreSQL performance than RDS  
**When:** Critical workloads, need 5x MySQL perf, auto-scaling storage, global databases  
**vs RDS:** Aurora=5x faster/auto-scales 10GB-128TB/15 replicas, RDS=standard perf/64TB max/5 replicas  
**Cost:** 20% more than RDS but better performance/features  
**Features:** Aurora Serverless (auto-scale compute), Global Database (cross-region <1 sec replication), Backtrack (rewind database), Parallel Query  
**Exam:** Aurora for high-performance, Serverless for variable workloads, Global for multi-region, Backtrack for quick recovery from errors

### DocumentDB
**Problem:** MongoDB workloads, need managed service  
**When:** MongoDB-compatible needed, document store, JSON data  
**vs:** DynamoDB=AWS-native, DocumentDB=MongoDB-compatible  
**How:** MongoDB 3.6/4.0 compatible, Aurora-based architecture, 6 copies across 3 AZs  
**Exam:** Migrate from MongoDB → DocumentDB, compatible with MongoDB drivers

### Neptune
**Problem:** Graph data (relationships), network analysis  
**When:** Social graphs, recommendation engines, fraud detection, knowledge graphs  
**vs:** RDS=tables/joins, Neptune=nodes/edges optimized for graph traversal  
**Query languages:** Gremlin, SPARQL  
**Exam:** Graph data = Neptune, fraud detection (relationships), recommendation engines

### Timestream
**Problem:** Time-series data (IoT, DevOps metrics)  
**When:** IoT sensor data, application metrics, clickstreams  
**vs:** DynamoDB=general NoSQL, Timestream=optimized for time-series (1000x faster queries)  
**Cost:** $0.50/GB stored, $0.01 per million writes  
**Exam:** Time-series data at scale = Timestream

### QLDB (Quantum Ledger Database)
**Problem:** Immutable transaction log, cryptographically verifiable  
**When:** Financial transactions, supply chain, regulatory compliance (need proof of integrity)  
**vs:** Blockchain=decentralized/slow, QLDB=centralized/fast/managed  
**Exam:** Immutable audit log = QLDB, verify data hasn't been tampered

---

## Container Services

### EKS (Elastic Kubernetes Service)
**Problem:** Need Kubernetes, don't want to manage control plane  
**When:** Existing Kubernetes apps, multi-cloud portability, advanced orchestration  
**vs ECS:** EKS=Kubernetes/complex/portable, ECS=AWS-native/simpler  
**Components:** Managed control plane, worker nodes (EC2 or Fargate), add-ons (CNI, CoreDNS)  
**Cost:** $0.10/hour cluster ($73/month) + worker nodes  
**Exam:** EKS for Kubernetes workloads, Fargate for serverless nodes, IRSA (IAM roles for service accounts), EKS Anywhere (on-prem)

### ECR (Elastic Container Registry)
**Problem:** Store Docker images  
**When:** Using containers (ECS, EKS, Lambda containers)  
**vs:** Docker Hub=public/rate limits, ECR=private/integrated with AWS  
**Features:** Image scanning (vulnerabilities), lifecycle policies, replication (cross-region/account)  
**Cost:** $0.10/GB/month storage  
**Exam:** Private registry for containers, image scanning for security, cross-account access with policies

### Fargate
**Problem:** Don't want to manage EC2 for containers  
**When:** Serverless containers, variable workloads, don't want cluster management  
**vs EC2 launch type:** Fargate=serverless/higher cost per task, EC2=control/cheaper at scale  
**How:** AWS manages infrastructure, you define task (CPU, memory), pay per second  
**Cost:** $0.04048/vCPU/hour + $0.004445/GB/hour (1 vCPU, 2 GB = $40/month if running 24/7)  
**Exam:** Fargate for no server management, EC2 launch type for cost optimization/control, Fargate Spot (70% discount)

---

## Networking Services (Additional)

### Global Accelerator
**Problem:** Variable internet performance, need static IPs for global app  
**When:** Gaming (need static IP), IoT (whitelisting), VoIP, global users non-HTTP  
**vs CloudFront:** GA=TCP/UDP/static IP/no caching, CloudFront=HTTP/caching  
**How:** 2 static anycast IPs, routes to nearest AWS region via AWS backbone, health checks for failover  
**Cost:** $0.025/hour + $0.012/GB  
**Exam:** Static IP + global routing = Global Accelerator, HTTP with caching = CloudFront

### VPC Endpoints
**Problem:** Traffic to S3/DynamoDB goes through NAT Gateway (costs, internet exposure)  
**Types:** Gateway (S3, DynamoDB - free), Interface (all other services - $0.01/hour)  
**How:** Gateway=route table entry, Interface=ENI in subnet with private IP  
**Exam:** Reduce NAT costs → VPC Endpoints, private access to AWS services, Interface endpoint for Lambda in VPC to access other services

### PrivateLink
**Problem:** Expose service to other VPCs without VPC peering  
**How:** NLB in provider VPC → VPC Endpoint Service → Customer creates Interface VPC Endpoint  
**When:** SaaS providers, shared services, avoid peering complexity  
**Cost:** $0.01/hour per AZ + data transfer  
**Exam:** Private service exposure without peering = PrivateLink, works across accounts

### Network Firewall
**Problem:** Need stateful firewall for VPC (security groups/NACLs insufficient)  
**When:** IDS/IPS, deep packet inspection, advanced filtering  
**Features:** Stateful rules, domain filtering, intrusion prevention (Suricata rules)  
**Cost:** $0.395/hour = $288/month + data processed  
**Exam:** Advanced network security = Network Firewall, integrates with Firewall Manager

### WAF (Web Application Firewall)
**Problem:** SQL injection, XSS attacks, DDoS  
**Attach to:** ALB, API Gateway, CloudFront  
**Rules:** SQL injection, XSS, rate limiting, geo-blocking, IP sets, custom regex  
**Cost:** $5/month + $1/rule + $0.60 per million requests  
**Exam:** Protect web apps = WAF on ALB/CloudFront, managed rule groups (OWASP Top 10), rate-based rules for DDoS

### AWS Shield
**Problem:** DDoS attacks  
**Levels:** Standard (free, always on, Layer 3/4 protection), Advanced ($3,000/month, Layer 7, 24/7 response team, cost protection)  
**When:** Standard=everyone (automatic), Advanced=critical apps, large attacks expected  
**Exam:** Shield Standard free with CloudFront/Route 53, Shield Advanced for advanced protection + response team

---

## Analytics Services

### EMR (Elastic MapReduce)
**Problem:** Big data processing (Spark, Hadoop)  
**When:** Petabyte-scale data processing, machine learning on big data, log analysis  
**vs:** Athena=SQL on S3/serverless, EMR=Spark/Hadoop/managed clusters  
**Cluster:** Master, core (data nodes), task (compute only)  
**Cost:** EC2 instances + $0.05-0.27/hour per instance EMR fee  
**Exam:** Big data processing = EMR, use Spot for task nodes (cost savings), EMRFS for S3 integration

### Glue
**Problem:** ETL jobs manual, schema management difficult  
**Components:** Data Catalog (metadata), Crawler (discover schema), ETL jobs (Spark-based), DataBrew (visual ETL)  
**When:** Data lake ETL, schema discovery, prepare data for analytics  
**Cost:** Crawler $0.44/hour, ETL $0.44/hour per DPU (Data Processing Unit)  
**Exam:** ETL for data lake = Glue, crawler for schema discovery, Glue with Athena/Redshift Spectrum

### Lake Formation
**Problem:** Data lake permissions complex, no column-level security  
**When:** Govern data lake, fine-grained access (table/column level), centralized permissions  
**Features:** Built on Glue, IAM integration, tag-based access, cross-account  
**Exam:** Data lake governance = Lake Formation, column-level security, central permissions

### OpenSearch Service (Elasticsearch)
**Problem:** Full-text search, log analytics  
**When:** Search functionality, log analysis (ELK stack), real-time analytics  
**vs:** RDS=structured queries, OpenSearch=full-text/unstructured  
**Cost:** $0.113/hour for t3.small = $82/month  
**Exam:** Log analysis/full-text search = OpenSearch, visualize with Kibana (built-in)

### MSK (Managed Streaming for Kafka)
**Problem:** Need Kafka, don't want to manage  
**When:** Kafka-compatible needed, existing Kafka apps, need Kafka features vs Kinesis  
**vs Kinesis:** MSK=Kafka-compatible/more features/complex, Kinesis=AWS-native/simpler  
**Cost:** $0.21/hour per broker = $153/month (3 brokers minimum)  
**Exam:** Kafka migration = MSK, need Kafka ecosystem tools

---

## Application Services

### EventBridge (CloudWatch Events)
**Problem:** Event routing between services  
**When:** Event-driven architectures, SaaS integration, schedule events  
**Event sources:** AWS services, SaaS (Zendesk, Datadog), custom applications  
**Targets:** Lambda, Step Functions, SQS, SNS, Kinesis, 20+ services  
**Rules:** Event patterns (JSON matching), schedules (cron)  
**Cost:** Free (1M events/month), custom bus $1/million  
**Exam:** Event routing = EventBridge, replaces CloudWatch Events, event archive/replay, cross-account events

### AppSync
**Problem:** Build GraphQL APIs  
**When:** GraphQL needed, real-time subscriptions, offline sync (mobile)  
**vs API Gateway:** AppSync=GraphQL/real-time, API Gateway=REST/HTTP  
**Data sources:** DynamoDB, Lambda, RDS, HTTP, OpenSearch  
**Cost:** $4 per million requests  
**Exam:** GraphQL = AppSync, real-time subscriptions, resolvers for data fetching

### SES (Simple Email Service)
**Problem:** Send/receive email  
**When:** Transactional emails, marketing, email receiving  
**Cost:** $0.10 per 1,000 emails sent  
**Exam:** Email sending = SES, integrate with Lambda for receiving/processing, sandbox mode (testing)

---

## Developer Tools

### CodeCommit
**Problem:** Git repository  
**When:** Source control, private repos  
**vs:** GitHub=public/feature-rich, CodeCommit=AWS-integrated  
**Cost:** 5 users free, $1/month per additional user  
**Exam:** Source control in AWS = CodeCommit

### CodeBuild
**Problem:** Build and test code  
**When:** CI/CD pipeline, compile code, run tests, build Docker images  
**Cost:** $0.005/minute for small build (2 GB, 2 vCPU)  
**Exam:** Build step in pipeline = CodeBuild, buildspec.yml configuration

### CodeDeploy
**Problem:** Deploy applications automatically  
**Platforms:** EC2, on-premises, Lambda, ECS  
**Deployment types:** In-place, Blue/Green  
**Exam:** Automated deployment = CodeDeploy, blue/green for zero-downtime, deployment groups, lifecycle hooks

### CodePipeline
**Problem:** Orchestrate CI/CD  
**Stages:** Source (CodeCommit/GitHub) → Build (CodeBuild) → Test → Deploy (CodeDeploy)  
**Cost:** $1/pipeline/month  
**Exam:** Full CI/CD = CodePipeline orchestrating other Code services

---

## ML Services (Awareness Level)

### SageMaker
**Components:** Studio (IDE), Training (ML training jobs), Endpoints (real-time inference), Batch Transform, Ground Truth (labeling), Feature Store, Model Monitor  
**When:** Machine learning workloads  
**Exam:** ML training/deployment = SageMaker, Spot for training (cost savings), multi-model endpoints

### Rekognition
**Problem:** Image/video analysis  
**Features:** Object detection, face recognition, text in images, content moderation  
**Exam:** Image analysis = Rekognition

### Comprehend
**Problem:** Natural language processing  
**Features:** Sentiment analysis, entity extraction, language detection  
**Exam:** Text analysis = Comprehend

### Transcribe
**Problem:** Speech to text  
**Exam:** Audio to text = Transcribe

---

## Management Services

### Systems Manager
**Components:** Session Manager (SSH replacement), Patch Manager (automate patching), Parameter Store (config/secrets), Run Command (execute on instances), OpsCenter (operational issues)  
**When:** Fleet management, patching, configuration  
**Exam:** No SSH bastion = Session Manager, centralized patching = Patch Manager, free secrets = Parameter Store (vs Secrets Manager)

### AWS Backup
**Problem:** Centralized backup across services  
**Supports:** EBS, RDS, DynamoDB, EFS, FSx, Storage Gateway  
**Features:** Backup plans (schedules), backup vaults (organized storage), cross-region/account  
**Cost:** $0.05/GB/month + restore data transfer  
**Exam:** Centralized backup = AWS Backup, cross-account/region backup, compliance reporting

### Service Catalog
**Problem:** Users provision resources inconsistently  
**When:** Standardize deployments, self-service IT, governance  
**How:** CloudFormation templates as products, portfolios (collections), constraints (rules)  
**Exam:** Standardized provisioning = Service Catalog, approved templates only

### Trusted Advisor
**Problem:** Optimize costs, improve security/performance  
**Checks:** Cost optimization, security, fault tolerance, performance, service limits  
**Tiers:** Basic (7 checks - free), Business/Enterprise (all checks)  
**Exam:** Optimization recommendations = Trusted Advisor, unused resources, security risks

### Compute Optimizer
**Problem:** Right-size EC2, Lambda, EBS  
**How:** ML analyzes CloudWatch metrics, recommends optimal size  
**Recommendations:** EC2 instance type, Lambda memory, EBS volume type  
**Exam:** Right-sizing = Compute Optimizer, cost savings 25%+ typical

---

## Security Services (Additional)

### Inspector
**Problem:** Vulnerability scanning  
**Scans:** EC2 instances, container images, Lambda functions  
**Finds:** CVEs, network exposure, best practice deviations  
**Cost:** $0.09 per EC2 assessment, $0.09 per container image scan  
**Exam:** Vulnerability scanning = Inspector, continuous scanning, findings to Security Hub

### Macie
**Problem:** Find PII in S3 (GDPR, CCPA compliance)  
**Detects:** SSN, credit cards, names, addresses in S3 objects  
**Cost:** $0.001 per GB scanned for discovery  
**Exam:** PII detection = Macie, S3 data classification, compliance scanning

### Security Hub
**Problem:** Centralized security findings from multiple services  
**Aggregates:** GuardDuty, Inspector, Macie, Config, IAM Access Analyzer, Firewall Manager  
**Compliance:** CIS, PCI-DSS, AWS best practices checks  
**Exam:** Central security dashboard = Security Hub, multi-account aggregation, automated remediation with EventBridge

### IAM Identity Center (AWS SSO)
**Problem:** Multiple AWS accounts, users need access to many  
**When:** 10+ accounts, centralized auth, SAML federation  
**vs IAM:** IAM=per-account, Identity Center=organization-wide SSO  
**Exam:** Multi-account SSO = IAM Identity Center, SAML integration, permission sets

### Secrets Manager (Additional Details)
**Rotation:** Automatic for RDS/Redshift/DocumentDB (Lambda rotation function), custom Lambda for other secrets  
**vs Parameter Store:** Secrets Manager=$0.40+rotation, Parameter Store=free but manual rotation  
**Exam:** Auto-rotation = Secrets Manager, cross-account secrets, versioning

---

## Compute Services (Additional)

### Elastic Beanstalk
**Problem:** Deploy apps without infrastructure management  
**When:** Quick deployments, PaaS experience, don't want to configure  
**Platforms:** Node.js, Python, Java, .NET, PHP, Ruby, Go, Docker  
**How:** Upload code, Beanstalk creates EC2, ALB, Auto Scaling, RDS (optional), CloudWatch  
**vs:** EC2=full control, Lambda=serverless, Beanstalk=PaaS  
**Exam:** Quick app deployment = Beanstalk, Blue/Green deployment built-in, worker tier for background jobs

### Batch
**Problem:** Run batch computing jobs at scale  
**When:** Large batch jobs (rendering, analysis, simulations), Spot instances for cost  
**How:** Job queues, job definitions (Docker container), compute environments (EC2/Fargate), scheduling  
**Cost:** Only EC2/Fargate costs (Batch service free)  
**Exam:** Batch processing = AWS Batch, Array jobs (1000s of parallel tasks), Spot instances (90% savings)

### Lightsail
**Problem:** Simple VPS, don't need full AWS complexity  
**When:** Small websites, dev/test, learning AWS  
**Bundled:** Compute, storage, networking, DNS, static IP  
**Cost:** $3.50-160/month (predictable)  
**Exam:** Rarely tested, simple workloads, beginners

---

## Migration Services (Additional)

### Application Migration Service (MGN)
**Problem:** Migrate VMs/physical servers to AWS  
**vs SMS:** MGN=current (CloudEndure-based)/continuous, SMS=legacy/snapshot-based  
**How:** Agent on source, continuous replication to staging area, test/cutover when ready  
**Exam:** VM migration minimal downtime = MGN, non-disruptive testing, automated

### Application Discovery Service
**Problem:** Don't know what's running on-premises  
**Types:** Agentless (VMware vCenter), Agent-based (any OS)  
**Discovers:** Servers, dependencies, utilization, network connections  
**Output:** Migration Hub (visualize dependencies)  
**Exam:** Migration planning = Application Discovery Service, dependency mapping

---

## Additional Important Services

### Elastic Transcoder / MediaConvert
**Problem:** Transcode video/audio  
**MediaConvert:** Newer, more features, file-based transcoding  
**Exam:** Video transcoding = MediaConvert, adaptive bitrate streaming

### WorkSpaces
**Problem:** Virtual desktops  
**When:** Remote work, contractor access, BYOD  
**Cost:** $25-75/month per WorkSpace  
**Exam:** Virtual desktop = WorkSpaces, persistent or hourly

### AppStream 2.0
**Problem:** Stream applications (don't install locally)  
**vs WorkSpaces:** AppStream=application streaming, WorkSpaces=full desktop  
**Exam:** Application streaming = AppStream

### IoT Core
**Problem:** Connect IoT devices to cloud  
**Features:** Device management, message broker (MQTT), rules engine, device shadows  
**Exam:** IoT connectivity = IoT Core, Greengrass for edge computing

### Outposts
**Problem:** Need AWS on-premises (latency, data residency)  
**What:** Physical AWS infrastructure in your data center  
**Services:** EC2, EBS, S3, RDS, ECS, EKS  
**Exam:** AWS in own data center = Outposts, local processing with AWS tools

---

**COMPLETED: 40 additional services**

Next: Practice questions + hands-on labs...

