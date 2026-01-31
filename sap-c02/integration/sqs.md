# Amazon SQS (Simple Queue Service)

## What is SQS?

Amazon Simple Queue Service (SQS) is a fully managed message queuing service that enables decoupling of distributed systems, microservices, and serverless applications. It allows you to send, store, and receive messages between software components without losing messages or requiring other services to be available.

## Why Use SQS?

### Key Benefits
- **Fully Managed**: No infrastructure to provision
- **Scalability**: Unlimited throughput, unlimited messages
- **Reliability**: 99.9% SLA, message durability
- **Security**: Encryption at rest and in transit
- **Cost-Effective**: Pay per request
- **Decoupling**: Loosely coupled architectures
- **At-Least-Once Delivery**: Messages delivered reliably

### Use Cases
- Decouple microservices
- Buffer writes to database
- Batch processing jobs
- Asynchronous task processing
- Load leveling (handle traffic spikes)
- Fanout patterns (with SNS)
- Order processing systems

## Queue Types

### Standard Queues

**Characteristics**:
- **Unlimited Throughput**: Process millions of messages/second
- **At-Least-Once Delivery**: Message delivered at least once (may duplicate)
- **Best-Effort Ordering**: Messages generally in order, not guaranteed

**Use Cases**:
- High throughput needed
- Duplicates acceptable (idempotent processing)
- Ordering not critical

**Example**:
```
Producer → Queue → Consumer

Messages sent: A, B, C
Messages received: A, B, C (typical)
Possible: A, B, C, B (duplicate)
Possible: A, C, B (out of order)
```

**Performance**:
- Throughput: Unlimited
- Latency: <10 ms (send/receive)

**Cost** (us-east-1):
- $0.40 per million requests (after free tier)
- Free tier: 1 million requests/month

### FIFO Queues

**Characteristics**:
- **Exactly-Once Processing**: No duplicates
- **Ordering Guaranteed**: Messages processed in exact order sent
- **Limited Throughput**: 300 TPS (or 3,000 TPS with batching)
- **Message Groups**: Ordering within groups

**Use Cases**:
- Ordering critical (e.g., financial transactions)
- No duplicates allowed
- Sequential processing needed

**Example**:
```
Messages sent: A, B, C
Messages received: A, B, C (always, in order)

Never: A, B, C, B (no duplicates)
Never: A, C, B (no reordering)
```

**Naming**:
- Queue name must end with `.fifo`
- Example: `orders.fifo`

**Message Groups**:
```
Group 1: A1, A2, A3 (processed in order within group)
Group 2: B1, B2, B3 (processed in order within group)

Groups can be processed in parallel:
  Consumer 1: A1, A2, A3
  Consumer 2: B1, B2, B3
```

**Deduplication**:
- **Content-Based**: SHA-256 hash of message body
- **Message Deduplication ID**: Explicit ID provided
- Deduplication interval: 5 minutes

**Cost**:
- $0.50 per million requests (25% more than standard)

### Standard vs FIFO

| Feature | Standard | FIFO |
|---------|----------|------|
| Throughput | Unlimited | 300 TPS (3,000 batch) |
| Delivery | At-least-once | Exactly-once |
| Ordering | Best-effort | Guaranteed |
| Duplicates | Possible | No |
| Cost | $0.40/M | $0.50/M |
| Use case | High throughput | Ordering critical |

## Core Concepts

### Messages

**Max Size**: 256 KB (text, JSON, XML)

**Larger Messages**:
- Use Extended Client Library
- Message metadata in SQS, actual data in S3
- Supports up to 2 GB

**Message Attributes**:
```json
{
  "MessageBody": "Order details",
  "MessageAttributes": {
    "Priority": {
      "DataType": "Number",
      "StringValue": "1"
    },
    "OrderType": {
      "DataType": "String",
      "StringValue": "Express"
    }
  }
}
```

**Message Retention**:
- Min: 60 seconds (1 minute)
- Max: 1,209,600 seconds (14 days)
- Default: 345,600 seconds (4 days)

### Visibility Timeout

**What**: Time message is invisible after consumer receives it

