export function CalculationBox({ title, value, formula }) {
  const box = document.createElement("article");
  box.className = "calculation-box";
  box.innerHTML = `
    <span>Cálculo</span>
    <h3>${title}</h3>
    <strong>${value}</strong>
    <p>${formula}</p>
  `;
  return box;
}

export function CalculationGrid(items) {
  const grid = document.createElement("div");
  grid.className = "calculation-grid";
  grid.append(...items.map((item) => CalculationBox(item)));
  return grid;
}
