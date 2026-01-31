# Amazon Cognito

## What is Amazon Cognito?

Amazon Cognito is a fully managed authentication, authorization, and user management service for web and mobile applications. It enables you to add user sign-up, sign-in, and access control to your applications quickly and easily. Cognito handles billions of authentications per day and provides a secure, scalable user directory.

## Why Use Amazon Cognito?

### Key Benefits
- **Scalable User Directory**: Supports millions of users automatically
- **Standards-Based Authentication**: OAuth 2.0, SAML 2.0, OpenID Connect
- **Security Features**: MFA, encryption, advanced security features
- **Social and Enterprise Identity**: Sign in with Google, Facebook, Amazon, Apple, SAML
- **Customizable UI**: Hosted UI or build your own
- **No Infrastructure Management**: Fully managed service
- **Pay-as-you-go**: Only pay for active users
- **Integration with AWS Services**: Works seamlessly with API Gateway, ALB, AppSync

### Use Cases
- Mobile and web application authentication
- API authorization with API Gateway
- Application Load Balancer authentication
- Serverless application user management
- B2C and B2B applications
- IoT device authentication
- Multi-tenant SaaS applications
- Single Sign-On (SSO) implementation

## Core Components

### User Pools

**What**: A user directory in Amazon Cognito that provides sign-up and sign-in for application users.

**Key Features**:
- User registration and authentication
- Built-in customizable UI
- MFA and password policies
- Email and phone verification
- Account recovery
- Lambda triggers for custom workflows
- Advanced security features

**User Pool Structure**:
```
User Pool: myapp-users
├── Users (millions supported)
│   ├── Username/email
│   ├── Attributes (email, phone, custom)
│   └── Groups (admin, users, premium)
├── App Clients
│   ├── Web app client
│   ├── Mobile app client
│   └── Server-side client
└── Domain (hosted UI)
    └── auth.myapp.com
```

**Authentication Flow**:
```
1. User → Sign In Request
2. Cognito → Validates credentials
3. Cognito → Returns JWT tokens
   - ID Token (user identity)
   - Access Token (access control)
   - Refresh Token (get new tokens)
4. App → Uses tokens to access resources
```

**Example User Pool Configuration**:
```json
{
  "UserPoolName": "MyAppUserPool",
  "Policies": {
    "PasswordPolicy": {
      "MinimumLength": 12,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": true
    }
  },
  "MfaConfiguration": "OPTIONAL",
  "AccountRecoverySetting": {
    "RecoveryMechanisms": [
      {"Name": "verified_email", "Priority": 1},
      {"Name": "verified_phone_number", "Priority": 2}
    ]
  }
}
```

### Identity Pools (Federated Identities)

**What**: Provides AWS credentials to users so they can access AWS services directly.

**Key Features**:
- Temporary AWS credentials (via STS)
- Supports authenticated and unauthenticated (guest) users
- Identity provider integration (Cognito User Pools, Social, SAML, OIDC)
- Fine-grained IAM permissions
- Cross-account access

**Identity Pool Flow**:
```
1. User authenticates with Identity Provider
   (User Pool, Facebook, Google, SAML, etc.)
2. Identity Pool exchanges token for AWS credentials
3. STS provides temporary credentials
4. User accesses AWS resources (S3, DynamoDB, etc.)
```

**Use Cases**:
- Mobile app direct access to S3
- IoT devices accessing DynamoDB
- Guest user access to public content
- Federated access to AWS Console
- Multi-provider authentication

