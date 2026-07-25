# Database-per-Service

## What it is
A microservices principle: each service owns its own database, and no other service can query it directly. Cross-service data access must go through the service's API.

## Why it matters
Shared databases create hidden coupling. If Service A and Service B both write to the same DB, they're coupled at the data layer — schema changes break both services, one service's slow query impacts the other's transactions, and you can't scale them independently. Senior engineers are expected to argue for and design around database isolation. Interviewers probe this in any microservices design.

## What to know before starting
- What coupling means: two services that can't be changed/deployed independently
- The difference between data ownership (who can write) and data access (who can read)
- Why JOINs across service boundaries are impossible when data is in different databases

## How to approach it
The hard problems that arise when you isolate databases:

1. **Cross-service queries**: Order service needs customer name from Customer service. Options: API composition (call the API), CQRS read model (Order service maintains a denormalized copy), or GraphQL stitching.
2. **Cross-service transactions**: Can't have a DB transaction across two services. Use Saga pattern.
3. **Data duplication**: maintaining a copy of customer data in the order service. How do you keep it consistent?

## What to build (minimal working version)
- `user-service` with its own SQLite DB: `users` table
- `order-service` with its own SQLite DB: `orders` table + `users_cache` table (denormalized copy)
- Order creation: create order, look up user via API call to user-service
- Implement eventual consistency: user-service publishes `user_updated` events; order-service subscribes and updates its local `users_cache`
- Test: update user name in user-service; trace how and when it propagates to order-service's cache

## Knobs to turn
- What happens if user-service is down when order-service tries to look up a user? (Use cached copy or fail)
- Update user name while order-service is offline. When it comes back online, does it get the update?
- Delete a user in user-service. Should the order history in order-service also be deleted? (Data lifecycle across services)
- Try a JOIN across the two DBs. Confirm it's impossible. Replace with API composition.

## How it connects to other components
- `16-saga-pattern` — cross-service operations need Saga instead of DB transactions
- `21-outbox-pattern` — reliable event publishing when data changes (for cross-service sync)
- `15-cache-invalidation` — order-service's user cache must be invalidated when user-service data changes

## Real tool / production system
This is an architectural pattern, not a specific tool. PostgreSQL schemas (same DB, different schemas) are a weaker isolation variant. Service meshes provide network-level enforcement. What you're missing: enforcing the boundary (you need tooling to prevent a service from connecting to another service's DB), data ownership governance, and handling the "reporting" use case (analytics that need data from all services — use a data warehouse).
