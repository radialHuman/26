# Cloud Services with AWS LocalStack: Complete Local Development Guide

## Table of Contents
1. [Introduction to LocalStack](#introduction-to-localstack)
2. [LocalStack Setup](#localstack-setup)
3. [S3 Object Storage](#s3-object-storage)
4. [Lambda Serverless Functions](#lambda-serverless-functions)
5. [DynamoDB NoSQL Database](#dynamodb-nosql-database)
6. [SQS Message Queue](#sqs-message-queue)
7. [SNS Pub/Sub](#sns-pubsub)
8. [API Gateway](#api-gateway)
9. [Complete Application Example](#complete-application-example)
10. [Production Migration](#production-migration)

---

## Introduction to LocalStack

### What is LocalStack?

**LocalStack** is a fully functional local AWS cloud stack that emulates AWS services on your local machine.

**Benefits**:
```
✅ Develop offline (no internet required)
✅ Zero AWS costs (no credit card needed)
✅ Fast iteration (no network latency)
✅ Test infrastructure as code locally
✅ CI/CD integration
```

**Supported Services** (Free Tier):
```
- S3 (object storage)
- Lambda (serverless functions)
- DynamoDB (NoSQL database)
- SQS (message queue)
- SNS (pub/sub messaging)
- API Gateway (HTTP APIs)
- CloudWatch (logs)
- EventBridge (event bus)
- Secrets Manager
- And 50+ more!
```

---

## LocalStack Setup

### Installation (Docker)

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    container_name: localstack
    ports:
      - "4566:4566"            # LocalStack Gateway
      - "4510-4559:4510-4559"  # External services
    environment:
      - SERVICES=s3,dynamodb,sqs,sns,lambda,apigateway
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "./localstack-data:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
```

**Start LocalStack**:
```bash
docker-compose up -d

# Check status
docker-compose logs -f localstack

# Expected output:
# Ready.
```

### AWS CLI Configuration

**~/.aws/config**:
```ini
[profile localstack]
region = us-east-1
output = json
```

**~/.aws/credentials**:
```ini
[localstack]
aws_access_key_id = test
aws_secret_access_key = test
```

**Test Connection**:
```bash
aws --endpoint-url=http://localhost:4566 --profile localstack s3 ls

# Should return empty (no buckets yet)
```

---

## S3 Object Storage

### Creating Buckets

**CLI**:
```bash
aws --endpoint-url=http://localhost:4566 s3 mb s3://my-bucket

# Output: make_bucket: my-bucket
```

### Upload/Download Files (Go)

```go
package main

import (
	"bytes"
	"fmt"
	"log"
	
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

func main() {
	// LocalStack configuration
	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String("us-east-1"),
		Endpoint:    aws.String("http://localhost:4566"),
		Credentials: credentials.NewStaticCredentials("test", "test", ""),
		S3ForcePathStyle: aws.Bool(true), // Required for LocalStack
	})
	if err != nil {
		log.Fatal(err)
	}
	
	svc := s3.New(sess)
	
	// Upload file
	bucket := "my-bucket"
	key := "files/example.txt"
	content := []byte("Hello from LocalStack S3!")
	
	_, err = svc.PutObject(&s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   bytes.NewReader(content),
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("✅ Uploaded successfully")
	
	// Download file
	result, err := svc.GetObject(&s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		log.Fatal(err)
	}
	defer result.Body.Close()
	
	buf := new(bytes.Buffer)
	buf.ReadFrom(result.Body)
	
	fmt.Printf("✅ Downloaded: %s\n", buf.String())
}
```

### Upload/Download Files (Python)

```python
import boto3

# LocalStack S3 client
s3 = boto3.client(
    's3',
    endpoint_url='http://localhost:4566',
    aws_access_key_id='test',
    aws_secret_access_key='test',
    region_name='us-east-1'
)

# Create bucket
s3.create_bucket(Bucket='my-bucket')

# Upload
s3.put_object(
    Bucket='my-bucket',
    Key='files/example.txt',
    Body=b'Hello from LocalStack S3!'
)
print("✅ Uploaded")

# Download
response = s3.get_object(Bucket='my-bucket', Key='files/example.txt')
content = response['Body'].read().decode('utf-8')
print(f"✅ Downloaded: {content}")
```

---

## Lambda Serverless Functions

### Create Lambda Function (Python)

**lambda_function.py**:
```python
import json

def lambda_handler(event, context):
    name = event.get('name', 'World')
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': f'Hello, {name}!',
            'input': event
        })
    }
```

**Package**:
```bash
zip lambda.zip lambda_function.py
```

**Deploy to LocalStack**:
```bash
aws --endpoint-url=http://localhost:4566 lambda create-function \
  --function-name my-function \
  --runtime python3.9 \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda.zip
```

**Invoke**:
```bash
aws --endpoint-url=http://localhost:4566 lambda invoke \
  --function-name my-function \
  --payload '{"name": "Alice"}' \
  response.json

cat response.json
# {"statusCode": 200, "body": "{\"message\": \"Hello, Alice!\", ...}"}
```

### Lambda with Go

**main.go**:
```go
package main

import (
	"context"
	"encoding/json"
	
	"github.com/aws/aws-lambda-go/lambda"
)

type Request struct {
	Name string `json:"name"`
}

type Response struct {
	StatusCode int               `json:"statusCode"`
	Body       map[string]string `json:"body"`
}

func handler(ctx context.Context, req Request) (Response, error) {
	name := req.Name
	if name == "" {
		name = "World"
	}
	
	return Response{
		StatusCode: 200,
		Body: map[string]string{
			"message": "Hello, " + name + "!",
		},
	}, nil
}

func main() {
	lambda.Start(handler)
}
```

**Build**:
```bash
GOOS=linux GOARCH=amd64 go build -o bootstrap main.go
zip lambda.zip bootstrap
```

**Deploy**:
```bash
aws --endpoint-url=http://localhost:4566 lambda create-function \
  --function-name go-function \
  --runtime provided.al2 \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --handler bootstrap \
  --zip-file fileb://lambda.zip
```

---

## DynamoDB NoSQL Database

### Create Table

```bash
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name Users \
  --attribute-definitions \
      AttributeName=UserID,AttributeType=S \
  --key-schema \
      AttributeName=UserID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### CRUD Operations (Go)

```go
package main

import (
	"fmt"
	"log"
	
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type User struct {
	UserID string `json:"user_id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
}

func main() {
	sess := session.Must(session.NewSession(&aws.Config{
		Region:      aws.String("us-east-1"),
		Endpoint:    aws.String("http://localhost:4566"),
		Credentials: credentials.NewStaticCredentials("test", "test", ""),
	}))
	
	svc := dynamodb.New(sess)
	
	// Create
	user := User{
		UserID: "123",
		Name:   "Alice",
		Email:  "alice@example.com",
	}
	
	item, _ := dynamodbattribute.MarshalMap(user)
	_, err := svc.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String("Users"),
		Item:      item,
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("✅ Created user")
	
	// Read
	result, err := svc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String("Users"),
		Key: map[string]*dynamodb.AttributeValue{
			"UserID": {S: aws.String("123")},
		},
	})
	if err != nil {
		log.Fatal(err)
	}
	
	var retrievedUser User
	dynamodbattribute.UnmarshalMap(result.Item, &retrievedUser)
	fmt.Printf("✅ Retrieved: %+v\n", retrievedUser)
}
```

### CRUD Operations (Python)

```python
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource(
    'dynamodb',
    endpoint_url='http://localhost:4566',
    region_name='us-east-1',
    aws_access_key_id='test',
    aws_secret_access_key='test'
)

table = dynamodb.Table('Users')

# Create
table.put_item(Item={
    'UserID': '123',
    'Name': 'Alice',
    'Email': 'alice@example.com'
})
print("✅ Created user")

# Read
response = table.get_item(Key={'UserID': '123'})
print(f"✅ Retrieved: {response['Item']}")

# Update
table.update_item(
    Key={'UserID': '123'},
    UpdateExpression='SET #name = :name',
    ExpressionAttributeNames={'#name': 'Name'},
    ExpressionAttributeValues={':name': 'Alice Updated'}
)
print("✅ Updated user")

# Delete
table.delete_item(Key={'UserID': '123'})
print("✅ Deleted user")
```

---

## SQS Message Queue

### Create Queue & Send/Receive Messages (Python)

```python
import boto3
import json

sqs = boto3.client(
    'sqs',
    endpoint_url='http://localhost:4566',
    region_name='us-east-1',
    aws_access_key_id='test',
    aws_secret_access_key='test'
)

# Create queue
response = sqs.create_queue(QueueName='my-queue')
queue_url = response['QueueUrl']
print(f"✅ Queue URL: {queue_url}")

# Send message
sqs.send_message(
    QueueUrl=queue_url,
    MessageBody=json.dumps({
        'order_id': '12345',
        'product': 'Laptop',
        'quantity': 2
    })
)
print("✅ Message sent")

# Receive message
messages = sqs.receive_message(
    QueueUrl=queue_url,
    MaxNumberOfMessages=10,
    WaitTimeSeconds=5
)

if 'Messages' in messages:
    for msg in messages['Messages']:
        body = json.loads(msg['Body'])
        print(f"✅ Received: {body}")
        
        # Delete message
        sqs.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=msg['ReceiptHandle']
        )
        print("✅ Message deleted")
```

### Producer/Consumer Pattern (Go)

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"
	
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
)

type Order struct {
	OrderID  string `json:"order_id"`
	Product  string `json:"product"`
	Quantity int    `json:"quantity"`
}

func main() {
	sess := session.Must(session.NewSession(&aws.Config{
		Region:      aws.String("us-east-1"),
		Endpoint:    aws.String("http://localhost:4566"),
		Credentials: credentials.NewStaticCredentials("test", "test", ""),
	}))
	
	svc := sqs.New(sess)
	queueURL := "http://localhost:4566/000000000000/my-queue"
	
	// Producer
	go func() {
		for i := 0; i < 5; i++ {
			order := Order{
				OrderID:  fmt.Sprintf("order-%d", i),
				Product:  "Laptop",
				Quantity: i + 1,
			}
			
			body, _ := json.Marshal(order)
			
			_, err := svc.SendMessage(&sqs.SendMessageInput{
				QueueUrl:    aws.String(queueURL),
				MessageBody: aws.String(string(body)),
			})
			if err != nil {
				log.Fatal(err)
			}
			
			fmt.Printf("📤 Sent: %s\n", order.OrderID)
			time.Sleep(1 * time.Second)
		}
	}()
	
	// Consumer
	for {
		result, err := svc.ReceiveMessage(&sqs.ReceiveMessageInput{
			QueueUrl:            aws.String(queueURL),
			MaxNumberOfMessages: aws.Int64(10),
			WaitTimeSeconds:     aws.Int64(5),
		})
		if err != nil {
			log.Fatal(err)
		}
		
		for _, msg := range result.Messages {
			var order Order
			json.Unmarshal([]byte(*msg.Body), &order)
			
			fmt.Printf("📥 Received: %s (Quantity: %d)\n", order.OrderID, order.Quantity)
			
			// Process order...
			time.Sleep(500 * time.Millisecond)
			
			// Delete message
			svc.DeleteMessage(&sqs.DeleteMessageInput{
				QueueUrl:      aws.String(queueURL),
				ReceiptHandle: msg.ReceiptHandle,
			})
		}
	}
}
```

---

## Complete Application Example

### E-Commerce Order Processing System

**Architecture**:
```
┌─────────────┐
│  API Gateway│ → Lambda (Create Order)
└──────┬──────┘            ↓
       │            ┌──────────────┐
       │            │  DynamoDB    │ (Store Order)
       │            └──────┬───────┘
       │                   ↓
       │            ┌──────────────┐
       │            │  SQS Queue   │ (Order Queue)
       │            └──────┬───────┘
       │                   ↓
       │            Lambda (Process Order) → SNS (Notification)
       │                   ↓
       │            ┌──────────────┐
       │            │  S3 Bucket   │ (Invoice PDF)
       │            └──────────────┘
```

**Terraform Setup** (Infrastructure as Code):
```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  
  endpoints {
    s3       = "http://localhost:4566"
    dynamodb = "http://localhost:4566"
    sqs      = "http://localhost:4566"
    sns      = "http://localhost:4566"
    lambda   = "http://localhost:4566"
  }
}

# DynamoDB Table
resource "aws_dynamodb_table" "orders" {
  name         = "Orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "OrderID"
  
  attribute {
    name = "OrderID"
    type = "S"
  }
}

# S3 Bucket for Invoices
resource "aws_s3_bucket" "invoices" {
  bucket = "order-invoices"
}

# SQS Queue
resource "aws_sqs_queue" "order_queue" {
  name = "order-processing-queue"
}

# SNS Topic
resource "aws_sns_topic" "order_notifications" {
  name = "order-notifications"
}
```

**Deploy**:
```bash
terraform init
terraform apply -auto-approve

# Output:
# aws_dynamodb_table.orders: Created
# aws_s3_bucket.invoices: Created
# aws_sqs_queue.order_queue: Created
# aws_sns_topic.order_notifications: Created
```

---

## Production Migration

### Environment Configuration

**config.py**:
```python
import os

ENV = os.getenv('ENVIRONMENT', 'local')

if ENV == 'local':
    # LocalStack
    AWS_ENDPOINT = 'http://localhost:4566'
    AWS_REGION = 'us-east-1'
    AWS_ACCESS_KEY = 'test'
    AWS_SECRET_KEY = 'test'
elif ENV == 'production':
    # Real AWS
    AWS_ENDPOINT = None  # Use default AWS endpoints
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
    AWS_ACCESS_KEY = None  # Use IAM roles
    AWS_SECRET_KEY = None
```

**Usage**:
```python
import boto3
from config import AWS_ENDPOINT, AWS_REGION

s3 = boto3.client(
    's3',
    endpoint_url=AWS_ENDPOINT,  # None in production
    region_name=AWS_REGION
)

# Same code works locally and in production!
```

### Testing Strategy

```python
import pytest
import boto3
from moto import mock_s3  # Alternative to LocalStack for unit tests

@mock_s3
def test_s3_upload():
    # In-memory S3 mock
    s3 = boto3.client('s3', region_name='us-east-1')
    s3.create_bucket(Bucket='test-bucket')
    
    s3.put_object(Bucket='test-bucket', Key='test.txt', Body=b'Hello')
    
    response = s3.get_object(Bucket='test-bucket', Key='test.txt')
    assert response['Body'].read() == b'Hello'
```

---

This complete LocalStack guide enables full local AWS development with zero costs, fast iteration, and seamless production migration!
