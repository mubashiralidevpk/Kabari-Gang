# Kabari Gang — Android app (Capacitor)

The phone app is a Capacitor wrapper around the live Kabari Gang site. The site
is server-rendered, so the APK loads it over the network instead of bundling a
static copy. `mobile/www` only contains the offline screen.

## One-time setup

1. Push this project to GitHub (Lovable → GitHub → Connect project).
2. In GitHub: **Settings → Secrets and variables → Actions → Variables**, add
   `KG_APP_URL` with your published site URL, e.g.
   `https://kabarigang.lovable.app`.

## Getting an APK

- Go to the **Actions** tab → **Build Android APK** → **Run workflow**.
- When it finishes, download the `kabari-gang-debug-apk` artifact and install
  it on any Android phone (allow "install from unknown sources").

Every push to `main` also builds a debug APK automatically.

## Signed release APK (for Play Store / public distribution)

Create a keystore once:

```bash
keytool -genkey -v -keystore kabari.keystore -alias kabari \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 kabari.keystore   # copy the output
```

Add these GitHub **secrets**:

| Secret                      | Value                   |
| --------------------------- | ----------------------- |
| `ANDROID_KEYSTORE_BASE64`   | the base64 output above |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password       |
| `ANDROID_KEY_ALIAS`         | `kabari`                |
| `ANDROID_KEY_PASSWORD`      | key password            |

The workflow then also produces `kabari-gang-release-apk`.

## Building locally

```bash
bun install
bunx cap add android      # first time only
bunx cap sync android
cd android && ./gradlew assembleDebug
```

Requires Java 21 and the Android SDK. Output:
`android/app/build/outputs/apk/debug/app-debug.apk`.

## App identity

- App ID: `com.kabarigang.app`
- App name: Kabari Gang
- Change either in `capacitor.config.ts`, then re-run `bunx cap sync android`.
