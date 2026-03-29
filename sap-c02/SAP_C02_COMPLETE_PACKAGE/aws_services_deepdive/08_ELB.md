# ELB (Elastic Load Balancing) - Complete Deep Dive

## 1. What Problem Did It Solve?

**Before ELB (2009):**
- Single web server = single point of failure (server crashes → site down)
- Manual load distribution (DNS round-robin, hardware load balancers)
- Hardware load balancers ($10,000-100,000, complex configuration)
- Scaling = manually add servers to load balancer config
- No health checks (send traffic to dead servers)
- No SSL termination (each server needs certificates)

**Problem:** Load balancing is expensive, manual, single point of failure

**ELB Solution:**
- Automatic traffic distribution across instances
- Automatic health checks (stop sending to failed instances)
- Automatic scaling (ELB itself scales with traffic)
- SSL termination (manage certificates in one place)
- Integrated with Auto Scaling
- Multi-AZ high availability

**Impact:** Made high-availability accessible, reduced costs by 80%

---

## 2. What Was There Before This Service?

**Load Balancing Evolution:**

**1990s-2000s: Hardware Load Balancers**
- F5 Networks, Citrix NetScaler
- Expensive ($50,000+)
- Complex configuration
- Single point of failure (need two for HA)
- Physical devices in data center

**2000s: Software Load Balancers**
- HAProxy, Nginx on servers
- Cheaper but still manual management
- Need redundancy configuration

**2009: Classic Load Balancer (ELB) Launches**
- First managed load balancer
- Layer 4 (TCP) and Layer 7 (HTTP)
- Revolutionary: Fully managed, auto-scaling

**2016: Application Load Balancer (ALB)**
- Layer 7 only (HTTP/HTTPS)
- Advanced routing (path-based, host-based)
- WebSocket, HTTP/2 support
- Replaced CLB for most use cases

**2017: Network Load Balancer (NLB)**
- Layer 4 (TCP/UDP)
- Ultra-high performance (millions req/sec)
- Static IP support

**2020: Gateway Load Balancer (GLB)**
- Layer 3 (Network layer)
- For third-party virtual appliances

---

## 3. When to Use It

### **Application Load Balancer (ALB) - Use When:**

✅ **HTTP/HTTPS applications**
- Web applications
- REST APIs
- Microservices

✅ **Need advanced routing**
- Path-based: `/api/*` → Backend, `/images/*` → Cache
- Host-based: `api.example.com` → API servers, `www.example.com` → Web servers
- Header-based, query string routing

✅ **Microservices/containers**
- Multiple services on same domain
- Dynamic port mapping (ECS containers)
- IP-based targets (containers)

✅ **Need authentication**
- Built-in: Cognito, OIDC, SAML
- Offload auth from application

✅ **Lambda targets**
- HTTP request → Lambda function
- Serverless backend

✅ **WebSocket support**
- Real-time applications
- Chat, gaming, live updates

### **Network Load Balancer (NLB) - Use When:**

✅ **Extreme performance needed**
- Millions of requests/second
- Ultra-low latency (microseconds)
- High throughput

✅ **TCP/UDP protocols (non-HTTP)**
- Gaming servers (UDP)
- IoT (TCP/UDP)
- Custom protocols

✅ **Static IP required**
- Whitelisting (client requires fixed IPs)
- On-premises firewall rules
- One Elastic IP per AZ

✅ **Preserve source IP**
- Need client IP address
- Logging, geolocation, IP-based routing

✅ **PrivateLink**
- Expose service to other VPCs
- Service provider pattern

### **Gateway Load Balancer (GLB) - Use When:**

✅ **Third-party virtual appliances**
- Firewalls (Palo Alto, Check Point)
- IDS/IPS (intrusion detection)
- Deep packet inspection

❌ **Rare use case** - Most apps use ALB or NLB

### **Classic Load Balancer (CLB) - DON'T USE**

❌ **Legacy** - Deprecated
- Use ALB or NLB instead
- Only in exam as "wrong answer"
- Existing apps: Migrate to ALB/NLB

---

## 4. How Is It Different from Similar Services?

### **ALB vs NLB - The Critical Difference**

