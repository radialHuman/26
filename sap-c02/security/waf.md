# AWS WAF (Web Application Firewall)

## What is AWS WAF?

AWS WAF is a web application firewall that helps protect your web applications or APIs against common web exploits and bots. It gives you control over how traffic reaches your applications by enabling you to create security rules that control bot traffic and block common attack patterns such as SQL injection or cross-site scripting (XSS).

## Why Use AWS WAF?

### Key Benefits
- **Protection**: Block SQL injection, XSS, DDoS attacks
- **Flexible Rules**: IP sets, regex patterns, geo-matching, rate limiting
- **Real-Time Metrics**: CloudWatch integration
- **Managed Rules**: AWS and marketplace rule groups
- **Cost-Effective**: Pay only for what you use
- **Bot Control**: Detect and block bot traffic

### Use Cases
- Block malicious traffic to web applications
- Prevent SQL injection and XSS attacks
- Rate limiting to prevent scraping/DDoS
- Geo-blocking (country restrictions)
- Block known bad IPs (threat intelligence)
- Protect APIs (API Gateway, AppSync)

## WAF Components

### Web ACL (Access Control List)

**Concept**: Container for rules that inspect web requests

**Actions**:
- **Allow**: Allow the request
- **Block**: Block the request (403 Forbidden)
- **Count**: Count matching requests (monitoring)
- **CAPTCHA**: Present CAPTCHA challenge
- **Challenge**: Silent JavaScript challenge

### Rules

**Rule Types**:
- **Regular Rules**: Match conditions (IP, headers, body, etc.)
- **Rate-Based Rules**: Limit requests per IP (5-minute window)
- **Managed Rule Groups**: Pre-configured by AWS or partners

### Rule Groups

**Concept**: Collection of rules managed together

**Types**:
- **AWS Managed**: Maintained by AWS
- **AWS Marketplace**: Third-party rules (F5, Fortinet, etc.)
- **Custom**: Your own rules

## Creating Web ACL

```python
import boto3

wafv2 = boto3.client('wafv2')

# Create Web ACL
web_acl = wafv2.create_web_acl(
    Scope='REGIONAL',  # or 'CLOUDFRONT' for global
    Name='my-web-acl',
    DefaultAction={'Allow': {}},  # Default action
    Description='Web ACL for my application',
    Rules=[
        {
            'Name': 'BlockBadIPs',
            'Priority': 1,
            'Statement': {
                'IPSetReferenceStatement': {
                    'Arn': 'arn:aws:wafv2:us-east-1:123456789012:regional/ipset/bad-ips/xxxxx'
                }
            },
            'Action': {'Block': {}},
            'VisibilityConfig': {
                'SampledRequestsEnabled': True,
                'CloudWatchMetricsEnabled': True,
                'MetricName': 'BlockBadIPsRule'
            }
        },
        {
            'Name': 'RateLimitRule',
            'Priority': 2,
            'Statement': {
                'RateBasedStatement': {
                    'Limit': 2000,  # Max requests per 5 minutes per IP
                    'AggregateKeyType': 'IP'
                }
            },
            'Action': {'Block': {}},
            'VisibilityConfig': {
                'SampledRequestsEnabled': True,
                'CloudWatchMetricsEnabled': True,
                'MetricName': 'RateLimitRule'
            }
        }
    ],
    VisibilityConfig={
        'SampledRequestsEnabled': True,
        'CloudWatchMetricsEnabled': True,
        'MetricName': 'MyWebACL'
    },
    Tags=[
        {'Key': 'Environment', 'Value': 'production'}
    ]
)

web_acl_arn = web_acl['Summary']['ARN']
```

## Associating Web ACL with Resources

### ALB (Application Load Balancer)

```python
wafv2.associate_web_acl(
    WebACLArn=web_acl_arn,
    ResourceArn='arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-alb/xxxxx'
)
```

### API Gateway

```python
# Associate with API Gateway REST API
wafv2.associate_web_acl(
    WebACLArn=web_acl_arn,
    ResourceArn='arn:aws:apigateway:us-east-1::/restapis/xxxxx/stages/prod'
)
```

