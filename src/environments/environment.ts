import packageJson from '../../package.json';

export const environment = {
    version: packageJson.version,
    production: true,
    // Mismo origen: el servidor de Render sirve el front y los sockets (ver README → Despliegue).
    socketUrl: ""
};
