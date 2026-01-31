# AWS Secrets Manager

## What is Secrets Manager?

AWS Secrets Manager helps you manage, retrieve, and rotate database credentials, API keys, and other secrets throughout their lifecycle. It provides central storage with encryption, access control, and automatic rotation.

## Why Use Secrets Manager?

### Key Benefits
- **Automatic Rotation**: Built-in rotation for RDS, DocumentDB, Redshift
- **Encryption**: KMS encryption at rest
- **Auditing**: CloudTrail logs all access
- **Fine-Grained Access**: IAM policies control who accesses what
- **Versioning**: Track secret changes with version staging
- **Integration**: Native support for RDS, Lambda, ECS, etc.

### Use Cases
- Database credentials rotation
- API keys management
- OAuth tokens storage
- Third-party service credentials
- Application configuration (passwords, connection strings)
- Certificate private keys

## Creating Secrets

### Database Secret (with Rotation)

```python
import boto3
import json

secretsmanager = boto3.client('secretsmanager')

# Create secret for RDS database
secret = secretsmanager.create_secret(
    Name='prod/db/mysql/credentials',
    Description='MySQL database credentials for production',
    SecretString=json.dumps({
        'username': 'admin',
        'password': 'MySecurePassword123!',
        'engine': 'mysql',
        'host': 'mydb.cluster-xxxxx.us-east-1.rds.amazonaws.com',
        'port': 3306,
        'dbname': 'myapp'
    }),
    KmsKeyId='arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    Tags=[
        {'Key': 'Environment', 'Value': 'production'},
        {'Key': 'Application', 'Value': 'myapp'}
    ]
)

secret_arn = secret['ARN']
```

### API Key Secret

```python
# Create secret for third-party API key
api_secret = secretsmanager.create_secret(
    Name='prod/api/stripe/key',
    Description='Stripe API key',
    SecretString=json.dumps({
        'api_key': 'sk_live_xxxxxxxxxxxx',
        'publishable_key': 'pk_live_xxxxxxxxxxxx',
        'webhook_secret': 'whsec_xxxxxxxxxxxx'
    }),
    KmsKeyId='alias/aws/secretsmanager',  # Default KMS key
    Tags=[
        {'Key': 'Service', 'Value': 'stripe'},
        {'Key': 'Environment', 'Value': 'production'}
    ]
)
```

### Plain Text Secret

```python
# Create plain text secret
text_secret = secretsmanager.create_secret(
    Name='prod/app/config',
    SecretString='MY_SECRET_VALUE_12345'
)
```

### Binary Secret

```python
# Create binary secret (e.g., certificate)
with open('certificate.pfx', 'rb') as f:
    cert_data = f.read()

binary_secret = secretsmanager.create_secret(
    Name='prod/cert/ssl',
    Description='SSL certificate',
    SecretBinary=cert_data
)
```

## Retrieving Secrets

### Get Secret Value

```python
# Retrieve secret
response = secretsmanager.get_secret_value(
    SecretId='prod/db/mysql/credentials'
)

# Parse JSON secret
if 'SecretString' in response:
    secret_data = json.loads(response['SecretString'])
    username = secret_data['username']
    password = secret_data['password']
    host = secret_data['host']
    port = secret_data['port']
else:
    # Binary secret
    binary_secret_data = response['SecretBinary']

print(f"Connecting to {host}:{port} as {username}")
```

### Get Specific Version

```python
# Get specific version by version ID
response = secretsmanager.get_secret_value(
    SecretId='prod/db/mysql/credentials',
    VersionId='12345678-1234-1234-1234-123456789012'
)

# Get specific version by stage
response = secretsmanager.get_secret_value(
    SecretId='prod/db/mysql/credentials',
    VersionStage='AWSPREVIOUS'  # or 'AWSCURRENT', 'AWSPENDING'
)
```

### Caching with Secrets Manager Caching Library

```python
from aws_secretsmanager_caching import SecretCache

# Create cache
cache = SecretCache()

# Get secret (cached for 1 hour by default)
secret_json = cache.get_secret_string('prod/db/mysql/credentials')
secret = json.loads(secret_json)

# Use secret
password = secret['password']

# Cache automatically refreshes after TTL
# Reduces API calls and costs
```

