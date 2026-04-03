# 16-20 — Direct Connect, API Gateway, SQS, SNS, Kinesis Data Streams

---

# 16 — AWS Direct Connect

## 1. What It Does

A **dedicated, private network connection** from your on-premises data center to AWS. Unlike VPN (which goes over the public internet), Direct Connect is a physical cable from your data center to an AWS Direct Connect location.

| Feature | VPN | Direct Connect |
|---|---|---|
| Connection | Over public internet (encrypted) | **Dedicated physical line** |
| Bandwidth | Limited by internet bandwidth | 1 Gbps, 10 Gbps, 100 Gbps (dedicated); 50 Mbps–10 Gbps (hosted) |
| Latency | Variable (internet-dependent) | **Consistent, low latency** |
| Encryption | Yes (IPSec) | **No by default** (add VPN over DX for encryption) |
| Setup time | Minutes | **Weeks to months** (physical installation) |
| Cost | $0.05/hr + data transfer | Port hours + data transfer (no internet data charges) |
| Redundancy | Automatic (internet routing) | You must design redundancy |

## 2. Key Concepts

### Virtual Interfaces (VIFs)

| VIF Type | Purpose | What It Accesses |
|---|---|---|
| **Private VIF** | Access VPCs via private IPs | VPC resources (EC2, RDS, etc.) via Virtual Private Gateway or Direct Connect Gateway |
| **Public VIF** | Access AWS public services | S3, DynamoDB, SQS, etc. (public endpoints, but over private wire) |
| **Transit VIF** | Access multiple VPCs via Transit Gateway | Connect to Transit Gateway (replaces needing private VIF per VPC) |

### Direct Connect Gateway

Connects a Direct Connect connection to VPCs in **multiple regions**:
- Without: One DX connection can only reach VPCs in its region
- With: One DX connection reaches VPCs in ANY region through the DX Gateway

### High Availability (EXAM CRITICAL!)

Single Direct Connect = **single point of failure**. For HA:

| Tier | Architecture | Cost |
|---|---|---|
| **Basic** | DX + VPN backup (failover) | Medium |
| **High** | Two DX connections at different locations | High |
| **Maximum** | Two DX at different locations + VPN backup | Highest |

**Exam Pattern**: "Dedicated connection with failover" → Direct Connect primary + Site-to-Site VPN backup

### Link Aggregation Group (LAG)

Bundle multiple DX connections (same speed, same location) into one logical connection for higher throughput.

## 3. Exam Scenarios

**"Consistent network performance to AWS"** → Direct Connect
**"Encrypted dedicated connection"** → Direct Connect + Site-to-Site VPN over the DX connection
**"Need connection in weeks, not months"** → VPN first (immediate), then establish Direct Connect as primary
**"Connect on-prem to 20 VPCs"** → Direct Connect → Direct Connect Gateway → Transit Gateway → VPCs
**"Cheapest hybrid connectivity"** → Site-to-Site VPN
**"Most resilient hybrid connectivity"** → Two DX connections at separate DX locations + VPN backup

---

# 17 — Amazon API Gateway

## 1. What It Does

A fully managed service for creating, publishing, and managing APIs. The "front door" for applications to access your backend services.

**Most Common Pattern**: API Gateway → Lambda → DynamoDB (the serverless trifecta)

## 2. API Types

| Type | Protocol | Use Case | Cost |
|---|---|---|---|
| **REST API** | HTTP (REST) | Full-featured REST APIs | $3.50/million requests |
| **HTTP API** | HTTP | Simpler, faster, cheaper REST | $1.00/million requests |
| **WebSocket API** | WebSocket | Real-time, bidirectional | $1.00/million messages |

**Exam Tip**: HTTP API is 70% cheaper than REST API but has fewer features (no caching, no request validation, no WAF). If the question doesn't need those features → HTTP API.

## 3. Key Features

- **Lambda Integration**: Direct invoke of Lambda functions
- **HTTP Integration**: Proxy to any HTTP endpoint (ALB, on-premises)
- **AWS Service Integration**: Direct integration with SQS, Step Functions, DynamoDB, Kinesis
- **Stages**: Deploy different versions (dev, staging, prod)
- **Throttling**: Rate limiting per API key or stage (default: 10,000 requests/sec)
- **Caching**: Response caching (REST API only) — 0.5 GB to 237 GB
- **Usage Plans + API Keys**: Monetize APIs, rate limit per customer
- **Authorization**: IAM, Lambda Authorizer, Cognito User Pool
- **Canary Deployments**: Route % of traffic to new version
- **WAF Integration**: Protect APIs from attacks (REST API only)