| Feature | ALB | NLB |
|---------|-----|-----|
| **OSI Layer** | Layer 7 (Application) | Layer 4 (Transport) |
| **Protocols** | HTTP, HTTPS, HTTP/2 | TCP, UDP, TLS |
| **Performance** | ~100K req/sec | Millions req/sec |
| **Latency** | Milliseconds | Microseconds |
| **Routing** | Path, host, header, query | IP:port only |
| **Targets** | EC2, IP, Lambda, Containers | EC2, IP, ALB |
| **Static IP** | No (DNS only) | Yes (Elastic IP) |
| **Preserve source IP** | X-Forwarded-For header | Yes (native) |
| **SSL termination** | Yes (manages certificates) | Yes (or passthrough) |
| **WebSocket** | Yes | Yes |
| **Use case** | Web apps, APIs, microservices | Gaming, IoT, extreme performance |
| **Cost** | ~$22/month + LCU | ~$22/month + LCU |

**Decision rule:**
- HTTP/HTTPS → ALB
- TCP/UDP or extreme performance → NLB

---

### **ALB vs API Gateway**

| Feature | ALB | API Gateway |
|---------|-----|-------------|
| **Purpose** | Load balance HTTP | Create/manage APIs |
| **Targets** | EC2, containers, Lambda | Lambda, HTTP, AWS services |
| **Features** | Routing, health checks | Throttling, caching, auth, stages |
| **Cost** | $22/month + usage | $3.50 per million requests |
| **Use case** | Distribute to multiple instances | API management, serverless |

**Pattern:** API Gateway → ALB → EC2 (possible but redundant)  
**Better:** API Gateway → Lambda OR ALB → EC2

---

### **ELB vs CloudFront**

| Feature | ELB | CloudFront |
|---------|-----|------------|
| **Purpose** | Load balance | Cache content globally |
| **Scope** | Regional | Global (edge locations) |
| **Caching** | No | Yes |
| **Use together** | CloudFront → ALB (common pattern) | |

---

## 5. Underlying Mechanism and How It's Made

### **How ALB Works Internally:**

**Request Flow:**
```
1. Client request arrives:
   GET https://example.com/api/users
   
2. DNS resolution:
   example.com → ALB DNS: my-alb-123456.us-east-1.elb.amazonaws.com
   → Resolves to multiple IPs (ALB nodes in each AZ)
   
3. Client connects to ALB node (in nearest AZ):
   - TLS handshake (if HTTPS)
   - ALB terminates SSL (decrypts)
   
4. ALB evaluates listener rules (in order):
   Rule 1: Path=/api/* → Target Group A
   Rule 2: Path=/images/* → Target Group B
   Default: → Target Group C
   
   Match: /api/users → Target Group A
   
5. ALB selects target (round-robin algorithm):
   - Target Group A has 3 healthy instances
   - Last request went to instance 1
   - This request → instance 2
   
6. ALB opens connection to instance 2:
   - HTTP request (plain or re-encrypted)
   - Adds headers: X-Forwarded-For (client IP), X-Forwarded-Proto (https)
   
7. Instance 2 processes and responds
   
8. ALB receives response:
   - Forwards to client
   - (Re-encrypts if HTTPS)
   
9. Connection handling:
   - Keep-alive: Reuse connection for next request
   - Idle timeout: Close after 60 seconds (configurable)
```

---

### **How NLB Works Internally:**

**Request Flow:**
```
1. Client connects (TCP):
   IP: 203.0.113.5:45678 → NLB: 54.x.x.x:80
   
2. NLB receives packet (Layer 4):
   - No TLS termination at NLB (passthrough possible)
   - No HTTP inspection (just TCP/UDP)
   
3. NLB selects target:
   - Flow hash algorithm (source IP, dest IP, source port, dest port, protocol)
   - Same 5-tuple → Same target (session affinity)
   
4. NLB forwards packet to target:
   - Preserves source IP (203.0.113.5 visible to target!)
   - No proxy (direct connection)
   
5. Target processes:
   - Sees real client IP (no X-Forwarded-For needed)
   - Responds directly to client
   
6. Return path:
   - Traffic might not go through NLB (Direct Server Return)
   - Or returns via NLB

Much faster than ALB (no HTTP parsing, no SSL termination overhead)
```

---

### **Health Check Mechanism:**

