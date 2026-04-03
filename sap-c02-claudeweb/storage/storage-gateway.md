# AWS Storage Gateway

## What is Storage Gateway?

AWS Storage Gateway is a hybrid cloud storage service that connects on-premises environments with AWS cloud storage. It provides low-latency access to cloud storage from on-premises applications while benefiting from cloud scalability, durability, and cost-effectiveness.

## Storage Gateway Types

### File Gateway
**What**: NFS/SMB file interface to S3
**Use Cases**: File shares, backups, content distribution, data migration

### Volume Gateway
**What**: iSCSI block storage backed by S3
**Modes**: Cached volumes, Stored volumes
**Use Cases**: Block storage, disaster recovery, database backups

### Tape Gateway
**What**: Virtual tape library (VTL) backed by S3 and Glacier
**Use Cases**: Backup applications (Veeam, NetBackup, Backup Exec)

### FSx File Gateway
**What**: Low-latency access to FSx for Windows File Server
**Use Cases**: Windows file shares, group shares

## File Gateway

### Key Features

**S3 Integration**:
- Files stored as objects in S3
- 1:1 mapping: File = S3 object
- Preserves metadata, timestamps, permissions
- Supports S3 storage classes (Standard, IA, Glacier)

**Protocols**:
- NFS v3, v4.1 (Linux)
- SMB v2, v3 (Windows)

**Caching**:
- Local cache for recently accessed files
- Cache size: 150 GiB minimum
- Write-back caching to S3

### Deploying File Gateway

```python
import boto3

sg = boto3.client('storagegateway')

# Activate gateway (get activation key from VM console or EC2)
activation = sg.activate_gateway(
    ActivationKey='ABCDE-12345-FGHIJ-67890-KLMNO',
    GatewayName='my-file-gateway',
    GatewayTimezone='GMT-5:00',
    GatewayRegion='us-east-1',
    GatewayType='FILE_S3'
)

gateway_arn = activation['GatewayARN']

# Add cache disk
sg.add_cache(
    GatewayARN=gateway_arn,
    DiskIds=['disk-id-1']  # From DescribeGatewayInformation
)

# Create NFS file share
nfs_share = sg.create_nfs_file_share(
    ClientToken='unique-token-123',
    GatewayARN=gateway_arn,
    Role='arn:aws:iam::123456789012:role/StorageGatewayS3AccessRole',
    LocationARN='arn:aws:s3:::my-bucket/prefix/',
    DefaultStorageClass='S3_STANDARD',
    ObjectACL='bucket-owner-full-control',
    ClientList=['10.0.0.0/16'],  # CIDR blocks allowed to mount
    Squash='RootSquash',  # or 'NoSquash', 'AllSquash'
    ReadOnly=False,
    GuessMIMETypeEnabled=True,
    RequesterPays=False,
    Tags=[
        {'Key': 'Name', 'Value': 'my-nfs-share'}
    ],
    CacheAttributes={
        'CacheStaleTimeoutInSeconds': 300  # 5 minutes
    },
    NotificationPolicy='{}'
)
```

### Create SMB File Share (Windows)

```python
# Create SMB file share
smb_share = sg.create_smb_file_share(
    ClientToken='unique-token-456',
    GatewayARN=gateway_arn,
    Role='arn:aws:iam::123456789012:role/StorageGatewayS3AccessRole',
    LocationARN='arn:aws:s3:::my-bucket/windows/',
    DefaultStorageClass='S3_INTELLIGENT_TIERING',
    ObjectACL='bucket-owner-full-control',
    ReadOnly=False,
    GuessMIMETypeEnabled=True,
    ValidUserList=['DOMAIN\\user1', 'DOMAIN\\user2'],  # AD users
    InvalidUserList=[],
    AdminUserList=['DOMAIN\\admin'],
    Authentication='ActiveDirectory',  # or 'GuestAccess'
    CaseSensitivity='CaseSensitive',
    Tags=[
        {'Key': 'Name', 'Value': 'my-smb-share'}
    ],
    SMBACLEnabled=True,
    AccessBasedEnumeration=True,
    OplocksEnabled=True,
    NotificationPolicy='{}'
)
```

### Mounting File Gateway

