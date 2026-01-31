# AWS Hybrid and Edge Computing - Complete Guide for SAP-C02

## Overview

AWS provides services to extend cloud capabilities to on-premises data centers, edge locations, and remote environments. These services enable hybrid cloud architectures, edge computing, and disconnected operations.

**Service Categories**:
- **AWS Outposts**: Fully managed AWS infrastructure on-premises
- **AWS Local Zones**: AWS infrastructure in metropolitan areas
- **AWS Wavelength**: 5G edge computing
- **AWS Snow Family**: Data transfer and edge computing devices
- **AWS IoT Greengrass**: Edge runtime for IoT devices

---

## AWS Outposts

### What is AWS Outposts?

Fully managed service that extends AWS infrastructure, services, APIs, and tools to customer premises. Provides a consistent hybrid cloud experience.

### Why Use Outposts?

**Key Benefits**:
- **Low Latency**: Single-digit millisecond latency to on-premises systems
- **Local Data Processing**: Keep data on-premises for compliance
- **Consistent Experience**: Same AWS APIs, tools, and services
- **Fully Managed**: AWS handles hardware lifecycle
- **Hybrid Integration**: Seamless connection to AWS Regions

**Use Cases**:
- Low-latency workloads (manufacturing, healthcare)
- Data residency requirements
- Migration bridge to cloud
- Local data processing before cloud upload
- Disconnected environments (limited connectivity)

### How Outposts Works

**Architecture**:
```
AWS Region
    ↓ (VPN or Direct Connect)
Customer Data Center
    ├── Outpost Rack (42U)
    │   ├── AWS-managed servers
    │   ├── AWS-managed networking
    │   └── AWS-managed storage
    ├── Local Gateway (LGW)
    │   └── Routes to on-premises network
    └── On-premises applications/databases
```

**Outpost Components**:
1. **Compute**: EC2 instances
2. **Storage**: EBS volumes, S3 on Outposts
3. **Networking**: VPC subnets, security groups
4. **Database**: RDS on Outposts
5. **Container**: ECS, EKS on Outposts
6. **EMR**: Big data processing

### Outpost Form Factors

**Outpost Rack**:
- Full 42U rack
- Multiple instance types
- Starts at 48 vCPUs, 256 GB RAM
- Up to 368 vCPUs, 2,688 GB RAM

**Outpost Servers** (1U and 2U):
- Small form factor
- Retail stores, branch offices
- Supports 1-2 instance types
- 64-256 vCPUs depending on model

### Networking Architecture

**Local Gateway (LGW)**:
```
Outpost VPC
├── Subnet A (outpost-subnet-a)
│   └── EC2 instances
└── Subnet B (outpost-subnet-b)
    └── RDS instances
    
Local Gateway
├── Routes to on-premises (10.0.0.0/8)
└── Routes to AWS Region (via VPC)

VPN/Direct Connect → AWS Region
```

**Connectivity Modes**:
1. **Service Link**: Outpost ↔ AWS Region (required, AWS-managed)
2. **Local Gateway**: Outpost ↔ On-premises network
3. **Direct Connect**: On-premises ↔ AWS Region

### S3 on Outposts

**Features**:
- S3 API compatibility
- Local data storage
- Data transfer to S3 Region (optional)
- Object storage for on-premises apps

**Configuration**:
```bash
# Create S3 on Outposts bucket
aws s3control create-bucket \
  --bucket my-outpost-bucket \
  --outpost-id op-1234567890abcdef0
  
# Configure lifecycle policy
aws s3control put-bucket-lifecycle-configuration \
  --account-id 123456789012 \
  --bucket arn:aws:s3-outposts:us-east-1:123456789012:outpost/op-123/bucket/my-bucket \
  --lifecycle-configuration file://lifecycle.json
```

