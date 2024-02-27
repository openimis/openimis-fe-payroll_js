import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { IconButton, Tooltip } from '@material-ui/core';
import DownloadIcon from '@material-ui/icons/CloudDownload';

import {
  Searcher,
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import {
  DEFAULT_PAGE_SIZE, MODULE_NAME,
  ROWS_PER_PAGE_OPTIONS, PAYROLL_PAYMENT_FILE_STATUS,
} from '../../constants';
import { fetchPayrollPaymentFiles } from '../../actions';
import downloadPayroll from '../../utils/export';

function PayrollPaymentFilesSearcher({
  fetchingPayrollFiles,
  fetchedPayrollFiles,
  errorPayrollFiles,
  files,
  pageInfo,
  totalCount,
  fetchPayrollPaymentFiles,
  payrollUuid,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);

  const headers = () => [
    'payrollPaymentFile.fileName',
    'payrollPaymentFile.status',
    'payrollPaymentFile.error',
    'payrollPaymentFile.download',
  ];

  const defaultFilters = () => {
    const filters = {
      isDeleted: {
        value: false,
        filter: 'isDeleted: false',
      },
    };
    if (payrollUuid) {
      filters.payrollId = {
        value: payrollUuid,
        filter: `payroll_Id: "${payrollUuid}"`,
      };
    }
    return filters;
  };

  const download = (payrollId, fileName) => {
    downloadPayroll(payrollId, fileName, false);
  };

  const fetchFiles = (params) => fetchPayrollPaymentFiles(modulesManager, params);

  const rowIdentifier = (file) => file.fileName;

  const itemFormatters = () => [
    (file) => file.fileName,
    (file) => file.status,
    (file) => file.error,
    (file) => (
      <Tooltip title={formatMessage('tooltip.delete')}>
        <IconButton
          onClick={() => download(payrollUuid, file.fileName)}
          disabled={![PAYROLL_PAYMENT_FILE_STATUS.SUCCESS,
            PAYROLL_PAYMENT_FILE_STATUS.PARTIAL_SUCCESS].includes(file.status)}
        >
          <DownloadIcon />
        </IconButton>
      </Tooltip>
    ),
  ];

  return (
    <Searcher
      module="payroll"
      FilterPane={null}
      fetch={fetchFiles}
      items={files}
      itemsPageInfo={pageInfo}
      fetchedItems={fetchedPayrollFiles}
      fetchingItems={fetchingPayrollFiles}
      errorItems={errorPayrollFiles}
      tableTitle={formatMessageWithValues('payrollPaymentFilesSearcher.results', { totalCount })}
      headers={headers}
      itemFormatters={itemFormatters}
      rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      defaultPageSize={DEFAULT_PAGE_SIZE}
      rowIdentifier={rowIdentifier}
      defaultFilters={defaultFilters()}
    />
  );
}
const mapStateToProps = (state) => ({
  fetchingPayrollFiles: state.payroll.fetchingPayrollFiles,
  fetchedPayrollFiles: state.payroll.fetchedPayrollFiles,
  errorPayrollFiles: state.payroll.errorPayrollFiles,
  files: state.payroll.payrollFiles,
  pageInfo: state.payroll.payrollFilesPageInfo,
  totalCount: state.payroll.payrollFilesTotalCount,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchPayrollPaymentFiles,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(PayrollPaymentFilesSearcher);
