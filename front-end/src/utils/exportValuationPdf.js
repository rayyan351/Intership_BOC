// front-end/src/utils/exportValuationPdf.js

export const exportValuationBalanceSheetPDF = ({
  summary = {},
  categoryDistribution = [],
  branchDistribution = [],
  items = [],
  activeBranchName = 'Consolidated (All Outlets)',
}) => {
  const printWindow = window.open('', '_blank', 'width=1100,height=900');
  if (!printWindow) {
    alert('Please allow popups to export the Valuation Balance Sheet.');
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

  const categoryRows = categoryDistribution
    .map(
      (c) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 6px 8px; font-weight: 700; color: #0f172a;">${c.category}</td>
        <td style="padding: 6px 8px; text-align: center; color: #64748b;">${c.itemCount} SKUs</td>
        <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">
          Rs. ${Number(c.totalValuation).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </td>
        <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 700; color: #2563eb;">
          ${c.percentage}%
        </td>
      </tr>
    `
    )
    .join('');

  const itemRows = items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10.5px;">
        <td style="padding: 6px 8px; text-align: center; color: #94a3b8; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 6px 8px;">
          <div style="font-weight: 700; color: #0f172a;">${item.name}</div>
          <div style="font-size: 9px; color: #64748b; font-family: monospace;">SKU: ${item.sku} • ${item.category}</div>
        </td>
        <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">
          ${item.totalStock.toLocaleString()} <span style="font-size: 9px; color: #64748b;">${item.recipeUnit}</span>
        </td>
        <td style="padding: 6px 8px; text-align: right; font-family: monospace; color: #475569;">
          Rs. ${Number(item.costPerRecipeUnit).toFixed(2)}
        </td>
        <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 700; color: #059669;">
          Rs. ${Number(item.totalValuation).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Inventory_Asset_Balance_Sheet</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 11.5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px;">
          <div>
            <div style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">
              Inventory Asset Valuation Balance Sheet
            </div>
            <div style="font-size: 11px; color: #475569; font-weight: 600; margin-top: 2px;">
              Scope: ${activeBranchName} • Method: Weighted Average Costing (WAC)
            </div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #64748b;">
            <div>As of: <strong style="color: #0f172a;">${generatedDate}</strong></div>
            <div>Time: <strong style="color: #0f172a;">${generatedTime}</strong></div>
          </div>
        </div>

        <!-- Executive Financial KPI Banner -->
        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
          <div style="flex: 1; padding: 12px; background: #0f172a; color: #ffffff; border-radius: 8px;">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">
              Total Inventory Capital Asset
            </div>
            <div style="font-size: 20px; font-weight: 900; color: #ffc400; font-family: monospace; margin-top: 4px;">
              Rs. ${Number(summary.totalAssetValuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div style="flex: 1; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
              Active Tracked SKUs
            </div>
            <div style="font-size: 20px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 4px;">
              ${summary.totalSkus || 0} Materials
            </div>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; color: #0f172a;">
          Asset Allocation by Category
        </div>
        <table>
          <thead>
            <tr style="background-color: #f1f5f9; color: #0f172a; font-size: 9.5px; text-transform: uppercase;">
              <th style="padding: 6px 8px; text-align: left;">Category</th>
              <th style="padding: 6px 8px; text-align: center;">Active SKUs</th>
              <th style="padding: 6px 8px; text-align: right;">Total Capital (PKR)</th>
              <th style="padding: 6px 8px; text-align: right;">Weight (%)</th>
            </tr>
          </thead>
          <tbody>
            ${categoryRows}
          </tbody>
        </table>

        <!-- Itemized Asset Ledger -->
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; color: #0f172a;">
          Material Asset Ledger
        </div>
        <table>
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff; font-size: 9.5px; text-transform: uppercase;">
              <th style="padding: 6px 8px; width: 5%; text-align: center;">#</th>
              <th style="padding: 6px 8px; width: 45%; text-align: left;">Material / SKU</th>
              <th style="padding: 6px 8px; width: 18%; text-align: right;">Current Balance</th>
              <th style="padding: 6px 8px; width: 14%; text-align: right;">WAC Unit Cost</th>
              <th style="padding: 6px 8px; width: 18%; text-align: right;">Holding Asset Value</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 9px; color: #64748b;">
          <div>Valuation computed strictly via immutable StockTransaction WAC Ledger.</div>
          <div style="text-align: right; width: 180px; border-top: 1px solid #0f172a; padding-top: 4px; font-weight: 700; color: #0f172a;">
            Chief Financial Officer / Auditor
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