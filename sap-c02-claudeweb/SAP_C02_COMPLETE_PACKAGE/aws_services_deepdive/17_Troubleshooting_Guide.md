# SAP-C02 Troubleshooting Guide - Systematic Debugging

## General Troubleshooting Methodology

### The 5-Layer Debugging Framework
```
Layer 1: Network (Can traffic reach?)
Layer 2: Security (Is traffic allowed?)
Layer 3: Service Health (Is service running?)
Layer 4: Configuration (Is it configured correctly?)
Layer 5: Application (Is code working?)

Always debug top-down (network first, code last)
```

---

## EC2 Troubleshooting

### Issue: Can't SSH to EC2 Instance

**Systematic Check:**
```
□ Layer 1 - Network:
  - Instance has public IP? (Elastic IP or auto-assigned)
  - Subnet has route to Internet Gateway? (0.0.0.0/0 → igw-xxx)
  - Instance in public subnet?

□ Layer 2 - Security:
  - Security Group allows SSH (22) from your IP?
  - NACL allows SSH (inbound 22 + outbound 1024-65535 for return)?
  - Source IP correct? (your current IP might have changed)

□ Layer 3 - Service Health:
  - Instance state: Running?
  - Status checks: 2/2 passed?
  - System log shows boot completed?

□ Layer 4 - Configuration:
  - Correct key file (matching key pair)?
  - Key permissions: chmod 400 (not 644)?
  - Correct username? (ec2-user for Amazon Linux, ubuntu for Ubuntu, admin for Debian)

□ Layer 5 - Application:
  - SSH service running on instance?
  - Port 22 listening? (sudo netstat -tlnp | grep 22)
```

**Commands to Debug:**
```bash
# Check Security Group:
aws ec2 describe-security-groups --group-ids sg-xxx

# Check Route Table:
aws ec2 describe-route-tables --route-table-ids rtb-xxx

# Check Instance Status:
aws ec2 describe-instance-status --instance-ids i-xxx

# View System Log (boot messages):
aws ec2 get-console-output --instance-id i-xxx
```

**Common Fixes:**
- Missing public IP → Assign Elastic IP
- Wrong security group → Edit rules, add SSH from your IP
- Wrong key → Use correct .pem file
- Timeout → Check NACL (outbound ephemeral ports allowed?)

---

### Issue: EC2 Instance Can't Access Internet

**Check List:**
```
For instance in PUBLIC subnet:
□ Instance has public IP?
□ Route table: 0.0.0.0/0 → IGW?
□ Internet Gateway attached to VPC?
□ Security Group allows outbound?
□ NACL allows outbound + inbound return traffic?

For instance in PRIVATE subnet:
□ Route table: 0.0.0.0/0 → NAT Gateway?
□ NAT Gateway in PUBLIC subnet?
□ NAT Gateway subnet has route to IGW?
□ NAT Gateway has Elastic IP?
□ Security Group allows outbound?
```

**Test Commands:**
```bash
# From instance:
ping 8.8.8.8  # Test connectivity
curl http://checkip.amazonaws.com  # Should return public IP
curl https://www.google.com  # Test HTTPS

# Check routes:
ip route show
# Should see default via gateway

# Check DNS:
nslookup google.com
# Should resolve
```

**Fixes:**
- Private subnet without NAT → Create NAT Gateway in public subnet, update route table
- NAT Gateway wrong subnet → Must be in public subnet
- No Elastic IP on NAT → Allocate and associate

---

### Issue: Instance Status Checks Failing

**System Status Check Failed:**
```
Cause: AWS infrastructure issue (hardware, network)
Fix: Stop and Start instance (migrates to different hardware)
     OR Wait for AWS to resolve
```

**Instance Status Check Failed:**
```
Causes:
- Misconfigured network
- Corrupted file system
- Kernel panic
- Out of memory

Debug:
1. Get system log: Console → Actions → Monitor and troubleshoot → Get system log
2. Look for errors (kernel panic, filesystem errors)

Fixes:
- Reboot instance
- If boot issues: Detach root volume, attach to another instance, fix, reattach
- If persistent: Restore from snapshot or rebuild
```

