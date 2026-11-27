import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchPayroll } from '../../../actions';
import PayrollSummaryDialog from './PayrollSummaryDialog';

function PaymentPendingPayrollPaymentDialog({
  payroll,
  fetchPayroll,
  payrollDetail,
}) {
  return (
    <PayrollSummaryDialog
      payroll={payroll}
      payrollDetail={payrollDetail}
      fetchPayroll={fetchPayroll}
    />
  );
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  payroll: state.payroll.payroll,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchPayroll,
}, dispatch);

export { PaymentPendingPayrollPaymentDialog };
export default connect(mapStateToProps, mapDispatchToProps)(PaymentPendingPayrollPaymentDialog);
