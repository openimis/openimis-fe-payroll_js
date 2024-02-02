import React from 'react';
import PayrollPage from '../../pages/payroll/PayrollPage';
import { EMPTY_STRING } from '../../constants';

const PayrollTaskTableHeaders = () => [
  EMPTY_STRING,
];

const PayrollTaskItemFormatters = () => [
  (payroll) => <PayrollPage taskPayrollUuid={payroll?.id} />,
];

export { PayrollTaskTableHeaders, PayrollTaskItemFormatters };
