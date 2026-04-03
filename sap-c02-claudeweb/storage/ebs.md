# Amazon EBS (Elastic Block Store)

## What is EBS?

Amazon EBS provides persistent block-level storage volumes for use with EC2 instances. EBS volumes behave like raw, unformatted block devices that can be mounted as drives and formatted with a file system.

## Why Use EBS?

### Key Benefits
- **Persistence**: Data persists independently from EC2 instance lifetime
- **High Performance**: SSD and HDD options for different workloads
- **Snapshots**: Point-in-time backups to S3
- **Encryption**: Built-in encryption at rest and in transit
- **Availability**: Replicated within AZ (99.999% availability)
- **Elastic**: Resize volumes without downtime

### Use Cases
- Boot volumes for EC2 instances
- Database storage (MySQL, PostgreSQL, Oracle)
- File systems
- Big data analytics
- Business-critical applications
- Dev/test environments

## EBS Volume Types

### General Purpose SSD (gp3, gp2)

**gp3** (Current Generation - Recommended):
- **Use Case**: Most workloads (99% of use cases)
- **Size**: 1 GB - 16 TB
- **Baseline Performance**:
  - 3,000 IOPS (any size)
  - 125 MB/s throughput (any size)
- **Max Performance**:
  - 16,000 IOPS
  - 1,000 MB/s throughput
- **Cost**: 
  - Storage: $0.08/GB-month
  - Additional IOPS: $0.005 per provisioned IOPS-month (above 3,000)
  - Additional throughput: $0.04 per provisioned MB/s-month (above 125)
- **Performance Independence**: IOPS and throughput independent of size

**Example** (gp3 pricing):
```
100 GB volume, need 10,000 IOPS, 500 MB/s:

Storage: 100 GB × $0.08 = $8/month
IOPS: (10,000 - 3,000) × $0.005 = $35/month
Throughput: (500 - 125) × $0.04 = $15/month
Total: $58/month

Same with gp2: Would need 3,334 GB = $267/month
gp3 saves $209/month when IOPS needs exceed size
```

**gp2** (Previous Generation):
- **Use Case**: Legacy workloads
- **Size**: 1 GB - 16 TB
- **Performance**: 
  - 3 IOPS per GB (100-16,000 IOPS)
  - Baseline <1,000 IOPS gets 3,000 IOPS burst
  - Burst credit system (like T instance credits)
- **Throughput**: 128-250 MB/s
- **Cost**: $0.10/GB-month
- **Limitation**: Performance tied to size

**Comparison**:
| Feature | gp3 | gp2 |
|---------|-----|-----|
| Baseline IOPS | 3,000 (any size) | 3 per GB |
| Max IOPS | 16,000 | 16,000 |
| Throughput | 125-1,000 MB/s | 128-250 MB/s |
| Cost/GB | $0.08 | $0.10 |
| IOPS independent | Yes | No |
| Burst credits | No | Yes |

**When to Use**:
- **gp3**: All new deployments (cheaper, better performance)
- **gp2**: Only for legacy or specific burst credit requirements

### Provisioned IOPS SSD (io2 Block Express, io2, io1)

**io2 Block Express** (Highest Performance):
- **Use Case**: Mission-critical, I/O intensive databases
- **Size**: 4 GB - 64 TB
- **Performance**:
  - IOPS: 256,000 (instance-dependent)
  - Throughput: 4,000 MB/s
  - Latency: <1 ms (sub-millisecond)
- **IOPS:GB Ratio**: 1,000:1
- **Durability**: 99.999% (5 nines)
- **Cost**:
  - Storage: $0.125/GB-month
  - IOPS: $0.065 per provisioned IOPS-month
- **Supported Instances**: R5b, X2idn, X2iedn, C7g families

**Example** (io2 Block Express):
```
1 TB, 100,000 IOPS:

Storage: 1,000 × $0.125 = $125/month
IOPS: 100,000 × $0.065 = $6,500/month
Total: $6,625/month

Only for extreme performance requirements
```

