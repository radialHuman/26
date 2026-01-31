# AWS Glue

## What is AWS Glue?

AWS Glue is a fully managed, serverless extract, transform, and load (ETL) service that makes it easy to prepare and load data for analytics. It automatically discovers, catalogs, and transforms your data, making it immediately available for analytics and machine learning. Think of Glue as your data preparation assistant that handles the heavy lifting of ETL workloads.

## Why Use AWS Glue?

### Key Benefits
- **Serverless**: No infrastructure to provision or manage
- **Auto-Discovery**: Automatically crawls data sources and infers schemas
- **Cost-Effective**: Pay only for resources consumed during job runs
- **Integrated**: Works seamlessly with S3, RDS, Redshift, Athena
- **Flexible**: Supports Python and Scala for ETL scripts
- **Schema Evolution**: Handles schema changes automatically
- **Job Scheduling**: Built-in job orchestration and monitoring

### Use Cases
- Data lake ETL pipelines
- Data warehouse loading (Redshift)
- Event-driven ETL workflows
- Data catalog for analytics
- Schema discovery and versioning
- Data quality and validation
- Incremental data processing
- Multi-source data integration

## How AWS Glue Works

### Core Components

**Glue Data Catalog**:
- Central metadata repository
- Stores table definitions, schemas, partitions
- Integrates with Athena, EMR, Redshift Spectrum
- Acts as Hive Metastore compatible
- Supports multiple databases and tables
- Version control for schema changes

**Glue Crawlers**:
- Automatically discover data and schemas
- Connect to data stores (S3, RDS, JDBC)
- Populate Data Catalog with metadata
- Update schemas when data changes
- Support custom classifiers
- Schedule-based or on-demand runs

**Glue ETL Jobs**:
- Transform data using Spark or Python
- Serverless execution environment
- Auto-scaling based on workload
- Support for bookmarks (track processed data)
- Built-in transformations library
- Visual ETL editor available (Glue Studio)

**Glue Triggers**:
- Schedule jobs (cron expressions)
- Event-based triggers (S3, EventBridge)
- Conditional triggers (job completion)
- Chain multiple jobs together
- Support for workflows

## Glue Components Deep Dive

### 1. Glue Data Catalog

**Database Structure**:
```
Account
└── Region
    └── Data Catalog
        └── Databases
            └── Tables
                ├── Schema (columns, data types)
                ├── Partitions
                ├── Storage descriptor
                └── Properties
```

**Key Features**:
- **Schema Versioning**: Track schema changes over time
- **Partition Indexes**: Improve query performance
- **Resource Policies**: Control access to catalog
- **Cross-Account Access**: Share catalog with other accounts
- **Encryption**: Encrypt metadata at rest

**Integration**:
- Athena uses it for table definitions
- EMR can use as Hive Metastore
- Redshift Spectrum for external tables
- Lake Formation for permissions
- QuickSight for data discovery

### 2. Glue Crawlers

**How Crawlers Work**:
1. Connect to data store
2. Scan data and infer schema
3. Create or update table in Data Catalog
4. Add partitions if applicable
5. Update statistics

**Crawler Configuration**:
```yaml
Data Source:
  - S3 paths
  - JDBC connections (RDS, Redshift)
  - DynamoDB tables
  - MongoDB, DocumentDB

Classifiers:
  - Built-in (JSON, CSV, Parquet, ORC, Avro, XML)
  - Custom (Grok patterns)
  - Classifier priority

Schedule:
  - On-demand
  - Scheduled (hourly, daily, weekly, monthly)
  - Event-driven (via Lambda/EventBridge)

Output:
  - Target database in Data Catalog
  - Table prefix (optional)
  - Schema update behavior
```

**Schema Change Handling**:
- **Add New Columns**: Add to existing table
- **Remove Columns**: Keep in table (backward compatibility)
- **Change Data Type**: Create new version or update
- **Partition Columns**: Automatically detected from S3 structure