### CloudFront Distribution

```python
# For CloudFront, use CLOUDFRONT scope
cloudfront_wafv2 = boto3.client('wafv2', region_name='us-east-1')  # Must be us-east-1

cloudfront_web_acl = cloudfront_wafv2.create_web_acl(
    Scope='CLOUDFRONT',
    Name='my-cloudfront-acl',
    # ... (same structure as regional)
)

# Associate with CloudFront
cloudfront = boto3.client('cloudfront')
cloudfront.update_distribution(
    Id='EDFDVBD6EXAMPLE',
    DistributionConfig={
        # ... existing config
        'WebACLId': cloudfront_web_acl['Summary']['ARN']
    }
)
```

### AppSync GraphQL API

```python
wafv2.associate_web_acl(
    WebACLArn=web_acl_arn,
    ResourceArn='arn:aws:appsync:us-east-1:123456789012:apis/xxxxx'
)
```

## IP Sets

### Creating IP Set

```python
# Create IP set for blocking
ip_set = wafv2.create_ip_set(
    Scope='REGIONAL',
    Name='bad-ips',
    Description='Known malicious IPs',
    IPAddressVersion='IPV4',
    Addresses=[
        '192.0.2.0/24',
        '198.51.100.0/24',
        '203.0.113.5/32'
    ],
    Tags=[
        {'Key': 'Type', 'Value': 'Blocklist'}
    ]
)

ip_set_arn = ip_set['Summary']['ARN']
```

### Update IP Set

```python
# Get current IP set
current_ip_set = wafv2.get_ip_set(
    Scope='REGIONAL',
    Id='xxxxx',
    Name='bad-ips'
)

# Update with new IPs
wafv2.update_ip_set(
    Scope='REGIONAL',
    Id='xxxxx',
    Name='bad-ips',
    Addresses=current_ip_set['IPSet']['Addresses'] + ['198.51.100.50/32'],
    LockToken=current_ip_set['LockToken']
)
```

### IPv6 IP Set

```python
ipv6_set = wafv2.create_ip_set(
    Scope='REGIONAL',
    Name='ipv6-blocklist',
    IPAddressVersion='IPV6',
    Addresses=[
        '2001:db8::/32',
        '2001:db8:1234::/48'
    ]
)
```

## Rule Statements

### Match Conditions

**IP Match**:
```python
{
    'Statement': {
        'IPSetReferenceStatement': {
            'Arn': ip_set_arn
        }
    },
    'Action': {'Block': {}}
}
```

**Geo Match** (Country blocking):
```python
{
    'Statement': {
        'GeoMatchStatement': {
            'CountryCodes': ['CN', 'RU', 'KP']  # Block China, Russia, North Korea
        }
    },
    'Action': {'Block': {}}
}
```

**Size Constraint** (Block large requests):
```python
{
    'Statement': {
        'SizeConstraintStatement': {
            'FieldToMatch': {'Body': {}},
            'ComparisonOperator': 'GT',  # Greater than
            'Size': 8192,  # 8 KB
            'TextTransformations': [
                {'Priority': 0, 'Type': 'NONE'}
            ]
        }
    },
    'Action': {'Block': {}}
}
```

**SQL Injection**:
```python
{
    'Statement': {
        'SqliMatchStatement': {
            'FieldToMatch': {'QueryString': {}},
            'TextTransformations': [
                {'Priority': 0, 'Type': 'URL_DECODE'},
                {'Priority': 1, 'Type': 'HTML_ENTITY_DECODE'}
            ]
        }
    },
    'Action': {'Block': {}}
}
```

**XSS (Cross-Site Scripting)**:
```python
{
    'Statement': {
        'XssMatchStatement': {
            'FieldToMatch': {'Body': {}},
            'TextTransformations': [
                {'Priority': 0, 'Type': 'URL_DECODE'},
                {'Priority': 1, 'Type': 'HTML_ENTITY_DECODE'}
            ]
        }
    },
    'Action': {'Block': {}}
}
```

