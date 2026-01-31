# Amazon Route 53

## What is Route 53?

Amazon Route 53 is a highly available and scalable Domain Name System (DNS) web service. It translates human-readable domain names (like example.com) into IP addresses (like 192.0.2.1) that computers use to connect. Route 53 also provides domain registration, health checking, and traffic management.

## Why Use Route 53?

### Key Benefits
- **High Availability**: 100% SLA (only AWS service with 100%)
- **Global Network**: Anycast routing with global POPs
- **Integrated**: Works seamlessly with AWS services
- **Health Checks**: Monitor endpoint health and route accordingly
- **Traffic Management**: Multiple routing policies
- **Domain Registration**: Register and manage domains
- **DNSSEC**: Secure DNS queries
- **Cost-Effective**: Pay per query (no minimum)

### Use Cases
- Domain name registration and management
- DNS hosting for websites and applications
- Traffic routing to AWS resources
- Global load balancing
- Disaster recovery and failover
- Blue/green deployments
- Geolocation-based routing

## DNS Basics (Quick Refresher)

### DNS Record Types

**A Record**: Maps domain to IPv4 address
```
example.com → 192.0.2.1
```

**AAAA Record**: Maps domain to IPv6 address
```
example.com → 2001:0db8:85a3::8a2e:0370:7334
```

**CNAME Record**: Maps alias to another domain
```
www.example.com → example.com
Cannot use at zone apex (example.com)
```

**ALIAS Record** (AWS-specific):
```
example.com → ELB, CloudFront, S3, etc.
Can use at zone apex
No charge for queries
```

**MX Record**: Mail server
```
example.com → mail.example.com (priority 10)
```

**TXT Record**: Text information
```
Used for: SPF, DKIM, domain verification
```

**NS Record**: Name server
```
Delegates subdomain to other name servers
```

**SOA Record**: Start of Authority
```
Primary name server, admin email, serial, refresh, retry, expire
```

### TTL (Time To Live)

**What**: How long DNS resolvers cache the record

```
High TTL (e.g., 86400 = 24 hours):
  + Fewer queries to Route 53 (lower cost)
  - Slower to propagate changes
  
Low TTL (e.g., 60 seconds):
  + Faster to propagate changes
  - More queries to Route 53 (higher cost)
```

**Best Practice**:
```
Normal operation: 300-3600 seconds
Before change: Lower to 60 seconds
After change propagates: Raise back
```

## Hosted Zones

### What is a Hosted Zone?

**Definition**: Container for DNS records for a domain

**Types**:
1. **Public Hosted Zone**: Internet-accessible domains
2. **Private Hosted Zone**: VPC-internal domains

### Public Hosted Zone

**Use Case**: Public websites, applications

**Example**:
```
Domain: example.com
NS Records (provided by Route 53):
  ns-123.awsdns-12.com
  ns-456.awsdns-34.net
  ns-789.awsdns-56.org
  ns-012.awsdns-78.co.uk

Update domain registrar with these NS records
```

**Records**:
```
example.com         A       192.0.2.1
www.example.com     CNAME   example.com
api.example.com     A       192.0.2.2
mail.example.com    A       192.0.2.3
example.com         MX      10 mail.example.com
```

**Cost**: $0.50/hosted zone/month + query charges

### Private Hosted Zone

**Use Case**: Internal DNS for VPCs

**Example**:
```
Domain: internal.company.com
Associated VPCs:
  - vpc-1234 (us-east-1)
  - vpc-5678 (us-west-2)

Records:
  db.internal.company.com     A   10.0.1.50
  api.internal.company.com    A   10.0.2.100
```

**Configuration**:
```
1. Create private hosted zone
2. Associate with VPC(s)
3. Enable DNS resolution in VPC
4. Enable DNS hostnames in VPC
```

**Multi-VPC**:
- Associate with multiple VPCs (same or different regions)
- VPCs can be in different AWS accounts (authorization required)

