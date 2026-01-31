# AWS IAM: Identity and Access Management

## Table of Contents
1. [Introduction and History](#introduction-and-history)
2. [IAM Fundamentals](#iam-fundamentals)
3. [Principals: Users, Groups, and Roles](#principals-users-groups-and-roles)
4. [Policies Deep Dive](#policies-deep-dive)
5. [Policy Evaluation Logic](#policy-evaluation-logic)
6. [Cross-Account Access](#cross-account-access)
7. [STS and Temporary Credentials](#sts-and-temporary-credentials)
8. [IAM Best Practices](#iam-best-practices)
9. [LocalStack IAM Examples](#localstack-iam-examples)
10. [Production Patterns](#production-patterns)
11. [Interview Questions](#interview-questions)

---

## Introduction and History

### The Genesis of AWS IAM (2011)

AWS Identity and Access Management (IAM) was launched in **May 2011** as a response to the growing complexity of managing access control in cloud environments. Before IAM, AWS accounts had a single root credential with full access—a security nightmare for enterprises.

**Key Historical Milestones:**

- **2011**: IAM launched with Users, Groups, and Policies
- **2012**: Multi-Factor Authentication (MFA) support added
- **2013**: IAM Roles for EC2 instances (no hardcoded credentials)
- **2014**: Managed Policies introduced (AWS-managed and customer-managed)
- **2015**: Inline Policies deprecated in favor of Managed Policies
- **2016**: Permission Boundaries introduced for delegated administration
- **2017**: IAM Policy Simulator enhanced for testing
- **2018**: Service Control Policies (SCPs) for AWS Organizations
- **2019**: IAM Access Analyzer launched (automated policy validation)
- **2020**: IAM Roles Anywhere for on-premises workloads
- **2021**: Attribute-Based Access Control (ABAC) with tags
- **2022**: IAM Identity Center (formerly AWS SSO) integration
- **2023**: Passkeys support for passwordless authentication

### Why IAM Exists

In traditional IT, access control is managed through Active Directory, LDAP, or similar systems. AWS IAM provides:

1. **Fine-Grained Access Control**: Grant specific permissions to specific resources
2. **Temporary Credentials**: No need to embed long-term credentials in applications
3. **Centralized Management**: Single place to manage all AWS access
4. **Audit Trail**: CloudTrail logs all IAM actions
5. **Federation**: Integrate with corporate identity providers (SAML, OIDC)
6. **Zero Cost**: IAM is completely free

**Real-World Problem:**

Before IAM Roles for EC2:
```python
# BAD: Hardcoded credentials in application code
aws_access_key = "AKIAIOSFODNN7EXAMPLE"
aws_secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

s3 = boto3.client('s3', 
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_key
)
```

After IAM Roles:
```python
# GOOD: Credentials automatically provided by instance metadata
s3 = boto3.client('s3')  # Role credentials fetched automatically
```

---

## IAM Fundamentals

### Core Components

```
AWS Account (Root)
├─ IAM Users (long-term credentials)
├─ IAM Groups (collections of users)
├─ IAM Roles (temporary credentials)
└─ IAM Policies (permissions)
```

#### 1. Root User

The **root user** is created when you first create an AWS account. It has **unrestricted access** to all AWS resources.

**Root User Capabilities (Cannot be restricted):**
- Change account settings (email, password, payment methods)
- Close AWS account
- Restore IAM user permissions
- Change AWS Support plan
- Register as a seller in Reserved Instance Marketplace
- Enable MFA delete on S3 bucket
- Create CloudFront key pairs
- Sign up for GovCloud

**Security Best Practices:**
1. **Never use root user for daily tasks**
2. **Enable MFA** on root account immediately
3. **Delete root access keys** if they exist
4. **Create IAM users** for administrative tasks

#### 2. IAM Users

**IAM Users** represent individual people or applications that need access to AWS.

**User Credentials:**
- **Console Password**: For AWS Management Console access
- **Access Keys**: For programmatic access (CLI, SDK, API)
  - Access Key ID: `AKIAIOSFODNN7EXAMPLE`
  - Secret Access Key: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- **SSH Keys**: For AWS CodeCommit
- **X.509 Certificates**: For certain AWS services (deprecated)

**Creating Users:**

```python
import boto3

iam = boto3.client('iam', endpoint_url='http://localhost:4566')

# Create user
iam.create_user(UserName='alice')

# Create console password
iam.create_login_profile(
    UserName='alice',
    Password='ComplexPassword123!',
    PasswordResetRequired=True  # Force password change on first login
)

# Create access keys for programmatic access
response = iam.create_access_key(UserName='alice')
print(f"Access Key ID: {response['AccessKey']['AccessKeyId']}")
print(f"Secret Access Key: {response['AccessKey']['SecretAccessKey']}")
```

**User Limits:**
- **Users per account**: 5,000 (soft limit, can be increased)
- **Groups per user**: 10
- **Access keys per user**: 2 (for rotation)
- **Policies attached per user**: 10 managed policies + unlimited inline

#### 3. IAM Groups

**Groups** are collections of IAM users. Policies attached to a group apply to all members.

```python
# Create group
iam.create_group(GroupName='Developers')

# Add users to group
iam.add_user_to_group(GroupName='Developers', UserName='alice')
iam.add_user_to_group(GroupName='Developers', UserName='bob')

# Attach policy to group
iam.attach_group_policy(
    GroupName='Developers',
    PolicyArn='arn:aws:iam::aws:policy/PowerUserAccess'
)
```

**Key Points:**
- **Groups cannot be nested**: A group cannot contain other groups
- **Users can belong to multiple groups**: Alice can be in both "Developers" and "Database-Admins"
- **No default group**: Users are not automatically added to any group
- **Groups are not principals**: You cannot specify a group in a policy's Principal element

#### 4. IAM Roles

**Roles** provide temporary credentials to entities (users, applications, services).

**Role Types:**

1. **Service Role**: For AWS services (EC2, Lambda, etc.)
2. **Cross-Account Role**: For users in another AWS account
3. **Federation Role**: For external identity providers (SAML, OIDC)
4. **Web Identity Role**: For mobile/web apps (Cognito, Google, Facebook)

```python
# Create role for EC2 instances
assume_role_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ec2.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
}

iam.create_role(
    RoleName='EC2-S3-Access-Role',
    AssumeRolePolicyDocument=json.dumps(assume_role_policy)
)

# Attach permissions policy
iam.attach_role_policy(
    RoleName='EC2-S3-Access-Role',
    PolicyArn='arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
)
```

**Role Sessions:**

When you assume a role, you get temporary credentials:
- **Access Key ID**: Starts with `ASIA` (vs `AKIA` for permanent)
- **Secret Access Key**: Temporary key
- **Session Token**: Required for all API calls
- **Expiration**: 1 hour (default) to 12 hours (max)

---

## Principals: Users, Groups, and Roles

### Principal Types

A **Principal** is an entity that can make requests to AWS services.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::123456789012:user/alice",          // IAM User
      "Service": "ec2.amazonaws.com",                          // AWS Service
      "Federated": "arn:aws:iam::123456789012:saml-provider/ExampleProvider",  // SAML
      "CanonicalUser": "79a59df900b949e55d96a1e698fbacedfd6e09d98eacf8f8d5218e7cd47ef2be"  // S3
    },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::my-bucket/*"
  }]
}
```

### User Management in Depth

#### Password Policy

```python
# Set account password policy
iam.update_account_password_policy(
    MinimumPasswordLength=14,
    RequireSymbols=True,
    RequireNumbers=True,
    RequireUppercaseCharacters=True,
    RequireLowercaseCharacters=True,
    AllowUsersToChangePassword=True,
    ExpirePasswords=True,
    MaxPasswordAge=90,  # Days
    PasswordReusePrevention=5,  # Remember last 5 passwords
    HardExpiry=False  # Allow password change after expiration
)
```

#### MFA Configuration

```python
# Enable virtual MFA device
mfa_device = iam.create_virtual_mfa_device(
    VirtualMFADeviceName='alice-mfa'
)

# Get QR code for scanning with authenticator app
qr_code = mfa_device['VirtualMFADevice']['QRCodePNG']

# User scans QR code and provides two consecutive codes
iam.enable_mfa_device(
    UserName='alice',
    SerialNumber=mfa_device['VirtualMFADevice']['SerialNumber'],
    AuthenticationCode1='123456',
    AuthenticationCode2='789012'
)
```

#### Access Key Rotation

```python
def rotate_access_key(user_name):
    """Rotate access key for a user"""
    # List existing keys
    response = iam.list_access_keys(UserName=user_name)
    existing_keys = response['AccessKeyMetadata']
    
    # Create new key
    new_key = iam.create_access_key(UserName=user_name)
    print(f"New Access Key: {new_key['AccessKey']['AccessKeyId']}")
    print(f"New Secret Key: {new_key['AccessKey']['SecretAccessKey']}")
    print("Update your application with new credentials, then press Enter to continue...")
    input()
    
    # Deactivate old keys
    for key in existing_keys:
        if key['AccessKeyId'] != new_key['AccessKey']['AccessKeyId']:
            iam.update_access_key(
                UserName=user_name,
                AccessKeyId=key['AccessKeyId'],
                Status='Inactive'
            )
            print(f"Deactivated old key: {key['AccessKeyId']}")
    
    print("Wait 24 hours to ensure no errors, then delete old keys manually")

# Example
rotate_access_key('alice')
```

### Role Management

#### Creating a Lambda Execution Role

```python
# Trust policy: Who can assume this role
trust_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
}

# Create role
iam.create_role(
    RoleName='LambdaExecutionRole',
    AssumeRolePolicyDocument=json.dumps(trust_policy),
    Description='Allows Lambda functions to call AWS services'
)

# Attach AWS managed policy for CloudWatch Logs
iam.attach_role_policy(
    RoleName='LambdaExecutionRole',
    PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
)

# Attach custom policy for S3 access
s3_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": [
            "s3:GetObject",
            "s3:PutObject"
        ],
        "Resource": "arn:aws:s3:::my-bucket/*"
    }]
}

iam.put_role_policy(
    RoleName='LambdaExecutionRole',
    PolicyName='S3Access',
    PolicyDocument=json.dumps(s3_policy)
)
```

#### Instance Profiles for EC2

Roles cannot be directly attached to EC2 instances. You need an **Instance Profile**:

```python
# Create instance profile
iam.create_instance_profile(InstanceProfileName='EC2-S3-Profile')

# Add role to instance profile
iam.add_role_to_instance_profile(
    InstanceProfileName='EC2-S3-Profile',
    RoleName='EC2-S3-Access-Role'
)

# Launch EC2 instance with instance profile
ec2 = boto3.client('ec2')
ec2.run_instances(
    ImageId='ami-0c55b159cbfafe1f0',
    InstanceType='t2.micro',
    IamInstanceProfile={'Name': 'EC2-S3-Profile'},
    MinCount=1,
    MaxCount=1
)
```

**Inside EC2 Instance:**

```python
# Application code - credentials automatically fetched
import boto3

# No credentials needed - fetched from instance metadata
s3 = boto3.client('s3')
s3.list_buckets()
```

**Metadata Endpoint (IMDSv2):**

```bash
# Get token
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

# Get credentials
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/EC2-S3-Access-Role
```

Response:
```json
{
  "Code": "Success",
  "LastUpdated": "2024-01-15T10:30:00Z",
  "Type": "AWS-HMAC",
  "AccessKeyId": "ASIAIOSFODNN7EXAMPLE",
  "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "Token": "FwoGZXIvYXdzEBQaD...",
  "Expiration": "2024-01-15T16:30:00Z"
}
```

---

## Policies Deep Dive

### Policy Types

#### 1. Identity-Based Policies

Attached to users, groups, or roles.

**Managed Policies** (standalone, reusable):
- **AWS Managed**: Created by AWS (e.g., `AdministratorAccess`)
- **Customer Managed**: Created by you

**Inline Policies** (embedded in a single user/group/role):
- Deleted when the principal is deleted
- Use when policy is tightly coupled to principal

```python
# Attach managed policy
iam.attach_user_policy(
    UserName='alice',
    PolicyArn='arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
)

# Create custom managed policy
policy_document = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": "s3:ListBucket",
        "Resource": "arn:aws:s3:::my-bucket"
    }]
}

response = iam.create_policy(
    PolicyName='MyS3ListPolicy',
    PolicyDocument=json.dumps(policy_document)
)

# Attach custom policy
iam.attach_user_policy(
    UserName='alice',
    PolicyArn=response['Policy']['Arn']
)

# Inline policy (not recommended)
iam.put_user_policy(
    UserName='alice',
    PolicyName='InlineS3Policy',
    PolicyDocument=json.dumps(policy_document)
)
```

#### 2. Resource-Based Policies

Attached to resources (S3 buckets, Lambda functions, SQS queues).

**S3 Bucket Policy:**

```python
s3 = boto3.client('s3')

bucket_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "AllowPublicRead",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::my-public-bucket/*"
    }]
}

s3.put_bucket_policy(
    Bucket='my-public-bucket',
    Policy=json.dumps(bucket_policy)
)
```

**Lambda Function Policy:**

```python
lambda_client = boto3.client('lambda')

# Allow API Gateway to invoke Lambda
lambda_client.add_permission(
    FunctionName='my-function',
    StatementId='AllowAPIGatewayInvoke',
    Action='lambda:InvokeFunction',
    Principal='apigateway.amazonaws.com',
    SourceArn='arn:aws:execute-api:us-east-1:123456789012:abcdef123/*/POST/users'
)
```

#### 3. Permission Boundaries

A **permission boundary** sets the maximum permissions that an identity-based policy can grant.

```python
# Create permission boundary policy
boundary_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": [
            "s3:*",
            "dynamodb:*"
        ],
        "Resource": "*"
    }]
}

response = iam.create_policy(
    PolicyName='DeveloperBoundary',
    PolicyDocument=json.dumps(boundary_policy)
)

# Set permission boundary for user
iam.put_user_permissions_boundary(
    UserName='alice',
    PermissionsBoundary=response['Policy']['Arn']
)

# Now even if Alice has AdministratorAccess, she can only access S3 and DynamoDB
```

**Use Case: Delegated Administration**

```
Scenario: Allow developers to create IAM roles for Lambda, but restrict 
          what permissions those roles can have.

1. Attach PowerUserAccess to developer (can create roles)
2. Set PermissionBoundary to restrict role permissions
3. Developer can create roles, but only within boundary limits
```

#### 4. Service Control Policies (SCPs)

SCPs are organization-level policies that apply to all accounts in AWS Organizations.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Action": [
      "ec2:RunInstances"
    ],
    "Resource": "*",
    "Condition": {
      "StringNotEquals": {
        "ec2:InstanceType": ["t2.micro", "t2.small"]
      }
    }
  }]
}
```

This SCP prevents launching any EC2 instance except t2.micro and t2.small across all accounts.

### Policy Structure

```json
{
  "Version": "2012-10-17",
  "Id": "MyPolicyId",
  "Statement": [{
    "Sid": "AllowS3Read",
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::123456789012:user/alice"
    },
    "Action": [
      "s3:GetObject",
      "s3:GetObjectVersion"
    ],
    "Resource": "arn:aws:s3:::my-bucket/*",
    "Condition": {
      "IpAddress": {
        "aws:SourceIp": "203.0.113.0/24"
      }
    }
  }]
}
```

**Elements:**

- **Version**: Policy language version (always "2012-10-17")
- **Id**: Optional policy identifier
- **Statement**: Array of statements (the actual rules)
  - **Sid**: Statement ID (optional, descriptive name)
  - **Effect**: "Allow" or "Deny"
  - **Principal**: Who (only in resource-based policies)
  - **Action**: What operations (e.g., "s3:GetObject")
  - **Resource**: Which resources (ARN)
  - **Condition**: When (optional conditions)

### Policy Variables

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "s3:*",
    "Resource": [
      "arn:aws:s3:::my-bucket/${aws:username}/*"
    ]
  }]
}
```

**Available Variables:**
- `${aws:username}`: IAM user name
- `${aws:userid}`: Unique ID of the principal
- `${aws:PrincipalAccount}`: AWS account ID
- `${aws:SourceIp}`: Source IP address
- `${aws:CurrentTime}`: Current timestamp
- `${aws:SecureTransport}`: true if request used HTTPS

**Example: Home Directory Pattern**

Give each user access to only their own S3 folder:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "s3:ListBucket",
    "Resource": "arn:aws:s3:::shared-bucket",
    "Condition": {
      "StringLike": {
        "s3:prefix": ["${aws:username}/*"]
      }
    }
  }, {
    "Effect": "Allow",
    "Action": "s3:*",
    "Resource": "arn:aws:s3:::shared-bucket/${aws:username}/*"
  }]
}
```

User `alice` can only access `s3://shared-bucket/alice/*`.

### Condition Keys

**Comparison Operators:**

- `StringEquals`, `StringNotEquals`
- `StringLike` (supports wildcards `*` and `?`)
- `NumericEquals`, `NumericLessThan`, `NumericGreaterThan`
- `DateEquals`, `DateLessThan`, `DateGreaterThan`
- `Bool` (true/false)
- `IpAddress`, `NotIpAddress`
- `ArnEquals`, `ArnLike`

**Common Condition Keys:**

```json
{
  "Condition": {
    "StringEquals": {
      "aws:RequestedRegion": ["us-east-1", "eu-west-1"]
    },
    "DateGreaterThan": {
      "aws:CurrentTime": "2024-01-01T00:00:00Z"
    },
    "IpAddress": {
      "aws:SourceIp": ["192.0.2.0/24", "203.0.113.0/24"]
    },
    "Bool": {
      "aws:SecureTransport": "true"
    },
    "StringLike": {
      "s3:prefix": ["documents/*"]
    }
  }
}
```

**MFA Requirement:**

```json
{
  "Effect": "Allow",
  "Action": "ec2:StopInstances",
  "Resource": "*",
  "Condition": {
    "Bool": {
      "aws:MultiFactorAuthPresent": "true"
    },
    "NumericLessThan": {
      "aws:MultiFactorAuthAge": "3600"
    }
  }
}
```

This allows stopping instances only if MFA was used within the last hour.

**Tag-Based Access Control (ABAC):**

```json
{
  "Effect": "Allow",
  "Action": "ec2:*",
  "Resource": "*",
  "Condition": {
    "StringEquals": {
      "ec2:ResourceTag/Owner": "${aws:username}"
    }
  }
}
```

Users can only manage EC2 instances tagged with `Owner=<their-username>`.

---

## Policy Evaluation Logic

### Decision Flow

AWS evaluates policies in this order:

1. **Explicit Deny**: If any policy has Deny, access is denied (cannot be overridden)
2. **Organizations SCPs**: Check if action is allowed by SCPs
3. **Resource-Based Policies**: Check if resource policy allows
4. **Permission Boundaries**: Check if action is within boundary
5. **Identity-Based Policies**: Check if user/role policy allows
6. **Implicit Deny**: If no explicit Allow, deny (default deny)

```
Decision = Explicit Deny? → DENY
           ↓
           SCP Allows? → NO → DENY
           ↓
           Permission Boundary Allows? → NO → DENY
           ↓
           Identity OR Resource Policy Allows? → NO → DENY
           ↓
           ALLOW
```

### Example Scenarios

#### Scenario 1: Identity Policy Allow + Explicit Deny

```json
// Identity policy attached to user
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}

// Inline policy attached to same user
{
  "Effect": "Deny",
  "Action": "s3:DeleteBucket",
  "Resource": "*"
}
```

**Result**: User can do everything with S3 EXCEPT delete buckets (Deny wins).

#### Scenario 2: Cross-Account Access

```json
// Account A: IAM User "alice" has this policy
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::account-b-bucket/*"
}

// Account B: S3 bucket policy
{
  "Effect": "Allow",
  "Principal": {
    "AWS": "arn:aws:iam::AccountA:user/alice"
  },
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::account-b-bucket/*"
}
```

**Result**: ALLOW (both identity policy AND resource policy allow).

#### Scenario 3: Permission Boundary Restriction

```json
// User has AdministratorAccess policy
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}

// Permission boundary restricts to S3 only
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}
```

**Result**: User can only access S3 (boundary acts as filter).

#### Scenario 4: SCP Deny Overrides Everything

```json
// SCP at organization level
{
  "Effect": "Deny",
  "Action": "ec2:*",
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "ec2:Region": "us-east-1"
    }
  }
}

// User has AdministratorAccess
```

**Result**: User cannot launch EC2 in any region except us-east-1, even with AdministratorAccess.

### Policy Simulator

Test policy evaluation without making actual API calls:

```python
# Simulate policy evaluation
response = iam.simulate_principal_policy(
    PolicySourceArn='arn:aws:iam::123456789012:user/alice',
    ActionNames=[
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject'
    ],
    ResourceArns=[
        'arn:aws:s3:::my-bucket/file.txt'
    ]
)

for result in response['EvaluationResults']:
    print(f"Action: {result['EvalActionName']}")
    print(f"Decision: {result['EvalDecision']}")  # allowed, explicitDeny, implicitDeny
    
    if result['EvalDecision'] != 'allowed':
        for statement in result.get('MatchedStatements', []):
            print(f"  Matched: {statement}")
```

---

## Cross-Account Access

### Pattern 1: IAM Role Assumption

**Account A (Trusting Account)** creates a role that **Account B (Trusted Account)** can assume.

**Account A: Create Role**

```python
# Account A (123456789012)
trust_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {
            "AWS": "arn:aws:iam::987654321098:root"  # Account B
        },
        "Action": "sts:AssumeRole",
        "Condition": {
            "StringEquals": {
                "sts:ExternalId": "unique-external-id-12345"  # Prevent confused deputy
            }
        }
    }]
}

iam.create_role(
    RoleName='CrossAccountS3Access',
    AssumeRolePolicyDocument=json.dumps(trust_policy)
)

# Attach permissions
iam.attach_role_policy(
    RoleName='CrossAccountS3Access',
    PolicyArn='arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
)
```

**Account B: Assume Role**

```python
# Account B (987654321098)
sts = boto3.client('sts')

# Assume role in Account A
response = sts.assume_role(
    RoleArn='arn:aws:iam::123456789012:role/CrossAccountS3Access',
    RoleSessionName='alice-session',
    ExternalId='unique-external-id-12345'
)

# Extract temporary credentials
credentials = response['Credentials']

# Use temporary credentials
s3 = boto3.client(
    's3',
    aws_access_key_id=credentials['AccessKeyId'],
    aws_secret_access_key=credentials['SecretAccessKey'],
    aws_session_token=credentials['SessionToken']
)

# Access Account A's S3 buckets
buckets = s3.list_buckets()
print(buckets)
```

**External ID Pattern (Prevent Confused Deputy Problem):**

Without External ID:
```
1. Attacker creates AWS account
2. Attacker finds victim's cross-account role ARN (e.g., through leaked config)
3. Attacker assumes victim's role
4. Attacker accesses victim's resources
```

With External ID:
```
1. Victim generates unique External ID (e.g., UUID)
2. Victim shares External ID only with trusted partner (out-of-band)
3. Cross-account role requires External ID in AssumeRole call
4. Attacker cannot assume role without External ID
```

### Pattern 2: Resource-Based Policy

For S3, SNS, SQS, Lambda—use resource-based policies instead of roles.

**Account A: S3 Bucket Policy**

```python
# Account A allows Account B to read objects
bucket_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {
            "AWS": "arn:aws:iam::987654321098:root"  # Account B
        },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::account-a-bucket/*"
    }]
}

s3.put_bucket_policy(
    Bucket='account-a-bucket',
    Policy=json.dumps(bucket_policy)
)
```

**Account B: Access S3 Bucket**

```python
# Account B user needs identity policy allowing s3:GetObject
# Then can directly access Account A's bucket
s3 = boto3.client('s3')
obj = s3.get_object(Bucket='account-a-bucket', Key='data.csv')
```

**Role Assumption vs Resource Policy:**

| Feature | AssumeRole | Resource Policy |
|---------|-----------|-----------------|
| **Session Duration** | Limited (1-12 hours) | N/A (direct access) |
| **Audit Trail** | Shows assumed role | Shows original principal |
| **Supported Services** | All services | S3, SNS, SQS, Lambda, API Gateway |
| **Use Case** | General cross-account access | Simple resource sharing |

---

## STS and Temporary Credentials

### AWS Security Token Service (STS)

STS provides **temporary security credentials** for:
1. **IAM Role Assumption**: AssumeRole, AssumeRoleWithSAML, AssumeRoleWithWebIdentity
2. **Federation**: GetFederationToken
3. **Temporary Access**: GetSessionToken

### AssumeRole

```python
sts = boto3.client('sts')

response = sts.assume_role(
    RoleArn='arn:aws:iam::123456789012:role/MyRole',
    RoleSessionName='my-session',
    DurationSeconds=3600,  # 1 hour (default), max 12 hours
    ExternalId='optional-external-id',
    Policy=json.dumps({  # Optional: Further restrict permissions
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::specific-bucket/*"
        }]
    })
)

# Response contains temporary credentials
credentials = response['Credentials']
print(f"AccessKeyId: {credentials['AccessKeyId']}")  # Starts with ASIA
print(f"SecretAccessKey: {credentials['SecretAccessKey']}")
print(f"SessionToken: {credentials['SessionToken']}")
print(f"Expiration: {credentials['Expiration']}")
```

### AssumeRoleWithWebIdentity

For mobile/web apps using Cognito, Google, Facebook, etc.:

```python
response = sts.assume_role_with_web_identity(
    RoleArn='arn:aws:iam::123456789012:role/WebIdentityRole',
    RoleSessionName='user-12345',
    WebIdentityToken='eyJraWQiOiJ...',  # From identity provider (Google, etc.)
    DurationSeconds=3600
)

# Mobile app uses temporary credentials
credentials = response['Credentials']
```

**Cognito Identity Pools Pattern:**

```
Mobile App → Cognito Identity Pool → STS AssumeRoleWithWebIdentity → Temporary Credentials
                                                                     ↓
                                                               Access AWS Services (S3, DynamoDB)
```

### GetFederationToken

For granting temporary access to users who don't have AWS identities:

```python
# Called by your application server after authenticating user
response = sts.get_federation_token(
    Name='alice',
    Policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::user-uploads/alice/*"
        }]
    }),
    DurationSeconds=7200  # Max 36 hours
)

# Return credentials to client application
credentials = response['Credentials']
```

### GetSessionToken (MFA)

Retrieve temporary credentials for IAM user (useful for MFA):

```python
response = sts.get_session_token(
    DurationSeconds=3600,
    SerialNumber='arn:aws:iam::123456789012:mfa/alice',  # MFA device ARN
    TokenCode='123456'  # Current MFA code
)

# Use credentials for sensitive operations
credentials = response['Credentials']
```

---

## IAM Best Practices

### 1. Enable MFA for Privileged Users

```python
# Require MFA for sensitive actions
mfa_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Deny",
        "Action": "*",
        "Resource": "*",
        "Condition": {
            "BoolIfExists": {
                "aws:MultiFactorAuthPresent": "false"
            }
        }
    }]
}
```

### 2. Use Roles Instead of Users

**BAD:**
```python
# Hardcoded credentials in application
s3 = boto3.client(
    's3',
    aws_access_key_id='AKIAIOSFODNN7EXAMPLE',
    aws_secret_access_key='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
)
```

**GOOD:**
```python
# EC2/Lambda automatically uses instance/execution role
s3 = boto3.client('s3')
```

### 3. Grant Least Privilege

Start with minimum permissions, add more as needed:

```json
// Start with this
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::specific-bucket/specific-prefix/*"
}

// NOT this
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}
```

### 4. Use Policy Conditions

```json
// Restrict to specific IP range
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*",
  "Condition": {
    "IpAddress": {
      "aws:SourceIp": ["192.0.2.0/24"]
    }
  }
}

// Enforce encryption
{
  "Effect": "Deny",
  "Action": "s3:PutObject",
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "s3:x-amz-server-side-encryption": "AES256"
    }
  }
}
```

### 5. Rotate Credentials Regularly

```python
from datetime import datetime, timedelta

def check_key_age(user_name):
    """Check if access keys are older than 90 days"""
    response = iam.list_access_keys(UserName=user_name)
    
    for key in response['AccessKeyMetadata']:
        age = datetime.now(key['CreateDate'].tzinfo) - key['CreateDate']
        
        if age > timedelta(days=90):
            print(f"WARNING: Key {key['AccessKeyId']} is {age.days} days old")
            print("Please rotate this key")

check_key_age('alice')
```

### 6. Use AWS Managed Policies When Possible

```python
# Good: Use AWS managed policy
iam.attach_user_policy(
    UserName='alice',
    PolicyArn='arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
)

# Better: Create custom managed policy for specific needs
```

### 7. Monitor IAM Activity

```python
# Use CloudTrail to log all IAM actions
cloudtrail = boto3.client('cloudtrail')

response = cloudtrail.lookup_events(
    LookupAttributes=[
        {'AttributeKey': 'EventName', 'AttributeValue': 'AssumeRole'}
    ],
    MaxResults=50
)

for event in response['Events']:
    print(f"Time: {event['EventTime']}")
    print(f"User: {event['Username']}")
    print(f"Event: {event['EventName']}")
```

### 8. Use Permission Boundaries for Delegation

```python
# Allow developers to create IAM roles, but only within boundary
developer_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": [
            "iam:CreateRole",
            "iam:AttachRolePolicy"
        ],
        "Resource": "*",
        "Condition": {
            "StringEquals": {
                "iam:PermissionsBoundary": "arn:aws:iam::123456789012:policy/DeveloperBoundary"
            }
        }
    }]
}
```

---

## LocalStack IAM Examples

### Complete IAM Setup

```python
import boto3
import json

iam = boto3.client('iam', endpoint_url='http://localhost:4566')
s3 = boto3.client('s3', endpoint_url='http://localhost:4566')

# 1. Create IAM users
iam.create_user(UserName='alice')
iam.create_user(UserName='bob')

# 2. Create IAM groups
iam.create_group(GroupName='Developers')
iam.create_group(GroupName='Admins')

# 3. Add users to groups
iam.add_user_to_group(GroupName='Developers', UserName='alice')
iam.add_user_to_group(GroupName='Admins', UserName='bob')

# 4. Create custom policy
developer_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:ListBucket"
        ],
        "Resource": [
            "arn:aws:s3:::dev-bucket",
            "arn:aws:s3:::dev-bucket/*"
        ]
    }]
}

policy_response = iam.create_policy(
    PolicyName='DeveloperS3Policy',
    PolicyDocument=json.dumps(developer_policy)
)

# 5. Attach policy to group
iam.attach_group_policy(
    GroupName='Developers',
    PolicyArn=policy_response['Policy']['Arn']
)

# 6. Attach admin policy to Admins group
iam.attach_group_policy(
    GroupName='Admins',
    PolicyArn='arn:aws:iam::aws:policy/AdministratorAccess'
)

# 7. Create access keys for users
alice_keys = iam.create_access_key(UserName='alice')
print(f"Alice Access Key: {alice_keys['AccessKey']['AccessKeyId']}")
print(f"Alice Secret Key: {alice_keys['AccessKey']['SecretAccessKey']}")

# 8. Create S3 bucket
s3.create_bucket(Bucket='dev-bucket')

# 9. Test access as alice
alice_s3 = boto3.client(
    's3',
    endpoint_url='http://localhost:4566',
    aws_access_key_id=alice_keys['AccessKey']['AccessKeyId'],
    aws_secret_access_key=alice_keys['AccessKey']['SecretAccessKey']
)

# Alice can access dev-bucket
alice_s3.put_object(Bucket='dev-bucket', Key='test.txt', Body=b'Hello')
print("Alice successfully wrote to dev-bucket")

# Alice cannot create new buckets (not in policy)
try:
    alice_s3.create_bucket(Bucket='unauthorized-bucket')
except Exception as e:
    print(f"Alice cannot create bucket: {e}")
```

### Role-Based Access (Go Example)

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/sts"
)

func main() {
	ctx := context.Background()

	// Configure LocalStack endpoint
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithEndpointResolverWithOptions(aws.EndpointResolverWithOptionsFunc(
			func(service, region string, options ...interface{}) (aws.Endpoint, error) {
				return aws.Endpoint{URL: "http://localhost:4566"}, nil
			})),
	)
	if err != nil {
		log.Fatal(err)
	}

	iamClient := iam.NewFromConfig(cfg)
	stsClient := sts.NewFromConfig(cfg)

	// Create role
	trustPolicy := map[string]interface{}{
		"Version": "2012-10-17",
		"Statement": []map[string]interface{}{{
			"Effect": "Allow",
			"Principal": map[string]interface{}{
				"AWS": "arn:aws:iam::123456789012:root",
			},
			"Action": "sts:AssumeRole",
		}},
	}

	trustPolicyJSON, _ := json.Marshal(trustPolicy)

	_, err = iamClient.CreateRole(ctx, &iam.CreateRoleInput{
		RoleName:                 aws.String("S3ReadOnlyRole"),
		AssumeRolePolicyDocument: aws.String(string(trustPolicyJSON)),
	})
	if err != nil {
		log.Printf("Create role error (may already exist): %v", err)
	}

	// Attach policy
	_, err = iamClient.AttachRolePolicy(ctx, &iam.AttachRolePolicyInput{
		RoleName:  aws.String("S3ReadOnlyRole"),
		PolicyArn: aws.String("arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"),
	})
	if err != nil {
		log.Printf("Attach policy error: %v", err)
	}

	// Assume role
	assumeResp, err := stsClient.AssumeRole(ctx, &sts.AssumeRoleInput{
		RoleArn:         aws.String("arn:aws:iam::123456789012:role/S3ReadOnlyRole"),
		RoleSessionName: aws.String("test-session"),
		DurationSeconds: aws.Int32(3600),
	})
	if err != nil {
		log.Fatal(err)
	}

	creds := assumeResp.Credentials
	fmt.Printf("Temporary credentials:\n")
	fmt.Printf("AccessKeyId: %s\n", *creds.AccessKeyId)
	fmt.Printf("SecretAccessKey: %s\n", *creds.SecretAccessKey)
	fmt.Printf("SessionToken: %s\n", *creds.SessionToken)
	fmt.Printf("Expiration: %v\n", *creds.Expiration)
}
```

---

## Production Patterns

### Pattern 1: Multi-Account Organization

```
Organization Root
├─ Management Account (billing, organization management)
├─ Security Account (CloudTrail, GuardDuty, Security Hub)
├─ Shared Services Account (AD, DNS, monitoring)
├─ Development Account (dev workloads)
├─ Staging Account (pre-production)
└─ Production Account (production workloads)
```

**Cross-Account Access:**

```
Security Team in Security Account
    ↓ AssumeRole
