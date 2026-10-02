import React, { useState, useCallback } from 'react';
import ProductModal from './ProductModal';
import DateSearch from '../../components/DateSearch';
 
function ProductItem({ logs = [], onDelete, onProductUpdated, selectedDate, setSelectedDate }) {
  const [modalMode, setModalMode] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
 
  const openEditModal = (product) => { setSelectedProduct(product); setModalMode('edit'); };
  const openAddModal = () => { setSelectedProduct(null); setModalMode('add'); };
  const handleModalClose = () => { setModalMode(null); setSelectedProduct(null); };
  const handleProductUpdated = () => { handleModalClose(); if (onProductUpdated) onProductUpdated(); };
  const handleDateChange = useCallback((date) => { setSelectedDate(date); }, [setSelectedDate]);
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .pi-outer {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .pi-wrap {
          flex: 1;
          min-height: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          padding: 32px 20px 0;
          font-family: 'DM Sans', sans-serif;
          color: #f0ede8;
          max-width: 960px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .pi-bottom {
          flex-shrink: 0;
          padding: 16px 20px 24px;
          max-width: 960px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
          border-top: 1px solid #1e1e22;
          background: #0d0d0f;
        }
 
        .pi-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #f0ede8;
          margin-bottom: 16px;
          flex-shrink: 0;
        }
 
        .pi-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 4px;
          padding-bottom: 4px;
          min-height: 0;
        }

        .pi-list::-webkit-scrollbar { width: 4px; }
        .pi-list::-webkit-scrollbar-track { background: transparent; }
        .pi-list::-webkit-scrollbar-thumb { background: #2a2a30; border-radius: 2px; }
 
        .pi-item {
          background: #16161a;
          border: 1px solid #1e1e22;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          flex-shrink: 0;
        }
 
        .pi-item-name {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #f0ede8;
        }
 
        .pi-item-brand {
          font-size: 12px;
          color: #555;
          margin-bottom: 4px;
        }
 
        .pi-nutrients {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 4px;
        }
 
        .pi-nutrient {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
 
        .pi-nutrient-value {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #f0ede8;
          line-height: 1;
        }
 
        .pi-nutrient-value.accent { color: #c8f542; }
 
        .pi-nutrient-label {
          font-size: 10px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
 
        .pi-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
 
        .pi-btn {
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid #2a2a30;
          background: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          color: #888;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
 
        .pi-btn:hover { color: #f0ede8; border-color: #444; background: #1e1e22; }
        .pi-btn.danger:hover { color: #ef4444; border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.06); }
 
        .pi-add-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 16px 20px;
          background: #c8f542;
          color: #0d0d0f;
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
 
        .pi-add-btn:hover { background: #d4f55a; transform: translateY(-1px); }
        .pi-add-btn:active { transform: translateY(0); }
 
        .pi-add-icon {
          width: 26px;
          height: 26px;
          background: #0d0d0f;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #c8f542;
          flex-shrink: 0;
        }
 
        .pi-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #2a2a2f;
        }
 
        .pi-empty-icon { font-size: 36px; opacity: 0.4; }
 
        .pi-empty-text {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #3a3a40;
        }
      `}</style>

      <div className="pi-outer">
        <div className="pi-wrap">
          <div className="pi-title">Ostatnie produkty</div>
          <DateSearch selectedDate={selectedDate} onSearch={handleDateChange} />

          {logs.length === 0 ? (
            <div className="pi-empty">
              <div className="pi-empty-icon">🥗</div>
              <div className="pi-empty-text">Brak produktów na ten dzień</div>
            </div>
          ) : (
            <div className="pi-list">
              {logs.map((log) => (
                <div key={log.id} className="pi-item" style={log.isPeri ? { background: 'rgba(200,245,66,0.05)', border: '1px solid rgba(200,245,66,0.2)' } : undefined}>
                  <div className="pi-item-name" style={log.isPeri ? { color: '#c8f542' } : undefined}>{log.productName}</div>
                  {log.brands && <div className="pi-item-brand">{log.brands}</div>}
                  <div className="pi-nutrients">
                    <div className="pi-nutrient">
                      <span className="pi-nutrient-value accent">{parseFloat(log.energy).toFixed(0)}</span>
                      <span className="pi-nutrient-label">{log.energyUnit || 'kcal'}</span>
                    </div>
                    {!log.isPeri && (
                      <div className="pi-nutrient">
                        <span className="pi-nutrient-value">{log.grams} g</span>
                        <span className="pi-nutrient-label">ilość</span>
                      </div>
                    )}
                    <div className="pi-nutrient">
                      <span className="pi-nutrient-value">{parseFloat(log.proteins).toFixed(1)}</span>
                      <span className="pi-nutrient-label">białko</span>
                    </div>
                    <div className="pi-nutrient">
                      <span className="pi-nutrient-value">{parseFloat(log.fat).toFixed(1)}</span>
                      <span className="pi-nutrient-label">tłuszcz</span>
                    </div>
                    <div className="pi-nutrient">
                      <span className="pi-nutrient-value">{parseFloat(log.sugars).toFixed(1)}</span>
                      <span className="pi-nutrient-label">węgle</span>
                    </div>
                  </div>
                  {!log.isPeri && (
                    <div className="pi-actions">
                      <button className="pi-btn" onClick={() => openEditModal(log)}>Edytuj</button>
                      <button className="pi-btn danger" onClick={() => onDelete(log.id)}>Usuń</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pi-bottom">
          <button className="pi-add-btn" onClick={openAddModal}>
            <span className="pi-add-icon">+</span>
            Dodaj nowy produkt
          </button>
        </div>
      </div>
 
      {modalMode && (
        <ProductModal
          mode={modalMode}
          product={selectedProduct}
          onClose={handleModalClose}
          onUpdated={handleProductUpdated}
        />
      )}
    </>
  );
}
 
export default ProductItem;