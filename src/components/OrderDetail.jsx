import { useState, useEffect } from 'react';
import { getOrder } from '../api/ordersService';
import { jsPDF } from 'jspdf';
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

  const downloadPDF = () => {
    if (!order) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('TechStore', 14, 20);
    doc.setFontSize(12);
    doc.text('Comprobante de compra', 14, 30);
    doc.setFontSize(10);
    doc.text(`Pedido: #${order.id}`, 14, 40);
    doc.text(`Fecha: ${new Date(order.createdAt).toLocaleString()}`, 14, 46);
    doc.text(`Cliente: ${order.userId || 'guest'}`, 14, 52);
    doc.text(`Estado: ${order.statusName || order.status}`, 14, 58);

    let y = 70;
    doc.setFontSize(11);
    doc.text('Detalle', 14, y);
    y += 6;
    doc.setLineWidth(0.3);
    doc.line(14, y, 196, y);
    y += 6;

    order.items.forEach((item) => {
      const name = String(item.name || 'Producto').substring(0, 40);
      doc.text(`${name} x ${item.quantity}`, 14, y);
      doc.text(`$${Number(item.price ?? 0).toLocaleString()}`, 160, y);
      y += 6;
    });

    y += 4;
    doc.setLineWidth(0.3);
    doc.line(14, y, 196, y);
    y += 8;
    doc.text(`Subtotal: $${Number(order.subtotal ?? 0).toLocaleString()}`, 14, y);
    y += 6;
    doc.text(`IVA (16%): $${Number(order.tax ?? 0).toLocaleString()}`, 14, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Total: $${Number(order.total ?? 0).toLocaleString()}`, 14, y);

    doc.save(`comprobante-${order.id}.pdf`);
  };

  const printReceipt = () => {
    if (!order) return;
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) return;
    const items = order.items
      .map(
        (item) =>
          `<tr><td>${item.name || 'Producto'}</td><td>${item.quantity}</td><td>$${Number(item.price ?? 0).toLocaleString()}</td><td>$${Number((item.price ?? 0) * item.quantity).toLocaleString()}</td></tr>`
      )
      .join('');
    printWindow.document.write(`
      <html>
        <head>
          <title>Comprobante #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
            h1 { color: #6366f1; margin-bottom: 4px; }
            h3 { margin-top: 0; color: #64748b; font-weight: normal; }
            .meta { margin: 24px 0; font-size: 14px; line-height: 1.8; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            th { color: #64748b; font-weight: 600; }
            .totals { margin-top: 24px; font-size: 14px; line-height: 1.9; }
            .totals .total { font-size: 18px; font-weight: 700; color: #6366f1; }
          </style>
        </head>
        <body>
          <h1>TechStore</h1>
          <h3>Comprobante de compra</h3>
          <div class="meta">
            <div><strong>Pedido:</strong> #${order.id}</div>
            <div><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
            <div><strong>Cliente:</strong> ${order.userId || 'guest'}</div>
            <div><strong>Estado:</strong> ${order.statusName || order.status}</div>
          </div>
          <table>
            <thead>
              <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr>
            </thead>
            <tbody>${items}</tbody>
          </table>
          <div class="totals">
            <div>Subtotal: $${Number(order.subtotal ?? 0).toLocaleString()}</div>
            <div>IVA (16%): $${Number(order.tax ?? 0).toLocaleString()}</div>
            <div class="total">Total: $${Number(order.total ?? 0).toLocaleString()}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

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
          <button className="btn-pdf" onClick={downloadPDF}>
            <Download size={16} /> Descargar PDF
          </button>
          <button className="btn-pdf btn-pdf-print" onClick={printReceipt}>
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