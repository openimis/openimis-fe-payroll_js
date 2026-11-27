import React from 'react';
import Button from '@mui/material/Button';
import {
  useModulesManager,
  useTranslations,
  useHistory,
} from '@openimis/fe-core';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  MODULE_NAME,
  PAYROLL_PAYROLL_ROUTE,
  PAYROLL_FROM_FAILED_INVOICES_URL_PARAM,
} from '../../../constants';
import { fetchPayroll } from '../../../actions';
import PayrollSummaryDialog from './PayrollSummaryDialog';

function PaymentReconcilationSummarytDialog({
  payroll,
  payrollDetail,
  fetchPayroll,
}) {
  const history = useHistory();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  const handleCreatePaymentForFailedInvoice = () => {
    history.push(
      `/${modulesManager.getRef(PAYROLL_PAYROLL_ROUTE)}/${payrollDetail?.id}/${PAYROLL_FROM_FAILED_INVOICES_URL_PARAM}`,
    );
  };

  return (
    <PayrollSummaryDialog
      payroll={payroll}
      payrollDetail={payrollDetail}
      fetchPayroll={fetchPayroll}
      reconciledMode
      renderActionsBeforeDownload={({ totalBeneficiaries, selectedBeneficiaries }) => (
        <Button
          onClick={handleCreatePaymentForFailedInvoice}
          variant="contained"
          color="primary"
          disabled={totalBeneficiaries === selectedBeneficiaries}
          style={{
            margin: '0 16px',
            marginBottom: '15px',
          }}
        >
          {formatMessage('payroll.summary.createPaymentForFailedInvoice')}
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
  fetchPayroll,
}, dispatch);

export { PaymentReconcilationSummarytDialog };
export default connect(mapStateToProps, mapDispatchToProps)(PaymentReconcilationSummarytDialog);
