# Go Modules Deep Dive

Go modules are the standard for dependency management in Go. This chapter covers private modules, vendoring, and reproducible builds.

---

## Go Modules Basics
- Initialize with `go mod init`.
- Add dependencies with `go get`.
- Track dependencies in `go.mod` and `go.sum`.

---

## Private Modules
- Use `GOPRIVATE` to specify private repos:
  ```sh
  go env -w GOPRIVATE=github.com/myorg/*
  ```
- Authenticate with SSH keys or tokens as needed.

---

## Vendoring
- Use `go mod vendor` to copy dependencies into the `vendor/` directory.
- Build with vendored dependencies using `-mod=vendor`.

---

## Reproducible Builds
- Use `go.sum` to verify dependency integrity.
- Run `go mod tidy` to clean up unused dependencies.
- Use CI to verify builds are reproducible.

---

## Best Practices
- Commit `go.mod` and `go.sum` to version control.
- Regularly update dependencies and audit for vulnerabilities.
- Use vendoring for hermetic builds or air-gapped environments.

---

Go modules make dependency management reliable and reproducible for all Go projects.