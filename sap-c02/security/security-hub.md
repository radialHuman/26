# AWS Security Hub

## What is AWS Security Hub?

AWS Security Hub is a cloud security posture management service that performs security best practice checks, aggregates alerts, and enables automated remediation. It provides a comprehensive view of your security state in AWS and helps you check your environment against security industry standards and best practices. Think of Security Hub as your centralized security command center.

## Why Use AWS Security Hub?

### Key Benefits
- **Centralized Security View**: Single dashboard for all security findings
- **Automated Compliance Checks**: Built-in security standards
- **Aggregated Findings**: From GuardDuty, Inspector, Macie, and more
- **Continuous Monitoring**: Real-time security posture assessment
- **Automated Remediation**: Integration with EventBridge and Systems Manager
- **Multi-Account Support**: Organization-wide security management
- **Standard Format**: AWS Security Finding Format (ASFF)

### Use Cases
- Continuous compliance monitoring
- Security posture management
- Aggregating security findings
- Automated remediation workflows
- SOC dashboard and reporting
- Regulatory compliance (PCI-DSS, CIS, etc.)
- Third-party SIEM integration
- Multi-account security oversight

## How Security Hub Works

### Architecture

```
AWS Services          Third-Party Tools
     ↓                      ↓
  Findings  →  Security Hub  ← Custom Findings
                    ↓
         Security Standards
         (Compliance Checks)
                    ↓
        Aggregated Dashboard
                    ↓
    EventBridge → Automation
```

### Core Components

**1. Findings**:
- Security issues from integrated services
- Compliance check results
- Custom findings via API
- Standard ASFF format

**2. Security Standards**:
- **AWS Foundational Security Best Practices (FSBP)**
- **CIS AWS Foundations Benchmark**
- **PCI DSS v3.2.1**
- **NIST SP 800-53 Rev. 5**
- Custom security standards

**3. Insights**:
- Grouped collections of findings
- Pre-defined and custom
- Track specific security issues

**4. Integrations**:
- **AWS Services**: GuardDuty, Inspector, Macie, IAM Access Analyzer, Firewall Manager, Health
- **Third-Party**: Splunk, PagerDuty, ServiceNow, Atlassian
- **Custom**: Via API

## AWS Security Finding Format (ASFF)

### Structure

```json
{
  "SchemaVersion": "2018-10-08",
  "Id": "arn:aws:securityhub:us-east-1:123456789012:subscription/...",
  "ProductArn": "arn:aws:securityhub:us-east-1::product/aws/guardduty",
  "GeneratorId": "guardduty-detector-id",
  "AwsAccountId": "123456789012",
  "Types": ["Software and Configuration Checks/AWS Security Best Practices"],
  "CreatedAt": "2024-01-15T10:00:00.000Z",
  "UpdatedAt": "2024-01-15T10:00:00.000Z",
  "Severity": {
    "Label": "HIGH",
    "Normalized": 80
  },
  "Title": "EC2 instance i-123456 is not managed by Systems Manager",
  "Description": "This EC2 instance is not managed by AWS Systems Manager...",
  "Resources": [
    {
      "Type": "AwsEc2Instance",
      "Id": "arn:aws:ec2:us-east-1:123456789012:instance/i-123456",
      "Region": "us-east-1",
      "Details": {
        "AwsEc2Instance": {
          "Type": "t3.micro",
          "ImageId": "ami-123456",
          "VpcId": "vpc-123456"
        }
      }
    }
  ],
  "Compliance": {
    "Status": "FAILED",
    "RelatedRequirements": ["PCI-DSS 2.4", "CIS AWS 1.2"]
  },
  "Remediation": {
    "Recommendation": {
      "Text": "Install SSM Agent and attach IAM role...",
      "Url": "https://docs.aws.amazon.com/systems-manager/..."
    }
  }
}
```

### Severity Levels

**Normalized Score (0-100)**:
- **INFORMATIONAL**: 0
- **LOW**: 1-39
- **MEDIUM**: 40-69
- **HIGH**: 70-89
- **CRITICAL**: 90-100

