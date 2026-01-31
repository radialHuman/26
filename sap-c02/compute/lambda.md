# AWS Lambda

## What is Lambda?

AWS Lambda is a serverless compute service that runs code in response to events without provisioning or managing servers. You upload your code, and Lambda handles everything required to run and scale your code with high availability. You pay only for the compute time consumed.

## Why Use Lambda?

### Key Benefits
- **No servers to manage**: Fully managed infrastructure
- **Automatic scaling**: From zero to thousands of concurrent executions
- **Pay per use**: Billed per 100ms of execution time
- **High availability**: Built-in fault tolerance across multiple AZs
- **Event-driven**: Integrates with 200+ AWS services
- **Multiple languages**: Python, Node.js, Java, Go, Ruby, .NET, custom runtimes

### Use Cases
- Real-time file processing (image resize, video transcode)
- Data transformation and ETL
- API backends (with API Gateway)
- Stream processing (Kinesis, DynamoDB Streams)
- Scheduled tasks (cron jobs)
- IoT backends
- Chatbots and Alexa skills
- Automation and orchestration

## How Lambda Works

### Basic Concepts

**Function**: Your code package and configuration
**Event**: JSON document triggering the function
**Runtime**: Language environment (Python 3.11, Node.js 18, etc.)
**Handler**: Entry point method in your code
**Execution Environment**: Isolated runtime instance

### Execution Model

```
Event Trigger → Lambda Service → Cold Start (if needed) → Execute Handler → Return Response
                                      ↓
                                Environment Reused (Warm Start)
```

### Function Anatomy

**Python Example**:
```python
import json

def lambda_handler(event, context):
    # event: Input data
    # context: Runtime information
    
    name = event.get('name', 'World')
    
    return {
        'statusCode': 200,
        'body': json.dumps(f'Hello {name}!')
    }
```

**Context Object**:
```python
context.function_name           # Function name
context.function_version        # Version
context.invoked_function_arn    # ARN
context.memory_limit_in_mb      # Memory allocation
context.request_id              # Unique request ID
context.log_group_name          # CloudWatch Log Group
context.log_stream_name         # CloudWatch Log Stream
context.get_remaining_time_in_millis()  # Time left
```

## Lambda Configuration

### Memory and CPU

**Memory**: 128 MB - 10,240 MB (10 GB) in 1 MB increments
**CPU**: Proportional to memory
- 128 MB = ~0.08 vCPU
- 1,792 MB = 1 vCPU
- 10,240 MB = 6 vCPU

**Important**: More memory = More CPU = Faster execution (potentially lower cost)

**Example Optimization**:
```
128 MB: 5 seconds execution = 640 MB-seconds = $0.00001067
1,024 MB: 1 second execution = 1,024 MB-seconds = $0.00001667

Choose 128 MB (37% cheaper) for memory-bound tasks
Choose 1,024 MB for CPU-bound tasks (faster completion)
```

### Timeout

**Range**: 1 second - 15 minutes (900 seconds)
**Default**: 3 seconds
**Best Practice**: Set based on expected execution time + buffer

### Ephemeral Storage (/tmp)

**Range**: 512 MB - 10,240 MB (10 GB)
**Default**: 512 MB
**Use**: Temporary file storage during execution
**Lifecycle**: Persists during warm starts, deleted after cold starts
**Cost**: $0.0000000309 per GB-second over 512 MB

**Example**:
```python
import os

def lambda_handler(event, context):
    # Download file
    with open('/tmp/data.csv', 'w') as f:
        f.write('data')
    
    # Process file
    with open('/tmp/data.csv', 'r') as f:
        data = f.read()
    
    return {'statusCode': 200}
```

### Environment Variables

**Configuration**:
```
KEY=VALUE
DB_HOST=mydb.us-east-1.rds.amazonaws.com
API_KEY=abc123
```

**Access in Code**:
```python
import os

db_host = os.environ['DB_HOST']
api_key = os.environ.get('API_KEY', 'default')
```

**Encryption**: Can encrypt with KMS key

**Best Practice**: 
- Store secrets in Secrets Manager or Parameter Store
- Reference ARN in environment variable
- Fetch at runtime (cache for warm starts)

### Execution Role (IAM)

**What**: IAM role assumed by Lambda function

**Trust Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
```

**Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:GetObject",
      "s3:PutObject"
    ],
    "Resource": "arn:aws:s3:::my-bucket/*"
  }]
}
```

**Managed Policies**:
- `AWSLambdaBasicExecutionRole`: CloudWatch Logs
- `AWSLambdaVPCAccessExecutionRole`: VPC access + CloudWatch Logs
- `AWSLambdaKinesisExecutionRole`: Kinesis stream read

## Lambda Invocation Types

### 1. Synchronous (Push)

**How**: Caller waits for response

**Triggers**:
- API Gateway
- Application Load Balancer
- Amazon Cognito
- AWS SDK (invoke API)
- CloudFront (Lambda@Edge)

**Behavior**:
- Wait for function completion
- Return value/error to caller
- Caller handles retries

**Example** (AWS SDK):
```python
import boto3
import json

lambda_client = boto3.client('lambda')

response = lambda_client.invoke(
    FunctionName='my-function',
    InvocationType='RequestResponse',  # Synchronous
    Payload=json.dumps({'key': 'value'})
)

result = json.loads(response['Payload'].read())
```

