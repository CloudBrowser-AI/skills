// Small Streamable HTTP client for the hosted stateless JSON-response server.
// No install scripts or runtime dependencies; credentials stay in the request header.
export function createClient({ endpoint = 'https://mcp.cloudbrowser.ai', token, fetcher = fetch, timeout = 30000 } = {}) {
  const url = new URL(endpoint);
  if (url.username || url.password || url.hash || url.search ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname)))) {
    throw new Error('Use HTTPS, or a loopback HTTP endpoint for local tests.');
  }
  let id = 0, version = '2025-03-26';
  async function request(method, params = {}, notification = false, limit = timeout) {
    const response = await fetcher(url, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(limit),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': version, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ jsonrpc: '2.0', ...(notification ? {} : { id: ++id }), method, params }),
    });
    if (!response.ok) throw new Error(`MCP ${method} failed (HTTP ${response.status}).`);
    if (notification || response.status === 202) { await response.body?.cancel(); return null; }
    const text = await response.text();
    if (text.length > 16 * 1024 * 1024) throw new Error('MCP response exceeds the local artifact limit.');
    let body;
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      const messages = text.split(/\r?\n\r?\n/).flatMap(event => {
        const data = event.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\n');
        return data ? [JSON.parse(data)] : [];
      });
      body = messages.find(message => message.id === id);
    } else body = JSON.parse(text);
    if (!body || body.id !== id || body.error) throw new Error(`MCP ${method} failed (${body?.error?.code ?? 'invalid response'}).`);
    return body.result;
  }
  return {
    async connect() {
      const result = await request('initialize', { protocolVersion: version, capabilities: {}, clientInfo: { name: 'cloudbrowser-bounded-client', version: '0.1.0' } });
      version = result.protocolVersion;
      await request('notifications/initialized', {}, true);
      return result;
    },
    request,
    async call(name, args, limit) {
      const result = await request('tools/call', { name, arguments: args }, false, limit);
      if (result.isError) throw new Error(`Tool ${name} reported a failure.`);
      const text = result.content?.find(item => item.type === 'text')?.text;
      const value = text ? JSON.parse(text) : result;
      if (value.success === false) throw new Error(`Tool ${name} did not succeed.`);
      return value;
    },
  };
}
