# Convención MQTT

| Tema | Publica | QoS | Retain | Contenido |
|---|---|---|---|---|
| `motor/{id}/telemetria` | microcontrolador | 1 | no | lecturas con unidades |
| `motor/{id}/estado` | microcontrolador (+ LWT del broker) | 1 | sí | `{"status":"online"|"offline"}` |

El backend se suscribe a `motor/+/telemetria` y `motor/+/estado`.

## Mensaje de telemetría (JSON)
```json
{
  "deviceId": "pump-01",
  "runId": "run-normal-01",
  "ts": "2026-10-24T18:30:00.000Z",
  "lecturas": { "corriente_A": 0.81, "vibracion_g": 0.12, "temperatura_C": 32.1 },
  "unidades": { "corriente_A": "A", "vibracion_g": "g", "temperatura_C": "°C" },
  "etiqueta": "normal",
  "falla": "ninguna"
}
```
`etiqueta` (`normal`|`anomalia`) y `falla` son opcionales: sirven para evaluar los detectores con datos etiquetados.

## Validación en el backend
JSON válido · `deviceId` igual al del tema · `runId` alfanumérico · `ts` fecha válida ·
`lecturas` con al menos una variable y todas numéricas finitas. Si falla, el mensaje se descarta y se registra un aviso.

## Desconexiones
El dispositivo declara un Last Will (`offline`, retenido) y el broker lo publica si el dispositivo se cae.
El backend usa reconexión automática (cada 2 s) y avisa al navegador por SSE.

## Permisos (ACL)
| Usuario | Permiso | Quién lo usa |
|---|---|---|
| `backend` | leer `motor/#` | servidor Express |
| `simulador` | escribir `motor/#` | simulador de pruebas y reproducción |
| `esp32` | escribir `motor/#` | microcontrolador real |

Campo opcional `reproduccion: true`: indica datos **grabados** reproducidos (plan B de la demostración);
el tablero los marca como REPRODUCCIÓN. Ejemplos en `docs/ejemplos/`.
