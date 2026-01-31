# Amazon Route 53: DNS and Traffic Management

## Table of Contents
1. [DNS Fundamentals](#dns-fundamentals)
2. [Route 53 History & Evolution](#route-53-history--evolution)
3. [Hosted Zones](#hosted-zones)
4. [Record Types](#record-types)
5. [Routing Policies](#routing-policies)
6. [Health Checks & Failover](#health-checks--failover)
7. [Traffic Flow](#traffic-flow)
8. [Domain Registration](#domain-registration)
9. [DNSSEC](#dnssec)
10. [LocalStack Examples](#localstack-examples)
11. [Production Patterns](#production-patterns)
12. [Interview Questions](#interview-questions)

---

## DNS Fundamentals

### What is DNS?

**Domain Name System**: Translates human-readable domain names to IP addresses.

**Without DNS**:
```
User types: 192.0.2.1 (IP address)
Problem: Hard to remember, changes frequently
```

**With DNS**:
```
User types: www.example.com
DNS resolves to: 192.0.2.1
Benefit: Memorable names, IP can change transparently
```

### DNS Hierarchy

```
Root (.)
  ↓
Top-Level Domain (TLD): .com, .org, .net, .io
  ↓
Second-Level Domain (SLD): example.com
  ↓
Subdomain: www.example.com, api.example.com
  ↓
Hostname: server1.api.example.com
```

**Example**:
```
www.example.com.
 ↓   ↓       ↓  ↓
 |   |       |  Root
 |   |       TLD (.com)
 |   SLD (example)
 Subdomain (www)
```

### DNS Resolution Process

**Iterative Resolution**:
```
1. User enters: www.example.com

2. Browser cache:
   - Check if recently resolved
   - TTL expired? Proceed to step 3

3. OS cache:
   - Check /etc/hosts (Linux) or C:\Windows\System32\drivers\etc\hosts
   - Not found? Proceed to step 4

4. Recursive DNS Resolver (ISP or 8.8.8.8):
   - Checks its cache
   - Not found? Query root nameserver

5. Root Nameserver:
   - Returns: "Ask .com TLD server at 192.0.2.1"

6. TLD Nameserver (.com):
   - Returns: "Ask example.com authoritative server at 203.0.113.1"

7. Authoritative Nameserver (example.com):
   - Returns: "www.example.com → 198.51.100.1, TTL=300"

8. Recursive Resolver:
   - Caches response for 300 seconds
   - Returns IP to user

9. Browser:
   - Caches response
   - Connects to 198.51.100.1

Total time: 100-300 ms (first request), <1 ms (cached)
```

### DNS Record Lifecycle

**Time To Live (TTL)**:
```
DNS Record:
  Name: www.example.com
  Type: A
  Value: 198.51.100.1
  TTL: 300 (5 minutes)

Caching behavior:
- t=0: DNS query, cache empty
  → Query nameserver (300 ms)
  → Cache response for 300 seconds

- t=100: Second request
  → Cache hit (1 ms)

- t=301: Cache expired
  → Query nameserver again (300 ms)

TTL strategy:
- Long TTL (86400 = 24 hours): Reduce query load, slow propagation
- Short TTL (60 = 1 minute): Fast propagation, higher query load

Best practice:
- Normal: 3600 (1 hour)
- Before change: 60 (1 minute)
- After change: 3600 (1 hour)
```

---

## Route 53 History & Evolution

### Before Route 53 (Pre-2010)

**Self-Managed DNS**:
```
Options:
- BIND (Berkeley Internet Name Domain)
- Windows DNS Server
- Third-party: GoDaddy, Namecheap

Challenges:
❌ Provision DNS servers (minimum 2 for redundancy)
❌ Configure zones and records manually
❌ Handle DDoS attacks on DNS infrastructure
❌ Global distribution (multiple datacenters)
❌ No programmatic API
❌ Downtime during DNS server failures

Time: 1-2 weeks to set up redundant DNS
Cost: $100-500/month for managed DNS service
```

### Route 53 Launch (December 2010)

**Amazon Route 53**: Highly available and scalable DNS service.

**Name Origin**:
```
"Route 53" = TCP/UDP port 53 (DNS protocol)
```

**Revolutionary Features**:
```
✅ Global anycast network (100+ edge locations)
✅ 100% SLA (first DNS service with SLA)
✅ Low latency (<100 ms worldwide)
✅ API-driven (Infrastructure as Code)
✅ Integration with AWS services (ELB, S3, CloudFront)
✅ Health checks and automatic failover
✅ Pricing: $0.50/hosted zone/month + $0.40 per million queries

Key innovation: DNS as a service (no servers to manage)
```

### Evolution Timeline

```
2010: Route 53 Launch (basic DNS)
2011: Health checks and failover
2012: Latency-based routing
2013: Weighted routing, Geo routing
2014: Domain registration
2015: Traffic Flow (visual policy editor)
2016: VPC DNS resolution (Private Hosted Zones)
2017: Multi-value answer routing
2018: Route 53 Resolver (hybrid cloud DNS)
2019: Geoproximity routing
2020: DNSSEC (DNS Security Extensions)
2021: CIDR routing
2022: DNS Firewall
2023: Application Recovery Controller
```

### Why Route 53 Was Created

**Problem 1: DNS Availability**
```
Traditional DNS:
- Single provider failure = site down
- DDoS attack = DNS unavailable
- Regional outage = no DNS resolution

Example: Dyn DDoS attack (2016)
- Affected: Twitter, Netflix, Reddit
- Duration: 2 hours
- Cause: Single DNS provider

Route 53 Solution:
- Anycast network (queries routed to nearest healthy location)
- 100+ locations worldwide
- 100% SLA (Amazon refunds if downtime)
- Result: Never a global Route 53 outage
```

**Problem 2: Latency**
```
Traditional DNS (central nameserver):
- User in Sydney → DNS server in Virginia
- Latency: 250 ms

Route 53 (anycast):
- User in Sydney → Nearest edge location (Sydney)
- Latency: 10-20 ms

Impact: 10x faster DNS resolution
```

**Problem 3: Manual Failover**
```
Traditional approach:
1. Primary server fails
2. Admin notified (5-10 min)
3. Update DNS record manually
4. Wait for TTL to expire (15-60 min)
Total downtime: 20-70 minutes

Route 53 Health Checks:
1. Primary server fails
2. Health check fails (30 seconds)
3. Route 53 automatically switches to backup
4. Users redirected within TTL
Total downtime: 30-60 seconds (95% reduction)
```

**Problem 4: Global Traffic Management**
```
Use case: Serve users from nearest datacenter

Before Route 53:
- Manual GeoDNS configuration
- Complex zone files
- No health awareness

With Route 53:
- Latency-based routing (automatic)
- Geolocation routing (continents, countries)
- Health-aware (skip unhealthy regions)

Example:
- User in Japan → ap-northeast-1 (Tokyo)
- User in Germany → eu-central-1 (Frankfurt)
- User in Brazil → sa-east-1 (São Paulo)
```

---

## Hosted Zones

### What is a Hosted Zone?

**Container for DNS records**: Defines how Route 53 routes traffic for a domain.

**Types**:

**1. Public Hosted Zone**:
```
Purpose: Route internet traffic for public domain
Example: example.com

Records:
- www.example.com → 198.51.100.1 (web server)
- api.example.com → my-alb.us-east-1.elb.amazonaws.com (API)
- mail.example.com → 203.0.113.1 (mail server)

Visibility: Public internet
Cost: $0.50/month per hosted zone
```

**2. Private Hosted Zone**:
```
Purpose: Route traffic within VPC (internal DNS)
Example: internal.example.com

Records:
- db.internal.example.com → 10.0.1.5 (RDS instance)
- cache.internal.example.com → 10.0.2.10 (ElastiCache)
- api.internal.example.com → internal-alb.us-east-1.elb.amazonaws.com

Visibility: Only within associated VPC(s)
Cost: $0.50/month per hosted zone
```

### Creating Hosted Zone

**Public Hosted Zone**:
```python
import boto3

route53 = boto3.client('route53')

response = route53.create_hosted_zone(
    Name='example.com',
    CallerReference='2024-01-31-12345',  # Unique identifier
    HostedZoneConfig={
        'Comment': 'Production domain',
        'PrivateZone': False
    }
)

zone_id = response['HostedZone']['Id']
nameservers = response['DelegationSet']['NameServers']

print(f"Hosted Zone ID: {zone_id}")
print(f"Nameservers: {nameservers}")
# Output:
# Hosted Zone ID: /hostedzone/Z1234567890ABC
# Nameservers: ['ns-123.awsdns-12.com', 'ns-456.awsdns-34.net', ...]
```

**Update Domain Registrar**:
```
After creating hosted zone, update domain registrar (GoDaddy, Namecheap, etc.):

1. Go to domain registrar
2. Find "Nameservers" or "DNS Settings"
3. Replace registrar nameservers with Route 53 nameservers:
   - ns-123.awsdns-12.com
   - ns-456.awsdns-34.net
   - ns-789.awsdns-56.org
   - ns-012.awsdns-78.co.uk

4. Save changes (propagation: 24-48 hours)
```

**Private Hosted Zone**:
```python
response = route53.create_hosted_zone(
    Name='internal.example.com',
    CallerReference='2024-01-31-54321',
    VPC={
        'VPCRegion': 'us-east-1',
        'VPCId': 'vpc-12345678'
    },
    HostedZoneConfig={
        'Comment': 'Internal services',
        'PrivateZone': True
    }
)

# Associate with additional VPCs
route53.associate_vpc_with_hosted_zone(
    HostedZoneId=zone_id,
    VPC={
        'VPCRegion': 'us-west-2',
        'VPCId': 'vpc-87654321'
    }
)
```

### Hosted Zone Structure

**Nameservers**:
```
Each hosted zone gets 4 nameservers:
- ns-123.awsdns-12.com
- ns-456.awsdns-34.net
- ns-789.awsdns-56.org
- ns-012.awsdns-78.co.uk

These are authoritative for your domain.

Redundancy:
- 4 different TLDs (.com, .net, .org, .co.uk)
- Geographically distributed
- 100% uptime SLA
```

---

## Record Types

### A Record (Address)

**Maps domain to IPv4 address**:
```bash
# Create A record
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.example.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "198.51.100.1"}]
      }
    }]
  }'
```

**Python**:
```python
route53.change_resource_record_sets(
    HostedZoneId='Z1234567890ABC',
    ChangeBatch={
        'Changes': [{
            'Action': 'UPSERT',  # CREATE or UPDATE
            'ResourceRecordSet': {
                'Name': 'www.example.com',
                'Type': 'A',
                'TTL': 300,
                'ResourceRecords': [{'Value': '198.51.100.1'}]
            }
        }]
    }
)
```

### AAAA Record (IPv6)

**Maps domain to IPv6 address**:
```python
{
    'Name': 'www.example.com',
    'Type': 'AAAA',
    'TTL': 300,
    'ResourceRecords': [{'Value': '2001:0db8:85a3::8a2e:0370:7334'}]
}
```

### CNAME Record (Canonical Name)

**Alias for another domain**:
```python
# Point blog to WordPress hosting
{
    'Name': 'blog.example.com',
    'Type': 'CNAME',
    'TTL': 300,
    'ResourceRecords': [{'Value': 'example.wordpress.com'}]
}

# Limitation: Cannot create CNAME for apex domain (example.com)
# ❌ example.com CNAME → something.else.com (not allowed)
# ✅ www.example.com CNAME → something.else.com (allowed)
```

### Alias Record (AWS-Specific)

**Like CNAME but for AWS resources**:
```python
# Point apex domain to CloudFront
{
    'Name': 'example.com',  # ✅ Apex domain supported
    'Type': 'A',
    'AliasTarget': {
        'HostedZoneId': 'Z2FDTNDATAQYW2',  # CloudFront hosted zone
        'DNSName': 'd111111abcdef8.cloudfront.net',
        'EvaluateTargetHealth': False
    }
}

# Point subdomain to ALB
{
    'Name': 'api.example.com',
    'Type': 'A',
    'AliasTarget': {
        'HostedZoneId': 'Z215JYRZR1TBD5',  # ALB hosted zone (us-east-1)
        'DNSName': 'my-alb-123456.us-east-1.elb.amazonaws.com',
        'EvaluateTargetHealth': True  # Use ALB health checks
    }
}

# Point subdomain to S3 website
{
    'Name': 'static.example.com',
    'Type': 'A',
    'AliasTarget': {
        'HostedZoneId': 'Z3AQBSTGFYJSTF',  # S3 website hosted zone (us-east-1)
        'DNSName': 's3-website-us-east-1.amazonaws.com',
        'EvaluateTargetHealth': False
    }
}
```

**Alias vs CNAME**:
```
Alias:
✅ Free (no query charges)
✅ Supports apex domain (example.com)
✅ Integrates with AWS health checks
✅ Only for AWS resources

CNAME:
✅ Any external domain
❌ $0.40 per million queries
❌ Cannot use for apex domain
❌ No health check integration
```

### MX Record (Mail Exchange)

**Email routing**:
```python
# Google Workspace email
{
    'Name': 'example.com',
    'Type': 'MX',
    'TTL': 3600,
    'ResourceRecords': [
        {'Value': '1 aspmx.l.google.com'},
        {'Value': '5 alt1.aspmx.l.google.com'},
        {'Value': '5 alt2.aspmx.l.google.com'},
        {'Value': '10 alt3.aspmx.l.google.com'},
        {'Value': '10 alt4.aspmx.l.google.com'}
    ]
}

# Priority: Lower number = higher priority
# Email servers try priority 1 first, then 5, then 10
```

### TXT Record (Text)

**Arbitrary text (SPF, DKIM, verification)**:
```python
# SPF (Sender Policy Framework) - prevent email spoofing
{
    'Name': 'example.com',
    'Type': 'TXT',
    'TTL': 300,
    'ResourceRecords': [{'Value': '"v=spf1 include:_spf.google.com ~all"'}]
}

# Domain verification (Google Search Console)
{
    'Name': 'example.com',
    'Type': 'TXT',
    'TTL': 300,
    'ResourceRecords': [{'Value': '"google-site-verification=abc123xyz"'}]
}

# DKIM (DomainKeys Identified Mail) - email authentication
{
    'Name': 'default._domainkey.example.com',
    'Type': 'TXT',
    'TTL': 300,
    'ResourceRecords': [{'Value': '"v=DKIM1; k=rsa; p=MIGfMA0GCS..."'}]
}
```

### NS Record (Nameserver)

**Delegate subdomain to different nameservers**:
```python
# Delegate subdomain to external DNS
{
    'Name': 'partner.example.com',
    'Type': 'NS',
    'TTL': 172800,  # 2 days
    'ResourceRecords': [
        {'Value': 'ns1.partner-dns.com'},
        {'Value': 'ns2.partner-dns.com'}
    ]
}

# Use case: Give partner control over partner.example.com
```

### SRV Record (Service)

**Service location (port, protocol)**:
```python
# Minecraft server
{
    'Name': '_minecraft._tcp.example.com',
    'Type': 'SRV',
    'TTL': 300,
    'ResourceRecords': [
        {'Value': '0 5 25565 mc.example.com'}
        # Priority Weight Port Target
    ]
}

# Format: priority weight port target
# 0 = highest priority
# 5 = weight (for load distribution)
# 25565 = port
# mc.example.com = target server
```

### CAA Record (Certification Authority Authorization)

**Restrict which CAs can issue SSL certificates**:
```python
{
    'Name': 'example.com',
    'Type': 'CAA',
    'TTL': 300,
    'ResourceRecords': [
        {'Value': '0 issue "letsencrypt.org"'},
        {'Value': '0 issue "amazon.com"'},
        {'Value': '0 issuewild ";"'}  # Prevent wildcard certs
    ]
}

# Prevents unauthorized SSL certificate issuance
```

---

## Routing Policies

### Simple Routing

**Single resource, no health checks**:
```python
{
    'Name': 'www.example.com',
    'Type': 'A',
    'TTL': 300,
    'ResourceRecords': [
        {'Value': '198.51.100.1'}
    ]
}

# OR multiple IPs (returned in random order):
{
    'Name': 'www.example.com',
    'Type': 'A',
    'TTL': 300,
    'ResourceRecords': [
        {'Value': '198.51.100.1'},
        {'Value': '198.51.100.2'},
        {'Value': '198.51.100.3'}
    ]
}

Use case: Single server or simple load distribution
Limitation: No health checks, no traffic control
```

### Weighted Routing

**Distribute traffic by percentage**:
```python
# 70% to new version, 30% to old version

# Record 1 (70%)
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'New-Version',
    'Weight': 70,
    'TTL': 60,
    'ResourceRecords': [{'Value': '198.51.100.1'}]
}

# Record 2 (30%)
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'Old-Version',
    'Weight': 30,
    'TTL': 60,
    'ResourceRecords': [{'Value': '198.51.100.2'}]
}

# Weight calculation:
# Traffic to Record 1 = 70 / (70 + 30) = 70%
# Traffic to Record 2 = 30 / (70 + 30) = 30%

# Gradually shift traffic (blue-green deployment):
# Week 1: 10% new, 90% old
# Week 2: 25% new, 75% old
# Week 3: 50% new, 50% old
# Week 4: 100% new, 0% old (delete old record)
```

**Python Example**:
```python
def create_weighted_records(zone_id, name, records):
    """
    records = [
        {'ip': '198.51.100.1', 'weight': 70, 'id': 'Server-1'},
        {'ip': '198.51.100.2', 'weight': 30, 'id': 'Server-2'}
    ]
    """
    changes = []
    
    for record in records:
        changes.append({
            'Action': 'UPSERT',
            'ResourceRecordSet': {
                'Name': name,
                'Type': 'A',
                'SetIdentifier': record['id'],
                'Weight': record['weight'],
                'TTL': 60,
                'ResourceRecords': [{'Value': record['ip']}]
            }
        })
    
    route53.change_resource_record_sets(
        HostedZoneId=zone_id,
        ChangeBatch={'Changes': changes}
    )

# Blue-green deployment
create_weighted_records('Z1234567890ABC', 'www.example.com', [
    {'ip': '198.51.100.1', 'weight': 10, 'id': 'Blue'},   # New version
    {'ip': '198.51.100.2', 'weight': 90, 'id': 'Green'}   # Old version
])
```

### Latency-Based Routing

**Route to lowest latency region**:
```python
# us-east-1 server
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'US-East',
    'Region': 'us-east-1',
    'TTL': 60,
    'ResourceRecords': [{'Value': '198.51.100.1'}]
}

# eu-west-1 server
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'EU-West',
    'Region': 'eu-west-1',
    'TTL': 60,
    'ResourceRecords': [{'Value': '203.0.113.1'}]
}

# ap-southeast-1 server
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'AP-Southeast',
    'Region': 'ap-southeast-1',
    'TTL': 60,
    'ResourceRecords': [{'Value': '192.0.2.1'}]
}

# Behavior:
# User in New York → us-east-1 (20 ms)
# User in London → eu-west-1 (15 ms)
# User in Tokyo → ap-southeast-1 (10 ms)

# Route 53 measures latency from user to each region
# Returns IP with lowest latency
```

**With Health Checks**:
```python
# Create health check
health_check = route53.create_health_check(
    HealthCheckConfig={
        'Type': 'HTTPS',
        'ResourcePath': '/health',
        'FullyQualifiedDomainName': 'www.example.com',
        'Port': 443,
        'RequestInterval': 30,  # 30 seconds
        'FailureThreshold': 3   # 3 consecutive failures
    }
)

# Associate with record
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'US-East',
    'Region': 'us-east-1',
    'HealthCheckId': health_check['HealthCheck']['Id'],
    'TTL': 60,
    'ResourceRecords': [{'Value': '198.51.100.1'}]
}

# If us-east-1 fails health check → route to next lowest latency region
```

### Failover Routing

**Active-passive failover**:
```python
# Primary (active)
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'Primary',
    'Failover': 'PRIMARY',
    'HealthCheckId': 'abc123',  # Health check for primary
    'TTL': 60,
    'ResourceRecords': [{'Value': '198.51.100.1'}]
}

# Secondary (passive)
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'Secondary',
    'Failover': 'SECONDARY',
    'TTL': 60,
    'ResourceRecords': [{'Value': '203.0.113.1'}]
}

# Behavior:
# Normal: All traffic → Primary (198.51.100.1)
# Primary fails health check: All traffic → Secondary (203.0.113.1)
# Primary recovers: Traffic returns to Primary

# Use case: Disaster recovery
# Primary: us-east-1
# Secondary: us-west-2 (backup region)
```

### Geolocation Routing

**Route based on user location (continent, country, state)**:
```python
# Default (rest of world)
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'Default',
    'GeoLocation': {'ContinentCode': '*'},  # Default location
    'TTL': 60,
    'ResourceRecords': [{'Value': '198.51.100.1'}]
}

# Europe
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'Europe',
    'GeoLocation': {'ContinentCode': 'EU'},
    'TTL': 60,
    'ResourceRecords': [{'Value': '203.0.113.1'}]
}

# United States
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'USA',
    'GeoLocation': {'CountryCode': 'US'},
    'TTL': 60,
    'ResourceRecords': [{'Value': '192.0.2.1'}]
}

# California (most specific wins)
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'California',
    'GeoLocation': {
        'CountryCode': 'US',
        'SubdivisionCode': 'CA'
    },
    'TTL': 60,
    'ResourceRecords': [{'Value': '192.0.2.2'}]
}

# Precedence (most specific to least):
# 1. State (California)
# 2. Country (United States)
# 3. Continent (Europe)
# 4. Default (*)

# Use cases:
# - Content localization
# - Compliance (GDPR, data sovereignty)
# - Regional pricing
```

### Geoproximity Routing

**Route based on geographic distance with bias**:
```python
# us-east-1 (bias +10 = expand coverage area by 10%)
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'US-East',
    'GeoProximityLocation': {
        'AWSRegion': 'us-east-1',
        'Bias': 10  # -99 to +99
    },
    'TTL': 60,
    'ResourceRecords': [{'Value': '198.51.100.1'}]
}

# eu-west-1 (bias -20 = shrink coverage area by 20%)
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'EU-West',
    'GeoProximityLocation': {
        'AWSRegion': 'eu-west-1',
        'Bias': -20
    },
    'TTL': 60,
    'ResourceRecords': [{'Value': '203.0.113.1'}]
}

# Custom coordinates (on-premises datacenter)
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'OnPrem',
    'GeoProximityLocation': {
        'Coordinates': {
            'Latitude': '37.7749',   # San Francisco
            'Longitude': '-122.4194'
        },
        'Bias': 0
    },
    'TTL': 60,
    'ResourceRecords': [{'Value': '192.0.2.1'}]
}

# Bias use cases:
# - Shift traffic away from overloaded region (negative bias)
# - Prefer cheaper region (positive bias)
# - Test new region with small traffic (negative bias on new region)
```

### Multi-Value Answer Routing

**Return multiple IPs with health checks**:
```python
# Server 1
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'Server-1',
    'MultiValueAnswer': True,
    'HealthCheckId': 'health-check-1',
    'TTL': 60,
    'ResourceRecords': [{'Value': '198.51.100.1'}]
}

# Server 2
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'Server-2',
    'MultiValueAnswer': True,
    'HealthCheckId': 'health-check-2',
    'TTL': 60,
    'ResourceRecords': [{'Value': '198.51.100.2'}]
}

# Server 3
{
    'Name': 'www.example.com',
    'Type': 'A',
    'SetIdentifier': 'Server-3',
    'MultiValueAnswer': True,
    'HealthCheckId': 'health-check-3',
    'TTL': 60,
    'ResourceRecords': [{'Value': '198.51.100.3'}]
}

# Behavior:
# Query www.example.com → Returns up to 8 healthy IPs
# Client randomly chooses one
# Unhealthy servers excluded

# Difference from Simple Routing:
# Simple: Returns all IPs (including unhealthy)
# Multi-Value: Returns only healthy IPs

# Use case: Simple load balancing with health awareness
```

---

## Health Checks & Failover

### Health Check Types

**1. Endpoint Health Check**:
```python
route53.create_health_check(
    HealthCheckConfig={
        'Type': 'HTTPS',
        'ResourcePath': '/health',
        'FullyQualifiedDomainName': 'api.example.com',
        'Port': 443,
        'RequestInterval': 30,      # 10 or 30 seconds
        'FailureThreshold': 3,      # Consecutive failures before unhealthy
        'MeasureLatency': True,
        'EnableSNI': True            # Server Name Indication for HTTPS
    }
)

# Health check behavior:
# - Every 30 seconds, Route 53 sends HTTPS request to https://api.example.com:443/health
# - Expected response: HTTP 2xx or 3xx
# - If 3 consecutive failures → Unhealthy
# - If 1 success after unhealthy → Healthy

# Cost: $0.50/month per health check
```

**2. Calculated Health Check** (aggregate):
```python
# Check if 2 out of 3 servers are healthy

# Individual health checks
hc1 = create_health_check('server1.example.com')
hc2 = create_health_check('server2.example.com')
hc3 = create_health_check('server3.example.com')

# Calculated health check
calculated_hc = route53.create_health_check(
    HealthCheckConfig={
        'Type': 'CALCULATED',
        'ChildHealthChecks': [hc1, hc2, hc3],
        'HealthThreshold': 2  # At least 2 must be healthy
    }
)

# Use case: Service considered healthy if majority of servers healthy
```

**3. CloudWatch Alarm Health Check**:
```python
# Create CloudWatch alarm
cloudwatch = boto3.client('cloudwatch')
alarm = cloudwatch.put_metric_alarm(
    AlarmName='HighCPU',
    MetricName='CPUUtilization',
    Namespace='AWS/EC2',
    Statistic='Average',
    Period=300,
    EvaluationPeriods=2,
    Threshold=80.0,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[{'Name': 'InstanceId', 'Value': 'i-1234567890abcdef0'}]
)

# Health check based on alarm
route53.create_health_check(
    HealthCheckConfig={
        'Type': 'CLOUDWATCH_METRIC',
        'AlarmIdentifier': {
            'Name': 'HighCPU',
            'Region': 'us-east-1'
        },
        'InsufficientDataHealthStatus': 'Healthy'  # or 'Unhealthy', 'LastKnownStatus'
    }
)

# Use case: Route traffic away from overloaded servers
```

### Health Check Monitoring

**CloudWatch Metrics**:
```python
# View health check status
cloudwatch.get_metric_statistics(
    Namespace='AWS/Route53',
    MetricName='HealthCheckStatus',
    Dimensions=[{'Name': 'HealthCheckId', 'Value': 'abc123'}],
    StartTime=datetime.utcnow() - timedelta(hours=1),
    EndTime=datetime.utcnow(),
    Period=60,
    Statistics=['Average']
)

# Metrics:
# - HealthCheckStatus: 1 (healthy), 0 (unhealthy)
# - HealthCheckPercentageHealthy: % of checkers reporting healthy
# - ConnectionTime: Time to establish connection
# - TimeToFirstByte: Latency to receive first byte
# - SSLHandshakeTime: SSL/TLS handshake duration
```

**Alarms**:
```python
cloudwatch.put_metric_alarm(
    AlarmName='UnhealthyEndpoint',
    MetricName='HealthCheckStatus',
    Namespace='AWS/Route53',
    Statistic='Average',
    Period=60,
    EvaluationPeriods=2,
    Threshold=1.0,
    ComparisonOperator='LessThanThreshold',
    AlarmActions=['arn:aws:sns:us-east-1:123456789012:alerts'],
    Dimensions=[{'Name': 'HealthCheckId', 'Value': 'abc123'}]
)

# Alert when endpoint becomes unhealthy
```

### Disaster Recovery Pattern

**Multi-Region Failover**:
```python
# Primary region (us-east-1)
primary_hc = route53.create_health_check(
    HealthCheckConfig={
        'Type': 'HTTPS',
        'ResourcePath': '/health',
        'FullyQualifiedDomainName': 'api-us-east-1.example.com',
        'Port': 443,
        'RequestInterval': 30,
        'FailureThreshold': 2
    }
)

# Primary record
route53.change_resource_record_sets(
    HostedZoneId='Z1234567890ABC',
    ChangeBatch={
        'Changes': [{
            'Action': 'UPSERT',
            'ResourceRecordSet': {
                'Name': 'api.example.com',
                'Type': 'A',
                'SetIdentifier': 'Primary-US-East-1',
                'Failover': 'PRIMARY',
                'HealthCheckId': primary_hc['HealthCheck']['Id'],
                'AliasTarget': {
                    'HostedZoneId': 'Z215JYRZR1TBD5',  # ALB hosted zone
                    'DNSName': 'alb-us-east-1.elb.amazonaws.com',
                    'EvaluateTargetHealth': True
                }
            }
        }]
    }
)

# Secondary region (us-west-2)
route53.change_resource_record_sets(
    HostedZoneId='Z1234567890ABC',
    ChangeBatch={
        'Changes': [{
            'Action': 'UPSERT',
            'ResourceRecordSet': {
                'Name': 'api.example.com',
                'Type': 'A',
                'SetIdentifier': 'Secondary-US-West-2',
                'Failover': 'SECONDARY',
                'AliasTarget': {
                    'HostedZoneId': 'Z1H1FL5HABSF5',  # ALB hosted zone (us-west-2)
                    'DNSName': 'alb-us-west-2.elb.amazonaws.com',
                    'EvaluateTargetHealth': False
                }
            }
        }]
    }
)

# Behavior:
# 1. Normal: All traffic → us-east-1
# 2. us-east-1 region fails: Traffic → us-west-2 (within 60 seconds)
# 3. us-east-1 recovers: Traffic returns to us-east-1

# RTO (Recovery Time Objective): 60 seconds (TTL)
# RPO (Recovery Point Objective): Depends on data replication
```

---

## Traffic Flow

### Visual Policy Editor

**Traffic Flow**: Drag-and-drop interface for complex routing.

**Use Cases**:
- Multi-level failover
- Geographic + latency routing
- Weighted distribution across regions
- A/B testing with health checks

**Example: Global Application with Regional Failover**:
```
Traffic Policy:

Start
  ↓
Geolocation (Continent)
  ├─ North America → Latency (US)
  │                   ├─ us-east-1 (Primary) [Health Check]
  │                   └─ us-west-2 (Secondary)
  │
  ├─ Europe → Latency (EU)
  │            ├─ eu-west-1 (Primary) [Health Check]
  │            └─ eu-central-1 (Secondary)
  │
  └─ Asia → Latency (AP)
             ├─ ap-southeast-1 (Primary) [Health Check]
             └─ ap-northeast-1 (Secondary)
```

**Creating Traffic Policy**:
```json
{
  "AWSPolicyFormatVersion": "2015-10-01",
  "RecordType": "A",
  "Endpoints": {
    "us-east-1": {
      "Type": "value",
      "Value": "198.51.100.1"
    },
    "us-west-2": {
      "Type": "value",
      "Value": "198.51.100.2"
    },
    "eu-west-1": {
      "Type": "value",
      "Value": "203.0.113.1"
    }
  },
  "Rules": {
    "Geolocation Rule": {
      "RuleType": "geo",
      "GeolocationRules": [
        {
          "Location": "continent:NA",
          "EndpointReference": "us-east-1",
          "HealthCheck": "hc-us-east-1"
        },
        {
          "Location": "continent:EU",
          "EndpointReference": "eu-west-1",
          "HealthCheck": "hc-eu-west-1"
        }
      ]
    }
  }
}
```

**Apply to Multiple Domains**:
```python
# Create traffic policy
policy = route53.create_traffic_policy(
    Name='GlobalAppPolicy',
    Document=json.dumps(policy_document)
)

# Apply to multiple domains
domains = [
    'api.example.com',
    'api.example.net',
    'api.example.org'
]

for domain in domains:
    route53.create_traffic_policy_instance(
        HostedZoneId='Z1234567890ABC',
        Name=domain,
        TTL=60,
        TrafficPolicyId=policy['TrafficPolicy']['Id'],
        TrafficPolicyVersion=1
    )

# Update policy → automatically updates all instances
```

---

## Domain Registration

### Register Domain via Route 53

```python
route53domains = boto3.client('route53domains', region_name='us-east-1')  # Must use us-east-1

# Check availability
response = route53domains.check_domain_availability(
    DomainName='myawesomeapp.com'
)

if response['Availability'] == 'AVAILABLE':
    # Register domain
    route53domains.register_domain(
        DomainName='myawesomeapp.com',
        DurationInYears=1,
        AutoRenew=True,
        AdminContact={
            'FirstName': 'John',
            'LastName': 'Doe',
            'ContactType': 'PERSON',
            'AddressLine1': '123 Main St',
            'City': 'Seattle',
            'State': 'WA',
            'CountryCode': 'US',
            'ZipCode': '98101',
            'PhoneNumber': '+1.2065551234',
            'Email': 'admin@example.com'
        },
        RegistrantContact={...},  # Same structure
        TechContact={...},        # Same structure
        PrivacyProtectAdminContact=True,
        PrivacyProtectRegistrantContact=True,
        PrivacyProtectTechContact=True
    )

# Cost: $12-50/year depending on TLD
```

### Transfer Domain to Route 53

```python
# 1. Unlock domain at current registrar
# 2. Get authorization code (EPP code)
# 3. Initiate transfer

route53domains.transfer_domain(
    DomainName='example.com',
    DurationInYears=1,
    AuthCode='EPP-CODE-FROM-REGISTRAR',
    AutoRenew=True,
    # ... contact info ...
)

# Transfer process: 5-7 days
# Cost: $12-50 (includes 1-year renewal)
```

---

## DNSSEC

### DNS Security Extensions

**Problem**: DNS cache poisoning/spoofing
```
Attacker intercepts DNS query and returns fake IP:
User queries www.bank.com
Attacker responds: 198.51.100.1 (attacker's server)
User connects to fake banking site
```

**DNSSEC Solution**: Cryptographic signing of DNS records
```
1. Zone owner creates key pair
2. DNS records signed with private key
3. Recursive resolver verifies signature with public key
4. If signature invalid → reject response

Result: Prevents DNS spoofing
```

### Enable DNSSEC

```python
# 1. Enable DNSSEC signing
route53.enable_hosted_zone_dnssec(
    HostedZoneId='Z1234567890ABC'
)

# 2. Route 53 creates KSK (Key Signing Key) in AWS KMS

# 3. Get DS record for domain registrar
response = route53.get_dnssec(HostedZoneId='Z1234567890ABC')
ds_record = response['KeySigningKeys'][0]['DSRecord']

print(f"DS Record: {ds_record}")
# Example: 12345 13 2 ABC123DEF456...

# 4. Add DS record to domain registrar
# (GoDaddy, Namecheap, etc. have "DS Record" or "DNSSEC" section)

# 5. Verify DNSSEC
# dig example.com +dnssec
# Should see RRSIG records
```

**Monitoring**:
```python
# CloudWatch alarm for DNSSEC errors
cloudwatch.put_metric_alarm(
    AlarmName='DNSSECValidationFailure',
    MetricName='DNSSECKeySigningKeysNeedingAction',
    Namespace='AWS/Route53',
    Statistic='Average',
    Period=300,
    EvaluationPeriods=1,
    Threshold=1.0,
    ComparisonOperator='GreaterThanOrEqualToThreshold',
    AlarmActions=['arn:aws:sns:us-east-1:123456789012:alerts']
)
```

---

## LocalStack Examples

### Setup

**Docker Compose**:
```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=route53
      - DEBUG=1
    volumes:
      - "./localstack-data:/tmp/localstack"
```

### Complete Example: Multi-Region Application

```python
import boto3
import time

route53 = boto3.client('route53', endpoint_url='http://localhost:4566')

# 1. Create hosted zone
zone = route53.create_hosted_zone(
    Name='example.com',
    CallerReference=f'zone-{int(time.time())}'
)

zone_id = zone['HostedZone']['Id']
print(f"Created hosted zone: {zone_id}")

# 2. Create health checks
hc_us = route53.create_health_check(
    CallerReference=f'hc-us-{int(time.time())}',
    HealthCheckConfig={
        'Type': 'HTTP',
        'ResourcePath': '/health',
        'FullyQualifiedDomainName': 'api-us.example.com',
        'Port': 80,
        'RequestInterval': 30,
        'FailureThreshold': 3
    }
)

hc_eu = route53.create_health_check(
    CallerReference=f'hc-eu-{int(time.time())}',
    HealthCheckConfig={
        'Type': 'HTTP',
        'ResourcePath': '/health',
        'FullyQualifiedDomainName': 'api-eu.example.com',
        'Port': 80,
        'RequestInterval': 30,
        'FailureThreshold': 3
    }
)

# 3. Create latency-based records
changes = [
    # us-east-1
    {
        'Action': 'CREATE',
        'ResourceRecordSet': {
            'Name': 'api.example.com',
            'Type': 'A',
            'SetIdentifier': 'US-East-1',
            'Region': 'us-east-1',
            'HealthCheckId': hc_us['HealthCheck']['Id'],
            'TTL': 60,
            'ResourceRecords': [{'Value': '198.51.100.1'}]
        }
    },
    # eu-west-1
    {
        'Action': 'CREATE',
        'ResourceRecordSet': {
            'Name': 'api.example.com',
            'Type': 'A',
            'SetIdentifier': 'EU-West-1',
            'Region': 'eu-west-1',
            'HealthCheckId': hc_eu['HealthCheck']['Id'],
            'TTL': 60,
            'ResourceRecords': [{'Value': '203.0.113.1'}]
        }
    },
    # ap-southeast-1
    {
        'Action': 'CREATE',
        'ResourceRecordSet': {
            'Name': 'api.example.com',
            'Type': 'A',
            'SetIdentifier': 'AP-Southeast-1',
            'Region': 'ap-southeast-1',
            'TTL': 60,
            'ResourceRecords': [{'Value': '192.0.2.1'}]
        }
    }
]

route53.change_resource_record_sets(
    HostedZoneId=zone_id,
    ChangeBatch={'Changes': changes}
)

print("✅ Created latency-based routing")

# 4. Query DNS
import subprocess

result = subprocess.run(
    ['dig', '@localhost', 'api.example.com', 'A', '+short'],
    capture_output=True,
    text=True
)

print(f"DNS query result: {result.stdout}")
```

---

## Production Patterns

### Pattern 1: Blue-Green Deployment

```python
# Initial state: 100% blue
create_weighted_records('Z1234567890ABC', 'www.example.com', [
    {'ip': 'blue-alb.elb.amazonaws.com', 'weight': 100, 'id': 'Blue'},
    {'ip': 'green-alb.elb.amazonaws.com', 'weight': 0, 'id': 'Green'}
])

# Shift 10% traffic to green
create_weighted_records('Z1234567890ABC', 'www.example.com', [
    {'ip': 'blue-alb.elb.amazonaws.com', 'weight': 90, 'id': 'Blue'},
    {'ip': 'green-alb.elb.amazonaws.com', 'weight': 10, 'id': 'Green'}
])

# Monitor errors, latency
time.sleep(3600)

# Shift 50%
create_weighted_records('Z1234567890ABC', 'www.example.com', [
    {'ip': 'blue-alb.elb.amazonaws.com', 'weight': 50, 'id': 'Blue'},
    {'ip': 'green-alb.elb.amazonaws.com', 'weight': 50, 'id': 'Green'}
])

# Full cutover
create_weighted_records('Z1234567890ABC', 'www.example.com', [
    {'ip': 'blue-alb.elb.amazonaws.com', 'weight': 0, 'id': 'Blue'},
    {'ip': 'green-alb.elb.amazonaws.com', 'weight': 100, 'id': 'Green'}
])

# Rollback if issues
create_weighted_records('Z1234567890ABC', 'www.example.com', [
    {'ip': 'blue-alb.elb.amazonaws.com', 'weight': 100, 'id': 'Blue'},
    {'ip': 'green-alb.elb.amazonaws.com', 'weight': 0, 'id': 'Green'}
])
```

### Pattern 2: Active-Active Multi-Region

```python
# Equal traffic distribution with failover

regions = [
    {'name': 'us-east-1', 'ip': '198.51.100.1'},
    {'name': 'us-west-2', 'ip': '198.51.100.2'},
    {'name': 'eu-west-1', 'ip': '203.0.113.1'}
]

for region in regions:
    # Create health check
    hc = route53.create_health_check(
        CallerReference=f"hc-{region['name']}-{int(time.time())}",
        HealthCheckConfig={
            'Type': 'HTTPS',
            'ResourcePath': '/health',
            'FullyQualifiedDomainName': f"api-{region['name']}.example.com",
            'Port': 443,
            'RequestInterval': 10,
            'FailureThreshold': 2
        }
    )
    
    # Latency-based record with health check
    route53.change_resource_record_sets(
        HostedZoneId='Z1234567890ABC',
        ChangeBatch={
            'Changes': [{
                'Action': 'UPSERT',
                'ResourceRecordSet': {
                    'Name': 'api.example.com',
                    'Type': 'A',
                    'SetIdentifier': region['name'],
                    'Region': region['name'],
                    'HealthCheckId': hc['HealthCheck']['Id'],
                    'TTL': 60,
                    'ResourceRecords': [{'Value': region['ip']}]
                }
            }]
        }
    )

# Behavior:
# - User routed to lowest latency healthy region
# - If region fails → traffic redistributed to remaining regions
# - Region recovers → traffic returns
```

---

## Interview Questions

### Q1: Explain DNS resolution process

```
1. User types www.example.com in browser

2. Browser cache check (recent lookups)
   - Found: Use cached IP (instant)
   - Not found: Proceed to step 3

3. OS cache check
   - Windows: ipconfig /displaydns
   - Linux: /etc/hosts
   - Not found: Query recursive resolver

4. Recursive DNS resolver (ISP or 8.8.8.8)
   - Cache check
   - Not found: Query root nameserver

5. Root nameserver
   - Returns: "For .com, ask TLD server at 192.0.2.1"

6. TLD nameserver (.com)
   - Returns: "For example.com, ask NS at 203.0.113.1"

7. Authoritative nameserver (example.com)
   - Returns: "www.example.com → 198.51.100.1, TTL=300"

8. Recursive resolver
   - Caches result for 300 seconds
   - Returns IP to user

9. Browser
   - Caches result
   - Initiates TCP connection to 198.51.100.1

First query: 100-300 ms
Subsequent queries: <1 ms (cached)
```

### Q2: Route 53 vs CloudFlare DNS?

```
Route 53:
✅ Deep AWS integration (Alias records)
✅ 100% uptime SLA
✅ Traffic policies (complex routing)
✅ Health checks ($0.50/check)
❌ More expensive ($0.50/zone + $0.40/M queries)

CloudFlare:
✅ Free tier (unlimited queries)
✅ Faster global propagation
✅ Built-in DDoS protection
✅ Integrated with CDN
❌ No SLA on free tier
❌ Limited AWS integration

Use Route 53 when:
- Already on AWS
- Need Alias records (free queries to ELB, CloudFront)
- Require SLA
- Complex routing policies

Use CloudFlare when:
- Cost-sensitive
- Need DDoS protection
- Multi-cloud setup
```

### Q3: Design global application with automatic failover

```
Architecture:

1. Multi-Region Setup:
   - us-east-1 (Primary)
   - us-west-2 (Secondary)
   - eu-west-1 (Tertiary)

2. Route 53 Configuration:

# Latency-based routing with health checks
regions = [
    {
        'name': 'us-east-1',
        'alb': 'alb-us-east-1.elb.amazonaws.com',
        'health_endpoint': 'https://api-us-east-1.example.com/health'
    },
    {
        'name': 'us-west-2',
        'alb': 'alb-us-west-2.elb.amazonaws.com',
        'health_endpoint': 'https://api-us-west-2.example.com/health'
    },
    {
        'name': 'eu-west-1',
        'alb': 'alb-eu-west-1.elb.amazonaws.com',
        'health_endpoint': 'https://api-eu-west-1.example.com/health'
    }
]

for region in regions:
    # Health check (30 sec interval, 2 failures = unhealthy)
    hc = create_health_check(region['health_endpoint'], interval=30, threshold=2)
    
    # Latency-based A record
    create_record(
        name='api.example.com',
        type='A',
        routing='latency',
        region=region['name'],
        alias_target=region['alb'],
        health_check=hc,
        ttl=60
    )

3. Behavior:
   - Normal: User → Lowest latency region
   - us-east-1 fails: Traffic → us-west-2 (for US users)
   - us-west-2 also fails: Traffic → eu-west-1
   - Regions recover: Traffic returns to optimal routing

4. RTO (Recovery Time Objective):
   - Health check interval: 30 sec
   - Failure threshold: 2 checks = 60 sec
   - DNS TTL: 60 sec
   - Total: 2 minutes maximum

5. Cost:
   - Hosted zone: $0.50/month
   - 3 health checks: $1.50/month
   - Queries: $0.40 per million
   - Total: ~$2/month + query costs
```

### Q4: How to minimize DNS propagation time?

```
Challenge: Update DNS record, want users to see change quickly

Factors:
1. TTL (Time To Live)
2. Resolver cache behavior
3. Propagation across nameservers

Strategy:

Step 1: Lower TTL (1 day before change)
# Current: TTL=86400 (24 hours)
# Change to: TTL=60 (1 minute)
# Wait 24 hours for old TTL to expire

Step 2: Make DNS change
# Update A record: old-ip → new-ip
# TTL still 60 seconds

Step 3: Monitor (1-2 hours)
# Most users see new IP within 2-3 minutes
# Some resolvers may cache longer (ignore TTL)

Step 4: Restore TTL
# Change TTL back to 3600 (1 hour)
# Reduces query load on nameservers

Minimum propagation: 60 seconds (with TTL=60)
Realistic: 5-15 minutes (90% of users)
Maximum: 24-48 hours (outdated resolvers)

Best practice: Plan for 15-30 min propagation
```

### Q5: Explain Alias records vs CNAME

```
CNAME:
example.com CNAME → other.com
- Requires additional DNS lookup
- Cannot use for apex domain (example.com)
- Cost: $0.40 per million queries
- Works with any domain

Alias:
example.com A ALIAS → alb.elb.amazonaws.com
- No additional lookup (resolved by Route 53)
- CAN use for apex domain ✅
- Cost: Free for AWS resources
- Only for AWS resources

Example:

# CNAME (subdomain only)
www.example.com CNAME → d111111abcdef8.cloudfront.net
- 2 queries: www.example.com → d111111abcdef8.cloudfront.net → IP
- Cost: 2 × $0.40 per million = $0.80 per million

# Alias (apex or subdomain)
example.com A ALIAS → d111111abcdef8.cloudfront.net
- 1 query: example.com → IP (Route 53 resolves CloudFront IP)
- Cost: Free

Recommendation: Use Alias for AWS resources, CNAME for external
```

### Q6: Cost optimization for Route 53

```
Scenario: 100M queries/month to www.example.com → CloudFront

Option 1: CNAME
www.example.com CNAME → d111111abcdef8.cloudfront.net

Cost:
- Hosted zone: $0.50
- Queries: 100M × $0.40/M = $40
Total: $40.50/month

Option 2: Alias
www.example.com A ALIAS → d111111abcdef8.cloudfront.net

Cost:
- Hosted zone: $0.50
- Queries: Free (Alias to AWS resource)
Total: $0.50/month

Savings: $40/month (98.75% reduction)

Other optimizations:
1. Use Alias instead of CNAME (when possible)
2. Increase TTL (reduce query volume)
3. Consolidate hosted zones
4. Use geolocation routing (cheaper than latency-based in some cases)
5. Disable health checks for non-critical endpoints
```

This comprehensive guide covers Route 53 and DNS concepts critical for FAANG interviews, including routing policies, health checks, failover strategies, and cost optimization.