Production Read-Only Role in Production Account
    ↓
Access CloudTrail, GuardDuty findings
```

### Pattern 2: Break-Glass Access

Emergency access when normal auth systems fail:

```json
// Break-glass role with full admin access
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::123456789012:root"
    },
    "Action": "sts:AssumeRole",
    "Condition": {
      "Bool": {
        "aws:MultiFactorAuthPresent": "true"
      },
      "IpAddress": {
        "aws:SourceIp": ["203.0.113.0/24"]  // Corporate network only
      }
    }
  }]
}
```

**Monitoring:**

```python
# CloudWatch alarm for break-glass role usage
cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_alarm(
    AlarmName='BreakGlassRoleAssumed',
    MetricName='AssumeRole',
    Namespace='IAM',
    Statistic='Sum',
    Period=60,
    EvaluationPeriods=1,
    Threshold=0,
    ComparisonOperator='GreaterThanThreshold',
    AlarmActions=['arn:aws:sns:us-east-1:123456789012:security-alerts'],
    Dimensions=[
        {'Name': 'RoleName', 'Value': 'BreakGlassRole'}
    ]
)
```

### Pattern 3: Service-to-Service Authentication

```
Lambda Function (in Account A)
    ↓
Assumes role in Account B
    ↓
Accesses DynamoDB table in Account B
```

**Account B: Create Role**

```python
trust_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {
            "Service": "lambda.amazonaws.com",
            "AWS": "arn:aws:iam::AccountA:root"
        },
        "Action": "sts:AssumeRole"
    }]
}

