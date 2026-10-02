import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

let toastFn = null;

export function toast(message, type = 'success') {
  if (toastFn) toastFn(message, type);
}

export function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    toastFn = addToast;
    return () => { toastFn = null; };
  }, [addToast]);

  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  return createPortal(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500&display=swap');

        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }

        .toast {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: #16161a;
          border: 1px solid #1e1e22;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          pointer-events: all;
          animation: toast-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          min-width: 240px;
          max-width: 360px;
        }

        @keyframes toast-in {
          from { opacity: 0; transform: translateX(24px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }

        .toast-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .toast-icon.success { background: rgba(200,245,66,0.12); color: #c8f542; }
        .toast-icon.error   { background: rgba(239,68,68,0.12);  color: #ef4444; }
        .toast-icon.info    { background: rgba(59,130,246,0.12); color: #60a5fa; }

        .toast-message {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #f0ede8;
          flex: 1;
        }

        .toast-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          border-radius: 0 0 12px 12px;
          animation: toast-bar 3s linear forwards;
        }

        .toast-bar.success { background: #c8f542; }
        .toast-bar.error   { background: #ef4444; }
        .toast-bar.info    { background: #60a5fa; }

        @keyframes toast-bar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className={`toast-icon ${t.type}`}>{icons[t.type]}</div>
            <div className="toast-message">{t.message}</div>
            <div className={`toast-bar ${t.type}`} />
          </div>
        ))}
      </div>
    </>,
    document.body
  );
}