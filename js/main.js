/**
 * main.js — Inicialización y scores locales
 * Scores: top 10, solo puntaje numérico, sin nombre, localStorage.
 */

const CLAVE_SCORES = '2048_light_scores';

// ── Scores locales ────────────────────────────────────────────
function cargarScores() {
  try { return JSON.parse(localStorage.getItem(CLAVE_SCORES)) || []; }
  catch { return []; }
}

function guardarScore(puntaje) {
  const lista = cargarScores();
  lista.push(puntaje);
  lista.sort((a, b) => b - a);
  const top10 = lista.slice(0, 10);
  localStorage.setItem(CLAVE_SCORES, JSON.stringify(top10));
  return top10;
}

function renderScores() {
  const lista = cargarScores();
  const ol    = document.getElementById('scores-ol');
  if (!ol) return;

  ol.innerHTML = '';

  if (!lista.length) {
    const span = document.createElement('span');
    span.className   = 'vacio';
    span.textContent = 'Aún no hay partidas guardadas.';
    ol.appendChild(span);
    return;
  }

  // Siempre fijo en 10, sin toggle
  lista.slice(0, 10).forEach((pts, i) => {
    const li  = document.createElement('li');
    const pos = document.createElement('span');
    pos.className   = 'pos';
    pos.textContent = `${i + 1}.`;
    const ptsEl = document.createElement('span');
    ptsEl.className   = 'pts';
    ptsEl.textContent = `${pts.toLocaleString()} pts`;
    li.appendChild(pos);
    li.appendChild(ptsEl);
    ol.appendChild(li);
  });
}

// ── Escuchar fin de partida desde game.js ─────────────────────
// En modo sandbox no se registra el score
document.addEventListener('juego:fin', e => {
  if (window._sandboxActivo) return;
  const { puntaje } = e.detail;
  guardarScore(puntaje);
  renderScores();
});

// ── Botón nueva partida desde modal fin definitivo ────────────
// (el btn-reiniciar2 en estado terminado ya llama juego.reiniciar()
//  a través de game.js; solo necesitamos re-render del score)
document.addEventListener('juego:nuevo', () => renderScores());

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.juego = new Juego2048();

  renderScores();

  // Sincronizar slider con valor cargado
  const rango = document.getElementById('rango-deshacer');
  const val   = document.getElementById('valor-deshacer');
  if (rango && val) {
    rango.value    = window.juego.maxDeshacer;
    val.textContent = window.juego.maxDeshacer;
  }
});