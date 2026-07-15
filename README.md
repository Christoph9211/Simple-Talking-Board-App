# Simple Talking Board Android App

This project wraps `index.html` in a native Android WebView so it can be installed from an APK.

## Release 1.2 (versionCode 3)

This tablet release makes the Communication and Routine boards fit the onn 8-inch tablet without scrolling and improves touch reliability for small finger movements.

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

## Future updates on the same tablet

```powershell
.\gradlew.bat assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
adb shell dumpsys package com.simpletalkingboard.app | Select-String "versionCode|versionName"
```
