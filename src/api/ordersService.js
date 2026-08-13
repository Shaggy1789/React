import { tryFetch, CURRENT_USER, ORDERS_BASE } from './cartService';

const STATUS_LABELS = {
  0: 'pending',
  1: 'confirmed',
  2: 'cancelled',
};

const STATUS_NAMES = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

function mapOrder(order) {
  const statusNum = typeof order.status === 'number' ? order.status : 0;
  return {
    id: order.id,
    userId: order.customerId,
    customerId: order.customerId,
    createdAt: order.createdAt,
    status: STATUS_LABELS[statusNum] ?? 'pending',
    statusName: STATUS_NAMES[STATUS_LABELS[statusNum]] ?? order.status,
    subtotal: order.subtotal ?? 0,
    tax: order.tax ?? 0,
    total: order.total ?? 0,
    items: (order.items || []).map((item) => ({
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      price: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
  };
}

export async function getOrders(userId) {
  const user = userId || CURRENT_USER || 'guest';
  const data = await tryFetch(`${ORDERS_BASE}/api/orders/customer/${user}`);
  return (data && Array.isArray(data.orders) ? data.orders : []).map(mapOrder);
}

export async function getOrder(id, userId) {
  const data = await tryFetch(`${ORDERS_BASE}/api/orders/${id}`);
  if (!data) return null;
  const order = mapOrder(data.order || data);
  const expectedUser = userId || CURRENT_USER || 'guest';
  if (String(order.userId || '') !== expectedUser) return null;
  return order;
}

export async function createOrder(userId) {
  const user = userId || CURRENT_USER || 'guest';
  const orderData = {
    customerId: user,
    basketId: user,
    idempotencyKey: crypto.randomUUID(),
  };
  const data = await tryFetch(`${ORDERS_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!data || !data.orderId) throw new Error('No se pudo crear el pedido');
  return { id: data.orderId, status: 'pending', statusName: 'Pendiente' };
}

export async function updateOrderStatus(id, status) {
  return await tryFetch(`${ORDERS_BASE}/api/orders/${id}/status?newStatus=${status}`, {
    method: 'PATCH',
  });
}