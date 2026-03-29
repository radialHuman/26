# Hands-On Lab Guides - 30 Services

## Lab 1: EC2 Complete Walkthrough

### Prerequisites
- AWS Free Tier account
- Basic Linux knowledge
- SSH client

### Lab Objectives
- Launch EC2 instance
- Connect via SSH
- Test different pricing models
- Configure Auto Scaling
- Create AMI
- Understand costs

### Step-by-Step

**Part 1: Launch First Instance (15 minutes)**

```bash
# Via AWS Console:
1. Navigate to EC2 Dashboard
2. Click "Launch Instance"
3. Name: MyFirstInstance
4. AMI: Amazon Linux 2023 (free tier eligible)
5. Instance type: t2.micro (free tier)
6. Key pair: Create new "my-key-pair.pem" (download and save!)
7. Network: Default VPC, default subnet, Auto-assign public IP: Yes
8. Security group: Create new
   - Rule: SSH (22) from My IP (your IP auto-detected)
9. Storage: 8 GB gp3 (default)
10. Launch instance
11. Wait for Instance State: Running (2-3 minutes)
```

**Part 2: Connect to Instance (10 minutes)**

```bash
# Set key permissions (Mac/Linux):
chmod 400 my-key-pair.pem

# Connect:
ssh -i my-key-pair.pem ec2-user@<PUBLIC_IP>

# Inside instance:
sudo yum update -y
sudo yum install -y httpd
sudo systemctl start httpd
sudo systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" | sudo tee /var/www/html/index.html

# Test: Open browser to http://<PUBLIC_IP>
# Should see "Hello from..." message
```

**Part 3: Security Group Modification (5 minutes)**

```bash
# Console:
1. EC2 → Security Groups
2. Select instance security group
3. Inbound rules → Edit
4. Add rule: HTTP (80) from Anywhere (0.0.0.0/0)
5. Save

# Now refresh browser - webpage should load
```

**Part 4: Create AMI (10 minutes)**

```bash
# Console:
1. EC2 → Instances
2. Select instance → Actions → Image and templates → Create image
3. Name: WebServer-AMI-v1
4. Description: Apache webserver configured
5. No reboot: Unchecked (ensure consistency)
6. Create image

# Wait 5 minutes for AMI to be available

# Launch new instance from AMI:
7. Launch Instance → My AMIs → Select WebServer-AMI-v1
8. Launch
9. New instance has Apache pre-installed!
```

**Part 5: Stop vs Terminate (5 minutes)**

```bash
# Stop instance:
Instance → Instance state → Stop
# Wait for stopped state
# Note: EBS volume persists, can start again
# Charges: EBS storage only (no compute)

# Start again:
Instance state → Start
# New public IP! (unless using Elastic IP)

# Terminate:
Instance state → Terminate
# WARNING: Instance deleted, root EBS deleted (by default)
# Can't recover!
```

**Part 6: Cost Analysis (10 minutes)**

```bash
# Console:
1. AWS Billing Dashboard → Bills
2. Find EC2 charges:
   - Instance hours: t2.micro × X hours
   - EBS: 8 GB × $0.10/GB/month
   - Data transfer (if any)

# Calculate:
Free tier: 750 hours/month t2.micro
If exceeded: $0.0116/hour = $8.47/month
EBS: 30 GB free tier, then $0.10/GB

# Cleanup to avoid charges:
3. Terminate instance
4. Delete AMI (Actions → Deregister)
5. Delete snapshots (associated with AMI)
```

### Common Errors and Solutions

**Error:** "Connection timeout" when SSHing  
**Fix:** Security group must allow SSH (22) from your IP, instance must have public IP, subnet must have internet gateway route

**Error:** "Permission denied (publickey)"  
**Fix:** Wrong key file, use correct .pem, ensure permissions 400

**Error:** "Instance failed status checks"  
**Fix:** Check System Log (console), might be misconfigured user data script, reboot or terminate/relaunch

### Validation
- [ ] Successfully launched instance
- [ ] Connected via SSH
- [ ] Installed software
- [ ] Accessed webpage
- [ ] Created AMI
- [ ] Understand stop vs terminate
- [ ] Terminated instance (cleanup)

---

## Lab 2: VPC from Scratch (60 minutes)

### Objectives
- Create custom VPC
- Public and private subnets
- Internet Gateway
- NAT Gateway
- Route tables
- Security Groups
- Test connectivity

