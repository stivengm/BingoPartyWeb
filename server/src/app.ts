import { createServer } from 'node:http';
import type { Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server } from 'socket.io';
import type { Timings } from './bingo-room.ts';
import { RoomManager } from './room-manager.ts';
import { registerSocketHandlers } from './socket-handlers.ts';
import type { GameIO, HandlerOptions, SocketData } from './socket-handlers.ts';

export interface GameServerOptions {
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

export function createGameServer(options: GameServerOptions = {}): GameServer {
  const startedAt = Date.now();
  const manager = new RoomManager({
    now: options.now,
    timings: options.timings,
    randomInt: options.randomInt,
    maxRooms: options.maxRooms ?? Number(process.env.MAX_ROOMS || 2000),
    onRoomChange: (room) => handlers.broadcast(room),
  });

  const httpServer = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0];
    // CORS para el aviso de despertar: el front puede llamar a /health antes de conectar el socket.
    const cors = options.corsOrigin ?? corsFromEnv() ?? true;
    const origin = req.headers.origin;
    const allowed = cors === true || (Array.isArray(cors) && !!origin && cors.includes(origin));
    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    };
    if (allowed) {
      headers['Access-Control-Allow-Origin'] = cors === true ? '*' : origin!;
      headers['Vary'] = 'Origin';
    }
    if (path === '/health' || path === '/') {
      res.writeHead(200, headers);
      res.end(
        JSON.stringify({
          ok: true,
          service: 'bingo-party-server',
          rooms: manager.size,
          uptime: Math.round((Date.now() - startedAt) / 1000),
        }),
      );
      return;
    }
    res.writeHead(404, headers);
    res.end(JSON.stringify({ ok: false, message: 'No encontrado' }));
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
