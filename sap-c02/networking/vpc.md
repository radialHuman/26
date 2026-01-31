# Amazon VPC (Virtual Private Cloud)

## What is VPC?

Amazon VPC is a logically isolated virtual network within AWS where you launch AWS resources. Think of it as your own private data center in the cloud with complete control over IP addressing, subnets, routing, and security.

## Why Use VPC?

### Key Benefits
- **Isolation**: Logically isolated from other virtual networks
- **Control**: Complete control over network configuration
- **Security**: Multiple layers (Security Groups, NACLs, routing)
- **Connectivity**: Connect to on-premises via VPN or Direct Connect
- **Scalability**: Grow network as needed
- **High Availability**: Multi-AZ deployment

### Use Cases
- Host applications and databases
- Multi-tier web applications
- Hybrid cloud architectures
- Disaster recovery
- Secure development environments
- Compliance and regulatory requirements

## VPC Core Concepts

### CIDR Blocks

**IPv4 CIDR**: Primary IP address range for VPC
- **Range**: /16 to /28 (65,536 to 16 IPs)
- **Recommended**: /16 (10.0.0.0/16 = 65,536 IPs)
- **Cannot change** primary CIDR after creation
- **Can add** secondary CIDRs (up to 5 total)

**Private IP Ranges** (RFC 1918):
```
10.0.0.0/8        (10.0.0.0 - 10.255.255.255)
172.16.0.0/12     (172.16.0.0 - 172.31.255.255)
192.168.0.0/16    (192.168.0.0 - 192.168.255.255)
```

**Best Practices**:
```
Production VPC:    10.0.0.0/16
Development VPC:   10.1.0.0/16
Staging VPC:       10.2.0.0/16
On-premises:       192.168.0.0/16
```

Avoid overlapping CIDRs for VPC peering or VPN connections.

**IPv6 CIDR**: Optional, AWS-provided /56 CIDR
- All IPv6 addresses are public
- Dual-stack (IPv4 + IPv6) supported

### Subnets

**What**: Segment of VPC CIDR in specific Availability Zone

**Types**:

**1. Public Subnet**:
- Has route to Internet Gateway
- Instances can have public IPs
- Used for: Web servers, load balancers, NAT gateways

**2. Private Subnet**:
- No direct internet route
- Instances have private IPs only
- Used for: Application servers, databases

**3. Isolated Subnet** (Private with no NAT):
- No internet connectivity
- Used for: High-security databases, compliance workloads

**CIDR Requirements**:
- Must be subset of VPC CIDR
- Cannot overlap with other subnets
- Min size: /28 (16 IPs, 11 usable)
- Max size: /16 (65,536 IPs)

**Reserved IPs** (per subnet):
```
Subnet: 10.0.1.0/24 (256 total IPs)
10.0.1.0      Network address
10.0.1.1      VPC router
10.0.1.2      DNS server
10.0.1.3      Future use
10.0.1.255    Broadcast (not supported but reserved)

Usable: 251 IPs (256 - 5)
```

**Example Subnet Design**:
```
VPC: 10.0.0.0/16

Availability Zone A:
├── Public:  10.0.1.0/24   (251 IPs)
├── Private: 10.0.2.0/24   (251 IPs)
└── DB:      10.0.3.0/24   (251 IPs)

Availability Zone B:
├── Public:  10.0.11.0/24  (251 IPs)
├── Private: 10.0.12.0/24  (251 IPs)
└── DB:      10.0.13.0/24  (251 IPs)

Availability Zone C:
├── Public:  10.0.21.0/24  (251 IPs)
├── Private: 10.0.22.0/24  (251 IPs)
└── DB:      10.0.23.0/24  (251 IPs)
```

### Route Tables

**What**: Rules determining where network traffic is directed

**Components**:
- **Destination**: CIDR block or prefix list
- **Target**: Where to send traffic (IGW, NAT, VGW, etc.)

**Main Route Table**: Default for VPC (implicit)
**Custom Route Tables**: Explicitly associated with subnets

**Public Subnet Route Table**:
```
Destination       Target
10.0.0.0/16       local
0.0.0.0/0         igw-1234567890abcdef0
```

**Private Subnet Route Table**:
```
Destination       Target
10.0.0.0/16       local
0.0.0.0/0         nat-0abcd1234efgh5678
```

**Route Priority**:
1. Most specific route (longest prefix match)
2. Propagated routes from VGW
3. Static routes

**Example**:
```
10.0.0.0/16    → local (most specific)
10.0.0.0/8     → vpn-gateway
0.0.0.0/0      → internet-gateway
```

Traffic to 10.0.1.5 uses local route.

### Internet Gateway (IGW)

**What**: Horizontally scaled, redundant gateway for internet access