**Best Practices**:
- Use sample percentage for large datasets
- Schedule during off-peak hours
- Use partition projection for time-series data
- Enable crawler logs for troubleshooting
- Use table prefix to organize tables

### 3. Glue ETL Jobs

**Job Types**:

**Spark Jobs**:
- Use Apache Spark for distributed processing
- Support Python (PySpark) or Scala
- Best for large-scale transformations
- DPU (Data Processing Unit) based pricing
- Support for Glue 2.0, 3.0, 4.0 versions

**Python Shell Jobs**:
- Lightweight Python scripts
- No Spark overhead
- Best for simple transformations
- Lower cost for small workloads
- Python 3.6 or 3.9 runtime

**Ray Jobs**:
- Use Ray distributed framework
- Python-based data processing
- Good for ML preprocessing
- Flexible compute options

**Job Configuration**:
```yaml
Basic Settings:
  - Job name
  - IAM role
  - Glue version (2.0, 3.0, 4.0)
  - Job type (Spark, Python Shell, Ray)
  - Script location (S3)

Compute:
  - DPU allocation (2-100 for Spark)
  - Max capacity or Auto Scaling
  - Worker type (Standard, G.1X, G.2X, G.025X)
  - Number of workers
  - Timeout (minutes)

Job Parameters:
  - --TempDir (S3 location)
  - --job-bookmark-option
  - --enable-metrics
  - --enable-continuous-cloudwatch-log
  - Custom parameters (--key=value)

Advanced:
  - Max concurrency
  - Max retries
  - Security configuration
  - Connections (JDBC, network)
  - Tags
```

**Glue DynamicFrames**:
- Extension of Spark DataFrames
- Handle semi-structured data better
- Schema flexibility (choice types)
- Built-in transformations

**Common Transformations**:
```python
# ApplyMapping - Change field names/types
ApplyMapping.apply(
    frame=datasource,
    mappings=[
        ("old_name", "string", "new_name", "string"),
        ("price", "string", "price", "double")
    ]
)

# Filter - Remove rows
Filter.apply(
    frame=datasource,
    f=lambda x: x["age"] > 18
)

# DropFields - Remove columns
DropFields.apply(
    frame=datasource,
    paths=["ssn", "internal_id"]
)

# Join - Combine datasets
Join.apply(
    frame1=orders,
    frame2=customers,
    keys1=["customer_id"],
    keys2=["id"]
)

# Relationalize - Flatten nested structures
Relationalize.apply(
    frame=datasource,
    root_table_name="root",
    staging_path="s3://bucket/temp/"
)
```

### 4. Job Bookmarks

**Purpose**: Track data already processed to enable incremental processing

**How It Works**:
- Stores state information about processed data
- Tracks last processed timestamp, file, or row
- Prevents reprocessing same data
- Reduces cost and processing time

**Bookmark Options**:
- **Enable**: Use bookmarks
- **Disable**: Process all data every run
- **Pause**: Skip bookmark update (testing)

**Supported Sources**:
- S3 (based on modification time)
- JDBC (based on monotonically increasing key)
- Relational databases with primary keys
- DynamoDB

**Limitations**:
- Not supported for all data sources
- Requires consistent data structure
- May need custom logic for complex scenarios

### 5. Glue Studio

**Visual ETL Editor**:
- Drag-and-drop interface
- No coding required for common transformations
- Generates optimized PySpark code
- Real-time data preview
- Built-in data quality checks

**Components**:
- **Sources**: S3, Catalog, JDBC, Kinesis
- **Transforms**: Join, Filter, Aggregate, SQL
- **Targets**: S3, Catalog, JDBC
- **Custom Transform**: Add custom PySpark code

**Benefits**:
- Faster development
- Visual debugging
- Easier to maintain
- Good for non-programmers
- Can export to code for customization

### 6. Glue DataBrew

**What is DataBrew?**
- Visual data preparation tool
- 250+ pre-built transformations
- No coding required
- Interactive data profiling
- Recipe-based transformations

