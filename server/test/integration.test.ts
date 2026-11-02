import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { io as connect } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { createGameServer } from '../src/app.ts';
import type { GameServer } from '../src/app.ts';

let server: GameServer;
let url: string;
const sockets: Socket[] = [];

function client(): Promise<Socket> {
  const socket = connect(url, { transports: ['websocket'], reconnection: false });
  sockets.push(socket);
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

interface Reply {
  code: string;
  message: string;
  data: any;
}

function call(socket: Socket, event: string, payload: unknown = {}): Promise<Reply> {
  return new Promise((resolve) => socket.emit(event, payload, resolve));
}

function nextState(socket: Socket, predicate: (s: any) => boolean = () => true): Promise<any> {
  return new Promise((resolve) => {
    const handler = (state: any) => {
      if (predicate(state)) {
        socket.off('room:state', handler);
        resolve(state);
      }
    };
    socket.on('room:state', handler);
  });
}

before(async () => {
  server = createGameServer({
    timings: { countdownMs: 0, msPerSecond: 5, minSeconds: 1 },
    corsOrigin: true,
  });
  const port = await server.listen(0, '127.0.0.1');
  url = `http://127.0.0.1:${port}`;
});

after(async () => {
  sockets.forEach((s) => s.close());
  await server.close();
});

describe('servidor', () => {
  it('responde /health', async () => {
    const res = await fetch(`${url}/health`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);
  });

  it('crea sala, une jugadores y reparte el estado a todos', async () => {
    const host = await client();
    const guest = await client();
    const created = await call(host, 'room:create', {
      hostName: 'Ana',
      avatar: 'gato',
      gameType: 1,
      gameBoardType: 8,
      secondsBalls: 3,
    });
    assert.equal(created.code, 'CR001');
    assert.match(created.data.room.id, /^\d{6}$/);

    const seen = nextState(host, (s) => s.players.length === 2);
    const joined = await call(guest, 'room:join', {
      roomId: created.data.room.id,
      playerName: 'Luis',
      avatar: 'perro',
    });
    assert.equal(joined.code, 'JR001');
    assert.equal((await seen).players.length, 2);

    const wrong = await call(guest, 'room:join', { roomId: '000000', playerName: 'X' });
    assert.equal(wrong.code, 'E_NO_ROOM');
  });

  it('juego digital: las bolitas llegan solas por el socket', async () => {
    const host = await client();
    const created = await call(host, 'room:create', {
      hostName: 'Ana',
      gameType: 1,
      gameBoardType: 1,
      secondsBalls: 1,
    });
    const gotBalls = nextState(host, (s) => s.calledBalls.length >= 3);
    const started = await call(host, 'game:start');
    assert.equal(started.code, 'UR001');
    const state = await gotBalls;
    assert.equal(state.status, 'playing');
    assert.ok(state.currentBall.number >= 1);
    assert.equal(created.data.room.gameBoardType, 1);
  });

  it('juego físico: el anfitrión saca la bolita y un jugador canta bingo', async () => {
    const host = await client();
    const guest = await client();
    const { data } = await call(host, 'room:create', {
      hostName: 'Ana',
      gameType: 2,
      gameBoardType: 2,
      secondsBalls: 10,
    });
    await call(guest, 'room:join', { roomId: data.room.id, playerName: 'Luis' });
    await call(host, 'game:start');

    assert.equal((await call(guest, 'game:ball:next')).code, 'E_NOT_HOST');
    const ball = await call(host, 'game:ball:next', { number: 7 });
    assert.equal(ball.data.value, 'B7');

    const paused = nextState(host, (s) => s.status === 'paused');
    await call(guest, 'game:bingo');
    const state = await paused;
    assert.equal(state.playerLastUpdateGame.name, 'Luis');

    const finished = nextState(guest, (s) => s.status === 'finished');
    await call(host, 'game:bingo:resolve', { accepted: true });
    assert.equal((await finished).winner.name, 'Luis');
  });

  it('reconexión: un socket nuevo recupera su silla', async () => {
    const host = await client();
    const { data } = await call(host, 'room:create', {
      hostName: 'Ana',
      gameType: 1,
      gameBoardType: 3,
      secondsBalls: 10,
    });
    host.close();
    const again = await client();
    const back = await call(again, 'room:rejoin', { roomId: data.room.id, playerId: data.playerId });
    assert.equal(back.code, 'JR001');
    assert.equal(back.data.room.hostId, data.playerId);

    const stranger = await client();
    const denied = await call(stranger, 'room:rejoin', { roomId: data.room.id, playerId: 'nope' });
    assert.equal(denied.code, 'E_NO_PLAYER');
  });

  it('valida los parámetros de creación', async () => {
    const s = await client();
    assert.equal((await call(s, 'room:create', { hostName: 'Ana' })).code, 'E_PARAMS');
    assert.equal(
      (await call(s, 'room:create', { hostName: '', gameType: 1, gameBoardType: 1 })).code,
      'E_NAME',
    );
  });
});
