# API Versioning

## What it is
A strategy for evolving a public API while maintaining backward compatibility with existing clients. When you need to make a breaking change, versioning allows old clients to keep using the old behavior while new clients use the new.

## Why it matters
Public APIs have clients you don't control. If you change a field name, remove an endpoint, or change a response structure, you break every existing integration. Interviewers ask "how would you evolve this API?" in senior API design rounds. The answer matters more than the specific strategy chosen.

## What to know before starting
- What a breaking change is: any change that causes existing clients to fail (removed field, changed type, renamed endpoint)
- What a non-breaking change is: adding an optional field, adding a new endpoint, loosening validation
- Semantic versioning (semver): major.minor.patch — major version bumps signal breaking changes

## How to approach it
Three strategies, each with trade-offs:

1. **URL versioning** (`/v1/users`, `/v2/users`): explicit, easy to route, easy to deprecate. Pollutes URLs. Most common.
2. **Header versioning** (`Accept: application/vnd.api+json;version=2`): clean URLs, but headers are less visible. Used by GitHub.
3. **Query parameter** (`/users?api_version=2`): easy to test in browser, but pollutes query strings.

The harder question: how do you run v1 and v2 simultaneously? Options: separate code paths in same service, separate deployments, or a versioning adapter layer.

## What to build (minimal working version)
- FastAPI app with `/v1/users/{id}` and `/v2/users/{id}` returning different response shapes
- V1: `{"id": 1, "name": "Alice"}` vs V2: `{"id": 1, "first_name": "Alice", "last_name": "Smith"}`
- Implement header versioning: route based on `Accept: application/vnd.myapi.v2+json`
- Add deprecation header: `Deprecation: true`, `Sunset: 2025-12-31` on v1 responses
- Version adapter: a middleware that transforms v2 requests/responses to v1 format internally

## Knobs to turn
- Add a new optional field to v1 (non-breaking). Confirm existing clients don't break.
- Remove a required field from v1 (breaking). This should go into v2, not v1.
- How do you route `/v1` and `/v2` to different backend deployments? Implement at the gateway.
- Implement an API changelog: every version difference is documented in machine-readable format.

## How it connects to other components
- `30-api-gateway` — gateway handles version routing transparently to backend services
- `40-binary-serialization` — Protobuf has built-in schema evolution; REST needs explicit versioning
- `19-request-validation` — version-specific validation rules

## Real tool / production system
Stripe uses date-based versioning (`Stripe-Version: 2024-01-15`). GitHub uses `Accept` header versioning. Twitter uses URL versioning. AWS maintains old API versions indefinitely. What you're missing: automated backward compatibility testing, client SDK versioning, and versioned documentation.
