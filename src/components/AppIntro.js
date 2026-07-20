const introStorageKey = "handbook-engine-app-intro-seen";

export function AppIntro() {
  if (hasSeenIntro()) {
    return null;
  }

  markIntroAsSeen();

  const intro = document.createElement("div");
  intro.className = "app-intro";
  intro.setAttribute("role", "status");
  intro.setAttribute("aria-live", "polite");
  intro.innerHTML = `
    <div class="app-intro-card">
      <span class="app-intro-d20" aria-hidden="true">20</span>
      <strong>D20 Travesías</strong>
      <span>Abriendo el compendio…</span>
    </div>
  `;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fadeDelay = reducedMotion ? 80 : 520;
  const removeDelay = reducedMotion ? 160 : 780;

  window.setTimeout(() => intro.classList.add("is-leaving"), fadeDelay);
  window.setTimeout(() => intro.remove(), removeDelay);

  return intro;
}

function hasSeenIntro() {
  try {
    return window.sessionStorage.getItem(introStorageKey) === "true";
  } catch {
    return false;
  }
}

function markIntroAsSeen() {
  try {
    window.sessionStorage.setItem(introStorageKey, "true");
  } catch {
    // The intro can still run when session storage is unavailable.
  }
}
