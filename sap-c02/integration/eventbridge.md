# Amazon EventBridge

## What is EventBridge?

Amazon EventBridge is a serverless event bus service that connects applications using events from AWS services, custom applications, and SaaS applications. It's the evolution of CloudWatch Events with additional capabilities.

## Why Use EventBridge?

### Key Benefits
- **Event-Driven Architecture**: Loosely coupled applications
- **Serverless**: No infrastructure to manage
- **Scalable**: Handles millions of events per second
- **Integrated**: 90+ AWS service sources, 20+ SaaS integrations
- **Schema Registry**: Discover, create, manage event schemas
- **Cross-Account**: Event sharing across accounts
- **Archive and Replay**: Debug and reprocess events

### Use Cases
- Application integration (microservices communication)
- Automated response to AWS service events
- Scheduled tasks (cron/rate expressions)
- SaaS application integration
- Custom application events
- Multi-account/multi-region orchestration
- Audit and compliance automation

## Core Concepts

### Event Buses

**Types**:
1. **Default Event Bus**: Receives events from AWS services
2. **Custom Event Buses**: For custom applications
3. **Partner Event Buses**: From SaaS providers

**Creating Custom Event Bus**:
```python
import boto3

eventbridge = boto3.client('events')

response = eventbridge.create_event_bus(
    Name='my-application-bus'
)

event_bus_arn = response['EventBusArn']
```

**Cross-Account Access**:
```python
# In Account A: Grant permission to Account B
eventbridge.put_permission(
    EventBusName='my-event-bus',
    StatementId='AllowAccountB',
    Action='events:PutEvents',
    Principal='123456789012'  # Account B
)

# In Account B: Send events to Account A
eventbridge.put_events(
    Entries=[
        {
            'Source': 'my.application',
            'DetailType': 'order.created',
            'Detail': '{"orderId": "123"}',
            'EventBusName': 'arn:aws:events:us-east-1:999999999999:event-bus/my-event-bus'
        }
    ]
)
```

### Events

**Event Structure**:
```json
{
  "version": "0",
  "id": "6a7e8feb-b491-4cf7-a9f1-bf3703467718",
  "detail-type": "EC2 Instance State-change Notification",
  "source": "aws.ec2",
  "account": "123456789012",
  "time": "2026-01-31T12:00:00Z",
  "region": "us-east-1",
  "resources": [
    "arn:aws:ec2:us-east-1:123456789012:instance/i-1234567890abcdef0"
  ],
  "detail": {
    "instance-id": "i-1234567890abcdef0",
    "state": "running"
  }
}
```

**Custom Event**:
```python
response = eventbridge.put_events(
    Entries=[
        {
            'Time': datetime.datetime.now(),
            'Source': 'my.ecommerce.app',
            'DetailType': 'Order Placed',
            'Detail': json.dumps({
                'orderId': 'ORD-12345',
                'customerId': 'CUST-001',
                'amount': 99.99,
                'items': [
                    {'sku': 'ITEM-1', 'quantity': 2}
                ]
            }),
            'EventBusName': 'my-application-bus'
        }
    ]
)

if response['FailedEntryCount'] > 0:
    print(f"Failed entries: {response['Entries']}")
```

**Batch Events** (up to 10 per request):
```python
entries = []
for i in range(10):
    entries.append({
        'Source': 'my.app',
        'DetailType': 'UserAction',
        'Detail': json.dumps({'userId': i, 'action': 'click'})
    })

response = eventbridge.put_events(Entries=entries)
```

### Rules

**Components**:
- **Event Pattern**: Filter which events to match
- **Target**: Where to send matched events (Lambda, SQS, SNS, etc.)
- **Input Transformer**: Transform event data before sending

**Creating Rule**:
```python
response = eventbridge.put_rule(
    Name='EC2InstanceStateChange',
    EventPattern=json.dumps({
        'source': ['aws.ec2'],
        'detail-type': ['EC2 Instance State-change Notification'],
        'detail': {
            'state': ['running']
        }
    }),
    State='ENABLED',
    Description='Trigger when EC2 instance starts',
    EventBusName='default'
)

rule_arn = response['RuleArn']
```

