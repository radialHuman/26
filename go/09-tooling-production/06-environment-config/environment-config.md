# Environment Variables and Secrets

## What are Environment Variables?

Environment variables are dynamic values that affect how processes run on a system. They're used to:
- Configure applications without code changes
- Store sensitive data (API keys, passwords)
- Manage different environments (dev, staging, production)

## Why Use Environment Variables?

- **Security**: Keep secrets out of code
- **Flexibility**: Change config without rebuilding
- **Portability**: Same code, different environments
- **12-Factor App**: Follow best practices

## Basic Environment Variables

### Reading Environment Variables

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    // Get environment variable
    dbHost := os.Getenv("DB_HOST")
    if dbHost == "" {
        dbHost = "localhost" // Default value
    }
    
    fmt.Println("Database host:", dbHost)
    
    // Check if variable exists
    apiKey, exists := os.LookupEnv("API_KEY")
    if !exists {
        panic("API_KEY not set")
    }
    
    fmt.Println("API Key:", apiKey)
}
```

### Setting Environment Variables

```bash
# Linux/Mac
export DB_HOST=localhost
export DB_PORT=5432
export API_KEY=secret-key

# Windows (CMD)
set DB_HOST=localhost
set DB_PORT=5432

# Windows (PowerShell)
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
```

### .env Files

Create a `.env` file:

```env
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secret
DB_NAME=myapp

# Application settings
APP_ENV=development
APP_PORT=8080
LOG_LEVEL=debug

# External services
REDIS_URL=redis://localhost:6379
API_KEY=your-api-key-here
JWT_SECRET=your-secret-key
```

## Using godotenv

### Installation

```bash
go get github.com/joho/godotenv
```

### Basic Usage

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
    dbHost := os.Getenv("DB_HOST")
    dbPort := os.Getenv("DB_PORT")
    
    fmt.Printf("Database: %s:%s\n", dbHost, dbPort)
}
```

### Multiple .env Files

```go
// Load specific file
err := godotenv.Load(".env.production")

// Load multiple files
err := godotenv.Load(".env", ".env.local")

// Load with fallback
err := godotenv.Load(".env.local")
if err != nil {
    godotenv.Load(".env")
}
```

### Auto-load Based on Environment

```go
func loadEnv() {
    env := os.Getenv("APP_ENV")
    if env == "" {
        env = "development"
    }
    
    envFile := fmt.Sprintf(".env.%s", env)
    
    if err := godotenv.Load(envFile); err != nil {
        log.Printf("Warning: %s not found, loading .env", envFile)
        godotenv.Load(".env")
    }
}
```

## Configuration Struct

### Structured Configuration

```go
package config

import (
    "fmt"
    "os"
    "strconv"
    "time"
)

type Config struct {
    Database DatabaseConfig
    Server   ServerConfig
    Redis    RedisConfig
    JWT      JWTConfig
}

type DatabaseConfig struct {
    Host     string
    Port     int
    User     string
    Password string
    DBName   string
}

type ServerConfig struct {
    Port         int
    Environment  string
    ReadTimeout  time.Duration
    WriteTimeout time.Duration
}

type RedisConfig struct {
    URL      string
    Password string
    DB       int
}

type JWTConfig struct {
    Secret     string
    Expiration time.Duration
}

func Load() (*Config, error) {
    // Load .env file
    godotenv.Load()
    
    cfg := &Config{
        Database: DatabaseConfig{
            Host:     getEnv("DB_HOST", "localhost"),
            Port:     getEnvAsInt("DB_PORT", 5432),
            User:     getEnv("DB_USER", "postgres"),
            Password: getEnv("DB_PASSWORD", ""),
            DBName:   getEnv("DB_NAME", "myapp"),
        },
        Server: ServerConfig{
            Port:         getEnvAsInt("APP_PORT", 8080),
            Environment:  getEnv("APP_ENV", "development"),
            ReadTimeout:  getEnvAsDuration("READ_TIMEOUT", 15*time.Second),
            WriteTimeout: getEnvAsDuration("WRITE_TIMEOUT", 15*time.Second),
        },
        Redis: RedisConfig{
            URL:      getEnv("REDIS_URL", "redis://localhost:6379"),
            Password: getEnv("REDIS_PASSWORD", ""),
            DB:       getEnvAsInt("REDIS_DB", 0),
        },
        JWT: JWTConfig{
            Secret:     getEnv("JWT_SECRET", ""),
            Expiration: getEnvAsDuration("JWT_EXPIRATION", 24*time.Hour),
        },
    }
    
    // Validate required fields
    if cfg.JWT.Secret == "" {
        return nil, fmt.Errorf("JWT_SECRET is required")
    }
    
    return cfg, nil
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
    if value := os.Getenv(key); value != "" {
        if intVal, err := strconv.Atoi(value); err == nil {
            return intVal
        }
    }
    return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
    if value := os.Getenv(key); value != "" {
        if duration, err := time.ParseDuration(value); err == nil {
            return duration
        }
    }
    return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
    if value := os.Getenv(key); value != "" {
        if boolVal, err := strconv.ParseBool(value); err == nil {
            return boolVal
        }
    }
    return defaultValue
}
```