**Hybrid DNS**:
```
On-premises ← VPN/Direct Connect → VPC
                ↓
        Route 53 Resolver Endpoints
                ↓
        Private Hosted Zone
```

**Cost**: $0.50/hosted zone/month + query charges

## Routing Policies

### 1. Simple Routing

**What**: Single resource or multiple resources (random selection)

**Use Case**: Single web server or no specific routing logic

**Configuration**:
```
example.com    A    192.0.2.1
                    192.0.2.2
                    192.0.2.3

Client query: Gets all IPs, chooses randomly
```

**Limitations**:
- No health checks
- Cannot control which IP returned
- All IPs returned in random order

**Example**:
```
Static website:
example.com → S3 bucket (ALIAS record)

Web application:
example.com → ALB (ALIAS record)
```

### 2. Weighted Routing

**What**: Distribute traffic based on assigned weights

**Use Case**: Blue/green deployments, A/B testing, gradual migration

**Configuration**:
```
Record 1: example.com    A    192.0.2.1    Weight: 70
Record 2: example.com    A    192.0.2.2    Weight: 20
Record 3: example.com    A    192.0.2.3    Weight: 10

Traffic distribution:
  192.0.2.1: 70% (70/100)
  192.0.2.2: 20% (20/100)
  192.0.2.3: 10% (10/100)
```

**Blue/Green Deployment**:
```
Initial:
  Blue (current): Weight 100
  Green (new): Weight 0

Gradual shift:
  Step 1: Blue 90, Green 10
  Step 2: Blue 70, Green 30
  Step 3: Blue 50, Green 50
  Step 4: Blue 0, Green 100

Rollback: Adjust weights back to Blue
```

**Weight = 0**: Record never returned (unless all weights are 0)

**Health Checks**: Can associate with each record

**Example** (A/B Testing):
```
Current version: Weight 80
New version: Weight 20

Monitor metrics:
  - Conversion rate
  - Error rate
  - Performance

If new version better: Gradually increase weight
If worse: Reduce weight to 0
```

### 3. Latency-Based Routing

**What**: Route to resource with lowest latency for user

**Use Case**: Global applications, performance-sensitive

**Configuration**:
```
Record 1: example.com    A    192.0.2.1    Region: us-east-1
Record 2: example.com    A    192.0.2.2    Region: eu-west-1
Record 3: example.com    A    192.0.2.3    Region: ap-southeast-1

User in New York → us-east-1 (lowest latency)
User in London → eu-west-1
User in Singapore → ap-southeast-1
```

**How it Works**:
```
Route 53 maintains latency data between regions
Uses user's location (from DNS resolver)
Returns IP with lowest latency
```

**Health Checks**: Route 53 considers health status

**Example**:
```
E-commerce application:
  - North America: ALB in us-east-1
  - Europe: ALB in eu-west-1
  - Asia: ALB in ap-southeast-1

Route 53 latency routing:
  Automatically sends users to nearest region
  Improves page load times
  Better user experience
```

**Failover**:
```
Primary: us-east-1 (unhealthy)
Route 53: Routes to next lowest latency (eu-west-1)
```

### 4. Failover Routing

**What**: Active-passive failover to secondary resource

**Use Case**: Disaster recovery, high availability

**Configuration**:
```
Primary: example.com    A    192.0.2.1    Failover: Primary    Health Check: HC-1
Secondary: example.com  A    192.0.2.2    Failover: Secondary  Health Check: HC-2

Normal operation:
  All traffic → Primary (192.0.2.1)

If Primary unhealthy:
  All traffic → Secondary (192.0.2.2)

If Primary recovers:
  All traffic → Primary again
```

**Requirements**:
- Must have health check on Primary
- Secondary health check optional (but recommended)

**Example** (DR Setup):
```
Primary: us-east-1 (production)
  - ALB: alb-us-east-1.amazonaws.com
  - Health check: HTTPS /health every 30s
  
Secondary: us-west-2 (standby)
  - ALB: alb-us-west-2.amazonaws.com
  - Health check: HTTPS /health every 30s

Failover:
  us-east-1 region failure → Route 53 detects unhealthy
  Automatically routes to us-west-2
  RTO: ~1 minute (health check interval + TTL)
```

