import { existsSync } from 'node:fs';
import path from 'node:path';
import { createGameServer } from './app.ts';

const browserDir = path.resolve(import.meta.dirname, '../../dist/BingoPartyWeb/browser');
const staticDir = existsSync(path.join(browserDir, 'index.html')) ? browserDir : null;

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST?.trim() || '0.0.0.0';

const server = createGameServer({ staticDir });
const actualPort = await server.listen(port, host);
console.log(`Bingo Party en http://localhost:${actualPort}`);
if (!staticDir) {
  console.log('Sin build del cliente (dist/BingoPartyWeb/browser): solo Socket.IO y /health.');
}

let shuttingDown = false;
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} recibido: cerrando servidor…`);
  setTimeout(() => process.exit(1), 5000).unref();
  server.close().then(
    () => process.exit(0),
    () => process.exit(1),
  );
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
