# CloudBrowser reviewer guide

This guide describes the submitted review workflows. The exact five positive and three negative cases are in [test-cases.json](test-cases.json). The dedicated account is provisioned. The [24 September execution report](results-2026-09-24.md) records eight passing cases in the current submission set, with two original security probes retained separately as host-blocked history. CloudBrowser 1.0.0 was submitted for OpenAI review on 24 September 2026 after the owner confirmed the final legal/policy statements. The portal confirmed submission at 12:14 UTC; review approval and directory publication remain pending.

## Review account and connection

Use a dedicated CloudBrowser account containing sample data only. Supply its login email and password in the OpenAI submission's private **Test credentials** field, never in this repository, a chat, a recording, or a public document. Review access must remain usable without MFA, emailed codes, a private network, or further provisioning. Verify browser entitlement and available usage before running the tests. A personal/customer account is not suitable for reviewer access.

The login URL is https://app.cloudbrowser.ai/auth/login. In ChatGPT Developer Mode, connect the production MCP endpoint https://mcp.cloudbrowser.ai using OAuth. Sign in at CloudBrowser, check the app and account shown on the consent screen, and authorize browser control. The OAuth flow handles the connection; reviewers do not enter an API token in a prompt. Refresh the imported tool list and confirm 18 tools are available.

Browser and proxy usage follows the account plan. Each positive case that allocates a browser explicitly authorizes one browser, a 90-second workflow limit and a 180-second inactivity timeout. Run the four allocating cases serially, never in parallel. The approved review allowance is 200 units/month with paid overage disabled; stop this initial run at 40 observed units. Periodic metering may overshoot. The provider applies a 180-second minimum idle period, so always explicitly close each browser. These bounds do not establish a monetary ceiling; operating cost is unknown. Confirm the review account's usage allowance before execution. Keep saveSession and recoverSession false, never retry an ambiguous open, and stop the run if cleanup cannot be verified. Do not change a plan, add payment details, or delete pre-existing sessions to make the test pass.

## Run and record results

Run all eight prompts against the connected production MCP in the supported ChatGPT surface. Use a fresh conversation for each independent case. For each case, record the date, surface, observed tool names, actual result, cleanup result, and pass/fail/blocker. Expected text is an assertion to check, not evidence of a pass.

For browser cases, retain the account list before opening, the created browser label, and the final list showing that browser is absent. Keep private connection addresses and OAuth tokens out of reviewer-facing artifacts. Stop if the page presents a login/CAPTCHA wall, the account has no entitlement, or browser cleanup is ambiguous. Report the error instead of claiming success.

After the cases, verify that revoking the test connection under https://app.cloudbrowser.ai/connections prevents further tool calls, then reconnect the dedicated reviewer account before recording final review-ready status. Do not revoke other users' connections.

## Demonstration recording

