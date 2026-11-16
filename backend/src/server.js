// backend/src/server.js — integra MQTT -> detectores -> MongoDB -> SSE/REST.
import express from 'express';
import mongoose from 'mongoose';
import { config } from './config.js';
import { conectarMqtt } from './mqttClient.js';
import { Medicion, Anomalia, conectarMongo } from './models.js';
import { analizar } from './pipeline.js';
import { PARAMS, CONFIG_ID } from './detectors/index.js';
import { sseHandler, emitir } from './sse.js';

const app = express();
const estado = { mqttConectado: false, dispositivos: {} };   // estado en memoria para el tablero

await conectarMongo();

conectarMqtt({
  onConexion: (ok) => { estado.mqttConectado = ok; emitir('broker', { conectado: ok }); },
  onEstado: (id, e) => { (estado.dispositivos[id] ??= {}).estado = e.status; emitir('estado', { deviceId: id, ...e }); },

  onTelemetria: async (med) => {
    const resultados = analizar(med);
    const resumen = resultados.map(({ algoritmo, anomalia, score }) => ({ algoritmo, anomalia, score }));
    const dev = (estado.dispositivos[med.deviceId] ??= {});
    dev.ultima = { ...med, resultados: resumen };
    emitir('telemetria', dev.ultima);                    // tiempo real

    try {
      await Medicion.create({ ...med, config: CONFIG_ID, resultados: resumen });   // persistencia (con la configuración usada)
      // Evento anómalo SOLO cuando la alarma se activa (flanco de subida), no en cada muestra
      dev.alarmas ??= {};
      for (const r of resultados) {
        if (r.anomalia && !dev.alarmas[r.algoritmo]) {
          const ev = await Anomalia.create({
            ts: med.ts, deviceId: med.deviceId, runId: med.runId, algoritmo: r.algoritmo,
            score: r.score, detalle: r.detalle, parametros: { ...PARAMS, id: CONFIG_ID }, lecturas: med.lecturas,
          });
          emitir('anomalia', ev);
        }
        dev.alarmas[r.algoritmo] = r.anomalia;
      }
    } catch (e) { console.error('[DB]', e.message); }
  },
});

// ---------- REST (historial) ----------
const filtro = (q) => {
  const f = {};
  if (q.deviceId) f.deviceId = q.deviceId;
  if (q.runId) f.runId = q.runId;
  if (q.from || q.to) f.ts = { ...(q.from && { $gte: new Date(q.from) }), ...(q.to && { $lte: new Date(q.to) }) };
  return f;
};
const limite = (q) => Math.min(Number(q.limit) || 100, 1000);

// Express 5 captura los errores de handlers async automáticamente.
app.get('/api/health', (_q, r) => r.json({ ok: true, mongo: mongoose.connection.readyState === 1, mqtt: estado.mqttConectado }));
app.get('/api/state', (_q, r) => r.json(estado));
app.get('/api/stream', sseHandler);
app.get('/api/measurements', async (q, r) => r.json(await Medicion.find(filtro(q.query)).sort({ ts: -1 }).limit(limite(q.query)).lean()));
app.get('/api/anomalies',    async (q, r) => r.json(await Anomalia.find(filtro(q.query)).sort({ ts: -1 }).limit(limite(q.query)).lean()));
app.get('/api/runs', async (_q, r) => r.json(await Medicion.aggregate([
  { $group: { _id: { deviceId: '$deviceId', runId: '$runId' }, n: { $sum: 1 }, desde: { $min: '$ts' }, hasta: { $max: '$ts' } } },
  { $sort: { hasta: -1 } },
])));

app.listen(config.port, () => console.log(`API en http://127.0.0.1:${config.port}`));
