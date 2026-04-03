# Elastic Load Balancing (ELB)

## What is ELB?

Elastic Load Balancing automatically distributes incoming application traffic across multiple targets (EC2 instances, containers, IP addresses, Lambda functions) in one or more Availability Zones.

## Why Use ELB?

### Key Benefits
- **High Availability**: Distributes traffic across multiple AZs
- **Auto Scaling Integration**: Works with Auto Scaling groups
- **Health Checks**: Routes traffic only to healthy targets
- **Security**: SSL/TLS termination, WAF integration
- **Managed Service**: AWS handles scaling, patching
- **Monitoring**: CloudWatch metrics and access logs

### Use Cases
- Web applications (HTTP/HTTPS traffic)
- Microservices architectures
- TCP/UDP applications
- SSL/TLS termination
- WebSocket applications
- Hybrid cloud architectures

## Load Balancer Types

### Application Load Balancer (ALB)

**Layer**: 7 (HTTP/HTTPS)

**Features**:
- Path-based routing (`/api`, `/images`)
- Host-based routing (`api.example.com`, `admin.example.com`)
- HTTP headers routing
- Query string routing
- WebSocket support
- HTTP/2 support
- Lambda targets
- Fixed response/redirect actions
- Authentication (Cognito, OIDC)

**Use When**:
- Modern HTTP/HTTPS applications
- Microservices
- Container-based applications
- Need advanced routing
- WebSocket or gRPC

**Pricing**: 
- $0.0225/hour
- $0.008 per LCU-hour (Load Balancer Capacity Unit)

### Network Load Balancer (NLB)

**Layer**: 4 (TCP/UDP/TLS)

**Features**:
- Ultra-high performance (millions of requests/sec)
- Ultra-low latency (<100 microseconds)
- Static IP addresses (Elastic IP)
- TLS termination
- Preserve source IP
- Long-lived TCP connections
- PrivateLink support

**Use When**:
- Extreme performance required
- TCP/UDP traffic
- Static IP needed
- Low latency critical
- Non-HTTP protocols

**Pricing**:
- $0.0225/hour
- $0.006 per NLCU-hour

### Gateway Load Balancer (GWLB)

**Layer**: 3 (IP packets)

**Features**:
- Deploy third-party virtual appliances
- GENEVE protocol (port 6081)
- Single entry/exit point
- Scale appliances automatically

**Use When**:
- Firewalls
- IDS/IPS systems
- Deep packet inspection
- Network monitoring

**Pricing**:
- $0.0125/hour
- $0.004 per GLCU-hour

### Classic Load Balancer (CLB)

**Legacy**: Use ALB or NLB instead

**Layer**: 4 and 7

**Limitations**: No advanced features, no Lambda targets

## Application Load Balancer (ALB)

### Creating ALB

```python
import boto3

elbv2 = boto3.client('elbv2')

# Create ALB
lb = elbv2.create_load_balancer(
    Name='my-alb',
    Subnets=[
        'subnet-12345',  # AZ 1
        'subnet-67890'   # AZ 2
    ],
    SecurityGroups=['sg-12345'],
    Scheme='internet-facing',  # or 'internal'
    Type='application',
    IpAddressType='ipv4',  # or 'dualstack' for IPv4+IPv6
    Tags=[
        {'Key': 'Environment', 'Value': 'Production'}
    ]
)

lb_arn = lb['LoadBalancers'][0]['LoadBalancerArn']
dns_name = lb['LoadBalancers'][0]['DNSName']
```

### Target Groups

**Create Target Group**:
```python
tg = elbv2.create_target_group(
    Name='my-targets',
    Protocol='HTTP',
    Port=80,
    VpcId='vpc-12345',
    TargetType='instance',  # or 'ip', 'lambda'
    HealthCheckEnabled=True,
    HealthCheckProtocol='HTTP',
    HealthCheckPath='/health',
    HealthCheckIntervalSeconds=30,
    HealthCheckTimeoutSeconds=5,
    HealthyThresholdCount=2,
    UnhealthyThresholdCount=3,
    Matcher={
        'HttpCode': '200,201'  # Success codes
    }
)

tg_arn = tg['TargetGroups'][0]['TargetGroupArn']
```

