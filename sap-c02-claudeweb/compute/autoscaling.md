# AWS Auto Scaling

## What is Auto Scaling?

AWS Auto Scaling monitors applications and automatically adjusts capacity to maintain steady, predictable performance at the lowest possible cost. It provides a unified scaling experience across multiple AWS services.

## Why Use Auto Scaling?

### Key Benefits
- **Availability**: Ensures sufficient capacity
- **Cost Optimization**: Scales down when not needed
- **Performance**: Maintains desired performance levels
- **Fault Tolerance**: Replaces unhealthy instances
- **Predictive Scaling**: ML-based capacity planning
- **Multiple Services**: EC2, ECS, DynamoDB, Aurora, etc.

### Use Cases
- Web applications with variable traffic
- Batch processing with scheduled workloads
- Gaming servers with daily/weekly patterns
- E-commerce sites (Black Friday, Cyber Monday)
- IoT data processing
- Development/test environments (work hours only)

## EC2 Auto Scaling

### Auto Scaling Groups (ASG)

**Core Components**:
- **Launch Template/Configuration**: Instance specification
- **Minimum Size**: Always maintain this many instances
- **Maximum Size**: Never exceed this many instances
- **Desired Capacity**: Target number of instances
- **Scaling Policies**: When and how to scale

### Creating Launch Template

```python
import boto3

ec2 = boto3.client('ec2')

response = ec2.create_launch_template(
    LaunchTemplateName='MyTemplate',
    VersionDescription='v1',
    LaunchTemplateData={
        'ImageId': 'ami-0abcdef1234567890',
        'InstanceType': 't3.micro',
        'KeyName': 'my-key-pair',
        'SecurityGroupIds': ['sg-12345'],
        'IamInstanceProfile': {
            'Arn': 'arn:aws:iam::123456789012:instance-profile/MyRole'
        },
        'UserData': base64.b64encode('''#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "Hello from $(hostname -f)" > /var/www/html/index.html
'''.encode()).decode(),
        'TagSpecifications': [
            {
                'ResourceType': 'instance',
                'Tags': [
                    {'Key': 'Name', 'Value': 'ASG-Instance'},
                    {'Key': 'Environment', 'Value': 'Production'}
                ]
            }
        ],
        'Monitoring': {
            'Enabled': True  # Detailed monitoring
        }
    }
)

template_id = response['LaunchTemplate']['LaunchTemplateId']
```

### Creating Auto Scaling Group

```python
autoscaling = boto3.client('autoscaling')

response = autoscaling.create_auto_scaling_group(
    AutoScalingGroupName='MyASG',
    LaunchTemplate={
        'LaunchTemplateId': template_id,
        'Version': '$Latest'
    },
    MinSize=2,
    MaxSize=10,
    DesiredCapacity=3,
    DefaultCooldown=300,  # Seconds between scaling activities
    HealthCheckType='ELB',  # or 'EC2'
    HealthCheckGracePeriod=300,  # Seconds before checking health
    VPCZoneIdentifier='subnet-12345,subnet-67890',  # Multiple AZs
    TargetGroupARNs=[
        'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/my-targets/1234567890abcdef'
    ],
    Tags=[
        {
            'Key': 'Name',
            'Value': 'ASG-Instance',
            'PropagateAtLaunch': True
        }
    ]
)
```

### Launch Template vs Launch Configuration

**Launch Template** (recommended):
- Multiple versions
- Mix instance types (Spot + On-Demand)
- T3 unlimited mode
- Dedicated Hosts
- Placement groups
- Network interfaces

**Launch Configuration** (legacy):
- Single version (immutable)
- One instance type only
- Limited features

## Scaling Policies

### Target Tracking Scaling

**Concept**: Maintain a target metric value (like temperature control)

**CPU Utilization**:
```python
autoscaling.put_scaling_policy(
    AutoScalingGroupName='MyASG',
    PolicyName='TargetCPU',
    PolicyType='TargetTrackingScaling',
    TargetTrackingConfiguration={
        'PredefinedMetricSpecification': {
            'PredefinedMetricType': 'ASGAverageCPUUtilization'
        },
        'TargetValue': 70.0,  # Target 70% CPU
        'ScaleInCooldown': 300,
        'ScaleOutCooldown': 60
    }
)
```

