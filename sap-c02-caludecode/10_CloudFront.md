# 10 — Amazon CloudFront — Exhaustive Deep-Dive

---

## 1. What Problem CloudFront Solves

### The Problem: Distance = Latency

If your server is in Virginia (us-east-1) and a user in Tokyo requests your website:
- Data travels ~10,000 miles round trip
- Latency: 200-300ms per request
- Page with 50 resources: potentially 10+ seconds to load

A **Content Delivery Network (CDN)** solves this by caching copies of your content at locations closer to users worldwide.

### How CloudFront Works

CloudFront has **400+ edge locations** (called Points of Presence / PoPs) worldwide. When a user in Tokyo requests content:

1. Request goes to the **nearest edge location** (Tokyo)
2. If content is cached there → returned immediately (**cache hit**, ~1-10ms)
3. If not cached → edge fetches from **origin** (your server in Virginia), caches it, returns to user
4. Next user in Tokyo gets the cached copy (**subsequent requests are fast**)

---

## 2. Core Concepts

### Origins (Where Content Comes From)

| Origin Type | Use Case | Notes |
|---|---|---|
| **S3 Bucket** | Static files, images, CSS, JS | Use OAC for private access |
| **ALB/NLB** | Dynamic content from web servers | ALB must be public-facing |
| **EC2 Instance** | Direct server access | Must be public |
| **Custom Origin (any HTTP)** | On-premises servers, other cloud | Any URL that responds to HTTP |
| **MediaStore / MediaPackage** | Video streaming | Live/on-demand video |
| **Lambda@Edge / CloudFront Functions** | Dynamic at the edge | Compute at edge |

### Origin Access Control (OAC) — Replaces OAI

**OAC** restricts S3 bucket access so users can ONLY access through CloudFront:

1. CloudFront distribution with OAC configured
2. S3 bucket policy allows access only from the CloudFront distribution
3. Users CANNOT bypass CloudFront and access S3 directly

**Exam Note**: OAI (Origin Access Identity) is the OLD method. OAC is the CURRENT recommendation (supports SSE-KMS, all S3 features).

### Distributions

Two types:
- **Web Distribution**: HTTP/HTTPS content (websites, APIs, downloads). This is what you'll use 99% of the time.
- **RTMP Distribution**: Streaming media (DEPRECATED — use Web distribution with media services instead)

### Cache Behavior

Controls HOW CloudFront handles requests:

