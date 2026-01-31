# Middleware Patterns in Python

Middleware is a function or class that wraps request/response handling to add cross-cutting concerns. This chapter covers WSGI/ASGI middleware and custom middleware in frameworks.

---

## WSGI Middleware
- Used in Flask, Django, and other WSGI apps.
```python
def simple_middleware(app):
    def wrapper(environ, start_response):
        # Pre-processing
        response = app(environ, start_response)
        # Post-processing
        return response
    return wrapper
```

---

## ASGI Middleware
- Used in FastAPI, Starlette, FastMCP, etc.
```python
class SimpleASGIMiddleware:
    def __init__(self, app):
        self.app = app
    async def __call__(self, scope, receive, send):
        # Pre-processing
        await self.app(scope, receive, send)
        # Post-processing
```

---

## Custom Middleware in Frameworks
- **Flask:** Use `before_request` and `after_request` hooks.
- **Django:** Use `MIDDLEWARE` settings and custom classes.
- **FastAPI/FastMCP:** Use `add_middleware` or custom classes.

---

## Common Use Cases
- Logging, authentication, CORS, error handling, rate limiting.

---

Middleware keeps your code modular, reusable, and maintainable.