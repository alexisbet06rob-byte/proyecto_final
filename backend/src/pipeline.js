// backend/src/pipeline.js — ANÁLISIS: una instancia de detectores por dispositivo/corrida.
import { readFileSync, existsSync } from 'node:fs';
import { crearDetectores } from './detectors/index.js';
import { generarCorrida } from '../../simulator/signals.js';

// Baseline de operación normal para EWMA. Con hardware real se genera con `npm run baseline -- <runId>`.
const RUTA_BASELINE = new URL('../config/baseline.json', import.meta.url);
function cargarBaseline() {
  if (existsSync(RUTA_BASELINE)) return JSON.parse(readFileSync(RUTA_BASELINE, 'utf8'));
  console.warn('[baseline] backend/config/baseline.json no existe: se usa baseline SIMULADO (solo para demo).');
  return [1, 2, 3, 4, 5].flatMap((s) => generarCorrida({ seed: s, n: 400 }).map((m) => m.lecturas));
}
const baseline = cargarBaseline();

const porDispositivo = new Map();   // deviceId -> { runId, detectores }

export function analizar(med) {
  let est = porDispositivo.get(med.deviceId);
  if (!est || est.runId !== med.runId) {            // corrida nueva => detectores limpios
    est = { runId: med.runId, detectores: crearDetectores(baseline) };
    porDispositivo.set(med.deviceId, est);
  }
  return est.detectores.map((d) => {
    const r = d.update(med.lecturas);
    return { algoritmo: d.nombre, anomalia: r.anomalia, score: r.score, detalle: r.detalle };
  });
}
