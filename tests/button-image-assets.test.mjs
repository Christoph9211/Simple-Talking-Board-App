import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(projectRoot, "assets", "button-images");
const manifest = JSON.parse(fs.readFileSync(path.join(assetRoot, "manifest.json"), "utf8"));
const gradle = fs.readFileSync(path.join(projectRoot, "app", "build.gradle"), "utf8");
const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");

const expectedKeys = [
  "more", "help", "stop", "allDone", "break", "eat", "drink", "bathroom",
  "yes", "no", "mom", "dad", "wakeUp", "getDressed", "school", "car",
  "play", "bath", "bed", "home", "cleanUp", "shoes", "snack", "outside"
];

assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.targetAssetCount, 24);
assert.deepEqual(manifest.assets.map(asset => asset.key).sort(), expectedKeys.sort());
assert.equal(new Set(manifest.assets.map(asset => asset.filename)).size, 24);

let totalFinalBytes = 0;
for (const asset of manifest.assets) {
  assert.match(asset.filename, /^[a-z0-9-]+\.png$/);
  assert.equal(asset.revision, 1);
  assert(asset.promptReference);
  assert(asset.visualConcept);

  if (asset.status !== "final") continue;

  const filePath = path.join(assetRoot, asset.filename);
  assert(fs.existsSync(filePath), `Missing final image for ${asset.key}: ${asset.filename}`);
  const png = fs.readFileSync(filePath);
  totalFinalBytes += png.byteLength;

  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.readUInt32BE(16), 512, `${asset.key} width`);
  assert.equal(png.readUInt32BE(20), 512, `${asset.key} height`);
  assert.equal(png[25], 6, `${asset.key} must use PNG RGBA color type`);
  assert.deepEqual(asset.dimensions, [512, 512]);
  assert.equal(crypto.createHash("sha256").update(png).digest("hex"), asset.sha256);
  assert.match(html, new RegExp(`${asset.key}: \\"button-images/${asset.filename.replace(".", "\\.")}\\"`));
}

assert(totalFinalBytes < 10 * 1024 * 1024, "Final image payload must remain below 10 MB");
assert.deepEqual(
  manifest.assets.filter(asset => asset.status === "awaiting-source").map(asset => asset.key),
  [],
  "All 24 image sources must be resolved for release"
);
assert.match(gradle, /from\(rootProject\.file\("assets\/button-images"\)\)/);
assert.match(gradle, /include "\*\.png"/);
assert.match(gradle, /include "manifest\.json"/);
assert.match(html, /dad: "button-images\/dad\.png"/);
assert.match(html, /<img src="\$\{source\}" alt="" aria-hidden="true" draggable="false" \/>/);
assert.equal((html.match(/imageKey: "eat"/g) || []).length, 2, "Eat must reuse one asset in both boards");
assert.doesNotMatch(html, /const icons\s*=/);
assert.doesNotMatch(html, /function svg\s*\(/);
assert.doesNotMatch(html, /item\.icon/);
assert.doesNotMatch(html, /<svg\b/i);

console.log(`Validated ${manifest.assets.filter(asset => asset.status === "final").length} final button images; ${totalFinalBytes} bytes packaged.`);