**Purpose**: Prevent other consumers from processing same message

**Flow**:
```
1. Consumer receives message
2. Message becomes invisible (visibility timeout starts)
3. Consumer processes message
4. Consumer deletes message (processing complete)

If consumer fails:
  - Visibility timeout expires
  - Message becomes visible again
  - Another consumer can process it
```

**Default**: 30 seconds
**Max**: 12 hours

**Change Visibility** (During Processing):
```python
import boto3

sqs = boto3.client('sqs')

# Receive message
response = sqs.receive_message(QueueUrl=queue_url)
message = response['Messages'][0]

# Processing takes longer than expected
# Extend visibility timeout
sqs.change_message_visibility(
    QueueUrl=queue_url,
    ReceiptHandle=message['ReceiptHandle'],
    VisibilityTimeout=60  # Extend to 60 seconds
)
```

**Best Practice**:
- Set visibility timeout to max processing time
- If processing longer: Extend visibility timeout
- If processing done: Delete message immediately

### Polling

**Short Polling** (Default):
- Returns immediately (even if no messages)
- May not return all available messages
- More requests = higher cost

**Long Polling** (Recommended):
- Waits for messages (up to 20 seconds)
- Returns all available messages
- Fewer requests = lower cost

**Configuration**:
```python
# Long polling (WaitTimeSeconds > 0)
response = sqs.receive_message(
    QueueUrl=queue_url,
    MaxNumberOfMessages=10,
    WaitTimeSeconds=20  # Long polling (wait up to 20 seconds)
)

# Short polling (WaitTimeSeconds = 0)
response = sqs.receive_message(
    QueueUrl=queue_url,
    WaitTimeSeconds=0  # Return immediately
)
```

**Queue-Level Setting**:
```
ReceiveMessageWaitTimeSeconds = 20 (enable long polling by default)
```

**Benefits**:
```
Short polling: 100 requests (some empty)
Long polling: 10 requests (all with messages)

Cost savings: 90% reduction in requests
```

### Dead-Letter Queues (DLQ)

**What**: Queue for messages that fail processing

**Purpose**: 
- Debug problematic messages
- Prevent infinite retries
- Isolate poison pills

**Configuration**:
```json
{
  "RedrivePolicy": {
    "deadLetterTargetArn": "arn:aws:sqs:us-east-1:123456789012:my-dlq",
    "maxReceiveCount": 5
  }
}
```

**Flow**:
```
1. Message sent to main queue
2. Consumer receives message
3. Processing fails, message returned to queue
4. Retry (up to maxReceiveCount times)
5. After 5 failures: Move to DLQ
```

**Monitoring**:
```
CloudWatch Metric: ApproximateNumberOfMessagesVisible (DLQ)
Alarm: DLQ message count > 0

Action: Alert team to investigate failed messages
```

**Processing DLQ**:
```python
# Debug failed messages
response = sqs.receive_message(QueueUrl=dlq_url)
for message in response.get('Messages', []):
    # Analyze why message failed
    print(message['Body'])
    
    # Fix issue, reprocess or discard
    # Delete from DLQ
    sqs.delete_message(
        QueueUrl=dlq_url,
        ReceiptHandle=message['ReceiptHandle']
    )
```

**Best Practices**:
- Always configure DLQ for production
- Set maxReceiveCount: 3-5
- Monitor DLQ regularly
- Analyze and fix root causes

## Message Operations

### Sending Messages

**Single Message**:
```python
import boto3
import json

sqs = boto3.client('sqs')

response = sqs.send_message(
    QueueUrl=queue_url,
    MessageBody=json.dumps({'order_id': '12345', 'amount': 99.99}),
    MessageAttributes={
        'Priority': {
            'DataType': 'Number',
            'StringValue': '1'
        }
    }
)
```

**Batch Send** (Up to 10 messages):
```python
response = sqs.send_message_batch(
    QueueUrl=queue_url,
    Entries=[
        {
            'Id': '1',
            'MessageBody': json.dumps({'order_id': '001'}),
        },
        {
            'Id': '2',
            'MessageBody': json.dumps({'order_id': '002'}),
        },
        # ... up to 10 messages
    ]
)
```

