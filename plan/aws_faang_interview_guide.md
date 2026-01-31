# AWS Backend Learning Plan - FAANG Interview Ready (Local Development)

This comprehensive guide covers AWS services and architecture patterns essential for FAANG backend engineering interviews. All hands-on practice uses LocalStack - **no AWS account required**.

---

## 1. Environment Setup

### Core AWS Emulation Tools
- **LocalStack**: Simulates 80+ AWS services locally
  ```bash
  docker pull localstack/localstack
  ```
- **AWS CLI**: Official command-line interface ([Download](https://aws.amazon.com/cli/))
- **AWS SAM CLI**: For serverless development ([Install](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
- **Terraform**: Infrastructure as Code ([Download](https://developer.hashicorp.com/terraform/downloads))
- **MinIO**: S3-compatible storage (alternative)
  ```bash
  docker pull minio/minio
  ```
- **DynamoDB Local**: Official local DynamoDB
  ```bash
  docker pull amazon/dynamodb-local
  ```

### Supporting Tools (from Local Plan)
- Docker Desktop, Git, VS Code, Python, Go
- PostgreSQL, MongoDB, Redis, Kafka
- Prometheus, Grafana, Jaeger

---

## 2. AWS Services Deep Dive (12-Week Plan)

### Weeks 1-2: Core Services

#### **S3 (Simple Storage Service)**
**Theory:**
- Bucket policies, versioning, lifecycle policies
- Storage classes (Standard, IA, Glacier, Intelligent-Tiering)
- Presigned URLs, multipart uploads
- Cross-region replication, S3 Select
- Event notifications, performance optimization

**LocalStack Practice:**
```bash
# Create bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://my-bucket

# Upload with metadata
aws --endpoint-url=http://localhost:4566 s3 cp file.txt s3://my-bucket/ \
  --metadata key1=value1

# Generate presigned URL
aws --endpoint-url=http://localhost:4566 s3 presign s3://my-bucket/file.txt --expires-in 3600

# Set lifecycle policy
aws --endpoint-url=http://localhost:4566 s3api put-bucket-lifecycle-configuration \
  --bucket my-bucket --lifecycle-configuration file://lifecycle.json
```

**Exercises:**
1. Build file upload API with presigned URLs
2. Implement S3 event → Lambda trigger
3. Configure lifecycle policies for cost optimization
4. Practice multipart upload for large files

**Interview Questions:**
- How does S3 ensure data durability (99.999999999%)?
- When to use different storage classes?
- How to optimize S3 performance for high throughput?
- S3 consistency model?

---

#### **Lambda (Serverless Computing)**
**Theory:**
- Event-driven architecture, execution model
- Cold starts and warm starts optimization
- Execution context reuse
- Concurrency (reserved, provisioned)
- Layers, extensions, VPC configuration
- Error handling, retries, DLQ
- Cost optimization techniques

**SAM CLI Practice:**
```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: app.handler
      Runtime: python3.9
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /items
            Method: get
      Environment:
        Variables:
          TABLE_NAME: !Ref MyTable
          
  MyTable:
    Type: AWS::Serverless::SimpleTable
```

```bash
sam build
sam local invoke
sam local start-api
samlocal deploy  # Deploy to LocalStack
```

**Exercises:**
1. Create API Gateway + Lambda + DynamoDB CRUD
2. Implement S3 upload → Lambda → process → DynamoDB
3. Add Lambda layers for shared dependencies
4. Optimize cold start (reduce package size, provisioned concurrency)
5. Implement error handling with DLQ

**Interview Questions:**
- How to minimize Lambda cold starts?
- Explain Lambda execution context and reuse
- When to use provisioned concurrency?
- Lambda vs EC2 vs Fargate - decision criteria?
- How Lambda scales under load?

---

#### **DynamoDB (NoSQL Database)**
**Theory:**
- Partition key and sort key design
- Global Secondary Indexes (GSI), Local Secondary Indexes (LSI)
- Single-table design patterns
- DynamoDB Streams for change data capture
- On-demand vs provisioned capacity
- Transactions (ACID)
- DAX (DynamoDB Accelerator)
- Hot partition avoidance

**LocalStack Practice:**
```bash
# Create table
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name Orders \
  --attribute-definitions \
    AttributeName=customerId,AttributeType=S \
    AttributeName=orderId,AttributeType=S \
  --key-schema \
    AttributeName=customerId,KeyType=HASH \
    AttributeName=orderId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Create GSI
aws --endpoint-url=http://localhost:4566 dynamodb update-table \
  --table-name Orders \
  --attribute-definitions AttributeName=status,AttributeType=S \
  --global-secondary-index-updates \
    "[{\"Create\":{\"IndexName\":\"StatusIndex\",\"KeySchema\":[{\"AttributeName\":\"status\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}}]"

# Put item
aws --endpoint-url=http://localhost:4566 dynamodb put-item \
  --table-name Orders \
  --item file://item.json

# Query with GSI
aws --endpoint-url=http://localhost:4566 dynamodb query \
  --table-name Orders \
  --index-name StatusIndex \
  --key-condition-expression "status = :s" \
  --expression-attribute-values '{":s":{"S":"pending"}}'
```

**Exercises:**
1. Design single-table schema for e-commerce app
2. Implement GSI for multiple access patterns
3. Use DynamoDB Streams → Lambda for event processing
4. Practice efficient queries (avoid scans)
5. Handle hot partitions with composite keys

**Interview Questions:**
- How to design partition key to avoid hot partitions?
- Single-table design vs multi-table - trade-offs?
- GSI vs LSI - when to use each?
- How DynamoDB achieves scalability?
- Eventual consistency vs strong consistency?

---

### Weeks 3-4: Networking & Compute

#### **VPC (Virtual Private Cloud)**
**Theory:**
- CIDR blocks, subnets (public/private)
- Route tables, Internet Gateway, NAT Gateway
- Security Groups (stateful) vs NACLs (stateless)
- VPC Peering, Transit Gateway, PrivateLink
- VPC Endpoints (Gateway, Interface)
- VPN, Direct Connect
- VPC Flow Logs

**Docker Network Simulation:**
```bash
# Create isolated networks (VPC simulation)
docker network create --subnet=10.0.1.0/24 public-subnet
docker network create --subnet=10.0.2.0/24 private-subnet

# Run containers in different subnets
docker run --network public-subnet --name web nginx
docker run --network private-subnet --name app myapp
```

**Exercises:**
1. Design 3-tier VPC architecture (web, app, db)
2. Configure routing for public/private subnets
3. Implement security groups for each tier
4. Design multi-region VPC with peering
5. Plan VPC for microservices (isolated subnets per service)

**Interview Questions:**
- Security Group vs NACL - differences?
- How to design VPC for high availability?
- Public vs private subnet - routing differences?
- When to use VPC peering vs Transit Gateway?
- How to secure database in private subnet?

---

#### **EC2 & Auto Scaling**
**Theory:**
- Instance types (T, M, C, R, I, G families)
- AMIs, user data, instance metadata
- Auto Scaling Groups, launch templates
- Scaling policies (target tracking, step, scheduled)
- Health checks, warm-up period
- Placement groups (cluster, partition, spread)

**Docker Simulation:**
```yaml
# docker-compose.yml (EC2 + Auto Scaling simulation)
version: '3.8'
services:
  web:
    image: nginx
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

**Exercises:**
1. Simulate auto-scaling with Docker Compose
2. Implement health checks
3. Practice rolling updates
4. Design for high availability across AZs

**Interview Questions:**
- When to use EC2 vs Lambda vs Fargate?
- How Auto Scaling decides to scale?
- Different instance types - use cases?
- Spot instances vs On-Demand vs Reserved?

---

#### **Load Balancers**
**Theory:**
- ALB (Application Load Balancer - Layer 7)
  - Path-based routing, host-based routing
  - Target groups, health checks
  - Sticky sessions, WebSocket support
- NLB (Network Load Balancer - Layer 4)
  - Ultra-low latency, static IP
  - TCP/UDP load balancing
- Cross-zone load balancing

**nginx Simulation:**
```nginx
# nginx.conf
upstream backend {
    least_conn;
    server app1:8080 max_fails=3 fail_timeout=30s;
    server app2:8080 max_fails=3 fail_timeout=30s;
    server app3:8080 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    
    location /api/ {
        proxy_pass http://backend;
        proxy_next_upstream error timeout http_502 http_503 http_504;
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
    }
}
```

**Exercises:**
1. Configure nginx as ALB simulation
2. Implement path-based routing
3. Add health checks
4. Practice sticky sessions

**Interview Questions:**
- ALB vs NLB - when to use each?
- How does ALB achieve high availability?
- Load balancing algorithms?
- How to handle WebSocket connections?

---

### Weeks 5-6: Databases & Caching

#### **RDS (Relational Database Service)**
**Theory:**
- Multi-AZ deployments (synchronous replication)
- Read replicas (asynchronous replication)
- Automated backups, snapshots, point-in-time recovery
- Parameter groups, option groups
- Performance Insights, Enhanced Monitoring
- Failover process

**PostgreSQL Docker Simulation:**
```bash
# Master-slave replication setup
docker run --name postgres-master -e POSTGRES_PASSWORD=pass -d postgres
docker run --name postgres-replica -e POSTGRES_PASSWORD=pass -d postgres

# Configure replication (simplified)
# In production, use streaming replication
```

**Exercises:**
1. Set up master-slave replication
2. Practice failover scenarios
3. Implement connection pooling
4. Optimize slow queries
5. Configure automated backups

**Interview Questions:**
- Multi-AZ vs Read Replicas - differences?
- How RDS handles failover?
- When to use RDS vs DynamoDB?
- How to scale RDS vertically and horizontally?

---

#### **ElastiCache (Redis/Memcached)**
**Theory:**
- Redis vs Memcached comparison
- Redis cluster mode, replication
- Caching strategies (cache-aside, write-through, write-back)
- Cache eviction policies (LRU, LFU)
- Redis data structures (strings, hashes, lists, sets, sorted sets)
- Pub/sub, Redis Streams

**Redis Docker Practice:**
```bash
# Start Redis
docker run --name redis -p 6379:6379 -d redis

# Python caching example
import redis
r = redis.Redis(host='localhost', port=6379)

def get_user(user_id):
    # Cache-aside pattern
    cached = r.get(f'user:{user_id}')
    if cached:
        return json.loads(cached)
    
    user = db.query(user_id)  # DB query
    r.setex(f'user:{user_id}', 3600, json.dumps(user))  # Cache for 1 hour
    return user
```

**Exercises:**
1. Implement cache-aside pattern
2. Use Redis for session management
3. Build real-time leaderboard (sorted sets)
4. Implement rate limiting with Redis
5. Practice cache invalidation strategies

**Interview Questions:**
- Redis vs Memcached - when to use each?
- Caching strategies - pros and cons?
- How to handle cache stampede?
- Cache eviction policies?
- How to ensure cache consistency?

---

### Weeks 7-8: Messaging & Event-Driven

#### **SQS (Simple Queue Service)**
**Theory:**
- Standard queues (at-least-once, best-effort ordering)
- FIFO queues (exactly-once, strict ordering)
- Visibility timeout, message retention
- Dead Letter Queues (DLQ)
- Long polling vs short polling
- Message deduplication, content-based deduplication

**LocalStack Practice:**
```bash
# Create FIFO queue
aws --endpoint-url=http://localhost:4566 sqs create-queue \
  --queue-name orders.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=true

# Send message
aws --endpoint-url=http://localhost:4566 sqs send-message \
  --queue-url http://localhost:4566/000000000000/orders.fifo \
  --message-body "Order 123" \
  --message-group-id "order-group-1" \
  --message-deduplication-id "order-123"

# Receive message
aws --endpoint-url=http://localhost:4566 sqs receive-message \
  --queue-url http://localhost:4566/000000000000/orders.fifo \
  --max-number-of-messages 10 \
  --wait-time-seconds 20  # Long polling

# Delete message
aws --endpoint-url=http://localhost:4566 sqs delete-message \
  --queue-url http://localhost:4566/000000000000/orders.fifo \
  --receipt-handle <receipt-handle>
```

**Exercises:**
1. Implement producer-consumer with SQS
2. Configure DLQ for failed messages
3. Build order processing system (FIFO queue)
4. Handle idempotency with deduplication
5. Implement retry logic with exponential backoff

**Interview Questions:**
- Standard vs FIFO queue - trade-offs?
- How SQS ensures at-least-once delivery?
- Visibility timeout - purpose and configuration?
- How to handle poison messages?
- SQS vs Kinesis - when to use each?

---

#### **SNS (Simple Notification Service)**
**Theory:**
- Topics and subscriptions
- Fanout pattern (SNS → multiple SQS)
- Message filtering
- Delivery policies, retry logic
- Mobile push, email, SMS

**LocalStack Practice:**
```bash
# Create topic
aws --endpoint-url=http://localhost:4566 sns create-topic --name orders

# Subscribe SQS queue
aws --endpoint-url=http://localhost:4566 sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:000000000000:orders \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:us-east-1:000000000000:inventory

# Publish with attributes
aws --endpoint-url=http://localhost:4566 sns publish \
  --topic-arn arn:aws:sns:us-east-1:000000000000:orders \
  --message "New order" \
  --message-attributes '{"orderType":{"DataType":"String","StringValue":"premium"}}'

# Subscription filter policy
aws --endpoint-url=http://localhost:4566 sns set-subscription-attributes \
  --subscription-arn <sub-arn> \
  --attribute-name FilterPolicy \
  --attribute-value '{"orderType":["premium"]}'
```

**Exercises:**
1. Implement SNS + SQS fanout for microservices
2. Use message filtering for selective delivery
3. Build notification system (email, SMS simulation)
4. Handle failed deliveries with DLQ

**Interview Questions:**
- SNS vs SQS - use cases?
- How SNS achieves fanout?
- Message filtering - benefits?
- How to ensure message delivery?

---

#### **Kinesis (Data Streaming)**
**Theory:**
- Kinesis Data Streams (real-time)
- Shards, partition keys, sequence numbers
- Enhanced fan-out, KCL (Kinesis Client Library)
- Kinesis Data Firehose (ETL to S3, Redshift)
- Kinesis Data Analytics (stream processing)

**Kafka as Kinesis Equivalent:**
```python
from kafka import KafkaProducer, KafkaConsumer

# Producer (Kinesis PutRecord equivalent)
producer = KafkaProducer(bootstrap_servers='localhost:9092')
producer.send('orders', b'{"order_id": 123}')

# Consumer (Kinesis GetRecords equivalent)
consumer = KafkaConsumer('orders', bootstrap_servers='localhost:9092')
for message in consumer:
    process(message.value)
```

**Exercises:**
1. Build real-time analytics pipeline
2. Implement stream processing
3. Practice resharding strategies
4. Handle consumer failures

**Interview Questions:**
- Kinesis vs SQS - when to use?
- How Kinesis achieves ordering?
- Shard capacity and scaling?
- Enhanced fan-out vs polling?

---

### Weeks 9-10: Security & IAM

#### **IAM (Identity and Access Management)**
**Theory:**
- Principals: Users, Groups, Roles
- Policies: Identity-based, Resource-based, Permission boundaries
- Policy evaluation logic (explicit deny > explicit allow > implicit deny)
- Cross-account access (AssumeRole)
- STS (Security Token Service)
- IAM best practices (least privilege, MFA, rotate credentials)

**LocalStack Practice:**
```bash
# Create user
aws --endpoint-url=http://localhost:4566 iam create-user --user-name developer

# Create policy
cat > policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::my-bucket/*"
  }]
}
EOF

aws --endpoint-url=http://localhost:4566 iam create-policy \
  --policy-name S3ReadWrite \
  --policy-document file://policy.json

# Attach policy
aws --endpoint-url=http://localhost:4566 iam attach-user-policy \
  --user-name developer \
  --policy-arn arn:aws:iam::000000000000:policy/S3ReadWrite

# Create role for Lambda
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

aws --endpoint-url=http://localhost:4566 iam create-role \
  --role-name LambdaExecutionRole \
  --assume-role-policy-document file://trust-policy.json
```

**Exercises:**
1. Design IAM policies for least privilege
2. Implement cross-account access
3. Create service roles (Lambda, EC2)
4. Debug policy evaluation issues
5. Set up MFA simulation

**Interview Questions:**
- IAM policy evaluation order?
- Resource-based vs identity-based policies?
- How to implement cross-account access?
- IAM roles vs users - when to use?
- What is privilege escalation and how to prevent?

---

#### **KMS & Secrets Manager**
**Theory:**
- Customer Master Keys (CMK): AWS managed vs customer managed
- Data keys, envelope encryption
- Key rotation, key policies
- Secrets Manager: automatic rotation
- Parameter Store vs Secrets Manager

**LocalStack Practice:**
```bash
# Create CMK
aws --endpoint-url=http://localhost:4566 kms create-key \
  --description "My encryption key"

# Encrypt data
aws --endpoint-url=http://localhost:4566 kms encrypt \
  --key-id <key-id> \
  --plaintext "sensitive data" \
  --output text --query CiphertextBlob

# Store secret
aws --endpoint-url=http://localhost:4566 secretsmanager create-secret \
  --name db-password \
  --secret-string "mypassword123"

# Retrieve secret
aws --endpoint-url=http://localhost:4566 secretsmanager get-secret-value \
  --secret-id db-password
```

**Exercises:**
1. Implement encryption at rest
2. Practice key rotation
3. Access secrets from Lambda
4. Use envelope encryption pattern

**Interview Questions:**
- How does envelope encryption work?
- KMS vs client-side encryption?
- Secrets Manager vs Parameter Store?
- How to rotate encryption keys?

---

### Weeks 11-12: Infrastructure as Code & Advanced

#### **Terraform for AWS**

**LocalStack Provider Configuration:**
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    s3             = "http://localhost:4566"
    dynamodb       = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    apigateway     = "http://localhost:4566"
    sqs            = "http://localhost:4566"
    sns            = "http://localhost:4566"
    iam            = "http://localhost:4566"
  }
}
```

**Example: Serverless API Stack:**
```hcl
# S3 bucket for Lambda code
resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "lambda-code-bucket"
}

# DynamoDB table
resource "aws_dynamodb_table" "items" {
  name           = "Items"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Lambda function
resource "aws_lambda_function" "api" {
  filename      = "lambda.zip"
  function_name = "api-function"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.9"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.items.name
    }
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "api" {
  name = "my-api"
}

resource "aws_api_gateway_resource" "items" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "items"
}

resource "aws_api_gateway_method" "get_items" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.items.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.items.id
  http_method = aws_api_gateway_method.get_items.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api.invoke_arn
}
```

**Projects:**
1. Complete serverless CRUD API
2. VPC with public/private subnets
3. Auto Scaling Group with ALB
4. Event-driven microservices
5. Data processing pipeline

**Terraform Best Practices:**
- Use modules for reusability
- Remote state management (S3 + DynamoDB)
- Workspaces for environments
- Variables and outputs
- Naming conventions
- Tags for organization

---

## 3. AWS Architecture Patterns (Interview-Critical)

### Pattern 1: Serverless Web Application
```
Users → CloudFront → S3 (static)
          ↓
    API Gateway → Lambda → DynamoDB
          ↓                   ↓
    CloudWatch         DynamoDB Streams → Lambda
```

**Use Cases:** Blogs, SaaS, e-commerce
**Key Services:** CloudFront, S3, API Gateway, Lambda, DynamoDB, Cognito

**LocalStack Implementation:**
- Build serverless blog platform
- User auth with JWT (Cognito simulation)
- File uploads with presigned S3 URLs
- Real-time features with DynamoDB Streams

---

### Pattern 2: Event-Driven Microservices
```
Client → API Gateway
           ↓
   [Lambda A, Lambda B, Lambda C]
           ↓
      SNS Topic
     /    |    \
SQS 1  SQS 2  SQS 3
   ↓      ↓      ↓
Lambda  Lambda  Lambda
   ↓      ↓      ↓
DynamoDB S3  ElastiCache
```

**Use Cases:** Order processing, notification systems
**Key Services:** API Gateway, Lambda, SNS, SQS, DynamoDB, S3

**LocalStack Implementation:**
- Build order processing system
- SNS/SQS fanout for microservices
- DLQ for error handling
- Distributed tracing

---

### Pattern 3: High Availability Web App
```
Route 53 → CloudFront → ALB (Multi-AZ)
                           ↓
                    EC2 Auto Scaling (Multi-AZ)
                           ↓
        RDS Multi-AZ + Read Replicas + ElastiCache
```

**Use Cases:** Production web applications
**Key Services:** Route 53, CloudFront, ALB, EC2, RDS, ElastiCache

**Local Simulation:**
- Multi-container deployment
- Load balancing
- Database replication
- Failover testing

---

### Pattern 4: Real-Time Analytics Pipeline
```
Data Sources → Kinesis Data Streams → Lambda
                                        ↓
                              [S3, DynamoDB, ElastiCache]
                                        ↓
                              Kinesis Data Analytics
                                        ↓
                              Visualization/Alerts
```

**Use Cases:** IoT, real-time monitoring, analytics
**Key Services:** Kinesis, Lambda, S3, DynamoDB, CloudWatch

**Kafka Implementation:**
- Stream ingestion and processing
- Real-time aggregations
- Alerting on anomalies

---

## 4. FAANG Interview Practice

### System Design Problems (AWS-Specific)

#### 1. Design Twitter
**Requirements:** 300M users, 100M DAU, tweet timeline, followers
**AWS Services:**
- API Gateway + Lambda for APIs
- DynamoDB for tweets, users, follower graph
- ElastiCache for timeline caching
- S3 + CloudFront for media
- SNS/SQS for async processing (notifications)

**Key Considerations:**
- Read-heavy vs write-heavy patterns
- Celebrity problem (hot partitions)
- Timeline generation strategies
- Cost optimization

---

#### 2. Design Netflix
**Requirements:** Video streaming, 200M users, global
**AWS Services:**
- S3 for video storage
- CloudFront for global CDN
- Lambda for video processing/transcoding
- DynamoDB for user data, viewing history
- ElastiCache for session management
- Kinesis for real-time analytics

**Key Considerations:**
- Video encoding pipeline
- CDN strategy
- Personalization
- Global availability

---

#### 3. Design Uber
**Requirements:** Real-time location, ride matching, 10M active riders
**AWS Services:**
- API Gateway WebSocket for real-time
- Lambda for business logic
- DynamoDB for rides, users, location
- DynamoDB Streams for event processing
- ElastiCache for active locations
- Kinesis for analytics

**Key Considerations:**
- Geospatial indexing
- Real-time matching algorithm
- High availability
- Surge pricing

---

#### 4. Design WhatsApp
**Requirements:** 2B users, billions of messages/day
**AWS Services:**
- API Gateway WebSocket
- Lambda for message routing
- DynamoDB for messages, users
- ElastiCache for online status
- S3 for media
- SQS for offline message queue

**Key Considerations:**
- Message delivery guarantees
- End-to-end encryption
- Scalability
- Global distribution

---

#### 5. Design Instagram
**Requirements:** Photo/video sharing, feed, 1B users
**AWS Services:**
- S3 for media storage
- CloudFront for delivery
- API Gateway + Lambda
- DynamoDB for users, posts, likes
- ElastiCache for feed caching
- Kinesis for analytics

**Key Considerations:**
- Image processing pipeline
- Feed generation algorithm
- Hot partition handling
- Cost optimization

---

### AWS Knowledge Questions

**Compute:**
- When EC2 vs Lambda vs Fargate?
- Optimize Lambda cold starts?
- Lambda concurrency limits?
- Auto Scaling policies?

**Storage:**
- S3 vs EBS vs EFS?
- S3 consistency model?
- S3 performance optimization?
- Storage class selection?

**Database:**
- RDS vs DynamoDB?
- DynamoDB partition key design?
- Hot partition handling?
- RDS Multi-AZ vs Read Replicas?

**Networking:**
- VPC design principles?
- Security Group vs NACL?
- ALB vs NLB?
- VPC peering vs Transit Gateway?

**Messaging:**
- SQS vs SNS vs Kinesis?
- FIFO queue guarantees?
- Message ordering?
- Handling failures?

**Security:**
- IAM policy evaluation?
- Least privilege implementation?
- Cross-account access?
- Encryption strategies?

---

## 5. Hands-On Projects

### Project 1: Serverless E-Commerce Platform
**Features:**
- User authentication
- Product catalog
- Shopping cart
- Order processing (async)
- Payment integration
- Admin dashboard

**AWS Stack:**
- API Gateway, Lambda, DynamoDB, S3, SQS, SNS, Cognito

**Terraform IaC + LocalStack**

---

### Project 2: Real-Time Chat Application
**Features:**
- User auth
- 1-on-1 and group chat
- Real-time messaging
- Typing indicators
- Message history
- File sharing

**AWS Stack:**
- API Gateway WebSocket, Lambda, DynamoDB, S3

---

### Project 3: Video Processing Pipeline
**Features:**
- Upload videos
- Transcode to multiple formats
- Generate thumbnails
- Store in multiple resolutions
- CDN delivery

**AWS Stack:**
- S3, Lambda, MediaConvert (simulated), DynamoDB, CloudFront

---

### Project 4: Multi-Tenant SaaS
**Features:**
- Tenant isolation
- Usage tracking
- Billing integration
- Admin APIs
- Multi-tenancy patterns

**AWS Stack:**
- API Gateway, Lambda, DynamoDB (silo/pool/bridge), Cognito

---

## 6. LocalStack Setup

### Docker Compose
```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3,dynamodb,lambda,sqs,sns,apigateway,cloudwatch,iam,secretsmanager,kms
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - LAMBDA_EXECUTOR=docker
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "./localstack-data:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
```

### AWS CLI Configuration
```ini
# ~/.aws/config
[profile localstack]
region = us-east-1
output = json

# ~/.aws/credentials
[localstack]
aws_access_key_id = test
aws_secret_access_key = test
```

### Usage
```bash
# Start
docker-compose up -d

# Use AWS CLI
aws --profile localstack --endpoint-url=http://localhost:4566 s3 ls

# Or install awslocal
pip install awscli-local
awslocal s3 ls
```

---

## 7. Study Resources

### Official AWS
- AWS Well-Architected Framework ⭐⭐⭐
- AWS Whitepapers (Serverless, Security, Cost)
- Service FAQs
- AWS Architecture Center

### Books
- "AWS Certified Solutions Architect Study Guide"
- "Amazon Web Services in Action"
- "Serverless Architectures on AWS"

### Online
- A Cloud Guru
- Udemy (Stephane Maarek)
- AWS Skill Builder
- Linux Academy

### Blogs
- AWS Architecture Blog
- AllThingsDistributed
- ByteByteGo

---

## 8. Interview Prep Checklist

### Knowledge
- [ ] 25+ AWS services mastered
- [ ] Service trade-offs understood
- [ ] Pricing models known
- [ ] Well-Architected Framework pillars
- [ ] HA, DR, security patterns
- [ ] Service limits and quotas

### Skills
- [ ] 3+ AWS projects built
- [ ] AWS CLI proficiency
- [ ] Terraform/SAM expertise
- [ ] LocalStack deployment experience
- [ ] Common patterns implemented
- [ ] Debugging capability

### Design
- [ ] 10+ AWS architectures designed
- [ ] Cost estimation ability
- [ ] Multi-region strategies
- [ ] DR patterns known
- [ ] Optimization skills

---

**You're now ready to tackle FAANG AWS interviews with comprehensive knowledge and hands-on experience—all gained locally! 🚀☁️**
