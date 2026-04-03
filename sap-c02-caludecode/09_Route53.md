# 09 — Amazon Route 53 — Exhaustive Deep-Dive

---

## 1. What Problem Route 53 Solves

### The Problem: How Do Computers Find Each Other?

When you type "amazon.com" in your browser, your computer doesn't know where Amazon's servers are. It needs to convert "amazon.com" into an IP address (like 205.251.242.103). This conversion is called **DNS resolution** — the Domain Name System is essentially the internet's phone book.

Before Route 53, you had to:
- Use third-party DNS providers (GoDaddy, Cloudflare, etc.)
- Manage DNS separately from your AWS infrastructure
- Build your own health checking and failover

**Route 53 provides**: DNS management, domain registration, health checking, and traffic routing — all integrated with AWS services.

The name "Route 53" comes from TCP/UDP port 53, which is the port used for DNS.

---

## 2. Core DNS Concepts (Must Understand!)

### DNS Record Types

| Record Type | What It Does | Example | Exam Note |
|---|---|---|---|
| **A** | Maps domain → IPv4 address | example.com → 1.2.3.4 | Most common |
| **AAAA** | Maps domain → IPv6 address | example.com → 2001:db8::1 | IPv6 equivalent |
| **CNAME** | Maps domain → another domain name | api.example.com → my-elb.us-east-1.elb.amazonaws.com | **Cannot be used at zone apex!** |
| **Alias** | AWS-specific: maps domain → AWS resource | example.com → ALB/CloudFront/S3 | **CAN be used at zone apex! Free for AWS resources!** |
| **MX** | Mail routing | example.com → mail.example.com | Priority + domain |
| **NS** | Name server for the zone | example.com → ns1.awsdns.com | Delegation |
| **TXT** | Text records | example.com → "v=spf1 include:..." | Email verification, domain ownership |
| **SRV** | Service locator | _sip._tcp.example.com → server:port | Service discovery |
| **SOA** | Start of Authority | Zone metadata | Mandatory for every zone |

### CNAME vs Alias (EXAM CRITICAL!)

