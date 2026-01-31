# AWS CloudWatch: Observability & Monitoring

## Table of Contents
1. [CloudWatch Fundamentals](#cloudwatch-fundamentals)
2. [CloudWatch Logs](#cloudwatch-logs)
3. [CloudWatch Metrics](#cloudwatch-metrics)
4. [CloudWatch Alarms](#cloudwatch-alarms)
5. [EventBridge](#eventbridge)
6. [X-Ray Distributed Tracing](#x-ray-distributed-tracing)
7. [Container & Application Insights](#container--application-insights)
8. [LocalStack Examples](#localstack-examples)
9. [Production Patterns](#production-patterns)
10. [Interview Questions](#interview-questions)

---

## CloudWatch Fundamentals

### Three Pillars of Observability

**1. Metrics** (What is happening):
```
Numerical time-series data
- CPU utilization: 75%
- Request count: 1,234/min
- Error rate: 0.5%
- Latency p99: 250ms

Answer: "Is the system healthy?"
```

**2. Logs** (Why it's happening):
```
Text records of events
- Application logs
- Access logs
- Error messages
- Debug information

Answer: "What caused the error?"
```

**3. Traces** (Where it's happening):
```
Request flow across services
- Service A → Service B → Database
- Latency breakdown per hop
- Error propagation

Answer: "Which service is slow?"
```

**CloudWatch Services**:
```
CloudWatch Logs → Store and query logs
CloudWatch Metrics → Collect and visualize metrics
CloudWatch Alarms → Alert on thresholds
CloudWatch Dashboards → Visual monitoring
EventBridge → Event-driven automation
X-Ray → Distributed tracing
Container Insights → ECS/EKS monitoring
Lambda Insights → Lambda performance
Application Insights → Auto-discovery
ServiceLens → Unified view
Synthetics → Canary testing
```

### History & Evolution

```
2009: CloudWatch Launch
      - Basic EC2 metrics
      - Simple alarms

2014: CloudWatch Logs
      - Log aggregation
      - Log retention

2015: CloudWatch Events
      - Scheduled rules
      - Event patterns

2018: CloudWatch Logs Insights
      - Query language
      - Fast log analysis

2019: CloudWatch ServiceLens
      - X-Ray integration
      - Service maps

2020: CloudWatch Synthetics
      - Canary monitoring
      - API testing

2021: CloudWatch Evidently
      - Feature flags
      - A/B testing

2022: CloudWatch RUM
      - Real User Monitoring
      - Frontend performance

2023: CloudWatch Internet Monitor
      - Global connectivity
      - Network health

2024: Enhanced Query Performance
      - 10× faster Insights
      - Cost optimization
```

### Pricing

**Logs**:
```
Ingestion: $0.50/GB
Storage: $0.03/GB/month
Insights Query: $0.005/GB scanned
Vended Logs (VPC Flow, Route 53): $0.50/GB

Example (100 GB/day):
- Ingestion: 100 × 30 × $0.50 = $1,500/month
- Storage (30-day retention): 100 × 30 × $0.03 = $90/month
- Queries (10 GB/day): 10 × 30 × $0.005 = $1.50/month
- Total: $1,591.50/month

Optimization:
- 7-day retention: 100 × 7 × $0.03 = $21/month (77% savings)
- Filter before ingestion (Lambda)
- Use metric filters instead of queries
```

**Metrics**:
```
Standard (5-minute): Free for AWS services
Custom Metrics: $0.30/metric/month (first 10K)
High-Resolution (1-second): $0.30/metric/month

API Requests:
GetMetricStatistics: $0.01/1,000 requests
PutMetricData: $0.01/1,000 requests

Example (1,000 custom metrics):
- First 10,000: 1,000 × $0.30 = $300/month
- GetMetricData (1M/month): 1M / 1000 × $0.01 = $10/month
- Total: $310/month
```

**Alarms**:
```
Standard Metrics: $0.10/alarm/month (first 10)
High-Resolution: $0.30/alarm/month
Composite Alarms: $0.50/alarm/month

Example (100 alarms):
- First 10: Free
- Next 90: 90 × $0.10 = $9/month
- Total: $9/month
```

**X-Ray**:
```
Traces Recorded: $5.00/1 million traces
Traces Retrieved: $0.50/1 million traces
Traces Scanned: $0.50/1 million traces

Example (10M requests/month, 5% sampling):
- Traces recorded: 10M × 0.05 / 1M × $5 = $2.50/month
- Traces retrieved (10%): 0.5M / 1M × $0.50 = $0.25/month
- Total: $2.75/month

100% sampling: $50/month (18× more expensive)
```

---

## CloudWatch Logs

### Log Groups & Streams

**Create Log Group**:
```bash
aws logs create-log-group \
  --log-group-name /aws/lambda/myfunction

aws logs put-retention-policy \
  --log-group-name /aws/lambda/myfunction \
  --retention-in-days 7
```

**Log Stream** (one per Lambda invocation, EC2 instance, etc.):
```
/aws/lambda/myfunction
├── 2026/01/31/[$LATEST]abc123
├── 2026/01/31/[$LATEST]def456
└── 2026/01/31/[$LATEST]ghi789
```

**Python Logging**:
```python
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info('Processing request', extra={
        'requestId': context.request_id,
        'userId': event.get('userId')
    })
    
    try:
        result = process_data(event)
        logger.info('Request completed', extra={'result': result})
        return result
    except Exception as e:
        logger.error('Request failed', extra={
            'error': str(e),
            'event': event
        }, exc_info=True)
        raise
```

**Go Logging**:
```go
package main

import (
    "context"
    "github.com/aws/aws-lambda-go/lambda"
    "github.com/sirupsen/logrus"
)

var log = logrus.New()

func init() {
    log.SetFormatter(&logrus.JSONFormatter{})
    log.SetLevel(logrus.InfoLevel)
}

func handler(ctx context.Context, event map[string]interface{}) error {
    log.WithFields(logrus.Fields{
        "userId":    event["userId"],
        "requestId": ctx.Value("requestId"),
    }).Info("Processing request")
    
    if err := processData(event); err != nil {
        log.WithError(err).Error("Request failed")
        return err
    }
    
    log.Info("Request completed")
    return nil
}

func main() {
    lambda.Start(handler)
}
```

### CloudWatch Logs Insights

**Query Language**:
```sql
-- Find errors in last hour
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

-- Count errors by type
fields @timestamp, @message
| filter @message like /ERROR/
| parse @message /ERROR: (?<errorType>.*?) -/
| stats count() by errorType
| sort count desc

-- P99 latency
fields @timestamp, duration
| filter @type = "REPORT"
| stats avg(duration), max(duration), pct(duration, 99) by bin(5m)

-- Parse JSON logs
fields @timestamp, @message
| parse @message /"userId":"(?<userId>.*?)"/
| parse @message /"action":"(?<action>.*?)"/
| stats count() by userId, action

-- Find slow requests
filter @type = "REPORT"
| fields @requestId, @billedDuration
| filter @billedDuration > 1000
| sort @billedDuration desc
```

**Python Query Client**:
```python
import boto3
import time

logs = boto3.client('logs')

def query_logs(log_group, query_string, start_time, end_time):
    # Start query
    response = logs.start_query(
        logGroupName=log_group,
        startTime=int(start_time.timestamp()),
        endTime=int(end_time.timestamp()),
        queryString=query_string
    )
    
    query_id = response['queryId']
    
    # Wait for completion
    while True:
        result = logs.get_query_results(queryId=query_id)
        status = result['status']
        
        if status == 'Complete':
            return result['results']
        elif status == 'Failed':
            raise Exception('Query failed')
        
        time.sleep(1)

# Usage
from datetime import datetime, timedelta

results = query_logs(
    log_group='/aws/lambda/myfunction',
    query_string='''
        fields @timestamp, @message
        | filter @message like /ERROR/
        | stats count() by bin(1h)
    ''',
    start_time=datetime.now() - timedelta(days=1),
    end_time=datetime.now()
)

for row in results:
    print({field['field']: field['value'] for field in row})
```

### Metric Filters

**Count Errors**:
```bash
aws logs put-metric-filter \
  --log-group-name /aws/lambda/myfunction \
  --filter-name ErrorCount \
  --filter-pattern "ERROR" \
  --metric-transformations \
    metricName=Errors,metricNamespace=MyApp,metricValue=1,defaultValue=0
```

**Extract Latency**:
```bash
# Log format: "Latency: 123ms"
aws logs put-metric-filter \
  --log-group-name /aws/lambda/myfunction \
  --filter-name Latency \
  --filter-pattern "[time, request_id, level, msg, latency_label, latency, unit]" \
  --metric-transformations \
    metricName=RequestLatency,metricNamespace=MyApp,metricValue='$latency',unit=Milliseconds
```

**JSON Logs**:
```bash
# Log: {"level": "ERROR", "message": "Payment failed", "amount": 99.99}
aws logs put-metric-filter \
  --log-group-name /aws/lambda/payment \
  --filter-name FailedPayments \
  --filter-pattern '{ $.level = "ERROR" && $.message = "Payment failed" }' \
  --metric-transformations \
    metricName=FailedPayments,metricNamespace=Payments,metricValue='$.amount',unit=None
```

### Log Subscription Filters

**Stream to Lambda**:
```bash
aws logs put-subscription-filter \
  --log-group-name /aws/lambda/myfunction \
  --filter-name ProcessErrors \
  --filter-pattern "ERROR" \
  --destination-arn arn:aws:lambda:us-east-1:123456789012:function:ProcessErrors
```

**Process Logs Lambda**:
```python
import json
import gzip
import base64

def lambda_handler(event, context):
    # Decompress logs
    compressed = base64.b64decode(event['awslogs']['data'])
    logs = json.loads(gzip.decompress(compressed))
    
    for log_event in logs['logEvents']:
        message = log_event['message']
        timestamp = log_event['timestamp']
        
        # Process error
        if 'CRITICAL' in message:
            send_pager_alert(message, timestamp)
        elif 'ERROR' in message:
            send_slack_notification(message)
```

**Stream to Kinesis**:
```bash
aws logs put-subscription-filter \
  --log-group-name /aws/lambda/myfunction \
  --filter-name StreamToKinesis \
  --filter-pattern "" \
  --destination-arn arn:aws:kinesis:us-east-1:123456789012:stream/log-stream
```

**Stream to S3** (via Kinesis Data Firehose):
```bash
# Create Firehose delivery stream
aws firehose create-delivery-stream \
  --delivery-stream-name logs-to-s3 \
  --s3-destination-configuration \
    RoleARN=arn:aws:iam::123456789012:role/FirehoseRole,BucketARN=arn:aws:s3:::my-logs,Prefix=logs/,CompressionFormat=GZIP

# Subscribe log group
aws logs put-subscription-filter \
  --log-group-name /aws/lambda/myfunction \
  --filter-name ArchiveToS3 \
  --filter-pattern "" \
  --destination-arn arn:aws:firehose:us-east-1:123456789012:deliverystream/logs-to-s3
```

---

## CloudWatch Metrics

### Namespaces & Dimensions

**AWS Namespaces**:
```
AWS/EC2 - EC2 instances
AWS/Lambda - Lambda functions
AWS/RDS - Relational databases
AWS/DynamoDB - DynamoDB tables
AWS/ECS - Container service
AWS/ApplicationELB - Application Load Balancer
AWS/ApiGateway - API Gateway
```

**Dimensions** (filters):
```
EC2:
- InstanceId: i-1234567890abcdef0
- InstanceType: t3.micro
- AutoScalingGroupName: my-asg

Lambda:
- FunctionName: myfunction
- Resource: myfunction:prod

DynamoDB:
- TableName: Users
- GlobalSecondaryIndexName: email-index
```

**Custom Metrics** (Python):
```python
import boto3
from datetime import datetime

cloudwatch = boto3.client('cloudwatch')

def put_metric(metric_name, value, unit='None', dimensions=None):
    cloudwatch.put_metric_data(
        Namespace='MyApp',
        MetricData=[{
            'MetricName': metric_name,
            'Value': value,
            'Unit': unit,
            'Timestamp': datetime.utcnow(),
            'Dimensions': dimensions or [],
            'StorageResolution': 60  # Standard (60s) or High-Res (1s)
        }]
    )

# Usage
put_metric('OrdersProcessed', 1, 'Count', [
    {'Name': 'Environment', 'Value': 'production'},
    {'Name': 'Region', 'Value': 'us-east-1'}
])

put_metric('PaymentAmount', 99.99, 'None', [
    {'Name': 'PaymentMethod', 'Value': 'creditcard'}
])

put_metric('APILatency', 250, 'Milliseconds', [
    {'Name': 'Endpoint', 'Value': '/api/users'},
    {'Name': 'Method', 'Value': 'GET'}
])
```

**Batch Put Metrics** (more efficient):
```python
def put_metrics_batch(metrics):
    # Max 20 metrics per API call
    cloudwatch.put_metric_data(
        Namespace='MyApp',
        MetricData=metrics
    )

# Usage
metrics = [
    {
        'MetricName': 'Requests',
        'Value': 100,
        'Unit': 'Count',
        'Dimensions': [{'Name': 'API', 'Value': 'users'}]
    },
    {
        'MetricName': 'Errors',
        'Value': 5,
        'Unit': 'Count',
        'Dimensions': [{'Name': 'API', 'Value': 'users'}]
    }
]

put_metrics_batch(metrics)
```

**Go Metrics**:
```go
package main

import (
    "time"
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/cloudwatch"
)

type MetricsClient struct {
    cw *cloudwatch.CloudWatch
}

func NewMetricsClient() *MetricsClient {
    sess := session.Must(session.NewSession())
    return &MetricsClient{
        cw: cloudwatch.New(sess),
    }
}

func (m *MetricsClient) PutMetric(name string, value float64, unit string, dimensions map[string]string) error {
    dims := make([]*cloudwatch.Dimension, 0, len(dimensions))
    for k, v := range dimensions {
        dims = append(dims, &cloudwatch.Dimension{
            Name:  aws.String(k),
            Value: aws.String(v),
        })
    }
    
    _, err := m.cw.PutMetricData(&cloudwatch.PutMetricDataInput{
        Namespace: aws.String("MyApp"),
        MetricData: []*cloudwatch.MetricDatum{{
            MetricName: aws.String(name),
            Value:      aws.Float64(value),
            Unit:       aws.String(unit),
            Timestamp:  aws.Time(time.Now()),
            Dimensions: dims,
        }},
    })
    
    return err
}

// Usage
client := NewMetricsClient()
client.PutMetric("Requests", 1, "Count", map[string]string{
    "Environment": "production",
    "Service":     "api",
})
```

### Embedded Metric Format (EMF)

**Log + Metric in One**:
```python
import json

def log_metric(metric_name, value, unit='None', dimensions=None):
    # EMF format
    log = {
        '_aws': {
            'Timestamp': int(time.time() * 1000),
            'CloudWatchMetrics': [{
                'Namespace': 'MyApp',
                'Dimensions': [list(dimensions.keys())] if dimensions else [],
                'Metrics': [{
                    'Name': metric_name,
                    'Unit': unit
                }]
            }]
        },
        metric_name: value
    }
    
    # Add dimensions
    if dimensions:
        log.update(dimensions)
    
    # Print to stdout (CloudWatch Logs)
    print(json.dumps(log))

# Usage
log_metric('ProcessingTime', 150, 'Milliseconds', {
    'Service': 'OrderProcessing',
    'Environment': 'production'
})

# Output (creates both log and metric):
# {
#   "_aws": {
#     "Timestamp": 1706745600000,
#     "CloudWatchMetrics": [{
#       "Namespace": "MyApp",
#       "Dimensions": [["Service", "Environment"]],
#       "Metrics": [{"Name": "ProcessingTime", "Unit": "Milliseconds"}]
#     }]
#   },
#   "ProcessingTime": 150,
#   "Service": "OrderProcessing",
#   "Environment": "production"
# }
```

**Benefits**:
```
✅ Single API call (log ingestion, not PutMetricData)
✅ Lower cost ($0.50/GB vs API calls)
✅ Automatic metric creation
✅ Searchable logs + queryable metrics
```

### Statistics

**Get Metrics**:
```python
from datetime import datetime, timedelta

def get_metric_stats(metric_name, stat, namespace='AWS/Lambda', dimensions=None):
    response = cloudwatch.get_metric_statistics(
        Namespace=namespace,
        MetricName=metric_name,
        Dimensions=dimensions or [],
        StartTime=datetime.utcnow() - timedelta(hours=1),
        EndTime=datetime.utcnow(),
        Period=300,  # 5 minutes
        Statistics=[stat]  # Sum, Average, Maximum, Minimum, SampleCount
    )
    
    return response['Datapoints']

# Usage
stats = get_metric_stats(
    metric_name='Invocations',
    stat='Sum',
    namespace='AWS/Lambda',
    dimensions=[{
        'Name': 'FunctionName',
        'Value': 'myfunction'
    }]
)

for point in sorted(stats, key=lambda x: x['Timestamp']):
    print(f"{point['Timestamp']}: {point['Sum']}")
```

**Extended Statistics** (percentiles):
```python
response = cloudwatch.get_metric_statistics(
    Namespace='AWS/Lambda',
    MetricName='Duration',
    Dimensions=[{'Name': 'FunctionName', 'Value': 'myfunction'}],
    StartTime=datetime.utcnow() - timedelta(hours=1),
    EndTime=datetime.utcnow(),
    Period=300,
    ExtendedStatistics=['p50', 'p90', 'p99']
)

for point in response['Datapoints']:
    print(f"p50: {point['ExtendedStatistics']['p50']} ms")
    print(f"p90: {point['ExtendedStatistics']['p90']} ms")
    print(f"p99: {point['ExtendedStatistics']['p99']} ms")
```

---

## CloudWatch Alarms

### Threshold Alarms

**Create Alarm**:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name HighCPU \
  --alarm-description "CPU > 80% for 5 minutes" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:HighCPUTopic
```

**Python**:
```python
cloudwatch.put_metric_alarm(
    AlarmName='LambdaErrors',
    AlarmDescription='Lambda function errors > 10 in 5 minutes',
    MetricName='Errors',
    Namespace='AWS/Lambda',
    Statistic='Sum',
    Dimensions=[{
        'Name': 'FunctionName',
        'Value': 'myfunction'
    }],
    Period=300,
    EvaluationPeriods=1,
    Threshold=10,
    ComparisonOperator='GreaterThanThreshold',
    TreatMissingData='notBreaching',
    ActionsEnabled=True,
    AlarmActions=[
        'arn:aws:sns:us-east-1:123456789012:ErrorAlerts'
    ]
)
```

**Alarm States**:
```
OK - Metric below threshold
ALARM - Metric breached threshold
INSUFFICIENT_DATA - Not enough data
```

### Anomaly Detection

**ML-Based Thresholds**:
```python
cloudwatch.put_metric_alarm(
    AlarmName='AnomalousTraffic',
    AlarmDescription='Unusual traffic pattern detected',
    ComparisonOperator='LessThanLowerOrGreaterThanUpperThreshold',
    EvaluationPeriods=2,
    Metrics=[
        {
            'Id': 'm1',
            'ReturnData': True,
            'MetricStat': {
                'Metric': {
                    'Namespace': 'AWS/ApplicationELB',
                    'MetricName': 'RequestCount',
                    'Dimensions': [{
                        'Name': 'LoadBalancer',
                        'Value': 'app/my-alb/1234567890abcdef'
                    }]
                },
                'Period': 300,
                'Stat': 'Sum'
            }
        },
        {
            'Id': 'ad1',
            'Expression': 'ANOMALY_DETECTION_BAND(m1, 2)',
            'Label': 'RequestCount (Expected)'
        }
    ],
    ThresholdMetricId='ad1',
    AlarmActions=['arn:aws:sns:us-east-1:123456789012:AnomalyAlerts']
)
```

**Anomaly Detection Model**:
```
CloudWatch learns normal patterns:
- Hourly trends (9am spike, 2am low)
- Daily patterns (weekday vs weekend)
- Seasonal variations (holiday traffic)

Threshold = 2 standard deviations
- Higher = fewer false positives
- Lower = more sensitive
```

### Composite Alarms

**AND Logic**:
```python
cloudwatch.put_composite_alarm(
    AlarmName='CriticalSystemFailure',
    AlarmDescription='High errors AND high latency',
    ActionsEnabled=True,
    AlarmActions=['arn:aws:sns:us-east-1:123456789012:CriticalAlerts'],
    AlarmRule='ALARM(HighErrorRate) AND ALARM(HighLatency)'
)
```

**OR Logic**:
```python
cloudwatch.put_composite_alarm(
    AlarmName='ServiceDegraded',
    AlarmDescription='Any service having issues',
    AlarmRule='ALARM(APIErrors) OR ALARM(DatabaseErrors) OR ALARM(QueueBacklog)'
)
```

**Complex Logic**:
```python
cloudwatch.put_composite_alarm(
    AlarmName='ProductionAlert',
    AlarmRule='''
        (ALARM(HighCPU) AND ALARM(HighMemory))
        OR
        (ALARM(HighErrorRate) AND ALARM(LowSuccessRate))
    ''',
    AlarmActions=['arn:aws:sns:us-east-1:123456789012:PagerDuty']
)
```

**Benefits**:
```
✅ Reduce alert fatigue
   - 10 alarms → 1 composite
   
✅ Correlate issues
   - CPU + Memory = resource exhaustion
   
✅ Cost savings
   - Composite: $0.50/alarm
   - Individual SNS calls: $0.50 × 10 = $5
```

---

## EventBridge

### Event Patterns

**S3 Object Created**:
```json
{
  "source": ["aws.s3"],
  "detail-type": ["Object Created"],
  "detail": {
    "bucket": {
      "name": ["my-upload-bucket"]
    },
    "object": {
      "key": [{
        "prefix": "uploads/"
      }]
    }
  }
}
```

**EC2 State Change**:
```json
{
  "source": ["aws.ec2"],
  "detail-type": ["EC2 Instance State-change Notification"],
  "detail": {
    "state": ["terminated"]
  }
}
```

**Custom Application Events**:
```json
{
  "source": ["myapp.orders"],
  "detail-type": ["Order Placed"],
  "detail": {
    "amount": [{"numeric": [">", 1000]}],
    "tier": ["premium"]
  }
}
```

### Create Rule

```bash
# Create rule
aws events put-rule \
  --name ProcessUploads \
  --event-pattern file://s3-pattern.json

# Add target (Lambda)
aws events put-targets \
  --rule ProcessUploads \
  --targets \
    "Id"="1","Arn"="arn:aws:lambda:us-east-1:123456789012:function:ProcessUpload"

# Add Lambda permission
aws lambda add-permission \
  --function-name ProcessUpload \
  --statement-id EventBridgeInvoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:123456789012:rule/ProcessUploads
```

**Python**:
```python
events = boto3.client('events')

# Create rule
events.put_rule(
    Name='OrderProcessing',
    EventPattern=json.dumps({
        'source': ['myapp.orders'],
        'detail-type': ['Order Placed']
    }),
    State='ENABLED'
)

# Add target
events.put_targets(
    Rule='OrderProcessing',
    Targets=[{
        'Id': '1',
        'Arn': 'arn:aws:lambda:us-east-1:123456789012:function:ProcessOrder',
        'RetryPolicy': {
            'MaximumRetryAttempts': 2,
            'MaximumEventAge': 3600
        },
        'DeadLetterConfig': {
            'Arn': 'arn:aws:sqs:us-east-1:123456789012:dlq'
        }
    }]
)
```

### Publish Events

```python
def publish_event(detail_type, detail):
    events.put_events(
        Entries=[{
            'Source': 'myapp.orders',
            'DetailType': detail_type,
            'Detail': json.dumps(detail),
            'EventBusName': 'default'
        }]
    )

# Usage
publish_event('Order Placed', {
    'orderId': 'order-123',
    'userId': 'user-456',
    'amount': 1499.99,
    'tier': 'premium'
})
```

### Scheduled Rules (Cron)

```bash
# Every 5 minutes
aws events put-rule \
  --name Every5Minutes \
  --schedule-expression "rate(5 minutes)"

# Daily at 2 AM UTC
aws events put-rule \
  --name DailyReport \
  --schedule-expression "cron(0 2 * * ? *)"

# Business hours (Mon-Fri 9am-5pm)
aws events put-rule \
  --name BusinessHours \
  --schedule-expression "cron(0 9-17 ? * MON-FRI *)"
```

**Cron Format**:
```
cron(Minutes Hours Day Month DayOfWeek Year)

Examples:
cron(0 10 * * ? *)       # 10 AM daily
cron(15 12 * * ? *)      # 12:15 PM daily
cron(0 18 ? * MON-FRI *) # 6 PM weekdays
cron(0 0 1 * ? *)        # First of month midnight
```

### Event Bus

**Custom Event Bus**:
```bash
# Create custom bus
aws events create-event-bus \
  --name orders-bus

# Create rule on custom bus
aws events put-rule \
  --name HighValueOrders \
  --event-bus-name orders-bus \
  --event-pattern '{
    "source": ["myapp.orders"],
    "detail": {
      "amount": [{"numeric": [">", 1000]}]
    }
  }'
```

**Cross-Account Events**:
```bash
# Account A: Allow Account B to publish
aws events put-permission \
  --action events:PutEvents \
  --principal 999999999999 \
  --statement-id AllowAccountB

# Account B: Publish to Account A
aws events put-events \
  --entries \
    Source=myapp,DetailType=Event,Detail='{}',EventBusName=arn:aws:events:us-east-1:111111111111:event-bus/default
```

---

## X-Ray Distributed Tracing

### Enable X-Ray

**Lambda**:
```bash
aws lambda update-function-configuration \
  --function-name myfunction \
  --tracing-config Mode=Active
```

**Python Lambda with X-Ray**:
```python
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK and HTTP libraries
patch_all()

def lambda_handler(event, context):
    # Automatic tracing of AWS SDK calls
    
    # Custom subsegment
    with xray_recorder.capture('process_order'):
        order_id = event['orderId']
        
        # Add metadata
        xray_recorder.put_metadata('orderId', order_id)
        xray_recorder.put_annotation('tier', event.get('tier', 'standard'))
        
        # Call external API (automatically traced)
        response = requests.get(f'https://api.example.com/orders/{order_id}')
        
        # DynamoDB call (automatically traced)
        table.get_item(Key={'orderId': order_id})
        
        return {'status': 'success'}
```

**Go with X-Ray**:
```go
package main

import (
    "context"
    "github.com/aws/aws-lambda-go/lambda"
    "github.com/aws/aws-xray-sdk-go/xray"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/dynamodb"
)

func handler(ctx context.Context, event map[string]interface{}) error {
    // Create instrumented HTTP client
    client := xray.Client(nil)
    
    // Instrumented AWS SDK
    sess := session.Must(session.NewSession())
    ddb := dynamodb.New(sess)
    xray.AWS(ddb.Client)
    
    // Custom subsegment
    err := xray.Capture(ctx, "ProcessOrder", func(ctx1 context.Context) error {
        orderId := event["orderId"].(string)
        
        // Add annotations (indexed)
        xray.AddAnnotation(ctx1, "tier", "premium")
        
        // Add metadata (not indexed)
        xray.AddMetadata(ctx1, "orderId", orderId)
        
        // External HTTP call (traced)
        resp, err := client.Get("https://api.example.com/orders/" + orderId)
        if err != nil {
            return err
        }
        defer resp.Body.Close()
        
        // DynamoDB call (traced)
        _, err = ddb.GetItemWithContext(ctx1, &dynamodb.GetItemInput{
            TableName: aws.String("Orders"),
            Key: map[string]*dynamodb.AttributeValue{
                "orderId": {S: aws.String(orderId)},
            },
        })
        
        return err
    })
    
    return err
}

func main() {
    lambda.Start(handler)
}
```

### Service Map

**Automatic Service Discovery**:
```
API Gateway → Lambda → DynamoDB
           ↓
         SQS → Lambda → S3
```

**View**:
```bash
aws xray get-service-graph \
  --start-time 2026-01-31T00:00:00Z \
  --end-time 2026-01-31T23:59:59Z
```

### Traces & Segments

**Trace** = Single request flow

**Segment** = Single service

**Subsegment** = Operation within service

```
Trace (100ms total):
├─ API Gateway Segment (5ms)
├─ Lambda Segment (90ms)
│  ├─ Initialization Subsegment (10ms)
│  ├─ DynamoDB GetItem Subsegment (20ms)
│  ├─ HTTP Call Subsegment (50ms)
│  └─ S3 PutObject Subsegment (10ms)
└─ Lambda Response (5ms)
```

### Sampling

**Default Sampling** (cost optimization):
```json
{
  "version": 2,
  "rules": [
    {
      "description": "Default",
      "host": "*",
      "http_method": "*",
      "url_path": "*",
      "fixed_target": 1,
      "rate": 0.05
    }
  ],
  "default": {
    "fixed_target": 1,
    "rate": 0.05
  }
}
```

**Explanation**:
```
fixed_target: 1 request/second always sampled
rate: 0.05 = 5% of remaining requests

Example (100 requests/second):
- First 1/sec: Always traced (1 trace)
- Remaining 99/sec: 5% traced (4.95 traces)
- Total: ~6 traces/sec (6% sampling)

Cost: 6 traces/sec × 86,400 sec/day / 1M × $5 = $0.0026/day
vs 100% sampling: $0.0432/day (16× more)
```

**Custom Sampling**:
```json
{
  "rules": [
    {
      "description": "Trace all errors",
      "service_name": "*",
      "http_method": "*",
      "url_path": "*",
      "fixed_target": 0,
      "rate": 1.0,
      "attributes": {
        "http.status_code": "5*"
      }
    },
    {
      "description": "High-value orders",
      "service_name": "order-service",
      "http_method": "POST",
      "url_path": "/orders",
      "fixed_target": 1,
      "rate": 1.0,
      "attributes": {
        "amount": ">1000"
      }
    },
    {
      "description": "Default",
      "service_name": "*",
      "http_method": "*",
      "url_path": "*",
      "fixed_target": 1,
      "rate": 0.05
    }
  ]
}
```

### Query Traces

```python
xray = boto3.client('xray')

def find_slow_requests(min_duration_ms=1000):
    # Query traces
    response = xray.get_trace_summaries(
        StartTime=datetime.utcnow() - timedelta(hours=1),
        EndTime=datetime.utcnow(),
        FilterExpression=f'duration >= {min_duration_ms / 1000}',
        Sampling=False
    )
    
    trace_ids = [trace['Id'] for trace in response['TraceSummaries']]
    
    # Get full traces
    traces = xray.batch_get_traces(TraceIds=trace_ids)
    
    for trace in traces['Traces']:
        print(f"Trace ID: {trace['Id']}")
        print(f"Duration: {trace['Duration']}s")
        
        for segment in trace['Segments']:
            document = json.loads(segment['Document'])
            print(f"  Service: {document['name']}")
            print(f"  Duration: {document.get('end_time', 0) - document.get('start_time', 0)}s")
```

---

## Container & Application Insights

### Container Insights (ECS/EKS)

**Enable for ECS**:
```bash
# Cluster level
aws ecs put-account-setting \
  --name containerInsights \
  --value enabled

# Create cluster with insights
aws ecs create-cluster \
  --cluster-name my-cluster \
  --settings name=containerInsights,value=enabled
```

**Task Definition** (add CloudWatch agent):
```json
{
  "containerDefinitions": [
    {
      "name": "app",
      "image": "myapp:latest",
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/myapp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Metrics Available**:
```
Per Task:
- CpuUtilized
- MemoryUtilized
- NetworkRxBytes
- NetworkTxBytes
- StorageReadBytes
- StorageWriteBytes

Per Service:
- RunningTaskCount
- PendingTaskCount
- DesiredTaskCount
- DeploymentCount

Per Cluster:
- CPUReservation
- MemoryReservation
- TaskCount
- ServiceCount
```

**Query Logs**:
```sql
-- Find tasks using > 80% memory
fields @timestamp, TaskId, MemoryUtilized, MemoryReserved
| filter MemoryUtilized / MemoryReserved > 0.8
| sort @timestamp desc

-- Container restart events
fields @timestamp, @message
| filter @message like /stopped/
| stats count() by bin(5m)
```

### Lambda Insights

**Enable**:
```bash
aws lambda update-function-configuration \
  --function-name myfunction \
  --layers arn:aws:lambda:us-east-1:580247275435:layer:LambdaInsightsExtension:14
```

**Metrics**:
```
cpu_total_time - CPU usage
memory_utilization - Memory %
init_duration - Cold start
duration - Execution time
rx_bytes - Network received
tx_bytes - Network transmitted
```

**Python with Lambda Insights**:
```python
# Automatically instrumented via layer

def lambda_handler(event, context):
    # Lambda Insights tracks:
    # - Function duration
    # - Memory usage
    # - CPU time
    # - Network I/O
    # - Cold starts
    
    result = process_data(event)
    return result
```

**Custom Metrics with EMF**:
```python
import json

def lambda_handler(event, context):
    # Process
    result = process_order(event)
    
    # EMF metric
    print(json.dumps({
        '_aws': {
            'Timestamp': int(time.time() * 1000),
            'CloudWatchMetrics': [{
                'Namespace': 'MyApp/Orders',
                'Dimensions': [['OrderType']],
                'Metrics': [{'Name': 'ProcessingTime', 'Unit': 'Milliseconds'}]
            }]
        },
        'ProcessingTime': result['duration'],
        'OrderType': event['type']
    }))
    
    return result
```

### Application Insights

**Enable for App**:
```bash
aws applicationinsights create-application \
  --resource-group-name my-app-group

aws applicationinsights update-application \
  --resource-group-name my-app-group \
  --ops-center-enabled
```

**Auto-Discovery**:
```
Detects:
- EC2 instances
- Auto Scaling groups
- Load balancers
- RDS databases
- Lambda functions
- ECS services

Creates:
- CloudWatch alarms
- Log patterns
- Anomaly detection
- Problem correlation
```

---

## LocalStack Examples

### Docker Compose Setup

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=logs,cloudwatch,events,lambda,sns,xray,dynamodb,s3
      - DEBUG=1
      - LAMBDA_EXECUTOR=docker-reuse
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "./localstack:/etc/localstack/init/ready.d"
```

### Complete Observability Stack

**setup.sh**:
```bash
#!/bin/bash

export AWS_ENDPOINT=http://localhost:4566
export AWS_REGION=us-east-1

# Create SNS topic for alarms
TOPIC_ARN=$(awslocal sns create-topic --name alarm-notifications \
  --query 'TopicArn' --output text)

echo "Topic ARN: $TOPIC_ARN"

# Subscribe email
awslocal sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol email \
  --notification-endpoint alerts@example.com

# Create DynamoDB table for app
awslocal dynamodb create-table \
  --table-name Orders \
  --attribute-definitions AttributeName=orderId,AttributeType=S \
  --key-schema AttributeName=orderId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Create S3 bucket
awslocal s3 mb s3://app-data

echo "✅ Infrastructure created"
```

**Lambda Function with Observability** (`process_order.py`):
```python
import json
import time
import random
import os
import boto3
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK for X-Ray tracing
patch_all()

# CloudWatch Logs client
logs = boto3.client('logs', endpoint_url=os.getenv('AWS_ENDPOINT'))
cloudwatch = boto3.client('cloudwatch', endpoint_url=os.getenv('AWS_ENDPOINT'))
dynamodb = boto3.resource('dynamodb', endpoint_url=os.getenv('AWS_ENDPOINT'))

def lambda_handler(event, context):
    """Process order with comprehensive logging, metrics, and tracing."""
    
    order_id = event.get('orderId', 'unknown')
    amount = event.get('amount', 0)
    
    # Structured logging
    log_entry = {
        'timestamp': int(time.time() * 1000),
        'level': 'INFO',
        'orderId': order_id,
        'amount': amount,
        'message': 'Processing order'
    }
    print(json.dumps(log_entry))
    
    try:
        # Custom subsegment for validation
        with xray_recorder.capture('validate_order') as subsegment:
            subsegment.put_annotation('orderId', order_id)
            subsegment.put_metadata('orderDetails', event)
            
            if amount <= 0:
                raise ValueError("Invalid amount")
            
            time.sleep(0.05)  # Simulate validation
        
        # DynamoDB operation (auto-traced)
        with xray_recorder.capture('save_to_dynamodb') as subsegment:
            table = dynamodb.Table('Orders')
            table.put_item(
                Item={
                    'orderId': order_id,
                    'amount': amount,
                    'status': 'processing',
                    'timestamp': int(time.time())
                }
            )
        
        # Simulate processing
        processing_time = random.uniform(0.1, 0.5)
        time.sleep(processing_time)
        
        # Embedded Metric Format (EMF)
        # Creates both log entry AND CloudWatch metric
        emf_log = {
            '_aws': {
                'Timestamp': int(time.time() * 1000),
                'CloudWatchMetrics': [{
                    'Namespace': 'MyApp/Orders',
                    'Dimensions': [['OrderType']],
                    'Metrics': [
                        {'Name': 'ProcessingTime', 'Unit': 'Milliseconds'},
                        {'Name': 'OrderAmount', 'Unit': 'None'}
                    ]
                }]
            },
            'OrderType': 'standard' if amount < 100 else 'premium',
            'ProcessingTime': processing_time * 1000,
            'OrderAmount': amount,
            'orderId': order_id
        }
        print(json.dumps(emf_log))
        
        # Success log
        success_log = {
            'timestamp': int(time.time() * 1000),
            'level': 'INFO',
            'orderId': order_id,
            'processingTime': processing_time * 1000,
            'message': 'Order processed successfully'
        }
        print(json.dumps(success_log))
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'orderId': order_id,
                'status': 'success'
            })
        }
        
    except Exception as e:
        # Error logging with EMF
        error_log = {
            '_aws': {
                'Timestamp': int(time.time() * 1000),
                'CloudWatchMetrics': [{
                    'Namespace': 'MyApp/Orders',
                    'Dimensions': [['ErrorType']],
                    'Metrics': [{'Name': 'Errors', 'Unit': 'Count'}]
                }]
            },
            'ErrorType': type(e).__name__,
            'Errors': 1,
            'timestamp': int(time.time() * 1000),
            'level': 'ERROR',
            'orderId': order_id,
            'error': str(e),
            'message': f'Failed to process order: {str(e)}'
        }
        print(json.dumps(error_log))
        
        # Record exception in X-Ray
        xray_recorder.current_subsegment().add_exception(e)
        
        raise

# Package: zip -r function.zip process_order.py
```

**requirements.txt**:
```
boto3
aws-xray-sdk
```

**Deploy Script** (`deploy.sh`):
```bash
#!/bin/bash

# Package Lambda
pip install -r requirements.txt -t .
zip -r function.zip process_order.py aws_xray_sdk boto3

# Create Lambda function with X-Ray tracing
awslocal lambda create-function \
  --function-name process-order \
  --runtime python3.11 \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --handler process_order.lambda_handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --tracing-config Mode=Active \
  --environment Variables="{AWS_ENDPOINT=http://localstack:4566}"

# Create log group
awslocal logs create-log-group \
  --log-group-name /aws/lambda/process-order

# Create metric filter (count errors)
awslocal logs put-metric-filter \
  --log-group-name /aws/lambda/process-order \
  --filter-name ErrorCount \
  --filter-pattern '{ $.level = "ERROR" }' \
  --metric-transformations \
    metricName=ErrorCount,metricNamespace=MyApp/Orders,metricValue=1,defaultValue=0

# Create metric filter (extract latency)
awslocal logs put-metric-filter \
  --log-group-name /aws/lambda/process-order \
  --filter-name ProcessingLatency \
  --filter-pattern '{ $.processingTime = * }' \
  --metric-transformations \
    metricName=ProcessingLatency,metricNamespace=MyApp/Orders,metricValue=$.processingTime,unit=Milliseconds

# Create alarm (high error rate)
awslocal cloudwatch put-metric-alarm \
  --alarm-name HighErrorRate \
  --alarm-description "Alert on high error rate" \
  --metric-name ErrorCount \
  --namespace MyApp/Orders \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --alarm-actions $TOPIC_ARN

# Create alarm (high latency)
awslocal cloudwatch put-metric-alarm \
  --alarm-name HighLatency \
  --alarm-description "Alert on high processing time" \
  --metric-name ProcessingLatency \
  --namespace MyApp/Orders \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 400 \
  --comparison-operator GreaterThanThreshold \
  --treat-missing-data notBreaching \
  --alarm-actions $TOPIC_ARN

# Composite alarm (critical system failure)
awslocal cloudwatch put-composite-alarm \
  --alarm-name CriticalSystemFailure \
  --alarm-rule "ALARM(HighErrorRate) AND ALARM(HighLatency)" \
  --actions-enabled \
  --alarm-actions $TOPIC_ARN

# EventBridge rule (trigger on S3 upload)
awslocal events put-rule \
  --name ProcessS3Uploads \
  --event-pattern '{
    "source": ["aws.s3"],
    "detail-type": ["Object Created"],
    "detail": {
      "bucket": {"name": ["app-data"]}
    }
  }'

awslocal events put-targets \
  --rule ProcessS3Uploads \
  --targets Id=1,Arn=arn:aws:lambda:us-east-1:000000000000:function:process-order

echo "✅ Observability stack deployed"
```

**Test Script** (`test.sh`):
```bash
#!/bin/bash

echo "Testing observability stack..."

# Invoke Lambda with successful order
awslocal lambda invoke \
  --function-name process-order \
  --payload '{"orderId": "order-001", "amount": 99.99}' \
  response.json

echo "Response: $(cat response.json)"

# Invoke with error (invalid amount)
awslocal lambda invoke \
  --function-name process-order \
  --payload '{"orderId": "order-002", "amount": 0}' \
  error_response.json || true

# Query logs with Logs Insights
awslocal logs start-query \
  --log-group-name /aws/lambda/process-order \
  --start-time $(date -d '5 minutes ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, orderId, processingTime, level
    | filter level = "INFO"
    | sort @timestamp desc
    | limit 10'

# Get metrics
awslocal cloudwatch get-metric-statistics \
  --namespace MyApp/Orders \
  --metric-name ProcessingLatency \
  --start-time $(date -d '10 minutes ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 300 \
  --statistics Average,Maximum

# Check alarm state
awslocal cloudwatch describe-alarms \
  --alarm-names HighErrorRate HighLatency CriticalSystemFailure

# Get X-Ray traces
awslocal xray get-trace-summaries \
  --start-time $(date -d '10 minutes ago' +%s) \
  --end-time $(date +%s)

echo "✅ Tests complete"
```

---

## Production Patterns

### Centralized Logging (Multi-Account)

**Architecture**:
```
Account A (Dev)      Account B (Staging)    Account C (Prod)
     |                      |                     |
     ├── CloudWatch Logs    ├── CloudWatch Logs   ├── CloudWatch Logs
     |   (7-day retention)  |   (7-day retention) |   (30-day retention)
     |                      |                     |
     └──────────────────────┴─────────────────────┘
                            |
                   Subscription Filters
                            |
                      Kinesis Stream
                      (Hub Account)
                            |
                   Kinesis Data Firehose
                            |
                  ┌─────────┴─────────┐
                  |                   |
                S3 Bucket         OpenSearch
          (long-term archive)   (search/analytics)
                  |
             Athena Queries
         (SQL on archived logs)
```

**Setup Subscription Filter** (spoke account):
```bash
# Create destination in hub account
aws logs put-destination \
  --destination-name CentralizedLogs \
  --target-arn arn:aws:kinesis:us-east-1:HUB-ACCOUNT:stream/log-aggregation \
  --role-arn arn:aws:iam::HUB-ACCOUNT:role/CWLtoKinesisRole \
  --region us-east-1

# Grant permission to spoke accounts
aws logs put-destination-policy \
  --destination-name CentralizedLogs \
  --access-policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"AWS": ["SPOKE-ACCOUNT-A", "SPOKE-ACCOUNT-B"]},
      "Action": "logs:PutSubscriptionFilter",
      "Resource": "arn:aws:logs:us-east-1:HUB-ACCOUNT:destination:CentralizedLogs"
    }]
  }'

# In spoke account, create subscription filter
aws logs put-subscription-filter \
  --log-group-name /aws/lambda/myfunction \
  --filter-name SendToHub \
  --filter-pattern "" \
  --destination-arn arn:aws:logs:us-east-1:HUB-ACCOUNT:destination:CentralizedLogs
```

**Benefits**:
```
✅ Single pane of glass (all logs in one place)
✅ Long-term retention (S3 cheaper than CloudWatch Logs)
✅ Cross-account querying
✅ Compliance (centralized audit trail)

Cost Comparison (100GB/day):
- CloudWatch Logs (30-day): $90/month
- S3 (unlimited): $2.30/month (96% cheaper)
```

### Correlation IDs (Distributed Tracing)

**API Gateway → Lambda → DynamoDB → SQS**:

**API Gateway** (inject correlation ID):
```python
import uuid

def lambda_handler(event, context):
    # Generate correlation ID
    correlation_id = str(uuid.uuid4())
    
    # Add to X-Ray
    xray_recorder.put_annotation('correlationId', correlation_id)
    
    # Pass to downstream services
    invoke_next_service({
        'data': event['body'],
        'correlationId': correlation_id
    })
```

**Lambda Function** (propagate correlation ID):
```python
import logging
import json

# Structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    correlation_id = event.get('correlationId', 'unknown')
    
    # Include in all logs
    logger.info(json.dumps({
        'correlationId': correlation_id,
        'message': 'Processing request',
        'userId': event.get('userId')
    }))
    
    # DynamoDB operation
    try:
        table.put_item(Item={'id': '123', 'data': 'test'})
        
        logger.info(json.dumps({
            'correlationId': correlation_id,
            'message': 'Data saved to DynamoDB'
        }))
    except Exception as e:
        logger.error(json.dumps({
            'correlationId': correlation_id,
            'error': str(e),
            'message': 'Failed to save data'
        }))
        raise
    
    # Send to SQS
    sqs.send_message(
        QueueUrl='queue-url',
        MessageBody=json.dumps({
            'correlationId': correlation_id,
            'data': 'processed'
        })
    )
    
    return {'statusCode': 200}
```

**Query Logs** (trace entire request flow):
```
fields @timestamp, correlationId, message, userId
| filter correlationId = "abc-123-def"
| sort @timestamp asc
```

### Composite Alarms (Reduce Alert Fatigue)

**Problem**: 10 separate alarms → 10 separate SNS notifications

**Solution**: 1 composite alarm

```bash
# Individual alarms
aws cloudwatch put-metric-alarm --alarm-name HighCPU ...
aws cloudwatch put-metric-alarm --alarm-name HighMemory ...

# Composite alarm (AND logic)
aws cloudwatch put-composite-alarm \
  --alarm-name CriticalSystemFailure \
  --alarm-rule "ALARM(HighCPU) AND ALARM(HighMemory)" \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:critical-alerts
```

**Cost Savings**: 67% cheaper with composite alarms

---

## Interview Questions

### Q1: How would you design centralized logging for 100+ microservices across multiple AWS accounts?

**Answer**: Use CloudWatch Logs → Subscription Filters → Kinesis → Firehose → S3 + Athena for cost-effective long-term retention ($2.30/month vs $90 CloudWatch).

### Q2: CloudWatch Logs Insights vs Athena - when to use each?

**Answer**: Logs Insights for real-time debugging (recent logs, seconds latency). Athena for historical analysis (months/years, complex SQL, $5/TB).

### Q3: How do you implement correlation IDs for distributed tracing?

**Answer**: Generate UUID at API Gateway, inject into X-Ray trace and headers, propagate through all services, include in all logs, query by correlationId to trace entire request flow.

### Q4: How would you design composite alarms to reduce alert fatigue?

**Answer**: Combine related alarms with AND/OR logic. Example: `ALARM(HighCPU) AND ALARM(HighMemory)` for true resource exhaustion vs individual false positives. 67% cost savings.

### Q5: Compare EventBridge vs SNS for event-driven architecture.

**Answer**: EventBridge for complex routing (content-based filtering, 300+ AWS sources, schema registry). SNS for simple pub-sub fanout (email/SMS/Lambda). Use together: EventBridge (route) → SNS (fanout).

---

This completes the CloudWatch & Observability comprehensive guide with production-ready examples, LocalStack/Docker setups, and detailed interview questions!