**Data Transfer to Region**:
```json
{
  "Rules": [
    {
      "Id": "TransferToRegion",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 7,
          "StorageClass": "STANDARD_IA"
        }
      ],
      "NoncurrentVersionTransitions": [
        {
          "NoncurrentDays": 30,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

### RDS on Outposts

**Supported Engines**:
- MySQL
- PostgreSQL
- SQL Server

**High Availability**:
- Multi-AZ not supported (on-premises limitation)
- Use read replicas in AWS Region
- Backup to AWS Region S3

**Example**:
```bash
aws rds create-db-instance \
  --db-instance-identifier outpost-mysql-db \
  --db-instance-class db.m5.large \
  --engine mysql \
  --master-username admin \
  --master-user-password MyPassword123 \
  --allocated-storage 100 \
  --backup-retention-period 7 \
  --vpc-security-group-ids sg-12345678 \
  --db-subnet-group-name outpost-subnet-group
```

### ECS/EKS on Outposts

**Container Orchestration**:
```yaml
# EKS on Outposts
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  labels:
    app: manufacturing
spec:
  nodeSelector:
    karpenter.sh/capacity-type: outpost  # Schedule on Outpost
  containers:
  - name: app
    image: myapp:v1
    resources:
      requests:
        memory: "256Mi"
        cpu: "500m"
```

### Maintenance and Updates

**AWS Managed**:
- Hardware replacement
- Software patches
- Capacity planning
- 24/7 monitoring

**Customer Responsibilities**:
- Physical security
- Power and cooling
- Network connectivity
- Rack space

**Maintenance Windows**:
```bash
# Schedule maintenance window
aws outposts update-outpost \
  --outpost-id op-1234567890abcdef0 \
  --maintenance-window-schedule \
  --day-of-week SUNDAY \
  --hour-of-day 2
```

### Disaster Recovery

**Backup Strategy**:
```
1. EBS Snapshots → AWS Region S3
2. S3 on Outposts → S3 Region (lifecycle policy)
3. RDS Backups → S3 Region
4. EC2 AMIs → AMI in Region

DR Scenario:
- Outpost failure → Launch instances in Region
- Use CloudFormation for infrastructure as code
- Restore from snapshots/backups
```

---

## AWS Local Zones

### What are Local Zones?

AWS infrastructure deployments that place compute, storage, database, and other services closer to large population centers and industry centers.

### Why Use Local Zones?

**Key Benefits**:
- **Ultra-low Latency**: Single-digit millisecond latency
- **Proximity to Users**: Deploy near major cities
- **AWS Services**: EC2, EBS, VPC, ELB, FSx, Direct Connect
- **Seamless Extension**: Extension of AWS Region VPC

**Use Cases**:
- Real-time gaming
- Live video streaming
- AR/VR applications
- ML inference at the edge
- Electronic design automation (EDA)
- Latency-sensitive financial applications

### How Local Zones Work

**Architecture**:
```
AWS Region (us-east-1)
├── AZ us-east-1a
├── AZ us-east-1b
└── AZ us-east-1c

AWS Local Zones (extensions)
├── us-east-1-bos-1a (Boston)
├── us-east-1-mia-1a (Miami)
└── us-east-1-nyc-1a (New York)

VPC Subnet
├── Subnet in us-east-1a (Region)
├── Subnet in us-east-1b (Region)
└── Subnet in us-east-1-bos-1a (Local Zone)
```

**Network Path**:
```
User in Boston
    ↓ (< 10ms)
EC2 in us-east-1-bos-1a (Local Zone)
    ↓ (< 20ms)
RDS in us-east-1a (Region)
```

### Configuration

**Enable Local Zone**:
```bash
# List available Local Zones
aws ec2 describe-availability-zones --region us-east-1

# Opt-in to Local Zone
aws ec2 modify-availability-zone-group \
  --group-name us-east-1-bos-1 \
  --opt-in-status opted-in
```

**Create Subnet in Local Zone**:
```bash
aws ec2 create-subnet \
  --vpc-id vpc-12345678 \
  --cidr-block 10.0.10.0/24 \
  --availability-zone us-east-1-bos-1a
```

**Launch EC2 Instance**:
```bash
aws ec2 run-instances \
  --image-id ami-12345678 \
  --instance-type t3.medium \
  --subnet-id subnet-localzone \
  --availability-zone us-east-1-bos-1a
