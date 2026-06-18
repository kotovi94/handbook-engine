const bridgeStorageKey = "handbook-engine-page-bridge";
const bridgeDuration = 190;

export function setupPageBridge(currentPage, getTargetPage) {
  applyBridgeEnter(currentPage);

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
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

  document.body.classList.add(`bridge-enter-from-${bridge.from}`);
  window.setTimeout(() => {
    document.body.classList.remove(`bridge-enter-from-${bridge.from}`);
    clearBridgeNavigation();
  }, prefersReducedMotion() ? 0 : 420);
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

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
