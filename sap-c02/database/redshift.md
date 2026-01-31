# Amazon Redshift

## What is Redshift?

Amazon Redshift is a fully managed, petabyte-scale data warehouse service optimized for online analytical processing (OLAP) and business intelligence workloads. It uses columnar storage, massively parallel processing (MPP), and advanced compression to deliver fast query performance.

## Why Use Redshift?

### Key Benefits
- **Petabyte Scale**: Store and analyze petabytes of data
- **Fast Queries**: 10x faster than traditional data warehouses
- **Cost-Effective**: $1,000/TB/year (10x cheaper than traditional)
- **Fully Managed**: Automated provisioning, backups, patches
- **SQL Compatible**: Standard SQL, JDBC/ODBC drivers
- **Integrated**: Works with S3, Glue, QuickSight, SageMaker

### Use Cases
- **Business Intelligence**: Analytics dashboards (QuickSight, Tableau)
- **Data Warehousing**: Central repository for analytics
- **Log Analysis**: Analyze application/system logs
- **Predictive Analytics**: ML training data preparation
- **ETL/ELT**: Extract, transform, load data pipelines

## Architecture

### Node Types

**RA3 Nodes** (Recommended):
```
ra3.xlplus: 4 vCPU, 32 GB RAM, 32 TB managed storage
ra3.4xlarge: 12 vCPU, 96 GB RAM, 128 TB managed storage
ra3.16xlarge: 48 vCPU, 384 GB RAM, 128 TB managed storage

Features:
  - Managed storage (separate from compute)
  - Automatic data tiering to S3
  - Scale compute and storage independently
  - Redshift Spectrum included
```

**DC2 Nodes** (Legacy):
```
dc2.large: 2 vCPU, 15 GB RAM, 160 GB SSD
dc2.8xlarge: 32 vCPU, 244 GB RAM, 2.56 TB SSD

Features:
  - Local SSD storage
  - Compute and storage coupled
  - Lower cost for <1 TB datasets
```

### Cluster Configuration

**Single-Node** (Development):
```
1 node: dc2.large or dc2.8xlarge
Use: Development, testing, small datasets
Limitation: No HA, no resize
```

**Multi-Node** (Production):
```
1 leader node + 1-128 compute nodes
Leader: Query planning, coordination
Compute: Data storage, query execution
Use: Production, HA, scalability
```

## Creating Redshift Cluster

```python
import boto3

redshift = boto3.client('redshift')

# Create subnet group
subnet_group = redshift.create_cluster_subnet_group(
    ClusterSubnetGroupName='my-redshift-subnet-group',
    Description='Redshift subnet group',
    SubnetIds=[
        'subnet-12345678',
        'subnet-87654321',
        'subnet-abcdef12'
    ],
    Tags=[
        {'Key': 'Name', 'Value': 'redshift-subnets'}
    ]
)

# Create cluster parameter group
param_group = redshift.create_cluster_parameter_group(
    ParameterGroupName='my-redshift-params',
    ParameterGroupFamily='redshift-1.0',
    Description='Custom Redshift parameters',
    Tags=[
        {'Key': 'Name', 'Value': 'redshift-params'}
    ]
)

# Modify parameters
redshift.modify_cluster_parameter_group(
    ParameterGroupName='my-redshift-params',
    Parameters=[
        {
            'ParameterName': 'enable_user_activity_logging',
            'ParameterValue': 'true'
        },
        {
            'ParameterName': 'max_cursor_result_set_size',
            'ParameterValue': '10000'
        }
    ]
)

# Create cluster
cluster = redshift.create_cluster(
    ClusterIdentifier='my-redshift-cluster',
    NodeType='ra3.xlplus',
    NumberOfNodes=2,  # 1 leader + 1 compute (minimum for multi-node)
    DBName='analytics',
    MasterUsername='admin',
    MasterUserPassword='SecurePassword123!',
    ClusterType='multi-node',
    ClusterSubnetGroupName='my-redshift-subnet-group',
    VpcSecurityGroupIds=['sg-12345678'],
    ClusterParameterGroupName='my-redshift-params',
    Port=5439,
    PubliclyAccessible=False,
    Encrypted=True,
    KmsKeyId='arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    AutomatedSnapshotRetentionPeriod=7,  # Days
    PreferredMaintenanceWindow='sun:03:00-sun:04:00',
    AvailabilityZone='us-east-1a',
    IamRoles=[
        'arn:aws:iam::123456789012:role/RedshiftS3AccessRole'
    ],
    Tags=[
        {'Key': 'Name', 'Value': 'production-redshift'},
        {'Key': 'Environment', 'Value': 'production'}
    ]
)

cluster_endpoint = cluster['Cluster']['Endpoint']['Address']
```

