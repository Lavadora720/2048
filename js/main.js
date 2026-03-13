
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

  lista.forEach((pts, i) => {
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

// ── Panel scores: toggle ──────────────────────────────────────
function iniciarPanelScores() {
  const header = document.getElementById('scores-header');
  const lista  = document.getElementById('scores-lista');
  if (!header || !lista) return;

  header.addEventListener('click', () => {
    const abierto = lista.classList.toggle('visible');
    header.classList.toggle('abierto', abierto);
  });
}

// ── Escuchar fin de partida desde game.js ─────────────────────
document.addEventListener('juego:fin', e => {
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

  iniciarPanelScores();
  renderScores();

  // Sincronizar slider con valor cargado
  const rango = document.getElementById('rango-deshacer');
  const val   = document.getElementById('valor-deshacer');
  if (rango && val) {
    rango.value    = window.juego.maxDeshacer;
    val.textContent = window.juego.maxDeshacer;
  }
});