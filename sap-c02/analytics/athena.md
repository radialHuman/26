# Amazon Athena

## What is Amazon Athena?

Amazon Athena is an interactive query service that makes it easy to analyze data directly in Amazon S3 using standard SQL. It's serverless, so there's no infrastructure to manage, and you pay only for the queries you run. Think of Athena as a SQL interface for your S3 data lake.

## Why Use Amazon Athena?

### Key Benefits
- **Serverless**: No infrastructure to provision or manage
- **Pay-per-Query**: Only pay for queries executed (data scanned)
- **Standard SQL**: Uses Presto and Trino query engines
- **Fast**: Query results in seconds using parallel execution
- **Integrated**: Works with AWS Glue Data Catalog
- **Flexible**: Query CSV, JSON, Parquet, ORC, Avro, and more
- **No ETL**: Query data in place without loading it

### Use Cases
- Ad-hoc analysis of S3 data
- Log analysis (VPC Flow Logs, CloudTrail, ALB logs)
- Business intelligence and reporting
- Data lake queries
- Federated queries across multiple data sources
- Cost analysis of AWS usage (CUR data)
- Click-stream analysis
- IoT data analysis

## How Athena Works

### Basic Workflow
1. **Store data in S3** (any format)
2. **Define schema** (via Glue Data Catalog or DDL)
3. **Run SQL queries** (SELECT statements)
4. **Get results** (in S3 or view in console)

### Architecture
```
S3 Data → Glue Data Catalog (Schema) → Athena (SQL Query) → Results (S3)
                                              ↓
                                      Query History & Logs
```

### Query Execution
- Athena uses distributed query processing
- Multiple nodes execute queries in parallel
- Results cached for repeat queries
- Automatic retry on failures
- Query timeout: 30 minutes

## Core Concepts

### Data Sources

**S3 as Primary Storage**:
- Data stored in S3 buckets
- No data movement required
- Support for nested folders
- Partition pruning for performance

**Supported Formats**:
- **Structured**: CSV, TSV, JSON
- **Semi-Structured**: JSON, Ion
- **Columnar**: Parquet, ORC (recommended)
- **Compressed**: GZIP, SNAPPY, ZLIB, LZO, BZIP2

**Best Formats for Performance**:
1. Parquet (best compression and query performance)
2. ORC (good for ACID transactions)
3. Avro (good for schema evolution)

### Tables and Databases

**Creating Tables**:

**Option 1: DDL (Data Definition Language)**:
```sql
CREATE EXTERNAL TABLE IF NOT EXISTS mydatabase.mytable (
  id INT,
  name STRING,
  timestamp TIMESTAMP,
  amount DECIMAL(10,2)
)
PARTITIONED BY (year INT, month INT, day INT)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS PARQUET
LOCATION 's3://mybucket/data/'
TBLPROPERTIES ('has_encrypted_data'='true');
```

**Option 2: Glue Crawler**:
- Automatically discovers schema
- Creates/updates tables in Glue Data Catalog
- Handles partitions

**Option 3: AWS Glue Console**:
- Manual table creation via GUI

### Partitioning

**What is Partitioning?**
- Divide table into segments based on column values
- Reduces data scanned = lower cost
- Improves query performance significantly

**Partition Structure**:
```
s3://bucket/data/
├── year=2024/
│   ├── month=01/
│   │   ├── day=01/
│   │   │   └── data.parquet
│   │   └── day=02/
│   │       └── data.parquet
│   └── month=02/
│       └── day=01/
│           └── data.parquet
```

**Creating Partitioned Tables**:
```sql
-- Create table with partitions
CREATE EXTERNAL TABLE logs (
  request_id STRING,
  ip STRING,
  status INT
)
PARTITIONED BY (year INT, month INT, day INT)
STORED AS PARQUET
LOCATION 's3://mybucket/logs/';

-- Add partition manually
ALTER TABLE logs ADD PARTITION (year=2024, month=1, day=15)
LOCATION 's3://mybucket/logs/year=2024/month=01/day=15/';

-- Load partitions automatically
MSCK REPAIR TABLE logs;
```