**Add Target**:
```python
eventbridge.put_targets(
    Rule='EC2InstanceStateChange',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:lambda:us-east-1:123456789012:function:ProcessInstanceStart',
            'RetryPolicy': {
                'MaximumRetryAttempts': 3,
                'MaximumEventAge': 3600
            },
            'DeadLetterConfig': {
                'Arn': 'arn:aws:sqs:us-east-1:123456789012:eventbridge-dlq'
            }
        }
    ]
)
```

## Event Patterns

### Exact Match

```json
{
  "source": ["aws.ec2"],
  "detail-type": ["EC2 Instance State-change Notification"]
}
```

### Prefix Matching

```json
{
  "source": [{"prefix": "aws."}]
}
```

### Anything-but

```json
{
  "detail": {
    "state": [{"anything-but": "terminated"}]
  }
}
```

### Numeric Matching

```json
{
  "detail": {
    "amount": [{"numeric": [">=", 100]}]
  }
}
```

### Multiple Values (OR)

```json
{
  "detail": {
    "state": ["running", "stopped", "terminated"]
  }
}
```

### Nested Properties

```json
{
  "detail": {
    "order": {
      "status": ["COMPLETED"],
      "payment": {
        "method": ["CREDIT_CARD"]
      }
    }
  }
}
```

### Exists

```json
{
  "detail": {
    "error": [{"exists": true}]
  }
}
```

### Complex Pattern

```json
{
  "source": ["my.ecommerce.app"],
  "detail-type": ["Order Placed"],
  "detail": {
    "amount": [{"numeric": [">=", 100]}],
    "customerType": ["premium"],
    "region": ["us-east-1", "us-west-2"],
    "items": {
      "category": [{"anything-but": "restricted"}]
    }
  }
}
```

## Targets

### Lambda Function

```python
eventbridge.put_targets(
    Rule='MyRule',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:lambda:us-east-1:123456789012:function:ProcessEvent',
            'RetryPolicy': {
                'MaximumRetryAttempts': 2,
                'MaximumEventAge': 3600
            }
        }
    ]
)
```

**Lambda Handler**:
```python
def lambda_handler(event, context):
    print(f"Event: {json.dumps(event)}")
    
    source = event['source']
    detail_type = event['detail-type']
    detail = event['detail']
    
    # Process event
    if source == 'aws.ec2':
        instance_id = detail['instance-id']
        state = detail['state']
        print(f"Instance {instance_id} is now {state}")
    
    return {'statusCode': 200}
```

### SQS Queue

```python
eventbridge.put_targets(
    Rule='MyRule',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:sqs:us-east-1:123456789012:my-queue',
            'MessageGroupId': 'event-group'  # For FIFO queue
        }
    ]
)
```

