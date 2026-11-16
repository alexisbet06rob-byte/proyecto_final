// backend/src/models.js — persistencia en MongoDB.
import mongoose from 'mongoose';
import { config } from './config.js';

const { Schema } = mongoose;

// Resultado de cada algoritmo para una medición
const resultado = new Schema({ algoritmo: String, anomalia: Boolean, score: Number }, { _id: false });

// Todas las mediciones (fecha, dispositivo, corrida, variables, resultado por algoritmo)
export const Medicion = mongoose.model('Medicion', new Schema({
  ts: { type: Date, required: true },
  deviceId: { type: String, required: true },
  runId: { type: String, required: true },
  lecturas: Schema.Types.Mixed,
  unidades: Schema.Types.Mixed,
  etiqueta: String,            // verdad de terreno si la corrida fue etiquetada
  falla: String,
  reproduccion: Boolean,       // true si son datos grabados reproducidos (plan B)
  config: String,              // identificador de la configuración de detectores usada
  resultados: [resultado],
}).index({ deviceId: 1, runId: 1, ts: 1 }));

// Eventos anómalos (solo cuando una alarma SE ACTIVA) con los parámetros usados
export const Anomalia = mongoose.model('Anomalia', new Schema({
  ts: { type: Date, required: true },
  deviceId: String, runId: String,
  algoritmo: String, score: Number,
  detalle: Schema.Types.Mixed,     // z-score / EWMA / límites por variable
  parametros: Schema.Types.Mixed,  // configuración del detector (trazabilidad)
  lecturas: Schema.Types.Mixed,
}).index({ ts: -1 }));

export async function conectarMongo() {
  await mongoose.connect(config.mongoUri);
  console.log('[DB] MongoDB conectado');
}
