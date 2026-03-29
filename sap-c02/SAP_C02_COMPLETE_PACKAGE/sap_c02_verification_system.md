# SAP-C02 Knowledge Verification Quiz System

## How Verification Works

When you mark a topic as "Completed" in your Progress Tracker, tell me which topic you've completed. I will then:

1. **Generate 5-10 targeted questions** specific to that topic
2. **Test practical application** (not just memorization)
3. **Provide detailed explanations** for each answer
4. **Calculate your score** and determine if you've verified the topic (80%+ required)
5. **Identify weak areas** within the topic if score < 80%

---

## Verification Standards

**✅ VERIFIED (80-100%):** Topic mastered, move forward  
**🔄 PARTIAL (60-79%):** Review weak areas, retake quiz in 2-3 days  
**❌ NEEDS REVIEW (<60%):** Study topic again thoroughly before retesting

---

## Sample Verification Quizzes

### Topic: EC2 Basics

**Question 1:** You need to run a batch processing job that can tolerate interruptions and needs to be cost-optimized. The job takes 2-4 hours to complete. Which EC2 pricing model is BEST?

A) On-Demand Instances  
B) Reserved Instances (1-year term)  
C) Spot Instances  
D) Dedicated Hosts

**Answer:** C - Spot Instances  
**Explanation:** Spot Instances provide up to 90% savings for interruptible workloads. Batch jobs are ideal candidates since they can be restarted if interrupted. On-Demand is too expensive for batch work. Reserved requires long-term commitment (not needed for occasional jobs).

---

**Question 2:** An application requires high disk I/O and low latency. Which combination is MOST appropriate?

A) T3 instance with gp3 EBS volume  
B) I3 instance with instance store  
C) M5 instance with io2 EBS volume  
D) C5 instance with st1 EBS volume

**Answer:** B - I3 instance with instance store  
**Explanation:** Instance store provides lowest latency (directly attached NVMe SSD). I3 instances are storage-optimized with high instance store capacity. Important: Data is lost on instance stop/terminate, so only for temporary data or applications with data replication.

---

**Question 3:** You accidentally terminated an EC2 instance. The instance had critical data on its EBS root volume. Can you recover the data?

A) Yes, if EBS Delete on Termination was disabled  
B) Yes, from automated EBS snapshots  
C) No, EBS volumes are always deleted on termination  
D) Yes, from instance store backups

**Answer:** A  
**Explanation:** By default, root EBS volumes have "Delete on Termination" enabled, but if this was disabled, the volume persists after termination and can be attached to another instance. Automated EBS snapshots don't exist (you must create them). Instance store is ephemeral (always lost on termination).

---

**Question 4:** What is the difference between stopping and hibernating an EC2 instance?

A) No difference, both preserve RAM state  
B) Hibernating saves RAM to EBS, stopping does not  
C) Stopping is faster than hibernating  
D) Hibernating deletes the instance, stopping pauses it

**Answer:** B  
**Explanation:** 
- **Stop:** Instance shuts down, RAM cleared, EBS volumes persist, no instance charges (EBS charges continue)
- **Hibernate:** RAM contents saved to EBS root volume, faster boot (application state preserved), must be enabled at launch

---

**Question 5:** You need to run an application that requires a dedicated physical server for licensing compliance. Which option meets this requirement at the LOWEST cost?

A) On-Demand Dedicated Hosts  
B) Reserved Dedicated Hosts  
C) Dedicated Instances  
D) Regular Reserved Instances

**Answer:** B - Reserved Dedicated Hosts  
**Explanation:** Dedicated Hosts provide physical server isolation needed for BYOL (Bring Your Own License). Reserved Dedicated Hosts offer significant savings (up to 70%) vs On-Demand. Dedicated Instances provide isolation but not physical server visibility needed for some licenses.

---

### Topic: VPC Fundamentals

**Question 1:** A VPC has CIDR block 10.0.0.0/16. How many usable IP addresses are available?

A) 65,536  
B) 65,531  
C) 65,532  
D) 65,516

