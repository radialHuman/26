# AWS Transit Gateway

## What is AWS Transit Gateway?

AWS Transit Gateway is a network transit hub that connects Virtual Private Clouds (VPCs) and on-premises networks through a central hub. It acts as a cloud router, simplifying network architecture by eliminating the need for complex peering relationships. Think of it as a central networking hub that connects all your networks together in a star topology instead of a complex mesh.

## Why Use Transit Gateway?

### Key Benefits
- **Simplified Network Architecture**: Hub-and-spoke instead of mesh
- **Scalability**: Connect thousands of VPCs and on-premises networks
- **Centralized Management**: Single point of control
- **Inter-Region Peering**: Connect Transit Gateways across regions
- **Reduced Operational Overhead**: No complex peering management
- **Advanced Routing**: Route tables, route propagation, route filtering
- **High Performance**: Up to 50 Gbps per VPC attachment

### Use Cases
- Centralized network architecture
- Hub-and-spoke VPC topology
- Multi-region connectivity
- Hybrid cloud networking (AWS + on-premises)
- Network segmentation and isolation
- Shared services VPC pattern
- Migration to AWS (incremental connectivity)

## How Transit Gateway Works

### Traditional VPC Peering (Problem)

```
VPC Peering Mesh (N VPCs = N*(N-1)/2 connections)
VPC-A ←→ VPC-B
  ↕        ↕
VPC-C ←→ VPC-D

4 VPCs = 6 peering connections
10 VPCs = 45 peering connections  
100 VPCs = 4,950 peering connections
```

### Transit Gateway (Solution)

```
Hub-and-Spoke (N VPCs = N connections)
        Transit Gateway
              ║
    ┌─────────┼─────────┬─────────┐
    ↓         ↓         ↓         ↓
  VPC-A     VPC-B     VPC-C     VPC-D

4 VPCs = 4 attachments
10 VPCs = 10 attachments
100 VPCs = 100 attachments
```

### Architecture Components

**1. Transit Gateway**:
- Regional resource
- Scales automatically
- Spans multiple AZs (HA)
- Default Amazon ASN: 64512

**2. Attachments**:
- **VPC Attachment**: Connect VPCs
- **VPN Attachment**: Connect on-premises via Site-to-Site VPN
- **Direct Connect Gateway Attachment**: Connect via Direct Connect
- **Peering Attachment**: Connect to another Transit Gateway
- **Connect Attachment**: SD-WAN appliances

**3. Route Tables**:
- Control routing between attachments
- Multiple route tables for segmentation
- Route propagation (dynamic routes)
- Static routes

**4. Associations and Propagations**:
- **Association**: Which route table an attachment uses
- **Propagation**: Which attachments advertise routes to a route table

## Core Concepts

### Transit Gateway Attachments

**VPC Attachment**:
```yaml
Configuration:
  VPC: vpc-123456
  Subnets: [subnet-a, subnet-b, subnet-c]  # One per AZ
  Appliance Mode Support: Enabled/Disabled
  DNS Support: Enabled
  IPv6 Support: Disabled
```

**Requirements**:
- One subnet per AZ (for redundancy)
- Subnet CIDR recommendations: /28 or larger
- Modify VPC route tables to route to TGW

**VPN Attachment**:
```yaml
Configuration:
  Customer Gateway: cgw-123456
  VPN Connection: vpn-123456
  Static Routes or BGP: BGP recommended
  Accelerated VPN: Optional
```

**Direct Connect Gateway Attachment**:
```yaml
Configuration:
  Direct Connect Gateway: dx-gw-123456
  Allowed Prefixes: 10.0.0.0/8, 172.16.0.0/12
  Associated Transit Gateway: tgw-123456
```

**Transit Gateway Peering**:
```yaml
Configuration:
  Local Transit Gateway: tgw-111111 (us-east-1)
  Peer Transit Gateway: tgw-222222 (eu-west-1)
  Peer Region: eu-west-1
  Peer Account: 123456789012
```