**Characteristics**:
- One IGW per VPC
- Highly available (managed by AWS)
- No bandwidth constraints
- No additional charges

**Purpose**:
1. Target for internet-routable traffic in route tables
2. Performs NAT for instances with public IPs

**Public Instance Requirements**:
1. Public IP or Elastic IP
2. Subnet route table points to IGW
3. Security Group allows traffic
4. NACL allows traffic

**Egress-Only Internet Gateway** (IPv6):
- IPv6 traffic outbound only
- Prevents inbound IPv6 connections
- Like NAT Gateway but for IPv6

### NAT Gateway

**What**: Managed NAT service for private subnet internet access

**Characteristics**:
- Deployed in **public subnet**
- Requires Elastic IP
- Managed by AWS (HA within AZ)
- 5 Gbps bandwidth, scales to 100 Gbps
- Supports TCP, UDP, ICMP

**Cost**:
- $0.045/hour
- $0.045/GB processed
- ~$32/month + data transfer

**High Availability**:
```
VPC
├── AZ-A: NAT Gateway (EIP) in public subnet
│         Private subnet → NAT-A → IGW
│
├── AZ-B: NAT Gateway (EIP) in public subnet
│         Private subnet → NAT-B → IGW
│
└── AZ-C: NAT Gateway (EIP) in public subnet
          Private subnet → NAT-C → IGW
```

**One NAT Gateway per AZ** for redundancy.

**Route Table** (Private Subnet AZ-A):
```
Destination       Target
10.0.0.0/16       local
0.0.0.0/0         nat-gateway-az-a
```

### NAT Instance (Legacy)

**What**: EC2 instance performing NAT

**Why Consider**:
- Cost savings (small instance)
- Can use as bastion host
- More control

**Why NOT Recommended**:
- Single point of failure
- Manual management
- Bandwidth limited by instance type
- Must disable source/destination check

**Cost Comparison**:
```
NAT Gateway: $32/month + $0.045/GB
NAT Instance: 
  t3.nano: $3.80/month + EC2 data transfer
  But: Manual management, no HA, lower performance
```

**When to Use NAT Instance**:
- Very low traffic
- Cost is critical
- Need bastion host functionality

**Configuration**:
```
1. Launch EC2 in public subnet
2. Disable source/dest check
3. Create Elastic IP
4. Update route table:
   0.0.0.0/0 → eni-xxxxx (NAT instance)
5. Configure iptables for NAT
```

## Security

### Security Groups

**What**: Stateful virtual firewall at instance level

**Characteristics**:
- **Stateful**: Return traffic automatically allowed
- **Allow rules only**: Cannot create deny rules
- **Default**: All inbound denied, all outbound allowed
- **Evaluation**: All rules evaluated (not top-to-bottom)
- **Changes**: Take effect immediately

**Inbound Rules**:
```
Type        Protocol  Port Range  Source
HTTP        TCP       80          0.0.0.0/0
HTTPS       TCP       443         0.0.0.0/0
SSH         TCP       22          sg-1234abcd (bastion SG)
MySQL       TCP       3306        sg-5678efgh (app tier SG)
```

**Outbound Rules**:
```
Type        Protocol  Port Range  Destination
All traffic All       All         0.0.0.0/0
```

**Referencing Security Groups**:
```
Web Tier SG:
  Inbound: Port 80/443 from 0.0.0.0/0
  Outbound: Port 3306 to App Tier SG

App Tier SG:
  Inbound: Port 3306 from Web Tier SG
  Outbound: All to 0.0.0.0/0
```

**Best Practices**:
1. Least privilege (only necessary ports)
2. Reference SGs instead of CIDR blocks
3. Separate SGs for tiers (web, app, db)
4. Use descriptive names and tags
5. Regular audit

### Network ACLs (NACLs)

**What**: Stateless firewall at subnet level

**Characteristics**:
- **Stateless**: Must allow return traffic explicitly
- **Rules**: Allow and Deny
- **Default**: Allow all inbound/outbound
- **Evaluation**: Lowest numbered rule first
- **Changes**: Take effect immediately

**Rule Components**:
- Rule number (1-32766)
- Protocol (TCP, UDP, ICMP, or all)
- Port range
- Source/Destination CIDR
- Allow or Deny

**Example NACL**:

**Inbound**:
```
Rule #  Type        Protocol  Port    Source        Allow/Deny
100     HTTP        TCP       80      0.0.0.0/0     ALLOW
110     HTTPS       TCP       443     0.0.0.0/0     ALLOW
120     SSH         TCP       22      10.0.0.0/16   ALLOW
130     Ephemeral   TCP       1024-   0.0.0.0/0     ALLOW
                              65535
*       All traffic All       All     0.0.0.0/0     DENY
```