**FIFO Queue** (With Message Group):
```python
response = sqs.send_message(
    QueueUrl=fifo_queue_url,
    MessageBody=json.dumps({'order_id': '12345'}),
    MessageGroupId='order-group-1',  # Required for FIFO
    MessageDeduplicationId='unique-id-12345'  # Or use content-based
)
```

### Receiving Messages

**Receive**:
```python
response = sqs.receive_message(
    QueueUrl=queue_url,
    MaxNumberOfMessages=10,  # Max 10 messages at once
    WaitTimeSeconds=20,  # Long polling
    MessageAttributeNames=['All']  # Receive all attributes
)

messages = response.get('Messages', [])
for message in messages:
    # Process message
    body = json.loads(message['Body'])
    print(f"Processing order: {body['order_id']}")
    
    # Delete after processing
    sqs.delete_message(
        QueueUrl=queue_url,
        ReceiptHandle=message['ReceiptHandle']
    )
```

**Batch Delete** (Up to 10 messages):
```python
sqs.delete_message_batch(
    QueueUrl=queue_url,
    Entries=[
        {'Id': '1', 'ReceiptHandle': receipt_handle_1},
        {'Id': '2', 'ReceiptHandle': receipt_handle_2},
    ]
)
```

### Delay Queues

**What**: Delay message delivery to consumers

**Use Cases**:
- Scheduled processing
- Rate limiting
- Retry with backoff

**Queue-Level Delay**:
```
DelaySeconds = 300 (all messages delayed 5 minutes)
```

**Message-Level Delay**:
```python
sqs.send_message(
    QueueUrl=queue_url,
    MessageBody='Process this in 5 minutes',
    DelaySeconds=300  # Delay this specific message
)
```

**Max Delay**: 15 minutes (900 seconds)

**FIFO Limitation**: No per-message delay (queue-level only)

## Security

### Encryption

**Encryption at Rest** (SSE-SQS):
- AWS-managed keys
- Automatic encryption
- No additional cost

**Encryption at Rest** (SSE-KMS):
- Customer-managed KMS keys
- More control
- KMS charges apply

**Encryption in Transit**:
- HTTPS endpoints
- Always encrypted

**Configuration**:
```
Queue → Encryption → Server-side encryption: Enabled
Key: AWS managed (default) or Customer managed (KMS key)
```

### Access Policies

**IAM Policies**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage"
      ],
      "Resource": "arn:aws:sqs:us-east-1:123456789012:my-queue"
    }
  ]
}
```

**Queue Policies** (Resource-based):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:user/alice"
      },
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:123456789012:my-queue"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "sns.amazonaws.com"
      },
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:123456789012:my-queue",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "arn:aws:sns:us-east-1:123456789012:my-topic"
        }
      }
    }
  ]
}
```

**Cross-Account Access**:
```json
{
  "Effect": "Allow",
  "Principal": {
    "AWS": "arn:aws:iam::ACCOUNT-B:root"
  },
  "Action": "sqs:*",
  "Resource": "arn:aws:sqs:us-east-1:ACCOUNT-A:shared-queue"
}
```

## Integration Patterns

### SQS + Lambda

**Trigger Lambda from SQS**:
```python
# Lambda function
import json

def lambda_handler(event, context):
    for record in event['Records']:
        # SQS message body
        body = json.loads(record['body'])
        
        # Process message
        print(f"Processing: {body}")
        
        # No need to delete (Lambda does automatically)
    
    return {'statusCode': 200}
```

**Configuration**:
- Lambda triggered by SQS
- Batch size: 1-10,000 messages
- Batch window: 0-300 seconds
- Concurrency: Up to 1,000 concurrent executions

**Partial Batch Failures**:
```python
def lambda_handler(event, context):
    failed_records = []
    
    for record in event['Records']:
        try:
            # Process
            process_message(record)
        except Exception as e:
            # Mark as failed
            failed_records.append({'itemIdentifier': record['messageId']})
    
    # Return failed messages (will be retried)
    return {'batchItemFailures': failed_records}
```

