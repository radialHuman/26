# AWS Systems Manager

## What is AWS Systems Manager?

AWS Systems Manager is a unified interface that allows you to centrally manage AWS and on-premises resources. It provides visibility and control over your infrastructure, automates common operational tasks, and helps maintain security and compliance. Think of Systems Manager as your comprehensive operations management suite for hybrid cloud environments.

## Why Use AWS Systems Manager?

### Key Benefits
- **Unified Management**: Single interface for AWS and on-premises
- **Automation**: Operational tasks at scale
- **Patch Management**: Automated OS and software patching
- **Configuration Management**: Maintain desired state
- **Secure Access**: No bastion hosts, no SSH keys
- **Compliance**: Track and enforce configurations
- **Hybrid Support**: Manage EC2 and on-premises servers

### Use Cases
- Automated patch management
- Centralized configuration management
- Secure remote access without SSH/RDP
- Inventory and compliance tracking
- Application deployment automation
- Parameter and secret storage
- Operational runbook automation
- Maintenance windows

## How Systems Manager Works

### Architecture

```
Resources (EC2, On-Premises)
          ↓
    SSM Agent (installed)
          ↓
Systems Manager Service
          ↓
┌─────────┼──────────┬──────────┬─────────┐
↓         ↓          ↓          ↓         ↓
Session   Patch    State     Parameter  Run
Manager   Manager  Manager   Store      Command
```

### Core Components

**SSM Agent**:
- Lightweight software installed on instances
- Pre-installed on Amazon Linux 2, Ubuntu, Windows Server
- Communicates with Systems Manager service
- No inbound ports required
- Updates via Run Command

**IAM Instance Profile**:
- EC2 instances need IAM role
- `AmazonSSMManagedInstanceCore` policy (minimum)
- Additional policies for specific features

**Managed Instances**:
- EC2 instances with SSM Agent
- On-premises servers with SSM Agent
- Hybrid activations for non-EC2 resources

## Session Manager

### What is Session Manager?

**Purpose**:
- Secure shell access to instances
- No bastion hosts required
- No SSH keys to manage
- No inbound security group rules
- Full audit trail in CloudTrail

**How It Works**:
```
User → AWS Console/CLI → Systems Manager → SSM Agent → Instance Shell
                              ↓
                        CloudTrail Logging
                              ↓
                      S3 Bucket (optional)
```

### Configuration

**Enable Session Manager**:
```yaml
Prerequisites:
  1. SSM Agent installed and running
  2. IAM instance profile attached
  3. Outbound HTTPS (443) to Systems Manager endpoints
  4. (Optional) VPC endpoints for private connectivity
```

**IAM Permissions** (User):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:StartSession",
        "ssm:TerminateSession",
        "ssm:ResumeSession",
        "ssm:DescribeSessions",
        "ssm:GetConnectionStatus"
      ],
      "Resource": "*"
    }
  ]
}
```

**IAM Permissions** (Instance):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:UpdateInstanceInformation",
        "ssmmessages:CreateControlChannel",
        "ssmmessages:CreateDataChannel",
        "ssmmessages:OpenControlChannel",
        "ssmmessages:OpenDataChannel"
      ],
      "Resource": "*"
    }
  ]
}
```

### Advanced Features

**Session Logging**:
```yaml
Session Manager Preferences:
  CloudWatch Logs:
    Enable: true
    LogGroupName: /aws/ssm/session-logs
    
  S3 Bucket:
    Enable: true
    BucketName: my-session-logs-bucket
    Prefix: session-logs/
    
  Encryption:
    Enable: true
    KMSKeyId: arn:aws:kms:region:account:key/key-id
```

**Run As Support**:
```bash
# Start session as specific user (Linux)
aws ssm start-session \
  --target i-123456 \
  --document-name AWS-StartInteractiveCommand \
  --parameters command="sudo su - appuser"
```

