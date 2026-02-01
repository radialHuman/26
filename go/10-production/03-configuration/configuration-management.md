# Configuration Management for Production Go Applications

## Overview
Proper configuration management is crucial for production systems. Go applications need to handle configurations across different environments while keeping secrets secure.

## Environment Variables

### Reading Environment Variables
```go
package main

import (
    "os"
    "log"
)

func main() {
    // Simple environment variable read
    dbHost := os.Getenv("DB_HOST")
    if dbHost == "" {
        dbHost = "localhost" // default value
    }
    
    // Required environment variable
    apiKey := os.Getenv("API_KEY")
    if apiKey == "" {
        log.Fatal("API_KEY environment variable is required")
    }
}
```

### Using Viper for Configuration

```go
package config

import (
    "github.com/spf13/viper"
)

type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Redis    RedisConfig
    AWS      AWSConfig
}

type ServerConfig struct {
    Port         int    `mapstructure:"port"`
    Host         string `mapstructure:"host"`
    ReadTimeout  int    `mapstructure:"read_timeout"`
    WriteTimeout int    `mapstructure:"write_timeout"`
}

type DatabaseConfig struct {
    Host     string `mapstructure:"host"`
    Port     int    `mapstructure:"port"`
    User     string `mapstructure:"user"`
    Password string `mapstructure:"password"`
    DBName   string `mapstructure:"dbname"`
    SSLMode  string `mapstructure:"sslmode"`
}

type RedisConfig struct {
    Host     string `mapstructure:"host"`
    Port     int    `mapstructure:"port"`
    Password string `mapstructure:"password"`
    DB       int    `mapstructure:"db"`
}

type AWSConfig struct {
    Region          string `mapstructure:"region"`
    AccessKeyID     string `mapstructure:"access_key_id"`
    SecretAccessKey string `mapstructure:"secret_access_key"`
}

func Load() (*Config, error) {
    viper.SetConfigName("config")
    viper.SetConfigType("yaml")
    viper.AddConfigPath(".")
    viper.AddConfigPath("./config")
    viper.AddConfigPath("/etc/myapp/")
    
    // Environment variables override
    viper.AutomaticEnv()
    viper.SetEnvPrefix("MYAPP")
    
    // Read config file
    if err := viper.ReadInConfig(); err != nil {
        if _, ok := err.(viper.ConfigFileNotFoundError); ok {
            // Config file not found; use defaults
            return loadDefaults(), nil
        }
        return nil, err
    }
    
    var config Config
    if err := viper.Unmarshal(&config); err != nil {
        return nil, err
    }
    
    return &config, nil
}

func loadDefaults() *Config {
    return &Config{
        Server: ServerConfig{
            Port:         8080,
            Host:         "0.0.0.0",
            ReadTimeout:  15,
            WriteTimeout: 15,
        },
    }
}
```

### Configuration File (config.yaml)
```yaml
server:
  port: 8080
  host: 0.0.0.0
  read_timeout: 15
  write_timeout: 15

database:
  host: localhost
  port: 5432
  user: postgres
  password: ${DB_PASSWORD}
  dbname: myapp
  sslmode: disable

redis:
  host: localhost
  port: 6379
  password: ""
  db: 0

aws:
  region: us-east-1
  access_key_id: ${AWS_ACCESS_KEY_ID}
  secret_access_key: ${AWS_SECRET_ACCESS_KEY}
```

## Using envconfig for Struct-Based Config

```go
package config

import (
    "github.com/kelseyhightower/envconfig"
)

type AppConfig struct {
    Port          int    `envconfig:"PORT" default:"8080"`
    DatabaseURL   string `envconfig:"DATABASE_URL" required:"true"`
    RedisURL      string `envconfig:"REDIS_URL" default:"redis://localhost:6379"`
    LogLevel      string `envconfig:"LOG_LEVEL" default:"info"`
    JWTSecret     string `envconfig:"JWT_SECRET" required:"true"`
    
    // AWS Configuration
    AWSRegion     string `envconfig:"AWS_REGION" default:"us-east-1"`
    S3Bucket      string `envconfig:"S3_BUCKET" required:"true"`
    
    // Feature Flags
    EnableMetrics bool   `envconfig:"ENABLE_METRICS" default:"true"`
    EnableTracing bool   `envconfig:"ENABLE_TRACING" default:"false"`
}

func LoadFromEnv() (*AppConfig, error) {
    var cfg AppConfig
    if err := envconfig.Process("", &cfg); err != nil {
        return nil, err
    }
    return &cfg, nil
}
```