**Key Features**:
- Data profiling with statistics
- Data quality rules
- Recipe versioning
- Schedule jobs
- Integration with Data Catalog

**Use Cases**:
- Data cleaning and normalization
- Data quality improvement
- Preparing ML training data
- Ad-hoc data analysis
- Data format conversion

## Glue Workflows

**Workflow Components**:
- **Jobs**: ETL jobs to execute
- **Crawlers**: Discover and catalog data
- **Triggers**: Start, schedule, conditional, on-demand

**Workflow Patterns**:
```
Pattern 1: Sequential
Crawler → Job1 → Job2 → Job3

Pattern 2: Parallel
         ┌→ Job1 ┐
Crawler →│→ Job2 │→ Final Job
         └→ Job3 ┘

Pattern 3: Conditional
Job1 → (Success?) → Job2
                 └→ (Fail) → Notification
```

**Event-Driven Workflows**:
- Trigger from S3 events (via EventBridge)
- Schedule-based triggers
- On-demand via API/Console
- Conditional based on job status

## Glue Security

### Authentication and Authorization

**IAM Policies**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "glue:GetTable",
        "glue:GetDatabase",
        "glue:CreateTable"
      ],
      "Resource": "*"
    }
  ]
}
```

**Resource Policies**:
- Control access to Data Catalog
- Cross-account sharing
- Fine-grained permissions

**Service Role**:
- Glue needs IAM role to access resources
- Access to S3, CloudWatch Logs
- VPC network access if needed
- KMS keys for encryption

### Encryption

**Data Catalog Encryption**:
- Encrypt metadata at rest
- Use AWS managed or customer managed KMS key
- Encrypts table definitions, partition info

**ETL Job Encryption**:
- **At Rest**: 
  - S3 encryption (SSE-S3, SSE-KMS)
  - CloudWatch Logs encryption
  - Job bookmark encryption
- **In Transit**: 
  - TLS for data transfers
  - SSL for JDBC connections

**Security Configuration**:
```yaml
Security Configuration:
  S3 Encryption:
    - Mode: SSE-KMS
    - KMS Key: arn:aws:kms:...
  CloudWatch Logs Encryption:
    - Enabled: true
    - KMS Key: arn:aws:kms:...
  Job Bookmark Encryption:
    - Enabled: true
    - KMS Key: arn:aws:kms:...
```

### Network Security

**VPC Support**:
- Run Glue jobs in VPC
- Access VPC resources (RDS, Redshift)
- Use private subnets with NAT
- Security groups control traffic
- Elastic Network Interfaces (ENIs) created

**VPC Configuration**:
```yaml
Connection:
  - Connection Type: Network
  - VPC: vpc-xxxxx
  - Subnet: subnet-xxxxx
  - Security Groups: sg-xxxxx
  - Availability Zone: us-east-1a
```

## Performance Optimization

### DPU Allocation

**Understanding DPUs**:
- Data Processing Unit = 4 vCPU + 16 GB memory
- Minimum: 2 DPUs (Spark jobs)
- Maximum: 100 DPUs
- Auto Scaling: 2-100 DPUs

**Right-Sizing**:
- Monitor job metrics in CloudWatch
- Check executor utilization
- Adjust based on data volume
- Use Auto Scaling for variable workloads

### Job Optimization Techniques

**Partitioning**:
```python
# Write with partitioning
datasink = glueContext.write_dynamic_frame.from_options(
    frame=transformed,
    connection_type="s3",
    connection_options={
        "path": "s3://bucket/output/",
        "partitionKeys": ["year", "month", "day"]
    },
    format="parquet"
)
```

**Pushdown Predicates**:
```python
# Filter at source (reduce data read)
datasource = glueContext.create_dynamic_frame.from_catalog(
    database="mydb",
    table_name="mytable",
    push_down_predicate="year=2024 and month=1"
)
```

**File Format Optimization**:
- Use columnar formats (Parquet, ORC)
- Enable compression (Snappy, GZIP)
- Optimize file sizes (128 MB - 1 GB)
- Combine small files

**Broadcast Joins**:
```python
# For small lookup tables
from pyspark.sql.functions import broadcast
result = large_df.join(broadcast(small_df), "id")
```

### Glue 2.0, 3.0, 4.0 Features

**Glue 2.0**:
- Faster startup time (< 1 minute)
- Job bookmarks for Spark Structured Streaming
- Built-in job profiling

**Glue 3.0**:
- Spark 3.1 support
- Better performance
- Upgraded libraries

**Glue 4.0**:
- Spark 3.3 support
- Python 3.10
- Improved auto-scaling
- Better cost optimization
- Enhanced monitoring

## Monitoring and Troubleshooting

### CloudWatch Metrics

**Job Metrics**:
- `glue.driver.aggregate.numCompletedTasks`
- `glue.driver.aggregate.numFailedTasks`
- `glue.driver.ExecutorAllocationManager.executors.numberAllExecutors`
- `glue.driver.system.cpuUtilization`
- `glue.driver.jvm.heap.usage`

**Crawler Metrics**:
- Tables created/updated
- Partitions added
- Crawler duration

### Continuous Logging

**Enable Continuous Logging**:
```python
# Job parameter
--enable-continuous-cloudwatch-log true

