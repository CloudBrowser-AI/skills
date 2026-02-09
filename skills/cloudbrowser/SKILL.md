---
name: cloudbrowser
description: Install, configure, and use the CloudBrowser.ai MCP server (@cloudbrowser/mcp-server) over STDIO (Claude Desktop, Cursor, MCP Inspector, IDE MCP clients) or HTTP/JSON-RPC (n8n, Make, OpenAI Agents, custom clients). Use when generating MCP config JSON, setting CLOUDBROWSER_API_TOKEN, running the server with --transport stdio/http, calling tools/list or tools/call, or troubleshooting auth/token/JSON-RPC issues.
---

# CloudBrowser MCP

## Overview

Configurar e integrar el servidor MCP de CloudBrowser para automatizacion de navegadores remotos: via STDIO (clientes MCP tipo Claude Desktop/Cursor/Inspector) o via HTTP (JSON-RPC 2.0) para n8n/Make/OpenAI Agents.

## Workflow Decision Tree

1. Identificar el tipo de integracion
- Cliente MCP con soporte STDIO (Claude Desktop, Cursor, Inspector): usar STDIO.
- Orquestador/HTTP (n8n, Make, OpenAI Agents, scripts): usar HTTP JSON-RPC.
- Auto-host local: ejecutar el paquete npm con `--transport http` o `--transport stdio`.

2. Obtener token
- Requerir un token de CloudBrowser en formato UUID.
- STDIO: usar `CLOUDBROWSER_API_TOKEN` (recomendado) o pasar `apiToken` en argumentos de herramientas cuando aplique.
- HTTP: enviar `Authorization: Bearer <token>`.

3. Validar que el cliente ve herramientas
- Ejecutar `tools/list` (por HTTP) o abrir el MCP client y confirmar que aparecen herramientas como `open_browser`.

4. Usar el flujo correcto de herramientas
- `open_browser` (abre navegador remoto) -> obtener `address` (ws endpoint)
- `connect_to_browser` con `browserAddress=address` + `sessionId` (id elegido por el cliente)
- Control: `navigate_to_url`, `click_element`, `type_text`, `get_page_content`, `take_screenshot`, `evaluate_script`
- Cierre/limpieza: `disconnect_browser` (por `sessionId`) y opcionalmente `close_browser` (por `address`).

## Muros De Login (No Cerrar, Pedir Accion Al Usuario)

Si la navegacion queda bloqueada por un muro de login / CAPTCHA / 2FA:

- **No cerrar el navegador**.
- Pedirle al usuario como proceder: si desea introducir credenciales manualmente, si prefiere otra fuente/flujo, o si se cancela.
- Si el usuario va a intervenir, iniciar escritorio remoto (`start_remote_desktop`) y **darle el link directo** al escritorio remoto derivado del websocket (`address`) para que pueda entrar sin copiar el WS.

### URL De Escritorio Remoto (Desde WebSocket `address`)

Si el websocket es:
- `ws://browser.cloudbrowser.ai/<num>/devtools/browser/<id>`

Entonces el link directo es:
- `https://app.cloudbrowser.ai/remote-desktop/<num>/0`

Puedes obtenerlo con:
- `node scripts/ws_to_remote_desktop_url.mjs --ws "<address>"`

## Capturas De Pantalla (Default: Guardar En Desktop)

`take_screenshot` devuelve un `data:image/<...>;base64,...`. **Por defecto, NO pegar ese string en el chat**: convertirlo a `.jpg` y guardarlo en el Desktop del cliente para que se pueda abrir/compartir.

- Preferir `type: "jpeg"` (evita problemas con opciones de `png` en algunos clientes/SDKs).
- Guardado recomendado:
  - Si tienes el `data:image/...` (o el JSON completo que lo contiene), pipealo al script:
    - `node scripts/save_data_url_image.mjs`
  - En HTTP/JSON-RPC, puedes usar `--save-screenshot` directamente en `mcp_http_call.mjs` (ver `references/quick-reference.md`).

## STDIO Setup (Claude Desktop / Cursor / MCP Clients)

1. Verificar Node.js
- Requerir Node >= 18 (el paquete usa `fetch` y ESM).

2. Configuracion MCP (ejemplo)
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

3. Ubicacion tipica de config
- Claude Desktop macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Claude Desktop Windows: `%APPDATA%\\Claude\\claude_desktop_config.json`
- Cursor: `~/.cursor/mcp.json`

4. Reiniciar el cliente MCP para que cargue la configuracion.

## HTTP Setup (n8n / Make / OpenAI Agents / Custom Clients)

1. Usar endpoint hosteado
- Endpoint: `https://mcp.cloudbrowser.ai`
- Header: `Authorization: Bearer <token>`

2. Llamar herramientas con JSON-RPC 2.0
- Siempre empezar por `tools/list` para obtener el schema real (evitar ejemplos desfasados que usan `browserId` vs `address`, etc.).

`tools/list` (ejemplo):
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

`tools/call` (plantilla):
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

3. Probar rapidamente desde linea de comandos
- Usar `scripts/mcp_http_call.mjs` (ver abajo) para ejecutar `tools/list` y `tools/call` contra el endpoint (hosteado o local).

## Self-Host (Local HTTP Transport)

1. Ejecutar servidor HTTP local
```powershell
npx @cloudbrowser/mcp-server --transport http --port 3000
```

2. Salud
- `GET http://localhost:3000/health`

3. JSON-RPC
- El endpoint principal es `POST http://localhost:3000/` con JSON-RPC 2.0.

## Troubleshooting (Rapido)

- 401 UNAUTHORIZED: falta `Authorization: Bearer ...` o token invalido (debe ser UUID).
- El cliente no ve herramientas: revisar que el JSON de config sea valido y reiniciar el cliente.
- Errores por schema: ejecutar `tools/list` y ajustar nombres/required fields a lo que devuelve el servidor.

## Resources

### scripts/
- `scripts/mcp_http_call.mjs`: helper para llamar `tools/list` y `tools/call` por HTTP.
- `scripts/save_data_url_image.mjs`: convierte `data:image/...;base64,...` (o JSON con `screenshot`) a un archivo en el Desktop.
- `scripts/ws_to_remote_desktop_url.mjs`: convierte el websocket `address` a un link `https://app.cloudbrowser.ai/remote-desktop/<num>/0`.

### references/
- `references/quick-reference.md`: snippets y patrones de uso (stdio + http) y flujo recomendado.
- `references/repo-sources.md`: archivos del repo `cloudbrowser` que actuan como fuente de verdad (tool schemas, docs, ejemplos).
