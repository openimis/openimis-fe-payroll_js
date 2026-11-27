/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import {
  Paper,
  Grid,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import { MODULE_NAME, BENEFIT_CONSUMPTION_STATUS } from '../../../constants';
import BenefitConsumptionSearcherModal from '../BenefitConsumptionSearcherModal';
import downloadPayroll from '../../../utils/export';

const countByStatus = (benefits, status) => benefits.filter((benefit) => benefit.status === status).length;

/**
 * Counts and bill totals shown at the top of a payroll summary dialog.
 * Exported for the tests.
 */
export function summarizePayroll(payroll) {
  const benefits = payroll?.benefitConsumption ?? [];
  let totalBillAmount = 0;
  let totalReconciledBillAmount = 0;
  benefits.forEach((benefit) => {
    (benefit.benefitAttachment ?? []).forEach((attachment) => {
      if (attachment.bill && attachment.bill.amountTotal) {
        totalBillAmount += Number.parseFloat(attachment.bill.amountTotal);
        if (benefit.status === BENEFIT_CONSUMPTION_STATUS.RECONCILED) {
          totalReconciledBillAmount += Number.parseFloat(attachment.bill.amountTotal);
        }
      }
    });
  });
  return {
    totalBeneficiaries: benefits.length,
    selectedBeneficiaries: countByStatus(benefits, BENEFIT_CONSUMPTION_STATUS.RECONCILED),
    approvedBeneficiaries: countByStatus(benefits, BENEFIT_CONSUMPTION_STATUS.APPROVE_FOR_PAYMENT),
    totalBillAmount,
    totalReconciledBillAmount,
  };
}

const EMPTY_SUMMARY = {
  totalBeneficiaries: 0,
  selectedBeneficiaries: 0,
  approvedBeneficiaries: 0,
  totalBillAmount: 0,
  totalReconciledBillAmount: 0,
};

function SummaryCard({ title, children }) {
  return (
    <Grid size={4}>
      <Paper elevation={3} style={{ padding: '20px' }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1">
          {children}
        </Typography>
      </Paper>
    </Grid>
  );
}

/**
 * The reconciliation summary of a payroll: an opening button, the summary
 * cards, the benefit consumptions and the dialog actions. The pending,
 * approved and reconciled payroll lists each add their own actions through
 * the render props, which receive { handleClose, ...summary }.
 */
function PayrollSummaryDialog({
  payroll,
  payrollDetail,
  fetchPayroll,
  width = '90%',
  reconciledMode = false,
  renderActionsBeforeDownload = () => null,
  renderActionsAfterDownload = () => null,
  renderActionsBeforeClose = () => null,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const [payrollUuid] = useState(payrollDetail?.id ?? null);
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const handleOpen = () => {
    if (payrollUuid) {
      fetchPayroll(modulesManager, [`id: "${payrollUuid}"`]);
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen && Object.keys(payroll).length > 0) {
      setSummary(summarizePayroll(payroll));
    }
  }, [isOpen, payroll]);

  const actionContext = { handleClose, ...summary };
  const { selectedBeneficiaries, totalBeneficiaries } = summary;

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="contained"
        color="primary"
      >
        {formatMessage('payroll.viewReconciliationSummary')}
      </Button>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        slotProps={{
          paper: {
            style: {
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width,
              maxWidth: width,
            },
          },
        }}
      >
        <DialogTitle
          style={{
            marginTop: '10px',
          }}
        >
          {formatMessageWithValues('payroll.reconciliationSummary', { payrollName: payrollDetail.name })}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <SummaryCard title={formatMessage('payroll.summary.selectedBeneficiaries')}>
              {formatMessageWithValues('payroll.summary.beneficiariesCount', { selectedBeneficiaries, totalBeneficiaries })}
            </SummaryCard>
            <SummaryCard title={formatMessage('payroll.summary.totalAmountForInvoice')}>
              {summary.totalBillAmount}
            </SummaryCard>
            <SummaryCard title={formatMessage('payroll.summary.deliveredReconciliation')}>
              {summary.totalReconciledBillAmount}
            </SummaryCard>
          </Grid>
          <div
            style={{ backgroundColor: '#DFEDEF' }}
          >
            <BenefitConsumptionSearcherModal
              payrollUuid={payrollDetail.id}
              payrollDetail={payrollDetail}
              reconciledMode={reconciledMode}
            />
          </div>
        </DialogContent>
        <DialogActions
          style={{
            display: 'inline',
            paddingLeft: '10px',
            marginTop: '25px',
            marginBottom: '15px',
            width: '100%',
          }}
        >
          <div style={{ maxWidth: '3000px' }}>
            <div style={{ float: 'left' }}>
              {renderActionsBeforeDownload(actionContext)}
              <Button
                onClick={() => downloadPayroll(payrollDetail.id, payrollDetail.name)}
                variant="contained"
                color="primary"
                style={{
                  margin: '0 16px',
                  marginBottom: '15px',
                }}
              >
                {formatMessage('payroll.summary.download')}
              </Button>
              {renderActionsAfterDownload(actionContext)}
            </div>
            <div style={{
              float: 'right',
              paddingRight: '16px',
            }}
            >
              {renderActionsBeforeClose(actionContext)}
              <Button
                onClick={handleClose}
                variant="outlined"
                autoFocus
                style={{ margin: '0 16px' }}
              >
                {formatMessage('payroll.summary.close')}
              </Button>
            </div>
          </div>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default PayrollSummaryDialog;
