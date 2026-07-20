export function HeroBanner() {
  const banner = document.createElement("header");
  banner.className = "hero-banner";
  banner.setAttribute("aria-labelledby", "handbook-hero-title");
  banner.innerHTML = `
    <div class="hero-banner-content">
      <p class="hero-banner-kicker">Manual de aventurero</p>
      <h1 class="hero-banner-title" id="handbook-hero-title">Creador de personajes</h1>
      <p class="hero-banner-subtitle">D&D 5e 2024</p>
      <p>Crea personajes listos para la mesa presencial.</p>
    </div>
  `;
  return banner;
}
