// simulator/replay.js — PLAN B de la demostración: reproduce una corrida GRABADA (CSV) por MQTT.
// Los mensajes llevan reproduccion:true y el tablero muestra "REPRODUCCIÓN · datos grabados" (no se hace pasar por en vivo).
// Uso: node --env-file=../.env replay.js ../datos/grabaciones/sim-obstruccion.csv --hz 5
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import mqtt from 'mqtt';
import { parseCsv } from './csv.js';
import { UNIDADES } from './signals.js';

const archivo = process.argv[2];
if (!archivo) { console.error('Uso: node replay.js <archivo.csv> [--hz 5]'); process.exit(1); }
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const hz = +arg('hz', 1), deviceId = arg('device', 'pump-01');
const runId = `replay-${basename(archivo, '.csv')}-${Date.now() % 100000}`;
const datos = parseCsv(readFileSync(archivo, 'utf8'));

const client = mqtt.connect(process.env.MQTT_URL ?? 'mqtt://127.0.0.1:1883', { username: 'simulador', password: process.env.MQTT_PASS_SIM });
client.on('connect', () => {
  console.log(`[REPLAY] ${datos.length} muestras de ${archivo} como ${runId}`);
  let i = 0;
  const t = setInterval(() => {
    if (i >= datos.length) { clearInterval(t); return client.end(); }
    const m = datos[i++];
    client.publish(`motor/${deviceId}/telemetria`, JSON.stringify({
      deviceId, runId, ts: new Date().toISOString(), lecturas: m.lecturas, unidades: UNIDADES,
      etiqueta: m.etiqueta, falla: m.falla, reproduccion: true,
    }), { qos: 1 });
  }, 1000 / hz);
});
client.on('error', (e) => console.error('[REPLAY] error:', e.message));
