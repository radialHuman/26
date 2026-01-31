# Amazon GuardDuty

## What is Amazon GuardDuty?

Amazon GuardDuty is a threat detection service that continuously monitors for malicious activity and unauthorized behavior to protect your AWS accounts, workloads, and data. It uses machine learning, anomaly detection, and integrated threat intelligence to identify and prioritize potential threats. Think of GuardDuty as your AWS security operations center that never sleeps.

## Why Use Amazon GuardDuty?

### Key Benefits
- **Intelligent Threat Detection**: ML-powered anomaly detection
- **Continuous Monitoring**: 24/7 protection with no downtime
- **Easy to Enable**: One-click activation, no agents required
- **Comprehensive Coverage**: Account, instance, and data-level threats
- **Integrated Threat Intelligence**: AWS Security, CrowdStrike, Proofpoint feeds
- **Low Cost**: Pay only for events analyzed
- **Multi-Account Support**: Centralized management via Organizations

### Use Cases
- Detecting compromised EC2 instances
- Identifying reconnaissance activity
- Detecting cryptocurrency mining
- Monitoring for data exfiltration
- Finding exposed credentials
- Detecting unusual API calls
- Compliance and security auditing
- Automated incident response

## How GuardDuty Works

### Architecture

```
Data Sources → GuardDuty Analysis Engine → Findings
     ↓              (ML + Threat Intel)         ↓
CloudTrail                              EventBridge
VPC Flow Logs                          SNS/Lambda
DNS Logs                              Security Hub
S3 Data Events                        SIEM Integration
EKS Audit Logs
```

### Data Sources

**1. AWS CloudTrail Management Events**:
- API calls across AWS services
- Authentication events
- Configuration changes
- Unusual behavior patterns

**2. AWS CloudTrail S3 Data Events**:
- S3 object-level API activity
- GetObject, PutObject, DeleteObject
- Unusual access patterns

**3. VPC Flow Logs**:
- Network traffic analysis
- Port scanning detection
- Communication with known malicious IPs
- Data exfiltration attempts

**4. DNS Logs**:
- DNS query patterns
- Communication with known C&C servers
- Domain generation algorithm (DGA) detection
- Cryptocurrency mining indicators

**5. EKS Audit Logs** (Optional):
- Kubernetes API server audit logs
- Suspicious kubectl commands
- Container runtime monitoring

**6. RDS Login Activity** (Optional):
- Failed login attempts
- Brute force attacks
- Anomalous database access

**Important**: 
- GuardDuty doesn't manage these logs
- Doesn't require you to enable them
- Creates independent stream of log data
- No impact on existing CloudTrail or VPC Flow Log configurations

## Core Concepts

### Findings

**What is a Finding?**
- Potential security issue detected
- Contains detailed information about the threat
- Assigned severity level
- Includes remediation recommendations

**Severity Levels**:
- **Low (0.1 - 3.9)**: Suspicious but low impact
- **Medium (4.0 - 6.9)**: Potentially malicious activity
- **High (7.0 - 8.9)**: Compromised resource or credentials
- **Critical (9.0 - 10.0)**: Severe threat requiring immediate action

**Finding Structure**:
```json
{
  "AccountId": "123456789012",
  "Region": "us-east-1",
  "Type": "UnauthorizedAccess:EC2/SSHBruteForce",
  "Severity": 8.5,
  "Title": "SSH brute force attack detected",
  "Description": "Multiple failed SSH authentication attempts...",
  "Resource": {
    "ResourceType": "Instance",
    "InstanceDetails": {
      "InstanceId": "i-123456789",
      "ImageId": "ami-abc123",
      "InstanceType": "t3.micro"
    }
  },
  "Service": {
    "Action": {
      "ActionType": "NETWORK_CONNECTION",
      "NetworkConnectionAction": {
        "RemoteIpDetails": {
          "IpAddressV4": "198.51.100.1",
          "Country": {"CountryName": "Unknown"}
        }
      }
    }
  }
}
```

### Finding Types

**Backdoor Finding Types**:
- `Backdoor:EC2/C&CActivity.B`: Instance querying C&C server
- `Backdoor:EC2/DenialOfService.Tcp`: Instance performing DoS attack
- `Backdoor:EC2/Spambot`: Instance sending spam

**CryptoCurrency Finding Types**:
- `CryptoCurrency:EC2/BitcoinTool.B`: Bitcoin mining software detected
- `CryptoCurrency:EC2/BitcoinTool.B!DNS`: DNS query for bitcoin mining pool

