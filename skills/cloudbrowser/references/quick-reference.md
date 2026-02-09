# CloudBrowser MCP Quick Reference

## Token

- Formato esperado: UUID.
- STDIO: configurar `CLOUDBROWSER_API_TOKEN`.
- HTTP: enviar `Authorization: Bearer <token>`.

## STDIO (Claude Desktop / Cursor)

Configuracion base:
```json
{
  "mcpServers": {
    "cloudbrowser": {
      "command": "npx",
      "args": ["@cloudbrowser/mcp-server"],
      "env": {
        "CLOUDBROWSER_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

Ubicaciones comunes:

- Claude Desktop (macOS): `~/Library/Application Support/Claude/claude_desktop_config.json`
- Claude Desktop (Windows): `%APPDATA%\\Claude\\claude_desktop_config.json`
- Cursor: `~/.cursor/mcp.json`

## HTTP (Hosted o Local)

### Descubrir schemas reales (siempre)

`tools/list`:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

Nota: No asumir nombres de campos de ejemplos viejos. Tomar `inputSchema` desde `tools/list`.

### Llamar una herramienta

Plantilla `tools/call`:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "open_browser",
    "arguments": {
      "headless": true,
      "keepOpen": 300
    }
  }
}
```

### Script de prueba (Node)

Listar herramientas:
```bash
node scripts/mcp_http_call.mjs --token <uuid> --method tools/list
```

Abrir browser:
```bash
node scripts/mcp_http_call.mjs --token <uuid> --tool open_browser --args "{\"headless\":true,\"keepOpen\":300}"
```

Tomar screenshot y guardarlo en el Desktop (default):
```bash
node scripts/mcp_http_call.mjs --token <uuid> --tool take_screenshot --args "{\"sessionId\":\"session-1\",\"type\":\"jpeg\"}" --save-screenshot
```

Guardar un `data:image/...;base64,...` manualmente (stdin -> Desktop):
```bash
echo "data:image/jpeg;base64,..." | node scripts/save_data_url_image.mjs
```

## Flujo recomendado (v0.1.2 del paquete)

1. `open_browser` -> leer `address` (ws endpoint) del resultado.
2. `connect_to_browser` con:
   - `browserAddress`: el `address` anterior
   - `sessionId`: string elegido por el cliente (ej: `session-1`)
3. Control con `sessionId`:
   - `navigate_to_url`
   - `get_page_content`
   - `click_element`
   - `type_text`
   - `take_screenshot`
   - `evaluate_script`
4. Limpiar:
   - `disconnect_browser` (por `sessionId`)
   - `close_browser` (por `address`, si aplica)

## Login walls / Remote Desktop link

Si te bloquea un login/2FA/CAPTCHA, **no cierres el browser**. Inicia Remote Desktop y comparte link directo:

- WebSocket: `ws://browser.cloudbrowser.ai/<num>/devtools/browser/<id>`
- Link: `https://app.cloudbrowser.ai/remote-desktop/<num>/0`

Helper:
```bash
node scripts/ws_to_remote_desktop_url.mjs --ws "ws://browser.cloudbrowser.ai/128/devtools/browser/<id>"
```
