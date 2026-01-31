# AWS Load Balancers: Complete Guide

## Table of Contents
1. [Load Balancing History](#load-balancing-history)
2. [Application Load Balancer (ALB)](#application-load-balancer-alb)
3. [Network Load Balancer (NLB)](#network-load-balancer-nlb)
4. [Gateway Load Balancer (GWLB)](#gateway-load-balancer-gwlb)
5. [Classic Load Balancer (CLB)](#classic-load-balancer-clb)
6. [Target Groups](#target-groups)
7. [Health Checks](#health-checks)
8. [Sticky Sessions](#sticky-sessions)
9. [Cross-Zone Load Balancing](#cross-zone-load-balancing)
10. [Nginx Simulation](#nginx-simulation)
11. [Interview Questions](#interview-questions)

---

## Load Balancing History

### Before Load Balancers

**Single Server Architecture** (Pre-2000s):
```
Client → Web Server → Database

Problems:
❌ Single point of failure
❌ Limited capacity
❌ Poor user experience during high load
❌ No redundancy
```

**Hardware Load Balancers** (2000s):
```
F5 Big-IP, Cisco ACE

Cost: $50,000-$250,000
Pros: High performance, advanced features
Cons: Expensive, complex, vendor lock-in
```

### AWS Load Balancer Evolution

```
2009: Elastic Load Balancing (Classic Load Balancer)
      - Layer 4 (TCP) and Layer 7 (HTTP)
      - Basic health checks
      - $0.025/hour + $0.008/GB

2016: Application Load Balancer (ALB)
      - Advanced Layer 7 routing
      - WebSocket support
      - HTTP/2
      - Target Groups

2017: Network Load Balancer (NLB)
      - Layer 4 (TCP/UDP)
      - Static IP support
      - Millions of requests/second
      - Ultra-low latency (<100 μs)

2020: Gateway Load Balancer (GWLB)
      - Layer 3 (IP packets)
      - Third-party security appliances
      - Transparent network gateway

2021: ALB improvements
      - Weighted Target Groups
      - gRPC support
      - Least Outstanding Requests algorithm
```

### Why Load Balancers Were Created

**Problems Solved**:

1. **High Availability**:
```
Before: Server failure = downtime
After: Distribute traffic across multiple servers

Example:
3 web servers, each handle 1000 req/sec
If one fails: 2 servers handle 1500 req/sec (degraded, but working)
```

2. **Scalability**:
```
Before: Vertical scaling (bigger server)
After: Horizontal scaling (more servers)

Example:
Single server: Max 5000 req/sec
5 servers: Max 25,000 req/sec
```

3. **SSL/TLS Termination**:
```
Before: Each server handles SSL (CPU intensive)
After: Load balancer terminates SSL, sends HTTP to servers

Benefit: Offload encryption, simpler certificate management
```

---

## Application Load Balancer (ALB)

### Layer 7 (Application Layer)

**HTTP/HTTPS routing**:
```
ALB inspects:
- HTTP headers
- URL path
- Query strings
- Host headers

Routing decisions based on application data
```

### Features

**1. Path-Based Routing**:
```
example.com/api/* → API servers
example.com/images/* → Image servers
example.com/* → Web servers

Target Groups:
- api-tg: 10.0.1.5, 10.0.1.6
- images-tg: 10.0.2.5, 10.0.2.6
- web-tg: 10.0.3.5, 10.0.3.6
```

**2. Host-Based Routing**:
```
api.example.com → API servers
www.example.com → Web servers
admin.example.com → Admin servers

Use case: Multi-tenant applications, microservices
```

**3. Query String Routing**:
```
example.com/?version=v1 → Old API
example.com/?version=v2 → New API

Use case: A/B testing, canary deployments
```

**4. HTTP Header Routing**:
```
User-Agent: Mobile → Mobile servers
User-Agent: Desktop → Desktop servers

Use case: Device-specific content
```

### Creating ALB

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name my-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345 \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4

# Create Target Group
aws elbv2 create-target-group \
  --name web-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id vpc-12345 \
  --health-check-protocol HTTP \
  --health-check-path /health

# Register Targets
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=i-1234,Id=i-5678

# Create Listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...

# Create Path-Based Rule
aws elbv2 create-rule \
  --listener-arn arn:aws:elasticloadbalancing:... \
  --priority 10 \
  --conditions Field=path-pattern,Values='/api/*' \
  --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:.../api-tg
```

### ALB Request Routing

**Listener Rules** (evaluated in order):
```
Priority 1: Host = api.example.com → api-tg
Priority 2: Path = /images/* → images-tg
Priority 3: Path = /api/* → api-tg
Default: → web-tg

Example Request: http://example.com/api/users
1. Check Host: example.com (not api.example.com) → No match
2. Check Path: /api/users matches /api/* → Match! Route to api-tg
```

### Authentication

**Cognito Integration**:
```yaml
Listener Rule:
  - Authenticate with Cognito
  - Forward to Target Group

Flow:
1. User → ALB
2. ALB → Cognito (login)
3. Cognito → User (JWT token)
4. User → ALB (with token)
5. ALB → Backend (with user info in headers)
```

**OIDC (OpenID Connect)**:
```
Integrate with:
- Auth0
- Okta
- Google
- Azure AD

Benefit: No authentication code in backend
```

### WebSocket Support

**Persistent connections**:
```
Client ↔ ALB ↔ WebSocket Server

ALB maintains connection
Idle timeout: Up to 4000 seconds

Use case: Chat apps, real-time dashboards
```

### HTTP/2 Support

**Multiplexing**:
```
HTTP/1.1: 1 request per connection
HTTP/2: Multiple requests per connection

Client → ALB: HTTP/2 (multiplexed)
ALB → Backend: HTTP/1.1 (per-request)

Benefit: Faster page loads, reduced latency
```

### Cost

```
ALB Pricing:
$0.0225/hour = $16.40/month
$0.008/LCU (Load Balancer Capacity Unit)

LCU Dimensions:
- New connections/sec: 25
- Active connections: 3,000
- Processed bytes: 1 GB/hour
- Rule evaluations: 1,000/sec

Example:
100 new conn/sec = 4 LCU
10,000 active conn = 3.33 LCU
10 GB/hour = 10 LCU
5,000 rules/sec = 5 LCU

Billed: Max(4, 3.33, 10, 5) = 10 LCU
Cost: $16.40 + (10 LCU × $0.008 × 730 hours) = $74.80/month
```

---

## Network Load Balancer (NLB)

### Layer 4 (Transport Layer)

**TCP/UDP routing**:
```
NLB does NOT inspect:
- HTTP headers
- URL paths
- Cookies

NLB only sees:
- Source/Destination IP
- Source/Destination Port
- Protocol (TCP/UDP)

Routing: Pure IP hash
```

### Features

**1. Static IP**:
```
ALB: Dynamic DNS name (my-alb-1234567890.us-east-1.elb.amazonaws.com)
NLB: Static IP per AZ (52.123.45.67)

Use case: Whitelist IP in firewall, DNS integration
```

**2. Elastic IP**:
```
Bring your own IP:
aws elbv2 create-load-balancer \
  --name my-nlb \
  --type network \
  --subnet-mappings SubnetId=subnet-12345,AllocationId=eipalloc-67890

Benefit: Keep same IP during migration
```

**3. Ultra-Low Latency**:
```
ALB: 10-20 ms latency
NLB: <100 μs latency

Why?
- No Layer 7 processing
- Flow hash algorithm
- Direct routing
```

**4. High Throughput**:
```
ALB: ~100,000 req/sec
NLB: Millions of req/sec

Use case: Gaming, IoT, real-time bidding
```

**5. Preserve Source IP**:
```
ALB: X-Forwarded-For header (source IP in header)
NLB: True source IP (no modification)

Benefit: Backend sees client IP directly
```

### Creating NLB

```bash
# Create NLB
aws elbv2 create-load-balancer \
  --name my-nlb \
  --subnets subnet-12345 subnet-67890 \
  --type network \
  --scheme internet-facing

# Create Target Group (TCP)
aws elbv2 create-target-group \
  --name tcp-tg \
  --protocol TCP \
  --port 80 \
  --vpc-id vpc-12345 \
  --target-type instance

# Create Listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol TCP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### TLS Termination

**NLB with SSL/TLS**:
```bash
# Create Listener with TLS
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol TLS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

**End-to-End Encryption**:
```
Client → NLB (TLS termination) → Backend (HTTP)
or
Client → NLB (TLS passthrough) → Backend (TLS)

Passthrough: NLB forwards encrypted traffic (no decryption)
```

### Cost

```
NLB Pricing:
$0.0225/hour = $16.40/month
$0.006/NLCU (Network Load Balancer Capacity Unit)

NLCU Dimensions:
- New connections/sec: 800
- Active connections: 100,000
- Processed bytes: 1 GB/hour

Example:
10,000 new conn/sec = 12.5 NLCU
500,000 active conn = 5 NLCU
50 GB/hour = 50 NLCU

Billed: Max(12.5, 5, 50) = 50 NLCU
Cost: $16.40 + (50 NLCU × $0.006 × 730 hours) = $235.40/month
```

---

## Gateway Load Balancer (GWLB)

### Layer 3 (Network Layer)

**IP packet routing**:
```
Use case: Third-party security appliances
- Firewalls
- IDS/IPS (Intrusion Detection/Prevention)
- DPI (Deep Packet Inspection)

Architecture:
Client → GWLB → Security Appliance → GWLB → Application
```

### GENEVE Protocol

**Encapsulation**:
```
Original packet → GENEVE encapsulation → Security appliance

Benefit: Preserve source/destination IP
```

### Use Case

**Transparent Security**:
```
VPC → GWLB Endpoint → GWLB → Firewall ASG → Application

Flow:
1. Traffic enters VPC
2. Route table sends to GWLB Endpoint
3. GWLB sends to firewall (scale out with ASG)
4. Firewall inspects/filters
5. GWLB sends back to VPC
6. Traffic reaches application

Benefit: Centralized security, no application changes
```

---

## Classic Load Balancer (CLB)

### Legacy (Pre-2016)

**Layer 4 + Layer 7**:
```
Features:
- Basic HTTP/HTTPS routing
- TCP routing
- SSL termination
- Sticky sessions

Limitations:
❌ No path-based routing
❌ No host-based routing
❌ No WebSocket support
❌ No HTTP/2
❌ No Target Groups

Recommendation: Migrate to ALB/NLB
```

---

## Target Groups

### What is a Target Group?

**Logical grouping of targets**:
```
Target Group = Collection of:
- EC2 instances
- IP addresses
- Lambda functions
- Application Load Balancers (NLB only)
```

### Target Types

**1. Instance**:
```
Target: EC2 instance ID
Port: Registered per instance

Example:
- i-12345: Port 8080
- i-67890: Port 8080
```

**2. IP**:
```
Target: IP address
Port: Registered per IP

Use case: On-premises servers, containers

Example:
- 10.0.1.5: Port 80
- 192.168.1.10: Port 8000 (on-premises)
```

**3. Lambda**:
```
Target: Lambda function ARN

ALB → Lambda (HTTP event)
Response: JSON → HTTP response

Use case: Serverless backends
```

### Target Group Attributes

**Deregistration Delay**:
```
Time to wait before deregistering target

Default: 300 seconds

Use case: Graceful shutdown
1. Target marked "draining"
2. No new connections
3. Existing connections complete
4. After delay, target deregistered
```

**Slow Start**:
```
Gradually increase traffic to new target

Example:
New instance added → Receive 10% traffic (minute 1)
→ 50% traffic (minute 5) → 100% traffic (minute 10)

Benefit: Warm up caches, avoid overload
```

**Stickiness**:
```
Route same client to same target

Cookie-based:
- ALB generates cookie (AWSALB)
- Duration: 1 second - 7 days

Use case: Stateful applications, session data
```

---

## Health Checks

### Configuration

```bash
aws elbv2 modify-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --health-check-protocol HTTP \
  --health-check-port 80 \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 2
```

### Parameters

**Health Check Path**:
```
/health → Application returns 200 OK

Best practice:
- Check database connectivity
- Check critical dependencies
- Return 200 only if fully healthy
```

**Interval**:
```
Time between health checks

Range: 5-300 seconds
Recommended: 30 seconds

Short interval: Faster failure detection, more requests
Long interval: Fewer requests, slower detection
```

**Timeout**:
```
Time to wait for response

Range: 2-120 seconds
Recommended: 5 seconds

Timeout > Interval: Error (timeout must be < interval)
```

**Healthy Threshold**:
```
Consecutive successful checks before marking healthy

Recommended: 2-3 checks

Example:
Threshold = 2, Interval = 30s
→ 60 seconds to mark healthy
```

**Unhealthy Threshold**:
```
Consecutive failed checks before marking unhealthy

Recommended: 2 checks

Example:
Threshold = 2, Interval = 30s
→ 60 seconds to mark unhealthy
```

### Health Check States

```
┌─────────┐
│ Initial │
└────┬────┘
     │
     ▼
┌─────────┐  2 failed  ┌───────────┐
│ Healthy ├───────────→│ Unhealthy │
│         │←───────────┤           │
└─────────┘  2 success └───────────┘

Healthy: Receive traffic
Unhealthy: No traffic, ALB stops routing
```

### Best Practices

**Dedicated Health Endpoint**:
```python
# Flask example
@app.route('/health')
def health_check():
    # Check database
    try:
        db.execute("SELECT 1")
    except:
        return "Database unavailable", 503
    
    # Check Redis
    try:
        redis.ping()
    except:
        return "Cache unavailable", 503
    
    return "OK", 200
```

**Shallow vs Deep Health Checks**:
```
Shallow: Application running?
GET /health → 200 OK

Deep: All dependencies healthy?
- Database connection
- Cache connection
- External API reachable
- Disk space available

Recommendation: Deep for critical apps, shallow for high-scale
```

---

## Sticky Sessions

### Cookie-Based Stickiness

**ALB-Generated Cookie**:
```
Cookie name: AWSALB
Duration: 1 second - 7 days

Flow:
1. Client → ALB (no cookie)
2. ALB routes to Target A
3. ALB → Client (Set-Cookie: AWSALB=target_A)
4. Client → ALB (Cookie: AWSALB=target_A)
5. ALB routes to Target A (same target)
```

**Application Cookie**:
```
Cookie name: Custom (e.g., JSESSIONID)
Duration: Application-defined

Flow:
1. Application sets cookie
2. ALB reads cookie
3. ALB routes to same target
```

### Configuration

```bash
# Enable stickiness
aws elbv2 modify-target-group-attributes \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --attributes \
    Key=stickiness.enabled,Value=true \
    Key=stickiness.type,Value=lb_cookie \
    Key=stickiness.lb_cookie.duration_seconds,Value=86400
```

### Use Cases

**When to Use Stickiness**:
```
✅ Session data stored locally (in-memory)
✅ WebSocket connections
✅ Legacy applications (not designed for distributed)

Example: Shopping cart in memory
- User adds item → Stored in server memory
- Next request → Must go to same server
```

**When NOT to Use**:
```
❌ Stateless applications (session in database/cache)
❌ High availability (target failure loses sessions)

Better: Store session in Redis/DynamoDB
- User adds item → Save to Redis
- Next request → Any server can serve (read from Redis)
```

---

## Cross-Zone Load Balancing

### Without Cross-Zone

```
AZ-1a: ALB → 2 instances
AZ-1b: ALB → 8 instances

Traffic distribution:
AZ-1a: 50% traffic / 2 instances = 25% per instance
AZ-1b: 50% traffic / 8 instances = 6.25% per instance

Problem: Uneven load
```

### With Cross-Zone

```
AZ-1a: 2 instances
AZ-1b: 8 instances

Traffic distribution:
Total instances: 10
Each instance: 10% traffic (even distribution)

Benefit: Balanced load across all instances
```

### Configuration

**ALB**: Cross-zone enabled by default (free).
**NLB**: Cross-zone disabled by default (charged).

```bash
# Enable for NLB
aws elbv2 modify-load-balancer-attributes \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --attributes Key=load_balancing.cross_zone.enabled,Value=true
```

**Cost**:
```
NLB Cross-Zone: $0.01/GB data transferred between AZs

Example:
100 GB/month → $1/month

When to enable: Uneven instance distribution across AZs
When to disable: Cost-sensitive, even distribution
```

---

## Nginx Simulation

### Simulating ALB with Nginx

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  # Load balancer (ALB simulation)
  nginx:
    image: nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api1
      - api2
      - web1
      - web2

  # API servers
  api1:
    image: python:3.9-slim
    command: python -m http.server 8000
    volumes:
      - ./api:/app
    working_dir: /app

  api2:
    image: python:3.9-slim
    command: python -m http.server 8000
    volumes:
      - ./api:/app
    working_dir: /app

  # Web servers
  web1:
    image: nginx:alpine
    volumes:
      - ./web:/usr/share/nginx/html

  web2:
    image: nginx:alpine
    volumes:
      - ./web:/usr/share/nginx/html
```

**nginx.conf** (Path-Based Routing):
```nginx
events {}

http {
    # Upstream for API servers
    upstream api_backend {
        server api1:8000 weight=1;
        server api2:8000 weight=1;
        
        # Health check (nginx plus)
        # health_check interval=10s fails=3 passes=2;
    }

    # Upstream for Web servers
    upstream web_backend {
        server web1:80 weight=1;
        server web2:80 weight=1;
    }

    server {
        listen 80;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Path-based routing: /api/* → API servers
        location /api/ {
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            
            # Sticky sessions
            # ip_hash;
        }

        # Default: /* → Web servers
        location / {
            proxy_pass http://web_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # Access logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}
```

### Load Balancing Algorithms

**Round Robin** (default):
```nginx
upstream backend {
    server web1:80;
    server web2:80;
}

# Request 1 → web1
# Request 2 → web2
# Request 3 → web1
```

**Least Connections**:
```nginx
upstream backend {
    least_conn;
    server web1:80;
    server web2:80;
}

# Route to server with fewest active connections
```

**IP Hash** (sticky sessions):
```nginx
upstream backend {
    ip_hash;
    server web1:80;
    server web2:80;
}

# Same client IP → same server
```

**Weighted**:
```nginx
upstream backend {
    server web1:80 weight=3;
    server web2:80 weight=1;
}

# web1 gets 75% traffic, web2 gets 25%
```

### Testing

```bash
# Start services
docker-compose up -d

# Test path routing
curl http://localhost/          # → Web backend
curl http://localhost/api/      # → API backend

# Test load balancing (10 requests)
for i in {1..10}; do curl http://localhost/; done

# Check logs
docker-compose logs nginx
```

---

## Interview Questions

### Conceptual

**Q: ALB vs NLB - when to use each?**
```
Application Load Balancer (ALB):
✅ HTTP/HTTPS applications
✅ Path/host-based routing
✅ Microservices
✅ WebSocket
✅ Authentication (Cognito, OIDC)
❌ Not for extreme performance (<100K req/sec)

Use cases:
- Web applications
- REST APIs
- Microservices architectures

Network Load Balancer (NLB):
✅ TCP/UDP applications
✅ Extreme performance (millions req/sec)
✅ Static IP required
✅ Ultra-low latency
✅ Non-HTTP protocols
❌ No Layer 7 features

Use cases:
- Gaming servers
- IoT applications
- Real-time bidding
- Legacy protocols (SMTP, FTP)
- IP whitelisting requirements
```

**Q: How does sticky sessions work? When to avoid?**
```
How it works:
1. ALB generates cookie (AWSALB=<target_id>)
2. Client includes cookie in subsequent requests
3. ALB routes to same target

Problems:
❌ Uneven load distribution
   - User A (heavy) → Server 1 (overloaded)
   - User B (light) → Server 2 (idle)

❌ Loss of sessions on target failure
   - Server 1 crashes → All sessions lost

❌ Scaling limitations
   - Can't remove servers (users still connected)

Better approach:
✅ Store sessions in Redis/DynamoDB
✅ Stateless application design
✅ JWT tokens (no server-side session)

When to use stickiness:
- Legacy applications (can't change code)
- WebSocket connections
- Short-term workarounds
```

**Q: Cross-zone load balancing - cost vs benefit?**
```
Without cross-zone:
AZ-1a: 10 instances
AZ-1b: 2 instances

Traffic: 50% to each AZ
AZ-1a: 50% / 10 = 5% per instance
AZ-1b: 50% / 2 = 25% per instance (5x more load!)

With cross-zone:
Traffic distributed evenly: 100% / 12 = 8.33% per instance

Cost (NLB only):
$0.01/GB for cross-AZ data transfer

Example: 1 TB/month cross-zone = $10/month

Decision:
Enable if: Uneven instance distribution
Disable if: Even distribution + cost-sensitive

ALB: Always enabled (free)
NLB: Disabled by default (enable for uneven distribution)
```

### Design

**Q: Design load balancer architecture for microservices (10 services)**
```
Requirements:
- 10 microservices
- Independent scaling
- Service discovery
- Blue/green deployments

Architecture:

1. Public ALB (Internet-facing):
   Listener: HTTPS (443)
   Rules:
     - api.example.com/users/* → user-service-tg
     - api.example.com/orders/* → order-service-tg
     - api.example.com/products/* → product-service-tg
     - ...10 services

2. Target Groups (one per service):
   user-service-tg:
     - Targets: user-service ASG (2-10 instances)
     - Health Check: /health
     - Deregistration Delay: 30s (fast deployment)

3. Service Discovery (AWS Cloud Map):
   Internal DNS:
   - user-service.local → NLB → user-service instances
   - order-service.local → NLB → order-service instances

4. Internal NLB (for service-to-service):
   order-service calls user-service:
   → NLB (user-service.local) → user-service instances
   
   Why NLB internally:
   - Lower cost than ALB
   - Service mesh support
   - Static IP for security groups

5. Blue/Green Deployment:
   - Create new Target Group (green)
   - Deploy new version to green ASG
   - Update ALB rule: 10% traffic → green (canary)
   - Monitor metrics
   - Increase to 100% or rollback

Cost Optimization:
- 1 Public ALB (all services share) = $16/month
- 10 Internal NLBs = 10 × $16 = $160/month
- vs 10 ALBs = 10 × $16 = $160/month (same cost, but NLB is faster)

Alternative: Service Mesh (AWS App Mesh)
- ALB → Envoy proxy → Services
- Dynamic routing, retries, circuit breakers
```

**Q: Handle 1M requests/second with minimal cost**
```
Requirements:
- 1M req/sec
- Low latency
- High availability

Design:

1. NLB (not ALB):
   Why NLB:
   - Millions req/sec capacity
   - <100 μs latency
   - Lower LCU cost

2. Multi-AZ:
   3 AZs × NLB (1 per AZ)
   Each NLB: ~333K req/sec

3. Target Instances:
   Assume: Each instance handles 5K req/sec
   Required: 1M / 5K = 200 instances

   Distribution:
   AZ-1a: 67 instances
   AZ-1b: 67 instances
   AZ-1c: 66 instances

4. Instance Type:
   c5.xlarge (high CPU, low cost)
   - 4 vCPUs
   - 8 GB RAM
   - $0.17/hour

5. Auto Scaling:
   Target Tracking: NetworkIn = 50 MB/sec per instance
   Min: 100 instances (baseline)
   Max: 300 instances (peak)

6. Cost Calculation:
   NLB: $16/month
   NLCU: 1M req/sec / 800 = 1,250 NLCU
   NLCU cost: 1,250 × $0.006 × 730 = $5,475/month
   
   Instances: 200 × c5.xlarge × $0.17 × 730 = $24,820/month
   
   Total: ~$30,300/month

7. Cost Optimization:
   - Use Spot Instances (80% of capacity): Save ~$20K
   - Reserved Instances (1-year): Save ~$10K
   - Optimized Total: ~$15K/month

8. Caching:
   - CloudFront CDN (80% cache hit ratio)
   - Backend requests: 200K/sec (instead of 1M)
   - Instances: 40 (instead of 200)
   - Cost: ~$3K/month (+ CloudFront $500/month)
```

---

This comprehensive Load Balancers guide covers ALB, NLB, GWLB with routing strategies, health checks, sticky sessions, and production architectures! ⚖️