### SQS + SNS (Fanout)

**Pattern**: One message to multiple queues

**Use Case**: Single event triggers multiple workflows

**Setup**:
```
SNS Topic
  ├── Subscription 1 → SQS Queue 1 → Lambda 1 (email notification)
  ├── Subscription 2 → SQS Queue 2 → Lambda 2 (update database)
  └── Subscription 3 → SQS Queue 3 → Lambda 3 (analytics)
```

**Benefits**:
- Publish once, process multiple times
- Independent processing rates
- Failure isolation

**Example**:
```python
import boto3

sns = boto3.client('sns')

# Publish to SNS topic
sns.publish(
    TopicArn='arn:aws:sns:us-east-1:123456789012:order-events',
    Message=json.dumps({'order_id': '12345', 'status': 'completed'}),
    Subject='Order Completed'
)

# SNS delivers to all subscribed SQS queues
# Each queue processes independently
```

### SQS + Auto Scaling

**Pattern**: Scale consumers based on queue depth

**CloudWatch Metric**:
- `ApproximateNumberOfMessagesVisible`

**Auto Scaling**:
```
Target Tracking:
  Metric: ApproximateNumberOfMessagesVisible / DesiredCapacity
  Target: 100 messages per consumer
  
  Queue has 1,000 messages:
    Desired consumers: 1,000 / 100 = 10 instances
  
  Queue has 100 messages:
    Desired consumers: 100 / 100 = 1 instance
```

**Example** (EC2 Auto Scaling):
```yaml
TargetTrackingScalingPolicyConfiguration:
  TargetValue: 100.0
  CustomizedMetricSpecification:
    MetricName: ApproximateNumberOfMessagesVisible
    Namespace: AWS/SQS
    Statistic: Average
    Dimensions:
      - Name: QueueName
        Value: my-queue
```

## Monitoring

### CloudWatch Metrics

**Key Metrics**:
- **ApproximateNumberOfMessagesVisible**: Messages in queue
- **ApproximateNumberOfMessagesNotVisible**: In-flight messages
- **ApproximateAgeOfOldestMessage**: Age of oldest message
- **NumberOfMessagesSent**: Messages sent
- **NumberOfMessagesReceived**: Messages received
- **NumberOfMessagesDeleted**: Messages deleted
- **NumberOfEmptyReceives**: Empty polling requests

**Alarms**:
```
ApproximateAgeOfOldestMessage > 300 seconds:
  - Messages not being processed
  - Scale up consumers

ApproximateNumberOfMessagesVisible > 10,000:
  - Queue backing up
  - Scale up or investigate failures

DLQ ApproximateNumberOfMessagesVisible > 0:
  - Failed messages need attention
  - Alert team
```

### Best Practices

**1. Use Long Polling**:
```
Reduces requests by 90%
Lower cost, better efficiency
```

**2. Set Visibility Timeout Appropriately**:
```
Visibility timeout = 6× average processing time
Prevents premature retries
```

**3. Always Configure DLQ**:
```
Catch problematic messages
Debug failures
Prevent infinite loops
```

**4. Use Batching**:
```
Send/receive/delete in batches (up to 10)
Reduces API calls
Lower cost
```

**5. Idempotent Processing**:
```
Handle duplicate messages (Standard queues)
Use deduplication ID (FIFO queues)
```

**6. Monitor Queue Depth**:
```
Set alarms on queue size
Auto-scale consumers
```

**7. Use Message Attributes**:
```
Metadata without parsing body
Filter in consumers
```

**8. Delete Messages After Processing**:
```
Prevents reprocessing
Keeps queue clean
```

## Real-World Scenarios

### Scenario 1: Order Processing System

**Requirements**:
- Handle order submissions
- Process payments
- Send confirmations
- Update inventory

**Architecture**:
```
Web App → SQS (orders.fifo) → Lambda (process order)
                    ↓
            SNS (order-events)
                    ↓
      ┌─────────────┼─────────────┐
      ↓             ↓             ↓
SQS (payments) SQS (emails) SQS (inventory)
      ↓             ↓             ↓
Lambda (pay)  Lambda (notify) Lambda (update)
```

