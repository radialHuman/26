# AWS Architecture Patterns: Production-Ready Designs

## Table of Contents
1. [Introduction](#introduction)
2. [Serverless Web Application](#serverless-web-application)
3. [Event-Driven Microservices](#event-driven-microservices)
4. [High Availability Web Application](#high-availability-web-application)
5. [Real-Time Analytics Pipeline](#real-time-analytics-pipeline)
6. [Multi-Region Active-Active Architecture](#multi-region-active-active-architecture)
7. [Complete LocalStack Implementation](#complete-localstack-implementation)
8. [Cost Optimization Strategies](#cost-optimization-strategies)
9. [Interview Questions](#interview-questions)

---

## Introduction

This guide synthesizes all AWS services learned previously into **production-ready architecture patterns** commonly used at FAANG companies and tested in system design interviews.

### Patterns Covered

1. **Serverless Web Application**: Global, scalable, pay-per-use
2. **Event-Driven Microservices**: Decoupled, fault-tolerant services
3. **High Availability Web Application**: 99.99% uptime for critical systems
4. **Real-Time Analytics Pipeline**: Process millions of events per second
5. **Multi-Region Active-Active**: Global scale with disaster recovery

---

## Serverless Web Application

### Architecture Overview

```
Users (Global)
    ↓ HTTPS
Route 53 (DNS)
    ↓
CloudFront (CDN - 200+ edge locations)
    ↓
    ├─→ S3 (Static assets: React/Angular/Vue SPA)
    │
    └─→ API Gateway (REST API)
            ↓
        Lambda (Business logic)
            ↓
        DynamoDB (Data persistence)
            ↑
        Cognito User Pools (Authentication)
```

### Components

**1. CloudFront + S3 for Frontend**

```bash
# Create S3 bucket for static website
aws s3api create-bucket \
  --bucket my-app-frontend \
  --region us-east-1

# Enable static website hosting
aws s3 website s3://my-app-frontend/ \
  --index-document index.html \
  --error-document index.html

# Upload React build
aws s3 sync ./build s3://my-app-frontend/

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name my-app-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

**CloudFront Configuration:**

```json
{
  "DistributionConfig": {
    "Origins": [{
      "Id": "S3-my-app",
      "DomainName": "my-app-frontend.s3.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": "origin-access-identity/cloudfront/ABCDEFG"
      }
    }],
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-my-app",
      "ViewerProtocolPolicy": "redirect-to-https",
      "Compress": true,
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "MinTTL": 0,
      "DefaultTTL": 86400,
      "MaxTTL": 31536000
    },
    "Enabled": true,
    "PriceClass": "PriceClass_All"
  }
}
```

**2. Cognito for Authentication**

```python
import boto3

cognito = boto3.client('cognito-idp')

# Create User Pool
user_pool = cognito.create_user_pool(
    PoolName='MyAppUsers',
    AutoVerifiedAttributes=['email'],
    MfaConfiguration='OPTIONAL',
    PasswordPolicy={
        'MinimumLength': 8,
        'RequireUppercase': True,
        'RequireLowercase': True,
        'RequireNumbers': True,
        'RequireSymbols': True
    }
)

pool_id = user_pool['UserPool']['Id']

# Create App Client
app_client = cognito.create_user_pool_client(
    UserPoolId=pool_id,
    ClientName='WebApp',
    GenerateSecret=False,
    ExplicitAuthFlows=[
        'ALLOW_USER_SRP_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH'
    ]
)

client_id = app_client['UserPoolClient']['ClientId']
```

**Frontend Authentication (JavaScript):**

```javascript
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const userPool = new CognitoUserPool({
  UserPoolId: 'us-east-1_ABC123',
  ClientId: 'abc123xyz456'
});

// Sign up
function signUp(username, password, email) {
  return new Promise((resolve, reject) => {
    userPool.signUp(username, password, [
      { Name: 'email', Value: email }
    ], null, (err, result) => {
      if (err) reject(err);
      else resolve(result.user);
    });
  });
}

// Sign in
function signIn(username, password) {
  const authDetails = new AuthenticationDetails({
    Username: username,
    Password: password
  });
  
  const cognitoUser = new CognitoUser({
    Username: username,
    Pool: userPool
  });
  
  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken();
        resolve(idToken);
      },
      onFailure: reject
    });
  });
}

// API call with JWT
async function callAPI(endpoint, method, data) {
  const session = userPool.getCurrentUser().getSession((err, session) => {
    const token = session.getIdToken().getJwtToken();
    
    return fetch(`https://api.example.com${endpoint}`, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  });
}
```

**3. API Gateway + Lambda**

```python
# serverless.yml (Serverless Framework)
service: my-app-api

provider:
  name: aws
  runtime: python3.9
  region: us-east-1
  environment:
    USERS_TABLE: ${self:service}-users-${opt:stage}
    COGNITO_USER_POOL_ID: us-east-1_ABC123

functions:
  getUser:
    handler: handlers/users.get_user
    events:
      - http:
          path: /users/{userId}
          method: get
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref CognitoAuthorizer

  createUser:
    handler: handlers/users.create_user
    events:
      - http:
          path: /users
          method: post
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref CognitoAuthorizer

resources:
  Resources:
    CognitoAuthorizer:
      Type: AWS::ApiGateway::Authorizer
      Properties:
        Name: CognitoAuthorizer
        Type: COGNITO_USER_POOLS
        ProviderARNs:
          - arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_ABC123
        IdentitySource: method.request.header.Authorization
        RestApiId: !Ref ApiGatewayRestApi

    UsersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.USERS_TABLE}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: userId
            AttributeType: S
        KeySchema:
          - AttributeName: userId
            KeyType: HASH
```

**Lambda Handlers:**

```python
# handlers/users.py
import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['USERS_TABLE'])

def get_user(event, context):
    """GET /users/{userId}"""
    user_id = event['pathParameters']['userId']
    
    # Get user from Cognito context
    cognito_user_id = event['requestContext']['authorizer']['claims']['sub']
    
    # Authorization: users can only access their own data
    if user_id != cognito_user_id:
        return {
            'statusCode': 403,
            'body': json.dumps({'error': 'Forbidden'})
        }
    
    # Get from DynamoDB
    response = table.get_item(Key={'userId': user_id})
    
    if 'Item' not in response:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'User not found'})
        }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response['Item'], default=decimal_default)
    }

