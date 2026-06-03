export function ContentCard({ title, eyebrow, summary, href, meta = [], tags = [] }) {
  const article = document.createElement("article");
  article.className = "content-card";

  const tagMarkup = tags.length
    ? `<div class="tag-list">${tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>`
    : "";

  const metaMarkup = meta.length
    ? `<dl class="meta-list">${meta.map((item) => `<div><dt>${item.label}</dt><dd>${item.value}</dd></div>`).join("")}</dl>`
    : "";

  article.innerHTML = `
    <a class="content-card-link" href="${href}">
      <span class="content-card-eyebrow">${eyebrow}</span>
      <h3>${title}</h3>
      <p>${summary}</p>
      ${metaMarkup}
      ${tagMarkup}
    </a>
  `;

  return article;
}

export function ContentGrid(items) {
  const grid = document.createElement("div");
  grid.className = "content-grid";
  grid.append(...items);
  return grid;
}
