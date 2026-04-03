# Quick Start Guide

## Just Starting? Use REST
Most common, simplest, best ecosystem.

## Need Real-Time?
- **Server→Client only**: SSE
- **Bidirectional**: WebSockets
- **Video/Audio**: WebRTC

## Building Microservices?
- **Internal**: gRPC
- **External**: REST
- **Events**: Kafka

## Need Messaging?
- **High throughput**: Kafka
- **Task queues**: RabbitMQ
- **IoT**: MQTT
- **Simple**: Redis Pub/Sub

## Technology Cheat Sheet

REST: `GET /api/users/123`  
GraphQL: `{user(id:123){name,email}}`  
gRPC: Protocol Buffers + HTTP/2  
WebSocket: Persistent bidirectional  
SSE: Server push over HTTP  
Kafka: Distributed event log  
RabbitMQ: Message broker  
MCP: AI tool protocol  

## Learning Order
1. REST (foundation)
2. WebSockets (real-time)
3. gRPC (performance)
4. Kafka (events)
5. Others as needed

## When in Doubt
Start simple (REST), add complexity only when needed.
