# FAANG Backend Interview Preparation Guide

## Table of Contents
1. [Interview Process Overview](#interview-process-overview)
2. [Coding Interview Strategies](#coding-interview-strategies)
3. [System Design Interview Framework](#system-design-interview-framework)
4. [Behavioral Interview Preparation](#behavioral-interview-preparation)
5. [Company-Specific Tips](#company-specific-tips)
6. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
7. [Practice Resources](#practice-resources)
8. [Timeline & Study Plan](#timeline--study-plan)

---

## Interview Process Overview

### Typical FAANG Interview Stages

**1. Phone Screen** (45-60 min)
- 1-2 coding questions (LeetCode Easy/Medium)
- Behavioral questions
- **Pass Rate**: ~30%

**2. Onsite/Virtual Onsite** (4-6 rounds × 45-60 min)
- **Coding** (2-3 rounds): LeetCode Medium/Hard
- **System Design** (1-2 rounds): Design scalable systems
- **Behavioral** (1 round): Leadership principles, past experience
- **Domain-Specific** (Optional): ML, distributed systems, etc.
- **Pass Rate**: ~15-20%

**3. Hiring Committee**
- Review feedback from all rounds
- Decision: Hire / No hire / Repeat interview

**Total Timeline**: 6-8 weeks from application to offer

---

## Coding Interview Strategies

### Before the Interview

**Preparation**:
```
Timeframe: 3-6 months
Target: 200-300 problems (LeetCode)
Distribution:
- Easy: 30% (confidence builders)
- Medium: 60% (interview standard)
- Hard: 10% (FAANG level)
```

**Problem Categories** (Master these):
```
1. Arrays & Strings (40 problems)
2. Linked Lists (20 problems)
3. Trees & Graphs (40 problems)
4. Dynamic Programming (30 problems)
5. Sorting & Searching (20 problems)
6. Hash Tables (20 problems)
7. Stacks & Queues (15 problems)
8. Recursion & Backtracking (15 problems)
```

### During the Interview

**Step-by-Step Framework**:

**1. Clarify the Problem** (2-3 min)
```
Questions to Ask:
- Input format? (e.g., sorted array? can have duplicates?)
- Output format?
- Edge cases? (empty input, negative numbers, etc.)
- Constraints? (time/space complexity requirements)

Example:
Interviewer: "Find two numbers that sum to target"
You: "Can the array have duplicates?" → Clarify!
     "Should I return indices or values?"
     "What if no solution exists?"
```

**2. Think Out Loud** (5-7 min)
```
Approach:
1. Start with brute force
   "The naive approach would be nested loops, O(n²)"
   
2. Optimize
   "Can use hash table to get O(n) time, O(n) space"
   
3. Discuss trade-offs
   "Time vs space: hash table faster but uses more memory"
   
4. Propose best solution
   "I'll implement the hash table approach"
```

**3. Write Code** (20-25 min)
```
Best Practices:
✅ Use meaningful variable names (not x, y, z)
✅ Write clean, readable code
✅ Add comments for complex logic
✅ Handle edge cases
✅ Test as you go
```

**4. Test Your Code** (5-7 min)
```
Test Cases:
1. Normal case: [1,2,3,4], target=5 → [1,4]
2. Edge case: [], target=0 → null
3. Edge case: [1], target=1 → null
4. Large input: [1..10000], target=19999

Walk through code line by line with test case
```

**5. Analyze Complexity** (2-3 min)
```
Time: O(n) - single pass through array
Space: O(n) - hash table storage
```

### Example Problem Walkthrough

**Problem**: Two Sum (LeetCode #1)
```
Given array of integers, return indices of two numbers that add to target.
```

**Interview Dialogue**:
```
[Clarify]
You: "Can the array have duplicates?"
Interviewer: "Yes"
You: "Can I use the same element twice?"
Interviewer: "No, each element used once"
You: "What if no solution?"
Interviewer: "Assume exactly one solution"

[Think Out Loud]
You: "Brute force: Check all pairs - O(n²) time, O(1) space"
     "Better: Use hash table to store seen numbers"
     "As I iterate, check if complement (target - current) exists"
     "O(n) time, O(n) space"

[Code]
```

```python
def twoSum(nums, target):
    """
    Time: O(n)
    Space: O(n)
    """
    seen = {}  # num -> index
    
    for i, num in enumerate(nums):
        complement = target - num
        
        if complement in seen:
            return [seen[complement], i]
        
        seen[num] = i
    
    return None  # No solution (shouldn't reach here per problem)
```

```
[Test]
You: "Let me test with [2,7,11,15], target=9"
     "i=0, num=2, complement=7, not in seen, seen={2:0}"
     "i=1, num=7, complement=2, found! return [0,1]" ✓

[Edge Cases]
You: "Edge case: [1], target=2 → no pair, return None"
     "Edge case: [3,3], target=6 → [0,1]" ✓

[Complexity]
You: "Time complexity: O(n) single pass"
     "Space complexity: O(n) for hash table"
```

### Common Patterns to Master

**1. Sliding Window**
```python
# Max sum subarray of size k
def maxSumSubarray(arr, k):
    window_sum = sum(arr[:k])
    max_sum = window_sum
    
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i-k]  # Slide window
        max_sum = max(max_sum, window_sum)
    
    return max_sum
```

**2. Two Pointers**
```python
# Remove duplicates from sorted array (in-place)
def removeDuplicates(nums):
    if not nums:
        return 0
    
    slow = 0
    for fast in range(1, len(nums)):
        if nums[fast] != nums[slow]:
            slow += 1
            nums[slow] = nums[fast]
    
    return slow + 1
```

**3. Fast & Slow Pointers**
```python
# Detect cycle in linked list
def hasCycle(head):
    slow = fast = head
    
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        
        if slow == fast:
            return True
    
    return False
```

**4. Binary Search**
```python
# Find insert position in sorted array
def searchInsert(nums, target):
    left, right = 0, len(nums) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return left
```

---

## System Design Interview Framework

### Preparation

**Must-Know Systems**:
```
1. URL Shortener (entry-level)
2. Twitter/News Feed
3. WhatsApp/Chat System
4. YouTube/Video Streaming
5. Uber/Location Services
6. Distributed Cache (Redis)
7. Rate Limiter
8. Search Engine
```

**Key Concepts**:
```
- CAP Theorem
- Load Balancing
- Caching (Cache-Aside, Write-Through)
- Database Scaling (Replication, Sharding)
- Microservices vs Monolith
- Message Queues
- CDN
```

### Interview Framework (45-60 min)

**1. Clarify Requirements** (5-7 min)

**Functional**:
```
Interviewer: "Design Twitter"
You: "Let me clarify the scope:"
     - Post tweets (280 chars)?
     - Follow users?
     - Timeline (user feed)?
     - Search?
     - Notifications?
     - Direct messages?
     
Interviewer: "Focus on posting and timeline"
```

**Non-Functional**:
```
You: "Scale requirements?"
     - Users: 300M monthly active
     - Tweets: 500M per day
     - Read:Write ratio: 100:1 (read-heavy)
     
     "Performance requirements?"
     - Timeline load: < 500ms
     - High availability: 99.9%
```

**2. Capacity Estimation** (5 min)

```
Traffic:
- Daily active users: 100M
- Tweets per day: 500M
- Tweets per second: 500M / 86400 = ~6000 writes/sec
- Reads per second: 6000 × 100 = 600K reads/sec

Storage:
- Tweet size: 280 chars × 2 bytes = 560 bytes
  + metadata (user_id, timestamp, etc.) = ~1KB
- Daily: 500M × 1KB = 500GB/day
- 5 years: 500GB × 365 × 5 = ~900TB

Bandwidth:
- Ingress: 6000 tweets/sec × 1KB = 6 MB/sec
- Egress: 600K reads/sec × 1KB = 600 MB/sec

Cache:
- 80/20 rule: 20% tweets = 80% traffic
- Cache size: 900TB × 0.2 = 180TB (impractical)
- Cache hot data: Last 24 hours = 500GB
```

**3. High-Level Design** (10 min)

```
Draw on whiteboard:

┌─────────┐
│ Client  │
└────┬────┘
     │
     ▼
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
       ├────────────┬────────────┐
       ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Web      │  │ Web      │  │ Web      │
│ Server 1 │  │ Server 2 │  │ Server 3 │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┴─────────────┘
                   │
          ┌────────┼────────┐
          │        │        │
          ▼        ▼        ▼
    ┌─────────┬─────────┬─────────┐
    │ Redis   │Postgres │  CDN    │
    │ Cache   │Database │         │
    └─────────┴─────────┴─────────┘
```

**4. Deep Dive** (20-25 min)

**Interviewer**: "How do you generate the timeline?"

**You**: "Two approaches:

**Fan-out on Write (Push)**:
```
When user posts tweet:
1. Write to own timeline
2. Fan out to all followers' timelines

Pros: Fast reads (pre-computed)
Cons: Slow writes for celebrities (millions of followers)
```

**Fan-out on Read (Pull)**:
```
When user views timeline:
1. Fetch tweets from all followed users
2. Merge and sort

Pros: Fast writes
Cons: Slow reads
```

**Hybrid**:
```
Regular users: Fan-out on write
Celebrities: Fan-out on read

Timeline = Pre-computed + Real-time celebrity tweets
```

**Interviewer**: "How do you handle hotspots?"

**You**: "Strategies:
1. **Sharding**: Partition users by ID (user_id % 100)
2. **Read replicas**: Multiple DB replicas for reads
3. **Caching**: Cache hot tweets (last 24h)
4. **Rate limiting**: Limit requests per user
"

**5. Wrap Up** (5 min)

**Bottlenecks**:
```
You: "Potential bottlenecks:
     - Database (handle with sharding, replicas)
     - Single point of failure (load balancer)
     - Storage (use object storage like S3 for media)"
```

**Trade-offs**:
```
You: "Design choices:
     - Consistency vs Availability: Chose AP (eventual consistency)
     - Read vs Write optimization: Optimized for reads (read-heavy)
     - Cost vs Performance: Caching reduces DB load but increases cost"
```

---

## Behavioral Interview Preparation

### Amazon Leadership Principles

**Must-Know Principles**:
```
1. Customer Obsession
2. Ownership
3. Invent and Simplify
4. Are Right, A Lot
5. Learn and Be Curious
6. Hire and Develop the Best
7. Insist on the Highest Standards
8. Think Big
9. Bias for Action
10. Deliver Results
```

### STAR Method

**Format**:
```
Situation: Context, background
Task: Your responsibility
Action: What you did (detailed!)
Result: Outcome, metrics
```

**Example**:
```
Question: "Tell me about a time you had a conflict with a teammate"

Situation:
"In my previous role, I was leading the backend for a payment system.
My teammate wanted to use MongoDB, but I believed PostgreSQL was better
for our transaction-heavy workload."

Task:
"As tech lead, I needed to make the final decision while keeping the
team aligned."

Action:
"I organized a technical discussion where we each presented pros/cons.
I created a comparison doc: consistency, ACID, query performance.
We ran benchmarks - PostgreSQL handled 10K TPS vs MongoDB's 3K TPS.
I acknowledged MongoDB's strengths (schema flexibility) but our use
case needed strong consistency."

Result:
"Team agreed on PostgreSQL. System handled peak of 50K TPS with zero
data inconsistencies. Teammate appreciated the data-driven approach
and we maintained a strong working relationship."
```

### Common Behavioral Questions

**Leadership**:
```
- Tell me about a time you led a project
- Describe a situation where you had to convince someone
- Tell me about a time you disagreed with your manager
```

**Problem-Solving**:
```
- Describe your most challenging technical problem
- Tell me about a time you made a mistake
- How do you handle ambiguity?
```

**Teamwork**:
```
- Tell me about a time you helped a struggling teammate
- Describe a conflict with a coworker
- Tell me about a time you received critical feedback
```

---

## Company-Specific Tips

### Google

**Focus**:
- **Algorithms**: Strong CS fundamentals
- **System Design**: Scalability, distributed systems
- **Coding**: Clean, efficient code

**Interview Style**:
- Collaborative, expect hints
- Emphasis on problem-solving approach
- Follow-up questions to probe depth

**Behavioral**:
- "Googleyness" - humility, collaboration
- Growth mindset

### Facebook (Meta)

**Focus**:
- **Coding**: Fast problem-solving
- **System Design**: Scale (billions of users)
- **Product Sense**: Sometimes asked for backend

**Interview Style**:
- Fast-paced, multiple problems
- Expect to code in real IDE (not whiteboard)
- System design very important for senior roles

**Behavioral**:
- Culture fit, impact-driven

### Amazon

**Focus**:
- **Leadership Principles**: Heavy weight
- **Coding**: Standard algorithms
- **System Design**: Practical, AWS-based

**Interview Style**:
- Bar raiser round (extra hard)
- Expect detailed STAR responses
- Scenario-based questions

**Behavioral**:
- 14 Leadership Principles
- Customer obsession paramount

### Apple

**Focus**:
- **Low-level**: Systems programming, memory
- **Design**: Elegant, efficient solutions
- **Domain-specific**: Often role-specific (e.g., ML)

**Interview Style**:
- Deep technical knowledge
- Multiple rounds with same team
- Product-focused

---

## Practice Resources

**LeetCode**:
```
Patterns to Master (100 problems):
- Top Interview Questions
- Blind 75
- Grind 75
```

**System Design**:
```
Books:
- "Designing Data-Intensive Applications" (Martin Kleppmann)
- "System Design Interview" (Alex Xu)

Videos:
- Gaurav Sen (YouTube)
- System Design Primer (GitHub)
```

**Mock Interviews**:
```
Platforms:
- Pramp (free peer-to-peer)
- Interviewing.io (paid, real engineers)
- LeetCode Mock Interview
```

---

## Timeline & Study Plan

**3-Month Plan**:

**Month 1: Foundations**
```
Week 1-2: Data Structures (Arrays, Linked Lists, Trees)
Week 3-4: Algorithms (Sorting, Searching, Recursion)
Target: 60 Easy problems
```

**Month 2: Intermediate**
```
Week 5-6: Advanced DS (Graphs, Heaps, Tries)
Week 7-8: Dynamic Programming, Greedy
Target: 60 Medium problems
System Design: Read "System Design Interview"
```

**Month 3: Advanced + Mock**
```
Week 9-10: Hard problems, System Design practice
Week 11-12: Mock interviews, company-specific prep
Target: 20 Hard problems, 10 system design problems
```

**Daily Schedule** (3-4 hours/day):
```
- 1-2 hours: Coding (2 problems)
- 1 hour: System design (1 problem/week)
- 30 min: Behavioral (write STAR stories)
- 30 min: Review mistakes
```

---

This complete interview guide covers coding strategies, system design framework, behavioral preparation, and company-specific tips for FAANG success!
