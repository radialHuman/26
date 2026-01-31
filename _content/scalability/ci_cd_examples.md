# CI/CD & Release Engineering

This document provides practical CI/CD pipeline examples, deployment strategies, and artifact management guidance for backend services.

---

## Pipeline Stages (typical)
1. **Build:** Compile or prepare artifacts (binaries, wheels, Docker images).
2. **Test:** Run unit, integration, and end-to-end tests.
3. **Package:** Build deliverables (docker images, tarballs).
4. **Publish:** Push artifacts to registries (Docker Hub, ECR, GCR) or package repositories.
5. **Deploy:** Deploy to environments (staging, production) with strategies.
6. **Monitor & Rollback:** Verify deployment health and provide rollback steps.

---

## GitHub Actions Example (Simple)
```yaml
name: CI
on: [push, pull_request]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: pytest -q
      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .
      - name: Push Docker image
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - run: docker push myapp:${{ github.sha }}
```

---

## GitLab CI Example (Simple)
```yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - docker build -t myapp:$CI_COMMIT_SHA .
  artifacts:
    paths:
      - dist/

test:
  stage: test
  script:
    - pytest

deploy:
  stage: deploy
  script:
    - ./deploy.sh $CI_COMMIT_SHA
  when: manual
```

---

## Deployment Strategies
- **Rolling Update:** Gradually replace old instances with new ones.
- **Blue/Green:** Deploy new version to parallel environment, switch traffic when ready.
- **Canary:** Route a small percentage of traffic to new version, increase if healthy.
- **A/B Testing:** Route different user segments to different versions.

When to use:
- Use **canary** for incremental risk reduction during feature rollouts.
- Use **blue/green** for rapid rollback and zero-downtime swap.
- Use **rolling updates** for normal deployments.

---

## Artifact Management
- Store built images in a registry (ECR, GCR, Docker Hub).
- For Python packages, use PyPI or an internal package index (Artifactory).
- Tag images with semantic tags and commit SHAs.

---

## Promotion Flow
- Build in CI -> publish artifact -> deploy to staging -> smoke tests -> promote artifact -> deploy to production.

---

## Secure CI Best Practices
- Store secrets in the CI secret store, not in repo.
- Limit token scopes and rotate regularly.
- Scan images and dependencies for vulnerabilities.

---

## Example: Canary Deployment with Kubernetes
- Use labels and services to route a percent of traffic to the canary.
- Use automated analysis (metrics + SLO) to promote or rollback.

---

CI/CD pipelines automate delivery and reduce human error. Start with a simple pipeline and iterate with more automation, safety checks, and monitoring.