**Multi-Region Failover**:
```
Primary: us-east-1
Secondary: eu-west-1
Tertiary: ap-southeast-1

Chain of failover:
  us-east-1 (unhealthy) → eu-west-1
  eu-west-1 (unhealthy) → ap-southeast-1
```

### 5. Geolocation Routing

**What**: Route based on user's geographic location

**Use Case**: Content localization, compliance, restricting content

**Configuration**:
```
Default: example.com        A    192.0.2.1    Location: Default
Europe: example.com         A    192.0.2.2    Location: Europe
North America: example.com  A    192.0.2.3    Location: North America
Germany: example.com        A    192.0.2.4    Location: Germany

User in Germany → 192.0.2.4 (most specific)
User in France → 192.0.2.2 (Europe)
User in Brazil → 192.0.2.1 (Default)
```

**Granularity**:
- Continent
- Country
- US State

**Default Location**: Required (catch-all for unmatched locations)

**Use Cases**:

**Content Localization**:
```
US users → us.example.com (English, USD)
Germany users → de.example.com (German, EUR)
Japan users → jp.example.com (Japanese, JPY)
```

**Compliance**:
```
EU users → eu-datacenter.com (GDPR-compliant region)
Non-EU users → global-datacenter.com
```

**Content Restriction**:
```
Blocked countries → maintenance.example.com (access denied page)
Allowed countries → app.example.com
```

**Geolocation vs Latency**:
```
Geolocation:
  - User location determines route
  - May not be lowest latency
  - Use for: Compliance, localization

Latency:
  - Lowest latency determines route
  - User location influences but doesn't dictate
  - Use for: Performance
```

### 6. Geoproximity Routing

**What**: Route based on geographic location with bias adjustment

**Use Case**: Gradually shift traffic between regions, control traffic distribution

**Configuration**:
```
us-east-1: Lat/Long (39.0, -77.0)   Bias: 0
us-west-2: Lat/Long (45.5, -122.7)  Bias: +20

Bias adjustments:
  Positive bias (+): Expand geographic coverage (attract more traffic)
  Negative bias (-): Shrink geographic coverage (reduce traffic)

us-west-2 with +20 bias:
  Draws traffic from wider area (including parts of central US)
```

**Bias Range**: -99 to +99

**Use Case Example**:
```
Migration from us-east-1 to us-west-2:

Week 1:
  us-east-1: Bias 0
  us-west-2: Bias -50 (small coverage)

Week 2:
  us-east-1: Bias 0
  us-west-2: Bias 0 (equal)

Week 3:
  us-east-1: Bias -50
  us-west-2: Bias +50 (expanded coverage)

Week 4:
  us-east-1: Decommissioned
  us-west-2: Bias 0
```

**Geoproximity vs Geolocation**:
```
Geolocation:
  - Fixed boundaries (country, continent)
  - Exact location match
  
Geoproximity:
  - Flexible boundaries (adjustable with bias)
  - Distance-based with adjustments
```

### 7. Multi-Value Answer Routing

**What**: Return multiple healthy resources (up to 8)

**Use Case**: Simple load distribution with health checks

**Configuration**:
```
example.com    A    192.0.2.1    Health Check: HC-1
example.com    A    192.0.2.2    Health Check: HC-2
example.com    A    192.0.2.3    Health Check: HC-3
example.com    A    192.0.2.4    Health Check: HC-4

Query response (all healthy):
  Returns: 192.0.2.1, 192.0.2.2, 192.0.2.3, 192.0.2.4

Query response (192.0.2.2 unhealthy):
  Returns: 192.0.2.1, 192.0.2.3, 192.0.2.4 (excludes unhealthy)
```

**Difference from Simple Routing**:
```
Simple:
  - No health checks
  - Returns all records

Multi-Value:
  - Health checks on each
  - Returns only healthy records
```

