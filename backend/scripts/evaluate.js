// backend/scripts/evaluate.js
// Evaluación FINAL sobre el conjunto de PRUEBA (no usado para ajustar). Mismos datos y criterios para los 3 métodos.
// Salidas en docs/resultados/: evaluacion.json, metricas.csv, latencia.csv, tablas.md y comparacion.svg
import { writeFileSync, mkdirSync } from 'node:fs';
import { PARAMS, CONFIG_ID, crearDetectores } from '../src/detectors/index.js';
import { entrenamiento, prueba, N, INICIO } from './datasets.js';
import { evaluar } from './lib-eval.js';
import { FALLAS } from '../../simulator/signals.js';

const corridas = prueba();
const nombres = crearDetectores(entrenamiento).map((d) => d.nombre);
const res = nombres.map((n) => evaluar(n, corridas, entrenamiento, PARAMS));
const nObs = res[0].nObs;

// ---- consola ----
console.log(`PRUEBA: ${corridas.length} corridas x ${N} muestras = ${nObs} observaciones. Configuración: ${CONFIG_ID}\n`);
for (const r of res) {
  console.log(`== ${r.nombre.toUpperCase()} == TP=${r.TP} FP=${r.FP} TN=${r.TN} FN=${r.FN} | precisión=${r.precision} recall=${r.recall} F1=${r.f1} | corridas normales con falsa alarma: ${r.normalesConFalsaAlarma}/${r.normales}`);
  for (const [f, v] of Object.entries(r.porFalla)) console.log(`   ${f.padEnd(15)} detectadas ${v.detectadas}/${v.corridas}  latencia media: ${v.latenciaMedia ?? '—'} muestras`);
}

// ---- archivos ----
const dir = new URL('../../docs/resultados/', import.meta.url);
mkdirSync(dir, { recursive: true });
const w = (nombre, txt) => writeFileSync(new URL(nombre, dir), txt);

w('evaluacion.json', JSON.stringify({ N, INICIO, observaciones: nObs, configuracion: CONFIG_ID, parametros: PARAMS, resultados: res }, null, 2));
w('metricas.csv', ['metodo,TP,FP,TN,FN,precision,recall,F1,corridas_normales_con_falsa_alarma,corridas_normales,latencia_media_muestras',
  ...res.map((r) => [r.nombre, r.TP, r.FP, r.TN, r.FN, r.precision, r.recall, r.f1, r.normalesConFalsaAlarma, r.normales, r.latenciaMedia ?? ''].join(','))].join('\n') + '\n');
w('latencia.csv', ['metodo,falla,corridas,detectadas,latencia_media_muestras',
  ...res.flatMap((r) => Object.entries(r.porFalla).map(([f, v]) => [r.nombre, f, v.corridas, v.detectadas, v.latenciaMedia ?? ''].join(',')))].join('\n') + '\n');

const fallas = Object.keys(FALLAS);
w('tablas.md', `# Resultados (conjunto de PRUEBA, señales simuladas)

- Observaciones: **${nObs}** (${corridas.length} corridas x ${N} muestras a 1 Hz). La condición inducida inicia en la muestra ${INICIO}.
- Configuración de los detectores: \`${CONFIG_ID}\` (elegida con el conjunto de validación).
- Latencia: muestras (= segundos a 1 Hz) desde el inicio de la condición hasta la primera alerta.

## Matriz de confusión y métricas (por muestra)
| Método | TP | FP | TN | FN | Precisión | Recall | F1 | Corridas normales con falsa alarma |
|---|---|---|---|---|---|---|---|---|
${res.map((r) => `| ${r.nombre} | ${r.TP} | ${r.FP} | ${r.TN} | ${r.FN} | ${r.precision} | ${r.recall} | ${r.f1} | ${r.normalesConFalsaAlarma}/${r.normales} |`).join('\n')}

## Detección y latencia por condición (corridas detectadas / total; latencia media en muestras)
| Condición | ${res.map((r) => r.nombre).join(' | ')} |
|---|${res.map(() => '---').join('|')}|
${fallas.map((f) => `| ${f} | ${res.map((r) => `${r.porFalla[f].detectadas}/${r.porFalla[f].corridas} (${r.porFalla[f].latenciaMedia ?? '—'})`).join(' | ')} |`).join('\n')}

> Resultados con datos **sintéticos**: son un ejemplo del análisis. Repetir con corridas reales del banco de pruebas.
`);

// Gráfica de barras (SVG) de recall y F1 por método
const W = 520, H = 260, base = 220, alto = 180, ancho = 36;
const barras = res.flatMap((r, i) => [['recall', r.recall, '#2563eb'], ['F1', r.f1, '#f59e0b']].map(([n, v, c], j) => {
  const x = 70 + i * 140 + j * (ancho + 6), h = v * alto;
  return `<rect x="${x}" y="${base - h}" width="${ancho}" height="${h}" fill="${c}"/><text x="${x + ancho / 2}" y="${base - h - 4}" font-size="11" text-anchor="middle">${v}</text>`;
}).join('') + `<text x="${70 + i * 140 + ancho + 3}" y="${base + 18}" font-size="12" text-anchor="middle">${r.nombre}</text>`).join('');
w('comparacion.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H + 30}" font-family="sans-serif">
<rect width="100%" height="100%" fill="white"/><text x="${W / 2}" y="20" font-size="14" text-anchor="middle" font-weight="bold">Recall y F1 por método (${nObs} observaciones, simuladas)</text>
<line x1="60" y1="${base}" x2="${W - 10}" y2="${base}" stroke="#94a3b8"/>${barras}
<rect x="${W - 130}" y="30" width="10" height="10" fill="#2563eb"/><text x="${W - 115}" y="39" font-size="11">recall</text>
<rect x="${W - 130}" y="46" width="10" height="10" fill="#f59e0b"/><text x="${W - 115}" y="55" font-size="11">F1</text></svg>
`);
console.log('\nGuardado en docs/resultados/: evaluacion.json, metricas.csv, latencia.csv, tablas.md, comparacion.svg');
