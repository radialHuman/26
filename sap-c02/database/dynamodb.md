# Amazon DynamoDB

## What is DynamoDB?

Amazon DynamoDB is a fully managed, serverless NoSQL database service that provides fast and predictable performance with seamless scalability. It's designed for applications that need consistent, single-digit millisecond latency at any scale.

## Why Use DynamoDB?

### Key Benefits
- **Fully Managed**: No servers to provision, patch, or manage
- **Serverless**: Auto-scaling, pay per request option
- **Performance**: Single-digit millisecond latency (consistent)
- **Scalability**: Unlimited storage, throughput scales automatically
- **High Availability**: 99.99% SLA (99.999% with Global Tables)
- **ACID Transactions**: Full transaction support
- **Event-Driven**: DynamoDB Streams integration
- **Global**: Multi-region, multi-active replication

### Use Cases
- Mobile and web applications
- Gaming leaderboards
- IoT data storage
- Real-time bidding
- Shopping carts
- Session management
- Metadata storage
- Time series data

## Core Concepts

### Tables, Items, and Attributes

**Table**: Collection of data (like relational table but schemaless)
```
Users Table:
  Item 1: {UserID: "123", Name: "Alice", Email: "alice@example.com"}
  Item 2: {UserID: "456", Name: "Bob", Email: "bob@example.com", Age: 30}
  Item 3: {UserID: "789", Name: "Charlie"}
```

**Item**: Individual record (like row, max 400 KB)

**Attribute**: Data element (like column)
- No fixed schema (except primary key)
- Items can have different attributes

### Primary Keys

**Two Types**:

**1. Partition Key (Simple Primary Key)**:
```
Table: Users
Partition Key: UserID

UserID (Partition Key)    Name        Email
123                       Alice       alice@example.com
456                       Bob         bob@example.com
789                       Charlie     charlie@example.com

Query: Get item where UserID = "123" (fast, single-item lookup)
```

**2. Partition Key + Sort Key (Composite Primary Key)**:
```
Table: Orders
Partition Key: UserID
Sort Key: OrderDate

UserID    OrderDate        OrderID    Amount
123       2026-01-15       ORD-001    $50
123       2026-01-20       ORD-002    $75
123       2026-01-25       ORD-003    $100
456       2026-01-18       ORD-004    $200

Query: Get all orders for UserID = "123" (returns 3 items)
Query: Get orders for UserID = "123" where OrderDate >= "2026-01-20" (returns 2 items)
```

**Partition Key Selection**:
- High cardinality (many unique values)
- Even distribution of data
- Avoid hot partitions

**Good**:
```
UserID (unique per user)
DeviceID (unique per device)
SessionID (unique per session)
```

**Bad**:
```
Country (few unique values, hot partitions)
Department (few values)
Status (active/inactive only)
```

### Data Types

**Scalar Types**:
- String: "Hello"
- Number: 123, 45.67
- Binary: Base64-encoded
- Boolean: true, false
- Null: null

**Set Types**:
- String Set: ["Red", "Green", "Blue"]
- Number Set: [1, 2, 3, 5, 8]
- Binary Set: [Binary1, Binary2]

**Document Types**:
- List: [1, "two", 3.0, true]
- Map: {"Name": "Alice", "Age": 30, "Address": {"City": "Seattle"}}

**Example**:
```json
{
  "UserID": "123",
  "Name": "Alice",
  "Age": 30,
  "IsActive": true,
  "Tags": ["premium", "verified"],
  "Address": {
    "Street": "123 Main St",
    "City": "Seattle",
    "ZipCode": "98101"
  },
  "Orders": [
    {"OrderID": "ORD-001", "Amount": 50},
    {"OrderID": "ORD-002", "Amount": 75}
  ]
}
```

## Read/Write Capacity Modes

### 1. Provisioned Mode

**What**: Pre-provision read and write capacity units

**Capacity Units**:
- **RCU (Read Capacity Unit)**: 
  - 1 strongly consistent read per second (up to 4 KB)
  - 2 eventually consistent reads per second (up to 4 KB)
  - 0.5 transactional read per second (up to 4 KB)
  
- **WCU (Write Capacity Unit)**:
  - 1 write per second (up to 1 KB)
  - 0.5 transactional write per second (up to 1 KB)

**Calculations**:

**Reads**:
```
Scenario 1: 100 strongly consistent reads/sec, 8 KB per item
RCU = 100 reads/sec × (8 KB / 4 KB) = 200 RCU

Scenario 2: 100 eventually consistent reads/sec, 8 KB per item
RCU = 100 reads/sec × (8 KB / 4 KB) / 2 = 100 RCU

Scenario 3: 6 KB item (rounds up to 8 KB)
RCU = 1 × (8 KB / 4 KB) = 2 RCU per read
```

