// front-end/src/utils/exportLedgerPdf.js

/**
 * Enterprise Stock Audit Ledger PDF / Print Report Generator
 * Renders a self-contained, print-optimized document and triggers browser print/PDF save.
 */
export const exportLedgerPDF = ({
  ledgerData = [],
  branchName = 'All Outlets (Consolidated)',
  materialFilter = 'All Raw Materials',
  eventTypeFilter = 'All Transactions',
  metrics = { totalDepletedQty: 0, totalWasteLoss: 0, totalInwardVal: 0 },
}) => {
  if (!ledgerData || !ledgerData.length) return;

  const printWindow = window.open('', '_blank', 'width=1100,height=850');
  if (!printWindow) {
    alert('Please allow popups to generate the PDF report.');
    return;
  }

  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const generatedTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const rowsHtml = ledgerData
    .map((record, index) => {
      const isNeg = Number(record.quantityChanged) < 0;
      const formattedDate = record.createdAt
        ? new Date(record.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : 'N/A';
      const formattedTime = record.createdAt
        ? new Date(record.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';

      const typeLabels = {
        SALE_OUTWARD: { label: 'Sale Consumption', color: '#1d4ed8', bg: '#eff6ff' },
        SALE_RETURN: { label: 'Order Return', color: '#0891b2', bg: '#ecfeff' },
        PURCHASE_INWARD: { label: 'Stock Inward', color: '#047857', bg: '#ecfdf5' },
        SPOILAGE_WASTE: { label: 'Kitchen Spoilage', color: '#b91c1c', bg: '#fef2f2' },
        PHYSICAL_AUDIT_ADJUSTMENT: { label: 'Audit Adjustment', color: '#7e22ce', bg: '#faf5ff' },
        TRANSFER_OUT: { label: 'Transfer Out', color: '#c2410c', bg: '#fff7ed' },
        TRANSFER_IN: { label: 'Transfer In', color: '#b45309', bg: '#fffbeb' },
      };

      const tag = typeLabels[record.type] || {
        label: record.type,
        color: '#475569',
        bg: '#f1f5f9',
      };

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 7px 8px; text-align: center; color: #94a3b8; font-family: monospace;">${index + 1}</td>
          <td style="padding: 7px 8px; white-space: nowrap;">
            <div style="font-weight: 700; color: #0f172a;">${formattedDate}</div>
            <div style="font-size: 9.5px; color: #64748b;">${formattedTime}</div>
          </td>
          <td style="padding: 7px 8px;">
            <div style="font-weight: 700; color: #0f172a;">${record.item?.name || 'Raw Ingredient'}</div>
            <div style="font-size: 9.5px; font-family: monospace; color: #64748b;">SKU: ${record.item?.sku || 'N/A'} • ${record.branch?.name || 'Central'}</div>
          </td>
          <td style="padding: 7px 8px;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 700; color: ${tag.color}; background-color: ${tag.bg};">
              ${tag.label}
            </span>
          </td>
          <td style="padding: 7px 8px; text-align: right; font-family: monospace; font-weight: 700; color: ${isNeg ? '#dc2626' : '#16a34a'};">
            ${isNeg ? '' : '+'}${record.quantityChanged} ${record.item?.recipeUnit || ''}
          </td>
          <td style="padding: 7px 8px; text-align: center; font-family: monospace; color: #334155; white-space: nowrap;">
            <span style="color: #94a3b8;">${record.previousStock}</span>
            <span style="color: #cbd5e1; margin: 0 3px;">→</span>
            <strong>${record.newStock} ${record.item?.recipeUnit || ''}</strong>
          </td>
          <td style="padding: 7px 8px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">
            Rs. ${Number(record.totalMonetaryValue || 0).toLocaleString()}
          </td>
          <td style="padding: 7px 8px; color: #475569; font-size: 10px; max-width: 170px;">
            <div>${record.notes || '—'}</div>
            <div style="font-size: 9px; color: #94a3b8; margin-top: 1px;">By: ${record.performedBy?.name || 'Automated Engine'}</div>
          </td>
        </tr>
      `;
    })
    .join('');

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Stock_Audit_Ledger_Report</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 10mm 12mm 10mm;
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
            padding: 16px;
            font-size: 12px;
            line-height: 1.4;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .kpi-card {
            flex: 1;
            padding: 10px 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <!-- Header / Corporate Banner -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px;">
          <div>
            <div style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #0f172a;">
              Stock Audit & Inventory Ledger
            </div>
            <div style="font-size: 11px; color: #475569; font-weight: 500; margin-top: 2px;">
              Enterprise Supply Chain & Kitchen Inventory Audit Verification Document
            </div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #64748b;">
            <div>Report Date: <strong style="color: #0f172a;">${generatedDate}</strong></div>
            <div>Time: <strong style="color: #0f172a;">${generatedTime}</strong></div>
            <div>Records Extracted: <strong style="color: #0f172a;">${ledgerData.length}</strong></div>
          </div>
        </div>

        <!-- Scope & Parameters Filter Bar -->
        <div style="background: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin-bottom: 14px; font-size: 10.5px; display: flex; gap: 24px;">
          <div><span style="color: #64748b; font-weight: 600;">Outlet Scope:</span> <strong style="color: #0f172a;">${branchName}</strong></div>
          <div><span style="color: #64748b; font-weight: 600;">Material Filter:</span> <strong style="color: #0f172a;">${materialFilter}</strong></div>
          <div><span style="color: #64748b; font-weight: 600;">Event Scope:</span> <strong style="color: #0f172a;">${eventTypeFilter}</strong></div>
        </div>

        <!-- KPI Metric Summary Blocks -->
        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
          <div class="kpi-card">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
              Sale Kitchen Consumption
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #1d4ed8; font-family: monospace; margin-top: 3px;">
              ${metrics.totalDepletedQty.toLocaleString()} <span style="font-size: 10px; font-weight: 500; color: #94a3b8;">units</span>
            </div>
          </div>

          <div class="kpi-card">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
              Kitchen Spoilage & Waste Loss
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #dc2626; font-family: monospace; margin-top: 3px;">
              Rs. ${Number(metrics.totalWasteLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div class="kpi-card">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
              Total Inward Procurement Value
            </div>
            <div style="font-size: 18px; font-weight: 800; color: #059669; font-family: monospace; margin-top: 3px;">
              Rs. ${Number(metrics.totalInwardVal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <!-- Ledger Table -->
        <table>
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 7px 8px; width: 4%; text-align: center;">#</th>
              <th style="padding: 7px 8px; width: 14%; text-align: left;">Timestamp</th>
              <th style="padding: 7px 8px; width: 22%; text-align: left;">Raw Material / SKU</th>
              <th style="padding: 7px 8px; width: 14%; text-align: left;">Event Type</th>
              <th style="padding: 7px 8px; width: 11%; text-align: right;">Delta (Qty)</th>
              <th style="padding: 7px 8px; width: 13%; text-align: center;">Stock Balance</th>
              <th style="padding: 7px 8px; width: 11%; text-align: right;">Valuation</th>
              <th style="padding: 7px 8px; width: 11%; text-align: left;">Audit Reference</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Signoff / Verification Footer -->
        <div style="margin-top: 28px; padding-top: 12px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; font-size: 9.5px; color: #64748b;">
          <div>
            <div>Certified system report generated from immutable StockTransaction ledger.</div>
            <div>All timestamps and balance transitions are validated by ACID transactional locks.</div>
          </div>
          <div style="text-align: right;">
            <div style="border-top: 1px solid #94a3b8; width: 150px; margin-bottom: 3px;"></div>
            <div>Branch / Operations Manager Sign-off</div>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlTemplate);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};