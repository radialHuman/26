# AWS Organizations

## What is AWS Organizations?

AWS Organizations is an account management service that enables you to consolidate multiple AWS accounts into an organization that you create and centrally manage. It provides policy-based management for multiple AWS accounts, allowing you to create groups of accounts and apply policies to those groups. Think of it as enterprise-level AWS account governance.

## Why Use AWS Organizations?

### Key Benefits
- **Centralized Management**: Manage hundreds of AWS accounts from one place
- **Consolidated Billing**: Single payment method for all accounts
- **Cost Savings**: Volume discounts, Reserved Instance sharing
- **Policy-Based Governance**: Service Control Policies (SCPs)
- **Security**: Preventive guardrails, audit controls
- **Automated Account Creation**: AWS Account Factory pattern
- **Resource Sharing**: Share resources across accounts (RAM)

### Use Cases
- Multi-account strategy implementation
- Environment separation (dev, test, prod)
- Business unit isolation
- Centralized security and compliance
- Cost allocation and chargeback
- Regulatory compliance (data isolation)
- Merger and acquisition integration

## How Organizations Works

### Organization Structure

```
Root (Management Account)
  └── Organizational Units (OUs)
      ├── Production OU
      │   ├── Account: prod-app-1
      │   ├── Account: prod-app-2
      │   └── Account: prod-database
      ├── Development OU
      │   ├── Account: dev-app-1
      │   └── Account: dev-app-2
      ├── Security OU
      │   ├── Account: logging
      │   ├── Account: security
      │   └── Account: audit
      └── Sandbox OU
          └── Account: sandbox-*
```

### Core Concepts

**Management Account** (formerly Master Account):
- Creates the organization
- Cannot be restricted by SCPs
- Pays all charges for member accounts
- Has full administrative control
- One per organization

**Member Accounts**:
- Accounts that join the organization
- Can be created or invited
- Subject to SCPs
- Can leave organization (if allowed)

**Organizational Units (OUs)**:
- Logical groupings of accounts
- Hierarchical structure (up to 5 levels deep)
- Apply policies to OUs (inherited by child accounts)
- Can contain accounts and other OUs

**Root**:
- Parent container for all accounts
- Contains all OUs and accounts
- Policies at root apply to all accounts

## Service Control Policies (SCPs)

### What are SCPs?

**Purpose**:
- Define maximum available permissions
- Act as permission boundaries
- Do NOT grant permissions (only restrict)
- Applied to OUs or accounts

**How They Work**:
```
Effective Permissions = Identity Policy ∩ SCP

Example:
Identity Policy: Full S3 Access
SCP: Allow S3 Read Only
Result: S3 Read Only (intersection)
```

### SCP Strategies

**1. Allow List Strategy** (Default):
- Explicitly allow specific services/actions
- Block everything not explicitly allowed
- More secure but more maintenance

**Example**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "ec2:*",
        "rds:*"
      ],
      "Resource": "*"
    }
  ]
}
```

**2. Deny List Strategy** (Recommended):
- Allow all by default (FullAWSAccess policy)
- Explicitly deny specific actions
- More flexible, easier to manage

**Example**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "ec2:TerminateInstances",
        "rds:DeleteDBInstance"
      ],
      "Resource": "*"
    }
  ]
}
```

### Common SCP Use Cases

**1. Enforce Region Restrictions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": [
            "us-east-1",
            "us-west-2"
          ]
        }
      }
    }
  ]
}
```

**2. Prevent Account Leaving Organization**:
```json
{
  "Effect": "Deny",
  "Action": "organizations:LeaveOrganization",
  "Resource": "*"
}
```

**3. Enforce MFA for Sensitive Operations**:
```json
{
  "Effect": "Deny",
  "Action": [
    "ec2:TerminateInstances",
    "rds:DeleteDBInstance",
    "s3:DeleteBucket"
  ],
  "Resource": "*",
  "Condition": {
    "BoolIfExists": {
      "aws:MultiFactorAuthPresent": "false"
    }
  }
}
```

**4. Prevent Root User Usage**:
```json
{
  "Effect": "Deny",
  "Action": "*",
  "Resource": "*",
  "Condition": {
    "StringLike": {
      "aws:PrincipalArn": "arn:aws:iam::*:root"
    }
  }
}
```

**5. Enforce Encryption**:
```json
{
  "Effect": "Deny",
  "Action": "s3:PutObject",
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "s3:x-amz-server-side-encryption": "AES256"
    }
  }
}
```

**6. Prevent IAM Policy Changes**:
```json
{
  "Effect": "Deny",
  "Action": [
    "iam:AttachUserPolicy",
    "iam:AttachGroupPolicy",
    "iam:AttachRolePolicy",
    "iam:PutUserPolicy",
    "iam:PutGroupPolicy",
    "iam:PutRolePolicy"
  ],
  "Resource": "*",
  "Condition": {
    "StringNotLike": {
      "aws:PrincipalArn": "arn:aws:iam::*:role/AdminRole"
    }
  }
}
```

### SCP Evaluation Logic

**Hierarchy**:
```
Root SCP
  └── OU SCP
      └── Account SCP
          └── IAM Policy