```

### Supported Services

**Compute**:
- EC2 instances (limited types)
- EBS volumes (GP2, IO1)
- Application Load Balancer

**Storage**:
- EBS snapshots (stored in parent Region)
- FSx for Lustre

**Networking**:
- VPC (extension of Region VPC)
- Security Groups
- Network ACLs
- Direct Connect

**Not Available**:
- NAT Gateway (use NAT instance)
- VPC Endpoints
- Multi-AZ deployments (single zone per location)

### High Availability Pattern

```
                    Route 53 (Latency Routing)
                            ↓
        ┌──────────────────┴──────────────────┐
        ↓                                     ↓
ALB (Local Zone)                      ALB (Region Multi-AZ)
        ↓                                     ↓
   EC2 (Local Zone)                      EC2 (Region)
        ↓                                     ↓
      RDS (Region Multi-AZ) ←──────────────────┘
```

---

## AWS Wavelength

### What is AWS Wavelength?

AWS infrastructure embedded within telecommunications providers' 5G networks, enabling ultra-low latency applications at the edge of the 5G network.

### Why Use Wavelength?

**Key Benefits**:
- **Ultra-Low Latency**: Sub-10ms latency to mobile devices
- **5G Integration**: Deployed in telecom data centers
- **No Internet Hop**: Direct path from 5G device to application
- **AWS Services**: EC2, EBS, ECS, VPC

**Use Cases**:
- Interactive live video streams
- Real-time gaming
- AR/VR applications
- Connected vehicles
- Industrial automation
- ML inference for mobile apps

### How Wavelength Works

**Architecture**:
```
5G Mobile Device
      ↓ (5G Network)
Telecom Provider 5G Network
      ↓
Wavelength Zone (in telecom DC)
├── EC2 instances
├── EBS volumes
└── VPC subnets
      ↓
AWS Region (via service link)
```

**Network Path**:
```
Traditional:
Mobile Device → Internet → AWS Region (50-100ms)

Wavelength:
Mobile Device → 5G Network → Wavelength Zone (< 10ms)
```

### Wavelength Zones

**Available Locations**:
- US: Verizon 5G Edge (multiple cities)
- Europe: Vodafone (UK, Germany)
- Japan: KDDI
- South Korea: SK Telecom

**Zone Naming**:
- us-east-1-wl1-bos-wlz-1 (Boston Wavelength Zone)
- ap-northeast-1-wl1-nrt-wlz-1 (Tokyo Wavelength Zone)

### Configuration

**Create Subnet in Wavelength Zone**:
```bash
# Create VPC (in parent Region)
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnet in Wavelength Zone
aws ec2 create-subnet \
  --vpc-id vpc-12345678 \
  --cidr-block 10.0.100.0/24 \
  --availability-zone us-east-1-wl1-bos-wlz-1
```

**Create Carrier Gateway** (for internet access):
```bash
aws ec2 create-carrier-gateway --vpc-id vpc-12345678

# Associate with route table
aws ec2 create-route \
  --route-table-id rtb-12345678 \
  --destination-cidr-block 0.0.0.0/0 \
  --carrier-gateway-id cagw-12345678
```

**Launch EC2 Instance**:
```bash
aws ec2 run-instances \
  --image-id ami-12345678 \
  --instance-type t3.medium \
  --subnet-id subnet-wavelength \
  --associate-carrier-ip-address  # Public IP for 5G devices
```

### Carrier IP Addresses

**What**: Public IP addresses accessible from 5G devices on carrier network.

**Characteristics**:
- Only accessible from carrier's 5G network
- Not routable from internet
- Assigned to instances in Wavelength Zones

**Example**:
```bash
# Allocate Carrier IP
aws ec2 allocate-address --domain vpc --network-border-group us-east-1-wl1-bos-wlz-1

# Associate with instance
aws ec2 associate-address \
  --instance-id i-12345678 \
  --allocation-id eipalloc-12345678
