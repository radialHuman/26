# Amazon SNS: Complete Guide

## Table of Contents
1. [Pub/Sub Fundamentals](#pubsub-fundamentals)
2. [SNS History & Evolution](#sns-history--evolution)
3. [Topics & Subscriptions](#topics--subscriptions)
4. [Fanout Pattern](#fanout-pattern)
5. [Message Filtering](#message-filtering)
6. [Delivery Policies](#delivery-policies)
7. [SNS + SQS Integration](#sns--sqs-integration)
8. [LocalStack Examples](#localstack-examples)
9. [Interview Questions](#interview-questions)

---

## Pub/Sub Fundamentals

### What is Publish/Subscribe?

**One-to-many messaging pattern**:
```
Publisher → Topic → Subscriber 1
                  → Subscriber 2
                  → Subscriber 3

Benefits:
✅ Decoupling (publisher doesn't know subscribers)
✅ Fan-out (one message → many receivers)
✅ Scalability (add subscribers without changing publisher)
```

### Pub/Sub vs Message Queue

**Message Queue** (Point-to-point):
```
Producer → Queue → Consumer

Characteristics:
- One message consumed once
- Load balancing (multiple consumers share work)
- Use case: Task distribution
```

**Pub/Sub** (Broadcast):
```
Publisher → Topic → Subscriber 1 (gets message)
                  → Subscriber 2 (gets message)
                  → Subscriber 3 (gets message)

Characteristics:
- One message delivered to all subscribers
- Broadcasting
- Use case: Event notification
```

### Use Cases

```
1. Microservices Communication:
   Order Service → SNS Topic → [Inventory, Shipping, Email]

2. System Alerts:
   CloudWatch Alarm → SNS → [Email, SMS, Slack, PagerDuty]

3. Mobile Push Notifications:
   Backend → SNS → [iOS, Android, SMS]

4. Fan-out Pattern:
   SNS Topic → [SQS Queue 1, SQS Queue 2, Lambda]

5. Event-Driven Architecture:
   User Signup → SNS → [Welcome Email, Analytics, CRM]
```

---

## SNS History & Evolution

### Before SNS (Pre-2010)

**Self-Managed Pub/Sub**:
```
Options:
- Custom implementation
- Apache Kafka
- RabbitMQ (with exchange)

Challenges:
❌ Build pub/sub infrastructure
❌ Manage subscriber registry
❌ Handle delivery failures
❌ Scale for millions of messages
```

### SNS Launch (April 2010)

**Simple Notification Service**:
```
Initial Features:
✅ HTTP/HTTPS endpoints
✅ Email notifications
✅ SMS
✅ SQS integration
✅ Mobile push (later)

Cost: $0.50 per million notifications
```

### Evolution Timeline

```
2010: SNS Launch
2011: Mobile push notifications (iOS, Android)
2013: SMS to 200+ countries
2015: Message attributes
2017: Message filtering
2019: FIFO topics
2020: Data encryption in transit
2022: Cross-region topics
2023: SMS sandboxing (security)
```

### Why SNS Was Created

**Problem: Managing Subscribers**
```
Before: Application manages subscriber list
- subscribers = ["email1@example.com", "email2@example.com"]
- for sub in subscribers: send_email(sub, message)

Issues:
❌ Hard-coded subscribers
❌ App redeploy to add/remove subscribers
❌ No retry logic
❌ No delivery guarantees

After: SNS Topic
- Subscribers register themselves
- SNS handles delivery
- Built-in retries
- No app changes needed
```

---

## Topics & Subscriptions

### Creating Topic

**Standard Topic**:
```bash
aws sns create-topic --name order-events

# Output: arn:aws:sns:us-east-1:123456789012:order-events
```

**FIFO Topic**:
```bash
aws sns create-topic \
  --name order-events.fifo \
  --attributes FifoTopic=true,ContentBasedDeduplication=true
```

### Subscribing

**Email Subscription**:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:order-events \
  --protocol email \
  --notification-endpoint admin@example.com
```

**SQS Subscription**:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:order-events \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:us-east-1:123456789012:my-queue
```

**Lambda Subscription**:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:order-events \
  --protocol lambda \
  --notification-endpoint arn:aws:lambda:us-east-1:123456789012:function:process-order
```

**HTTP/HTTPS Subscription**:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:order-events \
  --protocol https \
  --notification-endpoint https://api.example.com/webhook
```

### Supported Protocols

| Protocol | Use Case | Delivery |
|----------|----------|----------|
| Email | Notifications | SMTP |
| SMS | Alerts | Mobile network |
| HTTP/HTTPS | Webhooks | HTTP POST |
| SQS | Queue integration | AWS internal |
| Lambda | Serverless processing | Synchronous invoke |
| Mobile Push | App notifications | APNS, FCM |

### Publishing Message

**Python**:
```python
import boto3

sns = boto3.client('sns')

response = sns.publish(
    TopicArn='arn:aws:sns:us-east-1:123456789012:order-events',
    Message='New order placed',
    Subject='Order Notification',
    MessageAttributes={
        'order_type': {
            'DataType': 'String',
            'StringValue': 'premium'
        },
        'amount': {
            'DataType': 'Number',
            'StringValue': '99.99'
        }
    }
)
```

---

## Fanout Pattern

### SNS → SQS Fanout

**Architecture**:
```
                      SNS Topic
                          |
        +-----------------+-----------------+
        |                 |                 |
    SQS Queue 1      SQS Queue 2      SQS Queue 3
        |                 |                 |
   Service A         Service B         Service C
```

**Use Case**: Order processing
```
Order Event → SNS Topic
            → Inventory Queue → Inventory Service
            → Shipping Queue → Shipping Service
            → Analytics Queue → Analytics Service

Each service processes independently
No blocking between services
```

### Configuration

**1. Create SNS Topic**:
```bash
aws sns create-topic --name order-events
```

**2. Create SQS Queues**:
```bash
aws sqs create-queue --queue-name inventory-queue
aws sqs create-queue --queue-name shipping-queue
aws sqs create-queue --queue-name analytics-queue
```

**3. Set Queue Policy** (Allow SNS to send):
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "sns.amazonaws.com"},
    "Action": "sqs:SendMessage",
    "Resource": "arn:aws:sqs:us-east-1:123456789012:inventory-queue",
    "Condition": {
      "ArnEquals": {
        "aws:SourceArn": "arn:aws:sns:us-east-1:123456789012:order-events"
      }
    }
  }]
}
```

**4. Subscribe Queues**:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:order-events \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:us-east-1:123456789012:inventory-queue
```

---

## Message Filtering

### Filter Policy

**Subscribe with filter**:
```python
import boto3
import json

sns = boto3.client('sns')

# Premium orders only
filter_policy = {
    'order_type': ['premium', 'vip']
}

sns.subscribe(
    TopicArn='arn:aws:sns:us-east-1:123456789012:order-events',
    Protocol='sqs',
    Endpoint='arn:aws:sqs:us-east-1:123456789012:premium-queue',
    Attributes={
        'FilterPolicy': json.dumps(filter_policy)
    }
)
```

### Filter Examples

**Exact Match**:
```json
{
  "order_type": ["premium"]
}
```

**Multiple Values (OR)**:
```json
{
  "order_type": ["premium", "vip"]
}
```

**Numeric Range**:
```json
{
  "amount": [{"numeric": [">=", 100]}]
}
```

**Prefix Match**:
```json
{
  "email": [{"prefix": "admin@"}]
}
```

**Exists**:
```json
{
  "urgent": [{"exists": true}]
}
```

### Use Case: Multi-Tenant

**Different queues for different tenants**:
```python
# Publish with tenant attribute
sns.publish(
    TopicArn='...',
    Message='Order event',
    MessageAttributes={
        'tenant_id': {
            'DataType': 'String',
            'StringValue': 'tenant-123'
        }
    }
)

# Tenant 123 subscription (filtered)
filter_policy = {'tenant_id': ['tenant-123']}
sns.subscribe(
    TopicArn='...',
    Protocol='sqs',
    Endpoint='arn:aws:sqs:us-east-1:123456789012:tenant-123-queue',
    Attributes={'FilterPolicy': json.dumps(filter_policy)}
)
```

---

## Delivery Policies

### Retry Configuration

**Default Retry Policy**:
```
HTTP/HTTPS:
- Immediate retry
- 3 retries over 3 attempts
- Backoff: 20s, 20s, 20s

Lambda, SQS:
- 100,000+ retries
- Exponential backoff
```

**Custom Delivery Policy**:
```json
{
  "healthyRetryPolicy": {
    "numRetries": 5,
    "minDelayTarget": 10,
    "maxDelayTarget": 300,
    "numMinDelayRetries": 2,
    "numMaxDelayRetries": 1,
    "backoffFunction": "exponential"
  }
}
```

**Explanation**:
```
Attempt 1: Immediate
Attempt 2: 10s delay (minDelayTarget)
Attempt 3: 10s delay (numMinDelayRetries = 2)
Attempt 4: 40s delay (exponential backoff)
Attempt 5: 160s delay
Attempt 6: 300s delay (maxDelayTarget, numMaxDelayRetries = 1)
```

### Dead Letter Queue

**For failed deliveries**:
```python
# Create DLQ
dlq_arn = sqs.create_queue(QueueName='sns-dlq')['QueueUrl']

# Subscribe with DLQ
sns.subscribe(
    TopicArn='...',
    Protocol='lambda',
    Endpoint='arn:aws:lambda:us-east-1:123456789012:function:process',
    Attributes={
        'RedrivePolicy': json.dumps({
            'deadLetterTargetArn': dlq_arn
        })
    }
)
```

---

## SNS + SQS Integration

### Why Combine SNS + SQS?

**SNS Alone**:
```
❌ No message persistence
❌ Synchronous delivery (blocking)
❌ Subscriber must be online

Example: Lambda down → Messages lost
```

**SNS + SQS**:
```
✅ Message persistence (up to 14 days)
✅ Asynchronous processing
✅ Replay capability
✅ Load leveling

Flow: SNS → SQS → Consumer
```

### Pattern: Event-Driven Microservices

**Architecture**:
```
Order Service:
  POST /orders → Publish to SNS

SNS Topic: order-events
  → inventory-queue (Inventory Service)
  → shipping-queue (Shipping Service)
  → analytics-queue (Analytics Service)
  → email-queue (Notification Service)

Each service:
  - Polls its queue
  - Processes independently
  - No blocking
```

### Implementation

**Publisher**:
```python
import boto3
import json

sns = boto3.client('sns')

def create_order(order_data):
    # Save order to database
    db.save(order_data)
    
    # Publish event
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123456789012:order-events',
        Message=json.dumps(order_data),
        MessageAttributes={
            'event_type': {
                'DataType': 'String',
                'StringValue': 'order_created'
            },
            'order_id': {
                'DataType': 'String',
                'StringValue': order_data['order_id']
            }
        }
    )
```

**Consumer** (Inventory Service):
```python
import boto3
import json

sqs = boto3.client('sqs')
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/inventory-queue'

while True:
    response = sqs.receive_message(
        QueueUrl=queue_url,
        MaxNumberOfMessages=10,
        WaitTimeSeconds=20
    )
    
    if 'Messages' not in response:
        continue
    
    for message in response['Messages']:
        # SNS wraps message in envelope
        sns_message = json.loads(message['Body'])
        order_data = json.loads(sns_message['Message'])
        
        # Process
        update_inventory(order_data)
        
        # Delete
        sqs.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=message['ReceiptHandle']
        )
```

---

## LocalStack Examples

### SNS + SQS Fanout

**Setup**:
```python
import boto3
import json

# LocalStack clients
sns = boto3.client('sns', endpoint_url='http://localhost:4566')
sqs = boto3.client('sqs', endpoint_url='http://localhost:4566')

# Create SNS topic
topic_response = sns.create_topic(Name='order-events')
topic_arn = topic_response['TopicArn']

# Create SQS queues
queues = {}
for service in ['inventory', 'shipping', 'analytics']:
    queue_url = sqs.create_queue(QueueName=f'{service}-queue')['QueueUrl']
    queues[service] = queue_url
    
    # Get queue ARN
    attrs = sqs.get_queue_attributes(
        QueueUrl=queue_url,
        AttributeNames=['QueueArn']
    )
    queue_arn = attrs['Attributes']['QueueArn']
    
    # Set queue policy
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

print("SNS + SQS fanout setup complete!")
```

**Publisher**:
```python
# Publish order event
order = {
    'order_id': 'order-123',
    'customer': 'Alice',
    'amount': 99.99,
    'items': ['item1', 'item2']
}

sns.publish(
    TopicArn=topic_arn,
    Message=json.dumps(order),
    MessageAttributes={
        'event_type': {
            'DataType': 'String',
            'StringValue': 'order_created'
        }
    }
)

print(f"Published order: {order['order_id']}")
```

**Consumer** (Inventory Service):
```python
import time

def consume_inventory_queue():
    while True:
        response = sqs.receive_message(
            QueueUrl=queues['inventory'],
            MaxNumberOfMessages=10,
            WaitTimeSeconds=20
        )
        
        if 'Messages' not in response:
            print("No messages (inventory)")
            time.sleep(1)
            continue
        
        for message in response['Messages']:
            # Parse SNS message
            sns_msg = json.loads(message['Body'])
            order = json.loads(sns_msg['Message'])
            
            print(f"[Inventory] Processing order: {order['order_id']}")
            
            # Update inventory
            for item in order['items']:
                print(f"  - Reserving {item}")
            
            # Delete message
            sqs.delete_message(
                QueueUrl=queues['inventory'],
                ReceiptHandle=message['ReceiptHandle']
            )

# Run in separate thread or process
import threading
threading.Thread(target=consume_inventory_queue).start()
```

### Message Filtering Example

```python
# Create queues with different filters
premium_queue = sqs.create_queue(QueueName='premium-orders')['QueueUrl']
standard_queue = sqs.create_queue(QueueName='standard-orders')['QueueUrl']

# Subscribe with filters
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sqs',
    Endpoint=premium_queue,
    Attributes={
        'FilterPolicy': json.dumps({
            'order_type': ['premium', 'vip']
        })
    }
)

sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sqs',
    Endpoint=standard_queue,
    Attributes={
        'FilterPolicy': json.dumps({
            'order_type': ['standard']
        })
    }
)

# Publish premium order
sns.publish(
    TopicArn=topic_arn,
    Message=json.dumps({'order_id': 'order-123'}),
    MessageAttributes={
        'order_type': {
            'DataType': 'String',
            'StringValue': 'premium'
        }
    }
)
# → Goes to premium-orders queue only
```

---

## Interview Questions

### Conceptual

**Q: SNS vs SQS - when to use each?**
```
SNS (Pub/Sub):
- One-to-many (broadcast)
- Push model (SNS pushes to subscribers)
- No message persistence
- Use case: Event notification

SQS (Message Queue):
- One-to-one (point-to-point)
- Pull model (consumers pull from queue)
- Message persistence (14 days)
- Use case: Task distribution

SNS + SQS (Best of both):
- Fan-out pattern
- SNS broadcasts to multiple SQS queues
- Each service gets its own queue
- Message persistence + decoupling

Example:
Order created → SNS topic
              → Inventory SQS (update stock)
              → Shipping SQS (prepare shipment)
              → Analytics SQS (track metrics)
```

**Q: How to handle failed deliveries in SNS?**
```
Strategies:

1. Delivery Retries (Built-in):
   - HTTP/HTTPS: 3 retries (exponential backoff)
   - Lambda: 100,000+ retries
   - SQS: No retries needed (guaranteed delivery)

2. Dead Letter Queue:
   - Failed messages → SQS DLQ
   - Analyze failures
   - Replay after fixing issue

3. SNS + SQS Pattern:
   - SNS → SQS (guaranteed delivery)
   - SQS retries + DLQ
   - Better reliability

4. CloudWatch Alarms:
   - Monitor NumberOfNotificationsFailed metric
   - Alert on threshold
   - Investigate root cause

Best Practice:
- Use SNS + SQS for critical messages
- Configure DLQ for all subscriptions
- Monitor delivery metrics
```

**Q: Message filtering - when to use?**
```
Use Cases:

1. Multi-Tenant:
   - One topic for all tenants
   - Filter by tenant_id
   - Each tenant gets own queue

2. Event Types:
   - One topic for all events
   - Filter by event_type (order_created, order_shipped)
   - Different handlers per event

3. Priority:
   - Filter by priority (high, medium, low)
   - Different processing queues
   - High priority → More consumers

4. Regional:
   - Filter by region
   - Route to region-specific queues

Example:
```python
# Without filtering: Need 10 topics
order_created_topic
order_shipped_topic
order_cancelled_topic
...

# With filtering: One topic
order_events_topic
→ Filter: event_type = "order_created"
→ Filter: event_type = "order_shipped"
```

Benefits:
- Fewer topics to manage
- Simpler architecture
- Dynamic subscriptions
```

### Design

**Q: Design notification system (email, SMS, push) for 10M users**
```
Requirements:
- 10M users
- 3 channels: Email, SMS, Push
- User preferences (opt-in/opt-out per channel)
- Delivery tracking

Architecture:

1. SNS Topic per Event Type:
   - user-signup
   - order-confirmation
   - password-reset
   - promotional-offers

2. Preference Management:
   DynamoDB table:
   user_id | email_enabled | sms_enabled | push_enabled
   user123 | true          | false       | true

3. Publisher (Application):
```python
def send_notification(event_type, user_id, message):
    # Get user preferences
    prefs = dynamodb.get_item('users', user_id)
    
    # Publish with user preferences as attributes
    sns.publish(
        TopicArn=f'arn:aws:sns:us-east-1:123456789012:{event_type}',
        Message=message,
        MessageAttributes={
            'user_id': {'DataType': 'String', 'StringValue': user_id},
            'email_enabled': {'DataType': 'String', 'StringValue': str(prefs['email_enabled'])},
            'sms_enabled': {'DataType': 'String', 'StringValue': str(prefs['sms_enabled'])},
            'push_enabled': {'DataType': 'String', 'StringValue': str(prefs['push_enabled'])}
        }
    )
```

4. Channel-Specific Queues with Filters:
```python
# Email queue (only if email_enabled = true)
sns.subscribe(
    TopicArn='arn:aws:sns:us-east-1:123456789012:order-confirmation',
    Protocol='sqs',
    Endpoint='arn:aws:sqs:us-east-1:123456789012:email-queue',
    Attributes={
        'FilterPolicy': json.dumps({'email_enabled': ['true']})
    }
)

# SMS queue
sns.subscribe(
    TopicArn='...',
    Protocol='sqs',
    Endpoint='arn:aws:sqs:us-east-1:123456789012:sms-queue',
    Attributes={
        'FilterPolicy': json.dumps({'sms_enabled': ['true']})
    }
)

# Push queue
sns.subscribe(
    TopicArn='...',
    Protocol='sqs',
    Endpoint='arn:aws:sqs:us-east-1:123456789012:push-queue',
    Attributes={
        'FilterPolicy': json.dumps({'push_enabled': ['true']})
    }
)
```

5. Workers:
   - Email Worker: SES (Simple Email Service)
   - SMS Worker: SNS SMS
   - Push Worker: SNS Mobile Push (APNS, FCM)

6. Delivery Tracking:
   DynamoDB table:
   notification_id | user_id | channel | status | timestamp
   notif123       | user456 | email   | sent   | 2023-11-01T10:00:00

7. Rate Limiting:
   - SQS message delay for throttling
   - SES rate limits: 14 messages/sec
   - SNS SMS: 20 messages/sec

Capacity:
- 10M users, 10% daily engagement = 1M notifications/day
- 3 channels × 1M = 3M total deliveries
- Peak: 100/sec

Cost:
- SNS: 3M × $0.50/M = $1.50/day
- SQS: 3M × $0.40/M = $1.20/day
- SES: 1M emails × $0.10/1000 = $100/day
- Total: ~$103/day = $3,090/month
```

---

This comprehensive SNS guide covers pub/sub patterns, topics/subscriptions, fanout, message filtering, delivery policies, and SNS+SQS integration with complete LocalStack examples! 📢

