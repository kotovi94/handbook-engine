import { validateRules } from "../src/data/rules/schema/validateRules.js";

const report = validateRules();

if (report.errors.length) {
  console.error("Rule validation failed:");
  report.errors.forEach((error) => console.error(`- ${error}`));
}

if (report.warnings.length) {
  console.warn("Rule validation warnings:");
  report.warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (!report.errors.length && !report.warnings.length) {
  console.log("Rule validation passed.");
}

if (!report.ok) {
  process.exit(1);
}
