# Networking Fundamentals for Backend Engineers

Understanding networking is essential for building and operating backend systems. This guide covers HTTP internals, TLS, TCP, DNS, reverse proxies, CDNs, SRV records, and load balancers.

---

## HTTP Basics
- Request/Response model, methods (GET/POST/PUT/DELETE), headers, status codes.
- HTTP/1.1 vs HTTP/2 vs HTTP/3 basics.

---

## HTTP Protocol Versions: 1.0, 1.1, 2, and 3

### HTTP/1.0
- Introduced in 1996, the first widely adopted version.
- Each request opens a new TCP connection (no connection reuse).
- No support for persistent connections or pipelining.
- No Host header (cannot serve multiple domains from one IP without hacks).
- Simple, but inefficient for modern web apps.

### HTTP/1.1
- Standardized in 1997, still widely used.
- **Persistent Connections:** Supports `keep-alive` by default, allowing multiple requests/responses per TCP connection.
- **Pipelining:** Allows multiple requests to be sent without waiting for responses (rarely used due to head-of-line blocking).
- **Chunked Transfer Encoding:** Enables streaming of data when the total size is unknown.
- **Host Header:** Allows virtual hosting (multiple domains per IP).
- **Better Caching and Compression:** Adds cache control headers and support for gzip/deflate.
- **Limitations:** Still suffers from head-of-line blocking and TCP inefficiencies for many small requests.

### HTTP/2
- Published in 2015, designed for performance.
- **Binary Protocol:** More efficient parsing and less ambiguity than text-based HTTP/1.x.
- **Multiplexing:** Multiple streams (requests/responses) over a single TCP connection, eliminating head-of-line blocking at the HTTP layer.
- **Header Compression:** Uses HPACK to reduce header size and bandwidth.
- **Server Push:** Server can proactively send resources to the client before requested.
- **Prioritization:** Requests can be prioritized for better resource allocation.
- **Backwards Compatible:** Uses the same semantics as HTTP/1.1 (methods, status codes, URIs).
- **Limitations:** Still uses TCP, so head-of-line blocking can occur at the transport layer if a packet is lost.

### HTTP/3
- Standardized in 2022, based on QUIC (UDP-based transport).
- **QUIC Protocol:** Runs over UDP, provides built-in encryption (TLS 1.3), multiplexing, and connection migration.
- **No TCP Head-of-Line Blocking:** Each stream is independent, so packet loss on one stream doesn't block others.
- **Faster Handshakes:** 0-RTT and 1-RTT connection setup, reducing latency.
- **Improved Performance on Mobile/Unstable Networks:** Connection migration allows seamless switching between networks (e.g., Wi-Fi to cellular).
- **Adoption:** Used by major providers (Google, Facebook, Cloudflare). Supported in modern browsers.

### Summary Table
| Feature                | HTTP/1.0 | HTTP/1.1 | HTTP/2 | HTTP/3 |
|------------------------|----------|----------|--------|--------|
| Persistent Connections |    No    |   Yes    |  Yes   |  Yes   |
| Multiplexing           |    No    |   No     |  Yes   |  Yes   |
| Binary Protocol        |    No    |   No     |  Yes   |  Yes   |
| Header Compression     |    No    |   No     |  Yes   |  Yes   |
| Server Push            |    No    |   No     |  Yes   |  Yes   |
| Transport Protocol     |   TCP    |   TCP    |  TCP   |  QUIC  |
| Connection Migration   |    No    |   No     |  No    |  Yes   |
| TLS Built-in           |    No    |   No     |  No    |  Yes   |

### When to Use Which Version
- **HTTP/1.1:** Still common for legacy systems and simple APIs.
- **HTTP/2:** Default for most modern web servers and browsers; improves performance for most workloads.
- **HTTP/3:** Best for latency-sensitive, mobile, or unreliable networks; adoption is growing rapidly.

Understanding these protocols helps you design and troubleshoot modern backend systems for performance and reliability.

---

## TLS
- TLS provides encryption and server authentication.
- Use strong ciphers, enforce TLS 1.2+.
- Certificate management (Let's Encrypt, ACME).

---

## TCP Basics
- Connection-oriented protocol; 3-way handshake.
- Understand latency, retransmission, and congestion.

---

## DNS
- Domain resolution, A/AAAA/CNAME records.
- SRV records for service discovery in some systems.

---

## Reverse Proxies (NGINX)
- NGINX as a reverse proxy, TLS terminator, load balancer.
- Basic config to proxy to backend:
```nginx
server {
  listen 80;
  location / {
    proxy_pass http://backend:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

---

## CDN Basics
- Content Delivery Networks cache static content at edge locations.
- Use for static assets and caching APIs where appropriate.

---

## Load Balancers
- Types: Layer 4 (TCP) vs Layer 7 (HTTP)
- Use cloud LB (ELB/ALB) or external appliances.

---

## Best Practices
- Use TLS everywhere.
- Monitor latency and DNS health.
- Use header propagation for tracing (trace-id headers).

---

Strong networking fundamentals help you design reliable, secure backend systems.