**Not a Load Balancer**:
- Client chooses from returned IPs
- No session affinity
- No advanced load balancing

**Use Case**:
```
Web servers:
  web1.example.com: 192.0.2.1 (healthy)
  web2.example.com: 192.0.2.2 (healthy)
  web3.example.com: 192.0.2.3 (unhealthy, excluded)
  web4.example.com: 192.0.2.4 (healthy)

Client gets: 192.0.2.1, 192.0.2.2, 192.0.2.4
Client chooses randomly
```

## Health Checks

### What are Health Checks?

**Purpose**: Monitor endpoint availability and route traffic accordingly

**Types**:
1. **Endpoint Health Checks**: Monitor IP or domain
2. **Calculated Health Checks**: Combine multiple health checks
3. **CloudWatch Alarm Health Checks**: Based on CloudWatch alarms

### Endpoint Health Checks

**Configuration**:
```
Protocol: HTTP, HTTPS, TCP
IP/Domain: 192.0.2.1 or example.com
Port: 80, 443, custom
Path: /health (HTTP/HTTPS only)
Interval: 30 seconds (standard) or 10 seconds (fast)
Failure threshold: 3 consecutive failures
```

**Health Check Logic**:
```
Healthy: HTTP 200-399 response (or TCP connection success)
Unhealthy: HTTP 400+, timeout, connection failure

Route 53 checkers: 15+ global locations
Majority vote: >50% report healthy → Healthy
```

**String Matching** (HTTP/HTTPS):
```
Search for specific text in response body (first 5,120 bytes)

Example:
  Response must contain: "status:ok"
  
  If found → Healthy
  If not found or wrong status code → Unhealthy
```

**Example**:
```
Application health endpoint: /health

Response when healthy:
{
  "status": "ok",
  "database": "connected",
  "cache": "connected"
}

Health check:
  Protocol: HTTPS
  Domain: api.example.com
  Path: /health
  String match: "status\":\"ok"
  Interval: 30s
  Threshold: 3
```

**Fast Health Checks** (10-second interval):
- Cost: Higher ($1/month vs $0.50/month)
- Use: Lower RTO requirements

### Calculated Health Checks

**What**: Combine multiple health checks with logic

**Configuration**:
```
Child checks:
  HC-1: Database health
  HC-2: Cache health
  HC-3: App server health

Calculated check:
  Condition: At least 2 of 3 must be healthy
  
  Scenarios:
    HC-1: Healthy, HC-2: Healthy, HC-3: Unhealthy → Parent: Healthy
    HC-1: Healthy, HC-2: Unhealthy, HC-3: Unhealthy → Parent: Unhealthy
```

**Operators**:
- AND: All must be healthy
- OR: At least one must be healthy
- NOT: Invert health status
- Threshold: X out of Y must be healthy

**Use Case**:
```
Multi-tier application:
  - Web tier: 3 servers
  - App tier: 5 servers
  - Database: 1 primary, 1 replica

Calculated health check:
  Web tier healthy: 2/3 servers healthy
  App tier healthy: 3/5 servers healthy
  Database healthy: Primary OR replica healthy
  
  Overall healthy: Web AND App AND Database
```

### CloudWatch Alarm Health Checks

**What**: Based on CloudWatch metrics and alarms

**Use Case**: Complex health criteria, non-HTTP/TCP endpoints

**Example**:
```
CloudWatch Alarm:
  Metric: ALB TargetResponseTime
  Threshold: > 2 seconds for 5 minutes
  State: ALARM

Route 53 Health Check:
  Type: CloudWatch Alarm
  Alarm: ALB-ResponseTime-Alarm
  
  If ALARM state → Unhealthy
  If OK state → Healthy
```

**Advanced Scenarios**:
```
SQS queue depth:
  Alarm: Messages in queue > 10,000
  Health check: Based on alarm
  If unhealthy: Route traffic to secondary region

DynamoDB throttling:
  Alarm: ReadThrottleEvents > 10
  Health check: Based on alarm
  If unhealthy: Trigger Auto Scaling or failover
```