### Usage

```go
package main

import (
    "log"
    "myapp/config"
)

func main() {
    cfg, err := config.Load()
    if err != nil {
        log.Fatal(err)
    }
    
    // Use config
    log.Printf("Starting server on port %d", cfg.Server.Port)
    log.Printf("Connecting to database: %s:%d", cfg.Database.Host, cfg.Database.Port)
    
    // Pass config to services
    db := connectDatabase(cfg.Database)
    server := setupServer(cfg.Server)
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
    "log"
    
    "github.com/spf13/viper"
)

func main() {
    // Set config file
    viper.SetConfigName("config")
    viper.SetConfigType("yaml")
    viper.AddConfigPath(".")
    viper.AddConfigPath("/etc/myapp")
    
    // Read environment variables
    viper.AutomaticEnv()
    
    // Read config file
    if err := viper.ReadInConfig(); err != nil {
        log.Printf("Warning: %v", err)
    }
    
    // Get values
    dbHost := viper.GetString("database.host")
    dbPort := viper.GetInt("database.port")
    debug := viper.GetBool("debug")
    
    fmt.Printf("Database: %s:%d (debug: %v)\n", dbHost, dbPort, debug)
}
```

### Viper with YAML Config

Create `config.yaml`:

```yaml
database:
  host: localhost
  port: 5432
  user: postgres
  password: secret
  dbname: myapp

server:
  port: 8080
  environment: development
  timeout: 30s

redis:
  url: redis://localhost:6379
  password: ""
  db: 0

logging:
  level: debug
  format: json
```

### Viper Configuration Manager

```go
package config

import (
    "fmt"
    "time"
    
    "github.com/spf13/viper"
)

type Config struct {
    Database DatabaseConfig
    Server   ServerConfig
    Redis    RedisConfig
    Logging  LoggingConfig
}

type DatabaseConfig struct {
    Host     string
    Port     int
    User     string
    Password string
    DBName   string
}

type ServerConfig struct {
    Port        int
    Environment string
    Timeout     time.Duration
}

type RedisConfig struct {
    URL      string
    Password string
    DB       int
}

type LoggingConfig struct {
    Level  string
    Format string
}

func LoadViper() (*Config, error) {
    // Config file settings
    viper.SetConfigName("config")
    viper.SetConfigType("yaml")
    viper.AddConfigPath(".")
    viper.AddConfigPath("./config")
    
    // Environment variable settings
    viper.SetEnvPrefix("MYAPP")
    viper.AutomaticEnv()
    
    // Set defaults
    viper.SetDefault("server.port", 8080)
    viper.SetDefault("server.environment", "development")
    viper.SetDefault("logging.level", "info")
    
    // Read config file
    if err := viper.ReadInConfig(); err != nil {
        if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
            return nil, err
        }
    }
    
    // Unmarshal into struct
    var cfg Config
    if err := viper.Unmarshal(&cfg); err != nil {
        return nil, fmt.Errorf("failed to unmarshal config: %w", err)
    }
    
    return &cfg, nil
}

// Watch for config changes
func WatchConfig(onChange func()) {
    viper.WatchConfig()
    viper.OnConfigChange(func(e fsnotify.Event) {
        log.Println("Config file changed:", e.Name)
        onChange()
    })
}
```

## Secrets Management

### AWS Secrets Manager

```go
package secrets

import (
    "context"
    "encoding/json"
    
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

type SecretsClient struct {
    client *secretsmanager.Client
}

func NewSecretsClient() (*SecretsClient, error) {
    cfg, err := config.LoadDefaultConfig(context.Background())
    if err != nil {
        return nil, err
    }
    
    return &SecretsClient{
        client: secretsmanager.NewFromConfig(cfg),
    }, nil
}

func (s *SecretsClient) GetSecret(secretName string) (map[string]string, error) {
    input := &secretsmanager.GetSecretValueInput{
        SecretId: &secretName,
    }
    
    result, err := s.client.GetSecretValue(context.Background(), input)
    if err != nil {
        return nil, err
    }
    
    var secretMap map[string]string
    if err := json.Unmarshal([]byte(*result.SecretString), &secretMap); err != nil {
        return nil, err
    }
    
    return secretMap, nil
}

// Usage
func loadSecrets() error {
    client, err := NewSecretsClient()
    if err != nil {
        return err
    }
    
    secrets, err := client.GetSecret("myapp/production")
    if err != nil {
        return err
    }
    
    // Set as environment variables
    os.Setenv("DB_PASSWORD", secrets["db_password"])
    os.Setenv("API_KEY", secrets["api_key"])
    
    return nil
}
```

### HashiCorp Vault