**Writes**:
```
Scenario 1: 50 writes/sec, 3 KB per item (rounds up to 3 KB)
WCU = 50 writes/sec × (3 KB / 1 KB) = 150 WCU

Scenario 2: 1.5 KB item (rounds up to 2 KB)
WCU = 1 × (2 KB / 1 KB) = 2 WCU per write
```

**Auto Scaling**:
```
Enable auto scaling:
  Target utilization: 70%
  Min capacity: 5 RCU, 5 WCU
  Max capacity: 1000 RCU, 1000 WCU

Behavior:
  Current: 50 RCU, utilization 80% (above target)
  Auto scaling: Increases to ~58 RCU (bring utilization to 70%)
  
  Current: 50 RCU, utilization 50% (below target)
  Auto scaling: Decreases to ~36 RCU (bring utilization to 70%)
```

**Reserved Capacity**:
- 1 or 3-year commitment
- Savings: Up to 75%
- Example:
  ```
  100 RCU, 100 WCU On-Demand: $85/month
  100 RCU, 100 WCU Reserved (1-year): $51/month (40% savings)
  100 RCU, 100 WCU Reserved (3-year): $21/month (75% savings)
  ```

**Cost** (us-east-1):
```
RCU: $0.00013 per hour = $0.0936/month per RCU
WCU: $0.00065 per hour = $0.4680/month per WCU

Example (100 RCU, 50 WCU):
  Reads: 100 × $0.0936 = $9.36/month
  Writes: 50 × $0.4680 = $23.40/month
  Total: $32.76/month
```

**When to Use**:
- Predictable traffic
- Steady state workload
- Cost optimization (with reserved capacity)

### 2. On-Demand Mode

**What**: Pay per request, no capacity planning

**Pricing**:
- **Read Request**: $0.25 per million
- **Write Request**: $1.25 per million
- Unlimited scaling (no throttling)

**Cost Calculation**:
```
Scenario: 1 million reads (8 KB), 500K writes (2 KB) per month

Reads: 1M × (8 KB / 4 KB) × $0.25 / 1M = $0.50
Writes: 500K × (2 KB / 1 KB) × $1.25 / 1M = $1.25
Total: $1.75/month

vs Provisioned (100 RCU, 50 WCU): $32.76/month
On-Demand cheaper for low, unpredictable traffic
```

**When to Use**:
- Unpredictable workloads
- New applications (unknown traffic)
- Pay-as-you-go preference
- Spiky traffic

**Switching**:
- Can switch between modes once per 24 hours
- No downtime

### Provisioned vs On-Demand

| Factor | Provisioned | On-Demand |
|--------|-------------|-----------|
| Capacity planning | Required | Automatic |
| Cost (steady) | Lower | Higher |
| Cost (variable) | Risk of over-provision | Pay actual usage |
| Throttling | Yes (if exceed) | No |
| Auto scaling | Yes | N/A |
| Best for | Predictable traffic | Unpredictable traffic |

**Break-Even Analysis**:
```
Provisioned (100 RCU, 50 WCU): $32.76/month

On-Demand equivalent:
  Reads: $32.76 × 0.3 (approx RCU share) = ~70M requests/month
  Writes: $32.76 × 0.7 (approx WCU share) = ~18M requests/month

If < 70M reads AND < 18M writes: On-Demand cheaper
If > traffic above: Provisioned cheaper
```

## Indexes

### Global Secondary Index (GSI)

**What**: Alternate primary key (different partition key and/or sort key)

**Use Case**: Query table using attributes other than primary key

**Example**:
```
Base Table: Users
Primary Key: UserID

Item: {UserID: "123", Email: "alice@example.com", Name: "Alice", Status: "active"}

GSI: EmailIndex
  Partition Key: Email
  
Query: Get user by Email = "alice@example.com"
  Without GSI: Scan entire table (slow, expensive)
  With GSI: Fast query using EmailIndex
```

**Characteristics**:
- **Eventually consistent**: GSI updates asynchronously
- **Separate capacity**: GSI has own RCU/WCU (provisioned mode)
- **Projection**: Choose which attributes to project
  - KEYS_ONLY: Only keys
  - INCLUDE: Keys + specified attributes
  - ALL: All attributes (most storage, most flexible)
- **Limit**: 20 GSIs per table

**Cost**:
```
Base Table: 100 GB, 100 RCU, 100 WCU
GSI (ALL projection): 100 GB replicated, 50 RCU, 50 WCU

Storage: (100 + 100) GB × $0.25 = $50/month
RCU: (100 + 50) × $0.0936 = $14.04/month
WCU: (100 + 50) × $0.4680 = $70.20/month
Total: $134.24/month (vs $56.16 without GSI)
```