```
ALB Health Check:
  Every X seconds (default 30, range 5-300):
    1. HTTP GET to /health
    2. Expect: Status 200 OK
    3. Timeout: 5 seconds (configurable 2-120)
    4. Success: Increment success counter
    5. Failure: Increment failure counter
    
  Healthy threshold: 5 consecutive successes (default)
  Unhealthy threshold: 2 consecutive failures (default)
  
  Status transitions:
    Initial → (5 successes) → Healthy
    Healthy → (2 failures) → Unhealthy
    Unhealthy → (5 successes) → Healthy
    
  Unhealthy targets:
    - Stop receiving new connections
    - Existing connections allowed to complete (draining)
    - Auto Scaling replaces (if configured)

NLB Health Check:
  TCP connection attempt:
    - Try to connect to port
    - Success = healthy
    - Failure/timeout = unhealthy
    
  Or HTTP/HTTPS check (same as ALB)
```

---

### **Connection Draining (Deregistration Delay):**

```
Instance being removed from target group:

Without draining:
  - New requests: Stop immediately
  - In-flight requests: ABRUPTLY CLOSED ❌
  - User experience: Errors, failed requests

With draining (default 300 seconds):
  1. Mark instance "draining"
  2. Stop sending NEW requests
  3. Wait for in-flight requests to complete (up to 300 sec)
  4. After timeout or all requests done: Deregister
  
Benefit: Graceful shutdown, no user impact
```

---

## 6. Cost

### **Pricing (All Types Similar):**

**ALB:**
```
Fixed: $0.0225/hour = $16.43/month
Variable: $0.008 per LCU (Load Balancer Capacity Unit)

LCU dimensions (billed on highest):
- New connections: 25 per second
- Active connections: 3,000 per minute
- Bandwidth: 1 GB per hour  
- Rule evaluations: 1,000 per second

Example:
1,000 req/sec, 100 KB avg response, 10 rules = 40 LCU/hour
Monthly: 40 × 730 × $0.008 = $233.60
Total: $16.43 + $233.60 = $250/month
```

**NLB:**
```
Fixed: $0.0225/hour = $16.43/month
Variable: $0.006 per NLCU

NLCU dimensions:
- New connections: 800 per second
- Active connections: 100,000 per minute
- Bandwidth: 1 GB per hour

Generally cheaper per LCU than ALB
```

**Gateway LB:**
```
Fixed: $0.0125/hour = $9.13/month
Variable: $0.004 per GLCU
```

---

### **Cost Optimization:**

**Share ALB across multiple services:**
```
One ALB with multiple rules:
/api/service-a → Target Group A
/api/service-b → Target Group B
/api/service-c → Target Group C

Cost: 1 ALB ($250/month)

vs

Three separate ALBs:
Cost: 3 × $250 = $750/month

Savings: $500/month!

Trade-off: All services share same ALB (less isolation)
```

**Use NLB for high-throughput TCP:**
```
Scenario: 10M req/sec TCP traffic

ALB: Would cost $10,000+/month (LCU charges)
NLB: ~$500/month (more efficient for TCP)
```

---

## 7. Pros and Cons

### **ALB Pros ✅**

1. **Advanced routing**
   - Path, host, header, query string
   - Multiple services on one ALB
   - Microservices-friendly

2. **Authentication**
   - Cognito, OIDC, SAML built-in
   - Offload auth from application

3. **Lambda targets**
   - Serverless backends
   - No EC2 needed

4. **HTTP/2**
   - Multiplexing
   - Better performance for modern apps

5. **WebSocket**
   - Real-time bidirectional
   - Sticky connections

6. **WAF integration**
   - DDoS protection
   - SQL injection prevention
   - Rate limiting

### **ALB Cons ❌**

1. **Not for non-HTTP**
   - TCP/UDP → Must use NLB
   - Custom protocols → NLB

2. **No static IP**
   - DNS name only
   - Can't whitelist in firewalls easily
   - Solution: Use NLB if need static IP

3. **Latency overhead**
   - Layer 7 processing adds milliseconds
   - Not suitable for ultra-low latency

4. **Cost**
   - More expensive than NLB per request
   - LCU charges can add up

---

### **NLB Pros ✅**

1. **Extreme performance**
   - Millions of requests/second
   - Microsecond latency
   - Near-bare-metal

2. **Static IP (Elastic IP)**
   - One per AZ
   - Firewall whitelisting easy
   - Fixed endpoint

3. **Preserve source IP**
   - Targets see real client IP
   - No X-Forwarded-For needed

4. **TLS passthrough**
   - End-to-end encryption
   - Don't terminate at LB (security)