**Regex Pattern**:
```python
# Create regex pattern set
pattern_set = wafv2.create_regex_pattern_set(
    Scope='REGIONAL',
    Name='admin-paths',
    Description='Admin URL patterns',
    RegularExpressionList=[
        {'RegexString': '^/admin'},
        {'RegexString': '^/wp-admin'},
        {'RegexString': '^/phpmyadmin'}
    ]
)

# Use in rule
{
    'Statement': {
        'RegexPatternSetReferenceStatement': {
            'Arn': pattern_set['Summary']['ARN'],
            'FieldToMatch': {'UriPath': {}},
            'TextTransformations': [
                {'Priority': 0, 'Type': 'LOWERCASE'}
            ]
        }
    },
    'Action': {'Block': {}}
}
```

**String Match**:
```python
{
    'Statement': {
        'ByteMatchStatement': {
            'SearchString': 'badstring',
            'FieldToMatch': {'UriPath': {}},
            'TextTransformations': [
                {'Priority': 0, 'Type': 'LOWERCASE'}
            ],
            'PositionalConstraint': 'CONTAINS'  # EXACTLY, STARTS_WITH, ENDS_WITH, CONTAINS
        }
    },
    'Action': {'Block': {}}
}
```

## Rate-Based Rules

### Basic Rate Limiting

```python
{
    'Name': 'RateLimit',
    'Priority': 1,
    'Statement': {
        'RateBasedStatement': {
            'Limit': 2000,  # Requests per 5 minutes
            'AggregateKeyType': 'IP'
        }
    },
    'Action': {'Block': {}},
    'VisibilityConfig': {
        'SampledRequestsEnabled': True,
        'CloudWatchMetricsEnabled': True,
        'MetricName': 'RateLimitRule'
    }
}
```

### Rate Limiting with Scope-Down

```python
# Rate limit only for specific path
{
    'Name': 'RateLimitLogin',
    'Priority': 1,
    'Statement': {
        'RateBasedStatement': {
            'Limit': 100,  # 100 requests per 5 minutes
            'AggregateKeyType': 'IP',
            'ScopeDownStatement': {
                'ByteMatchStatement': {
                    'SearchString': '/login',
                    'FieldToMatch': {'UriPath': {}},
                    'TextTransformations': [
                        {'Priority': 0, 'Type': 'NONE'}
                    ],
                    'PositionalConstraint': 'EXACTLY'
                }
            }
        }
    },
    'Action': {'Block': {}},
    'VisibilityConfig': {
        'SampledRequestsEnabled': True,
        'CloudWatchMetricsEnabled': True,
        'MetricName': 'RateLimitLoginRule'
    }
}
```

### Rate Limiting by Custom Key

```python
# Rate limit by custom header (e.g., API key)
{
    'Statement': {
        'RateBasedStatement': {
            'Limit': 1000,
            'AggregateKeyType': 'CUSTOM_KEYS',
            'CustomKeys': [
                {
                    'Header': {
                        'Name': 'x-api-key',
                        'TextTransformations': [
                            {'Priority': 0, 'Type': 'NONE'}
                        ]
                    }
                }
            ]
        }
    },
    'Action': {'Block': {}}
}
```

## Logical Rules (AND, OR, NOT)

### AND Rule

```python
# Block if matches both conditions
{
    'Statement': {
        'AndStatement': {
            'Statements': [
                {
                    'GeoMatchStatement': {
                        'CountryCodes': ['CN']
                    }
                },
                {
                    'ByteMatchStatement': {
                        'SearchString': '/api/',
                        'FieldToMatch': {'UriPath': {}},
                        'TextTransformations': [
                            {'Priority': 0, 'Type': 'NONE'}
                        ],
                        'PositionalConstraint': 'STARTS_WITH'
                    }
                }
            ]
        }
    },
    'Action': {'Block': {}}
}
```

### OR Rule

```python
# Block if matches any condition
{
    'Statement': {
        'OrStatement': {
            'Statements': [
                {
                    'IPSetReferenceStatement': {
                        'Arn': 'arn:aws:wafv2:...:ipset/bad-ips/xxxxx'
                    }
                },
                {
                    'GeoMatchStatement': {
                        'CountryCodes': ['KP', 'SY']
                    }
                }
            ]
        }
    },
    'Action': {'Block': {}}
}
```

