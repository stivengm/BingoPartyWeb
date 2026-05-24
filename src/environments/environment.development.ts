import packageJson from '../../package.json';

export const environment = {
    version: packageJson.version,
    production: false,
    apiUrl: "http://localhost:3000",
};