**Register Targets**:
```python
elbv2.register_targets(
    TargetGroupArn=tg_arn,
    Targets=[
        {'Id': 'i-1234567890abcdef0', 'Port': 80},
        {'Id': 'i-0987654321fedcba0', 'Port': 80}
    ]
)
```

**Lambda Target**:
```python
tg_lambda = elbv2.create_target_group(
    Name='lambda-targets',
    TargetType='lambda'
)

elbv2.register_targets(
    TargetGroupArn=tg_lambda_arn,
    Targets=[
        {'Id': 'arn:aws:lambda:us-east-1:123456789012:function:MyFunction'}
    ]
)

# Grant ALB permission to invoke Lambda
lambda_client.add_permission(
    FunctionName='MyFunction',
    StatementId='alb-invoke',
    Action='lambda:InvokeFunction',
    Principal='elasticloadbalancing.amazonaws.com',
    SourceArn=tg_lambda_arn
)
```

### Listeners and Rules

**Create Listener** (HTTP):
```python
listener = elbv2.create_listener(
    LoadBalancerArn=lb_arn,
    Protocol='HTTP',
    Port=80,
    DefaultActions=[
        {
            'Type': 'forward',
            'TargetGroupArn': tg_arn
        }
    ]
)

listener_arn = listener['Listeners'][0]['ListenerArn']
```

**HTTPS Listener** (SSL/TLS):
```python
listener_https = elbv2.create_listener(
    LoadBalancerArn=lb_arn,
    Protocol='HTTPS',
    Port=443,
    Certificates=[
        {'CertificateArn': 'arn:aws:acm:us-east-1:123456789012:certificate/...'}
    ],
    SslPolicy='ELBSecurityPolicy-TLS-1-2-2017-01',
    DefaultActions=[
        {
            'Type': 'forward',
            'TargetGroupArn': tg_arn
        }
    ]
)
```

**Path-Based Routing**:
```python
elbv2.create_rule(
    ListenerArn=listener_arn,
    Priority=1,
    Conditions=[
        {
            'Field': 'path-pattern',
            'Values': ['/api/*']
        }
    ],
    Actions=[
        {
            'Type': 'forward',
            'TargetGroupArn': api_tg_arn
        }
    ]
)

elbv2.create_rule(
    ListenerArn=listener_arn,
    Priority=2,
    Conditions=[
        {
            'Field': 'path-pattern',
            'Values': ['/images/*']
        }
    ],
    Actions=[
        {
            'Type': 'forward',
            'TargetGroupArn': images_tg_arn
        }
    ]
)
```

**Host-Based Routing**:
```python
elbv2.create_rule(
    ListenerArn=listener_arn,
    Priority=3,
    Conditions=[
        {
            'Field': 'host-header',
            'Values': ['api.example.com']
        }
    ],
    Actions=[
        {
            'Type': 'forward',
            'TargetGroupArn': api_tg_arn
        }
    ]
)
```

**Query String Routing**:
```python
elbv2.create_rule(
    ListenerArn=listener_arn,
    Priority=4,
    Conditions=[
        {
            'Field': 'query-string',
            'QueryStringConfig': {
                'Values': [
                    {'Key': 'version', 'Value': 'v2'}
                ]
            }
        }
    ],
    Actions=[
        {
            'Type': 'forward',
            'TargetGroupArn': v2_tg_arn
        }
    ]
)
```

**HTTP Header Routing**:
```python
elbv2.create_rule(
    ListenerArn=listener_arn,
    Priority=5,
    Conditions=[
        {
            'Field': 'http-header',
            'HttpHeaderConfig': {
                'HttpHeaderName': 'User-Agent',
                'Values': ['*Mobile*']
            }
        }
    ],
    Actions=[
        {
            'Type': 'forward',
            'TargetGroupArn': mobile_tg_arn
        }
    ]
)
```

