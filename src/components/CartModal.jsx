import { useState, useEffect } from 'react';
import { getBasket, removeFromBasket } from '../api/cartService';

export default function CartModal({ isOpen, onClose, refreshKey, onUpdate, onCreateOrder, currentUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchCart = () => {
    setLoading(true);
    getBasket(currentUser)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) fetchCart();
  }, [isOpen, refreshKey, currentUser]);

  const handleRemove = async (id) => {
    setRemoving(id);
    try {
      await removeFromBasket(id, currentUser);
      setItems(p => p.filter(i => i.id !== id));
      onUpdate?.();
    } catch { fetchCart(); }
    setRemoving(null);
  };

  const handleCheckout = async () => {
    if (items.length === 0 || creating) return;
    setCreating(true);
    try {
      await onCreateOrder?.(currentUser || 'eric');
    } finally {
      setCreating(false);
    }
  };

  const total = items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity || 1), 0);
  const count = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={e => e.stopPropagation()}>
        <div className="cart-drawer-header">
          <h2>Carrito de compras ({count})</h2>
          <button className="cart-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="cart-drawer-body">
          {loading ? (
            <div className="cart-empty-state">
              <div className="spinner" />
              <p>Cargando carrito...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="cart-empty-state">
              <span className="cart-empty-icon">🛒</span>
              <p>Tu carrito esta vacio</p>
              <span>Agrega productos para empezar a comprar</span>
            </div>
          ) : (
            <ul className="cart-drawer-list">
              {items.map(item => (
                <li key={item.id} className={`cart-drawer-item ${removing === item.id ? 'removing' : ''}`}>
                  <span className="cart-item-emoji">{item.image || '📦'}</span>
                  <div className="cart-item-info">
                    <span className="cart-item-title">{item.name}</span>
                    <span className="cart-item-meta">${(item.price ?? 0).toLocaleString()} x {item.quantity || 1}</span>
                  </div>
                  <span className="cart-item-subtotal">${((item.price ?? 0) * (item.quantity || 1)).toLocaleString()}</span>
                  <button className="btn-remove-sm" onClick={() => handleRemove(item.id)} disabled={removing === item.id}>
                    🗑
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="cart-drawer-footer">
          <div className="cart-total-row">
            <span>Total ({count} articulo{count !== 1 ? 's' : ''})</span>
            <strong>${total.toLocaleString()}</strong>
          </div>
          <div className="cart-checkout-user">
            <label htmlFor="checkout-user">Usuario para el pedido</label>
            <input
              id="checkout-user"
              type="text"
              value={currentUser || 'eric'}
              readOnly
              aria-label="Usuario para el pedido"
            />
          </div>
          <button
            className="btn-checkout"
            disabled={items.length === 0 || creating}
            onClick={handleCheckout}
          >
            {creating ? 'Creando pedido...' : `Ir a pagar — $${total.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
}