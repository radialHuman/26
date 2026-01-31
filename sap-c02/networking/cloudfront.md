# Amazon CloudFront

## What is CloudFront?

Amazon CloudFront is a fast content delivery network (CDN) service that securely delivers data, videos, applications, and APIs to customers globally with low latency and high transfer speeds. It integrates with AWS services and uses edge locations worldwide.

## Why Use CloudFront?

### Key Benefits
- **Global Performance**: 450+ edge locations worldwide
- **Low Latency**: Content cached close to users
- **DDoS Protection**: AWS Shield Standard included
- **Security**: SSL/TLS, signed URLs/cookies, field-level encryption
- **Cost-Effective**: Reduces origin load, lower data transfer costs
- **Programmable**: Lambda@Edge for custom logic
- **Integration**: Works with S3, EC2, ELB, custom origins

### Use Cases
- Website acceleration
- Video streaming (live and on-demand)
- Software distribution
- API acceleration
- Static content delivery
- Dynamic content delivery
- Security and DDoS protection

## Core Concepts

### Distributions

**What**: CloudFront configuration for content delivery

**Types**:

**1. Web Distribution**:
- HTTP/HTTPS content
- Websites, APIs, video streaming
- Most common

**2. RTMP Distribution** (Deprecated):
- Adobe Flash Media Server's RTMP protocol
- Use Web distribution instead

**Distribution Components**:
```
Origin → CloudFront Distribution → Edge Locations → Users
```

### Origins

**Where CloudFront fetches content**

**Supported Origins**:

**1. S3 Bucket**:
```
s3://my-bucket.s3.amazonaws.com
Content: Static files (HTML, CSS, JS, images)
Benefits: 
  - Origin Access Control (OAC) for security
  - Automatic origin failover
  - Versioning support
```

**2. S3 Website Endpoint**:
```
http://my-bucket.s3-website-us-east-1.amazonaws.com
Use: S3 static website with redirects, custom error pages
```

**3. MediaStore/MediaPackage**:
```
Video streaming origins
HLS, DASH, CMAF protocols
```

**4. Application Load Balancer**:
```
alb-12345.us-east-1.elb.amazonaws.com
Use: Dynamic content from EC2/ECS/Lambda
```

**5. EC2 Instance**:
```
ec2-54-123-45-67.compute-1.amazonaws.com
Use: Direct instance access (less common, use ALB)
```

**6. Custom HTTP/HTTPS Server**:
```
api.example.com
Use: On-premises servers, third-party APIs
```

**Multiple Origins**:
```
Distribution can have multiple origins:
  - /images/* → S3 bucket (static)
  - /api/* → ALB (dynamic)
  - /videos/* → MediaStore (streaming)
```

### Edge Locations

**What**: CloudFront cache locations worldwide

**Count**: 450+ edge locations in 90+ cities, 48 countries

**Regional Edge Caches**:
- Larger caches between origin and edge locations
- Longer retention
- Better cache hit rates for less popular content

**How It Works**:
```
1. User requests content
2. Routed to nearest edge location (lowest latency)
3. If cached: Serve from edge (cache hit)
4. If not cached: Fetch from origin, cache at edge (cache miss)
5. Subsequent requests: Served from cache (faster)
```

**TTL (Time To Live)**:
```
Cache-Control: max-age=86400  (24 hours)

After TTL expires:
  - CloudFront checks origin (conditional GET)
  - If unchanged: Extend cache (304 Not Modified)
  - If changed: Update cache with new content (200 OK)
```

## Caching Behavior

### Cache Keys

**What**: Determines uniqueness of cached objects

**Default Cache Key**:
```
Protocol + Domain + Path

http://d111111abcdef8.cloudfront.net/images/cat.jpg
Cache key: /images/cat.jpg
```

**Custom Cache Keys** (Cache Policy):
```
Include in cache key:
  - Query strings: ?color=red&size=large
  - Headers: Accept-Language, User-Agent
  - Cookies: session-id

Example:
  /product.jpg?size=small → Cached separately
  /product.jpg?size=large → Cached separately
```