**Port Forwarding**:
```bash
# Forward local port to remote port
aws ssm start-session \
  --target i-123456 \
  --document-name AWS-StartPortForwardingSession \
  --parameters portNumber=3306,localPortNumber=9090

# Access: localhost:9090 → instance:3306
```

**SSH/SCP Over Session Manager**:
```bash
# Add to ~/.ssh/config
Host i-* mi-*
    ProxyCommand sh -c "aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters 'portNumber=%p'"

# SSH using instance ID
ssh ec2-user@i-123456

# SCP file transfer
scp file.txt ec2-user@i-123456:/tmp/
```

## Run Command

### What is Run Command?

**Purpose**:
- Execute commands remotely on managed instances
- No SSH/RDP required
- Run at scale (thousands of instances)
- Track execution status and output

**Use Cases**:
- Install/update software
- Restart services
- Collect logs
- Join domain
- Configure instances

### Execution

**Run Command via Console/CLI**:
```bash
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --targets "Key=tag:Environment,Values=Production" \
  --parameters 'commands=["sudo yum update -y","sudo systemctl restart httpd"]' \
  --output-s3-bucket-name "my-command-outputs" \
  --comment "Update and restart Apache"
```

**SSM Documents**:
- **AWS-RunShellScript**: Run shell commands (Linux)
- **AWS-RunPowerShellScript**: Run PowerShell (Windows)
- **AWS-ConfigureAWSPackage**: Install/uninstall AWS packages
- **AWS-InstallApplication**: Install applications
- **AWS-UpdateSSMAgent**: Update SSM Agent

**Rate Control**:
```yaml
Rate Control:
  Concurrency: 10 instances at a time
  Error Threshold: Stop if 5 instances fail
  Timeout: 3600 seconds per instance
```

**Output Management**:
```yaml
Output Options:
  CloudWatch Logs: Log command output
  S3 Bucket: Store output files
  SNS Notifications: Notify on completion/failure
```

## Patch Manager

### What is Patch Manager?

**Purpose**:
- Automate patching of managed instances
- OS patches and application updates
- Compliance reporting
- Scheduled maintenance windows

**Supported Operating Systems**:
- Amazon Linux, Amazon Linux 2
- Ubuntu, Debian, RHEL, CentOS, SUSE
- Windows Server 2008-2022
- macOS

### Patch Baselines

**What is a Patch Baseline?**
- Defines which patches to approve
- Rules for auto-approval
- Patch exceptions (include/exclude)
- Compliance severity levels

**Predefined Baselines**:
- `AWS-RunPatchBaseline` (default)
- `AWS-DefaultPatchBaseline` per OS
- Custom baselines

**Custom Baseline Example**:
```yaml
Patch Baseline: Production-Linux
Operating System: Amazon Linux 2
Approval Rules:
  - Product: AmazonLinux2
    Classification: Security
    Severity: Critical, Important
    Auto-Approval: 0 days (immediately)
  
  - Product: AmazonLinux2
    Classification: Bugfix
    Severity: All
    Auto-Approval: 7 days
    
Patch Exceptions:
  Rejected Patches: 
    - CVE-2024-1234 (breaks app)
  Approved Patches:
    - CustomPatch-v1.0
    
Compliance Severity: CRITICAL
```

### Patch Groups

**Organization**:
```
Patch Group: WebServers
  - Patch Baseline: Production-Linux
  - Maintenance Window: Sundays 2AM-4AM
  - Instances: Tagged with PatchGroup=WebServers

Patch Group: DatabaseServers
  - Patch Baseline: Database-Linux
  - Maintenance Window: Saturdays 3AM-6AM
  - Instances: Tagged with PatchGroup=DatabaseServers
```

**Assignment**:
```bash
# Tag instance with patch group
aws ec2 create-tags \
  --resources i-123456 \
  --tags Key=Patch Group,Value=WebServers
```

### Patch Scanning and Installation