### NOT Rule

```python
# Allow only from specific countries (block others)
{
    'Statement': {
        'NotStatement': {
            'Statement': {
                'GeoMatchStatement': {
                    'CountryCodes': ['US', 'CA', 'GB']
                }
            }
        }
    },
    'Action': {'Block': {}}
}
```

## AWS Managed Rule Groups

### Core Rule Set (CRS)

```python
{
    'Name': 'AWSManagedRulesCommonRuleSet',
    'Priority': 1,
    'Statement': {
        'ManagedRuleGroupStatement': {
            'VendorName': 'AWS',
            'Name': 'AWSManagedRulesCommonRuleSet',
            'ExcludedRules': []  # Optionally exclude specific rules
        }
    },
    'OverrideAction': {'None': {}},  # Use Count instead to test
    'VisibilityConfig': {
        'SampledRequestsEnabled': True,
        'CloudWatchMetricsEnabled': True,
        'MetricName': 'AWSManagedRulesCommonRuleSetMetric'
    }
}
```

**Common Managed Rule Groups**:

**AWSManagedRulesCommonRuleSet**:
```
Protection: OWASP Top 10, CVE vulnerabilities
Rules: ~50 rules
Use: General web protection
```

**AWSManagedRulesKnownBadInputsRuleSet**:
```
Protection: Known malicious inputs
Rules: ~5 rules
Use: Block common attack patterns
```

**AWSManagedRulesSQLiRuleSet**:
```
Protection: SQL injection
Rules: ~10 rules
Use: Database-backed applications
```

**AWSManagedRulesLinuxRuleSet**:
```
Protection: Linux-specific exploits
Rules: ~10 rules
Use: Linux web servers
```

**AWSManagedRulesWindowsRuleSet**:
```
Protection: Windows-specific exploits
Rules: ~15 rules
Use: Windows web servers
```

**AWSManagedRulesAmazonIpReputationList**:
```
Protection: Known bad IPs
Rules: 1 rule (IP list updated regularly)
Use: Block threat intelligence IPs
```

### Exclude Rules from Managed Group

```python
# Exclude specific rules causing false positives
{
    'Statement': {
        'ManagedRuleGroupStatement': {
            'VendorName': 'AWS',
            'Name': 'AWSManagedRulesCommonRuleSet',
            'ExcludedRules': [
                {'Name': 'SizeRestrictions_BODY'},
                {'Name': 'GenericRFI_BODY'}
            ]
        }
    },
    'OverrideAction': {'None': {}},
    'VisibilityConfig': {
        'SampledRequestsEnabled': True,
        'CloudWatchMetricsEnabled': True,
        'MetricName': 'CommonRuleSet'
    }
}
```

### Count Mode (Testing)

```python
# Use Count to test without blocking
{
    'Statement': {
        'ManagedRuleGroupStatement': {
            'VendorName': 'AWS',
            'Name': 'AWSManagedRulesCommonRuleSet'
        }
    },
    'OverrideAction': {'Count': {}},  # Count instead of block
    'VisibilityConfig': {
        'SampledRequestsEnabled': True,
        'CloudWatchMetricsEnabled': True,
        'MetricName': 'CommonRuleSetCount'
    }
}
```

## Bot Control

### AWS Managed Bot Control

```python
{
    'Name': 'AWSManagedRulesBotControlRuleSet',
    'Priority': 1,
    'Statement': {
        'ManagedRuleGroupStatement': {
            'VendorName': 'AWS',
            'Name': 'AWSManagedRulesBotControlRuleSet',
            'ManagedRuleGroupConfigs': [
                {
                    'AWSManagedRulesBotControlRuleSet': {
                        'InspectionLevel': 'COMMON'  # or 'TARGETED'
                    }
                }
            ]
        }
    },
    'OverrideAction': {'None': {}},
    'VisibilityConfig': {
        'SampledRequestsEnabled': True,
        'CloudWatchMetricsEnabled': True,
        'MetricName': 'BotControl'
    }
}
```

