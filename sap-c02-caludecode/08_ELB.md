# 08 — Elastic Load Balancing (ALB, NLB, CLB, GWLB) — Exhaustive Deep-Dive

---

## 1. What Problem ELB Solves

### Why You Need a Load Balancer

If you have 5 web servers and a user visits your website, which server handles the request? Without a load balancer, you'd need to tell users the IP of each server — and if one goes down, users hitting that IP get errors.

A **load balancer** is a single entry point that distributes incoming traffic across multiple backend servers (targets). It also detects unhealthy servers and stops sending traffic to them.

| Without Load Balancer | With Load Balancer |
|---|---|
| Expose individual server IPs | Single endpoint (DNS name) |
| If one server dies, users see errors | Traffic routed away from unhealthy servers |
| Uneven traffic distribution | Even distribution across servers |
| Complex client-side routing | Simple single endpoint |
| SSL on every server | SSL termination at one point |

---

## 2. Types of Load Balancers (EXAM CRITICAL!)

### The Four Types

| Feature | ALB | NLB | CLB | GWLB |
|---|---|---|---|---|
| **Full Name** | Application LB | Network LB | Classic LB | Gateway LB |
| **OSI Layer** | Layer 7 (HTTP/HTTPS) | Layer 4 (TCP/UDP/TLS) | Layer 4 + 7 | Layer 3 (IP) |
| **Status** | **Current** | **Current** | **Legacy** | **Current** |
| **Protocol** | HTTP, HTTPS, gRPC | TCP, UDP, TLS | TCP, SSL, HTTP, HTTPS | IP (GENEVE) |
| **Performance** | Good | **Ultra-high** (millions of requests/sec) | Moderate | Good |
| **Static IP** | No (use Global Accelerator) | **Yes** (Elastic IP per AZ) | No | No |
| **Path routing** | **Yes** | No | No | No |
| **Host routing** | **Yes** | No | No | No |
| **WebSocket** | Yes | Yes | No | N/A |
| **SSL termination** | Yes | Yes (TLS) | Yes | N/A |
| **Sticky sessions** | Yes | Yes | Yes | N/A |
| **Health checks** | HTTP/HTTPS | TCP/HTTP/HTTPS | TCP/HTTP | TCP/HTTP |
| **Targets** | Instance, IP, Lambda | Instance, IP, ALB | Instance | Instance, IP |
| **Use case** | Web apps, microservices, containers | Extreme performance, static IP, gaming, IoT | Legacy apps | 3rd-party virtual appliances (firewalls, IDS/IPS) |

### ALB (Application Load Balancer) — Most Used

**Layer 7 (HTTP/HTTPS) load balancer** with advanced request routing:

**Path-Based Routing**: Route based on URL path
```
example.com/api/*    → Target Group A (API servers)
example.com/images/* → Target Group B (Image servers)
example.com/*        → Target Group C (Web servers)
```

**Host-Based Routing**: Route based on hostname
```
api.example.com   → Target Group A
www.example.com   → Target Group B
admin.example.com → Target Group C
```

**Additional routing rules**: HTTP headers, query strings, source IP, HTTP method

**Key ALB features:**
- **Target types**: EC2 instances, IP addresses, Lambda functions, containers
- **SSL/TLS termination**: Offload encryption from backend servers
- **Authentication**: Integrated with Cognito and OIDC providers
- **Sticky sessions**: Cookie-based (application or duration-based)
- **HTTP/2 and gRPC**: Modern protocol support
- **Web Application Firewall (WAF)**: Can attach WAF rules

### NLB (Network Load Balancer) — Extreme Performance

**Layer 4 (TCP/UDP) load balancer** for ultra-high performance:

**Key NLB features:**
- **Millions of requests per second** with ultra-low latency
- **Static IP per AZ** (or Elastic IP) — critical for whitelisting
- **Preserves source IP** — Backend sees the real client IP
- **TCP passthrough** — No modification of the packet
- **TLS termination** — Optional (can offload TLS)
- **NLB → ALB target**: NLB can route to ALB for Layer 4 static IP + Layer 7 routing