**Cache Policy Example**:
```
Query Strings: size, color
Headers: Accept-Language
Cookies: None

Requests:
  /product.jpg?size=small&lang=en → Cache entry 1
  /product.jpg?size=large&lang=en → Cache entry 2
  /product.jpg?size=small&lang=fr → Cache entry 3
```

### Cache Behaviors

**What**: Rules for how CloudFront handles requests

**Path Patterns**:
```
Behavior 1: /images/*
  Origin: S3 bucket
  TTL: 1 week
  Compress: Yes

Behavior 2: /api/*
  Origin: ALB
  TTL: 0 (no caching)
  Forward all headers
  Forward cookies

Behavior 3: Default (*)
  Origin: S3 bucket
  TTL: 1 day
```

**Precedence**:
- Most specific path pattern matched first
- Default (*) matched if no other patterns match

**Example**:
```
Request: /images/cat.jpg
  Matches: /images/* (Behavior 1)
  Cache: 1 week

Request: /api/users
  Matches: /api/* (Behavior 2)
  Cache: No caching

Request: /about.html
  Matches: Default (*)
  Cache: 1 day
```

### TTL Settings

**Three TTL Values**:

**1. Minimum TTL**:
- CloudFront caches for at least this long
- Overrides origin headers if lower

**2. Maximum TTL**:
- CloudFront caches for at most this long
- Overrides origin headers if higher

**3. Default TTL**:
- Used if origin doesn't send Cache-Control/Expires headers

**Examples**:
```
Min TTL: 0, Default: 86400, Max: 31536000

Origin sends Cache-Control: max-age=3600:
  CloudFront caches for 3600 seconds (1 hour)

Origin sends no caching headers:
  CloudFront caches for 86400 seconds (default, 24 hours)

Origin sends Cache-Control: max-age=63072000 (2 years):
  CloudFront caches for 31536000 seconds (max, 1 year)
```

**Best Practices**:
```
Static content (images, CSS, JS):
  Max-age: 1 year (31536000)
  Versioned filenames: styles.v123.css

Dynamic content (API responses):
  Cache-Control: no-cache, no-store, must-revalidate
  Or: Min/Default/Max TTL: 0

Semi-dynamic (product listings):
  Max-age: 300 (5 minutes)
  Balance freshness and performance
```

## Cache Invalidation

### What is Invalidation?

**Purpose**: Remove objects from cache before TTL expires

**Use Cases**:
- Content updated (new version deployed)
- Incorrect content cached
- Urgent content removal

### Creating Invalidations

**Paths**:
```
Single file: /images/cat.jpg
Directory: /images/*
All files: /*
```

**Cost**:
- First 1,000 paths/month: Free
- Additional paths: $0.005 per path

**Example**:
```
Invalidation 1: /images/*
  Paths: 1
  Cost: Free

Invalidation 2: /images/cat.jpg, /images/dog.jpg
  Paths: 2
  Cost: Free

Invalidation 3: /css/*, /js/*, /images/*
  Paths: 3
  Cost: Free
```

**Propagation Time**: 10-15 minutes (edge locations updated)

### Versioned Filenames (Better Alternative)

**Instead of Invalidation**:
```
Before: /styles.css (invalidate when updated)

After: /styles.v1.css, /styles.v2.css (new filename each version)
  No invalidation needed
  Instant updates
  Free
```

**Implementation**:
```html
<!-- Old -->
<link href="/styles.css">

<!-- New (with version) -->
<link href="/styles.v123.css">

When styles change: Update HTML to /styles.v124.css
```

**Benefits**:
- Instant propagation (no waiting for invalidation)
- No cost
- No risk of partial invalidations
- Cache hit rate remains high

## Security Features

### Origin Access Control (OAC)

**What**: Restrict S3 bucket access to CloudFront only

**Why**: Prevent direct access to S3, force traffic through CloudFront

**Setup**:
```
1. Create CloudFront distribution with S3 origin
2. Create Origin Access Control
3. Update S3 bucket policy to allow OAC

S3 Bucket Policy:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::123456789012:distribution/EDFDVBD6EXAMPLE"
        }
      }
    }
  ]
}
```

**Result**:
```
Direct S3 access: https://my-bucket.s3.amazonaws.com/cat.jpg → 403 Forbidden
CloudFront access: https://d111111abcdef8.cloudfront.net/cat.jpg → 200 OK
```