```

### Application Architecture

**Real-time Gaming Example**:
```
Mobile Game Client (5G)
        ↓
Carrier IP (Wavelength Zone)
        ↓
Game Server (EC2 in Wavelength)
├── Local state (EBS)
├── Player matching (local)
└── Game logic (< 10ms latency)
        ↓
Central Services (Region)
├── Player profiles (DynamoDB)
├── Leaderboards (ElastiCache)
└── Analytics (Kinesis)
```

---

## AWS Snow Family

### Overview

Physical devices for data transfer and edge computing in disconnected or bandwidth-constrained environments.

### Device Comparison

| Feature | Snowcone | Snowball Edge | Snowmobile |
|---------|----------|---------------|------------|
| **Storage** | 8 TB (HDD) / 14 TB (SSD) | 80 TB / 210 TB | 100 PB |
| **Compute** | 2 vCPUs, 4 GB RAM | 52 vCPUs, 208 GB RAM | None |
| **Use Case** | Edge computing, small transfers | Large transfers, edge computing | Exabyte-scale migrations |
| **Portability** | Handheld (4.5 lbs) | Wheeled case (50 lbs) | Shipping container |
| **Network** | Wi-Fi, 10 Gbps | 10/25/40/100 Gbps | Multiple 10 Gbps |

---

### AWS Snowcone

**What**: Smallest Snow device for edge computing and data transfer.

**Specifications**:
- **Storage**: 8 TB HDD or 14 TB SSD
- **Compute**: 2 vCPUs, 4 GB RAM
- **Form Factor**: 9" x 6" x 3", 4.5 lbs
- **Power**: Battery-powered option
- **Connectivity**: Wi-Fi, USB-C, Ethernet

**Use Cases**:
- IoT sensor data collection
- Drone data capture
- Remote site data collection
- Content distribution to remote locations
- Tactical edge computing

**Edge Computing on Snowcone**:
```bash
# Run EC2 instances on Snowcone
aws ec2 run-instances \
  --image-id ami-snowcone-123 \
  --instance-type sbe-c.medium \
  --placement AvailabilityZone=snowcone-az
  
# Run Docker containers
docker run -d --name edge-app \
  -p 8080:8080 \
  myapp:v1
```

**Data Transfer Workflow**:
```
1. Order Snowcone from AWS Console
2. AWS ships device (2-3 days)
3. Connect to network, unlock with OpsHub
4. Copy data (S3 adapter or file interface)
5. Ship back to AWS
6. AWS uploads data to S3
7. Device securely erased
```

**AWS OpsHub** (GUI Management):
- Manage Snow devices visually
- Monitor data transfer
- Launch EC2 instances
- NFS file share management

---

### AWS Snowball Edge

**What**: Petabyte-scale data transfer and edge computing device.

**Variants**:

**Storage Optimized**:
- 80 TB usable storage
- 40 vCPUs, 80 GB RAM
- 1 TB SSD for compute
- Use: Large data migrations

**Compute Optimized**:
- 42 TB usable storage
- 52 vCPUs, 208 GB RAM
- 7.68 TB NVMe SSD
- Optional GPU
- Use: Edge computing, ML inference

**Compute Optimized with GPU**:
- Same as Compute Optimized
- NVIDIA V100 GPU
- Use: ML training/inference at edge

**Use Cases**:
- Data center migrations
- Disaster recovery
- Remote site data processing
- Content distribution
- Machine learning at edge
- Factory floor data analysis

**Edge Computing Capabilities**:
```yaml
# EC2 instances on Snowball Edge
Instance Types:
  - sbe1.small (1 vCPU, 2 GB RAM)
  - sbe1.medium (2 vCPUs, 4 GB RAM)
  - sbe1.large (4 vCPUs, 8 GB RAM)
  - sbe1.xlarge (8 vCPUs, 16 GB RAM)
  
Storage:
  - S3 compatible object storage
  - EBS volumes
  - NFS file shares
  
Containers:
  - ECS Anywhere
  - EKS Anywhere
