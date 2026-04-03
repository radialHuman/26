# Services 16-22: Advanced Networking & Integration

# 16. Direct Connect - Complete Deep Dive

## 1. Problem Solved
**Before:** VPN over internet (variable performance, security concerns), expensive MPLS circuits  
**After:** Dedicated private connection, consistent bandwidth, predictable performance

## 2. History
**2011:** Direct Connect launches, 1 Gbps and 10 Gbps ports  
**2018:** 50 Mbps-500 Mbps hosted connections, MACsec encryption  
**2019:** SiteLink (DX location to DX location direct)

## 3. When to Use
✅ Consistent bandwidth needed (not internet-dependent)  
✅ Large data transfer (>10 TB, cheaper than internet)  
✅ Hybrid cloud (integrate on-prem with AWS)  
✅ Low latency required  
✅ Compliance (data must not traverse internet)  
❌ Quick setup needed (takes weeks to provision), small data transfer, budget-constrained

## 4. vs Similar
**DX vs VPN:** DX=consistent/expensive/weeks to setup, VPN=variable/cheap/minutes to setup  
**DX vs Internet:** DX=private/predictable, Internet=public/variable  
**Often combined:** DX primary + VPN backup (resilient hybrid)

## 5. How It Works
Physical fiber from your data center/colo to AWS DX location, virtual interfaces (VIFs) on connection: Private VIF (access VPC), Public VIF (access public AWS services like S3), Transit VIF (access Transit Gateway). Link Aggregation Groups (LAG) combines multiple connections for bandwidth/redundancy.

## 6. Cost
Port hour: Dedicated 1 Gbps $0.30/hour = $219/month, 10 Gbps $2.25/hour = $1,642/month, Hosted 50 Mbps-10 Gbps varies by partner  
Data transfer OUT: $0.02/GB (cheaper than internet $0.09/GB)  
Setup: One-time fee ~$500-1,000 (cross-connect)

## 7. Pros and Cons
**Pros:** Consistent performance, private connection, reduced bandwidth costs (for large transfer), low latency, can access public services privately  
**Cons:** Expensive ($219/month minimum), weeks to provision, not redundant by default, need backup (VPN), requires physical presence at DX location or partner

## 8. SAP-C02 Questions
**Q:** Consistent bandwidth on-prem to AWS → Direct Connect  
**Q:** Large data transfer (100 TB/month) → Direct Connect (cheaper than internet transfer)  
**Q:** Resilient hybrid → 2 DX connections in different locations OR DX + VPN backup  
**Q:** Access multiple VPCs → DX Gateway or Transit Gateway VIF  
**Q:** Encryption over DX → MACsec (layer 2) or VPN over DX (IPsec layer 3)

## 9. Configurations
**Connection:** Location (AWS DX facility), Port speed (1/10 Gbps dedicated or 50M-10G hosted), Cross-connect to AWS device  
**Virtual Interfaces:** Private VIF (access VPC via Virtual Private Gateway), Public VIF (S3, DynamoDB via public IPs but private connection), Transit VIF (Transit Gateway for multiple VPCs)  
**LAG:** Bundle 1-4 connections, active-active, more bandwidth + redundancy  
**VLAN:** 802.1Q tagging, multiple VIFs on one connection

## 10. Additional
**Resilient architecture:** 2 DX locations, 2 connections per location, 4 total = maximum resilience  
**Direct Connect Gateway:** Connect one DX to 10 VPCs across regions (avoids multiple VIFs)  
**MACsec:** Layer 2 encryption (10 Gbps only), hardware-based  
**VPN over DX:** IPsec VPN using public VIF, encrypted hybrid connection  
**SiteLink:** Connect DX locations directly (bypassing region), global network backbone

---

# 17. API Gateway - Complete Deep Dive

## 1. Problem Solved
**Before:** Build API from scratch (routing, auth, throttling, caching), manage API servers  
**After:** Managed API creation, built-in features, no servers

## 2. History
**2015:** API Gateway launches (REST APIs only)  
**2018:** WebSocket APIs  
**2019:** HTTP APIs (simpler, cheaper)  
**Evolution:** Custom domains, usage plans, VPC integration, private APIs

## 3. When to Use
✅ Create REST/HTTP APIs  
✅ Serverless backends (Lambda)  
✅ Throttling/rate limiting  
✅ API key management  
✅ Request/response transformation  
✅ Caching API responses  
❌ Simple Lambda trigger (use Lambda function URL), GraphQL (use AppSync), extreme throughput (ALB+EC2 better)

