# CloudFront - Complete Deep Dive

## 1. What Problem Did It Solve

**Before:** Content served from single location, slow for distant users, high origin load, expensive bandwidth  
**After:** Global edge caching, low latency worldwide, reduced origin load, lower costs

## 2. What Was Before

**2000s:** Akamai (expensive $10K+/month), Limelight, manual CDN setup  
**2008:** CloudFront launches, pay-as-you-go CDN  
**Evolution:** HTTP → HTTPS → HTTP/2 → HTTP/3, Lambda@Edge (2017), CloudFront Functions (2021)

## 3. When to Use

✅ Static content (images, videos, CSS, JS)  
✅ Dynamic content with caching  
✅ Video streaming (live/on-demand)  
✅ API acceleration  
✅ Global users  
✅ DDoS protection  
❌ Don't use: Internal-only content, highly dynamic uncacheable, real-time bidirectional (use WebSocket on ALB)

## 4. vs Similar Services

**CloudFront vs S3 Transfer Acceleration:** CloudFront=caching+distribution, S3 TA=upload optimization  
**CloudFront vs Global Accelerator:** CF=HTTP/caching, GA=TCP/UDP/static IP/no caching  
**CloudFront vs ALB:** CF=global edge caching, ALB=regional load balancing

## 5. How It Works

400+ edge locations worldwide. Request→nearest edge→cache hit (return instantly) or cache miss (fetch from origin, cache, return). TTL controls cache duration. Origin can be S3, ALB, custom HTTP server. Lambda@Edge runs code at edge.

## 6. Cost

Data transfer OUT: $0.085/GB (first 10 TB), HTTP requests: $0.0075 per 10K, HTTPS requests: $0.010 per 10K, Invalidations: 1,000 free/month then $0.005 each  
**Example:** 1 TB transfer + 10M requests = $85 + $7.50 = $92.50/month (vs $90 direct from S3 but much faster globally)

## 7. Pros and Cons

**Pros:** Global low latency, reduced origin load, DDoS protection (Shield Standard free), SSL/TLS support (free certificates), edge computing (Lambda@Edge), HTTP/2 and HTTP/3  
**Cons:** Caching complexity, invalidation costs ($0.005 per path after 1K free), eventual consistency (cache updates take time), not suitable for highly dynamic content

## 8. SAP-C02 Questions

**Q:** Reduce S3 costs for global users → CloudFront  
**Q:** Private S3 bucket with CloudFront → OAC (Origin Access Control)  
**Q:** Cache API responses → Cache-Control headers + CloudFront  
**Q:** DDoS protection → CloudFront + Shield + WAF  
**Q:** Geo-restrict content → CloudFront geo-restriction feature

## 9. Configurations

**Distribution:** Origin (S3 bucket or custom), Behaviors (path patterns → cache settings), TTL (min=0, default=86400, max=31536000), Cache key (URL+query+headers+cookies), SSL certificate (ACM - free), Price class (all edges or subset for cost), WAF (optional), Geo-restriction (whitelist/blacklist countries), Custom error pages

**OAC (Origin Access Control):**
```
CloudFront identity → S3 bucket policy allows ONLY CloudFront
S3 bucket stays private, users access via CloudFront only
Replaces legacy OAI
```

**Signed URLs/Cookies:**
```
Restrict access, time-limited URLs
Use: Premium content, DRM, private files
Signed URL: Single file, Signed Cookie: Multiple files
```

## 10. Additional

**Lambda@Edge:** Run code at edge (modify requests/responses, auth, A/B testing, image optimization), Max 128 MB memory, 5-30 sec timeout depending on event type  
**CloudFront Functions:** Lighter than Lambda@Edge, <1ms execution, JavaScript only, use for simple transformations  
**Invalidations:** Clear cache manually, costs after 1,000/month, use versioned filenames instead (file-v2.jpg)  
**Field-level encryption:** Encrypt specific form fields at edge before origin, use for sensitive data (credit cards)  
**Real-time logs:** Stream to Kinesis, analyze cache performance

