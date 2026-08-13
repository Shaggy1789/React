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
  const printWindow = window.open('', '_blank', 'width=500,height=800');
  if (!printWindow) return false;

  const reportDate = new Date().toLocaleString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const tickets = list
    .map((order) => {
      const items = (order.items || []);
      const totalProducts = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      const productRows = items
        .map((item) => {
          const name = String(item.name || 'Producto');
          const qty = Number(item.quantity) || 0;
          return `
            <div class="t-row">
              <span class="t-name">${name}</span>
              <span class="t-qty">${qty}</span>
            </div>
          `;
        })
        .join('');

      return `
        <section class="ticket">
          <div class="t-header">
            <div class="t-store">TechStore</div>
            <div class="t-title">COMPROBANTE DE COMPRA</div>
            <div class="t-meta">Pedido #${order.id}</div>
            <div class="t-meta">${new Date(order.createdAt).toLocaleString('es-MX')}</div>
            <div class="t-meta">Cliente: ${order.userId || order.customerId || 'guest'}</div>
          </div>

          <div class="t-divider"></div>

          <div class="t-colhead">
            <span>PRODUCTO</span>
            <span>CANT.</span>
          </div>

          ${productRows || '<div class="t-empty">Sin productos</div>'}

          <div class="t-divider"></div>

          <div class="t-total-row">
            <span>TOTAL DE PRODUCTOS:</span>
            <span>${totalProducts}</span>
          </div>
          <div class="t-total-row t-total">
            <span>TOTAL:</span>
            <span>$${Number(order.total ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div class="t-thanks">Gracias por su compra</div>
        </section>
      `;
    })
    .join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Comprobantes - ${user || ''}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; margin: 0; color: #111827; background: #fff; }
          .wrap { padding: 24px; }

          .ticket {
            width: 100%;
            max-width: 320px;
            margin: 0 auto 32px;
            background: #fff;
            padding: 20px 16px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            page-break-inside: avoid;
          }
          .ticket + .ticket { page-break-before: always; }

          .t-header { text-align: center; }
          .t-store { font-size: 20px; font-weight: 700; letter-spacing: 1px; }
          .t-title { font-size: 12px; font-weight: 700; letter-spacing: 2px; margin: 6px 0 12px; }
          .t-meta { font-size: 12px; line-height: 1.6; }

          .t-divider { border-top: 1px dashed #9ca3af; margin: 12px 0; }

          .t-colhead { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 6px; }

          .t-row { display: flex; justify-content: space-between; align-items: baseline; padding: 3px 0; font-size: 12px; }
          .t-name { text-align: left; }
          .t-qty { text-align: right; white-space: nowrap; }

          .t-total-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
          .t-total { font-size: 16px; font-weight: 700; }

          .t-empty { font-size: 12px; color: #6b7280; padding: 4px 0; }

          .t-thanks { text-align: center; margin-top: 14px; font-size: 12px; font-style: italic; }

          .no-orders { text-align: center; padding: 60px 0; color: #6b7280; font-size: 15px; }

          @media print {
            @page { margin: 10mm; }
            body { margin: 0; }
            .wrap { padding: 0; }
            .ticket {
              max-width: 100%;
              border: none;
              border-radius: 0;
              margin: 0 auto;
              page-break-inside: avoid;
            }
            .ticket + .ticket { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          ${
            list.length === 0
              ? '<div class="no-orders">No hay pedidos para imprimir.</div>'
              : tickets
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