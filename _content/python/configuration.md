# Configuration Management in Python

Managing configuration is essential for scalable apps. This chapter covers environment variables, config files, and libraries like configparser, dynaconf, and pydantic.

---

## Environment Variables
```python
import os
api_key = os.getenv("API_KEY")
```

---

## configparser
```python
import configparser
config = configparser.ConfigParser()
config.read('config.ini')
value = config['section']['key']
```

---

## dynaconf
- Flexible config management for envs, files, and secrets.
```python
from dynaconf import Dynaconf
settings = Dynaconf(settings_files=['settings.toml'])
```

---

## pydantic
- Data validation and settings management.
```python
from pydantic import BaseSettings
class Settings(BaseSettings):
    api_key: str
settings = Settings()
```

---

## Best Practices
- Use env vars for secrets and environment-specific config.
- Validate config at startup.
- Document all config options.

---

Proper config management makes your Python apps portable and secure.