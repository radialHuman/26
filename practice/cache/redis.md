## Install on Windows
1. Terminal : wsl --install
    - installs ubuntu in windows
2. Commands
    ```
        2  sudo apt-get update
        3  sudo apt-get install redis
        4  sudo service redis-server start
        5  redis-cli ping
    ```
- must return PONG
3. Connect to it
    ```
    redis-cli
    ```
- Shows something like this 127.0.0.1:6379> 
4. Connect to it via code
    ```python
    !pip install redis   

    import redis

    # Connect to Redis
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)

    # Test the connection
    try:
        print(r.ping())  # Should return True if connected
            
    ```
    - must say True

    ```go
    go get github.com/go-redis/redis/v8   

    package main

    import (
        "context"
        "fmt"
        "github.com/go-redis/redis/v8"
    )

    func main() {
        ctx := context.Background()

        // Connect to Redis
        rdb := redis.NewClient(&redis.Options{
            Addr:     "localhost:6379", // Redis server address
            Password: "",               // No password by default
            DB:       0,                // Use default DB
        })

        // Test connection
        pong, err := rdb.Ping(ctx).Result()
        if err != nil {
            fmt.Println("Connection failed:", err)
            return
        }
        fmt.Println("Connected:", pong)
    ```

5. 