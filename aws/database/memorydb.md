# Amazon MemoryDB for Redis

## Overview
Amazon MemoryDB for Redis is a durable, in-memory database service that delivers ultra-fast performance with Multi-AZ durability and data persistence, compatible with Redis.

## Key Features

### Durable In-Memory Database
- **In-Memory Performance**: Microsecond read and single-digit millisecond write latency
- **Multi-AZ Durability**: Data persisted across multiple Availability Zones
- **Transaction Log**: Durable transaction log for data persistence
- **Redis Compatibility**: Compatible with Redis OSS

### High Availability
- **Multi-AZ Replication**: Automatic failover across AZs
- **Automatic Failover**: Sub-second failover for high availability
- **Read Replicas**: Scale read operations
- **Cluster Mode**: Horizontal scaling with sharding

### Data Persistence
- **Durable Storage**: Data persisted to Multi-AZ transaction log
- **Crash Recovery**: Automatic recovery with full data integrity
- **Snapshots**: Point-in-time backups
- **No Data Loss**: Strong consistency guarantees

### Security
- **Encryption**: At-rest and in-transit encryption
- **VPC Isolation**: Run in Amazon VPC
- **IAM Authentication**: AWS IAM for access control
- **Redis ACLs**: Fine-grained access control

## Common Use Cases

### Microservices Applications
- **Session Store**: Durable session management
- **Application Cache**: High-speed caching layer
- **API Cache**: Cache API responses
- **Shared State**: Distributed application state

### Real-Time Applications
- **Gaming Leaderboards**: Fast, durable leaderboards
- **Chat Applications**: Real-time messaging
- **Live Analytics**: Real-time data processing
- **Streaming Data**: Process streaming data

### High-Performance Databases
- **Primary Database**: Use as primary database with durability
- **Distributed Cache**: Durable distributed caching
- **Job Queues**: Fast, reliable job queuing
- **Rate Limiting**: Distributed rate limiting

## Best Practices

### Architecture Design
- **Multi-AZ Deployment**: Always use Multi-AZ for production
- **Cluster Mode**: Use for horizontal scaling
- **Read Replicas**: Scale read-heavy workloads
- **VPC Design**: Proper network isolation

### Performance Optimization
- **Data Modeling**: Optimize Redis data structures
- **Connection Pooling**: Reuse connections efficiently
- **Pipeline Commands**: Batch commands when possible
- **Memory Management**: Monitor and optimize memory usage

### Security
- **Encryption**: Enable encryption at rest and in transit
- **Network Security**: Use security groups and NACLs
- **IAM Policies**: Implement least privilege access
- **Redis ACLs**: Fine-grained user permissions

## SAP-C02 Exam Focus Areas

### Core Concepts
- **Durability**: Multi-AZ transaction log for data persistence
- **Performance**: In-memory speed with database durability
- **Redis Compatibility**: Drop-in replacement for Redis
- **Use Case**: When you need both speed AND durability

### Comparison with ElastiCache
| Feature | MemoryDB | ElastiCache Redis |
|---------|----------|-------------------|
| **Primary Use** | Durable database | Cache |
| **Durability** | Multi-AZ persistence | Optional snapshots |
| **Data Loss** | No data loss | Possible on failure |
| **Recovery** | Automatic with full data | May lose recent data |
| **Performance** | Microsecond reads | Microsecond reads |
| **Cost** | Higher (durability) | Lower (cache-only) |

### Key Exam Tips
- ✅ Choose MemoryDB when you need BOTH in-memory speed AND durability
- ✅ Use for primary database with Redis compatibility
- ✅ Multi-AZ transaction log ensures no data loss
- ✅ Ideal for microservices requiring durable state
- ❌ Don't use if ElastiCache (cache-only) is sufficient
- ❌ More expensive than ElastiCache due to durability features

## Architecture Patterns

### Primary Database Pattern
```
Application → MemoryDB (Primary Database)
                ↓
         Multi-AZ Persistence
```

### Hybrid Pattern
```
Application → MemoryDB (Fast Data)
           → RDS/Aurora (Historical Data)
```

### Microservices Pattern
```
Service A ↘
Service B → MemoryDB Cluster → Multi-AZ Durability
Service C ↗
```

## Monitoring & Management

### CloudWatch Metrics
- **Performance**: CPU, memory, network utilization
- **Commands**: Commands processed per second
- **Connections**: Active connections
- **Replication**: Replication lag

### Backup & Recovery
- **Automatic Backups**: Daily automated snapshots
- **Manual Snapshots**: On-demand backups
- **Point-in-Time Recovery**: Restore to specific point
- **Cross-Region Copy**: Copy snapshots to other regions

## Pricing Model
- **On-Demand Nodes**: Pay per hour for nodes
- **Data Storage**: Per GB-month for snapshots
- **Data Transfer**: Cross-AZ and cross-region transfer
- **Node Types**: Various instance types (memory-optimized)

## Common Exam Scenarios
1. **Durable Session Store**: Microservices need persistent session data with low latency
2. **Gaming Leaderboard**: Real-time leaderboard that can't lose data
3. **Primary Database**: Need Redis as primary database, not just cache
4. **High Availability**: Require automatic failover with zero data loss
5. **Replacing Self-Managed Redis**: Migrate from self-managed Redis to managed service with durability

---
*Last Updated: January 2026*
