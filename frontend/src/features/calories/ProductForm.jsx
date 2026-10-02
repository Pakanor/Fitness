import React, { useState, useEffect } from 'react';
import { addProductLog, updateProductLog, searchProducts, calculated } from '../../api/productAPI';
import { toast } from '../../components/common/Toast';

function ProductForm({ mode = 'add', initialData = null, onSuccess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [grams, setGrams] = useState('');
  const [message, setMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [calculatedNutriments, setCalculatedNutriments] = useState(null);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const g = initialData.grams || 100;
      const n = {
        energy: initialData.energy * 100 / g, fat: initialData.fat * 100 / g,
        proteins: initialData.proteins * 100 / g, carbs: initialData.sugars * 100 / g,
        salt: initialData.salt * 100 / g, energyUnit: initialData.energyUnit,
      };
      setSelectedProduct({ ...initialData, nutriments: n });
      setGrams(initialData.grams);
      setCalculatedNutriments({ energy: initialData.energy, fat: initialData.fat, proteins: initialData.proteins, carbs: initialData.sugars, salt: initialData.salt, energyUnit: initialData.energyUnit });
    }
  }, [mode, initialData]);

  useEffect(() => {
    const fetch = async () => {
      if (selectedProduct && grams && !isNaN(grams)) {
        try { setCalculatedNutriments(await calculated(selectedProduct, parseFloat(grams))); }
        catch { setCalculatedNutriments(null); }
      } else { setCalculatedNutriments(null); }
    };
    fetch();
  }, [grams, selectedProduct]);

  useEffect(() => {
    const search = async () => {
      if (searchTerm.length > 2) {
        setIsSearching(true);
        try { setProducts(await searchProducts(searchTerm)); }
        catch { setProducts([]); }
        finally { setIsSearching(false); }
      } else { setProducts([]); }
    };
    const t = setTimeout(search, 1000);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !grams) { setMessage('Wybierz produkt i podaj wagę'); return; }
    if (!calculatedNutriments) { setMessage('Błąd: brak danych odżywczych'); return; }
    try {
      if (mode === 'add') {
        await addProductLog(selectedProduct, grams, selectedProduct.nutriments);
        toast("Produkt dodano!");
      } else {
        await updateProductLog({ ...initialData, grams: parseFloat(grams), energy: calculatedNutriments.energy, fat: calculatedNutriments.fat, carbs: calculatedNutriments.carbohydrates ?? calculatedNutriments.carbs ?? 0, proteins: calculatedNutriments.proteins, salt: calculatedNutriments.salt, energyUnit: calculatedNutriments.energyUnit });
        toast("Produkt zaktualizowano!");
      }
      onSuccess();
      if (mode === 'add') { setSearchTerm(''); setSelectedProduct(null); setGrams(''); setProducts([]); }
    } catch (error) { setMessage('Błąd podczas zapisu produktu'); console.error(error); }
  };

  const handleProductSelect = (product) => { setSelectedProduct(product); setSearchTerm(''); setProducts([]); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .pf-wrap { max-width: 560px; margin: 0 auto; padding: 32px 20px; font-family: 'DM Sans', sans-serif; color: #f0ede8; }
        .pf-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 24px; color: #f0ede8; }
        .pf-input { width: 100%; padding: 12px 14px; background: #16161a; border: 1px solid #2a2a30; border-radius: 10px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; box-sizing: border-box; margin-bottom: 12px; transition: border-color 0.15s; }
        .pf-input::placeholder { color: #444; }
        .pf-input:focus { border-color: #c8f542; }
        .pf-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #444; margin-bottom: 6px; display: block; font-weight: 500; }
        .pf-field { margin-bottom: 16px; }
        .pf-results { background: #16161a; border: 1px solid #1e1e22; border-radius: 10px; max-height: 220px; overflow-y: auto; margin-bottom: 16px; }
        .pf-result-item { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #1e1e22; transition: background 0.15s; }
        .pf-result-item:last-child { border-bottom: none; }
        .pf-result-item:hover { background: #1e1e22; }
        .pf-result-name { font-size: 14px; font-weight: 500; color: #f0ede8; margin-bottom: 2px; }
        .pf-result-meta { font-size: 11px; color: #555; }
        .pf-cards { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .pf-card { flex: 1; min-width: 200px; background: #16161a; border: 1px solid #1e1e22; border-radius: 12px; padding: 16px; }
        .pf-card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #444; margin-bottom: 12px; font-weight: 500; }
        .pf-card-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 600; color: #f0ede8; margin-bottom: 4px; }
        .pf-card-brand { font-size: 12px; color: #555; margin-bottom: 12px; }
        .pf-nutrients { display: flex; flex-direction: column; gap: 6px; }
        .pf-nutrient { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        .pf-nutrient-label { color: #666; }
        .pf-nutrient-value { font-family: 'Syne', sans-serif; font-weight: 600; color: #f0ede8; font-size: 14px; }
        .pf-nutrient-value.accent { color: #c8f542; }
        .pf-divider { height: 1px; background: #1e1e22; margin: 6px 0; }
        .pf-submit { width: 100%; padding: 16px; background: #c8f542; color: #0d0d0f; border: none; border-radius: 12px; font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.15s, transform 0.1s; margin-top: 8px; }
        .pf-submit:hover { background: #d4f55a; transform: translateY(-1px); }
        .pf-submit:active { transform: translateY(0); }
        .pf-submit:disabled { background: #1e1e22; color: #444; cursor: default; transform: none; }
        .pf-message { margin-top: 12px; padding: 12px 16px; border-radius: 10px; font-size: 13px; }
        .pf-message.error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; }
        .pf-message.success { background: rgba(200,245,66,0.08); border: 1px solid rgba(200,245,66,0.2); color: #c8f542; }
        .pf-spinner { display: flex; justify-content: center; padding: 12px 0; }
        .pf-spin { width: 22px; height: 22px; border: 2px solid #1e1e22; border-top-color: #c8f542; border-radius: 50%; animation: pf-spin 0.7s linear infinite; }
        @keyframes pf-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="pf-wrap">
        <div className="pf-title">{mode === 'add' ? 'Dodaj produkt' : 'Edytuj produkt'}</div>
        <form onSubmit={handleSubmit} noValidate>
          {mode === 'add' && (
            <div className="pf-field">
              <label className="pf-label">Wyszukaj produkt</label>
              <input className="pf-input" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); if (!e.target.value || e.target.value !== selectedProduct?.productName) setSelectedProduct(null); }} placeholder="Wpisz nazwę produktu (min. 3 znaki)..." autoComplete="off" />
            </div>
          )}

          {isSearching && <div className="pf-spinner"><div className="pf-spin" /></div>}

          {products.length > 0 && (
            <div className="pf-results">
              {products.map((product, index) => (
                <div key={product.code || index} className="pf-result-item" onClick={() => handleProductSelect(product)}>
                  <div className="pf-result-name">{product.productName || 'Nazwa nieznana'}</div>
                  <div className="pf-result-meta">{product.brands}{product.brands && product.code && ' · '}{product.code}</div>
                </div>
              ))}
            </div>
          )}

          <div className="pf-field">
            <label className="pf-label">Waga (gramy)</label>
            <input className="pf-input" type="number" value={grams} onChange={(e) => setGrams(e.target.value)} placeholder="np. 150" min={1} step={1} required />
          </div>

          {(selectedProduct || calculatedNutriments) && (
            <div className="pf-cards">
              {selectedProduct && (
                <div className="pf-card">
                  <div className="pf-card-title">Produkt · na 100g</div>
                  <div className="pf-card-name">{selectedProduct.productName || 'Nazwa nieznana'}</div>
                  {selectedProduct.brands && <div className="pf-card-brand">{selectedProduct.brands}</div>}
                  {selectedProduct.nutriments && (
                    <div className="pf-nutrients">
                      <div className="pf-divider" />
                      {[
                        { label: 'Kalorie', value: selectedProduct.nutriments.energy ? `${Math.round(selectedProduct.nutriments.energy)} ${selectedProduct.nutriments.energyUnit || ''}` : '—' },
                        { label: 'Białko', value: selectedProduct.nutriments.proteins != null ? `${parseFloat(selectedProduct.nutriments.proteins.toFixed(1))} g` : '—' },
                        { label: 'Tłuszcz', value: selectedProduct.nutriments.fat != null ? `${parseFloat(selectedProduct.nutriments.fat.toFixed(1))} g` : '—' },
                        { label: 'Węglowodany', value: selectedProduct.nutriments.carbs != null ? `${parseFloat(selectedProduct.nutriments.carbs.toFixed(1))} g` : '—' },
                        { label: 'Sól', value: selectedProduct.nutriments.salt != null ? `${parseFloat(selectedProduct.nutriments.salt.toFixed(1))} g` : '—' },
                      ].map(({ label, value }) => (
                        <div className="pf-nutrient" key={label}><span className="pf-nutrient-label">{label}</span><span className="pf-nutrient-value">{value}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {calculatedNutriments && (
                <div className="pf-card">
                  <div className="pf-card-title">Dla {grams}g</div>
                  <div className="pf-nutrients">
                    {[
                      { label: 'Kalorie', value: `${calculatedNutriments.energy} ${calculatedNutriments.energyUnit || ''}`, accent: true },
                      { label: 'Białko', value: `${calculatedNutriments.proteins} g` },
                      { label: 'Tłuszcz', value: `${calculatedNutriments.fat} g` },
                      { label: 'Węglowodany', value: `${calculatedNutriments.carbs} g` },
                    ].map(({ label, value, accent }) => (
                      <div className="pf-nutrient" key={label}><span className="pf-nutrient-label">{label}</span><span className={`pf-nutrient-value${accent ? ' accent' : ''}`}>{value}</span></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="pf-submit" disabled={!selectedProduct || !grams}>
            {mode === 'add' ? 'Dodaj produkt' : 'Zapisz zmiany'}
          </button>

          {message && <div className={`pf-message ${message.includes('Błąd') ? 'error' : 'success'}`}>{message}</div>}
        </form>
      </div>
    </>
  );
}

export default ProductForm;