**Fixed Response**:
```python
elbv2.create_rule(
    ListenerArn=listener_arn,
    Priority=10,
    Conditions=[
        {
            'Field': 'path-pattern',
            'Values': ['/maintenance']
        }
    ],
    Actions=[
        {
            'Type': 'fixed-response',
            'FixedResponseConfig': {
                'StatusCode': '503',
                'ContentType': 'text/html',
                'MessageBody': '<h1>Under Maintenance</h1>'
            }
        }
    ]
)
```

**Redirect**:
```python
# HTTP to HTTPS redirect
elbv2.create_rule(
    ListenerArn=listener_arn,
    Priority=1,
    Conditions=[
        {
            'Field': 'path-pattern',
            'Values': ['/*']
        }
    ],
    Actions=[
        {
            'Type': 'redirect',
            'RedirectConfig': {
                'Protocol': 'HTTPS',
                'Port': '443',
                'StatusCode': 'HTTP_301'
            }
        }
    ]
)
```

**Weighted Target Groups** (Blue/Green):
```python
elbv2.create_rule(
    ListenerArn=listener_arn,
    Priority=1,
    Conditions=[
        {
            'Field': 'path-pattern',
            'Values': ['/*']
        }
    ],
    Actions=[
        {
            'Type': 'forward',
            'ForwardConfig': {
                'TargetGroups': [
                    {'TargetGroupArn': blue_tg_arn, 'Weight': 90},
                    {'TargetGroupArn': green_tg_arn, 'Weight': 10}
                ],
                'TargetGroupStickinessConfig': {
                    'Enabled': True,
                    'DurationSeconds': 3600
                }
            }
        }
    ]
)
```

### Stickiness

**Session Stickiness** (cookies):
```python
elbv2.modify_target_group_attributes(
    TargetGroupArn=tg_arn,
    Attributes=[
        {
            'Key': 'stickiness.enabled',
            'Value': 'true'
        },
        {
            'Key': 'stickiness.type',
            'Value': 'lb_cookie'  # or 'app_cookie'
        },
        {
            'Key': 'stickiness.lb_cookie.duration_seconds',
            'Value': '86400'  # 1 day
        }
    ]
)
```

**Application Cookie**:
```python
elbv2.modify_target_group_attributes(
    TargetGroupArn=tg_arn,
    Attributes=[
        {
            'Key': 'stickiness.enabled',
            'Value': 'true'
        },
        {
            'Key': 'stickiness.type',
            'Value': 'app_cookie'
        },
        {
            'Key': 'stickiness.app_cookie.cookie_name',
            'Value': 'JSESSIONID'
        },
        {
            'Key': 'stickiness.app_cookie.duration_seconds',
            'Value': '86400'
        }
    ]
)
```

### Connection Draining

**Deregistration Delay**:
```python
elbv2.modify_target_group_attributes(
    TargetGroupArn=tg_arn,
    Attributes=[
        {
            'Key': 'deregistration_delay.timeout_seconds',
            'Value': '30'  # Default 300, range 0-3600
        }
    ]
)
```

### Authentication

**Cognito User Pools**:
```python
elbv2.create_rule(
    ListenerArn=listener_arn,
    Priority=1,
    Conditions=[
        {
            'Field': 'path-pattern',
            'Values': ['/protected/*']
        }
    ],
    Actions=[
        {
            'Type': 'authenticate-cognito',
            'AuthenticateCognitoConfig': {
                'UserPoolArn': 'arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_ABC123',
                'UserPoolClientId': 'abc123xyz',
                'UserPoolDomain': 'my-app',
                'SessionTimeout': 3600,
                'OnUnauthenticatedRequest': 'authenticate'  # or 'deny', 'allow'
            },
            'Order': 1
        },
        {
            'Type': 'forward',
            'TargetGroupArn': tg_arn,
            'Order': 2
        }
    ]
)
```

