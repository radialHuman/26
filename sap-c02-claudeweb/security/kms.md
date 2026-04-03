# AWS KMS (Key Management Service)

## What is KMS?

AWS Key Management Service (KMS) is a managed service that enables you to create and control cryptographic keys used to encrypt your data. KMS uses Hardware Security Modules (HSMs) to protect the security of your keys.

## Why Use KMS?

### Key Benefits
- **Centralized Key Management**: Single service for all encryption keys
- **Integrated with AWS Services**: Works with S3, EBS, RDS, Lambda, etc.
- **Automatic Key Rotation**: Annual rotation for AWS-managed keys
- **Audit Trail**: CloudTrail logs all key usage
- **FIPS 140-2 Level 2**: Hardware security modules validated
- **Access Control**: Fine-grained IAM and key policies
- **Cost-Effective**: Pay per API call and key storage

### Use Cases
- Encrypt data at rest (S3, EBS, RDS, DynamoDB)
- Encrypt data in transit
- Digital signatures
- Compliance (HIPAA, PCI-DSS, GDPR)
- Envelope encryption
- Cross-account encryption
- Multi-region encryption

## KMS Keys (Customer Master Keys)

### Types of KMS Keys

**1. AWS Managed Keys**:
- **Created by**: AWS services automatically
- **Naming**: `aws/service-name` (e.g., `aws/s3`, `aws/rds`)
- **Rotation**: Automatic every year (cannot disable)
- **Cost**: Free
- **Control**: Limited (cannot delete, no key policy changes)

**Example**:
```
aws/s3 → Automatic key for S3 SSE-KMS
aws/rds → Automatic key for RDS encryption
aws/ebs → Automatic key for EBS encryption
```

**2. Customer Managed Keys** (Recommended):
- **Created by**: You
- **Rotation**: Optional (manual or automatic every year)
- **Cost**: $1/month per key + API calls
- **Control**: Full control (key policy, deletion, rotation)

**Creating Customer Managed Key**:
```python
import boto3

kms = boto3.client('kms')

response = kms.create_key(
    Description='Key for encrypting sensitive data',
    KeyUsage='ENCRYPT_DECRYPT',
    Origin='AWS_KMS',  # Or 'EXTERNAL' for imported keys
    MultiRegion=False
)

key_id = response['KeyMetadata']['KeyId']
key_arn = response['KeyMetadata']['Arn']

# Create alias (user-friendly name)
kms.create_alias(
    AliasName='alias/my-application-key',
    TargetKeyId=key_id
)
```

**3. AWS Owned Keys**:
- **Created by**: AWS (shared across accounts)
- **Visibility**: Not visible in your account
- **Cost**: Free
- **Example**: Default DynamoDB encryption

**4. Customer Managed Keys (Imported)**:
- **Key Material**: You provide
- **Use Case**: Regulatory requirements for own key material
- **Limitation**: No automatic rotation

**Importing Key**:
```python
# 1. Get import parameters
response = kms.get_parameters_for_import(
    KeyId=key_id,
    WrappingAlgorithm='RSAES_OAEP_SHA_256',
    WrappingKeySpec='RSA_2048'
)

import_token = response['ImportToken']
public_key = response['PublicKey']

# 2. Encrypt your key material with public key
# (Outside AWS, using your key management process)

# 3. Import encrypted key material
kms.import_key_material(
    KeyId=key_id,
    ImportToken=import_token,
    EncryptedKeyMaterial=encrypted_key_material,
    ExpirationModel='KEY_MATERIAL_DOES_NOT_EXPIRE'
)
```

### Symmetric vs Asymmetric Keys

**Symmetric Keys** (Default):
- **Algorithm**: AES-256-GCM
- **Use Case**: Encryption/decryption
- **Performance**: Fast
- **Key Material**: Never leaves AWS (KMS API only)
- **Cost**: Lower

**Asymmetric Keys**:
- **Algorithm**: RSA or ECC
- **Use Case**: Encryption/decryption OR signing/verification
- **Public Key**: Can be downloaded
- **Private Key**: Never leaves AWS
- **Cost**: Higher

