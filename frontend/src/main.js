// frontend/src/main.js — estado actual, variables, detectores y alertas en tiempo real (SSE).
import './style.css';
import './historial.js';

const VARS = {
  corriente_A:   { nombre: 'Corriente',   u: 'A'  },
  vibracion_g:   { nombre: 'Vibración',   u: 'g'  },
  temperatura_C: { nombre: 'Temperatura', u: '°C' },
};
const ALGS = ['umbrales', 'mad', 'ewma'];
const $ = (id) => document.getElementById(id);
const serie = {};                                   // variable -> últimos 60 valores

// Tarjetas de variables
$('vars').innerHTML = Object.entries(VARS).map(([k, v]) => `
  <div class="rounded-xl bg-white p-4 shadow">
    <div class="text-sm text-slate-500">${v.nombre}</div>
    <div class="text-3xl font-semibold"><span id="v-${k}">—</span> <span class="text-base text-slate-400">${v.u}</span></div>
    <svg id="sp-${k}" viewBox="0 0 120 30" preserveAspectRatio="none" class="mt-2 h-10 w-full"></svg>
  </div>`).join('');

// Filas de detectores
$('detectores').innerHTML = ALGS.map((a) => `
  <div class="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow">
    <span class="font-medium capitalize">${a}</span>
    <span id="d-${a}" class="rounded-full bg-slate-200 px-3 py-1 text-xs">sin datos</span>
  </div>`).join('');

// Mini-gráfica (polilínea SVG, sin librerías)
function sparkline(k, valor) {
  const s = (serie[k] ??= []);
  s.push(valor); if (s.length > 60) s.shift();
  const min = Math.min(...s), max = Math.max(...s), rango = max - min || 1;
  const pts = s.map((v, i) => `${(i / 59) * 120},${28 - ((v - min) / rango) * 26}`).join(' ');
  $(`sp-${k}`).innerHTML = `<polyline points="${pts}" fill="none" stroke="#2563eb" stroke-width="1.5"/>`;
}

function badge(id, texto, clase) {
  const el = $(id); el.textContent = texto;
  el.className = `rounded-full px-3 py-1 text-xs ${clase}`;
}

function agregarAlerta(a) {
  const li = document.createElement('li');
  li.className = 'rounded-lg border-l-4 border-rose-500 bg-white p-3 shadow';
  const hora = new Date(a.ts).toLocaleTimeString();
  li.textContent = `${hora} · ${a.algoritmo.toUpperCase()} · corrida ${a.runId} · score ${a.score}`;
  $('alertas').prepend(li);
  while ($('alertas').children.length > 20) $('alertas').lastChild.remove();
}

const ev = new EventSource('/api/stream');          // el navegador reconecta solo si se corta
ev.addEventListener('telemetria', (e) => {
  const m = JSON.parse(e.data);
  // Los datos grabados (plan B de la demostración) se identifican CLARAMENTE como reproducción
  m.reproduccion ? badge('b-modo', 'REPRODUCCIÓN · datos grabados', 'bg-amber-500 text-slate-900 font-semibold')
                 : badge('b-modo', 'EN VIVO', 'bg-emerald-600');
  for (const [k, v] of Object.entries(m.lecturas)) {
    if (!$(`v-${k}`)) continue;
    $(`v-${k}`).textContent = v.toFixed(2); sparkline(k, v);
  }
  for (const r of m.resultados) {
    r.anomalia ? badge(`d-${r.algoritmo}`, `ANOMALÍA · ${r.score}`, 'bg-rose-600 text-white')
               : badge(`d-${r.algoritmo}`, `normal · ${r.score}`, 'bg-emerald-100 text-emerald-700');
  }
});
ev.addEventListener('anomalia', (e) => agregarAlerta(JSON.parse(e.data)));
ev.addEventListener('broker', (e) => {
  const { conectado } = JSON.parse(e.data);
  badge('b-broker', conectado ? 'Broker: conectado' : 'Broker: desconectado', conectado ? 'bg-emerald-600' : 'bg-rose-600');
});
ev.addEventListener('estado', (e) => {
  const { status } = JSON.parse(e.data);
  badge('b-motor', `Motor: ${status}`, status === 'online' ? 'bg-emerald-600' : 'bg-rose-600');
});

// Carga inicial: estado actual y últimas alertas guardadas
fetch('/api/state').then((r) => r.json()).then((s) => {
  badge('b-broker', s.mqttConectado ? 'Broker: conectado' : 'Broker: desconectado', s.mqttConectado ? 'bg-emerald-600' : 'bg-rose-600');
});
fetch('/api/anomalies?limit=10').then((r) => r.json()).then((l) => l.reverse().forEach(agregarAlerta));
