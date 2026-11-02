import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { BingoRoom, GameError } from '../src/bingo-room.ts';
import type { RoomOptions } from '../src/bingo-room.ts';

const rooms: BingoRoom[] = [];

function makeRoom(overrides: Partial<RoomOptions> = {}): BingoRoom {
  const room = new BingoRoom({
    id: '123456',
    gameType: 1,
    gameBoardType: 1,
    secondsBalls: 10,
    timings: { countdownMs: 0, msPerSecond: 1, minSeconds: 1, claimTimeoutMs: 60_000 },
    ...overrides,
  });
  rooms.push(room);
  return room;
}

/** Cartón válido: columna B 1-5, I 16-20, etc. (fila 2 = 3, 18, 33, 48, 63). */
function board(): { value: number }[][] {
  return Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => ({ value: c * 15 + 1 + r })),
  );
}

function expectCode(fn: () => unknown, code: string): void {
  assert.throws(fn, (err: unknown) => err instanceof GameError && err.code === code);
}

afterEach(() => {
  rooms.splice(0).forEach((r) => r.dispose());
});

describe('jugadores', () => {
  it('el primero en entrar es el anfitrión', () => {
    const room = makeRoom();
    const host = room.join('Ana', 'gato', 's1');
    const guest = room.join('Luis', 'perro', 's2');
    assert.equal(room.hostId, host.id);
    assert.notEqual(host.id, guest.id);
    assert.equal(room.view().players.length, 2);
  });

  it('rechaza nombres repetidos conectados y deja recuperar una silla desconectada', () => {
    const room = makeRoom();
    room.join('Ana', 'gato', 's1');
    const luis = room.join('Luis', 'perro', 's2');
    expectCode(() => room.join('luis', 'perro', 's3'), 'E_NAME_TAKEN');
    room.disconnect(luis.id, 's2');
    const back = room.join('Luis', 'perro', 's3');
    assert.equal(back.id, luis.id);
    assert.equal(back.reclaimed, true);
  });

  it('no deja entrar con la partida empezada', () => {
    const room = makeRoom();
    const host = room.join('Ana', 'gato', 's1');
    room.start(host.id);
    expectCode(() => room.join('Luis', 'perro', 's2'), 'E_STARTED');
  });

  it('sanea nombres vacíos y larguísimos', () => {
    const room = makeRoom();
    expectCode(() => room.join('   ', '', 's1'), 'E_NAME');
    room.join('x'.repeat(50), '../../etc', 's2');
    const [p] = room.view().players;
    assert.equal(p.name.length, 20);
    assert.equal(p.avatar, '');
  });

  it('traspasa el anfitrión si el que sale se va del todo', () => {
    const room = makeRoom();
    const host = room.join('Ana', 'gato', 's1');
    const guest = room.join('Luis', 'perro', 's2');
    room.removePlayer(host.id);
    assert.equal(room.hostId, guest.id);
  });
});

describe('juego digital', () => {
  it('solo el anfitrión inicia y las bolitas salen solas sin repetirse', async () => {
    const room = makeRoom({ timings: { countdownMs: 0, msPerSecond: 1, minSeconds: 1 }, secondsBalls: 1 });
    const host = room.join('Ana', 'gato', 's1');
    const guest = room.join('Luis', 'perro', 's2');
    expectCode(() => room.start(guest.id), 'E_NOT_HOST');
    room.start(host.id);
    assert.equal(room.status, 'playing');
    await new Promise((r) => setTimeout(r, 400));
    const balls = room.view().calledBalls.map((b) => b.number);
    assert.ok(balls.length > 10, `salieron ${balls.length}`);
    assert.equal(new Set(balls).size, balls.length);
  });

  it('al sacar las 75 se detiene y marca exhausted', () => {
    const room = makeRoom({ timings: { countdownMs: 0, msPerSecond: 1_000_000, minSeconds: 1 } });
    const host = room.join('Ana', 'gato', 's1');
    room.start(host.id);
    for (let i = 0; i < 75; i++) room.drawBall();
    const view = room.view();
    assert.equal(view.calledBalls.length, 75);
    assert.equal(view.exhausted, true);
    assert.equal(view.nextBallAt, null);
    expectCode(() => room.drawBall(), 'E_EXHAUSTED');
  });

  it('el servidor decide si el bingo es válido, no el cliente', () => {
    const room = makeRoom({ gameBoardType: 1, timings: { countdownMs: 0, msPerSecond: 1_000_000, minSeconds: 1 } });
    const host = room.join('Ana', 'gato', 's1');
    room.start(host.id);

    // Patrón 1 = fila central: 3, 18, 33, 48, 63.
    room.callBingo(host.id, board());
    assert.equal(room.status, 'paused');
    assert.equal(room.view().claimValid, false);
    assert.equal(room.resolveClaim(host.id), 'resumed');
    assert.equal(room.status, 'playing');
  });
});

