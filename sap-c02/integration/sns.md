# Amazon SNS (Simple Notification Service)

## What is SNS?

Amazon Simple Notification Service (SNS) is a fully managed pub/sub messaging service that enables message delivery from publishers to multiple subscribers. It supports A2A (application-to-application) and A2P (application-to-person) communication patterns.

## Why Use SNS?

### Key Benefits
- **Pub/Sub Pattern**: One-to-many message distribution
- **Multiple Protocols**: SMS, email, HTTP, Lambda, SQS, mobile push
- **Fully Managed**: No infrastructure to provision
- **Scalability**: Millions of messages per second
- **Reliability**: Message durability and retry
- **Cost-Effective**: Pay per publish and delivery
- **Fanout**: Broadcast to multiple subscribers

### Use Cases
- Application alerts and notifications
- Mobile push notifications
- Email/SMS notifications
- Fanout to multiple SQS queues
- Workflow triggers
- Event-driven architectures
- System monitoring alerts

## Core Concepts

### Topics

**What**: Communication channel for messages

**Types**:
- **Standard**: Best-effort ordering, at-least-once delivery
- **FIFO**: Strict ordering, exactly-once delivery

**Standard Topics**:
```
Throughput: Unlimited
Delivery: At-least-once (may duplicate)
Ordering: Best-effort
Protocols: All supported
```

**FIFO Topics**:
```
Throughput: 300 TPS (3,000 TPS with batching)
Delivery: Exactly-once (no duplicates)
Ordering: Guaranteed
Protocols: SQS FIFO only
Naming: Must end with .fifo
```

**Creating Topic**:
```python
import boto3

sns = boto3.client('sns')

# Standard topic
response = sns.create_topic(Name='order-notifications')
topic_arn = response['TopicArn']

# FIFO topic
response = sns.create_topic(
    Name='transactions.fifo',
    Attributes={
        'FifoTopic': 'true',
        'ContentBasedDeduplication': 'true'
    }
)
```

### Publishers

**Who Can Publish**:
- AWS services (CloudWatch, S3, RDS, Lambda)
- Applications (via SDK)
- AWS Console/CLI

**Publishing**:
```python
# Simple publish
sns.publish(
    TopicArn=topic_arn,
    Message='Order completed successfully',
    Subject='Order Notification'
)

# With message attributes
sns.publish(
    TopicArn=topic_arn,
    Message=json.dumps({
        'order_id': '12345',
        'status': 'completed',
        'amount': 199.99
    }),
    MessageAttributes={
        'event_type': {
            'DataType': 'String',
            'StringValue': 'order_completed'
        },
        'priority': {
            'DataType': 'Number',
            'StringValue': '1'
        }
    }
)

# FIFO publish
sns.publish(
    TopicArn=fifo_topic_arn,
    Message='Transaction processed',
    MessageGroupId='transaction-group-1',  # Required for FIFO
    MessageDeduplicationId='unique-txn-123'  # Or use content-based
)
```

**Batch Publishing** (Up to 10 messages):
```python
sns.publish_batch(
    TopicArn=topic_arn,
    PublishBatchRequestEntries=[
        {
            'Id': '1',
            'Message': 'Message 1',
            'Subject': 'Subject 1'
        },
        {
            'Id': '2',
            'Message': 'Message 2',
            'Subject': 'Subject 2'
        }
    ]
)
```

### Subscribers

**Supported Protocols**:
- **SQS**: Queue for reliable processing
- **Lambda**: Serverless function
- **HTTP/HTTPS**: Webhook endpoint
- **Email**: Plain text email
- **Email-JSON**: JSON formatted email
- **SMS**: Text message
- **Mobile Push**: iOS, Android, etc.

**Subscription**:
```python
# SQS subscription
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sqs',
    Endpoint='arn:aws:sqs:us-east-1:123456789012:my-queue'
)

# Lambda subscription
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='lambda',
    Endpoint='arn:aws:lambda:us-east-1:123456789012:function:my-function'
)

# HTTP/HTTPS subscription
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='https',
    Endpoint='https://example.com/webhook'
)

# Email subscription
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='email',
    Endpoint='user@example.com'
)

# SMS subscription
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sms',
    Endpoint='+1234567890'
)
```

