import React from 'react';
import { ConstantBasedPicker } from '@openimis/fe-core';

import { BENEFIT_CONSUMPTION_STATUS_LIST } from '../constants';

function BenefitConsumptionStatusPicker(props) {
  const {
    required, withNull, readOnly, onChange, value, nullLabel, withLabel,
  } = props;
  return (
    <ConstantBasedPicker
      module="socialProtection"
      label="beneficiary.beneficiaryStatusPicker"
      constants={BENEFIT_CONSUMPTION_STATUS_LIST}
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

export default BenefitConsumptionStatusPicker;
