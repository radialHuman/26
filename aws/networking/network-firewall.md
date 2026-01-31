# AWS Network Firewall

## Overview
AWS Network Firewall is a managed network firewall and intrusion detection and prevention service for Amazon VPC that provides fine-grained control over network traffic.

## Key Features

### Stateful & Stateless Inspection
- **Stateful Rules**: Track connection state
- **Stateless Rules**: Fast packet filtering
- **Deep Packet Inspection**: Inspect packet contents
- **Protocol Detection**: Identify application protocols

### Rule Management
- **Managed Rule Groups**: AWS-managed threat signatures
- **Custom Rules**: Define your own rules
- **Domain Filtering**: Allow/block by domain name
- **IP Filtering**: Control by IP address/CIDR
- **Port/Protocol Rules**: Filter by port and protocol

### Threat Protection
- **IDS/IPS**: Intrusion detection and prevention
- **Signature Matching**: Known threat signatures
- **Anomaly Detection**: Detect suspicious patterns
- **Malware Protection**: Block malicious traffic

### High Availability
- **Multi-AZ**: Automatically deployed across AZs
- **Auto Scaling**: Scales with traffic
- **High Performance**: Gbps throughput
- **No Single Point of Failure**: Resilient architecture

## Common Use Cases

### Perimeter Security
- **VPC Protection**: Protect entire VPC
- **Internet Gateway Filtering**: Filter inbound/outbound traffic
- **Egress Filtering**: Control outbound connections
- **Inspection VPC**: Centralized inspection architecture

### Compliance & Governance
- **Regulatory Requirements**: Meet compliance standards
- **Traffic Logging**: Detailed traffic logs
- **Audit Trail**: Track security events
- **Policy Enforcement**: Enforce security policies

### Threat Prevention
- **Malware Blocking**: Block known malware
- **Exploit Prevention**: Stop exploitation attempts
- **Command & Control**: Block C2 communications
- **Data Exfiltration**: Prevent unauthorized data transfer

## Best Practices

### Architecture Design
- **Centralized Inspection**: Use inspection VPC pattern
- **Multi-AZ Deployment**: Ensure high availability
- **Subnet Strategy**: Firewall subnets in each AZ
- **Traffic Flows**: Plan network traffic patterns

### Rule Configuration
- **Layered Approach**: Stateless first, then stateful
- **Least Privilege**: Block by default, allow specific
- **Rule Ordering**: Optimize rule order for performance
- **Regular Updates**: Keep managed rules updated

### Monitoring & Logging
- **Flow Logs**: Enable firewall flow logs
- **Alert Logs**: Monitor security events
- **CloudWatch**: Integrate with CloudWatch
- **SIEM Integration**: Send logs to SIEM

## SAP-C02 Exam Focus Areas

### Core Concepts
- **Managed Firewall**: AWS-managed network firewall
- **Stateful/Stateless**: Both inspection types
- **IDS/IPS**: Built-in threat detection/prevention
- **VPC-Level Protection**: Network-layer security

### Architecture Patterns
- **Inspection VPC**: Centralized traffic inspection
- **Distributed Model**: Firewall in each VPC
- **Transit Gateway Integration**: Hub-and-spoke security
- **Gateway Load Balancer**: Scale third-party appliances

### Key Exam Tips
- ✅ Use for VPC-level network protection
- ✅ Supports both stateful and stateless inspection
- ✅ Integrates with AWS Firewall Manager for multi-account
- ✅ Inspection VPC pattern for centralized security
- ✅ Domain-based filtering for controlling outbound access
- ❌ Not a replacement for security groups/NACLs (use together)
- ❌ Different from WAF (application layer vs network layer)

## Architecture Patterns

### Centralized Inspection VPC
```
Workload VPCs → Transit Gateway → Inspection VPC
                                    ↓
                              Network Firewall
                                    ↓
                              Internet Gateway
```

### Distributed Firewall
```
VPC → Firewall Subnet → Network Firewall → Internet Gateway
   ↓
Application Subnets
```

### Hybrid Architecture
```
On-Premises → Direct Connect → AWS
                                ↓
                         Network Firewall
                                ↓
                          VPC Resources
```

## Rule Groups

### Stateless Rule Groups
- **Fast Processing**: Quick packet filtering
- **5-Tuple Matching**: Source/dest IP, port, protocol
- **Custom Actions**: Pass, drop, forward to stateful
- **Priority-Based**: Numeric priority ordering

### Stateful Rule Groups
- **Connection Tracking**: Maintain state information
- **Deep Inspection**: Inspect packet payloads
- **Suricata Compatible**: Use Suricata rule format
- **Domain Lists**: Filter by domain name

### Managed Rule Groups
- **AWS Threat Signatures**: AWS-maintained rules
- **Regular Updates**: Automatic rule updates
- **Threat Intelligence**: Based on AWS threat intel
- **Best Practices**: Pre-configured protection

## Integration

### AWS Services
- **VPC**: Deploy in VPC subnets
- **Transit Gateway**: Centralized inspection
- **Firewall Manager**: Multi-account management
- **CloudWatch**: Metrics and logging
- **S3**: Store logs in S3
- **Route 53 Resolver**: DNS filtering integration

### Traffic Logging
- **Flow Logs**: Network traffic flows
- **Alert Logs**: Security events and threats
- **S3 Delivery**: Store logs in S3
- **CloudWatch Logs**: Real-time log analysis

## Monitoring & Alerts

### CloudWatch Metrics
- **Packets Dropped**: Blocked traffic count
- **Packets Processed**: Total traffic processed
- **Custom Rules**: Rule-specific metrics
- **Health Metrics**: Firewall health status

### Alerting
- **EventBridge**: Security event notifications
- **SNS**: Alert notifications
- **Lambda**: Automated responses
- **Security Hub**: Centralized findings

## Pricing Model
- **Firewall Endpoint**: Per endpoint-hour per AZ
- **Data Processing**: Per GB processed
- **Rule Groups**: No charge for AWS managed rules
- **Cross-AZ Traffic**: Standard data transfer charges

## Network Firewall vs Other Services

| Feature | Network Firewall | WAF | Security Groups |
|---------|------------------|-----|-----------------|
| **Layer** | Network (L3-L7) | Application (L7) | Network (L4) |
| **Scope** | VPC-wide | ALB/CloudFront | Instance-level |
| **Inspection** | Deep packet | HTTP/HTTPS | IP/Port only |
| **IDS/IPS** | Yes | Limited | No |
| **Stateful** | Yes | Yes | Yes |
| **Cost** | Higher | Medium | Free |

## Common Exam Scenarios
1. **Centralized Inspection**: Inspect all VPC traffic through single point
2. **Egress Filtering**: Control and log outbound traffic
3. **IDS/IPS**: Detect and prevent network intrusions
4. **Compliance**: Meet regulatory requirements for network security
5. **Domain Filtering**: Block access to specific domains
6. **Multi-VPC Security**: Use with Transit Gateway for hub-and-spoke

---
*Last Updated: January 2026*
