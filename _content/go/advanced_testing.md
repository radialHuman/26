# Advanced Testing in Go

Beyond unit tests, Go supports advanced testing techniques for robust, production-grade applications. This chapter covers property-based testing, integration tests, and mocking.

---

## Property-Based Testing
- Use libraries like `github.com/leanovate/gopter` or `github.com/stretchr/testify/quick`.
- Test properties that should always hold, not just specific cases.

```go
import "testing/quick"

func Add(a, b int) int { return a + b }

func TestAddCommutative(t *testing.T) {
    f := func(a, b int) bool {
        return Add(a, b) == Add(b, a)
    }
    if err := quick.Check(f, nil); err != nil {
        t.Error(err)
    }
}
```

---

## Integration Testing
- Test how components work together (e.g., database, APIs).
- Use test containers or in-memory databases for isolation.

```go
func TestDatabaseInsert(t *testing.T) {
    db := setupTestDB()
    defer db.Close()
    // Insert and verify data
}
```

---

## Mocking
- Use interfaces to mock dependencies.
- Use libraries like `github.com/stretchr/testify/mock` for advanced mocking.

```go
type Service interface {
    Fetch() string
}

type MockService struct{}
func (m MockService) Fetch() string { return "mock" }

func TestService(t *testing.T) {
    var svc Service = MockService{}
    if svc.Fetch() != "mock" {
        t.Fail()
    }
}
```

---

## Best Practices
- Separate unit, integration, and end-to-end tests.
- Use CI to run all tests automatically.
- Clean up resources after tests.
- Use table-driven tests for coverage.

---

Advanced testing ensures your Go applications are reliable and production-ready.