// simulator/publisher.js  — hace el papel del ESP32 mientras no tengas el hardware.
// Uso: node --env-file=../.env publisher.js --run run-normal-01 --n 300
//      node --env-file=../.env publisher.js --run run-obs-01 --falla obstruccion --inicio 120 --n 300
import mqtt from 'mqtt';
import { generarCorrida, UNIDADES } from './signals.js';

// Lector mínimo de argumentos: --nombre valor
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const deviceId = arg('device', 'pump-01');
const runId    = arg('run', `run-${Date.now()}`);
const falla    = arg('falla', 'ninguna');
const n        = +arg('n', 600);
const inicio   = +arg('inicio', Math.floor(n / 2));
const hz       = +arg('hz', 1);
const seed     = +arg('seed', Date.now() % 100000);

const datos = generarCorrida({ seed, n, falla, inicio });
const tEstado = `motor/${deviceId}/estado`;
const tTel    = `motor/${deviceId}/telemetria`;

const client = mqtt.connect(process.env.MQTT_URL ?? 'mqtt://127.0.0.1:1883', {
  username: 'simulador',
  password: process.env.MQTT_PASS_SIM,
  // Last Will: si este proceso muere sin avisar, el BROKER publica "offline".
  will: { topic: tEstado, payload: JSON.stringify({ status: 'offline' }), qos: 1, retain: true },
});

client.on('connect', () => {
  console.log(`[SIM] ${deviceId} corrida=${runId} falla=${falla} inicio=${inicio} n=${n}`);
  client.publish(tEstado, JSON.stringify({ status: 'online', runId }), { qos: 1, retain: true });
  let i = 0;
  const timer = setInterval(() => {
    if (i >= datos.length) {                       // fin de la corrida
      clearInterval(timer);
      client.publish(tEstado, JSON.stringify({ status: 'offline', runId }), { qos: 1, retain: true }, () => client.end());
      return;
    }
    const m = datos[i++];
    client.publish(tTel, JSON.stringify({
      deviceId, runId, ts: new Date().toISOString(),
      lecturas: m.lecturas, unidades: UNIDADES, etiqueta: m.etiqueta, falla: m.falla,
    }), { qos: 1 });
  }, 1000 / hz);
});
client.on('error', (e) => console.error('[SIM] error:', e.message));
