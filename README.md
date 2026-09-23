# CloudBrowser client packages

Finish a bounded web research or QA task in your CloudBrowser account, return page evidence, and close the browser. These packages reuse the hosted [CloudBrowser MCP](https://cloudbrowser.ai/mcp) and one [workflow skill](skills/cloudbrowser/SKILL.md).

- **Claude Code:** `.claude-plugin/plugin.json` and `.mcp.json`; validate with `claude plugin validate .`, then load locally with `claude --plugin-dir /absolute/path/to/skills`.
- **Gemini CLI:** root `gemini-extension.json`; install with `gemini extensions install https://github.com/CloudBrowser-AI/skills`.
- **Grok Build:** `.grok-plugin/plugin.json`, the shared MCP configuration and skills; marketplace acceptance is separate from this public source package.
- **Codex/other skill clients:** use the existing `skills/cloudbrowser` directory or the established skills installer. Consumer OAuth requires a separately verified account connection.

[Setup and exact first job](skills/cloudbrowser/references/quick-reference.md).

The developer packages use your own CloudBrowser API token from the [account app](https://app.cloudbrowser.ai). Configure it in the client's local secret/environment setting, never in a chat. Gemini declares it as a sensitive setting. No npm package download is needed by the hosted MCP configuration.

The connector does not add an AI inference charge. Browser and proxy usage follows your CloudBrowser plan; the package does not provide free usage or guarantee a monetary ceiling. The first-job script prepares its plan without opening a browser unless explicitly run with metered-use authorization.

Publication in this repository, package validation, installation, a completed browser job and directory approval are different states. No marketplace badge or acceptance is implied.

[CloudBrowser](https://cloudbrowser.ai) · [Privacy](https://cloudbrowser.gitbook.io/docs/legal/privacy-policy) · [Terms](https://cloudbrowser.gitbook.io/docs/legal/terms-of-service) · Support: contact@cloudbrowser.ai