**Request Count per Target** (ALB):
```python
autoscaling.put_scaling_policy(
    AutoScalingGroupName='MyASG',
    PolicyName='TargetRequestCount',
    PolicyType='TargetTrackingScaling',
    TargetTrackingConfiguration={
        'PredefinedMetricSpecification': {
            'PredefinedMetricType': 'ALBRequestCountPerTarget',
            'ResourceLabel': 'app/my-alb/1234567890abcdef/targetgroup/my-targets/1234567890abcdef'
        },
        'TargetValue': 1000.0,  # 1000 requests per instance
        'ScaleInCooldown': 300,
        'ScaleOutCooldown': 60
    }
)
```

**Network In/Out**:
```python
autoscaling.put_scaling_policy(
    AutoScalingGroupName='MyASG',
    PolicyName='TargetNetwork',
    PolicyType='TargetTrackingScaling',
    TargetTrackingConfiguration={
        'PredefinedMetricSpecification': {
            'PredefinedMetricType': 'ASGAverageNetworkIn'  # or ASGAverageNetworkOut
        },
        'TargetValue': 10000000.0,  # 10 MB/s
        'ScaleInCooldown': 300,
        'ScaleOutCooldown': 60
    }
)
```

**Custom Metric**:
```python
autoscaling.put_scaling_policy(
    AutoScalingGroupName='MyASG',
    PolicyName='TargetCustom',
    PolicyType='TargetTrackingScaling',
    TargetTrackingConfiguration={
        'CustomizedMetricSpecification': {
            'MetricName': 'QueueLength',
            'Namespace': 'MyApp',
            'Statistic': 'Average',
            'Dimensions': [
                {'Name': 'QueueName', 'Value': 'my-queue'}
            ]
        },
        'TargetValue': 100.0  # 100 messages in queue
    }
)
```

**Best For**:
- Maintaining specific metric value
- Simple configuration
- Most common use case

### Step Scaling

**Concept**: Scale by different amounts based on alarm breach size

**Create CloudWatch Alarm**:
```python
cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_alarm(
    AlarmName='HighCPU',
    MetricName='CPUUtilization',
    Namespace='AWS/EC2',
    Statistic='Average',
    Period=60,
    EvaluationPeriods=2,
    Threshold=70,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'AutoScalingGroupName', 'Value': 'MyASG'}
    ],
    AlarmActions=[
        'arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:...'
    ]
)
```

**Scaling Policy**:
```python
response = autoscaling.put_scaling_policy(
    AutoScalingGroupName='MyASG',
    PolicyName='StepScaleOut',
    PolicyType='StepScaling',
    AdjustmentType='PercentChangeInCapacity',  # or ChangeInCapacity, ExactCapacity
    MetricAggregationType='Average',
    EstimatedInstanceWarmup=300,
    StepAdjustments=[
        {
            'MetricIntervalLowerBound': 0,
            'MetricIntervalUpperBound': 10,
            'ScalingAdjustment': 10  # Add 10% if 70-80%
        },
        {
            'MetricIntervalLowerBound': 10,
            'MetricIntervalUpperBound': 20,
            'ScalingAdjustment': 20  # Add 20% if 80-90%
        },
        {
            'MetricIntervalLowerBound': 20,
            'ScalingAdjustment': 30  # Add 30% if >90%
        }
    ]
)

policy_arn = response['PolicyARN']
```

**Update Alarm**:
```python
cloudwatch.put_metric_alarm(
    AlarmName='HighCPU',
    MetricName='CPUUtilization',
    Namespace='AWS/EC2',
    Statistic='Average',
    Period=60,
    EvaluationPeriods=2,
    Threshold=70,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'AutoScalingGroupName', 'Value': 'MyASG'}
    ],
    AlarmActions=[policy_arn]
)
```

