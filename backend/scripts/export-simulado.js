// backend/scripts/export-simulado.js
// Exporta corridas SIMULADAS a CSV en datos/grabaciones/ (evidencia reproducible y material del plan B de reproducción).
import { writeFileSync, mkdirSync } from 'node:fs';
import { generarCorrida, FALLAS } from '../../simulator/signals.js';
import { N, INICIO } from './datasets.js';

const dir = new URL('../../datos/grabaciones/', import.meta.url);
mkdirSync(dir, { recursive: true });
const casos = [['normal', 'ninguna', 301], ...Object.keys(FALLAS).map((f, i) => [f, f, 310 + i])];
for (const [nombre, falla, seed] of casos) {
  const filas = generarCorrida({ seed, n: N, falla, inicio: INICIO });
  const csv = ['i,etiqueta,falla,corriente_A,vibracion_g,temperatura_C',
    ...filas.map((m) => [m.i, m.etiqueta, m.falla, m.lecturas.corriente_A, m.lecturas.vibracion_g, m.lecturas.temperatura_C].join(','))].join('\n') + '\n';
  writeFileSync(new URL(`sim-${nombre}.csv`, dir), csv);
  console.log(`sim-${nombre}.csv  (${filas.length} muestras, semilla ${seed})`);
}