**Legacy**: Origin Access Identity (OAI) - use OAC instead

### Signed URLs and Signed Cookies

**Purpose**: Restrict access to content (paid content, private files)

**Signed URLs**:
- One URL per file
- Use: Individual file access

**Signed Cookies**:
- Access multiple files with one cookie
- Use: Multiple files, streaming

**Example** (Signed URL):
```
https://d111111abcdef8.cloudfront.net/private/video.mp4?
  Expires=1643673600&
  Signature=abc123&
  Key-Pair-Id=APKAEXAMPLE

Components:
  - Expires: Unix timestamp (expiration time)
  - Signature: Cryptographic signature
  - Key-Pair-Id: CloudFront key pair ID
```

**Creating Signed URL** (Python):
```python
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
import base64
import json
import time

def create_signed_url(url, key_pair_id, private_key_path, expiration):
    expire_time = int(time.time()) + expiration
    
    policy = {
        "Statement": [{
            "Resource": url,
            "Condition": {
                "DateLessThan": {"AWS:EpochTime": expire_time}
            }
        }]
    }
    
    # Sign policy
    # ... (signing logic)
    
    signed_url = f"{url}?Expires={expire_time}&Signature={signature}&Key-Pair-Id={key_pair_id}"
    return signed_url
```

**Use Case**:
```
Premium video content:
  1. User purchases video
  2. Application generates signed URL (expires in 24 hours)
  3. User accesses video via signed URL
  4. After 24 hours: URL expires, access denied
```

### Field-Level Encryption

**What**: Encrypt specific form fields at edge location

**Use Case**: Protect sensitive data (credit cards, SSN) from origin

**Flow**:
```
User submits form with credit card → Edge location encrypts CC field → 
Origin receives encrypted CC (can't decrypt) → 
Payment processor decrypts (has private key)
```

**Configuration**:
```
1. Create field-level encryption configuration
2. Specify fields to encrypt: credit_card_number, cvv
3. Upload public key
4. Associate with CloudFront distribution

Result:
  credit_card_number encrypted at edge
  Only payment processor can decrypt (has private key)
  Application never sees plaintext credit card
```

### Geo Restriction

**What**: Allow or deny access based on geographic location

**Use Cases**:
- Copyright restrictions
- Licensing agreements
- Compliance (GDPR)

**Configuration**:
```
Whitelist: Allow only specific countries
  Countries: US, CA, MX
  Result: Users in US/CA/MX can access, all others denied

Blacklist: Deny specific countries
  Countries: XX, YY
  Result: Users in XX/YY denied, all others allowed
```

**Detection**: CloudFront uses MaxMind GeoIP database

**Limitation**: Country-level only (not city/region)

### SSL/TLS

**HTTPS Between Users and CloudFront**:

**Option 1: CloudFront Default Domain**:
```
https://d111111abcdef8.cloudfront.net
Certificate: AWS-provided (*.cloudfront.net)
Cost: Free
```

**Option 2: Custom Domain** (Recommended):
```
https://cdn.example.com
Certificate: ACM (AWS Certificate Manager) or imported
Cost: Free (ACM) or $400/month (dedicated IP)
```

**SNI vs Dedicated IP**:
```
SNI (Server Name Indication):
  - Modern browsers only (>99% support)
  - Free
  - Recommended

Dedicated IP:
  - Old browsers (IE6 on Windows XP)
  - $600/month
  - Rarely needed
```

**HTTPS Between CloudFront and Origin**:

**S3 Origin**: Always HTTPS (CloudFront to S3)

**Custom Origin**:
```
Protocol Policy:
  - HTTP Only
  - HTTPS Only (recommended)
  - Match Viewer (http→http, https→https)

Certificate:
  - Must be valid (not self-signed for HTTPS Only)
  - Must match origin domain
  - Can be ACM, third-party, or self-signed (HTTP only)
```

## Lambda@Edge and CloudFront Functions

### CloudFront Functions

**What**: Lightweight JavaScript functions at edge

**Use Cases**:
- Header manipulation
- URL rewrites/redirects
- Request/response modification

