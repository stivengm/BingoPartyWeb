import type { Server, Socket } from 'socket.io';
import { GameError } from './bingo-room.ts';
import type { BingoRoom } from './bingo-room.ts';
import { RateLimiter } from './limiter.ts';
import { isValidBoardType } from './patterns.ts';
import type { RoomManager } from './room-manager.ts';
import type { Ack, RoomView } from './types.ts';

export interface SocketData {
  roomId: string | null;
  playerId: string | null;
}

export type GameSocket = Socket<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>;
export type GameIO = Server<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>;

type AckFn = (response: Ack) => void;

export interface HandlerOptions {
  now?: () => number;
  /** Salas creadas por IP en un minuto. */
  maxCreatesPerMinute?: number;
  /** Códigos inexistentes probados por IP en un minuto. */
  maxMissesPerMinute?: number;
  /** Eventos por segundo y por conexión. */
  maxEventsPerSecond?: number;
}

const ok = (code: string, message: string, data: unknown = null): Ack => ({ code, message, data });
const fail = (code: string, message: string): Ack => ({ code, message, data: null });

function clientIp(socket: GameSocket): string {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || socket.handshake.address || 'unknown';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function registerSocketHandlers(io: GameIO, manager: RoomManager, options: HandlerOptions = {}) {
  const now = options.now ?? Date.now;
  const createLimiter = new RateLimiter(options.maxCreatesPerMinute ?? 10, 60_000, now);
  const missLimiter = new RateLimiter(options.maxMissesPerMinute ?? 15, 60_000, now);
  const pruneTimer = setInterval(() => {
    createLimiter.prune();
    missLimiter.prune();
  }, 60_000);
  pruneTimer.unref?.();

  function broadcast(room: BingoRoom): void {
    io.to(room.id).emit('room:state' as never, room.view() as never);
  }

  function leaveCurrentRoom(socket: GameSocket, explicit: boolean): void {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) return;
    const room = manager.get(roomId);
    socket.leave(roomId);
    socket.data.roomId = null;
    socket.data.playerId = null;
    if (!room) return;
    if (explicit && (room.status === 'waiting' || room.status === 'finished')) {
      room.removePlayer(playerId);
    } else {
      room.disconnect(playerId, socket.id);
    }
    if (room.playerCount === 0) {
      manager.delete(room.id);
      return;
    }
    broadcast(room);
  }

  function enter(socket: GameSocket, room: BingoRoom, playerId: string): void {
    socket.data.roomId = room.id;
    socket.data.playerId = playerId;
    void socket.join(room.id);
  }

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as GameSocket;
    socket.data.roomId = null;
    socket.data.playerId = null;
    const eventLimiter = new RateLimiter(options.maxEventsPerSecond ?? 20, 1000, now);

    /** Envuelve un manejador: valida el ack, limita eventos y convierte errores en respuestas. */
    function on(event: string, handler: (payload: Record<string, unknown>, ack: AckFn) => void): void {
      socket.on(event, (payload: unknown, ack?: unknown) => {
        const reply: AckFn = typeof ack === 'function' ? (ack as AckFn) : () => {};
        if (!eventLimiter.hit(socket.id)) {
          reply(fail('E_RATE', 'Vas demasiado rápido. Espera un momento.'));
          return;
        }
        try {
          handler(asRecord(payload), reply);
        } catch (err) {
          if (err instanceof GameError) {
            reply(fail(err.code, err.message));
            return;
          }
          if (err instanceof Error && err.message === 'ROOMS_FULL') {
            reply(fail('E_BUSY', 'El servidor está lleno. Inténtalo en unos minutos.'));
            return;
          }
          console.error(`[socket] error en ${event}`, err);
          reply(fail('E_INTERNAL', 'Error interno del servidor.'));
        }
      });
    }

    function currentRoom(): { room: BingoRoom; playerId: string } {
      const { roomId, playerId } = socket.data;
      const room = roomId ? manager.get(roomId) : undefined;
      if (!room || !playerId) {
        throw new GameError('E_NO_ROOM', 'No estás en ninguna sala.');
      }
      return { room, playerId };
    }

    on('room:create', (p, reply) => {
      const gameType = p['gameType'];
      const gameBoardType = p['gameBoardType'];
      if (gameType !== 1 && gameType !== 2) {
        throw new GameError('E_PARAMS', 'Elige el tipo de juego.');
      }
      if (!isValidBoardType(gameBoardType)) {
        throw new GameError('E_PARAMS', 'Elige el estilo de cartón.');
      }
      if (!createLimiter.hit(clientIp(socket))) {
        throw new GameError('E_RATE', 'Creaste muchas salas seguidas. Espera un minuto.');
      }
      leaveCurrentRoom(socket, true);
      const room = manager.create({
        gameType,
        gameBoardType,
        secondsBalls: Number(p['secondsBalls']),
      });
      try {
        const { id } = room.join(p['hostName'], p['avatar'], socket.id);
        enter(socket, room, id);
        reply(ok('CR001', 'Sala creada', { room: room.view(), playerId: id }));
      } catch (err) {
        manager.delete(room.id);
        throw err;
      }
    });

    on('room:join', (p, reply) => {
      const roomId = typeof p['roomId'] === 'string' ? p['roomId'].trim().replace(/^#/, '') : '';
      const room = /^\d{6}$/.test(roomId) ? manager.get(roomId) : undefined;
      if (!room) {
        if (!missLimiter.hit(clientIp(socket))) {
          throw new GameError('E_RATE', 'Demasiados intentos. Espera un minuto.');
        }
        throw new GameError('E_NO_ROOM', 'No existe una sala con ese código.');
      }
      if (socket.data.roomId && socket.data.roomId !== room.id) {
        leaveCurrentRoom(socket, true);
      }
      const { id } = room.join(p['playerName'], p['avatar'], socket.id);
      enter(socket, room, id);
      broadcast(room);
      reply(ok('JR001', 'Te uniste a la sala', { room: room.view(), playerId: id }));
    });

    on('room:rejoin', (p, reply) => {
      const roomId = typeof p['roomId'] === 'string' ? p['roomId'] : '';
      const playerId = typeof p['playerId'] === 'string' ? p['playerId'] : '';
      const room = manager.get(roomId);
      if (!room) {
        throw new GameError('E_NO_ROOM', 'La sala ya no existe.');
      }
      room.reconnect(playerId, socket.id);
      enter(socket, room, playerId);
      broadcast(room);
      reply(ok('JR001', 'Reconectado', { room: room.view(), playerId }));
    });

    on('room:leave', (_p, reply) => {
      leaveCurrentRoom(socket, true);
      reply(ok('UR001', 'Saliste de la sala'));
    });

    on('game:start', (_p, reply) => {
      const { room, playerId } = currentRoom();
      room.start(playerId);
      broadcast(room);
      reply(ok('UR001', 'Partida iniciada'));
    });

    on('game:ball:next', (p, reply) => {
      const { room, playerId } = currentRoom();
      const raw = p['number'];
      const requested = raw === undefined || raw === null || raw === '' ? undefined : Number(raw);
      const ball = room.hostDrawBall(playerId, requested);
      broadcast(room);
      reply(ok('UR001', 'Bolita generada', ball));
    });

    on('game:bingo', (p, reply) => {
      const { room, playerId } = currentRoom();
      room.callBingo(playerId, p['board']);
      broadcast(room);
      reply(ok('UR001', 'Verificando bingo'));
    });

    on('game:bingo:resolve', (p, reply) => {
      const { room, playerId } = currentRoom();
      const result = room.resolveClaim(playerId, p['accepted'] === true);
      broadcast(room);
      reply(ok('UR001', result === 'won' ? 'Bingo confirmado' : 'Bingo incompleto', { result }));
    });

    on('game:end', (_p, reply) => {
      const { room, playerId } = currentRoom();
      room.end(playerId);
      broadcast(room);
      reply(ok('UR001', 'Partida finalizada'));
    });

    on('game:rematch', (_p, reply) => {
      const { room, playerId } = currentRoom();
      room.rematch(playerId);
      broadcast(room);
      reply(ok('UR001', 'Nueva partida'));
    });

    socket.on('disconnect', () => {
      leaveCurrentRoom(socket, false);
    });
  });

  return {
    broadcast,
    dispose() {
      clearInterval(pruneTimer);
    },
  };
}

export type { RoomView };
