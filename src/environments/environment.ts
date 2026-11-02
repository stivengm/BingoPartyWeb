import packageJson from '../../package.json';

export const environment = {
    version: packageJson.version,
    production: true,
    // URL del servicio desplegado en Render (ver README → Despliegue).
    socketUrl: "https://bingopartybackend.onrender.com"
};
