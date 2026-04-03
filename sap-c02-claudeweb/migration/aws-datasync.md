# AWS DataSync

## Overview
AWS DataSync is a data transfer service that makes it easy to automate moving data between on-premises storage and AWS storage services, as well as between AWS storage services.

## Key Features
- **Automated Transfer**: Scheduled data transfers
- **Fast Transfer**: Up to 10x faster than open-source tools
- **Data Validation**: Automatic integrity verification
- **Bandwidth Optimization**: Network optimization and throttling
- **Encryption**: Data encrypted in transit
- **Incremental Transfers**: Only changed data transferred

## Supported Locations
### Source Locations
- NFS shares (3.x, 4.x)
- SMB shares (2.1, 3.x)
- HDFS (Hadoop)
- Self-managed object storage
- AWS Snowcone
- Amazon S3
- Amazon EFS
- Amazon FSx

### Destination Locations
- Amazon S3 (all classes)
- Amazon EFS
- Amazon FSx for Windows File Server
- Amazon FSx for Lustre
- Amazon FSx for OpenZFS
- Amazon FSx for NetApp ONTAP

## Architecture Components
### DataSync Agent
- Deployed as VM or EC2 instance
- Connects on-premises to AWS
- Handles data transfer
- Multiple agents for scale
- Not needed for AWS-to-AWS

### DataSync Task
- Defines source and destination
- Transfer configuration
- Scheduling and filtering
- Verification settings
- Network bandwidth settings

## Transfer Modes
### Full Copy
- Transfer all data
- Initial migration
- Complete synchronization
- All files copied

### Incremental
- Only changed data
- Faster transfers
- Lower bandwidth usage
- Metadata comparison

## Data Validation
- **Checksum Verification**: End-to-end validation
- **Integrity Checks**: File-level verification
- **Metadata Preservation**: Timestamps, permissions
- **Detailed Logging**: Transfer reports

## Performance Features
- Parallel transfers
- Network optimization
- Compression
- Bandwidth throttling
- Multi-threaded operations
- Automatic recovery

## Security Features
### Encryption
- TLS encryption in transit
- VPC endpoints support
- AWS PrivateLink
- Data encrypted at rest (destination)

### Access Control
- IAM policies
- VPC security groups
- Resource-based policies
- Service-linked roles

## Scheduling Options
- One-time transfer
- Scheduled transfers (hourly/daily/weekly)
- Event-driven (via EventBridge)
- Manual execution
- Custom scheduling

## Filtering Options
- Include patterns
- Exclude patterns
- File size filters
- Modified date filters
- Custom filters

## Monitoring & Logging
- CloudWatch metrics
- CloudWatch Logs
- Task execution logs
- Transfer statistics
- Error reporting
- SNS notifications

## Use Cases
### Migration
- Data center migration
- Cloud migration
- Storage consolidation
- Archive to cloud

### Data Distribution
- Content distribution
- Multi-region replication
- Disaster recovery
- Analytics workflows

### Ongoing Sync
- Hybrid cloud workflows
- Active archive
- Data pipeline
- Backup and restore

## DataSync vs Other Services
### vs Storage Gateway
- DataSync: One-time/scheduled transfers
- Storage Gateway: Continuous sync, caching

### vs Snow Family
- DataSync: Network-based, ongoing
- Snow: Physical transfer, offline

### vs S3 Transfer Acceleration
- DataSync: Full-featured, scheduled
- S3TA: Simple S3 uploads, on-demand

### vs AWS Transfer Family
- DataSync: Automated, AWS-to-AWS
- Transfer Family: SFTP/FTPS/FTP protocol

## Best Practices
- Deploy agents in same network as source
- Use VPC endpoints for AWS transfers
- Enable verification for critical data
- Schedule during off-peak hours
- Use bandwidth throttling
- Monitor transfer metrics
- Test with small dataset first
- Use filters to exclude unnecessary data
- Enable CloudWatch logging
- Plan for network capacity

## Cost Optimization
- Use incremental transfers
- Schedule appropriately
- Filter unnecessary files
- Right-size agent instances
- Use VPC endpoints (avoid NAT)
- Batch transfers
- Monitor data transfer costs

## Integration with Other Services
- **S3**: Direct integration
- **EFS**: Cross-region replication
- **FSx**: Migration and sync
- **EventBridge**: Event-driven transfers
- **CloudWatch**: Monitoring and alerts
- **Lambda**: Automation workflows

## Common Patterns
1. **On-Prem to S3**: Migrate file servers
2. **EFS to EFS**: Cross-region replication
3. **S3 to EFS**: Data lake to analytics
4. **FSx Replication**: Multi-region FSx
5. **Hybrid Workflows**: Ongoing sync
6. **Data Processing**: ETL pipelines

## Limitations
- 50M files per task
- Agent OS requirements
- Network bandwidth dependent
- Some metadata limitations
- Regional service
- Pricing per GB transferred

## SAP-C02 Exam Tips
- DataSync for automated, scheduled transfers
- Up to 10x faster than traditional tools
- Requires agent for on-premises sources
- No agent for AWS-to-AWS transfers
- Supports incremental transfers
- Bandwidth throttling available
- Data verification included
- VPC endpoints for private connectivity
- Ideal for migrations and ongoing sync
- Cost based on data transferred
