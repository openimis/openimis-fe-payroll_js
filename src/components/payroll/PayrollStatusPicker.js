import React from 'react';
import { ConstantBasedPicker } from '@openimis/fe-core';

import { PAYROLL_STATUS_LIST } from '../../constants';

function PayrollStatusPicker(props) {
  const {
    required, withNull, readOnly, onChange, value, nullLabel, withLabel,
  } = props;
  return (
    <ConstantBasedPicker
      module="payroll"
      label="payroll.payrollStatusPicker"
      constants={PAYROLL_STATUS_LIST}
      required={required}
      withNull={withNull}
      readOnly={readOnly}
      onChange={onChange}
      value={value}
      nullLabel={nullLabel}
      withLabel={withLabel}
    />
  );
}

export default PayrollStatusPicker;
