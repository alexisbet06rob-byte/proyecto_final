// backend/src/mqttClient.js
// Suscripción a los temas, validación y manejo de desconexiones.
import mqtt from 'mqtt';
import { config } from './config.js';
import { validarTelemetria } from './validate.js';

export function conectarMqtt({ onTelemetria, onEstado, onConexion }) {
  const client = mqtt.connect(config.mqtt.url, {
    username: config.mqtt.username,
    password: config.mqtt.password,
    clientId: `backend-${process.pid}`,
    reconnectPeriod: 2000,                 // si cae el broker, reintenta cada 2 s
  });

  client.on('connect', () => {
    console.log('[MQTT] conectado');
    client.subscribe(['motor/+/telemetria', 'motor/+/estado'], { qos: 1 });
    onConexion(true);
  });
  client.on('close', () => { console.warn('[MQTT] conexión perdida'); onConexion(false); });
  client.on('error', (e) => console.error('[MQTT] error:', e.message));

  client.on('message', (topic, payload) => {
    const [, deviceId, tipo] = topic.split('/');       // motor/{id}/{tipo}
    if (tipo === 'telemetria') {
      const r = validarTelemetria(payload, deviceId);
      if (!r.ok) return console.warn(`[MQTT] mensaje descartado (${topic}): ${r.error}`);
      onTelemetria(r.data);
    } else if (tipo === 'estado') {
      try { onEstado(deviceId, JSON.parse(payload.toString())); }
      catch { console.warn(`[MQTT] estado inválido en ${topic}`); }
    }
  });
  return client;
}
