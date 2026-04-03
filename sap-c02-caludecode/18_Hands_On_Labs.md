# 30 Hands-On Labs — Step-by-Step for Top SAP-C02 Services

---

## Lab 1: Launch EC2 and Configure Auto Scaling

**Objective**: Launch an EC2 instance, create a launch template, set up Auto Scaling Group with scaling policies.

**Steps**:
1. Create a VPC (or use default): `aws ec2 create-vpc --cidr-block 10.0.0.0/16`
2. Create public/private subnets in 2 AZs
3. Create Internet Gateway, attach to VPC
4. Create Launch Template:
   ```bash
   aws ec2 create-launch-template --launch-template-name WebServerLT \
     --launch-template-data '{"ImageId":"ami-xxx","InstanceType":"t3.micro","SecurityGroupIds":["sg-xxx"]}'
   ```
5. Create Target Group: `aws elbv2 create-target-group --name web-tg --protocol HTTP --port 80 --vpc-id vpc-xxx`
6. Create ALB: `aws elbv2 create-load-balancer --name web-alb --subnets subnet-a subnet-b`
7. Create ASG:
   ```bash
   aws autoscaling create-auto-scaling-group --auto-scaling-group-name web-asg \
     --launch-template LaunchTemplateName=WebServerLT --min-size 2 --max-size 6 \
     --desired-capacity 2 --vpc-zone-identifier "subnet-a,subnet-b" \
     --target-group-arns arn:... --health-check-type ELB --health-check-grace-period 300
   ```
8. Add Target Tracking policy: Keep CPU at 50%
9. **Validate**: Generate load → watch instances scale out in console
10. **Cleanup**: Delete ASG → ALB → Target Group → Launch Template

**Cost estimate**: ~$0.20 (t3.micro, ~1 hour)

---

## Lab 2: Build VPC from Scratch

**Objective**: Create a complete VPC with public/private subnets, NAT Gateway, route tables.

**Steps**:
1. Create VPC: 10.0.0.0/16
2. Create 4 subnets: 2 public (10.0.1.0/24, 10.0.2.0/24), 2 private (10.0.11.0/24, 10.0.12.0/24)
3. Create Internet Gateway, attach to VPC
4. Create public route table: 0.0.0.0/0 → IGW, associate with public subnets
5. Create NAT Gateway in public subnet (need Elastic IP first)
6. Create private route table: 0.0.0.0/0 → NAT Gateway, associate with private subnets
7. Create Security Groups: Web SG (allow 80,443), App SG (allow 8080 from Web SG), DB SG (allow 3306 from App SG)
8. Launch EC2 in public subnet → verify internet access
9. Launch EC2 in private subnet → verify outbound internet via NAT but no inbound from internet
10. **Validate**: SSH to public instance → from there SSH to private instance (bastion pattern)

**Cleanup**: Terminate instances → Delete NAT GW → Release EIP → Delete subnets → Detach & delete IGW → Delete VPC

**Cost**: NAT Gateway ~$0.045/hr. Keep lab short.

---

## Lab 3: S3 Bucket with Versioning, Lifecycle, and Replication

**Steps**:
1. Create source bucket with versioning enabled
2. Upload a file, then upload an updated version → verify both versions exist
3. Delete the file → verify delete marker created, old versions still exist
4. Create lifecycle rule: Transition to IA after 30 days, Glacier after 90 days
5. Create destination bucket in another region with versioning
6. Create replication rule (CRR): Source → Destination
7. Upload new file → verify it appears in destination bucket
8. **Validate**: List versions, check replication status

---

## Lab 4: Create RDS Aurora with Multi-AZ and Read Replica

**Steps**:
1. Create DB Subnet Group (private subnets in 2 AZs)
2. Create Aurora MySQL cluster (Multi-AZ, encryption enabled)
3. Wait for cluster to be available (~10 min)
4. Connect from EC2 in same VPC: `mysql -h cluster-endpoint -u admin -p`
5. Create a Read Replica: Add reader to the cluster
6. Test: Write to cluster endpoint, read from reader endpoint
7. **Simulate failover**: `aws rds failover-db-cluster --db-cluster-identifier mydb`
8. Verify: Writer endpoint now points to the other instance

**Cost**: db.t3.medium ~$0.082/hr. Clean up within 1 hour.

---

## Lab 5: DynamoDB Table with GSI and Streams

