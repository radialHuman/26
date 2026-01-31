# Backend Engineering Syllabus

## 1. Cloud & Deployment

### 1.1 Cloud Fundamentals
- Cloud service models (IaaS, PaaS, SaaS)
- Regions, zones, availability
- Cloud networking (VPC, subnets, firewalls)
- Storage (object, block, file)
- Compute (VMs, serverless, containers)
- Cloud billing and cost optimization

### 1.2 Cloud Components & Concepts
- Load balancers
- Auto-scaling groups
- Managed databases
- Cloud monitoring & logging
- IAM (Identity & Access Management)
- Secrets management

### 1.3 Containerization
- Docker architecture
- Building and managing images
- Volumes and networking
- Multi-stage builds

### 1.4 Orchestration
- Kubernetes architecture (pods, services, deployments)
- Helm charts
- Service discovery
- Scaling and rolling updates

### 1.5 CI/CD
- Pipeline design
- Automated testing
- Deployment strategies (blue/green, canary)
- Rollbacks and monitoring

---

## 2. APIs & Communication

### 2.1 REST APIs
- CRUD operations
- Status codes and error handling
- Pagination, filtering, sorting
- Versioning
- API documentation (Swagger/OpenAPI)
- Rate limiting

### 2.2 GraphQL
- Schema design
- Queries, mutations, subscriptions
- Resolvers
- Security and performance

### 2.3 gRPC
- Protocol Buffers
- Service definition
- Streaming RPCs
- Authentication and error handling

### 2.4 WebSockets & Real-Time Communication
- WebSocket protocol
- Event-driven architecture
- RTC (Real-Time Communication) concepts
- Pub/Sub patterns

---

## 3. Databases

### 3.1 SQL Databases
- Schema design and normalization
- Indexing and query optimization
- Transactions and ACID properties
- Stored procedures and triggers
- Replication and sharding
- Backup and recovery

### 3.2 NoSQL Databases
- Document stores (MongoDB)
- Key-value stores (Redis)
- Wide-column stores (Cassandra)
- Data modeling
- Consistency models (CAP theorem)
- Scaling and partitioning

---

## 4. Authentication & Authorization

### 4.1 OAuth
- Flows (Authorization Code, Implicit, Client Credentials)
- Scopes and consent

### 4.2 JWT
- Structure and claims
- Token expiration and refresh

### 4.3 SSO
- SAML, OpenID Connect
- Integration with identity providers

### 4.4 RBAC & Access Control
- Roles, permissions, policies
- Attribute-based access control (ABAC)
- Multi-factor authentication (MFA)

---

## 5. Architecture & Patterns

### 5.1 MVC
- Separation of concerns
- Controller logic

### 5.2 Monolith vs Microservices
- Pros and cons
- Communication patterns (synchronous, asynchronous)
- Service discovery
- Data consistency

### 5.3 Serverless
- FaaS concepts
- Event-driven design
- Cold starts and limitations

### 5.4 Event-Driven & CQRS
- Event sourcing
- Command Query Responsibility Segregation

---

## 6. Performance & Scalability

### 6.1 Caching
- Strategies (write-through, write-back, cache aside)
- Tools (Redis, Memcached)
- Cache invalidation

### 6.2 Load Balancing
- Algorithms (round robin, least connections)
- Health checks
- Global vs local load balancing

### 6.3 Asynchronous Processing
- Message queues (RabbitMQ, Kafka)
- Background jobs (Celery, Sidekiq)
- Event-driven systems

### 6.4 Scalability Concepts
- Horizontal vs vertical scaling
- Sharding and partitioning
- Rate limiting and throttling
- CDN integration

### 6.5 High Availability & Fault Tolerance
- Redundancy
- Failover strategies
- Disaster recovery

---

## 7. Security

### 7.1 Encryption
- Symmetric vs asymmetric
- TLS/SSL
- Data at rest vs in transit

### 7.2 Secure Coding
- Input validation
- Output encoding
- Secure dependencies

### 7.3 Vulnerability Management
- OWASP Top 10
- Static and dynamic analysis
- Patch management

### 7.4 Security Monitoring
- Intrusion detection
- Security logging
- Incident response
