import { useEffect, useState } from 'react';

type Toast = {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
};

let listeners: ((t: Toast) => void)[] = [];

export function pushToast(toast: Omit<Toast, 'id'>) {
  const t: Toast = { id: `${Date.now()}-${Math.random()}`, ...toast };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onPush = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 3000);
    };
    listeners.push(onPush);
    return () => {
      listeners = listeners.filter((l) => l !== onPush);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: t.type === 'error' ? '#fdecea' : t.type === 'success' ? '#edfced' : '#eef2ff',
            border: t.type === 'error' ? '1px solid #f5c2c0' : t.type === 'success' ? '1px solid #b7f0b7' : '1px solid #c7d2fe',
            color: t.type === 'error' ? '#611a15' : t.type === 'success' ? '#064e3b' : '#1e3a8a',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}


