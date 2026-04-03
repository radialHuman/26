# 26-30 — Organizations, Config, GuardDuty, CloudFormation, Step Functions

---

# 26 — AWS Organizations

## 1. What It Does

Centrally **manage multiple AWS accounts**. Instead of one big account, enterprises use multiple accounts for isolation (dev/staging/prod), security boundaries, and billing separation.

## 2. Core Concepts

### Organizational Units (OUs)

Hierarchical grouping of accounts:
```
Root
├── Production OU
│   ├── Prod Account A
│   └── Prod Account B
├── Development OU
│   ├── Dev Account A
│   └── Dev Account B
├── Security OU
│   ├── Log Archive Account
│   └── Security Tooling Account
└── Sandbox OU
    └── Sandbox Account
```

### Service Control Policies (SCPs) — EXAM CRITICAL!

JSON policies that set **maximum permissions** for accounts in an OU:
- SCPs do NOT grant permissions — they **restrict** what's possible
- Even if an IAM policy says "Allow s3:*", if the SCP doesn't allow S3, access is denied
- **SCP does NOT affect the management account** (management account always has full access)
- Applies to all users/roles in the account (including root user of the member account!)

**Example SCP — Deny All Except Specific Regions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Action": "*",
    "Resource": "*",
    "Condition": {
      "StringNotEquals": {
        "aws:RequestedRegion": ["us-east-1", "eu-west-1"]
      }
    }
  }]
}
```

### Consolidated Billing

All accounts share one bill:
- **Volume discounts** — Combined usage across all accounts qualifies for higher discount tiers
- **Reserved Instance sharing** — RI purchased in one account applies to matching instances in other accounts
- **Savings Plans sharing** — Similar to RI sharing

## 3. Multi-Account Strategy (EXAM PATTERN)

| Account | Purpose |
|---|---|
| **Management Account** | Billing, Organizations management (NEVER run workloads here) |
| **Log Archive Account** | Centralized CloudTrail, Config, VPC Flow Logs |
| **Security Tooling** | GuardDuty, Security Hub, access to security tools |
| **Shared Services** | Active Directory, DNS, CI/CD tools |
| **Production** | Production workloads |
| **Development** | Development and testing |
| **Sandbox** | Experimentation (strict SCPs to prevent cost overruns) |

## 4. Key Features

| Feature | Description |
|---|---|
| **AWS Control Tower** | Automated multi-account setup with best-practice guardrails |
| **Tag Policies** | Standardize tags across accounts |
| **Backup Policies** | Centralized backup rules |
| **AI Services Opt-out** | Control AI data usage across accounts |

## 5. Exam Scenarios

**"Prevent any account from launching in unapproved regions"** → SCP denying all actions outside approved regions
**"Share RIs across accounts"** → Enable RI sharing in Organizations
**"Centralized logging"** → Organization Trail → central S3 in Log Archive account
**"Automate multi-account setup"** → AWS Control Tower
**"Restrict member account root user"** → SCP (root user of member accounts IS affected by SCPs)
**"Billing separation by department"** → Separate accounts per department, consolidated billing

---

# 27 — AWS Config

## 1. What It Does

Continuously **records and evaluates** the configuration of your AWS resources. Answers: "What does my infrastructure look like right now, and has it changed from what's expected?"

Think of it as a **compliance auditor** that watches your infrastructure 24/7.

## 2. Core Concepts

### Config Rules

Evaluate whether resource configurations comply with your policies:

| Type | Description | Example |
|---|---|---|
| **AWS Managed Rules** | Pre-built by AWS (250+) | "Are all EBS volumes encrypted?" |
| **Custom Rules** | Lambda functions you write | "Do all EC2 instances have required tags?" |

Rules are evaluated:
- **On configuration change** — When a resource changes
- **Periodic** — Every 1, 3, 6, 12, or 24 hours

### Config Recorder

Records configuration changes to resources:
- Records: resource type, relationships, configuration details, who changed it
- Stores: Configuration items in S3 + Configuration timeline

### Remediation

Auto-fix non-compliant resources:
- **Automatic remediation** — SSM Automation documents fix issues automatically
- Example: EBS volume detected without encryption → SSM document creates encrypted copy

### Aggregator

Aggregate Config data from multiple accounts and regions into a single dashboard.

## 3. Exam Scenarios

**"Ensure all S3 buckets have encryption enabled"** → Config Rule (s3-bucket-server-side-encryption-enabled)
**"Track all configuration changes for compliance"** → AWS Config Recorder
**"Auto-fix non-compliant resources"** → Config Rule + Auto Remediation (SSM Automation)
**"View configuration history of a resource"** → Config Timeline
**"Organization-wide compliance dashboard"** → Config Aggregator
**"Detective control"** → Config (detects non-compliance). "Preventive control" → SCP (prevents actions)

### Config vs CloudTrail

| Feature | Config | CloudTrail |
|---|---|---|
| Focus | **What is the configuration?** | **Who did what?** |
| Question answered | "Is this S3 bucket encrypted?" | "Who created this S3 bucket?" |
| Type | Compliance/configuration | Audit/security |

---

# 28 — Amazon GuardDuty

## 1. What It Does

Intelligent **threat detection** service. Continuously monitors for malicious activity and unauthorized behavior.

## 2. Data Sources

GuardDuty analyzes:
- **CloudTrail Management Events** — Unusual API calls (e.g., someone disabling CloudTrail)
- **CloudTrail S3 Data Events** — Suspicious S3 access patterns
- **VPC Flow Logs** — Unusual network traffic (port scanning, C2 communication)
- **DNS Logs** — Queries to known malicious domains
- **EKS Audit Logs** — Kubernetes-level threats
- **RDS Login Events** — Brute force database access
- **Lambda Network Activity** — Unusual Lambda networking
- **Runtime Monitoring** — EC2/EKS/ECS runtime behavior

## 3. How It Works

- Uses **machine learning**, anomaly detection, and threat intelligence (known malicious IPs/domains)
- Generates **findings** with severity: Low, Medium, High
- Findings sent to: EventBridge (→ Lambda, SNS, etc.), Security Hub
- **No performance impact** — Doesn't read your data, only analyzes metadata/logs

## 4. Key Feature: Multi-Account

- Designate a **delegated administrator** account
- Automatically monitors all accounts in the Organization
- Centralized findings in the admin account

## 5. Exam Scenarios

**"Detect cryptocurrency mining on EC2"** → GuardDuty (has specific finding type for this)
**"Detect compromised EC2 instances communicating with known botnet"** → GuardDuty (VPC Flow Logs analysis)
**"Detect unauthorized API calls"** → GuardDuty (CloudTrail analysis)
**"Automated response to threats"** → GuardDuty finding → EventBridge → Lambda (isolate instance, create snapshot)
**"Enable threat detection across all accounts"** → GuardDuty with Organization integration

### Security Service Comparison

| Service | Purpose |
|---|---|
| **GuardDuty** | Threat detection (finds attacks) |
| **Inspector** | Vulnerability scanning (finds weaknesses) |
| **Macie** | Sensitive data discovery in S3 (PII, financial) |
| **Security Hub** | Aggregates findings from all security services |
| **Detective** | Root cause investigation (after GuardDuty finds something) |

---

# 29 — AWS CloudFormation

## 1. What It Does

**Infrastructure as Code (IaC)** — Define your entire AWS infrastructure in JSON/YAML templates. CloudFormation creates, updates, and deletes resources automatically.

**Why IaC matters:**
- Repeatable deployments (same template → same infrastructure every time)
- Version control (store templates in Git)
- Audit trail (who changed what in the template)
- No manual console clicking (reduces human error)

## 2. Core Concepts

### Template

A YAML/JSON file defining resources:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-unique-bucket
      VersioningConfiguration:
        Status: Enabled
  
  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      ImageId: ami-0abcdef1234567890
```