**Example IAM Role for Authenticated Users**:
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
      "Resource": "arn:aws:s3:::my-bucket/${cognito-identity.amazonaws.com:sub}/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/MyTable",
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": ["${cognito-identity.amazonaws.com:sub}"]
        }
      }
    }
  ]
}
```

## How Cognito Works

### User Pools Deep Dive

#### Sign-Up Flow
```
1. User submits registration (email, password, attributes)
2. Cognito validates password policy
3. Cognito sends verification code (email/SMS)
4. User confirms verification code
5. User account status: CONFIRMED
6. Optional: Lambda trigger for custom logic
```

#### Sign-In Flow
```
1. User submits credentials (username/password)
2. Cognito validates credentials
3. Optional: MFA challenge (SMS, TOTP)
4. Cognito returns JWT tokens
   - ID Token (identity claims)
   - Access Token (authorization)
   - Refresh Token (renew tokens)
5. App stores tokens securely
```

#### Token Types

**ID Token**:
- Contains user identity claims
- Used to get user information
- Valid for 1 hour (default)
- JWT format, signed by Cognito

**Access Token**:
- Used for authorization
- Contains groups and scopes
- Valid for 1 hour (default)
- Used with User Pool authorization

**Refresh Token**:
- Get new ID and Access tokens
- Valid for 30 days (default, configurable to 1 year)
- One-time use, rotated on refresh

**Token Validation**:
```javascript
// Steps to validate JWT token
1. Verify token signature using Cognito public keys
2. Verify token is not expired (exp claim)
3. Verify token audience (aud claim matches app client ID)
4. Verify token issuer (iss claim matches User Pool)
5. Verify token use (token_use claim: id or access)
```

### User Attributes

**Standard Attributes**:
- email (verifiable)
- phone_number (verifiable)
- name, family_name, given_name
- birthdate, gender
- locale, timezone
- address

**Custom Attributes**:
- Up to 50 custom attributes
- Must be prefixed with `custom:`
- Cannot be removed once created
- Can be mutable or immutable
- Example: `custom:tenant_id`, `custom:subscription_tier`

**Attribute Constraints**:
```json
{
  "AttributeDataType": "String",
  "Name": "email",
  "Required": true,
  "Mutable": true,
  "StringAttributeConstraints": {
    "MinLength": "5",
    "MaxLength": "255"
  }
}
```

### User Groups

**What**: Collections of users in a user pool.

**Features**:
- Assign IAM roles to groups
- Organize users logically
- Include groups in JWT tokens
- Precedence for multiple groups

**Example Groups**:
```
Admin Group
├── IAM Role: AdminRole
├── Description: "Administrative users"
├── Precedence: 1
└── Users: [admin@example.com, superadmin@example.com]

Premium Users
├── IAM Role: PremiumUserRole
├── Precedence: 2
└── Users: [premium1@example.com, premium2@example.com]

Free Users
├── IAM Role: FreeUserRole
├── Precedence: 3
└── Users: [user1@example.com, user2@example.com]
```

**Groups in Tokens**:
```json
// Access Token claims
{
  "sub": "a1b2c3d4-5678-90ab-cdef-EXAMPLE11111",
  "cognito:groups": ["Admin", "PowerUsers"],
  "token_use": "access",
  "scope": "openid email profile",
  "auth_time": 1609459200,
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_EXAMPLE",
  "exp": 1609462800,
  "iat": 1609459200,
  "client_id": "EXAMPLE_CLIENT_ID",
  "username": "admin@example.com"
}
```

### Lambda Triggers

**Pre-Authentication**:
- Custom validation before sign-in
- Block suspicious users
- Implement custom auth logic

**Post-Authentication**:
- Logging and analytics
- Add custom claims to tokens
- Trigger workflows

**Pre-Sign-Up**:
- Custom validation of sign-up data
- Auto-confirm users
- Auto-verify attributes

**Post-Confirmation**:
- Send welcome email
- Add user to database
- Trigger onboarding workflow

**Pre-Token Generation**:
- Modify token claims
- Add custom attributes to tokens
- Suppress attributes

**Custom Message**:
- Customize verification/MFA codes
- Localize messages
- Branded email templates

**User Migration**:
- Migrate users from legacy system
- Seamless migration during login
- Validate credentials against old system

**Example Lambda Trigger**:
```python
def lambda_handler(event, context):
    # Pre-Token Generation trigger
    # Add custom claims to token
    
    user_attributes = event['request']['userAttributes']
    
    # Add custom claim
    event['response']['claimsOverrideDetails'] = {
        'claimsToAddOrOverride': {
            'custom:tenant_id': user_attributes.get('custom:tenant_id', 'default'),
            'role': 'premium' if user_attributes.get('email').endswith('@premium.com') else 'free'
        }
    }
    
    return event