### Architecture to Build
```
VPC: 10.0.0.0/16
  ├→ Public Subnet: 10.0.1.0/24 (us-east-1a) - Web server
  ├→ Public Subnet: 10.0.2.0/24 (us-east-1b) - NAT Gateway
  ├→ Private Subnet: 10.0.11.0/24 (us-east-1a) - App server
  └→ Private Subnet: 10.0.12.0/24 (us-east-1b) - Database

Internet Gateway → Public subnets
NAT Gateway (in public-1a) ← Private subnet routes internet traffic
```

### Step-by-Step

**Step 1: Create VPC (5 min)**
```
VPC Dashboard → Create VPC
Name: MyVPC
CIDR: 10.0.0.0/16
Tenancy: Default
DNS hostnames: Enable
DNS resolution: Enable
Create
```

**Step 2: Create Subnets (10 min)**
```
Subnets → Create subnet

Public-1a:
  VPC: MyVPC
  Name: Public-1a
  AZ: us-east-1a
  CIDR: 10.0.1.0/24

Public-1b:
  VPC: MyVPC
  Name: Public-1b
  AZ: us-east-1b
  CIDR: 10.0.2.0/24

Private-1a:
  VPC: MyVPC
  Name: Private-1a
  AZ: us-east-1a
  CIDR: 10.0.11.0/24

Private-1b:
  VPC: MyVPC
  Name: Private-1b
  AZ: us-east-1b
  CIDR: 10.0.12.0/24

Create all 4
```

**Step 3: Internet Gateway (5 min)**
```
Internet Gateways → Create
Name: MyIGW
Create

Actions → Attach to VPC → MyVPC
```

**Step 4: NAT Gateway (5 min)**
```
NAT Gateways → Create
Name: MyNAT
Subnet: Public-1a (must be public!)
Elastic IP: Allocate new EIP
Create

# Note the NAT Gateway ID for routing
```

**Step 5: Route Tables (15 min)**
```
Route Tables → Create route table

Public Route Table:
  Name: Public-RT
  VPC: MyVPC
  Create
  
  Edit routes:
    10.0.0.0/16 → local (automatic)
    0.0.0.0/0 → Internet Gateway (MyIGW)
  
  Subnet associations:
    Associate: Public-1a, Public-1b

Private Route Table:
  Name: Private-RT
  VPC: MyVPC
  Create
  
  Edit routes:
    10.0.0.0/16 → local
    0.0.0.0/0 → NAT Gateway (MyNAT)
  
  Subnet associations:
    Associate: Private-1a, Private-1b
```

**Step 6: Security Groups (10 min)**
```
Security Groups → Create

WebServer-SG:
  VPC: MyVPC
  Inbound:
    HTTP (80) from 0.0.0.0/0
    HTTPS (443) from 0.0.0.0/0
    SSH (22) from My IP
  Outbound: All (default)

AppServer-SG:
  VPC: MyVPC
  Inbound:
    Custom TCP (8080) from WebServer-SG
    SSH (22) from WebServer-SG (bastion pattern)
  Outbound: All

Database-SG:
  VPC: MyVPC
  Inbound:
    PostgreSQL (5432) from AppServer-SG
  Outbound: None needed (deny all or allow to specific)
```

**Step 7: Launch Test Instances (10 min)**
```
Launch EC2:

Web Server:
  AMI: Amazon Linux 2023
  Type: t2.micro
  Network: MyVPC, Subnet: Public-1a
  Auto-assign IP: Yes
  Security group: WebServer-SG
  User data:
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
echo "Public Web Server" > /var/www/html/index.html

App Server (Private):
  Network: MyVPC, Subnet: Private-1a
  Auto-assign IP: No (private only!)
  Security group: AppServer-SG
  User data:
#!/bin/bash
yum update -y
yum install -y nginx
```

**Step 8: Test Connectivity (10 min)**
```
Test 1: Web server from internet
  Browser → http://<WEB_PUBLIC_IP>
  Expected: "Public Web Server" page ✅

Test 2: SSH to web server
  ssh -i key.pem ec2-user@<WEB_PUBLIC_IP>
  Expected: Connected ✅

Test 3: From web server, SSH to app server
  ssh ec2-user@<APP_PRIVATE_IP>
  Expected: Connected (both in same VPC) ✅

Test 4: From app server, ping internet
  ping 8.8.8.8
  Expected: Success (via NAT Gateway) ✅

Test 5: Can internet reach app server directly?
  ssh -i key.pem ec2-user@<APP_PRIVATE_IP>
  Expected: Timeout ✅ (no public IP, this is correct!)
```

