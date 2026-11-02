# Bingo Party

Bingo multijugador en tiempo real. Dos modos de juego:

- **Digital:** las bolitas salen solas cada N segundos y el servidor verifica el cartón de quien canta bingo.
- **Físico:** cada jugador usa su cartón de papel; el host saca las bolitas (al azar o registrando la que salió de su tómbola) y valida el bingo.

## Arquitectura

```
BingoPartyWeb/
├── src/        # Front Angular 21
└── server/     # Node + Socket.IO + servidor estático del front (todo en un servicio de Render)
    ├── src/
    │   ├── bingo-room.ts      # Motor del juego (jugadores, bolitas, bingo, revancha)
    │   ├── room-manager.ts    # Salas activas, códigos de 6 dígitos, limpieza
    │   ├── socket-handlers.ts # Eventos Socket.IO ↔ motor + límites anti-abuso
    │   └── app.ts / index.ts  # HTTP (/health) + Socket.IO
    └── test/                  # node:test: motor + integración con sockets reales
```

- El **temporizador de las bolitas vive en el servidor**: no depende de la pestaña del host. Cada bolita se emite a todos los jugadores al instante por una conexión persistente.
- El servidor genera las bolitas con `crypto.randomInt` y **verifica los cartones** (no confía en el cliente).
- Reconexión: si recargas la página o se corta la red vuelves a tu misma silla.
- Si el host se desconecta más de 30 s, el rol pasa a otro jugador.
- Una sala sin nadie conectado se elimina a los 10 min.

### Flujo de una partida

| Digital | Físico |
| --- | --- |
| El host inicia → cuenta regresiva 3-2-1 → las bolitas salen solas | El host inicia → saca cada bolita con el botón (o escribe el número de su tómbola) |
| Cualquiera canta bingo → el servidor pausa y verifica; se anima la verificación en todas las pantallas | Cualquiera canta bingo → el host revisa el cartón físico y marca *Es válido* / *No es válido* |
| Bingo válido = ganador; incompleto = se reanuda (con 5 s de espera para quien falló) | Igual |

Cuando salen las **75 bolitas** todos reciben una alerta para verificar el ganador, y el host puede finalizar la partida sin ganador. Al terminar, el host puede iniciar una **nueva partida** con los mismos jugadores.

## Desarrollo

```bash
npm install
npm run server:dev   # servidor en http://localhost:3000
npm start            # front en http://localhost:4200 (environment.development.ts → localhost:3000)
```

Para probar el multijugador abre varias pestañas: cada pestaña es un jugador distinto.

| Script | Qué hace |
| --- | --- |
| `npm start` | Front con `ng serve` |
| `npm run server` / `npm run server:dev` | Servidor (el segundo con `--watch`) |
| `npm run server:check` | Typecheck del servidor |
| `npm run server:test` | Tests del servidor (`node --test`) |
| `npm run build` | Build de producción del front en `dist/BingoPartyWeb/` |
| `npm run start:prod` | Build + servidor sirviendo el front en el puerto 3000 |

Requiere Node ≥ 22.18 (el servidor ejecuta TypeScript de forma nativa).

## Despliegue (Render, un solo servicio)

Igual que Roll&Run: **un único servicio** de Render construye Angular y el servidor de Node sirve el front y los sockets en el mismo origen. No hay CORS ni URLs que configurar, y recargar `/lobby` o `/game_curse` funciona (el servidor devuelve `index.html` para las rutas de Angular).

**Con el blueprint** (`render.yaml`): *New* → *Blueprint* → elige este repositorio.

**A mano**: *New* → *Web Service* → este repositorio, y:

| Campo | Valor |
| --- | --- |
| Runtime | Node |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm run server` |
| Health Check Path | `/health` |

Variables de entorno: `NODE_VERSION=22.18.0` (o superior). Opcionales: `MAX_ROOMS` (salas simultáneas, 2000 por defecto), `CORS_ORIGIN` (solo si sirves el front desde otro dominio).

> El plan gratuito de Render **duerme el servicio** tras unos minutos sin tráfico y tarda ~30-60 s en despertar. Al abrir la URL se despierta; el front conecta el socket desde que carga, y los botones de crear/unirse esperan la conexión (hasta 90 s) en vez de fallar.

El workflow de GitHub (`.github/workflows/main.yml`) solo valida tipos, tests y build en cada push; el despliegue lo hace Render al detectar el push a `master` (*Auto-Deploy*).
