const iconPaths = {
  anchor: '<path d="M12 3v15M8 7h8M5 13a7 7 0 0 0 14 0M5 13H2m17 0h3"/>',
  armor: '<path d="M7 3h10l3 5-3 13H7L4 8l3-5Z"/><path d="M9 3v6h6V3"/>',
  axe: '<path d="m14 4 6 2-2 6-5-1-7 10-2-2 7-10-1-5 4 0Z"/>',
  book: '<path d="M4 5a3 3 0 0 1 3-3h5v18H7a3 3 0 0 0-3 3V5Z"/><path d="M20 5a3 3 0 0 0-3-3h-5v18h5a3 3 0 0 1 3 3V5Z"/>',
  bow: '<path d="M6 3c8 4 8 14 0 18M18 3c-8 4-8 14 0 18M6 3l12 18M5 12h14"/>',
  candle: '<path d="M9 10h6v11H9zM8 21h8M12 10c-3-2 2-4 0-7 4 2 4 5 0 7Z"/>',
  cards: '<path d="m8 4 10 3-4 14-10-3L8 4Z"/><path d="m10 8 3-4 7 6-3 3"/>',
  clover: '<path d="M12 11C5 8 5 3 9 3c2 0 3 2 3 4 0-2 1-4 3-4 4 0 4 5-3 8Zm0 0c7-3 7 2 4 4-2 1-4-1-4-4 0 3-2 5-4 4-3-2-3-7 4-4Zm0 0v10"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>',
  coins: '<ellipse cx="9" cy="7" rx="5" ry="2.5"/><path d="M4 7v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7M10 16c.8.6 2.2 1 4 1 2.8 0 5-1.1 5-2.5v-4M14 8c2.8 0 5 1.1 5 2.5S16.8 13 14 13"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4 4-2Z"/>',
  crown: '<path d="m3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Z"/><path d="M5 19h14"/>',
  dagger: '<path d="m14 3 4 4-9 9-4 1 1-4 8-10ZM4 18l2 2m-4 2 4-4"/>',
  dragon: '<path d="M4 18c2-7 7-12 16-14-2 3-3 5-2 8l3 2-5 1c-2 4-6 6-12 3Z"/><path d="M8 15c1-3 4-5 8-6M8 18l-2 3"/>',
  eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  flame: '<path d="M13 2c1 5-3 6-1 10 1-2 3-3 4-5 3 4 4 8 1 12-3 4-10 3-12-2-2-5 2-8 4-11 0 4 2 5 4 7"/>',
  gem: '<path d="m7 4-4 6 9 11 9-11-4-6H7Z"/><path d="m3 10 9 3 9-3M7 4l5 9 5-9"/>',
  hammer: '<path d="M4 5h9v5H4zM9 10l-5 9 3 2 6-11"/>',
  helm: '<path d="M5 20V9a7 7 0 0 1 14 0v11M5 13h14M9 13v7m6-7v7"/>',
  leaf: '<path d="M20 4C10 4 4 9 4 16c4 2 9 0 12-4 2-3 3-6 4-8Z"/><path d="M4 20c3-6 7-9 12-11"/>',
  map: '<path d="m3 5 6-3 6 3 6-3v17l-6 3-6-3-6 3V5Z"/><path d="M9 2v17m6-14v17"/>',
  mask: '<path d="M3 8c4-3 7-3 9 0 2-3 5-3 9 0-1 8-4 12-9 12S4 16 3 8Z"/><path d="M7 11h2m6 0h2M9 16c2 1 4 1 6 0"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  moon: '<path d="M20 15a8 8 0 1 1-11-11 7 7 0 0 0 11 11Z"/>',
  mountain: '<path d="m3 20 7-14 4 8 2-4 5 10H3Z"/><path d="m8 10 2 2 2-2"/>',
  music: '<path d="M9 18V5l10-2v13M9 9l10-2"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
  person: '<circle cx="12" cy="7" r="4"/><path d="M4 22c0-5 3-8 8-8s8 3 8 8"/>',
  quill: '<path d="M20 3C12 3 6 8 5 16l3-2 2 3c6-3 9-8 10-14Z"/><path d="M4 21c3-6 7-10 12-14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
  shield: '<path d="M12 2 20 5v6c0 5-3 9-8 11-5-2-8-6-8-11V5l8-3Z"/><path d="M12 6v11M8 11h8"/>',
  spark: '<path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z"/><path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>',
  sword: '<path d="m15 3 6-1-1 6L9 19l-4-4L15 3Z"/><path d="m4 14 6 6M3 21l3-3"/>',
  tools: '<path d="M14 6a5 5 0 0 0-7 6l-5 5 5 5 5-5a5 5 0 0 0 6-7l-3 3-4-4 3-3Z"/>',
  wheat: '<path d="M12 22V5M12 8c-4 0-5-2-5-4 3 0 5 1 5 4Zm0 4c-4 0-5-2-5-4 3 0 5 1 5 4Zm0 4c-4 0-5-2-5-4 3 0 5 1 5 4Zm0-8c4 0 5-2 5-4-3 0-5 1-5 4Zm0 4c4 0 5-2 5-4-3 0-5 1-5 4Zm0 4c4 0 5-2 5-4-3 0-5 1-5 4Z"/>',
};

export function Icon({ name, className = "" } = {}) {
  const icon = document.createElement("span");
  icon.className = `ui-icon ${className}`.trim();
  icon.setAttribute("aria-hidden", "true");

  if (!iconPaths[name]) {
    icon.textContent = name || "";
    return icon;
  }

  icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name]}</svg>`;
  return icon;
}
