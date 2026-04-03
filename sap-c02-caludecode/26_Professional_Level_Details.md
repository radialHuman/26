# 26 — Professional-Level Details — Service-Specific Deep Gaps

> **These are advanced details within services that SAP-C02 Professional tests but were too shallow in the main files.**

---

## LAMBDA — Advanced Details

### Reserved vs Provisioned Concurrency

| Feature | Reserved Concurrency | Provisioned Concurrency |
|---|---|---|
| What it does | Sets a HARD CAP on concurrent executions for this function | Pre-warms a set number of execution environments |
| Purpose | Guarantee capacity AND throttle to prevent runaway | Eliminate cold starts for latency-sensitive |
| Effect on other functions | Reserves capacity FROM the regional pool (other functions get less) | No impact on other functions |
| Cost | Free | ~$0.0000041667/GB-second (additional charge) |
| Cold starts? | Still has cold starts | NO cold starts (up to provisioned amount) |

**Exam**: "Function must not exceed 100 concurrent executions" → Reserved. "Function must have zero cold starts" → Provisioned.

### Lambda Destinations vs DLQ

| Feature | DLQ | Destinations |
|---|---|---|
| Trigger | Failure only | **Success AND failure** |
| Targets | SQS, SNS | SQS, SNS, Lambda, EventBridge |
| Invocation type | Async only | Async only |
| Recommendation | Legacy | **Preferred (newer, more flexible)** |

### Lambda with EFS
Lambda can mount an EFS file system for shared persistent storage across invocations:
- Use case: ML model files (too large for /tmp), shared reference data
- Requires Lambda in VPC (same VPC as EFS)
- EFS access point for each function

### Lambda Function URLs
Direct HTTPS endpoint without API Gateway:
- Simpler, cheaper (no API Gateway charges)
- No caching, no throttling, no WAF
- Use case: Webhooks, simple callbacks

### Lambda Reserved Ephemeral Storage
`/tmp` can be configured from 512 MB to 10,240 MB (10 GB):
- Use case: Processing large files, ML inference with large models
- Persists between warm invocations of the same execution environment

---

## ELB — Advanced Details

### ALB Authentication (OIDC/Cognito)
ALB can authenticate users BEFORE forwarding to backend:

```
User → ALB → Redirects to Cognito/OIDC login page
     → User authenticates
     → ALB receives token, validates it
     → Forwards request to backend with user claims in headers
```

**Exam**: "Authenticate users at the load balancer without application code changes" → ALB with Cognito/OIDC authentication

### ALB Fixed Response and Redirects
- **Fixed Response**: Return a static page (e.g., maintenance message) directly from ALB
- **Redirect**: HTTP → HTTPS redirect at ALB level (no backend needed)

### NLB + PrivateLink (CRITICAL!)
NLB is REQUIRED for AWS PrivateLink:

```
Provider Account:
  Service behind NLB → VPC Endpoint Service (powered by NLB)

Consumer Account:
  Interface VPC Endpoint → connects to Endpoint Service
  Consumer accesses service via private IP in their VPC
```

**Exam**: "Expose a service privately to other accounts without VPC peering" → NLB + PrivateLink

### ALB + CloudFront Security Pattern
Problem: ALB must be public for CloudFront, but you don't want direct ALB access.
Solution:
1. CloudFront adds a custom header (e.g., `X-Custom-Header: secret-value`)
2. ALB listener rule only forwards requests with this header
3. Direct ALB access (without header) gets 403

### Slow Start Mode
ALB gradually increases requests to newly registered targets:
- Ramp-up period: 30-900 seconds
- Prevents new instances from being overwhelmed
- **Exam**: "New instances fail health checks immediately after scaling" → Enable slow start

---

## ROUTE 53 — Advanced Details

### Chained Routing Policies (Complex Routing)
You can chain policies by creating Alias records pointing to other records:

```
example.com (Latency-based) →
  us-east-1.example.com (Weighted 70/30 for blue/green) →
    blue.us-east-1.example.com (Failover) →
      Primary: ALB-blue
      Secondary: ALB-old
```

