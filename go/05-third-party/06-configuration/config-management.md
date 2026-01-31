# Environment Variables and Configuration

## What is Configuration Management?

Managing application settings across different environments (development, staging, production) using environment variables and configuration files.

## Environment Variables

### Reading Environment Variables

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    // Get environment variable
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"  // Default value
    }
    
    dbHost := os.Getenv("DB_HOST")
    dbPassword := os.Getenv("DB_PASSWORD")
    
    fmt.Println("Port:", port)
    fmt.Println("DB Host:", dbHost)
}
```

### Setting Environment Variables

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    // Set environment variable
    os.Setenv("API_KEY", "secret-key-123")
    
    // Get it back
    apiKey := os.Getenv("API_KEY")
    fmt.Println("API Key:", apiKey)
    
    // Unset
    os.Unsetenv("API_KEY")
}
```

### Lookup with Check

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    // Check if variable exists
    if value, exists := os.LookupEnv("DATABASE_URL"); exists {
        fmt.Println("Database URL:", value)
    } else {
        fmt.Println("DATABASE_URL not set")
    }
}
```

## godotenv - Loading .env Files

### Installation

```bash
go get github.com/joho/godotenv
```

### .env File

```env
# .env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secret
DB_NAME=myapp
REDIS_URL=redis://localhost:6379
JWT_SECRET=my-secret-key
LOG_LEVEL=debug
```

### Loading .env File

```go
package main

import (
    "fmt"
    "log"
    "os"
    
    "github.com/joho/godotenv"
)

func main() {
    // Load .env file
    err := godotenv.Load()
    if err != nil {
        log.Fatal("Error loading .env file")
    }
    
    // Access variables
    port := os.Getenv("PORT")
    dbHost := os.Getenv("DB_HOST")
    jwtSecret := os.Getenv("JWT_SECRET")
    
    fmt.Println("Port:", port)
    fmt.Println("DB Host:", dbHost)
    fmt.Println("JWT Secret:", jwtSecret)
}
```

### Multiple .env Files

```go
package main

import (
    "github.com/joho/godotenv"
    "log"
)

func main() {
    // Load multiple files (later files override earlier ones)
    err := godotenv.Load(".env.local", ".env")
    if err != nil {
        log.Fatal("Error loading .env files")
    }
    
    // Load specific file
    err = godotenv.Load("config/.env.production")
    if err != nil {
        log.Printf("Warning: %v", err)
    }
}
```

## Viper - Advanced Configuration

### Installation

```bash
go get github.com/spf13/viper
```

### Basic Viper Usage

```go
package main

import (
    "fmt"
    "github.com/spf13/viper"
)

func main() {
    // Set config file name and path
    viper.SetConfigName("config")
    viper.SetConfigType("yaml")
    viper.AddConfigPath(".")
    viper.AddConfigPath("./config")
    
    // Read config file
    if err := viper.ReadInConfig(); err != nil {
        panic(err)
    }
    
    // Get values
    port := viper.GetInt("server.port")
    dbHost := viper.GetString("database.host")
    
    fmt.Println("Port:", port)
    fmt.Println("DB Host:", dbHost)
}
```

### config.yaml Example

```yaml
# config.yaml
server:
  port: 8080
  host: localhost
  timeout: 30s

database:
  host: localhost
  port: 5432
  user: postgres
  password: secret
  name: myapp
  max_connections: 100

redis:
  url: redis://localhost:6379
  pool_size: 10

logging:
  level: info
  format: json
```

### Viper with Environment Variables

```go
package main

import (
    "fmt"
    "github.com/spf13/viper"
    "strings"
)

func main() {
    // Auto bind environment variables
    viper.AutomaticEnv()
    
    // Replace . with _ in env vars
    viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
    
    // Set prefix for env vars
    viper.SetEnvPrefix("APP")
    
    // Read config file
    viper.SetConfigFile("config.yaml")
    viper.ReadInConfig()
    
    // ENV var APP_DATABASE_HOST overrides config.yaml
    dbHost := viper.GetString("database.host")
    
    fmt.Println("DB Host:", dbHost)
}
```

### Config Struct

```go
package main

import (
    "fmt"
    "github.com/spf13/viper"
    "time"
)