### Health Check Monitoring

**CloudWatch Metrics**:
- `HealthCheckStatus`: 1 (healthy) or 0 (unhealthy)
- `HealthCheckPercentageHealthy`: % of checkers reporting healthy
- `ChildHealthCheckHealthyCount`: For calculated checks

**Alarms**:
```
Alarm if HealthCheckStatus = 0 for 1 minute:
  - Send SNS notification
  - Trigger Lambda for auto-remediation
  - PagerDuty escalation
```

### Cost

**Standard** (30-second interval):
- $0.50/month per health check

**Fast** (10-second interval):
- $1.00/month per health check

**Calculated**:
- $1.00/month

**HTTPS**:
- $2.00/month (vs HTTP)

**String Matching**:
- +$1.00/month

**Example**:
```
10 endpoints: HTTPS with string matching, 30s interval
Cost: 10 × ($0.50 + $2.00 + $1.00) = $35/month
```

## ALIAS Records

### What are ALIAS Records?

**AWS-Specific**: Extension to DNS (not standard DNS)

**Purpose**: Point to AWS resources without using CNAME

**Supported Resources**:
- Elastic Load Balancers (ALB, NLB, CLB)
- CloudFront distributions
- S3 buckets (static website hosting)
- API Gateway
- VPC interface endpoints
- AWS Global Accelerator
- Another Route 53 record in same hosted zone

### ALIAS vs CNAME

| Feature | ALIAS | CNAME |
|---------|-------|-------|
| Zone apex | Supported | Not supported |
| Cost | Free | Charged per query |
| AWS resources | Yes | Yes |
| External domains | No | Yes |
| TTL | Automatic | Manual |
| Health checks | Supported | Supported |

**Example**:

**CNAME** (Not allowed at zone apex):
```
example.com    CNAME   alb-12345.us-east-1.elb.amazonaws.com
                       ↑ ERROR: CNAME not allowed at zone apex
```

**ALIAS** (Allowed):
```
example.com    ALIAS   alb-12345.us-east-1.elb.amazonaws.com
                       ↑ OK: ALIAS allowed at zone apex
```

**Cost**:
```
CNAME: Charged per query ($0.40/million queries)
ALIAS: Free (no query charges for AWS resources)
```

### Configuration

**Example** (ALB):
```
Record name: example.com
Type: A
Value/Route traffic to: 
  - Alias to Application Load Balancer
  - Region: us-east-1
  - ALB: alb-12345.us-east-1.elb.amazonaws.com
Evaluate target health: Yes

Route 53 automatically:
  - Queries ALB for IP addresses
  - Returns IPs to client
  - No query charges
```

**Evaluate Target Health**:
```
Yes: Route 53 checks ALB health
  - If ALB unhealthy: Don't return record
  - If using failover: Routes to secondary

No: Route 53 doesn't check ALB health
  - Returns record even if ALB unhealthy
```

### Use Cases

**1. Zone Apex**:
```
example.com → CloudFront distribution (not www.example.com)
Use ALIAS (CNAME not allowed)
```

**2. Cost Savings**:
```
1 billion queries/month:

CNAME: 1,000 million × $0.40 = $400/month
ALIAS: Free

Savings: $400/month
```

**3. Automatic IP Resolution**:
```
ALB IPs change: Route 53 automatically updates
No manual intervention needed
```

**4. Health Checking**:
```
example.com ALIAS → ALB (with health check evaluation)
If ALB targets unhealthy → Route 53 aware
Failover to secondary region
```

## Traffic Flow

### What is Traffic Flow?

**Purpose**: Visual editor for complex routing configurations

**Use Case**: Multiple routing policies, complex logic

**Example**:
```
User request
    ↓
Geolocation (Country)
    ├── US → Latency routing
    │         ├── us-east-1 (weighted 70%)
    │         └── us-west-2 (weighted 30%)
    ├── EU → Latency routing
    │         ├── eu-west-1 (primary)
    │         └── eu-central-1 (failover)
    └── Default → Failover
                  ├── ap-southeast-1 (primary)
                  └── us-east-1 (secondary)
```

