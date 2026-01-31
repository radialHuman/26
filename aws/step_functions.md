# AWS Cognito: Authentication & Authorization

## Table of Contents
1. [Cognito Fundamentals](#cognito-fundamentals)
2. [User Pools](#user-pools)
3. [Identity Pools](#identity-pools)
4. [Authentication Flows](#authentication-flows)
5. [OAuth 2.0 & OIDC](#oauth-20--oidc)
6. [Security & MFA](#security--mfa)
7. [LocalStack Examples](#localstack-examples)
8. [Production Patterns](#production-patterns)
9. [Interview Questions](#interview-questions)

---

## Cognito Fundamentals

### What is Cognito?

**Definition**: Fully managed authentication, authorization, and user management service for web and mobile apps.

**Two Main Components**:

**1. User Pools** (Authentication):
```
User sign-up, sign-in, user management
Username/password authentication
Social identity providers (Google, Facebook, Apple)
SAML/OIDC integration
MFA, password policies
JWT tokens
```

**2. Identity Pools** (Authorization):
```
AWS credentials for authenticated/unauthenticated users
Temporary IAM credentials
Access AWS services (S3, DynamoDB, Lambda)
Fine-grained permissions
```

**Before Cognito**:
```python
# Custom authentication system
class UserAuth:
    def __init__(self):
        self.db = Database()
        
    def register(self, email, password):
        # ❌ Hash password (implement bcrypt)
        # ❌ Store in database
        # ❌ Send verification email
        # ❌ Handle email verification
        # ❌ Implement password reset
        # ❌ Session management
        # ❌ Token generation/validation
        # ❌ MFA implementation
        # ❌ Social login integration
        # ❌ Security (rate limiting, bot detection)
        pass
    
    def login(self, email, password):
        # ❌ Validate credentials
        # ❌ Generate session token
        # ❌ Refresh token logic
        # ❌ Handle concurrent sessions
        pass

# Result: Weeks of development, security vulnerabilities, maintenance burden
```

**With Cognito**:
```python
import boto3

cognito = boto3.client('cognito-idp')

# Register user (Cognito handles everything)
response = cognito.sign_up(
    ClientId='abc123',
    Username='user@example.com',
    Password='SecurePassword123!',
    UserAttributes=[
        {'Name': 'email', 'Value': 'user@example.com'}
    ]
)

# Login user
auth_response = cognito.initiate_auth(
    ClientId='abc123',
    AuthFlow='USER_PASSWORD_AUTH',
    AuthParameters={
        'USERNAME': 'user@example.com',
        'PASSWORD': 'SecurePassword123!'
    }
)

# Get JWT tokens
id_token = auth_response['AuthenticationResult']['IdToken']
access_token = auth_response['AuthenticationResult']['AccessToken']
refresh_token = auth_response['AuthenticationResult']['RefreshToken']

# Result: Minutes to implement, enterprise-grade security, zero maintenance
```

### History & Evolution

```
2016: Cognito User Pools Launch
      - User directory
      - Sign-up/sign-in
      - Password policies

2017: Advanced Security Features
      - Compromised credentials check
      - Adaptive authentication
      - Risk-based MFA

2018: Hosted UI
      - Pre-built login pages
      - OAuth 2.0 support
      - Social identity providers

2019: Custom Authentication Flows
      - Lambda triggers
      - Passwordless authentication

2020: Token Revocation
      - Immediate logout
      - Security improvements

2021: Account Recovery
      - Enhanced password reset
      - Account takeover protection

2022: SAML/OIDC Improvements
      - Enterprise SSO enhancements
      - Better attribute mapping

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
- First 50,000: Free
- Next 50,000: $0.0055/MAU
- Next 900,000: $0.0046/MAU
- Next 9,000,000: $0.00325/MAU
- Over 10,000,000: $0.0025/MAU

Example (100,000 MAU):
- First 50,000: Free
- Next 50,000: 50,000 × $0.0055 = $275
- Total: $275/month

Advanced Security Features:
- $0.05 per MAU (additional)
```

**Identity Pools**:
```
Free (pay only for AWS services accessed)

Example:
- 1M users
- Each user: 100 S3 requests/month
- S3 cost: 1M × 100 / 1000 × $0.0004 = $40/month
- Cognito cost: $0
```

---

## User Pools

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
      "RequireSymbols": true,
      "TemporaryPasswordValidityDays": 7
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email \
  --mfa-configuration OPTIONAL \
  --user-attribute-update-settings '{
    "AttributesRequireVerificationBeforeUpdate": ["email"]
  }' \
  --email-configuration '{
    "EmailSendingAccount": "COGNITO_DEFAULT"
  }' \
  --user-pool-tags Environment=production,Application=MyApp
```

**Create App Client**:
```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id us-east-1_abc123 \
  --client-name MyAppClient \
  --generate-secret \
  --explicit-auth-flows \
    ALLOW_USER_PASSWORD_AUTH \
    ALLOW_REFRESH_TOKEN_AUTH \
    ALLOW_USER_SRP_AUTH \
  --read-attributes email name phone_number \
  --write-attributes email name phone_number \
  --access-token-validity 60 \
  --id-token-validity 60 \
  --refresh-token-validity 30 \
  --token-validity-units '{
    "AccessToken": "minutes",
    "IdToken": "minutes",
    "RefreshToken": "days"
  }' \
  --prevent-user-existence-errors ENABLED
```

### User Sign-Up

**Python**:
```python
import boto3

cognito = boto3.client('cognito-idp')

def sign_up_user(email, password, name, phone):
    try:
        response = cognito.sign_up(
            ClientId='abc123',
            Username=email,
            Password=password,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'name', 'Value': name},
                {'Name': 'phone_number', 'Value': phone},
                {'Name': 'custom:tier', 'Value': 'free'}
            ],
            ValidationData=[
                {'Name': 'referralCode', 'Value': 'FRIEND2025'}
            ]
        )
        
        print(f"User created: {response['UserSub']}")
        print("Confirmation code sent to:", email)
        
        return response['UserSub']
        
    except cognito.exceptions.UsernameExistsException:
        print("Email already registered")
    except cognito.exceptions.InvalidPasswordException as e:
        print(f"Invalid password: {e}")
    except cognito.exceptions.InvalidParameterException as e:
        print(f"Invalid parameter: {e}")
```

**Confirm Sign-Up**:
```python
def confirm_sign_up(email, confirmation_code):
    cognito.confirm_sign_up(
        ClientId='abc123',
        Username=email,
        ConfirmationCode=confirmation_code
    )
    print("Email confirmed, user can now sign in")
```

**Resend Confirmation Code**:
```python
def resend_code(email):
    cognito.resend_confirmation_code(
        ClientId='abc123',
        Username=email
    )
```

### User Sign-In

**Username/Password Authentication**:
```python
def sign_in(email, password):
    try:
        response = cognito.initiate_auth(
            ClientId='abc123',
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': email,
                'PASSWORD': password
            }
        )
        
        # Check if MFA required
        if response.get('ChallengeName') == 'SMS_MFA':
            return handle_mfa_challenge(response['Session'])
        
        # Check if new password required
        if response.get('ChallengeName') == 'NEW_PASSWORD_REQUIRED':
            return handle_new_password_challenge(response['Session'])
        
        # Successful authentication
        tokens = response['AuthenticationResult']
        
        return {
            'accessToken': tokens['AccessToken'],
            'idToken': tokens['IdToken'],
            'refreshToken': tokens['RefreshToken'],
            'expiresIn': tokens['ExpiresIn']  # Seconds
        }
        
    except cognito.exceptions.NotAuthorizedException:
        print("Invalid credentials")
    except cognito.exceptions.UserNotFoundException:
        print("User not found")
    except cognito.exceptions.UserNotConfirmedException:
        print("Email not confirmed")
```

**SRP Authentication** (Secure Remote Password):
```python
from warrant import Cognito

def sign_in_srp(email, password):
    user = Cognito(
        user_pool_id='us-east-1_abc123',
        client_id='abc123',
        username=email
    )
    
    user.authenticate(password=password)
    
    return {
        'accessToken': user.access_token,
        'idToken': user.id_token,
        'refreshToken': user.refresh_token
    }
```

**Go Example**:
```go
package main

import (
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/cognitoidentityprovider"
)

func SignIn(email, password string) (*AuthTokens, error) {
    sess := session.Must(session.NewSession())
    cognito := cognitoidentityprovider.New(sess)
    
    result, err := cognito.InitiateAuth(&cognitoidentityprovider.InitiateAuthInput{
        AuthFlow: aws.String("USER_PASSWORD_AUTH"),
        ClientId: aws.String("abc123"),
        AuthParameters: map[string]*string{
            "USERNAME": aws.String(email),
            "PASSWORD": aws.String(password),
        },
    })
    
    if err != nil {
        return nil, err
    }
    
    return &AuthTokens{
        AccessToken:  *result.AuthenticationResult.AccessToken,
        IdToken:      *result.AuthenticationResult.IdToken,
        RefreshToken: *result.AuthenticationResult.RefreshToken,
    }, nil
}

type AuthTokens struct {
    AccessToken  string
    IdToken      string
    RefreshToken string
}
```

### Refresh Tokens

```python
def refresh_access_token(refresh_token):
    response = cognito.initiate_auth(
        ClientId='abc123',
        AuthFlow='REFRESH_TOKEN_AUTH',
        AuthParameters={
            'REFRESH_TOKEN': refresh_token
        }
    )
    
    tokens = response['AuthenticationResult']
    
    return {
        'accessToken': tokens['AccessToken'],
        'idToken': tokens['IdToken']
        # No new refresh token (reuse existing)
    }
```

### JWT Token Structure

**ID Token** (User Identity):
```json
{
  "header": {
    "kid": "abc123",
    "alg": "RS256"
  },
  "payload": {
    "sub": "user-uuid",
    "aud": "abc123",
    "email_verified": true,
    "token_use": "id",
    "auth_time": 1706691600,
    "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123",
    "cognito:username": "user@example.com",
    "exp": 1706695200,
    "iat": 1706691600,
    "email": "user@example.com",
    "name": "John Doe",
    "phone_number": "+1234567890",
    "custom:tier": "premium"
  }
}
```

**Access Token** (API Authorization):
```json
{
  "payload": {
    "sub": "user-uuid",
    "token_use": "access",
    "scope": "aws.cognito.signin.user.admin",
    "auth_time": 1706691600,
    "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123",
    "exp": 1706695200,
    "iat": 1706691600,
    "client_id": "abc123",
    "username": "user@example.com"
  }
}
```

**Verify JWT Token**:
```python
import jwt
import requests

def verify_token(token):
    # Get JSON Web Keys
    jwks_url = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123/.well-known/jwks.json'
    jwks = requests.get(jwks_url).json()
    
    # Get token header
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
        audience='abc123',  # Client ID
        issuer='https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123'
    )
    
    return payload
```

### User Management

**Get User Info**:
```python
def get_user_info(access_token):
    response = cognito.get_user(
        AccessToken=access_token
    )
    
    return {
        'username': response['Username'],
        'attributes': {
            attr['Name']: attr['Value']
            for attr in response['UserAttributes']
        },
        'mfaOptions': response.get('MFAOptions', [])
    }
```

**Update User Attributes**:
```python
def update_profile(access_token, name, phone):
    cognito.update_user_attributes(
        AccessToken=access_token,
        UserAttributes=[
            {'Name': 'name', 'Value': name},
            {'Name': 'phone_number', 'Value': phone}
        ]
    )
```

**Change Password**:
```python
def change_password(access_token, old_password, new_password):
    cognito.change_password(
        AccessToken=access_token,
        PreviousPassword=old_password,
        ProposedPassword=new_password
    )
```

**Admin Operations**:
```python
def admin_create_user(email, temporary_password):
    response = cognito.admin_create_user(
        UserPoolId='us-east-1_abc123',
        Username=email,
        TemporaryPassword=temporary_password,
        UserAttributes=[
            {'Name': 'email', 'Value': email},
            {'Name': 'email_verified', 'Value': 'true'}
        ],
        DesiredDeliveryMediums=['EMAIL']
    )
    return response['User']

def admin_disable_user(email):
    cognito.admin_disable_user(
        UserPoolId='us-east-1_abc123',
        Username=email
    )

def admin_delete_user(email):
    cognito.admin_delete_user(
        UserPoolId='us-east-1_abc123',
        Username=email
    )
```

---

## Identity Pools

### Create Identity Pool

```bash
aws cognito-identity create-identity-pool \
  --identity-pool-name MyAppIdentityPool \
  --allow-unauthenticated-identities \
  --cognito-identity-providers \
    ProviderName=cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123,ClientId=abc123
```

**Set IAM Roles**:
```bash
# Authenticated role (logged in users)
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id us-east-1:pool-uuid \
  --roles authenticated=arn:aws:iam::123456789012:role/Cognito_MyAppAuth_Role,unauthenticated=arn:aws:iam::123456789012:role/Cognito_MyAppUnauth_Role
```

**Authenticated Role Policy**:
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
        "arn:aws:s3:::my-app-bucket/users/${cognito-identity.amazonaws.com:sub}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
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

**Unauthenticated Role Policy** (guest users):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::my-app-bucket/public/*"
      ]
    }
  ]
}
```

### Get AWS Credentials

**Python**:
```python
import boto3

def get_aws_credentials(id_token):
    # Get identity ID
    identity = boto3.client('cognito-identity')
    
    id_response = identity.get_id(
        IdentityPoolId='us-east-1:pool-uuid',
        Logins={
            'cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123': id_token
        }
    )
    
    identity_id = id_response['IdentityId']
    
    # Get credentials
    creds_response = identity.get_credentials_for_identity(
        IdentityId=identity_id,
        Logins={
            'cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123': id_token
        }
    )
    
    credentials = creds_response['Credentials']
    
    return {
        'accessKeyId': credentials['AccessKeyId'],
        'secretKey': credentials['SecretKey'],
        'sessionToken': credentials['SessionToken'],
        'expiration': credentials['Expiration']
    }

# Use credentials to access AWS services
def upload_to_s3(id_token, file_data):
    creds = get_aws_credentials(id_token)
    
    s3 = boto3.client(
        's3',
        aws_access_key_id=creds['accessKeyId'],
        aws_secret_access_key=creds['secretKey'],
        aws_session_token=creds['sessionToken']
    )
    
    # Upload to user's private folder
    # IAM policy ensures user can only access their own folder
    s3.put_object(
        Bucket='my-app-bucket',
        Key=f'users/{identity_id}/profile.jpg',
        Body=file_data
    )
```

**JavaScript (Frontend)**:
```javascript
import { CognitoIdentityClient, GetIdCommand, GetCredentialsForIdentityCommand } from "@aws-sdk/client-cognito-identity";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

async function uploadFile(idToken, file) {
  const identityClient = new CognitoIdentityClient({ region: 'us-east-1' });
  
  // Get identity ID
  const getIdResponse = await identityClient.send(new GetIdCommand({
    IdentityPoolId: 'us-east-1:pool-uuid',
    Logins: {
      'cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123': idToken
    }
  }));
  
  const identityId = getIdResponse.IdentityId;
  
  // Get AWS credentials
  const credsResponse = await identityClient.send(new GetCredentialsForIdentityCommand({
    IdentityId: identityId,
    Logins: {
      'cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123': idToken
    }
  }));
  
  const creds = credsResponse.Credentials;
  
  // Upload to S3
  const s3Client = new S3Client({
    region: 'us-east-1',
    credentials: {
      accessKeyId: creds.AccessKeyId,
      secretAccessKey: creds.SecretKey,
      sessionToken: creds.SessionToken
    }
  });
  
  await s3Client.send(new PutObjectCommand({
    Bucket: 'my-app-bucket',
    Key: `users/${identityId}/profile.jpg`,
    Body: file
  }));
}
```

---

## Authentication Flows

### OAuth 2.0 Authorization Code Flow

**Setup**:
```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_abc123 \
  --client-id abc123 \
  --allowed-o-auth-flows authorization_code \
  --allowed-o-auth-scopes openid email profile \
  --allowed-o-auth-flows-user-pool-client \
  --callback-urls https://myapp.com/callback \
  --logout-urls https://myapp.com/logout
```

**Authorization URL**:
```
https://myapp.auth.us-east-1.amazoncognito.com/oauth2/authorize?
  client_id=abc123&
  response_type=code&
  scope=openid+email+profile&
  redirect_uri=https://myapp.com/callback
```

**Exchange Code for Tokens**:
```python
import requests
import base64

def exchange_code_for_tokens(code):
    token_url = 'https://myapp.auth.us-east-1.amazoncognito.com/oauth2/token'
    
    # Basic auth header
    client_id = 'abc123'
    client_secret = 'secret'
    credentials = base64.b64encode(f'{client_id}:{client_secret}'.encode()).decode()
    
    response = requests.post(
        token_url,
        headers={
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {credentials}'
        },
        data={
            'grant_type': 'authorization_code',
            'client_id': client_id,
            'code': code,
            'redirect_uri': 'https://myapp.com/callback'
        }
    )
    
    return response.json()
    # {
    #   "access_token": "...",
    #   "id_token": "...",
    #   "refresh_token": "...",
    #   "expires_in": 3600,
    #   "token_type": "Bearer"
    # }
```

### Social Identity Providers

**Configure Google Sign-In**:
```bash
aws cognito-idp create-identity-provider \
  --user-pool-id us-east-1_abc123 \
  --provider-name Google \
  --provider-type Google \
  --provider-details \
    client_id=google-client-id.apps.googleusercontent.com,client_secret=google-client-secret,authorize_scopes=openid email profile \
  --attribute-mapping \
    email=email,name=name,picture=picture,username=sub
```

**Configure Facebook**:
```bash
aws cognito-idp create-identity-provider \
  --user-pool-id us-east-1_abc123 \
  --provider-name Facebook \
  --provider-type Facebook \
  --provider-details \
    client_id=facebook-app-id,client_secret=facebook-app-secret,authorize_scopes=public_profile,email \
  --attribute-mapping \
    email=email,name=name,picture=picture,username=id
```

**Sign In with Social Provider**:
```
https://myapp.auth.us-east-1.amazoncognito.com/oauth2/authorize?
  identity_provider=Google&
  redirect_uri=https://myapp.com/callback&
  response_type=CODE&
  client_id=abc123&
  scope=openid email profile
```

### SAML Federation (Enterprise SSO)

**Configure SAML Provider**:
```bash
aws cognito-idp create-identity-provider \
  --user-pool-id us-east-1_abc123 \
  --provider-name Okta \
  --provider-type SAML \
  --provider-details \
    MetadataURL=https://dev-123456.okta.com/app/abc123/sso/saml/metadata \
  --attribute-mapping \
    email=http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress,name=http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name
```

**SSO Login Flow**:
```
1. User clicks "Login with Company SSO"
2. Redirect to Cognito hosted UI
3. Cognito redirects to Okta (SAML IdP)
4. User authenticates with Okta
5. Okta sends SAML assertion to Cognito
6. Cognito creates session, returns tokens
7. User redirected to app with authorization code
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
    SmsConfiguration={SnsCallerArn=arn:aws:iam::123456789012:role/CognitoSNSRole,ExternalId=cognito-sns}
```

**Setup TOTP MFA** (Authenticator App):
```python
def setup_totp_mfa(access_token):
    # Associate software token
    response = cognito.associate_software_token(
        AccessToken=access_token
    )
    
    secret_code = response['SecretCode']
    
    # Generate QR code for user
    # User scans with Google Authenticator / Authy
    qr_code_url = f'otpauth://totp/MyApp:user@example.com?secret={secret_code}&issuer=MyApp'
    
    return qr_code_url

def verify_totp_mfa(access_token, user_code):
    # Verify code from authenticator app
    cognito.verify_software_token(
        AccessToken=access_token,
        UserCode=user_code
    )
    
    # Set as preferred MFA
    cognito.set_user_mfa_preference(
        AccessToken=access_token,
        SoftwareTokenMfaSettings={
            'Enabled': True,
            'PreferredMfa': True
        }
    )
```

**MFA Challenge During Login**:
```python
def handle_mfa_challenge(session):
    # Prompt user for MFA code
    mfa_code = input("Enter MFA code: ")
    
    response = cognito.respond_to_auth_challenge(
        ClientId='abc123',
        ChallengeName='SOFTWARE_TOKEN_MFA',
        Session=session,
        ChallengeResponses={
            'USERNAME': 'user@example.com',
            'SOFTWARE_TOKEN_MFA_CODE': mfa_code
        }
    )
    
    return response['AuthenticationResult']
```

### Advanced Security Features

**Enable Advanced Security**:
```bash
aws cognito-idp set-user-pool-mfa-config \
  --user-pool-id us-east-1_abc123 \
  --user-pool-add-ons \
    AdvancedSecurityMode=ENFORCED
```

**Features**:
```
✅ Compromised Credentials Detection
   - Checks against database of breached passwords
   - Blocks sign-in if credentials compromised

✅ Adaptive Authentication
   - Risk scoring based on:
     * Device fingerprint
     * IP address
     * Geolocation
     * Time of day
   - Triggers MFA for high-risk attempts

✅ Account Takeover Protection
   - Detects unusual sign-in patterns
   - Alerts users of suspicious activity

Pricing: $0.05 per MAU (additional)
```

### Lambda Triggers

**Pre Sign-Up Trigger** (Auto-confirm, custom validation):
```python
def lambda_handler(event, context):
    # Event structure:
    # {
    #   "triggerSource": "PreSignUp_SignUp",
    #   "request": {
    #     "userAttributes": {"email": "user@example.com"},
    #     "validationData": {"referralCode": "FRIEND2025"}
    #   }
    # }
    
    # Validate referral code
    referral_code = event['request']['validationData'].get('referralCode')
    if referral_code != 'FRIEND2025':
        raise Exception("Invalid referral code")
    
    # Auto-confirm email
    event['response']['autoConfirmUser'] = True
    event['response']['autoVerifyEmail'] = True
    
    return event
```

**Post Confirmation Trigger** (Welcome email, create user record):
```python
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')

def lambda_handler(event, context):
    # Create user record in DynamoDB
    table.put_item(
        Item={
            'userId': event['request']['userAttributes']['sub'],
            'email': event['request']['userAttributes']['email'],
            'name': event['request']['userAttributes'].get('name', ''),
            'createdAt': int(time.time()),
            'tier': 'free'
        }
    )
    
    # Send welcome email
    sns = boto3.client('sns')
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123456789012:WelcomeEmails',
        Message=f"Welcome {event['request']['userAttributes']['email']}!"
    )
    
    return event
```

**Pre Token Generation** (Add custom claims):
```python
def lambda_handler(event, context):
    # Add custom claims to ID token
    event['response']['claimsOverrideDetails'] = {
        'claimsToAddOrOverride': {
            'custom:tier': 'premium',
            'custom:subscription': 'annual'
        }
    }
    
    return event
```

**Available Triggers**:
```
Pre sign-up
Post confirmation
Pre authentication
Post authentication
Pre token generation
Custom message (email/SMS customization)
User migration (import from legacy system)
```

# AWS Step Functions: Workflow Orchestration

## Table of Contents
1. [Step Functions Fundamentals](#step-functions-fundamentals)
2. [State Machine Types](#state-machine-types)
3. [State Types](#state-types)
4. [Error Handling](#error-handling)
5. [Saga Pattern](#saga-pattern)
6. [Integration Patterns](#integration-patterns)
7. [LocalStack Examples](#localstack-examples)
8. [Production Patterns](#production-patterns)
9. [Interview Questions](#interview-questions)

---

## Step Functions Fundamentals

### What is Step Functions?

**Definition**: Serverless orchestration service that coordinates distributed applications and microservices using visual workflows called state machines.

**Before Step Functions**:
```python
# Monolithic workflow in single Lambda
def process_order(order_id):
    try:
        # ❌ All steps in one function (timeout risk)
        payment = process_payment(order_id)
        inventory = reserve_inventory(order_id)
        shipping = create_shipment(order_id)
        
        # ❌ Manual error handling
        if not payment:
            raise Exception("Payment failed")
        
        # ❌ No visibility into workflow state
        # ❌ Hard to retry individual steps
        # ❌ 15 minute Lambda timeout
        # ❌ Complex error recovery
        
        return {"status": "success"}
    except Exception as e:
        # ❌ Manual rollback logic
        if inventory:
            unreserve_inventory(order_id)
        return {"status": "failed", "error": str(e)}
```

**With Step Functions**:
```json
{
  "Comment": "Order Processing Workflow",
  "StartAt": "ProcessPayment",
  "States": {
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ProcessPayment",
      "Next": "ReserveInventory",
      "Catch": [{
        "ErrorEquals": ["PaymentError"],
        "Next": "NotifyFailure"
      }]
    },
    "ReserveInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ReserveInventory",
      "Next": "CreateShipment",
      "Catch": [{
        "ErrorEquals": ["InventoryError"],
        "Next": "RefundPayment"
      }]
    },
    "CreateShipment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:CreateShipment",
      "Next": "Success"
    },
    "RefundPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:RefundPayment",
      "Next": "NotifyFailure"
    },
    "NotifyFailure": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:NotifyFailure",
      "End": true
    },
    "Success": {
      "Type": "Succeed"
    }
  }
}
```

**Benefits**:
```
✅ Visual workflow (see execution in console)
✅ Automatic retries (exponential backoff)
✅ Built-in error handling (catch blocks)
✅ Long-running workflows (up to 1 year)
✅ State persistence (survive failures)
✅ Audit trail (execution history)
✅ Parallel processing (concurrent tasks)
✅ Service integrations (Lambda, ECS, SNS, SQS, DynamoDB, etc.)
```

### History & Evolution

```
2016: AWS Step Functions Launch
      - Standard workflows
      - Amazon States Language (ASL)
      - Lambda integration

2017: Service Integrations
      - ECS, Batch, SNS, SQS
      - DynamoDB, Glue

2018: Map State
      - Parallel iteration
      - Dynamic concurrency

2019: Express Workflows
      - High-throughput (100K/sec)
      - Short duration (< 5 min)
      - Lower cost

2020: Nested Workflows
      - Step Functions → Step Functions
      - Reusable components

2021: Workflow Studio
      - Visual drag-and-drop designer
      - Auto-generate ASL

2022: Distributed Map
      - Process S3 objects at scale
      - 10,000+ parallel workers

2023: EventBridge Integration
      - Event-driven workflows
      - Schedule patterns

2024: Enhanced Testing
      - Local testing
      - Mock integrations
```

### Pricing

**Standard Workflows**:
```
State transitions: $0.025 per 1,000 transitions
Free tier: 4,000 transitions/month

Example (Order Processing):
- 10 states per execution
- 100,000 orders/month
- 100K × 10 = 1M transitions
- (1M - 4K) / 1000 × $0.025 = $24.90/month
```

**Express Workflows**:
```
Requests: $1.00 per 1 million requests
Duration: $0.00001667 per GB-second

Example (API Orchestration):
- 10 million requests/month
- 256 MB memory
- 1 second average duration
- Request cost: 10M / 1M × $1 = $10
- Duration cost: 10M × 0.256 × 1 × $0.00001667 = $42.67
- Total: $52.67/month

Standard: $250 for same volume (10M × 10 states / 1000 × $0.025)
Express: 80% cheaper for high-throughput
```

---

## State Machine Types

### Standard Workflows

**Characteristics**:
```
✅ Exactly-once execution
✅ Long duration (up to 1 year)
✅ Audit history (90 days)
✅ Rate: 2,000/second
✅ Pricing: $0.025 / 1,000 transitions
```

**Use Cases**:
```
- Long-running workflows (order processing, ETL jobs)
- Human approval steps (multi-day workflows)
- Audit requirements (compliance, financial)
- Complex orchestration (saga patterns)
```

**Example**:
```bash
aws stepfunctions create-state-machine \
  --name OrderProcessing \
  --type STANDARD \
  --definition file://state-machine.json \
  --role-arn arn:aws:iam::123456789012:role/StepFunctionsRole
```

### Express Workflows

**Characteristics**:
```
✅ At-least-once execution
✅ Short duration (< 5 minutes)
✅ No audit history
✅ Rate: 100,000/second
✅ Pricing: $1 / 1M requests + duration
```

**Two Modes**:

**1. Synchronous Express** (wait for result):
```python
import boto3

sfn = boto3.client('stepfunctions')

response = sfn.start_sync_execution(
    stateMachineArn='arn:aws:states:us-east-1:123456789012:stateMachine:APIOrchestration',
    input='{"userId": "123", "action": "process"}'
)

# Wait for completion (max 5 min)
result = response['output']  # Execution result
status = response['status']  # SUCCEEDED, FAILED, TIMED_OUT
```

**2. Asynchronous Express** (fire-and-forget):
```python
response = sfn.start_execution(
    stateMachineArn='arn:aws:states:us-east-1:123456789012:stateMachine:EventProcessing',
    input='{"event": "user_signup"}'
)

# Returns immediately, execution runs async
execution_arn = response['executionArn']
```

**Use Cases**:
```
Synchronous:
- API backends (API Gateway → Step Functions)
- Real-time data processing
- Low-latency orchestration

Asynchronous:
- Event processing (EventBridge → Step Functions)
- IoT data ingestion
- Log processing
```

---

## State Types

### Task State

**Lambda Integration**:
```json
{
  "ProcessPayment": {
    "Type": "Task",
    "Resource": "arn:aws:states:::lambda:invoke",
    "Parameters": {
      "FunctionName": "ProcessPayment",
      "Payload": {
        "orderId.$": "$.orderId",
        "amount.$": "$.amount"
      }
    },
    "ResultPath": "$.paymentResult",
    "Next": "CheckPaymentStatus"
  }
}
```

**DynamoDB Integration**:
```json
{
  "SaveOrder": {
    "Type": "Task",
    "Resource": "arn:aws:states:::dynamodb:putItem",
    "Parameters": {
      "TableName": "Orders",
      "Item": {
        "orderId": {"S.$": "$.orderId"},
        "status": {"S": "PROCESSING"},
        "timestamp": {"N.$": "$$.State.EnteredTime"}
      }
    },
    "Next": "ProcessOrder"
  }
}
```

**ECS Integration** (Run container task):
```json
{
  "RunDataProcessing": {
    "Type": "Task",
    "Resource": "arn:aws:states:::ecs:runTask.sync",
    "Parameters": {
      "LaunchType": "FARGATE",
      "Cluster": "my-cluster",
      "TaskDefinition": "data-processing",
      "Overrides": {
        "ContainerOverrides": [{
          "Name": "processor",
          "Environment": [{
            "Name": "INPUT_FILE",
            "Value.$": "$.inputFile"
          }]
        }]
      }
    },
    "Next": "CheckResults"
  }
}
```

**SNS Integration**:
```json
{
  "NotifyUser": {
    "Type": "Task",
    "Resource": "arn:aws:states:::sns:publish",
    "Parameters": {
      "TopicArn": "arn:aws:sns:us-east-1:123456789012:OrderNotifications",
      "Message.$": "$.notificationMessage",
      "MessageAttributes": {
        "priority": {
          "DataType": "String",
          "StringValue": "high"
        }
      }
    },
    "End": true
  }
}
```

### Choice State

**Conditional Branching**:
```json
{
  "CheckInventory": {
    "Type": "Choice",
    "Choices": [
      {
        "Variable": "$.inventory.quantity",
        "NumericGreaterThanEquals": 1,
        "Next": "ProcessOrder"
      },
      {
        "Variable": "$.inventory.quantity",
        "NumericEquals": 0,
        "Next": "OutOfStock"
      }
    ],
    "Default": "ErrorState"
  }
}
```

**Complex Conditions**:
```json
{
  "ValidateOrder": {
    "Type": "Choice",
    "Choices": [
      {
        "And": [
          {
            "Variable": "$.amount",
            "NumericGreaterThan": 100
          },
          {
            "Variable": "$.customer.tier",
            "StringEquals": "premium"
          }
        ],
        "Next": "ExpressShipping"
      },
      {
        "Or": [
          {
            "Variable": "$.priority",
            "StringEquals": "urgent"
          },
          {
            "Variable": "$.amount",
            "NumericGreaterThan": 1000
          }
        ],
        "Next": "HighPriorityProcessing"
      }
    ],
    "Default": "StandardProcessing"
  }
}
```

**String Matching**:
```json
{
  "RouteByRegion": {
    "Type": "Choice",
    "Choices": [
      {
        "Variable": "$.region",
        "StringMatches": "us-*",
        "Next": "ProcessInUS"
      },
      {
        "Variable": "$.region",
        "StringMatches": "eu-*",
        "Next": "ProcessInEU"
      }
    ],
    "Default": "ProcessGlobal"
  }
}
```

### Parallel State

**Concurrent Execution**:
```json
{
  "ProcessOrderParallel": {
    "Type": "Parallel",
    "Branches": [
      {
        "StartAt": "ChargePayment",
        "States": {
          "ChargePayment": {
            "Type": "Task",
            "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ChargePayment",
            "End": true
          }
        }
      },
      {
        "StartAt": "ReserveInventory",
        "States": {
          "ReserveInventory": {
            "Type": "Task",
            "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ReserveInventory",
            "End": true
          }
        }
      },
      {
        "StartAt": "SendConfirmationEmail",
        "States": {
          "SendConfirmationEmail": {
            "Type": "Task",
            "Resource": "arn:aws:lambda:us-east-1:123456789012:function:SendEmail",
            "End": true
          }
        }
      }
    ],
    "ResultPath": "$.parallelResults",
    "Next": "CreateShipment"
  }
}
```

**Output** (array of branch results):
```json
{
  "orderId": "123",
  "parallelResults": [
    {"paymentId": "pay_456", "status": "charged"},
    {"inventoryId": "inv_789", "reserved": true},
    {"emailId": "email_012", "sent": true}
  ]
}
```

### Map State

**Iterate Over Array**:
```json
{
  "ProcessItems": {
    "Type": "Map",
    "ItemsPath": "$.items",
    "MaxConcurrency": 10,
    "Iterator": {
      "StartAt": "ValidateItem",
      "States": {
        "ValidateItem": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ValidateItem",
          "Next": "SaveItem"
        },
        "SaveItem": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:123456789012:function:SaveItem",
          "End": true
        }
      }
    },
    "ResultPath": "$.processedItems",
    "Next": "AggregateResults"
  }
}
```

**Input**:
```json
{
  "orderId": "123",
  "items": [
    {"sku": "A001", "quantity": 2},
    {"sku": "A002", "quantity": 1},
    {"sku": "A003", "quantity": 5}
  ]
}
```

**Output**:
```json
{
  "orderId": "123",
  "items": [...],
  "processedItems": [
    {"sku": "A001", "valid": true, "saved": true},
    {"sku": "A002", "valid": true, "saved": true},
    {"sku": "A003", "valid": false, "error": "Out of stock"}
  ]
}
```

**Distributed Map** (S3 objects):
```json
{
  "ProcessS3Files": {
    "Type": "Map",
    "ItemReader": {
      "Resource": "arn:aws:states:::s3:listObjectsV2",
      "Parameters": {
        "Bucket": "my-data-bucket",
        "Prefix": "input/"
      }
    },
    "MaxConcurrency": 1000,
    "Iterator": {
      "StartAt": "ProcessFile",
      "States": {
        "ProcessFile": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ProcessFile",
          "End": true
        }
      }
    }
  }
}
```

### Wait State

**Fixed Duration**:
```json
{
  "WaitForApproval": {
    "Type": "Wait",
    "Seconds": 300,
    "Next": "CheckApprovalStatus"
  }
}
```

**Timestamp**:
```json
{
  "WaitUntilDeadline": {
    "Type": "Wait",
    "Timestamp": "2026-02-01T00:00:00Z",
    "Next": "ProcessScheduledTask"
  }
}
```

**Dynamic Wait** (from input):
```json
{
  "WaitDynamic": {
    "Type": "Wait",
    "SecondsPath": "$.waitTime",
    "Next": "ContinueProcessing"
  }
}
```

### Pass State

**Transform Data**:
```json
{
  "PrepareInput": {
    "Type": "Pass",
    "Result": {
      "status": "initialized",
      "timestamp": "2026-01-31T00:00:00Z"
    },
    "ResultPath": "$.metadata",
    "Next": "ProcessOrder"
  }
}
```

**Filter Data**:
```json
{
  "ExtractUserId": {
    "Type": "Pass",
    "InputPath": "$.user.id",
    "ResultPath": "$.userId",
    "Next": "LoadUserData"
  }
}
```

### Succeed / Fail States

```json
{
  "Success": {
    "Type": "Succeed"
  },
  
  "PaymentFailed": {
    "Type": "Fail",
    "Error": "PaymentError",
    "Cause": "Insufficient funds"
  }
}
```

---

## Error Handling

### Retry Logic

**Exponential Backoff**:
```json
{
  "CallExternalAPI": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:us-east-1:123456789012:function:CallAPI",
    "Retry": [
      {
        "ErrorEquals": ["States.Timeout", "ServiceException"],
        "IntervalSeconds": 2,
        "MaxAttempts": 3,
        "BackoffRate": 2.0
      }
    ],
    "Next": "ProcessResponse"
  }
}
```

**Retry Timeline**:
```
Attempt 1: Fails at t=0s
Wait 2 seconds
Attempt 2: Fails at t=2s
Wait 4 seconds (2 × 2.0)
Attempt 3: Fails at t=6s
Wait 8 seconds (4 × 2.0)
Attempt 4: Fails at t=14s
Error propagates (MaxAttempts=3 exceeded)
```

**Multiple Retry Strategies**:
```json
{
  "Retry": [
    {
      "ErrorEquals": ["States.Timeout"],
      "IntervalSeconds": 1,
      "MaxAttempts": 2,
      "BackoffRate": 1.5
    },
    {
      "ErrorEquals": ["ServiceException"],
      "IntervalSeconds": 5,
      "MaxAttempts": 5,
      "BackoffRate": 2.0
    },
    {
      "ErrorEquals": ["States.ALL"],
      "IntervalSeconds": 10,
      "MaxAttempts": 1,
      "BackoffRate": 1.0
    }
  ]
}
```

### Catch Blocks

**Error Handling**:
```json
{
  "ProcessPayment": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ProcessPayment",
    "Catch": [
      {
        "ErrorEquals": ["InsufficientFundsError"],
        "ResultPath": "$.error",
        "Next": "NotifyInsufficientFunds"
      },
      {
        "ErrorEquals": ["PaymentGatewayError"],
        "ResultPath": "$.error",
        "Next": "RetryWithBackupGateway"
      },
      {
        "ErrorEquals": ["States.ALL"],
        "ResultPath": "$.error",
        "Next": "NotifyAdminFailure"
      }
    ],
    "Next": "ConfirmPayment"
  }
}
```

**Error Object**:
```json
{
  "orderId": "123",
  "amount": 99.99,
  "error": {
    "Error": "InsufficientFundsError",
    "Cause": "{\"message\": \"Card declined\", \"code\": \"insufficient_funds\"}"
  }
}
```

**Preserve Original Input**:
```json
{
  "Catch": [
    {
      "ErrorEquals": ["States.ALL"],
      "ResultPath": "$.errorInfo",  // Add error to input
      "Next": "HandleError"
    }
  ]
}
```

---

## Saga Pattern

### Distributed Transactions

**Problem**: Book flight + hotel + car atomically

**Without Saga** (brittle):
```python
def book_trip(trip_id):
    flight = book_flight(trip_id)
    hotel = book_hotel(trip_id)
    car = book_car(trip_id)
    
    # ❌ What if hotel fails? Flight already booked!
    # ❌ Manual rollback logic
    # ❌ Hard to recover from partial failures
```

**With Saga Pattern**:
```json
{
  "Comment": "Trip Booking Saga",
  "StartAt": "BookFlight",
  "States": {
    "BookFlight": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:BookFlight",
      "ResultPath": "$.flightBooking",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "ResultPath": "$.error",
        "Next": "BookingFailed"
      }],
      "Next": "BookHotel"
    },
    "BookHotel": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:BookHotel",
      "ResultPath": "$.hotelBooking",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "ResultPath": "$.error",
        "Next": "CancelFlight"
      }],
      "Next": "BookCar"
    },
    "BookCar": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:BookCar",
      "ResultPath": "$.carBooking",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "ResultPath": "$.error",
        "Next": "CancelHotel"
      }],
      "Next": "BookingSuccess"
    },
    "CancelHotel": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:CancelHotel",
      "ResultPath": "$.hotelCancellation",
      "Next": "CancelFlight"
    },
    "CancelFlight": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:CancelFlight",
      "ResultPath": "$.flightCancellation",
      "Next": "BookingFailed"
    },
    "BookingSuccess": {
      "Type": "Succeed"
    },
    "BookingFailed": {
      "Type": "Fail",
      "Error": "BookingError",
      "Cause": "Trip booking failed, all reservations cancelled"
    }
  }
}
```

**Compensating Transactions**:
```
Success Path:
BookFlight → BookHotel → BookCar → Success

Error Paths:
BookFlight → FAIL
  → BookingFailed

BookFlight → BookHotel → FAIL
  → CancelFlight → BookingFailed

BookFlight → BookHotel → BookCar → FAIL
  → CancelHotel → CancelFlight → BookingFailed
```

**Lambda Functions**:

```python
# book_flight.py
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Bookings')

def lambda_handler(event, context):
    trip_id = event['tripId']
    
    # Book flight
    booking_id = f"flight_{trip_id}"
    
    table.put_item(
        Item={
            'bookingId': booking_id,
            'type': 'flight',
            'status': 'confirmed',
            'tripId': trip_id,
            'details': event['flight']
        }
    )
    
    return {
        'bookingId': booking_id,
        'status': 'confirmed'
    }

# cancel_flight.py
def lambda_handler(event, context):
    booking_id = event['flightBooking']['bookingId']
    
    table.update_item(
        Key={'bookingId': booking_id},
        UpdateExpression='SET #status = :status',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={':status': 'cancelled'}
    )
    
    return {'cancelled': True}
```

---

## Integration Patterns

### Request-Response (Default)

```json
{
  "ProcessData": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:us-east-1:123456789012:function:Process",
    "Next": "NextState"
  }
}
```

**Behavior**: Wait for Lambda to complete, return result

### Run a Job (.sync)

**ECS Task** (wait for completion):
```json
{
  "RunBatchJob": {
    "Type": "Task",
    "Resource": "arn:aws:states:::ecs:runTask.sync",
    "Parameters": {
      "Cluster": "batch-cluster",
      "TaskDefinition": "data-processing"
    },
    "Next": "ProcessResults"
  }
}
```

**Batch Job**:
```json
{
  "RunBatchJob": {
    "Type": "Task",
    "Resource": "arn:aws:states:::batch:submitJob.sync",
    "Parameters": {
      "JobDefinition": "processing-job",
      "JobName": "data-processing",
      "JobQueue": "processing-queue"
    },
    "Next": "CheckResults"
  }
}
```

### Wait for Callback (.waitForTaskToken)

**Human Approval Workflow**:
```json
{
  "RequestApproval": {
    "Type": "Task",
    "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
    "Parameters": {
      "FunctionName": "SendApprovalRequest",
      "Payload": {
        "taskToken.$": "$$.Task.Token",
        "orderId.$": "$.orderId",
        "amount.$": "$.amount"
      }
    },
    "TimeoutSeconds": 86400,
    "Next": "ProcessApproval"
  }
}
```

**Send Approval Lambda**:
```python
import boto3

sns = boto3.client('sns')

def lambda_handler(event, context):
    task_token = event['taskToken']
    order_id = event['orderId']
    amount = event['amount']
    
    # Store task token in database
    table.put_item(
        Item={
            'orderId': order_id,
            'taskToken': task_token,
            'status': 'pending'
        }
    )
    
    # Send approval email
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123456789012:Approvals',
        Subject=f'Approval Required: Order {order_id}',
        Message=f'Amount: ${amount}\nApprove at: https://app.com/approve/{order_id}'
    )
    
    # Workflow pauses here until SendTaskSuccess/SendTaskFailure
```

**Approval Endpoint**:
```python
import boto3

sfn = boto3.client('stepfunctions')

def approve_order(order_id):
    # Get task token from database
    response = table.get_item(Key={'orderId': order_id})
    task_token = response['Item']['taskToken']
    
    # Resume workflow
    sfn.send_task_success(
        taskToken=task_token,
        output='{"approved": true, "approver": "admin@example.com"}'
    )

def reject_order(order_id, reason):
    response = table.get_item(Key={'orderId': order_id})
    task_token = response['Item']['taskToken']
    
    sfn.send_task_failure(
        taskToken=task_token,
        error='ApprovalRejected',
        cause=reason
    )
```

---

## LocalStack Examples

### Docker Compose Setup

```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=stepfunctions,lambda,dynamodb,sns,sqs
      - DEBUG=1
      - LAMBDA_EXECUTOR=docker
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "./localstack:/etc/localstack/init/ready.d"
```

### Order Processing Workflow

**State Machine** (`order-workflow.json`):
```json
{
  "Comment": "E-commerce Order Processing",
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:000000000000:function:ValidateOrder",
      "ResultPath": "$.validation",
      "Next": "CheckValidation"
    },
    "CheckValidation": {
      "Type": "Choice",
      "Choices": [{
        "Variable": "$.validation.valid",
        "BooleanEquals": true,
        "Next": "ProcessPayment"
      }],
      "Default": "OrderInvalid"
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:000000000000:function:ProcessPayment",
      "ResultPath": "$.payment",
      "Retry": [{
        "ErrorEquals": ["ServiceException"],
        "IntervalSeconds": 2,
        "MaxAttempts": 3,
        "BackoffRate": 2.0
      }],
      "Catch": [{
        "ErrorEquals": ["PaymentError"],
        "ResultPath": "$.error",
        "Next": "PaymentFailed"
      }],
      "Next": "ReserveInventory"
    },
    "ReserveInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:000000000000:function:ReserveInventory",
      "ResultPath": "$.inventory",
      "Catch": [{
        "ErrorEquals": ["OutOfStockError"],
        "ResultPath": "$.error",
        "Next": "RefundPayment"
      }],
      "Next": "CreateShipment"
    },
    "CreateShipment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:000000000000:function:CreateShipment",
      "ResultPath": "$.shipment",
      "Next": "NotifySuccess"
    },
    "NotifySuccess": {
      "Type": "Task",
      "Resource": "arn:aws:states:::sns:publish",
      "Parameters": {
        "TopicArn": "arn:aws:sns:us-east-1:000000000000:OrderNotifications",
        "Message.$": "$.orderId"
      },
      "Next": "OrderComplete"
    },
    "RefundPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:000000000000:function:RefundPayment",
      "Next": "OrderFailed"
    },
    "PaymentFailed": {
      "Type": "Fail",
      "Error": "PaymentError",
      "Cause": "Payment processing failed"
    },
    "OrderInvalid": {
      "Type": "Fail",
      "Error": "ValidationError",
      "Cause": "Order validation failed"
    },
    "OrderFailed": {
      "Type": "Fail",
      "Error": "OrderError",
      "Cause": "Order processing failed"
    },
    "OrderComplete": {
      "Type": "Succeed"
    }
  }
}
```

**Lambda Functions**:

```python
# validate_order.py
def lambda_handler(event, context):
    order_id = event['orderId']
    amount = event['amount']
    
    valid = amount > 0 and amount < 10000
    
    return {
        'valid': valid,
        'reason': 'OK' if valid else 'Invalid amount'
    }

# process_payment.py
import random

def lambda_handler(event, context):
    order_id = event['orderId']
    amount = event['amount']
    
    # Simulate payment processing
    if random.random() < 0.9:  # 90% success rate
        return {
            'paymentId': f'pay_{order_id}',
            'status': 'charged',
            'amount': amount
        }
    else:
        raise Exception('Payment gateway error')

# reserve_inventory.py
def lambda_handler(event, context):
    order_id = event['orderId']
    items = event['items']
    
    # Simulate inventory check
    if random.random() < 0.95:  # 95% in stock
        return {
            'reservationId': f'res_{order_id}',
            'status': 'reserved'
        }
    else:
        class OutOfStockError(Exception):
            pass
        raise OutOfStockError('Item out of stock')

# create_shipment.py
def lambda_handler(event, context):
    order_id = event['orderId']
    
    return {
        'shipmentId': f'ship_{order_id}',
        'carrier': 'UPS',
        'tracking': f'1Z{order_id}',
        'estimatedDelivery': '2026-02-05'
    }

# refund_payment.py
def lambda_handler(event, context):
    payment_id = event['payment']['paymentId']
    
    return {
        'refundId': f'ref_{payment_id}',
        'status': 'refunded'
    }
```

**Deploy Script** (`deploy.sh`):
```bash
#!/bin/bash

# Create Lambda functions
for func in validate_order process_payment reserve_inventory create_shipment refund_payment; do
  zip ${func}.zip ${func}.py
  
  awslocal lambda create-function \
    --function-name ${func^} \
    --runtime python3.11 \
    --role arn:aws:iam::000000000000:role/lambda-role \
    --handler ${func}.lambda_handler \
    --zip-file fileb://${func}.zip
done

# Create SNS topic
awslocal sns create-topic --name OrderNotifications

# Create state machine
awslocal stepfunctions create-state-machine \
  --name OrderProcessing \
  --definition file://order-workflow.json \
  --role-arn arn:aws:iam::000000000000:role/stepfunctions-role

echo "Deployment complete!"
```

**Execute Workflow**:
```bash
# Start execution
awslocal stepfunctions start-execution \
  --state-machine-arn arn:aws:states:us-east-1:000000000000:stateMachine:OrderProcessing \
  --input '{
    "orderId": "order-123",
    "amount": 99.99,
    "items": [
      {"sku": "A001", "quantity": 2}
    ]
  }'

# Get execution ARN from output
EXECUTION_ARN="arn:aws:states:us-east-1:000000000000:execution:OrderProcessing:execution-id"

# Check status
awslocal stepfunctions describe-execution \
  --execution-arn $EXECUTION_ARN

# Get execution history
awslocal stepfunctions get-execution-history \
  --execution-arn $EXECUTION_ARN
```

**Go Client**:
```go
package main

import (
    "encoding/json"
    "fmt"
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/sfn"
)

type OrderInput struct {
    OrderID string  `json:"orderId"`
    Amount  float64 `json:"amount"`
    Items   []Item  `json:"items"`
}

type Item struct {
    SKU      string `json:"sku"`
    Quantity int    `json:"quantity"`
}

func main() {
    sess := session.Must(session.NewSession(&aws.Config{
        Region:   aws.String("us-east-1"),
        Endpoint: aws.String("http://localhost:4566"),
    }))
    
    client := sfn.New(sess)
    
    // Create order input
    order := OrderInput{
        OrderID: "order-456",
        Amount:  149.99,
        Items: []Item{
            {SKU: "A002", Quantity: 1},
        },
    }
    
    inputJSON, _ := json.Marshal(order)
    
    // Start execution
    result, err := client.StartExecution(&sfn.StartExecutionInput{
        StateMachineArn: aws.String("arn:aws:states:us-east-1:000000000000:stateMachine:OrderProcessing"),
        Input:           aws.String(string(inputJSON)),
    })
    
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Execution started: %s\n", *result.ExecutionArn)
    
    // Wait and check status
    describeResult, _ := client.DescribeExecution(&sfn.DescribeExecutionInput{
        ExecutionArn: result.ExecutionArn,
    })
    
    fmt.Printf("Status: %s\n", *describeResult.Status)
}
```

---

## Production Patterns

### Long-Running Workflows

**Multi-Day Order Processing**:
```json
{
  "Comment": "Order with Manufacturing",
  "StartAt": "ProcessPayment",
  "States": {
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ProcessPayment",
      "Next": "WaitForManufacturing"
    },
    "WaitForManufacturing": {
      "Type": "Wait",
      "Seconds": 259200,
      "Next": "CheckManufacturingStatus"
    },
    "CheckManufacturingStatus": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:CheckStatus",
      "Next": "IsManufacturingComplete"
    },
    "IsManufacturingComplete": {
      "Type": "Choice",
      "Choices": [{
        "Variable": "$.status",
        "StringEquals": "complete",
        "Next": "ShipOrder"
      }],
      "Default": "WaitForManufacturing"
    },
    "ShipOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ShipOrder",
      "End": true
    }
  }
}
```

### Event-Driven Workflows

**EventBridge → Step Functions**:
```json
{
  "Source": ["aws.s3"],
  "DetailType": ["Object Created"],
  "Detail": {
    "bucket": {
      "name": ["data-uploads"]
    }
  }
}
```

**EventBridge Rule**:
```bash
aws events put-rule \
  --name S3UploadProcessing \
  --event-pattern file://event-pattern.json

aws events put-targets \
  --rule S3UploadProcessing \
  --targets \
    "Id"="1","Arn"="arn:aws:states:us-east-1:123456789012:stateMachine:DataProcessing","RoleArn"="arn:aws:iam::123456789012:role/EventBridgeStepFunctions"
```

**Data Processing Workflow**:
```json
{
  "StartAt": "ValidateFile",
  "States": {
    "ValidateFile": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ValidateFile",
      "Parameters": {
        "bucket.$": "$.detail.bucket.name",
        "key.$": "$.detail.object.key"
      },
      "Next": "ProcessData"
    },
    "ProcessData": {
      "Type": "Map",
      "ItemsPath": "$.records",
      "MaxConcurrency": 100,
      "Iterator": {
        "StartAt": "TransformRecord",
        "States": {
          "TransformRecord": {
            "Type": "Task",
            "Resource": "arn:aws:lambda:us-east-1:123456789012:function:Transform",
            "End": true
          }
        }
      },
      "Next": "AggregateResults"
    },
    "AggregateResults": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:Aggregate",
      "End": true
    }
  }
}
```

### Nested Workflows

**Parent Workflow**:
```json
{
  "StartAt": "ProcessOrders",
  "States": {
    "ProcessOrders": {
      "Type": "Map",
      "ItemsPath": "$.orders",
      "MaxConcurrency": 10,
      "Iterator": {
        "StartAt": "StartOrderWorkflow",
        "States": {
          "StartOrderWorkflow": {
            "Type": "Task",
            "Resource": "arn:aws:states:::states:startExecution.sync:2",
            "Parameters": {
              "StateMachineArn": "arn:aws:states:us-east-1:123456789012:stateMachine:OrderProcessing",
              "Input": {
                "orderId.$": "$.orderId",
                "amount.$": "$.amount"
              }
            },
            "End": true
          }
        }
      },
      "Next": "GenerateReport"
    },
    "GenerateReport": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:GenerateReport",
      "End": true
    }
  }
}
```

### Circuit Breaker Pattern

```json
{
  "StartAt": "CheckCircuitBreaker",
  "States": {
    "CheckCircuitBreaker": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:CheckCircuitBreaker",
      "Next": "IsCircuitOpen"
    },
    "IsCircuitOpen": {
      "Type": "Choice",
      "Choices": [{
        "Variable": "$.circuitOpen",
        "BooleanEquals": false,
        "Next": "CallExternalService"
      }],
      "Default": "CircuitOpen"
    },
    "CallExternalService": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:CallService",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "IncrementFailureCount"
      }],
      "Next": "ResetCircuitBreaker"
    },
    "IncrementFailureCount": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:IncrementFailures",
      "Next": "ServiceFailed"
    },
    "ResetCircuitBreaker": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:ResetCircuitBreaker",
      "Next": "Success"
    },
    "CircuitOpen": {
      "Type": "Fail",
      "Error": "CircuitBreakerOpen",
      "Cause": "Service temporarily unavailable"
    },
    "ServiceFailed": {
      "Type": "Fail",
      "Error": "ServiceError",
      "Cause": "External service call failed"
    },
    "Success": {
      "Type": "Succeed"
    }
  }
}
```

---

## Interview Questions

### Q1: When would you choose Standard vs Express workflows?

**Answer**:

**Standard Workflows**:
```
Use when:
- Need audit history (compliance, financial)
- Long-running processes (hours to days)
- Exactly-once execution required
- Complex error handling with retries

Examples:
- Order processing (days for manufacturing)
- Approval workflows (human in loop)
- ETL jobs (multi-hour processing)
- Saga patterns (distributed transactions)

Cost: $0.025 / 1,000 transitions
```

**Express Workflows**:
```
Use when:
- High-throughput (>2K/sec)
- Short duration (< 5 min)
- At-least-once acceptable
- Cost-sensitive at scale

Examples:
- API orchestration (API Gateway backend)
- Real-time data processing
- IoT event handling
- Microservice coordination

Cost: $1 / 1M requests (80% cheaper at scale)

Synchronous Express:
- API Gateway integration
- Return result to caller

Asynchronous Express:
- EventBridge trigger
- Fire-and-forget
```

**Decision Matrix**:
```
Standard if:
✅ Duration > 5 minutes
✅ Audit trail required
✅ Exactly-once critical

Express if:
✅ High volume (>10K/sec)
✅ Cost optimization needed
✅ Short-lived (< 5 min)
```

### Q2: How do you implement saga pattern for distributed transactions?

**Answer**:

**Saga Pattern** = Sequence of local transactions + compensating transactions

**Example: E-Commerce Order**:
```
Forward Path (Success):
1. Reserve Inventory → inventory reserved
2. Charge Payment → payment processed
3. Create Shipment → order shipped
4. Update Loyalty Points → points added

Backward Path (Rollback):
If any step fails:
1. Remove Loyalty Points
2. Cancel Shipment
3. Refund Payment
4. Release Inventory

Each step has compensating action
```

**Implementation**:
```json
{
  "States": {
    "ReserveInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:function:ReserveInventory",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "SagaFailed"
      }],
      "Next": "ChargePayment"
    },
    "ChargePayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:function:ChargePayment",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "ReleaseInventory"
      }],
      "Next": "CreateShipment"
    },
    "CreateShipment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:function:CreateShipment",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "RefundPayment"
      }],
      "Next": "Success"
    },
    
    "RefundPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:function:RefundPayment",
      "Next": "ReleaseInventory"
    },
    "ReleaseInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:function:ReleaseInventory",
      "Next": "SagaFailed"
    }
  }
}
```

**Key Principles**:
```
1. Idempotency
   - Each action can be retried safely
   - Use unique transaction IDs

2. Compensating Transactions
   - Reverse effects of previous steps
   - May not restore exact previous state
   - Example: Refund instead of "undo charge"

3. Ordering
   - Most likely to fail first
   - Minimize compensations

4. State Persistence
   - Store transaction state
   - Enable recovery after crashes

5. Timeout Handling
   - Maximum duration per step
   - Auto-compensate on timeout
```

### Q3: How do you handle errors and retries in Step Functions?

**Answer**:

**Retry Strategy**:
```json
{
  "Retry": [
    {
      "ErrorEquals": ["States.Timeout"],
      "IntervalSeconds": 1,
      "MaxAttempts": 2,
      "BackoffRate": 1.0
    },
    {
      "ErrorEquals": ["ServiceException", "ThrottlingException"],
      "IntervalSeconds": 2,
      "MaxAttempts": 5,
      "BackoffRate": 2.0
    },
    {
      "ErrorEquals": ["States.ALL"],
      "IntervalSeconds": 5,
      "MaxAttempts": 3,
      "BackoffRate": 2.0
    }
  ]
}
```

**Exponential Backoff**:
```
IntervalSeconds: 2
BackoffRate: 2.0
MaxAttempts: 4

Timeline:
Attempt 1: t=0, fails
Wait 2 seconds
Attempt 2: t=2, fails
Wait 4 seconds (2 × 2.0)
Attempt 3: t=6, fails
Wait 8 seconds (4 × 2.0)
Attempt 4: t=14, fails
Error propagates
```

**Catch Blocks**:
```json
{
  "Catch": [
    {
      "ErrorEquals": ["CustomBusinessError"],
      "ResultPath": "$.error",
      "Next": "HandleBusinessError"
    },
    {
      "ErrorEquals": ["States.Timeout", "States.TaskFailed"],
      "ResultPath": "$.error",
      "Next": "HandleSystemError"
    },
    {
      "ErrorEquals": ["States.ALL"],
      "ResultPath": "$.error",
      "Next": "FallbackHandler"
    }
  ]
}
```

**Error Types**:
```
States.ALL - Wildcard
States.Timeout - Task timeout
States.TaskFailed - Task failed
States.Permissions - IAM error
States.ResultPathMatchFailure - JSON path error
States.ParameterPathFailure - Parameter error
States.BranchFailed - Parallel branch failed
States.NoChoiceMatched - Choice default missing

Custom Errors:
- PaymentError
- InventoryError
- ValidationError
```

**Best Practices**:
```
1. Specific before generic
   - Catch specific errors first
   - States.ALL as fallback

2. Preserve input with ResultPath
   - ResultPath: "$.error" adds error
   - ResultPath: null discards error

3. Retry transient errors
   - Network timeouts: retry
   - Business errors: don't retry

4. Circuit breaker for external services
   - Track failure rate
   - Open circuit after threshold

5. Dead letter queue for failed executions
   - SNS notification
   - Store in DynamoDB for analysis
```

### Q4: How do you implement human-in-the-loop approval workflows?

**Answer**:

**Pattern**: `.waitForTaskToken` integration

**Workflow**:
```json
{
  "States": {
    "RequestApproval": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
      "Parameters": {
        "FunctionName": "SendApprovalRequest",
        "Payload": {
          "taskToken.$": "$$.Task.Token",
          "requestId.$": "$.requestId",
          "amount.$": "$.amount",
          "requester.$": "$.requester"
        }
      },
      "TimeoutSeconds": 86400,
      "Catch": [{
        "ErrorEquals": ["States.Timeout"],
        "Next": "ApprovalTimeout"
      }],
      "Next": "ProcessApproved"
    }
  }
}
```

**Send Approval Lambda**:
```python
import boto3

dynamodb = boto3.resource('dynamodb')
ses = boto3.client('ses')

def lambda_handler(event, context):
    task_token = event['taskToken']
    request_id = event['requestId']
    amount = event['amount']
    
    # Store task token
    table = dynamodb.Table('ApprovalRequests')
    table.put_item(
        Item={
            'requestId': request_id,
            'taskToken': task_token,
            'amount': amount,
            'status': 'pending',
            'createdAt': int(time.time())
        }
    )
    
    # Send email with approval link
    approve_url = f'https://app.com/approve/{request_id}'
    reject_url = f'https://app.com/reject/{request_id}'
    
    ses.send_email(
        Source='approvals@company.com',
        Destination={'ToAddresses': ['manager@company.com']},
        Message={
            'Subject': {'Data': f'Approval Required: ${amount}'},
            'Body': {
                'Html': {
                    'Data': f'''
                        <p>Amount: ${amount}</p>
                        <a href="{approve_url}">Approve</a>
                        <a href="{reject_url}">Reject</a>
                    '''
                }
            }
        }
    )
    
    # Workflow pauses here
```

**Approval API**:
```python
import boto3

sfn = boto3.client('stepfunctions')
dynamodb = boto3.resource('dynamodb')

def approve(request_id):
    table = dynamodb.Table('ApprovalRequests')
    
    # Get task token
    response = table.get_item(Key={'requestId': request_id})
    task_token = response['Item']['taskToken']
    
    # Update status
    table.update_item(
        Key={'requestId': request_id},
        UpdateExpression='SET #status = :status, approvedAt = :timestamp',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={
            ':status': 'approved',
            ':timestamp': int(time.time())
        }
    )
    
    # Resume workflow
    sfn.send_task_success(
        taskToken=task_token,
        output=json.dumps({
            'approved': True,
            'approver': 'manager@company.com',
            'timestamp': int(time.time())
        })
    )

def reject(request_id, reason):
    response = table.get_item(Key={'requestId': request_id})
    task_token = response['Item']['taskToken']
    
    table.update_item(
        Key={'requestId': request_id},
        UpdateExpression='SET #status = :status',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={':status': 'rejected'}
    )
    
    sfn.send_task_failure(
        taskToken=task_token,
        error='ApprovalRejected',
        cause=reason
    )
```

**Timeout Handling**:
```json
{
  "ApprovalTimeout": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:function:NotifyTimeout",
    "Next": "EscalateToSeniorManager"
  }
}
```

**Best Practices**:
```
1. Store task tokens securely
   - DynamoDB with TTL (auto-delete old)
   - Encrypt sensitive data

2. Set reasonable timeouts
   - 24 hours for standard approvals
   - 1 hour for urgent requests

3. Implement escalation
   - Timeout → escalate to senior
   - Auto-approve low amounts

4. Audit trail
   - Log all approvals/rejections
   - Store approver identity

5. Notification channels
   - Email for standard
   - SMS/Slack for urgent
```

### Q5: How do you optimize Step Functions costs?

**Answer**:

**Cost Factors**:
```
Standard: $0.025 / 1,000 state transitions
Express: $1 / 1M requests + duration

Example:
10M executions/month
10 states/execution
Standard: 10M × 10 / 1000 × $0.025 = $2,500
Express: 10M / 1M × $1 + duration = $10 + duration
```

**Optimization Strategies**:

**1. Reduce State Transitions**:
```json
// ❌ Bad: 5 transitions
{
  "GetUserData": {"Type": "Task", "Next": "GetOrderData"},
  "GetOrderData": {"Type": "Task", "Next": "GetInventoryData"},
  "GetInventoryData": {"Type": "Task", "Next": "ProcessData"},
  "ProcessData": {"Type": "Task", "Next": "SaveResult"},
  "SaveResult": {"Type": "Task", "End": true}
}

// ✅ Good: 2 transitions (parallel fetch)
{
  "FetchData": {
    "Type": "Parallel",
    "Branches": [
      {"StartAt": "GetUserData", "States": {...}},
      {"StartAt": "GetOrderData", "States": {...}},
      {"StartAt": "GetInventoryData", "States": {...}}
    ],
    "Next": "ProcessAndSave"
  },
  "ProcessAndSave": {
    "Type": "Task",
    "End": true
  }
}

Savings: 5 → 2 transitions (60% reduction)
```

**2. Batch Processing**:
```json
// ❌ Bad: 1000 executions
Start workflow for each item (1000 items)
Cost: 1000 executions × 10 states = 10,000 transitions

// ✅ Good: 1 execution with Map state
{
  "ProcessItems": {
    "Type": "Map",
    "ItemsPath": "$.items",
    "MaxConcurrency": 40,
    "Iterator": {...}
  }
}

Cost: 1 execution × 1000 iterations × 2 states = 2,000 transitions
Savings: 80%
```

**3. Use Express for High-Throughput**:
```
API orchestration (1M requests/day):
Standard: 1M × 5 states / 1000 × $0.025 = $125/day
Express: 1M / 1M × $1 = $1/day

Savings: 99%
```

**4. Avoid Unnecessary Wait States**:
```json
// ❌ Bad: Polling every second
{
  "CheckStatus": {"Type": "Task", "Next": "Wait"},
  "Wait": {"Type": "Wait", "Seconds": 1, "Next": "CheckStatus"}
}
// 3600 transitions/hour for 1-hour workflow

// ✅ Good: Event-driven
{
  "StartJob": {"Type": "Task", "Next": "WaitForCallback"},
  "WaitForCallback": {
    "Type": "Task",
    "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
    "End": true
  }
}
// 2 transitions total

Or EventBridge:
Job completion → EventBridge → Resume workflow
```

**5. Optimize Lambda Duration**:
```python
# ❌ Bad: Lambda includes wait time
def lambda_handler(event, context):
    result = call_api()
    time.sleep(60)  # Wait for processing
    return check_result()

# Express workflow charges for duration
# 60 seconds × 10M requests = massive cost

# ✅ Good: Use Wait state
{
  "CallAPI": {"Type": "Task", "Next": "Wait"},
  "Wait": {"Type": "Wait", "Seconds": 60, "Next": "CheckResult"}
}

# No Lambda cost during wait
```

**6. Right-Size Express Workflows**:
```
Express duration pricing: $0.00001667/GB-second

256 MB vs 1024 MB (if 256 MB sufficient):
1M requests × 1 second:
- 256 MB: 1M × 0.256 × 1 × $0.00001667 = $4.27
- 1024 MB: 1M × 1.024 × 1 × $0.00001667 = $17.07

Savings: 75%
```

**Cost Monitoring**:
```python
# CloudWatch metrics
ExecutionsStarted
ExecutionsSucceeded
ExecutionsFailed
ExecutionTime

# Cost calculation
transitions = ExecutionsSucceeded × avg_states_per_execution
cost = transitions / 1000 × $0.025
```

This completes the comprehensive Step Functions guide! Next, I'll create the CloudWatch & Observability file.

