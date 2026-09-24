/**
 * exportCsv.js — Utility to export filtered transactions to a CSV file.
 */

/**
 * Converts transactions array to CSV string and triggers a browser download.
 * @param {Array} transactions - Array of transaction objects
 * @param {string} [filename] - Optional filename (without .csv extension)
 */
export function exportTransactionsCsv(transactions, filename = 'expenses') {
  if (!transactions || transactions.length === 0) {
    alert('No transactions to export.');
    return;
  }

  const headers = [
    'ID',
    'Date',
    'Type',
    'Amount (₹)',
    'Description',
    'Category',
    'Payment Mode',
    'Group',
    'Created At'
  ];

  const rows = transactions.map(t => [
    t.id || '',
    t.date ? t.date.split('T')[0].split(' ')[0] : '',
    t.transaction_type === 'income' ? 'Income' : 'Expense',
    Number(t.amount).toFixed(2),
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.payment_mode || '').replace(/"/g, '""')}"`,
    `"${(t.group_name || t.group_id || '').replace(/"/g, '""')}"`,
    t.created_at || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