**Subscription Confirmation**:
```
Email/HTTP subscriptions require confirmation:
1. Subscribe to topic
2. Receive confirmation message
3. Click confirmation link
4. Subscription active
```

## Message Filtering

### Filter Policies

**What**: Subscribers receive only messages matching filter

**Without Filtering**:
```
Topic → All messages → All subscribers
Each subscriber gets every message (wasteful)
```

**With Filtering**:
```
Topic → Filter → Only matching messages → Subscriber
Each subscriber gets relevant messages only
```

**Filter Policy Example**:
```json
{
  "event_type": ["order_completed", "order_shipped"],
  "amount": [{"numeric": [">=", 100]}],
  "region": ["us-east-1", "eu-west-1"]
}
```

**Applying Filter**:
```python
# Create subscription with filter
subscription_arn = sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sqs',
    Endpoint=queue_arn,
    ReturnSubscriptionArn=True
)['SubscriptionArn']

# Set filter policy
filter_policy = {
    "event_type": ["order_completed"],
    "amount": [{"numeric": [">=", 100]}]
}

sns.set_subscription_attributes(
    SubscriptionArn=subscription_arn,
    AttributeName='FilterPolicy',
    AttributeValue=json.dumps(filter_policy)
)
```

**Filter Operators**:

**String Matching**:
```json
{
  "status": ["completed", "shipped"]  // Exact match
}
```

**Numeric Matching**:
```json
{
  "price": [{"numeric": [">=", 100, "<=", 500]}],
  "quantity": [{"numeric": [">", 0]}]
}
```

**Prefix Matching**:
```json
{
  "product_id": [{"prefix": "PROD-"}]
}
```

**Anything-but**:
```json
{
  "status": [{"anything-but": ["cancelled", "refunded"]}]
}
```

**Exists**:
```json
{
  "discount": [{"exists": true}]  // Must have discount attribute
}
```

### Use Cases

**Example 1**: Order Processing
```
Topic: order-events

Subscription 1 (email team):
  Filter: event_type = "order_failed"

Subscription 2 (analytics):
  Filter: amount >= 1000

Subscription 3 (inventory):
  Filter: event_type IN ["order_completed", "order_shipped"]
```

**Example 2**: Multi-Region
```
Topic: application-events

Subscription 1 (us-east-1 queue):
  Filter: region = "us-east-1"

Subscription 2 (eu-west-1 queue):
  Filter: region = "eu-west-1"
```

## Message Delivery

### Delivery Policies

**What**: Configure retry behavior

**Default Retry Policy**:
```
HTTP/HTTPS endpoints:
  - Immediate retry
  - Then exponential backoff
  - Max retries: 100
  - Max delay: 20 seconds
```

**Custom Delivery Policy**:
```json
{
  "healthyRetryPolicy": {
    "minDelayTarget": 1,
    "maxDelayTarget": 20,
    "numRetries": 10,
    "numMaxDelayRetries": 5,
    "backoffFunction": "exponential"
  },
  "throttlePolicy": {
    "maxReceivesPerSecond": 10
  }
}
```

**Setting Delivery Policy**:
```python
delivery_policy = {
    "healthyRetryPolicy": {
        "numRetries": 5,
        "minDelayTarget": 2,
        "maxDelayTarget": 10,
        "backoffFunction": "linear"
    }
}

sns.set_topic_attributes(
    TopicArn=topic_arn,
    AttributeName='DeliveryPolicy',
    AttributeValue=json.dumps(delivery_policy)
)
```

### Delivery Status Logging

**Protocols Supported**: HTTP/HTTPS, Lambda, SQS, Kinesis Firehose

**Configuration**:
```python
# Set success/failure feedback role
sns.set_topic_attributes(
    TopicArn=topic_arn,
    AttributeName='HTTPSuccessFeedbackRoleArn',
    AttributeValue='arn:aws:iam::123456789012:role/SNSLoggingRole'
)

sns.set_topic_attributes(
    TopicArn=topic_arn,
    AttributeName='HTTPFailureFeedbackRoleArn',
    AttributeValue='arn:aws:iam::123456789012:role/SNSLoggingRole'
)

# Set success/failure sample rate
sns.set_topic_attributes(
    TopicArn=topic_arn,
    AttributeName='HTTPSuccessFeedbackSampleRate',
    AttributeValue='100'  # Log 100% of successful deliveries
)
```

