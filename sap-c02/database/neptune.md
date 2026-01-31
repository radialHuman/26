# Amazon Neptune

## What is Neptune?

Amazon Neptune is a fully managed graph database service optimized for storing billions of relationships and querying the graph with milliseconds latency. Neptune supports two popular graph query languages: Gremlin (Apache TinkerPop) and SPARQL (RDF/W3C standards).

## Why Use Neptune?

### Key Benefits
- **Purpose-Built**: Optimized for graph queries (not adapted from relational DB)
- **Highly Available**: Multi-AZ replication, read replicas
- **Fast**: Milliseconds for complex relationship queries
- **Scalable**: Store billions of relationships
- **Fully Managed**: Automated backups, patching, monitoring
- **ACID Transactions**: Strong consistency guarantees

### Use Cases
- **Social Networks**: Friend recommendations, influencer analysis
- **Fraud Detection**: Identify fraudulent patterns in transactions
- **Knowledge Graphs**: Connect entities and relationships (Wikipedia-style)
- **Recommendation Engines**: Product/content recommendations
- **Network/IT Operations**: Dependency mapping, impact analysis
- **Life Sciences**: Protein interactions, drug discovery

## Graph Concepts

### Property Graph (Gremlin)

**Vertices** (Nodes):
```
Person {
  id: "person1"
  name: "Alice"
  age: 30
}

Product {
  id: "product1"
  name: "Laptop"
  price: 1200
}
```

**Edges** (Relationships):
```
Alice --[PURCHASED]--> Laptop {
  date: "2024-01-15"
  quantity: 1
}

Alice --[FRIENDS_WITH]--> Bob {
  since: "2020-05-10"
}
```

### RDF Graph (SPARQL)

**Triples** (Subject-Predicate-Object):
```
<Alice> <knows> <Bob>
<Alice> <age> "30"^^xsd:integer
<Alice> <purchased> <Laptop>
<Laptop> <price> "1200"^^xsd:decimal
```

**RDF** = Resource Description Framework (W3C standard)

## Creating Neptune Cluster

```python
import boto3

neptune = boto3.client('neptune')

# Create DB subnet group
subnet_group = neptune.create_db_subnet_group(
    DBSubnetGroupName='my-neptune-subnet-group',
    DBSubnetGroupDescription='Neptune subnet group',
    SubnetIds=[
        'subnet-12345678',
        'subnet-87654321',
        'subnet-abcdef12'
    ],
    Tags=[
        {'Key': 'Name', 'Value': 'neptune-subnets'}
    ]
)

# Create DB cluster parameter group
cluster_param_group = neptune.create_db_cluster_parameter_group(
    DBClusterParameterGroupName='my-neptune-cluster-params',
    DBParameterGroupFamily='neptune1.2',
    Description='Custom Neptune cluster parameters',
    Tags=[
        {'Key': 'Name', 'Value': 'neptune-cluster-params'}
    ]
)

# Modify parameters
neptune.modify_db_cluster_parameter_group(
    DBClusterParameterGroupName='my-neptune-cluster-params',
    Parameters=[
        {
            'ParameterName': 'neptune_enable_audit_log',
            'ParameterValue': '1',
            'ApplyMethod': 'pending-reboot'
        },
        {
            'ParameterName': 'neptune_query_timeout',
            'ParameterValue': '120000',  # 2 minutes
            'ApplyMethod': 'immediate'
        }
    ]
)

# Create Neptune cluster
cluster = neptune.create_db_cluster(
    DBClusterIdentifier='my-neptune-cluster',
    Engine='neptune',
    EngineVersion='1.2.1.0',
    MasterUsername='admin',
    MasterUserPassword='SecurePassword123!',
    DBSubnetGroupName='my-neptune-subnet-group',
    VpcSecurityGroupIds=['sg-12345678'],
    Port=8182,
    DBClusterParameterGroupName='my-neptune-cluster-params',
    BackupRetentionPeriod=7,
    PreferredBackupWindow='03:00-04:00',
    PreferredMaintenanceWindow='mon:04:00-mon:05:00',
    EnableIAMDatabaseAuthentication=True,
    StorageEncrypted=True,
    KmsKeyId='arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    EnableCloudwatchLogsExports=['audit'],
    DeletionProtection=True,
    Tags=[
        {'Key': 'Name', 'Value': 'production-neptune'}
    ]
)

cluster_endpoint = cluster['DBCluster']['Endpoint']
reader_endpoint = cluster['DBCluster']['ReaderEndpoint']
```