**Orders Queue** (FIFO):
```python
# Send order to FIFO queue
sqs.send_message(
    QueueUrl='orders.fifo',
    MessageBody=json.dumps({
        'order_id': '12345',
        'customer_id': 'CUST-001',
        'items': [{'product_id': 'PROD-1', 'qty': 2}],
        'total': 199.98
    }),
    MessageGroupId=f"customer-{customer_id}",  # Orders per customer sequential
    MessageDeduplicationId=f"order-{order_id}"
)
```

**Order Processing Lambda**:
```python
def lambda_handler(event, context):
    for record in event['Records']:
        order = json.loads(record['body'])
        
        # Validate order
        if validate_order(order):
            # Publish to SNS for fanout
            sns.publish(
                TopicArn='order-events',
                Message=json.dumps(order),
                MessageAttributes={
                    'event_type': {'DataType': 'String', 'StringValue': 'order_created'}
                }
            )
```

**Cost** (10,000 orders/day):
```
SQS requests: 10K orders × 4 operations (send, receive, delete, SNS) = 40K/day
Monthly: 1.2M requests
Cost: 1.2M × $0.40/M (free tier covers first 1M) = $0.08/month
```

### Scenario 2: Image Processing Pipeline

**Requirements**:
- Upload images to S3
- Generate thumbnails (3 sizes)
- Extract metadata
- High throughput

**Architecture**:
```
S3 Upload Event → SQS (images-queue) → Lambda (process image)
                                            ↓
                                    Create 3 thumbnails
                                    Extract EXIF data
                                    Store in DynamoDB
```

**S3 Event Notification**:
```json
{
  "QueueConfigurations": [
    {
      "QueueArn": "arn:aws:sqs:us-east-1:123456789012:images-queue",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {
          "FilterRules": [
            {"Name": "prefix", "Value": "uploads/"},
            {"Name": "suffix", "Value": ".jpg"}
          ]
        }
      }
    }
  ]
}
```

**Processing Lambda**:
```python
import boto3
from PIL import Image
import io

s3 = boto3.client('s3')
sqs = boto3.client('sqs')

def lambda_handler(event, context):
    for record in event['Records']:
        message = json.loads(record['body'])
        s3_event = json.loads(message['Message'])
        
        bucket = s3_event['Records'][0]['s3']['bucket']['name']
        key = s3_event['Records'][0]['s3']['object']['key']
        
        # Download image
        obj = s3.get_object(Bucket=bucket, Key=key)
        image = Image.open(io.BytesIO(obj['Body'].read()))
        
        # Create thumbnails
        for size in [(150, 150), (300, 300), (600, 600)]:
            thumbnail = image.copy()
            thumbnail.thumbnail(size)
            
            # Upload thumbnail
            buffer = io.BytesIO()
            thumbnail.save(buffer, 'JPEG')
            buffer.seek(0)
            
            s3.put_object(
                Bucket=bucket,
                Key=f"thumbnails/{size[0]}x{size[1]}/{key}",
                Body=buffer,
                ContentType='image/jpeg'
            )
```

**Scaling**:
```
Lambda concurrency: 100 (process 100 images simultaneously)
SQS throughput: Unlimited
Queue depth metric: Trigger more Lambda instances if backlog
```

### Scenario 3: Retry with Exponential Backoff

**Requirements**:
- API calls may fail (rate limits)
- Retry with increasing delays
- Max 3 retries

**Architecture**:
```
Main Queue (attempts < 3) → Lambda → API Call
    ↓ (failed)
Retry Queue (delay 60s) → Lambda → API Call
    ↓ (failed)
Retry Queue (delay 300s) → Lambda → API Call
    ↓ (failed)
DLQ (manual intervention)
```

