# Advanced Types in Python

Python supports advanced type features for safer, more expressive code. This chapter covers type hints, dataclasses, enums, and custom types.

---

## Type Hints
```python
def add(a: int, b: int) -> int:
    return a + b
```
- Use `mypy` or Pyright for static type checking.

---

## Dataclasses
```python
from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str
```
- Reduces boilerplate for classes.

---

## Enums
```python
from enum import Enum

class Status(Enum):
    PENDING = 1
    ACTIVE = 2
    INACTIVE = 3
```
- Use enums for state machines and constants.

---

## Custom Types
```python
from typing import NewType
UserId = NewType('UserId', int)
```
- Improves type safety for domain-specific concepts.

---

Advanced types help you write robust, maintainable Python code.