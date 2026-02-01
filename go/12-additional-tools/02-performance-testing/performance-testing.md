# Performance Testing for Go Applications

## Load Testing with Vegeta

### Basic Load Test
```go
package loadtest

import (
    "fmt"
    "time"
    
    vegeta "github.com/tsenart/vegeta/v12/lib"
)

func RunLoadTest(target string, duration time.Duration, rate int) {
    targeter := vegeta.NewStaticTargeter(vegeta.Target{
        Method: "GET",
        URL:    target,
    })
    
    attacker := vegeta.NewAttacker()
    
    var metrics vegeta.Metrics
    for res := range attacker.Attack(targeter, vegeta.Rate{Freq: rate, Per: time.Second}, duration, "Load Test") {
        metrics.Add(res)
    }
    metrics.Close()
    
    fmt.Printf("99th percentile: %s\n", metrics.Latencies.P99)
    fmt.Printf("Success rate: %.2f%%\n", metrics.Success*100)
    fmt.Printf("Total requests: %d\n", metrics.Requests)
}
```

### Advanced Vegeta Script
```bash
# targets.txt
GET http://localhost:8080/api/users
Content-Type: application/json

POST http://localhost:8080/api/users
Content-Type: application/json
@body.json

# Run test
echo "GET http://localhost:8080/health" | vegeta attack -duration=30s -rate=100 | vegeta report
```

## Benchmarking

### HTTP Endpoint Benchmark
```go
package benchmark

import (
    "net/http"
    "net/http/httptest"
    "testing"
)

func BenchmarkGetUsers(b *testing.B) {
    server := setupTestServer()
    
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        req := httptest.NewRequest(http.MethodGet, "/users", nil)
        w := httptest.NewRecorder()
        server.ServeHTTP(w, req)
    }
}

func BenchmarkCreateUser(b *testing.B) {
    server := setupTestServer()
    body := `{"email":"test@example.com","username":"testuser"}`
    
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(body))
        w := httptest.NewRecorder()
        server.ServeHTTP(w, req)
    }
}
```

## k6 Load Testing

```javascript
// script.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'], // 99% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
  },
};

export default function () {
  const res = http.get('http://localhost:8080/api/users');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}
```

## Summary
Performance testing with Vegeta, k6, and Go benchmarks helps identify bottlenecks, measure throughput, and ensure systems can handle expected load.
