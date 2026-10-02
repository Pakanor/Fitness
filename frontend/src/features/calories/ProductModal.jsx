import React, { useEffect } from 'react';
import ProductForm from './ProductForm';

function ProductModal({ product, mode, onClose, onUpdated }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      <style>{`
        .pm-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .pm-overlay {
          background: #16161a;
          border: 1px solid #1e1e22;
          border-radius: 16px;
          width: 600px;
          max-width: 100%;
          max-height: 85vh;
          overflow-y: auto;
          position: relative;
        }
        .pm-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: #555;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
          z-index: 10;
        }
        .pm-close:hover { color: #f0ede8; background: #1e1e22; }
      `}</style>

      <div className="pm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="pm-overlay">
          <button className="pm-close" onClick={onClose}>✕</button>
          <ProductForm
            mode={mode}
            initialData={product}
            onSuccess={() => { onUpdated(); onClose(); }}
          />
        </div>
      </div>
    </>
  );
}

export default ProductModal;