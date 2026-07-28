const FALLBACK_PRODUCTS = [
  { id: '1', name: 'Laptop Gamer Nitro 5', price: 24999, originalPrice: 28999, category: 'computo', rating: 4.5, reviews: 128, badge: 'Oferta', color: '#1e293b', image: '💻' },
  { id: '2', name: 'Mouse Inalambrico Pro', price: 899, originalPrice: 1199, category: 'accesorios', rating: 4.4, reviews: 312, badge: null, color: '#0891b2', image: '🖱️' },
  { id: '3', name: 'Teclado Mecanico RGB', price: 1899, originalPrice: null, category: 'accesorios', rating: 4.7, reviews: 203, badge: 'Mas vendido', color: '#4f46e5', image: '⌨️' },
  { id: '4', name: 'Audifonos Bluetooth ANC', price: 2499, originalPrice: 3299, category: 'audio', rating: 4.6, reviews: 167, badge: 'Nuevo', color: '#7c3aed', image: '🎧' },
  { id: '5', name: 'SSD 1TB NVMe M.2', price: 2199, originalPrice: null, category: 'computo', rating: 4.9, reviews: 421, badge: 'Oferta', color: '#2563eb', image: '💾' },
  { id: '6', name: 'Silla Gamer Ergonómica', price: 8499, originalPrice: 9999, category: 'muebles', rating: 4.8, reviews: 56, badge: 'Envio gratis', color: '#dc2626', image: '🪑' },
  { id: '7', name: 'Hub USB-C 7 en 1', price: 899, originalPrice: null, category: 'accesorios', rating: 4.6, reviews: 256, badge: 'Mas vendido', color: '#14b8a6', image: '🔌' },
  { id: '8', name: 'Monitor 27" 4K UHD', price: 8999, originalPrice: 10999, category: 'computo', rating: 4.3, reviews: 85, badge: null, color: '#334155', image: '🖥️' },
];

let localBasket = [];

async function tryFetch(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function getProducts(paramsStr) {
  const params = new URLSearchParams(paramsStr || '');
  const category = params.get('category');
  const search = params.get('search');

  let data = await tryFetch(`/products${paramsStr ? `?${paramsStr}` : ''}`);

  if (!data) {
    let fallback = FALLBACK_PRODUCTS;
    if (category && category !== 'todas') fallback = fallback.filter(p => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      fallback = fallback.filter(p => p.name.toLowerCase().includes(q));
    }
    return fallback;
  }

  if (search) {
    const q = search.toLowerCase();
    data = data.filter(p => p.name.toLowerCase().includes(q));
  }
  return data;
}

export async function getBasket() {
  const data = await tryFetch('/basket');
  return data || localBasket;
}

export async function addToBasket(product) {
  const existing = localBasket.find(item => item.productId === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    localBasket.push({
      id: String(Date.now()),
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  }

  try {
    await fetch('/basket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  } catch {}

  return localBasket;
}

export async function removeFromBasket(id) {
  localBasket = localBasket.filter(item => item.id !== id);
  try {
    await fetch(`/basket/${id}`, { method: 'DELETE' });
  } catch {}
}
