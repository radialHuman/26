# Configuration Management in Go

Managing configuration is crucial for scalable and maintainable Go applications. This chapter covers environment variables, config files, flags, and libraries like Viper.

---

## Environment Variables

Use `os.Getenv` and `os.LookupEnv` to read environment variables:
```go
import "os"
port := os.Getenv("PORT")
```

---

## Command-Line Flags

Use the `flag` package for command-line arguments:
```go
import "flag"
var port = flag.String("port", "8080", "server port")
flag.Parse()
```

---

## Config Files

Common formats: JSON, YAML, TOML. Use libraries to parse config files.

### Example with Viper
```go
import (
    "github.com/spf13/viper"
)
viper.SetConfigName("config")
viper.AddConfigPath(".")
err := viper.ReadInConfig()
if err != nil {
    panic(err)
}
port := viper.GetString("server.port")
```

---

## Best Practices
- Use environment variables for secrets and environment-specific settings.
- Use config files for complex/static configuration.
- Validate configuration at startup.
- Document all configuration options.
- Avoid hardcoding sensitive data.

---

Proper configuration management makes your Go applications portable, secure, and easy to operate.