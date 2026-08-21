// front-end/src/utils/exportCsv.js

/**
 * Converts an array of objects into a downloadable CSV file.
 * Handles escaping quotes, commas, and newlines.
 * 
 * @param {Array<Object>} data - Array of row objects
 * @param {Array<{label: string, key: string | Function}>} headers - Column configuration
 * @param {string} filename - Desired download filename
 */
export const exportToCSV = (data, headers, filename = 'export.csv') => {
  if (!data || !data.length) return;

  // 1. Build Header Row
  const headerRow = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(',');

  // 2. Build Data Rows
  const rows = data.map((row) => {
    return headers
      .map((header) => {
        let value = '';
        if (typeof header.key === 'function') {
          value = header.key(row);
        } else {
          value = row[header.key];
        }

        if (value === null || value === undefined) {
          value = '';
        }

        // Format to string and escape quotes
        const strVal = String(value).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(',');
  });

  // 3. Assemble and encode CSV
  const csvContent = [headerRow, ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF ensures UTF-8 BOM for Excel

  // 4. Trigger Native Browser Download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};