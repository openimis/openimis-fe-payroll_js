/* eslint-disable no-param-reassign */
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
  Searcher, useModulesManager, useTranslations,
} from '@openimis/fe-core';
import { fetchPayrollBenefitConsumptions } from '../../actions';
import { DEFAULT_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS } from '../../constants';
import BenefitConsumptionPayrollFilter from './BenefitConsumptionPayrollFilter';

function BenefitConsumptionPayrollSearcher({
  fetchPayrollBenefitConsumptions,
  fetchingPayrollBenefitConsumptions,
  fetchedPayrollBenefitConsumptions,
  errorPayrollBenefitConsumptions,
  payrollBenefitConsumptions,
  payrollBenefitConsumptionsPageInfo,
  payrollBenefitConsumptionsTotalCount,
  individualUuid,
}) {
  const modulesManager = useModulesManager();
  const { formatMessageWithValues } = useTranslations('payroll', modulesManager);

  const fetch = (params) => fetchPayrollBenefitConsumptions(modulesManager, params);

  const headers = () => [
    'benefitConsumption.payroll.name',
    'benefitConsumption.payroll.benefitPlan',
    'benefitConsumption.payroll.runMonth',
    'benefitConsumption.payroll.runYear',
    'benefitConsumption.status',
    'benefitConsumption.code',
    'benefitConsumption.receipt',
    'benefitConsumption.dateDue',
    'benefitConsumption.amount',
    'benefitConsumption.type',
  ];

  const itemFormatters = () => [
    (payrollBenefitConsumption) => payrollBenefitConsumption?.payroll?.name,
    (payrollBenefitConsumption) => payrollBenefitConsumption?.payroll?.benefitPlanNameCode,
    // eslint-disable-next-line max-len
    (payrollBenefitConsumption) => payrollBenefitConsumption?.payroll?.paymentCycle?.runMonth,
    (payrollBenefitConsumption) => payrollBenefitConsumption?.payroll?.paymentCycle?.runYear,
    (payrollBenefitConsumption) => payrollBenefitConsumption?.benefit?.status,
    (payrollBenefitConsumption) => payrollBenefitConsumption?.benefit?.code,
    (payrollBenefitConsumption) => payrollBenefitConsumption?.benefit?.receipt,
    (payrollBenefitConsumption) => payrollBenefitConsumption?.benefit?.dateDue,
    (payrollBenefitConsumption) => payrollBenefitConsumption?.benefit?.amount,
    (payrollBenefitConsumption) => payrollBenefitConsumption?.benefit?.type,
  ];

  const rowIdentifier = (benefitConsumption) => benefitConsumption.id;

  const sorts = () => [
    ['payroll_Name', true],
    ['payroll_benefitPlanName', false],
    ['payroll_PaymentCycle_RunMonth', true],
    ['payroll_PaymentCycle_RunYear', true],
    ['benefit_Status', true],
    ['benefit_Code', true],
    ['benefit_Receipt', true],
    ['benefit_DateDue', true],
    ['benefit_Amount', true],
    ['benefit_Type', true],
  ];

  const defaultFilters = () => {
    const filters = {
      isDeleted: {
        value: false,
        filter:
        'isDeleted: false',
      },
    };
    if (individualUuid !== null && individualUuid !== undefined) {
      filters.benefit_Individual_Id = {
        value: individualUuid,
        filter: `benefit_Individual_Id: "${individualUuid}"`,
      };
    }
    return filters;
  };

  const benefitConsumptionPayrollFilter = ({ filters, onChangeFilters }) => (
    <BenefitConsumptionPayrollFilter filters={filters} onChangeFilters={onChangeFilters} />
  );

  return (
    <div>
      <Searcher
        module="payroll"
        FilterPane={benefitConsumptionPayrollFilter}
        fetch={fetch}
        items={payrollBenefitConsumptions}
        itemsPageInfo={payrollBenefitConsumptionsPageInfo}
        fetchingItems={fetchingPayrollBenefitConsumptions}
        fetchedItems={fetchedPayrollBenefitConsumptions}
        errorItems={errorPayrollBenefitConsumptions}
        tableTitle={
          // eslint-disable-next-line max-len
          formatMessageWithValues('payrollBenefitConsumption.searcherResultsTitle', { payrollBenefitConsumptionsTotalCount })
        }
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        defaultPageSize={DEFAULT_PAGE_SIZE}
        rowIdentifier={rowIdentifier}
        defaultFilters={defaultFilters()}
      />
    </div>
  );
}

const mapStateToProps = (state) => ({
  fetchingPayrollBenefitConsumptions: state.payroll.fetchingPayrollBenefitConsumptions,
  fetchedPayrollBenefitConsumptions: state.payroll.fetchedPayrollBenefitConsumptions,
  errorPayrollBenefitConsumptions: state.payroll.errorPayrollBenefitConsumptions,
  payrollBenefitConsumptions: state.payroll.payrollBenefitConsumptions,
  payrollBenefitConsumptionsPageInfo: state.payroll.payrollBenefitConsumptionsPageInfo,
  payrollBenefitConsumptionsTotalCount: state.payroll.payrollBenefitConsumptionsTotalCount,
});

const mapDispatchToProps = (dispatch) => bindActionCreators(
  { fetchPayrollBenefitConsumptions },
  dispatch,
);

export default connect(mapStateToProps, mapDispatchToProps)(BenefitConsumptionPayrollSearcher);
