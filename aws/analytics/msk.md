# Amazon Managed Streaming for Apache Kafka (MSK)

## Overview
Amazon MSK is a fully managed service that makes it easy to build and run applications that use Apache Kafka to process streaming data, without the operational overhead of managing Kafka clusters.

## Key Features

### Fully Managed Apache Kafka
- **Automated Provisioning**: Automatic cluster provisioning
- **Managed Updates**: Automated patching and updates
- **Multi-AZ Deployment**: High availability across zones
- **Kafka Compatibility**: 100% compatible with Apache Kafka

### Deployment Options
- **MSK Provisioned**: Provision and manage cluster capacity
- **MSK Serverless**: On-demand, automatically scales
- **MSK Connect**: Managed Kafka Connect workers
- **Custom Configurations**: Tailor Kafka settings

### Integration & Compatibility
- **Kafka APIs**: Standard Kafka producer/consumer APIs
- **Kafka Tools**: Use existing Kafka tools
- **AWS Integration**: Native integration with AWS services
- **Schema Registry**: AWS Glue Schema Registry support

### Security Features
- **Encryption**: In-transit (TLS) and at-rest encryption
- **Authentication**: IAM, SASL/SCRAM, mTLS
- **VPC Integration**: Run within your VPC
- **Private Connectivity**: AWS PrivateLink support

## Common Use Cases

### Real-Time Analytics
- **Stream Processing**: Process data streams in real-time
- **Event Streaming**: Capture and process events
- **Log Aggregation**: Centralized log processing
- **Metrics Collection**: Real-time metrics ingestion

### Data Integration
- **ETL Pipelines**: Real-time data transformation
- **Data Lakes**: Stream data to S3 data lakes
- **Database Replication**: CDC (Change Data Capture)
- **Microservices Communication**: Event-driven architecture

### IoT & Clickstream
- **IoT Data Ingestion**: Process IoT device data
- **Clickstream Analytics**: Website/app clickstream data
- **Mobile Analytics**: Mobile app event tracking
- **Gaming Telemetry**: Real-time game analytics

## Best Practices

### Cluster Design
- **Multi-AZ**: Always deploy across multiple AZs
- **Broker Sizing**: Right-size broker instances
- **Partition Strategy**: Optimal partition count
- **Replication Factor**: At least 3 for production

### Performance Optimization
- **Producer Tuning**: Batch size, compression
- **Consumer Groups**: Parallel processing
- **Partition Count**: Balance throughput and management
- **Monitoring**: Track lag, throughput, errors

### Security
- **Encryption**: Enable in-transit and at-rest
- **Authentication**: Use IAM for AWS integration
- **Network Isolation**: Deploy in private subnets
- **Least Privilege**: Minimal required permissions

## SAP-C02 Exam Focus Areas

### Core Concepts
- **Managed Kafka**: Fully managed Apache Kafka service
- **MSK Serverless**: Auto-scaling, on-demand option
- **MSK Connect**: Managed Kafka Connect
- **Multi-AZ**: High availability built-in

### Integration Patterns
- **Kinesis vs MSK**: When to choose each
- **Data Lakes**: Stream to S3 with MSK Connect
- **Analytics**: Integrate with Kinesis Analytics, EMR
- **Lambda Integration**: Process Kafka messages

### Key Exam Tips
- ✅ Use MSK when you need Apache Kafka specifically
- ✅ MSK Serverless for variable/unpredictable workloads
- ✅ Multi-AZ deployment for high availability
- ✅ MSK Connect simplifies integration with other systems
- ✅ Choose MSK over Kinesis when Kafka ecosystem is required
- ❌ Don't use MSK if Kinesis Data Streams is simpler and sufficient
- ❌ Serverless may have higher per-GB costs than provisioned

## MSK vs Kinesis Data Streams

| Feature | Amazon MSK | Kinesis Data Streams |
|---------|------------|---------------------|
| **Technology** | Apache Kafka | AWS proprietary |
| **Ecosystem** | Kafka tools/apps | AWS-native |
| **Message Retention** | Configurable (days/TB) | 1-365 days |
| **Consumer Model** | Pull-based | Pull and push |
| **Ordering** | Per partition | Per shard |
| **Complexity** | More complex | Simpler |
| **Cost** | Instance-based | Shard-based |
| **Use Case** | Kafka expertise/tools | AWS-native apps |

## Architecture Patterns

### Event-Driven Microservices
```
Services → MSK Cluster (Multi-AZ) → Consumer Services
              ↓
         Kafka Connect
              ↓
         S3 Data Lake
```

### Stream Processing Pipeline
```
IoT Devices → MSK → Kinesis Analytics → Results
                        ↓
                   ElastiCache/RDS
```

### Data Integration
```
Source DBs → MSK (CDC) → MSK Connect → Target Systems
                              ↓
                         S3, Redshift, etc.
```

## MSK Components

### Brokers
- **Kafka Brokers**: Handle read/write operations
- **Multi-AZ**: Distributed across zones
- **Instance Types**: Various sizes (m5, r5, etc.)
- **Storage**: EBS volumes for data persistence

### Zookeeper
- **Metadata Management**: Cluster coordination
- **Managed**: Fully managed by AWS
- **Multi-AZ**: High availability
- **Automatic Failover**: Built-in resilience

### MSK Connect
- **Kafka Connect**: Managed connector platform
- **Source Connectors**: Pull data into Kafka
- **Sink Connectors**: Push data from Kafka
- **Auto Scaling**: Automatic capacity management

## Monitoring

### CloudWatch Metrics
- **Broker Metrics**: CPU, memory, disk, network
- **Topic Metrics**: Bytes in/out, message count
- **Consumer Lag**: Monitor consumer performance
- **Partition Metrics**: Per-partition statistics

### Logging
- **Broker Logs**: CloudWatch Logs, S3, Kinesis Firehose
- **Application Logs**: Producer/consumer logging
- **Audit Logs**: Track access and changes

## Pricing Model
- **MSK Provisioned**: Per broker-hour + storage
- **MSK Serverless**: Per GB ingested and per partition-hour
- **MSK Connect**: Per connector-hour
- **Data Transfer**: Cross-AZ and cross-region

## Common Exam Scenarios
1. **Kafka Requirement**: Application specifically requires Apache Kafka
2. **Real-Time Analytics**: Process streaming data with Kafka tools
3. **Microservices**: Event-driven architecture with Kafka
4. **Data Integration**: MSK Connect for streaming to data lakes
5. **High Throughput**: Need Kafka's performance characteristics

---
*Last Updated: January 2026*