**NFS (Linux)**:
```bash
# Get mount path
GATEWAY_IP="192.168.1.100"
MOUNT_PATH="/my-bucket"

# Mount
sudo mkdir /mnt/s3
sudo mount -t nfs -o nolock,hard $GATEWAY_IP:$MOUNT_PATH /mnt/s3

# Auto-mount
echo "$GATEWAY_IP:$MOUNT_PATH /mnt/s3 nfs nolock,hard,_netdev 0 0" | sudo tee -a /etc/fstab
```

**SMB (Windows)**:
```powershell
# Map network drive
$GatewayIP = "192.168.1.100"
$ShareName = "my-bucket"

New-PSDrive -Name "S" -PSProvider FileSystem -Root "\\$GatewayIP\$ShareName" -Persist

# Or using net use
net use S: \\$GatewayIP\$ShareName /persistent:yes
```

### Automated Cache Refresh

```python
# Configure automated cache refresh
sg.update_nfs_file_share(
    FileShareARN=nfs_share['FileShareARN'],
    CacheAttributes={
        'CacheStaleTimeoutInSeconds': 300
    }
)

# Manual refresh
sg.refresh_cache(
    FileShareARN=nfs_share['FileShareARN'],
    FolderList=['/data', '/logs'],
    Recursive=True
)
```

### S3 Object Lock Integration

```python
# Enable object lock for compliance
sg.update_smb_file_share(
    FileShareARN=smb_share['FileShareARN'],
    ObjectACL='bucket-owner-full-control'
)

# S3 bucket must have object lock enabled
s3 = boto3.client('s3')
s3.put_object_lock_configuration(
    Bucket='my-bucket',
    ObjectLockConfiguration={
        'ObjectLockEnabled': 'Enabled',
        'Rule': {
            'DefaultRetention': {
                'Mode': 'GOVERNANCE',  # or 'COMPLIANCE'
                'Days': 7
            }
        }
    }
)
```

## Volume Gateway

### Cached Volumes

**Concept**: Store primary data in S3, cache frequently accessed data locally

**Architecture**:
```
Local cache: 1 GiB - 32 TiB
S3 (full data): Up to 32 TiB per volume
Upload buffer: 150 GiB minimum
```

**Creating Cached Volume**:
```python
# Activate Volume Gateway
activation = sg.activate_gateway(
    ActivationKey='VWXYZ-12345-ABCDE-67890-FGHIJ',
    GatewayName='my-volume-gateway',
    GatewayTimezone='GMT-5:00',
    GatewayRegion='us-east-1',
    GatewayType='CACHED'
)

volume_gateway_arn = activation['GatewayARN']

# Add cache and upload buffer
sg.add_cache(
    GatewayARN=volume_gateway_arn,
    DiskIds=['cache-disk-id']
)

sg.add_upload_buffer(
    GatewayARN=volume_gateway_arn,
    DiskIds=['upload-buffer-disk-id']
)

# Create cached volume
cached_volume = sg.create_cached_iscsi_volume(
    GatewayARN=volume_gateway_arn,
    VolumeSizeInBytes=1099511627776,  # 1 TiB
    TargetName='my-cached-volume',
    NetworkInterfaceId='10.0.1.100',
    ClientToken='unique-token-789',
    SourceVolumeARN='',  # Empty for new volume
    Tags=[
        {'Key': 'Name', 'Value': 'cached-volume-1'}
    ]
)
```

**Mounting iSCSI (Linux)**:
```bash
# Discover targets
GATEWAY_IP="192.168.1.100"
sudo iscsiadm -m discovery -t sendtargets -p $GATEWAY_IP:3260

# Login to target
TARGET_IQN="iqn.1997-05.com.amazon:my-cached-volume"
sudo iscsiadm -m node --targetname $TARGET_IQN --portal $GATEWAY_IP:3260 --login

# Find device
lsblk

# Format and mount
sudo mkfs.ext4 /dev/sdb
sudo mkdir /mnt/iscsi
sudo mount /dev/sdb /mnt/iscsi

# Auto-mount
echo "/dev/sdb /mnt/iscsi ext4 _netdev 0 0" | sudo tee -a /etc/fstab
```

**Mounting iSCSI (Windows)**:
```powershell
# Configure iSCSI initiator
$GatewayIP = "192.168.1.100"

# Add target portal
New-IscsiTargetPortal -TargetPortalAddress $GatewayIP

# Connect to target
Get-IscsiTarget | Connect-IscsiTarget

# Initialize disk
Get-Disk | Where PartitionStyle -eq 'RAW' | Initialize-Disk -PartitionStyle GPT
New-Partition -DiskNumber 1 -UseMaximumSize -AssignDriveLetter
Format-Volume -DriveLetter E -FileSystem NTFS -NewFileSystemLabel "Storage Gateway"
```