**Adjustment Types**:
- `ChangeInCapacity`: Add/remove specific number (e.g., +2, -1)
- `PercentChangeInCapacity`: Add/remove percentage (e.g., +25%)
- `ExactCapacity`: Set to specific number (e.g., 10 instances)

**Best For**:
- Fine-grained control
- Different responses to different breach sizes
- Complex scaling requirements

### Simple Scaling (Legacy)

**Concept**: Scale by fixed amount when alarm triggered

```python
autoscaling.put_scaling_policy(
    AutoScalingGroupName='MyASG',
    PolicyName='SimpleScaleOut',
    AdjustmentType='ChangeInCapacity',
    ScalingAdjustment=2,  # Add 2 instances
    Cooldown=300
)
```

**Limitation**: Waits for cooldown even if more scaling needed

**Best For**: Legacy applications (use Step or Target Tracking instead)

### Scheduled Scaling

**Concept**: Scale at specific times

**One-Time Schedule**:
```python
autoscaling.put_scheduled_update_group_action(
    AutoScalingGroupName='MyASG',
    ScheduledActionName='ScaleUpForEvent',
    StartTime=datetime.datetime(2026, 2, 14, 8, 0, 0),  # Feb 14, 8 AM
    MinSize=10,
    MaxSize=20,
    DesiredCapacity=15
)
```

**Recurring Schedule** (cron):
```python
# Weekdays 9 AM: Scale up
autoscaling.put_scheduled_update_group_action(
    AutoScalingGroupName='MyASG',
    ScheduledActionName='ScaleUpMorning',
    Recurrence='0 9 * * MON-FRI',
    MinSize=5,
    MaxSize=20,
    DesiredCapacity=10
)

# Weekdays 6 PM: Scale down
autoscaling.put_scheduled_update_group_action(
    AutoScalingGroupName='MyASG',
    ScheduledActionName='ScaleDownEvening',
    Recurrence='0 18 * * MON-FRI',
    MinSize=2,
    MaxSize=5,
    DesiredCapacity=2
)

# Weekends: Minimal capacity
autoscaling.put_scheduled_update_group_action(
    AutoScalingGroupName='MyASG',
    ScheduledActionName='WeekendMinimum',
    Recurrence='0 0 * * SAT',
    MinSize=1,
    MaxSize=2,
    DesiredCapacity=1
)
```

**Best For**:
- Predictable traffic patterns
- Business hours vs off-hours
- Development/test environments
- Known events

### Predictive Scaling

**Concept**: ML predicts future traffic and pre-scales

**Enable**:
```python
autoscaling.put_scaling_policy(
    AutoScalingGroupName='MyASG',
    PolicyName='PredictiveScaling',
    PolicyType='PredictiveScaling',
    PredictiveScalingConfiguration={
        'MetricSpecifications': [
            {
                'TargetValue': 70.0,
                'PredefinedMetricPairSpecification': {
                    'PredefinedMetricType': 'ASGCPUUtilization'
                }
            }
        ],
        'Mode': 'ForecastAndScale',  # or 'ForecastOnly'
        'SchedulingBufferTime': 600,  # Pre-scale 10 minutes early
        'MaxCapacityBreachBehavior': 'IncreaseMaxCapacity',  # or 'HonorMaxCapacity'
        'MaxCapacityBuffer': 10  # Can exceed max by 10%
    }
)
```

**Requirements**:
- 14 days of historical data
- Metrics every 1 minute

**Best For**:
- Recurring patterns (daily, weekly)
- Proactive scaling
- Avoiding performance degradation

## Instance Refresh

**Concept**: Gradually replace instances (rolling update)

**Start Refresh**:
```python
autoscaling.start_instance_refresh(
    AutoScalingGroupName='MyASG',
    Strategy='Rolling',
    Preferences={
        'MinHealthyPercentage': 90,  # Keep 90% healthy
        'InstanceWarmup': 300,  # Wait 5 min before moving to next
        'CheckpointPercentages': [50],  # Pause at 50% for approval
        'CheckpointDelay': 3600  # Wait 1 hour at checkpoint
    }
)
```

