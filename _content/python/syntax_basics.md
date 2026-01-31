# Python Syntax Basics

Python's syntax is designed for readability and simplicity. This chapter covers variables, types, functions, control flow, and OOP basics.

---

## Variables and Types
```python
x = 10          # int
y = 3.14        # float
name = "Alice"  # str
is_active = True # bool
```

---

## Control Flow
```python
if x > 5:
    print("x is greater than 5")
else:
    print("x is 5 or less")

for i in range(3):
    print(i)

while x > 0:
    x -= 1
```

---

## Functions
```python
def greet(name):
    return f"Hello, {name}!"

print(greet("Bob"))
```

---

## Classes and Objects
```python
class User:
    def __init__(self, name):
        self.name = name

    def greet(self):
        return f"Hi, I'm {self.name}"

user = User("Alice")
print(user.greet())
```

---

## Lists, Tuples, Dicts, Sets
```python
nums = [1, 2, 3]           # list
tupled = (1, 2, 3)         # tuple
user = {"name": "Alice"}  # dict
unique = {1, 2, 3}         # set
```

---

Python's simple syntax makes it easy to learn and productive for backend development.