**Answer:** B - 65,531  
**Explanation:** 
- /16 = 2^16 = 65,536 total IPs
- AWS reserves 5 IPs per subnet (network, router, DNS, future, broadcast)
- But for overall VPC CIDR, it's the subnet reservations that matter
- Each subnet you create will lose 5 IPs
- The question asks about VPC-level usable IPs = 65,536 - 5 = 65,531

---

**Question 2:** What is the difference between a Security Group and a Network ACL?

A) Security Groups are stateful, NACLs are stateless  
B) Security Groups apply to VPCs, NACLs apply to instances  
C) Security Groups block traffic, NACLs allow traffic  
D) No difference, they're interchangeable

**Answer:** A  
**Explanation:**
- **Security Groups:** Stateful (return traffic automatically allowed), instance-level, allow rules only, evaluated as a whole
- **NACLs:** Stateless (must allow return traffic explicitly), subnet-level, allow and deny rules, rules evaluated in order

---

**Question 3:** You need to allow EC2 instances in a private subnet to download updates from the internet without exposing them to inbound internet traffic. What do you need?

A) Internet Gateway only  
B) NAT Gateway in private subnet  
C) NAT Gateway in public subnet + route in private subnet route table  
D) Virtual Private Gateway

**Answer:** C  
**Explanation:**
- NAT Gateway must be in public subnet (needs internet access)
- Private subnet route table points 0.0.0.0/0 to NAT Gateway
- NAT Gateway translates private IPs to public IPs for outbound traffic
- No inbound internet access allowed (NAT is one-way for inbound)

---

**Question 4:** Two EC2 instances in the same VPC but different subnets cannot communicate. What could be the issue? (Select TWO)

A) Route table doesn't have local route  
B) Security groups don't allow traffic between instances  
C) NACLs blocking traffic  
D) Instances need Elastic IPs  
E) VPC Peering not configured

**Answers:** B and C  
**Explanation:**
- Local route (VPC CIDR) is automatically created and cannot be deleted
- Security groups might not allow the necessary ports
- NACLs might have deny rules blocking traffic
- Elastic IPs not needed for intra-VPC communication
- VPC Peering not needed within same VPC

---

**Question 5:** You want to monitor rejected connection attempts to your EC2 instances. What should you enable?

A) CloudWatch Logs  
B) VPC Flow Logs with REJECT filter  
C) CloudTrail logging  
D) Security Group logging

**Answer:** B  
**Explanation:** VPC Flow Logs capture information about IP traffic going to/from network interfaces. You can filter for ACCEPT, REJECT, or ALL traffic. Security Groups don't have native logging. CloudTrail logs API calls, not network traffic.

---

### Topic: S3 Fundamentals

**Question 1:** You need to host a static website on S3. Which configuration is required?

A) S3 bucket policy allowing public read access + static website hosting enabled  
B) CloudFront distribution only  
C) S3 bucket must be in specific region  
D) ACLs set to public on all objects

**Answer:** A  
**Explanation:** Static website hosting must be enabled on bucket. Bucket policy must allow public read access (unless using CloudFront with OAI). CloudFront is optional (but recommended for better performance). Region doesn't matter for static hosting. While ACLs can work, bucket policies are preferred.

---

**Question 2:** What is the difference between S3 Standard-IA and S3 One Zone-IA?

A) Standard-IA has faster retrieval  
B) One Zone-IA stores data in single AZ, Standard-IA across multiple AZs  
C) Standard-IA is cheaper  
D) One Zone-IA has higher durability

**Answer:** B  
**Explanation:**
- **Standard-IA:** Multiple AZs, 99.9% availability, higher cost than One Zone
- **One Zone-IA:** Single AZ, 99.5% availability, 20% cheaper, less resilience
- Both have same retrieval speed and 11 9's durability (within their scope)
- Use One Zone for reproducible data or secondary backups

---

**Question 3:** Which S3 encryption option allows you to manage encryption keys outside of AWS?

A) SSE-S3  
B) SSE-KMS  
C) SSE-C  
D) Client-side encryption

