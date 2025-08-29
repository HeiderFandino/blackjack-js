// === BLACKJACK épico: lógica + FX + historial lateral ===

// Baraja
let deck = [];
const tipos = ["C", "D", "H", "S"];
const especiales = ["A", "J", "Q", "K"];

// Puntos
let puntoJugador = 0;
let puntoComputadora = 0;

// Referencias DOM existentes
const btnPedir = document.querySelector("#btnPedir");
const divCartaJugardor = document.querySelector("#jugador-carta");
const divCartacomputadora = document.querySelector("#computadora-carta");
const puntosAcomulados = document.querySelectorAll("small");
const btnDetener = document.querySelector("#btnDetener");
const btnNuevo = document.querySelector("#btnNuevo");

/* =========================
   Historial (panel derecho, 2 columnas)
   ========================= */
let historial = []; // valores: "win" | "lose" | "draw"

const renderHistorial = () => {
  let cont = document.getElementById("historial-zone");

  // Si aún no hay partidas, no mostramos nada
  if (historial.length === 0) {
    if (cont) cont.remove();
    return;
  }

  if (!cont) {
    cont = document.createElement("div");
    cont.id = "historial-zone";

    // ——— Panel fijo a la derecha
    cont.style.position = "fixed";
    cont.style.top = "100px";
    cont.style.right = "10px";
    cont.style.width = "220px";
    cont.style.maxHeight = "420px";
    cont.style.overflowY = "auto";
    cont.style.padding = "10px";
    cont.style.background = "rgba(0,0,0,0.7)";
    cont.style.border = "1px solid #555";
    cont.style.borderRadius = "10px";
    cont.style.color = "#fff";
    cont.style.zIndex = "9999";

    cont.innerHTML = `
      <h4 style="margin:0 0 8px;">📜 Historial</h4>
      <table id="tablaHistorial" style="border-collapse:collapse; text-align:center; width:100%;">
        <thead>
          <tr>
            <th style="padding:6px; border:1px solid #ccc;">Win</th>
            <th style="padding:6px; border:1px solid #ccc;">Lose</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    document.body.appendChild(cont);
  }

  const tbody = cont.querySelector("tbody");
  tbody.innerHTML = historial.map(r => {
    // Colores por resultado
    let winCell = "";
    let loseCell = "";
    if (r === "win") {
      winCell = "background:limegreen;";
    } else if (r === "lose") {
      loseCell = "background:crimson;";
    } else if (r === "draw") {
      winCell = "background:gold;";
      loseCell = "background:gold;";
    }

    return `
      <tr>
        <td style="width:50%; height:24px; border:1px solid #ccc; ${winCell}"></td>
        <td style="width:50%; height:24px; border:1px solid #ccc; ${loseCell}"></td>
      </tr>
    `;
  }).join("");
};

const registrarResultado = (resultado) => {
  historial.unshift(resultado);                 // última partida arriba
  if (historial.length > 20) historial.pop();   // máximo 20 filas
  renderHistorial();                             // crea/actualiza panel SOLO tras la 1ª partida
};

/* =========================
   MEMES (hasta 10 por categoría) + precarga
   ========================= */
const DEFAULT_FX_DURATION = 3000; // si un meme no define ms

const buildMemes = (prefix, count, {
  basePath = "assets/memes",
  ext = "gif",
  ms = 0 // 0 => no autocierra (clic o ESC para cerrar)
} = {}) =>
  Array.from({ length: count }, (_, i) => ({
    src: `${basePath}/${prefix}${i + 1}.${ext}`,
    ms
  }));

let MEMES = {
  win:  buildMemes("win",  10, { ms: 0 }),
  lose: buildMemes("lose", 10, { ms: 0 }),
  draw: buildMemes("draw", 10, { ms: 2500 })
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const preloadMemes = async () => {
  const load = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ ok: true, src });
      img.onerror = () => resolve({ ok: false, src });
      img.src = src;
    });

  for (const key of Object.keys(MEMES)) {
    const results = await Promise.all(MEMES[key].map(m => load(m.src)));
    const okSet = new Set(results.filter(r => r.ok).map(r => r.src));
    const before = MEMES[key].length;
    MEMES[key] = MEMES[key].filter(m => okSet.has(m.src));
    const after = MEMES[key].length;
    if (after < before) {
      console.warn(`[MEMES] ${key}: ${before - after} archivos omitidos (no cargaron).`);
    }
  }
};
preloadMemes();

/* =========================
   Overlay (solo meme) + shake
   ========================= */
const ensureOverlay = () => {
  let overlay = document.getElementById("fx-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "fx-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
  }
  return overlay;
};

const showFX = (type = "win", opts = {}) => {
  const overlay = ensureOverlay();

  // Sacudida breve
  document.body.classList.add("fx-shake");
  setTimeout(() => document.body.classList.remove("fx-shake"), 320);

  const meme = pickRandom(MEMES[type] || []);
  const src = meme?.src || null;
  const dur = (typeof opts.duration === "number")
    ? opts.duration
    : (typeof meme?.ms === "number" ? meme.ms : DEFAULT_FX_DURATION);

  overlay.innerHTML = "";

  const content = document.createElement("div");
  content.className = "fx-pop";

  if (src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = type;
    img.style.maxWidth = "min(90vw, 520px)";
    img.style.maxHeight = "80vh";
    img.style.objectFit = "contain";
    content.appendChild(img);
  }

  overlay.appendChild(content);
  overlay.classList.add("show");

  const hide = () => {
    overlay.classList.remove("show");
    overlay.innerHTML = "";
    overlay.removeEventListener("click", hide);
    window.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => (e.key === "Escape") && hide();

  overlay.addEventListener("click", hide);
  window.addEventListener("keydown", onKey);

  if (dur > 0 && Number.isFinite(dur)) setTimeout(hide, dur);
};

/* =========================
   Toasts (pequeños, no bloqueantes)
   ========================= */
const ensureToastZone = () => {
  let zone = document.getElementById("toast-zone");
  if (!zone) {
    zone = document.createElement("div");
    zone.id = "toast-zone";
    // estilos básicos si no estaban en el CSS
    zone.style.position = "fixed";
    zone.style.top = "14px";
    zone.style.left = "50%";
    zone.style.transform = "translateX(-50%)";
    zone.style.zIndex = "10000";
    zone.style.display = "flex";
    zone.style.flexDirection = "column";
    zone.style.gap = "10px";
    zone.style.pointerEvents = "none";
    document.body.appendChild(zone);
  }
  return zone;
};

const showToast = (type, { title, duration = 2000 } = {}) => {
  const zone = ensureToastZone();
  const txt = title || (type === "win" ? "¡GANASTE!" : type === "lose" ? "Perdiste" : "Empate");

  const toast = document.createElement("div");
  toast.textContent = txt;
  toast.style.pointerEvents = "all";
  toast.style.minWidth = "200px";
  toast.style.maxWidth = "90vw";
  toast.style.padding = "10px 14px";
  toast.style.borderRadius = "12px";
  toast.style.color = "#fff";
  toast.style.boxShadow = "0 10px 30px rgba(0,0,0,.35)";
  toast.style.backdropFilter = "blur(6px)";
  toast.style.textAlign = "center";
  toast.style.fontWeight = "700";
  toast.style.animation = "toastIn .35s ease-out both";

  if (type === "win") toast.style.background = "linear-gradient(135deg,#00c853,#009688)";
  else if (type === "lose") toast.style.background = "linear-gradient(135deg,#e53935,#b71c1c)";
  else toast.style.background = "linear-gradient(135deg,#546e7a,#263238)";

  zone.appendChild(toast);
  setTimeout(() => { if (zone.contains(toast)) zone.removeChild(toast); }, duration);
};

/* =========================
   Botón Instrucciones (pequeño, blanco)
   ========================= */
const crearBotonInstrucciones = () => {
  const contBotones = document.getElementById("divBotones");
  if (!contBotones) return;
  let btn = document.getElementById("btnInstrucciones");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "btnInstrucciones";
    btn.textContent = "Instrucciones";
    btn.style.margin = "5px";
    btn.style.padding = "6px 12px";
    btn.style.fontSize = "13px";
    btn.style.background = "#fff";
    btn.style.color = "#000";
    btn.style.border = "1px solid #ccc";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";
    contBotones.appendChild(btn);

    btn.addEventListener("click", () => {
      alert(`🎮 Instrucciones rápidas:
- El objetivo es llegar lo más cerca posible a 21 sin pasarte.
- 2-10 valen su número, J/Q/K valen 10, As vale 11.
- Pides cartas hasta que decidas detenerte.
- Luego la computadora saca cartas hasta alcanzarte sin pasarse.
- Gana quien esté más cerca de 21 sin pasarse.`);
    });
  }
};
crearBotonInstrucciones();

/* =========================
   Lógica del juego
   ========================= */
const crearDeck = () => {
  deck = [];
  for (let i = 2; i <= 10; i++) for (let t of tipos) deck.push(i + t);
  for (let t of tipos) for (let e of especiales) deck.push(e + t);
  deck = _.shuffle(deck);
  return deck;
};
crearDeck();

const perdirCarta = () => {
  if (deck.length <= 0) throw "No hay cartas en el deck";
  return deck.pop();
};

const valorCarta = (carta) => {
  const valor = carta.substring(0, carta.length - 1);
  return isNaN(valor) ? (valor === "A" ? 11 : 10) : valor * 1;
};

/**
 * Turno de la computadora.
 * @param {number} puntosMinimos - puntos del jugador
 * @param {{forcedResult?: 'win'|'lose'|'draw'|null, minDraw?: number}} opts
 *  - forcedResult: si ya se sabe el resultado, la compu solo roba cartas (no registra/ni FX).
 *  - minDraw: mínimo de cartas que la compu debe robar (default 1 si forcedResult existe, si no 0).
 */
const turnoComputadora = async (puntosMinimos, opts = {}) => {
  const { forcedResult = null, minDraw } = opts;
  const mustDrawAtLeast = typeof minDraw === "number"
    ? Math.max(0, minDraw)
    : (forcedResult ? 1 : 0); // si el resultado ya está decidido, al menos 1 carta

  btnPedir.disabled = true;
  btnDetener.disabled = true;

  // Reinicia la vista de la compu en cada ronda visual
  puntoComputadora = 0;
  puntosAcomulados[1].innerText = 0;
  divCartacomputadora.innerHTML = "";

  let draws = 0;

  do {
    await new Promise(r => setTimeout(r, 700));
    const carta = perdirCarta();
    puntoComputadora += valorCarta(carta);
    puntosAcomulados[1].innerText = puntoComputadora;

    const imgCarta = document.createElement("img");
    imgCarta.classList.add("carta");
    imgCarta.src = `assets/cartas/cartas/${carta}.png`;
    divCartacomputadora.append(imgCarta);

    draws++;

    // si el jugador se pasó, igual dibujamos mustDrawAtLeast y salimos
    if (puntosMinimos > 21 && draws >= mustDrawAtLeast) break;

  } while (
    // si NO hay resultado forzado, jugamos normal:
    (!forcedResult && (puntoComputadora < puntosMinimos) && puntosMinimos <= 21)
    ||
    // si hay resultado forzado, solo aseguramos el mínimo de robos:
    (forcedResult && draws < mustDrawAtLeast)
  );

  await new Promise(r => setTimeout(r, 700));

  // Si hay resultado forzado, NO evaluamos nada: ya fue resuelto antes.
  if (forcedResult) return;

  // Resultado + FX + historial + toast (modo normal)
  if (puntoComputadora === puntosMinimos) {
    showFX("draw");
    showToast("draw", { title: "Empate" });
    registrarResultado("draw");
  } else if (puntosMinimos > 21) {
    showFX("lose");
    showToast("lose", { title: "Computadora gana" });
    registrarResultado("lose");
  } else if (puntoComputadora > 21) {
    showFX("win");
    showToast("win", { title: "¡Ganaste!" });
    registrarResultado("win");
  } else {
    showFX("lose");
    showToast("lose", { title: "Computadora gana" });
    registrarResultado("lose");
  }
};

// Eventos de botones
btnPedir.addEventListener("click", async () => {
  const carta = perdirCarta();
  puntoJugador += valorCarta(carta);
  puntosAcomulados[0].innerText = puntoJugador;

  const imgCarta = document.createElement("img");
  imgCarta.classList.add("carta");
  imgCarta.src = `assets/cartas/cartas/${carta}.png`;
  divCartaJugardor.append(imgCarta);

  if (puntoJugador > 21) {
    // Jugador se pasó: registrar pérdida y hacer que la compu robe AL MENOS 1 carta sin reevaluar
    btnPedir.disabled = true;
    btnDetener.disabled = true;
    showFX("lose");
    showToast("lose", { title: "Computadora gana" });
    registrarResultado("lose");
    await turnoComputadora(puntoJugador, { forcedResult: "lose", minDraw: 1 });
    return;
  } else if (puntoJugador === 21) {
    // 21 clavado: registrar victoria y hacer que la compu robe AL MENOS 1 carta sin reevaluar
    btnPedir.disabled = true;
    btnDetener.disabled = true;
    showFX("win");
    showToast("win", { title: "¡21 clavado!" });
    registrarResultado("win");
    await turnoComputadora(puntoJugador, { forcedResult: "win", minDraw: 1 });
    return;
  }
});

btnDetener.addEventListener("click", async () => {
  btnPedir.disabled = true;
  btnDetener.disabled = true;
  await turnoComputadora(puntoJugador); // modo normal (sin resultado forzado)
});

btnNuevo.addEventListener("click", () => {
  deck = crearDeck();
  btnDetener.disabled = false;
  btnPedir.disabled = false;

  puntoJugador = 0;
  puntoComputadora = 0;
  puntosAcomulados[1].innerText = 0;
  puntosAcomulados[0].innerText = 0;

  divCartacomputadora.innerHTML = "";
  divCartaJugardor.innerHTML = "";
});
