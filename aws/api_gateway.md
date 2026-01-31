# AWS API Gateway: Building Serverless APIs

## Table of Contents
1. [Introduction and History](#introduction-and-history)
2. [API Types: REST vs HTTP vs WebSocket](#api-types-rest-vs-http-vs-websocket)
3. [REST API Deep Dive](#rest-api-deep-dive)
4. [HTTP APIs](#http-apis)
5. [WebSocket APIs](#websocket-apis)
6. [Authentication and Authorization](#authentication-and-authorization)
7. [Request Validation and Transformation](#request-validation-and-transformation)
8. [Caching and Performance](#caching-and-performance)
9. [API Stages and Deployment](#api-stages-and-deployment)
10. [LocalStack Examples](#localstack-examples)
11. [Interview Questions](#interview-questions)

---

## Introduction and History

### The Genesis of API Gateway (2015)

AWS API Gateway launched in **July 2015** to enable developers to create, publish, and manage APIs for serverless applications without managing infrastructure.

**Key Milestones:**
- **2015**: REST APIs launched with Lambda integration
- **2016**: API Keys and Usage Plans for throttling
- **2017**: Custom domain names and VPC Link
- **2018**: WebSocket APIs for real-time bidirectional communication
- **2019**: HTTP APIs launched (71% cheaper, lower latency)
- **2020**: HTTP APIs added JWT authorizers
- **2021**: Mutual TLS authentication support
- **2022**: Enhanced observability with X-Ray tracing
- **2023**: HTTP APIs feature parity with REST APIs

### Why API Gateway Exists

**Before API Gateway:**
- Deploy and manage API servers (EC2, ALB, Nginx)
- Handle authentication/authorization manually
- Implement rate limiting and throttling
- Manage SSL certificates
- Monitor API usage and logs

**With API Gateway:**
- Fully managed, auto-scaling API frontend
- Built-in authentication (API Keys, Lambda Authorizers, Cognito)
- Automatic throttling (10,000 req/sec default)
- Integrated with CloudWatch for monitoring
- Pay per request ($1 per million for HTTP APIs)

---

## API Types: REST vs HTTP vs WebSocket

### Comparison Table

| Feature | REST API | HTTP API | WebSocket API |
|---------|----------|----------|---------------|
| **Use Case** | Full-featured APIs | Simple, low-cost APIs | Real-time bidirectional |
| **Latency** | ~100ms | ~50ms (71% lower) | ~10ms persistent connection |
| **Cost** | $3.50 per million | $1.00 per million | $1.00 per million + connection |
| **Caching** | Yes | No | No |
| **API Keys** | Yes | No | No |
| **Usage Plans** | Yes | No | No |
| **Request Validation** | Yes | Yes | Limited |
| **Mock Responses** | Yes | No | No |
| **CORS** | Manual configuration | Automatic | N/A |
| **Authorizers** | Lambda, Cognito, IAM | Lambda (JWT), IAM | Lambda, IAM |
| **WebSocket** | No | No | Yes |

**Decision Matrix:**

```
Need caching, API keys, usage plans? → REST API
Need lowest cost + simplest setup? → HTTP API
Need real-time bidirectional communication? → WebSocket API
```

---

## REST API Deep Dive

### Creating a REST API

```python
import boto3
import json

apigateway = boto3.client('apigateway', endpoint_url='http://localhost:4566')
lambda_client = boto3.client('lambda', endpoint_url='http://localhost:4566')

# Create REST API
api_response = apigateway.create_rest_api(
    name='MyRESTAPI',
    description='Example REST API',
    endpointConfiguration={'types': ['REGIONAL']}  # REGIONAL, EDGE, PRIVATE
)

api_id = api_response['id']
print(f"Created API: {api_id}")

# Get root resource
resources = apigateway.get_resources(restApiId=api_id)
root_id = resources['items'][0]['id']

# Create /users resource
users_resource = apigateway.create_resource(
    restApiId=api_id,
    parentId=root_id,
    pathPart='users'
)

users_resource_id = users_resource['id']

# Create GET /users method
apigateway.put_method(
    restApiId=api_id,
    resourceId=users_resource_id,
    httpMethod='GET',
    authorizationType='NONE'
)

# Integrate with Lambda
lambda_arn = 'arn:aws:lambda:us-east-1:123456789012:function:GetUsers'

apigateway.put_integration(
    restApiId=api_id,
    resourceId=users_resource_id,
    httpMethod='GET',
    type='AWS_PROXY',  # Lambda proxy integration
    integrationHttpMethod='POST',  # Always POST for Lambda
    uri=f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/{lambda_arn}/invocations'
)

# Deploy API
deployment = apigateway.create_deployment(
    restApiId=api_id,
    stageName='dev'
)

invoke_url = f"https://{api_id}.execute-api.us-east-1.amazonaws.com/dev"
print(f"API URL: {invoke_url}/users")
```

### Resource Hierarchy

```
/ (root)
├── /users
│   ├── GET (list users)
│   ├── POST (create user)
│   └── /{userId}
│       ├── GET (get user)
│       ├── PUT (update user)
│       └── DELETE (delete user)
└── /products
    ├── GET (list products)
    └── /{productId}
        └── GET (get product)
```

### Integration Types

#### 1. Lambda Proxy Integration (Recommended)

Request sent directly to Lambda with full context:

```python
# Lambda function receives full request
def lambda_handler(event, context):
    """
    event = {
        'httpMethod': 'GET',
        'path': '/users/123',
        'pathParameters': {'userId': '123'},
        'queryStringParameters': {'includeOrders': 'true'},
        'headers': {'Authorization': 'Bearer token...'},
        'body': None,
        'requestContext': {...}
    }
    """
    user_id = event['pathParameters']['userId']
    
    # Fetch user from database
    user = get_user(user_id)
    
    # Return response (must include statusCode, headers, body)
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(user)
    }
```

#### 2. Lambda Custom Integration

Map request/response with VTL templates:

```python
# Request template (VTL - Velocity Template Language)
request_template = """
{
    "userId": "$input.params('userId')",
    "action": "get"
}
"""

apigateway.put_integration(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    type='AWS',  # Non-proxy
    integrationHttpMethod='POST',
    uri=lambda_uri,
    requestTemplates={
        'application/json': request_template
    }
)

# Response template
response_template = """
{
    "user": $input.json('$')
}
"""

apigateway.put_integration_response(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    statusCode='200',
    responseTemplates={
        'application/json': response_template
    }
)
```

#### 3. HTTP Integration

Proxy to HTTP backend:

```python
apigateway.put_integration(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    type='HTTP',
    integrationHttpMethod='GET',
    uri='https://api.example.com/users/{userId}',
    requestParameters={
        'integration.request.path.userId': 'method.request.path.userId'
    }
)
```

#### 4. Mock Integration

Return static response without backend:

```python
apigateway.put_integration(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    type='MOCK',
    requestTemplates={
        'application/json': '{"statusCode": 200}'
    }
)

apigateway.put_integration_response(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    statusCode='200',
    responseTemplates={
        'application/json': json.dumps({
            'message': 'API under maintenance'
        })
    }
)
```

### Request Validation

```python
# Create request validator
validator = apigateway.create_request_validator(
    restApiId=api_id,
    name='ValidateBodyAndParams',
    validateRequestBody=True,
    validateRequestParameters=True
)

# Define request model (JSON Schema)
model = apigateway.create_model(
    restApiId=api_id,
    name='UserModel',
    contentType='application/json',
    schema=json.dumps({
        "$schema": "http://json-schema.org/draft-04/schema#",
        "title": "User",
        "type": "object",
        "properties": {
            "username": {
                "type": "string",
                "minLength": 3,
                "maxLength": 20
            },
            "email": {
                "type": "string",
                "format": "email"
            },
            "age": {
                "type": "integer",
                "minimum": 18
            }
        },
        "required": ["username", "email"]
    })
)

# Apply to POST method
apigateway.put_method(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='POST',
    authorizationType='NONE',
    requestValidatorId=validator['id'],
    requestModels={
        'application/json': 'UserModel'
    },
    requestParameters={
        'method.request.header.Authorization': True  # Required header
    }
)
```

Invalid request returns **400 Bad Request** before hitting Lambda.

---

## HTTP APIs

### Creating HTTP API

```python
# Create HTTP API (simpler, cheaper)
api_response = apigateway.create_api(
    Name='MyHTTPAPI',
    ProtocolType='HTTP',
    CorsConfiguration={
        'AllowOrigins': ['https://example.com'],
        'AllowMethods': ['GET', 'POST', 'PUT', 'DELETE'],
        'AllowHeaders': ['Content-Type', 'Authorization'],
        'MaxAge': 86400
    }
)

http_api_id = api_response['ApiId']

# Create route
apigateway.create_route(
    ApiId=http_api_id,
    RouteKey='GET /users',
    Target=f'integrations/{integration_id}'
)

# Create integration
integration = apigateway.create_integration(
    ApiId=http_api_id,
    IntegrationType='AWS_PROXY',
    IntegrationUri=lambda_arn,
    PayloadFormatVersion='2.0'  # HTTP API format
)

# Deploy
apigateway.create_stage(
    ApiId=http_api_id,
    StageName='$default',
    AutoDeploy=True
)
```

### HTTP API Event Format (Payload 2.0)

```python
def lambda_handler(event, context):
    """
    HTTP API event format (different from REST API)
    
    event = {
        'version': '2.0',
        'routeKey': 'GET /users/{userId}',
        'rawPath': '/users/123',
        'rawQueryString': 'includeOrders=true',
        'headers': {...},
        'pathParameters': {'userId': '123'},
        'requestContext': {
            'http': {
                'method': 'GET',
                'path': '/users/123'
            }
        },
        'body': None
    }
    """
    user_id = event['pathParameters']['userId']
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'userId': user_id})
    }
```

### REST API vs HTTP API Cost

**Scenario: 100M requests/month**

```
REST API:
- Requests: 100M × $3.50/million = $350/month

HTTP API:
- Requests: 100M × $1.00/million = $100/month

Savings: $250/month (71% cheaper)
```

**When to use REST API:**
- Need API keys and usage plans
- Need response caching
- Need request/response transformation with VTL
- Need WAF integration

**When to use HTTP API:**
- Cost-sensitive application
- Simple proxy to Lambda
- JWT authorization sufficient
- Don't need caching

---

## WebSocket APIs

### Use Cases

1. **Chat applications**: Real-time messaging
2. **Live dashboards**: Stock prices, IoT telemetry
3. **Multiplayer games**: Real-time game state
4. **Collaborative editing**: Google Docs-style collaboration

### WebSocket Lifecycle

```
Client                          API Gateway                Lambda
  |                                  |                       |
  |--- $connect (WebSocket handshake)|                       |
  |                                  |---> onConnect() ------>|
  |<-------------------------------- 200 OK -----------------|
  |                                  |                       |
  |--- sendMessage ----------------->|                       |
  |                                  |---> onMessage() ------>|
  |                                  |                       |
  |                                  |<----- broadcast -------|
  |<--- message ----------------------|                       |
  |                                  |                       |
  |--- $disconnect ----------------->|                       |
  |                                  |---> onDisconnect() --->|
```

### Creating WebSocket API

```python
# Create WebSocket API
ws_api = apigateway.create_api(
    Name='ChatWebSocket',
    ProtocolType='WEBSOCKET',
    RouteSelectionExpression='$request.body.action'
)

ws_api_id = ws_api['ApiId']

# Create routes
routes = {
    '$connect': 'arn:aws:lambda:us-east-1:123456789012:function:OnConnect',
    '$disconnect': 'arn:aws:lambda:us-east-1:123456789012:function:OnDisconnect',
    '$default': 'arn:aws:lambda:us-east-1:123456789012:function:OnDefault',
    'sendMessage': 'arn:aws:lambda:us-east-1:123456789012:function:SendMessage'
}

for route_key, lambda_arn in routes.items():
    # Create integration
    integration = apigateway.create_integration(
        ApiId=ws_api_id,
        IntegrationType='AWS_PROXY',
        IntegrationUri=f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/{lambda_arn}/invocations'
    )
    
    # Create route
    apigateway.create_route(
        ApiId=ws_api_id,
        RouteKey=route_key,
        Target=f'integrations/{integration["IntegrationId"]}'
    )

# Deploy
apigateway.create_stage(
    ApiId=ws_api_id,
    StageName='production',
    AutoDeploy=True
)

ws_url = f"wss://{ws_api_id}.execute-api.us-east-1.amazonaws.com/production"
print(f"WebSocket URL: {ws_url}")
```

### Connection Management

```python
import boto3

dynamodb = boto3.resource('dynamodb')
apigatewaymanagementapi = boto3.client('apigatewaymanagementapi')

# Table to store connections
connections_table = dynamodb.Table('WebSocketConnections')

# $connect handler
def on_connect(event, context):
    """Store connection ID when client connects"""
    connection_id = event['requestContext']['connectionId']
    
    # Store in DynamoDB
    connections_table.put_item(
        Item={
            'connectionId': connection_id,
            'connectedAt': int(time.time())
        }
    )
    
    return {'statusCode': 200}

# $disconnect handler
def on_disconnect(event, context):
    """Remove connection ID when client disconnects"""
    connection_id = event['requestContext']['connectionId']
    
    connections_table.delete_item(
        Key={'connectionId': connection_id}
    )
    
    return {'statusCode': 200}

# sendMessage handler
def send_message(event, context):
    """Broadcast message to all connected clients"""
    connection_id = event['requestContext']['connectionId']
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    
    # Parse message
    body = json.loads(event['body'])
    message = body['message']
    
    # Get all connections
    response = connections_table.scan()
    connections = response['Items']
    
    # Initialize management API client
    apigw_management = boto3.client(
        'apigatewaymanagementapi',
        endpoint_url=f'https://{domain_name}/{stage}'
    )
    
    # Broadcast to all connections
    for conn in connections:
        try:
            apigw_management.post_to_connection(
                ConnectionId=conn['connectionId'],
                Data=json.dumps({
                    'from': connection_id,
                    'message': message
                }).encode('utf-8')
            )
        except apigw_management.exceptions.GoneException:
            # Connection no longer exists, remove from table
            connections_table.delete_item(
                Key={'connectionId': conn['connectionId']}
            )
    
    return {'statusCode': 200}
```

### WebSocket Client (JavaScript)

```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://abc123.execute-api.us-east-1.amazonaws.com/production');

ws.onopen = () => {
    console.log('Connected to WebSocket');
    
    // Send message
    ws.send(JSON.stringify({
        action: 'sendMessage',
        message: 'Hello, everyone!'
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data.message);
    
    // Update UI
    displayMessage(data.from, data.message);
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('Disconnected from WebSocket');
};
```

---

## Authentication and Authorization

### 1. API Keys

Simple authentication for third-party developers:

```python
# Create API key
api_key = apigateway.create_api_key(
    name='PartnerKey',
    enabled=True
)

# Create usage plan
usage_plan = apigateway.create_usage_plan(
    name='BasicPlan',
    throttle={
        'rateLimit': 100,  # Requests per second
        'burstLimit': 200  # Burst capacity
    },
    quota={
        'limit': 10000,  # Requests per period
        'period': 'MONTH'
    }
)

# Associate API key with usage plan
apigateway.create_usage_plan_key(
    usagePlanId=usage_plan['id'],
    keyId=api_key['id'],
    keyType='API_KEY'
)

# Associate usage plan with API stage
apigateway.update_usage_plan(
    usagePlanId=usage_plan['id'],
    patchOperations=[{
        'op': 'add',
        'path': '/apiStages',
        'value': f'{api_id}:dev'
    }]
)

# Client request includes API key header
# curl -H "x-api-key: abc123xyz" https://api.example.com/users
```

### 2. Lambda Authorizers (Custom)

```python
# Lambda authorizer function
def lambda_authorizer(event, context):
    """
    Validate token and return IAM policy
    
    event = {
        'type': 'TOKEN',
        'authorizationToken': 'Bearer abc123...',
        'methodArn': 'arn:aws:execute-api:us-east-1:123456789012:abc123/dev/GET/users'
    }
    """
    token = event['authorizationToken']
    
    # Validate token (check database, verify JWT, etc.)
    if validate_token(token):
        # Allow request
        return {
            'principalId': 'user-123',
            'policyDocument': {
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'execute-api:Invoke',
                    'Effect': 'Allow',
                    'Resource': event['methodArn']
                }]
            },
            'context': {
                'userId': 'user-123',
                'role': 'admin'
            }  # Passed to Lambda as event['requestContext']['authorizer']
        }
    else:
        # Deny request
        raise Exception('Unauthorized')

# Attach authorizer to API
authorizer = apigateway.create_authorizer(
    restApiId=api_id,
    name='CustomAuthorizer',
    type='TOKEN',
    authorizerUri=f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:Authorizer/invocations',
    identitySource='method.request.header.Authorization',
    authorizerResultTtlInSeconds=300  # Cache for 5 minutes
)

# Use in method
apigateway.put_method(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    authorizationType='CUSTOM',
    authorizerId=authorizer['id']
)
```

### 3. Cognito User Pools

```python
# Create Cognito authorizer
authorizer = apigateway.create_authorizer(
    restApiId=api_id,
    name='CognitoAuthorizer',
    type='COGNITO_USER_POOLS',
    providerARNs=[
        'arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_ABC123'
    ],
    identitySource='method.request.header.Authorization'
)

# Client flow:
# 1. User signs in to Cognito
# 2. Receives JWT token
# 3. Includes token in Authorization header
# 4. API Gateway validates token with Cognito
# 5. If valid, forwards request to Lambda
```

### 4. IAM Authorization

```python
apigateway.put_method(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    authorizationType='AWS_IAM'
)

# Client must sign request with AWS Signature V4
# Example using boto3:
import requests
from requests_aws4auth import AWS4Auth

auth = AWS4Auth(
    access_key,
    secret_key,
    'us-east-1',
    'execute-api'
)

response = requests.get(
    'https://abc123.execute-api.us-east-1.amazonaws.com/dev/users',
    auth=auth
)
```

---

## Caching and Performance

### Response Caching (REST API only)

```python
# Enable caching on stage
apigateway.update_stage(
    restApiId=api_id,
    stageName='production',
    patchOperations=[
        {
            'op': 'replace',
            'path': '/cacheClusterEnabled',
            'value': 'true'
        },
        {
            'op': 'replace',
            'path': '/cacheClusterSize',
            'value': '0.5'  # 0.5 GB, 1.6 GB, 6.1 GB, 13.5 GB, 28.4 GB, 58.2 GB, 118 GB, 237 GB
        }
    ]
)

# Cost: 0.5 GB = $0.020/hour = ~$14.40/month
```

**Cache Settings per Method:**

```python
apigateway.put_integration(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    type='AWS_PROXY',
    uri=lambda_uri,
    cacheKeyParameters=['method.request.querystring.userId'],  # Cache key
    cacheNamespace='users-cache'
)

# Set TTL
apigateway.update_method(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    patchOperations=[{
        'op': 'replace',
        'path': '/caching/ttlInSeconds',
        'value': '300'  # 5 minutes
    }]
)
```

**Cache Invalidation:**

```python
# Invalidate entire cache
apigateway.flush_stage_cache(
    restApiId=api_id,
    stageName='production'
)

# Client can bypass cache with header
# Cache-Control: max-age=0
```

### Throttling

**Account-level limits:**
- **Steady-state**: 10,000 requests/second
- **Burst**: 5,000 requests

**Custom throttling:**

```python
# Stage-level throttling
apigateway.update_stage(
    restApiId=api_id,
    stageName='production',
    patchOperations=[
        {
            'op': 'replace',
            'path': '/throttle/rateLimit',
            'value': '1000'  # Requests per second
        },
        {
            'op': 'replace',
            'path': '/throttle/burstLimit',
            'value': '2000'
        }
    ]
)

# Method-level throttling
apigateway.update_stage(
    restApiId=api_id,
    stageName='production',
    patchOperations=[{
        'op': 'replace',
        'path': '/throttle/*/GET/rateLimit',  # Specific method
        'value': '500'
    }]
)
```

**Throttle Response:**

```
HTTP/1.1 429 Too Many Requests
{"message": "Rate exceeded"}
```

---

## API Stages and Deployment

### Stage Variables

Environment-specific configuration:

```python
# Create deployment
deployment = apigateway.create_deployment(
    restApiId=api_id,
    stageName='dev',
    stageDescription='Development stage',
    variables={
        'lambdaAlias': 'DEV',
        'dbEndpoint': 'dev-db.example.com',
        'cacheEnabled': 'false'
    }
)

# Production stage
apigateway.create_deployment(
    restApiId=api_id,
    stageName='production',
    variables={
        'lambdaAlias': 'PROD',
        'dbEndpoint': 'prod-db.example.com',
        'cacheEnabled': 'true'
    }
)

# Use in Lambda integration
apigateway.put_integration(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    type='AWS_PROXY',
    uri=f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:MyFunction:${{stageVariables.lambdaAlias}}/invocations'
)

# Access in Lambda
def lambda_handler(event, context):
    stage = event['requestContext']['stage']
    # Use different database based on stage
```

### Canary Deployments

```python
# Create deployment with canary
deployment = apigateway.create_deployment(
    restApiId=api_id,
    stageName='production',
    canarySettings={
        'percentTraffic': 10.0,  # 10% to canary
        'useStageCache': False,
        'stageVariableOverrides': {
            'lambdaAlias': 'CANARY'
        }
    }
)

# After validation, promote canary
apigateway.update_stage(
    restApiId=api_id,
    stageName='production',
    patchOperations=[{
        'op': 'remove',
        'path': '/canarySettings'
    }]
)
```

---

## LocalStack Examples

### Complete REST API + Lambda

```python
import boto3
import json
import zipfile
import io

# Initialize clients
apigateway = boto3.client('apigateway', endpoint_url='http://localhost:4566')
lambda_client = boto3.client('lambda', endpoint_url='http://localhost:4566')
iam = boto3.client('iam', endpoint_url='http://localhost:4566')

# Create Lambda execution role
role = iam.create_role(
    RoleName='APIGatewayLambdaRole',
    AssumeRolePolicyDocument=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    })
)

# Create Lambda function
lambda_code = '''
import json

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    # Parse request
    http_method = event['httpMethod']
    path = event['path']
    body = json.loads(event['body']) if event.get('body') else {}
    
    # Simple CRUD logic
    if http_method == 'GET' and path == '/users':
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps([
                {'id': '1', 'name': 'Alice'},
                {'id': '2', 'name': 'Bob'}
            ])
        }
    
    elif http_method == 'POST' and path == '/users':
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'id': '3',
                'name': body.get('name')
            })
        }
    
    else:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Not found'})
        }
'''

# Package Lambda code
zip_buffer = io.BytesIO()
with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipf.writestr('lambda_function.py', lambda_code)

# Create Lambda
lambda_response = lambda_client.create_function(
    FunctionName='APIHandler',
    Runtime='python3.9',
    Role=role['Role']['Arn'],
    Handler='lambda_function.lambda_handler',
    Code={'ZipFile': zip_buffer.getvalue()}
)

lambda_arn = lambda_response['FunctionArn']

# Create REST API
api = apigateway.create_rest_api(
    name='UserAPI',
    endpointConfiguration={'types': ['REGIONAL']}
)
api_id = api['id']

# Get root resource
resources = apigateway.get_resources(restApiId=api_id)
root_id = resources['items'][0]['id']

# Create /users resource
users_resource = apigateway.create_resource(
    restApiId=api_id,
    parentId=root_id,
    pathPart='users'
)
users_id = users_resource['id']

# Create GET /users
apigateway.put_method(
    restApiId=api_id,
    resourceId=users_id,
    httpMethod='GET',
    authorizationType='NONE'
)

apigateway.put_integration(
    restApiId=api_id,
    resourceId=users_id,
    httpMethod='GET',
    type='AWS_PROXY',
    integrationHttpMethod='POST',
    uri=f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/{lambda_arn}/invocations'
)

# Create POST /users
apigateway.put_method(
    restApiId=api_id,
    resourceId=users_id,
    httpMethod='POST',
    authorizationType='NONE'
)

apigateway.put_integration(
    restApiId=api_id,
    resourceId=users_id,
    httpMethod='POST',
    type='AWS_PROXY',
    integrationHttpMethod='POST',
    uri=f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/{lambda_arn}/invocations'
)

# Deploy
deployment = apigateway.create_deployment(
    restApiId=api_id,
    stageName='dev'
)

api_url = f"http://localhost:4566/restapis/{api_id}/dev/_user_request_"
print(f"\n✓ API deployed: {api_url}/users")
print("\nTest with:")
print(f"  curl {api_url}/users")
print(f"  curl -X POST {api_url}/users -d '{\"name\": \"Charlie\"}'")
```

---

## Interview Questions

### Q1: API Gateway REST API vs HTTP API vs ALB - when to use which?

**Answer:**

| Feature | API Gateway REST | API Gateway HTTP | ALB |
|---------|-----------------|------------------|-----|
| **Cost** | $3.50/million | $1.00/million | $0.008/hour + $0.008/LCU |
| **Latency** | ~100ms | ~50ms | ~10ms |
| **Use Case** | Full-featured APIs | Simple, low-cost | Microservices routing |
| **Features** | Caching, API keys, transforms | Basic proxy | Path-based routing |
| **WebSocket** | Yes (separate API) | No | No |
| **Integration** | Lambda, HTTP, AWS services | Lambda, HTTP | EC2, ECS, Lambda |

**Decision Tree:**

```
Need caching, API keys, usage plans, request transformation?
  → REST API

Simple proxy to Lambda, cost-sensitive, HTTP/2?
  → HTTP API

Routing to EC2/ECS microservices, need lowest latency?
  → ALB

Need real-time bidirectional communication?
  → WebSocket API
```

**Cost Example (100M requests/month):**

```
REST API: 100M × $3.50/million = $350
HTTP API: 100M × $1.00/million = $100
ALB: $5.84 + (100M requests × 0.000001 LCU × $0.008) = $6.64/month
```

**When to use ALB:**
- Microservices on EC2/ECS
- Need health checks
- Need sticky sessions
- Cost-effective at high scale

**When to use API Gateway:**
- Serverless (Lambda)
- Need managed authentication
- Need API versioning/stages
- Want fully managed service

---

### Q2: How would you implement rate limiting for different customer tiers?

**Answer:**

**Architecture:**

```
Free Tier: 100 requests/day
Basic Tier: 10,000 requests/day
Premium Tier: 1,000,000 requests/day
```

**Implementation with API Keys + Usage Plans:**

```python
# Create API keys for each customer
free_key = apigateway.create_api_key(name='Customer-Free-001', enabled=True)
basic_key = apigateway.create_api_key(name='Customer-Basic-002', enabled=True)
premium_key = apigateway.create_api_key(name='Customer-Premium-003', enabled=True)

# Create usage plans
free_plan = apigateway.create_usage_plan(
    name='FreePlan',
    throttle={
        'rateLimit': 1,  # 1 req/sec
        'burstLimit': 2
    },
    quota={
        'limit': 100,  # 100 requests
        'period': 'DAY'
    }
)

basic_plan = apigateway.create_usage_plan(
    name='BasicPlan',
    throttle={
        'rateLimit': 10,
        'burstLimit': 20
    },
    quota={
        'limit': 10000,
        'period': 'DAY'
    }
)

premium_plan = apigateway.create_usage_plan(
    name='PremiumPlan',
    throttle={
        'rateLimit': 1000,
        'burstLimit': 2000
    },
    quota={
        'limit': 1000000,
        'period': 'DAY'
    }
)

# Associate keys with plans
apigateway.create_usage_plan_key(
    usagePlanId=free_plan['id'],
    keyId=free_key['id'],
    keyType='API_KEY'
)

# Associate with API stage
for plan in [free_plan, basic_plan, premium_plan]:
    apigateway.update_usage_plan(
        usagePlanId=plan['id'],
        patchOperations=[{
            'op': 'add',
            'path': '/apiStages',
            'value': f'{api_id}:production'
        }]
    )

# Client includes API key
# curl -H "x-api-key: abc123..." https://api.example.com/data
```

**Alternative: Lambda Authorizer with DynamoDB:**

```python
# DynamoDB table: CustomerTiers
# PK: apiKey, Attributes: tier, requestsToday, lastReset

def lambda_authorizer(event, context):
    api_key = event['authorizationToken']
    
    # Get customer tier
    response = dynamodb.get_item(
        TableName='CustomerTiers',
        Key={'apiKey': api_key}
    )
    
    if 'Item' not in response:
        raise Exception('Invalid API key')
    
    customer = response['Item']
    tier = customer['tier']
    requests_today = customer.get('requestsToday', 0)
    
    # Check quota
    quotas = {
        'free': 100,
        'basic': 10000,
        'premium': 1000000
    }
    
    if requests_today >= quotas[tier]:
        raise Exception('Quota exceeded')
    
    # Increment counter
    dynamodb.update_item(
        TableName='CustomerTiers',
        Key={'apiKey': api_key},
        UpdateExpression='ADD requestsToday :inc',
        ExpressionAttributeValues={':inc': 1}
    )
    
    # Allow request
    return {
        'principalId': customer['customerId'],
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'execute-api:Invoke',
                'Effect': 'Allow',
                'Resource': event['methodArn']
            }]
        },
        'context': {
            'tier': tier,
            'remainingQuota': quotas[tier] - requests_today - 1
        }
    }

# Lambda can access tier from context
def api_handler(event, context):
    tier = event['requestContext']['authorizer']['tier']
    remaining = event['requestContext']['authorizer']['remainingQuota']
    
    return {
        'statusCode': 200,
        'headers': {
            'X-RateLimit-Tier': tier,
            'X-RateLimit-Remaining': str(remaining)
        },
        'body': json.dumps({'data': '...'})
    }
```

**Monitoring:**

```python
# CloudWatch alarm for quota exhaustion
cloudwatch.put_metric_alarm(
    AlarmName='HighQuotaUsage',
    MetricName='Count',
    Namespace='AWS/ApiGateway',
    Statistic='Sum',
    Period=86400,  # Daily
    EvaluationPeriods=1,
    Threshold=90000,  # 90% of basic tier
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'ApiName', 'Value': 'MyAPI'},
        {'Name': 'Stage', 'Value': 'production'}
    ],
    AlarmActions=['arn:aws:sns:us-east-1:123456789012:api-alerts']
)
```

---

### Q3: Design a WebSocket-based real-time chat application on AWS

**Answer:**

**Architecture:**

```
Clients (Web/Mobile)
    ↓ WebSocket
API Gateway WebSocket API
    ↓
Lambda Functions (onConnect, onDisconnect, sendMessage)
    ↓
DynamoDB (Connections table, Messages table)
    ↓ (optional)
DynamoDB Streams → Lambda → SNS (push notifications for offline users)
```

**Data Model:**

```python
# Connections table
{
    'connectionId': 'abc123',  # PK
    'userId': 'user-456',
    'roomId': 'room-789',
    'connectedAt': 1640000000,
    'ttl': 1640086400  # Auto-delete after 24 hours
}

# Messages table
{
    'roomId': 'room-789',  # PK
    'timestamp': 1640000000,  # SK
    'userId': 'user-456',
    'message': 'Hello, world!',
    'connectionId': 'abc123'
}
```

**Lambda Functions:**

```python
# onConnect
def on_connect(event, context):
    connection_id = event['requestContext']['connectionId']
    query_params = event.get('queryStringParameters', {})
    user_id = query_params.get('userId')
    room_id = query_params.get('roomId')
    
    # Store connection
    connections_table.put_item(
        Item={
            'connectionId': connection_id,
            'userId': user_id,
            'roomId': room_id,
            'connectedAt': int(time.time()),
            'ttl': int(time.time()) + 86400
        }
    )
    
    # Notify room members
    broadcast_to_room(room_id, {
        'type': 'user_joined',
        'userId': user_id
    }, exclude=connection_id)
    
    return {'statusCode': 200}

# onDisconnect
def on_disconnect(event, context):
    connection_id = event['requestContext']['connectionId']
    
    # Get connection details
    conn = connections_table.get_item(Key={'connectionId': connection_id})
    if 'Item' in conn:
        room_id = conn['Item']['roomId']
        user_id = conn['Item']['userId']
        
        # Notify room
        broadcast_to_room(room_id, {
            'type': 'user_left',
            'userId': user_id
        })
    
    # Remove connection
    connections_table.delete_item(Key={'connectionId': connection_id})
    
    return {'statusCode': 200}

# sendMessage
def send_message(event, context):
    connection_id = event['requestContext']['connectionId']
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    
    # Parse message
    body = json.loads(event['body'])
    message_text = body['message']
    
    # Get connection details
    conn = connections_table.get_item(Key={'connectionId': connection_id})
    room_id = conn['Item']['roomId']
    user_id = conn['Item']['userId']
    
    # Store message
    messages_table.put_item(
        Item={
            'roomId': room_id,
            'timestamp': int(time.time() * 1000),  # Milliseconds for sorting
            'userId': user_id,
            'message': message_text,
            'connectionId': connection_id
        }
    )
    
    # Broadcast to room
    broadcast_to_room(room_id, {
        'type': 'message',
        'userId': user_id,
        'message': message_text,
        'timestamp': int(time.time() * 1000)
    })
    
    return {'statusCode': 200}

def broadcast_to_room(room_id, message, exclude=None):
    """Send message to all connections in room"""
    # Query connections by room
    response = connections_table.query(
        IndexName='roomId-index',
        KeyConditionExpression='roomId = :roomId',
        ExpressionAttributeValues={':roomId': room_id}
    )
    
    apigw = boto3.client('apigatewaymanagementapi', 
                         endpoint_url=f'https://{domain_name}/{stage}')
    
    for conn in response['Items']:
        if conn['connectionId'] == exclude:
            continue
        
        try:
            apigw.post_to_connection(
                ConnectionId=conn['connectionId'],
                Data=json.dumps(message).encode('utf-8')
            )
        except apigw.exceptions.GoneException:
            # Connection stale, remove
            connections_table.delete_item(
                Key={'connectionId': conn['connectionId']}
            )
```

**Client (JavaScript):**

```javascript
class ChatClient {
    constructor(wsUrl, userId, roomId) {
        this.wsUrl = `${wsUrl}?userId=${userId}&roomId=${roomId}`;
        this.ws = null;
        this.messageCallbacks = [];
    }
    
    connect() {
        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to chat');
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.messageCallbacks.forEach(cb => cb(data));
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        this.ws.onclose = () => {
            console.log('Disconnected');
            // Reconnect after delay
            setTimeout(() => this.connect(), 5000);
        };
    }
    
    sendMessage(message) {
        this.ws.send(JSON.stringify({
            action: 'sendMessage',
            message: message
        }));
    }
    
    onMessage(callback) {
        this.messageCallbacks.push(callback);
    }
}

// Usage
const chat = new ChatClient('wss://abc123.execute-api.us-east-1.amazonaws.com/production', 
                             'user-456', 'room-789');
chat.connect();

chat.onMessage((data) => {
    if (data.type === 'message') {
        displayMessage(data.userId, data.message);
    } else if (data.type === 'user_joined') {
        showNotification(`${data.userId} joined`);
    }
});

// Send message
chat.sendMessage('Hello, everyone!');
```

**Capacity Planning:**

```
10,000 concurrent users
Average message rate: 1 message/minute/user = 167 messages/second

WebSocket connections:
- Connection minutes: 10,000 users × 60 min/hour × 730 hours = 438M connection-minutes
- Cost: 438M × $0.25/million = $109.50/month

Messages:
- Messages: 167/sec × 2.6M sec/month = 434M messages
- Cost: 434M × $1.00/million = $434/month

DynamoDB:
- Writes: 167/sec × 2 tables = 334 WCU → $163/month
- Reads: 167/sec × 10 (avg room size) = 1,670 RCU → $81/month
- Storage: Minimal

Total: ~$787/month for 10K concurrent users
```

---

## Summary

**AWS API Gateway** enables building scalable, secure APIs without managing infrastructure. Choose REST API for full features, HTTP API for cost optimization, or WebSocket API for real-time communication.

**Key Takeaways:**

1. **API Types**: REST (full-featured, $3.50/M), HTTP (simple, $1/M), WebSocket (real-time, $1/M + connections)
2. **Integration**: Lambda Proxy (recommended), Custom (VTL), HTTP, Mock
3. **Authentication**: API Keys (simple), Lambda Authorizers (custom), Cognito (OAuth2/OIDC), IAM (AWS services)
4. **Caching**: REST API only, 0.5-237 GB, TTL configurable
5. **Throttling**: 10,000 req/sec default, customizable per stage/method
6. **Stages**: dev/staging/prod with stage variables, canary deployments
7. **WebSocket**: Persistent connections, DynamoDB for connection tracking, broadcast via post_to_connection
8. **Cost**: HTTP API 71% cheaper than REST for simple use cases

API Gateway is essential for FAANG interviews—expect questions on API type selection, authentication patterns, WebSocket architecture, and cost optimization strategies.

