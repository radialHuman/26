# Amazon EMR (Elastic MapReduce)

## What is Amazon EMR?

Amazon EMR is a managed big data platform that makes it easy to process vast amounts of data using open-source tools such as Apache Spark, Apache Hive, Apache HBase, Apache Flink, Apache Hudi, and Presto. EMR provisions and scales compute capacity, installs and configures software, and handles cluster management tasks. Think of EMR as a managed Hadoop ecosystem in the cloud.

## Why Use Amazon EMR?

### Key Benefits
- **Managed Service**: Automated provisioning, scaling, and tuning
- **Cost-Effective**: Pay only for resources used, Spot instance support
- **Flexible**: Support for multiple big data frameworks
- **Scalable**: Scale from single node to thousands
- **Fast**: Optimized performance for S3
- **Integrated**: Works with S3, DynamoDB, Glue, Lake Formation
- **Secure**: VPC isolation, encryption, IAM integration

### Use Cases
- Big data analytics and processing
- Machine learning at scale
- ETL pipelines
- Log analysis
- Clickstream analysis
- Genomics processing
- Financial analysis
- Real-time streaming with Spark/Flink
- Interactive SQL queries (Presto, Hive)
- Graph processing (Spark GraphX)

## How EMR Works

### Architecture Components

**Cluster**:
- Collection of EC2 instances (nodes)
- Runs big data frameworks
- Temporary or long-running

**Node Types**:
1. **Master Node**: 
   - Manages cluster
   - Coordinates data distribution
   - Runs NameNode, ResourceManager
   - Single point of failure (use multiple for HA)

2. **Core Nodes**:
   - Run DataNode and NodeManager
   - Store data in HDFS
   - Execute tasks
   - Minimum 1 required

3. **Task Nodes** (Optional):
   - Execute tasks only
   - No HDFS storage
   - Can be added/removed easily
   - Ideal for Spot instances

### Cluster Lifecycle

```
Launch → Bootstrap → Running → Resize → Terminate
              ↓
    Install software, configure
```

**Cluster Modes**:
- **Transient**: Auto-terminate after job completion
- **Long-Running**: Persistent cluster for multiple jobs

## EMR Deployment Options

### 1. EMR on EC2 (Traditional)

**Characteristics**:
- Full control over EC2 instances
- Choose instance types and sizes
- Support for Spot, Reserved, On-Demand
- VPC deployment
- EBS or instance store volumes

**Use Cases**:
- Custom configurations
- Long-running clusters
- HDFS storage requirements
- Mixed workloads

### 2. EMR on EKS

**Characteristics**:
- Run Spark jobs on existing EKS clusters
- Share compute with other applications
- Better resource utilization
- K8s-native scheduling
- Multi-tenancy support

**Use Cases**:
- Organizations standardized on Kubernetes
- Mixed workloads (data processing + applications)
- Fine-grained resource control
- Cost optimization through sharing

### 3. EMR Serverless

**Characteristics**:
- No cluster management
- Automatic scaling
- Pay only for job duration
- Pre-initialized workers for fast startup
- Built-in high availability

**Use Cases**:
- Intermittent workloads
- Unpredictable usage patterns
- Quick POCs and development
- Event-driven data processing

**Comparison**:
| Feature | EMR on EC2 | EMR on EKS | EMR Serverless |
|---------|------------|------------|----------------|
| **Management** | Cluster-based | Container-based | Serverless |
| **Scaling** | Manual/Auto | K8s-based | Automatic |
| **Startup** | 5-10 min | 2-5 min | < 1 min |
| **Frameworks** | All EMR apps | Spark only | Spark, Hive |
| **Control** | High | Medium | Low |
| **Best For** | Complex workloads | K8s environments | Ad-hoc jobs |

## EMR Applications and Frameworks

### Apache Spark

**What is Spark?**
- Unified analytics engine
- In-memory processing (100x faster than MapReduce)
- Supports batch, streaming, ML, graph processing

**Components**:
- **Spark Core**: Basic functionality
- **Spark SQL**: Structured data processing
- **Spark Streaming**: Real-time data processing
- **MLlib**: Machine learning library
- **GraphX**: Graph processing

