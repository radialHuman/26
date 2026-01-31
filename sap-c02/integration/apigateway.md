# Amazon API Gateway

## What is API Gateway?

Amazon API Gateway is a fully managed service that makes it easy to create, publish, maintain, monitor, and secure APIs at any scale. It acts as a "front door" for applications to access data, business logic, or functionality from backend services.

## Why Use API Gateway?

### Key Benefits
- **Fully Managed**: No servers to manage
- **Scalable**: Handles millions of requests
- **Secure**: Authorization, authentication, throttling
- **Cost-Effective**: Pay per request
- **Monitoring**: CloudWatch metrics and logs
- **Caching**: Reduce backend load
- **Multiple Integrations**: Lambda, HTTP, AWS services
- **Versioning**: Stage management

### Use Cases
- Serverless REST APIs (Lambda backend)
- WebSocket real-time communication
- HTTP API proxy to backend services
- API versioning and lifecycle management
- Rate limiting and throttling
- Request/response transformation
- API monetization with usage plans

## API Types

### REST API

**Features**:
- Full API management capabilities
- API keys, usage plans, request validation
- Request/response transformation
- Caching
- Custom domain names
- Regional, edge-optimized, private

**Use When**:
- Need advanced features (caching, transformation)
- API keys and usage plans required
- Complex request validation

**Pricing**: $3.50 per million requests

### HTTP API

**Features**:
- Lightweight, lower latency
- OIDC and OAuth 2.0 authorization
- Auto-deploy
- CORS configuration
- Lower cost

**Use When**:
- Simple proxy to Lambda or HTTP backend
- JWT authorization sufficient
- Cost optimization important
- Lower latency needed

**Pricing**: $1.00 per million requests (71% cheaper)

### WebSocket API

**Features**:
- Persistent connections
- Bi-directional communication
- Route selection expressions
- Connection management

**Use When**:
- Real-time applications (chat, gaming, trading)
- Server push notifications
- Streaming data

**Pricing**: 
- $1.00 per million messages
- $0.25 per million connection minutes

## REST API

### Creating REST API

```python
import boto3

apigateway = boto3.client('apigateway')

# Create API
api = apigateway.create_rest_api(
    name='MyAPI',
    description='My REST API',
    endpointConfiguration={
        'types': ['REGIONAL']  # or EDGE, PRIVATE
    }
)

api_id = api['id']
```

### Resources and Methods

**Get Root Resource**:
```python
resources = apigateway.get_resources(restApiId=api_id)
root_id = resources['items'][0]['id']
```

**Create Resource**:
```python
resource = apigateway.create_resource(
    restApiId=api_id,
    parentId=root_id,
    pathPart='users'  # /users
)

resource_id = resource['id']
```

**Create Method**:
```python
apigateway.put_method(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    authorizationType='NONE',  # or AWS_IAM, COGNITO_USER_POOLS, CUSTOM
    requestParameters={
        'method.request.querystring.limit': False
    }
)
```

**Method Response**:
```python
apigateway.put_method_response(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    statusCode='200',
    responseParameters={
        'method.response.header.Access-Control-Allow-Origin': False
    },
    responseModels={
        'application/json': 'Empty'
    }
)
```

### Integrations

**Lambda Integration**:
```python
apigateway.put_integration(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    type='AWS_PROXY',  # or AWS (non-proxy)
    integrationHttpMethod='POST',  # Always POST for Lambda
    uri=f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:GetUsers/invocations'
)
```

**Lambda Proxy** (recommended):
- Request passed directly to Lambda
- Lambda must return specific format
- Easier to use

**Lambda Response Format**:
```python
def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'users': [
                {'id': 1, 'name': 'Alice'},
                {'id': 2, 'name': 'Bob'}
            ]
        })
    }
```

**Lambda Event**:
```json
{
  "resource": "/users",
  "path": "/users",
  "httpMethod": "GET",
  "headers": {
    "Accept": "application/json",
    "User-Agent": "curl/7.64.1"
  },
  "queryStringParameters": {
    "limit": "10"
  },
  "pathParameters": null,
  "stageVariables": null,
  "requestContext": {
    "accountId": "123456789012",
    "apiId": "abc123",
    "stage": "prod",
    "requestId": "...",
    "identity": {
      "sourceIp": "1.2.3.4",
      "userAgent": "..."
    }
  },
  "body": null,
  "isBase64Encoded": false
}
```

