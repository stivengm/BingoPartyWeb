import { randomInt, randomUUID } from 'node:crypto';
import { columnRange, isInPattern, letterFor } from './patterns.ts';
import type {
  Ball,
  BoardCell,
  Claim,
  GameStatus,
  GameType,
  PublicPlayer,
  RoomView,
  Winner,
} from './types.ts';

export const TOTAL_BALLS = 75;
export const MAX_PLAYERS = 30;
export const NAME_MAX = 20;

export interface Timings {
  /** Cuenta regresiva "3, 2, 1, ¡YA!" que ve el cliente antes de la primera bolita. */
  countdownMs: number;
  /** Cuánto vale "un segundo" de `secondsBalls` (en tests se reduce). */
  msPerSecond: number;
  /** Tiempo para que se resuelva una verificación de bingo antes de reanudar solo. */
  claimTimeoutMs: number;
  /** Tras este tiempo desconectado, un jugador sale del lobby. */
  lobbyGraceMs: number;
  /** Tras este tiempo sin el anfitrión conectado, el rol pasa a otro jugador. */
  hostGraceMs: number;
  /** Mínimo de segundos entre bolitas. */
  minSeconds: number;
  maxSeconds: number;
}

export const DEFAULT_TIMINGS: Timings = {
  countdownMs: 5500,
  msPerSecond: 1000,
  claimTimeoutMs: 60_000,
  lobbyGraceMs: 30_000,
  hostGraceMs: 30_000,
  minSeconds: 3,
  maxSeconds: 99,
};

export class GameError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

interface PlayerRecord {
  id: string;
  name: string;
  avatar: string;
  socketId: string | null;
  disconnectedAt: number | null;
  /** Hasta cuándo no puede volver a cantar bingo (castigo por un bingo incompleto). */
  claimBlockedUntil: number;
}

export interface RoomOptions {
  id: string;
  gameType: GameType;
  gameBoardType: number;
  secondsBalls: number;
  timings?: Partial<Timings>;
  now?: () => number;
  /** Devuelve un entero en [0, max). Inyectable para tests. */
  randomInt?: (max: number) => number;
  onChange?: (room: BingoRoom) => void;
}

export function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') {
    return '';
  }
  return raw
    .normalize('NFKC')
    .replace(/[\p{C}\p{Z}]+/gu, ' ')
    .trim()
    .slice(0, NAME_MAX);
}

export function sanitizeAvatar(raw: unknown): string {
  return typeof raw === 'string' && /^[a-z0-9_-]{1,30}$/i.test(raw) ? raw : '';
}

export class BingoRoom {
  readonly id: string;
  readonly gameType: GameType;
  readonly gameBoardType: number;
  readonly secondsBalls: number;
  readonly createdAt: number;

  status: GameStatus = 'waiting';
  hostId = '';
  round = 1;
  lastActivity: number;

  private players = new Map<string, PlayerRecord>();
  private called: Ball[] = [];
  private bag: number[] = [];
  private nextBallAt: number | null = null;
  private claim: Claim | null = null;
  private winner: Winner | null = null;

  private ballTimer: ReturnType<typeof setTimeout> | null = null;
  private claimTimer: ReturnType<typeof setTimeout> | null = null;
  private hostTimer: ReturnType<typeof setTimeout> | null = null;
  private lobbyTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private readonly timings: Timings;
  private readonly now: () => number;
  private readonly rand: (max: number) => number;
  private readonly onChange: (room: BingoRoom) => void;

  constructor(options: RoomOptions) {
    this.id = options.id;
    this.gameType = options.gameType;
    this.gameBoardType = options.gameBoardType;
    this.timings = { ...DEFAULT_TIMINGS, ...options.timings };
    this.now = options.now ?? Date.now;
    this.rand = options.randomInt ?? ((max) => randomInt(max));
    this.onChange = options.onChange ?? (() => {});
    this.secondsBalls = Math.min(
      this.timings.maxSeconds,
      Math.max(this.timings.minSeconds, Math.round(options.secondsBalls) || 10),
    );
    this.createdAt = this.now();
    this.lastActivity = this.createdAt;
  }