5. **PrivateLink support**
   - Expose services privately
   - VPC endpoint services

### **NLB Cons ❌**

1. **No Layer 7 features**
   - No path-based routing
   - No authentication
   - No WAF integration

2. **Less flexible**
   - Can't inspect HTTP
   - Can't modify headers
   - Binary routing only

3. **Manual failover handling**
   - Application must handle connection failures
   - No sticky sessions (flow hash only)

---

## 8. SAP-C02 Questions Related to This

### **Question Type 1: ALB vs NLB Selection**

**Scenario 1:**
```
Web application serving HTTP/HTTPS traffic, need path-based routing (/api → backend)

Answer: Application Load Balancer
Why:
- HTTP protocol ✅
- Path-based routing needed ✅
- Standard latency acceptable ✅
```

**Scenario 2:**
```
Gaming server using UDP, needs static IP for client configuration, 500K concurrent connections

Answer: Network Load Balancer
Why:
- UDP protocol (ALB doesn't support) ✅
- Static IP required (Elastic IP) ✅
- High connection count (NLB optimized) ✅
```

**Scenario 3:**
```
gRPC microservices (HTTP/2), need path-based routing

Answer: Application Load Balancer
Why:
- HTTP/2 support ✅
- Path-based routing ✅
- Microservices pattern ✅
```

---

### **Question Type 2: High Availability**

```
Scenario: Ensure load balancer is highly available

Answer: Deploy in multiple AZs
- ALB: Select 2+ subnets in different AZs
- NLB: Select 2+ subnets in different AZs
- AWS creates LB nodes in each AZ
- If one AZ fails, other AZs continue

Configuration:
Subnets: [subnet-1a, subnet-1b, subnet-1c]
→ LB nodes created in all 3 AZs automatically

Don't:
❌ Single AZ (single point of failure)
```

---

### **Question Type 3: SSL/TLS Termination**

```
Scenario: Need to offload SSL processing from web servers

Answer: Configure SSL certificate on ALB
- Upload certificate to ACM (AWS Certificate Manager)
- Attach to ALB listener (HTTPS:443)
- ALB handles SSL handshake
- Forwards HTTP to instances (or re-encrypts)

Benefits:
- Web servers don't process SSL (CPU savings)
- Centralized certificate management
- Easy renewal (ACM auto-renews)

End-to-end encryption option:
Client → (HTTPS) → ALB → (HTTPS) → Instance
ALB re-encrypts to backend
```

---

### **Question Type 4: Sticky Sessions**

```
Scenario: Shopping cart stored in server memory, users must hit same server

Answer: Enable sticky sessions (session affinity)
- ALB: Application-based cookie (AWSALB cookie)
- Duration: 1 second to 7 days
- Client gets cookie
- Subsequent requests with cookie → Same target

Problem with this approach:
- Uneven load distribution
- Can't scale down easily (active sessions)

Better solution:
- Store session in ElastiCache/DynamoDB
- Any server can serve request
- True stateless (easier scaling)

Exam: Recommend external session storage > sticky sessions
```

---

### **Question Type 5: Cross-Zone Load Balancing**

```
Scenario: 2 instances in AZ-a, 8 instances in AZ-b, traffic uneven

Cross-Zone OFF (ALB default=ON, NLB default=OFF):
AZ-a gets 50% of traffic → 2 instances handle 50% (overloaded!)
AZ-b gets 50% of traffic → 8 instances handle 50% (underutilized)

Cross-Zone ON:
Traffic distributed evenly across ALL 10 instances
Each instance gets 10% regardless of AZ

ALB: Cross-zone always ON (can't disable, no extra cost)
NLB: Cross-zone OFF by default (enable = data transfer charges between AZs)

Exam: Know defaults! ALB=ON, NLB=OFF
```

---

### **Question Type 6: Integration with Auto Scaling**

```
Scenario: Auto Scaling adds instances, how do they receive traffic?

Answer: Auto Scaling automatically registers with ALB
- Auto Scaling Group configured with target group
- New instance launches
- Auto Scaling registers with target group
- Health check passes (300 sec default)
- Starts receiving traffic

Deregistration:
- Auto Scaling terminates instance
- Deregisters from target group
- Connection draining period (300 sec default)
- Waits for in-flight requests
- Terminates instance

Fully automated!
```

---