**HTTP Integration**:
```python
apigateway.put_integration(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    type='HTTP_PROXY',  # or HTTP
    integrationHttpMethod='GET',
    uri='https://api.example.com/users'
)
```

**AWS Service Integration** (DynamoDB):
```python
apigateway.put_integration(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    type='AWS',
    integrationHttpMethod='POST',
    uri='arn:aws:apigateway:us-east-1:dynamodb:action/GetItem',
    credentials='arn:aws:iam::123456789012:role/APIGatewayDynamoDBRole',
    requestTemplates={
        'application/json': json.dumps({
            'TableName': 'Users',
            'Key': {
                'userId': {
                    'S': "$input.params('userId')"
                }
            }
        })
    }
)
```

**Mock Integration** (testing):
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
```

### Grant Lambda Permission

```python
lambda_client = boto3.client('lambda')

lambda_client.add_permission(
    FunctionName='GetUsers',
    StatementId='apigateway-invoke',
    Action='lambda:InvokeFunction',
    Principal='apigateway.amazonaws.com',
    SourceArn=f'arn:aws:execute-api:us-east-1:123456789012:{api_id}/*/*/users'
)
```

### Deployment

**Create Deployment**:
```python
deployment = apigateway.create_deployment(
    restApiId=api_id,
    stageName='prod',
    stageDescription='Production stage',
    description='Initial deployment'
)
```

**Invoke URL**:
```
https://{api_id}.execute-api.{region}.amazonaws.com/{stage}/{resource}
https://abc123.execute-api.us-east-1.amazonaws.com/prod/users
```

### Stages

**Create Stage**:
```python
apigateway.create_stage(
    restApiId=api_id,
    stageName='dev',
    deploymentId=deployment_id,
    description='Development stage',
    variables={
        'lambdaAlias': 'DEV',
        'environment': 'development'
    }
)
```

**Stage Variables** (in Lambda ARN):
```
arn:aws:lambda:us-east-1:123456789012:function:MyFunction:${stageVariables.lambdaAlias}
```

**Update Stage**:
```python
apigateway.update_stage(
    restApiId=api_id,
    stageName='prod',
    patchOperations=[
        {
            'op': 'replace',
            'path': '/cacheClusterEnabled',
            'value': 'true'
        },
        {
            'op': 'replace',
            'path': '/cacheClusterSize',
            'value': '0.5'  # GB
        }
    ]
)
```

## Authorization

### IAM Authorization

**Method**:
```python
apigateway.put_method(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    authorizationType='AWS_IAM'
)
```

**Client Request** (with SigV4):
```python
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
import requests

url = 'https://abc123.execute-api.us-east-1.amazonaws.com/prod/users'
request = AWSRequest(method='GET', url=url)

SigV4Auth(boto3.Session().get_credentials(), 'execute-api', 'us-east-1').add_auth(request)

response = requests.get(url, headers=dict(request.headers))
```

### Cognito User Pools

**Create Authorizer**:
```python
authorizer = apigateway.create_authorizer(
    restApiId=api_id,
    name='CognitoAuthorizer',
    type='COGNITO_USER_POOLS',
    providerARNs=[
        'arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_ABC123'
    ],
    identitySource='method.request.header.Authorization'
)
```

**Method with Authorizer**:
```python
apigateway.put_method(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    authorizationType='COGNITO_USER_POOLS',
    authorizerId=authorizer['id']
)
```

**Client Request**:
```python
headers = {
    'Authorization': f'Bearer {id_token}'  # From Cognito
}

response = requests.get(api_url, headers=headers)
```

### Lambda Authorizer (Custom)

**Create Authorizer**:
```python
authorizer = apigateway.create_authorizer(
    restApiId=api_id,
    name='CustomAuthorizer',
    type='TOKEN',  # or REQUEST
    authorizerUri=f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:Authorizer/invocations',
    authorizerCredentials='arn:aws:iam::123456789012:role/APIGatewayLambdaAuthorizerRole',
    identitySource='method.request.header.Authorization',
    authorizerResultTtlInSeconds=300
)
```

**Authorizer Function**:
```python
def lambda_handler(event, context):
    token = event['authorizationToken']
    
    # Validate token (JWT, API key, etc.)
    if is_valid(token):
        return generate_policy('user123', 'Allow', event['methodArn'])
    else:
        return generate_policy('user123', 'Deny', event['methodArn'])

