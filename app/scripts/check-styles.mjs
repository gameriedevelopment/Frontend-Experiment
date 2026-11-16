import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const sourceDir = join(root, "src");
const themeFile = "src/styles/theme.css";
const stylesheet = /\.(css|scss|sass|less|styl)$/;
const styleImport = /import\s+(?:[^'"]+\s+from\s+)?["']([^"']+\.(?:css|scss|sass|less|styl))["']/g;
const allowedImports = [/^@fontsource(-variable)?\//, /^\.\/styles\/theme\.css$/];

const problems = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    const file = relative(root, path);
    if (stylesheet.test(file) && file !== themeFile) {
      problems.push(`${file}: stylesheets are not allowed. Use Tailwind utilities, or add a token to ${themeFile}.`);
    }
    if (/\.(ts|tsx)$/.test(file)) {
      for (const [, target] of readFileSync(path, "utf8").matchAll(styleImport)) {
        if (!allowedImports.some((pattern) => pattern.test(target))) {
          problems.push(`${file}: imports "${target}". Only the theme and font packages may be imported as CSS.`);
        }
      }
    }
  }
}

walk(sourceDir);

if (problems.length) {
  console.error(`Tailwind-only check failed:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`);
  process.exit(1);
}
console.log("Tailwind-only check passed.");