**Partition Projection**:
- Eliminates need for loading partitions
- Athena automatically constructs partition locations
- Much faster than MSCK REPAIR TABLE

```sql
CREATE EXTERNAL TABLE logs (
  request_id STRING,
  ip STRING
)
PARTITIONED BY (dt STRING)
LOCATION 's3://mybucket/logs/'
TBLPROPERTIES (
  "projection.enabled" = "true",
  "projection.dt.type" = "date",
  "projection.dt.range" = "2024-01-01,NOW",
  "projection.dt.format" = "yyyy-MM-dd",
  "projection.dt.interval" = "1",
  "projection.dt.interval.unit" = "DAYS",
  "storage.location.template" = "s3://mybucket/logs/dt=${dt}"
);
```

### Glue Data Catalog Integration

**Benefits**:
- Central metadata repository
- Schema versioning
- Cross-service access (Athena, EMR, Redshift Spectrum)
- Automatic partition discovery

**Catalog Structure**:
```
Data Catalog
└── Database: mydb
    ├── Table: orders
    │   ├── Columns (schema)
    │   ├── Partitions
    │   └── Properties
    └── Table: customers
```

## Query Optimization

### Reduce Data Scanned

**1. Use Partitioning**:
```sql
-- Good: Scans only specific partition
SELECT * FROM logs
WHERE year = 2024 AND month = 1 AND day = 15;

-- Bad: Scans entire dataset
SELECT * FROM logs
WHERE timestamp > '2024-01-15';
```

**2. Use Columnar Formats**:
- Parquet and ORC only read required columns
- 30-90% reduction in data scanned vs CSV

**3. Compress Data**:
- Reduces data scanned
- Lower S3 storage cost
- Faster data transfer

**4. Optimize File Sizes**:
- Ideal: 128 MB - 1 GB per file
- Too small: Overhead from many S3 requests
- Too large: Reduced parallelism

**5. Use SELECT Specific Columns**:
```sql
-- Good: Only scans needed columns
SELECT name, age FROM users;

-- Bad: Scans all columns
SELECT * FROM users;
```

### Query Performance Best Practices

**1. Filter Early**:
```sql
-- Good
WITH filtered AS (
  SELECT * FROM large_table WHERE date = '2024-01-01'
)
SELECT COUNT(*) FROM filtered;

-- Bad
SELECT COUNT(*) FROM large_table WHERE date = '2024-01-01';
```

**2. Use Approximate Functions**:
```sql
-- For large datasets, approximations are faster
SELECT approx_distinct(user_id) FROM logs;  -- vs COUNT(DISTINCT user_id)
SELECT approx_percentile(response_time, 0.95) FROM logs;
```

**3. Optimize JOINs**:
```sql
-- Put large table first, small table second
SELECT * 
FROM large_table l
JOIN small_table s ON l.id = s.id;

-- Use BROADCAST hint for small tables
SELECT *
FROM large_table l
JOIN small_table s ON l.id = s.id
WHERE s.category = 'active';
```

**4. Use CTAS for Repeated Queries**:
```sql
-- Create Table As Select (materialized view pattern)
CREATE TABLE optimized_results
WITH (
  format = 'PARQUET',
  parquet_compression = 'SNAPPY',
  partitioned_by = ARRAY['year', 'month']
) AS
SELECT * FROM raw_data
WHERE date >= DATE '2024-01-01';
```

## Advanced Features

### Federated Queries

**What is it?**
- Query data across multiple data sources
- Combine S3 data with RDS, Redshift, DynamoDB
- Use Lambda-based data source connectors

**Data Source Connectors**:
- Amazon RDS (MySQL, PostgreSQL)
- Amazon Redshift
- Amazon DynamoDB
- Amazon DocumentDB
- Amazon CloudWatch Logs
- On-premises databases (via VPC)
- Custom connectors (Lambda)