**Severity Label Mapping**:
```
GuardDuty: 0.1-3.9 → LOW
GuardDuty: 4.0-6.9 → MEDIUM
GuardDuty: 7.0-8.9 → HIGH
GuardDuty: 9.0-10.0 → CRITICAL
```

## Security Standards and Controls

### AWS Foundational Security Best Practices (FSBP)

**What is it?**
- AWS-curated set of security controls
- Aligned with industry best practices
- Automatically enabled
- Regular updates from AWS

**Control Categories**:
- **Account**: Root user usage, IAM password policy
- **CloudTrail**: Multi-region trails, encryption
- **Config**: Recording enabled, delivery
- **EC2**: Unrestricted access, IMDSv2
- **ELB**: Logging, deletion protection
- **IAM**: MFA, access keys rotation
- **RDS**: Encryption, backups, public access
- **S3**: Bucket policies, versioning, logging
- **VPC**: Flow logs, default security group

**Example Controls**:
- `[Account.1]` Security contact information should be provided
- `[CloudTrail.1]` CloudTrail should be enabled and configured with at least one multi-region trail
- `[EC2.2]` VPC default security group should not allow inbound/outbound traffic
- `[IAM.4]` IAM root user access key should not exist
- `[S3.1]` S3 Block Public Access setting should be enabled

### CIS AWS Foundations Benchmark

**What is it?**
- Industry consensus security standard
- Developed by Center for Internet Security
- Version 1.2.0 and 1.4.0 available
- Prescriptive guidance

**Sections**:
1. **Identity and Access Management**
2. **Storage**
3. **Logging**
4. **Monitoring**
5. **Networking**

**Example Controls**:
- `[1.4]` Ensure no root account access key exists
- `[1.12]` Ensure credentials unused for 90 days are disabled
- `[2.1.1]` Ensure S3 bucket access logging is enabled
- `[3.1]` Ensure CloudTrail is enabled in all regions
- `[4.3]` Ensure a log metric filter and alarm exist for usage of root account

### PCI DSS v3.2.1

**What is it?**
- Payment Card Industry Data Security Standard
- Required for organizations handling card data
- Compliance validation

**Requirements**:
- **1**: Firewalls and network security
- **2**: Secure configurations
- **3**: Protect stored cardholder data
- **4**: Encrypt transmission
- **8**: Access control
- **10**: Logging and monitoring

**Example Controls**:
- `[PCI.AutoScaling.1]` Auto Scaling groups associated with a load balancer should use health checks
- `[PCI.CloudTrail.2]` CloudTrail should be enabled
- `[PCI.EC2.2]` VPC default security group should prohibit inbound and outbound traffic
- `[PCI.Lambda.1]` Lambda functions should prohibit public access

### NIST SP 800-53 Rev. 5

**What is it?**
- US government security standard
- National Institute of Standards and Technology
- Comprehensive control framework

**Control Families**:
- **AC**: Access Control
- **AU**: Audit and Accountability
- **CA**: Assessment, Authorization
- **CM**: Configuration Management
- **IA**: Identification and Authentication
- **SC**: System and Communications Protection

## Multi-Account Configuration

### Administrator-Member Model

**Security Hub Administrator**:
- Central account for security management
- Views findings from all member accounts
- Enables security standards
- Manages integrations

**Member Accounts**:
- Send findings to administrator
- Can view own findings
- Settings managed by administrator

**Setup via Organizations**:
```
1. Enable Security Hub in management account
2. Designate delegated administrator account
3. Auto-enable for organization
4. Member accounts automatically join
```

**Benefits**:
- Centralized security operations
- Single dashboard for all accounts
- Consistent security standards
- Automated onboarding

### Finding Aggregation

**Cross-Region Aggregation**:
```
Primary Region (us-east-1)
    ↑
Findings from all regions
    ↑
┌───┴───┬───────┬───────┐
│       │       │       │
us-east-2  eu-west-1  ap-south-1
```