**OIDC (Okta, Auth0, etc.)**:
```python
elbv2.create_rule(
    ListenerArn=listener_arn,
    Priority=1,
    Conditions=[
        {
            'Field': 'path-pattern',
            'Values': ['/protected/*']
        }
    ],
    Actions=[
        {
            'Type': 'authenticate-oidc',
            'AuthenticateOidcConfig': {
                'Issuer': 'https://example.okta.com',
                'AuthorizationEndpoint': 'https://example.okta.com/oauth2/v1/authorize',
                'TokenEndpoint': 'https://example.okta.com/oauth2/v1/token',
                'UserInfoEndpoint': 'https://example.okta.com/oauth2/v1/userinfo',
                'ClientId': 'client-id',
                'ClientSecret': 'client-secret',
                'SessionTimeout': 3600,
                'OnUnauthenticatedRequest': 'authenticate'
            },
            'Order': 1
        },
        {
            'Type': 'forward',
            'TargetGroupArn': tg_arn,
            'Order': 2
        }
    ]
)
```

## Network Load Balancer (NLB)

### Creating NLB

```python
lb_nlb = elbv2.create_load_balancer(
    Name='my-nlb',
    Subnets=[
        'subnet-12345',
        'subnet-67890'
    ],
    Scheme='internet-facing',
    Type='network',
    IpAddressType='ipv4'
)

nlb_arn = lb_nlb['LoadBalancers'][0]['LoadBalancerArn']
```

**Static IP** (Elastic IP):
```python
# Allocate EIPs
ec2 = boto3.client('ec2')
eip1 = ec2.allocate_address(Domain='vpc')
eip2 = ec2.allocate_address(Domain='vpc')

# Create NLB with EIPs
lb_nlb = elbv2.create_load_balancer(
    Name='my-nlb',
    SubnetMappings=[
        {'SubnetId': 'subnet-12345', 'AllocationId': eip1['AllocationId']},
        {'SubnetId': 'subnet-67890', 'AllocationId': eip2['AllocationId']}
    ],
    Type='network'
)
```

### Target Group (NLB)

```python
tg_nlb = elbv2.create_target_group(
    Name='nlb-targets',
    Protocol='TCP',  # or 'UDP', 'TCP_UDP', 'TLS'
    Port=80,
    VpcId='vpc-12345',
    TargetType='instance',  # or 'ip', 'alb'
    HealthCheckEnabled=True,
    HealthCheckProtocol='TCP',  # or 'HTTP', 'HTTPS'
    HealthCheckIntervalSeconds=30,
    HealthyThresholdCount=3,
    UnhealthyThresholdCount=3
)
```

**Preserve Source IP**:
```python
elbv2.modify_target_group_attributes(
    TargetGroupArn=tg_nlb_arn,
    Attributes=[
        {
            'Key': 'preserve_client_ip.enabled',
            'Value': 'true'  # Default for instance targets
        },
        {
            'Key': 'proxy_protocol_v2.enabled',
            'Value': 'false'  # Enable for ECS/containers
        }
    ]
)
```

### TLS Termination (NLB)

```python
listener_tls = elbv2.create_listener(
    LoadBalancerArn=nlb_arn,
    Protocol='TLS',
    Port=443,
    Certificates=[
        {'CertificateArn': 'arn:aws:acm:us-east-1:123456789012:certificate/...'}
    ],
    SslPolicy='ELBSecurityPolicy-TLS-1-2-2017-01',
    DefaultActions=[
        {
            'Type': 'forward',
            'TargetGroupArn': tg_nlb_arn
        }
    ]
)
```

## Cross-Zone Load Balancing

**ALB**: Enabled by default, no charge

**NLB**: Disabled by default, $0.01/GB for cross-AZ traffic

**Enable**:
```python
elbv2.modify_load_balancer_attributes(
    LoadBalancerArn=nlb_arn,
    Attributes=[
        {
            'Key': 'load_balancing.cross_zone.enabled',
            'Value': 'true'
        }
    ]
)
```

**When to Enable**:
- Uneven target distribution across AZs
- Need perfect load distribution
- Worth the cross-AZ data transfer cost

## Access Logs

**Enable**:
```python
elbv2.modify_load_balancer_attributes(
    LoadBalancerArn=lb_arn,
    Attributes=[
        {
            'Key': 'access_logs.s3.enabled',
            'Value': 'true'
        },
        {
            'Key': 'access_logs.s3.bucket',
            'Value': 'my-alb-logs'
        },
        {
            'Key': 'access_logs.s3.prefix',
            'Value': 'production'
        }
    ]
)
```