**Scan for Missing Patches**:
```bash
aws ssm send-command \
  --document-name "AWS-RunPatchBaseline" \
  --targets "Key=tag:Patch Group,Values=WebServers" \
  --parameters 'Operation=Scan' \
  --output-s3-bucket-name "patch-scan-logs"
```

**Install Patches**:
```bash
aws ssm send-command \
  --document-name "AWS-RunPatchBaseline" \
  --targets "Key=tag:Patch Group,Values=WebServers" \
  --parameters 'Operation=Install,RebootOption=RebootIfNeeded'
```

**Reboot Options**:
- `RebootIfNeeded`: Reboot if required by patches
- `NoReboot`: Never reboot
- `ForceReboot`: Always reboot after patching

### Compliance Reporting

**Patch Compliance Data**:
```yaml
Per Instance:
  Installed Patches: 45
  Missing Patches: 3 (2 Critical, 1 Important)
  Failed Patches: 0
  Not Applicable: 12
  Compliance Status: NON_COMPLIANT

Per Patch Group:
  Compliant: 80%
  Non-Compliant: 15%
  Unassessed: 5%
```

**View Compliance**:
```bash
aws ssm describe-instance-patch-states \
  --instance-ids i-123456

aws ssm list-compliance-summaries \
  --filters "Key=PatchGroup,Values=WebServers"
```

## State Manager

### What is State Manager?

**Purpose**:
- Maintain instance configuration
- Enforce desired state
- Scheduled configuration application
- Drift detection

**Use Cases**:
- Ensure security agents are installed
- Maintain firewall rules
- Configure logging
- Join AD domain
- Update DNS settings

### Associations

**What is an Association?**
- Links SSM document to managed instances
- Defines schedule and parameters
- Applies configuration repeatedly

**Example Association**:
```yaml
Association: Install-CloudWatch-Agent
Document: AWS-ConfigureAWSPackage
Targets: Tag:Environment=Production
Schedule: rate(30 minutes)
Parameters:
  action: Install
  name: AmazonCloudWatchAgent
  version: latest
Compliance Severity: HIGH
Apply Only at Cron Interval: false
```

**Create Association**:
```bash
aws ssm create-association \
  --name "AWS-ConfigureAWSPackage" \
  --targets "Key=tag:Environment,Values=Production" \
  --parameters action=Install,name=AmazonCloudWatchAgent \
  --schedule-expression "rate(30 minutes)"
```

**Association Compliance**:
- **Success**: Configuration applied successfully
- **Failed**: Configuration failed
- **Pending**: Waiting for next run
- **Skipped**: Target not available

## Parameter Store

### What is Parameter Store?

**Purpose**:
- Centralized configuration and secrets management
- Hierarchical storage
- Version control
- Encryption support
- Integration with other AWS services

**Use Cases**:
- Application configuration
- Database connection strings
- License keys
- Feature flags
- Environment-specific settings

### Parameter Types

**Standard Parameters**:
- Up to 4 KB value size
- No additional charge
- Free tier: 10,000 parameters

**Advanced Parameters**:
- Up to 8 KB value size
- Parameter policies (expiration, notifications)
- Higher throughput
- $0.05 per advanced parameter per month

**Parameter Data Types**:
- **String**: Plain text
- **StringList**: Comma-separated values
- **SecureString**: Encrypted with KMS

### Parameter Hierarchy

**Organization**:
```
/myapp/
  /dev/
    /database/
      /host = dev-db.example.com
      /port = 3306
      /username = dbuser
      /password = [encrypted]
  /prod/
    /database/
      /host = prod-db.example.com
      /port = 3306
      /username = dbuser
      /password = [encrypted]
```

**Get Parameters by Path**:
```bash
aws ssm get-parameters-by-path \
  --path "/myapp/prod/database" \
  --with-decryption
```

### Parameter Policies (Advanced)