**Configuration**:
```bash
# Designate aggregation region
aws securityhub create-finding-aggregator \
  --region-linking-mode ALL_REGIONS
```

**Benefits**:
- Single-region view
- Simplified operations
- Reduced console switching
- Centralized reporting

## Automated Remediation

### EventBridge Integration

**Architecture**:
```
Security Hub Finding → EventBridge → Target (Lambda, Systems Manager, Step Functions)
```

**EventBridge Rule Pattern**:
```json
{
  "source": ["aws.securityhub"],
  "detail-type": ["Security Hub Findings - Imported"],
  "detail": {
    "findings": {
      "Severity": {
        "Label": ["HIGH", "CRITICAL"]
      },
      "Compliance": {
        "Status": ["FAILED"]
      },
      "Workflow": {
        "Status": ["NEW"]
      }
    }
  }
}
```

### Common Remediation Patterns

**1. S3 Bucket Public Access**:
```python
# Lambda function
import boto3

def lambda_handler(event, context):
    finding = event['detail']['findings'][0]
    bucket_arn = finding['Resources'][0]['Id']
    bucket_name = bucket_arn.split(':')[-1].split('/')[-1]
    
    s3 = boto3.client('s3')
    s3.put_public_access_block(
        Bucket=bucket_name,
        PublicAccessBlockConfiguration={
            'BlockPublicAcls': True,
            'IgnorePublicAcls': True,
            'BlockPublicPolicy': True,
            'RestrictPublicBuckets': True
        }
    )
    
    # Update finding status
    securityhub = boto3.client('securityhub')
    securityhub.batch_update_findings(
        FindingIdentifiers=[
            {
                'Id': finding['Id'],
                'ProductArn': finding['ProductArn']
            }
        ],
        Workflow={'Status': 'RESOLVED'},
        Note={
            'Text': 'Automatically remediated: Enabled S3 Block Public Access',
            'UpdatedBy': 'AutoRemediation'
        }
    )
```

**2. Security Group Unrestricted Access**:
```python
def remediate_security_group(finding):
    ec2 = boto3.client('ec2')
    sg_id = extract_sg_id(finding)
    
    # Remove unrestricted inbound rules
    ec2.revoke_security_group_ingress(
        GroupId=sg_id,
        IpPermissions=[
            {
                'IpProtocol': '-1',
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}],
                'Ipv6Ranges': [{'CidrIpv6': '::/0'}]
            }
        ]
    )
```

**3. IAM Access Key Rotation**:
```python
def rotate_old_access_keys(finding):
    iam = boto3.client('iam')
    user_name = extract_user_name(finding)
    
    # List access keys
    keys = iam.list_access_keys(UserName=user_name)
    
    for key in keys['AccessKeyMetadata']:
        age = (datetime.now(timezone.utc) - key['CreateDate']).days
        if age > 90:
            # Deactivate old key
            iam.update_access_key(
                UserName=user_name,
                AccessKeyId=key['AccessKeyId'],
                Status='Inactive'
            )
            
            # Notify user
            notify_user(user_name, key['AccessKeyId'])
```

### Systems Manager Automation

**Using Automation Documents**:
```yaml
AWSConfigRemediation-EnableCloudTrailLogFileValidation:
  Type: AWS::SSM::Document
  Properties:
    DocumentType: Automation
    Content:
      schemaVersion: '0.3'
      parameters:
        TrailName:
          type: String
      mainSteps:
        - name: EnableLogFileValidation
          action: 'aws:executeAwsApi'
          inputs:
            Service: cloudtrail
            Api: UpdateTrail
            Name: '{{ TrailName }}'
            EnableLogFileValidation: true
```

**Trigger from EventBridge**:
```json
{
  "Targets": [
    {
      "Arn": "arn:aws:ssm:us-east-1:123456789012:automation-definition/EnableCloudTrailValidation",
      "RoleArn": "arn:aws:iam::123456789012:role/SecurityHubRemediationRole",
      "Input": "{\"TrailName\": [\"$.detail.findings[0].Resources[0].Details.AwsCloudTrailTrail.Name\"]}"
    }
  ]
}
```

