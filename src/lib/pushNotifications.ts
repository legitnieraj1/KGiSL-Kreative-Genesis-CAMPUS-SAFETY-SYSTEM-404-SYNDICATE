"use client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers not supported");
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker registered:", registration.scope);
    return registration;
  } catch (error) {
    console.error("SW registration failed:", error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return false;
  }
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      // Send to backend to ensure it's stored
      await saveSubscription(existingSub);
      return existingSub;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    // Save to backend
    await saveSubscription(subscription);
    return subscription;
  } catch (error) {
    console.error("Push subscription failed:", error);
    return null;
  }
}

async function saveSubscription(subscription: PushSubscription): Promise<void> {
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!response.ok) {
    throw new Error("Failed to save subscription");
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      // Remove from backend
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }
    return true;
  } catch (error) {
    console.error("Unsubscribe failed:", error);
    return false;
  }
}

export function isNotificationSupported(): boolean {
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}
