import { builds } from "../data/content/builds.js";
import { classes, subclasses } from "../data/rules/index.js";
import { displayName, displayValue } from "./displayLabels.js";
import { compareVisibleName, sortByVisibleName } from "./sortUtils.js";

function byId(items) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

const classIndex = byId(classes);
const subclassIndex = byId(subclasses);
const buildIndex = byId(builds);

export const contentEngine = {
  getClasses() {
    return sortByVisibleName(classes.map((classData) => ({ ...classData, type: "class" })));
  },

  getClass(classId) {
    const classData = classIndex[classId];
    return classData ? { ...classData, type: "class" } : null;
  },

  getSubclasses() {
    return sortByVisibleName(subclasses.map((subclass) => enrichSubclass(subclass)));
  },

  getSubclass(subclassId) {
    const subclass = subclassIndex[subclassId];
    return subclass ? enrichSubclass(subclass) : null;
  },

  getSubclassesByClass(classId) {
    return subclasses
      .filter((subclass) => subclass.classId === classId)
      .map((subclass) => enrichSubclass(subclass))
      .sort(compareVisibleName);
  },

  getBuilds() {
    return sortByVisibleName(builds.map((build) => enrichBuild(build)));
  },

  getBuild(buildId) {
    const build = buildIndex[buildId];
    return build ? enrichBuild(build) : null;
  },

  getBuildsByClass(classId) {
    return builds
      .filter((build) => build.classId === classId)
      .map((build) => enrichBuild(build))
      .sort(compareVisibleName);
  },

  getBuildsBySubclass(subclassId) {
    return builds
      .filter((build) => build.subclassId === subclassId)
      .map((build) => enrichBuild(build))
      .sort(compareVisibleName);
  },

  getContentIndex() {
    return [
      ...this.getClasses(),
      ...this.getSubclasses(),
      ...this.getBuilds(),
    ];
  },

  searchContent({ query = "", type = "all", classId = "all" } = {}) {
    const normalizedQuery = normalize(query);

    return sortByVisibleName(this.getContentIndex().filter((item) => {
      const matchesType = type === "all" || item.type === type;
      const matchesClass = classId === "all" || item.id === classId || item.classId === classId;
      const searchableText = normalize([
        item.name,
        item.label,
        item.summary,
        item.role,
        displayValue(item.primaryAbility),
        item.primaryAbility,
        item.className,
        item.classLabel,
        item.subclassName,
        item.subclassLabel,
        item.source,
        ...(item.tags || []),
      ].join(" "));
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesType && matchesClass && matchesQuery;
    }));
  },
};

function enrichSubclass(subclass) {
  return {
    ...subclass,
    type: "subclass",
    className: classIndex[subclass.classId]?.name || "Unknown class",
    classLabel: displayName(classIndex[subclass.classId]) || "Clase desconocida",
    theme: classIndex[subclass.classId]?.theme || "theme-default",
  };
}

function enrichBuild(build) {
  const classData = classIndex[build.classId];
  const subclassData = subclassIndex[build.subclassId];

  return {
    ...build,
    type: "build",
    className: classData?.name || "Unknown class",
    classLabel: displayName(classData) || "Clase desconocida",
    subclassName: subclassData?.name || "No subclass",
    subclassLabel: displayName(subclassData) || "Sin subclase",
    theme: classData?.theme || "theme-default",
  };
}

function normalize(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
