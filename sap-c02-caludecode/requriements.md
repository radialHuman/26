I'm preparing for the AWS Certified Solutions Architect Professional (SAP-C02) exam nd need to pass in flying colors. I'm a beginner with AWS (currently ~30% exam ready, need 120% to be confident). I have strong conceptual/architectural thinking but lack AWS-specific terminology and implementation knowledge.

CRITICAL CONTEXT FROM PREVIOUS SESSION:
- I completed a baseline assessment revealing: good security mindset (95%), architectural reasoning (90%), but weak on AWS service names, configuration details, and cost estimation
- I don't know how to configure services or write implementation code
- I need to understand concepts deeply (explain like I'm learning from scratch), not just memorize
- I tend to know concepts but not AWS's specific terms for them
- I'm going offline for extended period - need EVERYTHING in ONE conversation

WHAT I NEED (NON-NEGOTIABLE REQUIREMENTS):

1. EXHAUSTIVE DEEP-DIVES FOR ALL 30 TOP SAP-C02 SERVICES
   Each service MUST have ALL 10 sections with 4,000-5,000 words MINIMUM:
   - What problem it solved (with real-world examples)
   - What existed before this service (historical context)
   - When to use it (specific scenarios + when NOT to use)
   - How it differs from similar services (comparison tables)
   - Underlying mechanism and how it's made (technical architecture)
   - Its basic components and its working and history
   - Cost (detailed breakdown with calculations and examples)
   - Pros and cons (comprehensive)
   - SAP-C02 exam question types related to this service (10+ example questions)
   - Configuration details (step-by-step, every setting explained)
   - What other service is simialr but different and how
   - What other service does it go along with
   - Additional critical information (best practices, common mistakes, exam traps)

   The 30 services (priority order):
   EC2, VPC, S3, RDS, DynamoDB, Lambda, Auto Scaling, ELB (ALB/NLB), Route 53, CloudFront, IAM, CloudWatch, CloudTrail, KMS, Transit Gateway, Direct Connect, API Gateway, SQS, SNS, Kinesis Data Streams, Kinesis Firehose, Redshift, Athena, ElastiCache, DMS, Organizations, Config, GuardDuty, CloudFormation, Step Functions

2. ADDITIONAL 40 AWS SERVICES (Comprehensive Reference)
   Services like EBS, EFS, FSx, Storage Gateway, Snow Family, Aurora, Neptune, DocumentDB, EKS, ECR, Fargate, EventBridge, EMR, Glue, Lake Formation, WAF, Shield, Inspector, Macie, Security Hub, Systems Manager, Secrets Manager, etc.
   Each with: Problem solved, when to use, vs similar, cost, exam relevance (2,000 words each minimum)

3. 50 REAL-WORLD INTEGRATION ARCHITECTURES MUTUALLY EXCLUSIVE
   Complete architectures showing how 5-10 services work together:
   - 3-tier web app (complete networking, security, monitoring, DR)
   - Serverless application (API Gateway + Lambda + DynamoDB full flow)
   - Real-time analytics (Kinesis + Lambda + S3 + Athena/Redshift)
   - Multi-region DR (active-passive with failover)
   - Microservices (containers + service mesh)
   - Data lake (S3 + Glue + Athena complete)
   - Hybrid cloud (Direct Connect + Transit Gateway + Route 53 Resolver)
   - Multi-account organization (complete OU structure, SCPs, centralized logging)
   - ML pipeline, Video streaming platform, etc.
   
   Each architecture needs: Complete diagram, all services listed, networking details, security configuration, IAM roles, monitoring setup, cost breakdown, step-by-step data flow

4. 500+ PRACTICE QUESTIONS
   Organized by 4 SAP-C02 domains:
   - Domain 1: Organizational Complexity (130 questions)
   - Domain 2: New Solutions (145 questions) 
   - Domain 3: Continuous Improvement (125 questions)
   - Domain 4: Migration (100 questions)
   
   Each question: Scenario, answer, detailed explanation why correct, why others wrong, exam pattern recognition

5. 30 HANDS-ON LABS
   One lab per top service, step-by-step:
   - Exact console clicks OR CLI commands
   - What to expect at each step
   - Common errors and how to fix
   - Validation checkpoints
   - Cleanup instructions
   - Cost estimate for lab
   
   Examples: "Launch EC2 and configure Auto Scaling," "Build VPC from scratch with public/private subnets," "Create serverless API with API Gateway + Lambda + DynamoDB"

6. COMPREHENSIVE TROUBLESHOOTING GUIDE
   Systematic debugging methodology for each service:
   - "EC2 instance can't connect to internet" - 15+ possible causes checked systematically
   - "RDS queries slow" - step-by-step performance investigation
   - "Lambda timing out" - all possible causes and solutions
   - "Auto Scaling not working" - policy conflicts, cooldowns, limits
   - Cost spike investigation procedures
   - Security incident response (GuardDuty finding → containment → forensics)

7. WELL-ARCHITECTED FRAMEWORK
   All 6 pillars applied to scenarios:
   - Operational Excellence (CloudFormation, monitoring, runbooks)
   - Security (defense in depth, encryption, least privilege)
   - Reliability (Multi-AZ, DR, fault tolerance)
   - Performance (caching, right-sizing, CDN)
   - Cost Optimization (Reserved, Spot, lifecycle, auto-scaling)
   - Sustainability
   Each with AWS service mappings and exam question patterns

8. DISASTER RECOVERY DETAILED
   All 4 strategies with complete implementation:
   - Backup and Restore (RTO: hours, RPO: hours, cost: lowest)
   - Pilot Light (RTO: 10-60 min, RPO: minutes, cost: medium)
   - Warm Standby (RTO: minutes, RPO: seconds, cost: higher)
   - Multi-Site Active-Active (RTO: seconds, RPO: zero, cost: highest)
   Each with: Architecture diagram, AWS services used, failover procedures, cost calculations, when to use

9. MIGRATION PATTERNS (6 R's)
   Detailed scenarios for each:
   - Rehost (lift-and-shift with MGN)
   - Replatform (MySQL→RDS examples)
   - Refactor (monolith→microservices)
   - Repurchase (on-prem→SaaS)
   - Retire (decommission unused)
   - Retain (keep on-premises)
   Real examples, tools used (DMS, MGN, DataSync, Snow Family), decision trees

COMMUNICATION RULES:
- DO NOT ask me questions to "understand my needs" - I've specified everything above
- DO NOT ask "which option do you prefer" - create EVERYTHING listed
- DO NOT create condensed/summary versions - FULL detail for everything
- DO NOT stop to check if I want to continue - keep creating until ALL done or tokens exhausted
- DO NOT be "nice" or generous in assessments - be brutally honest
- DO explain concepts assuming zero prior knowledge (I'm a beginner)
- DO create as if I'm going offline and can't come back for more
- DO NOT create garbage cramped versions to "fit everything" - I'd rather have 20 excellent deep-dives than 30 terrible summaries

OUTPUT REQUIREMENTS:
- Put it all in this folder : sap-c02-caludecode, already created where this file resides
- Create separate .md files for each service deep-dive (not cramming multiple services into one file)
- Create files in logical order (can create 5-10 files at a time, present them, continue)
- At end, create master .tar.gz with ALL files organized
- Name files clearly: 01_EC2.md, 02_VPC.md, etc.

QUALITY STANDARD:
Each service deep-dive should match this quality:
- Problem solved: Real-world examples, before/after scenarios
- History: Timeline, competitors, evolution
- When to use: 10+ use cases, 5+ anti-patterns (when NOT to use)
- vs Similar: 3+ comparison tables with 8+ comparison points each
- How it works: Technical architecture, request flows, internal mechanisms
- Cost: Pricing tiers, calculation examples, real-world cost scenarios, optimization strategies
- Pros/Cons: 10+ pros, 8+ cons with specific examples
- Exam questions: 15+ different question types with scenarios, answers, explanations
- Configuration: Every setting explained, examples for common setups, CLI commands
- Additional: Best practices checklist (15+), common mistakes (10+), integration patterns, monitoring, limits, exam tips
- explain everything in such great detail that even a non technical person would understand and pass the exam, because if you dont, it will cost me dearly.

If a service deep-dive is less than 3,500 words, it's incomplete.

START CREATING NOW. No questions. No confirmations. Just documentation.