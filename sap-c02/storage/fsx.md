# Amazon FSx

## What is FSx?

Amazon FSx provides fully managed third-party file systems optimized for specific workloads. FSx offers four variants, each built on proven file system technologies with native compatibility and performance characteristics.

## FSx Variants

### FSx for Windows File Server
**What**: Fully managed Windows native file storage
**Built on**: Windows Server with SMB protocol
**Use Cases**: Windows applications, Active Directory, SQL Server, IIS, SharePoint

### FSx for Lustre
**What**: High-performance file system for compute-intensive workloads
**Built on**: Lustre parallel file system
**Use Cases**: HPC, machine learning, video processing, financial modeling

### FSx for NetApp ONTAP
**What**: Fully managed NetApp storage with advanced features
**Built on**: NetApp ONTAP
**Use Cases**: Multi-protocol access, snapshots, clones, data migration from on-premises NetApp

### FSx for OpenZFS
**What**: Fully managed OpenZFS file system
**Built on**: OpenZFS
**Use Cases**: Linux workloads, data migration from on-premises ZFS, NFS access

## FSx for Windows File Server

### Key Features

**Native Windows Support**:
- SMB protocol (Server Message Block)
- Windows NTFS file system
- Active Directory integration
- DFS (Distributed File System) namespaces
- ACLs (Access Control Lists)

**Performance**:
- SSD storage: 8-2,000 MB/s throughput
- HDD storage: 8-2,000 MB/s throughput
- Sub-millisecond latencies
- Automatic burst to 3x throughput

**Storage Tiers**:
- **SSD**: Low-latency, high-performance ($0.13/GB-month)
- **HDD**: Cost-optimized for infrequently accessed ($0.013/GB-month, 90% cheaper)

### Creating FSx for Windows

```python
import boto3

fsx = boto3.client('fsx')

# Create FSx for Windows file system
response = fsx.create_file_system(
    FileSystemType='WINDOWS',
    StorageCapacity=300,  # GB, min 32 GB for SSD, 2000 GB for HDD
    StorageType='SSD',  # or 'HDD'
    SubnetIds=[
        'subnet-12345678'  # Single-AZ or Multi-AZ (2 subnets)
    ],
    SecurityGroupIds=['sg-12345678'],
    WindowsConfiguration={
        'ActiveDirectoryId': 'd-1234567890',  # AWS Managed AD or self-managed
        'ThroughputCapacity': 32,  # MB/s: 8, 16, 32, 64, 128, 256, 512, 1024, 2048
        'WeeklyMaintenanceStartTime': '1:00:00',  # Day:Hour:Minute
        'DailyAutomaticBackupStartTime': '01:00',
        'AutomaticBackupRetentionDays': 7,  # 0-90 days
        'CopyTagsToBackups': True,
        'DeploymentType': 'MULTI_AZ_1',  # or 'SINGLE_AZ_1', 'SINGLE_AZ_2'
        'PreferredSubnetId': 'subnet-12345678',  # For Multi-AZ
        'AuditLogConfiguration': {
            'FileAccessAuditLogLevel': 'SUCCESS_AND_FAILURE',
            'FileShareAccessAuditLogLevel': 'SUCCESS_AND_FAILURE',
            'AuditLogDestination': 'arn:aws:logs:us-east-1:123456789012:log-group:/aws/fsx/windows'
        }
    },
    Tags=[
        {'Key': 'Name', 'Value': 'my-windows-fsx'}
    ]
)

file_system_id = response['FileSystem']['FileSystemId']
```

### Multi-AZ vs Single-AZ

**Multi-AZ** (Production):
```
Deployment: 2 file servers in 2 AZs
Automatic failover: <30 seconds
Replication: Synchronous
Cost: 2x Single-AZ
Use: Production workloads requiring HA
```

