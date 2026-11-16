// backend/src/detectors/index.js
// Fábrica de detectores: UNA sola configuración, usada por el backend y por los scripts de evaluación.
// Los parámetros por defecto se sustituyen por los que elige `npm run tune` con el conjunto de VALIDACIÓN
// (se guardan en backend/config/params.json).
import { readFileSync, existsSync } from 'node:fs';
import { ThresholdDetector, LIMITES_DEFAULT } from './thresholds.js';
import { MadDetector } from './mad.js';
import { EwmaDetector } from './ewma.js';
import { conPersistencia } from './persistence.js';

const RUTA_PARAMS = new URL('../../config/params.json', import.meta.url);

// persistencia = nº de muestras anómalas CONSECUTIVAS necesarias para alertar
const DEFAULT = {
  umbrales: { limites: LIMITES_DEFAULT, persistencia: 3 },
  mad:  { ventana: 60, minMuestras: 30, k: 3.5, persistencia: 3, pisoMad: { corriente_A: 0.01, vibracion_g: 0.005, temperatura_C: 0.1 } },
  ewma: { lambda: 0.2, L: 3.5, persistencia: 3 },
};
const ajustados = existsSync(RUTA_PARAMS) ? JSON.parse(readFileSync(RUTA_PARAMS, 'utf8')) : {};

export const PARAMS = {
  umbrales: { ...DEFAULT.umbrales, ...ajustados.umbrales },
  mad:      { ...DEFAULT.mad,      ...ajustados.mad },
  ewma:     { ...DEFAULT.ewma,     ...ajustados.ewma },
};

/** Identificador corto de la configuración: se guarda en cada medición para trazabilidad. */
export const configId = (p = PARAMS) =>
  `umbrales(p${p.umbrales.persistencia})|mad(w${p.mad.ventana},k${p.mad.k},p${p.mad.persistencia})|ewma(l${p.ewma.lambda},L${p.ewma.L},p${p.ewma.persistencia})`;
export const CONFIG_ID = configId();

/** @param {Array<Object>} muestrasNormales  lecturas normales para ajustar EWMA;  p: parámetros (por defecto PARAMS) */
export function crearDetectores(muestrasNormales, p = PARAMS) {
  return [
    conPersistencia(new ThresholdDetector(p.umbrales.limites), p.umbrales.persistencia),
    conPersistencia(new MadDetector(p.mad), p.mad.persistencia),
    conPersistencia(new EwmaDetector(p.ewma).fit(muestrasNormales), p.ewma.persistencia),
  ];
}