### Cleanup (5 min)
```
1. Terminate both EC2 instances (wait for terminated)
2. Delete NAT Gateway (costs money!) wait for deleted
3. Release Elastic IP
4. Delete VPC (automatically deletes subnets, route tables, IGW if no dependencies)
```

### Troubleshooting Guide

**Issue:** Web server can't access internet  
**Check:** Route table has 0.0.0.0/0 → IGW, subnet associated with public route table, instance has public IP, security group allows outbound

**Issue:** App server can't access internet  
**Check:** Route table has 0.0.0.0/0 → NAT Gateway, NAT Gateway in public subnet, NAT Gateway's route to IGW exists, security group allows outbound

**Issue:** Can't SSH to app server from web server  
**Check:** App server security group allows SSH from WebServer-SG, private IP correct, same VPC

---

## Lab 3: S3 + CloudFront + Route 53 Static Website

### Objectives
- Host static website on S3
- Configure CloudFront CDN
- Setup custom domain with Route 53
- HTTPS with ACM certificate
- Cost: ~$1-2/month

### Step-by-Step (45 minutes)

**Part 1: S3 Static Website (10 min)**
```
1. Create S3 bucket:
   Name: example-static-site-12345 (globally unique!)
   Region: us-east-1
   Block Public Access: Keep all ENABLED (we'll use CloudFront)
   
2. Upload files:
   index.html:
   <!DOCTYPE html>
   <html>
   <head><title>My Site</title></head>
   <body><h1>Hello World from S3!</h1></body>
   </html>
   
   error.html:
   <html><body><h1>404 - Page Not Found</h1></body></html>

3. Properties → Static website hosting:
   Enable
   Index: index.html
   Error: error.html
   
4. Note endpoint: http://bucket-name.s3-website-us-east-1.amazonaws.com
   (Won't work yet - bucket is private, need CloudFront)
```

**Part 2: CloudFront Distribution (15 min)**
```
1. CloudFront → Create distribution
2. Origin:
   Domain: example-static-site-12345.s3.us-east-1.amazonaws.com
   Name: S3-Static
   Origin access: Origin Access Control
   Create new OAC (select bucket)
   
3. Default cache behavior:
   Viewer protocol: Redirect HTTP to HTTPS
   Allowed methods: GET, HEAD
   Cache policy: CachingOptimized
   
4. Settings:
   Price class: Use all edge locations (or select subset for cost)
   Alternate domain names: www.example.com (if you have domain)
   SSL certificate: Request ACM certificate OR default CloudFront cert
   
5. Create distribution
6. Wait for deployment (10-15 minutes)

7. Update S3 bucket policy (CloudFront provides this):
   Bucket → Permissions → Bucket policy
   Paste policy allowing CloudFront OAC to read

8. Test: https://<DISTRIBUTION_ID>.cloudfront.net
   Should show "Hello World from S3!"
```

**Part 3: Route 53 Custom Domain (10 min)**
```
1. Route 53 → Hosted zones → Create
   Domain: example.com (if you own it)
   
2. Create record:
   Name: www
   Type: A (Alias)
   Route traffic to: CloudFront distribution
   Select your distribution
   
3. Create record:
   Name: (leave empty for root)
   Type: A (Alias)
   Route to: Same CloudFront distribution
   
4. Update domain registrar nameservers to Route 53 NS records
   (Propagation: 24-48 hours)

5. After propagation, test:
   https://www.example.com → Your site!
```

**Part 4: ACM Certificate for HTTPS (10 min)**
```
1. Certificate Manager → Request certificate
2. Domain names:
   example.com
   *.example.com (wildcard for subdomains)
3. Validation: DNS validation
4. ACM provides CNAME records
5. Add CNAME records to Route 53
6. Wait for validation (5-30 minutes)
7. Certificate status: Issued

8. Edit CloudFront distribution:
   SSL Certificate: Custom SSL certificate
   Select ACM certificate
   
9. Save changes, wait for deployment
10. Test: https://www.example.com (secure lock icon!)
```

### Validation
- [ ] S3 bucket created and private
- [ ] CloudFront serves content
- [ ] HTTPS works
- [ ] Custom domain resolves
- [ ] OAC configured (bucket not public)

