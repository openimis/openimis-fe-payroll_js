import React from 'react';
import _debounce from 'lodash/debounce';

import { FormControlLabel, Grid, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

import {
  TextInput,
  ControlledField,
  useModulesManager,
  useTranslations,
  PublishedComponent,
  decodeId,
} from '@openimis/fe-core';
import {
  CONTAINS_LOOKUP,
  DEFAULT_DEBOUNCE_TIME,
  EMPTY_STRING,
  MODULE_NAME,
} from '../../constants';

const useStyles = makeStyles((theme) => ({
  form: {
    padding: '0 0 10px 0',
    width: '100%',
  },
  item: {
    padding: theme.spacing(1),
  },
}));

function PayrollFilter({
  filters, onChangeFilters,
}) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  const debouncedOnChangeFilters = _debounce(onChangeFilters, DEFAULT_DEBOUNCE_TIME);

  const filterTextFieldValue = (filterName) => filters?.[filterName]?.value ?? EMPTY_STRING;

  const filterValue = (filterName) => filters?.[filterName]?.value ?? null;

  const onChangeStringFilter = (filterName, lookup = null) => (value) => {
    if (lookup) {
      debouncedOnChangeFilters([
        {
          id: filterName,
          value,
          filter: `${filterName}_${lookup}: "${value}"`,
        },
      ]);
    } else {
      debouncedOnChangeFilters([
        {
          id: filterName,
          value,
          filter: `${filterName}: "${value}"`,
        },
      ]);
    }
  };

  return (
    <Grid container className={classes.form}>
      <Grid item xs={3} className={classes.item}>
        <TextInput
          module="payroll"
          label={formatMessage('payroll.name')}
          value={filterTextFieldValue('name')}
          onChange={onChangeStringFilter('name', CONTAINS_LOOKUP)}
        />
      </Grid>
      <ControlledField
        module="payroll"
        id="PayrollFilter.benefitPlan"
        field={(
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="socialProtection.BenefitPlanPicker"
              withNull
              filters={filters}
              value={filterValue('benefitPlan_Id')}
              onChange={(benefitPlan) => onChangeFilters([
                {
                  id: 'benefitPlan_Id',
                  value: benefitPlan,
                  filter: `benefitPlan_Id: "${benefitPlan?.id && decodeId(benefitPlan.id)}"`,
                },
              ])}
            />
          </Grid>
          )}
      />
      <ControlledField
        module="payroll"
        id="PayrollFilter.paymentPoint"
        field={(
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="payroll.PaymentPointPicker"
              withLabel
              withPlaceholder
              filters={filters}
              value={filterValue('paymentPoint_Id')}
              onChange={(paymentPoint) => onChangeFilters([
                {
                  id: 'paymentPoint_Id',
                  value: paymentPoint,
                  filter: `paymentPoint_Id: "${paymentPoint?.id && decodeId(paymentPoint.id)}"`,
                },
              ])}
            />
          </Grid>
          )}
      />
      <ControlledField
        module="payroll"
        id="payrollFilter.showHistory"
        field={(
          <Grid item xs={12} className={classes.item}>
            <FormControlLabel
              control={(
                <Checkbox
                  color="primary"
                  checked={filters?.isDeleted?.value}
                  onChange={() => onChangeFilters([
                    {
                      id: 'isDeleted',
                      value: !filters?.isDeleted?.value,
                      filter: `isDeleted: ${!filters?.isDeleted?.value}`,
                    },
                  ])}
                />
                )}
              label={formatMessage('tooltip.isDeleted')}
            />
          </Grid>
          )}
      />
    </Grid>
  );
}

export default PayrollFilter;