**Response Structure**:
```json
{
  "StatusCode": 200,
  "Payload": "\"Hello World!\"",
  "ExecutedVersion": "$LATEST"
}
```

**Error Handling**: 
- Function error: 200 status, error in payload
- Service error: 4xx/5xx status code

### 2. Asynchronous (Event)

**How**: Lambda queues event, returns immediately

**Triggers**:
- S3 events
- SNS
- EventBridge
- SES
- CloudFormation
- AWS Config

**Behavior**:
- Lambda queues event internally
- Retries on error (2 times)
- Can configure DLQ for failed events

**Example**:
```python
lambda_client.invoke(
    FunctionName='my-function',
    InvocationType='Event',  # Asynchronous
    Payload=json.dumps({'key': 'value'})
)
# Returns immediately, doesn't wait
```

**Retry Behavior**:
```
Attempt 1: Immediate
Attempt 2: After 1 minute
Attempt 3: After 2 minutes
If still fails → Dead Letter Queue (DLQ)
```

**Dead Letter Queue**:
```json
{
  "DeadLetterConfig": {
    "TargetArn": "arn:aws:sqs:us-east-1:123456789012:failed-events"
  }
}
```

**Destinations** (newer than DLQ):
```json
{
  "DestinationConfig": {
    "OnSuccess": {
      "Destination": "arn:aws:sqs:us-east-1:123456789012:success-queue"
    },
    "OnFailure": {
      "Destination": "arn:aws:sns:us-east-1:123456789012:failure-topic"
    }
  }
}
```

Supports: SQS, SNS, Lambda, EventBridge

### 3. Poll-Based (Stream/Queue)

**How**: Lambda polls source, batches events

**Triggers**:
- Kinesis Data Streams
- DynamoDB Streams
- SQS (standard and FIFO)
- Managed Streaming for Apache Kafka (MSK)
- Self-managed Apache Kafka
- Amazon MQ

**Event Source Mapping**:
```json
{
  "EventSourceArn": "arn:aws:kinesis:us-east-1:123456789012:stream/my-stream",
  "FunctionName": "my-function",
  "BatchSize": 100,
  "MaximumBatchingWindowInSeconds": 10,
  "StartingPosition": "LATEST",
  "ParallelizationFactor": 10
}
```

**Configuration**:
- **BatchSize**: Number of records per invocation (1-10,000)
- **BatchWindow**: Max time to gather batch (0-300 seconds)
- **Concurrent batches**: For Kinesis/DynamoDB Streams
- **On-failure destination**: SQS or SNS

**Stream Processing**:
```python
def lambda_handler(event, context):
    for record in event['Records']:
        # Kinesis
        data = base64.b64decode(record['kinesis']['data'])
        
        # DynamoDB Stream
        # new_image = record['dynamodb']['NewImage']
        
        # SQS
        # body = record['body']
        
        process(data)
    
    return {'batchItemFailures': []}  # Partial batch failure
```

**Error Handling**:
- Stream: Retries until success or data expires
- SQS: Retries, then to DLQ after maxReceiveCount
- Partial batch failures: Return failed records

## Lambda Concurrency

### Understanding Concurrency

**Concurrency**: Number of function instances executing simultaneously

**Account Limit**: 1,000 concurrent executions per region (soft limit)

**Calculation**:
```
Concurrency = (Invocations per second) × (Average execution time in seconds)

Example:
100 invocations/sec × 2 seconds = 200 concurrent executions
```

### Types of Concurrency

**1. Unreserved Concurrency**
- Default behavior
- Shares pool with all functions
- Can burst up to account limit

**2. Reserved Concurrency**
- Guaranteed capacity for function
- Reduces account pool by that amount
- Prevents function from using more

**Configuration**:
```json
{
  "FunctionName": "critical-function",
  "ReservedConcurrentExecutions": 100
}
```

**Use Cases**:
- Guarantee capacity for critical functions
- Limit concurrency (prevent downstream throttling)
- Cost control

**Example**:
```
Account limit: 1,000
Function A reserved: 200
Function B reserved: 100
Unreserved pool: 700 (for all other functions)
```

**3. Provisioned Concurrency**
- Pre-initialized execution environments
- Eliminates cold starts
- Always warm and ready

**Configuration**:
```json
{
  "FunctionName": "low-latency-function",
  "ProvisionedConcurrentExecutions": 50
}
```

**Cost**: 
- Provisioned: $0.0000041667 per GB-second
- Requests: $0.0000100 per request
- Duration: Same as normal Lambda

**Use Cases**:
- Latency-sensitive applications
- Predictable traffic patterns
- Eliminating cold starts

**Auto Scaling**:
```json
{
  "ServiceNamespace": "lambda",
  "ResourceId": "function:my-function:provisioned-alias",
  "ScalableDimension": "lambda:function:ProvisionedConcurrency",
  "MinCapacity": 5,
  "MaxCapacity": 100,
  "TargetTrackingScalingPolicyConfiguration": {
    "TargetValue": 0.70,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "LambdaProvisionedConcurrencyUtilization"
    }
  }
}
```

### Concurrency Throttling

**When throttled**:
- Synchronous: Returns 429 (TooManyRequestsException)
- Asynchronous: Retries automatically, then DLQ
- Stream: Retries until success or data expires

**Monitoring**:
- CloudWatch Metric: `ConcurrentExecutions`
- CloudWatch Metric: `Throttles`

## Cold Starts vs Warm Starts

### Cold Start

**What**: Creating new execution environment