Effective Permission = Intersection of all SCPs + IAM Policy
```

**Explicit Deny Always Wins**:
- Deny in any SCP = Permission denied
- Even if allowed elsewhere

**Management Account Exception**:
- SCPs do NOT apply to management account
- Always has full permissions

## Organizational Units (OU) Strategies

### Common OU Structures

**1. Environment-Based**:
```
Root
├── Production OU
├── Staging OU
├── Development OU
└── Sandbox OU
```

**2. Function-Based**:
```
Root
├── Workloads OU
│   ├── Web Applications
│   └── Databases
├── Security OU
└── Infrastructure OU
```

**3. Business Unit-Based**:
```
Root
├── Finance OU
├── HR OU
├── Sales OU
└── IT OU
```

**4. Hybrid Approach** (Recommended):
```
Root
├── Core OU (Shared Services)
│   ├── Security
│   ├── Logging
│   └── Networking
├── Workloads OU
│   ├── Production OU
│   │   ├── App-A
│   │   └── App-B
│   ├── Development OU
│   └── Test OU
└── Sandbox OU
```

### OU Best Practices

**1. Keep Hierarchy Simple**:
- Max 5 levels deep (AWS limit)
- Aim for 2-3 levels typically
- Easier to understand and maintain

**2. Plan for Scale**:
- Design for future growth
- Consider business expansions
- Allow for reorganization

**3. Align with Company Structure**:
- Match organizational boundaries
- Reflect governance model
- Support chargeback/showback

**4. Use Naming Conventions**:
```
Format: <Environment>-<Function>-<Region>
Examples:
  prod-webapp-useast1
  dev-database-euwest1
  sec-logging-central
```

## Consolidated Billing

### How It Works

**Single Payer Account**:
- Management account receives one bill
- Includes all member account charges
- Payment method on management account

**Cost Allocation**:
```
Total Bill
├── Account A: $5,000
├── Account B: $3,000
├── Account C: $2,000
└── Total: $10,000
```

### Benefits

**1. Volume Discounts**:
- Aggregate usage across all accounts
- Reach tier pricing faster
- S3, Data Transfer, etc.

**Example**:
```
Scenario: 3 accounts, each with 200 TB of S3 data

Without Consolidation:
  3 × 200 TB = 3 × $0.023/GB = $13,800/month

With Consolidation:
  600 TB combined → Higher tier pricing
  Savings: ~$1,000/month
```

**2. Reserved Instance Sharing**:
- RIs purchased in one account
- Automatically applied to usage in other accounts (same region, instance family)
- Maximize RI utilization

**3. Savings Plans**:
- Compute Savings Plans apply across accounts
- EC2 Instance Savings Plans (account-specific)

**4. Credits and Discounts**:
- Apply to all accounts
- AWS promotional credits
- AWS support credits

### Cost Allocation Tags

**Tag Organization**:
```
Tags for Cost Tracking:
  - Environment: Production, Development, Testing
  - Department: Finance, Engineering, Sales
  - Project: ProjectAlpha, ProjectBeta
  - CostCenter: CC-1001, CC-1002
```

**Activate in Billing Console**:
```
1. Define cost allocation tags
2. Activate tags (up to 48 hours to appear)
3. Generate Cost and Usage Reports
4. Filter and group by tags
```

## Advanced Features

### Delegated Administrator

**What is it?**
- Delegate administrative tasks to member accounts
- Without giving full management account access
- Specific AWS services only

**Supported Services**:
- AWS CloudFormation StackSets
- AWS Config
- AWS Firewall Manager
- Amazon GuardDuty
- AWS Security Hub
- Amazon Macie
- AWS SSO

**Example**:
```bash
# Delegate Security Hub administration to security account
aws organizations register-delegated-administrator \
  --account-id 123456789012 \
  --service-principal securityhub.amazonaws.com
```

**Use Cases**:
- Security account manages GuardDuty for all accounts
- Networking account manages Firewall Manager
- Compliance account manages AWS Config

### Trusted Access

**What is it?**
- Allow AWS services to perform actions in member accounts
- Required for some AWS services to work across organization

**Services Requiring Trusted Access**:
- AWS SSO
- AWS CloudFormation StackSets
- AWS Control Tower
- AWS Systems Manager
- AWS Backup
- AWS RAM

**Enable**:
```bash
aws organizations enable-aws-service-access \
  --service-principal sso.amazonaws.com
