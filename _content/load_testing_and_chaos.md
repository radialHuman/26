# Load Testing and Chaos Engineering

Load testing and chaos engineering help validate system behavior under stress and failures. This chapter covers tools and examples using k6, Locust, and basic chaos experiments.

---

## k6 Example
- k6 is a JS-based load testing tool.
```javascript
import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
  http.get('http://localhost:8080/')
  sleep(1)
}
```
- Run: `k6 run script.js`

---

## Locust Example
```python
from locust import HttpUser, task

class MyUser(HttpUser):
    @task
    def index(self):
        self.client.get('/')
```
- Run: `locust -f locustfile.py`

---

## Chaos Engineering Basics
- Introduce failures (network latency, process kill, CPU spike) in controlled experiments.
- Tools: Chaos Mesh, LitmusChaos, or simple scripts for local experiments.

---

## Stress Testing Tips
- Start small, increase load gradually.
- Monitor system metrics: CPU, memory, latency, error rate.
- Identify bottlenecks and iterate.

---

Load testing and chaos engineering build confidence in system resilience.