**Persistence Finding Types**:
- `Persistence:IAMUser/UserPermissions`: User permissions modified
- `Persistence:IAMUser/NetworkPermissions`: Network permissions changed

**Recon Finding Types**:
- `Recon:EC2/PortProbeUnprotectedPort`: Port scanning detected
- `Recon:EC2/PortProbeEMRUnprotectedPort`: EMR port scanning
- `Recon:IAMUser/TorIPCaller`: API calls from Tor exit node

**Stealth Finding Types**:
- `Stealth:IAMUser/CloudTrailLoggingDisabled`: CloudTrail disabled
- `Stealth:IAMUser/PasswordPolicyChange`: Password policy weakened

**Trojan Finding Types**:
- `Trojan:EC2/BlackholeTraffic`: Instance sending traffic to blackhole
- `Trojan:EC2/DriveBySourceTraffic`: Drive-by download source

**UnauthorizedAccess Finding Types**:
- `UnauthorizedAccess:EC2/SSHBruteForce`: SSH brute force attack
- `UnauthorizedAccess:EC2/RDPBruteForce`: RDP brute force attack
- `UnauthorizedAccess:IAMUser/ConsoleLoginSuccess.B`: Unusual console login
- `UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration`: Credentials used from external IP

**Exfiltration Finding Types**:
- `Exfiltration:S3/ObjectRead.Unusual`: Unusual S3 data access
- `Exfiltration:S3/AnomalousBehavior`: Anomalous S3 API behavior

**Impact Finding Types**:
- `Impact:EC2/WinRMBruteForce`: WinRM brute force attack
- `Impact:EC2/PortSweep`: Port sweep from instance

**Policy Finding Types**:
- `Policy:IAMUser/RootCredentialUsage`: Root account usage
- `Policy:S3/AccountBlockPublicAccessDisabled`: S3 block public access disabled

## Multi-Account Configuration

### Administrator-Member Model

**GuardDuty Administrator Account**:
- Central account managing GuardDuty
- Views findings from all member accounts
- Configures settings for members
- Can be delegated via AWS Organizations

**Member Accounts**:
- Generate findings
- Can view own findings
- Settings managed by administrator

**Setup via Organizations**:
```
1. Enable GuardDuty in management account
2. Designate delegated administrator account
3. Auto-enable for organization (optional)
4. Member accounts automatically join
```

**Manual Invitation** (without Organizations):
```
1. Administrator sends invitation
2. Member accepts invitation
3. Member account associated
```

**Benefits of Delegated Administrator**:
- Centralized security operations
- Reduced management account usage
- Security account owns GuardDuty
- Automatic enablement for new accounts

### Auto-Enable for Organization

**Configuration**:
```yaml
Auto-Enable Settings:
  S3 Protection: Enabled
  EKS Protection: Enabled
  RDS Protection: Enabled
  Malware Protection: Enabled
  Apply to new accounts: Automatically
```

**Benefits**:
- New accounts protected immediately
- Consistent security posture
- No manual intervention
- Centralized compliance

## Advanced Features

### S3 Protection

**What it monitors**:
- S3 data events (GetObject, PutObject, DeleteObject, etc.)
- Unusual access patterns
- Suspicious API calls
- Data exfiltration attempts

**Finding Examples**:
- `Exfiltration:S3/ObjectRead.Unusual`: Unusual data download
- `Impact:S3/PermissionsModification.Unusual`: Unexpected permission changes
- `Policy:S3/BucketBlockPublicAccessDisabled`: Public access enabled

**Configuration**:
```bash
# Enable S3 Protection
aws guardduty update-detector \
  --detector-id abc123 \
  --data-sources S3Logs={Enable=true}
```

**Cost**: Additional charges based on GB of data scanned

### EKS Protection

**What it monitors**:
- EKS audit logs
- Kubernetes API server activity
- Suspicious kubectl commands
- Container runtime events

**Finding Examples**:
- `PrivilegeEscalation:Runtime/ContainerMountsHostDirectory`: Container mounted host directory
- `Execution:Runtime/NewBinaryExecuted`: New binary executed in container
- `Policy:Kubernetes/AdminAccessToDefaultServiceAccount`: Admin access granted to default SA

**Configuration**:
```bash
# Enable EKS Protection
aws guardduty update-detector \
  --detector-id abc123 \
  --data-sources EKSAuditLogs={Enable=true}
```

**Requirements**:
- EKS clusters in region
- GuardDuty automatically discovers clusters
- No agent installation needed

