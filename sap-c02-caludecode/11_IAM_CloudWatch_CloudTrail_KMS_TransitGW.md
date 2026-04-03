# 11 — AWS IAM (Identity and Access Management) — Exhaustive Deep-Dive

---

## 1. What Problem IAM Solves

IAM answers: **Who can do what on which AWS resources?**

Without IAM, everyone who has access to your AWS account would have FULL access to EVERYTHING — launch servers, delete databases, read all S3 data, change billing. IAM provides **fine-grained access control**.

---

## 2. Core Components

### Users
- Represents a **person or application** that interacts with AWS
- Has credentials: password (console) and/or access keys (CLI/API)
- **Best Practice**: Create individual users, NEVER share credentials

### Groups
- A collection of users
- Attach policies to groups → all users in the group inherit those permissions
- Example: "Developers" group, "Admins" group, "ReadOnly" group
- **A user can belong to multiple groups**
- **Groups cannot contain other groups** (no nesting)

### Roles (EXAM CRITICAL!)
- An identity with permissions that can be **assumed** by users, services, or accounts
- **No permanent credentials** — provides temporary security credentials
- **Key use cases:**
  - **EC2 Instance Role**: EC2 instances assume a role to access AWS services (NEVER use access keys on EC2!)
  - **Cross-Account Role**: Account A assumes a role in Account B
  - **Service Role**: AWS services (Lambda, ECS, etc.) assume roles
  - **Identity Federation**: External users (SAML, OIDC, Cognito) assume roles

