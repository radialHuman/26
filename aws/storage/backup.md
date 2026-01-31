# AWS Backup

## Table of Contents
1. [AWS Backup Fundamentals](#aws-backup-fundamentals)
2. [Backup Plans](#backup-plans)
3. [Backup Vaults](#backup-vaults)
4. [Cross-Region Backup](#cross-region-backup)
5. [Cross-Account Backup](#cross-account-backup)
6. [Backup Policies (AWS Organizations)](#backup-policies-aws-organizations)
7. [Compliance & Reporting](#compliance--reporting)
8. [Cost Optimization](#cost-optimization)
9. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
10. [Best Practices](#best-practices)
11. [Interview Questions](#interview-questions)

---

## AWS Backup Fundamentals

### What is AWS Backup?

**AWS Backup** is a fully managed backup service that centralizes and automates data protection across AWS services, on-premises, and hybrid environments.

**Core Capabilities**:
```
Centralized Management
├── Single console for all backups
├── Policy-based automation
├── Tag-based resource assignment
└── Compliance reporting dashboard

Supported Services (20+)
├── Compute: EC2, EBS
├── Storage: EFS, FSx (Windows/Lustre/NetApp/OpenZFS), S3
├── Databases: RDS, Aurora, DynamoDB, DocumentDB, Neptune, Redshift
├── Hybrid: Storage Gateway, VMware (on-premises)
└── Applications: SAP HANA on EC2, Timestream

Advanced Features
├── Cross-region backup (DR)
├── Cross-account backup (centralized)
├── Vault Lock (WORM compliance)
├── Legal hold (prevent deletion)
├── Incremental backups (cost-efficient)
└── Point-in-time restore (PITR)

Benefits
✅ Centralized backup across services
✅ Automated schedules (no manual intervention)
✅ Compliance (HIPAA, PCI-DSS, SOC 2)
✅ Cost-effective (lifecycle policies)
✅ Integration with Organizations (multi-account)
```

### Architecture

```
AWS Backup Components:

┌─────────────────────────────────────────────────┐
│              AWS Organization                    │
│  ┌───────────────────────────────────────────┐  │
│  │       Management Account                   │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Backup Policies (organization-wide) │  │  │
│  │  │  - Daily backups required            │  │  │
│  │  │  - 30-day retention minimum          │  │  │
│  │  │  - Cross-region copy mandatory       │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────┐  ┌────────────────┐         │
│  │ Production     │  │ Development    │         │
│  │ Account        │  │ Account        │         │
│  │                │  │                │         │
│  │ Backup Plans   │  │ Backup Plans   │         │
│  │ └─ Plan-1      │  │ └─ Plan-Dev    │         │
│  │                │  │                │         │
│  │ Backup Vaults  │  │ Backup Vaults  │         │
│  │ └─ Default     │  │ └─ Default     │         │
│  │ └─ Compliance  │  │                │         │
│  │                │  │                │         │
│  │ Resources      │  │ Resources      │         │
│  │ └─ RDS (prod)  │  │ └─ RDS (dev)   │         │
│  │ └─ EBS (prod)  │  │ └─ EBS (dev)   │         │
│  └────────────────┘  └────────────────┘         │
└─────────────────────────────────────────────────┘

Cross-Region Copy:
us-east-1 (Primary)          eu-west-1 (DR)
├─ Backup Vault              ├─ Backup Vault
│  └─ Recovery Points        │  └─ Recovery Points (copy)
└─ Automatic copy ──────────▶└─ Automatic replication
```

### Pricing

```
Pricing Components:

Backup Storage (Warm):
├── EFS: $0.05/GB-month
├── EBS: $0.05/GB-month
├── RDS/Aurora: $0.095/GB-month
├── DynamoDB: $0.10/GB-month
└── S3: $0.05/GB-month

Cold Storage (Infrequent Access):
├── All services: $0.01/GB-month
└── Minimum 90 days retention

Restore:
├── Warm storage: $0.02/GB
├── Cold storage: $0.02/GB
└── Data transfer: Standard AWS rates

Early Deletion (Cold Storage):
├── Delete before 90 days: Pro-rated charge
└── Example: Delete at 30 days = pay for 60 days

Cross-Region Transfer:
├── $0.02/GB (region to region)
└── Example: us-east-1 → eu-west-1

Example Cost Calculation:

Scenario: 10 TB RDS database
- Daily backups for 30 days
- Lifecycle: Move to cold after 7 days
- Cross-region copy to DR region

Costs:
1. Initial full backup: 10 TB
   - Warm storage (7 days): 10,000 GB × $0.095/month × (7/30) = $222
   
2. Incremental backups: ~1 TB/day × 29 days = 29 TB
   - Warm storage (7 days each): 29,000 GB × $0.095/month × (7/30) = $643
   
3. Cold storage (30-7=23 days average):
   - Total data: 10 TB + 29 TB = 39 TB
   - Cold storage: 39,000 GB × $0.01/month × (23/30) = $299

4. Cross-region copy:
   - Transfer: 39,000 GB × $0.02 = $780
   - Storage in DR: Same as primary (~$1,164)

Total monthly cost: $222 + $643 + $299 + $780 + $1,164 = $3,108

vs Manual Snapshots:
- RDS snapshots: 39,000 GB × $0.095 = $3,705/month (no lifecycle)
- AWS Backup with lifecycle: $3,108/month
- Savings: $597/month (16%)
```

---

## Backup Plans

---

## Backup Plans

### Backup Plan Components

**Backup Plan** = Schedule + Retention + Lifecycle + Vault

```
Backup Plan Structure:

Plan: "Production-Daily-Backups"
├── Backup Rule 1: Daily Full Backup
│   ├── Schedule: cron(0 2 * * ? *) [2 AM UTC daily]
│   ├── Lifecycle: Move to cold after 7 days
│   ├── Retention: Delete after 30 days
│   ├── Target Vault: "Production-Vault"
│   └── Copy to: eu-west-1 (DR region)
│
├── Backup Rule 2: Weekly Full Backup
│   ├── Schedule: cron(0 3 ? * SUN *) [Sunday 3 AM]
│   ├── Lifecycle: Move to cold after 30 days
│   ├── Retention: Delete after 365 days
│   ├── Target Vault: "LongTerm-Vault"
│   └── Copy to: None
│
└── Resource Assignment:
    ├── Tag: Environment = Production
    ├── Tag: Backup = Required
    └── Auto-assign: All matching resources

Supported Resources:
- RDS databases (tag: Environment=Production)
- EBS volumes (tag: Backup=Required)
- EFS file systems
- DynamoDB tables
```

### Create Backup Plan

```bash
# Complete backup plan with lifecycle
aws backup create-backup-plan \
  --backup-plan '{
    "BackupPlanName": "Production-Daily-Backups",
    "Rules": [
      {
        "RuleName": "DailyBackup",
        "TargetBackupVaultName": "Production-Vault",
        "ScheduleExpression": "cron(0 2 * * ? *)",
        "StartWindowMinutes": 60,
        "CompletionWindowMinutes": 120,
        "Lifecycle": {
          "MoveToColdStorageAfterDays": 7,
          "DeleteAfterDays": 30
        },
        "CopyActions": [
          {
            "DestinationBackupVaultArn": "arn:aws:backup:eu-west-1:123:backup-vault:DR-Vault",
            "Lifecycle": {
              "MoveToColdStorageAfterDays": 7,
              "DeleteAfterDays": 30
            }
          }
        ],
        "RecoveryPointTags": {
          "BackupType": "Automated",
          "Environment": "Production"
        }
      },
      {
        "RuleName": "WeeklyLongTerm",
        "TargetBackupVaultName": "LongTerm-Vault",
        "ScheduleExpression": "cron(0 3 ? * SUN *)",
        "Lifecycle": {
          "MoveToColdStorageAfterDays": 30,
          "DeleteAfterDays": 365
        }
      }
    ],
    "AdvancedBackupSettings": [
      {
        "ResourceType": "EC2",
        "BackupOptions": {
          "WindowsVSS": "enabled"
        }
      }
    ]
  }'

# Output:
{
  "BackupPlanId": "abc-123-def-456",
  "BackupPlanArn": "arn:aws:backup:us-east-1:123:backup-plan:abc-123-def-456",
  "VersionId": "v1"
}
```

### Schedule Expressions

```bash
# Cron format: cron(minute hour day-of-month month day-of-week year)

# Daily at 2 AM UTC
cron(0 2 * * ? *)

# Every 4 hours
cron(0 */4 * * ? *)

# Weekdays at 10 PM
cron(0 22 ? * MON-FRI *)

# First day of month at midnight
cron(0 0 1 * ? *)

# Every Sunday at 3 AM
cron(0 3 ? * SUN *)

# Rate expressions (simpler):
rate(12 hours)  # Every 12 hours
rate(1 day)     # Daily
rate(7 days)    # Weekly

# Continuous backup (DynamoDB, Aurora, S3):
# Enable point-in-time recovery (not schedule-based)
aws backup create-backup-plan \
  --backup-plan '{
    "Rules": [{
      "RuleName": "ContinuousBackup",
      "EnableContinuousBackup": true
    }]
  }'
```

### Resource Assignment

```bash
# Assign resources to backup plan by tags
aws backup create-backup-selection \
  --backup-plan-id abc-123-def-456 \
  --backup-selection '{
    "SelectionName": "Production-Resources",
    "IamRoleArn": "arn:aws:iam::123:role/AWSBackupDefaultServiceRole",
    "Resources": [],
    "ListOfTags": [
      {
        "ConditionType": "STRINGEQUALS",
        "ConditionKey": "Environment",
        "ConditionValue": "Production"
      },
      {
        "ConditionType": "STRINGEQUALS",
        "ConditionKey": "Backup",
        "ConditionValue": "Required"
      }
    ],
    "Conditions": {
      "StringEquals": [
        {
          "ConditionKey": "aws:ResourceTag/Environment",
          "ConditionValue": "Production"
        }
      ],
      "StringLike": [
        {
          "ConditionKey": "aws:ResourceTag/Application",
          "ConditionValue": "CriticalApp*"
        }
      ]
    }
  }'

# Tag resources for automatic assignment:
aws rds add-tags-to-resource \
  --resource-name arn:aws:rds:us-east-1:123:db:prod-database \
  --tags Key=Environment,Value=Production Key=Backup,Value=Required

aws ec2 create-tags \
  --resources vol-abc123 \
  --tags Key=Environment,Value=Production Key=Backup,Value=Required

# Result: Resources automatically backed up based on tags
# New resources with matching tags automatically included
```

### Advanced Backup Settings

```bash
# Windows VSS (Volume Shadow Copy Service)
# Application-consistent backups for Windows EC2

aws backup create-backup-plan \
  --backup-plan '{
    "BackupPlanName": "Windows-VSS-Backup",
    "AdvancedBackupSettings": [
      {
        "ResourceType": "EC2",
        "BackupOptions": {
          "WindowsVSS": "enabled"
        }
      }
    ],
    "Rules": [{
      "RuleName": "WindowsBackup",
      "TargetBackupVaultName": "Windows-Vault",
      "ScheduleExpression": "cron(0 1 * * ? *)"
    }]
  }'

# Benefits of Windows VSS:
# - Application-consistent (SQL Server, Exchange, AD)
# - Flushes in-memory data to disk before snapshot
# - Quiesces applications during backup
# - Ensures database consistency

# IAM role requirements:
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "backup:StartBackupJob",
      "backup:DescribeBackupVault",
      "ec2:CreateSnapshot",
      "ec2:CreateTags",
      "ec2:DescribeVolumes",
      "ec2:DescribeSnapshots"
    ],
    "Resource": "*"
  }]
}
```

---

## Backup Vaults

### Vault Fundamentals

**Backup Vault** = Logical container for recovery points (backups).

```
Vault Properties:
├── Encryption: AWS KMS (CMK or AWS-managed)
├── Access Policy: Who can access backups
├── Notifications: SNS for backup events
├── Vault Lock: WORM compliance (irreversible)
└── Tags: Organization and cost allocation

Default Vault:
- Created automatically in each region
- AWS-managed KMS key encryption
- No access restrictions by default
- Can be modified (add policies, notifications)

Custom Vaults:
- User-created for organization
- Custom KMS keys (CMK)
- Strict access policies
- Vault Lock for compliance
```

### Create Backup Vault

```bash
# Create vault with customer-managed KMS key
aws backup create-backup-vault \
  --backup-vault-name "Compliance-Vault" \
  --encryption-key-arn "arn:aws:kms:us-east-1:123:key/abc-123-def-456" \
  --backup-vault-tags Environment=Production,Compliance=HIPAA

# Add access policy (resource-based)
aws backup put-backup-vault-access-policy \
  --backup-vault-name "Compliance-Vault" \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "DenyDeleteRecoveryPoints",
        "Effect": "Deny",
        "Principal": "*",
        "Action": [
          "backup:DeleteRecoveryPoint",
          "backup:UpdateRecoveryPointLifecycle"
        ],
        "Resource": "*",
        "Condition": {
          "StringNotLike": {
            "aws:PrincipalArn": "arn:aws:iam::123:role/BackupAdmin"
          }
        }
      },
      {
        "Sid": "AllowBackupServiceRole",
        "Effect": "Allow",
        "Principal": {
          "Service": "backup.amazonaws.com"
        },
        "Action": "backup:CopyIntoBackupVault",
        "Resource": "*"
      }
    ]
  }'

# Configure SNS notifications
aws backup put-backup-vault-notifications \
  --backup-vault-name "Compliance-Vault" \
  --sns-topic-arn "arn:aws:sns:us-east-1:123:backup-notifications" \
  --backup-vault-events BACKUP_JOB_STARTED BACKUP_JOB_COMPLETED BACKUP_JOB_FAILED \
    RESTORE_JOB_STARTED RESTORE_JOB_COMPLETED COPY_JOB_FAILED
```

### Vault Lock (WORM Compliance)

```
Vault Lock = Write-Once-Read-Many (WORM) immutability

Use Cases:
- Regulatory compliance (SEC 17a-4, FINRA, HIPAA)
- Ransomware protection (cannot delete backups)
- Data retention policies (enforce minimum retention)
- Legal hold requirements

Lock Configuration:
├── Min retention period: 1 day - 100 years
├── Max retention period: Optional
├── Changeable period: Grace period before lock
└── Irreversible: Cannot unlock once enabled

WARNING: Vault Lock is PERMANENT
- Cannot be disabled
- Cannot be modified (except grace period)
- Recovery points cannot be deleted before retention
```

**Enable Vault Lock**:
```bash
# Step 1: Start vault lock (grace period)
aws backup put-backup-vault-lock-configuration \
  --backup-vault-name "Compliance-Vault" \
  --min-retention-days 30 \
  --max-retention-days 3650 \
  --changeable-for-days 3

# Output:
{
  "BackupVaultName": "Compliance-Vault",
  "BackupVaultArn": "arn:aws:backup:us-east-1:123:backup-vault:Compliance-Vault",
  "LockDate": "2026-02-03T10:00:00Z"  # 3 days from now
}

# Grace period: 3 days to test and verify
# During grace period: Can modify or cancel lock

# Step 2: Test backup/restore (verify lock doesn't break workflows)
# - Create test backup
# - Attempt to delete (should fail after min retention)
# - Restore test

# Step 3: Finalize lock (before grace period expires)
# Automatic after grace period OR manually complete

# After lock:
# ✅ Backups protected from deletion
# ✅ Min retention enforced (30 days)
# ✅ Max retention enforced (3650 days/10 years)
# ❌ Cannot disable lock
# ❌ Cannot reduce retention
# ❌ Cannot delete vault until all recovery points expire

# Example: Try to delete recovery point before 30 days
aws backup delete-recovery-point \
  --backup-vault-name "Compliance-Vault" \
  --recovery-point-arn "arn:aws:backup:us-east-1:123:recovery-point:abc-123"

# Error: AccessDeniedException
# Recovery point locked until 30-day minimum retention period expires
```

### Legal Hold

```
Legal Hold = Prevent deletion for specific recovery points

vs Vault Lock:
- Vault Lock: Applies to all recovery points (vault-wide)
- Legal Hold: Applies to specific recovery points

Use Cases:
- Litigation (preserve evidence)
- Regulatory investigation
- Audit requirements
- Specific point-in-time retention
```

**Apply Legal Hold**:
```bash
# Create legal hold
aws backup create-legal-hold \
  --title "Litigation-Case-2026-001" \
  --description "Preserve backups for ongoing litigation" \
  --idempotency-token "unique-token-123" \
  --recovery-point-selection '{
    "VaultNames": ["Compliance-Vault"],
    "ResourceIdentifiers": [
      "arn:aws:rds:us-east-1:123:db:prod-database",
      "arn:aws:ec2:us-east-1:123:volume/vol-abc123"
    ],
    "DateRange": {
      "FromDate": "2025-01-01T00:00:00Z",
      "ToDate": "2025-12-31T23:59:59Z"
    }
  }'

# Output:
{
  "LegalHoldId": "legalhold-abc123",
  "LegalHoldArn": "arn:aws:backup:us-east-1:123:legal-hold:legalhold-abc123",
  "Title": "Litigation-Case-2026-001",
  "Status": "CREATING"
}

# Effect:
# - Selected recovery points cannot be deleted
# - Overrides retention policies (extended indefinitely)
# - Requires explicit release to allow deletion

# Release legal hold
aws backup cancel-legal-hold \
  --legal-hold-id "legalhold-abc123" \
  --cancel-description "Litigation concluded, release hold"

# After release: Recovery points follow normal retention
```

---

## Cross-Region Backup

### Cross-Region Configuration

```
Purpose:
- Disaster recovery (regional failure)
- Compliance (data in multiple regions)
- Geographic distribution (faster restores)

Cross-Region Copy Process:
1. Backup created in source region (us-east-1)
2. Copy initiated to destination region (eu-west-1)
3. Encrypted transfer between regions
4. Copy stored in destination vault
5. Independent lifecycle (can differ from source)

Cost:
- Data transfer: $0.02/GB (cross-region)
- Storage: Same as source region rates
- Restore: Standard restore rates
```

**Configure Cross-Region Copy**:
```bash
# Backup plan with cross-region copy
aws backup create-backup-plan \
  --backup-plan '{
    "BackupPlanName": "MultiRegion-DR-Plan",
    "Rules": [
      {
        "RuleName": "DailyWithDRCopy",
        "TargetBackupVaultName": "Primary-Vault",
        "ScheduleExpression": "cron(0 2 * * ? *)",
        "Lifecycle": {
          "MoveToColdStorageAfterDays": 7,
          "DeleteAfterDays": 30
        },
        "CopyActions": [
          {
            "DestinationBackupVaultArn": "arn:aws:backup:eu-west-1:123:backup-vault:DR-Vault",
            "Lifecycle": {
              "MoveToColdStorageAfterDays": 1,
              "DeleteAfterDays": 30
            }
          },
          {
            "DestinationBackupVaultArn": "arn:aws:backup:ap-southeast-1:123:backup-vault:Asia-DR-Vault",
            "Lifecycle": {
              "DeleteAfterDays": 7
            }
          }
        ]
      }
    ]
  }'

# Multi-region strategy:
# - Primary: us-east-1 (7 days warm, 23 days cold)
# - DR Europe: eu-west-1 (1 day warm, 29 days cold)
# - DR Asia: ap-southeast-1 (7 days warm only, short-term)

# IAM permissions for cross-region copy:
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "backup:CopyIntoBackupVault",
      "backup:StartCopyJob"
    ],
    "Resource": [
      "arn:aws:backup:*:123:backup-vault:*"
    ]
  }]
}
```

### Disaster Recovery Scenario

```
Scenario: Regional Failure (us-east-1 down)

Before Failure:
us-east-1 (Primary)               eu-west-1 (DR)
├─ RDS: prod-database             ├─ Recovery Points
├─ Daily backups                  │  └─ Last 30 days copies
└─ Recovery Points (30 days)      └─ DR-Vault

During Failure (us-east-1 unavailable):
1. Identify latest recovery point in eu-west-1
2. Restore RDS database in eu-west-1
3. Update Route 53 (failover to eu-west-1)
4. Applications connect to new RDS endpoint

# Restore from DR region
aws backup start-restore-job \
  --recovery-point-arn "arn:aws:backup:eu-west-1:123:recovery-point:rds-backup-xyz" \
  --metadata '{
    "DBInstanceIdentifier": "prod-database-dr",
    "DBInstanceClass": "db.r5.2xlarge",
    "AvailabilityZone": "eu-west-1a",
    "MultiAZ": true
  }' \
  --iam-role-arn "arn:aws:iam::123:role/AWSBackupDefaultServiceRole" \
  --region eu-west-1

# Timeline:
# T+0: Regional failure detected
# T+5 min: Decision to failover to DR
# T+10 min: Start restore from eu-west-1
# T+30 min: RDS restored (depends on size)
# T+35 min: Update Route 53, applications cutover
# RTO: 35 minutes
# RPO: Last backup (daily = up to 24 hours data loss)

After Recovery (us-east-1 restored):
1. Sync data from eu-west-1 to us-east-1
2. Failback to primary region
3. Resume normal backup schedule
```

---

## Cross-Account Backup

### Centralized Backup Architecture

```
Purpose:
- Centralized backup management
- Compliance enforcement across organization
- Cost tracking and optimization
- Disaster recovery (backup in different account)

Architecture:

Management Account (123456789012)
  ├─ Backup Policies (organization-wide)
  └─ Delegated Administrator for Backup

Backup Account (111111111111)
  ├─ Centralized backup vaults
  ├─ All recovery points from member accounts
  ├─ Compliance reporting
  └─ Cost tracking

Production Account (222222222222)
  ├─ Resources (RDS, EBS, EFS)
  ├─ Backup plans (local vaults)
  └─ Copy to Backup Account

Development Account (333333333333)
  ├─ Resources (test databases)
  └─ Copy to Backup Account

Flow:
1. Backup created in Production Account
2. Copied to Backup Account (cross-account)
3. Stored in centralized vault
4. Retention managed centrally
5. Compliance reporting from Backup Account
```

**Configure Cross-Account Backup**:

**Step 1: Enable in Organizations**:
```bash
# In Management Account: Enable backup policies
aws organizations enable-policy-type \
  --root-id r-abc123 \
  --policy-type BACKUP_POLICY

# Designate Backup Account as delegated administrator
aws backup enable-backup-service-resource-organization-backup \
  --delegated-admin-account-id 111111111111
```

**Step 2: Create Vault in Backup Account**:
```bash
# In Backup Account (111111111111)
aws backup create-backup-vault \
  --backup-vault-name "Centralized-Backup-Vault" \
  --encryption-key-arn "arn:aws:kms:us-east-1:111111111111:key/abc-123"

# Add access policy (allow member accounts to copy)
aws backup put-backup-vault-access-policy \
  --backup-vault-name "Centralized-Backup-Vault" \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "AllowOrganizationCopy",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "backup:CopyIntoBackupVault",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:PrincipalOrgID": "o-abc123xyz"
        }
      }
    }]
  }'
```

**Step 3: Configure Backup Plan in Member Account**:
```bash
# In Production Account (222222222222)
aws backup create-backup-plan \
  --backup-plan '{
    "BackupPlanName": "CrossAccount-Backup",
    "Rules": [{
      "RuleName": "DailyCopyToCentralized",
      "TargetBackupVaultName": "Local-Vault",
      "ScheduleExpression": "cron(0 2 * * ? *)",
      "Lifecycle": {
        "DeleteAfterDays": 7
      },
      "CopyActions": [{
        "DestinationBackupVaultArn": "arn:aws:backup:us-east-1:111111111111:backup-vault:Centralized-Backup-Vault",
        "Lifecycle": {
          "MoveToColdStorageAfterDays": 30,
          "DeleteAfterDays": 365
        }
      }]
    }]
  }'

# IAM role for cross-account copy:
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "backup:CopyIntoBackupVault",
      "backup:StartCopyJob"
    ],
    "Resource": "arn:aws:backup:us-east-1:111111111111:backup-vault:Centralized-Backup-Vault"
  },{
    "Effect": "Allow",
    "Action": [
      "kms:CreateGrant",
      "kms:GenerateDataKey"
    ],
    "Resource": "arn:aws:kms:us-east-1:111111111111:key/abc-123",
    "Condition": {
      "StringEquals": {
        "kms:ViaService": "backup.us-east-1.amazonaws.com"
      }
    }
  }]
}
```

**Step 4: Restore from Centralized Vault**:
```bash
# In Backup Account: List recovery points
aws backup list-recovery-points-by-backup-vault \
  --backup-vault-name "Centralized-Backup-Vault"

# Restore to Production Account (cross-account restore)
aws backup start-restore-job \
  --recovery-point-arn "arn:aws:backup:us-east-1:111111111111:recovery-point:abc-123" \
  --metadata '{
    "DBInstanceIdentifier": "restored-database",
    "TargetAccountId": "222222222222"
  }' \
  --iam-role-arn "arn:aws:iam::111111111111:role/CrossAccountRestoreRole"

# IAM role for cross-account restore:
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "backup:StartRestoreJob",
      "rds:CreateDBInstance",
      "rds:DescribeDBInstances"
    ],
    "Resource": "*"
  },{
    "Effect": "Allow",
    "Action": "sts:AssumeRole",
    "Resource": "arn:aws:iam::222222222222:role/RestoreTargetRole"
  }]
}
```

---

## Backup Policies (AWS Organizations)

### Organization-Wide Backup Policies

```
Backup Policies = Enforce backup requirements across organization

Benefits:
- Centralized governance
- Compliance enforcement
- Standardized backup schedules
- Automatic application to new accounts
- Audit and reporting

Policy Inheritance:
Root
├─ Policy 1: Daily backups required
│
├─ OU: Production
│  ├─ Policy 2: 30-day retention minimum
│  ├─ Account A (inherits Policy 1 + 2)
│  └─ Account B (inherits Policy 1 + 2)
│
└─ OU: Development
   ├─ Policy 3: 7-day retention
   └─ Account C (inherits Policy 1 + 3)
```

**Create Backup Policy**:
```bash
# Enable backup policies in organization
aws organizations enable-policy-type \
  --root-id r-abc123 \
  --policy-type BACKUP_POLICY

# Create backup policy
aws organizations create-policy \
  --name "Production-Backup-Policy" \
  --description "Enforced backup requirements for production accounts" \
  --type BACKUP_POLICY \
  --content '{
    "plans": {
      "Production-Backup-Plan": {
        "regions": {
          "@@assign": ["us-east-1", "eu-west-1"]
        },
        "rules": {
          "DailyBackup": {
            "schedule_expression": {
              "@@assign": "cron(0 2 * * ? *)"
            },
            "start_backup_window_minutes": {
              "@@assign": "60"
            },
            "complete_backup_window_minutes": {
              "@@assign": "120"
            },
            "lifecycle": {
              "move_to_cold_storage_after_days": {
                "@@assign": "7"
              },
              "delete_after_days": {
                "@@assign": "30"
              }
            },
            "target_backup_vault_name": {
              "@@assign": "Production-Vault"
            },
            "copy_actions": {
              "CrossRegionCopy": {
                "target_backup_vault_arn": {
                  "@@assign": "arn:aws:backup:eu-west-1:$account:backup-vault:DR-Vault"
                },
                "lifecycle": {
                  "delete_after_days": {
                    "@@assign": "30"
                  }
                }
              }
            }
          }
        },
        "selections": {
          "tags": {
            "Production-Resources": {
              "iam_role_arn": {
                "@@assign": "arn:aws:iam::$account:role/AWSBackupDefaultServiceRole"
              },
              "tag_key": {
                "@@assign": "Environment"
              },
              "tag_value": {
                "@@assign": ["Production"]
              }
            }
          }
        }
      }
    }
  }'

# Attach policy to OU
aws organizations attach-policy \
  --policy-id p-abc123 \
  --target-id ou-prod-xyz

# Result:
# - All accounts in Production OU inherit policy
# - Backup plan automatically created in each account
# - Resources tagged Environment=Production automatically backed up
# - Cannot be overridden at account level (enforced)
```

### Advanced Policy Inheritance

```json
// Root-level policy (baseline)
{
  "plans": {
    "Baseline-Backup": {
      "rules": {
        "MinimumRetention": {
          "lifecycle": {
            "delete_after_days": {"@@assign": "7"}
          }
        }
      }
    }
  }
}

// OU-level policy (Production OU, adds to baseline)
{
  "plans": {
    "Production-Enhancements": {
      "rules": {
        "ExtendedRetention": {
          "lifecycle": {
            "delete_after_days": {"@@assign": "30"}  // Overrides 7 days
          }
        }
      }
    }
  }
}

// Result in Production accounts:
// - Baseline: 7 days (from Root)
// - Extended: 30 days (from OU, takes precedence)
// - Final: 30-day retention enforced
```

---

## Compliance & Reporting

### AWS Backup Audit Manager

```
Audit Manager = Compliance reporting and enforcement

Features:
├── Compliance frameworks (built-in templates)
├── Custom frameworks (organization-specific)
├── Continuous monitoring
├── Compliance reports (CSV, JSON)
└── Remediation guidance

Built-in Frameworks:
- HIPAA: Healthcare data protection
- PCI-DSS: Payment card industry
- GDPR: European data privacy
- SOC 2: Service organization controls
- Custom: Define your own rules
```

**Enable Audit Manager**:
```bash
# Create custom compliance framework
aws backup create-framework \
  --framework-name "Production-Compliance-Framework" \
  --framework-description "Backup compliance for production workloads" \
  --framework-controls '[
    {
      "ControlName": "BACKUP_RECOVERY_POINT_MINIMUM_RETENTION_CHECK",
      "ControlScope": {
        "ComplianceResourceTypes": ["EBS", "RDS", "EFS"]
      },
      "ControlInputParameters": [
        {
          "ParameterName": "requiredRetentionDays",
          "ParameterValue": "30"
        }
      ]
    },
    {
      "ControlName": "BACKUP_PLAN_MIN_FREQUENCY_AND_MIN_RETENTION_CHECK",
      "ControlScope": {
        "ComplianceResourceTypes": ["EBS", "RDS"]
      },
      "ControlInputParameters": [
        {
          "ParameterName": "requiredFrequencyUnit",
          "ParameterValue": "days"
        },
        {
          "ParameterName": "requiredFrequencyValue",
          "ParameterValue": "1"
        }
      ]
    },
    {
      "ControlName": "BACKUP_RESOURCES_PROTECTED_BY_BACKUP_PLAN",
      "ControlScope": {
        "ComplianceResourceTypes": ["EBS", "RDS", "EFS"],
        "Tags": {
          "Environment": "Production"
        }
      }
    },
    {
      "ControlName": "BACKUP_RECOVERY_POINT_ENCRYPTED",
      "ControlScope": {
        "ComplianceResourceTypes": ["EBS", "RDS"]
      }
    },
    {
      "ControlName": "BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED",
      "ControlScope": {
        "ComplianceResourceTypes": ["EBS", "RDS"]
      }
    }
  ]'

# Available controls:
# - BACKUP_RECOVERY_POINT_MINIMUM_RETENTION_CHECK (min retention days)
# - BACKUP_PLAN_MIN_FREQUENCY_AND_MIN_RETENTION_CHECK (backup frequency)
# - BACKUP_RESOURCES_PROTECTED_BY_BACKUP_PLAN (all resources backed up)
# - BACKUP_RECOVERY_POINT_ENCRYPTED (encryption required)
# - BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED (prevent manual delete)
# - BACKUP_LAST_RECOVERY_POINT_CREATED (recent backup exists)
# - BACKUP_RESOURCES_PROTECTED_BY_BACKUP_VAULT_LOCK (vault lock enabled)
```

**Generate Compliance Report**:
```bash
# Create report plan
aws backup create-report-plan \
  --report-plan-name "Monthly-Compliance-Report" \
  --report-plan-description "Monthly backup compliance for audit" \
  --report-delivery-channel '{
    "S3BucketName": "backup-compliance-reports",
    "S3KeyPrefix": "monthly-reports/",
    "Formats": ["CSV", "JSON"]
  }' \
  --report-setting '{
    "ReportTemplate": "BACKUP_JOB_REPORT",
    "FrameworkArns": [
      "arn:aws:backup:us-east-1:123:framework:Production-Compliance-Framework"
    ],
    "Accounts": ["*"],
    "OrganizationUnits": ["ou-prod-xyz"],
    "Regions": ["us-east-1", "eu-west-1"]
  }'

# Schedule report (cron)
aws backup update-report-plan \
  --report-plan-name "Monthly-Compliance-Report" \
  --report-delivery-channel '{
    "S3BucketName": "backup-compliance-reports"
  }' \
  --report-setting '{
    "ReportTemplate": "BACKUP_JOB_REPORT"
  }' \
  --report-schedule '{
    "ScheduleExpression": "cron(0 0 1 * ? *)"
  }'

# Available report templates:
# - BACKUP_JOB_REPORT: Backup job details
# - COPY_JOB_REPORT: Cross-region/account copies
# - RESTORE_JOB_REPORT: Restore operations
# - RESOURCE_COMPLIANCE_REPORT: Resource compliance status
# - RECOVERY_POINT_AGE_REPORT: Age of recovery points
```

**Compliance Dashboard**:
```python
import boto3
import pandas as pd
from datetime import datetime, timedelta

backup = boto3.client('backup')

def generate_compliance_dashboard():
    """
    Generate compliance dashboard
    - Resources protected vs unprotected
    - Backup compliance by framework
    - Recovery point metrics
    """
    # Get framework compliance
    frameworks = backup.list_frameworks()
    
    compliance_data = []
    
    for framework in frameworks['Frameworks']:
        framework_name = framework['FrameworkName']
        
        # Describe framework
        details = backup.describe_framework(
            FrameworkName=framework_name
        )
        
        for control in details['FrameworkControls']:
            control_name = control['ControlName']
            
            # Get compliance status
            compliance = backup.list_report_jobs(
                ByReportPlanName=framework_name
            )
            
            compliance_data.append({
                'Framework': framework_name,
                'Control': control_name,
                'Status': control.get('ControlStatus', 'Unknown'),
                'ResourcesCompliant': control.get('ControlScope', {}).get('ComplianceResourceTypes', [])
            })
    
    # Create DataFrame
    df = pd.DataFrame(compliance_data)
    
    # Summary
    print("=== Backup Compliance Summary ===")
    print(f"Total Frameworks: {len(frameworks['Frameworks'])}")
    print(f"Total Controls: {len(df)}")
    print(f"Compliant: {len(df[df['Status'] == 'COMPLIANT'])}")
    print(f"Non-Compliant: {len(df[df['Status'] == 'NON_COMPLIANT'])}")
    
    # Export to CSV
    df.to_csv('backup-compliance-report.csv', index=False)
    
    return df

# Generate dashboard
generate_compliance_dashboard()
```

---

## Cost Optimization

### Lifecycle Policies

```
Cost Reduction Strategies:

1. Move to Cold Storage:
   - Warm: $0.05-$0.10/GB-month
   - Cold: $0.01/GB-month (80-90% savings)
   - Minimum: 90 days in cold
   - Early deletion: Pro-rated charge

2. Retention Optimization:
   - Keep only necessary backups
   - Balance compliance vs cost
   - Delete old/unnecessary recovery points

3. Incremental Backups:
   - Most services use incremental automatically
   - Only changed data backed up
   - Reduce storage and transfer costs

4. Selective Backup:
   - Tag-based selection
   - Only backup critical resources
   - Exclude dev/test (short retention)
```

**Optimize Lifecycle**:
```bash
# Cost comparison example: 100 TB RDS database

# Strategy 1: All warm storage (30 days)
# - 100 TB × 30 days × $0.095/GB-month = $2,850/month

# Strategy 2: 7 days warm, 23 days cold
# - Warm: 100 TB × (7/30) × $0.095 = $222
# - Cold: 100 TB × (23/30) × $0.01 = $77
# - Total: $299/month
# - Savings: $2,551/month (89%)

# Optimized backup plan
aws backup create-backup-plan \
  --backup-plan '{
    "BackupPlanName": "Cost-Optimized-Plan",
    "Rules": [
      {
        "RuleName": "ShortTermDaily",
        "ScheduleExpression": "cron(0 2 * * ? *)",
        "Lifecycle": {
          "MoveToColdStorageAfterDays": 7,
          "DeleteAfterDays": 30
        }
      },
      {
        "RuleName": "LongTermWeekly",
        "ScheduleExpression": "cron(0 3 ? * SUN *)",
        "Lifecycle": {
          "MoveToColdStorageAfterDays": 30,
          "DeleteAfterDays": 365
        }
      },
      {
        "RuleName": "YearlyArchive",
        "ScheduleExpression": "cron(0 4 1 JAN ? *)",
        "Lifecycle": {
          "MoveToColdStorageAfterDays": 1,
          "DeleteAfterDays": 2555
        }
      }
    ]
  }'

# Result:
# - Daily: 7 days warm + 23 days cold (short-term restore)
# - Weekly: 30 days warm + 335 days cold (medium-term)
# - Yearly: 1 day warm + 7 years cold (long-term archive)
# - Cost: Significantly lower than all-warm
```

### Cost Monitoring

```python
import boto3
from datetime import datetime, timedelta

costexplorer = boto3.client('ce')
backup = boto3.client('backup')

def analyze_backup_costs():
    """
    Analyze AWS Backup costs
    - Storage costs by service
    - Cost trends over time
    - Optimization recommendations
    """
    # Get backup costs (last 30 days)
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)
    
    response = costexplorer.get_cost_and_usage(
        TimePeriod={
            'Start': start_date.strftime('%Y-%m-%d'),
            'End': end_date.strftime('%Y-%m-%d')
        },
        Granularity='DAILY',
        Filter={
            'Dimensions': {
                'Key': 'SERVICE',
                'Values': ['AWS Backup']
            }
        },
        Metrics=['UnblendedCost'],
        GroupBy=[
            {'Type': 'DIMENSION', 'Key': 'USAGE_TYPE'}
        ]
    )
    
    # Parse costs
    total_cost = 0
    usage_costs = {}
    
    for result in response['ResultsByTime']:
        for group in result['Groups']:
            usage_type = group['Keys'][0]
            cost = float(group['Metrics']['UnblendedCost']['Amount'])
            
            if usage_type not in usage_costs:
                usage_costs[usage_type] = 0
            usage_costs[usage_type] += cost
            total_cost += cost
    
    # Print analysis
    print("=== AWS Backup Cost Analysis (Last 30 Days) ===")
    print(f"Total Cost: ${total_cost:.2f}")
    print("\nCost Breakdown:")
    
    for usage_type, cost in sorted(usage_costs.items(), key=lambda x: x[1], reverse=True):
        percentage = (cost / total_cost * 100) if total_cost > 0 else 0
        print(f"  {usage_type}: ${cost:.2f} ({percentage:.1f}%)")
    
    # Optimization recommendations
    print("\n=== Optimization Recommendations ===")
    
    # Check if warm storage is high
    warm_storage_cost = sum(cost for usage, cost in usage_costs.items() if 'WarmStorage' in usage)
    cold_storage_cost = sum(cost for usage, cost in usage_costs.items() if 'ColdStorage' in usage)
    
    if warm_storage_cost > cold_storage_cost * 5:
        savings = warm_storage_cost * 0.8  # Estimated 80% savings
        print(f"⚠️  High warm storage cost (${warm_storage_cost:.2f})")
        print(f"   Recommendation: Move to cold storage after 7 days")
        print(f"   Estimated savings: ${savings:.2f}/month")
    
    # Check for old recovery points
    vaults = backup.list_backup_vaults()
    
    for vault in vaults['BackupVaultList']:
        vault_name = vault['BackupVaultName']
        
        recovery_points = backup.list_recovery_points_by_backup_vault(
            BackupVaultName=vault_name
        )
        
        old_points = 0
        for rp in recovery_points['RecoveryPoints']:
            creation_date = rp['CreationDate'].replace(tzinfo=None)
            age_days = (datetime.now() - creation_date).days
            
            if age_days > 365:  # Older than 1 year
                old_points += 1
        
        if old_points > 0:
            print(f"⚠️  Vault '{vault_name}' has {old_points} recovery points older than 1 year")
            print(f"   Recommendation: Review retention policies, consider deletion")

# Run analysis
analyze_backup_costs()
```

### Tag-Based Cost Allocation

```bash
# Tag recovery points for cost tracking
aws backup create-backup-plan \
  --backup-plan '{
    "BackupPlanName": "Tagged-Backups",
    "Rules": [{
      "RuleName": "DailyBackup",
      "RecoveryPointTags": {
        "CostCenter": "Engineering",
        "Application": "WebApp",
        "Environment": "Production",
        "Owner": "team-platform"
      }
    }]
  }'

# Cost Explorer: Filter by tags
# - Tag: CostCenter=Engineering
# - Service: AWS Backup
# - Result: Backup costs for Engineering team

# Chargeback to teams:
# Engineering: $500/month (tagged backups)
# Marketing: $200/month
# Data Science: $800/month
```

---

## Monitoring & Troubleshooting

### CloudWatch Metrics

```bash
# AWS Backup publishes metrics to CloudWatch

# Available metrics:
# - NumberOfBackupJobsCreated
# - NumberOfBackupJobsCompleted
# - NumberOfBackupJobsFailed
# - NumberOfRestoreJobsCompleted
# - NumberOfCopyJobsCreated

# Create alarm for failed backup jobs
aws cloudwatch put-metric-alarm \
  --alarm-name "Backup-Jobs-Failed" \
  --alarm-description "Alert when backup jobs fail" \
  --metric-name NumberOfBackupJobsFailed \
  --namespace AWS/Backup \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --dimensions Name=ResourceType,Value=RDS \
  --alarm-actions arn:aws:sns:us-east-1:123:backup-alerts

# Dashboard with backup metrics
aws cloudwatch put-dashboard \
  --dashboard-name "Backup-Operations" \
  --dashboard-body '{
    "widgets": [
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["AWS/Backup", "NumberOfBackupJobsCreated"],
            [".", "NumberOfBackupJobsCompleted"],
            [".", "NumberOfBackupJobsFailed"]
          ],
          "period": 3600,
          "stat": "Sum",
          "region": "us-east-1",
          "title": "Backup Jobs"
        }
      },
      {
        "type": "metric",
        "properties": {
          "metrics": [
            ["AWS/Backup", "NumberOfRestoreJobsCompleted"],
            [".", "NumberOfRestoreJobsFailed"]
          ],
          "period": 3600,
          "stat": "Sum",
          "title": "Restore Jobs"
        }
      }
    ]
  }'
```

### EventBridge Integration

```json
// EventBridge rule for backup events
{
  "source": ["aws.backup"],
  "detail-type": [
    "Backup Job State Change",
    "Restore Job State Change",
    "Copy Job State Change"
  ],
  "detail": {
    "state": ["COMPLETED", "FAILED", "ABORTED"]
  }
}
```

```python
# Lambda function for backup event processing
import boto3
import json

sns = boto3.client('sns')
backup = boto3.client('backup')

def lambda_handler(event, context):
    """
    Process AWS Backup events
    - Alert on failures
    - Track completion metrics
    - Trigger remediation
    """
    detail = event['detail']
    event_type = event['detail-type']
    state = detail['state']
    
    if event_type == 'Backup Job State Change':
        backup_job_id = detail['backupJobId']
        resource_arn = detail['resourceArn']
        resource_type = detail['resourceType']
        
        if state == 'FAILED':
            # Get failure details
            job_details = backup.describe_backup_job(
                BackupJobId=backup_job_id
            )
            
            status_message = job_details.get('StatusMessage', 'Unknown error')
            
            # Send alert
            sns.publish(
                TopicArn='arn:aws:sns:us-east-1:123:backup-failures',
                Subject=f'Backup Failed: {resource_type}',
                Message=f'''
Backup Job Failed

Resource: {resource_arn}
Type: {resource_type}
Job ID: {backup_job_id}
Error: {status_message}

Action Required: Investigate and retry backup.
                '''
            )
        
        elif state == 'COMPLETED':
            # Log successful backup
            print(f"Backup completed: {backup_job_id} for {resource_arn}")
    
    elif event_type == 'Restore Job State Change':
        restore_job_id = detail['restoreJobId']
        
        if state == 'COMPLETED':
            # Notify team of successful restore
            sns.publish(
                TopicArn='arn:aws:sns:us-east-1:123:backup-notifications',
                Subject='Restore Job Completed',
                Message=f'Restore job {restore_job_id} completed successfully.'
            )
    
    return {'statusCode': 200}
```

### Common Issues

**Issue 1: Backup Job Fails**:
```
Error: "InsufficientPermissions"

Cause: IAM role lacks required permissions

Solution:
# Check IAM role
aws iam get-role --role-name AWSBackupDefaultServiceRole

# Required permissions (example for RDS):
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "rds:CreateDBSnapshot",
      "rds:DescribeDBSnapshots",
      "rds:DescribeDBInstances",
      "rds:CopyDBSnapshot",
      "rds:AddTagsToResource"
    ],
    "Resource": "*"
  },{
    "Effect": "Allow",
    "Action": [
      "backup:DescribeBackupVault",
      "backup:CopyIntoBackupVault"
    ],
    "Resource": "*"
  }]
}

# Fix: Add missing permissions to role
```

**Issue 2: Cross-Region Copy Fails**:
```
Error: "VaultNotFound"

Cause: Destination vault doesn't exist in target region

Solution:
# Create vault in destination region
aws backup create-backup-vault \
  --backup-vault-name "DR-Vault" \
  --region eu-west-1

# Update backup plan with correct destination
```

**Issue 3: Recovery Point Not Found**:
```
Error: Recovery point deleted before retention period

Cause: Manual deletion or lifecycle policy error

Solution:
# Enable Vault Lock to prevent deletion
aws backup put-backup-vault-lock-configuration \
  --backup-vault-name "Production-Vault" \
  --min-retention-days 30

# Use CloudTrail to investigate deletion
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteRecoveryPoint
```

---

## Best Practices

### Backup Strategy

```
✅ Do:
- Implement 3-2-1 rule (3 copies, 2 media, 1 offsite)
- Use cross-region backups for DR
- Enable Vault Lock for compliance
- Test restores regularly (quarterly minimum)
- Tag resources for automatic backup
- Use lifecycle policies (warm → cold)
- Monitor backup jobs (CloudWatch alarms)
- Document backup procedures

❌ Don't:
- Rely on single region backups
- Skip restore testing
- Manually delete recovery points (automate retention)
- Over-retain backups (cost inefficient)
- Forget to backup new resources (use tags)
- Ignore failed backup alerts
```

### Security

```
✅ Strategies:
1. Encryption: KMS CMK for all vaults
2. Access control: Strict vault policies
3. Vault Lock: Enable for compliance vaults
4. CloudTrail: Audit all backup operations
5. SNS alerts: Failed backups, unauthorized access
6. Cross-account: Centralized backup account
7. Least privilege: IAM roles with minimum permissions

Example vault policy (deny delete):
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyDeleteExceptAdmin",
    "Effect": "Deny",
    "Principal": "*",
    "Action": "backup:DeleteRecoveryPoint",
    "Resource": "*",
    "Condition": {
      "StringNotLike": {
        "aws:PrincipalArn": "arn:aws:iam::123:role/BackupAdministrator"
      }
    }
  }]
}
```

### Testing & Validation

```
Regular Restore Testing:

Weekly: Automated restore test
- Random recovery point
- Restore to test environment
- Validate integrity
- Automated cleanup

Monthly: Full DR drill
- Restore production workload
- Cross-region restore
- Application validation
- Document RTO/RPO

Quarterly: Comprehensive test
- Restore all critical systems
- Multi-account restore
- End-to-end validation
- Team training

Automation Script:
```

```python
import boto3
from datetime import datetime

backup = boto3.client('backup')
ec2 = boto3.client('ec2')

def automated_restore_test():
    """
    Automated weekly restore test
    - Select random recovery point
    - Restore to test environment
    - Validate and cleanup
    """
    # Get recovery points from last week
    vault_name = "Production-Vault"
    
    recovery_points = backup.list_recovery_points_by_backup_vault(
        BackupVaultName=vault_name,
        ByResourceType='EBS'
    )
    
    if not recovery_points['RecoveryPoints']:
        print("No recovery points found")
        return
    
    # Select random point
    import random
    rp = random.choice(recovery_points['RecoveryPoints'])
    
    print(f"Testing recovery point: {rp['RecoveryPointArn']}")
    
    # Start restore job
    restore_response = backup.start_restore_job(
        RecoveryPointArn=rp['RecoveryPointArn'],
        Metadata={
            'volumeType': 'gp3',
            'availabilityZone': 'us-east-1a'
        },
        IamRoleArn='arn:aws:iam::123:role/AWSBackupDefaultServiceRole',
        IdempotencyToken=f"test-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    )
    
    restore_job_id = restore_response['RestoreJobId']
    print(f"Restore job started: {restore_job_id}")
    
    # Wait for completion (or monitor asynchronously)
    waiter = backup.get_waiter('restore_job_completed')
    waiter.wait(RestoreJobId=restore_job_id)
    
    # Get restored volume ID
    job_details = backup.describe_restore_job(
        RestoreJobId=restore_job_id
    )
    
    restored_volume_id = job_details['CreatedResourceArn'].split('/')[-1]
    print(f"Restored volume: {restored_volume_id}")
    
    # Tag for cleanup
    ec2.create_tags(
        Resources=[restored_volume_id],
        Tags=[
            {'Key': 'RestoreTest', 'Value': 'true'},
            {'Key': 'DeleteAfter', 'Value': (datetime.now() + timedelta(hours=24)).isoformat()}
        ]
    )
    
    # Validation (check volume attributes)
    volume = ec2.describe_volumes(VolumeIds=[restored_volume_id])['Volumes'][0]
    
    print("=== Restore Test Results ===")
    print(f"Status: {volume['State']}")
    print(f"Size: {volume['Size']} GB")
    print(f"Type: {volume['VolumeType']}")
    print("Test: PASSED ✅")
    
    # Cleanup (delete after 24 hours, automated by Lambda)
    return restore_job_id

# Run weekly test
automated_restore_test()
```

---

## Interview Questions

### Q1: Design a comprehensive backup solution for a multi-account AWS Organization with 50 accounts. Include compliance requirements (30-day minimum retention, cross-region DR, immutable backups), cost optimization, and centralized reporting.

**Answer**:

**Architecture**:

```
AWS Organization (o-abc123xyz)
├─ Management Account (111111111111)
│  ├─ Backup Policies (organization-wide)
│  │  └─ Minimum 30-day retention enforced
│  └─ Delegated Administrator: Backup Account
│
├─ Backup Account (222222222222)
│  ├─ Centralized backup vaults
│  │  ├─ Compliance-Vault (Vault Lock enabled)
│  │  └─ DR-Vault (cross-region, eu-west-1)
│  ├─ Audit Manager frameworks
│  └─ Compliance reporting
│
├─ Production Accounts (×20)
│  ├─ Resources (RDS, EBS, EFS)
│  ├─ Local backup plans
│  └─ Copy to Backup Account
│
├─ Development Accounts (×20)
│  ├─ Resources (test databases)
│  ├─ Shorter retention (7 days)
│  └─ No cross-region copy
│
└─ Sandbox Accounts (×10)
   ├─ No backup requirements
   └─ Excluded from policies
```

**Implementation**:

**Step 1: Enable Backup Policies in Organization**:
```bash
# In Management Account
aws organizations enable-policy-type \
  --root-id r-abc123 \
  --policy-type BACKUP_POLICY

# Designate Backup Account as delegated administrator
aws organizations register-delegated-administrator \
  --account-id 222222222222 \
  --service-principal backup.amazonaws.com
```

**Step 2: Create Organization-Wide Backup Policy**:
```bash
# Root-level policy (baseline for all accounts)
aws organizations create-policy \
  --name "Organization-Backup-Baseline" \
  --type BACKUP_POLICY \
  --content '{
    "plans": {
      "Baseline-Backup-Plan": {
        "regions": {
          "@@assign": ["us-east-1"]
        },
        "rules": {
          "DailyBackup": {
            "schedule_expression": {
              "@@assign": "cron(0 2 * * ? *)"
            },
            "start_backup_window_minutes": {
              "@@assign": "60"
            },
            "lifecycle": {
              "delete_after_days": {
                "@@assign": "30"
              }
            },
            "target_backup_vault_name": {
              "@@assign": "Default"
            },
            "copy_actions": {
              "CentralizedCopy": {
                "target_backup_vault_arn": {
                  "@@assign": "arn:aws:backup:us-east-1:222222222222:backup-vault:Compliance-Vault"
                },
                "lifecycle": {
                  "delete_after_days": {
                    "@@assign": "365"
                  }
                }
              }
            }
          }
        },
        "selections": {
          "tags": {
            "BackupRequired": {
              "iam_role_arn": {
                "@@assign": "arn:aws:iam::$account:role/AWSBackupDefaultServiceRole"
              },
              "tag_key": {
                "@@assign": "Backup"
              },
              "tag_value": {
                "@@assign": ["Required"]
              }
            }
          }
        }
      }
    }
  }'

# Attach to root (applies to all accounts)
aws organizations attach-policy \
  --policy-id p-baseline123 \
  --target-id r-abc123
```

**Step 3: Production OU Policy** (extended retention + DR):
```bash
# Production OU policy (adds to baseline)
aws organizations create-policy \
  --name "Production-Enhanced-Backup" \
  --type BACKUP_POLICY \
  --content '{
    "plans": {
      "Production-Backup-Plan": {
        "regions": {
          "@@assign": ["us-east-1", "eu-west-1"]
        },
        "rules": {
          "DailyBackup": {
            "lifecycle": {
              "move_to_cold_storage_after_days": {
                "@@assign": "7"
              },
              "delete_after_days": {
                "@@assign": "90"
              }
            },
            "copy_actions": {
              "DRCopy": {
                "target_backup_vault_arn": {
                  "@@assign": "arn:aws:backup:eu-west-1:222222222222:backup-vault:DR-Vault"
                },
                "lifecycle": {
                  "move_to_cold_storage_after_days": {
                    "@@assign": "7"
                  },
                  "delete_after_days": {
                    "@@assign": "90"
                  }
                }
              }
            }
          },
          "WeeklyLongTerm": {
            "schedule_expression": {
              "@@assign": "cron(0 3 ? * SUN *)"
            },
            "lifecycle": {
              "move_to_cold_storage_after_days": {
                "@@assign": "30"
              },
              "delete_after_days": {
                "@@assign": "2555"
              }
            }
          }
        }
      }
    }
  }'

# Attach to Production OU
aws organizations attach-policy \
  --policy-id p-prod123 \
  --target-id ou-prod-xyz
```

**Step 4: Configure Backup Account**:
```bash
# In Backup Account (222222222222)

# Create Compliance Vault with Vault Lock
aws backup create-backup-vault \
  --backup-vault-name "Compliance-Vault" \
  --encryption-key-arn "arn:aws:kms:us-east-1:222222222222:key/abc-123"

# Enable Vault Lock (WORM)
aws backup put-backup-vault-lock-configuration \
  --backup-vault-name "Compliance-Vault" \
  --min-retention-days 30 \
  --max-retention-days 2555 \
  --changeable-for-days 3

# Add access policy (allow org accounts to copy)
aws backup put-backup-vault-access-policy \
  --backup-vault-name "Compliance-Vault" \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "AllowOrganizationCopy",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "backup:CopyIntoBackupVault",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:PrincipalOrgID": "o-abc123xyz"
        }
      }
    },{
      "Sid": "DenyDeleteExceptAdmin",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "backup:DeleteRecoveryPoint",
      "Resource": "*",
      "Condition": {
        "StringNotLike": {
          "aws:PrincipalArn": "arn:aws:iam::222222222222:role/BackupAdmin"
        }
      }
    }]
  }'

# Create DR Vault in eu-west-1
aws backup create-backup-vault \
  --backup-vault-name "DR-Vault" \
  --encryption-key-arn "arn:aws:kms:eu-west-1:222222222222:key/def-456" \
  --region eu-west-1

# Enable Vault Lock for DR vault
aws backup put-backup-vault-lock-configuration \
  --backup-vault-name "DR-Vault" \
  --min-retention-days 30 \
  --changeable-for-days 3 \
  --region eu-west-1
```

**Step 5: Compliance Framework**:
```bash
# Create custom compliance framework
aws backup create-framework \
  --framework-name "Organization-Compliance-Framework" \
  --framework-controls '[
    {
      "ControlName": "BACKUP_RECOVERY_POINT_MINIMUM_RETENTION_CHECK",
      "ControlScope": {
        "ComplianceResourceTypes": ["EBS", "RDS", "EFS"]
      },
      "ControlInputParameters": [
        {"ParameterName": "requiredRetentionDays", "ParameterValue": "30"}
      ]
    },
    {
      "ControlName": "BACKUP_RESOURCES_PROTECTED_BY_BACKUP_PLAN",
      "ControlScope": {
        "Tags": {"Backup": "Required"}
      }
    },
    {
      "ControlName": "BACKUP_RECOVERY_POINT_ENCRYPTED",
      "ControlScope": {
        "ComplianceResourceTypes": ["EBS", "RDS"]
      }
    },
    {
      "ControlName": "BACKUP_RESOURCES_PROTECTED_BY_BACKUP_VAULT_LOCK",
      "ControlScope": {
        "ComplianceResourceTypes": ["EBS", "RDS"]
      }
    }
  ]'

# Create monthly compliance report
aws backup create-report-plan \
  --report-plan-name "Monthly-Organization-Compliance" \
  --report-delivery-channel '{
    "S3BucketName": "backup-compliance-reports-222222222222",
    "Formats": ["CSV", "JSON"]
  }' \
  --report-setting '{
    "ReportTemplate": "RESOURCE_COMPLIANCE_REPORT",
    "FrameworkArns": [
      "arn:aws:backup:us-east-1:222222222222:framework:Organization-Compliance-Framework"
    ],
    "Accounts": ["*"],
    "OrganizationUnits": ["ou-prod-xyz", "ou-dev-abc"],
    "Regions": ["us-east-1", "eu-west-1"]
  }'

# Schedule report (first day of month)
aws backup update-report-plan \
  --report-plan-name "Monthly-Organization-Compliance" \
  --report-schedule '{
    "ScheduleExpression": "cron(0 0 1 * ? *)"
  }'
```

**Cost Optimization**:

```
Strategy:

1. Lifecycle Policies:
   - Production: 7 days warm → 83 days cold (90 total)
   - Development: 7 days warm only (no cold, deleted after 7)
   - Cost savings: 80-90% for production long-term

2. Differentiated Retention:
   - Production: 90 days (compliance)
   - Development: 7 days (testing only)
   - Sandbox: No backups
   - Savings: No wasted backup of non-critical

3. Cold Storage:
   - Move to cold after 7 days
   - $0.095/GB-month → $0.01/GB-month
   - Example: 100 TB production data
     * Without cold: 100 TB × $0.095 × 12 = $114,000/year
     * With cold (7/90 warm): 100 TB × [(7×$0.095) + (83×$0.01)] / 90 × 12 = $18,487/year
     * Savings: $95,513/year (84%)

4. Centralized Storage:
   - Single Backup Account (not 50 accounts)
   - Volume discounts
   - Easier cost tracking
   - Chargeback to business units

Total Cost (50 accounts, estimated):
- Production (20 accounts): ~$150,000/year
- Development (20 accounts): ~$10,000/year
- Backup Account (centralized): ~$200,000/year
- Total: ~$360,000/year

vs Without Optimization:
- All warm storage: ~$1,800,000/year
- Savings: ~$1,440,000/year (80%)
```

**Compliance & Reporting**:

```
Compliance Achieved:
✅ 30-day minimum retention (Vault Lock enforced)
✅ Cross-region DR (us-east-1 → eu-west-1)
✅ Immutable backups (Vault Lock WORM)
✅ Centralized reporting (Audit Manager)
✅ Organization-wide enforcement (Backup Policies)
✅ Encryption (KMS CMK)
✅ Access control (vault policies)

Monthly Compliance Report:
- Total resources: 5,000+ (across 50 accounts)
- Protected resources: 4,850 (97%)
- Unprotected: 150 (flagged for remediation)
- Compliance score: 97% ✅
- Failed backups: 5 (investigated)
- Recovery point age: 100% < 24 hours (daily backups)
- Encryption: 100% (KMS enforced)
- Vault Lock: 100% production (enabled)

Remediation:
- Unprotected resources: Auto-tag with Backup=Required
- Failed backups: EventBridge → Lambda → SNS alert
- Non-compliant: Weekly report to account owners
```

**Disaster Recovery Testing**:

```bash
# Quarterly DR drill (automated)
# Restore production workload from eu-west-1

#!/bin/bash

# 1. Identify latest recovery point in DR region
RECOVERY_POINT=$(aws backup list-recovery-points-by-backup-vault \
  --backup-vault-name "DR-Vault" \
  --by-resource-type RDS \
  --region eu-west-1 \
  --query 'RecoveryPoints | sort_by(@, &CreationDate) | [-1].RecoveryPointArn' \
  --output text)

# 2. Restore to DR region
RESTORE_JOB=$(aws backup start-restore-job \
  --recovery-point-arn "$RECOVERY_POINT" \
  --metadata '{
    "DBInstanceIdentifier": "prod-database-dr-test",
    "DBInstanceClass": "db.r5.xlarge"
  }' \
  --iam-role-arn "arn:aws:iam::222222222222:role/AWSBackupDefaultServiceRole" \
  --region eu-west-1 \
  --query 'RestoreJobId' \
  --output text)

# 3. Wait for completion
aws backup wait restore-job-completed \
  --restore-job-id "$RESTORE_JOB" \
  --region eu-west-1

# 4. Validate
echo "DR Test: Restored database in eu-west-1"
echo "Restore Job ID: $RESTORE_JOB"

# 5. Cleanup (delete test instance after validation)
# ...
```

**Summary**:
- **Compliance**: 30-day retention, cross-region DR, immutable backups (Vault Lock)
- **Centralized**: Single Backup Account for 50 accounts
- **Cost-optimized**: Lifecycle policies save 80% ($1.4M/year)
- **Reporting**: Monthly compliance reports, 97% compliance score
- **Automated**: Backup policies enforce rules, no manual configuration
- **Tested**: Quarterly DR drills, documented RTO/RPO

### Q2: Explain the difference between Vault Lock and Legal Hold in AWS Backup. When would you use each, and can they be used together?

**Answer**:

**Vault Lock vs Legal Hold**:

```
Vault Lock (Vault-Wide):
├── Scope: All recovery points in vault
├── Duration: Permanent (irreversible)
├── Retention: Min/max days enforced
├── Use Case: Regulatory compliance (SEC 17a-4, FINRA, HIPAA)
├── Configuration: One-time setup
└── Effect: WORM (Write-Once-Read-Many)

Legal Hold (Selective):
├── Scope: Specific recovery points
├── Duration: Temporary (releasable)
├── Retention: Indefinite until released
├── Use Case: Litigation, investigations
├── Configuration: Per-recovery point
└── Effect: Prevents deletion until released

Comparison:
                  Vault Lock          Legal Hold
------------------------------------------------------------------------
Granularity       Vault-wide          Per-recovery point
Duration          Permanent           Temporary
Reversible        No                  Yes
Retention         Min/max days        Indefinite
Use Case          Compliance          Legal/audit
Cost              Normal storage      Normal storage (extended)
Automation        Policy-based        Manual/API-based
```

**When to Use Vault Lock**:

```
Use Cases:
1. Regulatory Compliance:
   - SEC 17a-4(f): Financial records (FINRA Rule 4511)
   - HIPAA: Healthcare records (6 years)
   - GDPR: Data retention policies
   - SOX: Financial audit trails (7 years)

2. Ransomware Protection:
   - Immutable backups (cannot delete)
   - Min retention prevents early deletion
   - Even administrators cannot override

3. Data Retention Policies:
   - Enforce minimum retention (e.g., 30 days)
   - Enforce maximum retention (e.g., 7 years)
   - Prevent accidental deletion

Example: Healthcare Compliance (HIPAA)
Requirement: Medical records retained for 6 years minimum

aws backup put-backup-vault-lock-configuration \
  --backup-vault-name "HIPAA-Medical-Records" \
  --min-retention-days 2190 \
  --max-retention-days 3650 \
  --changeable-for-days 3

Effect:
✅ All recovery points kept ≥ 6 years (2190 days)
✅ All recovery points deleted ≤ 10 years (3650 days)
✅ Cannot be disabled (permanent)
✅ Ransomware cannot delete backups
❌ Cannot reduce retention (even for mistakes)
```

**When to Use Legal Hold**:

```
Use Cases:
1. Litigation:
   - Lawsuit filed, preserve evidence
   - Select specific date range (incident period)
   - Indefinite hold until case resolved

2. Regulatory Investigation:
   - Government audit/investigation
   - Preserve specific systems/data
   - Release after investigation concludes

3. Incident Response:
   - Security breach detected
   - Preserve pre-breach backups
   - Forensic analysis

Example: Data Breach Investigation
Incident: Breach detected on Jan 15, 2026
Preserve backups from Dec 1-31, 2025 (pre-breach)

aws backup create-legal-hold \
  --title "DataBreach-2026-Investigation" \
  --description "Preserve backups for forensic analysis" \
  --recovery-point-selection '{
    "VaultNames": ["Production-Vault"],
    "ResourceIdentifiers": [
      "arn:aws:rds:us-east-1:123:db:customer-database",
      "arn:aws:ec2:us-east-1:123:volume/vol-abc123"
    ],
    "DateRange": {
      "FromDate": "2025-12-01T00:00:00Z",
      "ToDate": "2025-12-31T23:59:59Z"
    }
  }'

Effect:
✅ Selected recovery points cannot be deleted
✅ Overrides normal retention policies
✅ Remains until legal hold released
✅ Specific to investigation scope
✅ Reversible (release when investigation concludes)

# After investigation (6 months later):
aws backup cancel-legal-hold \
  --legal-hold-id "legalhold-abc123" \
  --cancel-description "Investigation concluded, release hold"

# Recovery points return to normal retention
```

**Using Both Together**:

```
Scenario: Financial Services Company
- Compliance: SEC 17a-4 (7-year retention)
- Litigation: Lawsuit over Q2 2025 transactions

Configuration:

1. Vault Lock (baseline compliance):
aws backup put-backup-vault-lock-configuration \
  --backup-vault-name "Financial-Records-Vault" \
  --min-retention-days 2555 \
  --max-retention-days 3650

# Effect: All backups kept 7-10 years

2. Legal Hold (specific litigation):
aws backup create-legal-hold \
  --title "Litigation-Q2-2025" \
  --recovery-point-selection '{
    "VaultNames": ["Financial-Records-Vault"],
    "DateRange": {
      "FromDate": "2025-04-01T00:00:00Z",
      "ToDate": "2025-06-30T23:59:59Z"
    }
  }'

# Effect: Q2 2025 backups held indefinitely (beyond 10-year max)

Timeline:
- Day 0: Lawsuit filed, legal hold applied
- Year 7: Vault Lock min retention reached
- Year 10: Vault Lock max retention reached
- Year 10: Legal hold still active (prevents deletion)
- Year 12: Lawsuit settled, legal hold released
- Year 12: Recovery points deleted (past max retention)

Combined Effect:
- Vault Lock: 7-10 year retention (compliance)
- Legal Hold: Extended beyond 10 years (litigation)
- Backups protected until both conditions satisfied
```

**Decision Tree**:

```
Need backup protection?
│
├─ Ongoing compliance requirement?
│  ├─ Yes → Use Vault Lock
│  │         - Permanent protection
│  │         - Min/max retention enforced
│  │         - All recovery points in vault
│  │
│  └─ No  → Is this temporary/specific?
│            ├─ Yes → Use Legal Hold
│            │         - Temporary protection
│            │         - Selective recovery points
│            │         - Releasable
│            │
│            └─ No  → Use both
│                      - Vault Lock (baseline)
│                      - Legal Hold (specific extensions)

Examples:
- HIPAA compliance → Vault Lock (6 years)
- Litigation → Legal Hold (specific dates)
- Financial audit → Vault Lock (7 years) + Legal Hold (extend if needed)
- Ransomware protection → Vault Lock (cannot delete)
- Investigation → Legal Hold (preserve evidence)
```

**Cost Implications**:

```
Vault Lock:
- No additional cost (normal storage rates apply)
- Cost: Based on retention period configured
- Example: 7-year retention
  * Year 1-7: Storage costs accumulate
  * After year 7: Deleted (no cost)

Legal Hold:
- No additional cost (normal storage rates apply)
- Cost: Extended retention beyond normal policy
- Example: Legal hold for 5 extra years
  * Normal: 2-year retention = 2 years cost
  * With hold: 2 + 5 years = 7 years cost
  * Additional cost: 5 years storage

Combined:
- Vault Lock: 7-10 years baseline
- Legal Hold: Extends specific recovery points
- Cost: Only affected recovery points incur extended cost
```

**Summary**:
- **Vault Lock**: Permanent, vault-wide, compliance-driven, irreversible
- **Legal Hold**: Temporary, selective, litigation-driven, reversible
- **Together**: Baseline compliance (Vault Lock) + specific extensions (Legal Hold)
- **Use Vault Lock** for: Regulatory compliance, ransomware protection, organization-wide retention
- **Use Legal Hold** for: Litigation, investigations, specific incident preservation

---

This comprehensive AWS Backup guide covers all aspects needed for SAP-C02 certification with backup plans, vaults, cross-region/account backup, backup policies, compliance, cost optimization, and real-world multi-account organization scenarios!