## Connecting to Redshift

### Using psql (PostgreSQL client)

```bash
# Install psql
sudo apt-get install postgresql-client

# Connect
psql -h my-redshift-cluster.xxxxx.us-east-1.redshift.amazonaws.com \
     -p 5439 \
     -U admin \
     -d analytics
```

### Using Python (psycopg2)

```python
import psycopg2

# Connect to Redshift
conn = psycopg2.connect(
    host='my-redshift-cluster.xxxxx.us-east-1.redshift.amazonaws.com',
    port=5439,
    database='analytics',
    user='admin',
    password='SecurePassword123!'
)

cursor = conn.cursor()

# Execute query
cursor.execute("SELECT COUNT(*) FROM users")
result = cursor.fetchone()
print(f"Total users: {result[0]}")

cursor.close()
conn.close()
```

### Using IAM Authentication

```python
import boto3
import psycopg2

# Get temporary credentials
redshift_client = boto3.client('redshift')

credentials = redshift_client.get_cluster_credentials(
    ClusterIdentifier='my-redshift-cluster',
    DbUser='admin',
    DbName='analytics',
    DurationSeconds=3600  # 1 hour
)

# Connect with IAM
conn = psycopg2.connect(
    host='my-redshift-cluster.xxxxx.us-east-1.redshift.amazonaws.com',
    port=5439,
    database='analytics',
    user=credentials['DbUser'],
    password=credentials['DbPassword']
)
```

## Data Loading

### COPY from S3

**Most efficient method** for bulk loading:

```sql
COPY users
FROM 's3://my-bucket/data/users/'
IAM_ROLE 'arn:aws:iam::123456789012:role/RedshiftS3AccessRole'
FORMAT AS CSV
DELIMITER ','
IGNOREHEADER 1
REGION 'us-east-1'
MAXERROR 100
COMPUPDATE ON
STATUPDATE ON;
```

**COPY from Parquet**:
```sql
COPY sales
FROM 's3://my-bucket/data/sales.parquet'
IAM_ROLE 'arn:aws:iam::123456789012:role/RedshiftS3AccessRole'
FORMAT AS PARQUET;
```

**COPY with Manifest** (specific files):
```sql
-- manifest.json
{
  "entries": [
    {"url": "s3://my-bucket/data/part1.csv", "mandatory": true},
    {"url": "s3://my-bucket/data/part2.csv", "mandatory": true}
  ]
}

COPY orders
FROM 's3://my-bucket/data/manifest.json'
IAM_ROLE 'arn:aws:iam::123456789012:role/RedshiftS3AccessRole'
MANIFEST
FORMAT AS CSV;
```

**COPY with Compression**:
```sql
COPY logs
FROM 's3://my-bucket/logs/'
IAM_ROLE 'arn:aws:iam::123456789012:role/RedshiftS3AccessRole'
GZIP
FORMAT AS JSON 'auto';
```

### COPY from DynamoDB

```sql
COPY products
FROM 'dynamodb://ProductTable'
IAM_ROLE 'arn:aws:iam::123456789012:role/RedshiftDynamoDBRole'
REGION 'us-east-1'
READRATIO 25;  -- Limit DynamoDB read capacity usage
```

### INSERT from SELECT

