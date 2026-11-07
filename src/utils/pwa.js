// PWA helpers: install prompt (Android/desktop Chrome), iOS detection, Web Push subscription.

let deferredPrompt = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    emit();
  });
}

export const onPwaChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isAndroid = () => /android/i.test(navigator.userAgent);

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

export const canPromptInstall = () => !!deferredPrompt;

export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  emit();
  return outcome; // 'accepted' | 'dismissed'
}

// ── Push ──
const authHeaders = () => {
  const t = localStorage.getItem('content_planner_auth_token');
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function getRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration()) || navigator.serviceWorker.register('/sw.js');
}

/** 'unsupported' | 'needs-install' (iOS browser tab) | 'denied' | 'on' | 'off' */
export async function getPushState() {
  if (isIOS() && !isStandalone()) return 'needs-install';
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  return sub && Notification.permission === 'granted' ? 'on' : 'off';
}

/** Must be called from a user tap (required on iPhone). */
export async function enablePush() {
  if (!pushSupported()) throw new Error('This browser does not support notifications.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Notifications were blocked. Allow them in your browser/site settings.');
  const keyRes = await fetch('/api/push/public-key', { headers: authHeaders() });
  const { publicKey, enabled } = await keyRes.json();
  if (!enabled) throw new Error('Push is not configured on the server yet.');
  const reg = await getRegistration();
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
  }
  const res = await fetch('/api/push/subscribe', { method: 'POST', headers: authHeaders(), body: JSON.stringify(sub.toJSON()) });
  if (!res.ok) throw new Error('Could not register this device for notifications.');
  return true;
}

/** Re-link an existing subscription to the logged-in account (e.g. after switching users). */
export async function syncPushSubscription() {
  try {
    if (!pushSupported() || Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && (await reg.pushManager.getSubscription());
    if (sub) await fetch('/api/push/subscribe', { method: 'POST', headers: authHeaders(), body: JSON.stringify(sub.toJSON()) });
  } catch { /* ignore */ }
}

/** Call before logout so the next person on this device doesn't get this user's notifications. */
export async function unlinkPushSubscription() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const sub = reg && (await reg.pushManager.getSubscription());
    if (sub) {
      await fetch('/api/push/unsubscribe', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ endpoint: sub.endpoint }) });
      await sub.unsubscribe();
    }
  } catch { /* ignore */ }
}

export async function sendTestPush() {
  const r = await fetch('/api/push/test', { method: 'POST', headers: authHeaders() });
  return r.ok ? r.json() : null;
}
