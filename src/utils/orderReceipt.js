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

export function printOrdersReport(orders, user) {
  const list = Array.isArray(orders) ? orders : [];
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return false;

  const reportDate = new Date().toLocaleString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const orderBlocks = list
    .map((order) => {
      const items = (order.items || [])
        .map(
          (item) =>
            `<tr><td>${item.name || 'Producto'}</td><td>${item.quantity}</td><td>$${Number(item.price ?? 0).toLocaleString()}</td><td>$${Number((item.price ?? 0) * item.quantity).toLocaleString()}</td></tr>`
        )
        .join('');
      return `
        <section class="order-block">
          <div class="order-block-head">
            <div>
              <div class="order-block-title">Pedido #${order.id}</div>
              <div class="order-block-sub">${new Date(order.createdAt).toLocaleString('es-MX')}</div>
            </div>
            <span class="order-status">${order.statusName || order.status || 'Pendiente'}</span>
          </div>
          <div class="meta">
            <div><strong>Cliente:</strong> ${order.userId || order.customerId || 'guest'}</div>
            <div><strong>Estado:</strong> ${order.statusName || order.status || 'Pendiente'}</div>
          </div>
          <table>
            <thead>
              <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr>
            </thead>
            <tbody>${items || '<tr><td colspan="4">Sin items</td></tr>'}</tbody>
          </table>
          <div class="totals">
            <div>Subtotal: $${Number(order.subtotal ?? 0).toLocaleString()}</div>
            <div>IVA (16%): $${Number(order.tax ?? 0).toLocaleString()}</div>
            <div class="total">Total: $${Number(order.total ?? 0).toLocaleString()}</div>
          </div>
        </section>
      `;
    })
    .join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Historial de pedidos - ${user || ''}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; margin: 0; color: #1e293b; }
          .report { padding: 40px; }
          .report-head { border-bottom: 3px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px; }
          h1 { margin: 0 0 4px; color: #1e293b; font-size: 24px; }
          .report-sub { color: #64748b; margin: 0 0 12px; font-size: 13px; }
          .report-meta { font-size: 13px; line-height: 1.8; color: #334155; }
          .report-count { display: inline-block; margin-top: 12px; background: #eef2ff; color: #4338ca; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; }
          .order-block { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; page-break-inside: avoid; }
          .order-block + .order-block { page-break-before: auto; }
          .order-block-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
          .order-block-title { font-size: 15px; font-weight: 700; color: #1e293b; }
          .order-block-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
          .order-status { background: #f59e0b; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 8px; }
          .meta { font-size: 13px; line-height: 1.8; margin-bottom: 12px; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          th { color: #64748b; font-weight: 600; }
          .totals { margin-top: 16px; font-size: 13px; line-height: 1.9; text-align: right; }
          .totals .total { font-size: 16px; font-weight: 700; color: #1e293b; border-top: 2px solid #1e293b; padding-top: 6px; margin-top: 4px; }
          .no-orders { text-align: center; padding: 60px 0; color: #64748b; font-size: 16px; }
          @media print {
            body { margin: 0; }
            .report { padding: 20px; }
            .order-block { page-break-inside: avoid; }
            .order-block + .order-block { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="report-head">
            <h1>TechStore — Historial de pedidos</h1>
            <p class="report-sub">Reporte generado el ${reportDate}</p>
            <div class="report-meta">
              <div><strong>Usuario:</strong> ${user || '—'}</div>
              <div><strong>Total de pedidos:</strong> ${list.length}</div>
            </div>
          </div>
          ${
            list.length === 0
              ? '<div class="no-orders">No hay pedidos para imprimir.</div>'
              : orderBlocks
          }
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}