### Route Tables

**Default Route Table**:
- Automatically created with Transit Gateway
- All attachments associated by default
- Can be disabled (blank slate mode)

**Custom Route Tables**:
- For network segmentation
- Isolate traffic between groups
- Example: Production vs Development

**Routing Behavior**:
```yaml
Route Table: Production-RT
Associations:
  - vpc-prod-1
  - vpc-prod-2
Propagations:
  - vpn-onprem (10.0.0.0/8)
Static Routes:
  - 0.0.0.0/0 → vpc-egress-attachment
```

**Route Priority**:
1. Most specific prefix match (longest prefix)
2. Static routes over propagated routes
3. Direct Connect Gateway over VPN (for same prefix)

### Network Segmentation Patterns

**Pattern 1: Isolated VPCs**:
```
Route Table A: VPC-1, VPC-2 (can communicate)
Route Table B: VPC-3, VPC-4 (can communicate)
No routes between RT-A and RT-B = complete isolation
```

**Pattern 2: Shared Services**:
```
Route Table A: VPC-Prod, VPC-Dev, VPC-Test
Propagations: VPC-Shared-Services
All VPCs can reach shared services, but not each other
```

**Pattern 3: Inspection VPC**:
```
All traffic routed through Inspection VPC
(Appliance mode enabled for stateful inspection)
```

## Advanced Features

### Appliance Mode

**What is it?**
- Ensures symmetric routing for stateful appliances
- Uses flow hash to pin flows to specific ENI
- Required for firewalls, NAT, IDS/IPS

**Without Appliance Mode**:
```
Request:  VPC-A → TGW → Firewall-ENI-1 → VPC-B
Response: VPC-B → TGW → Firewall-ENI-2 → VPC-A
(Response through different ENI = dropped by stateful firewall)
```

**With Appliance Mode**:
```
Request:  VPC-A → TGW → Firewall-ENI-1 → VPC-B
Response: VPC-B → TGW → Firewall-ENI-1 → VPC-A
(Same ENI for both directions)
```

### Equal-Cost Multi-Path (ECMP) Routing

**What is ECMP?**
- Load balance traffic across multiple VPN connections
- Increases bandwidth (multiple tunnels)
- Improves resiliency

**Configuration**:
```
On-Premises → VPN-1 (2 tunnels = 1.25 Gbps each)
           → VPN-2 (2 tunnels = 1.25 Gbps each)
           → VPN-3 (2 tunnels = 1.25 Gbps each)

Total bandwidth: ~7.5 Gbps (6 tunnels × 1.25 Gbps)
```

**Use Cases**:
- High-throughput on-premises connectivity
- Redundancy beyond single VPN
- Cost-effective alternative to Direct Connect

### Multicast Support

**What is Multicast?**
- One-to-many communication
- Efficient for streaming, replication
- Reduces bandwidth consumption

**Configuration**:
```yaml
Multicast Domain:
  Name: VideoStreaming
  Static Sources: Yes/No
  IGMPv2 Support: Enabled
  
Group Members:
  - VPC-A: subnet-1, subnet-2
  - VPC-B: subnet-3
  
Multicast Group: 224.0.0.1 - 239.255.255.255
```

**Use Cases**:
- Video streaming
- Database replication
- Market data distribution

### Transit Gateway Connect

**What is it?**
- SD-WAN appliance integration
- GRE tunnels over VPC attachment
- Support for BGP
- Higher bandwidth than VPN (up to 50 Gbps)

**Architecture**:
```
On-Premises SD-WAN ←→ Internet/DX ←→ SD-WAN Appliance (EC2) 
                                          ↓
                                    GRE Tunnel
                                          ↓
                                  Transit Gateway Connect
```

**Benefits**:
- Better performance than VPN
- Native SD-WAN integration
- Dynamic routing with BGP

## Inter-Region Peering

### How It Works