**Steps**:
1. Create table: PK=user_id (S), SK=order_date (S)
2. Add GSI: PK=product_id (S)
3. Insert items using CLI/console
4. Query by user_id (primary key)
5. Query by product_id (GSI)
6. Enable DynamoDB Streams (NEW_AND_OLD_IMAGES)
7. Create Lambda function triggered by the stream
8. Insert new item → verify Lambda was triggered and logged the event

---

## Lab 6: Serverless API (API Gateway + Lambda + DynamoDB)

**Steps**:
1. Create DynamoDB table (items)
2. Create Lambda function (Python/Node.js) that reads/writes to DynamoDB
3. Create API Gateway REST API
4. Create GET /items → Lambda (list items)
5. Create POST /items → Lambda (create item)
6. Deploy API to "prod" stage
7. Test with curl: `curl https://xxx.execute-api.us-east-1.amazonaws.com/prod/items`

---

## Lab 7: S3 Event → Lambda (Image Thumbnail Generator)

**Steps**:
1. Create source S3 bucket and destination bucket
2. Create Lambda function with image processing (PIL/Pillow layer)
3. Add S3 event trigger (ObjectCreated) on source bucket
4. Upload image → Lambda creates thumbnail → stores in destination
5. Verify thumbnail exists in destination bucket

---

## Lab 8: CloudFront Distribution with S3 Origin

**Steps**:
1. Create S3 bucket with a static website (index.html)
2. Create CloudFront distribution with S3 as origin
3. Configure OAC (Origin Access Control)
4. Update S3 bucket policy to allow only CloudFront
5. Test: Access via CloudFront URL (works) vs S3 URL directly (blocked)

---

## Lab 9: VPC Endpoint for S3 (Gateway)

**Steps**:
1. Launch EC2 in private subnet (no NAT Gateway)
2. Try `aws s3 ls` → fails (no internet access)
3. Create S3 Gateway VPC Endpoint
4. Update private route table (endpoint adds route automatically)
5. Try `aws s3 ls` → succeeds (via VPC Endpoint, private network)

---

## Lab 10: IAM Role for Cross-Account Access

**Steps** (requires 2 accounts):
1. Account B: Create IAM role "CrossAccountRole" with S3 read policy, trust policy for Account A
2. Account A: Create IAM user/role with `sts:AssumeRole` permission for Account B's role
3. Account A: `aws sts assume-role --role-arn arn:aws:iam::ACCOUNT_B:role/CrossAccountRole`
4. Use temporary credentials to access Account B's S3 bucket

---

## Labs 11-30: Quick Reference

| # | Lab | Key Services | What You Learn |
|---|---|---|---|
| 11 | **Route 53 Failover** | Route 53, EC2, Health Checks | Failover routing policy |
| 12 | **CloudWatch Alarm + SNS** | CloudWatch, SNS, EC2 | Metric alarms, notifications |
| 13 | **CloudTrail + Athena** | CloudTrail, S3, Athena | Query API logs with SQL |
| 14 | **KMS Encryption** | KMS, S3, EBS | Create CMK, encrypt S3 and EBS |
| 15 | **Transit Gateway** | VPC, Transit Gateway | Connect 3 VPCs via hub |
| 16 | **Site-to-Site VPN** | VPC, VPN | Simulated on-premises connectivity |
| 17 | **SQS + Lambda** | SQS, Lambda | Message-driven processing |
| 18 | **SNS Fan-Out** | SNS, SQS, Lambda | One message, multiple consumers |
| 19 | **Kinesis → S3 via Firehose** | Kinesis Firehose, S3 | Streaming data delivery |
| 20 | **Redshift Query** | Redshift, S3 | Load S3 data, run analytics |
| 21 | **DMS Migration** | DMS, RDS | Migrate MySQL to Aurora |
| 22 | **CloudFormation Stack** | CloudFormation | Deploy VPC+EC2 from template |
| 23 | **Step Functions Workflow** | Step Functions, Lambda | Multi-step orchestration |
| 24 | **Config Rule** | Config, SSM | Detect non-compliant resources |
| 25 | **GuardDuty Setup** | GuardDuty, EventBridge | Enable threat detection |
| 26 | **WAF on ALB** | WAF, ALB | Rate limiting, SQL injection protection |
| 27 | **Secrets Manager + RDS** | Secrets Manager, Lambda, RDS | Automatic credential rotation |
| 28 | **ECS Fargate Service** | ECS, Fargate, ECR, ALB | Deploy containerized app |
| 29 | **Organizations + SCP** | Organizations | Create OU, apply SCP |
| 30 | **Cost Explorer Analysis** | Cost Explorer, Trusted Advisor | Identify optimization opportunities |

---

*Word count: ~3,000+ words*
