# Practical Examples: Python and Go Apps in Kubernetes

## PYTHON EXAMPLE - Complete Flask Application

### Step 1: Python Application (app.py)

```python
import os
import json
import logging
from datetime import datetime
from functools import wraps

from flask import Flask, jsonify, request, g
import psycopg2
import redis

# ============================================================================
# Configuration from Environment
# ============================================================================
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost/myapp')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
API_KEY = os.getenv('API_KEY', 'default-key-change-me')
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

# ============================================================================
# Logging - JSON format for log aggregation
# ============================================================================
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_dict = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'environment': ENVIRONMENT,
        }
        
        # Add request info if available
        if hasattr(g, 'request_id'):
            log_dict['request_id'] = g.request_id
        
        # Add exception info if present
        if record.exc_info:
            log_dict['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_dict)

handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger = logging.getLogger()
logger.addHandler(handler)
logger.setLevel(getattr(logging, LOG_LEVEL))

# ============================================================================
# Flask App
# ============================================================================
app = Flask(__name__)

# ============================================================================
# Database Connection Pool
# ============================================================================
db_pool = None

def get_db():
    """Get database connection from pool"""
    if 'db' not in g:
        try:
            g.db = psycopg2.connect(DATABASE_URL)
            g.db.autocommit = True
        except psycopg2.Error as e:
            logger.error(f"Database connection failed: {e}")
            raise
    return g.db

# ============================================================================
# Redis Cache
# ============================================================================
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    logger.info("Redis cache connected")
except redis.ConnectionError as e:
    logger.error(f"Redis connection failed: {e}")
    redis_client = None

def cache_key(namespace, *args):
    """Generate cache key"""
    return f"{namespace}:{':'.join(str(arg) for arg in args)}"

def cached(timeout=3600):
    """Decorator for caching"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not redis_client:
                return f(*args, **kwargs)
            
            key = cache_key(f.__name__, *args, *kwargs.values())
            
            # Try to get from cache
            result = redis_client.get(key)
            if result:
                logger.debug(f"Cache hit: {key}")
                return json.loads(result)
            
            # Not in cache, call function
            result = f(*args, **kwargs)
            
            # Store in cache
            try:
                redis_client.setex(key, timeout, json.dumps(result))
            except redis.Error as e:
                logger.error(f"Cache write failed: {e}")
            
            return result
        
        return decorated_function
    return decorator

# ============================================================================
# Middleware
# ============================================================================
@app.before_request
def before_request():
    """Called before each request"""
    # Generate request ID
    g.request_id = request.headers.get('X-Request-ID', 
                                      f"{datetime.utcnow().timestamp()}")
    g.start_time = datetime.utcnow()
    
    logger.info(f"Request: {request.method} {request.path}")

@app.after_request
def after_request(response):
    """Called after each request"""
    duration = (datetime.utcnow() - g.start_time).total_seconds()
    
    logger.info(f"Response: {response.status_code} (duration: {duration:.3f}s)")
    
    return response

@app.teardown_appcontext
def close_connection(exception):
    """Clean up after request"""
    db = getattr(g, 'db', None)
    if db is not None:
        db.close()

# ============================================================================
# Authentication
# ============================================================================
def require_api_key(f):
    """Decorator to require API key"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        key = request.headers.get('X-API-Key')
        
        if not key:
            logger.warning("Missing API key")
            return jsonify({'error': 'Missing X-API-Key header'}), 401
        
        if key != API_KEY:
            logger.warning(f"Invalid API key: {key[:10]}...")
            return jsonify({'error': 'Invalid API key'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

# ============================================================================
# Health Check Endpoints
# ============================================================================
@app.route('/health', methods=['GET'])
def health():
    """
    Kubernetes liveness probe
    Returns 200 if app is running
    """
    try:
        return jsonify({'status': 'alive', 'timestamp': datetime.utcnow().isoformat()}), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 503

@app.route('/ready', methods=['GET'])
def readiness():
    """
    Kubernetes readiness probe
    Returns 200 if app is ready to serve traffic
    Checks all dependencies
    """
    issues = []
    
    # Check database
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT 1')
        cursor.close()
    except Exception as e:
        logger.error(f"Database check failed: {e}")
        issues.append(f"database: {str(e)}")
    
    # Check cache
    if redis_client:
        try:
            redis_client.ping()
        except Exception as e:
            logger.error(f"Cache check failed: {e}")
            issues.append(f"cache: {str(e)}")
    
    if issues:
        return jsonify({
            'status': 'not_ready',
            'issues': issues
        }), 503
    
    return jsonify({'status': 'ready'}), 200

@app.route('/startup', methods=['GET'])
def startup():
    """
    Kubernetes startup probe (if app takes time to initialize)
    """
    # Add any initialization checks here
    return jsonify({'status': 'started'}), 200

# ============================================================================
# Metrics Endpoint
# ============================================================================
@app.route('/metrics', methods=['GET'])
def metrics():
    """
    Prometheus metrics endpoint
    Used by monitoring systems
    """
    try:
        # Get pod info from environment
        pod_name = os.getenv('POD_NAME', 'unknown')
        pod_namespace = os.getenv('POD_NAMESPACE', 'unknown')
        node_name = os.getenv('NODE_NAME', 'unknown')
        
        return f"""# HELP app_info Application info
# TYPE app_info gauge
app_info{{pod="{pod_name}",namespace="{pod_namespace}",node="{node_name}",version="1.0"}} 1

# HELP python_app_requests_total Total HTTP requests
# TYPE python_app_requests_total counter
python_app_requests_total 0

# HELP python_app_request_duration_seconds HTTP request duration
# TYPE python_app_request_duration_seconds histogram
python_app_request_duration_seconds_bucket{{le="0.1"}} 0
python_app_request_duration_seconds_bucket{{le="0.5"}} 0
python_app_request_duration_seconds_bucket{{le="1.0"}} 0
python_app_request_duration_seconds_bucket{{le="5.0"}} 0
python_app_request_duration_seconds_bucket{{le="+Inf"}} 0
python_app_request_duration_seconds_sum 0
python_app_request_duration_seconds_count 0
""", 200
    except Exception as e:
        logger.error(f"Metrics endpoint error: {e}")
        return f"# Error: {str(e)}", 503

# ============================================================================
# API Endpoints
# ============================================================================

@app.route('/api/users', methods=['GET'])
def get_users():
    """
    Get all users from database
    """
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
            SELECT id, name, email, created_at 
            FROM users 
            LIMIT 100
        ''')
        
        columns = [desc[0] for desc in cursor.description]
        users = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        
        return jsonify({
            'status': 'success',
            'count': len(users),
            'data': users
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/users/<int:user_id>', methods=['GET'])
@cached(timeout=1800)  # Cache for 30 minutes
def get_user(user_id):
    """
    Get specific user by ID
    Cached in Redis
    """
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
            SELECT id, name, email, created_at 
            FROM users 
            WHERE id = %s
        ''', (user_id,))
        
        row = cursor.fetchone()
        cursor.close()
        
        if not row:
            return jsonify({'error': 'User not found'}), 404
        
        columns = [desc[0] for desc in cursor.description]
        user = dict(zip(columns, row))
        
        return jsonify({
            'status': 'success',
            'data': user
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/users', methods=['POST'])
@require_api_key
def create_user():
    """
    Create new user
    Requires API key
    """
    try:
        data = request.get_json()
        
        # Validation
        if not data.get('name') or not data.get('email'):
            return jsonify({'error': 'Missing name or email'}), 400
        
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
            INSERT INTO users (name, email, created_at)
            VALUES (%s, %s, NOW())
            RETURNING id, name, email, created_at
        ''', (data['name'], data['email']))
        
        row = cursor.fetchone()
        columns = [desc[0] for desc in cursor.description]
        user = dict(zip(columns, row))
        cursor.close()
        
        # Invalidate cache
        if redis_client:
            try:
                redis_client.delete(cache_key('get_users'))
            except redis.Error as e:
                logger.warning(f"Cache invalidation failed: {e}")
        
        return jsonify({
            'status': 'success',
            'data': user
        }), 201
    
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/status', methods=['GET'])
def status():
    """
    Get application status
    """
    return jsonify({
        'status': 'running',
        'environment': ENVIRONMENT,
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

# ============================================================================
# Error Handlers
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# Main
# ============================================================================

if __name__ == '__main__':
    logger.info(f"Starting Flask app (environment: {ENVIRONMENT})")
    
    # Log configuration (don't log secrets)
    logger.info(f"Database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'unknown'}")
    logger.info(f"Redis: {REDIS_URL}")
    logger.info(f"Log level: {LOG_LEVEL}")
    
    # Run Flask
    # Note: In production, don't use Flask's built-in server
    # Use Gunicorn, uWSGI, etc.
    app.run(
        host='0.0.0.0',
        port=3000,
        debug=(ENVIRONMENT == 'development'),
        use_reloader=False  # Important for containerized app
    )
```