**Use Cases**:
- Update AMI
- Change instance type
- Update user data
- Deploy new application version

## Lifecycle Hooks

**Concept**: Perform actions during instance launch/terminate

**Create Hook**:
```python
autoscaling.put_lifecycle_hook(
    LifecycleHookName='LaunchHook',
    AutoScalingGroupName='MyASG',
    LifecycleTransition='autoscaling:EC2_INSTANCE_LAUNCHING',
    NotificationTargetARN='arn:aws:sns:us-east-1:123456789012:asg-notifications',
    RoleARN='arn:aws:iam::123456789012:role/ASGNotificationRole',
    HeartbeatTimeout=3600,  # 1 hour
    DefaultResult='ABANDON'  # or 'CONTINUE'
)
```

**Transitions**:
- `autoscaling:EC2_INSTANCE_LAUNCHING`: Before instance in service
- `autoscaling:EC2_INSTANCE_TERMINATING`: Before instance terminated

**Lambda Handler** (process hook):
```python
def lambda_handler(event, context):
    message = json.loads(event['Records'][0]['Sns']['Message'])
    
    instance_id = message['EC2InstanceId']
    lifecycle_hook = message['LifecycleHookName']
    asg_name = message['AutoScalingGroupName']
    lifecycle_action_token = message['LifecycleActionToken']
    
    # Perform actions (install software, backup data, etc.)
    if message['LifecycleTransition'] == 'autoscaling:EC2_INSTANCE_LAUNCHING':
        # Configure instance
        configure_instance(instance_id)
    else:
        # Clean up before termination
        cleanup_instance(instance_id)
    
    # Complete lifecycle action
    autoscaling.complete_lifecycle_action(
        LifecycleHookName=lifecycle_hook,
        AutoScalingGroupName=asg_name,
        LifecycleActionToken=lifecycle_action_token,
        LifecycleActionResult='CONTINUE'  # or 'ABANDON'
    )
```

**Use Cases**:
- Software installation
- Log backup before termination
- Deregister from service discovery
- Custom health checks

## Warm Pools

**Concept**: Pre-initialized instances ready to serve traffic

**Create**:
```python
autoscaling.put_warm_pool(
    AutoScalingGroupName='MyASG',
    MaxGroupPreparedCapacity=10,
    MinSize=5,
    PoolState='Stopped',  # or 'Running', 'Hibernated'
    InstanceReusePolicy={
        'ReuseOnScaleIn': True
    }
)
```

**States**:
- **Stopped**: No charges except EBS
- **Running**: Full charges, fastest to activate
- **Hibernated**: RAM saved to EBS, faster boot

**Cost Savings**:
```
Without Warm Pool:
  Instance boot time: 5 minutes
  Cost: Pay for instances in ASG only

With Warm Pool (Stopped):
  Instance boot time: 30 seconds
  Cost: Pay for instances + EBS storage
  
Example (10 instances, 100 GB EBS each):
  Warm pool: 10 × 100 GB × $0.10/GB/month = $100/month
  Trade: Faster scaling for $100/month
```

**Best For**:
- Long boot times
- Complex initialization
- Unpredictable traffic spikes

## Health Checks

### EC2 Health Check

**Based on EC2 status checks**:
- Instance status (hardware, networking)
- System status (AWS infrastructure)

**Limitations**: Doesn't check application health

### ELB Health Check

**Based on load balancer health checks**:
- HTTP/HTTPS response codes
- Response content
- Application availability

**Enable**:
```python
autoscaling.update_auto_scaling_group(
    AutoScalingGroupName='MyASG',
    HealthCheckType='ELB',
    HealthCheckGracePeriod=300
)
```

**Recommendation**: Use ELB for application-aware health checks

## Termination Policies

**Default Order**:
1. Instances in AZ with most instances (balance AZs)
2. Oldest launch template/configuration
3. Instances closest to next billing hour

