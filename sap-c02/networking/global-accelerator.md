# AWS Global Accelerator

## Table of Contents
1. [Global Accelerator Fundamentals](#global-accelerator-fundamentals)
2. [Static Anycast IP Addresses](#static-anycast-ip-addresses)
3. [Endpoint Groups & Endpoints](#endpoint-groups--endpoints)
4. [Traffic Dials & Weights](#traffic-dials--weights)
5. [Health Checks](#health-checks)
6. [Global Accelerator vs CloudFront](#global-accelerator-vs-cloudfront)
7. [Use Cases](#use-cases)
8. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
9. [Best Practices](#best-practices)
10. [Interview Questions](#interview-questions)

---

## Global Accelerator Fundamentals

### What is AWS Global Accelerator?

**AWS Global Accelerator** is a networking service that improves application availability and performance using the AWS global network.

**Core Capabilities**:
```
Static Anycast IPs
├── 2 static IPv4 addresses (globally unique)
├── Associated with your accelerator (never change)
├── Anycast routing (users route to nearest edge location)
└── DDoS protection (AWS Shield Standard included)

AWS Global Network
├── 400+ edge locations worldwide
├── AWS backbone (fiber, no internet)
├── Optimized routing (shortest path to region)
└── Consistent performance (60% latency improvement)

Endpoint Types
├── Application Load Balancer (ALB)
├── Network Load Balancer (NLB)
├── Elastic IP (EC2 instances)
└── EC2 instances (direct)

Traffic Management
├── Traffic dials (control traffic percentage)
├── Endpoint weights (distribution ratio)
├── Health checks (automatic failover)
└── Client affinity (session stickiness)

Benefits:
✅ Static IPs (no DNS propagation delays)
✅ Low latency (AWS network, not internet)
✅ High availability (automatic failover)
✅ DDoS protection (Shield Standard)
✅ Global reach (single IP set for worldwide users)
```

### How Global Accelerator Works

```
User Request Flow:
1. User accesses: 75.2.60.5 (static anycast IP)
2. DNS resolution: No DNS lookup needed (IP is static)
3. Anycast routing: Routes to nearest AWS edge location
4. Edge location: Receives request (e.g., London edge)
5. AWS backbone: Traffic to region (e.g., us-east-1) via private network
6. Endpoint: ALB in us-east-1 processes request
7. Response: Back to user via same edge location

vs Traditional Approach:
1. User accesses: myapp.example.com
2. DNS resolution: 50-100ms (lookup + TTL)
3. Internet routing: Via ISPs, peering points (variable latency)
4. Multiple hops: 10-20 internet hops (each adds latency)
5. Endpoint: ALB in us-east-1
6. Total latency: 200ms (high, unpredictable)

Global Accelerator:
- Latency: 80ms (60% improvement)
- Hops: 3-5 (only to edge, then AWS network)
- Consistency: Low variance (AWS backbone)
```

### Architecture

```
Global Users
  ├─→ User in Tokyo (accesses 75.2.60.5)
  │     ↓ Routes to Tokyo edge location (anycast)
  │     ↓ AWS backbone to us-west-2
  │     ↓ 50ms latency (vs 200ms via internet)
  │
  ├─→ User in London (accesses 75.2.60.5)
  │     ↓ Routes to London edge location (anycast)
  │     ↓ AWS backbone to eu-west-1
  │     ↓ 30ms latency (vs 150ms via internet)
  │
  └─→ User in New York (accesses 75.2.60.5)
        ↓ Routes to New York edge location (anycast)
        ↓ AWS backbone to us-east-1
        ↓ 10ms latency (vs 40ms via internet)

AWS Global Accelerator
  ├─→ Endpoint Group 1 (us-east-1, 100% traffic)
  │     ├─→ ALB-1 (weight 70%)
  │     └─→ ALB-2 (weight 30%)
  │
  ├─→ Endpoint Group 2 (us-west-2, 0% traffic - standby)
  │     └─→ ALB-3 (weight 100%)
  │
  └─→ Endpoint Group 3 (eu-west-1, 0% traffic - standby)
        └─→ ALB-4 (weight 100%)

Failover:
- us-east-1 fails → Traffic dials automatically to us-west-2
- ALB-1 unhealthy → Traffic shifts to ALB-2
- Automatic, no DNS changes needed
```

### Pricing

```
Fixed Hourly Fee:
├── $0.025/hour per accelerator
└── $18/month per accelerator (730 hours)

Data Transfer Premium:
├── DT-Premium: $0.015/GB (in addition to standard AWS transfer)
├── Standard AWS transfer: $0.09/GB to internet
└── Total: $0.105/GB ($0.09 + $0.015)

Example Cost:
1 accelerator, 10 TB/month transfer:
- Accelerator: $18/month
- Standard transfer: 10,000 GB × $0.09 = $900
- DT-Premium: 10,000 GB × $0.015 = $150
- Total: $1,068/month

vs CloudFront (10 TB/month):
- CloudFront: $850/month
- Global Accelerator: $1,068/month

Difference: Global Accelerator costs ~$200 more BUT:
✅ Static IPs (vs dynamic CloudFront IPs)
✅ TCP/UDP support (vs HTTP/HTTPS only)
✅ Non-HTTP protocols (gaming, IoT, VoIP)

Use Global Accelerator when benefits outweigh $200/month premium
```

---

## Static Anycast IP Addresses

### What is Anycast?

**Anycast** routing advertises the same IP address from multiple locations worldwide.

```
Traditional Unicast:
- 1 IP = 1 server location
- User in Tokyo → Server in Virginia (200ms)
- User in London → Server in Virginia (100ms)
- All users go to same location (long distance)

Anycast (Global Accelerator):
- 1 IP = 100+ edge locations
- User in Tokyo → Tokyo edge (5ms to edge)
- User in London → London edge (5ms to edge)
- Each user routes to nearest location (short distance)

Example:
IP: 75.2.60.5 (anycast)
- Advertised from Tokyo edge location
- Advertised from London edge location
- Advertised from New York edge location
- ... 400+ edge locations

User request:
- Tokyo user → 75.2.60.5 → Tokyo edge (nearest)
- London user → 75.2.60.5 → London edge (nearest)
- Automatic (BGP routing, lowest AS path)
```

### Static IP Benefits

```
Problem with DNS (traditional):
❌ DNS propagation delay (TTL 60 seconds - 24 hours)
❌ IP changes require DNS update
❌ Client caching (old IPs stick around)
❌ Failover slow (wait for TTL to expire)

Example DNS issue:
1. ALB public IP changes (AWS scaling)
2. Update DNS: myapp.example.com → new IP
3. TTL: 300 seconds (5 minutes)
4. Some clients cache old IP for hours
5. Broken connections until DNS refreshes

Global Accelerator solution:
✅ Static IPs never change (75.2.60.5, 99.83.185.42)
✅ No DNS propagation (IP is constant)
✅ No client caching issues (IP doesn't change)
✅ Instant failover (AWS reroutes internally)

Use cases:
- Whitelisting (firewall rules require static IPs)
- IoT devices (can't update DNS frequently)
- Gaming (static IPs in configuration files)
- Mobile apps (hardcoded IPs, no DNS lookup)
```

### Create Accelerator

```bash
# Create accelerator
aws globalaccelerator create-accelerator \
  --name "MyApp-Accelerator" \
  --ip-address-type IPV4 \
  --enabled

# Output:
{
  "Accelerator": {
    "AcceleratorArn": "arn:aws:globalaccelerator::123456789012:accelerator/abc123",
    "Name": "MyApp-Accelerator",
    "IpAddressType": "IPV4",
    "Enabled": true,
    "IpSets": [{
      "IpFamily": "IPv4",
      "IpAddresses": [
        "75.2.60.5",      # Static anycast IP 1
        "99.83.185.42"    # Static anycast IP 2
      ]
    }],
    "DnsName": "abc123.awsglobalaccelerator.com",
    "Status": "DEPLOYED",
    "CreatedTime": "2026-01-31T10:00:00Z"
  }
}

# IPs: 75.2.60.5 and 99.83.185.42
# These IPs NEVER change (static for life of accelerator)
# Users can access via either IP (both route to same endpoints)
```

### Bring Your Own IP (BYOIP)

```bash
# Bring your own IP range (requires ROA/authorization)
aws globalaccelerator advertise-byoip-cidr \
  --cidr 203.0.113.0/24

# Create accelerator with your IPs
aws globalaccelerator create-accelerator \
  --name "BYOIP-Accelerator" \
  --ip-addresses 203.0.113.1 203.0.113.2

# Benefits:
✅ Use existing IPs (no need to update clients)
✅ Brand consistency (your IP range)
✅ IP reputation preserved (existing allow-lists)

Requirements:
- Must own /24 or larger IP block
- ROA (Route Origin Authorization) from RIR
- Proof of ownership
- AWS verification process (days to weeks)
```

---

## Endpoint Groups & Endpoints

### Endpoint Groups

**Endpoint Group** = Collection of endpoints in a single AWS region.

```
Structure:
Accelerator
  ├─→ Listener (port 80, protocol TCP)
  │     └─→ Endpoint Groups (regions)
  │           ├─→ Endpoint Group 1 (us-east-1)
  │           │     ├─→ ALB-1
  │           │     └─→ ALB-2
  │           ├─→ Endpoint Group 2 (eu-west-1)
  │           │     └─→ NLB-1
  │           └─→ Endpoint Group 3 (ap-northeast-1)
  │                 └─→ EC2 instance (Elastic IP)
  │
  └─→ Listener (port 443, protocol TCP)
        └─→ (same endpoint groups)

Key Points:
- 1 listener can have multiple endpoint groups
- 1 endpoint group = 1 region
- Up to 10 endpoints per group
- Traffic dial controls traffic percentage to group
```

### Create Listener & Endpoint Group

```bash
# Step 1: Create listener (port 80, TCP)
aws globalaccelerator create-listener \
  --accelerator-arn arn:aws:globalaccelerator::123:accelerator/abc123 \
  --port-ranges FromPort=80,ToPort=80 \
  --protocol TCP \
  --client-affinity SOURCE_IP

# Output:
{
  "Listener": {
    "ListenerArn": "arn:aws:globalaccelerator::123:accelerator/abc123/listener/xyz789",
    "PortRanges": [{"FromPort": 80, "ToPort": 80}],
    "Protocol": "TCP",
    "ClientAffinity": "SOURCE_IP"  # Session stickiness
  }
}

# Step 2: Create endpoint group (us-east-1)
aws globalaccelerator create-endpoint-group \
  --listener-arn arn:aws:globalaccelerator::123:accelerator/abc123/listener/xyz789 \
  --endpoint-group-region us-east-1 \
  --traffic-dial-percentage 100 \
  --health-check-interval-seconds 30 \
  --health-check-path "/health" \
  --threshold-count 3 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/myapp-alb/abc123",
      "Weight": 128,
      "ClientIPPreservationEnabled": true
    },
    {
      "EndpointId": "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/myapp-alb-2/def456",
      "Weight": 128,
      "ClientIPPreservationEnabled": true
    }
  ]'

# Output:
{
  "EndpointGroup": {
    "EndpointGroupArn": "arn:aws:globalaccelerator::123:.../endpointgroup/group1",
    "EndpointGroupRegion": "us-east-1",
    "TrafficDialPercentage": 100.0,  # 100% of traffic to this region
    "HealthCheckIntervalSeconds": 30,
    "HealthCheckPath": "/health",
    "ThresholdCount": 3,  # 3 failed health checks = unhealthy
    "EndpointDescriptions": [
      {
        "EndpointId": "arn:aws:...app/myapp-alb/abc123",
        "Weight": 128,
        "HealthState": "HEALTHY",
        "ClientIPPreservationEnabled": true
      },
      {
        "EndpointId": "arn:aws:...app/myapp-alb-2/def456",
        "Weight": 128,
        "HealthState": "HEALTHY"
      }
    ]
  }
}

# Step 3: Create failover endpoint group (us-west-2, 0% initially)
aws globalaccelerator create-endpoint-group \
  --listener-arn arn:aws:globalaccelerator::123:accelerator/abc123/listener/xyz789 \
  --endpoint-group-region us-west-2 \
  --traffic-dial-percentage 0 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:elasticloadbalancing:us-west-2:123:loadbalancer/app/myapp-alb-west/ghi789",
      "Weight": 128
    }
  ]'

# us-west-2 on standby (0% traffic)
# If us-east-1 fails → Increase us-west-2 to 100%
```

### Supported Endpoint Types

```
Application Load Balancer (ALB):
✅ HTTP/HTTPS traffic
✅ Path-based routing
✅ Host-based routing
✅ Client IP preservation
Example: Web applications, APIs

Network Load Balancer (NLB):
✅ TCP/UDP/TLS traffic
✅ Ultra-low latency
✅ Static IP per AZ
✅ Preserve source IP
Example: Gaming servers, IoT, streaming

Elastic IP (EC2):
✅ Direct to EC2 instance
✅ Static IP for instance
✅ Single instance (no load balancing)
Example: License servers, specialized apps

EC2 Instance (without Elastic IP):
✅ Direct to instance private IP
✅ Global Accelerator assigns public IP
Example: Simple deployments

Limitations:
- Max 10 endpoints per endpoint group
- Endpoints must be in same region as group
- Cannot mix internet-facing and internal ALB/NLB
```

---

## Traffic Dials & Weights

### Traffic Dials

**Traffic Dial** controls percentage of traffic sent to an endpoint group.

```
Use Case: Blue/Green Deployment

Initial State:
- Endpoint Group 1 (Blue, us-east-1): 100% traffic
- Endpoint Group 2 (Green, us-west-2): 0% traffic

Gradual Shift:
1. Deploy new version to us-west-2 (Green)
2. Set us-west-2 traffic dial to 10%
   - Blue: 90% traffic
   - Green: 10% traffic (canary)
3. Monitor metrics (errors, latency)
4. If OK, increase to 50%
   - Blue: 50% traffic
   - Green: 50% traffic
5. If OK, increase to 100%
   - Blue: 0% traffic (standby)
   - Green: 100% traffic (active)
6. If issues, rollback (set Green to 0%)

Benefits:
✅ Gradual rollout (minimize risk)
✅ Quick rollback (just change percentage)
✅ No DNS changes (instant)
```

**Update Traffic Dial**:
```bash
# Shift 50% traffic to us-west-2
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:globalaccelerator::123:.../endpointgroup/group2 \
  --traffic-dial-percentage 50

# Result:
# us-east-1: 100% dial × (100/(100+50)) = 66.7% of total traffic
# us-west-2: 50% dial × (50/(100+50)) = 33.3% of total traffic

# Actual calculation:
# If both groups have 100% dial → 50/50 split
# If us-east-1 has 100%, us-west-2 has 50% → 66.7/33.3 split
# If us-east-1 has 100%, us-west-2 has 0% → 100/0 split
```

### Endpoint Weights

**Weight** controls distribution within an endpoint group.

```
Scenario: Endpoint Group (us-east-1) with 2 ALBs

ALB-1: Weight 200
ALB-2: Weight 100

Traffic distribution:
- ALB-1: 200/(200+100) = 66.7%
- ALB-2: 100/(200+100) = 33.3%

Use cases:
1. Canary deployment within region
   - ALB-1 (old version): Weight 180
   - ALB-2 (new version): Weight 20
   - Result: 90% old, 10% new

2. Capacity-based routing
   - ALB-1 (10 instances): Weight 200
   - ALB-2 (5 instances): Weight 100
   - Result: More traffic to larger ALB

3. Gradual draining
   - Decommission ALB-1
   - Reduce weight: 200 → 100 → 50 → 0
   - Traffic shifts to ALB-2 gradually
```

**Update Endpoint Weight**:
```bash
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:globalaccelerator::123:.../endpointgroup/group1 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/myapp-alb/abc123",
      "Weight": 180  # Reduced from 200 (old version)
    },
    {
      "EndpointId": "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/myapp-alb-2/def456",
      "Weight": 20   # New version (canary)
    }
  ]'

# Traffic distribution in us-east-1:
# ALB-1: 180/200 = 90%
# ALB-2: 20/200 = 10%
```

### Combined: Traffic Dials + Weights

```
Multi-Region Blue/Green with Canary:

Setup:
- us-east-1 (Blue): Traffic dial 100%
  ├─→ ALB-1 (old): Weight 200
  └─→ ALB-2 (new canary): Weight 20
- us-west-2 (Green): Traffic dial 0%
  └─→ ALB-3: Weight 128

Traffic calculation:
1. Region-level (traffic dials):
   - us-east-1: 100% / (100% + 0%) = 100% of total traffic
   - us-west-2: 0% / (100% + 0%) = 0% of total traffic

2. Endpoint-level (weights in us-east-1):
   - ALB-1: 200 / (200 + 20) = 90.9% of us-east-1 traffic
   - ALB-2: 20 / (200 + 20) = 9.1% of us-east-1 traffic

3. Total traffic:
   - ALB-1 (old): 100% × 90.9% = 90.9% (primary)
   - ALB-2 (new): 100% × 9.1% = 9.1% (canary)
   - ALB-3: 0% (standby for DR)

Deployment strategy:
Phase 1: Test canary in us-east-1
- ALB-2 weight: 20 (9.1% traffic)
- Monitor for 1 hour

Phase 2: Expand canary
- ALB-2 weight: 100 (33% traffic)
- Monitor for 1 hour

Phase 3: Full rollout in us-east-1
- ALB-1 weight: 0 (drained)
- ALB-2 weight: 200 (100% of us-east-1)

Phase 4: Deploy to us-west-2 (DR region)
- Update ALB-3 to new version
- Keep traffic dial at 0% (standby)

Result: Safe, gradual deployment with instant rollback capability
```

---

## Health Checks

### Health Check Configuration

```
Health Check Parameters:
├── Interval: 10 or 30 seconds
├── Path: HTTP path (e.g., /health)
├── Port: Custom port or use traffic port
├── Protocol: TCP or HTTP/HTTPS
├── Threshold: Consecutive failures before unhealthy (3 default)
└── Timeout: Time to wait for response

States:
- HEALTHY: Passing health checks
- UNHEALTHY: Failing health checks
- INITIAL: First health check pending
```

**Configure Health Checks**:
```bash
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:globalaccelerator::123:.../endpointgroup/group1 \
  --health-check-protocol HTTP \
  --health-check-port 80 \
  --health-check-path "/health" \
  --health-check-interval-seconds 30 \
  --threshold-count 3

# Health check behavior:
# Every 30 seconds: HTTP GET http://endpoint/health
# 3 consecutive failures → Mark UNHEALTHY
# 3 consecutive successes → Mark HEALTHY

# Example /health endpoint (application):
@app.route('/health')
def health_check():
    # Check database connection
    if database.is_connected():
        return 'OK', 200
    else:
        return 'Database unreachable', 503

# Global Accelerator:
# - 200 response → HEALTHY
# - 503 response → UNHEALTHY (after 3 consecutive)
```

### Automatic Failover

```
Scenario: Primary region failure

Setup:
- us-east-1: Traffic dial 100%, ALB-1 (healthy)
- us-west-2: Traffic dial 0%, ALB-2 (healthy, standby)

Failure:
T+0s: us-east-1 ALB-1 fails (500 errors)
T+30s: First failed health check
T+60s: Second failed health check
T+90s: Third failed health check → ALB-1 marked UNHEALTHY
T+90s: Global Accelerator detects all endpoints in us-east-1 unhealthy
T+90s: Automatically routes traffic to us-west-2 (even though dial is 0%)
T+90s: Users now reach us-west-2 ALB-2

Automatic Failover Rules:
1. If all endpoints in a group are unhealthy
2. Global Accelerator routes to next available healthy group
3. Ignores traffic dial settings (override for failover)
4. Returns to primary when healthy

Recovery:
T+600s: us-east-1 ALB-1 fixed
T+630s: First successful health check
T+660s: Second successful health check
T+690s: Third successful health check → ALB-1 marked HEALTHY
T+690s: Traffic returns to us-east-1 (traffic dial 100%)
```

**Monitor Health**:
```bash
# Get endpoint health status
aws globalaccelerator describe-endpoint-group \
  --endpoint-group-arn arn:aws:globalaccelerator::123:.../endpointgroup/group1

# Output:
{
  "EndpointGroup": {
    "EndpointDescriptions": [
      {
        "EndpointId": "arn:aws:...app/myapp-alb/abc123",
        "HealthState": "HEALTHY",
        "HealthCheckEnabled": true
      }
    ]
  }
}

# CloudWatch Metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/GlobalAccelerator \
  --metric-name ProcessedBytesIn \
  --dimensions Name=Accelerator,Value=abc123 \
  --start-time 2026-01-31T00:00:00Z \
  --end-time 2026-01-31T23:59:59Z \
  --period 300 \
  --statistics Sum
```

### Client IP Preservation

```
Problem: Load balancer sees Global Accelerator IP (not client IP)
Solution: Client IP Preservation

Without preservation:
Client (1.2.3.4)
  ↓
Global Accelerator Edge
  ↓ Source IP: Global Accelerator IP (not client)
  ↓
ALB sees: 54.239.x.x (Global Accelerator)
Application logs: 54.239.x.x (loses client IP)

With preservation (ALB/NLB only):
Client (1.2.3.4)
  ↓
Global Accelerator Edge
  ↓ Source IP: 1.2.3.4 (preserved)
  ↓
ALB sees: 1.2.3.4 (original client)
Application logs: 1.2.3.4 (correct)

Enable:
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:globalaccelerator::123:.../endpointgroup/group1 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:...app/myapp-alb/abc123",
      "ClientIPPreservationEnabled": true
    }
  ]'

Requirements:
✅ Application Load Balancer: Supported
✅ Network Load Balancer: Supported
❌ EC2 instances: NOT supported
❌ Elastic IP: NOT supported

Alternative (EC2/EIP): Use X-Forwarded-For header or Proxy Protocol
```

---

## Global Accelerator vs CloudFront

### Feature Comparison

```
Feature              Global Accelerator       CloudFront
------------------------------------------------------------------------
OSI Layer            Layer 4 (TCP/UDP)        Layer 7 (HTTP/HTTPS)
Protocol             TCP, UDP                 HTTP, HTTPS, WebSocket
Caching              No                       Yes (edge caching)
Static IPs           Yes (2 anycast IPs)      No (dynamic IPs)
Use case             Non-HTTP apps            Static/dynamic content
Latency              Low (AWS network)        Lowest (edge caching)
DDoS protection      AWS Shield Standard      AWS Shield Standard
SSL/TLS              Passthrough              Termination at edge
WebSocket            Yes                      Yes
RTMP/RTSP            Yes                      No
Custom protocols     Yes                      No
Origin types         ALB, NLB, EC2, EIP       S3, ALB, custom origins
Pricing              $0.025/hour + $0.015/GB  $0.085/GB (HTTP)
Best for             Gaming, IoT, VoIP        Websites, videos, APIs

Global Accelerator:
✅ Gaming (low latency, UDP)
✅ IoT (MQTT, custom protocols)
✅ VoIP (SIP, RTP)
✅ Financial apps (tick data, low latency)
✅ Static IP required (firewall whitelisting)
✅ TCP/UDP (non-HTTP)

CloudFront:
✅ Websites (caching HTML, CSS, JS)
✅ Video streaming (HLS, DASH)
✅ APIs (REST, GraphQL)
✅ Software downloads (cache .exe, .dmg)
✅ Dynamic content with caching
✅ HTTP/HTTPS only
```

### Latency Comparison

```
Scenario: User in Tokyo accessing us-east-1

Direct to ALB (no acceleration):
- DNS lookup: 20ms
- Tokyo → us-east-1 (internet): 180ms
- Total: 200ms

CloudFront:
- Tokyo → Tokyo edge (cached): 5ms
- Cache hit: 5ms total ✅ (best for cacheable content)
- Cache miss: 5ms + 180ms = 185ms

Global Accelerator:
- Tokyo → Tokyo edge: 5ms
- Tokyo edge → us-east-1 (AWS backbone): 120ms
- Total: 125ms ✅ (consistent, not cached)

Comparison:
- Direct: 200ms (worst)
- Global Accelerator: 125ms (37% improvement)
- CloudFront (cache hit): 5ms (98% improvement)
- CloudFront (cache miss): 185ms (8% improvement)

When content is cacheable:
→ CloudFront wins (cache hit)

When content is NOT cacheable (dynamic):
→ Global Accelerator wins (37% improvement over direct)
```

### Decision Matrix

```
Choose Global Accelerator when:
✅ Non-HTTP protocols (TCP, UDP, RTMP, custom)
✅ Static IPs required (firewall rules, IoT devices)
✅ Gaming (low latency, UDP, real-time)
✅ VoIP/Video conferencing (SIP, RTP)
✅ IoT (MQTT, CoAP)
✅ Financial apps (WebSocket, proprietary protocols)
✅ No caching benefit (dynamic, user-specific)

Choose CloudFront when:
✅ Static content (images, videos, downloads)
✅ HTTP/HTTPS only
✅ Caching provides value (reduce origin load)
✅ Global distribution (serve from edge)
✅ DDoS protection + caching
✅ Cost-sensitive (CloudFront cheaper for cached content)

Use Both:
✅ Website (CloudFront) + API WebSocket (Global Accelerator)
✅ Static assets (CloudFront) + Real-time game (Global Accelerator)
✅ Video streaming (CloudFront) + Player authentication (Global Accelerator)

Example:
Gaming application:
- Game assets (textures, models) → CloudFront (cached)
- Game server (UDP, real-time) → Global Accelerator (low latency)
- Authentication API → CloudFront (HTTP)
- Leaderboard WebSocket → Global Accelerator (real-time)
```

---

## Use Cases

### Use Case 1: Multi-Region Gaming

**Requirements**:
```
- Global players (Asia, Europe, Americas)
- Low latency (<50ms)
- UDP protocol (game traffic)
- Static IPs (client configuration)
- Automatic failover (region outage)
```

**Architecture**:
```
Global Accelerator (2 static IPs: 75.2.60.5, 99.83.185.42)
  ├─→ Listener (port 7777, UDP)
  │     ├─→ Endpoint Group (us-east-1, 33% traffic)
  │     │     └─→ NLB → Game servers (10 EC2)
  │     ├─→ Endpoint Group (eu-west-1, 33% traffic)
  │     │     └─→ NLB → Game servers (10 EC2)
  │     └─→ Endpoint Group (ap-southeast-1, 33% traffic)
  │           └─→ NLB → Game servers (10 EC2)
  │
  └─→ Listener (port 443, TCP)
        └─→ API endpoints (player authentication, matchmaking)

Player Experience:
- North America player → Routes to us-east-1 (30ms)
- Europe player → Routes to eu-west-1 (25ms)
- Asia player → Routes to ap-southeast-1 (20ms)

Configuration:
aws globalaccelerator create-listener \
  --accelerator-arn arn:aws:globalaccelerator::123:accelerator/abc123 \
  --port-ranges FromPort=7777,ToPort=7777 \
  --protocol UDP

# Game client config:
# server_ip = "75.2.60.5"
# server_port = 7777
# Static IP never changes (no updates needed)
```

**Benefits**:
```
✅ Low latency (anycast routing to nearest region)
✅ UDP support (game protocol)
✅ Static IPs (hardcoded in game client)
✅ Automatic failover (if region down, route to next)
✅ DDoS protection (AWS Shield Standard)
✅ Session affinity (SOURCE_IP, player stays in region)

Latency improvement:
- Without Global Accelerator: 200ms (internet routing)
- With Global Accelerator: 50ms (AWS backbone)
- 75% improvement
```

### Use Case 2: IoT Device Management

**Requirements**:
```
- 1 million IoT devices worldwide
- MQTT protocol (TCP port 8883)
- Static IPs (devices can't update DNS)
- High availability (99.99%)
- Low bandwidth per device
```

**Architecture**:
```
IoT Devices (1M worldwide)
  ↓ Connect to: 75.2.60.5:8883 (MQTT over TLS)
  ↓
Global Accelerator
  ├─→ Endpoint Group (us-east-1)
  │     └─→ NLB → IoT Core / MQTT brokers
  └─→ Endpoint Group (eu-west-1)
        └─→ NLB → IoT Core / MQTT brokers

Device Configuration (one-time):
mqtt_broker_ip = "75.2.60.5"
mqtt_broker_port = 8883

# Devices worldwide connect
# Anycast routes to nearest region
# No DNS lookup needed (static IP)
```

**Benefits**:
```
✅ Static IPs (devices can't update, hardcoded firmware)
✅ Global distribution (devices route to nearest endpoint)
✅ TCP support (MQTT over TCP)
✅ Automatic failover (if region fails, devices reconnect to next)
✅ Client affinity (device stays connected to same region)
✅ Cost-effective (low bandwidth per device, aggregated)

Scale:
- 1M devices × 10 KB/hour = 10 GB/hour
- 10 GB/hour × 730 hours = 7.3 TB/month
- Global Accelerator: $18 + (7,300 GB × $0.015) = $127.50/month
- Minimal cost for global IoT fleet management
```

### Use Case 3: Blue/Green Deployment

**Requirements**:
```
- Zero-downtime deployment
- Gradual traffic shift (canary)
- Instant rollback
- No DNS propagation delay
```

**Strategy**:
```
Phase 1: Initial State
- us-east-1 (Blue, v1.0): Traffic dial 100%
- us-west-2 (Green, v2.0): Traffic dial 0%

Phase 2: Deploy v2.0 to Green
- Deploy new version to us-west-2
- Test internally (traffic dial still 0%)

Phase 3: Canary (10% traffic to Green)
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...group-uswest2 \
  --traffic-dial-percentage 10

Result:
- Blue: 100/(100+10) = 90.9% traffic
- Green: 10/(100+10) = 9.1% traffic

Monitor for 1 hour (errors, latency, user feedback)

Phase 4: Expand (50% traffic to Green)
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...group-uswest2 \
  --traffic-dial-percentage 100

Result:
- Blue: 50% traffic
- Green: 50% traffic

Monitor for 1 hour

Phase 5: Full Cutover (100% traffic to Green)
# Disable Blue
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...group-useast1 \
  --traffic-dial-percentage 0

# Enable Green fully
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...group-uswest2 \
  --traffic-dial-percentage 100

Result:
- Blue: 0% traffic (standby)
- Green: 100% traffic (active)

Rollback (if issues detected):
# Instant rollback (set Green to 0%, Blue to 100%)
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...group-uswest2 \
  --traffic-dial-percentage 0

aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...group-useast1 \
  --traffic-dial-percentage 100

# Takes effect immediately (no DNS propagation)
# Users back on Blue (v1.0) within seconds
```

**Benefits**:
```
✅ Zero downtime (always at least one region active)
✅ Gradual rollout (10% → 50% → 100%)
✅ Instant rollback (change traffic dial, takes effect in seconds)
✅ No DNS changes (static IPs, no propagation delay)
✅ Metrics-driven (monitor before expanding)
✅ Risk mitigation (canary catches issues early)

vs DNS-based blue/green:
- DNS: Change CNAME, wait TTL (60-300 seconds)
- Global Accelerator: Change traffic dial, instant
```

---

## Monitoring & Troubleshooting

### CloudWatch Metrics

```bash
# Key Metrics
aws cloudwatch list-metrics \
  --namespace AWS/GlobalAccelerator

Metrics:
├── NewFlowCount: New connections per second
├── ProcessedBytesIn: Inbound traffic (bytes)
├── ProcessedBytesOut: Outbound traffic (bytes)
├── TCP_ClientReset: Client-initiated resets
├── TCP_TargetReset: Target-initiated resets
└── Endpoint Health: Binary (1 = healthy, 0 = unhealthy)

# Monitor traffic
aws cloudwatch get-metric-statistics \
  --namespace AWS/GlobalAccelerator \
  --metric-name ProcessedBytesIn \
  --dimensions Name=Accelerator,Value=abc123 \
  --start-time 2026-01-31T00:00:00Z \
  --end-time 2026-01-31T23:59:59Z \
  --period 300 \
  --statistics Sum,Average

# Alert on endpoint unhealthy
aws cloudwatch put-metric-alarm \
  --alarm-name "GA-Endpoint-Unhealthy" \
  --alarm-description "Global Accelerator endpoint unhealthy" \
  --metric-name HealthCheckStatus \
  --namespace AWS/GlobalAccelerator \
  --statistic Minimum \
  --period 60 \
  --evaluation-periods 3 \
  --threshold 0.5 \
  --comparison-operator LessThanThreshold \
  --dimensions Name=Accelerator,Value=abc123 Name=EndpointGroup,Value=group1 \
  --alarm-actions arn:aws:sns:us-east-1:123:ga-alerts
```

### Flow Logs

```bash
# Enable flow logs (VPC Flow Logs for Global Accelerator)
aws globalaccelerator update-accelerator-attributes \
  --accelerator-arn arn:aws:globalaccelerator::123:accelerator/abc123 \
  --flow-logs-enabled \
  --flow-logs-s3-bucket my-ga-logs \
  --flow-logs-s3-prefix ga-flows/

# Flow log format (similar to VPC Flow Logs):
# timestamp src-ip dst-ip src-port dst-port protocol packets bytes action

# Example log entry:
# 2026-01-31T10:00:00Z 1.2.3.4 75.2.60.5 45678 80 TCP 150 75000 ACCEPT

# Query with Athena:
CREATE EXTERNAL TABLE ga_flow_logs (
  timestamp STRING,
  src_ip STRING,
  dst_ip STRING,
  src_port INT,
  dst_port INT,
  protocol STRING,
  packets BIGINT,
  bytes BIGINT,
  action STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ' '
LOCATION 's3://my-ga-logs/ga-flows/';

# Find top source IPs
SELECT src_ip, SUM(bytes) as total_bytes
FROM ga_flow_logs
WHERE timestamp > '2026-01-31'
GROUP BY src_ip
ORDER BY total_bytes DESC
LIMIT 10;
```

### Common Issues

**Issue 1: Endpoints Not Receiving Traffic**:
```
Symptoms: All endpoints healthy, but no traffic
Causes:
- Listener port mismatch (listener 80, endpoint 8080)
- Security group rules (blocking Global Accelerator IPs)
- Endpoint not registered (forgot to add to group)

Troubleshooting:
1. Verify listener configuration
aws globalaccelerator describe-listener --listener-arn arn:...

2. Check endpoint group
aws globalaccelerator describe-endpoint-group --endpoint-group-arn arn:...

3. Verify security group allows Global Accelerator IP ranges
aws ec2 describe-security-groups --group-ids sg-abc123

# Global Accelerator IP ranges (download from AWS)
curl https://ip-ranges.amazonaws.com/ip-ranges.json | \
  jq '.prefixes[] | select(.service=="GLOBALACCELERATOR") | .ip_prefix'

4. Test connectivity from edge location
# Use test-endpoint API or manual testing

Fix:
- Update listener port to match endpoint
- Add security group rule for Global Accelerator IPs
- Register endpoint in endpoint group
```

**Issue 2: High Latency**:
```
Symptoms: Latency higher than expected (>100ms)
Causes:
- Traffic routing to wrong region (traffic dial misconfigured)
- Endpoint health check failures (forcing failover)
- Application performance (not Global Accelerator issue)

Troubleshooting:
1. Check which endpoint group receiving traffic
aws globalaccelerator describe-endpoint-group --endpoint-group-arn arn:...
# Look at TrafficDialPercentage

2. Verify endpoints healthy
# HealthState: HEALTHY

3. Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/GlobalAccelerator \
  --metric-name NewFlowCount \
  --dimensions Name=EndpointGroup,Value=group1

4. Test from client location
curl -w "@curl-format.txt" -o /dev/null -s http://75.2.60.5

# curl-format.txt:
# time_namelookup: %{time_namelookup}\n
# time_connect: %{time_connect}\n
# time_total: %{time_total}\n

Fix:
- Adjust traffic dials (route to correct region)
- Fix endpoint health issues
- Optimize application performance
```

**Issue 3: Client IP Not Preserved**:
```
Symptoms: Application logs show Global Accelerator IP (not client)
Causes:
- ClientIPPreservationEnabled = false
- Endpoint type doesn't support (EC2 instance, Elastic IP)

Troubleshooting:
1. Check configuration
aws globalaccelerator describe-endpoint-group --endpoint-group-arn arn:...
# Look at ClientIPPreservationEnabled

2. Verify endpoint type (ALB/NLB only)

Fix:
# Enable client IP preservation (ALB/NLB)
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:... \
  --endpoint-configurations '[{
    "EndpointId": "arn:aws:...app/myapp-alb/abc123",
    "ClientIPPreservationEnabled": true
  }]'

# For EC2/EIP: Use X-Forwarded-For header or Proxy Protocol
```

---

## Best Practices

### Design

```
✅ Do:
- Use 2 static IPs (redundancy)
- Enable health checks (automatic failover)
- Multi-region endpoints (HA)
- Traffic dials for blue/green deployments
- Client IP preservation (ALB/NLB)
- Flow logs (security analysis)
- CloudWatch alarms (monitoring)

❌ Don't:
- Single region (no failover)
- Disable health checks (no automatic failover)
- Mix internet-facing and internal endpoints
- Forget security group rules (block Global Accelerator)
```

### Security

```
✅ Strategies:
1. Security groups: Allow Global Accelerator IP ranges only
2. AWS Shield Standard: Included (DDoS protection)
3. AWS Shield Advanced: Optional ($3,000/month, advanced DDoS)
4. Flow logs: Monitor suspicious traffic patterns
5. VPC endpoints: Keep traffic within AWS network

Example security group:
aws ec2 authorize-security-group-ingress \
  --group-id sg-abc123 \
  --ip-permissions IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges='[{CidrIp=75.2.60.5/32}]'

# Allow only Global Accelerator static IPs
# Block all other internet traffic
```

### Cost Optimization

```
Strategies:
1. Right-size endpoints (don't over-provision)
2. Use traffic dials wisely (avoid idle regions)
3. Consider CloudFront for cacheable content (cheaper)
4. Monitor data transfer (main cost driver)
5. Delete unused accelerators ($18/month per accelerator)

Example:
Scenario: 10 TB/month transfer
- Global Accelerator: $18 + (10,000 GB × $0.015) = $168/month
- Direct to ALB: $0 + (10,000 GB × $0.09) = $900/month
- Savings: $732/month

BUT if content is cacheable:
- CloudFront: ~$850/month (includes caching)
- CloudFront cheaper for cacheable, Global Accelerator for non-cacheable
```

---

## Interview Questions

### Q1: When would you choose AWS Global Accelerator over Amazon CloudFront? Provide specific use cases for each.

**Answer**:

**Global Accelerator vs CloudFront Decision Criteria**:

**Global Accelerator** (Layer 4 - TCP/UDP):
```
Choose when:
✅ Non-HTTP protocols (UDP, TCP, custom)
✅ Static IP addresses required
✅ No caching benefit (dynamic, user-specific data)
✅ Real-time applications (gaming, VoIP, WebSocket)
✅ Firewall whitelisting needed (static IPs)

Technical reasons:
1. Protocol Support:
   - Global Accelerator: TCP, UDP, any IP protocol
   - CloudFront: HTTP, HTTPS, WebSocket only
   
   Example: Gaming server using UDP
   → Must use Global Accelerator (CloudFront doesn't support UDP)

2. Static IPs:
   - Global Accelerator: 2 static anycast IPs (never change)
   - CloudFront: Dynamic IPs (change frequently)
   
   Example: IoT devices with hardcoded IPs in firmware
   → Must use Global Accelerator (can't update DNS on devices)

3. Caching:
   - Global Accelerator: No caching (proxies traffic)
   - CloudFront: Edge caching (serves from cache)
   
   Example: Real-time stock ticker (every request unique)
   → Global Accelerator (no caching benefit, lower latency via AWS network)
```

**Use Case 1: Online Gaming** (Global Accelerator):
```
Requirements:
- UDP protocol (game traffic)
- Low latency (<30ms)
- Static IPs (client configuration)
- Global players (Asia, Europe, Americas)

Why Global Accelerator:
✅ UDP support (game protocol)
✅ Static IPs: 75.2.60.5 (hardcoded in game client)
✅ Anycast routing (players route to nearest edge)
✅ AWS backbone (lower latency than internet)
✅ Client affinity (player stays in same region/server)

Architecture:
Game Client (config file):
  server_ip = "75.2.60.5"
  server_port = 7777
  
Global Accelerator:
  ├─→ us-east-1: Game servers (NA players)
  ├─→ eu-west-1: Game servers (EU players)
  └─→ ap-southeast-1: Game servers (Asia players)

Result:
- NA player → Routes to us-east-1 (25ms)
- EU player → Routes to eu-west-1 (20ms)
- Asia player → Routes to ap-southeast-1 (30ms)

vs CloudFront:
❌ No UDP support (CloudFront HTTP/HTTPS only)
❌ Dynamic IPs (can't hardcode in client)
Result: Cannot use CloudFront for this use case
```

**Use Case 2: IoT Device Fleet** (Global Accelerator):
```
Requirements:
- 1 million devices worldwide
- MQTT protocol (TCP port 8883)
- Devices can't update DNS (embedded firmware)
- Low bandwidth per device

Why Global Accelerator:
✅ Static IPs (firmware hardcoded)
✅ TCP support (MQTT over TCP)
✅ Global distribution (devices route to nearest)
✅ No caching needed (device telemetry is unique)

Architecture:
IoT Device (firmware):
  mqtt_broker = "75.2.60.5:8883"
  
Global Accelerator:
  ├─→ us-east-1: IoT Core / MQTT brokers
  └─→ eu-west-1: IoT Core / MQTT brokers

Result:
- 1M devices connect to same static IP
- Anycast routes each device to nearest endpoint
- No firmware updates needed (IP never changes)

Cost:
- 1M devices × 10 KB/hour × 730 hours = 7.3 TB/month
- Global Accelerator: $18 + $109.50 = $127.50/month
- Affordable for massive IoT fleet

vs CloudFront:
❌ MQTT not HTTP (CloudFront doesn't support)
❌ Dynamic IPs (can't hardcode in firmware)
Result: Cannot use CloudFront
```

**CloudFront** (Layer 7 - HTTP/HTTPS):
```
Choose when:
✅ HTTP/HTTPS content
✅ Caching provides value (static assets, videos)
✅ Global content delivery (edge caching)
✅ DDoS protection + caching
✅ Cost-effective for high-volume downloads

Technical reasons:
1. Caching:
   - CloudFront: Cache at 400+ edge locations
   - Global Accelerator: No caching (proxies traffic)
   
   Example: Website images (same for all users)
   → CloudFront (cache miss once, then serve from edge)

2. Cost:
   - CloudFront: $0.085/GB (HTTP, includes caching)
   - Global Accelerator: $0.105/GB ($0.09 + $0.015 premium)
   
   Example: 100 TB/month video streaming
   → CloudFront $8,500/month vs Global Accelerator $10,500/month
   → CloudFront saves $2,000/month (plus caching reduces origin load)

3. Origin Shield:
   - CloudFront: Origin Shield (reduce origin load)
   - Global Accelerator: Every request hits origin
   
   Example: API with rate limits
   → CloudFront (cache responses, reduce origin requests)
```

**Use Case 3: E-Commerce Website** (CloudFront):
```
Requirements:
- Static assets (images, CSS, JS)
- Product pages (cacheable for 5 minutes)
- Global customers
- High traffic (1M requests/day)

Why CloudFront:
✅ Edge caching (images served from local edge)
✅ HTTP/HTTPS (website protocol)
✅ Origin Shield (reduce load on ALB)
✅ Cost-effective (caching reduces origin traffic)

Architecture:
CloudFront Distribution:
  ├─→ Behaviors:
  │     ├─→ /images/* → Cache 24 hours
  │     ├─→ /static/* → Cache 24 hours
  │     └─→ /api/* → Cache 5 minutes
  └─→ Origin: ALB (us-east-1)

Result:
- User in Tokyo requests /images/product.jpg
- CloudFront Tokyo edge: Cache hit (5ms)
- No request to origin (ALB)
- 95% cache hit rate

Performance:
- Cache hit: 5-10ms (edge to user)
- Cache miss: 200ms (edge → origin → edge → user)
- Average: ~15ms (95% hits × 10ms + 5% miss × 200ms)

Cost:
- 100 TB transfer (95% cached at edge)
- Origin load: 5 TB (5% cache miss)
- CloudFront: $8,500/month
- Origin transfer: $450/month (5 TB)
- Total: $8,950/month

vs Global Accelerator:
- No caching (every request hits origin)
- Origin load: 100 TB (all traffic)
- Cost: $10,500/month + origin overload
Result: CloudFront better (caching + cost)
```

**Use Case 4: Video Streaming** (CloudFront):
```
Requirements:
- Video files (large, 1-10 GB each)
- HLS/DASH streaming
- Global audience
- 1 PB/month transfer

Why CloudFront:
✅ Caching (videos served from edge)
✅ HTTP streaming protocols (HLS, DASH)
✅ Massive scale (1 PB/month)
✅ Cost-effective ($0.02-$0.085/GB at scale)

Architecture:
CloudFront:
  ├─→ Origin: S3 bucket (video files)
  └─→ Edge locations cache video segments

Result:
- User requests video.m3u8 (HLS manifest)
- CloudFront serves from edge (cached)
- Video segments streamed from local edge
- 99% cache hit rate (videos don't change)

Cost:
- 1 PB = 1,000 TB
- CloudFront: ~$20,000/month (volume discounts)
- Origin transfer: 10 TB (1% miss) = $900

vs Global Accelerator:
- No caching (1 PB from origin)
- Cost: $105,000/month ($0.105/GB × 1M GB)
- Origin S3 transfer: $90,000/month
- Total: $195,000/month
Result: CloudFront saves $175,000/month
```

**Combined Use: Both Global Accelerator + CloudFront**:
```
Use Case: Gaming Platform
- Game assets (textures, maps) → CloudFront (cacheable)
- Game server (UDP, real-time) → Global Accelerator (low latency)
- Leaderboard API → CloudFront (cacheable, HTTP)
- Player matchmaking → Global Accelerator (WebSocket, real-time)

Architecture:
CloudFront:
  ├─→ /assets/* → S3 (game textures)
  └─→ /api/leaderboard → ALB (cached 1 minute)

Global Accelerator:
  ├─→ Port 7777 UDP → Game servers
  └─→ Port 443 TCP → Matchmaking service

Result:
- Best of both worlds
- CloudFront for cacheable content
- Global Accelerator for real-time, low-latency
```

**Decision Matrix**:
```
Protocol         Caching    Static IP    Recommendation
------------------------------------------------------------------------
HTTP/HTTPS       Yes        No           CloudFront
HTTP/HTTPS       No         No           Global Accelerator
HTTP/HTTPS       Yes/No     Yes          Global Accelerator
TCP (non-HTTP)   N/A        No           Global Accelerator
TCP (non-HTTP)   N/A        Yes          Global Accelerator
UDP              N/A        Any          Global Accelerator (only option)

Content Type:
- Static files (images, videos) → CloudFront
- Dynamic API (user-specific) → Global Accelerator
- Real-time (gaming, VoIP) → Global Accelerator
- Software downloads → CloudFront
- Live streaming → CloudFront

Cost:
- >100 TB/month cacheable → CloudFront
- <100 TB/month non-cacheable → Global Accelerator
- Static IPs required → Global Accelerator (regardless of cost)
```

### Q2: Design a highly available global application using Global Accelerator with automatic failover across multiple regions. Include health check configuration and expected failover time.

**Answer**:

**Architecture - Multi-Region HA with Global Accelerator**:

```
Global Accelerator
  ├─→ Static IPs: 75.2.60.5, 99.83.185.42
  │
  ├─→ Listener 1 (HTTPS - Port 443)
  │     ├─→ Endpoint Group: us-east-1 (Primary, 100% traffic)
  │     │     ├─→ ALB-1 (active, weight 128)
  │     │     └─→ ALB-2 (standby, weight 128)
  │     │
  │     ├─→ Endpoint Group: us-west-2 (Backup, 0% traffic)
  │     │     └─→ ALB-3 (standby, weight 128)
  │     │
  │     └─→ Endpoint Group: eu-west-1 (DR, 0% traffic)
  │           └─→ ALB-4 (standby, weight 128)
  │
  └─→ Listener 2 (WebSocket - Port 8080)
        └─→ (same endpoint groups)

Each ALB:
  ├─→ Target Group (EC2 Auto Scaling)
  │     ├─→ Min: 2 instances
  │     ├─→ Max: 20 instances
  │     └─→ Desired: 4 instances
  ├─→ Multi-AZ (3 AZs)
  └─→ Health checks enabled
```

**Implementation**:

**Step 1: Create Global Accelerator**:
```bash
# Create accelerator
aws globalaccelerator create-accelerator \
  --name "Production-App-GA" \
  --ip-address-type IPV4 \
  --enabled

# Output:
{
  "Accelerator": {
    "AcceleratorArn": "arn:aws:globalaccelerator::123:accelerator/abc123",
    "IpSets": [{
      "IpAddresses": ["75.2.60.5", "99.83.185.42"]
    }],
    "Status": "DEPLOYED"
  }
}

# Create listener (HTTPS)
aws globalaccelerator create-listener \
  --accelerator-arn arn:aws:globalaccelerator::123:accelerator/abc123 \
  --port-ranges FromPort=443,ToPort=443 \
  --protocol TCP \
  --client-affinity SOURCE_IP

# Output:
{
  "Listener": {
    "ListenerArn": "arn:aws:globalaccelerator::123:.../listener/xyz789",
    "ClientAffinity": "SOURCE_IP"  # Session stickiness
  }
}
```

**Step 2: Configure Primary Region** (us-east-1):
```bash
# Create endpoint group (primary)
aws globalaccelerator create-endpoint-group \
  --listener-arn arn:aws:globalaccelerator::123:.../listener/xyz789 \
  --endpoint-group-region us-east-1 \
  --traffic-dial-percentage 100 \
  --health-check-protocol HTTPS \
  --health-check-port 443 \
  --health-check-path "/health" \
  --health-check-interval-seconds 30 \
  --threshold-count 3 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/prod-alb-1/aaa111",
      "Weight": 128,
      "ClientIPPreservationEnabled": true
    },
    {
      "EndpointId": "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/prod-alb-2/bbb222",
      "Weight": 128,
      "ClientIPPreservationEnabled": true
    }
  ]'

# Health check configuration:
# - Check every 30 seconds
# - Path: GET https://endpoint/health
# - 3 consecutive failures → UNHEALTHY
# - 3 consecutive successes → HEALTHY
# - Failover time: 90 seconds (3 × 30s)
```

**Step 3: Configure Backup Regions**:
```bash
# us-west-2 (backup)
aws globalaccelerator create-endpoint-group \
  --listener-arn arn:aws:globalaccelerator::123:.../listener/xyz789 \
  --endpoint-group-region us-west-2 \
  --traffic-dial-percentage 0 \
  --health-check-protocol HTTPS \
  --health-check-port 443 \
  --health-check-path "/health" \
  --health-check-interval-seconds 30 \
  --threshold-count 3 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:elasticloadbalancing:us-west-2:123:loadbalancer/app/prod-alb-3/ccc333",
      "Weight": 128,
      "ClientIPPreservationEnabled": true
    }
  ]'

# eu-west-1 (DR)
aws globalaccelerator create-endpoint-group \
  --listener-arn arn:aws:globalaccelerator::123:.../listener/xyz789 \
  --endpoint-group-region eu-west-1 \
  --traffic-dial-percentage 0 \
  --health-check-protocol HTTPS \
  --health-check-port 443 \
  --health-check-path "/health" \
  --health-check-interval-seconds 30 \
  --threshold-count 3 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:elasticloadbalancing:eu-west-1:123:loadbalancer/app/prod-alb-4/ddd444",
      "Weight": 128,
      "ClientIPPreservationEnabled": true
    }
  ]'

# Both regions on standby (0% traffic dial)
# Global Accelerator automatically fails over if primary unhealthy
```

**Step 4: Application Health Endpoint**:
```python
# /health endpoint (Flask)
from flask import Flask, jsonify
import redis
import pymysql

app = Flask(__name__)

@app.route('/health')
def health_check():
    """
    Comprehensive health check
    - Database connectivity
    - Cache connectivity
    - Disk space
    - Memory usage
    """
    try:
        # Check database
        db = pymysql.connect(
            host='prod-db.us-east-1.rds.amazonaws.com',
            user='app',
            password='secret'
        )
        db.close()
        
        # Check Redis
        cache = redis.Redis(host='prod-cache.us-east-1.amazonaws.com')
        cache.ping()
        
        # Check disk space
        import shutil
        disk = shutil.disk_usage('/')
        if disk.free / disk.total < 0.1:  # <10% free
            raise Exception('Low disk space')
        
        # All checks passed
        return jsonify({
            'status': 'healthy',
            'region': 'us-east-1',
            'checks': {
                'database': 'ok',
                'cache': 'ok',
                'disk': 'ok'
            }
        }), 200
        
    except Exception as e:
        # Health check failed
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 503

# Global Accelerator health check:
# - 200 response → HEALTHY
# - 503 response → UNHEALTHY (after 3 consecutive)
```

**Failover Scenarios**:

**Scenario 1: Single ALB Failure** (us-east-1):
```
Timeline:
T+0s: ALB-1 fails (500 errors returned)
T+30s: First failed health check (GET /health → 503)
T+60s: Second failed health check
T+90s: Third failed health check → ALB-1 marked UNHEALTHY
T+90s: Global Accelerator stops sending traffic to ALB-1
T+90s: Traffic redistributed to ALB-2 only

Traffic distribution:
Before:
- ALB-1: 50% (weight 128/256)
- ALB-2: 50% (weight 128/256)

After (ALB-1 unhealthy):
- ALB-1: 0% (unhealthy)
- ALB-2: 100% (only healthy endpoint)

Impact:
- Partial degradation (50% capacity lost)
- No user-facing downtime (ALB-2 handles load)
- RTO: 90 seconds (time to detect failure)
- RPO: 0 (no data loss, traffic rerouted)

Auto Scaling:
- ALB-2 receives 2× traffic
- Auto Scaling launches more instances
- Capacity restored in 3-5 minutes
```

**Scenario 2: Region Failure** (us-east-1):
```
Timeline:
T+0s: us-east-1 region outage (both ALB-1 and ALB-2 fail)
T+30s: First failed health check (both ALBs)
T+60s: Second failed health check
T+90s: Third failed health check → Both ALBs marked UNHEALTHY
T+90s: All endpoints in us-east-1 group UNHEALTHY
T+90s: Global Accelerator automatically fails over to us-west-2
T+90s: Traffic dial to us-west-2 overridden (0% → 100% automatic)
T+90s: Users now reach us-west-2

Traffic distribution:
Before:
- us-east-1: 100% (primary)
- us-west-2: 0% (standby)
- eu-west-1: 0% (DR)

After (us-east-1 unhealthy):
- us-east-1: 0% (unhealthy)
- us-west-2: 100% (automatic failover)
- eu-west-1: 0% (still standby)

Impact:
- Full failover to backup region
- Users connect to us-west-2 automatically
- RTO: 90 seconds (health check detection)
- RPO: 0 (stateless app) or ~90s (if session data lost)

User Experience:
- Existing connections: May drop (TCP reset)
- New connections: Route to us-west-2
- Session affinity: SOURCE_IP maintained (same user → same region)

Auto Scaling in us-west-2:
- Sudden 100% traffic increase
- Auto Scaling launches instances
- Capacity scaled in 3-5 minutes
- Pre-warm recommended (keep warm standby)
```

**Scenario 3: Multi-Region Failure** (us-east-1 + us-west-2):
```
Timeline:
T+0s: us-east-1 and us-west-2 both fail (catastrophic)
T+90s: Both regions marked UNHEALTHY
T+90s: Global Accelerator fails over to eu-west-1 (last resort)
T+90s: Traffic now served from Europe

Traffic distribution:
- us-east-1: 0% (unhealthy)
- us-west-2: 0% (unhealthy)
- eu-west-1: 100% (only healthy region)

Impact:
- All users globally served from eu-west-1
- Increased latency (e.g., US users → Europe)
- But application remains available
- RTO: 90 seconds (failover time)
```

**Recovery**:
```
Timeline:
T+0s: us-east-1 recovered (ALBs healthy again)
T+30s: First successful health check
T+60s: Second successful health check
T+90s: Third successful health check → us-east-1 marked HEALTHY
T+90s: Traffic returns to us-east-1 (traffic dial 100%)
T+90s: us-west-2 back to standby (traffic dial 0%)

Automatic recovery (no manual intervention)
```

**Monitoring & Alerting**:
```python
# CloudWatch Alarm: Endpoint unhealthy
import boto3

cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_alarm(
    AlarmName='GA-Primary-Region-Unhealthy',
    ComparisonOperator='LessThanThreshold',
    EvaluationPeriods=1,
    MetricName='HealthCheckStatus',
    Namespace='AWS/GlobalAccelerator',
    Period=60,
    Statistic='Minimum',
    Threshold=0.5,  # 0 = unhealthy, 1 = healthy
    ActionsEnabled=True,
    AlarmActions=[
        'arn:aws:sns:us-east-1:123:critical-alerts',
        'arn:aws:sns:us-east-1:123:pagerduty'
    ],
    Dimensions=[
        {'Name': 'Accelerator', 'Value': 'abc123'},
        {'Name': 'EndpointGroup', 'Value': 'us-east-1-group'}
    ]
)

# SNS notification:
# "ALARM: Global Accelerator primary region (us-east-1) unhealthy.
#  Automatic failover to us-west-2 in progress.
#  RTO: 90 seconds. Team notified."
```

**Performance Metrics**:
```
SLA Achieved:
- Availability: 99.99% (52 minutes downtime/year)
- RTO: 90 seconds (health check-based failover)
- RPO: 0 seconds (stateless) or 90 seconds (session data)
- Failover: Automatic (no manual intervention)

Cost:
- Global Accelerator: $18/month (1 accelerator)
- Data transfer: 10 TB/month × $0.015 = $150/month
- Total: $168/month

Infrastructure:
- 3 regions (HA)
- 4 ALBs (2 primary, 1 backup, 1 DR)
- Auto Scaling (elastic capacity)
- Multi-AZ (within each region)

Failover Test Results:
- Single ALB failure: 90s detection, 0 user impact
- Region failure: 90s detection, brief connection drops
- Multi-region: 90s detection, higher latency (Europe)
- Recovery: Automatic, 90s re-detection
```

**Best Practices Applied**:
```
✅ Multi-region (3 regions: primary, backup, DR)
✅ Multi-AZ within each region (AZ-level HA)
✅ Auto Scaling (elastic capacity during failover)
✅ Health checks (comprehensive: DB, cache, disk)
✅ Static IPs (no DNS propagation delay)
✅ Client affinity (session stickiness)
✅ Monitoring (CloudWatch alarms, SNS notifications)
✅ Automated failover (no manual intervention)
✅ Automated recovery (returns to primary when healthy)
✅ Pre-warm standby (keep warm instances in backup regions)
```

### Q3: Explain how traffic dials and endpoint weights work together in Global Accelerator. Provide an example of using both for a phased deployment.

**Answer**:

**Traffic Dials vs Endpoint Weights**:

```
Traffic Dial (Endpoint Group level):
- Controls percentage of traffic to entire region
- Range: 0-100%
- Use case: Region-level traffic management
- Example: Route 70% to us-east-1, 30% to eu-west-1

Endpoint Weight (Endpoint level):
- Controls distribution within region
- Range: 0-255
- Use case: Load balancing between endpoints in same region
- Example: Within us-east-1, route 80% to ALB-1, 20% to ALB-2

Combined Calculation:
Total traffic to endpoint = 
  (Endpoint Group Traffic Dial) × (Endpoint Weight / Sum of Weights in Group)
```

**Example: Phased Deployment with Both**:

**Scenario**:
```
Deploy new application version across 2 regions:
- us-east-1 (primary, 70% traffic)
- eu-west-1 (secondary, 30% traffic)

Each region has 2 ALBs:
- ALB-OLD (current version 1.0)
- ALB-NEW (new version 2.0)

Strategy: Gradual rollout with canary testing
```

**Phase 1: Initial State** (100% v1.0):
```bash
# us-east-1 configuration
Traffic Dial: 70%
  ├─→ ALB-OLD (v1.0): Weight 128
  └─→ ALB-NEW (v2.0): Weight 0  # Not deployed yet

# eu-west-1 configuration
Traffic Dial: 30%
  ├─→ ALB-OLD (v1.0): Weight 128
  └─→ ALB-NEW (v2.0): Weight 0  # Not deployed yet

Traffic calculation:
us-east-1:
  Total dial: 70%
  ALB-OLD: 70% × (128/128) = 70%
  ALB-NEW: 70% × (0/128) = 0%

eu-west-1:
  Total dial: 30%
  ALB-OLD: 30% × (128/128) = 30%
  ALB-NEW: 30% × (0/128) = 0%

Result: 100% traffic to v1.0
```

**Phase 2: Canary in us-east-1** (5% to v2.0):
```bash
# Deploy v2.0 to us-east-1 ALB-NEW
# Shift 5% of us-east-1 traffic to new version

aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...us-east-1 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:...alb/OLD",
      "Weight": 243  # 95% of us-east-1
    },
    {
      "EndpointId": "arn:aws:...alb/NEW",
      "Weight": 12   # 5% of us-east-1
    }
  ]'

Traffic calculation:
us-east-1:
  Total dial: 70%
  Total weights: 243 + 12 = 255
  ALB-OLD: 70% × (243/255) = 66.7%
  ALB-NEW: 70% × (12/255) = 3.3%

eu-west-1:
  ALB-OLD: 30% (unchanged)

Result:
- v1.0: 66.7% + 30% = 96.7%
- v2.0: 3.3% (canary)

Monitor for 1 hour:
- Error rate
- Latency (p50, p95, p99)
- Business metrics
```

**Phase 3: Expand Canary** (20% to v2.0):
```bash
# Increase v2.0 weight in us-east-1

aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...us-east-1 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:...alb/OLD",
      "Weight": 204  # 80% of us-east-1
    },
    {
      "EndpointId": "arn:aws:...alb/NEW",
      "Weight": 51   # 20% of us-east-1
    }
  ]'

Traffic calculation:
us-east-1:
  ALB-OLD: 70% × (204/255) = 56%
  ALB-NEW: 70% × (51/255) = 14%

Result:
- v1.0: 56% + 30% = 86%
- v2.0: 14%

Monitor for 2 hours
```

**Phase 4: Full us-east-1 to v2.0**:
```bash
# 100% of us-east-1 to new version

aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...us-east-1 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:...alb/OLD",
      "Weight": 0    # Drained
    },
    {
      "EndpointId": "arn:aws:...alb/NEW",
      "Weight": 255  # 100% of us-east-1
    }
  ]'

Traffic calculation:
us-east-1:
  ALB-NEW: 70% × (255/255) = 70%

Result:
- v1.0: 30% (only eu-west-1)
- v2.0: 70%

Monitor for 4 hours (longer observation before eu-west-1)
```

**Phase 5: Deploy to eu-west-1, Canary** (5%):
```bash
# Deploy v2.0 to eu-west-1
# Start with 5% canary

aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...eu-west-1 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:...alb/OLD",
      "Weight": 243  # 95% of eu-west-1
    },
    {
      "EndpointId": "arn:aws:...alb/NEW",
      "Weight": 12   # 5% of eu-west-1
    }
  ]'

Traffic calculation:
us-east-1:
  ALB-NEW: 70%

eu-west-1:
  ALB-OLD: 30% × (243/255) = 28.6%
  ALB-NEW: 30% × (12/255) = 1.4%

Result:
- v1.0: 28.6%
- v2.0: 70% + 1.4% = 71.4%
```

**Phase 6: Full Rollout** (100% to v2.0):
```bash
# 100% eu-west-1 to v2.0

aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...eu-west-1 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:...alb/OLD",
      "Weight": 0
    },
    {
      "EndpointId": "arn:aws:...alb/NEW",
      "Weight": 255
    }
  ]'

Result:
- v1.0: 0% (fully drained)
- v2.0: 100% (complete)

Decommission OLD ALBs after 48 hours (safety period)
```

**Rollback Example** (Phase 3 → Phase 2):
```bash
# If issues detected in Phase 3, rollback to Phase 2

# Instant rollback (reduce NEW weight)
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...us-east-1 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:...alb/OLD",
      "Weight": 243  # Back to 95%
    },
    {
      "EndpointId": "arn:aws:...alb/NEW",
      "Weight": 12   # Back to 5%
    }
  ]'

# Takes effect in seconds (no DNS propagation)
# Traffic immediately shifts: 14% → 3.3%

# Full rollback (100% to v1.0):
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...us-east-1 \
  --endpoint-configurations '[
    {
      "EndpointId": "arn:aws:...alb/OLD",
      "Weight": 255  # 100%
    },
    {
      "EndpointId": "arn:aws:...alb/NEW",
      "Weight": 0    # 0%
    }
  ]'

# Instant: 70% back to v1.0
```

**Advanced: Region-Level Traffic Shift**:
```bash
# Use traffic dials to shift regions (e.g., disaster recovery)

# Scenario: Migrate traffic from us-east-1 to eu-west-1

Phase 1: 70/30 split (normal)
us-east-1: 70% traffic dial
eu-west-1: 30% traffic dial

Phase 2: Reduce us-east-1 (maintenance window)
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...us-east-1 \
  --traffic-dial-percentage 50

Result:
- us-east-1: 50%
- eu-west-1: 30%
- Total: 80% (normalized: us-east-1 62.5%, eu-west-1 37.5%)

Phase 3: Shift to eu-west-1
aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...us-east-1 \
  --traffic-dial-percentage 0

aws globalaccelerator update-endpoint-group \
  --endpoint-group-arn arn:aws:...eu-west-1 \
  --traffic-dial-percentage 100

Result:
- us-east-1: 0%
- eu-west-1: 100%

# Perform maintenance in us-east-1
# Restore when complete
```

**Benefits of Combined Approach**:
```
✅ Granular control (region + endpoint level)
✅ Gradual rollout (minimize risk)
✅ Instant rollback (change weights, no DNS)
✅ Flexible strategies (canary, blue/green, A/B testing)
✅ Multi-region coordination (orchestrate complex deployments)
✅ Zero downtime (always serving traffic)
✅ Metrics-driven (observe before expanding)

Timeline Summary:
- Phase 1 → 2: 3.3% canary (1 hour observation)
- Phase 2 → 3: 14% expanded (2 hours observation)
- Phase 3 → 4: 70% full us-east-1 (4 hours observation)
- Phase 4 → 5: 1.4% eu-west-1 canary (1 hour)
- Phase 5 → 6: 100% complete (48 hours safety)
- Total: ~3 days for safe, complete rollout
```

---

This comprehensive AWS Global Accelerator guide covers all aspects needed for SAP-C02 certification with static anycast IPs, endpoint groups, traffic management, health checks, CloudFront comparison, and real-world global application architectures!