**io2** (Standard):
- **Use Case**: Production databases requiring consistent IOPS
- **Size**: 4 GB - 16 TB
- **Performance**:
  - IOPS: 64,000
  - Throughput: 1,000 MB/s
  - Latency: Single-digit milliseconds
- **IOPS:GB Ratio**: 500:1
- **Durability**: 99.999%
- **Cost**:
  - Storage: $0.125/GB-month
  - IOPS: $0.065 per provisioned IOPS-month

**io1** (Previous Generation):
- **Use Case**: Legacy
- **Max IOPS**: 64,000
- **IOPS:GB Ratio**: 50:1
- **Durability**: 99.8-99.9%
- **Cost**: Same as io2
- **Note**: Use io2 instead (same price, better durability)

**When to Use Provisioned IOPS**:
- Database workloads (Oracle, SQL Server, MySQL, PostgreSQL)
- Sustained IOPS performance needed (not burstable)
- IOPS > 16,000
- Latency-sensitive applications (<1ms)
- I/O intensive workloads

**gp3 vs io2 Decision**:
```
If IOPS ≤ 16,000 AND throughput ≤ 1,000 MB/s:
  → Use gp3 (much cheaper)

If IOPS > 16,000 OR need <1ms latency:
  → Use io2 or io2 Block Express

Example:
  20,000 IOPS → io2
  10,000 IOPS → gp3 (cheaper)
```

### Throughput Optimized HDD (st1)

- **Use Case**: Big data, data warehouses, log processing
- **Size**: 125 GB - 16 TB
- **Performance**:
  - Max throughput: 500 MB/s
  - Max IOPS: 500
  - Baseline: 40 MB/s per TB
- **Cost**: $0.045/GB-month
- **Characteristics**: Sequential reads/writes optimized
- **Cannot be boot volume**

**Use Cases**:
```
✓ Apache Kafka
✓ Log processing
✓ Data warehouses (sequential scans)
✓ ETL workloads
✓ Big data analytics

✗ Databases (use SSD)
✗ Random I/O (use SSD)
```

**Example**:
```
10 TB data warehouse:

st1: 10,000 × $0.045 = $450/month
  Performance: 400 MB/s baseline, 500 MB/s max

gp3: 10,000 × $0.08 = $800/month
  Performance: 125-1,000 MB/s

If sequential access pattern, st1 saves $350/month
```

### Cold HDD (sc1)

- **Use Case**: Infrequently accessed data
- **Size**: 125 GB - 16 TB
- **Performance**:
  - Max throughput: 250 MB/s
  - Max IOPS: 250
  - Baseline: 12 MB/s per TB
- **Cost**: $0.015/GB-month (cheapest EBS)
- **Cannot be boot volume**

**Use Cases**:
```
✓ Colder data requiring fewer scans per day
✓ Archival storage (cheaper than S3 Glacier for large sequential)
✓ Backups (infrequent access)

✗ Frequently accessed data (use st1 or gp3)
```

**Cost Comparison** (10 TB):
```
sc1: 10,000 × $0.015 = $150/month
st1: 10,000 × $0.045 = $450/month
S3 Standard: 10,000 × $0.023 = $230/month

sc1 cheapest for EBS, but S3 might be better for true archival
```

### Volume Type Summary

| Type | Use Case | IOPS | Throughput | $/GB-month | Boot |
|------|----------|------|------------|------------|------|
| gp3 | General purpose | 3K-16K | 125-1,000 | $0.08 | Yes |
| gp2 | Legacy general | 100-16K | 128-250 | $0.10 | Yes |
| io2 BE | Extreme IOPS | Up to 256K | Up to 4,000 | $0.125 + IOPS | Yes |
| io2 | High IOPS | Up to 64K | Up to 1,000 | $0.125 + IOPS | Yes |
| io1 | Legacy IOPS | Up to 64K | Up to 1,000 | $0.125 + IOPS | Yes |
| st1 | Throughput | 500 | 500 MB/s | $0.045 | No |
| sc1 | Cold | 250 | 250 MB/s | $0.015 | No |

## EBS Volume Characteristics

### AZ-Specific