**Projection Optimization**:
```
Scenario: Only need Email and Status in queries

KEYS_ONLY + INCLUDE [Email, Status]:
  Storage: ~30 GB (vs 100 GB with ALL)
  Savings: 70 GB × $0.25 = $17.50/month
```

### Local Secondary Index (LSI)

**What**: Same partition key, alternate sort key

**Use Case**: Query same partition with different sort orders

**Example**:
```
Base Table: Orders
Partition Key: UserID
Sort Key: OrderDate

Item: {UserID: "123", OrderDate: "2026-01-15", OrderID: "ORD-001", Amount: 50}

LSI: AmountIndex
  Partition Key: UserID (same as base table)
  Sort Key: Amount
  
Query: Get orders for UserID = "123" sorted by Amount (instead of OrderDate)
  Returns orders in price order
```

**Characteristics**:
- **Strongly consistent**: LSI updates synchronously
- **Shared capacity**: Uses base table's RCU/WCU
- **Must create at table creation**: Cannot add later
- **Limit**: 5 LSIs per table
- **Item size limit**: 10 GB per partition key value (base table + LSIs)

**LSI vs GSI**:
| Feature | LSI | GSI |
|---------|-----|-----|
| Partition key | Same as base | Different |
| Sort key | Different | Different (optional) |
| Consistency | Strong | Eventual |
| Capacity | Shared | Separate |
| Creation | Table creation only | Anytime |
| Limit | 5 | 20 |

**When to Use LSI**:
- Need strong consistency
- Querying same partition with different sort orders
- Define at table creation

**When to Use GSI**:
- Query by different partition key
- Need flexibility (can add/remove)
- Eventually consistent acceptable

## Querying and Scanning

### Query

**What**: Retrieve items using primary key or index keys

**Partition Key Required**: Always specify partition key

**Sort Key Optional**: Can filter by sort key

**Example**:
```python
import boto3
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Orders')

# Query: All orders for UserID = "123"
response = table.query(
    KeyConditionExpression=Key('UserID').eq('123')
)

# Query: Orders for UserID = "123" where OrderDate >= "2026-01-20"
response = table.query(
    KeyConditionExpression=Key('UserID').eq('123') & Key('OrderDate').gte('2026-01-20')
)

# Query with filter (applied after retrieval, consumes RCU for all items)
response = table.query(
    KeyConditionExpression=Key('UserID').eq('123'),
    FilterExpression=Attr('Amount').gt(100)
)
```

**Performance**:
- Fast (uses index)
- Efficient (returns only matching items)
- Max 1 MB per query (use pagination for more)

**Pagination**:
```python
items = []
response = table.query(KeyConditionExpression=Key('UserID').eq('123'))
items.extend(response['Items'])

while 'LastEvaluatedKey' in response:
    response = table.query(
        KeyConditionExpression=Key('UserID').eq('123'),
        ExclusiveStartKey=response['LastEvaluatedKey']
    )
    items.extend(response['Items'])
```

### Scan

**What**: Read entire table or index

**Use Case**: Need all items or no known key

**Example**:
```python
# Scan entire table
response = table.scan()

# Scan with filter
response = table.scan(
    FilterExpression=Attr('Status').eq('active')
)
```

**Performance**:
- Slow (reads entire table)
- Expensive (consumes RCU for all items, even filtered)
- Should be avoided in production for large tables

**Parallel Scan**:
```python
# Divide table into 4 segments, scan in parallel
for segment in range(4):
    response = table.scan(
        Segment=segment,
        TotalSegments=4
    )
    # Process segment
```

**Scan vs Query**:
```
Query (UserID = "123"):
  - Reads only items with UserID = "123"
  - Fast, efficient
  - RCU: Only for returned items

Scan (FilterExpression: UserID = "123"):
  - Reads entire table
  - Filters after reading
  - RCU: For entire table (wasteful)
```

**Best Practices**:
- **Avoid scans**: Use queries with indexes
- **If scan needed**: Use parallel scan, limit page size
- **Filter expressions**: Apply on query results, not scan (when possible)

## DynamoDB Streams

### What are Streams?

**Purpose**: Capture time-ordered sequence of item-level changes

**Use Cases**:
- Replicate data to other tables
- Trigger Lambda functions on changes
- Audit logs
- Real-time analytics
- Notifications

**Stream Records**:
```
Stream record contains:
  - Event type: INSERT, MODIFY, REMOVE
  - Before and after images (optional)
  - Timestamp
  - Keys

View Types:
  - KEYS_ONLY: Only keys
  - NEW_IMAGE: Entire item after change
  - OLD_IMAGE: Entire item before change
  - NEW_AND_OLD_IMAGES: Both before and after
```