describe('verificación', () => {
  it('bingo válido → ganador; la partida queda finished y permite revancha', () => {
    const room = makeRoom({ gameBoardType: 1, timings: { countdownMs: 0, msPerSecond: 1_000_000, minSeconds: 1 } });
    const host = room.join('Ana', 'gato', 's1');
    const guest = room.join('Luis', 'perro', 's2');
    const third = room.join('Eva', 'leon', 's3');
    room.start(host.id);
    // Sacar las 75 garantiza que cualquier cartón válido sea ganador.
    for (let i = 0; i < 75; i++) room.drawBall();
    room.callBingo(guest.id, board());
    assert.equal(room.view().claimValid, true);
    expectCode(() => room.resolveClaim(third.id), 'E_FORBIDDEN');
    assert.equal(room.resolveClaim(guest.id), 'won');
    assert.equal(room.status, 'finished');
    assert.equal(room.view().winner?.name, 'Luis');

    expectCode(() => room.rematch(guest.id), 'E_NOT_HOST');
    room.rematch(host.id);
    assert.equal(room.status, 'waiting');
    assert.equal(room.view().calledBalls.length, 0);
    assert.equal(room.view().round, 2);
  });

  it('rechaza cartones manipulados', () => {
    const room = makeRoom({ timings: { countdownMs: 0, msPerSecond: 1_000_000, minSeconds: 1 } });
    const host = room.join('Ana', 'gato', 's1');
    room.start(host.id);
    const bad = board();
    bad[0][0] = { value: 99 };
    expectCode(() => room.callBingo(host.id, bad), 'E_BOARD');
    expectCode(() => room.callBingo(host.id, 'hola'), 'E_BOARD');
  });

  it('un bingo incompleto castiga con unos segundos de espera', () => {
    let t = 0;
    const room = makeRoom({
      now: () => t,
      timings: { countdownMs: 0, msPerSecond: 1000, minSeconds: 1 },
    });
    const host = room.join('Ana', 'gato', 's1');
    room.start(host.id);
    room.callBingo(host.id, board());
    room.resolveClaim(host.id);
    expectCode(() => room.callBingo(host.id, board()), 'E_COOLDOWN');
    t += 6000;
    room.callBingo(host.id, board());
  });
});

describe('juego físico', () => {
  function physical(): { room: BingoRoom; host: string; guest: string } {
    const room = makeRoom({ gameType: 2, timings: { countdownMs: 0, msPerSecond: 1_000_000, minSeconds: 1 } });
    const host = room.join('Ana', 'gato', 's1');
    const guest = room.join('Luis', 'perro', 's2');
    room.start(host.id);
    return { room, host: host.id, guest: guest.id };
  }

  it('no hay temporizador: solo el anfitrión saca bolitas', () => {
    const { room, host, guest } = physical();
    assert.equal(room.view().nextBallAt, null);
    expectCode(() => room.hostDrawBall(guest), 'E_NOT_HOST');
    const ball = room.hostDrawBall(host);
    assert.equal(room.view().currentBall?.number, ball.number);
  });

  it('el anfitrión puede registrar el número que salió de la tómbola y no repetirlo', () => {
    const { room, host } = physical();
    const ball = room.hostDrawBall(host, 42);
    assert.equal(ball.value, 'N42');
    expectCode(() => room.hostDrawBall(host, 42), 'E_BALL');
    expectCode(() => room.hostDrawBall(host, 99), 'E_BALL');
  });

  it('el bingo lo decide el anfitrión', () => {
    const { room, host, guest } = physical();
    room.callBingo(guest, undefined);
    assert.equal(room.status, 'paused');
    assert.equal(room.view().claimValid, null);
    expectCode(() => room.resolveClaim(guest, true), 'E_NOT_HOST');
    assert.equal(room.resolveClaim(host, true), 'won');
    assert.equal(room.view().winner?.name, 'Luis');
  });

  it('si el anfitrión rechaza, el juego sigue', () => {
    const { room, host, guest } = physical();
    room.callBingo(guest, undefined);
    assert.equal(room.resolveClaim(host, false), 'resumed');
    assert.equal(room.status, 'playing');
  });

  it('el anfitrión puede terminar sin ganador', () => {
    const { room, host } = physical();
    room.end(host);
    assert.equal(room.status, 'finished');
    assert.equal(room.view().winner, null);
  });
});
