# Amazon S3 (Simple Storage Service): Complete Guide

## Table of Contents
1. [History & Evolution](#history--evolution)
2. [Core Concepts & Theory](#core-concepts--theory)
3. [Storage Classes Deep Dive](#storage-classes-deep-dive)
4. [Bucket Policies & Permissions](#bucket-policies--permissions)
5. [Advanced Features](#advanced-features)
6. [Performance Optimization](#performance-optimization)
7. [Security & Encryption](#security--encryption)
8. [LocalStack Implementation](#localstack-implementation)
9. [Production Patterns](#production-patterns)
10. [Interview Questions](#interview-questions)

---

## History & Evolution

### The Problem S3 Solved (2006)

**Before S3**:
```
❌ Expensive SAN/NAS storage hardware
❌ Manual capacity planning and scaling
❌ Complex replication and backup setups
❌ No built-in CDN integration
❌ Upfront capital expenditure
❌ Vendor lock-in for hardware
```

**Amazon's Internal Challenge** (2000-2005):
- Amazon.com needed storage for product images, customer uploads
- Peak season (holidays) required massive over-provisioning
- Hardware depreciation and maintenance costs were high
- Developers waited weeks for storage allocation

**The Innovation** (March 14, 2006):
```
✅ Pay-per-GB, no upfront costs
✅ 11 9's durability (99.999999999%)
✅ Infinite scalability
✅ HTTP API (REST/SOAP)
✅ Global availability
✅ Built-in redundancy
```

**Impact**: S3 became the foundation for AWS and modern cloud storage. It enabled startups to launch without buying expensive storage arrays.

### Evolution Timeline

```
2006: S3 Launch (Standard storage only)
2007: Versioning added
2008: Server-side encryption
2010: S3 Glacier (archival storage)
2012: 1 trillion objects milestone
2014: Event notifications
2015: Object tagging, Storage Class Analysis
2016: Requester Pays
2017: S3 Select (query objects)
2018: S3 Intelligent-Tiering, Block Public Access
2020: S3 Batch Operations
2021: S3 Object Lambda
2023: S3 Express One Zone (single-digit ms latency)
```

---

## Core Concepts & Theory

### Object Storage vs Block Storage vs File Storage

**Block Storage** (EBS):
```
Low-level storage (think hard drive)
Fixed-size blocks (4KB, 16KB)
Requires file system (ext4, NTFS)
Low latency, high IOPS
Best for: Databases, VM disks

Example: /dev/sda1
```

**File Storage** (EFS):
```
Hierarchical file system
POSIX-compliant
Network file sharing (NFS, SMB)
Best for: Shared files, home directories

Example: /mnt/efs/documents/file.txt
```

**Object Storage** (S3):
```
Flat namespace (no directories)
HTTP API (REST)
Metadata-rich
Eventual consistency (now strong consistency)
Best for: Static assets, backups, data lakes

Example: s3://bucket/prefix/file.txt
```

### S3 Data Model

**Bucket**:
```
Globally unique name (DNS compliant)
Region-specific
Unlimited objects
Max 100 buckets per account (soft limit)
```

**Object**:
```
Key: Unique identifier (like file path)
Value: Data (0 bytes to 5 TB)
Version ID: If versioning enabled
Metadata: Key-value pairs (system + user)
Subresources: ACL, tags
```

**Example**:
```
Bucket: my-company-images
Key: products/laptop/image1.jpg
Size: 2.5 MB
Metadata: Content-Type: image/jpeg, Cache-Control: max-age=3600
ETag: "5d41402abc4b2a76b9719d911017c592" (MD5 hash)
```

### Durability vs Availability

**Durability** (Data loss):
```
S3 Standard: 99.999999999% (11 9's)
= 1 object loss every 10,000 years if storing 10M objects

How achieved:
- Data stored across ≥3 Availability Zones
- Each AZ has multiple physically separated data centers
- Checksums verify data integrity
- Automatic repair of corrupted data
```

**Availability** (Access time):
```
S3 Standard: 99.99%
= 52.6 minutes downtime per year

S3 One Zone-IA: 99.5%
= 43.8 hours downtime per year
```

---

## Storage Classes Deep Dive

### 1. S3 Standard
**Use Case**: Frequently accessed data

**Characteristics**:
```
Durability: 11 9's
Availability: 99.99%
AZs: ≥3
Latency: ms
Retrieval fee: None
Min storage: None
Min charge: None
```

**Pricing** (us-east-1, 2024):
```
Storage: $0.023/GB/month
PUT: $0.005/1000 requests
GET: $0.0004/1000 requests
```

**Best for**:
```
✅ Active websites
✅ Content distribution
✅ Mobile/gaming applications
✅ Big data analytics
```

### 2. S3 Intelligent-Tiering
**Use Case**: Unknown or changing access patterns

**How it works**:
```
Monitor access patterns (30-day period)
Automatically moves objects between tiers:

Frequent Access tier (< 30 days no access)
Infrequent Access tier (30-90 days no access)
Archive Instant Access tier (90-180 days)
Archive Access tier (180-365 days)
Deep Archive Access tier (>365 days)
```

**Pricing**:
```
Monitoring: $0.0025/1000 objects
No retrieval fees
No transition fees
Automation cost
```

**Best for**:
```
✅ Data lakes
✅ Analytics data
✅ User-generated content
```

### 3. S3 Standard-IA (Infrequent Access)
**Use Case**: Long-lived, infrequently accessed data

**Characteristics**:
```
Durability: 11 9's
Availability: 99.9%
AZs: ≥3
Latency: ms
Min storage: 30 days
Min object size: 128 KB
Retrieval fee: $0.01/GB
```

**Best for**:
```
✅ Backups
✅ Disaster recovery
✅ Long-term archives (monthly access)
```

### 4. S3 One Zone-IA
**Use Case**: Non-critical, infrequently accessed data

**Trade-off**: Lower cost, lower availability (single AZ)

**Characteristics**:
```
Durability: 11 9's (within AZ)
Availability: 99.5%
AZs: 1 (vulnerable to AZ destruction)
Cost: 20% less than Standard-IA
```

**Best for**:
```
✅ Re-creatable data
✅ Secondary backups
✅ Thumbnails (can regenerate)
```

### 5. S3 Glacier Instant Retrieval
**Use Case**: Archival data needing instant access

**Characteristics**:
```
Durability: 11 9's
Availability: 99.9%
Latency: ms
Min storage: 90 days
Retrieval fee: $0.03/GB
Cost: 68% cheaper than Standard
```

**Best for**:
```
✅ Medical images
✅ News archives
✅ Compliance data (rare access)
```

### 6. S3 Glacier Flexible Retrieval
**Use Case**: Archival data with flexible retrieval times

**Retrieval Options**:
```
Expedited: 1-5 minutes ($0.03/GB)
Standard: 3-5 hours ($0.01/GB)
Bulk: 5-12 hours ($0.0025/GB)
```

**Characteristics**:
```
Min storage: 90 days
Min object size: 40 KB overhead
Cost: 82% cheaper than Standard
```

**Best for**:
```
✅ Media archives
✅ Healthcare records
✅ Regulatory archives
```

### 7. S3 Glacier Deep Archive
**Use Case**: Long-term archival (7-10 years)

**Retrieval Options**:
```
Standard: 12 hours
Bulk: 48 hours
```

**Characteristics**:
```
Min storage: 180 days
Cost: 95% cheaper than Standard ($0.00099/GB/month)
```

**Best for**:
```
✅ Compliance archives
✅ Financial records (7-year retention)
✅ Scientific data
```

### Storage Class Comparison

| Class | Availability | AZs | Latency | Min Duration | Cost |
|-------|-------------|-----|---------|--------------|------|
| Standard | 99.99% | ≥3 | ms | None | $$$ |
| Intelligent-Tiering | 99.9% | ≥3 | ms | None | $$ (auto) |
| Standard-IA | 99.9% | ≥3 | ms | 30 days | $$ |
| One Zone-IA | 99.5% | 1 | ms | 30 days | $ |
| Glacier IR | 99.9% | ≥3 | ms | 90 days | $ |
| Glacier FR | 99.99% | ≥3 | min-hours | 90 days | ¢¢ |
| Glacier DA | 99.99% | ≥3 | hours | 180 days | ¢ |

---

## Bucket Policies & Permissions

### Access Control Mechanisms

**1. IAM Policies** (Identity-based):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

**2. Bucket Policies** (Resource-based):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/public/*"
    }
  ]
}
```

**3. ACLs** (Legacy, not recommended):
```xml
<AccessControlList>
  <Grant>
    <Grantee>
      <ID>user-canonical-id</ID>
    </Grantee>
    <Permission>READ</Permission>
  </Grant>
</AccessControlList>
```

### Common Bucket Policies

**Public Read Access**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

**Enforce HTTPS Only**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::my-bucket/*",
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

**IP Restriction**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": ["203.0.113.0/24", "198.51.100.0/24"]
        }
      }
    }
  ]
}
```

---

## Advanced Features

### Versioning

**Why**: Protect against accidental deletions and overwrites.

**How it works**:
```
PUT object.txt (creates Version 1)
PUT object.txt (creates Version 2, Version 1 kept)
DELETE object.txt (adds delete marker, versions kept)
GET object.txt (returns 404 due to delete marker)
GET object.txt?versionId=Version1 (returns Version 1)
```

**Enable Versioning**:
```bash
aws s3api put-bucket-versioning \
  --bucket my-bucket \
  --versioning-configuration Status=Enabled
```

**Lifecycle with Versioning**:
```json
{
  "Rules": [
    {
      "Id": "ArchiveOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionTransitions": [
        {
          "NoncurrentDays": 30,
          "StorageClass": "GLACIER"
        }
      ],
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 90
      }
    }
  ]
}
```

### Lifecycle Policies

**Transition between storage classes**:
```json
{
  "Rules": [
    {
      "Id": "CostOptimization",
      "Status": "Enabled",
      "Filter": {"Prefix": "documents/"},
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 365,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 2555  // 7 years
      }
    }
  ]
}
```

### Event Notifications

**Trigger Lambda/SQS/SNS on S3 events**:

**Events**:
```
s3:ObjectCreated:*
s3:ObjectCreated:Put
s3:ObjectCreated:Post
s3:ObjectCreated:Copy
s3:ObjectRemoved:*
s3:ObjectRemoved:Delete
s3:ObjectRemoved:DeleteMarkerCreated
s3:ObjectRestore:Post
s3:ObjectRestore:Completed
s3:Replication:*
```

**Configuration**:
```json
{
  "LambdaFunctionConfigurations": [
    {
      "Id": "ImageThumbnail",
      "LambdaFunctionArn": "arn:aws:lambda:us-east-1:123456789012:function:createThumbnail",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {
          "FilterRules": [
            {"Name": "prefix", "Value": "images/"},
            {"Name": "suffix", "Value": ".jpg"}
          ]
        }
      }
    }
  ]
}
```

### Presigned URLs

**Temporary access to private objects**:

**Go Implementation**:
```go
package main

import (
	"fmt"
	"time"
	
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

func generatePresignedURL() {
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	}))
	
	svc := s3.New(sess)
	
	req, _ := svc.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String("my-bucket"),
		Key:    aws.String("private/document.pdf"),
	})
	
	url, err := req.Presign(15 * time.Minute)
	if err != nil {
		panic(err)
	}
	
	fmt.Println("Presigned URL:", url)
	// https://my-bucket.s3.amazonaws.com/private/document.pdf?...&Expires=1234567890
}
```

**Python Implementation**:
```python
import boto3
from botocore.config import Config

s3 = boto3.client('s3', config=Config(signature_version='s3v4'))

url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': 'my-bucket', 'Key': 'private/document.pdf'},
    ExpiresIn=900  # 15 minutes
)

print(f"Presigned URL: {url}")
```

**Use Case**: Secure file uploads from browser.
```javascript
// Frontend: Get presigned URL from backend
const response = await fetch('/api/get-upload-url');
const { url, fields } = await response.json();

// Upload directly to S3
const formData = new FormData();
Object.entries(fields).forEach(([key, value]) => {
  formData.append(key, value);
});
formData.append('file', fileInput.files[0]);

await fetch(url, { method: 'POST', body: formData });
```

### Multipart Upload

**For files > 100 MB** (required for > 5 GB):

**Why**:
```
✅ Improved throughput (parallel uploads)
✅ Quick recovery from network issues
✅ Upload object before knowing final size
✅ Upload parts independently
```

**Process**:
```
1. Initiate multipart upload → Get Upload ID
2. Upload parts (5MB - 5GB each) → Get ETags
3. Complete multipart upload → Combine parts
```

**Python Example**:
```python
import boto3
import os

s3 = boto3.client('s3')

def multipart_upload(bucket, key, filepath):
    # 1. Initiate
    response = s3.create_multipart_upload(Bucket=bucket, Key=key)
    upload_id = response['UploadId']
    
    # 2. Upload parts (5 MB each)
    part_size = 5 * 1024 * 1024
    parts = []
    
    with open(filepath, 'rb') as f:
        part_number = 1
        
        while True:
            data = f.read(part_size)
            if not data:
                break
            
            response = s3.upload_part(
                Bucket=bucket,
                Key=key,
                PartNumber=part_number,
                UploadId=upload_id,
                Body=data
            )
            
            parts.append({
                'PartNumber': part_number,
                'ETag': response['ETag']
            })
            
            part_number += 1
    
    # 3. Complete
    s3.complete_multipart_upload(
        Bucket=bucket,
        Key=key,
        UploadId=upload_id,
        MultipartUpload={'Parts': parts}
    )

multipart_upload('my-bucket', 'large-file.zip', '/path/to/file.zip')
```

---

## Performance Optimization

### Request Rate Limits

**Per Prefix**:
```
PUT/COPY/POST/DELETE: 3,500 requests/second
GET/HEAD: 5,500 requests/second
```

**Optimization**:
```
Bad:  bucket/images/img1.jpg
      bucket/images/img2.jpg
      (All under same prefix "images/")

Good: bucket/ab12/images/img1.jpg
      bucket/cd34/images/img2.jpg
      (Different prefixes distribute load)
```

### Transfer Acceleration

**Use CloudFront edge locations for uploads**:

**How it works**:
```
User (Tokyo) → CloudFront (Tokyo) → AWS Backbone → S3 (us-east-1)

Speed improvement: 50-500% for long distances
```

**Enable**:
```bash
aws s3api put-bucket-accelerate-configuration \
  --bucket my-bucket \
  --accelerate-configuration Status=Enabled

# New endpoint: my-bucket.s3-accelerate.amazonaws.com
```

### Byte-Range Fetches

**Download specific byte ranges**:
```python
import boto3

s3 = boto3.client('s3')

# Download first 1 MB
response = s3.get_object(
    Bucket='my-bucket',
    Key='large-file.bin',
    Range='bytes=0-1048575'
)

data = response['Body'].read()
```

**Use Case**: Resume interrupted downloads, parallel downloads.

---

## LocalStack Implementation

### Setup

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
    volumes:
      - "./localstack-data:/tmp/localstack"
```

**Start LocalStack**:
```bash
docker-compose up -d
```

### Complete S3 CRUD (Go)

```go
package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
	
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

func main() {
	// LocalStack configuration
	sess, err := session.NewSession(&aws.Config{
		Region:           aws.String("us-east-1"),
		Endpoint:         aws.String("http://localhost:4566"),
		Credentials:      credentials.NewStaticCredentials("test", "test", ""),
		S3ForcePathStyle: aws.Bool(true),
	})
	if err != nil {
		log.Fatal(err)
	}
	
	svc := s3.New(sess)
	
	// Create bucket
	_, err = svc.CreateBucket(&s3.CreateBucketInput{
		Bucket: aws.String("my-app-bucket"),
	})
	if err != nil {
		log.Printf("Bucket may already exist: %v", err)
	}
	
	// Upload object with metadata
	content := []byte("Hello from S3!")
	_, err = svc.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String("my-app-bucket"),
		Key:         aws.String("files/hello.txt"),
		Body:        bytes.NewReader(content),
		ContentType: aws.String("text/plain"),
		Metadata: map[string]*string{
			"uploaded-by": aws.String("john"),
			"app-version": aws.String("1.0"),
		},
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("✅ Uploaded object")
	
	// List objects
	listResult, err := svc.ListObjectsV2(&s3.ListObjectsV2Input{
		Bucket: aws.String("my-app-bucket"),
		Prefix: aws.String("files/"),
	})
	if err != nil {
		log.Fatal(err)
	}
	
	fmt.Println("\n📂 Objects:")
	for _, obj := range listResult.Contents {
		fmt.Printf("  - %s (Size: %d bytes)\n", *obj.Key, *obj.Size)
	}
	
	// Download object
	getResult, err := svc.GetObject(&s3.GetObjectInput{
		Bucket: aws.String("my-app-bucket"),
		Key:    aws.String("files/hello.txt"),
	})
	if err != nil {
		log.Fatal(err)
	}
	defer getResult.Body.Close()
	
	downloadedContent, _ := io.ReadAll(getResult.Body)
	fmt.Printf("\n📥 Downloaded: %s\n", downloadedContent)
	fmt.Printf("   Metadata: %v\n", getResult.Metadata)
	
	// Delete object
	_, err = svc.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String("my-app-bucket"),
		Key:    aws.String("files/hello.txt"),
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("\n🗑️  Deleted object")
}
```

### Complete S3 CRUD (Python)

```python
import boto3
import json

# LocalStack S3 client
s3 = boto3.client(
    's3',
    endpoint_url='http://localhost:4566',
    aws_access_key_id='test',
    aws_secret_access_key='test',
    region_name='us-east-1'
)

# Create bucket
s3.create_bucket(Bucket='my-app-bucket')
print("✅ Created bucket")

# Upload with metadata
s3.put_object(
    Bucket='my-app-bucket',
    Key='files/hello.txt',
    Body=b'Hello from S3!',
    ContentType='text/plain',
    Metadata={
        'uploaded-by': 'john',
        'app-version': '1.0'
    }
)
print("✅ Uploaded object")

# List objects
response = s3.list_objects_v2(Bucket='my-app-bucket', Prefix='files/')
print("\n📂 Objects:")
for obj in response.get('Contents', []):
    print(f"  - {obj['Key']} (Size: {obj['Size']} bytes)")

# Download object
response = s3.get_object(Bucket='my-app-bucket', Key='files/hello.txt')
content = response['Body'].read().decode('utf-8')
metadata = response['Metadata']
print(f"\n📥 Downloaded: {content}")
print(f"   Metadata: {metadata}")

# Delete object
s3.delete_object(Bucket='my-app-bucket', Key='files/hello.txt')
print("\n🗑️  Deleted object")
```

---

## Production Patterns

### Pattern 1: Static Website Hosting

**Architecture**:
```
Route 53 → CloudFront → S3 Bucket
                ↓
            Lambda@Edge (optional)
```

**S3 Configuration**:
```bash
# Enable static website hosting
aws s3 website s3://my-website \
  --index-document index.html \
  --error-document error.html

# Upload files
aws s3 sync ./dist s3://my-website --acl public-read
```

### Pattern 2: File Upload API with Presigned URLs

**Backend (Go)**:
```go
func getUploadURL(w http.ResponseWriter, r *http.Request) {
	sess := session.Must(session.NewSession())
	svc := s3.New(sess)
	
	key := fmt.Sprintf("uploads/%s/%s", userID, filename)
	
	req, _ := svc.PutObjectRequest(&s3.PutObjectInput{
		Bucket:      aws.String("my-uploads"),
		Key:         aws.String(key),
		ContentType: aws.String("image/jpeg"),
	})
	
	url, err := req.Presign(15 * time.Minute)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	
	json.NewEncoder(w).Encode(map[string]string{
		"uploadURL": url,
		"key":       key,
	})
}
```

**Frontend (JavaScript)**:
```javascript
async function uploadFile(file) {
  // Get presigned URL
  const response = await fetch('/api/upload-url', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name })
  });
  const { uploadURL, key } = await response.json();
  
  // Upload directly to S3
  await fetch(uploadURL, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  });
  
  console.log('Uploaded to S3:', key);
}
```

### Pattern 3: S3 Event → Lambda Processing

**Use Case**: Thumbnail generation for uploaded images.

**Lambda Function (Python)**:
```python
import boto3
from PIL import Image
import io

s3 = boto3.client('s3')

def lambda_handler(event, context):
    # Get uploaded image
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    
    response = s3.get_object(Bucket=bucket, Key=key)
    img = Image.open(response['Body'])
    
    # Create thumbnail
    img.thumbnail((200, 200))
    
    # Save to S3
    buffer = io.BytesIO()
    img.save(buffer, 'JPEG')
    buffer.seek(0)
    
    thumbnail_key = key.replace('uploads/', 'thumbnails/')
    s3.put_object(
        Bucket=bucket,
        Key=thumbnail_key,
        Body=buffer,
        ContentType='image/jpeg'
    )
    
    return {'statusCode': 200}
```

---

## Interview Questions

### Conceptual Questions

**Q: How does S3 achieve 11 9's durability?**
```
A: S3 stores data across multiple devices in at least 3 Availability Zones.
   Each object is checksummed and continuously monitored. Corrupted data is
   automatically repaired. Even if an entire AZ is destroyed, data is safe.
   
   Math: 99.999999999% = 0.00000001% annual loss rate
         = 1 object lost per 100 billion objects per year
```

**Q: S3 consistency model?**
```
A: Strong consistency (since December 2020).
   - Immediate read-after-write consistency
   - Immediate read-after-update consistency
   - Immediate list consistency
   
   Before 2020: Eventual consistency for overwrite PUT and DELETE
```

**Q: When to use S3 vs EBS vs EFS?**
```
S3:
✅ Object storage, HTTP API
✅ Static assets, backups, data lakes
✅ 11 9's durability, unlimited scalability
❌ Not mountable, higher latency (ms vs µs)

EBS:
✅ Block storage, attached to EC2
✅ Databases, boot volumes
✅ Low latency (µs), high IOPS
❌ Single AZ, limited scalability

EFS:
✅ File storage, NFS protocol
✅ Shared files, content management
✅ Multi-AZ, auto-scaling
❌ Higher cost, lower performance than EBS
```

### Design Questions

**Q: Design a cost-effective backup solution for 10 TB data (7-year retention)**
```
A: 
1. Daily backups → S3 Standard (30 days)
2. Lifecycle policy:
   - Day 30 → S3 Standard-IA
   - Day 90 → Glacier Flexible Retrieval
   - Day 365 → Glacier Deep Archive
3. Versioning enabled
4. Cross-region replication for DR

Cost calculation (10 TB):
- S3 Standard (30 days): 10,000 GB × $0.023 × 1 = $230/month
- S3 Standard-IA (60 days): 10,000 × $0.0125 × 2 = $250/month
- Glacier FR (275 days): 10,000 × $0.004 × 9 = $360/month
- Glacier DA (6+ years): 10,000 × $0.00099 × 72 = $713/month

Total: ~$1,553/month for 7 years of backups
```

**Q: S3 performance optimization for 100,000 requests/second?**
```
A:
1. Use random prefixes (hash-based):
   bucket/a7f2/image.jpg
   bucket/3b91/image.jpg
   (Distributes load across S3 partitions)

2. Enable Transfer Acceleration (for uploads)

3. Use CloudFront for downloads (edge caching)

4. Implement byte-range fetches for large files

5. Use multipart upload (parallel uploads)

6. Consider S3 Express One Zone for ultra-low latency
```

**Q: How to secure sensitive data in S3?**
```
A:
1. Encryption:
   - Server-side: SSE-S3, SSE-KMS, SSE-C
   - Client-side: Encrypt before upload

2. Access Control:
   - Block public access (default)
   - Bucket policies (resource-based)
   - IAM policies (identity-based)
   - Presigned URLs for temporary access

3. Network:
   - VPC endpoints (no internet traffic)
   - Enforce HTTPS (bucket policy condition)

4. Auditing:
   - S3 Access Logging
   - CloudTrail (API calls)
   - AWS Config (compliance)

5. Versioning + MFA Delete
```

---

This comprehensive S3 guide covers everything from history through production patterns with complete LocalStack implementations!