```
Region 1 (us-east-1)              Region 2 (eu-west-1)
Transit Gateway-1                 Transit Gateway-2
      ↓                                   ↓
VPC-US-1, VPC-US-2              VPC-EU-1, VPC-EU-2
      
      ←─────── Peering Attachment ────────→
```

**Characteristics**:
- Encrypted automatically
- Uses AWS global network
- Static routes only (no route propagation)
- Cross-account supported

**Configuration**:
```yaml
Step 1: Create peering attachment (Region 1)
Step 2: Accept peering attachment (Region 2)
Step 3: Add static routes in both TGW route tables
  RT-1: 10.20.0.0/16 → tgw-peering-attach
  RT-2: 10.10.0.0/16 → tgw-peering-attach
```

**Use Cases**:
- Multi-region application deployment
- Disaster recovery
- Data replication
- Global services

## Hybrid Connectivity

### Transit Gateway + Direct Connect

**Architecture**:
```
On-Premises ←→ Direct Connect Location ←→ Direct Connect Gateway
                                                  ↓
                                          Transit Gateway
                                                  ↓
                              ┌───────────────────┼───────────────┐
                              ↓                   ↓               ↓
                           VPC-1               VPC-2           VPC-3
```

**Benefits**:
- Simplifies connection to multiple VPCs
- Higher bandwidth than VPN (up to 100 Gbps)
- Lower latency
- Predictable performance

**Allowed Prefixes**:
- Configure on DX Gateway
- Filter which routes are advertised
- Example: 10.0.0.0/8, 172.16.0.0/12

### Transit Gateway + Site-to-Site VPN

**Architecture**:
```
On-Premises ←→ Customer Gateway ←→ VPN Connection ←→ Transit Gateway
```

**ECMP for Bandwidth**:
```
Multiple VPN Connections (ECMP):
  VPN-1: 2 tunnels
  VPN-2: 2 tunnels
  VPN-3: 2 tunnels
Total: ~7.5 Gbps aggregate
```

**Accelerated VPN**:
- Uses Global Accelerator
- Lower latency
- Better performance
- Additional cost

### Hybrid DNS

**Route 53 Resolver Integration**:
```
On-Premises DNS ←→ Route 53 Resolver Endpoints
                          ↓
                  Transit Gateway
                          ↓
                  VPC DNS Resolvers
```

**Inbound Endpoints**:
- On-premises queries AWS resources
- Forward to VPC DNS

**Outbound Endpoints**:
- AWS resources query on-premises
- Forwarding rules

## Monitoring and Troubleshooting

### CloudWatch Metrics

**Traffic Metrics**:
- `BytesIn`: Bytes sent to Transit Gateway
- `BytesOut`: Bytes sent from Transit Gateway
- `PacketsIn`: Packets sent to Transit Gateway
- `PacketsOut`: Packets sent from Transit Gateway
- `PacketDropCountBlackhole`: Packets dropped (blackhole route)
- `PacketDropCountNoRoute`: Packets dropped (no route)

**Per Attachment**:
- Monitor traffic per VPC/VPN/DX
- Identify high-traffic attachments
- Troubleshoot connectivity issues

### VPC Flow Logs

**Enable on Transit Gateway ENIs**:
```
Source: TGW ENI
Destination: CloudWatch Logs or S3
Filter: Accept, Reject, or All
```

**Use Cases**:
- Troubleshoot routing issues
- Identify rejected traffic
- Security analysis

### Network Manager

**What is it?**
- Visualization and monitoring tool
- Global network view
- Topology mapping
- Performance metrics

**Features**:
- Network topology diagram
- Routes and associations
- Connection health
- Bandwidth utilization

## Security

### Isolation and Segmentation

**Route Table Segmentation**:
```yaml
Production Route Table:
  - prod-vpc-1
  - prod-vpc-2
  - on-premises (propagation)

Development Route Table:
  - dev-vpc-1
  - dev-vpc-2
  
No routes between Prod and Dev = complete isolation
```