**Phases**:
1. **Download code**: Retrieve from S3
2. **Start runtime**: Initialize runtime environment
3. **Run init code**: Code outside handler (imports, connections)
4. **Execute handler**: Run function code

**Duration**: 100ms - 10+ seconds (depends on runtime, code size, VPC)

**Factors**:
- Runtime (Java slowest, Python/Node.js fastest)
- Code package size
- VPC (adds 100ms-2s for ENI setup)
- Memory allocation (more = faster)
- Dependencies (fewer = faster)

### Warm Start

**What**: Reusing existing execution environment

**Duration**: Only handler execution time

**Environment Reuse**:
- /tmp directory contents persist
- Global variables persist
- Connections persist

**Optimization**:
```python
# OUTSIDE handler (runs once on cold start)
import boto3
s3 = boto3.client('s3')
db_connection = connect_to_db()

# INSIDE handler (runs every invocation)
def lambda_handler(event, context):
    # Reuse s3 client and db_connection
    data = s3.get_object(Bucket='bucket', Key='key')
    result = db_connection.query('SELECT * FROM table')
    return result
```

### Cold Start Optimization

**1. Minimize Package Size**:
- Remove unused dependencies
- Use Lambda Layers for shared code
- Exclude dev dependencies

**2. Choose Faster Runtime**:
- Python, Node.js: ~100-300ms
- Go, Rust: ~100-200ms
- Java, .NET: 1-10+ seconds

**3. Increase Memory**:
- More memory = More CPU = Faster cold start
- Test 512 MB vs 128 MB

**4. Avoid VPC (if possible)**:
- VPC adds ENI creation time
- Use VPC only when needed
- Consider PrivateLink for AWS services

**5. Use Provisioned Concurrency**:
- Eliminates cold starts entirely
- Costs more

**6. Lazy Loading**:
```python
# BAD: Import everything upfront
import pandas as pd
import numpy as np
import tensorflow as tf

# GOOD: Import only what's needed
def lambda_handler(event, context):
    if event['operation'] == 'ml':
        import tensorflow as tf
        # Use tf
```

**7. Optimize Init Code**:
```python
# BAD: Heavy init code
large_data = load_large_dataset()  # Runs on every cold start

# GOOD: Defer to runtime
large_data = None
def lambda_handler(event, context):
    global large_data
    if large_data is None:
        large_data = load_large_dataset()
    return process(large_data)
```

## Lambda Layers

### What are Layers?

**Purpose**: Share code and dependencies across functions

**Structure**:
```
layer.zip
└── python/          (for Python)
    └── lib/
        └── my_library/
```

**Benefits**:
- Reduce deployment package size
- Share common code
- Separate business logic from dependencies
- Faster deployments

### Creating Layers

**Example** (Python):
```bash
mkdir -p layer/python
cd layer/python
pip install requests -t .
cd ..
zip -r layer.zip python/

aws lambda publish-layer-version \
  --layer-name my-dependencies \
  --zip-file fileb://layer.zip \
  --compatible-runtimes python3.11
```

**Using Layer**:
```json
{
  "FunctionName": "my-function",
  "Layers": [
    "arn:aws:lambda:us-east-1:123456789012:layer:my-dependencies:1"
  ]
}
```

### Layer Limits

- Max 5 layers per function
- Total unzipped size: 250 MB (function + layers)
- Layer versions immutable

### Common Use Cases

**1. Dependencies Layer**:
```
Layer 1: requests, boto3, pandas
Layer 2: custom utilities
Function code: business logic only
```

**2. Common Libraries**:
```
Layer: Logging, monitoring, error handling
All functions: Use same layer
```

**3. Runtime Extensions**:
```
Layer: Monitoring agent (Datadog, New Relic)
All functions: Auto-instrumented
```

### AWS Provided Layers

**AWS Parameters and Secrets**:
```
arn:aws:lambda:us-east-1:177933569100:layer:AWS-Parameters-and-Secrets-Lambda-Extension:11
```

**AWS Lambda Insights**:
```
arn:aws:lambda:us-east-1:580247275435:layer:LambdaInsightsExtension:38
```

## Lambda Versions and Aliases

### Versions

**What**: Immutable snapshot of function code and configuration

**$LATEST**: Mutable version (default)
**Numbered Versions**: 1, 2, 3... (immutable)

**Publishing**:
```bash
aws lambda publish-version --function-name my-function
```

**ARN Format**:
```
Unqualified: arn:aws:lambda:us-east-1:123456789012:function:my-function
Qualified: arn:aws:lambda:us-east-1:123456789012:function:my-function:1
$LATEST: arn:aws:lambda:us-east-1:123456789012:function:my-function:$LATEST
```

**Use Cases**:
- Code rollback
- Testing new versions
- Gradual deployments

### Aliases

**What**: Pointer to version(s)

**Benefits**:
- Friendly names (prod, dev, staging)
- Blue/green deployments
- Traffic shifting
- Stable ARN for clients

**Creating**:
```bash
aws lambda create-alias \
  --function-name my-function \
  --name prod \
  --function-version 1
```

**ARN**:
```
arn:aws:lambda:us-east-1:123456789012:function:my-function:prod
```

### Traffic Shifting (Canary Deployments)

**Weighted Alias**:
```json
{
  "AliasName": "prod",
  "FunctionVersion": "2",
  "RoutingConfig": {
    "AdditionalVersionWeights": {
      "1": 0.90,
      "2": 0.10
    }
  }
}
```

