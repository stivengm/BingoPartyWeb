import { randomInt } from 'node:crypto';
import { BingoRoom } from './bingo-room.ts';
import type { RoomOptions, Timings } from './bingo-room.ts';
import type { GameType } from './types.ts';

export interface RoomManagerOptions {
  now?: () => number;
  timings?: Partial<Timings>;
  maxRooms?: number;
  /** Sala sin nadie conectado durante este tiempo = se elimina. */
  emptyRoomTtlMs?: number;
  randomInt?: (max: number) => number;
  onRoomChange?: (room: BingoRoom) => void;
}

export interface CreateRoomConfig {
  gameType: GameType;
  gameBoardType: number;
  secondsBalls: number;
}

export class RoomManager {
  private rooms = new Map<string, BingoRoom>();
  private readonly options: RoomManagerOptions;
  private readonly now: () => number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: RoomManagerOptions = {}) {
    this.options = options;
    this.now = options.now ?? Date.now;
    this.cleanupTimer = setInterval(() => this.cleanup(), 60_000);
    this.cleanupTimer.unref?.();
  }

  get size(): number {
    return this.rooms.size;
  }

  get(id: string): BingoRoom | undefined {
    return this.rooms.get(id);
  }

  create(config: CreateRoomConfig): BingoRoom {
    const max = this.options.maxRooms ?? 2000;
    if (this.rooms.size >= max) {
      throw new Error('ROOMS_FULL');
    }
    let id = '';
    do {
      id = String(randomInt(100000, 1000000));
    } while (this.rooms.has(id));

    const roomOptions: RoomOptions = {
      id,
      ...config,
      timings: this.options.timings,
      now: this.options.now,
      randomInt: this.options.randomInt,
      onChange: (room) => this.options.onRoomChange?.(room),
    };
    const room = new BingoRoom(roomOptions);
    this.rooms.set(id, room);
    return room;
  }

  delete(id: string): void {
    this.rooms.get(id)?.dispose();
    this.rooms.delete(id);
  }

  cleanup(): void {
    const ttl = this.options.emptyRoomTtlMs ?? 10 * 60_000;
    const t = this.now();
    for (const [id, room] of this.rooms) {
      const empty = room.playerCount === 0 || room.connectedCount === 0;
      if (empty && t - room.lastActivity >= ttl) {
        this.delete(id);
      }
    }
  }

  dispose(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    for (const id of [...this.rooms.keys()]) this.delete(id);
  }
}