  // ---------------------------------------------------------------- jugadores

  get playerCount(): number {
    return this.players.size;
  }

  get connectedCount(): number {
    let count = 0;
    for (const p of this.players.values()) {
      if (p.socketId) count++;
    }
    return count;
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }

  playerSocket(playerId: string): string | null {
    return this.players.get(playerId)?.socketId ?? null;
  }

  /** Alta de un jugador. Si el nombre es de una silla desconectada, la recupera. */
  join(rawName: unknown, rawAvatar: unknown, socketId: string): { id: string; reclaimed: boolean } {
    const name = sanitizeName(rawName);
    if (name.length < 1) {
      throw new GameError('E_NAME', 'Escribe un nombre para jugar.');
    }
    const avatar = sanitizeAvatar(rawAvatar);
    const lower = name.toLowerCase();

    for (const p of this.players.values()) {
      if (p.name.toLowerCase() !== lower) continue;
      if (p.socketId === null) {
        this.attach(p, socketId);
        p.avatar = avatar || p.avatar;
        this.touch();
        return { id: p.id, reclaimed: true };
      }
      throw new GameError('E_NAME_TAKEN', 'Ese nombre ya está en uso en la sala.');
    }

    if (this.status !== 'waiting') {
      throw new GameError('E_STARTED', 'La partida ya comenzó.');
    }
    if (this.players.size >= MAX_PLAYERS) {
      throw new GameError('E_FULL', 'La sala está llena.');
    }

    const id = randomUUID();
    this.players.set(id, {
      id,
      name,
      avatar,
      socketId,
      disconnectedAt: null,
      claimBlockedUntil: 0,
    });
    if (!this.hostId) {
      this.hostId = id;
    }
    this.touch();
    return { id, reclaimed: false };
  }

  /** Vuelve a asociar un jugador existente con un socket nuevo (recarga o corte de red). */
  reconnect(playerId: string, socketId: string): void {
    const p = this.players.get(playerId);
    if (!p) {
      throw new GameError('E_NO_PLAYER', 'Ya no formas parte de esta sala.');
    }
    this.attach(p, socketId);
    this.touch();
  }

  private attach(p: PlayerRecord, socketId: string): void {
    p.socketId = socketId;
    p.disconnectedAt = null;
    const timer = this.lobbyTimers.get(p.id);
    if (timer) {
      clearTimeout(timer);
      this.lobbyTimers.delete(p.id);
    }
    if (p.id === this.hostId) this.clearHostTimer();
  }

  disconnect(playerId: string, socketId: string): void {
    const p = this.players.get(playerId);
    // Un socket viejo no debe tumbar la conexión nueva del mismo jugador.
    if (!p || p.socketId !== socketId) return;
    p.socketId = null;
    p.disconnectedAt = this.now();
    this.touch();

    if (this.status === 'waiting') {
      const timer = setTimeout(() => {
        this.lobbyTimers.delete(playerId);
        const current = this.players.get(playerId);
        if (current && current.socketId === null && this.status === 'waiting') {
          this.removePlayer(playerId);
          this.onChange(this);
        }
      }, this.timings.lobbyGraceMs);
      timer.unref?.();
      this.lobbyTimers.set(playerId, timer);
    }
    if (playerId === this.hostId) {
      // Una recarga del anfitrión no le quita el rol: se traspasa solo si sigue ausente.
      this.clearHostTimer();
      this.hostTimer = setTimeout(() => {
        this.hostTimer = null;
        const host = this.players.get(this.hostId);
        if (host && host.socketId === null) {
          this.ensureHostConnected();
          this.onChange(this);
        }
      }, this.timings.hostGraceMs);
      this.hostTimer.unref?.();
    }
  }

