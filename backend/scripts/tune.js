// backend/scripts/tune.js
// Elige el LÍMITE DE ALERTA y la persistencia de MAD y EWMA con el conjunto de VALIDACIÓN (no con el de prueba).
// Criterio: 0 corridas normales con falsa alarma -> mayor F1 -> menor latencia media.
// Resultado: backend/config/params.json (lo lee detectors/index.js).
import { writeFileSync, mkdirSync } from 'node:fs';
import { PARAMS } from '../src/detectors/index.js';
import { entrenamiento, validacion } from './datasets.js';
import { evaluar } from './lib-eval.js';

const val = validacion();
const mejor = (cands, nombre) => {
  const filas = cands.map(({ cfg, params }) => ({ cfg, r: evaluar(nombre, val, entrenamiento, params) }))
    .filter(({ r }) => r.normalesConFalsaAlarma === 0);
  filas.sort((a, b) => b.r.f1 - a.r.f1 || (a.r.latenciaMedia ?? 1e9) - (b.r.latenciaMedia ?? 1e9));
  return filas[0];
};

const candMad = [], candEwma = [];
for (const k of [3, 3.5, 4, 5]) for (const persistencia of [2, 3, 5])
  candMad.push({ cfg: { k, persistencia }, params: { ...PARAMS, mad: { ...PARAMS.mad, k, persistencia } } });
for (const lambda of [0.1, 0.2, 0.3]) for (const L of [2.5, 3, 3.5, 4]) for (const persistencia of [2, 3, 5])
  candEwma.push({ cfg: { lambda, L, persistencia }, params: { ...PARAMS, ewma: { lambda, L, persistencia } } });

const mad = mejor(candMad, 'mad'), ewma = mejor(candEwma, 'ewma');
if (!mad || !ewma) throw new Error('Ninguna configuración cumple 0 falsas alarmas en validación');

const salida = {
  mad: mad.cfg, ewma: ewma.cfg,
  _validacion: {
    criterio: '0 corridas normales con falsa alarma > mayor F1 > menor latencia',
    observaciones: mad.r.nObs,
    mad: { f1: mad.r.f1, recall: mad.r.recall, latenciaMedia: mad.r.latenciaMedia },
    ewma: { f1: ewma.r.f1, recall: ewma.r.recall, latenciaMedia: ewma.r.latenciaMedia },
  },
};
mkdirSync(new URL('../config/', import.meta.url), { recursive: true });
writeFileSync(new URL('../config/params.json', import.meta.url), JSON.stringify(salida, null, 2) + '\n');
console.log('Parámetros elegidos con VALIDACIÓN (%d observaciones):', mad.r.nObs);
console.log(JSON.stringify(salida, null, 2));
