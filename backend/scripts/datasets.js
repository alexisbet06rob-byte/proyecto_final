// backend/scripts/datasets.js
// Conjuntos de datos SEPARADOS (semillas distintas) para no ajustar y evaluar con las mismas observaciones.
//   ENTRENAMIENTO -> baseline del EWMA          VALIDACIÓN -> elegir límites/persistencia (tune)
//   PRUEBA        -> resultados finales (evaluate). La PRUEBA no se usa en ningún ajuste.
import { generarCorrida, FALLAS } from '../../simulator/signals.js';

export const N = 400;        // muestras por corrida (1 Hz => 400 s)
export const INICIO = 200;   // la condición inducida empieza en la muestra 200

export const entrenamiento = [1, 2, 3, 4, 5].flatMap((s) => generarCorrida({ seed: s, n: N }).map((m) => m.lecturas));

function armar(seedNormal, nNormales, seedFalla, reps) {
  const c = [];
  for (let i = 0; i < nNormales; i++) c.push({ nombre: `normal-${seedNormal + i}`, datos: generarCorrida({ seed: seedNormal + i, n: N }) });
  for (const f of Object.keys(FALLAS))
    for (let r = 0; r < reps; r++)
      c.push({ nombre: `${f}-${r}`, datos: generarCorrida({ seed: seedFalla + r, n: N, falla: f, inicio: INICIO }) });
  return c;
}

export const validacion = () => armar(51, 10, 70, 3);   // 10 normales + 4 fallas x 3 (más normales: estima mejor las falsas alarmas)
export const prueba     = () => armar(101, 5, 200, 5);  // 5 normales + 4 fallas x 5