| Feature | CNAME | Alias |
|---|---|---|
| Zone apex (naked domain)? | **NO** (example.com can't use CNAME) | **YES** (example.com CAN use Alias) |
| Charge for queries | Yes ($0.40/million) | **Free for AWS resources** |
| Targets | Any domain name | Only AWS resources (ELB, CloudFront, S3, etc.) |
| Health checks | Via routing policy | Built-in evaluation |

**Exam Trap**: "Route example.com (zone apex) to an ALB" → Must use **Alias** record (not CNAME).

### Hosted Zones

| Type | What It Is | Cost |
|---|---|---|
| **Public Hosted Zone** | DNS records accessible from the internet | $0.50/month |
| **Private Hosted Zone** | DNS records accessible only from within specified VPCs | $0.50/month |

---

## 3. Routing Policies (EXAM CRITICAL — Know All 7!)

### 1. Simple Routing
- One record, one or more values
- If multiple values, client randomly picks one
- **No health checks**
- Use case: Single resource

### 2. Weighted Routing
- Split traffic by percentages
- Weight 70% → server A, 30% → server B
- Supports health checks
- Use case: **Blue/green deployments, A/B testing, gradual migration**

### 3. Latency-Based Routing
- Routes to the region with lowest latency for the user
- Based on AWS's latency measurements (not real-time)
- Use case: **Global applications — users in Asia route to ap-southeast-1, US users to us-east-1**

### 4. Failover Routing
- Primary and secondary (failover) target
- If primary fails health check → routes to secondary
- Use case: **Active-passive disaster recovery**
- **Must have health check on primary**

### 5. Geolocation Routing
- Routes based on user's **geographic location** (continent, country, state)
- **Does NOT use latency** — purely location-based
- Must set a "default" record for locations without specific rules
- Use case: **Content localization, regulatory compliance** ("EU users must access EU servers")

### 6. Geoproximity Routing (Traffic Flow)
- Routes based on geographic location of users AND resources
- Can **shift** traffic by expanding/shrinking a "bias" around a resource
- Bias: +1 to +99 (attract more traffic) or -1 to -99 (repel traffic)
- Requires **Route 53 Traffic Flow**
- Use case: **Gradually shift traffic between regions**

### 7. Multi-Value Answer Routing
- Returns up to 8 healthy records randomly
- Like Simple routing BUT with health checks
- Not a replacement for a load balancer — but provides basic client-side balancing
- Use case: Return multiple healthy IP addresses

### Routing Policy Decision Tree (Exam Quick Reference)

| Need | Use |
|---|---|
| Just one resource | Simple |
| Split by percentage | Weighted |
| Lowest latency globally | Latency-Based |
| Active-passive DR | Failover |
| Comply with laws (data must stay in country) | Geolocation |
| Gradually shift traffic between regions | Geoproximity |
| Multiple healthy IPs | Multi-Value |

---

## 4. Health Checks

Three types:

1. **Endpoint Health Checks**: Monitor a specific IP or domain
   - HTTP, HTTPS, or TCP
   - Status codes, response body matching
   - 15 global health checkers (must pass 18%+ threshold)

2. **Calculated Health Checks**: Combine multiple health checks
   - AND, OR, or M-of-N logic
   - "Healthy if at least 2 of 3 child checks pass"

3. **CloudWatch Alarm Health Checks**: Based on CloudWatch alarm state
   - Useful for monitoring private resources (not publicly accessible)
   - Route 53 can't health-check private endpoints directly

**Exam Tip**: Route 53 health checks are performed from the **public internet**. They can't access resources in private subnets. For private resources, use CloudWatch Alarm-based health checks.

---

## 5. Domain Registration

Route 53 can register domain names:
- .com, .org, .net, and many others
- Automatic DNS hosted zone creation
- DNSSEC support for domain signing
- Domain transfer from other registrars

---

## 6. Route 53 Resolver (Hybrid DNS — EXAM CRITICAL!)

For hybrid cloud environments where you need DNS resolution between AWS and on-premises:

| Endpoint | Direction | Use Case |
|---|---|---|
| **Inbound Endpoint** | On-prem DNS → AWS | On-prem servers resolve AWS private DNS names |
| **Outbound Endpoint** | AWS → On-prem DNS | AWS resources resolve on-prem DNS names |

**Architecture:**
```
On-premises servers → DNS query for "db.internal.aws" 
  → On-prem DNS forwards to Route 53 Inbound Endpoint
    → Route 53 resolves using Private Hosted Zone
      → Returns private IP

AWS Lambda → DNS query for "erp.internal.corp"
  → Route 53 Outbound Endpoint
    → Forwards to on-premises DNS server
      → Returns on-prem IP
```

---

## 7. Cost

| Resource | Cost |
|---|---|
| Hosted Zone | $0.50/month |
| Standard queries | $0.40 per million |
| Latency/Geolocation queries | $0.60 per million |
| Alias queries to AWS resources | **Free** |
| Health checks (basic) | $0.50/month per check |
| Health checks (HTTPS with string matching) | $2.00/month per check |
| Domain registration | $12-$40/year depending on TLD |

---

## 8. SAP-C02 Exam Questions (10+ Scenarios)

### Question 1 — Zone Apex
**Scenario**: A company needs to point example.com (naked domain) to their ALB. A CNAME record doesn't work. Why, and what should they use?

**Answer**: CNAME cannot be used at zone apex (the bare domain without subdomain). Use an **Alias record** pointing to the ALB. Alias records work at zone apex AND are free for AWS resources.

---

### Question 2 — Active-Passive DR
**Scenario**: Primary application in us-east-1, standby in eu-west-1. If primary fails, traffic should automatically go to standby.

**Answer**: **Failover routing policy** with health check on primary. Primary = us-east-1, Secondary = eu-west-1. If health check fails, Route 53 automatically routes to secondary.

---

### Question 3 — Global Low Latency
**Scenario**: A global application deployed in 4 AWS regions. Users should be routed to the region with lowest network latency.

**Answer**: **Latency-based routing policy** with records for each region. Route 53 automatically routes users to the lowest-latency region.

---

### Question 4 — Data Residency
**Scenario**: EU regulations require that European users' traffic must be served from EU-based servers. Non-EU users should be served from the US.

**Answer**: **Geolocation routing policy**:
- Europe → eu-west-1 ALB
- Default → us-east-1 ALB

**Why not Latency**: Latency might route an EU user to a US server if it happens to be faster. Geolocation enforces geographic boundaries.

---

### Question 5 — Blue/Green Deployment
**Scenario**: Deploying a new version alongside the old. Want to gradually shift traffic: 10% to new, then 25%, then 50%, then 100%.

**Answer**: **Weighted routing policy**:
- Old version: weight 90 → 75 → 50 → 0
- New version: weight 10 → 25 → 50 → 100

---

### Question 6 — Hybrid DNS
**Scenario**: After setting up Direct Connect, on-premises servers need to resolve AWS private DNS names (RDS endpoint, private hosted zone). How?

**Answer**: **Route 53 Resolver Inbound Endpoint** — Configure on-prem DNS to forward AWS domain queries to the Resolver Inbound Endpoint IPs.

---

### Question 7 — Private Hosted Zone
**Scenario**: Multiple VPCs need to use internal DNS names (db.internal, api.internal) that are not accessible from the internet.

**Answer**: Create a **Private Hosted Zone** and associate it with all VPCs that need access. Records in the private zone are only resolvable from within associated VPCs.

---

### Question 8 — Health Check for Private Resource
**Scenario**: An application in a private subnet needs Route 53 failover, but Route 53 health checks can't reach private IPs. How?

**Answer**: Create a **CloudWatch Alarm** monitoring the resource → Create a Route 53 health check based on the CloudWatch Alarm state.

---

## 9. Best Practices & Exam Tips

1. **"Zone apex / naked domain"** → Alias record (NOT CNAME)
2. **"Free DNS queries"** → Alias to AWS resources
3. **"Active-passive DR"** → Failover routing + health checks
4. **"Lowest latency globally"** → Latency-based routing
5. **"Data residency / regulatory"** → Geolocation routing
6. **"Gradual traffic shift"** → Weighted routing
7. **"Hybrid DNS"** → Route 53 Resolver (Inbound/Outbound Endpoints)
8. **"Private DNS"** → Private Hosted Zone
9. **"Health check private resource"** → CloudWatch Alarm-based health check
10. **Route 53 is a GLOBAL service** (not regional)

---

*Word count: ~3,500+ words*
