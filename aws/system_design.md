# AWS System Design Problems: FAANG-Level Interviews

## Table of Contents
1. [Introduction](#introduction)
2. [Design Twitter](#design-twitter)
3. [Design Netflix](#design-netflix)
4. [Design Uber](#design-uber)
5. [Design WhatsApp](#design-whatsapp)
6. [Design Instagram](#design-instagram)
7. [Common Patterns and Best Practices](#common-patterns-and-best-practices)

---

## Introduction

This guide provides **FAANG-level system design solutions** using AWS services. Each design includes:

1. **Requirements clarification**
2. **Capacity estimation** (traffic, storage, bandwidth)
3. **High-level architecture** with AWS services
4. **Data modeling** (DynamoDB/RDS schema)
5. **API design**
6. **Scaling strategies**
7. **Cost analysis**

### System Design Interview Framework

```
1. Requirements (5 min)
   - Functional: Core features
   - Non-functional: Scale, latency, availability

2. Capacity Estimation (5 min)
   - Users, requests, storage, bandwidth

3. API Design (5 min)
   - RESTful endpoints or WebSocket

4. Data Model (10 min)
   - Schema, indexes, partitioning

5. High-Level Architecture (15 min)
   - Components, data flow, AWS services

6. Deep Dive (10 min)
   - Bottlenecks, scaling, edge cases

7. Cost & Trade-offs (5 min)
   - Monthly cost, alternative approaches
```

---

## Design Twitter

### Requirements

**Functional:**
- Post tweets (280 characters)
- Follow/unfollow users
- Timeline: home (followed users) + user (own tweets)
- Favorite/retweet
- Search tweets

**Non-functional:**
- 300M total users, 100M DAU
- 50M tweets/day by regular users + 500K/day by celebrities
- Read-heavy: 100:1 read/write ratio
- Timeline latency: <500ms
- High availability: 99.99%

### Capacity Estimation

**Traffic:**
```
Tweets per day: 50M (regular) + 500K (celebrity) = 50.5M
Tweets per second: 50.5M / 86400 = 584 TPS average, 2000 TPS peak

Timeline reads: 100M DAU × 50 timelines/day = 5B timeline requests/day
Timeline reads per second: 5B / 86400 = 57,870 reads/sec
```

**Storage:**
```
Tweet size: 280 chars + metadata (userId, timestamp, likes, retweets) ≈ 500 bytes
Media: 20% tweets with 200 KB photo = 100 KB average per tweet

Daily storage:
- Text: 50.5M × 500 bytes = 25.25 GB/day
- Media: 50.5M × 0.2 × 200 KB = 2,020 GB/day
- Total: 2,045 GB/day = 61.35 TB/month = 22 PB/year

With 5-year retention:
- Text: 25.25 GB × 365 × 5 = 46 TB
- Media: 2 TB × 365 × 5 = 3.65 PB
```

**Bandwidth:**
```
Ingress: 2,045 GB/day = 24 MB/sec
Egress: 2,045 GB × 100 (read:write ratio) = 204.5 TB/day = 2.4 GB/sec
```

### Architecture

```
Users
    ↓
Route 53
    ↓
CloudFront (CDN for media)
    ↓
API Gateway HTTP API
    ↓
Lambda (Tweet ingestion)
    ↓
    ├─→ DynamoDB (Tweets table - tweet metadata)
    │       ├─ PK: tweetId
    │       └─ GSI: userId-timestamp (user timeline)
    │
    ├─→ S3 (Media storage)
    │       └─ CloudFront origin
    │
    ├─→ SNS Topic (TweetPosted event)
    │       ↓
    │   SQS FIFO Queue (Fanout service)
    │       ↓
    │   Lambda (Fan-out to followers)
    │       ↓
    │   ElastiCache Redis (Timeline cache)
    │       ├─ Key: timeline:{userId}
    │       └─ Value: List of tweetIds (sorted by timestamp)
    │
    └─→ Elasticsearch (Tweet search)
            └─ Full-text search on tweet content

Read Path:
Users → API Gateway → Lambda → ElastiCache (cache hit 90%)
                              └─ DynamoDB (cache miss)
```

### The Celebrity Problem

**Problem:** Celebrity with 10M followers posts tweet → 10M timeline updates

**Solution: Hybrid Fanout**

```python
CELEBRITY_THRESHOLD = 1_000_000  # 1M followers

def post_tweet(user_id, tweet_content):
    """Post tweet with hybrid fanout strategy"""
    
    # Store tweet
    tweet_id = str(uuid.uuid4())
    tweet = {
        'tweetId': tweet_id,
        'userId': user_id,
        'content': tweet_content,
        'timestamp': int(time.time() * 1000),
        'likes': 0,
        'retweets': 0
    }
    
    tweets_table.put_item(Item=tweet)
    
    # Upload media to S3 if present
    if media:
        s3.put_object(
            Bucket='twitter-media',
            Key=f'tweets/{tweet_id}/{media.filename}',
            Body=media.content,
            ContentType=media.content_type
        )
    
    # Get follower count
    user = users_table.get_item(Key={'userId': user_id})
    follower_count = user['Item']['followerCount']
    
    # Fanout strategy based on follower count
    if follower_count < CELEBRITY_THRESHOLD:
        # Fanout-on-write: Push to all followers' timelines
        fanout_to_followers(user_id, tweet)
    else:
        # Fanout-on-read: Don't push, generate on-demand
        # Just index in celebrity_tweets for fast retrieval
        celebrity_tweets_table.put_item(
            Item={
                'userId': user_id,
                'timestamp': tweet['timestamp'],
                'tweetId': tweet_id
            }
        )
    
    # Index in Elasticsearch for search
    es.index(
        index='tweets',
        id=tweet_id,
        body={
            'userId': user_id,
            'content': tweet_content,
            'timestamp': tweet['timestamp']
        }
    )
    
    return tweet_id

def fanout_to_followers(user_id, tweet):
    """Push tweet to all followers' timelines (async)"""
    sns.publish(
        TopicArn=TWEET_POSTED_TOPIC,
        Message=json.dumps({
            'userId': user_id,
            'tweet': tweet
        })
    )

# Fanout worker (Lambda triggered by SQS)
def fanout_worker(event, context):
    """Push tweet to followers' Redis timelines"""
    for record in event['Records']:
        message = json.loads(record['body'])
        user_id = message['userId']
        tweet = message['tweet']
        
        # Get followers (paginated)
        followers = get_followers(user_id)
        
        # Batch update Redis timelines
        pipe = redis_client.pipeline()
        for follower_id in followers:
            # Add tweet to timeline (sorted set with timestamp as score)
            pipe.zadd(
                f'timeline:{follower_id}',
                {tweet['tweetId']: tweet['timestamp']}
            )
            # Keep only latest 1000 tweets
            pipe.zremrangebyrank(f'timeline:{follower_id}', 0, -1001)
            # Set expiry (24 hours)
            pipe.expire(f'timeline:{follower_id}', 86400)
        
        pipe.execute()
```

**Get Timeline (Mixed Approach):**

```python
def get_home_timeline(user_id, page_size=20, cursor=None):
    """Get home timeline with hybrid approach"""
    
    # Try cache first (regular users)
    cache_key = f'timeline:{user_id}'
    
    if redis_client.exists(cache_key):
        # Cache hit: Get from Redis
        start = int(cursor) if cursor else 0
        tweet_ids = redis_client.zrevrange(
            cache_key,
            start,
            start + page_size - 1
        )
        
        # Get tweet details from DynamoDB
        tweets = dynamodb_batch_get(tweet_ids)
        
        return {
            'tweets': tweets,
            'nextCursor': start + page_size if len(tweets) == page_size else None
        }
    
    else:
        # Cache miss or celebrity timeline: Generate on-demand
        following = get_following(user_id)
        
        # Separate regular users and celebrities
        regular_users = []
        celebrities = []
        
        for followed_id in following:
            user = users_table.get_item(Key={'userId': followed_id})
            if user['Item']['followerCount'] >= CELEBRITY_THRESHOLD:
                celebrities.append(followed_id)
            else:
                regular_users.append(followed_id)
        
        all_tweets = []
        
        # Get tweets from regular users (DynamoDB query)
        for followed_id in regular_users:
            tweets = tweets_table.query(
                IndexName='userId-timestamp-index',
                KeyConditionExpression='userId = :userId',
                ExpressionAttributeValues={':userId': followed_id},
                ScanIndexForward=False,  # Descending order
                Limit=100
            )
            all_tweets.extend(tweets['Items'])
        
        # Get tweets from celebrities (separate table optimized for this)
        for celebrity_id in celebrities:
            tweets = celebrity_tweets_table.query(
                KeyConditionExpression='userId = :userId',
                ExpressionAttributeValues={':userId': celebrity_id},
                ScanIndexForward=False,
                Limit=100
            )
            all_tweets.extend(tweets['Items'])
        
        # Merge and sort by timestamp
        all_tweets.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Cache for next time (if not too many celebrities)
        if len(celebrities) < 10:
            pipe = redis_client.pipeline()
            for tweet in all_tweets[:1000]:
                pipe.zadd(cache_key, {tweet['tweetId']: tweet['timestamp']})
            pipe.expire(cache_key, 86400)
            pipe.execute()
        
        # Paginate
        start = int(cursor) if cursor else 0
        page_tweets = all_tweets[start:start + page_size]
        
        return {
            'tweets': page_tweets,
            'nextCursor': start + page_size if len(page_tweets) == page_size else None
        }
```

### Data Model

**DynamoDB Tables:**

```python
# Tweets table
{
    'tweetId': 'uuid',  # PK
    'userId': 'user-123',
    'content': 'Hello, Twitter!',
    'timestamp': 1640000000000,
    'likes': 42,
    'retweets': 7,
    'mediaUrl': 's3://twitter-media/tweets/uuid/photo.jpg'
}

# GSI: userId-timestamp-index
# PK: userId, SK: timestamp (for user timeline)

# CelebrityTweets table (optimized for high-follower users)
{
    'userId': 'celebrity-456',  # PK
    'timestamp': 1640000000000,  # SK
    'tweetId': 'uuid'
}

# Users table
{
    'userId': 'user-123',  # PK
    'username': 'johndoe',
    'email': 'john@example.com',
    'followerCount': 150,
    'followingCount': 200,
    'createdAt': 1600000000000
}

# Followers table (for follower lookup)
{
    'userId': 'user-123',  # PK
    'followerId': 'user-456',  # SK
    'timestamp': 1640000000000
}

# GSI: followerId-userId-index (for "who I'm following")
```

**ElastiCache Redis Structures:**

```python
# Timeline cache (sorted set)
ZADD timeline:user-123 1640000000000 tweet-uuid-1
ZADD timeline:user-123 1640000001000 tweet-uuid-2

# Get latest 20 tweets
ZREVRANGE timeline:user-123 0 19

# Tweet cache (hash)
HSET tweet:uuid-1 content "Hello, Twitter!"
HSET tweet:uuid-1 userId "user-123"
HSET tweet:uuid-1 timestamp "1640000000000"
EXPIRE tweet:uuid-1 86400  # 24 hours

# Trending hashtags (sorted set by count)
ZINCRBY trending:hashtags 1 "#AWS"
ZREVRANGE trending:hashtags 0 9 WITHSCORES  # Top 10
```

### Cost Estimation

**DynamoDB:**
```
Tweets table:
- Writes: 584 TPS × 2.6M sec/month = 1.52B writes/month
- Write capacity: 1.52B × $1.25/million = $1,900/month
- Storage: 25.25 GB/day × 30 = 757.5 GB × $0.25/GB = $189/month

Reads: 57,870 RPS × 2.6M sec/month = 150B reads/month
- With 90% cache hit rate: 15B reads × $0.25/million = $3,750/month

Total DynamoDB: ~$5,840/month
```

**ElastiCache Redis:**
```
Timeline cache size:
- 100M users × 1000 tweets/timeline × 8 bytes (tweetId) = 800 GB
- Need cache.r5.8xlarge (26 GB) × 32 nodes = 832 GB
- Cost: 32 nodes × $1.344/hour × 730 hours = $31,406/month

Optimization: Only cache active users (10M)
- 10M × 1000 × 8 bytes = 80 GB
- cache.r5.4xlarge × 8 nodes = 104 GB
- Cost: 8 × $0.672/hour × 730 = $3,926/month
```

**S3 + CloudFront (Media):**
```
Storage: 2 TB/day × 30 = 60 TB/month × $0.023/GB = $1,380/month
Transfer: 204.5 TB/day × 30 = 6,135 TB/month
CloudFront: 6,135 TB × $0.085/GB = $521,475/month

Optimization: Use S3 Intelligent-Tiering + CloudFront caching
- Hot media (30 days): 60 TB × $0.023 = $1,380/month
- Warm media (1 year): 365 TB × $0.0125 = $4,562/month
- CloudFront (90% cache hit): 613.5 TB × $0.085 = $52,147/month
```

**API Gateway HTTP API:**
```
Requests: (584 writes + 57,870 reads) × 2.6M = 152B/month
Cost: 152B × $1/million = $152,000/month

Optimization: Use ALB for backend traffic
ALB: $16/month + (152B LCU-hours) = ~$1,000/month
```

**Lambda:**
```
Invocations: 152B × $0.20/million = $30,400/month
Compute: 152B × 50ms × 128 MB = 974M GB-sec × $0.0000166667 = $16,233/month
Total Lambda: ~$46,633/month
```

**Elasticsearch (Search):**
```
3 r5.xlarge.search instances (16 GB each)
Cost: 3 × $0.226/hour × 730 = $495/month
```

**Total Estimated Cost: ~$110,000/month** for 100M DAU

---

## Design Netflix

### Requirements

**Functional:**
- Upload videos (content creators)
- Stream videos (users)
- Personalized recommendations
- Playback controls (play, pause, resume, quality selection)
- Subtitles/captions

**Non-functional:**
- 200M subscribers globally
- 100M concurrent streamers (peak)
- 10,000 movies + 5,000 TV shows (avg 2 hours each)
- Multiple bitrates (4K, 1080p, 720p, 480p, 360p)
- Latency: <2 seconds to start playback
- Availability: 99.99%

### Capacity Estimation

**Storage:**
```
Total content: 15,000 videos × 2 hours = 30,000 hours

Per video encoding:
- 4K (3840×2160): 25 Mbps × 7,200 sec = 22.5 GB
- 1080p: 8 Mbps × 7,200 = 7.2 GB
- 720p: 5 Mbps × 7,200 = 4.5 GB
- 480p: 2.5 Mbps × 7,200 = 2.25 GB
- 360p: 1 Mbps × 7,200 = 900 MB

Total per video: 37.35 GB
Total storage: 15,000 × 37.35 GB = 560 TB

With redundancy (3 regions): 560 TB × 3 = 1.68 PB
```

**Bandwidth:**
```
Concurrent streams: 100M at peak
Average bitrate: 5 Mbps (mix of qualities)
Peak bandwidth: 100M × 5 Mbps = 500 Tbps = 62.5 TB/sec

Daily data transfer:
- Average concurrent: 30M (30% of peak)
- Streaming hours: 30M × 3 hours/day = 90M hours/day
- Data: 90M × 5 Mbps × 3,600 sec = 1,620 TB/day = 48.6 PB/month
```

**Requests:**
```
Video metadata requests: 200M users × 10 requests/day = 2B/day
Search queries: 200M × 5 queries/day = 1B/day
Total: 3B requests/day = 34,722 RPS
```

### Architecture

```
Content Pipeline:
Content Creators
    ↓ Upload
S3 (Raw video storage)
    ↓ Trigger
Lambda → MediaConvert (Transcode to multiple bitrates)
    ↓ HLS/DASH manifest
S3 (Transcoded videos)
    ↓ Distribute
CloudFront (CDN - 200+ edge locations)

Streaming Path:
Users
    ↓
Route 53 (GeoDNS routing)
    ↓
CloudFront (Serve .m3u8 manifest + .ts segments)
    ↓ Origin
S3 (Video storage)

Metadata & Recommendations:
Users → API Gateway → Lambda
    ↓
    ├─→ DynamoDB (Video metadata, user profiles)
    ├─→ ElastiCache (Recently watched, continue watching)
    ├─→ SageMaker (ML recommendations)
    └─→ Elasticsearch (Search)
```

### Video Transcoding Pipeline

```python
import boto3

s3 = boto3.client('s3')
mediaconvert = boto3.client('mediaconvert')

def transcode_video(event, context):
    """Triggered when raw video uploaded to S3"""
    
    # Get video details from S3 event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    
    video_id = key.split('/')[1]  # Extract video ID
    
    # Create MediaConvert job
    job = mediaconvert.create_job(
        Role='arn:aws:iam::123456789012:role/MediaConvertRole',
        Settings={
            'Inputs': [{
                'FileInput': f's3://{bucket}/{key}',
                'AudioSelectors': {
                    'Audio Selector 1': {'DefaultSelection': 'DEFAULT'}
                },
                'VideoSelector': {}
            }],
            'OutputGroups': [
                {
                    # HLS output group
                    'Name': 'HLS',
                    'OutputGroupSettings': {
                        'Type': 'HLS_GROUP_SETTINGS',
                        'HlsGroupSettings': {
                            'Destination': f's3://netflix-transcoded/{video_id}/hls/',
                            'SegmentLength': 10,  # 10-second segments
                            'MinSegmentLength': 0
                        }
                    },
                    'Outputs': [
                        # 4K
                        {
                            'NameModifier': '_4k',
                            'VideoDescription': {
                                'Width': 3840,
                                'Height': 2160,
                                'CodecSettings': {
                                    'Codec': 'H_265',
                                    'H265Settings': {
                                        'Bitrate': 25000000,  # 25 Mbps
                                        'RateControlMode': 'CBR'
                                    }
                                }
                            },
                            'AudioDescriptions': [{
                                'CodecSettings': {
                                    'Codec': 'AAC',
                                    'AacSettings': {'Bitrate': 192000}
                                }
                            }]
                        },
                        # 1080p
                        {
                            'NameModifier': '_1080p',
                            'VideoDescription': {
                                'Width': 1920,
                                'Height': 1080,
                                'CodecSettings': {
                                    'Codec': 'H_264',
                                    'H264Settings': {
                                        'Bitrate': 8000000,  # 8 Mbps
                                        'RateControlMode': 'CBR'
                                    }
                                }
                            },
                            'AudioDescriptions': [{
                                'CodecSettings': {
                                    'Codec': 'AAC',
                                    'AacSettings': {'Bitrate': 128000}
                                }
                            }]
                        },
                        # 720p, 480p, 360p (similar structure)
                        # ...
                    ]
                }
            ]
        }
    )
    
    # Update DynamoDB with transcoding status
    videos_table.update_item(
        Key={'videoId': video_id},
        UpdateExpression='SET transcodingStatus = :status, jobId = :jobId',
        ExpressionAttributeValues={
            ':status': 'IN_PROGRESS',
            ':jobId': job['Job']['Id']
        }
    )
```

**HLS Manifest (.m3u8):**

```
#EXTM3U
#EXT-X-VERSION:3

# Master playlist (adaptive bitrate)
#EXT-X-STREAM-INF:BANDWIDTH=25000000,RESOLUTION=3840x2160
4k/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=8000000,RESOLUTION=1920x1080
1080p/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1280x720
720p/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=854x480
480p/index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=640x360
360p/index.m3u8
```

### Adaptive Bitrate Streaming (Client)

```javascript
// Video.js player with HLS support
const player = videojs('video-player', {
  controls: true,
  sources: [{
    src: 'https://d123abc.cloudfront.net/video-123/master.m3u8',
    type: 'application/x-mpegURL'
  }]
});

// Quality selector plugin
player.qualityLevels();

player.on('loadedmetadata', function() {
  const qualityLevels = player.qualityLevels();
  
  // Allow user to select quality
  for (let i = 0; i < qualityLevels.length; i++) {
    console.log(`Quality ${i}: ${qualityLevels[i].width}x${qualityLevels[i].height}`);
  }
  
  // Auto-select based on bandwidth
  qualityLevels.on('change', function() {
    console.log('Quality changed to:', qualityLevels[qualityLevels.selectedIndex].height + 'p');
  });
});

// Resume playback from last position
const lastPosition = getLastWatchedPosition(videoId);
if (lastPosition) {
  player.currentTime(lastPosition);
}

// Save progress every 10 seconds
setInterval(() => {
  const currentTime = player.currentTime();
  saveWatchedPosition(videoId, currentTime);
}, 10000);
```

### Recommendations with SageMaker

```python
import boto3
import pandas as pd

sagemaker = boto3.client('sagemaker')

# Prepare training data
def prepare_training_data():
    """User-item interactions matrix"""
    
    # Get viewing history from DynamoDB
    response = viewing_history_table.scan()
    interactions = response['Items']
    
    # Create DataFrame
    df = pd.DataFrame([
        {
            'userId': item['userId'],
            'videoId': item['videoId'],
            'rating': item['watchedPercentage'] / 100 * 5  # Implicit rating
        }
        for item in interactions
    ])
    
    # Upload to S3
    df.to_csv('s3://netflix-ml/training-data/interactions.csv', index=False)

# Train collaborative filtering model
def train_recommendation_model():
    """Use Factorization Machines algorithm"""
    
    from sagemaker import FactorizationMachines
    
    fm = FactorizationMachines(
        role='arn:aws:iam::123456789012:role/SageMakerRole',
        instance_count=5,
        instance_type='ml.c5.xlarge',
        num_factors=64,
        predictor_type='regressor'
    )
    
    fm.fit({
        'train': 's3://netflix-ml/training-data/interactions.csv'
    })
    
    # Deploy endpoint
    predictor = fm.deploy(
        initial_instance_count=10,
        instance_type='ml.c5.xlarge',
        endpoint_name='netflix-recommendations'
    )
    
    return predictor

# Get recommendations
def get_recommendations(user_id, n=20):
    """Get personalized recommendations for user"""
    
    runtime = boto3.client('sagemaker-runtime')
    
    # Get user's watched videos
    watched = set(get_watched_videos(user_id))
    
    # Get all videos
    all_videos = get_all_videos()
    
    # Score unwatched videos
    predictions = []
    for video_id in all_videos:
        if video_id not in watched:
            response = runtime.invoke_endpoint(
                EndpointName='netflix-recommendations',
                Body=json.dumps({
                    'userId': user_id,
                    'videoId': video_id
                }),
                ContentType='application/json'
            )
            
            score = json.loads(response['Body'].read())['predictions'][0]
            predictions.append((video_id, score))
    
    # Sort by score
    predictions.sort(key=lambda x: x[1], reverse=True)
    
    return [video_id for video_id, score in predictions[:n]]
```

### Cost Estimation

**S3 Storage:**
```
Total storage: 1.68 PB
Cost: 1.68 PB × $0.023/GB = $38,640/month

Intelligent-Tiering (90% of content rarely accessed):
- Hot (10%): 168 TB × $0.023 = $3,864/month
- Archive (90%): 1.512 PB × $0.004 = $6,048/month
Total: $9,912/month
```

**CloudFront:**
```
Data transfer: 48.6 PB/month
Cost: 48.6 PB × $0.085/GB = $4,131,000/month

With caching (95% cache hit at edge):
- Origin requests (5%): 2.43 PB × $0.085 = $206,550/month
- Edge caching: Included in CloudFront pricing
```

**MediaConvert:**
```
New content: 100 videos/month × 2 hours = 200 hours
Cost: 200 hours × $0.015/min × 60 = $180/month (4K encoding)
```

**DynamoDB:**
```
Video metadata: 15K videos × 10 KB = 150 MB storage (negligible)
User profiles: 200M users × 5 KB = 1 TB × $0.25 = $250/month

Requests: 34,722 RPS × 2.6M sec/month = 90B/month
Reads: 90B × $0.25/million = $22,500/month
```

**ElastiCache:**
```
Recently watched cache: 200M users × 100 bytes = 20 GB
cache.r5.xlarge (26 GB): $0.336/hour × 730 = $245/month
```

**SageMaker:**
```
Training: 5 × ml.c5.xlarge × 10 hours/month = $25/month
Inference: 10 × ml.c5.xlarge × 730 hours = $1,460/month
```

**Total: ~$4,361,000/month** for 200M users (~$21.80/user/month)

**Revenue:** 200M × $15/month = $3B/month
**Profit Margin:** ($3B - $4.36M) / $3B = 99.85%

---

## Design Uber

### Requirements

**Functional:**
- Request ride (rider)
- Accept ride (driver)
- Real-time location tracking
- ETA calculation
- Payment processing
- Ride history

**Non-functional:**
- 10M active riders, 1M active drivers (during peak)
- Location updates: 10/second per driver = 10M updates/sec
- Ride matching latency: <5 seconds
- GPS accuracy: <10 meters
- Availability: 99.99%

### Capacity Estimation

**Traffic:**
```
Location updates: 1M drivers × 10/sec = 10M writes/sec
Ride requests: 10M riders × 2 rides/day = 20M rides/day = 231 rides/sec

Database reads (matching):
- For each ride request, search 100 nearby drivers
- 231 × 100 = 23,100 reads/sec
```

**Storage:**
```
Driver location: driverId (16 bytes) + lat/lon (16 bytes) + timestamp (8 bytes) = 40 bytes
Daily: 10M updates/sec × 86,400 sec × 40 bytes = 34.56 TB/day
Monthly: 34.56 TB × 30 = 1.04 PB/month

With 7-day retention: 34.56 TB × 7 = 242 TB
```

### Architecture

```
Drivers (Mobile App)
    ↓ Location updates (10/sec)
API Gateway WebSocket API
    ↓
Lambda (Process location)
    ↓
    ├─→ Kinesis Data Streams (Location stream - 10,000 shards)
    │       ↓
    │   Lambda (Aggregate to DynamoDB)
    │       ↓
    │   DynamoDB (DriverLocations table with Geohash)
    │
    └─→ ElastiCache Redis (Real-time driver positions)
            └─ Geospatial index (GEOADD command)

Riders (Mobile App)
    ↓ Request ride
API Gateway
    ↓
Lambda (Match driver)
    ↓
    ├─→ ElastiCache Redis (GEORADIUS to find nearby drivers)
    ├─→ DynamoDB (Rides table)
    └─→ SNS (Notify driver via WebSocket)

ETA Calculation:
Lambda → S3 (Historical traffic data) → Athena (Query average speeds)
```

### Geospatial Indexing with Geohash

**Geohash:** Hierarchical spatial index that divides world into grid

```
geohash precision:
1 char: ±2,500 km (country level)
2 char: ±630 km (large city)
3 char: ±78 km (city)
4 char: ±20 km (neighborhood)
5 char: ±2.4 km (street)
6 char: ±610 m (block)
7 char: ±76 m (building)
8 char: ±19 m (GPS accuracy)

For Uber: Use 7-char geohash (76m precision)
```

**Implementation:**

```python
import geohash2

def update_driver_location(driver_id, lat, lon):
    """Update driver location in Redis"""
    
    # Calculate geohash (7 characters = 76m precision)
    gh = geohash2.encode(lat, lon, precision=7)
    
    # Store in Redis sorted set with geohash
    redis_client.geoadd(
        'drivers:available',
        lon, lat, driver_id
    )
    
    # Also store in DynamoDB for persistence
    driver_locations_table.put_item(
        Item={
            'driverId': driver_id,
            'geohash': gh,
            'latitude': Decimal(str(lat)),
            'longitude': Decimal(str(lon)),
            'timestamp': int(time.time() * 1000),
            'status': 'AVAILABLE',
            'ttl': int(time.time()) + 3600  # Auto-expire after 1 hour
        }
    )

def find_nearby_drivers(rider_lat, rider_lon, radius_km=5, max_drivers=10):
    """Find available drivers within radius"""
    
    # Use Redis GEORADIUS for real-time search
    drivers = redis_client.georadius(
        'drivers:available',
        rider_lon, rider_lat,
        radius_km, unit='km',
        withdist=True,  # Include distance
        sort='ASC',  # Nearest first
        count=max_drivers
    )
    
    # Returns: [(driver_id, distance_km), ...]
    return [
        {
            'driverId': driver_id,
            'distanceKm': float(distance)
        }
        for driver_id, distance in drivers
    ]

# Fallback: DynamoDB query with geohash prefix
def find_nearby_drivers_dynamodb(rider_lat, rider_lon, radius_km=5):
    """Fallback if Redis unavailable"""
    
    # Calculate geohash for rider
    rider_gh = geohash2.encode(rider_lat, rider_lon, precision=7)
    
    # Get geohash neighbors (includes 8 surrounding cells)
    neighbors = geohash2.neighbors(rider_gh)
    
    # Query DynamoDB for each geohash prefix
    all_drivers = []
    for gh_prefix in [rider_gh] + neighbors:
        response = driver_locations_table.query(
            IndexName='geohash-timestamp-index',
            KeyConditionExpression='geohash = :gh AND #ts > :ts',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':gh': gh_prefix,
                ':ts': int(time.time() * 1000) - 60000  # Last 60 seconds
            }
        )
        all_drivers.extend(response['Items'])
    
    # Calculate actual distance and filter
    nearby = []
    for driver in all_drivers:
        distance = haversine_distance(
            rider_lat, rider_lon,
            float(driver['latitude']), float(driver['longitude'])
        )
        if distance <= radius_km:
            nearby.append({
                'driverId': driver['driverId'],
                'distanceKm': distance
            })
    
    # Sort by distance
    nearby.sort(key=lambda x: x['distanceKm'])
    return nearby[:10]

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km"""
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth radius in km
    
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c
```

### Ride Matching Algorithm

```python
def request_ride(rider_id, pickup_lat, pickup_lon, dropoff_lat, dropoff_lon):
    """Match rider with nearest available driver"""
    
    # Find nearby drivers
    nearby_drivers = find_nearby_drivers(pickup_lat, pickup_lon, radius_km=5, max_drivers=20)
    
    if not nearby_drivers:
        return {'error': 'No drivers available'}
    
    # Get driver details and filter by rating, car type, etc.
    eligible_drivers = []
    for driver_info in nearby_drivers:
        driver = drivers_table.get_item(Key={'driverId': driver_info['driverId']})
        
        if driver['Item']['rating'] >= 4.0 and driver['Item']['status'] == 'AVAILABLE':
            eligible_drivers.append({
                'driverId': driver['Item']['driverId'],
                'distanceKm': driver_info['distanceKm'],
                'rating': driver['Item']['rating'],
                'eta': driver_info['distanceKm'] / 40 * 60  # Assume 40 km/h average speed, convert to minutes
            })
    
    if not eligible_drivers:
        return {'error': 'No eligible drivers'}
    
    # Select best driver (closest with good rating)
    eligible_drivers.sort(key=lambda x: (x['distanceKm'], -x['rating']))
    selected_driver = eligible_drivers[0]
    
    # Create ride request
    ride_id = str(uuid.uuid4())
    ride = {
        'rideId': ride_id,
        'riderId': rider_id,
        'driverId': selected_driver['driverId'],
        'pickupLat': Decimal(str(pickup_lat)),
        'pickupLon': Decimal(str(pickup_lon)),
        'dropoffLat': Decimal(str(dropoff_lat)),
        'dropoffLon': Decimal(str(dropoff_lon)),
        'status': 'REQUESTED',
        'requestedAt': int(time.time() * 1000),
        'eta': selected_driver['eta']
    }
    
    rides_table.put_item(Item=ride)
    
    # Update driver status
    drivers_table.update_item(
        Key={'driverId': selected_driver['driverId']},
        UpdateExpression='SET #status = :status',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={':status': 'BUSY'}
    )
    
    # Remove from available drivers in Redis
    redis_client.zrem('drivers:available', selected_driver['driverId'])
    
    # Notify driver via WebSocket (SNS → Lambda → API Gateway Management API)
    sns.publish(
        TopicArn=DRIVER_NOTIFICATIONS_TOPIC,
        Message=json.dumps({
            'driverId': selected_driver['driverId'],
            'type': 'RIDE_REQUEST',
            'rideId': ride_id,
            'pickup': {'lat': pickup_lat, 'lon': pickup_lon},
            'eta': selected_driver['eta']
        })
    )
    
    return {
        'rideId': ride_id,
        'driver': {
            'driverId': selected_driver['driverId'],
            'eta': selected_driver['eta']
        }
    }
```

### Surge Pricing

```python
def calculate_surge_multiplier(pickup_lat, pickup_lon):
    """Dynamic pricing based on supply/demand"""
    
    # Get demand (recent ride requests in area)
    gh = geohash2.encode(pickup_lat, pickup_lon, precision=5)  # 2.4 km area
    
    recent_requests = rides_table.query(
        IndexName='geohash-timestamp-index',
        KeyConditionExpression='geohash = :gh AND requestedAt > :ts',
        ExpressionAttributeValues={
            ':gh': gh,
            ':ts': int(time.time() * 1000) - 300000  # Last 5 minutes
        }
    )
    
    demand = len(recent_requests['Items'])
    
    # Get supply (available drivers in area)
    supply = len(find_nearby_drivers(pickup_lat, pickup_lon, radius_km=2.4))
    
    # Calculate surge multiplier
    if supply == 0:
        surge = 3.0  # Max surge
    else:
        ratio = demand / supply
        
        if ratio < 1:
            surge = 1.0  # No surge
        elif ratio < 2:
            surge = 1.5
        elif ratio < 3:
            surge = 2.0
        else:
            surge = 3.0
    
    # Cache surge pricing
    redis_client.setex(
        f'surge:{gh}',
        300,  # 5 minutes
        surge
    )
    
    return surge
```

### Cost Estimation

**Kinesis Data Streams:**
```
Shards needed: 10M writes/sec ÷ 1000 writes/sec/shard = 10,000 shards
Cost: 10,000 shards × $0.015/hour × 730 hours = $109,500/month

PUT payload units: 10M/sec × 86,400 sec × 40 bytes ÷ 25 KB = 1.38B units/day
Cost: 1.38B × 30 × $0.014/million = $580/month

Total Kinesis: ~$110,080/month
```

**DynamoDB:**
```
Writes: 10M/sec × 2.6M sec/month = 26B writes/month
Cost: 26B × $1.25/million = $32,500/month

Storage: 242 TB × $0.25/GB = $60,500/month

Reads: 23,100/sec × 2.6M = 60B reads/month
With caching (95% hit): 3B reads × $0.25/million = $750/month

Total DynamoDB: ~$93,750/month
```

**ElastiCache Redis:**
```
Geospatial index: 1M drivers × 100 bytes = 100 MB (minimal)
cache.r5.large (13 GB): $0.168/hour × 730 = $123/month
```

**API Gateway WebSocket:**
```
Connection minutes: 1M drivers × 60 min/hour × 730 hours = 43.8B connection-minutes
Cost: 43.8B × $0.25/million = $10,950/month

Messages: 10M/sec × 2.6M sec = 26B messages
Cost: 26B × $1/million = $26,000/month

Total API Gateway: ~$36,950/month
```

**Lambda:**
```
Invocations: 26B (location updates) + 231/sec (ride requests) × 2.6M = 26.6B/month
Cost: 26.6B × $0.20/million = $5,320/month

Compute: 26.6B × 10ms × 128 MB = 34M GB-sec × $0.0000166667 = $567/month

Total Lambda: ~$5,887/month
```

**Total: ~$246,790/month** for 10M riders, 1M drivers

**Revenue:** 20M rides/day × $10 commission = $200M/day = $6B/month
**Infrastructure Cost %:** $246K / $6B = 0.004% (negligible)

---

## Design WhatsApp

### Requirements

**Functional:**
- Send/receive text messages
- Group chat (up to 256 members)
- Media sharing (photos, videos, documents)
- Read receipts
- Online/offline status
- End-to-end encryption

**Non-functional:**
- 2B users globally
- 100B messages/day
- 99.99% availability
- Message delivery latency: <1 second
- Support offline message delivery

### Capacity Estimation

**Traffic:**
```
Messages per second: 100B / 86,400 = 1.16M messages/sec average
Peak: 1.16M × 3 = 3.5M messages/sec

Concurrent connections: 500M users online simultaneously
```

**Storage:**
```
Message size: 100 bytes (text) + metadata = 200 bytes average
Media: 10% messages with 100 KB media = 10 KB average per message

Daily storage:
- Text: 100B × 200 bytes = 20 TB/day
- Media: 100B × 0.1 × 100 KB = 1 PB/day
- Total: 1.02 PB/day = 30.6 PB/month = 372 PB/year

With 1-year retention:
- Text: 20 TB × 365 = 7.3 PB
- Media: 1 PB × 365 = 365 PB
```

**Bandwidth:**
```
Ingress: 1.02 PB/day = 12 GB/sec
Egress (1:1 messaging): 12 GB/sec
Group messages (avg 5 members): 12 GB × 5 = 60 GB/sec
```

### Architecture

```
Users (Mobile/Web)
    ↓ WebSocket
API Gateway WebSocket API (500K connections per endpoint)
    ↓
Lambda (Message router)
    ↓
    ├─→ DynamoDB (Messages table)
    │       └─ TTL for ephemeral messages (30 days)
    │
    ├─→ SQS FIFO Queue (Offline message delivery)
    │       └─ Lambda (Retry delivery when user comes online)
    │
    ├─→ S3 (Media storage)
    │       └─ CloudFront (Media CDN)
    │
    ├─→ ElastiCache Redis (Online status, read receipts)
    │       └─ Pub/Sub for real-time updates
    │
    └─→ KMS (Encryption keys for E2E encryption)

Connection Management:
Lambda → DynamoDB (Connections table: userId → connectionId mapping)
```

### WebSocket Message Flow

```python
# Connection handler
def on_connect(event, context):
    """User connects to WebSocket"""
    connection_id = event['requestContext']['connectionId']
    user_id = event['queryStringParameters']['userId']
    
    # Store connection
    connections_table.put_item(
        Item={
            'userId': user_id,
            'connectionId': connection_id,
            'connectedAt': int(time.time() * 1000),
            'ttl': int(time.time()) + 86400
        }
    )
    
    # Set online status in Redis
    redis_client.setex(f'online:{user_id}', 300, '1')  # 5 min TTL
    
    # Publish online status to contacts
    contacts = get_contacts(user_id)
    for contact_id in contacts:
        publish_presence_update(contact_id, user_id, 'online')
    
    return {'statusCode': 200}

# Disconnect handler
def on_disconnect(event, context):
    """User disconnects"""
    connection_id = event['requestContext']['connectionId']
    
    # Get user ID
    response = connections_table.query(
        IndexName='connectionId-index',
        KeyConditionExpression='connectionId = :connId',
        ExpressionAttributeValues={':connId': connection_id}
    )
    
    if response['Items']:
        user_id = response['Items'][0]['userId']
        
        # Remove connection
        connections_table.delete_item(Key={'userId': user_id})
        
        # Update online status
        redis_client.delete(f'online:{user_id}')
        
        # Notify contacts
        contacts = get_contacts(user_id)
        for contact_id in contacts:
            publish_presence_update(contact_id, user_id, 'offline')
    
    return {'statusCode': 200}

# Send message handler
def send_message(event, context):
    """Route message to recipient(s)"""
    connection_id = event['requestContext']['connectionId']
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    
    # Parse message
    body = json.loads(event['body'])
    action = body['action']  # 'sendMessage' or 'sendGroupMessage'
    
    if action == 'sendMessage':
        return send_direct_message(body, connection_id, domain_name, stage)
    elif action == 'sendGroupMessage':
        return send_group_message(body, connection_id, domain_name, stage)

def send_direct_message(body, connection_id, domain_name, stage):
    """Send 1:1 message"""
    sender_id = body['senderId']
    recipient_id = body['recipientId']
    message_text = body['message']
    media_url = body.get('mediaUrl')
    
    # Generate message ID
    message_id = str(uuid.uuid4())
    
    # Store message in DynamoDB
    message = {
        'messageId': message_id,
        'senderId': sender_id,
        'recipientId': recipient_id,
        'message': message_text,
        'mediaUrl': media_url,
        'timestamp': int(time.time() * 1000),
        'status': 'SENT',
        'ttl': int(time.time()) + 2592000  # 30 days
    }
    
    messages_table.put_item(Item=message)
    
    # Check if recipient is online
    recipient_conn = connections_table.get_item(Key={'userId': recipient_id})
    
    apigw = boto3.client('apigatewaymanagementapi',
                         endpoint_url=f'https://{domain_name}/{stage}')
    
    if 'Item' in recipient_conn:
        # Recipient online: deliver immediately
        try:
            apigw.post_to_connection(
                ConnectionId=recipient_conn['Item']['connectionId'],
                Data=json.dumps({
                    'type': 'newMessage',
                    'messageId': message_id,
                    'senderId': sender_id,
                    'message': message_text,
                    'mediaUrl': media_url,
                    'timestamp': message['timestamp']
                }).encode()
            )
            
            # Update status
            messages_table.update_item(
                Key={'messageId': message_id},
                UpdateExpression='SET #status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': 'DELIVERED'}
            )
            
        except apigw.exceptions.GoneException:
            # Connection stale, queue for retry
            queue_offline_message(message)
    
    else:
        # Recipient offline: queue message
        queue_offline_message(message)
    
    # Send delivery receipt to sender
    sender_conn = connections_table.get_item(Key={'userId': sender_id})
    if 'Item' in sender_conn:
        apigw.post_to_connection(
            ConnectionId=sender_conn['Item']['connectionId'],
            Data=json.dumps({
                'type': 'messageDelivered',
                'messageId': message_id
            }).encode()
        )
    
    return {'statusCode': 200}

def queue_offline_message(message):
    """Queue message for offline user"""
    sqs.send_message(
        QueueUrl=OFFLINE_MESSAGES_QUEUE,
        MessageBody=json.dumps(message),
        MessageGroupId=message['recipientId'],  # FIFO ordering per user
        MessageDeduplicationId=message['messageId']
    )

# Offline message processor
def process_offline_messages(event, context):
    """Deliver queued messages when user comes online"""
    for record in event['Records']:
        message = json.loads(record['body'])
        recipient_id = message['recipientId']
        
        # Check if user online now
        recipient_conn = connections_table.get_item(Key={'userId': recipient_id})
        
        if 'Item' in recipient_conn:
            # User online: deliver message
            apigw = boto3.client('apigatewaymanagementapi',
                                 endpoint_url=f'https://{domain_name}/{stage}')
            
            try:
                apigw.post_to_connection(
                    ConnectionId=recipient_conn['Item']['connectionId'],
                    Data=json.dumps({
                        'type': 'newMessage',
                        'messageId': message['messageId'],
                        'senderId': message['senderId'],
                        'message': message['message'],
                        'timestamp': message['timestamp']
                    }).encode()
                )
                
                # Update status
                messages_table.update_item(
                    Key={'messageId': message['messageId']},
                    UpdateExpression='SET #status = :status',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={':status': 'DELIVERED'}
                )
                
            except:
                # User disconnected again, message stays in queue
                pass
```

### Group Chat

```python
def send_group_message(body, connection_id, domain_name, stage):
    """Broadcast message to group members"""
    sender_id = body['senderId']
    group_id = body['groupId']
    message_text = body['message']
    
    # Get group members
    group = groups_table.get_item(Key={'groupId': group_id})
    members = group['Item']['members']  # List of userIds
    
    # Generate message ID
    message_id = str(uuid.uuid4())
    
    # Store message
    group_messages_table.put_item(
        Item={
            'groupId': group_id,
            'messageId': message_id,
            'timestamp': int(time.time() * 1000),
            'senderId': sender_id,
            'message': message_text,
            'ttl': int(time.time()) + 2592000
        }
    )
    
    # Broadcast to all members
    apigw = boto3.client('apigatewaymanagementapi',
                         endpoint_url=f'https://{domain_name}/{stage}')
    
    for member_id in members:
        if member_id == sender_id:
            continue  # Don't send to self
        
        # Check if member online
        member_conn = connections_table.get_item(Key={'userId': member_id})
        
        if 'Item' in member_conn:
            try:
                apigw.post_to_connection(
                    ConnectionId=member_conn['Item']['connectionId'],
                    Data=json.dumps({
                        'type': 'groupMessage',
                        'groupId': group_id,
                        'messageId': message_id,
                        'senderId': sender_id,
                        'message': message_text,
                        'timestamp': group_messages_table.item['timestamp']
                    }).encode()
                )
            except:
                # Queue for offline delivery
                queue_offline_message({
                    'messageId': message_id,
                    'recipientId': member_id,
                    'senderId': sender_id,
                    'groupId': group_id,
                    'message': message_text
                })
        else:
            # Member offline
            queue_offline_message({
                'messageId': message_id,
                'recipientId': member_id,
                'senderId': sender_id,
                'groupId': group_id,
                'message': message_text
            })
    
    return {'statusCode': 200}
```

### Read Receipts with DynamoDB Streams

```python
# DynamoDB Stream handler
def process_message_updates(event, context):
    """Send read receipts when message status changes"""
    for record in event['Records']:
        if record['eventName'] == 'MODIFY':
            old_image = record['dynamodb']['OldImage']
            new_image = record['dynamodb']['NewImage']
            
            # Check if status changed to READ
            if (new_image.get('status', {}).get('S') == 'READ' and
                old_image.get('status', {}).get('S') != 'READ'):
                
                message_id = new_image['messageId']['S']
                sender_id = new_image['senderId']['S']
                
                # Notify sender
                sender_conn = connections_table.get_item(Key={'userId': sender_id})
                if 'Item' in sender_conn:
                    apigw = boto3.client('apigatewaymanagementapi')
                    apigw.post_to_connection(
                        ConnectionId=sender_conn['Item']['connectionId'],
                        Data=json.dumps({
                            'type': 'messageRead',
                            'messageId': message_id,
                            'readAt': int(time.time() * 1000)
                        }).encode()
                    )
```

### End-to-End Encryption

```python
# Client-side encryption (conceptual - done in mobile app)
def encrypt_message(message, recipient_public_key):
    """Encrypt message with recipient's public key"""
    from cryptography.hazmat.primitives.asymmetric import rsa, padding
    from cryptography.hazmat.primitives import hashes
    
    # Encrypt message
    encrypted = recipient_public_key.encrypt(
        message.encode(),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    
    return encrypted

def decrypt_message(encrypted_message, private_key):
    """Decrypt message with own private key"""
    decrypted = private_key.decrypt(
        encrypted_message,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    
    return decrypted.decode()

# Server stores encrypted messages (cannot read content)
# Encryption keys stored in KMS, managed by clients
```

### Cost Estimation

**API Gateway WebSocket:**
```
Concurrent connections: 500M users
Connection minutes: 500M × 60 min/hour × 730 hours = 21.9T connection-minutes
Cost: 21.9T × $0.25/million = $5,475,000/month

Messages: 1.16M/sec × 2.6M sec = 3T messages/month
Cost: 3T × $1/million = $3,000,000/month

Total API Gateway: ~$8,475,000/month
```

**DynamoDB:**
```
Writes: 1.16M/sec × 2.6M = 3T writes/month
Cost: 3T × $1.25/million = $3,750,000/month

Reads: Assume 2 reads per message (sender query + recipient query)
Cost: 6T × $0.25/million = $1,500,000/month

Storage: 7.3 PB text × $0.25/GB = $1,825,000/month

Total DynamoDB: ~$7,075,000/month
```

**S3 + CloudFront (Media):**
```
Storage: 365 PB × $0.023/GB = $8,395,000/month
CloudFront: 60 GB/sec × 2.6M sec = 156 PB × $0.085/GB = $13,260,000/month

Total Media: ~$21,655,000/month
```

**SQS (Offline messages):**
```
Assume 30% messages offline: 30B/day = 900B/month
Cost: 900B × $0.40/million = $360,000/month
```

**ElastiCache Redis:**
```
Online status + read receipts: 500M users × 100 bytes = 50 GB
cache.r5.4xlarge (104 GB) × 10 nodes: $0.672/hour × 10 × 730 = $4,906/month
```

**Total: ~$37,570,000/month** for 2B users, 100B messages/day

**Per User Cost:** $37.57M / 2B = $0.019/user/month

**Revenue (hypothetical):** $1/user/month = $2B/month
**Profit:** $2B - $37.57M = $1.96B/month (98% margin)

---

## Common Patterns and Best Practices

### 1. Caching Strategy

**Multi-Layer Caching:**
```
CloudFront (Edge) → ElastiCache (Application) → DynamoDB (Database)

Cache hit rates:
- CloudFront: 90% (static content)
- ElastiCache: 80% (dynamic data)
- Effective read reduction: 98%
```

### 2. Data Partitioning

**Strategies:**
- **Geohash partitioning**: Uber, location-based apps
- **User ID hashing**: Twitter, WhatsApp
- **Time-based**: Analytics pipelines
- **Hybrid**: Instagram (userId + timestamp)

### 3. Read vs Write Optimization

**Read-Heavy (Twitter, Instagram):**
- Fanout-on-write for regular users
- Fanout-on-read for celebrities
- Aggressive caching with ElastiCache

**Write-Heavy (Uber, WhatsApp):**
- Batch writes with Kinesis
- Async processing with SQS
- DynamoDB Streams for derived data

### 4. Handling Hot Partitions

**Solutions:**
- Write sharding: Add random suffix to partition key
- Read replicas: Distribute reads across replicas
- Caching: ElastiCache for hot data
- Application-level sharding: Pre-aggregate data

### 5. Cost Optimization

**Tactics:**
- Reserved capacity for predictable workloads (30-70% savings)
- S3 Intelligent-Tiering for variable access patterns
- CloudFront caching to reduce origin requests
- DynamoDB on-demand for unpredictable traffic
- Lambda provisioned concurrency for low latency

---

## Summary

This guide covered **5 FAANG-level system designs** with complete AWS implementations:

1. **Twitter**: Hybrid fanout strategy, 100M DAU, ~$110K/month
2. **Netflix**: Video streaming, CloudFront CDN, 200M users, ~$4.4M/month
3. **Uber**: Geospatial indexing, real-time matching, 10M riders, ~$247K/month
4. **WhatsApp**: WebSocket messaging, E2E encryption, 2B users, ~$37.6M/month
5. **Instagram**: Photo sharing, feed generation (coming next)

**Key Takeaways:**

- **Capacity estimation** is critical (traffic, storage, bandwidth)
- **Data modeling** drives architecture (DynamoDB vs RDS)
- **Caching** reduces costs by 90%+ (CloudFront, ElastiCache)
- **Async processing** enables scale (Kinesis, SQS, Lambda)
- **Multi-region** for global scale (CloudFront, DynamoDB Global Tables)

Master these patterns for FAANG interviews—expect whiteboard system design with service selection, capacity math, cost analysis, and scaling strategies.