**Single-AZ** (Dev/Test):
```
Deployment: 1 file server in 1 AZ
Failover: Manual restore from backup
Cost: 50% of Multi-AZ
Use: Dev/test, cost-sensitive
```

### Mounting on Windows

```powershell
# Get DNS name
$DNSName = "fs-0123456789abcdef0.example.com"

# Mount as network drive
New-PSDrive -Name "Z" -PSProvider FileSystem -Root "\\$DNSName\share" -Persist

# Or using net use
net use Z: \\$DNSName\share /persistent:yes
```

### DFS Namespaces

**Concept**: Group multiple file shares under single namespace

**Setup**:
```powershell
# Install DFS Namespace role
Install-WindowsFeature -Name FS-DFS-Namespace

# Create namespace
New-DfsnRoot -Path "\\example.com\data" -TargetPath "\\fs-0123.example.com\share" -Type DomainV2

# Add folder target
New-DfsnFolder -Path "\\example.com\data\finance" -TargetPath "\\fs-0123.example.com\finance"
```

### Data Deduplication

**Enable**:
```python
fsx.update_file_system(
    FileSystemId=file_system_id,
    WindowsConfiguration={
        'DataRepositoryConfiguration': {
            'Lifecycle': 'AVAILABLE'
        }
    }
)
```

**Savings**: Typically 50-60% for file shares with duplicate data

### Shadow Copies (VSS)

**Concept**: Point-in-time snapshots for user self-service restore

**Schedule**:
```
Automatic: Daily at midnight, 7 snapshots retained
User restore: Right-click → Properties → Previous Versions
```

### Cost Example (Windows)

**Single-AZ SSD**:
```
Storage: 500 GB × $0.13 = $65.00/month
Throughput: 32 MB/s × $2.20 = $70.40/month
Backup: 100 GB × $0.05 = $5.00/month
Total: $140.40/month
```

**Multi-AZ SSD**:
```
Storage: 500 GB × $0.13 × 2 = $130.00/month
Throughput: 32 MB/s × $2.20 × 2 = $140.80/month
Backup: 100 GB × $0.05 = $5.00/month
Total: $275.80/month (2x Single-AZ)
```

**Single-AZ HDD**:
```
Storage: 2000 GB × $0.013 = $26.00/month
Throughput: 16 MB/s × $1.40 = $22.40/month
Backup: 100 GB × $0.05 = $5.00/month
Total: $53.40/month (62% cheaper than SSD)
```

## FSx for Lustre

### Key Features

**High Performance**:
- Sub-millisecond latencies
- Hundreds of GB/s throughput
- Millions of IOPS
- Parallel file system

**S3 Integration**:
- Lazy load from S3
- Write results back to S3
- Transparent to applications
- POSIX interface to S3 objects

**Deployment Types**:
- **Persistent**: Long-term storage with HA
- **Scratch**: Temporary storage, cost-optimized

### Creating FSx for Lustre

```python
# Create FSx for Lustre (S3-linked)
lustre_fs = fsx.create_file_system(
    FileSystemType='LUSTRE',
    StorageCapacity=1200,  # GB, multiples of 1200 for SSD, 6000 for HDD
    StorageType='SSD',  # or 'HDD'
    SubnetIds=['subnet-12345678'],
    SecurityGroupIds=['sg-12345678'],
    LustreConfiguration={
        'DeploymentType': 'PERSISTENT_2',  # or 'SCRATCH_2', 'PERSISTENT_1', 'SCRATCH_1'
        'PerUnitStorageThroughput': 125,  # MB/s/TiB: 50, 100, 200 for PERSISTENT_2; 125, 250, 500, 1000 for PERSISTENT_1
        'DataRepositoryConfiguration': {
            'ImportPath': 's3://my-bucket/input/',
            'ExportPath': 's3://my-bucket/output/',
            'ImportedFileChunkSize': 1024,  # MB, 1-512000
            'AutoImportPolicy': 'NEW_CHANGED',  # Import new/changed S3 objects
            'AutoExportPolicy': {
                'Events': ['NEW', 'CHANGED', 'DELETED']
            }
        },
        'WeeklyMaintenanceStartTime': '1:00:00',
        'CopyTagsToBackups': True,
        'DataCompressionType': 'LZ4'  # Compress data automatically
    },
    Tags=[
        {'Key': 'Name', 'Value': 'my-lustre-fsx'}
    ]
)
```