**Important**: EBS volumes are tied to a single Availability Zone

```
us-east-1a                  us-east-1b
    ├── EC2-1                   ├── EC2-2
    └── EBS Volume-1            └── EBS Volume-2
    
Cannot attach EBS Volume-1 to EC2-2 directly
```

**To move volume between AZs**:
```
1. Create snapshot of Volume-1
2. Create Volume-2 from snapshot in us-east-1b
3. Attach Volume-2 to EC2-2
```

### Multi-Attach (io1, io2 only)

**What**: Attach single volume to multiple EC2 instances

**Limitations**:
- **Volume type**: Only io1/io2 (not gp3, st1, sc1)
- **Instance family**: Nitro-based instances only
- **AZ**: All instances must be in same AZ
- **Max instances**: 16
- **OS**: Requires cluster-aware file system

**Use Cases**:
- Clustered databases (Oracle RAC)
- Shared application data
- High-availability applications

**File Systems**:
```
✓ GFS2, OCFS2 (cluster-aware)
✗ ext4, xfs, NTFS (not cluster-aware, data corruption)
```

**Configuration**:
```
1. Create io2 volume with Multi-Attach enabled
2. Attach to Instance-1
3. Attach to Instance-2 (same AZ)
4. Both instances can read/write

Note: Application must handle concurrent access
```

### Encryption

**At Rest**:
- AES-256 encryption
- KMS keys (AWS managed or customer managed)
- Encrypted at volume level (includes snapshots)

**In Transit**:
- Between EC2 and EBS: Encrypted (Nitro instances)

**Enabling**:
```
New volume: Enable encryption during creation
Existing volume: 
  1. Create encrypted snapshot
  2. Create encrypted volume from snapshot
  3. Replace original volume
```

**Performance**: No impact (hardware-accelerated)

**Cost**: No additional cost for encryption (KMS key costs apply)

**Snapshots**:
- Encrypted volume → Encrypted snapshots
- Unencrypted volume → Unencrypted snapshots
- Cannot change encryption state of snapshot

**Copying**:
- Can copy unencrypted snapshot to encrypted
- Can change KMS key during copy

### Delete on Termination

**Root Volume**: Default = TRUE (deleted when EC2 terminated)
**Additional Volumes**: Default = FALSE (persist after termination)

**Configuration**:
```
aws ec2 run-instances \
  --block-device-mappings DeviceName=/dev/sda1,Ebs={DeleteOnTermination=false}
```

**Best Practice**: 
- Root: Keep default (true) for auto-cleanup
- Data: Set to false to preserve data

## EBS Snapshots

### What are Snapshots?

**Definition**: Point-in-time backups of EBS volumes stored in S3

**Characteristics**:
- **Incremental**: Only changed blocks backed up
- **Region-scoped**: Stored in S3 (region-wide, not AZ-specific)
- **First snapshot**: Full copy
- **Subsequent**: Only delta changes

**Example**:
```
Day 1: Create 100 GB volume → First snapshot = 100 GB
Day 2: Modify 10 GB → Snapshot 2 = 10 GB
Day 3: Modify 5 GB → Snapshot 3 = 5 GB

Total snapshot storage: 115 GB (not 300 GB)
```

### Creating Snapshots

**Manual**:
```
1. EC2 Console → Volumes → Select volume
2. Actions → Create Snapshot
3. Description: "Production DB before upgrade"
4. Tags: Environment=Prod, Application=DB
```

**Automated** (Data Lifecycle Manager):
```
Create Lifecycle Policy:
  - Resource type: Volume
  - Target tag: Backup=True
  - Schedule: Every 12 hours
  - Retention: 14 snapshots
  - Cross-region copy: us-west-2
```

**While Instance Running**:
- Can create snapshot while volume in use
- May have inconsistent state for databases
- **Best practice**: Pause writes or use application-consistent snapshots

**Application-Consistent Snapshots**:
```
Databases:
1. Freeze writes (FLUSH TABLES WITH READ LOCK)
2. Create snapshot
3. Unfreeze writes
4. Total downtime: Seconds

Or use AWS Backup for automated consistent snapshots
```