**Single row**:
```sql
INSERT INTO users (id, name, email)
VALUES (1, 'Alice', 'alice@example.com');
```

**Bulk insert**:
```sql
INSERT INTO user_summary (user_id, total_orders, total_amount)
SELECT user_id, COUNT(*), SUM(amount)
FROM orders
GROUP BY user_id;
```

## Table Design

### Distribution Styles

**KEY Distribution** (Co-location):
```sql
CREATE TABLE orders (
    order_id INT,
    user_id INT,
    amount DECIMAL(10,2),
    order_date DATE
)
DISTKEY(user_id)  -- Distribute by user_id
SORTKEY(order_date);  -- Sort by order_date

CREATE TABLE users (
    user_id INT,
    name VARCHAR(100),
    email VARCHAR(100)
)
DISTKEY(user_id);  -- Same distribution key for joins

-- JOIN is local (no redistribution)
SELECT o.order_id, u.name, o.amount
FROM orders o
JOIN users u ON o.user_id = u.user_id;
```

**ALL Distribution** (Replication):
```sql
CREATE TABLE dim_date (
    date DATE,
    day_of_week VARCHAR(10),
    month INT,
    year INT
)
DISTSTYLE ALL;  -- Copy to all nodes

-- No redistribution needed for JOINs
```

**EVEN Distribution** (Round-robin):
```sql
CREATE TABLE logs (
    log_id BIGINT,
    timestamp TIMESTAMP,
    message TEXT
)
DISTSTYLE EVEN;  -- Evenly distribute

-- Use when no clear distribution key
```

**AUTO Distribution** (Redshift chooses):
```sql
CREATE TABLE events (
    event_id BIGINT,
    user_id INT,
    event_type VARCHAR(50)
)
DISTSTYLE AUTO;  -- Redshift decides based on size

-- Small tables (<1 GB): ALL
-- Medium tables: KEY
-- Large tables: EVEN
```

### Sort Keys

**Single Sort Key**:
```sql
CREATE TABLE events (
    event_id BIGINT,
    user_id INT,
    timestamp TIMESTAMP
)
SORTKEY(timestamp);  -- Sort by timestamp

-- Efficient for range queries
SELECT * FROM events
WHERE timestamp BETWEEN '2024-01-01' AND '2024-01-31';
```

**Compound Sort Key** (Multiple columns):
```sql
CREATE TABLE sales (
    sale_id BIGINT,
    store_id INT,
    product_id INT,
    sale_date DATE
)
COMPOUND SORTKEY(store_id, sale_date);

-- Efficient when filtering on prefix
SELECT * FROM sales
WHERE store_id = 123
AND sale_date = '2024-01-15';
```

**Interleaved Sort Key** (Equal weight):
```sql
CREATE TABLE transactions (
    transaction_id BIGINT,
    user_id INT,
    merchant_id INT,
    timestamp TIMESTAMP
)
INTERLEAVED SORTKEY(user_id, merchant_id, timestamp);

-- Efficient for any combination
SELECT * FROM transactions WHERE user_id = 456;
SELECT * FROM transactions WHERE merchant_id = 789;
SELECT * FROM transactions WHERE timestamp > '2024-01-01';
```

### Compression Encoding

**Automatic**:
```sql
CREATE TABLE users (
    id INT ENCODE AZ64,       -- Automatic
    name VARCHAR(100) ENCODE LZO,
    email VARCHAR(100) ENCODE TEXT255,
    created_at TIMESTAMP ENCODE AZ64
);

-- Or let Redshift choose
COPY users FROM 's3://bucket/data'
IAM_ROLE '...'
COMPUPDATE ON;  -- Analyze and set compression
```

**Manual**:
```sql
CREATE TABLE products (
    id INT ENCODE DELTA,        -- Numeric delta
    category VARCHAR(50) ENCODE BYTEDICT,  -- Dictionary
    price DECIMAL(10,2) ENCODE ZSTD,  -- General compression
    description TEXT ENCODE LZO   -- Text compression
);
```

