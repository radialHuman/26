# Amazon VPC & Networking: Complete Guide

## Table of Contents
1. [Networking Fundamentals](#networking-fundamentals)
2. [VPC History & Evolution](#vpc-history--evolution)
3. [VPC Core Concepts](#vpc-core-concepts)
4. [Subnets & CIDR](#subnets--cidr)
5. [Internet Gateway & NAT](#internet-gateway--nat)
6. [Route Tables](#route-tables)
7. [Security Groups vs NACLs](#security-groups-vs-nacls)
8. [VPC Peering & Transit Gateway](#vpc-peering--transit-gateway)
9. [VPC Endpoints](#vpc-endpoints)
10. [Docker Network Simulations](#docker-network-simulations)
11. [Interview Questions](#interview-questions)

---

## Networking Fundamentals

### OSI Model & TCP/IP

**OSI Layers**:
```
Layer 7: Application (HTTP, FTP, DNS)
Layer 6: Presentation (SSL/TLS)
Layer 5: Session
Layer 4: Transport (TCP, UDP) ← Security Groups
Layer 3: Network (IP, ICMP) ← Route Tables, NACLs
Layer 2: Data Link (Ethernet, MAC)
Layer 1: Physical
```

**TCP/IP Model**:
```
Application: HTTP, HTTPS, SSH, DNS
Transport: TCP (reliable), UDP (fast)
Internet: IP routing
Network Access: Physical transmission
```

### IP Addresses & CIDR

**IPv4 Address**: 32 bits, 4 octets.
```
192.168.1.100
= 11000000.10101000.00000001.01100100

Range: 0.0.0.0 to 255.255.255.255
Total: 2^32 = 4.3 billion addresses
```

**CIDR Notation** (Classless Inter-Domain Routing):
```
10.0.0.0/16
           ↑
           Subnet mask bits

/16 = 11111111.11111111.00000000.00000000 = 255.255.0.0
Network: 10.0.x.x (fixed)
Hosts: x.x.0.0 to x.x.255.255 (variable)
Total IPs: 2^(32-16) = 65,536 addresses
```

**Common CIDR Blocks**:
```
/32: 1 IP (single host)
/24: 256 IPs (typical subnet)
/16: 65,536 IPs (large network)
/8: 16,777,216 IPs (Class A)
```

**Private IP Ranges** (RFC 1918):
```
10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
192.168.0.0/16 (192.168.0.0 - 192.168.255.255)
```

### Subnetting

**Example: Split 10.0.0.0/16 into /24 subnets**:
```
10.0.0.0/24 → 256 IPs (10.0.0.0 - 10.0.0.255)
10.0.1.0/24 → 256 IPs (10.0.1.0 - 10.0.1.255)
10.0.2.0/24 → 256 IPs (10.0.2.0 - 10.0.2.255)
...
10.0.255.0/24 → 256 IPs

Total: 256 subnets × 256 IPs = 65,536 IPs
```

**AWS Reserved IPs** (per subnet):
```
10.0.0.0: Network address
10.0.0.1: VPC router
10.0.0.2: DNS server
10.0.0.3: Reserved (future use)
10.0.0.255: Broadcast (not supported in VPC, but reserved)

Usable: 251 IPs (256 - 5)
```

---

## VPC History & Evolution

### Before VPC (2006-2009)

**EC2-Classic**:
```
❌ All instances in shared network
❌ No network isolation
❌ Public IPs only
❌ Basic security groups
❌ No control over network topology
```

**Problems**:
```
Security: Can't isolate workloads
Compliance: Can't meet regulatory requirements
Multi-tenancy: Shared network with all AWS customers
```

### VPC Launch (2009)

**Amazon VPC**: Isolated network in the cloud.

**Benefits**:
```
✅ Logically isolated network
✅ Define IP range (CIDR block)
✅ Create subnets (public, private)
✅ Control routing
✅ Network ACLs and security groups
✅ VPN connectivity to on-premises
```

### Evolution Timeline

```
2009: VPC Launch
2011: Default VPC (auto-created in each region)
2013: NAT Gateway (managed NAT)
2014: VPC Flow Logs (network traffic monitoring)
2017: Network Load Balancer (static IPs, ultra-low latency)
2018: Transit Gateway (hub-and-spoke VPC connectivity)
2019: PrivateLink (private connectivity to AWS services)
2020: Prefix Lists (manage CIDR blocks)
2021: IPv6-only subnets
2023: VPC Lattice (service mesh for VPCs)
```

---

## VPC Core Concepts

### VPC Architecture

```
┌─────────────────────────────────────────────────────────┐
│ VPC: 10.0.0.0/16                                        │
│                                                          │
│  ┌───────────────────┐      ┌───────────────────┐      │
│  │ Public Subnet     │      │ Private Subnet    │      │
│  │ 10.0.1.0/24       │      │ 10.0.2.0/24       │      │
│  │                   │      │                   │      │
│  │ ┌────┐  ┌────┐   │      │ ┌────┐  ┌────┐   │      │
│  │ │Web │  │Web │   │      │ │App │  │App │   │      │
│  │ └────┘  └────┘   │      │ └────┘  └────┘   │      │
│  │                   │      │                   │      │
│  └─────────┬─────────┘      └─────────┬─────────┘      │
│            │                          │                 │
│   ┌────────▼──────────┐      ┌────────▼─────────┐     │
│   │ Internet Gateway  │      │  NAT Gateway     │     │
│   └────────┬──────────┘      └────────┬─────────┘     │
│            │                          │                 │
└────────────┼──────────────────────────┼─────────────────┘
             │                          │
         Internet                   Internet
          (public)                 (private)
```

### VPC Components

**VPC**: Isolated virtual network.
```
CIDR block: 10.0.0.0/16 (65,536 IPs)
Region-specific
Max 5 VPCs per region (soft limit)
```

**Subnet**: Subdivision of VPC.
```
Public subnet: Has route to Internet Gateway
Private subnet: No direct internet access
CIDR: Subset of VPC CIDR (e.g., 10.0.1.0/24)
Availability Zone-specific
```

**Internet Gateway (IGW)**: Gateway to internet.
```
Allows instances in public subnets to access internet
Horizontally scaled, redundant, highly available
One IGW per VPC
```

**NAT Gateway**: Allows private instances to access internet.
```
Managed service (vs NAT instance)
Deployed in public subnet
Private instances route through NAT Gateway
Bandwidth: Up to 45 Gbps
HA: Deploy in multiple AZs
```

**Route Table**: Controls traffic routing.
```
Each subnet associated with one route table
Default route table created with VPC
Can create custom route tables
```

**Security Group**: Instance-level firewall (stateful).
```
Controls inbound/outbound traffic
Stateful: Return traffic automatically allowed
Allow rules only (no deny)
```

**Network ACL (NACL)**: Subnet-level firewall (stateless).
```
Controls traffic at subnet boundary
Stateless: Must allow return traffic explicitly
Allow and deny rules
```

---

## Subnets & CIDR

### Designing Subnets

**Example: 3-Tier Web Application**:
```
VPC: 10.0.0.0/16 (65,536 IPs)

Public Subnets (Web tier):
10.0.1.0/24 (AZ-1a) → 251 usable IPs
10.0.2.0/24 (AZ-1b) → 251 usable IPs

Private Subnets (App tier):
10.0.11.0/24 (AZ-1a) → 251 usable IPs
10.0.12.0/24 (AZ-1b) → 251 usable IPs

Database Subnets (DB tier):
10.0.21.0/24 (AZ-1a) → 251 usable IPs
10.0.22.0/24 (AZ-1b) → 251 usable IPs

Total used: 6 × 256 = 1,536 IPs
Available: 64,000 IPs for future expansion
```

### Calculating Subnet Size

**Formula**:
```
Number of IPs = 2^(32 - prefix_length) - 5 (AWS reserved)

/24: 2^(32-24) - 5 = 256 - 5 = 251 usable
/25: 2^(32-25) - 5 = 128 - 5 = 123 usable
/26: 2^(32-26) - 5 = 64 - 5 = 59 usable
/27: 2^(32-27) - 5 = 32 - 5 = 27 usable
/28: 2^(32-28) - 5 = 16 - 5 = 11 usable (minimum)
```

### Creating Subnets (AWS CLI)

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create public subnet
aws ec2 create-subnet \
  --vpc-id vpc-12345 \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-subnet-1a}]'

# Create private subnet
aws ec2 create-subnet \
  --vpc-id vpc-12345 \
  --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-subnet-1a}]'
```

---

## Internet Gateway & NAT

### Internet Gateway

**Purpose**: Allow public subnets to access internet.

**Architecture**:
```
Instance (10.0.1.5) → IGW → Internet
                      ↑
                 1:1 NAT (Elastic IP ↔ Private IP)
```

**Creating IGW**:
```bash
# Create IGW
aws ec2 create-internet-gateway

# Attach to VPC
aws ec2 attach-internet-gateway \
  --vpc-id vpc-12345 \
  --internet-gateway-id igw-67890
```

**Route Table Configuration**:
```bash
# Add route to IGW
aws ec2 create-route \
  --route-table-id rtb-12345 \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id igw-67890
```

### NAT Gateway

**Purpose**: Allow private instances to access internet (outbound only).

**NAT Gateway vs NAT Instance**:

| Feature | NAT Gateway | NAT Instance |
|---------|------------|--------------|
| Management | Fully managed | Self-managed EC2 |
| Availability | HA (within AZ) | Manual failover |
| Bandwidth | Up to 45 Gbps | Instance type dependent |
| Cost | $0.045/hour + data | EC2 pricing |
| Security Groups | N/A | Supported |

**Creating NAT Gateway**:
```bash
# Allocate Elastic IP
aws ec2 allocate-address --domain vpc

# Create NAT Gateway (in public subnet)
aws ec2 create-nat-gateway \
  --subnet-id subnet-public-1a \
  --allocation-id eipalloc-12345

# Add route in private subnet's route table
aws ec2 create-route \
  --route-table-id rtb-private \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id nat-12345
```

**High Availability**:
```
Deploy NAT Gateway in each AZ:

AZ-1a: Public Subnet → NAT Gateway 1
       Private Subnet → Route to NAT Gateway 1

AZ-1b: Public Subnet → NAT Gateway 2
       Private Subnet → Route to NAT Gateway 2

Cost: 2 × NAT Gateway fees
```

---

## Route Tables

### Route Table Structure

**Example Route Table**:
```
Destination         Target              Notes
-------------------------------------------------------
10.0.0.0/16         local               VPC local traffic
0.0.0.0/0           igw-12345           Internet via IGW
192.168.0.0/16      vgw-67890           VPN connection
```

**Route Priority** (most specific wins):
```
10.0.1.5 → Which route?

Routes:
10.0.0.0/16 → local
10.0.1.0/24 → pcx-peering
0.0.0.0/0 → igw-12345

Match: 10.0.1.0/24 (most specific) → pcx-peering
```

### Route Table Types

**Main Route Table**: Auto-created with VPC.
```
Default for all subnets
Recommended: Keep minimal routes
Explicitly associate subnets with custom route tables
```

**Custom Route Tables**:
```
Public Route Table:
- 10.0.0.0/16 → local
- 0.0.0.0/0 → igw-12345

Private Route Table:
- 10.0.0.0/16 → local
- 0.0.0.0/0 → nat-12345
```

### Creating Route Tables

```bash
# Create custom route table
aws ec2 create-route-table --vpc-id vpc-12345

# Add internet route
aws ec2 create-route \
  --route-table-id rtb-12345 \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id igw-67890

# Associate with subnet
aws ec2 associate-route-table \
  --route-table-id rtb-12345 \
  --subnet-id subnet-public-1a
```

---

## Security Groups vs NACLs

### Security Groups (Stateful)

**Characteristics**:
```
✅ Stateful (return traffic auto-allowed)
✅ Instance-level
✅ Allow rules only
✅ Evaluated as a group (all rules apply)
✅ Default: Deny all inbound, allow all outbound
```

**Example**:
```
Inbound Rules:
Type        Protocol    Port    Source
HTTP        TCP         80      0.0.0.0/0
HTTPS       TCP         443     0.0.0.0/0
SSH         TCP         22      203.0.113.0/24

Outbound Rules:
Type        Protocol    Port    Destination
All         All         All     0.0.0.0/0
```

**Stateful Behavior**:
```
Inbound: Allow HTTP (port 80)
→ Outbound return traffic (port 80) auto-allowed

No need to explicitly allow outbound on port 80
```

### Network ACLs (Stateless)

**Characteristics**:
```
✅ Stateless (must allow return traffic explicitly)
✅ Subnet-level
✅ Allow and deny rules
✅ Rules evaluated in order (lowest rule # first)
✅ Default: Allow all inbound and outbound
```

**Example**:
```
Inbound Rules:
Rule #  Type    Protocol  Port    Source          Allow/Deny
100     HTTP    TCP       80      0.0.0.0/0       ALLOW
200     HTTPS   TCP       443     0.0.0.0/0       ALLOW
*       All     All       All     0.0.0.0/0       DENY

Outbound Rules:
Rule #  Type    Protocol  Port    Destination     Allow/Deny
100     HTTP    TCP       80      0.0.0.0/0       ALLOW
110     Custom  TCP       1024-65535  0.0.0.0/0   ALLOW (ephemeral ports)
*       All     All       All     0.0.0.0/0       DENY
```

**Stateless Behavior**:
```
Inbound: Allow HTTP (port 80)
Request: Client (port 54321) → Server (port 80)
Response: Server (port 80) → Client (port 54321)

Must explicitly allow:
- Inbound: TCP 80
- Outbound: TCP 1024-65535 (ephemeral ports for client)
```

### Comparison

| Feature | Security Group | NACL |
|---------|---------------|------|
| Level | Instance | Subnet |
| State | Stateful | Stateless |
| Rules | Allow only | Allow and Deny |
| Rule Processing | All rules | Order matters |
| Default | Deny all inbound | Allow all |

### Defense in Depth

**Use Both**:
```
NACL (Subnet-level):
- Deny known malicious IPs
- Deny unwanted protocols
- Coarse-grained control

Security Group (Instance-level):
- Allow specific application ports
- Restrict by security group ID
- Fine-grained control

Example:
NACL: Deny 192.0.2.0/24 (malicious range)
Security Group: Allow HTTP from Load Balancer SG only
```

---

## VPC Peering & Transit Gateway

### VPC Peering

**Purpose**: Connect two VPCs (same or different accounts/regions).

**Architecture**:
```
VPC A (10.0.0.0/16) ←─── Peering ───→ VPC B (172.16.0.0/16)

Route in VPC A:
172.16.0.0/16 → pcx-12345

Route in VPC B:
10.0.0.0/16 → pcx-12345
```

**Limitations**:
```
❌ No transitive peering
   VPC A ↔ VPC B ↔ VPC C
   VPC A cannot reach VPC C through VPC B

❌ No overlapping CIDR blocks
   VPC A: 10.0.0.0/16
   VPC B: 10.0.0.0/16 ← Cannot peer

✅ Cross-region peering supported
✅ Cross-account peering supported
```

**Creating VPC Peering**:
```bash
# Request peering connection
aws ec2 create-vpc-peering-connection \
  --vpc-id vpc-11111 \
  --peer-vpc-id vpc-22222 \
  --peer-region us-west-2

# Accept peering (in peer VPC account)
aws ec2 accept-vpc-peering-connection \
  --vpc-peering-connection-id pcx-12345

# Add routes (both VPCs)
aws ec2 create-route \
  --route-table-id rtb-vpc-a \
  --destination-cidr-block 172.16.0.0/16 \
  --vpc-peering-connection-id pcx-12345
```

### Transit Gateway

**Purpose**: Hub-and-spoke network topology.

**Architecture**:
```
         ┌─────────┐
         │ Transit │
         │ Gateway │
         └────┬────┘
      ┌───┬──┴──┬───┐
      │   │     │   │
    VPC A VPC B VPC C VPN
```

**Benefits**:
```
✅ Transitive routing (A ↔ TGW ↔ B, A can reach B)
✅ Scalable (thousands of VPCs)
✅ Centralized routing
✅ Simplified network management
✅ VPN/Direct Connect integration
```

**vs VPC Peering**:
```
VPC Peering:
- Point-to-point
- 10 VPCs = 45 peering connections (n(n-1)/2)
- No transitive routing

Transit Gateway:
- Hub-and-spoke
- 10 VPCs = 10 attachments
- Transitive routing
- Higher cost
```

---

## VPC Endpoints

### Gateway Endpoints

**Purpose**: Private connection to AWS services (S3, DynamoDB).

**Architecture**:
```
Private Subnet → VPC Endpoint → S3/DynamoDB

No internet, no NAT Gateway required
```

**Benefits**:
```
✅ Free (no data transfer charges for S3)
✅ Improved security (traffic stays in AWS network)
✅ Lower latency
✅ No NAT Gateway costs
```

**Creating Gateway Endpoint**:
```bash
# S3 Gateway Endpoint
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-12345 \
  --service-name com.amazonaws.us-east-1.s3 \
  --route-table-ids rtb-private

# DynamoDB Gateway Endpoint
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-12345 \
  --service-name com.amazonaws.us-east-1.dynamodb \
  --route-table-ids rtb-private
```

**Route Table Update** (automatic):
```
Destination               Target
10.0.0.0/16              local
pl-12345 (S3 prefix)     vpce-67890
```

### Interface Endpoints (PrivateLink)

**Purpose**: Private connection to AWS services using ENI.

**Services**: EC2, Lambda, SNS, SQS, CloudWatch, etc.

**Architecture**:
```
Instance → ENI (10.0.1.5) → AWS Service

Uses private IP within your VPC
```

**Creating Interface Endpoint**:
```bash
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-12345 \
  --service-name com.amazonaws.us-east-1.lambda \
  --vpc-endpoint-type Interface \
  --subnet-ids subnet-private-1a subnet-private-1b \
  --security-group-ids sg-endpoint
```

**Cost**:
```
$0.01/hour per endpoint per AZ
$0.01/GB data processed

Example: 2 AZs, 100 GB/month
= 2 × 720 hours × $0.01 + 100 × $0.01
= $14.40 + $1.00 = $15.40/month
```

---

## Docker Network Simulations

### Simulating VPC with Docker

**docker-compose.yml**:
```yaml
version: '3.8'

networks:
  public-subnet:
    driver: bridge
    ipam:
      config:
        - subnet: 10.0.1.0/24
  
  private-subnet:
    driver: bridge
    ipam:
      config:
        - subnet: 10.0.2.0/24
  
  db-subnet:
    driver: bridge
    ipam:
      config:
        - subnet: 10.0.3.0/24
    internal: true  # No internet access

services:
  # Web server (public subnet)
  web:
    image: nginx
    networks:
      public-subnet:
        ipv4_address: 10.0.1.10
    ports:
      - "80:80"
  
  # Application server (private subnet)
  app:
    image: python:3.9
    networks:
      public-subnet:
      private-subnet:
        ipv4_address: 10.0.2.10
    command: python -m http.server 8000
  
  # Database (database subnet - no internet)
  db:
    image: postgres:14
    networks:
      db-subnet:
        ipv4_address: 10.0.3.10
    environment:
      POSTGRES_PASSWORD: password
  
  # NAT Gateway simulation
  nat:
    image: alpine
    networks:
      public-subnet:
      private-subnet:
    command: |
      sh -c "apk add iptables &&
             iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE &&
             tail -f /dev/null"
    cap_add:
      - NET_ADMIN
```

### Security Group Simulation

**iptables (Linux firewall)**:
```bash
# Web server security group
docker exec web iptables -A INPUT -p tcp --dport 80 -j ACCEPT  # Allow HTTP
docker exec web iptables -A INPUT -p tcp --dport 443 -j ACCEPT # Allow HTTPS
docker exec web iptables -A INPUT -p tcp --dport 22 -s 10.0.1.0/24 -j ACCEPT # SSH from public subnet only
docker exec web iptables -A INPUT -j DROP # Deny all others

# Application server security group
docker exec app iptables -A INPUT -p tcp --dport 8000 -s 10.0.1.0/24 -j ACCEPT # Allow from web tier
docker exec app iptables -A INPUT -j DROP

# Database security group
docker exec db iptables -A INPUT -p tcp --dport 5432 -s 10.0.2.0/24 -j ACCEPT # Allow from app tier
docker exec db iptables -A INPUT -j DROP
```

### Testing Connectivity

```bash
# Test public → private
docker exec web ping -c 2 10.0.2.10  # Should work

# Test private → database
docker exec app ping -c 2 10.0.3.10  # Should work

# Test public → database (should fail - no route)
docker exec web ping -c 2 10.0.3.10  # Should fail

# Test internet access from private subnet (through NAT)
docker exec app ping -c 2 8.8.8.8  # Should work (via NAT)

# Test internet access from database subnet (should fail)
docker exec db ping -c 2 8.8.8.8  # Should fail (internal network)
```

---

## Interview Questions

### Conceptual

**Q: Public subnet vs Private subnet?**
```
Public Subnet:
✅ Has route to Internet Gateway (0.0.0.0/0 → igw-xxx)
✅ Instances can have public IPs
✅ Direct internet access
Use case: Web servers, load balancers

Private Subnet:
✅ No route to Internet Gateway
✅ Instances only have private IPs
✅ Internet access via NAT Gateway (outbound only)
Use case: Application servers, databases
```

**Q: Security Group vs NACL?**
```
Security Group:
- Instance-level
- Stateful (return traffic auto-allowed)
- Allow rules only
- All rules evaluated

NACL:
- Subnet-level
- Stateless (must allow return traffic)
- Allow and deny rules
- Rules processed in order

When to use:
- Security Group: Primary defense, application-specific rules
- NACL: Additional layer, deny malicious IPs, subnet-wide policies
```

**Q: VPC Peering vs Transit Gateway?**
```
VPC Peering:
✅ Free (data transfer charges only)
✅ Low latency
❌ Not transitive
❌ Complex mesh (n(n-1)/2 connections)
Use case: 2-3 VPCs

Transit Gateway:
✅ Transitive routing
✅ Centralized management
✅ Scales to thousands of VPCs
❌ Cost ($0.05/hour + $0.02/GB)
Use case: >5 VPCs, hub-and-spoke
```

### Design

**Q: Design VPC for 3-tier web application (HA across 2 AZs)**
```
VPC: 10.0.0.0/16

Subnets:
Public Subnets (Web tier):
- 10.0.1.0/24 (us-east-1a)
- 10.0.2.0/24 (us-east-1b)

Private Subnets (App tier):
- 10.0.11.0/24 (us-east-1a)
- 10.0.12.0/24 (us-east-1b)

Database Subnets:
- 10.0.21.0/24 (us-east-1a)
- 10.0.22.0/24 (us-east-1b)

Components:
- Internet Gateway: For public subnets
- NAT Gateway: One per AZ (HA) in public subnets
- Application Load Balancer: In public subnets
- Web servers: Auto Scaling Group in public subnets
- App servers: Auto Scaling Group in private subnets
- RDS: Multi-AZ in database subnets

Route Tables:
Public RT:
- 10.0.0.0/16 → local
- 0.0.0.0/0 → igw-xxx

Private RT (AZ-1a):
- 10.0.0.0/16 → local
- 0.0.0.0/0 → nat-1a

Private RT (AZ-1b):
- 10.0.0.0/16 → local
- 0.0.0.0/0 → nat-1b

Security Groups:
ALB SG:
- Inbound: 80, 443 from 0.0.0.0/0
- Outbound: 8080 to Web SG

Web SG:
- Inbound: 8080 from ALB SG
- Outbound: 8000 to App SG

App SG:
- Inbound: 8000 from Web SG
- Outbound: 5432 to DB SG

DB SG:
- Inbound: 5432 from App SG
- Outbound: None
```

**Q: How to reduce NAT Gateway costs?**
```
Problem: NAT Gateway = $0.045/hour + $0.045/GB = $100+/month

Solutions:

1. Use VPC Endpoints for AWS services:
   S3, DynamoDB: Gateway Endpoint (FREE)
   Other services: Interface Endpoint ($0.01/hour, but cheaper than NAT data transfer)

2. Consolidate NAT Gateways:
   Bad: One NAT Gateway per AZ ($0.045 × 2 × 730 = $65/month)
   Good: One NAT Gateway for dev/test (accept single point of failure)

3. Use instance-based proxy (if traffic is low):
   t3.micro as NAT instance = $7/month
   vs NAT Gateway = $33/month (without data transfer)

4. Move workloads to Lambda:
   Lambda doesn't need NAT Gateway (built-in internet access)

5. S3 Gateway Endpoint example:
   Before: Private instance → NAT Gateway → S3
   Cost: $0.045/GB (NAT data processing)
   
   After: Private instance → VPC Endpoint → S3
   Cost: FREE
   
   Savings: $0.045/GB × 1TB = $46/month
```

**Q: CIDR planning for growing startup**
```
Requirements:
- Currently: 100 instances
- Growth: 10x per year
- Multi-region expansion planned

Design:

1. Choose large VPC CIDR:
   10.0.0.0/8 (16M IPs) - Too large, hard to manage
   10.0.0.0/16 (65K IPs) - Good for single region ✓

2. Plan regional allocation:
   us-east-1: 10.0.0.0/16
   us-west-2: 10.1.0.0/16
   eu-west-1: 10.2.0.0/16
   ap-southeast-1: 10.3.0.0/16

3. Subnet strategy:
   Use /24 subnets (256 IPs)
   Reserve large blocks for future use

   Current (Year 1):
   10.0.0.0/20 (4096 IPs) - Production
   10.0.16.0/20 (4096 IPs) - Reserved

   Future (Year 2):
   10.0.32.0/20 - New product line
   10.0.48.0/20 - Reserved

4. Multi-AZ distribution:
   Each tier in 3 AZs:
   Web: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
   App: 10.0.3.0/24, 10.0.4.0/24, 10.0.5.0/24
   DB: 10.0.6.0/24, 10.0.7.0/24, 10.0.8.0/24

5. Peering consideration:
   Use Transit Gateway for inter-region
   No overlapping CIDRs across regions
```

---

This comprehensive VPC guide covers networking fundamentals through advanced architectures with Docker simulations and complete interview preparation! 🌐