---

## VPC Troubleshooting

### Issue: Instances in Different Subnets Can't Communicate

**Check:**
```
□ Both in same VPC? (different VPCs need peering/TGW)
□ Security Groups allow traffic?
  - Source SG allows outbound to destination
  - Destination SG allows inbound from source
□ NACLs allow traffic? (both inbound and outbound - stateless!)
□ Route tables have local route? (VPC CIDR → local, automatic)
```

**Debug Commands:**
```bash
# From source instance:
ping <DESTINATION_PRIVATE_IP>
telnet <DESTINATION_IP> <PORT>

# Check security group:
aws ec2 describe-security-groups --group-ids sg-xxx

# Check NACL:
aws ec2 describe-network-acls --network-acl-ids acl-xxx
```

**Common Causes:**
- Security group doesn't allow specific port
- NACL blocks (rare if using default NACL)
- Different VPCs (need peering if unintentional)

---

### Issue: VPC Peering Not Working

**Check:**
```
□ Peering connection status: Active?
□ Route tables updated in BOTH VPCs?
  - VPC-A table: Destination 172.16.0.0/16 → pcx-xxx
  - VPC-B table: Destination 10.0.0.0/16 → pcx-xxx
□ Security groups allow traffic from peered VPC CIDR?
□ No overlapping CIDRs? (can't peer 10.0.0.0/16 with 10.0.0.0/16)
□ Not transitive? (A↔B and B↔C doesn't mean A can reach C)
```

---

## RDS Troubleshooting

### Issue: Can't Connect to RDS

**Check List:**
```
□ Security group allows port (3306 MySQL, 5432 PostgreSQL)?
□ Inbound rule source correct? (your IP or EC2 security group)
□ Instance in private subnet requires bastion/VPN (can't connect from internet)?
□ Public accessibility: No means VPC-only access
□ Endpoint correct? (copy from console, don't type)
□ Database created? (not just instance - need CREATE DATABASE)
□ Credentials correct?
```

**Connection String Checks:**
```bash
# MySQL:
mysql -h <ENDPOINT> -P 3306 -u admin -p

# PostgreSQL:
psql -h <ENDPOINT> -p 5432 -U postgres -d dbname

# Test network:
telnet <ENDPOINT> 3306
# Should connect (Ctrl+] then quit to exit)

# If timeout:
# → Security group or NACL blocking
# If "Connection refused":
# → Instance running but database not started (rare with RDS)
# If "Unknown host":
# → Wrong endpoint or DNS issue
```

---

### Issue: RDS Queries Slow

**Investigation Steps:**
```
1. CloudWatch Metrics:
   - CPUUtilization > 80%? → Instance too small or inefficient queries
   - DatabaseConnections near max? → Connection pooling needed or more connections
   - ReadIOPS / WriteIOPS > provisioned? → Need more IOPS (upgrade to io2)
   - FreeableMemory low? → Need larger instance or reduce buffer cache usage

2. Performance Insights:
   - Top SQL queries (which are slowest?)
   - Wait events (what's database waiting for?)
     - IO wait → Storage issue (upgrade to io2, more IOPS)
     - CPU wait → Query optimization or bigger instance
     - Lock wait → Too many concurrent writes, deadlocks

3. Slow Query Log:
   - Enable: slow_query_log = 1
   - Threshold: long_query_time = 2 (log queries >2 sec)
   - Analyze logs for problematic queries
```

**Solutions:**
```
Short-term:
- Add Read Replicas (if read-heavy)
- Increase instance size (vertical scaling)
- Add ElastiCache (cache frequent queries)

Long-term:
- Query optimization (add indexes, rewrite queries)
- Database schema optimization
- Partition large tables
- Archive old data
```

---

### Issue: RDS Multi-AZ Failover Doesn't Work

