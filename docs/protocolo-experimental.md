# Protocolo experimental (Etapa 1)

**Pregunta de investigación:** ¿EWMA y z-score robusto (MAD) detectan más condiciones anómalas ensayadas,
con menos falsas alarmas y una latencia razonable, que una estrategia basada solo en umbrales fijos?

**Variables:** corriente (A), vibración (g RMS), temperatura (°C). Muestreo 1 Hz. Ver `instrumentacion.md`.

## Condiciones ensayadas
| Condición | Cómo se induce (de forma segura) | Duración | Repeticiones | Etiqueta |
|---|---|---|---|---|
| normal | Bomba con flujo libre | 10 min | ver conjuntos | normal |
| obstruccion | Se cierra parcialmente la succión (gradual) | 5 min normal + 5 min falla | ver conjuntos | anomalia desde el inicio de la falla |
| sobrecarga | Se carga/frena el motor de forma controlada | idem | idem | idem |
| cavitacion | Entra aire en la succión (breve) | idem | idem | idem |
| deriva_termica | Calentamiento lento controlado | idem | idem | idem |

La etiqueta la fija el operador al iniciar y terminar la condición inducida (campo `etiqueta` del mensaje).

## Conjuntos de datos (nunca se ajusta y se evalúa con las mismas observaciones)
| Conjunto | Contenido | Uso |
|---|---|---|
| ENTRENAMIENTO | 5 corridas normales | Ajustar la media y desviación base del EWMA (baseline) |
| VALIDACIÓN | 10 corridas normales + 3 repeticiones de cada falla | Elegir el límite de alerta y la persistencia (`npm run tune`) |
| PRUEBA | 5 corridas normales + 5 repeticiones de cada falla | Reportar resultados finales (`npm run evaluate`); no se toca al ajustar |

**Cómo se elige el límite de alerta:** se prueba una rejilla de parámetros sobre VALIDACIÓN y se conserva la
combinación con **0 corridas normales con falsa alarma** y mayor F1 (desempate: menor latencia). Queda en
`backend/config/params.json`.

**Criterios de éxito:** (1) recall mayor que el de umbrales; (2) 0 corridas normales con falsa alarma en PRUEBA;
(3) latencia media menor a 30 muestras (30 s).

## Distinciones
- *Anomalía observada*: lo que marca el detector.
- *Condición inducida*: lo que provocamos a propósito en la prueba (todas las de este documento).
- *Falla real*: daño del equipo. **No se provoca ni se estudia.**

## Riesgos y seguridad
Bajo voltaje (≤12 V), fusible en la alimentación, supervisión permanente, circuito de agua cerrado lejos de la
electrónica, no operar la bomba en seco más de unos segundos, y detener la prueba ante olor, humo o calentamiento
anormal. No se crean condiciones eléctricas, mecánicas o hidráulicas inseguras.

## Limitaciones
Prototipo académico con una sola bomba y pocas corridas; los resultados no se generalizan a motores industriales.
