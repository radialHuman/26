# AWS Identity and Access Management (IAM)

## What is IAM?

AWS Identity and Access Management (IAM) is a web service that helps you securely control access to AWS resources. It enables you to manage authentication (who) and authorization (what they can do) for AWS services.

## Why Use IAM?

### Key Benefits
- **Fine-Grained Access Control**: Precise permissions for users and services
- **Multi-Factor Authentication**: Additional security layer
- **Identity Federation**: Integrate with corporate directories
- **Free**: No additional charge for IAM
- **Temporary Credentials**: Secure, time-limited access
- **Centralized Control**: Manage all access from one place
- **Compliance**: Meet regulatory requirements

### Use Cases
- User access management
- Application permissions (EC2, Lambda)
- Cross-account access
- Federated access (SSO)
- Service-to-service authentication
- Temporary access grants
- Compliance and auditing

## Core Components

### Users

**What**: Represents a person or application

**Characteristics**:
- Permanent credentials (access keys, passwords)
- Direct assignment of permissions
- Individual identity

**Best Practices**:
- One user per person (no sharing)
- Enable MFA for privileged users
- Rotate access keys regularly
- Use roles instead of user keys for applications

**Example**:
```
User: alice@company.com
Permissions: AdministratorAccess policy
MFA: Enabled
Access keys: AKIAIOSFODNN7EXAMPLE (active)
Password: Enabled (last changed: 30 days ago)
```

**Creating User**:
```bash
aws iam create-user --user-name alice

# Attach policy
aws iam attach-user-policy \
  --user-name alice \
  --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess

# Create access key
aws iam create-access-key --user-name alice
```

### Groups

**What**: Collection of users with shared permissions

**Benefits**:
- Simplified permission management
- Consistent access control
- Easier onboarding/offboarding

**Example**:
```
Group: Developers
Members: alice, bob, charlie
Policies: 
  - AmazonEC2FullAccess
  - AmazonS3ReadOnlyAccess
  - Custom-DynamoDB-Dev-Policy

When alice joins Developers group:
  - Inherits all group permissions
  - Individual permissions also apply (cumulative)
```

**Best Practices**:
```
Groups by job function:
  - Developers
  - Administrators
  - Auditors
  - DataScientists

Avoid:
  - Individual user permissions (use groups)
  - Nested groups (not supported)
```

### Roles

**What**: Set of permissions that can be assumed temporarily

**Key Difference from Users**:
- No permanent credentials
- Temporary security credentials
- Can be assumed by anyone/anything with permission

**Use Cases**:

**1. EC2 Instance Role**:
```
EC2 Instance → Assumes Role → Access S3

No access keys needed on instance
Credentials auto-rotated
Secure
```

**2. Cross-Account Access**:
```
Account A (Production) → Role → Account B (Audit)
Auditors in Account B assume role to access Account A
```

**3. Federated Access**:
```
Corporate AD User → SAML → Assume Role → AWS Access
No AWS user needed
```

**4. Service-to-Service**:
```
Lambda Function → Assumes Role → Access DynamoDB
```

**Example** (EC2 Instance Role):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

**Trust Policy** (Who can assume):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### Policies

**What**: JSON documents defining permissions

**Types**:

**1. Identity-Based Policies**:
- Attached to users, groups, or roles
- Define what identity can do

**2. Resource-Based Policies**:
- Attached to resources (S3, SQS, KMS)
- Define who can access resource

**3. Permission Boundaries**:
- Maximum permissions an identity can have
- Does not grant permissions (only limits)

**4. Service Control Policies (SCPs)**:
- AWS Organizations
- Maximum permissions for accounts

**5. Session Policies**:
- Temporary restrictions when assuming role

**Policy Structure**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ReadAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": "203.0.113.0/24"
        }
      }
    }
  ]
}
```

**Elements**:
- **Version**: Policy language version (always "2012-10-17")
- **Statement**: Array of permissions
- **Sid**: Statement ID (optional, descriptive)
- **Effect**: Allow or Deny
- **Action**: API actions (e.g., s3:GetObject)
- **Resource**: ARN of resource
- **Condition**: Optional constraints

## Policy Evaluation Logic

### Explicit Deny Always Wins

**Decision Flow**:
```
1. By default: Deny (implicit deny)
2. Evaluate all applicable policies
3. If any Explicit Deny: DENY (stop)
4. If any Allow (no deny): ALLOW
5. Otherwise: DENY (implicit deny)
```

**Example**:
```json
Policy 1 (Allow S3):
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}

