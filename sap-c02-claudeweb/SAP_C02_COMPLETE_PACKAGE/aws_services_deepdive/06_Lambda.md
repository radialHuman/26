# Lambda - Complete Deep Dive

## 1. What Problem Did It Solve?

**Before Lambda (2014):**
- Run code = need server (EC2)
- Pay for server 24/7 even if code runs 1 minute/day
- Scaling = launch more servers (manual or Auto Scaling)
- Idle resources = wasted money
- Small tasks still needed full server

**Problem:** Paying for servers when you just want to run code occasionally

**Lambda Solution:**
- Run code without servers
- Pay only when code executes (per millisecond!)
- Auto-scales from 0 to 1000s instantly
- No infrastructure management
- Event-driven (S3 upload → run code automatically)

**Impact:** Enabled serverless revolution, changed how apps are built

---

## 2. What Was There Before This Service?

**Compute Evolution:**

**2006-2014: EC2 Era**
- Want to run code → Launch EC2
- Even tiny task → Full server needed
- Background jobs → Server running 24/7

**2014: Lambda Launches**
- First Function-as-a-Service (FaaS)
- Revolutionary: No servers!

**Timeline:**
- 2014: Lambda launches (Node.js only)
- 2015: Python support
- 2016: Java, C# support
- 2018: Ruby, Go
- 2020: Container image support
- 2024: Lambda SnapStart (Java cold start reduction)

**Competitors:**
- Google Cloud Functions (2016)
- Azure Functions (2016)
- But Lambda most mature/popular

---

## 3. When to Use It

### **Use Lambda When:**

✅ **Event-driven tasks**
- S3 upload → process file
- API request → respond
- Schedule → run periodically (cron)
- DynamoDB change → trigger action

✅ **Short-duration tasks (<15 minutes)**
- Image resizing (seconds)
- API backends (milliseconds)
- Data transformation (minutes)
- Scheduled jobs (varies)

✅ **Unpredictable/spiky traffic**
- 0 requests → 10,000/sec spike
- Lambda scales instantly
- Pay only for actual use

✅ **Stateless operations**
- Each invocation independent
- No persistent state on function
- State stored in S3/DynamoDB/etc.

✅ **Want zero server management**
- No OS patching
- No capacity planning
- No infrastructure

✅ **Cost optimization for low-traffic**
- Code runs 5 minutes/day
- EC2: $30/month (running 24/7)
- Lambda: $0.10/month (pay for 5 min only!)

### **DON'T Use Lambda When:**

❌ **Long-running processes (>15 minutes)**
- Video encoding (hours)
- Large batch jobs (hours)
→ Use EC2, ECS, Batch

❌ **Need persistent state**
- WebSocket connections (persistent)
- Stateful applications
→ Use EC2, ECS

❌ **Predictable 24/7 load**
- Always receiving traffic
- Lambda costs more than Reserved EC2
→ Use EC2 Reserved Instances

❌ **Need full OS control**
- Custom kernel modules
- System-level configuration
→ Use EC2

❌ **Large dependencies (>250 MB unzipped)**
- Huge libraries/models
- Limit: 50 MB zipped, 250 MB unzipped
→ Use container images (up to 10 GB) or EC2

---

## 4. How Is It Different from Similar Services?

### **Lambda vs EC2**

| Feature | Lambda | EC2 |
|---------|--------|-----|
| **Server management** | None | Full control |
| **Scaling** | Automatic (instant) | Manual (ASG takes minutes) |
| **Pricing** | Per execution (GB-sec) | Per hour (even if idle) |
| **Duration** | Max 15 minutes | Unlimited |
| **State** | Stateless | Can be stateful |
| **Cold start** | 100-500ms | None (always running) |
| **Use case** | Event-driven, short tasks | Long-running, stateful |

---

### **Lambda vs Fargate**

| Feature | Lambda | Fargate |
|---------|--------|---------|
| **Duration** | Max 15 min | Unlimited |
| **Packaging** | Function code or container image | Container only |
| **Scaling** | Instant (0→1000s) | Fast (seconds to minutes) |
| **Cost** | Per invocation | Per second container runs |
| **State** | Stateless | Can be stateful |
| **Use case** | Short event-driven | Long-running containers |

---

### **Lambda vs Step Functions**

