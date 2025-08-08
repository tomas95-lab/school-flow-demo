import { db } from "@/firebaseConfig";
import type { Analytics, EventParams } from "firebase/analytics";
import { logEvent as firebaseLogEvent, getAnalytics, isSupported } from "firebase/analytics";
import { getApp } from "firebase/app";

let analyticsInstance: Analytics | null = null;

async function ensureAnalytics(): Promise<Analytics | null> {
  try {
    if (analyticsInstance) return analyticsInstance;
    if (!(import.meta as any).env.PROD) return null;
    if ((import.meta as any).env.VITE_ENABLE_ANALYTICS !== "true") return null;
    const supported = await isSupported();
    if (!supported) return null;
    // Ensure firebase app is initialized by importing any named export (db)
    void db; // side-effect to ensure module eval
    const appInstance = getApp();
    analyticsInstance = getAnalytics(appInstance);
    return analyticsInstance;
  } catch {
    return null;
  }
}

export function trackEvent(eventName: string, params?: EventParams): void {
  ensureAnalytics().then((inst) => {
    if (!inst) return;
    try {
      firebaseLogEvent(inst as Analytics, eventName, params);
    } catch {
      /* no-op */
    }
  });
}

export function trackPageView(path: string): void {
  trackEvent("page_view", { page_path: path });
}