**Example Use Cases**:
- ETL pipelines
- Real-time analytics
- Machine learning training
- Iterative algorithms

**EMR Optimizations**:
- S3-optimized performance
- Dynamic allocation
- EMR Runtime (faster than open-source)
- Maximized resource utilization

### Apache Hive

**What is Hive?**
- Data warehouse infrastructure
- SQL-like interface (HiveQL)
- Query data in S3 or HDFS
- Good for batch processing

**Use Cases**:
- SQL-based data analysis
- Data warehousing
- Batch reporting
- Log processing

**EMR Integration**:
- Works with Glue Data Catalog
- Can query S3 directly
- Integration with Presto for faster queries

### Apache HBase

**What is HBase?**
- NoSQL database on Hadoop
- Random, real-time read/write access
- Billions of rows, millions of columns
- Built on HDFS

**Use Cases**:
- Time-series data
- Real-time analytics
- Sparse data storage
- Audit logs

### Apache Flink

**What is Flink?**
- Stream processing framework
- True real-time processing (vs micro-batching)
- Event time processing
- Stateful computations

**Use Cases**:
- Real-time ETL
- Fraud detection
- Recommendation engines
- IoT data processing

### Presto

**What is Presto?**
- Distributed SQL query engine
- Interactive queries
- Query data from multiple sources
- Faster than Hive for ad-hoc queries

**Use Cases**:
- Interactive analytics
- Ad-hoc queries
- Data lake exploration
- Federated queries

### Other Applications
- **Pig**: Data flow scripting
- **Mahout**: Machine learning
- **Hudi**: Incremental data processing
- **Phoenix**: SQL on HBase
- **Zeppelin**: Notebook interface
- **JupyterHub**: Jupyter notebooks
- **Ganglia**: Monitoring

## EMR Storage Options

### 1. S3 (Recommended)

**Benefits**:
- Decoupled storage from compute
- Virtually unlimited capacity
- Durable (99.999999999%)
- Cost-effective
- Can terminate cluster, keep data

**Use Cases**:
- Data lakes
- Input/output for transient clusters
- Long-term data retention

**EMRFS**:
- S3-optimized connector for EMR
- Consistent view for S3 (optional)
- S3 Select for Spark
- Performance optimizations

### 2. HDFS

**Benefits**:
- Low latency (local storage)
- Good for intermediate data
- Required for some applications (HBase)

**Drawbacks**:
- Data lost when cluster terminates
- Limited by instance storage
- Higher cost (always running)

**Use Cases**:
- Intermediate processing data
- Cache for hot data
- Iterative algorithms

### 3. Local File System

**Benefits**:
- Fastest access
- Good for temporary data

**Use Cases**:
- Temporary files
- Shuffle data
- Application logs

## Cluster Configuration

### Instance Types

**Master Node**:
- m5.xlarge or larger
- m5, m6g (general purpose)
- High availability: 3 masters

**Core Nodes**:
- **Memory-Intensive**: r5, r6g
- **Compute-Intensive**: c5, c6g
- **Balanced**: m5, m6g
- **Storage-Optimized**: i3, d2

**Task Nodes**:
- Same as core nodes
- Good candidates for Spot instances

### Instance Purchase Options

**On-Demand**:
- Reliable, no interruption
- Highest cost
- Use for master and core nodes

**Reserved Instances**:
- 1 or 3-year commitment
- Up to 75% savings
- Good for long-running clusters

**Spot Instances**:
- Up to 90% savings
- Can be interrupted
- Best for task nodes
- Set maximum price

**Spot Best Practices**:
- Use Spot for task nodes only
- Diversify instance types
- Set timeout behavior
- Use capacity-optimized allocation

### Auto Scaling

**Managed Scaling** (Recommended):
```yaml
Configuration:
  MinimumCapacityUnits: 2
  MaximumCapacityUnits: 10
  MaximumCoreCapacityUnits: 5
  MaximumOnDemandCapacityUnits: 5
```
- Automatically scales based on metrics
- No manual rules required
- Optimizes for cost and performance

**Custom Auto Scaling**:
```yaml
Rules:
  - Name: ScaleOutOnYARNMemory
    Trigger:
      CloudWatchAlarmDefinition:
        MetricName: YARNMemoryAvailablePercentage
        ComparisonOperator: LESS_THAN
        Threshold: 15
        Period: 300
    Action:
      SimpleScalingPolicyConfiguration:
        ScalingAdjustment: 1
        CoolDown: 300
```

