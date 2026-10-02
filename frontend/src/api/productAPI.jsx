const API_URL = 'http://localhost:8000/api/ProductsOperation';
const BASE_URL = 'http://localhost:8000/api/CalorieCalculator';

export async function getRecentLogs(date = new Date().toISOString().split("T")[0]) {
  const url = date ? `${API_URL}/recent?date=${date}` : `${API_URL}/recent`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    console.error('Błąd pobierania:', res.status, res.statusText);
    return { logs: [], totals: null }; 
  }

  const data = await res.json();
  return data;
}


export async function deleteProductLog(id) {
  const res = await fetch(`${API_URL}/delete/${id}`, { 
    method: 'DELETE',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Błąd usuwania');
  return await res.text();
}

export async function updateProductLog(updatedEntry) {
  const res = await fetch(`${API_URL}/update`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedEntry),
  });
  if (!res.ok) throw new Error('Błąd aktualizacji');
  return await res.text();
}

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    console.warn('safeJson parse failed, returning null', err);
    return null;
  }
}

export async function searchProducts(query, options = {}) {
  const url = `${API_URL}/search?query=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('searchProducts failed', res.status, errText);
    throw new Error('Błąd wyszukiwania produktów');
  }

  const data = await safeJson(res);
  return Array.isArray(data) ? data : [];
}

export async function addProductLog(product, grams, nutriments) {
  const body = {
    product: {
      productName: product.productName,
      brands: product.brands,
      nutriments: {
        energy: nutriments.energy,
  energyUnit: nutriments.energyUnit ?? "kJ", 
        fat: nutriments.fat,
        carbs: nutriments.carbs,          
        proteins: nutriments.proteins,
        salt: nutriments.salt
      }
    },
    grams: parseFloat(grams)
  };


  const res = await fetch(`${API_URL}/add`, {
    method: "POST",
    credentials: 'include',
    headers: {
    "Content-Type": "application/json",
  },    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Błąd dodawania produktu:", errorText);
    throw new Error("Błąd dodawania produktu");
  }

  return await res.text();
}


export async function calculated(selectedProduct, grams) {
  const response = await fetch(`${BASE_URL}/calculate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product: selectedProduct,
      grams: parseFloat(grams),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Błąd kalkulatora: ${errorText}`);
  }

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error('Błąd parsowania odpowiedzi kalkulatora');
  }
}