  removePlayer(playerId: string): void {
    if (!this.players.delete(playerId)) return;
    const timer = this.lobbyTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.lobbyTimers.delete(playerId);
    }
    if (this.claim?.playerId === playerId && this.status === 'paused') {
      this.resumeAfterClaim();
    }
    if (this.hostId === playerId) {
      this.hostId = '';
      this.clearHostTimer();
      this.ensureHostConnected();
    }
    this.touch();
  }

  /** Pasa el rol de anfitrión al primer jugador conectado (o al primero que quede). */
  private ensureHostConnected(): void {
    const host = this.players.get(this.hostId);
    if (host?.socketId) return;
    for (const p of this.players.values()) {
      if (p.socketId) {
        this.hostId = p.id;
        return;
      }
    }
    if (!host) {
      this.hostId = this.players.keys().next().value ?? '';
    }
  }

  private clearHostTimer(): void {
    if (this.hostTimer) {
      clearTimeout(this.hostTimer);
      this.hostTimer = null;
    }
  }

  private assertHost(playerId: string): void {
    if (playerId !== this.hostId) {
      throw new GameError('E_NOT_HOST', 'Solo el anfitrión puede hacer esto.');
    }
  }

  // ------------------------------------------------------------------- juego

  start(playerId: string): void {
    this.assertHost(playerId);
    if (this.status !== 'waiting') {
      throw new GameError('E_STATE', 'La partida ya está en curso.');
    }
    this.resetBag();
    this.called = [];
    this.claim = null;
    this.winner = null;
    this.status = 'playing';
    if (this.gameType === 1) {
      this.scheduleNext(this.timings.countdownMs + this.secondsBalls * this.timings.msPerSecond);
    }
    this.touch();
  }

  /**
   * Saca una bolita. En digital la dispara el temporizador; en físico, el host
   * (al azar o indicando el número que salió de la tómbola física).
   */
  drawBall(requested?: number): Ball {
    if (this.status !== 'playing') {
      throw new GameError('E_STATE', 'La partida no está en juego.');
    }
    if (this.bag.length === 0) {
      throw new GameError('E_EXHAUSTED', 'Ya salieron todas las bolitas.');
    }

    let number: number;
    if (requested === undefined) {
      const index = this.rand(this.bag.length);
      number = this.bag[index];
      this.bag.splice(index, 1);
    } else {
      const index = this.bag.indexOf(requested);
      if (index === -1) {
        throw new GameError('E_BALL', 'Esa bolita ya salió o no es válida.');
      }
      number = requested;
      this.bag.splice(index, 1);
    }

    const ball: Ball = {
      number,
      letter: letterFor(number),
      value: `${letterFor(number)}${number}`,
      calledAt: this.now(),
    };
    this.called.push(ball);

    if (this.gameType === 1) {
      if (this.bag.length === 0) {
        this.nextBallAt = null;
        this.clearBallTimer();
      } else {
        this.scheduleNext(this.secondsBalls * this.timings.msPerSecond);
      }
    }
    this.touch();
    return ball;
  }

  hostDrawBall(playerId: string, requested?: number): Ball {
    this.assertHost(playerId);
    if (this.gameType !== 2) {
      throw new GameError('E_STATE', 'En el juego digital las bolitas salen solas.');
    }
    if (requested !== undefined && (!Number.isInteger(requested) || requested < 1 || requested > TOTAL_BALLS)) {
      throw new GameError('E_BALL', 'Número de bolita inválido.');
    }
    return this.drawBall(requested);
  }

  /** Un jugador canta bingo: el juego se pausa para verificar. */
  callBingo(playerId: string, rawBoard: unknown): Claim {
    const player = this.players.get(playerId);
    if (!player) {
      throw new GameError('E_NO_PLAYER', 'No formas parte de esta sala.');
    }
    if (this.status !== 'playing') {
      throw new GameError('E_STATE', 'No se puede cantar bingo ahora.');
    }
    if (this.now() < player.claimBlockedUntil) {
      throw new GameError('E_COOLDOWN', 'Espera unos segundos antes de volver a cantar bingo.');
    }

    let board: BoardCell[][] | null = null;
    let valid: boolean | null = null;
    if (this.gameType === 1) {
      board = this.parseBoard(rawBoard);
      valid = this.checkBoard(board);
    }

    this.claim = {
      playerId,
      playerName: player.name,
      avatar: player.avatar,
      board,
      valid,
      claimedAt: this.now(),
    };
    this.status = 'paused';
    this.nextBallAt = null;
    this.clearBallTimer();
    this.clearClaimTimer();
    this.claimTimer = setTimeout(() => {
      this.claimTimer = null;
      if (this.status === 'paused') {
        this.autoResolve();
        this.onChange(this);
      }
    }, this.timings.claimTimeoutMs);
    this.claimTimer.unref?.();
    this.touch();
    return this.claim;
  }

  /**
   * Resuelve una verificación.
   * - Digital: la confirma quien cantó (o el host) cuando acaba la animación; el servidor
   *   decide con su propia verificación.
   * - Físico: el host indica si el bingo es válido.
   */
  resolveClaim(playerId: string, accepted?: boolean): 'won' | 'resumed' {
    if (this.status !== 'paused' || !this.claim) {
      throw new GameError('E_STATE', 'No hay ningún bingo por verificar.');
    }
    let valid: boolean;
    if (this.gameType === 1) {
      if (playerId !== this.claim.playerId && playerId !== this.hostId) {
        throw new GameError('E_FORBIDDEN', 'Solo quien cantó el bingo puede confirmarlo.');
      }
      valid = this.claim.valid === true;
    } else {
      this.assertHost(playerId);
      valid = accepted === true;
    }
    return this.finishClaim(valid);
  }

  private autoResolve(): void {
    // Sin respuesta a tiempo: en digital vale la verificación del servidor; en físico se reanuda.
    this.finishClaim(this.gameType === 1 && this.claim?.valid === true);
  }

  private finishClaim(valid: boolean): 'won' | 'resumed' {
    this.clearClaimTimer();
    const claim = this.claim;
    if (valid && claim) {
      this.status = 'finished';
      this.winner = { id: claim.playerId, name: claim.playerName, avatar: claim.avatar };
      this.nextBallAt = null;
      this.clearBallTimer();
      this.touch();
      return 'won';
    }
    const player = claim ? this.players.get(claim.playerId) : undefined;
    if (player) {
      player.claimBlockedUntil = this.now() + 5 * this.timings.msPerSecond;
    }
    this.resumeAfterClaim();
    this.touch();
    return 'resumed';
  }

  private resumeAfterClaim(): void {
    this.clearClaimTimer();
    this.status = 'playing';
    this.claim = null;
    if (this.gameType === 1 && this.bag.length > 0) {
      this.scheduleNext(this.secondsBalls * this.timings.msPerSecond);
    }
  }

  /** El host da por terminada la partida sin ganador (p. ej. se acabaron las bolitas). */
  end(playerId: string): void {
    this.assertHost(playerId);
    if (this.status === 'waiting' || this.status === 'finished') {
      throw new GameError('E_STATE', 'La partida no está en curso.');
    }
    this.clearBallTimer();
    this.clearClaimTimer();
    this.nextBallAt = null;
    this.claim = null;
    this.winner = null;
    this.status = 'finished';
    this.touch();
  }

  /** Revancha: vuelve al lobby con los mismos jugadores. */
  rematch(playerId: string): void {
    this.assertHost(playerId);
    if (this.status !== 'finished') {
      throw new GameError('E_STATE', 'La partida todavía no terminó.');
    }
    this.clearBallTimer();
    this.clearClaimTimer();
    this.called = [];
    this.bag = [];
    this.claim = null;
    this.winner = null;
    this.nextBallAt = null;
    this.status = 'waiting';
    this.round++;
    // Quien quedó desconectado durante la partida no vuelve al lobby.
    for (const p of [...this.players.values()]) {
      if (p.socketId === null) this.removePlayer(p.id);
    }
    this.touch();
  }

  // ------------------------------------------------------------------ helpers

  private resetBag(): void {
    this.bag = Array.from({ length: TOTAL_BALLS }, (_, i) => i + 1);
  }

  private scheduleNext(delayMs: number): void {
    this.clearBallTimer();
    this.nextBallAt = this.now() + delayMs;
    this.ballTimer = setTimeout(() => {
      this.ballTimer = null;
      if (this.status !== 'playing') return;
      try {
        this.drawBall();
        this.onChange(this);
      } catch {
        // Nada más que sacar.
      }
    }, delayMs);
    this.ballTimer.unref?.();
  }

  private clearBallTimer(): void {
    if (this.ballTimer) {
      clearTimeout(this.ballTimer);
      this.ballTimer = null;
    }
  }

  private clearClaimTimer(): void {
    if (this.claimTimer) {
      clearTimeout(this.claimTimer);
      this.claimTimer = null;
    }
  }

  private touch(): void {
    this.lastActivity = this.now();
  }

  private parseBoard(raw: unknown): BoardCell[][] {
    const invalid = new GameError('E_BOARD', 'Tu cartón no es válido.');
    if (!Array.isArray(raw) || raw.length !== 5) throw invalid;
    const seen = new Set<number>();
    return raw.map((row: unknown) => {
      if (!Array.isArray(row) || row.length !== 5) throw invalid;
      return row.map((cell: unknown, col: number) => {
        const value = Number((cell as { value?: unknown } | null)?.value);
        const [min, max] = columnRange(col);
        if (!Number.isInteger(value) || value < min || value > max || seen.has(value)) {
          throw invalid;
        }
        seen.add(value);
        return { value, marked: (cell as { marked?: unknown }).marked === true };
      });
    });
  }

  private checkBoard(board: BoardCell[][]): boolean {
    const calledNumbers = new Set(this.called.map((b) => b.number));
    return board.every((row, r) =>
      row.every((cell, c) => !isInPattern(this.gameBoardType, r, c) || calledNumbers.has(cell.value)),
    );
  }

  dispose(): void {
    this.clearBallTimer();
    this.clearClaimTimer();
    this.clearHostTimer();
    for (const t of this.lobbyTimers.values()) clearTimeout(t);
    this.lobbyTimers.clear();
  }

  // -------------------------------------------------------------------- vista

  private publicPlayer(p: PlayerRecord): PublicPlayer {
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isHost: p.id === this.hostId,
      connected: p.socketId !== null,
    };
  }

  view(): RoomView {
    const claimant = this.claim ? this.players.get(this.claim.playerId) : undefined;
    const claimView: PublicPlayer | null = this.claim
      ? claimant
        ? this.publicPlayer(claimant)
        : {
            id: this.claim.playerId,
            name: this.claim.playerName,
            avatar: this.claim.avatar,
            isHost: false,
            connected: false,
          }
      : null;

    return {
      id: this.id,
      gameType: this.gameType,
      gameTypeName: this.gameType === 1 ? 'automatic' : 'manual',
      gameBoardType: this.gameBoardType,
      secondsBalls: this.secondsBalls,
      status: this.status,
      hostId: this.hostId,
      players: [...this.players.values()].map((p) => this.publicPlayer(p)),
      currentBall: this.called.at(-1) ?? null,
      calledBalls: this.called,
      remainingBalls: this.bag.length,
      exhausted: this.status !== 'waiting' && this.bag.length === 0,
      nextBallAt: this.status === 'playing' ? this.nextBallAt : null,
      serverNow: this.now(),
      playerLastUpdateGame: claimView,
      boardLastUpdateGame: this.claim?.board ?? null,
      claimValid: this.claim?.valid ?? null,
      winner: this.winner,
      round: this.round,
    };
  }
}