**Cache Configuration**:
```python
from aws_secretsmanager_caching import SecretCache, SecretCacheConfig

# Custom cache config
config = SecretCacheConfig(
    max_cache_size=100,  # Max secrets in cache
    exception_retry_delay_base=0.1,  # Retry delay
    exception_retry_growth_factor=2,
    exception_retry_delay_max=10,
    default_version_stage='AWSCURRENT',
    secret_refresh_interval=3600,  # 1 hour
    secret_version_info_ttl=300  # 5 minutes
)

cache = SecretCache(config=config)
```

## Automatic Rotation

### Enable Rotation for RDS

```python
# Enable automatic rotation
secretsmanager.rotate_secret(
    SecretId='prod/db/mysql/credentials',
    RotationLambdaARN='arn:aws:lambda:us-east-1:123456789012:function:SecretsManagerRDSMySQLRotationSingleUser',
    RotationRules={
        'AutomaticallyAfterDays': 30  # Rotate every 30 days
    }
)
```

### Rotation Lambda Functions

**Single User Rotation** (default):
```
Function: SecretsManagerRDSMySQLRotationSingleUser
Strategy: Create clone user, test, swap credentials
Downtime: None
Use: Most common scenario
```

**Multi User Rotation** (zero downtime):
```
Function: SecretsManagerRDSMySQLRotationMultiUser
Strategy: Maintain two users (A and B), alternate rotation
Downtime: Zero
Use: High availability requirements

Setup:
  1. Create two database users: user_A and user_B
  2. Create two secrets: master (tracks active user) and clone
  3. Rotation alternates between users
```

**Enable Multi-User Rotation**:
```python
# Create master secret (user A)
master_secret = secretsmanager.create_secret(
    Name='prod/db/mysql/master',
    SecretString=json.dumps({
        'username': 'app_user_a',
        'password': 'InitialPassword123!',
        'host': 'mydb.cluster-xxxxx.us-east-1.rds.amazonaws.com',
        'port': 3306
    })
)

# Create clone secret (user B)
clone_secret = secretsmanager.create_secret(
    Name='prod/db/mysql/clone',
    SecretString=json.dumps({
        'username': 'app_user_b',
        'password': 'InitialPassword456!',
        'host': 'mydb.cluster-xxxxx.us-east-1.rds.amazonaws.com',
        'port': 3306,
        'masterarn': master_secret['ARN']  # Reference to master
    })
)

# Enable rotation on master
secretsmanager.rotate_secret(
    SecretId='prod/db/mysql/master',
    RotationLambdaARN='arn:aws:lambda:us-east-1:123456789012:function:SecretsManagerRDSMySQLRotationMultiUser',
    RotationRules={'AutomaticallyAfterDays': 30}
)
```

### Custom Rotation Lambda