```

### Advanced Security Features

**Adaptive Authentication**:
- Risk-based authentication
- Device fingerprinting
- IP address tracking
- Automatic risk scoring (Low, Medium, High)
- Adaptive MFA requirements
- Account takeover protection

**Compromised Credentials Detection**:
- Checks against known breached credentials
- Blocks sign-in with compromised passwords
- Requires password change

**Event Logging**:
```json
{
  "EventType": "SignIn",
  "CreationDate": 1609459200,
  "EventRisk": {
    "RiskLevel": "Medium",
    "RiskDecision": "Block"
  },
  "EventContextData": {
    "IpAddress": "192.0.2.1",
    "DeviceName": "Chrome/Windows",
    "City": "Seattle",
    "Country": "US"
  }
}
```

## Integration Patterns

### API Gateway Integration

**Cognito User Pool Authorizer**:
```yaml
# API Gateway Configuration
Authorizers:
  CognitoAuthorizer:
    Type: COGNITO_USER_POOLS
    ProviderARNs:
      - arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_Example
    IdentitySource: method.request.header.Authorization

Resources:
  /api/protected:
    get:
      security:
        - CognitoAuthorizer: []
```

**Request Flow**:
```
1. Client → GET /api/protected (Authorization: Bearer <ID_TOKEN>)
2. API Gateway → Validates token with Cognito
3. Cognito → Returns validation result
4. API Gateway → Forwards to Lambda (if valid)
5. Lambda → Access user info from event.requestContext.authorizer.claims
```

**Lambda Access to User Info**:
```javascript
exports.handler = async (event) => {
    // User information from Cognito token
    const claims = event.requestContext.authorizer.claims;
    const userId = claims.sub;
    const email = claims.email;
    const groups = claims['cognito:groups'] || [];
    
    console.log(`Request from user: ${email}, groups: ${groups}`);
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: `Hello ${email}`,
            userId: userId
        })
    };
};
```

### Application Load Balancer Integration

**ALB Authentication**:
```yaml
# ALB Listener Rule
Rules:
  - Priority: 1
    Conditions:
      - Field: path-pattern
        Values: ["/app/*"]
    Actions:
      - Type: authenticate-cognito
        AuthenticateCognitoConfig:
          UserPoolArn: arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_Example
          UserPoolClientId: EXAMPLE_CLIENT_ID
          UserPoolDomain: myapp.auth.us-east-1.amazoncognito.com
          Scope: openid
          SessionTimeout: 3600
      - Type: forward
        TargetGroupArn: arn:aws:elasticloadbalancing:...
```

**Headers Passed to Target**:
```
x-amzn-oidc-accesstoken: <access_token>
x-amzn-oidc-identity: <user_id>
x-amzn-oidc-data: <JWT with user claims>
```

### AppSync Integration

**Authorization with Cognito**:
```graphql
# AppSync Schema
type Query {
  getUser(id: ID!): User
    @aws_cognito_user_pools(cognito_groups: ["Admin", "Users"])
  
  getAdminData: AdminData
    @aws_cognito_user_pools(cognito_groups: ["Admin"])
}

