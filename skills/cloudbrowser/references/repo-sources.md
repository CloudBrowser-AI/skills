# Repo Sources (cloudbrowser)

If you are working in the repo `c:\\Users\\Luis\\git\\cloudbrowser`, these paths are the source of truth for installing/using the MCP server:

- Documentation (GitBook):
  - `c:\\Users\\Luis\\git\\cloudbrowser\\GitBook\\get-started\\mcp-server.md`
  - `c:\\Users\\Luis\\git\\cloudbrowser\\GitBook\\get-started\\n8n-integration.md`
- npm package / server implementation:
  - `c:\\Users\\Luis\\git\\cloudbrowser\\CloudBrowserMCP\\README.md`
  - `c:\\Users\\Luis\\git\\cloudbrowser\\CloudBrowserMCP\\package.json` (version, scripts, Node engine)
  - `c:\\Users\\Luis\\git\\cloudbrowser\\CloudBrowserMCP\\src\\server.js` (tool list + inputSchema, CLI flags `--transport` and `--port`)
  - `c:\\Users\\Luis\\git\\cloudbrowser\\CloudBrowserMCP\\stdio-config-example.json` (baseline config for STDIO clients)

Recommendation: if there are discrepancies between examples and what the server accepts, trust `tools/list` (over HTTP) or `CloudBrowserMCP\\src\\server.js` (when running locally).