### Deployment Types Comparison

**SCRATCH_2** (Temporary):
```
Purpose: Short-term processing
Durability: Data not replicated
Replication: None
Failover: No automatic failover
Cost: $0.14/GB-month (SSD), $0.026/GB-month (HDD)
Throughput: 200 MB/s per TiB baseline
Use: Temporary data, reproducible from S3
```

**PERSISTENT_2** (Long-term, Production):
```
Purpose: Long-term storage
Durability: HA within single AZ
Replication: Replicated within AZ
Failover: Automatic failover to replica
Cost: $0.14-$0.29/GB-month (depends on throughput)
Throughput: 50-1000 MB/s per TiB
Use: Production, persistent workloads
```

**PERSISTENT_1** (Legacy):
```
Older version, use PERSISTENT_2 instead
```

### Mounting on Linux

```bash
# Install Lustre client
sudo amazon-linux-extras install -y lustre2.10

# Mount
sudo mkdir /fsx
sudo mount -t lustre fs-0123456789abcdef0.fsx.us-east-1.amazonaws.com@tcp:/fsx /fsx

# Auto-mount on boot
echo "fs-0123456789abcdef0.fsx.us-east-1.amazonaws.com@tcp:/fsx /fsx lustre defaults,noatime,flock,_netdev 0 0" | sudo tee -a /etc/fstab
```

### S3 Data Repository Tasks

**Import from S3**:
```python
task = fsx.create_data_repository_task(
    FileSystemId=file_system_id,
    Type='IMPORT_METADATA_FROM_REPOSITORY',
    Paths=['input/dataset1/', 'input/dataset2/'],
    Report={
        'Enabled': True,
        'Path': 's3://my-bucket/reports/',
        'Format': 'REPORT_CSV_20191124'
    }
)
```

**Export to S3**:
```python
task = fsx.create_data_repository_task(
    FileSystemId=file_system_id,
    Type='EXPORT_TO_REPOSITORY',
    Paths=['output/results/'],
    Report={
        'Enabled': True,
        'Path': 's3://my-bucket/reports/'
    }
)
```

### Performance Tuning

**Stripe Count**:
```bash
# Set stripe count (number of OSTs)
lfs setstripe -c 8 /fsx/data/

# For large files (>1 GB)
lfs setstripe -c -1 /fsx/large-files/  # -1 = use all OSTs
```

**Read/Write Patterns**:
```
Sequential: High throughput
Random: Lower throughput
Large files: Better performance with higher stripe count
Many small files: Lower stripe count
```

### Cost Example (Lustre)

**SCRATCH_2 SSD**:
```
Storage: 1.2 TB × $140 = $168/month
Data transfer (S3): 100 GB × $0.00 = $0 (import free, export to same region free)
Total: $168/month

Throughput: 200 MB/s per TiB × 1.2 TiB = 240 MB/s included
```

**PERSISTENT_2 SSD** (125 MB/s per TiB):
```
Storage: 1.2 TB × $145 = $174/month (includes 125 MB/s per TiB)
Backup: 200 GB × $0.05 = $10/month
Total: $184/month

Throughput: 125 MB/s per TiB × 1.2 TiB = 150 MB/s included
```

**PERSISTENT_2 SSD** (1000 MB/s per TiB):
```
Storage: 1.2 TB × $290 = $348/month (includes 1000 MB/s per TiB)
Backup: 200 GB × $0.05 = $10/month
Total: $358/month

Throughput: 1000 MB/s per TiB × 1.2 TiB = 1200 MB/s included
```