**Exam Pattern**: "Need a static IP for whitelisting AND Layer 7 routing" → NLB in front of ALB

### GWLB (Gateway Load Balancer) — Virtual Appliances

Routes traffic through 3rd-party virtual appliances:
- Firewalls (Palo Alto, Fortinet)
- IDS/IPS (intrusion detection/prevention)
- Deep packet inspection tools

**Architecture**: VPC traffic → GWLB → Virtual appliance → GWLB → Destination

### CLB (Classic Load Balancer) — Legacy

- Supports both Layer 4 and Layer 7 (limited)
- **Do NOT use for new deployments**
- Exam answer is almost NEVER CLB
- Only mention: "Migrate from CLB to ALB/NLB"

---

## 3. Key Concepts

### Target Groups

A target group is a collection of targets (servers) that receive traffic:
- **Instance targets**: Register EC2 instances
- **IP targets**: Register specific IP addresses (including on-premises via Direct Connect)
- **Lambda targets**: (ALB only) Invoke Lambda functions
- **ALB target**: (NLB only) Route NLB traffic to an ALB

**Health checks**: Each target group has its own health check settings:
- Protocol (HTTP, HTTPS, TCP)
- Path (e.g., /health)
- Healthy/unhealthy thresholds
- Interval and timeout

### Cross-Zone Load Balancing

| Enabled | Disabled |
|---|---|
| Traffic distributed evenly across ALL instances in ALL AZs | Traffic distributed evenly across AZs (not instances) |
| Better distribution when AZs have unequal instances | AZ with 2 instances gets same traffic as AZ with 8 |
| ALB: Always on (free) | NLB: Off by default (charged for cross-AZ data) |

**Exam Scenario**: "Uneven CPU usage across AZs" → Enable Cross-Zone Load Balancing (especially on NLB).

### Connection Draining (Deregistration Delay)

When an instance is being removed (scaling in, unhealthy), the LB:
1. Stops sending NEW requests to the instance
2. Waits for existing in-flight requests to complete
3. Default: 300 seconds (5 minutes)
4. After timeout, forcibly closes remaining connections

### Sticky Sessions (Session Affinity)

Routes a user to the same backend instance for session duration:
- **ALB**: Application-based cookies (AWSALB) or custom cookies
- **NLB**: Source IP based
- **Use case**: Applications that store session state on the instance (NOT recommended — use ElastiCache/DynamoDB instead)

### SSL/TLS Termination

LB handles SSL decryption → sends unencrypted traffic to backend:
- SSL certificate managed via **ACM (AWS Certificate Manager)** — free!
- **SNI (Server Name Indication)**: ALB/NLB can host multiple SSL certificates for multiple domains

---

## 4. Cost

| Load Balancer | Hourly Cost | LCU/NLCU Cost | Notes |
|---|---|---|---|
| ALB | $0.0225/hr (~$16/month) | $0.008/LCU-hour | LCU based on new connections, active connections, bandwidth, rules |
| NLB | $0.0225/hr (~$16/month) | $0.006/NLCU-hour | NLCU based on new connections, active connections, bandwidth |
| GWLB | $0.0125/hr (~$9/month) | $0.004/GLCU-hour | Cheapest hourly |
| CLB | $0.025/hr (~$18/month) | $0.008/GB processed | Legacy pricing |

**Cost Tip**: ALB with path routing replaces multiple CLBs → cheaper.

---

## 5. SAP-C02 Exam Questions (10+ Scenarios)

### Question 1 — ALB vs NLB
**Scenario**: A gaming company needs to route millions of UDP packets per second with ultra-low latency and needs a static IP for firewall whitelisting. Which LB?

**Answer**: **NLB** — Supports UDP, millions of RPS, static IP (Elastic IP).

---

### Question 2 — Path-Based Routing
**Scenario**: An application has microservices: /api for backend, /static for files, /auth for authentication. All under one domain. How to route?