# More frequent log uploads
--continuous-log-logGroup /aws-glue/jobs/
```

**Log Analysis**:
- Check for errors and exceptions
- Monitor memory usage
- Identify slow stages
- Debug data issues

### Common Issues

**Out of Memory**:
- Increase DPU count
- Partition data better
- Use broadcast for small tables
- Adjust shuffle partitions

**Slow Performance**:
- Check data skew
- Optimize file formats
- Use pushdown predicates
- Enable job bookmarks

**Schema Errors**:
- Review crawler configuration
- Check custom classifiers
- Verify data quality
- Update table manually if needed

## Cost Optimization

### Pricing Model

**Glue Jobs**:
- Charged per second (10-minute minimum)
- DPU-hour rate
- Different rates for Glue versions

**Glue Crawlers**:
- Charged per second (10-minute minimum)
- DPU-hour rate

**Glue Data Catalog**:
- First 1 million objects: Free
- $1 per 100,000 objects/month
- First 1 million requests: Free
- $0.00001 per request after

### Cost Reduction Strategies

**Job Optimization**:
- Use job bookmarks (incremental processing)
- Right-size DPU allocation
- Use Auto Scaling
- Schedule during off-peak hours
- Use Python Shell for simple tasks

**Crawler Optimization**:
- Schedule appropriately (not too frequent)
- Use sample percentage
- Exclude unnecessary folders
- Use partition projection instead of crawling

**Development Practices**:
- Use development endpoints judiciously
- Clean up unused resources
- Use Glue Studio for faster development
- Test with small datasets first

## Integration Patterns

### Data Lake Architecture

```
Data Sources → S3 Raw → Glue Crawler → Data Catalog
                   ↓
              Glue ETL Jobs
                   ↓
         S3 Processed (Parquet)
                   ↓
         Athena / Redshift Spectrum / EMR
```

### Real-Time Processing

```
Kinesis Data Streams → Glue Streaming Job → S3 / Redshift
                                          ↓
                                   Data Catalog
```

### Data Warehouse Loading

```
S3 Data → Glue ETL → Redshift (COPY)
                  ↓
            Glue Data Catalog
```

### Cross-Account Data Sharing

```
Account A                    Account B
Data Catalog → Resource Policy → Athena Query
    ↓
