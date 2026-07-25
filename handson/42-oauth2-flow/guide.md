# OAuth2 Authorization Code Flow

## What it is
The mechanism behind "Login with Google." A user authorizes your application to access their data at another service (Google, GitHub) without giving your app their password. The user authenticates with the identity provider; the provider issues a token to your app.

## Why it matters
Every application that supports social login or third-party API access uses OAuth2. Interviewers ask "how does login with Google work?" or "how does Spotify access your Google Calendar?" Understanding the flow from first principles is a senior-level expectation.

## What to know before starting
- What an access token is: a credential proving the bearer has been authorized for specific actions
- What a redirect URI is: where the identity provider sends the user after authorization
- HTTPS: OAuth2 is completely insecure over plain HTTP — never build this without TLS in production

## How to approach it
The Authorization Code Flow has 6 steps:

1. App redirects user to `provider.com/authorize?client_id=X&redirect_uri=Y&scope=read:profile&state=Z`
2. User logs in at the provider and approves the scopes
3. Provider redirects back to `your-app.com/callback?code=ABC&state=Z`
4. App (backend) exchanges `code` + `client_secret` for tokens: `POST /token`
5. Provider returns `access_token` (short-lived) + `refresh_token` (long-lived)
6. App uses `access_token` in `Authorization: Bearer` header to call provider APIs

The `state` parameter prevents CSRF. The code is single-use and short-lived (10 minutes).

## What to build (minimal working version)
- A fake "identity provider" FastAPI service with `/authorize` and `/token` endpoints
- A "client app" FastAPI service with `/login` (redirects to provider) and `/callback` (exchanges code)
- Implement state: generate random state on `/login`, verify it matches on `/callback`
- Implement code exchange: server-to-server POST with client_id, client_secret, code → returns tokens
- Store tokens; use access_token to call a protected `/userinfo` endpoint on the provider

## Knobs to turn
- Replay the authorization code (use it twice). Confirm provider rejects it (codes are single-use).
- Expire the access_token after 5 minutes. Implement token refresh using the refresh_token.
- Remove the state check. Show how CSRF could redirect a different user's authorization to your session.
- Add PKCE (Proof Key for Code Exchange): for public clients (mobile apps) that can't safely store client_secret.

## How it connects to other components
- `31-token-auth` — the access_token is a JWT; validation is the same
- `48-cors-csrf` — the `state` parameter prevents the same CSRF attack you build in 48
- `30-api-gateway` — gateway validates OAuth tokens before routing to backend services

## Real tool / production system
Google Identity, GitHub OAuth, Okta, Auth0 all implement this flow. `authlib` Python library implements OAuth2 client and server. FastAPI-Users for production auth. What you're missing: PKCE for mobile/SPA clients, token revocation, introspection endpoint, OpenID Connect (OAuth2 extension for authentication, not just authorization).
