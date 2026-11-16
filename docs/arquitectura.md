# Arquitectura y flujo del dato

```mermaid
flowchart LR
  subgraph Adquisición
    S["Sensores: corriente, vibración, temperatura"] --> E["ESP32 / simulador"]
  end
  E -- "MQTT JSON motor/{id}/telemetria" --> B[("Mosquitto")]
  subgraph Backend["Backend Node.js + Express"]
    M["MQTT.js + validación"] --> D["Detectores: umbrales / MAD / EWMA"]
    D --> DB[("MongoDB")]
    D --> SSE["SSE /api/stream"]
    API["REST /api/measurements, /api/anomalies, /api/runs"]
  end
  B --> M
  DB --> API
  SSE --> UI["Vite + Tailwind"]
  API --> UI
```

**Flujo:** (1) el microcontrolador muestrea y publica JSON por MQTT → (2) Mosquitto transporta →
(3) el backend valida el mensaje → (4) los detectores lo analizan → (5) se guarda la medición
(y el evento si hay alerta) en MongoDB → (6) se retransmite al navegador por SSE →
(7) el historial se consulta por REST.

**Separación de responsabilidades:** adquisición (`firmware/`, `simulator/`), transporte (Mosquitto),
análisis (`backend/src/detectors`), almacenamiento (`backend/src/models.js`), presentación (`frontend/`).