### Template Sections

| Section | Required? | Description |
|---|---|---|
| **AWSTemplateFormatVersion** | No | Template version (always "2010-09-09") |
| **Description** | No | Template description |
| **Parameters** | No | Input values at deploy time |
| **Mappings** | No | Key-value lookup tables |
| **Conditions** | No | Conditional resource creation |
| **Resources** | **YES** | AWS resources to create |
| **Outputs** | No | Values to export/display |

### Stack

A collection of resources created from a template:
- Create stack → all resources created
- Delete stack → all resources deleted (in dependency order)
- Update stack → CloudFormation figures out what changed and updates only those resources

### Stack Sets

Deploy stacks across **multiple accounts and regions**:
- Managed from a central account
- Update one StackSet → updates all stacks
- Use with Organizations for account-wide deployments

### Change Sets

Preview changes before applying:
1. Create change set → see what will be added/modified/deleted
2. Review → approve or reject
3. Execute → apply changes

### Drift Detection

Detect if resources have been manually changed outside CloudFormation:
- "Drifted" = actual configuration differs from template
- Helps maintain IaC discipline

## 3. Key Features

| Feature | Description |
|---|---|
| **Nested Stacks** | Templates that call other templates (modular IaC) |
| **Cross-Stack References** | Export values from one stack, import in another |
| **Custom Resources** | Lambda-backed resources for anything CloudFormation doesn't support |
| **Rollback** | Automatic rollback on failure (can disable for debugging) |
| **DeletionPolicy** | Retain, Snapshot, or Delete resources when stack is deleted |
| **cfn-init** | Configure EC2 instances during launch (install packages, create files) |
| **cfn-signal** | Signal CloudFormation that instance setup is complete |

