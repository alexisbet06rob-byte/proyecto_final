// backend/src/detectors/persistence.js
// Envoltorio: exige `k` muestras anómalas CONSECUTIVAS antes de emitir la alerta.
// Reduce falsas alarmas por ruido puntual a cambio de un poco más de latencia (se reporta en la evaluación).

export function conPersistencia(detector, k = 3) {
  let racha = 0;
  return {
    nombre: detector.nombre,
    reset() { racha = 0; detector.reset(); },
    fit: detector.fit?.bind(detector),
    update(lecturas) {
      const r = detector.update(lecturas);
      racha = r.anomalia ? racha + 1 : 0;
      return { ...r, bruta: r.anomalia, anomalia: racha >= k };
    },
  };
}