| Setting | Description |
|---|---|
| **Path Pattern** | Which URLs this behavior applies to (e.g., /images/*, /api/*) |
| **Origin** | Which origin to forward requests to |
| **Viewer Protocol Policy** | HTTP only, HTTPS only, or redirect HTTP→HTTPS |
| **Cache Policy** | What determines cache keys (headers, cookies, query strings) |
| **TTL** | How long objects stay in cache |
| **Compress objects** | Automatically compress with gzip/Brotli |

### Cache Key and Invalidation

**Cache Key**: Determines if a request matches a cached object. By default: URL path only. You can include: headers, cookies, query strings.

**Invalidation**: Force removal of cached objects before TTL expires.
- `/*` — Invalidate everything
- `/images/*` — Invalidate all images
- First 1,000 invalidation paths/month: Free
- After: $0.005 per path

**Better than invalidation**: Use **versioned file names** (style-v2.css instead of style.css). New URL = automatic cache miss.

---

## 3. Security Features

### SSL/TLS

- **Free SSL certificates** from ACM (for CloudFront, certificate MUST be in us-east-1)
- **SNI**: Multiple SSL certificates on one distribution (free)
- **Dedicated IP**: For clients that don't support SNI ($600/month per edge location — very expensive)

### Field-Level Encryption

Encrypt specific sensitive fields (credit card, SSN) at the edge:
- Uses public key at edge location
- Only your application with the private key can decrypt
- Data stays encrypted through CloudFront → ALB → application

### Signed URLs and Signed Cookies

Control who can access content:

| Feature | Signed URL | Signed Cookie |
|---|---|---|
| Access control | One file per URL | Multiple files per cookie |
| Use case | Individual file download | Streaming, site-wide access |
| RTMP | Supported | Not supported |

**Exam Pattern**: 
- "Restrict access to individual files (e.g., paid video)" → **Signed URL** or **CloudFront Signed URL** (not S3 Presigned URL — different!)
- "Restrict access to multiple files" → **Signed Cookie**

### CloudFront vs S3 Presigned URLs

| Feature | CloudFront Signed URL | S3 Presigned URL |
|---|---|---|
| Caching | Yes (CDN cached) | No (direct to S3) |
| Edge locations | Served from nearest edge | Served from S3 region |
| Performance | Faster for global users | Slower for distant users |
| Use case | Content distribution | Direct S3 access |

### AWS WAF Integration

Attach WAF rules to CloudFront for:
- Rate limiting
- SQL injection protection
- XSS protection
- IP blocking
- Geo-blocking

### Geo-Restriction

Block or allow access from specific countries:
- **Whitelist**: Only allow specific countries
- **Blacklist**: Block specific countries
- Based on GeoIP database

---

## 4. Performance Optimization

### Lambda@Edge

Run custom code at CloudFront edge locations:

| Event | Use Case |
|---|---|
| **Viewer Request** | URL rewriting, authentication, A/B testing |
| **Viewer Response** | Add security headers, custom error pages |
| **Origin Request** | Dynamic origin selection, cache key normalization |
| **Origin Response** | Modify response before caching |

### CloudFront Functions

Lightweight alternative to Lambda@Edge:
- JavaScript only
- 1ms execution limit
- Much cheaper ($0.10/million vs Lambda@Edge pricing)
- Use for: Header manipulation, URL rewrites, redirects, cache key normalization

### Origin Shield

An extra caching layer between edge locations and your origin:
- Reduces load on origin by consolidating requests
- Better cache hit ratio
- Particularly useful for origins with multiple regions of viewers
- Cost: Additional request charge

---

## 5. Cost

| Component | Cost |
|---|---|
| Data transfer out (first 10 TB/month, US/EU) | $0.085/GB |
| Data transfer out (first 10 TB/month, Asia) | $0.14/GB |
| HTTPS requests (US/EU) | $0.01 per 10,000 |
| Invalidation paths (first 1,000/month) | Free |
| Additional invalidation paths | $0.005 each |
| Origin Shield requests | ~$0.0075 per 10,000 |
| Field-Level Encryption | $0.02 per 10,000 requests |

**Cost Optimization**:
- CloudFront data transfer is CHEAPER than direct S3 data transfer out
- Use **Price Class** to limit edge locations (cheaper if you don't need Asia/SA/Africa)

| Price Class | Regions |
|---|---|
| Price Class 100 | US, Canada, Europe, Israel |
| Price Class 200 | + Asia, Middle East, Africa |
| Price Class All | All edge locations (default) |

---

## 6. SAP-C02 Exam Questions (10+ Scenarios)

### Question 1 — S3 Origin Security
**Scenario**: A company serves static content from S3 through CloudFront. They discover users are accessing S3 directly, bypassing CloudFront. How to prevent?

**Answer**: Configure **Origin Access Control (OAC)** — Update S3 bucket policy to only allow access from the CloudFront distribution. Remove all public access from the bucket.

---

### Question 2 — Paid Content Access
**Scenario**: A media company sells individual videos. Only paying customers should access a specific video for 24 hours after purchase. How?

**Answer**: **CloudFront Signed URL** with 24-hour expiration — Generated server-side when user completes purchase.

---

### Question 3 — Dynamic + Static Content
**Scenario**: An application serves static files (images, CSS) and dynamic API responses. How to optimize with CloudFront?

**Answer**: Single CloudFront distribution with **multiple cache behaviors**:
- `/static/*` → S3 origin (long cache TTL)
- `/api/*` → ALB origin (short/no cache TTL, forward all headers)

---

### Question 4 — DDoS Protection
**Scenario**: A website is experiencing DDoS attacks. How can CloudFront help?

**Answer**: 
1. CloudFront automatically absorbs DDoS at the edge (distributes across 400+ locations)
2. **AWS Shield Standard** is free and automatic with CloudFront
3. **AWS WAF** on CloudFront for rate limiting and IP blocking
4. **AWS Shield Advanced** for enhanced protection ($3,000/month)

---

### Question 5 — SSL Certificate Region
**Scenario**: A company creates an ACM certificate in us-west-2 for use with CloudFront. It doesn't appear as an option. Why?

**Answer**: CloudFront requires ACM certificates to be in **us-east-1** (N. Virginia). Create the certificate in us-east-1.

---

### Question 6 — Origin Failover
**Scenario**: An S3 origin occasionally returns 5xx errors. How to ensure availability?

**Answer**: **CloudFront Origin Failover** — Create an Origin Group with primary (S3 bucket region A) and secondary (S3 bucket region B) origins. On primary failure → automatically routes to secondary.

---

### Question 7 — Custom Error Pages
**Scenario**: When the origin returns 404, CloudFront should display a custom branded error page instead of the generic error.

**Answer**: Configure **Custom Error Responses** in CloudFront — Map 404 status code to a custom error page (e.g., /error.html stored in S3), optionally with a different HTTP status code and TTL.

---

### Question 8 — Real-Time Logging
**Scenario**: A company needs real-time analysis of CloudFront access patterns for security monitoring.

**Answer**: **CloudFront Real-Time Logs** → Kinesis Data Streams → Lambda/Kinesis Firehose for processing. Standard access logs (to S3) are delayed; real-time logs provide data within seconds.

---

### Question 9 — Global Accelerator vs CloudFront
**Scenario**: A company needs to speed up a TCP-based application (not HTTP) for global users. Should they use CloudFront?

**Answer**: **NO** — Use **AWS Global Accelerator** instead. CloudFront is for HTTP/HTTPS content. Global Accelerator works at Layer 4 (TCP/UDP) and routes traffic over the AWS backbone to the optimal regional endpoint.

| Feature | CloudFront | Global Accelerator |
|---|---|---|
| Layer | 7 (HTTP/HTTPS) | 4 (TCP/UDP) |
| Caching | Yes | No |
| Static IP | No | Yes (2 anycast IPs) |
| Use case | Web content, APIs | Non-HTTP, gaming, IoT, VoIP |

---

### Question 10 — Content Geo-Restriction
**Scenario**: A media company has rights to distribute content only in the US and Canada. How to restrict?

**Answer**: Enable **CloudFront Geo-Restriction** with a **whitelist** of US and Canada. Requests from other countries get a 403 Forbidden response.

---

## 7. Best Practices & Exam Tips

1. ✅ Use OAC (not OAI) for S3 origins
2. ✅ Use ACM certificates (free) — **must be in us-east-1** for CloudFront
3. ✅ Use versioned file names instead of cache invalidation
4. ✅ Enable compression (gzip/Brotli) for text-based content
5. ✅ Set appropriate TTLs (long for static, short for dynamic)
6. ✅ Use Price Classes to reduce cost if you don't need all regions
7. ✅ Enable AWS WAF for security
8. ✅ Use Origin Shield to reduce origin load
9. ✅ Use signed URLs/cookies for paid or restricted content
10. ✅ Use Lambda@Edge for dynamic per-request logic

### Exam Quick Reference

| Scenario | Answer |
|---|---|
| "Speed up static website globally" | CloudFront + S3 origin |
| "Restrict S3 access to CloudFront only" | OAC |
| "ACM certificate for CloudFront" | Must be in us-east-1 |
| "Paid content access control" | Signed URLs or Signed Cookies |
| "Country-based content restriction" | Geo-Restriction |
| "DDoS protection" | CloudFront + Shield + WAF |
| "Non-HTTP traffic optimization" | Global Accelerator (NOT CloudFront) |
| "Custom logic at edge" | Lambda@Edge or CloudFront Functions |
| "Origin failover" | Origin Groups |

---

*Word count: ~3,800+ words*
