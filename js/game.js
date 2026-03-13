

const TAM           = 4;
const CLAVE_ESTADO  = '2048_light_estado';
const CLAVE_MEJOR   = '2048_light_mejor';

// ── Utilidades ───────────────────────────────────────────────
function copiarMatriz(m)  { return m.map(f => f.slice()); }
function matrizVacia()    { return Array.from({ length: TAM }, () => Array(TAM).fill(0)); }
function limitar(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ── Clase principal ──────────────────────────────────────────
class Juego2048 {
  constructor() {
    this.tablero           = matrizVacia();
    this.puntaje           = 0;
    this.mejor             = Number(localStorage.getItem(CLAVE_MEJOR) || 0);
    this.ganado            = false;
    this.terminado         = false;
    this.perdidoTemporal   = false;
    this.historial         = [];
    this.maxDeshacer       = 6;
    this.sonidoActivo      = true;
    this.continuarDespuesVictoria = false;
    this.inicioToque       = null;

    // Referencias DOM
    this.domTablero  = document.getElementById('tablero-juego');
    this.domPuntaje  = document.getElementById('puntaje');
    this.domMejor    = document.getElementById('mejor');
    this.domFichas   = document.getElementById('fichas');
    this.domFin      = document.getElementById('fin-juego');
    this.botonDeshacer = document.getElementById('btn-deshacer');

    this.iniciar();
  }

  // ── Inicialización ────────────────────────────────────────
  iniciar() {
    this.iniciarAudio();
    this.configurarUI();
    this.configurarEventos();

    if (!this.cargar()) {
      this.nuevo();
    } else {
      const mejorGuardado = Number(localStorage.getItem(CLAVE_MEJOR) || 0);
      this.mejor = Math.max(this.mejor, mejorGuardado);
    }

    this.actualizarVista();
    this.actualizarBotones();
  }

  iniciarAudio() {
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { this.ctx = null; }
  }

  // ── Eventos ───────────────────────────────────────────────
  configurarEventos() {
    // Teclado
    document.addEventListener('keydown', e => {
      const mapa = {
        ArrowLeft: 'izq', ArrowRight: 'der', ArrowUp: 'arr', ArrowDown: 'aba',
        a: 'izq', d: 'der', w: 'arr', s: 'aba',
        A: 'izq', D: 'der', W: 'arr', S: 'aba',
      };
      if (mapa[e.key]) { e.preventDefault(); this.mover(mapa[e.key]); return; }

      // Ctrl+Z / deshacer
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this.deshacer(); return; }

      // M → toggle sonido
      if (e.key === 'm' || e.key === 'M') { this.toggleSonido(); e.preventDefault(); return; }

      // Escape → cerrar overlay si está en pérdida temporal
      if (e.key === 'Escape') {
        if (this.domFin.classList.contains('mostrar') && this.perdidoTemporal) {
          this.ocultarFin();
        }
        e.preventDefault();
      }
    });

    // Touch swipe
    if (this.domTablero) {
      this.domTablero.addEventListener('touchstart', e => {
        if (e.touches.length > 1) return;
        const t = e.touches[0];
        this.inicioToque = { x: t.clientX, y: t.clientY };
      }, { passive: true });

      this.domTablero.addEventListener('touchend', e => {
        if (!this.inicioToque) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - this.inicioToque.x;
        const dy = t.clientY - this.inicioToque.y;
        const adx = Math.abs(dx), ady = Math.abs(dy);
        const umbral = Math.max(20, Math.min(window.innerWidth * 0.04, 40));
        if (Math.max(adx, ady) < umbral) { this.inicioToque = null; return; }
        const dir = (adx > ady) ? (dx > 0 ? 'der' : 'izq') : (dy > 0 ? 'aba' : 'arr');
        this.mover(dir);
        this.inicioToque = null;
      }, { passive: true });
    }

    // Botón deshacer
    if (this.botonDeshacer) this.botonDeshacer.addEventListener('click', () => this.deshacer());

    // Botón reiniciar principal
    const btnReiniciar = document.getElementById('btn-reiniciar');
    if (btnReiniciar) btnReiniciar.addEventListener('click', () => this.reiniciar());

    // Botón continuar (deshacer desde modal)
    const btnContinuar = document.getElementById('btn-continuar');
    if (btnContinuar) {
      btnContinuar.addEventListener('click', () => {
        if (this.perdidoTemporal) this.deshacer();
      });
    }

    // Botón reiniciar2 (desde modal)
    const btnReiniciar2 = document.getElementById('btn-reiniciar2');
    if (btnReiniciar2) {
      btnReiniciar2.addEventListener('click', () => {
        if (this.perdidoTemporal) {
          this.terminado = true;
          this.perdidoTemporal = false;
          // Notificar a main.js para guardar score
          document.dispatchEvent(new CustomEvent('juego:fin', { detail: { puntaje: this.puntaje } }));
          this.mostrarFin();
        } else {
          this.nuevo();
          this.actualizarVista();
          this.actualizarBotones();
          this.ocultarFin();
          this.guardar();
        }
      });
    }

    // Slider maxDeshacer
    const rango = document.getElementById('rango-deshacer');
    const val   = document.getElementById('valor-deshacer');
    if (rango && val) {
      rango.value = this.maxDeshacer;
      val.textContent = this.maxDeshacer;
      rango.addEventListener('input', e => {
        const v = parseInt(e.target.value);
        val.textContent = v;
        this.maxDeshacer = limitar(v, 1, 12);
        if (this.historial.length > this.maxDeshacer)
          this.historial = this.historial.slice(-this.maxDeshacer);
      });
    }
  }

  // ── UI del tablero ────────────────────────────────────────
  // Celdas y overlay ya están en el HTML estático; solo resolvemos domFin.
  configurarUI() {
    this.domFin = document.getElementById('fin-juego');
  }

  // ── Estado tablero: guardar / deshacer ────────────────────
  guardarEstado() {
    const snap = { tablero: copiarMatriz(this.tablero), puntaje: this.puntaje };
    this.historial.push(snap);
    if (this.historial.length > this.maxDeshacer)
      this.historial.shift();
  }

  deshacer() {
    if (!this.historial.length) return;
    const snap = this.historial.pop();
    this.tablero = snap.tablero;
    this.puntaje = snap.puntaje;
    this.perdidoTemporal = false;
    this.terminado       = false;
    this.ocultarFin();
    this.actualizarVista();
    this.actualizarBotones();
    this.guardar();
  }

  nuevo() {
    this.tablero         = matrizVacia();
    this.puntaje         = 0;
    this.historial       = [];
    this.ganado          = false;
    this.terminado       = false;
    this.perdidoTemporal = false;
    this.continuarDespuesVictoria = false;
    this.agregarFicha();
    this.agregarFicha();
  }

  reiniciar() {
    this.nuevo();
    this.actualizarVista();
    this.actualizarBotones();
    this.ocultarFin();
    this.guardar();
  }

  // ── Movimiento ────────────────────────────────────────────
  mover(dir) {
    if (this.perdidoTemporal) return;
    this.guardarEstado();
    let movido = false;
    const mergedValues = [];

    for (let idx = 0; idx < TAM; idx++) {
      let linea = [];
      for (let j = 0; j < TAM; j++) {
        switch (dir) {
          case 'izq': linea.push(this.tablero[idx][j]); break;
          case 'der': linea.push(this.tablero[idx][TAM - 1 - j]); break;
          case 'arr': linea.push(this.tablero[j][idx]); break;
          case 'aba': linea.push(this.tablero[TAM - 1 - j][idx]); break;
        }
      }

      const compacta = linea.filter(x => x !== 0);
      for (let i = 0; i < compacta.length - 1; i++) {
        if (compacta[i] === compacta[i + 1]) {
          compacta[i] *= 2;
          this.puntaje += compacta[i];
          mergedValues.push(compacta[i]);
          compacta.splice(i + 1, 1);
        }
      }
      while (compacta.length < TAM) compacta.push(0);

      for (let j = 0; j < TAM; j++) {
        const valor = compacta[j];
        let actual;
        switch (dir) {
          case 'izq': actual = this.tablero[idx][j];           if (actual !== valor) movido = true; this.tablero[idx][j]           = valor; break;
          case 'der': actual = this.tablero[idx][TAM-1-j];     if (actual !== valor) movido = true; this.tablero[idx][TAM-1-j]     = valor; break;
          case 'arr': actual = this.tablero[j][idx];           if (actual !== valor) movido = true; this.tablero[j][idx]           = valor; break;
          case 'aba': actual = this.tablero[TAM-1-j][idx];     if (actual !== valor) movido = true; this.tablero[TAM-1-j][idx]     = valor; break;
        }
      }
    }

    if (!movido) { this.historial.pop(); return; }

    this.agregarFicha();
    if (this.puntaje > this.mejor) {
      this.mejor = this.puntaje;
      localStorage.setItem(CLAVE_MEJOR, String(this.mejor));
    }

    this.sonido(300, 0.04);
    this.actualizarVista();
    this.actualizarBotones();
    this.guardar();
    this.verificarEstado();

    if (mergedValues.length) {
      setTimeout(() => {
        for (const val of mergedValues) {
          const el = this.domTablero.querySelector(`.ficha-inner.v${val}`);
          if (el) {
            el.classList.add('fusion');
            el.addEventListener('animationend', () => el.classList.remove('fusion'), { once: true });
          }
        }
      }, 30);
    }
  }

  // ── Verificar estado ──────────────────────────────────────
  verificarEstado() {
    // 2048 alcanzado: marcar internamente, juego continúa sin interrupción
    const hay2048 = this.tablero.some(f => f.includes(2048));
    if (hay2048 && !this.ganado) {
      this.ganado = true;
      this.continuarDespuesVictoria = true;
    }

    // Sin movimientos disponibles
    if (this.esFin()) {
      this.perdidoTemporal = true;
      setTimeout(() => this.mostrarFin(), 300);
    }
  }

  esFin() {
    for (let r = 0; r < TAM; r++)
      for (let c = 0; c < TAM; c++)
        if (this.tablero[r][c] === 0) return false;
    for (let r = 0; r < TAM; r++)
      for (let c = 0; c < TAM; c++) {
        const v = this.tablero[r][c];
        if ((r > 0 && this.tablero[r-1][c] === v) ||
            (r < TAM-1 && this.tablero[r+1][c] === v) ||
            (c > 0 && this.tablero[r][c-1] === v) ||
            (c < TAM-1 && this.tablero[r][c+1] === v)) return false;
      }
    return true;
  }

  mostrarFin() {
    const texto    = document.getElementById('texto-superior');
    const mensaje  = document.getElementById('mensaje-fin');
    const btnCont  = document.getElementById('btn-continuar');
    const btnRein  = document.getElementById('btn-reiniciar2');

    if (this.perdidoTemporal) {
      texto.textContent   = '¡Sin movimientos!';
      mensaje.innerHTML   = `¿Deshacer o finalizar?<br>Puntaje: <strong>${this.puntaje}</strong>`;
      btnCont.style.display = 'inline-block';
      btnCont.textContent = 'Deshacer';
      btnRein.textContent = 'Finalizar';
    } else {
      texto.textContent   = '¡Fin del juego!';
      mensaje.innerHTML   = `Puntaje final: <strong>${this.puntaje}</strong>`;
      btnCont.style.display = 'none';
      btnRein.textContent = 'Nueva partida';
    }

    this.domFin.classList.add('mostrar');
  }

  ocultarFin() { this.domFin.classList.remove('mostrar'); }

  // ── Vista ─────────────────────────────────────────────────
  actualizarVista() {
    const rect   = this.domTablero.getBoundingClientRect();
    const tamTab = rect.width;
    const hueco  = 10;
    const lado   = (tamTab - hueco * (TAM + 1)) / TAM;

    const fichasActuales = new Map();
    this.domTablero.querySelectorAll('.ficha').forEach(f => {
      if (f.dataset.pos) fichasActuales.set(f.dataset.pos, f);
    });

    let totalFichas = 0;

    for (let r = 0; r < TAM; r++) {
      for (let c = 0; c < TAM; c++) {
        const v         = this.tablero[r][c];
        const targetPos = `${r}-${c}`;
        const x = hueco + c * (lado + hueco);
        const y = hueco + r * (lado + hueco);

        if (v !== 0) totalFichas++;

        if (v === 0) {
          const exist = fichasActuales.get(targetPos);
          if (exist) { exist.remove(); fichasActuales.delete(targetPos); }
          continue;
        }

        let ficha = fichasActuales.get(targetPos);

        if (!ficha) {
          let reutilizar = null;
          for (const [posKey, node] of fichasActuales.entries()) {
            const inner = node.querySelector('.ficha-inner');
            if (inner && inner.textContent == String(v)) { reutilizar = { posKey, node }; break; }
          }

          if (reutilizar) {
            ficha = reutilizar.node;
            fichasActuales.delete(reutilizar.posKey);
            ficha.dataset.pos = targetPos;
            const inner = ficha.querySelector('.ficha-inner');
            if (inner) { inner.textContent = String(v); inner.className = `ficha-inner v${v}`; }
          } else {
            ficha = this.crearFicha(v, r, c);
          }
        } else {
          const inner      = ficha.querySelector('.ficha-inner');
          const currentVal = inner ? Number(inner.textContent) || 0 : 0;
          if (currentVal !== v && inner) {
            inner.textContent = String(v);
            inner.className   = `ficha-inner v${v}`;
          }
          fichasActuales.delete(targetPos);
        }

        ficha.dataset.pos     = targetPos;
        ficha.style.width     = `${lado}px`;
        ficha.style.height    = `${lado}px`;
        ficha.style.position  = 'absolute';
        ficha.style.transform = `translate(${x}px, ${y}px)`;
        ficha.style.left = '';
        ficha.style.top  = '';
      }
    }

    fichasActuales.forEach(node => node.remove());

    // Marcadores
    if (this.domPuntaje) this.domPuntaje.textContent = this.puntaje;
    if (this.domMejor)   this.domMejor.textContent   = this.mejor;
    if (this.domFichas)  this.domFichas.textContent  = totalFichas;

    // Alertas
    this.domTablero.classList.remove('alerta14', 'alerta15', 'alerta16');
    if      (totalFichas === 14) this.domTablero.classList.add('alerta14');
    else if (totalFichas === 15) this.domTablero.classList.add('alerta15');
    else if (totalFichas === 16) this.domTablero.classList.add('alerta16');
  }

  crearFicha(valor, fila, col) {
    const ficha = document.createElement('div');
    ficha.className = 'ficha';

    const inner = document.createElement('div');
    inner.className  = `ficha-inner v${valor}`;
    inner.textContent = valor;
    ficha.appendChild(inner);

    ficha.dataset.pos = `${fila}-${col}`;

    const rect   = this.domTablero.getBoundingClientRect();
    const tamTab = rect.width;
    const hueco  = 10;
    const lado   = (tamTab - hueco * (TAM + 1)) / TAM;

    ficha.style.width     = `${lado}px`;
    ficha.style.height    = `${lado}px`;
    ficha.style.position  = 'absolute';

    const x = hueco + col  * (lado + hueco);
    const y = hueco + fila * (lado + hueco);
    ficha.style.transform = `translate(${x}px, ${y}px)`;

    this.domTablero.appendChild(ficha);

    inner.style.transform = 'scale(0.8)';
    inner.style.opacity   = '0';
    requestAnimationFrame(() => {
      inner.style.transition = 'transform 0.15s ease-in-out, opacity 0.12s ease';
      inner.style.transform  = 'scale(1)';
      inner.style.opacity    = '1';
    });

    return ficha;
  }

  actualizarBotones() {
    if (this.botonDeshacer) this.botonDeshacer.disabled = this.historial.length === 0;
  }

  agregarFicha() {
    const vacias = [];
    for (let r = 0; r < TAM; r++)
      for (let c = 0; c < TAM; c++)
        if (this.tablero[r][c] === 0) vacias.push({ r, c });
    if (vacias.length) {
      const azar = vacias[Math.floor(Math.random() * vacias.length)];
      this.tablero[azar.r][azar.c] = Math.random() < 0.9 ? 2 : 4;
      return true;
    }
    return false;
  }

  // ── Audio ─────────────────────────────────────────────────
  sonido(freq, dur = 0.06) {
    if (!this.sonidoActivo || !this.ctx) return;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq; gain.gain.value = 0.0001;
    osc.connect(gain); gain.connect(this.ctx.destination);
    const now = this.ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.stop(now + dur + 0.02);
  }

  toggleSonido() {
    this.sonidoActivo = !this.sonidoActivo;
    const btn = document.getElementById('btn-sonido');
    if (btn) btn.textContent = this.sonidoActivo ? '🔊' : '🔇';
  }

  // ── Persistencia ──────────────────────────────────────────
  guardar() {
    try {
      localStorage.setItem(CLAVE_ESTADO, JSON.stringify({
        tablero: this.tablero, puntaje: this.puntaje, mejor: this.mejor,
        historial: this.historial, maxDeshacer: this.maxDeshacer,
        sonidoActivo: this.sonidoActivo, perdidoTemporal: this.perdidoTemporal
      }));
    } catch (e) { console.warn('guardar:', e); }
  }

  cargar() {
    try {
      const raw = localStorage.getItem(CLAVE_ESTADO);
      if (!raw) return false;
      const e = JSON.parse(raw);
      this.tablero         = e.tablero       || matrizVacia();
      this.puntaje         = e.puntaje       || 0;
      this.mejor           = e.mejor         || this.mejor;
      this.historial       = e.historial     || [];
      this.maxDeshacer     = e.maxDeshacer   || 6;
      this.sonidoActivo    = e.sonidoActivo  !== undefined ? e.sonidoActivo : true;
      this.perdidoTemporal = e.perdidoTemporal || false;
      return true;
    } catch { return false; }
  }
}