type Mutation {
  updateProfile(input: ProfileInput!): Profile
    @aws_cognito_user_pools
}
```

**Resolver Access to User Context**:
```javascript
// AppSync resolver
{
  "version": "2018-05-29",
  "operation": "GetItem",
  "key": {
    "userId": $util.dynamodb.toDynamoDBJson($ctx.identity.sub)
  }
}
```

### Identity Pool with AWS Services

**Mobile App Direct S3 Access**:
```javascript
// JavaScript SDK
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Get credentials from Identity Pool
const s3Client = new S3Client({
  region: "us-east-1",
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: "us-east-1" }),
    identityPoolId: "us-east-1:12345678-1234-1234-1234-123456789012",
    logins: {
      "cognito-idp.us-east-1.amazonaws.com/us-east-1_Example": idToken
    }
  })
});

// Upload to user-specific S3 prefix
await s3Client.send(new PutObjectCommand({
  Bucket: "my-app-bucket",
  Key: `users/${userId}/photo.jpg`,
  Body: photoData
}));
```

## Multi-Tenancy Patterns

### Separate User Pools per Tenant
```
Tenant A → User Pool A → Identity Pool A → IAM Role A
Tenant B → User Pool B → Identity Pool B → IAM Role B
Tenant C → User Pool C → Identity Pool C → IAM Role C
```

**Pros**: Complete isolation, independent configuration
**Cons**: Management overhead, higher cost at scale

### Single User Pool with Custom Attributes
```
Shared User Pool
├── User 1 (custom:tenant_id = tenant-a)
├── User 2 (custom:tenant_id = tenant-b)
└── User 3 (custom:tenant_id = tenant-c)

Lambda Trigger → Add tenant_id to token claims
API/Database → Filter by tenant_id
```

**Pros**: Simpler management, lower cost
**Cons**: Shared limits, careful isolation needed

### User Groups per Tenant
```
User Pool
├── Group: tenant-a-users
├── Group: tenant-a-admins
├── Group: tenant-b-users
└── Group: tenant-b-admins

Token contains: cognito:groups = ["tenant-a-users"]
Application → Filters based on group
```

## Migration Strategies

### User Migration Lambda Trigger
```python
import requests

def lambda_handler(event, context):
    """
    Migrate users from legacy system during first login
    """
    username = event['userName']
    password = event['request']['password']
    
    # Authenticate against legacy system
    response = requests.post('https://legacy-auth.example.com/login', 
                           json={'username': username, 'password': password})
    
    if response.status_code == 200:
        user_data = response.json()
        
        # Return user profile to Cognito
        event['response']['userAttributes'] = {
            'email': user_data['email'],
            'email_verified': 'true',
            'name': user_data['name'],
            'custom:legacy_id': user_data['id']
        }
        event['response']['finalUserStatus'] = 'CONFIRMED'
        event['response']['messageAction'] = 'SUPPRESS'  # Don't send verification
        
        return event
    else:
        raise Exception('Invalid credentials')
```

### Bulk User Import
```bash
# Create CSV file
cat > users.csv << EOF
name,given_name,family_name,email,email_verified,phone_number,phone_number_verified
Alice Smith,Alice,Smith,alice@example.com,true,+12065551234,true
Bob Jones,Bob,Jones,bob@example.com,true,+12065555678,true
EOF

# Create import job
aws cognito-idp create-user-import-job \
  --user-pool-id us-east-1_Example \
  --job-name "Initial-Import" \
  --cloud-watch-logs-role-arn arn:aws:iam::123456789012:role/CognitoImportRole

# Upload CSV to S3 (provided by import job)
aws s3 cp users.csv s3://import-bucket/users.csv

# Start import job
aws cognito-idp start-user-import-job \
  --user-pool-id us-east-1_Example \
  --job-id import-job-id
```

## Security Best Practices

### Token Security
```javascript
// Store tokens securely
// Browser: httpOnly cookies or sessionStorage (never localStorage for refresh tokens)
// Mobile: Secure enclave/keychain