Policy 2 (Deny DeleteBucket):
{
  "Effect": "Deny",
  "Action": "s3:DeleteBucket",
  "Resource": "*"
}

Result:
  - s3:GetObject → ALLOW (Policy 1)
  - s3:PutObject → ALLOW (Policy 1)
  - s3:DeleteBucket → DENY (Policy 2 explicit deny wins)
```

### Permission Boundaries

**What**: Maximum permissions (does not grant)

**Example**:
```
User Policy (Grants):
  - s3:*
  - dynamodb:*
  - ec2:*

Permission Boundary (Limits):
  - s3:*
  - dynamodb:*

Effective Permissions (Intersection):
  - s3:*
  - dynamodb:*
  - ec2:* → DENIED (not in boundary)
```

**Use Case**:
```
Developers can create roles, but permission boundary ensures:
  - Created roles cannot have more permissions than boundary
  - Prevents privilege escalation
```

### Cross-Account Access

**Scenario**: Account A wants to access Account B

**Requirements**:
1. **Account B**: Role with trust policy allowing Account A
2. **Account A**: User/role with permission to assume role in Account B

**Account B Role** (Trust Policy):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT-A-ID:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "unique-external-id-12345"
        }
      }
    }
  ]
}
```

**Account A User Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::ACCOUNT-B-ID:role/CrossAccountRole"
    }
  ]
}
```

**Assuming Role**:
```bash
aws sts assume-role \
  --role-arn arn:aws:iam::ACCOUNT-B-ID:role/CrossAccountRole \
  --role-session-name my-session \
  --external-id unique-external-id-12345
```

**Returns**:
```json
{
  "Credentials": {
    "AccessKeyId": "ASIAIOSFODNN7EXAMPLE",
    "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "SessionToken": "FQoGZXIvYXdzEBEaDG...",
    "Expiration": "2026-01-31T12:00:00Z"
  }
}
```

## Multi-Factor Authentication (MFA)

### Types

**1. Virtual MFA Device**:
- Google Authenticator, Authy, etc.
- Free
- Time-based one-time password (TOTP)

**2. Hardware MFA Device**:
- Gemalto, YubiKey
- Physical token
- Cost: $10-50

**3. U2F Security Key**:
- YubiKey
- USB device
- Most secure

### Enforcing MFA

**Policy Requiring MFA**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAllWithMFA",
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "Bool": {
          "aws:MultiFactorAuthPresent": "true"
        }
      }
    },
    {
      "Sid": "DenyAllWithoutMFA",
      "Effect": "Deny",
      "NotAction": [
        "iam:CreateVirtualMFADevice",
        "iam:EnableMFADevice",
        "iam:GetUser",
        "iam:ListMFADevices",
        "iam:ListVirtualMFADevices",
        "iam:ResyncMFADevice",
        "sts:GetSessionToken"
      ],
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
```

**Result**:
- Without MFA: Can only enable MFA, nothing else
- With MFA: Full access

### MFA for Sensitive Operations

**Example** (Require MFA to delete S3 objects):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Action": "s3:DeleteObject",
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
```

## Identity Federation

### SAML 2.0 Federation

**What**: Integrate corporate identity provider (AD, Okta, Azure AD)

**Flow**:
```
1. User authenticates with corporate IdP (e.g., AD FS)
2. IdP returns SAML assertion
3. User exchanges SAML assertion for temporary AWS credentials (STS)
4. User accesses AWS with temporary credentials
```

**Example** (Active Directory Federation):
```
Corporate User → AD FS → SAML Assertion → AWS STS → Temporary Credentials
  ↓
Access AWS Console or APIs
```

**Benefits**:
- No AWS users needed
- Centralized user management
- SSO experience
- MFA enforced by IdP

**Configuration**:
```
1. Create IAM SAML provider
   - Upload IdP metadata XML