### Stored Volumes

**Concept**: Store entire dataset locally, async backup to S3

**Architecture**:
```
Local storage: 1 GiB - 16 TiB per volume
S3 (snapshots): EBS snapshots
Upload buffer: 150 GiB minimum
```

**Creating Stored Volume**:
```python
# Activate gateway as STORED type
activation = sg.activate_gateway(
    ActivationKey='PQRST-12345-UVWXY-67890-ZABCD',
    GatewayName='my-stored-gateway',
    GatewayTimezone='GMT-5:00',
    GatewayRegion='us-east-1',
    GatewayType='STORED'
)

stored_gateway_arn = activation['GatewayARN']

# Add upload buffer (no cache needed for stored)
sg.add_upload_buffer(
    GatewayARN=stored_gateway_arn,
    DiskIds=['upload-buffer-disk-id']
)

# Create stored volume
stored_volume = sg.create_stored_iscsi_volume(
    GatewayARN=stored_gateway_arn,
    DiskId='local-disk-id',  # Local disk for primary storage
    PreserveExistingData=False,
    TargetName='my-stored-volume',
    NetworkInterfaceId='10.0.1.100',
    Tags=[
        {'Key': 'Name', 'Value': 'stored-volume-1'}
    ]
)
```

### Snapshots

**Create Snapshot**:
```python
snapshot = sg.create_snapshot(
    VolumeARN=cached_volume['VolumeARN'],
    SnapshotDescription='Daily backup 2024-01-31'
)
```

**Automated Snapshots**:
```python
# Create snapshot schedule
sg.update_snapshot_schedule(
    VolumeARN=cached_volume['VolumeARN'],
    StartAt=0,  # Hour in UTC (0-23)
    RecurrenceInHours=24,  # Daily
    Description='Daily snapshots at midnight UTC',
    Tags=[
        {'Key': 'Schedule', 'Value': 'Daily'}
    ]
)
```

**Restore from Snapshot**:
```python
# Create volume from snapshot
restored_volume = sg.create_cached_iscsi_volume(
    GatewayARN=volume_gateway_arn,
    VolumeSizeInBytes=1099511627776,
    TargetName='restored-volume',
    NetworkInterfaceId='10.0.1.100',
    SnapshotId='snap-0123456789abcdef0',  # EBS snapshot ID
    ClientToken='unique-token-restore'
)
```

### Cached vs Stored Volumes

| Feature | Cached | Stored |
|---------|--------|--------|
| Primary data | S3 | On-premises |
| Local storage | Cache only | Full dataset |
| Latency | Higher (S3) | Lower (local) |
| Capacity | 32 TiB per volume | 16 TiB per volume |
| Recovery | Restore from S3 | Restore from snapshot |
| Use case | Cloud-first | DR, low latency |

## Tape Gateway

### Key Features

**Virtual Tape Library (VTL)**:
- Emulates physical tape library
- Compatible with existing backup software
- Virtual tapes: 100 GiB - 5 TiB
- Up to 1,500 virtual tapes per gateway

**Storage Tiers**:
- **Virtual Tape Library** (VTL): Active tapes in S3 Standard
- **Virtual Tape Shelf** (VTS): Archived tapes in S3 Glacier or Deep Archive

### Creating Tape Gateway

```python
# Activate Tape Gateway
activation = sg.activate_gateway(
    ActivationKey='LMNOP-12345-QRSTU-67890-VWXYZ',
    GatewayName='my-tape-gateway',
    GatewayTimezone='GMT-5:00',
    GatewayRegion='us-east-1',
    GatewayType='VTL',
    MediumChangerType='AWS-Gateway-VTL'
)

tape_gateway_arn = activation['GatewayARN']

# Add cache and upload buffer
sg.add_cache(
    GatewayARN=tape_gateway_arn,
    DiskIds=['cache-disk-id']
)

sg.add_upload_buffer(
    GatewayARN=tape_gateway_arn,
    DiskIds=['upload-buffer-disk-id']
)

# Create virtual tapes
tapes = sg.create_tapes(
    GatewayARN=tape_gateway_arn,
    TapeSizeInBytes=2199023255552,  # 2 TiB
    ClientToken='unique-token-tapes',
    NumTapesToCreate=10,
    TapeBarcodePrefix='TAPE',
    Worm=False,  # Write-Once-Read-Many
    PoolId='GLACIER',  # or 'DEEP_ARCHIVE'
    Tags=[
        {'Key': 'Backup', 'Value': 'Monthly'}
    ]
)
```

