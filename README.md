# 2048 Light

Una versión limpia y de código abierto del juego 2048. Sin servidores, sin cuentas, sin dependencias externas. Todo corre en el navegador.

---

## Cómo jugar

Une fichas del mismo número moviéndolas en cualquier dirección. Cuando dos fichas iguales chocan se fusionan y su valor se duplica. El objetivo es llegar a la ficha **2048**, aunque el juego no termina ahí: puedes seguir acumulando puntaje indefinidamente.

**Controles:**

| Acción | Teclado | Táctil |
|---|---|---|
| Mover | Flechas o WASD | Deslizar |
| Deshacer | `Ctrl + Z` o botón | — |
| Toggle sonido | `M` | botón 🔊 |

---

## Características

- Movimiento con flechas, WASD y swipe táctil
- Deshacer hasta 12 pasos (configurable con el slider)
- Puntaje actual, mejor puntaje e indicador de fichas en tablero
- Top 10 partidas guardado localmente en el navegador (sin nombre, solo puntaje)
- Alertas visuales cuando el tablero se está llenando
- Audio minimalista en cada movimiento
- **Modo Sandbox** para experimentar con fichas de alto valor sin afectar el ranking
- Layout horizontal en pantallas anchas (PC), vertical en móvil
- Cero dependencias externas — un solo `index.html` y archivos estáticos

---

## Instalación

No requiere instalación ni build. Solo descarga y abre.

```bash
git clone https://github.com/tu-usuario/2048-light.git
cd 2048-light
# Abre index.html en tu navegador
```

O si quieres servirlo localmente:

```bash
python3 -m http.server 8000
# Abre http://localhost:8000
```

---

## Estructura del proyecto

```
2048-light/
├── index.html          # Estructura HTML del juego
├── css/
│   ├── base.css        # Variables CSS, reset, body
│   ├── board.css       # Tablero, celdas, fichas, animaciones
│   ├── tiles.css       # Colores de cada valor de ficha
│   ├── ui.css          # Encabezado, botones, slider, scores, responsive
│   └── sandbox.css     # Estilos del modo sandbox (acento morado)
└── js/
    ├── game.js         # Motor del juego: lógica, movimiento, persistencia
    ├── main.js         # Inicialización, scores locales top 10
    └── sandbox.js      # Lógica del modo sandbox
```

`game.js` es el núcleo y no tiene dependencias con el resto. Puedes reutilizarlo en cualquier proyecto que provea los IDs de DOM esperados.

---

## Modo Sandbox

El modo Sandbox permite explorar el tablero libremente sin afectar el ranking. Al activarlo:

- Los puntajes y el top 10 se ocultan
- Aparece un panel para insertar fichas de **512 / 1024 / 2048 / 4096** en una celda vacía aleatoria
- El acento visual cambia de amarillo a morado neón
- Las partidas jugadas en este modo **no se guardan** en el top 10

Para activarlo presiona el botón **⚗ SANDBOX**. Para salir presiónalo de nuevo.

---

## Personalización

Todos los colores y radios están en variables CSS en `base.css`. Para cambiar el tema completo solo necesitas editar `:root`.

Los colores de las fichas están aislados en `tiles.css`: cada clase `.ficha-inner.vN` es independiente.

Para agregar valores de ficha nuevos (por ejemplo `v131072`) basta con añadir una regla en `tiles.css`.

---

## Licencia

Este proyecto se distribuye bajo la licencia **GNU General Public License v3.0**.

Eso significa que:

- Puedes usar, estudiar, modificar y distribuir este código libremente
- Si distribuyes una versión modificada, debes hacerlo bajo la misma licencia GPL v3
- Debes incluir el código fuente (o un enlace a él) cuando distribuyas el proyecto
- No puedes convertirlo en software propietario

Consulta el texto completo en [https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html).

---

## Créditos

El juego original 2048 fue creado por [Gabriele Cirulli](https://github.com/gabrielecirulli/2048).