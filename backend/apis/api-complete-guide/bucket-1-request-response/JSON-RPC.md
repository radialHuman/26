# JSON-RPC
Simple RPC using JSON. Used by Ethereum, Bitcoin. Lighter than SOAP, simpler than REST for pure RPC.
Request: `{"jsonrpc":"2.0","method":"add","params":[5,3],"id":1}`
Response: `{"jsonrpc":"2.0","result":8,"id":1}`
✓ Simple, lightweight  ✗ No service discovery
Use for: Blockchain APIs, internal RPC
Python: `pip install json-rpc`, Go: `gorilla/rpc`
Docs: https://www.jsonrpc.org/