def create_user(event, context):
    """POST /users"""
    data = json.loads(event['body'])
    cognito_user_id = event['requestContext']['authorizer']['claims']['sub']
    
    # Create user
    table.put_item(
        Item={
            'userId': cognito_user_id,
            'email': data['email'],
            'name': data['name'],
            'createdAt': int(time.time())
        }
    )
    
    return {
        'statusCode': 201,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'userId': cognito_user_id})
    }

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError
```

### Capacity and Cost Estimation

**Assumptions:**
- 100,000 monthly active users
- 10 API requests per user per day = 1M requests/day = 30M/month
- Average response size: 5 KB
- Static assets: 2 MB per user

**CloudFront:**
```
Data Transfer: 100K users × 2 MB = 200 GB
Cost: 200 GB × $0.085/GB = $17/month

Requests: 100K users × 30 requests = 3M HTTPS requests
Cost: 3M × $0.0075/10K = $2.25/month

Total CloudFront: ~$20/month
```

**S3:**
```
Storage: 2 MB static build
Cost: Negligible (~$0.05/month)

Requests: Served via CloudFront (minimal S3 requests)
Cost: ~$1/month
```

**API Gateway:**
```
HTTP API: 30M requests × $1/million = $30/month
```

**Lambda:**
```
Invocations: 30M × $0.20/million = $6/month

Compute: 30M × 100ms × 128 MB
  = 30M × 0.1 × 128/1024 GB-seconds
  = 375,000 GB-seconds
  = 375,000 × $0.0000166667 = $6.25/month

Total Lambda: ~$12/month
```

**DynamoDB:**
```
On-Demand Pricing:
Writes: 1M/month × $1.25/million = $1.25/month
Reads: 29M/month × $0.25/million = $7.25/month
Storage: Minimal (~$0.25/month for 1 GB)

Total DynamoDB: ~$9/month
```

**Cognito:**
```
MAU: 100K users
First 50K free, next 50K × $0.0055 = $275/month
```

**Route 53:**
```
Hosted Zone: $0.50/month
Queries: 100K users × 1/day × 30 = 3M queries × $0.40/million = $1.20/month

Total Route 53: ~$2/month
```

**Total Monthly Cost: ~$353/month** for 100K active users

**Scaling to 1M users:**
```
CloudFront: $200/month (2 TB transfer)
API Gateway: $300/month (300M requests)
Lambda: $120/month
DynamoDB: $90/month
Cognito: $5,225/month (950K paid users)
Route 53: $12/month

Total: ~$6,000/month for 1M users
```

---

## Event-Driven Microservices

### Architecture Overview

```
Order Service (Lambda)
    ↓ Publish
SNS Topic (OrderEvents)
    ↓ Fanout
    ├─→ SQS Queue (Inventory) → Lambda (Update inventory)
    ├─→ SQS Queue (Payment) → Lambda (Process payment)
    ├─→ SQS Queue (Shipping) → Lambda (Create shipment)
    └─→ SQS Queue (Notification) → Lambda (Send email/SMS)
```

### Benefits

1. **Decoupling**: Services don't know about each other
2. **Fault Isolation**: Payment failure doesn't affect inventory
3. **Independent Scaling**: Each service scales independently
4. **Asynchronous Processing**: Fast response to user (order accepted)
5. **Easy to Add Services**: Just subscribe new SQS queue

### Implementation

**Create SNS Topic + SQS Queues:**

```python
import boto3
import json

sns = boto3.client('sns')
sqs = boto3.client('sqs')

# Create SNS topic
topic = sns.create_topic(Name='OrderEvents')
topic_arn = topic['TopicArn']

# Create SQS queues
services = ['Inventory', 'Payment', 'Shipping', 'Notification']
queues = {}

