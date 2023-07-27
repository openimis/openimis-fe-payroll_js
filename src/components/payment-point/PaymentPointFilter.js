import React from 'react';
import _debounce from 'lodash/debounce';

import { FormControlLabel, Grid, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

import {
  TextInput,
  ControlledField,
  useModulesManager,
  useTranslations,
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

function PaymentPointFilter({
  filters, onChangeFilters,
}) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  const debouncedOnChangeFilters = _debounce(onChangeFilters, DEFAULT_DEBOUNCE_TIME);

  const filterTextFieldValue = (filterName) => filters?.[filterName]?.value ?? EMPTY_STRING;

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
      <Grid item xs={2} className={classes.item}>
        <TextInput
          module="payroll"
          label={formatMessage('paymentPoint.code')}
          value={filterTextFieldValue('code')}
          onChange={onChangeStringFilter('code', CONTAINS_LOOKUP)}
        />
      </Grid>
      <Grid item xs={2} className={classes.item}>
        <TextInput
          module="payroll"
          label={formatMessage('paymentPoint.location')}
          value={filterTextFieldValue('location')}
          onChange={onChangeStringFilter('location', CONTAINS_LOOKUP)}
        />
      </Grid>
      <ControlledField
        module="payroll"
        id="paymentPointFilter.showHistory"
        field={(
          <Grid item xs={12} className={classes.item}>
            <FormControlLabel
              control={(
                <Checkbox
                  color="primary"
                  checked={filters?.showHistory?.value}
                  onChange={() => onChangeFilters([
                    {
                      id: 'showHistory',
                      value: !filters?.showHistory?.value,
                      filter: `showHistory: ${!filters?.showHistory?.value}`,
                    },
                  ])}
                />
                )}
              label={formatMessage('tooltip.showHistory')}
            />
          </Grid>
          )}
      />
    </Grid>
  );
}

export default PaymentPointFilter;
