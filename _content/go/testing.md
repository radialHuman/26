# Testing in Go

Testing is an integral part of software development, and Go provides a robust testing framework out of the box. This chapter covers Go's testing tools, best practices, and examples.

---

## The `testing` Package

Go's standard library includes the `testing` package for writing unit tests.

### Writing a Test
Create a file with the `_test.go` suffix and write test functions starting with `Test`.

```go
package main

import "testing"

func Add(a, b int) int {
    return a + b
}

func TestAdd(t *testing.T) {
    result := Add(2, 3)
    if result != 5 {
        t.Errorf("Expected 5, got %d", result)
    }
}
```

### Running Tests
Use the `go test` command to run tests.

```bash
go test
```

---

## Table-Driven Tests

Table-driven tests allow you to test multiple cases in a single function.

```go
func TestAddTableDriven(t *testing.T) {
    tests := []struct {
        a, b, expected int
    }{
        {1, 1, 2},
        {2, 3, 5},
        {0, 0, 0},
    }

    for _, tt := range tests {
        result := Add(tt.a, tt.b)
        if result != tt.expected {
            t.Errorf("Add(%d, %d): expected %d, got %d", tt.a, tt.b, tt.expected, result)
        }
    }
}
```

---

## Benchmarking

Go supports benchmarking to measure performance.

### Writing a Benchmark
Benchmark functions start with `Benchmark` and take a `*testing.B` parameter.

```go
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(2, 3)
    }
}
```

### Running Benchmarks
Use the `-bench` flag to run benchmarks.

```bash
go test -bench .
```

---

## Mocking

Mocking is used to simulate dependencies in tests.

### Example: Mocking a Service
```go
type Service interface {
    FetchData() string
}

type MockService struct{}

func (m MockService) FetchData() string {
    return "Mock Data"
}

func TestService(t *testing.T) {
    mock := MockService{}
    data := mock.FetchData()
    if data != "Mock Data" {
        t.Errorf("Expected 'Mock Data', got '%s'", data)
    }
}
```

---

## Code Coverage

Measure code coverage using the `-cover` flag.

```bash
go test -cover
```

Generate a detailed coverage report:

```bash
go test -coverprofile=coverage.out
```

View the report:

```bash
go tool cover -html=coverage.out
```

---

## Best Practices

1. **Write Small, Focused Tests:**
   - Test one thing at a time.

2. **Use Descriptive Test Names:**
   - Clearly describe what the test is verifying.

3. **Run Tests Frequently:**
   - Integrate tests into your CI/CD pipeline.

4. **Measure Coverage:**
   - Aim for high code coverage but prioritize meaningful tests.

5. **Avoid Flaky Tests:**
   - Ensure tests are deterministic and reliable.

---

Testing in Go ensures that your code is reliable and maintainable. By following best practices, you can catch bugs early and improve code quality. In the next chapter, we will explore Go's advanced concurrency patterns.