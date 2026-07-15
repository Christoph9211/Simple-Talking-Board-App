import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const normalizedHtml = html.replace(/\r\n/g, "\n");

function cssRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = normalizedHtml.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  assert(match, `Missing CSS rule for ${selector}`);
  return match[1];
}

const documentRule = cssRule("html,\n    body");
const bodyRule = cssRule("\n\n    body");
const mainRule = cssRule("\n\n    main");
const mainGridRule = cssRule(".main-grid");
const routineGridRule = cssRule(".routine-grid");
const tileRule = cssRule(".tile");
const firstThenRule = cssRule("#firstThen.active");

assert.match(documentRule, /height:\s*100%/);
assert.match(documentRule, /overflow:\s*hidden/);
assert.match(bodyRule, /height:\s*100dvh/);
assert.match(mainRule, /min-height:\s*0/);
assert.match(mainRule, /overflow:\s*hidden/);

assert.match(mainGridRule, /grid-template-columns:\s*repeat\(3,/);
assert.match(mainGridRule, /grid-template-rows:\s*repeat\(4,/);
assert.match(routineGridRule, /grid-template-columns:\s*repeat\(2,/);
assert.match(routineGridRule, /grid-template-rows:\s*repeat\(4,/);

assert.match(tileRule, /touch-action:\s*none/);
assert.match(tileRule, /user-select:\s*none/);
assert.match(tileRule, /padding:\s*8px/);
assert.match(firstThenRule, /overflow-y:\s*auto/);

const communicationItems = html.match(/const communicationItems = \[([\s\S]*?)\n    \];/)[1];
const routineItems = html.match(/const routineItems = \[([\s\S]*?)\n    \];/)[1];
const extraFirstThenItems = html.match(/const extraFirstThenItems = \[([\s\S]*?)\n    \];/)[1];
const itemCount = source => [...source.matchAll(/\{ label:/g)].length;

assert.equal(itemCount(communicationItems), 12);
assert.equal(itemCount(routineItems), 8);
assert.equal(itemCount(extraFirstThenItems), 5);
assert.match(html, /\.\.\.routineItems\.filter\(item => !communicationItems\.some/);

console.log("Tablet grids, touch behavior, and First/Then scrolling follow the no-scroll layout contract.");