**Blackhole Routes**:
```
Route: 10.5.0.0/16 → Blackhole
Effect: Drop all traffic to 10.5.0.0/16
Use Case: Blocking malicious IPs, deprecated networks
```

### Encryption

**In Transit**:
- VPN attachments: IPsec encryption
- Inter-region peering: Encrypted by default
- VPC attachments: Unencrypted within region

**To Encrypt VPC Traffic**:
```
Option 1: Use inspection VPC with encryption appliance
Option 2: Use VPN between VPCs (over TGW)
Option 3: Application-level encryption
```

### Compliance

**AWS PrivateLink Integration**:
- Access AWS services privately
- No internet gateway needed
- VPC Endpoints via Transit Gateway

**VPC Endpoint Integration**:
```
Centralized VPC Endpoints:
  Shared Services VPC → S3, DynamoDB, etc. endpoints
  Other VPCs → Route to Shared Services for endpoint access
```

## Cost Optimization

### Pricing Model

**Attachments**:
- $0.05 per attachment per hour

**Data Transfer**:
- $0.02 per GB (within region)
- Inter-region: Standard data transfer rates
- Same AZ: Free (if source and destination in same AZ)

**Example**:
```
3 VPC attachments: 3 × $0.05 × 730 hours = $109.50/month
100 GB data transfer: 100 × $0.02 = $2.00
Total: $111.50/month
```

### Cost Reduction Strategies

**1. Minimize Attachments**:
- Consolidate VPCs where possible
- Use VPC sharing for related workloads

**2. Optimize Data Transfer**:
- Keep related workloads in same AZ
- Use VPC peering for high-bandwidth pairs
- Cache frequently accessed data

**3. Right-Size Architecture**:
- Transit Gateway for complex topologies (5+ VPCs)
- VPC Peering for simple point-to-point
- Use AWS PrivateLink for service access

## Integration Patterns

### Hub-and-Spoke with Shared Services

```
          Transit Gateway
                ║
    ┌───────────┼────────────┬──────────┐
    ↓           ↓            ↓          ↓
Shared      VPC-Prod    VPC-Dev    VPC-Test
Services                              
(NAT, DNS,
 AD, Tools)
```

### Inspection Architecture

```
          Transit Gateway
                ║
    Route Table: Inspection-RT
                ↓
        Inspection VPC
      (Firewalls, IDS/IPS)
                ↓
    Route Table: Workload-RT
                ↓
    ┌───────────┼───────────┐
    ↓           ↓           ↓
VPC-Prod    VPC-Dev     VPC-Test
```

### Multi-Region Architecture

```
Region 1 TGW ←─── Peering ───→ Region 2 TGW
     ↓                               ↓
VPCs (R1)                        VPCs (R2)
     ↓                               ↓
On-Premises (via DX/VPN)    On-Premises (via DX/VPN)
```

## Best Practices for SAP-C02

### Design Principles

1. **Use Transit Gateway for 5+ VPCs**
   - Simplified management
   - Better scalability
   - Central routing control

2. **Segment Networks with Route Tables**
   - Production vs Development
   - Security zones (DMZ, Internal, Sensitive)
   - Compliance boundaries

3. **Enable ECMP for High Bandwidth**
   - Multiple VPN connections
   - Load balancing
   - Redundancy

4. **Use Inter-Region Peering**
   - Multi-region architectures
   - DR configurations
   - Global applications

5. **Implement Centralized Inspection**
   - Security appliances in inspection VPC
   - Enable appliance mode
   - Route all traffic through inspection

6. **Monitor and Alert**
   - CloudWatch metrics for bandwidth
   - VPC Flow Logs for troubleshooting
   - Network Manager for topology

### Common Exam Scenarios

**Scenario 1**: Connect 20 VPCs and On-Premises Network
- **Solution**: Transit Gateway with VPC and VPN attachments, route tables for segmentation

