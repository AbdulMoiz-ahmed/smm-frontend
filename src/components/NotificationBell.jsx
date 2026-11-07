import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Megaphone, Send, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const POLL_MS = 30000;
const authHeaders = () => {
  const t = localStorage.getItem('content_planner_auth_token');
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

async function showSystemNotification(n) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    const opts = { body: n.message, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: n.id };
    if (reg) reg.showNotification(n.title, opts);
    else new Notification(n.title, opts);
  } catch { /* ignore */ }
}

function timeAgo(iso) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell() {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [composer, setComposer] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', roles: [] });
  const [sending, setSending] = useState(false);
  const seen = useRef(null);
  const boxRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (seen.current) {
        data.items.filter(n => !n.read && !seen.current.has(n.id)).slice(0, 3).forEach(showSystemNotification);
      }
      seen.current = new Set(data.items.map(n => n.id));
      setItems(data.items);
      setUnread(data.unread);
    } catch { /* offline */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    const id = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    const onVis = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [user, load]);

  useEffect(() => {
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggle = () => {
    setOpen(o => !o);
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  };

  const markAll = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST', headers: authHeaders() });
    load();
  };

  const markOne = async (n) => {
    if (n.read) return;
    await fetch(`/api/notifications/${encodeURIComponent(n.id)}/read`, { method: 'POST', headers: authHeaders() });
    load();
  };

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ title: form.title, message: form.message, roles: form.roles.length ? form.roles : null })
      });
      if (res.ok) { setComposer(false); setForm({ title: '', message: '', roles: [] }); }
    } finally { setSending(false); }
  };

  const ROLES = ['designer', 'copywriter', 'video_editor', 'smm', 'account_manager', 'custom'];

  return (
    <div className="relative" ref={boxRef}>
      <button onClick={toggle} className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors" title="Notifications" aria-label="Notifications">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-800">Notifications</span>
            <div className="flex items-center gap-1">
              {isAdmin && (
                <button onClick={() => setComposer(c => !c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-orange-600" title="Send announcement">
                  <Megaphone className="w-4 h-4" />
                </button>
              )}
              <button onClick={markAll} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="Mark all read">
                <CheckCheck className="w-4 h-4" />
              </button>
            </div>
          </div>

          {composer && isAdmin && (
            <form onSubmit={send} className="p-3 space-y-2 border-b border-slate-100 bg-orange-50/50 text-xs">
              <input required maxLength={120} placeholder="Title" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200" />
              <textarea required maxLength={1000} rows={3} placeholder="Message to the team" value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200" />
              <div className="flex flex-wrap gap-1">
                {ROLES.map(r => (
                  <button type="button" key={r}
                    onClick={() => setForm(f => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter(x => x !== r) : [...f.roles, r] }))}
                    className={`px-2 py-0.5 rounded-full border ${form.roles.includes(r) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-slate-200 text-slate-600'}`}>
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{form.roles.length ? `To: ${form.roles.length} role(s)` : 'To: everyone'}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setComposer(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
                  <button disabled={sending} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 text-white font-bold disabled:opacity-50">
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <div className="p-6 text-center text-xs text-slate-500">You're all caught up.</div>}
            {items.map(n => (
              <button key={n.id} onClick={() => markOne(n)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${n.read ? '' : 'bg-orange-50/60'}`}>
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{n.title}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5 break-words">{n.message}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{n.from} · {timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