**Custom Policies**:
```python
autoscaling.update_auto_scaling_group(
    AutoScalingGroupName='MyASG',
    TerminationPolicies=[
        'OldestInstance',  # Terminate oldest first
        'NewestInstance',  # Terminate newest first
        'OldestLaunchConfiguration',
        'ClosestToNextInstanceHour',
        'Default',
        'AllocationStrategy'  # For mixed instances
    ]
)
```

## Monitoring and Notifications

### CloudWatch Metrics

**Metrics**:
- `GroupMinSize`, `GroupMaxSize`, `GroupDesiredCapacity`
- `GroupInServiceInstances`: Healthy instances
- `GroupPendingInstances`: Launching
- `GroupTerminatingInstances`: Terminating
- `GroupTotalInstances`: All instances

**Alarms**:
```python
cloudwatch.put_metric_alarm(
    AlarmName='ASG-Low-Capacity',
    MetricName='GroupInServiceInstances',
    Namespace='AWS/AutoScaling',
    Statistic='Average',
    Period=60,
    EvaluationPeriods=2,
    Threshold=2,
    ComparisonOperator='LessThanThreshold',
    Dimensions=[
        {'Name': 'AutoScalingGroupName', 'Value': 'MyASG'}
    ],
    AlarmActions=['arn:aws:sns:us-east-1:123456789012:asg-alerts']
)
```

### SNS Notifications

**Configure**:
```python
autoscaling.put_notification_configuration(
    AutoScalingGroupName='MyASG',
    TopicARN='arn:aws:sns:us-east-1:123456789012:asg-notifications',
    NotificationTypes=[
        'autoscaling:EC2_INSTANCE_LAUNCH',
        'autoscaling:EC2_INSTANCE_LAUNCH_ERROR',
        'autoscaling:EC2_INSTANCE_TERMINATE',
        'autoscaling:EC2_INSTANCE_TERMINATE_ERROR'
    ]
)
```

## Cost Optimization

### Instance Types

**Use T3/T4g** (burstable) for variable workloads:
```
t3.micro: $0.0104/hour
t3.small: $0.0208/hour
t3.medium: $0.0416/hour
```

**Use C5/C6g** (compute-optimized) for consistent high CPU:
```
c5.large: $0.085/hour
c5.xlarge: $0.17/hour
```

### Mixed Instance Types

**Diversify**:
```python
ec2.create_launch_template(
    LaunchTemplateName='MixedTemplate',
    LaunchTemplateData={
        'InstanceType': 't3.medium',  # Base
        # ... other config
    }
)

autoscaling.create_auto_scaling_group(
    AutoScalingGroupName='MixedASG',
    MixedInstancesPolicy={
        'LaunchTemplate': {
            'LaunchTemplateSpecification': {
                'LaunchTemplateId': template_id,
                'Version': '$Latest'
            },
            'Overrides': [
                {'InstanceType': 't3.medium'},
                {'InstanceType': 't3.large'},
                {'InstanceType': 't3a.medium'},  # AMD, cheaper
                {'InstanceType': 't3a.large'}
            ]
        },
        'InstancesDistribution': {
            'OnDemandBaseCapacity': 2,  # Always 2 On-Demand
            'OnDemandPercentageAboveBaseCapacity': 30,  # 30% On-Demand
            'SpotAllocationStrategy': 'lowest-price',  # or 'capacity-optimized'
            'SpotInstancePools': 4
        }
    },
    MinSize=5,
    MaxSize=20
)
```

**Cost Example** (10 instances):
```
On-Demand only:
  10 × t3.medium × $0.0416/hour × 730 hours = $303.68/month

Mixed (2 On-Demand + 8 Spot):
  2 × t3.medium × $0.0416 × 730 = $60.74
  8 × t3.medium × $0.0125 (70% discount) × 730 = $73.00
  Total: $133.74/month (56% savings)
```

### Scheduled Scaling

**Dev/Test** (work hours only):
```python
# 9 AM - 6 PM weekdays
Work hours: 9 hours × 5 days = 45 hours/week
Off hours: 123 hours/week

Without scheduling:
  5 × t3.medium × 168 hours/week = 840 instance-hours
  Cost: 840 × $0.0416 = $34.94/week

With scheduling:
  5 × t3.medium × 45 hours/week = 225 instance-hours
  1 × t3.medium × 123 hours/week = 123 instance-hours
  Total: 348 instance-hours
  Cost: 348 × $0.0416 = $14.48/week

Savings: $20.46/week = $81.84/month (59% savings)
```

