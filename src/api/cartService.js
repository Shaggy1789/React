export const CURRENT_USER = 'eric';
const USERNAME = CURRENT_USER;
const PAGE_SIZE = 100;

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

export { tryFetch };

export async function getProducts(paramsStr) {
  const params = new URLSearchParams(paramsStr || '');
  const category = params.get('category');
  const search = params.get('search');

  const data = await tryFetch(`/products?pageNumber=1&pageSize=${PAGE_SIZE}`);

  if (!data || !data.products || !Array.isArray(data.products.data)) {
    return [];
  }

  let list = data.products.data.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice ?? null,
    category: Array.isArray(p.category) ? p.category[0] || 'general' : p.category || 'general',
    rating: p.rating ?? 4.0,
    reviews: p.reviews ?? 0,
    badge: p.badge ?? null,
    color: p.color ?? '#64748b',
    image: p.imageFile || '📦',
    description: p.description || '',
  }));

  if (category && category !== 'todas') {
    list = list.filter((p) => p.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q));
  }
  return list;
}

export async function getBasket(userName = USERNAME) {
  const data = await tryFetch(`/basket/${userName}`);
  if (!data || !data.cart) return [];
  const cart = data.cart;
  return (cart.items || []).map((item) => ({
    id: item.productId,
    productId: item.productId,
    name: item.productName,
    price: item.price,
    quantity: item.quantity,
    color: item.color,
    image: item.color || '📦',
  }));
}

export async function saveBasket(userName, items) {
  return tryFetch('/basket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cart: {
        username: userName,
        items: items.map((i) => ({
          productId: i.productId ?? i.id,
          productName: i.name ?? i.productName,
          quantity: i.quantity || 1,
          price: i.price ?? 0,
          color: i.color || '',
        })),
      },
    }),
  });
}

export async function addToBasket(product, userName = USERNAME) {
  const items = await getBasket(userName);
  const existing = items.find((item) => String(item.productId) === String(product.id));
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      color: product.color || '',
      image: product.image || '📦',
    });
  }
  await saveBasket(userName, items);
  return items;
}

export async function removeFromBasket(id, userName = USERNAME) {
  const items = await getBasket(userName);
  const next = items.filter((item) => String(item.productId) !== String(id));
  await saveBasket(userName, next);
  return next;
}