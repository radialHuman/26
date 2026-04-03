# PASETO Explained Simply

Imagine you want to give someone a ticket that proves who they are and what they can do, like a movie ticket or a concert pass. In the digital world, we use things called "tokens" for this purpose. PASETO is a modern way to create and use these tokens.

## What is PASETO?
PASETO stands for **Platform-Agnostic Security Tokens**. It is a secure, easy-to-use standard for creating tokens that can be used to prove identity or permissions in web applications and APIs.

## Why PASETO?
Before PASETO, the most popular way to create tokens was with JWT (JSON Web Tokens). However, JWTs have some confusing options and security pitfalls that can lead to mistakes. PASETO was created to be:
- **Safer by default**: Removes insecure options and confusing settings.
- **Easier to use correctly**: Simple, clear rules for creating and verifying tokens.
- **Modern cryptography**: Uses up-to-date, strong encryption and signing methods.

## What Problem Does It Solve?
JWTs are flexible but can be dangerous if not used carefully. For example, you could accidentally use a weak algorithm or forget to check something important. PASETO solves this by:
- Only allowing safe algorithms.
- Making it hard to use incorrectly.
- Providing clear separation between public (shared) and private (secret) tokens.

## How Does PASETO Work?
- You create a token (like a digital ticket) that contains information (claims) about a user or action.
- The token is either **signed** (so you can verify it hasn't been changed) or **encrypted** (so only certain people can read it).
- When someone receives the token, they can check if it's valid and what it allows.

## When to Use PASETO?
- When you need to securely pass information between systems (like user identity or permissions).
- For authentication in web/mobile apps and APIs.
- When you want a safer, simpler alternative to JWT.

## How Does PASETO Achieve Security and Simplicity?
- **No algorithm confusion**: JWT lets you pick from many algorithms, some of which are insecure. PASETO only allows strong, safe choices.
- **Clear versioning**: Each PASETO token includes a version, so you always know what rules and algorithms are used.
- **Explicit purpose**: Tokens are either for public (signed) or local (encrypted) use—never both.
- **Modern crypto**: Uses strong, modern cryptographic primitives by default.

## How is PASETO Different from Its Predecessors (like JWT)?
- **No insecure options**: JWT supports weak algorithms (like "none" or outdated crypto); PASETO does not.
- **Simpler API**: JWT libraries can be complex and error-prone; PASETO libraries are designed to be simple and safe.
- **Safer defaults**: PASETO is designed so that the easiest way to use it is also the safest.
- **No ambiguity**: JWTs can be ambiguous about how they are validated; PASETO is always explicit.

## Real-World Analogy
- Imagine JWT is like a vending machine with lots of buttons—some give you snacks, some give you nothing, and some might even break the machine. PASETO is like a vending machine with only a few buttons, all of which give you exactly what you want, safely.

## Pros and Cons
**Pros:**
- Safer by default
- Simple, clear API
- No insecure algorithms
- Modern cryptography
- Explicit versioning and purpose

**Cons:**
- Newer, so smaller ecosystem than JWT
- Fewer libraries and integrations (but growing)
- Not as widely adopted (yet)

## Alternatives
- **JWT (JSON Web Token):** Most common, but can be misused and has security risks.
- **SAML:** Used in enterprise, but more complex and XML-based.
- **Opaque tokens:** Just a random string, requires server-side storage.

## How to Use PASETO in Python
1. **Install a PASETO library:**
   ```sh
   pip install paseto
   ```
2. **Create and verify a token:**
   ```python
   import paseto
   key = b"your-32-byte-secret-key-goes-here!"
   # Create a token (local, encrypted)
   token = paseto.create(
	   key=key,
	   purpose="local",
	   claims={"user_id": 123, "role": "admin"}
   )
   # Verify and decode
   data = paseto.parse(key=key, purpose="local", token=token)
   print(data)
   ```

## How to Use PASETO in Go
1. **Install a PASETO library:**
   ```sh
   go get github.com/o1egl/paseto
   ```
2. **Create and verify a token:**
   ```go
   package main
   import (
	   "fmt"
	   "github.com/o1egl/paseto"
	   "time"
   )
   func main() {
	   key := []byte("your-32-byte-secret-key-goes-here!")
	   now := time.Now()
	   jsonToken := paseto.JSONToken{
		   Audience:   "example",
		   Issuer:     "test",
		   Subject:    "user",
		   IssuedAt:   now,
		   Expiration: now.Add(1 * time.Hour),
		   NotBefore:  now,
		   Jti:        "unique-id",
		   Claims: map[string]interface{}{
			   "user_id": 123,
			   "role":    "admin",
		   },
	   }
	   v2 := paseto.NewV2()
	   token, err := v2.Encrypt(key, jsonToken, nil)
	   if err != nil {
		   panic(err)
	   }
	   fmt.Println("Token:", token)
	   // To decrypt and verify:
	   var newJsonToken paseto.JSONToken
	   var footer string
	   err = v2.Decrypt(token, key, &newJsonToken, &footer)
	   if err != nil {
		   panic(err)
	   }
	   fmt.Println("Claims:", newJsonToken.Claims)
   }
   ```

---

**References:**
- [PASETO Official Site](https://paseto.io/)
- [PASETO Python](https://github.com/rlittlefield/paseto)
- [PASETO Go](https://github.com/o1egl/paseto)