def generate_policy(principal_id, effect, resource):
    return {
        'principalId': principal_id,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Action': 'execute-api:Invoke',
                    'Effect': effect,
                    'Resource': resource
                }
            ]
        },
        'context': {
            'userId': principal_id,
            'role': 'admin'
        }
    }
```

**Context in Lambda**:
```python
def lambda_handler(event, context):
    user_id = event['requestContext']['authorizer']['userId']
    role = event['requestContext']['authorizer']['role']
```

## Request Validation

**Create Validator**:
```python
validator = apigateway.create_request_validator(
    restApiId=api_id,
    name='BodyValidator',
    validateRequestBody=True,
    validateRequestParameters=True
)
```

**Create Model**:
```python
model = apigateway.create_model(
    restApiId=api_id,
    name='UserModel',
    contentType='application/json',
    schema=json.dumps({
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'type': 'object',
        'properties': {
            'name': {
                'type': 'string',
                'minLength': 1,
                'maxLength': 100
            },
            'email': {
                'type': 'string',
                'pattern': '^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$'
            },
            'age': {
                'type': 'integer',
                'minimum': 0,
                'maximum': 150
            }
        },
        'required': ['name', 'email']
    })
)
```

**Method with Validation**:
```python
apigateway.put_method(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='POST',
    authorizationType='NONE',
    requestValidatorId=validator['id'],
    requestModels={
        'application/json': 'UserModel'
    }
)
```

## Throttling and Usage Plans

### Throttling

**Account-Level Limits** (default):
- 10,000 requests per second (RPS)
- 5,000 concurrent requests

**Stage Throttling**:
```python
apigateway.update_stage(
    restApiId=api_id,
    stageName='prod',
    patchOperations=[
        {
            'op': 'replace',
            'path': '/throttle/rateLimit',
            'value': '1000'  # RPS
        },
        {
            'op': 'replace',
            'path': '/throttle/burstLimit',
            'value': '2000'
        }
    ]
)
```

**Method Throttling**:
```python
apigateway.update_stage(
    restApiId=api_id,
    stageName='prod',
    patchOperations=[
        {
            'op': 'replace',
            'path': '/*/POST/users/rateLimit',
            'value': '100'
        }
    ]
)
```

### Usage Plans and API Keys

**Create API Key**:
```python
api_key = apigateway.create_api_key(
    name='CustomerKey',
    description='API key for customer',
    enabled=True
)

key_value = api_key['value']
```

**Create Usage Plan**:
```python
usage_plan = apigateway.create_usage_plan(
    name='BasicPlan',
    description='100 req/day, 10 req/sec',
    throttle={
        'rateLimit': 10,
        'burstLimit': 20
    },
    quota={
        'limit': 100,
        'period': 'DAY'  # or WEEK, MONTH
    },
    apiStages=[
        {
            'apiId': api_id,
            'stage': 'prod'
        }
    ]
)
```

**Associate API Key**:
```python
apigateway.create_usage_plan_key(
    usagePlanId=usage_plan['id'],
    keyId=api_key['id'],
    keyType='API_KEY'
)
```

**Require API Key**:
```python
apigateway.put_method(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    authorizationType='NONE',
    apiKeyRequired=True
)
```

**Client Request**:
```python
headers = {
    'x-api-key': api_key_value
}

response = requests.get(api_url, headers=headers)
```

## Caching

**Enable Cache**:
```python
apigateway.update_stage(
    restApiId=api_id,
    stageName='prod',
    patchOperations=[
        {
            'op': 'replace',
            'path': '/cacheClusterEnabled',
            'value': 'true'
        },
        {
            'op': 'replace',
            'path': '/cacheClusterSize',
            'value': '0.5'  # 0.5, 1.6, 6.1, 13.5, 28.4, 58.2, 118, 237 GB
        },
        {
            'op': 'replace',
            'path': '/*/*/caching/ttlInSeconds',
            'value': '300'
        }
    ]
)
```

**Cache Key Parameters**:
```python
apigateway.put_integration(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='GET',
    type='AWS_PROXY',
    uri=lambda_uri,
    cacheKeyParameters=[
        'method.request.querystring.limit',
        'method.request.querystring.offset'
    ]
)
```

**Invalidate Cache** (per request):
```
Header: Cache-Control: max-age=0
```

Requires `InvalidateCache` permission.

**Pricing**:
- 0.5 GB: $0.020/hour
- 1.6 GB: $0.038/hour
- 6.1 GB: $0.200/hour

## CORS

**Enable CORS**:
```python
# OPTIONS method for preflight
apigateway.put_method(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='OPTIONS',
    authorizationType='NONE'
)