for service in services:
    queue = sqs.create_queue(
        QueueName=f'Order{service}Queue',
        Attributes={
            'MessageRetentionPeriod': '86400',  # 1 day
            'VisibilityTimeout': '30',
            'ReceiveMessageWaitTimeSeconds': '20'  # Long polling
        }
    )
    queue_url = queue['QueueUrl']
    queues[service] = queue_url
    
    # Get queue ARN
    attrs = sqs.get_queue_attributes(
        QueueUrl=queue_url,
        AttributeNames=['QueueArn']
    )
    queue_arn = attrs['Attributes']['QueueArn']
    
    # Allow SNS to send to queue
    policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "sns.amazonaws.com"},
            "Action": "sqs:SendMessage",
            "Resource": queue_arn,
            "Condition": {
                "ArnEquals": {"aws:SourceArn": topic_arn}
            }
        }]
    }
    
    sqs.set_queue_attributes(
        QueueUrl=queue_url,
        Attributes={'Policy': json.dumps(policy)}
    )
    
    # Subscribe queue to topic
    sns.subscribe(
        TopicArn=topic_arn,
        Protocol='sqs',
        Endpoint=queue_arn
    )

print(f"SNS Topic: {topic_arn}")
for service, url in queues.items():
    print(f"{service} Queue: {url}")
```

**Order Service (Publisher):**

```python
def create_order(event, context):
    """Create order and publish event"""
    order_data = json.loads(event['body'])
    
    # Generate order ID
    order_id = str(uuid.uuid4())
    
    # Store order in DynamoDB
    orders_table.put_item(
        Item={
            'orderId': order_id,
            'userId': order_data['userId'],
            'items': order_data['items'],
            'totalAmount': order_data['totalAmount'],
            'status': 'PENDING',
            'createdAt': int(time.time())
        }
    )
    
    # Publish to SNS
    sns.publish(
        TopicArn=os.environ['ORDER_EVENTS_TOPIC'],
        Message=json.dumps({
            'orderId': order_id,
            'userId': order_data['userId'],
            'items': order_data['items'],
            'totalAmount': order_data['totalAmount'],
            'timestamp': int(time.time())
        }),
        MessageAttributes={
            'eventType': {
                'DataType': 'String',
                'StringValue': 'ORDER_CREATED'
            }
        }
    )
    
    return {
        'statusCode': 202,  # Accepted (async processing)
        'body': json.dumps({
            'orderId': order_id,
            'message': 'Order is being processed'
        })
    }
```

**Inventory Service (Consumer):**

```python
def process_inventory(event, context):
    """Update inventory for ordered items"""
    for record in event['Records']:
        # Parse SNS message from SQS
        sns_message = json.loads(record['body'])
        order = json.loads(sns_message['Message'])
        
        order_id = order['orderId']
        items = order['items']
        
        try:
            # Update inventory
            for item in items:
                inventory_table.update_item(
                    Key={'productId': item['productId']},
                    UpdateExpression='SET quantity = quantity - :qty',
                    ConditionExpression='quantity >= :qty',  # Ensure stock
                    ExpressionAttributeValues={':qty': item['quantity']}
                )
            
            # Update order status
            orders_table.update_item(
                Key={'orderId': order_id},
                UpdateExpression='SET inventoryStatus = :status',
                ExpressionAttributeValues={':status': 'RESERVED'}
            )
            
            print(f"Inventory reserved for order {order_id}")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                # Insufficient stock
                print(f"Insufficient stock for order {order_id}")
                
                # Publish failure event
                sns.publish(
                    TopicArn=os.environ['ORDER_EVENTS_TOPIC'],
                    Message=json.dumps({
                        'orderId': order_id,
                        'error': 'Insufficient stock'
                    }),
                    MessageAttributes={
                        'eventType': {
                            'DataType': 'String',
                            'StringValue': 'INVENTORY_FAILED'
                        }
                    }
                )
                
                # Send to DLQ (automatic via SQS config)
                raise
```

**Payment Service (Consumer):**

```python
def process_payment(event, context):
    """Charge customer for order"""
    for record in event['Records']:
        sns_message = json.loads(record['body'])
        order = json.loads(sns_message['Message'])
        
        order_id = order['orderId']
        user_id = order['userId']
        amount = order['totalAmount']
        
        try:
            # Call payment gateway (Stripe, PayPal, etc.)
            charge = stripe.Charge.create(
                amount=int(amount * 100),  # Cents
                currency='usd',
                customer=get_customer_id(user_id),
                description=f'Order {order_id}'
            )
            
            # Store payment record
            payments_table.put_item(
                Item={
                    'paymentId': charge.id,
                    'orderId': order_id,
                    'amount': amount,
                    'status': 'SUCCEEDED',
                    'timestamp': int(time.time())
                }
            )
            
            # Update order
            orders_table.update_item(
                Key={'orderId': order_id},
                UpdateExpression='SET paymentStatus = :status',
                ExpressionAttributeValues={':status': 'PAID'}
            )
            
            print(f"Payment processed for order {order_id}")
            
        except stripe.error.CardError as e:
            # Payment failed
            print(f"Payment failed for order {order_id}: {e}")
            
            sns.publish(
                TopicArn=os.environ['ORDER_EVENTS_TOPIC'],
                Message=json.dumps({
                    'orderId': order_id,
                    'error': str(e)
                }),
                MessageAttributes={
                    'eventType': {
                        'DataType': 'String',
                        'StringValue': 'PAYMENT_FAILED'
                    }
                }
            )
            
            raise