// Validate tokens on server
const validateToken = async (token) => {
  // 1. Decode token
  const decoded = jwt.decode(token, { complete: true });
  
  // 2. Get public keys from Cognito
  const keys = await getPublicKeys(userPoolId);
  
  // 3. Verify signature
  const verified = jwt.verify(token, keys[decoded.header.kid]);
  
  // 4. Check expiration
  if (verified.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }
  
  return verified;
};
```

### MFA Configuration
```json
{
  "MfaConfiguration": "OPTIONAL",
  "SoftwareTokenMfaConfiguration": {
    "Enabled": true
  },
  "SmsMfaConfiguration": {
    "SmsConfiguration": {
      "SnsCallerArn": "arn:aws:iam::123456789012:role/CognitoSNSRole",
      "ExternalId": "example-external-id"
    }
  }
}
```

### Password Policy
```json
{
  "PasswordPolicy": {
    "MinimumLength": 12,
    "RequireUppercase": true,
    "RequireLowercase": true,
    "RequireNumbers": true,
    "RequireSymbols": true,
    "TemporaryPasswordValidityDays": 7
  }
}
```

## Monitoring and Logging

### CloudWatch Metrics
- `SignInSuccesses`
- `SignInThrottles`
- `TokenRefreshSuccesses`
- `FederationSuccesses`
- `SignUpSuccesses`

### CloudWatch Logs
```json
{
  "eventType": "SignIn",
  "eventName": "SignIn_Failure",
  "eventTime": "2024-01-15T10:30:00Z",
  "userPoolId": "us-east-1_Example",
  "clientId": "app-client-id",
  "userName": "user@example.com",
  "ipAddress": "192.0.2.1",
  "eventRisk": {
    "riskLevel": "High",
    "riskDecision": "Block"
  },
  "eventResponse": "Fail"
}
```

### CloudTrail Events
- `CreateUserPool`
- `UpdateUserPool`
- `AdminCreateUser`
- `AdminDeleteUser`
- `SetUserPoolMfaConfig`

## Cost Optimization

### MAU (Monthly Active Users) Pricing
- **Free Tier**: 50,000 MAUs
- **User Pool**: Tiered pricing
  - First 50K MAUs: Free
  - Next 50K MAUs: $0.00550 per MAU
  - Next 900K MAUs: $0.00460 per MAU
  - Over 1M MAUs: $0.00325 per MAU

- **SAML/OIDC Federation**: $0.015 per MAU
- **Advanced Security**: $0.05 per MAU

**Cost Optimization Tips**:
```
1. Use Cognito User Pools instead of external identity providers
2. Enable advanced security only for sensitive applications
3. Clean up inactive users regularly
4. Use Lambda triggers for custom logic (cheaper than third-party)
5. Cache tokens appropriately (reduce token refresh calls)
```

## SAP-C02 Exam Scenarios

### Scenario 1: Multi-Region User Management
**Question**: Design a globally available authentication system.

**Solution**:
```
Primary Region (us-east-1)
├── User Pool (primary)
└── CloudFront → Hosted UI

Secondary Region (eu-west-1)
├── User Pool (separate, for EU users)
└── Regional Hosted UI

Global Solution:
- Route 53 Geolocation routing to regional User Pools
- OR: Single User Pool with global endpoints
- Identity Pool in each region
- Cross-region token validation
```

### Scenario 2: B2B SaaS Multi-Tenancy
**Question**: Design authentication for 1000+ corporate tenants.

**Solution**:
```
Option 1: Single User Pool + Groups
- User Pool with custom:tenant_id attribute
- Lambda trigger adds tenant_id to tokens
- API Gateway validates tenant_id
- DynamoDB with tenant_id partition key

Option 2: User Pool per Tenant (Small number)
- Dedicated User Pool per tenant
- Custom domain per tenant
- Better isolation, higher management overhead

Recommendation: Option 1 for 1000+ tenants
```

### Scenario 3: Mobile App with Social Login
**Question**: Mobile app needs Facebook, Google, Apple sign-in + AWS service access.

**Solution**:
```
1. User Pool with social identity providers
   - Facebook, Google, Apple configured
   - App client with social provider enabled

