import { createReadStream, existsSync, statSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { IncomingMessage, Server as HttpServer, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { Server } from 'socket.io';
import type { Timings } from './bingo-room.ts';
import { RoomManager } from './room-manager.ts';
import { registerSocketHandlers } from './socket-handlers.ts';
import type { GameIO, HandlerOptions, SocketData } from './socket-handlers.ts';

export interface GameServerOptions {
  /** Carpeta del build de Angular a servir. Sin ella solo hay Socket.IO y /health. */
  staticDir?: string | null;
  /** Orígenes permitidos (CORS). Sin valor se acepta cualquiera. */
  corsOrigin?: string[] | boolean;
  timings?: Partial<Timings>;
  now?: () => number;
  randomInt?: (max: number) => number;
  maxRooms?: number;
  handlers?: HandlerOptions;
}

export interface GameServer {
  httpServer: HttpServer;
  io: GameIO;
  manager: RoomManager;
  listen(port: number, host?: string): Promise<number>;
  close(): Promise<void>;
}

export function corsFromEnv(): string[] | undefined {
  const origins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return origins.length ? origins : undefined;
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

/** Nombres con hash de contenido de Angular, p. ej. `main-5NZ3JEHK.js`. */
const HASHED_FILE_RE = /-[A-Z0-9]{8,}(?:\.[a-z0-9]+)+$/;

function sendText(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

/** Ruta absoluta dentro de `root`, o `null` si es sospechosa o se sale de la carpeta. */
export function resolveStaticPath(root: string, pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  // Rechaza bytes nulos, barras invertidas y archivos ocultos (.env, .git…).
  if (decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').some((s) => s.startsWith('.'))) {
    return null;
  }
  const resolved = path.resolve(root, '.' + path.posix.normalize('/' + decoded));
  return resolved === root || resolved.startsWith(root + path.sep) ? resolved : null;
}

async function fileAt(filePath: string): Promise<{ size: number } | null> {
  try {
    const info = await stat(filePath);
    return info.isFile() ? { size: info.size } : null;
  } catch {
    return null;
  }
}

function streamFile(req: IncomingMessage, res: ServerResponse, filePath: string, size: number): void {
  const name = path.basename(filePath);
  res.writeHead(200, {
    'Content-Type': CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': size,
    // Con hash: inmutable. El resto (index.html…): revalidar siempre.
    'Cache-Control': HASHED_FILE_RE.test(name) ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  const stream = createReadStream(filePath);
  stream.on('error', () => res.destroy());
  stream.pipe(res);
}

async function serveStatic(root: string, req: IncomingMessage, res: ServerResponse, pathname: string): Promise<void> {
  const filePath = resolveStaticPath(root, pathname === '/' ? '/index.html' : pathname);
  if (!filePath) {
    sendText(res, 400, 'Solicitud inválida');
    return;
  }
  const file = await fileAt(filePath);
  if (file) {
    streamFile(req, res, filePath, file.size);
    return;
  }
  // Fallback SPA: las rutas del router de Angular (sin extensión) devuelven index.html,
  // así recargar /lobby o /game_curse no da 404.
  if (path.posix.extname(pathname) === '') {
    const indexPath = path.join(root, 'index.html');
    const index = await fileAt(indexPath);
    if (index) {
      streamFile(req, res, indexPath, index.size);
      return;
    }
  }
  sendText(res, 404, 'No encontrado');
}

export function createGameServer(options: GameServerOptions = {}): GameServer {
  const startedAt = Date.now();
  const manager = new RoomManager({
    now: options.now,
    timings: options.timings,
    randomInt: options.randomInt,
    maxRooms: options.maxRooms ?? Number(process.env.MAX_ROOMS || 2000),
    onRoomChange: (room) => handlers.broadcast(room),
  });

  const staticDir =
    options.staticDir && existsSync(options.staticDir) && statSync(options.staticDir).isDirectory()
      ? path.resolve(options.staticDir)
      : null;

  const httpServer = createServer((req, res) => {
    void (async () => {
      const method = req.method ?? 'GET';
      let pathname: string;
      try {
        pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
      } catch {
        sendText(res, 400, 'Solicitud inválida');
        return;
      }
      if (method !== 'GET' && method !== 'HEAD') {
        sendText(res, 405, 'Método no permitido');
        return;
      }
      if (pathname === '/health') {
        const body = JSON.stringify({
          ok: true,
          service: 'bingo-party',
          rooms: manager.size,
          uptime: Math.round((Date.now() - startedAt) / 1000),
        });
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(body),
          'Cache-Control': 'no-store',
        });
        res.end(body);
        return;
      }
      if (!staticDir) {
        sendText(res, 404, 'No encontrado');
        return;
      }
      await serveStatic(staticDir, req, res, pathname);
    })().catch((err: unknown) => {
      console.error('[http] error atendiendo la petición', err);
      if (!res.headersSent) {
        sendText(res, 500, 'Error interno del servidor');
      } else {
        res.destroy();
      }
    });
  });

  const io: GameIO = new Server<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>(
    httpServer,
    {
      cors: { origin: options.corsOrigin ?? corsFromEnv() ?? true },
      pingInterval: 10_000,
      pingTimeout: 8_000,
      maxHttpBufferSize: 20_000,
      serveClient: false,
    },
  );
  const handlers = registerSocketHandlers(io, manager, options.handlers);

  let closing: Promise<void> | null = null;
  return {
    httpServer,
    io,
    manager,
    listen(port, host) {
      return new Promise<number>((resolve, reject) => {
        const onError = (err: Error) => reject(err);
        httpServer.once('error', onError);
        httpServer.listen(port, host, () => {
          httpServer.off('error', onError);
          resolve((httpServer.address() as AddressInfo).port);
        });
      });
    },
    close() {
      closing ??= new Promise<void>((resolve) => {
        handlers.dispose();
        manager.dispose();
        void io.close(() => resolve());
        httpServer.closeAllConnections();
      });
      return closing;
    },
  };
}
