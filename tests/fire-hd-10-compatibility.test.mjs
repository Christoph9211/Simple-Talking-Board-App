import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const gradle = read("../app/build.gradle");
const manifest = read("../app/src/main/AndroidManifest.xml");
const java = read("../app/src/main/java/com/simpletalkingboard/app/MainActivity.java");
const html = read("../index.html");
const readme = read("../README.md");

const minSdk = Number(gradle.match(/minSdk\s+(\d+)/)?.[1]);
assert(Number.isInteger(minSdk));
assert(minSdk <= 30, "Fire OS 8 / Android API 30 must meet the app's API floor");
assert.doesNotMatch(gradle, /maxSdk/);

assert.match(manifest, /<queries>[\s\S]*android\.intent\.action\.TTS_SERVICE[\s\S]*<\/queries>/);
assert.match(manifest, /android:screenOrientation="portrait"/);
assert.match(java, /SDK_INT\s*>=\s*android\.os\.Build\.VERSION_CODES\.R/);
assert.match(java, /WindowInsets\.Type\.statusBars\(\)\s*\|\s*WindowInsets\.Type\.navigationBars\(\)/);

assert.match(html, /body\s*\{[\s\S]*height:\s*100%;[\s\S]*height:\s*100dvh/);
assert.match(html, /\.parent-overlay\s*\{[\s\S]*top:\s*0;[\s\S]*right:\s*0;[\s\S]*bottom:\s*0;[\s\S]*left:\s*0;[\s\S]*inset:\s*0/);
assert.match(readme, /Fire HD 10 \(13th generation\)/i);
assert.match(readme, /Fire OS 8/i);

console.log("Fire HD 10 API 30, TTS visibility, fullscreen, and WebView fallback contracts are present.");