### Step 2: requirements.txt

```
Flask==2.3.0
psycopg2-binary==2.9.0
redis==4.5.0
gunicorn==20.1.0
```

### Step 3: Dockerfile

```dockerfile
# Multi-stage build for smaller image

# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /tmp
COPY requirements.txt .

# Install dependencies to /tmp/python-packages
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Copy only what we need from builder
COPY --from=builder /root/.local /root/.local
COPY app.py .

# Set environment
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 3000

# Health check (backup to Kubernetes probes)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:3000/health')"

# Run with gunicorn (production server)
CMD ["gunicorn", "--bind", "0.0.0.0:3000", "--workers", "4", "--worker-class", "sync", "app:app"]
```

### Step 4: Build and Push

```bash
# Build
docker build -t myregistry/python-app:1.0 .

# Push
docker push myregistry/python-app:1.0

# Test locally
docker run -p 3000:3000 \
  -e LOG_LEVEL=DEBUG \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  myregistry/python-app:1.0
```

### Step 5: Kubernetes Deployment

```yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: production

---
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: production
type: Opaque
stringData:
  db-url: "postgresql://appuser:password@postgres:5432/myapp"
  db-password: "password"

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  LOG_LEVEL: "INFO"
  ENVIRONMENT: "production"
  API_KEY: "your-api-key-here"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-app
  namespace: production
spec:
  replicas: 3
  
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  
  selector:
    matchLabels:
      app: python-app
  
  template:
    metadata:
      labels:
        app: python-app
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      
      containers:
      - name: app
        image: myregistry/python-app:1.0
        imagePullPolicy: IfNotPresent
        
        ports:
        - name: http
          containerPort: 3000
          protocol: TCP
        
        envFrom:
        - configMapRef:
            name: app-config
        
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: db-url
        
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sleep", "15"]
        
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL

---
apiVersion: v1
kind: Service
metadata:
  name: python-app
  namespace: production
spec:
  type: ClusterIP
  ports:
  - name: http
    port: 80
    targetPort: 3000
  selector:
    app: python-app

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: python-app-ingress
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.example.com
    secretName: python-app-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: python-app
            port:
              number: 80
```