## Real-World Scenarios

### Scenario 1: Web Application with Daily Pattern

**Traffic**: 100 users (night) → 1,000 users (day)

**Configuration**:
```python
# Base capacity
MinSize=2, MaxSize=20, DesiredCapacity=2

# Target tracking
TargetValue=70% CPU

# Predictive scaling
Mode='ForecastAndScale'

# Scheduled (safety net)
Weekdays 8 AM: MinSize=5, DesiredCapacity=10
Weekdays 8 PM: MinSize=2, DesiredCapacity=2
```

**Cost** (t3.medium):
```
Night (12 hours): 2 instances × 12 × $0.0416 = $0.998
Day (12 hours avg 10): 10 × 12 × $0.0416 = $4.992
Total/day: $5.99
Monthly: $5.99 × 30 = $179.70/month
```

### Scenario 2: Batch Processing with Queue

**SQS queue** drives scaling:

**Custom Metric**:
```python
# Lambda publishes metric
cloudwatch.put_metric_data(
    Namespace='BatchProcessing',
    MetricData=[
        {
            'MetricName': 'BacklogPerInstance',
            'Value': queue_length / instance_count,
            'Unit': 'Count'
        }
    ]
)

# Target tracking policy
TargetValue=100  # 100 messages per instance
```

**Cost** (c5.large, 1M messages/month):
```
Processing rate: 10 messages/sec per instance
Duration: 1M / (10 × 3600) = 27.8 hours
Instances: Varies 1-10 based on queue
Average: 5 instances for 28 hours = 140 instance-hours
Cost: 140 × $0.085 = $11.90/month
```

### Scenario 3: Gaming Server (Weekend Spikes)

**Pattern**: Low weekdays, high weekends

**Configuration**:
```python
# Base
MinSize=5, MaxSize=50

# Target tracking
TargetValue=1000 requests/target (ALB)

# Scheduled
Friday 6 PM: MinSize=20, DesiredCapacity=30
Sunday 11 PM: MinSize=5, DesiredCapacity=5
```

**Cost** (c5.xlarge):
```
Weekday (5 days × 24 hrs): 5 × 120 = 600 hours
Weekend (2 days × 24 hrs avg 30): 30 × 48 = 1,440 hours
Total: 2,040 instance-hours/month
Cost: 2,040 × $0.17 = $346.80/month
```

## Exam Tips (SAP-C02)

### Key Decision Points

**Scaling Policy Type**:
```
Simple metric target → Target Tracking
Multiple thresholds → Step Scaling
Predictable pattern → Scheduled Scaling
Recurring patterns → Predictive Scaling
```

**Health Check**:
```
Basic availability → EC2
Application health → ELB
Custom logic → Lifecycle Hook + Lambda
```

**Instance Mix**:
```
Cost-sensitive → Spot instances
Variable workload → Mixed instances
Stable workload → On-Demand/Reserved
```

### Common Scenarios

**"High availability web app"**:
- Multi-AZ ASG
- ELB health checks
- Target tracking (CPU or ALB requests)
- Grace period for startup

**"Cost optimization"**:
- Scheduled scaling (work hours)
- Mixed instances (Spot + On-Demand)
- Rightsizing instance types
- Warm pools (stopped state)

**"Predictable daily pattern"**:
- Predictive scaling
- Scheduled scaling as backup
- Target tracking for unexpected spikes

**"Queue-based processing"**:
- Target tracking on custom metric
- Backlog per instance calculation
- Lifecycle hooks for graceful shutdown

**"Zero-downtime deployment"**:
- Instance refresh with checkpoints
- Blue/green with two ASGs
- Lifecycle hooks for verification

This comprehensive Auto Scaling guide covers policies, strategies, and cost optimization for SAP-C02 exam success.
