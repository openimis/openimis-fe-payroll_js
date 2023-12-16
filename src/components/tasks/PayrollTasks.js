import React from 'react';
import { FormattedMessage } from '@openimis/fe-core';

const PayrollTaskTableHeaders = () => [
  <FormattedMessage module="payroll" id="payroll.name" />,
  <FormattedMessage module="payroll" id="payroll.benefitPlan" />,
  <FormattedMessage module="payroll" id="payroll.status" />,
  <FormattedMessage module="payroll" id="payroll.dateValidFrom" />,
  <FormattedMessage module="payroll" id="payroll.dateValidTo" />,
  <FormattedMessage module="payroll" id="payroll.paymentMethod" />,
];

const PayrollTaskItemFormatters = () => [
  (payroll) => payroll?.name,
  (payroll) => payroll?.benefitPlan,
  (payroll) => payroll?.status,
  (payroll) => payroll?.date_valid_from,
  (payroll) => payroll?.date_valid_to,
  (payroll) => payroll?.paymentMethod,
];

export { PayrollTaskTableHeaders, PayrollTaskItemFormatters };