---

# 11. IAM - Complete Deep Dive

## 1. Problem Solved
**Before:** Shared root credentials, no granular permissions, can't track who did what  
**After:** Individual users, fine-grained permissions, audit trail, temporary credentials

## 2. History
**2006-2011:** Only root account, shared credentials  
**2011:** IAM launches, users/groups/roles  
**Evolution:** MFA (2012), Roles for EC2 (2012), Identity Federation (2013), Permission Boundaries (2018), IAM Access Analyzer (2019)

## 3. When to Use
✅ Always - every AWS interaction uses IAM  
✅ User management (employees)  
✅ Service-to-service access (EC2→S3, Lambda→DynamoDB)  
✅ Cross-account access  
✅ Temporary credentials  
✅ Federation (SAML, OIDC)

## 4. vs Similar

**IAM Users vs Roles:** Users=long-term credentials (people), Roles=temporary credentials (services/cross-account)  
**IAM vs Cognito:** IAM=AWS access, Cognito=application user auth (mobile/web users)  
**IAM Policies vs S3 Bucket Policies:** IAM=who can do what, Bucket=what can be done to bucket (can combine)  
**IAM vs Organizations SCPs:** IAM=grant permissions, SCPs=maximum boundary (can't exceed)

## 5. How It Works

**Identity-based policies** (attached to users/groups/roles): Define what identity can do  
**Resource-based policies** (attached to resources like S3 buckets): Define who can access resource  
**Permissions boundary:** Maximum permissions (can't exceed even if policy allows)  
**Service control policies:** Organization-level restrictions  
**Evaluation:** Explicit DENY wins, then explicit ALLOW, default DENY

## 6. Cost
**FREE** - No charges for IAM

## 7. Pros and Cons

**Pros:** Fine-grained control, MFA support, temporary credentials, federation, audit with CloudTrail, free, integrated with all AWS services  
**Cons:** Complex policy language (JSON), easy to misconfigure, permission conflicts hard to debug, no GUI for complex policies

## 8. SAP-C02 Questions

**Q:** EC2 needs S3 access → IAM Role (not access keys!)  
**Q:** Cross-account access → AssumeRole with trust policy  
**Q:** Least privilege → Specific actions/resources only  
**Q:** Permission boundary → Limit maximum permissions delegated admin can grant  
**Q:** Temporary credentials → STS AssumeRole (15 min to 12 hours)

## 9. Configurations

**IAM Policy Structure:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::mybucket/*",
    "Condition": {
      "IpAddress": {"aws:SourceIp": "203.0.113.0/24"}
    }
  }]
}
```

**IAM Role for EC2:**
```
Trust policy: EC2 service can assume this role
Permission policy: What role can do (S3 read)
Attach to EC2: Instance gets temporary credentials automatically
```

**Cross-account access:**
```
Account A: Create role, trust policy allows Account B
Account B: User assumes role, gets temporary credentials for Account A resources
```

## 10. Additional

**Policy types:** Identity-based (user/role), Resource-based (S3/SQS), Permission boundaries, SCPs, Session policies  
**Best practices:** MFA for root, least privilege, rotate access keys every 90 days, use roles not users for services, enable CloudTrail, use policy simulator for testing  
**Common mistakes:** Granting * permissions, using root account, hardcoding access keys, no MFA, overly permissive policies

---

# 12. CloudWatch - Complete Deep Dive

## 1. Problem Solved
**Before:** Manual log checking, no centralized monitoring, custom scripts for metrics  
**After:** Unified monitoring, automatic alarms, log aggregation, custom dashboards

## 2. History
**2009:** CloudWatch launches (basic metrics)  
**2010:** Custom metrics  
**2014:** CloudWatch Logs  
**2015:** CloudWatch Events (now EventBridge)  
**2019:** Container Insights, Lambda Insights  
**2020:** Anomaly detection, Contributor Insights

## 3. When to Use
✅ Monitor AWS resources (EC2, RDS, Lambda)  
✅ Application metrics (custom)  
✅ Log aggregation  
✅ Set alarms (CPU>80% → SNS)  
✅ Dashboards  
✅ Troubleshooting

## 4. vs Similar
**CloudWatch vs CloudTrail:** CloudWatch=performance metrics/logs, CloudTrail=API audit logs  
**CloudWatch vs X-Ray:** CloudWatch=metrics/logs, X-Ray=distributed tracing  
**CloudWatch Logs vs S3:** Logs=queryable/searchable, S3=cheaper long-term storage

## 5. How It Works

**Metrics:** Data points over time (CPU 50% at timestamp), aggregated by statistic (avg, sum, min, max), namespaces organize metrics  
**Alarms:** Threshold-based (CPU>80%), composite (multiple conditions), actions (SNS, Auto Scaling, EC2 action)  
**Logs:** Log groups (application), log streams (instance), retention (1 day to forever), Insights queries (SQL-like)

## 6. Cost

Metrics: Standard free (5-min), detailed $2.10/instance/month (1-min), custom $0.30/metric/month  
Logs: $0.50/GB ingested, $0.03/GB stored  
Alarms: $0.10/alarm/month standard, $0.30 high-resolution  
Dashboards: First 3 free, $3/month each additional

## 7. Pros and Cons
**Pros:** Integrated with all AWS, real-time monitoring, retention up to 15 months (metrics), powerful query language (Logs Insights), anomaly detection  
**Cons:** Costs add up at scale (logs expensive), 15-month metric retention (not long-term), query syntax learning curve

## 8. SAP-C02 Questions
**Q:** Trigger Auto Scaling → CloudWatch alarm  
**Q:** Centralize logs from multiple accounts → Cross-account log aggregation  
**Q:** Detect unusual patterns → CloudWatch anomaly detection  
**Q:** Query logs → Logs Insights  
**Q:** Monitor Lambda → Lambda Insights (built on CloudWatch)

## 9. Configurations

**Custom metric:**
```python
cloudwatch.put_metric_data(
    Namespace='MyApp',
    MetricData=[{
        'MetricName': 'PageLoadTime',
        'Value': 1.23,
        'Unit': 'Seconds',
        'Dimensions': [{'Name': 'Environment', 'Value': 'Prod'}]
    }]
)
```

**Alarm:**
```
Metric: CPUUtilization
Threshold: >80% for 2 consecutive periods (10 minutes)
Action: SNS topic (alert team) + Auto Scaling action (add instances)
```

**Logs Insights query:**
```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)
```

## 10. Additional

**Metric math:** Combine metrics (CPU + Network), create calculated metrics  
**Anomaly detection:** ML-based bands (alert when outside normal)  
**Contributor Insights:** Find top talkers (which IPs causing most traffic)  
**Cross-account:** Central monitoring account, all accounts send metrics/logs  
**Retention:** Logs 1 day to never, metrics 15 months maximum

---

# 13. CloudTrail

## 1. Problem Solved
**Before:** No audit trail, can't track who did what, security incidents hard to investigate  
**After:** Complete API call history, compliance audit trail, security forensics

## 2. History
**2013:** CloudTrail launches  
**Evolution:** Management events (2013), data events (2015), Insights (2019), Lake (2021 - store in S3 data lake format)

## 3. When to Use
✅ Compliance (who accessed what)  
✅ Security investigations  
✅ Operational troubleshooting (who deleted resource?)  
✅ Governance  
✅ Resource change tracking

## 4. vs Similar
**CloudTrail vs CloudWatch:** Trail=who did what (API calls), CloudWatch=performance/logs  
**CloudTrail vs Config:** Trail=API actions, Config=configuration changes over time  
**CloudTrail vs VPC Flow Logs:** Trail=API calls, Flow=network traffic

## 5. How It Works

Every API call logged: Who (IAM identity), What (action), When (timestamp), Where (source IP), Which resource, Request parameters, Response. Delivered to S3 within 15 minutes. Can send to CloudWatch Logs for real-time analysis.

## 6. Cost

Management events: First trail free per region, $2 per 100K events additional  
Data events: $0.10 per 100K events (S3 PutObject, Lambda invocations)  
Insights events: $0.35 per 100K write events analyzed  
Storage: S3 costs for logs

## 7. Pros and Cons
**Pros:** Complete audit trail, 90-day event history in console (free), integration with CloudWatch/Athena, compliance requirement for many standards  
**Cons:** Not real-time (15-min delay), costs for high-volume, data events expensive, log analysis requires Athena/Insights

## 8. SAP-C02 Questions
**Q:** Security incident investigation → CloudTrail logs  
**Q:** Who deleted S3 bucket? → CloudTrail  
**Q:** Compliance audit → CloudTrail + S3 lifecycle to Glacier (long-term retention)  
**Q:** Real-time detection → CloudTrail → CloudWatch Logs → Metric filter → Alarm  
**Q:** Multi-account audit → Organization trail (logs all accounts to central S3)

## 9. Configurations

**Trail:** Name, S3 bucket (log destination), Management events (read/write or all), Data events (S3 objects, Lambda), Insights (unusual activity detection), Multi-region (recommended), All accounts (if using Organizations)

**Log file integrity:** SHA-256 hash, detect tampering, compliance requirement

**Event selectors:** Filter what's logged (reduce costs), example: Only S3 PutObject for specific buckets

## 10. Additional

**CloudTrail Lake:** Query events with SQL (like Athena), 7-year retention, immutable audit log, compliance  
**Insights:** Detects unusual API call patterns (spike in DeleteBucket, unusual IP), ML-based  
**Organization trail:** One trail logs all accounts, centralized compliance  
**Integration:** Send to CloudWatch Logs (real-time), S3 (long-term), EventBridge (automated response)

---

# 14. KMS - Complete Deep Dive

## 1. Problem Solved
**Before:** Manual key management, keys in code, no rotation, compliance issues  
**After:** Centralized key management, automatic rotation, audit trail, integrated encryption

## 2. History
**2014:** KMS launches  
**2016:** Custom key stores  
**2019:** Asymmetric keys  
**2020:** Multi-region keys

## 3. When to Use
✅ Encrypt data at rest (EBS, S3, RDS)  
✅ Envelope encryption  
✅ Key rotation needed  
✅ Audit key usage  
✅ Compliance (HIPAA, PCI-DSS)  
❌ Don't use: Need to manage keys outside AWS (use CloudHSM), extreme performance (KMS has API limits)

## 4. vs Similar
**KMS vs CloudHSM:** KMS=managed/$1/month/multi-tenant, CloudHSM=dedicated hardware/$1.50/hour/single-tenant  
**KMS vs Secrets Manager:** KMS=encryption keys, Secrets=encrypted secrets (passwords) using KMS  
**KMS vs SSE-S3:** KMS=you control keys/audit, SSE-S3=AWS manages everything

## 5. How It Works

**Envelope encryption:** Data encrypted with data key, data key encrypted with KMS master key, encrypted data + encrypted data key stored together. Decrypt: KMS decrypts data key, use data key to decrypt data. Master key never leaves KMS (FIPS 140-2 Level 2).

## 6. Cost
Customer managed keys: $1/month per key, API requests: $0.03 per 10K requests (free tier: 20K/month), Automatic rotation: Free, Multi-region keys: $1/month per region

## 7. Pros and Cons
**Pros:** Integrated with AWS services, audit via CloudTrail, automatic rotation, key policies (fine-grained control), multi-region keys (replicated), compliance certified  
**Cons:** API rate limits (10K-30K req/sec depending on operation), not suitable for client-side encryption at massive scale, keys can't be exported

## 8. SAP-C02 Questions
**Q:** Encrypt EBS → KMS customer managed key  
**Q:** Rotate keys annually → Enable automatic rotation  
**Q:** Cross-account encryption → Key policy allows other account  
**Q:** Encrypt existing unencrypted resource → Copy with encryption (can't encrypt in-place)  
**Q:** Audit key usage → CloudTrail logs

## 9. Configurations

**Key policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "Enable IAM User Permissions",
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::123456789012:root"},
    "Action": "kms:*",
    "Resource": "*"
  }]
}
```

**Cross-account:**
```
Account A: Key policy allows Account B
Account B: IAM policy allows using Account A key
Both needed!
```

**Grants:** Temporary permissions to use keys, programmatic creation, used by AWS services

## 10. Additional

**Multi-region keys:** Primary in us-east-1, replicas in eu-west-1/ap-southeast-1, same key ID all regions, encrypt in one region decrypt in another, use for global applications  
**Automatic rotation:** Yearly (365 days), creates new backing key, old keys retained for decryption, transparent to applications  
**Deletion:** 7-30 day waiting period (prevent accidental), can cancel during waiting period  
**API limits:** Shared quota per account/region, GenerateDataKey: 30K req/sec, Decrypt: 30K req/sec, can request increase

---

# 15. Transit Gateway

## 1. Problem Solved
**Before:** VPC mesh with peering (N*(N-1)/2 connections), complex routing, doesn't scale  
**After:** Hub-spoke model, centralized routing, scales to thousands of VPCs

## 2. History
**2018:** Transit Gateway launches, replaces complex VPC peering meshes  
**2019:** Inter-region peering  
**2020:** Multicast support

## 3. When to Use
✅ 10+ VPCs need connectivity  
✅ On-premises to multiple VPCs  
✅ Centralized egress (shared NAT/firewall)  
✅ Network segmentation with isolation  
❌ Don't use: 2-3 VPCs (VPC peering simpler/cheaper), single VPC

## 4. vs Similar
**Transit Gateway vs VPC Peering:** TGW=hub-spoke/transitive, Peering=one-to-one/not transitive  
**Transit Gateway vs Direct Connect Gateway:** TGW=VPC-to-VPC+on-prem, DX Gateway=on-prem-to-VPCs only  
**Transit Gateway vs PrivateLink:** TGW=network connectivity, PrivateLink=service exposure

## 5. How It Works

Central router with route tables. VPCs attach to TGW, TGW routes between VPCs based on route tables. Can create multiple route tables for isolation (Prod table, Dev table). Supports attachments: VPC, VPN, Direct Connect, Peering (to another TGW).

## 6. Cost
TGW: $0.05/hour = $36.50/month, Attachment: $0.05/hour per VPC = $36.50/month per VPC, Data transfer: $0.02/GB  
**Example:** 10 VPCs = $36.50 + (10×$36.50) = $401.50/month + data

## 7. Pros and Cons
**Pros:** Scales to 5K VPCs, transitive routing, centralized management, route table isolation, inter-region peering, on-premises connectivity  
**Cons:** Costs add up ($73/VPC/month), more complex than peering for simple cases, single point of failure (use multiple TGW or peering backup)

## 8. SAP-C02 Questions
**Q:** Connect 30 VPCs → Transit Gateway  
**Q:** Isolate Dev from Prod → Separate TGW route tables  
**Q:** On-prem to all VPCs → TGW with VPN/Direct Connect attachment  
**Q:** Centralized egress → Egress VPC attached to TGW, all traffic routes through it

## 9. Configurations

**Route tables:** Create Production/Development/Shared tables, associate VPC attachments, propagate or static routes, blackhole routes (drop traffic)

**Attachments:** VPC (specify subnets in each AZ), VPN (Site-to-Site), Direct Connect (via DX Gateway), Peering (another TGW in different region)

**Route propagation:** Automatic (VPC CIDRs propagated) or static (manual routes)

## 10. Additional

**Inter-region peering:** TGW in us-east-1 ↔ TGW in eu-west-1, encrypted by default, cross-region VPC connectivity  
**Multicast:** One-to-many transmission, use for video streaming, market data  
**Network Manager:** Visualize global network, on-prem + AWS, centralized monitoring  
**Appliance mode:** For firewalls in VPC, symmetric routing

---

**COMPLETED: 15/30**

Continuing without interruption...

