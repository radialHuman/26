# Binary Serialization Trade-offs

## What it is
The choice between how you encode data for transmission between services. JSON is human-readable text. Binary formats (Protocol Buffers, MessagePack, Avro) encode the same data in fewer bytes with faster parsing.

## Why it matters
At 100,000 requests/second, a 5× reduction in payload size and a 10× reduction in parsing time matters significantly. Interviewers ask "how do your internal services communicate?" and "why would you choose gRPC over REST?" — understanding serialization is the answer.

## What to know before starting
- What serialization is: converting an in-memory object to bytes for storage or transmission
- What a schema is: a definition of the structure of your data (field names, types, required/optional)
- JSON's weaknesses: no schema enforcement, verbose field names repeated on every message, dynamic typing

## How to approach it
Compare three approaches by implementing the same data structure in each:

**JSON**: `{"user_id": 12345, "name": "Alice", "score": 98.6}` — human readable, self-describing, no schema.

**MessagePack**: binary JSON. Same structure, no schema, but integers and strings encoded compactly. No code generation needed.

**Protobuf**: schema-first. Define `User` in a `.proto` file. Generate Python code. Encode/decode using generated classes. Schema is shared between producer and consumer. Adding a field is backward compatible; renaming breaks compatibility.

## What to build (minimal working version)
- Define a `User` object with 5 fields
- Serialize 10,000 users to JSON; measure: size in bytes, serialization time, deserialization time
- Same with `msgpack` library; compare size and speed
- Same with `google.protobuf` (from a hand-written `.proto`); compare all three
- Try sending an unknown field in JSON (receiver ignores it); try in Protobuf (also ignored — backward compatible)

## Knobs to turn
- Add a new field to the schema. In JSON: just add it. In Protobuf: add with new field number. What breaks?
- Remove a field from the schema. In Protobuf: what happens to receivers that still expect it?
- Benchmark 1M serializations of each. Chart the results.
- What if two services use different versions of the schema (one has field 5, one doesn't)? This is schema evolution — test forward and backward compatibility.

## How it connects to other components
- `30-api-gateway` — gateway may need to transcode between JSON (external) and Protobuf (internal)
- `09-message-queue` — Kafka messages use Avro or Protobuf with a schema registry
- `40-binary-serialization` feeds into any component that communicates between services at high volume

## Real tool / production system
gRPC uses Protobuf exclusively. Kafka with Confluent Schema Registry uses Avro. Apache Thrift is a Facebook alternative. `protobuf` Python library, `msgpack` Python library. What you're missing: schema registry (central store of all schemas, with version control), code generation pipeline, and schema compatibility enforcement (prevent breaking changes from being deployed).
