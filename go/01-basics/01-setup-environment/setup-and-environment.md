# Go Setup & Environment

## What is Go Setup & Environment?

Go setup and environment configuration is the foundational step in Go development. It involves installing the Go toolchain, configuring environment variables, understanding the Go workspace structure, and setting up your development environment for optimal productivity.

## Why is it Important?

- **Consistency**: Proper setup ensures your code runs the same way across different machines
- **Reproducibility**: Correct environment configuration makes builds deterministic
- **Tool Integration**: IDEs and tools depend on proper Go environment setup
- **Module Management**: Modern Go relies heavily on modules which require proper configuration
- **Performance**: Proper setup can affect compilation speed and runtime performance
- **Team Collaboration**: Standardized setup reduces "works on my machine" problems

## How Does It Work?

### Core Components

1. **Go Binary Distribution**: The compiler, runtime, and standard library
2. **GOROOT**: Location where Go is installed
3. **GOPATH**: Workspace for Go code (legacy, still used for some tools)
4. **Go Modules**: Modern dependency management (go.mod, go.sum)
5. **Environment Variables**: Configuration that controls Go behavior

### Installation Process

```bash
# Windows (using installer)
# Download from https://go.dev/dl/
# Run the MSI installer

# Verify installation
go version
# Output: go version go1.22.0 windows/amd64

# Check environment
go env
```

### Key Environment Variables

```bash
# GOROOT - Where Go is installed
GOROOT=C:\Go

# GOPATH - Workspace for Go code (less important with modules)
GOPATH=C:\Users\YourName\go

# GOBIN - Where 'go install' puts binaries
GOBIN=C:\Users\YourName\go\bin

# GOOS - Target operating system
GOOS=windows

# GOARCH - Target architecture
GOARCH=amd64

# GO111MODULE - Module support (on by default since Go 1.16)
GO111MODULE=on

# GOPROXY - Module proxy for downloading dependencies
GOPROXY=https://proxy.golang.org,direct

# GOSUMDB - Checksum database for security
GOSUMDB=sum.golang.org

# GOPRIVATE - Private module patterns
GOPRIVATE=github.com/yourcompany/*
```

## Configuration in Detail

### Setting Environment Variables (Windows)

```cmd
# Temporary (current session only)
set GOPATH=C:\Users\YourName\go
set PATH=%PATH%;%GOPATH%\bin

# Permanent (system-wide)
# Use Windows System Properties > Environment Variables
# Or use setx command
setx GOPATH "C:\Users\YourName\go"
setx PATH "%PATH%;%GOPATH%\bin"
```

### Go Modules Configuration

```bash
# Initialize a new module
go mod init github.com/username/projectname

# This creates go.mod file
module github.com/username/projectname

go 1.22

# Download dependencies
go mod download

# Clean up unused dependencies
go mod tidy

# Vendor dependencies (optional)
go mod vendor

# Verify dependencies
go mod verify
```

### Workspace Structure (Module-based)

```
myproject/
├── go.mod              # Module definition
├── go.sum              # Dependency checksums
├── main.go             # Entry point
├── internal/           # Private packages
│   └── auth/
│       └── auth.go
├── pkg/                # Public packages
│   └── utils/
│       └── utils.go
├── cmd/                # Multiple binaries
│   ├── server/
│   │   └── main.go
│   └── worker/
│       └── main.go
├── api/                # API definitions
├── configs/            # Configuration files
├── scripts/            # Build/deployment scripts
└── test/              # Additional test files
```

### Legacy GOPATH Workspace (Pre-modules)

```
GOPATH/
├── bin/               # Compiled binaries
├── pkg/               # Compiled packages
└── src/               # Source code
    └── github.com/
        └── username/
            └── project/
```

## Practical Examples

### Example 1: Setting Up a New Project

```bash
# Create project directory
mkdir mybackend
cd mybackend

# Initialize module
go mod init github.com/mycompany/mybackend

# Create main file
# File: main.go
```

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Backend!")
}
```

```bash
# Run the program
go run main.go

# Build the binary
go build -o mybackend.exe

# Install to GOBIN
go install
```

### Example 2: Working with Dependencies

```go
// main.go
package main

import (
    "fmt"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()
    r.GET("/", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "message": "Hello World",
        })
    })
    r.Run(":8080")
}
```

```bash
# Go automatically downloads dependencies on first build/run
go run main.go
# This updates go.mod and creates go.sum

# Or explicitly add dependency
go get github.com/gin-gonic/gin@v1.9.1

# Upgrade all dependencies
go get -u ./...

