# Talking Board Button Image Overhaul

## Summary

- Work in [Simple Talking Board App](</C:/Users/chris/Documents/Simple Talking Board App>), not the current CleanCam workspace.
- Replace the 24 unique inline SVG button pictures with polished offline image assets while preserving labels, speech phrases, grids, touch behavior, First/Then reuse, and accessibility.
- Preserve the existing uncommitted Fire HD/version 1.3 work, then ship this overhaul as version 1.4/build 5 with a signed release APK.

## Creative and Asset System

- Open one Creative Production board and keep all proofs, revisions, and final previews there.
- Generate a four-image proof—More, Help, Drink, and Get dressed—using built-in ImageGen. Obtain approval before producing the remaining set.
- Use a shared prompt contract: `scientific-educational` AAC button image, literal friendly illustration, centered subject, strong silhouette, restrained colors, transparent background, generous padding, no text, logos, watermark, decorative scenery, or tiny details; readable at approximately 64 px.
- Use one consistent generic girl where a person is necessary: medium skin tone, dark hair, teal shirt, navy trousers, simple facial features.
- Export every final as an optimized 512×512 sRGB transparent PNG under `assets/button-images/`, with total image payload targeted below 10 MB.
- Create a manifest recording key, filename, label, visual concept, source type, dimensions, SHA-256, prompt/reference, and revision.

Visual assignments:

- Communication: More—ASL-style fingertips meeting; Help—ASL-style supporting-hand gesture; Stop—raised red-cued palm; All done—two hands turning outward; Break—girl seated calmly; Eat—girl eating a clear meal; Drink—cup with water and straw; Bathroom—toilet; Yes—green-cued affirmative gesture; No—red-cued negative gesture.
- Family: Mom and Dad—separate supplied photographs, identity-preserving head-and-shoulders cutouts with transparent backgrounds; no face, skin, hair, or clothing redesign.
- Routine: Wake up—girl sitting up in bed with morning sun; Get dressed—girl pulling on a shirt; School—school building with backpack; Car—clear side-profile car; Play—girl playing with blocks; Bath—bathtub with water and bubbles; Bed—bed and pillow. Eat reuses the Communication asset.
- First/Then additions: Home—house exterior; Clean up—girl putting toys into a bin; Shoes—pair of sneakers; Snack—apple and crackers; Outside—girl beside a tree under the sun.

## Integration and Interfaces

- In [index.html](</C:/Users/chris/Documents/Simple Talking Board App/index.html>), replace embedded SVG strings with a `boardImages` key-to-path manifest and change board items from inline `icon` markup to `imageKey`.
- Render local `<img>` elements with `alt=""`, `aria-hidden="true"`, and `draggable="false"` so the existing button label/`aria-label` remains the single functional name, consistent with [W3C functional-image guidance](https://www.w3.org/WAI/tutorials/images/functional/).
- Update styling only as needed for `object-fit: contain`, stable aspect ratio, and unclipped rendering; do not change tile dimensions, grid counts, scrolling, press feedback, or speech behavior.
- Update [app/build.gradle](</C:/Users/chris/Documents/Simple Talking Board App/app/build.gradle>) so the pre-build copy task packages `index.html` and the button-image directory into Android assets.
- Remove the superseded inline SVG definitions after every image key resolves. No external API, storage, TTS, signing identity, or Android package-name changes.

## Test and Release Plan

- Add an asset-contract test verifying all 24 keys resolve, files exist, PNGs are 512×512 with alpha, duplicate concepts reuse one asset, and no obsolete inline board SVGs remain.
- Re-run the five existing Node tests and confirm the Communication and Routine grids remain non-scrolling while First/Then retains its intended scrolling.
- Render screenshots at representative onn 8-inch and Fire HD 10 portrait sizes; verify every subject is distinguishable, centered, unclipped, and legible at actual tile size.
- Conduct an unlabeled recognition review with the caregiver and intended user, prioritizing Help, Stop, Bathroom, Yes, No, Mom, and Dad. AAC signoff remains manual because symbol choice and display needs are individualized, as noted by [ASHA’s AAC guidance](https://www.asha.org/practice-portal/professional-issues/augmentative-and-alternative-communication/).
- Bump metadata and documentation to version 1.4/build 5, build `assembleRelease`, verify the APK signature and packaged image assets, compute SHA-256, and report the signed APK path. Device installation is excluded unless separately requested.

## Assumptions

- The user will supply one clear Mom photo and one clear Dad photo before final production; there is no generic fallback.
- The approved four-image proof becomes the style anchor for every remaining illustration.
- Existing uncommitted version 1.3/Fire OS compatibility edits are preserved and extended rather than replaced.
- Execution requires switching the writable workspace to the Simple Talking Board project or granting write access to it.