```

### Saga Pattern for Distributed Transactions

```python
# Orchestration approach with Step Functions
{
  "StartAt": "ReserveInventory",
  "States": {
    "ReserveInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ReserveInventory",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "CancelOrder"
      }],
      "Next": "ProcessPayment"
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ProcessPayment",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "ReleaseInventory"
      }],
      "Next": "CreateShipment"
    },
    "CreateShipment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:CreateShipment",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "RefundPayment"
      }],
      "Next": "OrderComplete"
    },
    "OrderComplete": {
      "Type": "Succeed"
    },
    "ReleaseInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ReleaseInventory",
      "Next": "CancelOrder"
    },
    "RefundPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:RefundPayment",
      "Next": "ReleaseInventory"
    },
    "CancelOrder": {
      "Type": "Fail"
    }
  }
}
```

---

## High Availability Web Application

### Architecture Overview

```
Users
    ↓
Route 53 (DNS with health checks)
    ↓
    ├─→ us-east-1 (Primary)
    │       ↓
    │   ALB (Multi-AZ: us-east-1a, us-east-1b, us-east-1c)
    │       ↓
    │   EC2 Auto Scaling Group (min: 2, desired: 4, max: 10)
    │       ↓
    │   RDS Multi-AZ (Primary in 1a, Standby in 1b)
    │   Read Replicas (1b, 1c)
    │       ↑
    │   ElastiCache Redis Cluster (Multi-AZ)
    │
    └─→ us-west-2 (DR - standby)
```

### High Availability Principles

1. **No Single Point of Failure**: Every component has redundancy
2. **Multi-AZ Deployment**: Survive datacenter failure
3. **Auto Scaling**: Handle traffic spikes
4. **Health Checks**: Automatic failover
5. **Multi-Region**: Survive regional disaster

### Implementation

**VPC Setup (Multi-AZ):**

```python
import boto3

ec2 = boto3.client('ec2')

# Create VPC
vpc = ec2.create_vpc(CidrBlock='10.0.0.0/16')
vpc_id = vpc['Vpc']['VpcId']

# Create subnets in 3 AZs
azs = ['us-east-1a', 'us-east-1b', 'us-east-1c']
public_subnets = []
private_subnets = []

for i, az in enumerate(azs):
    # Public subnet
    public_subnet = ec2.create_subnet(
        VpcId=vpc_id,
        CidrBlock=f'10.0.{i}.0/24',
        AvailabilityZone=az
    )
    public_subnets.append(public_subnet['Subnet']['SubnetId'])
    
    # Private subnet
    private_subnet = ec2.create_subnet(
        VpcId=vpc_id,
        CidrBlock=f'10.0.{10+i}.0/24',
        AvailabilityZone=az
    )
    private_subnets.append(private_subnet['Subnet']['SubnetId'])

# Internet Gateway
igw = ec2.create_internet_gateway()
ec2.attach_internet_gateway(
    InternetGatewayId=igw['InternetGateway']['InternetGatewayId'],
    VpcId=vpc_id
)

# NAT Gateways (one per AZ for HA)
nat_gateways = []
for i, public_subnet in enumerate(public_subnets):
    # Allocate EIP
    eip = ec2.allocate_address(Domain='vpc')
    
    # Create NAT Gateway
    nat = ec2.create_nat_gateway(
        SubnetId=public_subnet,
        AllocationId=eip['AllocationId']
    )
    nat_gateways.append(nat['NatGateway']['NatGatewayId'])
```

**ALB + Target Group:**

```python
elbv2 = boto3.client('elbv2')

# Create ALB
alb = elbv2.create_load_balancer(
    Name='MyALB',
    Subnets=public_subnets,  # All 3 AZs
    SecurityGroups=[alb_security_group_id],
    Scheme='internet-facing',
    Type='application',
    IpAddressType='ipv4'
)

alb_arn = alb['LoadBalancers'][0]['LoadBalancerArn']
alb_dns = alb['LoadBalancers'][0]['DNSName']

# Create Target Group
tg = elbv2.create_target_group(
    Name='WebServers',
    Port=80,
    Protocol='HTTP',
    VpcId=vpc_id,
    HealthCheckProtocol='HTTP',
    HealthCheckPath='/health',
    HealthCheckIntervalSeconds=30,
    HealthyThresholdCount=2,
    UnhealthyThresholdCount=3,
    Matcher={'HttpCode': '200'}
)

tg_arn = tg['TargetGroups'][0]['TargetGroupArn']