**Result**:
- 90% of traffic → Version 1
- 10% of traffic → Version 2

**Gradual Rollout**:
```
Day 1: 95% v1, 5% v2
Day 2: 75% v1, 25% v2
Day 3: 50% v1, 50% v2
Day 4: 0% v1, 100% v2
```

**With CodeDeploy**:
```yaml
version: 0.0
Resources:
  - MyFunction:
      Type: AWS::Lambda::Function
      Properties:
        DeploymentPreference:
          Type: Canary10Percent5Minutes
          Alarms:
            - ErrorRateAlarm
          Hooks:
            PreTraffic: !Ref PreTrafficHook
            PostTraffic: !Ref PostTrafficHook
```

**Deployment Types**:
- **Canary10Percent30Minutes**: 10% for 30 min, then 100%
- **Canary10Percent5Minutes**: 10% for 5 min, then 100%
- **Linear10PercentEvery3Minutes**: +10% every 3 min
- **Linear10PercentEvery10Minutes**: +10% every 10 min
- **AllAtOnce**: Immediate

## Lambda Networking (VPC)

### Lambda in VPC

**Why**:
- Access private resources (RDS, ElastiCache, internal APIs)
- Outbound internet control via NAT

**Configuration**:
```json
{
  "VpcConfig": {
    "SubnetIds": ["subnet-abc123", "subnet-def456"],
    "SecurityGroupIds": ["sg-abc123"]
  }
}
```

**How it Works**:
```
Lambda Execution Environment
    ↓ (ENI in VPC)
Private Subnet → NAT Gateway → Internet Gateway
              → RDS, ElastiCache, etc.
```

**Important**:
- Lambda creates ENI (Elastic Network Interface) in your VPC
- Use private subnets (recommended)
- Need NAT Gateway for internet access
- Security groups control access

### Cold Start Impact

**Without VPC**: 100-300ms
**With VPC**: 100ms-2s additional (ENI creation)

**Mitigation**:
- AWS improved VPC networking (2019) - now much faster
- Use Provisioned Concurrency
- Reuse ENIs across invocations

### VPC Best Practices

**1. Use Private Subnets**:
```
Public Subnet: NAT Gateway
Private Subnet: Lambda functions
            ↓
        RDS, ElastiCache
```

**2. Separate Security Groups**:
```
Lambda SG: Outbound to RDS SG on port 3306
RDS SG: Inbound from Lambda SG on port 3306
```

**3. Multiple AZs**:
```
VPC
├── AZ-1: Private Subnet (Lambda ENI)
├── AZ-2: Private Subnet (Lambda ENI)
└── AZ-3: Private Subnet (Lambda ENI)
```

**4. VPC Endpoints for AWS Services**:
```
Lambda (VPC) → VPC Endpoint → S3, DynamoDB (no internet needed)
```

Cost Savings: No NAT Gateway charges for AWS service traffic

### Non-VPC Alternative: PrivateLink

**For AWS Services**:
```
Lambda (No VPC) → PrivateLink → RDS Proxy
                              → ECS tasks
                              → Custom API
```

## Lambda Monitoring and Logging

### CloudWatch Logs

**Automatic Logging**:
- `print()` statements (Python)
- `console.log()` (Node.js)
- `System.out.println()` (Java)

**Log Group**: `/aws/lambda/function-name`
**Log Stream**: `YYYY/MM/DD/[$LATEST]instance-id`

**Permissions Needed**:
```json
{
  "Effect": "Allow",
  "Action": [
    "logs:CreateLogGroup",
    "logs:CreateLogStream",
    "logs:PutLogEvents"
  ],
  "Resource": "arn:aws:logs:*:*:*"
}
```

**Structured Logging**:
```python
import json

def lambda_handler(event, context):
    log_data = {
        'level': 'INFO',
        'message': 'Processing request',
        'request_id': context.request_id,
        'user_id': event.get('user_id')
    }
    print(json.dumps(log_data))
```

### CloudWatch Metrics

**Standard Metrics** (Free):
- **Invocations**: Number of times invoked
- **Duration**: Execution time
- **Errors**: Number of errors
- **Throttles**: Throttled invocations
- **ConcurrentExecutions**: Concurrent executions
- **DeadLetterErrors**: Failed async events

**Custom Metrics**:
```python
import boto3

cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    # Your logic
    items_processed = 100
    
    cloudwatch.put_metric_data(
        Namespace='MyApp',
        MetricData=[{
            'MetricName': 'ItemsProcessed',
            'Value': items_processed,
            'Unit': 'Count'
        }]
    )
```

**Embedded Metric Format (EMF)**:
```python
def lambda_handler(event, context):
    metrics = {
        '_aws': {
            'Timestamp': int(time.time() * 1000),
            'CloudWatchMetrics': [{
                'Namespace': 'MyApp',
                'Dimensions': [['FunctionName']],
                'Metrics': [{'Name': 'ItemsProcessed', 'Unit': 'Count'}]
            }]
        },
        'FunctionName': context.function_name,
        'ItemsProcessed': 100
    }
    print(json.dumps(metrics))
```

### X-Ray Tracing

**Enable**:
```json
{
  "TracingConfig": {
    "Mode": "Active"
  }
}
```

**Permissions**:
```json
{
  "Effect": "Allow",
  "Action": [
    "xray:PutTraceSegments",
    "xray:PutTelemetryRecords"
  ],
  "Resource": "*"
}
```