```

### AWS RAM (Resource Access Manager) Integration

**Share Resources Across Accounts**:
```
Shareable Resources:
  - Transit Gateway
  - Route 53 Resolver rules
  - License Manager configurations
  - Resource Groups
  - Dedicated Hosts
  - Subnets (VPC sharing)
  - CodeBuild projects
```

**Example - Share Transit Gateway**:
```
Owner Account: Create Transit Gateway
  ↓
Share via RAM with OU
  ↓
Member Accounts: Create VPC attachments
```

## Multi-Account Strategy Patterns

### Landing Zone Architecture

**AWS Control Tower** (Automated Landing Zone):
```
Management Account
├── Security OU
│   ├── Log Archive Account
│   └── Audit Account
├── Sandbox OU
└── Custom OUs (your workloads)
```

**Core Accounts**:
- **Management**: Organization root, billing
- **Log Archive**: Centralized logging (CloudTrail, Config, VPC Flow Logs)
- **Audit**: Security and compliance review
- **Shared Services**: Common resources (Active Directory, DNS)
- **Network**: Transit Gateway, VPN, Direct Connect

### Security Account Pattern

```
Security OU
├── Security Tooling Account
│   ├── GuardDuty (delegated admin)
│   ├── Security Hub
│   ├── Macie
│   └── Inspector
├── Log Archive Account
│   ├── S3 buckets (encrypted)
│   ├── CloudTrail logs
│   ├── Config logs
│   └── VPC Flow Logs
└── Audit Account
    ├── Read-only access to all accounts
    ├── Compliance reporting
    └── Security reviews
```

### Workload Account Pattern

**Pattern 1: Account per Application**:
```
Production OU
├── WebApp-Prod
├── API-Prod
└── Database-Prod
```

**Pattern 2: Account per Environment**:
```
WebApp Accounts
├── WebApp-Dev
├── WebApp-Test
└── WebApp-Prod
```

**Pattern 3: Account per Team**:
```
Engineering OU
├── Team-Alpha
├── Team-Beta
└── Team-Gamma
```

## Monitoring and Compliance

### CloudTrail at Organization Level

**Organization Trail**:
- Single trail for all accounts
- Logs to management account S3 bucket
- Immutable audit log
- Automatic for new accounts

**Configuration**:
```yaml
Organization Trail:
  Name: OrganizationTrail
  S3 Bucket: org-cloudtrail-logs
  Apply to all accounts: Yes
  Include management events: Yes
  Include data events: Optional
  Log file encryption: KMS
  Log file validation: Enabled
```

### AWS Config Aggregator

**Organization-Wide Configuration Tracking**:
```
Delegated Admin Account
  ↓
AWS Config Aggregator
  ↓
Collect configuration from all accounts
  ↓
Centralized compliance dashboard
```

**Benefits**:
- Single view of compliance
- Cross-account resource inventory
- Compliance trend analysis

### Tag Policies

**What are Tag Policies?**
- Standardize tag keys and values
- Enforce tagging compliance
- Case sensitivity control
- Allowed values per tag key

**Example**:
```json
{
  "tags": {
    "Environment": {
      "tag_key": {
        "@@assign": "Environment",
        "@@operators_allowed_for_child_policies": ["@@none"]
      },
      "tag_value": {
        "@@assign": [
          "Production",
          "Development",
          "Testing",
          "Sandbox"
        ]
      }
    },
    "CostCenter": {
      "tag_key": {
        "@@assign": "CostCenter"
      },
      "tag_value": {
        "@@assign": ["CC-[0-9]{4}"]
      }
    }
  }
}
```

### Backup Policies

**Organization-Wide Backup**:
```json
{
  "plans": {
    "DailyBackup": {
      "rules": {
        "DailyRule": {
          "target_backup_vault_name": "Default",
          "schedule_expression": "cron(0 5 ? * * *)",
          "lifecycle": {
            "delete_after_days": 30
          }
        }
      },
      "selections": {
        "tags": {
          "BackupEnabled": {
            "iam_role_arn": "arn:aws:iam::$account:role/AWSBackupRole",
            "tag_key": "Backup",
            "tag_value": ["Daily"]
          }
        }
      }
    }
  }
}
```

## Migration and Management

### Inviting Existing Accounts

**Process**:
```
1. Send invitation from management account
2. Accept invitation from member account
3. Member account joins organization
4. Apply SCPs and policies
```

**Requirements**:
- Email verification
- Payment method on member account (before joining)
- Administrator access to both accounts

### Creating New Accounts

**API/CLI**:
```bash
aws organizations create-account \
  --email newaccount@example.com \
  --account-name "Production Web App" \
  --role-name OrganizationAccountAccessRole
