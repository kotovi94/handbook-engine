import { classRegistry } from "../data/classes.js";
import { navigationSections } from "../data/navigation.js";
import { AppearancePage } from "../pages/AppearancePage.js";
import { BuildPage } from "../pages/BuildPage.js";
import { BuildsPage } from "../pages/BuildsPage.js";
import { CharacterSummaryPage } from "../pages/CharacterSummaryPage.js";
import { ClassPage } from "../pages/ClassPage.js";
import { ClassesPage } from "../pages/ClassesPage.js";
import { CreatorPage } from "../pages/CreatorPage.js";
import { HomePage } from "../pages/HomePage.js";
import { PrintSheetPage } from "../pages/PrintSheetPage.js";
import { SearchPage } from "../pages/SearchPage.js";
import { SubclassPage } from "../pages/SubclassPage.js";
import { SubclassesPage } from "../pages/SubclassesPage.js";
import { contentEngine } from "./contentEngine.js";

export function getInitialRoute() {
  return parseHashRoute(window.location.hash) || "creator";
}

export function parseHashRoute(hash) {
  return hash.replace(/^#\/?/, "") || "";
}

export function getRouteTheme(route) {
  const navItem = navigationSections
    .flatMap((section) => section.items)
    .find((item) => item.route === route);

  if (navItem?.theme) {
    return navItem.theme;
  }

  if (route.startsWith("class:")) {
    const classId = route.split(":")[1];
    return classRegistry[classId]?.theme || "theme-default";
  }

  if (route.startsWith("subclass:")) {
    const subclassId = route.split(":")[1];
    return contentEngine.getSubclass(subclassId)?.theme || "theme-default";
  }

  if (route.startsWith("build:")) {
    const buildId = route.split(":")[1];
    return contentEngine.getBuild(buildId)?.theme || "theme-default";
  }

  return "theme-default";
}

export function renderRoute(route) {
  if (route === "home") {
    return HomePage();
  }

  if (route === "creator") {
    return CreatorPage();
  }

  if (route.startsWith("creator:")) {
    return CreatorPage({ stepId: route.split(":")[1] });
  }

  if (route === "summary") {
    return CharacterSummaryPage();
  }

  if (route === "appearance") {
    return AppearancePage();
  }

  if (route === "print-sheet") {
    return PrintSheetPage();
  }

  if (route === "classes") {
    return ClassesPage();
  }

  if (route === "subclasses") {
    return SubclassesPage();
  }

  if (route === "builds") {
    return BuildsPage();
  }

  if (route === "search") {
    return SearchPage();
  }

  if (route.startsWith("class:")) {
    return ClassPage({ classId: route.split(":")[1] });
  }

  if (route.startsWith("subclass:")) {
    return SubclassPage({ subclassId: route.split(":")[1] });
  }

  if (route.startsWith("build:")) {
    return BuildPage({ buildId: route.split(":")[1] });
  }

  return HomePage();
}