## Creating DB Instances

```python
# Create primary instance
primary = neptune.create_db_instance(
    DBInstanceIdentifier='my-neptune-instance-1',
    DBInstanceClass='db.r5.large',
    Engine='neptune',
    DBClusterIdentifier='my-neptune-cluster',
    AvailabilityZone='us-east-1a',
    PreferredMaintenanceWindow='mon:05:00-mon:06:00',
    AutoMinorVersionUpgrade=True,
    Tags=[
        {'Key': 'Name', 'Value': 'neptune-primary'}
    ]
)

# Create read replica (different AZ for HA)
replica = neptune.create_db_instance(
    DBInstanceIdentifier='my-neptune-instance-2',
    DBInstanceClass='db.r5.large',
    Engine='neptune',
    DBClusterIdentifier='my-neptune-cluster',
    AvailabilityZone='us-east-1b',
    Tags=[
        {'Key': 'Name', 'Value': 'neptune-replica'}
    ]
)
```

### Instance Classes

| Class | vCPU | RAM | Network | Use Case |
|-------|------|-----|---------|----------|
| db.t3.medium | 2 | 4 GB | Moderate | Dev/test |
| db.r5.large | 2 | 16 GB | Up to 10 Gbps | Small prod |
| db.r5.xlarge | 4 | 32 GB | Up to 10 Gbps | Medium prod |
| db.r5.2xlarge | 8 | 64 GB | Up to 10 Gbps | Large prod |
| db.r5.4xlarge | 16 | 128 GB | 10 Gbps | Very large |
| db.r5.8xlarge | 32 | 256 GB | 10 Gbps | Extreme |

## Property Graph with Gremlin

### Connecting to Neptune (Gremlin)

**Using Python (gremlinpython)**:
```python
from gremlin_python.driver import client, serializer

# Connect to Neptune
neptune_endpoint = "my-neptune-cluster.cluster-xxxxx.us-east-1.neptune.amazonaws.com"
neptune_port = 8182

gremlin_client = client.Client(
    f'wss://{neptune_endpoint}:{neptune_port}/gremlin',
    'g',
    message_serializer=serializer.GraphSONSerializersV2d0()
)
```

**IAM Authentication**:
```python
from gremlin_python.driver.driver_remote_connection import DriverRemoteConnection
from gremlin_python.structure.graph import Graph
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
import requests

# Use SigV4 signing for IAM auth
# (Requires neptune-python-utils or custom implementation)
```

### Creating Vertices

```python
# Add person vertex
result = gremlin_client.submit(
    "g.addV('person').property(id, 'person1').property('name', 'Alice').property('age', 30)"
).all().result()

# Add product vertex
gremlin_client.submit(
    "g.addV('product').property(id, 'product1').property('name', 'Laptop').property('price', 1200)"
).all().result()

# Add multiple vertices
gremlin_client.submit("""
    g.addV('person').property(id, 'person2').property('name', 'Bob').property('age', 25).
    addV('person').property(id, 'person3').property('name', 'Carol').property('age', 28)
""").all().result()
```

### Creating Edges

```python
# Create friendship edge
gremlin_client.submit(
    "g.V('person1').addE('friends_with').to(V('person2')).property('since', '2020-05-10')"
).all().result()

# Create purchase edge
gremlin_client.submit(
    "g.V('person1').addE('purchased').to(V('product1')).property('date', '2024-01-15').property('quantity', 1)"
).all().result()
```

### Querying with Gremlin

**Find all friends**:
```python
# Get Alice's friends
friends = gremlin_client.submit(
    "g.V('person1').out('friends_with').values('name')"
).all().result()
# Result: ['Bob']
```

**Friends of friends**:
```python
# Get friends of friends (2 hops)
fof = gremlin_client.submit(
    "g.V('person1').out('friends_with').out('friends_with').values('name')"
).all().result()
```

**Recommendations** (purchased by friends):
```python
# What did my friends purchase?
recommendations = gremlin_client.submit("""
    g.V('person1').
      out('friends_with').
      out('purchased').
      values('name').
      dedup()
""").all().result()
```