### DNSSEC
- Route 53 supports DNSSEC signing for public hosted zones
- Protects against DNS spoofing/cache poisoning
- Requires KMS key in **us-east-1** (asymmetric, ECC_NIST_P256)
- Enable in Route 53 → chain of trust via DS records at registrar
- **Exam**: "Protect DNS from spoofing attacks" → DNSSEC

### Split-View DNS (Split-Horizon)
Same domain resolves differently internally vs externally:
- **Public Hosted Zone**: `app.company.com` → Public ALB IP (internet users)
- **Private Hosted Zone**: `app.company.com` → Private ALB IP (VPC users)
- Both zones exist simultaneously

### Cross-Account Private Hosted Zone
- Account A owns private hosted zone for `internal.company.com`
- Account B's VPC needs to resolve these names
- Process: Account A authorizes → Account B associates their VPC
- **Exam**: "Multiple accounts need to resolve shared internal DNS" → Cross-account PHZ association

---

## CLOUDFRONT — Advanced Details

### Cache Policy vs Origin Request Policy

| Aspect | Cache Policy | Origin Request Policy |
|---|---|---|
| Purpose | Determines what makes a cache key (hit/miss) | Determines what to forward to origin |
| Headers | Include specific headers in cache key | Forward additional headers to origin |
| Cookies | Include specific cookies in cache key | Forward additional cookies |
| Query strings | Include specific QS in cache key | Forward additional QS |
| Example | Cache key = URL + Accept-Language header | Forward Authorization header to origin |

**Exam**: "Cache different content per language but always forward auth token" → Cache policy includes Accept-Language, Origin request policy forwards Authorization

