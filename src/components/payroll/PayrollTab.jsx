/* eslint-disable max-len */
import React, { useState } from 'react';
import { Paper, Grid, Button } from '@mui/material';
import {
  Contributions,
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import { styled } from '@mui/material/styles';
import {
  BENEFIT_CONSUMPTION_LIST_TAB_VALUE,
  PAYROLL_TABS_LABEL_CONTRIBUTION_KEY,
  PAYROLL_TABS_PANEL_CONTRIBUTION_KEY,
  PAYROLL_STATUS,
  MODULE_NAME,
} from '../../constants';
import PayrollPaymentDataUploadDialog from './dialogs/PayrollPaymentDataUploadDialog';
import downloadPayroll from '../../utils/export';

const StyledPayrollTab = styled(Paper)(({ theme }) => ({
  ...theme.paper?.paper,
  '& .tableTitle': theme.table?.title ?? {},
  '& .tabs': {
    display: 'flex',
    alignItems: 'center',
  },
  '& .selectedTab': {
    borderBottom: '4px solid white',
  },
  '& .unselectedTab': {
    borderBottom: '4px solid transparent',
  },
  '& .button': {
    marginLeft: 'auto',
    padding: theme.spacing(1),
    fontSize: '0.875rem',
    textTransform: 'none',
  },
}));

function PayrollTab({
  rights, setConfirmedAction, payrollUuid, isInTask, payroll, isPayrollFromFailedInvoices,
}) {

  const [activeTab, setActiveTab] = useState(BENEFIT_CONSUMPTION_LIST_TAB_VALUE);

  const isSelected = (tab) => tab === activeTab;

  const tabStyle = (tab) => (isSelected(tab) ? 'selectedTab' : 'unselectedTab');

  const handleChange = (_, tab) => setActiveTab(tab);

  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  const downloadPayrollData = (payrollUuid, payrollName) => {
    downloadPayroll(payrollUuid, payrollName);
  };

  return (
    <StyledPayrollTab>
      <Grid container className="tableTitle tabs">
        <div style={{ width: '100%' }}>
          <div style={{ float: 'left' }}>
            <Contributions
              contributionKey={PAYROLL_TABS_LABEL_CONTRIBUTION_KEY}
              rights={rights}
              value={activeTab}
              onChange={handleChange}
              isSelected={isSelected}
              tabStyle={tabStyle}
              payrollUuid={payrollUuid}
              isInTask={isInTask}
              isPayrollFromFailedInvoices={isPayrollFromFailedInvoices}
            />
          </div>
          <div style={{ float: 'right', paddingRight: '16px' }}>
            {payrollUuid && !isPayrollFromFailedInvoices && (
              <Button
                onClick={() => downloadPayrollData(payrollUuid, payroll.name)}
                color="#DFEDEF"
                className="button"
                style={{
                  border: '0px',
                  marginTop: '6px',
                  textTransform: 'uppercase',
                }}
              >
                {formatMessage('payroll.summary.download')}
              </Button>
            )}
            {payrollUuid && payroll?.status === PAYROLL_STATUS.APPROVE_FOR_PAYMENT && payroll.paymentMethod === 'StrategyOfflinePayment'
              && (
                <PayrollPaymentDataUploadDialog
                  payrollUuid={payrollUuid}
                />
              )}
          </div>
        </div>
      </Grid>
      <Contributions
        contributionKey={PAYROLL_TABS_PANEL_CONTRIBUTION_KEY}
        rights={rights}
        value={activeTab}
        setConfirmedAction={setConfirmedAction}
        payrollUuid={payrollUuid}
        isInTask={isInTask}
        isPayrollFromFailedInvoices={isPayrollFromFailedInvoices}
      />
    </StyledPayrollTab>
  );
}

export default PayrollTab;