The [24 September recording](https://cloudbrowser.ai/review/cloudbrowser-chatgpt-review-20260924.mp4) uses actual authenticated ChatGPT screen captures. Idle time is shortened and result screens are held for readability. It shows account inventory, the research recheck, a comparison with tool activity and cleanup, the unresolved screenshot result, a host-blocked negative case, and the initial empty browser list. An appended follow-up shows the actual 1920×1080 screenshot viewer, final usage of 16 units and verified cleanup of all five approved browsers. A final appendix shows two new negative boundary cases: asking for a missing screenshot URL and explaining that a laptop-local PDF is inaccessible. Both passed without tools or allocation, completing the current eight-case submission set; the original security probes remain host-blocked history. Expand the ChatGPT tool activity if the screenshot widget is collapsed. It is an edited test walkthrough, not continuous footage of every case. The final chapter distinguishes the current passing submission set from historical blocked probes. See the execution report for every result and the two timing overruns.

Record the real ChatGPT Developer Mode interaction after successful account connection. A concise recording should show:

1. The CloudBrowser connection name and production endpoint, without revealing the password, authorization code, token, or private connection URL.
2. Case 2: the exact prompt, tool activity, returned page title/facts/source, and verified cleanup.
3. Case 3: the actual screenshot returned by the connector and cleanup.
4. Case 4: following the observed Privacy policy link and reporting its operator/source.
5. One negative case showing that an unauthorized request does not run browser tools.
6. The dedicated account's browser list with no browsers left by these tests.

A storyboard or synthetic animation is not a replacement for this recording. If the client shows a confirmation, the recording should preserve it and the real decision. Keep results readable, cut only idle waiting, and do not conceal failures. Host the resulting video at a URL reviewers can open without requesting access; place that URL in the submission's Demo Recording URL field.

## Credential-field template

Complete this only in the private submission field after sign-in and entitlement are verified. Include unresolved cases accurately; do not submit while required functionality remains unverified:

- Account/workspace: CloudBrowser dedicated review account; sample data only.
- Login URL: https://app.cloudbrowser.ai/auth/login
- Email and password: enter the working dedicated credentials privately.
- Sign-in: email/password; no MFA, email code or VPN required (verify first).
- Connection: https://mcp.cloudbrowser.ai, OAuth; authorize browser control for this account.
- Sample data: the public CloudBrowser MCP, privacy and terms pages in the supplied cases.
- Entitlement: after verification, state 1 concurrent browser, 1 tab, 200 units/month, with paid overage disabled. Private review access expires 23 December 2026 at 23:59 UTC; arrange renewal or withdrawal before expiry.
- Results: date/surface and actual outcome of all five positive and three negative cases.

## References

- [OpenAI submission and testing requirements](https://developers.openai.com/plugins/deploy/submission#testing)
- [OpenAI app review guidance](https://developers.openai.com/plugins/deploy/app-review)
- [CloudBrowser privacy policy](https://cloudbrowser.ai/privacy-policy)
- [CloudBrowser terms of service](https://cloudbrowser.ai/terms-of-service)

## Tool annotation justifications

These explanations match the deployed 0.1.8 tool metadata. Refresh them if the imported tool schemas change. `Read-only`, `Destructive`, and `Open-world` are the MCP annotation values, not a blanket permission to run a tool.

| Tool | Read-only | Destructive | Open-world | Justification |
| --- | --- | --- | --- | --- |
| open_browser | false | false | false | Allocates metered browser capacity within the connected account; does not navigate or erase an existing resource. |
| close_browser | false | true | false | Terminates an account-owned browser and can discard unsaved browser state. |
| get_browsers | true | false | false | Lists active browsers belonging to the connected account without changing them. |
| start_remote_desktop | false | false | false | Starts interactive access to an account-owned browser; changes access state and must not expose access credentials in a reply. |
| stop_remote_desktop | false | false | false | Stops interactive desktop access for the account-owned browser. |
| get_saved_sessions | true | false | false | Lists the connected account's saved-session metadata. |
| remove_saved_session | false | true | false | Deletes a stored browser session in the connected account. |
| connect_to_browser | false | false | false | Attaches a control session to an account-owned browser. |
| navigate_to_url | false | true | true | Navigates to an external website; loading a supplied URL can have side effects. |
| get_page_content | true | false | true | Reads content of the current page, which may be an external website. |
| click_element | false | true | true | Clicks an element on a website; a click can submit, buy, send or delete. |
| type_text | false | true | true | Enters text on a website; page event handlers or autosave can create external side effects. |
| get_elements | true | false | true | Inspects matching elements on the current, potentially external page. |
| take_screenshot | true | false | true | Captures the current page; the image may contain external site content or private information. |
| evaluate_script | false | true | true | Executes page JavaScript and can change page state or cause external actions. |
| detect_captcha | true | false | true | Inspects the current external page for CAPTCHA widgets; it does not solve them. |
| disconnect_browser | false | false | false | Detaches the control session; it does not close the hosted browser or stop its metered usage. |
| get_connected_browsers | true | false | false | Lists control sessions for the authenticated caller. |

The OAuth connector does not advertise a CAPTCHA-solving tool. None of the review cases requires saved-session deletion, remote-desktop access, arbitrary scripts, or external form submission.
