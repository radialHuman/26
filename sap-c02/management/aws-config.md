# AWS Config

## Table of Contents
1. [AWS Config Fundamentals](#aws-config-fundamentals)
2. [Configuration Recording](#configuration-recording)
3. [Config Rules](#config-rules)
4. [Conformance Packs](#conformance-packs)
5. [Multi-Account Config](#multi-account-config)
6. [Aggregators](#aggregators)
7. [Remediation Actions](#remediation-actions)
8. [Advanced Queries](#advanced-queries)
9. [Integration & Automation](#integration--automation)
10. [Interview Questions](#interview-questions)

---

## AWS Config Fundamentals

### What is AWS Config?

**AWS Config** tracks resource configuration changes and evaluates compliance against desired configurations.

**Core Capabilities**:
```
Configuration Management
├── Resource inventory (what resources exist)
├── Configuration history (how resources changed over time)
├── Change tracking (who changed what, when)
└── Relationship mapping (resource dependencies)

Compliance Auditing
├── Config Rules (evaluate compliance)
├── Conformance Packs (packaged compliance frameworks)
├── Remediation (automatic fixing)
└── Compliance dashboard (organization-wide view)

Use Cases:
✅ Security analysis (detect unauthorized changes)
✅ Compliance auditing (PCI-DSS, HIPAA, CIS, SOC2)
✅ Change management (track config changes)
✅ Troubleshooting (what changed before the outage?)
✅ Resource inventory (what EC2 instances have public IPs?)
```

### AWS Config vs CloudTrail

**Comparison**:
```
Feature          CloudTrail                    AWS Config
------------------------------------------------------------------------
Focus            WHO did WHAT, WHEN           WHAT is the current/past STATE
Log type         API call logs                Resource configuration snapshots
Question         Who deleted the S3 bucket?   Is the bucket encrypted?
                 When was IAM policy changed? What security groups are open?
Compliance       Audit trail                  Compliance evaluation
Storage          S3 (JSON event logs)         S3 (configuration snapshots)
Query            Athena (SQL)                 Advanced Query (SQL-like)
Real-time        Yes (15 min CloudWatch)      Periodic (snapshot intervals)
Remediation      No                           Yes (auto-remediation)

Both needed for complete security:
CloudTrail: Forensics (WHO changed the rule allowing 0.0.0.0/0?)
Config: Current state (WHICH security groups allow 0.0.0.0/0?)
```

### How Config Works

**Architecture**:
```
AWS Resources (EC2, S3, VPC, IAM, etc.)
          ↓
    Config Recorder (tracks changes)
          ↓
Configuration Snapshots (S3)
          ↓
Config Rules Evaluation
          ↓
┌─────────┼──────────┬──────────┐
↓         ↓          ↓          ↓
Compliant Non-Compliant Remediation CloudWatch
Dashboard Dashboard   Action      Event
```

**Configuration Items** (snapshots):
```json
{
  "configurationItemVersion": "1.3",
  "resourceType": "AWS::EC2::SecurityGroup",
  "resourceId": "sg-1234567890abcdef",
  "resourceName": "web-server-sg",
  "awsRegion": "us-east-1",
  "availabilityZone": "Not Applicable",
  "resourceCreationTime": "2026-01-01T00:00:00.000Z",
  "configurationStateId": "1706716800000",
  "configuration": {
    "groupId": "sg-1234567890abcdef",
    "groupName": "web-server-sg",
    "ipPermissions": [
      {
        "fromPort": 80,
        "toPort": 80,
        "ipProtocol": "tcp",
        "ipRanges": ["0.0.0.0/0"]
      },
      {
        "fromPort": 22,
        "toPort": 22,
        "ipProtocol": "tcp",
        "ipRanges": ["0.0.0.0/0"]  ← Violation!
      }
    ]
  },
  "supplementaryConfiguration": {},
  "tags": {
    "Environment": "Production"
  },
  "configurationItemStatus": "ResourceDiscovered",
  "relatedEvents": ["abc-123-def-456"]
}
```

### Pricing

```
Configuration Recording:
- Configuration items: $0.003 per item recorded
- Example: 1000 resources × 10 changes/month = 10,000 items
  10,000 × $0.003 = $30/month

Config Rules Evaluation:
- Rule evaluations: $0.001 per evaluation (first 100K)
                    $0.0008 (100K-500K)
                    $0.0005 (>500K)
- Example: 50 rules × 1000 resources × 2 evaluations/day × 30 days
  = 3,000,000 evaluations
  First 100K: 100,000 × $0.001 = $100
  Next 400K: 400,000 × $0.0008 = $320
  Remaining 2.5M: 2,500,000 × $0.0005 = $1,250
  Total: $1,670/month

Conformance Packs:
- Per pack per region: $10/month (up to 10,000 rules)
- Example: 3 packs × 2 regions = 6 × $10 = $60/month

Total Example Cost (1000 resources, 50 rules):
- Recording: $30
- Evaluations: $1,670
- Conformance: $60
Total: $1,760/month

Cost Optimization:
❌ Don't: Record every change to every resource type
✅ Do: Select specific resource types
❌ Don't: Evaluate rules continuously
✅ Do: Periodic evaluation (daily/weekly)
✅ Do: Use conformance packs (flat $10 vs per-rule pricing)

Optimized Cost (same setup):
- Recording (selective): $15 (50% reduction)
- Evaluations (periodic): $500 (70% reduction)
- Conformance: $60
Total: $575/month (67% savings)
```

---

## Configuration Recording

### Enable Config

**Single Account Setup**:
```bash
# Create S3 bucket for config snapshots
aws s3 mb s3://config-bucket-123456789012-us-east-1

# Bucket policy (Config needs write access)
aws s3api put-bucket-policy \
  --bucket config-bucket-123456789012-us-east-1 \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "AWSConfigBucketPermissionsCheck",
      "Effect": "Allow",
      "Principal": {
        "Service": "config.amazonaws.com"
      },
      "Action": "s3:GetBucketAcl",
      "Resource": "arn:aws:s3:::config-bucket-123456789012-us-east-1"
    },
    {
      "Sid": "AWSConfigBucketExistenceCheck",
      "Effect": "Allow",
      "Principal": {
        "Service": "config.amazonaws.com"
      },
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::config-bucket-123456789012-us-east-1"
    },
    {
      "Sid": "AWSConfigBucketPutObject",
      "Effect": "Allow",
      "Principal": {
        "Service": "config.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::config-bucket-123456789012-us-east-1/AWSLogs/123456789012/Config/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    }]
  }'

# Create IAM role for Config
aws iam create-role \
  --role-name AWSConfigRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "config.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach managed policy
aws iam attach-role-policy \
  --role-name AWSConfigRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/ConfigRole

# Enable Config recorder
aws configservice put-configuration-recorder \
  --configuration-recorder '{
    "name": "default",
    "roleARN": "arn:aws:iam::123456789012:role/AWSConfigRole",
    "recordingGroup": {
      "allSupported": true,
      "includeGlobalResources": true
    }
  }'

# Set delivery channel
aws configservice put-delivery-channel \
  --delivery-channel '{
    "name": "default",
    "s3BucketName": "config-bucket-123456789012-us-east-1",
    "configSnapshotDeliveryProperties": {
      "deliveryFrequency": "TwentyFour_Hours"
    }
  }'

# Start recorder
aws configservice start-configuration-recorder \
  --configuration-recorder-name default
```

**Selective Recording** (cost optimization):
```bash
# Record only specific resource types
aws configservice put-configuration-recorder \
  --configuration-recorder '{
    "name": "default",
    "roleARN": "arn:aws:iam::123456789012:role/AWSConfigRole",
    "recordingGroup": {
      "allSupported": false,
      "includeGlobalResources": false,
      "resourceTypes": [
        "AWS::EC2::Instance",
        "AWS::EC2::SecurityGroup",
        "AWS::EC2::Volume",
        "AWS::RDS::DBInstance",
        "AWS::S3::Bucket",
        "AWS::IAM::Role",
        "AWS::IAM::Policy",
        "AWS::Lambda::Function"
      ]
    }
  }'

# Benefits:
# - Record only security-critical resources
# - Reduce configuration items by 70%
# - Cost: $30 → $9/month
```

### Configuration Snapshots

**Snapshot Structure** (S3):
```
s3://config-bucket-123456789012-us-east-1/
└── AWSLogs/
    └── 123456789012/  (Account ID)
        └── Config/
            └── us-east-1/
                ├── 2026/
                │   └── 1/
                │       └── 31/
                │           ├── ConfigSnapshot/
                │           │   └── 123456789012_Config_us-east-1_ConfigSnapshot_20260131T120000Z.json.gz
                │           └── ConfigHistory/
                │               ├── 123456789012_Config_us-east-1_ConfigHistory_AWS::EC2::Instance_20260131_120000.json.gz
                │               └── 123456789012_Config_us-east-1_ConfigHistory_AWS::S3::Bucket_20260131_120000.json.gz
                └── ConfigWriteabilityCheckFile

ConfigSnapshot: Full inventory at snapshot time
ConfigHistory: Per-resource change history
```

**View Configuration History**:
```bash
# Get configuration timeline for resource
aws configservice get-resource-config-history \
  --resource-type AWS::EC2::SecurityGroup \
  --resource-id sg-1234567890abcdef \
  --chronological-order Reverse \
  --limit 10

# Output: Last 10 configuration changes
{
  "configurationItems": [
    {
      "version": "1.3",
      "configurationItemCaptureTime": "2026-01-31T10:00:00.000Z",
      "configurationStateId": "1706716800000",
      "relatedEvents": ["abc-123"],
      "configuration": {
        "ipPermissions": [
          {"fromPort": 80, "toPort": 80, "ipRanges": ["0.0.0.0/0"]},
          {"fromPort": 22, "toPort": 22, "ipRanges": ["10.0.0.0/8"]}  ← Changed from 0.0.0.0/0
        ]
      }
    },
    {
      "configurationItemCaptureTime": "2026-01-30T15:00:00.000Z",
      "configuration": {
        "ipPermissions": [
          {"fromPort": 80, "toPort": 80, "ipRanges": ["0.0.0.0/0"]},
          {"fromPort": 22, "toPort": 22, "ipRanges": ["0.0.0.0/0"]}  ← Before change
        ]
      }
    }
  ]
}

# Find who made the change (CloudTrail)
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventId,AttributeValue=abc-123

# Shows: john.doe authorized the change at 2026-01-30T15:00:00Z
```

---

## Config Rules

### AWS Managed Rules

**Categories**:
```
Security & Compliance (90+ rules):
- encrypted-volumes (EBS encryption)
- s3-bucket-public-read-prohibited
- restricted-ssh (no 0.0.0.0/0 on port 22)
- iam-password-policy
- root-account-mfa-enabled
- rds-storage-encrypted
- cloudtrail-enabled

Operational Best Practices (50+ rules):
- ec2-instance-managed-by-systems-manager
- desired-instance-type (t3.micro, t3.small only)
- required-tags (must have Environment, Owner tags)

Cost Optimization (20+ rules):
- ec2-instance-no-public-ip
- ebs-optimized-instance
- rds-multi-az-support

Total: 200+ AWS-managed rules
```

**Enable Managed Rule**:
```bash
aws configservice put-config-rule \
  --config-rule '{
    "ConfigRuleName": "encrypted-volumes",
    "Description": "Ensure all EBS volumes are encrypted",
    "Source": {
      "Owner": "AWS",
      "SourceIdentifier": "ENCRYPTED_VOLUMES"
    },
    "Scope": {
      "ComplianceResourceTypes": [
        "AWS::EC2::Volume"
      ]
    }
  }'

# Rule triggers when:
# - New EBS volume created
# - Existing volume encryption modified
# Evaluates: Is volume encrypted? YES → Compliant, NO → Non-Compliant
```

**Restricted SSH Rule**:
```bash
aws configservice put-config-rule \
  --config-rule '{
    "ConfigRuleName": "restricted-ssh",
    "Description": "Security groups cannot allow 0.0.0.0/0 on port 22",
    "Source": {
      "Owner": "AWS",
      "SourceIdentifier": "INCOMING_SSH_DISABLED"
    },
    "Scope": {
      "ComplianceResourceTypes": [
        "AWS::EC2::SecurityGroup"
      ]
    }
  }'

# Evaluates: Does security group allow SSH from 0.0.0.0/0?
# YES → Non-Compliant
# NO → Compliant
```

**Required Tags Rule**:
```bash
aws configservice put-config-rule \
  --config-rule '{
    "ConfigRuleName": "required-tags",
    "Description": "Resources must have Environment and Owner tags",
    "Source": {
      "Owner": "AWS",
      "SourceIdentifier": "REQUIRED_TAGS"
    },
    "InputParameters": "{\"tag1Key\":\"Environment\",\"tag2Key\":\"Owner\"}",
    "Scope": {
      "ComplianceResourceTypes": [
        "AWS::EC2::Instance",
        "AWS::RDS::DBInstance",
        "AWS::S3::Bucket"
      ]
    }
  }'

# Evaluates: Does resource have both Environment AND Owner tags?
# YES → Compliant
# NO → Non-Compliant
```

### Custom Config Rules

**Lambda-Based Rule** (check instance type):
```python
import boto3
import json

def lambda_handler(event, context):
    """
    Custom Config rule: Only allow t3.micro and t3.small instances
    """
    config = boto3.client('config')
    
    # Get resource configuration
    config_item = json.loads(event['configurationItem'])
    resource_type = config_item['resourceType']
    resource_id = config_item['resourceId']
    
    compliance_status = 'NON_COMPLIANT'
    annotation = 'Instance type not allowed'
    
    if resource_type == 'AWS::EC2::Instance':
        instance_type = config_item['configuration']['instanceType']
        
        allowed_types = ['t3.micro', 't3.small']
        if instance_type in allowed_types:
            compliance_status = 'COMPLIANT'
            annotation = f'Instance type {instance_type} is allowed'
        else:
            annotation = f'Instance type {instance_type} not allowed. Use {", ".join(allowed_types)}'
    
    # Put evaluation
    config.put_evaluations(
        Evaluations=[{
            'ComplianceResourceType': resource_type,
            'ComplianceResourceId': resource_id,
            'ComplianceType': compliance_status,
            'Annotation': annotation,
            'OrderingTimestamp': config_item['configurationItemCaptureTime']
        }],
        ResultToken=event['resultToken']
    )
    
    return compliance_status
```

**Create Custom Rule**:
```bash
# Create Lambda function
aws lambda create-function \
  --function-name ConfigRuleAllowedInstanceTypes \
  --runtime python3.11 \
  --role arn:aws:iam::123456789012:role/ConfigRuleLambdaRole \
  --handler index.lambda_handler \
  --zip-file fileb://function.zip

# Grant Config permission to invoke Lambda
aws lambda add-permission \
  --function-name ConfigRuleAllowedInstanceTypes \
  --statement-id AllowConfigInvoke \
  --action lambda:InvokeFunction \
  --principal config.amazonaws.com

# Create Config rule
aws configservice put-config-rule \
  --config-rule '{
    "ConfigRuleName": "allowed-instance-types",
    "Description": "Only t3.micro and t3.small instances allowed",
    "Source": {
      "Owner": "CUSTOM_LAMBDA",
      "SourceIdentifier": "arn:aws:lambda:us-east-1:123456789012:function:ConfigRuleAllowedInstanceTypes",
      "SourceDetails": [{
        "EventSource": "aws.config",
        "MessageType": "ConfigurationItemChangeNotification"
      }]
    },
    "Scope": {
      "ComplianceResourceTypes": [
        "AWS::EC2::Instance"
      ]
    }
  }'
```

### Evaluation Modes

**Change-Triggered** (default):
```bash
# Evaluate when resource changes
"SourceDetails": [{
  "EventSource": "aws.config",
  "MessageType": "ConfigurationItemChangeNotification"
}]

# Example: Security group rule evaluates when SG modified
# Cost: Pay only when changes occur
# Use for: Security compliance (detect unauthorized changes)
```

**Periodic**:
```bash
# Evaluate on schedule
"SourceDetails": [{
  "EventSource": "aws.config",
  "MessageType": "ScheduledNotification",
  "MaximumExecutionFrequency": "TwentyFour_Hours"
}]

# Frequencies: 1h, 3h, 6h, 12h, 24h
# Example: Check CloudTrail enabled daily
# Cost: Predictable (# rules × # resources × frequency)
# Use for: Operational checks (services enabled, backups current)
```

**Both** (change + periodic):
```bash
"SourceDetails": [
  {
    "EventSource": "aws.config",
    "MessageType": "ConfigurationItemChangeNotification"
  },
  {
    "EventSource": "aws.config",
    "MessageType": "ScheduledNotification",
    "MaximumExecutionFrequency": "TwentyFour_Hours"
  }
]

# Evaluate on change AND daily
# Use for: Critical compliance (don't miss any violation)
```

---

## Conformance Packs

### What are Conformance Packs?

**Packaged compliance frameworks**:
```
Conformance Pack = Collection of Config Rules + Remediation Actions
Template-based deployment (YAML)
Industry standards pre-built

AWS-Provided Packs:
├── Operational Best Practices for PCI-DSS
├── Operational Best Practices for HIPAA
├── Operational Best Practices for CIS AWS Foundations Benchmark
├── Operational Best Practices for NIST 800-53
├── Operational Best Practices for SOC2
├── Operational Best Practices for Well-Architected Framework
└── Operational Best Practices for Amazon S3

Benefits:
✅ Deploy 50+ rules with one command
✅ Industry-standard compliance
✅ Automatic updates (AWS maintains templates)
✅ Flat pricing ($10/pack/region vs per-rule)
```

### Deploy Conformance Pack

**CIS Benchmark**:
```bash
# Download template
aws configservice describe-conformance-pack-compliance \
  --conformance-pack-name OrgConformsPack-CIS-AWS-Foundations-Benchmark

# Deploy pack
aws configservice put-conformance-pack \
  --conformance-pack-name CIS-AWS-Foundations-Benchmark \
  --template-s3-uri s3://aws-configservice-conformance-packs-us-east-1/CISAWSFoundationsBenchmark.yaml

# Deploys 28 rules:
# - Root account MFA enabled
# - CloudTrail enabled in all regions
# - S3 bucket logging enabled
# - VPC flow logs enabled
# - IAM password policy (14 chars, symbols, rotation)
# - etc.

# Check compliance
aws configservice describe-conformance-pack-compliance \
  --conformance-pack-name CIS-AWS-Foundations-Benchmark

# Output:
{
  "ConformancePackRuleComplianceList": [
    {
      "ConfigRuleName": "cis-1.1-root-account-mfa-enabled",
      "ComplianceType": "COMPLIANT"
    },
    {
      "ConfigRuleName": "cis-2.1-cloudtrail-enabled",
      "ComplianceType": "COMPLIANT"
    },
    {
      "ConfigRuleName": "cis-2.3-s3-bucket-logging-enabled",
      "ComplianceType": "NON_COMPLIANT",
      "Controls": ["2.3"]
    }
  ]
}
```

**Custom Conformance Pack** (YAML):
```yaml
Resources:
  EncryptedVolumesRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: encrypted-volumes
      Description: EBS volumes must be encrypted
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Volume
  
  RestrictedSSHRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: restricted-ssh
      Description: No SSH from 0.0.0.0/0
      Source:
        Owner: AWS
        SourceIdentifier: INCOMING_SSH_DISABLED
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::SecurityGroup
  
  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: required-tags
      Description: Resources must have Environment and Owner tags
      Source:
        Owner: AWS
        SourceIdentifier: REQUIRED_TAGS
      InputParameters:
        tag1Key: Environment
        tag2Key: Owner
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Instance
          - AWS::RDS::DBInstance
  
  # Remediation: Auto-enable EBS encryption
  EnableEBSEncryptionRemediation:
    Type: AWS::Config::RemediationConfiguration
    Properties:
      ConfigRuleName: !Ref EncryptedVolumesRule
      TargetType: SSM_DOCUMENT
      TargetIdentifier: AWS-EnableEBSEncryptionByDefault
      Automatic: true
      MaximumAutomaticAttempts: 3
      RetryAttemptSeconds: 60

# Deploy pack
aws configservice put-conformance-pack \
  --conformance-pack-name CustomSecurityBaseline \
  --template-body file://security-baseline.yaml
```

### Organization-Wide Deployment

**Deploy to all accounts**:
```bash
# From management account
aws configservice put-organization-conformance-pack \
  --organization-conformance-pack-name CIS-Benchmark \
  --template-s3-uri s3://config-packs/CISAWSFoundationsBenchmark.yaml \
  --delivery-s3-bucket config-conformance-packs-123456789012 \
  --excluded-accounts 111111111111 222222222222

# Deploys to all accounts EXCEPT excluded ones
# Automatic deployment to new accounts

# View compliance across organization
aws configservice describe-organization-conformance-pack-statuses

# Output:
{
  "OrganizationConformancePackStatuses": [
    {
      "OrganizationConformancePackName": "CIS-Benchmark",
      "Status": "CREATE_SUCCESSFUL",
      "LastUpdateTime": "2026-01-31T10:00:00Z"
    }
  ]
}

# Aggregated compliance
aws configservice get-organization-conformance-pack-detailed-status \
  --organization-conformance-pack-name CIS-Benchmark

# Shows compliance per account
```

---

## Multi-Account Config

### Organization Config Setup

**Delegated Administrator**:
```bash
# From management account
# Enable AWS Config in organization
aws organizations enable-aws-service-access \
  --service-principal config.amazonaws.com

# Enable multi-account setup in Config
aws organizations enable-aws-service-access \
  --service-principal config-multiaccountsetup.amazonaws.com

# Delegate admin to security account
aws configservice register-delegated-administrator \
  --member-account-id 555555555555

# Now security account (555555555555) can:
# - Deploy config recorders to all accounts
# - Create organization config rules
# - View aggregated compliance
```

**Automatic Recorder Setup**:
```bash
# From delegated admin account
# Enable recorder in all accounts + future accounts
aws configservice put-organization-config-rule \
  --organization-config-rule-name enable-config-recording \
  --organization-managed-rule-metadata '{
    "RuleIdentifier": "CLOUD_TRAIL_ENABLED",
    "Description": "Ensures CloudTrail is enabled"
  }'

# Automatic setup includes:
# - Configuration recorder (default, all resources)
# - Delivery channel (organization S3 bucket)
# - IAM role (AWSConfigRole)
```

---

## Aggregators

### Multi-Account Aggregation

**Aggregator in Delegated Admin Account**:
```bash
# Create aggregator (collects data from all accounts)
aws configservice put-configuration-aggregator \
  --configuration-aggregator-name OrganizationAggregator \
  --organization-aggregation-source '{
    "RoleArn": "arn:aws:iam::555555555555:role/aws-service-role/organizations.amazonaws.com/AWSServiceRoleForOrganizations",
    "AwsRegions": ["us-east-1", "us-west-2", "eu-west-1"],
    "AllAwsRegions": false
  }'

# Aggregates data from:
# - All accounts in organization
# - Specified regions (us-east-1, us-west-2, eu-west-1)
# - Updates every 12 hours

# Authorization automatic (via Organizations)
```

**Cross-Account Aggregator** (without Organizations):
```bash
# In aggregator account
aws configservice put-configuration-aggregator \
  --configuration-aggregator-name CrossAccountAggregator \
  --account-aggregation-sources '[
    {
      "AccountIds": ["111111111111", "222222222222", "333333333333"],
      "AwsRegions": ["us-east-1"],
      "AllAwsRegions": false
    }
  ]'

# In each source account, authorize aggregator
aws configservice put-aggregation-authorization \
  --authorized-account-id 555555555555 \
  --authorized-aws-region us-east-1
```

### Query Aggregated Data

**Find non-compliant resources across all accounts**:
```bash
aws configservice describe-aggregate-compliance-by-config-rules \
  --configuration-aggregator-name OrganizationAggregator \
  --filters '{
    "ComplianceType": "NON_COMPLIANT"
  }'

# Output:
{
  "AggregateComplianceByConfigRules": [
    {
      "ConfigRuleName": "restricted-ssh",
      "Compliance": {
        "ComplianceType": "NON_COMPLIANT"
      },
      "AccountId": "111111111111",
      "AwsRegion": "us-east-1"
    },
    {
      "ConfigRuleName": "encrypted-volumes",
      "Compliance": {
        "ComplianceType": "NON_COMPLIANT"
      },
      "AccountId": "222222222222",
      "AwsRegion": "us-west-2"
    }
  ]
}

# Shows:
# - Account 111111111111 has SSH open to 0.0.0.0/0
# - Account 222222222222 has unencrypted volumes
```

**Find specific resource across accounts**:
```bash
aws configservice list-aggregate-discovered-resources \
  --configuration-aggregator-name OrganizationAggregator \
  --resource-type AWS::EC2::Instance \
  --filters '{
    "ResourceName": "prod-web-server"
  }'

# Output: All instances named "prod-web-server" across all accounts/regions
{
  "ResourceIdentifiers": [
    {
      "SourceAccountId": "111111111111",
      "SourceRegion": "us-east-1",
      "ResourceId": "i-1234567890abcdef",
      "ResourceType": "AWS::EC2::Instance",
      "ResourceName": "prod-web-server"
    },
    {
      "SourceAccountId": "333333333333",
      "SourceRegion": "eu-west-1",
      "ResourceId": "i-abcdef1234567890",
      "ResourceType": "AWS::EC2::Instance",
      "ResourceName": "prod-web-server"
    }
  ]
}
```

---

## Remediation Actions

### Automatic Remediation

**SSM Automation Document**:
```bash
# Remediation: Disable public access to S3 bucket
aws configservice put-remediation-configurations \
  --remediation-configurations '[{
    "ConfigRuleName": "s3-bucket-public-read-prohibited",
    "TargetType": "SSM_DOCUMENT",
    "TargetIdentifier": "AWS-DisableS3BucketPublicReadWrite",
    "TargetVersion": "1",
    "Parameters": {
      "AutomationAssumeRole": {
        "StaticValue": {
          "Values": ["arn:aws:iam::123456789012:role/ConfigRemediationRole"]
        }
      },
      "S3BucketName": {
        "ResourceValue": {
          "Value": "RESOURCE_ID"
        }
      }
    },
    "ResourceType": "AWS::S3::Bucket",
    "Automatic": true,
    "MaximumAutomaticAttempts": 3,
    "RetryAttemptSeconds": 60
  }]'

# When rule detects public bucket:
# 1. Triggers SSM Automation
# 2. Runs AWS-DisableS3BucketPublicReadWrite
# 3. Removes public access policies
# 4. Re-evaluates compliance
# 5. Retries up to 3 times if fails
```

**Remediation Flow**:
```
Non-Compliant Resource Detected
          ↓
Config Rule Evaluation (NON_COMPLIANT)
          ↓
Automatic Remediation (if enabled)
          ↓
SSM Automation Document Execution
          ↓
Resource Modification
          ↓
Re-Evaluation
          ↓
Compliant ✅ or Manual Review ❌
```

**Custom Remediation** (Lambda):
```python
import boto3

def lambda_handler(event, context):
    """
    Remediate security group with SSH open to 0.0.0.0/0
    Remove 0.0.0.0/0 rule, replace with corporate CIDR
    """
    ec2 = boto3.client('ec2')
    
    # Get security group ID from event
    sg_id = event['ResourceId']
    
    # Get current rules
    sg = ec2.describe_security_groups(GroupIds=[sg_id])['SecurityGroups'][0]
    
    # Find SSH rule allowing 0.0.0.0/0
    for rule in sg['IpPermissions']:
        if rule.get('FromPort') == 22 and rule.get('ToPort') == 22:
            for ip_range in rule.get('IpRanges', []):
                if ip_range['CidrIp'] == '0.0.0.0/0':
                    # Remove public SSH rule
                    ec2.revoke_security_group_ingress(
                        GroupId=sg_id,
                        IpPermissions=[{
                            'FromPort': 22,
                            'ToPort': 22,
                            'IpProtocol': 'tcp',
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }]
                    )
                    
                    # Add corporate CIDR instead
                    ec2.authorize_security_group_ingress(
                        GroupId=sg_id,
                        IpPermissions=[{
                            'FromPort': 22,
                            'ToPort': 22,
                            'IpProtocol': 'tcp',
                            'IpRanges': [{'CidrIp': '10.0.0.0/8', 'Description': 'Corporate network'}]
                        }]
                    )
                    
                    print(f'Remediated {sg_id}: Replaced 0.0.0.0/0 with 10.0.0.0/8')
                    return {'statusCode': 200, 'body': 'Remediated'}
    
    return {'statusCode': 200, 'body': 'No remediation needed'}
```

**Attach Remediation**:
```bash
aws configservice put-remediation-configurations \
  --remediation-configurations '[{
    "ConfigRuleName": "restricted-ssh",
    "TargetType": "SSM_DOCUMENT",
    "TargetIdentifier": "AWS-PublishSNSNotification",
    "TargetVersion": "1",
    "Parameters": {
      "AutomationAssumeRole": {
        "StaticValue": {
          "Values": ["arn:aws:iam::123456789012:role/ConfigRemediationRole"]
        }
      },
      "Message": {
        "StaticValue": {
          "Values": ["Security group with open SSH detected. Remediating..."]
        }
      },
      "TopicArn": {
        "StaticValue": {
          "Values": ["arn:aws:sns:us-east-1:123456789012:security-alerts"]
        }
      }
    },
    "ResourceType": "AWS::EC2::SecurityGroup",
    "Automatic": false,
    "ExecutionControls": {
      "SsmControls": {
        "ConcurrentExecutionRatePercentage": 10,
        "ErrorPercentage": 10
      }
    }
  }]'

# Manual remediation (requires approval)
# Sends SNS notification
# Security team reviews and approves remediation
```

### Remediation Best Practices

```
✅ Do:
- Test remediation in non-prod first
- Start with manual remediation (Automatic: false)
- Use retries (MaximumAutomaticAttempts: 3)
- Monitor remediation failures
- SNS alerts for critical remediations

❌ Don't:
- Auto-remediate production without testing
- Remediate without understanding impact
- Skip retry logic (network issues common)
- Ignore failed remediations

Phased Rollout:
1. Dev: Automatic remediation enabled
2. Staging: Manual remediation (review first)
3. Production: Manual remediation → after 30 days → automatic
```

---

## Advanced Queries

### SQL-Like Queries

**Query Language**:
```sql
-- Find all EC2 instances with public IPs
SELECT
  resourceId,
  resourceType,
  configuration.publicIpAddress,
  configuration.instanceType,
  tags
WHERE
  resourceType = 'AWS::EC2::Instance'
  AND configuration.publicIpAddress IS NOT NULL

-- Find S3 buckets without encryption
SELECT
  resourceId,
  resourceName,
  tags.Environment
WHERE
  resourceType = 'AWS::S3::Bucket'
  AND configuration.serverSideEncryptionConfiguration IS NULL

-- Find security groups allowing 0.0.0.0/0
SELECT
  resourceId,
  resourceName,
  configuration.ipPermissions
WHERE
  resourceType = 'AWS::EC2::SecurityGroup'
  AND configuration.ipPermissions.ipRanges.cidrIp = '0.0.0.0/0'

-- Find untagged resources
SELECT
  resourceId,
  resourceType,
  resourceName
WHERE
  tags.Environment IS NULL
  OR tags.Owner IS NULL
```

**Execute Query** (CLI):
```bash
aws configservice select-resource-config \
  --expression "SELECT resourceId, configuration.publicIpAddress WHERE resourceType = 'AWS::EC2::Instance' AND configuration.publicIpAddress IS NOT NULL"

# Output:
{
  "Results": [
    "{\"resourceId\":\"i-1234567890abcdef\",\"configuration\":{\"publicIpAddress\":\"54.123.45.67\"}}",
    "{\"resourceId\":\"i-abcdef1234567890\",\"configuration\":{\"publicIpAddress\":\"18.234.56.78\"}}"
  ]
}
```

**Aggregated Query** (across accounts):
```bash
aws configservice select-aggregate-resource-config \
  --configuration-aggregator-name OrganizationAggregator \
  --expression "SELECT accountId, awsRegion, resourceId, resourceType WHERE resourceType = 'AWS::EC2::Instance' AND configuration.state.name = 'running'"

# Find all running instances across organization
# Useful for inventory, cost analysis, compliance
```

### Relationship Queries

**Find resources related to EC2 instance**:
```sql
-- Find VPC, subnet, security groups for instance
SELECT
  resourceId,
  relationships
WHERE
  resourceId = 'i-1234567890abcdef'

-- Output includes:
-- - VPC (vpc-abc123)
-- - Subnet (subnet-def456)
-- - Security Groups (sg-ghi789, sg-jkl012)
-- - Network Interfaces (eni-mno345)
-- - Volumes (vol-pqr678)
```

**Find all resources in VPC**:
```sql
SELECT
  resourceId,
  resourceType
WHERE
  relationships.resourceId = 'vpc-abc123'

-- Returns all resources in VPC:
-- - EC2 instances
-- - RDS databases
-- - Load balancers
-- - NAT gateways
-- - etc.
```

---

## Integration & Automation

### EventBridge Integration

**Config Event Pattern**:
```json
{
  "source": ["aws.config"],
  "detail-type": ["Config Rules Compliance Change"],
  "detail": {
    "configRuleName": ["restricted-ssh"],
    "newEvaluationResult": {
      "complianceType": ["NON_COMPLIANT"]
    }
  }
}

# Triggers when restricted-ssh rule becomes non-compliant
# Actions:
# - Lambda (auto-remediation)
# - SNS (alert security team)
# - Step Functions (workflow)
```

**EventBridge Rule**:
```bash
aws events put-rule \
  --name ConfigNonCompliantAlert \
  --event-pattern '{
    "source": ["aws.config"],
    "detail-type": ["Config Rules Compliance Change"],
    "detail": {
      "newEvaluationResult": {
        "complianceType": ["NON_COMPLIANT"]
      }
    }
  }'

# Add SNS target
aws events put-targets \
  --rule ConfigNonCompliantAlert \
  --targets "Id"="1","Arn"="arn:aws:sns:us-east-1:123456789012:security-alerts"

# Now any non-compliant resource triggers SNS notification
```

### Security Hub Integration

**Findings Export**:
```bash
# Config sends findings to Security Hub
# Consolidated security view

aws securityhub get-findings \
  --filters '{
    "ProductName": [{"Value": "Config", "Comparison": "EQUALS"}],
    "ComplianceStatus": [{"Value": "FAILED", "Comparison": "EQUALS"}]
  }'

# Output: All Config non-compliant findings
{
  "Findings": [
    {
      "ProductArn": "arn:aws:securityhub:us-east-1::product/aws/config",
      "Title": "restricted-ssh",
      "Description": "Security group sg-123 allows SSH from 0.0.0.0/0",
      "Severity": {
        "Label": "HIGH"
      },
      "Compliance": {
        "Status": "FAILED"
      },
      "Resources": [{
        "Type": "AwsEc2SecurityGroup",
        "Id": "sg-1234567890abcdef"
      }]
    }
  ]
}
```

---

## Interview Questions

### Q1: Explain the difference between AWS Config and CloudTrail. When would you use each?

**Answer**:

**CloudTrail**:
```
Focus: WHO did WHAT, WHEN
Logs: API call history
Example questions:
- Who deleted the S3 bucket? (UserIdentity: john.doe, EventTime: 2026-01-31T10:00:00Z)
- When was the security group modified?
- What API calls did user make?

Use cases:
✅ Security forensics
✅ Audit trail
✅ Compliance (track actions)
✅ Troubleshooting (what API call failed?)
```

**AWS Config**:
```
Focus: WHAT is the current/past STATE
Logs: Resource configuration snapshots
Example questions:
- Which security groups allow SSH from 0.0.0.0/0?
- What resources are unencrypted?
- How many instances have public IPs?
- What was the security group configuration yesterday?

Use cases:
✅ Compliance evaluation (is resource configured correctly?)
✅ Change management (what changed before outage?)
✅ Resource inventory (what resources exist?)
✅ Remediation (fix non-compliant resources)
```

**Together**:
```
Scenario: Security group allows 0.0.0.0/0 on port 22

Config answers:
- WHAT security groups are non-compliant? (sg-123, sg-456)
- WHEN did sg-123 become non-compliant? (2026-01-30T15:00:00Z)
- WHAT was the previous configuration? (allowed 10.0.0.0/8)

CloudTrail answers:
- WHO made the change? (john.doe)
- WHAT API call? (AuthorizeSecurityGroupIngress)
- FROM WHERE? (IP: 203.0.113.1, User-Agent: AWS CLI)

Both needed:
Config: Detect violation
CloudTrail: Investigate who/why
```

**Decision Tree**:
```
Question: "Who launched this EC2 instance?"
Answer: CloudTrail (RunInstances API call, UserIdentity)

Question: "Which EC2 instances have public IPs?"
Answer: Config (query configuration, publicIpAddress IS NOT NULL)

Question: "Are all S3 buckets encrypted?"
Answer: Config (rule evaluation, compliance dashboard)

Question: "Who modified the IAM policy last week?"
Answer: CloudTrail (PutUserPolicy API call, time range filter)
```

### Q2: How would you implement organization-wide compliance for CIS AWS Foundations Benchmark using AWS Config?

**Answer**:

**Architecture**:
```
Management Account (123456789012)
├── Enable AWS Config in Organizations
├── Delegate admin to Security Account (555555555555)
└── Deploy conformance pack to all accounts

Security Account (555555555555) - Delegated Admin
├── Configuration Aggregator (collects data from all accounts)
├── Organization Conformance Pack (CIS Benchmark)
├── Compliance Dashboard
└── Automated Remediation

Member Accounts (100+ accounts)
├── Config Recorder (auto-enabled)
├── CIS rules (auto-deployed)
├── Delivery channel → Organization S3 bucket
└── Remediation actions
```

**Step-by-Step Implementation**:

**Step 1: Enable Config in Organization** (Management Account):
```bash
# Enable AWS Config service access
aws organizations enable-aws-service-access \
  --service-principal config.amazonaws.com

aws organizations enable-aws-service-access \
  --service-principal config-multiaccountsetup.amazonaws.com

# Delegate admin to Security Account
aws organizations register-delegated-administrator \
  --account-id 555555555555 \
  --service-principal config.amazonaws.com
```

**Step 2: Create Aggregator** (Security Account):
```bash
# Aggregator collects data from all accounts/regions
aws configservice put-configuration-aggregator \
  --configuration-aggregator-name OrgConfigAggregator \
  --organization-aggregation-source '{
    "RoleArn": "arn:aws:iam::555555555555:role/aws-service-role/organizations.amazonaws.com/AWSServiceRoleForOrganizations",
    "AwsRegions": ["us-east-1", "us-west-2", "eu-west-1"],
    "AllAwsRegions": false
  }'
```

**Step 3: Deploy CIS Conformance Pack** (Security Account):
```bash
# Deploy CIS Benchmark to all accounts
aws configservice put-organization-conformance-pack \
  --organization-conformance-pack-name CIS-AWS-Foundations-Benchmark \
  --template-s3-uri s3://aws-configservice-conformance-packs-us-east-1/CISAWSFoundationsBenchmark.yaml \
  --delivery-s3-bucket org-config-conformance-packs \
  --excluded-accounts 999999999999  # Exclude sandbox account

# Pack includes 28 rules:
# CIS 1.1: Root account MFA enabled
# CIS 1.4: Access keys rotated every 90 days
# CIS 2.1: CloudTrail enabled in all regions
# CIS 2.3: S3 bucket logging enabled
# CIS 2.6: S3 bucket public access prohibited
# CIS 3.1: VPC flow logs enabled
# CIS 4.1: Security groups no unrestricted access (0.0.0.0/0)
# ... 21 more rules
```

**Step 4: Enable Automated Remediation** (Security Account):
```yaml
# remediation-actions.yaml
Resources:
  # CIS 1.1: Enable root MFA (manual - cannot automate)
  RootMFARemediationSNS:
    Type: AWS::Config::RemediationConfiguration
    Properties:
      ConfigRuleName: cis-1.1-root-account-mfa-enabled
      TargetType: SSM_DOCUMENT
      TargetIdentifier: AWS-PublishSNSNotification
      Automatic: true
      Parameters:
        TopicArn:
          StaticValue:
            Values:
              - arn:aws:sns:us-east-1:555555555555:security-critical
        Message:
          StaticValue:
            Values:
              - "CRITICAL: Root account MFA not enabled in account ${AccountId}"
  
  # CIS 2.1: Enable CloudTrail
  EnableCloudTrailRemediation:
    Type: AWS::Config::RemediationConfiguration
    Properties:
      ConfigRuleName: cis-2.1-cloudtrail-enabled
      TargetType: SSM_DOCUMENT
      TargetIdentifier: AWS-EnableCloudTrail
      Automatic: true
      MaximumAutomaticAttempts: 3
      Parameters:
        AutomationAssumeRole:
          StaticValue:
            Values:
              - arn:aws:iam::${AccountId}:role/ConfigRemediationRole
  
  # CIS 2.6: Block S3 public access
  BlockS3PublicAccessRemediation:
    Type: AWS::Config::RemediationConfiguration
    Properties:
      ConfigRuleName: cis-2.6-s3-bucket-public-read-prohibited
      TargetType: SSM_DOCUMENT
      TargetIdentifier: AWS-DisableS3BucketPublicReadWrite
      Automatic: true
      Parameters:
        AutomationAssumeRole:
          StaticValue:
            Values:
              - arn:aws:iam::${AccountId}:role/ConfigRemediationRole
        S3BucketName:
          ResourceValue:
            Value: RESOURCE_ID
  
  # CIS 3.1: Enable VPC flow logs
  EnableVPCFlowLogsRemediation:
    Type: AWS::Config::RemediationConfiguration
    Properties:
      ConfigRuleName: cis-3.1-vpc-flow-logs-enabled
      TargetType: SSM_DOCUMENT
      TargetIdentifier: Custom-EnableVPCFlowLogs
      Automatic: true

# Deploy remediations
aws configservice put-organization-conformance-pack \
  --organization-conformance-pack-name CIS-Remediation \
  --template-body file://remediation-actions.yaml
```

**Step 5: Compliance Dashboard** (Security Account):
```bash
# View organization-wide compliance
aws configservice get-organization-conformance-pack-detailed-status \
  --organization-conformance-pack-name CIS-AWS-Foundations-Benchmark

# Output: Compliance per account
{
  "OrganizationConformancePackDetailedStatuses": [
    {
      "AccountId": "111111111111",
      "ConformancePackName": "CIS-AWS-Foundations-Benchmark",
      "Status": "CREATE_SUCCESSFUL",
      "LastUpdateTime": "2026-01-31T10:00:00Z"
    },
    {
      "AccountId": "222222222222",
      "ConformancePackName": "CIS-AWS-Foundations-Benchmark",
      "Status": "CREATE_SUCCESSFUL"
    }
  ]
}

# Compliance summary
aws configservice describe-aggregate-compliance-by-conformance-packs \
  --configuration-aggregator-name OrgConfigAggregator \
  --conformance-pack-name CIS-AWS-Foundations-Benchmark

# Output:
{
  "AggregateComplianceByConformancePacks": [
    {
      "ConformancePackName": "CIS-AWS-Foundations-Benchmark",
      "Compliance": {
        "ComplianceType": "NON_COMPLIANT",
        "ComplianceContributorCount": {
          "CappedCount": 15,
          "CapExceeded": false
        }
      },
      "AccountId": "111111111111",
      "AwsRegion": "us-east-1"
    }
  ]
}

# 15 non-compliant controls in account 111111111111
```

**Step 6: Alerting** (Security Account):
```bash
# EventBridge rule: CIS compliance change → SNS
aws events put-rule \
  --name CISComplianceChange \
  --event-pattern '{
    "source": ["aws.config"],
    "detail-type": ["Config Rules Compliance Change"],
    "detail": {
      "configRuleName": [{
        "prefix": "cis-"
      }],
      "newEvaluationResult": {
        "complianceType": ["NON_COMPLIANT"]
      }
    }
  }'

aws events put-targets \
  --rule CISComplianceChange \
  --targets "Id"="1","Arn"="arn:aws:sns:us-east-1:555555555555:cis-compliance-alerts"

# Lambda function: Daily compliance report
def lambda_handler(event, context):
    config = boto3.client('configservice')
    
    # Get organization-wide compliance
    compliance = config.describe_aggregate_compliance_by-conformance_packs(
        ConfigurationAggregatorName='OrgConfigAggregator',
        ConformancePackName='CIS-AWS-Foundations-Benchmark'
    )
    
    # Generate report
    total_accounts = len(compliance['AggregateComplianceByConformancePacks'])
    non_compliant = [c for c in compliance['AggregateComplianceByConformancePacks']
                     if c['Compliance']['ComplianceType'] == 'NON_COMPLIANT']
    
    report = f"""
    CIS Compliance Report - {datetime.now().strftime('%Y-%m-%d')}
    
    Total Accounts: {total_accounts}
    Non-Compliant Accounts: {len(non_compliant)}
    Compliance Rate: {(1 - len(non_compliant)/total_accounts) * 100:.1f}%
    
    Non-Compliant Accounts:
    """
    
    for account in non_compliant:
        report += f"\n- Account {account['AccountId']}: {account['Compliance']['ComplianceContributorCount']['CappedCount']} violations"
    
    # Send to SNS
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:555555555555:daily-compliance-report',
        Subject='CIS Compliance Daily Report',
        Message=report
    )
```

**Result**:
```
100+ accounts automatically compliant with CIS Benchmark:
- Automated deployment (no manual setup per account)
- Continuous compliance monitoring (28 rules)
- Automated remediation (18 rules with auto-fix)
- Aggregated dashboard (single pane of glass)
- Real-time alerts (non-compliance detected within minutes)
- Daily compliance reports (accountability)

Cost: $10/pack/region × 3 regions = $30/month per account
100 accounts × $30 = $3,000/month
vs. manual compliance audits: $100K+/year
```

### Q3: Describe how you would use AWS Config Advanced Queries to find security vulnerabilities across a multi-account environment.

**Answer**:

**Scenario**: Security audit across 50 accounts, 5 regions, 10,000+ resources

**Query 1: Find EC2 instances with public IPs**:
```sql
SELECT
  accountId,
  awsRegion,
  resourceId,
  configuration.instanceType,
  configuration.publicIpAddress,
  tags.Environment,
  tags.Owner
WHERE
  resourceType = 'AWS::EC2::Instance'
  AND configuration.publicIpAddress IS NOT NULL
ORDER BY accountId, awsRegion
```

**Execute**:
```bash
aws configservice select-aggregate-resource-config \
  --configuration-aggregator-name OrgAggregator \
  --expression file://query1.sql \
  --max-results 100

# Output: 47 instances with public IPs across 50 accounts
# Action: Review if public IPs necessary, migrate to private subnets + NAT
```

**Query 2: Find security groups allowing 0.0.0.0/0**:
```sql
SELECT
  accountId,
  awsRegion,
  resourceId,
  resourceName,
  configuration.ipPermissions.fromPort,
  configuration.ipPermissions.toPort,
  configuration.ipPermissions.ipRanges.cidrIp
WHERE
  resourceType = 'AWS::EC2::SecurityGroup'
  AND configuration.ipPermissions.ipRanges.cidrIp = '0.0.0.0/0'
```

**Output**:
```json
[
  {
    "accountId": "111111111111",
    "awsRegion": "us-east-1",
    "resourceId": "sg-123",
    "resourceName": "web-server-sg",
    "fromPort": 80,
    "toPort": 80,
    "cidrIp": "0.0.0.0/0"  ← OK (HTTP)
  },
  {
    "accountId": "222222222222",
    "awsRegion": "us-west-2",
    "resourceId": "sg-456",
    "fromPort": 22,
    "toPort": 22,
    "cidrIp": "0.0.0.0/0"  ← VIOLATION (SSH)
  },
  {
    "accountId": "333333333333",
    "awsRegion": "eu-west-1",
    "resourceId": "sg-789",
    "fromPort": 3306,
    "toPort": 3306,
    "cidrIp": "0.0.0.0/0"  ← CRITICAL (MySQL)
  }
]

# Action: Auto-remediate SSH/MySQL, restrict to corporate CIDR
```

**Query 3: Find unencrypted resources**:
```sql
-- Unencrypted EBS volumes
SELECT
  accountId,
  awsRegion,
  resourceId,
  configuration.encrypted,
  configuration.size,
  tags.Environment
WHERE
  resourceType = 'AWS::EC2::Volume'
  AND configuration.encrypted = false

UNION

-- Unencrypted RDS databases
SELECT
  accountId,
  awsRegion,
  resourceId,
  configuration.storageEncrypted,
  configuration.dbInstanceClass,
  tags.Environment
WHERE
  resourceType = 'AWS::RDS::DBInstance'
  AND configuration.storageEncrypted = false

UNION

-- Unencrypted S3 buckets
SELECT
  accountId,
  awsRegion,
  resourceId,
  configuration.serverSideEncryptionConfiguration
WHERE
  resourceType = 'AWS::S3::Bucket'
  AND configuration.serverSideEncryptionConfiguration IS NULL
```

**Output**: 237 unencrypted resources
```
- 189 EBS volumes (5.2 TB total)
- 12 RDS databases
- 36 S3 buckets
```

**Query 4: Find IAM users with access keys older than 90 days**:
```sql
SELECT
  accountId,
  resourceId,
  configuration.userName,
  configuration.accessKeys.createDate,
  configuration.accessKeys.status
WHERE
  resourceType = 'AWS::IAM::User'
  AND configuration.accessKeys.status = 'Active'
  AND configuration.accessKeys.createDate < DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
```

**Query 5: Find resources without required tags**:
```sql
SELECT
  accountId,
  awsRegion,
  resourceType,
  resourceId,
  tags
WHERE
  resourceType IN (
    'AWS::EC2::Instance',
    'AWS::RDS::DBInstance',
    'AWS::S3::Bucket'
  )
  AND (
    tags.Environment IS NULL
    OR tags.Owner IS NULL
    OR tags.CostCenter IS NULL
  )
```

**Output**: 412 resources missing tags
```
Action: Automated tagging Lambda
- Infer Environment from account (prod account → prod tag)
- Infer Owner from creator (CloudTrail lookup)
- Require CostCenter tag on creation (Service Control Policy)
```

**Query 6: Find relationships (blast radius analysis)**:
```sql
-- Find all resources in VPC vpc-123
SELECT
  resourceType,
  resourceId,
  relationships.resourceId
WHERE
  relationships.resourceType = 'AWS::EC2::VPC'
  AND relationships.resourceId = 'vpc-123'
GROUP BY resourceType
```

**Output**:
```
AWS::EC2::Instance: 15 instances
AWS::RDS::DBInstance: 3 databases
AWS::ElasticLoadBalancingV2::LoadBalancer: 2 load balancers
AWS::EC2::NatGateway: 3 NAT gateways
AWS::Lambda::Function: 8 functions

Blast radius: Deleting vpc-123 affects 31 resources
```

**Automation**:
```python
import boto3

config = boto3.client('configservice')

# Execute all security queries
queries = [
    ('public-ips', 'SELECT...'),
    ('open-security-groups', 'SELECT...'),
    ('unencrypted-resources', 'SELECT...'),
    ('old-access-keys', 'SELECT...'),
    ('missing-tags', 'SELECT...')
]

results = {}
for name, sql in queries:
    response = config.select_aggregate_resource_config(
        Expression=sql,
        ConfigurationAggregatorName='OrgAggregator',
        MaxResults=1000
    )
    results[name] = len(response['Results'])

# Generate security report
print(f"""
Security Audit Report - {datetime.now()}

EC2 instances with public IPs: {results['public-ips']}
Security groups allowing 0.0.0.0/0: {results['open-security-groups']}
Unencrypted resources: {results['unencrypted-resources']}
IAM keys older than 90 days: {results['old-access-keys']}
Resources missing tags: {results['missing-tags']}

Total vulnerabilities: {sum(results.values())}
""")

# Auto-remediate critical issues
if results['open-security-groups'] > 0:
    # Trigger remediation Lambda
    lambda_client.invoke(
        FunctionName='RemediateOpenSecurityGroups',
        InvocationType='Event'
    )
```

**Result**:
```
Single query finds vulnerabilities across:
- 50 accounts
- 5 regions
- 10,000+ resources
- In <5 seconds

vs. manual audit:
- 50 accounts × 30 min = 25 hours
- Error-prone (miss resources)
- Point-in-time (stale immediately)
```

### Q4: How would you implement automated compliance remediation for a fleet of 5000 EC2 instances using AWS Config?

**Answer**:

**Scenario**: 5000 EC2 instances, enforce security baseline

**Security Requirements**:
```
1. All instances must use approved AMIs (golden AMIs only)
2. IMDSv2 required (no IMDSv1)
3. EBS encryption enabled
4. CloudWatch detailed monitoring enabled
5. SSM Agent installed and running
6. Instance must be in private subnet (no public IP)
7. Security groups cannot allow 0.0.0.0/0 (except HTTP/HTTPS)
```

**Implementation**:

**Step 1: Create Config Rules**:
```yaml
# compliance-rules.yaml
Resources:
  ApprovedAMIRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: approved-ami-only
      Description: Instances must use golden AMIs
      Source:
        Owner: CUSTOM_LAMBDA
        SourceIdentifier: arn:aws:lambda:us-east-1:123:function:CheckApprovedAMI
        SourceDetails:
          - EventSource: aws.config
            MessageType: ConfigurationItemChangeNotification
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Instance
  
  IMDSv2Rule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: imdsv2-required
      Source:
        Owner: AWS
        SourceIdentifier: EC2_IMDSV2_CHECK
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Instance
  
  EBSEncryptionRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: ebs-encryption-required
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Volume
  
  DetailedMonitoringRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: detailed-monitoring-required
      Source:
        Owner: AWS
        SourceIdentifier: EC2_INSTANCE_DETAILED_MONITORING_ENABLED
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Instance
  
  SSMAgentRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: ssm-agent-required
      Source:
        Owner: AWS
        SourceIdentifier: EC2_INSTANCE_MANAGED_BY_SSM
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Instance
  
  PrivateSubnetRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: private-subnet-only
      Source:
        Owner: AWS
        SourceIdentifier: EC2_INSTANCE_NO_PUBLIC_IP
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Instance
```

**Step 2: Automated Remediation**:

**Remediation 1: Terminate non-approved AMI** (critical):
```python
# remediate-unapproved-ami.py
import boto3

def lambda_handler(event, context):
    """
    Terminate instance using non-approved AMI
    Send alert to security team
    """
    ec2 = boto3.client('ec2')
    sns = boto3.client('sns')
    
    instance_id = event['ResourceId']
    
    # Get instance details
    instance = ec2.describe_instances(InstanceIds=[instance_id])['Reservations'][0]['Instances'][0]
    ami_id = instance['ImageId']
    owner = instance['Tags'].get('Owner', 'unknown')
    
    # Alert before termination
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123:security-critical',
        Subject=f'CRITICAL: Terminating instance {instance_id} - unapproved AMI',
        Message=f"""
Instance {instance_id} is using unapproved AMI {ami_id}.

Owner: {owner}
Action: Instance will be terminated in 5 minutes.
Reason: Security policy violation.

Approved AMIs:
- ami-abc123 (amazon-linux-2023-golden-v1)
- ami-def456 (ubuntu-22.04-golden-v1)

Contact security team for exceptions.
        """
    )
    
    # Wait 5 minutes (grace period)
    time.sleep(300)
    
    # Terminate instance
    ec2.terminate_instances(InstanceIds=[instance_id])
    
    return {'statusCode': 200, 'body': f'Terminated {instance_id}'}
```

**Remediation 2: Enable IMDSv2** (automatic):
```bash
# SSM Automation document
aws configservice put-remediation-configurations \
  --remediation-configurations '[{
    "ConfigRuleName": "imdsv2-required",
    "TargetType": "SSM_DOCUMENT",
    "TargetIdentifier": "AWS-EnableIMDSv2",
    "TargetVersion": "1",
    "Parameters": {
      "AutomationAssumeRole": {
        "StaticValue": {
          "Values": ["arn:aws:iam::123:role/ConfigRemediationRole"]
        }
      },
      "InstanceId": {
        "ResourceValue": {
          "Value": "RESOURCE_ID"
        }
      }
    },
    "Automatic": true,
    "MaximumAutomaticAttempts": 3,
    "RetryAttemptSeconds": 60
  }]'

# Automatically modifies instance metadata options
# No downtime (hot configuration change)
```

**Remediation 3: Enable EBS encryption** (prevent new volumes):
```bash
# Enable encryption-by-default (account-level)
aws configservice put-remediation-configurations \
  --remediation-configurations '[{
    "ConfigRuleName": "ebs-encryption-required",
    "TargetType": "SSM_DOCUMENT",
    "TargetIdentifier": "AWS-EnableEBSEncryptionByDefault",
    "Automatic": true
  }]'

# Future volumes automatically encrypted
# Existing volumes: Migration required (manual)
```

**Remediation 4: Enable detailed monitoring**:
```python
# remediate-detailed-monitoring.py
def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    instance_id = event['ResourceId']
    
    # Enable detailed monitoring
    ec2.monitor_instances(InstanceIds=[instance_id])
    
    # Cost impact: $0.14/instance/month × 5000 = $700/month
    # Justification: Better troubleshooting, faster detection
    
    return {'statusCode': 200}
```

**Remediation 5: Install SSM Agent** (State Manager):
```bash
# State Manager association: Install SSM Agent
aws ssm create-association \
  --name "AWS-ConfigureAWSPackage" \
  --targets "Key=tag:ComplianceRequired,Values=true" \
  --parameters "action=Install,name=AmazonSSMAgent" \
  --schedule-expression "rate(1 day)"

# Checks daily, installs if missing
```

**Remediation 6: Public IP violation** (alert, manual review):
```python
# remediate-public-ip.py
def lambda_handler(event, context):
    """
    Alert on public IP (cannot remove without stopping instance)
    Create ticket for remediation
    """
    instance_id = event['ResourceId']
    
    # Create Jira ticket
    jira.create_issue(
        project='SECURITY',
        summary=f'Instance {instance_id} has public IP',
        description=f'Migrate {instance_id} to private subnet',
        priority='High'
    )
    
    # Alert ops team
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123:ops-team',
        Subject=f'Action Required: Instance {instance_id} public IP',
        Message='Manual remediation required. See Jira ticket.'
    )
```

**Step 3: Compliance Monitoring**:
```bash
# Dashboard query: Overall compliance
aws configservice describe-compliance-by-config-rule

# Output:
{
  "ComplianceByConfigRules": [
    {
      "ConfigRuleName": "approved-ami-only",
      "Compliance": {
        "ComplianceType": "COMPLIANT",
        "ComplianceContributorCount": {
          "CappedCount": 5000,
          "CapExceeded": false
        }
      }
    },
    {
      "ConfigRuleName": "imdsv2-required",
      "Compliance": {
        "ComplianceType": "NON_COMPLIANT",
        "ComplianceContributorCount": {
          "CappedCount": 47,  ← 47 instances non-compliant
          "CapExceeded": false
        }
      }
    }
  ]
}

# 4953/5000 = 99.06% compliant (IMDSv2)
# Auto-remediation in progress for 47 instances
```

**Step 4: Preventive Controls** (Service Control Policy):
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Action": "ec2:RunInstances",
    "Resource": "arn:aws:ec2:*:*:instance/*",
    "Condition": {
      "StringNotEquals": {
        "ec2:ImageId": [
          "ami-abc123",  // approved AMIs only
          "ami-def456"
        ]
      }
    }
  }]
}

# Prevents non-compliant instances at creation time
# Config handles remediation for existing resources
```

**Result**:
```
5000 instances automatically compliant:
- Continuous monitoring (7 rules)
- Automated remediation (5 rules auto-fix, 2 alert)
- 99%+ compliance rate
- Violations detected within 5 minutes
- Remediation within 10 minutes (IMDSv2, monitoring)
- Critical violations (unapproved AMI): Terminated within 5 min

Cost:
- Config recording: 5000 instances × $0.003/change × 10 changes/month = $150
- Rule evaluations: 7 rules × 5000 instances × 2 evals/day × 30 days = 2.1M evals
  = 100K × $0.001 + 2M × $0.0008 = $1,700
- Total: $1,850/month

vs. manual compliance:
- 5000 instances / 100 per day = 50 days per audit
- Quarterly audits = impossible to keep current
- Violations undetected for months
```

### Q5: Explain how AWS Config Aggregators work in a multi-region, multi-account setup. How would you design a centralized compliance dashboard?

**Answer**:

**Aggregator Architecture**:
```
Organization (1000 accounts, 6 regions)
          ↓
Management Account (123456789012)
├── Enable AWS Config
├── Delegate admin → Security Account (555555555555)
└── All accounts auto-enrolled

Security Account (555555555555) - Delegated Admin
├── Configuration Aggregator
│   ├── Collects data from 1000 accounts × 6 regions
│   ├── Updates every 12 hours
│   └── Stores in centralized view (queryable)
├── Compliance Dashboard (QuickSight)
├── Advanced Queries (SQL)
└── Alerting (EventBridge → SNS/Lambda)

Member Accounts (1000 accounts)
├── Config Recorder (per region)
│   ├── us-east-1 → Records configuration
│   ├── us-west-2 → Records configuration
│   ├── eu-west-1 → Records configuration
│   └── ap-southeast-1 → Records configuration
├── Delivery Channel → Org S3 bucket
└── Authorization automatic (via Organizations)
```

**Implementation**:

**Step 1: Create Aggregator** (Security Account):
```bash
aws configservice put-configuration-aggregator \
  --configuration-aggregator-name OrgAggregator \
  --organization-aggregation-source '{
    "RoleArn": "arn:aws:iam::555555555555:role/aws-service-role/organizations.amazonaws.com/AWSServiceRoleForOrganizations",
    "AwsRegions": [
      "us-east-1",
      "us-west-2",
      "eu-west-1",
      "eu-central-1",
      "ap-southeast-1",
      "ap-northeast-1"
    ],
    "AllAwsRegions": false
  }'

# Aggregates:
# - 1000 accounts
# - 6 regions
# - Total: 6000 data sources
# - Updates: Every 12 hours (automatic)
```

**Step 2: Compliance Dashboard** (QuickSight):

**Data Source** (Athena):
```sql
-- Create Athena database
CREATE EXTERNAL TABLE config_compliance (
  accountid STRING,
  awsregion STRING,
  configrulename STRING,
  resourcetype STRING,
  resourceid STRING,
  compliancetype STRING,
  annotation STRING,
  configruleinvokedtime TIMESTAMP
)
STORED AS PARQUET
LOCATION 's3://config-aggregator-bucket/AWSLogs/'

-- Query: Overall compliance rate
SELECT
  compliancetype,
  COUNT(*) as count
FROM config_compliance
WHERE configruleinvokedtime >= CURRENT_DATE - INTERVAL '1' DAY
GROUP BY compliancetype

-- Output:
-- COMPLIANT: 487,523
-- NON_COMPLIANT: 12,477
-- Compliance rate: 97.5%

-- Query: Compliance by account
SELECT
  accountid,
  COUNT(*) as total_resources,
  SUM(CASE WHEN compliancetype = 'COMPLIANT' THEN 1 ELSE 0 END) as compliant,
  SUM(CASE WHEN compliancetype = 'NON_COMPLIANT' THEN 1 ELSE 0 END) as non_compliant,
  CAST(SUM(CASE WHEN compliancetype = 'COMPLIANT' THEN 1 ELSE 0 END) AS DOUBLE) / COUNT(*) * 100 as compliance_rate
FROM config_compliance
WHERE configruleinvokedtime >= CURRENT_DATE - INTERVAL '1' DAY
GROUP BY accountid
ORDER BY compliance_rate ASC
LIMIT 10

-- Output: Bottom 10 accounts
-- 777777777777: 82.3% (worst)
-- 888888888888: 89.1%
-- ...
-- 999999999999: 94.2%

-- Query: Compliance by rule
SELECT
  configrulename,
  COUNT(*) as evaluations,
  SUM(CASE WHEN compliancetype = 'NON_COMPLIANT' THEN 1 ELSE 0 END) as violations
FROM config_compliance
WHERE configruleinvokedtime >= CURRENT_DATE - INTERVAL '1' DAY
GROUP BY configrulename
ORDER BY violations DESC
LIMIT 10

-- Output: Top violators
-- restricted-ssh: 3,412 violations (most common)
-- required-tags: 2,987 violations
-- encrypted-volumes: 1,543 violations
```

**QuickSight Dashboard**:
```
Dashboard: Organization Compliance Overview

Metric Cards:
┌──────────────────┬──────────────────┬──────────────────┐
│ Compliance Rate  │ Non-Compliant    │ Accounts         │
│                  │ Resources        │                  │
│     97.5%        │    12,477        │     1000         │
└──────────────────┴──────────────────┴──────────────────┘

Charts:
┌─────────────────────────────────────────────────────────┐
│ Compliance Trend (30 days)                              │
│ Line chart: compliance rate over time                   │
│ Shows improvement from 94.2% → 97.5%                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Top Non-Compliant Rules                                 │
│ Bar chart:                                              │
│ - restricted-ssh: 3,412                                 │
│ - required-tags: 2,987                                  │
│ - encrypted-volumes: 1,543                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Compliance by Account (Heat Map)                        │
│ Color-coded:                                            │
│ - Green: >95% compliant                                 │
│ - Yellow: 90-95% compliant                              │
│ - Red: <90% compliant                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Compliance by Region (Pie Chart)                        │
│ - us-east-1: 98.2%                                      │
│ - us-west-2: 97.8%                                      │
│ - eu-west-1: 96.5%                                      │
│ - ap-southeast-1: 95.1% ← Needs attention               │
└─────────────────────────────────────────────────────────┘

Drill-down:
Click account → See non-compliant resources
Click rule → See violating resources across org
Click region → See regional compliance details
```

**Step 3: Real-Time Alerts** (EventBridge):
```bash
# Rule: Critical compliance violation
aws events put-rule \
  --name CriticalComplianceViolation \
  --event-pattern '{
    "source": ["aws.config"],
    "detail-type": ["Config Rules Compliance Change"],
    "detail": {
      "configRuleName": [
        "root-account-mfa-enabled",
        "restricted-ssh",
        "s3-bucket-public-read-prohibited"
      ],
      "newEvaluationResult": {
        "complianceType": ["NON_COMPLIANT"]
      }
    }
  }'

# Target: SNS + PagerDuty
aws events put-targets \
  --rule CriticalComplianceViolation \
  --targets \
    "Id"="1","Arn"="arn:aws:sns:us-east-1:555:security-critical" \
    "Id"="2","Arn"="arn:aws:events:us-east-1:555:destination/pagerduty"

# Lambda: Enrich alert with context
def lambda_handler(event, context):
    config = boto3.client('configservice')
    
    account_id = event['detail']['accountId']
    resource_id = event['detail']['resourceId']
    rule_name = event['detail']['configRuleName']
    
    # Get resource configuration
    resource = config.get_aggregate_resource_config(
        ConfigurationAggregatorName='OrgAggregator',
        ResourceIdentifier={
            'SourceAccountId': account_id,
            'SourceRegion': event['region'],
            'ResourceId': resource_id,
            'ResourceType': event['detail']['resourceType']
        }
    )
    
    # Get account owner (from Organizations)
    orgs = boto3.client('organizations')
    account = orgs.describe_account(AccountId=account_id)
    owner_email = account['Account']['Email']
    
    # Enrich alert
    message = f"""
CRITICAL COMPLIANCE VIOLATION

Rule: {rule_name}
Account: {account_id} ({account['Account']['Name']})
Owner: {owner_email}
Resource: {resource_id}
Region: {event['region']}

Configuration:
{json.dumps(resource['ConfigurationItem']['configuration'], indent=2)}

Action Required: Remediate within 1 hour per security policy.
    """
    
    # Send enriched alert
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:555:security-critical',
        Subject=f'CRITICAL: {rule_name} violation in {account_id}',
        Message=message
    )
    
    # Create Jira ticket
    jira.create_issue(
        project='SECURITY',
        issuetype='Incident',
        summary=f'{rule_name} violation - {account_id}',
        description=message,
        priority='Critical',
        assignee=get_account_owner(account_id)
    )
```

**Step 4: Advanced Queries** (aggregated):
```bash
# Find all non-compliant resources across organization
aws configservice select-aggregate-resource-config \
  --configuration-aggregator-name OrgAggregator \
  --expression "
    SELECT
      accountId,
      awsRegion,
      resourceType,
      resourceId,
      configRuleName,
      complianceType
    WHERE
      complianceType = 'NON_COMPLIANT'
    ORDER BY
      accountId, awsRegion
  " \
  --max-results 1000

# Export to CSV for reporting
aws configservice select-aggregate-resource-config \
  --configuration-aggregator-name OrgAggregator \
  --expression "SELECT..." \
  | jq -r '.Results[] | @csv' > compliance-violations.csv

# Email to leadership
mail -s "Weekly Compliance Report" leadership@company.com < compliance-violations.csv
```

**Result**:
```
Centralized compliance dashboard:
✅ Single view across 1000 accounts, 6 regions
✅ Real-time compliance metrics (97.5%)
✅ Drill-down capability (account → resource)
✅ Automated alerting (critical violations)
✅ Trend analysis (improvement over time)
✅ Compliance reporting (weekly/monthly)
✅ Cost: $10K/month Config + $50/month QuickSight
✅ vs. manual audits: $500K+/year

Security benefits:
- Detect violations within minutes
- Auto-remediate 80% of issues
- Compliance rate improved 94% → 97.5%
- Zero missed audits (continuous monitoring)
- Accountability (owner assignment automatic)
```

---

This comprehensive AWS Config guide covers all capabilities needed for SAP-C02 certification with production-ready examples, multi-account architectures, and real-world compliance scenarios!