2. Create IAM role for federated users
   - Trust policy: SAML provider
   - Permissions: What users can do

3. Configure IdP
   - Add AWS as relying party
   - Map user attributes to IAM roles
```

### Web Identity Federation

**What**: Login with Amazon, Google, Facebook

**Use Case**: Mobile/web apps

**Flow**:
```
1. User logs in with Google
2. Google returns JWT token
3. App exchanges token for AWS credentials (using Cognito)
4. App accesses AWS resources
```

**AWS Cognito**:
- Preferred method for web identity federation
- User pools (authentication)
- Identity pools (authorization, temporary AWS credentials)
- Supports social and enterprise identity providers

**Example**:
```
Mobile App → Google Login → JWT Token → Cognito Identity Pool → Temporary AWS Credentials
  ↓
Access S3, DynamoDB, etc.
```

### AWS Single Sign-On (SSO)

**What**: Centralized access management for multiple AWS accounts

**Features**:
- Single sign-on to AWS accounts
- Integration with Microsoft AD, Okta, Azure AD
- Manage access to business applications
- Centralized user portal

**Example**:
```
User → AWS SSO Portal → Choose Account/Role → Access AWS Console

SSO manages:
  - Account-A: Admin role
  - Account-B: ReadOnly role
  - Account-C: Developer role
```

**Benefits**:
- Simplifies multi-account access
- No need to switch between accounts manually
- Audit trail of access

## Security Token Service (STS)

### What is STS?

**Purpose**: Generate temporary, limited-privilege credentials

**Use Cases**:
- Federated users
- Cross-account access
- IAM role assumption
- Temporary access grants

### STS Operations

**AssumeRole**:
```bash
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/MyRole \
  --role-session-name session1

Returns:
  - AccessKeyId
  - SecretAccessKey
  - SessionToken
  - Expiration (15 min - 12 hours, default 1 hour)
```

**AssumeRoleWithSAML**:
- For SAML federation
- Exchange SAML assertion for credentials

**AssumeRoleWithWebIdentity**:
- For web identity federation (use Cognito instead)

**GetSessionToken**:
```bash
aws sts get-session-token --duration-seconds 3600

Use case: MFA-protected operations
Returns temporary credentials valid for 1 hour (max 36 hours for IAM users)
```

**GetFederationToken**:
- For custom federation broker
- Rarely used (use AssumeRole instead)

### Session Duration

**IAM User** (GetSessionToken):
- Min: 900 seconds (15 minutes)
- Max: 129,600 seconds (36 hours)
- Default: 43,200 seconds (12 hours)

**IAM Role** (AssumeRole):
- Min: 900 seconds (15 minutes)
- Max: 43,200 seconds (12 hours) or role's MaxSessionDuration
- Default: 3,600 seconds (1 hour)

**Chained Roles**:
- Role A assumes Role B
- Max duration: 1 hour (cannot be extended)

## IAM Best Practices

### 1. Root Account

**Actions**:
- ✅ Enable MFA
- ✅ Delete access keys
- ✅ Use only for account-level tasks
- ❌ Never use for daily tasks

**Root-Only Tasks**:
- Change account settings
- Close account
- Restore IAM user permissions
- Change AWS Support plan
- Register for GovCloud

### 2. Principle of Least Privilege

**Grant minimum permissions required**:

```json
❌ Bad:
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}

✅ Good:
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject"
  ],
  "Resource": "arn:aws:s3:::my-app-bucket/*"
}
```

### 3. Use Roles for Applications

**Instead of**:
```
EC2 Instance with access keys (bad, insecure)
```

**Use**:
```
EC2 Instance with IAM role (good, secure, auto-rotated)
```

### 4. Enable CloudTrail

**Monitor all IAM actions**:
```
CloudTrail logs:
  - Who: alice
  - What: iam:CreateUser
  - When: 2026-01-31 10:30:00
  - Where: 203.0.113.5
  - Result: Success