type Config struct {
    Server   ServerConfig   `mapstructure:"server"`
    Database DatabaseConfig `mapstructure:"database"`
    Redis    RedisConfig    `mapstructure:"redis"`
    Logging  LoggingConfig  `mapstructure:"logging"`
}

type ServerConfig struct {
    Port    int           `mapstructure:"port"`
    Host    string        `mapstructure:"host"`
    Timeout time.Duration `mapstructure:"timeout"`
}

type DatabaseConfig struct {
    Host           string `mapstructure:"host"`
    Port           int    `mapstructure:"port"`
    User           string `mapstructure:"user"`
    Password       string `mapstructure:"password"`
    Name           string `mapstructure:"name"`
    MaxConnections int    `mapstructure:"max_connections"`
}

type RedisConfig struct {
    URL      string `mapstructure:"url"`
    PoolSize int    `mapstructure:"pool_size"`
}

type LoggingConfig struct {
    Level  string `mapstructure:"level"`
    Format string `mapstructure:"format"`
}

func LoadConfig() (*Config, error) {
    viper.SetConfigFile("config.yaml")
    
    if err := viper.ReadInConfig(); err != nil {
        return nil, err
    }
    
    var config Config
    if err := viper.Unmarshal(&config); err != nil {
        return nil, err
    }
    
    return &config, nil
}

func main() {
    config, err := LoadConfig()
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Server Port: %d\n", config.Server.Port)
    fmt.Printf("DB Host: %s\n", config.Database.Host)
    fmt.Printf("Log Level: %s\n", config.Logging.Level)
}
```

## Complete Configuration Package

### config/config.go

```go
package config

import (
    "fmt"
    "time"
    
    "github.com/spf13/viper"
)

type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Redis    RedisConfig
    JWT      JWTConfig
    Logging  LoggingConfig
}

type ServerConfig struct {
    Port            int
    Host            string
    ReadTimeout     time.Duration
    WriteTimeout    time.Duration
    ShutdownTimeout time.Duration
}

type DatabaseConfig struct {
    Host            string
    Port            int
    User            string
    Password        string
    Database        string
    SSLMode         string
    MaxOpenConns    int
    MaxIdleConns    int
    ConnMaxLifetime time.Duration
}

type RedisConfig struct {
    Address  string
    Password string
    DB       int
    PoolSize int
}

type JWTConfig struct {
    Secret     string
    Expiration time.Duration
}

type LoggingConfig struct {
    Level  string
    Format string
}

func Load(env string) (*Config, error) {
    viper.SetConfigName(fmt.Sprintf("config.%s", env))
    viper.SetConfigType("yaml")
    viper.AddConfigPath("./config")
    viper.AddConfigPath(".")
    
    // Auto load environment variables
    viper.AutomaticEnv()
    
    if err := viper.ReadInConfig(); err != nil {
        return nil, fmt.Errorf("failed to read config: %w", err)
    }
    
    var config Config
    if err := viper.Unmarshal(&config); err != nil {
        return nil, fmt.Errorf("failed to unmarshal config: %w", err)
    }
    
    // Validate config
    if err := validate(&config); err != nil {
        return nil, err
    }
    
    return &config, nil
}

func validate(config *Config) error {
    if config.Server.Port == 0 {
        return fmt.Errorf("server port is required")
    }
    
    if config.Database.Host == "" {
        return fmt.Errorf("database host is required")
    }
    
    if config.JWT.Secret == "" {
        return fmt.Errorf("JWT secret is required")
    }
    
    return nil
}
```

### config.development.yaml

```yaml
server:
  port: 8080
  host: localhost
  read_timeout: 15s
  write_timeout: 15s
  shutdown_timeout: 30s

database:
  host: localhost
  port: 5432
  user: postgres
  password: postgres
  database: myapp_dev
  ssl_mode: disable
  max_open_conns: 25
  max_idle_conns: 5
  conn_max_lifetime: 5m

redis:
  address: localhost:6379
  password: ""
  db: 0
  pool_size: 10

jwt:
  secret: dev-secret-key-change-in-production
  expiration: 24h

logging:
  level: debug
  format: text
```

### config.production.yaml

```yaml
server:
  port: ${PORT:8080}
  host: 0.0.0.0
  read_timeout: 30s
  write_timeout: 30s
  shutdown_timeout: 60s