**RSA Key Pairs**:
```python
# Create RSA key for encryption
kms.create_key(
    KeyUsage='ENCRYPT_DECRYPT',
    KeySpec='RSA_2048'  # Or RSA_3072, RSA_4096
)

# Create RSA key for signing
kms.create_key(
    KeyUsage='SIGN_VERIFY',
    KeySpec='RSA_2048'
)
```

**ECC Key Pairs**:
```python
# Create ECC key for signing (more efficient than RSA)
kms.create_key(
    KeyUsage='SIGN_VERIFY',
    KeySpec='ECC_NIST_P256'  # Or ECC_NIST_P384, ECC_NIST_P521
)
```

## Key Policies

### Policy Types

**1. Key Policy** (Required):
- Resource-based policy attached to KMS key
- Controls access to the key
- Required for all KMS keys

**Default Key Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    }
  ]
}
```

**Custom Key Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Allow use of the key for encryption",
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::123456789012:role/MyApplicationRole",
          "arn:aws:iam::123456789012:user/alice"
        ]
      },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Allow key administrators",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/KeyAdmin"
      },
      "Action": [
        "kms:Create*",
        "kms:Describe*",
        "kms:Enable*",
        "kms:List*",
        "kms:Put*",
        "kms:Update*",
        "kms:Revoke*",
        "kms:Disable*",
        "kms:Get*",
        "kms:Delete*",
        "kms:TagResource",
        "kms:UntagResource",
        "kms:ScheduleKeyDeletion",
        "kms:CancelKeyDeletion"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Allow S3 to use key",
      "Effect": "Allow",
      "Principal": {
        "Service": "s3.amazonaws.com"
      },
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "*"
    }
  ]
}
```

**2. IAM Policies**:
- Identity-based policies
- Supplement key policies
- Only work if key policy allows IAM policies

**IAM Policy Example**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "arn:aws:kms:us-east-1:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab"
    }
  ]
}
```

**3. Grants** (Programmatic Permissions):
- Temporary permissions
- Use case: Allow service to use key on your behalf

**Creating Grant**:
```python
response = kms.create_grant(
    KeyId=key_id,
    GranteePrincipal='arn:aws:iam::123456789012:role/EncryptionService',
    Operations=['Encrypt', 'Decrypt', 'GenerateDataKey'],
    Constraints={
        'EncryptionContextSubset': {
            'Department': 'Finance'
        }
    }
)

grant_token = response['GrantToken']
grant_id = response['GrantId']

# Revoke grant
kms.revoke_grant(KeyId=key_id, GrantId=grant_id)
```

### Cross-Account Access

**Key Owner Account (123456789012)**:
```json
{
  "Sid": "Allow external account",
  "Effect": "Allow",
  "Principal": {
    "AWS": "arn:aws:iam::999999999999:root"
  },
  "Action": [
    "kms:Encrypt",
    "kms:Decrypt",
    "kms:GenerateDataKey"
  ],
  "Resource": "*"
}
```

**External Account (999999999999)** - IAM Policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "arn:aws:kms:us-east-1:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab"
    }
  ]
}
```

## Encryption Operations

### Encrypt/Decrypt (Small Data <4 KB)

**Encrypt**:
```python
response = kms.encrypt(
    KeyId='alias/my-application-key',
    Plaintext=b'Sensitive data to encrypt',
    EncryptionContext={
        'Department': 'Finance',
        'Purpose': 'CustomerData'
    }
)

ciphertext_blob = response['CiphertextBlob']
```

**Decrypt**:
```python
response = kms.decrypt(
    CiphertextBlob=ciphertext_blob,
    EncryptionContext={
        'Department': 'Finance',
        'Purpose': 'CustomerData'
    }
)

plaintext = response['Plaintext']
```

**Limitation**: Max 4 KB data

### Envelope Encryption (Large Data >4 KB)

**How It Works**:
```
1. Generate data key from KMS
2. Use data key to encrypt large data (locally)
3. Encrypt data key with KMS key
4. Store encrypted data + encrypted data key

Decryption:
1. Decrypt data key with KMS
2. Use data key to decrypt large data (locally)
```

**Generate Data Key**:
```python
response = kms.generate_data_key(
    KeyId='alias/my-application-key',
    KeySpec='AES_256',  # Or AES_128
    EncryptionContext={
        'Purpose': 'FileEncryption'
    }
)

plaintext_key = response['Plaintext']  # Use for encryption, then discard
encrypted_key = response['CiphertextBlob']  # Store with encrypted data
```

