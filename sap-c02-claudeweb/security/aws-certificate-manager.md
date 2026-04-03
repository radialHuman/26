# AWS Certificate Manager (ACM)

## Overview
AWS Certificate Manager is a service that lets you easily provision, manage, and deploy public and private SSL/TLS certificates for use with AWS services and your internal connected resources.

## Key Features
- **Free Public Certificates**: No charge for public SSL/TLS certificates
- **Automatic Renewal**: Managed renewal for ACM certificates
- **Integration**: Works with ELB, CloudFront, API Gateway, Elastic Beanstalk
- **Private CA**: Create private certificate authority
- **Certificate Validation**: DNS or email validation

## Certificate Types
### Public Certificates
- Issued by Amazon trust services
- Free of charge
- Automatic renewal
- Domain validation required
- Support wildcard domains

### Private Certificates
- Issued by AWS Private CA
- Charged per certificate and CA
- For internal applications
- Custom validity periods
- Full control over CA hierarchy

## Validation Methods
### DNS Validation
- Add CNAME record to DNS
- Automatic renewal works
- Preferred for automation
- No email required
- Works with Route 53

### Email Validation
- Email sent to domain contacts
- Manual approval required
- 72-hour validation window
- Renewal requires action
- Legacy method

## Integration Points
### Load Balancers
- ALB/NLB SSL termination
- Multiple certificates per ALB
- SNI support
- Certificate rotation

### CloudFront
- Custom SSL certificates
- SNI or dedicated IP
- Global distribution
- Automatic deployment

### API Gateway
- Custom domain names
- Regional or edge-optimized
- Certificate validation
- Domain mapping

## Best Practices
- Use DNS validation for automation
- Enable automatic renewal
- Use wildcard certificates when appropriate
- Implement certificate monitoring
- Use separate certificates per environment
- Leverage AWS Private CA for internal certs
- Configure SNI for multiple domains
- Monitor certificate expiration

## Certificate Lifecycle
1. **Request**: Create certificate request
2. **Validate**: Complete domain validation
3. **Issue**: Certificate issued by ACM
4. **Deploy**: Attach to AWS resources
5. **Renew**: Automatic renewal (if DNS validated)
6. **Revoke**: Delete when no longer needed

## Private CA Features
- Create CA hierarchy
- Issue private certificates
- Define custom validity
- Certificate revocation lists
- OCSP support
- Audit logging
- Cross-account sharing

## Monitoring
- CloudWatch metrics
- Certificate expiration alarms
- Validation status
- Renewal failures
- CloudTrail logging

## Security Considerations
- Certificates encrypted at rest
- Private keys never exported
- Certificate transparency logging
- Domain validation required
- IAM access control
- Certificate pinning considerations

## Cost Optimization
- Public certificates are free
- Private CA monthly charge
- Private certificate fees
- Delete unused certificates
- Consolidate with wildcards
- Use public certs when possible

## Common Use Cases
- HTTPS for websites
- API endpoint security
- Internal application security
- Microservices authentication
- IoT device certificates
- Email encryption

## Limitations
- Public certs only for AWS resources
- Cannot export private keys
- Limited to AWS services
- DNS validation requires access
- Email validation manual process
- Regional service (some integrations)

## SAP-C02 Exam Tips
- ACM certificates are regional (except CloudFront - us-east-1)
- Automatic renewal only with DNS validation
- Free for public certificates
- Cannot export certificate private keys
- Supports wildcard and multi-domain certs
- Integration with AWS services
- Private CA for internal PKI infrastructure