## Bootstrap Actions and Steps

### Bootstrap Actions

**What are they?**
- Scripts run before applications start
- Execute on all cluster nodes
- Install additional software
- Configure environment

**Example**:
```bash
# Bootstrap script to install Python packages
#!/bin/bash
sudo pip install pandas numpy scikit-learn
```

**Use Cases**:
- Install custom libraries
- Configure system settings
- Download configuration files
- Set environment variables

### Steps

**What are they?**
- Work submitted to cluster
- JAR files, scripts, or commands
- Can be added during or after launch

**Example**:
```bash
# Submit Spark job as step
aws emr add-steps \
  --cluster-id j-XXXXXXXXXXXXX \
  --steps Type=Spark,Name="SparkJob",\
ActionOnFailure=CONTINUE,\
Args=[--deploy-mode,cluster,--master,yarn,\
s3://mybucket/myjob.py]
```

## Security

### Network Isolation

**VPC Deployment**:
- Launch in private subnets
- Use security groups
- No internet access required (use VPC endpoints)

**Security Groups**:
- Master: SSH (22), Web interfaces (various ports)
- Core/Task: Internal cluster communication

### Encryption

**At Rest**:
- **S3**: SSE-S3, SSE-KMS, CSE
- **HDFS**: LUKS encryption
- **EBS**: EBS encryption

**In Transit**:
- TLS between nodes
- TLS for S3 communication
- Application-level encryption (Spark, etc.)

**Configuration**:
```json
{
  "EncryptionConfiguration": {
    "EnableInTransitEncryption": true,
    "EnableAtRestEncryption": true,
    "AtRestEncryptionConfiguration": {
      "S3EncryptionConfiguration": {
        "EncryptionMode": "SSE-KMS",
        "AwsKmsKey": "arn:aws:kms:region:account:key/key-id"
      },
      "LocalDiskEncryptionConfiguration": {
        "EncryptionKeyProviderType": "AwsKms",
        "AwsKmsKey": "arn:aws:kms:region:account:key/key-id"
      }
    },
    "InTransitEncryptionConfiguration": {
      "TLSCertificateConfiguration": {
        "CertificateProviderType": "PEM",
        "S3Object": "s3://bucket/certs.zip"
      }
    }
  }
}
```

### Authentication and Authorization

**Kerberos**:
- Strong authentication
- Integrate with Active Directory
- Required for some enterprise workloads

**IAM Roles**:
- EC2 instance profile for cluster nodes
- Service role for EMR service
- Auto Scaling role (if using)

**Lake Formation Integration**:
- Fine-grained access control
- Column and row-level security
- Integration with Glue Data Catalog

### Apache Ranger Integration

**What is Ranger?**
- Centralized security administration
- Fine-grained authorization
- Audit logging
- Policy management

**Use Cases**:
- Multi-tenant environments
- Compliance requirements
- Complex authorization rules

## Monitoring and Logging

### CloudWatch Metrics

**Cluster Metrics**:
- `IsIdle`: Cluster has no running jobs
- `CoreNodesRunning`: Number of core nodes
- `AppsRunning`: Running YARN applications
- `ContainerAllocated`: YARN containers allocated
- `YARNMemoryAvailablePercentage`: Available memory

**Custom Metrics**:
- Application-specific metrics
- Published via CloudWatch agent

### EMR Notebooks

**What are they?**
- Managed Jupyter notebooks
- Connect to EMR clusters
- Support PySpark, SparkR, SparkSQL
- Integrate with Git repositories

**Use Cases**:
- Interactive data exploration
- Prototyping Spark jobs
- Data visualization
- Collaborative analysis

### Logging

**Log Locations**:
- CloudWatch Logs (optional)
- S3 (cluster logs)
- Local HDFS (on master node)

**Log Types**:
- Application logs (Spark, Hive, etc.)
- Bootstrap action logs
- Step logs
- System logs (syslog, messages)

## Performance Optimization

### S3 Performance