**Lambda Processing**:
```python
def lambda_handler(event, context):
    for record in event['Records']:
        message = json.loads(record['body'])
        attempt = message.get('attempt', 0)
        
        try:
            # Call external API
            response = call_api(message['data'])
            # Success, no further action
        except RateLimitError:
            if attempt < 3:
                # Retry with delay
                delay = 60 * (2 ** attempt)  # Exponential backoff
                sqs.send_message(
                    QueueUrl=retry_queue_url,
                    MessageBody=json.dumps({
                        'data': message['data'],
                        'attempt': attempt + 1
                    }),
                    DelaySeconds=min(delay, 900)  # Max 15 minutes
                )
            else:
                # Max retries exceeded, goes to DLQ automatically
                raise
```

### Scenario 4: Load Leveling (Traffic Spike)

**Requirements**:
- Web traffic spikes unpredictably
- Database can't handle burst writes
- Smooth out writes over time

**Architecture**:
```
Web App (1000 req/s) → SQS Queue → Worker (100 req/s) → Database
```

**Without SQS**:
```
Traffic spike: 1,000 req/s → Database (overwhelmed, errors)
```

**With SQS**:
```
Traffic spike: 1,000 req/s → SQS Queue (buffered)
Workers: Process 100 req/s (sustained rate)
Queue drains over 10 minutes (acceptable delay)
Database: Never overwhelmed
```

**Auto Scaling Workers**:
```
Queue depth > 1,000: Scale up workers
Queue depth < 100: Scale down workers

During spike:
  Queue: 10,000 messages
  Workers scale from 10 → 50 instances
  Process at 500 req/s
  Queue drains in 20 minutes
```

### Scenario 5: Distributed Task Queue

**Requirements**:
- Background job processing
- Multiple job types
- Priority processing

**Architecture**:
```
High Priority Queue → Worker Pool 1 (dedicated)
Normal Priority Queue → Worker Pool 2 (shared)
Low Priority Queue → Worker Pool 2 (shared)
```

**Job Submission**:
```python
def submit_job(job_data, priority='normal'):
    queues = {
        'high': 'high-priority-queue',
        'normal': 'normal-priority-queue',
        'low': 'low-priority-queue'
    }
    
    sqs.send_message(
        QueueUrl=queues[priority],
        MessageBody=json.dumps(job_data),
        MessageAttributes={
            'job_type': {'DataType': 'String', 'StringValue': job_data['type']},
            'priority': {'DataType': 'String', 'StringValue': priority}
        }
    )
```

**Worker Processing**:
```python
def process_jobs():
    while True:
        # Process high priority first
        messages = receive_from_queue('high-priority-queue')
        if not messages:
            # Then normal priority
            messages = receive_from_queue('normal-priority-queue')
        if not messages:
            # Finally low priority
            messages = receive_from_queue('low-priority-queue')
        
        for message in messages:
            process_job(message)
            delete_message(message)
```

## Exam Tips (SAP-C02)

### Key Decision Points

**Standard vs FIFO**:
```
High throughput, duplicates OK → Standard
Exact ordering needed → FIFO
Financial transactions → FIFO
Log processing → Standard
```

**Visibility Timeout**:
```
Set to 6× average processing time
Prevents premature retries
Extend if processing takes longer
```

**Polling**:
```
Always use long polling (WaitTimeSeconds = 20)
Reduces costs by 90%
```

**DLQ**:
```
Always configure for production
Set maxReceiveCount: 3-5
Monitor DLQ depth
```

### Common Scenarios

**"Decouple microservices"**:
- SQS between services
- Asynchronous communication
- Independent scaling

**"Handle traffic spikes"**:
- SQS as buffer
- Smooth writes to database
- Prevent overload

**"Process in order"**:
- Use FIFO queue
- Message groups for parallel processing
- Exactly-once delivery

**"One message, multiple processors"**:
- SNS → SQS fanout pattern
- Each queue processes independently

**"Scale based on queue depth"**:
- ApproximateNumberOfMessagesVisible metric
- Auto Scaling based on queue size
- Lambda or EC2 consumers

**"Messages failing repeatedly"**:
- Configure DLQ
- Set maxReceiveCount
- Investigate failures

**"Reduce costs"**:
- Use long polling
- Batch operations
- Delete processed messages

This comprehensive SQS guide covers all aspects for SAP-C02 exam success.