```go
package secrets

import (
    "github.com/hashicorp/vault/api"
)

type VaultClient struct {
    client *api.Client
}

func NewVaultClient(address, token string) (*VaultClient, error) {
    config := api.DefaultConfig()
    config.Address = address
    
    client, err := api.NewClient(config)
    if err != nil {
        return nil, err
    }
    
    client.SetToken(token)
    
    return &VaultClient{client: client}, nil
}

func (v *VaultClient) GetSecret(path string) (map[string]interface{}, error) {
    secret, err := v.client.Logical().Read(path)
    if err != nil {
        return nil, err
    }
    
    return secret.Data, nil
}

// Usage
func loadFromVault() error {
    vault, err := NewVaultClient("http://localhost:8200", os.Getenv("VAULT_TOKEN"))
    if err != nil {
        return err
    }
    
    secrets, err := vault.GetSecret("secret/data/myapp")
    if err != nil {
        return err
    }
    
    data := secrets["data"].(map[string]interface{})
    os.Setenv("DB_PASSWORD", data["db_password"].(string))
    
    return nil
}
```

## Environment-Specific Configuration

### Directory Structure

```
config/
├── config.go
├── development.yaml
├── staging.yaml
├── production.yaml
└── .env.example
```

### Load Based on Environment

```go
func LoadConfig() (*Config, error) {
    env := os.Getenv("APP_ENV")
    if env == "" {
        env = "development"
    }
    
    viper.SetConfigName(env)
    viper.SetConfigType("yaml")
    viper.AddConfigPath("./config")
    
    if err := viper.ReadInConfig(); err != nil {
        return nil, err
    }
    
    var cfg Config
    if err := viper.Unmarshal(&cfg); err != nil {
        return nil, err
    }
    
    return &cfg, nil
}
```

## Best Practices

### 1. Never Commit Secrets

```gitignore
# .gitignore
.env
.env.local
.env.*.local
config/secrets.yaml
secrets/
```

### 2. Provide Example File

```env
# .env.example
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password-here
DB_NAME=myapp

API_KEY=your-api-key
JWT_SECRET=your-jwt-secret
```

### 3. Validate Configuration

```go
func (c *Config) Validate() error {
    if c.JWT.Secret == "" {
        return fmt.Errorf("JWT_SECRET is required")
    }
    
    if c.Database.Password == "" && c.Server.Environment == "production" {
        return fmt.Errorf("DB_PASSWORD is required in production")
    }
    
    if c.Server.Port < 1 || c.Server.Port > 65535 {
        return fmt.Errorf("invalid server port: %d", c.Server.Port)
    }
    
    return nil
}
```

### 4. Use Type-Safe Getters

```go
func (c *Config) GetDatabaseDSN() string {
    return fmt.Sprintf(
        "host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
        c.Database.Host,
        c.Database.Port,
        c.Database.User,
        c.Database.Password,
        c.Database.DBName,
    )
}

func (c *Config) IsDevelopment() bool {
    return c.Server.Environment == "development"
}

func (c *Config) IsProduction() bool {
    return c.Server.Environment == "production"
}
```

### 5. Centralize Configuration

```go
package main

import (
    "log"
    "myapp/config"
)

var cfg *config.Config

func main() {
    var err error
    cfg, err = config.Load()
    if err != nil {
        log.Fatal("Failed to load config:", err)
    }
    
    if err := cfg.Validate(); err != nil {
        log.Fatal("Invalid configuration:", err)
    }
    
    // Use throughout application
    startServer(cfg)
}
```

## Complete Example

```go
package main

import (
    "fmt"
    "log"
    "os"
    "time"
    
    "github.com/joho/godotenv"
    "github.com/spf13/viper"
)

type Config struct {
    Database struct {
        Host     string
        Port     int
        User     string
        Password string
        DBName   string
    }
    Server struct {
        Port    int
        Timeout time.Duration
    }
    External struct {
        APIKey string
    }
}

func LoadConfig() (*Config, error) {
    // 1. Load .env file
    godotenv.Load()
    
    // 2. Setup Viper
    viper.SetConfigName(os.Getenv("APP_ENV"))
    viper.AddConfigPath("./config")
    viper.AutomaticEnv()
    
    // 3. Read config
    if err := viper.ReadInConfig(); err != nil {
        return nil, err
    }
    
    // 4. Unmarshal
    var cfg Config
    if err := viper.Unmarshal(&cfg); err != nil {
        return nil, err
    }
    
    // 5. Override with environment variables
    if apiKey := os.Getenv("API_KEY"); apiKey != "" {
        cfg.External.APIKey = apiKey
    }
    
    return &cfg, nil
}

func main() {
    cfg, err := LoadConfig()
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Config loaded: %+v\n", cfg)
}
```

## Summary

Environment configuration:
- **Environment Variables**: Dynamic configuration
- **godotenv**: Load from .env files
- **Viper**: Advanced config management
- **Secrets**: Secure sensitive data
- **Validation**: Ensure valid config
- **Type Safety**: Structured config

Essential for secure, flexible applications.
