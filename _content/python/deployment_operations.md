# Deployment and Operations for Python Applications

Deploying Python applications efficiently is key to scalability and reliability. This chapter covers packaging, Docker, CI/CD, Gunicorn, uWSGI, and health checks.

---

## Packaging and Distribution
- Use `setuptools` or `poetry` for packaging.
- Distribute as wheels or source distributions.

---

## Dockerizing Python Apps
- Use multi-stage builds for small images.
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
```

---

## WSGI/ASGI Servers
- **Gunicorn:** WSGI server for Flask/Django.
- **uWSGI:** Versatile WSGI server.
- **uvicorn:** ASGI server for FastAPI/Starlette.

---

## CI/CD Pipelines
- Use GitHub Actions, GitLab CI, or Jenkins.
- Automate build, test, and deployment steps.

---

## Health Checks
- Implement `/healthz` endpoints for liveness/readiness.
```python
@app.route('/healthz')
def healthz():
    return '', 200
```
- Integrate with Kubernetes or cloud platforms.

---

## Best Practices
- Use environment variables for config.
- Build minimal, secure images.
- Automate deployments and rollbacks.

---

A solid deployment strategy ensures your Python apps are reliable and scalable.