**S3-Optimized Reads**:
- Use EMR File System (EMRFS)
- Enable S3 Select for Spark
- Use columnar formats (Parquet, ORC)
- Partition data appropriately

**S3 Consistency**:
- EMRFS Consistent View (optional)
- Handles S3 eventual consistency
- Maintains metadata in DynamoDB

### Spark Optimization

**Memory Tuning**:
```
spark.executor.memory: Per executor
spark.driver.memory: Driver memory
spark.memory.fraction: Execution vs storage
```

**Parallelism**:
```
spark.default.parallelism: Default partitions
spark.sql.shuffle.partitions: Shuffle partitions
```

**Caching**:
```python
# Cache frequently accessed data
df.cache()
df.count()  # Triggers caching
```

**Broadcast Joins**:
```python
from pyspark.sql.functions import broadcast
result = large_df.join(broadcast(small_df), "id")
```

### Cluster Sizing

**Right-Sizing**:
- Monitor cluster utilization
- Adjust instance types based on workload
- Use Auto Scaling for variable loads

**Best Practices**:
- Start small, scale up
- Use task nodes for additional capacity
- Separate compute from storage (use S3)
- Use Spot for task nodes

## Cost Optimization

### Pricing Components

**EC2 Instances**:
- EMR price + EC2 price
- Per second billing (1-minute minimum)

**EMR Price**:
- Varies by instance type
- ~25% of EC2 price for On-Demand
- No charge for Spot instances (EC2 price only)

### Cost Reduction Strategies

**1. Use Spot Instances**:
- Up to 90% savings
- Use for task nodes
- Diversify instance types
- Set appropriate timeouts

**2. Use S3 for Storage**:
- Cheaper than EBS/instance store
- No cost when cluster terminated
- Lifecycle policies for archival

**3. Terminate Idle Clusters**:
- Auto-termination for transient workloads
- CloudWatch alarms on IdleTime
- Use EMR Serverless for intermittent jobs

**4. Right-Size Instances**:
- Match instance type to workload
- Use Graviton2 (m6g, r6g) for lower cost

**5. Use Savings Plans**:
- Commit to usage for 1 or 3 years
- Up to 72% savings
- Flexible across instance families

**6. Optimize File Formats**:
- Use Parquet/ORC (lower processing time)
- Compress data (Snappy, GZIP)
- Reduces I/O and compute costs

## Integration Patterns

### Data Lake Analytics

```
S3 Data Lake → EMR (Spark Processing) → S3 (Results)
                       ↓
              Glue Data Catalog (Metadata)
                       ↓
           Athena / Redshift Spectrum (Queries)
```

### Real-Time Processing

```
Kinesis Data Streams → EMR (Flink/Spark Streaming) → S3 / DynamoDB
                                                    ↓
                                            CloudWatch (Monitoring)
```

### ML Pipeline

```
S3 (Raw Data) → EMR (Spark ML) → S3 (Features)
                                      ↓
                            SageMaker (Training)
                                      ↓
                          Model Endpoint (Inference)
```

### Hybrid ETL

```
On-Premises Data → Direct Connect → EMR (Processing)
                                        ↓
                                   S3 / Redshift
```

## Best Practices for SAP-C02

### Design Principles

1. **Separate Storage and Compute**
   - Use S3 for data storage
   - Terminate clusters when idle
   - Use transient clusters for batch jobs

2. **Use Appropriate Deployment Option**
   - EMR on EC2: Complex workloads, HDFS required
   - EMR on EKS: Kubernetes environment, shared resources
   - EMR Serverless: Intermittent, unpredictable workloads

3. **Optimize for Cost**
   - Spot instances for task nodes
   - Auto Scaling for variable loads
   - Terminate idle clusters
   - Use Savings Plans for predictable workloads

4. **Security Best Practices**
   - Launch in VPC private subnets
   - Enable encryption at rest and in transit
   - Use IAM roles, not hardcoded credentials
   - Integrate with Lake Formation for fine-grained access

5. **Performance Optimization**
   - Use columnar formats (Parquet, ORC)
   - Partition data appropriately
   - Right-size instances and cluster
   - Enable S3-optimized reads

6. **Monitoring and Alerting**
   - Enable CloudWatch metrics
   - Set up alarms for cluster health
   - Use EMR Notebooks for debugging
   - Export logs to S3 for analysis