**Queue Policy** (allow EventBridge):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:123456789012:my-queue",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "arn:aws:events:us-east-1:123456789012:rule/MyRule"
        }
      }
    }
  ]
}
```

### SNS Topic

```python
eventbridge.put_targets(
    Rule='MyRule',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:sns:us-east-1:123456789012:my-topic'
        }
    ]
)
```

### Step Functions

```python
eventbridge.put_targets(
    Rule='MyRule',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:states:us-east-1:123456789012:stateMachine:MyStateMachine',
            'RoleArn': 'arn:aws:iam::123456789012:role/EventBridgeStepFunctionsRole',
            'Input': json.dumps({
                'orderId': 'ORD-123',
                'source': 'eventbridge'
            })
        }
    ]
)
```

### Kinesis Stream

```python
eventbridge.put_targets(
    Rule='MyRule',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:kinesis:us-east-1:123456789012:stream/my-stream',
            'RoleArn': 'arn:aws:iam::123456789012:role/EventBridgeKinesisRole',
            'KinesisParameters': {
                'PartitionKeyPath': '$.detail.orderId'
            }
        }
    ]
)
```

### ECS Task

```python
eventbridge.put_targets(
    Rule='MyRule',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:ecs:us-east-1:123456789012:cluster/my-cluster',
            'RoleArn': 'arn:aws:iam::123456789012:role/EventBridgeECSRole',
            'EcsParameters': {
                'TaskDefinitionArn': 'arn:aws:ecs:us-east-1:123456789012:task-definition/my-task:1',
                'TaskCount': 1,
                'LaunchType': 'FARGATE',
                'NetworkConfiguration': {
                    'awsvpcConfiguration': {
                        'Subnets': ['subnet-12345'],
                        'SecurityGroups': ['sg-12345'],
                        'AssignPublicIp': 'ENABLED'
                    }
                }
            }
        }
    ]
)
```

### Multiple Targets

```python
eventbridge.put_targets(
    Rule='OrderPlaced',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:lambda:...:function:ProcessOrder'
        },
        {
            'Id': '2',
            'Arn': 'arn:aws:sqs:...:order-queue'
        },
        {
            'Id': '3',
            'Arn': 'arn:aws:sns:...:order-notifications'
        },
        {
            'Id': '4',
            'Arn': 'arn:aws:states:...:stateMachine:OrderWorkflow',
            'RoleArn': 'arn:aws:iam::...:role/EventBridgeRole'
        }
    ]
)
```

## Input Transformation

### Input Transformer

**Extract Fields from Event**:
```python
eventbridge.put_targets(
    Rule='MyRule',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:lambda:...:function:ProcessOrder',
            'InputTransformer': {
                'InputPathsMap': {
                    'orderId': '$.detail.orderId',
                    'customer': '$.detail.customerId',
                    'total': '$.detail.amount',
                    'time': '$.time'
                },
                'InputTemplate': json.dumps({
                    'order': {
                        'id': '<orderId>',
                        'customerId': '<customer>',
                        'total': '<total>'
                    },
                    'receivedAt': '<time>'
                })
            }
        }
    ]
)
```

**Original Event**:
```json
{
  "source": "my.app",
  "detail-type": "Order Placed",
  "detail": {
    "orderId": "ORD-123",
    "customerId": "CUST-001",
    "amount": 99.99
  },
  "time": "2026-01-31T12:00:00Z"
}
```

**Transformed Input to Lambda**:
```json
{
  "order": {
    "id": "ORD-123",
    "customerId": "CUST-001",
    "total": "99.99"
  },
  "receivedAt": "2026-01-31T12:00:00Z"
}
```

### Input Path

**Send Only Detail**:
```python
eventbridge.put_targets(
    Rule='MyRule',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:lambda:...:function:ProcessOrder',
            'InputPath': '$.detail'
        }
    ]
)
```

**Lambda Receives**:
```json
{
  "orderId": "ORD-123",
  "customerId": "CUST-001",
  "amount": 99.99
}
```

## Scheduled Events

### Cron Expressions

**Basic Format**: `cron(minutes hours day-of-month month day-of-week year)`

**Examples**:
```python
# Every day at 9:00 AM UTC
eventbridge.put_rule(
    Name='DailyBackup',
    ScheduleExpression='cron(0 9 * * ? *)',
    State='ENABLED'
)

# Every Monday at 6:00 PM UTC
eventbridge.put_rule(
    Name='WeeklyReport',
    ScheduleExpression='cron(0 18 ? * MON *)',
    State='ENABLED'
)

# First day of every month at midnight UTC
eventbridge.put_rule(
    Name='MonthlyBilling',
    ScheduleExpression='cron(0 0 1 * ? *)',
    State='ENABLED'
)

# Every 5 minutes
eventbridge.put_rule(
    Name='HealthCheck',
    ScheduleExpression='cron(0/5 * * * ? *)',
    State='ENABLED'
)

# Weekdays at 9 AM
eventbridge.put_rule(
    Name='WeekdayMorning',
    ScheduleExpression='cron(0 9 ? * MON-FRI *)',
    State='ENABLED'
)
```

### Rate Expressions

**Format**: `rate(value unit)`

**Examples**:
```python
# Every 5 minutes
eventbridge.put_rule(
    Name='FrequentCheck',
    ScheduleExpression='rate(5 minutes)',
    State='ENABLED'
)

# Every hour
eventbridge.put_rule(
    Name='HourlySync',
    ScheduleExpression='rate(1 hour)',
    State='ENABLED'
)