## FSx for NetApp ONTAP

### Key Features

**Multi-Protocol Support**:
- NFS (Linux)
- SMB (Windows)
- iSCSI (block storage)

**ONTAP Features**:
- Snapshots (instant, space-efficient)
- Clones (instant, copy-on-write)
- SnapMirror (replication)
- FlexClone (writable snapshots)
- Storage efficiency (compression, deduplication, compaction)

**Storage Tiers**:
- **SSD**: High-performance tier
- **Capacity Pool**: Cost-optimized tier (auto-tiering)

### Creating FSx for NetApp ONTAP

```python
# Create FSx for NetApp ONTAP
ontap_fs = fsx.create_file_system(
    FileSystemType='ONTAP',
    StorageCapacity=1024,  # GB, min 1024 GB
    SubnetIds=[
        'subnet-12345678',
        'subnet-87654321'  # 2 subnets required (HA pairs)
    ],
    SecurityGroupIds=['sg-12345678'],
    OntapConfiguration={
        'DeploymentType': 'MULTI_AZ_1',  # or 'SINGLE_AZ_1'
        'ThroughputCapacity': 128,  # MB/s: 128, 256, 512, 1024, 2048
        'PreferredSubnetId': 'subnet-12345678',
        'RouteTableIds': ['rtb-12345678'],
        'EndpointIpAddressRange': '198.19.255.0/24',  # IP range for endpoints
        'FsxAdminPassword': 'MySecurePassword123!',
        'WeeklyMaintenanceStartTime': '1:00:00',
        'DiskIopsConfiguration': {
            'Mode': 'AUTOMATIC'  # or 'USER_PROVISIONED' with Iops value
        }
    },
    Tags=[
        {'Key': 'Name', 'Value': 'my-ontap-fsx'}
    ]
)

# Create Storage Virtual Machine (SVM)
svm = fsx.create_storage_virtual_machine(
    FileSystemId=ontap_fs['FileSystem']['FileSystemId'],
    Name='svm1',
    SvmAdminPassword='SvmPassword123!',
    RootVolumeSecurityStyle='UNIX'  # or 'NTFS', 'MIXED'
)

# Create Volume
volume = fsx.create_volume(
    VolumeType='ONTAP',
    Name='vol1',
    OntapConfiguration={
        'StorageVirtualMachineId': svm['StorageVirtualMachine']['StorageVirtualMachineId'],
        'JunctionPath': '/vol1',
        'SizeInMegabytes': 102400,  # 100 GB
        'StorageEfficiencyEnabled': True,
        'SecurityStyle': 'UNIX',
        'TieringPolicy': {
            'CoolingPeriod': 31,  # Days before tiering
            'Name': 'AUTO'  # or 'SNAPSHOT_ONLY', 'ALL', 'NONE'
        },
        'SnapshotPolicy': 'default'
    }
)
```

### Snapshots and Clones

**Create Snapshot**:
```python
snapshot = fsx.create_snapshot(
    VolumeId=volume['Volume']['VolumeId'],
    Name='snapshot-20240131'
)
```

**Clone Volume** (instant):
```python
clone = fsx.create_volume_from_backup(
    SourceBackupId=snapshot['Snapshot']['SnapshotId'],
    Name='vol1-clone',
    OntapConfiguration={
        'StorageVirtualMachineId': svm_id,
        'JunctionPath': '/vol1-clone'
    }
)
```

**Use Cases**:
- Dev/test clones from production
- Data protection with snapshots
- Fast database refreshes
- Testing schema changes

### Tiering to Capacity Pool

**Concept**: Auto-tier infrequently accessed data to lower-cost pool

**Policies**:
```
SNAPSHOT_ONLY: Tier snapshot copies only
AUTO: Tier inactive user data and snapshots
ALL: Tier all data
NONE: No tiering
```