**Limits**:
- Max runtime: <1 ms
- Max memory: 2 MB
- JavaScript only (subset of ES6)

**Triggers**:
- Viewer request (before cache lookup)
- Viewer response (before returning to user)

**Example** (Add security headers):
```javascript
function handler(event) {
    var response = event.response;
    response.headers['strict-transport-security'] = {
        value: 'max-age=31536000; includeSubdomains; preload'
    };
    response.headers['x-content-type-options'] = {value: 'nosniff'};
    response.headers['x-frame-options'] = {value: 'DENY'};
    response.headers['x-xss-protection'] = {value: '1; mode=block'};
    return response;
}
```

**Cost**: 
- $0.10 per 1 million invocations
- Very cheap

### Lambda@Edge

**What**: Full Lambda functions at edge locations

**Use Cases**:
- A/B testing
- User authentication
- Image transformation
- Complex logic

**Limits**:
- Max runtime: 30 seconds (viewer triggers), 5 seconds (origin triggers)
- Max memory: 10 GB
- Node.js or Python

**Triggers**:
- Viewer request (before cache)
- Origin request (after cache miss, before origin)
- Origin response (after origin, before caching)
- Viewer response (before returning to user)

**Example** (A/B Testing):
```python
import json
import hashlib

def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    headers = request['headers']
    
    # Determine variant based on user ID
    user_id = headers.get('cloudfront-viewer-address', [{}])[0].get('value', '')
    hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    variant = 'A' if hash_value % 2 == 0 else 'B'
    
    # Rewrite path
    if variant == 'B':
        request['uri'] = request['uri'].replace('/index.html', '/index-variant-b.html')
    
    return request
```

**Cost**:
- $0.60 per 1 million requests
- $0.00005001 per GB-second
- More expensive than CloudFront Functions

### CloudFront Functions vs Lambda@Edge

| Feature | CloudFront Functions | Lambda@Edge |
|---------|---------------------|-------------|
| Runtime | <1 ms | 5-30 seconds |
| Memory | 2 MB | Up to 10 GB |
| Languages | JavaScript | Node.js, Python |
| Network | No | Yes (can call external APIs) |
| File system | No | No |
| Triggers | Viewer req/resp | All 4 triggers |
| Cost | $0.10/M | $0.60/M + compute |
| Use case | Simple, fast | Complex logic |

## Monitoring and Logging

### CloudWatch Metrics

**Standard Metrics** (Free):
- **Requests**: Total requests
- **BytesDownloaded**: Data transferred to users
- **BytesUploaded**: Data uploaded by users
- **ErrorRate**: 4xx and 5xx error percentage
- **TotalErrorRate**: All errors

**Additional Metrics** ($0.01/metric/month):
- **OriginLatency**: Time to get response from origin
- **CacheHitRate**: % of requests served from cache

**Example Alarms**:
```
Alarm: ErrorRate > 5% for 5 minutes
Action: SNS notification to ops team

Alarm: CacheHitRate < 80%
Action: Investigate cache configuration
```

### Access Logs

**What**: Detailed logs of every request

**Fields**:
- Date, time, edge location
- Client IP, user agent
- Request URI, query string
- Response status, bytes sent
- Referrer, cookie
- Cache hit/miss

**Configuration**:
```
Enable logging:
  S3 bucket: my-cloudfront-logs
  Prefix: production/

Log file format:
  production/E1234ABCDEF.2026-01-31-10.a1b2c3d4.gz
```

**Cost**:
- Logging: Free
- S3 storage: Standard S3 pricing

**Analysis**:
```
Amazon Athena:
  Query logs with SQL
  Example: SELECT COUNT(*) FROM logs WHERE status >= 400

Tools:
  - AWS Glue (ETL)
  - Amazon QuickSight (visualization)
  - Third-party log analysis tools
```

### Real-Time Logs

**What**: Logs delivered within seconds (vs hours for access logs)

**Delivery**:
- Kinesis Data Streams
- Real-time processing with Lambda, analytics

**Use Cases**:
- Security monitoring
- Real-time dashboards
- Immediate alerting

**Cost**:
- $0.01 per 1 million log lines

## Performance Optimization

### Compression

**What**: CloudFront compresses objects (Gzip, Brotli)