## Insights

### What are Insights?

**Purpose**:
- Group related findings
- Track specific security issues
- Dashboard widgets
- Trending analysis

**Managed Insights** (AWS-provided):
- `AWS resources with the most findings`
- `S3 buckets with public write or read permissions`
- `EC2 instances involved in known Tactics, Techniques, and Procedures (TTPs)`
- `IAM users with suspicious activity`
- `Top resources by counts of failed CIS checks`

**Custom Insights**:
```json
{
  "Name": "High Severity Findings in Production",
  "Filters": {
    "SeverityLabel": [{"Value": "HIGH", "Comparison": "EQUALS"}],
    "SeverityLabel": [{"Value": "CRITICAL", "Comparison": "EQUALS"}],
    "ResourceTags": [
      {
        "Key": "Environment",
        "Value": "Production",
        "Comparison": "EQUALS"
      }
    ]
  },
  "GroupByAttribute": "ResourceType"
}
```

### Insight Use Cases

**1. Track Compliance Drift**:
```
Insight: Failed PCI-DSS controls over time
Filter: ComplianceStatus = FAILED, Standard = PCI-DSS
GroupBy: Time
```

**2. Monitor High-Risk Resources**:
```
Insight: Resources with multiple critical findings
Filter: SeverityLabel = CRITICAL
GroupBy: ResourceId
Having: Count > 3
```

**3. Security Posture by Environment**:
```
Insight: Findings by environment tag
Filter: All findings
GroupBy: ResourceTags.Environment
```

## Integrations

### AWS Service Integrations

**Automatic Sending to Security Hub**:
- **Amazon GuardDuty**: Threat detection findings
- **Amazon Inspector**: Vulnerability assessment
- **Amazon Macie**: Sensitive data discovery
- **AWS IAM Access Analyzer**: Public/cross-account access
- **AWS Firewall Manager**: Security policy violations
- **AWS Health**: Service health events
- **AWS Systems Manager Patch Manager**: Patch compliance

**Enable Integration**:
```bash
aws securityhub enable-import-findings-for-product \
  --product-arn arn:aws:securityhub:us-east-1::product/aws/guardduty
```

### Third-Party Integrations

**AWS Marketplace Partners**:
- **Splunk**: SIEM integration
- **PagerDuty**: Incident management
- **ServiceNow**: ITSM ticketing
- **Atlassian Jira**: Issue tracking
- **Atlassian Opsgenie**: Alert management
- **Palo Alto Networks**: Firewall findings
- **Trend Micro**: Endpoint protection
- **CrowdStrike**: EDR findings

**Custom Integrations via API**:
```python
import boto3

securityhub = boto3.client('securityhub')

# Submit custom finding
securityhub.batch_import_findings(
    Findings=[
        {
            'SchemaVersion': '2018-10-08',
            'Id': 'custom-finding-001',
            'ProductArn': 'arn:aws:securityhub:us-east-1:123456789012:product/123456789012/default',
            'GeneratorId': 'custom-scanner',
            'AwsAccountId': '123456789012',
            'Types': ['Software and Configuration Checks/Vulnerabilities/CVE'],
            'CreatedAt': '2024-01-15T10:00:00.000Z',
            'UpdatedAt': '2024-01-15T10:00:00.000Z',
            'Severity': {'Normalized': 70, 'Label': 'HIGH'},
            'Title': 'Critical vulnerability detected',
            'Description': 'CVE-2024-1234 found in application',
            'Resources': [
                {
                    'Type': 'AwsEc2Instance',
                    'Id': 'arn:aws:ec2:us-east-1:123456789012:instance/i-123456'
                }
            ]
        }
    ]
)
```

## Monitoring and Reporting

### Dashboard

**Summary View**:
- Security score (0-100)
- Active findings by severity
- Failed security checks
- Compliance status by standard
- Insights widgets