**Outbound**:
```
Rule #  Type        Protocol  Port    Destination   Allow/Deny
100     HTTP        TCP       80      0.0.0.0/0     ALLOW
110     HTTPS       TCP       443     0.0.0.0/0     ALLOW
120     Ephemeral   TCP       1024-   0.0.0.0/0     ALLOW
                              65535
*       All traffic All       All     0.0.0.0/0     DENY
```

**Ephemeral Ports**: Temporary ports for return traffic
- Linux: 32768-60999
- Windows: 49152-65535
- Recommended: 1024-65535 (covers all)

**Security Groups vs NACLs**:

| Feature | Security Group | NACL |
|---------|---------------|------|
| Level | Instance | Subnet |
| State | Stateful | Stateless |
| Rules | Allow only | Allow and Deny |
| Processing | All rules | Order matters |
| Application | Selective instances | All instances in subnet |
| Default | Deny inbound | Allow all |

**When to Use NACLs**:
- Additional layer of security
- Deny specific IP addresses
- Subnet-level blocking
- Compliance requirements

**Best Practice**:
```
Security Groups: Primary security control
NACLs: Additional defense layer (deny known bad IPs)
```

### VPC Flow Logs

**What**: Capture IP traffic information

**Levels**:
- VPC level (all ENIs in VPC)
- Subnet level (all ENIs in subnet)
- ENI level (specific network interface)

**Destinations**:
- CloudWatch Logs
- S3
- Kinesis Data Firehose

**Log Format**:
```
<version> <account-id> <interface-id> <srcaddr> <dstaddr> <srcport> <dstport> <protocol> <packets> <bytes> <start> <end> <action> <log-status>

Example:
2 123456789012 eni-abc123de 172.31.16.139 172.31.16.21 49761 443 6 20 4249 1418530010 1418530070 ACCEPT OK
```

**Fields**:
- **srcaddr/dstaddr**: Source/destination IP
- **srcport/dstport**: Source/destination port
- **protocol**: IANA protocol number (6=TCP, 17=UDP, 1=ICMP)
- **action**: ACCEPT or REJECT
- **log-status**: OK, NODATA, SKIPDATA

**Use Cases**:
1. **Security analysis**: Detect unusual traffic patterns
2. **Troubleshooting**: Diagnose connectivity issues
3. **Compliance**: Audit network access
4. **Cost optimization**: Identify high-volume traffic

**Analysis with CloudWatch Insights**:
```
fields @timestamp, srcAddr, dstAddr, action
| filter action = "REJECT"
| stats count() by srcAddr
| sort count desc
```

**Analysis with Athena** (S3 destination):
```sql
SELECT srcaddr, dstaddr, SUM(bytes) as total_bytes
FROM vpc_flow_logs
WHERE action = 'ACCEPT'
GROUP BY srcaddr, dstaddr
ORDER BY total_bytes DESC
LIMIT 10;
```

**Cost**:
- CloudWatch Logs: $0.50 per GB ingested + $0.03 per GB stored
- S3: Storage costs only
- Ingestion: $0.50 per GB

**Best Practice**:
- Enable on production VPCs
- Send to S3 for cost-effective long-term storage
- Use Athena for analysis
- Set up alarms for REJECT spikes

## VPC Peering

**What**: Private connection between two VPCs

**Characteristics**:
- Uses AWS private network
- No single point of failure
- No bandwidth bottleneck
- Cross-region supported
- Cross-account supported

**Limitations**:
- **Not transitive**: VPC A ↔ VPC B ↔ VPC C (A cannot reach C)
- **No overlapping CIDRs**: Must have unique IP ranges
- **Route tables**: Must update both sides
- **Security**: Security Groups can reference peered VPC SGs (same region)

**Configuration**:

**Step 1: Create Peering Connection**
```
VPC A (10.0.0.0/16) ← Peering Connection → VPC B (10.1.0.0/16)
```

**Step 2: Update Route Tables**
```
VPC A Route Table:
10.0.0.0/16    local
10.1.0.0/16    pcx-1234567890abcdef0

VPC B Route Table:
10.1.0.0/16    local
10.0.0.0/16    pcx-1234567890abcdef0
```

**Step 3: Update Security Groups**
```
VPC A Security Group:
Allow from 10.1.0.0/16 (or sg-xxxxx from VPC B)

VPC B Security Group:
Allow from 10.0.0.0/16 (or sg-yyyyy from VPC A)
```

**Use Cases**:
- Shared services VPC (Active Directory, monitoring)
- Multi-tier applications across VPCs
- Development/staging environment access

**Cost**:
- Data transfer: $0.01/GB (same region), $0.02/GB (cross-region)