**Compression Types**:
```
AZ64: Automatic (recommended)
LZO: General compression
ZSTD: High compression ratio
BYTEDICT: Dictionary encoding (low cardinality)
DELTA: Numeric sequences
TEXT255/TEXT32K: Text compression
RAW: No compression
```

## Redshift Spectrum

**Concept**: Query data directly in S3 without loading

### Creating External Schema

```sql
-- Create external schema (Glue Data Catalog)
CREATE EXTERNAL SCHEMA spectrum_schema
FROM DATA CATALOG
DATABASE 'my_database'
IAM_ROLE 'arn:aws:iam::123456789012:role/RedshiftSpectrumRole'
CREATE EXTERNAL DATABASE IF NOT EXISTS;

-- Create external table
CREATE EXTERNAL TABLE spectrum_schema.sales_external (
    sale_id BIGINT,
    product_id INT,
    amount DECIMAL(10,2),
    sale_date DATE
)
STORED AS PARQUET
LOCATION 's3://my-bucket/sales/';

-- Query external data
SELECT product_id, SUM(amount) as total
FROM spectrum_schema.sales_external
WHERE sale_date >= '2024-01-01'
GROUP BY product_id;

-- Join external + internal tables
SELECT p.name, SUM(s.amount) as total_sales
FROM spectrum_schema.sales_external s
JOIN products p ON s.product_id = p.id
WHERE s.sale_date >= '2024-01-01'
GROUP BY p.name;
```

### Partitioning (Spectrum)

```sql
-- Create partitioned external table
CREATE EXTERNAL TABLE spectrum_schema.logs_external (
    log_id BIGINT,
    message TEXT,
    timestamp TIMESTAMP
)
PARTITIONED BY (year INT, month INT, day INT)
STORED AS PARQUET
LOCATION 's3://my-bucket/logs/';

-- Add partitions
ALTER TABLE spectrum_schema.logs_external
ADD PARTITION (year=2024, month=1, day=15)
LOCATION 's3://my-bucket/logs/year=2024/month=1/day=15/';

-- Query with partition pruning
SELECT COUNT(*)
FROM spectrum_schema.logs_external
WHERE year = 2024 AND month = 1 AND day = 15;
```

## Query Optimization

### EXPLAIN Plan

```sql
EXPLAIN
SELECT c.name, SUM(o.amount) as total
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_date >= '2024-01-01'
GROUP BY c.name
ORDER BY total DESC
LIMIT 10;

-- Output shows:
-- - Data redistribution (DS_BCAST_INNER, DS_DIST_BOTH)
-- - Sort operations
-- - Aggregate operations
-- - Estimated cost
```

### ANALYZE and VACUUM

**ANALYZE** (Update statistics):
```sql
-- Analyze specific table
ANALYZE users;

-- Analyze all tables
ANALYZE;

-- Update statistics for query planner
```

**VACUUM** (Reclaim space and sort):
```sql
-- Full vacuum
VACUUM;

-- Vacuum specific table
VACUUM DELETE ONLY sales;  -- Reclaim deleted space
VACUUM SORT ONLY sales;    -- Re-sort rows
VACUUM REINDEX sales;      -- Rebuild interleaved sort keys

-- Automatic vacuum (recommended)
-- Runs during maintenance window
```

### Materialized Views

```sql
-- Create materialized view
CREATE MATERIALIZED VIEW sales_summary AS
SELECT product_id, DATE_TRUNC('month', sale_date) as month, SUM(amount) as total
FROM sales
GROUP BY product_id, month;

-- Query materialized view (much faster)
SELECT * FROM sales_summary
WHERE month = '2024-01-01';

-- Refresh materialized view
REFRESH MATERIALIZED VIEW sales_summary;

-- Auto-refresh (preview)
CREATE MATERIALIZED VIEW sales_summary_auto
AUTO REFRESH YES
AS SELECT ...;
```

### Result Caching

**Automatic**: Results cached for 24 hours