**Benefits**:
- Visual diagram of traffic flow
- Reusable policy records
- Version control
- Simplifies complex routing

**Cost**:
- $50/month per policy record
- Additional $0.50/million queries

### Configuration

**1. Create Traffic Policy**:
```
Policy name: Global-App-Routing
Version: 1

Rules:
  1. Geolocation (Europe) → eu-west-1 ALB
  2. Geolocation (North America) → Latency (us-east-1, us-west-2)
  3. Default → Failover (us-east-1 primary, eu-west-1 secondary)
```

**2. Create Policy Record**:
```
Hosted zone: example.com
Policy: Global-App-Routing v1
Record name: app.example.com
```

**3. Version and Update**:
```
Traffic Policy: Global-App-Routing
  - v1: Initial configuration
  - v2: Added Asia Pacific latency routing
  - v3: Adjusted weights

Policy records update automatically to latest version (or pin to specific version)
```

## Domain Registration

### Registering Domains

**Supported TLDs**: .com, .net, .org, 100+ others

**Process**:
```
1. Search domain availability
2. Add to cart
3. Provide contact information
4. Auto-renew settings
5. Privacy protection (WHOIS)
6. Purchase

Route 53 automatically:
  - Creates hosted zone
  - Configures NS records
  - Manages registration
```

**Cost**:
```
.com: $13/year
.net: $13/year
.org: $13/year
.io: $49/year
.ai: $79/year

Annual renewal (auto-renew recommended)
```

**Transfer**:
```
Transfer domain to Route 53:
  1. Unlock domain at current registrar
  2. Get authorization code
  3. Initiate transfer in Route 53
  4. Confirm via email
  5. Transfer completes (5-7 days)
```

### Domain Management

**Auto-Renew**: Enabled by default (recommended)

**Transfer Lock**: Prevents unauthorized transfers

**Privacy Protection**:
- Hides personal info in WHOIS
- Included for eligible TLDs

**Nameservers**:
- Route 53 nameservers (default)
- Custom nameservers (if using external DNS)

## Cost Optimization

### 1. Use ALIAS Records

```
ALIAS to AWS resources: Free
CNAME to AWS resources: $0.40/million queries

For 1 billion queries:
  ALIAS: $0
  CNAME: $400/month
  
Savings: $400/month
```

### 2. Optimize TTL

```
High TTL (3600s):
  Fewer queries to Route 53
  Lower cost

Low TTL (60s):
  More queries
  Higher cost

Balance: 300-900 seconds for most use cases
```

### 3. Reduce Health Checks

```
Standard interval (30s): $0.50/month
Fast interval (10s): $1.00/month
HTTPS: +$2.00/month
String matching: +$1.00/month

Optimize:
  - Use standard interval when possible
  - Calculated health checks (reuse checks)
  - HTTP instead of HTTPS (if acceptable)
```

### 4. Consolidate Hosted Zones

```
Multiple hosted zones: $0.50 each
Consolidate subdomains into single zone

Before:
  app1.example.com hosted zone: $0.50/month
  app2.example.com hosted zone: $0.50/month
  Total: $1.00/month

After:
  example.com hosted zone: $0.50/month
  Records: app1.example.com, app2.example.com
  Total: $0.50/month
```

## Real-World Scenarios

### Scenario 1: Global E-Commerce Platform

**Requirements**:
- Users worldwide
- Low latency
- High availability