**CloudWatch Logs**:
```
Log Group: /aws/sns/us-east-1/123456789012/topic-name

Success: {delivery: {statusCode: 200}}
Failure: {delivery: {statusCode: 500, error: "Connection timeout"}}
```

## Message Attributes

### Types

**String**:
```python
MessageAttributes={
    'name': {'DataType': 'String', 'StringValue': 'John Doe'}
}
```

**Number**:
```python
MessageAttributes={
    'age': {'DataType': 'Number', 'StringValue': '30'}
}
```

**Binary**:
```python
MessageAttributes={
    'data': {'DataType': 'Binary', 'BinaryValue': b'\x00\x01\x02'}
}
```

**String Array**:
```python
MessageAttributes={
    'tags': {
        'DataType': 'String.Array',
        'StringValue': json.dumps(['tag1', 'tag2', 'tag3'])
    }
}
```

### Reserved Attributes

**AWS.SNS.MOBILE**:
- iOS, Android push notification settings

**Example**:
```python
sns.publish(
    TopicArn=mobile_topic_arn,
    Message=json.dumps({
        'default': 'Default message',
        'APNS': json.dumps({
            'aps': {
                'alert': 'Hello iOS!',
                'badge': 1,
                'sound': 'default'
            }
        }),
        'GCM': json.dumps({
            'notification': {
                'title': 'Hello Android!',
                'body': 'Notification text'
            }
        })
    }),
    MessageStructure='json'
)
```

## Security

### Encryption

**Encryption at Rest** (SSE):
```python
# Enable encryption with KMS
sns.set_topic_attributes(
    TopicArn=topic_arn,
    AttributeName='KmsMasterKeyId',
    AttributeValue='arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012'
)
```

**Encryption in Transit**:
- HTTPS endpoints (automatic)

### Access Policies

**Topic Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudwatch.amazonaws.com"
      },
      "Action": "SNS:Publish",
      "Resource": "arn:aws:sns:us-east-1:123456789012:alarm-topic"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:user/alice"
      },
      "Action": [
        "SNS:Subscribe",
        "SNS:Receive"
      ],
      "Resource": "arn:aws:sns:us-east-1:123456789012:my-topic"
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
  "Action": "SNS:Publish",
  "Resource": "arn:aws:sns:us-east-1:ACCOUNT-A:shared-topic"
}
```

**Condition Keys**:
```json
{
  "Effect": "Allow",
  "Principal": "*",
  "Action": "SNS:Publish",
  "Resource": "*",
  "Condition": {
    "StringEquals": {
      "aws:SourceAccount": "123456789012"
    },
    "IpAddress": {
      "aws:SourceIp": ["192.0.2.0/24"]
    }
  }
}
```

## Integration Patterns

### SNS + SQS (Fanout)

**Pattern**: Publish once, process multiple times

**Architecture**:
```
Publisher → SNS Topic
              ├→ SQS Queue 1 → Lambda 1 (email)
              ├→ SQS Queue 2 → Lambda 2 (database)
              └→ SQS Queue 3 → Lambda 3 (analytics)
```

**Setup**:
```python
# Create topic
topic = sns.create_topic(Name='order-events')
topic_arn = topic['TopicArn']

# Create queues
queue1 = sqs.create_queue(QueueName='email-queue')
queue2 = sqs.create_queue(QueueName='database-queue')
queue3 = sqs.create_queue(QueueName='analytics-queue')

# Subscribe queues to topic
for queue_url in [queue1['QueueUrl'], queue2['QueueUrl'], queue3['QueueUrl']]:
    # Get queue ARN
    attrs = sqs.get_queue_attributes(
        QueueUrl=queue_url,
        AttributeNames=['QueueArn']
    )
    queue_arn = attrs['Attributes']['QueueArn']
    
    # Subscribe to topic
    sns.subscribe(
        TopicArn=topic_arn,
        Protocol='sqs',
        Endpoint=queue_arn
    )
    
    # Update queue policy to allow SNS
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

