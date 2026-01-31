# Advanced Async Patterns in Python

This chapter dives deeper into `asyncio`, cancellation, concurrency patterns, `pydantic` v2 usage, static typing with `mypy`, and tuning `uvicorn`/`gunicorn` for production.

---

## asyncio Patterns
- Use `asyncio.create_task` for background tasks.
- Coordinate tasks with `gather`, `wait`, and cancellation.

```python
import asyncio

async def worker():
    await asyncio.sleep(1)

async def main():
    tasks = [asyncio.create_task(worker()) for _ in range(10)]
    await asyncio.gather(*tasks)

asyncio.run(main())
```

---

## Cancellation
- Propagate cancellation via `asyncio.CancelledError` and `asyncio.timeout`.
```python
try:
    await asyncio.wait_for(some_coro(), timeout=5)
except asyncio.TimeoutError:
    # handle timeout
    pass
```

---

## pydantic v2
- Use pydantic v2 `BaseModel` for validation and settings via `BaseSettings`.
```python
from pydantic import BaseModel
class User(BaseModel):
    id: int
    name: str
```

---

## mypy and Typing
- Use `mypy` for static checks. Add `pyproject.toml` or `mypy.ini` for config.
- Use `typing` generics and `TypedDict` for structured dicts.

---

## Uvicorn/Gunicorn Tuning
- For async apps (FastAPI), use `uvicorn` with workers or `gunicorn` + `uvicorn.workers.UvicornWorker`.
- Tune worker count by CPU cores and I/O profile.

---

## Best Practices
- Use structured cancellation, avoid background tasks without supervision.
- Validate inputs with pydantic and keep type hints current.

---

Advanced async knowledge is necessary for scalable Python services that handle high concurrency.