### RDS Protection

**What it monitors**:
- RDS login activity
- Failed authentication attempts
- Brute force attacks
- Anomalous database access

**Supported Engines**:
- Amazon Aurora (MySQL, PostgreSQL)
- Amazon RDS for MySQL
- Amazon RDS for PostgreSQL
- Amazon RDS for MariaDB

**Finding Examples**:
- `CredentialAccess:RDS/AnomalousBehavior.SuccessfulBruteForce`: Successful brute force
- `UnauthorizedAccess:RDS/AnomalousBehavior.SuccessfulLogin`: Login from unusual location

**Configuration**:
```bash
# Enable RDS Protection
aws guardduty update-detector \
  --detector-id abc123 \
  --data-sources RDSLoginActivityMonitoring={Enable=true}
```

### Malware Protection for EC2

**What it does**:
- Scans EBS volumes for malware
- Triggered by GuardDuty findings
- Uses agentless scanning
- Detects malware signatures

**How it works**:
```
GuardDuty Finding (suspicious EC2) → Trigger Malware Scan
                                           ↓
                                  EBS Snapshot Created
                                           ↓
                                  Scan for Malware
                                           ↓
                          Finding: Execution:EC2/MaliciousFile
```

**Configuration**:
```yaml
Malware Protection Settings:
  Enable: true
  Snapshot Retention: 1-7 days
  GuardDuty Service Role: Auto-created
  Encryption: Same as source volume
```

### Trusted IP Lists and Threat Lists

**Trusted IP Lists** (Suppression):
- IP addresses you trust
- Suppress findings from these IPs
- Example: Corporate VPN IPs, office IPs

**Format** (plaintext, CIDR):
```
192.0.2.0/24
198.51.100.1
203.0.113.0/24
```

**Threat IP Lists** (Custom Threats):
- Known malicious IPs
- Generate findings for activity from these IPs
- Supplement built-in threat intelligence

**Upload to S3**:
```bash
# Upload list
aws s3 cp trusted_ips.txt s3://my-bucket/trusted_ips.txt

# Add to GuardDuty
aws guardduty create-ip-set \
  --detector-id abc123 \
  --name TrustedIPs \
  --format TXT \
  --location s3://my-bucket/trusted_ips.txt \
  --activate
```

### Suppression Rules

**What are they?**
- Filter findings automatically
- Reduce noise from expected behavior
- Based on finding criteria

**Example Suppression Rule**:
```json
{
  "Name": "Suppress-Internal-Port-Scans",
  "Description": "Ignore port scans from security scanners",
  "Filter": {
    "Criterion": {
      "type": ["Recon:EC2/PortProbeUnprotectedPort"],
      "resource.instanceDetails.networkInterfaces.privateIpAddress": ["10.0.1.100"]
    }
  }
}
```

**Use Cases**:
- Suppress findings from vulnerability scanners
- Ignore known false positives
- Filter findings from test environments
- Reduce alert fatigue

## Automated Response

### EventBridge Integration

**Architecture**:
```
GuardDuty Finding → EventBridge → Target (SNS, Lambda, Step Functions)
```

**EventBridge Rule Example**:
```json
{
  "source": ["aws.guardduty"],
  "detail-type": ["GuardDuty Finding"],
  "detail": {
    "severity": [7, 8, 9, 10],
    "type": ["UnauthorizedAccess:EC2/SSHBruteForce"]
  }
}
```

**Lambda Response Actions**:
```python
import boto3

def lambda_handler(event, context):
    finding = event['detail']
    instance_id = finding['resource']['instanceDetails']['instanceId']
    
    ec2 = boto3.client('ec2')
    
    # Isolate instance
    ec2.modify_instance_attribute(
        InstanceId=instance_id,
        Groups=['sg-quarantine']
    )
    
    # Create snapshot
    volumes = ec2.describe_volumes(
        Filters=[{'Name': 'attachment.instance-id', 'Values': [instance_id]}]
    )
    for volume in volumes['Volumes']:
        ec2.create_snapshot(
            VolumeId=volume['VolumeId'],
            Description=f'GuardDuty incident {finding["id"]}'
        )
    
    # Send notification
    sns = boto3.client('sns')
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123456789012:security-alerts',
        Subject='GuardDuty High Severity Finding',
        Message=f'Finding: {finding["type"]}\nInstance: {instance_id}'
    )
```