**Path queries**:
```python
# Find path between two people
path = gremlin_client.submit("""
    g.V('person1').
      repeat(out('friends_with')).
      until(hasId('person3')).
      path().
      by('name')
""").all().result()
# Result: [['Alice', 'Bob', 'Carol']]
```

**Aggregations**:
```python
# Count products by category
counts = gremlin_client.submit("""
    g.V().
      hasLabel('product').
      groupCount().
      by('category')
""").all().result()
```

**Filtering**:
```python
# Friends older than 25
older_friends = gremlin_client.submit("""
    g.V('person1').
      out('friends_with').
      has('age', gt(25)).
      values('name')
""").all().result()
```

### Traversal Steps

Common Gremlin steps:
```
V(): Get vertices
E(): Get edges
addV(): Add vertex
addE(): Add edge
property(): Set property
has(): Filter by property
out(): Outgoing edges
in(): Incoming edges
both(): Both directions
values(): Get property values
path(): Get traversal path
repeat(): Loop traversal
until(): Stop condition
group(): Group vertices
count(): Count elements
order(): Sort results
limit(): Limit results
```

## RDF Graph with SPARQL

### Loading RDF Data

**Using Bulk Loader**:
```bash
# Upload RDF file to S3
aws s3 cp data.ntriples s3://my-bucket/neptune-data/

# Create IAM role for Neptune to access S3
# (Neptune service role with S3 read permissions)

# Start bulk load
curl -X POST \
  -H 'Content-Type: application/json' \
  https://my-neptune-cluster.cluster-xxxxx.us-east-1.neptune.amazonaws.com:8182/loader \
  -d '{
    "source": "s3://my-bucket/neptune-data/",
    "format": "ntriples",
    "iamRoleArn": "arn:aws:iam::123456789012:role/NeptuneLoadFromS3",
    "region": "us-east-1",
    "failOnError": "FALSE",
    "parallelism": "MEDIUM"
  }'

# Check load status
curl -G https://my-neptune-cluster.cluster-xxxxx.us-east-1.neptune.amazonaws.com:8182/loader/{load-id}
```

**RDF Formats**:
- N-Triples (.nt)
- N-Quads (.nq)
- RDF/XML (.rdf)
- Turtle (.ttl)

### Querying with SPARQL

**Using Python (SPARQLWrapper)**:
```python
from SPARQLWrapper import SPARQLWrapper, JSON

sparql = SPARQLWrapper(f"https://{neptune_endpoint}:8182/sparql")

# Select query
sparql.setQuery("""
    PREFIX ex: <http://example.org/>
    SELECT ?name ?age
    WHERE {
        ?person ex:name ?name .
        ?person ex:age ?age .
        FILTER(?age > 25)
    }
""")
sparql.setReturnFormat(JSON)
results = sparql.query().convert()

for result in results["results"]["bindings"]:
    print(f"{result['name']['value']}: {result['age']['value']}")
```

**SPARQL Queries**:

**Find friends**:
```sparql
PREFIX ex: <http://example.org/>
SELECT ?friendName
WHERE {
    ex:Alice ex:knows ?friend .
    ?friend ex:name ?friendName .
}
```

**Count by property**:
```sparql
PREFIX ex: <http://example.org/>
SELECT ?age (COUNT(?person) as ?count)
WHERE {
    ?person ex:age ?age .
}
GROUP BY ?age
ORDER BY DESC(?count)
```

**Complex pattern**:
```sparql
PREFIX ex: <http://example.org/>
SELECT ?productName ?price
WHERE {
    ex:Alice ex:knows ?friend .
    ?friend ex:purchased ?product .
    ?product ex:name ?productName .
    ?product ex:price ?price .
    FILTER(?price < 1000)
}
```

## High Availability

### Multi-AZ Deployment

**Architecture**:
```
Primary Instance (AZ1): Read/write
Replica 1 (AZ2): Read-only
Replica 2 (AZ3): Read-only
```

**Automatic Failover**:
- Failover time: Typically <30 seconds
- Promotion: Replica → Primary
- DNS update: Cluster endpoint points to new primary