apigateway.put_method_response(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='OPTIONS',
    statusCode='200',
    responseParameters={
        'method.response.header.Access-Control-Allow-Origin': False,
        'method.response.header.Access-Control-Allow-Methods': False,
        'method.response.header.Access-Control-Allow-Headers': False
    }
)

apigateway.put_integration(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='OPTIONS',
    type='MOCK',
    requestTemplates={
        'application/json': '{"statusCode": 200}'
    }
)

apigateway.put_integration_response(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod='OPTIONS',
    statusCode='200',
    responseParameters={
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'"
    }
)
```

## WebSocket API

### Creating WebSocket API

```python
api = apigateway.create_api(
    name='ChatAPI',
    protocolType='WEBSOCKET',
    routeSelectionExpression='$request.body.action'
)
```

### Routes

**$connect** (connection):
```python
apigateway.create_route(
    apiId=api_id,
    routeKey='$connect',
    authorizationType='NONE',
    target=f'integrations/{integration_id}'
)
```

**$disconnect**:
```python
apigateway.create_route(
    apiId=api_id,
    routeKey='$disconnect',
    target=f'integrations/{integration_id}'
)
```

**$default** (fallback):
```python
apigateway.create_route(
    apiId=api_id,
    routeKey='$default',
    target=f'integrations/{integration_id}'
)
```

**Custom Routes**:
```python
apigateway.create_route(
    apiId=api_id,
    routeKey='sendMessage',
    target=f'integrations/{integration_id}'
)
```

### Lambda Integration

**Integration**:
```python
integration = apigateway.create_integration(
    apiId=api_id,
    integrationType='AWS_PROXY',
    integrationUri=f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:ChatFunction/invocations'
)
```

**Lambda Handler**:
```python
def lambda_handler(event, context):
    route_key = event['requestContext']['routeKey']
    connection_id = event['requestContext']['connectionId']
    
    if route_key == '$connect':
        # Store connection
        dynamodb.put_item(
            TableName='Connections',
            Item={'connectionId': {'S': connection_id}}
        )
        return {'statusCode': 200}
    
    elif route_key == '$disconnect':
        # Remove connection
        dynamodb.delete_item(
            TableName='Connections',
            Key={'connectionId': {'S': connection_id}}
        )
        return {'statusCode': 200}
    
    elif route_key == 'sendMessage':
        body = json.loads(event['body'])
        message = body['message']
        
        # Broadcast to all connections
        broadcast_message(message, connection_id)
        
        return {'statusCode': 200}
```

**Send Message to Client**:
```python
apigatewaymanagementapi = boto3.client(
    'apigatewaymanagementapi',
    endpoint_url=f'https://{api_id}.execute-api.us-east-1.amazonaws.com/prod'
)

apigatewaymanagementapi.post_to_connection(
    ConnectionId=connection_id,
    Data=json.dumps({'message': 'Hello from server'})
)
```

**Client (JavaScript)**:
```javascript
const ws = new WebSocket('wss://abc123.execute-api.us-east-1.amazonaws.com/prod');

ws.onopen = () => {
    console.log('Connected');
    ws.send(JSON.stringify({action: 'sendMessage', message: 'Hello'}));
};

ws.onmessage = (event) => {
    console.log('Received:', event.data);
};

