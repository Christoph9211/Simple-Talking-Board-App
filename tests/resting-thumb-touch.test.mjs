import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

for (const [, script] of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)) {
  new Function(script);
}

const touchHelperSource = html.match(
  /(const CHILD_TOUCH_EDGE_GUARD[\s\S]*?)(?=\s+function makeTile)/
)[1];

let now = 1000;
const touchApi = new Function("window", "Date", `
  ${touchHelperSource}
  return { bindChildPress };
`)({ innerWidth: 320 }, { now: () => now });

function makeElement({ tagName = "BUTTON", disabled = false } = {}) {
  const listeners = new Map();
  const classes = new Set();
  const element = {
    tagName,
    disabled,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    getAttribute() {
      return null;
    },
    getBoundingClientRect() {
      return { left: 0, right: 300, top: 0, bottom: 240 };
    },
    classList: {
      toggle(name, force) {
        if (force) classes.add(name);
        else classes.delete(name);
      }
    }
  };
  return { element, listeners, classes };
}

function touch(identifier, clientX, clientY = 100) {
  return { identifier, clientX, clientY };
}

function touchEvent(...changedTouches) {
  return {
    changedTouches,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    }
  };
}

function clickEvent(detail) {
  return {
    detail,
    defaultPrevented: false,
    immediatePropagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopImmediatePropagation() {
      this.immediatePropagationStopped = true;
    }
  };
}

{
  const { element, listeners, classes } = makeElement();
  let activations = 0;
  touchApi.bindChildPress(element, () => activations++);

  listeners.get("touchstart")(touchEvent(touch(1, 5)));
  assert(!classes.has("is-touch-pressing"), "edge thumb must not show pressed feedback");

  listeners.get("touchstart")(touchEvent(touch(2, 120)));
  assert(classes.has("is-touch-pressing"), "second finger must show pressed feedback");

  const intendedRelease = touchEvent(touch(2, 122));
  listeners.get("touchend")(intendedRelease);
  assert.equal(activations, 1, "second finger must activate while the edge thumb remains down");
  assert(intendedRelease.defaultPrevented, "valid touch must suppress the synthetic click");
  assert(!classes.has("is-touch-pressing"), "pressed feedback must clear after release");

  const syntheticClick = clickEvent(1);
  listeners.get("click")(syntheticClick);
  assert.equal(activations, 1, "synthetic click must not activate twice");
  assert(syntheticClick.immediatePropagationStopped);

  listeners.get("touchend")(touchEvent(touch(1, 5)));
  assert.equal(activations, 1, "lifting the ignored edge thumb must not activate");
  listeners.get("click")(clickEvent(1));
  assert.equal(activations, 1, "edge thumb synthetic click must remain ignored");

  now += 751;
  listeners.get("click")(clickEvent(1));
  assert.equal(activations, 2, "mouse click must remain available");
}

{
  const { element, listeners } = makeElement();
  let activations = 0;
  touchApi.bindChildPress(element, () => activations++);
  listeners.get("touchstart")(touchEvent(touch(3, 100)));
  listeners.get("touchmove")(touchEvent(touch(3, 133)));
  listeners.get("touchend")(touchEvent(touch(3, 133)));
  listeners.get("click")(clickEvent(1));
  assert.equal(activations, 0, "movement beyond 32 pixels must cancel activation");

  listeners.get("touchstart")(touchEvent(touch(4, 100)));
  listeners.get("touchend")(touchEvent(touch(4, 310)));
  listeners.get("click")(clickEvent(1));
  assert.equal(activations, 0, "release outside the control must not activate");

  listeners.get("touchstart")(touchEvent(touch(5, 100)));
  listeners.get("touchcancel")(touchEvent(touch(5, 100)));
  listeners.get("touchend")(touchEvent(touch(5, 100)));
  assert.equal(activations, 0, "cancelled touches must not activate");
}

{
  const { element, listeners } = makeElement({ disabled: true });
  let activations = 0;
  touchApi.bindChildPress(element, () => activations++);
  listeners.get("touchstart")(touchEvent(touch(6, 100)));
  listeners.get("touchend")(touchEvent(touch(6, 100)));
  listeners.get("click")(clickEvent(0));
  assert.equal(activations, 0, "disabled child controls must not activate");
}

{
  const { element, listeners } = makeElement({ tagName: "DIV" });
  let activations = 0;
  touchApi.bindChildPress(element, () => activations++);
  const keyboardEvent = {
    key: "Enter",
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    }
  };
  listeners.get("keydown")(keyboardEvent);
  assert.equal(activations, 1, "Enter must activate non-button child controls");
  assert(keyboardEvent.defaultPrevented);

  listeners.get("keydown")({
    key: " ",
    preventDefault() {}
  });
  assert.equal(activations, 2, "Space must activate non-button child controls");
}

assert.match(html, /bindChildPress\(button, \(\) => speak\(item\.phrase/);
assert.match(html, /bindChildPress\(button, \(\) => selectFirstThenChoice/);
assert.match(html, /document\.querySelectorAll\("\.nav-btn"\)[\s\S]*bindChildPress\(button/);
assert.match(html, /bindChildPress\(document\.getElementById\("repeatFirstThenBtn"\)/);
assert.match(html, /bindChildPress\(document\.getElementById\("firstBox"\)/);
assert.match(html, /bindChildPress\(document\.getElementById\("thenBox"\)/);

console.log("Resting edge thumbs do not block intended child-control touches.");
