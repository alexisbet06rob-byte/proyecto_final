# Pruebas de transporte MQTT (Etapa 3)

Con el stack levantado (`docker compose up -d`) y el `.env` cargado (`set -a; . ./.env; set +a`).
Guardar la salida de cada prueba en `docs/evidencia/` con `| tee docs/evidencia/<archivo>.txt`.

| # | Prueba | Procedimiento | Resultado esperado | Observado | Evidencia |
|---|---|---|---|---|---|
| 1 | Flujo normal | `docker compose exec mosquitto mosquitto_sub -u backend -P "$MQTT_PASS_BACKEND" -t 'motor/#' -v` y, en otra terminal, correr el simulador | Llegan JSON a `motor/pump-01/telemetria` | _pendiente_ | `t1-flujo.txt` |
| 2 | Last Will | Con el simulador publicando, `kill -9` al proceso | El broker publica `{"status":"offline"}` en `motor/pump-01/estado` | _pendiente_ | `t2-lwt.txt` |
| 3 | Caída del broker | `docker compose stop mosquitto`, esperar 15 s, `docker compose start mosquitto` | El backend registra la pérdida, reconecta solo y el tablero pasa de Broker desconectado a conectado | _pendiente_ | `t3-broker.txt` |
| 4 | Mensaje inválido | `docker compose exec mosquitto mosquitto_pub -u simulador -P "$MQTT_PASS_SIM" -t motor/pump-01/telemetria -m '{"basura":true}'` | El backend lo descarta y registra el motivo; no se guarda en Mongo | _pendiente_ | `t4-invalido.txt` |
| 5 | Permisos (ACL) | `docker compose exec mosquitto mosquitto_pub -u backend -P "$MQTT_PASS_BACKEND" -t motor/pump-01/telemetria -m '{}'` | El broker no entrega el mensaje (el backend solo puede leer) | _pendiente_ | `t5-acl.txt` |
| 6 | Sin credenciales | `docker compose exec mosquitto mosquitto_sub -t 'motor/#' -C 1 -W 3` | Conexión rechazada (sin acceso anónimo) | _pendiente_ | `t6-anonimo.txt` |
