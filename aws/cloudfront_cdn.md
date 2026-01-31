# Amazon CloudFront & CDN: Global Content Delivery

## Table of Contents
1. [CDN Fundamentals & History](#cdn-fundamentals--history)
2. [CloudFront Architecture](#cloudfront-architecture)
3. [Distributions & Origins](#distributions--origins)
4. [Cache Behaviors](#cache-behaviors)
5. [Origin Access Control](#origin-access-control)
6. [Invalidations & Cache Control](#invalidations--cache-control)
7. [Lambda@Edge & CloudFront Functions](#lambdaedge--cloudfront-functions)
8. [Security & SSL/TLS](#security--ssltls)
9. [Performance Optimization](#performance-optimization)
10. [LocalStack Examples](#localstack-examples)
11. [Production Patterns](#production-patterns)
12. [Interview Questions](#interview-questions)

---

## CDN Fundamentals & History

### What is a CDN?

**Content Delivery Network**: Distributed network of servers that cache and deliver content from locations closer to users.

**Without CDN**:
```
User (Tokyo) → Origin Server (Virginia)
- Distance: 10,000 km
- Latency: 200-300 ms
- Network hops: 20+
- Risk: Single point of failure
```

**With CDN**:
```
User (Tokyo) → Edge Location (Tokyo) → Origin Server (Virginia)
- First request: 200 ms (cache miss, fetch from origin)
- Subsequent requests: 10-20 ms (cache hit from Tokyo edge)
- 10-20x improvement for cached content
```

### Pre-CloudFront Era (Before 2008)

**Problems with Static Origin Servers**:
```
❌ High latency for global users
❌ Origin server overload (all traffic hits one location)
❌ Expensive bandwidth costs
❌ DDoS vulnerability
❌ No geographic redundancy
```

**CDN Options (2000s)**:
```
Akamai:
- Cost: $2,000-$10,000/month minimum
- Complex contracts
- Enterprise-focused

Limelight, Level 3:
- Similar pricing
- Long setup time
- Manual configuration
```

### CloudFront Launch (November 2008)

**Amazon CloudFront**: Global CDN with pay-as-you-go pricing.

**Revolutionary Features**:
```
✅ No minimum commitment ($0.085/GB in US/Europe)
✅ Self-service (create distribution in minutes)
✅ Integrated with S3, EC2, ELB
✅ Dynamic content support (not just static files)
✅ 14 edge locations at launch (now 400+)

First distribution:
aws cloudfront create-distribution \
  --origin-domain-name mybucket.s3.amazonaws.com
```

### Evolution Timeline

```
2008: CloudFront Launch (14 edge locations)
2009: Custom SSL certificates
2010: Streaming distributions (RTMP for video)
2011: Private content (signed URLs)
2012: Geographic restrictions
2013: Custom error pages
2014: WebSocket support
2016: Lambda@Edge (run code at edge locations)
2017: Field-level encryption
2018: CloudFront Functions (lightweight edge compute)
2019: Origin Shield (additional caching layer)
2020: Real-time logs
2021: CloudFront KeyValueStore
2022: Origin Access Control (OAC, replaces OAI)
2023: 400+ edge locations across 90+ cities
2024: Enhanced security with AWS WAF v2 integration
```

### Why CloudFront Exists

**Problem 1: Global Latency**
```
Example: E-commerce site in us-east-1

Without CloudFront:
- User in Sydney: 250 ms latency
- User in London: 100 ms latency
- User in Tokyo: 200 ms latency

With CloudFront:
- User in Sydney: 20 ms (Sydney edge)
- User in London: 15 ms (London edge)
- User in Tokyo: 10 ms (Tokyo edge)

Impact: 10x latency improvement = better conversion rates
Study: 100 ms faster load time = 1% increase in sales
```

**Problem 2: Origin Load**
```
Black Friday scenario:
- 1 million requests for product image
- Without CDN: 1M requests hit origin S3 bucket
  Cost: 1M × $0.0004 = $400

- With CloudFront (95% cache hit):
  - 50K requests to origin (first requests per edge)
  - 950K served from cache
  Origin cost: 50K × $0.0004 = $20
  CloudFront cost: 1M × $0.085/GB ≈ $85
  Total: $105 vs $400 (74% savings + better performance)
```

**Problem 3: DDoS Protection**
```
DDoS attack: 10 million requests/sec

Without CDN:
- All traffic hits origin
- Origin overwhelmed (crashes)
- Downtime: Hours

With CloudFront:
- Distributed across 400+ edge locations
- AWS Shield Standard (free) absorbs attack
- Origin protected
- Downtime: Zero
```

---

## CloudFront Architecture

### Global Infrastructure

**Components**:
```
1. Edge Locations (400+):
   - Cache content close to users
   - Serve 85% of requests from cache
   - Located in major cities worldwide

2. Regional Edge Caches (13):
   - Between edge locations and origin
   - Larger cache (terabytes vs gigabytes)
   - Reduces origin load
   - Located in major AWS regions

3. Origin Servers:
   - S3 buckets
   - EC2 instances
   - ELB/ALB
   - Custom origins (on-premises, other clouds)
```

**Request Flow**:
```
User Request
    ↓
Edge Location (400+ locations)
    ↓ (Cache MISS)
Regional Edge Cache (13 locations)
    ↓ (Cache MISS)
Origin Server (S3, EC2, ALB)
    ↓
Regional Edge Cache (stores copy)
    ↓
Edge Location (stores copy)
    ↓
User (receives response)

Next request from nearby user:
User → Edge Location (Cache HIT) → User (fast!)
```

### Distribution Types

**1. Web Distribution (HTTP/HTTPS)**:
```
Use cases:
✅ Static websites (HTML, CSS, JS, images)
✅ Dynamic content (API responses)
✅ Video streaming (HLS, DASH)
✅ Software downloads

Protocols: HTTP/HTTPS
Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
```

**2. RTMP Distribution (DEPRECATED)**:
```
Legacy: Adobe Flash streaming
Status: Deprecated December 31, 2020
Migration: Use Web distribution with HLS/DASH
```

### Edge Locations vs Regions

**Edge Locations**:
```
Count: 400+
Purpose: Content caching
Services: CloudFront, Route 53, Shield, WAF
NOT full AWS regions (no EC2, RDS, etc.)

Examples:
- Tokyo (5 edge locations)
- London (7 edge locations)
- New York (6 edge locations)
```

**Regional Edge Caches**:
```
Count: 13
Purpose: Intermediate caching layer
Size: Larger than edge locations
TTL: Longer cache retention

Benefit: Reduces origin fetches by 90%
```

---

## Distributions & Origins

### Creating Distribution

**Web Distribution**:
```bash
# Create S3 bucket (origin)
aws s3api create-bucket \
  --bucket my-static-website \
  --region us-east-1

# Upload content
aws s3 sync ./website s3://my-static-website/

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name my-static-website.s3.amazonaws.com \
  --default-root-object index.html
```

**Distribution Configuration** (JSON):
```json
{
  "DistributionConfig": {
    "CallerReference": "unique-string-2024",
    "Comment": "My static website CDN",
    "Enabled": true,
    "DefaultRootObject": "index.html",
    
    "Origins": {
      "Quantity": 1,
      "Items": [{
        "Id": "S3-my-static-website",
        "DomainName": "my-static-website.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }]
    },
    
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-my-static-website",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      },
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      },
      "ForwardedValues": {
        "QueryString": false,
        "Cookies": { "Forward": "none" }
      },
      "MinTTL": 0,
      "DefaultTTL": 86400,
      "MaxTTL": 31536000,
      "Compress": true
    },
    
    "PriceClass": "PriceClass_All",
    "ViewerCertificate": {
      "CloudFrontDefaultCertificate": true
    }
  }
}
```

### Origin Types

**1. S3 Bucket Origin**:
```python
import boto3

cloudfront = boto3.client('cloudfront')

response = cloudfront.create_distribution(
    DistributionConfig={
        'CallerReference': 'my-s3-cdn-2024',
        'Origins': {
            'Quantity': 1,
            'Items': [{
                'Id': 'S3-origin',
                'DomainName': 'my-bucket.s3.us-east-1.amazonaws.com',
                'S3OriginConfig': {
                    'OriginAccessIdentity': ''  # Use OAC instead (newer)
                },
                'ConnectionAttempts': 3,
                'ConnectionTimeout': 10,
                'OriginShield': {
                    'Enabled': True,
                    'OriginShieldRegion': 'us-east-1'
                }
            }]
        },
        # ... other config
    }
)

domain_name = response['Distribution']['DomainName']
print(f"Distribution: {domain_name}")  # d111111abcdef8.cloudfront.net
```

**2. Custom Origin (ALB/EC2)**:
```python
{
    'Id': 'ALB-origin',
    'DomainName': 'my-alb-123456.us-east-1.elb.amazonaws.com',
    'CustomOriginConfig': {
        'HTTPPort': 80,
        'HTTPSPort': 443,
        'OriginProtocolPolicy': 'https-only',  # http-only, https-only, match-viewer
        'OriginSslProtocols': {
            'Quantity': 3,
            'Items': ['TLSv1.2', 'TLSv1.1', 'TLSv1']
        },
        'OriginReadTimeout': 30,
        'OriginKeepaliveTimeout': 5
    },
    'CustomHeaders': {
        'Quantity': 1,
        'Items': [{
            'HeaderName': 'X-Custom-Header',
            'HeaderValue': 'secret-value'
        }]
    }
}
```

**3. Multiple Origins**:
```python
# Use case: Different origins for different content types

{
    'Origins': {
        'Quantity': 3,
        'Items': [
            {
                'Id': 'S3-images',
                'DomainName': 'images.s3.amazonaws.com',
                'S3OriginConfig': {}
            },
            {
                'Id': 'S3-videos',
                'DomainName': 'videos.s3.amazonaws.com',
                'S3OriginConfig': {}
            },
            {
                'Id': 'ALB-api',
                'DomainName': 'api.example.com',
                'CustomOriginConfig': {
                    'HTTPSPort': 443,
                    'OriginProtocolPolicy': 'https-only'
                }
            }
        ]
    }
}
```

### Origin Groups (Failover)

**High Availability Setup**:
```python
{
    'OriginGroups': {
        'Quantity': 1,
        'Items': [{
            'Id': 'S3-failover-group',
            'FailoverCriteria': {
                'StatusCodes': {
                    'Quantity': 4,
                    'Items': [500, 502, 503, 504]
                }
            },
            'Members': {
                'Quantity': 2,
                'Items': [
                    {'OriginId': 'S3-primary'},
                    {'OriginId': 'S3-backup'}
                ]
            }
        }]
    }
}

# Flow:
# Request → Primary S3 (us-east-1)
#   ↓ (if 5xx error)
# Request → Backup S3 (us-west-2)
```

---

## Cache Behaviors

### Default Cache Behavior

**Configuration**:
```python
{
    'DefaultCacheBehavior': {
        'TargetOriginId': 'S3-origin',
        
        # Viewer Protocol Policy
        'ViewerProtocolPolicy': 'redirect-to-https',  # Options:
        # - allow-all (HTTP and HTTPS)
        # - redirect-to-https (redirect HTTP → HTTPS)
        # - https-only (reject HTTP)
        
        # Allowed Methods
        'AllowedMethods': {
            'Quantity': 7,
            'Items': ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
            'CachedMethods': {
                'Quantity': 3,
                'Items': ['GET', 'HEAD', 'OPTIONS']
            }
        },
        
        # Cache Key Configuration
        'CachePolicyId': '658327ea-f89d-4fab-a63d-7e88639e58f6',  # Managed-CachingOptimized
        
        # Or custom forwarding:
        'ForwardedValues': {
            'QueryString': True,
            'QueryStringCacheKeys': {
                'Quantity': 2,
                'Items': ['product_id', 'category']  # Only cache on these params
            },
            'Headers': {
                'Quantity': 3,
                'Items': ['Accept', 'Accept-Language', 'CloudFront-Viewer-Country']
            },
            'Cookies': {
                'Forward': 'whitelist',  # none, whitelist, all
                'WhitelistedNames': {
                    'Quantity': 1,
                    'Items': ['session_id']
                }
            }
        },
        
        # TTL (Time To Live)
        'MinTTL': 0,              # Minimum cache time
        'DefaultTTL': 86400,      # Default: 24 hours
        'MaxTTL': 31536000,       # Maximum: 1 year
        
        # Compression
        'Compress': True,  # Gzip/Brotli compression
        
        # Function Associations
        'FunctionAssociations': {
            'Quantity': 2,
            'Items': [
                {
                    'EventType': 'viewer-request',
                    'FunctionARN': 'arn:aws:cloudfront::123456789012:function/auth-check'
                },
                {
                    'EventType': 'viewer-response',
                    'FunctionARN': 'arn:aws:cloudfront::123456789012:function/add-security-headers'
                }
            ]
        }
    }
}
```

### Path Pattern Behaviors

**Route Different Paths to Different Origins**:
```python
{
    'CacheBehaviors': {
        'Quantity': 3,
        'Items': [
            # API requests (no caching)
            {
                'PathPattern': '/api/*',
                'TargetOriginId': 'ALB-api',
                'ViewerProtocolPolicy': 'https-only',
                'AllowedMethods': {
                    'Quantity': 7,
                    'Items': ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE']
                },
                'CachePolicyId': '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',  # Managed-CachingDisabled
                'OriginRequestPolicyId': 'b689b0a8-53d0-40ab-baf2-68738e2966ac'  # Managed-AllViewerExceptHostHeader
            },
            
            # Images (long caching)
            {
                'PathPattern': '/images/*',
                'TargetOriginId': 'S3-images',
                'ViewerProtocolPolicy': 'redirect-to-https',
                'AllowedMethods': {
                    'Quantity': 2,
                    'Items': ['GET', 'HEAD']
                },
                'MinTTL': 3600,        # 1 hour
                'DefaultTTL': 2592000,  # 30 days
                'MaxTTL': 31536000,     # 1 year
                'Compress': True
            },
            
            # Videos (streaming)
            {
                'PathPattern': '/videos/*.m3u8',
                'TargetOriginId': 'S3-videos',
                'ViewerProtocolPolicy': 'https-only',
                'SmoothStreaming': False,
                'DefaultTTL': 86400,
                'Compress': False  # Already compressed
            }
        ]
    }
}
```

### Cache Policies (Managed)

**AWS Managed Cache Policies**:
```python
# 1. CachingOptimized (recommended for S3)
'CachePolicyId': '658327ea-f89d-4fab-a63d-7e88639e58f6'
# - TTL: 1 day
# - Caches based on: none (ignores query strings, headers, cookies)
# - Use for: Static assets

# 2. CachingOptimizedForUncompressedObjects
'CachePolicyId': 'b2884449-e4de-46a7-ac36-70bc7f1ddd6d'
# - Same as above but no compression
# - Use for: Already compressed files (videos, zip)

# 3. CachingDisabled
'CachePolicyId': '4135ea2d-6df8-44a3-9df3-4b5a84be39ad'
# - TTL: 0 (no caching)
# - Use for: Dynamic content, APIs

# 4. Elemental-MediaPackage
'CachePolicyId': '08627262-05a9-4f76-9ded-b50ca2e3a84f'
# - Optimized for video streaming
```

**Custom Cache Policy**:
```python
cloudfront.create_cache_policy(
    CachePolicyConfig={
        'Name': 'MyCustomCachePolicy',
        'MinTTL': 1,
        'MaxTTL': 31536000,
        'DefaultTTL': 86400,
        'ParametersInCacheKeyAndForwardedToOrigin': {
            'EnableAcceptEncodingGzip': True,
            'EnableAcceptEncodingBrotli': True,
            'QueryStringsConfig': {
                'QueryStringBehavior': 'whitelist',
                'QueryStrings': {
                    'Quantity': 2,
                    'Items': ['product_id', 'page']
                }
            },
            'HeadersConfig': {
                'HeaderBehavior': 'whitelist',
                'Headers': {
                    'Quantity': 2,
                    'Items': ['CloudFront-Viewer-Country', 'Accept-Language']
                }
            },
            'CookiesConfig': {
                'CookieBehavior': 'none'
            }
        }
    }
)
```

---

## Origin Access Control

### Problem: Public S3 Buckets

**Without OAC**:
```
S3 Bucket (Public)
    ↑
Users can bypass CloudFront and access S3 directly:
- https://my-bucket.s3.amazonaws.com/secret.pdf
- No CloudFront benefits (caching, security, analytics)
- Higher S3 costs (no edge caching)
```

### Origin Access Control (OAC)

**Restrict S3 Access to CloudFront Only**:

**Step 1: Create OAC**:
```python
import boto3

cloudfront = boto3.client('cloudfront')

oac_response = cloudfront.create_origin_access_control(
    OriginAccessControlConfig={
        'Name': 'MyS3OAC',
        'Description': 'OAC for S3 bucket access',
        'SigningProtocol': 'sigv4',
        'SigningBehavior': 'always',
        'OriginAccessControlOriginType': 's3'
    }
)

oac_id = oac_response['OriginAccessControl']['Id']
```

**Step 2: Attach OAC to Distribution**:
```python
cloudfront.create_distribution(
    DistributionConfig={
        'Origins': {
            'Quantity': 1,
            'Items': [{
                'Id': 'S3-origin',
                'DomainName': 'my-bucket.s3.us-east-1.amazonaws.com',
                'OriginAccessControlId': oac_id,
                'S3OriginConfig': {
                    'OriginAccessIdentity': ''  # Leave empty for OAC
                }
            }]
        },
        # ... rest of config
    }
)
```

**Step 3: Update S3 Bucket Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontServicePrincipal",
    "Effect": "Allow",
    "Principal": {
      "Service": "cloudfront.amazonaws.com"
    },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::my-bucket/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::123456789012:distribution/E1234567890ABC"
      }
    }
  }]
}
```

**Result**:
```
Direct S3 access: https://my-bucket.s3.amazonaws.com/file.pdf → 403 Forbidden
CloudFront access: https://d111111abcdef8.cloudfront.net/file.pdf → 200 OK
```

### Origin Access Identity (OAI) - Legacy

**OAI vs OAC**:
```
OAI (Old):
❌ Doesn't support SSE-KMS encrypted objects
❌ Limited to S3 origins
❌ Uses AWS Signature Version 2 (older)

OAC (New, 2022):
✅ Supports SSE-KMS
✅ Better security (SigV4)
✅ Enhanced CloudTrail logging
✅ Recommended by AWS

Migration: Update distributions to use OAC instead of OAI
```

---

## Invalidations & Cache Control

### Cache Invalidation

**Problem**: Updated file on origin, but CloudFront serves old version from cache.

**Solution 1: Invalidate Cache**:
```bash
# Invalidate single file
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/images/logo.png"

# Invalidate multiple files
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/images/*" "/css/*"

# Invalidate everything (expensive!)
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

**Cost**:
```
First 1,000 invalidations/month: Free
Additional: $0.005 per path

Example:
- Invalidate 5,000 paths = (5,000 - 1,000) × $0.005 = $20

Tip: Use wildcard patterns to reduce cost
  /images/product1.jpg, /images/product2.jpg → 2 paths
  /images/* → 1 path (same result)
```

**Python Example**:
```python
import boto3
import time

cloudfront = boto3.client('cloudfront')

def invalidate_cache(distribution_id, paths):
    """Create CloudFront invalidation"""
    response = cloudfront.create_invalidation(
        DistributionId=distribution_id,
        InvalidationBatch={
            'Paths': {
                'Quantity': len(paths),
                'Items': paths
            },
            'CallerReference': f'invalidation-{int(time.time())}'
        }
    )
    
    invalidation_id = response['Invalidation']['Id']
    print(f"Created invalidation: {invalidation_id}")
    
    # Wait for invalidation to complete
    waiter = cloudfront.get_waiter('invalidation_completed')
    waiter.wait(
        DistributionId=distribution_id,
        Id=invalidation_id
    )
    print("Invalidation completed")

# Usage
invalidate_cache('E1234567890ABC', ['/images/*', '/css/style.css'])
```

**Solution 2: Versioned File Names (Recommended)**:
```
Instead of:
  /images/logo.png (update same filename)

Use versioning:
  /images/logo-v1.png
  /images/logo-v2.png
  /images/logo-v3.png

Or cache-busting:
  /images/logo.png?v=1
  /images/logo.png?v=2
  
Benefits:
✅ No invalidation cost
✅ Instant updates
✅ Rollback capability
✅ No cache wait time
```

### Cache-Control Headers

**S3 Object Metadata**:
```python
import boto3

s3 = boto3.client('s3')

# Upload with cache control
s3.put_object(
    Bucket='my-bucket',
    Key='images/logo.png',
    Body=open('logo.png', 'rb'),
    ContentType='image/png',
    CacheControl='max-age=86400, public'  # 24 hours
)

# Different caching strategies:

# Static assets (long cache)
CacheControl='max-age=31536000, immutable'  # 1 year, never revalidate

# Dynamic content (short cache)
CacheControl='max-age=300, must-revalidate'  # 5 minutes

# No caching
CacheControl='no-store, no-cache'

# Proxy caching only
CacheControl='private, max-age=0'
```

**Cache-Control Directives**:
```
max-age=<seconds>: How long to cache (e.g., 86400 = 24 hours)
s-maxage=<seconds>: CDN cache time (overrides max-age for CDNs)
public: Can be cached by any cache (CDN, browser)
private: Only browser can cache (not CDN)
no-cache: Must revalidate with origin before using
no-store: Don't cache at all
must-revalidate: Revalidate stale cache with origin
immutable: Never revalidate (perfect for versioned assets)
```

**Example Header Configuration**:
```python
# index.html (always fresh)
response.headers['Cache-Control'] = 'no-cache, must-revalidate'

# logo-v123.png (cache forever)
response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'

# api/data.json (cache 5 min in browser, 1 hour in CDN)
response.headers['Cache-Control'] = 'public, max-age=300, s-maxage=3600'
```

### ETag & If-None-Match

**Conditional Requests**:
```
1. Client requests /style.css
2. CloudFront returns:
   ETag: "abc123"
   Cache-Control: max-age=3600

3. After 1 hour, client requests again with:
   If-None-Match: "abc123"

4. CloudFront checks origin:
   - ETag unchanged → 304 Not Modified (no body)
   - ETag changed → 200 OK (new content)

Benefit: Save bandwidth for unchanged files
```

---

## Lambda@Edge & CloudFront Functions

### Comparison

| Feature | CloudFront Functions | Lambda@Edge |
|---------|---------------------|-------------|
| **Runtime** | JavaScript (ECMAScript 5.1) | Node.js, Python |
| **Execution Location** | All edge locations (400+) | Regional edge caches (13) |
| **Max Execution Time** | <1 ms | 5 sec (viewer), 30 sec (origin) |
| **Max Memory** | 2 MB | 128-10,240 MB |
| **Max Package Size** | 10 KB | 1 MB (viewer), 50 MB (origin) |
| **Pricing** | $0.10 per 1M invocations | $0.60 per 1M invocations + duration |
| **Use Cases** | Simple transforms, auth | Complex logic, API calls |
| **Network Access** | No | Yes |
| **File System** | No | Yes (/tmp) |

### CloudFront Functions

**Use Cases**:
- URL rewrites/redirects
- Header manipulation
- Simple authorization
- A/B testing

**Example 1: Redirect HTTP to HTTPS**:
```javascript
function handler(event) {
    var request = event.request;
    var headers = request.headers;
    
    // Check if viewer used HTTP
    if (headers['cloudfront-forwarded-proto'] && 
        headers['cloudfront-forwarded-proto'].value === 'http') {
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                'location': { value: 'https://' + headers.host.value + request.uri }
            }
        };
    }
    
    return request;
}
```

**Example 2: Add Security Headers**:
```javascript
function handler(event) {
    var response = event.response;
    var headers = response.headers;
    
    // Add security headers
    headers['strict-transport-security'] = { 
        value: 'max-age=63072000; includeSubdomains; preload' 
    };
    headers['x-content-type-options'] = { value: 'nosniff' };
    headers['x-frame-options'] = { value: 'DENY' };
    headers['x-xss-protection'] = { value: '1; mode=block' };
    headers['content-security-policy'] = { 
        value: "default-src 'self'; script-src 'self' 'unsafe-inline';" 
    };
    
    return response;
}
```

**Example 3: URL Rewrite (SPA Routing)**:
```javascript
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Rewrite /product/123 → /index.html
    // (Let React Router handle routing)
    if (!uri.includes('.')) {
        request.uri = '/index.html';
    }
    
    return request;
}
```

**Example 4: A/B Testing**:
```javascript
function handler(event) {
    var request = event.request;
    var headers = request.headers;
    
    // 50/50 split based on cookie
    var experimentCookie = headers.cookie && 
                          headers.cookie.value.match(/experiment=([AB])/);
    
    if (!experimentCookie) {
        // New user: assign randomly
        var variant = Math.random() < 0.5 ? 'A' : 'B';
        return {
            statusCode: 302,
            headers: {
                'location': { value: request.uri },
                'set-cookie': { 
                    value: `experiment=${variant}; Path=/; Max-Age=86400` 
                }
            }
        };
    }
    
    var variant = experimentCookie[1];
    
    // Route to different origin based on variant
    if (variant === 'B') {
        request.uri = '/variant-b' + request.uri;
    }
    
    return request;
}
```

**Deploy CloudFront Function**:
```python
import boto3

cloudfront = boto3.client('cloudfront')

# Create function
with open('function.js', 'r') as f:
    function_code = f.read()

response = cloudfront.create_function(
    Name='AddSecurityHeaders',
    FunctionConfig={
        'Comment': 'Add security headers to all responses',
        'Runtime': 'cloudfront-js-1.0'
    },
    FunctionCode=function_code.encode('utf-8')
)

function_arn = response['FunctionSummary']['FunctionARN']

# Publish function
cloudfront.publish_function(
    Name='AddSecurityHeaders',
    IfMatch=response['ETag']
)

# Associate with distribution
cloudfront.update_distribution(
    Id='E1234567890ABC',
    DistributionConfig={
        'DefaultCacheBehavior': {
            'FunctionAssociations': {
                'Quantity': 1,
                'Items': [{
                    'EventType': 'viewer-response',
                    'FunctionARN': function_arn
                }]
            },
            # ... rest of config
        }
    },
    IfMatch='ETAG'
)
```

### Lambda@Edge

**Use Cases**:
- Complex authentication (OAuth, JWT)
- Dynamic image resizing
- Origin selection
- SEO optimization
- Bot detection

**Example 1: JWT Authentication**:
```python
import json
import jwt
import os

SECRET_KEY = os.environ['JWT_SECRET']

def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    headers = request['headers']
    
    # Extract JWT from Authorization header
    auth_header = headers.get('authorization', [{}])[0].get('value', '')
    
    if not auth_header.startswith('Bearer '):
        return unauthorized_response()
    
    token = auth_header.replace('Bearer ', '')
    
    try:
        # Verify JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        
        # Add user info to custom header
        request['headers']['x-user-id'] = [{'key': 'X-User-Id', 'value': payload['user_id']}]
        
        return request
    
    except jwt.ExpiredSignatureError:
        return unauthorized_response('Token expired')
    except jwt.InvalidTokenError:
        return unauthorized_response('Invalid token')

def unauthorized_response(message='Unauthorized'):
    return {
        'status': '401',
        'statusDescription': 'Unauthorized',
        'headers': {
            'www-authenticate': [{'key': 'WWW-Authenticate', 'value': 'Bearer'}]
        },
        'body': json.dumps({'error': message})
    }
```

**Example 2: Dynamic Image Resizing**:
```python
import boto3
from PIL import Image
import io

s3 = boto3.client('s3')

def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    uri = request['uri']
    
    # Parse resize parameters from URI: /images/photo.jpg?w=300&h=200
    querystring = request.get('querystring', '')
    params = dict(param.split('=') for param in querystring.split('&') if '=' in param)
    
    width = int(params.get('w', 0))
    height = int(params.get('h', 0))
    
    if not width and not height:
        return request  # No resize needed
    
    # Fetch original image from S3
    bucket = 'my-images'
    key = uri[1:]  # Remove leading /
    
    try:
        obj = s3.get_object(Bucket=bucket, Key=key)
        image_data = obj['Body'].read()
        
        # Resize image
        img = Image.open(io.BytesIO(image_data))
        
        if width and height:
            img = img.resize((width, height), Image.LANCZOS)
        elif width:
            ratio = width / img.width
            img = img.resize((width, int(img.height * ratio)), Image.LANCZOS)
        else:
            ratio = height / img.height
            img = img.resize((int(img.width * ratio), height), Image.LANCZOS)
        
        # Convert to bytes
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)
        
        # Return resized image
        return {
            'status': '200',
            'headers': {
                'content-type': [{'key': 'Content-Type', 'value': 'image/jpeg'}],
                'cache-control': [{'key': 'Cache-Control', 'value': 'max-age=86400'}]
            },
            'body': buffer.read().encode('base64'),
            'bodyEncoding': 'base64'
        }
    
    except Exception as e:
        print(f"Error: {e}")
        return request  # Fallback to original request
```

**Example 3: Origin Selection (A/B Testing Origins)**:
```python
import random

def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    headers = request['headers']
    
    # Check cookie for existing assignment
    cookie = headers.get('cookie', [{}])[0].get('value', '')
    
    if 'origin=B' in cookie:
        origin = 'origin-b.example.com'
    elif 'origin=A' in cookie:
        origin = 'origin-a.example.com'
    else:
        # New user: 80/20 split
        origin = 'origin-b.example.com' if random.random() < 0.2 else 'origin-a.example.com'
    
    # Update request origin
    request['origin'] = {
        'custom': {
            'domainName': origin,
            'port': 443,
            'protocol': 'https',
            'path': '',
            'sslProtocols': ['TLSv1.2'],
            'readTimeout': 30,
            'keepaliveTimeout': 5,
            'customHeaders': {}
        }
    }
    
    return request
```

**Deploy Lambda@Edge**:
```bash
# Must be deployed in us-east-1 for Lambda@Edge
aws lambda create-function \
  --region us-east-1 \
  --function-name ImageResize \
  --runtime python3.11 \
  --role arn:aws:iam::123456789012:role/lambda-edge-role \
  --handler index.lambda_handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512

# Publish version (required for Lambda@Edge)
aws lambda publish-version \
  --function-name ImageResize

# Associate with CloudFront
aws cloudfront update-distribution \
  --id E1234567890ABC \
  --distribution-config file://distribution.json

# distribution.json:
{
  "DefaultCacheBehavior": {
    "LambdaFunctionAssociations": {
      "Quantity": 1,
      "Items": [{
        "EventType": "origin-request",
        "LambdaFunctionARN": "arn:aws:lambda:us-east-1:123456789012:function:ImageResize:1"
      }]
    }
  }
}
```

### Event Types

**4 Event Triggers**:
```
1. Viewer Request:
   User → CloudFront → [Lambda] → Origin
   - URL rewrite, auth, A/B testing
   - Can modify request before cache lookup

2. Origin Request:
   CloudFront (cache miss) → [Lambda] → Origin
   - Dynamic origin selection
   - Add headers before origin request

3. Origin Response:
   Origin → [Lambda] → CloudFront
   - Modify response before caching
   - Generate dynamic content

4. Viewer Response:
   CloudFront → [Lambda] → User
   - Add headers (security)
   - Modify response before sending to user
```

---

## Security & SSL/TLS

### HTTPS Configuration

**SSL/TLS Certificate Options**:

**1. CloudFront Default Certificate** (Free):
```
Domain: d111111abcdef8.cloudfront.net
Certificate: *.cloudfront.net (AWS managed)
Cost: Free

Limitation: Ugly domain name
```

**2. Custom SSL Certificate** (ACM):
```bash
# Request certificate in ACM (must be in us-east-1)
aws acm request-certificate \
  --domain-name www.example.com \
  --subject-alternative-names example.com \
  --validation-method DNS \
  --region us-east-1

# Validate via DNS (add CNAME record)
# ... wait for validation ...

# Attach to CloudFront
aws cloudfront update-distribution \
  --id E1234567890ABC \
  --distribution-config '{
    "ViewerCertificate": {
      "ACMCertificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/abc-123",
      "SSLSupportMethod": "sni-only",
      "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "Aliases": {
      "Quantity": 2,
      "Items": ["example.com", "www.example.com"]
    }
  }'

# Update Route 53 to point to CloudFront
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.example.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d111111abcdef8.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

**SSL/TLS Protocols**:
```
Minimum Protocol Version:
- TLSv1 (legacy, insecure)
- TLSv1.1 (deprecated)
- TLSv1.2_2018 (recommended minimum)
- TLSv1.2_2021 (best security)
- TLSv1.3 (latest, fastest)

Recommendation: TLSv1.2_2021 or TLSv1.3
```

### Field-Level Encryption

**Encrypt Sensitive Data at Edge**:
```python
# Use case: Encrypt credit card numbers before sending to origin

# Create public key
cloudfront.create_public_key(
    PublicKeyConfig={
        'Name': 'CreditCardEncryptionKey',
        'EncodedKey': '-----BEGIN PUBLIC KEY-----\nMIIBIjA...\n-----END PUBLIC KEY-----',
        'CallerReference': 'key-2024'
    }
)

# Create field-level encryption profile
cloudfront.create_field_level_encryption_profile(
    FieldLevelEncryptionProfileConfig={
        'Name': 'EncryptCreditCards',
        'EncryptionEntities': {
            'Quantity': 1,
            'Items': [{
                'PublicKeyId': 'K1234567890ABC',
                'ProviderId': 'MyProvider',
                'FieldPatterns': {
                    'Quantity': 1,
                    'Items': ['creditCardNumber']
                }
            }]
        }
    }
)

# Flow:
# 1. User submits form with credit card
# 2. CloudFront encrypts creditCardNumber field with public key
# 3. Origin receives encrypted value
# 4. Origin decrypts with private key (stored in KMS)
```

### Geo Restrictions

**Block/Allow Countries**:
```python
cloudfront.update_distribution(
    Id='E1234567890ABC',
    DistributionConfig={
        'Restrictions': {
            'GeoRestriction': {
                'RestrictionType': 'whitelist',  # whitelist, blacklist, none
                'Quantity': 3,
                'Items': ['US', 'CA', 'GB']  # ISO 3166-1 country codes
            }
        }
    }
)

# Blacklist example (block specific countries)
'GeoRestriction': {
    'RestrictionType': 'blacklist',
    'Quantity': 2,
    'Items': ['CN', 'RU']
}
```

### Signed URLs & Cookies

**Restrict Access to Premium Content**:

**Signed URLs** (per-file access):
```python
from datetime import datetime, timedelta
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend
import base64

def generate_signed_url(url, key_pair_id, private_key_path, expiration_minutes=60):
    """Generate CloudFront signed URL"""
    
    # Load private key
    with open(private_key_path, 'rb') as f:
        private_key = serialization.load_pem_private_key(
            f.read(),
            password=None,
            backend=default_backend()
        )
    
    # Expiration time
    expires = datetime.utcnow() + timedelta(minutes=expiration_minutes)
    expires_timestamp = int(expires.timestamp())
    
    # Policy
    policy = {
        "Statement": [{
            "Resource": url,
            "Condition": {
                "DateLessThan": {
                    "AWS:EpochTime": expires_timestamp
                }
            }
        }]
    }
    
    policy_json = json.dumps(policy, separators=(',', ':'))
    policy_b64 = base64.b64encode(policy_json.encode()).decode()
    
    # Signature
    signature = private_key.sign(
        policy_json.encode(),
        padding.PKCS1v15(),
        hashes.SHA1()
    )
    signature_b64 = base64.b64encode(signature).decode()
    
    # Signed URL
    signed_url = f"{url}?Expires={expires_timestamp}&Signature={signature_b64}&Key-Pair-Id={key_pair_id}"
    
    return signed_url

# Usage
signed_url = generate_signed_url(
    url='https://d111111abcdef8.cloudfront.net/premium/video.mp4',
    key_pair_id='K1234567890ABC',
    private_key_path='private_key.pem',
    expiration_minutes=30
)

# User can access video for 30 minutes
# After expiration: 403 Forbidden
```

**Signed Cookies** (multiple files):
```python
def generate_signed_cookies(resource, key_pair_id, private_key_path, expiration_minutes=60):
    """Generate CloudFront signed cookies for multiple files"""
    
    # Same process as signed URLs
    # ... (policy, signature generation) ...
    
    # Return Set-Cookie headers
    return {
        'CloudFront-Expires': expires_timestamp,
        'CloudFront-Signature': signature_b64,
        'CloudFront-Key-Pair-Id': key_pair_id
    }

# Usage in Flask/Django
@app.route('/premium/access')
def grant_premium_access():
    if user.is_premium:
        cookies = generate_signed_cookies(
            resource='https://d111111abcdef8.cloudfront.net/premium/*',
            key_pair_id='K1234567890ABC',
            private_key_path='private_key.pem',
            expiration_minutes=1440  # 24 hours
        )
        
        response = make_response(redirect('/premium/dashboard'))
        for key, value in cookies.items():
            response.set_cookie(key, value, httponly=True, secure=True)
        
        return response
    
    return 'Unauthorized', 401
```

---

## Performance Optimization

### Cache Hit Ratio Improvement

**Metrics**:
```
Cache Hit Ratio = (EdgeRequests - OriginRequests) / EdgeRequests × 100%

Example:
- Edge requests: 10,000
- Origin requests: 1,000
- Hit ratio: (10,000 - 1,000) / 10,000 = 90%

Goal: >85% hit ratio
```

**Strategies**:

**1. Normalize Query Strings**:
```javascript
// Bad: Different URLs for same content
/product?id=123&session=abc&timestamp=1234567890
/product?timestamp=9876543210&id=123&session=xyz

// Good: CloudFront Function to normalize
function handler(event) {
    var request = event.request;
    var querystring = request.querystring;
    
    // Only keep 'id' parameter
    var id = null;
    for (var param in querystring) {
        if (param === 'id') {
            id = querystring[param].value;
            break;
        }
    }
    
    request.querystring = id ? { id: { value: id } } : {};
    return request;
}

// Result: Both URLs become /product?id=123
```

**2. Forward Only Necessary Headers**:
```python
# Bad: Forward all headers (low cache hit)
'ForwardedValues': {
    'Headers': {
        'Quantity': 0,
        'Items': ['*']  # All headers → different cache keys
    }
}

# Good: Forward only required headers
'ForwardedValues': {
    'Headers': {
        'Quantity': 2,
        'Items': ['CloudFront-Viewer-Country', 'Accept-Language']
    }
}
```

**3. Ignore Cookies for Static Content**:
```python
# Static assets cache behavior
{
    'PathPattern': '/static/*',
    'ForwardedValues': {
        'Cookies': {
            'Forward': 'none'  # Don't cache based on cookies
        }
    }
}

# Dynamic content cache behavior
{
    'PathPattern': '/api/*',
    'ForwardedValues': {
        'Cookies': {
            'Forward': 'whitelist',
            'WhitelistedNames': {
                'Quantity': 1,
                'Items': ['session_id']
            }
        }
    }
}
```

### Origin Shield

**Additional Caching Layer**:
```
Without Origin Shield:
User → Edge Location → Origin
          ↓ (cache miss)
User → Edge Location → Origin
          ↓ (cache miss)
Multiple edge locations request same object from origin

With Origin Shield:
User → Edge Location → Origin Shield (us-east-1) → Origin
          ↓ (cache miss)    ↓ (cached)
User → Edge Location → Origin Shield → (no origin request)

Benefit: Reduce origin load by 50-80%
Cost: $0.01 per 10,000 requests
```

**Enable Origin Shield**:
```python
{
    'Origins': {
        'Items': [{
            'OriginShield': {
                'Enabled': True,
                'OriginShieldRegion': 'us-east-1'  # Closest to origin
            }
        }]
    }
}
```

### Compression

**Automatic Gzip/Brotli**:
```python
{
    'DefaultCacheBehavior': {
        'Compress': True  # Enable automatic compression
    }
}

# CloudFront compresses:
# - text/* (HTML, CSS, JS, JSON)
# - application/javascript
# - application/json
# - application/xml

# Requirements:
# 1. File size: 1 KB - 10 MB
# 2. Client sends: Accept-Encoding: gzip, br
# 3. Content-Type matches compressible types

# Result:
# - HTML: 70% size reduction
# - CSS: 80% size reduction
# - JS: 60% size reduction
```

### HTTP/2 & HTTP/3

**Enable Modern Protocols**:
```python
{
    'HttpVersion': 'http2and3'  # http1.1, http2, http2and3
}

# HTTP/2 benefits:
# ✅ Multiplexing (multiple files over one connection)
# ✅ Header compression
# ✅ Server push (deprecated)

# HTTP/3 benefits:
# ✅ QUIC protocol (UDP-based, faster)
# ✅ 0-RTT connection establishment
# ✅ Better packet loss handling
```

---

## LocalStack Examples

### Setup LocalStack CloudFront

**Docker Compose**:
```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3,cloudfront
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
    volumes:
      - "./localstack-data:/tmp/localstack"
```

### Complete Example: Static Website with CloudFront

**1. Create S3 Bucket and Upload Website**:
```python
import boto3
import os

# LocalStack endpoints
s3 = boto3.client('s3', endpoint_url='http://localhost:4566')
cloudfront = boto3.client('cloudfront', endpoint_url='http://localhost:4566')

# Create bucket
bucket = 'my-website'
s3.create_bucket(Bucket=bucket)

# Upload website files
website_files = {
    'index.html': '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>My Website</title>
            <link rel="stylesheet" href="style.css">
        </head>
        <body>
            <h1>Welcome to My Website</h1>
            <img src="images/logo.png" alt="Logo">
            <script src="app.js"></script>
        </body>
        </html>
    ''',
    'style.css': '''
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 { color: #333; }
    ''',
    'app.js': '''
        console.log('Website loaded');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM ready');
        });
    ''',
    'images/logo.png': open('logo.png', 'rb').read()  # Binary file
}

for key, content in website_files.items():
    content_type = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'png': 'image/png'
    }.get(key.split('.')[-1], 'application/octet-stream')
    
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=content if isinstance(content, bytes) else content.encode(),
        ContentType=content_type,
        CacheControl='max-age=86400'
    )

print("✅ Website uploaded to S3")
```

**2. Create CloudFront Distribution**:
```python
# Create distribution
distribution = cloudfront.create_distribution(
    DistributionConfig={
        'CallerReference': 'my-website-2024',
        'Comment': 'Static website CDN',
        'Enabled': True,
        'DefaultRootObject': 'index.html',
        
        'Origins': {
            'Quantity': 1,
            'Items': [{
                'Id': 'S3-my-website',
                'DomainName': f'{bucket}.s3.localhost.localstack.cloud:4566',
                'S3OriginConfig': {
                    'OriginAccessIdentity': ''
                }
            }]
        },
        
        'DefaultCacheBehavior': {
            'TargetOriginId': 'S3-my-website',
            'ViewerProtocolPolicy': 'redirect-to-https',
            'AllowedMethods': {
                'Quantity': 2,
                'Items': ['GET', 'HEAD'],
                'CachedMethods': {
                    'Quantity': 2,
                    'Items': ['GET', 'HEAD']
                }
            },
            'ForwardedValues': {
                'QueryString': False,
                'Cookies': {'Forward': 'none'}
            },
            'MinTTL': 0,
            'DefaultTTL': 86400,
            'MaxTTL': 31536000,
            'Compress': True,
            'TrustedSigners': {
                'Enabled': False,
                'Quantity': 0
            }
        },
        
        'CacheBehaviors': {
            'Quantity': 2,
            'Items': [
                # CSS/JS (long caching)
                {
                    'PathPattern': '*.css',
                    'TargetOriginId': 'S3-my-website',
                    'ViewerProtocolPolicy': 'redirect-to-https',
                    'AllowedMethods': {'Quantity': 2, 'Items': ['GET', 'HEAD']},
                    'ForwardedValues': {'QueryString': False, 'Cookies': {'Forward': 'none'}},
                    'MinTTL': 31536000,
                    'DefaultTTL': 31536000,
                    'MaxTTL': 31536000,
                    'Compress': True,
                    'TrustedSigners': {'Enabled': False, 'Quantity': 0}
                },
                {
                    'PathPattern': '*.js',
                    'TargetOriginId': 'S3-my-website',
                    'ViewerProtocolPolicy': 'redirect-to-https',
                    'AllowedMethods': {'Quantity': 2, 'Items': ['GET', 'HEAD']},
                    'ForwardedValues': {'QueryString': False, 'Cookies': {'Forward': 'none'}},
                    'MinTTL': 31536000,
                    'DefaultTTL': 31536000,
                    'MaxTTL': 31536000,
                    'Compress': True,
                    'TrustedSigners': {'Enabled': False, 'Quantity': 0}
                }
            ]
        },
        
        'PriceClass': 'PriceClass_All'
    }
)

distribution_id = distribution['Distribution']['Id']
domain_name = distribution['Distribution']['DomainName']

print(f"✅ CloudFront distribution created")
print(f"   ID: {distribution_id}")
print(f"   Domain: {domain_name}")
print(f"   URL: http://{domain_name}")
```

**3. Test Distribution**:
```python
import requests
import time

# Wait for distribution to deploy
print("⏳ Waiting for distribution deployment...")
time.sleep(5)

# Test website
url = f"http://{domain_name}"
response = requests.get(url)

print(f"\n📊 Response:")
print(f"   Status: {response.status_code}")
print(f"   Headers:")
for key, value in response.headers.items():
    if key.lower().startswith('x-cache') or key.lower() == 'age':
        print(f"     {key}: {value}")

print(f"\n   Content preview:")
print(response.text[:200])

# Test cache hit
response2 = requests.get(url)
print(f"\n📊 Second request (should be cache hit):")
print(f"   X-Cache: {response2.headers.get('X-Cache', 'N/A')}")
```

### Invalidation Example

```python
import time

def invalidate_distribution(distribution_id, paths):
    """Invalidate CloudFront cache"""
    
    response = cloudfront.create_invalidation(
        DistributionId=distribution_id,
        InvalidationBatch={
            'Paths': {
                'Quantity': len(paths),
                'Items': paths
            },
            'CallerReference': f'invalidation-{int(time.time())}'
        }
    )
    
    invalidation_id = response['Invalidation']['Id']
    status = response['Invalidation']['Status']
    
    print(f"✅ Invalidation created")
    print(f"   ID: {invalidation_id}")
    print(f"   Status: {status}")
    
    return invalidation_id

# Update file
s3.put_object(
    Bucket=bucket,
    Key='index.html',
    Body='<h1>Updated Content</h1>',
    ContentType='text/html'
)

# Invalidate cache
invalidate_distribution(distribution_id, ['/index.html'])

# Or invalidate all
invalidate_distribution(distribution_id, ['/*'])
```

---

## Production Patterns

### Pattern 1: Static Website Hosting

**Architecture**:
```
Route 53 → CloudFront → S3 (static files)
                ↓
            Lambda@Edge (auth)
```

**Implementation**:
```python
# 1. S3 bucket for website
s3.create_bucket(Bucket='www.example.com')
s3.put_bucket_website(
    Bucket='www.example.com',
    WebsiteConfiguration={
        'IndexDocument': {'Suffix': 'index.html'},
        'ErrorDocument': {'Key': 'error.html'}
    }
)

# 2. CloudFront distribution
distribution = cloudfront.create_distribution(
    DistributionConfig={
        'Aliases': {
            'Quantity': 2,
            'Items': ['www.example.com', 'example.com']
        },
        'ViewerCertificate': {
            'ACMCertificateArn': 'arn:aws:acm:us-east-1:123456789012:certificate/abc-123',
            'SSLSupportMethod': 'sni-only',
            'MinimumProtocolVersion': 'TLSv1.2_2021'
        },
        # ... origins, behaviors ...
    }
)

# 3. Route 53 alias record
route53 = boto3.client('route53')
route53.change_resource_record_sets(
    HostedZoneId='Z1234567890ABC',
    ChangeBatch={
        'Changes': [{
            'Action': 'UPSERT',
            'ResourceRecordSet': {
                'Name': 'www.example.com',
                'Type': 'A',
                'AliasTarget': {
                    'HostedZoneId': 'Z2FDTNDATAQYW2',  # CloudFront hosted zone
                    'DNSName': distribution['Distribution']['DomainName'],
                    'EvaluateTargetHealth': False
                }
            }
        }]
    }
)
```

### Pattern 2: API Acceleration

**Architecture**:
```
CloudFront → ALB → API Servers
   ↓
POST/PUT/DELETE (bypass cache)
GET (cache based on query params)
```

**Implementation**:
```python
{
    'Origins': {
        'Items': [{
            'Id': 'ALB-API',
            'DomainName': 'api-lb-123456.us-east-1.elb.amazonaws.com',
            'CustomOriginConfig': {
                'HTTPSPort': 443,
                'OriginProtocolPolicy': 'https-only',
                'OriginReadTimeout': 60,
                'OriginKeepaliveTimeout': 5
            }
        }]
    },
    
    'CacheBehaviors': {
        'Items': [
            # GET /api/products (cache 5 min)
            {
                'PathPattern': '/api/products*',
                'TargetOriginId': 'ALB-API',
                'AllowedMethods': {'Items': ['GET', 'HEAD', 'OPTIONS']},
                'DefaultTTL': 300,
                'ForwardedValues': {
                    'QueryString': True,
                    'QueryStringCacheKeys': {'Items': ['category', 'page', 'limit']}
                }
            },
            
            # POST/PUT/DELETE (no cache)
            {
                'PathPattern': '/api/*',
                'TargetOriginId': 'ALB-API',
                'AllowedMethods': {'Items': ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE']},
                'CachePolicyId': '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',  # CachingDisabled
                'OriginRequestPolicyId': 'b689b0a8-53d0-40ab-baf2-68738e2966ac'  # AllViewerExceptHostHeader
            }
        ]
    }
}
```

### Pattern 3: Video Streaming (HLS)

**Architecture**:
```
CloudFront → S3 (video segments: .m3u8, .ts files)
   ↓
Adaptive bitrate streaming
```

**Implementation**:
```python
# Upload HLS playlist and segments
segments = [
    ('playlist.m3u8', 'application/x-mpegURL'),
    ('segment-1080p.m3u8', 'application/x-mpegURL'),
    ('segment-720p.m3u8', 'application/x-mpegURL'),
    ('segment-1080p-001.ts', 'video/MP2T'),
    ('segment-1080p-002.ts', 'video/MP2T'),
    # ... more segments
]

for key, content_type in segments:
    s3.put_object(
        Bucket='videos',
        Key=f'stream/{key}',
        ContentType=content_type,
        CacheControl='max-age=31536000'  # 1 year for segments
    )

# CloudFront for video delivery
{
    'CacheBehaviors': {
        'Items': [{
            'PathPattern': '/stream/*.m3u8',
            'DefaultTTL': 3,  # Playlist changes frequently
            'MinTTL': 0,
            'MaxTTL': 10
        }, {
            'PathPattern': '/stream/*.ts',
            'DefaultTTL': 86400,  # Segments never change
            'MinTTL': 86400,
            'MaxTTL': 31536000
        }]
    }
}
```

### Pattern 4: Global Application (Multi-Region)

**Architecture**:
```
CloudFront → Origin Group (Primary: us-east-1, Failover: eu-west-1)
```

**Implementation**:
```python
{
    'Origins': {
        'Items': [
            {
                'Id': 'ALB-US',
                'DomainName': 'api-us.example.com'
            },
            {
                'Id': 'ALB-EU',
                'DomainName': 'api-eu.example.com'
            }
        ]
    },
    
    'OriginGroups': {
        'Items': [{
            'Id': 'GlobalOriginGroup',
            'FailoverCriteria': {
                'StatusCodes': {'Items': [500, 502, 503, 504, 404]}
            },
            'Members': {
                'Items': [
                    {'OriginId': 'ALB-US'},
                    {'OriginId': 'ALB-EU'}
                ]
            }
        }]
    },
    
    'DefaultCacheBehavior': {
        'TargetOriginId': 'GlobalOriginGroup'
    }
}
```

---

## Interview Questions

### Conceptual Questions

**Q1: What is a CDN and why would you use one?**
```
A CDN (Content Delivery Network) caches content at edge locations worldwide to:

1. Reduce Latency:
   - Serve content from nearest location (200ms → 20ms)
   
2. Reduce Origin Load:
   - 85%+ cache hit ratio = 85% less origin traffic
   
3. Improve Availability:
   - Origin down → edge still serves cached content
   
4. Save Bandwidth Costs:
   - S3 transfer: $0.09/GB
   - CloudFront: $0.085/GB (cheaper + faster)
   
5. DDoS Protection:
   - Distribute attack across 400+ locations
   - AWS Shield Standard included

Use cases: Static websites, video streaming, software downloads, API acceleration
```

**Q2: CloudFront vs S3 Transfer Acceleration?**
```
CloudFront:
✅ Full CDN features (caching, custom behaviors)
✅ 400+ edge locations
✅ HTTP/HTTPS serving
❌ More complex setup

S3 Transfer Acceleration:
✅ Simple (just enable on bucket)
✅ Optimized for uploads (PUT/POST)
✅ Uses CloudFront edge → S3 backbone
❌ No caching (pass-through)
❌ Only for S3 uploads/downloads

Use CloudFront for: Content delivery, websites, APIs
Use S3 Transfer Acceleration for: Large file uploads from global clients
```

**Q3: Explain cache invalidation strategies**
```
1. Invalidation API (reactive):
   - Cost: $0.005 per path after first 1,000
   - Time: 10-15 minutes to propagate
   - Use: Emergency updates

2. Versioned Filenames (proactive):
   - style-v1.css → style-v2.css
   - Cost: Free
   - Time: Instant
   - Use: Best practice for production

3. Cache-Control Headers:
   - max-age=300 (5 min cache)
   - no-cache (revalidate every time)
   - Use: Dynamic content

4. Query String Versioning:
   - style.css?v=1 → style.css?v=2
   - Cost: Free
   - Use: Quick deployments

Recommendation: Versioned filenames for static assets, short TTL for dynamic content
```

### Design Questions

**Q4: Design a global e-commerce site with CloudFront**
```
Architecture:

1. Frontend:
   Route 53 → CloudFront → S3 (React app)
   - Cache: 1 year (versioned builds)
   - Compression: Enabled
   - HTTP/2: Enabled

2. Product Images:
   CloudFront → S3 (images bucket)
   - Cache: 30 days
   - Lambda@Edge: Resize images on-demand
   - Format: WebP with JPEG fallback

3. API:
   CloudFront → ALB (Multi-AZ) → API Servers
   - GET /products: Cache 5 min
   - POST /orders: No cache
   - Origin Shield: Enabled (reduce API load)

4. Checkout:
   CloudFront → Lambda (serverless)
   - Cache: Disabled
   - Field-level encryption: Credit cards

5. Videos (product demos):
   CloudFront → S3 (HLS streaming)
   - Playlist (.m3u8): Cache 10 sec
   - Segments (.ts): Cache 1 year

Security:
- SSL/TLS: TLSv1.2+
- WAF: Block SQL injection, XSS
- Geo-restriction: Block high-fraud countries
- Signed URLs: Premium content

Cost Optimization:
- PriceClass_100: US/Europe only (cheaper)
- Compression: 70% bandwidth savings
- Origin Shield: 50% origin request reduction

Performance:
- TTL tuning: 90%+ cache hit ratio
- HTTP/3: QUIC for faster connections
- CloudFront Functions: Security headers, URL rewrites
```

**Q5: How would you implement A/B testing with CloudFront?**
```
Solution 1: CloudFront Functions (viewer-request)

function handler(event) {
    var request = event.request;
    var headers = request.headers;
    
    // Check for existing variant cookie
    var cookie = headers.cookie?.value || '';
    var variant = cookie.match(/variant=([AB])/)?.[1];
    
    if (!variant) {
        // Assign 50/50
        variant = Math.random() < 0.5 ? 'A' : 'B';
        
        // Set cookie
        return {
            statusCode: 302,
            headers: {
                'location': {value: request.uri},
                'set-cookie': {value: `variant=${variant}; Path=/; Max-Age=2592000`}
            }
        };
    }
    
    // Route to different S3 prefix
    if (variant === 'B') {
        request.uri = '/variant-b' + request.uri;
    } else {
        request.uri = '/variant-a' + request.uri;
    }
    
    return request;
}

Solution 2: Lambda@Edge (origin-request)

def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    
    # Route to different origins
    variant = get_variant_from_cookie(request)
    
    if variant == 'B':
        request['origin'] = {
            'custom': {
                'domainName': 'variant-b.example.com',
                'port': 443,
                'protocol': 'https'
            }
        }
    
    return request

Solution 3: Weighted Target Groups (AWS)

- Create 2 origins
- Use CloudFront Origin Groups with weighted routing
- 50% traffic to Origin A, 50% to Origin B

Analytics:
- Add custom header: X-Variant
- CloudFront logs → Athena → Analyze conversion rates
```

### Troubleshooting Questions

**Q6: CloudFront is serving stale content. How do you debug?**
```
1. Check TTL:
   - Distribution settings → Cache Behavior → TTL values
   - Origin response headers: Cache-Control, Expires
   - Effective TTL = min(CloudFront TTL, Cache-Control max-age)

2. Check Cache Key:
   - Are query strings/headers/cookies properly configured?
   - Different cache keys = different cached objects
   
   Example:
   /api/product?id=1&session=abc → Cached separately
   /api/product?id=1&session=xyz → Cached separately
   Solution: Ignore 'session' parameter

3. Test Cache:
   curl -I https://d111111abcdef8.cloudfront.net/file.jpg
   
   Response headers:
   X-Cache: Hit from cloudfront (cached)
   X-Cache: Miss from cloudfront (not cached)
   X-Cache: RefreshHit from cloudfront (revalidated)
   Age: 3600 (seconds since cached)

4. Force Refresh:
   - Create invalidation: aws cloudfront create-invalidation
   - Or: curl with Cache-Control: no-cache header

5. Check Origin:
   - Is origin returning correct Cache-Control headers?
   - curl -I https://origin.example.com/file.jpg
   
6. Check Logs:
   - Enable CloudFront access logs
   - Analyze: Cache hit ratio, popular objects, errors
```

**Q7: High origin load despite CloudFront. Why?**
```
Possible causes:

1. Low Cache Hit Ratio:
   - Check: CloudWatch metric CacheHitRate
   - Target: >85%
   - Fix: Normalize cache keys, increase TTL

2. Cache Key Misconfiguration:
   - Problem: Forwarding unnecessary headers/cookies
   - Fix: Forward only required headers
   
   Before: Forward all cookies (1,000 unique cache keys)
   After: Forward only session_id (10 unique cache keys)

3. Short TTL:
   - Problem: DefaultTTL = 60 (1 min)
   - Fix: Increase to 3600 (1 hour) for static content

4. No Origin Shield:
   - Problem: 100 edge locations → 100 origin requests
   - Fix: Enable Origin Shield → 1 origin request

5. POST/PUT Requests:
   - Problem: These bypass cache
   - Fix: Normal behavior (can't cache mutations)

6. Dynamic Content:
   - Problem: Unique response per user
   - Fix: Use cache with query params or separate behaviors

Monitoring:
- CloudWatch: OriginRequests, CacheHitRate
- Set alarm: CacheHitRate < 80%
```

### Cost Optimization Questions

**Q8: How to reduce CloudFront costs?**
```
1. Price Class:
   - PriceClass_All: $0.085/GB (all locations)
   - PriceClass_200: $0.085/GB (excludes expensive regions)
   - PriceClass_100: $0.085/GB (US, Europe only)
   
   Savings: 30-40% by using PriceClass_100

2. Compression:
   - Enable: Compress = True
   - Savings: 70% bandwidth reduction
   
   Example:
   100 GB uncompressed × $0.085 = $8.50
   30 GB compressed × $0.085 = $2.55
   Savings: $5.95 (70%)

3. Origin Shield:
   - Cost: $0.01 per 10,000 requests
   - Savings: 50-80% origin bandwidth reduction
   
   Example:
   Without: 1M origin requests × $0.0004 = $400
   With: 200K origin requests × $0.0004 + Origin Shield = $80 + $100 = $180
   Savings: $220 (55%)

4. Caching Strategy:
   - Increase TTL for static assets
   - 90% cache hit = 90% less origin transfer
   
   Example:
   100 GB total traffic
   90% cache hit = 10 GB origin transfer
   Origin cost: 10 GB × $0.09 = $0.90 (vs $9)

5. Invalidations:
   - Use versioned filenames (free)
   - Avoid /*invalidations (expensive)
   
   Savings: $0.005 per path → $0 with versioning

6. Request Pricing:
   - HTTPS: $0.012 per 10,000 requests
   - HTTP: $0.0075 per 10,000 requests
   - Savings: Use HTTP where security isn't critical (rare)

Total monthly example:
- Traffic: 1 TB
- Without optimization: 1,000 GB × $0.085 + 100M requests = $85 + $120 = $205
- With optimization: 300 GB × $0.085 + 100M requests = $25.50 + $120 = $145.50
- Savings: $59.50/month (29%)
```

**Q9: Design cost-effective video streaming with CloudFront**
```
Architecture:

1. Encoding:
   - MediaConvert: Transcode to multiple bitrates
   - Output: HLS (.m3u8 playlist + .ts segments)
   - Bitrates: 1080p, 720p, 480p, 360p

2. Storage:
   S3 Standard-IA:
   - Cost: $0.0125/GB (vs $0.023 Standard)
   - Access: $0.01/GB (infrequent)
   - Use: Older videos

3. CloudFront Configuration:
   {
     'Origins': [{
       'OriginShield': {'Enabled': True, 'OriginShieldRegion': 'us-east-1'}
     }],
     'CacheBehaviors': [
       # Playlists (short cache)
       {
         'PathPattern': '*.m3u8',
         'DefaultTTL': 10,
         'Compress': False
       },
       # Segments (long cache)
       {
         'PathPattern': '*.ts',
         'DefaultTTL': 86400,
         'Compress': False  # Already compressed
       }
     ],
     'PriceClass': 'PriceClass_100'  # US/Europe only
   }

4. Cost Breakdown (1M users, 5 min video, 2 MB/min):
   
   Video size: 5 min × 2 MB = 10 MB
   Total transfer: 1M × 10 MB = 10 TB
   
   S3 storage: 10 GB (catalog) × $0.023 = $0.23
   S3 transfer: 1 TB (cache misses) × $0.09 = $90
   CloudFront: 10 TB × $0.085 = $850
   Origin Shield: 100M requests × $0.01/10K = $100
   
   Total: $1,040/month
   
   Optimizations:
   - Use S3 Intelligent-Tiering: Save $50/month
   - Enable Origin Shield: Save $400/month (S3 transfer)
   - PriceClass_100: Save $200/month
   
   Optimized: $390/month (62% savings)

5. Monitoring:
   - CloudWatch: Bytes downloaded per region
   - Adjust PriceClass based on usage patterns
```

This comprehensive guide covers CloudFront and CDN concepts critical for FAANG interviews, including architecture, caching strategies, security, performance optimization, and cost management.