**Cost Savings**:
```
SSD Tier: $0.145/GB-month
Capacity Pool Tier: $0.0145/GB-month (90% cheaper)

Example: 1 TB volume, 200 GB hot, 800 GB cold
SSD only: 1000 GB × $0.145 = $145/month
With tiering: (200 GB × $0.145) + (800 GB × $0.0145) = $29 + $11.60 = $40.60/month
Savings: $104.40/month (72%)
```

### Multi-Protocol Access

**NFS** (Linux):
```bash
sudo mount -t nfs svm-0123.fs-0123.fsx.us-east-1.amazonaws.com:/vol1 /mnt/fsx
```

**SMB** (Windows):
```powershell
net use Z: \\svm-0123.fs-0123.fsx.us-east-1.amazonaws.com\vol1
```

**iSCSI** (Block):
```bash
sudo iscsiadm -m discovery -t sendtargets -p svm-0123.fs-0123.fsx.us-east-1.amazonaws.com
sudo iscsiadm -m node --login
```

### Cost Example (ONTAP)

**Multi-AZ**:
```
Storage (SSD): 1 TB × $145 = $145/month
Throughput: 128 MB/s × $0.00 = $0 (included)
Capacity Pool: 2 TB × $14.50 = $29/month (tiered data)
Backup: 500 GB × $0.05 = $25/month
Total: $199/month
```

**Single-AZ**:
```
Storage (SSD): 1 TB × $110 = $110/month (24% cheaper)
Throughput: 128 MB/s × $0.00 = $0
Capacity Pool: 2 TB × $14.50 = $29/month
Backup: 500 GB × $0.05 = $25/month
Total: $164/month
```

## FSx for OpenZFS

### Key Features

**ZFS Benefits**:
- Snapshots (up to 10,000 per volume)
- Clones (instant, copy-on-write)
- Compression (LZ4, ZSTD)
- Z-Standard compression
- Data integrity (checksums)

**Performance**:
- Up to 1,000,000 IOPS
- Up to 10 GB/s throughput
- NFS protocol (v3, v4.0, v4.1, v4.2)

### Creating FSx for OpenZFS

```python
# Create FSx for OpenZFS
openzfs_fs = fsx.create_file_system(
    FileSystemType='OPENZFS',
    StorageCapacity=64,  # GB, min 64 GB
    StorageType='SSD',
    SubnetIds=['subnet-12345678'],
    SecurityGroupIds=['sg-12345678'],
    OpenZFSConfiguration={
        'DeploymentType': 'SINGLE_AZ_1',  # Only Single-AZ available
        'ThroughputCapacity': 64,  # MB/s: 64, 128, 256, 512, 1024, 2048, 3072, 4096
        'RootVolumeConfiguration': {
            'RecordSizeKiB': 128,  # 4, 8, 16, 32, 64, 128, 256, 512, 1024
            'DataCompressionType': 'ZSTD',  # or 'LZ4', 'NONE'
            'NfsExports': [
                {
                    'ClientConfigurations': [
                        {
                            'Clients': '*',
                            'Options': [
                                'rw',
                                'crossmnt',
                                'no_root_squash'
                            ]
                        }
                    ]
                }
            ],
            'UserAndGroupQuotas': [
                {
                    'Type': 'USER',
                    'Id': 1001,
                    'StorageCapacityQuotaGiB': 100
                }
            ]
        },
        'WeeklyMaintenanceStartTime': '1:00:00',
        'DiskIopsConfiguration': {
            'Mode': 'AUTOMATIC'
        },
        'CopyTagsToBackups': True,
        'CopyTagsToVolumes': True
    },
    Tags=[
        {'Key': 'Name', 'Value': 'my-openzfs-fsx'}
    ]
)

# Create child volume
child_volume = fsx.create_volume(
    VolumeType='OPENZFS',
    Name='projects',
    OpenZFSConfiguration={
        'ParentVolumeId': root_volume_id,
        'StorageCapacityQuotaGiB': 500,
        'StorageCapacityReservationGiB': 100,
        'RecordSizeKiB': 128,
        'DataCompressionType': 'ZSTD',
        'NfsExports': [
            {
                'ClientConfigurations': [
                    {
                        'Clients': '10.0.0.0/16',
                        'Options': ['rw', 'no_root_squash']
                    }
                ]
            }
        ]
    }
)
```

