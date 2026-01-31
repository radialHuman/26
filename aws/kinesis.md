# Amazon Kinesis: Real-Time Data Streaming

## Table of Contents
1. [Introduction and History](#introduction-and-history)
2. [Kinesis Fundamentals](#kinesis-fundamentals)
3. [Kinesis Data Streams Deep Dive](#kinesis-data-streams-deep-dive)
4. [Kinesis Data Firehose](#kinesis-data-firehose)
5. [Kinesis Data Analytics](#kinesis-data-analytics)
6. [Kinesis Client Library (KCL)](#kinesis-client-library-kcl)
7. [Sharding and Scaling](#sharding-and-scaling)
8. [Kinesis vs Kafka](#kinesis-vs-kafka)
9. [Local Development with Kafka](#local-development-with-kafka)
10. [Production Patterns](#production-patterns)
11. [Interview Questions](#interview-questions)

---

## Introduction and History

### The Genesis of Real-Time Streaming (2013)

Amazon Kinesis was launched in **November 2013** to address the growing need for real-time data processing. Before Kinesis, businesses relied on batch processing systems that introduced significant delays between data generation and insight extraction.

**Key Historical Milestones:**

- **2013**: Kinesis Data Streams launched as managed streaming service
- **2015**: Kinesis Firehose introduced for ETL to data lakes
- **2016**: Kinesis Analytics added for SQL-based stream processing
- **2017**: Enhanced Fan-Out introduced for dedicated throughput per consumer
- **2018**: On-Demand capacity mode launched (automatic scaling)
- **2019**: Kinesis Data Streams for AWS Lambda integration improved
- **2020**: Server-side encryption with AWS KMS became default
- **2021**: HTTP/2 data ingestion added for improved performance
- **2022**: Data Streams increased retention from 7 to 365 days
- **2023**: Provisioned mode cost reduced by 20%

### Why Kinesis Exists

Traditional batch processing systems process data in large chunks at scheduled intervals (hourly, daily). This introduces latency—events that occur at 9:01 AM might not be processed until 10:00 AM or later.

**Real-Time Processing Use Cases:**

1. **Clickstream Analytics**: Track user behavior as it happens
2. **Log Aggregation**: Centralize logs from thousands of servers
3. **IoT Telemetry**: Process sensor data from millions of devices
4. **Financial Transactions**: Detect fraud in milliseconds
5. **Gaming Leaderboards**: Update rankings in real-time
6. **Social Media Feeds**: Generate trending topics as events unfold

---

## Kinesis Fundamentals

### What is Kinesis?

Amazon Kinesis is a **fully managed platform** for real-time data streaming at massive scale. It consists of four distinct services:

1. **Kinesis Data Streams**: Core streaming service for custom processing
2. **Kinesis Data Firehose**: ETL service for loading data into AWS data stores
3. **Kinesis Data Analytics**: SQL-based stream processing
4. **Kinesis Video Streams**: Video ingestion and processing (not covered here)

### Core Concepts

#### 1. Data Records

The fundamental unit in Kinesis is a **data record**, which consists of:

```
Data Record = {
    Partition Key: "user-12345",          # Determines shard placement
    Data Blob: "{'event': 'click', ...}", # Actual payload (up to 1 MB)
    Sequence Number: "49590338271490256608352...", # Unique identifier
    Approximate Arrival Timestamp: 1640000000 # When record arrived
}
```

**Key Properties:**
- **Data Blob**: Up to **1 MB** of binary data
- **Partition Key**: Up to **256 bytes** (determines shard routing via hash)
- **Sequence Number**: Automatically assigned, guarantees ordering within shard
- **Retention**: 24 hours (default) to 365 days (configurable)

#### 2. Shards

A **shard** is the base unit of throughput capacity in Kinesis Data Streams.

**Shard Capacity:**
- **Write**: 1,000 records/second OR 1 MB/second (whichever comes first)
- **Read**: 5 transactions/second (GetRecords API calls)
- **Read Throughput**: 2 MB/second per shard (standard consumers)
- **Enhanced Fan-Out**: 2 MB/second per consumer per shard (dedicated)

**Example: Calculating Required Shards**

If your application produces:
- 5,000 records/second
- Average record size: 500 bytes

```
Records/second requirement: 5,000 / 1,000 = 5 shards
Throughput requirement: (5,000 × 500 bytes) / 1 MB = 2.5 MB/s → 2.5 shards

Required shards = max(5, 2.5) = 5 shards
```

#### 3. Partition Keys and Hashing

Kinesis uses **MD5 hashing** to distribute records across shards.

```python
import hashlib

def calculate_shard(partition_key, num_shards):
    """Determine which shard a partition key maps to"""
    # MD5 hash produces 128-bit integer
    hash_value = int(hashlib.md5(partition_key.encode()).hexdigest(), 16)
    
    # Map to shard number (0-indexed)
    max_hash = 2**128
    shard_id = int((hash_value / max_hash) * num_shards)
    
    return shard_id

# Example with 4 shards
print(calculate_shard("user-12345", 4))  # → Shard 2
print(calculate_shard("user-67890", 4))  # → Shard 1
```

**Hot Partition Problem:**

If you use a partition key with low cardinality (e.g., "country"), you risk hot partitions:

```python
# BAD: Low cardinality - most users from USA
partition_key = user_country  # "USA", "UK", "CA", ...

# GOOD: High cardinality - evenly distributed
partition_key = user_id  # "user-12345", "user-67890", ...

# BETTER: Composite key for related events
partition_key = f"{user_id}-{session_id}"  # Maintains order per session
```

#### 4. Sequence Numbers

Sequence numbers are **128-bit integers** that guarantee ordering within a shard. They are automatically assigned by Kinesis when a record is ingested.

**Ordering Guarantees:**
- **Within a shard**: Strictly ordered by sequence number
- **Across shards**: No ordering guarantee
- **Same partition key**: Always goes to the same shard (ordered)

```
Shard 0: [seq: 100, seq: 105, seq: 110] ← user-A events (ordered)
Shard 1: [seq: 102, seq: 107, seq: 112] ← user-B events (ordered)

Overall: No guarantee that seq 100 was processed before seq 102
```

---

## Kinesis Data Streams Deep Dive

### Stream Creation and Configuration

#### Creating a Stream

**Provisioned Mode** (manual shard management):

```python
import boto3

kinesis = boto3.client('kinesis', endpoint_url='http://localhost:4566')

# Create stream with 3 shards
kinesis.create_stream(
    StreamName='user-activity-stream',
    ShardCount=3
)

# Wait for stream to become active
waiter = kinesis.get_waiter('stream_exists')
waiter.wait(StreamName='user-activity-stream')

# Describe stream
response = kinesis.describe_stream(StreamName='user-activity-stream')
print(f"Status: {response['StreamDescription']['StreamStatus']}")
print(f"Shards: {len(response['StreamDescription']['Shards'])}")
```

**On-Demand Mode** (automatic scaling):

```python
# Create on-demand stream (AWS only, not LocalStack)
kinesis.create_stream(
    StreamName='auto-scaling-stream',
    StreamModeDetails={
        'StreamMode': 'ON_DEMAND'
    }
)
```

**On-Demand vs Provisioned:**

| Feature | Provisioned | On-Demand |
|---------|------------|-----------|
| **Scaling** | Manual resharding | Automatic (4x in 15 min) |
| **Cost** | $0.015/shard/hour + $0.014/million PUT | $0.04/GB ingested + $0.013/GB consumed |
| **Use Case** | Predictable traffic | Unpredictable spikes |
| **Max Capacity** | Unlimited (manual) | 200 MB/s write, 400 MB/s read |

#### Configuring Retention

```python
# Extend retention to 7 days (168 hours)
kinesis.increase_stream_retention_period(
    StreamName='user-activity-stream',
    RetentionPeriodHours=168
)

# Maximum retention: 365 days (8760 hours)
kinesis.increase_stream_retention_period(
    StreamName='long-term-stream',
    RetentionPeriodHours=8760
)
```

**Retention Cost:** $0.023 per shard-hour beyond 24 hours

Example: 5 shards with 7-day retention:
```
Cost = 5 shards × (168 - 24) hours × $0.023 = $16.56/week
```

### Producing Data

#### Single Record Put

```python
import json
import time

def put_record(stream_name, user_id, event_data):
    """Put single record to Kinesis stream"""
    response = kinesis.put_record(
        StreamName=stream_name,
        Data=json.dumps(event_data),
        PartitionKey=user_id  # Routes to shard based on hash
    )
    
    return {
        'shard_id': response['ShardId'],
        'sequence_number': response['SequenceNumber']
    }

# Example usage
event = {
    'user_id': 'user-12345',
    'event_type': 'page_view',
    'page': '/products/laptop',
    'timestamp': int(time.time())
}

result = put_record('user-activity-stream', 'user-12345', event)
print(f"Record written to {result['shard_id']}")
print(f"Sequence number: {result['sequence_number']}")
```

#### Batch Put (PutRecords)

For high-throughput applications, use **PutRecords** to batch up to **500 records** per API call:

```python
def put_records_batch(stream_name, records):
    """
    Batch put records to Kinesis stream
    
    Args:
        records: List of (partition_key, data) tuples
    
    Returns:
        Success count and failed records
    """
    # Prepare batch request
    request_records = [
        {
            'Data': json.dumps(data),
            'PartitionKey': partition_key
        }
        for partition_key, data in records
    ]
    
    response = kinesis.put_records(
        StreamName=stream_name,
        Records=request_records
    )
    
    # Check for failures
    failed_count = response['FailedRecordCount']
    failed_records = []
    
    if failed_count > 0:
        for idx, record_response in enumerate(response['Records']):
            if 'ErrorCode' in record_response:
                failed_records.append({
                    'index': idx,
                    'error_code': record_response['ErrorCode'],
                    'error_message': record_response['ErrorMessage'],
                    'original_record': records[idx]
                })
    
    return {
        'success_count': len(records) - failed_count,
        'failed_count': failed_count,
        'failed_records': failed_records
    }

# Example: Batch write 100 events
events = []
for i in range(100):
    user_id = f"user-{i % 50}"  # 50 unique users
    event_data = {
        'user_id': user_id,
        'event_type': 'click',
        'timestamp': int(time.time())
    }
    events.append((user_id, event_data))

result = put_records_batch('user-activity-stream', events)
print(f"Successfully wrote {result['success_count']} records")
print(f"Failed: {result['failed_count']}")

# Retry failed records with exponential backoff
if result['failed_records']:
    time.sleep(1)  # Initial backoff
    retry_records = [(r['original_record'][0], r['original_record'][1]) 
                     for r in result['failed_records']]
    put_records_batch('user-activity-stream', retry_records)
```

**PutRecords Performance:**
- **Throughput**: Up to 1,000 records/sec per shard × num_shards
- **Latency**: ~200ms average for batch of 500 records
- **Cost Savings**: Single API call instead of 500 calls

#### Producer with Error Handling

```python
import random
import logging
from typing import List, Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KinesisProducer:
    def __init__(self, stream_name, max_retries=3):
        self.stream_name = stream_name
        self.kinesis = boto3.client('kinesis', endpoint_url='http://localhost:4566')
        self.max_retries = max_retries
    
    def put_with_retry(self, partition_key, data):
        """Put record with exponential backoff retry"""
        for attempt in range(self.max_retries):
            try:
                response = self.kinesis.put_record(
                    StreamName=self.stream_name,
                    Data=json.dumps(data),
                    PartitionKey=partition_key
                )
                logger.info(f"Record written to {response['ShardId']}")
                return response
            
            except self.kinesis.exceptions.ProvisionedThroughputExceededException:
                # Throughput exceeded - backoff and retry
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                logger.warning(f"Throughput exceeded, retrying in {wait_time:.2f}s")
                time.sleep(wait_time)
            
            except Exception as e:
                logger.error(f"Failed to put record: {e}")
                raise
        
        raise Exception(f"Failed after {self.max_retries} retries")
    
    def put_batch_with_retry(self, records: List[tuple]):
        """Batch put with automatic retry for failed records"""
        attempts = 0
        current_records = records
        
        while current_records and attempts < self.max_retries:
            result = put_records_batch(self.stream_name, current_records)
            
            if result['failed_count'] == 0:
                logger.info(f"All {result['success_count']} records succeeded")
                return result
            
            # Retry only failed records
            current_records = [
                (r['original_record'][0], r['original_record'][1])
                for r in result['failed_records']
            ]
            
            attempts += 1
            wait_time = (2 ** attempts) + random.uniform(0, 1)
            logger.warning(f"Retrying {len(current_records)} failed records in {wait_time:.2f}s")
            time.sleep(wait_time)
        
        logger.error(f"Failed to write {len(current_records)} records after {self.max_retries} retries")
        return result

# Example usage
producer = KinesisProducer('user-activity-stream')

# Single record
producer.put_with_retry('user-123', {'event': 'login', 'timestamp': time.time()})

# Batch
events = [('user-' + str(i), {'event': 'click', 'page': i}) for i in range(500)]
producer.put_batch_with_retry(events)
```

### Consuming Data

#### Shard Iterator Types

Kinesis provides multiple ways to position your consumer in a stream:

```python
# 1. TRIM_HORIZON: Start from oldest record in stream
iterator_response = kinesis.get_shard_iterator(
    StreamName='user-activity-stream',
    ShardId='shardId-000000000000',
    ShardIteratorType='TRIM_HORIZON'
)

# 2. LATEST: Start from newest record (skip existing data)
iterator_response = kinesis.get_shard_iterator(
    StreamName='user-activity-stream',
    ShardId='shardId-000000000000',
    ShardIteratorType='LATEST'
)

# 3. AT_SEQUENCE_NUMBER: Resume from exact sequence number
iterator_response = kinesis.get_shard_iterator(
    StreamName='user-activity-stream',
    ShardId='shardId-000000000000',
    ShardIteratorType='AT_SEQUENCE_NUMBER',
    StartingSequenceNumber='49590338271490256608352475844782321943290411343812345678'
)

# 4. AFTER_SEQUENCE_NUMBER: Start after specific sequence
iterator_response = kinesis.get_shard_iterator(
    StreamName='user-activity-stream',
    ShardId='shardId-000000000000',
    ShardIteratorType='AFTER_SEQUENCE_NUMBER',
    StartingSequenceNumber='49590338271490256608352475844782321943290411343812345678'
)

# 5. AT_TIMESTAMP: Start from specific time
from datetime import datetime, timedelta

one_hour_ago = datetime.utcnow() - timedelta(hours=1)
iterator_response = kinesis.get_shard_iterator(
    StreamName='user-activity-stream',
    ShardId='shardId-000000000000',
    ShardIteratorType='AT_TIMESTAMP',
    Timestamp=one_hour_ago
)
```

#### Basic Consumer

```python
def consume_shard(stream_name, shard_id):
    """Simple consumer for a single shard"""
    # Get initial iterator
    iterator_response = kinesis.get_shard_iterator(
        StreamName=stream_name,
        ShardId=shard_id,
        ShardIteratorType='TRIM_HORIZON'
    )
    
    shard_iterator = iterator_response['ShardIterator']
    records_processed = 0
    
    while shard_iterator:
        # Get records (max 10,000 records or 10 MB)
        response = kinesis.get_records(
            ShardIterator=shard_iterator,
            Limit=100  # Process 100 records at a time
        )
        
        records = response['Records']
        
        # Process records
        for record in records:
            data = json.loads(record['Data'])
            print(f"Sequence: {record['SequenceNumber']}")
            print(f"Data: {data}")
            records_processed += 1
        
        # Get next iterator
        shard_iterator = response['NextShardIterator']
        
        # Sleep to avoid exceeding read throughput (5 TPS per shard)
        time.sleep(0.2)  # 5 requests/second
        
        # Exit condition (for demo purposes)
        if records_processed >= 1000:
            break
    
    print(f"Processed {records_processed} records")

# Consume from shard 0
consume_shard('user-activity-stream', 'shardId-000000000000')
```

#### Multi-Shard Consumer

```python
import threading

class MultiShardConsumer:
    def __init__(self, stream_name):
        self.stream_name = stream_name
        self.kinesis = boto3.client('kinesis', endpoint_url='http://localhost:4566')
        self.running = True
    
    def consume_shard(self, shard_id, checkpoint_callback):
        """Consume a single shard with checkpointing"""
        logger.info(f"Starting consumer for {shard_id}")
        
        # Get shard iterator
        iterator_response = self.kinesis.get_shard_iterator(
            StreamName=self.stream_name,
            ShardId=shard_id,
            ShardIteratorType='TRIM_HORIZON'
        )
        
        shard_iterator = iterator_response['ShardIterator']
        
        while self.running and shard_iterator:
            try:
                response = self.kinesis.get_records(
                    ShardIterator=shard_iterator,
                    Limit=100
                )
                
                records = response['Records']
                
                # Process records
                for record in records:
                    data = json.loads(record['Data'])
                    # Your processing logic here
                    self.process_record(shard_id, data)
                    
                    # Checkpoint last processed sequence number
                    checkpoint_callback(shard_id, record['SequenceNumber'])
                
                # Get next iterator
                shard_iterator = response['NextShardIterator']
                
                # Rate limiting
                time.sleep(0.2)
            
            except Exception as e:
                logger.error(f"Error consuming {shard_id}: {e}")
                time.sleep(1)
        
        logger.info(f"Consumer for {shard_id} stopped")
    
    def process_record(self, shard_id, data):
        """Override this method with your processing logic"""
        print(f"[{shard_id}] Processing: {data}")
    
    def start(self):
        """Start consumers for all shards"""
        # Get all shards
        response = self.kinesis.describe_stream(StreamName=self.stream_name)
        shards = response['StreamDescription']['Shards']
        
        logger.info(f"Starting consumers for {len(shards)} shards")
        
        # Checkpoint storage (in production, use DynamoDB)
        checkpoints = {}
        
        def checkpoint_callback(shard_id, sequence_number):
            checkpoints[shard_id] = sequence_number
        
        # Start thread for each shard
        threads = []
        for shard in shards:
            shard_id = shard['ShardId']
            thread = threading.Thread(
                target=self.consume_shard,
                args=(shard_id, checkpoint_callback)
            )
            thread.daemon = True
            thread.start()
            threads.append(thread)
        
        # Wait for threads
        try:
            for thread in threads:
                thread.join()
        except KeyboardInterrupt:
            logger.info("Shutting down consumers...")
            self.running = False

# Example usage
consumer = MultiShardConsumer('user-activity-stream')
# consumer.start()  # Uncomment to run
```

### Enhanced Fan-Out

Enhanced Fan-Out provides **dedicated throughput** of 2 MB/sec per consumer per shard, enabling multiple consumers without sharing the 2 MB/sec limit.

**Standard Consumers vs Enhanced Fan-Out:**

```
Standard (Shared 2 MB/sec):
Shard → [2 MB/sec total] → Consumer A (1 MB/sec)
                        → Consumer B (1 MB/sec)
                        → Consumer C (blocked)

Enhanced Fan-Out (Dedicated):
Shard → [2 MB/sec] → Consumer A
      → [2 MB/sec] → Consumer B
      → [2 MB/sec] → Consumer C
```

**Creating Enhanced Fan-Out Consumer:**

```python
# Register consumer (AWS only - not in LocalStack)
response = kinesis.register_stream_consumer(
    StreamARN='arn:aws:kinesis:us-east-1:123456789012:stream/user-activity-stream',
    ConsumerName='analytics-consumer'
)

consumer_arn = response['Consumer']['ConsumerARN']

# Wait for consumer to become active
waiter = kinesis.get_waiter('stream_consumer_registered')
waiter.wait(StreamARN=stream_arn, ConsumerName='analytics-consumer')

# Subscribe to shard with SubscribeToShard API
response = kinesis.subscribe_to_shard(
    ConsumerARN=consumer_arn,
    ShardId='shardId-000000000000',
    StartingPosition={
        'Type': 'TRIM_HORIZON'
    }
)

# Process events from stream
for event in response['EventStream']:
    if 'SubscribeToShardEvent' in event:
        records = event['SubscribeToShardEvent']['Records']
        for record in records:
            data = json.loads(record['Data'])
            print(data)
```

**Cost Comparison:**

| Consumer Type | Cost | Use Case |
|--------------|------|----------|
| **Standard** | Included | 1-2 consumers, cost-sensitive |
| **Enhanced Fan-Out** | $0.015/shard/hour + $0.013/GB | 3+ consumers, low latency (<70ms) |

Example: 10 shards, 5 consumers, 1 TB/month:
```
Enhanced Fan-Out Cost = (10 shards × $0.015 × 730 hours) + (1000 GB × $0.013)
                      = $109.50 + $13.00 = $122.50/month
```

---

## Kinesis Data Firehose

### What is Firehose?

Kinesis Data Firehose is a **fully managed ETL service** that captures, transforms, and loads streaming data into AWS data stores and analytics tools.

**Key Features:**
- **No code required** for basic ETL pipelines
- **Automatic scaling** (no shards to manage)
- **Built-in transformations** with AWS Lambda
- **Batch compression** (GZIP, ZIP, Snappy, Hadoop-compatible)
- **Encryption** with AWS KMS

**Supported Destinations:**
1. Amazon S3 (data lake)
2. Amazon Redshift (data warehouse via S3 COPY)
3. Amazon OpenSearch Service (log analytics)
4. Amazon Elasticsearch Service (deprecated, use OpenSearch)
5. Splunk (third-party SIEM)
6. HTTP endpoints (custom destinations)
7. Datadog, New Relic, MongoDB (partner destinations)

### Creating a Firehose Delivery Stream

```python
firehose = boto3.client('firehose', endpoint_url='http://localhost:4566')

# Create S3 delivery stream
response = firehose.create_delivery_stream(
    DeliveryStreamName='clickstream-to-s3',
    DeliveryStreamType='DirectPut',  # or 'KinesisStreamAsSource'
    S3DestinationConfiguration={
        'RoleARN': 'arn:aws:iam::123456789012:role/firehose-role',
        'BucketARN': 'arn:aws:s3:::my-analytics-bucket',
        'Prefix': 'clickstream/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/',
        'ErrorOutputPrefix': 'errors/',
        'BufferingHints': {
            'SizeInMBs': 5,      # Buffer size (1-128 MB)
            'IntervalInSeconds': 300  # Buffer interval (60-900 seconds)
        },
        'CompressionFormat': 'GZIP',
        'EncryptionConfiguration': {
            'KMSEncryptionConfig': {
                'AWSKMSKeyARN': 'arn:aws:kms:us-east-1:123456789012:key/...'
            }
        }
    }
)
```

**Buffering Logic:**

Firehose delivers data when **either** condition is met:
- Buffer size reaches threshold (e.g., 5 MB)
- Buffer interval elapses (e.g., 300 seconds)

```
Example with 5 MB / 300 sec:
- If 5 MB arrives in 60 seconds → deliver immediately
- If only 2 MB arrives in 300 seconds → deliver after 5 minutes
```

### Kinesis Streams to Firehose

Connect a Kinesis Data Stream to Firehose for automatic archiving:

```python
# Create Firehose with Kinesis Stream as source
response = firehose.create_delivery_stream(
    DeliveryStreamName='stream-archiver',
    DeliveryStreamType='KinesisStreamAsSource',
    KinesisStreamSourceConfiguration={
        'KinesisStreamARN': 'arn:aws:kinesis:us-east-1:123456789012:stream/user-activity-stream',
        'RoleARN': 'arn:aws:iam::123456789012:role/firehose-role'
    },
    ExtendedS3DestinationConfiguration={
        'BucketARN': 'arn:aws:s3:::archive-bucket',
        'Prefix': 'raw-data/',
        'BufferingHints': {
            'SizeInMBs': 128,
            'IntervalInSeconds': 900  # 15 minutes
        },
        'CompressionFormat': 'GZIP'
    }
)
```

**Architecture:**

```
Producers → Kinesis Data Streams → [Real-time consumers]
                                  ↓
                            Kinesis Firehose → S3 (archive)
                                            → Redshift (analytics)
```

### Data Transformation with Lambda

Firehose can invoke a Lambda function to transform records before delivery:

```python
# Lambda transformation function
def lambda_handler(event, context):
    """
    Transform Firehose records
    
    Input: Base64-encoded records
    Output: Transformed records with status
    """
    import base64
    import json
    
    output = []
    
    for record in event['records']:
        # Decode record
        payload = base64.b64decode(record['data'])
        data = json.loads(payload)
        
        # Transform: Add processing timestamp, enrich data
        transformed = {
            **data,
            'processed_at': int(time.time()),
            'enriched_field': 'some_value'
        }
        
        # Encode result
        output_record = {
            'recordId': record['recordId'],
            'result': 'Ok',  # 'Ok', 'Dropped', or 'ProcessingFailed'
            'data': base64.b64encode(json.dumps(transformed).encode()).decode()
        }
        
        output.append(output_record)
    
    return {'records': output}

# Create Firehose with transformation
firehose.create_delivery_stream(
    DeliveryStreamName='transformed-stream',
    DeliveryStreamType='DirectPut',
    ExtendedS3DestinationConfiguration={
        'BucketARN': 'arn:aws:s3:::transformed-bucket',
        'ProcessingConfiguration': {
            'Enabled': True,
            'Processors': [{
                'Type': 'Lambda',
                'Parameters': [{
                    'ParameterName': 'LambdaArn',
                    'ParameterValue': 'arn:aws:lambda:us-east-1:123456789012:function:transform'
                }]
            }]
        },
        'BufferingHints': {
            'SizeInMBs': 5,
            'IntervalInSeconds': 300
        }
    }
)
```

### Producing to Firehose

```python
def put_to_firehose(delivery_stream, records):
    """Put records to Firehose (max 500 per batch)"""
    # Prepare batch
    batch = [
        {'Data': json.dumps(record)}
        for record in records
    ]
    
    response = firehose.put_record_batch(
        DeliveryStreamName=delivery_stream,
        Records=batch
    )
    
    return {
        'success': response['RequestResponses'].count({'RecordId': ...}),
        'failed': response['FailedPutCount']
    }

# Example: Send clickstream events
events = [
    {'user_id': 'user-123', 'page': '/home', 'timestamp': time.time()},
    {'user_id': 'user-456', 'page': '/products', 'timestamp': time.time()}
]

put_to_firehose('clickstream-to-s3', events)
```

**Firehose vs Direct S3 Writes:**

| Feature | Firehose | Direct S3 |
|---------|----------|-----------|
| **Batching** | Automatic | Manual |
| **Compression** | Built-in | Manual |
| **Transformations** | Lambda integration | Custom code |
| **Partitioning** | Dynamic (timestamp-based) | Manual |
| **Cost** | $0.029/GB ingested | Just S3 PUT costs |
| **Use Case** | Streaming ETL | Full control |

---

## Kinesis Data Analytics

### What is Kinesis Data Analytics?

Kinesis Data Analytics enables **SQL-based real-time stream processing** without managing servers.

**Use Cases:**
1. **Real-time dashboards**: Aggregate metrics for live monitoring
2. **Anomaly detection**: Identify outliers in streaming data
3. **Time-series analysis**: Windowed aggregations
4. **ETL transformations**: Filter, enrich, and route streams

### SQL Application Example

```sql
-- Create input stream from Kinesis
CREATE OR REPLACE STREAM "SOURCE_SQL_STREAM_001" (
    user_id VARCHAR(50),
    event_type VARCHAR(20),
    page VARCHAR(100),
    event_time TIMESTAMP
);

-- Create pump to insert from Kinesis source
CREATE OR REPLACE PUMP "STREAM_PUMP" AS 
INSERT INTO "SOURCE_SQL_STREAM_001"
SELECT STREAM "user_id", "event_type", "page", 
       TIMESTAMP '1970-01-01 00:00:00' + INTERVAL '1' SECOND * "timestamp"
FROM "kinesis_source_001";

-- Real-time aggregation: Count events per page in 1-minute windows
CREATE OR REPLACE STREAM "DESTINATION_SQL_STREAM" (
    page VARCHAR(100),
    event_count BIGINT,
    window_end TIMESTAMP
);

CREATE OR REPLACE PUMP "AGGREGATE_PUMP" AS
INSERT INTO "DESTINATION_SQL_STREAM"
SELECT STREAM
    page,
    COUNT(*) AS event_count,
    STEP(event_time BY INTERVAL '1' MINUTE) AS window_end
FROM "SOURCE_SQL_STREAM_001"
GROUP BY page, STEP(event_time BY INTERVAL '1' MINUTE);

-- Anomaly detection: Detect pages with unusually high traffic
CREATE OR REPLACE STREAM "ANOMALY_STREAM" (
    page VARCHAR(100),
    event_count BIGINT,
    avg_count DOUBLE,
    window_end TIMESTAMP
);

CREATE OR REPLACE PUMP "ANOMALY_PUMP" AS
INSERT INTO "ANOMALY_STREAM"
SELECT STREAM
    page,
    event_count,
    avg_count,
    window_end
FROM (
    SELECT STREAM
        page,
        COUNT(*) AS event_count,
        AVG(COUNT(*)) OVER (
            PARTITION BY page
            ROWS 10 PRECEDING
        ) AS avg_count,
        STEP(event_time BY INTERVAL '1' MINUTE) AS window_end
    FROM "SOURCE_SQL_STREAM_001"
    GROUP BY page, STEP(event_time BY INTERVAL '1' MINUTE)
)
WHERE event_count > avg_count * 2;  -- Alert if 2x average
```

### Windowing Functions

```sql
-- TUMBLING WINDOW: Non-overlapping fixed intervals
SELECT STREAM
    FLOOR(event_time TO MINUTE) AS window_start,
    COUNT(*) AS event_count
FROM "SOURCE_SQL_STREAM_001"
GROUP BY FLOOR(event_time TO MINUTE);

-- SLIDING WINDOW: Overlapping windows
SELECT STREAM
    event_time,
    COUNT(*) OVER (
        ORDER BY ROWTIME
        RANGE INTERVAL '5' MINUTE PRECEDING
    ) AS events_last_5min
FROM "SOURCE_SQL_STREAM_001";

-- HOPPING WINDOW: Fixed-size windows with custom hop interval
SELECT STREAM
    STEP(event_time BY INTERVAL '5' MINUTE) AS window_end,
    COUNT(*) AS event_count
FROM "SOURCE_SQL_STREAM_001"
GROUP BY STEP(event_time BY INTERVAL '5' MINUTE);
```

---

## Kinesis Client Library (KCL)

### What is KCL?

The **Kinesis Client Library** is a Java/Python/Node.js library that simplifies building Kinesis consumers by handling:

1. **Load balancing**: Distributes shards across consumer instances
2. **Checkpointing**: Tracks progress in DynamoDB
3. **Failover**: Automatically reassigns shards when instances fail
4. **Shard changes**: Handles resharding (split/merge)

### KCL Architecture

```
DynamoDB (Checkpoints)
    ↑
    |
Consumer Instance 1 → Shard 0, Shard 1
Consumer Instance 2 → Shard 2, Shard 3
Consumer Instance 3 → Shard 4, Shard 5
    ↓
Kinesis Stream (6 shards)
```

**Key Concepts:**
- **Application Name**: Unique identifier for consumer group
- **Worker**: Consumer instance (scales horizontally)
- **Lease**: Exclusive ownership of a shard by a worker
- **Checkpoint**: Last processed sequence number per shard

### KCL 2.x Python Example

```python
from amazon_kinesisanalyticsv2 import KinesisAnalyticsV2Client
import time

# Install: pip install amazon-kinesis-client

from amazon_kinesisanalyticsv2.kcl import KCLProcess

class RecordProcessor:
    """Process records from Kinesis stream"""
    
    def __init__(self):
        self.shard_id = None
        self.checkpoint_seq = None
    
    def initialize(self, initialize_input):
        """Called when shard is assigned to this worker"""
        self.shard_id = initialize_input.shard_id
        print(f"Initialized processor for shard: {self.shard_id}")
    
    def process_records(self, process_records_input):
        """Process batch of records"""
        records = process_records_input.records
        
        for record in records:
            data = json.loads(record.data.decode('utf-8'))
            print(f"[{self.shard_id}] Processing: {data}")
            
            # Your business logic here
            self.process_event(data)
            
            # Track last sequence number
            self.checkpoint_seq = record.sequence_number
        
        # Checkpoint after processing batch
        try:
            process_records_input.checkpointer.checkpoint()
            print(f"Checkpointed at {self.checkpoint_seq}")
        except Exception as e:
            print(f"Checkpoint failed: {e}")
    
    def process_event(self, data):
        """Your custom processing logic"""
        # Example: Aggregate metrics
        if data['event_type'] == 'purchase':
            # Update database, send notification, etc.
            pass
    
    def shutdown(self, shutdown_input):
        """Called when shard is being closed"""
        reason = shutdown_input.reason
        print(f"Shutting down processor for {self.shard_id}: {reason}")
        
        if reason == 'TERMINATE':
            # Shard was closed (merged/split)
            shutdown_input.checkpointer.checkpoint()

# Start KCL worker
if __name__ == '__main__':
    kcl_process = KCLProcess(RecordProcessor())
    kcl_process.run()
```

**Configuration (`properties` file):**

```properties
# Application name (used for DynamoDB table name)
applicationName = MyKinesisApp

# Stream to consume
streamName = user-activity-stream

# AWS region
regionName = us-east-1

# DynamoDB table for checkpoints
dynamoDBTableName = MyKinesisApp-Checkpoints

# Worker identifier (unique per instance)
workerIdentifier = worker-001

# Checkpoint interval
checkpointIntervalMillis = 60000

# Failover time (how long before shard is reassigned)
failoverTimeMillis = 10000
```

### DynamoDB Checkpoint Table

KCL automatically creates a DynamoDB table to store checkpoints:

```
Table: MyKinesisApp-Checkpoints

+-----------------+------------------+----------------------+
| leaseKey        | checkpoint       | leaseOwner           |
| (Partition Key) | (Sequence Number)| (Worker ID)          |
+-----------------+------------------+----------------------+
| shardId-000     | 495903382714...  | worker-001           |
| shardId-001     | 495903382715...  | worker-002           |
| shardId-002     | 495903382716...  | worker-001           |
+-----------------+------------------+----------------------+
```

**Checkpoint Table Cost:**

With 10 shards:
- **Storage**: ~1 KB per shard = 10 KB → $0.00
- **Reads**: 10 shards × 1 read/sec × 2.6M sec/month = 26M reads → $3.25/month
- **Writes**: 10 shards × 1 write/minute × 43K min/month = 430K writes → $0.54/month

Total: **~$3.80/month**

---

## Sharding and Scaling

### Understanding Shard Limits

Each shard has **hard limits**:
- **Writes**: 1,000 records/sec OR 1 MB/sec (whichever comes first)
- **Reads**: 5 GetRecords calls/sec (2 MB/sec total)

**Example: Exceeding Write Capacity**

If you send 2,000 records/sec to a single shard:

```
Capacity: 1,000 records/sec
Load: 2,000 records/sec
Result: ProvisionedThroughputExceededException
```

### Calculating Shard Count

```python
def calculate_shards(records_per_sec, avg_record_size_kb):
    """
    Calculate required number of shards
    
    Args:
        records_per_sec: Peak records per second
        avg_record_size_kb: Average record size in KB
    
    Returns:
        Required number of shards
    """
    # Shard limits
    SHARD_WRITE_RECORDS = 1000  # records/sec
    SHARD_WRITE_MB = 1  # MB/sec
    
    # Calculate based on record count
    shards_by_count = records_per_sec / SHARD_WRITE_RECORDS
    
    # Calculate based on throughput
    throughput_mb = (records_per_sec * avg_record_size_kb) / 1024
    shards_by_throughput = throughput_mb / SHARD_WRITE_MB
    
    # Take maximum + 20% buffer
    required_shards = max(shards_by_count, shards_by_throughput) * 1.2
    
    return int(required_shards) + 1

# Example: 5,000 records/sec, 500 bytes each
shards_needed = calculate_shards(5000, 0.5)
print(f"Required shards: {shards_needed}")  # → 6 shards
```

### Resharding Operations

#### Splitting a Shard

Split a shard when it's approaching capacity (hot shard):

```python
def split_shard(stream_name, shard_id):
    """Split a shard into two child shards"""
    # Get shard details
    response = kinesis.describe_stream(StreamName=stream_name)
    shard = next(s for s in response['StreamDescription']['Shards'] 
                 if s['ShardId'] == shard_id)
    
    # Calculate split point (middle of hash key range)
    start_hash = int(shard['HashKeyRange']['StartingHashKey'])
    end_hash = int(shard['HashKeyRange']['EndingHashKey'])
    split_hash = str((start_hash + end_hash) // 2)
    
    # Split shard
    kinesis.split_shard(
        StreamName=stream_name,
        ShardToSplit=shard_id,
        NewStartingHashKey=split_hash
    )
    
    print(f"Split {shard_id} at hash key {split_hash}")
    
    # Wait for shards to become active
    time.sleep(10)
    
    # Verify
    response = kinesis.describe_stream(StreamName=stream_name)
    shards = response['StreamDescription']['Shards']
    print(f"Total shards after split: {len(shards)}")

# Example
split_shard('user-activity-stream', 'shardId-000000000000')
```

**Split Result:**

```
Before:
Shard 0: [0 → 340282366920938463463374607431768211455]

After:
Shard 0: [0 → 170141183460469231731687303715884105727] (CLOSED)
  ├─ Shard 3: [0 → 170141183460469231731687303715884105727]
  └─ Shard 4: [170141183460469231731687303715884105728 → 340282366920938463463374607431768211455]
```

#### Merging Shards

Merge two adjacent shards to reduce cost:

```python
def merge_shards(stream_name, shard_id_1, shard_id_2):
    """Merge two adjacent shards into one"""
    kinesis.merge_shards(
        StreamName=stream_name,
        ShardToMerge=shard_id_1,
        AdjacentShardToMerge=shard_id_2
    )
    
    print(f"Merged {shard_id_1} and {shard_id_2}")

# Example
merge_shards('user-activity-stream', 'shardId-000000000003', 'shardId-000000000004')
```

**Merge Result:**

```
Before:
Shard 3: [0 → 170141183460469231731687303715884105727]
Shard 4: [170141183460469231731687303715884105728 → 340282366920938463463374607431768211455]

After:
Shard 3: CLOSED
Shard 4: CLOSED
Shard 5: [0 → 340282366920938463463374607431768211455] (new parent)
```

### Autoscaling Strategy

```python
import time
from datetime import datetime, timedelta

class KinesisAutoscaler:
    def __init__(self, stream_name, target_utilization=0.7):
        self.stream_name = stream_name
        self.target_utilization = target_utilization
        self.cloudwatch = boto3.client('cloudwatch')
        self.kinesis = boto3.client('kinesis')
    
    def get_write_metrics(self):
        """Get write throughput metrics from CloudWatch"""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=5)
        
        response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/Kinesis',
            MetricName='IncomingBytes',
            Dimensions=[{'Name': 'StreamName', 'Value': self.stream_name}],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,  # 5 minutes
            Statistics=['Sum']
        )
        
        if response['Datapoints']:
            # Convert to MB/sec
            bytes_per_5min = response['Datapoints'][0]['Sum']
            mb_per_sec = (bytes_per_5min / (5 * 60)) / (1024 * 1024)
            return mb_per_sec
        
        return 0
    
    def scale(self):
        """Auto-scale based on current utilization"""
        # Get current shard count
        response = self.kinesis.describe_stream(StreamName=self.stream_name)
        current_shards = len(response['StreamDescription']['Shards'])
        
        # Get current throughput
        current_mb_per_sec = self.get_write_metrics()
        
        # Calculate capacity and utilization
        total_capacity = current_shards * 1  # 1 MB/sec per shard
        utilization = current_mb_per_sec / total_capacity
        
        print(f"Current: {current_shards} shards, {current_mb_per_sec:.2f} MB/s, {utilization:.1%} utilization")
        
        # Scale up if utilization > target
        if utilization > self.target_utilization:
            # Split hottest shard
            shards = response['StreamDescription']['Shards']
            open_shards = [s for s in shards if 'EndingSequenceNumber' not in s]
            if open_shards:
                split_shard(self.stream_name, open_shards[0]['ShardId'])
                print(f"Scaled UP: Split shard")
        
        # Scale down if utilization < target/2
        elif utilization < (self.target_utilization / 2) and current_shards > 1:
            # Merge two shards
            shards = response['StreamDescription']['Shards']
            open_shards = [s for s in shards if 'EndingSequenceNumber' not in s]
            if len(open_shards) >= 2:
                merge_shards(self.stream_name, open_shards[0]['ShardId'], open_shards[1]['ShardId'])
                print(f"Scaled DOWN: Merged shards")

# Example: Run autoscaler every 5 minutes
autoscaler = KinesisAutoscaler('user-activity-stream', target_utilization=0.7)
# while True:
#     autoscaler.scale()
#     time.sleep(300)
```

---

## Kinesis vs Kafka

### Comparison Table

| Feature | Kinesis Data Streams | Apache Kafka |
|---------|---------------------|--------------|
| **Deployment** | Fully managed (AWS) | Self-managed or MSK |
| **Scaling** | Manual resharding or On-Demand | Add brokers, repartition |
| **Retention** | 24 hours - 365 days | Configurable (hours to years) |
| **Throughput/Partition** | 1 MB/s write, 2 MB/s read | ~10-100 MB/s (configurable) |
| **Latency** | ~200ms | ~10-50ms |
| **Replication** | 3 AZs (automatic) | Configurable (typically 3) |
| **Ordering** | Per shard | Per partition |
| **Consumers** | KCL, Lambda, Firehose | Consumer Groups |
| **Ecosystem** | AWS services | Huge (Kafka Connect, KSQL, etc.) |
| **Cost (10 shards)** | ~$110/month | EC2 costs (~$150-500/month) |
| **Use Case** | AWS-native, simple streaming | High throughput, complex pipelines |

### When to Use Kinesis

1. **AWS-native architecture**: Already using AWS services
2. **Serverless**: No operational overhead desired
3. **Auto-scaling**: On-Demand mode handles spikes
4. **Compliance**: Data must stay in AWS
5. **Simple pipelines**: Firehose for ETL to S3/Redshift

### When to Use Kafka

1. **High throughput**: >1 MB/s per partition needed
2. **Multi-cloud**: Hybrid or non-AWS environment
3. **Ecosystem**: Need Kafka Connect, KSQL, Schema Registry
4. **Cost optimization**: High volume (TB/day) cheaper on Kafka
5. **Complex stream processing**: Kafka Streams for stateful operations

### Cost Comparison

**Scenario: 100 MB/sec sustained (8.64 TB/day)**

**Kinesis Data Streams (Provisioned):**
```
Shards needed: 100 MB/s ÷ 1 MB/s = 100 shards
Shard cost: 100 × $0.015 × 730 hours = $1,095/month
Data PUT: 8,640 GB/day × 30 days × $0.014/GB = $3,629/month
Total: $4,724/month
```

**Kinesis Data Streams (On-Demand):**
```
Data ingested: 8,640 GB/day × 30 days = 259,200 GB
Ingestion cost: 259,200 × $0.04/GB = $10,368/month
Data retrieval: 259,200 × $0.013/GB = $3,370/month
Total: $13,738/month
```

**Apache Kafka on EC2 (3 brokers):**
```
3 × r5.2xlarge (8 vCPU, 64 GB): 3 × $0.504/hour × 730 = $1,104/month
EBS (1 TB gp3 per broker): 3 × $80 = $240/month
Total: $1,344/month
```

**Winner for high throughput: Kafka** (5-10x cheaper at scale)

**Scenario: 1 MB/sec variable traffic (86 GB/day)**

**Kinesis On-Demand:**
```
Data ingested: 86 GB/day × 30 = 2,580 GB
Ingestion: 2,580 × $0.04 = $103.20/month
Retrieval: 2,580 × $0.013 = $33.54/month
Total: $136.74/month
```

**Kafka on EC2 (1 broker):**
```
1 × t3.medium: $0.0416/hour × 730 = $30.37/month
EBS (100 GB): $8/month
Total: $38.37/month (but requires management)
```

**Winner for low/variable throughput: Kinesis On-Demand** (no operational overhead)

---

## Local Development with Kafka

Since LocalStack's Kinesis support is limited, use **Apache Kafka** for local streaming development.

### Kafka Setup with Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
```

Start Kafka:

```bash
docker-compose up -d
```

### Kafka Producer (Python)

```python
from kafka import KafkaProducer
import json
import time

# Create producer
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    acks='all',  # Wait for all replicas to acknowledge
    retries=3,
    max_in_flight_requests_per_connection=1  # Guarantee ordering
)

def send_event(topic, key, value):
    """Send event to Kafka topic"""
    future = producer.send(
        topic,
        key=key.encode('utf-8'),
        value=value
    )
    
    # Block until sent (for demo - use async in production)
    record_metadata = future.get(timeout=10)
    
    print(f"Sent to {record_metadata.topic}")
    print(f"Partition: {record_metadata.partition}")
    print(f"Offset: {record_metadata.offset}")
    
    return record_metadata

# Example: Send user events
for i in range(100):
    user_id = f"user-{i % 10}"
    event = {
        'user_id': user_id,
        'event_type': 'click',
        'page': f'/page-{i}',
        'timestamp': int(time.time())
    }
    
    send_event('user-events', user_id, event)
    time.sleep(0.1)

producer.close()
```

### Kafka Consumer (Python)

```python
from kafka import KafkaConsumer
import json

# Create consumer
consumer = KafkaConsumer(
    'user-events',
    bootstrap_servers=['localhost:9092'],
    group_id='analytics-group',
    auto_offset_reset='earliest',  # Start from beginning
    enable_auto_commit=True,
    auto_commit_interval_ms=1000,
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)

print("Consuming messages...")

for message in consumer:
    print(f"Partition: {message.partition}, Offset: {message.offset}")
    print(f"Key: {message.key.decode('utf-8')}")
    print(f"Value: {message.value}")
    print("---")
    
    # Your processing logic here
    process_event(message.value)

def process_event(event):
    """Process event"""
    if event['event_type'] == 'click':
        # Update analytics database
        pass
```

### Kafka Consumer Group (Go)

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/segmentio/kafka-go"
)

type UserEvent struct {
	UserID    string `json:"user_id"`
	EventType string `json:"event_type"`
	Page      string `json:"page"`
	Timestamp int64  `json:"timestamp"`
}

func main() {
	// Create consumer (automatically joins consumer group)
	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{"localhost:9092"},
		Topic:    "user-events",
		GroupID:  "go-analytics-group",
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})
	defer r.Close()

	fmt.Println("Consuming messages...")

	for {
		m, err := r.ReadMessage(context.Background())
		if err != nil {
			log.Printf("Error reading message: %v", err)
			break
		}

		// Deserialize event
		var event UserEvent
		if err := json.Unmarshal(m.Value, &event); err != nil {
			log.Printf("Error deserializing: %v", err)
			continue
		}

		fmt.Printf("Partition: %d, Offset: %d\n", m.Partition, m.Offset)
		fmt.Printf("Event: %+v\n", event)

		// Process event
		processEvent(event)
	}
}

func processEvent(event UserEvent) {
	// Your processing logic
	if event.EventType == "purchase" {
		// Send confirmation email, update inventory, etc.
	}
}
```

### Kafka Streams (Real-Time Aggregation)

```python
# Install: pip install faust-streaming

import faust
from datetime import datetime

# Define Faust app
app = faust.App(
    'clickstream-analytics',
    broker='kafka://localhost:9092',
    value_serializer='json'
)

# Define event model
class ClickEvent(faust.Record):
    user_id: str
    page: str
    timestamp: int

# Define aggregation result
class PageStats(faust.Record):
    page: str
    click_count: int
    unique_users: int

# Input topic
clicks_topic = app.topic('user-events', value_type=ClickEvent)

# Output table (changelog topic)
page_stats = app.Table('page-stats', default=int)

# Stream processing agent
@app.agent(clicks_topic)
async def process_clicks(events):
    """Real-time aggregation of page clicks"""
    async for event in events:
        # Increment counter for page
        page_stats[event.page] += 1
        
        # Log real-time stats
        count = page_stats[event.page]
        print(f"{event.page}: {count} clicks")

# Tumbling window aggregation (1 minute)
@app.agent(clicks_topic)
async def windowed_stats(events):
    """Aggregate clicks per page in 1-minute windows"""
    async for window in events.tumbling(60.0, key_by='page'):
        page = window.key
        click_count = len(window.value)
        unique_users = len(set(e.user_id for e in window.value))
        
        stats = PageStats(
            page=page,
            click_count=click_count,
            unique_users=unique_users
        )
        
        print(f"[{datetime.now()}] {stats}")

# Run: faust -A myapp worker -l info
```

---

## Production Patterns

### Pattern 1: Real-Time Analytics Pipeline

```
Web/Mobile Apps → API Gateway → Lambda (Producer) → Kinesis Data Streams
                                                    ↓
                                                Lambda (Processor) → DynamoDB (Real-time metrics)
                                                    ↓
                                                Kinesis Firehose → S3 (Historical data)
                                                                → Redshift (Data warehouse)
```

**Implementation:**

```python
# Lambda Producer
def api_handler(event, context):
    """API Gateway handler - produce to Kinesis"""
    body = json.loads(event['body'])
    
    # Write to Kinesis
    kinesis.put_record(
        StreamName='clickstream',
        Data=json.dumps(body),
        PartitionKey=body['user_id']
    )
    
    return {'statusCode': 200, 'body': 'OK'}

# Lambda Consumer (attached to Kinesis as event source)
def stream_processor(event, context):
    """Process Kinesis records"""
    for record in event['Records']:
        # Decode record
        data = json.loads(base64.b64decode(record['kinesis']['data']))
        
        # Update real-time metrics in DynamoDB
        dynamodb.update_item(
            TableName='page-metrics',
            Key={'page': data['page']},
            UpdateExpression='ADD view_count :inc',
            ExpressionAttributeValues={':inc': 1}
        )
```

### Pattern 2: Event-Driven Microservices

```
Order Service → Kinesis Stream "orders"
                    ↓
                ┌───┴───┬───────┬──────────┐
                ↓       ↓       ↓          ↓
            Inventory  Payment  Shipping  Notification
            Service    Service  Service   Service
```

**Advantages:**
- **Decoupling**: Services don't directly call each other
- **Replay**: Can reprocess events from specific point
- **Audit Trail**: Complete event history
- **Scale Independently**: Each service scales based on its needs

### Pattern 3: CQRS with Kinesis

```
Write Model (Commands) → DynamoDB → DynamoDB Streams → Kinesis Data Streams
                                                      ↓
                                                  Lambda (Projections)
                                                      ↓
                                              Read Model (ElastiCache/RDS)
```

**Benefits:**
- **Optimized Reads**: Denormalized read models for performance
- **Event Sourcing**: All state changes captured as events
- **Multiple Projections**: Different read models for different use cases

### Pattern 4: Data Lake Ingestion

```
IoT Devices → Kinesis Data Streams → Kinesis Firehose → S3 (Raw)
                                                       → Glue (ETL)
                                                       → Athena (Query)
                                                       → QuickSight (Visualization)
```

**S3 Partitioning:**

```
s3://data-lake/
  ├─ sensors/
  │   ├─ year=2024/
  │   │   ├─ month=01/
  │   │   │   ├─ day=15/
  │   │   │   │   ├─ hour=10/
  │   │   │   │   │   └─ data-001.gz
```

### Error Handling and DLQ

```python
def process_with_dlq(event, context):
    """Process records with Dead Letter Queue for failures"""
    failed_records = []
    
    for record in event['Records']:
        try:
            data = json.loads(base64.b64decode(record['kinesis']['data']))
            process_record(data)
        
        except Exception as e:
            logger.error(f"Failed to process record: {e}")
            
            # Send to DLQ (SQS or Kinesis stream)
            sqs.send_message(
                QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/kinesis-dlq',
                MessageBody=json.dumps({
                    'record': record,
                    'error': str(e),
                    'timestamp': int(time.time())
                })
            )
            
            failed_records.append(record)
    
    # If any failed, raise exception to retry batch
    if failed_records:
        raise Exception(f"{len(failed_records)} records failed")
```

---

## Interview Questions

### Q1: Kinesis vs SQS - When to use which?

**Answer:**

| Use Case | Service | Reason |
|----------|---------|--------|
| **Real-time analytics** | Kinesis | Multiple consumers, replay capability |
| **Task queue** | SQS | Exactly-once processing, simple queue |
| **Event sourcing** | Kinesis | Event ordering, replay from any point |
| **Decoupling microservices** | SQS | Simpler, cheaper for basic messaging |
| **Log aggregation** | Kinesis | High throughput, multiple consumers |
| **Background jobs** | SQS | FIFO queues, visibility timeout |

**Key Differences:**
- **Consumers**: Kinesis allows multiple consumers reading same data; SQS messages are deleted after consumption
- **Ordering**: Kinesis guarantees order per shard; SQS FIFO guarantees order per MessageGroupId
- **Retention**: Kinesis retains data for replay (up to 365 days); SQS maximum 14 days
- **Throughput**: Kinesis 1 MB/s per shard (scalable); SQS unlimited (per queue)

---

### Q2: How do you handle a hot shard in Kinesis?

**Answer:**

**Detection:**
- Monitor CloudWatch metrics: `WriteProvisionedThroughputExceeded` for specific shard
- Check shard-level metrics in CloudWatch (enable shard-level metrics for $0.02/shard/hour)

**Root Cause:**
- **Low cardinality partition key**: Using `country`, `region`, etc.
- **Popular entity**: Celebrity user with 10M followers generating events

**Solutions:**

1. **Improve Partition Key Distribution:**
```python
# BAD: Most events go to same shard
partition_key = user_country  # "USA" for 60% of users

# GOOD: High cardinality
partition_key = user_id  # Even distribution

# BETTER: Add randomness for popular entities
if user_follower_count > 1_000_000:
    # Distribute celebrity events across multiple shards
    partition_key = f"{user_id}-{random.randint(0, 9)}"
else:
    partition_key = user_id
```

2. **Split the Hot Shard:**
```python
# Split shard to double capacity
split_shard('stream-name', 'hot-shard-id')
# Result: 1 MB/s → 2 MB/s capacity
```

3. **Switch to On-Demand Mode:**
- Automatically scales up to 200 MB/s write, 400 MB/s read
- No manual resharding needed

---

### Q3: Design a real-time leaderboard for a game with 10M concurrent players

**Answer:**

**Requirements:**
- 10M concurrent players
- Real-time score updates (sub-second latency)
- Top 100 global leaderboard
- Personal rank for each player

**Architecture:**

```
Game Clients → API Gateway → Lambda (Producer) → Kinesis Data Streams (100 shards)
                                                  ↓
                                              Lambda (Consumer)
                                                  ↓
                                              ElastiCache Redis (Sorted Sets)
                                                  ↓
                                              API Gateway (Query) → Lambda (Top 100 + Rank)
```

**Capacity Planning:**

Assuming 10M players each update score every 30 seconds:
```
Updates/sec = 10,000,000 / 30 = 333,333 updates/sec
Record size = 100 bytes (player_id, score, timestamp)

Throughput = 333,333 × 100 bytes = 33 MB/sec

Shards needed = 33 MB/sec ÷ 1 MB/sec = 33 shards
Buffer (50%): 33 × 1.5 = 50 shards
```

**Implementation:**

```python
# Producer Lambda
def update_score(event, context):
    body = json.loads(event['body'])
    
    kinesis.put_record(
        StreamName='game-scores',
        Data=json.dumps({
            'player_id': body['player_id'],
            'score': body['score'],
            'timestamp': int(time.time())
        }),
        PartitionKey=body['player_id']
    )

# Consumer Lambda
import redis

redis_client = redis.Redis(host='leaderboard.cache.amazonaws.com', port=6379)

def process_scores(event, context):
    for record in event['Records']:
        data = json.loads(base64.b64decode(record['kinesis']['data']))
        
        # Update Redis sorted set (O(log N))
        redis_client.zadd('global-leaderboard', {
            data['player_id']: data['score']
        })

# Query Lambda
def get_leaderboard(event, context):
    # Top 100 players (O(log N + 100))
    top_100 = redis_client.zrevrange('global-leaderboard', 0, 99, withscores=True)
    
    # Get player rank (O(log N))
    player_id = event['queryStringParameters']['player_id']
    rank = redis_client.zrevrank('global-leaderboard', player_id)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'top_100': [{'player': p, 'score': s} for p, s in top_100],
            'your_rank': rank + 1 if rank else None
        })
    }
```

**Cost Estimation (Monthly):**

```
Kinesis (50 shards, provisioned):
  - Shard hours: 50 × $0.015 × 730 = $547.50
  - PUT payload: 333,333 rec/sec × 100 bytes × 2.6M sec × $0.014/1M PUT = $1,213

ElastiCache (r6g.xlarge - 26 GB memory):
  - Instance: $0.252/hour × 730 = $184

Lambda (consumer):
  - Invocations: 333,333/sec × 2.6M sec / 100 batch = 8.67M invocations × $0.20/1M = $1.73
  - Duration: 8.67M × 100ms × $0.0000166667/GB-sec × 512 MB = $7.22

Total: ~$1,953/month
```

**Alternative: Kafka + Redis** (if cost-sensitive):
- Kafka on 3 × r5.large: ~$300/month
- Redis: Same $184/month
- Total: ~$484/month (4x cheaper)

---

### Q4: How do you ensure exactly-once processing in Kinesis?

**Answer:**

Kinesis provides **at-least-once delivery**, meaning records may be delivered multiple times. To achieve exactly-once processing:

**1. Idempotent Processing:**

Make your processing logic idempotent (same result if executed multiple times):

```python
def process_payment(payment_event):
    """Idempotent payment processing"""
    payment_id = payment_event['payment_id']
    
    # Check if already processed (DynamoDB conditional write)
    try:
        dynamodb.put_item(
            TableName='processed-payments',
            Item={
                'payment_id': payment_id,
                'amount': payment_event['amount'],
                'processed_at': int(time.time())
            },
            ConditionExpression='attribute_not_exists(payment_id)'  # Only if not exists
        )
        
        # Process payment (charge card, etc.)
        charge_card(payment_event)
        
    except dynamodb.exceptions.ConditionalCheckFailedException:
        # Already processed - skip
        logger.info(f"Payment {payment_id} already processed")
```

**2. Deduplication Table:**

Track processed sequence numbers in DynamoDB:

```python
def process_with_deduplication(record):
    shard_id = record['eventID'].split(':')[0]
    sequence_number = record['kinesis']['sequenceNumber']
    
    # Check if processed
    response = dynamodb.get_item(
        TableName='kinesis-checkpoints',
        Key={'shard_id': shard_id}
    )
    
    if 'Item' in response:
        last_seq = response['Item']['last_sequence_number']
        if sequence_number <= last_seq:
            logger.info("Already processed")
            return
    
    # Process record
    data = json.loads(base64.b64decode(record['kinesis']['data']))
    process_record(data)
    
    # Update checkpoint
    dynamodb.put_item(
        TableName='kinesis-checkpoints',
        Item={
            'shard_id': shard_id,
            'last_sequence_number': sequence_number,
            'updated_at': int(time.time())
        }
    )
```

**3. Transaction IDs:**

Include unique transaction ID in each event:

```python
# Producer
event = {
    'transaction_id': str(uuid.uuid4()),  # Unique ID
    'user_id': 'user-123',
    'action': 'purchase',
    'amount': 99.99
}

# Consumer (deduplicate by transaction_id)
def process_with_transaction_id(event):
    tx_id = event['transaction_id']
    
    # Use DynamoDB transaction for atomic check + write
    try:
        dynamodb.transact_write_items(
            TransactItems=[
                {
                    'Put': {
                        'TableName': 'processed-transactions',
                        'Item': {'tx_id': tx_id},
                        'ConditionExpression': 'attribute_not_exists(tx_id)'
                    }
                },
                {
                    'Update': {
                        'TableName': 'user-balance',
                        'Key': {'user_id': event['user_id']},
                        'UpdateExpression': 'ADD balance :amount',
                        'ExpressionAttributeValues': {':amount': event['amount']}
                    }
                }
            ]
        )
    except dynamodb.exceptions.TransactionCanceledException:
        logger.info(f"Transaction {tx_id} already processed")
```

---

### Q5: Kinesis Data Streams vs Kinesis Firehose - What are the tradeoffs?

**Answer:**

| Feature | Data Streams | Firehose |
|---------|-------------|----------|
| **Use Case** | Custom processing, multiple consumers | ETL to data stores |
| **Management** | Manual scaling (shards) | Fully managed (auto-scaling) |
| **Latency** | Real-time (~200ms) | Near real-time (60-900 sec buffer) |
| **Retention** | 24 hours - 365 days | No retention (delivery only) |
| **Consumers** | Custom (Lambda, KCL, etc.) | Fixed destinations (S3, Redshift, etc.) |
| **Transformations** | Custom code | Lambda transformation |
| **Cost** | $0.015/shard-hour + $0.014/million PUT | $0.029/GB ingested |
| **Replay** | Yes (retained data) | No |

**When to Use Data Streams:**
- Need multiple consumers reading same data
- Require custom processing logic
- Need to replay historical events
- Real-time latency requirements (<1 second)

**When to Use Firehose:**
- Simple ETL to S3, Redshift, OpenSearch
- No custom consumers needed
- OK with 60-900 second buffering
- Want fully managed (no shard management)

**Combined Pattern:**

```
Producers → Kinesis Data Streams → Lambda (real-time processing)
                                 → Firehose → S3 (archival)
```

This gives you both real-time processing AND automatic archival.

---

## Summary

**Kinesis Data Streams** is AWS's managed real-time data streaming platform, competing with Apache Kafka. It enables building real-time analytics, event-driven architectures, and data pipelines without managing infrastructure.

**Key Takeaways:**

1. **Shards** are the unit of capacity: 1 MB/s write, 2 MB/s read
2. **Partition keys** determine shard routing via MD5 hashing
3. **Enhanced Fan-Out** provides dedicated 2 MB/s per consumer
4. **KCL** simplifies building scalable consumers with auto-balancing
5. **Firehose** offers no-code ETL to S3/Redshift/OpenSearch
6. **Kinesis Analytics** enables SQL-based stream processing
7. **Kafka** offers higher throughput and richer ecosystem but requires management

**Production Best Practices:**

- Use **high-cardinality partition keys** to avoid hot shards
- Implement **idempotent processing** for exactly-once semantics
- Monitor **CloudWatch metrics** for shard-level utilization
- Use **On-Demand mode** for unpredictable workloads
- Combine with **Firehose** for automatic S3 archival
- Implement **DLQ pattern** for failed records

Kinesis is ideal for AWS-native real-time architectures, while Kafka excels in high-throughput, multi-cloud scenarios. Choose based on your operational capabilities and ecosystem requirements.