**Requirements**:
- Request includes Accept-Encoding: gzip or br
- File type compressible (text/html, application/json, etc.)
- File size: 1,000 - 10,000,000 bytes

**Benefits**:
- Faster downloads (smaller files)
- Lower data transfer costs

**Configuration**:
```
Cache behavior → Compress objects automatically: Yes

CloudFront compresses:
  - HTML, CSS, JavaScript
  - JSON, XML
  - SVG

CloudFront doesn't compress:
  - Images (already compressed: JPEG, PNG)
  - Videos
  - PDFs (already compressed)
```

**Example**:
```
Original file: 500 KB JavaScript
Compressed: 100 KB (80% reduction)

Benefits:
  - 5x faster download
  - 80% less data transfer cost
```

### Origin Shield

**What**: Additional caching layer between edge locations and origin

**Benefits**:
- Reduces origin load (fewer requests)
- Improves cache hit ratio
- Lower origin costs

**How It Works**:
```
User → Edge Location → Regional Edge Cache → Origin Shield → Origin

Without Origin Shield:
  100 edge locations → 100 requests to origin (cache miss)

With Origin Shield:
  100 edge locations → Origin Shield → 1 request to origin
  Origin Shield caches, serves to all edge locations
```

**Cost**: $0.005 per 10,000 requests

**When to Use**:
- Expensive origin (on-prem, third-party API)
- Origin can't handle load
- Many edge locations requesting same content

**Example**:
```
Video file (100 MB) requested from 200 edge locations:

Without Origin Shield:
  Origin serves 200 × 100 MB = 20 GB
  Origin load: 200 requests

With Origin Shield:
  Origin serves 1 × 100 MB = 100 MB
  Origin Shield caches, serves to edge locations
  Origin load: 1 request

Savings: 99.5% reduction in origin load
```

### Cache Hit Ratio Optimization

**Strategies**:

**1. Minimize Cache Key Size**:
```
Don't include unnecessary query strings/headers/cookies
Only include what's needed for uniqueness
```

**2. Separate Static and Dynamic**:
```
/static/* → High TTL, no query strings
/api/* → Low/no cache
```

**3. Use Origin Shield**:
```
Additional caching layer
```

**4. Increase TTL**:
```
Static: 1 year
Semi-dynamic: 5 minutes
Dynamic: No cache
```

**Target**: 85-95% cache hit rate

## Cost Optimization

### Price Classes

**What**: Select geographic regions to serve content from

**Classes**:

**Price Class All** (Default):
- All edge locations (450+)
- Best performance
- Highest cost

**Price Class 200**:
- North America, Europe, Asia, Middle East, Africa
- Excludes: South America, Australia
- Lower cost

**Price Class 100**:
- North America, Europe only
- Lowest cost

**Cost Difference**:
```
1 TB data transfer:

Price Class All: ~$85
Price Class 200: ~$85 (same, slight savings in some regions)
Price Class 100: ~$80 (5-10% savings)
```

**When to Use**:
```
Global audience → Price Class All
US/Europe only → Price Class 100 (save 5-10%)
```

### Data Transfer Costs

**Pricing** (us-east-1, simplified):
```
First 10 TB: $0.085/GB
Next 40 TB: $0.080/GB
Next 100 TB: $0.060/GB
Over 150 TB: $0.050/GB

1 TB transfer: 1,000 GB × $0.085 = $85
10 TB transfer: 10,000 GB × $0.085 = $850
200 TB transfer: ~$11,000
```

**Optimization**:

**1. Compression**:
```
500 KB file compressed to 100 KB
Savings: 80% data transfer cost
```

**2. High Cache Hit Rate**:
```
Cache hit rate 90%:
  1000 requests → 900 from cache, 100 from origin
  Origin data transfer: 10% of total
```

**3. Origin Selection**:
```
S3 in same region as CloudFront: No origin data transfer fees
EC2/ALB: Standard data transfer rates apply
```

## Real-World Scenarios

### Scenario 1: Static Website

**Requirements**:
- Global audience
- Fast load times
- SSL/TLS
- Cost-effective