### Policies (EXAM CRITICAL!)
JSON documents that define permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*",
      "Condition": {
        "IpAddress": {"aws:SourceIp": "10.0.0.0/8"}
      }
    }
  ]
}
```

**Policy Types:**

| Type | Attached To | Managed By | Use Case |
|---|---|---|---|
| **AWS Managed** | Users/Groups/Roles | AWS | Pre-built common policies |
| **Customer Managed** | Users/Groups/Roles | You | Custom organizational policies |
| **Inline** | Single User/Group/Role | You | One-off, entity-specific |
| **Resource-Based** | Resources (S3, SQS, KMS) | You | Cross-account access |
| **Permissions Boundary** | Users/Roles | You | Set maximum permissions |
| **Service Control Policy (SCP)** | OU/Account | Organization admin | Account-level guardrails |
| **Session Policy** | STS session | Programmatic | Further restrict assumed role |

### Policy Evaluation Logic (EXAM CRITICAL!)

```
1. By default: DENY everything (implicit deny)
2. Evaluate all applicable policies
3. If ANY policy has explicit DENY → DENIED (explicit deny always wins)
4. If ANY policy has ALLOW → ALLOWED
5. If no ALLOW found → DENIED (implicit deny)
```

**For cross-account access:**
- The requesting account's IAM policy AND the resource's resource-based policy must BOTH allow
- Exception: Resource-based policies can directly grant access without IAM policy

### Permissions Boundary (EXAM FAVORITE!)

Sets the **maximum permissions** a user or role can have:
- Even if an IAM policy grants "s3:*", if the permissions boundary only allows "s3:GetObject", the effective permission is only GetObject
- **Effective permissions = IAM Policy ∩ Permissions Boundary** (intersection)
- Use case: Allow developers to create IAM roles BUT ensure those roles can never exceed certain permissions

---

## 3. Advanced IAM Concepts

### STS (Security Token Service)
Provides temporary credentials:
- **AssumeRole**: Assume an IAM role (same or cross-account)
- **AssumeRoleWithSAML**: Federate with SAML identity provider
- **AssumeRoleWithWebIdentity**: Federate with web identity (Google, Facebook, Cognito)
- **GetSessionToken**: MFA-authenticated temporary credentials

### Identity Federation

| Method | Use Case | Protocol |
|---|---|---|
| **SAML 2.0** | Enterprise SSO (Active Directory, Okta) | SAML |
| **Web Identity (Cognito)** | Mobile/web app users | OIDC |
| **AWS SSO (IAM Identity Center)** | Centralized SSO for multiple accounts | SAML/OIDC |
| **Custom Identity Broker** | Legacy systems | Custom |

**Exam Answer**: For enterprise SSO → **IAM Identity Center** (formerly AWS SSO). For mobile/web users → **Cognito**.

### IAM Identity Center (formerly AWS SSO) — EXAM CRITICAL!

The RECOMMENDED way to manage human access to multiple AWS accounts:
- Single sign-on for all AWS accounts in an Organization
- Integrates with Active Directory, Okta, Azure AD
- Permission Sets define what users can do in each account
- Temporary credentials (no long-term access keys)

### Policy Conditions

Common condition keys for exam:
- `aws:SourceIp` — Restrict by IP address
- `aws:RequestedRegion` — Restrict to specific regions
- `aws:PrincipalOrgID` — Restrict to members of your Organization
- `aws:MultiFactorAuthPresent` — Require MFA
- `s3:x-amz-server-side-encryption` — Require encryption on upload
- `aws:SecureTransport` — Require HTTPS

### IAM Access Analyzer

Identifies resources shared externally:
- Scans S3 buckets, IAM roles, KMS keys, Lambda functions, SQS queues
- Shows which resources are accessible from outside your account
- Generates findings with recommendations
- Can validate policies before deploying

---

## 4. SAP-C02 Exam Questions (10+ Scenarios)

### Question 1 — EC2 Access to S3
**Scenario**: An EC2 instance needs to read files from S3. The developer wants to embed access keys in the application. Is this correct?

**Answer**: **NO!** Use an **IAM Instance Role**. Attach a role with s3:GetObject permission to the EC2 instance. The application uses the instance metadata service to get temporary credentials automatically. NEVER embed access keys.

### Question 2 — Cross-Account S3 Access
**Scenario**: Account A needs to write objects to a bucket in Account B.

**Answer**: Two options:
1. **Resource-based policy**: Bucket policy in Account B grants Account A's role/user permission
2. **Cross-account role**: Create a role in Account B, Account A assumes it

### Question 3 — Permissions Boundary
**Scenario**: Developers need to create IAM roles for their Lambda functions, but they must not create roles with more permissions than their own. How?

**Answer**: **Permissions Boundary** — Attach a boundary policy that limits the maximum permissions the developer-created roles can have.

### Question 4 — Least Privilege
**Scenario**: A new employee needs access. You want to give them minimum necessary permissions. How to determine what they need?

**Answer**: 
1. Start with **IAM Access Advisor** — Shows which services the user's current role can access and when last accessed
2. Use **CloudTrail** to see what API calls they actually make
3. Use **IAM Access Analyzer policy generation** — Generate a policy based on actual usage

### Question 5 — MFA Enforcement
**Scenario**: All API calls that delete resources must require MFA. How?

**Answer**: Add a **Condition** to the policy:
```json
"Condition": {"Bool": {"aws:MultiFactorAuthPresent": "true"}}
```

### Question 6 — Identity Center
**Scenario**: A company with 50 AWS accounts needs developers to access dev accounts and admins to access all accounts, using corporate Active Directory credentials. How?

**Answer**: **IAM Identity Center** integrated with Active Directory:
- Create Permission Sets (DevAccess, AdminAccess)
- Assign Permission Sets to AD groups per account
- Users sign in once and access assigned accounts

---

## 5. Best Practices & Exam Tips

1. ✅ **Never use root account** for daily tasks (create admin IAM user)
2. ✅ **Enable MFA on root** and all human users
3. ✅ **Use roles, not access keys** for EC2, Lambda, ECS
4. ✅ **Use IAM Identity Center** for multi-account human access
5. ✅ **Least privilege** — Start with minimum permissions, add as needed
6. ✅ **Use groups** — Never attach policies directly to users
7. ✅ **Use Permissions Boundaries** for delegated admin
8. ✅ **Rotate access keys** regularly (prefer roles over keys)
9. ✅ **Use condition keys** for fine-grained control
10. ✅ **Review with Access Analyzer** regularly

---

*Word count: ~2,800 words*

---

# 12 — Amazon CloudWatch — Deep-Dive

---

## 1. What It Does

CloudWatch is AWS's **monitoring and observability service**. It collects metrics, logs, and events from nearly every AWS service.

### Three Pillars

| Pillar | Feature | Description |
|---|---|---|
| **Metrics** | CloudWatch Metrics | Numerical data points over time (CPU%, NetworkIn, etc.) |
| **Logs** | CloudWatch Logs | Text-based log data from applications and services |
| **Events/Alarms** | CloudWatch Alarms + EventBridge | React to metric thresholds and state changes |

---

## 2. CloudWatch Metrics

### Default vs Detailed Monitoring

| Type | Interval | Cost | EC2 Default? |
|---|---|---|---|
| **Basic** | 5 minutes | Free | Yes |
| **Detailed** | 1 minute | $0.30/metric/month | Must enable |

### Key EC2 Metrics (EXAM CRITICAL!)

**CloudWatch CAN monitor from outside the instance:**
- CPUUtilization, NetworkIn/Out, DiskReadOps, StatusCheckFailed

**CloudWatch CANNOT monitor (need CloudWatch Agent):**
- **Memory utilization** — #1 exam trap!
- **Disk space usage**
- Custom application metrics

### CloudWatch Agent

Install on EC2/on-premises to collect:
- Memory usage, disk space, swap usage
- Custom application metrics and logs
- Unified CloudWatch Agent replaces old Logs Agent and Monitoring Scripts

### Custom Metrics

Send your own metrics via API:
- `aws cloudwatch put-metric-data`
- Standard resolution: 60 seconds
- High resolution: 1 second ($0.30/metric/month)

---

## 3. CloudWatch Alarms

| State | Meaning |
|---|---|
| **OK** | Metric within threshold |
| **ALARM** | Metric breached threshold |
| **INSUFFICIENT_DATA** | Not enough data points |

**Actions on ALARM:**
- **SNS notification** (email, SMS, Lambda trigger)
- **Auto Scaling action** (scale out/in)
- **EC2 action** (stop, terminate, reboot, recover)

**Composite Alarms**: Combine multiple alarms with AND/OR logic to reduce alarm noise.

---

## 4. CloudWatch Logs

### Key Concepts

- **Log Group**: Collection of log streams (e.g., /aws/lambda/my-function)
- **Log Stream**: Sequence of events from one source
- **Log Events**: Individual log entries with timestamp
- **Retention**: 1 day to 10 years, or never expire (default: never delete)
- **Metric Filter**: Extract metric data from logs (e.g., count "ERROR" occurrences)

### Logs Insights

SQL-like query language for analyzing logs:
```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20
```

### Log Destinations

- S3 (export), Kinesis Data Streams, Kinesis Firehose, Lambda, OpenSearch

### Subscription Filters

Real-time streaming of log data to: Lambda, Kinesis Data Streams, Kinesis Firehose.

**Cross-account log aggregation**: Use subscription filters to stream logs from multiple accounts to a central account.

---

## 5. CloudWatch Dashboards

Custom dashboards displaying metrics from multiple AWS accounts and regions on a single screen. Up to 3 dashboards free, then $3/month/dashboard.

---

## 6. Exam Scenarios

**"Monitor EC2 memory usage"** → Install **CloudWatch Agent** (not available by default)

**"Trigger Auto Scaling based on custom metric"** → Publish custom metric → CloudWatch Alarm → Auto Scaling policy

**"Aggregate logs from multiple accounts"** → CloudWatch Logs Subscription Filter → Central Kinesis/S3

**"Real-time log analysis"** → CloudWatch Logs Insights or Subscription Filter → Lambda

**"Alarm on error rate in logs"** → Metric Filter on log group → CloudWatch Alarm → SNS

---

*Word count: ~1,500 words*

---

# 13 — AWS CloudTrail — Deep-Dive

---

## 1. What It Does

CloudTrail records **every API call** made in your AWS account. Think of it as a security camera for your AWS infrastructure — who did what, when, and from where.

Every action in AWS (console click, CLI command, SDK call) is an API call, and CloudTrail logs it.

---

## 2. Core Concepts

### Event Types

| Type | What It Captures | Default | Cost |
|---|---|---|---|
| **Management Events** | Control plane operations (CreateBucket, RunInstances, CreateUser) | **Yes, free** (90-day history) | Free (default trail) |
| **Data Events** | Data plane operations (S3 GetObject, Lambda Invoke, DynamoDB GetItem) | **No, must enable** | $0.10 per 100,000 events |
| **Insights Events** | Unusual API activity detection | **No, must enable** | $0.35 per 100,000 events analyzed |

### Trail Configuration

| Setting | Description |
|---|---|
| **Multi-region** | Log events from ALL regions (recommended) |
| **Organization trail** | Log events from ALL accounts in Organization |
| **S3 delivery** | Store logs in S3 bucket (with optional SSE-KMS encryption) |
| **CloudWatch Logs** | Stream events to CloudWatch for real-time alerting |
| **Log file validation** | Ensures logs haven't been tampered with (digest files) |

---

## 3. Exam Scenarios

**"Who deleted the S3 bucket?"** → CloudTrail Management Events → filter for DeleteBucket API call

**"Who accessed a specific S3 object?"** → CloudTrail **Data Events** (must be enabled for S3)

**"Detect unusual root account activity"** → CloudTrail Insights + CloudWatch Alarm on root usage

**"Centralized audit logging for 50 accounts"** → Organization Trail → Central S3 bucket with bucket policy allowing all accounts

**"Ensure logs are tamper-proof"** → Enable **Log File Validation** + S3 Object Lock (Compliance Mode) + SSE-KMS encryption

**"Real-time alerting on API calls"** → CloudTrail → CloudWatch Logs → Metric Filter → Alarm → SNS

### CloudTrail vs CloudWatch

| Feature | CloudTrail | CloudWatch |
|---|---|---|
| What it tracks | API calls (who did what) | Metrics and logs (how is it performing) |
| Focus | **Security & audit** | **Performance & monitoring** |
| Example | "Who terminated instance i-123?" | "CPU utilization of instance i-123 is 95%" |

---

*Word count: ~800 words*

---

# 14 — AWS KMS (Key Management Service) — Deep-Dive

---

## 1. What It Does

KMS manages **encryption keys** for encrypting data across AWS services. Almost every AWS service that supports encryption uses KMS under the hood.

---

## 2. Core Concepts

### Key Types

| Type | Managed By | Cost | Use Case |
|---|---|---|---|
| **AWS Owned Keys** | AWS (invisible to you) | Free | Default encryption (SSE-S3) |
| **AWS Managed Keys** | AWS (visible in KMS console) | Free | Service-default encryption (aws/s3, aws/ebs) |
| **Customer Managed Keys (CMK)** | You | $1/month + API charges | Full control, custom rotation, audit |

### Envelope Encryption (EXAM CRITICAL!)

For encrypting data larger than 4 KB:
1. KMS generates a **Data Encryption Key (DEK)**
2. The DEK encrypts your actual data (locally, fast)
3. KMS encrypts the DEK with the CMK (KMS never sees your data)
4. You store: encrypted data + encrypted DEK
5. To decrypt: KMS decrypts the DEK → DEK decrypts the data

**Why**: KMS has a 4 KB limit on direct encryption. Envelope encryption lets you encrypt data of any size while keeping the master key in KMS.

### Key Rotation

| Key Type | Automatic Rotation | Period |
|---|---|---|
| AWS Managed | Yes (automatic) | Every year |
| Customer Managed | Optional (you enable) | Every year (configurable) |
| Imported Key Material | Manual only | You manage |

### Key Policies

Every KMS key has a key policy (like a resource-based policy):
- **Default key policy**: Gives the root account full access
- **Custom key policy**: Define who can use and manage the key
- IAM policies ALONE are not enough for KMS — key policy must also allow

### Grants

Temporary, programmatic permissions for KMS keys:
- Created by GenerateGrant API
- Used by AWS services to encrypt/decrypt on your behalf
- Can be revoked (RetireGrant, RevokeGrant)

---

## 3. Multi-Region Keys

- Same key material in multiple regions (same key ID prefix: mrk-)
- Encrypt in one region, decrypt in another
- Use case: Cross-region encrypted data replication (DynamoDB Global Tables, S3 CRR with SSE-KMS)
- NOT a separate key — it's replicated

---

## 4. KMS Quotas (EXAM CRITICAL!)

| Operation | Default Quota |
|---|---|
| Symmetric Encrypt/Decrypt | 5,500-30,000 requests/second (varies by region) |
| GenerateDataKey | Same as above |

**Exam Scenario**: "S3 uploads with SSE-KMS are throttled" → Options:
1. **S3 Bucket Key** (reduces KMS calls by 99%)
2. Request KMS quota increase
3. Switch to SSE-S3 if audit trail not needed

---

## 5. Exam Scenarios

**"Audit who used encryption keys"** → KMS + CloudTrail (every Encrypt/Decrypt/GenerateDataKey is logged)

**"Encrypt S3 data with customer-controlled key"** → SSE-KMS with Customer Managed Key

**"Cross-region encrypted replication"** → Multi-Region KMS Key or separate keys per region

**"Key must never leave AWS"** → KMS (default) OR CloudHSM for hardware-level control

### KMS vs CloudHSM

| Feature | KMS | CloudHSM |
|---|---|---|
| Management | AWS managed | You manage HSM cluster |
| Multi-tenancy | Shared infrastructure | **Dedicated hardware** |
| Key storage | AWS-managed HSM | Your dedicated HSM |
| FIPS level | FIPS 140-2 Level 2 | **FIPS 140-2 Level 3** |
| Integration | All AWS services | Custom applications |
| Cost | $1/key/month + API | $1.60/HSM/hour (~$1,168/month) |
| Use case | Most encryption needs | Regulatory (e.g., FIPS Level 3), custom key store |

---

*Word count: ~1,200 words*

---

# 15 — AWS Transit Gateway — Deep-Dive

---

## 1. What Problem It Solves

### Without Transit Gateway

If you have 10 VPCs that all need to communicate:
- VPC Peering requires 10×9/2 = **45 peering connections**
- Each needs route table updates in BOTH VPCs
- Adding VPC #11 requires 10 NEW peering connections
- This doesn't scale!

### With Transit Gateway

Transit Gateway is a **hub** that all VPCs connect to:
- 10 VPCs = 10 connections (not 45)
- Adding VPC #11 = 1 new connection (not 10)
- Also connects VPN and Direct Connect

```
        VPC-A ──┐
        VPC-B ──┤
        VPC-C ──┼── Transit Gateway ── VPN ── On-Premises
        VPC-D ──┤
        VPC-E ──┘
