# CORS + CSRF

## What it is
**CORS** (Cross-Origin Resource Sharing): a browser security mechanism that restricts which origins can make requests to your API. **CSRF** (Cross-Site Request Forgery): an attack where a malicious site tricks a user's browser into making authenticated requests to your API.

## Why it matters
These are foundational web security concepts. Every API exposed to browsers must handle both. Interviewers ask "how do you secure your API?" — CORS and CSRF are the expected answers for browser-facing APIs. Getting them wrong is a critical security vulnerability.

## What to know before starting
- What an origin is: `scheme + domain + port`. `http://example.com` and `https://example.com` are different origins.
- The same-origin policy: by default, browsers block cross-origin `XMLHttpRequest` and `fetch` requests
- What a preflight request is: for non-simple requests, the browser first sends `OPTIONS` to ask if the cross-origin request is allowed
- Session cookies: browsers automatically send them with every request to the domain — this is what CSRF exploits

## How to approach it
**CORS**: Your API sets response headers that tell the browser which origins are allowed. The browser enforces this — your server can't. Key headers: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`.

**CSRF**: An attacker's page can trigger a form POST to your API, and the browser sends the user's session cookie. Defenses: CSRF token (unique per session, included in forms, verified on POST), SameSite cookie attribute (`SameSite=Strict` or `Lax` — browser won't send cookie on cross-origin requests), or use Authorization header instead of cookies (immune to CSRF).

## What to build (minimal working version)
- FastAPI API on `localhost:8000`; a test HTML page on `localhost:3000`
- Without CORS headers: open the test page, make a fetch to the API, observe the browser block
- Add CORS middleware: `Access-Control-Allow-Origin: http://localhost:3000`; confirm fetch succeeds
- CSRF demo: a fake "attacker" page that submits a form POST to your API using the user's session cookie
- CSRF token: generate a token on login, embed in form, verify on POST; test that attacker page's form is rejected
- SameSite cookies: set `Set-Cookie: session=abc; SameSite=Strict`; confirm attacker page can't trigger the request

## Knobs to turn
- Set `Access-Control-Allow-Origin: *`. What is the security implication?
- Allow credentials (`Access-Control-Allow-Credentials: true`) with wildcard origin. What happens? (Browser blocks this)
- Remove CSRF protection. Build the attacker page. Does the attack succeed?
- Switch from cookies to `Authorization: Bearer <token>`. Does the CSRF attack still work? (No — attacker can't read or set headers)

## How it connects to other components
- `31-token-auth` — JWT in Authorization header is CSRF-immune; JWT in cookies needs CSRF protection
- `42-oauth2-flow` — `state` parameter in OAuth2 prevents the same CSRF attack
- `30-api-gateway` — CORS headers should be added at the gateway, not each service

## Real tool / production system
FastAPI's `CORSMiddleware`. Django's CSRF middleware. `SameSite=Lax` is now the browser default for most cookies. What you're missing: preflight caching (`Access-Control-Max-Age`), per-route CORS policies, CSRF token rotation, and double-submit cookie pattern (alternative to server-side CSRF tokens).