**Example**:
```sql
-- Join S3 data with RDS data
SELECT s.product_name, r.inventory_count
FROM s3_catalog.sales s
JOIN rds_catalog.inventory r ON s.product_id = r.product_id
WHERE s.sale_date = '2024-01-15';
```

**Setup**:
1. Deploy Lambda connector (from AWS Serverless Application Repository)
2. Create data source in Athena
3. Query using catalog.schema.table syntax

### User Defined Functions (UDFs)

**Purpose**: Custom functions for complex transformations

**Example**:
```sql
-- UDF using Lambda
USING EXTERNAL FUNCTION decode_user_agent(ua VARCHAR)
RETURNS VARCHAR
LAMBDA 'arn:aws:lambda:us-east-1:123456789012:function:DecodeUserAgent'

SELECT request_id, decode_user_agent(user_agent) AS browser
FROM web_logs;
```

**Use Cases**:
- Custom data encryption/decryption
- Complex string parsing
- External API calls
- Machine learning inference

### Parameterized Queries

**Prevent SQL Injection**:
```sql
-- Using prepared statements (via JDBC)
PREPARE statement FROM
SELECT * FROM users WHERE user_id = ?;

EXECUTE statement USING 123;
```

### Workgroups

**What are Workgroups?**
- Isolate queries and manage costs
- Apply query limits and data limits
- Control access via IAM
- Separate billing and tracking

**Workgroup Configuration**:
```yaml
Workgroup Name: analytics-team
Settings:
  Query Results Location: s3://results-bucket/analytics/
  Encryption: SSE-KMS
  Per Query Data Limit: 10 GB
  Enforce Workgroup Configuration: true
  Query Timeout: 30 minutes
  Publish CloudWatch Metrics: true
```

**Benefits**:
- Cost control per team/project
- Security isolation
- Performance tracking
- Different output locations

### Query Result Reuse

**Automatic Caching**:
- Athena caches query results for 7 days
- Rerunning identical queries returns cached results
- No charge for cached results
- Only works if data hasn't changed

**Manual Result Reuse**:
```sql
-- Save results as new table
CREATE TABLE cached_results AS
SELECT * FROM expensive_query;

-- Query cached table
SELECT * FROM cached_results WHERE ...;
```

## Security

### Encryption

**At Rest**:
- **S3 Encryption**: SSE-S3, SSE-KMS, CSE-KMS
- **Query Results**: Encrypted in S3
- **Glue Data Catalog**: Encryption enabled

**In Transit**:
- TLS for all data transfer
- HTTPS API calls

**Configuration**:
```yaml
Workgroup Settings:
  Encryption:
    Encrypt Query Results: true
    Type: SSE_KMS
    KMS Key: arn:aws:kms:region:account:key/key-id
```

### Access Control

