# AWS Certificate Manager (ACM)

## Overview
AWS Certificate Manager is a service that lets you provision, manage, and deploy SSL/TLS certificates for use with AWS services and internal connected resources.

## Key Features

### Certificate Provisioning
- **Public Certificates**: Free SSL/TLS certificates
- **Private Certificates**: Private CA for internal use
- **Domain Validation**: Automated domain validation
- **Wildcard Certificates**: Protect multiple subdomains

### Automated Management
- **Auto Renewal**: Automatic certificate renewal
- **No Manual Process**: No CSR generation needed
- **Deployment**: Auto-deploy to integrated services
- **Expiry Monitoring**: Automatic expiry tracking

### Integration
- **Elastic Load Balancer**: ALB, NLB, CLB
- **CloudFront**: CDN distributions
- **API Gateway**: REST and HTTP APIs
- **Elastic Beanstalk**: Application environments
- **CloudFormation**: Infrastructure as code

### Private CA
- **Private Certificate Authority**: Internal PKI
- **Organizational Hierarchy**: Multi-level CA hierarchy
- **Certificate Templates**: Standardized certificates
- **Audit & Compliance**: Certificate usage tracking

## Common Use Cases

### Website Security
- **HTTPS**: Secure websites with HTTPS
- **Wildcard**: Secure multiple subdomains
- **Multi-Domain**: Single cert for multiple domains
- **Custom Domains**: Secure custom domain names

### Application Security
- **API Security**: Secure API endpoints
- **Microservices**: Service-to-service encryption
- **Load Balancer**: TLS termination at LB
- **Internal Applications**: Private certificates

### Compliance
- **Data in Transit**: Encrypt data in transit
- **Regulatory**: Meet compliance requirements
- **Audit Trail**: Track certificate usage
- **Private PKI**: Internal certificate authority

## Best Practices

### Certificate Management
- **Wildcard Certs**: Use for multiple subdomains
- **Auto Renewal**: Enable automatic renewal
- **Separate Certs**: Separate prod/dev/test
- **Monitoring**: Monitor expiry dates

### Security
- **Strong Algorithms**: Use modern encryption
- **Private Keys**: ACM manages private keys securely
- **Least Privilege**: Minimal IAM permissions
- **Rotation**: Certificates auto-rotate before expiry

### Architecture
- **Regional Service**: Deploy in each region as needed
- **CloudFront Certs**: Must be in us-east-1
- **Multi-Region**: Request certs in each region
- **Backup Validation**: Multiple validation methods

## SAP-C02 Exam Focus Areas

### Core Concepts
- **Free Certificates**: Public certificates are free
- **Auto Renewal**: Automatic renewal for integrated services
- **Regional**: Certificates are regional (except CloudFront)
- **Validation Methods**: DNS vs Email validation

### Integration Points
- **CloudFront**: Certificate must be in us-east-1 region
- **ALB/NLB**: Regional certificates
- **API Gateway**: Regional and edge-optimized
- **Cannot Export**: Public cert private keys cannot be exported

### Key Exam Tips
- ✅ Use ACM for free, managed SSL/TLS certificates
- ✅ CloudFront requires certificates in us-east-1
- ✅ Automatic renewal for certificates in use
- ✅ DNS validation recommended over email
- ✅ Cannot export private keys from public certificates
- ✅ Private CA for internal PKI infrastructure
- ❌ Cannot use ACM certificates on EC2 directly
- ❌ Cannot export/import public certificate private keys

## Certificate Types

### Public Certificates
- **Free**: No charge for public certificates
- **DV Certificates**: Domain validation only
- **Auto Renewal**: Renewed automatically
- **Managed Keys**: AWS manages private keys
- **Cannot Export**: Private keys not exportable

### Private Certificates
- **Private CA**: Requires AWS Private CA
- **Internal Use**: For internal applications
- **Custom Validity**: Define validity period
- **Exportable**: Private keys can be exported
- **Charged**: Per certificate and CA charges

## Validation Methods

### DNS Validation
- **Automated**: Add CNAME record to DNS
- **Recommended**: Best practice
- **Wildcard Support**: Works with wildcards
- **Auto Renewal**: Supports auto-renewal
- **Route 53**: Can auto-create records

### Email Validation
- **Email Approval**: Send email to domain contacts
- **Manual Process**: Requires human interaction
- **Not Recommended**: For production
- **Renewal**: Requires revalidation

## Regional Considerations

### CloudFront Certificates
- **us-east-1 Only**: Must be in us-east-1
- **Global Distribution**: Used globally
- **Import Option**: Can import external certs
- **SNI Support**: Server Name Indication

### Regional Services
- **ALB/NLB**: Certificate in same region
- **API Gateway**: Regional endpoints
- **Separate Requests**: Request in each region
- **Cross-Region**: Cannot use across regions

## Monitoring & Alerts

### CloudWatch Events
- **Expiry Alerts**: Certificates nearing expiry
- **Renewal Status**: Track renewal attempts
- **EventBridge**: Automated responses
- **SNS Notifications**: Email/SMS alerts

### Certificate Status
- **Issued**: Certificate is active
- **Pending Validation**: Awaiting validation
- **Expired**: Certificate has expired
- **Revoked**: Certificate was revoked
- **Failed**: Issuance failed

## Pricing Model
- **Public Certificates**: Free
- **Private CA**: Monthly fee per CA
- **Private Certificates**: Per certificate fee
- **No Export Charges**: No charge for operations
- **Integration**: No charge for ACM with AWS services

## ACM vs Imported Certificates

| Feature | ACM Certificates | Imported Certificates |
|---------|------------------|----------------------|
| **Cost** | Free (public) | Free to import |
| **Renewal** | Automatic | Manual |
| **Management** | Fully managed | Self-managed |
| **Private Keys** | AWS-managed | You manage |
| **Validation** | AWS handles | Pre-validated |
| **Monitoring** | Built-in | Manual setup |

## Common Exam Scenarios
1. **HTTPS for ALB**: Terminate SSL at Application Load Balancer
2. **CloudFront**: Secure CloudFront distribution (us-east-1)
3. **Wildcard Certificate**: Secure *.example.com
4. **API Gateway**: Secure custom domain for API
5. **Multi-Region**: Deploy same cert in multiple regions
6. **Private CA**: Internal microservices communication
7. **Auto Renewal**: Ensure certificates don't expire

## Integration Example

### ALB with ACM
```
Client (HTTPS) → ALB (ACM Certificate) → EC2 (HTTP)
                      ↓
              TLS Termination at ALB
```

### CloudFront with ACM
```
Client (HTTPS) → CloudFront (ACM in us-east-1) → Origin
                      ↓
              Global CDN with TLS
```

---
*Last Updated: January 2026*
