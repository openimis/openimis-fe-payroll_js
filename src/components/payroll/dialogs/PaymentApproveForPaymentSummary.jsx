import React from 'react';
import Button from '@mui/material/Button';
import {
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { MODULE_NAME } from '../../../constants';
import {
  closePayroll, fetchPayroll, makePaymentForPayroll, rejectPayroll,
} from '../../../actions';
import { mutationLabel } from '../../../utils/string-utils';
import PayrollSummaryDialog from './PayrollSummaryDialog';

const ONLINE_PAYMENT = 'StrategyOnlinePayment';
const LEFT_BUTTON_STYLE = {
  margin: '0 16px',
  marginBottom: '15px',
};

function PaymentApproveForPaymentDialog({
  payroll,
  payrollDetail,
  closePayroll,
  rejectPayroll,
  fetchPayroll,
  makePaymentForPayroll,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);

  // Closes the dialog, then submits the payroll mutation.
  const submit = (mutation, handleClose) => () => {
    handleClose();
    mutation(
      payrollDetail,
      formatMessageWithValues('payroll.mutation.closeLabel', mutationLabel(payrollDetail)),
    );
  };

  const isOnlinePayment = payrollDetail.paymentMethod === ONLINE_PAYMENT;

  return (
    <PayrollSummaryDialog
      payroll={payroll}
      payrollDetail={payrollDetail}
      fetchPayroll={fetchPayroll}
      width="75%"
      renderActionsBeforeDownload={({ handleClose, approvedBeneficiaries, selectedBeneficiaries }) => (
        <Button
          onClick={submit(closePayroll, handleClose)}
          variant="contained"
          color="primary"
          disabled={isOnlinePayment ? approvedBeneficiaries === 0 : selectedBeneficiaries === 0}
          style={LEFT_BUTTON_STYLE}
        >
          {formatMessage('payroll.summary.approveAndClose')}
        </Button>
      )}
      renderActionsAfterDownload={({ handleClose }) => (
        <Button
          onClick={submit(rejectPayroll, handleClose)}
          variant="contained"
          color="primary"
          style={LEFT_BUTTON_STYLE}
        >
          {formatMessage('payroll.summary.reject')}
        </Button>
      )}
      renderActionsBeforeClose={({ handleClose }) => isOnlinePayment && (
        <Button
          onClick={submit(makePaymentForPayroll, handleClose)}
          variant="contained"
          color="primary"
          style={{
            margin: '0 16px',
          }}
        >
          {formatMessage('payroll.summary.makePayment')}
        </Button>
      )}
    />
  );
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  payroll: state.payroll.payroll,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  closePayroll,
  rejectPayroll,
  fetchPayroll,
  makePaymentForPayroll,
}, dispatch);

export { PaymentApproveForPaymentDialog };
export default connect(mapStateToProps, mapDispatchToProps)(PaymentApproveForPaymentDialog);