**Encrypt Large File**:
```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os

# Generate data key
response = kms.generate_data_key(KeyId=key_id, KeySpec='AES_256')
plaintext_key = response['Plaintext']
encrypted_key = response['CiphertextBlob']

# Encrypt file with data key
iv = os.urandom(16)
cipher = Cipher(
    algorithms.AES(plaintext_key),
    modes.GCM(iv),
    backend=default_backend()
)
encryptor = cipher.encryptor()

with open('large_file.dat', 'rb') as f:
    plaintext = f.read()

ciphertext = encryptor.update(plaintext) + encryptor.finalize()

# Store: encrypted_key + iv + ciphertext + encryptor.tag
with open('large_file.dat.encrypted', 'wb') as f:
    f.write(encrypted_key)
    f.write(iv)
    f.write(encryptor.tag)
    f.write(ciphertext)

# Securely delete plaintext key from memory
del plaintext_key
```

**Decrypt Large File**:
```python
# Read encrypted file
with open('large_file.dat.encrypted', 'rb') as f:
    encrypted_key = f.read(256)  # Encrypted data key size
    iv = f.read(16)
    tag = f.read(16)
    ciphertext = f.read()

# Decrypt data key with KMS
response = kms.decrypt(CiphertextBlob=encrypted_key)
plaintext_key = response['Plaintext']

# Decrypt file with data key
cipher = Cipher(
    algorithms.AES(plaintext_key),
    modes.GCM(iv, tag),
    backend=default_backend()
)
decryptor = cipher.decryptor()

plaintext = decryptor.update(ciphertext) + decryptor.finalize()

with open('large_file.dat.decrypted', 'wb') as f:
    f.write(plaintext)

# Securely delete plaintext key
del plaintext_key
```

**AWS Services Use Envelope Encryption**:
- S3 (SSE-KMS)
- EBS (encrypted volumes)
- RDS (encrypted databases)
- Lambda (environment variables)

### Encryption Context

**What**: Additional authenticated data (AAD)

**Purpose**:
- Additional security (must provide same context to decrypt)
- CloudTrail logging (track who encrypted what for whom)
- Grants (constrain key usage)

**Example**:
```python
# Encrypt with context
kms.encrypt(
    KeyId=key_id,
    Plaintext=b'Secret data',
    EncryptionContext={
        'Department': 'Finance',
        'UserID': 'user-12345',
        'DocumentID': 'doc-67890'
    }
)

# Decrypt requires same context
kms.decrypt(
    CiphertextBlob=ciphertext,
    EncryptionContext={
        'Department': 'Finance',
        'UserID': 'user-12345',
        'DocumentID': 'doc-67890'
    }
)

# Different context = decryption fails
kms.decrypt(
    CiphertextBlob=ciphertext,
    EncryptionContext={
        'Department': 'Engineering'  # Wrong department
    }
)
# Raises: InvalidCiphertextException
```

**CloudTrail Log** (Shows Context):
```json
{
  "eventName": "Decrypt",
  "requestParameters": {
    "encryptionContext": {
      "Department": "Finance",
      "UserID": "user-12345",
      "DocumentID": "doc-67890"
    }
  }
}
```

## Key Rotation

### Automatic Rotation

**Customer Managed Keys**:
```python
# Enable automatic rotation (every 365 days)
kms.enable_key_rotation(KeyId=key_id)

# Check rotation status
response = kms.get_key_rotation_status(KeyId=key_id)
print(response['KeyRotationEnabled'])  # True
```

**How It Works**:
```
Year 1: Key version 1 (active)
Year 2: Key version 2 (active), version 1 (available for decryption)
Year 3: Key version 3 (active), versions 1-2 (available for decryption)

Encryption: Always uses latest version
Decryption: Automatically uses correct version
```

**AWS Managed Keys**:
- Automatic rotation every year
- Cannot disable

**Imported Keys**:
- No automatic rotation
- Manual rotation required

### Manual Rotation

**Process**:
```
1. Create new KMS key
2. Update application alias to point to new key
3. Keep old key for decrypting existing data
```