# Publish once
sns.publish(
    TopicArn=topic_arn,
    Message=json.dumps({'order_id': '12345', 'status': 'completed'}),
    Subject='Order Completed'
)
# All three queues receive the message
```

**Benefits**:
- Publish once, multiple processors
- Independent processing rates
- Failure isolation
- Easy to add new subscribers

### SNS + Lambda

**Pattern**: Event-driven serverless

**Lambda Function**:
```python
import json

def lambda_handler(event, context):
    for record in event['Records']:
        # SNS message
        sns_message = record['Sns']
        subject = sns_message['Subject']
        message = sns_message['Message']
        
        # Parse message
        data = json.loads(message)
        
        # Process
        print(f"Processing: {data}")
        
        # Send notification
        send_email(data)
    
    return {'statusCode': 200}
```

**Subscription**:
```python
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='lambda',
    Endpoint='arn:aws:lambda:us-east-1:123456789012:function:process-notifications'
)

# Lambda permission for SNS
lambda_client.add_permission(
    FunctionName='process-notifications',
    StatementId='SNSInvoke',
    Action='lambda:InvokeFunction',
    Principal='sns.amazonaws.com',
    SourceArn=topic_arn
)
```

### SNS + CloudWatch

**Pattern**: Alarms to notifications

**CloudWatch Alarm**:
```python
cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_alarm(
    AlarmName='High-CPU-Alarm',
    MetricName='CPUUtilization',
    Namespace='AWS/EC2',
    Statistic='Average',
    Period=300,
    EvaluationPeriods=2,
    Threshold=80,
    ComparisonOperator='GreaterThanThreshold',
    AlarmActions=[topic_arn],  # Send to SNS
    Dimensions=[
        {'Name': 'InstanceId', 'Value': 'i-1234567890abcdef0'}
    ]
)
```

**SNS sends**:
- Email to team
- SMS to on-call
- Lambda for auto-remediation
- SQS for logging

## Mobile Push Notifications

### Platform Applications

**Supported Platforms**:
- **APNS**: Apple iOS
- **FCM**: Google Android (Firebase Cloud Messaging)
- **ADM**: Amazon Device Messaging
- **Baidu**: Baidu Cloud Push
- **MPNS**: Microsoft Push Notification Service
- **WNS**: Windows Push Notification Services

**Creating Platform Application**:
```python
# iOS (APNS)
app = sns.create_platform_application(
    Name='MyiOSApp',
    Platform='APNS',
    Attributes={
        'PlatformCredential': apns_private_key,
        'PlatformPrincipal': apns_certificate
    }
)
platform_app_arn = app['PlatformApplicationArn']

# Android (FCM)
app = sns.create_platform_application(
    Name='MyAndroidApp',
    Platform='GCM',  # Or 'FCM'
    Attributes={
        'PlatformCredential': fcm_server_key
    }
)
```

**Registering Device**:
```python
# Create endpoint for device
endpoint = sns.create_platform_endpoint(
    PlatformApplicationArn=platform_app_arn,
    Token=device_token  # From mobile app
)
endpoint_arn = endpoint['EndpointArn']
```

**Sending Push**:
```python
# iOS notification
message = {
    'default': 'Default message',
    'APNS': json.dumps({
        'aps': {
            'alert': 'New order received!',
            'badge': 1,
            'sound': 'default',
            'category': 'ORDER_CATEGORY'
        },
        'custom_data': {
            'order_id': '12345'
        }
    })
}

sns.publish(
    TargetArn=endpoint_arn,
    Message=json.dumps(message),
    MessageStructure='json'
)

# Android notification
message = {
    'default': 'Default message',
    'GCM': json.dumps({
        'notification': {
            'title': 'New Order',
            'body': 'Order #12345 received',
            'icon': 'ic_notification',
            'sound': 'default'
        },
        'data': {
            'order_id': '12345'
        }
    })
}

sns.publish(
    TargetArn=endpoint_arn,
    Message=json.dumps(message),
    MessageStructure='json'
)
```

## SMS Messaging

### Sending SMS

**Direct Publish**:
```python
# Single SMS
sns.publish(
    PhoneNumber='+1234567890',
    Message='Your verification code is: 123456'
)

