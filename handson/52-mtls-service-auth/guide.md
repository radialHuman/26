# mTLS — Mutual TLS Between Services

## What it is
In standard TLS, the client verifies the server's identity (you trust the bank's website). In mTLS, both sides verify each other. Every service has a certificate; when Service A calls Service B, B proves it's a legitimate service, and A proves it's a legitimate caller — not just any process on the network.

## Why it matters
In a microservices environment, the question "how do you secure inter-service communication?" comes up constantly. Network-level auth prevents a compromised service from calling any other service freely. Service meshes like Istio automate this entirely. Interviewers ask "how do your services authenticate each other?" at staff/principal level.

## What to know before starting
- Standard TLS handshake: client verifies server certificate against a trusted CA; server sends its certificate
- What a CA (Certificate Authority) is: a trusted entity that signs certificates, vouching for their authenticity
- What a private key and public certificate are: private key stays secret; certificate is shared; they're a pair

## How to approach it
In mTLS, there's an internal CA (you control). Every service gets a certificate signed by this CA. During TLS handshake, both sides present their certificate. Both sides verify the other's certificate was signed by the trusted internal CA.

This means: only services with a valid certificate from your CA can make requests to other services. A compromised external machine or rogue process can't call your internal APIs.

## What to build (minimal working version)
- Generate a self-signed CA using Python's `cryptography` library
- Generate service certificates for `service-a` and `service-b`, both signed by your CA
- Run `service-b` as a FastAPI HTTPS server requiring client certificates (`ssl.CERT_REQUIRED`)
- Run `service-a` with its certificate; make an mTLS request to service-b using `httpx` with cert/key
- Attempt to call `service-b` without a certificate: confirm it's rejected at the TLS layer
- Attempt to call with a self-signed (not CA-signed) certificate: confirm rejection

## Knobs to turn
- Expire `service-a`'s certificate. Does service-b reject the call? How does certificate rotation work in practice?
- Revoke `service-a`'s certificate (CRL or OCSP). Does service-b check the revocation list?
- Add a third service `service-c` with no certificate. Confirm it cannot call either service.
- Check what information is available from the peer certificate on the receiving end (service name, expiry, subject).

## How it connects to other components
- `31-token-auth` — JWT provides application-level identity; mTLS provides transport-level identity; both are needed
- `29-service-discovery` — service registry can include certificate fingerprints for additional verification
- `52-mtls-service-auth` IS the prerequisite for understanding service meshes

## Real tool / production system
Istio and Linkerd automatically provision and rotate mTLS certificates for every service in Kubernetes (using SPIFFE/SPIRE). HashiCorp Vault PKI secrets engine for certificate issuance. AWS ACM Private CA. What you're missing: automatic certificate rotation (services can't be taken down to renew), SPIFFE workload identity (standardized service identity format), and CRL/OCSP for certificate revocation at scale.