**Common Response Actions**:
1. **Isolate Instance**: Modify security group
2. **Snapshot Volume**: Forensic analysis
3. **Revoke IAM Credentials**: Disable compromised keys
4. **Block IP**: Update NACL or security group
5. **Send Notification**: SNS, Slack, PagerDuty
6. **Create Ticket**: ServiceNow, Jira integration
7. **Invoke Step Functions**: Complex workflow

### Security Hub Integration

**Automatic Integration**:
- GuardDuty findings sent to Security Hub
- Centralized security dashboard
- Aggregated findings from multiple services
- Standard finding format (ASFF)

**Configuration**:
```
GuardDuty → Settings → Enable Security Hub integration
```

**Benefits**:
- Single pane of glass
- Correlation with other security findings
- Compliance reporting
- Automated remediation

### Detective Integration

**What is it?**
- Automatic behavior graphs
- Investigate GuardDuty findings
- Visualize relationships
- Root cause analysis

**How it works**:
```
GuardDuty Finding → Detective → Behavior Graph
                                      ↓
                     Visualize: IP → Instance → User → API Calls
```

## Monitoring and Reporting

### CloudWatch Metrics

**Automatic Metrics**:
GuardDuty doesn't publish to CloudWatch by default. Use EventBridge to create custom metrics.

**Custom Metric Example**:
```python
# Lambda function triggered by GuardDuty finding
cloudwatch = boto3.client('cloudwatch')
cloudwatch.put_metric_data(
    Namespace='Security/GuardDuty',
    MetricData=[
        {
            'MetricName': 'HighSeverityFindings',
            'Value': 1,
            'Unit': 'Count',
            'Dimensions': [
                {'Name': 'FindingType', 'Value': finding['type']},
                {'Name': 'Severity', 'Value': str(finding['severity'])}
            ]
        }
    ]
)
```

### Exporting Findings

**To S3** (via EventBridge + Firehose):
```
GuardDuty → EventBridge → Kinesis Firehose → S3
```

**To SIEM** (Splunk, Sumo Logic):
```
GuardDuty → EventBridge → Lambda → SIEM API
```

**Use Cases**:
- Long-term retention
- Compliance auditing
- Data lake analytics
- SIEM correlation

### Reporting

**Finding Frequency**:
- Real-time detection
- Findings appear within minutes
- 15-minute update intervals

**Finding Archive**:
- Auto-archived after 90 days
- Can archive manually
- Archived findings searchable
- No impact on billing

**Sample Findings**:
- Generate test findings
- Validate integrations
- Test response workflows
- One sample per finding type

```bash
# Generate sample findings
aws guardduty create-sample-findings \
  --detector-id abc123 \
  --finding-types UnauthorizedAccess:EC2/SSHBruteForce
```

## Cost Optimization

### Pricing Model

**CloudTrail Events Analysis**:
- First 5 million events/month: Free (30-day trial)
- Additional events: $4.00 per million

**VPC Flow Logs and DNS Logs Analysis**:
- Per GB analyzed
- $1.00 per GB (first 500 GB)
- $0.50 per GB (next 4,500 GB)
- Tiered pricing thereafter

**S3 Data Events**:
- Per GB of data scanned
- $0.80 per GB

**EKS Audit Logs**:
- Per GB analyzed
- $1.00 per GB

**RDS Login Activity**:
- Per million requests
- $0.10 per million

**Malware Scans**:
- Per GB scanned
- $0.18 per GB

**Example Monthly Cost**:
```
Account Activity:
  - CloudTrail: 10M events = $20
  - VPC/DNS: 100 GB = $100
  - S3: 50 GB = $40
  - EKS: 10 GB = $10
Total: ~$170/month
```

### Cost Reduction Strategies

**1. Selective Feature Enablement**:
- Enable S3 protection only for sensitive buckets
- EKS protection only in production
- RDS protection for critical databases

**2. Use Suppression Rules**:
- Reduce processing of known benign findings
- Filter expected behavior
- Lower data analyzed

**3. Multi-Account Strategy**:
- Centralized GuardDuty in security account
- Single payer for better tier pricing
- Consolidated management

**4. Monitor Usage**:
```bash
# Check usage metrics
aws guardduty get-usage-statistics \
  --detector-id abc123 \
  --usage-statistic-type SUM_BY_RESOURCE
```

## Best Practices for SAP-C02

### Design Principles

1. **Enable GuardDuty in All Accounts**
   - Comprehensive threat detection
   - No gaps in coverage
   - Auto-enable for new accounts

2. **Use Delegated Administrator**
   - Security account manages GuardDuty
   - Centralized findings
   - Reduced management account usage

