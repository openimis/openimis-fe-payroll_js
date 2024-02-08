/* eslint-disable no-param-reassign */
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Button from '@material-ui/core/Button';
import {
  Searcher, useModulesManager, useTranslations,
} from '@openimis/fe-core';
import PhotoCameraOutlinedIcon from '@material-ui/icons/PhotoCameraOutlined';
import { fetchBenefitAttachments } from '../../actions';
import { DEFAULT_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS } from '../../constants';
import BenefitConsumptionFilterModal from './BenefitConsumptionFilterModal';

function BenefitConsumptionSearcherModal({
  fetchBenefitAttachments,
  fetchingBenefitAttachments,
  fetchedBenefitAttachments,
  errorBenefitAttachments,
  benefitAttachments,
  benefitAttachmentsPageInfo,
  benefitAttachmentsTotalCount,
  payrollUuid,
  reconciledMode,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('payroll', modulesManager);

  const fetch = (params) => {
    fetchBenefitAttachments(modulesManager, params);
  };

  const headers = () => [
    'benefitConsumption.photo',
    'benefitConsumption.individual.firstName',
    'benefitConsumption.individual.lastName',
    'benefitConsumption.amount',
    'benefitConsumption.receipt',
    'benefitConsumption.dateDue',
    '',
  ];

  const itemFormatters = () => [
    (benefitAttachment) => (
      benefitAttachment.benefit.receipt ? (
        <PhotoCameraOutlinedIcon fontSize="large" />
      ) : null
    ),
    (benefitAttachment) => benefitAttachment?.benefit?.individual?.firstName,
    (benefitAttachment) => benefitAttachment?.benefit?.individual?.lastName,
    (benefitAttachment) => benefitAttachment?.bill?.amountTotal,
    (benefitAttachment) => benefitAttachment?.benefit?.receipt,
    (benefitAttachment) => benefitAttachment?.benefit?.dateDue,
    (benefitAttachment) => (
      <Button
        onClick={() => {}}
        variant="contained"
        color="primary"
        disabled={!!benefitAttachment.benefit.receipt}
      >
        {formatMessage('payroll.summary.confirm')}
      </Button>
    ),
  ];

  const rowIdentifier = (benefitAttachment) => benefitAttachment.id;

  const sorts = () => [
    ['benefit_photo', false],
    ['benefit_individual_FirstName', true],
    ['benefit_individual_LastName', true],
    ['bill_amountTotal', true],
    ['benefit_receipt', true],
    ['benefit_dateDue', true],
  ];

  const defaultFilters = () => {
    const filters = {
      isDeleted: {
        value: false,
        filter: 'isDeleted: false',
      },
      payrollUuid: {
        value: payrollUuid,
        filter: `payrollUuid: "${payrollUuid}"`,
      },
    };
    if (reconciledMode) {
      filters.benefit_Status = {
        value: 'RECONCILED',
        filter: 'benefit_Status: "RECONCILED"',
      };
    }
    return filters;
  };

  const benefitConsumptionFilterModal = ({ filters, onChangeFilters }) => (
    <BenefitConsumptionFilterModal filters={filters} onChangeFilters={onChangeFilters} />
  );

  return (
    <div>
      <Searcher
        module="payroll"
        FilterPane={benefitConsumptionFilterModal}
        fetch={fetch}
        items={benefitAttachments}
        itemsPageInfo={benefitAttachmentsPageInfo}
        fetchingItems={fetchingBenefitAttachments}
        fetchedItems={fetchedBenefitAttachments}
        errorItems={errorBenefitAttachments}
        tableTitle={
          formatMessageWithValues('benefitAttachment.searcherResultsTitle', { benefitAttachmentsTotalCount })
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
  fetchingBenefitAttachments: state.payroll.fetchingBenefitAttachments,
  fetchedBenefitAttachments: state.payroll.fetchedBenefitAttachments,
  errorBenefitAttachments: state.payroll.errorBenefitAttachments,
  benefitAttachments: state.payroll.benefitAttachments,
  benefitAttachmentsPageInfo: state.payroll.benefitAttachmentsPageInfo,
  benefitAttachmentsTotalCount: state.payroll.benefitAttachmentsTotalCount,
});

const mapDispatchToProps = (dispatch) => bindActionCreators(
  { fetchBenefitAttachments },
  dispatch,
);

export default connect(mapStateToProps, mapDispatchToProps)(BenefitConsumptionSearcherModal);