**Example**:
```python
# Create new key
new_key = kms.create_key(Description='Application key v2')
new_key_id = new_key['KeyMetadata']['KeyId']

# Update alias
kms.update_alias(
    AliasName='alias/my-application-key',
    TargetKeyId=new_key_id
)

# Old key still available for decryption
# New encryptions use new key
```

## Multi-Region Keys

### What are Multi-Region Keys?

**Purpose**: Same key in multiple regions (for disaster recovery, global applications)

**How It Works**:
```
Primary Key (us-east-1): 
  Key ID: mrk-1234abcd12ab34cd56ef1234567890ab

Replica Key (eu-west-1):
  Key ID: mrk-1234abcd12ab34cd56ef1234567890ab
  
Same key material, different ARNs, synchronized
```

**Creating Multi-Region Key**:
```python
# Create primary key in us-east-1
response = kms.create_key(
    Description='Multi-region application key',
    MultiRegion=True
)

primary_key_id = response['KeyMetadata']['KeyId']
# Returns: mrk-xxx

# Replicate to eu-west-1
kms_eu = boto3.client('kms', region_name='eu-west-1')

kms_eu.replicate_key(
    KeyId=primary_key_arn,  # Primary key ARN
    ReplicaRegion='eu-west-1',
    Description='Replica in eu-west-1'
)
```

**Use Cases**:
```
Global application:
  - Encrypt in us-east-1
  - Decrypt in eu-west-1 (same key material)

Disaster recovery:
  - Primary region fails
  - Promote replica to primary
  - Continue operations

Data residency:
  - Encrypt locally in each region
  - Centralized key management
```

**Limitations**:
- Replica cannot be rotated independently
- Deleting primary deletes all replicas (after waiting period)

## KMS Limits and Quotas

### API Request Limits

**Shared Quota** (per region):
- **Symmetric Keys**: 5,500 req/sec (GenerateDataKey, Decrypt)
- **Asymmetric RSA**: 500 req/sec
- **Asymmetric ECC**: 300 req/sec

**Can Request Increase**: Yes (via support)

**Handling Throttling**:
```python
import time
from botocore.exceptions import ClientError

def decrypt_with_retry(ciphertext, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = kms.decrypt(CiphertextBlob=ciphertext)
            return response['Plaintext']
        except ClientError as e:
            if e.response['Error']['Code'] == 'ThrottlingException':
                # Exponential backoff
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                time.sleep(wait_time)
            else:
                raise
    raise Exception('Max retries exceeded')
```

**Reduce API Calls**:
- Use data key caching (encrypt multiple objects with same key)
- Envelope encryption (fewer KMS calls)
- Batch operations

### Data Key Caching

**AWS Encryption SDK**:
```python
from aws_encryption_sdk import EncryptionSDKClient
from aws_encryption_sdk.key_providers.kms import KMSMasterKeyProvider
from aws_encryption_sdk.caches.local import LocalCryptoMaterialsCache
from aws_encryption_sdk.caching_cmm import CachingCryptoMaterialsManager

# Setup caching
cache = LocalCryptoMaterialsCache(capacity=100)

kms_key_provider = KMSMasterKeyProvider(key_ids=[key_arn])

cache_cmm = CachingCryptoMaterialsManager(
    master_key_provider=kms_key_provider,
    cache=cache,
    max_age=300,  # Reuse key for 5 minutes
    max_messages_encrypted=100  # Or 100 messages
)

client = EncryptionSDKClient()

# Encrypt multiple messages (reuses data key)
for message in messages:
    ciphertext, _ = client.encrypt(
        source=message,
        materials_manager=cache_cmm
    )

# Result: 1 GenerateDataKey call for 100 encryptions
# Instead of 100 GenerateDataKey calls
```

## Monitoring and Auditing

### CloudTrail Logging

**All KMS API Calls Logged**:
```json
{
  "eventTime": "2026-01-31T10:30:00Z",
  "eventName": "Decrypt",
  "userIdentity": {
    "type": "AssumedRole",
    "arn": "arn:aws:sts::123456789012:assumed-role/MyAppRole/i-1234567890abcdef0"
  },
  "requestParameters": {
    "encryptionContext": {
      "Department": "Finance",
      "DocumentID": "doc-12345"
    },
    "encryptionAlgorithm": "SYMMETRIC_DEFAULT"
  },
  "responseElements": null,
  "resources": [
    {
      "accountId": "123456789012",
      "type": "AWS::KMS::Key",
      "ARN": "arn:aws:kms:us-east-1:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab"
    }
  ]
}
```

