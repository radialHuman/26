# AWS CloudTrail - Complete SAP-C02 Guide

*Last Updated: January 2026*

## Table of Contents
1. [CloudTrail Fundamentals](#cloudtrail-fundamentals)
2. [Event Types & Structure](#event-types--structure)
3. [Event History](#event-history)
4. [Trails Configuration](#trails-configuration)
5. [Organization Trails](#organization-trails)
6. [CloudTrail Lake](#cloudtrail-lake)
7. [CloudTrail Insights](#cloudtrail-insights)
8. [Integration with CloudWatch Logs](#integration-with-cloudwatch-logs)
9. [S3 Log File Validation](#s3-log-file-validation)
10. [Security Analysis Patterns](#security-analysis-patterns)
11. [CloudTrail vs AWS Config vs CloudWatch](#cloudtrail-vs-aws-config-vs-cloudwatch)
12. [Best Practices](#best-practices)
13. [Interview Questions](#interview-questions)

---

## CloudTrail Fundamentals

### What is AWS CloudTrail?

```
CloudTrail = Audit trail for AWS account activity

Records:
├── API calls (who, what, when, where)
├── Management events (control plane operations)
├── Data events (data plane operations)
├── Insights events (anomalous activity)
└── Network activity (VPC endpoints)

Key Capabilities:
- Governance & Compliance (audit trail)
- Operational Troubleshooting (who made this change?)
- Security Analysis (unauthorized access?)
- Resource Change Tracking (timeline of modifications)
- Integration (CloudWatch, S3, EventBridge, Athena)
```

**How CloudTrail Works**:

```
AWS Account
├── User makes API call (e.g., RunInstances)
│   └── AWS API Gateway receives request
│       └── CloudTrail captures event
│           ├── Event metadata (user, IP, timestamp, request parameters)
│           ├── Sends to CloudWatch Logs (real-time)
│           ├── Stores in S3 (durable storage)
│           └── CloudTrail Lake (queryable data store)
│
└── Event Available:
    ├── Console: Event history (90 days free)
    ├── S3: Log files (configurable retention)
    ├── CloudWatch Logs: Real-time streaming
    └── CloudTrail Lake: SQL queries (up to 7 years)
```

### Core Architecture

```
Event Flow:

API Call (AWS Service)
    ↓
CloudTrail (capture)
    ↓
    ├─→ Event History (90 days, no config needed)
    ├─→ Trail (S3 + optional CloudWatch Logs)
    │   ├─→ S3 Bucket (log files, JSON)
    │   │   └─→ Athena (SQL queries)
    │   └─→ CloudWatch Logs (real-time)
    │       ├─→ Metric Filters (patterns)
    │       ├─→ Alarms (thresholds)
    │       └─→ Lambda (automated response)
    └─→ CloudTrail Lake (event data store)
        └─→ SQL queries (advanced analysis)
```

### Pricing

```
Event History: FREE (90 days, management events only)

Trails:
- First copy of management events: FREE (per region)
- Additional copies: $2.00 per 100,000 events
- Data events: $0.10 per 100,000 events

CloudTrail Lake:
- Ingestion: $2.50 per GB
- Storage: $0.023 per GB-month (first 7 years)
- Query: $0.005 per GB scanned

CloudWatch Logs:
- Ingestion: $0.50 per GB
- Storage: $0.03 per GB-month
- Standard CloudWatch Logs pricing

S3 Storage:
- Standard S3 pricing applies
- Typical: $0.023 per GB-month
- Lifecycle to Glacier: $0.004 per GB-month

Example Calculation (100 AWS accounts, organization trail):

Monthly Activity:
- Management events: 50M events/month
- Data events (S3): 500M events/month
- CloudWatch Logs: 100 GB/month
- S3 storage: 500 GB/month
- CloudTrail Lake: 50 GB ingested, 1 TB stored

Cost Breakdown:
- Management events: First copy FREE
- Data events: 500M × ($0.10/100K) = $500
- CloudWatch Logs ingestion: 100 GB × $0.50 = $50
- CloudWatch Logs storage: 100 GB × $0.03 = $3
- S3 storage: 500 GB × $0.023 = $11.50
- CloudTrail Lake ingestion: 50 GB × $2.50 = $125
- CloudTrail Lake storage: 1,000 GB × $0.023 = $23

Total: $712.50/month

Optimization:
- Disable data events for non-critical S3 buckets
- Use event selectors (filter specific events)
- S3 lifecycle to Glacier after 90 days
- CloudTrail Lake only for critical analysis
- Optimized cost: ~$200-300/month
```

---

## Event Types & Structure

### Management Events

```
Management Events = Control plane operations

Examples:
- IAM: CreateUser, AttachUserPolicy, DeleteRole
- EC2: RunInstances, TerminateInstances, CreateSecurityGroup
- S3: CreateBucket, DeleteBucket, PutBucketPolicy
- RDS: CreateDBInstance, ModifyDBInstance, DeleteDBSnapshot
- Lambda: CreateFunction, UpdateFunctionCode, DeleteFunction

Categories:
- Read events: Describe*, List*, Get*
- Write events: Create*, Delete*, Put*, Update*, Modify*

Default: All management events logged (FREE for first copy)
```

**Management Event Example**:

```json
{
  "eventVersion": "1.08",
  "userIdentity": {
    "type": "IAMUser",
    "principalId": "AIDACKCEVSQ6C2EXAMPLE",
    "arn": "arn:aws:iam::123456789012:user/Alice",
    "accountId": "123456789012",
    "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "userName": "Alice",
    "sessionContext": {
      "sessionIssuer": {},
      "webIdFederationData": {},
      "attributes": {
        "creationDate": "2026-01-31T10:30:00Z",
        "mfaAuthenticated": "true"
      }
    }
  },
  "eventTime": "2026-01-31T14:22:30Z",
  "eventSource": "ec2.amazonaws.com",
  "eventName": "RunInstances",
  "awsRegion": "us-east-1",
  "sourceIPAddress": "203.0.113.12",
  "userAgent": "aws-cli/2.13.0 Python/3.11.4 Windows/10",
  "requestParameters": {
    "instancesSet": {
      "items": [
        {
          "imageId": "ami-0abcdef1234567890",
          "minCount": 1,
          "maxCount": 1,
          "instanceType": "t3.micro",
          "keyName": "my-key-pair",
          "monitoring": {
            "enabled": false
          }
        }
      ]
    }
  },
  "responseElements": {
    "requestId": "a1b2c3d4-5678-90ab-cdef-EXAMPLE11111",
    "reservationId": "r-0abcdef1234567890",
    "instancesSet": {
      "items": [
        {
          "instanceId": "i-0abcdef1234567890",
          "imageId": "ami-0abcdef1234567890",
          "instanceState": {
            "code": 0,
            "name": "pending"
          },
          "privateDnsName": "ip-10-0-1-25.ec2.internal",
          "privateIpAddress": "10.0.1.25"
        }
      ]
    }
  },
  "requestID": "a1b2c3d4-5678-90ab-cdef-EXAMPLE11111",
  "eventID": "b2c3d4e5-6789-01bc-defg-EXAMPLE22222",
  "readOnly": false,
  "eventType": "AwsApiCall",
  "managementEvent": true,
  "recipientAccountId": "123456789012",
  "eventCategory": "Management"
}
```

**Key Fields**:
- **userIdentity**: Who made the call (IAM user, role, federated user, AWS service)
- **eventTime**: When (UTC timestamp)
- **eventName**: What API call (RunInstances, CreateUser)
- **sourceIPAddress**: Where from (IP address or AWS service)
- **requestParameters**: What was requested (instance type, AMI)
- **responseElements**: What was created (instance ID, resource ARN)
- **errorCode/errorMessage**: If failed (UnauthorizedOperation, InvalidParameterValue)

### Data Events

```
Data Events = Data plane operations (high volume)

S3 Object-Level:
- GetObject, PutObject, DeleteObject
- GetObjectAcl, PutObjectAcl
- HeadObject, CopyObject

Lambda Function Invocations:
- Invoke (function executions)

DynamoDB Table Operations:
- GetItem, PutItem, DeleteItem, UpdateItem
- Query, Scan, BatchGetItem, BatchWriteItem

EBS Direct APIs:
- GetSnapshotBlock, PutSnapshotBlock, ListSnapshotBlocks

S3 on Outposts:
- GetObject, PutObject, DeleteObject

Cost: $0.10 per 100,000 events (not free like management events)
```

**Configure Data Events**:

```bash
# Enable S3 data events for specific bucket
aws cloudtrail put-event-selectors \
  --trail-name MyTrail \
  --event-selectors '[
    {
      "ReadWriteType": "All",
      "IncludeManagementEvents": true,
      "DataResources": [
        {
          "Type": "AWS::S3::Object",
          "Values": [
            "arn:aws:s3:::sensitive-bucket/*"
          ]
        }
      ]
    }
  ]'

# Enable Lambda data events (all functions)
aws cloudtrail put-event-selectors \
  --trail-name MyTrail \
  --event-selectors '[
    {
      "ReadWriteType": "All",
      "IncludeManagementEvents": true,
      "DataResources": [
        {
          "Type": "AWS::Lambda::Function",
          "Values": ["arn:aws:lambda:*:123456789012:function/*"]
        }
      ]
    }
  ]'

# Advanced event selectors (more granular)
aws cloudtrail put-event-selectors \
  --trail-name MyTrail \
  --advanced-event-selectors '[
    {
      "Name": "Log PutObject for sensitive buckets",
      "FieldSelectors": [
        {"Field": "eventCategory", "Equals": ["Data"]},
        {"Field": "resources.type", "Equals": ["AWS::S3::Object"]},
        {"Field": "resources.ARN", "StartsWith": [
          "arn:aws:s3:::sensitive-bucket-1/",
          "arn:aws:s3:::sensitive-bucket-2/"
        ]},
        {"Field": "eventName", "Equals": ["PutObject", "DeleteObject"]}
      ]
    },
    {
      "Name": "Log failed S3 access",
      "FieldSelectors": [
        {"Field": "eventCategory", "Equals": ["Data"]},
        {"Field": "resources.type", "Equals": ["AWS::S3::Object"]},
        {"Field": "errorCode", "NotEquals": [""]}
      ]
    }
  ]'

# Result: Only log specific events, reduce cost
```

### Insights Events

```
Insights Events = Anomalous activity detection (ML-based)

Detects:
- Unusual API call volume (sudden spike)
- Error rate increase (more failures than normal)
- Unusual service usage (dormant service suddenly active)
- Anomalous IAM activity (user accessing unusual resources)

Example: Normal baseline = 10 RunInstances/hour
         Anomaly detected = 500 RunInstances/hour (50× increase)

Cost: $0.35 per 100,000 events analyzed
```

---

## Event History

### 90-Day Free Event History

```
Event History = Last 90 days of management events (FREE)

Features:
├── No configuration required (automatic)
├── Management events only (no data events)
├── Console access (AWS CloudTrail console)
├── API/CLI access (lookup-events)
├── Searchable (by attribute, time range)
└── Cannot be disabled (always available)

Use Cases:
- Quick troubleshooting ("Who deleted this instance?")
- Security investigation ("Unusual console login?")
- Compliance spot-check ("Was MFA used?")
- Learning/exploration (see API calls you made)

Limitations:
- 90 days only (older events require trail to S3)
- Management events only (no S3 GetObject, Lambda Invoke)
- Limited search (attribute-based, not full SQL)
```

**Search Event History**:

```bash
# Lookup events by user
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=Alice \
  --max-results 50

# Lookup by resource name
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=i-0abcdef1234567890

# Lookup by event name
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=RunInstances \
  --start-time 2026-01-01T00:00:00Z \
  --end-time 2026-01-31T23:59:59Z

# Lookup by event ID
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventId,AttributeValue=b2c3d4e5-6789-01bc-defg-EXAMPLE22222

# Lookup unauthorized operations
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=TerminateInstances \
  --query 'Events[?ErrorCode!=`null`]' \
  --output json

# Available AttributeKeys:
# - EventId
# - EventName
# - ReadOnly (true/false)
# - Username
# - ResourceType
# - ResourceName
# - EventSource
# - AccessKeyId
```

**Python Script for Event History Analysis**:

```python
import boto3
from datetime import datetime, timedelta
import json

cloudtrail = boto3.client('cloudtrail')

def analyze_recent_activity(days=7, username=None):
    """
    Analyze recent CloudTrail activity
    - Find unusual API calls
    - Identify failed operations
    - Summarize user activity
    """
    start_time = datetime.now() - timedelta(days=days)
    
    # Lookup events
    if username:
        response = cloudtrail.lookup_events(
            LookupAttributes=[
                {'AttributeKey': 'Username', 'AttributeValue': username}
            ],
            StartTime=start_time
        )
    else:
        response = cloudtrail.lookup_events(StartTime=start_time)
    
    events = response['Events']
    
    # Analyze
    event_counts = {}
    failed_events = []
    users = set()
    
    for event in events:
        event_detail = json.loads(event['CloudTrailEvent'])
        event_name = event_detail['eventName']
        user = event_detail.get('userIdentity', {}).get('userName', 'Unknown')
        users.add(user)
        
        # Count events
        if event_name not in event_counts:
            event_counts[event_name] = 0
        event_counts[event_name] += 1
        
        # Track failures
        if 'errorCode' in event_detail:
            failed_events.append({
                'eventName': event_name,
                'errorCode': event_detail['errorCode'],
                'errorMessage': event_detail.get('errorMessage', ''),
                'user': user,
                'time': event_detail['eventTime']
            })
    
    # Print summary
    print(f"=== CloudTrail Activity Summary (Last {days} Days) ===")
    print(f"Total Events: {len(events)}")
    print(f"Unique Users: {len(users)}")
    print(f"Failed Operations: {len(failed_events)}")
    
    print("\n=== Top 10 API Calls ===")
    sorted_events = sorted(event_counts.items(), key=lambda x: x[1], reverse=True)
    for event_name, count in sorted_events[:10]:
        print(f"  {event_name}: {count}")
    
    if failed_events:
        print("\n=== Failed Operations ===")
        for failure in failed_events[:10]:
            print(f"  {failure['eventName']}: {failure['errorCode']} ({failure['user']}) at {failure['time']}")
    
    return events

# Analyze all activity (last 7 days)
analyze_recent_activity(days=7)

# Analyze specific user
analyze_recent_activity(days=30, username='Alice')
```

---

## Trails Configuration

### Single-Region Trail

```bash
# Create trail (single region)
aws cloudtrail create-trail \
  --name MyTrail \
  --s3-bucket-name cloudtrail-logs-123456789012 \
  --include-global-service-events

# Start logging
aws cloudtrail start-logging --name MyTrail

# Configure event selectors
aws cloudtrail put-event-selectors \
  --trail-name MyTrail \
  --event-selectors '[
    {
      "ReadWriteType": "All",
      "IncludeManagementEvents": true,
      "DataResources": []
    }
  ]'

# Result: Logs management events in current region only
```

### Multi-Region Trail

```bash
# Create multi-region trail (recommended)
aws cloudtrail create-trail \
  --name MyMultiRegionTrail \
  --s3-bucket-name cloudtrail-logs-123456789012 \
  --is-multi-region-trail \
  --include-global-service-events

# Enable log file validation (detect tampering)
aws cloudtrail update-trail \
  --name MyMultiRegionTrail \
  --enable-log-file-validation

# Start logging
aws cloudtrail start-logging --name MyMultiRegionTrail

# Result: Logs events from ALL regions to single S3 bucket
```

**S3 Bucket Configuration**:

```json
// S3 bucket policy (allow CloudTrail to write)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AWSCloudTrailAclCheck",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:GetBucketAcl",
      "Resource": "arn:aws:s3:::cloudtrail-logs-123456789012"
    },
    {
      "Sid": "AWSCloudTrailWrite",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::cloudtrail-logs-123456789012/AWSLogs/123456789012/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    }
  ]
}
```

```bash
# Apply bucket policy
aws s3api put-bucket-policy \
  --bucket cloudtrail-logs-123456789012 \
  --policy file://cloudtrail-bucket-policy.json

# Enable versioning (protect against deletion)
aws s3api put-bucket-versioning \
  --bucket cloudtrail-logs-123456789012 \
  --versioning-configuration Status=Enabled

# Enable MFA delete (extra protection)
aws s3api put-bucket-versioning \
  --bucket cloudtrail-logs-123456789012 \
  --versioning-configuration Status=Enabled,MFADelete=Enabled \
  --mfa "arn:aws:iam::123456789012:mfa/root-account-mfa-device 123456"

# Lifecycle policy (move to Glacier after 90 days)
aws s3api put-bucket-lifecycle-configuration \
  --bucket cloudtrail-logs-123456789012 \
  --lifecycle-configuration '{
    "Rules": [
      {
        "Id": "CloudTrail-Glacier-Archive",
        "Status": "Enabled",
        "Transitions": [
          {
            "Days": 90,
            "StorageClass": "GLACIER"
          }
        ],
        "Expiration": {
          "Days": 2555
        }
      }
    ]
  }'
```

### SNS Notifications

```bash
# Create SNS topic
aws sns create-topic --name cloudtrail-notifications

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:cloudtrail-notifications \
  --protocol email \
  --notification-endpoint admin@example.com

# Update trail with SNS
aws cloudtrail update-trail \
  --name MyMultiRegionTrail \
  --sns-topic-name cloudtrail-notifications

# Result: Email notification when log files delivered to S3
```

---

## Organization Trails

### What are Organization Trails?

```
Organization Trail = CloudTrail for ALL accounts in AWS Organization

Benefits:
├── Centralized logging (one S3 bucket)
├── Automatic coverage (new accounts included)
├── Compliance at scale (organization-wide)
├── Cost-effective (single trail, shared infrastructure)
└── Simplified management (no per-account config)

Architecture:

AWS Organization (o-abc123xyz)
├── Management Account
│   └── Organization Trail
│       ├── Logs ALL accounts
│       ├── S3 bucket (centralized)
│       └── CloudWatch Logs (optional)
│
└── Member Accounts (×100)
    ├── Account A (auto-logged)
    ├── Account B (auto-logged)
    └── ... (all auto-logged)

S3 Structure:
s3://cloudtrail-org-logs/
└── AWSLogs/
    ├── o-abc123xyz/           # Organization ID
    │   ├── 111111111111/      # Management Account
    │   ├── 222222222222/      # Member Account 1
    │   └── 333333333333/      # Member Account 2
    └── 111111111111/          # Management account direct
```

**Create Organization Trail**:

```bash
# Prerequisites:
# 1. Must be in Management Account
# 2. Organization must have trusted access enabled

# Step 1: Enable trusted access for CloudTrail
aws organizations enable-aws-service-access \
  --service-principal cloudtrail.amazonaws.com

# Step 2: Create S3 bucket in Management Account
aws s3api create-bucket \
  --bucket cloudtrail-org-logs-111111111111 \
  --region us-east-1

# Step 3: Apply organization bucket policy
cat > org-bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AWSCloudTrailAclCheck",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:GetBucketAcl",
      "Resource": "arn:aws:s3:::cloudtrail-org-logs-111111111111"
    },
    {
      "Sid": "AWSCloudTrailWriteOrg",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::cloudtrail-org-logs-111111111111/AWSLogs/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket cloudtrail-org-logs-111111111111 \
  --policy file://org-bucket-policy.json

# Step 4: Create organization trail
aws cloudtrail create-trail \
  --name OrganizationTrail \
  --s3-bucket-name cloudtrail-org-logs-111111111111 \
  --is-multi-region-trail \
  --is-organization-trail \
  --enable-log-file-validation

# Step 5: Start logging
aws cloudtrail start-logging --name OrganizationTrail

# Result: ALL accounts in organization logged automatically
```

**Organization Trail with CloudWatch Logs**:

```bash
# Create CloudWatch Logs log group
aws logs create-log-group \
  --log-group-name /aws/cloudtrail/organization

# Create IAM role for CloudTrail → CloudWatch Logs
cat > cloudtrail-cloudwatch-role.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudtrail.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name CloudTrail-CloudWatch-Logs-Role \
  --assume-role-policy-document file://cloudtrail-cloudwatch-role.json

# Attach policy
cat > cloudtrail-cloudwatch-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:111111111111:log-group:/aws/cloudtrail/organization:*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name CloudTrail-CloudWatch-Logs-Role \
  --policy-name CloudTrailCloudWatchLogsPolicy \
  --policy-document file://cloudtrail-cloudwatch-policy.json

# Update trail with CloudWatch Logs
aws cloudtrail update-trail \
  --name OrganizationTrail \
  --cloud-watch-logs-log-group-arn arn:aws:logs:us-east-1:111111111111:log-group:/aws/cloudtrail/organization \
  --cloud-watch-logs-role-arn arn:aws:iam::111111111111:role/CloudTrail-CloudWatch-Logs-Role

# Result: Real-time streaming to CloudWatch Logs
```

---

## CloudTrail Lake

### What is CloudTrail Lake?

```
CloudTrail Lake = SQL-queryable event data store (managed service)

Features:
├── Event data store (7-year retention)
├── SQL queries (standard SQL syntax)
├── No infrastructure (serverless)
├── Fast queries (optimized storage)
├── Federated queries (combine multiple data stores)
└── Integration (Athena-compatible)

Use Cases:
- Security investigations ("Find all DeleteBucket in last year")
- Compliance audits ("Show MFA usage for privileged users")
- Operational analysis ("What caused outage on Dec 15?")
- Trend analysis ("API call volume over 6 months")
- Anomaly detection ("Unusual activity patterns")

vs S3 + Athena:
- CloudTrail Lake: Managed, optimized, SQL-native
- S3 + Athena: DIY, flexible, cost-effective for infrequent queries

Cost:
- Ingestion: $2.50/GB
- Storage: $0.023/GB-month (7 years)
- Queries: $0.005/GB scanned
```

**Create Event Data Store**:

```bash
# Create event data store (7-year retention)
aws cloudtrail create-event-data-store \
  --name SecurityAuditDataStore \
  --retention-period 2555 \
  --multi-region-enabled \
  --organization-enabled \
  --advanced-event-selectors '[
    {
      "Name": "Log all management events",
      "FieldSelectors": [
        {"Field": "eventCategory", "Equals": ["Management"]}
      ]
    },
    {
      "Name": "Log S3 data events for sensitive buckets",
      "FieldSelectors": [
        {"Field": "eventCategory", "Equals": ["Data"]},
        {"Field": "resources.type", "Equals": ["AWS::S3::Object"]},
        {"Field": "resources.ARN", "StartsWith": ["arn:aws:s3:::sensitive-*/"]}
      ]
    }
  ]'

# Result: Event data store created, starts ingesting events
```

**SQL Queries**:

```sql
-- Query 1: Find all EC2 instance terminations in last 30 days
SELECT
  eventTime,
  userIdentity.principalId,
  userIdentity.arn,
  sourceIPAddress,
  requestParameters,
  responseElements
FROM
  SecurityAuditDataStore
WHERE
  eventName = 'TerminateInstances'
  AND eventTime > '2026-01-01 00:00:00'
ORDER BY
  eventTime DESC;

-- Query 2: Count API calls by service (last 7 days)
SELECT
  eventSource,
  COUNT(*) as call_count
FROM
  SecurityAuditDataStore
WHERE
  eventTime > CURRENT_TIMESTAMP - INTERVAL '7' DAY
GROUP BY
  eventSource
ORDER BY
  call_count DESC
LIMIT 20;

-- Query 3: Find unauthorized operations (errors)
SELECT
  eventTime,
  eventName,
  errorCode,
  errorMessage,
  userIdentity.principalId,
  userIdentity.arn,
  sourceIPAddress
FROM
  SecurityAuditDataStore
WHERE
  errorCode IS NOT NULL
  AND eventTime > CURRENT_TIMESTAMP - INTERVAL '24' HOUR
ORDER BY
  eventTime DESC;

-- Query 4: Root account activity (security concern)
SELECT
  eventTime,
  eventName,
  eventSource,
  sourceIPAddress,
  userAgent,
  requestParameters
FROM
  SecurityAuditDataStore
WHERE
  userIdentity.type = 'Root'
  AND eventTime > CURRENT_TIMESTAMP - INTERVAL '90' DAY
ORDER BY
  eventTime DESC;

-- Query 5: S3 bucket deletions
SELECT
  eventTime,
  userIdentity.arn,
  requestParameters.bucketName,
  sourceIPAddress
FROM
  SecurityAuditDataStore
WHERE
  eventName = 'DeleteBucket'
  AND eventTime > CURRENT_TIMESTAMP - INTERVAL '1' YEAR;

-- Query 6: Console logins without MFA
SELECT
  eventTime,
  userIdentity.arn,
  sourceIPAddress,
  userAgent,
  additionalEventData.MFAUsed
FROM
  SecurityAuditDataStore
WHERE
  eventName = 'ConsoleLogin'
  AND eventTime > CURRENT_TIMESTAMP - INTERVAL '30' DAY
  AND additionalEventData.MFAUsed = 'No'
ORDER BY
  eventTime DESC;

-- Query 7: IAM policy changes
SELECT
  eventTime,
  eventName,
  userIdentity.arn,
  requestParameters.policyName,
  requestParameters.policyArn,
  requestParameters.userName,
  requestParameters.roleName
FROM
  SecurityAuditDataStore
WHERE
  eventName IN (
    'CreatePolicy',
    'DeletePolicy',
    'AttachUserPolicy',
    'DetachUserPolicy',
    'AttachRolePolicy',
    'DetachRolePolicy',
    'PutUserPolicy',
    'PutRolePolicy'
  )
  AND eventTime > CURRENT_TIMESTAMP - INTERVAL '30' DAY
ORDER BY
  eventTime DESC;

-- Query 8: Security group changes (network exposure)
SELECT
  eventTime,
  eventName,
  userIdentity.arn,
  requestParameters.groupId,
  requestParameters.ipPermissions
FROM
  SecurityAuditDataStore
WHERE
  eventName IN ('AuthorizeSecurityGroupIngress', 'RevokeSecurityGroupIngress')
  AND eventTime > CURRENT_TIMESTAMP - INTERVAL '7' DAY
ORDER BY
  eventTime DESC;

-- Query 9: Failed authentication attempts
SELECT
  eventTime,
  sourceIPAddress,
  userIdentity.arn,
  errorCode,
  errorMessage,
  COUNT(*) OVER (PARTITION BY sourceIPAddress) as attempts_from_ip
FROM
  SecurityAuditDataStore
WHERE
  eventName = 'ConsoleLogin'
  AND errorCode IN ('Failed authentication', 'InvalidPassword')
  AND eventTime > CURRENT_TIMESTAMP - INTERVAL '24' HOUR
ORDER BY
  attempts_from_ip DESC,
  eventTime DESC;

-- Query 10: Data exfiltration risk (large S3 downloads)
SELECT
  eventTime,
  eventName,
  userIdentity.arn,
  resources.ARN,
  responseElements.xAmzBytesTransferred
FROM
  SecurityAuditDataStore
WHERE
  eventName = 'GetObject'
  AND CAST(responseElements.xAmzBytesTransferred AS BIGINT) > 1000000000
  AND eventTime > CURRENT_TIMESTAMP - INTERVAL '7' DAY
ORDER BY
  CAST(responseElements.xAmzBytesTransferred AS BIGINT) DESC;
```

**Run Query via CLI**:

```bash
# Start query
QUERY_ID=$(aws cloudtrail start-query \
  --query-statement "SELECT eventTime, eventName, userIdentity.arn FROM SecurityAuditDataStore WHERE eventTime > '2026-01-01 00:00:00' LIMIT 100" \
  --query 'QueryId' \
  --output text)

# Check query status
aws cloudtrail get-query-results --query-id $QUERY_ID

# Results (when status = FINISHED):
{
  "QueryStatus": "FINISHED",
  "QueryStatistics": {
    "ResultsCount": 100,
    "TotalResultsCount": 100,
    "BytesScanned": 52428800
  },
  "QueryResultRows": [
    [
      {"eventTime": "2026-01-31 14:22:30"},
      {"eventName": "RunInstances"},
      {"userIdentity.arn": "arn:aws:iam::123456789012:user/Alice"}
    ]
  ]
}

# Cost calculation:
# BytesScanned: 52,428,800 bytes = 50 MB
# Cost: 50 MB × ($0.005 / 1024 MB) = $0.000244
```

---

## CloudTrail Insights

### Anomaly Detection

```
CloudTrail Insights = ML-based anomaly detection

Analyzes:
- API call rate (baseline vs current)
- Error rate (failures increasing)
- User activity (dormant account suddenly active)
- Service usage (unusual patterns)

How it Works:
1. CloudTrail establishes baseline (normal activity, 7-day learning)
2. Continuously monitors API calls
3. Detects anomalies (statistical deviation)
4. Generates Insights event
5. Sends to S3, CloudWatch Logs, EventBridge

Cost: $0.35 per 100,000 write management events analyzed
```

**Enable Insights**:

```bash
# Enable Insights on trail
aws cloudtrail put-insight-selectors \
  --trail-name MyTrail \
  --insight-selectors '[
    {
      "InsightType": "ApiCallRateInsight"
    },
    {
      "InsightType": "ApiErrorRateInsight"
    }
  ]'

# Result: Insights enabled, starts learning baseline
```

**Insights Event Example**:

```json
{
  "eventVersion": "1.08",
  "eventTime": "2026-01-31T15:30:00Z",
  "awsRegion": "us-east-1",
  "eventName": "RunInstances",
  "eventSource": "ec2.amazonaws.com",
  "eventType": "AwsCloudTrailInsight",
  "recipientAccountId": "123456789012",
  "insightDetails": {
    "state": "Start",
    "eventSource": "ec2.amazonaws.com",
    "eventName": "RunInstances",
    "insightType": "ApiCallRateInsight",
    "insightContext": {
      "statistics": {
        "baseline": {
          "average": 10.5
        },
        "insight": {
          "average": 525.3
        },
        "insightDuration": 15
      },
      "attributions": [
        {
          "attribute": "userIdentityArn",
          "insight": [
            {
              "value": "arn:aws:iam::123456789012:user/AutoScalingUser",
              "average": 520.1
            }
          ],
          "baseline": [
            {
              "value": "arn:aws:iam::123456789012:user/AutoScalingUser",
              "average": 8.2
            }
          ]
        }
      ]
    }
  }
}

// Interpretation:
// - Normal: 10.5 RunInstances calls/hour
// - Anomaly: 525.3 RunInstances calls/hour (50× increase)
// - User: AutoScalingUser (went from 8.2 to 520.1 calls/hour)
// - Duration: 15 minutes of unusual activity
// - Possible causes: Auto-scaling storm, compromised credentials, legitimate scale-out
```

**Automated Response to Insights**:

```python
# Lambda function triggered by CloudTrail Insights (via EventBridge)
import boto3
import json

sns = boto3.client('sns')
iam = boto3.client('iam')

def lambda_handler(event, context):
    """
    Respond to CloudTrail Insights
    - Alert security team
    - Optionally suspend suspicious user
    """
    detail = event['detail']
    insight_type = detail['insightDetails']['insightType']
    event_name = detail['eventName']
    
    if insight_type == 'ApiCallRateInsight':
        # Extract details
        baseline_avg = detail['insightDetails']['insightContext']['statistics']['baseline']['average']
        insight_avg = detail['insightDetails']['insightContext']['statistics']['insight']['average']
        increase_factor = insight_avg / baseline_avg if baseline_avg > 0 else 0
        
        # Get user
        attributions = detail['insightDetails']['insightContext'].get('attributions', [])
        suspicious_users = []
        
        for attr in attributions:
            if attr['attribute'] == 'userIdentityArn':
                for insight_item in attr['insight']:
                    suspicious_users.append(insight_item['value'])
        
        # Alert
        message = f"""
CloudTrail Insights Detected Anomaly

Event: {event_name}
Type: {insight_type}
Baseline: {baseline_avg:.1f} calls/hour
Current: {insight_avg:.1f} calls/hour
Increase: {increase_factor:.1f}x

Suspicious Users:
{chr(10).join(suspicious_users)}

Action Required: Investigate activity immediately.
        """
        
        sns.publish(
            TopicArn='arn:aws:sns:us-east-1:123456789012:security-alerts',
            Subject=f'CloudTrail Insights: Anomaly Detected ({event_name})',
            Message=message
        )
        
        # If increase > 100×, suspend user (optional, use with caution)
        if increase_factor > 100:
            for user_arn in suspicious_users:
                if 'user/' in user_arn:
                    username = user_arn.split('user/')[-1]
                    
                    # Attach deny-all policy (suspend access)
                    iam.put_user_policy(
                        UserName=username,
                        PolicyName='EmergencySuspension',
                        PolicyDocument=json.dumps({
                            'Version': '2012-10-17',
                            'Statement': [{
                                'Effect': 'Deny',
                                'Action': '*',
                                'Resource': '*'
                            }]
                        })
                    )
                    
                    print(f"SUSPENDED USER: {username}")
    
    return {'statusCode': 200}
```

---

## Integration with CloudWatch Logs

### Real-Time Streaming

```bash
# Already configured in Organization Trail example above
# CloudTrail → CloudWatch Logs → Metric Filters → Alarms → Lambda

# Create metric filter (unauthorized API calls)
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name UnauthorizedAPICalls \
  --filter-pattern '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }' \
  --metric-transformations \
    metricName=UnauthorizedAPICalls,metricNamespace=CloudTrail,metricValue=1

# Create alarm
aws cloudwatch put-metric-alarm \
  --alarm-name Unauthorized-API-Calls \
  --alarm-description "Alert on unauthorized API calls" \
  --metric-name UnauthorizedAPICalls \
  --namespace CloudTrail \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:security-alerts

# Result: Alarm triggers if >5 unauthorized calls in 5 minutes
```

**Common Metric Filters**:

```bash
# 1. Root account usage
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name RootAccountUsage \
  --filter-pattern '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }' \
  --metric-transformations \
    metricName=RootAccountUsage,metricNamespace=CloudTrail,metricValue=1

# 2. Console sign-in without MFA
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name ConsoleSignInWithoutMFA \
  --filter-pattern '{ $.eventName = "ConsoleLogin" && $.additionalEventData.MFAUsed != "Yes" }' \
  --metric-transformations \
    metricName=ConsoleSignInWithoutMFA,metricNamespace=CloudTrail,metricValue=1

# 3. IAM policy changes
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name IAMPolicyChanges \
  --filter-pattern '{ ($.eventName = CreatePolicy) || ($.eventName = DeletePolicy) || ($.eventName = CreatePolicyVersion) || ($.eventName = DeletePolicyVersion) || ($.eventName = AttachRolePolicy) || ($.eventName = DetachRolePolicy) || ($.eventName = AttachUserPolicy) || ($.eventName = DetachUserPolicy) || ($.eventName = AttachGroupPolicy) || ($.eventName = DetachGroupPolicy) }' \
  --metric-transformations \
    metricName=IAMPolicyChanges,metricNamespace=CloudTrail,metricValue=1

# 4. Network ACL changes
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name NetworkACLChanges \
  --filter-pattern '{ ($.eventName = CreateNetworkAcl) || ($.eventName = CreateNetworkAclEntry) || ($.eventName = DeleteNetworkAcl) || ($.eventName = DeleteNetworkAclEntry) || ($.eventName = ReplaceNetworkAclEntry) || ($.eventName = ReplaceNetworkAclAssociation) }' \
  --metric-transformations \
    metricName=NetworkACLChanges,metricNamespace=CloudTrail,metricValue=1

# 5. Security group changes
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name SecurityGroupChanges \
  --filter-pattern '{ ($.eventName = AuthorizeSecurityGroupIngress) || ($.eventName = AuthorizeSecurityGroupEgress) || ($.eventName = RevokeSecurityGroupIngress) || ($.eventName = RevokeSecurityGroupEgress) || ($.eventName = CreateSecurityGroup) || ($.eventName = DeleteSecurityGroup) }' \
  --metric-transformations \
    metricName=SecurityGroupChanges,metricNamespace=CloudTrail,metricValue=1

# 6. VPC changes
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name VPCChanges \
  --filter-pattern '{ ($.eventName = CreateVpc) || ($.eventName = DeleteVpc) || ($.eventName = ModifyVpcAttribute) || ($.eventName = AcceptVpcPeeringConnection) || ($.eventName = CreateVpcPeeringConnection) || ($.eventName = DeleteVpcPeeringConnection) || ($.eventName = RejectVpcPeeringConnection) || ($.eventName = AttachClassicLinkVpc) || ($.eventName = DetachClassicLinkVpc) || ($.eventName = DisableVpcClassicLink) || ($.eventName = EnableVpcClassicLink) }' \
  --metric-transformations \
    metricName=VPCChanges,metricNamespace=CloudTrail,metricValue=1

# 7. S3 bucket policy changes
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name S3BucketPolicyChanges \
  --filter-pattern '{ ($.eventName = PutBucketAcl) || ($.eventName = PutBucketPolicy) || ($.eventName = PutBucketCors) || ($.eventName = PutBucketLifecycle) || ($.eventName = PutBucketReplication) || ($.eventName = DeleteBucketPolicy) || ($.eventName = DeleteBucketCors) || ($.eventName = DeleteBucketLifecycle) || ($.eventName = DeleteBucketReplication) }' \
  --metric-transformations \
    metricName=S3BucketPolicyChanges,metricNamespace=CloudTrail,metricValue=1

# 8. KMS key deletion
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name KMSKeyDeletion \
  --filter-pattern '{ ($.eventSource = kms.amazonaws.com) && (($.eventName = DisableKey) || ($.eventName = ScheduleKeyDeletion)) }' \
  --metric-transformations \
    metricName=KMSKeyDeletion,metricNamespace=CloudTrail,metricValue=1
```

---

## S3 Log File Validation

### Integrity Verification

```
Log File Validation = Detect tampering with CloudTrail logs

How it Works:
1. CloudTrail creates hash (SHA-256) for each log file
2. Creates digest file every hour
3. Digest contains:
   - Hashes of all log files delivered
   - Previous digest file hash (chain)
   - Digital signature (private key)
4. You can validate:
   - Log file integrity (hash matches)
   - Chain integrity (digests linked)
   - AWS authenticity (signature valid)

Use Cases:
- Legal/regulatory compliance (prove log integrity)
- Security investigation (detect tampering)
- Forensic analysis (chain of custody)

Cost: FREE (no additional charge)
```

**Enable Log File Validation**:

```bash
# Enable on existing trail
aws cloudtrail update-trail \
  --name MyTrail \
  --enable-log-file-validation

# Or create trail with validation
aws cloudtrail create-trail \
  --name MyTrail \
  --s3-bucket-name cloudtrail-logs-123456789012 \
  --enable-log-file-validation
```

**Digest File Structure**:

```
S3 Bucket Structure:

s3://cloudtrail-logs-123456789012/
├── AWSLogs/123456789012/CloudTrail/us-east-1/2026/01/31/
│   ├── 123456789012_CloudTrail_us-east-1_20260131T1405Z_abc123.json.gz (log file)
│   ├── 123456789012_CloudTrail_us-east-1_20260131T1410Z_def456.json.gz
│   └── ...
└── AWSLogs/123456789012/CloudTrail-Digest/us-east-1/2026/01/31/
    ├── 123456789012_CloudTrail-Digest_us-east-1_20260131T140000Z.json.gz (digest)
    ├── 123456789012_CloudTrail-Digest_us-east-1_20260131T150000Z.json.gz
    └── ...

Digest File Content:
{
  "awsAccountId": "123456789012",
  "digestStartTime": "2026-01-31T14:00:00Z",
  "digestEndTime": "2026-01-31T15:00:00Z",
  "digestS3Bucket": "cloudtrail-logs-123456789012",
  "digestS3Object": "AWSLogs/123456789012/CloudTrail-Digest/us-east-1/2026/01/31/123456789012_CloudTrail-Digest_us-east-1_20260131T140000Z.json.gz",
  "newestEventTime": "2026-01-31T14:58:32Z",
  "oldestEventTime": "2026-01-31T14:02:15Z",
  "previousDigestS3Bucket": "cloudtrail-logs-123456789012",
  "previousDigestS3Object": "AWSLogs/123456789012/CloudTrail-Digest/us-east-1/2026/01/31/123456789012_CloudTrail-Digest_us-east-1_20260131T130000Z.json.gz",
  "previousDigestHashValue": "1234567890abcdef...",
  "previousDigestHashAlgorithm": "SHA-256",
  "previousDigestSignature": "abcdef1234567890...",
  "publicKeyFingerprint": "fedcba0987654321...",
  "digestPublicKeyFingerprint": "1234567890abcdef...",
  "digestSignatureAlgorithm": "SHA256withRSA",
  "logFiles": [
    {
      "s3Bucket": "cloudtrail-logs-123456789012",
      "s3Object": "AWSLogs/123456789012/CloudTrail/us-east-1/2026/01/31/123456789012_CloudTrail_us-east-1_20260131T1405Z_abc123.json.gz",
      "hashValue": "abcd1234ef567890...",
      "hashAlgorithm": "SHA-256",
      "newestEventTime": "2026-01-31T14:05:30Z",
      "oldestEventTime": "2026-01-31T14:00:15Z"
    }
  ]
}
```

**Validate Log Files**:

```bash
# AWS CLI command to validate
aws cloudtrail validate-logs \
  --trail-arn arn:aws:cloudtrail:us-east-1:123456789012:trail/MyTrail \
  --start-time 2026-01-31T00:00:00Z \
  --end-time 2026-01-31T23:59:59Z

# Output:
Validating log files for trail arn:aws:cloudtrail:us-east-1:123456789012:trail/MyTrail between 2026-01-31T00:00:00Z and 2026-01-31T23:59:59Z

Results requested for 2026-01-31T00:00:00Z to 2026-01-31T23:59:59Z
Results found for 2026-01-31T00:02:15Z to 2026-01-31T23:58:32Z:

24/24 digest files valid
250/250 log files valid

# If tampering detected:
ERROR: Log file has been modified or deleted
  s3://cloudtrail-logs-123456789012/.../logfile.json.gz
  Expected hash: abcd1234...
  Actual hash: 0000000...
```

---

## Security Analysis Patterns

### Use Case 1: Investigate Unauthorized Access

```python
# Scenario: Suspicious S3 bucket deletion
# Goal: Find who deleted it and trace their activity

import boto3
import json
from datetime import datetime, timedelta

cloudtrail = boto3.client('cloudtrail')

def investigate_bucket_deletion(bucket_name):
    """
    Investigate S3 bucket deletion
    - Find deletion event
    - Identify user
    - Trace user's other activities
    """
    # Step 1: Find deletion event
    response = cloudtrail.lookup_events(
        LookupAttributes=[
            {'AttributeKey': 'EventName', 'AttributeValue': 'DeleteBucket'}
        ],
        MaxResults=50
    )
    
    deletion_event = None
    for event in response['Events']:
        event_detail = json.loads(event['CloudTrailEvent'])
        if bucket_name in event_detail.get('requestParameters', {}).get('bucketName', ''):
            deletion_event = event_detail
            break
    
    if not deletion_event:
        print(f"No deletion event found for bucket: {bucket_name}")
        return
    
    # Step 2: Extract user information
    user_arn = deletion_event['userIdentity'].get('arn', 'Unknown')
    username = deletion_event['userIdentity'].get('userName', 'Unknown')
    access_key = deletion_event['userIdentity'].get('accessKeyId', 'Unknown')
    source_ip = deletion_event.get('sourceIPAddress', 'Unknown')
    event_time = deletion_event['eventTime']
    
    print("=== Bucket Deletion Event ===")
    print(f"Bucket: {bucket_name}")
    print(f"Deleted by: {user_arn}")
    print(f"Username: {username}")
    print(f"Access Key: {access_key}")
    print(f"Source IP: {source_ip}")
    print(f"Time: {event_time}")
    
    # Step 3: Trace user's other activities (last 24 hours)
    print("\n=== User's Other Activities (Last 24 Hours) ===")
    
    start_time = datetime.fromisoformat(event_time.replace('Z', '+00:00')) - timedelta(hours=24)
    
    user_activities = cloudtrail.lookup_events(
        LookupAttributes=[
            {'AttributeKey': 'Username', 'AttributeValue': username}
        ],
        StartTime=start_time,
        MaxResults=100
    )
    
    for activity in user_activities['Events']:
        activity_detail = json.loads(activity['CloudTrailEvent'])
        print(f"  {activity_detail['eventTime']}: {activity_detail['eventName']} ({activity_detail.get('eventSource', 'N/A')})")
    
    # Step 4: Check for other deletions
    print("\n=== Other Deletions by Same User ===")
    
    deletion_events = ['DeleteBucket', 'DeleteObject', 'DeleteDBInstance', 'TerminateInstances', 'DeleteVolume']
    
    for event_name in deletion_events:
        deletion_response = cloudtrail.lookup_events(
            LookupAttributes=[
                {'AttributeKey': 'EventName', 'AttributeValue': event_name}
            ],
            StartTime=start_time,
            MaxResults=50
        )
        
        for event in deletion_response['Events']:
            event_detail = json.loads(event['CloudTrailEvent'])
            if event_detail['userIdentity'].get('userName') == username:
                print(f"  {event_detail['eventTime']}: {event_detail['eventName']} - {event_detail.get('requestParameters', {})}")
    
    # Step 5: Recommendations
    print("\n=== Recommended Actions ===")
    print(f"1. Revoke access key: {access_key}")
    print(f"2. Reset password for user: {username}")
    print(f"3. Review IAM permissions")
    print(f"4. Check if IP {source_ip} is known/trusted")
    print(f"5. Restore bucket from backup if available")

# Run investigation
investigate_bucket_deletion('important-data-bucket')
```

### Use Case 2: Privilege Escalation Detection

```python
import boto3
import json
from datetime import datetime, timedelta

cloudtrail = boto3.client('cloudtrail')

def detect_privilege_escalation():
    """
    Detect privilege escalation patterns:
    - User granting themselves admin permissions
    - Unusual IAM policy changes
    - Role assumption patterns
    """
    # IAM privilege escalation events
    escalation_events = [
        'CreatePolicyVersion',
        'SetDefaultPolicyVersion',
        'AttachUserPolicy',
        'AttachRolePolicy',
        'PutUserPolicy',
        'PutRolePolicy',
        'AddUserToGroup',
        'UpdateAssumeRolePolicy'
    ]
    
    start_time = datetime.now() - timedelta(days=7)
    
    print("=== Privilege Escalation Detection (Last 7 Days) ===")
    
    suspicious_activities = []
    
    for event_name in escalation_events:
        response = cloudtrail.lookup_events(
            LookupAttributes=[
                {'AttributeKey': 'EventName', 'AttributeValue': event_name}
            ],
            StartTime=start_time,
            MaxResults=100
        )
        
        for event in response['Events']:
            event_detail = json.loads(event['CloudTrailEvent'])
            
            # Check if user modified their own permissions
            principal = event_detail['userIdentity'].get('arn', '')
            target_user = event_detail.get('requestParameters', {}).get('userName', '')
            target_role = event_detail.get('requestParameters', {}).get('roleName', '')
            policy_arn = event_detail.get('requestParameters', {}).get('policyArn', '')
            
            # Self-modification (potential escalation)
            if target_user and principal.endswith(f'user/{target_user}'):
                suspicious_activities.append({
                    'type': 'Self-modification',
                    'time': event_detail['eventTime'],
                    'event': event_name,
                    'user': principal,
                    'details': f"User modified own permissions: {event_name}"
                })
            
            # AdminAccess policy attached
            if 'AdministratorAccess' in policy_arn or 'arn:aws:iam::aws:policy/AdministratorAccess' in policy_arn:
                suspicious_activities.append({
                    'type': 'Admin policy attached',
                    'time': event_detail['eventTime'],
                    'event': event_name,
                    'user': principal,
                    'target': target_user or target_role,
                    'details': f"AdminAccess policy attached to {target_user or target_role}"
                })
    
    # Print results
    if suspicious_activities:
        print(f"Found {len(suspicious_activities)} suspicious activities:")
        for activity in suspicious_activities:
            print(f"\n[{activity['type']}]")
            print(f"  Time: {activity['time']}")
            print(f"  Event: {activity['event']}")
            print(f"  User: {activity['user']}")
            print(f"  Details: {activity['details']}")
    else:
        print("No suspicious privilege escalation detected.")

# Run detection
detect_privilege_escalation()
```

### Use Case 3: Compliance Audit (Root Account Usage)

```python
import boto3
import json
from datetime import datetime, timedelta

cloudtrail = boto3.client('cloudtrail')
sns = boto3.client('sns')

def audit_root_account_usage(days=90):
    """
    Audit root account usage (compliance requirement: root should rarely be used)
    - Find all root account activities
    - Alert security team
    - Generate compliance report
    """
    start_time = datetime.now() - timedelta(days=days)
    
    # Query CloudTrail Lake for root activity
    query = f"""
    SELECT
      eventTime,
      eventName,
      eventSource,
      sourceIPAddress,
      userAgent,
      requestParameters,
      errorCode
    FROM
      SecurityAuditDataStore
    WHERE
      userIdentity.type = 'Root'
      AND eventTime > TIMESTAMP '{start_time.isoformat()}'
      AND eventType != 'AwsServiceEvent'
    ORDER BY
      eventTime DESC
    """
    
    # Start query (CloudTrail Lake)
    response = cloudtrail.start_query(QueryStatement=query)
    query_id = response['QueryId']
    
    # Wait for results
    import time
    while True:
        results = cloudtrail.get_query_results(QueryId=query_id)
        status = results['QueryStatus']
        
        if status == 'FINISHED':
            break
        elif status == 'FAILED':
            print(f"Query failed: {results.get('ErrorMessage')}")
            return
        
        time.sleep(2)
    
    root_activities = results['QueryResultRows']
    
    print(f"=== Root Account Usage Audit (Last {days} Days) ===")
    print(f"Total root account activities: {len(root_activities)}")
    
    if len(root_activities) > 0:
        print("\n⚠️  ROOT ACCOUNT USAGE DETECTED (HIGH RISK)")
        print("\nActivities:")
        
        for activity in root_activities:
            # Parse activity (list of dicts)
            event_time = next((item for item in activity if 'eventTime' in item), {}).get('eventTime')
            event_name = next((item for item in activity if 'eventName' in item), {}).get('eventName')
            event_source = next((item for item in activity if 'eventSource' in item), {}).get('eventSource')
            source_ip = next((item for item in activity if 'sourceIPAddress' in item), {}).get('sourceIPAddress')
            
            print(f"  {event_time}: {event_name} ({event_source}) from {source_ip}")
        
        # Alert security team
        sns.publish(
            TopicArn='arn:aws:sns:us-east-1:123456789012:security-alerts',
            Subject=f'⚠️  Root Account Usage Detected ({len(root_activities)} activities)',
            Message=f"""
Root Account Usage Compliance Alert

The root account was used {len(root_activities)} times in the last {days} days.

Best Practice: Root account should be used only for account/billing management tasks requiring root credentials.

Recommendation:
1. Review root account activities (see CloudTrail)
2. Use IAM users/roles for day-to-day operations
3. Enable MFA on root account
4. Secure root account credentials

See attached CloudTrail logs for details.
            """
        )
        
        print("\n✅ Security team alerted via SNS")
    else:
        print("\n✅ No root account usage detected (compliant)")

# Run audit
audit_root_account_usage(days=90)
```

---

## CloudTrail vs AWS Config vs CloudWatch

### Service Comparison

```
CloudTrail vs Config vs CloudWatch:

CloudTrail (WHO did WHAT, WHEN, WHERE):
├── Purpose: Audit trail (API calls)
├── Records: WHO made API call, WHAT call, WHEN, WHERE (IP)
├── Use Case: Security investigation, compliance audit, troubleshooting
├── Data: Events (JSON logs)
├── Retention: 90 days free (event history), unlimited (S3 trail)
└── Query: Event history, CloudTrail Lake (SQL), S3 + Athena

AWS Config (WHAT is the STATE, COMPLIANCE):
├── Purpose: Resource configuration tracking
├── Records: WHAT is resource config, HOW it changed, IS it compliant
├── Use Case: Compliance monitoring, resource inventory, change tracking
├── Data: Configuration items (snapshots)
├── Retention: Configurable (S3)
└── Query: Config console, SQL (S3 + Athena)

CloudWatch (METRICS, PERFORMANCE, HEALTH):
├── Purpose: Monitoring and observability
├── Records: METRICS (CPU, network), LOGS (application logs), ALARMS
├── Use Case: Performance monitoring, operational health, alerting
├── Data: Metrics (time-series), logs (text)
├── Retention: Metrics (15 months), logs (configurable)
└── Query: Metrics console, Logs Insights (SQL-like)

Example Scenario:

Question: "Why did my EC2 instance stop?"

CloudTrail: WHO stopped it
- User: arn:aws:iam::123:user/Alice
- When: 2026-01-31 14:22:30
- API call: StopInstances
- Source IP: 203.0.113.12

Config: WHAT was instance config before/after
- Before: State=running, InstanceType=t3.micro
- After: State=stopped
- Configuration timeline
- Compliance: Non-compliant (required to be running)

CloudWatch: WHAT was instance performance
- CPU: 95% (before stop)
- NetworkIn: 100 MB/s
- Alarm: High CPU triggered
- Logs: Application errors in /var/log/app.log
```

**When to Use Each**:

```
Use CloudTrail when:
✅ "Who made this change?"
✅ "When was this resource deleted?"
✅ "Where did this API call come from?" (IP address)
✅ Security investigation (unauthorized access)
✅ Compliance audit (API call history)
✅ Forensic analysis (timeline of events)

Use AWS Config when:
✅ "What is the current configuration?"
✅ "How has this resource changed over time?"
✅ "Is this resource compliant with our policies?"
✅ Resource inventory (what resources exist)
✅ Compliance monitoring (continuous evaluation)
✅ Drift detection (configuration deviations)

Use CloudWatch when:
✅ "Is this instance healthy?" (metrics)
✅ "What's the CPU usage?" (performance)
✅ "Are there errors in logs?" (application logs)
✅ Real-time monitoring (dashboards)
✅ Alerting (alarms on thresholds)
✅ Operational troubleshooting (logs analysis)

Use Together:
- CloudTrail (who): Alice called StopInstances
- Config (what): Instance state changed running → stopped
- CloudWatch (why): CPU 95%, alarm triggered, application error logs
- Combined: Alice stopped instance due to high CPU (automated response to alarm)
```

---

## Best Practices

### Security & Compliance

```
✅ Do:
1. Enable CloudTrail in ALL regions (multi-region trail)
2. Enable log file validation (detect tampering)
3. Encrypt logs with KMS (sensitive data protection)
4. Enable MFA delete on S3 bucket (prevent log deletion)
5. Use organization trail (centralized logging for all accounts)
6. Stream to CloudWatch Logs (real-time monitoring)
7. Set up CloudTrail Lake (long-term queryable storage)
8. Create metric filters and alarms (unauthorized access, root usage, IAM changes)
9. Enable CloudTrail Insights (anomaly detection)
10. Regularly review logs (security analysis)

❌ Don't:
1. Disable CloudTrail (always keep enabled)
2. Use single-region trail (regional failures)
3. Skip log file validation (can't detect tampering)
4. Store logs in same account (separation of duties)
5. Ignore CloudTrail events (missed security incidents)
6. Delete old logs prematurely (compliance requirements)
7. Grant broad S3 bucket access (log exposure)
```

### Trail Configuration

```
Recommended Setup:

1. Organization Trail (Management Account):
   - Multi-region: Yes
   - All accounts: Yes
   - S3 bucket: Dedicated, versioning enabled, MFA delete
   - KMS encryption: Yes (CMK)
   - Log file validation: Yes
   - CloudWatch Logs: Yes (real-time)
   - SNS notifications: Yes
   - CloudTrail Insights: Yes

2. S3 Bucket:
   - Versioning: Enabled
   - MFA Delete: Enabled
   - Lifecycle: Move to Glacier after 90 days
   - Retention: 7 years (compliance)
   - Access: Deny all except CloudTrail service and security team
   - Bucket policy: Explicit deny DeleteObject

3. CloudWatch Logs:
   - Metric filters: 10+ security patterns (root usage, unauthorized, IAM changes)
   - Alarms: Critical events (root login, admin policy attached)
   - Lambda integration: Automated response (suspend user, revoke key)
   - Retention: 90 days (short-term), S3 for long-term

4. CloudTrail Lake:
   - Event data store: 7-year retention
   - Organization-enabled: Yes
   - Advanced selectors: Management + critical data events (S3 sensitive buckets)
   - Query saved: Top 10 security investigation queries
```

### Cost Optimization

```
Optimize Costs:

1. Use Event Selectors:
   - Management events: FREE (first copy)
   - Data events: Selective (only critical buckets, not all S3)
   - Advanced selectors: Filter by event name, resource ARN
   - Example: Log only PutObject/DeleteObject for sensitive-* buckets

2. S3 Lifecycle:
   - 0-90 days: S3 Standard ($0.023/GB-month)
   - 90-365 days: S3 Glacier ($0.004/GB-month)
   - >365 days: S3 Glacier Deep Archive ($0.00099/GB-month)
   - Savings: 80-90% for long-term retention

3. CloudTrail Lake:
   - Use for active investigations (not all events)
   - Retention: 1-3 years (not 7 years for all events)
   - Query optimization: Use WHERE clauses (reduce scanned data)
   - Alternative: S3 + Athena for infrequent queries (lower cost)

4. CloudWatch Logs:
   - Retention: 90 days (short-term alerts)
   - Long-term: Use S3 (cheaper than CloudWatch Logs storage)
   - Export to S3: aws logs create-export-task

Example Cost Comparison (100 accounts, 1 year):

Option 1: All events to CloudTrail Lake (7 years)
- Ingestion: 500 GB/month × $2.50 = $1,250/month
- Storage: 500 GB × 12 months × $0.023 = $138/year
- Total Year 1: $15,138

Option 2: S3 + Athena + Selective CloudTrail Lake
- S3 Standard (90 days): 500 GB × (90/365) × $0.023 = $2.84/month
- S3 Glacier (rest of year): 500 GB × (275/365) × $0.004 = $1.51/month
- Athena queries: ~$5/month
- CloudTrail Lake (critical events only, 20%): 100 GB × $2.50 = $250/month
- Total Year 1: ~$3,150

Savings: $12,000/year (79% reduction)
```

---

## Interview Questions

### Q1: Design a comprehensive CloudTrail solution for a multi-account AWS Organization with 200 accounts. Include security requirements (detect unauthorized access, root usage, privilege escalation), compliance (7-year retention, audit trail integrity), and real-time alerting with automated response.

**Answer**:

**Architecture**:

```
AWS Organization (200 accounts)
├── Management Account
│   ├── Organization Trail (ALL accounts)
│   ├── S3 Bucket (centralized logs)
│   ├── CloudWatch Logs (real-time)
│   └── CloudTrail Lake (7-year queryable)
│
├── Security Account (delegated)
│   ├── SNS Topics (security alerts)
│   ├── Lambda Functions (automated response)
│   ├── EventBridge Rules (trigger on events)
│   └── Athena (S3 log analysis)
│
└── Member Accounts (×198)
    └── Auto-logged to organization trail

Real-Time Flow:
API Call → CloudTrail → CloudWatch Logs → Metric Filter → Alarm → SNS → Lambda → Automated Response
```

**Implementation**:

**Step 1: Create Organization Trail**:
```bash
# In Management Account

# Create S3 bucket
aws s3api create-bucket \
  --bucket cloudtrail-org-logs-central \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket cloudtrail-org-logs-central \
  --versioning-configuration Status=Enabled

# Apply bucket policy (organization-wide access)
aws s3api put-bucket-policy \
  --bucket cloudtrail-org-logs-central \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AWSCloudTrailAclCheck",
        "Effect": "Allow",
        "Principal": {"Service": "cloudtrail.amazonaws.com"},
        "Action": "s3:GetBucketAcl",
        "Resource": "arn:aws:s3:::cloudtrail-org-logs-central"
      },
      {
        "Sid": "AWSCloudTrailWriteOrg",
        "Effect": "Allow",
        "Principal": {"Service": "cloudtrail.amazonaws.com"},
        "Action": "s3:PutObject",
        "Resource": "arn:aws:s3:::cloudtrail-org-logs-central/AWSLogs/*",
        "Condition": {
          "StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}
        }
      },
      {
        "Sid": "DenyUnencryptedObjectUploads",
        "Effect": "Deny",
        "Principal": "*",
        "Action": "s3:PutObject",
        "Resource": "arn:aws:s3:::cloudtrail-org-logs-central/*",
        "Condition": {
          "StringNotEquals": {
            "s3:x-amz-server-side-encryption": "aws:kms"
          }
        }
      },
      {
        "Sid": "DenyDeleteObject",
        "Effect": "Deny",
        "Principal": "*",
        "Action": ["s3:DeleteObject", "s3:DeleteObjectVersion"],
        "Resource": "arn:aws:s3:::cloudtrail-org-logs-central/*",
        "Condition": {
          "StringNotLike": {
            "aws:userid": ["AIDAI-SECURITY-ADMIN:*"]
          }
        }
      }
    ]
  }'

# Create KMS key for encryption
KEY_ID=$(aws kms create-key \
  --description "CloudTrail organization logs encryption" \
  --key-policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "Enable IAM policies",
        "Effect": "Allow",
        "Principal": {"AWS": "arn:aws:iam::111111111111:root"},
        "Action": "kms:*",
        "Resource": "*"
      },
      {
        "Sid": "Allow CloudTrail encrypt",
        "Effect": "Allow",
        "Principal": {"Service": "cloudtrail.amazonaws.com"},
        "Action": ["kms:GenerateDataKey", "kms:DescribeKey"],
        "Resource": "*",
        "Condition": {
          "StringLike": {
            "kms:EncryptionContext:aws:cloudtrail:arn": "arn:aws:cloudtrail:*:111111111111:trail/*"
          }
        }
      },
      {
        "Sid": "Allow CloudWatch Logs",
        "Effect": "Allow",
        "Principal": {"Service": "logs.amazonaws.com"},
        "Action": ["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey"],
        "Resource": "*"
      }
    ]
  }' \
  --query 'KeyMetadata.KeyId' \
  --output text)

# Create organization trail
aws cloudtrail create-trail \
  --name OrganizationTrail \
  --s3-bucket-name cloudtrail-org-logs-central \
  --is-multi-region-trail \
  --is-organization-trail \
  --enable-log-file-validation \
  --kms-key-id $KEY_ID

# Enable CloudTrail Insights
aws cloudtrail put-insight-selectors \
  --trail-name OrganizationTrail \
  --insight-selectors '[
    {"InsightType": "ApiCallRateInsight"},
    {"InsightType": "ApiErrorRateInsight"}
  ]'

# Start logging
aws cloudtrail start-logging --name OrganizationTrail
```

**Step 2: CloudWatch Logs Integration**:
```bash
# Create log group
aws logs create-log-group \
  --log-group-name /aws/cloudtrail/organization \
  --kms-key-id $KEY_ID

# Create IAM role for CloudTrail → CloudWatch
aws iam create-role \
  --role-name CloudTrail-CloudWatch-Role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "cloudtrail.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam put-role-policy \
  --role-name CloudTrail-CloudWatch-Role \
  --policy-name CloudWatchLogsPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:*:111111111111:log-group:/aws/cloudtrail/organization:*"
    }]
  }'

# Update trail
aws cloudtrail update-trail \
  --name OrganizationTrail \
  --cloud-watch-logs-log-group-arn arn:aws:logs:us-east-1:111111111111:log-group:/aws/cloudtrail/organization \
  --cloud-watch-logs-role-arn arn:aws:iam::111111111111:role/CloudTrail-CloudWatch-Role
```

**Step 3: Security Metric Filters & Alarms**:
```bash
# 1. Root account usage
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name RootAccountUsage \
  --filter-pattern '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS }' \
  --metric-transformations metricName=RootAccountUsage,metricNamespace=CloudTrailSecurity,metricValue=1

aws cloudwatch put-metric-alarm \
  --alarm-name ROOT-ACCOUNT-USAGE \
  --metric-name RootAccountUsage \
  --namespace CloudTrailSecurity \
  --statistic Sum \
  --period 60 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:111111111111:critical-security-alerts

# 2. Unauthorized API calls
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name UnauthorizedAPICalls \
  --filter-pattern '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }' \
  --metric-transformations metricName=UnauthorizedAPICalls,metricNamespace=CloudTrailSecurity,metricValue=1

aws cloudwatch put-metric-alarm \
  --alarm-name UNAUTHORIZED-API-CALLS \
  --metric-name UnauthorizedAPICalls \
  --namespace CloudTrailSecurity \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:111111111111:security-alerts

# 3. Console login without MFA
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name ConsoleLoginNoMFA \
  --filter-pattern '{ $.eventName = "ConsoleLogin" && $.additionalEventData.MFAUsed = "No" }' \
  --metric-transformations metricName=ConsoleLoginNoMFA,metricNamespace=CloudTrailSecurity,metricValue=1

aws cloudwatch put-metric-alarm \
  --alarm-name CONSOLE-LOGIN-NO-MFA \
  --metric-name ConsoleLoginNoMFA \
  --namespace CloudTrailSecurity \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:111111111111:security-alerts

# 4. Admin policy attached
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name AdminPolicyAttached \
  --filter-pattern '{ ($.eventName = AttachUserPolicy || $.eventName = AttachRolePolicy || $.eventName = AttachGroupPolicy) && $.requestParameters.policyArn = "*AdministratorAccess*" }' \
  --metric-transformations metricName=AdminPolicyAttached,metricNamespace=CloudTrailSecurity,metricValue=1

aws cloudwatch put-metric-alarm \
  --alarm-name ADMIN-POLICY-ATTACHED \
  --metric-name AdminPolicyAttached \
  --namespace CloudTrailSecurity \
  --statistic Sum \
  --period 60 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:111111111111:critical-security-alerts

# 5. KMS key deletion/disabling
aws logs put-metric-filter \
  --log-group-name /aws/cloudtrail/organization \
  --filter-name KMSKeyDeletion \
  --filter-pattern '{ $.eventSource = "kms.amazonaws.com" && ($.eventName = DisableKey || $.eventName = ScheduleKeyDeletion) }' \
  --metric-transformations metricName=KMSKeyDeletion,metricNamespace=CloudTrailSecurity,metricValue=1

aws cloudwatch put-metric-alarm \
  --alarm-name KMS-KEY-DELETION \
  --metric-name KMSKeyDeletion \
  --namespace CloudTrailSecurity \
  --statistic Sum \
  --period 60 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:111111111111:critical-security-alerts
```

**Step 4: Automated Response Lambda**:
```python
# Lambda function triggered by SNS (security alerts)
import boto3
import json

iam = boto3.client('iam')
sns = boto3.client('sns')
logs = boto3.client('logs')

def lambda_handler(event, context):
    """
    Automated security response:
    - Root usage: Alert CISO
    - Unauthorized calls: Investigate user, potentially suspend
    - Admin policy attached: Review and alert
    """
    message = event['Records'][0]['Sns']['Message']
    
    # Parse CloudWatch alarm
    alarm = json.loads(message)
    alarm_name = alarm['AlarmName']
    
    if alarm_name == 'ROOT-ACCOUNT-USAGE':
        # Critical: Root account used
        # Action: Alert CISO immediately
        sns.publish(
            TopicArn='arn:aws:sns:us-east-1:111111111111:ciso-alerts',
            Subject='🚨 CRITICAL: Root Account Usage Detected',
            Message=f"""
ROOT ACCOUNT USAGE DETECTED

The root account was used, which violates security policy.

Action Required:
1. Investigate immediately (CloudTrail logs)
2. Verify if legitimate (billing/account management)
3. If unauthorized, assume compromise:
   - Reset root password
   - Revoke root access keys
   - Enable MFA if not already
   - Audit all account changes

See CloudTrail logs in CloudWatch Logs group: /aws/cloudtrail/organization
            """
        )
    
    elif alarm_name == 'ADMIN-POLICY-ATTACHED':
        # Critical: Someone got admin access
        # Action: Review and potentially revoke
        
        # Query CloudWatch Logs for details
        response = logs.filter_log_events(
            logGroupName='/aws/cloudtrail/organization',
            filterPattern='{ $.eventName = "AttachUserPolicy" || $.eventName = "AttachRolePolicy" }',
            limit=10
        )
        
        for log_event in response['events']:
            event_detail = json.loads(log_event['message'])
            
            if 'AdministratorAccess' in event_detail.get('requestParameters', {}).get('policyArn', ''):
                user_arn = event_detail['userIdentity'].get('arn')
                target_user = event_detail['requestParameters'].get('userName')
                target_role = event_detail['requestParameters'].get('roleName')
                
                # Alert
                sns.publish(
                    TopicArn='arn:aws:sns:us-east-1:111111111111:security-team',
                    Subject='⚠️  Admin Policy Attached',
                    Message=f"""
AdministratorAccess Policy Attached

Granted by: {user_arn}
Target: {target_user or target_role}

Review Required:
1. Is this authorized?
2. Is it temporary (for specific task)?
3. Can it be revoked/replaced with least privilege?

If unauthorized, revoke immediately:
aws iam detach-user-policy --user-name {target_user} --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
                    """
                )
    
    elif alarm_name == 'UNAUTHORIZED-API-CALLS':
        # Multiple unauthorized calls (potential compromise)
        # Action: Investigate user, potentially suspend
        
        response = logs.filter_log_events(
            logGroupName='/aws/cloudtrail/organization',
            filterPattern='{ $.errorCode = "*UnauthorizedOperation" || $.errorCode = "AccessDenied*" }',
            limit=20
        )
        
        # Count by user
        user_failures = {}
        for log_event in response['events']:
            event_detail = json.loads(log_event['message'])
            user_arn = event_detail['userIdentity'].get('arn', 'Unknown')
            
            if user_arn not in user_failures:
                user_failures[user_arn] = 0
            user_failures[user_arn] += 1
        
        # Suspend users with >10 failures (potential brute force/compromise)
        for user_arn, failure_count in user_failures.items():
            if failure_count > 10 and 'user/' in user_arn:
                username = user_arn.split('user/')[-1]
                
                # Suspend user (attach deny-all policy)
                try:
                    iam.put_user_policy(
                        UserName=username,
                        PolicyName='AutoSuspension-UnauthorizedActivity',
                        PolicyDocument=json.dumps({
                            'Version': '2012-10-17',
                            'Statement': [{
                                'Effect': 'Deny',
                                'Action': '*',
                                'Resource': '*'
                            }]
                        })
                    )
                    
                    sns.publish(
                        TopicArn='arn:aws:sns:us-east-1:111111111111:critical-security-alerts',
                        Subject=f'🔒 USER SUSPENDED: {username}',
                        Message=f"""
User Automatically Suspended Due to Excessive Unauthorized API Calls

User: {username}
Unauthorized Attempts: {failure_count}
Threshold: 10

Action Taken:
- User access suspended (deny-all policy attached)
- All API calls blocked

Next Steps:
1. Investigate user activity (CloudTrail)
2. Check for compromised credentials
3. Contact user to verify activity
4. Remove suspension policy if false positive
                        """
                    )
                except Exception as e:
                    print(f"Failed to suspend user {username}: {e}")
    
    return {'statusCode': 200}
```

**Step 5: CloudTrail Lake (7-Year Retention)**:
```bash
# Create event data store
aws cloudtrail create-event-data-store \
  --name OrganizationSecurityAuditStore \
  --retention-period 2555 \
  --multi-region-enabled \
  --organization-enabled \
  --advanced-event-selectors '[
    {
      "Name": "All management events",
      "FieldSelectors": [
        {"Field": "eventCategory", "Equals": ["Management"]}
      ]
    },
    {
      "Name": "IAM events",
      "FieldSelectors": [
        {"Field": "eventCategory", "Equals": ["Management"]},
        {"Field": "eventSource", "Equals": ["iam.amazonaws.com"]}
      ]
    },
    {
      "Name": "S3 data events for sensitive buckets",
      "FieldSelectors": [
        {"Field": "eventCategory", "Equals": ["Data"]},
        {"Field": "resources.type", "Equals": ["AWS::S3::Object"]},
        {"Field": "resources.ARN", "StartsWith": [
          "arn:aws:s3:::sensitive-",
          "arn:aws:s3:::compliance-",
          "arn:aws:s3:::audit-"
        ]}
      ]
    }
  ]'
```

**Step 6: S3 Lifecycle (Cost Optimization)**:
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket cloudtrail-org-logs-central \
  --lifecycle-configuration '{
    "Rules": [
      {
        "Id": "CloudTrail-Retention-Policy",
        "Status": "Enabled",
        "Transitions": [
          {
            "Days": 90,
            "StorageClass": "GLACIER"
          },
          {
            "Days": 365,
            "StorageClass": "DEEP_ARCHIVE"
          }
        ],
        "Expiration": {
          "Days": 2555
        }
      }
    ]
  }'
```

**Compliance & Security Achieved**:
```
✅ Unauthorized Access Detection:
   - Metric filter on UnauthorizedOperation/AccessDenied
   - Alarm triggers after 5 failures in 5 minutes
   - Lambda auto-suspends user after 10 failures
   - SNS alert to security team

✅ Root Usage Detection:
   - Metric filter on root account API calls
   - Immediate alarm (within 1 minute)
   - SNS alert to CISO
   - Playbook: Investigate, verify, mitigate

✅ Privilege Escalation Detection:
   - Metric filter on AttachUserPolicy/AttachRolePolicy with AdministratorAccess
   - Alarm triggers immediately
   - Lambda alerts security team
   - Manual review required (potential legitimate, but high risk)

✅ 7-Year Retention:
   - S3: 7 years with lifecycle (90 days Standard, 275 days Glacier, rest Deep Archive)
   - CloudTrail Lake: 7 years queryable (SQL)
   - Log file validation: Enabled (detect tampering)
   - Immutability: S3 versioning + deny delete policy

✅ Audit Trail Integrity:
   - Log file validation (SHA-256 hashes + digest files)
   - KMS encryption (at rest)
   - S3 versioning (protect against deletion)
   - MFA delete (future enhancement, requires root)
   - Deny delete policy (except security admin)

✅ Real-Time Alerting:
   - CloudWatch Logs streaming (real-time)
   - Metric filters (pattern matching)
   - Alarms (threshold-based)
   - SNS notifications (multi-tier: security team, CISO)
   - Lambda automated response (suspend user, revoke key)

✅ Organization-Wide Coverage:
   - 200 accounts auto-logged
   - New accounts auto-included
   - Centralized S3 bucket
   - Centralized CloudWatch Logs
   - Centralized CloudTrail Lake
```

**Cost Estimate** (200 accounts, 1 year):
```
Management Events: FREE (first copy)
S3 Storage:
  - Ingestion: 2 TB/month
  - Standard (90 days): 2,000 GB × (90/365) × $0.023 = $11.37/month
  - Glacier (275 days): 2,000 GB × (275/365) × $0.004 = $6.03/month
  - Deep Archive (rest): Minimal first year
  - Total S3: ~$208/year

CloudWatch Logs:
  - Ingestion: 500 GB/month × $0.50 = $250/month
  - Storage (90 days): 500 GB × (90/365) × $0.03 = $3.70/month
  - Total CW Logs: ~$3,044/year

CloudTrail Lake:
  - Ingestion: 200 GB/month × $2.50 = $500/month
  - Storage: 200 GB × 12 × $0.023 = $55.20/year
  - Queries: ~$50/month = $600/year
  - Total Lake: ~$6,655/year

CloudTrail Insights:
  - 100M write events/month × ($0.35/100K) = $350/month = $4,200/year

Total Annual Cost: ~$14,107

For 200 accounts: ~$70 per account per year
```

**Summary**:
- **Detection**: Root usage, unauthorized calls, privilege escalation, KMS deletion, console login without MFA
- **Response**: Automated suspension (>10 unauthorized calls), SNS alerts (multi-tier), Lambda remediation
- **Compliance**: 7-year retention, log file validation, encryption, audit trail integrity
- **Coverage**: 200 accounts, organization-wide, multi-region, automatic new account inclusion
- **Cost**: ~$14K/year for comprehensive security monitoring across 200 accounts

---

This comprehensive AWS CloudTrail guide covers all aspects needed for SAP-C02 certification with organization trails, CloudTrail Lake, Insights, security analysis patterns, and real-world multi-account security architectures!