**Create HA Cluster**:
```python
# Already created cluster spans multiple AZs
# Create replicas in different AZs (shown above)

# Up to 15 read replicas
for i in range(3, 6):
    neptune.create_db_instance(
        DBInstanceIdentifier=f'my-neptune-instance-{i}',
        DBInstanceClass='db.r5.large',
        Engine='neptune',
        DBClusterIdentifier='my-neptune-cluster',
        AvailabilityZone=f'us-east-1{chr(97 + i % 3)}'  # Cycle through AZs
    )
```

### Read Replicas for Scaling

**Read Scaling**:
```python
# Applications connect to:
# - Cluster endpoint (write): Automatic routing to primary
# - Reader endpoint (read): Load-balanced across replicas
# - Instance endpoint (specific): Direct to instance

# Python example
write_client = client.Client(f'wss://{cluster_endpoint}:8182/gremlin', 'g')
read_client = client.Client(f'wss://{reader_endpoint}:8182/gremlin', 'g')

# Write
write_client.submit("g.addV('person').property('name', 'Dave')").all().result()

# Read
results = read_client.submit("g.V().has('name', 'Dave')").all().result()
```

## Backups and Restore

### Automated Backups

**Continuous Backups**:
```
Retention: 1-35 days
Frequency: Continuous (every 5 minutes)
Storage: Amazon S3 (encrypted)
Point-in-time restore: Any second within retention period
```

**Enable Backups** (already enabled in cluster creation):
```python
neptune.modify_db_cluster(
    DBClusterIdentifier='my-neptune-cluster',
    BackupRetentionPeriod=14,  # Days
    PreferredBackupWindow='03:00-04:00'  # UTC
)
```

### Manual Snapshots

**Create Snapshot**:
```python
snapshot = neptune.create_db_cluster_snapshot(
    DBClusterSnapshotIdentifier='my-neptune-snapshot-20240131',
    DBClusterIdentifier='my-neptune-cluster',
    Tags=[
        {'Key': 'Purpose', 'Value': 'Pre-upgrade backup'}
    ]
)
```

**Restore from Snapshot**:
```python
restored_cluster = neptune.restore_db_cluster_from_snapshot(
    DBClusterIdentifier='my-neptune-restored',
    SnapshotIdentifier='my-neptune-snapshot-20240131',
    Engine='neptune',
    DBSubnetGroupName='my-neptune-subnet-group',
    VpcSecurityGroupIds=['sg-12345678']
)
```

**Copy Snapshot** (cross-region):
```python
copied_snapshot = neptune.copy_db_cluster_snapshot(
    SourceDBClusterSnapshotIdentifier='arn:aws:rds:us-east-1:123456789012:cluster-snapshot:my-neptune-snapshot-20240131',
    TargetDBClusterSnapshotIdentifier='my-neptune-snapshot-20240131-dr',
    SourceRegion='us-east-1',
    KmsKeyId='arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012'
)
```

## Security

### IAM Database Authentication

**Enable IAM Auth** (already enabled in cluster creation)

**Connect with IAM**:
```python
import boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest

# Get IAM credentials
session = boto3.Session()
credentials = session.get_credentials()

# Sign request with SigV4
# (Use neptune-python-utils or implement SigV4 signing)
```

**IAM Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "neptune-db:connect",
        "neptune-db:ReadDataViaQuery",
        "neptune-db:WriteDataViaQuery"
      ],
      "Resource": "arn:aws:neptune-db:us-east-1:123456789012:cluster-ABCDEFGHIJKLMNOP/*"
    }
  ]
}
```

### VPC Security

**Security Groups**:
```python
ec2 = boto3.client('ec2')

# Create security group
sg = ec2.create_security_group(
    GroupName='neptune-sg',
    Description='Neptune database access',
    VpcId='vpc-12345678'
)

# Allow port 8182 from application security group
ec2.authorize_security_group_ingress(
    GroupId=sg['GroupId'],
    IpPermissions=[
        {
            'IpProtocol': 'tcp',
            'FromPort': 8182,
            'ToPort': 8182,
            'UserIdGroupPairs': [
                {'GroupId': 'sg-app-servers'}
            ]
        }
    ]
)
```

### Encryption

**At Rest**:
```
Encryption: AES-256
Key: AWS KMS
Enabled at cluster creation (cannot change later)
```

**In Transit**:
```
Protocol: TLS 1.2
Endpoint: wss:// (WebSocket Secure)
Certificate: AWS-provided
```

## Monitoring

### CloudWatch Metrics

```python
cloudwatch = boto3.client('cloudwatch')

