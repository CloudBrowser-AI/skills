# Repo Sources (cloudbrowser)

Si estas trabajando en el repo `c:\\Users\\Luis\\git\\cloudbrowser`, estas rutas son la fuente de verdad para instalacion/uso del MCP server:

- Documentacion (GitBook):
  - `c:\\Users\\Luis\\git\\cloudbrowser\\GitBook\\get-started\\mcp-server.md`
  - `c:\\Users\\Luis\\git\\cloudbrowser\\GitBook\\get-started\\n8n-integration.md`
- Paquete npm / implementacion del servidor:
  - `c:\\Users\\Luis\\git\\cloudbrowser\\CloudBrowserMCP\\README.md`
  - `c:\\Users\\Luis\\git\\cloudbrowser\\CloudBrowserMCP\\package.json` (version, scripts, Node engine)
  - `c:\\Users\\Luis\\git\\cloudbrowser\\CloudBrowserMCP\\src\\server.js` (tool list + inputSchema, CLI flags `--transport` y `--port`)
  - `c:\\Users\\Luis\\git\\cloudbrowser\\CloudBrowserMCP\\stdio-config-example.json` (config base para clientes STDIO)

Recomendacion: si hay discrepancias entre ejemplos y lo que el servidor acepta, creer en `tools/list` (por HTTP) o en `CloudBrowserMCP\\src\\server.js` (si estas ejecutando local).

