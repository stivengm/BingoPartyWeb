import packageJson from '../../package.json';

export const environment = {
    version: packageJson.version,
    production: false,
    apiUrl: "http://localhost:3000",
    firebaseConfig: {
        apiKey: "AIzaSyA-v_9ENamID9Zvr9D4I0IOINVtRIxlJik",
        authDomain: "bingoparty-df037.firebaseapp.com",
        databaseURL: "https://bingoparty-df037-default-rtdb.firebaseio.com",
        projectId: "bingoparty-df037",
        storageBucket: "bingoparty-df037.firebasestorage.app",
        messagingSenderId: "731276439623",
        appId: "1:731276439623:web:2f87e8a7eeb90fb0a70162",
        measurementId: "G-DBGV8YXTXY"
    }
};
