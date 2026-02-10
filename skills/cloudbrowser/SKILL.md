---
name: cloudbrowser
description: Install, configure, and use the CloudBrowser.ai MCP server (@cloudbrowser/mcp-server) over STDIO (Claude Desktop, Cursor, MCP Inspector, IDE MCP clients) or HTTP/JSON-RPC (n8n, Make, OpenAI Agents, custom clients). Use when generating MCP config JSON, setting CLOUDBROWSER_API_TOKEN, running the server with --transport stdio/http, calling tools/list or tools/call, or troubleshooting auth/token/JSON-RPC issues.
---

# CloudBrowser MCP

## Overview

Configure and integrate CloudBrowser's MCP server for remote browser automation: via STDIO (MCP clients like Claude Desktop/Cursor/Inspector) or via HTTP (JSON-RPC 2.0) for n8n/Make/OpenAI Agents.

## Workflow Decision Tree

1. Identify the integration type
- MCP client with STDIO support (Claude Desktop, Cursor, Inspector): use STDIO.
- Orchestrator/HTTP (n8n, Make, OpenAI Agents, scripts): use HTTP JSON-RPC.
- Local self-host: run the npm package with `--transport http` or `--transport stdio`.

2. Get a token
- You need a CloudBrowser token in UUID format.
- STDIO: use `CLOUDBROWSER_API_TOKEN` (recommended) or pass `apiToken` in tool arguments when applicable.
- HTTP: send `Authorization: Bearer <token>`.

3. Validate the client can see tools
- Run `tools/list` (over HTTP) or open the MCP client and confirm tools like `open_browser` show up.

4. Use the correct tool flow
- `open_browser` (opens a remote browser) -> get `address` (ws endpoint)
- `connect_to_browser` with `browserAddress=address` + `sessionId` (chosen by the client)
- Control: `navigate_to_url`, `click_element`, `type_text`, `get_page_content`, `take_screenshot`, `evaluate_script`
- Cleanup: `disconnect_browser` (by `sessionId`) and optionally `close_browser` (by `address`).

## Login Walls (Do Not Close, Ask User)

If navigation gets blocked by a login wall / CAPTCHA / 2FA:

- **Do not close the browser**.
- Ask the user how they want to proceed: enter credentials manually, use an alternative flow/source, or cancel.
- If the user will intervene, start remote desktop (`start_remote_desktop`) and share the **direct** Remote Desktop link derived from the websocket (`address`) so they can open it without copying the WS.

### Policy: Never Show The Remote Desktop Password In Chat

When you call `start_remote_desktop`, the tool returns a `password`.

- **Never** paste/print that `password` in chat.
- Instead:
  - Share **only** the Remote Desktop link.
  - Store the `password` in a local file and tell the user the file path.

Recommended path (Windows):
- `%TEMP%\\cloudbrowser-remote-desktop-password.txt`

### Remote Desktop URL (From WebSocket `address`)

If the websocket is:
- `ws://browser.cloudbrowser.ai/<num>/devtools/browser/<id>`

Then the direct link is:
- `https://app.cloudbrowser.ai/remote-desktop/<num>/0`

You can generate it with:
- `node scripts/ws_to_remote_desktop_url.mjs --ws "<address>"`

To store the password locally (without showing it in chat):
- `node scripts/store_remote_desktop_password.mjs --password "<password>" --out "%TEMP%\\cloudbrowser-remote-desktop-password.txt"`

## Screenshots (Default: Save To Desktop)

`take_screenshot` returns a `data:image/<...>;base64,...`. **By default, do NOT paste that string into chat**: convert it to a `.jpg` and save it on the user's Desktop so it can be opened/shared.

- Prefer `type: "jpeg"` (avoids issues with `png` options in some clients/SDKs).
- Recommended saving:
  - If you have the `data:image/...` (or the full JSON containing it), pipe it into the script:
    - `node scripts/save_data_url_image.mjs`
  - Over HTTP/JSON-RPC, you can use `--save-screenshot` directly in `mcp_http_call.mjs` (see `references/quick-reference.md`).
- If the saved file "looks corrupt":
  - It is almost always an incomplete `data:image/...` copy/paste (truncated) or with extra characters.
  - Avoid copy/paste: use `--save-screenshot` (HTTP) or pipe the full JSON.

## STDIO Setup (Claude Desktop / Cursor / MCP Clients)

1. Verify Node.js
- Requires Node >= 18 (the package uses `fetch` and ESM).

2. MCP configuration (example)
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

3. Typical config locations
- Claude Desktop macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Claude Desktop Windows: `%APPDATA%\\Claude\\claude_desktop_config.json`
- Cursor: `~/.cursor/mcp.json`

4. Restart the MCP client so it reloads the configuration.

## HTTP Setup (n8n / Make / OpenAI Agents / Custom Clients)

1. Use the hosted endpoint
- Endpoint: `https://mcp.cloudbrowser.ai`
- Header: `Authorization: Bearer <token>`

2. Call tools with JSON-RPC 2.0
- Always start with `tools/list` to get the real schema (avoid outdated examples that use `browserId` vs `address`, etc.).

`tools/list` (example):
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

`tools/call` (template):
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

3. Quick CLI test
- Use `scripts/mcp_http_call.mjs` (see below) to run `tools/list` and `tools/call` against the endpoint (hosted or local).

## Self-Host (Local HTTP Transport)

1. Run a local HTTP server
```powershell
npx @cloudbrowser/mcp-server --transport http --port 3000
```

2. Health
- `GET http://localhost:3000/health`

3. JSON-RPC
- The main endpoint is `POST http://localhost:3000/` with JSON-RPC 2.0.

## Troubleshooting (Quick)

- 401 UNAUTHORIZED: missing `Authorization: Bearer ...` or invalid token (must be a UUID).
- The client cannot see tools: validate the config JSON and restart the client.
- Schema errors: run `tools/list` and align names/required fields to what the server returns.

## Resources

### scripts/
- `scripts/mcp_http_call.mjs`: helper to call `tools/list` and `tools/call` over HTTP.
- `scripts/save_data_url_image.mjs`: converts `data:image/...;base64,...` (or JSON with `screenshot`) into a file on the Desktop.
- `scripts/ws_to_remote_desktop_url.mjs`: converts websocket `address` into a `https://app.cloudbrowser.ai/remote-desktop/<num>/0` link.

### references/
- `references/quick-reference.md`: snippets and usage patterns (stdio + http) and the recommended flow.
- `references/repo-sources.md`: files in the `cloudbrowser` repo that act as the source of truth (tool schemas, docs, examples).