**Expiration Policy**:
```json
{
  "Type": "Expiration",
  "Version": "1.0",
  "Attributes": {
    "Timestamp": "2024-12-31T23:59:59Z"
  }
}
```

**Expiration Notification**:
```json
{
  "Type": "ExpirationNotification",
  "Version": "1.0",
  "Attributes": {
    "Before": "30",
    "Unit": "Days"
  }
}
```

**No Change Notification**:
```json
{
  "Type": "NoChangeNotification",
  "Version": "1.0",
  "Attributes": {
    "After": "60",
    "Unit": "Days"
  }
}
```

### Operations

**Create Parameter**:
```bash
# String parameter
aws ssm put-parameter \
  --name "/myapp/config/endpoint" \
  --value "https://api.example.com" \
  --type String

# SecureString parameter
aws ssm put-parameter \
  --name "/myapp/database/password" \
  --value "MySecurePassword123!" \
  --type SecureString \
  --key-id alias/aws/ssm
```

**Get Parameter**:
```bash
aws ssm get-parameter \
  --name "/myapp/database/password" \
  --with-decryption
```

**Update Parameter**:
```bash
aws ssm put-parameter \
  --name "/myapp/config/endpoint" \
  --value "https://api-v2.example.com" \
  --overwrite
```

### Integration with Other Services

**Lambda**:
```python
import boto3
import os

ssm = boto3.client('ssm')

def lambda_handler(event, context):
    db_host = ssm.get_parameter(
        Name='/myapp/prod/database/host'
    )['Parameter']['Value']
    
    db_password = ssm.get_parameter(
        Name='/myapp/prod/database/password',
        WithDecryption=True
    )['Parameter']['Value']
    
    # Use parameters
```

**ECS Task Definition**:
```json
{
  "containerDefinitions": [
    {
      "name": "myapp",
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:ssm:us-east-1:123456789012:parameter/myapp/prod/database/password"
        }
      ]
    }
  ]
}
```

**CloudFormation**:
```yaml
Parameters:
  DBPassword:
    Type: AWS::SSM::Parameter::Value<String>
    Default: /myapp/prod/database/password
```

## Automation

### What is Automation?

**Purpose**:
- Automate common operational tasks
- Create runbooks for procedures
- Orchestrate AWS API calls
- Approval workflows
- Multi-step operations

**Use Cases**:
- AMI creation and maintenance
- EC2 instance management
- AWS resource management
- Incident response
- Scheduled maintenance

### Automation Documents

**Predefined Runbooks**:
- `AWS-CreateSnapshot`: Create EBS snapshot
- `AWS-RestartEC2Instance`: Restart instance
- `AWS-UpdateLinuxAmi`: Update Linux AMI
- `AWS-ASGEnterStandby`: Put ASG instance in standby
- `AWS-CreateImage`: Create AMI from instance

**Custom Automation**:
```yaml
schemaVersion: '0.3'
description: Create AMI and test launch
parameters:
  InstanceId:
    type: String
    description: Instance to create AMI from
    
mainSteps:
  - name: CreateImage
    action: 'aws:createImage'
    inputs:
      InstanceId: '{{ InstanceId }}'
      ImageName: 'AMI-{{global:DATE_TIME}}'
      NoReboot: true
    outputs:
      - Name: ImageId
        Selector: $.ImageId
        Type: String
  
  - name: WaitForImage
    action: 'aws:waitForAwsResourceProperty'
    inputs:
      Service: ec2
      Api: DescribeImages
      ImageIds:
        - '{{ CreateImage.ImageId }}'
      PropertySelector: '$.Images[0].State'
      DesiredValues:
        - available
  
  - name: TestLaunch
    action: 'aws:runInstances'
    inputs:
      ImageId: '{{ CreateImage.ImageId }}'
      InstanceType: t3.micro
      MinInstanceCount: 1
      MaxInstanceCount: 1
      
  - name: Approval
    action: 'aws:approve'
    inputs:
      Message: 'AMI created: {{ CreateImage.ImageId }}. Approve to continue.'
      MinRequiredApprovals: 1
```