**Instrumentation**:
```python
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()  # Auto-instrument boto3, requests

@xray_recorder.capture('process_data')
def process_data(data):
    # This section will be traced
    return data

def lambda_handler(event, context):
    result = process_data(event['data'])
    return result
```

**Benefits**:
- End-to-end request tracing
- Service map visualization
- Performance bottleneck identification
- Error analysis

### Lambda Insights

**What**: Enhanced monitoring and troubleshooting

**Provides**:
- CPU, memory, disk, network metrics
- Cold starts
- Worker threads
- Code package size

**Enable**:
```bash
aws lambda update-function-configuration \
  --function-name my-function \
  --layers arn:aws:lambda:us-east-1:580247275435:layer:LambdaInsightsExtension:38
```

**Cost**: $0.00012 per function execution

## Lambda Pricing

### Pricing Components

**1. Request Charges**:
- $0.20 per 1 million requests
- Free tier: 1 million requests per month

**2. Duration Charges**:
- $0.0000166667 per GB-second
- Free tier: 400,000 GB-seconds per month

**3. Provisioned Concurrency** (optional):
- $0.0000041667 per GB-second
- $0.015 per GB-hour

**4. Ephemeral Storage** (over 512 MB):
- $0.0000000309 per GB-second

### Cost Calculation Examples

**Example 1: Simple API**
```
Specifications:
- 1 million requests/month
- 512 MB memory
- 200ms average duration

Request cost: 1M × $0.20/1M = $0.20
Duration cost: 1M × 0.2s × 0.5GB × $0.0000166667 = $1.67
Total: $1.87/month

Free tier covers this completely!
```

**Example 2: Data Processing**
```
Specifications:
- 10 million requests/month
- 1,024 MB memory
- 3 seconds average duration

Request cost: 10M × $0.20/1M = $2.00
Duration cost: 10M × 3s × 1GB × $0.0000166667 = $500.00
Total: $502.00/month
```

**Example 3: With Provisioned Concurrency**
```
Specifications:
- 50 provisioned concurrent executions
- 1,024 MB memory
- 24/7 for 30 days

Provisioned cost: 50 × 1GB × 720 hours × $0.015 = $540/month
Plus normal request and duration charges
```

### Cost Optimization

**1. Right-Size Memory**:
```
Test with different memory settings:
128 MB: 5 seconds = 640 MB-seconds = $0.000011
1,024 MB: 1 second = 1,024 MB-seconds = $0.000017

Choose based on total cost, not just unit cost
```

**2. Reduce Execution Time**:
- Optimize code
- Use faster runtimes
- Remove unused dependencies
- Reuse connections

**3. Batch Processing**:
```
Instead of: 1,000 invocations × 100ms = 100,000ms
Do: 100 invocations × 1,000ms = 100,000ms (fewer requests)

Saves on request charges
```

**4. Use Compute Savings Plan**:
- 1 or 3-year commitment
- Up to 17% discount
- Applies to Lambda, Fargate, EC2

**5. Avoid Over-Provisioning**:
- Don't use Provisioned Concurrency unless needed
- Monitor cold start impact vs cost

## Lambda Limits

### Per Function

| Limit | Value |
|-------|-------|
| Memory | 128 MB - 10,240 MB |
| Timeout | 15 minutes max |
| Ephemeral storage (/tmp) | 512 MB - 10,240 MB |
| Deployment package size | 50 MB (zipped), 250 MB (unzipped) |
| Container image size | 10 GB |
| Environment variables | 4 KB total |
| Layers | 5 max per function |

### Per Account (Regional)

| Limit | Value | Type |
|-------|-------|------|
| Concurrent executions | 1,000 | Soft (increasable) |
| Function storage | 75 GB | Soft (increasable) |
| Elastic network interfaces (VPC) | 250 per VPC | Soft (increasable) |

### Per Invocation

| Limit | Value |
|-------|-------|
| Invocation payload (request) | 6 MB (sync), 256 KB (async) |
| Invocation payload (response) | 6 MB |
| Event batch size (Kinesis) | 10 MB |
| Event batch size (SQS) | 256 KB - 10 MB |

## Lambda Event Source Integrations

### S3 Events

**Configuration**:
```json
{
  "LambdaFunctionConfigurations": [{
    "LambdaFunctionArn": "arn:aws:lambda:us-east-1:123456789012:function:ProcessImage",
    "Events": ["s3:ObjectCreated:*"],
    "Filter": {
      "Key": {
        "FilterRules": [
          {"Name": "prefix", "Value": "uploads/"},
          {"Name": "suffix", "Value": ".jpg"}
        ]
      }
    }
  }]
}
```

**Event Structure**:
```json
{
  "Records": [{
    "s3": {
      "bucket": {"name": "my-bucket"},
      "object": {
        "key": "uploads/photo.jpg",
        "size": 1024
      }
    }
  }]
}
```

**Use Case**: Image resize, file processing, metadata extraction

### API Gateway

**REST API**:
```python
def lambda_handler(event, context):
    body = json.loads(event['body'])
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'message': 'Success'})
    }
```

**HTTP API** (simpler, cheaper):
```python
def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Success'})
    }
```

### DynamoDB Streams

