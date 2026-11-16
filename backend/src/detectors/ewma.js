// backend/src/detectors/ewma.js
// Carta de control EWMA: detecta cambios SOSTENIDOS o graduales (no solo picos).
//   z_t = λ·x_t + (1-λ)·z_{t-1}
//   límite = μ ± L·σ·sqrt( λ/(2-λ) · (1-(1-λ)^(2t)) )
// μ y σ se ajustan (fit) con datos de operación NORMAL (conjunto de entrenamiento), no con los de evaluación.

export class EwmaDetector {
  /** @param {{lambda?:number, L?:number}} o  λ pequeño = más memoria; L = ancho de límites en sigmas */
  constructor({ lambda = 0.2, L = 3.5 } = {}) {
    this.nombre = 'ewma';
    this.lambda = lambda; this.L = L;
    this.base = null;   // { variable: {mu, sigma} }
    this.reset();
  }
  reset() { this.z = {}; this.t = 0; }

  /** Ajusta μ y σ por variable a partir de muestras normales: Array<lecturas>. */
  fit(muestras) {
    this.base = {};
    const keys = Object.keys(muestras[0]);
    for (const k of keys) {
      const xs = muestras.map((m) => m[k]);
      const mu = xs.reduce((a, b) => a + b, 0) / xs.length;
      const sigma = Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / (xs.length - 1));
      this.base[k] = { mu, sigma };
    }
    return this;
  }
  update(lecturas) {
    if (!this.base) throw new Error('EwmaDetector: llama fit() con datos normales antes de update()');
    this.t += 1;
    const { lambda: l, L } = this;
    const factor = Math.sqrt((l / (2 - l)) * (1 - (1 - l) ** (2 * this.t)));
    const detalle = {};
    let score = 0, anomalia = false;
    for (const [k, x] of Object.entries(lecturas)) {
      const { mu, sigma } = this.base[k] ?? {};
      if (sigma === undefined) continue;
      this.z[k] = l * x + (1 - l) * (this.z[k] ?? mu);
      const lim = L * sigma * factor;
      const desv = Math.abs(this.z[k] - mu);
      detalle[k] = { ewma: +this.z[k].toFixed(4), limite: +lim.toFixed(4) };
      score = Math.max(score, desv / lim);
      if (desv > lim) anomalia = true;
    }
    return { anomalia, score: +score.toFixed(3), detalle };
  }
}
