import React, { useEffect, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { IconButton, Tooltip } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';

import {
  Searcher,
  useHistory,
  useModulesManager,
  useTranslations,
  PublishedComponent,
} from '@openimis/fe-core';
import { fetchPayrollBills } from '../../actions';
import {
  DEFAULT_PAGE_SIZE,
  GET_SUBJECT_AND_THIRDPARTY_TYPE_PICKER_REF,
  INVOICE_BILL_ROUTE,
  RIGHT_BILL_SEARCH,
  RIGHT_BILL_UPDATE,
  ROWS_PER_PAGE_OPTIONS,
} from '../../constants';
import PayrollBillFilter from './PayrollBillFilter';

function PayrollBillSearcher({
  rights,
  fetchPayrollBills,
  fetchingBills,
  fetchedBills,
  errorBills,
  bills,
  billsPageInfo,
  billsTotalCount,
}) {
  const history = useHistory();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('payroll', modulesManager);

  const openBill = (bill) => {
    console.log('RES', bill);
    console.log(modulesManager.getRef(INVOICE_BILL_ROUTE));
    rights.includes(RIGHT_BILL_SEARCH) && history.push(
      `/${modulesManager.getRef(INVOICE_BILL_ROUTE)}/${bill?.id}`,
    );
  }

  const onDoubleClick = (bill) => openBill(bill);

  const [payrollUuid, setPayrollUuid] = useState('');

  const fetch = (params) => {
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/');
    const payrollIndex = pathSegments.indexOf('payroll');
    if (payrollIndex !== -1 && payrollIndex < pathSegments.length - 1) {
      const uuid = pathSegments[payrollIndex + 1];
      const index = params.findIndex((element) => element.startsWith("payrollUuid:"));
      if (index !== -1) {
        params[index] = `payrollUuid: "${uuid}"`;
      }
      fetchPayrollBills(modulesManager, params);
    }
  }

  const headers = () => {
    const headers = [
      'bills.subject',
      'bills.thirdparty',
      'bills.code',
      'bills.dateBill',
      'bills.amountTotal',
      'bills.status.label',
    ];
    if (rights.includes(RIGHT_BILL_UPDATE)) {
      headers.push('emptyLabel');
    }
    return headers;
  };

  const getSubjectAndThirdpartyTypePicker = modulesManager.getRef(GET_SUBJECT_AND_THIRDPARTY_TYPE_PICKER_REF);

  const itemFormatters = () => {
    const formatters = [
      (bill) => getSubjectAndThirdpartyTypePicker(modulesManager, bill?.subjectTypeName, bill?.subject),
      (bill) => getSubjectAndThirdpartyTypePicker(modulesManager, bill?.thirdpartyTypeName, bill?.thirdparty),
      (bill) => bill?.code,
      (bill) => bill?.dateBill,
      (bill) => bill?.amountTotal,
      (bill) => (
        <PublishedComponent
          pubRef="invoice.InvoiceStatusPicker"
          module="payroll"
          label="status"
          value={bill?.status}
          readOnly
        />
      ),
    ];
    if (rights.includes(RIGHT_BILL_UPDATE)) {
      formatters.push((bill) => (
        <Tooltip title={formatMessage('tooltip.edit')}>
          <IconButton
            onClick={() => openBill(bill)}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      ));
    }
    return formatters;
  };

  const rowIdentifier = (bill) => bill.id;

  const sorts = () => [
    ['subjectType', true],
    ['thirdpartyType', true],
    ['code', true],
    ['dateBill', true],
    ['amountTotal', true],
    ['status', true],
  ];

  const defaultFilters = () => {
    return ({
      isDeleted: {
        value: false,
        filter: 'isDeleted: false',
      },
      payrollUuid: {
        value: payrollUuid,
        filter: `payrollUuid: "${payrollUuid}"`,
    },
  });
  }

  return (
    <div>
      <Searcher
        module="payroll"
        FilterPane={PayrollBillFilter}
        fetch={fetch}
        items={bills}
        itemsPageInfo={billsPageInfo}
        fetchingItems={fetchingBills}
        fetchedItems={fetchedBills}
        errorItems={errorBills}
        tableTitle={formatMessageWithValues('bills.searcherResultsTitle', { billsTotalCount })}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        defaultPageSize={DEFAULT_PAGE_SIZE}
        rowIdentifier={rowIdentifier}
        onDoubleClick={onDoubleClick}
        defaultFilters={defaultFilters()}
      />
    </div>
  );
}

const mapStateToProps = (state) => ({
  fetchingBills: state.payroll.fetchingPayrollBills,
  fetchedBills: state.payroll.fetchedPayrollBills,
  errorBills: state.payroll.errorPayrollBills,
  bills: state.payroll.payrollBills,
  billsPageInfo: state.payroll.payrollBillsPageInfo,
  billsTotalCount: state.payroll.payrollBillsTotalCount,
});

const mapDispatchToProps = (dispatch) => bindActionCreators(
  { fetchPayrollBills },
  dispatch,
);

export default connect(mapStateToProps, mapDispatchToProps)(PayrollBillSearcher);
