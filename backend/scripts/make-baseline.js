// backend/scripts/make-baseline.js — genera el baseline normal desde una corrida REAL guardada en Mongo.
// Uso: npm run baseline -- run-normal-01
import mongoose from 'mongoose';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Medicion } from '../src/models.js';
import { config } from '../src/config.js';

const runId = process.argv[2];
if (!runId) { console.error('Uso: npm run baseline -- <runId>'); process.exit(1); }
await mongoose.connect(config.mongoUri);
const docs = await Medicion.find({ runId, etiqueta: 'normal' }).sort({ ts: 1 }).lean();
const dir = new URL('../config/', import.meta.url);          // backend/config/
mkdirSync(dir, { recursive: true });
writeFileSync(new URL('baseline.json', dir), JSON.stringify(docs.map((d) => d.lecturas)));
console.log(`Baseline: ${docs.length} muestras normales de ${runId}`);
await mongoose.disconnect();
