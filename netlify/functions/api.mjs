/* Netlify Function unica que emula el backend de TechStore.
   Estado en memoria (module scope): persiste entre invocaciones de la misma
   instancia lambda, pero se reinicia cuando la funcion se enfria (cold start).
   Rutas soportadas:
     GET  /products                     -> lista de productos (pageNumber/pageSize ignorados)
     POST /products                     -> crear producto
     GET  /basket/:username             -> obtener carrito
     POST /basket                       -> guardar carrito  body { cart: { username, items } }
     GET  /api/users                    -> usuarios (distinct CustomerId)
     GET  /api/orders/customer/:user    -> pedidos del usuario
     GET  /api/orders/:id               -> pedido por id
     POST /api/orders                   -> crear pedido  body { customerId, basketId, idempotencyKey }
     PATCH /api/orders/:id/status       -> cambiar estado  query newStatus
*/

const SEED_PRODUCTS = [
  { id: 'prod-0001', name: 'Laptop Gamer Nitro 5', price: 24999, originalPrice: 28999, category: ['computo'], rating: 4.8, reviews: 320, badge: 'Hot', color: '#334155', imageFile: '💻', description: 'Laptop gamer de alto rendimiento con GPU dedicada.' },
  { id: 'prod-0002', name: 'Mouse Inalambrico', price: 899, originalPrice: null, category: ['accesorios'], rating: 4.5, reviews: 180, badge: null, color: '#64748b', imageFile: '🖱️', description: 'Mouse inalambrico ergonomico.' },
  { id: 'prod-0003', name: 'Audifonos Bluetooth', price: 1499, originalPrice: 1999, category: ['audio'], rating: 4.7, reviews: 245, badge: 'Oferta', color: '#3b82f6', imageFile: '🎧', description: 'Audifonos con cancelacion de ruido.' },
  { id: 'prod-0004', name: 'Teclado Mecanico RGB', price: 1299, originalPrice: null, category: ['accesorios'], rating: 4.6, reviews: 140, badge: null, color: '#8b5cf6', imageFile: '⌨️', description: 'Teclado mecanico con retroiluminacion RGB.' },
  { id: 'prod-0005', name: 'Monitor 27" 4K', price: 7999, originalPrice: 9499, category: ['computo'], rating: 4.9, reviews: 88, badge: 'Nuevo', color: '#0f172a', imageFile: '🖥️', description: 'Monitor UHD para productividad y gaming.' },
  { id: 'prod-0006', name: 'Silla Ergonómica', price: 5499, originalPrice: null, category: ['muebles'], rating: 4.4, reviews: 96, badge: null, color: '#b45309', imageFile: '🪑', description: 'Silla ergonomica con soporte lumbar.' },
  { id: 'prod-0007', name: 'Bocina Bluetooth', price: 999, originalPrice: 1299, category: ['audio'], rating: 4.3, reviews: 210, badge: 'Oferta', color: '#ef4444', imageFile: '🔉', description: 'Bocina portatil resistente al agua.' },
  { id: 'prod-0008', name: 'Webcam HD', price: 749, originalPrice: null, category: ['accesorios'], rating: 4.2, reviews: 65, badge: null, color: '#22c55e', imageFile: '📷', description: 'Webcam 1080p para videollamadas.' },
];

const SEED_ORDERS = [
  {
    id: 'ord-seed-0001',
    customerId: 'eric',
    createdAt: '2026-08-01T14:30:00.000Z',
    status: 0,
    items: [{ productId: 'prod-0001', productName: 'Laptop Gamer Nitro 5', quantity: 1, unitPrice: 24999, lineTotal: 24999 }],
    subtotal: 24999,
    tax: 3999.84,
    total: 28998.84,
    idempotencyKey: 'seed-eric-0001',
  },
  {
    id: 'ord-seed-0002',
    customerId: 'maria',
    createdAt: '2026-08-05T10:15:00.000Z',
    status: 1,
    items: [{ productId: 'prod-0003', productName: 'Audifonos Bluetooth', quantity: 2, unitPrice: 1499, lineTotal: 2998 }],
    subtotal: 2998,
    tax: 479.68,
    total: 3477.68,
    idempotencyKey: 'seed-maria-0002',
  },
];

let products = SEED_PRODUCTS.map((p) => ({ ...p }));
let baskets = {};
let orders = SEED_ORDERS.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) }));

