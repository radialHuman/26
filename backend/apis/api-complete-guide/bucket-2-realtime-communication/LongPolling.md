# Long Polling
Client makes request, server holds it open until data available.
Older technique, use SSE/WebSockets instead.
✓ Works everywhere ✗ Inefficient
Python/Go: Hold HTTP response until timeout or data
Use when: SSE/WebSockets not available