# With attributes
sns.publish(
    PhoneNumber='+1234567890',
    Message='Your order #12345 has shipped',
    MessageAttributes={
        'AWS.SNS.SMS.SMSType': {
            'DataType': 'String',
            'StringValue': 'Transactional'  # Or 'Promotional'
        },
        'AWS.SNS.SMS.SenderID': {
            'DataType': 'String',
            'StringValue': 'MyCompany'
        }
    }
)
```

**SMS Types**:
- **Transactional**: High priority, critical messages (OTP, alerts)
  - Higher cost
  - Better delivery rate
- **Promotional**: Low priority, marketing messages
  - Lower cost
  - May be throttled

**SMS Sandbox**:
```
New accounts start in sandbox:
  - Can only send to verified phone numbers
  - Request production access via support ticket
```

### SMS Settings

**Account-Level Settings**:
```python
sns.set_sms_attributes(
    attributes={
        'DefaultSMSType': 'Transactional',
        'MonthlySpendLimit': '100',  # USD
        'DeliveryStatusIAMRole': 'arn:aws:iam::123456789012:role/SNSSMSRole',
        'DeliveryStatusSuccessSamplingRate': '100'
    }
)
```

**Opt-Out Management**:
```
Users can opt out by replying "STOP"
Check opt-out list:
```python
response = sns.list_phone_numbers_opted_out()
opted_out = response['phoneNumbers']
```

## Monitoring

### CloudWatch Metrics

**Topic Metrics**:
- **NumberOfMessagesPublished**: Messages published to topic
- **NumberOfNotificationsDelivered**: Successful deliveries
- **NumberOfNotificationsFailed**: Failed deliveries
- **PublishSize**: Size of published messages

**Per-Protocol Metrics**:
- NumberOfNotificationsDelivered (Email, HTTP, Lambda, SQS, SMS)
- NumberOfNotificationsFailed (Email, HTTP, Lambda, SQS, SMS)

**SMS Metrics**:
- **SMSSuccessRate**: Percentage of successful SMS deliveries

**Alarms**:
```python
cloudwatch.put_metric_alarm(
    AlarmName='SNS-High-Failure-Rate',
    MetricName='NumberOfNotificationsFailed',
    Namespace='AWS/SNS',
    Statistic='Sum',
    Period=300,
    EvaluationPeriods=1,
    Threshold=10,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'TopicName', 'Value': 'order-notifications'}
    ],
    AlarmActions=[alert_topic_arn]
)
```

### CloudWatch Logs

**Delivery Status Logging**:
```
Enable for HTTP, Lambda, SQS, Kinesis Firehose

Logs show:
  - Delivery time
  - Status code
  - Response
  - Retry attempts
```

**Example Log**:
```json
{
  "notification": {
    "timestamp": "2026-01-31 10:30:00.000",
    "messageId": "12345678-1234-1234-1234-123456789012"
  },
  "delivery": {
    "deliveryId": "abcd1234-5678-90ab-cdef-1234567890ab",
    "destination": "https://example.com/webhook",
    "providerResponse": "{\"status\":\"success\"}",
    "statusCode": 200
  },
  "status": "SUCCESS"
}
```

## Best Practices

**1. Use Filter Policies**:
```
Reduce unnecessary message processing
Each subscriber gets only relevant messages
```

**2. Enable Delivery Status Logging**:
```
Track delivery failures
Debug issues
Monitor delivery rates
```

**3. Use Message Attributes**:
```
Metadata for filtering
Don't parse message body for routing
```

**4. Fanout with SQS**:
```
SNS → Multiple SQS queues
Reliable, scalable, decoupled
```

**5. Set Appropriate Delivery Policies**:
```
Configure retry behavior
Balance cost vs reliability
```

**6. Monitor Metrics**:
```
Track publish/delivery rates
Alert on failures
Monitor costs (SMS)
```

**7. Use FIFO for Ordering**:
```
Financial transactions
Sequential processing
Exactly-once delivery
```

**8. Secure Topics**:
```
Encryption at rest (KMS)
Topic policies (least privilege)
HTTPS for subscriptions
```

## Real-World Scenarios

### Scenario 1: E-Commerce Order System

**Requirements**:
- Order placed triggers multiple workflows
- Email customer
- Update inventory
- Process payment
- Log analytics

