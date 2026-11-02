import packageJson from '../../package.json';

export const environment = {
    version: packageJson.version,
    production: false,
    // Servidor de Socket.IO (carpeta /server). En local: `npm run server`.
    socketUrl: "http://localhost:3000"
};
