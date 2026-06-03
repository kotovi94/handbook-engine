import { ContentCard } from "../components/ContentCard.js";
import { displayName, displayValue } from "./displayLabels.js";

export function cardFromContent(item) {
  if (item.type === "class") {
    return ContentCard({
      title: displayName(item),
      eyebrow: "Clase",
      summary: item.summary,
      href: `#/class:${item.id}`,
      meta: [
        { label: "Rol", value: displayValue(item.role) },
        { label: "Atributo", value: displayValue(item.primaryAbility) },
      ],
    });
  }

  if (item.type === "subclass") {
    return ContentCard({
      title: displayName(item),
      eyebrow: item.classLabel || item.className,
      summary: item.summary,
      href: `#/subclass:${item.id}`,
      meta: [
        { label: "Tipo", value: "Subclase" },
        { label: "Nivel", value: item.unlockLevel },
      ],
    });
  }

  return ContentCard({
    title: displayName(item),
    eyebrow: `${item.classLabel || item.className} / ${item.subclassLabel || item.subclassName}`,
    summary: item.summary,
    href: `#/build:${item.id}`,
    tags: item.tags,
    meta: [{ label: "Tipo", value: "Build" }],
  });
}