```sql
-- First query: Executes
SELECT COUNT(*) FROM users;
-- Runtime: 5 seconds

-- Second query (within 24 hours): From cache
SELECT COUNT(*) FROM users;
-- Runtime: 0.01 seconds

-- Bypass cache
SELECT COUNT(*) FROM users
WHERE random() < 1;  -- Forces re-execution
```

## Workload Management (WLM)

### Query Queues

```python
# Configure WLM via parameter group
redshift.modify_cluster_parameter_group(
    ParameterGroupName='my-redshift-params',
    Parameters=[
        {
            'ParameterName': 'wlm_json_configuration',
            'ParameterValue': '''[
                {
                    "query_concurrency": 5,
                    "memory_percent_to_use": 40,
                    "query_group": "etl",
                    "user_group": ["etl_users"],
                    "query_group_wild_card": 0
                },
                {
                    "query_concurrency": 15,
                    "memory_percent_to_use": 40,
                    "query_group": "reporting",
                    "user_group": ["reporting_users"]
                },
                {
                    "query_concurrency": 1,
                    "memory_percent_to_use": 20,
                    "query_group": "admin"
                }
            ]'''
        }
    ]
)
```

**Using Query Groups**:
```sql
-- Set query group for session
SET query_group TO 'etl';

-- Run ETL query
COPY sales FROM 's3://bucket/data' ...;

-- Reset
RESET query_group;
```

### Automatic WLM

```python
# Enable automatic WLM (recommended)
redshift.modify_cluster_parameter_group(
    ParameterGroupName='my-redshift-params',
    Parameters=[
        {
            'ParameterName': 'wlm_json_configuration',
            'ParameterValue': '[{"auto_wlm": true}]'
        }
    ]
)
```

**Features**:
- Machine learning optimizes concurrency
- Dynamic memory allocation
- Query priorities (HIGHEST to LOWEST)

## Backups and Restore

### Automated Snapshots

```
Retention: 1-35 days
Frequency: Every 8 hours or 5 GB of changes
Storage: S3 (incremental)
```

**Configure Retention**:
```python
redshift.modify_cluster(
    ClusterIdentifier='my-redshift-cluster',
    AutomatedSnapshotRetentionPeriod=14  # Days
)
```

### Manual Snapshots

**Create Snapshot**:
```python
snapshot = redshift.create_cluster_snapshot(
    SnapshotIdentifier='my-snapshot-20240131',
    ClusterIdentifier='my-redshift-cluster',
    Tags=[
        {'Key': 'Purpose', 'Value': 'Pre-upgrade backup'}
    ]
)
```

**Restore from Snapshot**:
```python
restored_cluster = redshift.restore_from_cluster_snapshot(
    ClusterIdentifier='my-redshift-restored',
    SnapshotIdentifier='my-snapshot-20240131',
    NodeType='ra3.xlplus',
    NumberOfNodes=2,
    ClusterSubnetGroupName='my-redshift-subnet-group',
    PubliclyAccessible=False
)
```

**Cross-Region Copy**:
```python
# Enable cross-region snapshots
redshift.enable_snapshot_copy(
    ClusterIdentifier='my-redshift-cluster',
    DestinationRegion='us-west-2',
    RetentionPeriod=7,  # Days in destination region
    SnapshotCopyGrantName='my-snapshot-copy-grant'
)
```

## Monitoring

### CloudWatch Metrics

```python
cloudwatch = boto3.client('cloudwatch')

# Get CPU utilization
metrics = cloudwatch.get_metric_statistics(
    Namespace='AWS/Redshift',
    MetricName='CPUUtilization',
    Dimensions=[
        {'Name': 'ClusterIdentifier', 'Value': 'my-redshift-cluster'}
    ],
    StartTime=datetime.now() - timedelta(hours=1),
    EndTime=datetime.now(),
    Period=300,
    Statistics=['Average']
)
```