---

## GO EXAMPLE - Complete REST API

### Step 1: Go Application (main.go)

```go
package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

// ============================================================================
// Configuration
// ============================================================================
var (
	databaseURL = os.Getenv("DATABASE_URL")
	redisURL    = os.Getenv("REDIS_URL")
	logLevel    = os.Getenv("LOG_LEVEL")
	apiKey      = os.Getenv("API_KEY")
	environment = os.Getenv("ENVIRONMENT")
	port        = os.Getenv("PORT")
)

// ============================================================================
// Types
// ============================================================================
type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

type Response struct {
	Status string      `json:"status"`
	Data   interface{} `json:"data,omitempty"`
	Error  string      `json:"error,omitempty"`
}

type AppContext struct {
	db  *sql.DB
	rdb *redis.Client
}

// ============================================================================
// Logger
// ============================================================================
func logInfo(msg string, fields ...interface{}) {
	data := map[string]interface{}{
		"timestamp":   time.Now().UTC(),
		"level":       "INFO",
		"message":     msg,
		"environment": environment,
	}
	for i := 0; i < len(fields); i += 2 {
		if i+1 < len(fields) {
			data[fields[i].(string)] = fields[i+1]
		}
	}
	b, _ := json.Marshal(data)
	log.Println(string(b))
}

func logError(msg string, fields ...interface{}) {
	data := map[string]interface{}{
		"timestamp":   time.Now().UTC(),
		"level":       "ERROR",
		"message":     msg,
		"environment": environment,
	}
	for i := 0; i < len(fields); i += 2 {
		if i+1 < len(fields) {
			data[fields[i].(string)] = fields[i+1]
		}
	}
	b, _ := json.Marshal(data)
	log.Println(string(b))
}

// ============================================================================
// Middleware
// ============================================================================
func requireAPIKey(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		key := r.Header.Get("X-API-Key")
		if key == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(Response{Status: "error", Error: "Missing X-API-Key header"})
			return
		}
		if key != apiKey {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(Response{Status: "error", Error: "Invalid API key"})
			return
		}
		next(w, r)
	}
}

func respondJSON(w http.ResponseWriter, status int, resp Response) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

// ============================================================================
// Health Checks
// ============================================================================
func (ac *AppContext) healthHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, Response{
		Status: "alive",
		Data: map[string]string{
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func (ac *AppContext) readyHandler(w http.ResponseWriter, r *http.Request) {
	var issues []string

	// Check database
	if err := ac.db.Ping(); err != nil {
		logError("Database check failed", "error", err.Error())
		issues = append(issues, fmt.Sprintf("database: %v", err))
	}

	// Check Redis
	if ac.rdb != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		if err := ac.rdb.Ping(ctx).Err(); err != nil {
			logError("Redis check failed", "error", err.Error())
			issues = append(issues, fmt.Sprintf("cache: %v", err))
		}
		cancel()
	}

	if len(issues) > 0 {
		respondJSON(w, http.StatusServiceUnavailable, Response{
			Status: "not_ready",
			Data: map[string]interface{}{
				"issues": issues,
			},
		})
		return
	}

	respondJSON(w, http.StatusOK, Response{
		Status: "ready",
	})
}

// ============================================================================
// Metrics
// ============================================================================
func (ac *AppContext) metricsHandler(w http.ResponseWriter, r *http.Request) {
	podName := os.Getenv("POD_NAME")
	podNamespace := os.Getenv("POD_NAMESPACE")
	nodeName := os.Getenv("NODE_NAME")

	metrics := fmt.Sprintf(`# HELP app_info Application info
