import type { CapacitorConfig } from "@capacitor/cli";

// Android wrapper for Kabari Gang. The APK loads the live site;
// mobile/www only holds the offline fallback page.
const config: CapacitorConfig = {
  appId: "com.kabarigang.app",
  appName: "Kabari Gang",
  webDir: "mobile/www",
  server: {
    url: process.env["KG_APP_URL"] ?? "https://kabarigang.lovable.app",
    androidScheme: "https",
  },
};

export default config;