# Every day
eventbridge.put_rule(
    Name='DailyTask',
    ScheduleExpression='rate(1 day)',
    State='ENABLED'
)
```

## Schema Registry

### Discovery

**Enable Schema Discovery**:
```python
eventbridge.start_discoverer(
    DiscovererId='my-discoverer'
)
```

**Auto-discover schemas** from events on event bus

### Creating Schema

**Manual Schema**:
```python
schemas = boto3.client('schemas')

response = schemas.create_schema(
    RegistryName='my-registry',
    SchemaName='my.app.OrderPlaced',
    Type='OpenApi3',
    Content=json.dumps({
        'openapi': '3.0.0',
        'info': {
            'title': 'OrderPlaced',
            'version': '1.0.0'
        },
        'paths': {},
        'components': {
            'schemas': {
                'OrderPlaced': {
                    'type': 'object',
                    'properties': {
                        'orderId': {'type': 'string'},
                        'customerId': {'type': 'string'},
                        'amount': {'type': 'number'}
                    },
                    'required': ['orderId', 'customerId', 'amount']
                }
            }
        }
    })
)
```

**Code Bindings**:
```python
# Generate code for schema (Python, Java, TypeScript)
response = schemas.put_code_binding(
    RegistryName='my-registry',
    SchemaName='my.app.OrderPlaced',
    Language='Python3.6'
)

# Download generated code
code_binding = schemas.get_code_binding_source(
    RegistryName='my-registry',
    SchemaName='my.app.OrderPlaced',
    Language='Python3.6'
)
```

## Archive and Replay

### Archive

**Create Archive**:
```python
eventbridge.create_archive(
    ArchiveName='my-archive',
    EventSourceArn='arn:aws:events:us-east-1:123456789012:event-bus/my-bus',
    Description='Archive all events',
    EventPattern=json.dumps({
        'source': ['my.app']
    }),
    RetentionDays=30  # 0 = indefinite
)
```

**Archive automatically stores events** matching pattern

### Replay

**Replay Events**:
```python
response = eventbridge.start_replay(
    ReplayName='my-replay',
    EventSourceArn='arn:aws:events:us-east-1:123456789012:archive/my-archive',
    EventStartTime=datetime.datetime(2026, 1, 1),
    EventEndTime=datetime.datetime(2026, 1, 31),
    Destination={
        'Arn': 'arn:aws:events:us-east-1:123456789012:event-bus/my-bus'
    }
)

replay_arn = response['ReplayArn']
```

**Use Cases**:
- Debugging (replay events to test fixes)
- Disaster recovery (replay lost events)
- Development (replay production events to dev environment)

## Monitoring

### CloudWatch Metrics

**Metrics**:
- `Invocations`: Number of times a target is invoked
- `FailedInvocations`: Failed target invocations
- `ThrottledRules`: Throttled rule invocations
- `MatchedEvents`: Events matched by rule
- `TriggeredRules`: Number of triggered rules

**Alarms**:
```python
cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_alarm(
    AlarmName='EventBridge-High-Failures',
    MetricName='FailedInvocations',
    Namespace='AWS/Events',
    Statistic='Sum',
    Period=300,
    EvaluationPeriods=1,
    Threshold=10,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'RuleName', 'Value': 'MyRule'}
    ]
)
```

### Dead Letter Queue

**Configure DLQ**:
```python
eventbridge.put_targets(
    Rule='MyRule',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:lambda:...:function:ProcessEvent',
            'DeadLetterConfig': {
                'Arn': 'arn:aws:sqs:us-east-1:123456789012:eventbridge-dlq'
            }
        }
    ]
)
```

**Failed events** sent to DLQ after max retries

### CloudWatch Logs

**Log All Events**:
```python
eventbridge.put_rule(
    Name='LogAllEvents',
    EventPattern=json.dumps({'source': [{'prefix': ''}]}),
    State='ENABLED'
)