| Feature | Lambda | Step Functions |
|---------|--------|----------------|
| **Purpose** | Execute code | Orchestrate Lambdas |
| **Workflow** | Single function | Multi-step workflow |
| **Duration** | 15 min | 1 year |
| **Visual designer** | No | Yes |
| **Use case** | Individual tasks | Complex workflows |

**Pattern:** Step Functions orchestrates multiple Lambdas

---

## 5. Underlying Mechanism and How It's Made

### **How Lambda Actually Works:**

**Execution Environment:**
```
Lambda uses Firecracker microVMs:
- Lightweight VMs (not containers!)
- Boot in <125ms
- Strong isolation (security)
- Minimal overhead

Each execution:
  1. AWS allocates microVM
  2. Loads your code + runtime
  3. Executes function
  4. Returns result
  5. Freezes environment (might reuse!)
```

---

### **Cold Start vs Warm Start:**

**Cold Start (First Invocation):**
```
Timeline:
1. Request arrives (0ms)
2. AWS allocates microVM (50-100ms)
3. Download function code from S3 (20-50ms)
4. Initialize runtime (Node.js, Python startup) (50-200ms)
5. Run your init code (import libraries) (50-500ms)
6. Execute handler function (your code time)

Total cold start: 100-500ms (varies by runtime, size)
```

**Warm Start (Subsequent within ~15 minutes):**
```
Timeline:
1. Request arrives (0ms)
2. Reuse existing microVM (0ms - already allocated!)
3. Execute handler function (your code time)

Total: Just your code execution time (milliseconds)
```

**Optimization:**
```
Provisioned Concurrency:
- Pre-warm X instances
- Keeps environments initialized
- No cold starts for those instances
- Cost: Pay for provisioned (even if idle)
```

---

### **Concurrency Model:**

```
Invocations arrive:
  Request 1 → Execution environment 1
  Request 2 → Execution environment 2 (new!)
  Request 3 → Execution environment 3 (new!)
  Request 4 → Execution environment 1 (reused! - if first done)

Concurrent executions:
- Default limit: 1,000 per region
- Can request increase (10,000s)
- Reserved concurrency: Guarantee capacity for critical function
```

---

### **Memory and CPU Allocation:**

```
Memory you configure: 128 MB to 10,240 MB

CPU allocated proportionally:
- 128 MB: ~0.08 vCPU
- 1,024 MB: ~0.6 vCPU
- 1,792 MB: ~1 full vCPU
- 10,240 MB: ~6 vCPUs

More memory = More CPU!
- 2x memory = 2x CPU
- Often faster execution
- Might cost same or less (GB-seconds balance)
```

---

## 6. Cost

### **Pricing Formula:**

**Requests:**
```
$0.20 per 1 million requests
First 1 million/month: FREE

Example:
10 million requests/month
= (10 - 1) × $0.20 = $1.80/month
```

**Compute (GB-seconds):**
```
$0.0000166667 per GB-second
First 400,000 GB-seconds/month: FREE

Formula: Memory (GB) × Duration (seconds)

Example 1:
- Memory: 512 MB = 0.5 GB
- Duration: 1 second
- Invocations: 1 million/month

GB-seconds: 0.5 × 1 × 1,000,000 = 500,000 GB-sec
Billable: 500,000 - 400,000 (free tier) = 100,000
Cost: 100,000 × $0.0000166667 = $1.67/month
```

**Example 2:**
```
Memory: 1024 MB = 1 GB
Duration: 3 seconds
Invocations: 5 million/month

GB-seconds: 1 × 3 × 5,000,000 = 15,000,000 GB-sec
Cost: 15,000,000 × $0.0000166667 = $250/month
Requests: (5 - 1) × $0.20 = $0.80
Total: $250.80/month
```

---

### **Cost Optimization:**

**1. Right-size memory:**
```
Test different memory settings:
- 512 MB: 10 seconds = 5 GB-sec
- 1024 MB: 6 seconds = 6 GB-sec (more expensive!)
- 2048 MB: 4 seconds = 8 GB-sec (even more!)

Optimal: 512 MB (lowest GB-seconds)

Tool: Lambda Power Tuning (automated testing)
```

**2. Provisioned Concurrency:**
```
When to use: Latency-critical, consistent traffic

Cold start cost:
- User waits 300ms (bad UX)
- Maybe lose customer

Provisioned Concurrency cost:
- $0.015/hour per GB provisioned
- 1 GB provisioned 24/7: $10.95/month
- But zero cold starts! ✅

Trade-off: Pay for availability vs accept cold starts
```

