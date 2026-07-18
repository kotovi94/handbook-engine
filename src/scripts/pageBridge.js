const bridgeStorageKey = "handbook-engine-page-bridge";
const bridgeDuration = 540;
const bridgeEnterDuration = 680;
const particleCount = 34;
const pieceSelectors = [
  "#app .sidebar",
  "#app .main-header",
  "#app .home-hero",
  "#app .home-action-card",
  "#app .content-card",
  "#app .class-card",
  "#app .panel",
  "#app .summary-card",
  ".campaigns-home > .home-header",
  ".campaigns-home .home-hero-copy",
  ".campaigns-home .overview-card",
  ".campaigns-home .section-heading",
  ".campaigns-home .campaign-card",
  ".campaigns-home .empty-state",
  "#campaign-app:not(.hidden) > .sidebar",
  "#campaign-app:not(.hidden) > .main-content > .topbar",
  "#campaign-app:not(.hidden) .view.active > .section-heading",
  "#campaign-app:not(.hidden) .stat-card",
  "#campaign-app:not(.hidden) .character-card",
  "#campaign-app:not(.hidden) .character-row",
  "#campaign-app:not(.hidden) .timeline-item",
  "#campaign-app:not(.hidden) .panel",
  "#campaign-app:not(.hidden) .log-card",
];

export function setupPageBridge(currentPage, getTargetPage) {
  applyBridgeEnter(currentPage);

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !shouldAnimateNavigation(event, link)) {
      return;
    }

    const targetPage = getTargetPage(link);
    if (!targetPage || targetPage === currentPage) {
      return;
    }

    event.preventDefault();
    storeBridgeNavigation(currentPage, targetPage);
    document.body.classList.add(`bridge-leaving-to-${targetPage}`);
    animateBridgePieces("leave", targetPage);
    createDissolveLayer("leave", targetPage);

    const delay = prefersReducedMotion() ? 0 : bridgeDuration;
    window.setTimeout(() => {
      window.location.href = link.href;
    }, delay);
  });
}

function applyBridgeEnter(currentPage) {
  const bridge = readBridgeNavigation();
  if (!bridge || bridge.to !== currentPage || bridge.from === currentPage) {
    clearBridgeNavigation();
    return;
  }

  document.body.classList.add(`bridge-enter-from-${bridge.from}`, "bridge-preparing");
  window.requestAnimationFrame(() => {
    animateBridgePieces("enter", bridge.from);
    createDissolveLayer("enter", bridge.from);
    document.body.classList.remove("bridge-preparing");
  });
  window.setTimeout(() => {
    document.body.classList.remove(`bridge-enter-from-${bridge.from}`);
    cleanupBridgePieces();
    clearBridgeNavigation();
  }, prefersReducedMotion() ? 0 : bridgeEnterDuration);
}

function shouldAnimateNavigation(event, link) {
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
  ) {
    return false;
  }

  if (link.target && link.target !== "_self") {
    return false;
  }

  const url = new URL(link.href, window.location.href);
  return url.href !== window.location.href;
}

function storeBridgeNavigation(from, to) {
  try {
    window.sessionStorage.setItem(bridgeStorageKey, JSON.stringify({ from, to }));
  } catch (error) {
    // Navigation still works; only the destination entrance animation is skipped.
  }
}

function readBridgeNavigation() {
  try {
    return JSON.parse(window.sessionStorage.getItem(bridgeStorageKey));
  } catch (error) {
    return null;
  }
}

function clearBridgeNavigation() {
  try {
    window.sessionStorage.removeItem(bridgeStorageKey);
  } catch (error) {
    // Nothing to clean up when storage is unavailable.
  }
}