**Lambda Function**:
```python
import boto3
import json

def lambda_handler(event, context):
    """
    Rotation Lambda for custom secret
    
    Steps:
    1. createSecret: Generate new password
    2. setSecret: Update service with new password
    3. testSecret: Verify new password works
    4. finishSecret: Mark AWSCURRENT
    """
    
    service_client = boto3.client('secretsmanager')
    token = event['ClientRequestToken']
    secret_id = event['SecretId']
    step = event['Step']
    
    # Get secret metadata
    metadata = service_client.describe_secret(SecretId=secret_id)
    
    if step == "createSecret":
        create_secret(service_client, secret_id, token)
    elif step == "setSecret":
        set_secret(service_client, secret_id, token)
    elif step == "testSecret":
        test_secret(service_client, secret_id, token)
    elif step == "finishSecret":
        finish_secret(service_client, secret_id, token)
    else:
        raise ValueError(f"Invalid step: {step}")

def create_secret(service_client, secret_id, token):
    """Generate new secret value"""
    # Get current secret
    current = service_client.get_secret_value(
        SecretId=secret_id,
        VersionStage='AWSCURRENT'
    )
    current_dict = json.loads(current['SecretString'])
    
    # Generate new password
    new_password = service_client.get_random_password(
        PasswordLength=32,
        ExcludeCharacters='/@"\'\\'
    )['RandomPassword']
    
    # Create new version
    current_dict['password'] = new_password
    service_client.put_secret_value(
        SecretId=secret_id,
        ClientRequestToken=token,
        SecretString=json.dumps(current_dict),
        VersionStages=['AWSPENDING']
    )

def set_secret(service_client, secret_id, token):
    """Update service with new secret"""
    # Get pending secret
    pending = service_client.get_secret_value(
        SecretId=secret_id,
        VersionId=token,
        VersionStage='AWSPENDING'
    )
    pending_dict = json.loads(pending['SecretString'])
    
    # Update your service with new password
    # Example: API call to third-party service
    # api_client.update_password(pending_dict['password'])

def test_secret(service_client, secret_id, token):
    """Verify new secret works"""
    # Get pending secret
    pending = service_client.get_secret_value(
        SecretId=secret_id,
        VersionId=token,
        VersionStage='AWSPENDING'
    )
    pending_dict = json.loads(pending['SecretString'])
    
    # Test connection with new credentials
    # Example: try connecting to service
    # connection = connect(pending_dict['username'], pending_dict['password'])

def finish_secret(service_client, secret_id, token):
    """Finalize rotation"""
    # Get version with AWSCURRENT stage
    metadata = service_client.describe_secret(SecretId=secret_id)
    current_version = None
    for version_id, stages in metadata['VersionIdsToStages'].items():
        if 'AWSCURRENT' in stages:
            if version_id == token:
                # Already current
                return
            current_version = version_id
            break
    
    # Move AWSCURRENT to new version
    service_client.update_secret_version_stage(
        SecretId=secret_id,
        VersionStage='AWSCURRENT',
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )
```

**Deploy Rotation Lambda**:
```python
lambda_client = boto3.client('lambda')
iam = boto3.client('iam')

# Create Lambda execution role
role = iam.create_role(
    RoleName='SecretsManagerRotationRole',
    AssumeRolePolicyDocument=json.dumps({
        'Version': '2012-10-17',
        'Statement': [{
            'Effect': 'Allow',
            'Principal': {'Service': 'lambda.amazonaws.com'},
            'Action': 'sts:AssumeRole'
        }]
    })
)

# Attach policies
iam.attach_role_policy(
    RoleName='SecretsManagerRotationRole',
    PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
)

iam.attach_role_policy(
    RoleName='SecretsManagerRotationRole',
    PolicyArn='arn:aws:iam::aws:policy/SecretsManagerReadWrite'
)

# Create Lambda function
with open('rotation_lambda.zip', 'rb') as f:
    lambda_code = f.read()

function = lambda_client.create_function(
    FunctionName='CustomSecretRotation',
    Runtime='python3.11',
    Role=role['Role']['Arn'],
    Handler='lambda_function.lambda_handler',
    Code={'ZipFile': lambda_code},
    Timeout=30,
    Environment={
        'Variables': {
            'SERVICE_API_ENDPOINT': 'https://api.example.com'
        }
    }
)

# Grant Secrets Manager permission to invoke Lambda
lambda_client.add_permission(
    FunctionName='CustomSecretRotation',
    StatementId='SecretsManagerAccess',
    Action='lambda:InvokeFunction',
    Principal='secretsmanager.amazonaws.com'
)
```

## Access Control

### IAM Policies