# Upgrade specific dependency
go get -u github.com/gin-gonic/gin
```

### Example 3: Cross-Compilation

```bash
# Build for Linux from Windows
set GOOS=linux
set GOARCH=amd64
go build -o myapp-linux

# Build for macOS from Windows
set GOOS=darwin
set GOARCH=amd64
go build -o myapp-mac

# Build for ARM (Raspberry Pi)
set GOOS=linux
set GOARCH=arm
set GOARM=7
go build -o myapp-arm

# Reset to default
set GOOS=windows
set GOARCH=amd64
```

### Example 4: Private Module Configuration

```bash
# For private GitHub repositories
set GOPRIVATE=github.com/mycompany/*

# Configure Git to use SSH instead of HTTPS
git config --global url."git@github.com:".insteadOf "https://github.com/"

# Or use access token
git config --global url."https://username:token@github.com/".insteadOf "https://github.com/"
```

### Example 5: Using Go Workspaces (Go 1.18+)

```bash
# Create workspace
mkdir myworkspace
cd myworkspace

# Initialize workspace
go work init

# Add modules to workspace
go work use ./module1
go work use ./module2

# This creates go.work file
```

```
# go.work
go 1.22

use (
    ./module1
    ./module2
)
```

## IDE Setup

### Visual Studio Code

```json
// .vscode/settings.json
{
    "go.useLanguageServer": true,
    "go.gopath": "C:\\Users\\YourName\\go",
    "go.goroot": "C:\\Go",
    "go.toolsManagement.autoUpdate": true,
    "go.lintTool": "golangci-lint",
    "go.lintOnSave": "workspace",
    "go.formatTool": "goimports",
    "go.testFlags": ["-v"],
    "go.coverOnSave": true,
    "go.buildOnSave": "workspace"
}
```

### Installing Go Tools for VS Code

```bash
# Install all recommended tools
# Press Ctrl+Shift+P, search "Go: Install/Update Tools"
# Or install manually:

go install golang.org/x/tools/gopls@latest
go install github.com/go-delve/delve/cmd/dlv@latest
go install honnef.co/go/tools/cmd/staticcheck@latest
go install golang.org/x/tools/cmd/goimports@latest
```

## Alternatives

### Installation Methods

1. **Official Installer** (Recommended)
   - Pros: Easy, automatic PATH setup, official support
   - Cons: Requires admin rights, fixed installation location

2. **Chocolatey (Windows)**
   ```bash
   choco install golang
   ```
   - Pros: Easy updates, version management
   - Cons: Requires Chocolatey

3. **Scoop (Windows)**
   ```bash
   scoop install go
   ```
   - Pros: No admin required, clean uninstall
   - Cons: Less popular than Chocolatey

4. **Docker**
   ```dockerfile
   FROM golang:1.22-alpine
   WORKDIR /app
   COPY . .
   RUN go build -o main .
   CMD ["./main"]
   ```
   - Pros: Consistent environment, no local installation
   - Cons: Overhead, complexity for simple projects

5. **GVM (Go Version Manager)**
   - Pros: Multiple Go versions, easy switching
   - Cons: Limited Windows support, extra complexity

### Module Proxies

1. **Default (proxy.golang.org)**
   - Pros: Fast, reliable, caching
   - Cons: Public only, may cache old versions

2. **Private Proxy (Athens, GoCenter)**
   - Pros: Corporate control, private modules
   - Cons: Setup complexity, maintenance

3. **Direct Download**
   ```bash
   set GOPROXY=direct
   ```
   - Pros: No intermediary, always latest
   - Cons: Slower, no caching, network dependent

## Practical Situations

### When to Use Each Approach

#### Use Official Installer When:
- Starting with Go
- Single machine development
- Standard corporate environment
- Need official support

#### Use Docker When:
- CI/CD pipelines
- Microservices deployment
- Team consistency required
- Multiple projects with different Go versions

#### Use Go Workspaces When:
- Developing multiple related modules
- Local module development
- Monorepo structure
- Testing changes across modules

#### Use GOPATH When:
- Legacy projects (pre-Go 1.11)
- Some tooling still requires it
- Learning older Go codebases

### Avoid These Situations

❌ **Don't mix GOPATH and modules**
- Causes confusion and build errors

❌ **Don't commit go.sum to .gitignore**
- Breaks reproducible builds

❌ **Don't manually edit go.sum**
- Use `go mod tidy` instead

❌ **Don't use `go get` for installing tools in projects**
- Use `go install` instead

## Common Issues & Solutions

### Issue 1: Module Not Found

```bash
# Error: cannot find module providing package X

# Solution 1: Download dependencies
go mod download

# Solution 2: Tidy modules
go mod tidy

# Solution 3: Clear cache
go clean -modcache
```

### Issue 2: Checksum Mismatch

```bash
# Error: verifying X: checksum does not match

# Solution: Update checksums
go mod tidy
go mod verify
```

### Issue 3: Private Repository Access

```bash
# Error: 410 Gone (accessing private repo)

# Solution: Configure GOPRIVATE
set GOPRIVATE=github.com/mycompany/*

# Configure Git credentials
git config --global credential.helper store
```

### Issue 4: PATH Not Set

```bash
# Error: 'go' is not recognized

# Solution: Add Go to PATH
setx PATH "%PATH%;C:\Go\bin;%GOPATH%\bin"

# Restart terminal
```

## Build Configurations

### Build Tags

```go
// +build windows

package main

// This file only compiles on Windows
```

```go
// +build linux darwin

package main

// This file compiles on Linux and macOS
```

### Build Flags

```bash
# Disable CGO
CGO_ENABLED=0 go build

# Static linking
go build -ldflags="-w -s" -a

# Optimization levels
go build -gcflags="-m -m"  # Escape analysis
go build -gcflags="-l"      # Disable inlining

# Set version information
go build -ldflags="-X main.version=1.0.0"
```

### Compilation Performance

```bash
# Parallel compilation
go build -p 4  # Use 4 parallel processes

# Caching
go build -a    # Force rebuild all
go clean -cache  # Clear build cache
```

## Best Practices

### 1. Always Use Modules
```bash
# Start every new project with
go mod init <module-name>
```

### 2. Pin Dependencies
```
// go.mod
require (
    github.com/gin-gonic/gin v1.9.1
    // Not: github.com/gin-gonic/gin latest
)
```

### 3. Regular Maintenance
```bash
# Weekly or before releases
go get -u ./...      # Update dependencies
go mod tidy          # Clean up
go mod verify        # Verify checksums
```

### 4. Use .gitignore
```
# .gitignore
# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary
*.test

# Output
*.out

# Go workspace file
go.work

# Vendor (if not using)
vendor/
```

### 5. Environment File for Teams
```bash
# .env or setenv.bat
@echo off
set GOPATH=C:\Users\YourName\go
set GOPRIVATE=github.com/mycompany/*
set GOPROXY=https://proxy.golang.org,direct
echo Go environment configured!
```

## Production Considerations

### Security

1. **Verify Dependencies**
   ```bash
   go mod verify  # Always run before deployment
   ```

2. **Use GOSUMDB**
   - Enabled by default
   - Prevents dependency tampering

3. **Scan for Vulnerabilities**
   ```bash
   go install golang.org/x/vuln/cmd/govulncheck@latest
   govulncheck ./...
   ```

### Performance

1. **Build for Production**
   ```bash
   go build -ldflags="-w -s" -trimpath
   # -w: Omit DWARF symbol table
   # -s: Omit symbol table and debug info
   # -trimpath: Remove file system paths
   ```

2. **Reduce Binary Size**
   ```bash
   # Use UPX (optional)
   go build -ldflags="-w -s"
   upx --best --lzma myapp.exe
   ```

### Reproducible Builds

1. **Version Control go.sum**
   ```bash
   git add go.mod go.sum
   git commit -m "Lock dependencies"
   ```

2. **Document Go Version**
   ```
   // go.mod
   go 1.22
   ```

3. **Use Vendoring (Optional)**
   ```bash
   go mod vendor
   # Commit vendor/ to ensure exact dependencies
   ```

## Troubleshooting Checklist

- [ ] Go version matches project requirements
- [ ] GOPATH and GOBIN in PATH
- [ ] go.mod exists in project root
- [ ] Dependencies downloaded (`go mod download`)
- [ ] go.sum committed to version control
- [ ] GOPRIVATE set for private repositories
- [ ] IDE Go extension installed and configured
- [ ] Build cache clear if having issues (`go clean -cache`)
- [ ] Module cache clear if corrupted (`go clean -modcache`)

## Summary

Proper Go setup and environment configuration is crucial for:
- Smooth development experience
- Reproducible builds
- Team collaboration
- Production deployment
- Security and compliance

Key takeaways:
- Always use Go modules (go.mod)
- Understand GOROOT, GOPATH, and module proxy
- Configure IDE properly
- Version control go.sum
- Keep dependencies updated and verified
- Use appropriate build flags for production
