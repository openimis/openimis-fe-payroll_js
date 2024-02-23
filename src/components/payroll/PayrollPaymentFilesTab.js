import React from 'react';
import { useSelector } from 'react-redux';
import { Tab } from '@material-ui/core';
import { PublishedComponent, useTranslations } from '@openimis/fe-core';
import {
  MODULE_NAME, PAYROLL_PAYMENT_FILES_TAB_VALUE,
} from '../../constants';
import PayrollPaymentFilesSearcher from './PayrollPaymentFilesSearcher';

function PayrollPaymentFilesTabLabel({
  onChange, tabStyle, isSelected, modulesManager, payrollUuid, isInTask, isPayrollFromFailedInvoices,
}) {
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  if (!payrollUuid || isInTask || isPayrollFromFailedInvoices) {
    return null;
  }
  return (
    <Tab
      onChange={onChange}
      className={tabStyle(PAYROLL_PAYMENT_FILES_TAB_VALUE)}
      selected={isSelected(PAYROLL_PAYMENT_FILES_TAB_VALUE)}
      value={PAYROLL_PAYMENT_FILES_TAB_VALUE}
      label={formatMessage('PayrollPaymentFilesTab.label')}
    />
  );
}

function PayrollPaymentFilesTabPanel({ value, payrollUuid, isInTask }) {
  const rights = useSelector((store) => store?.core?.user?.i_user?.rights ?? []);
  if (isInTask) return null;

  return (
    <PublishedComponent
      pubRef="policyHolder.TabPanel"
      module="payroll"
      index={PAYROLL_PAYMENT_FILES_TAB_VALUE}
      value={value}
    >
      {
                payrollUuid && (
                <PayrollPaymentFilesSearcher
                  module="payroll"
                  payrollUuid={payrollUuid}
                  rights={rights}
                  showFilters={false}
                />
                )
            }
    </PublishedComponent>
  );
}

export { PayrollPaymentFilesTabLabel, PayrollPaymentFilesTabPanel };
