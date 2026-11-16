// backend/scripts/lib-eval.js
// Evalúa UN detector sobre un conjunto de corridas etiquetadas, con los mismos criterios para todos.
import { crearDetectores } from '../src/detectors/index.js';
import { FALLAS } from '../../simulator/signals.js';
import { INICIO } from './datasets.js';

export function evaluar(nombre, corridas, entrenamiento, params) {
  const cm = { TP: 0, FP: 0, TN: 0, FN: 0 };
  const lat = {}, total = {}, ok = {};
  let normales = 0, normalesConFalsaAlarma = 0, nObs = 0;

  for (const c of corridas) {
    const det = crearDetectores(entrenamiento, params).find((d) => d.nombre === nombre);  // instancia limpia por corrida
    let primera = null, falsa = false;
    for (const m of c.datos) {
      nObs++;
      const r = det.update(m.lecturas);
      const real = m.etiqueta === 'anomalia';
      if (r.anomalia && real) cm.TP++;
      else if (r.anomalia && !real) { cm.FP++; falsa = true; }
      else if (!r.anomalia && !real) cm.TN++;
      else cm.FN++;
      if (r.anomalia && real && primera === null) primera = m.i - INICIO;   // latencia en muestras (= segundos a 1 Hz)
    }
    const falla = c.datos[c.datos.length - 1].falla;
    if (falla === 'ninguna') { normales++; if (falsa) normalesConFalsaAlarma++; }
    else {
      total[falla] = (total[falla] ?? 0) + 1;
      if (primera !== null) { ok[falla] = (ok[falla] ?? 0) + 1; (lat[falla] ??= []).push(primera); }
    }
  }
  const media = (a) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null);
  const precision = cm.TP / (cm.TP + cm.FP || 1), recall = cm.TP / (cm.TP + cm.FN || 1);
  const f1 = (2 * precision * recall) / (precision + recall || 1);
  const porFalla = Object.fromEntries(Object.keys(FALLAS).map((f) => [f, {
    corridas: total[f] ?? 0, detectadas: ok[f] ?? 0, latenciaMedia: media(lat[f] ?? []),
  }]));
  return {
    nombre, nObs, ...cm,
    precision: +precision.toFixed(3), recall: +recall.toFixed(3), f1: +f1.toFixed(3),
    normales, normalesConFalsaAlarma, porFalla,
    latenciaMedia: media(Object.values(lat).flat()),
  };
}
