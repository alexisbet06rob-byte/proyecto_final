// backend/scripts/export-csv.js — exporta a CSV las mediciones REALES de una corrida guardadas en MongoDB.
// Uso: npm run export -- <runId>      ->  datos/<runId>.csv   (evidencia experimental)
import mongoose from 'mongoose';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Medicion } from '../src/models.js';
import { config } from '../src/config.js';

const runId = process.argv[2];
if (!runId) { console.error('Uso: npm run export -- <runId>'); process.exit(1); }
await mongoose.connect(config.mongoUri);
const docs = await Medicion.find({ runId }).sort({ ts: 1 }).lean();
const dir = new URL('../../datos/', import.meta.url);
mkdirSync(dir, { recursive: true });
const filas = docs.map((d, i) => [i, d.etiqueta ?? '', d.falla ?? '', d.lecturas.corriente_A, d.lecturas.vibracion_g, d.lecturas.temperatura_C].join(','));
writeFileSync(new URL(`${runId}.csv`, dir), ['i,etiqueta,falla,corriente_A,vibracion_g,temperatura_C', ...filas].join('\n') + '\n');
console.log(`datos/${runId}.csv  (${docs.length} muestras)`);
await mongoose.disconnect();