# Get main instance CPU
metrics = cloudwatch.get_metric_statistics(
    Namespace='AWS/Neptune',
    MetricName='CPUUtilization',
    Dimensions=[
        {'Name': 'DBClusterIdentifier', 'Value': 'my-neptune-cluster'},
        {'Name': 'DBInstanceIdentifier', 'Value': 'my-neptune-instance-1'}
    ],
    StartTime=datetime.now() - timedelta(hours=1),
    EndTime=datetime.now(),
    Period=300,
    Statistics=['Average']
)
```

**Key Metrics**:
- **CPUUtilization**: CPU usage (target <80%)
- **FreeableMemory**: Available RAM
- **NetworkReceiveThroughput**: Network in
- **NetworkTransmitThroughput**: Network out
- **GremlinRequestsPerSec**: Gremlin query rate
- **SparqlRequestsPerSec**: SPARQL query rate
- **ClusterReplicaLag**: Replication lag (milliseconds)
- **VolumeBytesUsed**: Storage used
- **BackupRetentionPeriodStorageUsed**: Backup storage

### Slow Query Logs

**Enable Audit Logs**:
```python
neptune.modify_db_cluster_parameter_group(
    DBClusterParameterGroupName='my-neptune-cluster-params',
    Parameters=[
        {
            'ParameterName': 'neptune_enable_audit_log',
            'ParameterValue': '1',
            'ApplyMethod': 'pending-reboot'
        }
    ]
)

# Reboot instances
neptune.reboot_db_instance(DBInstanceIdentifier='my-neptune-instance-1')
```

**View in CloudWatch Logs**:
```bash
aws logs tail /aws/neptune/my-neptune-cluster/audit --follow
```

## Performance Optimization

### Query Optimization

**Indexing** (Automatic):
```
Neptune automatically indexes:
  - Vertex IDs
  - Edge IDs
  - Labels
  - Properties
```

**Gremlin Best Practices**:
```python
# BAD: Get all vertices then filter
g.V().has('name', 'Alice')

# GOOD: Use index lookup
g.V().hasLabel('person').has('name', 'Alice')

# BAD: Unlimited traversal
g.V('person1').repeat(out()).emit()

# GOOD: Limit depth
g.V('person1').repeat(out()).times(3).emit()

# BAD: Full scan
g.V().count()

# GOOD: Use specific traversal
g.V().hasLabel('person').count()
```

**Batching**:
```python
# BAD: Many individual queries
for item in items:
    gremlin_client.submit(f"g.addV('person').property('name', '{item}')").all().result()

# GOOD: Batch insert
batch_query = """
    g.addV('person').property('name', 'Alice').
    addV('person').property('name', 'Bob').
    addV('person').property('name', 'Carol')
"""
gremlin_client.submit(batch_query).all().result()
```

### Scaling

**Vertical Scaling** (instance class):
```python
neptune.modify_db_instance(
    DBInstanceIdentifier='my-neptune-instance-1',
    DBInstanceClass='db.r5.2xlarge',  # Upgrade
    ApplyImmediately=False  # During maintenance window
)
```

**Horizontal Scaling** (read replicas):
```python
# Add more read replicas (up to 15 total)
for i in range(3):
    neptune.create_db_instance(
        DBInstanceIdentifier=f'my-neptune-instance-read-{i}',
        DBInstanceClass='db.r5.xlarge',
        Engine='neptune',
        DBClusterIdentifier='my-neptune-cluster'
    )
