# MCP (Model Context Protocol)

## Simple Explanation
Standard protocol for connecting AI assistants to tools and data sources. Like USB for AI - one standard interface for all tools.

## What Problem It Solved (2024)
Before MCP: Every AI had custom tool integrations (OpenAI functions ≠ Anthropic tools)
After MCP: Write tool once, works with any MCP-compatible AI

## Architecture
```
AI Model ←→ MCP Client ←→ MCP Server (Slack/GitHub/Database)
```

## Core Concepts
- **Servers**: Provide tools (Slack, databases, file systems)
- **Clients**: AI applications that use tools
- **Protocol**: JSON-RPC 2.0 over stdio/HTTP/WebSocket

## Example Server (Python)
```python
from mcp.server import Server
app = Server("my-tool")

@app.list_tools()
async def list_tools():
    return [Tool(name="search", description="Search docs")]

@app.call_tool()
async def call_tool(name, arguments):
    if name == "search":
        return f"Results for: {arguments['query']}"
```

## Pros & Cons
✓ Open standard, interoperable, extensible
✗ New (2024), evolving spec

## When to Use
- Building AI applications with tool use
- Creating reusable AI tools
- Multi-AI-provider support

## References
- Spec: https://spec.modelcontextprotocol.io/
- SDK: https://github.com/modelcontextprotocol/python-sdk
