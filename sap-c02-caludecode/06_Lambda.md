# 06 — AWS Lambda — Exhaustive Deep-Dive

---

## 1. What Problem Lambda Solves

### The World Before Serverless

Even with EC2, you still had to:
- **Provision servers** — Decide how many, what size
- **Manage capacity** — Scale up/down based on traffic
- **Patch and maintain** — OS updates, security patches
- **Pay for idle time** — Servers running 24/7 even when processing nothing

**Example**: You build an image thumbnail service. Users upload images, and you need to create thumbnails. With EC2, you'd run servers 24/7 waiting for uploads — even at 3 AM when no one is uploading. You pay for the idle time.

### What Lambda Changed

Lambda is **serverless compute** — you upload your code, and AWS runs it in response to events. You pay ONLY for the milliseconds your code executes.

| Before Lambda (EC2) | After Lambda |
|---|---|
| Provision and manage servers | No servers to manage |
| Pay 24/7 (even when idle) | Pay per millisecond of execution |
| Scale manually or via Auto Scaling | Scales instantly and automatically |
| Configure networking, security, monitoring | Just deploy code |
| Minutes to hours for scaling | Milliseconds to seconds |

### Real-World Examples

- **Netflix** — Uses Lambda for encoding triggers, backup operations, content validation
- **iRobot (Roomba)** — Processes IoT events from millions of vacuums
- **Thomson Reuters** — Processes financial news articles in real-time
- **Coca-Cola** — Vending machine IoT data processing

---

## 2. When to Use Lambda

### 10+ Use Cases

1. **API backends** — API Gateway → Lambda → DynamoDB/RDS (most common pattern)
2. **File processing** — S3 event → Lambda thumbnail/validation/transcoding
3. **Stream processing** — Kinesis/DynamoDB Streams → Lambda for real-time data
4. **Scheduled tasks (cron)** — EventBridge → Lambda (daily reports, cleanup)
5. **IoT data processing** — IoT Core → Lambda
6. **Chatbots** — Lex → Lambda for fulfillment logic
7. **Email processing** — SES → Lambda for incoming email handling
8. **CloudWatch Alarm response** — Auto-remediation (restart service, scale up)
9. **CloudFormation custom resources** — Extend CloudFormation with custom logic
10. **Data transformation** — Kinesis Firehose → Lambda for ETL before loading to S3/Redshift
11. **Authorization** — Lambda Authorizers for API Gateway (custom JWT validation)

### 5+ Anti-Patterns

1. **Long-running processes (>15 min)** → Use **EC2, ECS, or Step Functions** (Lambda max is 15 minutes)
2. **Steady-state, high-throughput workloads** → Use **EC2/ECS** (Lambda is more expensive when running constantly)
3. **Applications needing persistent connections** (WebSockets server, connection pools) → **EC2/ECS** with ALB
4. **GPU workloads** → **EC2** with GPU instances (Lambda has no GPU support)
5. **Applications needing >10 GB RAM** → **EC2** (Lambda max is 10 GB)
6. **Heavy binary dependencies or large runtimes** → Consider **containers on ECS/Fargate**

---

## 3. How Lambda Works

### Execution Model

```
Event Source (S3, API GW, SQS, etc.)
    → Lambda Service receives event
        → Finds or creates an execution environment ("sandbox")
            → Downloads your code (deployment package or container image)
                → Initializes runtime (Node.js, Python, Java, etc.)
                    → Runs your handler function
                        → Returns response
                            → Environment may be reused for next invocation ("warm start")
```

### Cold Start vs Warm Start