**Causes:**
```
□ Multi-AZ not actually enabled? (check configuration)
□ Standby is unhealthy? (both primary and standby failed)
□ Failover in progress (takes 60-120 sec, wait)
□ Application connection timeout too short? (increase to 2+ minutes)
□ Application not handling DNS changes? (connection pooling issue)
```

**Force Failover Test:**
```
1. RDS → Instance → Reboot with failover
2. Monitor Events tab (shows failover progress)
3. Check CloudWatch metrics (drops during failover)
4. Verify application reconnects automatically
```

---

## DynamoDB Troubleshooting

### Issue: ProvisionedThroughputExceededException

**Diagnosis:**
```
Provisioned mode exceeded capacity

1. Check CloudWatch:
   - ConsumedReadCapacityUnits vs ProvisionedReadCapacityUnits
   - ConsumedWriteCapacityUnits vs ProvisionedWriteCapacityUnits
   - UserErrors metric (throttles counted here)

2. Identify cause:
   - Overall capacity exceeded? → Increase RCU/WCU or enable Auto Scaling
   - Hot partition? → Specific partition key getting most traffic
```

**Hot Partition Detection:**
```
Symptom: Total capacity 1000 WCU, only using 200, still throttled

Cause: 
- One partition getting all writes
- Bad partition key (status, date, country with uneven distribution)

Solutions:
- Add randomness to partition key (append 1-10 random suffix)
- Use different partition key (high cardinality)
- Switch to On-Demand mode (eliminates hot partition throttling)
```

**Fix:**
```
Immediate:
- Switch to On-Demand mode (stops throttling instantly)
- Or increase provisioned capacity significantly

Long-term:
- Redesign table with better partition key
- Migrate data to new table
```

---

### Issue: DynamoDB Query Returns No Items (But Data Exists)

**Common Mistakes:**
```
1. Using Scan with filters instead of Query:
   ❌ scan(FilterExpression: status = 'active')  # Scans all, slow
   ✅ query(KeyConditionExpression: userId = 'user123')  # Fast

2. Wrong key structure:
   - Partition key: userId
   - Sort key: timestamp
   ❌ query(userId = 'user123' AND status = 'active')  # status not in key!
   ✅ query(userId = 'user123', FilterExpression: status = 'active')

3. Eventually consistent read seeing old data:
   - Recent write not yet propagated to all replicas
   ✅ Use strongly consistent read: ConsistentRead=True
```

---

## Lambda Troubleshooting

### Issue: Lambda Timing Out

**Investigation:**
```
1. Check timeout setting:
   - Default: 3 seconds
   - Your function needs: ? (add logging to measure)
   - Set timeout: Actual time + 20% buffer

2. What's taking time?
   - Cold start? (first invocation slow, subsequent fast)
   - Network calls? (external API, database slow)
   - Heavy computation? (need more memory = more CPU)
```

**Solutions:**
```
Timeout due to cold start:
- Provisioned Concurrency (keep warm)
- Optimize init code (minimize imports, lazy load)
- Use smaller deployment package

Timeout due to processing:
- Increase timeout (max 15 min)
- Increase memory (more CPU, faster execution)
- Optimize code
- Break into smaller tasks (Step Functions)
```

---

### Issue: Lambda Out of Memory

**Error:** "Runtime.ExitError: Runtime exited with error: signal: killed"

**Diagnosis:**
```
1. Check CloudWatch Logs:
   REPORT Line shows:
   Memory Size: 512 MB
   Max Memory Used: 515 MB  ← Exceeded!

2. Memory leak or just need more?
   - Check if memory grows over time (leak)
   - Or just large dataset (need more)
```

**Fix:**
```
- Increase memory allocation (512 MB → 1024 MB)
- Optimize code (reduce memory usage)
- Process data in chunks (not all at once)
- Use /tmp for large files (512 MB to 10 GB available)
```

---

### Issue: Lambda Can't Access RDS