### Snapshot Lifecycle

**Incremental Forever**:
```
Snapshot 1 (Full): 100 GB
Snapshot 2 (Incr): 10 GB  ← Depends on Snapshot 1
Snapshot 3 (Incr): 5 GB   ← Depends on Snapshot 2

If delete Snapshot 2:
  - AWS consolidates Snapshot 3 with Snapshot 1
  - Still can restore from Snapshot 3
```

**Fast Snapshot Restore (FSR)**:
- **What**: Eliminates snapshot restore latency
- **Normal restore**: Lazy-loaded (blocks loaded on first access)
- **FSR**: Instantly available (no initialization)
- **Cost**: $0.75 per snapshot per AZ per month
- **Use case**: Critical workloads needing instant recovery

**Example** (FSR):
```
Without FSR:
  Create volume from snapshot → Takes hours to initialize
  First read of block: Slow (fetch from S3)

With FSR:
  Create volume from snapshot → Instant full performance
  All blocks pre-loaded

Cost: $0.75/snapshot/AZ/month
If 10 snapshots in 3 AZs: 10 × 3 × $0.75 = $22.50/month
```

### Snapshot Costs

**Storage**: $0.05/GB-month (cheaper than EBS volumes)

**Example**:
```
500 GB volume (gp3): 500 × $0.08 = $40/month
500 GB snapshot: 500 × $0.05 = $25/month

Snapshots cheaper than keeping unused volumes
```

**Incremental Savings**:
```
Day 1: 500 GB snapshot = $25/month
Day 2: 50 GB changed = $2.50/month additional
Day 3: 30 GB changed = $1.50/month additional

Total: $29/month (not $75/month for 3 full copies)
```

**Snapshot Archive**:
- **What**: Move snapshots to archive tier (75% cheaper)
- **Cost**: $0.0125/GB-month
- **Restore time**: 24-72 hours
- **Use case**: Long-term retention, compliance

**Example**:
```
1,000 GB snapshot:
Standard: 1,000 × $0.05 = $50/month
Archive: 1,000 × $0.0125 = $12.50/month

Savings: $37.50/month (75%)
Tradeoff: Restore takes 1-3 days
```

### Cross-Region Snapshot Copy

**Why**:
- Disaster recovery
- Geographic expansion
- Compliance

**How**:
```
Source: Snapshot in us-east-1
Destination: us-west-2

Copy process:
1. Incremental copy (only data not in destination)
2. Encryption can be changed
3. KMS key must be different (or use AWS managed)
```

**Cost**:
```
Snapshot storage in destination: $0.05/GB-month
Data transfer: $0.02/GB (cross-region)

Example (500 GB):
Storage: 500 × $0.05 = $25/month (in us-west-2)
Transfer: 500 × $0.02 = $10 (one-time)
```

**Automation**:
```
Data Lifecycle Manager:
  - Enable cross-region copy
  - Specify destination region
  - Retention in destination
  - Encryption settings
```

### Sharing Snapshots

**Within AWS**:
- Share with specific AWS account IDs
- Recipient can create volumes from shared snapshot
- Can share across regions (copy first)

**Publicly**:
- Not recommended (security risk)
- Use case: AMI distribution

**Encrypted Snapshots**:
```
1. Share snapshot with account B
2. Share KMS key with account B
3. Account B can create volume
4. Account B re-encrypts with own key (best practice)
```

**Marketplace**:
- Share snapshots as AMIs
- Charge per AMI usage

## EBS Volume Management

### Attaching and Detaching

**Attach**:
```
1. Volume and instance must be in same AZ
2. Instance state: Running or stopped
3. Specify device name: /dev/sdf, /dev/sdg, etc.

aws ec2 attach-volume \
  --volume-id vol-1234567890abcdef0 \
  --instance-id i-1234567890abcdef0 \
  --device /dev/sdf
```

**Detach**:
```
1. Unmount file system first (inside OS)
2. Detach volume (AWS)

sudo umount /dev/sdf
aws ec2 detach-volume --volume-id vol-1234567890abcdef0
```

