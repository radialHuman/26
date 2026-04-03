# AWS Certified Solutions Architect Professional (SAP-C02) - Study Index

## Domain 1: Design Solutions for Organizational Complexity (26%)

### Multi-Account AWS Environments
- AWS Organizations
- Organizational Units (OUs)
- Service Control Policies (SCPs)
- AWS Control Tower
- AWS Landing Zone
- Account Factory
- Guardrails (Preventive and Detective)
- AWS IAM Identity Center (AWS SSO)
- Cross-account access patterns
- Resource Access Manager (RAM)
- Consolidated billing
- Cost allocation tags
- Account vending machine

### Network Connectivity
- AWS Transit Gateway
- Transit Gateway Route Tables
- Transit Gateway Network Manager
- VPC Peering
- AWS PrivateLink
- VPC Endpoints (Interface and Gateway)
- AWS Direct Connect
- Direct Connect Gateway
- Virtual Private Gateway (VGW)
- Site-to-Site VPN
- Client VPN
- AWS Cloud WAN
- VPN CloudHub
- Transit VPC patterns
- Hybrid DNS (Route 53 Resolver)
- Route 53 Resolver Endpoints
- Shared VPC patterns
- Network segmentation strategies
- AWS Resource Access Manager for network sharing

### Identity and Access Management
- IAM Policies (Identity-based, Resource-based, Permission boundaries)
- IAM Roles and Role chaining
- IAM Policy conditions
- Service-linked roles
- Cross-account IAM roles
- Identity Federation (SAML, OIDC)
- AWS IAM Identity Center
- Amazon Cognito
- AWS Directory Service (AD Connector, Simple AD, Managed Microsoft AD)
- Active Directory integration patterns
- Attribute-based access control (ABAC)
- Permission boundaries
- Session policies
- SCP vs IAM policy evaluation

### Cost Optimization
- AWS Cost Explorer
- AWS Budgets
- Cost and Usage Reports (CUR)
- AWS Cost Anomaly Detection
- Savings Plans
- Reserved Instances (RIs)
- Spot Instances
- AWS Compute Optimizer
- AWS Trusted Advisor
- Rightsizing recommendations
- S3 Storage Class Analysis
- S3 Intelligent-Tiering
- Data transfer cost optimization
- Multi-Region cost considerations

## Domain 2: Design for New Solutions (29%)

### Compute Services
- Amazon EC2
- EC2 Instance types and families
- EC2 Placement Groups
- EC2 Auto Scaling
- Scheduled Scaling
- Target Tracking Scaling
- Step Scaling
- Predictive Scaling
- Elastic Load Balancing (ALB, NLB, GLB, CLB)
- AWS Lambda
- Lambda@Edge
- Lambda runtime versions
- Lambda layers
- Lambda concurrency and scaling
- Lambda destinations
- AWS Fargate
- Amazon ECS
- Amazon EKS
- AWS Batch
- AWS Elastic Beanstalk
- AWS App Runner
- AWS Outposts
- VMware Cloud on AWS
- AWS Wavelength
- AWS Local Zones

### Storage Solutions
- Amazon S3
- S3 Storage Classes
- S3 Lifecycle Policies
- S3 Replication (CRR, SRR)
- S3 Versioning
- S3 Object Lock
- S3 Glacier Vault Lock
- S3 Access Points
- S3 Multi-Region Access Points
- S3 Inventory
- S3 Select and Glacier Select
- Amazon EBS
- EBS Volume Types
- EBS Snapshots
- EBS Multi-Attach
- Amazon EFS
- EFS Performance Modes
- EFS Throughput Modes
- EFS Storage Classes
- Amazon FSx (Windows File Server, Lustre, NetApp ONTAP, OpenZFS)
- AWS Storage Gateway
- File Gateway
- Volume Gateway
- Tape Gateway
- AWS DataSync
- AWS Transfer Family
- AWS Snow Family (Snowcone, Snowball, Snowmobile)