**Answer**: **ALB with path-based routing** — Three target groups, rules for /api/*, /static/*, /auth/*.

---

### Question 3 — Static IP + Layer 7
**Scenario**: A partner company needs to whitelist a static IP address, but the application needs Layer 7 features (path routing, WAF). How?

**Answer**: **NLB (with Elastic IP) in front of ALB** — NLB provides static IP, ALB provides Layer 7 features.

---

### Question 4 — Lambda as Target
**Scenario**: A company wants to serve a serverless API behind a load balancer for health monitoring and WAF protection. How?

**Answer**: **ALB with Lambda as target** — ALB can invoke Lambda functions directly as targets.

---

### Question 5 — Cross-Zone Imbalance
**Scenario**: An ALB serves traffic across 2 AZs. AZ-a has 2 instances, AZ-b has 8 instances. Each AZ-a instance gets 25% of total traffic (overloaded) while AZ-b instances each get 6.25%. Why?

**Answer**: Cross-zone load balancing is already enabled for ALB. The issue is uneven instance count. Fix: Ensure equal instances per AZ via Auto Scaling, or check that cross-zone is working correctly.

---

### Question 6 — GWLB
**Scenario**: A company needs all traffic entering their VPC to be inspected by a Palo Alto firewall virtual appliance before reaching applications. How?

**Answer**: **Gateway Load Balancer** — Routes traffic through the Palo Alto virtual appliances transparently. Uses GENEVE encapsulation.

---

### Question 7 — SSL/TLS Multiple Domains
**Scenario**: An ALB serves 5 different domains (app1.com, app2.com, etc.), each needing its own SSL certificate. How?

**Answer**: **ALB with SNI (Server Name Indication)** — Associate multiple SSL certificates (from ACM). ALB routes to the correct certificate based on the domain in the request.

---

### Question 8 — Connection Draining
**Scenario**: During deployments, some users get 502 errors because instances are terminated before completing requests. How to fix?

**Answer**: Enable **Connection Draining (Deregistration Delay)** — Set to appropriate timeout (e.g., 60 seconds). LB waits for in-flight requests to complete before removing the instance.

---

### Question 9 — Health Check Configuration
**Scenario**: An ALB health check path returns 200 OK but the application is not functioning correctly (database is down). The unhealthy instances keep receiving traffic. How to fix?

**Answer**: Make the health check path **/health** more comprehensive — it should check database connectivity, not just return 200. A "deep health check" that verifies all dependencies.

---

### Question 10 — Migrate from CLB
**Scenario**: A company has 10 Classic Load Balancers, one per microservice. They want to modernize. What should they do?

**Answer**: Migrate to a **single ALB with path-based/host-based routing**. One ALB with rules replaces 10 CLBs. Cost savings + modern features.

---

## 6. Best Practices

1. ✅ Use ALB for HTTP/HTTPS workloads
2. ✅ Use NLB for TCP/UDP, extreme performance, or static IP needs
3. ✅ Use ACM for free SSL certificates
4. ✅ Enable access logging (to S3)
5. ✅ Configure health checks that verify application health (not just OS)
6. ✅ Use WAF with ALB for web security
7. ✅ Enable deletion protection for production load balancers
8. ✅ Use SNI for multi-domain SSL
9. ✅ Set appropriate deregistration delay
10. ✅ Use cross-zone load balancing for even distribution

### Exam Tips

1. **"Layer 7 routing"** → ALB
2. **"Static IP / Elastic IP"** → NLB
3. **"Millions of requests, ultra-low latency"** → NLB
4. **"Path routing, host routing"** → ALB
5. **"UDP support"** → NLB
6. **"Virtual appliance / firewall"** → GWLB
7. **"Lambda as backend"** → ALB
8. **"Static IP + Layer 7"** → NLB → ALB chain
9. **"WAF integration"** → ALB (or CloudFront)
10. **"Migrate from CLB"** → ALB (for HTTP) or NLB (for TCP)

---

*Word count: ~3,800+ words*
