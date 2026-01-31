# AWS Backup

## Overview
AWS Backup is a fully managed backup service that makes it easy to centralize and automate the backup of data across AWS services in the cloud and on premises.

## Key Features
- **Centralized Management**: Single console for all backups
- **Policy-Based**: Automated backup policies
- **Cross-Region**: Copy backups across regions
- **Cross-Account**: Backup to different accounts
- **Compliance**: Backup policies and audit
- **Encryption**: Encrypted backups
- **Cost-Optimized**: Lifecycle policies

## Supported Services
### Compute
- EC2 instances
- EBS volumes
- EC2 instances with Windows VSS

### Storage
- S3
- EFS
- FSx (Windows, Lustre, ONTAP, OpenZFS)
- Storage Gateway volumes

### Database
- RDS (all engines)
- Aurora
- DynamoDB
- DocumentDB
- Neptune
- Timestream

### Other
- VMware VMs (on-premises)
- AWS Outposts volumes
- CloudFormation stacks

## Core Components
### Backup Plans
- Define backup schedule
- Retention policies
- Lifecycle rules
- Copy to regions
- Tagging strategy

### Backup Vaults
- Logical container for backups
- Encryption settings
- Access policies
- Cross-region copy destination
- Resource-based policies

### Resource Assignment
- Tag-based selection
- Resource IDs
- CloudFormation stacks
- All resources of a type

### Backup Policies
- Organization-level policies
- Enforce backup requirements
- Compliance enforcement
- Governance controls

## Backup Configuration
### Scheduling
- Continuous (35-day retention)
- Hourly, Daily, Weekly, Monthly
- Custom cron expressions
- Multiple schedules per plan
- Start windows and completion windows

### Retention
- Days, weeks, months, years
- Transition to cold storage
- Permanent retention
- Compliance mode (WORM)
- Point-in-time recovery

### Lifecycle Management
- Transition to cold storage (after 90 days)
- Delete after retention period
- Cost optimization
- Compliance requirements

## Advanced Features
### Cross-Region Backup
- Copy backups to other regions
- Disaster recovery
- Compliance requirements
- Separate retention policies
- Encrypted copies

### Cross-Account Backup
- Backup to different account
- Centralized backup account
- Multi-account governance
- Isolated recovery points

### Backup Audit Manager
- Compliance reporting
- Audit findings
- Policy violations
- Automated compliance checks
- Custom frameworks

### AWS Backup Gateway
- Backup VMware VMs
- On-premises to AWS
- Centralized management
- Hybrid backup solution

## Restore Operations
### Restore Options
- Restore to same account/region
- Cross-region restore
- Cross-account restore
- Point-in-time recovery
- Restore to new resource

### Supported Restore Types
- Full restoration
- Volume restoration
- File/folder level (EFS, FSx)
- Table restoration (DynamoDB)
- Database restoration (RDS)

## Security Features
### Encryption
- Encrypted at rest (AWS KMS)
- Encrypted in transit
- Independent encryption keys
- Cross-account encryption

### Access Control
- IAM policies
- Vault access policies
- Resource-based policies
- Service control policies
- Backup plan tags

### Vault Lock
- Write-Once-Read-Many (WORM)
- Compliance mode
- Prevent deletion
- Regulatory compliance
- Retention enforcement

## Monitoring & Reporting
### CloudWatch
- Backup job metrics
- Success/failure rates
- Backup size
- Duration metrics
- Custom alarms

### AWS Backup Console
- Dashboard view
- Job history
- Protected resources
- Compliance status
- Backup coverage

### Notifications
- SNS integration
- Job completion
- Job failures
- Policy changes
- Compliance events

## Cost Optimization
### Storage Pricing
- Warm storage cost
- Cold storage cost (cheaper)
- Restore request charges
- Cross-region transfer costs

### Optimization Strategies
- Use lifecycle policies
- Delete old backups
- Incremental backups
- Cold storage transitions
- Resource tagging for cost allocation

## Best Practices
- Implement backup policies centrally
- Use tag-based resource assignment
- Enable cross-region copying for DR
- Implement vault lock for compliance
- Regular restore testing
- Monitor backup job failures
- Use lifecycle policies
- Enable Backup Audit Manager
- Document restore procedures
- Automate with EventBridge
- Use separate vaults for different retention
- Encrypt with customer managed keys
- Test cross-account restore

## Common Use Cases
### Compliance
- Regulatory requirements
- Data retention policies
- Audit trails
- WORM storage

### Disaster Recovery
- Cross-region backups
- Point-in-time recovery
- Business continuity
- RTO/RPO requirements

### Data Protection
- Accidental deletion
- Ransomware protection
- Version control
- Long-term archival

### Centralized Management
- Multi-account organizations
- Consistent policies
- Unified monitoring
- Cost allocation

## Integration Points
- **Organizations**: Policy inheritance
- **CloudFormation**: Stack backups
- **EventBridge**: Event-driven actions
- **CloudWatch**: Monitoring and alerts
- **Systems Manager**: Automation
- **Service Catalog**: Backup as a service

## Limitations
- Service-specific limitations
- Backup window constraints
- Cross-region transfer time
- Cold storage minimum duration (90 days)
- Vault lock cannot be disabled
- Some resources require backup agent

## SAP-C02 Exam Tips
- AWS Backup for centralized backup management
- Supports 16+ AWS services
- Cross-region and cross-account backup
- Tag-based resource selection
- Backup policies for compliance
- Vault Lock for WORM compliance
- Lifecycle policies to cold storage
- Continuous backup for point-in-time recovery
- Backup Audit Manager for compliance reporting
- Integration with AWS Organizations
- Restore testing important for DR
- Cost optimized with cold storage