**Example**:
```json
{
  "eventID": "1",
  "eventName": "MODIFY",
  "eventVersion": "1.1",
  "eventSource": "aws:dynamodb",
  "awsRegion": "us-east-1",
  "dynamodb": {
    "Keys": {
      "UserID": {"S": "123"}
    },
    "NewImage": {
      "UserID": {"S": "123"},
      "Name": {"S": "Alice"},
      "Status": {"S": "active"}
    },
    "OldImage": {
      "UserID": {"S": "123"},
      "Name": {"S": "Alice"},
      "Status": {"S": "inactive"}
    },
    "SequenceNumber": "111",
    "SizeBytes": 26,
    "StreamViewType": "NEW_AND_OLD_IMAGES"
  }
}
```

**Retention**: 24 hours

**Ordering**: Per partition key (not global)

**Processing**:
- Lambda (most common)
- Kinesis Client Library
- DynamoDB Streams Kinesis Adapter

### Lambda Integration

**Example** (Replicate to ElasticSearch):
```python
import boto3
from elasticsearch import Elasticsearch

es = Elasticsearch(['https://es-endpoint.us-east-1.es.amazonaws.com'])

def lambda_handler(event, context):
    for record in event['Records']:
        if record['eventName'] == 'INSERT' or record['eventName'] == 'MODIFY':
            # Index new/updated item in ElasticSearch
            item = record['dynamodb']['NewImage']
            es.index(
                index='users',
                id=item['UserID']['S'],
                body={
                    'name': item['Name']['S'],
                    'email': item['Email']['S']
                }
            )
        elif record['eventName'] == 'REMOVE':
            # Delete from ElasticSearch
            item_id = record['dynamodb']['Keys']['UserID']['S']
            es.delete(index='users', id=item_id)
```

**Configuration**:
```
DynamoDB Table → Enable Streams (NEW_AND_OLD_IMAGES)
    ↓
Lambda Function → Triggered by stream
    ↓
Process records (replicate, notify, etc.)
```

**Batch Processing**:
- Lambda receives batches (up to 1,000 records or 6 MB)
- Processes in order per shard
- Failed batch retried (use DLQ for failures)

## Transactions

### ACID Transactions

**What**: All-or-nothing operations across multiple items

**Use Case**: 
- Transfer money between accounts
- Update inventory and order simultaneously
- Maintain data consistency

**Operations**:
- **TransactWriteItems**: Write to up to 100 items (across tables)
- **TransactGetItems**: Read up to 100 items

**Example** (Transfer money):
```python
import boto3
dynamodb = boto3.client('dynamodb')

response = dynamodb.transact_write_items(
    TransactItems=[
        {
            'Update': {
                'TableName': 'Accounts',
                'Key': {'AccountID': {'S': 'ACC-001'}},
                'UpdateExpression': 'SET Balance = Balance - :amount',
                'ExpressionAttributeValues': {':amount': {'N': '100'}},
                'ConditionExpression': 'Balance >= :amount'  # Ensure sufficient funds
            }
        },
        {
            'Update': {
                'TableName': 'Accounts',
                'Key': {'AccountID': {'S': 'ACC-002'}},
                'UpdateExpression': 'SET Balance = Balance + :amount',
                'ExpressionAttributeValues': {':amount': {'N': '100'}}
            }
        }
    ]
)

# If ACC-001 has insufficient funds:
#   - Both operations rolled back
#   - TransactionCanceledException raised
# If successful:
#   - Both accounts updated atomically
```

**Cost**:
- Transactional reads: 2× cost of standard reads
- Transactional writes: 2× cost of standard writes

**Example**:
```
Standard write: 1 WCU per 1 KB
Transactional write: 2 WCU per 1 KB

10 transactional writes (1 KB each):
  WCU consumed: 10 × 2 = 20 WCU
```

**Limitations**:
- Max 100 items per transaction
- Max 4 MB total data
- Items can be across multiple tables
- No duplicate items in single transaction

**Idempotency**:
```python
# Use client request token for idempotency
response = dynamodb.transact_write_items(
    TransactItems=[...],
    ClientRequestToken='unique-request-id-12345'  # Prevents duplicate execution
)
```

## Global Tables

### What are Global Tables?

**Purpose**: Multi-region, multi-active replication

**Characteristics**:
- **Multi-active**: Read and write in any region
- **Replication**: Automatic, asynchronous (sub-second latency)
- **Conflict resolution**: Last Writer Wins (LWW)
- **High availability**: 99.999% SLA

**Use Cases**:
- Global applications
- Disaster recovery
- Low-latency access worldwide
- Compliance (data residency)

**Example**:
```
Regions:
  - us-east-1 (replica)
  - eu-west-1 (replica)
  - ap-southeast-1 (replica)

User in US writes to us-east-1:
  - Write succeeds immediately
  - Replicates to eu-west-1 and ap-southeast-1 (typically <1 second)
  - Users in EU and Asia see updated data

User in EU writes to eu-west-1:
  - Write succeeds immediately
  - Replicates to us-east-1 and ap-southeast-1
```

