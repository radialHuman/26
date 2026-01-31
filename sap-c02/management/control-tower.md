# AWS Control Tower

## Table of Contents
1. [Control Tower Fundamentals](#control-tower-fundamentals)
2. [Landing Zone Architecture](#landing-zone-architecture)
3. [Guardrails](#guardrails)
4. [Account Factory](#account-factory)
5. [Organizational Units](#organizational-units)
6. [Governance at Scale](#governance-at-scale)
7. [Integration with AWS Services](#integration-with-aws-services)
8. [Migration and Deployment](#migration-and-deployment)
9. [Best Practices](#best-practices)
10. [Interview Questions](#interview-questions)

---

## Control Tower Fundamentals

### What is AWS Control Tower?

**AWS Control Tower** orchestrates multiple AWS services to set up and govern a secure, compliant multi-account AWS environment based on AWS best practices.

**Key Components**:
```
Landing Zone (Foundation)
├── AWS Organizations (Account structure)
├── AWS SSO (Identity Center) (Single sign-on)
├── AWS Config (Compliance monitoring)
├── AWS CloudTrail (Audit logging)
└── AWS Service Catalog (Account Factory)

Guardrails (Governance rules)
├── Preventive (SCPs)
└── Detective (Config Rules)

Account Factory (Account vending)
├── Automated provisioning
├── Baseline configuration
└── Network setup
```

### Before vs After Control Tower

**Before Control Tower**:
```
Manual setup:
❌ Create AWS Organizations
❌ Design OU structure
❌ Configure SCPs
❌ Set up CloudTrail
❌ Configure AWS Config
❌ Create IAM roles
❌ Implement account baseline
❌ Set up networking
❌ Configure SSO
❌ Weeks of work, error-prone
```

**With Control Tower**:
```
Automated setup:
✅ Click "Set up landing zone"
✅ 30-60 minutes
✅ Pre-configured best practices
✅ Automated compliance
✅ Account vending
✅ Centralized governance
```

### Core Capabilities

**1. Landing Zone Setup**:
```
Root OU
├── Security OU
│   ├── Audit Account (CloudTrail, Config aggregator)
│   └── Log Archive Account (Centralized logging)
└── Custom OUs
    ├── Production OU
    ├── Development OU
    └── Staging OU
```

**2. Guardrails Enforcement**:
```
Preventive Guardrails (SCPs):
- Deny actions before they happen
- Example: Deny disabling CloudTrail

Detective Guardrails (Config Rules):
- Detect non-compliance after the fact
- Example: Detect unencrypted EBS volumes
```

**3. Account Factory**:
```
Self-Service Account Creation:
1. User requests new account via Service Catalog
2. Account Factory provisions account
3. Baselines applied automatically
4. Account ready in 30 minutes
```

### History & Evolution

```
2018: AWS Control Tower Launch
      - Basic landing zone setup
      - Mandatory guardrails

2019: Account Factory Enhancements
      - Service Catalog integration
      - Customizable account baselines

2020: Guardrail Library Expansion
      - 100+ guardrails available
      - Industry compliance mappings

2021: Landing Zone v3.0
      - Enhanced customization
      - Nested OU support

2022: Account Factory for Terraform (AFT)
      - Infrastructure as Code support
      - GitOps workflows

2023: Control Tower Controls
      - Proactive controls
      - Enhanced compliance reporting

2024: Enhanced Customization
      - Custom guardrails
      - Advanced baseline configurations
```

### Pricing

```
AWS Control Tower: FREE (no additional charge)

You pay for underlying services:
├── AWS Organizations: Free
├── AWS SSO: Free
├── AWS Config: $2/rule/region/month
│   Example: 50 rules × 2 regions × $2 = $200/month
├── AWS CloudTrail: $2/100K events
│   Example: 1M events = $20/month
├── S3 Storage: $0.023/GB (logs)
│   Example: 100GB logs = $2.30/month
└── AWS Service Catalog: Free

Typical Cost (100 accounts, 50 guardrails):
- AWS Config: ~$10,000/month
- CloudTrail: ~$500/month
- S3 Storage: ~$100/month
Total: ~$10,600/month
```

---

## Landing Zone Architecture

### Landing Zone Components

**1. Foundational OUs**:
```yaml
Root
├── Security OU (Mandatory)
│   ├── Audit Account
│   │   ├── CloudTrail logs aggregation
│   │   ├── Config aggregator
│   │   ├── SNS notifications
│   │   └── Read-only access to all accounts
│   └── Log Archive Account
│       ├── Centralized CloudTrail logs
│       ├── Centralized Config logs
│       ├── Centralized VPC Flow Logs
│       └── S3 bucket policies (write-only)
└── Custom OUs
    ├── Production
    ├── Development
    ├── Staging
    └── Sandbox
```

**2. Shared Accounts**:

**Audit Account**:
```python
# Purpose: Compliance monitoring and auditing
Resources:
- CloudTrail aggregation
- AWS Config aggregator
- SNS topics for compliance notifications
- IAM roles for read-only access to all accounts

IAM Policies:
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "cloudtrail:LookupEvents",
      "cloudtrail:GetTrailStatus",
      "config:Describe*",
      "config:Get*",
      "config:List*"
    ],
    "Resource": "*"
  }]
}
```

**Log Archive Account**:
```python
# Purpose: Centralized log storage

S3 Bucket Policy (write-only):
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AWSCloudTrailWrite",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::log-archive-bucket/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    },
    {
      "Sid": "DenyDelete",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:DeleteObject",
      "Resource": "arn:aws:s3:::log-archive-bucket/*"
    }
  ]
}

Lifecycle Policy:
- Standard: 90 days
- Glacier: 1 year
- Deep Archive: 7 years
- Delete: Never (compliance)
```

### Initial Setup Process

**Step 1: Prerequisites**:
```bash
# Requirements:
1. New AWS account or existing with minimal resources
2. Root user access
3. Email addresses for 2 shared accounts:
   - audit@company.com
   - log-archive@company.com
4. Home region selection (us-east-1, eu-west-1, etc.)
5. No existing AWS Organizations (will create new)
```

**Step 2: Launch Control Tower**:
```bash
# AWS Console → Control Tower → Set up landing zone

Configuration:
├── Home Region: us-east-1
├── Region deny settings: 
│   └── Deny access to: ap-northeast-1, ap-southeast-1 (unused regions)
├── Foundational OU names:
│   ├── Security
│   └── Sandbox
├── Shared account emails:
│   ├── Audit: audit@company.com
│   └── Log Archive: log-archive@company.com
└── KMS encryption: Enabled

Setup Time: 30-60 minutes
```

**Step 3: Post-Setup**:
```bash
# Automatically created:
✅ AWS Organizations with 3 accounts
✅ Security OU with Audit + Log Archive accounts
✅ Sandbox OU (optional)
✅ 21 mandatory guardrails enabled
✅ CloudTrail enabled in all accounts
✅ AWS Config enabled in all regions
✅ AWS SSO configured
✅ Service Catalog portfolio (Account Factory)
```

### Landing Zone Version Updates

**Check Version**:
```bash
aws controltower describe-landing-zone-configuration \
  --region us-east-1

# Output:
{
  "Version": "3.3",
  "LastUpdated": "2024-01-15T10:30:00Z",
  "Status": "ACTIVE"
}
```

**Update Landing Zone**:
```bash
# AWS Console → Control Tower → Landing Zone → Update

Update Process:
1. Review changes (new features, guardrails)
2. Click "Update landing zone"
3. Duration: 30-60 minutes
4. No downtime for existing accounts
5. New features applied to all accounts
```

---

## Guardrails

### Guardrail Types

**1. Preventive Guardrails** (SCPs):
```
Block actions BEFORE they happen
Implementation: Service Control Policies (SCPs)
Effect: Hard deny (cannot be overridden)

Example:
Name: Disallow Changes to CloudTrail
Effect: Prevents users from stopping/deleting CloudTrail
```

**2. Detective Guardrails** (Config Rules):
```
Detect violations AFTER they happen
Implementation: AWS Config Rules
Effect: Alert (does not prevent action)

Example:
Name: Detect Unencrypted EBS Volumes
Effect: Flags non-compliant resources
```

**3. Proactive Guardrails**:
```
Check resources BEFORE deployment
Implementation: CloudFormation Hooks
Effect: Prevents non-compliant resource creation

Example:
Name: Require S3 Bucket Encryption
Effect: Blocks CloudFormation if S3 bucket lacks encryption
```

### Guardrail Guidance Levels

**Mandatory**:
```
Cannot be disabled
Enforced in all accounts
21 mandatory guardrails

Examples:
- Disallow Changes to CloudTrail
- Disallow Configuration Changes to CloudWatch
- Disallow Deletion of Log Archive
- Detect Public Read Access to S3 Buckets
```

**Strongly Recommended**:
```
Should be enabled (best practice)
Can be disabled if needed
86 strongly recommended guardrails

Examples:
- Detect Whether MFA is Enabled for Root User
- Detect Whether Public Access to RDS Instances is Enabled
- Detect Whether Encryption is Enabled for EBS Volumes
```

**Elective**:
```
Optional based on requirements
Compliance-specific guardrails
110+ elective guardrails

Examples:
- Detect Whether S3 Bucket Versioning is Enabled
- Detect Whether Amazon EBS Volumes are Attached to EC2 Instances
- Detect Whether AWS Lambda Functions are Public
```

### Common Guardrails

**Preventive Examples**:

**1. Disallow Changes to CloudTrail**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Action": [
      "cloudtrail:DeleteTrail",
      "cloudtrail:StopLogging",
      "cloudtrail:UpdateTrail"
    ],
    "Resource": "*"
  }]
}

Status: Mandatory
Applies to: All accounts
Exceptions: None allowed
```

**2. Disallow Creation of IAM Users**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Action": [
      "iam:CreateUser",
      "iam:CreateAccessKey"
    ],
    "Resource": "*"
  }]
}

Status: Strongly Recommended
Purpose: Force use of AWS SSO
Applies to: All accounts except management
```

**3. Deny Access to Unapproved Regions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "NotAction": [
      "iam:*",
      "organizations:*",
      "route53:*",
      "budgets:*",
      "waf:*",
      "cloudfront:*",
      "globalaccelerator:*",
      "importexport:*",
      "support:*"
    ],
    "Resource": "*",
    "Condition": {
      "StringNotEquals": {
        "aws:RequestedRegion": [
          "us-east-1",
          "us-west-2",
          "eu-west-1"
        ]
      }
    }
  }]
}

Status: Strongly Recommended
Purpose: Cost control, data residency
```

**Detective Examples**:

**1. Detect Unencrypted EBS Volumes**:
```yaml
Config Rule: encrypted-volumes
Resource Type: AWS::EC2::Volume
Trigger: Configuration changes

Parameters:
  kmsId: <optional-kms-key-id>

Compliance:
  Compliant: Volume has encryption enabled
  Non-Compliant: Volume is unencrypted
  
Remediation: Manual or automated via SSM
```

**2. Detect Public S3 Buckets**:
```yaml
Config Rule: s3-bucket-public-read-prohibited
Resource Type: AWS::S3::Bucket
Trigger: Configuration changes, periodic

Compliance:
  Compliant: Bucket blocks public access
  Non-Compliant: Bucket allows public read

Notification: SNS → Security team
```

**3. Detect MFA Not Enabled for Root User**:
```yaml
Config Rule: root-account-mfa-enabled
Resource Type: AWS::::Account
Trigger: Periodic (24 hours)

Compliance:
  Compliant: Root user has MFA enabled
  Non-Compliant: Root user lacks MFA

Severity: Critical
Action: Alert CISO immediately
```

### Enable/Disable Guardrails

**Enable Guardrail**:
```bash
aws controltower enable-control \
  --control-identifier arn:aws:controltower:us-east-1::control/AWS-GR_ENCRYPTED_VOLUMES \
  --target-identifier arn:aws:organizations::123456789012:ou/o-abc123/ou-xyz-123

# Apply to entire organization:
--target-identifier arn:aws:organizations::123456789012:root/o-abc123/r-xyz
```

**Disable Guardrail** (if not mandatory):
```bash
aws controltower disable-control \
  --control-identifier arn:aws:controltower:us-east-1::control/AWS-GR_S3_VERSIONING_ENABLED \
  --target-identifier arn:aws:organizations::123456789012:ou/o-abc123/ou-dev-123
```

**List Enabled Guardrails**:
```bash
aws controltower list-enabled-controls \
  --target-identifier arn:aws:organizations::123456789012:ou/o-abc123/ou-prod-123

# Output:
{
  "enabledControls": [
    {
      "controlIdentifier": "AWS-GR_ENCRYPTED_VOLUMES",
      "statusSummary": {
        "Status": "SUCCEEDED",
        "LastOperationIdentifier": "12345-abcd"
      }
    }
  ]
}
```

### Guardrail Compliance Dashboard

**Check Compliance**:
```bash
# AWS Console → Control Tower → Guardrails

View:
├── Compliance status per guardrail
├── Non-compliant resources
├── Account-level compliance
├── OU-level compliance
└── Historical trends

Filters:
- By guardrail
- By account
- By OU
- By compliance status
```

**Compliance Report**:
```json
{
  "OrganizationCompliance": {
    "TotalGuardrails": 150,
    "Compliant": 142,
    "NonCompliant": 8,
    "CompliancePercentage": 94.7
  },
  "NonCompliantAccounts": [
    {
      "AccountId": "111122223333",
      "AccountName": "dev-account-1",
      "NonCompliantGuardrails": 3,
      "Violations": [
        {
          "Guardrail": "Detect Unencrypted EBS Volumes",
          "ResourceCount": 5,
          "Severity": "High"
        }
      ]
    }
  ]
}
```

---

## Account Factory

### Account Factory Overview

**Purpose**: Automated, standardized account provisioning

**Features**:
```
✅ Self-service account creation
✅ Baseline configuration applied automatically
✅ Network setup (VPC, subnets)
✅ Guardrails applied
✅ SSO access configured
✅ CloudTrail enabled
✅ AWS Config enabled
✅ Account ready in 30 minutes
```

### Account Vending Process

**Step 1: Request Account** (via Service Catalog):
```bash
# User accesses Service Catalog console
Product: AWS Control Tower Account Factory

Parameters:
├── Account name: production-app-1
├── Account email: prod-app1@company.com
├── Organizational Unit: Production OU
├── SSO user: john.doe@company.com
├── SSO group: ProductionAdmins
├── VPC Configuration:
│   ├── CIDR: 10.1.0.0/16
│   ├── Internet access: Yes
│   └── Subnets: 3 public, 3 private across 3 AZs
└── Custom tags:
    ├── Environment: Production
    ├── CostCenter: Engineering
    └── Owner: john.doe@company.com
```

**Step 2: Provisioning** (automated):
```bash
# Account Factory executes:
1. Create new AWS account
2. Move to specified OU
3. Apply SCPs from OU
4. Enable guardrails
5. Create VPC with subnets
6. Configure NAT gateways
7. Enable CloudTrail
8. Enable AWS Config
9. Create SSO permission sets
10. Grant SSO access to user/group

Duration: 20-40 minutes
```

**Step 3: Baseline Applied**:
```yaml
Account Baseline:
  CloudTrail:
    enabled: true
    multiRegion: true
    logDestination: s3://log-archive-bucket/
  
  Config:
    enabled: true
    regions: [us-east-1, us-west-2, eu-west-1]
    configurationRecorder: all supported resources
    deliveryChannel: s3://config-bucket/
  
  VPC:
    cidr: 10.1.0.0/16
    subnets:
      public: [10.1.0.0/24, 10.1.1.0/24, 10.1.2.0/24]
      private: [10.1.10.0/24, 10.1.11.0/24, 10.1.12.0/24]
    natGateways: 3 (one per AZ)
    internetGateway: enabled
  
  IAM:
    passwordPolicy:
      minimumLength: 14
      requireSymbols: true
      requireNumbers: true
      requireUppercase: true
      requireLowercase: true
      maxPasswordAge: 90
    mfaRequired: true
  
  Guardrails:
    mandatory: 21 enabled
    stronglyRecommended: 86 enabled
    elective: custom selection
```

**Step 4: Access Granted**:
```bash
# SSO user can now access account
URL: https://company.awsapps.com/start

User logs in with corporate credentials
├── Sees "production-app-1" in account list
├── Permission set: ProductionAdminAccess
└── Can assume role in new account
```

### Account Factory Customization

**Custom Baselines** (Account Factory for Terraform - AFT):

**1. Directory Structure**:
```
account-customizations/
├── account-01234567890/  # Specific account
│   ├── vpc.tf
│   ├── security-groups.tf
│   └── iam-roles.tf
├── production-ou/  # All accounts in OU
│   ├── logging.tf
│   └── monitoring.tf
└── global/  # All accounts
    ├── tags.tf
    └── cloudwatch-alarms.tf
```

**2. Example Customization** (VPC configuration):
```hcl
# vpc.tf
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = var.account_name
  cidr = var.vpc_cidr
  
  azs             = ["${var.region}a", "${var.region}b", "${var.region}c"]
  private_subnets = [cidrsubnet(var.vpc_cidr, 4, 0), cidrsubnet(var.vpc_cidr, 4, 1), cidrsubnet(var.vpc_cidr, 4, 2)]
  public_subnets  = [cidrsubnet(var.vpc_cidr, 4, 3), cidrsubnet(var.vpc_cidr, 4, 4), cidrsubnet(var.vpc_cidr, 4, 5)]
  
  enable_nat_gateway = true
  single_nat_gateway = false  # 3 NAT gateways for HA
  
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(
    var.common_tags,
    {
      ManagedBy = "Control Tower AFT"
    }
  )
}

# Output VPC ID for other modules
output "vpc_id" {
  value = module.vpc.vpc_id
}
```

**3. Git Workflow**:
```bash
# Repository structure
aft-account-customizations/
├── .git/
├── terraform/
│   ├── account-01234567890/
│   └── production-ou/
└── scripts/
    └── post-deployment.sh

# Workflow
1. Developer commits changes to Git
2. AFT pipeline triggered
3. Terraform plan generated
4. Manual approval (optional)
5. Terraform apply executed
6. Changes propagated to account(s)
```

### Bulk Account Provisioning

**CSV Import**:
```csv
AccountName,Email,OU,SSO_User,VPC_CIDR,Environment,CostCenter
prod-app-1,prod1@company.com,Production,john@company.com,10.1.0.0/16,Production,Eng
prod-app-2,prod2@company.com,Production,jane@company.com,10.2.0.0/16,Production,Eng
dev-app-1,dev1@company.com,Development,bob@company.com,10.10.0.0/16,Development,Eng
```

**Python Script** (bulk provisioning):
```python
import boto3
import csv

sc = boto3.client('servicecatalog')

# Get Account Factory product
products = sc.search_products(
    Filters={'FullTextSearch': ['AWS Control Tower Account Factory']}
)
product_id = products['ProductViewSummaries'][0]['ProductId']

# Get provisioning artifact (latest version)
artifacts = sc.list-provisioning-artifacts(ProductId=product_id)
artifact_id = artifacts['ProvisioningArtifactDetails'][0]['Id']

# Read CSV
with open('accounts.csv', 'r') as f:
    reader = csv.DictReader(f)
    
    for row in reader:
        # Provision account
        response = sc.provision_product(
            ProductId=product_id,
            ProvisioningArtifactId=artifact_id,
            ProvisionedProductName=row['AccountName'],
            ProvisioningParameters=[
                {'Key': 'AccountEmail', 'Value': row['Email']},
                {'Key': 'AccountName', 'Value': row['AccountName']},
                {'Key': 'ManagedOrganizationalUnit', 'Value': row['OU']},
                {'Key': 'SSOUserEmail', 'Value': row['SSO_User']},
                {'Key': 'VPCOptions', 'Value': 'Yes'},
                {'Key': 'VPCRegion', 'Value': 'us-east-1'},
                {'Key': 'VPCCIDR', 'Value': row['VPC_CIDR']}
            ],
            Tags=[
                {'Key': 'Environment', 'Value': row['Environment']},
                {'Key': 'CostCenter', 'Value': row['CostCenter']}
            ]
        )
        
        print(f"Provisioning {row['AccountName']}: {response['RecordId']}")
        
# Check provisioning status
def check_status(record_id):
    status = sc.describe_record(Id=record_id)
    return status['RecordDetail']['Status']

# Poll until complete
import time
for account in provisioned_accounts:
    while True:
        status = check_status(account['RecordId'])
        if status in ['SUCCEEDED', 'FAILED']:
            print(f"{account['Name']}: {status}")
            break
        time.sleep(30)
```

### Account Decommissioning

**Process**:
```bash
# 1. Remove resources from account (manual or automated)
# 2. Unregister from Control Tower

aws controltower unregister-account \
  --account-id 123456789012

# 3. Close account via AWS Organizations
aws organizations close-account \
  --account-id 123456789012

# Note: Account enters 90-day suspension period
# During suspension: All resources deleted, account recoverable
# After 90 days: Account permanently closed
```

---

## Organizational Units

### OU Strategy

**Recommended Structure**:
```
Root
├── Security OU (foundational)
│   ├── Audit
│   └── Log Archive
├── Infrastructure OU
│   ├── Network Hub Account (Transit Gateway)
│   ├── Shared Services Account (DNS, AD)
│   └── Monitoring Account (Centralized CloudWatch)
├── Workloads OU
│   ├── Production OU
│   │   ├── prod-app-1
│   │   ├── prod-app-2
│   │   └── prod-database
│   ├── Staging OU
│   │   ├── staging-app-1
│   │   └── staging-app-2
│   ├── Development OU
│   │   ├── dev-team-a
│   │   └── dev-team-b
│   └── Sandbox OU (unrestricted experimentation)
└── Suspended OU (decommissioned accounts)
```

**OU Design Principles**:
```
1. Environment Isolation: Separate prod/staging/dev
2. Blast Radius: Limit impact of security incidents
3. Compliance: Different guardrails per environment
4. Cost Allocation: Easier chargeback per OU
5. Access Control: Different SSO groups per OU
```

### Create Custom OU

**Via Console**:
```bash
Control Tower → Organizational Units → Create OU

Parameters:
├── OU Name: Production
├── Parent: Workloads OU
└── Guardrails: Inherit from parent + custom

Guardrails to enable:
✅ Detect Whether MFA is Enabled for Root User
✅ Disallow Public Read Access to S3 Buckets
✅ Detect Whether Encryption is Enabled for EBS Volumes
✅ Detect Whether Public Access to RDS is Enabled
```

**Via CLI**:
```bash
# Create OU in AWS Organizations
aws organizations create-organizational-unit \
  --parent-id ou-xyz-parent123 \
  --name Production

# Register with Control Tower
aws controltower register-organizational-unit \
  --organizational-unit-id ou-xyz-prod123
```

### Move Accounts Between OUs

**Considerations**:
```
⚠️  Guardrails change when moving accounts
⚠️  SCPs are inherited from new OU
⚠️  May cause temporary access disruptions
⚠️  Config rules re-evaluated
```

**Process**:
```bash
# 1. Verify destination OU guardrails
aws controltower list-enabled-controls \
  --target-identifier arn:aws:organizations::123:ou/o-abc/ou-target

# 2. Move account
aws organizations move-account \
  --account-id 111122223333 \
  --source-parent-id ou-xyz-dev \
  --destination-parent-id ou-xyz-prod

# 3. Wait for Control Tower to update (5-10 minutes)
# 4. Verify guardrails applied
```

---

## Governance at Scale

### Multi-Region Governance

**Region Deny Settings**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "NotAction": [
      "iam:*",
      "organizations:*",
      "route53:*",
      "budgets:*",
      "waf:*",
      "cloudfront:*",
      "globalaccelerator:*",
      "importexport:*",
      "support:*",
      "sts:*",
      "cloudtrail:LookupEvents"
    ],
    "Resource": "*",
    "Condition": {
      "StringNotEquals": {
        "aws:RequestedRegion": [
          "us-east-1",
          "us-west-2",
          "eu-west-1"
        ]
      }
    }
  }]
}

Benefits:
- Cost control (prevent accidental resource creation)
- Data residency compliance (GDPR, data sovereignty)
- Simplified governance (fewer regions to monitor)
- Security (reduce attack surface)
```

### Drift Detection

**What is Drift?**:
```
Manual changes to Control Tower-managed resources

Examples:
- Disabling CloudTrail in an account
- Modifying Log Archive S3 bucket policy
- Changing AWS Config settings
- Removing IAM roles created by Control Tower
```

**Detect Drift**:
```bash
# Automatic detection (daily)
Control Tower runs daily drift checks

# Manual detection
aws controltower detect-drift \
  --landing-zone-identifier arn:aws:controltower:us-east-1:123:landingzone/abc123

# Check drift status
aws controltower get-landing-zone-drift-status \
  --landing-zone-identifier arn:aws:controltower:us-east-1:123:landingzone/abc123

# Output:
{
  "Status": "DRIFTED",
  "DriftDetails": [
    {
      "ResourceType": "AWS::CloudTrail::Trail",
      "AccountId": "111122223333",
      "Region": "us-east-1",
      "DriftStatus": "MODIFIED",
      "ExpectedValue": {"IsLogging": true},
      "ActualValue": {"IsLogging": false}
    }
  ]
}
```

**Repair Drift**:
```bash
# Option 1: Manual repair (fix the resource)
aws cloudtrail start-logging --name ControlTowerTrail

# Option 2: Reset landing zone (re-applies baselines)
aws controltower reset-landing-zone \
  --landing-zone-identifier arn:aws:controltower:us-east-1:123:landingzone/abc123

# Caution: This can take 30-60 minutes and may disrupt operations
```

### Lifecycle Events

**SNS Notifications**:
```bash
# Control Tower publishes events to SNS

Topic: aws-controltower-AggregateSecurityNotifications

Events:
- Guardrail violation detected
- Non-compliant resource found
- Account moved between OUs
- Guardrail enabled/disabled
- Landing zone drift detected
```

**EventBridge Integration**:
```json
{
  "source": ["aws.controltower"],
  "detail-type": ["AWS Service Event via CloudTrail"],
  "detail": {
    "eventName": ["EnableControl", "DisableControl", "CreateManagedAccount"]
  }
}

# Example: Trigger Lambda on new account creation
{
  "source": ["aws.controltower"],
  "detail-type": ["AWS Service Event via CloudTrail"],
  "detail": {
    "eventName": ["CreateManagedAccount"],
    "serviceEventDetails": {
      "createManagedAccountStatus": {
        "state": ["SUCCEEDED"]
      }
    }
  }
}
```

**Automation Example**:
```python
import boto3

def lambda_handler(event, context):
    """
    Triggered when new account created via Account Factory
    Performs additional customization beyond baseline
    """
    
    account_id = event['detail']['serviceEventDetails']['createManagedAccountStatus']['account']['accountId']
    account_name = event['detail']['serviceEventDetails']['createManagedAccountStatus']['account']['accountName']
    
    # Assume role in new account
    sts = boto3.client('sts')
    role = sts.assume_role(
        RoleArn=f'arn:aws:iam::{account_id}:role/AWSControlTowerExecution',
        RoleSessionName='CustomizationSession'
    )
    
    # Create session with assumed role
    session = boto3.Session(
        aws_access_key_id=role['Credentials']['AccessKeyId'],
        aws_secret_access_key=role['Credentials']['SecretAccessKey'],
        aws_session_token=role['Credentials']['SessionToken']
    )
    
    # Custom actions
    ec2 = session.client('ec2', region_name='us-east-1')
    
    # Create additional security groups
    sg = ec2.create_security_group(
        GroupName='custom-app-sg',
        Description='Custom application security group',
        VpcId=get_vpc_id(ec2)
    )
    
    # Tag resources
    ec2.create_tags(
        Resources=[sg['GroupId']],
        Tags=[
            {'Key': 'ManagedBy', 'Value': 'ControlTowerAutomation'},
            {'Key': 'Account', 'Value': account_name}
        ]
    )
    
    print(f"Customization complete for account {account_id}")
```

---

## Integration with AWS Services

### AWS Config Integration

**Aggregator in Audit Account**:
```bash
# Control Tower creates Config aggregator automatically

Aggregator Name: aws-controltower-GuardrailsComplianceAggregator

Aggregates data from:
- All accounts in organization
- All regions
- Centralized compliance view

Query across all accounts:
aws configservice select-aggregate-resource-config \
  --configuration-aggregator-name aws-controltower-GuardrailsComplianceAggregator \
  --expression "SELECT resourceId, resourceType, configuration.encrypted WHERE resourceType = 'AWS::EC2::Volume' AND configuration.encrypted = false"
```

### CloudTrail Integration

**Organization Trail**:
```yaml
Trail Name: aws-controltower-BaselineCloudTrail

Configuration:
  multiRegion: true
  multiAccount: true (organization trail)
  logFileValidation: true
  kmsEncryption: true
  s3Bucket: aws-controltower-logs-{log-archive-account}-{region}
  snsNotification: aws-controltower-AllConfigNotifications
  
Events Logged:
  - Management events: All
  - Data events: S3 (optional), Lambda (optional)
  - Insights events: API error rate, API call rate

Cannot be disabled by member accounts
Centralized in Log Archive account
```

### SSO Integration

**Permission Sets**:
```bash
# Control Tower creates default permission sets

AWSAdministratorAccess:
  - Full admin access
  - Assigned to: Admin group

AWSPowerUserAccess:
  - Everything except IAM
  - Assigned to: PowerUsers group

AWSReadOnlyAccess:
  - Read-only access
  - Assigned to: Auditors group

Custom Permission Sets (example):
DatabaseAdminAccess:
  - RDS full access
  - DynamoDB full access
  - Secrets Manager read
  - VPC read-only
```

**SSO Assignment**:
```bash
# Assign permission set to group for specific OU

All Production accounts → DatabaseAdminAccess → DBA_Group
All Development accounts → AWSPowerUserAccess → Developers_Group
All accounts → AWSReadOnlyAccess → Auditors_Group
```

### Service Catalog Integration

**Account Factory Portfolio**:
```bash
# Automatically created by Control Tower

Portfolio: AWS Control Tower Account Factory Portfolio

Products:
1. AWS Control Tower Account Factory
   - Version: 1.0
   - Launches new accounts
   - Parameters: AccountName, Email, OU, SSO, VPC

Access:
- Shared with entire organization
- Users in AccountFactoryUsers group can provision
- Self-service account creation
```

---

## Migration and Deployment

### Existing Organization Migration

**Scenario**: You have existing AWS Organization with accounts

**Migration Process**:

**Step 1: Pre-Migration Assessment**:
```bash
# Check current state
aws organizations describe-organization

Requirements:
✅ Not already using Control Tower
✅ No AWS SSO configured (will be created)
✅ Root account has permissions
✅ No conflicting CloudTrail/Config

Potential Issues:
⚠️  Existing SCPs (will be inherited)
⚠️  Existing accounts need manual enrollment
⚠️  Resources in management account (clean up recommended)
```

**Step 2: Set Up Landing Zone**:
```bash
# Creates foundational structure
# Does NOT automatically enroll existing accounts

Result:
✅ Security OU created
✅ Audit + Log Archive accounts created
✅ Guardrails enabled for new accounts
❌ Existing accounts remain unmanaged
```

**Step 3: Enroll Existing Accounts**:
```bash
# Manual enrollment per account

Prerequisites per account:
1. Remove existing AWS Config recorders/delivery channels
2. Remove existing CloudTrail trails (or ensure compatible)
3. Ensure AWSControlTowerExecution role can be created

Enroll via Console:
Control Tower → Account Factory → Enroll account

Enroll via CLI:
aws controltower register-account \
  --account-id 111122223333 \
  --organizational-unit-id ou-xyz-prod123

Duration per account: 20-30 minutes
```

**Step 4: Post-Enrollment**:
```bash
# Verify account enrolled successfully
aws controltower describe-account-enrollment \
  --account-id 111122223333

# Apply guardrails
# Configure SSO access
# Update baselines (if needed)
```

**Bulk Enrollment Script**:
```python
import boto3
import time

ct = boto3.client('controltower')
org = boto3.client('organizations')

# Get all accounts
accounts = org.list_accounts()['Accounts']

for account in accounts:
    # Skip management, audit, log archive
    if account['Id'] in ['123456789012', '111111111111', '222222222222']:
        continue
    
    print(f"Enrolling {account['Name']} ({account['Id']})")
    
    try:
        ct.register_account(
            AccountId=account['Id'],
            OrganizationalUnitId='ou-xyz-prod123'
        )
        
        # Wait before next enrollment
        time.sleep(60)
    except Exception as e:
        print(f"Error enrolling {account['Name']}: {e}")

# Monitor enrollment status
def check_enrollment_status(account_id):
    response = ct.describe_account_enrollment(AccountId=account_id)
    return response['Status']

for account in accounts:
    status = check_enrollment_status(account['Id'])
    print(f"{account['Name']}: {status}")
```

### Greenfield Deployment

**Best Practice Setup**:

**Day 1**:
```bash
1. Set up Control Tower landing zone (1 hour)
2. Configure region deny settings
3. Enable recommended guardrails
4. Configure SSO with corporate IdP
5. Create custom OUs (Production, Dev, etc.)
```

**Day 2-5**:
```bash
6. Create baseline customizations (AFT)
7. Define network architecture (Transit Gateway design)
8. Create shared services accounts
9. Test Account Factory provisioning
10. Document account request process
```

**Day 6-30**:
```bash
11. Onboard teams to Account Factory
12. Provision workload accounts
13. Migrate workloads to new accounts
14. Implement custom guardrails
15. Set up monitoring and alerting
```

---

## Best Practices

### Operational Best Practices

**1. Separate Workloads by OU**:
```
✅ Production OU: High security, change control
✅ Development OU: More flexibility, lower cost
✅ Sandbox OU: Experimentation, auto-delete resources
```

**2. Least Privilege Access**:
```
❌ Don't give everyone AdministratorAccess
✅ Create role-specific permission sets
✅ Use time-bound access (Session duration)
✅ Require MFA for sensitive operations
```

**3. Automate Account Provisioning**:
```
❌ Manual account creation via console
✅ Service Catalog self-service
✅ Terraform/AFT for customization
✅ Git-based workflow for baseline changes
```

**4. Monitor Compliance Continuously**:
```
✅ CloudWatch dashboard for guardrail violations
✅ EventBridge rules for real-time alerts
✅ Weekly compliance reports
✅ Automated remediation (where possible)
```

**5. Version Control Baselines**:
```
✅ Store account baselines in Git
✅ Code review for baseline changes
✅ Automated testing of baselines
✅ Rollback capability
```

### Security Best Practices

**1. Protect Log Archive Account**:
```
✅ MFA for root user
✅ No human access (read-only via Audit account)
✅ S3 bucket versioning + Object Lock
✅ Deny delete policies
✅ Separate from Audit account
```

**2. Regular Audits**:
```
✅ Review guardrail compliance monthly
✅ Audit SSO access quarterly
✅ Review CloudTrail logs for anomalies
✅ Test drift detection and remediation
```

**3. Break Glass Procedures**:
```
Document emergency access procedures:
1. When Control Tower is inaccessible
2. When SSO is down
3. When guardrails need temporary bypass

Store break-glass credentials securely:
- Physical vault
- Multiple custodians required
- Audit all usage
```

### Cost Optimization

**1. Right-Size Config**:
```
❌ Enable all 200+ guardrails in all accounts
✅ Enable mandatory + essential guardrails
✅ Use detective guardrails (cheaper than preventive for some cases)

Example:
- 100 accounts × 50 Config rules × 3 regions × $2 = $30,000/month
- Reduce to 30 essential rules = $18,000/month (40% savings)
```

**2. CloudTrail Optimization**:
```
✅ S3 lifecycle policies (move to Glacier after 90 days)
✅ Enable log file validation (but skip CloudWatch Logs for all trails)
✅ Use Organization trail (not per-account trails)
```

**3. Account Consolidation**:
```
❌ Separate account for every small workload
✅ Group related workloads in shared accounts
✅ Use tags for cost allocation within accounts
```

---

## Interview Questions

### Q1: What is AWS Control Tower and what problem does it solve?

**Answer**:

AWS Control Tower automates the setup and governance of a secure, compliant multi-account AWS environment based on best practices.

**Problems it solves**:
```
1. Manual multi-account setup (weeks → 1 hour)
2. Inconsistent security baselines
3. Compliance monitoring at scale
4. Account provisioning complexity
5. Centralized governance
```

**Key components**:
```
- Landing Zone: Foundational multi-account structure
- Guardrails: Preventive (SCPs) and detective (Config) rules
- Account Factory: Automated account provisioning
- Dashboard: Centralized compliance view
```

**Real-world use case**:
```
Company with 200 AWS accounts:
- Before: Manual setup, inconsistent configs, compliance gaps
- After: Automated provisioning, 150 guardrails enforced, 99% compliant
```

### Q2: Explain the difference between preventive and detective guardrails with examples.

**Answer**:

**Preventive Guardrails**:
```
Technology: Service Control Policies (SCPs)
Effect: Block action BEFORE it happens
Cannot be overridden: Hard deny

Example: Disallow Deletion of CloudTrail
{
  "Effect": "Deny",
  "Action": ["cloudtrail:DeleteTrail"],
  "Resource": "*"
}

Result: API call fails immediately with access denied
```

**Detective Guardrails**:
```
Technology: AWS Config Rules
Effect: Detect violation AFTER it happens
Can be overridden: Resource created, then flagged

Example: Detect Unencrypted EBS Volumes
Config Rule: encrypted-volumes
Resource: AWS::EC2::Volume

Result: Volume created successfully, then marked non-compliant
Notification sent to security team
```

**When to use each**:
```
Preventive:
- Critical security controls (CloudTrail, root account)
- Compliance requirements (region restrictions)
- Immutable policies (logging, encryption)

Detective:
- Monitoring best practices (MFA on root)
- Soft enforcement (tagging standards)
- Gradual rollout (alert before blocking)
```

### Q3: How does Account Factory work and how would you customize it?

**Answer**:

**Account Factory Process**:
```
1. User requests account via Service Catalog
2. Parameters: Name, Email, OU, SSO user, VPC config
3. Automated provisioning:
   - Create AWS account
   - Move to specified OU
   - Apply baselines (CloudTrail, Config, VPC)
   - Enable guardrails
   - Grant SSO access
4. Account ready in 30 minutes
```

**Customization Options**:

**1. Account Factory for Terraform (AFT)**:
```hcl
# Repository structure
aft-account-customizations/
├── terraform/
│   ├── account-01234567890/  # Account-specific
│   │   └── security-groups.tf
│   ├── production-ou/  # OU-level
│   │   └── monitoring.tf
│   └── global/  # All accounts
│       └── tags.tf

# Example: production-ou/monitoring.tf
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "production-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
}
```

**2. Lambda-based Customization**:
```python
# Triggered by Account Factory completion event
def lambda_handler(event, context):
    account_id = event['detail']['serviceEventDetails']['createManagedAccountStatus']['account']['accountId']
    
    # Assume AWSControlTowerExecution role
    sts = boto3.client('sts')
    creds = sts.assume_role(
        RoleArn=f'arn:aws:iam::{account_id}:role/AWSControlTowerExecution',
        RoleSessionName='Customization'
    )
    
    # Custom actions
    # - Create additional IAM roles
    # - Configure cost allocation tags
    # - Set up GuardDuty
    # - Enable Macie
```

**3. Service Catalog Constraints**:
```
Template constraints: Restrict parameter values
Launch constraints: IAM role for provisioning
Approval constraints: Require manager approval for production accounts
```

### Q4: How would you migrate an existing AWS Organization to Control Tower?

**Answer**:

**Migration Process**:

**Phase 1: Assessment** (1-2 days):
```bash
# Check prerequisites
1. List all accounts and resources
2. Document existing SCPs
3. Identify conflicting services:
   - Existing AWS SSO
   - Existing CloudTrail
   - Existing Config
4. Plan OU structure

# Risks:
- Existing guardrails may conflict
- SSO will be replaced
- CloudTrail/Config will be modified
```

**Phase 2: Landing Zone Setup** (1 day):
```bash
# Set up Control Tower
1. Choose management account
2. Create Audit + Log Archive accounts
3. Define home region
4. Configure region deny settings
5. Wait 60 minutes for setup

# Note: Existing accounts NOT automatically enrolled
```

**Phase 3: Account Enrollment** (1-4 weeks depending on account count):
```bash
# Per-account preparation:
1. Remove existing Config recorder/delivery channel:
   aws configservice delete-configuration-recorder --name default
   aws configservice delete-delivery-channel --name default

2. Verify CloudTrail compatibility
3. Ensure AWSControlTowerExecution role can be created

# Enroll account:
aws controltower register-account \
  --account-id 123456789012 \
  --organizational-unit-id ou-xyz-prod

# Duration: 20-30 minutes per account
# Recommendation: Batch 10 accounts/day
```

**Phase 4: Validation** (1 week):
```bash
# Verify each enrolled account:
1. CloudTrail logging to Log Archive
2. Config recorder active
3. Guardrails applied and compliant
4. SSO access working
5. Workloads unaffected

# Rollback plan:
- Keep existing CloudTrail as backup (different S3 bucket)
- Document all changes per account
```

**Best Practices**:
```
✅ Start with non-production accounts
✅ Pilot with 5-10 accounts first
✅ Automate enrollment (Python script)
✅ Schedule maintenance windows
✅ Communicate with account owners
✅ Document issues and solutions
```

### Q5: How do you handle drift in Control Tower and why is it important?

**Answer**:

**What is Drift?**:
```
Manual changes to Control Tower-managed resources

Examples:
- User disables CloudTrail
- Someone modifies Log Archive S3 bucket policy
- IAM role AWSControlTowerExecution deleted
- AWS Config recorder stopped
```

**Why It's Critical**:
```
1. Compliance: Guardrails not enforced
2. Security: Audit trail compromised
3. Operations: Landing zone inconsistent
4. Governance: Central control lost
```

**Detection**:
```bash
# Automatic (daily):
Control Tower runs daily drift checks
SNS notification if drift detected

# Manual:
aws controltower detect-drift \
  --landing-zone-identifier arn:aws:controltower:us-east-1:123:landingzone/abc

# Output:
{
  "DriftStatus": "DRIFTED",
  "DriftDetails": [
    {
      "ResourceType": "AWS::CloudTrail::Trail",
      "AccountId": "111122223333",
      "DriftStatus": "DELETED"
    }
  ]
}
```

**Remediation**:
```bash
# Option 1: Manual fix
# Re-enable the specific resource
aws cloudtrail create-trail --name ControlTowerTrail ...

# Option 2: Reset Landing Zone
aws controltower reset-landing-zone \
  --landing-zone-identifier arn:aws:controltower:us-east-1:123:landingzone/abc

# Caution: 30-60 minutes, may disrupt operations
# Re-applies all baselines
```

**Prevention**:
```
1. Preventive Guardrails: Block changes to critical resources
2. SSO Permissions: Least privilege (no IAM full access)
3. Monitoring: EventBridge rule for CloudTrail/Config changes
4. Education: Train teams on Control Tower managed resources
```

**Automated Remediation**:
```python
# EventBridge rule → Lambda
def lambda_handler(event, context):
    if event['detail']['eventName'] == 'StopLogging':
        trail_name = event['detail']['requestParameters']['name']
        
        # Re-enable CloudTrail
        ct = boto3.client('cloudtrail')
        ct.start_logging(Name=trail_name)
        
        # Alert security team
        sns = boto3.client('sns')
        sns.publish(
            TopicArn='arn:aws:sns:us-east-1:123:security-alerts',
            Message=f'CloudTrail {trail_name} was stopped and automatically re-enabled',
            Subject='CRITICAL: CloudTrail Drift Detected and Remediated'
        )
```

---

This comprehensive Control Tower guide covers all aspects needed for SAP-C02 certification, including architecture, guardrails, Account Factory, governance at scale, and production best practices with real-world scenarios.