**Filters**:
- Severity
- Workflow status (New, Notified, Resolved, Suppressed)
- Record state (Active, Archived)
- Product
- Resource type
- Compliance status

### Compliance Reports

**Generate Compliance Report**:
```python
import boto3
from datetime import datetime

securityhub = boto3.client('securityhub')

# Get compliance summary
response = securityhub.get_findings(
    Filters={
        'ComplianceStatus': [{'Value': 'FAILED', 'Comparison': 'EQUALS'}],
        'RecordState': [{'Value': 'ACTIVE', 'Comparison': 'EQUALS'}]
    }
)

# Group by standard
compliance_by_standard = {}
for finding in response['Findings']:
    for requirement in finding.get('Compliance', {}).get('RelatedRequirements', []):
        standard = requirement.split()[0]
        compliance_by_standard.setdefault(standard, []).append(finding)

# Generate report
print(f"Compliance Report - {datetime.now()}")
for standard, findings in compliance_by_standard.items():
    print(f"{standard}: {len(findings)} failed controls")
```

### CloudWatch Metrics

**Custom Metrics from Findings**:
```python
# Lambda triggered by EventBridge
import boto3

cloudwatch = boto3.client('cloudwatch')

def publish_metrics(event):
    finding = event['detail']['findings'][0]
    
    cloudwatch.put_metric_data(
        Namespace='SecurityHub',
        MetricData=[
            {
                'MetricName': 'NewFindings',
                'Value': 1,
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'Severity', 'Value': finding['Severity']['Label']},
                    {'Name': 'ProductName', 'Value': finding['ProductName']},
                    {'Name': 'ComplianceStatus', 'Value': finding.get('Compliance', {}).get('Status', 'N/A')}
                ]
            }
        ]
    )
```

## Cost Optimization

### Pricing Model

**Security Checks**:
- First 100,000 checks/month: Free (30-day trial)
- Additional checks: $0.0010 per check

**Finding Ingestion Events**:
- First 10,000 events/month: Free (30-day trial)
- 10,001 - 500,000: $0.00003 per event
- 500,001+: $0.00001 per event

**Example Monthly Cost**:
```
Account with:
  - 3 security standards enabled
  - 500 resources
  - Checks every 12 hours
  
Security Checks: 500 × 3 × 2 × 30 = 90,000/month (Free)

Findings from GuardDuty: 5,000/month
Finding Ingestion: Free (under 10,000)

Total: $0/month (within free tier)
```

**Cost Scaling**:
```
Large Organization:
  - 1,000 accounts
  - 1,000,000 resources
  - 4 standards enabled
  
Monthly checks: ~240M
Cost: (240M - 100K) × $0.001 = ~$240,000/month

Optimization: Disable standards in non-critical accounts
Reduced checks: 100M
Cost: ~$100,000/month
```

### Cost Reduction Strategies

**1. Selective Standard Enablement**:
- Enable all standards in production
- FSBP only in development
- Minimal checks in sandbox

**2. Archive Old Findings**:
- Auto-archive after remediation
- Reduce active finding count
- Lower dashboard complexity

**3. Optimize Check Frequency**:
- Security Hub checks periodically
- Can't modify frequency
- Consider custom Config rules instead

**4. Filter Irrelevant Findings**:
- Suppress findings via automation
- Update workflow status
- Reduce noise

## Best Practices for SAP-C02

### Design Principles

1. **Enable in All Accounts**
   - Consistent security posture
   - No coverage gaps
   - Auto-enable for new accounts

2. **Use Delegated Administrator**
   - Security account manages Security Hub
   - Centralized findings
   - Reduced management account usage

3. **Enable Finding Aggregation**
   - Cross-region visibility
   - Single dashboard
   - Simplified operations

4. **Automate Remediation**
   - EventBridge rules
   - Lambda for simple fixes
   - Systems Manager for complex remediation

5. **Integrate with SIEM**
   - Export findings to Splunk, Sumo Logic
   - Long-term retention
   - Correlation with other data