### **Question Type 7: Slow Start Mode**

```
Scenario: New instances join, immediately get full traffic, struggle (warming up)

Answer: Enable slow start mode on target group
- Duration: 30-900 seconds
- New instance gets gradually increasing traffic
  - 0-30 sec: 10% of traffic
  - 30-60 sec: 20% of traffic
  - ...
  - After 300 sec: 100% of traffic

Use cases:
- Application needs warm-up time
- Caches need to populate
- JVM needs to JIT compile

Configuration: Target group → Attributes → Slow start
```

---

## 9. Configurations

### **1. Create ALB**

```
Step 1: Basic Configuration
- Name: my-application-lb
- Scheme: internet-facing (public) or internal (private VPC only)
- IP address type: IPv4 or Dualstack (IPv4 + IPv6)

Step 2: Network Mapping
- VPC: vpc-123
- Availability Zones: (select 2+ AZs)
  - us-east-1a: subnet-public-1a
  - us-east-1b: subnet-public-1b
  - us-east-1c: subnet-public-1c
  
  AWS creates ALB nodes in each AZ

Step 3: Security Group
- Inbound: HTTPS (443) from 0.0.0.0/0 (internet)
- Inbound: HTTP (80) from 0.0.0.0/0 (redirect to HTTPS)
- Outbound: All (to targets)

Step 4: Listeners
- HTTP:80 → Redirect to HTTPS:443
- HTTPS:443 → Forward to target group

Step 5: SSL Certificate (for HTTPS)
- From ACM: certificate-123
- Or upload certificate

Result: ALB DNS name (my-application-lb-123456.us-east-1.elb.amazonaws.com)
```

---

### **2. Target Group Configuration**

```
Target type:
- Instances (EC2 instance IDs)
- IP addresses (for containers, on-prem)
- Lambda (serverless)

Protocol: HTTP, HTTPS
Port: 80

Health check:
- Protocol: HTTP
- Path: /health
- Success codes: 200
- Interval: 30 seconds
- Timeout: 5 seconds
- Healthy threshold: 5
- Unhealthy threshold: 2

Attributes:
- Deregistration delay: 300 seconds
- Slow start: 0 seconds (disabled) or 30-900
- Stickiness: Disabled or Application-based
- Load balancing algorithm: Round robin or Least outstanding requests
```

---

### **3. Listener Rules (ALB)**

```
Default action: Forward to default-target-group

Add rules (evaluated in priority order):

Rule 1 (Priority 1):
IF path is /api/*
THEN forward to api-target-group

Rule 2 (Priority 2):
IF path is /images/*
THEN forward to image-cache-target-group

Rule 3 (Priority 3):
IF host header is admin.example.com
THEN forward to admin-target-group

Rule 4 (Priority 4):
IF source IP is 203.0.113.0/24
THEN return fixed response (403 Forbidden)  // Block IP range

Rule 5 (Priority 5 - Default):
Forward to default-target-group

Conditions (can combine):
- Host header
- Path pattern
- HTTP header
- HTTP method (GET, POST, etc.)
- Query string
- Source IP

Actions:
- Forward to target group
- Redirect (HTTP → HTTPS)
- Return fixed response (error page)
- Authenticate (Cognito, OIDC)
```

---

### **4. SSL/TLS Configuration**

**SSL Certificate:**
```
Managed by ACM (AWS Certificate Manager):
- Request certificate for example.com
- Validate domain (DNS or email)
- Auto-renewal (no expiration issues!)

Attach to ALB:
- HTTPS:443 listener
- Select certificate
- Can have multiple certificates (SNI)

SNI (Server Name Indication):
- One ALB serves multiple domains
- example.com → cert-1
- api.example.com → cert-2
- Client sends hostname in TLS handshake
- ALB selects correct certificate
```

**Security Policy:**
```
SSL/TLS versions:
- TLS 1.0 (deprecated, insecure)
- TLS 1.1 (deprecated)
- TLS 1.2 (minimum recommended)
- TLS 1.3 (latest, fastest)

Cipher suites:
- Strong ciphers only
- Disable weak/deprecated

ALB Policy: ELBSecurityPolicy-TLS-1-2-2017-01 (common)
Or: ELBSecurityPolicy-TLS-1-3-2021-06 (TLS 1.3 only)
```

---

### **5. Connection Settings**