### Common Exam Scenarios

**Scenario 1**: Large-Scale ETL Processing
- **Solution**: EMR with Spark, S3 storage, transient clusters, Spot task nodes

**Scenario 2**: Real-Time Stream Processing
- **Solution**: EMR with Flink or Spark Streaming, Kinesis as source, auto-scaling

**Scenario 3**: Interactive SQL on Data Lake
- **Solution**: EMR with Presto, Glue Data Catalog, long-running cluster or EMR Serverless

**Scenario 4**: Cost Optimization for Variable Workloads
- **Solution**: EMR Serverless or transient clusters, Spot instances, S3 storage

**Scenario 5**: Secure Multi-Tenant Environment
- **Solution**: EMR with Ranger, Lake Formation, VPC isolation, encryption enabled

**Scenario 6**: Migrating from On-Premises Hadoop
- **Solution**: EMR on EC2 for compatibility, gradual shift to S3, use EMR managed scaling

## EMR vs Other Services

| Feature | EMR | Glue | Athena | Redshift |
|---------|-----|------|--------|----------|
| **Type** | Big data framework | Serverless ETL | Serverless queries | Data warehouse |
| **Use Case** | Complex processing | ETL pipelines | Ad-hoc SQL | Analytics |
| **Management** | Managed clusters | Serverless | Serverless | Managed cluster |
| **Frameworks** | Spark, Hive, etc. | Spark | Presto/Trino | PostgreSQL |
| **Scaling** | Manual/Auto | Auto | Auto | Manual/Auto |
| **Best For** | Custom workloads | Standard ETL | Infrequent queries | BI workloads |

## Quick Reference

### Common CLI Commands

```bash
# Create cluster
aws emr create-cluster \
  --name "MyCluster" \
  --release-label emr-6.10.0 \
  --applications Name=Spark Name=Hive \
  --ec2-attributes KeyName=mykey,SubnetId=subnet-xxx \
  --instance-type m5.xlarge \
  --instance-count 3 \
  --use-default-roles

# Add step
aws emr add-steps \
  --cluster-id j-XXXXXXXXXXXXX \
  --steps Type=Spark,Name="Spark App",\
ActionOnFailure=CONTINUE,\
Args=[--class,org.apache.spark.examples.SparkPi,\
/usr/lib/spark/examples/jars/spark-examples.jar,10]

# Terminate cluster
aws emr terminate-clusters --cluster-ids j-XXXXXXXXXXXXX

# List clusters
aws emr list-clusters --active

# Describe cluster
aws emr describe-cluster --cluster-id j-XXXXXXXXXXXXX
```

### Important Limits

- Max nodes per cluster: 500 (default), adjustable
- Max active clusters: 500 per region
- Max steps per cluster: 256
- Max bootstrap actions: 16
- Step execution timeout: No limit
- Cluster keeps running time: No limit

### Exam Tips

1. **EMR is for big data frameworks**: Spark, Hive, HBase, Flink, Presto
2. **Three deployment options**: EC2 (full control), EKS (Kubernetes), Serverless (no management)
3. **Storage options**: S3 (recommended), HDFS, local file system
4. **Node types**: Master (management), Core (storage + compute), Task (compute only)
5. **Spot instances**: Use for task nodes to save up to 90%
6. **Auto Scaling**: Managed scaling is recommended, custom rules available
7. **Security**: VPC, encryption, Kerberos, Lake Formation, Ranger
8. **Monitoring**: CloudWatch metrics, EMR Notebooks, logs to S3
9. **Cost optimization**: Transient clusters, S3 storage, Spot instances, Savings Plans
10. **Integration**: Works with S3, Glue Data Catalog, Lake Formation, SageMaker

## Summary

Amazon EMR is the managed big data platform for:
- Large-scale data processing using Spark, Hadoop, Hive, Flink
- ETL pipelines and data transformations
- Real-time stream processing
- Machine learning at scale
- Complex analytics requiring custom frameworks

Key strengths: Flexibility (multiple frameworks), scalability (massive workloads), cost-effective (Spot instances, transient clusters), integrated (S3, Glue, Lake Formation), secure (VPC, encryption, fine-grained access).
