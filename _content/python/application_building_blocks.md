# Python Application Building Blocks

Python provides powerful constructs for building scalable applications. This chapter covers modules, packages, decorators, and context managers.

---

## Modules and Packages
- **Module:** A single `.py` file.
- **Package:** A directory with `__init__.py`.

```python
# mymodule.py
def foo():
    pass

# mypackage/__init__.py
from .foo import foo
```

---

## Decorators
- Functions that modify other functions or methods.

```python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        print("Before")
        result = func(*args, **kwargs)
        print("After")
        return result
    return wrapper

@my_decorator
def greet():
    print("Hello!")
```

---

## Context Managers
- Manage resources with `with` blocks.

```python
with open("file.txt") as f:
    data = f.read()
```
- Create custom context managers with `__enter__` and `__exit__` or `contextlib`.

---

These building blocks help structure large, maintainable Python applications.