// backend/src/config.js
// Configuración leída del entorno (node --env-file=../.env). Ningún secreto va en el código.
const req = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`Falta la variable de entorno ${k} (revisa tu .env)`);
  return v;
};

export const config = {
  port: Number(process.env.PORT ?? 3000),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/motor',
  mqtt: {
    url: process.env.MQTT_URL ?? 'mqtt://127.0.0.1:1883',
    username: process.env.MQTT_USER_BACKEND ?? 'backend',
    password: req('MQTT_PASS_BACKEND'),
  },
};
