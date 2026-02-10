# CloudBrowser MCP Quick Reference

## Token

- Expected format: UUID.
- STDIO: set `CLOUDBROWSER_API_TOKEN`.
- HTTP: send `Authorization: Bearer <token>`.

## STDIO (Claude Desktop / Cursor)

Base configuration:
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

Common locations:

- Claude Desktop (macOS): `~/Library/Application Support/Claude/claude_desktop_config.json`
- Claude Desktop (Windows): `%APPDATA%\\Claude\\claude_desktop_config.json`
- Cursor: `~/.cursor/mcp.json`

## HTTP (Hosted or Local)

### Discover real schemas (always)

`tools/list`:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

Note: Do not assume field names from older examples. Read `inputSchema` from `tools/list`.

### Call a tool

`tools/call` template:
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

### Test script (Node)

List tools:
```bash
node scripts/mcp_http_call.mjs --token <uuid> --method tools/list
```

Open browser:
```bash
node scripts/mcp_http_call.mjs --token <uuid> --tool open_browser --args "{\"headless\":true,\"keepOpen\":300}"
```

Take a screenshot and save it to Desktop (default):
```bash
node scripts/mcp_http_call.mjs --token <uuid> --tool take_screenshot --args "{\"sessionId\":\"session-1\",\"type\":\"jpeg\"}" --save-screenshot
```

Save a `data:image/...;base64,...` manually (stdin -> Desktop):
```bash
echo "data:image/jpeg;base64,..." | node scripts/save_data_url_image.mjs
```

## Recommended flow (package v0.1.2)

1. `open_browser` -> read `address` (ws endpoint) from the result.
2. `connect_to_browser` with:
   - `browserAddress`: the `address` from the previous step
   - `sessionId`: a string chosen by the client (e.g. `session-1`)
3. Control with `sessionId`:
   - `navigate_to_url`
   - `get_page_content`
   - `click_element`
   - `type_text`
   - `take_screenshot`
   - `evaluate_script`
4. Cleanup:
   - `disconnect_browser` (by `sessionId`)
   - `close_browser` (by `address`, if applicable)

## Login walls / Remote Desktop link

If a login/2FA/CAPTCHA blocks you, **do not close the browser**. Start Remote Desktop and share the direct link:

- WebSocket: `ws://browser.cloudbrowser.ai/<num>/devtools/browser/<id>`
- Link: `https://app.cloudbrowser.ai/remote-desktop/<num>/0`

Helper:
```bash
node scripts/ws_to_remote_desktop_url.mjs --ws "ws://browser.cloudbrowser.ai/128/devtools/browser/<id>"
```
