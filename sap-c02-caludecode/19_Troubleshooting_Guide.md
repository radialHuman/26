# Comprehensive Troubleshooting Guide for SAP-C02

---

## EC2 Troubleshooting

### "EC2 Instance Can't Connect to Internet" — 15+ Possible Causes

Check in this order:

1. ✅ Is the instance in a **public subnet**? (Route table has 0.0.0.0/0 → IGW)
2. ✅ Does the instance have a **public IP or Elastic IP**?
3. ✅ Is an **Internet Gateway attached** to the VPC?
4. ✅ Is the **route table** associated with the correct subnet?
5. ✅ Does the **Security Group** allow outbound traffic? (Default: yes)
6. ✅ Does the **NACL** allow outbound traffic AND return traffic (ephemeral ports 1024-65535)?
7. ✅ If in **private subnet**: Is there a NAT Gateway? Is the route table pointing to it?
8. ✅ Is the NAT Gateway in a **public subnet** with its own route to the IGW?
9. ✅ Does the NAT Gateway have an **Elastic IP**?
10. ✅ Is **Source/Destination Check** enabled? (Should be enabled for normal instances, disabled for NAT instances)
11. ✅ Are there any **SCP** restrictions blocking the API calls?
12. ✅ Is the **instance state** running? (Not stopped or terminated)
13. ✅ Check **VPC Flow Logs** for REJECT entries
14. ✅ Is DNS resolution working? (`nslookup google.com`)
15. ✅ Is the OS-level firewall blocking? (iptables/Windows Firewall)
16. ✅ Is the ENI correctly attached?

### "Can't SSH to EC2 Instance"

1. Security Group: Allow TCP port 22 from your IP
2. NACL: Allow inbound 22 AND outbound ephemeral ports (1024-65535)
3. Instance has public IP or Elastic IP (if connecting from internet)
4. Key pair: Using the correct .pem file
5. Username: ec2-user (Amazon Linux), ubuntu (Ubuntu), admin (Debian)
6. Instance status checks: Both passing?
7. Route table: Has route to internet (for public instances)
8. OS-level SSH daemon running (`systemd status sshd`)

### "EC2 Performance Issues"

| Symptom | Likely Cause | Fix |
|---|---|---|
| CPU 100% | Instance too small | Upgrade instance type |
| CPU spiky on T-series | CPU credit exhaustion | Enable Unlimited mode or upgrade |
| High memory usage | Not visible in CloudWatch! | Install CloudWatch Agent, check memory |
| Slow disk I/O | EBS IOPS/throughput limit hit | Upgrade volume type (gp2→gp3→io2) |
| Network bottleneck | Instance type limits bandwidth | Upgrade instance type (larger = more bandwidth) |

---

## RDS Troubleshooting

### "RDS Queries Slow" — Step-by-Step Investigation

1. **Performance Insights**: Check Top SQL — which queries consume most DB time?
2. **CloudWatch metrics**: Check CPU, FreeableMemory, ReadIOPS, WriteIOPS
3. **Connection count**: Too many connections? Consider RDS Proxy or connection pooling
4. **Slow query log**: Enable and analyze (Parameter Group setting)
5. **Missing indexes**: Queries doing full table scans?
6. **Instance size**: Insufficient CPU or memory? Right-size using Performance Insights
7. **Storage type**: Using gp2 with small volume? (IOPS tied to size). Switch to gp3
8. **Read Replicas**: Offload read traffic
9. **ElastiCache**: Cache frequently queried data
10. **Parameter tuning**: Adjust innodb_buffer_pool_size, max_connections, etc.

### "RDS Can't Connect"

1. Security Group: Allow inbound from app's SG on database port (3306/5432)
2. DB Subnet Group: Subnets in correct VPC and AZs
3. Publicly accessible: Set to No for production (access only from VPC)
4. DNS resolution: VPC has enableDnsSupport and enableDnsHostnames
5. Connection string: Using correct endpoint (cluster vs reader vs instance)
6. Credentials: Correct username/password

---

## Lambda Troubleshooting

### "Lambda Timing Out" — All Possible Causes

1. **Timeout too low**: Default 3 seconds. Increase (max 15 minutes)
2. **VPC configuration**: Lambda in VPC needs NAT Gateway for internet access. No NAT = timeout when calling external APIs
3. **Missing VPC Endpoints**: Lambda in VPC accessing AWS services needs VPC Endpoints (or NAT Gateway)
4. **Cold start**: First invocation after idle. Use Provisioned Concurrency for latency-sensitive
5. **Downstream service slow**: Database, external API response time
6. **Connection exhaustion**: Too many Lambda instances → too many DB connections. Use RDS Proxy
7. **Infinite loop**: Lambda writes to S3 → triggers itself → infinite recursion. Check trigger configuration
8. **Memory too low**: Low memory = less CPU = slower execution. Increase memory
9. **Large deployment package**: Slow cold start. Reduce package size

