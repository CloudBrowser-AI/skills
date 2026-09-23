#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createClient } from './mcp_client.mjs';

export const plan = Object.freeze({
  target: 'https://cloudbrowser.ai/mcp', purpose: 'Check the MCP page title/content and save page evidence',
  browsers: 1, workflowSeconds: 90, inactivitySeconds: 60, saveSession: false,
  paidUsage: 'Requires explicit metered-use authorization. Cost is not established by a time limit.',
});

export async function runJob({ client, out, target = plan.target, workflowSeconds = plan.workflowSeconds } = {}) {
  const start = Date.now(), deadline = start + workflowSeconds * 1000, sessionId = 'qa-' + randomUUID();
  const report = { target, startedAt: new Date(start).toISOString(), completed: false, browserClosed: false, cost: 'unknown' };
  let address, failure;
  const within = () => { const left = deadline - Date.now(); if (left <= 0) throw new Error('Workflow time limit reached.'); return Math.min(30000, left); };
  try {
    await client.connect();
    const tools = (await client.request('tools/list')).tools;
    for (const required of ['open_browser', 'connect_to_browser', 'navigate_to_url', 'get_page_content', 'take_screenshot', 'close_browser', 'get_browsers']) {
      if (!tools.some(tool => tool.name === required)) throw new Error(`Required tool missing: ${required}`);
    }
    // Never retry an ambiguous open: it may already have allocated a paid session.
    const opened = await client.call('open_browser', { headless: true, keepOpen: 60, saveSession: false, recoverSession: false, label: sessionId }, within());
    address = opened.address;
    if (!address) throw new Error('Browser open did not return an address. Check your account before retrying.');
    await client.call('connect_to_browser', { browserAddress: address, sessionId }, within());
    await client.call('navigate_to_url', { sessionId, url: target, timeout: Math.min(20000, within()), waitUntil: 'domcontentloaded', autoSolveCaptcha: false }, within());
    const { pageData } = await client.call('get_page_content', { sessionId }, within());
    if (!pageData?.title || !pageData.bodyText?.includes('CloudBrowser')) throw new Error('The requested page did not return the expected CloudBrowser content.');
    const shot = await client.call('take_screenshot', { sessionId, type: 'jpeg', fullPage: false }, within());
    const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(shot.screenshot ?? '');
    if (!match) throw new Error('The screenshot is missing or invalid.');
    await mkdir(out, { recursive: true });
    const image = Buffer.from(match[1], 'base64');
    if (image[0] !== 0xff || image[1] !== 0xd8 || image.at(-2) !== 0xff || image.at(-1) !== 0xd9) throw new Error('The screenshot is truncated.');
    await writeFile(resolve(out, 'page.jpg'), image);
    Object.assign(report, { title: pageData.title, observedUrl: pageData.url, headings: pageData.headings, excerpt: pageData.bodyText.slice(0, 1000), screenshot: 'page.jpg', completed: true });
  } catch (error) {
    failure = error;
    report.error = 'The bounded page check failed. No automatic retry was started.';
  } finally {
    if (address) {
      try {
        await client.call('close_browser', { address }, 15000);
        const remaining = await client.call('get_browsers', {}, 15000);
        report.browserClosed = !remaining.browsers.some(browser => browser.address === address);
      } catch { report.cleanupError = 'Close could not be verified. Check this job in the CloudBrowser account browser list before another run.'; }
      try { await client.call('disconnect_browser', { sessionId }, 5000); } catch { /* Provider cleanup above is authoritative. */ }
    }
    report.finishedAt = new Date().toISOString();
    report.elapsedSeconds = Math.ceil((Date.now() - start) / 1000);
    await mkdir(out, { recursive: true });
    await writeFile(resolve(out, 'result.json'), JSON.stringify(report, null, 2) + '\n');
  }
  if (failure || !report.browserClosed) throw new Error(`Job incomplete; see ${resolve(out, 'result.json')}.`);
  return report;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.includes('--run')) { console.log(JSON.stringify(plan, null, 2)); return; }
  if (!args.includes('--allow-metered')) throw new Error('Live execution requires an approved usage bound and --allow-metered.');
  const token = process.env.CLOUDBROWSER_API_TOKEN;
  if (!token) throw new Error('Configure CLOUDBROWSER_API_TOKEN locally; never paste it into a chat.');
  const outIndex = args.indexOf('--out');
  const out = resolve(outIndex >= 0 ? args[outIndex + 1] : './cloudbrowser-result');
  const report = await runJob({ client: createClient({ token }), out });
  console.log(JSON.stringify(report, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
