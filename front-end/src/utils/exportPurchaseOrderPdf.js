// front-end/src/utils/exportPurchaseOrderPdf.js

/**
 * Enterprise Purchase Order (PO) PDF / Print Document Generator
 * Generates an official, print-ready Purchase Order document for suppliers.
 */
export const exportPurchaseOrderPDF = (po) => {
  if (!po) return;

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    alert('Please allow popups to generate the Purchase Order document.');
    return;
  }

  const orderDate = po.createdAt
    ? new Date(po.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const expectedDate = po.expectedDeliveryDate
    ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Immediate / As Scheduled';

  const lineItemsHtml = (po.items || [])
    .map((line, idx) => {
      const item = line.item || {};
      const qty = Number(line.orderedQuantity || line.orderedUnits || 0);
      const unitPrice = Number(line.unitPurchasePrice || line.costPerPurchaseUnit || 0);
      const subtotal = Number(line.subtotal || line.totalPrice || qty * unitPrice);

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 10px 8px; text-align: center; color: #64748b; font-family: monospace;">${idx + 1}</td>
          <td style="padding: 10px 8px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 12px;">${item.name || 'Raw Material Item'}</div>
            <div style="font-size: 10px; font-family: monospace; color: #64748b; margin-top: 2px;">
              SKU: ${item.sku || 'N/A'} • Packing: 1 ${item.purchaseUnit || 'unit'} = ${item.conversionFactor || 1} ${item.recipeUnit || 'unit'}
            </div>
          </td>
          <td style="padding: 10px 8px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a; font-size: 12px;">
            ${qty.toLocaleString()} <span style="font-size: 10px; font-weight: 500; color: #64748b;">${item.purchaseUnit || 'units'}</span>
          </td>
          <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #334155;">
            Rs. ${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td style="padding: 10px 8px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">
            Rs. ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
        </tr>
      `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Purchase_Order_${po.poNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 14mm 12mm 14mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .info-block {
            flex: 1;
            padding: 12px 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <!-- Header & Branding -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 18px;">
          <div>
            <div style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #0f172a;">
              Burger O'Clock
            </div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">
              Central Operations & Supply Chain Division
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: 900; font-family: monospace; color: #0f172a; letter-spacing: 0.5px;">
              ${po.poNumber}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              Issue Date: <strong style="color: #0f172a;">${orderDate}</strong>
            </div>
            <div style="font-size: 11px; color: #64748b;">
              Status: <strong style="color: #047857; text-transform: uppercase;">${po.status || 'ORDERED'}</strong>
            </div>
          </div>
        </div>

        <!-- Vendor & Delivery Information -->
        <div style="display: flex; gap: 16px; margin-bottom: 20px;">
          <div class="info-block">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 6px;">
              Vendor / Supplier:
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">
              ${po.supplier?.name || 'Unassigned Supplier'}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">
              ${po.supplier?.email ? `Email: ${po.supplier.email}<br/>` : ''}
              ${po.supplier?.phone ? `Phone: ${po.supplier.phone}<br/>` : ''}
              Payment Terms: <strong style="color: #0f172a;">${po.supplier?.paymentTerms || po.paymentTerms || 'Standard Terms'}</strong>
            </div>
          </div>

          <div class="info-block">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 6px;">
              Ship / Deliver To:
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">
              ${po.branch?.name || po.destinationBranch?.name || 'Central Kitchen Outlet'}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">
              Location: <strong>${po.branch?.city || po.destinationBranch?.city || 'Karachi'}</strong><br/>
              ${(po.branch?.address || po.destinationBranch?.address) ? `Address: ${po.branch?.address || po.destinationBranch?.address}<br/>` : ''}
              Expected Delivery: <strong style="color: #0f172a;">${expectedDate}</strong>
            </div>
          </div>
        </div>

        <!-- Order Line Items Manifest -->
        <div style="margin-bottom: 20px;">
          <table>
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                <th style="padding: 8px; width: 5%; text-align: center;">#</th>
                <th style="padding: 8px; width: 45%; text-align: left;">Raw Material Description</th>
                <th style="padding: 8px; width: 16%; text-align: right;">Quantity</th>
                <th style="padding: 8px; width: 16%; text-align: right;">Agreed Rate</th>
                <th style="padding: 8px; width: 18%; text-align: right;">Subtotal (PKR)</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Valuation Summary & Special Instructions -->
        <div style="display: flex; gap: 16px; align-items: flex-start; margin-bottom: 28px;">
          <div style="flex: 1.2; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #92400e; letter-spacing: 0.5px; margin-bottom: 4px;">
              Order Instructions & Quality Standards:
            </div>
            <div style="font-size: 11px; color: #78350f;">
              ${po.notes ? po.notes : 'All items must meet food-grade safety standards. Cold-chain items must be delivered at verified temperatures.'}
            </div>
          </div>

          <div style="flex: 0.8; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px;">
              <span style="color: #64748b;">Subtotal:</span>
              <span style="font-family: monospace; font-weight: 700; color: #0f172a;">Rs. ${Number(po.totalAmount || po.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px;">
              <span style="color: #64748b;">Applicable Tax / GST:</span>
              <span style="font-family: monospace; font-weight: 700; color: #0f172a;">Included / Zero</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #cbd5e1; font-size: 13px;">
              <span style="font-weight: 800; color: #0f172a;">Total PO Value:</span>
              <span style="font-family: monospace; font-weight: 900; color: #0f172a;">Rs. ${Number(po.totalAmount || po.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <!-- Authorization Sign-off -->
        <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b;">
          <div>
            <div>Authorized Procurement Signature:</div>
            <div style="margin-top: 35px; border-top: 1px solid #0f172a; width: 180px; font-weight: 700; color: #0f172a; padding-top: 4px;">
              ${po.createdBy?.name || 'Supply Chain Manager'}
            </div>
          </div>

          <div style="text-align: right;">
            <div>Supplier Acknowledgment & Stamp:</div>
            <div style="margin-top: 35px; border-top: 1px dashed #94a3b8; width: 180px; padding-top: 4px;">
              Sign & Date
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};