```

## Cost Estimation

**Instance Costs** (us-east-1):
```
db.t3.medium: $0.089/hour = $65/month
db.r5.large: $0.29/hour = $212/month
db.r5.xlarge: $0.58/hour = $424/month
db.r5.2xlarge: $1.16/hour = $847/month
db.r5.4xlarge: $2.32/hour = $1,694/month
```

**Storage**:
```
$0.10 per GB-month (10 GB - 64 TB)
Auto-scaling in 10 GB increments
```

**I/O**:
```
$0.20 per 1 million requests
```

**Backup Storage**:
```
Same-region: Free up to 100% of provisioned storage
Additional: $0.021 per GB-month
Cross-region copy: $0.021 per GB-month + data transfer
```

### Example Cost (Production)

**Cluster**:
```
Primary: db.r5.2xlarge $847/month
Replica 1: db.r5.2xlarge $847/month
Replica 2: db.r5.xlarge $424/month
Total instances: $2,118/month
```

**Storage**:
```
200 GB × $0.10 = $20/month
```

**I/O**:
```
10M requests/day × 30 days = 300M requests
300M × $0.20/1M = $60/month
```

**Backups**:
```
200 GB within retention: Free
Additional 50 GB: 50 × $0.021 = $1.05/month
```

**Total**:
```
$2,118 + $20 + $60 + $1.05 = $2,199.05/month
```

## Real-World Scenarios

### Scenario 1: Social Network

**Requirements**:
- 10M users
- Friend recommendations
- Influencer detection
- Real-time feeds

**Graph Model**:
```
Vertices: User, Post, Comment
Edges: FOLLOWS, POSTED, COMMENTED, LIKED
```

**Query** (friend recommendations):
```python
# Friends of friends who are not already friends
recommendations = gremlin_client.submit("""
    g.V('user123').
      out('FOLLOWS').
      aggregate('friends').
      out('FOLLOWS').
      where(without('friends')).
      where(neq('user123')).
      groupCount().
      order(local).by(values, desc).
      limit(local, 10)
""").all().result()
```

**Cost**:
```
Instances: 2 × db.r5.4xlarge = $3,388/month
Storage: 500 GB = $50/month
I/O: 1B requests = $200/month
Total: $3,638/month
```

### Scenario 2: Fraud Detection

**Requirements**:
- Detect fraud rings
- Real-time transaction analysis
- Pattern matching

**Graph Model**:
```
Vertices: Account, Transaction, Device, IP
Edges: SENT, RECEIVED, USED, ORIGINATED
```

**Query** (detect fraud ring):
```python
# Find accounts sharing devices and IPs
fraud_ring = gremlin_client.submit("""
    g.V('account123').
      out('USED').hasLabel('device').
      in('USED').hasLabel('account').
      out('ORIGINATED').hasLabel('ip').
      in('ORIGINATED').hasLabel('account').
      dedup().
      path().
      by('id')
""").all().result()
```

**Cost**:
```
Instances: 2 × db.r5.2xlarge = $1,694/month
Storage: 100 GB = $10/month
I/O: 500M requests = $100/month
Total: $1,804/month
```

### Scenario 3: Knowledge Graph

**Requirements**:
- Connect entities (Wikipedia-style)
- SPARQL queries
- Semantic search

**RDF Model**:
```turtle
@prefix ex: <http://example.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

ex:Python rdf:type ex:ProgrammingLanguage .
ex:Python ex:creator ex:GuidoVanRossum .
ex:Python ex:firstAppeared "1991" .
ex:Python ex:usedBy ex:AWS .
```

**Query** (find related technologies):
```sparql
PREFIX ex: <http://example.org/>
SELECT ?tech ?relation
WHERE {
    ex:Python ?relation ?tech .
    ?tech rdf:type ex:Technology .
}
```

**Cost**:
```
Instances: 1 × db.r5.xlarge = $424/month
Storage: 50 GB = $5/month
I/O: 100M requests = $20/month
Total: $449/month
```

## Exam Tips (SAP-C02)

### Key Decision Points

**Neptune vs Relational DB**:
```
Many-to-many relationships → Neptune
Graph traversals → Neptune
ACID on rows → Relational
Tabular data → Relational
```

**Neptune vs DynamoDB**:
```
Complex relationships → Neptune
Simple key-value → DynamoDB
Graph queries → Neptune
Fast single-item lookup → DynamoDB
```

**Gremlin vs SPARQL**:
```
Property graph → Gremlin
RDF/semantic web → SPARQL
Flexible schema → Gremlin
W3C standards → SPARQL
```

### Common Patterns

**Social network features**:
```
Friend recommendations → 2-hop traversal
Influencer detection → PageRank algorithm
Feed generation → Timeline aggregation
```

**Fraud detection**:
```
Fraud rings → Connected components
Anomaly detection → Pattern matching
Risk scoring → Graph metrics
```

**Recommendation engines**:
```
Collaborative filtering → User-item graph
Content-based → Entity relationships
Hybrid → Multi-hop traversal
```

This comprehensive Neptune guide covers graph databases, query languages, and real-world applications for SAP-C02 mastery.
