import express from 'express';
import cors from 'cors';
import http from 'http';

const CATALOG_API = 'http://localhost:6000';

const app = express();
app.use(cors());
app.use(express.json());

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

let basket = [];
let basketIdCounter = 1;

let products = [];
let productIdCounter = 1;

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => data += chunk);
      resp.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('JSON parse error')); }
      });
    }).on('error', reject);
  });
}

app.get('/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    let path;
    if (category && category !== 'todas') {
      path = `/products/category/${encodeURIComponent(category)}`;
    } else {
      path = '/products?pageNumber=1&pageSize=50';
    }

    const json = await httpGet(`http://localhost:6000${path}`);

    let list = [];
    if (json?.products?.data) list = json.products.data;
    else if (json?.products && Array.isArray(json.products)) list = json.products;
    else if (Array.isArray(json)) list = json;

    let mapped = list.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice || null,
      category: Array.isArray(p.category) ? p.category[0] || 'general' : p.category || 'general',
      rating: p.rating || 4.0,
      reviews: p.reviews || 0,
      badge: p.badge || null,
      color: p.color || '#64748b',
      image: p.imageFile || p.image || '',
    }));

    if (search) {
      const q = search.toLowerCase();
      mapped = mapped.filter(p => p.name.toLowerCase().includes(q));
    }

    res.json(mapped);
  } catch {
    let fallback = FALLBACK_PRODUCTS;
    const { category, search } = req.query;
    if (category && category !== 'todas') fallback = fallback.filter(p => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      fallback = fallback.filter(p => p.name.toLowerCase().includes(q));
    }
    res.json(fallback);
  }
});

app.post('/products', (req, res) => {
  const { name, price, originalPrice, category, image, badge, rating, reviews } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ message: 'Name and price are required' });
  }
  const product = {
    id: String(productIdCounter++),
    name,
    price,
    originalPrice: originalPrice !== undefined ? originalPrice : null,
    category: category || 'general',
    rating: rating !== undefined ? rating : 0,
    reviews: reviews !== undefined ? reviews : 0,
    badge: badge || null,
    color: image ? '#1e293b' : '#64748b',
    image: image || '',
  };
  products.push(product);
  res.status(201).json(product);
});

app.get('/basket', (req, res) => {
  res.json(basket);
});

app.post('/basket', (req, res) => {
  const product = req.body;
  const existing = basket.find(item => item.productId === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    basket.push({
      id: String(basketIdCounter++),
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  }
  res.status(201).json(basket);
});

app.delete('/basket/:id', (req, res) => {
  basket = basket.filter((item) => item.id !== req.params.id);
  res.status(204).send();
});

let orders = [];
let orderIdCounter = 1;

app.get('/orders', (req, res) => {
  const userId = req.query.userId;
  let list = orders;
  if (userId) {
    list = list.filter(o => o.userId === userId);
  }
  res.json(list);
});

app.get('/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

app.post('/orders', (req, res) => {
  const { userId, items, total } = req.body;
  const order = {
    id: String(orderIdCounter++),
    userId: userId || 'guest',
    items: items || [],
    total: total || 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  res.status(201).json(order);
});

app.put('/orders/:id/status', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (order) {
    order.status = req.body.status;
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

const PORT = process.env.PORT || 6060;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BFF running on port ${PORT} (products proxied to Catalog API)`);
});