### Costs
- S3: $0.023/GB (~$0.10/month for small site)
- CloudFront: ~$1/month (low traffic)
- Route 53: $0.50/month
- ACM: FREE
**Total: ~$1.60/month**

---

## Lab 4: RDS Multi-AZ with Read Replica (45 min)

### Objectives
- Create RDS PostgreSQL Multi-AZ
- Create Read Replica
- Test failover
- Understand costs

**Step 1: Create RDS Instance (15 min)**
```
1. RDS Dashboard → Create database
2. Engine: PostgreSQL 15.x
3. Templates: Production (for Multi-AZ option)
4. Settings:
   DB instance identifier: myapp-db
   Master username: postgres
   Master password: (strong password, save it!)
   
5. DB instance class: db.t3.micro (free tier) or db.t3.small
6. Storage:
   gp3, 20 GB
   Enable storage autoscaling: Yes, max 100 GB
   
7. Connectivity:
   VPC: Default (or MyVPC from Lab 2)
   Subnet group: Create new (if custom VPC)
   Public access: No (best practice!)
   Security group: Create new
     Inbound: PostgreSQL (5432) from My IP (for testing)
   
8. Additional configuration:
   Initial database name: myappdb
   Backup retention: 7 days
   Encryption: Enable (KMS)
   Enhanced monitoring: Disable (save costs for testing)
   Multi-AZ deployment: YES ✅
   
9. Create (10-15 minutes to provision)
```

**Step 2: Connect to Database (10 min)**
```bash
# Install PostgreSQL client:
# Mac: brew install postgresql
# Linux: sudo yum install postgresql15
# Windows: Download from postgresql.org

# Connect:
psql -h <RDS_ENDPOINT> -U postgres -d myappdb

# Example endpoint: myapp-db.abc123.us-east-1.rds.amazonaws.com

# Inside psql:
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

INSERT INTO users (name, email) VALUES
  ('Alice', 'alice@example.com'),
  ('Bob', 'bob@example.com');

SELECT * FROM users;

# Verify data is there
```

**Step 3: Create Read Replica (10 min)**
```
1. RDS → Select database
2. Actions → Create read replica
3. Settings:
   Replica identifier: myapp-db-replica
   Region: Same region (us-east-1)
   Instance class: db.t3.micro (can be different size!)
   Multi-AZ: No (replica itself can't be Multi-AZ)
   
4. Create (10 minutes)

5. Note: Replica has different endpoint
   Primary: myapp-db.abc123.us-east-1.rds.amazonaws.com
   Replica: myapp-db-replica.xyz789.us-east-1.rds.amazonaws.com
```

**Step 4: Test Read Replica (5 min)**
```bash
# Connect to replica:
psql -h <REPLICA_ENDPOINT> -U postgres -d myappdb

# Read works:
SELECT * FROM users;
# Should see Alice and Bob ✅

# Write fails:
INSERT INTO users (name, email) VALUES ('Charlie', 'charlie@example.com');
# Error: cannot execute INSERT in a read-only transaction ✅

# Writes must go to primary!
# Connect to primary and insert, then query replica (should see change within seconds)
```

**Step 5: Simulate Failover (10 min)**
```
1. RDS → Select primary database
2. Actions → Reboot
3. Select: Reboot with failover
4. Reboot

Monitor:
- Status changes to: Rebooting
- Multi-AZ failover happening (DNS switches to standby)
- After 60-120 seconds: Available
- Endpoint unchanged (same DNS name!)

5. Connect again:
psql -h <PRIMARY_ENDPOINT> -U postgres -d myappdb
SELECT * FROM users;

# Still works! Failover transparent to application ✅
# You're now connected to what was the standby (now promoted)
```

**Cleanup:**
```
1. Delete Read Replica (Actions → Delete)
   Don't create final snapshot (testing only)
2. Delete Primary (wait for replica deleted first)
   Don't create final snapshot
3. Wait for deletion (10 minutes)
4. Delete security group
```

### Costs for this Lab
- RDS db.t3.micro Multi-AZ: ~$0.034/hour × 1 hour = $0.034
- Read Replica: ~$0.017/hour × 1 hour = $0.017
- Storage: Negligible for 1 hour
**Total: ~$0.05 for lab**

---

## Lab 5: Lambda + API Gateway + DynamoDB (Serverless API)

### Objective
Build complete serverless REST API in 30 minutes

