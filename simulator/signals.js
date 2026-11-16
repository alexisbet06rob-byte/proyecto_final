// simulator/signals.js
// Generador de señales sintéticas de una bomba pequeña (3 variables).
// Se usa en el publicador MQTT y en el script de evaluación (mismos datos, reproducibles por semilla).

// PRNG determinista (mulberry32): misma semilla => misma corrida.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ruido gaussiano con Box-Muller.
function gauss(rand) {
  const u = 1 - rand(), v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Operación normal (valores de ejemplo de un banco de pruebas, NO calibrados).
export const NORMAL = {
  corriente_A:   { media: 0.80, sigma: 0.03 },
  vibracion_g:   { media: 0.12, sigma: 0.015 },
  temperatura_C: { media: 32.0, sigma: 0.25 },
};

export const UNIDADES = { corriente_A: 'A', vibracion_g: 'g', temperatura_C: '°C' };

// Fallas ENSAYADAS (condiciones inducidas, no fallas reales). `t` = muestras transcurridas desde el inicio de la falla.
export const FALLAS = {
  // Escalón de corriente (rotor frenado parcialmente / sobrecarga)
  sobrecarga:    (t) => ({ corriente_A: +0.45, vibracion_g: +0.03, temperatura_C: Math.min(t * 0.02, 3) }),
  // Obstrucción de la succión: cambios graduales y moderados en las tres variables
  obstruccion:   (t) => ({ corriente_A: Math.min(t * 0.004, 0.20), vibracion_g: Math.min(t * 0.0012, 0.06), temperatura_C: Math.min(t * 0.02, 2.0) }),
  // Aire/cavitación: vibración alta y ruidosa, corriente casi igual
  cavitacion:    (t) => ({ corriente_A: -0.03, vibracion_g: +0.10 + 0.04 * Math.sin(t), temperatura_C: 0 }),
  // Deriva térmica lenta: solo temperatura, dentro de límites "razonables" durante mucho tiempo
  deriva_termica:(t) => ({ corriente_A: 0, vibracion_g: 0, temperatura_C: Math.min(t * 0.03, 3.0) }),
};

/**
 * Genera una corrida completa.
 * @param {{seed:number, n:number, falla?:string, inicio?:number}} p
 * @returns {Array<{i:number, etiqueta:'normal'|'anomalia', falla:string, lecturas:Object}>}
 */
export function generarCorrida({ seed, n, falla = 'ninguna', inicio = Math.floor(n / 2) }) {
  const rand = rng(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    const enFalla = falla !== 'ninguna' && i >= inicio;
    const delta = enFalla ? FALLAS[falla](i - inicio) : {};
    const lecturas = {};
    for (const [k, { media, sigma }] of Object.entries(NORMAL)) {
      lecturas[k] = +(media + (delta[k] ?? 0) + sigma * gauss(rand)).toFixed(4);
    }
    out.push({ i, etiqueta: enFalla ? 'anomalia' : 'normal', falla: enFalla ? falla : 'ninguna', lecturas });
  }
  return out;
}
