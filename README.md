# Simple Talking Board Android App

This project wraps `index.html` in a native Android WebView so it can be installed from an APK.

## Release 1.3 (versionCode 4)

This release supports the Fire HD 10 (13th generation) on Fire OS 8 / Android 11 (API 30), while retaining the onn 8-inch tablet layout and touch behavior. It adds Android 11 package visibility for the Fire tablet's native text-to-speech engine and WebView fallbacks for the full-screen board and parent menu.

The app remains portrait-only by design. The Fire HD 10's 1920 x 1200, 16:10 display is handled by the responsive tablet grid without page scrolling on the Communication and Routine boards.

## Edit the board

Keep editing `index.html`. The Android build copies that single file into the WebView assets.

## Build the stable tablet APK

```powershell
.\gradlew.bat assembleRelease
```

The APK is written to:

```text
app/build/outputs/apk/release/app-release.apk
```

It is signed with `talking-board-sideload.keystore`. Keep that file; deleting or replacing it changes the signing certificate and breaks clean updates.

## First install or switch from the old debug APK

Android cannot update over an installed copy signed with a different key. If the tablet currently has the old app and `adb install -r` reports `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, uninstall once:

```powershell

adb install app/build/outputs/apk/release/app-release.apk
```

On a Fire HD 10, enable **Developer Options > USB debugging** before using `adb`. You can also copy `app-release.apk` to the tablet and open it there after allowing installation from that file source.

## Future updates on the same tablet

```powershell
.\gradlew.bat assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
adb shell dumpsys package com.simpletalkingboard.app | Select-String "versionCode|versionName"
```
