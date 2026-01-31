# Concurrency in Python

Python supports concurrency through threads, processes, and async programming. This chapter covers threading, multiprocessing, asyncio, and best practices.

---

## Threading
- Use the `threading` module for I/O-bound concurrency.
```python
import threading

def worker():
    print("Worker running")

thread = threading.Thread(target=worker)
thread.start()
thread.join()
```

---

## Multiprocessing
- Use the `multiprocessing` module for CPU-bound tasks.
```python
import multiprocessing

def worker():
    print("Process running")

process = multiprocessing.Process(target=worker)
process.start()
process.join()
```

---

## Asyncio
- Use `asyncio` for scalable async I/O.
```python
import asyncio

async def main():
    print("Hello async")

asyncio.run(main())
```

---

## GIL (Global Interpreter Lock)
- Limits true parallelism in threads for CPython.
- Use multiprocessing or async for CPU-bound or high-concurrency tasks.

---

## Best Practices
- Use threads for I/O-bound, multiprocessing for CPU-bound, and asyncio for high-concurrency I/O.
- Avoid shared state; use queues or managers for communication.

---

Python offers multiple concurrency models—choose the right one for your workload.