**Force Detach**:
- Use when instance unresponsive
- May cause data corruption
- Last resort

### Resizing Volumes

**Elastic Volumes**: Resize without detaching

**Supported Changes**:
- Increase size (cannot decrease)
- Change volume type (gp2 → gp3, io1 → io2)
- Change IOPS/throughput (gp3, io2)

**Process**:
```
1. Modify volume (AWS Console or CLI)
2. Wait for "optimizing" state to complete
3. Extend file system (inside OS)

Linux:
sudo growpart /dev/xvdf 1
sudo resize2fs /dev/xvdf1  # ext4
sudo xfs_growfs /mnt/data  # xfs

Windows:
diskpart > select volume
diskpart > extend
```

**No Downtime**: Volume remains attached and available

**Frequency**: Can resize once every 6 hours

**Example**:
```
Original: 100 GB gp2
Modified: 500 GB gp3 with 5,000 IOPS

Cost change:
Before: 100 × $0.10 = $10/month
After: 500 × $0.08 + (5,000-3,000) × $0.005 = $40 + $10 = $50/month
```

### Monitoring

**CloudWatch Metrics**:

**Standard** (5-minute):
- `VolumeReadBytes`, `VolumeWriteBytes`: Throughput
- `VolumeReadOps`, `VolumeWriteOps`: IOPS
- `VolumeThroughputPercentage`: % of provisioned throughput
- `VolumeConsumedReadWriteOps`: Consumed IOPS

**Burst Balance** (gp2 only):
- `BurstBalance`: % of burst credits remaining
- Alert when <20% (will throttle when depleted)

**Use Cases**:

**High IOPS Alert**:
```
Alarm: VolumeReadOps + VolumeWriteOps > 90% of provisioned
Action: Increase provisioned IOPS or resize
```

**Burst Credit Depletion** (gp2):
```
Alarm: BurstBalance < 20%
Action: Migrate to gp3 or increase volume size
```

**Throughput Saturation**:
```
Alarm: VolumeThroughputPercentage > 80%
Action: Increase throughput (gp3) or change volume type
```

## EBS Optimization

### Instance Types

**EBS-Optimized**:
- Dedicated bandwidth for EBS
- Prevents contention with network traffic
- Most modern instances: EBS-optimized by default
- Older instances: Optional (additional cost)

**Bandwidth**:
```
Instance type → EBS bandwidth:
t3.small: 2,085 Mbps (260 MB/s)
m5.large: 4,750 Mbps (593 MB/s)
m5.4xlarge: 4,000 Mbps (500 MB/s)
c5.9xlarge: 9,500 Mbps (1,187 MB/s)

Choose instance with sufficient EBS bandwidth for your volume
```

**Bottleneck Example**:
```
Volume: gp3 with 1,000 MB/s throughput
Instance: t3.small (260 MB/s EBS bandwidth)

Actual throughput: Limited to 260 MB/s (instance bottleneck)

Solution: Use larger instance or reduce volume throughput requirement
```

### RAID Configurations

**RAID 0** (Striping):
- **What**: Combine multiple volumes for higher throughput/IOPS
- **Benefits**: 2 volumes = 2x IOPS, 2x throughput
- **Drawback**: No redundancy (1 volume fails = all data lost)
- **Use case**: High performance, non-critical data

**Example**:
```
2 × 1 TB gp3 (16,000 IOPS each):
Combined: 2 TB, 32,000 IOPS

vs.

1 × 2 TB io2 (32,000 IOPS):
Cost comparison:
  RAID 0 gp3: 2 × (1,000 × $0.08 + 13,000 × $0.005) = $290/month
  io2: 2,000 × $0.125 + 32,000 × $0.065 = $2,330/month

RAID 0 much cheaper but no redundancy
```

**RAID 1** (Mirroring):
- **What**: Duplicate data across volumes
- **Benefits**: Redundancy (1 volume can fail)
- **Drawback**: 50% storage efficiency, no IOPS/throughput increase
- **Use case**: On-instance redundancy (EBS already replicates within AZ)