**Solution**:
```
Routing: Latency-based + Failover

Regions:
  - us-east-1 (primary for North America)
  - eu-west-1 (primary for Europe)
  - ap-southeast-1 (primary for Asia)

Configuration:
  example.com:
    Latency records:
      - us-east-1 ALB (health check)
      - eu-west-1 ALB (health check)
      - ap-southeast-1 ALB (health check)
    
    Each region has failover:
      us-east-1 (primary) → us-west-2 (secondary)
      eu-west-1 (primary) → eu-central-1 (secondary)
      ap-southeast-1 (primary) → ap-northeast-1 (secondary)

Health Checks:
  - ALB target health
  - Application /health endpoint
  - CloudWatch alarm (error rate <1%)

Behavior:
  - User in New York → us-east-1 (lowest latency)
  - User in London → eu-west-1
  - User in Tokyo → ap-southeast-1
  - If primary region unhealthy → Failover to secondary
```

**Cost** (~monthly):
```
Hosted zone: $0.50
Health checks: 6 regions × ($0.50 + $2) = $15
Queries: 10 billion × $0.40 / 1000 = $4,000
  (Actually free with ALIAS records)
Total: ~$15.50/month
```

### Scenario 2: Blue/Green Deployment

**Requirements**:
- Zero-downtime deployment
- Gradual traffic shift
- Quick rollback

**Solution**:
```
Routing: Weighted

Initial state (Blue production):
  blue.example.com ALIAS → ALB-Blue  Weight: 100
  green.example.com ALIAS → ALB-Green  Weight: 0
  example.com CNAME → blue.example.com

Deployment phase 1 (10% to Green):
  blue.example.com → Weight: 90
  green.example.com → Weight: 10
  
Monitor metrics (error rate, latency, conversion)

Phase 2 (50%):
  blue.example.com → Weight: 50
  green.example.com → Weight: 50

Phase 3 (100% to Green):
  blue.example.com → Weight: 0
  green.example.com → Weight: 100

Rollback (if needed):
  Instantly adjust weights back to Blue 100, Green 0
  RTO: TTL (60 seconds)

Cleanup:
  example.com CNAME → green.example.com
  Decommission Blue environment
```

### Scenario 3: Multi-Region Disaster Recovery

**Requirements**:
- Active-passive DR
- RPO: 15 minutes
- RTO: 5 minutes

**Solution**:
```
Primary: us-east-1
DR: us-west-2

Routing: Failover

example.com:
  Primary record:
    Type: A ALIAS
    Value: ALB us-east-1
    Failover: Primary
    Health check: HC-Primary
  
  Secondary record:
    Type: A ALIAS
    Value: ALB us-west-2
    Failover: Secondary
    Health check: HC-Secondary

Health Check HC-Primary:
  Type: Calculated
  Children:
    - ALB target health (50% healthy threshold)
    - CloudWatch alarm (DynamoDB replication lag <15min)
    - Application /health endpoint

Normal operation:
  All traffic → us-east-1

us-east-1 failure:
  1. Health check HC-Primary fails (3 consecutive, 30s interval = 90s)
  2. Route 53 routes to us-west-2
  3. DynamoDB Global Tables (replicated)
  4. RDS Read Replica promoted (manual or automated)
  5. Application in us-west-2 ready

RTO breakdown:
  - Health check detection: 90 seconds
  - DNS propagation: TTL (60 seconds)
  - Application warmup: 2 minutes
  Total: ~5 minutes

Failback:
  us-east-1 recovers → Health check becomes healthy
  Route 53 automatically routes back to us-east-1
```

### Scenario 4: Geolocation-Based Content

**Requirements**:
- Localized content per country
- Compliance (GDPR)
- Default fallback

**Solution**:
```
Routing: Geolocation

example.com:
  Germany:
    Type: A ALIAS
    Value: CloudFront de.example.com (EU data center)
    Location: Germany
  
  Europe (other):
    Type: A ALIAS
    Value: CloudFront eu.example.com (EU data center)
    Location: Europe
  
  United States:
    Type: A ALIAS
    Value: CloudFront us.example.com (US data center)
    Location: North America
  
  Default:
    Type: A ALIAS
    Value: CloudFront global.example.com
    Location: Default

Behavior:
  - German users → de.example.com (German language, EUR, GDPR-compliant)
  - French users → eu.example.com (French language, EUR, GDPR-compliant)
  - US users → us.example.com (English, USD)
  - Brazil users → global.example.com (Default)

Compliance:
  - EU users data stays in EU (GDPR Article 45)
  - CloudFront with geo-restriction
  - S3 bucket in eu-central-1
```