function json(statusCode, payload) {
  return Response.json(payload, {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

function ok(payload) {
  return json(200, payload);
}

function notFound(message) {
  return json(404, { error: message });
}

function badRequest(message) {
  return json(400, { error: message });
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function handleProducts({ method, body }) {
  if (method === 'POST') {
    const newProduct = {
      id: `prod-${Date.now()}`,
      name: body.name || 'Producto nuevo',
      price: Number(body.price) || 0,
      originalPrice: body.originalPrice ?? null,
      category: Array.isArray(body.category) ? body.category : ['general'],
      rating: body.rating ?? 4.0,
      reviews: body.reviews ?? 0,
      badge: body.badge ?? null,
      color: body.color ?? '#64748b',
      imageFile: body.imageFile || body.image || '📦',
      description: body.description || '',
    };
    products.push(newProduct);
    return ok({ id: newProduct.id, ...newProduct });
  }

  // GET /products
  return ok({ products: { count: products.length, pageNumber: 1, pageSize: 100, data: products } });
}

function handleBasket({ method, pathname, body }) {
  const segments = pathname.split('/').filter(Boolean);

  if (method === 'POST') {
    const cart = body.cart || body;
    const username = cart?.username || 'guest';
    baskets[username] = Array.isArray(cart?.items) ? cart.items : [];
    return ok({ cart: { username, items: baskets[username] } });
  }

  if (method === 'GET') {
    const username = segments[1] || 'guest';
    return ok({ cart: { username, items: baskets[username] || [] } });
  }

  return notFound('Metodo no soportado en /basket');
}

function handleUsers() {
  const userIds = [...new Set([...orders.map((o) => o.customerId), 'eric', 'maria', 'carlos'])];
  return ok({ userIds });
}

function handleOrders({ method, pathname, searchParams, body }) {
  if (pathname === '/api/orders' && method === 'POST') {
    const customerId = body.customerId || 'guest';
    const basketId = body.basketId || customerId;
    const idempotencyKey = body.idempotencyKey;

    if (idempotencyKey) {
      const existing = orders.find((o) => o.idempotencyKey === idempotencyKey);
      if (existing) return ok({ orderId: existing.id });
    }

    const cart = baskets[basketId];
    if (!cart || cart.length === 0) {
      return badRequest('Basket vacio o no encontrado');
    }

    const items = cart.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity || 1,
      unitPrice: i.price ?? 0,
      lineTotal: round2((i.price ?? 0) * (i.quantity || 1)),
    }));
    const subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));
    const tax = round2(subtotal * 0.16);
    const total = round2(subtotal + tax);

    const order = {
      id: `ord-${crypto.randomUUID()}`,
      customerId,
      createdAt: new Date().toISOString(),
      status: 0,
      items,
      subtotal,
      tax,
      total,
      idempotencyKey,
    };
    orders.push(order);
    return ok({ orderId: order.id });
  }

  if (pathname === '/api/orders' && method === 'GET') {
    return ok({ orders });
  }

  const customerMatch = pathname.match(/^\/api\/orders\/customer\/(.+)$/);
  if (customerMatch) {
    const username = decodeURIComponent(customerMatch[1]);
    return ok({ orders: orders.filter((o) => o.customerId === username) });
  }

  const statusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    const order = orders.find((o) => o.id === statusMatch[1]);
    if (!order) return notFound('Pedido no encontrado');
    const newStatus = searchParams.get('newStatus');
    if (newStatus !== null) order.status = Number(newStatus);
    return ok({ success: true, id: order.id, status: order.status });
  }

  const idMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
  if (idMatch) {
    const order = orders.find((o) => o.id === idMatch[1]);
    if (!order) return notFound('Pedido no encontrado');
    return ok({ order });
  }

  return notFound('Ruta /api/orders no reconocida');
}

export default async function handler(request) {
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;
  const body = await request.json().catch(() => ({}));

  if (pathname === '/products' || pathname.startsWith('/products/')) {
    return handleProducts({ method, body });
  }
  if (pathname === '/basket' || pathname.startsWith('/basket/')) {
    return handleBasket({ method, pathname, body });
  }
  if (pathname === '/api/users') {
    return handleUsers();
  }
  if (pathname === '/api/orders' || pathname.startsWith('/api/orders/')) {
    return handleOrders({ method, pathname, searchParams, body });
  }

  return notFound('Ruta no encontrada en la funcion mock');
}