### Database Solutions
- Amazon RDS
- RDS Multi-AZ
- RDS Read Replicas
- RDS Proxy
- RDS Custom
- Amazon Aurora
- Aurora Global Database
- Aurora Serverless
- Aurora Multi-Master
- Amazon DynamoDB
- DynamoDB Global Tables
- DynamoDB Streams
- DynamoDB Accelerator (DAX)
- DynamoDB Auto Scaling
- DynamoDB Point-in-Time Recovery
- Amazon ElastiCache (Redis, Memcached)
- Redis Cluster Mode
- Amazon Neptune
- Amazon DocumentDB
- Amazon Keyspaces (Cassandra)
- Amazon Timestream
- Amazon QLDB
- Amazon Redshift
- Redshift Spectrum
- Redshift Concurrency Scaling
- Database migration strategies
- AWS Database Migration Service (DMS)
- AWS Schema Conversion Tool (SCT)

### Network Design
- VPC Design principles
- Subnet design (Public, Private, Isolated)
- CIDR planning
- Route tables
- Internet Gateway
- NAT Gateway vs NAT Instance
- Network ACLs
- Security Groups
- VPC Flow Logs
- Traffic Mirroring
- AWS Global Accelerator
- Amazon CloudFront
- CloudFront Functions
- Origin Access Identity (OAI)
- Origin Access Control (OAC)
- Route 53 routing policies (Simple, Weighted, Latency, Failover, Geolocation, Geoproximity, Multi-value)
- Route 53 Health Checks
- Route 53 Traffic Flow
- Elastic IP addresses
- Prefix lists
- VPC Reachability Analyzer
- Network Load Balancer TLS termination
- Application Load Balancer features

### Application Integration
- Amazon SQS
- SQS FIFO queues
- SQS Dead Letter Queues
- Amazon SNS
- SNS FIFO topics
- SNS message filtering
- Amazon EventBridge
- EventBridge Event Bus
- EventBridge Scheduler
- AWS Step Functions
- Step Functions Express vs Standard workflows
- Amazon MQ
- Amazon AppFlow
- Amazon API Gateway
- API Gateway types (REST, HTTP, WebSocket)
- API Gateway caching
- API Gateway throttling
- AWS AppSync
- Amazon Kinesis Data Streams
- Amazon Kinesis Data Fifo
- Amazon Kinesis Data Analytics
- Amazon Kinesis Video Streams
- Amazon Managed Streaming for Apache Kafka (MSK)

## Domain 3: Continuous Improvement for Existing Solutions (25%)

### Operational Excellence
- AWS Systems Manager
- Systems Manager Session Manager
- Systems Manager Parameter Store
- Systems Manager Patch Manager
- Systems Manager Run Command
- Systems Manager State Manager
- Systems Manager Automation
- AWS OpsWorks
- AWS CloudFormation
- CloudFormation StackSets
- CloudFormation Drift Detection
- CloudFormation Change Sets
- AWS CDK
- AWS SAM
- Infrastructure as Code best practices
- AWS Service Catalog
- AWS Proton

### Monitoring and Logging
- Amazon CloudWatch
- CloudWatch Logs
- CloudWatch Metrics
- CloudWatch Alarms
- CloudWatch Dashboards
- CloudWatch Events (EventBridge)
- CloudWatch Insights
- CloudWatch Logs Insights
- CloudWatch Container Insights
- CloudWatch Lambda Insights
- CloudWatch Application Insights
- CloudWatch Synthetics
- AWS X-Ray
- X-Ray tracing
- X-Ray service map
- AWS CloudTrail
- CloudTrail Lake
- Multi-region CloudTrail
- Organization trail
- Amazon Managed Grafana
- Amazon Managed Prometheus
- AWS Config
- Config Rules
- Config Conformance Packs
- Config Aggregators

### Performance Optimization
- Caching strategies (CloudFront, ElastiCache, DAX, API Gateway)
- Database performance tuning
- RDS Performance Insights
- Enhanced monitoring
- Auto Scaling strategies
- Read replicas
- Connection pooling (RDS Proxy)
- Content delivery optimization
- Lambda performance optimization
- EBS optimization
- EC2 instance optimization
- Network performance optimization
- Enhanced networking (ENA, SR-IOV)
- Placement groups strategies

### Disaster Recovery
- RTO and RPO objectives
- Backup strategies
- AWS Backup
- Backup plans and vaults
- Cross-region backup
- Multi-Region deployment patterns
- Pilot Light
- Warm Standby
- Multi-Site Active-Active
- AWS Elastic Disaster Recovery (DRS)
- Database backup strategies
- S3 Cross-Region Replication
- Route 53 failover
- Aurora Global Database for DR

