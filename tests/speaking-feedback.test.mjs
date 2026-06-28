import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const java = fs.readFileSync(
  new URL("../app/src/main/java/com/simpletalkingboard/app/MainActivity.java", import.meta.url),
  "utf8"
);

for (const [, script] of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)) {
  new Function(script);
}

assert.doesNotMatch(html, /speakingFeedbackTimer|setTimeout\(\(\) => \s*\{\s*element\.classList\.remove\("is-speaking"\)/s);
assert.match(html, /utterance\.onend\s*=\s*\(\)\s*=>\s*finishSpeakingFeedback\(requestId\)/);
assert.match(html, /utterance\.onerror\s*=\s*\(\)\s*=>\s*finishSpeakingFeedback\(requestId\)/);
assert.match(html, /window\.onNativeSpeechFinished\s*=\s*finishSpeakingFeedback/);
assert.match(java, /setOnUtteranceProgressListener/);
assert.match(java, /onDone\(String utteranceId\)[\s\S]*notifySpeechFinished\(utteranceId\)/);
assert.match(java, /onError\(String utteranceId\)[\s\S]*notifySpeechFinished\(utteranceId\)/);

const feedbackFunctions = html.match(
  /(function finishSpeakingFeedback[\s\S]*?)(?=\s+function makeTile)/
)[1];
const feedback = new Function("document", "window", `
  let speechRequestId = 2;
  let speakingFeedbackElement = null;
  ${feedbackFunctions}
  return { finishSpeakingFeedback, showSpeakingFeedback };
`)({ querySelectorAll: () => [] }, {});
const classes = new Set();
const element = { classList: { add: value => classes.add(value), remove: value => classes.delete(value) } };

feedback.showSpeakingFeedback(element);
feedback.finishSpeakingFeedback("1");
assert(classes.has("is-speaking"), "stale completion must not clear current feedback");
feedback.finishSpeakingFeedback("2");
assert(!classes.has("is-speaking"), "current completion must clear feedback");

console.log("Speaking feedback follows browser and Android utterance completion.");