**Monitoring Key Usage**:
```
CloudWatch Insights query:
fields @timestamp, userIdentity.arn, requestParameters.encryptionContext
| filter eventName = "Decrypt"
| filter resources.0.ARN = "arn:aws:kms:us-east-1:123456789012:key/xxx"
| sort @timestamp desc
```

### CloudWatch Metrics

**No Native Metrics**: KMS doesn't publish metrics

**Custom Metrics** (from CloudTrail):
```python
import boto3

cloudwatch = boto3.client('cloudwatch')

# Publish metric for each KMS API call
cloudwatch.put_metric_data(
    Namespace='KMS',
    MetricData=[
        {
            'MetricName': 'APICallCount',
            'Dimensions': [
                {'Name': 'Operation', 'Value': 'Decrypt'},
                {'Name': 'KeyId', 'Value': key_id}
            ],
            'Value': 1,
            'Unit': 'Count'
        }
    ]
)
```

**Alarm on Unusual Activity**:
```python
cloudwatch.put_metric_alarm(
    AlarmName='KMS-Unusual-Decrypt-Activity',
    MetricName='APICallCount',
    Namespace='KMS',
    Statistic='Sum',
    Period=300,
    EvaluationPeriods=1,
    Threshold=1000,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'Operation', 'Value': 'Decrypt'}
    ],
    AlarmActions=[sns_topic_arn]
)
```

## Best Practices

**1. Use Customer Managed Keys**:
```
More control than AWS managed keys
Key policies, rotation, deletion
```

**2. Enable Automatic Rotation**:
```
Annual rotation for compliance
Reduces risk of key compromise
```

**3. Use Least Privilege**:
```
Key policies: Grant only necessary actions
Separate admin (key management) from user (encrypt/decrypt)
```

**4. Use Encryption Context**:
```
Additional security (binding)
Audit trail (CloudTrail logs context)
```

**5. Monitor Key Usage**:
```
CloudTrail logs for all API calls
Alert on unusual patterns
```

**6. Use Grants for Temporary Access**:
```
Time-limited permissions
Easier to revoke than key policy changes
```

**7. Key Deletion Waiting Period**:
```
Default: 30 days (7-30 days)
Prevents accidental deletion
Can cancel during waiting period
```

**8. Use Aliases**:
```
User-friendly names
Easy to rotate keys (update alias)
```

**9. Use Envelope Encryption**:
```
For data >4 KB
Reduces KMS API calls
Better performance
```

**10. Multi-Region Keys for DR**:
```
Global applications
Disaster recovery
Same key material across regions
```

## Real-World Scenarios

### Scenario 1: S3 Bucket Encryption

**Requirements**:
- Encrypt all S3 objects
- Control who can decrypt
- Audit access

**Setup**:
```python
# Create KMS key
key = kms.create_key(
    Description='S3 encryption key',
    KeyUsage='ENCRYPT_DECRYPT'
)
key_id = key['KeyMetadata']['KeyId']

kms.create_alias(
    AliasName='alias/s3-bucket-key',
    TargetKeyId=key_id
)

# Key policy: Allow S3
key_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Allow S3 to use key",
            "Effect": "Allow",
            "Principal": {"Service": "s3.amazonaws.com"},
            "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
            "Resource": "*"
        },
        {
            "Sid": "Allow specific users to decrypt",
            "Effect": "Allow",
            "Principal": {
                "AWS": [
                    "arn:aws:iam::123456789012:user/alice",
                    "arn:aws:iam::123456789012:role/DataAnalyst"
                ]
            },
            "Action": "kms:Decrypt",
            "Resource": "*"
        }
    ]
}

kms.put_key_policy(
    KeyId=key_id,
    PolicyName='default',
    Policy=json.dumps(key_policy)
)

# Enable default encryption on bucket
s3 = boto3.client('s3')
s3.put_bucket_encryption(
    Bucket='my-sensitive-bucket',
    ServerSideEncryptionConfiguration={
        'Rules': [{
            'ApplyServerSideEncryptionByDefault': {
                'SSEAlgorithm': 'aws:kms',
                'KMSMasterKeyID': 'alias/s3-bucket-key'
            },
            'BucketKeyEnabled': True  # Reduces KMS costs
        }]
    }
)
```