### Execution

**Run Automation**:
```bash
aws ssm start-automation-execution \
  --document-name "AWS-CreateSnapshot" \
  --parameters "VolumeId=vol-123456,Description=Backup"
```

**Rate Control**:
```yaml
Automation Execution:
  Max Concurrency: 10%
  Max Errors: 5%
  Targets: Tag:Environment=Production
```

## Maintenance Windows

### What are Maintenance Windows?

**Purpose**:
- Schedule operational tasks
- Define execution windows
- Control task execution
- Minimize disruption

**Use Cases**:
- Scheduled patching
- Backup operations
- Configuration updates
- Health checks

### Configuration

**Create Maintenance Window**:
```yaml
Maintenance Window: Monthly-Patching
Schedule: cron(0 2 ? * SUN#2 *)  # 2nd Sunday, 2 AM
Duration: 4 hours
Cutoff: 1 hour before end
Timezone: US/Eastern
Allow Unassociated Targets: false
```

**Register Targets**:
```bash
aws ssm register-target-with-maintenance-window \
  --window-id mw-123456 \
  --target-type "INSTANCE" \
  --targets "Key=tag:PatchGroup,Values=WebServers"
```

**Register Tasks**:
```bash
aws ssm register-task-with-maintenance-window \
  --window-id mw-123456 \
  --target-id target-123 \
  --task-type "RUN_COMMAND" \
  --task-arn "AWS-RunPatchBaseline" \
  --priority 1 \
  --max-concurrency 10 \
  --max-errors 5 \
  --parameters "Operation=Install,RebootOption=RebootIfNeeded"
```

**Task Types**:
- **RUN_COMMAND**: Execute Run Command
- **AUTOMATION**: Run Automation document
- **STEP_FUNCTIONS**: Execute Step Functions
- **LAMBDA**: Invoke Lambda function

## Inventory and Compliance

### Inventory

**What is Inventory?**
- Collect metadata from managed instances
- Application inventory
- Network configuration
- File information
- Windows updates

**Inventory Types**:
- Applications
- AWS Components
- Network configuration
- Windows Updates
- Instance detailed information
- Services (Windows/Linux)
- Windows Roles
- Custom inventory

**Setup**:
```yaml
Inventory Association:
  Schedule: rate(30 minutes)
  Targets: All managed instances
  Parameters:
    applications: Enabled
    awsComponents: Enabled
    networkConfig: Enabled
    files: 
      - Path: /etc/
        Pattern: ["*.conf"]
        Recursive: true
```

**Query Inventory**:
```bash
aws ssm get-inventory

aws ssm list-inventory-entries \
  --instance-id i-123456 \
  --type-name "AWS:Application"
```

### Compliance

**Compliance Types**:
- Patch compliance
- Association compliance
- Custom compliance

**Set Custom Compliance**:
```bash
aws ssm put-compliance-items \
  --resource-id i-123456 \
  --resource-type "ManagedInstance" \
  --compliance-type "Custom:AntiVirus" \
  --execution-summary "ExecutionTime=2024-01-15T10:00:00Z" \
  --items "Id=AV-Check,Title=AntiVirus,Severity=CRITICAL,Status=COMPLIANT"
```

## Hybrid Activations

### Managing On-Premises Servers

**Create Activation**:
```bash
aws ssm create-activation \
  --default-instance-name "OnPrem-Server" \
  --iam-role "service-role/AmazonSSMServiceRole" \
  --registration-limit 10 \
  --region us-east-1
```

**Install SSM Agent** (On-Premises):
```bash
# Linux
sudo snap install amazon-ssm-agent --classic
sudo snap start amazon-ssm-agent

# Register
sudo amazon-ssm-agent -register \
  -code "activation-code" \
  -id "activation-id" \
  -region "us-east-1"
```