**Setup**:
```
1. Create table in primary region (e.g., us-east-1)
2. Enable DynamoDB Streams (required)
3. Add replica regions
   - Specify regions: eu-west-1, ap-southeast-1
   - AWS creates replicas automatically
4. All replicas are active (read/write)
```

**Conflict Resolution**:
```
Scenario: Two users update same item simultaneously

User A (us-east-1) at 10:00:00.100: Set Name = "Alice"
User B (eu-west-1) at 10:00:00.200: Set Name = "Bob"

Resolution:
  - Last write wins (10:00:00.200 > 10:00:00.100)
  - All replicas eventually converge to Name = "Bob"
```

**Cost**:
```
Base table: 100 RCU, 100 WCU, 100 GB
Replicas: 2 additional regions

Storage: 100 GB × 3 regions × $0.25 = $75/month
RCU: 100 × 3 × $0.0936 = $28.08/month
WCU: 100 × 3 × $0.4680 = $140.40/month
Replication: 
  - rWCU (replicated write units): Based on cross-region writes
  - Example: 1M writes/day × 2 replicas × $0.000975 per rWCU = ~$2/month
Total: ~$245.48/month (vs $56.16 for single region)
```

**Monitoring**:
- `ReplicationLatency`: Time to replicate (should be <1 second)
- `PendingReplicationCount`: Items waiting to replicate

**Best Practices**:
- Use Version 2019.11.21 (latest)
- Monitor replication latency
- Design for eventual consistency
- Use condition expressions to avoid conflicts

## Backup and Restore

### On-Demand Backups

**What**: Full backup of table at point in time

**Characteristics**:
- Zero impact on performance
- Consistent across table and indexes
- Retained until explicitly deleted
- Can restore to new table (same or different region)

**Creating Backup**:
```
AWS Console → DynamoDB → Tables → Backups → Create backup

Name: Users-Backup-2026-01-31
Table: Users

Backup includes:
  - All items
  - GSIs/LSIs
  - Provisioned capacity settings
  - Encryption settings
```

**Restore**:
```
Restore to new table:
  - Table name: Users-Restored
  - Can change: Encryption, capacity mode, GSIs
  - Cannot change: Primary key, LSIs
```

**Cost**: $0.10 per GB-month

**Use Cases**:
- Long-term retention
- Before major changes
- Compliance
- Disaster recovery

### Point-in-Time Recovery (PITR)

**What**: Continuous backups (35-day retention)

**Characteristics**:
- Restore to any second in last 35 days
- Zero impact on performance
- Minimal cost overhead

**Enabling**:
```
Table settings → Backups → Point-in-time recovery → Enable
```

**Restore**:
```
Restore to time: 2026-01-30 15:30:00 UTC
Restores table state at that exact moment
Creates new table (cannot overwrite existing)
```

**Cost**: $0.20 per GB-month (2× on-demand backup)

**RPO**: Seconds (can restore to any second)

**RTO**: Minutes (depending on table size)

**Use Cases**:
- Accidental deletes
- Data corruption
- Rollback changes
- Compliance (35-day retention)

### Backup Strategy

**Example**:
```
Production table:
  - PITR: Enabled (35-day rolling retention)
  - On-demand backups:
    - Daily: Retain 7 days
    - Weekly: Retain 4 weeks
    - Monthly: Retain 12 months
    - Yearly: Retain 7 years (compliance)

Automation:
  - AWS Backup service
  - Lambda + EventBridge for custom schedules
```

**Cost** (100 GB table):
```
PITR: 100 × $0.20 = $20/month
On-demand:
  Daily (7 × 100 GB): $70/month
  Weekly (4 × 100 GB): $40/month
  Monthly (12 × 100 GB): $120/month
  Yearly (7 × 100 GB): $70/month
Total: $320/month
```

## Performance Optimization

### Partition Key Design

**Goal**: Evenly distribute data and traffic

**Anti-Patterns**:
```
Bad: Status (only 2 values: active, inactive)
  - Hot partition (one partition gets most traffic)
  - Throttling

Bad: Date (all writes go to current date partition)
  - Hot partition for current date
  - Uneven distribution
```

**Best Practices**:
```
Good: UserID (UUID)
  - High cardinality
  - Even distribution

Good: DeviceID + Timestamp
  - Composite key
  - Even distribution over time

Good: Hash of attribute (e.g., hash of OrderID)
  - Randomizes distribution
```

**Hot Partition Example**:
```
Table: Sessions
Partition key: Date
Sort key: SessionID

Problem:
  All current writes go to today's partition
  Yesterday's partition idle
  
Solution:
  Partition key: SessionID (random UUID)
  Sort key: Timestamp
  
  Or: Date#Shard (append random 0-9 to distribute)
    Partition key: "2026-01-31#3"
    Query requires scatter-gather across all shards
```