**ALB:**
```
Idle timeout: 60 seconds (default, 1-4000 range)
- If no data for 60 sec → Close connection
- Increase for: Long-polling, streaming responses

HTTP/2: Enabled by default
- Multiplexing (multiple requests per connection)
- Better performance

WebSocket: Supported
- Upgrade from HTTP
- Persistent bidirectional connection
- Idle timeout applies
```

**NLB:**
```
Idle timeout: 350 seconds (TCP)
- Can't be configured (fixed)

TLS listener:
- Can terminate TLS at NLB
- Or passthrough to targets (end-to-end encryption)
```

---

### **6. Access Logs**

```
Enable ALB access logs:
- Destination: S3 bucket
- Interval: 5 or 60 minutes
- Format: Space-delimited

Log entry contains:
- Timestamp
- Client:port
- Target:port
- Request processing time
- Target processing time
- Response processing time
- HTTP status code
- User agent
- SSL cipher
- SSL protocol

Use for:
- Traffic analysis
- Debugging errors
- Security audit (who accessed what)
- Performance analysis

Cost: S3 storage only (~$0.023/GB/month)
Free: ALB doesn't charge for logging
```

---

### **7. Monitoring (CloudWatch Metrics)**

**ALB Metrics:**
```
Request metrics:
- RequestCount (total requests)
- HTTPCode_Target_2XX_Count (successful)
- HTTPCode_Target_4XX_Count (client errors)
- HTTPCode_Target_5XX_Count (server errors)
- HTTPCode_ELB_5XX_Count (ALB errors)

Connection metrics:
- ActiveConnectionCount
- NewConnectionCount
- RejectedConnectionCount

Latency metrics:
- TargetResponseTime (how long targets take)

Health metrics:
- HealthyHostCount
- UnHealthyHostCount

Use for:
- Alarms (unhealthy hosts → alert)
- Auto Scaling triggers
- Performance monitoring
```

---

## 10. Anything Else You Need to Know

### **Target Group Algorithms**

**Round Robin (Default):**
```
Requests distributed evenly:
Request 1 → Target A
Request 2 → Target B
Request 3 → Target C
Request 4 → Target A (cycles)

Simple, predictable
```

**Least Outstanding Requests:**
```
Route to target with fewest pending requests

Example:
Target A: 5 pending requests
Target B: 2 pending requests
Target C: 8 pending requests

Next request → Target B (least busy)

Use when: Requests have variable processing time
```

---

### **Desync Mitigation Mode**

```
HTTP desync attacks:
- Malicious requests with ambiguous headers
- ALB and backend interpret differently
- Can cause request smuggling

Modes:
- Monitor: Log but allow (default)
- Defensive: Drop invalid requests
- Strictest: Strictest validation

Recommendation: Defensive or Strictest for security
```

---

### **ALB with Lambda Targets**

```
Configuration:
Target group type: Lambda
Target: Lambda function ARN

Request transformation:
HTTP Request:
GET /users?id=123
Headers: Host, User-Agent, etc.

Lambda receives:
{
  "requestContext": {...},
  "httpMethod": "GET",
  "path": "/users",
  "queryStringParameters": {"id": "123"},
  "headers": {...},
  "body": null
}

Lambda returns:
{
  "statusCode": 200,
  "headers": {"Content-Type": "application/json"},
  "body": "{\"users\": [...]}"
}

ALB converts to HTTP response

Benefits:
- Serverless (no EC2)
- Auto-scaling (Lambda handles)
- Pay per request

Limitations:
- 15-minute Lambda timeout
- Payload limit: 6 MB
```

---

### **NLB with PrivateLink**

```
Use case: Expose service to other AWS accounts/VPCs

Setup:
1. Create NLB (internal, in your VPC)
2. Create VPC Endpoint Service (points to NLB)
3. Other accounts create VPC Endpoint (connects to your service)
4. Traffic stays private (AWS backbone)

Example:
Company A (SaaS provider):
  - NLB in vpc-A
  - VPC Endpoint Service: com.amazonaws.vpce.us-east-1.vpce-svc-123

Company B (customer):
  - VPC Endpoint in vpc-B
  - Connects to vpce-svc-123
  - Access Company A's service privately

No internet, no VPC peering needed!
```

---

### **Connection Draining Deep-Dive**

