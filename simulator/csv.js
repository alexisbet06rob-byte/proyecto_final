// simulator/csv.js — lector mínimo de los CSV de corridas (i,etiqueta,falla,corriente_A,vibracion_g,temperatura_C).
export function parseCsv(texto) {
  const [cab, ...filas] = texto.trim().split(/\r?\n/);
  const cols = cab.split(',');
  return filas.map((f) => {
    const v = f.split(',');
    const o = Object.fromEntries(cols.map((c, i) => [c, v[i]]));
    return {
      i: Number(o.i), etiqueta: o.etiqueta || null, falla: o.falla || null,
      lecturas: { corriente_A: +o.corriente_A, vibracion_g: +o.vibracion_g, temperatura_C: +o.temperatura_C },
    };
  });
}