---

## 7. Pros and Cons

### **Pros ✅**

1. **Zero server management**
   - No OS, no patching, no scaling config
   - AWS handles everything

2. **Auto-scaling**
   - 0 to 1000s in seconds
   - No capacity planning
   - Handles spikes automatically

3. **Pay per use**
   - No idle costs
   - Perfect for sporadic workloads
   - Free tier generous (1M requests/month)

4. **Event-driven integrations**
   - 200+ event sources
   - S3, DynamoDB, Kinesis, API Gateway, etc.
   - Easy to build reactive systems

5. **High availability**
   - Multi-AZ by default
   - No HA configuration needed

6. **Multiple runtimes**
   - Node.js, Python, Java, Go, Ruby, .NET, custom

### **Cons ❌**

1. **Cold starts**
   - 100-500ms delay on first invocation
   - Unpredictable
   - Bad for latency-sensitive apps

2. **15-minute limit**
   - Can't run longer tasks
   - Must break into smaller chunks

3. **Stateless**
   - No persistent state between invocations
   - Must use external storage (S3, DynamoDB)

4. **Debugging harder**
   - Can't SSH into instance (no instance!)
   - Must use CloudWatch Logs
   - Testing locally is different from production

5. **Vendor lock-in**
   - AWS-specific
   - Hard to migrate to other clouds

6. **Cost for constant traffic**
   - If always receiving requests: EC2 cheaper
   - Lambda: Great for spikes, bad for steady 24/7

7. **Package size limits**
   - 50 MB zipped, 250 MB unzipped
   - Large dependencies problematic

---

## 8. SAP-C02 Questions Related to This

### **Question Type 1: Lambda vs EC2**
```
Scenario: Process uploaded files, 10 uploads/day, each takes 30 seconds

Answer: Lambda
Why:
- Infrequent (10/day, not 24/7)
- Short duration (30 sec < 15 min limit)
- Event-driven (S3 upload trigger)

Cost comparison:
EC2 t3.micro: $8/month (24/7)
Lambda: $0.05/month (10 × 30 sec)
```

---

### **Question Type 2: Cold Start Mitigation**
```
Scenario: API needs <100ms response, currently seeing 300ms cold starts

Answer: Provisioned Concurrency
- Pre-warm 5 instances
- No cold starts for those
- Costs ~$11/month per GB provisioned

Alternative (not in options usually):
- Scheduled EventBridge to "ping" function every 5 min (keeps warm)
- Hacky, Provisioned Concurrency is proper solution
```

---

### **Question Type 3: Timeout Configuration**
```
Scenario: Lambda timeout after 3 seconds, but task takes 5 seconds

Solution: Increase timeout setting
- Default: 3 seconds
- Max: 15 minutes (900 seconds)
- Set based on task duration

Configuration:
Timeout: 10 seconds (add buffer above 5 sec needed)
```

---

### **Question Type 4: VPC Access**
```
Scenario: Lambda needs to access RDS in private subnet

Answer: Configure Lambda with VPC access
- Specify VPC, subnets, security group
- Lambda gets ENI in your VPC
- Can access private resources

Trade-off:
✅ Can access VPC resources (RDS, ElastiCache)
❌ Cold start increases (ENI setup: +3-10 seconds)
❌ Need NAT Gateway for internet access

Best practice: VPC Lambda only when necessary
```

---

### **Question Type 5: Error Handling**
```
Scenario: Lambda processes SQS messages, some fail

Answer: Configure Dead Letter Queue (DLQ)
- Failed invocations → SQS/SNS
- Max retry: 2 (configurable)
- After retries exhausted → DLQ
- Manual review/reprocess

Configuration:
- DLQ target: SQS queue or SNS topic
- On-failure destination (async)
```

---

### **Question Type 6: Performance Optimization**
```
Scenario: Lambda taking 30 seconds with 512 MB memory

Test: Increase to 1024 MB → Now takes 18 seconds

Question: Which is cheaper?

Calculation:
512 MB, 30 sec: 0.5 × 30 = 15 GB-sec
1024 MB, 18 sec: 1 × 18 = 18 GB-sec

Answer: 512 MB cheaper (15 < 18)
But: 1024 MB is 40% faster (might be worth slight extra cost)
```

---

## 9. Configurations

### **1. Function Configuration**