**Check VPC Configuration:**
```
□ Lambda configured with VPC? (Configuration → VPC)
□ Subnets selected (2+ for HA)?
□ Security group attached to Lambda allows outbound to RDS port?
□ RDS security group allows inbound from Lambda security group?
□ Lambda in same VPC as RDS?

□ Internet access needed?
  - Lambda in VPC + internet access = need NAT Gateway
  - Without NAT: Can access VPC resources but not internet
```

**Debug:**
```
Enable VPC Flow Logs on Lambda's ENI:
- See if traffic reaching RDS (ACCEPT or REJECT?)
- REJECT → Security group or NACL blocking
```

---

## Auto Scaling Troubleshooting

### Issue: Auto Scaling Not Scaling Out

**Check:**
```
□ CloudWatch alarm in ALARM state?
  - View alarm history
  - Check metric value vs threshold

□ Auto Scaling group:
  - Current capacity < Max capacity?
  - Desired = Current? (if equal, won't scale more)
  - Scaling policy enabled?
  - In cooldown period? (check last scaling activity)

□ Instance limits:
  - Hit EC2 instance limit for account/region?
  - Check Service Quotas

□ Launch template/configuration:
  - Valid? (AMI exists, instance type available)
  - Key pair exists?
  - Security group exists?
```

**Debug Commands:**
```bash
# View scaling activities:
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name my-asg \
  --max-records 20

# Look for failures:
# "Failed to launch" → Check why (limits, config errors)

# View current state:
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names my-asg
```

---

### Issue: Auto Scaling Terminates New Instances Immediately

**Cause:** Failing health checks

**Check:**
```
□ Health check grace period too short?
  - Application takes 5 minutes to start
  - Grace period: 300 seconds (5 min) ← Good
  - Grace period: 60 seconds ← Too short! Instance terminated before ready

□ Health check failing?
  - ELB health check: /health endpoint returns 200?
  - Instance actually unhealthy? (check application logs)

□ EC2 status checks failing?
  - User data script errors?
  - View system log for boot errors
```

**Fix:**
- Increase grace period to match application startup time
- Fix application health endpoint
- Debug user data script errors

---

## Load Balancer Troubleshooting

### Issue: ALB Returns 502 Bad Gateway

**Causes:**
```
1. No healthy targets:
   □ All targets unhealthy? (check target group health)
   □ Health check failing? (wrong path, wrong port, wrong success code)

2. Target returned invalid response:
   □ Backend returning non-HTTP response?
   □ Connection closed unexpectedly?

3. Timeout:
   □ Backend taking >60 seconds? (ALB idle timeout default)
   □ Increase ALB idle timeout or fix slow backend
```

**Debug:**
```
1. Target Group → Health status
   - All unhealthy? → Fix health check configuration
   - Sporadic failures? → Application issues

2. ALB Access Logs (enable if not already):
   - ELB status code: 502
   - Target status code: - (no response from target)
   - Processing time: How long before 502?

3. Test target directly:
   curl http://<TARGET_PRIVATE_IP>/health
   # Should return 200 OK
   # If fails: Application issue, not ALB
```

---

### Issue: ALB Returns 503 Service Unavailable

**Cause:** No healthy targets available

**Check:**
```
1. Target Group:
   - Registered targets: 0? → Add targets!
   - All unhealthy? → Fix health checks

2. Health Check Configuration:
   - Path exists? (curl http://instance/health)
   - Success codes: 200 or range 200-299?
   - Timeout too short? (increase to 10-15 sec)
   - Healthy threshold too high? (lower to 2-3)

3. Target Application:
   - Actually running?
   - Listening on health check port?
   - Responding within timeout?
```

**Health Check Test:**
```bash
# From your computer:
curl -v http://<TARGET_PUBLIC_IP>/health
# Should return 200 in <5 seconds

# If times out:
# → Application not responding or security group blocking

# If 404:
# → /health endpoint doesn't exist

# If 500:
# → Application error (check app logs)
```

---

## Route 53 Troubleshooting

### Issue: DNS Not Resolving