**Cost Optimization** (S3 Bucket Keys):
```
Without bucket keys:
  1M objects uploaded = 1M GenerateDataKey calls
  Cost: 1M × $0.03/10K = $3,000/month

With bucket keys:
  1M objects uploaded = ~1 GenerateDataKey call
  Cost: $0.03/10K ≈ $0.003/month

Savings: 99.9%
```

### Scenario 2: Cross-Account Data Sharing

**Requirements**:
- Account A encrypts data
- Account B reads encrypted data
- Maintain encryption at rest

**Account A** (123456789012):
```python
# Create KMS key
key = kms.create_key(Description='Shared data key')
key_id = key['KeyMetadata']['KeyId']

# Key policy: Allow Account B
key_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Allow Account A admin",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::123456789012:root"
            },
            "Action": "kms:*",
            "Resource": "*"
        },
        {
            "Sid": "Allow Account B to decrypt",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::999999999999:root"
            },
            "Action": [
                "kms:Decrypt",
                "kms:DescribeKey"
            ],
            "Resource": "*"
        }
    ]
}

kms.put_key_policy(KeyId=key_id, PolicyName='default', Policy=json.dumps(key_policy))

# Upload encrypted object to S3
s3.put_object(
    Bucket='shared-bucket',
    Key='data.csv',
    Body=data,
    ServerSideEncryption='aws:kms',
    SSEKMSKeyId=key_id
)

# Grant Account B read access to S3
bucket_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"AWS": "arn:aws:iam::999999999999:root"},
        "Action": ["s3:GetObject"],
        "Resource": "arn:aws:s3:::shared-bucket/*"
    }]
}

s3.put_bucket_policy(
    Bucket='shared-bucket',
    Policy=json.dumps(bucket_policy)
)
```

**Account B** (999999999999):
```python
# IAM policy for user in Account B
user_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["s3:GetObject"],
            "Resource": "arn:aws:s3:::shared-bucket/*"
        },
        {
            "Effect": "Allow",
            "Action": ["kms:Decrypt", "kms:DescribeKey"],
            "Resource": "arn:aws:kms:us-east-1:123456789012:key/*"
        }
    ]
}

# User can now download and decrypt
response = s3.get_object(Bucket='shared-bucket', Key='data.csv')
data = response['Body'].read()
# Automatic decryption with KMS
```

### Scenario 3: Lambda Environment Variable Encryption

**Requirements**:
- Encrypt sensitive Lambda environment variables
- Different keys for different environments

**Setup**:
```python
# Create keys for each environment
for env in ['dev', 'staging', 'prod']:
    key = kms.create_key(Description=f'{env} Lambda encryption key')
    key_id = key['KeyMetadata']['KeyId']
    
    kms.create_alias(
        AliasName=f'alias/lambda-{env}',
        TargetKeyId=key_id
    )

# Create Lambda function with encrypted env vars
lambda_client = boto3.client('lambda')

lambda_client.create_function(
    FunctionName='my-function-prod',
    Runtime='python3.9',
    Role='arn:aws:iam::123456789012:role/LambdaRole',
    Handler='index.handler',
    Code={'ZipFile': code_bytes},
    Environment={
        'Variables': {
            'DB_PASSWORD': 'encrypted_value',
            'API_KEY': 'encrypted_value'
        }
    },
    KMSKeyArn='arn:aws:kms:us-east-1:123456789012:alias/lambda-prod'
)

# Lambda execution role needs kms:Decrypt
```

**In Lambda Code**:
```python
import os
import boto3
import base64

kms = boto3.client('kms')

# Decrypt environment variable (first invocation only, then cache)
encrypted_password = os.environ['DB_PASSWORD']

response = kms.decrypt(
    CiphertextBlob=base64.b64decode(encrypted_password)
)

db_password = response['Plaintext'].decode('utf-8')
```

### Scenario 4: Compliance (HIPAA)

**Requirements**:
- Encrypt all PHI (Protected Health Information)
- Audit all access
- Rotate keys annually