# Create Listener
elbv2.create_listener(
    LoadBalancerArn=alb_arn,
    Port=443,
    Protocol='HTTPS',
    Certificates=[{
        'CertificateArn': acm_certificate_arn
    }],
    DefaultActions=[{
        'Type': 'forward',
        'TargetGroupArn': tg_arn
    }]
)
```

**Auto Scaling Group:**

```python
autoscaling = boto3.client('autoscaling')

# Create Launch Template
ec2.create_launch_template(
    LaunchTemplateName='WebServerTemplate',
    LaunchTemplateData={
        'ImageId': 'ami-0c55b159cbfafe1f0',  # Amazon Linux 2
        'InstanceType': 't3.medium',
        'SecurityGroupIds': [web_security_group_id],
        'IamInstanceProfile': {'Arn': instance_profile_arn},
        'UserData': base64.b64encode('''#!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            echo "<h1>Server $(hostname)</h1>" > /var/www/html/index.html
            echo "OK" > /var/www/html/health
        '''.encode()).decode()
    }
)

# Create Auto Scaling Group
autoscaling.create_auto_scaling_group(
    AutoScalingGroupName='WebServersASG',
    LaunchTemplate={
        'LaunchTemplateName': 'WebServerTemplate',
        'Version': '$Latest'
    },
    MinSize=2,  # Minimum 2 instances (HA)
    DesiredCapacity=4,
    MaxSize=10,
    VPCZoneIdentifier=','.join(private_subnets),  # All 3 AZs
    TargetGroupARNs=[tg_arn],
    HealthCheckType='ELB',
    HealthCheckGracePeriod=300
)

# Target Tracking Scaling Policy
autoscaling.put_scaling_policy(
    AutoScalingGroupName='WebServersASG',
    PolicyName='CPUTargetTracking',
    PolicyType='TargetTrackingScaling',
    TargetTrackingConfiguration={
        'PredefinedMetricSpecification': {
            'PredefinedMetricType': 'ASGAverageCPUUtilization'
        },
        'TargetValue': 70.0  # Target 70% CPU
    }
)
```

**RDS Multi-AZ + Read Replicas:**

```python
rds = boto3.client('rds')

# Create DB Subnet Group (Multi-AZ)
rds.create_db_subnet_group(
    DBSubnetGroupName='MyDBSubnetGroup',
    DBSubnetGroupDescription='Subnets for RDS',
    SubnetIds=private_subnets  # All 3 AZs
)

# Create RDS Multi-AZ
db = rds.create_db_instance(
    DBInstanceIdentifier='mydb',
    DBInstanceClass='db.r5.large',
    Engine='postgres',
    MasterUsername='admin',
    MasterUserPassword='SecurePassword123!',
    AllocatedStorage=100,
    StorageType='gp3',
    StorageEncrypted=True,
    MultiAZ=True,  # Primary in us-east-1a, Standby in us-east-1b
    DBSubnetGroupName='MyDBSubnetGroup',
    VpcSecurityGroupIds=[db_security_group_id],
    BackupRetentionPeriod=7,
    PreferredBackupWindow='03:00-04:00',
    PreferredMaintenanceWindow='sun:04:00-sun:05:00',
    EnableCloudwatchLogsExports=['postgresql'],
    DeletionProtection=True
)

# Create Read Replica in us-east-1c
rds.create_db_instance_read_replica(
    DBInstanceIdentifier='mydb-replica-1',
    SourceDBInstanceIdentifier='mydb',
    DBInstanceClass='db.r5.large',
    AvailabilityZone='us-east-1c',
    PubliclyAccessible=False
)

# Create Read Replica in us-east-1b (different AZ for HA)
rds.create_db_instance_read_replica(
    DBInstanceIdentifier='mydb-replica-2',
    SourceDBInstanceIdentifier='mydb',
    DBInstanceClass='db.r5.large',
    AvailabilityZone='us-east-1b',
    PubliclyAccessible=False
)
```

**ElastiCache Redis Cluster Mode:**

```python
elasticache = boto3.client('elasticache')

# Create subnet group
elasticache.create_cache_subnet_group(
    CacheSubnetGroupName='RedisSubnetGroup',
    CacheSubnetGroupDescription='Subnets for Redis',
    SubnetIds=private_subnets
)

# Create Redis Cluster with Multi-AZ
elasticache.create_replication_group(
    ReplicationGroupId='my-redis-cluster',
    ReplicationGroupDescription='HA Redis Cluster',
    Engine='redis',
    CacheNodeType='cache.r5.large',
    NumCacheClusters=3,  # 1 primary + 2 replicas
    AutomaticFailoverEnabled=True,  # Multi-AZ automatic failover
    MultiAZEnabled=True,
    CacheSubnetGroupName='RedisSubnetGroup',
    SecurityGroupIds=[redis_security_group_id],
    AtRestEncryptionEnabled=True,
    TransitEncryptionEnabled=True,
    SnapshotRetentionLimit=5,
    SnapshotWindow='03:00-05:00'
)
```

**Route 53 Health Checks + Failover:**

```python
route53 = boto3.client('route53')

# Create health check for primary ALB
health_check = route53.create_health_check(
    Type='HTTPS',
    ResourcePath='/health',
    FullyQualifiedDomainName=alb_dns,
    Port=443,
    RequestInterval=30,
    FailureThreshold=3
)

