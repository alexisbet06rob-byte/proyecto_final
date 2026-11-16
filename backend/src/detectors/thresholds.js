// backend/src/detectors/thresholds.js
// REFERENCIA BASE: umbrales fijos por variable. Por sí solo NO cuenta como método de anomalías.
// Un detector expone update(lecturas) -> { anomalia:boolean, score:number, detalle:Object }

export class ThresholdDetector {
  /** @param {Object<string,[number,number]>} limites  p. ej. { corriente_A:[0.5,1.2] } */
  constructor(limites) {
    this.nombre = 'umbrales';
    this.limites = limites;
  }
  reset() {}
  update(lecturas) {
    const detalle = {};
    let score = 0;
    for (const [k, [min, max]] of Object.entries(this.limites)) {
      const x = lecturas[k];
      if (x === undefined) continue;
      const fuera = x < min || x > max;
      // score = qué tan lejos del límite más cercano, en unidades de la variable (0 si está dentro)
      const exceso = x < min ? min - x : x > max ? x - max : 0;
      detalle[k] = { valor: x, fuera, exceso: +exceso.toFixed(4) };
      if (fuera) score = Math.max(score, 1);
    }
    return { anomalia: score > 0, score, detalle };
  }
}

// Límites que un técnico fijaría "a ojo" con la hoja de datos: amplios para no dar falsas alarmas.
export const LIMITES_DEFAULT = {
  corriente_A:   [0.50, 1.20],
  vibracion_g:   [0.00, 0.30],
  temperatura_C: [20.0, 40.0],
};
