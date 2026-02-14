# CI/CD: Continuous Integration & Deployment

## Table of Contents
1. [Introduction & History](#introduction--history)
2. [CI/CD Fundamentals](#cicd-fundamentals)
3. [GitHub Actions](#github-actions)
4. [GitLab CI](#gitlab-ci)
5. [Jenkins](#jenkins)
6. [CircleCI & Travis CI](#circleci--travis-ci)
7. [Testing Strategies](#testing-strategies)
8. [Deployment Strategies](#deployment-strategies)
9. [Advanced Deployment Strategies](#advanced-deployment-strategies)
10. [Rollback Strategies](#rollback-strategies)
11. [Docker in CI/CD](#docker-in-cicd)
12. [Artifact Management](#artifact-management)
13. [Secrets Management](#secrets-management)
14. [GitOps](#gitops)
15. [Infrastructure as Code in CI/CD](#infrastructure-as-code-in-cicd)
16. [Database Migrations in CI/CD](#database-migrations-in-cicd)
17. [Pipeline Optimization](#pipeline-optimization)
18. [Multi-Environment Management](#multi-environment-management)
19. [Monorepo CI/CD](#monorepo-cicd)
20. [Security in CI/CD](#security-in-cicd)
21. [Performance Testing in CI/CD](#performance-testing-in-cicd)
22. [Compliance & Audit](#compliance--audit)
23. [DORA Metrics](#dora-metrics)
24. [Monitoring CI/CD](#monitoring-cicd)
25. [Cost Optimization](#cost-optimization)
26. [Troubleshooting & Debugging](#troubleshooting--debugging)
27. [Mobile CI/CD](#mobile-cicd)
28. [Advanced GitHub Actions](#advanced-github-actions)
29. [Pipeline Best Practices](#pipeline-best-practices)
30. [Real-World Case Studies](#real-world-case-studies)
31. [Complete Pipeline Examples](#complete-pipeline-examples)

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

This is a GitHub Actions workflow defined in YAML format, designed for **Continuous Integration (CI)**. It automates testing a Python project on pushes to `main` or `develop` branches, and on pull requests targeting `main`. The workflow runs on an Ubuntu machine, sets up Python, installs dependencies, runs tests with coverage, and uploads the coverage report.

Below, I'll explain each line or logical block in detail, including its purpose and functionality.

### Workflow Name
```yaml
name: CI
```
- **Purpose**: Defines the workflow's name, which appears in the GitHub Actions tab for easy identification.
- **Details**: Here, it's simply "CI" (short for Continuous Integration). This is optional but recommended for clarity.

### Triggers
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```
- **Purpose**: Specifies the events that trigger the workflow.
- **Breakdown**:
  - `push`: Activates on code pushes.
    - `branches: [main, develop]`: Only triggers for pushes to these specific branches.
  - `pull_request`: Activates on pull request events.
    - `branches: [main]`: Only for PRs targeting the `main` branch.
- **Why?**: Ensures CI runs on relevant changes without unnecessary executions.

### Jobs Section
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
```
- **Purpose**: Defines the jobs (tasks) in the workflow, which can run in parallel or sequentially.
- **Breakdown**:
  - `test`: The job name (customizable; here, it represents the testing phase).
  - `runs-on: ubuntu-latest`: Specifies the runner environment. Uses GitHub's hosted Ubuntu virtual machine (latest version) for execution.
- **Details**: Jobs are isolated; this workflow has one job. Multiple jobs could be added for build, deploy, etc.

### Steps in the Test Job
```yaml
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
- **Purpose**: Lists sequential steps executed within the job.
- **Step-by-Step Breakdown**:
  - **Checkout code**:
    - `uses: actions/checkout@v3`: Clones the repository into the runner's workspace using the official GitHub action (version v3 for stability).
    - **Why?**: Provides access to the codebase for subsequent steps.
  
  - **Set up Python**:
    - `uses: actions/setup-python@v4`: Installs Python on the runner.
    - `with: python-version: '3.11'`: Specifies Python 3.11 (adjustable for project needs).
    - **Why?**: Ensures the correct Python version is available.
  
  - **Install dependencies**:
    - `run: |`: Executes multi-line shell commands.
      - `python -m pip install --upgrade pip`: Updates pip to the latest version.
      - `pip install -r requirements.txt`: Installs project dependencies from the `requirements.txt` file.
    - **Why?**: Prepares the environment with necessary packages.
  
  - **Run tests**:
    - `run: |`: Executes the test command.
      - `pytest tests/ --cov=app --cov-report=xml`: Runs tests in the `tests/` directory using pytest. Includes coverage measurement for the `app` module and generates an XML report.
    - **Why?**: Validates code functionality and measures test coverage.
  
  - **Upload coverage**:
    - `uses: codecov/codecov-action@v3`: Uses the Codecov action to upload coverage data.
    - `with: file: ./coverage.xml`: Specifies the XML file (from the previous step) for upload.
    - **Why?**: Integrates with Codecov for coverage reporting and visualization.

### Key Notes
- **Indentation**: YAML is sensitive to spacing; incorrect indentation will cause errors.
- **Prerequisites**: Ensure `requirements.txt` exists and includes all dependencies (e.g., `pytest`, `pytest-cov`).
- **Failure Handling**: If any step fails (e.g., tests don't pass), the workflow stops and reports an error.
- **Gotchas**: Coverage assumes `pytest-cov` is installed. Missing dependencies or incorrect paths can break the workflow.
- **Improvements**:
  - Add caching for dependencies (e.g., using `actions/cache`) to speed up runs.
  - Include linting (e.g., with `flake8`) or building steps for a more comprehensive CI pipeline.
  - Set `fail-fast: false` in jobs for parallel execution if multiple jobs are added.
  - Consider security: Use pinned action versions (e.g., `@v3`) to avoid unexpected changes.

This workflow provides a solid foundation for Python CI. Customize it based on your project's specific needs!

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

## Jenkins

### Historical Context & Problem Solved

**The Problem (2004-2005)**:
- Manual builds were error-prone
- No visibility into build status
- Integration happened late (integration hell)
- No standardized build process

**Hudson → Jenkins Evolution**:
```
2004: Kohsuke Kawaguchi at Sun Microsystems faces build issues
2005: Creates "Hudson" - first Java CI server
2007: Hudson becomes popular in enterprise
2011: Oracle acquires Sun, dispute over trademark
2011: Community forks Hudson → "Jenkins" is born
2014: Jenkins 2.0 introduces Pipeline as Code
Present: 300K+ installations, most popular CI/CD tool
```

**What Jenkins Solved**:
1. **Automated Builds**: No more "works on my machine"
2. **Plugin Ecosystem**: Extensible for any workflow
3. **Distributed Builds**: Master-agent architecture
4. **Enterprise Features**: LDAP, RBAC, audit trails

### Architecture

```
┌──────────────────────────────────────┐
│         Jenkins Master               │
│  - Scheduling builds                 │
│  - Monitoring agents                 │
│  - Recording/presenting results      │
│  - Serving UI                        │
└──────────┬───────────────────────────┘
           │
     ┌─────┴─────┬─────────┬─────────┐
     ▼           ▼         ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ...
│ Agent 1 │ │ Agent 2 │ │ Agent 3 │
│ (Linux) │ │(Windows)│ │ (macOS) │
└─────────┘ └─────────┘ └─────────┘
```

### Installation

**Docker (Quickest)**:
```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts
```

**Linux (Ubuntu)**:
```bash
# Add Jenkins repository
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install
sudo apt update
sudo apt install jenkins openjdk-11-jdk

# Start
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### Jenkinsfile (Pipeline as Code)

**Declarative Pipeline** (Recommended for beginners):
```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        IMAGE_NAME = 'myapp'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            agent {
                docker {
                    image 'golang:1.21'
                    args '-v $HOME/.cache:/go/pkg'
                }
            }
            steps {
                sh 'go mod download'
                sh 'go build -o myapp'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'go test ./... -v -coverprofile=coverage.out'
                    }
                }
                stage('Lint') {
                    steps {
                        sh 'golangci-lint run'
                    }
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                sh 'trivy fs --severity HIGH,CRITICAL .'
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    docker.build("${IMAGE_NAME}:${BUILD_NUMBER}")
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh 'kubectl set image deployment/myapp myapp=${IMAGE_NAME}:${BUILD_NUMBER} --namespace=staging'
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sh 'kubectl set image deployment/myapp myapp=${IMAGE_NAME}:${BUILD_NUMBER} --namespace=production'
            }
        }
    }
    
    post {
        always {
            junit '**/test-results/*.xml'
            publishHTML([
                reportDir: 'coverage',
                reportFiles: 'index.html',
                reportName: 'Coverage Report'
            ])
        }
        success {
            slackSend color: 'good', message: "Build #${BUILD_NUMBER} succeeded!"
        }
        failure {
            slackSend color: 'danger', message: "Build #${BUILD_NUMBER} failed!"
        }
    }
}
```

**Scripted Pipeline** (More flexibility):
```groovy
node {
    def app
    
    stage('Clone') {
        checkout scm
    }
    
    stage('Build') {
        app = docker.build("myapp:${env.BUILD_NUMBER}")
    }
    
    stage('Test') {
        app.inside {
            sh 'pytest tests/'
        }
    }
    
    stage('Push') {
        docker.withRegistry('https://registry.example.com', 'docker-credentials') {
            app.push("${env.BUILD_NUMBER}")
            app.push("latest")
        }
    }
    
    stage('Deploy') {
        if (env.BRANCH_NAME == 'main') {
            sh 'ansible-playbook -i production deploy.yml'
        }
    }
}
```

### Multi-Branch Pipeline

**Configuration**:
```groovy
// Automatically creates pipelines for all branches
// Scans repository for branches with Jenkinsfile

pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                echo "Building branch: ${env.BRANCH_NAME}"
                sh './build.sh'
            }
        }
        
        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    branch pattern: 'release-.*', comparator: 'REGEXP'
                }
            }
            steps {
                script {
                    def env = (BRANCH_NAME == 'main') ? 'production' : 'staging'
                    sh "deploy.sh ${env}"
                }
            }
        }
    }
}
```

### Shared Libraries

**Problem**: Duplicate pipeline code across projects

**Solution**: Shared library

**Directory Structure**:
```
jenkins-shared-library/
├── vars/
│   ├── buildGoApp.groovy
│   ├── deployToK8s.groovy
│   └── notifySlack.groovy
└── src/
    └── com/
        └── company/
            └── PipelineUtils.groovy
```

**vars/buildGoApp.groovy**:
```groovy
def call(String version = '1.21') {
    pipeline {
        agent {
            docker {
                image "golang:${version}"
            }
        }
        stages {
            stage('Build') {
                steps {
                    sh 'go build -o app'
                }
            }
            stage('Test') {
                steps {
                    sh 'go test ./...'
                }
            }
        }
    }
}
```

**Usage in Jenkinsfile**:
```groovy
@Library('my-shared-library') _

buildGoApp('1.21')
```

### Jenkins Plugins (Essential)

**Build & SCM**:
- **Git Plugin**: Git integration
- **Pipeline**: Pipeline as Code
- **Blue Ocean**: Modern UI

**Testing**:
- **JUnit Plugin**: Test result publishing
- **Cobertura/JaCoCo**: Code coverage
- **SonarQube Scanner**: Static analysis

**Deployment**:
- **Kubernetes Plugin**: K8s deployments
- **Ansible Plugin**: Configuration management
- **Docker Pipeline**: Docker operations

**Notifications**:
- **Slack Notification**: Slack integration
- **Email Extension**: Advanced email

**Security**:
- **Credentials Binding**: Secret management
- **Role-based Authorization**: RBAC

### Distributed Builds (Agent Configuration)

**Master Configuration** (`/etc/jenkins/jenkins.yaml`):
```yaml
jenkins:
  numExecutors: 0  # Master doesn't run builds
  nodes:
    - permanent:
        name: "linux-agent-1"
        labelString: "linux docker"
        remoteFS: "/home/jenkins"
        launcher:
          ssh:
            host: "10.0.1.10"
            credentialsId: "jenkins-ssh-key"
```

**Jenkinsfile using specific agent**:
```groovy
pipeline {
    agent none
    
    stages {
        stage('Build on Linux') {
            agent {
                label 'linux'
            }
            steps {
                sh 'make build'
            }
        }
        
        stage('Test on Windows') {
            agent {
                label 'windows'
            }
            steps {
                bat 'run-tests.bat'
            }
        }
    }
}
```

### Jenkins Configuration as Code (JCasC)

**Problem**: Manual configuration through UI is not reproducible

**Solution**: `jenkins.yaml`

```yaml
jenkins:
  systemMessage: "Jenkins managed by Configuration as Code"
  numExecutors: 5
  securityRealm:
    ldap:
      server: "ldap.example.com"
      rootDN: "dc=example,dc=com"
  authorizationStrategy:
    roleBased:
      roles:
        global:
          - name: "admin"
            permissions:
              - "Overall/Administer"
            assignments:
              - "admin-group"
          - name: "developer"
            permissions:
              - "Job/Build"
              - "Job/Read"
            assignments:
              - "dev-group"

credentials:
  system:
    domainCredentials:
      - credentials:
          - usernamePassword:
              id: "docker-hub"
              username: "myuser"
              password: "${DOCKER_PASSWORD}"
              description: "Docker Hub credentials"

unclassified:
  location:
    url: "https://jenkins.example.com"
  slackNotifier:
    teamDomain: "mycompany"
    tokenCredentialId: "slack-token"
```

### Pros & Cons

**Pros** ✅:
1. **Mature & Stable**: 15+ years of development
2. **Huge Plugin Ecosystem**: 1800+ plugins
3. **Self-Hosted**: Full control over infrastructure
4. **Enterprise Features**: LDAP, RBAC, audit logs
5. **Language Agnostic**: Build anything
6. **Distributed Builds**: Scale horizontally
7. **Free & Open Source**: No licensing costs
8. **Large Community**: Extensive documentation

**Cons** ❌:
1. **Complex Setup**: Requires infrastructure management
2. **Maintenance Overhead**: Updates, plugins, security
3. **UI/UX**: Outdated compared to modern tools
4. **Groovy Learning Curve**: Scripted pipelines are hard
5. **Plugin Conflicts**: Compatibility issues
6. **No Cloud-Native**: Not designed for ephemeral infrastructure
7. **Resource Intensive**: Java-based, memory-hungry
8. **Scaling Complexity**: Agent management

### Cost Analysis

**Self-Hosted Jenkins**:
```
Infrastructure:
- Master (t3.large): $60/month
- 3 Agents (t3.medium): $100/month
- Storage (100GB): $10/month
- Total: $170/month

Labor:
- DevOps engineer time: 10 hours/month × $100/hour = $1000/month

Total: $1,170/month
```

**vs GitHub Actions** (cloud-hosted):
```
Free tier: 2000 minutes/month
Additional: $0.008/minute

Typical usage (50 builds/day, 10 min each):
50 × 30 × 10 = 15,000 minutes/month
(15,000 - 2,000) × $0.008 = $104/month

But: No infrastructure management!
```

### When to Use Jenkins

**Use Jenkins When**:
- ✅ You need full control over CI/CD infrastructure
- ✅ You have on-premise requirements (no cloud allowed)
- ✅ You have complex, custom build requirements
- ✅ You need extensive plugin ecosystem
- ✅ You have dedicated DevOps team for maintenance
- ✅ You're building many projects (cost-effective at scale)
- ✅ You need distributed builds across multiple platforms
- ✅ Enterprise features (LDAP, audit, compliance) are critical

**Don't Use Jenkins When**:
- ❌ You're a small team without DevOps resources
- ❌ You want zero maintenance
- ❌ You prefer SaaS solutions
- ❌ You need modern UI/UX
- ❌ You're cloud-native and want ephemeral infrastructure
- ❌ Quick setup is priority

### Alternatives Comparison

| Feature | Jenkins | GitHub Actions | GitLab CI | CircleCI |
|---------|---------|----------------|-----------|----------|
| **Hosting** | Self-hosted | Cloud | Both | Both |
| **Cost** | Free + Infra | Pay-per-use | Free tier | Free tier |
| **Setup** | Complex | Easy | Easy | Easy |
| **Maintenance** | High | None | Low | None |
| **Plugins** | 1800+ | Marketplace | Built-in | Orbs |
| **UI/UX** | Old | Modern | Modern | Modern |
| **Enterprise** | Strong | Growing | Strong | Strong |

### Migration from Jenkins

**To GitHub Actions**:
```groovy
// Jenkins
stage('Build') {
    sh 'npm install'
    sh 'npm test'
}

// GitHub Actions equivalent
- name: Build
  run: |
    npm install
    npm test
```

**Migration Tools**:
- **GitHub Actions Importer**: Automated conversion
- **jenkins-to-github-actions**: Community tool

---

## CircleCI & Travis CI

### CircleCI

**Historical Context**:
- **2011**: Founded to solve slow CI problem
- **Problem**: Jenkins was complex, Travis CI was GitHub-only
- **Solution**: Fast, cloud-native CI with Docker support

**Configuration** (`.circleci/config.yml`):
```yaml
version: 2.1

orbs:
  node: circleci/node@5.0
  docker: circleci/docker@2.0

workflows:
  build-test-deploy:
    jobs:
      - test
      - build:
          requires:
            - test
      - deploy:
          requires:
            - build
          filters:
            branches:
              only: main

jobs:
  test:
    docker:
      - image: cimg/node:18.0
      - image: cimg/postgres:14.0
        environment:
          POSTGRES_PASSWORD: secret
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Run tests
          command: npm test
      - store_test_results:
          path: test-results
  
  build:
    docker:
      - image: cimg/go:1.21
    steps:
      - checkout
      - run: go build -o app
      - persist_to_workspace:
          root: .
          paths:
            - app
  
  deploy:
    docker:
      - image: cimg/base:stable
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Deploy
          command: ./deploy.sh production
```

**Pros**:
- ✅ Fast builds (optimized caching)
- ✅ Great Docker support
- ✅ Insights & analytics
- ✅ SSH debug access
- ✅ Orbs (reusable packages)

**Cons**:
- ❌ Expensive for large teams
- ❌ Limited free tier (6000 build minutes)
- ❌ Lock-in to CircleCI

**Pricing**:
```
Free: 6,000 build minutes/month
Performance: $15/month (25,000 minutes)
Scale: $2,000/month (200,000 minutes)
```

### Travis CI

**Historical Context**:
- **2011**: First cloud CI for GitHub
- **Problem**: No hosted CI for open source
- **Golden Era**: 2011-2019 (free for OSS)
- **2020**: Pricing changes, community exodus

**Configuration** (`.travis.yml`):
```yaml
language: go
go:
  - 1.21

services:
  - docker

cache:
  directories:
    - $HOME/.cache/go-build
    - $GOPATH/pkg/mod

before_install:
  - go mod download

script:
  - go test -v ./...
  - go build -o myapp

after_success:
  - bash <(curl -s https://codecov.io/bash)

deploy:
  provider: heroku
  api_key:
    secure: "encrypted_key"
  app: myapp-production
  on:
    branch: main
```

**Pros**:
- ✅ Simple YAML config
- ✅ Great for OSS (historically)
- ✅ Matrix builds (test multiple versions)

**Cons**:
- ❌ Slow builds
- ❌ Declining community
- ❌ Expensive pricing

**Status**: Many projects migrated to GitHub Actions after 2020

---

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

---

## Artifact Management

### Historical Context

**The Problem (Pre-2008)**:
- Build artifacts scattered across developer machines
- No versioning of binaries
- "Which .jar did we deploy last week?"
- Rebuild from source for every deployment (slow, unreliable)

**Evolution**:
```
2008: Sonatype Nexus (Maven artifacts)
2010: JFrog Artifactory (multi-format)
2013: Docker Hub (container images)
2016: AWS CodeArtifact, Azure Artifacts
2020: GitHub Packages
```

### What Are Artifacts?

**Definition**: Compiled/built outputs ready for deployment

**Types**:
- **Libraries**: `.jar`, `.whl`, `.gem`, `.npm packages`
- **Binaries**: Executables (`.exe`, ELF binaries)
- **Container Images**: Docker images
- **Archives**: `.tar.gz`, `.zip` of built application
- **Static Assets**: Compiled JS/CSS bundles

### Why Artifact Management?

1. **Build Once, Deploy Many**: Don't rebuild for each environment
2. **Versioning**: Track exactly what was deployed
3. **Dependency Management**: Cache third-party libraries
4. **Security Scanning**: Scan once, reuse results
5. **Bandwidth**: Local cache reduces downloads

### Artifact Repositories

#### 1. JFrog Artifactory (Commercial + OSS)

**Problem Solved**: Universal artifact management

**Features**:
- Multi-format (Maven, npm, Docker, PyPI, NuGet, etc.)
- Repository proxying (cache external deps)
- Access control
- Artifact metadata

**Self-Hosted Setup**:
```bash
# Docker
docker run -d --name artifactory \
  -p 8081:8081 \
  -v artifactory_data:/var/opt/jfrog/artifactory \
  releases-docker.jfrog.io/jfrog/artifactory-oss:latest
```

**Configuration**:
```yaml
# artifactory.config.yml
repositories:
  - key: libs-release
    packageType: maven
    repositorySettings:
      mavenSettings:
        snapshotVersionBehavior: nonUnique
  
  - key: docker-local
    packageType: docker
    dockerApiVersion: V2
  
  - key: npm-remote
    packageType: npm
    url: https://registry.npmjs.org
    repositorySettings:
      remoteRepoChecksumPolicyType: client-checksums
```

**Publishing Artifacts (Maven)**:
```xml
<!-- pom.xml -->
<distributionManagement>
    <repository>
        <id>artifactory</id>
        <url>http://artifactory.example.com/libs-release</url>
    </repository>
</distributionManagement>
```

```bash
mvn deploy
```

**Publishing Docker Images**:
```bash
docker login artifactory.example.com
docker tag myapp:latest artifactory.example.com/docker-local/myapp:1.0.0
docker push artifactory.example.com/docker-local/myapp:1.0.0
```

**In CI/CD (GitHub Actions)**:
```yaml
- name: Build and publish to Artifactory
  run: |
    docker build -t myapp:${{ github.sha }} .
    echo ${{ secrets.ARTIFACTORY_PASSWORD }} | docker login artifactory.example.com -u ${{ secrets.ARTIFACTORY_USER }} --password-stdin
    docker tag myapp:${{ github.sha }} artifactory.example.com/docker/myapp:${{ github.sha }}
    docker push artifactory.example.com/docker/myapp:${{ github.sha }}
```

**Pros**:
- ✅ Universal (all package types)
- ✅ Mature, enterprise-ready
- ✅ Advanced features (replication, HA)

**Cons**:
- ❌ Expensive ($3K+/year for Pro)
- ❌ Complex setup
- ❌ Heavy (Java-based)

**Cost**:
```
OSS: Free (limited features)
Pro: $3,000/year
Enterprise: $30,000+/year
```

#### 2. Sonatype Nexus Repository

**Open Source Alternative to Artifactory**

**Setup**:
```bash
docker run -d -p 8081:8081 \
  -v nexus-data:/nexus-data \
  sonatype/nexus3
```

**Repository Types**:
- **Hosted**: Your artifacts
- **Proxy**: Cache external (npmjs.org, Maven Central)
- **Group**: Combine multiple repos

**Example: npm with Nexus**:
```bash
# Configure npm to use Nexus
npm config set registry http://nexus.example.com/repository/npm-group/

# Publish to Nexus
npm publish --registry=http://nexus.example.com/repository/npm-hosted/
```

**In CI/CD**:
```yaml
# .gitlab-ci.yml
variables:
  NEXUS_URL: https://nexus.example.com

publish:
  stage: deploy
  script:
    - mvn deploy -DaltDeploymentRepository=nexus::default::${NEXUS_URL}/repository/maven-releases/
  only:
    - tags
```

**Pros**:
- ✅ Free & open source
- ✅ Multi-format support
- ✅ Active community

**Cons**:
- ❌ UI not as polished as Artifactory
- ❌ Less advanced features

#### 3. AWS CodeArtifact

**Cloud-Native Artifact Management**

**Setup**:
```bash
# Create domain
aws codeartifact create-domain --domain my-domain

# Create repository
aws codeartifact create-repository \
  --domain my-domain \
  --repository my-repo \
  --description "My artifact repository"

# Add external connection (npmjs)
aws codeartifact associate-external-connection \
  --domain my-domain \
  --repository my-repo \
  --external-connection public:npmjs
```

**Configure npm**:
```bash
# Get auth token
export CODEARTIFACT_AUTH_TOKEN=$(aws codeartifact get-authorization-token \
  --domain my-domain \
  --query authorizationToken \
  --output text)

# Configure npm
npm config set registry https://my-domain-123456789.d.codeartifact.us-east-1.amazonaws.com/npm/my-repo/
npm config set //my-domain-123456789.d.codeartifact.us-east-1.amazonaws.com/npm/my-repo/:_authToken=${CODEARTIFACT_AUTH_TOKEN}
```

**In CI/CD**:
```yaml
- name: Publish to CodeArtifact
  env:
    AWS_REGION: us-east-1
  run: |
    export CODEARTIFACT_AUTH_TOKEN=$(aws codeartifact get-authorization-token --domain my-domain --query authorizationToken --output text)
    npm publish --registry=https://my-domain-123456789.d.codeartifact.us-east-1.amazonaws.com/npm/my-repo/
```

**Pros**:
- ✅ Fully managed (no servers)
- ✅ IAM integration
- ✅ Pay per use

**Cons**:
- ❌ AWS lock-in
- ❌ Limited package formats (npm, PyPI, Maven, NuGet)
- ❌ Not for Docker images

**Cost**:
```
Storage: $0.05/GB/month
Requests: $0.05 per 10,000 requests

Typical: $10-50/month for small teams
```

#### 4. GitHub Packages

**Integrated with GitHub**

**Publishing (npm)**:
```json
// package.json
{
  "name": "@myorg/mypackage",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

```yaml
# .github/workflows/publish.yml
- name: Publish to GitHub Packages
  run: |
    echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" > ~/.npmrc
    npm publish
```

**Publishing Docker Images**:
```yaml
- name: Publish Docker to GHCR
  run: |
    echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
    docker tag myapp ghcr.io/${{ github.repository }}:${{ github.sha }}
    docker push ghcr.io/${{ github.repository }}:${{ github.sha }}
```

**Pros**:
- ✅ Free for public repos
- ✅ Integrated with GitHub
- ✅ No setup required

**Cons**:
- ❌ GitHub-only
- ❌ Limited features vs Artifactory

**Cost**:
```
Free: 500MB storage, 1GB transfer
Team: $4/user/month (2GB storage, 10GB transfer)
Enterprise: Custom
```

#### 5. Amazon S3 (Simple Artifact Storage)

**For Simple Use Cases**

**Upload Artifacts**:
```yaml
- name: Build
  run: |
    go build -o myapp
    tar -czf myapp-${{ github.sha }}.tar.gz myapp

- name: Upload to S3
  run: |
    aws s3 cp myapp-${{ github.sha }}.tar.gz \
      s3://my-artifacts/releases/myapp-${{ github.sha }}.tar.gz
```

**Download in Deployment**:
```bash
aws s3 cp s3://my-artifacts/releases/myapp-abc123.tar.gz .
tar -xzf myapp-abc123.tar.gz
./myapp
```

**Versioning**:
```bash
# Enable versioning
aws s3api put-bucket-versioning \
  --bucket my-artifacts \
  --versioning-configuration Status=Enabled

# List versions
aws s3api list-object-versions --bucket my-artifacts --prefix releases/
```

**Pros**:
- ✅ Simple
- ✅ Cheap
- ✅ Unlimited storage

**Cons**:
- ❌ No package management features
- ❌ Manual version tracking
- ❌ No dependency resolution

### Retention Policies

**Why**: Artifacts consume storage, old ones are rarely needed

**Artifactory Retention**:
```yaml
# Cleanup policy
cleanup:
  - name: delete-old-snapshots
    policyType: Retention
    retentionDays: 30
    targetRepository: libs-snapshot
```

**S3 Lifecycle Policy**:
```json
{
  "Rules": [{
    "Id": "DeleteOldArtifacts",
    "Status": "Enabled",
    "Prefix": "releases/",
    "Expiration": {
      "Days": 90
    }
  }, {
    "Id": "ArchiveOldArtifacts",
    "Status": "Enabled",
    "Prefix": "releases/",
    "Transitions": [{
      "Days": 30,
      "StorageClass": "GLACIER"
    }]
  }]
}
```

**Best Practices**:
- Keep releases: 90 days
- Keep snapshots: 7-30 days
- Archive to cheaper storage (Glacier)
- Keep tagged releases indefinitely

### Artifact Versioning Strategies

**1. Semantic Versioning (SemVer)**:
```
myapp-1.2.3.jar
      │ │ │
      │ │ └─ Patch (bug fixes)
      │ └─── Minor (new features, backward compatible)
      └───── Major (breaking changes)
```

**2. Build Number**:
```
myapp-20240202.543.jar
      │        │
      │        └─ Build number (auto-increment)
      └────────── Date
```

**3. Git Commit SHA**:
```
myapp-abc123def.tar.gz
      │
      └─ First 8 chars of commit SHA (traceable)
```

**4. Combination**:
```
myapp-1.2.3-abc123-20240202.jar
      │     │      │
      │     │      └─ Build date
      │     └──────── Git commit
      └────────────── Semantic version
```

### Comparison Table

| Feature | Artifactory | Nexus | AWS CodeArtifact | GitHub Packages | S3 |
|---------|-------------|-------|------------------|----------------|-----|
| **Cost** | $$$ | Free/$ | $ | Free/$ | $ |
| **Formats** | All | All | Limited | Limited | Any |
| **Self-Host** | Yes | Yes | No | No | No |
| **Enterprise** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Setup** | Complex | Medium | Easy | Easy | Easy |
| **Docker** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Proxying** | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## Secrets Management

### The Problem

**What NOT to do**:
```yaml
# ❌ NEVER DO THIS
env:
  DATABASE_PASSWORD: "super_secret_123"
  API_KEY: "sk-1234567890abcdef"
```

**Why**:
- Secrets in Git history (forever)
- Visible to everyone with repo access
- Compromised if repo is leaked

### Evolution of Secrets Management

```
2000s: Hardcoded passwords in code
2010: Environment variables (better, but still in repo)
2013: HashiCorp Vault (centralized secrets)
2014: AWS Secrets Manager
2016: Kubernetes Secrets
2020: SOPS, Age (encrypted secrets in Git)
```

### 1. HashiCorp Vault (Industry Standard)

**Architecture**:
```
┌──────────────────────────────────┐
│      HashiCorp Vault             │
│  ┌────────────────────────────┐  │
│  │  Secret Engines            │  │
│  │  - KV (key-value)          │  │
│  │  - Database (dynamic)      │  │
│  │  - AWS (temp credentials)  │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Auth Methods              │  │
│  │  - Token                   │  │
│  │  - Kubernetes              │  │
│  │  - AWS IAM                 │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
         ↑                 ↑
         │                 │
    CI/CD Pipeline    Applications
```

**Setup (Docker)**:
```bash
docker run -d --name=vault \
  --cap-add=IPC_LOCK \
  -p 8200:8200 \
  -e 'VAULT_DEV_ROOT_TOKEN_ID=myroot' \
  vault

export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='myroot'
```

**Store Secrets**:
```bash
# Write secret
vault kv put secret/myapp/prod \
  db_password=super_secret \
  api_key=sk-1234567890

# Read secret
vault kv get secret/myapp/prod

# Read specific field
vault kv get -field=db_password secret/myapp/prod
```

**In CI/CD (GitHub Actions)**:
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Import Secrets from Vault
        uses: hashicorp/vault-action@v2
        with:
          url: https://vault.example.com
          token: ${{ secrets.VAULT_TOKEN }}
          secrets: |
            secret/data/myapp/prod db_password | DATABASE_PASSWORD ;
            secret/data/myapp/prod api_key | API_KEY
      
      - name: Use secrets
        run: |
          echo "DATABASE_PASSWORD is now available as env var"
          ./deploy.sh
        env:
          DATABASE_PASSWORD: ${{ env.DATABASE_PASSWORD }}
          API_KEY: ${{ env.API_KEY }}
```

**Dynamic Secrets (Database)**:
```bash
# Configure database engine
vault write database/config/mydb \
  plugin_name=postgresql-database-plugin \
  allowed_roles="readonly" \
  connection_url="postgresql://{{username}}:{{password}}@localhost:5432/mydb" \
  username="vault" \
  password="vault_password"

# Define role (30-minute TTL credentials)
vault write database/roles/readonly \
  db_name=mydb \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="30m" \
  max_ttl="24h"

# Get temporary credentials
vault read database/creds/readonly

Key                Value
---                -----
lease_id           database/creds/readonly/abc123
lease_duration     30m
password           A1a-random-password
username           v-root-readonly-xyz
```

**Application Integration**:
```go
package main

import (
    vault "github.com/hashicorp/vault/api"
)

func main() {
    config := vault.DefaultConfig()
    config.Address = "https://vault.example.com"
    
    client, _ := vault.NewClient(config)
    client.SetToken(os.Getenv("VAULT_TOKEN"))
    
    // Read secret
    secret, _ := client.Logical().Read("secret/data/myapp/prod")
    dbPassword := secret.Data["data"].(map[string]interface{})["db_password"].(string)
    
    // Use dbPassword to connect to database
}
```

**Pros**:
- ✅ Centralized secret management
- ✅ Dynamic secrets (auto-rotate)
- ✅ Audit logging
- ✅ Encryption as a service
- ✅ Multi-cloud support

**Cons**:
- ❌ Complex setup
- ❌ Requires infrastructure (HA setup)
- ❌ Learning curve

**Cost**:
```
Open Source: Free
Enterprise: $0.35/hour per node (~$250/month for HA setup)
HCP Vault (managed): $0.50/hour (~$360/month)
```

### 2. AWS Secrets Manager

**Store Secret**:
```bash
aws secretsmanager create-secret \
  --name prod/myapp/database \
  --secret-string '{"username":"admin","password":"super_secret"}'
```

**Retrieve in Application**:
```python
import boto3
import json

client = boto3.client('secretsmanager', region_name='us-east-1')

response = client.get_secret_value(SecretId='prod/myapp/database')
secret = json.loads(response['SecretString'])

username = secret['username']
password = secret['password']
```

**Auto-Rotation**:
```bash
aws secretsmanager rotate-secret \
  --secret-id prod/myapp/database \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:123456:function:RotateSecret \
  --rotation-rules AutomaticallyAfterDays=30
```

**In CI/CD (GitHub Actions)**:
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v1
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1

- name: Get secret
  run: |
    SECRET=$(aws secretsmanager get-secret-value --secret-id prod/myapp/database --query SecretString --output text)
    echo "::add-mask::$SECRET"
    export DATABASE_PASSWORD=$(echo $SECRET | jq -r .password)
```

**Pros**:
- ✅ Fully managed
- ✅ Auto-rotation
- ✅ IAM integration
- ✅ Encryption at rest (KMS)

**Cons**:
- ❌ AWS-only
- ❌ Expensive for many secrets

**Cost**:
```
$0.40/secret/month
$0.05 per 10,000 API calls

Example: 50 secrets = $20/month
```

### 3. Kubernetes Secrets

**Create Secret**:
```bash
# From literal
kubectl create secret generic db-secret \
  --from-literal=username=admin \
  --from-literal=password=super_secret

# From file
kubectl create secret generic tls-secret \
  --from-file=tls.crt=cert.pem \
  --from-file=tls.key=key.pem
```

**Use in Pod**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:1.0
    env:
    - name: DATABASE_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: password
    # Or mount as file
    volumeMounts:
    - name: secret-volume
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secret-volume
    secret:
      secretName: db-secret
```

**Encryption at Rest**:
```yaml
# /etc/kubernetes/encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
    - secrets
    providers:
    - aescbc:
        keys:
        - name: key1
          secret: <base64 encoded secret>
    - identity: {}
```

**Sealed Secrets (Encrypt in Git)**:
```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml

# Create sealed secret
kubeseal < secret.yaml > sealed-secret.yaml

# Commit sealed-secret.yaml to Git (safe!)
git add sealed-secret.yaml
git commit -m "Add encrypted secret"
```

**sealed-secret.yaml** (safe to commit):
```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-secret
spec:
  encryptedData:
    password: AgBqW8... # Encrypted, can't decrypt without controller
```

**Pros**:
- ✅ Native to Kubernetes
- ✅ Easy to use
- ✅ Free

**Cons**:
- ❌ Base64 encoded (not encrypted by default)
- ❌ No secret rotation
- ❌ Secrets visible to cluster admins

### 4. SOPS (Secrets OPerationS)

**Encrypt secrets in Git**

**Install**:
```bash
# macOS
brew install sops

# Linux
wget https://github.com/mozilla/sops/releases/download/v3.7.3/sops-v3.7.3.linux -O /usr/local/bin/sops
chmod +x /usr/local/bin/sops
```

**Encrypt File**:
```yaml
# secrets.yaml (before encryption)
database:
  password: super_secret
  username: admin
api_key: sk-1234567890
```

```bash
# Encrypt with AWS KMS
sops --encrypt --kms arn:aws:kms:us-east-1:123456:key/abc123 secrets.yaml > secrets.enc.yaml

# Or with Age
age-keygen -o key.txt
sops --age $(cat key.txt | grep public | cut -d ' ' -f 4) --encrypt secrets.yaml > secrets.enc.yaml
```

**secrets.enc.yaml** (safe to commit):
```yaml
database:
    password: ENC[AES256_GCM,data:8P7kqw==,iv:...,tag:...,type:str]
    username: ENC[AES256_GCM,data:vR3mqA==,iv:...,tag:...,type:str]
api_key: ENC[AES256_GCM,data:2Kl9xQ==,iv:...,tag:...,type:str]
sops:
    kms:
    -   arn: arn:aws:kms:us-east-1:123456:key/abc123
        created_at: "2024-02-02T10:00:00Z"
```

**Decrypt in CI/CD**:
```yaml
- name: Decrypt secrets
  run: |
    sops --decrypt secrets.enc.yaml > secrets.yaml
    export DATABASE_PASSWORD=$(yq '.database.password' secrets.yaml)
```

**Pros**:
- ✅ Secrets in Git (version control)
- ✅ Supports multiple KMS (AWS, GCP, Azure, Age)
- ✅ Partial encryption (only values, not keys)

**Cons**:
- ❌ Requires KMS setup
- ❌ Manual rotation

### 5. Environment-Specific Secrets in CI/CD

**GitHub Actions Environments**:
```yaml
# Settings → Environments → production → Secrets

jobs:
  deploy:
    environment: production  # Uses production secrets
    steps:
      - run: echo "${{ secrets.DATABASE_PASSWORD }}"
      # This DATABASE_PASSWORD is from 'production' environment
```

**GitLab CI Variables**:
```yaml
# Settings → CI/CD → Variables
# Can be scoped to environments

deploy_prod:
  environment: production
  script:
    - echo "$DATABASE_PASSWORD"  # Automatically uses production variable
```

### Secret Rotation

**Manual Rotation**:
```bash
# 1. Generate new secret
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Update in Vault/Secrets Manager
vault kv put secret/myapp/prod db_password=$NEW_PASSWORD

# 3. Update database
psql -c "ALTER USER myuser PASSWORD '$NEW_PASSWORD';"

# 4. Restart application (to pick up new secret)
kubectl rollout restart deployment/myapp
```

**Automated Rotation (AWS Lambda)**:
```python
import boto3
import psycopg2

def lambda_handler(event, context):
    secret_id = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']
    
    if step == "createSecret":
        # Generate new password
        new_password = generate_password()
        # Store in pending version
        secrets_client.put_secret_value(
            SecretId=secret_id,
            ClientRequestToken=token,
            SecretString=new_password,
            VersionStages=['AWSPENDING']
        )
    
    elif step == "setSecret":
        # Update database with new password
        conn = psycopg2.connect(...)
        cur = conn.cursor()
        cur.execute(f"ALTER USER myuser PASSWORD '{new_password}'")
        conn.commit()
    
    elif step == "testSecret":
        # Test new credentials
        try:
            conn = psycopg2.connect(password=new_password)
            conn.close()
        except:
            raise Exception("New credentials don't work!")
    
    elif step == "finishSecret":
        # Mark as current
        secrets_client.update_secret_version_stage(
            SecretId=secret_id,
            VersionStage='AWSCURRENT',
            MoveToVersionId=token
        )
```

### Best Practices

1. **Never commit secrets to Git** (use `.gitignore`)
2. **Use different secrets per environment** (dev/staging/prod)
3. **Rotate regularly** (90 days minimum)
4. **Principle of least privilege** (service X can't access service Y secrets)
5. **Audit access** (who accessed what secret when)
6. **Encrypt in transit & at rest**
7. **Use short-lived credentials** when possible (Vault dynamic secrets)

### Comparison

| Feature | Vault | AWS Secrets | K8s Secrets | SOPS |
|---------|-------|-------------|-------------|------|
| **Cost** | $$$ | $$ | Free | Free |
| **Self-Host** | Yes | No | Yes | N/A |
| **Dynamic** | ✅ | ✅ | ❌ | ❌ |
| **Rotation** | ✅ | ✅ | ❌ | Manual |
| **Multi-Cloud** | ✅ | ❌ | ✅ | ✅ |
| **Audit** | ✅ | ✅ | Limited | ❌ |
| **Learning Curve** | High | Low | Low | Medium |

---

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

## Advanced Deployment Strategies

### 4. Feature Flags (Feature Toggles)

**Historical Context**:
- **Problem**: Features take weeks to build, can't deploy incrementally
- **2009**: Flickr pioneered "dark launching"
- **Solution**: Deploy code disabled, enable gradually

**How It Works**:
```
Code deployed → Feature disabled by default
              ↓
         Toggle ON for:
         - Internal users (testing)
         - 1% of users (canary)
         - 10% of users
         - 100% of users (full rollout)
```

**Implementation with LaunchDarkly** (Commercial):
```go
// main.go
package main

import (
    ld "gopkg.in/launchdarkly/go-server-sdk.v5"
    "gopkg.in/launchdarkly/go-server-sdk.v5/lduser"
)

func main() {
    client, _ := ld.MakeClient("sdk-key", 5*time.Second)
    defer client.Close()
    
    user := lduser.NewUser("user-123")
    
    // Check if new feature is enabled
    showNewUI, _ := client.BoolVariation("new-ui-redesign", user, false)
    
    if showNewUI {
        // New code path
        renderNewUI()
    } else {
        // Old code path
        renderOldUI()
    }
}
```

**Open Source Alternative - Unleash**:
```go
import "github.com/Unleash/unleash-client-go/v3"

func init() {
    unleash.Initialize(
        unleash.WithListener(&unleash.DebugListener{}),
        unleash.WithAppName("myapp"),
        unleash.WithUrl("http://unleash.example.com/api/"),
    )
}

func handler(w http.ResponseWriter, r *http.Request) {
    ctx := context.WithValue(context.Background(), "userId", "123")
    
    if unleash.IsEnabled("new-checkout-flow", unleash.WithContext(ctx)) {
        newCheckout(w, r)
    } else {
        oldCheckout(w, r)
    }
}
```

**Feature Flag Strategies**:

1. **Percentage Rollout**:
```javascript
// 10% of users see new feature
{
  "name": "new-search",
  "enabled": true,
  "strategies": [{
    "name": "gradualRollout",
    "parameters": {
      "percentage": "10",
      "groupId": "users"
    }
  }]
}
```

2. **User Targeting**:
```javascript
{
  "name": "beta-features",
  "strategies": [{
    "name": "userWithId",
    "parameters": {
      "userIds": "user-1,user-2,user-3"
    }
  }]
}
```

3. **Environment-based**:
```javascript
{
  "name": "premium-feature",
  "strategies": [{
    "name": "default",
    "parameters": {},
    "constraints": [{
      "contextName": "environment",
      "operator": "IN",
      "values": ["production", "staging"]
    }]
  }]
}
```

**In CI/CD Pipeline**:
```yaml
# .github/workflows/deploy.yml
- name: Deploy with feature flag OFF
  run: kubectl apply -f k8s/

- name: Enable for 1% of users
  run: |
    curl -X PATCH https://app.launchdarkly.com/api/v2/flags/my-project/new-feature \
      -H "Authorization: ${{ secrets.LD_API_KEY }}" \
      -d '{"instructions": [{"kind": "updateFallthroughVariationOrRollout", "rolloutWeights": {"true": 1000, "false": 99000}}]}'

- name: Monitor metrics for 1 hour
  run: ./scripts/monitor-metrics.sh 3600

- name: Rollout to 100% if healthy
  run: |
    curl -X PATCH https://app.launchdarkly.com/api/v2/flags/my-project/new-feature \
      -H "Authorization: ${{ secrets.LD_API_KEY }}" \
      -d '{"instructions": [{"kind": "turnFlagOn"}]}'
```

**Pros**:
- ✅ Deploy without releasing
- ✅ Instant rollback (toggle off)
- ✅ A/B testing capability
- ✅ Gradual rollout
- ✅ No code deployment for changes

**Cons**:
- ❌ Code complexity (if/else everywhere)
- ❌ Technical debt (old flags linger)
- ❌ Testing complexity (flag combinations)
- ❌ Cost (LaunchDarkly: $75+/month)

**When to Use**:
- Large user bases (can't risk big bang deploys)
- Long-running features (weeks to build)
- Need A/B testing
- High-risk changes
- Trunk-based development

### 5. Shadow/Dark Launching

**Concept**: Run new version alongside old, but don't show results to users

```
      User Request
           │
           ▼
    ┌──────────────┐
    │ Load Balancer│
    └──────┬───────┘
           │
      ┌────┴─────┐
      ▼          ▼ (duplicate request)
  ┌─────┐    ┌─────────┐
  │ v1  │    │ v2      │
  │Prod │    │(Shadow) │
  └──┬──┘    └─────────┘
     │            │
     │            ├─→ Log results
     │            └─→ Compare with v1
     │
     └─→ Return to user
```

**Implementation with Istio**:
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
        end-user:
          regex: ".*"
    route:
    - destination:
        host: myapp
        subset: v1
      weight: 100
    mirror:
      host: myapp
      subset: v2  # Shadow traffic here
    mirrorPercentage:
      value: 100.0  # Mirror 100% of traffic
```

**Application Code** (compare results):
```go
func handleRequest(w http.ResponseWriter, r *http.Request) {
    // Production response
    prodResult := processProd(r)
    
    // If this is shadow traffic (header check)
    if r.Header.Get("X-Shadow") == "true" {
        shadowResult := processShadow(r)
        
        // Log comparison
        log.Printf("Shadow comparison: prod=%v shadow=%v match=%v",
            prodResult, shadowResult, prodResult == shadowResult)
        
        // Don't return shadow result!
        return
    }
    
    // Return production result
    json.NewEncoder(w).Encode(prodResult)
}
```

**Use Cases**:
- Testing new algorithm (e.g., recommendation engine)
- Validating performance improvements
- Database migration testing
- Search ranking changes

**Pros**:
- ✅ Zero user impact
- ✅ Real production traffic
- ✅ Catch edge cases

**Cons**:
- ❌ Doubles infrastructure load
- ❌ Risk of side effects (writes must be prevented)
- ❌ Complex setup

### 6. A/B Testing Deployments

**Concept**: Route different user segments to different versions

```
       User Request
            │
       ┌────┴────────────────┐
       │ A/B Router          │
       │ (by user ID hash)   │
       └────┬────────┬────────┘
            │        │
      50%   │        │   50%
            ▼        ▼
        ┌─────┐  ┌─────┐
        │  A  │  │  B  │
        │(old)│  │(new)│
        └─────┘  └─────┘
```

**Nginx Configuration**:
```nginx
split_clients "${remote_addr}${date_gmt}" $variant {
    50% "a";
    *   "b";
}

server {
    location / {
        if ($variant = "a") {
            proxy_pass http://version-a;
        }
        if ($variant = "b") {
            proxy_pass http://version-b;
        }
    }
}
```

**Application-Level A/B Testing**:
```python
from split import get_client

split = get_client('your-api-key')

def recommend_products(user_id):
    treatment = split.get_treatment(user_id, 'recommendation-algorithm')
    
    if treatment == 'ml_based':
        return ml_recommend(user_id)  # New ML algorithm
    elif treatment == 'rule_based':
        return rule_recommend(user_id)  # Old rules
    else:
        return default_recommend(user_id)
    
    # Track metrics
    split.track(user_id, 'conversion', 1 if purchased else 0)
```

**CI/CD Integration**:
```yaml
- name: Deploy A/B test
  run: |
    # Deploy version B (new)
    kubectl apply -f k8s/version-b.yaml
    
    # Configure 50/50 split
    kubectl patch virtualservice myapp --type=json -p='[
      {"op": "replace", "path": "/spec/http/0/route/0/weight", "value": 50},
      {"op": "replace", "path": "/spec/http/0/route/1/weight", "value": 50}
    ]'

- name: Monitor for 7 days
  run: ./scripts/ab-test-monitor.sh 7

- name: Choose winner
  run: |
    WINNER=$(python scripts/analyze-ab-test.py)
    if [ "$WINNER" = "B" ]; then
      kubectl delete -f k8s/version-a.yaml
      kubectl patch virtualservice myapp -p '{"spec":{"http":[{"route":[{"destination":{"host":"version-b"},"weight":100}]}]}}'
    fi
```

**Tools**:
- **Open Source**: GrowthBook, Unleash, Flagsmith
- **Commercial**: Optimizely ($50K+/year), LaunchDarkly, Split.io

### 7. Multi-Region Deployment

**Problem**: Users across the globe, latency matters

**Architecture**:
```
        Global Load Balancer (Route 53 / Cloudflare)
                 │
        ┌────────┼────────┬────────┐
        │        │        │        │
        ▼        ▼        ▼        ▼
    US-EAST  US-WEST  EU-WEST  AP-SOUTH
    (v1.2.0) (v1.2.0) (v1.1.0) (v1.1.0)
                                 ↑
                    (Rolling deploy: region by region)
```

**Deployment Strategy - Region by Region**:
```bash
#!/bin/bash
REGIONS=("us-east-1" "us-west-2" "eu-west-1" "ap-south-1")
VERSION="v1.3.0"

for REGION in "${REGIONS[@]}"; do
    echo "Deploying to $REGION..."
    
    # Deploy
    kubectl --context=$REGION set image deployment/myapp myapp=${VERSION}
    kubectl --context=$REGION rollout status deployment/myapp
    
    # Wait 30 minutes, monitor
    ./scripts/monitor-region.sh $REGION 1800
    
    # Check error rate
    ERROR_RATE=$(./scripts/check-errors.sh $REGION)
    if (( $(echo "$ERROR_RATE > 1.0" | bc -l) )); then
        echo "Error rate too high in $REGION, rolling back"
        kubectl --context=$REGION rollout undo deployment/myapp
        exit 1
    fi
    
    echo "$REGION deployment successful"
done
```

**GitHub Actions Multi-Region**:
```yaml
name: Multi-Region Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-us-east:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to US-EAST
        run: |
          aws eks update-kubeconfig --region us-east-1 --name prod-cluster
          kubectl set image deployment/myapp myapp=${{ github.sha }}
      - name: Monitor
        run: ./scripts/monitor.sh us-east-1 1800

  deploy-us-west:
    needs: deploy-us-east
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to US-WEST
        run: |
          aws eks update-kubeconfig --region us-west-2 --name prod-cluster
          kubectl set image deployment/myapp myapp=${{ github.sha }}

  deploy-eu:
    needs: deploy-us-west
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EU-WEST
        run: |
          aws eks update-kubeconfig --region eu-west-1 --name prod-cluster
          kubectl set image deployment/myapp myapp=${{ github.sha }}
```

**Pros**:
- ✅ Low latency for global users
- ✅ High availability (region failure isolation)
- ✅ Gradual rollout limits blast radius

**Cons**:
- ❌ Complex orchestration
- ❌ Data consistency challenges
- ❌ Higher costs

---

## Rollback Strategies

### Why Rollbacks Fail

**Common Failures**:
1. Database schema changes (can't undo)
2. Data migrations (corrupted data)
3. State in external systems
4. Dependencies on new version

### 1. Instant Rollback (Kubernetes)

```bash
# Check rollout history
kubectl rollout history deployment/myapp

REVISION  CHANGE-CAUSE
1         <none>
2         Update to v1.2.0
3         Update to v1.3.0

# Rollback to previous version
kubectl rollout undo deployment/myapp

# Rollback to specific revision
kubectl rollout undo deployment/myapp --to-revision=2

# Monitor rollback
kubectl rollout status deployment/myapp
```

**Automated Rollback in CI/CD**:
```yaml
- name: Deploy
  id: deploy
  run: kubectl set image deployment/myapp myapp=v1.3.0

- name: Health check
  run: |
    sleep 60
    HEALTH=$(curl -s https://api.example.com/health | jq -r '.status')
    if [ "$HEALTH" != "healthy" ]; then
      echo "Health check failed"
      exit 1
    fi

- name: Rollback on failure
  if: failure()
  run: kubectl rollout undo deployment/myapp
```

### 2. Blue-Green Rollback

**Instant Switch Back**:
```bash
# Original: Traffic → Blue (v1.2.0)
kubectl patch service myapp -p '{"spec":{"selector":{"version":"blue"}}}'

# After deploy: Traffic → Green (v1.3.0)
kubectl patch service myapp -p '{"spec":{"selector":{"version":"green"}}}'

# If issues detected: Traffic → Blue (instant!)
kubectl patch service myapp -p '{"spec":{"selector":{"version":"blue"}}}'
```

**Time to Rollback**: <5 seconds

### 3. Database Migration Rollback

**The Problem**:
```sql
-- Forward migration (v2)
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;

-- Can't just rollback deployment!
-- v1 code doesn't know about phone_verified column
```

**Solution: Backward-Compatible Migrations**

**Phase 1**: Add column (v1.9.0):
```sql
-- Migration
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;

-- v1.9.0 code: Ignores new column (still works)
-- v2.0.0 code: Uses new column
```

**Phase 2**: Deploy v2.0.0 (uses new column)

**Phase 3 (later)**: Make column required:
```sql
ALTER TABLE users ALTER COLUMN phone_verified SET NOT NULL;
```

**Rollback-Safe Pattern**:
```
Deploy N-1: Compatible with old & new schema
      ↓
Migrate database
      ↓
Deploy N: Uses new schema
      ↓
Rollback safe: Can revert to N-1 anytime
```

**Flyway Rollback** (Commercial feature):
```sql
-- V001__add_email.sql
ALTER TABLE users ADD COLUMN email VARCHAR(255);

-- U001__add_email.sql (Undo)
ALTER TABLE users DROP COLUMN email;
```

```bash
# Rollback
flyway undo -target=0
```

**Liquibase Rollback**:
```xml
<changeSet id="1" author="dev">
    <addColumn tableName="users">
        <column name="email" type="varchar(255)"/>
    </addColumn>
    <rollback>
        <dropColumn tableName="users" columnName="email"/>
    </rollback>
</changeSet>
```

```bash
liquibase rollbackCount 1
```

### 4. Automated Rollback Triggers

**Metrics-Based Rollback**:
```python
# rollback-monitor.py
import requests
import subprocess
import time

def check_error_rate():
    response = requests.get('http://prometheus:9090/api/v1/query',
        params={'query': 'rate(http_requests_total{status=~"5.."}[5m])'})
    error_rate = float(response.json()['data']['result'][0]['value'][1])
    return error_rate

def rollback():
    subprocess.run(['kubectl', 'rollout', 'undo', 'deployment/myapp'])
    # Send alert
    requests.post(slack_webhook, json={'text': '🚨 Auto-rollback triggered'})

# Monitor for 30 minutes post-deploy
for i in range(60):  # 60 × 30s = 30 min
    error_rate = check_error_rate()
    if error_rate > 0.05:  # 5% error rate threshold
        print(f"Error rate {error_rate*100}% exceeds threshold, rolling back")
        rollback()
        break
    time.sleep(30)
```

**GitLab CI with Auto-Rollback**:
```yaml
deploy_production:
  script:
    - kubectl set image deployment/myapp myapp=$CI_COMMIT_SHA
  environment:
    name: production
    on_stop: rollback_production
    auto_stop_in: 1 hour  # Auto-rollback after 1 hour if not promoted

rollback_production:
  script:
    - kubectl rollout undo deployment/myapp
  when: manual
  environment:
    name: production
    action: stop
```

### 5. Canary Rollback

**Progressive Rollout with Auto-Rollback**:
```yaml
# Flagger (automated canary with rollback)
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: myapp
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  service:
    port: 80
  analysis:
    interval: 1m
    threshold: 5  # Number of failed checks before rollback
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500  # 500ms
      interval: 1m
```

**How it works**:
```
Deploy v2 → 10% traffic
         ↓
  Check metrics (1 min)
         ↓
  Success? → 20% traffic → ... → 100%
         ↓
  Failure? → Automatic rollback to v1
```

### Rollback Checklist

**Before Rollback**:
- [ ] Capture current state (logs, metrics, database)
- [ ] Identify root cause (if possible)
- [ ] Check if rollback is safe (database compatibility?)
- [ ] Notify team

**During Rollback**:
- [ ] Execute rollback procedure
- [ ] Monitor application health
- [ ] Verify user impact reduced

**After Rollback**:
- [ ] Post-mortem
- [ ] Fix root cause
- [ ] Update runbooks
- [ ] Implement safeguards

---

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

## GitOps

### Historical Context & Problem Solved

**The Problem (Pre-2017)**:
- kubectl commands run manually or in scripts
- No audit trail of infrastructure changes  
- "Did we deploy v1.2 or v1.3 to production?"
- Configuration drift (cluster state ≠ desired state)

**2017: Weaveworks coins "GitOps"**:
- **Core Idea**: Git as single source of truth for infrastructure
- **Declarative**: Describe desired state in Git
- **Automated**: Agents sync cluster to Git state
- **Versioned**: All changes tracked in Git history

**Evolution**:
```
2017: GitOps concept introduced
2018: Flux v1 released
2020: ArgoCD gains popularity
2021: Flux v2 (rewritten)
2022: OpenGitOps standards formed
```

### Core Principles

1. **Declarative**: Everything defined in Git (YAML manifests)
2. **Versioned**: Git history = audit trail
3. **Automatically Pulled**: Agents pull from Git (not push to cluster)
4. **Continuously Reconciled**: Drift detected and corrected

### GitOps Workflow

```
Developer
    ↓
  (git push)
    ↓
┌─────────────┐
│  Git Repo   │ ← Single source of truth
│ (manifests) │
└──────┬──────┘
       │
       │ (polls every 3min)
       ↓
┌──────────────┐
│  GitOps      │
│  Controller  │ (ArgoCD/Flux)
│ (in cluster) │
└───────┬──────┘
        │
        │ (kubectl apply)
        ▼
   ┌─────────┐
   │ Cluster │
   └─────────┘
```

### ArgoCD

**Installation**:
```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Expose UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

**Create Application (UI or YAML)**:
```yaml
# application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  
  source:
    repoURL: https://github.com/myorg/myapp-config
    targetRevision: HEAD
    path: k8s/production
  
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  
  syncPolicy:
    automated:
      prune: true  # Delete resources not in Git
      selfHeal: true  # Revert manual changes
    syncOptions:
    - CreateNamespace=true
```

```bash
kubectl apply -f application.yaml
```

**How It Works**:
```
1. ArgoCD polls Git repo every 3 minutes
2. Compares Git state vs cluster state
3. If different → syncs cluster to match Git
4. Manual kubectl changes? Reverted automatically!
```

**CI/CD Integration**:
```yaml
# GitHub Actions updates Git repo (not cluster directly)
- name: Update image tag in Git
  run: |
    git clone https://github.com/myorg/myapp-config
    cd myapp-config
    sed -i "s|image: myapp:.*|image: myapp:${{ github.sha }}|" k8s/production/deployment.yaml
    git add k8s/production/deployment.yaml
    git commit -m "Update image to ${{ github.sha }}"
    git push

# ArgoCD automatically detects change and deploys!
```

**Multi-Environment**:
```
myapp-config/
├── k8s/
│   ├── base/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── dev/
│   │   └── kustomization.yaml
│   ├── staging/
│   │   └── kustomization.yaml
│   └── production/
│       └── kustomization.yaml
```

**kustomization.yaml** (overlay):
```yaml
# k8s/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../base

images:
- name: myapp
  newTag: v1.2.3  # Production version

replicas:
- name: myapp
  count: 10  # Production has 10 replicas

patches:
- path: resource-limits.yaml  # Production-specific limits
```

**Progressive Rollout with ArgoCD**:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: myapp
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 5m}
      - setWeight: 50
      - pause: {duration: 10m}
      - setWeight: 100
      analysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: myapp
```

**Pros**:
- ✅ Git as audit trail (who changed what when)
- ✅ Easy rollback (git revert)
- ✅ Drift detection (manual changes prevented)
- ✅ Multi-cluster management
- ✅ Better security (no cluster credentials in CI/CD)

**Cons**:
- ❌ Learning curve (new paradigm)
- ❌ Debugging harder (less visibility in CI/CD)
- ❌ Image updates require Git commit (extra step)

### Flux

**Alternative to ArgoCD**

**Installation**:
```bash
# Install Flux CLI
brew install fluxcd/tap/flux

# Bootstrap Flux in cluster
flux bootstrap github \
  --owner=myorg \
  --repository=myapp-config \
  --branch=main \
  --path=./clusters/production \
  --personal
```

**GitRepository**:
```yaml
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: GitRepository
metadata:
  name: myapp
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/myorg/myapp-config
  ref:
    branch: main
```

**Kustomization**:
```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1beta2
kind: Kustomization
metadata:
  name: myapp
  namespace: flux-system
spec:
  interval: 5m
  path: ./k8s/production
  prune: true
  sourceRef:
    kind: GitRepository
    name: myapp
```

**Image Automation** (auto-update tags):
```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta1
kind: ImageRepository
metadata:
  name: myapp
spec:
  image: docker.io/myorg/myapp
  interval: 1m

---
apiVersion: image.toolkit.fluxcd.io/v1beta1
kind: ImagePolicy
metadata:
  name: myapp
spec:
  imageRepositoryRef:
    name: myapp
  policy:
    semver:
      range: 1.x.x  # Auto-update to latest 1.x.x

---
apiVersion: image.toolkit.fluxcd.io/v1beta1
kind: ImageUpdateAutomation
metadata:
  name: myapp
spec:
  git:
    commit:
      author:
        name: fluxbot
        email: flux@example.com
      messageTemplate: "Update image to {{range .Updated.Images}}{{println .}}{{end}}"
  update:
    path: ./k8s/production
    strategy: Setters
```

**Flux auto-commits new image tags to Git!**

### ArgoCD vs Flux

| Feature | ArgoCD | Flux |
|---------|--------|------|
| **UI** | ✅ Rich Web UI | ❌ CLI only |
| **Ease of Use** | Easier (UI) | Harder (YAML) |
| **Image Automation** | Manual | ✅ Built-in |
| **Multi-Tenancy** | ✅ Better | OK |
| **RBAC** | ✅ Advanced | Basic |
| **Helm** | ✅ | ✅ |
| **Complexity** | Higher | Lower |

### When to Use GitOps

**Use GitOps When**:
- ✅ Kubernetes-native applications
- ✅ Need audit trail of all changes
- ✅ Want declarative infrastructure
- ✅ Managing multiple clusters
- ✅ Security requirement (no cluster access from CI/CD)

**Don't Use When**:
- ❌ Non-Kubernetes deployments
- ❌ Rapid iteration in dev (Git commit per deploy is slow)
- ❌ Team unfamiliar with Git workflows

---

## Infrastructure as Code in CI/CD

### Historical Context

**The Problem (Pre-2010)**:
- Infrastructure created manually (ClickOps)
- "How was this server configured?"
- Snowflake servers (unique, can't reproduce)
- Disaster recovery = guesswork

**2011: Terraform Introduces HCL**:
- Infrastructure as code (declarative)
- Version control infrastructure
- Reproducible environments

### 1. Terraform in CI/CD

**Project Structure**:
```
terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars.example
└── modules/
    └── vpc/
        ├── main.tf
        └── variables.tf
```

**main.tf**:
```hcl
terraform {
  backend "s3" {
    bucket = "mycompany-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "./modules/vpc"
  cidr_block = "10.0.0.0/16"
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_type
  
  tags = {
    Name = "web-server"
    Environment = var.environment
  }
}
```

**GitHub Actions Workflow**:
```yaml
name: Terraform CI/CD

on:
  pull_request:
    paths:
      - 'terraform/**'
  push:
    branches: [main]
    paths:
      - 'terraform/**'

env:
  TF_VERSION: 1.5.0

jobs:
  terraform-plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Terraform Format Check
        run: terraform fmt -check -recursive
        working-directory: terraform
      
      - name: Terraform Init
        run: terraform init
        working-directory: terraform
      
      - name: Terraform Validate
        run: terraform validate
        working-directory: terraform
      
      - name: Terraform Plan
        id: plan
        run: |
          terraform plan -out=tfplan -no-color
          terraform show -no-color tfplan > plan.txt
        working-directory: terraform
      
      - name: Comment Plan on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const plan = fs.readFileSync('terraform/plan.txt', 'utf8');
            const output = `#### Terraform Plan\n\`\`\`\n${plan}\n\`\`\``;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.name,
              body: output
            });
      
      - name: Upload Plan
        uses: actions/upload-artifact@v3
        with:
          name: tfplan
          path: terraform/tfplan

  terraform-apply:
    needs: terraform-plan
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production  # Requires manual approval
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Terraform Init
        run: terraform init
        working-directory: terraform
      
      - name: Download Plan
        uses: actions/download-artifact@v3
        with:
          name: tfplan
          path: terraform
      
      - name: Terraform Apply
        run: terraform apply -auto-approve tfplan
        working-directory: terraform
```

**Cost Estimation (Infracost)**:
```yaml
- name: Run Infracost
  run: |
    curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh
    infracost breakdown --path terraform/ --format json --out-file /tmp/infracost.json
    
    infracost comment github --path=/tmp/infracost.json \
      --repo=$GITHUB_REPOSITORY \
      --pull-request=${{ github.event.pull_request.number }} \
      --github-token=${{ secrets.GITHUB_TOKEN }}
```

**Example PR Comment**:
```
💰 Monthly cost estimate increased by $50 (+25%)

  + aws_instance.web
    $100 → $150  (+$50, +50%)
    
      + Instance type changed: t3.small → t3.medium
```

**Security Scanning (tfsec)**:
```yaml
- name: Run tfsec
  uses: aquasecurity/tfsec-action@v1.0.0
  with:
    soft_fail: false  # Fail pipeline on security issues
```

**Policy as Code (OPA)**:
```yaml
- name: Terraform Plan to JSON
  run: terraform show -json tfplan > plan.json

- name: Check Policy
  uses: open-policy-agent/opa-action@v2
  with:
    policy: policies/
    input: terraform/plan.json
    format: pretty
```

**policies/required_tags.rego**:
```rego
package terraform

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_instance"
    not resource.change.after.tags.Environment
    msg := sprintf("Instance %v missing Environment tag", [resource.address])
}
```

**Pros of IaC in CI/CD**:
- ✅ Automated validation
- ✅ Cost estimates before apply
- ✅ Security scanning
- ✅ Peer review via PRs
- ✅ Audit trail

**Cons**:
- ❌ Slow (terraform plan can take minutes)
- ❌ State management complexity
- ❌ Requires careful workflow design

### 2. Pulumi (Code-based IaC)

**Example (TypeScript)**:
```typescript
// index.ts
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const vpc = new aws.ec2.Vpc("main", {
    cidrBlock: "10.0.0.0/16",
});

const instance = new aws.ec2.Instance("web", {
    ami: "ami-0c55b159cbfafe1f0",
    instanceType: "t3.micro",
    tags: {
        Name: "web-server",
    },
});

export const publicIp = instance.publicIp;
```

**GitHub Actions**:
```yaml
- uses: pulumi/actions@v4
  with:
    command: preview  # or 'up' for apply
    stack-name: production
  env:
    PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

**Pros**:
- ✅ Real programming languages (TypeScript, Python, Go)
- ✅ Better abstraction & reusability
- ✅ Type checking

**Cons**:
- ❌ Steeper learning curve
- ❌ Less mature than Terraform

---

## Database Migrations in CI/CD

### The Challenge

**Problem**: Application code and database schema must stay in sync

**Bad Scenario**:
```
1. Deploy v2 app (expects 'email' column)
2. Run migration (add 'email' column)
3. ⚠️ Period where v2 app crashes (column doesn't exist yet)
```

**Good Scenario (Backward-Compatible)**:
```
1. Run migration (add 'email' column, nullable)
2. Deploy v2 app (uses 'email' if present)
3. ✅ Zero downtime
```

### 1. Flyway

**Migration Files**:
```
migrations/
├── V001__create_users_table.sql
├── V002__add_email_to_users.sql
└── V003__create_orders_table.sql
```

**V001__create_users_table.sql**:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**V002__add_email_to_users.sql**:
```sql
ALTER TABLE users ADD COLUMN email VARCHAR(255);
-- Nullable first! Can make NOT NULL later
```

**GitHub Actions**:
```yaml
- name: Run Flyway migrations
  run: |
    docker run --rm \
      -v $(pwd)/migrations:/flyway/sql \
      flyway/flyway:latest \
      -url=jdbc:postgresql://db.example.com:5432/mydb \
      -user=${{ secrets.DB_USER }} \
      -password=${{ secrets.DB_PASSWORD }} \
      migrate
```

**Flyway in Kubernetes (Init Container)**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      initContainers:
      - name: flyway
        image: flyway/flyway:latest
        command:
        - flyway
        - -url=jdbc:postgresql://postgres:5432/mydb
        - -user=dbuser
        - -password=dbpass
        - migrate
        volumeMounts:
        - name: migrations
          mountPath: /flyway/sql
      
      containers:
      - name: app
        image: myapp:1.0
      
      volumes:
      - name: migrations
        configMap:
          name: db-migrations
```

**Pros**:
- ✅ Simple (just SQL files)
- ✅ Version tracking
- ✅ Repeatable

**Cons**:
- ❌ No rollback (commercial feature)
- ❌ Manual rollback scripts needed

### 2. Liquibase

**More powerful, XML/YAML/JSON/SQL**

**changelog.yaml**:
```yaml
databaseChangeLog:
  - changeSet:
      id: 1
      author: john
      changes:
        - createTable:
            tableName: users
            columns:
              - column:
                  name: id
                  type: int
                  autoIncrement: true
                  constraints:
                    primaryKey: true
              - column:
                  name: username
                  type: varchar(50)
                  constraints:
                    nullable: false
                    unique: true
      rollback:
        - dropTable:
            tableName: users
  
  - changeSet:
      id: 2
      author: john
      changes:
        - addColumn:
            tableName: users
            columns:
              - column:
                  name: email
                  type: varchar(255)
      rollback:
        - dropColumn:
            tableName: users
            columnName: email
```

**GitHub Actions**:
```yaml
- name: Run Liquibase
  run: |
    docker run --rm \
      -v $(pwd)/migrations:/liquibase/changelog \
      liquibase/liquibase:latest \
      --url=jdbc:postgresql://db.example.com:5432/mydb \
      --username=${{ secrets.DB_USER }} \
      --password=${{ secrets.DB_PASSWORD }} \
      --changeLogFile=changelog.yaml \
      update
```

**Rollback**:
```bash
liquibase rollbackCount 1  # Rollback last changeset
```

**Pros**:
- ✅ Powerful (conditions, preconditions)
- ✅ Built-in rollback
- ✅ Multiple formats

**Cons**:
- ❌ Complex XML syntax
- ❌ Steeper learning curve

### 3. golang-migrate

**For Go applications**

**Install**:
```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

**Create Migration**:
```bash
migrate create -ext sql -dir migrations -seq add_email_to_users
```

**Generates**:
```
migrations/
├── 000001_add_email_to_users.up.sql
└── 000001_add_email_to_users.down.sql
```

**000001_add_email_to_users.up.sql**:
```sql
ALTER TABLE users ADD COLUMN email VARCHAR(255);
```

**000001_add_email_to_users.down.sql**:
```sql
ALTER TABLE users DROP COLUMN email;
```

**In Application**:
```go
import (
    "github.com/golang-migrate/migrate/v4"
    _ "github.com/golang-migrate/migrate/v4/database/postgres"
    _ "github.com/golang-migrate/migrate/v4/source/file"
)

func runMigrations() error {
    m, err := migrate.New(
        "file://migrations",
        "postgres://user:pass@localhost:5432/mydb?sslmode=disable",
    )
    if err != nil {
        return err
    }
    
    if err := m.Up(); err != nil && err != migrate.ErrNoChange {
        return err
    }
    
    return nil
}
```

**GitHub Actions**:
```yaml
- name: Run migrations
  run: |
    migrate -path migrations \
      -database "postgresql://${{ secrets.DB_USER }}:${{ secrets.DB_PASSWORD }}@db.example.com:5432/mydb?sslmode=disable" \
      up
```

### Zero-Downtime Migration Pattern

**Problem**: Adding NOT NULL column breaks old app version

**Solution: Expand-Contract Pattern**

**Phase 1: Expand** (make schema work for both old & new):
```sql
-- Add column as nullable
ALTER TABLE users ADD COLUMN email VARCHAR(255);
```

**Deploy v1.5** (dual-write to old & new):
```go
// v1.5 writes to both username (old) and email (new)
func createUser(username, email string) {
    db.Exec("INSERT INTO users (username, email) VALUES ($1, $2)", username, email)
}
```

**Phase 2: Backfill Data**:
```sql
-- Populate email for existing rows
UPDATE users SET email = username || '@example.com' WHERE email IS NULL;
```

**Phase 3: Make NOT NULL**:
```sql
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
```

**Phase 4: Deploy v2** (only uses email)

**Phase 5: Contract** (remove old column):
```sql
ALTER TABLE users DROP COLUMN username;
```

**Timeline**:
```
Week 1: Phase 1 + Deploy v1.5
Week 2: Phase 2 (backfill)
Week 3: Phase 3 (NOT NULL)
Week 4: Deploy v2
Week 5: Phase 5 (drop old column)
```

### Migration Testing

**Separate Database for Tests**:
```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_DB: testdb
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test

- name: Run migrations on test DB
  run: |
    migrate -path migrations -database "postgresql://test:test@localhost:5432/testdb" up

- name: Run tests
  run: go test ./...
```

---

## Pipeline Optimization

### The Cost of Slow Pipelines

**Impact**:
- Developer waiting time: 10 min/build × 50 builds/day = **8.3 hours/day wasted**
- Context switching cost
- Delayed feedback
- Lower deployment frequency

**Goal**: Sub-10 minute builds

### 1. Dependency Caching

**Problem**: Downloading dependencies every build (slow, expensive)

**Solution**: Cache dependencies between builds

**GitHub Actions - Node.js**:
```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

- name: Install dependencies
  run: npm ci  # Faster than npm install
```

**Impact**: 2-3 minutes → 10-30 seconds

**GitHub Actions - Go**:
```yaml
- name: Cache Go modules
  uses: actions/cache@v3
  with:
    path: |
      ~/go/pkg/mod
      ~/.cache/go-build
    key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
    restore-keys: |
      ${{ runner.os }}-go-
```

**GitHub Actions - Docker Layers**:
```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v2

- name: Build with cache
  uses: docker/build-push-action@v4
  with:
    context: .
    push: true
    tags: myapp:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max  # Cache all layers
```

**Impact**: 5-minute builds → 30-second builds (after first run)

**GitLab CI Caching**:
```yaml
cache:
  paths:
    - node_modules/
    - .npm/
  key:
    files:
      - package-lock.json

before_script:
  - npm ci --cache .npm --prefer-offline
```

**Jenkins Caching**:
```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                script {
                    docker.image('node:18').inside {
                        // Jenkins workspace is persistent across builds
                        sh 'npm ci'
                    }
                }
            }
        }
    }
}
```

### 2. Parallelization

**Sequential (Slow)**:
```yaml
jobs:
  build:
    steps:
      - run: npm run build     # 3 min
      - run: npm run test      # 5 min
      - run: npm run lint      # 2 min
# Total: 10 minutes
```

**Parallel (Fast)**:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
  
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test
  
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint

# Total: 5 minutes (longest job)
```

**Advanced: Test Sharding**:
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - run: |
          npm run test -- --shard=${{ matrix.shard }}/4
          # Each shard runs 25% of tests
```

**Impact**: 20-minute test suite → 5 minutes (with 4 shards)

### 3. Matrix Builds

**Test Multiple Versions in Parallel**:
```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [16, 18, 20]
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm test
```

**Generates 9 parallel jobs** (3 node versions × 3 OSes)

**With Exclusions**:
```yaml
strategy:
  matrix:
    node-version: [16, 18, 20]
    os: [ubuntu-latest, windows-latest, macos-latest]
    exclude:
      - os: macos-latest
        node-version: 16  # Skip old Node on macOS
```

### 4. Conditional Execution (Skip Unnecessary Steps)

**Skip CI for Documentation Changes**:
```yaml
on:
  push:
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

**Skip Tests if Only Frontend Changed**:
```yaml
jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            backend:
              - 'backend/**'
              - 'go.mod'
      
      - name: Run backend tests
        if: steps.filter.outputs.backend == 'true'
        run: go test ./...
```

**Impact**: Saves 50% of pipeline runs

### 5. Incremental Builds

**Nx (Monorepo Tool)**:
```json
// nx.json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nrwl/nx-cloud",
      "options": {
        "cacheableOperations": ["build", "test", "lint"],
        "accessToken": "..."
      }
    }
  }
}
```

```yaml
# Only build affected projects
- name: Build affected
  run: npx nx affected --target=build --base=origin/main
```

**Impact**: 30-minute monorepo build → 2 minutes (only changed packages)

### 6. Fail Fast

**Stop on First Failure**:
```yaml
jobs:
  test:
    strategy:
      fail-fast: true  # Stop all jobs if one fails
      matrix:
        shard: [1, 2, 3, 4]
```

**Impact**: Save compute costs, faster feedback

### 7. Build Artifacts Reuse

**Build Once, Use Everywhere**:
```yaml
jobs:
  build:
    steps:
      - run: go build -o myapp
      - uses: actions/upload-artifact@v3
        with:
          name: binary
          path: myapp
  
  test:
    needs: build
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: binary
      - run: ./myapp --test
  
  deploy:
    needs: build
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: binary
      - run: scp myapp server:/app/
```

**Impact**: No rebuilding, guaranteed same artifact deployed

### 8. Self-Hosted Runners (Speed & Cost)

**GitHub Actions - Self-Hosted**:
```yaml
jobs:
  build:
    runs-on: self-hosted  # Uses your own server
    steps:
      - run: docker build .
```

**Setup Self-Hosted Runner**:
```bash
# On your server
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure
./config.sh --url https://github.com/myorg/myrepo --token <TOKEN>

# Run
./run.sh
```

**Pros**:
- ✅ Faster (local caching, better hardware)
- ✅ Cheaper at scale
- ✅ Access to internal resources

**Cons**:
- ❌ Maintenance burden
- ❌ Security concerns
- ❌ No auto-scaling (unless with Kubernetes)

**Cost Comparison**:
```
GitHub Actions (cloud):
- 2000 free minutes/month
- $0.008/minute after (Linux)
- Typical: $100-500/month

Self-Hosted (AWS c5.xlarge):
- $120/month for instance
- Always available (no per-minute cost)
- Break-even: ~15,000 minutes/month
```

### 9. Pipeline DAG Optimization

**Identify Critical Path**:
```
    ┌──────────┐
    │  Build   │ 3 min
    └────┬─────┘
         │
    ┌────┴──────────┬──────────┬──────────┐
    │               │          │          │
┌───▼────┐  ┌───────▼──┐  ┌────▼───┐  ┌──▼─────┐
│  Lint  │  │Unit Test │  │ E2E    │  │Security│
│ 2 min  │  │  5 min   │  │ 10 min │  │ 3 min  │
└────┬───┘  └────┬─────┘  └────┬───┘  └───┬────┘
     │           │             │          │
     └───────────┴─────────────┴──────────┘
                     │
                ┌────▼────┐
                │ Deploy  │ 2 min
                └─────────┘

Critical Path: Build → E2E → Deploy = 15 min
```

**Optimize Critical Path**:
- Shard E2E tests (10 min → 3 min with 4 shards)
- New total: **8 minutes**

### 10. Benchmarking Pipeline Performance

**Track Pipeline Duration**:
```yaml
- name: Record pipeline duration
  if: always()
  run: |
    DURATION=$(($(date +%s) - ${{ github.event.head_commit.timestamp }}))
    curl -X POST https://metrics.example.com/api/metrics \
      -d "pipeline_duration_seconds{repo=\"${GITHUB_REPOSITORY}\",branch=\"${GITHUB_REF}\"} ${DURATION}"
```

**Visualize in Grafana**:
```promql
# Average pipeline duration over time
avg_over_time(pipeline_duration_seconds[7d])

# Slowest stages
topk(5, stage_duration_seconds)
```

### Optimization Checklist

- [ ] Enable dependency caching
- [ ] Parallelize independent jobs
- [ ] Use matrix builds for multi-version testing
- [ ] Skip unchanged paths
- [ ] Implement test sharding for large test suites
- [ ] Fail fast to save costs
- [ ] Reuse build artifacts
- [ ] Consider self-hosted runners for large teams
- [ ] Profile and optimize slowest stages
- [ ] Monitor pipeline performance over time

---

## Multi-Environment Management

### Environment Hierarchy

```
┌──────────────┐
│ Development  │ ← Developers test here
└──────┬───────┘
       │ (auto-deploy)
       ▼
┌──────────────┐
│   Staging    │ ← Pre-production testing
└──────┬───────┘
       │ (manual approval)
       ▼
┌──────────────┐
│  Production  │ ← Live users
└──────────────┘
```

### 1. Configuration Management

**Problem**: Different config per environment (DB URLs, API keys, feature flags)

**Anti-Pattern** (Don't do this):
```javascript
// ❌ Hardcoded environments
const config = {
  dev: { dbUrl: 'dev-db.example.com' },
  prod: { dbUrl: 'prod-db.example.com' }
};
```

**Good Pattern: Environment Variables**:
```javascript
// ✅ Environment-driven config
const config = {
  dbUrl: process.env.DATABASE_URL,
  apiKey: process.env.API_KEY,
  environment: process.env.NODE_ENV
};
```

**GitHub Actions Environments**:
```yaml
jobs:
  deploy-dev:
    environment: development
    steps:
      - run: echo "DB_URL is ${{ secrets.DATABASE_URL }}"
      # Uses secrets from 'development' environment
  
  deploy-prod:
    environment: production
    needs: deploy-dev
    steps:
      - run: echo "DB_URL is ${{ secrets.DATABASE_URL }}"
      # Uses secrets from 'production' environment
```

**Environment-Specific Secrets**:
```
Repository → Settings → Environments → [Create environment]

production:
  Secrets:
    - DATABASE_URL: prod-db.example.com
    - API_KEY: sk-prod-123
  Protection rules:
    ✅ Required reviewers: [@tech-lead]
    ✅ Wait timer: 10 minutes

staging:
  Secrets:
    - DATABASE_URL: staging-db.example.com
    - API_KEY: sk-staging-456
```

### 2. Configuration Files Per Environment

**Structure**:
```
config/
├── base.yaml
├── development.yaml
├── staging.yaml
└── production.yaml
```

**base.yaml** (common config):
```yaml
app:
  name: myapp
  port: 8080
  
logging:
  level: info
```

**production.yaml** (overrides):
```yaml
logging:
  level: warn  # Less verbose in prod
  
database:
  replicas: 3
  
resources:
  memory: 4Gi
  cpu: 2
```

**Load Config** (12-factor app):
```go
package main

import (
    "github.com/spf13/viper"
)

func loadConfig() {
    viper.SetConfigName("base")
    viper.AddConfigPath("./config")
    viper.ReadInConfig()
    
    // Override with environment-specific
    env := os.Getenv("APP_ENV")
    viper.SetConfigName(env)
    viper.MergeInConfig()
    
    // Environment variables take precedence
    viper.AutomaticEnv()
}
```

### 3. Kubernetes ConfigMaps & Secrets

**Base Deployment**:
```yaml
# k8s/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 1  # Will be overridden
  template:
    spec:
      containers:
      - name: app
        image: myapp:latest
        env:
        - name: APP_ENV
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: environment
```

**Production Overlay**:
```yaml
# k8s/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../../base

replicas:
- name: myapp
  count: 10  # Production: 10 replicas

configMapGenerator:
- name: app-config
  literals:
  - environment=production
  - log_level=warn

secretGenerator:
- name: app-secrets
  envs:
  - secrets.env
```

### 4. Environment Promotion Strategy

**Strategy 1: Progressive Promotion**:
```yaml
name: Progressive Deployment

on:
  push:
    branches: [main]

jobs:
  deploy-dev:
    environment: development
    steps:
      - run: kubectl apply -f k8s/dev/

  smoke-test-dev:
    needs: deploy-dev
    steps:
      - run: ./test-dev.sh

  deploy-staging:
    needs: smoke-test-dev
    environment: staging
    steps:
      - run: kubectl apply -f k8s/staging/

  e2e-test-staging:
    needs: deploy-staging
    steps:
      - run: npm run test:e2e

  deploy-production:
    needs: e2e-test-staging
    environment: production  # Requires approval
    steps:
      - run: kubectl apply -f k8s/production/
```

**Strategy 2: Branch-Based**:
```yaml
on:
  push:
    branches:
      - develop   # → dev environment
      - staging   # → staging environment
      - main      # → production environment

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Determine environment
        id: env
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            echo "environment=production" >> $GITHUB_OUTPUT
          elif [ "${{ github.ref }}" = "refs/heads/staging" ]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
          else
            echo "environment=development" >> $GITHUB_OUTPUT
          fi
      
      - name: Deploy
        run: ./deploy.sh ${{ steps.env.outputs.environment }}
```

### 5. Environment Parity

**12-Factor App Principle**: Dev/staging/prod should be as similar as possible

**Differences to Minimize**:
- ✅ Same OS, runtime versions
- ✅ Same database version
- ✅ Same infrastructure (use smaller instances, not different tech)

**Acceptable Differences**:
- Replica counts (prod: 10, staging: 2, dev: 1)
- Resource limits (prod: more CPU/memory)
- External service endpoints
- Log verbosity

**Docker for Parity**:
```dockerfile
# Same image used in all environments
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .

# Environment-specific config via env vars
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

### 6. Feature Flags for Environment Control

**Enable Features Per Environment**:
```javascript
const features = {
  newCheckout: {
    development: true,
    staging: true,
    production: false  // Not ready for prod yet
  }
};

if (features.newCheckout[process.env.APP_ENV]) {
  // Use new checkout flow
} else {
  // Use old checkout flow
}
```

**LaunchDarkly Config**:
```json
{
  "new-checkout": {
    "variations": [true, false],
    "targeting": [
      {
        "values": ["production"],
        "variation": 1  // false
      },
      {
        "values": ["staging", "development"],
        "variation": 0  // true
      }
    ]
  }
}
```

### 7. Environment-Specific Testing

**Staging = Production Replica**:
```yaml
staging-tests:
  environment: staging
  steps:
    - name: Load test
      run: |
        artillery run load-test.yaml --target https://staging.example.com
    
    - name: Chaos testing
      run: |
        # Safe to test failures in staging
        kubectl delete pod -l app=myapp --random-one
```

**Production: Canary Tests**:
```yaml
production-canary:
  environment: production
  steps:
    - name: Canary health check
      run: |
        # Only check canary pods
        curl https://canary.example.com/health
```

### 8. Cost Management Per Environment

**Production: High Availability**:
```yaml
# 10 replicas, always running
replicas: 10
resources:
  requests:
    memory: "2Gi"
    cpu: "1000m"
```

**Staging: Scale Down Off-Hours**:
```yaml
# CronJob to scale down at night
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scale-down-staging
spec:
  schedule: "0 20 * * *"  # 8 PM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: scaler
            image: bitnami/kubectl
            command:
            - kubectl
            - scale
            - deployment/myapp
            - --replicas=1
```

**Development: Spot Instances**:
```hcl
# Terraform
resource "aws_eks_node_group" "dev" {
  capacity_type = "SPOT"  # 70% cheaper
  instance_types = ["t3.medium", "t3a.medium"]
  
  scaling_config {
    desired_size = 1
    max_size     = 3
    min_size     = 1
  }
}
```

---

## Monorepo CI/CD

### What is a Monorepo?

**Definition**: Single repository containing multiple projects/packages

**Examples**:
- Google (2 billion lines of code, 1 repo)
- Facebook, Microsoft, Uber

**Structure**:
```
monorepo/
├── packages/
│   ├── frontend/
│   │   ├── src/
│   │   └── package.json
│   ├── backend/
│   │   ├── main.go
│   │   └── go.mod
│   └── shared/
│       └── utils.ts
└── package.json
```

### The Challenge

**Problem**: Changing `shared/` shouldn't rebuild/test `backend/`

**Naive Approach** (slow):
```yaml
# ❌ Builds everything on every commit
- run: npm run build
- run: npm run test
```

**Impact**: 30-minute builds for 1-line change

### 1. Nx (Smart Monorepo Tool)

**Setup**:
```bash
npx create-nx-workspace@latest myorg
```

**Structure**:
```
myorg/
├── apps/
│   ├── frontend/
│   └── backend/
├── libs/
│   ├── shared-ui/
│   └── shared-utils/
├── nx.json
└── package.json
```

**nx.json**:
```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"]
      }
    }
  }
}
```

**GitHub Actions**:
```yaml
- name: Checkout
  uses: actions/checkout@v3
  with:
    fetch-depth: 0  # Need full history for affected detection

- name: Derive SHAs
  uses: nrwl/nx-set-shas@v3

- name: Build affected
  run: npx nx affected --target=build --parallel=3

- name: Test affected
  run: npx nx affected --target=test --parallel=3
```

**How It Works**:
```bash
# Detects changes since last commit
git diff HEAD~1 HEAD --name-only

# Changed: packages/shared/utils.ts
# Affected: frontend (depends on shared), backend (doesn't depend)
# Builds: frontend only ✅
```

**Impact**: 30-minute build → 2 minutes (only changed projects)

**Computation Caching**:
```bash
# First run
nx build frontend
# ✓ Built successfully (3 minutes)

# No changes, run again
nx build frontend
# ✓ Cache hit (0.1 seconds)
```

**Remote Caching (Nx Cloud)**:
```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nrwl/nx-cloud",
      "options": {
        "cacheableOperations": ["build", "test"],
        "accessToken": "xxx"
      }
    }
  }
}
```

**Benefit**: Share cache across CI and developers

### 2. Turborepo

**Alternative to Nx (from Vercel)**

**Setup**:
```bash
npx create-turbo@latest
```

**turbo.json**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "deploy": {
      "dependsOn": ["build", "test"],
      "cache": false
    }
  }
}
```

**GitHub Actions**:
```yaml
- name: Build
  run: npx turbo run build --filter=...[HEAD^1]
  # Only builds changed packages
```

**Pros**:
- ✅ Simpler than Nx
- ✅ Great for Next.js projects
- ✅ Fast

**Cons**:
- ❌ Less features than Nx
- ❌ Newer (less mature)

### 3. Bazel (Google's Build Tool)

**For Large-Scale Monorepos**

**BUILD.bazel**:
```python
# packages/frontend/BUILD.bazel
load("@npm//@bazel/typescript:index.bzl", "ts_library")

ts_library(
    name = "frontend",
    srcs = glob(["src/**/*.ts"]),
    deps = [
        "//packages/shared:shared-utils"
    ]
)
```

**Build**:
```bash
bazel build //packages/frontend:frontend
```

**Pros**:
- ✅ Scales to massive repos (Google uses it)
- ✅ Incremental builds
- ✅ Remote execution

**Cons**:
- ❌ Steep learning curve
- ❌ Complex setup

### 4. GitHub Actions - Path Filters

**Manual Affected Detection**:
```yaml
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
    steps:
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            frontend:
              - 'packages/frontend/**'
              - 'packages/shared/**'
            backend:
              - 'packages/backend/**'

  build-frontend:
    needs: changes
    if: needs.changes.outputs.frontend == 'true'
    steps:
      - run: npm run build --workspace=frontend

  build-backend:
    needs: changes
    if: needs.changes.outputs.backend == 'true'
    steps:
      - run: go build ./packages/backend
```

### 5. Dependency Graph

**Nx Dependency Graph**:
```bash
npx nx graph
```

**Output**:
```
frontend ──→ shared-ui ──→ shared-utils
backend  ──→ shared-utils
```

**Use Cases**:
- Understand impact of changes
- Find circular dependencies
- Optimize build order

### 6. Monorepo vs Polyrepo

| Aspect | Monorepo | Polyrepo |
|--------|----------|----------|
| **Code Sharing** | ✅ Easy | ❌ Hard (npm packages) |
| **Atomic Changes** | ✅ One commit | ❌ Multiple PRs |
| **CI/CD** | ❌ Complex | ✅ Simple |
| **Onboarding** | ❌ Overwhelming | ✅ Focused |
| **Tooling** | Nx, Bazel | Standard |
| **Scale** | ✅ Google-scale | ✅ Microservices |

**When to Use Monorepo**:
- ✅ Shared code between projects
- ✅ Need atomic changes across services
- ✅ Team size: 10-1000+ developers

**When to Use Polyrepo**:
- ✅ Independent services (microservices)
- ✅ Different release cycles
- ✅ Small teams (<10 developers)

---

## DORA Metrics

### What Are DORA Metrics?

**DORA** = DevOps Research and Assessment (Google)

**The Four Key Metrics** (measure DevOps performance):

1. **Deployment Frequency**: How often you deploy
2. **Lead Time for Changes**: Code commit → production
3. **Mean Time to Recovery (MTTR)**: Time to recover from failure
4. **Change Failure Rate**: % of deployments causing failures

**Elite Performers**:
```
Deployment Frequency: Multiple times per day
Lead Time: < 1 hour
MTTR: < 1 hour
Change Failure Rate: 0-15%
```

**Low Performers**:
```
Deployment Frequency: Once per month
Lead Time: 1-6 months
MTTR: 1 week - 1 month
Change Failure Rate: 46-60%
```

### 1. Deployment Frequency

**What**: How often code reaches production

**Tracking**:
```yaml
# .github/workflows/deploy.yml
- name: Record deployment
  if: github.ref == 'refs/heads/main'
  run: |
    curl -X POST https://metrics.example.com/deployments \
      -d '{
        "timestamp": "${{ github.event.head_commit.timestamp }}",
        "repo": "${{ github.repository }}",
        "commit": "${{ github.sha }}",
        "author": "${{ github.actor }}"
      }'
```

**Prometheus Metric**:
```python
from prometheus_client import Counter

deployments = Counter('deployments_total', 'Total deployments')

@app.post('/deploy')
def deploy():
    deployments.inc()
    # ... deployment logic
```

**Query**:
```promql
# Deployments per day
rate(deployments_total[1d]) * 86400
```

**Visualization (Grafana)**:
```
Panel: Deployment Frequency
Query: rate(deployments_total[7d]) * 86400
Display: 15 deployments/day
```

### 2. Lead Time for Changes

**What**: Time from commit to production

**Tracking**:
```yaml
- name: Calculate lead time
  run: |
    COMMIT_TIME=$(git show -s --format=%ct ${{ github.sha }})
    DEPLOY_TIME=$(date +%s)
    LEAD_TIME=$((DEPLOY_TIME - COMMIT_TIME))
    
    curl -X POST https://metrics.example.com/lead_time \
      -d "{\"lead_time_seconds\": $LEAD_TIME}"
```

**Prometheus Histogram**:
```python
from prometheus_client import Histogram

lead_time = Histogram('lead_time_seconds', 'Lead time for changes',
                     buckets=[300, 900, 1800, 3600, 7200, 14400, 28800])

def deploy(commit_sha):
    commit_time = get_commit_time(commit_sha)
    deploy_time = time.time()
    lead_time.observe(deploy_time - commit_time)
```

**Query**:
```promql
# Median lead time (last 7 days)
histogram_quantile(0.5, rate(lead_time_seconds_bucket[7d]))
```

### 3. Mean Time to Recovery (MTTR)

**What**: Time from incident detection to resolution

**Incident Lifecycle**:
```
Incident Detected → Alert Sent → Team Responds → Fix Deployed → Resolved
      │                                                            │
      └────────────────────────────────────────────────────────────┘
                          MTTR (measure this)
```

**Tracking**:
```yaml
# When incident starts
POST /incidents
{
  "id": "inc-123",
  "started_at": "2024-02-02T10:00:00Z",
  "severity": "high"
}

# When resolved
PATCH /incidents/inc-123
{
  "resolved_at": "2024-02-02T10:45:00Z"
}

# Auto-calculate MTTR
MTTR = resolved_at - started_at = 45 minutes
```

**Integration with PagerDuty**:
```python
import pdpyras

session = pdpyras.APISession(API_KEY)

# Get incidents from last 30 days
incidents = session.list_all('incidents', params={
    'since': '2024-01-01',
    'until': '2024-02-01'
})

# Calculate MTTR
mttrs = []
for inc in incidents:
    if inc['status'] == 'resolved':
        created = parse_time(inc['created_at'])
        resolved = parse_time(inc['resolved_at'])
        mttr = (resolved - created).total_seconds()
        mttrs.append(mttr)

avg_mttr = sum(mttrs) / len(mttrs)
print(f"Average MTTR: {avg_mttr / 3600:.2f} hours")
```

### 4. Change Failure Rate

**What**: % of deployments that cause production incidents

**Calculation**:
```
Change Failure Rate = (Failed Deployments / Total Deployments) × 100
```

**Tracking**:
```yaml
# Mark deployment
- name: Record deployment
  id: deploy
  run: ./deploy.sh

# Monitor for 1 hour
- name: Monitor deployment
  run: |
    sleep 3600
    ERROR_RATE=$(curl -s https://metrics.example.com/error_rate)
    
    if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
      # High error rate = failed deployment
      curl -X POST https://metrics.example.com/deployments/${{ steps.deploy.outputs.id }}/mark_failed
    fi
```

**Prometheus**:
```python
from prometheus_client import Counter

deployments_total = Counter('deployments_total', 'Total deployments')
deployments_failed = Counter('deployments_failed', 'Failed deployments')

def deploy():
    deployments_total.inc()
    
    try:
        # Deployment logic
        success = perform_deployment()
        
        if not success or high_error_rate():
            deployments_failed.inc()
    except:
        deployments_failed.inc()
        raise
```

**Query**:
```promql
# Change failure rate (last 30 days)
(rate(deployments_failed[30d]) / rate(deployments_total[30d])) * 100
```

### Implementing DORA Metrics

**Option 1: Prometheus + Grafana**

**prometheus.yml**:
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'dora-metrics'
    static_configs:
      - targets: ['app:8080']
```

**Grafana Dashboard**:
```json
{
  "dashboard": {
    "title": "DORA Metrics",
    "panels": [
      {
        "title": "Deployment Frequency",
        "targets": [{
          "expr": "rate(deployments_total[7d]) * 86400"
        }]
      },
      {
        "title": "Lead Time (median)",
        "targets": [{
          "expr": "histogram_quantile(0.5, rate(lead_time_seconds_bucket[7d]))"
        }]
      },
      {
        "title": "MTTR",
        "targets": [{
          "expr": "avg(mttr_seconds)"
        }]
      },
      {
        "title": "Change Failure Rate",
        "targets": [{
          "expr": "(rate(deployments_failed[30d]) / rate(deployments_total[30d])) * 100"
        }]
      }
    ]
  }
}
```

**Option 2: Four Keys (Google's Open Source Tool)**

**GitHub**: https://github.com/GoogleCloudPlatform/fourkeys

**Setup**:
```bash
# Clone
git clone https://github.com/GoogleCloudPlatform/fourkeys

# Deploy to GCP
cd fourkeys/setup
./setup.sh

# Integrate with GitHub webhook
# Automatically calculates DORA metrics from commits, deploys, incidents
```

**Option 3: Commercial Tools**
- **Sleuth**: $49/month
- **Haystack**: $99/month  
- **LinearB**: $50/user/month

### Using DORA Metrics to Improve

**Low Deployment Frequency?**
- → Automate deployments
- → Reduce batch size
- → Implement trunk-based development

**High Lead Time?**
- → Optimize CI/CD pipeline (caching, parallelization)
- → Reduce code review time
- → Automate testing

**High MTTR?**
- → Improve monitoring/alerting
- → Practice incident response (game days)
- → Implement feature flags (instant rollback)
- → Better runbooks

**High Change Failure Rate?**
- → Improve test coverage
- → Implement canary deployments
- → Better staging environment (production-like)
- → Pre-deployment checks

---

## Performance Testing in CI/CD

### Why Performance Testing in CI?

**Problem**: Performance regressions discovered in production

**Solution**: Automated performance tests in pipeline

**Types**:
1. **Load Testing**: Can system handle expected load?
2. **Stress Testing**: Breaking point?
3. **Spike Testing**: Handle sudden traffic surge?
4. **Endurance Testing**: Performance over time (memory leaks?)

### 1. k6 (Modern Load Testing)

**Why k6?**
- JavaScript-based (familiar)
- CLI-friendly (CI/CD-ready)
- Open source
- Great for APIs

**Install**:
```bash
# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Load Test Script** (`load-test.js`):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 for 5 min
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  const res = http.get('https://api.example.com/products');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

**Run**:
```bash
k6 run load-test.js
```

**Output**:
```
     ✓ status is 200
     ✓ response time < 500ms

     checks.........................: 100.00% ✓ 30000 ✗ 0
     data_received..................: 45 MB   150 kB/s
     data_sent......................: 2.4 MB  8.0 kB/s
     http_req_duration..............: avg=245ms min=100ms med=230ms max=890ms p(90)=350ms p(95)=420ms
     http_reqs......................: 30000   100/s
     vus............................: 100     min=0   max=100
```

**In CI/CD (GitHub Actions)**:
```yaml
name: Performance Test

on:
  pull_request:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to staging
        run: ./deploy-staging.sh
      
      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.0
        with:
          filename: load-test.js
          cloud: false
      
      - name: Check thresholds
        run: |
          # k6 exits with code 0 if thresholds pass, non-zero if fail
          # Pipeline fails automatically if thresholds not met
```

**Fail Pipeline on Performance Regression**:
```javascript
export const options = {
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // FAIL if p95 > 500ms
  },
};
```

### 2. JMeter (Enterprise Standard)

**Pros**:
- Industry standard
- GUI for test creation
- Extensive protocols (HTTP, JDBC, JMS, SOAP)

**Cons**:
- Java-based (heavy)
- XML config (verbose)

**Test Plan** (`test-plan.jmx`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2">
  <hashTree>
    <TestPlan>
      <ThreadGroup>
        <stringProp name="ThreadGroup.num_threads">100</stringProp>
        <stringProp name="ThreadGroup.ramp_time">60</stringProp>
        <HTTPSamplerProxy>
          <stringProp name="HTTPSampler.domain">api.example.com</stringProp>
          <stringProp name="HTTPSampler.path">/products</stringProp>
        </HTTPSamplerProxy>
      </ThreadGroup>
    </TestPlan>
  </hashTree>
</jmeterTestPlan>
```

**Run in CI**:
```yaml
- name: Run JMeter
  run: |
    wget https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.5.tgz
    tar -xzf apache-jmeter-5.5.tgz
    apache-jmeter-5.5/bin/jmeter -n -t test-plan.jmx -l results.jtl
    
    # Check results
    python check-jmeter-results.py results.jtl
```

### 3. Artillery

**Modern, YAML-based**

**test.yaml**:
```yaml
config:
  target: "https://api.example.com"
  phases:
    - duration: 60
      arrivalRate: 10  # 10 users/second
  
scenarios:
  - name: "Get products"
    flow:
      - get:
          url: "/products"
          expect:
            - statusCode: 200
            - contentType: json
            - hasProperty: data
```

**Run**:
```bash
npm install -g artillery
artillery run test.yaml
```

### 4. Locust (Python-based)

**Great for complex scenarios**

**locustfile.py**:
```python
from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 5)
    
    @task(3)  # 3x more likely than other tasks
    def view_products(self):
        self.client.get("/products")
    
    @task(1)
    def view_product(self):
        product_id = random.randint(1, 100)
        self.client.get(f"/products/{product_id}")
    
    def on_start(self):
        # Login once
        self.client.post("/login", json={
            "username": "test",
            "password": "test"
        })
```

**Run**:
```bash
locust -f locustfile.py --headless -u 100 -r 10 --run-time 5m --host https://api.example.com
```

### 5. Performance Regression Detection

**Baseline Measurement**:
```bash
# Run on main branch
k6 run load-test.js --summary-export=baseline.json
```

**Compare on PR**:
```bash
# Run on feature branch
k6 run load-test.js --summary-export=current.json

# Compare
python compare-k6-results.py baseline.json current.json
```

**compare-k6-results.py**:
```python
import json
import sys

baseline = json.load(open('baseline.json'))
current = json.load(open('current.json'))

baseline_p95 = baseline['metrics']['http_req_duration']['values']['p(95)']
current_p95 = current['metrics']['http_req_duration']['values']['p(95)']

regression = ((current_p95 - baseline_p95) / baseline_p95) * 100

print(f"Baseline p95: {baseline_p95}ms")
print(f"Current p95: {current_p95}ms")
print(f"Change: {regression:+.2f}%")

if regression > 10:  # 10% regression
    print("❌ Performance regression detected!")
    sys.exit(1)
else:
    print("✅ No significant regression")
```

**GitHub Actions**:
```yaml
- name: Checkout main branch
  uses: actions/checkout@v3
  with:
    ref: main
    path: main

- name: Run baseline test
  run: k6 run main/load-test.js --summary-export=baseline.json

- name: Checkout PR branch
  uses: actions/checkout@v3
  with:
    path: pr

- name: Run current test
  run: k6 run pr/load-test.js --summary-export=current.json

- name: Compare results
  run: python compare.py baseline.json current.json
```

### 6. Continuous Performance Monitoring

**Store Metrics Over Time**:
```yaml
- name: Upload to InfluxDB
  run: |
    k6 run load-test.js --out influxdb=http://influxdb:8086/k6
```

**Grafana Dashboard**: Track performance trends

```
Panel: P95 Response Time Over Time
Query: SELECT percentile("http_req_duration", 95) FROM "k6" WHERE time > now() - 30d GROUP BY time(1d)

Trend: Are we getting slower over time?
```

### Tools Comparison

| Tool | Language | Pros | Cons | Best For |
|------|----------|------|------|----------|
| **k6** | JavaScript | Modern, CI-friendly | Newer | APIs, microservices |
| **JMeter** | Java/XML | Industry standard, GUI | Heavy, complex | Enterprise, complex protocols |
| **Artillery** | YAML | Simple syntax | Limited features | Quick tests |
| **Locust** | Python | Flexible, Python ecosystem | Slower | Complex scenarios |
| **Gatling** | Scala | Fast, detailed reports | Steep learning curve | JVM apps |

---

## Compliance & Audit

### Why Compliance in CI/CD?

**Industries Requiring Compliance**:
- **Finance**: SOX, PCI-DSS
- **Healthcare**: HIPAA
- **Government**: FedRAMP, FISMA
- **General**: SOC 2, ISO 27001, GDPR

**Requirements**:
1. **Audit Trail**: Who changed what, when?
2. **Approval Gates**: Manual review before production
3. **Access Control**: Who can deploy?
4. **Immutable Artifacts**: Can't modify after build
5. **Security Scanning**: Vulnerability detection
6. **Evidence Collection**: Prove compliance

### 1. Audit Trail

**What**: Comprehensive log of all CI/CD activities

**GitHub Actions Audit Log**:
```yaml
# Automatically logged by GitHub:
- Who triggered the workflow
- When it ran
- What code was deployed
- Approval decisions
- Secret access (who accessed which secret)
```

**Access Audit Log**:
- Organization → Settings → Security → Audit log
- API: `GET /orgs/{org}/audit-log`

**GitLab Audit Events** (Premium/Ultimate):
```ruby
# Tracks:
- Pipeline triggers
- Deployment to environments
- Variable changes
- Runner registration
```

**Custom Audit Logging**:
```yaml
- name: Log deployment
  run: |
    curl -X POST https://audit-api.example.com/events \
      -H "Content-Type: application/json" \
      -d '{
        "event_type": "deployment",
        "timestamp": "$(date -Iseconds)",
        "actor": "${{ github.actor }}",
        "repository": "${{ github.repository }}",
        "commit_sha": "${{ github.sha }}",
        "environment": "production",
        "approval_status": "approved",
        "approver": "${{ github.event.review.user.login }}"
      }'
```

**Immutable Audit Log** (Blockchain-based):
```python
import hashlib
import json
import time

class AuditLog:
    def __init__(self):
        self.chain = []
    
    def add_event(self, event):
        if len(self.chain) == 0:
            previous_hash = "0"
        else:
            previous_hash = self.chain[-1]['hash']
        
        block = {
            'event': event,
            'timestamp': time.time(),
            'previous_hash': previous_hash
        }
        block['hash'] = hashlib.sha256(
            json.dumps(block, sort_keys=True).encode()
        ).hexdigest()
        
        self.chain.append(block)
        # Tamper-proof: changing any event changes all subsequent hashes
```

### 2. Approval Gates

**GitHub Environments with Required Reviewers**:
```yaml
# .github/workflows/deploy.yml
jobs:
  deploy-production:
    environment:
      name: production
      url: https://example.com
    steps:
      - run: ./deploy.sh
```

**Configure Environment Protection** (GitHub Settings):
```
Repository → Settings → Environments → production
✅ Required reviewers: [@tech-lead, @security-team]
✅ Wait timer: 10 minutes (cool-down period)
```

**Manual Approval in GitLab**:
```yaml
deploy_production:
  stage: deploy
  environment: production
  when: manual  # Requires manual trigger
  only:
    - main
  script:
    - ./deploy.sh
```

**Multi-Stage Approval** (Enterprise Pattern):
```yaml
jobs:
  # Stage 1: Security review
  security-review:
    runs-on: ubuntu-latest
    environment: security-approval
    steps:
      - run: echo "Security team approved"
  
  # Stage 2: Change management approval
  change-management:
    needs: security-review
    environment: change-approval
    steps:
      - run: echo "Change management approved"
  
  # Stage 3: Deploy
  deploy-production:
    needs: change-management
    environment: production
    steps:
      - run: ./deploy.sh
```

### 3. Access Control (RBAC)

**Principle**: Least privilege access

**GitHub Teams & Permissions**:
```
Organization
├── Team: Platform
│   ├── Permissions: Admin
│   └── Members: [@alice, @bob]
├── Team: Developers
│   ├── Permissions: Write
│   └── Members: [@charlie, @diana]
└── Team: Contractors
    ├── Permissions: Read
    └── Members: [@eve]
```

**Branch Protection Rules**:
```
Settings → Branches → Branch protection rules → main
✅ Require pull request reviews before merging (2 reviews)
✅ Require status checks to pass
✅ Require conversation resolution
✅ Require signed commits
✅ Restrict who can push (Only: Platform team)
```

**Jenkins RBAC**:
```groovy
// Jenkins Configuration as Code
jenkins:
  authorizationStrategy:
    roleBased:
      roles:
        global:
          - name: "admin"
            permissions:
              - "Overall/Administer"
            assignments:
              - "platform-team"
          - name: "developer"
            permissions:
              - "Job/Build"
              - "Job/Read"
            assignments:
              - "dev-team"
          - name: "deployer"
            permissions:
              - "Job/Build"
              - "Job/Read"
            assignments:
              - "deploy-bot"
        items:
          - name: "production-deployer"
            pattern: "production-.*"
            permissions:
              - "Job/Build"
            assignments:
              - "tech-lead"
```

### 4. Secrets Rotation

**Automated Rotation Policy**:
```yaml
# Every 90 days, rotate secrets
name: Rotate Secrets

on:
  schedule:
    - cron: '0 0 1 */3 *'  # Every 3 months

jobs:
  rotate:
    runs-on: ubuntu-latest
    steps:
      - name: Rotate database password
        run: |
          NEW_PASSWORD=$(openssl rand -base64 32)
          
          # Update in Vault
          vault kv put secret/prod/db password=$NEW_PASSWORD
          
          # Update database
          psql -c "ALTER USER myapp PASSWORD '$NEW_PASSWORD';"
          
          # Trigger app restart (picks up new secret)
          kubectl rollout restart deployment/myapp
      
      - name: Notify team
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"🔐 Database credentials rotated"}'
```

### 5. Compliance Scanning

**SAST (Static Application Security Testing)**:
```yaml
- name: Run SonarQube
  uses: sonarsource/sonarqube-scan-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}

- name: Quality Gate
  uses: sonarsource/sonarqube-quality-gate-action@master
  timeout-minutes: 5
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

**DAST (Dynamic Application Security Testing)**:
```yaml
- name: Deploy to test environment
  run: ./deploy-test.sh

- name: Run OWASP ZAP scan
  uses: zaproxy/action-baseline@v0.7.0
  with:
    target: 'https://test.example.com'
    rules_file_name: '.zap/rules.tsv'
    cmd_options: '-a'
```

**Dependency Scanning**:
```yaml
- name: Run Snyk
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=high
```

**Container Scanning**:
```yaml
- name: Build image
  run: docker build -t myapp:${{ github.sha }} .

- name: Scan with Trivy
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'myapp:${{ github.sha }}'
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'  # Fail pipeline if vulnerabilities found

- name: Upload to GitHub Security
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: 'trivy-results.sarif'
```

### 6. Compliance Reports

**SOC 2 Evidence Collection**:
```yaml
- name: Generate compliance report
  run: |
    cat > compliance-report.json << EOF
    {
      "deployment_id": "${{ github.run_id }}",
      "timestamp": "$(date -Iseconds)",
      "deployed_by": "${{ github.actor }}",
      "commit_sha": "${{ github.sha }}",
      "approvers": ["${{ github.event.review.user.login }}"],
      "security_scan_passed": true,
      "tests_passed": true,
      "artifact_hash": "$(sha256sum artifact.tar.gz | awk '{print $1}')"
    }
    EOF
    
    # Store in compliance database
    curl -X POST https://compliance-db.example.com/evidence \
      -H "Content-Type: application/json" \
      -d @compliance-report.json
```

**Continuous Compliance Dashboard**:
```
┌─────────────────────────────────────────┐
│  Compliance Dashboard (Last 30 Days)   │
├─────────────────────────────────────────┤
│ Deployments with Approval:      100%   │
│ Security Scans Passed:           98%    │
│ Secrets Rotated on Schedule:     100%  │
│ Failed Logins (abnormal):        0      │
│ Unauthorized Deploy Attempts:    0      │
└─────────────────────────────────────────┘
```

### 7. HIPAA Compliance Example

**Requirements**:
- Audit trail of all PHI access
- Encryption at rest & in transit
- Access controls
- Automated monitoring

**Pipeline**:
```yaml
hipaa-compliant-deploy:
  runs-on: ubuntu-latest
  environment: production-hipaa
  
  steps:
    # 1. Signed commits only
    - name: Verify commit signature
      run: |
        git verify-commit ${{ github.sha }} || exit 1
    
    # 2. Scan for secrets/PHI in code
    - name: Scan for secrets
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: ${{ github.event.repository.default_branch }}
        head: HEAD
    
    # 3. Security scans
    - name: SAST scan
      run: semgrep --config=p/security-audit .
    
    # 4. Build with encryption
    - name: Build
      run: |
        docker build \
          --build-arg ENCRYPTION_KEY=${{ secrets.ENCRYPTION_KEY }} \
          -t myapp:${{ github.sha }} .
    
    # 5. Deploy with TLS
    - name: Deploy
      run: |
        kubectl apply -f k8s/
        kubectl annotate deployment myapp \
          compliance.example.com/hipaa=true \
          compliance.example.com/deployed-by=${{ github.actor }}
    
    # 6. Audit log
    - name: Log to audit system
      run: |
        ./log-to-splunk.sh \
          event="deployment" \
          user="${{ github.actor }}" \
          timestamp="$(date -Iseconds)" \
          phi_accessed="false"
```

---

## Cost Optimization

### Cloud CI/CD Cost Breakdown

**GitHub Actions Pricing**:
```
Free tier:
- Public repos: Unlimited
- Private repos: 2,000 minutes/month

Paid (per minute):
- Linux: $0.008/minute
- Windows: $0.016/minute
- macOS: $0.08/minute

Example cost (500 builds/month, 10 min each):
500 × 10 × $0.008 = $40/month
```

**GitLab CI Pricing**:
```
Free tier:
- 400 CI/CD minutes/month

Premium: $29/user/month
- 10,000 CI/CD minutes
```

**CircleCI Pricing**:
```
Free: 6,000 build minutes/month
Performance: $15/month (25,000 minutes)
Scale: $2,000/month (200,000 minutes)
```

### Cost Optimization Strategies

### 1. Optimize Build Duration

**Impact**: 20-minute build → 5-minute build = **75% cost reduction**

**Techniques**:
- Caching dependencies
- Parallel jobs
- Skip unchanged paths
- Incremental builds

**Example**:
```
Before: 50 builds/day × 20 min × $0.008 = $160/month
After:  50 builds/day × 5 min × $0.008 = $40/month
Savings: $120/month (75%)
```

### 2. Self-Hosted Runners

**Break-Even Analysis**:
```
GitHub Actions (cloud):
Cost = minutes × $0.008

Self-hosted (AWS c5.xlarge):
Cost = $120/month (fixed)

Break-even: 15,000 minutes/month

If you run > 15,000 minutes/month → self-hosted is cheaper
```

**Self-Hosted Setup**:
```bash
# Kubernetes-based autoscaling runners
helm install arc \
  --namespace arc-systems \
  --create-namespace \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller

# Scale based on job queue
kubectl apply -f - <<EOF
apiVersion: actions.summerwind.dev/v1alpha1
kind: RunnerDeployment
metadata:
  name: github-runner
spec:
  replicas: 1
  template:
    spec:
      repository: myorg/myrepo
      minReplicas: 1
      maxReplicas: 10  # Auto-scale up to 10
EOF
```

**Cost Comparison** (Large Team):
```
GitHub Actions (100,000 min/month):
= 100,000 × $0.008 = $800/month

Self-hosted (3× c5.xlarge on-demand):
= 3 × $120 = $360/month

Savings: $440/month = $5,280/year
```

### 3. Spot Instances for CI

**Use cheap, interruptible compute**

**AWS Spot Instances** (70% cheaper):
```hcl
# Terraform
resource "aws_eks_node_group" "ci_runners" {
  cluster_name = aws_eks_cluster.main.name
  
  scaling_config {
    desired_size = 2
    max_size     = 10
    min_size     = 1
  }
  
  capacity_type = "SPOT"  # 70% cheaper
  
  instance_types = [
    "c5.large",
    "c5a.large",
    "c5n.large"
  ]
  
  labels = {
    workload = "ci"
  }
}
```

**Handle Spot Interruptions**:
```yaml
jobs:
  build:
    runs-on: self-hosted
    steps:
      - name: Build
        run: make build
        timeout-minutes: 30  # Timeout before spot termination
        continue-on-error: true  # Retry on interruption
      
      - name: Retry on failure
        if: failure()
        uses: nick-invision/retry@v2
        with:
          timeout_minutes: 30
          max_attempts: 3
          command: make build
```

**Cost Savings**:
```
On-demand c5.large: $0.085/hour
Spot c5.large: $0.025/hour (70% off)

Monthly (24/7): $18 vs $62
Savings: $44/instance/month
```

### 4. Conditional Pipeline Execution

**Skip Unnecessary Builds**:
```yaml
on:
  push:
    paths-ignore:
      - '**.md'
      - 'docs/**'
      - '.github/ISSUE_TEMPLATE/**'
```

**Impact**:
```
Before: 100 builds/week (docs changes trigger builds)
After:  60 builds/week (40% reduction)

Savings: 40 builds × 10 min × $0.008 = $3.20/week = $167/year
```

### 5. macOS Builds (Expensive!)

**macOS is 10× more expensive than Linux**:
```
Linux: $0.008/min
macOS: $0.08/min
```

**Optimization**:
```yaml
# Only run macOS builds on main branch
jobs:
  macos-build:
    if: github.ref == 'refs/heads/main'
    runs-on: macos-latest
    steps:
      - run: swift build

  linux-build:
    runs-on: ubuntu-latest  # Always run (cheap)
    steps:
      - run: swift build
```

**Savings**:
```
Before: Every PR runs macOS build
50 PRs/month × 10 min × $0.08 = $40/month

After: Only main branch (10 builds/month)
10 × 10 min × $0.08 = $8/month

Savings: $32/month = $384/year
```

### 6. Monitor & Alert on High Costs

**GitHub Actions Usage API**:
```bash
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/orgs/myorg/settings/billing/actions
```

**Response**:
```json
{
  "total_minutes_used": 50000,
  "total_paid_minutes_used": 48000,
  "included_minutes": 2000,
  "minutes_used_breakdown": {
    "UBUNTU": 40000,
    "MACOS": 8000,
    "WINDOWS": 2000
  }
}
```

**Alert on High Usage**:
```python
import requests

usage = requests.get(
    'https://api.github.com/orgs/myorg/settings/billing/actions',
    headers={'Authorization': f'Bearer {GITHUB_TOKEN}'}
).json()

if usage['total_minutes_used'] > 100000:
    slack_alert(f"⚠️ High CI usage: {usage['total_minutes_used']} minutes this month")
```

### 7. Cache Docker Layers

**Without Cache**:
```yaml
- name: Build
  run: docker build -t myapp .
# 5 minutes every build
```

**With Cache**:
```yaml
- name: Build with cache
  uses: docker/build-push-action@v4
  with:
    context: .
    cache-from: type=gha
    cache-to: type=gha,mode=max
# 5 minutes first build, 30 seconds thereafter
```

**Savings**:
```
50 builds/month × 4.5 min saved × $0.008 = $1.80/month

Across 10 projects: $18/month = $216/year
```

### Cost Optimization Checklist

- [ ] Enable dependency caching
- [ ] Parallelize tests (reduce duration)
- [ ] Use self-hosted runners for high-volume workloads
- [ ] Use spot instances for non-critical jobs
- [ ] Skip builds for documentation-only changes
- [ ] Limit expensive macOS builds
- [ ] Monitor usage and set alerts
- [ ] Cache Docker layers
- [ ] Use matrix builds efficiently (don't over-test)
- [ ] Optimize test sharding (don't over-shard)

---

## Troubleshooting & Debugging

### Common Pipeline Failures

### 1. Flaky Tests

**Symptom**: Tests pass locally, fail randomly in CI

**Causes**:
- Timing issues (race conditions)
- Non-deterministic tests
- External dependencies (network, third-party APIs)
- Environment differences

**Solutions**:

**Retry Flaky Tests**:
```yaml
- name: Run tests with retry
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: npm test
```

**Isolate Flaky Tests**:
```yaml
- name: Run stable tests
  run: npm test -- --exclude=flaky

- name: Run flaky tests separately (allow failure)
  continue-on-error: true
  run: npm test -- --only=flaky
```

**Fix Timing Issues**:
```javascript
// ❌ Bad: Hardcoded sleep
await sleep(1000);  // Fails if server slow

// ✅ Good: Wait for condition
await waitFor(() => element.isVisible(), { timeout: 5000 });
```

**Mock External Dependencies**:
```javascript
// ❌ Calls real API (flaky)
const data = await fetch('https://api.example.com');

// ✅ Mock API
jest.mock('axios');
axios.get.mockResolvedValue({ data: { id: 1 } });
```

### 2. "Works on My Machine"

**Causes**:
- Different OS
- Different dependencies
- Missing environment variables
- Local cache/state

**Solutions**:

**Use Docker for Consistency**:
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: node:18  # Same image devs use
    steps:
      - run: npm test
```

**Explicit Dependency Versions**:
```json
// ❌ package.json
{
  "dependencies": {
    "express": "^4.18.0"  // ^ allows minor updates (4.19.0 might work locally, fail in CI)
  }
}

// ✅ package-lock.json
{
  "express": {
    "version": "4.18.2"  // Exact version
  }
}
```

**Reproduce CI Environment Locally**:
```bash
# Install act (run GitHub Actions locally)
brew install act

# Run workflow locally
act -j test
```

### 3. Out of Memory

**Symptom**: `FATAL ERROR: Ineffective mark-compacts near heap limit`

**Cause**: Node.js default heap size (1.7GB) too small

**Solution**:
```yaml
- name: Run tests
  run: NODE_OPTIONS="--max-old-space-size=4096" npm test
  # 4GB heap
```

**Or increase runner memory**:
```yaml
jobs:
  test:
    runs-on: ubuntu-latest-8-cores  # More memory
```

### 4. Network Timeout

**Symptom**: `Error: connect ETIMEDOUT`

**Solutions**:

**Increase Timeout**:
```yaml
- name: Install dependencies
  run: npm ci
  timeout-minutes: 15  # Default: 360 min (too long)
```

**Retry on Network Failure**:
```yaml
- name: Install with retry
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 5
    max_attempts: 3
    retry_on: error
    command: npm ci
```

**Use Mirrors (China, etc.)**:
```yaml
- run: npm config set registry https://registry.npmmirror.com
- run: npm ci
```

### 5. Permission Denied

**Symptom**: `Permission denied (publickey)`

**Cause**: SSH key not configured

**Solution (GitHub Actions)**:
```yaml
- name: Setup SSH
  uses: webfactory/ssh-agent@v0.7.0
  with:
    ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

- name: Clone private repo
  run: git clone git@github.com:myorg/private-repo.git
```

### Debugging Tools

### 1. SSH into Runner

**GitHub Actions (tmate)**:
```yaml
- name: Setup tmate session
  if: failure()
  uses: mxschmitt/action-tmate@v3
  timeout-minutes: 15
```

**When job fails, you get SSH access**:
```
SSH: ssh xyz@nyc1.tmate.io
```

**GitLab CI Debug Mode**:
```yaml
test:
  script:
    - echo "Running tests"
  variables:
    CI_DEBUG_TRACE: "true"  # Verbose output
```

### 2. Artifact Debugging

**Save Artifacts for Inspection**:
```yaml
- name: Run tests
  run: npm test
  continue-on-error: true

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: |
      test-results/
      screenshots/
      logs/
```

**Download and inspect locally**:
```bash
# GitHub CLI
gh run download <run-id>
```

### 3. Verbose Logging

**Enable Debug Logs**:
```yaml
# Repository Settings → Secrets → Actions
ACTIONS_STEP_DEBUG = true
ACTIONS_RUNNER_DEBUG = true
```

**Custom Debug Logging**:
```yaml
- name: Debug environment
  run: |
    echo "::debug::Node version: $(node --version)"
    echo "::debug::Current directory: $(pwd)"
    echo "::debug::Environment variables:"
    env | grep -v SECRET
```

### 4. Matrix Debugging

**Identify Which Matrix Job Failed**:
```yaml
strategy:
  matrix:
    node: [16, 18, 20]
    os: [ubuntu, windows, macos]
```

**Outputs**:
```
✅ node 16 / ubuntu
✅ node 16 / windows
❌ node 16 / macos  ← Only this failed
```

**Run Only Failed Configuration Locally**:
```bash
# Using act
act -j test --matrix node:16 --matrix os:macos
```

### Pipeline Health Monitoring

**Track Failure Rates**:
```yaml
- name: Record pipeline result
  if: always()
  run: |
    STATUS=${{ job.status }}
    curl -X POST https://metrics.example.com/pipeline_result \
      -d "status=$STATUS&repo=${{ github.repository }}"
```

**Alert on High Failure Rate**:
```promql
# Alert if >20% pipelines failing (last 24h)
(
  rate(pipeline_failures[24h]) /
  rate(pipeline_total[24h])
) > 0.2
```

---

## Mobile CI/CD

### iOS CI/CD

**Challenges**:
- **macOS Required**: Only builds on macOS
- **Code Signing**: Certificates, provisioning profiles
- **App Store Review**: 24-48 hour approval
- **TestFlight**: Beta distribution

### 1. Fastlane (Industry Standard)

**Install**:
```bash
sudo gem install fastlane
fastlane init
```

**Fastfile**:
```ruby
# ios/fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Run tests"
  lane :test do
    scan(
      workspace: "MyApp.xcworkspace",
      scheme: "MyApp",
      devices: ["iPhone 14"]
    )
  end

  desc "Build app"
  lane :build do
    increment_build_number(build_number: ENV['BUILD_NUMBER'])
    
    gym(
      workspace: "MyApp.xcworkspace",
      scheme: "MyApp",
      export_method: "app-store",
      clean: true
    )
  end

  desc "Deploy to TestFlight"
  lane :beta do
    build
    upload_to_testflight(
      skip_waiting_for_build_processing: true
    )
  end

  desc "Deploy to App Store"
  lane :release do
    build
    upload_to_app_store(
      submit_for_review: true,
      automatic_release: true,
      force: true
    )
  end
end
```

**GitHub Actions**:
```yaml
name: iOS CI/CD

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'
      
      - name: Install Fastlane
        run: |
          cd ios
          bundle install
      
      - name: Install CocoaPods
        run: |
          cd ios
          pod install
      
      - name: Run tests
        run: |
          cd ios
          fastlane test
      
      - name: Build & Deploy to TestFlight
        if: github.ref == 'refs/heads/main'
        env:
          FASTLANE_USER: ${{ secrets.APPLE_ID }}
          FASTLANE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD: ${{ secrets.APP_SPECIFIC_PASSWORD }}
        run: |
          cd ios
          fastlane beta
```

### 2. Code Signing (Certificates & Provisioning Profiles)

**Problem**: Need certificates to build iOS apps

**Manual Approach** (painful):
1. Create certificate in Apple Developer Portal
2. Download provisioning profile
3. Install on CI machine
4. Configure Xcode

**Automated with Fastlane Match**:
```bash
fastlane match init
```

**Matchfile**:
```ruby
git_url("https://github.com/myorg/certificates")
storage_mode("git")
type("appstore")

app_identifier([
  "com.example.myapp",
  "com.example.myapp.staging"
])

username("apple@example.com")
```

**Generate Certificates**:
```bash
fastlane match appstore
# Stores in private Git repo (encrypted)
```

**Use in CI**:
```yaml
- name: Setup code signing
  env:
    MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
    MATCH_GIT_BASIC_AUTHORIZATION: ${{ secrets.MATCH_GIT_AUTH }}
  run: |
    cd ios
    fastlane match appstore --readonly
```

### Android CI/CD

**Easier than iOS**: Builds on Linux, no Mac required

### 1. Gradle Build

**build.gradle**:
```groovy
android {
    defaultConfig {
        applicationId "com.example.myapp"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode System.getenv("BUILD_NUMBER")?.toInteger() ?: 1
        versionName "1.0.${System.getenv('BUILD_NUMBER') ?: '0'}"
    }
    
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_FILE") ?: "release.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**GitHub Actions**:
```yaml
name: Android CI/CD

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 11
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'temurin'
      
      - name: Cache Gradle
        uses: actions/cache@v3
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
      
      - name: Run tests
        run: ./gradlew test
      
      - name: Build release APK
        env:
          BUILD_NUMBER: ${{ github.run_number }}
          KEYSTORE_FILE: ${{ secrets.KEYSTORE_FILE }}
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > release.keystore
          ./gradlew assembleRelease
      
      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.SERVICE_ACCOUNT_JSON }}
          packageName: com.example.myapp
          releaseFiles: app/build/outputs/apk/release/app-release.apk
          track: internal  # internal, alpha, beta, production
          status: completed
```

### 2. Fastlane for Android

**Fastfile**:
```ruby
platform :android do
  desc "Run tests"
  lane :test do
    gradle(task: "test")
  end

  desc "Build release"
  lane :build do
    gradle(
      task: "assemble",
      build_type: "Release"
    )
  end

  desc "Deploy to Play Store (beta)"
  lane :beta do
    build
    upload_to_play_store(
      track: 'beta',
      aab: 'app/build/outputs/bundle/release/app-release.aab'
    )
  end

  desc "Deploy to Play Store (production)"
  lane :release do
    build
    upload_to_play_store(
      track: 'production',
      aab: 'app/build/outputs/bundle/release/app-release.aab'
    )
  end
end
```

### React Native CI/CD

**Build Both iOS & Android**:
```yaml
name: React Native CI/CD

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '11'
      - run: npm ci
      - run: cd android && ./gradlew assembleRelease
      - uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.SERVICE_ACCOUNT_JSON }}
          packageName: com.example.myapp
          releaseFiles: android/app/build/outputs/apk/release/*.apk
          track: beta

  ios:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: cd ios && pod install
      - run: cd ios && fastlane beta
        env:
          FASTLANE_USER: ${{ secrets.APPLE_ID }}
          FASTLANE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
```

### Mobile CI Best Practices

1. **Cache Everything**: Dependencies, Gradle, CocoaPods (builds are slow)
2. **Matrix Builds**: Test on multiple iOS versions, Android API levels
3. **Incremental Builds**: Only rebuild changed modules
4. **Emulator Testing**: Run tests on Android emulators in CI
5. **Screenshot Tests**: Visual regression testing
6. **Beta Distributions**: TestFlight (iOS), Internal Testing (Android)
7. **Versioning**: Auto-increment build numbers

---

## Advanced GitHub Actions

### 1. Composite Actions

**Problem**: Duplicate steps across workflows

**Solution**: Reusable composite action

**Create `.github/actions/setup-node-cache/action.yml`**:
```yaml
name: 'Setup Node with Cache'
description: 'Setup Node.js with dependency caching'

inputs:
  node-version:
    description: 'Node.js version'
    required: true
    default: '18'

runs:
  using: 'composite'
  steps:
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ inputs.node-version }}
    
    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: ~/.npm
        key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    
    - name: Install dependencies
      shell: bash
      run: npm ci
```

**Use in Workflow**:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ./.github/actions/setup-node-cache
        with:
          node-version: '18'
      - run: npm test
```

### 2. Reusable Workflows

**Centralize CI Logic**

**Create `.github/workflows/reusable-test.yml`**:
```yaml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
      environment:
        required: true
        type: string
    secrets:
      DATABASE_URL:
        required: true

jobs:
  test:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ inputs.node-version }}
      - run: npm ci
      - run: npm test
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Call from Another Workflow**:
```yaml
name: CI

on: [push]

jobs:
  test-staging:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '18'
      environment: 'staging'
    secrets:
      DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

  test-production:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '18'
      environment: 'production'
    secrets:
      DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
```

### 3. Dynamic Matrix

**Generate matrix from file**:

**matrix.json**:
```json
{
  "include": [
    { "node": "16", "os": "ubuntu-latest" },
    { "node": "18", "os": "ubuntu-latest" },
    { "node": "20", "os": "macos-latest" }
  ]
}
```

**Workflow**:
```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - uses: actions/checkout@v3
      - id: set-matrix
        run: echo "matrix=$(cat .github/matrix.json)" >> $GITHUB_OUTPUT

  test:
    needs: setup
    strategy:
      matrix: ${{ fromJson(needs.setup.outputs.matrix) }}
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node }}
      - run: npm test
```

### 4. Custom JavaScript Actions

**More powerful than composite actions**

**Create `.github/actions/slack-notify/action.yml`**:
```yaml
name: 'Slack Notification'
description: 'Send Slack notification'

inputs:
  webhook-url:
    description: 'Slack webhook URL'
    required: true
  message:
    description: 'Message to send'
    required: true

runs:
  using: 'node16'
  main: 'index.js'
```

**Create `.github/actions/slack-notify/index.js`**:
```javascript
const core = require('@actions/core');
const https = require('https');

async function run() {
  try {
    const webhookUrl = core.getInput('webhook-url');
    const message = core.getInput('message');

    const data = JSON.stringify({
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }
      ]
    });

    const url = new URL(webhookUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
    });

    req.on('error', (error) => {
      core.setFailed(error.message);
    });

    req.write(data);
    req.end();

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
```

**Use in Workflow**:
```yaml
- uses: ./.github/actions/slack-notify
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    message: '✅ Deployment successful!'
```

### 5. Self-Hosted Runners at Scale

**Auto-Scaling with Kubernetes**:
```yaml
# Install Actions Runner Controller
helm install arc \
  --namespace arc-systems \
  --create-namespace \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller

# Configure runner scale set
kubectl apply -f - <<EOF
apiVersion: actions.github.com/v1alpha1
kind: AutoscalingRunnerSet
metadata:
  name: github-runner-set
  namespace: arc-runners
spec:
  githubConfigUrl: "https://github.com/myorg/myrepo"
  githubConfigSecret: github-token
  minRunners: 1
  maxRunners: 10
  
  template:
    spec:
      containers:
      - name: runner
        image: ghcr.io/actions/actions-runner:latest
        resources:
          requests:
            cpu: "2"
            memory: "4Gi"
          limits:
            cpu: "4"
            memory: "8Gi"
EOF
```

**Runner Groups** (Enterprise):
```
Organization → Settings → Actions → Runner groups

Create "Production Runners" group:
- Only allow specific repos
- Require approval for new repos
```

**Workflow**:
```yaml
jobs:
  deploy:
    runs-on: [self-hosted, production]  # Use production runner group
```

### 6. Workflow Commands

**Set Outputs**:
```yaml
- name: Generate version
  id: version
  run: echo "version=$(date +%Y%m%d)" >> $GITHUB_OUTPUT

- name: Use output
  run: echo "Version: ${{ steps.version.outputs.version }}"
```

**Group Logs**:
```yaml
- run: |
    echo "::group::Installing dependencies"
    npm ci
    echo "::endgroup::"
    
    echo "::group::Running tests"
    npm test
    echo "::endgroup::"
```

**Annotations** (warnings/errors in UI):
```yaml
- run: |
    echo "::error file=app.js,line=10,col=15::Syntax error"
    echo "::warning file=README.md,line=5::Outdated documentation"
    echo "::notice::Deployment completed successfully"
```

### 7. Encrypted Secrets in Repository

**Organization-level secrets** (shared across repos):
```
Organization → Settings → Secrets and variables → Actions
```

**Environment-specific secrets**:
```
Repository → Settings → Environments → production → Secrets
```

**Use in workflow**:
```yaml
jobs:
  deploy:
    environment: production
    steps:
      - run: ./deploy.sh
        env:
          API_KEY: ${{ secrets.API_KEY }}  # Environment secret
          ORG_TOKEN: ${{ secrets.ORG_TOKEN }}  # Organization secret
```

---

## Pipeline Best Practices

### 1. DRY (Don't Repeat Yourself)

**❌ Bad**: Duplicate code in every workflow

**✅ Good**: Extract to reusable workflows or composite actions

**Before** (3 workflows with duplicate setup):
```yaml
# .github/workflows/test.yml
- uses: actions/checkout@v3
- uses: actions/setup-node@v3
- run: npm ci
- run: npm test

# .github/workflows/build.yml
- uses: actions/checkout@v3
- uses: actions/setup-node@v3
- run: npm ci
- run: npm build

# .github/workflows/deploy.yml
- uses: actions/checkout@v3
- uses: actions/setup-node@v3
- run: npm ci
- run: npm run deploy
```

**After** (reusable action):
```yaml
# .github/actions/setup/action.yml
- uses: actions/checkout@v3
- uses: actions/setup-node@v3
- run: npm ci

# All workflows use:
- uses: ./.github/actions/setup
- run: npm test  # or build, deploy, etc.
```

### 2. Fail Fast

**Stop pipeline early on failure**:
```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint  # Fast

  type-check:
    runs-on: ubuntu-latest
    steps:
      - run: npm run type-check  # Fast

  test:
    needs: [lint, type-check]  # Only run if lint & type-check pass
    runs-on: ubuntu-latest
    steps:
      - run: npm test  # Slow
```

**Cancel in-progress runs**:
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # Cancel old runs when new push
```

### 3. Secure Secrets

**✅ Use GitHub Secrets** (encrypted):
```yaml
- run: curl -H "Authorization: Bearer ${{ secrets.API_TOKEN }}"
```

**❌ Don't hardcode**:
```yaml
- run: curl -H "Authorization: Bearer abc123"  # Exposed in logs!
```

**Mask secrets in logs**:
```bash
# Automatically masked
echo ${{ secrets.PASSWORD }}  # Output: ***

# Manually mask
PASSWORD="secret123"
echo "::add-mask::$PASSWORD"
echo $PASSWORD  # Output: ***
```

### 4. Minimal Permissions

**Default** (too permissive):
```yaml
# Has write access to everything
```

**✅ Explicit permissions**:
```yaml
permissions:
  contents: read  # Only read code
  pull-requests: write  # Comment on PRs
  id-token: write  # For OIDC (AWS auth)
```

### 5. Pin Action Versions

**❌ Bad** (can break anytime):
```yaml
- uses: actions/checkout@main
```

**✅ Good** (immutable):
```yaml
- uses: actions/checkout@v3  # or @sha256abc123
```

### 6. Timeout Jobs

**Prevent infinite loops**:
```yaml
jobs:
  test:
    timeout-minutes: 10  # Kill after 10 min
```

**Step-level timeout**:
```yaml
- name: Install dependencies
  run: npm ci
  timeout-minutes: 5
```

### 7. Conditional Execution

**Skip redundant work**:
```yaml
on:
  pull_request:
    paths:
      - 'src/**'
      - 'tests/**'
    # Skip if only docs changed
```

**Or conditional steps**:
```yaml
- name: Deploy
  if: github.ref == 'refs/heads/main' && success()
  run: ./deploy.sh
```

### 8. Artifact Retention

**Don't waste storage**:
```yaml
- uses: actions/upload-artifact@v3
  with:
    name: build
    path: dist/
    retention-days: 7  # Delete after 7 days (default: 90)
```

### 9. Caching Strategy

**Layer caches** (most specific first):
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
      ${{ runner.os }}-
```

### 10. Notifications

**Alert on failures**:
```yaml
jobs:
  deploy:
    steps:
      - run: ./deploy.sh
      
      - name: Notify on failure
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"❌ Deployment failed!"}'
```

---

## Real-World Case Studies

### Case Study 1: Netflix – Spinnaker

**Problem**: Deploying thousands of microservices to production safely

**Solution**: Built Spinnaker (open-source CD platform)

**Architecture**:
```
GitHub → Jenkins → Spinnaker → AWS/GCP/Kubernetes
```

**Key Features**:
1. **Multi-Cloud**: Deploy to AWS, GCP, Azure simultaneously
2. **Deployment Strategies**: Blue-green, canary, rolling
3. **Automated Canary Analysis**: Uses metrics to auto-rollback
4. **Pipeline Templates**: Reusable deployment patterns
5. **Approval Gates**: Manual approval for production

**Example Pipeline**:
```json
{
  "stages": [
    {
      "type": "bake",
      "name": "Build AMI"
    },
    {
      "type": "deploy",
      "name": "Deploy to Canary (10%)",
      "clusters": [{
        "account": "prod",
        "strategy": "redblack",
        "scaleDown": false,
        "maxRemainingAsgs": 2
      }]
    },
    {
      "type": "canaryAnalysis",
      "name": "Analyze Canary Metrics",
      "duration": "PT30M",
      "metrics": ["errors", "latency"]
    },
    {
      "type": "deploy",
      "name": "Deploy to All (100%)"
    }
  ]
}
```

**Lessons**:
- Automated canary analysis reduces bad deployments
- Multi-cloud support requires abstraction layer
- Pipeline as code enables reusability

---

### Case Study 2: Spotify – Monorepo with Bazel

**Problem**: 2,000+ microservices in monorepo, slow builds

**Solution**: Bazel for incremental builds, only rebuild what changed

**Before**:
```
Every commit: Build all 2,000 services (2 hours)
```

**After** (with Bazel):
```
Every commit: Build only changed services (5 minutes)
```

**Bazel BUILD File**:
```python
# services/user-api/BUILD
go_binary(
    name = "user-api",
    srcs = ["main.go"],
    deps = [
        "//libs/auth:go_default_library",
        "//libs/database:go_default_library",
    ],
)

go_test(
    name = "user-api_test",
    srcs = ["main_test.go"],
    embed = [":user-api"],
)
```

**CI Pipeline**:
```bash
# Only test affected targets
bazel test $(bazel query 'tests(//...)')

# Only build changed services
bazel build //services/user-api:user-api
```

**Lessons**:
- Monorepos require smart build tools (Bazel, Nx, Turborepo)
- Caching is critical (remote cache, incremental builds)
- Dependency graph analysis = faster CI

---

### Case Study 3: Etsy – Continuous Deployment (50+ deploys/day)

**Problem**: Traditional deploy process took 4 hours, once per week

**Solution**: Continuous deployment with feature flags

**Architecture**:
```
Developer pushes → Tests pass → Auto-deploy to production (behind feature flag)
```

**Feature Flag System**:
```php
// Gradually roll out to users
if (FeatureFlag::isEnabled('new-checkout', $user)) {
    return new NewCheckoutPage();
} else {
    return new OldCheckoutPage();
}
```

**Deployment Process**:
1. Code merged to `main`
2. CI runs tests (10 minutes)
3. Auto-deploy to production (new code is **OFF** by default)
4. Gradually enable for 1% → 10% → 50% → 100% users
5. Monitor metrics, rollback if needed

**Metrics Monitored**:
- Error rate
- Latency (p50, p95, p99)
- Conversion rate
- Revenue per session

**Rollback**:
```bash
# Turn off feature flag (instant rollback)
feature-flag set new-checkout false
```

**Lessons**:
- Feature flags decouple deployment from release
- Gradual rollouts catch issues before 100% users affected
- Cultural shift: trust developers to deploy

---

### Case Study 4: Google – Monorepo (Piper) & Trunk-Based Development

**Scale**:
- 2 billion lines of code
- 40,000 commits/day
- 50,000 engineers

**Architecture**:
- Single monorepo (Piper)
- Trunk-based development (no long-lived branches)
- Every commit must pass tests before merge

**Presubmit Checks**:
```
1. Automated tests (affected tests only)
2. Code review (Critique)
3. Security scan
4. Performance regression test
5. Auto-merge if all pass
```

**Testing Strategy**:
- **Unit tests**: Run on every commit (100,000+ tests)
- **Integration tests**: Run nightly
- **Affected test selection**: Only run tests for changed code

**Deployment**:
- **Automated**: 50% of changes auto-deploy
- **Gradual rollout**: Canary → 10% → 50% → 100%
- **Rollback**: Revert commit, redeploy

**Lessons**:
- Monorepo scales with right tooling (Bazel, affected tests)
- Trunk-based development = faster feedback
- Automated testing at scale requires smart test selection

---

### Case Study 5: GitHub – Deploying GitHub.com (200+ deploys/day)

**Problem**: Coordinating deploys across 100+ engineers

**Solution**: ChatOps (Hubot) for deployments

**Deployment via Slack**:
```
Developer: @hubot deploy github/github to production
Hubot: 🚀 Deploying github/github@abc123 to production...
Hubot: ✅ Deployment successful! (2 minutes)
```

**Behind the Scenes**:
1. Hubot triggers GitHub Actions workflow
2. Build Docker image
3. Push to Kubernetes
4. Health check
5. Report back to Slack

**Rollback**:
```
Developer: @hubot rollback github/github
Hubot: ⏮ Rolling back to previous version...
Hubot: ✅ Rollback complete!
```

**Deployment Lock** (prevent conflicts):
```
Developer 1: @hubot deploy github/github
Hubot: 🔒 Deployment in progress by @alice

Developer 2: @hubot deploy github/github
Hubot: ❌ Deployment locked by @alice
```

**Lessons**:
- ChatOps provides visibility (everyone sees deploys)
- Deployment locks prevent conflicts
- Auditability (all deploys logged in Slack)

---

## Complete Production-Ready Pipeline

**Final Example: Full Stack App (Node.js + React + PostgreSQL)**

**`.github/workflows/cicd.yml`**:
```yaml
name: Complete CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Stage 1: Code Quality
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run prettier:check
      - run: npm run type-check

  # Stage 2: Security Scans
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@main
      
      - name: SAST scan
        run: |
          npm install -g @microsoft/eslint-plugin-sdl
          npm run lint:security

  # Stage 3: Tests
  test:
    runs-on: ubuntu-latest
    needs: [lint]
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
        run: npm run migrate
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  # Stage 4: Build
  build:
    runs-on: ubuntu-latest
    needs: [test, security]
    permissions:
      contents: read
      packages: write
    
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha,prefix={{branch}}-
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.meta.outputs.tags }}
          severity: 'CRITICAL,HIGH'

  # Stage 5: Deploy to Staging
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.example.com
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::123456789:role/GitHubActions
          aws-region: us-east-1
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster staging-cluster \
            --service myapp \
            --force-new-deployment
      
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster staging-cluster \
            --services myapp
      
      - name: Run smoke tests
        run: |
          curl -f https://staging.example.com/health || exit 1

  # Stage 6: Deploy to Production (with approval)
  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://example.com
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::123456789:role/GitHubActionsProduction
          aws-region: us-east-1
      
      - name: Blue-Green Deployment
        run: |
          # Deploy to "green" environment
          aws ecs update-service \
            --cluster prod-cluster \
            --service myapp-green \
            --force-new-deployment
          
          # Wait for green to be healthy
          aws ecs wait services-stable \
            --cluster prod-cluster \
            --services myapp-green
          
          # Run smoke tests on green
          curl -f https://green.example.com/health || exit 1
          
          # Switch traffic from blue to green
          aws elbv2 modify-listener \
            --listener-arn $LISTENER_ARN \
            --default-actions Type=forward,TargetGroupArn=$GREEN_TG_ARN
          
          # Wait 5 minutes, monitor metrics
          sleep 300
          
          # If metrics good, decommission blue
          # If metrics bad, rollback (switch back to blue)
      
      - name: Notify team
        if: always()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d "{\"text\":\"🚀 Deployed ${{ github.sha }} to production\"}"

  # Stage 7: Post-Deployment Checks
  post-deploy:
    runs-on: ubuntu-latest
    needs: deploy-production
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Run E2E tests
        run: |
          npx playwright test --config=playwright.prod.config.ts
      
      - name: Performance test
        run: |
          k6 run --vus 100 --duration 1m load-test.js
      
      - name: Check DORA metrics
        run: |
          # Record deployment
          curl -X POST https://metrics.example.com/deployment \
            -d "sha=${{ github.sha }}&time=$(date -Iseconds)"
```

**Dockerfile** (optimized):
```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Runtime
FROM node:18-alpine
WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/dist ./dist

USER nextjs
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

This complete pipeline includes:
- ✅ Linting & type checking
- ✅ Security scanning (Snyk, TruffleHog, SAST)
- ✅ Tests with coverage
- ✅ Docker build with caching
- ✅ Image scanning (Trivy)
- ✅ Staging deployment (automatic)
- ✅ Production deployment (manual approval)
- ✅ Blue-green deployment
- ✅ Smoke tests
- ✅ E2E tests
- ✅ Performance tests
- ✅ DORA metrics tracking
- ✅ Notifications

---

**You now have a truly exhaustive CI/CD guide covering everything from basics to expert-level implementations!** 🚀
