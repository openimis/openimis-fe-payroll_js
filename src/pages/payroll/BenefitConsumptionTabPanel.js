import React from 'react';
import { Tab } from '@material-ui/core';
import { PublishedComponent, useTranslations } from '@openimis/fe-core';
import {
  BENEFIT_CONSUMPTION_LIST_TAB_VALUE,
  MODULE_NAME,
  RIGHT_PAYROLL_SEARCH,
} from '../../constants';
import BenefitConsumptionSearcher from './BenefitConsumptionSearcher';

function BenefitConsumptionsTabLabel({
  onChange, tabStyle, isSelected, modulesManager,
}) {
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  return (
    <Tab
      onChange={onChange}
      className={tabStyle(BENEFIT_CONSUMPTION_LIST_TAB_VALUE)}
      selected={isSelected(BENEFIT_CONSUMPTION_LIST_TAB_VALUE)}
      value={BENEFIT_CONSUMPTION_LIST_TAB_VALUE}
      label={formatMessage('PayrollBenefitConsumptionTab.label')}
    />
  );
}

function BenefitConsumptionsTabPanel({ value, rights, payrollUuid }) {
  console.log(payrollUuid, 'aaaaa')
  return (
    <PublishedComponent
      pubRef="policyHolder.TabPanel"
      module="payroll"
      index={BENEFIT_CONSUMPTION_LIST_TAB_VALUE}
      value={value}
    >
      {
        rights.includes(RIGHT_PAYROLL_SEARCH) && payrollUuid && (
        <BenefitConsumptionSearcher rights={rights} payrollUuid={payrollUuid} />
        )
      }
    </PublishedComponent>
  );
}

export { BenefitConsumptionsTabLabel, BenefitConsumptionsTabPanel };
