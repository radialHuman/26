# Amazon DynamoDB: Complete NoSQL Database Guide

## Table of Contents
1. [History & NoSQL Evolution](#history--nosql-evolution)
2. [DynamoDB Fundamentals](#dynamodb-fundamentals)
3. [Data Modeling](#data-modeling)
4. [Partition Keys & Sort Keys](#partition-keys--sort-keys)
5. [Global Secondary Indexes (GSI)](#global-secondary-indexes-gsi)
6. [Local Secondary Indexes (LSI)](#local-secondary-indexes-lsi)
7. [Single-Table Design](#single-table-design)
8. [DynamoDB Streams](#dynamodb-streams)
9. [Transactions](#transactions)
10. [Performance & Optimization](#performance--optimization)
11. [LocalStack Implementation](#localstack-implementation)
12. [Interview Questions](#interview-questions)

---

## History & NoSQL Evolution

### The Problem DynamoDB Solved (2012)

**Amazon's Internal Challenge** (2004-2007):
```
Problem: Amazon.com shopping cart needed:
✅ Millisecond latency at any scale
✅ High availability (99.99%+)
✅ Handle millions of requests/second
✅ No single point of failure

Traditional RDBMS couldn't scale horizontally
Sharding was complex and error-prone
```

**Dynamo Paper** (2007):
- Amazon published "Dynamo: Amazon's Highly Available Key-Value Store"
- Internal system powering shopping cart
- Key innovations:
  - Consistent hashing for data distribution
  - Vector clocks for conflict resolution
  - Eventual consistency model
  - Gossip protocol for failure detection

**DynamoDB Launch** (January 18, 2012):
```
Managed NoSQL database (Dynamo principles + improvements)
✅ Fully managed (no servers)
✅ Predictable performance at any scale
✅ Strong consistency option (not just eventual)
✅ Pay-per-request pricing
✅ Single-digit millisecond latency
```

### Evolution Timeline

```
2012: Launch (provisioned capacity only)
2013: Local Secondary Indexes
2014: Global Secondary Indexes
2015: DynamoDB Streams (change data capture)
2017: Auto Scaling, Global Tables (multi-region)
2018: On-Demand pricing, Transactions, Point-in-time recovery
2019: Adaptive capacity (automatic hot partition handling)
2020: PartiQL (SQL-like queries), Standard-IA storage class
2021: Import from S3
2022: Zero-ETL integration with Redshift
2023: Table classes (Standard, Standard-IA)
```

### NoSQL vs SQL Comparison

| Feature | SQL (RDS) | NoSQL (DynamoDB) |
|---------|-----------|------------------|
| Schema | Fixed (predefined) | Flexible (schemaless) |
| Scaling | Vertical (bigger server) | Horizontal (more nodes) |
| Queries | Rich (JOIN, aggregations) | Limited (key-value, scan) |
| Consistency | ACID transactions | Eventually consistent (or strong) |
| Use Case | Complex queries, reports | High-traffic, simple queries |
| Latency | 10-100 ms | Single-digit ms |

---

## DynamoDB Fundamentals

### Core Concepts

**Table**: Collection of items (like SQL table, but schemaless).

**Item**: Single data record (like SQL row).
```json
{
  "UserID": "123",
  "Name": "Alice",
  "Email": "alice@example.com",
  "Age": 30
}
```

**Attribute**: Key-value pair in item (like SQL column).

**Primary Key**: Uniquely identifies each item.
```
Simple primary key: Partition key only
Composite primary key: Partition key + Sort key
```

### Data Types

**Scalar**:
```
String (S): "Hello"
Number (N): 123, 45.67
Binary (B): Base64-encoded binary data
Boolean (BOOL): true, false
Null (NULL): null
```

**Document**:
```
List (L): [1, 2, "three", true]
Map (M): {"name": "Alice", "age": 30}
```

**Set**:
```
String Set (SS): ["red", "blue", "green"]
Number Set (NS): [1, 2, 3]
Binary Set (BS): [binary1, binary2]
```

### Capacity Modes

**1. On-Demand** (Pay-per-request):
```
Pricing:
- Writes: $1.25 per million
- Reads: $0.25 per million

Best for:
✅ Unpredictable traffic
✅ New applications
✅ Spiky workloads
❌ Steady, predictable traffic (more expensive)
```

**2. Provisioned** (Reserved capacity):
```
Read Capacity Unit (RCU):
- 1 strongly consistent read/second for 4 KB item
- 2 eventually consistent reads/second for 4 KB item

Write Capacity Unit (WCU):
- 1 write/second for 1 KB item

Pricing:
- WCU: $0.00065/hour = $0.47/month
- RCU: $0.00013/hour = $0.09/month

Best for:
✅ Predictable traffic
✅ Cost optimization (70%+ cheaper if consistent load)
```

**Capacity Calculation**:
```
Example: 100 reads/sec, 4 KB items, strong consistency
RCU = 100 × (4 KB / 4 KB) = 100 RCU

Example: 50 writes/sec, 2 KB items
WCU = 50 × ⌈2 KB / 1 KB⌉ = 50 × 2 = 100 WCU

Example: 100 reads/sec, 10 KB items, eventual consistency
RCU = 100 × (10 KB / 4 KB) / 2 = 100 × 3 / 2 = 150 RCU
```

---

## Data Modeling

### Key Design Principles

**1. Denormalization** (Opposite of SQL):
```
SQL:
Users table: UserID, Name, Email
Orders table: OrderID, UserID, Product

DynamoDB (denormalized):
Order item: {
  OrderID: "123",
  UserID: "456",
  UserName: "Alice",      // Duplicated!
  UserEmail: "alice@...", // Duplicated!
  Product: "Laptop"
}

Why: Avoid JOINs (DynamoDB doesn't support them)
Trade-off: Storage vs query performance
```

**2. Pre-compute Aggregations**:
```
Bad: Scan entire table to count orders per user

Good: Maintain OrderCount attribute on User item
Update +1 on each new order (transactions)
```

**3. Design for Access Patterns**:
```
Start with questions:
- What queries will you run?
- How often?
- What's the SLA (latency)?

Then design primary key and indexes
```

### Example: E-Commerce Data Model

**Access Patterns**:
```
1. Get user by UserID
2. Get user's orders
3. Get order by OrderID
4. Get all orders for a product
5. Get orders by status (pending, shipped)
```

**Single-Table Design**:
```
PK (Partition Key)    SK (Sort Key)           Attributes
-----------------------------------------------------------
USER#123              PROFILE                 Name, Email
USER#123              ORDER#456               Product, Status, Total
USER#123              ORDER#789               Product, Status, Total
PRODUCT#laptop        ORDER#456               UserID, Status
STATUS#pending        ORDER#456               UserID, Product
```

**Queries**:
```
1. Get user: PK = USER#123, SK = PROFILE
2. User's orders: PK = USER#123, SK begins_with ORDER#
3. Get order: PK = USER#123, SK = ORDER#456
4. Product orders: PK = PRODUCT#laptop
5. Pending orders: PK = STATUS#pending
```

---

## Partition Keys & Sort Keys

### Partition Key (Hash Key)

**Purpose**: Determines which partition stores the item.

**How it works**:
```
hash(PartitionKey) → Partition Number

Example:
hash("USER#123") → Partition 42
hash("USER#456") → Partition 87

All items with same partition key → Same partition
```

**Best Practices**:

**❌ Bad: Low cardinality (hot partitions)**:
```
PartitionKey = "Status"
Values: pending, shipped, delivered

Problem: If 80% of orders are "pending", 80% of traffic hits one partition
```

**✅ Good: High cardinality**:
```
PartitionKey = "UserID"
Values: USER#1, USER#2, USER#3, ... (millions)

Traffic distributed evenly across partitions
```

**❌ Bad: Sequential access**:
```
PartitionKey = "Date" (2024-01-01, 2024-01-02, ...)

Problem: All writes for today hit same partition (hot partition)
```

**✅ Good: Add randomness**:
```
PartitionKey = "Date#ShardID"
Values: 2024-01-01#0, 2024-01-01#1, ..., 2024-01-01#9

Distributes today's writes across 10 partitions
```

### Sort Key (Range Key)

**Purpose**: Orders items within same partition.

**Enables range queries**:
```
SK begins_with "ORDER#"
SK between "2024-01-01" and "2024-01-31"
SK > "ORDER#1000"
```

**Example**:
```
PK = USER#123

SK = ORDER#2024-01-01#456
SK = ORDER#2024-01-02#789
SK = ORDER#2024-01-03#012

Query: Get orders for January 2024
PK = USER#123
SK between ORDER#2024-01-01 and ORDER#2024-01-31
```

### Composite Keys

**Pattern**: Hierarchical data.
```
PK = TenantID#UserID
SK = Timestamp#EntityType

Example:
PK = TENANT#acme#USER#123
SK = 2024-01-01T10:00:00#LOGIN

Query all user's activities:
PK = TENANT#acme#USER#123
SK begins_with 2024-01-01
```

---

## Global Secondary Indexes (GSI)

### What is GSI?

**Alternative primary key** for querying.

**Table**:
```
PK: UserID
SK: OrderID

Can only query by UserID
```

**GSI**:
```
GSI PK: Status
GSI SK: Timestamp

Can now query by Status (all pending orders)
```

### GSI vs Table

| Feature | Base Table | GSI |
|---------|-----------|-----|
| Primary Key | Required | Different from base |
| Projection | All attributes | All, Keys Only, or Include |
| Consistency | Strong or Eventual | Eventual only |
| Capacity | Shared or separate | Always separate |
| Writes | Immediately reflected | Asynchronously updated |

### Creating GSI

**LocalStack Example**:
```bash
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name Orders \
  --attribute-definitions \
    AttributeName=UserID,AttributeType=S \
    AttributeName=OrderID,AttributeType=S \
    AttributeName=Status,AttributeType=S \
    AttributeName=Timestamp,AttributeType=N \
  --key-schema \
    AttributeName=UserID,KeyType=HASH \
    AttributeName=OrderID,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"StatusIndex\",
        \"KeySchema\": [
          {\"AttributeName\": \"Status\", \"KeyType\": \"HASH\"},
          {\"AttributeName\": \"Timestamp\", \"KeyType\": \"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\": \"ALL\"},
        \"ProvisionedThroughput\": {
          \"ReadCapacityUnits\": 5,
          \"WriteCapacityUnits\": 5
        }
      }
    ]" \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### GSI Projections

**ALL**: Copy all attributes (highest storage cost).
```json
{
  "ProjectionType": "ALL"
}
```

**KEYS_ONLY**: Only primary key and index key (lowest storage cost).
```json
{
  "ProjectionType": "KEYS_ONLY"
}
```

**INCLUDE**: Specific attributes.
```json
{
  "ProjectionType": "INCLUDE",
  "NonKeyAttributes": ["ProductName", "TotalAmount"]
}
```

### GSI Overloading

**Reuse GSI for multiple access patterns**:
```
GSI PK: Type
GSI SK: Data

Examples:
Type = USER, Data = Email → Query users by email
Type = PRODUCT, Data = Category → Query products by category
Type = ORDER, Data = Status#Timestamp → Query orders by status
```

---

## Local Secondary Indexes (LSI)

### GSI vs LSI

| Feature | GSI | LSI |
|---------|-----|-----|
| Partition Key | Different from table | Same as table |
| Sort Key | Different from table | Different from table |
| Created | Anytime | Only at table creation |
| Max per table | 20 | 5 |
| Consistency | Eventual only | Strong or eventual |
| Capacity | Separate | Shared with table |

### When to Use LSI

**Use Case**: Alternative sort key for same partition.

**Example**:
```
Table:
PK = UserID
SK = OrderID

LSI:
PK = UserID (same!)
SK = Timestamp

Now can query:
- Orders by OrderID (table)
- Orders by Timestamp (LSI)
Both for same user (UserID)
```

**Creating LSI**:
```bash
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name Orders \
  --attribute-definitions \
    AttributeName=UserID,AttributeType=S \
    AttributeName=OrderID,AttributeType=S \
    AttributeName=Timestamp,AttributeType=N \
  --key-schema \
    AttributeName=UserID,KeyType=HASH \
    AttributeName=OrderID,KeyType=RANGE \
  --local-secondary-indexes \
    "[
      {
        \"IndexName\": \"TimestampIndex\",
        \"KeySchema\": [
          {\"AttributeName\": \"UserID\", \"KeyType\": \"HASH\"},
          {\"AttributeName\": \"Timestamp\", \"KeyType\": \"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\": \"ALL\"}
      }
    ]" \
  --billing-mode PAY_PER_REQUEST
```

---

## Single-Table Design

### Why Single Table?

**Multi-table (SQL approach)**:
```
Users table
Orders table
Products table
Reviews table

Problem: Can't JOIN in DynamoDB
```

**Single-table (DynamoDB approach)**:
```
One table with creative PK/SK design

Benefits:
✅ Fewer read operations (get related data in one query)
✅ Transactions work within single table
✅ Easier capacity management
✅ Lower costs
```

### Complete E-Commerce Example

**Entities**: Users, Orders, Products, Reviews

**Table Design**:
```
PK                    SK                      EntityType  Attributes
-------------------------------------------------------------------
USER#alice            PROFILE                 User        Name, Email
USER#alice            ORDER#123               Order       Product, Total, Status
USER#alice            ORDER#456               Order       Product, Total, Status
PRODUCT#laptop        METADATA                Product     Name, Price, Stock
PRODUCT#laptop        REVIEW#USER#alice       Review      Rating, Comment
PRODUCT#laptop        REVIEW#USER#bob         Review      Rating, Comment
ORDER#123             METADATA                Order       UserID, Product, Total
```

**GSI for Additional Access Patterns**:
```
GSI1:
PK = EntityType
SK = CreatedAt

Query all products: GSI1PK = PRODUCT
Query all orders: GSI1PK = ORDER

GSI2:
PK = Status
SK = Timestamp

Query pending orders: GSI2PK = pending
```

**Code Example (Go)**:
```go
package main

import (
	"fmt"
	
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type BaseItem struct {
	PK         string `dynamodbav:"PK"`
	SK         string `dynamodbav:"SK"`
	EntityType string `dynamodbav:"EntityType"`
}

type UserProfile struct {
	BaseItem
	Name  string `dynamodbav:"Name"`
	Email string `dynamodbav:"Email"`
}

type Order struct {
	BaseItem
	OrderID string  `dynamodbav:"OrderID"`
	Product string  `dynamodbav:"Product"`
	Total   float64 `dynamodbav:"Total"`
	Status  string  `dynamodbav:"Status"`
}

func CreateUser(svc *dynamodb.DynamoDB, userID, name, email string) error {
	user := UserProfile{
		BaseItem: BaseItem{
			PK:         fmt.Sprintf("USER#%s", userID),
			SK:         "PROFILE",
			EntityType: "User",
		},
		Name:  name,
		Email: email,
	}
	
	item, _ := dynamodbattribute.MarshalMap(user)
	_, err := svc.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String("ECommerce"),
		Item:      item,
	})
	
	return err
}

func CreateOrder(svc *dynamodb.DynamoDB, userID, orderID, product string, total float64) error {
	order := Order{
		BaseItem: BaseItem{
			PK:         fmt.Sprintf("USER#%s", userID),
			SK:         fmt.Sprintf("ORDER#%s", orderID),
			EntityType: "Order",
		},
		OrderID: orderID,
		Product: product,
		Total:   total,
		Status:  "pending",
	}
	
	item, _ := dynamodbattribute.MarshalMap(order)
	_, err := svc.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String("ECommerce"),
		Item:      item,
	})
	
	return err
}

func GetUserOrders(svc *dynamodb.DynamoDB, userID string) ([]Order, error) {
	result, err := svc.Query(&dynamodb.QueryInput{
		TableName:              aws.String("ECommerce"),
		KeyConditionExpression: aws.String("PK = :pk AND begins_with(SK, :sk)"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":pk": {S: aws.String(fmt.Sprintf("USER#%s", userID))},
			":sk": {S: aws.String("ORDER#")},
		},
	})
	if err != nil {
		return nil, err
	}
	
	var orders []Order
	dynamodbattribute.UnmarshalListOfMaps(result.Items, &orders)
	
	return orders, nil
}
```

---

## DynamoDB Streams

### What are Streams?

**Change Data Capture** (CDC): Track all modifications to table.

**Stream Record**:
```json
{
  "eventID": "1",
  "eventName": "INSERT",
  "eventSource": "aws:dynamodb",
  "awsRegion": "us-east-1",
  "dynamodb": {
    "Keys": {
      "UserID": {"S": "alice"}
    },
    "NewImage": {
      "UserID": {"S": "alice"},
      "Name": {"S": "Alice Smith"},
      "Email": {"S": "alice@example.com"}
    },
    "SequenceNumber": "111",
    "SizeBytes": 26,
    "StreamViewType": "NEW_AND_OLD_IMAGES"
  }
}
```

### Stream View Types

**KEYS_ONLY**: Only primary key.
```json
{
  "Keys": {"UserID": {"S": "alice"}}
}
```

**NEW_IMAGE**: New item state.
```json
{
  "NewImage": {"UserID": {"S": "alice"}, "Name": {"S": "Alice"}}
}
```

**OLD_IMAGE**: Previous item state.
```json
{
  "OldImage": {"UserID": {"S": "alice"}, "Name": {"S": "Bob"}}
}
```

**NEW_AND_OLD_IMAGES**: Both (most common).
```json
{
  "OldImage": {"Name": {"S": "Bob"}},
  "NewImage": {"Name": {"S": "Alice"}}
}
```

### Use Cases

**1. Audit Log**:
```python
def lambda_handler(event, context):
    for record in event['Records']:
        event_name = record['eventName']  # INSERT, MODIFY, REMOVE
        user_id = record['dynamodb']['Keys']['UserID']['S']
        
        # Log to S3
        s3.put_object(
            Bucket='audit-logs',
            Key=f'{datetime.now().isoformat()}-{user_id}.json',
            Body=json.dumps(record)
        )
```

**2. Real-time Analytics**:
```python
def lambda_handler(event, context):
    for record in event['Records']:
        if record['eventName'] == 'INSERT':
            new_item = record['dynamodb']['NewImage']
            
            # Send to Kinesis for real-time processing
            kinesis.put_record(
                StreamName='user-events',
                Data=json.dumps(new_item),
                PartitionKey=new_item['UserID']['S']
            )
```

**3. Materialized Views**:
```python
def lambda_handler(event, context):
    """Update ElastiCache cache when DynamoDB changes"""
    for record in event['Records']:
        user_id = record['dynamodb']['Keys']['UserID']['S']
        
        if record['eventName'] in ['INSERT', 'MODIFY']:
            new_item = record['dynamodb']['NewImage']
            # Update cache
            redis.set(f'user:{user_id}', json.dumps(new_item))
        elif record['eventName'] == 'REMOVE':
            # Invalidate cache
            redis.delete(f'user:{user_id}')
```

**4. Cross-Region Replication** (Global Tables uses Streams internally).

---

## Transactions

### ACID in DynamoDB

**Atomicity**: All operations succeed or all fail.
**Consistency**: Data remains consistent.
**Isolation**: Concurrent transactions don't interfere.
**Durability**: Committed changes persist.

### TransactWriteItems

**Use Case**: Multiple writes that must succeed together.

**Example: Transfer money between accounts**:
```python
import boto3

dynamodb = boto3.client('dynamodb')

def transfer_money(from_account, to_account, amount):
    try:
        response = dynamodb.transact_write_items(
            TransactItems=[
                {
                    'Update': {
                        'TableName': 'Accounts',
                        'Key': {'AccountID': {'S': from_account}},
                        'UpdateExpression': 'SET Balance = Balance - :amount',
                        'ConditionExpression': 'Balance >= :amount',
                        'ExpressionAttributeValues': {
                            ':amount': {'N': str(amount)}
                        }
                    }
                },
                {
                    'Update': {
                        'TableName': 'Accounts',
                        'Key': {'AccountID': {'S': to_account}},
                        'UpdateExpression': 'SET Balance = Balance + :amount',
                        'ExpressionAttributeValues': {
                            ':amount': {'N': str(amount)}
                        }
                    }
                }
            ]
        )
        return True
    except dynamodb.exceptions.TransactionCanceledException as e:
        print(f"Transaction failed: {e}")
        return False

# Usage
transfer_money('ACCT#123', 'ACCT#456', 100)
```

**Limits**:
```
Max operations: 25 per transaction
Max item size: 400 KB total
Cost: 2x normal write cost
```

### TransactGetItems

**Atomic reads across multiple items**:
```python
response = dynamodb.transact_get_items(
    TransactItems=[
        {
            'Get': {
                'TableName': 'Users',
                'Key': {'UserID': {'S': 'alice'}}
            }
        },
        {
            'Get': {
                'TableName': 'Orders',
                'Key': {'OrderID': {'S': '123'}}
            }
        }
    ]
)

# All items retrieved at same point in time (consistent snapshot)
```

---

## Performance & Optimization

### Hot Partitions

**Problem**: Uneven data distribution.

**Example**:
```
Celebrity user with 1M followers
All writes go to partition with that UserID
```

**Solutions**:

**1. Add write sharding**:
```
Bad: PK = UserID (all writes to one partition)

Good: PK = UserID#ShardID
UserID#0, UserID#1, ..., UserID#9

Distribute writes across 10 partitions
Read: Query all 10 shards and merge
```

**2. Use sort key wisely**:
```
PK = UserID
SK = Timestamp#FollowerID

Writes distributed by timestamp
```

**3. Burst capacity**: DynamoDB reserves unused capacity (5 minutes).

### Query vs Scan

**Query** (Efficient):
```
Uses primary key or index
Returns items matching key condition
O(log n) complexity

Example:
PK = USER#123
Returns only that user's data
```

**Scan** (Expensive):
```
Reads entire table
Filters after reading
O(n) complexity

Example:
Scan all items where Age > 30
Reads ENTIRE table, then filters

Cost: Charged for ALL items scanned, not just returned
```

**When to use Scan**:
```
❌ Production queries (too slow, expensive)
✅ One-time data migration
✅ Analytics (export to S3, use Athena instead)
```

### Pagination

**Query returns max 1 MB**:
```python
def get_all_user_orders(user_id):
    items = []
    last_evaluated_key = None
    
    while True:
        params = {
            'TableName': 'Orders',
            'KeyConditionExpression': 'UserID = :uid',
            'ExpressionAttributeValues': {':uid': {'S': user_id}}
        }
        
        if last_evaluated_key:
            params['ExclusiveStartKey'] = last_evaluated_key
        
        response = dynamodb.query(**params)
        items.extend(response['Items'])
        
        last_evaluated_key = response.get('LastEvaluatedKey')
        if not last_evaluated_key:
            break
    
    return items
```

### Batch Operations

**BatchGetItem** (up to 100 items):
```python
response = dynamodb.batch_get_item(
    RequestItems={
        'Users': {
            'Keys': [
                {'UserID': {'S': 'alice'}},
                {'UserID': {'S': 'bob'}},
                {'UserID': {'S': 'charlie'}}
            ]
        }
    }
)
```

**BatchWriteItem** (up to 25 items):
```python
dynamodb.batch_write_item(
    RequestItems={
        'Users': [
            {
                'PutRequest': {
                    'Item': {'UserID': {'S': 'alice'}, 'Name': {'S': 'Alice'}}
                }
            },
            {
                'PutRequest': {
                    'Item': {'UserID': {'S': 'bob'}, 'Name': {'S': 'Bob'}}
                }
            }
        ]
    }
)
```

**Benefits**: 
- Reduces API calls
- Better throughput
- Lower latency

---

## LocalStack Implementation

### Complete CRUD (Python)

```python
import boto3
from boto3.dynamodb.conditions import Key, Attr

# LocalStack DynamoDB
dynamodb = boto3.resource(
    'dynamodb',
    endpoint_url='http://localhost:4566',
    region_name='us-east-1',
    aws_access_key_id='test',
    aws_secret_access_key='test'
)

# Create table
table = dynamodb.create_table(
    TableName='Users',
    KeySchema=[
        {'AttributeName': 'UserID', 'KeyType': 'HASH'},
        {'AttributeName': 'Timestamp', 'KeyType': 'RANGE'}
    ],
    AttributeDefinitions=[
        {'AttributeName': 'UserID', 'AttributeType': 'S'},
        {'AttributeName': 'Timestamp', 'AttributeType': 'N'},
        {'AttributeName': 'Email', 'AttributeType': 'S'}
    ],
    GlobalSecondaryIndexes=[
        {
            'IndexName': 'EmailIndex',
            'KeySchema': [
                {'AttributeName': 'Email', 'KeyType': 'HASH'}
            ],
            'Projection': {'ProjectionType': 'ALL'}
        }
    ],
    BillingMode='PAY_PER_REQUEST'
)

table.wait_until_exists()
print("✅ Table created")

# Put item
table.put_item(
    Item={
        'UserID': 'alice',
        'Timestamp': 1234567890,
        'Name': 'Alice Smith',
        'Email': 'alice@example.com',
        'Age': 30
    }
)
print("✅ Item created")

# Get item
response = table.get_item(
    Key={'UserID': 'alice', 'Timestamp': 1234567890}
)
print(f"✅ Retrieved: {response['Item']}")

# Update item
table.update_item(
    Key={'UserID': 'alice', 'Timestamp': 1234567890},
    UpdateExpression='SET Age = :age, #n = :name',
    ExpressionAttributeNames={'#n': 'Name'},
    ExpressionAttributeValues={
        ':age': 31,
        ':name': 'Alice Johnson'
    }
)
print("✅ Item updated")

# Query
response = table.query(
    KeyConditionExpression=Key('UserID').eq('alice')
)
print(f"✅ Query results: {response['Items']}")

# Query GSI
response = table.query(
    IndexName='EmailIndex',
    KeyConditionExpression=Key('Email').eq('alice@example.com')
)
print(f"✅ GSI query results: {response['Items']}")

# Scan with filter
response = table.scan(
    FilterExpression=Attr('Age').gt(25)
)
print(f"✅ Scan results: {response['Items']}")

# Delete item
table.delete_item(
    Key={'UserID': 'alice', 'Timestamp': 1234567890}
)
print("✅ Item deleted")
```

### Complete CRUD (Go)

```go
package main

import (
	"fmt"
	"time"
	
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
)

type User struct {
	UserID    string `dynamodbav:"UserID"`
	Timestamp int64  `dynamodbav:"Timestamp"`
	Name      string `dynamodbav:"Name"`
	Email     string `dynamodbav:"Email"`
	Age       int    `dynamodbav:"Age"`
}

func main() {
	sess := session.Must(session.NewSession(&aws.Config{
		Region:      aws.String("us-east-1"),
		Endpoint:    aws.String("http://localhost:4566"),
		Credentials: credentials.NewStaticCredentials("test", "test", ""),
	}))
	
	svc := dynamodb.New(sess)
	tableName := "Users"
	
	// Put item
	user := User{
		UserID:    "alice",
		Timestamp: time.Now().Unix(),
		Name:      "Alice Smith",
		Email:     "alice@example.com",
		Age:       30,
	}
	
	item, _ := dynamodbattribute.MarshalMap(user)
	_, err := svc.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	if err != nil {
		panic(err)
	}
	fmt.Println("✅ Item created")
	
	// Get item
	result, err := svc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"UserID":    {S: aws.String("alice")},
			"Timestamp": {N: aws.String(fmt.Sprintf("%d", user.Timestamp))},
		},
	})
	if err != nil {
		panic(err)
	}
	
	var retrievedUser User
	dynamodbattribute.UnmarshalMap(result.Item, &retrievedUser)
	fmt.Printf("✅ Retrieved: %+v\n", retrievedUser)
	
	// Update item
	update := expression.Set(
		expression.Name("Age"),
		expression.Value(31),
	)
	expr, _ := expression.NewBuilder().WithUpdate(update).Build()
	
	_, err = svc.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"UserID":    {S: aws.String("alice")},
			"Timestamp": {N: aws.String(fmt.Sprintf("%d", user.Timestamp))},
		},
		UpdateExpression:          expr.Update(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	})
	if err != nil {
		panic(err)
	}
	fmt.Println("✅ Item updated")
	
	// Query
	keyCondition := expression.Key("UserID").Equal(expression.Value("alice"))
	expr, _ = expression.NewBuilder().WithKeyCondition(keyCondition).Build()
	
	queryResult, err := svc.Query(&dynamodb.QueryInput{
		TableName:                 aws.String(tableName),
		KeyConditionExpression:    expr.KeyCondition(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	})
	if err != nil {
		panic(err)
	}
	
	var users []User
	dynamodbattribute.UnmarshalListOfMaps(queryResult.Items, &users)
	fmt.Printf("✅ Query results: %+v\n", users)
}
```

---

## Interview Questions

### Conceptual

**Q: DynamoDB vs RDS - when to use each?**
```
DynamoDB:
✅ Simple key-value queries
✅ Need single-digit ms latency
✅ Unpredictable scaling (0 to millions)
✅ Flexible schema
❌ Complex queries (JOINs, aggregations)
❌ ACID across multiple entities

RDS:
✅ Complex queries, JOINs
✅ ACID transactions
✅ Existing SQL codebase
✅ Analytics, reporting
❌ Scaling is harder (vertical mainly)
❌ Higher latency (10-100ms)
```

**Q: How does DynamoDB achieve scalability?**
```
1. Partitioning:
   - Data distributed across partitions using hash function
   - Each partition handles ~3000 RCU, ~1000 WCU
   - Automatic repartitioning as data grows

2. Stateless nodes:
   - Request routers are stateless
   - Scale horizontally without coordination

3. Adaptive capacity:
   - Automatically handles hot partitions
   - Borrows capacity from cold partitions

4. Storage:
   - Uses SSD for fast random access
   - Data replicated across 3 AZs
```

**Q: Partition key design best practices?**
```
✅ High cardinality (many unique values)
✅ Uniform access pattern
✅ Predictable size

❌ Sequential (timestamps, auto-increment IDs)
❌ Low cardinality (status, category)
❌ Celebrity problem (hot keys)

Solutions for hot partitions:
1. Add random suffix (UserID#0, UserID#1, ...)
2. Use composite keys
3. Precompute aggregations
```

### Design

**Q: Design Twitter timeline with DynamoDB**
```
Requirements:
- 300M users, 100M DAU
- User posts tweets
- User follows other users
- Get timeline (tweets from followed users)

Access Patterns:
1. Get user profile
2. Post tweet
3. Get user's tweets
4. Follow/unfollow user
5. Get timeline

Table Design:

PK                  SK                      Attributes
---------------------------------------------------
USER#alice          PROFILE                 Name, Bio
USER#alice          TWEET#timestamp#123     Content, Likes
USER#alice          FOLLOWS#bob             (Empty)
TIMELINE#alice      timestamp#TWEET#456     Content, AuthorID

GSI1 (for hashtags):
PK = HASHTAG#aws
SK = timestamp
ProjectedAttributes: TweetID, AuthorID

Operations:

1. Get profile:
   PK = USER#alice, SK = PROFILE

2. Post tweet:
   - Write to USER#alice, SK = TWEET#<timestamp>#<id>
   - Fan-out to followers' timelines (async, Lambda + DynamoDB Streams)

3. Get timeline:
   PK = TIMELINE#alice
   SK between <start> and <end>
   (Precomputed, eventual consistency OK)

4. Follow user:
   Put item: PK = USER#alice, SK = FOLLOWS#bob

Optimizations:
- Celebrity problem: Don't fan-out if > 1M followers (fetch on-demand)
- Cache timelines in ElastiCache
- DynamoDB Streams → Lambda → Fan-out worker
```

**Q: How to handle 1M writes/second to DynamoDB?**
```
Challenges:
- Default account limit: 40K WCU
- Single partition limit: 1K WCU

Solutions:

1. Request limit increase (AWS Support)

2. Partition key design:
   Bad: PK = Date (all writes to one partition)
   Good: PK = Date#ShardID (shard 0-999)
   → Distributes to 1000 partitions = 1M WCU theoretical

3. Use write sharding:
   def get_partition_key(item_id):
       shard = hash(item_id) % 1000
       return f"SHARD#{shard}#{item_id}"

4. Batch writes (25 items per call)
   → Reduces API overhead

5. On-Demand pricing (automatically scales)

6. Consider Kinesis + Lambda → DynamoDB
   Kinesis: Buffer spikes
   Lambda: Batch writes to DynamoDB
```

**Q: Single-table design vs multi-table?**
```
Single-table:
✅ Related data in one query (user + orders)
✅ Transactions work across entities
✅ Simpler capacity management
✅ Lower cost (fewer read operations)
❌ Complex schema design
❌ Harder to understand
❌ All entities share same throughput

Multi-table:
✅ Simple schema (one entity per table)
✅ Independent scaling per entity
✅ Easier to understand
❌ No JOINs (multiple queries)
❌ Transactions don't work across tables
❌ Higher cost

Recommendation:
Single-table for:
- Related entities (e-commerce: users, orders, products)
- Predictable access patterns
- Cost optimization

Multi-table for:
- Independent entities
- Different scaling needs
- Team prefers simpler schema
```

---

This comprehensive DynamoDB guide covers everything from history through advanced patterns with complete LocalStack implementations! 🚀