```

**Clustering**:
```
Snowball Edge Cluster (5-10 devices)
├── Node 1 (Primary)
├── Node 2
├── Node 3
├── Node 4 (99.999% durability)
└── Node 5

Use Cases:
- Large-scale edge computing
- High availability applications
- Petabyte-scale local storage
```

**Data Transfer**:
```bash
# Using S3 adapter
aws s3 cp /data/ s3://snowball-bucket/ \
  --recursive \
  --endpoint https://snowball-ip:8443

# Using file interface (NFS)
mount -t nfs snowball-ip:/bucket /mnt/snowball
cp -r /data/* /mnt/snowball/
```

**Lambda Functions on Snowball**:
```python
# Deploy Lambda function to Snowball Edge
aws lambda create-function \
  --function-name edge-processor \
  --runtime python3.9 \
  --role arn:aws:iam::123456789012:role/SnowballLambdaRole \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip \
  --endpoint https://snowball-ip:8008
```

---

### AWS Snowmobile

**What**: Exabyte-scale data transfer service (shipping container).

**Specifications**:
- **Capacity**: Up to 100 PB per Snowmobile
- **Form Factor**: 45-foot shipping container
- **Security**: GPS tracking, 24/7 video surveillance, escort vehicle
- **Power**: Requires 350 kW power supply
- **Connectivity**: Multiple 10 Gbps connections

**Use Cases**:
- Data center shutdowns
- Cloud migrations (> 10 PB)
- Media and entertainment archives
- Genomics datasets
- Financial services data consolidation

**Deployment Process**:
```
1. Contact AWS (minimum 10 PB)
2. Site survey by AWS
3. Snowmobile delivered
4. AWS team sets up connections
5. Data transfer (parallel streams)
6. AWS drives back to region
7. Data uploaded to S3
8. Secure erasure of Snowmobile
```

**Timeline**:
- Site preparation: 2-4 weeks
- Data transfer: Weeks to months (depending on data size and network speed)
- Total: 2-6 months for complete migration

---

## AWS IoT Greengrass

### What is IoT Greengrass?

Edge runtime that enables IoT devices to run Lambda functions, Docker containers, and machine learning models locally.

### Why Use IoT Greengrass?

**Key Benefits**:
- **Offline Operation**: Act on local data when disconnected
- **Low Latency**: Process data locally without cloud round-trip
- **Reduced Cost**: Less data sent to cloud
- **ML at Edge**: Run ML inference locally
- **Secure**: Encrypted communication, device authentication

**Use Cases**:
- Industrial automation
- Smart buildings
- Predictive maintenance
- Video analytics at edge
- Agricultural monitoring
- Connected vehicles

### How Greengrass Works

**Architecture**:
```
AWS Cloud
├── IoT Core
├── Lambda (origin functions)
├── S3 (ML models)
└── IoT Greengrass Service
      ↓ (deployment)
Edge Device (Greengrass Core)
├── Lambda Runtime
├── Docker Runtime
├── ML Inference (SageMaker Neo)
├── Stream Manager
└── Local Shadow Service
      ↓
Local Devices (sensors, actuators)
```

**Greengrass Core Device**:
- Raspberry Pi, NVIDIA Jetson, or any Linux device
- Minimum: 1 GHz CPU, 128 MB RAM
- Runs Greengrass Core software
- Manages local deployments

### Components

**Lambda Functions**:
```python
# Greengrass Lambda function
import greengrasssdk
import json

# Initialize client
client = greengrasssdk.client('iot-data')

def lambda_handler(event, context):
    # Process sensor data locally
    temperature = event['temperature']
    
    if temperature > 80:
        # Publish alert locally
        client.publish(
            topic='alerts/temperature',
            payload=json.dumps({'alert': 'High temperature', 'value': temperature})
        )
    
    # Optionally send to cloud (batched)
    if should_send_to_cloud(temperature):
        client.publish(
            topic='$aws/things/sensor1/shadow/update',
            payload=json.dumps({'state': {'reported': {'temperature': temperature}}})
        )
    
    return temperature
```

**Connectors** (Pre-built integrations):
- **IoT Analytics**: Send data to IoT Analytics
- **Kinesis Firehose**: Stream data to Firehose
- **S3**: Upload files to S3
- **SNS**: Send notifications
- **CloudWatch**: Send metrics and logs

**Docker Containers**:
```yaml
# Deploy custom container to Greengrass
components:
  com.example.VideoAnalysis:
    version: "1.0.0"
    run:
      docker:
        image: "myrepo/video-analysis:v1"
        containerParams:
          volumes:
            - /dev/video0:/dev/video0  # Access camera
          devices:
            - /dev/video0
```

**ML Inference**:
```yaml
# Deploy SageMaker model to Greengrass
components:
  aws.greengrass.SageMakerEdgeManager:
    version: "1.0.0"
    configuration:
      models:
        - modelName: "ImageClassifier"
          modelUri: "s3://my-bucket/models/classifier.tar.gz"
          captureData: true
```

**Stream Manager**:
```python
# Local data buffering and upload
from stream_manager import StreamManagerClient, ReadMessagesOptions

client = StreamManagerClient()

# Create stream
client.create_message_stream(
    stream_name='sensor-data',
    max_size=268435456,  # 256 MB
    strategy_on_full='OverwriteOldestData',
    export_definition=ExportDefinition(
        kinesis=[KinesisConfig(
            identifier='KinesisExport',
            kinesis_stream_name='iot-sensor-data'
        )]
    )
)

# Append data
client.append_message(stream_name='sensor-data', data=sensor_reading)
```

### Deployment Model

**Greengrass Groups** (v1):
```
Greengrass Group
├── Core Device
├── Lambda Functions
├── Resources (devices, ML models)
├── Subscriptions (message routing)
└── Connectors
```

**Greengrass Components** (v2):
```
Deployment
├── Component: Lambda Function
├── Component: Docker Container
├── Component: ML Model
└── Component: Custom Software

Fleet Management
├── Thing Group: Factory Floor Devices
└── Deployment: Version 2.3.1
```

**Over-the-Air Updates**:
```bash
# Create deployment
aws greengrassv2 create-deployment \
  --target-arn arn:aws:iot:us-east-1:123456789012:thinggroup/FactoryDevices \
  --components file://components.json
```

```json
{
  "com.example.TemperatureMonitor": {
    "componentVersion": "2.0.0",
    "configurationUpdate": {
      "merge": "{\"threshold\": 85}"
    }
  }
}
```

### Local Shadows

**Device Shadow on Edge**:
```python
# Update local shadow (works offline)
client.update_thing_shadow(
    thingName='motor-1',
    payload=json.dumps({
        'state': {
            'desired': {'speed': 1500}
        }
    })
)

# Shadow syncs to cloud when connection restored
```

### Security

**Authentication**:
- X.509 certificates for core device
- AWS IoT policies for authorization
- Hardware security module (HSM) support

**Encryption**:
- TLS for cloud communication
- Local encryption for sensitive data

**Secrets Management**:
```python
# Access secrets from Lambda
import boto3

secrets_client = boto3.client('secretsmanager')

secret = secrets_client.get_secret_value(
    SecretId='arn:aws:secretsmanager:us-east-1:123456789012:secret:db-password'
)

# Use secret locally (cached)
```

---

## SAP-C02 Exam Scenarios

### Scenario 1: Manufacturing Data Processing
**Question**: Process machine data locally due to unreliable internet, with occasional cloud sync.

**Solution**:
```
AWS Snowball Edge (Compute Optimized)
├── EC2 instances (data processing)
├── S3 bucket (local storage)
└── Lambda (data transformation)

When connected:
- Snowball Edge → DataSync → S3 Region
- ML models updated from cloud

Architecture:
Machines → Snowball Edge (Local Processing) → (Periodic) → Cloud Analytics
```

### Scenario 2: AR/VR Mobile Gaming
**Question**: Deliver < 20ms latency AR experience to mobile users in major cities.

**Solution**:
```
Option 1: AWS Wavelength (Best for < 10ms)
- Deploy game servers in Wavelength Zones
- Direct 5G connection to mobile devices
- Carrier IP addresses for players

Option 2: AWS Local Zones (Good for < 20ms)
- Deploy in Local Zones near cities
- ALB for load balancing
- Regional database for global state

Recommendation: Wavelength for 5G devices, Local Zones for Wi-Fi/4G
```

### Scenario 3: Data Center Migration (50 PB)
**Question**: Migrate 50 PB data center to AWS with minimal downtime.

**Solution**:
```
Phase 1: Bulk Transfer
- AWS Snowmobile (2 units = 100 PB capacity)
- Transfer 48 PB historical data
- Timeline: 8-12 weeks

Phase 2: Ongoing Sync
- AWS DataSync (10 Gbps Direct Connect)
- Sync changes during migration
- Real-time until cutover

Phase 3: Cutover
- Final sync (< 2 TB delta)
- DNS switch to AWS
- Decommission on-premises

Total Timeline: 4-6 months
```

### Scenario 4: Hybrid AI/ML Workflow
**Question**: Train ML models on-premises (data residency), deploy to cloud for inference.

**Solution**:
```
AWS Outposts
├── SageMaker Training Jobs (on-premises data)
├── Model artifacts → S3 on Outposts
└── Transfer to Region S3 (encrypted)

AWS Region
├── SageMaker Endpoints (inference)
├── Auto-scaling based on demand
└── Model Monitor for drift

Data Flow:
On-prem Data → Outposts (Training) → Model → Region (Deployment)
```

### Scenario 5: Remote Oil Rig Monitoring
**Question**: Monitor equipment in remote location with intermittent satellite connectivity.

**Solution**:
```
AWS IoT Greengrass (on edge server at rig)
├── Lambda: Anomaly detection
├── ML Model: Predictive maintenance
├── Stream Manager: Buffer 7 days of data
└── Local Actions: Emergency shutdown

When Connected (satellite):
- Upload critical alerts (SNS)
- Sync buffered data (Kinesis)
- Download model updates

Architecture:
Sensors → Greengrass (Local Intelligence) → Satellite → IoT Core → Alerts
```

---

## Key Takeaways for SAP-C02

1. **Service Selection**
   - **Outposts**: On-premises AWS infrastructure, full control
   - **Local Zones**: Low latency to specific metro areas
   - **Wavelength**: Ultra-low latency for 5G devices
   - **Snow Family**: Data transfer and disconnected edge computing
   - **IoT Greengrass**: Edge intelligence for IoT devices

2. **Latency Requirements**
   - < 1ms: Outposts (on-premises)
   - < 10ms: Wavelength (5G edge)
   - < 20ms: Local Zones
   - < 50ms: Region with edge caching (CloudFront)

3. **Data Transfer**
   - < 10 TB: Online transfer (Direct Connect, VPN)
   - 10-80 TB: Snowcone or Snowball Edge
   - 80 TB - 10 PB: Snowball Edge (multiple)
   - > 10 PB: Snowmobile

4. **Edge Computing**
   - **Heavy compute**: Snowball Edge Compute Optimized
   - **IoT/lightweight**: IoT Greengrass
   - **Persistent infrastructure**: Outposts
   - **Mobile edge**: Wavelength

5. **Hybrid Patterns**
   - **Outposts**: Seamless extension of VPC
   - **Direct Connect**: Low-latency dedicated connection
   - **VPN**: Encrypted connectivity over internet
   - **Storage Gateway**: Hybrid storage integration

6. **High Availability**
   - Outposts: No multi-AZ, backup to Region
   - Local Zones: Single zone, failover to Region
   - Wavelength: Single zone per carrier location
   - Snow: Clustering for Snowball Edge

7. **Cost Optimization**
   - Outposts: 3-year commitment
   - Local Zones: Pay-as-you-go (same as Region)
   - Wavelength: Pay-as-you-go
   - Snow Family: Device rental + shipping costs
