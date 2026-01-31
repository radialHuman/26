# CI/CD: Continuous Integration & Deployment

## Table of Contents
1. [Introduction & History](#introduction--history)
2. [CI/CD Fundamentals](#cicd-fundamentals)
3. [GitHub Actions](#github-actions)
4. [GitLab CI](#gitlab-ci)
5. [Testing Strategies](#testing-strategies)
6. [Deployment Strategies](#deployment-strategies)
7. [Docker in CI/CD](#docker-in-cicd)
8. [Security in CI/CD](#security-in-cicd)
9. [Monitoring CI/CD](#monitoring-cicd)
10. [Complete Pipeline Examples](#complete-pipeline-examples)

---

## Introduction & History

### The Evolution of Software Delivery

**1990s: Manual Deployments**
- **Process**: Build on developer machine → FTP to server.
- **Problems**: "Works on my machine", manual errors, slow.
- **Frequency**: Weekly/monthly releases.

**2001: Agile Manifesto**
- **Principle**: "Deliver working software frequently."
- **Impact**: Faster iterations needed.

**2006: Continuous Integration (CI)**
- **Martin Fowler** popularized CI practices.
- **Tools**: CruiseControl, Hudson (later Jenkins).
- **Practice**: Integrate code multiple times per day.

**2009: Continuous Delivery**
- **Book**: "Continuous Delivery" (Jez Humble, David Farley).
- **Goal**: Software always in releasable state.
- **Practice**: Automated deployments to staging.

**2013: Continuous Deployment**
- **Evolution**: Every commit automatically to production.
- **Adopters**: Facebook, Netflix, Etsy.
- **Requirement**: Robust testing, monitoring.

**Timeline**:
```
2001: Agile Manifesto
2006: Hudson/Jenkins
2011: Travis CI (GitHub integration)
2015: GitLab CI
2018: GitHub Actions
2020: Serverless CI/CD (AWS CodeBuild, GitHub Actions)
Present: GitOps, Infrastructure as Code
```

**Impact on Deployment Frequency**:
```
Traditional: Monthly/quarterly
Agile: Weekly/bi-weekly
CI/CD: Daily
Continuous Deployment: Multiple times per day

Examples:
- Amazon: 50M deployments/year (~1/second!)
- Netflix: 100s per day
- Google: 1000s per day
```

---

## CI/CD Fundamentals

### Continuous Integration (CI)

**Definition**: Automatically build and test code on every commit.

**Core Practices**:
```
1. Commit frequently (multiple times per day)
2. Automated build on every commit
3. Automated tests
4. Fast builds (<10 minutes)
5. Fix broken builds immediately
```

**CI Pipeline**:
```
Code Commit → Trigger CI
            ↓
      Build Application
            ↓
      Run Unit Tests
            ↓
      Run Integration Tests
            ↓
      Static Analysis (linting)
            ↓
      Security Scan
            ↓
   ✅ Success / ❌ Failure
            ↓
   Notify Developers
```

### Continuous Delivery (CD)

**Definition**: Automatically deploy to staging; manual trigger for production.

**Pipeline**:
```
CI Pipeline (above)
      ↓
Deploy to Staging
      ↓
Run Smoke Tests
      ↓
[Manual Approval]
      ↓
Deploy to Production
```

### Continuous Deployment

**Definition**: Automatically deploy to production (no manual step).

**Pipeline**:
```
CI Pipeline
      ↓
Deploy to Staging
      ↓
Run Smoke Tests
      ↓
Automated Canary Deployment
      ↓
Automatic Production Rollout
```

---

## GitHub Actions

### Workflow Basics

**File**: `.github/workflows/ci.yml`

**Basic CI Pipeline**:
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          pytest tests/ --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
```

### Go Application CI

```yaml
name: Go CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      
      - name: Install dependencies
        run: go mod download
      
      - name: Run tests
        run: go test -v -race -coverprofile=coverage.out ./...
      
      - name: Run linter
        uses: golangci/golangci-lint-action@v3
        with:
          version: latest
      
      - name: Build
        run: go build -v ./...
```

### Docker Build & Push

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  docker:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: myapp:${{ github.sha }},myapp:latest
          cache-from: type=registry,ref=myapp:buildcache
          cache-to: type=registry,ref=myapp:buildcache,mode=max
```

### Multi-Stage Pipeline

```yaml
name: Complete CI/CD

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          pip install -r requirements.txt
          pytest
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .
      - name: Push to registry
        run: docker push myapp:${{ github.sha }}
  
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          kubectl set image deployment/myapp myapp=myapp:${{ github.sha }}
  
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          kubectl set image deployment/myapp myapp=myapp:${{ github.sha }}
```

---

## GitLab CI

### Pipeline Configuration

**File**: `.gitlab-ci.yml`

**Basic Pipeline**:
```yaml
stages:
  - build
  - test
  - deploy

variables:
  DOCKER_DRIVER: overlay2

before_script:
  - echo "Starting pipeline"

build:
  stage: build
  image: golang:1.21
  script:
    - go mod download
    - go build -o myapp
  artifacts:
    paths:
      - myapp
    expire_in: 1 hour

test:
  stage: test
  image: golang:1.21
  script:
    - go test -v ./...
  coverage: '/coverage: \d+\.\d+/'

deploy_staging:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache openssh-client
    - ssh user@staging.example.com "cd /app && ./deploy.sh"
  only:
    - develop

deploy_production:
  stage: deploy
  image: alpine:latest
  script:
    - ssh user@prod.example.com "cd /app && ./deploy.sh"
  only:
    - main
  when: manual
```

### Docker in GitLab CI

```yaml
build_docker:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

---

## Testing Strategies

### Test Pyramid

```
       ┌───────────┐
       │    E2E    │  ← Fewer, slow, expensive
       │  Tests    │
       ├───────────┤
       │Integration│
       │   Tests   │
       ├───────────┤
       │   Unit    │  ← Many, fast, cheap
       │   Tests   │
       └───────────┘
```

**Unit Tests** (70%):
```python
# test_calculator.py
def test_add():
    assert Calculator.add(2, 3) == 5

def test_divide_by_zero():
    with pytest.raises(ZeroDivisionError):
        Calculator.divide(10, 0)
```

**Integration Tests** (20%):
```python
# test_api.py
def test_create_user(client):
    response = client.post('/users', json={
        'username': 'test',
        'email': 'test@example.com'
    })
    assert response.status_code == 201
    assert 'id' in response.json()
```

**E2E Tests** (10%):
```python
# test_e2e.py (Selenium)
from selenium import webdriver

def test_login_flow():
    driver = webdriver.Chrome()
    driver.get('http://localhost:8080')
    
    driver.find_element_by_id('username').send_keys('user')
    driver.find_element_by_id('password').send_keys('pass')
    driver.find_element_by_id('login-btn').click()
    
    assert 'Dashboard' in driver.title
    driver.quit()
```

### Test Coverage in CI

**GitHub Actions**:
```yaml
- name: Run tests with coverage
  run: |
    pytest --cov=app --cov-report=term-missing --cov-fail-under=80
    # Fail if coverage < 80%
```

**Go**:
```yaml
- name: Test coverage
  run: |
    go test -coverprofile=coverage.out ./...
    go tool cover -func=coverage.out | grep total | awk '{print $3}' | grep -E '^([8-9][0-9]|100)'
    # Fail if total coverage < 80%
```

---

## Deployment Strategies

### 1. Blue-Green Deployment

**Concept**: Two identical environments (blue = old, green = new).

```
┌─────────┐
│   LB    │
└────┬────┘
     │
     ├─────────────────┐
     │ (Switch)        │
     ▼                 ▼
┌─────────┐       ┌─────────┐
│  Blue   │       │  Green  │
│ (v1.0)  │       │ (v2.0)  │
│ Active  │       │ Standby │
└─────────┘       └─────────┘

Deployment:
1. Deploy v2.0 to Green
2. Test Green
3. Switch LB to Green
4. Blue becomes standby (for rollback)
```

**Kubernetes Implementation**:
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
    version: blue  # Switch to 'green' to deploy
  ports:
    - port: 80

# deployment-green.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: green
  template:
    metadata:
      labels:
        app: myapp
        version: green
    spec:
      containers:
      - name: app
        image: myapp:v2.0
```

**Deployment Script**:
```bash
#!/bin/bash
# Deploy green
kubectl apply -f deployment-green.yaml

# Wait for ready
kubectl wait --for=condition=ready pod -l version=green

# Run smoke tests
./smoke-tests.sh green

# Switch traffic
kubectl patch service myapp -p '{"spec":{"selector":{"version":"green"}}}'

# Keep blue for rollback (delete later)
```

### 2. Canary Deployment

**Concept**: Gradually shift traffic to new version.

```
┌─────────┐
│   LB    │
└────┬────┘
     │
     ├──────────────────┬─────────┐
     │ 90%              │ 10%     │
     ▼                  ▼         │
┌─────────┐       ┌─────────┐    │
│ v1.0    │       │ v2.0    │    │
│ (90%)   │       │(Canary) │    │
└─────────┘       └─────────┘    │
                                 │
If metrics OK:                   │
├──────────────────┬──────────┐  │
│ 50%              │ 50%      │  │
▼                  ▼          ▼  │
v1.0               v2.0          │
                                 │
Eventually:                      │
                  ┌──────────┐   │
                  │ 100%     │   │
                  ▼          ▼   │
                  v2.0           │
```

**Kubernetes with Istio**:
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
  - myapp
  http:
  - match:
    - headers:
        user-agent:
          regex: ".*Chrome.*"
    route:
    - destination:
        host: myapp
        subset: v2
      weight: 10
    - destination:
        host: myapp
        subset: v1
      weight: 90
```

### 3. Rolling Deployment

**Concept**: Gradually replace instances.

```
Step 1: [v1] [v1] [v1] [v1]
Step 2: [v2] [v1] [v1] [v1]
Step 3: [v2] [v2] [v1] [v1]
Step 4: [v2] [v2] [v2] [v1]
Step 5: [v2] [v2] [v2] [v2]
```

**Kubernetes**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max 1 extra pod during update
      maxUnavailable: 1  # Max 1 pod down during update
  template:
    spec:
      containers:
      - name: app
        image: myapp:v2.0
```

---

## Complete Pipeline Example

**Project Structure**:
```
myapp/
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── app/
│   ├── main.go
│   └── main_test.go
├── Dockerfile
├── k8s/
│   ├── deployment.yaml
│   └── service.yaml
├── go.mod
└── README.md
```

**Complete GitHub Actions Workflow**:
```yaml
name: Complete CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  DOCKER_REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Job 1: Lint & Test
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      
      - name: Cache Go modules
        uses: actions/cache@v3
        with:
          path: ~/go/pkg/mod
          key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
          restore-keys: |
            ${{ runner.os }}-go-
      
      - name: Install dependencies
        run: go mod download
      
      - name: Run linter
        run: |
          go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
          golangci-lint run
      
      - name: Run tests
        run: go test -v -race -coverprofile=coverage.out ./...
      
      - name: Check coverage
        run: |
          go tool cover -func=coverage.out
          COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage is below 80%"
            exit 1
          fi
  
  # Job 2: Security Scan
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
  
  # Job 3: Build Docker Image
  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.DOCKER_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
  
  # Job 4: Deploy to Staging
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.example.com
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Set kubeconfig
        run: |
          mkdir -p $HOME/.kube
          echo "${{ secrets.KUBE_CONFIG_STAGING }}" > $HOME/.kube/config
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/myapp \
            myapp=${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          kubectl rollout status deployment/myapp
      
      - name: Run smoke tests
        run: |
          curl -f https://staging.example.com/health || exit 1
  
  # Job 5: Deploy to Production
  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://example.com
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Set kubeconfig
        run: |
          mkdir -p $HOME/.kube
          echo "${{ secrets.KUBE_CONFIG_PROD }}" > $HOME/.kube/config
      
      - name: Canary deployment (10%)
        run: |
          kubectl apply -f k8s/deployment-canary.yaml
          kubectl wait --for=condition=ready pod -l version=canary --timeout=300s
      
      - name: Monitor metrics
        run: |
          # Check error rate, latency
          ./scripts/check-metrics.sh canary
      
      - name: Full rollout
        run: |
          kubectl apply -f k8s/deployment.yaml
          kubectl rollout status deployment/myapp
      
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to production completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

This comprehensive CI/CD guide covers GitHub Actions, GitLab CI, testing strategies, deployment patterns, and production-ready pipeline examples. Continuing with remaining files.