eventbridge.put_targets(
    Rule='LogAllEvents',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:logs:us-east-1:123456789012:log-group:/aws/events/all-events'
        }
    ]
)
```

## SaaS Integrations

### Partner Event Sources

**Available Partners**:
- Auth0
- Datadog
- MongoDB
- PagerDuty
- Salesforce
- Segment
- Shopify
- Stripe
- Twilio
- Zendesk

**Associate Partner Event Source**:
```python
eventbridge.create_partner_event_source(
    Name='aws.partner/stripe.com/acct_123/events',
    Account='123456789012'
)
```

**Create Rule for Partner Events**:
```python
eventbridge.put_rule(
    Name='StripePayments',
    EventBusName='aws.partner/stripe.com/acct_123/events',
    EventPattern=json.dumps({
        'detail-type': ['charge.succeeded']
    }),
    State='ENABLED'
)
```

## API Destinations

### HTTP Endpoints

**Create Connection** (credentials):
```python
eventbridge.create_connection(
    Name='my-api-connection',
    AuthorizationType='API_KEY',
    AuthParameters={
        'ApiKeyAuthParameters': {
            'ApiKeyName': 'X-API-Key',
            'ApiKeyValue': 'secret-api-key'
        }
    }
)
```

**Create API Destination**:
```python
eventbridge.create_api_destination(
    Name='my-api-destination',
    ConnectionArn='arn:aws:events:...:connection/my-api-connection',
    InvocationEndpoint='https://api.example.com/webhook',
    HttpMethod='POST',
    InvocationRateLimitPerSecond=10
)
```

**Add as Target**:
```python
eventbridge.put_targets(
    Rule='MyRule',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:events:...:destination/my-api-destination',
            'RoleArn': 'arn:aws:iam::...:role/EventBridgeAPIDestinationRole',
            'HttpParameters': {
                'HeaderParameters': {
                    'X-Custom-Header': 'value'
                },
                'QueryStringParameters': {
                    'param1': 'value1'
                }
            }
        }
    ]
)
```

## Cost and Pricing

### Pricing

**Custom Events**:
- $1.00 per million events published
- First 1M events/month: Free

**AWS Service Events**: Free

**Schema Registry**:
- Free

**Archive**:
- $0.10 per GB/month stored

**Replay**:
- $0.10 per GB replayed

### Example Costs

**Scenario 1** (1M custom events/month):
```
Events: 1M (free tier)
Cost: $0/month
```

**Scenario 2** (10M custom events/month):
```
Events: 10M - 1M (free) = 9M
Cost: 9M / 1M × $1.00 = $9/month
```

**Scenario 3** (100M events/month + archive):
```
Events: 99M / 1M × $1.00 = $99/month
Archive: 100 GB × $0.10 = $10/month
Total: $109/month
```

## Real-World Scenarios

### Scenario 1: Microservices Event-Driven Architecture

**Architecture**:
```
Order Service → EventBridge → [Inventory, Payment, Shipping, Notification]
```

**Order Service** (publish event):
```python
eventbridge.put_events(
    Entries=[
        {
            'Source': 'order.service',
            'DetailType': 'Order Placed',
            'Detail': json.dumps({
                'orderId': 'ORD-12345',
                'customerId': 'CUST-001',
                'items': [
                    {'sku': 'ITEM-1', 'quantity': 2, 'price': 49.99}
                ],
                'total': 99.98
            }),
            'EventBusName': 'ecommerce-bus'
        }
    ]
)
```

**Inventory Service** (rule):
```json
{
  "source": ["order.service"],
  "detail-type": ["Order Placed"]
}
```

**Payment Service** (rule with filter):
```json
{
  "source": ["order.service"],
  "detail-type": ["Order Placed"],
  "detail": {
    "total": [{"numeric": [">", 0]}]
  }
}
```

**Cost** (1M orders/month):
```
Events: 1M (free tier)
Cost: $0/month
```

### Scenario 2: Multi-Account Event Routing

**Architecture**:
```
Account A (Prod) → EventBridge → Account B (Security)
                               → Account C (Analytics)
```

**Account A** (send events):
```python
# Grant permission to Accounts B and C
for account_id in ['222222222222', '333333333333']:
    eventbridge.put_permission(
        StatementId=f'Allow-{account_id}',
        Action='events:PutEvents',
        Principal=account_id
    )
```

**Account B** (receive events):
```python
# Create rule that listens to Account A events
eventbridge.put_rule(
    Name='SecurityEvents',
    EventPattern=json.dumps({
        'account': ['111111111111'],  # Account A
        'source': ['aws.guardduty']
    }),
    State='ENABLED'
)
```

### Scenario 3: Scheduled Data Pipeline

**Daily ETL** at 2 AM:
```python
# Create scheduled rule
eventbridge.put_rule(
    Name='DailyETL',
    ScheduleExpression='cron(0 2 * * ? *)',
    State='ENABLED'
)