**Inspection Levels**:
```
COMMON: $10/million requests
  - Block common bots
  - Basic protection

TARGETED: $100/million requests
  - Advanced bot detection
  - ML-based analysis
  - Block sophisticated bots
```

### Custom Bot Rules

```python
# Block user-agents
{
    'Statement': {
        'ByteMatchStatement': {
            'SearchString': 'bot',
            'FieldToMatch': {
                'SingleHeader': {'Name': 'user-agent'}
            },
            'TextTransformations': [
                {'Priority': 0, 'Type': 'LOWERCASE'}
            ],
            'PositionalConstraint': 'CONTAINS'
        }
    },
    'Action': {'Block': {}}
}
```

## CAPTCHA and Challenge

### CAPTCHA Action

```python
{
    'Statement': {
        'RateBasedStatement': {
            'Limit': 500,
            'AggregateKeyType': 'IP'
        }
    },
    'Action': {
        'Captcha': {
            'CustomRequestHandling': {
                'InsertHeaders': [
                    {
                        'Name': 'x-captcha-required',
                        'Value': 'true'
                    }
                ]
            }
        }
    },
    'CaptchaConfig': {
        'ImmunityTimeProperty': {
            'ImmunityTime': 300  # 5 minutes immunity after solving CAPTCHA
        }
    },
    'VisibilityConfig': {
        'SampledRequestsEnabled': True,
        'CloudWatchMetricsEnabled': True,
        'MetricName': 'CaptchaRule'
    }
}
```

### Challenge Action (Silent JavaScript)

```python
{
    'Statement': {
        'ByteMatchStatement': {
            'SearchString': '/api/',
            'FieldToMatch': {'UriPath': {}},
            'TextTransformations': [{'Priority': 0, 'Type': 'NONE'}],
            'PositionalConstraint': 'STARTS_WITH'
        }
    },
    'Action': {
        'Challenge': {
            'CustomRequestHandling': {
                'InsertHeaders': [
                    {'Name': 'x-challenge-passed', 'Value': 'true'}
                ]
            }
        }
    },
    'ChallengeConfig': {
        'ImmunityTimeProperty': {
            'ImmunityTime': 600  # 10 minutes
        }
    },
    'VisibilityConfig': {
        'SampledRequestsEnabled': True,
        'CloudWatchMetricsEnabled': True,
        'MetricName': 'ChallengeRule'
    }
}
```

## Custom Responses

### Block with Custom Response

```python
{
    'Action': {
        'Block': {
            'CustomResponse': {
                'ResponseCode': 403,
                'CustomResponseBodyKey': 'custom-403',
                'ResponseHeaders': [
                    {
                        'Name': 'x-blocked-by',
                        'Value': 'AWS-WAF'
                    }
                ]
            }
        }
    }
}
```

**Define Custom Response Body**:
```python
wafv2.put_logging_configuration(
    LoggingConfiguration={
        'ResourceArn': web_acl_arn,
        'LogDestinationConfigs': [
            'arn:aws:s3:::my-waf-logs'
        ]
    }
)

# Custom response bodies defined in Web ACL
web_acl = wafv2.create_web_acl(
    # ... existing config
    CustomResponseBodies={
        'custom-403': {
            'ContentType': 'TEXT_HTML',
            'Content': '<html><body><h1>Access Denied</h1></body></html>'
        },
        'custom-rate-limit': {
            'ContentType': 'APPLICATION_JSON',
            'Content': '{"error": "Rate limit exceeded"}'
        }
    }
)
```

## Logging

### Enable Logging to S3