**Hub-and-Spoke with Peering** (Limited):
```
      VPC-Hub
      /  |  \
     /   |   \
    A    B    C

Requires: 3 peering connections
Limitation: A, B, C cannot communicate
Better option: Transit Gateway
```

## VPC Endpoints

**What**: Private connection to AWS services without internet/NAT

**Benefits**:
- Improved security (traffic stays in AWS network)
- Lower latency
- No bandwidth constraints
- No NAT Gateway costs for AWS service traffic

### Types

**1. Gateway Endpoints** (Free):

**Services**: S3, DynamoDB only

**How it Works**:
- Creates entry in route table
- Regional service
- Highly available by design

**Configuration**:
```
Create Gateway Endpoint for S3
Associated Route Table:
  10.0.0.0/16           local
  pl-xxxxx (S3 prefix)  vpce-1234567890abcdef0
```

**Endpoint Policy**:
```json
{
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:*",
    "Resource": [
      "arn:aws:s3:::my-bucket",
      "arn:aws:s3:::my-bucket/*"
    ]
  }]
}
```

**Use Case**:
```
EC2 (Private Subnet) → Gateway Endpoint → S3
(No NAT Gateway needed, no data transfer charges to S3)
```

**2. Interface Endpoints** (PrivateLink):

**Services**: 100+ AWS services (API Gateway, SNS, SQS, Kinesis, etc.)

**How it Works**:
- Creates ENI with private IP in subnet
- Uses PrivateLink technology
- Powered by AWS PrivateLink

**Cost**:
- $0.01/hour per AZ (~$7/month per endpoint per AZ)
- $0.01/GB data processed

**Configuration**:
```
Create Interface Endpoint for SNS
├── ENI in subnet (10.0.1.50)
├── Security Group (allow HTTPS from VPC)
└── Private DNS enabled

Access: sns.us-east-1.amazonaws.com → 10.0.1.50
```

**High Availability**:
```
Create endpoint in multiple AZs:
├── AZ-A: ENI (10.0.1.50)
├── AZ-B: ENI (10.0.11.50)
└── AZ-C: ENI (10.0.21.50)
```

**Private DNS**:
- Enabled: Use regular AWS service endpoint (sns.us-east-1.amazonaws.com)
- Disabled: Use VPC endpoint-specific DNS

**Use Cases**:
- Access AWS services from private subnets without NAT
- On-premises access via Direct Connect/VPN
- Cross-VPC service access

**Example Architecture**:
```
EC2 (Private) → Interface Endpoint → SNS
              → Interface Endpoint → SQS
              → Gateway Endpoint → S3

No NAT Gateway needed for AWS services
```

### Endpoint Services (PrivateLink)

**What**: Expose your own services to other VPCs

**Use Case**: SaaS providers, multi-tenant architectures

**Architecture**:
```
Provider VPC:
  NLB → Your Application

Consumer VPC:
  Interface Endpoint → Provider's NLB
```

**Benefits**:
- Private connectivity
- No VPC peering needed
- Scales to thousands of consumers
- Consumer doesn't need to know provider's CIDR

**Configuration**:

**Provider**:
```
1. Create Network Load Balancer
2. Create VPC Endpoint Service
3. Configure acceptance required (manual approval)
4. Share service name with consumers
```

**Consumer**:
```
1. Create Interface Endpoint using service name
2. Wait for approval
3. Access via private DNS or endpoint DNS
```

**Example**:
```
Consumer VPC (10.0.0.0/16)
  → VPC Endpoint (10.0.1.100)
    → PrivateLink
      → Provider NLB (10.1.1.50)
        → Provider Application

No CIDR overlap issues
No route table changes
```

## VPN Connectivity

### Site-to-Site VPN

**What**: IPsec VPN connection between VPC and on-premises

**Components**:
1. **Virtual Private Gateway (VGW)**: VPN concentrator on AWS side
2. **Customer Gateway (CGW)**: Physical or software appliance on customer side
3. **VPN Connection**: Two IPsec tunnels for redundancy

**Architecture**:
```
On-Premises
  ├── Customer Gateway Device (CGW)
  │   ├── Tunnel 1 (Active)
  │   └── Tunnel 2 (Standby)
  │
  ↓ IPsec over Internet
  │
AWS VPC
  └── Virtual Private Gateway (VGW)
      └── Attached to VPC
```

**Characteristics**:
- **Encryption**: IPsec
- **Bandwidth**: Up to 1.25 Gbps per tunnel
- **Redundancy**: 2 tunnels (different AZs)
- **Cost**: $0.05/hour per connection (~$36/month)
- **Routing**: Static or BGP (dynamic)

**Configuration Steps**:

**1. Create Customer Gateway**:
```
IP Address: Your public IP (e.g., 203.0.113.1)
BGP ASN: 65000 (if using BGP)
```

