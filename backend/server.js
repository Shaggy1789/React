import express from 'express';
import cors from 'cors';

const CATALOG_API = 'http://localhost:6000';

const app = express();
app.use(cors());
app.use(express.json());

let basket = [];
let basketIdCounter = 1;

app.get('/products', async (req, res) => {
  try {
    const { category, search } = req.query;

    let url;
    if (category && category !== 'todas') {
      url = `${CATALOG_API}/products/category/${encodeURIComponent(category)}`;
    } else {
      url = `${CATALOG_API}/products?pageNumber=1&pageSize=50`;
    }

    const resp = await fetch(url);
    const json = await resp.json();

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
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(502).json({ error: 'Failed to fetch products', detail: err.message });
  }
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

const PORT = process.env.PORT || 6060;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BFF running on port ${PORT} (products proxied to Catalog API)`);
});