2. Identity Pool for AWS credentials
   - User Pool as authentication provider
   - Authenticated role with S3, DynamoDB access
   - Fine-grained permissions using identity variables

3. Mobile SDK
   - Amplify or AWS SDK
   - Social provider SDK (Facebook SDK, Google Sign-In)
   - Token exchange → AWS credentials
```

### Scenario 4: Legacy System Migration
**Question**: Migrate 1 million users from on-premises auth system.

**Solution**:
```
Phase 1: User Migration Trigger
- Lambda trigger for seamless migration
- Validates against legacy system
- Migrates on first login
- Gradual migration over time

Phase 2: Bulk Import (Optional)
- Export users from legacy system
- CSV format import
- Force password reset on first login
- Minimize downtime

Phase 3: Cutover
- Decommission legacy system
- All users in Cognito
- Monitor for issues
```

## Common Pitfalls

### Token Expiration Handling
```javascript
// ❌ Bad: Don't check token expiration
const response = await fetch('/api/data', {
  headers: { Authorization: `Bearer ${idToken}` }
});

// ✅ Good: Refresh token if expired
const getValidToken = async () => {
  if (isTokenExpired(idToken)) {
    const tokens = await refreshTokens(refreshToken);
    idToken = tokens.idToken;
    refreshToken = tokens.refreshToken;
  }
  return idToken;
};
```

### Group Precedence
```
// Issue: User in multiple groups
User: john@example.com
Groups: [Admin (precedence 1), Developer (precedence 2)]

// Result: Admin role used (lowest precedence number wins)
// Ensure precedence numbers match your intent
```

### Custom Attributes Immutability
```
// ❌ Cannot delete custom attributes
// Plan custom attributes carefully before creation

// ✅ Make custom attributes mutable if values will change
{
  "AttributeDataType": "String",
  "Name": "custom:subscription_tier",
  "Mutable": true  // Can update values
}
```

## Comparison with Other Services

| Feature | Cognito User Pools | IAM Users | AWS SSO |
|---------|-------------------|-----------|---------|
| **Use Case** | Application users | AWS service access | Workforce identity |
| **User Scale** | Millions | Thousands | Thousands |
| **Authentication** | Username/password, MFA, social | Access keys, passwords | SAML, OIDC |
| **Self-Service** | Yes (sign-up, password reset) | No | Limited |
| **Hosted UI** | Yes | No | Yes |
| **Social Login** | Yes | No | No |
| **JWT Tokens** | Yes | No | Yes (OIDC) |
| **AWS Resource Access** | Via Identity Pool | Direct | Direct |
| **Cost** | Per MAU | Free | Free |

## Key Takeaways for SAP-C02

1. **User Pools vs Identity Pools**
   - User Pools: Authentication and user management
   - Identity Pools: AWS credentials for users
   - Often used together for complete solution

2. **Integration Points**
   - API Gateway: Cognito authorizer
   - ALB: authenticate-cognito action
   - AppSync: Built-in Cognito authorization
   - Lambda: Custom authorization logic

3. **Multi-Tenancy**
   - Custom attributes for tenant ID
   - User groups per tenant
   - Lambda triggers for tenant-specific logic
   - Separate user pools for complete isolation

4. **Security**
   - Always validate tokens on server side
   - Use MFA for sensitive operations
   - Enable advanced security features
   - Implement proper token refresh logic

5. **Scalability**
   - Automatic scaling to millions of users
   - No infrastructure management
   - Global availability via CloudFront
   - Consider regional user pools for compliance

6. **Migration**
   - User migration trigger for seamless migration
   - Bulk import for large datasets
   - Gradual migration vs cutover
   - Plan custom attributes before migration

7. **Cost Management**
   - Free tier: 50K MAUs
   - Advanced security adds cost
   - Federation adds cost
   - Clean up inactive users