**2. Create Virtual Private Gateway**:
```
Attach to VPC
Enable route propagation in route tables
```

**3. Create VPN Connection**:
```
Customer Gateway: cgw-xxxxx
Virtual Private Gateway: vgw-yyyyy
Routing: Static or Dynamic (BGP)
Tunnel Options: Pre-shared keys, encryption algorithms
```

**4. Update Route Tables**:
```
Enable route propagation:
  On-premises: 192.168.0.0/16 → vgw-yyyyy (propagated)
```

**5. Configure Customer Gateway Device**:
Download configuration file for your device (Cisco, Juniper, etc.)

**Routing Options**:

**Static Routing**:
```
Specify on-premises CIDRs manually
Simple, less flexible
```

**Dynamic Routing (BGP)**:
```
Use BGP to automatically exchange routes
Recommended for failover scenarios
ASN: 7224 (AWS default) or custom
```

**Use Cases**:
- Hybrid cloud connectivity
- Disaster recovery
- Data center migration
- Backup connectivity (with Direct Connect)

**Limitations**:
- Internet-dependent (latency, reliability)
- Bandwidth limited (1.25 Gbps per tunnel)
- Encryption overhead

### AWS VPN CloudHub

**What**: Connect multiple sites to each other via AWS

**Architecture**:
```
       AWS VPC (VGW)
       /    |    \
      /     |     \
    Site1  Site2  Site3
  (CGW-1) (CGW-2) (CGW-3)
```

**How it Works**:
- Create multiple Customer Gateways
- Create VPN connections to same VGW
- Use BGP for routing
- Sites communicate via AWS network

**Use Case**:
- Connect multiple branch offices
- Each office can reach others through AWS

**Cost**:
- $0.05/hour per VPN connection
- 3 sites = $0.15/hour (~$108/month)

**Configuration**:
```
1. Create 3 Customer Gateways (one per site)
2. Create 3 VPN Connections (all to same VGW)
3. Enable BGP with unique ASNs
4. Sites advertise routes to each other
```

### Client VPN

**What**: Managed VPN service for remote users

**Use Cases**:
- Remote workforce access
- Contractor access
- Secure access to private resources

**Authentication**:
- Active Directory
- Mutual certificate authentication (TLS)
- Single Sign-On (SAML 2.0)

**Architecture**:
```
Remote Users
  ├── VPN Client Software
  │   └── Connect to Client VPN Endpoint
  │
  ↓ TLS VPN
  │
AWS VPC
  └── Client VPN Endpoint
      └── Access to private resources
```

**Configuration**:
```
1. Create server certificate and upload to ACM
2. Create Client VPN Endpoint
   - Authentication: Certificate, AD, SAML
   - CIDR: 10.100.0.0/16 (separate from VPC)
   - VPC subnets to associate
3. Create authorization rules
   - Who can access what
4. Add route table entries
   - Destination: 10.0.0.0/16 → Target: VPC
```

**Cost**:
- $0.10/hour per associated subnet-hour
- $0.05/hour per active connection-hour
- Data transfer charges

**Example Cost** (10 concurrent users, 2 AZs):
```
Endpoint: $0.10 × 2 AZs × 730 hours = $146/month
Connections: $0.05 × 10 users × 730 hours = $365/month
Total: ~$511/month
```

## Transit Gateway

**What**: Cloud router connecting VPCs, on-premises networks, and remote users

**Why Use**:
- Simplifies complex network topologies
- Transitive routing (hub-and-spoke)
- Centralized management
- Scales to thousands of VPCs

**Architecture**:
```
      Transit Gateway
      /    |    |    \
     /     |    |     \
  VPC-1  VPC-2 VPN  Direct Connect
```

**vs VPC Peering**:
| Feature | VPC Peering | Transit Gateway |
|---------|-------------|-----------------|
| Transitive | No | Yes |
| Connections | N×(N-1)/2 | N |
| Routing | Per VPC | Centralized |
| Bandwidth | No limit | 50 Gbps per AZ |
| Cost | $0.01/GB | $0.05/hour + $0.02/GB |

**Example**:
```
5 VPCs:
Peering: 10 connections needed
Transit Gateway: 5 attachments
```

**Concepts**:

**Transit Gateway Attachment**:
- VPC attachment
- VPN attachment
- Direct Connect Gateway attachment
- Peering attachment (cross-region)

**Route Tables**:
- Control traffic flow between attachments
- Multiple route tables for segmentation

**Configuration**:

**1. Create Transit Gateway**:
```
ASN: 64512 (BGP)
DNS support: Enabled
VPN ECMP support: Enabled
Default route table association: Yes
```

