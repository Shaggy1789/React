import { jsPDF } from 'jspdf';

export function downloadOrderPDF(order) {
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

  (order.items || []).forEach((item) => {
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
}

export function printOrderReceipt(order) {
  if (!order) return;
  const printWindow = window.open('', '_blank', 'width=600,height=800');
  if (!printWindow) return;
  const items = (order.items || [])
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
}