export function Stepper({ steps, activeStepId, onStepSelect }) {
  const nav = document.createElement("nav");
  nav.className = "stepper";
  nav.setAttribute("aria-label", "Pasos de creación");

  steps.forEach((step, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = step.id === activeStepId ? "stepper-item is-active" : "stepper-item";
    button.innerHTML = `
      <span>${index + 1}</span>
      <strong>${step.label}</strong>
    `;
    button.addEventListener("click", () => onStepSelect(step.id));
    nav.append(button);
  });

  return nav;
}
