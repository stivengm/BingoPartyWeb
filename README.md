# Bingo Party

Bingo multijugador en tiempo real. Dos modos de juego:

- **Digital:** las bolitas salen solas cada N segundos y el servidor verifica el cartón de quien canta bingo.
- **Físico:** cada jugador usa su cartón de papel; el host saca las bolitas (al azar o registrando la que salió de su tómbola) y valida el bingo.

## Arquitectura

```
BingoPartyWeb/
├── src/        # Front Angular 21 (GitHub Pages)
└── server/     # Node + Socket.IO (Render). El servidor es la fuente de verdad
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
npm run server:dev   # servidor en http://localhost:3000 (instala antes: npm --prefix server install)
npm start            # front en http://localhost:4200 (usa environment.development.ts → localhost:3000)
```

Para probar el multijugador abre varias pestañas: cada pestaña es un jugador distinto.

| Script | Qué hace |
| --- | --- |
| `npm start` | Front con `ng serve` |
| `npm run server` / `npm run server:dev` | Servidor (el segundo con `--watch`) |
| `npm run server:test` | Tests del servidor (`node --test`) |
| `npm run build` | Build de producción del front |

Requiere Node ≥ 22.18 para el servidor (ejecuta TypeScript de forma nativa).

## Despliegue

### 1. Servidor en Render

**Con el blueprint** (`render.yaml`): en Render → *New* → *Blueprint* → elige este repositorio.

**A mano**: *New* → *Web Service* → este repositorio, y:

| Campo | Valor |
| --- | --- |
| Runtime | Node |
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Variables de entorno:

| Variable | Valor |
| --- | --- |
| `NODE_VERSION` | `22.18.0` (o superior) |
| `CORS_ORIGIN` | Origen del front, sin barra final: `https://stivengm.github.io` (varios separados por coma) |
| `MAX_ROOMS` | Opcional. Salas simultáneas (por defecto 2000) |

> El plan gratuito de Render **duerme el servicio** tras unos minutos sin tráfico y tarda ~30-60 s en despertar. El front conecta el socket nada más abrir la página, así que mientras la persona escribe su alias el servidor ya está despertando. Los botones de crear/unirse esperan a la conexión (hasta 90 s) en vez de fallar.

### 2. Front en GitHub Pages

1. Pon la URL del servicio de Render en `socketUrl` de `src/environments/environment.ts` (por defecto `https://bingopartybackend.onrender.com`).
2. Haz push a `master`: el workflow `.github/workflows/main.yml` prueba el servidor, compila y publica en GitHub Pages.

Si reutilizas el servicio de Render que ya existía, basta con apuntar su repositorio/Root Directory a `server` y mantener el mismo nombre para que la URL no cambie.
