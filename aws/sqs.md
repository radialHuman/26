# Amazon SQS: Complete Guide

## Table of Contents
1. [Message Queue Fundamentals](#message-queue-fundamentals)
2. [SQS History & Evolution](#sqs-history--evolution)
3. [Standard vs FIFO Queues](#standard-vs-fifo-queues)
4. [Queue Configuration](#queue-configuration)
5. [Visibility Timeout](#visibility-timeout)
6. [Dead Letter Queues](#dead-letter-queues)
7. [Long Polling vs Short Polling](#long-polling-vs-short-polling)
8. [Message Deduplication](#message-deduplication)
9. [LocalStack Examples](#localstack-examples)
10. [Interview Questions](#interview-questions)

---

## Message Queue Fundamentals

### What is a Message Queue?

**Asynchronous communication pattern**:
```
Producer → Queue → Consumer

Benefits:
✅ Decoupling (producer/consumer independent)
✅ Load leveling (absorb traffic spikes)
✅ Reliability (messages persist until processed)
✅ Scalability (multiple consumers)
```

### Synchronous vs Asynchronous

**Synchronous** (Direct API call):
```
Web Server → Database
- Wait for response
- Blocking operation
- Tight coupling

Problem: Database slow → Web server blocked → User waits
```

**Asynchronous** (Message Queue):
```
Web Server → Queue → Background Worker → Database
- Immediate return
- Non-blocking
- Loose coupling

Benefit: Database slow → Worker handles retry, user gets instant response
```

### Use Cases

```
1. Order Processing:
   Web → SQS → Worker (payment, inventory, shipping)

2. Image Processing:
   Upload → SQS → Lambda (resize, thumbnail, watermark)

3. Email Sending:
   Signup → SQS → Email Service (deferred, retryable)

4. Log Processing:
   Application → SQS → Analytics Pipeline

5. Event-Driven Architecture:
   Service A → SQS → Service B (microservices)
```

---

## SQS History & Evolution

### Before SQS (Pre-2004)

**Self-Managed Message Queues**:
```
Options:
- RabbitMQ
- ActiveMQ
- IBM MQ

Tasks:
❌ Provision servers
❌ Configure clustering
❌ Manage persistence
❌ Handle failover
❌ Monitor queue depth
❌ Scale manually

Time: 1-2 weeks to set up HA queue cluster
```

### SQS Launch (November 2004)

**First AWS Service**: Simple Queue Service.

**Revolutionary Features**:
```
✅ Fully managed (no servers)
✅ Infinite scaling
✅ Pay-per-use ($0.40 per million requests)
✅ No provisioning
✅ Built-in redundancy
✅ At-least-once delivery

Initial Limits:
- Message size: 8 KB
- Retention: 4 days
- No ordering guarantees
```

### Evolution Timeline

```
2004: SQS Launch
2008: Message size increased to 64 KB
2013: Message size increased to 256 KB
2014: SSE (Server-Side Encryption)
2016: FIFO Queues (ordering guarantees)
2018: Cost reduction (60% cheaper)
2020: High throughput FIFO (3,000 TPS → 30,000 TPS)
2022: Dead Letter Queue redrive
2023: Message archiving
```

### Why SQS Was Created

**Problem 1: Scaling Challenges**
```
Before: RabbitMQ cluster (3 nodes)
Capacity: 10,000 msg/sec

Black Friday: 100,000 msg/sec
→ Need to add nodes (days of setup)
→ Cluster rebalancing (downtime)

After: SQS
→ Automatic scaling
→ No capacity planning
→ Pay only for usage
```

**Problem 2: Availability**
```
Before: Manual failover
- Primary node fails
- Promote replica (manual, 10-30 min)
- Messages potentially lost

After: SQS
- Distributed across AZs
- Automatic replication
- No single point of failure
- 99.9% availability SLA
```

**Problem 3: Operational Burden**
```
Before:
- Monitor queue depth
- Scale cluster
- Apply patches
- Backup messages
- Handle disk space

After:
- Zero operational overhead
- AWS handles everything
```

---

## Standard vs FIFO Queues

### Standard Queues

**At-least-once delivery, best-effort ordering**:
```
Characteristics:
✅ Unlimited throughput
✅ At-least-once delivery (duplicates possible)
✅ Best-effort ordering (not guaranteed)
✅ Lower cost

Throughput: Unlimited (millions of msg/sec)
```

**Ordering Example**:
```
Send: A → B → C → D
Receive: A → C → B → D (possible)
         A → B → C → D (also possible)

Use case: Order doesn't matter (independent tasks)
```

**Duplicate Example**:
```
Send: Message 1
Receive: Message 1 (consumer processes)
         Message 1 (duplicate delivered again)

Solution: Idempotent processing
```

### FIFO Queues

**Exactly-once delivery, strict ordering**:
```
Characteristics:
✅ Strict ordering (FIFO)
✅ Exactly-once processing
✅ Deduplication
❌ Limited throughput

Throughput:
- Default: 300 TPS (transactions per second)
- Batching: 3,000 TPS
- High throughput: 30,000 TPS (with partition keys)
```

**Ordering Example**:
```
Send: A → B → C → D
Receive: A → B → C → D (always)

Use case: Order matters (bank transactions)
```

**Queue Name**:
```
FIFO queue must end with .fifo

Standard: my-queue
FIFO: my-queue.fifo
```

### Comparison

| Feature | Standard | FIFO |
|---------|----------|------|
| Throughput | Unlimited | 30,000 TPS |
| Ordering | Best-effort | Guaranteed |
| Duplicates | Possible | No |
| Use Case | High throughput | Order critical |
| Cost | $0.40/M requests | $0.50/M requests |

---

## Queue Configuration

### Creating Queue

**AWS CLI (Standard)**:
```bash
aws sqs create-queue \
  --queue-name my-queue \
  --attributes '{
    "MessageRetentionPeriod": "345600",
    "VisibilityTimeout": "30",
    "ReceiveMessageWaitTimeSeconds": "20"
  }'
```

**AWS CLI (FIFO)**:
```bash
aws sqs create-queue \
  --queue-name my-queue.fifo \
  --attributes '{
    "FifoQueue": "true",
    "ContentBasedDeduplication": "true",
    "MessageRetentionPeriod": "1209600"
  }'
```

### Queue Attributes

**Message Retention Period**:
```
Range: 60 seconds - 14 days
Default: 4 days

Example: Order processing
- Retention: 7 days
- If worker offline for 7 days, messages deleted
```

**Maximum Message Size**:
```
Limit: 256 KB

For larger messages:
- Store in S3
- Send S3 reference in SQS message
```

**Visibility Timeout**:
```
Range: 0 seconds - 12 hours
Default: 30 seconds

Time message is invisible after being received
(Prevents duplicate processing)
```

**Delay Queue**:
```
Range: 0 - 900 seconds (15 minutes)
Default: 0 seconds

Delay all messages before delivery

Use case: Rate limiting, scheduled tasks
```

**Receive Message Wait Time**:
```
Range: 0 - 20 seconds
Default: 0 (short polling)

Long polling: Wait for messages (reduce empty responses)
```

---

## Visibility Timeout

### How It Works

```
1. Consumer receives message
   → Message becomes invisible (VisibilityTimeout = 30s)

2. Consumer processes message (20s)
   → Consumer deletes message
   → Message removed from queue

3. If consumer crashes:
   → After 30s, message becomes visible again
   → Another consumer can process it
```

### Example Flow

```
Time 0s: Consumer A receives Message 1
         Visibility Timeout = 30s
         Message 1 invisible to others

Time 20s: Consumer A deletes Message 1
          Message 1 removed from queue

Alternative (failure):
Time 0s: Consumer A receives Message 1
Time 15s: Consumer A crashes
Time 30s: Message 1 becomes visible
Time 31s: Consumer B receives Message 1 (retry)
```

### Changing Visibility Timeout

**During Processing**:
```python
import boto3

sqs = boto3.client('sqs')

# Receive message
response = sqs.receive_message(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
    MaxNumberOfMessages=1
)

message = response['Messages'][0]
receipt_handle = message['ReceiptHandle']

# Extend visibility timeout (processing takes longer)
sqs.change_message_visibility(
    QueueUrl='...',
    ReceiptHandle=receipt_handle,
    VisibilityTimeout=60  # Extend to 60 seconds
)
```

### Best Practices

```
Visibility Timeout = 6 × Average Processing Time

Example:
- Average processing: 10 seconds
- Visibility Timeout: 60 seconds

Reason: Allow retries without too much delay
```

---

## Dead Letter Queues

### What is a DLQ?

**Queue for failed messages**:
```
Main Queue → (after N failures) → Dead Letter Queue

Use case: Messages that consistently fail processing
```

### Configuration

```bash
# Create DLQ
aws sqs create-queue --queue-name my-dlq

# Set redrive policy on main queue
aws sqs set-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/my-queue \
  --attributes '{
    "RedrivePolicy": "{
      \"deadLetterTargetArn\": \"arn:aws:sqs:us-east-1:123456789012:my-dlq\",
      \"maxReceiveCount\": \"3\"
    }"
  }'
```

### How It Works

```
Attempt 1: Consumer processes → Fails → Message back to queue
Attempt 2: Consumer processes → Fails → Message back to queue
Attempt 3: Consumer processes → Fails → Message back to queue
Attempt 4: maxReceiveCount exceeded → Message moved to DLQ
```

### DLQ Analysis

**Python Example**:
```python
import boto3
import json

sqs = boto3.client('sqs')
dlq_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-dlq'

# Poll DLQ
while True:
    response = sqs.receive_message(
        QueueUrl=dlq_url,
        MaxNumberOfMessages=10,
        WaitTimeSeconds=20
    )
    
    if 'Messages' not in response:
        break
    
    for message in response['Messages']:
        body = json.loads(message['Body'])
        print(f"Failed message: {body}")
        
        # Analyze error
        # Fix issue
        # Redrive to main queue (manual or automated)
        
        # Delete from DLQ
        sqs.delete_message(
            QueueUrl=dlq_url,
            ReceiptHandle=message['ReceiptHandle']
        )
```

### DLQ Redrive

**Move messages back to main queue**:
```bash
aws sqs start-message-move-task \
  --source-arn arn:aws:sqs:us-east-1:123456789012:my-dlq \
  --destination-arn arn:aws:sqs:us-east-1:123456789012:my-queue
```

---

## Long Polling vs Short Polling

### Short Polling (Default)

**Return immediately**:
```
Request → Check queue → Return (empty or with messages)

Behavior:
- Returns immediately (even if queue empty)
- May return empty responses (50% of requests)
- Higher cost (more API calls)

Cost: 1M requests with 50% empty = $0.40
```

### Long Polling

**Wait for messages**:
```
Request → Wait up to 20s for messages → Return

Behavior:
- Waits for messages (up to WaitTimeSeconds)
- Fewer empty responses
- Lower cost

Cost: 1M requests with 90% reduction = $0.04
```

### Configuration

**Queue-Level**:
```bash
aws sqs set-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/my-queue \
  --attributes ReceiveMessageWaitTimeSeconds=20
```

**Request-Level**:
```python
import boto3

sqs = boto3.client('sqs')

response = sqs.receive_message(
    QueueUrl='...',
    MaxNumberOfMessages=10,
    WaitTimeSeconds=20  # Long polling
)
```

### Best Practice

```
Always use long polling:
✅ Lower cost (fewer API calls)
✅ Faster message delivery
✅ Reduced latency

Set WaitTimeSeconds = 20 (maximum)
```

---

## Message Deduplication

### Standard Queue

**No built-in deduplication**:
```
Application must handle duplicates

Strategies:
1. Idempotent operations
2. Deduplication table
3. Message ID tracking
```

**Idempotent Example**:
```python
def process_payment(order_id, amount):
    # Check if already processed
    if db.exists('payments', order_id):
        return  # Already processed, skip
    
    # Process payment
    payment_gateway.charge(amount)
    
    # Record processing
    db.insert('payments', order_id)
```

### FIFO Queue

**Built-in deduplication**:
```
Deduplication Window: 5 minutes

Methods:
1. Message Deduplication ID (explicit)
2. Content-Based Deduplication (automatic)
```

**Message Deduplication ID**:
```python
import boto3
import hashlib

sqs = boto3.client('sqs')

# Send message with deduplication ID
sqs.send_message(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/my-queue.fifo',
    MessageBody='Order #12345',
    MessageGroupId='orders',
    MessageDeduplicationId='order-12345'  # Unique ID
)

# Duplicate (same deduplication ID within 5 min)
sqs.send_message(
    QueueUrl='...',
    MessageBody='Order #12345',
    MessageGroupId='orders',
    MessageDeduplicationId='order-12345'  # Duplicate ignored
)
```

**Content-Based Deduplication**:
```python
# Enable on queue
aws sqs set-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/my-queue.fifo \
  --attributes ContentBasedDeduplication=true

# Send message (no deduplication ID needed)
sqs.send_message(
    QueueUrl='...',
    MessageBody='Order #12345',
    MessageGroupId='orders'
    # Deduplication ID = SHA256(MessageBody)
)
```

### Message Group ID (FIFO)

**Ordering within groups**:
```
MessageGroupId = Partition key for ordering

Queue: my-queue.fifo

Group "user-123":
  Message A → Message B → Message C (ordered)

Group "user-456":
  Message X → Message Y → Message Z (ordered)

Groups processed in parallel
Messages within group processed in order
```

**Example**:
```python
# User 123's orders (processed in order)
sqs.send_message(
    QueueUrl='...',
    MessageBody='Order 1',
    MessageGroupId='user-123',
    MessageDeduplicationId='order-1'
)

sqs.send_message(
    QueueUrl='...',
    MessageBody='Order 2',
    MessageGroupId='user-123',
    MessageDeduplicationId='order-2'
)

# User 456's orders (processed in parallel with user-123)
sqs.send_message(
    QueueUrl='...',
    MessageBody='Order 3',
    MessageGroupId='user-456',
    MessageDeduplicationId='order-3'
)
```

---

## LocalStack Examples

### Producer (Python)

```python
import boto3
import json
import time

# LocalStack endpoint
sqs = boto3.client(
    'sqs',
    endpoint_url='http://localhost:4566',
    region_name='us-east-1',
    aws_access_key_id='test',
    aws_secret_access_key='test'
)

# Create queue
queue_url = sqs.create_queue(QueueName='orders-queue')['QueueUrl']

# Send messages
for i in range(10):
    message = {
        'order_id': f'order-{i}',
        'customer': f'customer-{i}',
        'amount': 100 + i
    }
    
    response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(message),
        MessageAttributes={
            'OrderType': {
                'DataType': 'String',
                'StringValue': 'online'
            }
        }
    )
    
    print(f"Sent message {i}: {response['MessageId']}")
    time.sleep(0.5)
```

### Consumer (Python)

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

queue_url = 'http://localhost:4566/000000000000/orders-queue'

# Long polling consumer
while True:
    response = sqs.receive_message(
        QueueUrl=queue_url,
        MaxNumberOfMessages=10,
        WaitTimeSeconds=20,  # Long polling
        MessageAttributeNames=['All']
    )
    
    if 'Messages' not in response:
        print("No messages, waiting...")
        continue
    
    for message in response['Messages']:
        body = json.loads(message['Body'])
        print(f"Processing: {body}")
        
        # Simulate processing
        try:
            process_order(body)
            
            # Delete message after successful processing
            sqs.delete_message(
                QueueUrl=queue_url,
                ReceiptHandle=message['ReceiptHandle']
            )
            print(f"Deleted message: {body['order_id']}")
            
        except Exception as e:
            print(f"Error processing {body['order_id']}: {e}")
            # Message will become visible again after visibility timeout

def process_order(order):
    # Business logic
    print(f"Processing order {order['order_id']}: ${order['amount']}")
```

### Producer (Go)

```go
package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
)

type Order struct {
	OrderID  string  `json:"order_id"`
	Customer string  `json:"customer"`
	Amount   float64 `json:"amount"`
}

func main() {
	// LocalStack session
	sess := session.Must(session.NewSession(&aws.Config{
		Endpoint: aws.String("http://localhost:4566"),
		Region:   aws.String("us-east-1"),
	}))

	sqsClient := sqs.New(sess)

	// Create queue
	createResult, _ := sqsClient.CreateQueue(&sqs.CreateQueueInput{
		QueueName: aws.String("orders-queue"),
	})
	queueURL := createResult.QueueUrl

	// Send messages
	for i := 0; i < 10; i++ {
		order := Order{
			OrderID:  fmt.Sprintf("order-%d", i),
			Customer: fmt.Sprintf("customer-%d", i),
			Amount:   100 + float64(i),
		}

		body, _ := json.Marshal(order)

		_, err := sqsClient.SendMessage(&sqs.SendMessageInput{
			QueueUrl:    queueURL,
			MessageBody: aws.String(string(body)),
			MessageAttributes: map[string]*sqs.MessageAttributeValue{
				"OrderType": {
					DataType:    aws.String("String"),
					StringValue: aws.String("online"),
				},
			},
		})

		if err != nil {
			fmt.Printf("Error sending message: %v\n", err)
		} else {
			fmt.Printf("Sent message %d\n", i)
		}

		time.Sleep(500 * time.Millisecond)
	}
}
```

### Consumer (Go)

```go
package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
)

type Order struct {
	OrderID  string  `json:"order_id"`
	Customer string  `json:"customer"`
	Amount   float64 `json:"amount"`
}

func main() {
	sess := session.Must(session.NewSession(&aws.Config{
		Endpoint: aws.String("http://localhost:4566"),
		Region:   aws.String("us-east-1"),
	}))

	sqsClient := sqs.New(sess)
	queueURL := "http://localhost:4566/000000000000/orders-queue"

	// Long polling consumer
	for {
		result, err := sqsClient.ReceiveMessage(&sqs.ReceiveMessageInput{
			QueueUrl:            aws.String(queueURL),
			MaxNumberOfMessages: aws.Int64(10),
			WaitTimeSeconds:     aws.Int64(20), // Long polling
			MessageAttributeNames: []*string{
				aws.String("All"),
			},
		})

		if err != nil {
			fmt.Printf("Error receiving messages: %v\n", err)
			continue
		}

		if len(result.Messages) == 0 {
			fmt.Println("No messages, waiting...")
			continue
		}

		for _, message := range result.Messages {
			var order Order
			json.Unmarshal([]byte(*message.Body), &order)

			fmt.Printf("Processing: %+v\n", order)

			// Simulate processing
			processOrder(order)

			// Delete message
			sqsClient.DeleteMessage(&sqs.DeleteMessageInput{
				QueueUrl:      aws.String(queueURL),
				ReceiptHandle: message.ReceiptHandle,
			})

			fmt.Printf("Deleted message: %s\n", order.OrderID)
		}
	}
}

func processOrder(order Order) {
	fmt.Printf("Processing order %s: $%.2f\n", order.OrderID, order.Amount)
	time.Sleep(1 * time.Second)
}
```

---

## Interview Questions

### Conceptual

**Q: Standard vs FIFO queues - when to use each?**
```
Standard Queue:
✅ Unlimited throughput
✅ At-least-once delivery (duplicates possible)
✅ Best-effort ordering
✅ Lower cost ($0.40/M)

Use cases:
- Log processing (order doesn't matter)
- Image resizing (independent tasks)
- Email sending (duplicates handled by idempotency)
- High-volume event processing

FIFO Queue:
✅ Guaranteed ordering
✅ Exactly-once processing
✅ Deduplication (5-minute window)
❌ Limited throughput (30,000 TPS)
❌ Higher cost ($0.50/M)

Use cases:
- Bank transactions (order matters)
- Stock trades (FIFO execution)
- Command processing (sequential operations)
- Event sourcing (order critical)

Decision:
- Need ordering → FIFO
- High throughput → Standard
- Default → Standard (with idempotent consumers)
```

**Q: How to handle message processing failures?**
```
Strategies:

1. Visibility Timeout + Retry:
   - Set VisibilityTimeout = 6 × avg processing time
   - Message auto-retried if consumer crashes

2. Dead Letter Queue:
   - maxReceiveCount = 3
   - After 3 failures → Move to DLQ
   - Analyze DLQ messages
   - Fix bugs, redrive to main queue

3. Exponential Backoff:
```python
def process_with_retry(message, max_retries=3):
    for attempt in range(max_retries):
        try:
            process(message)
            delete_message(message)
            return
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # 1s, 2s, 4s
                time.sleep(wait_time)
            else:
                # Final failure, message goes to DLQ
                raise
```

4. Idempotent Processing:
```python
def process_payment(order_id):
    # Check if already processed
    if redis.exists(f"processed:{order_id}"):
        return  # Skip duplicate
    
    # Process
    payment.charge(order_id)
    
    # Mark as processed
    redis.setex(f"processed:{order_id}", 3600, "1")
```
```

**Q: Long polling vs short polling - cost impact?**
```
Short Polling:
- Returns immediately (even if empty)
- Many empty responses

Example:
- 1M requests/day
- 50% empty responses
- Cost: 1M × $0.40/M = $0.40

Long Polling (WaitTimeSeconds=20):
- Waits for messages
- 90% fewer requests (fewer empty responses)

Example:
- 100K requests/day (10x reduction)
- Cost: 100K × $0.40/M = $0.04

Savings: $0.40 - $0.04 = $0.36/day = $131/year

Best Practice:
- Always use long polling
- Set WaitTimeSeconds = 20
- Saves cost + reduces latency
```

### Design

**Q: Design order processing system (1000 orders/sec, priority orders)**
```
Requirements:
- 1000 orders/sec
- Priority orders processed first
- Failure retry
- Idempotent processing

Architecture:

1. Two SQS Queues:
   - priority-orders.fifo (VIP customers)
   - standard-orders (regular customers)

2. Message Flow:
   API → Lambda (router) → SQS (based on customer tier)
   
   Router logic:
   if customer.tier == "VIP":
       send to priority-orders.fifo
   else:
       send to standard-orders

3. Consumer Workers:
   - Priority pool: 10 workers (only process priority queue)
   - Standard pool: 20 workers (process standard queue)
   
4. FIFO Configuration (Priority Queue):
   MessageGroupId = customer_id
   - Ensures one customer's orders processed in order
   - Multiple customers processed in parallel

5. Dead Letter Queue:
   - priority-dlq.fifo
   - standard-dlq
   - maxReceiveCount = 3

6. Idempotency:
   - Redis: SET processed:{order_id} 1 EX 3600
   - Check before processing

7. Monitoring:
   - Queue depth (CloudWatch)
   - Processing latency
   - DLQ depth (alert if > 0)
   - Consumer health

Capacity:
- 1000 orders/sec = 86.4M/day
- Priority: 10% = 8.6M/day
- Standard: 90% = 77.8M/day

FIFO limit: 30,000 TPS (sufficient for priority)
Standard: Unlimited (sufficient)

Cost:
- Priority: 8.6M × $0.50/M = $4.30/day
- Standard: 77.8M × $0.40/M = $31.12/day
- Total: ~$35/day = $1,050/month
```

**Q: Handle temporary service outage (payment gateway down for 1 hour)**
```
Scenario: Payment gateway down, queue backs up

Solution:

1. SQS Configuration:
   - MessageRetentionPeriod: 14 days (maximum)
   - VisibilityTimeout: 300 seconds (5 min)

2. Consumer Logic:
```python
def process_order(message):
    try:
        response = payment_gateway.charge(order)
        if response.status == 200:
            # Success
            sqs.delete_message(message)
        else:
            # Gateway error, retry
            raise Exception("Payment gateway error")
    except Exception as e:
        # Don't delete message
        # After visibility timeout, message reappears
        # Another consumer retries
        pass
```

3. Circuit Breaker:
```python
class CircuitBreaker:
    def __init__(self):
        self.failure_count = 0
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self.last_failure_time = None
    
    def call(self, func):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > 60:
                self.state = "HALF_OPEN"
            else:
                raise Exception("Circuit open")
        
        try:
            result = func()
            self.failure_count = 0
            self.state = "CLOSED"
            return result
        except:
            self.failure_count += 1
            if self.failure_count >= 5:
                self.state = "OPEN"
                self.last_failure_time = time.time()
            raise

# Usage
breaker = CircuitBreaker()

def process_order(order):
    try:
        breaker.call(lambda: payment_gateway.charge(order))
    except:
        # Circuit open, don't process
        # Message stays in queue
        pass
```

4. Auto-Scaling Consumers:
```
When queue depth > 10,000:
- Scale down consumers (reduce API calls)
- Wait for service recovery

When queue depth < 1,000:
- Scale up consumers (process backlog)
```

5. Result:
- Messages retained for 14 days
- Gateway recovers after 1 hour
- Consumers resume processing
- Backlog cleared in ~2 hours (with scaling)
- Zero message loss
```

---

This comprehensive SQS guide covers Standard/FIFO queues, visibility timeout, DLQs, polling strategies, deduplication, and production patterns with complete LocalStack examples in Python and Go! 📬

