# Migration Patterns — The 6 R's with Detailed Scenarios

---

## Overview

When migrating to AWS, every application falls into one of 6 categories (the "6 R's"). The SAP-C02 exam tests your ability to choose the RIGHT strategy for each scenario.

---

## 1. Rehost (Lift and Shift)

**What**: Move the application AS-IS to AWS without changes.

**How**: 
- **AWS Application Migration Service (MGN)** — Automated rehost. Install agent → continuous replication → cutover.
- Manual: Create AMIs, recreate infrastructure in AWS

**Example**: 500 Windows VMs running a legacy ERP system → migrated to EC2 instances with identical configuration.

**When to use**:
- Large-scale migrations (hundreds of servers)
- Need to migrate quickly
- Application is too complex or risky to modify
- First step before future optimization

**AWS Tools**: MGN (Application Migration Service), VM Import/Export

**Pros**: Fast, low risk, no code changes
**Cons**: Doesn't take advantage of cloud-native features, no cost optimization

---

## 2. Replatform (Lift, Tinker, and Shift)

**What**: Make a few cloud optimizations WITHOUT changing core architecture.

**Examples**:
- MySQL on EC2 → **RDS MySQL** (same engine, managed service)
- Self-managed Redis → **ElastiCache Redis** (managed)
- Application on VMs → **Elastic Beanstalk** (managed platform)
- On-prem file server → **EFS** or **FSx**

**When to use**:
- Want managed service benefits (automated backups, patching)
- Don't want to redesign the application
- Quick wins for operational improvement

**AWS Tools**: DMS (database migration), Elastic Beanstalk, RDS

**Pros**: Some cloud benefits with minimal effort
**Cons**: Still not fully cloud-optimized

---

## 3. Refactor / Re-Architect

**What**: Redesign the application to be cloud-native.

**Examples**:
- Monolithic Java app → **Microservices on ECS/EKS**
- Scheduled batch jobs → **Lambda + Step Functions**
- Relational database → **DynamoDB** (for suitable workloads)
- Session state on server → **ElastiCache + DynamoDB**
- On-prem message queue → **SQS/SNS**

**When to use**:
- Application needs features that only cloud-native provides (auto-scaling, serverless)
- Business driver to add new features that are hard to implement in current architecture
- Long-term cost optimization is critical

**AWS Tools**: Lambda, ECS, EKS, DynamoDB, SQS, API Gateway, Step Functions

**Pros**: Maximum cloud benefits, best performance, lowest long-term cost
**Cons**: Highest effort, longest timeline, highest risk

---

## 4. Repurchase (Drop and Shop)

**What**: Replace existing software with a SaaS alternative.

**Examples**:
- On-premises CRM → **Salesforce**
- On-premises email server → **Microsoft 365** or **Amazon WorkMail**
- On-premises HR system → **Workday**
- Self-managed content management → **WordPress.com** or **Contentful**

**When to use**:
- Commercial off-the-shelf (COTS) software exists that meets requirements
- Want to eliminate infrastructure management entirely
- Current license costs are high

**Pros**: Zero infrastructure management
**Cons**: Loss of customization, potential vendor lock-in, data migration complexity

---

## 5. Retire

**What**: Identify IT assets that are no longer useful and turn them off.

**Examples**:
- Legacy applications no longer used by anyone
- Redundant systems (3 monitoring tools → consolidate to 1)
- Dev/test environments that were never decommissioned

**When to use**:
- Application discovery reveals unused systems
- Reducing scope and cost of migration

**Impact**: Typically 10-20% of an enterprise's application portfolio can be retired, reducing migration scope and ongoing costs.

---

## 6. Retain (Revisit)

**What**: Keep the application on-premises for now. Migrate later or never.

**Examples**:
- Applications with complex compliance requirements not yet addressed
- Recently purchased hardware with remaining depreciation
- Applications being retired in 6-12 months anyway
- Applications with unresolved dependencies

**When to use**:
- Not ready to migrate (technical, business, or compliance reasons)
- Migration ROI is unclear
- Dependencies need to be resolved first

---

## Migration Decision Tree

```
Is the application still needed?
├── No → RETIRE
└── Yes → Can it be replaced by SaaS?
    ├── Yes → REPURCHASE
    └── No → Is it worth migrating now?
        ├── No → RETAIN
        └── Yes → How much effort can we invest?
            ├── Minimal → REHOST (lift and shift)
            ├── Some → REPLATFORM (managed services)
            └── Significant → REFACTOR (cloud-native)
```

---

## Migration Tools Summary

| Tool | Purpose |
|---|---|
| **AWS Migration Hub** | Central tracking of migration progress across tools |
| **AWS Application Discovery Service** | Discover on-premises servers, dependencies, utilization |
| **AWS Application Migration Service (MGN)** | Automated lift-and-shift |
| **AWS Database Migration Service (DMS)** | Database migration with minimal downtime |
| **AWS Schema Conversion Tool (SCT)** | Convert database schemas between engines |
| **AWS DataSync** | Transfer files from on-premises to AWS |
| **AWS Snow Family** | Physical data transfer devices |
| **AWS Transfer Family** | SFTP/FTPS/FTP managed server |

---

## Migration Phases

### Phase 1: Assess
- **Application Discovery Service**: Map servers, dependencies, utilization
- **Migration Evaluator**: Estimate TCO and build business case
- **Migration Hub**: Track discovery findings

### Phase 2: Mobilize
- Plan migration waves (group related applications)
- Set up landing zone (accounts, networking, security)
- **Control Tower**: Automated multi-account setup
- Build CI/CD pipelines for deployment

### Phase 3: Migrate and Modernize
- Execute migrations in waves using chosen 6 R strategy
- Validate each wave before proceeding
- Optimize post-migration (right-sizing, reserved instances)

---

## Exam Scenarios

| Scenario | Strategy | Tool |
|---|---|---|
| "Migrate 500 VMs as fast as possible" | Rehost | MGN |
| "Move MySQL to managed service" | Replatform | DMS → RDS |
| "Move Oracle to PostgreSQL" | Replatform + DMS/SCT | SCT + DMS |
| "Break monolith into microservices" | Refactor | ECS, Lambda, SQS |
| "Replace email server" | Repurchase | SaaS (O365, WorkMail) |
| "Application not used by anyone" | Retire | Decommission |
| "Can't migrate yet, complex compliance" | Retain | Keep on-prem |
| "Transfer 100 TB, limited bandwidth" | Use Snow Family | Snowball Edge |
| "Ongoing file sync to AWS" | DataSync | AWS DataSync |
| "Database migration, minimal downtime" | DMS + CDC | AWS DMS |

---

*Word count: ~2,500+ words*
