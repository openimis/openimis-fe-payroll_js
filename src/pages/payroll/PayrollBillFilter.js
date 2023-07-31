import React from 'react';
import _debounce from 'lodash/debounce';

import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

import {
  PublishedComponent,
  useModulesManager,
  useTranslations,
  TextInput,
  NumberInput,
} from '@openimis/fe-core';
import { CONTAINS_LOOKUP, DEFAULT_DEBOUNCE_TIME } from '../../constants';

const useStyles = makeStyles((theme) => ({
  form: {
    padding: 0,
  },
  item: {
    padding: theme.spacing(1),
  },
}));

function PayrollBillFilter({ filters, onChangeFilters }) {
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const { formatMessage } = useTranslations('payroll', modulesManager);

  const debouncedOnChangeFilters = _debounce(onChangeFilters, DEFAULT_DEBOUNCE_TIME);

  const filterValue = (filterName) => filters?.[filterName]?.value;

  const filterTextFieldValue = (filterName) => (filters[filterName] ? filters[filterName].value : '');

  const onChangeFilter = (filterName) => (value) => {
    debouncedOnChangeFilters([
      {
        id: filterName,
        value: value || null,
        filter: `${filterName}: ${value}`,
      },
    ]);
  };

  const onChangeStringFilter = (filterName, lookup = null) => (value) => {
    if (lookup) {
      debouncedOnChangeFilters([
        {
          id: filterName,
          value,
          filter: `${filterName}_${lookup}: "${value}"`,
        },
      ]);
    }

    onChangeFilters([
      {
        id: filterName,
        value,
        filter: `${filterName}: "${value}"`,
      },
    ]);
  };

  return (
    <Grid container className={classes.form}>
      <Grid item xs={2} className={classes.item}>
        <PublishedComponent
          pubRef="invoice.SubjectTypePickerBill"
          module="payroll"
          label={formatMessage('bills.subject')}
          withNull
          nullLabel={formatMessage('tooltip.any')}
          value={filterValue('subjectType')}
          onChange={onChangeStringFilter('subjectType')}
        />
      </Grid>
      <Grid item xs={2} className={classes.item}>
        <PublishedComponent
          pubRef="invoice.ThirdPartyTypePickerBill"
          module="payroll"
          label={formatMessage('bills.thirdparty')}
          withNull
          nullLabel={formatMessage('tooltip.any')}
          value={filterValue('thirdpartyType')}
          onChange={onChangeStringFilter('thirdpartyType')}
        />
      </Grid>
      <Grid item xs={2} className={classes.item}>
        <TextInput
          module="payroll"
          label="bills.code"
          value={filterTextFieldValue('code')}
          onChange={onChangeStringFilter('code', CONTAINS_LOOKUP)}
        />
      </Grid>
      <Grid item xs={2} className={classes.item}>
        <PublishedComponent
          pubRef="core.DatePicker"
          module="payroll"
          label={formatMessage('bills.dateBill')}
          value={filterValue('dateBill')}
          onChange={(v) => onChangeFilters([
            {
              id: 'dateBill',
              value: v,
              filter: `dateBill: "${v}"`,
            },
          ])}
        />
      </Grid>
      <Grid item xs={2} className={classes.item}>
        <PublishedComponent
          pubRef="invoice.InvoiceStatusPicker"
          module="payroll"
          label={formatMessage('bills.status.label')}
          withNull
          nullLabel={formatMessage('tooltip.any')}
          value={filterValue('status')}
          onChange={(value) => onChangeFilters([
            {
              id: 'status',
              value,
              filter: `status: "${value}"`,
            },
          ])}
        />
      </Grid>
      <Grid item xs={2} className={classes.item}>
        <NumberInput
          module="payroll"
          label={formatMessage('bills.amountTotal')}
          min={0}
          value={filterValue('amountTotal')}
          onChange={onChangeFilter('amountTotal')}
        />
      </Grid>
    </Grid>
  );
}

export default PayrollBillFilter;