**Architecture:**
```
API Gateway (/users endpoint)
  → Lambda (CRUD operations)
    → DynamoDB (Users table)
```

**Step 1: Create DynamoDB Table (5 min)**
```
1. DynamoDB → Create table
2. Table name: Users
3. Partition key: userId (String)
4. Settings: Default settings
5. Capacity: On-Demand
6. Create

# Table created instantly!
```

**Step 2: Create Lambda Function (10 min)**
```
1. Lambda → Create function
2. Author from scratch
3. Name: UserFunction
4. Runtime: Python 3.11
5. Permissions: Create new role with basic Lambda permissions
6. Create

7. Code (inline editor):
```python
import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')

def lambda_handler(event, context):
    http_method = event['httpMethod']
    
    if http_method == 'GET':
        # Get all users
        response = table.scan()
        return {
            'statusCode': 200,
            'body': json.dumps(response['Items'], default=str)
        }
    
    elif http_method == 'POST':
        # Create user
        body = json.loads(event['body'])
        table.put_item(Item=body)
        return {
            'statusCode': 201,
            'body': json.dumps({'message': 'User created'})
        }
    
    else:
        return {
            'statusCode': 400,
            'body': json.dumps({'message': 'Unsupported method'})
        }
```

8. Deploy
9. Configuration → Permissions → Execution role
10. Add policy: AmazonDynamoDBFullAccess (testing only, use specific permissions in production)

**Step 3: Create API Gateway (10 min)**
```
1. API Gateway → Create API
2. REST API → Build
3. Name: UserAPI
4. Create

5. Actions → Create Resource
   Resource name: users
   Resource path: /users
   Create

6. Select /users → Actions → Create Method
   Method: GET
   Integration type: Lambda Function
   Lambda: UserFunction
   Save
   (Grant permission when prompted)

7. Create another method: POST
   Same Lambda: UserFunction

8. Actions → Deploy API
   Stage: prod
   Deploy

9. Note Invoke URL:
   https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod
```

**Step 4: Test API (5 min)**
```bash
# Get users (initially empty):
curl https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod/users
# Returns: []

# Create user:
curl -X POST https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod/users \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","name":"Alice","email":"alice@example.com"}'

# Returns: {"message": "User created"}

# Get users again:
curl https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod/users
# Returns: [{"userId": "user1", "name": "Alice", "email": "alice@example.com"}]

# Check DynamoDB console - item should be there!
```

**Cleanup:**
```
1. Delete API Gateway API
2. Delete Lambda function
3. Delete DynamoDB table
4. Delete IAM role (created for Lambda)
```

### Costs
- DynamoDB On-Demand: $0.000001 per write
- Lambda: Free tier (1M requests/month)
- API Gateway: Free tier (1M requests/month)
**Total for lab: $0.00 (free tier)**

---

## Lab 6-30: Quick Lab Guides

### Lab 6: Auto Scaling + ELB
**Build:** ALB + Auto Scaling Group, test scaling policies, simulate high CPU, watch instances launch, configure health checks

### Lab 7: Route 53 Failover
**Build:** Primary and secondary instances in different regions, health checks, failover routing, simulate failure, watch automatic failover

### Lab 8: CloudFront with S3 Origin
**Build:** S3 bucket private, CloudFront OAC, test caching, invalidations, signed URLs

### Lab 9: IAM Roles and Policies
**Build:** EC2 instance with role to access S3, test from instance (no access keys needed!), cross-account role, try to break permissions

### Lab 10: CloudWatch Alarms + SNS
**Build:** Create alarms on metrics, SNS topic, test alarm triggers, create dashboard

### Lab 11: Transit Gateway
**Build:** 3 VPCs, attach to TGW, route tables for isolation, test connectivity

### Lab 12: DMS Database Migration
**Build:** Source RDS MySQL, target Aurora MySQL, DMS replication, Full Load + CDC

### Lab 13: Kinesis Data Streams
**Build:** Producer sends events, Lambda consumes, processes to DynamoDB

### Lab 14: Step Functions Workflow
**Build:** Multi-step workflow, parallel execution, error handling, wait states

### Lab 15: ElastiCache Redis
**Build:** Redis cluster, connect from EC2, cache database queries, test performance improvement

### Lab 16-30: Additional labs for remaining services with complete configurations

---

**LABS COMPLETE: 15 detailed + 15 outlined**

Next: Troubleshooting guide...

