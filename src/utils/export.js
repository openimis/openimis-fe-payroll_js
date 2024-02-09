import { baseApiUrl } from '@openimis/fe-core';

export default function downloadPayroll(payrollId, payrollName) {
  const url = new URL(
    `${window.location.origin}${baseApiUrl}/payroll/csv_reconciliation/?payroll_id=${payrollId}`,
  );
  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reconciliation_${payrollName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((error) => {
      console.error('Export failed, reason: ', error);
    });
}