```

**Automatic Role Creation**:
- `OrganizationAccountAccessRole` created in new account
- Management account can assume this role
- Full administrator access

**Account Factory** (with Control Tower):
- Self-service account provisioning
- Standardized account setup
- Guardrails automatically applied
- Integrated with Service Catalog

### Moving Accounts Between OUs

**Process**:
```bash
aws organizations move-account \
  --account-id 123456789012 \
  --source-parent-id ou-old \
  --destination-parent-id ou-new
```

**Considerations**:
- SCPs change when moving
- Test new SCP impact first
- May affect IAM permissions
- Update account documentation

## Best Practices for SAP-C02

### Design Principles

1. **Use Multi-Account Strategy**
   - Separate environments (dev, test, prod)
   - Isolate security and logging
   - Simplify blast radius

2. **Implement Least Privilege with SCPs**
   - Deny list strategy for flexibility
   - Layer SCPs (root, OU, account)
   - Regular SCP reviews

3. **Centralize Security and Logging**
   - Dedicated security account
   - Log archive account (immutable)
   - Audit account (read-only access)

4. **Automate Account Creation**
   - AWS Control Tower or custom automation
   - Standardized configurations
   - Automatic guardrails

5. **Use Delegated Administration**
   - Security services to security account
   - Networking to network account
   - Reduce management account usage

6. **Tag Everything**
   - Cost allocation tags
   - Compliance tags
   - Automation tags
   - Enforce with tag policies

### Common Exam Scenarios

**Scenario 1**: Prevent Production Account from Creating Resources in Unauthorized Regions
- **Solution**: SCP with region restriction at Production OU level

**Scenario 2**: Centralized Logging for All Accounts
- **Solution**: Organization CloudTrail, AWS Config Aggregator, dedicated log archive account

**Scenario 3**: Automated Account Provisioning with Guardrails
- **Solution**: AWS Control Tower with Account Factory, SCPs for guardrails

**Scenario 4**: Cost Allocation by Department
- **Solution**: Separate OUs per department, cost allocation tags, consolidated billing

**Scenario 5**: Prevent Users from Disabling Security Services
- **Solution**: SCP deny policy for security service modifications

**Scenario 6**: Share VPC Subnets Across Accounts
- **Solution**: AWS RAM to share subnets within organization

## Organizations vs Alternatives

| Feature | Organizations | Multi-Account (Manual) | Single Account |
|---------|---------------|------------------------|----------------|
| **Billing** | Consolidated | Separate | Single |
| **Governance** | SCPs, policies | Manual IAM | IAM only |
| **Management** | Centralized | Distributed | N/A |
| **Cost Savings** | Volume discounts | No | N/A |
| **Complexity** | Medium | High | Low |
| **Security** | Account isolation | Account isolation | Resource isolation |

## Quick Reference

### Common CLI Commands

```bash
# Create organization
aws organizations create-organization

# Create OU
aws organizations create-organizational-unit \
  --parent-id r-root \
  --name Production

# Create account
aws organizations create-account \
  --email newemail@example.com \
  --account-name "New Account"

# Attach SCP to OU
aws organizations attach-policy \
  --policy-id p-123456 \
  --target-id ou-123456

# List accounts
aws organizations list-accounts

# Describe organization
aws organizations describe-organization
```

### Important Limits

- Accounts per organization: 10 default (adjustable to thousands)
- OUs per organization: 1,000
- OU nesting depth: 5 levels
- SCPs per account/OU: 5
- SCP size: 5,120 bytes
- Policies per organization: 1,000

### Exam Tips

1. **Organizations for multi-account**: Centralized management and governance
2. **SCPs define maximum permissions**: They restrict, never grant
3. **Management account is exempt**: SCPs don't apply
4. **Consolidated billing**: Volume discounts, RI sharing
5. **Delegated administrator**: Specific services to member accounts
6. **Organization CloudTrail**: Logs all accounts automatically
7. **Tag policies**: Enforce tagging standards
8. **Control Tower**: Automated landing zone setup
9. **RAM for sharing**: Share resources across accounts
10. **OU strategy**: Plan for scale, keep hierarchy simple

## Summary

AWS Organizations is the foundation for multi-account AWS environments, providing:
- Centralized account management
- Policy-based governance with SCPs
- Consolidated billing and cost optimization
- Security and compliance at scale
- Resource sharing across accounts

Key strengths: Centralized management, SCPs for guardrails, consolidated billing (volume discounts), delegated administration, organization-wide services (CloudTrail, Config), support for complex multi-account architectures.