database:
  host: ${DB_HOST}
  port: ${DB_PORT:5432}
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  database: ${DB_NAME}
  ssl_mode: require
  max_open_conns: 100
  max_idle_conns: 10
  conn_max_lifetime: 10m

redis:
  address: ${REDIS_URL}
  password: ${REDIS_PASSWORD}
  db: 0
  pool_size: 50

jwt:
  secret: ${JWT_SECRET}
  expiration: 1h

logging:
  level: info
  format: json
```

### main.go

```go
package main

import (
    "fmt"
    "log"
    "os"
    
    "myapp/config"
)

func main() {
    // Get environment (dev, staging, production)
    env := os.Getenv("APP_ENV")
    if env == "" {
        env = "development"
    }
    
    // Load configuration
    cfg, err := config.Load(env)
    if err != nil {
        log.Fatal("Failed to load config:", err)
    }
    
    fmt.Printf("Starting server on %s:%d\n", cfg.Server.Host, cfg.Server.Port)
    fmt.Printf("Database: %s@%s:%d/%s\n", 
        cfg.Database.User, 
        cfg.Database.Host, 
        cfg.Database.Port, 
        cfg.Database.Database,
    )
    
    // Use config throughout application
    // startServer(cfg)
}
```

## Secrets Management

### Using Environment Variables for Secrets

```go
package main

import (
    "fmt"
    "os"
)

type Secrets struct {
    DBPassword    string
    JWTSecret     string
    APIKey        string
    StripeKey     string
    AWSAccessKey  string
    AWSSecretKey  string
}

func LoadSecrets() *Secrets {
    return &Secrets{
        DBPassword:   os.Getenv("DB_PASSWORD"),
        JWTSecret:    os.Getenv("JWT_SECRET"),
        APIKey:       os.Getenv("API_KEY"),
        StripeKey:    os.Getenv("STRIPE_SECRET_KEY"),
        AWSAccessKey: os.Getenv("AWS_ACCESS_KEY_ID"),
        AWSSecretKey: os.Getenv("AWS_SECRET_ACCESS_KEY"),
    }
}

func main() {
    secrets := LoadSecrets()
    
    if secrets.JWTSecret == "" {
        panic("JWT_SECRET not set")
    }
    
    fmt.Println("Secrets loaded successfully")
}
```

## Feature Flags

```go
package main

import (
    "github.com/spf13/viper"
)

type Features struct {
    NewUserFlow    bool `mapstructure:"new_user_flow"`
    BetaFeatures   bool `mapstructure:"beta_features"`
    MaintenanceMode bool `mapstructure:"maintenance_mode"`
}

func LoadFeatures() *Features {
    var features Features
    viper.UnmarshalKey("features", &features)
    return &features
}

// config.yaml
// features:
//   new_user_flow: true
//   beta_features: false
//   maintenance_mode: false
```

## Best Practices

### 1. Never Commit Secrets

```gitignore
# .gitignore
.env
.env.local
.env.*.local
config.production.yaml
secrets/
```

### 2. Use Different Configs per Environment

```
config/
├── config.development.yaml
├── config.staging.yaml
├── config.production.yaml
└── config.test.yaml
```

### 3. Validate Configuration on Startup

```go
func validate(cfg *Config) error {
    if cfg.Server.Port < 1 || cfg.Server.Port > 65535 {
        return errors.New("invalid port")
    }
    
    if cfg.JWT.Secret == "" || len(cfg.JWT.Secret) < 32 {
        return errors.New("JWT secret must be at least 32 characters")
    }
    
    return nil
}
```

### 4. Use Typed Configuration

```go
// GOOD - type safe
type Config struct {
    Port int
    Timeout time.Duration
}

// BAD - stringly typed
port := viper.GetString("port")  // Should be int
```

### 5. Document Configuration

```yaml
# config.yaml
# Server configuration
server:
  # Port to listen on (1-65535)
  port: 8080
  # Request timeout in seconds
  timeout: 30s
```

## Summary

Configuration management provides:
- **Environment Variables**: Runtime configuration
- **godotenv**: Load .env files
- **Viper**: Advanced config with multiple formats
- **Validation**: Ensure correct configuration
- **Type Safety**: Struct-based config
- **Secrets**: Secure sensitive data

Essential for managing application settings across environments.
