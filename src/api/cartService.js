async function handleResponse(res) {
  if (!res.ok) {
    const error = new Error(`Error ${res.status}: ${res.statusText}`);
    error.status = res.status;
    throw error;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function getProducts(query) {
  const qs = query ? `?${query}` : '';
  const res = await fetch(`/products${qs}`);
  return handleResponse(res);
}

export async function getBasket() {
  const res = await fetch('/basket');
  return handleResponse(res);
}

export async function addToBasket(product) {
  const res = await fetch('/basket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  return handleResponse(res);
}

export async function removeFromBasket(id) {
  const res = await fetch(`/basket/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}