iam.create_role(
    RoleName='CrossAccountDynamoDBAccess',
    AssumeRolePolicyDocument=json.dumps(trust_policy)
)

iam.attach_role_policy(
    RoleName='CrossAccountDynamoDBAccess',
    PolicyArn='arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess'
)
```

**Account A: Lambda Function**

```python
def lambda_handler(event, context):
    sts = boto3.client('sts')
    
    # Assume role in Account B
    response = sts.assume_role(
        RoleArn='arn:aws:iam::AccountB:role/CrossAccountDynamoDBAccess',
        RoleSessionName='lambda-session'
    )
    
    # Create DynamoDB client with temporary credentials
    dynamodb = boto3.client(
        'dynamodb',
        aws_access_key_id=response['Credentials']['AccessKeyId'],
        aws_secret_access_key=response['Credentials']['SecretAccessKey'],
        aws_session_token=response['Credentials']['SessionToken']
    )
    
    # Access Account B's DynamoDB
    result = dynamodb.scan(TableName='shared-table')
    return result
```

---

## Interview Questions

### Q1: Explain the difference between IAM Users, Groups, and Roles

**Answer:**

| Feature | User | Group | Role |
|---------|------|-------|------|
| **Identity** | Individual person or application | Collection of users | Assumed by anyone/anything |
| **Credentials** | Long-term (password, access keys) | N/A (groups don't have credentials) | Temporary (from STS) |
| **Use Case** | Permanent identity | Organize users | Temporary access, cross-account, services |
| **Policy Attachment** | Direct or via group | Direct | Direct |
| **Trust Policy** | No | No | Yes (who can assume) |

**When to Use:**

- **User**: Human administrator, CI/CD system with long-lived credentials
- **Group**: Organize users by department (Developers, DBAs, Admins)
- **Role**: EC2 instances, Lambda functions, cross-account access, federated users

**Example:**

```
Alice (User) → Member of "Developers" (Group) → Has S3 read access
EC2 Instance → Assumes "EC2-S3-Role" (Role) → Has S3 write access (no long-term credentials)
```

---

### Q2: How does AWS evaluate multiple policies on the same principal?

**Answer:**

AWS uses a **default-deny** model with this evaluation logic:

1. **Explicit Deny**: Check all policies for explicit Deny
   - If found → **DENY** (cannot be overridden)
2. **Organizations SCP**: Check if action is allowed by SCP
   - If not allowed → **DENY**
3. **Permission Boundary**: Check if action is within boundary
   - If not allowed → **DENY**
4. **Explicit Allow**: Check for any policy with explicit Allow
   - If found in identity-based OR resource-based policy → **ALLOW**
5. **Implicit Deny**: No explicit Allow found
   - → **DENY**

**Example:**

```
Policy 1 (Identity-based): Allow s3:*
Policy 2 (Identity-based): Deny s3:DeleteBucket
Permission Boundary: Allow s3:*, dynamodb:*
SCP: Allow *