### Burst Capacity

**What**: DynamoDB reserves unused capacity for bursts

**Mechanism**:
```
Provisioned: 100 WCU
Unused capacity: Accumulates (up to 300 seconds worth)

Burst:
  Spike to 300 WCU for up to 300 seconds
  Uses burst capacity
  
If sustained > 100 WCU:
  Burst capacity depletes
  Throttling occurs
```

**Adaptive Capacity**:
- Automatically boosts capacity for hot partitions
- Transparent to application
- Best effort (not guaranteed)

### Caching with DAX

**What**: DynamoDB Accelerator (in-memory cache)

**Performance**:
- Latency: Microseconds (vs milliseconds)
- Read-heavy workloads
- Compatible with DynamoDB API

**Architecture**:
```
Application
    ↓
DAX Cluster (cache)
    ↓ (cache miss)
DynamoDB Table
```

**Use Cases**:
- Read-heavy workloads (10:1 read:write ratio)
- Sub-millisecond latency required
- Reduce read load on DynamoDB

**Cost**:
```
DAX node: dax.r5.large
  - $0.28/hour = $204/month per node
  - 3-node cluster (HA): $612/month

Compare to DynamoDB read cost:
  1 billion reads/month (4 KB):
    DynamoDB: 1B × $0.25/1M = $250/month
    With DAX (95% hit rate):
      DynamoDB: 50M × $0.25/1M = $12.50/month
      DAX: $612/month
      Total: $624.50/month
  
  DAX more expensive for this scenario
  
  10 billion reads/month:
    DynamoDB alone: $2,500/month
    With DAX (95% hit): $125 + $612 = $737/month
    Savings: $1,763/month
```

**When to Use DAX**:
- Very high read volume
- Read latency critical
- Repeated reads of same items

**When NOT to Use**:
- Write-heavy workloads
- Infrequent reads
- Cost-sensitive, low volume

## Security

### Encryption

**Encryption at Rest**:
- Always enabled (cannot disable)
- KMS keys (AWS managed or customer managed)

**Encryption in Transit**:
- TLS/SSL for API calls

**Configuration**:
```
Table encryption:
  - AWS managed key (free): Default
  - Customer managed key: Specify KMS key
  - Additional cost: KMS key charges
```

### IAM Policies

**Example** (Read-only access):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/Users"
    }
  ]
}
```

**Fine-Grained Access** (Item-level):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:Query"],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/Users",
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": ["${aws:userid}"]
        }
      }
    }
  ]
}
```
Users can only access items where partition key = their user ID

### VPC Endpoints

**What**: Private connection from VPC to DynamoDB

**Benefits**:
- No internet gateway needed
- Traffic stays in AWS network
- Free (no data transfer charges)

**Configuration**:
```
VPC → Endpoints → Create endpoint
  - Service: com.amazonaws.us-east-1.dynamodb
  - VPC: vpc-12345
  - Route tables: rtb-12345, rtb-67890
```

## Cost Optimization

### 1. Choose Right Capacity Mode

```
Predictable traffic → Provisioned (with auto scaling)
Unpredictable traffic → On-Demand

Break-even: ~18M writes or ~70M reads per month
```

### 2. Reserved Capacity

```
Provisioned mode, steady traffic:
  Reserved capacity (1-year): 40% savings
  Reserved capacity (3-year): 75% savings
```

### 3. Optimize Projections

```
GSI with ALL projection: 100 GB storage
GSI with KEYS_ONLY + INCLUDE: 30 GB storage

Savings: 70 GB × $0.25 = $17.50/month
```

### 4. Use Eventually Consistent Reads

```
Strongly consistent: 1 RCU = 1 read/sec (4 KB)
Eventually consistent: 1 RCU = 2 reads/sec (4 KB)

Same traffic, half the RCU cost
```

### 5. Efficient Queries

```
Avoid scans: Use queries with indexes
Limit result set: Use Limit parameter
Project only needed attributes: Use ProjectionExpression
```

### 6. Compress Large Attributes

```
Before: 10 KB JSON → 10 WCU per write
After: Compress to 2 KB → 2 WCU per write

Savings: 80% WCU reduction
```

### 7. Archive Old Data

```
DynamoDB: $0.25/GB-month
S3 Standard: $0.023/GB-month
S3 Glacier: $0.004/GB-month

Archive old items to S3, delete from DynamoDB
```

## Real-World Scenarios

### Scenario 1: Gaming Leaderboard

**Requirements**:
- Track player scores
- Real-time updates
- Query top 100 players globally
- Query player rank