```

### 5. Rotate Credentials

**Access Keys**:
- Rotate every 90 days
- Use AWS Secrets Manager for automation

**Passwords**:
- Password policy: complexity requirements
- Rotation: 90 days
- MFA: Required for privileged users

### 6. Use Groups

**Instead of**:
```
Attach policy to each user individually (maintenance nightmare)
```

**Use**:
```
Create groups by job function, add users to groups
```

### 7. Enable IAM Access Analyzer

**What**: Identifies resources shared with external entities

**Example**:
```
S3 bucket policy allows public access → Access Analyzer alerts

SNS topic allows Account B to subscribe → Access Analyzer reports
```

### 8. Use Permission Boundaries

**Delegate permission management securely**:
```
Developers can create roles, but:
  - Permission boundary limits max permissions
  - Cannot escalate privileges
```

### 9. Monitor with AWS Config

**Track IAM configuration changes**:
```
Config Rule: iam-user-mfa-enabled
  - Checks if all users have MFA
  - Non-compliant → Alert

Config Rule: iam-password-policy
  - Checks password policy requirements
  - Non-compliant → Alert
```

### 10. Centralize with AWS Organizations

**Multi-account management**:
```
Organizations → SCPs (Service Control Policies)
  - Enforce guardrails across all accounts
  - Example: Deny all non-MFA actions
  - Example: Restrict regions (only us-east-1, eu-west-1)
```

## IAM Policy Examples

### Example 1: Restrict by IP

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "NotIpAddress": {
          "aws:SourceIp": [
            "203.0.113.0/24",
            "198.51.100.0/24"
          ]
        },
        "Bool": {
          "aws:ViaAWSService": "false"
        }
      }
    }
  ]
}
```
Users can only access from specified IPs (except AWS service calls)

### Example 2: Restrict by Time

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "DateGreaterThan": {
          "aws:CurrentTime": "2026-01-31T09:00:00Z"
        },
        "DateLessThan": {
          "aws:CurrentTime": "2026-01-31T17:00:00Z"
        }
      }
    }
  ]
}
```
Access only during business hours (9 AM - 5 PM UTC)

### Example 3: Restrict by MFA Age

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "NumericLessThan": {
          "aws:MultiFactorAuthAge": "3600"
        }
      }
    }
  ]
}
```
MFA must be used within last hour

### Example 4: Tag-Based Access

```json
{
  "Version": "2012-10-17",
  "Statement": [
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
  ]
}
```
Users can only manage EC2 instances they own (matching tag)

### Example 5: Prevent Privilege Escalation

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
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
    }
  ]
}
```
Developers can create roles, but must attach permission boundary

## Real-World Scenarios

### Scenario 1: Multi-Account Setup

**Requirements**:
- Production, staging, development accounts
- Centralized user management
- Cross-account access for ops team

**Solution**:
```
AWS Organization:
  - Master Account (user management)
  - Production Account
  - Staging Account
  - Development Account

IAM Roles in Each Account:
  Production:
    - AdminRole (trust: master account, OpsTeam)
    - ReadOnlyRole (trust: master account, Developers)
  
  Staging:
    - DeveloperRole (trust: master account, Developers)
  
  Development:
    - DeveloperRole (trust: master account, Developers)

Users in Master Account:
  - ops-alice: Can assume AdminRole in all accounts
  - dev-bob: Can assume ReadOnlyRole (prod), DeveloperRole (staging, dev)

Cross-Account Access:
  aws sts assume-role \
    --role-arn arn:aws:iam::PROD-ACCOUNT:role/ReadOnlyRole \
    --role-session-name dev-bob-session
```

### Scenario 2: Federated Access (Corporate AD)

**Requirements**:
- 1000+ employees
- Corporate Active Directory
- SSO to AWS Console
- No AWS users

**Solution**:
```
1. AWS Single Sign-On (SSO):
   - Connect to corporate AD (AWS Managed Microsoft AD or AD Connector)
   - Define permission sets (Admin, PowerUser, ReadOnly)
   - Assign users/groups to AWS accounts with permission sets

2. User Login Flow:
   alice@company.com → AWS SSO Portal → Choose Account/Role → AWS Console

3. Permission Sets:
   AdminSet: AdministratorAccess
   DeveloperSet: Custom developer policy
   ReadOnlySet: ViewOnlyAccess