Action: s3:GetObject → ALLOW (no deny, within boundary, explicit allow)
Action: s3:DeleteBucket → DENY (explicit deny in Policy 2)
Action: ec2:RunInstances → DENY (not in permission boundary)
```

**Key Principle:** Deny always wins, and absence of Allow means Deny.

---

### Q3: Design a multi-account AWS architecture for a SaaS company with separate dev, staging, and production environments

**Answer:**

**Architecture:**

```
AWS Organization
├─ Management Account (root, billing consolidation)
├─ Security Account (CloudTrail, GuardDuty, audit logs)
├─ Shared Services Account (CI/CD, container registry, monitoring)
├─ Development Account (dev workloads)
├─ Staging Account (pre-prod testing)
└─ Production Account (customer-facing services)
```

**IAM Strategy:**

1. **Organization SCPs:**

```json
// Prevent users from leaving organization
{
  "Effect": "Deny",
  "Action": "organizations:LeaveOrganization",
  "Resource": "*"
}

// Enforce encryption on S3
{
  "Effect": "Deny",
  "Action": "s3:PutObject",
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "s3:x-amz-server-side-encryption": ["AES256", "aws:kms"]
    }
  }
}

// Restrict to specific regions
{
  "Effect": "Deny",
  "Action": "*",
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "aws:RequestedRegion": ["us-east-1", "eu-west-1"]
    }
  }
}
```

2. **Cross-Account Roles:**

```
Developers → AssumeRole → "DeveloperAccess" in Development Account (full access)
                       → "ReadOnlyAccess" in Staging Account (read-only)
                       → "ReadOnlyAccess" in Production Account (read-only)

