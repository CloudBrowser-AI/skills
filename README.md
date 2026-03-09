# @cloudbrowser/skills

Bootstrap package to install CloudBrowser Codex skills.

## Purpose

This README is intentionally limited to installation and MCP registration over `stdio`.

All MCP usage instructions, policies, flows, troubleshooting, and agent behavior live in:

- `skills/cloudbrowser/SKILL.md`

Use `SKILL.md` as the single source of truth for CloudBrowser MCP operation.

## Requirements

- Node.js `>=18`
- A CloudBrowser.ai token (UUID format)
- `npx` available

## 1) Install skills (this package)

Interactive:

```bash
npx @cloudbrowser/skills
```

Non-interactive (recommended):

```bash
npx @cloudbrowser/skills --global --skill cloudbrowser -y
```

Verify installation:

```bash
skills list
```

Note:
`@cloudbrowser/skills` is a wrapper around the `skills` CLI and installs from the packaged skills included in this npm package by default.

Direct upstream CLI alternative:

```bash
npx skills add CloudBrowser-AI/skills --skill cloudbrowser
```

## 2) Register CloudBrowser MCP (STDIO only)

Base MCP config:

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

Typical config locations:

- Claude Desktop (Windows): `%APPDATA%\\Claude\\claude_desktop_config.json`
- Claude Desktop (macOS): `~/Library/Application Support/Claude/claude_desktop_config.json`
- Cursor: `~/.cursor/mcp.json`

After editing the JSON file, restart the MCP client.

## Repo layout

- `skills/cloudbrowser/SKILL.md`: canonical MCP usage and policy instructions.
