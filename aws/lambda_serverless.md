# AWS Lambda: Complete Serverless Computing Guide

## Table of Contents
1. [History & Serverless Revolution](#history--serverless-revolution)
2. [Lambda Fundamentals](#lambda-fundamentals)
3. [Execution Model Deep Dive](#execution-model-deep-dive)
4. [Cold Starts & Performance](#cold-starts--performance)
5. [Concurrency & Scaling](#concurrency--scaling)
6. [Event Sources](#event-sources)
7. [Error Handling & Retries](#error-handling--retries)
8. [Advanced Features](#advanced-features)
9. [LocalStack & SAM CLI](#localstack--sam-cli)
10. [Production Patterns](#production-patterns)
11. [Cost Optimization](#cost-optimization)
12. [Interview Questions](#interview-questions)

---

## History & Serverless Revolution

### The Problem Lambda Solved (2014)

**Before Lambda (Traditional Server Model)**:
```
❌ Provision EC2 instances (over-provision for traffic spikes)
❌ Manage OS patches, security updates
❌ Pay for idle capacity (24/7)
❌ Manual scaling configuration
❌ Complex deployment pipelines
❌ Server maintenance overhead

Example Cost:
- t2.micro running 24/7 = $8.50/month
- Even if code runs 1 hour/day = still $8.50/month
- 95% waste for sporadic workloads
```

**Werner Vogels' Vision** (AWS CTO, 2012):
> "The server is dead. Build applications, not infrastructure."

**AWS Lambda Launch** (November 13, 2014):
```
✅ Pay only for execution time (millisecond billing)
✅ Automatic scaling (0 to thousands)
✅ No servers to manage
✅ Built-in fault tolerance
✅ Integrated with AWS services
```

**First Lambda Function** (JavaScript only):
```javascript
exports.handler = function(event, context) {
  context.done(null, "Hello World");
};
```

**Revolutionary Pricing**:
```
$0.20 per 1M requests
$0.00001667 per GB-second

Example: 1M requests, 512 MB, 100ms each
Cost = $0.20 + (1,000,000 × 0.1 × 0.5 × $0.00001667) = $1.03

vs EC2: $8.50+ (even if idle)
= 88% cost savings
```

### Evolution Timeline

```
2014: Launch (Node.js only)
2015: Python, Java support
2016: C# (.NET Core), Environment variables
2017: Go, Concurrency limits, Dead Letter Queues
2018: Ruby, Custom runtimes (Rust, PHP via layers)
2019: Provisioned Concurrency (reduce cold starts)
      Destination configuration
2020: 1ms billing (was 100ms), 10GB memory limit
      Container image support
2021: Lambda Function URLs (no API Gateway needed)
      Arm/Graviton2 support (20% cheaper, faster)
2022: 512MB /tmp storage (was 512MB)
      Lambda SnapStart (Java - 10x faster cold starts)
2023: 10GB memory max
```

### Impact

**Serverless Revolution**:
```
Enabled:
✅ Event-driven architectures
✅ Microservices without infrastructure
✅ True pay-per-use pricing
✅ Infinite scaling (in theory)
✅ Faster time-to-market

Industry Stats (2023):
- 40% of all companies use serverless
- AWS Lambda processes trillions of requests/month
- Average cost savings: 70%+ vs traditional servers
```

---

## Lambda Fundamentals

### Core Concepts

**Function**: Code + configuration
```
Handler: Entry point (function name)
Runtime: Programming language environment
Memory: 128 MB - 10 GB (in 1 MB increments)
Timeout: Max 15 minutes (900 seconds)
Ephemeral storage: /tmp (512 MB - 10 GB)
```

**Invocation Types**:

**1. Synchronous** (Request-Response):
```
Client → Lambda → Response

Use cases:
- API Gateway requests
- SDK invoke
- Cognito triggers

Max duration: Waits for function completion (up to 15 min)
```

**2. Asynchronous** (Fire and forget):
```
Client → SQS/SNS → Lambda
         ↓ (returns immediately)
     202 Accepted

Use cases:
- S3 events
- SNS messages
- CloudWatch Events

Retries: Automatic (2 times)
```

**3. Stream-based** (Poll-based):
```
Lambda → Polls → Kinesis/DynamoDB Streams → Batch invoke

Use cases:
- Kinesis Data Streams
- DynamoDB Streams
- Kafka

Batch size: 1-10,000 records
```

### Programming Model

**Handler Function Structure**:

**Python**:
```python
def lambda_handler(event, context):
    """
    event: Input data (dict)
    context: Runtime information
    """
    print(f"Request ID: {context.request_id}")
    print(f"Memory limit: {context.memory_limit_in_mb} MB")
    print(f"Time remaining: {context.get_remaining_time_in_millis()} ms")
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Success'})
    }
```

**Go**:
```go
package main

import (
	"context"
	"fmt"
	
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-lambda-go/lambdacontext"
)

type Request struct {
	Name string `json:"name"`
}

type Response struct {
	Message string `json:"message"`
}

func handler(ctx context.Context, req Request) (Response, error) {
	lc, _ := lambdacontext.FromContext(ctx)
	fmt.Printf("Request ID: %s\n", lc.AwsRequestID)
	
	return Response{
		Message: fmt.Sprintf("Hello, %s!", req.Name),
	}, nil
}

func main() {
	lambda.Start(handler)
}
```

**Context Object**:
```python
context.function_name           # my-function
context.function_version        # $LATEST or version number
context.invoked_function_arn    # Full ARN
context.memory_limit_in_mb      # 512
context.request_id              # Unique request ID
context.log_group_name          # /aws/lambda/my-function
context.log_stream_name         # 2024/01/01/[$LATEST]...
context.get_remaining_time_in_millis()  # Time before timeout
```

---

## Execution Model Deep Dive

### Lifecycle

```
┌─────────────────────────────────────────┐
│  1. INIT Phase (Cold Start)             │
│     - Download code                     │
│     - Start runtime                     │
│     - Run init code                     │
│     - Execute static constructors       │
│     Duration: 100ms - several seconds   │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│  2. INVOKE Phase                        │
│     - Run handler function              │
│     - Process event                     │
│     - Return response                   │
│     Duration: Your code execution       │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│  3. Keep-Alive (Warm)                   │
│     - Execution environment cached      │
│     - Reused for subsequent invocations │
│     - No INIT phase needed              │
│     Duration: 5-15 minutes idle         │
└─────────────────────────────────────────┘
```

**Execution Context Reuse**:

**Good (Reuse Connections)**:
```python
import boto3

# ✅ Initialize outside handler (reused across invocations)
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')

def lambda_handler(event, context):
    # Connection pool reused
    table.put_item(Item={'id': '123', 'name': 'Alice'})
    return {'statusCode': 200}
```

**Bad (New Connection Every Time)**:
```python
def lambda_handler(event, context):
    # ❌ Creates new connection each invocation
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('Users')
    table.put_item(Item={'id': '123', 'name': 'Alice'})
    return {'statusCode': 200}
```

### /tmp Directory

**Ephemeral storage** (persists across warm invocations):

```python
import os

def lambda_handler(event, context):
    tmp_file = '/tmp/data.txt'
    
    # Check if file exists from previous invocation
    if os.path.exists(tmp_file):
        print("Reusing cached file")
        with open(tmp_file, 'r') as f:
            data = f.read()
    else:
        print("Downloading and caching")
        data = download_large_file()
        with open(tmp_file, 'w') as f:
            f.write(data)
    
    process(data)
    return {'statusCode': 200}
```

**Limits**:
```
Default: 512 MB
Configurable: Up to 10 GB
Cost: $0.000000309/GB-second
Cleared: When execution environment terminated
```

---

## Cold Starts & Performance

### What is Cold Start?

**Cold Start**: Time to initialize new execution environment.

**Components**:
```
1. Download code package (from S3)
2. Start runtime (Python, Go, Node.js VM)
3. Initialize extensions
4. Run initialization code (imports, connections)

Total: 100ms (Go) to 5s+ (Java with large dependencies)
```

### Language Comparison

| Runtime | Cold Start | Reason |
|---------|-----------|--------|
| Go | 100-300 ms | Compiled, small binary |
| Python | 200-500 ms | Interpreted, fast startup |
| Node.js | 200-400 ms | V8 engine, fast startup |
| Java | 1-5 seconds | JVM startup overhead |
| .NET | 500ms-2s | CLR initialization |

### Optimization Strategies

**1. Minimize Package Size**:

**Bad (30 MB zip)**:
```python
# Includes entire boto3 + pandas + numpy
import boto3
import pandas as pd
import numpy as np

def lambda_handler(event, context):
    # Only uses boto3
    s3 = boto3.client('s3')
    s3.get_object(Bucket='my-bucket', Key='file.txt')
```

**Good (5 MB zip)**:
```python
# Only boto3 (included in Lambda runtime)
import boto3

def lambda_handler(event, context):
    s3 = boto3.client('s3')
    s3.get_object(Bucket='my-bucket', Key='file.txt')
```

**2. Use Layers for Shared Dependencies**:
```
Layer: Common libraries (pandas, requests)
Function: Only business logic

Benefits:
- Smaller deployment package
- Faster download time
- Shared across functions
```

**3. Lazy Loading**:

**Bad (Import Everything)**:
```python
import pandas as pd
import numpy as np
import scipy
from sklearn import *

def lambda_handler(event, context):
    # Most imports unused
    pass
```

**Good (Import on Demand)**:
```python
def lambda_handler(event, context):
    if event.get('action') == 'analyze':
        import pandas as pd  # Only when needed
        df = pd.DataFrame(event['data'])
        return df.describe().to_dict()
    
    return {'message': 'OK'}
```

**4. Keep Functions Warm** (Scheduled Events):
```python
# CloudWatch Event every 5 minutes
aws events put-rule \
  --name keep-lambda-warm \
  --schedule-expression "rate(5 minutes)"

aws events put-targets \
  --rule keep-lambda-warm \
  --targets "Id=1,Arn=arn:aws:lambda:us-east-1:123:function:my-function"
```

**5. Provisioned Concurrency**:
```
Reserve execution environments (always warm)

Cost: $0.000004167/provisioned-GB-second
      + $0.000009722/provisioned-request

When to use:
✅ Latency-sensitive applications (p99 < 100ms)
✅ Predictable traffic patterns
✅ Critical user-facing APIs
❌ Sporadic traffic (expensive)
```

**6. Lambda SnapStart** (Java only):
```
Pre-initialized snapshot of runtime environment

Benefits:
- 10x faster cold starts (from 5s → 500ms)
- Restored from snapshot instead of full initialization
- Works best with Java 11+

Enable:
aws lambda update-function-configuration \
  --function-name my-function \
  --snap-start ApplyOn=PublishedVersions
```

### Cold Start Benchmarks

**Scenario**: API Gateway → Lambda → DynamoDB

| Optimization | Cold Start | Warm | p99 |
|-------------|-----------|------|-----|
| None (Python) | 800 ms | 50 ms | 950 ms |
| Small package | 400 ms | 50 ms | 500 ms |
| Layers | 300 ms | 50 ms | 400 ms |
| Provisioned Concurrency | N/A (always warm) | 50 ms | 60 ms |

---

## Concurrency & Scaling

### Concurrency Model

**Concurrency**: Number of function instances executing simultaneously.

**Scaling**:
```
Request 1 → Lambda Instance 1
Request 2 → Lambda Instance 2 (new)
Request 3 → Lambda Instance 3 (new)
...
Request 1000 → Lambda Instance 1000 (if all concurrent)

Lambda creates instances instantly (up to limits)
```

### Limits

**Account-Level**:
```
Default concurrent executions: 1,000
Burst capacity: 500-3,000 (region-dependent)

Can request increase to 10,000+
```

**Function-Level Reserved Concurrency**:
```python
# Reserve 100 concurrent executions for this function
aws lambda put-function-concurrency \
  --function-name my-critical-function \
  --reserved-concurrent-executions 100

Benefits:
✅ Guarantees capacity
✅ Prevents runaway costs
✅ Isolates functions

Drawback:
❌ Reduces available concurrency for other functions
```

### Throttling

**When concurrency limit reached**:
```
Synchronous: Returns 429 TooManyRequestsException
Asynchronous: Retries for 6 hours, then DLQ
Stream-based: Blocks until capacity available
```

**Handling Throttles**:

**Exponential Backoff**:
```python
import time

def invoke_with_retry(lambda_client, function_name, payload):
    max_retries = 5
    
    for attempt in range(max_retries):
        try:
            response = lambda_client.invoke(
                FunctionName=function_name,
                Payload=json.dumps(payload)
            )
            return response
        except lambda_client.exceptions.TooManyRequestsException:
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) + random.random()
                print(f"Throttled, waiting {wait_time}s")
                time.sleep(wait_time)
            else:
                raise
```

---

## Event Sources

### 1. API Gateway

**HTTP API → Lambda**:
```python
def lambda_handler(event, context):
    # API Gateway event structure
    http_method = event['requestContext']['http']['method']  # GET
    path = event['requestContext']['http']['path']           # /users/123
    query_params = event.get('queryStringParameters', {})    # {limit: "10"}
    headers = event['headers']                               # {content-type: "..."}
    body = event.get('body', '')                             # JSON string
    
    if http_method == 'GET':
        user_id = event['pathParameters']['id']
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'user_id': user_id, 'name': 'Alice'})
        }
```

### 2. S3 Events

**S3 object created → Lambda**:
```python
def lambda_handler(event, context):
    # S3 event structure
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        size = record['s3']['object']['size']
        event_name = record['eventName']  # ObjectCreated:Put
        
        print(f"File uploaded: s3://{bucket}/{key} ({size} bytes)")
        
        # Process file
        s3 = boto3.client('s3')
        obj = s3.get_object(Bucket=bucket, Key=key)
        content = obj['Body'].read()
        
        # Do something with content
        process(content)
```

### 3. DynamoDB Streams

**DynamoDB change → Lambda**:
```python
def lambda_handler(event, context):
    for record in event['Records']:
        event_name = record['eventName']  # INSERT, MODIFY, REMOVE
        
        if event_name == 'INSERT':
            new_image = record['dynamodb']['NewImage']
            user_id = new_image['userId']['S']
            print(f"New user created: {user_id}")
            
            # Send welcome email
            send_welcome_email(user_id)
        
        elif event_name == 'MODIFY':
            old_image = record['dynamodb']['OldImage']
            new_image = record['dynamodb']['NewImage']
            # Handle update
```

### 4. SQS Queue

**SQS messages → Lambda (batch)**:
```python
def lambda_handler(event, context):
    # Lambda receives batch of messages (1-10)
    for record in event['Records']:
        message_id = record['messageId']
        body = json.loads(record['body'])
        
        try:
            process_order(body)
        except Exception as e:
            print(f"Failed to process {message_id}: {e}")
            # Message will retry or go to DLQ
            raise  # Partial batch failure
    
    return {'statusCode': 200}
```

**Batch Processing**:
```
Batch size: 1-10 (SQS), 1-10,000 (Kinesis)
Batch window: 0-300 seconds
Partial failure: Can report specific failed messages
```

### 5. EventBridge (CloudWatch Events)

**Scheduled Lambda**:
```python
# Cron expression: Every day at 2 AM UTC
# rule: cron(0 2 * * ? *)

def lambda_handler(event, context):
    print("Running daily cleanup job")
    
    # Cleanup old records
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('Sessions')
    
    cutoff = int(time.time()) - (30 * 86400)  # 30 days ago
    
    response = table.scan(
        FilterExpression='created_at < :cutoff',
        ExpressionAttributeValues={':cutoff': cutoff}
    )
    
    for item in response['Items']:
        table.delete_item(Key={'session_id': item['session_id']})
```

---

## Error Handling & Retries

### Retry Behavior

**Synchronous**:
```
No automatic retries
Client responsible for retry logic
```

**Asynchronous**:
```
Retries: 2 times (total 3 attempts)
Delay: 1 minute, then 2 minutes

After exhausting retries → Dead Letter Queue (DLQ)
```

**Stream-based**:
```
Retries: Until data expires or Lambda succeeds
Kinesis: 24 hours - 7 days (retention period)
DynamoDB Streams: 24 hours

Blocks processing of subsequent records in shard
```

### Dead Letter Queue (DLQ)

**Configure DLQ**:
```python
# Create SQS queue for failed events
aws sqs create-queue --queue-name lambda-dlq

# Configure Lambda DLQ
aws lambda update-function-configuration \
  --function-name my-function \
  --dead-letter-config TargetArn=arn:aws:sqs:us-east-1:123:lambda-dlq
```

**Process DLQ Messages**:
```python
def dlq_processor(event, context):
    """Process failed Lambda events from DLQ"""
    for record in event['Records']:
        body = json.loads(record['body'])
        
        # Original event that failed
        failed_event = body['requestPayload']
        error_message = body['responsePayload']['errorMessage']
        
        print(f"Failed event: {failed_event}")
        print(f"Error: {error_message}")
        
        # Manual intervention, logging, alerts
        send_alert_to_ops(failed_event, error_message)
```

### Destinations

**Alternative to DLQ (more flexible)**:
```python
# On success → SQS queue
# On failure → SNS topic

aws lambda put-function-event-invoke-config \
  --function-name my-function \
  --destination-config '{
    "OnSuccess": {"Destination": "arn:aws:sqs:us-east-1:123:success-queue"},
    "OnFailure": {"Destination": "arn:aws:sns:us-east-1:123:error-topic"}
  }'
```

---

## LocalStack & SAM CLI

### LocalStack Setup

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=lambda,s3,dynamodb,apigateway,sqs,sns
      - DEBUG=1
      - LAMBDA_EXECUTOR=docker
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "./lambda-functions:/var/lib/localstack/lambda"
```

### SAM Template

**template.yaml**:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: app.lambda_handler
      Runtime: python3.9
      CodeUri: src/
      Environment:
        Variables:
          TABLE_NAME: !Ref MyTable
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /items
            Method: get
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref MyTable
  
  MyTable:
    Type: AWS::Serverless::SimpleTable
    Properties:
      PrimaryKey:
        Name: id
        Type: String
```

**Deploy to LocalStack**:
```bash
# Build
sam build

# Deploy
samlocal deploy --guided

# Invoke
samlocal local invoke MyFunction --event events/test.json

# Start local API
samlocal local start-api
```

### Complete Example (Python)

**src/app.py**:
```python
import json
import boto3
import os

# Initialize outside handler (reused)
dynamodb = boto3.resource(
    'dynamodb',
    endpoint_url=os.environ.get('DYNAMODB_ENDPOINT', None)
)
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    http_method = event['httpMethod']
    
    if http_method == 'GET':
        # List items
        response = table.scan(Limit=10)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(response['Items'])
        }
    
    elif http_method == 'POST':
        # Create item
        item = json.loads(event['body'])
        table.put_item(Item=item)
        return {
            'statusCode': 201,
            'body': json.dumps({'message': 'Item created', 'id': item['id']})
        }
    
    else:
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method not allowed'})
        }
```

**Test**:
```bash
# GET /items
curl http://localhost:3000/items

# POST /items
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"id": "123", "name": "Test Item"}'
```

---

## Production Patterns

### Pattern 1: API Backend

**Architecture**:
```
Client → API Gateway → Lambda → DynamoDB
                          ↓
                    CloudWatch Logs
```

**Implementation** (Go):
```go
package main

import (
	"context"
	"encoding/json"
	"os"
	
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

var (
	sess  *session.Session
	ddb   *dynamodb.DynamoDB
	table string
)

func init() {
	sess = session.Must(session.NewSession())
	ddb = dynamodb.New(sess)
	table = os.Getenv("TABLE_NAME")
}

type User struct {
	ID    string `json:"id" dynamodbav:"id"`
	Name  string `json:"name" dynamodbav:"name"`
	Email string `json:"email" dynamodbav:"email"`
}

func handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	switch req.HTTPMethod {
	case "GET":
		return getUser(req.PathParameters["id"])
	case "POST":
		return createUser(req.Body)
	default:
		return events.APIGatewayProxyResponse{
			StatusCode: 405,
			Body:       `{"error": "Method not allowed"}`,
		}, nil
	}
}

func getUser(id string) (events.APIGatewayProxyResponse, error) {
	result, err := ddb.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(table),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(id)},
		},
	})
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500}, err
	}
	
	var user User
	dynamodbattribute.UnmarshalMap(result.Item, &user)
	
	body, _ := json.Marshal(user)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers:    map[string]string{"Content-Type": "application/json"},
		Body:       string(body),
	}, nil
}

func createUser(body string) (events.APIGatewayProxyResponse, error) {
	var user User
	json.Unmarshal([]byte(body), &user)
	
	item, _ := dynamodbattribute.MarshalMap(user)
	_, err := ddb.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(table),
		Item:      item,
	})
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500}, err
	}
	
	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Body:       `{"message": "User created"}`,
	}, nil
}

func main() {
	lambda.Start(handler)
}
```

### Pattern 2: Event Processing Pipeline

**Architecture**:
```
S3 Upload → Lambda (Validate) → SQS → Lambda (Process) → DynamoDB
                                           ↓
                                       S3 (Results)
```

**Validator Lambda**:
```python
import boto3
import json

s3 = boto3.client('s3')
sqs = boto3.client('sqs')
queue_url = os.environ['QUEUE_URL']

def lambda_handler(event, context):
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        # Validate file
        obj = s3.head_object(Bucket=bucket, Key=key)
        if obj['ContentLength'] > 100_000_000:  # 100 MB limit
            print(f"File too large: {key}")
            continue
        
        # Send to processing queue
        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps({'bucket': bucket, 'key': key})
        )
```

**Processor Lambda**:
```python
def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['TABLE_NAME'])
    
    for record in event['Records']:
        data = json.loads(record['body'])
        bucket = data['bucket']
        key = data['key']
        
        # Process file
        result = process_file(bucket, key)
        
        # Store results
        table.put_item(Item={
            'id': key,
            'status': 'completed',
            'result': result,
            'timestamp': int(time.time())
        })
```

---

## Cost Optimization

### Pricing Breakdown

**Compute**:
```
$0.0000166667 per GB-second
= $0.00001667 per GB-second

Memory tiers (pricing multiplier):
- 128 MB: 0.000000208 per 100ms
- 512 MB: 0.000000833 per 100ms
- 1024 MB: 0.000001667 per 100ms
- 2048 MB: 0.000003333 per 100ms
```

**Requests**:
```
$0.20 per 1M requests
= $0.0000002 per request
```

**Example Calculation**:
```
Function: 512 MB, 200ms average
Traffic: 10M requests/month

Compute cost:
10,000,000 × 0.2 seconds × 0.5 GB × $0.00001667
= $16.67

Request cost:
10,000,000 × $0.0000002
= $2.00

Total: $18.67/month

Free tier (first 12 months):
- 1M requests/month
- 400,000 GB-seconds/month
```

### Optimization Strategies

**1. Right-Size Memory**:
```
More memory = More CPU power

Test different memory sizes:
- 512 MB: 300ms execution → $0.000025
- 1024 MB: 150ms execution → $0.000025 (same cost, 2x faster!)
- 1536 MB: 100ms execution → $0.000025 (same cost, 3x faster!)

Optimal: Find sweet spot where cost plateaus
```

**2. Minimize Execution Time**:
```python
# Bad: Sequential processing (2 seconds)
def lambda_handler(event, context):
    for item in items:
        process(item)  # 100ms each, 20 items

# Good: Parallel processing (200ms)
import concurrent.futures

def lambda_handler(event, context):
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        executor.map(process, items)

# Cost savings: 10x reduction in execution time = 10x cost savings
```

**3. Use Reserved Concurrency Wisely**:
```
Reserved concurrency: $0.000004167/provisioned-GB-second

Only use for:
✅ Critical low-latency APIs
❌ Sporadic background jobs (waste money)
```

**4. Leverage Free Tier**:
```
Always free (even after 12 months):
- 1M requests/month
- 400,000 GB-seconds/month

Example: 128 MB function, 100ms execution
Free tier covers: 3.2M invocations/month!
```

---

## Interview Questions

### Conceptual

**Q: Lambda vs EC2 vs Fargate - when to use each?**
```
Lambda:
✅ Event-driven, sporadic workloads
✅ Unpredictable traffic
✅ Short-running tasks (< 15 min)
❌ Long-running processes
❌ State management
❌ Complex dependencies

EC2:
✅ Full control, custom OS
✅ Long-running applications
✅ Stateful applications
❌ Manual scaling
❌ Server management overhead

Fargate:
✅ Containerized applications
✅ Long-running (> 15 min)
✅ No server management
❌ More expensive than EC2 Reserved Instances
```

**Q: How does Lambda scale?**
```
Automatic scaling:
1. New request arrives
2. Lambda checks for warm execution environment
3. If none available, creates new instance (cold start)
4. Scales to 1,000 concurrent executions (default limit)
5. Burst capacity: 500-3,000 instances/minute

Scaling is per-function, independent
No configuration needed (unless reserved concurrency)
```

**Q: How to minimize cold starts?**
```
1. Reduce package size (<10 MB ideal)
2. Use compiled languages (Go, Rust)
3. Minimize dependencies
4. Use Lambda layers for shared code
5. Provisioned Concurrency (always warm, costs extra)
6. Keep functions warm (scheduled pings)
7. Lambda SnapStart (Java)
```

### Design

**Q: Design a thumbnail generation service (100K images/day)**
```
Architecture:
Client → S3 Upload → S3 Event → Lambda → Thumbnail → S3

Lambda Configuration:
- Runtime: Python 3.9 with Pillow
- Memory: 1024 MB (more CPU for image processing)
- Timeout: 60 seconds
- Layers: Pillow library (40 MB, shared across versions)
- Environment: THUMBNAIL_BUCKET=thumbnails

Code:
def lambda_handler(event, context):
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        # Download image
        s3 = boto3.client('s3')
        obj = s3.get_object(Bucket=bucket, Key=key)
        img = Image.open(obj['Body'])
        
        # Create thumbnail (200x200)
        img.thumbnail((200, 200))
        
        # Upload to thumbnail bucket
        buffer = io.BytesIO()
        img.save(buffer, 'JPEG')
        buffer.seek(0)
        
        thumbnail_key = f"thumbnails/{key}"
        s3.put_object(
            Bucket=os.environ['THUMBNAIL_BUCKET'],
            Key=thumbnail_key,
            Body=buffer,
            ContentType='image/jpeg'
        )

Cost Calculation:
100,000 images/day = 3M/month
1024 MB, 2 seconds average
= 3,000,000 × 2 × 1 × $0.00001667 = $100/month
+ requests = $0.60
Total: ~$100/month

vs EC2 t2.medium 24/7 = $34/month (but idle 95% of time)
Lambda more cost-effective for sporadic workload
```

**Q: How to handle Lambda failures in critical systems?**
```
1. Retries:
   - Asynchronous: 2 automatic retries
   - Synchronous: Client implements exponential backoff
   - Stream: Retries until success or data expires

2. Dead Letter Queue:
   - Failed events go to SQS/SNS
   - Separate Lambda processes DLQ
   - Alerts sent to operations

3. Idempotency:
   - Use unique request IDs
   - Check DynamoDB for duplicates before processing
   - Prevents duplicate processing on retries

4. Monitoring:
   - CloudWatch Alarms on error rate
   - X-Ray tracing for debugging
   - Custom metrics for business logic failures

5. Circuit Breaker:
   - Track failure rate
   - Stop sending requests if failures > threshold
   - Gradually resume after cooldown period
```

---

This comprehensive Lambda guide covers history through production patterns with complete LocalStack/SAM implementations! 🚀