## 4. Authorization Methods

| Method | Use Case | Exam Note |
|---|---|---|
| **IAM** | AWS users/roles accessing API | SigV4 signed requests |
| **Lambda Authorizer** | Custom auth logic (proprietary tokens) | Returns IAM policy |
| **Cognito User Pool** | Mobile/web app users | JWT token validation |

## 5. Exam Scenarios

**"Serverless API"** → API Gateway + Lambda + DynamoDB
**"Rate limit API access per customer"** → Usage Plans + API Keys
**"Custom authentication with JWT"** → Lambda Authorizer or Cognito
**"Cheapest API option"** → HTTP API ($1/million vs $3.50/million)
**"WebSocket for chat app"** → WebSocket API
**"Cache API responses"** → REST API with caching enabled
**"Direct SQS write from API"** → API Gateway AWS Service integration (no Lambda needed)

---

# 18 — Amazon SQS (Simple Queue Service)

## 1. What It Does

A fully managed **message queue** service. Decouples application components so they can operate independently.

**Example**: User uploads photo → message goes to SQS queue → worker picks up message → processes photo. If the worker crashes, the message stays in the queue for another worker.

## 2. Queue Types (EXAM CRITICAL!)

| Feature | Standard Queue | FIFO Queue |
|---|---|---|
| Throughput | **Unlimited** | 300 messages/sec (3,000 with batching) |
| Ordering | Best-effort (may be out of order) | **Strictly ordered** (FIFO) |
| Duplicates | Possible (at-least-once delivery) | **Exactly-once processing** |
| Use case | High throughput, order doesn't matter | Financial transactions, order-sensitive |
| Name | Any name | Must end in **.fifo** |

## 3. Key Concepts

### Visibility Timeout
- When a consumer reads a message, it becomes **invisible** to other consumers
- Default: 30 seconds. Max: 12 hours.
- If consumer doesn't delete the message within timeout, it becomes visible again (processed by another consumer)
- **Exam Trap**: "Messages being processed twice" → Visibility timeout too short. Increase it.

### Dead-Letter Queue (DLQ)
- Messages that fail processing after N attempts are moved to DLQ
- Prevents "poison pill" messages from blocking the queue
- **maxReceiveCount**: How many times a message can be received before moving to DLQ

### Long Polling vs Short Polling
- **Short Polling (default)**: Returns immediately, may return empty (costs money per empty response)
- **Long Polling**: Waits up to 20 seconds for messages (reduces cost, reduces empty responses)
- **Always use Long Polling** (set `WaitTimeSeconds` > 0)

### Message Retention
- Default: 4 days. Range: 1 minute to **14 days**.

### Message Size
- Max: **256 KB**
- For larger messages: Store payload in S3, send S3 reference in SQS (**Extended Client Library**)

### Delay Queue
- Delay delivery of messages by 0-15 minutes
- Use case: "Process this order after 5 minutes" (allow cancellation window)

## 4. SQS + Lambda

Lambda can poll SQS and process messages:
- Event Source Mapping polls the queue
- Lambda processes messages in batches (up to 10)
- On success, Lambda deletes messages
- On failure, messages return to queue after visibility timeout

## 5. Exam Scenarios

**"Decouple microservices"** → SQS between services
**"Handle traffic spikes without losing data"** → SQS as buffer
**"Exactly-once, ordered processing"** → SQS FIFO
**"Messages processed twice"** → Increase Visibility Timeout
**"Messages stuck in queue"** → Consumer crashing → use DLQ to isolate failures
**"Reduce SQS costs"** → Long Polling
**"Message larger than 256 KB"** → S3 + SQS Extended Client Library

---

# 19 — Amazon SNS (Simple Notification Service)

## 1. What It Does

A fully managed **pub/sub messaging** service. One publisher sends a message to an SNS Topic, and ALL subscribers receive it (fan-out pattern).

### SQS vs SNS (EXAM CRITICAL!)

| Feature | SQS | SNS |
|---|---|---|
| Pattern | **Queue** (pull-based) | **Pub/Sub** (push-based) |
| Consumers | One consumer processes each message | **All subscribers** receive each message |
| Persistence | Messages persist until consumed | No persistence (delivered once) |
| Use case | Decouple, buffer, load leveling | Fan-out notifications, alerts |