### Scenario 5: Hybrid DNS (On-Premises + AWS)

**Requirements**:
- On-premises Active Directory
- AWS workloads
- Unified DNS resolution

**Solution**:
```
On-Premises:
  - Domain: internal.company.com
  - DNS: Windows Server (10.0.0.10)

AWS VPC:
  - VPC: 10.1.0.0/16
  - Private Hosted Zone: aws.internal.company.com

Route 53 Resolver:
  Inbound Endpoint:
    - Subnets: 10.1.1.0/24, 10.1.2.0/24
    - IPs: 10.1.1.10, 10.1.2.10
    - Allows on-prem to query Route 53
  
  Outbound Endpoint:
    - Subnets: 10.1.3.0/24, 10.1.4.0/24
    - IPs: 10.1.3.10, 10.1.4.10
    - Allows VPC to query on-prem DNS

Forwarding Rules:
  Rule 1: internal.company.com → 10.0.0.10 (on-prem DNS)
  Rule 2: aws.internal.company.com → VPC+2 (Route 53)

Configuration:
  On-Premises DNS (10.0.0.10):
    Conditional forwarder:
      aws.internal.company.com → 10.1.1.10, 10.1.2.10
  
  VPC:
    DHCP option set: domain-name-servers = 10.1.0.2 (VPC+2)

Resolution flows:
  1. On-prem queries app.aws.internal.company.com:
     10.0.0.10 → 10.1.1.10 (Inbound Endpoint) → Route 53 → Response
  
  2. EC2 queries server.internal.company.com:
     10.1.0.2 → Outbound Endpoint → 10.0.0.10 → Response
  
  3. EC2 queries db.aws.internal.company.com:
     10.1.0.2 → Route 53 Private Hosted Zone → Response
```

**Cost** (~monthly):
```
Inbound endpoint: 2 AZs × $0.125/hour × 730 = $182.50
Outbound endpoint: 2 AZs × $0.125/hour × 730 = $182.50
DNS queries: 100M × $0.40/million = $40
Private hosted zone: $0.50
Total: ~$405.50/month
```

## Exam Tips (SAP-C02)

### Key Decision Points

**ALIAS vs CNAME**:
```
Need zone apex (example.com)? → ALIAS
Pointing to AWS resource? → ALIAS (free queries)
Pointing to external domain? → CNAME
```

**Routing Policy Selection**:
```
Simple use case, one resource → Simple
Traffic distribution (%) → Weighted
Lowest latency → Latency-based
Active-passive DR → Failover
Location-based content → Geolocation
Fine-grained location control → Geoproximity
Multiple IPs with health checks → Multi-value
```

**Health Checks**:
```
Endpoint monitoring → Endpoint health check
Complex logic (AND/OR) → Calculated health check
Based on CloudWatch metric → CloudWatch alarm health check
```

**Public vs Private Hosted Zone**:
```
Internet-accessible → Public
VPC-internal → Private
```

### Common Scenarios

**"Need zero-downtime deployment"**:
- Weighted routing (gradually shift traffic)
- Blue/green with weight adjustment

**"Route users to nearest data center"**:
- Latency-based routing (performance)
- or Geoproximity (control boundaries)

**"Disaster recovery with automatic failover"**:
- Failover routing with health checks
- Primary and secondary resources

**"Comply with data residency"**:
- Geolocation routing (country/continent-specific)
- Private hosted zones for internal

**"High query volume, cost concern"**:
- Use ALIAS records (free for AWS resources)
- Increase TTL
- Consolidate hosted zones

**"On-premises integration"**:
- Route 53 Resolver (inbound/outbound endpoints)
- Forwarding rules

This comprehensive Route 53 guide covers all aspects for the SAP-C02 exam.