```python
# Create S3 bucket for WAF logs
s3 = boto3.client('s3')
s3.create_bucket(
    Bucket='aws-waf-logs-my-app',
    CreateBucketConfiguration={'LocationConstraint': 'us-east-1'}
)

# Enable logging
wafv2.put_logging_configuration(
    LoggingConfiguration={
        'ResourceArn': web_acl_arn,
        'LogDestinationConfigs': [
            'arn:aws:s3:::aws-waf-logs-my-app'
        ],
        'RedactedFields': [
            {'SingleHeader': {'Name': 'authorization'}},
            {'SingleHeader': {'Name': 'cookie'}}
        ],
        'LoggingFilter': {
            'DefaultBehavior': 'KEEP',  # or 'DROP'
            'Filters': [
                {
                    'Behavior': 'KEEP',
                    'Requirement': 'MEETS_ANY',
                    'Conditions': [
                        {
                            'ActionCondition': {
                                'Action': 'BLOCK'
                            }
                        },
                        {
                            'LabelNameCondition': {
                                'LabelName': 'awswaf:managed:aws:bot-control:bot:category:monitoring'
                            }
                        }
                    ]
                }
            ]
        }
    }
)
```

### Enable Logging to CloudWatch Logs

```python
logs = boto3.client('logs')

# Create log group
logs.create_log_group(logGroupName='aws-waf/my-app')

# Put logging configuration
wafv2.put_logging_configuration(
    LoggingConfiguration={
        'ResourceArn': web_acl_arn,
        'LogDestinationConfigs': [
            'arn:aws:logs:us-east-1:123456789012:log-group:aws-waf/my-app'
        ]
    }
)
```

### Enable Logging to Kinesis Firehose

```python
firehose = boto3.client('firehose')

# Create Firehose delivery stream
firehose.create_delivery_stream(
    DeliveryStreamName='aws-waf-logs',
    S3DestinationConfiguration={
        'RoleARN': 'arn:aws:iam::123456789012:role/firehose_delivery_role',
        'BucketARN': 'arn:aws:s3:::my-waf-logs',
        'Prefix': 'waf-logs/',
        'BufferingHints': {
            'SizeInMBs': 5,
            'IntervalInSeconds': 300
        },
        'CompressionFormat': 'GZIP'
    }
)

# Configure WAF logging
wafv2.put_logging_configuration(
    LoggingConfiguration={
        'ResourceArn': web_acl_arn,
        'LogDestinationConfigs': [
            'arn:aws:firehose:us-east-1:123456789012:deliverystream/aws-waf-logs'
        ]
    }
)
```

## Monitoring

### CloudWatch Metrics

```python
cloudwatch = boto3.client('cloudwatch')

# Get blocked requests
metrics = cloudwatch.get_metric_statistics(
    Namespace='AWS/WAFV2',
    MetricName='BlockedRequests',
    Dimensions=[
        {'Name': 'WebACL', 'Value': 'my-web-acl'},
        {'Name': 'Region', 'Value': 'us-east-1'},
        {'Name': 'Rule', 'Value': 'ALL'}
    ],
    StartTime=datetime.now() - timedelta(hours=1),
    EndTime=datetime.now(),
    Period=300,
    Statistics=['Sum']
)
```

**Key Metrics**:
- **AllowedRequests**: Allowed count
- **BlockedRequests**: Blocked count
- **CountedRequests**: Counted (monitoring mode)
- **PassedRequests**: Passed to resource
- **CaptchaRequests**: CAPTCHA presented
- **ChallengeRequests**: Challenge presented

### CloudWatch Alarms

```python
# Alarm for high block rate
cloudwatch.put_metric_alarm(
    AlarmName='WAF-HighBlockRate',
    MetricName='BlockedRequests',
    Namespace='AWS/WAFV2',
    Statistic='Sum',
    Period=300,
    EvaluationPeriods=2,
    Threshold=1000,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'WebACL', 'Value': 'my-web-acl'},
        {'Name': 'Region', 'Value': 'us-east-1'}
    ],
    AlarmActions=[
        'arn:aws:sns:us-east-1:123456789012:waf-alerts'
    ]
)
```

## Cost Optimization

### Pricing

**Web ACL**:
```
$5.00 per month per Web ACL
```

**Rules**:
```
$1.00 per month per rule
```

**Requests**:
```
$0.60 per 1 million requests
```

**Bot Control**:
```
COMMON: $10.00 per 1 million requests
TARGETED: $100.00 per 1 million requests
```

