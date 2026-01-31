# AWS Resource Access Manager (RAM)

## Overview
AWS Resource Access Manager (RAM) enables you to securely share your AWS resources with other AWS accounts, within your organization or organizational units (OUs), or with IAM users and roles.

## Key Features

### Resource Sharing
- **Cross-Account Sharing**: Share resources between accounts
- **Organization Integration**: Share within AWS Organizations
- **Granular Control**: Share with specific accounts or OUs
- **No Resource Duplication**: Single resource, multiple accounts

### Supported Resources
- **VPC Subnets**: Share VPC subnets
- **Transit Gateway**: Share transit gateways
- **Route 53 Resolver**: Share resolver rules and endpoints
- **License Manager**: Share license configurations
- **Aurora DB Clusters**: Share Aurora clusters
- **CodeBuild**: Share projects and report groups
- **And More**: EC2 Image Builder, Network Firewall, etc.

### Access Control
- **Resource Shares**: Define what to share
- **Principals**: Specify who can access
- **Permissions**: Control level of access
- **Organization Policies**: SCPs still apply

## Common Use Cases

### VPC Subnet Sharing
- **Centralized Networking**: Share VPC with multiple accounts
- **Cost Optimization**: Single VPC, multiple teams
- **Simplified Management**: Central network management
- **Isolated Workloads**: Separate accounts, shared network

### Transit Gateway Sharing
- **Hub-and-Spoke**: Central connectivity hub
- **Multi-Account Connectivity**: Connect multiple account VPCs
- **Hybrid Connectivity**: Share on-premises connections
- **Cost Reduction**: Single gateway, multiple accounts

### Cross-Account Collaboration
- **Shared Services**: Common services across accounts
- **Multi-Account Strategy**: Share infrastructure resources
- **Partner Collaboration**: Share with external accounts
- **Organizational Resources**: Share across OUs

## Best Practices

### Sharing Strategy
- **Least Privilege**: Share only what's necessary
- **Organization-Based**: Use AWS Organizations for control
- **Resource Naming**: Clear naming for shared resources
- **Documentation**: Document sharing relationships

### Security
- **SCPs**: Use SCPs to control sharing
- **IAM Policies**: Control who can share resources
- **Monitoring**: Track shared resource usage
- **Regular Audits**: Review sharing configuration

### Cost Management
- **Resource Owner Pays**: Owner pays for shared resources
- **Usage Tracking**: Monitor resource consumption
- **Tagging**: Tag shared resources appropriately
- **Chargeback**: Implement chargeback models

## SAP-C02 Exam Focus Areas

### Core Concepts
- **Shared Resources**: Share without duplication
- **Cross-Account Access**: Secure account-to-account sharing
- **Organization Integration**: Works with AWS Organizations
- **No Data Transfer**: Resources stay in owner account

### VPC Subnet Sharing
- **Centralized VPC**: Multiple accounts use same VPC
- **Resource Isolation**: Each account sees only their resources
- **Security Groups**: Can reference across accounts
- **No VPC Peering**: No need for peering connections

### Key Exam Tips
- ✅ Use RAM for sharing VPC subnets across accounts
- ✅ Transit Gateway sharing enables centralized connectivity
- ✅ Resource owner pays for shared resources
- ✅ More cost-effective than duplicating resources
- ✅ Participants cannot modify shared resources (read-only)
- ✅ Works seamlessly with AWS Organizations
- ❌ Cannot share all AWS resource types
- ❌ Shared resources remain in owner's account

## Architecture Patterns

### Shared VPC Pattern
```
Account A (VPC Owner)
    ↓
Shared Subnets via RAM
    ↓
Account B, C, D (Participants)
    ↓
Deploy resources in shared subnets
```

### Centralized Transit Gateway
```
Network Account (TGW Owner)
    ↓
Share TGW via RAM
    ↓
Workload Accounts attach VPCs
    ↓
Centralized routing and connectivity
```

### Shared Services Pattern
```
Shared Services Account
    ↓
Share resources (VPC, TGW, DNS)
    ↓
Application Accounts consume services
```

## VPC Subnet Sharing Benefits

### Cost Optimization
- **Single VPC**: No duplicate VPC costs
- **Shared NAT**: Share NAT gateways
- **Shared Endpoints**: Share VPC endpoints
- **IP Management**: Efficient IP allocation

### Simplified Management
- **Central Control**: Manage network centrally
- **Consistent Policies**: Uniform security policies
- **Reduced Complexity**: Fewer VPC peering connections
- **Easy Scaling**: Add accounts easily

### Security
- **Isolation**: Accounts cannot see each other's resources
- **Security Groups**: Reference SGs across accounts
- **Network Policies**: Apply network policies centrally
- **Compliance**: Easier compliance management

## Resource Sharing Process

### 1. Create Resource Share
```
1. Select resources to share
2. Specify principals (accounts/OUs)
3. Set permissions
4. Create resource share
```

### 2. Accept Invitation (External)
```
1. Invited account receives invitation
2. Review resource share details
3. Accept invitation
4. Access shared resources
```

### 3. Use Shared Resources
```
1. Access resources via AWS console/API
2. Create resources in shared subnets
3. Reference shared resources
4. Monitor usage
```

## Supported Resources (Key Examples)

### Networking
- VPC subnets
- Transit gateways
- Route 53 Resolver rules and endpoints
- Network Firewall policies

### Compute & Storage
- EC2 Dedicated Hosts
- EC2 Image Builder components
- EC2 Capacity Reservations

### Database
- Aurora DB clusters (cross-account clone)

### Other Services
- License Manager configurations
- CodeBuild projects
- Resource Groups
- AWS Glue databases and tables

## Monitoring & Governance

### CloudTrail Integration
- **Sharing Events**: Track share creation/deletion
- **Access Events**: Monitor resource access
- **Audit Trail**: Complete sharing history

### AWS Config
- **Compliance**: Track sharing compliance
- **Changes**: Monitor configuration changes
- **Rules**: Enforce sharing policies

### Cost & Usage Reports
- **Resource Owner**: Track costs as owner
- **Usage Attribution**: Identify usage by account

## Pricing Model
- **No Additional Charge**: RAM itself is free
- **Resource Costs**: Owner pays for shared resources
- **Standard Pricing**: Normal resource pricing applies
- **Data Transfer**: May incur cross-AZ costs

## Common Exam Scenarios
1. **Multi-Account VPC**: Share VPC subnets across multiple accounts
2. **Centralized Networking**: Share Transit Gateway for hub-and-spoke
3. **Cost Optimization**: Avoid resource duplication across accounts
4. **Shared Services**: Provide common services to multiple accounts
5. **DNS Resolution**: Share Route 53 Resolver rules
6. **License Management**: Share license configurations

## RAM vs VPC Peering

| Feature | RAM (Shared VPC) | VPC Peering |
|---------|------------------|-------------|
| **Complexity** | Lower | Higher |
| **Cost** | Single VPC cost | Multiple VPC costs |
| **Management** | Centralized | Distributed |
| **IP Overlap** | Not possible | Must avoid |
| **Security Groups** | Can reference | Cannot reference |
| **Scalability** | High | Limited (125 peers) |
| **Use Case** | Same organization | Any accounts |

---
*Last Updated: January 2026*