**Architecture**:
```
Web App → SNS (order-events)
            ├→ SQS (email-queue) → Lambda (send email)
            ├→ SQS (inventory-queue) → Lambda (update inventory)
            ├→ SQS (payment-queue) → Lambda (process payment)
            └→ SQS (analytics-queue) → Kinesis Firehose → S3
```

**Implementation**:
```python
# Publish order event
sns.publish(
    TopicArn='arn:aws:sns:us-east-1:123456789012:order-events',
    Message=json.dumps({
        'order_id': '12345',
        'customer_email': 'customer@example.com',
        'items': [{'product_id': 'PROD-1', 'quantity': 2}],
        'total': 199.99,
        'payment_method': 'credit_card'
    }),
    MessageAttributes={
        'event_type': {
            'DataType': 'String',
            'StringValue': 'order_placed'
        },
        'priority': {
            'DataType': 'Number',
            'StringValue': '1'
        }
    }
)

# All workflows triggered simultaneously
# Independent processing, failure isolation
```

**Cost** (10,000 orders/month):
```
SNS publish: 10K × $0.50/M = $0.005
SNS delivery: 10K orders × 4 subscriptions × $0.50/M = $0.02
Total SNS: $0.025/month
```

### Scenario 2: Application Monitoring

**Requirements**:
- CloudWatch alarms to multiple channels
- Email operations team
- SMS on-call engineer
- Slack webhook
- Create Jira ticket

**Architecture**:
```
CloudWatch Alarm → SNS (critical-alerts)
                     ├→ Email (ops@company.com)
                     ├→ SMS (+1234567890)
                     ├→ HTTPS (Slack webhook)
                     └→ Lambda (create Jira ticket)
```

**Setup**:
```python
# Create SNS topic
topic = sns.create_topic(Name='critical-alerts')
topic_arn = topic['TopicArn']

# Subscribe email
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='email',
    Endpoint='ops@company.com'
)

# Subscribe SMS
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='sms',
    Endpoint='+1234567890'
)

# Subscribe Slack webhook
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='https',
    Endpoint='https://hooks.slack.com/services/XXX/YYY/ZZZ'
)

# Subscribe Lambda for Jira
sns.subscribe(
    TopicArn=topic_arn,
    Protocol='lambda',
    Endpoint='arn:aws:lambda:us-east-1:123456789012:function:create-jira-ticket'
)

# CloudWatch alarm
cloudwatch.put_metric_alarm(
    AlarmName='Database-Connection-Failure',
    MetricName='DatabaseConnections',
    Namespace='AWS/RDS',
    Statistic='Average',
    Period=60,
    EvaluationPeriods=2,
    Threshold=0,
    ComparisonOperator='LessThanOrEqualToThreshold',
    AlarmActions=[topic_arn]
)
```

### Scenario 3: Mobile App Notifications

**Requirements**:
- Send push notifications to iOS/Android
- Personalized messages
- Track delivery

**Implementation**:
```python
# Send to specific user's devices
def send_push_notification(user_id, message):
    # Get user's device endpoints from database
    endpoints = get_user_endpoints(user_id)
    
    for endpoint_arn in endpoints:
        # Platform-specific message
        push_message = {
            'default': message,
            'APNS': json.dumps({
                'aps': {
                    'alert': message,
                    'badge': 1,
                    'sound': 'default'
                }
            }),
            'GCM': json.dumps({
                'notification': {
                    'title': 'Notification',
                    'body': message
                }
            })
        }
        
        try:
            sns.publish(
                TargetArn=endpoint_arn,
                Message=json.dumps(push_message),
                MessageStructure='json'
            )
        except sns.exceptions.EndpointDisabledException:
            # Device uninstalled app, remove endpoint
            delete_user_endpoint(user_id, endpoint_arn)

# Usage
send_push_notification('user-123', 'Your order has shipped!')
```

### Scenario 4: Multi-Region Disaster Recovery

**Requirements**:
- Replicate events across regions
- Primary region failure triggers DR

**Architecture**:
```
Primary Region (us-east-1):
  App → SNS (events)
          ├→ SQS (local processing)
          └→ HTTPS → API Gateway (us-west-2)

DR Region (us-west-2):
  API Gateway → Lambda → SNS (events)
                            └→ SQS (dr processing)
```