**Key Metrics**:
- **CPUUtilization**: CPU usage (target <80%)
- **DatabaseConnections**: Active connections
- **PercentageDiskSpaceUsed**: Disk usage (trigger resize at 85%)
- **ReadThroughput/WriteThroughput**: I/O performance
- **NetworkReceiveThroughput/NetworkTransmitThroughput**: Network I/O
- **QueryDuration**: Query execution time
- **QueriesCompletedPerSecond**: Query throughput

### System Tables

```sql
-- Running queries
SELECT query, pid, user_name, starttime, status
FROM stv_recents
WHERE status = 'Running'
ORDER BY starttime;

-- Query performance
SELECT query, trim(querytxt) as sql, starttime, endtime,
       DATEDIFF(seconds, starttime, endtime) as duration
FROM svl_qlog
WHERE userid > 1
ORDER BY duration DESC
LIMIT 10;

-- Table sizes
SELECT "table", size, tbl_rows
FROM svv_table_info
ORDER BY size DESC;

-- Disk usage
SELECT SUM(capacity)/1024 as total_gb,
       SUM(used)/1024 as used_gb,
       (SUM(used)/SUM(capacity))*100 as percent_used
FROM stv_partitions;
```

## Scaling and Resizing

### Elastic Resize (Minutes)

**Change Node Count** (same node type):
```python
redshift.resize_cluster(
    ClusterIdentifier='my-redshift-cluster',
    NumberOfNodes=4,  # 2 → 4 nodes
    Classic=False  # Elastic resize
)
# Downtime: 4-8 minutes
```

### Classic Resize (Hours)

**Change Node Type**:
```python
redshift.resize_cluster(
    ClusterIdentifier='my-redshift-cluster',
    NodeType='ra3.4xlarge',  # Upgrade node type
    NumberOfNodes=2,
    Classic=True
)
# Downtime: Hours (depends on data size)
```

### Concurrency Scaling

**Automatic** (handle query spikes):
```python
# Enable concurrency scaling
redshift.modify_cluster_parameter_group(
    ParameterGroupName='my-redshift-params',
    Parameters=[
        {
            'ParameterName': 'max_concurrency_scaling_clusters',
            'ParameterValue': '10'  # Up to 10 additional clusters
        }
    ]
)
```

**Features**:
- Spin up transient clusters for read queries
- Handle query bursts
- Pay only for usage (per-second billing)
- Free: 1 hour per day per cluster

## Cost Optimization

### On-Demand Pricing (us-east-1)

**RA3 Nodes**:
```
ra3.xlplus: $1.086/hour = $793/month
ra3.4xlarge: $3.26/hour = $2,380/month
ra3.16xlarge: $13.04/hour = $9,519/month
```

**DC2 Nodes**:
```
dc2.large: $0.25/hour = $183/month
dc2.8xlarge: $4.80/hour = $3,504/month
```

### Reserved Instances

**1-Year Reserved**:
```
No Upfront: 34% discount
Partial Upfront: 38% discount
All Upfront: 40% discount
```

**3-Year Reserved**:
```
No Upfront: 56% discount
Partial Upfront: 60% discount
All Upfront: 62% discount
```

**Example** (ra3.4xlarge, 2 nodes, 1-year All Upfront):
```
On-Demand: 2 × $2,380 = $4,760/month
Reserved (40% off): $2,856/month
Savings: $1,904/month
```

### Cost Example (Production)

**Cluster**:
```
Node type: ra3.4xlarge
Nodes: 4 (1 leader + 3 compute)
Reserved 1-year: $11,424/month (vs $19,040 on-demand)
```

**Storage** (RA3):
```
Managed storage: 200 TB × $0.024/GB-month = $4,800/month
(First 32 TB per node included, 4 × 32 = 128 TB free)
Additional: (200 - 128) TB = 72 TB × $0.024 = $1,728/month
```

**Spectrum**:
```
Queries: 1 TB scanned/day × 30 days = 30 TB/month
30 TB × $5 = $150/month
```

**Concurrency Scaling**:
```
Free: 1 hour/day = 30 hours/month
Additional: 10 hours × $3.26 = $32.60/month
```