**Answer:** C - SSE-C  
**Explanation:**
- **SSE-S3:** AWS manages keys (AES-256)
- **SSE-KMS:** AWS KMS manages keys (you control via KMS)
- **SSE-C:** You provide encryption keys with each request (AWS encrypts/decrypts but doesn't store key)
- **Client-side:** You encrypt before upload (full control, AWS doesn't know about encryption)

---

**Question 4:** You need to automatically transition objects to Glacier after 90 days and delete them after 7 years. What do you use?

A) S3 Batch Operations  
B) S3 Lifecycle Policy  
C) Lambda function with EventBridge trigger  
D) S3 Inventory reports

**Answer:** B  
**Explanation:** S3 Lifecycle Policies automatically transition objects between storage classes and delete objects based on age. Perfect for this automated, time-based scenario. No code needed.

**Example policy:**
- Transition to Glacier: after 90 days
- Expire (delete): after 2,555 days (7 years)

---

**Question 5:** Cross-Region Replication (CRR) is enabled on an S3 bucket. What is NOT replicated by default?

A) New objects uploaded after CRR enabled  
B) Object metadata  
C) Objects that existed before CRR was enabled  
D) Delete markers

**Answer:** C  
**Explanation:** CRR only replicates objects uploaded AFTER replication is enabled. Pre-existing objects require S3 Batch Replication to copy. Metadata and delete markers are replicated by default. Object tags can be replicated if configured.

---

## Template for Creating New Quizzes

When a student completes a topic, use this structure:

```
### Verification Quiz: [TOPIC NAME]
**Date:** [DATE]
**Required Score:** 80% (4/5 or 8/10 correct)

[Generate 5-10 scenario-based questions covering:]
1. Core concept understanding
2. Service comparisons (vs alternatives)
3. Common misconceptions
4. Real-world application
5. Integration with other services
6. Best practices
7. Cost implications
8. Performance considerations
9. Security aspects
10. Troubleshooting scenarios

**Results:**
Score: __ / __ (__ %)
Status: ✅ VERIFIED | 🔄 PARTIAL | ❌ NEEDS REVIEW

**Weak Areas Identified:**
- [List specific sub-topics that need more study]

**Recommendation:**
[Next steps based on score]
```

---

## How to Use This System

### Step 1: Study a Topic
Complete the learning materials for a specific topic in your study plan.

### Step 2: Mark as Completed
In your Progress Tracker, check the boxes for that topic.

### Step 3: Request Verification
Tell me: "I've completed [TOPIC NAME], please verify my knowledge"

### Step 4: Take the Quiz
I'll generate 5-10 questions. Answer them one by one or all at once.

### Step 5: Review Results
- ✅ 80%+: Topic verified! Move to next topic
- 🔄 60-79%: Review weak areas, retake in 2-3 days  
- ❌ <60%: Restudy the topic thoroughly, retake in 1 week

### Step 6: Track Progress
Update your Progress Tracker with verification status.

---

## Verification History Template

Keep track of all your verification attempts:

| Topic | Attempt | Date | Score | Status | Notes |
|-------|---------|------|-------|--------|-------|
| EC2 Basics | 1 | 2024-03-01 | 60% | 🔄 Needs Review | Confused on pricing models |
| EC2 Basics | 2 | 2024-03-03 | 90% | ✅ Verified | Much better! |
| VPC Fundamentals | 1 | 2024-03-05 | 100% | ✅ Verified | Solid understanding |

---

## Tips for Passing Verification Quizzes

1. **Don't rush** - Think through each question carefully
2. **Eliminate wrong answers** first - Narrow down to 2 options
3. **Consider all requirements** - Questions often test multiple concepts
4. **Think practical** - How would you solve this in real world?
5. **Read explanations** - Even for correct answers, understand why
6. **Don't memorize** - Understand the underlying concepts
7. **Retake if needed** - No shame in reviewing and trying again

---

## Ready to Start?

Tell me which topic you want to complete first, and I'll guide you through the verification process!

Example: "I'm ready to start with EC2 Basics. Please verify my knowledge when I tell you I've completed it."

Then, when you've studied EC2 Basics, say: "I've completed EC2 Basics, please give me the verification quiz."

Let's get you certified! 🎯