**Primary Region**:
```python
# Publish to local SNS + replicate to DR
sns.publish(
    TopicArn='arn:aws:sns:us-east-1:123456789012:events',
    Message=json.dumps(event_data)
)

# HTTPS subscription to DR region
sns.subscribe(
    TopicArn='arn:aws:sns:us-east-1:123456789012:events',
    Protocol='https',
    Endpoint='https://api-dr.us-west-2.amazonaws.com/events'
)
```

**DR Region Lambda**:
```python
def lambda_handler(event, context):
    # Validate SNS signature
    # Republish to DR region SNS
    sns_dr = boto3.client('sns', region_name='us-west-2')
    
    sns_dr.publish(
        TopicArn='arn:aws:sns:us-west-2:123456789012:events-dr',
        Message=event['Records'][0]['Sns']['Message']
    )
```

### Scenario 5: Content Moderation Pipeline

**Requirements**:
- User uploads image
- Automated moderation (Rekognition)
- Manual review if uncertain
- Notify user of result

**Architecture**:
```
S3 Upload → SNS (image-uploaded)
              ├→ Lambda (Rekognition) → SNS (moderation-result)
              │                           ├→ SQS (approved) → Publish image
              │                           ├→ SQS (rejected) → Notify user
              │                           └→ SQS (review) → Manual review
              └→ SQS (metadata) → Update database
```

**Filter Policies**:
```python
# Approved queue - only approved images
filter_approved = {
    "moderation_result": ["approved"]
}

# Rejected queue - only rejected images
filter_rejected = {
    "moderation_result": ["rejected"]
}

# Review queue - uncertain images
filter_review = {
    "moderation_result": ["uncertain"]
}
```

**Moderation Lambda**:
```python
import boto3

rekognition = boto3.client('rekognition')
sns = boto3.client('sns')

def lambda_handler(event, context):
    # Get image from S3
    s3_event = json.loads(event['Records'][0]['Sns']['Message'])
    bucket = s3_event['Records'][0]['s3']['bucket']['name']
    key = s3_event['Records'][0]['s3']['object']['key']
    
    # Moderate with Rekognition
    response = rekognition.detect_moderation_labels(
        Image={'S3Object': {'Bucket': bucket, 'Name': key}},
        MinConfidence=75
    )
    
    # Determine result
    if not response['ModerationLabels']:
        result = 'approved'
    elif any(label['Confidence'] > 90 for label in response['ModerationLabels']):
        result = 'rejected'
    else:
        result = 'uncertain'
    
    # Publish result
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123456789012:moderation-result',
        Message=json.dumps({
            'image_key': key,
            'result': result,
            'labels': response['ModerationLabels']
        }),
        MessageAttributes={
            'moderation_result': {
                'DataType': 'String',
                'StringValue': result
            }
        }
    )
```

## Exam Tips (SAP-C02)

### Key Decision Points

**SNS vs SQS**:
```
One-to-many distribution → SNS
One-to-one message queue → SQS
Fanout pattern → SNS + SQS
```

**Standard vs FIFO Topics**:
```
High throughput, ordering not critical → Standard
Exact ordering needed → FIFO
Must integrate with FIFO SQS → FIFO topic
```

**Filtering**:
```
Subscribers need different messages → Filter policies
All subscribers get everything → No filtering
```

### Common Scenarios

**"Publish to multiple destinations"**:
- SNS topic with multiple subscriptions
- Each subscription independent

**"CloudWatch alarm notifications"**:
- Alarm action → SNS topic
- Email, SMS, Lambda subscriptions

**"Decouple microservices"**:
- SNS → SQS fanout
- Each service has own queue

**"Mobile push notifications"**:
- Create platform application
- Register device endpoints
- Publish to endpoint ARN

**"Reduce costs"**:
- Use filter policies (fewer deliveries)
- Batch publish (up to 10 messages)
- Transactional SMS only when critical

**"Guaranteed ordering"**:
- FIFO topic + FIFO SQS subscriptions
- Message groups for parallel processing

**"Cross-region replication"**:
- HTTPS subscription to other region
- Lambda republishes to DR region SNS

This comprehensive SNS guide covers all aspects for SAP-C02 exam success.