**Basic Settings:**
```
Function name: processImage
Runtime: Python 3.11
Handler: lambda_function.lambda_handler
  - File: lambda_function.py
  - Function: lambda_handler

Code:
def lambda_handler(event, context):
    # event = trigger data (S3 object info, API request, etc.)
    # context = runtime info (function name, memory, etc.)
    
    # Your code here
    return {
        'statusCode': 200,
        'body': 'Success'
    }
```

---

### **2. Resource Configuration**

**Memory:**
```
Range: 128 MB to 10,240 MB (in 1 MB increments)
Default: 128 MB

Recommendation:
- Start with 512-1024 MB
- Test with Lambda Power Tuning
- Optimize for GB-seconds

Remember: More memory = More CPU!
```

**Timeout:**
```
Range: 1 second to 15 minutes (900 seconds)
Default: 3 seconds

Set based on task:
- API response: 3-10 seconds
- Image processing: 30-60 seconds
- Data processing: 5-15 minutes

Add buffer: If task takes 5 sec, set timeout to 8-10 sec
```

**Ephemeral storage (/tmp):**
```
Range: 512 MB to 10,240 MB
Default: 512 MB

Use for:
- Temporary file storage during execution
- Downloaded files
- Intermediate processing

Cleared between invocations (not persistent!)
```

---

### **3. Trigger Configuration**

**S3 Trigger:**
```
Event: s3:ObjectCreated:*
Bucket: my-upload-bucket
Prefix: images/ (optional - only trigger for images folder)
Suffix: .jpg (optional - only .jpg files)

Lambda receives:
{
  "Records": [{
    "s3": {
      "bucket": {"name": "my-upload-bucket"},
      "object": {"key": "images/photo.jpg", "size": 102400}
    }
  }]
}
```

**EventBridge (Scheduled):**
```
Schedule: rate(30 minutes)
Or cron: cron(0 9 * * ? *)  // Every day at 9 AM UTC

Lambda runs automatically on schedule
```

**API Gateway:**
```
API endpoint: https://api-id.execute-api.region.amazonaws.com/prod/users

GET /users → Lambda function
Lambda receives:
{
  "httpMethod": "GET",
  "path": "/users",
  "queryStringParameters": {...},
  "headers": {...}
}

Lambda returns:
{
  "statusCode": 200,
  "body": JSON.stringify(data)
}
```

**DynamoDB Streams:**
```
Trigger on: INSERT, MODIFY, REMOVE
Batch size: 1-10,000 records
Lambda processes changes in order

Receives:
{
  "Records": [{
    "eventName": "INSERT",
    "dynamodb": {
      "NewImage": {...},  // New item data
      "Keys": {...}
    }
  }]
}
```

---

### **4. Environment Variables**

```
Configuration:
KEY=value

Example:
DB_HOST=my-database.rds.amazonaws.com
BUCKET_NAME=my-uploads
API_KEY=abc123  // ❌ DON'T DO THIS!

For secrets:
- Use Secrets Manager or Parameter Store
- Retrieve at runtime
- Don't hardcode in env vars!

Access in code:
import os
db_host = os.environ['DB_HOST']
```

---

### **5. Layers**

```
Problem: Multiple functions use same libraries
Solution: Create Layer (shared code/dependencies)

Example:
Layer: pandas-numpy
  - pandas==1.5.0
  - numpy==1.23.0
  - Size: 50 MB

Functions: data-processor, analytics, reports
All attach same layer (no duplication!)

Benefits:
- Smaller deployment packages
- Share code across functions
- Update layer → all functions get update

Limit: 5 layers per function, 250 MB total unzipped
```

---

### **6. Concurrency Settings**

**Reserved Concurrency:**
```
Guarantee capacity for critical function:
- Reserve 100 concurrent executions
- This function always gets 100
- Other functions share remaining (900 if 1000 total limit)

Use when: Function must not be throttled (critical)
```

**Provisioned Concurrency:**
```
Keep X instances warm (no cold starts):
- Provision: 10 instances
- Always initialized and ready
- Pay for provisioned time

Use when: Latency-critical (API with SLA)
Cost: ~$11/month per GB provisioned
```

---

### **7. Destinations**

```
On success: Send event to SQS/SNS/EventBridge/Lambda
On failure: Send to DLQ or different Lambda

Example:
Success → SQS queue (for downstream processing)
Failure → SNS topic (alert team)

Better than polling for results!
```

---

### **8. VPC Configuration**

