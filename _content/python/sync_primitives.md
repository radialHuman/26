# Synchronization Primitives in Python

Python provides several primitives for safe concurrent programming. This chapter covers Locks, RLocks, Events, Conditions, Semaphores, Queues, and atomic operations.

---

## Locks and RLocks
```python
import threading
lock = threading.Lock()
with lock:
    # critical section
    pass

rlock = threading.RLock()
with rlock:
    pass
```

---

## Events
```python
event = threading.Event()
event.set()   # signal
if event.is_set():
    # proceed
    pass
```

---

## Condition
```python
condition = threading.Condition()
with condition:
    condition.wait()
    condition.notify()
```

---

## Semaphore
```python
sema = threading.Semaphore(2)
with sema:
    # up to 2 threads here
    pass
```

---

## Queue
```python
from queue import Queue
q = Queue()
q.put(1)
item = q.get()
```

---

## concurrent.futures
- High-level API for threads and processes.
```python
from concurrent.futures import ThreadPoolExecutor
with ThreadPoolExecutor() as executor:
    future = executor.submit(pow, 2, 3)
    print(future.result())
```

---

Python's sync primitives help you write safe, concurrent code.