**RAID 5/6**:
- Not recommended (parity calculations reduce performance)
- EBS already provides durability

**Best Practice**: 
- Use single large volume when possible
- Use RAID 0 only for extreme performance needs (>64,000 IOPS)
- Rely on EBS native durability instead of RAID 1

### Performance Optimization

**1. Choose Right Volume Type**:
```
Workload → Volume type:
  General: gp3
  Database (IOPS <16K): gp3
  Database (IOPS >16K): io2
  Sequential: st1
  Archival: sc1
```

**2. Provision Adequate IOPS**:
```
Monitor: VolumeConsumedReadWriteOps
If consistently near provisioned: Increase IOPS
```

**3. Use EBS-Optimized Instances**:
```
Match instance EBS bandwidth to volume requirements
```

**4. Pre-Warm Volumes from Snapshots**:
```
Without pre-warming: First access to blocks is slow
With pre-warming:
  # Linux
  sudo dd if=/dev/xvdf of=/dev/null bs=1M

Reads all blocks, caches them
Or use Fast Snapshot Restore
```

**5. File System Tuning**:
```
Linux:
  - Use XFS or ext4
  - noatime mount option (don't update access times)
  - readahead tuning

Windows:
  - NTFS allocation unit size = 64 KB
  - Disable Last Access Time
```

## EBS vs Instance Store

| Feature | EBS | Instance Store |
|---------|-----|----------------|
| Persistence | Persists | Ephemeral (lost on stop/terminate) |
| Stop/Start | Data preserved | Data lost |
| Snapshots | Supported | Not supported |
| Resize | Yes | No |
| Performance | Up to 256K IOPS | Up to 3.3M IOPS (i3en.24xlarge) |
| Use case | Most workloads | Temporary, high IOPS |
| Cost | Pay for storage | Included with instance |

**When to Use Instance Store**:
- Caches
- Buffers
- Temporary data
- Replicable data (can rebuild)
- Need extreme IOPS (>256K)

**When to Use EBS**:
- All other cases (persistence matters)

## Disaster Recovery

### Backup Strategy

**RTO/RPO Requirements**:
```
Critical database:
  RPO: 1 hour (max data loss)
  RTO: 4 hours (max downtime)

Solution:
  - Snapshots every hour (automated with DLM)
  - Cross-region copy (for region failure)
  - Test restore monthly
```

**Snapshot Frequency**:
```
Application tier → RPO → Frequency:
  Tier 1 (critical): 15 min → Every 15 minutes + cross-region
  Tier 2 (important): 1 hour → Hourly
  Tier 3 (normal): 1 day → Daily
  Tier 4 (dev/test): 1 week → Weekly
```

### Cross-Region DR

**Setup**:
```
Primary: us-east-1
  - Production volumes
  - Automated snapshots (DLM)
  - Copy to us-west-2

DR: us-west-2
  - Snapshots replicated
  - No volumes created (save cost)
  - Create volumes on failover

Failover:
1. Create volumes from latest snapshots in us-west-2
2. Launch EC2 instances
3. Attach volumes
4. Update Route 53 to point to us-west-2
```

**Cost**:
```
Primary (us-east-1):
  Volumes: $1,000/month
  Snapshots: $500/month

DR (us-west-2):
  Snapshots: $500/month (only snapshots, no volumes)
  Data transfer: $100/month (snapshot copy)

Total DR cost: $600/month (vs $1,000+ for hot standby)
```

## Cost Optimization

### 1. Right-Size Volumes

**Audit**:
```
CloudWatch: VolumeConsumedReadWriteOps
If consistently <50% of provisioned: Reduce IOPS

Example:
  Provisioned: 10,000 IOPS gp3
  Actual usage: 3,000 IOPS
  Action: Reduce to baseline 3,000 IOPS
  Savings: 7,000 × $0.005 = $35/month
```

### 2. Delete Unused Volumes

**Identify**:
```
State: Available (not attached)
Last attached: >30 days ago
Action: Create snapshot, delete volume

Savings per 100 GB unused volume:
  gp3: $8/month
  Snapshot: $5/month
  Net savings: $3/month per volume
```

