# Resultados (conjunto de PRUEBA, señales simuladas)

- Observaciones: **10000** (25 corridas x 400 muestras a 1 Hz). La condición inducida inicia en la muestra 200.
- Configuración de los detectores: `umbrales(p3)|mad(w60,k3,p3)|ewma(l0.3,L3.5,p3)` (elegida con el conjunto de validación).
- Latencia: muestras (= segundos a 1 Hz) desde el inicio de la condición hasta la primera alerta.

## Matriz de confusión y métricas (por muestra)
| Método | TP | FP | TN | FN | Precisión | Recall | F1 | Corridas normales con falsa alarma |
|---|---|---|---|---|---|---|---|---|
| umbrales | 871 | 0 | 6000 | 3129 | 1 | 0.218 | 0.358 | 0/5 |
| mad | 2456 | 0 | 6000 | 1544 | 1 | 0.614 | 0.761 | 0/5 |
| ewma | 3804 | 0 | 6000 | 196 | 1 | 0.951 | 0.975 | 0/5 |

## Detección y latencia por condición (corridas detectadas / total; latencia media en muestras)
| Condición | umbrales | mad | ewma |
|---|---|---|---|
| sobrecarga | 5/5 (2) | 5/5 (2) | 5/5 (2) |
| obstruccion | 0/5 (—) | 4/5 (23.5) | 5/5 (15.6) |
| cavitacion | 0/5 (—) | 5/5 (2) | 5/5 (2.2) |
| deriva_termica | 0/5 (—) | 2/5 (30.5) | 5/5 (18.8) |

> Resultados con datos **sintéticos**: son un ejemplo del análisis. Repetir con corridas reales del banco de pruebas.