**Total**:
```
Cluster: $11,424
Storage: $1,728
Spectrum: $150
Concurrency Scaling: $32.60
Total: $13,334.60/month
```

## Real-World Scenarios

### Scenario 1: E-Commerce Analytics

**Requirements**:
- 5 TB sales data
- Daily ETL from S3
- Hourly reporting queries
- 100 concurrent users

**Solution**:
```sql
-- Dimension tables (small, replicate)
CREATE TABLE dim_products (...) DISTSTYLE ALL;
CREATE TABLE dim_customers (...) DISTSTYLE ALL;

-- Fact table (large, distribute by key)
CREATE TABLE fact_sales (
    sale_id BIGINT,
    product_id INT,
    customer_id INT,
    amount DECIMAL(10,2),
    sale_date DATE
)
DISTKEY(customer_id)
COMPOUND SORTKEY(sale_date, customer_id);

-- Materialized view for dashboards
CREATE MATERIALIZED VIEW daily_sales AS
SELECT DATE_TRUNC('day', sale_date) as day,
       product_id,
       SUM(amount) as total
FROM fact_sales
GROUP BY day, product_id;
```

**Cost**:
```
Cluster: 2 × ra3.4xlarge reserved = $5,712/month
Storage: 5 TB (included)
Total: $5,712/month
```

### Scenario 2: Log Analytics with Spectrum

**Requirements**:
- 500 TB logs in S3 (Parquet)
- Query last 90 days frequently
- Archive older data

**Solution**:
```sql
-- Recent data in Redshift
CREATE TABLE logs_recent (...)
DISTKEY(timestamp)
SORTKEY(timestamp);

-- COPY last 90 days
COPY logs_recent FROM 's3://bucket/logs/recent/' ...;

-- Older data via Spectrum
CREATE EXTERNAL TABLE spectrum.logs_archive (...)
PARTITIONED BY (year INT, month INT)
LOCATION 's3://bucket/logs/archive/';

-- Union query
SELECT * FROM logs_recent
WHERE timestamp >= CURRENT_DATE - 90
UNION ALL
SELECT * FROM spectrum.logs_archive
WHERE year = 2023;
```

**Cost**:
```
Cluster: 2 × ra3.xlplus = $1,586/month
Storage: 90 days = 10 TB (included)
Spectrum: 20 TB scanned/month = $100/month
Total: $1,686/month

vs All in Redshift: 500 TB × $0.024 = $12,000/month
Savings: $10,314/month (86%)
```

## Exam Tips (SAP-C02)

### Key Decision Points

**Redshift vs RDS**:
```
OLAP (analytics) → Redshift
OLTP (transactions) → RDS
Petabyte scale → Redshift
Row-level updates → RDS
```

**RA3 vs DC2**:
```
>1 TB dataset → RA3
Separate compute/storage → RA3
<1 TB, cost-sensitive → DC2
Use Spectrum → RA3
```

**Distribution Styles**:
```
Large fact table + dimension tables → DISTKEY on join column + DISTSTYLE ALL for dims
No clear join key → DISTSTYLE EVEN
Small tables → DISTSTYLE ALL
```

**Sort Keys**:
```
Range queries → SORTKEY on filter column
Multiple filter patterns → INTERLEAVED SORTKEY
Query prefix columns → COMPOUND SORTKEY
```

### Common Patterns

**ETL optimization**:
```
Use COPY (not INSERT): 10x faster
Load compressed data: GZIP, Parquet
Use manifest for retries
Enable COMPUPDATE and STATUPDATE
```

**Query performance**:
```
Co-locate joins: Same DISTKEY
Replicate small dims: DISTSTYLE ALL
Use materialized views
Enable result caching
```

**Cost optimization**:
```
Reserved instances: 40-62% savings
RA3 managed storage: Scale independently
Spectrum for cold data: $5/TB vs $24/TB
Concurrency scaling: Handle spikes
```

This comprehensive Redshift guide covers data warehousing, query optimization, and cost management for SAP-C02 mastery.
