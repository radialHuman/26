# Testing in Python

Testing is essential for reliable software. This chapter covers `unittest`, `pytest`, property-based testing, mocking, and coverage.

---

## unittest
- Built-in testing framework.
```python
import unittest
class TestMath(unittest.TestCase):
    def test_add(self):
        self.assertEqual(1 + 1, 2)
```

---

## pytest
- Popular, feature-rich testing framework.
```python
def test_add():
    assert 1 + 1 == 2
```

---

## Property-Based Testing
- Use `hypothesis` for property-based tests.
```python
from hypothesis import given
from hypothesis.strategies import integers
@given(integers(), integers())
def test_add_commutative(a, b):
    assert a + b == b + a
```

---

## Mocking
- Use `unittest.mock` for mocking dependencies.
```python
from unittest.mock import Mock
mock = Mock(return_value=42)
assert mock() == 42
```

---

## Coverage
- Use `coverage.py` to measure test coverage.

---

## Best Practices
- Write small, focused tests.
- Use fixtures for setup/teardown.
- Run tests in CI/CD pipelines.

---

Testing ensures your Python code is robust and production-ready.