**Event Source Mapping**:
```json
{
  "EventSourceArn": "arn:aws:dynamodb:us-east-1:123456789012:table/MyTable/stream/2024-01-01T00:00:00.000",
  "FunctionName": "ProcessDynamoDBStream",
  "StartingPosition": "LATEST",
  "BatchSize": 100,
  "ParallelizationFactor": 10
}
```

**Event Structure**:
```python
def lambda_handler(event, context):
    for record in event['Records']:
        if record['eventName'] == 'INSERT':
            new_item = record['dynamodb']['NewImage']
            # Process new item
        elif record['eventName'] == 'MODIFY':
            old_item = record['dynamodb']['OldImage']
            new_item = record['dynamodb']['NewImage']
            # Process change
        elif record['eventName'] == 'REMOVE':
            old_item = record['dynamodb']['OldImage']
            # Process deletion
```

### SQS

**Standard Queue**:
```json
{
  "EventSourceArn": "arn:aws:sqs:us-east-1:123456789012:my-queue",
  "FunctionName": "ProcessQueue",
  "BatchSize": 10,
  "MaximumBatchingWindowInSeconds": 5
}
```

**FIFO Queue**:
```json
{
  "EventSourceArn": "arn:aws:sqs:us-east-1:123456789012:my-queue.fifo",
  "FunctionName": "ProcessQueue",
  "BatchSize": 10
}
```

**Processing**:
```python
def lambda_handler(event, context):
    for record in event['Records']:
        body = json.loads(record['body'])
        process(body)
    
    # Return partial batch failures
    return {
        'batchItemFailures': [
            {'itemIdentifier': record['messageId']}
        ]
    }
```

### EventBridge (CloudWatch Events)

**Scheduled**:
```json
{
  "ScheduleExpression": "rate(5 minutes)",
  "Target": {
    "Arn": "arn:aws:lambda:us-east-1:123456789012:function:ScheduledTask"
  }
}
```

**Event Pattern**:
```json
{
  "EventPattern": {
    "source": ["aws.ec2"],
    "detail-type": ["EC2 Instance State-change Notification"],
    "detail": {
      "state": ["terminated"]
    }
  },
  "Target": {
    "Arn": "arn:aws:lambda:us-east-1:123456789012:function:HandleEC2Termination"
  }
}
```

### Kinesis Data Streams

**Configuration**:
```json
{
  "EventSourceArn": "arn:aws:kinesis:us-east-1:123456789012:stream/my-stream",
  "FunctionName": "ProcessStream",
  "StartingPosition": "LATEST",
  "BatchSize": 100,
  "ParallelizationFactor": 10,
  "MaximumRecordAgeInSeconds": 3600,
  "MaximumRetryAttempts": 3,
  "BisectBatchOnFunctionError": true
}
```

**Processing**:
```python
import base64

def lambda_handler(event, context):
    for record in event['Records']:
        data = base64.b64decode(record['kinesis']['data'])
        process(data)
```

## Lambda Best Practices

### 1. Separate Handler from Business Logic

```python
# BAD
def lambda_handler(event, context):
    # 100 lines of business logic
    pass

# GOOD
def process_order(order_data):
    # Business logic
    pass

def lambda_handler(event, context):
    order = event['order']
    result = process_order(order)
    return result
```

### 2. Use Environment Variables for Configuration

```python
import os

DB_HOST = os.environ['DB_HOST']
API_KEY = os.environ['API_KEY']

def lambda_handler(event, context):
    # Use DB_HOST, API_KEY
    pass
```

### 3. Reuse Connections

```python
# Initialize outside handler
import boto3
s3 = boto3.client('s3')

# Database connection pool
connection = create_db_connection()

def lambda_handler(event, context):
    # Reuse s3 client and connection
    data = s3.get_object(Bucket='bucket', Key='key')
    result = connection.query('SELECT * FROM table')
```

### 4. Handle Errors Gracefully

```python
def lambda_handler(event, context):
    try:
        result = risky_operation()
        return {'statusCode': 200, 'body': json.dumps(result)}
    except ValueError as e:
        print(f"Validation error: {e}")
        return {'statusCode': 400, 'body': json.dumps({'error': str(e)})}
    except Exception as e:
        print(f"Unexpected error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': 'Internal error'})}
```

### 5. Use Dead Letter Queues

```json
{
  "DeadLetterConfig": {
    "TargetArn": "arn:aws:sqs:us-east-1:123456789012:function-dlq"
  }
}
```

### 6. Implement Idempotency

```python
import hashlib

processed_ids = {}

def lambda_handler(event, context):
    # Generate idempotency key
    event_id = hashlib.md5(json.dumps(event).encode()).hexdigest()
    
    if event_id in processed_ids:
        print(f"Already processed {event_id}")
        return processed_ids[event_id]
    
    result = process_event(event)
    processed_ids[event_id] = result
    
    return result
```

### 7. Use Parameter Store or Secrets Manager

```python
import boto3

ssm = boto3.client('ssm')

def get_parameter(name):
    response = ssm.get_parameter(Name=name, WithDecryption=True)
    return response['Parameter']['Value']

# Cache outside handler
DB_PASSWORD = None

def lambda_handler(event, context):
    global DB_PASSWORD
    if DB_PASSWORD is None:
        DB_PASSWORD = get_parameter('/myapp/db/password')
    
    # Use DB_PASSWORD
```

### 8. Minimize Package Size

```bash
# Include only necessary files
zip -r function.zip lambda_function.py
zip -r function.zip -x "tests/*" "*.pyc" "__pycache__/*"

# Use Lambda Layers for dependencies
# Keep function code small
```

