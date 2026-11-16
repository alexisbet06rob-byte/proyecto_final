// backend/src/detectors/mad.js
// Puntuación estadística robusta en ventana móvil: z-score modificado con mediana y MAD.
//   z = 0.6745 * (x - mediana) / MAD       (Iglewicz & Hoaglin: |z| > 3.5 => atípico)
// No requiere entrenamiento: compara contra el comportamiento RECIENTE de cada variable.

const mediana = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export class MadDetector {
  /**
   * @param {{ventana?:number, minMuestras?:number, k?:number, pisoMad?:Object}} o
   *  ventana: tamaño de la ventana móvil; minMuestras: calentamiento; k: límite de |z|;
   *  pisoMad: MAD mínimo por variable (evita dividir entre ~0 si la señal es casi constante).
   */
  constructor({ ventana = 60, minMuestras = 30, k = 3.5, pisoMad = {} } = {}) {
    this.nombre = 'mad';
    this.ventana = ventana; this.minMuestras = minMuestras; this.k = k; this.pisoMad = pisoMad;
    this.buf = {};
  }
  reset() { this.buf = {}; }
  update(lecturas) {
    const detalle = {};
    let score = 0, anomalia = false;
    for (const [k, x] of Object.entries(lecturas)) {
      const w = (this.buf[k] ??= []);
      if (w.length >= this.minMuestras) {
        const med = mediana(w);
        const mad = Math.max(mediana(w.map((v) => Math.abs(v - med))), this.pisoMad[k] ?? 1e-6);
        const z = (0.6745 * (x - med)) / mad;
        detalle[k] = { valor: x, z: +z.toFixed(2) };
        score = Math.max(score, Math.abs(z) / this.k);
        if (Math.abs(z) > this.k) anomalia = true;
      }
    }
    // Solo las muestras NO anómalas entran a la ventana; así una falla sostenida no "se vuelve normal".
    // Limitación documentada: si el proceso deriva legítimamente, la ventana no se adapta.
    if (!anomalia) {
      for (const [k, x] of Object.entries(lecturas)) {
        const w = (this.buf[k] ??= []);
        w.push(x);
        if (w.length > this.ventana) w.shift();
      }
    }
    return { anomalia, score: +score.toFixed(3), detalle };
  }
}