DevOps → AssumeRole → "DeploymentRole" in all accounts (via CI/CD)

Security Team → AssumeRole → "SecurityAuditor" in all accounts (read-only audit)

Break-Glass → AssumeRole → "EmergencyAdmin" in Production (MFA required, alerts SNS)
```

3. **Service Roles:**

```
CI/CD Pipeline in Shared Services Account
    ↓ AssumeRole
Deployment Role in Production Account
    ↓
Deploy to ECS, update Lambda functions
```

4. **Centralized Logging:**

```
All Accounts → CloudTrail → S3 bucket in Security Account (read-only for accounts)
              GuardDuty → Security Hub in Security Account
```

**Benefits:**
- **Blast radius containment**: Breach in dev doesn't affect prod
- **Cost allocation**: Separate billing per environment
- **Compliance**: Audit-only access to production
- **Least privilege**: Developers can't accidentally modify production

**Access Pattern:**

```bash
# Developer accessing production (read-only)
aws sts assume-role \
  --role-arn arn:aws:iam::PROD_ACCOUNT:role/ReadOnlyAccess \
  --role-session-name alice-prod-access \
  --duration-seconds 3600

# Export credentials
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...

# Now can read (but not write) production resources
aws s3 ls
aws ec2 describe-instances
```

---

### Q4: How would you implement least privilege for a Lambda function that needs to read from S3 and write to DynamoDB?

**Answer:**

**Step 1: Identify Exact Permissions Needed**

```python
# Lambda function needs:
# 1. s3:GetObject on specific bucket/prefix
# 2. dynamodb:PutItem on specific table
# 3. CloudWatch Logs for debugging
```

**Step 2: Create Execution Role**

```python
# Trust policy (who can assume this role)
trust_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
}