### Tape Pools

**Glacier Pool**:
```
Storage: S3 Glacier Flexible Retrieval
Retrieval: 3-5 hours
Cost: $0.004/GB-month
Use: Regular restores
```

**Deep Archive Pool**:
```
Storage: S3 Glacier Deep Archive
Retrieval: 12-48 hours
Cost: $0.00099/GB-month
Use: Long-term archival
```

### Configuring Backup Software

**Veeam Example**:
```
1. Add tape library
   Type: iSCSI
   Target: <gateway-ip>:3260

2. Scan library
   Detect virtual tapes

3. Create tape backup job
   Source: VMs
   Destination: Virtual tapes
   Retention: 30 days

4. Archive tapes
   After 30 days → VTS (Glacier)
```

**NetBackup Example**:
```
Device Configuration:
  Robot Type: TLD (Tape Library DLT)
  Robot Control: /dev/sg1
  Drives: /dev/nst0, /dev/nst1

Backup Policy:
  Schedule: Full weekly, Incremental daily
  Retention: 4 weeks VTL, then archive to VTS
```

### Retrieving Archived Tapes

```python
# Retrieve tape from archive (VTS → VTL)
sg.retrieve_tape_archive(
    TapeARN='arn:aws:storagegateway:us-east-1:123456789012:tape/TAPE-000001',
    GatewayARN=tape_gateway_arn
)

# Retrieval time: 3-5 hours (Glacier) or 12-48 hours (Deep Archive)
```

### Tape Lifecycle

```
1. Create tape → VTL (S3 Standard)
2. Write backup → VTL
3. Eject tape → VTS (Glacier/Deep Archive)
4. Restore needed → Retrieve to VTL
5. Read backup → VTL
6. Delete tape → Permanent deletion
```

## FSx File Gateway

### Key Features

**Use Case**: Low-latency access to FSx for Windows File Server from on-premises

**Benefits**:
- Cache frequently accessed data locally
- SMB protocol
- Active Directory integration
- Reduce WAN bandwidth

### Creating FSx File Gateway

```python
# Activate FSx File Gateway
activation = sg.activate_gateway(
    ActivationKey='FGHIJ-12345-KLMNO-67890-PQRST',
    GatewayName='my-fsx-gateway',
    GatewayTimezone='GMT-5:00',
    GatewayRegion='us-east-1',
    GatewayType='FILE_FSX_SMB'
)

fsx_gateway_arn = activation['GatewayARN']

# Associate with FSx file system
sg.attach_fsx_file_system(
    GatewayARN=fsx_gateway_arn,
    FileSystemARN='arn:aws:fsx:us-east-1:123456789012:file-system/fs-0123456789abcdef0',
    SecurityGroupArns=[
        'arn:aws:ec2:us-east-1:123456789012:security-group/sg-12345678'
    ],
    AuditDestinationARN='arn:aws:logs:us-east-1:123456789012:log-group:/aws/fsx/gateway',
    UserList=['DOMAIN\\user1'],
    AdminUserList=['DOMAIN\\admin'],
    Tags=[
        {'Key': 'Name', 'Value': 'fsx-share'}
    ]
)
```

## Hardware Appliance

**Concept**: Pre-configured physical appliance for easy deployment

**Specs**:
```
Dell PowerEdge R640
Intel Xeon 24 cores
128 GB RAM
12 TB usable cache
10 GbE network
```

**Ordering**:
```python
# Order hardware appliance (through AWS Console/CLI)
# Delivered to on-premises location
# Activate via console
```

**Cost**: $5,000 one-time + $300/month support

**Use Cases**:
- No virtualization infrastructure
- Quick deployment
- Consistent performance

## Bandwidth Optimization

### Bandwidth Throttling