**Benefits**:
- Unified management (AWS + on-prem)
- Same features as EC2
- Patching, compliance, inventory
- No VPN required (HTTPS outbound)

## Best Practices for SAP-C02

### Design Principles

1. **Use Session Manager Instead of SSH**
   - No bastion hosts
   - No key management
   - Full audit trail
   - VPC endpoints for private access

2. **Automate Patching**
   - Patch baselines per environment
   - Maintenance windows for scheduling
   - Compliance tracking
   - Test patches in dev first

3. **Centralize Configuration**
   - Parameter Store for app config
   - Hierarchical organization
   - Encryption for sensitive data
   - Version control

4. **State Management**
   - Enforce desired state
   - Regular compliance checks
   - Automatic remediation
   - Drift detection

5. **Hybrid Management**
   - Manage on-premises with hybrid activations
   - Consistent tooling
   - Centralized inventory
   - Unified compliance

### Common Exam Scenarios

**Scenario 1**: Secure Remote Access Without SSH Keys
- **Solution**: Session Manager with IAM authentication, CloudTrail logging, no inbound rules

**Scenario 2**: Automated Patch Management
- **Solution**: Patch Manager with patch baselines, patch groups, maintenance windows, compliance tracking

**Scenario 3**: Centralized Application Configuration
- **Solution**: Parameter Store with hierarchical parameters, encryption for secrets, integration with Lambda/ECS

**Scenario 4**: Run Commands Across Hundreds of Instances
- **Solution**: Run Command with tag-based targeting, rate control, S3 output storage

**Scenario 5**: Manage On-Premises and AWS Uniformly
- **Solution**: Systems Manager with hybrid activations, SSM Agent on all servers, centralized management

**Scenario 6**: Maintain Instance Compliance
- **Solution**: State Manager associations, compliance tracking, automated remediation

## Quick Reference

### Common CLI Commands

```bash
# Start session
aws ssm start-session --target i-123456

# Run command
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --targets "Key=tag:env,Values=prod" \
  --parameters 'commands=["uptime"]'

# Create parameter
aws ssm put-parameter \
  --name "/app/db/password" \
  --value "secret" \
  --type SecureString

# Get parameter
aws ssm get-parameter \
  --name "/app/db/password" \
  --with-decryption

# Install patches
aws ssm send-command \
  --document-name "AWS-RunPatchBaseline" \
  --targets "Key=tag:PatchGroup,Values=WebServers" \
  --parameters 'Operation=Install'
```

### Important Limits

- Parameters (Standard): 10,000 per region per account
- Parameters (Advanced): Unlimited (charged)
- Parameter value size (Standard): 4 KB
- Parameter value size (Advanced): 8 KB
- Concurrent executions (Run Command): 100
- Maintenance windows: 50 per region
- SSM Agent connections: No limit

### Exam Tips

1. **Session Manager**: No SSH/RDP, no bastion, IAM auth, CloudTrail audit
2. **Patch Manager**: Automate OS patching, compliance tracking
3. **Parameter Store**: Config management, free standard parameters
4. **Run Command**: Execute commands at scale, no SSH required
5. **State Manager**: Enforce desired configuration
6. **Automation**: Runbooks for operational tasks
7. **Hybrid**: Manage on-prem servers with activations
8. **VPC Endpoints**: Private connectivity, no IGW needed
9. **Integration**: Lambda, ECS, CloudFormation, EventBridge
10. **No cost**: Systems Manager service is free, pay for underlying resources

## Summary

AWS Systems Manager is the unified operations management service for:
- Secure remote access (Session Manager)
- Automated patching (Patch Manager)
- Configuration management (Parameter Store, State Manager)
- Operational automation (Run Command, Automation)
- Hybrid environment management

Key strengths: No SSH/RDP required, comprehensive management suite, hybrid cloud support, automation at scale, centralized configuration, compliance tracking, no service charges.
