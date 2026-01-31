# Monitoring & Observability: Complete Production Guide

## Table of Contents
1. [Introduction & History](#introduction--history)
2. [Three Pillars of Observability](#three-pillars-of-observability)
3. [Metrics with Prometheus](#metrics-with-prometheus)
4. [Visualization with Grafana](#visualization-with-grafana)
5. [Logging with ELK Stack](#logging-with-elk-stack)
6. [Distributed Tracing](#distributed-tracing)
7. [Alerting](#alerting)
8. [SLIs, SLOs, SLAs](#slis-slos-slas)
9. [Production Best Practices](#production-best-practices)
10. [Hands-On Setup](#hands-on-setup)

---

## Introduction & History

### The Evolution of Monitoring

**1990s: Simple Monitoring**
- **Tools**: Nagios (1999), SNMP.
- **Method**: Poll servers, check if up/down.
- **Problem**: Binary (up/down), no deep insights.

**2000s: APM (Application Performance Monitoring)**
- **Tools**: New Relic, AppDynamics.
- **Innovation**: Application-level metrics.
- **Problem**: Expensive, proprietary.

**2012: Prometheus**
- **Origin**: SoundCloud (open-sourced).
- **Innovation**: Pull-based metrics, time-series database.
- **Impact**: CNCF standard for cloud-native monitoring.

**2014: Distributed Tracing**
- **Google Dapper** paper (2010) → **Zipkin** (2012), **Jaeger** (2015).
- **Problem**: Debugging microservices (which service is slow?).
- **Solution**: Trace requests across services.

**2015: Observability**
- **Coined by**: Charity Majors (Honeycomb).
- **Shift**: From "monitoring" to "observability".
- **Definition**: Ability to understand system internals from external outputs.

**Present: Unified Observability**
- **OpenTelemetry** (2019): Vendor-neutral standard.
- **Tools**: Grafana Loki, Tempo (logs + traces).
- **Trend**: Single pane of glass for metrics, logs, traces.

---

## Three Pillars of Observability

### 1. Metrics

**What**: Numeric measurements over time.

**Examples**:
```
- Request rate (requests/second)
- Error rate (%)
- Latency (ms)
- CPU usage (%)
- Memory usage (MB)
```

**Time-Series Data**:
```
Timestamp         | Metric            | Value
2024-01-01 10:00  | http_requests     | 1000
2024-01-01 10:01  | http_requests     | 1050
2024-01-01 10:02  | http_requests     | 1100
```

**Use**: High-level view, alerting, dashboards.

### 2. Logs

**What**: Discrete events with context.

**Examples**:
```
2024-01-01 10:15:32 INFO  User 123 logged in
2024-01-01 10:15:45 ERROR Database connection failed
2024-01-01 10:16:00 WARN  High memory usage: 85%
```

**Structured Logging** (JSON):
```json
{
  "timestamp": "2024-01-01T10:15:32Z",
  "level": "INFO",
  "message": "User logged in",
  "user_id": 123,
  "ip": "192.168.1.1"
}
```

**Use**: Debugging, audit trail, root cause analysis.

### 3. Traces

**What**: Request flow through distributed system.

**Example**:
```
HTTP Request → API Gateway → Auth Service → User Service → Database
              [20ms]          [5ms]          [30ms]         [15ms]

Total latency: 70ms
Bottleneck: User Service (30ms)
```

**Trace Structure**:
```
Trace ID: abc123
  Span 1: API Gateway (20ms)
    Span 2: Auth Service (5ms)
    Span 3: User Service (30ms)
      Span 4: Database (15ms)
```

**Use**: Debugging microservices, performance optimization.

---

## Metrics with Prometheus

### How Prometheus Works

**Pull-Based Model**:
```
┌─────────────┐
│ Application │ ← Scrapes metrics every 15s
│ :8080/metrics│
└─────────────┘
      ↑
      │ HTTP GET
      │
┌─────────────┐
│ Prometheus  │
│ Server      │
└─────────────┘
```

**vs Push-Based** (StatsD, Graphite):
```
┌─────────────┐
│ Application │ → Pushes metrics
└─────────────┘
      ↓
┌─────────────┐
│ Collector   │
└─────────────┘
```

### Metric Types

**1. Counter**: Only increases
```
Example: Total HTTP requests
Usage: Rate of change (requests/second)
```

**2. Gauge**: Can go up or down
```
Example: Current memory usage
Usage: Current value
```

**3. Histogram**: Observations in buckets
```
Example: Request latency
Buckets: < 10ms, < 50ms, < 100ms, < 500ms
Usage: Percentiles (p50, p95, p99)
```

**4. Summary**: Like histogram, calculated client-side
```
Example: Request latency quantiles
Usage: Pre-calculated percentiles
```

### Instrumenting Application (Go)

```go
package main

import (
	"net/http"
	"time"
	
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	// Counter: Total requests
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)
	
	// Histogram: Request latency
	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request latency",
			Buckets: prometheus.DefBuckets,  // Default: 0.005, 0.01, 0.025, 0.05, ...
		},
		[]string{"method", "endpoint"},
	)
	
	// Gauge: Active requests
	httpActiveRequests = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "http_active_requests",
			Help: "Number of active HTTP requests",
		},
	)
)

func init() {
	// Register metrics
	prometheus.MustRegister(httpRequestsTotal)
	prometheus.MustRegister(httpRequestDuration)
	prometheus.MustRegister(httpActiveRequests)
}

func instrumentHandler(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Increment active requests
		httpActiveRequests.Inc()
		defer httpActiveRequests.Dec()
		
		// Call handler
		next(w, r)
		
		// Record metrics
		duration := time.Since(start).Seconds()
		httpRequestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
		httpRequestsTotal.WithLabelValues(r.Method, r.URL.Path, "200").Inc()
	}
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
	// Simulate work
	time.Sleep(100 * time.Millisecond)
	w.Write([]byte("Hello, World!"))
}

func main() {
	http.HandleFunc("/hello", instrumentHandler(helloHandler))
	http.Handle("/metrics", promhttp.Handler())  // Expose metrics
	
	http.ListenAndServe(":8080", nil)
}
```

### Prometheus Configuration

**prometheus.yml**:
```yaml
global:
  scrape_interval: 15s  # Scrape every 15 seconds
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'myapp'
    static_configs:
      - targets: ['localhost:8080']
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']  # System metrics
```

### PromQL Queries

```promql
# Request rate (requests per second)
rate(http_requests_total[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Active requests
http_active_requests

# CPU usage
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

### Prometheus Setup with Docker

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
  
  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"

volumes:
  prometheus-data:
```

```bash
docker-compose up -d
# Access: http://localhost:9090
```

---

## Visualization with Grafana

### Grafana Setup

**docker-compose.yml** (add to above):
```yaml
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  grafana-data:
```

```bash
docker-compose up -d
# Access: http://localhost:3000 (admin/admin)
```

### Creating Dashboard

**1. Add Data Source**:
```
Configuration → Data Sources → Add Prometheus
URL: http://prometheus:9090
Save & Test
```

**2. Create Panel**:
```
Dashboard → Add Panel → Add Query
Query: rate(http_requests_total[5m])
Visualization: Graph
```

**3. Common Panels**:

**Request Rate**:
```promql
sum(rate(http_requests_total[5m])) by (endpoint)
```

**Error Rate**:
```promql
sum(rate(http_requests_total{status=~"5.."}[5m])) /
sum(rate(http_requests_total[5m]))
```

**Latency Percentiles**:
```promql
histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

**CPU Usage**:
```promql
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

**Memory Usage**:
```promql
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) /
node_memory_MemTotal_bytes * 100
```

---

## Logging with ELK Stack

### ELK Components

**E**lasticsearch: Store logs  
**L**ogstash / **F**luentd / **F**ilebeat: Collect logs  
**K**ibana: Visualize logs

### Architecture

```
Application → Filebeat → Elasticsearch → Kibana
              (collect)   (store)        (visualize)
```

### Setup with Docker

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data
  
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
  
  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    volumes:
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml
      - /var/log:/var/log:ro
    depends_on:
      - elasticsearch

volumes:
  es-data:
```

**filebeat.yml**:
```yaml
filebeat.inputs:
  - type: log
    paths:
      - /var/log/app/*.log
    fields:
      app: myapp
    json.keys_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

### Structured Logging (Python)

```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add extra fields
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)

# Setup logger
logger = logging.getLogger('myapp')
logger.setLevel(logging.INFO)

handler = logging.FileHandler('/var/log/app/myapp.log')
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)

# Usage
logger.info('User logged in', extra={'user_id': 123})
logger.error('Database error', exc_info=True)
```

**Output**:
```json
{"timestamp": "2024-01-01T10:15:32", "level": "INFO", "logger": "myapp", "message": "User logged in", "module": "main", "function": "login", "line": 45, "user_id": 123}
```

---

## Distributed Tracing

### Jaeger Setup

**docker-compose.yml** (add):
```yaml
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "6831:6831/udp"  # Agent
      - "16686:16686"    # UI
    environment:
      - COLLECTOR_ZIPKIN_HTTP_PORT=9411
```

### Instrumenting Application (Go)

```go
package main

import (
	"context"
	"io"
	"log"
	"net/http"
	"time"
	
	"github.com/opentracing/opentracing-go"
	"github.com/uber/jaeger-client-go"
	"github.com/uber/jaeger-client-go/config"
)

func initTracer() (opentracing.Tracer, io.Closer) {
	cfg := config.Configuration{
		ServiceName: "myapp",
		Sampler: &config.SamplerConfig{
			Type:  jaeger.SamplerTypeConst,
			Param: 1,  // Sample all traces
		},
		Reporter: &config.ReporterConfig{
			LocalAgentHostPort: "localhost:6831",
		},
	}
	
	tracer, closer, err := cfg.NewTracer()
	if err != nil {
		log.Fatal(err)
	}
	
	return tracer, closer
}

func handleRequest(w http.ResponseWriter, r *http.Request) {
	// Start span
	span := opentracing.StartSpan("handle_request")
	defer span.Finish()
	
	ctx := opentracing.ContextWithSpan(context.Background(), span)
	
	// Call downstream service
	callUserService(ctx)
	callPaymentService(ctx)
	
	w.Write([]byte("Request processed"))
}

func callUserService(ctx context.Context) {
	// Create child span
	span, _ := opentracing.StartSpanFromContext(ctx, "call_user_service")
	defer span.Finish()
	
	// Simulate work
	time.Sleep(30 * time.Millisecond)
	
	// Add tags
	span.SetTag("user_id", 123)
	span.SetTag("cache_hit", false)
}

func callPaymentService(ctx context.Context) {
	span, _ := opentracing.StartSpanFromContext(ctx, "call_payment_service")
	defer span.Finish()
	
	time.Sleep(50 * time.Millisecond)
	
	span.SetTag("amount", 99.99)
	span.SetTag("currency", "USD")
}

func main() {
	tracer, closer := initTracer()
	defer closer.Close()
	opentracing.SetGlobalTracer(tracer)
	
	http.HandleFunc("/", handleRequest)
	http.ListenAndServe(":8080", nil)
}
```

**Access Jaeger UI**: http://localhost:16686

---

## SLIs, SLOs, SLAs

### Definitions

**SLI (Service Level Indicator)**: Metric measuring service level.
```
Examples:
- Availability: % of successful requests
- Latency: % of requests < 100ms
- Error rate: % of failed requests
```

**SLO (Service Level Objective)**: Target for SLI.
```
Examples:
- 99.9% availability
- 95% of requests < 100ms
- < 0.1% error rate
```

**SLA (Service Level Agreement)**: Contract with customers.
```
Example:
- Guarantee 99.9% uptime
- Financial penalty if violated
```

### Error Budget

**Concept**: Amount of allowed downtime.

```
SLO: 99.9% availability
Error budget: 100% - 99.9% = 0.1%

Monthly downtime allowed:
30 days × 24 hours × 60 min × 0.1% = 43.2 minutes

If error budget exhausted:
- Freeze feature releases
- Focus on reliability
```

---

## Hands-On: Complete Observability Setup

**Full docker-compose.yml**:
```yaml
version: '3.8'

services:
  # Application
  app:
    build: .
    ports:
      - "8080:8080"
  
  # Metrics
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
  
  # Logs
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
  
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
  
  # Tracing
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "6831:6831/udp"
      - "16686:16686"
```

**Access**:
- App: http://localhost:8080
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Kibana: http://localhost:5601
- Jaeger: http://localhost:16686

---

This comprehensive guide covers complete observability with Prometheus, Grafana, ELK, and Jaeger. Continuing with more files.