### DeletionPolicy (EXAM IMPORTANT)

| Policy | What Happens When Stack is Deleted |
|---|---|
| **Delete** (default) | Resource is deleted |
| **Retain** | Resource is kept (orphaned) |
| **Snapshot** | Creates a snapshot before deletion (RDS, EBS) |

## 4. CloudFormation vs Terraform vs CDK

| Feature | CloudFormation | Terraform | CDK |
|---|---|---|---|
| Provider | AWS only | Multi-cloud | AWS only |
| Language | JSON/YAML | HCL | TypeScript, Python, Java, C# |
| State | AWS-managed | You manage state file | Compiles to CloudFormation |
| Cost | Free | Free (open source) | Free |

## 5. Exam Scenarios

**"Repeatable, consistent infrastructure deployment"** → CloudFormation
**"Deploy same stack to 50 accounts"** → CloudFormation StackSets
**"Preview infrastructure changes before applying"** → Change Sets
**"Detect manual changes to infrastructure"** → Drift Detection
**"Keep RDS database when deleting stack"** → DeletionPolicy: Retain (or Snapshot)
**"Modular templates"** → Nested Stacks
**"Define infrastructure using Python"** → AWS CDK (compiles to CloudFormation)

---

# 30 — AWS Step Functions

## 1. What It Does

A **serverless orchestration** service that lets you coordinate multiple AWS services into workflows (state machines). Visual workflow designer.

## 2. Why You Need It

Lambda functions have a 15-minute timeout. For complex, multi-step processes that take longer:
- Step 1: Process uploaded file (Lambda, 5 min)
- Step 2: Wait for human approval
- Step 3: Run data transformation (Lambda, 10 min)
- Step 4: Load into database (Lambda, 5 min)

Step Functions orchestrates this entire flow, handling retries, error handling, parallelism, and waiting.

## 3. Workflow Types

| Type | Max Duration | Execution Rate | Cost | Use Case |
|---|---|---|---|---|
| **Standard** | Up to 1 year | 2,000/sec | $0.025/1,000 transitions | Long-running, auditable workflows |
| **Express** | 5 minutes | 100,000/sec | $0.00001667/GB-second | High-volume, short workflows (IoT, streaming) |

## 4. State Types

| State | What It Does |
|---|---|
| **Task** | Execute work (Lambda, ECS, DynamoDB, SQS, SNS, Glue, SageMaker, etc.) |
| **Choice** | Branching logic (if/else) |
| **Parallel** | Execute branches simultaneously |
| **Map** | Iterate over an array (for-each loop) |
| **Wait** | Delay for specified time |
| **Pass** | Pass input to output (transformation) |
| **Succeed/Fail** | End the workflow |

## 5. Key Features

| Feature | Description |
|---|---|
| **Error Handling** | Retry with exponential backoff, Catch for specific errors |
| **Service Integrations** | 200+ AWS services (direct SDK integration) |
| **Human Approval** | Wait for callback (task token pattern) |
| **Map State** | Process thousands of items in parallel |
| **Distributed Map** | Process millions of items from S3 |
| **Visual Workflow** | Drag-and-drop designer in console |

## 6. Exam Scenarios

**"Orchestrate multiple Lambda functions"** → Step Functions
**"Long-running workflow (hours/days)"** → Step Functions Standard (not Lambda!)
**"Process millions of S3 objects"** → Step Functions Distributed Map
**"Wait for human approval in a workflow"** → Step Functions with Task Token + callback
**"Parallel processing of independent tasks"** → Step Functions Parallel state
**"Retry failed tasks with backoff"** → Step Functions built-in error handling
**"ETL workflow: Glue → Lambda → Redshift"** → Step Functions orchestrating all three

### Step Functions vs SQS/SNS

| Feature | Step Functions | SQS/SNS |
|---|---|---|
| Orchestration | **Central coordinator** | No coordinator (each service independent) |
| Visibility | Visual workflow, execution history | No workflow view |
| Error handling | Built-in retry/catch | Must build yourself |
| Use case | Complex multi-step workflows | Simple async messaging |

---

*Combined word count: ~4,200+ words for services 26-30*
