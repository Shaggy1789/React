import { useState, useEffect } from 'react';
import { getOrder } from '../api/ordersService';
import { downloadOrderPDF, printOrderReceipt } from '../utils/orderReceipt';
import { Download, Printer } from 'lucide-react';

export default function OrderDetail({ orderId, currentUser, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getOrder(orderId, currentUser)
      .then((data) => {
        setOrder(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [orderId, currentUser]);

  if (loading) return (
    <div className="status-container order-loading">
      <div className="spinner-lg" />
      <p>Cargando detalle del pedido...</p>
    </div>
  );
  if (error) return (
    <div className="status-container error">
      <span className="status-icon">⚠</span>
      <p className="status-msg error">Error: {error}</p>
    </div>
  );
  if (!order) return (
    <div className="status-container">
      <span className="status-icon">📦</span>
      <p>Pedido no encontrado</p>
    </div>
  );

  return (
    <section className="order-detail">
      <div className="order-detail-header">
        <h2>Pedido #{order.id}</h2>
        <div className="order-detail-actions">
          <button className="btn-pdf" onClick={() => downloadOrderPDF(order)}>
            <Download size={16} /> Descargar PDF
          </button>
          <button className="btn-pdf btn-pdf-print" onClick={() => printOrderReceipt(order)}>
            <Printer size={16} /> Imprimir comprobante
          </button>
          <button className="btn-back" onClick={onBack}>
            Volver a pedidos
          </button>
        </div>
      </div>

      <div className="order-detail-info">
        <div className="order-detail-meta">
          <span>Fecha:</span> {new Date(order.createdAt).toLocaleDateString()}
          <span>Usuario:</span> {order.userId || 'guest'}
          <span>Estado:</span> {order.statusName || order.status}
        </div>

        <div className="order-detail-items">
          {order.items.map((item, i) => (
            <div key={i} className="order-detail-item">
              <span className="order-detail-name">{item.name}</span>
              <span className="order-detail-qty">
                x {item.quantity || 1} -
                ${(item.price ?? 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="order-detail-total">
          <span className="order-detail-total-amount">Total:</span>
          <span className="order-detail-total-currency">${Number(order.total ?? 0).toLocaleString()}</span>
        </div>
      </div>
    </section>
  );
}