```python
# Set bandwidth rate limit
sg.update_bandwidth_rate_limit(
    GatewayARN=gateway_arn,
    AverageUploadRateLimitInBitsPerSec=10485760,  # 10 Mbps
    AverageDownloadRateLimitInBitsPerSec=52428800  # 50 Mbps
)

# Schedule-based throttling
sg.update_bandwidth_rate_limit_schedule(
    GatewayARN=gateway_arn,
    BandwidthRateLimitIntervals=[
        {
            'StartHourOfDay': 8,  # 8 AM
            'EndHourOfDay': 18,   # 6 PM
            'DaysOfWeek': [1, 2, 3, 4, 5],  # Mon-Fri
            'AverageUploadRateLimitInBitsPerSec': 5242880  # 5 Mbps during business hours
        },
        {
            'StartHourOfDay': 18,  # 6 PM
            'EndHourOfDay': 8,    # 8 AM
            'DaysOfWeek': [1, 2, 3, 4, 5],
            'AverageUploadRateLimitInBitsPerSec': 104857600  # 100 Mbps after hours
        }
    ]
)
```

### Data Compression

**Automatic**: 2-5x compression for text/logs
**Transfer Optimization**: Delta sync (only changed blocks)

## Monitoring

### CloudWatch Metrics

```python
cloudwatch = boto3.client('cloudwatch')

# Get cache hit percent
metrics = cloudwatch.get_metric_statistics(
    Namespace='AWS/StorageGateway',
    MetricName='CacheHitPercent',
    Dimensions=[
        {'Name': 'GatewayId', 'Value': 'sgw-12345678'},
        {'Name': 'GatewayName', 'Value': 'my-file-gateway'}
    ],
    StartTime=datetime.now() - timedelta(hours=1),
    EndTime=datetime.now(),
    Period=300,
    Statistics=['Average']
)
```

**Key Metrics**:
- **CacheHitPercent**: Higher = better performance
- **CachePercentDirty**: Pending uploads to S3
- **CachePercentUsed**: Cache utilization
- **CloudBytesUploaded**: Data uploaded to AWS
- **CloudBytesDownloaded**: Data downloaded from AWS
- **ReadBytes**: Total read from cache/S3
- **WriteBytes**: Total written

### CloudWatch Alarms

```python
# Alarm for low cache hit percent
cloudwatch.put_metric_alarm(
    AlarmName='StorageGateway-LowCacheHit',
    MetricName='CacheHitPercent',
    Namespace='AWS/StorageGateway',
    Statistic='Average',
    Period=300,
    EvaluationPeriods=2,
    Threshold=80,
    ComparisonOperator='LessThanThreshold',
    Dimensions=[
        {'Name': 'GatewayId', 'Value': 'sgw-12345678'}
    ],
    AlarmActions=[
        'arn:aws:sns:us-east-1:123456789012:storage-gateway-alerts'
    ]
)
```

## Cost Optimization

### File Gateway Cost

**Example**: 10 TB data, 1 TB cache, 100 GB daily writes

**Storage** (S3 Intelligent-Tiering):
```
10 TB × $23/TB = $230/month

With tiering (50% infrequent):
  5 TB Standard: 5000 GB × $0.023 = $115
  5 TB IA: 5000 GB × $0.0125 = $62.50
  Total: $177.50/month
  Savings: $52.50/month (23%)
```

**Requests**:
```
PUT (writes): 100 GB/day × 30 days = 3 TB/month
  3,000 GB / 1 MB per object = 3M PUT requests
  3M × $0.005 per 1000 = $15/month

GET (reads): 500 GB/month
  500,000 MB = 500K GET requests
  500K × $0.0004 per 1000 = $0.20/month

Total requests: $15.20/month
```

**Total** (File Gateway):
```
Storage: $177.50
Requests: $15.20
Gateway: Free (on EC2 instance cost)
Total: $192.70/month
```

### Volume Gateway Cost (Cached)

**Example**: 5 TB volume, 500 GB cache, daily snapshots

**Storage** (S3):
```
5 TB × $23 = $115/month
```

**Snapshots** (incremental):
```
First snapshot: 5 TB × $0.05 = $250/month
Daily changes: 50 GB × 30 = 1.5 TB
Total: 6.5 TB × $0.05 = $325/month
```

**Total** (Volume Gateway):
```
Storage: $115
Snapshots: $325
Total: $440/month
```

### Tape Gateway Cost

**Example**: 50 tapes × 2 TiB = 100 TiB

**VTL** (S3 Standard):
```
Active tapes: 10 TiB × $23 = $230/month
```