### Snapshots and Clones

**Create Snapshot**:
```python
snapshot = fsx.create_snapshot(
    VolumeId=volume_id,
    Name='snapshot-20240131'
)
```

**Clone Volume**:
```python
clone = fsx.create_volume(
    VolumeType='OPENZFS',
    Name='projects-clone',
    OpenZFSConfiguration={
        'ParentVolumeId': root_volume_id,
        'CopyStrategy': 'CLONE',
        'OriginSnapshot': {
            'CopyStrategy': 'CLONE',
            'SnapshotARN': snapshot['Snapshot']['ResourceARN']
        }
    }
)
```

### Compression

**Compression Types**:
```
ZSTD: 3:1 ratio, higher CPU
LZ4: 2:1 ratio, lower CPU
NONE: No compression
```

**Storage Savings**:
```
1 TB uncompressed data

LZ4: 1000 GB / 2 = 500 GB stored (50% savings)
ZSTD: 1000 GB / 3 = 333 GB stored (67% savings)
```

### Mounting on Linux

```bash
# Mount OpenZFS volume
sudo mkdir /fsx
sudo mount -t nfs -o nfsvers=4.1 fs-0123456789abcdef0.fsx.us-east-1.amazonaws.com:/fsx/projects /fsx

# Auto-mount
echo "fs-0123456789abcdef0.fsx.us-east-1.amazonaws.com:/fsx/projects /fsx nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,_netdev 0 0" | sudo tee -a /etc/fstab
```

### Cost Example (OpenZFS)

**Single-AZ SSD**:
```
Storage: 1 TB × $114 = $114/month
Throughput: 256 MB/s × $0.00 = $0 (included up to capacity × 0.25)
Provisioned IOPS: 10,000 IOPS × $0.00 = $0 (included up to capacity × 160)
Backup: 200 GB × $0.05 = $10/month
Total: $124/month

With ZSTD compression (3:1):
Effective storage: 3 TB in 1 TB
Cost per effective TB: $124 / 3 = $41.33/month
```

## Comparison: When to Use Which?

| Feature | Windows File Server | Lustre | NetApp ONTAP | OpenZFS |
|---------|-------------------|--------|--------------|---------|
| **Protocol** | SMB | POSIX | NFS/SMB/iSCSI | NFS |
| **OS** | Windows | Linux | Linux/Windows | Linux |
| **Use Case** | Windows apps | HPC, ML | Enterprise | Linux workloads |
| **Performance** | 2 GB/s | 1000 GB/s | 10 GB/s | 10 GB/s |
| **Cost** | $0.13/GB | $0.14/GB | $0.11/GB | $0.11/GB |
| **HA** | Multi-AZ | Single-AZ | Multi-AZ | Single-AZ |
| **S3 Integration** | No | Yes | No | No |
| **Snapshots** | VSS | Manual | ONTAP | ZFS |
| **Compression** | Dedup | LZ4 | Multiple | LZ4/ZSTD |
| **Cloning** | No | No | FlexClone | Copy-on-write |

## Real-World Scenarios

### Scenario 1: Windows File Server for Enterprise

**Requirements**: 
- 10 TB shared storage
- Multi-AZ HA
- Active Directory integration
- Daily backups

**Solution**:
```
FSx for Windows File Server
  Deployment: Multi-AZ
  Storage: 10 TB SSD
  Throughput: 128 MB/s
  Backup: 7-day retention
```

