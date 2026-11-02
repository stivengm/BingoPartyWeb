import { createGameServer } from './app.ts';

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST?.trim() || '0.0.0.0';

const server = createGameServer();
const actualPort = await server.listen(port, host);
console.log(`Bingo Party server escuchando en el puerto ${actualPort}`);

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