S3 Bucket → Bucket Policy → Read Access
```

## Best Practices for SAP-C02

### Design Patterns

1. **Incremental Processing**
   - Always enable job bookmarks
   - Use watermarks for streaming
   - Track processed files explicitly

2. **Schema Management**
   - Version schemas in Data Catalog
   - Handle schema evolution gracefully
   - Use schema validation

3. **Error Handling**
   - Implement retry logic
   - Use DLQ for failed records
   - Monitor and alert on failures

4. **Data Quality**
   - Use Glue DataBrew for profiling
   - Implement validation rules
   - Handle null and missing values

5. **Security**
   - Encrypt at rest and in transit
   - Use least privilege IAM policies
   - Enable Data Catalog encryption
   - Use VPC for sensitive data

### Common Exam Scenarios

**Scenario 1**: Automated Data Lake Ingestion
- **Solution**: S3 → EventBridge → Glue Crawler → Data Catalog → Glue ETL → Processed S3

**Scenario 2**: Schema Discovery for Various Formats
- **Solution**: Use Glue Crawlers with custom classifiers, schedule appropriately

**Scenario 3**: Cost-Effective ETL for Large Datasets
- **Solution**: Use Parquet, partitioning, job bookmarks, Auto Scaling DPUs

**Scenario 4**: Cross-Account Data Catalog Access
- **Solution**: Resource policies on Data Catalog, IAM roles in target account

**Scenario 5**: Real-Time ETL from Streams
- **Solution**: Glue Streaming jobs with Kinesis Data Streams source

## Glue vs Other ETL Services

| Feature | AWS Glue | EMR | Lambda | Step Functions + Lambda |
|---------|----------|-----|--------|------------------------|
| **Management** | Fully managed | Managed clusters | Serverless | Serverless |
| **Scale** | Auto-scaling | Manual/Auto | 15 min limit | Orchestrated |
| **Cost** | Per DPU-hour | Per instance-hour | Per invocation | Per state transition |
| **Use Case** | ETL, Data Catalog | Big data, custom frameworks | Simple transforms | Workflow orchestration |
| **Learning Curve** | Medium | High | Low | Low |
| **Setup Time** | Minimal | Moderate | Minimal | Minimal |

## Quick Reference

### Key Commands

**AWS CLI**:
```bash
# Create database
aws glue create-database --database-input "{\"Name\":\"mydb\"}"

# Start crawler
aws glue start-crawler --name my-crawler

# Start job run
aws glue start-job-run --job-name my-job

# Get tables
aws glue get-tables --database-name mydb

# Get job run status
aws glue get-job-run --job-name my-job --run-id jr_xxx
```

**Python (Boto3)**:
```python
import boto3

glue = boto3.client('glue')

# Create table
glue.create_table(
    DatabaseName='mydb',
    TableInput={
        'Name': 'mytable',
        'StorageDescriptor': {
            'Columns': [
                {'Name': 'id', 'Type': 'int'},
                {'Name': 'name', 'Type': 'string'}
            ],
            'Location': 's3://bucket/path/'
        }
    }
)

# Start crawler
glue.start_crawler(Name='my-crawler')
```

### Important Limits

- Max DPUs per job: 100
- Max concurrent job runs per account: 50 (adjustable)
- Max timeout per job: 48 hours
- Max job bookmarks per account: 20,000
- Max tables in Data Catalog: Unlimited (pricing applies)
- Crawler DPU: 2-256 DPUs

### Exam Tips

1. **Glue is for ETL**: When you see "serverless ETL" or "data catalog", think Glue
2. **Schema Discovery**: Crawlers automatically infer schemas
3. **Integration**: Glue Data Catalog integrates with Athena, EMR, Redshift Spectrum
4. **Job Bookmarks**: Enable for incremental processing
5. **Cost**: Consider crawler frequency and job DPU allocation
6. **VPC**: Can run in VPC to access private resources
7. **Partitioning**: Key for performance optimization
8. **File Formats**: Prefer Parquet/ORC for analytics
9. **Cross-Account**: Use resource policies for Data Catalog sharing
10. **Monitoring**: CloudWatch for metrics, continuous logging for debugging

## Summary

AWS Glue is the go-to serverless ETL service for:
- Building data lakes on S3
- Creating centralized data catalogs
- Running large-scale data transformations
- Integrating data from multiple sources
- Enabling analytics with Athena, Redshift Spectrum, EMR

Key strengths: Serverless, auto-scaling, integrated data catalog, visual ETL tools, cost-effective for variable workloads.
