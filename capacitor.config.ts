import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Kabari Gang — Android wrapper.
 *
 * The web app is a server-rendered TanStack Start app, so the APK loads the
 * live deployment instead of bundling static files. Point KG_APP_URL at your
 * published site (GitHub Actions passes it in as a build variable), otherwise
 * the default below is used.
 *
 * `mobile/www` only holds the offline fallback screen shown when the phone
 * has no connection.
 */
const appUrl =
  process.env["KG_APP_URL"] ??
  "https://id-preview--a5da2c3e-4c22-41d5-b783-67732540ed0e.lovable.app";

const config: CapacitorConfig = {
  appId: "com.kabarigang.app",
  appName: "Kabari Gang",
  webDir: "mobile/www",
  android: {
    allowMixedContent: false,
  },
  server: {
    url: appUrl,
    androidScheme: "https",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#332F2C",
      androidSpinnerStyle: "small",
      spinnerColor: "#C2703F",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#332F2C",
    },
  },
};

export default config;