**Check:**
```
□ Hosted zone created?
□ Record exists? (A, CNAME, Alias)
□ Nameservers updated at registrar?
  - Route 53 provides 4 NS records
  - Must update at domain registrar (GoDaddy, Namecheap, etc.)
  - Propagation: 24-48 hours

□ TTL expired? (cached old value)
  - Wait for TTL duration
  - Or flush local DNS cache

□ Record value correct?
  - A record: Valid IP address?
  - Alias: Target exists and is healthy?
```

**Debug:**
```bash
# Check nameservers:
dig example.com NS
# Should return Route 53 nameservers (ns-xxx.awsdns-xx.com)

# Check A record:
dig example.com A
# Should return IP address

# Check from different DNS:
dig @8.8.8.8 example.com
# Google DNS (eliminates local cache)

# Trace resolution:
dig +trace example.com
# Shows each DNS server queried
```

---

### Issue: Route 53 Failover Not Working

**Check:**
```
□ Health check configured on primary?
□ Health check actually failing?
  - View health check status in console
  - View CloudWatch metric: HealthCheckStatus

□ Health check configuration:
  - Endpoint reachable from internet? (health checkers are outside VPC)
  - If ALB: Use ALB endpoint, not instance endpoint
  - Port correct?
  - Path returns 200?

□ Failover record exists?
  - Secondary record configured?
  - Different value than primary?
```

**Test Health Check:**
```bash
# Manually test endpoint:
curl https://<HEALTH_CHECK_ENDPOINT>/health
# Should return 200 within timeout (10 sec default)

# If times out:
# → Endpoint not reachable or too slow
# → Increase timeout or fix application

# If returns 404/500:
# → Application error, fix before health check works
```

---

## S3 Troubleshooting

### Issue: Access Denied to S3 Bucket

**Check Multiple Permission Layers:**
```
1. Bucket policy:
   - Allows your IAM user/role?
   - No explicit Deny? (Deny always wins)

2. IAM policy (your user/role):
   - Allows s3:GetObject on bucket ARN?
   - Resource ARN correct? (arn:aws:s3:::bucket/* for objects)

3. ACLs (legacy, usually not the issue):
   - Bucket ACL
   - Object ACL

4. Block Public Access:
   - If trying public access: All 4 settings OFF
   - Usually should be ON (use presigned URLs instead)

5. Encryption:
   - SSE-KMS with custom key?
   - Need kms:Decrypt permission

Debug flow:
Identity (IAM) → Bucket policy → ACL → Block Public Access → KMS (if encrypted)
ALL must allow for access to work
```

**Debug:**
```bash
# Test with AWS CLI:
aws s3 ls s3://mybucket/
# Error: Access Denied
#  → Check IAM policy (yourself)

aws s3api get-bucket-policy --bucket mybucket
# View bucket policy

aws iam get-user-policy --user-name myuser --policy-name mypolicy
# View IAM policy

# Test specific operation:
aws s3 cp s3://mybucket/file.txt ./
# If fails: Note exact error, check which layer blocking
```

---

### Issue: S3 Lifecycle Not Working

**Check:**
```
□ Lifecycle rule enabled?
□ Filter matches objects? (prefix, tags)
□ Transition rules valid?
  - Can't transition to same class
  - Minimum storage duration met? (IA requires 30 days in Standard)
  - Days value correct? (30 days to IA, 90 days to Glacier)

□ Sufficient time passed?
  - Lifecycle runs daily (not immediate)
  - Check tomorrow if just configured

□ Objects have required tags? (if tag-based filter)
```

**Verify:**
```bash
# List lifecycle rules:
aws s3api get-bucket-lifecycle-configuration --bucket mybucket

# Check object storage class:
aws s3api head-object --bucket mybucket --key file.txt
# StorageClass: STANDARD or GLACIER or STANDARD_IA

# If not transitioned yet: Wait 24-48 hours
```

---

## DynamoDB Troubleshooting

### Issue: Scan/Query Returns No Items