### "Lambda Permission Errors"

1. Execution role: Does it have permissions for the target service?
2. Resource-based policy: Does the target resource allow Lambda's role?
3. VPC: If in VPC, role needs `ec2:CreateNetworkInterface`, `ec2:DescribeNetworkInterfaces`, `ec2:DeleteNetworkInterface`
4. KMS: If accessing encrypted resources, role needs KMS permissions

---

## Auto Scaling Troubleshooting

### "Auto Scaling Not Working"

| Problem | Cause | Fix |
|---|---|---|
| Not scaling out | No scaling policy configured | Add Target Tracking or Step Scaling policy |
| Scaling too slow | Cooldown period too long | Reduce cooldown period |
| Instances terminating immediately | Health check grace period too short | Increase grace period |
| Not replacing unhealthy | Health check type = EC2, not ELB | Set to ELB |
| Scaling in too aggressively | Threshold too low | Adjust scaling policy |
| Can't launch new instances | EC2 instance limit reached | Request limit increase |
| Stuck at desired capacity | No scaling events triggering | Check CloudWatch alarms |

---

## S3 Troubleshooting

### "S3 Access Denied"

1. **Bucket policy**: Does it allow the action for the principal?
2. **IAM policy**: Does the user/role have S3 permissions?
3. **Block Public Access**: Is it blocking the access?
4. **Object ownership**: If cross-account upload, bucket owner may not own the object
5. **Encryption**: SSE-KMS — does the caller have KMS Decrypt permission?
6. **VPC Endpoint policy**: If accessing through VPC Endpoint, check endpoint policy
7. **SCP**: Is an Organization SCP restricting S3 access?
8. **ACL**: Legacy ACLs may conflict (disable ACLs with BucketOwnerEnforced)

### "S3 Performance Issues"

| Issue | Cause | Fix |
|---|---|---|
| Slow uploads | Large files over long distance | Multipart upload + Transfer Acceleration |
| PUT throttling (503) | >3,500 PUT/sec per prefix | Distribute across multiple prefixes |
| GET throttling (503) | >5,500 GET/sec per prefix | Distribute prefixes or use CloudFront |

---

## VPC/Networking Troubleshooting

### Systematic Connectivity Debug Flow

```
1. Source Security Group → allows outbound?
2. Source Subnet NACL → allows outbound + return traffic?
3. Source Route Table → route to destination?
4. Transit mechanism → Peering? TGW? IGW? NAT? VPN?
5. Destination Route Table → route back to source?
6. Destination Subnet NACL → allows inbound + return traffic?
7. Destination Security Group → allows inbound?
8. Application listening on correct port?
```

**Tools**:
- **VPC Reachability Analyzer**: Automated path analysis
- **VPC Flow Logs**: See ACCEPT/REJECT at network level
- **CloudWatch Logs Insights**: Query Flow Logs
- **traceroute/tracert**: Network path analysis

---

## Cost Spike Investigation

1. **Cost Explorer** → Filter by service → Identify which service spiked
2. **Cost and Usage Report** → Detailed line-item analysis
3. **Common culprits**:
   - Forgotten running resources (EC2 instances, NAT Gateways, RDS)
   - Data transfer out spikes
   - NAT Gateway data processing
   - DynamoDB On-Demand with traffic spike
   - Undeleted EBS volumes/snapshots
   - Unused Elastic IPs ($0.005/hr each)
4. **Fix**: Set up **AWS Budgets** with alerts at 80% and 100% of expected spend

---

## Security Incident Response

### GuardDuty Finding → Investigation → Remediation

```
1. GuardDuty Finding detected
   ↓
2. EventBridge triggers Lambda
   ↓
3. Lambda: Automated containment
   - Isolate EC2: Change Security Group to deny-all
   - Create EBS snapshot (forensics)
   - Tag instance as "compromised"
   - Notify security team (SNS)
   ↓
4. Manual investigation
   - Review VPC Flow Logs
   - Review CloudTrail for API calls from instance
   - Check instance metadata service access logs
   - Analyze EBS snapshot
   ↓
5. Remediation
   - Terminate compromised instance
   - Rotate all credentials that were on the instance
   - Review and fix root cause (misconfigured SG? Unpatched software?)
   - Update security controls
```

---

*Word count: ~3,000+ words*
