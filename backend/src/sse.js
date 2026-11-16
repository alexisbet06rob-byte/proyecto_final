// backend/src/sse.js — retransmisión en tiempo real al navegador con Server-Sent Events.
const clientes = new Set();

export function sseHandler(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.write('retry: 2000\n\n');                      // el navegador reconecta solo a los 2 s
  clientes.add(res);
  req.on('close', () => clientes.delete(res));
}

export function emitir(evento, datos) {
  const msg = `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`;
  for (const c of clientes) c.write(msg);
}

// Latido para que proxies/navegador no cierren la conexión inactiva
setInterval(() => { for (const c of clientes) c.write(': ping\n\n'); }, 15000).unref();
