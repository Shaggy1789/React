import { tryFetch, CATALOG_BASE } from './cartService';

export async function createProduct(product) {
  const payload = {
    name: product.name,
    description: product.description || '',
    category: product.category ? [product.category] : ['general'],
    imageFile: product.image || product.imageFile || '',
    price: product.price ?? 0,
  };
  return await tryFetch(`${CATALOG_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}