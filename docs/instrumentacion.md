# Instrumentación del banco de pruebas (Etapa 2)

Banco de bajo riesgo: bomba/motor pequeño de CC (≤12 V) con recirculación de agua en circuito cerrado,
fusible en la alimentación y supervisión permanente.

| Variable | Sensor | Método de medición | Unidad | Qué información aporta |
|---|---|---|---|---|
| `corriente_A` | ACS712-5A (efecto Hall) | ADC de 12 bits del ESP32 (promedio de 200 lecturas) menos el offset medido con el motor apagado | A | Carga del motor: sobrecarga, rotor frenado, obstrucción |
| `vibracion_g` | MPU6050 (±2 g) por I2C | RMS de la magnitud de aceleración sin componente continua, 100 muestras ≈ 150 ms | g | Desbalance, cavitación, aire en la succión |
| `temperatura_C` | DS18B20 (12 bits) en la carcasa | Lectura digital 1-Wire | °C | Calentamiento; cambios lentos y graduales |

## Muestreo
Se publica **1 muestra por segundo (1 Hz)**. Cada muestra resume una ventana corta de lecturas internas
(corriente ≈ 60 ms, vibración ≈ 150 ms, temperatura ≈ 750 ms). No se observan transitorios más rápidos de ~2 s.

## Calibración (completar durante la Etapa 2)
| Variable | Fecha | Instrumento de referencia | Procedimiento | Resultado / error |
|---|---|---|---|---|
| corriente_A | _pendiente_ | multímetro o pinza amperimétrica | comparar en 5 puntos de carga | _pendiente_ |
| vibracion_g | _pendiente_ | sensor en reposo (≈0 g RMS) | medir en reposo y con motor encendido | _pendiente_ |
| temperatura_C | _pendiente_ | termómetro de referencia | agua a temperatura ambiente y ~40 °C | _pendiente_ |

> Mientras una variable no esté calibrada **no se presenta como medición calibrada**: se reporta como lectura relativa.

## Limitaciones conocidas
- El ADC del ESP32 no es lineal en los extremos y tiene ruido; la corriente es aproximada hasta calibrar.
- La vibración depende de dónde se fije el MPU6050.
- El DS18B20 mide la carcasa, no el devanado; responde con retraso térmico.
- Las señales de `simulator/` son **sintéticas** y no sustituyen mediciones.