### CloudFront Functions Event Restrictions
- CloudFront Functions: **Viewer Request and Viewer Response ONLY**
- Lambda@Edge: All 4 events (Viewer Request/Response, Origin Request/Response)
- **Exam**: "Modify response headers before caching at edge" → Lambda@Edge on Origin Response (CloudFront Functions can't do this)

---

## IAM — Advanced Details

### ABAC (Attribute-Based Access Control)
Use tags as conditions in IAM policies:

```json
{
  "Effect": "Allow",
  "Action": "ec2:*",
  "Resource": "*",
  "Condition": {
    "StringEquals": {
      "ec2:ResourceTag/Department": "${aws:PrincipalTag/Department}"
    }
  }
}
```

This allows users to manage only EC2 instances tagged with their department. Scales without updating policies for each new resource.

### iam:PassRole
When a user assigns a role to a service (e.g., Lambda, EC2), they need `iam:PassRole`:

```json
{
  "Effect": "Allow",
  "Action": "iam:PassRole",
  "Resource": "arn:aws:iam::123456789012:role/LambdaExecutionRole",
  "Condition": {
    "StringEquals": {"iam:PassedToService": "lambda.amazonaws.com"}
  }
}
```

**Exam**: "Developer can create Lambda functions but only with specific roles" → Grant PassRole for allowed roles only

### Confused Deputy and ExternalId
When a third-party SaaS assumes a role in your account:
- Without ExternalId: Any third-party customer could trick the SaaS into accessing YOUR account
- With ExternalId: The SaaS must provide your unique ExternalId when assuming the role
- **Exam**: "Third-party service needs cross-account access securely" → Use ExternalId in trust policy

### Cross-Account Resource-Based Policy Evaluation
```
Same account: IAM policy OR resource policy → ALLOW (union)
Cross-account: IAM policy AND resource policy → ALLOW (intersection)
Exception: If resource policy grants to specific IAM principal (not account), both still needed
```

### Service-Linked Roles
- Pre-defined by AWS services (e.g., `AWSServiceRoleForAutoScaling`)
- Created automatically when you first use the service
- Cannot modify the permissions
- **Exam**: "Error: unable to create service-linked role" → User needs `iam:CreateServiceLinkedRole`

---

## REDSHIFT — Advanced Details

### Distribution Styles (CRITICAL for optimization)

| Style | Behavior | Use Case |
|---|---|---|
| **KEY** | Rows with same key value go to same node | Large fact tables joined on a specific column |
| **EVEN** | Round-robin distribution | Tables not joined or no clear key |
| **ALL** | Full copy on every node | Small dimension tables (< few million rows) |
| **AUTO** | Redshift chooses (starts ALL, switches to EVEN/KEY) | Default, let Redshift decide |

### Sort Keys

| Type | Behavior | Use Case |
|---|---|---|
| **Compound** | Sorts by first key, then second, etc. | Queries always filter by first column |
| **Interleaved** | Equal weight to all sort columns | Queries filter by any combination of columns |

### Redshift Enhanced VPC Routing
- Forces ALL COPY/UNLOAD traffic through VPC (not public internet)
- Required for: compliance (data must stay on private network)
- Requires: VPC endpoint for S3 or NAT Gateway
- **Exam**: "Ensure Redshift data transfer never traverses the internet" → Enhanced VPC Routing

### Workload Management (WLM)
Separate query queues with different concurrency and memory allocation:
- Queue 1: ETL jobs (low concurrency, high memory)
- Queue 2: Dashboard queries (high concurrency, medium memory)
- Queue 3: Ad-hoc queries (medium concurrency, low memory)

**Exam**: "Analytics queries are slow when ETL jobs run" → WLM to separate workloads

---

## TRANSIT GATEWAY — Advanced Details

### Appliance Mode
When routing traffic through a virtual appliance (firewall) in a VPC:
- Must enable **appliance mode** on the TGW VPC attachment
- Ensures return traffic goes to the SAME appliance that handled the initial request
- Without it: asymmetric routing → firewall drops packets
- **Exam**: "Firewall drops packets intermittently in TGW architecture" → Enable appliance mode

### Blackhole Routes
Drop traffic to a specific CIDR in TGW route table:
- Use case: Block traffic between specific VPCs/subnets
- Example: Blackhole route to 10.1.0.0/16 in Prod route table → Prod can't reach Dev VPC

### TGW + DX Full Architecture
```
On-Premises → Direct Connect → DX Location → DX Gateway → Transit VIF → Transit Gateway → VPCs
                                                                                           ↓
                                                                            VPC-A, VPC-B, VPC-C...
```

### Inter-Region Peering Limitations
- **Static routing ONLY** (no BGP between peered TGWs)
- You must manually add routes in each TGW route table
- Data is automatically encrypted
- Bandwidth: up to 50 Gbps per peering

---

## API GATEWAY — Advanced Details

### Endpoint Types (CRITICAL!)

| Type | Description | Use Case |
|---|---|---|
| **Edge-Optimized** | Routes through CloudFront (default) | Global clients |
| **Regional** | Direct regional endpoint | Same-region clients, custom CDN |
| **Private** | Only accessible within VPC (via VPC Endpoint) | Internal APIs |

### VPC Link
Required to connect API Gateway to private resources:
- REST API: VPC Link → NLB
- HTTP API: VPC Link → ALB, NLB, or Cloud Map service

**Exam**: "API Gateway needs to reach a private ALB" → VPC Link (HTTP API)

### Resource Policies
JSON policies controlling WHO can invoke the API:
```json
{
  "Effect": "Allow",
  "Principal": "*",
  "Action": "execute-api:Invoke",
  "Resource": "arn:aws:execute-api:us-east-1:123:api-id/*",
  "Condition": {
    "StringEquals": {"aws:SourceVpc": "vpc-xxx"}
  }
}
```

**Exam**: "Restrict API access to specific VPC or IP range" → API Gateway Resource Policy

---

## CLOUDFORMATION — Advanced Details

### CreationPolicy + cfn-signal
Wait for an EC2 instance to finish configuration before marking CREATE_COMPLETE:

```yaml
MyASG:
  Type: AWS::AutoScaling::AutoScalingGroup
  CreationPolicy:
    ResourceSignal:
      Count: 1
      Timeout: PT15M  # Wait 15 minutes for signal
```

Instance sends signal: `cfn-signal --success true --stack StackName --resource MyASG`

**Exam**: "CloudFormation marks instance as created before application finishes installing" → Add CreationPolicy with cfn-signal

### Dynamic References
Reference SSM and Secrets Manager values in templates:
```yaml
MyDB:
  Type: AWS::RDS::DBInstance
  Properties:
    MasterUsername: '{{resolve:ssm:/myapp/db/username}}'
    MasterUserPassword: '{{resolve:secretsmanager:MySecret:SecretString:password}}'
```

### Stack Policies
Protect resources from unintended updates:
```json
{
  "Statement": [{
    "Effect": "Deny",
    "Action": "Update:Replace",
    "Principal": "*",
    "Resource": "LogicalResourceId/ProductionDatabase"
  }]
}
```

---

## STEP FUNCTIONS — Integration Patterns

| Pattern | Syntax | Behavior | Use Case |
|---|---|---|---|
| **Request Response** | Default | Call service, get immediate response | Quick API calls |
| **Run a Job (.sync)** | `arn:...:.sync` | Wait for long-running job to complete | Glue ETL, ECS task, Batch job |
| **Wait for Callback** | `.waitForTaskToken` | Pause, send token, resume when callback received | Human approval, external system |

**Exam**: "Step Functions workflow must wait for a Glue ETL job to finish" → Use `.sync` integration pattern

---

## DIRECT CONNECT — Advanced Details

### Dedicated vs Hosted Connections

| Feature | Dedicated | Hosted |
|---|---|---|
| Port | You own the port | Partner shares their port |
| Speeds | 1, 10, 100 Gbps | 50 Mbps – 10 Gbps |
| Multiple VIFs | Yes (up to 50) | Usually 1 VIF per connection |
| Lead time | Weeks-months | Days-weeks (partner handles setup) |
| Best for | High bandwidth, multiple VPCs | Lower bandwidth, quick setup |

### MACsec Encryption
Layer 2 encryption on dedicated DX connections:
- Available on 10 Gbps and 100 Gbps dedicated connections
- Native encryption (no VPN overhead/throughput loss)
- **Exam**: "Encrypt Direct Connect without VPN performance overhead" → MACsec

### BGP Basics for Exam
- DX uses BGP to exchange routing information
- **AS-PATH prepending**: Make a path look longer so traffic prefers the other path (used for primary/backup DX)
- **BGP communities**: Control route propagation scope
- **BFD (Bidirectional Forwarding Detection)**: Fast failure detection (~1 second vs BGP default 90 seconds)
- **Exam**: "DX failover takes too long" → Enable BFD

---

## SQS — Advanced Details

### FIFO High Throughput
- Standard FIFO: 300 messages/sec (3,000 with batching)
- High throughput mode: **Up to 70,000 messages/sec** with batching
- Per message group ID: 300/sec

### SQS + Lambda Concurrency Control
`MaximumConcurrency` on Lambda event source mapping:
- Limits how many Lambda instances process SQS messages simultaneously
- Prevents overwhelming downstream services
- Default: up to 1,000 concurrent (or account limit)
- **Exam**: "Lambda processing SQS overwhelms the database" → Set MaximumConcurrency on event source mapping

### SQS Encryption
| Type | Key | Cost |
|---|---|---|
| SSE-SQS | AWS manages key | Free |
| SSE-KMS | You manage via KMS | KMS API charges |

---

## KINESIS — Advanced Details

### On-Demand Mode (Data Streams)
- No shard management
- Auto-scales up to 200 MB/sec write, 400 MB/sec read
- Pay per GB written/read instead of per shard
- **Exam**: "Streaming workload with unpredictable volume" → On-Demand mode

### Lambda Error Handling with Kinesis
| Setting | Purpose |
|---|---|
| **BisectBatchOnFunctionError** | Split failed batch in half and retry each half (find the bad record) |
| **MaximumRetryAttempts** | Limit retries (default: unlimited = retry forever, blocking shard) |
| **DestinationConfig.OnFailure** | Send failed records to SQS/SNS after max retries |
| **MaximumRecordAgeInSeconds** | Skip records older than this age |

**Exam**: "Kinesis Lambda consumer is stuck processing a bad record" → Enable BisectBatchOnFunctionError + MaximumRetryAttempts + OnFailure destination

---

*Word count: ~4,500+ words of professional-level service details*