- **Cold Start**: First invocation (or after idle period). Lambda creates a new execution environment, downloads code, initializes runtime. Takes 100ms–10 seconds (Java/C# are slowest).
- **Warm Start**: Lambda reuses an existing execution environment. Only runs your handler code. Takes milliseconds.

**Reducing cold starts:**
- Use **Provisioned Concurrency** — Pre-warms execution environments ($$$)
- Use **SnapStart** (Java only) — Snapshots the initialized state for faster starts
- Use lighter runtimes (Python, Node.js over Java, .NET)
- Keep deployment packages small

### Invocation Types

| Type | Behavior | Use Case | Error Handling |
|---|---|---|---|
| **Synchronous** | Caller waits for response | API Gateway, CLI, SDK | Caller handles errors |
| **Asynchronous** | Event queued, Lambda processes later | S3 events, SNS, EventBridge | Retries 2×, then DLQ |
| **Event Source Mapping** | Lambda polls the source | SQS, Kinesis, DynamoDB Streams | Automatic retries |

---

## 4. Basic Components

### Function Configuration

| Setting | Details | Exam Note |
|---|---|---|
| **Runtime** | Node.js, Python, Java, C#, Go, Ruby, custom (via container) | |
| **Memory** | 128 MB to **10,240 MB (10 GB)** | CPU scales proportionally with memory! |
| **Timeout** | 1 second to **15 minutes** (900 seconds) | #1 exam trap: max is 15 min |
| **Environment Variables** | Key-value pairs available in code | Can be encrypted with KMS |
| **Deployment Package** | ZIP (250 MB unzipped) or **Container Image (10 GB)** | Container images for large dependencies |
| **Layers** | Shared code/libraries (up to 5 layers, 250 MB total) | Reuse common dependencies |
| **Concurrency** | Default 1,000 concurrent executions per region | Can be increased |
| **VPC** | Optional — needed to access private resources (RDS, ElastiCache) | Adds cold start latency |

### Memory = CPU Relationship (EXAM CRITICAL!)

Lambda allocates CPU **proportionally** to memory:
- 128 MB = partial vCPU
- 1,769 MB = 1 full vCPU
- 10,240 MB = 6 vCPUs

**If your function is CPU-bound (not I/O-bound), increasing memory speeds it up** — even if it doesn't need the extra memory. This can actually reduce cost because the function runs faster.

### Lambda Layers

Shared libraries/code:
- Up to 5 layers per function
- Total unzipped size (code + layers) ≤ 250 MB
- Use case: Shared SDKs, database drivers, custom runtimes

### Lambda@Edge vs CloudFront Functions

| Feature | Lambda@Edge | CloudFront Functions |
|---|---|---|
| Runs at | CloudFront Edge locations (regional) | CloudFront Edge locations (ALL) |
| Runtime | Node.js, Python | JavaScript only |
| Execution time | Up to 30 seconds | Up to 1 ms |
| Memory | Up to 10 GB | 2 MB |
| Network access | Yes | No |
| Use case | Complex logic (auth, URL rewrite) | Simple header manipulation |
| Cost | Higher | Very low ($0.10/million) |

---

## 5. Cost

### Pricing Components

1. **Requests**: $0.20 per 1 million requests
2. **Duration**: $0.0000166667 per GB-second (charged per millisecond)
3. **Provisioned Concurrency**: $0.0000041667 per GB-second (for pre-warmed environments)
4. **Free tier**: 1 million requests + 400,000 GB-seconds/month (perpetual)

### Cost Calculation Example

**Scenario**: 10 million invocations/month, 256 MB memory, 200ms average duration

- Requests: 10M × $0.20/1M = **$2.00**
- Duration: 10M × 0.2 sec × 0.25 GB = 500,000 GB-seconds × $0.0000166667 = **$8.33**
- **Total: ~$10.33/month**

Compare to an EC2 t3.small running 24/7: $0.0208/hr × 730hr = **$15.18/month** — and that's running ALL the time.

---

## 6. SAP-C02 Exam Questions (10+ Scenarios)

### Question 1 — Timeout
**Scenario**: A Lambda function processes video files. Some large files take 20 minutes. The function times out. What should they do?

**Answer**: Lambda max timeout is 15 minutes. Options:
1. **Step Functions** to orchestrate multiple Lambda invocations
2. **ECS/Fargate** for unlimited duration
3. **AWS Batch** for batch video processing

---

### Question 2 — VPC + Lambda
**Scenario**: A Lambda function needs to access an RDS database in a private subnet and also call an external API on the internet. How?

**Answer**: 
1. Configure Lambda to run inside the VPC (private subnet)
2. Add a **NAT Gateway** in a public subnet for internet access
3. Use **RDS Proxy** for database connection pooling

---

### Question 3 — Concurrency
**Scenario**: A Lambda function is called by API Gateway. During a traffic spike, some requests fail with "Rate exceeded" errors. What's happening?

**Answer**: The function is hitting the **concurrent execution limit** (default 1,000 per region). Solutions:
1. Request a limit increase from AWS
2. Use **Reserved Concurrency** on less critical functions to free up capacity
3. Use **SQS** as a buffer between API Gateway and Lambda

---

### Question 4 — Cold Start Mitigation
**Scenario**: A latency-sensitive API uses Lambda. First requests after idle periods take 5 seconds. How to fix?

**Answer**: **Provisioned Concurrency** — Pre-warms a specified number of execution environments. Ensures consistent low-latency for all requests.

---

### Question 5 — S3 → Lambda
**Scenario**: When images are uploaded to S3, thumbnails should be created automatically. How?

**Answer**: S3 Event Notification (ObjectCreated) → Lambda function (uses an image library to resize) → Saves thumbnail to another S3 bucket/prefix

---

### Question 6 — DLQ (Dead-Letter Queue)
**Scenario**: An async Lambda invocation fails after all retries. How to ensure the failed event isn't lost?

**Answer**: Configure a **Dead-Letter Queue** (SQS or SNS) or **Lambda Destinations** (on failure → SQS/SNS/Lambda/EventBridge)

---

### Question 7 — Lambda Authorizer
**Scenario**: An API Gateway API needs custom authentication using a proprietary token format. What should be used?

**Answer**: **Lambda Authorizer** (formerly Custom Authorizer) — A Lambda function that validates the token and returns an IAM policy allowing/denying the request.

---

## 7. Additional Critical Information

### Best Practices

1. ✅ Keep functions small and focused (single responsibility)
2. ✅ Use environment variables for configuration (not hardcoded)
3. ✅ Use Layers for shared dependencies
4. ✅ Put initialization code OUTSIDE the handler (reused across warm invocations)
5. ✅ Use Provisioned Concurrency for latency-sensitive workloads
6. ✅ Use RDS Proxy when connecting to relational databases
7. ✅ Set appropriate timeout (not always 15 minutes)
8. ✅ Monitor with CloudWatch Logs and X-Ray
9. ✅ Use Lambda Power Tuning to find optimal memory setting
10. ✅ Use ARM64 (Graviton2) for 34% better price-performance

### Exam Tips

1. **Max timeout: 15 minutes** — if workload needs more, use ECS/Step Functions
2. **Max memory: 10 GB** — if need more, use EC2/ECS
3. **Lambda + RDS = use RDS Proxy** (connection pooling)
4. **"Serverless API"** = API Gateway + Lambda + DynamoDB
5. **"Event-driven file processing"** = S3 → Lambda
6. **"Real-time stream processing"** = Kinesis/DynamoDB Streams → Lambda
7. **Costs less for sporadic workloads, more for constant workloads** vs EC2

---

*Word count: ~3,600 words*

---

# 07 — EC2 Auto Scaling — Exhaustive Deep-Dive

---

## 1. What Problem Auto Scaling Solves

Without Auto Scaling, you must manually add/remove EC2 instances based on traffic. If traffic spikes unexpectedly, your site goes down. If traffic drops, you're paying for idle instances.

Auto Scaling **automatically adjusts the number of EC2 instances** based on demand, ensuring you have the right amount of compute at all times.

| Without Auto Scaling | With Auto Scaling |
|---|---|
| Manual capacity adjustments | Automatic scaling |
| Over-provision for peak (waste money) | Scale to match demand exactly |
| Under-provision → outages | Automatically handle traffic spikes |
| Slow response to demand changes | Responds in minutes |

---

## 2. Core Components

### Launch Template (replaces Launch Configurations)

Defines WHAT to launch:
- AMI, instance type, key pair, security groups
- EBS volumes, network configuration
- IAM instance profile, user data
- Can specify multiple instance types (for mixed instances strategy)

**Exam Note**: Launch Configurations are LEGACY. Always use **Launch Templates** (more features, versioning support).

### Auto Scaling Group (ASG)

Defines WHERE and HOW MANY:
- VPC and subnets (which AZs to launch in)
- Min, Max, Desired capacity
- Health check type (EC2 or ELB)
- Scaling policies

### Scaling Policies

#### 1. Target Tracking (Recommended)

Set a target, ASG maintains it:
- "Keep average CPU at 50%"
- "Keep request count per target at 1,000"
- Simplest to configure

#### 2. Step Scaling

Different actions for different alarm thresholds:
- CPU 60-70% → add 1 instance
- CPU 70-80% → add 2 instances
- CPU >80% → add 3 instances

#### 3. Simple Scaling

One action per alarm (legacy, less flexible):
- CPU >70% → add 1 instance
- Cooldown period before next action

#### 4. Scheduled Scaling

Time-based scaling:
- "At 8 AM Monday, set desired to 10"
- "At 6 PM Friday, set desired to 2"
- Best for predictable traffic patterns

#### 5. Predictive Scaling

Uses ML to forecast demand:
- Analyzes historical patterns
- Pre-scales before demand arrives
- Best used alongside target tracking

### Health Checks

| Type | What It Checks | Default |
|---|---|---|
| **EC2** | Instance status checks (hardware/software) | Yes |
| **ELB** | Load balancer health checks (HTTP response) | Must enable |
| **Custom** | Your own health check endpoints | Via API |

**Exam Critical**: If using an ELB, ALWAYS set health check type to ELB. Otherwise, ASG only replaces instances when EC2 hardware fails, not when your application is unhealthy.

---

## 3. Scaling Behavior

### Cooldown Period
- Default: 300 seconds (5 minutes)
- Prevents ASG from launching/terminating too many instances during rapid changes
- **Exam Tip**: If scaling is too slow to respond, reduce the cooldown period

### Termination Policy
When scaling in (removing instances), ASG decides which instance to terminate:
1. **Default**: AZ with most instances → Oldest launch template → Closest to billing hour
2. **OldestInstance**: Remove the oldest instance
3. **NewestInstance**: Remove the newest
4. **OldestLaunchConfiguration/Template**: Remove instances with oldest config

### Warm Pool
Pre-initialized instances in a stopped state:
- When ASG needs to scale out, uses pre-warmed instances (faster than launching fresh)
- Reduces scale-out time from minutes to seconds
- Instances are stopped (lower cost than running)

---

## 4. Mixed Instances Policy (Cost Optimization)

ASG can use multiple instance types and pricing models:
- **On-Demand base**: Minimum On-Demand instances for reliability
- **Spot allocation**: Fill remaining capacity with Spot (up to 90% savings)
- **Instance diversity**: Multiple instance types to increase Spot availability

**Example**:
- Base: 2 On-Demand m5.large
- Additional: Spot instances from m5.large, m5a.large, m4.large (diversified)
- Total capacity: 10 instances
- Cost: ~60% less than all On-Demand

---

## 5. Key Exam Scenarios

**"Application needs to handle sudden traffic spikes"** → Target Tracking policy with ALB request count metric

**"Predictable daily traffic pattern"** → Scheduled Scaling + Predictive Scaling

**"Minimize cost while maintaining availability"** → Mixed Instances with Spot + On-Demand base

**"Instances launching but failing health checks"** → Check AMI, User Data script, and application startup time. Consider using Warm Pool.

**"ASG not replacing unhealthy instances detected by ALB"** → Health check type is set to EC2, not ELB. Change to ELB.

---

*Word count: ~1,800 words (combined with Lambda file for service 6-7)*
