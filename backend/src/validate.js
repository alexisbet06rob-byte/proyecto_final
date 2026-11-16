// backend/src/validate.js
// Validación básica de la telemetría. Devuelve { ok:true, data } o { ok:false, error }.
const ID = /^[A-Za-z0-9_-]{1,40}$/;

export function validarTelemetria(buffer, deviceIdDelTema) {
  let m;
  try { m = JSON.parse(buffer.toString()); }
  catch { return { ok: false, error: 'JSON inválido' }; }

  if (typeof m !== 'object' || m === null) return { ok: false, error: 'El mensaje no es un objeto' };
  if (m.deviceId !== deviceIdDelTema)       return { ok: false, error: 'deviceId no coincide con el tema' };
  if (typeof m.runId !== 'string' || !ID.test(m.runId)) return { ok: false, error: 'runId inválido' };

  const ts = new Date(m.ts);
  if (Number.isNaN(ts.getTime())) return { ok: false, error: 'ts inválido' };

  if (typeof m.lecturas !== 'object' || m.lecturas === null) return { ok: false, error: 'faltan lecturas' };
  const lecturas = {};
  for (const [k, v] of Object.entries(m.lecturas)) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return { ok: false, error: `lectura inválida: ${k}` };
    lecturas[k] = v;
  }
  if (Object.keys(lecturas).length === 0) return { ok: false, error: 'sin lecturas' };

  return {
    ok: true,
    data: {
      deviceId: m.deviceId, runId: m.runId, ts, lecturas,
      unidades: m.unidades ?? {}, etiqueta: m.etiqueta ?? null, falla: m.falla ?? null,
      reproduccion: m.reproduccion === true,   // true = datos grabados reproducidos (plan B), no en vivo
    },
  };
}
