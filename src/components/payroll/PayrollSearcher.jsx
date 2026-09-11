import React, { useState, useRef, useEffect } from 'react';
import { connect, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';

import { IconButton, Tooltip } from '@mui/material';

import {
  Searcher,
  useHistory,
  useModulesManager,
  useTranslations,
  coreConfirm,
  clearConfirm,
  journalize,
  GetIconComponent,
} from '@openimis/fe-core';
import PayrollFilter from './PayrollFilter';
import GenerationProgress from './GenerationProgress';
import PayrollStatusLabel from './PayrollStatusLabel';
import {
  DEFAULT_PAGE_SIZE, MODULE_NAME, PAYROLL_PAYROLL_ROUTE,
  RIGHT_PAYROLL_CREATE, RIGHT_PAYROLL_SEARCH, ROWS_PER_PAGE_OPTIONS, PAYROLL_STATUS,
} from '../../constants';
import { mutationLabel, pageTitle } from '../../utils/string-utils';
import { ACTION_TYPE } from '../../reducer';
import {
  fetchPayrolls, deletePayrolls, retriggerPayroll, fetchPayrollSystemStatus,
} from '../../actions';
const VisibilityIcon = GetIconComponent("Visibility");
const DeleteIcon = GetIconComponent("Delete");
const ReplayIcon = GetIconComponent("Replay");

const DELETABLE_STATUSES = [PAYROLL_STATUS.PENDING_APPROVAL, PAYROLL_STATUS.FAILED];

function PayrollSearcher({
  deletePayrolls,
  fetchingPayrolls,
  fetchedPayrolls,
  errorPayrolls,
  payrolls,
  pageInfo,
  totalCount,
  fetchPayrolls,
  retriggerPayroll,
  fetchPayrollSystemStatus,
  systemStatus,
  coreConfirm,
  clearConfirm,
  confirmed,
  submittingMutation,
  mutationInFlight,
  mutation,
}) {
  const history = useHistory();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const rights = useSelector((store) => store.core.user.i_user.rights ?? []);

  const [payrollToDelete, setPayrollToDelete] = useState(null);
  const [deletedPayrollUuids, setDeletedPayrollUuids] = useState([]);
  const prevSubmittingMutationRef = useRef();
  const lastFetchParamsRef = useRef(null);

  const triggersDown = systemStatus?.triggersSynced === false;

  useEffect(() => {
    fetchPayrollSystemStatus();
  }, []);

  const openDeletePayrollConfirmDialog = () => {
    coreConfirm(
      formatMessageWithValues('payroll.delete.confirm.title', pageTitle(payrollToDelete)),
      formatMessage('payroll.delete.confirm.message'),
    );
  };

  useEffect(() => {
    if (payrollToDelete) {
      openDeletePayrollConfirmDialog();
    }
  }, [payrollToDelete]);

  useEffect(() => {
    if (payrollToDelete && confirmed) {
      deletePayrolls(
        payrollToDelete,
        formatMessageWithValues('payroll.mutation.deleteLabel', mutationLabel(payrollToDelete)),
      );
      setDeletedPayrollUuids([...deletedPayrollUuids, payrollToDelete.id]);
    }
    if (payrollToDelete && confirmed !== null) {
      setPayrollToDelete(null);
    }
  }, [confirmed]);

  useEffect(() => {
    if (prevSubmittingMutationRef.current && !submittingMutation) {
      journalize(mutation);
      if (mutation?.actionType === ACTION_TYPE.RETRIGGER_PAYROLL && lastFetchParamsRef.current) {
        fetchPayrolls(modulesManager, lastFetchParamsRef.current);
      }
    }
  }, [submittingMutation]);

  useEffect(() => {
    prevSubmittingMutationRef.current = submittingMutation;
  });

  const headers = () => [
    'payroll.name',
    'payroll.benefitPlan',
    'payroll.paymentPoint',
    'payroll.status',
    'payroll.paymentMethod',
    'emptyLabel',
    'emptyLabel',
    'emptyLabel',
  ];

  const sorts = () => [
    ['name', true],
    ['benefitPlan', true],
    ['paymentPoint', true],
    ['status', true],
    ['paymentMethod', true],
  ];

  const defaultFilters = () => ({
    isDeleted: {
      value: false,
      filter: 'isDeleted: false',
    },
  });

  const fetch = (params) => {
    lastFetchParamsRef.current = params;
    return fetchPayrolls(modulesManager, params);
  };

  const rowIdentifier = (payroll) => payroll.id;

  const openPayroll = (payroll) => rights.includes(RIGHT_PAYROLL_SEARCH) && history.push(
    `/${modulesManager.getRef(PAYROLL_PAYROLL_ROUTE)}/${payroll?.id}`,
  );

  const onDelete = (payroll) => setPayrollToDelete(payroll);

  const onRetrigger = (payroll) => {
    retriggerPayroll(
      payroll,
      formatMessageWithValues('payroll.mutation.retriggerLabel', mutationLabel(payroll)),
    );
  };

  const itemFormatters = () => [
    (payroll) => payroll.name,
    (payroll) => (payroll.benefitPlan
      ? `${payroll.benefitPlan.code} ${payroll.benefitPlan.name}` : ''),
    (payroll) => (payroll.paymentPoint
      ? `${payroll.paymentPoint.name}` : ''),
    (payroll) => {
      const { status } = payroll;
      if (status !== PAYROLL_STATUS.GENERATING) return <PayrollStatusLabel status={status} />;
      return (
        <div style={{ minWidth: 100 }}>
          <PayrollStatusLabel status={status} />
          <GenerationProgress jsonExt={payroll.jsonExt} />
        </div>
      );
    },
    (payroll) => (payroll.paymentMethod
      ? `${payroll.paymentMethod}` : ''),
    (payroll) => (
      <Tooltip title={formatMessage('tooltip.viewDetails')}>
        <IconButton
          onClick={() => openPayroll(payroll)}
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
    ),
    (payroll) => (
      <Tooltip title={formatMessage('tooltip.delete')}>
        <IconButton
          onClick={() => onDelete(payroll)}
          disabled={mutationInFlight
            || deletedPayrollUuids.includes(payroll.id)
            || !DELETABLE_STATUSES.includes(payroll.status)}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    ),
    (payroll) => (
      rights.includes(RIGHT_PAYROLL_CREATE) && payroll.status === PAYROLL_STATUS.FAILED && (
        <Tooltip title={formatMessage('tooltip.retrigger')}>
          <IconButton
            onClick={() => onRetrigger(payroll)}
            disabled={mutationInFlight || triggersDown || deletedPayrollUuids.includes(payroll.id)}
          >
            <ReplayIcon />
          </IconButton>
        </Tooltip>
      )
    ),
  ];

  const onDoubleClick = (payroll) => openPayroll(payroll);

  const payrollFilter = ({ filters, onChangeFilters }) => (
    <PayrollFilter filters={filters} onChangeFilters={onChangeFilters} />
  );

  const isRowDisabled = (_, payroll) => deletedPayrollUuids.includes(payroll.id);

  return (
    <Searcher
      module="payroll"
      FilterPane={payrollFilter}
      fetch={fetch}
      items={payrolls}
      itemsPageInfo={pageInfo}
      fetchedItems={fetchedPayrolls}
      fetchingItems={fetchingPayrolls}
      errorItems={errorPayrolls}
      tableTitle={formatMessageWithValues('payrollSearcher.results', { totalCount })}
      headers={headers}
      itemFormatters={itemFormatters}
      sorts={sorts}
      rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      defaultPageSize={DEFAULT_PAGE_SIZE}
      rowIdentifier={rowIdentifier}
      onDoubleClick={onDoubleClick}
      defaultFilters={defaultFilters()}
      rowDisabled={isRowDisabled}
      rowLocked={isRowDisabled}
    />
  );
}

const mapStateToProps = (state) => ({
  fetchingPayrolls: state.payroll.fetchingPayrolls,
  fetchedPayrolls: state.payroll.fetchedPayrolls,
  errorPayrolls: state.payroll.errorPayrolls,
  payrolls: state.payroll.payrolls,
  pageInfo: state.payroll.payrollsPageInfo,
  totalCount: state.payroll.payrollsTotalCount,
  confirmed: state.core.confirmed,
  submittingMutation: state.payroll.submittingMutation,
  mutationInFlight: state.payroll.mutationInFlight,
  mutation: state.payroll.mutation,
  systemStatus: state.payroll.systemStatus,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchPayrolls,
  deletePayrolls,
  retriggerPayroll,
  fetchPayrollSystemStatus,
  journalize,
  clearConfirm,
  coreConfirm,
}, dispatch);

export { PayrollSearcher };
export default connect(mapStateToProps, mapDispatchToProps)(PayrollSearcher);
