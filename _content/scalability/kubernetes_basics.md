# Kubernetes & Orchestration Basics

Kubernetes is the de facto container orchestration platform. This guide covers core concepts, manifests, Helm basics, probes, Secrets, ConfigMaps, and autoscaling.

---

## Core Concepts
- **Pod:** Smallest deployable unit (one or more containers).
- **Deployment:** Declarative updates to Pods.
- **Service:** Stable network endpoint for Pods.
- **Ingress:** Exposes HTTP(S) routes to services.
- **ConfigMap/Secret:** Configuration and secrets management.

---

## Simple Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: myapp:latest
          ports:
            - containerPort: 8080
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
```

---

## Service Manifest
```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: ClusterIP
```

---

## ConfigMaps and Secrets
- Create ConfigMap: `kubectl create configmap myconfig --from-file=config.yaml`
- Create Secret: `kubectl create secret generic mysecret --from-literal=TOKEN=abcd`

---

## Helm Basics
- Helm packages Kubernetes manifests as charts.
- Basic commands: `helm create`, `helm install`, `helm upgrade`.

---

## Autoscaling
- Horizontal Pod Autoscaler (HPA) scales based on CPU or custom metrics:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
```

---

## Pod Lifecycle
- Pending -> Running -> Succeeded/Failed
- Use `kubectl describe pod` to debug events.

---

## Best Practices
- Use readiness/liveness probes.
- Avoid storing state in pods; use volumes or external storage.
- Use resource requests/limits.
- Secure clusters with RBAC and network policies.

---

Kubernetes provides a robust platform for running production workloads; start with simple manifests and iterate to more advanced patterns.