3. **Automate Response**
   - EventBridge rules for findings
   - Lambda for remediation
   - Step Functions for workflows

4. **Integrate with Security Hub**
   - Centralized security posture
   - Aggregated findings
   - Compliance dashboards

5. **Export Findings to S3**
   - Long-term retention
   - Compliance requirements
   - Analytics and reporting

6. **Regularly Review Findings**
   - Tune suppression rules
   - Identify patterns
   - Improve security posture

### Common Exam Scenarios

**Scenario 1**: Detect and Respond to Compromised EC2 Instance
- **Solution**: GuardDuty detects unusual activity, EventBridge triggers Lambda to isolate instance, create snapshot, notify team

**Scenario 2**: Multi-Account Threat Detection
- **Solution**: Enable GuardDuty in all accounts via Organizations, designate security account as delegated administrator

**Scenario 3**: Detect Unusual S3 Access Patterns
- **Solution**: Enable S3 Protection in GuardDuty, integrate with Security Hub, set up alerts for exfiltration findings

**Scenario 4**: Monitor EKS for Container Threats
- **Solution**: Enable EKS Protection, integrate with Detective for investigation, automate response for privilege escalation

**Scenario 5**: Compliance Requirement for Threat Detection Logs
- **Solution**: GuardDuty findings to EventBridge to Kinesis Firehose to S3, enable encryption and lifecycle policies

**Scenario 6**: Reduce False Positives from Security Scanners
- **Solution**: Create suppression rules for known scanner IPs, add scanner IPs to trusted IP list

## GuardDuty vs Other Services

| Feature | GuardDuty | Security Hub | Macie | Inspector |
|---------|-----------|--------------|-------|-----------|
| **Focus** | Threat detection | Security posture | Data discovery | Vulnerability scanning |
| **Data Sources** | CloudTrail, VPC, DNS | Multiple services | S3 data | EC2, containers |
| **ML-Based** | Yes | No | Yes | No |
| **Continuous** | Yes | Yes | Yes | On-demand |
| **Multi-Account** | Yes | Yes | Yes | Yes |
| **Use Case** | Active threats | Compliance | Data protection | Vulnerabilities |

## Quick Reference

### Common CLI Commands

```bash
# Enable GuardDuty
aws guardduty create-detector --enable

# List detectors
aws guardduty list-detectors

# List findings
aws guardduty list-findings \
  --detector-id abc123 \
  --finding-criteria '{"Criterion":{"severity":{"Gte":7}}}'

# Get finding details
aws guardduty get-findings \
  --detector-id abc123 \
  --finding-ids finding-id-123

# Archive finding
aws guardduty archive-findings \
  --detector-id abc123 \
  --finding-ids finding-id-123

# Enable S3 Protection
aws guardduty update-detector \
  --detector-id abc123 \
  --data-sources S3Logs={Enable=true}

# Create suppression rule
aws guardduty create-filter \
  --detector-id abc123 \
  --name IgnoreInternalScans \
  --action ARCHIVE \
  --finding-criteria file://criteria.json
```

### Important Limits

- Detectors per region: 1
- Trusted IP lists: 1
- Threat lists: 6
- Filters (suppression rules): 50
- IP list size: 2,000 IPs or CIDR ranges
- Threat list size: 250,000 IPs or domains
- Finding retention: 90 days

### Exam Tips

1. **GuardDuty for threat detection**: Continuous monitoring using ML
2. **No agents required**: Analyzes CloudTrail, VPC Flow Logs, DNS logs
3. **Multi-account via Organizations**: Delegated administrator model
4. **Automatic response**: EventBridge integration for automation
5. **S3/EKS/RDS protection**: Optional features with additional cost
6. **Findings severity**: Low, Medium, High (7+), Critical (9+)
7. **Integration**: Security Hub (aggregation), Detective (investigation)
8. **Suppression rules**: Reduce noise from known benign activity
9. **Trusted IP lists**: Suppress findings from corporate IPs
10. **Cost**: Based on events/data analyzed, tiered pricing

## Summary

Amazon GuardDuty is the intelligent threat detection service for:
- Continuous monitoring of AWS accounts and workloads
- ML-powered detection of malicious activity
- Multi-account centralized security management
- Automated incident response integration
- Comprehensive protection (compute, data, containers)

Key strengths: No agents/infrastructure, ML-based detection, integrated threat intelligence, multi-account support, automatic enablement, EventBridge integration for automation, Security Hub aggregation.