**Common Mistakes:**
```
1. Using wrong key:
   Table partition key: userId
   ❌ query(KeyConditionExpression: email = 'alice@...') # Email not the key!
   ✅ query(KeyConditionExpression: userId = 'user123')

2. Typo in key value:
   ❌ query(userId = 'user_123')  # Underscore
   ✅ query(userId = 'user-123')  # Dash (data has dash)

3. Case sensitivity:
   ❌ query(userId = 'USER123')  # Uppercase
   ✅ query(userId = 'user123')  # Lowercase (DynamoDB is case-sensitive)

4. Using = instead of begins_with for sort key:
   ❌ query(userId = 'user123' AND timestamp = '2026-03-20...')  # Exact match hard
   ✅ query(userId = 'user123' AND timestamp BETWEEN '2026-03-20' AND '2026-03-21')
```

**Debug:**
```python
# Enable debugging:
import logging
logging.basicConfig(level=logging.DEBUG)

# Print query:
print(f"Querying: {key_condition}")

# Try scan first (slower but gets all items):
response = table.scan()
print(f"Total items: {response['Count']}")
# If 0 → Table empty, if >0 → Query syntax wrong

# Exact key check:
response = table.get_item(Key={'userId': 'user123'})
print(response)
# If KeyError → Item doesn't exist with that exact key
```

---

## Lambda + VPC Troubleshooting

### Issue: Lambda in VPC Can't Access Internet

**Cause:** No NAT Gateway

**Check:**
```
□ Lambda in private subnets? (should be - best practice)
□ Private subnet route table has 0.0.0.0/0 → NAT Gateway?
□ NAT Gateway in public subnet?
□ NAT Gateway subnet has route to Internet Gateway?
□ Lambda security group allows outbound?
□ Lambda execution role has permissions?
```

**Fix:**
```
1. Create NAT Gateway in public subnet (each AZ for HA)
2. Update private subnet route tables:
   Destination: 0.0.0.0/0
   Target: nat-xxx
3. Wait 2-3 minutes (Lambda ENI updates)
4. Test again
```

**Alternative (if only need AWS services):**
```
Use VPC Endpoints instead of NAT Gateway:
- S3: Gateway Endpoint (free)
- DynamoDB: Gateway Endpoint (free)
- Others: Interface Endpoints ($7/month each)

Cheaper than NAT Gateway ($33/month) if no actual internet needed
```

---

## CloudFormation Troubleshooting

### Issue: Stack Creation Failed, Rollback

**Investigation:**
```
1. Stack → Events tab
   - Find first failure event (scroll down)
   - Read error message carefully

Common errors:
- "Subnet subnet-xxx does not exist" → Typo in subnet ID
- "Security group sg-xxx does not exist" → Reference issue
- "IAM role cannot be assumed" → Trust policy wrong
- "Property validation failed" → Syntax error in template

2. Resource that failed:
   - Note resource type and logical ID
   - Check template section for that resource
   - Validate all properties
```

**Debug:**
```bash
# Validate template:
aws cloudformation validate-template --template-body file://template.yaml
# Shows syntax errors before creating stack

# Create with rollback disabled (for debugging):
aws cloudformation create-stack \
  --stack-name my-stack \
  --template-body file://template.yaml \
  --disable-rollback
# Failed resources remain (can inspect)

# View stack events:
aws cloudformation describe-stack-events --stack-name my-stack
```

**Common Fixes:**
```
- Incorrect reference: Use !Ref or !GetAtt correctly
- Circular dependency: Resource A depends on B, B depends on A
- Missing DependsOn: Resources created out of order
- Hardcoded ARNs: Use pseudo parameters (!Ref AWS::AccountId, !Ref AWS::Region)
```

---

## Cost Spike Investigation (Critical Skill)

### Scenario: AWS Bill Doubled

**Investigation Process:**

**Step 1: Identify What Increased (10 min)**
```
1. Cost Explorer → Monthly costs
2. Group by: Service
3. Compare this month vs last month
4. Identify top 3 increases

Example findings:
- EC2: $500 → $800 (+$300)
- S3: $100 → $600 (+$500) ← Biggest increase!
- Data Transfer: $50 → $200 (+$150)
```

