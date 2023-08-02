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

  const filterValue = (filterName) => filters?.[filterName]?.value ?? null;

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
      <ControlledField
        module="payroll"
        id="PaymentPointFilter.location"
        field={(
          <Grid xs={12}>
            <PublishedComponent
              pubRef="location.DetailedLocationFilter"
              withNull
              filters={filters}
              onChangeFilters={onChangeFilters}
              anchor="parentLocation"
            />
          </Grid>
          )}
      />
      <ControlledField
        module="payroll"
        id="admin.PaymentPointManagerPicker"
        field={(
          <Grid className={classes.item} xs={3}>
            <PublishedComponent
              pubRef="admin.PaymentPointManagerPicker"
              value={filterValue('ppm_Id')}
              withPlaceholder
              withLabel
              onChange={(manager) => onChangeFilters([
                {
                  id: 'ppm_Id',
                  value: manager,
                  filter: `ppm_Id: "${manager?.iUser?.id}"`,
                },
              ])}
            />
          </Grid>
          )}
      />
      <Grid xs={3} className={classes.item}>
        <TextInput
          module="payroll"
          label={formatMessage('paymentPoint.name')}
          value={filterTextFieldValue('name')}
          onChange={onChangeStringFilter('name', CONTAINS_LOOKUP)}
        />
      </Grid>
      <ControlledField
        module="payroll"
        id="paymentPointFilter.isDeleted"
        field={(
          <Grid xs={12} className={classes.item}>
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

export default PaymentPointFilter;
