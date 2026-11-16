// firmware/motor_esp32/motor_esp32.ino
// ESP32 + ACS712 (corriente) + MPU6050 (vibración) + DS18B20 (temperatura) -> MQTT/JSON.
// ⚠ Los factores de conversión están SIN CALIBRAR: calibra contra un multímetro/pinza antes de
//    presentar valores como mediciones. Registra la calibración en docs/protocolo-experimental.md.
#include <WiFi.h>
#include <Wire.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "secrets.h"          // credenciales: NO se sube a git

const char* DEVICE_ID = "pump-01";
const char* RUN_ID    = "run-normal-01";   // cambia en cada corrida
const char* ETIQUETA  = "normal";          // "normal" o "anomalia" (verdad de terreno que fija el operador)
const uint32_t PERIODO_MS = 1000;          // frecuencia de muestreo: 1 Hz

const int PIN_CORRIENTE = 34;              // ACS712 (salida de 5 V -> usar DIVISOR de voltaje a 3.3 V)
const int PIN_TEMP      = 4;               // DS18B20
const int MPU_ADDR      = 0x68;            // MPU6050 por I2C

OneWire ow(PIN_TEMP);
DallasTemperature ds(&ow);
WiFiClient wifi;
PubSubClient mqtt(wifi);
char topicTel[48], topicEst[48];
float offsetCorriente = 0;                 // cuentas ADC con el motor APAGADO

float promedioAdc(int n) {                 // promedio de n lecturas del ADC de corriente
  double s = 0; for (int i = 0; i < n; i++) { s += analogRead(PIN_CORRIENTE); delayMicroseconds(300); }
  return s / n;
}

// Motor de CC: corriente = |media - offset| convertida a amperes. Con ADC de 12 bits y 3.3 V.
float leerCorrienteA() {
  const float V_POR_CUENTA = 3.3f / 4095.0f;
  const float V_POR_AMPERE = 0.185f * 0.66f;   // ACS712-5A: 185 mV/A, escalado por el divisor (ajusta al tuyo)
  return fabsf(promedioAdc(200) - offsetCorriente) * V_POR_CUENTA / V_POR_AMPERE;
}

// Vibración = RMS de (|a| - media) en ~150 ms. Rango ±2 g => 16384 cuentas/g.
float leerVibracionG() {
  const int N = 100; static float mag[N]; double media = 0;
  for (int i = 0; i < N; i++) {
    Wire.beginTransmission(MPU_ADDR); Wire.write(0x3B); Wire.endTransmission(false);
    Wire.requestFrom(MPU_ADDR, 6, true);
    int16_t ax = (Wire.read() << 8) | Wire.read();
    int16_t ay = (Wire.read() << 8) | Wire.read();
    int16_t az = (Wire.read() << 8) | Wire.read();
    mag[i] = sqrtf((float)ax * ax + (float)ay * ay + (float)az * az) / 16384.0f;
    media += mag[i]; delay(1);
  }
  media /= N; double s = 0;
  for (int i = 0; i < N; i++) s += (mag[i] - media) * (mag[i] - media);
  return sqrt(s / N);                          // se quita la gravedad (componente continua)
}

void conectar() {
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  // Last Will: si el ESP32 se cae, el broker publica "offline" (retenido)
  while (!mqtt.connected()) {
    if (mqtt.connect(DEVICE_ID, MQTT_USER, MQTT_PASS, topicEst, 1, true, "{\"status\":\"offline\"}")) {
      mqtt.publish(topicEst, "{\"status\":\"online\"}", true);
    } else delay(2000);                         // reintento ante desconexión del broker
  }
}

void setup() {
  Serial.begin(115200);
  snprintf(topicTel, sizeof(topicTel), "motor/%s/telemetria", DEVICE_ID);
  snprintf(topicEst, sizeof(topicEst), "motor/%s/estado", DEVICE_ID);
  Wire.begin(); Wire.beginTransmission(MPU_ADDR); Wire.write(0x6B); Wire.write(0); Wire.endTransmission(true); // despierta MPU6050
  ds.begin();
  analogReadResolution(12);
  offsetCorriente = promedioAdc(500);           // ¡arranca con el motor APAGADO!
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  configTime(0, 0, "pool.ntp.org");             // hora UTC para la marca de tiempo
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED || !mqtt.connected()) conectar();
  mqtt.loop();

  static uint32_t ultimo = 0;
  if (millis() - ultimo < PERIODO_MS) return;
  ultimo = millis();

  ds.requestTemperatures();
  float t = ds.getTempCByIndex(0);
  if (t == DEVICE_DISCONNECTED_C) { Serial.println("DS18B20 desconectado: muestra descartada"); return; } // dato inválido

  struct tm ti; if (!getLocalTime(&ti, 200)) return;   // sin hora NTP no se publica
  char ts[25]; strftime(ts, sizeof(ts), "%Y-%m-%dT%H:%M:%SZ", &ti);

  char buf[320];
  snprintf(buf, sizeof(buf),
    "{\"deviceId\":\"%s\",\"runId\":\"%s\",\"ts\":\"%s\",\"lecturas\":{\"corriente_A\":%.3f,\"vibracion_g\":%.4f,\"temperatura_C\":%.2f},"
    "\"unidades\":{\"corriente_A\":\"A\",\"vibracion_g\":\"g\",\"temperatura_C\":\"°C\"},\"etiqueta\":\"%s\"}",
    DEVICE_ID, RUN_ID, ts, leerCorrienteA(), leerVibracionG(), t, ETIQUETA);
  mqtt.publish(topicTel, buf);
}
