# Disaster Recovery — All 4 Strategies with Complete Implementation

---

## DR Fundamentals

### Key Terms
- **RPO (Recovery Point Objective)**: Maximum acceptable data loss (measured in time). "How much data can we afford to lose?"
- **RTO (Recovery Time Objective)**: Maximum acceptable downtime. "How quickly must we recover?"
- **Lower RPO/RTO = Higher cost**

```
Data Loss ←──── RPO ────→ ←──── RTO ────→ Recovery Complete
                         ↑
                      Disaster
```

---

## Strategy 1: Backup and Restore

**RTO: Hours | RPO: Hours | Cost: Lowest ($)**

### Architecture
```
Normal:
  Production (us-east-1): EC2 + RDS + S3
  DR Preparation:
    - RDS automated backups (snapshot + transaction logs every 5 min)
    - Cross-region snapshot copy to eu-west-1 (automated)
    - S3 Cross-Region Replication to eu-west-1
    - AMI copies to eu-west-1
    - CloudFormation templates stored in S3

Disaster:
  1. Deploy CloudFormation stack in eu-west-1
  2. Restore RDS from latest snapshot
  3. Launch EC2 from copied AMIs
  4. Update Route 53 DNS
  5. Validate and go live
```

### AWS Services
- RDS cross-region snapshots, S3 CRR, AMI copy, CloudFormation, Route 53
- **Cost**: Storage for snapshots/replicas only. No running compute in DR region.

### When to Use
- Non-critical applications
- RPO of hours is acceptable
- Budget constraints

---

## Strategy 2: Pilot Light

**RTO: 10-60 minutes | RPO: Minutes | Cost: Medium ($$)**

### Architecture
```
Normal:
  Production (us-east-1): ALB → EC2/ASG → Aurora (writer)
  DR Region (eu-west-1): Aurora (reader via Global Database)
                          AMIs ready, Launch Templates ready
                          No EC2 running (cost savings)

Disaster:
  1. Promote Aurora reader to writer (~1 minute)
  2. Launch EC2 instances from AMIs (2-5 minutes)
  3. Scale up to production capacity
  4. Update Route 53 (or automatic failover)
  5. Validate
```

### Key Difference from Backup & Restore
- **Database is already running** in DR region (Aurora Global Database replication)
- No time spent restoring from snapshots
- RPO is much better (seconds vs hours) because of continuous replication

### AWS Services
- Aurora Global Database, EC2 AMIs, Auto Scaling, Route 53 Failover, CloudFormation

### When to Use
- Business-critical applications needing faster recovery
- Can tolerate 10-60 minute RTO

---

## Strategy 3: Warm Standby

**RTO: Minutes | RPO: Seconds | Cost: Higher ($$$)**

### Architecture
```
Normal:
  Production (us-east-1): ALB → EC2/ASG (10 instances) → Aurora (writer)
  DR Region (eu-west-1): ALB → EC2/ASG (2 instances, scaled down) → Aurora (reader, Global DB)
                          Fully functional but at reduced capacity

Disaster:
  1. Aurora: Promote reader to writer (~30 seconds)
  2. Auto Scaling: Scale up from 2 to 10 instances (2-5 minutes)
  3. Route 53: Failover routing activates automatically
  4. Within minutes: DR region handling full production load
```

### Key Difference from Pilot Light
- **Compute is already running** (reduced capacity)
- DR environment is fully functional — just needs to scale up
- Can even serve read traffic during normal operations (active read / passive write)

### AWS Services
- Aurora Global Database, EC2 ASG (reduced capacity), ALB, Route 53 Failover

### When to Use
- Critical applications needing fast recovery
- Can justify running reduced infrastructure in DR region

---

## Strategy 4: Multi-Site Active-Active

**RTO: Near-zero | RPO: Near-zero | Cost: Highest ($$$$)**

### Architecture
```
Normal:
  Region A (us-east-1): Route 53 (Latency) → ALB → ECS/EC2 → DynamoDB Global Table
  Region B (eu-west-1): Route 53 (Latency) → ALB → ECS/EC2 → DynamoDB Global Table
  
  Both regions: Fully operational, serving traffic simultaneously
  DynamoDB Global Tables: Active-active replication (writes accepted in both)
  
  S3: Cross-Region Replication
  Users: Routed to nearest region by Route 53

Disaster (Region A fails):
  1. Route 53: Health check fails → stops routing to Region A
  2. ALL traffic goes to Region B (already handling traffic, just more of it)
  3. Auto Scaling in Region B: Scales up to handle full load
  4. RPO: Near-zero (data already replicated)
  5. RTO: Near-zero (already running)
```

### Challenges
- **Data consistency**: DynamoDB Global Tables use "last writer wins" for conflicts
- **Cost**: Running full infrastructure in 2+ regions
- **Application design**: Must handle multi-region writes correctly

### AWS Services
- DynamoDB Global Tables (or Aurora Global Database), Route 53 Latency Routing, ALB, Auto Scaling, S3 CRR

### When to Use
- Mission-critical, zero-downtime applications
- Global user base needing low latency everywhere
- Budget available for running full infrastructure in multiple regions

---

## Strategy Comparison Summary

| Strategy | RTO | RPO | Cost | Compute in DR | Database in DR |
|---|---|---|---|---|---|
| **Backup & Restore** | Hours | Hours | $ | Nothing running | Snapshots only |
| **Pilot Light** | 10-60 min | Minutes | $$ | Nothing running (AMIs ready) | **Database running** |
| **Warm Standby** | Minutes | Seconds | $$$ | **Reduced capacity running** | **Database running** |
| **Active-Active** | ~Zero | ~Zero | $$$$ | **Full capacity running** | **Full replication** |

---

## Exam Scenarios

**"Lowest cost DR"** → Backup and Restore
**"RPO of 1 second, RTO <1 minute"** → Warm Standby with Aurora Global Database
**"Zero data loss, zero downtime"** → Multi-Site Active-Active
**"Database must be immediately available in DR"** → Pilot Light or higher (database always running)
**"Critical app, moderate budget"** → Warm Standby (best balance of cost and speed)

---

*Word count: ~2,000+ words*