# TYPE app_info gauge
app_info{pod="%s",namespace="%s",node="%s",version="1.0"} 1

# HELP app_requests_total Total HTTP requests
# TYPE app_requests_total counter
app_requests_total 0

# HELP app_request_duration_seconds HTTP request duration
# TYPE app_request_duration_seconds histogram
app_request_duration_seconds_bucket{le="0.1"} 0
app_request_duration_seconds_bucket{le="0.5"} 0
app_request_duration_seconds_bucket{le="1.0"} 0
app_request_duration_seconds_bucket{le="+Inf"} 0
`,
		podName, podNamespace, nodeName)

	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, metrics)
}

// ============================================================================
// API Handlers
// ============================================================================
func (ac *AppContext) getUsersHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := ac.db.Query("SELECT id, name, email, created_at FROM users LIMIT 100")
	if err != nil {
		logError("Query failed", "error", err.Error())
		respondJSON(w, http.StatusInternalServerError, Response{
			Status: "error",
			Error:  err.Error(),
		})
		return
	}
	defer rows.Close()

	users := []User{}
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt); err != nil {
			logError("Scan failed", "error", err.Error())
			respondJSON(w, http.StatusInternalServerError, Response{
				Status: "error",
				Error:  err.Error(),
			})
			return
		}
		users = append(users, u)
	}

	respondJSON(w, http.StatusOK, Response{
		Status: "success",
		Data: map[string]interface{}{
			"count": len(users),
			"users": users,
		},
	})
}

func (ac *AppContext) createUserHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{
			Status: "error",
			Error:  "Invalid request body",
		})
		return
	}

	if user.Name == "" || user.Email == "" {
		respondJSON(w, http.StatusBadRequest, Response{
			Status: "error",
			Error:  "Missing name or email",
		})
		return
	}

	err := ac.db.QueryRow(
		"INSERT INTO users (name, email, created_at) VALUES ($1, $2, NOW()) RETURNING id, created_at",
		user.Name, user.Email,
	).Scan(&user.ID, &user.CreatedAt)

	if err != nil {
		logError("Insert failed", "error", err.Error())
		respondJSON(w, http.StatusInternalServerError, Response{
			Status: "error",
			Error:  err.Error(),
		})
		return
	}

	respondJSON(w, http.StatusCreated, Response{
		Status: "success",
		Data:   user,
	})
}

func (ac *AppContext) statusHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, Response{
		Status: "success",
		Data: map[string]string{
			"status":      "running",
			"environment": environment,
			"version":     "1.0.0",
			"timestamp":   time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// ============================================================================
// Main
// ============================================================================
func main() {
	if port == "" {
		port = "3000"
	}

	logInfo("Starting Go app", "environment", environment, "port", port)

	// Connect to database
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		logError("Failed to connect to database", "error", err.Error())
		os.Exit(1)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		logError("Database ping failed", "error", err.Error())
		os.Exit(1)
	}

	logInfo("Connected to database")

	// Connect to Redis
	var rdb *redis.Client
	if redisURL != "" {
		opt, err := redis.ParseURL(redisURL)
		if err != nil {
			logError("Failed to parse Redis URL", "error", err.Error())
		} else {
			rdb = redis.NewClient(opt)
			if err := rdb.Ping(context.Background()).Err(); err != nil {
				logError("Redis connection failed", "error", err.Error())
			} else {
				logInfo("Connected to Redis")
			}
		}
	}

	ac := &AppContext{db: db, rdb: rdb}

	// Routes
	http.HandleFunc("/health", ac.healthHandler)
	http.HandleFunc("/ready", ac.readyHandler)
	http.HandleFunc("/metrics", ac.metricsHandler)
	http.HandleFunc("/api/status", ac.statusHandler)
	http.HandleFunc("/api/users", ac.getUsersHandler)
	http.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			requireAPIKey(ac.createUserHandler)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Start server
	logInfo("Server starting", "port", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		logError("Server error", "error", err.Error())
		os.Exit(1)
	}
}
```