**Read-Only Access**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/db/*"
    },
    {
      "Effect": "Allow",
      "Action": "kms:Decrypt",
      "Resource": "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012"
    }
  ]
}
```

**Full Access to Specific Secrets**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "secretsmanager:*",
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/api/stripe/*",
        "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/api/twilio/*"
      ]
    }
  ]
}
```

**Tag-Based Access**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "secretsmanager:ResourceTag/Environment": "development"
        }
      }
    }
  ]
}
```

### Resource-Based Policies

**Cross-Account Access**:
```python
# Attach resource policy to secret
secretsmanager.put_resource_policy(
    SecretId='prod/db/mysql/credentials',
    ResourcePolicy=json.dumps({
        'Version': '2012-10-17',
        'Statement': [{
            'Effect': 'Allow',
            'Principal': {
                'AWS': 'arn:aws:iam::999999999999:role/AppRole'
            },
            'Action': 'secretsmanager:GetSecretValue',
            'Resource': '*'
        }]
    })
)
```

**Deny Access from Specific VPC Endpoint**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:sourceVpce": "vpce-12345678"
        }
      }
    }
  ]
}
```

## Updating Secrets

### Update Secret Value

```python
# Update existing secret
secretsmanager.update_secret(
    SecretId='prod/api/stripe/key',
    SecretString=json.dumps({
        'api_key': 'sk_live_NEW_KEY_xxxxxxxxxxxx',
        'publishable_key': 'pk_live_NEW_KEY_xxxxxxxxxxxx'
    })
)
```

### Update with Versioning

```python
# Put new version (manual versioning)
response = secretsmanager.put_secret_value(
    SecretId='prod/api/stripe/key',
    SecretString=json.dumps({'api_key': 'sk_live_UPDATED_xxxxxxxxxxxx'}),
    ClientRequestToken='custom-version-id',  # Optional unique ID
    VersionStages=['AWSCURRENT', 'CUSTOM_STAGE']
)

version_id = response['VersionId']
```

## Replication

### Multi-Region Secrets

```python
# Create secret with replication
secretsmanager.create_secret(
    Name='prod/db/global/credentials',
    SecretString=json.dumps({
        'username': 'admin',
        'password': 'SecurePassword123!'
    }),
    ReplicaRegions=[
        {
            'Region': 'us-west-2',
            'KmsKeyId': 'arn:aws:kms:us-west-2:123456789012:key/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
        },
        {
            'Region': 'eu-west-1',
            'KmsKeyId': 'alias/aws/secretsmanager'
        }
    ]
)

# Access replica in different region
sm_west = boto3.client('secretsmanager', region_name='us-west-2')
secret = sm_west.get_secret_value(SecretId='prod/db/global/credentials')
```

**Add Replica to Existing Secret**:
```python
secretsmanager.replicate_secret_to_regions(
    SecretId='prod/db/mysql/credentials',
    AddReplicaRegions=[
        {
            'Region': 'ap-southeast-1',
            'KmsKeyId': 'alias/aws/secretsmanager'
        }
    ]
)
```

**Remove Replica**:
```python
secretsmanager.remove_regions_from_replication(
    SecretId='prod/db/mysql/credentials',
    RemoveReplicaRegions=['ap-southeast-1']
)
```

## Integration with AWS Services

### Lambda Environment Variables

**Bad Practice** (hardcoded):
```python
import os

API_KEY = os.environ['API_KEY']  # Exposed in console
```

**Good Practice** (Secrets Manager):
```python
import boto3
import json

secretsmanager = boto3.client('secretsmanager')

def lambda_handler(event, context):
    # Retrieve secret
    secret = secretsmanager.get_secret_value(SecretId='prod/api/stripe/key')
    api_key = json.loads(secret['SecretString'])['api_key']
    
    # Use API key
    # ...
```

**Best Practice** (with caching):
```python
from aws_secretsmanager_caching import SecretCache

# Cache initialized once (outside handler)
cache = SecretCache()

def lambda_handler(event, context):
    secret_json = cache.get_secret_string('prod/api/stripe/key')
    secret = json.loads(secret_json)
    
    # Use cached secret
    api_key = secret['api_key']
```

### ECS Task Definition

```json
{
  "containerDefinitions": [
    {
      "name": "app",
      "image": "myapp:latest",
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/db/mysql/credentials:password::"
        },
        {
          "name": "DB_USERNAME",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/db/mysql/credentials:username::"
        }
      ]
    }
  ]
}
```

**Python ECS Task**:
```python
ecs = boto3.client('ecs')

task_definition = ecs.register_task_definition(
    family='myapp',
    networkMode='awsvpc',
    requiresCompatibilities=['FARGATE'],
    cpu='256',
    memory='512',
    executionRoleArn='arn:aws:iam::123456789012:role/ecsTaskExecutionRole',
    containerDefinitions=[
        {
            'name': 'app',
            'image': 'myapp:latest',
            'secrets': [
                {
                    'name': 'DB_PASSWORD',
                    'valueFrom': 'arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/db/mysql/credentials:password::'
                }
            ]
        }
    ]
)
```

### RDS Proxy

```python
rds = boto3.client('rds')

# Create RDS Proxy with Secrets Manager auth
proxy = rds.create_db_proxy(
    DBProxyName='myapp-proxy',
    EngineFamily='MYSQL',
    Auth=[
        {
            'AuthScheme': 'SECRETS',
            'SecretArn': 'arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/db/mysql/credentials',
            'IAMAuth': 'DISABLED'
        }
    ],
    RoleArn='arn:aws:iam::123456789012:role/RDSProxyRole',
    VpcSubnetIds=['subnet-12345678', 'subnet-87654321'],
    RequireTLS=True
)
```

## Monitoring and Auditing

### CloudWatch Alarms

```python
cloudwatch = boto3.client('cloudwatch')

# Alarm for failed rotation
cloudwatch.put_metric_alarm(
    AlarmName='SecretsManager-RotationFailed',
    MetricName='RotationFailedCount',
    Namespace='AWS/SecretsManager',
    Statistic='Sum',
    Period=300,
    EvaluationPeriods=1,
    Threshold=1,
    ComparisonOperator='GreaterThanOrEqualToThreshold',
    Dimensions=[
        {'Name': 'SecretId', 'Value': 'prod/db/mysql/credentials'}
    ],
    AlarmActions=[
        'arn:aws:sns:us-east-1:123456789012:ops-alerts'
    ]
)
```

### CloudTrail Logging

**Query Secret Access**:
```python
cloudtrail = boto3.client('cloudtrail')

# Lookup events
events = cloudtrail.lookup_events(
    LookupAttributes=[
        {
            'AttributeKey': 'EventName',
            'AttributeValue': 'GetSecretValue'
        }
    ],
    StartTime=datetime.now() - timedelta(days=7),
    EndTime=datetime.now()
)

for event in events['Events']:
    print(f"{event['EventTime']}: {event['Username']} accessed secret")
```

**Athena Query**:
```sql
SELECT
  eventtime,
  useridentity.principalid,
  requestparameters,
  sourceipaddress
FROM cloudtrail_logs
WHERE eventname = 'GetSecretValue'
  AND requestparameters LIKE '%prod/db/mysql/credentials%'
ORDER BY eventtime DESC
LIMIT 100;
```

## Cost Optimization

### Pricing

**Secret Storage**:
```
$0.40 per secret per month
First 30 days free for new secrets
```

**API Calls**:
```
$0.05 per 10,000 API calls
First 100,000 calls free tier
```

**Rotation**:
```
No additional charge (includes Lambda invocations)
```

### Cost Examples

**Scenario 1: Small Application**:
```
Secrets: 10
API calls: 100,000/month (cache hits)

Storage: 10 × $0.40 = $4.00
API calls: Free (within free tier)
Total: $4.00/month
```

**Scenario 2: Microservices**:
```
Secrets: 50 (per service DB credentials)
API calls: 1M/month

Storage: 50 × $0.40 = $20.00
API calls: 1M - 100K = 900K billable
  900K × $0.05/10K = $4.50
Total: $24.50/month
```

**Scenario 3: Enterprise**:
```
Secrets: 500
API calls: 10M/month (high traffic)

Storage: 500 × $0.40 = $200.00
API calls: (10M - 100K) × $0.05/10K = $49.50
Total: $249.50/month
```

### Cost Optimization Tips

**Use Caching**:
```python
# Without caching: 1000 requests/sec = 2.6B requests/month
# Cost: 2.6B × $0.05/10K = $13,000/month

# With caching (1 hour TTL): 1 request/hour = 8760 requests/month
# Cost: Free (within free tier)
# Savings: $13,000/month
```

**Delete Unused Secrets**:
```python
# Schedule deletion (7-30 days grace period)
secretsmanager.delete_secret(
    SecretId='old/unused/secret',
    RecoveryWindowInDays=30  # Grace period
)

# Cancel deletion if needed
secretsmanager.restore_secret(SecretId='old/unused/secret')

# Immediate deletion (no recovery)
secretsmanager.delete_secret(
    SecretId='old/unused/secret',
    ForceDeleteWithoutRecovery=True
)
```

## Real-World Scenarios

### Scenario 1: Rotating RDS Credentials

**Setup**:
```python
# 1. Create secret
secret = secretsmanager.create_secret(
    Name='prod/rds/aurora/master',
    SecretString=json.dumps({
        'username': 'admin',
        'password': 'InitialPassword123!',
        'engine': 'mysql',
        'host': 'aurora-cluster.xxxxx.rds.amazonaws.com',
        'port': 3306,
        'dbClusterIdentifier': 'aurora-cluster'
    })
)

# 2. Enable rotation
secretsmanager.rotate_secret(
    SecretId='prod/rds/aurora/master',
    RotationLambdaARN='arn:aws:lambda:us-east-1:123456789012:function:SecretsManagerRDSMySQLRotation',
    RotationRules={'AutomaticallyAfterDays': 30}
)

# 3. Application retrieves secret
def get_db_connection():
    secret = secretsmanager.get_secret_value(SecretId='prod/rds/aurora/master')
    creds = json.loads(secret['SecretString'])
    
    return pymysql.connect(
        host=creds['host'],
        user=creds['username'],
        password=creds['password'],
        database='myapp'
    )
```

**Cost**:
```
Secret: $0.40/month
API calls: 10K/month (cached) = Free
Total: $0.40/month
```

### Scenario 2: Multi-Region Disaster Recovery

**Setup**:
```python
# Create replicated secret
secretsmanager.create_secret(
    Name='prod/app/credentials',
    SecretString=json.dumps({'key': 'value'}),
    ReplicaRegions=[
        {'Region': 'us-west-2'},
        {'Region': 'eu-west-1'},
        {'Region': 'ap-southeast-1'}
    ]
)

# Application failover logic
def get_secret_multi_region():
    regions = ['us-east-1', 'us-west-2', 'eu-west-1']
    
    for region in regions:
        try:
            sm = boto3.client('secretsmanager', region_name=region)
            return sm.get_secret_value(SecretId='prod/app/credentials')
        except Exception as e:
            continue
    
    raise Exception("All regions failed")
```

**Cost**:
```
Secrets: 4 replicas × $0.40 = $1.60/month
API calls: 50K/month = Free
Total: $1.60/month
```

## Exam Tips (SAP-C02)

### Key Decision Points

**Secrets Manager vs Parameter Store**:
```
Automatic rotation → Secrets Manager
Built-in RDS integration → Secrets Manager
Versioning needed → Both
Simple config values → Parameter Store
Cost-sensitive → Parameter Store (free tier)
Compliance/audit → Secrets Manager
```

**Rotation Strategies**:
```
RDS/DocumentDB/Redshift → Built-in rotation
Custom service → Custom Lambda
High availability → Multi-user rotation
Simple rotation → Single-user rotation
```

**Access Control**:
```
Cross-account → Resource policy
Tag-based → IAM condition
VPC restriction → VPC endpoint + policy
Time-based → IAM condition (DateGreaterThan)
```

### Common Patterns

**Zero-downtime rotation**:
```
Use multi-user rotation
Maintain two sets of credentials
Alternate during rotation
Application uses AWSCURRENT version
```

**Cost optimization**:
```
Implement caching (reduce API calls)
Delete unused secrets
Use Parameter Store for non-sensitive config
Consolidate secrets (single JSON vs multiple secrets)
```

**High availability**:
```
Multi-region replication
VPC endpoints for private access
Read replicas via caching
Graceful fallback in application
```

This comprehensive Secrets Manager guide covers secret management, rotation, access control, and integration patterns for SAP-C02 mastery.