# Trigger Step Functions workflow
eventbridge.put_targets(
    Rule='DailyETL',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:states:...:stateMachine:ETL-Pipeline',
            'RoleArn': 'arn:aws:iam::...:role/EventBridgeStepFunctionsRole',
            'Input': json.dumps({
                'date': '2026-01-31',
                'source': 's3://data-lake/raw/',
                'destination': 's3://data-lake/processed/'
            })
        }
    ]
)
```

**Cost** (30 executions/month):
```
Events: 30 (free tier)
Cost: $0/month
```

### Scenario 4: Real-Time Fraud Detection

**Architecture**:
```
Payment Gateway → EventBridge → [Fraud Detection Lambda, DynamoDB, SNS]
```

**Event Pattern** (high-value transactions):
```json
{
  "source": ["payment.gateway"],
  "detail-type": ["Payment Processed"],
  "detail": {
    "amount": [{"numeric": [">=", 1000]}],
    "merchantCountry": [{"anything-but": ["US", "CA"]}]
  }
}
```

**Multiple Targets**:
```python
eventbridge.put_targets(
    Rule='SuspiciousPayments',
    Targets=[
        {
            'Id': '1',
            'Arn': 'arn:aws:lambda:...:function:FraudDetection'
        },
        {
            'Id': '2',
            'Arn': 'arn:aws:dynamodb:...:table/SuspiciousTransactions',
            'RoleArn': 'arn:aws:iam::...:role/EventBridgeDynamoDBRole'
        },
        {
            'Id': '3',
            'Arn': 'arn:aws:sns:...:fraud-alerts'
        }
    ]
)
```

**Cost** (100K suspicious transactions/month):
```
Events: 100K (free tier)
Cost: $0/month
```

### Scenario 5: Infrastructure Automation

**Auto-remediation** for unencrypted EBS volumes:

**Event Pattern**:
```json
{
  "source": ["aws.ec2"],
  "detail-type": ["EBS Volume Notification"],
  "detail": {
    "event": ["createVolume"],
    "result": ["available"]
  }
}
```

**Lambda Target**:
```python
def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    
    volume_id = event['detail']['volume-id']
    
    # Check if encrypted
    response = ec2.describe_volumes(VolumeIds=[volume_id])
    volume = response['Volumes'][0]
    
    if not volume['Encrypted']:
        # Take action
        ec2.create_tags(
            Resources=[volume_id],
            Tags=[{'Key': 'Compliance', 'Value': 'FAILED'}]
        )
        
        # Send notification
        sns.publish(
            TopicArn='arn:aws:sns:...:compliance-alerts',
            Message=f'Unencrypted volume detected: {volume_id}'
        )
```

## Exam Tips (SAP-C02)

### Key Decision Points

**EventBridge vs SNS**:
```
Event filtering needed → EventBridge
Schema registry needed → EventBridge
SaaS integration → EventBridge
Simple pub/sub → SNS
Mobile push → SNS
```

**EventBridge vs SQS**:
```
Event routing/filtering → EventBridge
Multiple consumers → EventBridge
Queueing/buffering → SQS
Decoupling with ordering → SQS
```

**Default vs Custom Event Bus**:
```
AWS service events → Default bus
Custom application events → Custom bus
Multi-account isolation → Custom bus
```

### Common Scenarios

**"Event-driven microservices"**:
- Custom event bus for application
- Event patterns for filtering
- Multiple targets (Lambda, SQS, Step Functions)

**"Cross-account event routing"**:
- Put permission on source bus
- Rules in target accounts
- Resource-based policies

**"Scheduled tasks"**:
- Cron/rate expressions
- Lambda or Step Functions target
- Consider timezone (UTC)

**"SaaS integration"**:
- Partner event sources
- API destinations for webhooks

**"Audit and compliance"**:
- Rules for AWS service events
- Archive for retention
- Replay for analysis

This comprehensive EventBridge guide covers orchestration, filtering, and integration patterns for SAP-C02 success.