## Secret Management

### AWS Secrets Manager
```go
package secrets

import (
    "context"
    "encoding/json"
    
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

type SecretsManager struct {
    client *secretsmanager.Client
}

func NewSecretsManager(ctx context.Context) (*SecretsManager, error) {
    cfg, err := config.LoadDefaultConfig(ctx)
    if err != nil {
        return nil, err
    }
    
    return &SecretsManager{
        client: secretsmanager.NewFromConfig(cfg),
    }, nil
}

func (sm *SecretsManager) GetSecret(ctx context.Context, secretName string) (map[string]string, error) {
    result, err := sm.client.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
        SecretId: &secretName,
    })
    if err != nil {
        return nil, err
    }
    
    var secrets map[string]string
    if err := json.Unmarshal([]byte(*result.SecretString), &secrets); err != nil {
        return nil, err
    }
    
    return secrets, nil
}
```

### HashiCorp Vault Integration
```go
package secrets

import (
    "context"
    "fmt"
    
    vault "github.com/hashicorp/vault/api"
)

type VaultClient struct {
    client *vault.Client
}

func NewVaultClient(address, token string) (*VaultClient, error) {
    config := vault.DefaultConfig()
    config.Address = address
    
    client, err := vault.NewClient(config)
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
    
    if secret == nil {
        return nil, fmt.Errorf("secret not found at path: %s", path)
    }
    
    return secret.Data, nil
}

func (v *VaultClient) GetDatabaseCredentials(role string) (*DatabaseCreds, error) {
    path := fmt.Sprintf("database/creds/%s", role)
    secret, err := v.client.Logical().Read(path)
    if err != nil {
        return nil, err
    }
    
    return &DatabaseCreds{
        Username: secret.Data["username"].(string),
        Password: secret.Data["password"].(string),
    }, nil
}

type DatabaseCreds struct {
    Username string
    Password string
}
```

## Feature Flags

### Simple Feature Flag Implementation
```go
package features

import (
    "sync"
)

type FeatureFlags struct {
    mu    sync.RWMutex
    flags map[string]bool
}

func NewFeatureFlags() *FeatureFlags {
    return &FeatureFlags{
        flags: make(map[string]bool),
    }
}

func (ff *FeatureFlags) Enable(feature string) {
    ff.mu.Lock()
    defer ff.mu.Unlock()
    ff.flags[feature] = true
}

func (ff *FeatureFlags) Disable(feature string) {
    ff.mu.Lock()
    defer ff.mu.Unlock()
    ff.flags[feature] = false
}

func (ff *FeatureFlags) IsEnabled(feature string) bool {
    ff.mu.RLock()
    defer ff.mu.RUnlock()
    return ff.flags[feature]
}

// Usage example
func (s *Service) ProcessOrder(order Order) error {
    if s.features.IsEnabled("new_payment_flow") {
        return s.processOrderV2(order)
    }
    return s.processOrderV1(order)
}
```

## Configuration Hot-Reloading

```go
package config

import (
    "log"
    "sync"
    
    "github.com/fsnotify/fsnotify"
    "github.com/spf13/viper"
)

type HotReloadConfig struct {
    mu     sync.RWMutex
    config *Config
}

func NewHotReloadConfig(configPath string) (*HotReloadConfig, error) {
    hrc := &HotReloadConfig{}
    
    viper.SetConfigFile(configPath)
    if err := viper.ReadInConfig(); err != nil {
        return nil, err
    }
    
    var cfg Config
    if err := viper.Unmarshal(&cfg); err != nil {
        return nil, err
    }
    hrc.config = &cfg
    
    // Watch for config changes
    viper.OnConfigChange(func(e fsnotify.Event) {
        log.Println("Config file changed:", e.Name)
        
        var newCfg Config
        if err := viper.Unmarshal(&newCfg); err != nil {
            log.Printf("Error reloading config: %v", err)
            return
        }
        
        hrc.mu.Lock()
        hrc.config = &newCfg
        hrc.mu.Unlock()
        
        log.Println("Config reloaded successfully")
    })
    viper.WatchConfig()
    
    return hrc, nil
}

func (hrc *HotReloadConfig) Get() *Config {
    hrc.mu.RLock()
    defer hrc.mu.RUnlock()
    return hrc.config
}
```