**2. Attach VPCs**:
```
Create attachment for each VPC
Specify subnets in each AZ
```

**3. Update VPC Route Tables**:
```
Destination       Target
10.0.0.0/8        tgw-1234567890abcdef0
192.168.0.0/16    tgw-1234567890abcdef0
```

**4. Configure TGW Route Tables**:
```
Associations: Which attachments use which route table
Propagations: Which routes are added automatically
Static routes: Manual routes
```

**Advanced Features**:

**Route Table Isolation**:
```
Production Route Table:
  ├── VPC-Prod-1
  ├── VPC-Prod-2
  └── VPN (on-premises)

Development Route Table:
  ├── VPC-Dev-1
  └── VPC-Dev-2

Production ✗ Development (isolated)
```

**Inter-Region Peering**:
```
TGW us-east-1 ↔ Peering ↔ TGW eu-west-1
    ↓                          ↓
  VPCs (US)                 VPCs (EU)
```

**Multicast Support**:
```
Sources → Multicast Group → Transit Gateway → Receivers
Use case: Media streaming, market data distribution
```

**Cost**:
- $0.05/hour per attachment (~$36/month)
- $0.02/GB data processed
- Inter-region peering: $0.02/GB

**Use Cases**:
1. **Centralized Network Hub**:
```
      Transit Gateway
      /    |    |    \
  VPC-A VPC-B VPN  DX

All VPCs can reach each other and on-premises
```

2. **Shared Services**:
```
Shared Services VPC (AD, monitoring)
        ↓
  Transit Gateway
   /    |    \
 VPC-1 VPC-2 VPC-3

All VPCs access shared services
```

3. **Network Segmentation**:
```
TGW with multiple route tables:
- Production (isolated)
- Development (isolated)
- Shared services (accessible to both)
```

## Direct Connect

**What**: Dedicated network connection from on-premises to AWS

**vs VPN**:
| Feature | Direct Connect | Site-to-Site VPN |
|---------|---------------|------------------|
| Connection | Dedicated fiber | Internet |
| Bandwidth | 1-100 Gbps | 1.25 Gbps per tunnel |
| Latency | Low, consistent | Variable |
| Cost | Higher setup + monthly | Lower, hourly |
| Setup time | Weeks/months | Minutes |
| Encryption | Not by default | Yes (IPsec) |

**Port Speeds**:
- 1 Gbps
- 10 Gbps
- 100 Gbps

**Hosted Connections** (via partners):
- 50 Mbps to 10 Gbps

**Architecture**:
```
On-Premises
  ↓ (Single-mode fiber)
Customer/Partner Cage (DX Location)
  ↓ (Cross-connect)
AWS Direct Connect Location
  ↓ (AWS Network)
Virtual Private Gateway (VPC)
  or
Direct Connect Gateway (Multiple VPCs/Regions)
```

**Virtual Interfaces (VIFs)**:

**1. Private VIF**:
- Access VPC via VGW or Direct Connect Gateway
- Use private IP addresses
- BGP required

**2. Public VIF**:
- Access AWS public services (S3, DynamoDB)
- Use public IP addresses
- BGP required

**3. Transit VIF**:
- Connect to Transit Gateway
- Access multiple VPCs via Transit Gateway

**Direct Connect Gateway**:

**What**: Connect DX to multiple VPCs across regions

**Architecture**:
```
On-Premises
  ↓
Direct Connect
  ↓
Direct Connect Gateway
  ├── VGW (VPC us-east-1)
  ├── VGW (VPC us-west-2)
  └── VGW (VPC eu-west-1)
```

**Benefits**:
- Single DX connection to multiple VPCs
- Cross-region connectivity
- Up to 10 VGWs per Direct Connect Gateway

**Redundancy**:

**High Availability**:
```
On-Premises
  ├── Router 1 → DX Connection 1 (Location A) → AWS
  └── Router 2 → DX Connection 2 (Location B) → AWS
```

**Best Practice**: 
- 2 DX connections
- Different DX locations
- Different routers on-premises

**Backup with VPN**:
```
Primary: Direct Connect (high bandwidth, low latency)
Backup: Site-to-Site VPN (failover if DX fails)
```

**LAG (Link Aggregation Group)**:
- Combine up to 4 connections
- Same bandwidth, same location
- Treated as single connection
- Active-Active

**Encryption**:

**Option 1: VPN over Direct Connect**:
```
On-Premises → Direct Connect (Public VIF) → VPN Connection → VPC
```
- IPsec encryption
- Combines DX reliability with VPN security

**Option 2: MACsec** (Layer 2 encryption):
```
On-Premises → MACsec → Direct Connect → AWS
```
- 10 Gbps and 100 Gbps connections only
- AWS managed or customer managed keys