## 4. vs Similar
**API Gateway vs ALB:** API Gateway=API management/features, ALB=simple HTTP routing  
**REST vs HTTP APIs:** REST=full features/$3.50/M, HTTP=simpler/$1/M  
**WebSocket vs REST:** WebSocket=bidirectional/real-time, REST=request-response

## 5. How It Works
Client request → API Gateway endpoint → Authorization (IAM/Cognito/Lambda authorizer) → Throttling check → Integration (Lambda/HTTP/AWS service) → Response transformation → Cache check → Return to client. Request/response can be transformed (map template, validation).

## 6. Cost
REST APIs: $3.50 per million requests, HTTP APIs: $1.00 per million, WebSocket: $1.00 per million messages + connection minutes $0.25 per million  
Caching: $0.02/hour per GB (1 GB cache = $14.60/month)  
Data transfer: Standard AWS rates

## 7. Pros and Cons
**Pros:** Fully managed, throttling/quotas built-in, caching, multiple auth methods, monitoring/logging, CORS support, API versioning (stages)  
**Cons:** 29-second timeout (can't exceed), 10 MB payload limit, cold start (API Gateway initialization), costs vs ALB direct to Lambda

## 8. SAP-C02 Questions
**Q:** Serverless API → API Gateway + Lambda  
**Q:** Throttle API → Usage plan with throttle limits  
**Q:** Cache responses → Enable caching (1-237 GB)  
**Q:** Multiple environments → Stages (dev/test/prod)  
**Q:** Authorize requests → Cognito authorizer or Lambda authorizer  
**Q:** Private API (VPC only) → Private API + VPC endpoint

## 9. Configurations
**REST API:** Resources (/users, /orders), Methods (GET, POST), Integration (Lambda/HTTP/Mock/AWS service), Stages (dev/prod), Deployment required after changes  
**Authorizers:** IAM (AWS credentials), Cognito (user pools), Lambda (custom logic), API keys (simple identification)  
**Throttling:** Rate (requests/sec) and burst (bucket size), per-client throttling, usage plans  
**Caching:** Cache capacity (0.5-237 GB), TTL (300 sec default), cache key (which parameters)  
**Custom domain:** ACM certificate, Route 53 alias, API mapping (multiple APIs on one domain)

## 10. Additional
**Request validation:** JSON schema validation, reject invalid requests before reaching backend  
**VPC Link:** Access private resources (ALB in VPC), for HTTP APIs and REST APIs  
**Canary deployments:** Route percentage to new version (test before full deployment)  
**API Keys:** Identify clients, not for authentication (use authorizers)  
**SDK generation:** Auto-generate client SDKs (JavaScript, Java, etc.)

---

# 18. SQS - Complete Deep Dive

## 1. Problem Solved
**Before:** Tight coupling (app A calls app B directly), no retry logic, messages lost on failure  
**After:** Decoupling, automatic retry, message persistence, scale independently

## 2. History
**2004:** SQS launches (first AWS service!)  
**2016:** FIFO queues  
**Evolution:** Dead letter queues, long polling, message attributes, delay queues

## 3. When to Use
✅ Decouple components  
✅ Async processing (upload → queue → process later)  
✅ Buffer between producers/consumers (handle spikes)  
✅ Distribute work (multiple workers poll queue)  
✅ Retry failed operations  
❌ Real-time streaming (use Kinesis), pub-sub (use SNS), exactly-once critical (FIFO limits throughput)

## 4. vs Similar
**SQS vs SNS:** SQS=pull/queue/one consumer, SNS=push/pub-sub/multiple subscribers  
**SQS vs Kinesis:** SQS=messaging/delete after process, Kinesis=streaming/multiple consumers/retention  
**Standard vs FIFO:** Standard=unlimited throughput/at-least-once/best-effort ordering, FIFO=300 msg/sec/exactly-once/strict ordering

## 5. How It Works
Producer sends message → Queue stores (distributed across servers, redundant) → Consumer polls → Processes → Deletes message. Visibility timeout: Message invisible during processing (prevent duplicate processing). If not deleted: Reappears after visibility timeout. Dead Letter Queue: After max receives, move to DLQ.

## 6. Cost
Standard: $0.40 per million requests (first 1M free), FIFO: $0.50 per million  
Data transfer: Standard AWS rates  
**Example:** 10M messages = $4/month

## 7. Pros and Cons
**Pros:** Unlimited throughput (Standard), automatic scaling, message retention (1 min to 14 days), no message size limit (use S3 Extended Client), simple to use  
**Cons:** Not real-time (polling delay), FIFO limited (300-3000 msg/sec), eventual delivery (Standard), message size 256 KB (need S3 for larger)

## 8. SAP-C02 Questions
**Q:** Decouple app components → SQS between them  
**Q:** Ordering required → FIFO queue  
**Q:** Failed messages → Dead Letter Queue after max receives  
**Q:** Long processing time → Increase visibility timeout  
**Q:** Fan-out pattern → SNS → Multiple SQS queues

## 9. Configurations
**Standard queue:** Unlimited throughput, at-least-once delivery, best-effort ordering  
**FIFO queue:** Exactly-once, strict ordering, 300 msg/sec (3K with batching), deduplication (5-min window)  
**Visibility timeout:** 0 sec to 12 hours (default 30 sec), set based on processing time  
**Message retention:** 1 minute to 14 days (default 4 days)  
**Receive wait time:** 0-20 seconds (long polling reduces empty receives)  
**DLQ:** Queue for failed messages, maxReceiveCount threshold

## 10. Additional
**Delay queues:** Postpone delivery (0-15 min), all messages delayed  
**Message timers:** Per-message delay (override queue default)  
**Long polling:** Wait up to 20 sec for messages (reduces API calls, cheaper)  
**Batch operations:** Send/receive/delete up to 10 messages per request (more efficient)  
**Message attributes:** Metadata (don't affect body), structured data

---

# 19. SNS - Complete Deep Dive

## 1. Problem Solved
**Before:** Send notification = call each subscriber individually, no fan-out, tight coupling  
**After:** Publish once, delivers to all subscribers, decoupled architecture

## 2. History
**2010:** SNS launches  
**2012:** Mobile push (iOS, Android)  
**2019:** FIFO topics  
**2020:** Message filtering, data protection

## 3. When to Use
✅ Fan-out (1 message → many consumers)  
✅ Mobile push notifications  
✅ Email/SMS notifications  
✅ Event broadcasting  
✅ Trigger multiple Lambdas from one event  
❌ Point-to-point (use SQS), message persistence (SNS doesn't store), guaranteed delivery without retry logic

## 4. vs Similar
**SNS vs SQS:** SNS=push/pub-sub/no storage, SQS=pull/queue/stored until processed  
**SNS vs EventBridge:** SNS=simple pub-sub, EventBridge=event routing with filtering  
**Standard vs FIFO:** Standard=unlimited throughput/best-effort ordering, FIFO=300 msg/sec/strict ordering (with SQS FIFO subscribers)

## 5. How It Works
Publisher publishes to topic → SNS delivers to all subscribers in parallel (SQS, Lambda, HTTP, email, SMS, mobile) → Each subscriber receives copy → If delivery fails: Retry with backoff → After retries: DLQ (if configured).

## 6. Cost
Publishes: $0.50 per million (first 1M free), Deliveries vary: HTTP $0.60/M, SQS/Lambda $0 (free!), Email $2/100K, SMS varies by country ($0.00645 US)  
Mobile push: $0.50 per million

## 7. Pros and Cons
**Pros:** Fan-out pattern simple, integrates with many services, mobile push built-in, message filtering (subscribers get relevant only), FIFO with SQS FIFO (ordered)  
**Cons:** No message persistence (deliver-and-forget), retry logic limited, no replay (vs Kinesis), SMS expensive

## 8. SAP-C02 Questions
**Q:** One event, multiple consumers → SNS topic with multiple subscriptions  
**Q:** S3 upload notify multiple services → S3 event → SNS → Subscriptions  
**Q:** Ordering required → SNS FIFO topic → SQS FIFO queues  
**Q:** Failed deliveries → DLQ per subscription  
**Q:** Filter messages → Subscription filter policy (JSON)

## 9. Configurations
**Topic:** Standard or FIFO, Display name, Access policy (who can publish/subscribe)  
**Subscriptions:** Protocol (SQS, Lambda, HTTP, email, SMS), Endpoint, Filter policy (optional), DLQ (optional), Delivery retry policy  
**Message attributes:** Key-value metadata for filtering  
**Encryption:** At rest with KMS

## 10. Additional
**Message filtering:** JSON filter policy on subscription, only matching messages delivered, reduces Lambda invocations (cost savings)  
**Fan-out pattern:** SNS → Multiple SQS queues, each queue processed independently, decouples processing  
**Message data protection:** Scan for PII (SSN, credit cards), audit or block, compliance  
**SMS sandbox:** Test mode (verified numbers only), request production access

---

# 20. Kinesis Data Streams

## 1. Problem Solved
**Before:** Process millions of events = database overwhelmed, batch processing only (not real-time)  
**After:** Real-time streaming ingestion, multiple consumers, durable storage

## 2. History
**2013:** Kinesis launches (compete with Kafka)  
**Evolution:** Enhanced fan-out (2018), on-demand mode (2023)

## 3. When to Use
✅ Real-time data ingestion (clickstreams, IoT, logs)  
✅ Multiple consumers need same data  
✅ Ordered processing required  
✅ Replay capability (reprocess old data)  
✅ Build real-time dashboards  
❌ Simple messaging (use SQS), just need to deliver to S3 (use Firehose directly), <1000 events/sec (SQS cheaper)

## 4. vs Similar
**Streams vs Firehose:** Streams=real-time processing/code, Firehose=delivery to destinations/no code  
**Streams vs SQS:** Streams=streaming/multiple consumers/ordering/replay, SQS=messaging/single consumer/delete after process  
**Streams vs Kafka:** Similar (Kinesis inspired by Kafka), Kinesis=managed, Kafka=more features but self-managed (MSK)

## 5. How It Works
Data records sent to stream → Distributed across shards (partition key determines shard) → Stored for 24 hours to 365 days → Multiple consumers read independently → Each shard: 1 MB/sec write, 2 MB/sec read → Enhanced fan-out: 2 MB/sec per consumer (not shared).

## 6. Cost
Shard hour: $0.015/hour = $10.95/month per shard, PUT payload units: $0.014 per million (25 KB units), Enhanced fan-out: $0.015/hour per consumer + $0.013 per GB  
**Example:** 10 shards, 100M records (1 KB each), 2 consumers = $109.50 (shards) + $4 (PUTs) + $21.90 (fan-out) = $135/month

## 7. Pros and Cons
**Pros:** Real-time (sub-second), multiple consumers, replay, ordering per shard, retention (365 days max), scales to millions/sec  
**Cons:** Shard management (calculate shards needed), costs scale with shards, hot shard issues, 1 MB/sec write limit per shard

## 8. SAP-C02 Questions
**Q:** 50K events/sec → Need 50 shards (1K events/sec per shard average)  
**Q:** Multiple consumers → Kinesis Streams (not SQS - single consumer)  
**Q:** Replay last 24 hours → Kinesis retention  
**Q:** Real-time analytics → Kinesis Data Analytics on Streams  
**Q:** Hot shard (one shard overloaded) → Better partition key distribution

## 9. Configurations
**Shards:** Calculate based on throughput (1 MB/sec write per shard), on-demand (auto-scaling) or provisioned (manual)  
**Retention:** 24 hours (default) to 365 days  
**Encryption:** At rest (KMS), in transit (TLS)  
**Enhanced fan-out:** Per consumer registration, dedicated 2 MB/sec throughput

## 10. Additional
**Partition key:** Determines shard (hash-based), good key: user_id (high cardinality), bad key: date (hot shard)  
**Shard splitting/merging:** Increase/decrease capacity, resharding for better distribution  
**Kinesis Client Library:** Helper library for consumers, checkpointing, load balancing  
**Monitoring:** IncomingBytes, IncomingRecords, IteratorAge (how far behind consumers are)

---

# 21. Kinesis Firehose

## 1. Problem Solved
**Before:** Write code to deliver streaming data to S3/Redshift, manage scaling, handle failures  
**After:** Automatic delivery, no code, automatic scaling, built-in transformation

## 2. History
**2015:** Kinesis Firehose launches  
**Evolution:** HTTP endpoints (2020), Dynamic partitioning (2021), multiple destinations

## 3. When to Use
✅ Deliver streams to S3, Redshift, Elasticsearch, HTTP  
✅ No code wanted (just delivery)  
✅ Automatic batching/compression  
✅ Simple transformation needed  
❌ Need complex processing (use Streams + Lambda), multiple consumers (Streams), ordering critical (FIFO not supported)

## 4. vs Similar
**Firehose vs Streams:** Firehose=delivery service/no code, Streams=processing/you write code  
**Often together:** Streams (process) → Firehose (deliver to S3)

## 5. How It Works
Data sent to Firehose → Buffers (time or size based) → Optional transformation (Lambda) → Compresses (gzip, etc.) → Delivers to destination → Retries on failure → Failed records to S3 backup.

## 6. Cost
$0.029 per GB ingested (includes delivery, compression, encryption)  
Data transformation (Lambda): Standard Lambda pricing  
**Example:** 10 TB/month = 10,000 GB × $0.029 = $290/month

## 7. Pros and Cons
**Pros:** Zero code required, auto-scaling, automatic batching, compression, encryption, format conversion (JSON to Parquet)  
**Cons:** No replay, single destination per stream, near real-time (60 sec buffer minimum not instant), no ordering guarantees

## 8. SAP-C02 Questions
**Q:** Streaming data to S3 with no code → Firehose  
**Q:** Transform before S3 → Firehose with Lambda transformation  
**Q:** Compress/convert format → Firehose (Parquet conversion for Athena)  
**Q:** Backup failed records → Firehose S3 error bucket

## 9. Configurations
**Buffer:** Size (1-128 MB) or time (60-900 sec), whichever first triggers delivery  
**Compression:** GZIP, Snappy, ZIP, none  
**Transformation:** Lambda function (modify records)  
**Destination:** S3 (prefix/error prefix), Redshift (via S3 then COPY), Elasticsearch, HTTP endpoint  
**Backup:** All records or failed only to S3

## 10. Additional
**Dynamic partitioning:** Partition S3 output by message attributes (year=2026/month=03/day=20)  
**Format conversion:** JSON → Parquet/ORC (columnar for Athena/Redshift Spectrum)  
**Data delivery frequency:** Near real-time (60-900 sec) based on buffer settings  
**Error handling:** Failed deliveries after retries → S3 error bucket

---

# 22. Step Functions

## 1. Problem Solved
**Before:** Orchestrate Lambda = complex code, manage state manually, error handling difficult, 15-min Lambda limit for long workflows  
**After:** Visual workflows, state management, built-in retry/error handling, up to 1-year duration

## 2. History
**2016:** Step Functions launches  
**2019:** Express workflows (high-throughput)  
**2021:** Workflow Studio (visual designer)

## 3. When to Use
✅ Multi-step workflows  
✅ Human approval steps  
✅ Long-running processes (>15 min)  
✅ Complex error handling/retry  
✅ Parallel processing  
✅ ETL pipelines  
❌ Simple single Lambda (don't need orchestration), extreme throughput >100K exec/sec (Express limits)

## 4. vs Similar
**Step Functions vs Lambda:** Step Functions orchestrates Lambdas, Lambda executes code  
**Standard vs Express:** Standard=2K exec/sec/exactly-once/1 year, Express=100K exec/sec/at-least-once/5 min  
**Step Functions vs Airflow:** Step Functions=AWS-native/serverless, Airflow=self-managed/more features

## 5. How It Works
State machine definition (JSON) → States: Task (call Lambda/service), Choice (if/else), Parallel (concurrent execution), Wait (delay), Map (iterate), Pass (data manipulation) → Transitions between states → Executions tracked (history, audit)

## 6. Cost
Standard: $0.025 per 1,000 state transitions, Express: $1 per million requests + $0.00001667 per GB-second  
**Example:** 100K executions, 10 steps each = 1M transitions = $25/month (Standard)

## 7. Pros and Cons
**Pros:** Visual designer, long duration (1 year), built-in retry/error handling, parallel execution, integrates 200+ AWS services, exactly-once (Standard)  
**Cons:** JSON state machine syntax (complex for beginners), debugging harder than code, Standard throughput limits (2K exec/sec), costs per transition

## 8. SAP-C02 Questions
**Q:** Orchestrate multiple Lambdas → Step Functions  
**Q:** Process >15 minutes → Step Functions (not Lambda)  
**Q:** Parallel processing → Parallel state  
**Q:** Human approval → Step Functions with Task Token (wait for callback)  
**Q:** ETL pipeline → Step Functions orchestrating Glue/Lambda

## 9. Configurations
**States:** Task (invoke Lambda, run Batch, call API), Wait (fixed time or timestamp), Choice (branch based on data), Parallel (concurrent branches), Map (iterate array), Pass (transform JSON), Succeed/Fail (terminal states)  
**Error handling:** Retry (attempts, backoff, errors to catch), Catch (fallback state)  
**Input/output processing:** InputPath, OutputPath, ResultPath (JSON manipulation)

## 10. Additional
**Standard vs Express:** Standard=long duration/audit/exactly-once/$0.025/1K transitions, Express=high-volume/at-least-once/$1/M requests  
**Callback pattern:** Step Functions pauses, external system (human/API) callbacks with task token, resumes execution  
**Service integrations:** Optimized (200+ services), SDK integrations (any AWS API)  
**Map state:** Parallel iterations over array, process 10K items concurrently  
**Wait for task token:** Pause execution indefinitely until callback (.waitForTaskToken)

---

**COMPLETED: 22/30**

Continuing final 8 services...