**VTS** (Glacier Deep Archive):
```
Archived tapes: 90 TiB × $0.99 = $89.10/month
```

**Retrieval** (1 tape/month):
```
Retrieval: 2 TiB × $0.02 = $40/month
```

**Total** (Tape Gateway):
```
VTL: $230
VTS: $89.10
Retrieval: $40
Total: $359.10/month

vs Physical tapes: ~$2000/month
Savings: $1,640.90/month (82%)
```

## Real-World Scenarios

### Scenario 1: File Share Migration to Cloud

**Requirements**:
- 20 TB file shares
- NFS and SMB access
- 50 users
- Minimize downtime

**Solution**:
```
1. Deploy File Gateway on-premises (EC2 m5.xlarge)
2. Create NFS and SMB file shares pointing to S3
3. Copy data to gateway (local write, async upload to S3)
4. Update user mounts to gateway
5. Data continues uploading to S3 in background
```

**Cost**:
```
S3: 20 TB × $23 = $460/month
EC2 (gateway): m5.xlarge $0.192/hour × 730 = $140/month
Total: $600/month

vs On-premises NAS: $2000/month (hardware, maintenance)
Savings: $1,400/month (70%)
```

### Scenario 2: Disaster Recovery with Stored Volumes

**Requirements**:
- 10 TiB SQL Server database
- Low-latency access
- DR to AWS
- 4-hour RTO

**Solution**:
```
1. Deploy Volume Gateway (stored mode) on-premises
2. Attach iSCSI volume to SQL Server
3. Daily snapshots to S3 (EBS snapshots)
4. On DR: Launch EC2, attach snapshot as EBS volume
```

**Cost**:
```
Snapshots: 10 TiB × $0.05 × 30 snapshots = $15,000/month (full backup)
With incremental: 10 TiB initial + 100 GiB daily × 30 = 13 TiB
  13 TB × $0.05 = $650/month
Gateway: Free (on-prem hardware)
Total: $650/month

RTO: 4 hours (launch EC2, attach volume, start SQL)
```

### Scenario 3: Backup to Cloud with Tape Gateway

**Requirements**:
- Replace physical tape library
- 500 TB backups
- Veeam backup software
- Retain 7 years

**Solution**:
```
1. Deploy Tape Gateway on-premises
2. Configure Veeam to use virtual tapes
3. Active backups in VTL (S3 Standard)
4. After 30 days, archive to VTS (Glacier Deep Archive)
```

**Cost**:
```
VTL (30 days): 50 TB × $23 = $1,150/month
VTS (7 years): 450 TB × $0.99 = $445.50/month
Total: $1,595.50/month

vs Physical tapes:
  Tapes: $10,000/month
  Library: $5,000/month
  Off-site storage: $2,000/month
  Total: $17,000/month

Savings: $15,404.50/month (91%)
```

## Exam Tips (SAP-C02)

### Key Decision Points

**File Gateway vs S3 Direct Access**:
```
Local file interface → File Gateway
Existing NFS/SMB apps → File Gateway
API access → S3 direct
```

**Cached vs Stored Volumes**:
```
Cloud-first (data in S3) → Cached
On-premises primary → Stored
Low latency required → Stored
Large datasets → Cached
```

**Tape Gateway Use Cases**:
```
Existing backup software → Tape Gateway
Replace physical tapes → Tape Gateway
Long-term archival → Deep Archive pool
```

**FSx File Gateway**:
```
On-premises + FSx hybrid → FSx File Gateway
Local cache for remote FSx → FSx File Gateway
```

### Common Patterns

**Hybrid cloud storage**:
```
Problem: Need local access + cloud storage
Solution: File Gateway with S3 backend
Benefits: Low-latency local, infinite cloud capacity
```

**Disaster recovery**:
```
Problem: Need DR for on-premises workloads
Solution: Volume Gateway with snapshots to S3
Benefits: Incremental backups, fast restore to EC2
```

**Backup modernization**:
```
Problem: Physical tape management expensive
Solution: Tape Gateway with Glacier/Deep Archive
Benefits: 90% cost savings, no physical media
```

**Bandwidth optimization**:
```
Problem: Limited WAN bandwidth
Solution: Local cache + bandwidth throttling + scheduling
Benefits: Cache hit 80%+, upload during off-hours
```

This comprehensive Storage Gateway guide covers all gateway types, deployment patterns, and cost optimization for SAP-C02 success.
