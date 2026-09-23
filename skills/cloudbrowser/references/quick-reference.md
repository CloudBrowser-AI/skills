# Client setup and bounded first job

The hosted server uses Streamable HTTP at `https://mcp.cloudbrowser.ai`. API-token authentication is intended for developer clients. Consumer OAuth and directory acceptance must be verified separately; a direct install does not establish either.

## Claude Code

Clone this repository and start Claude Code with `--plugin-dir /absolute/path/to/skills` to load the package locally. Configure `CLOUDBROWSER_API_TOKEN` in your local environment before starting the client; use your own token from the signed-in CloudBrowser account app. Do not paste the value into a prompt. Run `claude plugin validate /absolute/path/to/skills` to check the package.

## Gemini CLI

`gemini extensions install https://github.com/CloudBrowser-AI/skills`

The extension prompts for the CloudBrowser API token as a sensitive setting. Its manifest connects directly to the hosted service, so npm publishing access is not a prerequisite. Restart Gemini CLI after installation and inspect `/mcp` before using the tools.

## Grok Build

The repository includes a Grok plugin manifest and the same workflow/MCP configuration. Follow the client's supported plugin install route. Official marketplace submission requires a pinned source commit, generated component index and reviewed registry PR. Source availability is not marketplace acceptance.

## Bounded first useful job

Node 18 or newer is required. This prepares the exact run without starting a browser:

```sh
node skills/cloudbrowser/scripts/run_bounded_job.mjs
```

After approving metered usage for your own account and configuring the token locally:

```sh
node skills/cloudbrowser/scripts/run_bounded_job.mjs --run --allow-metered --out ./cloudbrowser-result
```

One browser, one public CloudBrowser MCP page, at most 90 seconds of workflow time plus bounded cleanup; 60-second browser inactivity expiry. No account creation, purchase, form submission, CAPTCHA solving or external writes. A wall-clock limit cannot guarantee a dollar ceiling or prove provider cost. If the open response is ambiguous, the script does not retry it; check the account browser list before another attempt.

## Lower-level HTTP helper

Set `CLOUDBROWSER_API_TOKEN` in the environment. Discover current schemas first:

```sh
node skills/cloudbrowser/scripts/mcp_http_call.mjs --method tools/list
```

For tools requiring a session, first open a browser, connect its returned address to your chosen `sessionId`, perform the bounded task and close the exact address. Do not print browser addresses or authentication material in public logs.

For existing stdio setups, use the reviewed CloudBrowserMCP source or a verified published package version. npm latest can lag hosted releases; do not assume `npx @cloudbrowser/mcp-server` matches the hosted server.