### 3. Migrate gp2 to gp3

```
All gp2 volumes → gp3:
  Same performance (or better)
  Lower cost

100 GB gp2: $10/month
100 GB gp3: $8/month
Savings: 20%
```

### 4. Use st1/sc1 for Appropriate Workloads

```
Sequential access:
  gp3 (1 TB): $80/month
  st1 (1 TB): $45/month
  Savings: $35/month

Infrequent access:
  st1 (1 TB): $45/month
  sc1 (1 TB): $15/month
  Savings: $30/month
```

### 5. Snapshot Lifecycle Management

**Policy**:
```
Retain:
  - Daily snapshots: 7 days
  - Weekly snapshots: 4 weeks
  - Monthly snapshots: 12 months
  - Yearly snapshots: 7 years (move to Archive)

Cost:
  Daily (7 × 100 GB): $35
  Weekly (4 × 100 GB): $20
  Monthly (12 × 100 GB): $60
  Yearly (7 × 100 GB Archive): $8.75
  Total: $123.75/month

Without lifecycle (indefinite):
  365 × 100 GB = $1,825/month
```

### 6. Use Snapshot Archive for Long-Term

```
Compliance snapshots (7 years):
  Standard: 100 GB × 7 years × 12 months × $0.05 = $420
  Archive: 100 GB × 7 years × 12 months × $0.0125 = $105
  Savings: $315 (75%)
```

## Real-World Scenarios

### Scenario 1: High-Performance Database

**Requirements**:
- SQL Server database
- Consistent 30,000 IOPS
- Low latency (<1 ms)
- 2 TB storage

**Solution**:
```
Volume Type: io2 Block Express
Size: 2 TB
IOPS: 30,000
Throughput: 1,000 MB/s

Instance: r5b.4xlarge (EBS bandwidth: 10 Gbps)

Cost:
  Storage: 2,000 × $0.125 = $250/month
  IOPS: 30,000 × $0.065 = $1,950/month
  Total: $2,200/month

Snapshots:
  Hourly (DLM): Retain 24 hours
  Daily: Retain 7 days
  Cross-region: us-west-2 (DR)
```

**Why io2 Block Express**:
- IOPS > 16,000 (gp3 max)
- Sub-millisecond latency required
- Mission-critical workload

### Scenario 2: Big Data Analytics

**Requirements**:
- 50 TB data warehouse
- Sequential scans
- Cost-sensitive
- Throughput-optimized

**Solution**:
```
Volume Type: st1 (Throughput Optimized HDD)
Size: 50 TB
Throughput: 500 MB/s
IOPS: 500

Cost:
  Storage: 50,000 × $0.045 = $2,250/month

vs gp3:
  Storage: 50,000 × $0.08 = $4,000/month
  Savings: $1,750/month

Instance: i3.8xlarge (with local NVMe for caching)
```

**Why st1**:
- Sequential access pattern
- Throughput matters more than IOPS
- Cost savings significant at scale

### Scenario 3: Web Application with Unpredictable Traffic

**Requirements**:
- Application servers (Auto Scaling)
- Shared storage for uploads
- Occasional high IOPS bursts

**Solution**:
```
Volume Type: gp3
Size: 1 TB
IOPS: 3,000 (baseline)
Throughput: 125 MB/s

Cost:
  Storage: 1,000 × $0.08 = $80/month

During traffic spike:
  Temporarily increase IOPS to 10,000
  Additional cost: 7,000 × $0.005 = $35/month
  Total: $115/month (only during spike)

After spike:
  Reduce back to 3,000 IOPS
  Cost returns to $80/month
```

**Why gp3**:
- Can adjust IOPS dynamically
- Baseline sufficient for normal traffic
- Cost-effective for variable workloads

### Scenario 4: Disaster Recovery Setup

**Requirements**:
- Production in us-east-1
- DR in us-west-2
- RPO: 1 hour
- RTO: 4 hours