**CAPTCHA/Challenge**:
```
$0.40 per 1,000 CAPTCHA attempts
$0.40 per 1,000 Challenge attempts
```

### Cost Examples

**Basic Protection**:
```
Web ACL: $5.00
Rules: 5 × $1.00 = $5.00
Requests: 10M × $0.60 = $6.00
Total: $16.00/month
```

**Advanced Protection with Bot Control**:
```
Web ACL: $5.00
Rules: 10 × $1.00 = $10.00
Requests: 100M × $0.60 = $60.00
Bot Control (COMMON): 100M × $10.00 = $1,000.00
Total: $1,075.00/month
```

**Cost Optimization Tips**:

**Use Managed Rule Groups**:
```
Single managed rule group = $1.00
Equivalent custom rules = $5-10.00
Savings: 80-90%
```

**Consolidate Rules**:
```
BAD: 5 separate IP set rules = $5.00
GOOD: 1 rule with combined IP set = $1.00
Savings: $4.00/month
```

**Use Count Mode for Testing**:
```
Test rules in Count mode before blocking
Avoid false positives blocking legitimate users
```

## Real-World Scenarios

### Scenario 1: E-Commerce Site Protection

**Requirements**:
- Block SQL injection/XSS
- Rate limit login attempts
- Geo-blocking from high-risk countries
- Bot protection

**Solution**:
```python
web_acl = wafv2.create_web_acl(
    Name='ecommerce-protection',
    Scope='REGIONAL',
    DefaultAction={'Allow': {}},
    Rules=[
        {
            'Name': 'AWSManagedRulesCommonRuleSet',
            'Priority': 1,
            'Statement': {
                'ManagedRuleGroupStatement': {
                    'VendorName': 'AWS',
                    'Name': 'AWSManagedRulesCommonRuleSet'
                }
            },
            'OverrideAction': {'None': {}},
            'VisibilityConfig': {
                'SampledRequestsEnabled': True,
                'CloudWatchMetricsEnabled': True,
                'MetricName': 'CommonRuleSet'
            }
        },
        {
            'Name': 'RateLimitLogin',
            'Priority': 2,
            'Statement': {
                'RateBasedStatement': {
                    'Limit': 100,
                    'AggregateKeyType': 'IP',
                    'ScopeDownStatement': {
                        'ByteMatchStatement': {
                            'SearchString': '/login',
                            'FieldToMatch': {'UriPath': {}},
                            'TextTransformations': [{'Priority': 0, 'Type': 'NONE'}],
                            'PositionalConstraint': 'CONTAINS'
                        }
                    }
                }
            },
            'Action': {'Block': {}},
            'VisibilityConfig': {
                'SampledRequestsEnabled': True,
                'CloudWatchMetricsEnabled': True,
                'MetricName': 'RateLimitLogin'
            }
        },
        {
            'Name': 'GeoBlocking',
            'Priority': 3,
            'Statement': {
                'GeoMatchStatement': {
                    'CountryCodes': ['KP', 'IR', 'SY']
                }
            },
            'Action': {'Block': {}},
            'VisibilityConfig': {
                'SampledRequestsEnabled': True,
                'CloudWatchMetricsEnabled': True,
                'MetricName': 'GeoBlocking'
            }
        },
        {
            'Name': 'BotControl',
            'Priority': 4,
            'Statement': {
                'ManagedRuleGroupStatement': {
                    'VendorName': 'AWS',
                    'Name': 'AWSManagedRulesBotControlRuleSet',
                    'ManagedRuleGroupConfigs': [
                        {
                            'AWSManagedRulesBotControlRuleSet': {
                                'InspectionLevel': 'COMMON'
                            }
                        }
                    ]
                }
            },
            'OverrideAction': {'None': {}},
            'VisibilityConfig': {
                'SampledRequestsEnabled': True,
                'CloudWatchMetricsEnabled': True,
                'MetricName': 'BotControl'
            }
        }
    ],
    VisibilityConfig={
        'SampledRequestsEnabled': True,
        'CloudWatchMetricsEnabled': True,
        'MetricName': 'EcommerceWAF'
    }
)
```