hc_id = health_check['HealthCheck']['Id']

# Create hosted zone
zone = route53.create_hosted_zone(
    Name='example.com',
    CallerReference=str(time.time())
)

zone_id = zone['HostedZone']['Id']

# Primary record (us-east-1)
route53.change_resource_record_sets(
    HostedZoneId=zone_id,
    ChangeBatch={
        'Changes': [{
            'Action': 'CREATE',
            'ResourceRecordSet': {
                'Name': 'www.example.com',
                'Type': 'A',
                'SetIdentifier': 'Primary-US-East-1',
                'Failover': 'PRIMARY',
                'AliasTarget': {
                    'HostedZoneId': alb_hosted_zone_id,
                    'DNSName': alb_dns,
                    'EvaluateTargetHealth': True
                },
                'HealthCheckId': hc_id
            }
        }]
    }
)

# Secondary record (us-west-2 DR)
route53.change_resource_record_sets(
    HostedZoneId=zone_id,
    ChangeBatch={
        'Changes': [{
            'Action': 'CREATE',
            'ResourceRecordSet': {
                'Name': 'www.example.com',
                'Type': 'A',
                'SetIdentifier': 'Secondary-US-West-2',
                'Failover': 'SECONDARY',
                'AliasTarget': {
                    'HostedZoneId': dr_alb_hosted_zone_id,
                    'DNSName': dr_alb_dns,
                    'EvaluateTargetHealth': True
                }
            }
        }]
    }
)
```

### RTO and RPO

**RTO (Recovery Time Objective)**: Time to restore service

```
Component Failover Times:
- EC2 instance failure: ~1 minute (health check + replacement)
- AZ failure: ~2 minutes (traffic shifts to other AZs)
- RDS Multi-AZ failover: 60-120 seconds (automatic)
- ElastiCache failover: 30-60 seconds (automatic)
- Regional failure: 5-10 minutes (manual Route 53 switch or automatic with health checks)

Overall RTO: <2 minutes for AZ failure, <10 minutes for region failure
```

**RPO (Recovery Point Objective)**: Maximum data loss

```
- RDS Multi-AZ: 0 seconds (synchronous replication)
- RDS Cross-Region Replica: ~5 seconds (asynchronous)
- ElastiCache: Session data only, acceptable to lose

Overall RPO: Near-zero for critical data
```

---

## Real-Time Analytics Pipeline

### Architecture Overview

```
Data Sources (Web, Mobile, IoT)
    ↓ HTTPS
Kinesis Data Streams (Ingestion - 1000 writes/sec per shard)
    ↓
    ├─→ Lambda (Real-time processing)
    │       ↓
    │   DynamoDB (Real-time dashboards, <10ms queries)
    │       ↓
    │   ElastiCache (Aggregations, leaderboards)
    │
    └─→ Kinesis Data Firehose (Batch ETL)
            ↓ Buffer (5 MB or 300 seconds)
        Lambda (Transform)
            ↓
        S3 Data Lake (Partitioned by date)
            ↓
        AWS Glue (Catalog)
            ↓
        Amazon Athena (Ad-hoc SQL)
            ↓
        QuickSight (Visualization)
```

### Use Case: Real-Time Website Analytics

**Requirements:**
- Track 1M events/day (page views, clicks, purchases)
- Real-time dashboard (last 5 minutes)
- Historical analysis (last 90 days)
- Latency: <1 second for real-time, <5 seconds for batch

**Implementation:**

```python
# Producer: Web application
import boto3
import json

kinesis = boto3.client('kinesis')

def track_event(event_type, user_id, properties):
    """Send event to Kinesis"""
    event = {
        'eventType': event_type,
        'userId': user_id,
        'timestamp': int(time.time() * 1000),
        'properties': properties
    }
    
    kinesis.put_record(
        StreamName='WebAnalytics',
        Data=json.dumps(event),
        PartitionKey=user_id  # Distribute by user for even load
    )

# Example: Track page view
track_event('PAGE_VIEW', 'user-123', {
    'page': '/products/shoes',
    'referrer': 'https://google.com'
})