### Step 2: go.mod

```
module github.com/myorg/go-app

go 1.20

require (
	github.com/lib/pq v1.10.9
	github.com/redis/go-redis/v9 v9.0.0
)

require (
	github.com/cespare/xxhash/v2 v2.2.0 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
)
```

### Step 3: Dockerfile

```dockerfile
# Build stage
FROM golang:1.20-alpine AS builder

WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source
COPY . .

# Build app (statically linked)
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

# Runtime stage
FROM alpine:3.18

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/app .

# Create non-root user
RUN addgroup -D -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget -q -O- http://localhost:3000/health || exit 1

CMD ["./app"]
```

### Step 4: Build and Deploy

```bash
# Build
docker build -t myregistry/go-app:1.0 .

# Push
docker push myregistry/go-app:1.0

# Same Kubernetes deployment as Python app, just change image
image: myregistry/go-app:1.0
```

---

## Comparison: Python vs Go for Kubernetes

### Python Pros
- Faster development
- Extensive libraries
- Great for data processing
- Easier debugging

### Python Cons
- Slower runtime
- Larger base image
- GIL limitations for concurrency
- More memory usage

### Go Pros
- Small binary size
- Fast execution
- Better concurrency (goroutines)
- Single binary deployment
- Lower resource usage

### Go Cons
- Steeper learning curve
- Smaller ecosystem (improving)
- Compilation step required
- Verbose error handling

**Recommendation:**
- **Use Python** for: data processing, ML, prototyping, internal tools
- **Use Go** for: microservices, APIs, high-concurrency systems, CLI tools

---

## Building and Testing Locally

### Python

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run locally
export DATABASE_URL="postgresql://localhost/test"
export REDIS_URL="redis://localhost:6379"
python app.py

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/users
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{"name":"John","email":"john@example.com"}'
```

### Go

```bash
# Install dependencies
go mod download

# Run locally
DATABASE_URL="postgresql://localhost/test" \
REDIS_URL="redis://localhost:6379" \
PORT=3000 \
go run main.go

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/users
```

---

## Docker Compose for Local Testing

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  app:
    build: .
    environment:
      DATABASE_URL: "postgresql://appuser:password@postgres:5432/myapp"
      REDIS_URL: "redis://redis:6379"
      LOG_LEVEL: DEBUG
      ENVIRONMENT: development
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

volumes:
  pgdata:
```

```bash
# Run everything
docker-compose up

# Test
curl http://localhost:3000/health
```