**Solution**:
```
Origin: S3 bucket (static website)
  - HTML, CSS, JavaScript, images
  - S3 website endpoint (for redirects)

CloudFront Distribution:
  - Origin: S3 bucket
  - OAC: Yes (restrict direct S3 access)
  - Compress: Yes
  - TTL: 1 year (versioned filenames)
  - Custom domain: www.example.com
  - ACM certificate: example.com, www.example.com
  - Price class: All (global audience)

Behaviors:
  - Default (*): Cache 1 year, compress

DNS (Route 53):
  - www.example.com ALIAS → CloudFront distribution
  - example.com ALIAS → CloudFront distribution
```

**Cost** (1 TB/month, 10M requests):
```
S3 storage: 10 GB × $0.023 = $0.23/month
S3 requests: 10M × $0.0004/1000 = $4/month
CloudFront data transfer: 1,000 GB × $0.085 = $85/month
CloudFront requests: 10M × $0.0075/10,000 = $7.50/month
Total: ~$96.73/month

vs S3 alone (no CloudFront): $0.23 + $4 + ($90 S3 transfer) = $94.23
CloudFront adds $2.50 but provides global CDN, faster performance
```

### Scenario 2: Video Streaming

**Requirements**:
- VOD (Video on Demand)
- Multiple qualities
- Global audience
- Secure (paid content)

**Solution**:
```
Origin: S3 bucket (HLS segments)
  - /videos/movie1/720p/segment001.ts
  - /videos/movie1/1080p/segment001.ts
  - /videos/movie1/playlist.m3u8

CloudFront Distribution:
  - Origin: S3 bucket
  - OAC: Yes
  - Signed cookies: Yes (24-hour expiration)
  - TTL: 1 week (video segments immutable)
  - Price class: All

Workflow:
  1. User purchases movie
  2. Application generates signed cookie (expires in 24 hours)
  3. Video player requests playlist.m3u8 (includes signed cookie)
  4. CloudFront validates cookie, serves playlist
  5. Player requests segments, served from CloudFront cache

Lambda@Edge (Viewer Request):
  - Validate user entitlement
  - Generate signed cookies
  - Redirect unauthorized users
```

**Cost** (100M requests, 500 TB/month):
```
CloudFront data transfer: 500,000 GB × ~$0.055 = $27,500/month
CloudFront requests: 100M × $0.0075/10,000 = $750/month
Signed URLs/Cookies: No additional cost
Total: ~$28,250/month

Much cheaper than serving from origin directly
```

### Scenario 3: Dynamic API Acceleration

**Requirements**:
- REST API (dynamic content)
- Global users
- Low latency
- HTTPS only

**Solution**:
```
Origin: ALB (API Gateway + Lambda)
  - api.example.com

CloudFront Distribution:
  - Origin: ALB
  - Custom domain: api.example.com
  - ACM certificate: api.example.com
  - Protocol: HTTPS only
  - Origin protocol: HTTPS only

Cache Behavior (/api/*):
  - TTL: 0 (no caching for dynamic API)
  - Forward all headers
  - Forward all query strings
  - Forward all cookies
  - Compress: Yes (JSON responses)

Benefits:
  - TLS termination at edge (faster handshake)
  - Compression (smaller responses)
  - DDoS protection (AWS Shield)
  - WAF integration

Lambda@Edge (Origin Request):
  - Add custom headers
  - Transform requests
```

**Cost** (10M requests, 100 GB/month):
```
CloudFront requests: 10M × $0.0075/10,000 = $7.50/month
CloudFront data transfer: 100 GB × $0.085 = $8.50/month
Total: $16/month

vs direct ALB: $0 (but slower, no CDN benefits)
```

### Scenario 4: Multi-Origin Setup

**Requirements**:
- Static content (S3)
- Dynamic content (EC2)
- Video content (MediaStore)
- Different caching strategies

