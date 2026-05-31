# Simple Talking Board Android App

This project wraps `index.html` in a native Android WebView so it can be installed from an APK.

## Build the installable APK

```powershell
& "$env:USERPROFILE\.gradle\wrapper\dists\gradle-8.10.2-bin\a04bxjujx95o3nb99gddekhwo\gradle-8.10.2\bin\gradle.bat" assembleDebug
```

The APK is written to:

```text
app/build/outputs/apk/debug/app-debug.apk
```

## Install on a connected Android device

```powershell
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

The debug APK is signed by Gradle and can be installed directly on an Android tablet with app installs from unknown sources enabled.
