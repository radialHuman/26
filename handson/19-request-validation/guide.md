# Request Validation + Sanitization

## What it is
Checking and cleaning all incoming data at the service boundary before it touches business logic or the database. Validation ensures data is the right shape and type. Sanitization removes or escapes dangerous content.

## Why it matters
Security boundary: injection attacks (SQL, command, XSS) come from unvalidated input. Every OWASP Top 10 list includes input validation failures. In interviews, when you design an API, mentioning "validate at the boundary" signals you think about security and correctness.

## What to know before starting
- What SQL injection is: user input interpreted as SQL commands
- What XSS is: user input rendered as executable HTML/JavaScript
- Pydantic's model validation (used in FastAPI): how it automatically rejects malformed input

## How to approach it
Validation has three layers:
1. **Type and shape**: is this a string? An integer in range 1–100? A valid email format?
2. **Business rules**: does this user ID exist? Is this date in the future?
3. **Sanitization**: strip HTML tags from user-provided strings; escape special characters

The key principle: reject early, reject loudly. Return a 422 with specific field errors rather than letting bad data propagate.

## What to build (minimal working version)
- FastAPI `POST /users` with Pydantic model: required fields, type constraints, regex validation for email
- Add custom validator: username must be alphanumeric, 3–30 characters
- Add business rule validation: check the DB that username is not already taken
- Implement a sanitizer: strip HTML tags from a `bio` field (use `bleach` or manual regex)
- Test SQL injection attempt: input `'; DROP TABLE users; --` and confirm it's rejected or escaped

## Knobs to turn
- Remove Pydantic validation. Send malformed data directly to DB. What happens?
- Try XSS: store `<script>alert(1)</script>` in a bio field. Render it in an HTML response. Does it execute?
- Add rate limiting on failed validation (clients that send lots of invalid requests get throttled).
- Add a max payload size check: reject requests over 1MB.

## How it connects to other components
- `30-api-gateway` — gateway is the ideal place for validation before requests reach services
- `48-cors-csrf` — CSRF and CORS are related security concerns at the boundary
- `31-token-auth` — validate tokens before validating request body

## Real tool / production system
FastAPI + Pydantic handles type/shape validation automatically. `bleach` for HTML sanitization. `cerberus` or `marshmallow` as alternatives. What you're missing: file upload validation (type, size, content), deep object validation, and centralized validation schema registry.