**Cost**:
- Port hours: $0.30/hour (1 Gbps) to $2.25/hour (100 Gbps)
- Data transfer out: $0.02/GB (lower than internet)
- No data transfer in charges

**Example** (1 Gbps, 10 TB/month out):
```
Port: $0.30 × 730 hours = $219/month
Data out: 10,000 GB × $0.02 = $200/month
Total: $419/month
```

**Use Cases**:
- Large data transfers (backups, migrations)
- Real-time data feeds (financial, media)
- Hybrid cloud architectures
- Consistent network performance

## IPv6 in VPC

**Enabling IPv6**:
```
1. Associate IPv6 CIDR with VPC (AWS-provided /56)
2. Associate IPv6 CIDR with subnets (/64)
3. Update route tables
4. Update security groups and NACLs
5. Enable IPv6 on instances
```

**Dual-Stack**:
- VPC supports both IPv4 and IPv6
- Instances get both IPv4 and IPv6 addresses

**Route Table** (IPv6):
```
Destination              Target
10.0.0.0/16              local
::/0                     igw-xxxxx (Internet Gateway)
2600:1234:5678::/56      local (IPv6 CIDR)
```

**Egress-Only Internet Gateway**:
```
Destination              Target
::/0                     eigw-xxxxx
```
- IPv6 outbound only (like NAT for IPv6)

**Security Groups** (IPv6):
```
Type     Protocol  Port  Source
HTTP     TCP       80    ::/0
```

**Use Cases**:
- Exhaust of IPv4 addresses
- Modern applications requiring IPv6
- Compliance requirements

## VPC Best Practices

### 1. Design for Growth
```
Use /16 VPC CIDR (65,536 IPs)
Don't use all space initially
Reserve space for future subnets
```

### 2. Multi-AZ Architecture
```
Always deploy across ≥2 AZs
Subnet in each AZ for each tier
```

### 3. Network Segmentation
```
Public Subnet: Bastion, NAT, Load Balancers
Private Subnet: Applications
Isolated Subnet: Databases
```

### 4. Security in Depth
```
Security Groups: Primary control (allow only)
NACLs: Additional layer (block known threats)
VPC Flow Logs: Monitoring and compliance
```

### 5. Cost Optimization
```
Use Gateway Endpoints (free) for S3/DynamoDB
Single NAT Gateway if cost > availability
VPC Peering instead of Transit Gateway (if simple)
```

### 6. High Availability
```
Multi-AZ NAT Gateways
Redundant VPN connections
Direct Connect with VPN backup
```

### 7. Monitoring
```
Enable VPC Flow Logs
CloudWatch metrics for NAT Gateway
VPN tunnel status monitoring
```

## Real-World Scenarios

### Scenario 1: Multi-Tier Web Application

**Requirements**:
- 3-tier (web, app, database)
- High availability
- Internet access for app tier (patches)
- Secure database

**Solution**:
```
VPC: 10.0.0.0/16

AZ-A:
├── Public:  10.0.1.0/24  (Web servers, ALB, NAT-A)
├── Private: 10.0.2.0/24  (App servers)
└── DB:      10.0.3.0/24  (RDS Multi-AZ)

AZ-B:
├── Public:  10.0.11.0/24 (Web servers, ALB, NAT-B)
├── Private: 10.0.12.0/24 (App servers)
└── DB:      10.0.13.0/24 (RDS standby)

Internet Gateway
NAT Gateways (one per AZ)

Route Tables:
├── Public: 0.0.0.0/0 → IGW
├── Private: 0.0.0.0/0 → NAT Gateway (per AZ)
└── DB: 10.0.0.0/16 → local only

Security Groups:
├── ALB: 80/443 from 0.0.0.0/0
├── Web: 80/443 from ALB SG
├── App: 8080 from Web SG
└── DB: 3306 from App SG
```

**Cost** (~monthly):
```
NAT Gateways: $64 (2×$32)
Data transfer: $45 per TB
```

### Scenario 2: Hybrid Cloud with Direct Connect

**Requirements**:
- On-premises 192.168.0.0/16
- AWS VPCs in multiple regions
- High bandwidth
- Secure

**Solution**:
```
On-Premises (192.168.0.0/16)
  ↓
Direct Connect (10 Gbps)
  ↓
Direct Connect Gateway
  ├── VPC us-east-1 (10.0.0.0/16)
  ├── VPC us-west-2 (10.1.0.0/16)
  └── VPC eu-west-1 (10.2.0.0/16)

Backup: Site-to-Site VPN

Encryption: VPN over DX Public VIF

BGP Configuration:
- On-premises advertises: 192.168.0.0/16
- AWS advertises: 10.0.0.0/8
```