### Migration Strategies
- 6 Rs (Rehost, Replatform, Repurchase, Refactor, Retire, Retain)
- AWS Migration Hub
- AWS Application Discovery Service
- AWS Application Migration Service (MGN)
- AWS Server Migration Service (SMS)
- AWS Database Migration Service (DMS)
- AWS DataSync
- AWS Transfer Family
- AWS Snow Family for migration
- CloudEndure Migration
- Large-scale migration strategies

## Domain 4: Accelerate Workload Migration and Modernization (20%)

### Containerization
- Amazon ECS
- ECS Task Definitions
- ECS Services
- ECS Service Auto Scaling
- ECS Capacity Providers
- Amazon EKS
- EKS Node Groups
- EKS Fargate
- EKS Anywhere
- Amazon ECR
- ECR image scanning
- ECR replication
- AWS App2Container
- Docker best practices on AWS
- Kubernetes on AWS best practices

### Serverless Architectures
- AWS Lambda
- Lambda function optimization
- Lambda cost optimization
- Lambda event sources
- Lambda permissions and execution roles
- AWS SAM
- API Gateway integration patterns
- Step Functions workflow patterns
- DynamoDB as serverless database
- Aurora Serverless
- S3 as serverless storage
- EventBridge for event-driven architecture
- SNS/SQS for decoupling
- AWS Amplify
- Serverless Application Repository

### Modernization Patterns
- Microservices architecture
- Event-driven architecture
- Service mesh (AWS App Mesh)
- API-first design
- Strangler Fig pattern
- CQRS pattern
- Event sourcing
- Saga pattern
- Circuit breaker pattern
- Bulkhead pattern
- Legacy application modernization

### Analytics and Data Lakes
- Amazon S3 as data lake foundation
- AWS Lake Formation
- AWS Glue
- Glue Data Catalog
- Glue ETL jobs
- Glue DataBrew
- Amazon Athena
- Athena Federated Query
- Amazon EMR
- EMR Serverless
- Amazon Redshift
- Redshift Serverless
- Amazon QuickSight
- Amazon Kinesis Data Firehose
- Amazon OpenSearch Service
- AWS Data Exchange
- Data lake architecture patterns

### Machine Learning Integration
- Amazon SageMaker
- SageMaker Studio
- SageMaker Autopilot
- SageMaker Pipelines
- SageMaker Feature Store
- SageMaker Model Registry
- Amazon Rekognition
- Amazon Comprehend
- Amazon Transcribe
- Amazon Polly
- Amazon Translate
- Amazon Textract
- Amazon Forecast
- Amazon Personalize
- Amazon Fraud Detector
- Amazon Kendra
- AWS Panorama
- ML inference optimization

## Cross-Cutting Concerns

### Security
- Defense in depth
- AWS WAF
- WAF rules and rule groups
- AWS Shield (Standard and Advanced)
- AWS Firewall Manager
- Network Firewall
- Amazon GuardDuty
- Amazon Macie
- Amazon Detective
- Amazon Inspector
- AWS Security Hub
- AWS Secrets Manager
- AWS Certificate Manager (ACM)
- AWS KMS
- KMS key policies
- Customer managed keys vs AWS managed keys
- Envelope encryption
- S3 encryption (SSE-S3, SSE-KMS, SSE-C, Client-side)
- EBS encryption
- RDS encryption
- DynamoDB encryption
- VPC security best practices
- IAM best practices
- Data classification
- Compliance frameworks (PCI-DSS, HIPAA, SOC, ISO)
- AWS Artifact
- AWS Audit Manager

### High Availability and Resilience
- Multi-AZ deployments
- Multi-Region architectures
- Active-Active vs Active-Passive
- Load balancing strategies
- Auto Scaling strategies
- Health checks
- Circuit breakers
- Retry logic with exponential backoff
- Idempotency
- Chaos engineering principles
- AWS Fault Injection Simulator
- Resilience Hub

