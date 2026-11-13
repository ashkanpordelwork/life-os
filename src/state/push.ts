/** Browser push helpers. Push works on Android/desktop browsers, and on iPhone only when the app
 *  was added to the Home Screen (iOS 16.4+). */

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushSupport = 'ok' | 'needs-install' | 'unsupported' | 'not-configured';

export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

export function pushSupport(): PushSupport {
  if (!VAPID) return 'not-configured';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (ios && !isStandalone()) return 'needs-install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  return 'ok';
}

export function permission(): NotificationPermission | 'unsupported' {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
  } catch {
    return null;
  }
}

function keyBytes(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Ask for permission and subscribe. Returns the subscription keys, or the reason it failed. */
export async function subscribe(): Promise<{ endpoint: string; p256dh: string; auth: string } | 'denied' | 'failed'> {
  const result = await Notification.requestPermission();
  if (result !== 'granted') return 'denied';
  const reg = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready);
  try {
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(VAPID!) as BufferSource,
    }));
    const json = sub.toJSON();
    return { endpoint: sub.endpoint, p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' };
  } catch {
    return 'failed';
  }
}

export async function unsubscribe(): Promise<string | null> {
  const reg = await navigator.serviceWorker?.getRegistration(import.meta.env.BASE_URL);
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}

export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