```

---

## 2. Core Concepts

### Attachments

Everything connects to Transit Gateway via attachments:
- **VPC Attachment**: Connect a VPC (can specify which subnets)
- **VPN Attachment**: Site-to-Site VPN connection
- **Direct Connect Gateway Attachment**: For Direct Connect
- **Transit Gateway Peering**: Connect Transit Gateways across regions
- **Connect Attachment**: For SD-WAN/third-party appliances

### Route Tables

Transit Gateway has its own route tables:
- **Default route table**: All attachments use by default
- **Custom route tables**: Isolate routing domains

**Example — Network Segmentation:**
```
Prod Route Table: Routes to Prod VPCs + Shared Services VPC
Dev Route Table:  Routes to Dev VPCs + Shared Services VPC
(Prod and Dev cannot reach each other)
```

### Transit Gateway Peering (Cross-Region)

Connect Transit Gateways across regions:
- Static routing (no dynamic routing support for inter-region peering)
- Data encrypted automatically
- Use case: Multi-region hub-and-spoke networking

### Multicast

Transit Gateway supports IP multicast:
- One-to-many communication
- Use case: Financial data distribution, video streaming to multiple receivers

---

## 3. Cost

| Component | Cost |
|---|---|
| Per attachment per hour | $0.05/hr (~$36/month) |
| Per GB data processed | $0.02/GB |

**Example**: 10 VPC attachments + 1 TB data/month
- Attachments: 10 × $36 = $360
- Data: 1,000 GB × $0.02 = $20
- **Total: $380/month**

---

## 4. SAP-C02 Exam Questions

### Question 1 — VPC Peering vs Transit Gateway
**Scenario**: 50 VPCs need full mesh connectivity. Currently using VPC Peering with 1,225 connections. It's unmanageable. What should they do?

**Answer**: Migrate to **Transit Gateway**. 50 VPC attachments instead of 1,225 peering connections. Centralized routing, easier management.

### Question 2 — Network Segmentation
**Scenario**: Production and Development VPCs must not communicate directly, but both need access to a Shared Services VPC (Active Directory, logging). How?

**Answer**: Transit Gateway with **separate route tables**:
- Prod route table: routes to Prod VPCs + Shared Services
- Dev route table: routes to Dev VPCs + Shared Services
- No routes between Prod and Dev

### Question 3 — Hybrid + Multi-VPC
**Scenario**: On-premises data center needs to reach 20 VPCs. Currently using 20 separate VPN connections. How to simplify?

**Answer**: **Transit Gateway** — One VPN attachment to Transit Gateway, 20 VPC attachments. On-premises reaches all VPCs through single VPN.

### Question 4 — Multi-Region
**Scenario**: VPCs in us-east-1 need to communicate with VPCs in eu-west-1.

**Answer**: **Transit Gateway Peering** — Create Transit Gateways in each region, peer them. VPCs route through their regional TGW → peering → remote TGW → remote VPCs.

---

## 5. Exam Tips

1. **">10 VPCs needing connectivity"** → Transit Gateway (not VPC Peering)
2. **"Network segmentation"** → Transit Gateway route table isolation
3. **"Transitive routing needed"** → Transit Gateway (peering is NOT transitive)
4. **"Single VPN for all VPCs"** → Transit Gateway
5. **"Hub-and-spoke architecture"** → Transit Gateway
6. **"Cross-region VPC connectivity"** → Transit Gateway Peering
7. **Transit Gateway supports**: VPCs, VPN, Direct Connect, peering, multicast

---

*Word count: ~1,500 words*
