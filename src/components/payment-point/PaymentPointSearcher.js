import React from 'react';
import { bindActionCreators } from 'redux';
import { connect, useSelector } from 'react-redux';

import { IconButton, Tooltip } from '@material-ui/core';
import VisibilityIcon from '@material-ui/icons/Visibility';

import {
  Searcher,
  useHistory,
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import { fetchPaymentPoints } from '../../actions';
import {
  DEFAULT_PAGE_SIZE, MODULE_NAME, PAYROLL_PAYMENT_POINT_ROUTE, RIGHT_PAYMENT_POINT_SEARCH, ROWS_PER_PAGE_OPTIONS,
} from '../../constants';
import PaymentPointFilter from './PaymentPointFilter';

function PaymentPointSearcher({
  fetchPaymentPoints,
  fetchingPaymentPoints,
  fetchedPaymentPoints,
  errorPaymentPoints,
  paymentPoints,
  pageInfo,
  totalCount,
}) {
  const history = useHistory();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const rights = useSelector((store) => store.core.user.i_user.rights ?? []);

  const headers = () => [
    'paymentPoint.name',
    'paymentPoint.manager',
    'paymentPoint.location',
    'emptyLabel',
  ];

  const sorts = () => [
    ['name', true],
    ['location', true],
  ];

  const fetch = (params) => fetchPaymentPoints(modulesManager, params);

  const rowIdentifier = (paymentPoint) => paymentPoint.id;

  const openPaymentPoint = (paymentPoint) => rights.includes(RIGHT_PAYMENT_POINT_SEARCH) && history.push(
    `/${modulesManager.getRef(PAYROLL_PAYMENT_POINT_ROUTE)}/${paymentPoint?.id}`,
  );

  const itemFormatters = () => [
    (paymentPoint) => paymentPoint.name,
    ({ ppm }) => `${ppm?.loginName} ${ppm?.lastName} ${ppm?.otherNames}`,
    ({ location }) => `${location?.code} ${location?.name}`,
    (paymentPoint) => (
      <Tooltip title={formatMessage('tooltip.viewDetails')}>
        <IconButton
          onClick={() => openPaymentPoint(paymentPoint)}
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
    ),
  ];

  const onDoubleClick = (paymentPoint) => openPaymentPoint(paymentPoint);

  const paymentPointFilter = ({ filters, onChangeFilters }) => (
    <PaymentPointFilter filters={filters} onChangeFilters={onChangeFilters} />
  );

  const defaultFilters = () => ({
    isDeleted: {
      value: false,
      filter: 'isDeleted: false',
    },
  });

  return (
    <Searcher
      module="payroll"
      FilterPane={paymentPointFilter}
      fetch={fetch}
      items={paymentPoints}
      itemsPageInfo={pageInfo}
      fetchedItems={fetchedPaymentPoints}
      fetchingItems={fetchingPaymentPoints}
      errorItems={errorPaymentPoints}
      tableTitle={formatMessageWithValues('PaymentPointSearcher.results', { totalCount })}
      headers={headers}
      itemFormatters={itemFormatters}
      sorts={sorts}
      rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      defaultPageSize={DEFAULT_PAGE_SIZE}
      rowIdentifier={rowIdentifier}
      onDoubleClick={onDoubleClick}
      defaultFilters={defaultFilters()}
    />
  );
}

const mapStateToProps = (state) => ({
  fetchingPaymentPoints: state.payroll.fetchingPaymentPoints,
  fetchedPaymentPoints: state.payroll.fetchedPaymentPoints,
  errorPaymentPoints: state.payroll.errorPaymentPoints,
  paymentPoints: state.payroll.paymentPoints,
  pageInfo: state.payroll.paymentPointsPageInfo,
  totalCount: state.payroll.paymentPointsTotalCount,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ fetchPaymentPoints }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(PaymentPointSearcher);