**S3 Bucket Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::127311923021:root"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::my-alb-logs/production/AWSLogs/123456789012/*"
    }
  ]
}
```

**Log Format** (ALB):
```
type timestamp elb client:port target:port request_processing_time target_processing_time response_processing_time elb_status_code target_status_code received_bytes sent_bytes "request" "user_agent" ssl_cipher ssl_protocol target_group_arn "trace_id" "domain_name" "chosen_cert_arn" matched_rule_priority request_creation_time "actions_executed" "redirect_url" "error_reason" "target:port_list" "target_status_code_list"
```

## Monitoring

### CloudWatch Metrics

**ALB Metrics**:
- `ActiveConnectionCount`: Active connections
- `TargetResponseTime`: Response time from targets
- `RequestCount`: Number of requests
- `TargetConnectionErrorCount`: Connection errors
- `HTTPCode_Target_2XX_Count`: Successful responses
- `HTTPCode_Target_4XX_Count`: Client errors
- `HTTPCode_Target_5XX_Count`: Server errors
- `HTTPCode_ELB_5XX_Count`: Load balancer errors
- `HealthyHostCount`: Healthy targets
- `UnHealthyHostCount`: Unhealthy targets

**NLB Metrics**:
- `ActiveFlowCount`: Active flows
- `NewFlowCount`: New flows
- `ProcessedBytes`: Processed bytes
- `TCP_Client_Reset_Count`: Client resets
- `TCP_Target_Reset_Count`: Target resets

**Alarms**:
```python
cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_alarm(
    AlarmName='ALB-High-Latency',
    MetricName='TargetResponseTime',
    Namespace='AWS/ApplicationELB',
    Statistic='Average',
    Period=60,
    EvaluationPeriods=2,
    Threshold=1.0,  # 1 second
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'LoadBalancer', 'Value': 'app/my-alb/1234567890abcdef'}
    ]
)

cloudwatch.put_metric_alarm(
    AlarmName='ALB-High-5XX',
    MetricName='HTTPCode_Target_5XX_Count',
    Namespace='AWS/ApplicationELB',
    Statistic='Sum',
    Period=300,
    EvaluationPeriods=1,
    Threshold=10,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'LoadBalancer', 'Value': 'app/my-alb/1234567890abcdef'}
    ]
)
```

## SSL/TLS Best Practices

### Security Policies

**Recommended**:
- `ELBSecurityPolicy-TLS-1-2-2017-01`: TLS 1.2 only
- `ELBSecurityPolicy-TLS-1-2-Ext-2018-06`: TLS 1.2 with more ciphers
- `ELBSecurityPolicy-FS-1-2-2019-08`: Forward secrecy

**Legacy** (avoid):
- `ELBSecurityPolicy-2016-08`: Supports TLS 1.0

### SNI (Server Name Indication)

**Multiple Certificates**:
```python
elbv2.add_listener_certificates(
    ListenerArn=listener_arn,
    Certificates=[
        {'CertificateArn': 'arn:aws:acm:...:certificate/cert1'},
        {'CertificateArn': 'arn:aws:acm:...:certificate/cert2'}
    ]
)
```

ALB automatically selects certificate based on hostname.

## Cost Optimization

### ALB LCU (Load Balancer Capacity Unit)

**1 LCU** =
- 25 new connections/sec
- 3,000 active connections/min
- 1 GB/hour for EC2/IP targets
- 0.4 GB/hour for Lambda targets
- 1,000 rule evaluations/sec

**Calculate LCUs**:
```python
new_connections_lcu = new_connections_per_sec / 25
active_connections_lcu = active_connections_per_min / 3000
bandwidth_lcu = bandwidth_gb_per_hour / 1
rule_evaluations_lcu = rule_evaluations_per_sec / 1000

total_lcu = max(new_connections_lcu, active_connections_lcu, bandwidth_lcu, rule_evaluations_lcu)
```

**Example** (100 new conn/sec, 10K active, 2 GB/hr):
```
LCU = max(100/25, 10000/3000, 2/1, 1000/1000)
    = max(4, 3.33, 2, 1)
    = 4 LCUs

