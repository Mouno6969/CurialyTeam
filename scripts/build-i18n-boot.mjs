// Generates public/i18n-boot.js from the locale sources.
//
// The boot script runs before the app bundle, so it cannot import the locales
// at runtime — it ships them pre-serialised. That makes the file a build
// artifact, and it silently went stale once: the app rendered corrected copy
// while this snapshot still served the old strings. Regenerating it on every
// build is what keeps the two in step.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "i18n-boot.js");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-boot-"));

/** Transpiles one source file into the temp dir, rewriting import aliases. */
function compile(relative, aliases = {}) {
  const source = fs.readFileSync(path.join(ROOT, relative), "utf8");
  let js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  for (const [from, to] of Object.entries(aliases)) {
    js = js.replaceAll(`"${from}"`, `"${to}"`).replaceAll(`'${from}'`, `'${to}'`);
  }

  const target = path.join(TMP, path.basename(relative).replace(/\.ts$/, ".mjs"));
  fs.writeFileSync(target, js);
  return target;
}

compile("src/lib/locales/en.ts");
compile("src/lib/locales/zh.ts");
const boot = compile("src/lib/i18n-boot.ts", {
  "@/lib/locales/en": "./en.mjs",
  "@/lib/locales/zh": "./zh.mjs",
});

const { i18nBootScript } = await import(pathToFileURL(boot).href);
fs.writeFileSync(OUT, i18nBootScript);
fs.rmSync(TMP, { recursive: true, force: true });

console.log(`i18n-boot.js regenerated (${i18nBootScript.length} bytes)`);