### 9. Set Appropriate Timeouts

```
API operations: 3-30 seconds
File processing: 1-5 minutes
Batch jobs: 10-15 minutes

Don't use max timeout (15 min) unless needed
```

### 10. Monitor and Alert

```json
{
  "MetricName": "Errors",
  "Namespace": "AWS/Lambda",
  "Statistic": "Sum",
  "Period": 300,
  "EvaluationPeriods": 2,
  "Threshold": 10,
  "ComparisonOperator": "GreaterThanThreshold",
  "AlarmActions": ["arn:aws:sns:us-east-1:123456789012:alerts"]
}
```

## Lambda Container Images

### What are Container Images?

**Alternative to ZIP**: Package Lambda as Docker container

**Benefits**:
- Familiar Docker workflow
- Up to 10 GB size (vs 250 MB unzipped for ZIP)
- Include large dependencies
- Consistency across environments

### Creating Container Image

**Dockerfile**:
```dockerfile
FROM public.ecr.aws/lambda/python:3.11

# Copy requirements and install
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy function code
COPY app.py ${LAMBDA_TASK_ROOT}

# Set handler
CMD ["app.lambda_handler"]
```

**Build and Push**:
```bash
# Build
docker build -t my-lambda-function .

# Test locally
docker run -p 9000:8080 my-lambda-function

# Tag
docker tag my-lambda-function:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-lambda-function:latest

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-lambda-function:latest
```

**Create Function**:
```bash
aws lambda create-function \
  --function-name my-function \
  --package-type Image \
  --code ImageUri=123456789012.dkr.ecr.us-east-1.amazonaws.com/my-lambda-function:latest \
  --role arn:aws:iam::123456789012:role/lambda-role
```

### When to Use Container Images

**Use Container Images**:
- Large dependencies (ML models, libraries)
- Need specific OS packages
- Existing Docker workflow
- Share images with ECS/EKS

**Use ZIP**:
- Small functions (<250 MB)
- Simple dependencies
- Faster cold starts
- In-console code editing

## Lambda@Edge and CloudFront Functions

### Lambda@Edge

**What**: Run Lambda at CloudFront edge locations

**Use Cases**:
- Modify requests/responses
- A/B testing
- User authentication
- SEO optimization
- Bot detection

**Triggers**:
- **Viewer Request**: After CloudFront receives request
- **Origin Request**: Before forwarding to origin
- **Origin Response**: After receiving from origin
- **Viewer Response**: Before returning to viewer

**Limitations**:
- Timeout: 5 seconds (viewer), 30 seconds (origin)
- Memory: 128 MB - 10,240 MB
- No environment variables
- No VPC access
- Deployment to us-east-1 only

**Example** (Add security headers):
```python
def lambda_handler(event, context):
    response = event['Records'][0]['cf']['response']
    headers = response['headers']
    
    headers['strict-transport-security'] = [{
        'key': 'Strict-Transport-Security',
        'value': 'max-age=63072000; includeSubdomains; preload'
    }]
    
    return response
```

### CloudFront Functions

**What**: Lightweight functions for simple transformations

**vs Lambda@Edge**:
| Feature | CloudFront Functions | Lambda@Edge |
|---------|---------------------|-------------|
| Runtime | JavaScript only | Node.js, Python |
| Max duration | <1 ms | 5-30 seconds |
| Max memory | 2 MB | 128 MB - 10 GB |
| Scale | Millions/sec | Thousands/sec |
| Network access | No | Yes |
| File system | No | Yes |
| Cost | $0.10 per 1M | $0.60 per 1M |
| Use case | Simple transforms | Complex logic |

**Example**:
```javascript
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Redirect to /index.html
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    }
    
    return request;
}
```

## Real-World Scenarios

### Scenario 1: Image Processing Pipeline

**Requirements**:
- Users upload images to S3
- Create thumbnail, compress
- Update database
- Send notification

**Solution**:
```
User → S3 (upload) → S3 Event → Lambda
                                   ↓
                          1. Download image
                          2. Create thumbnail
                          3. Compress original
                          4. Upload both to S3
                          5. Update DynamoDB
                          6. Send SNS notification

Configuration:
- Memory: 1,024 MB (image processing needs RAM)
- Timeout: 60 seconds
- /tmp storage: 2 GB (for temp files)
- Concurrency: Reserved 50 (prevent S3 throttling)
```

**Cost** (10,000 images/month, avg 3s):
- Requests: 10,000 × $0.20/1M = $0.002
- Duration: 10,000 × 3s × 1GB × $0.0000166667 = $0.50
- Total: ~$0.50/month

### Scenario 2: Serverless API Backend

**Requirements**:
- REST API
- Authentication
- Database access
- Low latency (<100ms)

**Solution**:
```
Client → API Gateway → Lambda → DynamoDB
         (REST API)     ↓
                    Cognito (auth)
                    
Configuration:
- Memory: 512 MB
- Timeout: 29 seconds (API Gateway max)
- Provisioned Concurrency: 10 (avoid cold starts)
- Environment: DB_TABLE, COGNITO_POOL_ID
```

**Cost** (1M requests/month, avg 200ms):
- Requests: 1M × $0.20/1M = $0.20
- Duration: 1M × 0.2s × 0.5GB × $0.0000166667 = $1.67
- Provisioned: 10 × 0.5GB × 720h × $0.015 = $54
- API Gateway: 1M × $1/1M = $1
- Total: ~$57/month