**Cost** (~monthly):
```
Direct Connect 10 Gbps: $1,642
Data transfer (100 TB): $2,000
VPN backup: $36
Total: $3,678
```

### Scenario 3: Network Isolation for Compliance

**Requirements**:
- Production isolated from development
- Shared services (AD, monitoring)
- Audit all network traffic

**Solution**:
```
Transit Gateway
  ├── Production Route Table
  │   ├── VPC-Prod-1
  │   ├── VPC-Prod-2
  │   └── Shared Services VPC
  │
  └── Development Route Table
      ├── VPC-Dev-1
      ├── VPC-Dev-2
      └── Shared Services VPC

Isolation:
- Prod and Dev cannot communicate
- Both access Shared Services

VPC Flow Logs:
- All VPCs → S3 → Athena for analysis
- CloudWatch alarms for anomalies

Compliance:
- NACLs block specific IP ranges
- Security Groups with least privilege
- Regular audits via AWS Config
```

**Cost** (~monthly):
```
Transit Gateway: $180 (5 attachments × $36)
Data processing: $200 (10 TB × $0.02)
Flow Logs: $50
Total: $430
```

### Scenario 4: SaaS Multi-Tenant Architecture

**Requirements**:
- Isolate customer data
- Private connectivity to customers
- Scalable

**Solution**:
```
Provider VPC:
  Network Load Balancer
    ↓
  Application (multi-tenant)
    ↓
  Database (tenant-id partitioned)

VPC Endpoint Service (PrivateLink)
  ↓
Customer VPCs:
  ├── Customer A (Interface Endpoint)
  ├── Customer B (Interface Endpoint)
  └── Customer C (Interface Endpoint)

Benefits:
- Customers don't expose public IPs
- Provider doesn't need VPC peering
- Scales to thousands of customers
- No CIDR conflicts
```

**Cost** (~monthly per customer):
```
Interface Endpoint: $7 per AZ
Data transfer: $0.01/GB
Provider side: NLB $16 + processing
```

### Scenario 5: Global Application with Low Latency

**Requirements**:
- Users worldwide
- Low latency
- Multi-region active-active

**Solution**:
```
Route 53 (Geolocation routing)
  ├── US users → us-east-1
  ├── EU users → eu-west-1
  └── APAC users → ap-southeast-1

Each Region:
  VPC with Multi-AZ architecture
  CloudFront (static content)
  Aurora Global Database (cross-region replication)

Inter-region:
  Transit Gateway Peering
  (for admin access and data sync)

Benefits:
- <50ms latency (local region)
- Automatic failover
- Global database with <1s replication lag
```

**Cost** (~monthly per region):
```
VPC resources: $100
CloudFront: $200 (1 TB)
Aurora Global: $500
Transit Gateway: $36
Total per region: $836
```

## Exam Tips (SAP-C02)

### Key Decision Points

**Internet Access**:
- **Public subnet**: IGW
- **Private subnet**: NAT Gateway/Instance

**AWS Service Access**:
- **S3, DynamoDB**: Gateway Endpoint (free)
- **Other services**: Interface Endpoint (PrivateLink)

**VPC Connectivity**:
- **Simple, 2-3 VPCs**: VPC Peering
- **Complex, many VPCs**: Transit Gateway
- **On-premises**: Direct Connect or VPN

**Bandwidth Needs**:
- **<1 Gbps**: VPN
- **>1 Gbps**: Direct Connect

**Security**:
- **Instance-level**: Security Groups (stateful)
- **Subnet-level**: NACLs (stateless)
- **Deny specific IPs**: NACL
- **Traffic visibility**: VPC Flow Logs

**High Availability**:
- **NAT**: One per AZ
- **VPN**: 2 connections
- **Direct Connect**: 2 connections, 2 locations

### Common Scenarios

**"Cannot reach internet from private subnet"**:
- Check: NAT Gateway in public subnet?
- Check: Route table 0.0.0.0/0 → NAT?
- Check: Security Group/NACL allows traffic?

**"Need to connect 10 VPCs"**:
- Use Transit Gateway (not peering)
- 10 attachments vs 45 peering connections

**"Reduce NAT Gateway costs"**:
- Use Gateway Endpoints for S3/DynamoDB
- Single NAT (if HA not critical)
- Interface Endpoints for other AWS services

**"Comply with data residency"**:
- VPC in specific region
- VPC Endpoints (traffic stays in region)
- No public IPs

**"Low latency to on-premises"**:
- Direct Connect (not VPN)
- Direct Connect Gateway for multi-region

**"Isolate production from development"**:
- Separate VPCs
- Transit Gateway with isolated route tables
- No peering between prod and dev

This comprehensive VPC guide covers networking fundamentals to advanced architectures for SAP-C02 exam mastery.