**IAM Policies**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "athena:StartQueryExecution",
        "athena:GetQueryExecution",
        "athena:GetQueryResults"
      ],
      "Resource": "arn:aws:athena:*:*:workgroup/analytics-team"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::data-bucket/*",
        "arn:aws:s3:::results-bucket/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "glue:GetDatabase",
        "glue:GetTable",
        "glue:GetPartitions"
      ],
      "Resource": "*"
    }
  ]
}
```

**Lake Formation Integration**:
- Fine-grained access control
- Column-level security
- Row-level security
- Data filtering

### VPC Endpoints

**Private Connectivity**:
- Access Athena without internet gateway
- Keep traffic within AWS network
- Use with S3 VPC endpoints for complete privacy

## Monitoring and Troubleshooting

### CloudWatch Metrics

**Workgroup Metrics**:
- `DataScannedInBytes`: Amount of data scanned
- `EngineExecutionTime`: Query execution time
- `QueryPlanningTime`: Time to plan query
- `QueryQueueTime`: Time waiting in queue
- `ServiceProcessingTime`: Athena service overhead
- `TotalExecutionTime`: End-to-end time

**Custom Metrics**:
- Publish via workgroup settings
- Monitor per-query performance
- Set alarms on thresholds

### Query History

**Available Information**:
- Query text
- Execution time
- Data scanned
- Status (Succeeded, Failed, Cancelled)
- Error messages
- Query results location

**Best Practices**:
- Review failed queries regularly
- Analyze slow queries
- Optimize high-cost queries

### Common Issues

**1. Too Much Data Scanned**:
- Solution: Add partitions, use columnar formats, filter early

**2. Query Timeout**:
- Solution: Optimize query, break into smaller queries, increase timeout

**3. Insufficient Permissions**:
- Solution: Check IAM policies, S3 bucket policies, Glue permissions

**4. Data Type Mismatch**:
- Solution: Cast data types explicitly, update table schema

**5. Partition Not Found**:
- Solution: Run MSCK REPAIR TABLE or use partition projection

## Cost Optimization

### Pricing Model
- **Standard Queries**: $5 per TB of data scanned
- **Federated Queries**: $5 per TB + Lambda costs
- **DDL Statements**: Free (CREATE, ALTER, DROP)
- **Failed Queries**: No charge

### Cost Reduction Strategies

**1. Use Partitioning**:
- Can reduce data scanned by 90%+
- Example: 1 TB query → 10 GB with partitions
- Cost: $5 → $0.05

**2. Convert to Columnar Format**:
```sql
-- Convert CSV to Parquet
CREATE TABLE optimized_data
WITH (
  format = 'PARQUET',
  parquet_compression = 'SNAPPY'
) AS
SELECT * FROM csv_data;
```
- 30-90% reduction in data scanned

**3. Compress Data**:
- Snappy compression for Parquet (good balance)
- GZIP for higher compression ratio

**4. Limit Query Results**:
```sql
-- Add LIMIT for testing
SELECT * FROM large_table LIMIT 10;

-- Use data limit in workgroup
```

**5. Use Query Result Reuse**:
- Cached results are free
- Good for dashboards and reports

**6. Monitor and Alert**:
- Set CloudWatch alarms on DataScanned
- Use AWS Budgets for cost alerts

## Integration Patterns

### BI Tools Integration

**Amazon QuickSight**:
```
Athena ← QuickSight (Direct Query or SPICE)
```
- Direct query for real-time data
- SPICE import for faster dashboards

**Tableau, Power BI**:
- Use JDBC/ODBC drivers
- Connect via Athena endpoints
- Apply visualizations

### Data Lake Analytics

```
S3 Data Lake
    ↓
Glue Crawler (Schema Discovery)
    ↓
Glue Data Catalog
    ↓
Athena (SQL Queries)
    ↓
QuickSight / BI Tools
```

### Log Analysis Pipeline

```
CloudTrail / VPC Flow Logs / ALB Logs → S3
    ↓
Athena (SQL Analysis)
    ↓
CloudWatch Logs Insights or QuickSight
```

### ETL Pattern with Glue

```
Raw S3 Data → Athena (Query) → CTAS → Processed S3 (Parquet)
                                          ↓
                                     Glue Catalog
                                          ↓
                                   Analytics Tools
```

## Best Practices for SAP-C02

### Design Principles

1. **Partition Aggressively**
   - Use time-based partitions (year/month/day)
   - Add business-relevant partitions (region, product)
   - Use partition projection for dynamic partitions

2. **Choose Right File Format**
   - Parquet for analytics workloads
   - ORC for high compression needs
   - Avro for schema evolution

3. **Optimize File Sizes**
   - Combine small files (> 128 MB ideal)
   - Split very large files (< 1 GB ideal)
   - Use S3 batch operations or Glue for compaction

4. **Security First**
   - Encrypt data at rest and in transit
   - Use Lake Formation for fine-grained access
   - Separate workgroups for different teams
   - Enable CloudTrail logging

5. **Cost Management**
   - Monitor data scanned metrics
   - Set workgroup data limits
   - Educate users on optimization
   - Use Savings Plans for predictable workloads

### Common Exam Scenarios

**Scenario 1**: Low-Cost Log Analysis
- **Solution**: Store logs in S3, partition by date, query with Athena, use Parquet format

**Scenario 2**: Querying Data Across S3 and RDS
- **Solution**: Use Athena Federated Queries with data source connectors

**Scenario 3**: Reducing Query Costs
- **Solution**: Implement partitioning, convert to Parquet, add workgroup data limits

**Scenario 4**: Real-Time BI Dashboard
- **Solution**: Athena + QuickSight with SPICE for caching, scheduled refresh

**Scenario 5**: Secure Multi-Team Access
- **Solution**: Separate workgroups, Lake Formation permissions, IAM policies

## Athena vs Other Services

| Feature | Athena | Redshift | EMR | Glue |
|---------|--------|----------|-----|------|
| **Management** | Serverless | Managed cluster | Managed cluster | Serverless |
| **Use Case** | Ad-hoc queries | Data warehouse | Big data processing | ETL |
| **Pricing** | Per query | Per hour | Per instance-hour | Per DPU-hour |
| **Startup** | Instant | Minutes | Minutes | < 1 minute |
| **SQL Support** | ANSI SQL | PostgreSQL SQL | Spark SQL, Hive | Spark SQL |
| **Best For** | Infrequent queries | Complex analytics | Custom processing | Data transformation |

## Quick Reference

### Common SQL Commands

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS mydb;

-- Create table from S3 data
CREATE EXTERNAL TABLE mydb.logs (
  timestamp STRING,
  level STRING,
  message STRING
)
ROW FORMAT SERDE 'org.openx.data.jsonserde.JsonSerDe'
LOCATION 's3://mybucket/logs/';

-- Query with partition pruning
SELECT COUNT(*) FROM logs
WHERE year = 2024 AND month = 1;

-- Create optimized table
CREATE TABLE optimized_logs
WITH (
  format = 'PARQUET',
  parquet_compression = 'SNAPPY',
  partitioned_by = ARRAY['year', 'month']
) AS
SELECT * FROM logs;

-- Analyze table statistics
ANALYZE TABLE mydb.logs COMPUTE STATISTICS;

-- Repair partitions
MSCK REPAIR TABLE mydb.logs;

-- Drop table
DROP TABLE mydb.logs;
```

### Important Limits

- Max query string length: 262,144 bytes
- Max concurrent queries per workgroup: 20 (adjustable)
- Max query execution time: 30 minutes
- Max DDL query execution time: 600 minutes
- Max number of partitions: 20,000 per table (soft limit)
- Query result retention: 45 days (or until manually deleted)

### Exam Tips

1. **Athena is serverless**: No clusters to manage, instant queries
2. **Pricing by data scanned**: Optimize with partitions and Parquet
3. **Glue Data Catalog**: Central schema repository for Athena
4. **Federated queries**: Query across S3, RDS, Redshift, DynamoDB
5. **Partitioning**: Most important cost and performance optimization
6. **Parquet/ORC**: Columnar formats reduce data scanned by 30-90%
7. **Workgroups**: Isolate teams, control costs, manage access
8. **No ETL required**: Query data in place on S3
9. **Use CTAS**: Create optimized tables from query results
10. **Lake Formation**: Fine-grained security for Athena queries

## Summary

Amazon Athena is the go-to serverless query service for:
- Ad-hoc analysis of S3 data
- Log analysis without infrastructure
- Data lake queries using SQL
- Cross-source federated queries
- Cost-effective analytics for variable workloads

Key strengths: Serverless, pay-per-query, standard SQL, integrated with Glue Data Catalog, fast interactive queries, no data movement required.