**Cost**:
```
Storage: 10,000 GB × $0.13 × 2 = $2,600/month
Throughput: 128 MB/s × $2.20 × 2 = $563.20/month
Backup: 2,000 GB × $0.05 = $100/month
Total: $3,263.20/month
```

### Scenario 2: HPC with S3 Integration

**Requirements**:
- Process 100 TB dataset in S3
- Sub-millisecond latency
- Parallel file access
- Temporary (1 week)

**Solution**:
```
FSx for Lustre SCRATCH_2
  Storage: 7.2 TB (lazy-load from S3)
  S3 link: Import from s3://dataset
  Write back: Export results to S3
```

**Cost** (1 week):
```
Storage: 7.2 TB × $140 / 4 weeks = $252/week
Data transfer: Free (same region)
Total: $252/week
```

### Scenario 3: NetApp Migration to AWS

**Requirements**:
- Migrate 50 TB NetApp FAS
- Multi-protocol (NFS + SMB)
- Preserve snapshots
- Auto-tiering for cost

**Solution**:
```
FSx for NetApp ONTAP
  Deployment: Multi-AZ
  SSD: 10 TB (hot data)
  Capacity Pool: 40 TB (cold data, auto-tiered)
  Snapshots: Daily
```

**Cost**:
```
SSD: 10,000 GB × $145 = $1,450/month
Capacity Pool: 40,000 GB × $14.50 = $580/month
Throughput: 512 MB/s included
Backup: 5,000 GB × $0.05 = $250/month
Total: $2,280/month

vs All-SSD: 50,000 GB × $145 = $7,250/month
Savings: $4,970/month (69%)
```

### Scenario 4: Linux Development with ZFS

**Requirements**:
- 5 TB shared storage
- Instant snapshots for testing
- Compression for logs
- NFS access

**Solution**:
```
FSx for OpenZFS
  Storage: 5 TB SSD
  Compression: ZSTD (3:1)
  Snapshots: Hourly
```

**Cost**:
```
Storage: 5,000 GB × $114 = $570/month
Effective capacity: 15 TB (with compression)
Backup: 1,000 GB × $0.05 = $50/month
Total: $620/month

Cost per effective TB: $620 / 15 = $41.33/month
```

## Exam Tips (SAP-C02)

### Key Decision Points

**Windows workloads**:
```
Windows applications → FSx for Windows File Server
AD integration → FSx for Windows
SMB protocol → FSx for Windows or ONTAP
DFS namespaces → FSx for Windows
```

**High-performance computing**:
```
HPC/ML workloads → FSx for Lustre
S3 data processing → FSx for Lustre
Parallel file system → FSx for Lustre
Millions of IOPS → FSx for Lustre
```

**NetApp migration**:
```
On-premises NetApp → FSx for NetApp ONTAP
Multi-protocol → FSx for ONTAP
Snapshots/clones → FSx for ONTAP
Tiering for cost → FSx for ONTAP
```

**Linux with ZFS**:
```
ZFS on-premises → FSx for OpenZFS
NFS-only workloads → FSx for OpenZFS
Compression needs → FSx for OpenZFS
Dev/test cloning → FSx for OpenZFS
```

### Cost Optimization

**Use HDD for infrequent access**:
```
Windows File Server HDD: 90% cheaper than SSD
Use for: Archival, backups, infrequent data
```

**ONTAP tiering**:
```
Auto-tier cold data to Capacity Pool
90% savings on tiered data
Cooling period: 31 days default
```

**Lustre SCRATCH for temporary**:
```
Same price as PERSISTENT
No replication overhead
Use for: Reproducible workloads
```

**OpenZFS compression**:
```
3x effective capacity with ZSTD
Transparent to applications
Best for: Text, logs, source code
```

This comprehensive FSx guide covers all four variants with performance, cost, and use case analysis for SAP-C02 mastery.