**Implementation**:
```python
# Create HIPAA-compliant key
key = kms.create_key(
    Description='HIPAA PHI encryption key',
    KeyUsage='ENCRYPT_DECRYPT',
    Tags=[
        {'TagKey': 'Compliance', 'TagValue': 'HIPAA'},
        {'TagKey': 'DataClass', 'TagValue': 'PHI'}
    ]
)
key_id = key['KeyMetadata']['KeyId']

# Enable automatic rotation
kms.enable_key_rotation(KeyId=key_id)

# Restrictive key policy
key_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Allow authorized users only",
            "Effect": "Allow",
            "Principal": {
                "AWS": [
                    "arn:aws:iam::123456789012:role/HealthcareApp",
                    "arn:aws:iam::123456789012:role/DoctorPortal"
                ]
            },
            "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:GenerateDataKey"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "kms:EncryptionContext:PatientID": "${aws:username}"
                }
            }
        }
    ]
}

kms.put_key_policy(KeyId=key_id, PolicyName='default', Policy=json.dumps(key_policy))

# Encrypt PHI with encryption context
response = kms.encrypt(
    KeyId=key_id,
    Plaintext=phi_data,
    EncryptionContext={
        'PatientID': 'patient-12345',
        'RecordType': 'MedicalHistory',
        'AccessedBy': 'doctor-67890'
    }
)

# CloudTrail logs all access with full encryption context
# Compliance team can audit who accessed what PHI
```

### Scenario 5: Global Application with Multi-Region Keys

**Requirements**:
- Application in us-east-1 and eu-west-1
- Encrypt in either region
- Decrypt in either region

**Setup**:
```python
# Create multi-region primary key in us-east-1
kms_us = boto3.client('kms', region_name='us-east-1')

primary_key = kms_us.create_key(
    Description='Global application key',
    MultiRegion=True
)
primary_key_id = primary_key['KeyMetadata']['KeyId']
primary_key_arn = primary_key['KeyMetadata']['Arn']

kms_us.create_alias(
    AliasName='alias/global-app-key',
    TargetKeyId=primary_key_id
)

# Replicate to eu-west-1
kms_eu = boto3.client('kms', region_name='eu-west-1')

replica = kms_eu.replicate_key(
    KeyId=primary_key_arn,
    ReplicaRegion='eu-west-1'
)

replica_key_id = replica['ReplicaKeyMetadata']['KeyId']

kms_eu.create_alias(
    AliasName='alias/global-app-key',
    TargetKeyId=replica_key_id
)

# Encrypt in us-east-1
ciphertext = kms_us.encrypt(
    KeyId='alias/global-app-key',
    Plaintext=b'Global data'
)['CiphertextBlob']

# Decrypt in eu-west-1 (same key material)
plaintext = kms_eu.decrypt(
    CiphertextBlob=ciphertext
)['Plaintext']

# Works! Same key material in both regions
```

## Exam Tips (SAP-C02)

### Key Decision Points

**AWS Managed vs Customer Managed**:
```
Need custom key policy → Customer managed
Need to rotate on custom schedule → Customer managed
Default encryption → AWS managed (automatic)
```

**Symmetric vs Asymmetric**:
```
Encrypt/decrypt in AWS → Symmetric
Public key distribution → Asymmetric
Digital signatures → Asymmetric
```

**Single-Region vs Multi-Region**:
```
Global application → Multi-region
Disaster recovery → Multi-region
Local application → Single-region (cheaper)
```

**Envelope Encryption**:
```
Data >4 KB → Envelope encryption
S3, EBS, RDS → Automatic envelope encryption
Reduce KMS API calls → Data key caching
```

### Common Scenarios

**"Encrypt S3 bucket"**:
- SSE-KMS with customer managed key
- Enable bucket keys (cost reduction)

**"Cross-account encryption"**:
- Key policy: Allow external account
- External account IAM: Allow key usage

**"Audit key usage"**:
- CloudTrail logs all KMS API calls
- Use encryption context for tracking

**"Reduce KMS costs"**:
- S3 bucket keys
- Data key caching
- Envelope encryption

**"Compliance (rotation)"**:
- Enable automatic rotation
- Customer managed key required

**"Global application"**:
- Multi-region keys
- Replicate to all regions

**"Prevent accidental deletion"**:
- Deletion waiting period (7-30 days)
- Can cancel during waiting period

This comprehensive KMS guide covers all aspects for SAP-C02 exam success.