**Solution**:
```
Table: Leaderboard
Partition Key: GameID
Sort Key: Score#PlayerID (composite for uniqueness)

Item:
{
  "GameID": "GAME-001",
  "Score#PlayerID": "0000999850#player-123",  // Padded score for sorting
  "PlayerID": "player-123",
  "PlayerName": "Alice",
  "Score": 999850,
  "Timestamp": "2026-01-31T10:30:00Z"
}

Query top 100:
  KeyConditionExpression: GameID = "GAME-001"
  ScanIndexForward: False (descending)
  Limit: 100

Update score:
  TransactWriteItems:
    1. Delete old score item
    2. Insert new score item (with updated Score#PlayerID)

GSI: PlayerIndex
  Partition Key: PlayerID
  Sort Key: GameID
  
  Query player's score:
    KeyConditionExpression: PlayerID = "player-123" AND GameID = "GAME-001"
```

**Cost** (1M active players, 10M writes/day):
```
Table size: 1M items × 0.5 KB = 500 MB
Storage: 0.5 GB × $0.25 = $0.13/month

Writes: 10M/day = ~115 writes/sec
WCU: 115 × 1 (0.5 KB rounds to 1 KB) = 115 WCU
Cost: 115 × $0.4680 = $53.82/month

Reads: 100M/day = ~1,157 reads/sec
RCU: 1,157 × 0.5 (eventually consistent, 0.5 KB) = 579 RCU
Cost: 579 × $0.0936 = $54.19/month

Total: ~$108/month
```

### Scenario 2: E-Commerce Shopping Cart

**Requirements**:
- Add/remove items from cart
- Session-based (ephemeral)
- Fast reads/writes
- Auto-expire old carts

**Solution**:
```
Table: ShoppingCarts
Partition Key: UserID
Sort Key: SessionID

Item:
{
  "UserID": "user-123",
  "SessionID": "session-456",
  "Items": [
    {"ProductID": "PROD-001", "Quantity": 2, "Price": 29.99},
    {"ProductID": "PROD-002", "Quantity": 1, "Price": 49.99}
  ],
  "TotalAmount": 109.97,
  "CreatedAt": 1738320600,
  "TTL": 1738407000  // Expires in 24 hours
}

Add item to cart:
  UpdateExpression: "SET Items = list_append(Items, :item)"

Remove item:
  UpdateExpression: "REMOVE Items[2]"

TTL (Time To Live):
  Enable TTL on "TTL" attribute
  DynamoDB automatically deletes expired items (free)
  
  Set TTL: Current timestamp + 24 hours
  Items auto-deleted after 24 hours of inactivity
```

**Cost** (100K active carts):
```
Storage: 100K × 1 KB = 100 MB = 0.1 GB
Cost: 0.1 × $0.25 = $0.025/month

On-Demand pricing:
  Writes: 1M/day (add/remove/update)
  Reads: 5M/day (view cart)
  
  Writes: 1M × 1 KB / 1M × $1.25 = $1.25/month
  Reads: 5M × 1 KB / 4 KB / 1M × $0.25 = $0.31/month
  
Total: ~$1.60/month (very cost-effective)
```

### Scenario 3: IoT Device Data

**Requirements**:
- Millions of devices
- Continuous time-series data
- Query device history
- Aggregate metrics

**Solution**:
```
Table: DeviceData
Partition Key: DeviceID
Sort Key: Timestamp

Item:
{
  "DeviceID": "device-12345",
  "Timestamp": "2026-01-31T10:30:00Z",
  "Temperature": 72.5,
  "Humidity": 45.2,
  "BatteryLevel": 87,
  "Status": "active"
}

Query device last 24 hours:
  KeyConditionExpression: 
    DeviceID = "device-12345" AND Timestamp >= "2026-01-30T10:30:00Z"

DynamoDB Streams → Lambda:
  - Aggregate metrics (hourly averages)
  - Trigger alerts (temperature > threshold)
  - Store in S3 for analytics

TTL for data retention:
  Keep last 30 days in DynamoDB
  Archive older data to S3 (via Stream → Lambda)
  TTL = timestamp + 30 days
```

**Cost** (1M devices, 1 reading/min):
```
Writes: 1M devices × 60 readings/hour = 60M/hour = 16,667 writes/sec
WCU: 16,667 × 1 (0.5 KB) = 16,667 WCU

Provisioned cost: 16,667 × $0.4680 = $7,800/month

On-Demand cost: 
  1M × 60 × 24 × 30 = 43.2B writes/month
  43,200M × $1.25 / 1M = $54,000/month
  
Provisioned with reserved capacity (3-year):
  $7,800 × 0.25 = $1,950/month (75% savings)

Storage (30 days retention):
  1M devices × 60 × 24 × 30 × 0.5 KB = 21.6 TB
  21,600 GB × $0.25 = $5,400/month

Total: ~$7,350/month (with reserved capacity + TTL cleanup)
```

### Scenario 4: Session Management

