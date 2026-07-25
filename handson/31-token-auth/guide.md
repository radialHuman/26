# Token Auth — JWT from Scratch

## What it is
JSON Web Tokens (JWT) are a way to represent authentication claims as a signed, self-contained token. The server creates a token containing the user's identity and signs it with a secret key. The client sends this token on every request. The server verifies the signature without hitting a database.

## Why it matters
Stateless auth at scale: no session DB needed, any server can verify any token. Used in every modern API. Interviewers ask "how does auth work?" in every system design. You need to understand token structure, signing, expiry, and the difference from sessions.

## What to know before starting
- Base64 encoding: turns binary to URL-safe text
- HMAC-SHA256: a signing algorithm that produces a hash using a secret key; impossible to forge without the key
- The three parts of a JWT: `header.payload.signature`

## How to approach it
A JWT is: `base64(header) + "." + base64(payload) + "." + HMAC(header + "." + payload, secret_key)`

To verify: re-compute the HMAC from header + payload; compare to the signature in the token. If they match, the token hasn't been tampered with. Check the `exp` claim for expiry.

Build this with only Python stdlib (`hmac`, `hashlib`, `json`, `base64`) before using any JWT library. This forces understanding.

## What to build (minimal working version)
- `encode(payload, secret, expiry_seconds)` → JWT string (no libraries, pure Python)
- `decode(token, secret)` → payload dict or raise `InvalidTokenError` / `ExpiredTokenError`
- FastAPI `POST /login` returns a JWT; `GET /me` requires it in `Authorization: Bearer <token>`
- Test: tamper with the payload; confirm signature verification fails
- Test: use an expired token; confirm `exp` check rejects it

## Knobs to turn
- Remove the `exp` check. Issue a token. A year later — still valid. Why is this dangerous?
- Switch signing algorithm from HS256 to RS256 (RSA). What changes? When would you use asymmetric signing?
- Implement token refresh: short-lived access token (15min) + long-lived refresh token (7 days)
- Add a `jti` (JWT ID) claim; maintain a revocation list. Now you can invalidate individual tokens.

## How it connects to other components
- `30-api-gateway` — gateway validates JWT before routing to backends
- `42-oauth2-flow` — OAuth2 returns JWTs as access tokens
- `48-cors-csrf` — understand why JWT in headers is safer than cookies for CSRF

## Real tool / production system
`python-jose` or `PyJWT` libraries. Auth0, Keycloak issue JWTs. AWS Cognito uses JWTs. What you're missing: key rotation (changing the secret without invalidating all tokens), JWK (JSON Web Key) endpoints for public key distribution, and token introspection endpoints.