iam.create_role(
    RoleName='LambdaS3ToDynamoDBRole',
    AssumeRolePolicyDocument=json.dumps(trust_policy)
)
```

**Step 3: Create Least-Privilege Policy**

```python
# Custom policy with ONLY required permissions
policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3ReadSpecificBucket",
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::my-data-bucket/input/*"  # Specific prefix only
        },
        {
            "Sid": "DynamoDBWriteSpecificTable",
            "Effect": "Allow",
            "Action": "dynamodb:PutItem",
            "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/MyTable"  # Specific table
        },
        {
            "Sid": "CloudWatchLogsForDebugging",
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/my-function:*"
        }
    ]
}

response = iam.create_policy(
    PolicyName='LambdaS3ToDynamoDBPolicy',
    PolicyDocument=json.dumps(policy)
)

# Attach policy to role
iam.attach_role_policy(
    RoleName='LambdaS3ToDynamoDBRole',
    PolicyArn=response['Policy']['Arn']
)
```

**Step 4: Further Restrictions with Conditions**

```python
# Add condition to restrict by time (office hours only)
policy_with_conditions = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": "dynamodb:PutItem",
        "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/MyTable",
        "Condition": {
            "DateGreaterThan": {"aws:CurrentTime": "2024-01-01T00:00:00Z"},
            "DateLessThan": {"aws:CurrentTime": "2024-12-31T23:59:59Z"}
        }
    }]
}
```

**What to AVOID:**

```python
# BAD: Too permissive
{
    "Effect": "Allow",
    "Action": "s3:*",  # All S3 actions
    "Resource": "*"    # All buckets
}

# BAD: Using managed policies when custom is better
PolicyArn='arn:aws:iam::aws:policy/AmazonS3FullAccess'  # Way too broad
```

**Monitoring:**

```python
# Enable CloudTrail to log all actions
# Review IAM Access Analyzer to identify over-permissive policies

# Example: Find unused permissions
access_analyzer = boto3.client('accessanalyzer')

response = access_analyzer.list_findings(
    analyzerArn='arn:aws:access-analyzer:us-east-1:123456789012:analyzer/MyAnalyzer',
    filter={'resourceType': {'eq': ['AWS::IAM::Role']}}
)

for finding in response['findings']:
    print(f"Unused permission: {finding['action']}")
```

---

### Q5: Explain the "Confused Deputy Problem" and how to prevent it using External ID

**Answer:**

**The Problem:**

The Confused Deputy Problem occurs when an attacker tricks a trusted service (the "deputy") into accessing resources on behalf of the attacker.

**Scenario:**

```
1. SaaS Company (Victim) creates cross-account role for Partner Service:
   Trust Policy: Allow Partner Service AWS Account to AssumeRole

2. Attacker signs up for Partner Service with their own AWS account

3. Attacker discovers Victim's role ARN (via leaked config, source code, etc.)

4. Attacker configures Partner Service to assume Victim's role

5. Partner Service (confused deputy) assumes Victim's role thinking it's for Victim

6. Attacker now has access to Victim's AWS resources through Partner Service
```

**Visual:**

```
Victim AWS Account (123456789012)
├─ Role: "PartnerAccessRole"
   Trust Policy: Allow Partner AWS Account (999999999999)

Attacker AWS Account (888888888888)
    ↓ Signs up for Partner Service
Partner Service (AWS Account 999999999999)
    ↓ Assumes role on behalf of "customer"
    ↓ (Attacker provides Victim's role ARN)
Victim's Role "PartnerAccessRole"
    ↓ Access Granted!
Victim's S3 Buckets, DynamoDB, etc.
```

**Solution: External ID**

An **External ID** is a secret shared between the customer (victim) and the partner service through an out-of-band channel (not AWS).

**Implementation:**

```python
# Step 1: Victim generates unique External ID
import uuid
external_id = str(uuid.uuid4())  # e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

# Step 2: Victim shares External ID with Partner Service (via Partner's web UI)
# Partner Service stores: Victim Account ID → External ID mapping

# Step 3: Victim creates role with External ID requirement
trust_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {
            "AWS": "arn:aws:iam::999999999999:root"  # Partner Service account
        },
        "Action": "sts:AssumeRole",
        "Condition": {
            "StringEquals": {
                "sts:ExternalId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # Unique to Victim
            }
        }
    }]
}

# Step 4: Partner Service assumes role with External ID
sts = boto3.client('sts')
response = sts.assume_role(
    RoleArn='arn:aws:iam::123456789012:role/PartnerAccessRole',
    RoleSessionName='partner-session',
    ExternalId='a1b2c3d4-e5f6-7890-abcd-ef1234567890'  # Must match
)
```

**Why This Prevents Attack:**

```
Attacker discovers Victim's role ARN: "arn:aws:iam::123456789012:role/PartnerAccessRole"
Attacker provides role ARN to Partner Service
Partner Service attempts: AssumeRole with Attacker's External ID (different from Victim's)
AWS denies: External ID mismatch
Attack prevented!
```

**Best Practices:**

1. **Generate unique External ID per customer** (UUID)
2. **Share External ID through secure channel** (not in API responses, logs)
3. **Store External ID securely** on both customer and partner side
4. **Rotate External ID periodically** if high security required
5. **Validate External ID** in partner service before AssumeRole

**Real-World Example:**

```
Company uses third-party analytics service (e.g., Datadog, Snowflake)
    ↓
Company creates IAM role for analytics service
    ↓
Company generates External ID: "f7a2c4e9-b1d3-..."
    ↓
Company enters External ID in analytics service web UI
    ↓
Analytics service stores External ID in their database
    ↓
Analytics service uses External ID when calling AssumeRole
    ↓
AWS validates External ID matches what's in trust policy
    ↓
Access granted (with protection against confused deputy)
```

---

## Summary

**AWS IAM** is the foundation of security in AWS, providing centralized identity and access management with fine-grained control over who can do what to which resources.

**Key Takeaways:**

1. **Never use root user** for daily tasks; create IAM users instead
2. **Use IAM roles** instead of embedding credentials in applications
3. **Grant least privilege**: Start with minimal permissions, add more as needed
4. **Enable MFA** for privileged accounts
5. **Policy evaluation**: Explicit Deny > SCP > Permission Boundary > Explicit Allow > Implicit Deny
6. **Cross-account access**: Use AssumeRole with External ID for third-party services
7. **Temporary credentials** via STS for enhanced security
8. **Rotate credentials** regularly (90-day maximum)
9. **Use AWS managed policies** when appropriate, custom policies when specific control needed
10. **Monitor IAM activity** with CloudTrail and IAM Access Analyzer

**Production Patterns:**

- **Multi-account organization** with SCPs for centralized governance
- **Cross-account roles** for service-to-service authentication
- **Break-glass access** with MFA and monitoring
- **Permission boundaries** for delegated administration
- **Tag-based access control (ABAC)** for dynamic permissions

IAM is critical for FAANG interviews—expect deep questions on policy evaluation logic, cross-account access patterns, and least-privilege design.

