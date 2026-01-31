# AWS Cognito: Authentication & Authorization

## Table of Contents
1. [Cognito Fundamentals](#cognito-fundamentals)
2. [User Pools - Authentication](#user-pools---authentication)
3. [Identity Pools - Authorization](#identity-pools---authorization)
4. [OAuth 2.0 & Social Login](#oauth-20--social-login)
5. [Security & MFA](#security--mfa)
6. [LocalStack Examples](#localstack-examples)
7. [Production Patterns](#production-patterns)
8. [Interview Questions](#interview-questions)

---

## Cognito Fundamentals

### What is Cognito?

**Two Components**:

**User Pools** (Authentication - "Who are you?"):
```
Sign-up / Sign-in
User directory management
Email/phone verification
Password policies
MFA (SMS, TOTP)
JWT tokens (ID, Access, Refresh)
Social login (Google, Facebook, Apple)
SAML federation (enterprise SSO)
Lambda triggers (custom logic)
```

**Identity Pools** (Authorization - "What can you do?"):
```
AWS credentials for users
Temporary IAM roles
Access AWS services (S3, DynamoDB, Lambda)
Fine-grained permissions
Authenticated vs unauthenticated roles
Federated identities
```

**Before Cognito**:
```python
# ❌ Manual implementation
class AuthSystem:
    def register(self, email, password):
        # Hash password (bcrypt)
        # Store in database  
        # Send verification email
        # Handle verification flow
        # Implement password reset
        # Session management
        # Token generation
        # MFA implementation
        # Social login integration
        # Security (rate limiting, bot detection)
        # Compliance (GDPR, CCPA)
        pass  # Weeks of development!
```

**With Cognito**:
```python
import boto3

cognito = boto3.client('cognito-idp')

# Register user
response = cognito.sign_up(
    ClientId='app-client-id',
    Username='user@example.com',
    Password='SecurePassword123!',
    UserAttributes=[
        {'Name': 'email', 'Value': 'user@example.com'}
    ]
)

# Minutes to implement, enterprise security, zero maintenance
```

### History & Evolution

```
2014: Cognito Sync Launch
      - User data synchronization
      - Cross-device sync

2015: Cognito Identity Pools
      - Federated identities
      - AWS credentials

2016: Cognito User Pools
      - User directory
      - Authentication

2017: Advanced Security
      - Compromised credentials check
      - Adaptive authentication
      - Risk scoring

2018: Hosted UI
      - Pre-built login pages
      - OAuth 2.0 support

2019: Custom Authentication Flows
      - Lambda triggers
      - Passwordless auth

2021: Account Recovery
      - Enhanced password reset
      - Account takeover protection

2023: Managed Login
      - Improved hosted UI
      - Branding customization

2024: Passkey Support
      - Biometric authentication
      - WebAuthn integration
```

### Pricing

**User Pools**:
```
Monthly Active Users (MAU):
├─ First 50,000: FREE
├─ Next 50,000: $0.0055/MAU
├─ Next 900,000: $0.0046/MAU
├─ Next 9,000,000: $0.00325/MAU
└─ Over 10,000,000: $0.0025/MAU

Example (100,000 MAU):
- First 50K: $0
- Next 50K: 50,000 × $0.0055 = $275
- Total: $275/month

Advanced Security: +$0.05/MAU
SMS MFA: $0.00645/SMS (US)
```

**Identity Pools**:
```
FREE (pay only for AWS services accessed)

Example:
- 1M users
- Each: 100 S3 requests/month
- S3 cost: 1M × 100 / 1000 × $0.0004 = $40
- Cognito cost: $0
```

---

## User Pools - Authentication

### Create User Pool

```bash
aws cognito-idp create-user-pool \
  --pool-name MyAppUserPool \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 12,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": true
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email \
  --mfa-configuration OPTIONAL \
  --email-configuration EmailSendingAccount=COGNITO_DEFAULT
```

**App Client**:
```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id us-east-1_abc123 \
  --client-name WebApp \
  --generate-secret \
  --explicit-auth-flows \
    ALLOW_USER_PASSWORD_AUTH \
    ALLOW_REFRESH_TOKEN_AUTH \
    ALLOW_USER_SRP_AUTH \
  --access-token-validity 60 \
  --id-token-validity 60 \
  --refresh-token-validity 30 \
  --token-validity-units '{
    "AccessToken": "minutes",
    "IdToken": "minutes", 
    "RefreshToken": "days"
  }'
```

### Sign Up & Confirm

**Python**:
```python
import boto3

cognito = boto3.client('cognito-idp')

def sign_up(email, password, name):
    try:
        response = cognito.sign_up(
            ClientId='app-client-id',
            Username=email,
            Password=password,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'name', 'Value': name}
            ]
        )
        return response['UserSub']
    except cognito.exceptions.UsernameExistsException:
        return None

def confirm_sign_up(email, code):
    cognito.confirm_sign_up(
        ClientId='app-client-id',
        Username=email,
        ConfirmationCode=code
    )

# Usage
user_id = sign_up('user@example.com', 'Password123!', 'John Doe')
# User receives email with confirmation code
confirm_sign_up('user@example.com', '123456')
```

**Go**:
```go
package main

import (
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/cognitoidentityprovider"
)

func SignUp(email, password, name string) (*string, error) {
    sess := session.Must(session.NewSession())
    cognito := cognitoidentityprovider.New(sess)
    
    result, err := cognito.SignUp(&cognitoidentityprovider.SignUpInput{
        ClientId: aws.String("app-client-id"),
        Username: aws.String(email),
        Password: aws.String(password),
        UserAttributes: []*cognitoidentityprovider.AttributeType{
            {Name: aws.String("email"), Value: aws.String(email)},
            {Name: aws.String("name"), Value: aws.String(name)},
        },
    })
    
    if err != nil {
        return nil, err
    }
    
    return result.UserSub, nil
}

func ConfirmSignUp(email, code string) error {
    sess := session.Must(session.NewSession())
    cognito := cognitoidentityprovider.New(sess)
    
    _, err := cognito.ConfirmSignUp(&cognitoidentityprovider.ConfirmSignUpInput{
        ClientId:         aws.String("app-client-id"),
        Username:         aws.String(email),
        ConfirmationCode: aws.String(code),
    })
    
    return err
}
```

### Sign In

**Python**:
```python
def sign_in(email, password):
    try:
        response = cognito.initiate_auth(
            ClientId='app-client-id',
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': email,
                'PASSWORD': password
            }
        )
        
        # Check for MFA challenge
        if response.get('ChallengeName') == 'SMS_MFA':
            return {'mfa_required': True, 'session': response['Session']}
        
        # Successful auth
        tokens = response['AuthenticationResult']
        return {
            'access_token': tokens['AccessToken'],
            'id_token': tokens['IdToken'],
            'refresh_token': tokens['RefreshToken'],
            'expires_in': tokens['ExpiresIn']
        }
    except cognito.exceptions.NotAuthorizedException:
        return None

def respond_to_mfa(session, mfa_code):
    response = cognito.respond_to_auth_challenge(
        ClientId='app-client-id',
        ChallengeName='SMS_MFA',
        Session=session,
        ChallengeResponses={
            'SMS_MFA_CODE': mfa_code
        }
    )
    return response['AuthenticationResult']
```

### JWT Tokens

**ID Token** (user identity):
```json
{
  "sub": "user-uuid",
  "email_verified": true,
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123",
  "cognito:username": "user@example.com",
  "aud": "app-client-id",
  "token_use": "id",
  "exp": 1706695200,
  "iat": 1706691600,
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Access Token** (API authorization):
```json
{
  "sub": "user-uuid",
  "token_use": "access",
  "scope": "aws.cognito.signin.user.admin",
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123",
  "exp": 1706695200,
  "client_id": "app-client-id",
  "username": "user@example.com"
}
```

**Verify JWT**:
```python
import jwt
import requests

def verify_token(token, user_pool_id, region):
    # Get JWKs
    jwks_url = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json'
    jwks = requests.get(jwks_url).json()
    
    # Get key ID from token header
    headers = jwt.get_unverified_header(token)
    kid = headers['kid']
    
    # Find matching key
    key = next((k for k in jwks['keys'] if k['kid'] == kid), None)
    if not key:
        raise Exception("Public key not found")
    
    # Verify and decode
    payload = jwt.decode(
        token,
        key,
        algorithms=['RS256'],
        audience='app-client-id'
    )
    
    return payload

# Usage
user_info = verify_token(id_token, 'us-east-1_abc123', 'us-east-1')
print(user_info['email'])  # user@example.com
```

### Refresh Tokens

```python
def refresh_access_token(refresh_token):
    response = cognito.initiate_auth(
        ClientId='app-client-id',
        AuthFlow='REFRESH_TOKEN_AUTH',
        AuthParameters={
            'REFRESH_TOKEN': refresh_token
        }
    )
    
    tokens = response['AuthenticationResult']
    return {
        'access_token': tokens['AccessToken'],
        'id_token': tokens['IdToken']
        # Refresh token stays the same
    }
```

---

## Identity Pools - Authorization

### Create Identity Pool

```bash
aws cognito-identity create-identity-pool \
  --identity-pool-name MyAppIdentityPool \
  --allow-unauthenticated-identities \
  --cognito-identity-providers \
    ProviderName=cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123,ClientId=app-client-id

# Set IAM roles
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id us-east-1:pool-id \
  --roles \
    authenticated=arn:aws:iam::123456789012:role/Cognito_Auth_Role,unauthenticated=arn:aws:iam::123456789012:role/Cognito_Unauth_Role
```

**Authenticated Role** (logged-in users):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::my-bucket/users/${cognito-identity.amazonaws.com:sub}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/Users",
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": ["${cognito-identity.amazonaws.com:sub}"]
        }
      }
    }
  ]
}
```

**Unauthenticated Role** (guest users):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::my-bucket/public/*"]
    }
  ]
}
```

### Get AWS Credentials

**Python**:
```python
import boto3

def get_aws_credentials(id_token):
    identity = boto3.client('cognito-identity')
    
    # Get identity ID
    id_response = identity.get_id(
        IdentityPoolId='us-east-1:pool-id',
        Logins={
            'cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123': id_token
        }
    )
    
    identity_id = id_response['IdentityId']
    
    # Get temporary AWS credentials
    creds_response = identity.get_credentials_for_identity(
        IdentityId=identity_id,
        Logins={
            'cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123': id_token
        }
    )
    
    credentials = creds_response['Credentials']
    
    return {
        'access_key_id': credentials['AccessKeyId'],
        'secret_access_key': credentials['SecretKey'],
        'session_token': credentials['SessionToken'],
        'expiration': credentials['Expiration']
    }

# Use credentials to access S3
def upload_file(id_token, file_data):
    creds = get_aws_credentials(id_token)
    
    s3 = boto3.client(
        's3',
        aws_access_key_id=creds['access_key_id'],
        aws_secret_access_key=creds['secret_access_key'],
        aws_session_token=creds['session_token']
    )
    
    # User can only access their own folder (IAM policy)
    s3.put_object(
        Bucket='my-bucket',
        Key=f'users/{identity_id}/file.txt',
        Body=file_data
    )
```

---

## OAuth 2.0 & Social Login

### OAuth 2.0 Authorization Code Flow

**Configure**:
```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_abc123 \
  --client-id app-client-id \
  --allowed-o-auth-flows authorization_code \
  --allowed-o-auth-scopes openid email profile \
  --allowed-o-auth-flows-user-pool-client \
  --callback-urls https://myapp.com/callback \
  --logout-urls https://myapp.com/logout
```

**Authorization URL**:
```
https://myapp.auth.us-east-1.amazoncognito.com/oauth2/authorize?
  client_id=app-client-id&
  response_type=code&
  scope=openid+email+profile&
  redirect_uri=https://myapp.com/callback
```

**Exchange Code for Tokens**:
```python
import requests
import base64

def exchange_code(code):
    token_url = 'https://myapp.auth.us-east-1.amazoncognito.com/oauth2/token'
    
    # Basic auth
    credentials = base64.b64encode(b'client-id:client-secret').decode()
    
    response = requests.post(
        token_url,
        headers={
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {credentials}'
        },
        data={
            'grant_type': 'authorization_code',
            'client_id': 'app-client-id',
            'code': code,
            'redirect_uri': 'https://myapp.com/callback'
        }
    )
    
    return response.json()  # {access_token, id_token, refresh_token}
```

### Social Identity Providers

**Google Sign-In**:
```bash
aws cognito-idp create-identity-provider \
  --user-pool-id us-east-1_abc123 \
  --provider-name Google \
  --provider-type Google \
  --provider-details \
    client_id=google-client-id.apps.googleusercontent.com,client_secret=google-secret,authorize_scopes="openid email profile" \
  --attribute-mapping \
    email=email,name=name,username=sub
```

**Facebook**:
```bash
aws cognito-idp create-identity-provider \
  --user-pool-id us-east-1_abc123 \
  --provider-name Facebook \
  --provider-type Facebook \
  --provider-details \
    client_id=facebook-app-id,client_secret=facebook-secret,authorize_scopes="public_profile,email" \
  --attribute-mapping \
    email=email,name=name,username=id
```

**Login URL**:
```
https://myapp.auth.us-east-1.amazoncognito.com/oauth2/authorize?
  identity_provider=Google&
  redirect_uri=https://myapp.com/callback&
  response_type=CODE&
  client_id=app-client-id&
  scope=openid+email+profile
```

### SAML Federation (Enterprise SSO)

```bash
aws cognito-idp create-identity-provider \
  --user-pool-id us-east-1_abc123 \
  --provider-name Okta \
  --provider-type SAML \
  --provider-details \
    MetadataURL=https://dev-123456.okta.com/app/abc/sso/saml/metadata \
  --attribute-mapping \
    email=http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress,name=http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name
```

---

## Security & MFA

### Multi-Factor Authentication

**Enable MFA**:
```bash
aws cognito-idp set-user-pool-mfa-config \
  --user-pool-id us-east-1_abc123 \
  --mfa-configuration OPTIONAL \
  --software-token-mfa-configuration Enabled=true \
  --sms-mfa-configuration \
    SmsConfiguration={SnsCallerArn=arn:aws:iam::123456789012:role/CognitoSNSRole}
```

**Setup TOTP** (Authenticator App):
```python
def setup_totp(access_token):
    # Get secret
    response = cognito.associate_software_token(
        AccessToken=access_token
    )
    
    secret = response['SecretCode']
    
    # Generate QR code URL
    qr_url = f'otpauth://totp/MyApp:user@example.com?secret={secret}&issuer=MyApp'
    
    return qr_url

def verify_totp(access_token, code):
    # Verify code
    cognito.verify_software_token(
        AccessToken=access_token,
        UserCode=code
    )
    
    # Enable as preferred MFA
    cognito.set_user_mfa_preference(
        AccessToken=access_token,
        SoftwareTokenMfaSettings={
            'Enabled': True,
            'PreferredMfa': True
        }
    )
```

### Advanced Security Features

**Enable**:
```bash
aws cognito-idp set-user-pool-mfa-config \
  --user-pool-id us-east-1_abc123 \
  --user-pool-add-ons \
    AdvancedSecurityMode=ENFORCED
```

**Features** (+$0.05/MAU):
```
✅ Compromised Credentials Check
   - Database of breached passwords
   - Block sign-in if compromised

✅ Adaptive Authentication
   - Risk scoring (device, IP, location)
   - Trigger MFA for high-risk

✅ Account Takeover Protection
   - Detect unusual patterns
   - Alert users
```

### Lambda Triggers

**Pre Sign-Up** (auto-confirm):
```python
def lambda_handler(event, context):
    # Auto-confirm users
    event['response']['autoConfirmUser'] = True
    event['response']['autoVerifyEmail'] = True
    
    return event
```

**Post Confirmation** (create user record):
```python
import boto3

dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    table = dynamodb.Table('Users')
    
    table.put_item(
        Item={
            'userId': event['request']['userAttributes']['sub'],
            'email': event['request']['userAttributes']['email'],
            'createdAt': int(time.time())
        }
    )
    
    return event
```

**Pre Token Generation** (custom claims):
```python
def lambda_handler(event, context):
    event['response']['claimsOverrideDetails'] = {
        'claimsToAddOrOverride': {
            'custom:tier': 'premium',
            'custom:role': 'admin'
        }
    }
    
    return event
```

---

## LocalStack Examples

### Docker Compose

```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=cognito-idp,cognito-identity,iam,s3,dynamodb
      - DEBUG=1
    volumes:
      - "./localstack:/etc/localstack/init/ready.d"
```

### Complete Auth System

**Setup Script** (`setup.sh`):
```bash
#!/bin/bash

# Create User Pool
USER_POOL_ID=$(awslocal cognito-idp create-user-pool \
  --pool-name TestPool \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email \
  --query 'UserPool.Id' \
  --output text)

echo "User Pool ID: $USER_POOL_ID"

# Create App Client
CLIENT_ID=$(awslocal cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name WebApp \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --query 'UserPoolClient.ClientId' \
  --output text)

echo "Client ID: $CLIENT_ID"

# Create Identity Pool
IDENTITY_POOL_ID=$(awslocal cognito-identity create-identity-pool \
  --identity-pool-name TestIdentityPool \
  --allow-unauthenticated-identities \
  --cognito-identity-providers \
    ProviderName=cognito-idp.us-east-1.amazonaws.com/$USER_POOL_ID,ClientId=$CLIENT_ID \
  --query 'IdentityPoolId' \
  --output text)

echo "Identity Pool ID: $IDENTITY_POOL_ID"

# Create S3 bucket
awslocal s3 mb s3://user-uploads

# Save IDs
echo "USER_POOL_ID=$USER_POOL_ID" > .env
echo "CLIENT_ID=$CLIENT_ID" >> .env
echo "IDENTITY_POOL_ID=$IDENTITY_POOL_ID" >> .env
```

**Python Test Client**:
```python
import boto3
import os
from dotenv import load_dotenv

load_dotenv()

cognito_idp = boto3.client(
    'cognito-idp',
    endpoint_url='http://localhost:4566',
    region_name='us-east-1'
)

cognito_identity = boto3.client(
    'cognito-identity',
    endpoint_url='http://localhost:4566',
    region_name='us-east-1'
)

USER_POOL_ID = os.getenv('USER_POOL_ID')
CLIENT_ID = os.getenv('CLIENT_ID')
IDENTITY_POOL_ID = os.getenv('IDENTITY_POOL_ID')

def sign_up(email, password):
    response = cognito_idp.sign_up(
        ClientId=CLIENT_ID,
        Username=email,
        Password=password,
        UserAttributes=[
            {'Name': 'email', 'Value': email}
        ]
    )
    print(f"User created: {response['UserSub']}")
    return response['UserSub']

def confirm_sign_up(email, code):
    cognito_idp.confirm_sign_up(
        ClientId=CLIENT_ID,
        Username=email,
        ConfirmationCode=code
    )
    print("Email confirmed")

def sign_in(email, password):
    response = cognito_idp.initiate_auth(
        ClientId=CLIENT_ID,
        AuthFlow='USER_PASSWORD_AUTH',
        AuthParameters={
            'USERNAME': email,
            'PASSWORD': password
        }
    )
    
    tokens = response['AuthenticationResult']
    print("Signed in successfully")
    return tokens

def get_aws_credentials(id_token):
    # Get identity ID
    id_response = cognito_identity.get_id(
        IdentityPoolId=IDENTITY_POOL_ID,
        Logins={
            f'cognito-idp.us-east-1.amazonaws.com/{USER_POOL_ID}': id_token
        }
    )
    
    identity_id = id_response['IdentityId']
    
    # Get credentials
    creds_response = cognito_identity.get_credentials_for_identity(
        IdentityId=identity_id,
        Logins={
            f'cognito-idp.us-east-1.amazonaws.com/{USER_POOL_ID}': id_token
        }
    )
    
    return creds_response['Credentials']

def upload_to_s3(credentials, file_data):
    s3 = boto3.client(
        's3',
        endpoint_url='http://localhost:4566',
        aws_access_key_id=credentials['AccessKeyId'],
        aws_secret_access_key=credentials['SecretKey'],
        aws_session_token=credentials['SessionToken']
    )
    
    s3.put_object(
        Bucket='user-uploads',
        Key='test-file.txt',
        Body=file_data
    )
    print("File uploaded")

# Test flow
if __name__ == '__main__':
    email = 'test@example.com'
    password = 'Test1234!'
    
    # 1. Sign up
    user_id = sign_up(email, password)
    
    # 2. Confirm (in LocalStack, any code works)
    confirm_sign_up(email, '123456')
    
    # 3. Sign in
    tokens = sign_in(email, password)
    
    # 4. Get AWS credentials
    creds = get_aws_credentials(tokens['IdToken'])
    
    # 5. Upload file to S3
    upload_to_s3(creds, b'Hello from Cognito!')
    
    print("✅ Complete auth flow successful!")
```

---

## Production Patterns

### Multi-Tenant Isolation

**Separate User Pools**:
```python
# Create pool per tenant
def create_tenant(tenant_id):
    response = cognito.create_user_pool(
        PoolName=f'Tenant-{tenant_id}',
        Policies={
            'PasswordPolicy': {
                'MinimumLength': 12,
                'RequireUppercase': True,
                'RequireLowercase': True,
                'RequireNumbers': True,
                'RequireSymbols': True
            }
        }
    )
    
    return response['UserPool']['Id']

# Advantages:
# ✅ Complete isolation
# ✅ Custom policies per tenant
# ✅ Separate billing

# Disadvantages:
# ❌ Management overhead
# ❌ Cross-tenant features difficult
```

**Groups Within Pool**:
```python
# Create group
cognito.create_group(
    GroupName='tenant-123',
    UserPoolId='us-east-1_abc123',
    RoleArn='arn:aws:iam::123456789012:role/Tenant123Role'
)

# Add user to group
cognito.admin_add_user_to_group(
    UserPoolId='us-east-1_abc123',
    Username='user@example.com',
    GroupName='tenant-123'
)

# Advantages:
# ✅ Single pool management
# ✅ Easy cross-tenant features
# ✅ Lower cost

# Disadvantages:
# ❌ Shared limits
# ❌ Less isolation
```

### SSO with SAML

**Flow**:
```
1. User clicks "Login with Company SSO"
2. Redirect to Cognito hosted UI
3. Cognito redirects to Okta (SAML IdP)
4. User authenticates with Okta
5. Okta sends SAML assertion to Cognito
6. Cognito creates session, returns tokens
7. User redirected to app
```

### Passwordless Authentication

**Magic Link**:
```python
import secrets

def send_magic_link(email):
    # Generate secure token
    token = secrets.token_urlsafe(32)
    
    # Store in DynamoDB with TTL
    table.put_item(
        Item={
            'token': token,
            'email': email,
            'ttl': int(time.time()) + 600  # 10 min
        }
    )
    
    # Send email
    link = f'https://myapp.com/auth/verify?token={token}'
    send_email(email, f'Login link: {link}')

def verify_magic_link(token):
    # Get token from DynamoDB
    response = table.get_item(Key={'token': token})
    
    if 'Item' not in response:
        return None
    
    email = response['Item']['email']
    
    # Delete token (one-time use)
    table.delete_item(Key={'token': token})
    
    # Create Cognito session
    # (requires custom auth flow Lambda)
    return create_session(email)
```

### Session Management

**Refresh Token Rotation**:
```python
def refresh_with_rotation(refresh_token):
    # Get new tokens
    response = cognito.initiate_auth(
        ClientId='app-client-id',
        AuthFlow='REFRESH_TOKEN_AUTH',
        AuthParameters={
            'REFRESH_TOKEN': refresh_token
        }
    )
    
    tokens = response['AuthenticationResult']
    
    # Store new refresh token (if rotated)
    if 'RefreshToken' in tokens:
        # Old refresh token invalid
        store_refresh_token(tokens['RefreshToken'])
    
    return tokens
```

---

## Interview Questions

### Q1: User Pools vs Identity Pools - when to use each?

**Answer**:

**User Pools** (Authentication):
```
Use when you need:
✅ User sign-up / sign-in
✅ User directory management
✅ Email/phone verification
✅ Password policies
✅ MFA
✅ Social login (Google, Facebook)
✅ SAML federation (enterprise SSO)
✅ JWT tokens for API authorization

Returns: JWT tokens (ID, Access, Refresh)

Example: Web/mobile app user authentication
```

**Identity Pools** (AWS Authorization):
```
Use when users need:
✅ Direct AWS service access
✅ Temporary AWS credentials
✅ S3 uploads from mobile app
✅ DynamoDB access from frontend
✅ Invoke Lambda directly

Returns: AWS credentials (access key, secret, session token)

Example: Mobile app uploading photos to S3
```

**Common Pattern** (both together):
```
1. User signs in with User Pool → Get JWT
2. Exchange JWT for AWS credentials via Identity Pool
3. Use AWS credentials to access S3/DynamoDB

Flow:
User Pool (authenticate) → Identity Pool (authorize) → AWS Services
```

### Q2: How does OAuth 2.0 Authorization Code flow work with Cognito?

**Answer**:

**Flow**:
```
1. User clicks "Login"
   
2. App redirects to Cognito hosted UI:
   GET /oauth2/authorize?
     client_id=abc123&
     response_type=code&
     redirect_uri=https://app.com/callback&
     scope=openid email profile

3. User authenticates (username/password or social)

4. Cognito redirects back with authorization code:
   https://app.com/callback?code=xyz789

5. App exchanges code for tokens (backend):
   POST /oauth2/token
   grant_type=authorization_code&
   code=xyz789&
   client_id=abc123&
   client_secret=secret&
   redirect_uri=https://app.com/callback

6. Cognito returns tokens:
   {
     "access_token": "...",
     "id_token": "...",
     "refresh_token": "...",
     "expires_in": 3600
   }

7. App stores tokens, user logged in
```

**Why Authorization Code vs Implicit?**:
```
Authorization Code (recommended):
✅ More secure (code exchanged server-side)
✅ Client secret protected
✅ Refresh tokens supported
✅ PKCE extension for SPAs

Implicit (deprecated):
❌ Tokens in URL (less secure)
❌ No refresh tokens
❌ Not recommended for new apps
```

### Q3: How do you implement MFA in Cognito?

**Answer**:

**Types**:

**1. SMS MFA**:
```python
# Enable for user pool
cognito.set_user_pool_mfa_config(
    UserPoolId='us-east-1_abc123',
    MfaConfiguration='OPTIONAL',  # or 'ON' for required
    SmsMfaConfiguration={
        'SmsConfiguration': {
            'SnsCallerArn': 'arn:aws:iam::123456789012:role/CognitoSNSRole'
        }
    }
)

# User signs in → receives SMS code → enters code

Cost: $0.00645/SMS (US)
```

**2. TOTP (Authenticator App)**:
```python
# Setup
response = cognito.associate_software_token(
    AccessToken=access_token
)
secret = response['SecretCode']

# Generate QR code for user
qr_url = f'otpauth://totp/MyApp:user@example.com?secret={secret}&issuer=MyApp'

# User scans with Google Authenticator/Authy

# Verify code
cognito.verify_software_token(
    AccessToken=access_token,
    UserCode='123456'
)

# Enable TOTP
cognito.set_user_mfa_preference(
    AccessToken=access_token,
    SoftwareTokenMfaSettings={
        'Enabled': True,
        'PreferredMfa': True
    }
)

Cost: Free
```

**Sign-in with MFA**:
```python
# Initial auth
response = cognito.initiate_auth(
    ClientId='abc123',
    AuthFlow='USER_PASSWORD_AUTH',
    AuthParameters={
        'USERNAME': 'user@example.com',
        'PASSWORD': 'password'
    }
)

# Check for MFA challenge
if response.get('ChallengeName') == 'SOFTWARE_TOKEN_MFA':
    session = response['Session']
    
    # Prompt user for MFA code
    mfa_code = input("Enter MFA code: ")
    
    # Respond with MFA code
    response = cognito.respond_to_auth_challenge(
        ClientId='abc123',
        ChallengeName='SOFTWARE_TOKEN_MFA',
        Session=session,
        ChallengeResponses={
            'USERNAME': 'user@example.com',
            'SOFTWARE_TOKEN_MFA_CODE': mfa_code
        }
    )
    
    tokens = response['AuthenticationResult']
```

**Best Practices**:
```
✅ Use TOTP (free, more secure than SMS)
✅ Provide backup codes
✅ Allow users to disable (with verification)
✅ Enforce MFA for admin users
✅ Consider adaptive MFA (risk-based)
```

### Q4: How do you migrate existing users to Cognito?

**Answer**:

**Approaches**:

**1. Bulk Import** (CSV):
```csv
name,email,phone_number,custom:tier
John Doe,john@example.com,+1234567890,premium
Jane Smith,jane@example.com,+1234567891,free
```

```bash
# Create import job
aws cognito-idp create-user-import-job \
  --user-pool-id us-east-1_abc123 \
  --job-name Import2026 \
  --cloud-watch-logs-role-arn arn:aws:iam::123456789012:role/CognitoImportRole

# Upload CSV to S3
aws s3 cp users.csv s3://import-bucket/users.csv

# Start import
aws cognito-idp start-user-import-job \
  --user-pool-id us-east-1_abc123 \
  --job-id import-job-id

# Users imported with status RESET_REQUIRED
# Users set password on first login
```

**2. User Migration Lambda Trigger**:
```python
import bcrypt
import pymysql

# Connect to legacy database
db = pymysql.connect(host='legacy-db.example.com')

def lambda_handler(event, context):
    username = event['userName']
    password = event['request']['password']
    
    # Query legacy database
    cursor = db.cursor()
    cursor.execute(
        "SELECT password_hash, email, name FROM users WHERE username = %s",
        (username,)
    )
    
    user = cursor.fetchone()
    
    if not user:
        # User not found
        raise Exception("User not found")
    
    # Verify password
    if not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
        raise Exception("Invalid password")
    
    # Return user attributes (auto-creates user in Cognito)
    event['response']['userAttributes'] = {
        'email': user['email'],
        'name': user['name'],
        'email_verified': 'true'
    }
    
    event['response']['finalUserStatus'] = 'CONFIRMED'
    event['response']['messageAction'] = 'SUPPRESS'  # Don't send welcome email
    
    return event

# Advantages:
# ✅ Gradual migration (users migrate on first login)
# ✅ No downtime
# ✅ Validate passwords against legacy system

# Process:
# 1. User logs in to Cognito
# 2. User not found in Cognito → trigger migration Lambda
# 3. Lambda checks legacy database
# 4. If valid → create user in Cognito with same password
# 5. Next login → directly from Cognito
```

**3. Just-in-Time Migration** (API):
```python
# During transition period, check both systems
def authenticate(username, password):
    try:
        # Try Cognito first
        tokens = cognito.initiate_auth(
            ClientId='abc123',
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password
            }
        )
        return tokens
    except cognito.exceptions.UserNotFoundException:
        # User not in Cognito, check legacy system
        if legacy_auth(username, password):
            # Migrate user to Cognito
            cognito.admin_create_user(
                UserPoolId='us-east-1_abc123',
                Username=username,
                TemporaryPassword=password,
                MessageAction='SUPPRESS'
            )
            
            # Set permanent password
            cognito.admin_set_user_password(
                UserPoolId='us-east-1_abc123',
                Username=username,
                Password=password,
                Permanent=True
            )
            
            # Now authenticate with Cognito
            return cognito.initiate_auth(...)
```

### Q5: How do you optimize Cognito costs?

**Answer**:

**Cost Breakdown**:
```
User Pools:
- First 50K MAU: Free
- Next 50K: $0.0055/MAU = $275
- Total 100K MAU: $275/month

Advanced Security: +$0.05/MAU = +$5,000/month for 100K

SMS MFA: $0.00645/SMS
- 100K users × 2 SMS/month = $1,290/month

Identity Pools: Free (pay for AWS resources)
```

**Optimization Strategies**:

**1. Use Email Verification Instead of SMS**:
```python
# ✅ Email verification (free)
cognito.create_user_pool(
    AutoVerifiedAttributes=['email']
)

# ❌ SMS verification ($0.00645/message)
cognito.create_user_pool(
    AutoVerifiedAttributes=['phone_number']
)

Savings: 100K users × 1 SMS = $645/month
```

**2. TOTP MFA Instead of SMS MFA**:
```python
# ✅ TOTP (free, more secure)
cognito.set_user_pool_mfa_config(
    SoftwareTokenMfaConfiguration={'Enabled': True}
)

# ❌ SMS MFA ($0.00645/SMS)
cognito.set_user_pool_mfa_config(
    SmsMfaConfiguration={'Enabled': True}
)

Savings: 100K users × 2 SMS/month = $1,290/month
```

**3. Federate External Users**:
```python
# Users authenticated via Google/Facebook
# Don't count as MAU in User Pool
cognito.create_identity_provider(
    ProviderName='Google',
    ProviderType='Google'
)

# External users → Identity Pool → AWS services
# User Pool MAU: 0
# Cost: Only AWS services used
```

**4. Advanced Security Only Where Needed**:
```python
# Enable per-user instead of pool-wide
# Only enable for admin users, high-value transactions

# Pool-wide (expensive):
cognito.set_user_pool_mfa_config(
    UserPoolAddOns={'AdvancedSecurityMode': 'ENFORCED'}
)
# Cost: All MAU × $0.05

# Per-user (cheaper):
# Enable in Lambda trigger based on user attributes
def lambda_handler(event, context):
    if event['request']['userAttributes'].get('custom:tier') == 'premium':
        # Enable advanced security for premium users only
        pass
```

**5. Use Identity Pools for Guest Access**:
```python
# Unauthenticated role (free)
cognito_identity.create_identity_pool(
    AllowUnauthenticatedIdentities=True
)

# IAM role for guests (read-only S3 access)
{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": ["arn:aws:s3:::public-bucket/*"]
}

# Guests don't count as MAU
# Pay only for S3 requests
```

**Cost Comparison**:
```
100,000 MAU:

Baseline:
- User Pools: $275/month
- Email verification: Free
- TOTP MFA: Free
Total: $275/month

All Features:
- User Pools: $275/month
- Advanced Security: $5,000/month
- SMS verification: $645/month
- SMS MFA: $1,290/month
Total: $7,210/month

Savings: $6,935/month (96% cheaper)
```

---

This completes the comprehensive Cognito guide! All 7 AWS files are now complete with production-ready examples, LocalStack/Docker setups, and detailed interview questions covering every aspect of AWS services for FAANG backend engineering interviews.