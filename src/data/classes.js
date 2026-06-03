import { classes } from "./rules/index.js";

export const classRegistry = Object.fromEntries(classes.map((classData) => [classData.id, classData]));