**Step 2: Drill Down (15 min)**
```
S3 increased $500:

Group by: Usage type
- Requests: $2 → $2 (no change)
- Storage: $100 → $120 (+$20)
- Data Transfer OUT: $0 → $480 (+$480) ← FOUND IT!

Region: us-east-1
Time range: Spike started March 18

Conclusion: Massive data transfer from S3 starting March 18
```

**Step 3: Investigate Root Cause (20 min)**
```
Enable S3 Access Logs (if not already):
1. S3 → Bucket → Properties → Server access logging
2. Target bucket: logs-bucket

Analyze logs:
```bash
# Download logs for March 18-20:
aws s3 sync s3://logs-bucket/2026/03/18/ ./logs/

# Find top requested objects:
cat logs/* | awk '{print $8}' | sort | uniq -c | sort -rn | head -20

# Output:
# 50000000 mybucket/leaked-file.jpg  ← 50 MILLION requests!
# 1000 mybucket/logo.png
# 500 mybucket/index.html

# Find source IPs:
cat logs/* | grep leaked-file.jpg | awk '{print $5}' | sort | uniq -c | sort -rn
# Shows hundreds of different IPs (viral spread)
```

**Step 4: Stop the Bleed (5 min)**
```
1. Delete or restrict object:
   - Delete leaked-file.jpg immediately
   - Or change permissions to private
   
2. Enable S3 Block Public Access (if not enabled):
   - Account level + bucket level
   
3. Enable CloudFront if high traffic (cheaper than direct S3):
   - Edge caching reduces origin requests
```

**Step 5: Request Credit (optional)**
```
1. AWS Support → Create case
2. Type: Account and billing
3. Subject: Request for credit - unexpected data transfer
4. Explain: Misconfiguration, corrective actions taken, one-time incident
5. Provide: Timeline, root cause, prevention measures
6. Likely outcome: 50-100% credit (first time)
```

---

## Common Exam Troubleshooting Scenarios

### Scenario: Application Intermittently Slow

**Investigation Path:**
```
1. When is it slow?
   - Specific times? (daily pattern, traffic spike)
   - Random? (instance failures, hot partition)

2. What's slow?
   - API response time? → Check ALB metrics, Lambda duration
   - Database queries? → Check RDS CloudWatch, Performance Insights
   - External API calls? → Check X-Ray traces

3. Where's the bottleneck?
   - CPU? → Right-size or add capacity
   - Memory? → Increase instance memory or optimize
   - Disk I/O? → Upgrade to io2, add IOPS
   - Network? → Check bandwidth limits, use placement groups
   - Database? → Add read replicas, cache with ElastiCache

4. Solutions based on findings:
   - Traffic spike: Auto Scaling, CloudFront caching
   - Database slow: Read replicas, indexes, caching
   - Single AZ overloaded: Multi-AZ distribution
```

---

### Scenario: Sudden Security Alert from GuardDuty

**Finding:** UnauthorizedAccess:EC2/MaliciousIPCaller.Custom

**Response Procedure:**
```
1. Isolate immediately (5 min):
   - Change instance security group to deny-all
   - Or replace with isolation-SG (only SSH from bastion for forensics)
   
2. Snapshot for forensics (2 min):
   - Create EBS snapshot
   - Don't terminate (lose evidence!)
   
3. Investigate (30 min):
   - CloudTrail: What API calls from this instance?
   - VPC Flow Logs: What connections were made?
   - Instance: Check for malware, unauthorized processes
   
4. Containment (10 min):
   - Terminate compromised instance
   - Launch replacement from clean AMI
   - Rotate credentials (anything accessed by compromised instance)
   
5. Post-incident (ongoing):
   - How was it compromised? (vulnerable software, stolen credentials)
   - Update security groups (restrict access)
   - Patch management (Systems Manager Patch Manager)
   - Detection: Config rule for approved AMIs only
```

---

**TROUBLESHOOTING GUIDE COMPLETE**

Creating final comprehensive study guide...