6. **Regular Review and Tuning**
   - Suppress false positives
   - Update remediation playbooks
   - Track compliance trends

### Common Exam Scenarios

**Scenario 1**: Centralized Security Posture Management
- **Solution**: Enable Security Hub in all accounts via Organizations, designate delegated administrator, enable FSBP standard

**Scenario 2**: Automated Remediation of Security Violations
- **Solution**: EventBridge rule triggers Lambda for high-severity findings, update workflow status after remediation

**Scenario 3**: PCI-DSS Compliance Validation
- **Solution**: Enable PCI-DSS standard in Security Hub, generate compliance reports, automated remediation for critical controls

**Scenario 4**: Aggregate Findings from Multiple Services
- **Solution**: Enable integrations for GuardDuty, Inspector, Macie, view aggregated findings in Security Hub dashboard

**Scenario 5**: Cross-Region Security Visibility
- **Solution**: Enable finding aggregation in primary region, view findings from all regions in single dashboard

**Scenario 6**: Third-Party SIEM Integration
- **Solution**: EventBridge to Kinesis Firehose to S3, Splunk reads from S3, or direct API integration

## Security Hub vs Other Services

| Feature | Security Hub | GuardDuty | Config | Trusted Advisor |
|---------|--------------|-----------|--------|-----------------|
| **Focus** | Security posture | Threat detection | Configuration | Best practices |
| **Checks** | Standards-based | ML anomalies | Config rules | Well-Architected |
| **Findings** | Aggregated | Threats only | Config changes | Recommendations |
| **Remediation** | Manual/Automated | Manual/Automated | Auto remediation | Manual |
| **Standards** | Multiple | None | Custom rules | AWS pillars |
| **Cost** | Per check/finding | Per GB analyzed | Per rule/item | Free (Basic) |

## Quick Reference

### Common CLI Commands

```bash
# Enable Security Hub
aws securityhub enable-security-hub

# Enable standard
aws securityhub batch-enable-standards \
  --standards-subscription-requests StandardsArn=arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark/v/1.2.0

# Get findings
aws securityhub get-findings \
  --filters '{"SeverityLabel":[{"Value":"HIGH","Comparison":"EQUALS"}]}'

# Update finding workflow
aws securityhub batch-update-findings \
  --finding-identifiers Id=finding-id,ProductArn=product-arn \
  --workflow Status=RESOLVED

# Create insight
aws securityhub create-insight \
  --name "Critical Production Findings" \
  --filters file://filters.json \
  --group-by-attribute ResourceType

# Enable product integration
aws securityhub enable-import-findings-for-product \
  --product-arn arn:aws:securityhub:us-east-1::product/aws/guardduty
```

### Important Limits

- Security standards: No limit
- Custom insights: 100 per account
- Finding retention: 90 days
- Maximum findings per batch import: 100
- Maximum filter criteria: 20
- Aggregation regions: 1 per account

### Exam Tips

1. **Security Hub aggregates findings**: From GuardDuty, Inspector, Macie, etc.
2. **Security standards**: FSBP, CIS, PCI-DSS, NIST available
3. **ASFF**: Standard format for all findings
4. **Multi-account**: Delegated administrator via Organizations
5. **Automated remediation**: EventBridge + Lambda/Systems Manager
6. **Finding aggregation**: Cross-region in single dashboard
7. **Compliance reporting**: Track security posture vs standards
8. **Integration**: SIEM, ticketing, third-party security tools
9. **Cost**: Per check and per finding ingested
10. **Workflow status**: New, Notified, Resolved, Suppressed

## Summary

AWS Security Hub is the centralized security and compliance service for:
- Aggregating findings from multiple AWS security services
- Continuous compliance checking against security standards
- Automated security remediation workflows
- Multi-account security posture management
- Integration with SIEM and third-party tools

Key strengths: Centralized dashboard, automated compliance checks, standardized finding format (ASFF), multi-account support, automated remediation, extensive integrations, cross-region aggregation.
