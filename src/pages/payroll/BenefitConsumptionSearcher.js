/* eslint-disable no-param-reassign */
import React, { useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
  Searcher, useHistory, useModulesManager, useTranslations,
} from '@openimis/fe-core';
import { fetchBenefitConsumptions } from '../../actions';
import { DEFAULT_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS } from '../../constants';
import BenefitConsumptionFilter from './BenefitConsumptionFilter';

function BenefitConsumptionSearcher({
  fetchBenefitConsumptions,
  fetchingBenefitConsumptions,
  fetchedBenefitConsumptions,
  errorBenefitConsumptions,
  benefitConsumptions,
  benefitConsumptionsPageInfo,
  benefitConsumptionsTotalCount,
  payrollUuid,
}) {
  const history = useHistory();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('payroll', modulesManager);

  const fetch = (params) => fetchBenefitConsumptions(modulesManager, params);

  const headers = () => [
    'benefitConsumption.individual',
    'benefitConsumption.photo',
    'benefitConsumption.code',
    'benefitConsumption.dateDue',
    'benefitConsumption.receipt',
    'benefitConsumption.amount',
    'benefitConsumption.type',
    'benefitConsumption.status',
  ];

  const itemFormatters = () => [
    (benefitConsumption) => benefitConsumption?.individual?.firstName,
    (benefitConsumption) => benefitConsumption?.photo,
    (benefitConsumption) => benefitConsumption?.code,
    (benefitConsumption) => benefitConsumption?.dateDue,
    (benefitConsumption) => benefitConsumption?.receipt,
    (benefitConsumption) => benefitConsumption?.amount,
    (benefitConsumption) => benefitConsumption?.type,
    (benefitConsumption) => benefitConsumption?.status,
  ];

  const rowIdentifier = (benefitConsumption) => benefitConsumption.id;

  const sorts = () => [
    ['individual', true],
    ['photo', true],
    ['code', true],
    ['dateDue', true],
    ['receipt', true],
    ['amount', true],
    ['type', true],
    ['status', true],
  ];

  const defaultFilters = () => ({
    isDeleted: {
      value: false,
      filter: 'isDeleted: false',
    },
    // payrollUuid: {
    //   value: payrollUuid,
    //   filter: `payrollUuid: "${payrollUuid}"`,
    // },
  });

  return (
    <div>
      <Searcher
        module="payroll"
        FilterPane={BenefitConsumptionFilter}
        fetch={fetch}
        items={benefitConsumptions}
        itemsPageInfo={benefitConsumptionsPageInfo}
        fetchingItems={fetchingBenefitConsumptions}
        fetchedItems={fetchedBenefitConsumptions}
        errorItems={errorBenefitConsumptions}
        tableTitle={formatMessageWithValues('bills.searcherResultsTitle', { benefitConsumptionsTotalCount })}
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
  fetchingBenefitConsumptions: state.payroll.fetchingBenefitConsumptions,
  fetchedBenefitConsumptions: state.payroll.fetchedBenefitConsumptions,
  errorBenefitConsumptions: state.payroll.errorBenefitConsumptions,
  benefitConsumptions: state.payroll.benefitConsumptions,
  benefitConsumptionsPageInfo: state.payroll.benefitConsumptionsPageInfo,
  benefitConsumptionsTotalCount: state.payroll.benefitConsumptionsTotalCount,
});

const mapDispatchToProps = (dispatch) => bindActionCreators(
  { fetchBenefitConsumptions },
  dispatch,
);

export default connect(mapStateToProps, mapDispatchToProps)(BenefitConsumptionSearcher);