**Cost**:
```
Web ACL: $5.00
Rules: 4 × $1.00 = $4.00 (managed groups count as 1 rule each)
Requests: 50M × $0.60 = $30.00
Bot Control: 50M × $10.00 = $500.00
Total: $539.00/month
```

### Scenario 2: API Protection

**Requirements**:
- API key validation
- Rate limiting per API key
- Block malformed JSON
- CAPTCHA for suspicious requests

**Solution**:
```python
web_acl = wafv2.create_web_acl(
    Name='api-protection',
    Scope='REGIONAL',
    DefaultAction={'Allow': {}},
    Rules=[
        {
            'Name': 'RequireAPIKey',
            'Priority': 1,
            'Statement': {
                'NotStatement': {
                    'Statement': {
                        'SizeConstraintStatement': {
                            'FieldToMatch': {
                                'SingleHeader': {'Name': 'x-api-key'}
                            },
                            'ComparisonOperator': 'GE',
                            'Size': 20,
                            'TextTransformations': [{'Priority': 0, 'Type': 'NONE'}]
                        }
                    }
                }
            },
            'Action': {'Block': {}},
            'VisibilityConfig': {
                'SampledRequestsEnabled': True,
                'CloudWatchMetricsEnabled': True,
                'MetricName': 'RequireAPIKey'
            }
        },
        {
            'Name': 'RateLimitPerAPIKey',
            'Priority': 2,
            'Statement': {
                'RateBasedStatement': {
                    'Limit': 1000,
                    'AggregateKeyType': 'CUSTOM_KEYS',
                    'CustomKeys': [
                        {
                            'Header': {
                                'Name': 'x-api-key',
                                'TextTransformations': [{'Priority': 0, 'Type': 'NONE'}]
                            }
                        }
                    ]
                }
            },
            'Action': {
                'Captcha': {
                    'CustomRequestHandling': {
                        'InsertHeaders': [
                            {'Name': 'x-rate-limited', 'Value': 'true'}
                        ]
                    }
                }
            },
            'CaptchaConfig': {
                'ImmunityTimeProperty': {'ImmunityTime': 300}
            },
            'VisibilityConfig': {
                'SampledRequestsEnabled': True,
                'CloudWatchMetricsEnabled': True,
                'MetricName': 'RateLimitPerAPIKey'
            }
        }
    ],
    VisibilityConfig={
        'SampledRequestsEnabled': True,
        'CloudWatchMetricsEnabled': True,
        'MetricName': 'APIWAF'
    }
)
```

**Cost**:
```
Web ACL: $5.00
Rules: 2 × $1.00 = $2.00
Requests: 20M × $0.60 = $12.00
CAPTCHA: 10K attempts × $0.40 = $4.00
Total: $23.00/month
```

## Exam Tips (SAP-C02)

### Key Decision Points

**WAF vs Security Groups**:
```
Layer 7 (HTTP/HTTPS) → WAF
Layer 3/4 (IP/port) → Security Groups
Web exploits → WAF
Network access control → Security Groups
```

**Managed vs Custom Rules**:
```
Common protections → Managed rules (cheaper)
Specific business logic → Custom rules
Testing/evaluation → Count mode
```

**CAPTCHA vs Block**:
```
Legitimate users mixed with bots → CAPTCHA
Known malicious → Block
High confidence → Challenge (silent)
```

### Common Patterns

**DDoS Protection**:
```
Layer 7 DDoS → WAF rate-based rules
Layer 3/4 DDoS → Shield Standard (automatic)
Advanced DDoS → Shield Advanced
```

**Bot Mitigation**:
```
Simple bots → User-agent matching
Sophisticated bots → Managed Bot Control
Cost-sensitive → COMMON level
Advanced ML → TARGETED level
```

**Geo-Restriction**:
```
Country-level → Geo Match Statement
Content restriction → CloudFront geo-restriction
Compliance → Both WAF + CloudFront
```

This comprehensive AWS WAF guide covers web application protection, bot control, and cost optimization for SAP-C02 mastery.