**Scenario 2**: High-Bandwidth On-Premises Connectivity
- **Solution**: Transit Gateway + Direct Connect Gateway + multiple connections with ECMP

**Scenario 3**: Isolate Production from Development
- **Solution**: Separate Transit Gateway route tables, no routes between them

**Scenario 4**: Multi-Region Connectivity
- **Solution**: Transit Gateways in each region with inter-region peering, static routes

**Scenario 5**: Centralized Egress with Inspection
- **Solution**: Inspection VPC with firewalls, appliance mode enabled, route tables directing traffic

**Scenario 6**: Migrating from VPC Peering Mesh
- **Solution**: Create Transit Gateway, migrate VPC attachments, update route tables, remove peering

## Transit Gateway vs Alternatives

| Feature | Transit Gateway | VPC Peering | AWS PrivateLink | Direct Connect Gateway |
|---------|----------------|-------------|-----------------|------------------------|
| **Topology** | Hub-and-spoke | Point-to-point | Service access | On-prem to VPCs |
| **Transitive Routing** | Yes | No | N/A | No |
| **Management** | Centralized | Distributed | Per service | Centralized |
| **Scalability** | High (thousands) | Low (125 per VPC) | High | High |
| **Use Case** | Complex networks | Simple connections | Service sharing | Hybrid cloud |
| **Cost** | Moderate | Low | Moderate | High (DX cost) |

## Quick Reference

### Common CLI Commands

```bash
# Create Transit Gateway
aws ec2 create-transit-gateway \
  --description "Main TGW" \
  --options AmazonSideAsn=64512,AutoAcceptSharedAttachments=enable

# Create VPC attachment
aws ec2 create-transit-gateway-vpc-attachment \
  --transit-gateway-id tgw-123456 \
  --vpc-id vpc-123456 \
  --subnet-ids subnet-a subnet-b subnet-c

# Create route table
aws ec2 create-transit-gateway-route-table \
  --transit-gateway-id tgw-123456

# Associate route table
aws ec2 associate-transit-gateway-route-table \
  --transit-gateway-route-table-id tgw-rtb-123456 \
  --transit-gateway-attachment-id tgw-attach-123456

# Create static route
aws ec2 create-transit-gateway-route \
  --destination-cidr-block 10.0.0.0/8 \
  --transit-gateway-route-table-id tgw-rtb-123456 \
  --transit-gateway-attachment-id tgw-attach-123456
```

### Important Limits

- Transit Gateways per region: 5 (adjustable)
- Attachments per Transit Gateway: 5,000
- Route tables per Transit Gateway: 20 (adjustable)
- Routes per route table: 10,000 (static + propagated)
- Transit Gateway peerings per Transit Gateway: 50
- Bandwidth per VPC attachment: 50 Gbps (burst to 100 Gbps)
- Bandwidth per VPN connection: 1.25 Gbps per tunnel

### Exam Tips

1. **Transit Gateway is a hub**: Connects VPCs, VPNs, Direct Connect
2. **Transitive routing**: Works (unlike VPC peering)
3. **Route tables for segmentation**: Isolate networks logically
4. **ECMP for bandwidth**: Multiple VPN connections
5. **Inter-region peering**: Connect TGWs across regions, encrypted
6. **Appliance mode**: Required for stateful inspection (firewalls)
7. **Multicast support**: Available for one-to-many applications
8. **Network Manager**: Visualization and monitoring tool
9. **Pricing**: Per attachment per hour + data transfer
10. **Use for 5+ VPCs**: Cost-effective and simpler than VPC peering mesh

## Summary

AWS Transit Gateway is the network hub for:
- Connecting multiple VPCs in hub-and-spoke topology
- Hybrid connectivity (AWS + on-premises)
- Multi-region network architectures
- Network segmentation and isolation
- Centralized routing and management

Key strengths: Simplified network architecture, transitive routing, scalability (thousands of VPCs), centralized management, multi-region peering, ECMP for high bandwidth, appliance mode for inspection.
