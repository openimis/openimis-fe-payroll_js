import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { SelectInput } from '@openimis/fe-core';
import { fetchPaymentMethods } from '../actions';

function PaymentMethodPicker({
  value,
  label,
  onChange,
  readOnly = false,
  withNull = false,
  nullLabel = null,
  withLabel = true,
  required = false,
  paymentMethods,
  fetchPaymentMethods,
}) {
  const fetch = () => {
    fetchPaymentMethods({});
  };

  useEffect(() => {
    fetch();
  }, []);

  const options = Array.isArray(paymentMethods) && paymentMethods !== undefined ? [
    ...paymentMethods.map((paymentMethod) => ({
      value: paymentMethod.name,
      label: paymentMethod.name,
    })),
  ] : [];

  if (withNull) {
    options.unshift({
      value: null,
      label: nullLabel || '',
    });
  }

  return (
    <SelectInput
      module="payroll"
      label={withLabel && label}
      options={options}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      required={required}
    />
  );
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  confirmed: state.core.confirmed,
  fetchingPaymentMethods: state.payroll.fetchingPaymentMethods,
  errorPaymentMethods: state.payroll.errorPaymentMethods,
  fetchedPaymentMethods: state.payroll.fetchedPaymentMethods,
  paymentMethods: state.payroll.paymentMethods,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchPaymentMethods,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(PaymentMethodPicker);