**Requirements**:
- Web application session storage
- Fast read/write
- Auto-expire sessions
- Scalable

**Solution**:
```
Table: Sessions
Partition Key: SessionID
No Sort Key

Item:
{
  "SessionID": "sess-abc123",
  "UserID": "user-456",
  "LoginTime": "2026-01-31T10:00:00Z",
  "LastActivity": "2026-01-31T10:30:00Z",
  "UserData": {
    "Name": "Alice",
    "Preferences": {...}
  },
  "TTL": 1738323000  // Expires in 30 minutes from last activity
}

Get session:
  GetItem: SessionID = "sess-abc123"
  
Update last activity:
  UpdateExpression: "SET LastActivity = :now, TTL = :ttl"
  TTL = current + 30 minutes (sliding expiration)

TTL cleanup:
  Auto-delete expired sessions (no cost)

GSI: UserIndex (optional)
  Partition Key: UserID
  Query all sessions for user (multi-device support)
```

**Cost** (100K concurrent sessions):
```
On-Demand mode:
  Reads: 10M/day (session checks)
  Writes: 5M/day (login, updates, logout)
  
  Reads: 10M × 0.5 KB / 4 KB / 1M × $0.25 = $0.31/month
  Writes: 5M × 0.5 KB / 1M × $1.25 = $6.25/month
  
  Storage: 100K × 0.5 KB = 50 MB = negligible
  
Total: ~$6.56/month
```

### Scenario 5: Global Application

**Requirements**:
- Users worldwide
- Low latency everywhere
- Multi-region writes
- High availability

**Solution**:
```
Global Table:
  - us-east-1 (North America)
  - eu-west-1 (Europe)
  - ap-southeast-1 (Asia)

Table: Users
Partition Key: UserID

User in US writes:
  - Writes to us-east-1 (low latency)
  - Replicates to eu-west-1, ap-southeast-1 (<1 second)

User in Europe reads:
  - Reads from eu-west-1 (low latency)
  - Eventual consistency (typically milliseconds behind)

Route 53:
  Latency-based routing to closest region

Monitoring:
  - ReplicationLatency (should be <1 second)
  - PendingReplicationCount (should be ~0)
```

**Cost** (100K users, 3 regions):
```
Storage: 100K × 1 KB = 100 MB per region
  3 regions × 100 MB × $0.25/GB = $0.075/month

Provisioned (per region):
  100 RCU × 3 = 300 RCU total
  100 WCU × 3 = 300 WCU total
  
  RCU: 300 × $0.0936 = $28.08/month
  WCU: 300 × $0.4680 = $140.40/month

Replication (rWCU):
  1M writes/day across 3 regions
  Each write replicates to 2 other regions
  2M rWCU/day × 30 = 60M rWCU/month
  60M × $0.000975 / 1M = $58.50/month

Total: ~$227/month (vs ~$56/month for single region)
4x cost for global deployment
```

## Exam Tips (SAP-C02)

### Key Decision Points

**Capacity Mode**:
```
Predictable, steady traffic → Provisioned + auto scaling
Unpredictable, spiky traffic → On-Demand
Cost-sensitive, steady → Provisioned + reserved capacity
```

**Index Selection**:
```
Query by different partition key → GSI
Same partition, different sort → LSI (at table creation)
Need strong consistency → LSI
Need flexibility (add later) → GSI
```

**Consistency**:
```
Strongly consistent reads → 2× cost, immediate consistency
Eventually consistent reads → 1× cost, slight lag (milliseconds)
```

**Global Tables**:
```
Multi-region, low latency → Global Tables
Need disaster recovery → Global Tables (99.999% SLA)
Single region sufficient → Standard table
```

**Streams**:
```
Trigger on data changes → DynamoDB Streams + Lambda
Replicate to other services → Streams
Audit logs → Streams (24-hour retention)
```

### Common Scenarios

**"Need to query by non-key attribute"**:
- Create GSI on that attribute
- Query using GSI

**"Hot partition causing throttling"**:
- Redesign partition key (higher cardinality)
- Add random suffix to distribute load
- Use burst capacity/adaptive capacity (temporary)

**"Large scan consuming too much capacity"**:
- Use query with GSI instead
- Parallel scan if scan necessary
- Export to S3 for analytics

**"Need transactions across multiple tables"**:
- Use TransactWriteItems (up to 100 items)
- 2× cost for transactional operations

**"Global users, high latency"**:
- Enable Global Tables
- Deploy replicas in multiple regions
- Route users to nearest region

**"Auto-expire old data"**:
- Enable TTL on timestamp attribute
- DynamoDB auto-deletes (free)

**"Need point-in-time recovery"**:
- Enable PITR (35-day retention)
- On-demand backups for longer retention

This comprehensive DynamoDB guide covers all aspects for SAP-C02 exam success.
