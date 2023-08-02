import React from 'react';
import { Tab } from '@material-ui/core';
import { PublishedComponent, useTranslations } from '@openimis/fe-core';
import { MODULE_NAME, PAYROLL_BILLS_LIST_TAB_VALUE, RIGHT_BILL_SEARCH } from '../../constants';
import PayrollBillSearcher from './PayrollBillSearcher';

function PayrollBillsTabLabel({
  onChange, tabStyle, isSelected, modulesManager,
}) {
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  return (
    <Tab
      onChange={onChange}
      className={tabStyle(PAYROLL_BILLS_LIST_TAB_VALUE)}
      selected={isSelected(PAYROLL_BILLS_LIST_TAB_VALUE)}
      value={PAYROLL_BILLS_LIST_TAB_VALUE}
      label={formatMessage('PayrollBillsTab.label')}
    />
  );
}

function PayrollBillsTabPanel({ value, rights, payrollUuid }) {
  return (
    <PublishedComponent
      pubRef="policyHolder.TabPanel"
      module="payroll"
      index={PAYROLL_BILLS_LIST_TAB_VALUE}
      value={value}
    >
      {
      rights.includes(RIGHT_BILL_SEARCH) && (
      <PayrollBillSearcher rights={rights} payrollUuid={payrollUuid} />
      )
      }
    </PublishedComponent>
  );
}

export { PayrollBillsTabLabel, PayrollBillsTabPanel };