### Well-Architected Framework
- Operational Excellence pillar
- Security pillar
- Reliability pillar
- Performance Efficiency pillar
- Cost Optimization pillar
- Sustainability pillar
- Well-Architected Tool
- Well-Architected Lenses
- Design principles for each pillar
- Best practices for each pillar

### DevOps and CI/CD
- AWS CodeCommit
- AWS CodeBuild
- AWS CodeDeploy
- CodeDeploy deployment strategies (In-place, Blue/Green)
- AWS CodePipeline
- AWS CodeStar
- AWS CodeArtifact
- Amazon CodeGuru
- AWS Cloud9
- GitOps patterns
- Blue/Green deployments
- Canary deployments
- Rolling deployments
- Immutable infrastructure
- AWS CDK Pipelines

### Edge Computing
- AWS Wavelength
- AWS Local Zones
- AWS Outposts
- AWS Snow Family edge compute
- IoT Greengrass
- Lambda@Edge use cases
- CloudFront Functions use cases

### Hybrid and Multi-Cloud
- AWS Outposts
- AWS Storage Gateway
- AWS Direct Connect
- AWS VPN
- AWS Systems Manager for hybrid
- AWS Backup for hybrid
- VMware Cloud on AWS
- AWS App Runner
- Hybrid DNS strategies
- Hybrid identity strategies

### Governance and Compliance
- AWS Organizations policies
- Service Control Policies
- Tag policies
- AWS Config rules
- AWS Config conformance packs
- AWS CloudTrail for governance
- AWS IAM Access Analyzer
- AWS Control Tower
- AWS Audit Manager
- Compliance reporting
- Resource tagging strategies
- AWS License Manager

### Billing and Cost Management
- AWS Pricing Calculator
- AWS Cost Explorer
- Cost allocation tags
- AWS Budgets and alerts
- Savings Plans types
- Reserved Instances types
- RI sharing across accounts
- Spot Instance best practices
- AWS Cost and Usage Reports
- Cost optimization strategies per service
- Tagging for cost allocation
- Chargeback and showback models

### Service-Specific Deep Dives

#### Compute Deep Dive
- EC2 instance metadata and user data
- EC2 instance store vs EBS
- EC2 Hibernate
- EC2 Dedicated Hosts vs Dedicated Instances
- Lambda versions and aliases
- Lambda provisioned concurrency
- Lambda reserved concurrency
- ECS task placement strategies
- ECS capacity provider strategies
- EKS IRSA (IAM Roles for Service Accounts)
- EKS Pod Security

#### Networking Deep Dive
- VPC endpoint policies
- PrivateLink architecture patterns
- Transit Gateway inter-region peering
- Direct Connect LAG
- Direct Connect MACsec
- VPN acceleration
- Network performance metrics
- IPv6 on AWS
- Bring Your Own IP (BYOIP)
- AWS Network Manager

#### Storage Deep Dive
- S3 consistency model
- S3 request rate performance
- S3 Transfer Acceleration
- S3 Batch Operations
- S3 Event Notifications
- EBS RAID configurations
- EBS encryption at rest and in transit
- EFS mount targets
- EFS access points
- FSx deployment options
- Storage Gateway cache sizing

#### Database Deep Dive
- RDS parameter groups
- RDS option groups
- RDS maintenance windows
- Aurora endpoints (Cluster, Reader, Custom, Instance)
- Aurora backtrack
- Aurora cloning
- DynamoDB partition key design
- DynamoDB sort key design
- DynamoDB GSI and LSI
- DynamoDB Transactions
- DynamoDB capacity modes (Provisioned, On-Demand)
- ElastiCache for Redis cluster mode
- ElastiCache scaling strategies

#### Integration Deep Dive
- SQS visibility timeout
- SQS long polling vs short polling
- SQS message retention
- SNS message durability
- EventBridge schema registry
- Step Functions error handling
- Step Functions parallel states
- Step Functions map states
- API Gateway request/response transformations
- API Gateway authorizers (Lambda, Cognito, IAM)

## Exam Strategies and Tips
- Question patterns and keywords
- Elimination techniques
- Time management (190 minutes, 75 questions)
- Scenario-based questions approach
- Multi-step solution design
- Trade-off analysis (cost vs performance vs complexity)
- AWS service selection criteria
- Reading comprehension for complex scenarios
