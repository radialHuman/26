# 02 — Amazon VPC (Virtual Private Cloud) — Exhaustive Deep-Dive

---

## 1. What Problem VPC Solves

### The World Before VPC

When AWS first launched EC2 in 2006, all instances lived in a shared, flat network called **EC2-Classic**. Think of it like an apartment building with no walls between units — everyone could potentially see everyone else's traffic.

**Problems with EC2-Classic:**
- No network isolation between customers
- No private IP addresses that you controlled
- No subnets, no custom routing
- Couldn't create a network that looked like your corporate network
- Couldn't connect your on-premises data center to AWS in a secure, private way
- Security-conscious companies (banks, healthcare, government) refused to use AWS because of this

### What VPC Changed

VPC gives you a **logically isolated section of the AWS cloud** where you launch resources in a **virtual network that YOU define**. It's like getting your own private floor in the apartment building, with walls, doors, locks, and your own address scheme.

| Before VPC (EC2-Classic) | After VPC |
|---|---|
| Shared flat network | Your own isolated network |
| AWS-assigned IP ranges | You choose your IP range (CIDR block) |
| No subnets | Create public and private subnets |
| Basic security | Security Groups + NACLs + route tables |
| Can't connect to corporate network | VPN, Direct Connect, Transit Gateway |
| No control over routing | Full routing table control |
| Public by default | Private by default (you choose what's public) |

### Real-World Example

**A bank** wants to run its web application on AWS. They need:
- Web servers accessible from the internet (public subnet)
- Application servers that only the web servers can reach (private subnet)
- Database servers that only the app servers can reach (private data subnet)
- A secure tunnel back to their on-premises data center (VPN/Direct Connect)
- Logging of all network traffic for compliance (VPC Flow Logs)

Without VPC, this would be impossible. With VPC, the bank designs a network that mirrors their on-premises security architecture but runs in the cloud.

---

## 2. Historical Context

### Timeline

| Year | Event |
|---|---|
| 2006 | EC2 launches with EC2-Classic (shared networking) |
| 2009 | **VPC launched** — isolated virtual networks in AWS |
| 2011 | VPC became default for new AWS accounts (EC2-Classic deprecated for new accounts) |
| 2013 | VPC Peering introduced (connect VPCs) |
| 2015 | VPC Flow Logs, NAT Gateway (managed service replacing NAT instances) |
| 2017 | VPC Endpoints for services beyond S3 (Interface Endpoints powered by PrivateLink) |
| 2018 | **Transit Gateway** launched (connect thousands of VPCs and on-premises networks through a hub) |
| 2019 | VPC sharing (share subnets across accounts in AWS Organizations) |
| 2020 | VPC Reachability Analyzer (diagnose connectivity issues) |
| 2021 | VPC IPAM (IP Address Manager), VPC Lattice preview |
| 2022 | Transit Gateway multi-Region peering improvements |
| 2023 | VPC Lattice GA (application-layer networking for services), EC2 Instance Connect Endpoint |

### EC2-Classic vs VPC

EC2-Classic was fully retired on August 15, 2022. All AWS accounts now use VPC exclusively. However, the exam may still reference EC2-Classic to test your understanding of why VPC exists.

---

## 3. When to Use VPC

### 10+ Use Cases

1. **Every AWS deployment** — VPC is required for almost all AWS resources (EC2, RDS, Lambda, ELB, etc.). You can't avoid it.
2. **Multi-tier architectures** — Public web tier, private app tier, private data tier with controlled access between them
3. **Hybrid cloud** — Connect VPC to on-premises data center via VPN or Direct Connect
4. **Multi-account architectures** — Separate VPCs per environment (dev, staging, production) or per team
5. **Compliance-regulated workloads** — Healthcare (HIPAA), finance (PCI-DSS), government (FedRAMP) requiring network isolation
6. **Microservices with service-to-service communication** — VPC Endpoints and PrivateLink for private connectivity
7. **Data analytics with private access** — Accessing S3 or DynamoDB from private subnets using VPC Endpoints
8. **Multi-region deployments** — VPCs in each region connected via Transit Gateway peering
9. **Shared services** — Central VPC with shared services (Active Directory, logging) accessed by spoke VPCs
10. **Network security monitoring** — VPC Flow Logs + GuardDuty for threat detection
11. **DNS management** — Route 53 Resolver for hybrid DNS between AWS and on-premises

### 5+ Anti-Patterns

1. **Don't create one giant VPC for everything** — Use separate VPCs for different environments, accounts, or teams. A single VPC becomes a security and management nightmare.
2. **Don't use overlapping CIDR blocks** — If VPC-A is 10.0.0.0/16 and VPC-B is also 10.0.0.0/16, they can NEVER be peered. Plan CIDRs carefully.
3. **Don't put everything in public subnets** — Only resources that MUST be internet-facing should be in public subnets. Databases, application servers, etc. belong in private subnets.
4. **Don't use NAT Instances** — Use NAT Gateway instead (managed, highly available, scales automatically). NAT Instances are legacy and require manual management.
5. **Don't rely solely on Security Groups** — Use NACLs as an additional layer (defense in depth), especially for explicit deny rules.
6. **Don't create subnets that are too small** — AWS reserves 5 IPs in every subnet. A /28 subnet gives you only 11 usable IPs.

---

## 4. How VPC Differs from Similar Networking Concepts

### VPC Peering vs Transit Gateway vs PrivateLink

| Feature | VPC Peering | Transit Gateway | PrivateLink |
|---|---|---|---|
| What it does | Connects 2 VPCs directly | Hub-and-spoke for multiple VPCs | Exposes a specific service privately |
| Scale | 1-to-1 connections | Thousands of VPCs | Service-to-service |
| Transitive routing? | **NO** (exam critical!) | **YES** | N/A |
| Cross-region? | Yes | Yes (inter-region peering) | Yes |
| Cross-account? | Yes | Yes | Yes |
| Cost | Data transfer only | $0.05/hr + data transfer | $0.01/hr per AZ + data transfer |
| Use case | Small number of VPCs | Many VPCs, hub-and-spoke | Exposing a service to other VPCs/accounts |
| CIDR overlap? | NOT allowed | NOT allowed between attached VPCs | ALLOWED (uses ENIs, not routing) |

**Exam Critical — Non-Transitive Peering**: If VPC-A peers with VPC-B, and VPC-B peers with VPC-C, VPC-A CANNOT reach VPC-C through VPC-B. This is a TOP exam question. Solution: Use Transit Gateway or create a direct peering between A and C.

### Security Groups vs NACLs (Network ACLs) — THE Most Tested Comparison

| Feature | Security Group | Network ACL |
|---|---|---|
| Level | Instance level (ENI) | Subnet level |
| State | **Stateful** (return traffic auto-allowed) | **Stateless** (must explicitly allow return traffic) |
| Rules | Allow only | Allow AND Deny |
| Rule evaluation | All rules evaluated (if ANY rule allows, traffic passes) | Rules evaluated in number order (first match wins) |
| Default | All outbound allowed, all inbound denied | Default NACL: all traffic allowed; Custom NACL: all traffic denied |
| Association | Assigned to instances | Assigned to subnets |
| Number per VPC | 2,500 | 200 |
| Rules per | 60 inbound + 60 outbound | 20 inbound + 20 outbound (can increase) |

**Exam Trap**: "Block traffic from a specific IP address" → **NACL** (because Security Groups only have ALLOW rules; you can't deny a specific IP with a Security Group).

### NAT Gateway vs NAT Instance

| Feature | NAT Gateway | NAT Instance |
|---|---|---|
| Managed by | AWS (fully managed) | You (EC2 instance) |
| Availability | Highly available within AZ | Single instance, you manage failover |
| Bandwidth | Up to 100 Gbps | Depends on instance type |
| Cost | $0.045/hr + $0.045/GB processed | EC2 instance cost |
| Maintenance | None (AWS patches) | You patch the OS |
| Security Groups | Cannot assign | Can assign |
| Port forwarding | Not supported | Supported |
| Bastion host? | Cannot use as bastion | Can use as bastion |
| Source/Dest check | N/A | Must DISABLE |
| Best for | Production workloads | Very small/testing workloads |

**Exam Answer**: Almost always choose **NAT Gateway** unless the question specifically asks about port forwarding or combining NAT with bastion functionality.

---

## 5. Underlying Mechanism — How VPC Actually Works

### The VPC Router

Every VPC has an invisible, implicit router that AWS manages. You never see it, but it does all the work:

1. Every subnet has a route table associated with it
2. When a packet leaves an instance, the VPC router looks up the destination in the route table
3. The router forwards the packet based on the most specific matching route (longest prefix match)
4. This all happens at wire speed — the router is implemented in hardware on the Nitro Cards attached to each physical host

### How Packets Flow — A Complete Example

Scenario: A user on the internet accesses a web server in a public subnet, which queries a database in a private subnet.

```
Internet User (203.0.113.50)
    ↓ HTTPS request to your Elastic IP
Internet Gateway (igw-xxx)
    ↓ Translates Elastic IP → private IP (10.0.1.10)
    ↓ Checks route table: 10.0.1.0/24 → local
VPC Router
    ↓ Routes to subnet 10.0.1.0/24
    ↓ NACL inbound rules checked (subnet level) ← STATELESS: must allow inbound 443
Web Server EC2 (10.0.1.10)
    ↓ Security Group inbound rules checked ← STATEFUL: if inbound allowed, response auto-allowed
    ↓ Application processes request, needs database data
    ↓ Sends query to database at 10.0.2.20
VPC Router
    ↓ Route table: 10.0.2.0/24 → local (stays within VPC)
    ↓ NACL for private subnet checked
Database (10.0.2.20, in private subnet)
    ↓ Security Group checked (allows port 3306 from web server's SG)
    ↓ Returns query results
    ↓ Same path back (VPC Router → NACL → SG → Web Server)
Web Server
    ↓ Returns HTTPS response to user
    ↓ VPC Router → NACL outbound check → Internet Gateway → Internet
```

### The Mapping Service

AWS uses a software-defined networking layer called the **Mapping Service** that:
- Maps virtual IPs to physical host IPs
- Enables instances on different physical hosts to communicate as if on the same network
- Handles VPC Peering traffic routing
- All of this is transparent to you

---

## 6. Basic Components and Working

### CIDR Blocks and Subnetting (Explained from Scratch)

**CIDR (Classless Inter-Domain Routing)** defines IP address ranges.

Format: `10.0.0.0/16`
- `10.0.0.0` is the starting IP address
- `/16` is the **prefix length** — it tells you how many IPs are in the range

| CIDR | Number of IPs | Use Case |
|---|---|---|
| /16 | 65,536 | Large VPC (maximum size for AWS VPC) |
| /20 | 4,096 | Large subnet |
| /24 | 256 | Standard subnet (251 usable — AWS reserves 5) |
| /28 | 16 | Minimum AWS subnet size (11 usable) |

**AWS reserves 5 IPs in every subnet:**
- .0 — Network address
- .1 — VPC router
- .2 — DNS server
- .3 — Reserved for future use
- .255 — Broadcast address (AWS doesn't support broadcast, but reserves it)

**Example VPC Design:**
```
VPC: 10.0.0.0/16 (65,536 IPs)
├── Public Subnet AZ-a:  10.0.1.0/24 (251 usable IPs)
├── Public Subnet AZ-b:  10.0.2.0/24 (251 usable IPs)
├── Private App Subnet AZ-a: 10.0.11.0/24 (251 usable IPs)
├── Private App Subnet AZ-b: 10.0.12.0/24 (251 usable IPs)
├── Private Data Subnet AZ-a: 10.0.21.0/24 (251 usable IPs)
└── Private Data Subnet AZ-b: 10.0.22.0/24 (251 usable IPs)
```

### Subnets: Public vs Private

A subnet is **public** if:
1. It has a route table with a route to an Internet Gateway (0.0.0.0/0 → igw-xxx)
2. Instances in it have public IP addresses (or Elastic IPs)

A subnet is **private** if:
1. It does NOT have a route to an Internet Gateway
2. For outbound internet access, it routes through a NAT Gateway in a public subnet

There is nothing inherently special about a "public" or "private" subnet — it's purely determined by the route table.

### Internet Gateway (IGW)

- Allows resources in public subnets to communicate with the internet
- Performs Network Address Translation (NAT) between public and private IPs
- Horizontally scaled, redundant, highly available — NO bandwidth constraints
- One IGW per VPC
- FREE (no hourly charge, no data processing charge — you pay for data transfer)

### NAT Gateway

- Allows instances in **private subnets** to access the internet (for software updates, API calls, etc.) while preventing the internet from initiating connections TO them
- Deployed in a **public subnet** (it needs internet access itself)
- Charged: $0.045/hr + $0.045/GB processed
- AZ-specific: Deploy one per AZ for high availability
- Scales automatically to 100 Gbps

**Architecture pattern:**
```
Private Subnet Route Table:
  10.0.0.0/16 → local
  0.0.0.0/0   → nat-gw-xxx (NAT Gateway in public subnet)

Public Subnet Route Table:
  10.0.0.0/16 → local
  0.0.0.0/0   → igw-xxx (Internet Gateway)
```

### Route Tables

- Every subnet must be associated with exactly one route table
- A route table can be associated with multiple subnets
- Routes have: Destination (CIDR) and Target (where to send traffic)

**Example route table for a public subnet:**

| Destination | Target | Notes |
|---|---|---|
| 10.0.0.0/16 | local | Traffic within VPC stays in VPC |
| 0.0.0.0/0 | igw-xxx | All other traffic goes to Internet Gateway |

**Example route table for a private subnet:**

| Destination | Target | Notes |
|---|---|---|
| 10.0.0.0/16 | local | Traffic within VPC stays in VPC |
| 0.0.0.0/0 | nat-gw-xxx | Internet traffic goes through NAT Gateway |

### VPC Endpoints (EXAM CRITICAL!)

VPC Endpoints allow you to privately connect to AWS services WITHOUT going through the internet.

**Why this matters**: Without VPC Endpoints, an instance in a private subnet accessing S3 would need: instance → NAT Gateway → Internet Gateway → internet → S3. This is slow, costs more (NAT Gateway data processing charges), and traverses the public internet.

With a VPC Endpoint: instance → VPC Endpoint → S3 (stays on AWS's private network).

#### Two Types of VPC Endpoints

| Feature | Gateway Endpoint | Interface Endpoint (PrivateLink) |
|---|---|---|
| Supported services | **Only S3 and DynamoDB** | 100+ AWS services + custom services |
| How it works | Entry in route table | ENI with private IP in your subnet |
| Cost | **FREE** | $0.01/hr per AZ + $0.01/GB processed |
| High availability | Automatically HA | Deploy in multiple AZs |
| Security | Endpoint policies | Endpoint policies + Security Groups |
| DNS | Uses prefix lists in route tables | Uses private DNS names |

**Exam Critical**: 
- Gateway Endpoints are FREE and support ONLY S3 and DynamoDB. If the question mentions cost optimization + private access to S3 → Gateway Endpoint.
- Interface Endpoints use PrivateLink and cost money, but support virtually all AWS services.
- If the question says "access S3 without traversing the internet" and mentions "lowest cost" → Gateway Endpoint.

### VPC Peering

- Connects two VPCs so they can communicate using private IP addresses
- Can be same account or different accounts
- Can be same region or different regions (inter-region)
- **NON-TRANSITIVE** — You cannot route through a peered VPC to reach a third VPC

**Requirements:**
- CIDR blocks must NOT overlap
- Must update route tables in BOTH VPCs
- Security groups must allow the traffic

### VPC Flow Logs

Capture information about IP traffic going to/from network interfaces in your VPC.

- Can be set at: VPC level, Subnet level, or ENI level
- Published to: CloudWatch Logs or S3
- Captures: Source IP, Dest IP, Source Port, Dest Port, Protocol, Packets, Bytes, Action (ACCEPT/REJECT)
- Does NOT capture: DNS traffic to Route 53 Resolver, DHCP traffic, traffic to instance metadata (169.254.169.254)
- Used for: Security analysis, troubleshooting connectivity, compliance

### DNS in VPC

Two critical settings:
- **enableDnsHostnames**: If true, instances with public IPs get public DNS names (ec2-203-0-113-50.compute-1.amazonaws.com)
- **enableDnsSupport**: If true, AWS provides a DNS server at VPC CIDR + 2 (e.g., 10.0.0.2)

Both must be enabled for VPC Endpoints to use private DNS.

**Route 53 Resolver** — For hybrid DNS:
- **Inbound Endpoint**: On-premises DNS servers forward queries to AWS
- **Outbound Endpoint**: AWS resources forward queries to on-premises DNS servers

### DHCP Option Sets

Control DNS, NTP, and NetBIOS settings for instances in the VPC. You can create custom DHCP option sets to point to your own DNS servers.

---

## 7. Cost

### What's Free

- VPC creation
- Subnets
- Route tables
- Security Groups
- Network ACLs
- Internet Gateway
- VPC Peering (no charge for the peering connection itself)
- Gateway VPC Endpoints (S3 and DynamoDB)

### What Costs Money

| Resource | Cost (us-east-1) | Notes |
|---|---|---|
| NAT Gateway | $0.045/hr + $0.045/GB processed | ~$32/month just for being on + data costs |
| Interface VPC Endpoint | $0.01/hr per AZ + $0.01/GB | ~$7.20/month per AZ |
| VPN Connection | $0.05/hr (~$36/month) | Per VPN connection |
| Transit Gateway | $0.05/hr per attachment + $0.02/GB | Scales up quickly with many VPCs |
| Elastic IP (unassociated) | $0.005/hr | FREE when associated with a running instance |
| IPv4 Public IP | $0.005/hr per IP | New charge as of Feb 2024! All public IPs cost money |

### Data Transfer Costs (EXAM CRITICAL!)

| Transfer Type | Cost |
|---|---|
| Inbound (internet → AWS) | FREE |
| Outbound (AWS → internet) | $0.09/GB (first 10 TB/month) |
| Same AZ, private IP | FREE |
| Same AZ, public/Elastic IP | $0.01/GB |
| Cross-AZ (within same region) | $0.01/GB each way ($0.02 total) |
| Cross-Region | $0.02/GB |
| VPC Peering (same region) | Same as cross-AZ ($0.01/GB each way) |
| VPC Peering (cross-region) | $0.02/GB each way |
| Through NAT Gateway | $0.045/GB processing + data transfer |

**Exam Pattern**: "How to minimize data transfer costs?"
- Use private IPs (not public) for communication within the same AZ → FREE
- Keep communicating resources in the same AZ when possible
- Use Gateway VPC Endpoints for S3/DynamoDB (free endpoint, avoids NAT Gateway processing charges)
- Use VPC Endpoints instead of NAT Gateway for AWS service access

### Cost Optimization Example

**Scenario**: 100 EC2 instances in private subnets download 1 TB/month from S3.

**Without Gateway Endpoint (through NAT Gateway):**
- NAT Gateway hourly: $0.045 × 24 × 30 = $32.40/month
- NAT Gateway data processing: 1,000 GB × $0.045 = $45.00/month
- **Total: $77.40/month**

**With S3 Gateway Endpoint:**
- Gateway Endpoint: **$0.00**
- **Total: $0.00**
- **Savings: $77.40/month ($928.80/year)**

---

## 8. Pros and Cons

### Pros

1. **Complete network isolation** — Your VPC is logically isolated from all other VPCs
2. **Full control** — You define IP ranges, subnets, route tables, gateways
3. **Multiple layers of security** — Security Groups + NACLs + route tables
4. **Hybrid connectivity** — VPN and Direct Connect for on-premises integration
5. **Free core components** — VPC, subnets, route tables, SGs, NACLs, IGW are all free
6. **VPC Flow Logs** — Complete network traffic visibility for security and troubleshooting
7. **VPC Endpoints** — Private access to AWS services without internet traversal
8. **Peering and Transit Gateway** — Connect VPCs flexibly
9. **Shared VPC** — Share subnets across accounts in an Organization
10. **IPv6 support** — Dual-stack (IPv4 + IPv6) supported
11. **Network Firewall** — Managed firewall for advanced filtering

### Cons

1. **Complexity** — VPC networking has a steep learning curve
2. **CIDR planning is critical** — Wrong CIDR choices create problems that are hard to fix later (can't peer overlapping CIDRs)
3. **NAT Gateway costs** — $0.045/hr + data processing adds up for high-throughput workloads
4. **Cross-AZ costs** — Data transfer between AZs costs money, which penalizes HA architectures
5. **Limits** — Default 5 VPCs per region (can increase), 200 subnets per VPC, 200 route tables per VPC
6. **VPC Peering doesn't scale** — For N VPCs, you need N×(N-1)/2 peering connections (use Transit Gateway instead)
7. **No transitive routing in peering** — Common source of connectivity issues
8. **IPv4 exhaustion** — Public IPv4 addresses now cost $0.005/hr; plan for IPv6
9. **Troubleshooting difficulty** — Network issues can be hard to diagnose (SG? NACL? Route table? DNS?)

---

## 9. SAP-C02 Exam Questions (15+ Scenarios)

### Question 1 — VPC Peering Non-Transitivity
**Scenario**: Company has three VPCs: VPC-A (10.0.0.0/16) peered with VPC-B (10.1.0.0/16), and VPC-B peered with VPC-C (10.2.0.0/16). Instances in VPC-A cannot reach instances in VPC-C. What should be done?

**Answer**: **Create a direct VPC peering connection between VPC-A and VPC-C, and update route tables in both VPCs**

**Why correct**: VPC Peering is non-transitive. Traffic from A cannot go through B to reach C.

**Better long-term answer**: If the company has many VPCs, use **Transit Gateway** as a hub.

---

### Question 2 — Private S3 Access
**Scenario**: EC2 instances in a private subnet need to access S3 to download files. The security team requires that traffic never traverse the public internet. What is the MOST cost-effective solution?

**Answer**: **Create an S3 Gateway VPC Endpoint**

**Why correct**: Gateway Endpoints for S3 are FREE and keep traffic on AWS's private network.

**Why Interface Endpoint is wrong here**: It costs $0.01/hr per AZ — more expensive than Gateway for S3.
**Why NAT Gateway is wrong**: Traffic goes through the internet, and NAT Gateway charges $0.045/GB processing.

---

### Question 3 — Security Group vs NACL
**Scenario**: A security team needs to block traffic from a specific malicious IP address (1.2.3.4) to all instances in a subnet. What is the BEST approach?

**Answer**: **Add a DENY rule in the Network ACL for the subnet to block IP 1.2.3.4**

**Why correct**: Only NACLs support DENY rules. Security Groups only have ALLOW rules.

---

### Question 4 — Multi-AZ NAT Gateway
**Scenario**: A company has private subnets in two AZs. They have a single NAT Gateway in AZ-a. If AZ-a fails, instances in AZ-b lose internet access. How to fix?

**Answer**: **Create a NAT Gateway in AZ-b and update the AZ-b private subnet route table to use the AZ-b NAT Gateway**

**Why correct**: NAT Gateway is AZ-specific. For HA, deploy one per AZ.

---

### Question 5 — CIDR Block Planning
**Scenario**: A company is setting up VPCs for dev (10.0.0.0/16), staging (10.1.0.0/16), and production (10.2.0.0/16). They want all three to communicate. What must they ensure?

**Answer**: **The CIDR blocks must NOT overlap (they don't in this case), and VPC peering or Transit Gateway must be set up with proper route table entries**

**Exam Trap**: If two VPCs have overlapping CIDRs (e.g., both are 10.0.0.0/16), they CANNOT be peered. Period.

---

### Question 6 — VPC Endpoint for SQS
**Scenario**: Lambda functions in a private VPC subnet need to send messages to SQS. There is no NAT Gateway. How can the Lambda functions reach SQS?

**Answer**: **Create an Interface VPC Endpoint for SQS**

**Why correct**: SQS doesn't support Gateway Endpoints (only S3 and DynamoDB do). Interface Endpoints work for SQS.

**Why NAT Gateway is less optimal**: It works, but the requirement says there's no NAT Gateway, and adding one costs more.

---

### Question 7 — Hybrid DNS
**Scenario**: A company has on-premises servers that need to resolve AWS private DNS names, and AWS resources that need to resolve on-premises DNS names. What should they use?

**Answer**: **Route 53 Resolver with Inbound Endpoints (for on-prem → AWS resolution) and Outbound Endpoints (for AWS → on-prem resolution)**

---

### Question 8 — Transit Gateway vs Peering
**Scenario**: A company has 50 VPCs that all need to communicate with each other and with the on-premises data center. What is the BEST networking solution?

**Answer**: **AWS Transit Gateway** — acts as a hub. All 50 VPCs and the VPN/Direct Connect attach to the Transit Gateway.

**Why peering is wrong**: 50 VPCs would require 50×49/2 = 1,225 peering connections. Unmanageable.

---

### Question 9 — PrivateLink
**Scenario**: Company A wants to expose its internal API to Company B without going over the internet and without VPC peering. How?

**Answer**: **AWS PrivateLink** — Company A creates a Network Load Balancer + VPC Endpoint Service. Company B creates an Interface VPC Endpoint to connect.

**Why peering is wrong**: The companies might have overlapping CIDRs. PrivateLink works regardless of CIDR overlap.

---

### Question 10 — Flow Logs Analysis
**Scenario**: An instance can't connect to the internet. VPC Flow Logs show the outbound traffic has action = REJECT. What are the most likely causes?

**Answer**: Check in order:
1. Security Group outbound rules
2. NACL outbound rules
3. Route table (is there a route to 0.0.0.0/0?)
4. Internet Gateway attached?
5. NAT Gateway (if in private subnet)

---

### Question 11 — Secondary CIDR
**Scenario**: A VPC with 10.0.0.0/16 has run out of IP addresses. What can be done?

**Answer**: **Add a secondary CIDR block to the VPC** (you can add up to 5 IPv4 CIDRs to a VPC, for a total of 5 CIDR blocks)

---

### Question 12 — Public vs Private Subnet
**Scenario**: After launching an EC2 instance in what was supposed to be a public subnet, the instance cannot reach the internet. It has a public IP. What's likely wrong?

**Answer**: Check that the subnet's route table has a route: `0.0.0.0/0 → igw-xxx`. Without this route, the subnet is effectively private, even if instances have public IPs.

---

### Question 13 — VPC Sharing
**Scenario**: An organization wants dev teams in different AWS accounts to launch resources in a shared VPC to simplify networking. How?

**Answer**: **VPC Sharing via AWS RAM (Resource Access Manager)** — The VPC owner shares subnets with other accounts in the same Organization. Other accounts can launch resources in the shared subnets.

---

### Question 14 — Network Firewall
**Scenario**: A company needs to inspect and filter traffic entering their VPC, including deep packet inspection and domain-name filtering. Security Groups and NACLs are insufficient. What should they use?

**Answer**: **AWS Network Firewall** — A managed service that provides stateful inspection, intrusion prevention, and web filtering for VPC traffic.

---

### Question 15 — IPv4 Cost Optimization
**Scenario**: A company has 500 EC2 instances with public IPv4 addresses. Since AWS started charging $0.005/hr per public IP, their costs increased. How to reduce costs?

**Answer**: Options include:
1. Remove public IPs from instances that don't need internet access (use VPC Endpoints instead)
2. Use a NAT Gateway for outbound-only internet access
3. Migrate to IPv6 (free for VPC, no per-IP charge)
4. Use a single ALB/NLB (fewer public IPs) instead of per-instance public IPs

---

## 10. Configuration Details — Building a VPC from Scratch

### Step 1: Create the VPC

```bash
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=MyVPC}]'
```

Settings:
- CIDR Block: 10.0.0.0/16 (65,536 IPs)
- Tenancy: Default (shared hardware)
- Enable DNS hostnames: Yes
- Enable DNS resolution: Yes

### Step 2: Create Subnets

```bash
# Public Subnets
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

# Private App Subnets
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.11.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.12.0/24 --availability-zone us-east-1b

# Private Data Subnets
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.21.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.22.0/24 --availability-zone us-east-1b
```

### Step 3: Create and Attach Internet Gateway

```bash
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --internet-gateway-id igw-xxx --vpc-id vpc-xxx
```

### Step 4: Create Route Tables

```bash
# Public route table
aws ec2 create-route-table --vpc-id vpc-xxx
aws ec2 create-route --route-table-id rtb-public --destination-cidr-block 0.0.0.0/0 --gateway-id igw-xxx
aws ec2 associate-route-table --route-table-id rtb-public --subnet-id subnet-public-a
aws ec2 associate-route-table --route-table-id rtb-public --subnet-id subnet-public-b
```

### Step 5: Create NAT Gateway

```bash
# Allocate Elastic IP for NAT Gateway
aws ec2 allocate-address --domain vpc

# Create NAT Gateway in public subnet
aws ec2 create-nat-gateway --subnet-id subnet-public-a --allocation-id eipalloc-xxx

# Add route in private route table
aws ec2 create-route --route-table-id rtb-private --destination-cidr-block 0.0.0.0/0 --nat-gateway-id nat-xxx
```

### Step 6: Create Security Groups

```bash
# Web server SG
aws ec2 create-security-group --group-name WebSG --description "Web Server" --vpc-id vpc-xxx
aws ec2 authorize-security-group-ingress --group-id sg-web --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-web --protocol tcp --port 80 --cidr 0.0.0.0/0

# App server SG (only from web SG)
aws ec2 create-security-group --group-name AppSG --description "App Server" --vpc-id vpc-xxx
aws ec2 authorize-security-group-ingress --group-id sg-app --protocol tcp --port 8080 --source-group sg-web

# Database SG (only from app SG)
aws ec2 create-security-group --group-name DbSG --description "Database" --vpc-id vpc-xxx
aws ec2 authorize-security-group-ingress --group-id sg-db --protocol tcp --port 3306 --source-group sg-app
```

---

## 11. Similar but Different Services

| Service | Relationship to VPC |
|---|---|
| **Transit Gateway** | Hub for connecting multiple VPCs and on-prem (replaces complex peering meshes) |
| **PrivateLink** | Expose/consume services privately across VPCs/accounts |
| **Direct Connect** | Dedicated physical network connection from on-prem to AWS (bypasses internet) |
| **Site-to-Site VPN** | Encrypted tunnel over the internet from on-prem to VPC |
| **Client VPN** | Remote users connect to VPC from laptops |
| **Global Accelerator** | Routes traffic to optimal AWS region (uses AWS backbone, not internet) |
| **CloudFront** | CDN — not VPC networking, but often confused with network optimization |
| **VPC Lattice** | Application-layer service-to-service networking (newer than PrivateLink) |

---

## 12. Services VPC Works With

| Service | Integration |
|---|---|
| **EC2** | All instances launch in VPC subnets |
| **RDS** | DB instances require VPC subnet groups |
| **Lambda** | Can be configured to run inside VPC for private resource access |
| **ELB** | ALB/NLB deployed in VPC subnets |
| **ECS/EKS** | Containers run in VPC |
| **ElastiCache** | Cache clusters in VPC |
| **Redshift** | Clusters in VPC |
| **Direct Connect** | Physical connection terminates at VPC via Virtual Private Gateway |
| **Route 53** | Private Hosted Zones associated with VPCs |
| **CloudWatch** | VPC Flow Logs published to CloudWatch Logs |
| **GuardDuty** | Analyzes VPC Flow Logs for threats |
| **Network Firewall** | Deployed within VPC for traffic inspection |
| **Transit Gateway** | Connects VPC to other VPCs and on-premises |

---

## 13. Additional Critical Information

### Best Practices (20+)

1. ✅ Plan CIDR blocks carefully — avoid overlap, leave room for growth
2. ✅ Use at least 2 AZs for every deployment (high availability)
3. ✅ Use 3-tier subnet architecture (public, private app, private data)
4. ✅ Deploy NAT Gateways in each AZ for HA
5. ✅ Use VPC Gateway Endpoints for S3 and DynamoDB (free!)
6. ✅ Enable VPC Flow Logs for security monitoring
7. ✅ Use Security Groups as primary access control (stateful, easier)
8. ✅ Use NACLs as secondary defense layer (explicit deny)
9. ✅ Reference Security Groups by SG ID (not IP) when possible
10. ✅ Use Transit Gateway instead of complex peering meshes
11. ✅ Enable DNS hostnames and DNS resolution
12. ✅ Use PrivateLink for service-to-service across accounts
13. ✅ Tag all VPC resources
14. ✅ Use VPC endpoints to avoid NAT Gateway data processing costs
15. ✅ Implement VPC Reachability Analyzer for troubleshooting
16. ✅ Use AWS Network Firewall for deep packet inspection needs
17. ✅ Consider IPv6 dual-stack for future-proofing
18. ✅ Use separate route tables for each tier of subnets
19. ✅ Document your network architecture (especially CIDR allocations)
20. ✅ Use VPC IPAM for large-scale IP management

### Common Mistakes (15+)

1. ❌ Overlapping CIDR blocks between VPCs (can't peer later!)
2. ❌ Putting everything in public subnets
3. ❌ Opening Security Group to 0.0.0.0/0 for SSH/RDP
4. ❌ Using only one AZ
5. ❌ Single NAT Gateway for multi-AZ deployment
6. ❌ Forgetting to update route tables after creating peering connections
7. ❌ Using NAT Gateway to access S3 instead of free Gateway Endpoint
8. ❌ Assuming VPC peering is transitive (it's NOT)
9. ❌ Not enabling VPC Flow Logs
10. ❌ Creating subnets that are too small (/28 = only 11 usable IPs)
11. ❌ Forgetting NACL is stateless (must allow return traffic explicitly)
12. ❌ Not understanding that default NACL allows all, custom NACL denies all
13. ❌ Forgetting ephemeral ports in NACL rules (1024-65535 for return traffic)
14. ❌ Not setting enableDnsHostnames when using VPC Endpoints
15. ❌ Using NAT Instance instead of NAT Gateway in production

### Key Limits

| Resource | Default Limit |
|---|---|
| VPCs per region | 5 (can increase) |
| Subnets per VPC | 200 |
| Route tables per VPC | 200 |
| Routes per route table | 50 (can increase to 1,000) |
| Security groups per VPC | 2,500 |
| Rules per security group | 60 inbound + 60 outbound |
| Network ACLs per VPC | 200 |
| Rules per NACL | 20 (can increase) |
| Elastic IPs per region | 5 |
| VPC peering connections per VPC | 50 (can increase to 125) |
| Internet Gateways per VPC | 1 |
| NAT Gateways per AZ | 5 |

### Exam Tips and Traps

1. **"Stateful" = Security Group. "Stateless" = NACL.** (Every exam)
2. **"Block specific IP"** → NACL (SGs can't deny)
3. **"Non-transitive"** → VPC Peering limitation → use Transit Gateway
4. **"Free private access to S3"** → Gateway VPC Endpoint
5. **"Access SQS/SNS/CloudWatch from private subnet"** → Interface VPC Endpoint
6. **"Single point of failure" for outbound internet** → NAT Gateway in only one AZ → deploy per AZ
7. **"Cheapest hybrid connectivity"** → Site-to-Site VPN ($0.05/hr). If "dedicated/consistent performance" → Direct Connect
8. **"5 IPs reserved per subnet"** → Don't forget this when sizing
9. **"DNS resolution not working for VPC Endpoints"** → Enable enableDnsHostnames + enableDnsSupport
10. **"Peering across regions"** → Supported but cross-region data transfer charges apply

---

*Word count: ~5,000+ words. This document covers every VPC concept tested on the SAP-C02 exam with beginner-friendly explanations.*
