import redis

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Test the connection
try:
    print(r.ping())  # Should return True if connected
    # Get all keys
    keys = r.keys('*')
    print("Keys in Redis:", keys)

    # Print values for each key
    for key in keys:
        value = r.get(key)
    
        print(f"{key}: {value}")
except Exception as e:
    print("Connection failed:", e)   
