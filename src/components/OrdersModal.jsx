import { useState, useEffect } from 'react';
import { getOrders } from '../api/ordersService';
import { downloadOrderPDF, printOrderReceipt } from '../utils/orderReceipt';
import { Download, Printer } from 'lucide-react';

const STATUS_BADGES = {
  pending: { label: 'Pendiente', color: '#f59e0b', bg: '#fff7e7', border: '#fbbf24' },
  confirmed: { label: 'Confirmado', color: '#10b981', bg: '#d1e7dd', border: '#84cc16' },
  cancelled: { label: 'Cancelado', color: '#6b7280', bg: '#fef2f3', border: '#d1d5db' },
};

function shortId(id) {
  if (!id) return '';
  return String(id).split('-')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OrdersModal({ isOpen, onClose, users, currentUser, onUserChange, refreshKey, onSelect }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getOrders(currentUser)
      .then((data) => {
        const seen = new Set();
        const filtered = (data || []).filter((o) => {
          if (seen.has(o.id)) return false;
          seen.add(o.id);
          return true;
        });
        setOrders(filtered);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [isOpen, currentUser, refreshKey]);

  const getStatusBadge = (status) => {
    const data = STATUS_BADGES[status] || STATUS_BADGES.pending;
    return (
      <span className={`order-status-badge badge-${status}`} style={{ color: data.color, backgroundColor: data.bg, borderColor: data.border }}>
        {data.label}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="orders-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pedidos</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">✕</button>
        </div>

        <div className="orders-modal-body">
          {users.length === 0 ? (
            <div className="status-container">
              <span className="status-icon">👤</span>
              <p>No hay usuarios disponibles</p>
            </div>
          ) : (
            <>
              <div className="orders-user-selector">
                <label htmlFor="orders-user-select">Usuario</label>
                <select
                  id="orders-user-select"
                  value={currentUser}
                  onChange={(e) => onUserChange(e.target.value)}
                >
                  {users.map((u) => (
                    <option key={u.id || u.name} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="status-container order-loading">
                  <div className="spinner-lg" />
                  <p>Cargando pedidos...</p>
                </div>
              ) : error ? (
                <div className="status-container error">
                  <span className="status-icon">⚠</span>
                  <p className="status-msg error">Error: {error}</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="status-container">
                  <span className="status-icon">📦</span>
                  <p>Este usuario no tiene pedidos</p>
                </div>
              ) : (
                <div className="orders-grid">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="order-card"
                      onClick={() => onSelect(order)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && onSelect(order)}
                    >
                      <div className="order-header">
                        <span className="order-id">#{shortId(order.id)}</span>
                        <span className="order-date">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="order-items">
                        {order.items.map((item, i) => (
                          <div key={i} className="order-item">
                            <span className="order-item-name">{item.name}</span>
                            <span className="order-item-qty">x {item.quantity || 1}</span>
                          </div>
                        ))}
                        {order.items.length === 0 && (
                          <span className="order-item-name">Sin items</span>
                        )}
                      </div>
                      <div className="order-total">
                        <span className="order-total-amount">${order.total.toLocaleString()}</span>
                        <span className="order-total-currency">MXN</span>
                      </div>
                      <div className="order-status-badge-container">
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="order-card-actions">
                        <button
                          className="btn-pdf btn-pdf-sm"
                          onClick={(e) => { e.stopPropagation(); downloadOrderPDF(order); }}
                        >
                          <Download size={14} /> Descargar PDF
                        </button>
                        <button
                          className="btn-pdf btn-pdf-print btn-pdf-sm"
                          onClick={(e) => { e.stopPropagation(); printOrderReceipt(order); }}
                        >
                          <Printer size={14} /> Imprimir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}