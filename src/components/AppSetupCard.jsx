import React, { useEffect, useState } from 'react';
import { BellRing, Download, Share, PlusSquare, X, Check, Smartphone } from 'lucide-react';
import {
  isIOS, isStandalone, canPromptInstall, promptInstall, onPwaChange,
  getPushState, enablePush, sendTestPush,
} from '../utils/pwa';

const DISMISS_KEY = 'app_setup_dismissed_v1';

function IosSteps() {
  return (
    <ol className="space-y-2 text-xs text-slate-600">
      <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center">1</span>
        Open this site in <b>Safari</b>, then tap <Share className="w-4 h-4 inline text-blue-500" /> <b>Share</b></li>
      <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center">2</span>
        Choose <PlusSquare className="w-4 h-4 inline" /> <b>Add to Home Screen</b> → <b>Add</b></li>
      <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center">3</span>
        Open <b>Codexia Team</b> from your Home Screen and turn on notifications</li>
    </ol>
  );
}

/** Install-app + enable-notifications prompts. `variant="banner"` on the dashboard, `"panel"` inside menus. */
export default function AppSetupCard({ variant = 'banner', onToast, installOnly = false }) {
  const [, force] = useState(0);
  const [push, setPush] = useState('off');
  const [busy, setBusy] = useState(false);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => onPwaChange(() => force((n) => n + 1)), []);
  useEffect(() => { getPushState().then(setPush); }, []);

  const installed = isStandalone();
  const ios = isIOS();
  const showInstall = !installed && (canPromptInstall() || ios);
  const showPush = !installOnly && (push === 'off' || push === 'needs-install' || push === 'denied');

  const install = async () => {
    if (ios) { setShowIos((v) => !v); return; }
    const r = await promptInstall();
    if (r === 'accepted') onToast?.('App installed. Open it from your home screen.', 'success');
  };

  const turnOn = async () => {
    if (push === 'needs-install') { setShowIos(true); return; }
    setBusy(true);
    try {
      await enablePush();
      setPush('on');
      await sendTestPush();
      onToast?.('Notifications are on for this device.', 'success');
    } catch (e) {
      onToast?.(e.message, 'error');
      setPush(await getPushState());
    } finally { setBusy(false); }
  };

  if (variant === 'login') {
    if (!showInstall) return null;
    return (
      <div className="text-center">
        <button onClick={install} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15">
          <Download className="w-4 h-4" /> {ios ? 'Install on iPhone' : 'Install the app'}
        </button>
        {showIos && <div className="mt-3 rounded-xl bg-white p-3 text-left"><IosSteps /></div>}
      </div>
    );
  }
  if (variant === 'banner' && (dismissed || (!showInstall && !showPush))) return null;
  if (variant === 'panel' && !showInstall && !showPush && push !== 'on') return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  return (
    <div className={variant === 'banner'
      ? 'relative rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4 sm:p-5 shadow-sm'
      : 'p-3 border-b border-slate-100 bg-slate-50/60 space-y-2'}>
      {variant === 'banner' && (
        <button onClick={dismiss} aria-label="Dismiss" className="absolute right-2 top-2 p-1.5 rounded-lg text-slate-400 hover:bg-white/70 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      )}
      <div className={variant === 'banner' ? 'flex flex-col sm:flex-row sm:items-center gap-3 pr-6' : 'space-y-2'}>
        {variant === 'banner' && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0"><Smartphone className="w-5 h-5" /></span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900">Get Codexia Team on your phone</div>
              <div className="text-xs text-slate-600">Install the app and get task alerts as phone notifications.</div>
            </div>
          </div>
        )}
        <div className={variant === 'banner' ? 'grid grid-cols-2 sm:flex gap-2' : 'grid grid-cols-1 gap-2'}>
          {showInstall && (
            <button onClick={install} className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800">
              <Download className="w-4 h-4" /> {ios ? 'Install on iPhone' : 'Install app'}
            </button>
          )}
          {showPush && (
            <button onClick={turnOn} disabled={busy || push === 'denied'}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60">
              <BellRing className="w-4 h-4" /> {push === 'denied' ? 'Notifications blocked' : busy ? 'Enabling…' : 'Turn on notifications'}
            </button>
          )}
          {variant === 'panel' && push === 'on' && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><Check className="w-4 h-4" /> Phone notifications are on</div>
          )}
        </div>
      </div>
      {push === 'denied' && (
        <p className="mt-2 text-[11px] text-slate-500">Notifications are blocked for this site. Tap the lock icon next to the address (or the app's settings) → Notifications → Allow, then reload.</p>
      )}
      {showIos && <div className="mt-3 rounded-xl bg-white border border-slate-200 p-3"><IosSteps /></div>}
    </div>
  );
}