ws.onclose = () => {
    console.log('Disconnected');
};
```

## Monitoring

### CloudWatch Metrics

**Metrics**:
- `Count`: Number of API requests
- `4XXError`: Client-side errors
- `5XXError`: Server-side errors
- `Latency`: Time between request and response
- `IntegrationLatency`: Backend latency
- `CacheHitCount`: Cache hits
- `CacheMissCount`: Cache misses

**Alarms**:
```python
cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_alarm(
    AlarmName='API-High-Error-Rate',
    MetricName='5XXError',
    Namespace='AWS/ApiGateway',
    Statistic='Sum',
    Period=300,
    EvaluationPeriods=1,
    Threshold=10,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'ApiName', 'Value': 'MyAPI'},
        {'Name': 'Stage', 'Value': 'prod'}
    ]
)
```

### Access Logging

**Enable**:
```python
apigateway.update_stage(
    restApiId=api_id,
    stageName='prod',
    patchOperations=[
        {
            'op': 'replace',
            'path': '/accessLogSettings/destinationArn',
            'value': 'arn:aws:logs:us-east-1:123456789012:log-group:/aws/apigateway/MyAPI'
        },
        {
            'op': 'replace',
            'path': '/accessLogSettings/format',
            'value': json.dumps({
                'requestId': '$context.requestId',
                'ip': '$context.identity.sourceIp',
                'caller': '$context.identity.caller',
                'user': '$context.identity.user',
                'requestTime': '$context.requestTime',
                'httpMethod': '$context.httpMethod',
                'resourcePath': '$context.resourcePath',
                'status': '$context.status',
                'protocol': '$context.protocol',
                'responseLength': '$context.responseLength'
            })
        }
    ]
)
```

### X-Ray Tracing

**Enable**:
```python
apigateway.update_stage(
    restApiId=api_id,
    stageName='prod',
    patchOperations=[
        {
            'op': 'replace',
            'path': '/tracingEnabled',
            'value': 'true'
        }
    ]
)
```

## Real-World Scenarios

### Scenario 1: Serverless REST API

**Architecture**: API Gateway → Lambda → DynamoDB

**Cost** (1M requests/month):
```
API Gateway: 1M × $3.50/M = $3.50
Lambda: 1M × 200ms × 512MB = 100K GB-sec
  100K × $0.0000166667 = $1.67
DynamoDB: Read capacity (negligible for small dataset)
Total: ~$5.20/month
```

### Scenario 2: Real-Time Chat Application

**Architecture**: WebSocket API → Lambda → DynamoDB (connections)

**Cost** (100 users, 1M messages/month, 100 hours connection time):
```
WebSocket API:
  Messages: 1M × $1.00/M = $1.00
  Connection minutes: 100 users × 100 hours × 60 = 600K min
  600K min × $0.25/M = $0.15
Lambda: $1.50 (message processing)
DynamoDB: $0.50 (connection storage)
Total: ~$3.15/month
```

### Scenario 3: API with Caching

**6.1 GB cache** (80% hit rate):

**Without Cache**:
```
API Gateway: 10M × $3.50/M = $35.00
Lambda: 10M × 100ms × 256MB = 256K GB-sec = $4.27
Total: $39.27/month
```

**With Cache**:
```
API Gateway: 10M × $3.50/M = $35.00
Cache: 0.5 GB × $0.020/hour × 730 hours = $14.60
Lambda: 2M (20% miss) × 100ms × 256MB = 51.2K GB-sec = $0.85
Total: $50.45/month
```

Cache cost higher for this volume, but reduces backend load by 80%.

## Exam Tips (SAP-C02)

### Key Decision Points

**REST vs HTTP API**:
```
Advanced features (caching, transformation) → REST API
API keys, usage plans → REST API
Simple proxy → HTTP API
Cost optimization → HTTP API (71% cheaper)
```

**Integration Types**:
```
Lambda with simple pass-through → AWS_PROXY
Lambda with transformation → AWS
HTTP backend → HTTP_PROXY
AWS service direct → AWS
```

**Authorization**:
```
AWS resources → IAM
User authentication → Cognito User Pools
Custom logic → Lambda Authorizer
Simple API keys → API Keys + Usage Plans
```

### Common Scenarios

**"Serverless REST API"**:
- HTTP API for cost (or REST for features)
- Lambda integration (AWS_PROXY)
- Cognito or Lambda authorizer

**"Rate limiting"**:
- Usage plans with quotas
- API keys for identification
- Throttling settings

**"Real-time communication"**:
- WebSocket API
- Lambda integration
- DynamoDB for connection tracking

**"Legacy system integration"**:
- REST API
- HTTP integration to backend
- Request/response transformation

**"Multi-region failover"**:
- Route 53 failover routing
- Regional API endpoints
- Health checks

This comprehensive API Gateway guide covers REST, HTTP, and WebSocket APIs for SAP-C02 exam success.