Cost per hour:
  Fixed: $0.0225
  LCU: 4 × $0.008 = $0.032
  Total: $0.0545/hour = $39.79/month
```

### NLB NLCU

**1 NLCU** =
- 800 new flows/sec (TCP/TLS)
- 400 new flows/sec (UDP)
- 100,000 active flows/min
- 1 GB/hour

**Example** (1K new TCP flows/sec, 500K active, 5 GB/hr):
```
NLCU = max(1000/800, 500000/100000, 5/1)
     = max(1.25, 5, 5)
     = 5 NLCUs

Cost per hour:
  Fixed: $0.0225
  NLCU: 5 × $0.006 = $0.030
  Total: $0.0525/hour = $38.33/month
```

### Optimization Tips

1. **Minimize Cross-Zone Traffic** (NLB):
   - Disable if targets evenly distributed
   - Save $0.01/GB

2. **Efficient Health Checks**:
   - Longer intervals (30s vs 5s)
   - Simple health check paths

3. **Connection Pooling**:
   - Reuse connections
   - Reduce new connection LCUs

4. **Right-Size**:
   - Use NLB for pure Layer 4 (cheaper per NLCU)
   - Use ALB only when Layer 7 features needed

## Real-World Scenarios

### Scenario 1: Microservices Architecture

**Architecture**: ALB → [Auth, API, Web] Target Groups

**Path Routing**:
```
/auth/* → Auth service (port 8080)
/api/*  → API service (port 8081)
/*      → Web service (port 80)
```

**Cost** (1M requests/month, 10 GB/hour):
```
New connections: 10/sec → 0.4 LCU
Bandwidth: 10 GB/hr → 10 LCU
Total: 10 LCUs

Monthly:
  Fixed: $0.0225 × 730 = $16.43
  LCU: 10 × $0.008 × 730 = $58.40
  Total: $74.83/month
```

### Scenario 2: Blue/Green Deployment

**Strategy**: Weighted target groups

**Phase 1** (Testing):
```
Blue: 90%
Green: 10%
```

**Phase 2** (Gradual):
```
Blue: 50%
Green: 50%
```

**Phase 3** (Complete):
```
Blue: 0%
Green: 100%
```

**Cost**: Same as single target group (no extra charge)

### Scenario 3: High-Performance TCP Application

**Use**: NLB for database proxy

**Static IP**: Required by external firewall whitelist

**Cost** (10K new flows/sec, 1M active, 20 GB/hr):
```
New flows: 10000/800 = 12.5 NLCU
Active flows: 1000000/100000 = 10 NLCU
Bandwidth: 20/1 = 20 NLCU
Total: 20 NLCUs

Monthly:
  Fixed: $0.0225 × 730 = $16.43
  NLCU: 20 × $0.006 × 730 = $87.60
  Total: $104.03/month
```

## Exam Tips (SAP-C02)

### Key Decision Points

**ALB vs NLB**:
```
HTTP/HTTPS → ALB
Path/host routing → ALB
WebSocket → ALB
Authentication → ALB

TCP/UDP → NLB
Extreme performance → NLB
Static IP → NLB
PrivateLink → NLB
```

**Health Check Type**:
```
Web apps → HTTP/HTTPS
TCP apps → TCP
Custom logic → Use Lambda target
```

**Cross-Zone**:
```
ALB: Always enabled (free)
NLB: Enable if uneven distribution (costs $0.01/GB)
```

### Common Scenarios

**"High availability web app"**:
- ALB in multiple AZs
- Target Auto Scaling group
- ELB health checks
- Deregistration delay

**"Microservices"**:
- ALB with path-based routing
- Separate target groups
- Host-based for multi-domain

**"Static IP requirement"**:
- NLB with Elastic IPs
- Or NLB + Global Accelerator

**"SSL/TLS termination"**:
- ALB/NLB with ACM certificate
- SNI for multiple domains
- TLS 1.2 security policy

**"Authentication"**:
- ALB with Cognito User Pools
- Or ALB with OIDC
- Before forwarding to targets

This comprehensive ELB guide covers ALB, NLB, and GWLB for SAP-C02 exam mastery.