## Multi-Environment Configuration

### Directory Structure
```
config/
├── base.yaml          # Common configs
├── development.yaml   # Dev overrides
├── staging.yaml       # Staging overrides
├── production.yaml    # Production configs
└── local.yaml        # Local developer overrides (gitignored)
```

### Environment-Specific Loading
```go
package config

import (
    "fmt"
    "os"
    
    "github.com/spf13/viper"
)

func LoadEnvironmentConfig() (*Config, error) {
    env := os.Getenv("APP_ENV")
    if env == "" {
        env = "development"
    }
    
    // Load base config
    viper.SetConfigName("base")
    viper.AddConfigPath("./config")
    if err := viper.ReadInConfig(); err != nil {
        return nil, err
    }
    
    // Merge environment-specific config
    viper.SetConfigName(env)
    if err := viper.MergeInConfig(); err != nil {
        return nil, fmt.Errorf("error loading %s config: %w", env, err)
    }
    
    // Merge local config if exists (optional)
    viper.SetConfigName("local")
    _ = viper.MergeInConfig() // Ignore error if local config doesn't exist
    
    var config Config
    if err := viper.Unmarshal(&config); err != nil {
        return nil, err
    }
    
    return &config, nil
}
```

## Best Practices

### 1. **Use 12-Factor App Principles**
- Store config in environment
- Strict separation of config from code
- No hardcoded credentials

### 2. **Validation**
```go
func (c *Config) Validate() error {
    if c.Server.Port < 1 || c.Server.Port > 65535 {
        return fmt.Errorf("invalid port: %d", c.Server.Port)
    }
    
    if c.Database.Host == "" {
        return fmt.Errorf("database host is required")
    }
    
    if c.JWTSecret == "" {
        return fmt.Errorf("JWT secret is required")
    }
    
    return nil
}
```

### 3. **Default Values**
- Always provide sensible defaults
- Only require truly necessary config

### 4. **Secret Rotation**
- Implement automatic secret rotation
- Use secret management systems
- Never commit secrets to version control

### 5. **Configuration Documentation**
```go
// Document all configuration options
type Config struct {
    // Server configuration
    Server ServerConfig `mapstructure:"server"`
    
    // Database connection settings
    Database DatabaseConfig `mapstructure:"database"`
    
    // Cache configuration (Redis)
    Cache CacheConfig `mapstructure:"cache"`
}
```

## Testing Configuration

```go
package config_test

import (
    "os"
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestLoadFromEnv(t *testing.T) {
    // Set test environment variables
    os.Setenv("DATABASE_URL", "postgres://localhost/test")
    os.Setenv("JWT_SECRET", "test-secret")
    os.Setenv("S3_BUCKET", "test-bucket")
    defer func() {
        os.Unsetenv("DATABASE_URL")
        os.Unsetenv("JWT_SECRET")
        os.Unsetenv("S3_BUCKET")
    }()
    
    cfg, err := LoadFromEnv()
    require.NoError(t, err)
    
    assert.Equal(t, "postgres://localhost/test", cfg.DatabaseURL)
    assert.Equal(t, "test-secret", cfg.JWTSecret)
    assert.Equal(t, 8080, cfg.Port) // default value
}

func TestConfigValidation(t *testing.T) {
    tests := []struct {
        name    string
        config  Config
        wantErr bool
    }{
        {
            name: "valid config",
            config: Config{
                Server:   ServerConfig{Port: 8080},
                Database: DatabaseConfig{Host: "localhost"},
            },
            wantErr: false,
        },
        {
            name: "invalid port",
            config: Config{
                Server:   ServerConfig{Port: 99999},
                Database: DatabaseConfig{Host: "localhost"},
            },
            wantErr: true,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := tt.config.Validate()
            if tt.wantErr {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

## Summary

Effective configuration management involves:
- **Environment Variables**: For deployment-specific settings
- **Configuration Files**: For complex, structured configuration
- **Secret Management**: For sensitive data
- **Feature Flags**: For gradual rollouts
- **Hot Reloading**: For runtime updates without restarts
- **Validation**: Ensuring configuration correctness
- **Documentation**: Clear configuration options

Choose the right approach based on your application's complexity and deployment requirements.