**Solution**:
```
Origins:
  1. S3 bucket: static.example.com (static files)
  2. ALB: api.example.com (dynamic API)
  3. MediaStore: video.example.com (video streaming)

Behaviors:
  /static/*:
    Origin: S3 bucket
    TTL: 1 year
    Compress: Yes
    OAC: Yes
  
  /api/*:
    Origin: ALB
    TTL: 0 (no caching)
    Forward all headers/cookies
    HTTPS only
  
  /videos/*:
    Origin: MediaStore
    TTL: 1 week
    Signed URLs: Yes
    Protocol: HTTPS only
  
  Default (*):
    Origin: S3 bucket
    TTL: 1 day

CloudFront Functions (Viewer Request):
  - Rewrite /old-path to /new-path
  - Add security headers

Lambda@Edge (Origin Response):
  - Image resizing (different dimensions)
  - Watermarking
```

### Scenario 5: Global SaaS Application

**Requirements**:
- Users worldwide
- Low latency everywhere
- Secure
- High availability

**Solution**:
```
Origins:
  - us-east-1: ALB (primary)
  - eu-west-1: ALB (failover)
  - ap-southeast-1: ALB (failover)

CloudFront Distribution:
  - Origin group: us-east-1 (primary), eu-west-1 (secondary)
  - Custom domain: app.example.com
  - WAF: Enabled (SQL injection, XSS protection)
  - Shield Advanced: Enabled (DDoS protection)
  - Price class: All

Origin Failover:
  Primary: us-east-1 ALB
  Secondary: eu-west-1 ALB
  
  Failover criteria:
    - 5xx errors
    - Connection timeout
    - Connection failures
  
  If us-east-1 fails:
    CloudFront automatically routes to eu-west-1

Lambda@Edge (Viewer Request):
  - User authentication (JWT validation)
  - A/B testing
  - Feature flags

Monitoring:
  - CloudWatch alarms: ErrorRate > 1%
  - Real-time logs: Kinesis → Lambda → DynamoDB
  - Access logs: S3 → Athena (analysis)
```

**Cost** (Global, 50M requests, 5 TB/month):
```
CloudFront requests: 50M × $0.0075/10,000 = $375/month
CloudFront data transfer: 5,000 GB × ~$0.065 = $325/month
WAF: $5/month + $1 per million requests = $55/month
Shield Advanced: $3,000/month (optional, only for large-scale)
Lambda@Edge: 50M × $0.60/1M = $30/month
Total: ~$785/month (without Shield Advanced)
```

## Exam Tips (SAP-C02)

### Key Decision Points

**Origin Selection**:
```
Static content → S3 bucket
Dynamic content → ALB/API Gateway
Video streaming → MediaStore/MediaPackage
Custom application → EC2/ALB
```

**Caching Strategy**:
```
Static (images, CSS) → High TTL (1 year)
Semi-dynamic (product pages) → Medium TTL (5-60 minutes)
Dynamic (API, personalized) → No caching (TTL 0)
```

**Security**:
```
Restrict S3 access → OAC (Origin Access Control)
Paid content → Signed URLs/Cookies
DDoS protection → Shield Standard (free, included)
Application firewall → WAF
Geo restrictions → Geo Restriction (whitelist/blacklist)
```

**Performance**:
```
Reduce origin load → High cache hit rate, Origin Shield
Faster downloads → Compression
Global performance → Price Class All
```

**Custom Logic**:
```
Simple (headers, redirects) → CloudFront Functions
Complex (auth, transformation) → Lambda@Edge
```

### Common Scenarios

**"S3 bucket accessible directly, bypass CloudFront"**:
- Enable OAC (Origin Access Control)
- Update S3 bucket policy to allow only CloudFront

**"Low cache hit rate"**:
- Reduce cache key size (fewer query strings/headers)
- Increase TTL
- Use versioned filenames
- Separate static and dynamic content

**"High origin load"**:
- Enable Origin Shield
- Increase TTL
- Improve cache hit rate

**"Need to update content immediately"**:
- Use versioned filenames (best)
- Or: Invalidate cache (slower, costs after 1,000 paths)

**"Restrict content by geography"**:
- Geo Restriction (country-level)
- Or: Lambda@Edge for more granular control

**"Serve different content to different users"**:
- Lambda@Edge with A/B testing
- Cache key includes user segment

**"Reduce costs"**:
- Optimize cache hit rate
- Enable compression
- Use Price Class 100 (if only US/Europe)
- Remove unused behaviors/origins

This comprehensive CloudFront guide covers all aspects for SAP-C02 exam success.
