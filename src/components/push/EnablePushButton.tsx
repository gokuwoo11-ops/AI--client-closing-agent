"use client";

import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export function EnablePushButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function enablePush() {
    setLoading(true);
    setMessage("");

    try {
      if (!("serviceWorker" in navigator)) {
        setMessage("This browser does not support service workers.");
        return;
      }

      if (!("PushManager" in window)) {
        setMessage("This browser does not support push notifications.");
        return;
      }

      if (!("Notification" in window)) {
        setMessage("This browser does not support notifications.");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        setMessage("VAPID public key is missing in .env.");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setMessage("Notification permission was not allowed.");
        return;
      }

      await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      const readyRegistration = await navigator.serviceWorker.ready;

      const existingSubscription =
        await readyRegistration.pushManager.getSubscription();

      const subscription =
        existingSubscription ||
        (await readyRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription }),
      });

      const payload = await response.json();

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Could not save push subscription.");
      }

      setMessage("Phone/browser notifications enabled.");
    } catch (error) {
      console.error("Enable push failed:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not enable notifications.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
      <button
        type="button"
        onClick={enablePush}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-black text-white transition hover:bg-indigo-400 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        Enable phone notifications
      </button>

      {message ? (
        <p className="mt-3 text-xs font-semibold text-white/60">{message}</p>
      ) : (
        <p className="mt-3 text-xs font-semibold text-white/40">
          Get notified when a new lead or booking comes in.
        </p>
      )}
    </div>
  );
}