# Example: Track purchase
track_event('PURCHASE', 'user-123', {
    'productId': 'prod-456',
    'amount': 99.99,
    'currency': 'USD'
})
```

**Real-Time Consumer (Lambda → DynamoDB):**

```python
def process_realtime_analytics(event, context):
    """Aggregate events for real-time dashboard"""
    for record in event['Records']:
        # Decode Kinesis record
        payload = base64.b64decode(record['kinesis']['data'])
        event_data = json.loads(payload)
        
        event_type = event_data['eventType']
        timestamp = event_data['timestamp']
        properties = event_data['properties']
        
        # Time bucket (5-minute granularity)
        time_bucket = (timestamp // 300000) * 300000  # Round to 5 minutes
        
        # Update real-time metrics in DynamoDB
        if event_type == 'PAGE_VIEW':
            analytics_table.update_item(
                Key={
                    'metricType': 'PAGE_VIEWS',
                    'timeBucket': time_bucket
                },
                UpdateExpression='ADD count :inc, SET page = :page',
                ExpressionAttributeValues={
                    ':inc': 1,
                    ':page': properties['page']
                }
            )
        
        elif event_type == 'PURCHASE':
            # Update revenue
            analytics_table.update_item(
                Key={
                    'metricType': 'REVENUE',
                    'timeBucket': time_bucket
                },
                UpdateExpression='ADD totalRevenue :amount, purchaseCount :inc',
                ExpressionAttributeValues={
                    ':amount': Decimal(str(properties['amount'])),
                    ':inc': 1
                }
            )
            
            # Update product leaderboard in Redis
            redis_client.zincrby(
                f'top_products:{time_bucket}',
                1,
                properties['productId']
            )
            redis_client.expire(f'top_products:{time_bucket}', 86400)  # 24 hours

# Query real-time dashboard
def get_realtime_metrics():
    """Get last 1 hour of metrics"""
    now = int(time.time() * 1000)
    one_hour_ago = now - 3600000
    
    response = analytics_table.query(
        KeyConditionExpression='metricType = :type AND timeBucket BETWEEN :start AND :end',
        ExpressionAttributeValues={
            ':type': 'PAGE_VIEWS',
            ':start': one_hour_ago,
            ':end': now
        }
    )
    
    return response['Items']
```

**Batch Processing (Firehose → S3 → Athena):**

```python
# Firehose transformation Lambda
def transform_for_s3(event, context):
    """Transform events to Parquet format"""
    output = []
    
    for record in event['records']:
        payload = base64.b64decode(record['data'])
        event_data = json.loads(payload)
        
        # Add partitioning fields
        timestamp = event_data['timestamp']
        dt = datetime.fromtimestamp(timestamp / 1000)
        
        event_data['year'] = dt.year
        event_data['month'] = dt.month
        event_data['day'] = dt.day
        event_data['hour'] = dt.hour
        
        # Re-encode
        output.append({
            'recordId': record['recordId'],
            'result': 'Ok',
            'data': base64.b64encode(json.dumps(event_data).encode()).decode()
        })
    
    return {'records': output}

# Create Firehose delivery stream
firehose = boto3.client('firehose')

firehose.create_delivery_stream(
    DeliveryStreamName='WebAnalyticsToS3',
    DeliveryStreamType='KinesisStreamAsSource',
    KinesisStreamSourceConfiguration={
        'KinesisStreamARN': kinesis_stream_arn,
        'RoleARN': firehose_role_arn
    },
    ExtendedS3DestinationConfiguration={
        'BucketARN': f'arn:aws:s3:::analytics-data-lake',
        'Prefix': 'events/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/',
        'ErrorOutputPrefix': 'errors/',
        'BufferingHints': {
            'SizeInMBs': 128,
            'IntervalInSeconds': 300
        },
        'CompressionFormat': 'GZIP',
        'ProcessingConfiguration': {
            'Enabled': True,
            'Processors': [{
                'Type': 'Lambda',
                'Parameters': [{
                    'ParameterName': 'LambdaArn',
                    'ParameterValue': transform_lambda_arn
                }]
            }]
        },
        'DataFormatConversionConfiguration': {
            'Enabled': True,
            'SchemaConfiguration': {
                'DatabaseName': 'analytics',
                'TableName': 'events',
                'Region': 'us-east-1',
                'RoleARN': glue_role_arn
            },
            'OutputFormatConfiguration': {
                'Serializer': {
                    'ParquetSerDe': {}
                }
            }
        }
    }
)
```

**Athena Queries:**

```sql
-- Create external table
CREATE EXTERNAL TABLE IF NOT EXISTS analytics.events (
  eventType string,
  userId string,
  timestamp bigint,
  properties struct<
    page: string,
    referrer: string,
    productId: string,
    amount: double,
    currency: string
  >
)
PARTITIONED BY (
  year int,
  month int,
  day int
)
STORED AS PARQUET
LOCATION 's3://analytics-data-lake/events/';

-- Add partitions
MSCK REPAIR TABLE analytics.events;

-- Daily active users
SELECT
  date(from_unixtime(timestamp / 1000)) as date,
  COUNT(DISTINCT userId) as dau
FROM analytics.events
WHERE year = 2024 AND month = 1
GROUP BY 1
ORDER BY 1;

-- Top products by revenue (last 7 days)
SELECT
  properties.productId,
  SUM(properties.amount) as total_revenue,
  COUNT(*) as purchase_count
FROM analytics.events
WHERE eventType = 'PURCHASE'
  AND timestamp > (UNIX_TIMESTAMP() * 1000) - 604800000
GROUP BY 1
ORDER BY 2 DESC
LIMIT 10;

-- Conversion funnel
WITH funnel AS (
  SELECT
    userId,
    MAX(CASE WHEN eventType = 'PAGE_VIEW' AND properties.page LIKE '%/products/%' THEN 1 ELSE 0 END) as viewed_product,
    MAX(CASE WHEN eventType = 'ADD_TO_CART' THEN 1 ELSE 0 END) as added_to_cart,
    MAX(CASE WHEN eventType = 'PURCHASE' THEN 1 ELSE 0 END) as purchased
  FROM analytics.events
  WHERE year = 2024 AND month = 1 AND day = 15
  GROUP BY userId
)
SELECT
  SUM(viewed_product) as viewed_product,
  SUM(added_to_cart) as added_to_cart,
  SUM(purchased) as purchased,
  ROUND(100.0 * SUM(added_to_cart) / NULLIF(SUM(viewed_product), 0), 2) as view_to_cart_rate,
  ROUND(100.0 * SUM(purchased) / NULLIF(SUM(added_to_cart), 0), 2) as cart_to_purchase_rate
FROM funnel;
```

### Capacity and Cost

**Assumptions:**
- 1M events/day = 11.6 events/sec average, 100 events/sec peak
- Average event size: 500 bytes
- Retention: Real-time (1 day), Historical (90 days)

**Kinesis Data Streams:**
```
Shards needed: 100 events/sec ÷ 1000 events/sec/shard = 1 shard
Cost: 1 shard × $0.015/hour × 730 hours = $10.95/month

PUT payload units: 1M events/day × 0.5 KB ÷ 25 KB = 20K PUT units/day
Cost: 20K × 30 days × $0.014/million = $0.01/month

Total Kinesis: ~$11/month
```

**Lambda (Real-time):**
```
Invocations: 1M/day = 30M/month
Compute: 30M × 100ms × 128 MB = 375K GB-seconds
Cost: $6/month + $6.25/month = $12.25/month
```

**DynamoDB:**
```
Writes: 1M/day = 30M/month × $1.25/million = $37.50/month
Reads: 10M/month (dashboard queries) × $0.25/million = $2.50/month
Storage: 1M events × 0.5 KB × 1 day = 0.5 GB × $0.25/GB = $0.13/month

Total DynamoDB: ~$40/month
```

**Kinesis Firehose:**
```
Data ingested: 1M × 0.5 KB × 30 = 15 GB/month
Cost: 15 GB × $0.029/GB = $0.44/month
```

**S3:**
```
Storage: 1M × 0.5 KB × 90 days = 45 GB
Cost: 45 GB × $0.023/GB = $1.04/month

PUT requests: 1M/day ÷ 1000 (buffered) = 1K/day = 30K/month
Cost: 30K × $0.005/1K = $0.15/month

Total S3: ~$1.20/month
```

**Athena:**
```
Data scanned: 15 GB/month (compressed Parquet 10:1)
Cost: 1.5 GB × $5/TB = $0.0075/month (negligible)
```

**Total: ~$65/month** for 1M events/day with real-time + historical analytics

---

## Interview Questions

### Q1: Design a serverless web application for 1M users with global reach

**Answer:**

**Architecture:**

```
CloudFront (CDN)
    ↓
    ├─→ S3 (React SPA)
    └─→ API Gateway HTTP API
            ↓
        Lambda@Edge (Auth verification)
            ↓
        Lambda (Business logic - regional)
            ↓
        DynamoDB Global Tables (Multi-region replication)
            ↑
        Cognito (Authentication)
```

**Capacity Estimation:**

```
Users: 1M monthly active
Requests: 1M users × 50 requests/day = 50M/day = 1.5B/month

CloudFront:
- Bandwidth: 1M users × 5 MB/day = 5 TB/month
- Cost: 5 TB × $0.085/GB = $425/month

API Gateway HTTP API:
- Requests: 1.5B × $1/million = $1,500/month

Lambda:
- Invocations: 1.5B × $0.20/million = $300/month
- Compute: 1.5B × 50ms × 256 MB = 96M GB-sec × $0.0000166667 = $1,600/month

DynamoDB Global Tables (3 regions):
- Writes: 50M/day = 1.5B/month × 3 regions × $1.25/million = $5,625/month
- Reads: 1.4B/month × 3 regions × $0.25/million = $1,050/month
- Storage: 100 GB × 3 regions × $0.25/GB = $75/month
- Cross-region replication: 50M writes/day × 1 KB × 30 × 3 × $0.09/GB = $405/month

Cognito:
- MAU: 1M × $0.0055 (after 50K free) = $5,225/month

Total: ~$15,205/month
```

**Optimizations:**

1. **Caching**: ElastiCache for hot data → reduce DynamoDB reads by 80%
   - Cost: +$50/month (cache.t3.micro)
   - Savings: -$840/month (DynamoDB reads)
   
2. **Reserved Capacity**: DynamoDB provisioned mode
   - 500 WCU × $0.00065/hour × 730 = $237/month (vs $1,875 on-demand for consistent traffic)
   
3. **S3 Intelligent-Tiering**: Move old objects to Glacier
   - Savings: -$100/month

**Optimized Total: ~$13,500/month** for 1M users

---

This architecture patterns guide demonstrates how to combine AWS services into production-ready systems. Focus on: decoupling with SNS/SQS, Multi-AZ for HA, caching for performance, Kinesis for real-time analytics, and cost optimization through right-sizing and reserved capacity.
