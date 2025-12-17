import { useEffect } from 'react';
import { useToastStore, type Toast, DEFAULT_DURATION } from '../../stores/toastStore';
import {
  TOAST_MAX_STACK_SIZE,
  TOAST_ICON_SUCCESS,
  TOAST_ICON_ERROR,
  TOAST_ICON_INFO,
} from '../../constants/toast';
import './Toast.css';

function getIcon(type: Toast['type']) {
  if (type === 'success') return TOAST_ICON_SUCCESS;
  if (type === 'error') return TOAST_ICON_ERROR;
  return TOAST_ICON_INFO;
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  // Ensure we don't keep too many stacked toasts
  useEffect(() => {
    if (toasts.length <= TOAST_MAX_STACK_SIZE) return;
    // Remove oldest beyond max stack size
    const excess = toasts.length - TOAST_MAX_STACK_SIZE;
    const idsToRemove = toasts.slice(0, excess).map((t) => t.id);
    idsToRemove.forEach((id) => removeToast(id));
  }, [toasts, removeToast]);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <div className="toast-icon" aria-hidden="true">
            {getIcon(toast.type)}
          </div>
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            {toast.message && <div className="toast-message">{toast.message}</div>}
            <div
              className="toast-progress"
              style={{
                animationDuration: `${toast.duration ?? DEFAULT_DURATION}ms`,
                '--toast-duration': `${toast.duration ?? DEFAULT_DURATION}ms`,
              } as React.CSSProperties}
            />
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}