```
Enable VPC access:
- Select VPC
- Select subnets (at least 2 AZs)
- Select security group

Lambda gets:
- ENI (Elastic Network Interface) in your subnet
- Private IP
- Can access VPC resources (RDS, ElastiCache)

Important:
- Cold start penalty (+3-10 seconds for ENI setup)
- Need NAT Gateway for internet access (Lambda now in private subnet)
- Hyperplane ENIs (2019+): Shared, faster cold starts

When to use:
- Access RDS, ElastiCache, internal APIs
- NOT for S3/DynamoDB (use VPC endpoints or don't use VPC Lambda)
```

---

## 10. Anything Else You Need to Know

### **Lambda Limits (CRITICAL for Exam)**

```
Deployment package:
- Zipped: 50 MB
- Unzipped: 250 MB
- Container image: 10 GB

Execution:
- Timeout: 15 minutes max
- Memory: 128 MB to 10,240 MB
- /tmp storage: 512 MB to 10,240 MB
- Concurrency: 1,000 default (can increase)

Invocation payload:
- Request/response: 6 MB (synchronous)
- Async: 256 KB
```

---

### **Event Source Types**

**Synchronous (wait for response):**
- API Gateway (user waits)
- ALB (user waits)
- Cognito (user flow)
- Invoke directly

**Asynchronous (don't wait):**
- S3 (upload and move on)
- SNS
- EventBridge
- SES (email received)

**Poll-based (Lambda polls source):**
- SQS (Lambda polls queue)
- Kinesis Streams (Lambda reads stream)
- DynamoDB Streams

---

### **Container Image Support**

```
Instead of ZIP file:
- Package as container image (up to 10 GB!)
- Use Docker
- Include large dependencies

Dockerfile:
FROM public.ecr.aws/lambda/python:3.11
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app.py .
CMD ["app.lambda_handler"]

Push to ECR, Lambda pulls and runs

Use when: Large dependencies (ML models, etc.)
```

---

### **Lambda@Edge**

```
Run Lambda at CloudFront edge locations:
- Modify requests/responses
- Geo-based logic
- A/B testing
- Auth at edge

Triggers:
- Viewer request (before CloudFront cache)
- Viewer response (before sending to user)
- Origin request (before origin)
- Origin response (after origin)

Limitations:
- Max 128 MB memory (Edge is limited)
- Max 30 seconds (viewer) or 5 seconds (origin)
- Subset of runtimes

Use: Content modification, auth, personalization
```

---

### **Best Practices**

✅ **Separate handler from business logic**
```python
# Bad: Everything in handler
def lambda_handler(event, context):
    # 100 lines of code here...

# Good: Separate concerns
def process_data(data):
    # Business logic
    return result

def lambda_handler(event, context):
    data = event['data']
    result = process_data(data)  # Testable!
    return result
```

✅ **Use environment variables for config** (not secrets!)
✅ **Connection pooling** (reuse DB connections)
✅ **Set appropriate timeout** (not max 15 min for everything)
✅ **Use Layers** for shared dependencies
✅ **Monitor CloudWatch Logs** (add structured logging)
✅ **Handle errors gracefully** (try/catch, return proper codes)
✅ **Use X-Ray** for tracing (find bottlenecks)
✅ **Test locally** (SAM CLI, LocalStack)
✅ **Use Dead Letter Queue** (don't lose failed events)

---

### **Common Mistakes**

❌ **Not handling cold starts**
```
Problem: API slow sometimes (cold start)
Solution: Provisioned Concurrency or optimize init code
```

❌ **Running out of memory**
```
Error: "Runtime exited with error: signal: killed"
Cause: OOM (out of memory)
Solution: Increase memory allocation
```

❌ **Timeout too short**
```
Error: "Task timed out after 3.00 seconds"
Cause: Default 3 sec timeout
Solution: Increase timeout
```

❌ **Not using connection pooling**
```
Problem: Database connection limit hit
Cause: Each Lambda invocation creates new connection
Solution: Use RDS Proxy or global connection pool
```

❌ **Storing secrets in code/env vars**
```
❌ API_KEY = "abc123" in code
❌ Environment variable: API_KEY=abc123
✅ Retrieve from Secrets Manager at runtime
```

---

**END OF LAMBDA DEEP DIVE**

**Created so far: 5/30**
- EC2 ✅
- VPC ✅
- S3 ✅
- RDS ✅
- DynamoDB ✅

Continuing with next batch...