**Solution**:
```
Production (us-east-1):
  - 10 × 500 GB gp3 volumes (application servers)
  - 1 × 2 TB io2 volume (database)
  
  Cost:
    gp3: 10 × 500 × $0.08 = $400/month
    io2: 2,000 × $0.125 + 20,000 × $0.065 = $1,550/month
    Total: $1,950/month

Data Lifecycle Manager:
  - Snapshot every hour
  - Retain 24 hours locally
  - Copy to us-west-2
  - Retain 7 days in us-west-2

DR (us-west-2):
  - Snapshots only (no running volumes)
  - Fast Snapshot Restore enabled (for RTO)
  
  Cost:
    Snapshots: ~$600/month
    FSR: 20 snapshots × $0.75 = $15/month
    Data transfer: $200/month
    Total: $815/month

Total DR overhead: $815/month (42% of production)
```

**Failover Process** (RTO: 4 hours):
```
1. Automated: AMIs and snapshots in us-west-2 (up to date)
2. CloudFormation stack (pre-created):
   - Launch EC2 instances from AMIs
   - Create volumes from snapshots (FSR = instant)
   - Attach volumes
   - Start services
3. Update Route 53: Point to us-west-2 ELB
4. Verify application

Time breakdown:
  - CloudFormation: 10 minutes
  - Volume initialization: 0 (FSR)
  - Application startup: 5 minutes
  - Testing: 15 minutes
  - Total: 30 minutes (well under 4-hour RTO)
```

### Scenario 5: Dev/Test Cost Optimization

**Requirements**:
- Development environment
- Used 8 hours/day, 5 days/week
- Match production configuration

**Solution**:
```
Production setup (always running):
  - 5 × 200 GB gp3 volumes = 5 × 200 × $0.08 = $80/month

Dev setup (snapshot-based):
  - Create snapshots of production volumes
  - Delete dev volumes at end of day
  - Recreate from snapshots next morning
  
  Cost:
    Snapshots: 5 × 200 × $0.05 = $50/month (always)
    Volumes: $80/month × 8hrs/24hrs × 5days/30days = $4.44/month
    Total: $54.44/month vs $80/month
    Savings: $25.56/month (32%)

Automation:
  Lambda function (EventBridge schedule):
    8 AM: Create volumes from snapshots, attach to instances, start instances
    6 PM: Stop instances, snapshot volumes, delete volumes
```

## Exam Tips (SAP-C02)

### Key Decision Points

**Volume Type Selection**:
```
If IOPS ≤ 16,000 AND no sub-millisecond latency:
  → gp3

If IOPS > 16,000 OR sub-millisecond latency needed:
  → io2 or io2 Block Express

If sequential access, large files:
  → st1

If infrequent access, cost critical:
  → sc1
```

**Snapshot Strategy**:
```
Backup frequency → RPO
Cross-region → DR for region failure
Archive tier → Long-term compliance
Fast Snapshot Restore → Strict RTO requirements
```

**Multi-Attach**:
```
Only io1/io2
Same AZ only
Requires cluster-aware file system
Use case: Clustered applications
```

**Encryption**:
```
Enable at creation (cannot enable later on existing)
Encrypted volume → Encrypted snapshots
Can change encryption during snapshot copy
```

### Common Scenarios

**"Need to move volume to different AZ"**:
- Snapshot → Create volume in target AZ

**"Database experiencing slow I/O"**:
- Check: VolumeConsumedReadWriteOps vs provisioned
- Action: Increase IOPS or change to io2

**"Reduce costs for dev/test"**:
- Snapshot-based creation/deletion
- Use smaller volume types
- Delete unused volumes

**"Disaster recovery with minimal cost"**:
- Cross-region snapshot copy
- Don't create volumes until failover
- Use Fast Snapshot Restore for RTO

**"Need >16,000 IOPS"**:
- Single volume: io2 or io2 Block Express (up to 256K)
- Multiple volumes: RAID 0 with gp3 (cost-effective)

**"gp2 BurstBalance depleting"**:
- Migrate to gp3 (no burst, consistent performance)
- Or increase gp2 volume size

This comprehensive EBS guide covers everything needed for SAP-C02 exam success.
