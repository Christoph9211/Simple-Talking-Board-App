import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const gradle = read("../app/build.gradle");
const java = read("../app/src/main/java/com/simpletalkingboard/app/MainActivity.java");
const html = read("../index.html");
const readme = read("../README.md");

assert.match(gradle, /versionCode 3\b/);
assert.match(gradle, /versionName "1\.2"/);
assert.match(gradle, /minSdk 26\b/);
assert.match(gradle, /buildFeatures\s*\{[\s\S]*buildConfig true[\s\S]*\}/);
assert.match(java, /public String getBuildInfo\(\)[\s\S]*BuildConfig\.VERSION_NAME[\s\S]*BuildConfig\.VERSION_CODE/);
assert.match(java, /if \(voice\.isNetworkConnectionRequired\(\)\) score -= 250;/);
assert.match(html, /id="buildInfo"/);
assert.match(html, /window\.AndroidSpeech\.getBuildInfo\(\)/);
assert.match(readme, /Release 1\.2 \(versionCode 3\)/);
assert.match(readme, /\.\\gradlew\.bat assembleRelease/);
assert.doesNotMatch(readme, /\.gradle\\wrapper\\dists/);
assert.match(readme, /adb install -r app\/build\/outputs\/apk\/release\/app-release\.apk/);
assert.match(readme, /dumpsys package com\.simpletalkingboard\.app/);
assert(fs.existsSync(new URL("../gradlew.bat", import.meta.url)));

console.log("Release 1.2 metadata, parent build display, and tablet update commands are present.");