### Scenario 3: Real-time Stream Processing

**Requirements**:
- Process Kinesis stream
- Aggregate data
- Store in database
- Handle high throughput

**Solution**:
```
Data Sources → Kinesis → Lambda → DynamoDB
 (IoT, logs)    Stream     ↓
                       Aggregate
                       (batches of 100)

Event Source Mapping:
- BatchSize: 100
- ParallelizationFactor: 10
- MaximumRetryAttempts: 3
- BisectBatchOnFunctionError: true
- DestinationConfig: DLQ for failures

Configuration:
- Memory: 1,024 MB
- Timeout: 300 seconds
- Reserved Concurrency: 100
```

**Cost** (100M records/month, 1s per batch):
- Invocations: 1M (batches)
- Requests: 1M × $0.20/1M = $0.20
- Duration: 1M × 1s × 1GB × $0.0000166667 = $16.67
- Total: ~$17/month

### Scenario 4: Scheduled Data Backup

**Requirements**:
- Daily backup at 2 AM
- Export RDS data to S3
- Compress and encrypt
- Retain 30 days

**Solution**:
```
EventBridge → Lambda → RDS (export to S3)
(cron: 0 2 * * ? *)     ↓
                    S3 (encrypted)
                    
Lifecycle: Delete after 30 days

Configuration:
- Memory: 2,048 MB
- Timeout: 900 seconds (15 min)
- VPC: Yes (RDS access)
- Environment: DB_HOST, BUCKET_NAME
```

**Cost** (1 execution/day, 10 minutes):
- Requests: 30 × $0.20/1M = negligible
- Duration: 30 × 600s × 2GB × $0.0000166667 = $0.60
- Total: ~$0.60/month

### Scenario 5: Serverless Batch Processing

**Requirements**:
- Process CSV files (1 GB each)
- Transform data
- Load into Redshift
- Cost-effective

**Solution**:
```
S3 (CSV upload) → Lambda → Process chunks
                    ↓
                  S3 (transformed)
                    ↓
                  COPY to Redshift

Optimization:
- Use S3 Select (filter before download)
- Process in chunks
- Parallel invocations

Configuration:
- Memory: 3,008 MB
- Timeout: 900 seconds
- /tmp: 10 GB
- Concurrency: Unreserved (burst)
```

**Cost** (100 files/month, 5 min avg):
- Requests: 100 × $0.20/1M = negligible
- Duration: 100 × 300s × 3GB × $0.0000166667 = $1.50
- Total: ~$1.50/month

## Lambda vs Alternatives

### Lambda vs EC2

| Factor | Lambda | EC2 |
|--------|--------|-----|
| Management | Serverless | Manual |
| Scaling | Automatic | Manual/ASG |
| Cost | Per execution | Per hour |
| Timeout | 15 min max | Unlimited |
| State | Stateless | Stateful possible |
| Use Case | Event-driven | Long-running |

### Lambda vs Fargate

| Factor | Lambda | Fargate |
|--------|--------|---------|
| Unit | Function | Container |
| Timeout | 15 min | Unlimited |
| Cost | Per execution | Per second (always running) |
| Scaling | Instant | Container-level |
| Use Case | Short tasks | Microservices |

### Lambda vs Step Functions

| Factor | Lambda | Step Functions |
|--------|--------|----------------|
| Purpose | Execute code | Orchestrate workflows |
| Duration | 15 min | 1 year |
| State | Function-level | Workflow-level |
| Use Together | Yes (Step Functions invoke Lambda) |

## Exam Tips (SAP-C02)

### Key Points

**Invocation Types**:
- **Synchronous**: API Gateway, ALB, SDK (wait for response)
- **Asynchronous**: S3, SNS, EventBridge (queued, retried)
- **Poll-based**: Kinesis, DynamoDB Streams, SQS (batched)

**Concurrency**:
- **Reserved**: Guarantee + limit
- **Provisioned**: Eliminate cold starts
- **Unreserved**: Shared pool

**Cold Start Optimization**:
- Increase memory (more CPU)
- Minimize package size
- Avoid VPC (if possible)
- Use Provisioned Concurrency
- Choose faster runtime

**Error Handling**:
- Synchronous: Caller handles retry
- Asynchronous: Lambda retries 2x, then DLQ
- Stream: Retries until success or expires

**Security**:
- Execution role: What Lambda can do
- Resource policy: Who can invoke Lambda
- VPC: Access private resources
- Environment variables: Can be encrypted with KMS

**Cost Optimization**:
- Right-size memory
- Reduce execution time
- Batch processing (fewer requests)
- Avoid Provisioned Concurrency unless needed

**Limits**:
- 15-minute timeout
- 10 GB memory max
- 250 MB unzipped package (10 GB container)
- 1,000 concurrent executions per region

### Common Scenarios

**"Low latency API"**: Provisioned Concurrency
**"Process S3 uploads"**: Asynchronous invocation
**"Process stream in order"**: Kinesis/DynamoDB Streams
**"Long-running workflow"**: Step Functions (not Lambda alone)
**"Access private RDS"**: Lambda in VPC
**"Large ML model"**: Container image, increase memory/storage
**"Cost optimization"**: Right-size, avoid Provisioned, batch processing
**"Cannot lose events"**: DLQ/Destinations, SQS source

This comprehensive guide covers Lambda from basics to advanced patterns for SAP-C02 exam success.
