// backend/src/server.js — versión inicial: solo comprueba que el servidor vive.
import express from 'express';
import { config } from './config.js';

const app = express();
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.listen(config.port, () => console.log(`API en http://127.0.0.1:${config.port}`));
