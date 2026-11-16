// frontend/src/historial.js — consulta de datos HISTÓRICOS (no solo el último mensaje).
const cont = document.getElementById('historial');
cont.innerHTML = `
  <h2 class="mb-2 text-sm font-semibold uppercase text-slate-500">Historial</h2>
  <div class="mb-3 flex flex-wrap items-center gap-2">
    <select id="h-run" class="rounded border bg-white px-2 py-1 text-sm"></select>
    <button id="h-ver" class="rounded bg-blue-600 px-3 py-1 text-sm text-white">Consultar</button>
    <span id="h-info" class="text-xs text-slate-500"></span>
  </div>
  <div class="grid gap-6 lg:grid-cols-2">
    <div class="max-h-96 overflow-auto rounded-xl bg-white shadow"><table class="w-full text-left text-xs">
      <thead class="sticky top-0 bg-slate-50"><tr><th class="p-2">Hora</th><th>I (A)</th><th>Vib (g)</th><th>T (°C)</th><th>Etiqueta</th><th>Alarmas</th></tr></thead>
      <tbody id="h-med"></tbody></table></div>
    <div class="max-h-96 overflow-auto rounded-xl bg-white shadow"><table class="w-full text-left text-xs">
      <thead class="sticky top-0 bg-slate-50"><tr><th class="p-2">Hora</th><th>Algoritmo</th><th>Score</th><th>Corrida</th></tr></thead>
      <tbody id="h-ev"></tbody></table></div>
  </div>`;

const $ = (id) => document.getElementById(id);
const fila = (celdas) => `<tr class="border-t">${celdas.map((c, i) => `<td class="${i === 0 ? 'p-2' : ''}">${c}</td>`).join('')}</tr>`;

async function cargarCorridas() {
  const runs = await (await fetch('/api/runs')).json();
  $('h-run').innerHTML = `<option value="">Todas las corridas</option>` +
    runs.map((r) => `<option value="${r._id.runId}">${r._id.runId} (${r.n} muestras)</option>`).join('');
}

async function consultar() {
  const q = new URLSearchParams({ limit: '200' });
  if ($('h-run').value) q.set('runId', $('h-run').value);
  const [med, ev] = await Promise.all([
    fetch(`/api/measurements?${q}`).then((r) => r.json()),
    fetch(`/api/anomalies?${q}`).then((r) => r.json()),
  ]);
  $('h-med').innerHTML = med.map((m) => fila([
    new Date(m.ts).toLocaleTimeString(),
    m.lecturas.corriente_A?.toFixed(2) ?? '', m.lecturas.vibracion_g?.toFixed(3) ?? '', m.lecturas.temperatura_C?.toFixed(1) ?? '',
    m.etiqueta ?? '—', m.resultados.filter((r) => r.anomalia).map((r) => r.algoritmo).join(', ') || '—',
  ])).join('');
  $('h-ev').innerHTML = ev.map((a) => fila([new Date(a.ts).toLocaleString(), a.algoritmo, a.score, a.runId])).join('');
  $('h-info').textContent = `${med.length} mediciones · ${ev.length} eventos`;
}

$('h-ver').onclick = consultar;
cargarCorridas().then(consultar);