function animateBridgePieces(mode, page) {
  if (prefersReducedMotion()) {
    return;
  }

  cleanupBridgePieces();

  const pieces = getBridgePieces();
  if (!pieces.length) {
    return;
  }

  document.body.classList.add("bridge-has-pieces");
  const direction = page === "campaigns" ? -1 : 1;

  pieces.forEach((piece, index) => {
    const rowBias = piece.getBoundingClientRect().top / Math.max(window.innerHeight, 1);
    const drift = seededRange(index + 101, 44, 128);
    const vertical = seededRange(index + 131, -58, 64) + ((rowBias - .5) * 34);
    const rotate = seededRange(index + 151, -8, 8);
    const delay = Math.min(170, (index * 18) + seededRange(index + 181, 0, 22));

    piece.classList.add("bridge-piece", mode === "leave" ? "bridge-piece-disassemble" : "bridge-piece-assemble");
    piece.style.setProperty("--piece-dx", `${direction * drift}px`);
    piece.style.setProperty("--piece-dy", `${vertical}px`);
    piece.style.setProperty("--piece-rotate", `${rotate}deg`);
    piece.style.setProperty("--piece-scale", `${seededRange(index + 211, .9, 1.035)}`);
    piece.style.setProperty("--piece-delay", `${delay}ms`);
    piece.style.setProperty("--piece-origin", `${seededRange(index + 241, 18, 82)}% ${seededRange(index + 271, 18, 82)}%`);
  });
}

function getBridgePieces() {
  const pieces = [];
  pieceSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (isVisibleElement(element) && !pieces.includes(element)) {
        pieces.push(element);
      }
    });
  });

  if (pieces.length >= 3) {
    return pieces.slice(0, 36);
  }

  const root = document.querySelector("#app .main-content, .campaigns-home:not(.hidden), #campaign-app:not(.hidden) .main-content");
  if (!root) {
    return pieces;
  }

  root.querySelectorAll(":scope > *").forEach((element) => {
    if (isVisibleElement(element) && !pieces.includes(element)) {
      pieces.push(element);
    }
  });

  return pieces.slice(0, 36);
}

function cleanupBridgePieces() {
  document.body.classList.remove("bridge-has-pieces");
  document.querySelectorAll(".bridge-piece").forEach((piece) => {
    piece.classList.remove("bridge-piece", "bridge-piece-disassemble", "bridge-piece-assemble");
    [
      "--piece-dx",
      "--piece-dy",
      "--piece-rotate",
      "--piece-scale",
      "--piece-delay",
      "--piece-origin",
    ].forEach((property) => piece.style.removeProperty(property));
  });
}

function isVisibleElement(element) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0
    && rect.height > 0
    && style.display !== "none"
    && style.visibility !== "hidden"
    && !element.closest(".hidden");
}

function createDissolveLayer(mode, page) {
  if (prefersReducedMotion()) {
    return;
  }

  document.querySelectorAll(".page-dissolve").forEach((layer) => layer.remove());

  const layer = document.createElement("div");
  layer.className = `page-dissolve page-dissolve-${mode} page-dissolve-${page}`;

  const direction = page === "campaigns" ? -1 : 1;
  const columns = 12;
  const rows = Math.ceil(particleCount / columns);

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement("span");
    const column = index % columns;
    const row = Math.floor(index / columns);
    const jitterX = seededRange(index, -2.8, 2.8);
    const jitterY = seededRange(index + 17, -3.5, 3.5);
    const driftX = direction * seededRange(index + 31, 34, 96);
    const driftY = seededRange(index + 49, -46, 46);
    const size = seededRange(index + 71, 4, 13);
    const delay = (column * 5) + (row * 8) + seededRange(index + 89, 0, 16);

    particle.style.setProperty("--x", `${clamp((column / (columns - 1)) * 100 + jitterX, 2, 98)}vw`);
    particle.style.setProperty("--y", `${clamp((row / Math.max(rows - 1, 1)) * 100 + jitterY, 2, 98)}vh`);
    particle.style.setProperty("--dx", `${driftX}px`);
    particle.style.setProperty("--dy", `${driftY}px`);
    particle.style.setProperty("--size", `${size}px`);
    particle.style.setProperty("--delay", `${delay}ms`);
    layer.append(particle);
  }

  document.body.append(layer);
  window.setTimeout(() => layer.remove(), mode === "enter" ? bridgeEnterDuration : bridgeDuration);
}

function seededRange(seed, min, max) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return min + ((value - Math.floor(value)) * (max - min));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
