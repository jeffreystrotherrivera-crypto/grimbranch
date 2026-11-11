// Minimal CDP driver (no puppeteer dependency): connects to a Chrome
// remote-debugging port and returns { send, evaluate } for the app page.
export async function connectPage(port, urlMatch) {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await r.json();
      const page = list.find(t => t.type === 'page' && urlMatch.test(t.url)) || list.find(t => t.type === 'page');
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
        let id = 0; const pending = new Map();
        ws.onmessage = (m) => {
          const msg = JSON.parse(m.data);
          if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); }
        };
        const send = (method, params = {}) => new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method, params })); });
        const evaluate = async (expr) => {
          const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
          if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails).slice(0, 500));
          return r.result.value;
        };
        return { ws, send, evaluate };
      }
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('no page target');
}
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