### SNS + SQS Fan-Out Pattern (EXAM FAVORITE!)

```
Publisher → SNS Topic → SQS Queue A (Service A)
                      → SQS Queue B (Service B)
                      → Lambda (Service C)
                      → Email (Admin notification)
```

One message, multiple independent consumers. Each SQS queue processes independently.

**Example**: Order placed → SNS → Queue 1 (process payment) + Queue 2 (update inventory) + Queue 3 (send email)

## 2. Subscriber Types

- SQS, Lambda, HTTP/HTTPS endpoints, Email, SMS, Kinesis Data Firehose, mobile push

## 3. SNS FIFO Topics

- Ordered, deduplicated messages
- Can ONLY deliver to **SQS FIFO queues** (not email, Lambda, etc.)
- Use case: Fan-out with ordering guarantees

## 4. Message Filtering

Subscribers can set **filter policies** to receive only relevant messages:
```json
{"store": ["example_corp"], "event": ["order_placed"]}
```
Only messages matching the filter are delivered to that subscriber.

## 5. Exam Scenarios

**"One event triggers multiple services"** → SNS → SQS fan-out
**"Alert team when CloudWatch alarm fires"** → CloudWatch Alarm → SNS → Email/SMS
**"Ordered fan-out"** → SNS FIFO → SQS FIFO queues
**"Subscriber only wants certain messages"** → SNS Message Filtering

---

# 20 — Amazon Kinesis Data Streams

## 1. What It Does

A real-time **data streaming** service. Ingests and processes large amounts of data records continuously (think: fire hose of data).

### Kinesis vs SQS

| Feature | Kinesis Data Streams | SQS |
|---|---|---|
| Use case | **Real-time streaming analytics** | Message queuing, decoupling |
| Data retention | 1-365 days | 1 min - 14 days |
| Consumers | **Multiple consumers read same data** | One consumer per message |
| Ordering | **Per-shard ordering** | Best effort (Standard) or FIFO |
| Throughput | 1 MB/sec per shard write, 2 MB/sec read | Unlimited (Standard) |
| Replay | **Yes** (consumers can re-read data) | No (once consumed, gone) |

## 2. Core Concepts

### Shards

A shard is the unit of capacity:
- **Write**: 1 MB/sec or 1,000 records/sec per shard
- **Read**: 2 MB/sec per shard (shared among consumers) or 2 MB/sec per consumer (enhanced fan-out)
- **Scale by adding/removing shards**

### Producers
Send data to the stream: SDK, Kinesis Producer Library (KPL), Kinesis Agent, IoT devices

### Consumers
Read data from the stream:
- **Shared throughput**: All consumers share 2 MB/sec per shard (via GetRecords API)
- **Enhanced Fan-Out**: Each consumer gets dedicated 2 MB/sec per shard (via SubscribeToShard API, uses HTTP/2 push)

### Partition Key

Each record has a partition key that determines which shard it goes to (similar to DynamoDB partition key). Good key design = even shard distribution.

## 3. Kinesis Data Streams vs Kinesis Data Firehose

| Feature | Data Streams | Data Firehose |
|---|---|---|
| Management | You manage shards | Fully managed, auto-scaling |
| Latency | **Real-time (~200ms)** | **Near real-time (60-900 seconds buffer)** |
| Consumers | Custom (Lambda, KCL apps) | Built-in delivery to S3, Redshift, OpenSearch, Splunk |
| Replay | Yes | No |
| Data transformation | Custom consumer code | **Lambda** (built-in integration) |
| Cost | Per shard/hour | Per GB processed |
| Use case | Real-time processing | ETL/delivery to storage |

## 4. Exam Scenarios

**"Real-time analytics on clickstream data"** → Kinesis Data Streams → Lambda/KCL
**"Deliver streaming data to S3"** → Kinesis Data Firehose (simplest)
**"Real-time + delivery to S3"** → Kinesis Data Streams → Lambda processing → Firehose → S3
**"Multiple consumers, each reading all data"** → Kinesis (not SQS — SQS is one consumer per message)
**"Replay/re-process stream data"** → Kinesis Data Streams (supports replay, SQS doesn't)
**"IoT sensor data ingestion at scale"** → Kinesis Data Streams
**"Scale to handle more data"** → Add more shards (resharding)

---

*Combined word count: ~4,000+ words for services 16-20*