```
Deregistration delay: 300 seconds (default, 0-3600 range)

Timeline when removing instance:

t=0: Instance marked for deregistration
  - Stop sending NEW requests
  - Existing connections remain open

t=0 to t=300: Draining period
  - In-flight requests continue processing
  - New requests go to other targets
  - Instance can still respond

t=300: Timeout or all requests completed
  - Force-close any remaining connections
  - Instance fully deregistered
  - Auto Scaling can terminate

Optimization:
- Short-lived requests (API): 30-60 seconds
- Long-lived (WebSocket, streaming): 900 seconds
```

---

### **Load Balancer Security**

**ALB Security Group:**
```
Inbound:
- Port 80 from 0.0.0.0/0 (HTTP from internet)
- Port 443 from 0.0.0.0/0 (HTTPS from internet)

Outbound:
- Port 80 to target-sg (forward HTTP to instances)
- Port 443 to target-sg (or whatever port backends use)
```

**Target Security Group:**
```
Inbound:
- Port 80 from alb-sg (only from ALB, not internet!)
- NOT from 0.0.0.0/0

This ensures:
- Internet can only reach instances through ALB
- Direct access to instances blocked
- ALB is security choke point
```

**NLB Considerations:**
```
NLB doesn't have security groups!
- Uses network ACLs
- Or target security groups (allow NLB's IP range)

Target security group:
- Allow from NLB private IP addresses
- Or from client IPs (if preserve source IP)
```

---

### **Common Mistakes**

❌ **Single AZ deployment**
```
Problem: AZ fails → ALB down
Solution: Always use 2+ AZs
```

❌ **Wrong protocol type**
```
Problem: Using ALB for TCP/UDP non-HTTP
Solution: Use NLB for non-HTTP protocols
```

❌ **Unhealthy targets**
```
Problem: ALB shows all targets unhealthy
Debugging:
1. Check security group (ALB can reach targets?)
2. Check health check path (does /health exist?)
3. Check instance responding (SSH and curl /health)
4. Check timeout too short
5. Check healthy threshold too high
```

❌ **No connection draining**
```
Problem: Users see errors when instances terminate
Solution: Enable deregistration delay (300 sec)
```

❌ **Wrong target type for Lambda**
```
Problem: Trying to use instance target group for Lambda
Solution: Create Lambda target group
```

---

### **Best Practices**

✅ **Always Multi-AZ** (2+ AZs minimum, 3 recommended)  
✅ **Use HTTPS** with ACM certificates (free!)  
✅ **Enable access logs** (S3, for debugging)  
✅ **Configure health checks carefully** (realistic path, proper thresholds)  
✅ **Use connection draining** (300 sec minimum)  
✅ **Monitor CloudWatch metrics** (set alarms for unhealthy targets)  
✅ **Use security groups properly** (defense in depth)  
✅ **Enable deletion protection** (production LBs)  
✅ **Use latest security policy** (TLS 1.2+)  
✅ **Consider WAF** for web applications (DDoS, SQL injection)

---

### **ALB with WAF (Web Application Firewall)**

```
Attach WAF to ALB:
- Block SQL injection attempts
- Block XSS (cross-site scripting)
- Rate limiting (1,000 req/5min per IP)
- Geo-blocking (block specific countries)
- Custom rules

Example WAF rule:
Block requests with:
- Query string contains: ' OR 1=1-- (SQL injection)
- User-Agent contains: bot, scanner
- Rate > 2,000 requests in 5 minutes

Cost: $5/month + $1 per rule + $0.60 per million requests
```

---

### **Exam Traps**

**Trap 1: "ALB shows 5XX errors"**
```
503 errors:
- No healthy targets (all unhealthy)
- Target group empty
- Check health checks!

504 errors (Gateway Timeout):
- Target didn't respond in time
- Increase timeout or fix slow targets

502 errors (Bad Gateway):
- Target returned invalid response
- Check application logs
```

**Trap 2: "Need static IP for load balancer"**
```
Wrong: ALB (DNS only)
Right: NLB (Elastic IP)

Or: ALB behind Global Accelerator (static anycast IPs)
```

**Trap 3: "Multiple SSL certificates"**
```
Question: Host multiple domains on one ALB

Answer: SNI (Server Name Indication)
- Add multiple certificates
- ALB chooses based on hostname
- Supported on ALB and NLB
```

---

**END OF ELB DEEP DIVE**

**Completed: 8/30**

Continuing with remaining 22 services...

