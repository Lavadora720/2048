/**
 * sandbox.js — Modo sandbox
 * - Toggle con confirmación: cambiar de modo limpia el tablero
 * - En sandbox: no se acumula puntaje, no se guarda score
 * - Botones para insertar fichas 512/1024/2048/4096 en celda vacía aleatoria
 * - window._sandboxActivo usado por game.js y main.js
 */

(function () {

  let sandboxActivo = false;

  // ── Insertar ficha en celda vacía aleatoria ─────────────────
  function agregarFichaEspecifica(valor) {
    const juego = window.juego;
    if (!juego) return;

    const vacias = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (juego.tablero[r][c] === 0) vacias.push({ r, c });

    if (!vacias.length) return;

    const pos = vacias[Math.floor(Math.random() * vacias.length)];
    juego.tablero[pos.r][pos.c] = valor;
    juego.actualizarVista();
    actualizarBotonesFicha();
  }

  function actualizarBotonesFicha() {
    const juego = window.juego;
    if (!juego) return;
    const hayVacias = juego.tablero.some(f => f.includes(0));
    document.querySelectorAll('.btn-ficha').forEach(btn => {
      btn.disabled = !hayVacias;
    });
  }

  // ── Toggle con confirmación y limpieza de tablero ───────────
  function toggleSandbox() {
    const juego = window.juego;
    if (!juego) return;

    if (!sandboxActivo) {
      // Entrando a sandbox
      const ok = confirm(
        '⚗ MODO SANDBOX\n\n' +
        'Al activar el modo sandbox el tablero se reiniciará y los puntajes no se registrarán.\n\n' +
        '¿Continuar?'
      );
      if (!ok) return;

      sandboxActivo = true;
      window._sandboxActivo = true;
      juego.reiniciar();
      document.body.classList.add('sandbox');
      actualizarBotonesFicha();

    } else {
      // Saliendo de sandbox
      const ok = confirm(
        '⚠ SALIR DEL SANDBOX\n\n' +
        'Al salir el tablero se reiniciará y volverás al modo normal.\n\n' +
        '¿Continuar?'
      );
      if (!ok) return;

      sandboxActivo = false;
      window._sandboxActivo = false;
      juego.reiniciar();
      document.body.classList.remove('sandbox');
    }
  }

  // ── Init ────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    window._sandboxActivo = false;

    const btnSandbox = document.getElementById('btn-sandbox');
    if (btnSandbox) btnSandbox.addEventListener('click', toggleSandbox);

    document.querySelectorAll('.btn-ficha').forEach(btn => {
      btn.addEventListener('click', () => {
        const valor = parseInt(btn.dataset.val);
        if (valor) agregarFichaEspecifica(valor);
      });
    });
  });

})();