4. Assignment:
   Account-A:
     - AD Group "Admins" → AdminSet
     - AD Group "Developers" → DeveloperSet
   
   Account-B:
     - AD Group "Developers" → DeveloperSet
     - AD Group "Auditors" → ReadOnlySet
```

### Scenario 3: Secure Application Access

**Requirements**:
- Lambda function needs S3 and DynamoDB access
- Least privilege
- No hardcoded credentials

**Solution**:
```
IAM Role: LambdaExecutionRole

Trust Policy:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}

Permissions Policy:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::my-app-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/MyTable"
    }
  ]
}

Lambda Configuration:
  - Execution role: LambdaExecutionRole
  - No access keys in code
  - Credentials auto-managed by AWS
```

### Scenario 4: Third-Party Access (External Auditor)

**Requirements**:
- External auditor needs read-only access
- Time-limited (30 days)
- Auditable

**Solution**:
```
IAM Role: ExternalAuditorRole

Trust Policy with External ID:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::AUDITOR-ACCOUNT:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "unique-external-id-12345"
        },
        "DateLessThan": {
          "aws:CurrentTime": "2026-02-28T23:59:59Z"
        }
      }
    }
  ]
}

Permissions:
  - ReadOnlyAccess managed policy
  - Additional: CloudTrail read access for audit logs

Auditor Access:
  aws sts assume-role \
    --role-arn arn:aws:iam::YOUR-ACCOUNT:role/ExternalAuditorRole \
    --role-session-name auditor-session \
    --external-id unique-external-id-12345

After Feb 28, 2026:
  - Role cannot be assumed (date condition fails)
  - Audit complete, access automatically revoked
```

### Scenario 5: Temporary Contractor Access

**Requirements**:
- Contractor needs EC2 and RDS access for 90 days
- Must use MFA
- Access from specific IP only

**Solution**:
```
IAM User: contractor-john
Password: Enabled (must change on first login)
MFA: Required

Policy:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "rds:Describe*"
      ],
      "Resource": "*",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": "203.0.113.0/24"
        },
        "Bool": {
          "aws:MultiFactorAuthPresent": "true"
        },
        "DateLessThan": {
          "aws:CurrentTime": "2026-04-30T23:59:59Z"
        }
      }
    }
  ]
}

After 90 days:
  - Automatically disabled (date condition)
  - Or: Use AWS Config to detect and disable user after 90 days
```

## Exam Tips (SAP-C02)

### Key Decision Points

**User vs Role**:
```
Person/long-term → User
Application/temporary → Role
Cross-account → Role
Federation → Role
```

**When to Use MFA**:
```
Root account → Always
Privileged users → Always
Sensitive operations → Conditional MFA
```

**Cross-Account Access**:
```
1. Trust policy in target account (allows source account)
2. Permission in source account (allows assume role)
3. Optional: External ID for third-party access
```

**Policy Evaluation**:
```
Explicit Deny → Always wins
No Allow → Implicit deny
Allow + No Deny → Allow
```

**Federation**:
```
Corporate users → SAML 2.0 / AWS SSO
Web/mobile apps → Cognito
Temporary access → STS AssumeRole
```

### Common Scenarios

**"Users can't access AWS Console"**:
- Check: User has console password enabled
- Check: User has necessary permissions
- Check: MFA requirements
- Check: IP restrictions

**"Application on EC2 can't access S3"**:
- Use IAM role (not access keys)
- Check: Role attached to instance
- Check: Role permissions include S3 actions
- Check: S3 bucket policy allows access

**"Need cross-account access"**:
- Create role in target account with trust policy
- Grant assume role permission in source account
- Use External ID for third-party

**"Prevent privilege escalation"**:
- Use permission boundaries
- Require permission boundary on role creation
- Limit iam:CreateRole, iam:AttachRolePolicy

**"Temporary access for contractor"**:
- IAM user with time-based condition
- Or: STS temporary credentials
- Or: Federated access with time limit

**"Centralized user management"**:
- AWS Organizations + AWS SSO
- Corporate directory integration
- Permission sets for accounts

This comprehensive IAM guide covers all aspects for SAP-C02 exam success.
