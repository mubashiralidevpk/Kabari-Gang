# Kabari Gang — Android APK

The APK is a thin wrapper: it opens the live site (https://kabarigang.lovable.app)
and shows `mobile/www/index.html` only when the phone is offline.

## Build the APK on GitHub

1. Connect this project to GitHub (Lovable: **+** menu → GitHub → Connect).
2. In the repo, open **Actions → Build Android APK → Run workflow**.
   Optionally paste a different site URL.
3. When it finishes, download the `kabari-gang-apk` artifact and install
   `app-debug.apk` on your phone (allow "install unknown apps").

## Build locally

```bash
bun install
bunx cap add android
bunx cap sync android
cd android && ./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Files involved

- `capacitor.config.ts` — app name, ID `com.kabarigang.app`, site URL
- `mobile/www/index.html` — offline screen
- `.github/workflows/android.yml` — APK build workflow

For a Play Store release you need a signed build; add a keystore and switch
the Gradle task to `assembleRelease`.
