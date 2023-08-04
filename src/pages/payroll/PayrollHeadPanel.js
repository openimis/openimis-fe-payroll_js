import React from 'react';
import { injectIntl } from 'react-intl';

import { Grid } from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';

import {
  TextInput,
  FormPanel,
  withModulesManager,
  PublishedComponent,
  ControlledField,
  formatMessage,
} from '@openimis/fe-core';
import AdvancedFiltersDialog from '../../components/payroll/AdvancedFiltersDialog';
import { CLEARED_STATE_FILTER } from '../../constants';
import { isEmptyObject } from '../../utils/advanced-filters-utils';

const styles = (theme) => ({
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: '100%',
  },
});

class PayrollHeadPanel extends FormPanel {
  constructor(props) {
    super(props);
    this.state = {
      appliedCustomFilters: [CLEARED_STATE_FILTER],
      appliedFiltersRowStructure: [CLEARED_STATE_FILTER],
    };
  }

  updateJsonExt = (value) => {
    this.updateAttributes({
        "jsonExt": value
    })
  };
  
  getDefaultAppliedCustomFilters = () => {
    const { jsonExt } = this.props?.edited ?? {};
    try {
      const jsonData = JSON.parse(jsonExt);
      const advancedCriteria = jsonData.advanced_criteria || [];
      const parsedFilters = advancedCriteria.map(({ custom_filter_condition }) => {
        const [field, filter, typeValue] = custom_filter_condition.split('__');
        const [type, value] = typeValue.split('=');
        return {
          custom_filter_condition,
          field,
          filter,
          type,
          value
        };
      });
      return parsedFilters;
    } catch (error) {
      return [];
    }
  };

  setAppliedCustomFilters = (appliedCustomFilters) => {
    this.setState({ appliedCustomFilters: appliedCustomFilters });
  };

  setAppliedFiltersRowStructure = (appliedFiltersRowStructure) => {
    this.setState({ appliedFiltersRowStructure: appliedFiltersRowStructure });
  };
  
  render() {
    const { edited, classes, intl } = this.props;
    const payroll = { ...edited };
    const { appliedCustomFilters, appliedFiltersRowStructure } = this.state;
    const readOnly = Boolean(payroll?.id);
    return (
      <>
        {payroll !== undefined && ( 
          <AdvancedFiltersDialog
            object={payroll.benefitPlan}
            objectToSave={payroll}
            moduleName="social_protection"
            objectType="BenefitPlan"
            setAppliedCustomFilters={this.setAppliedCustomFilters}
            appliedCustomFilters={appliedCustomFilters}
            appliedFiltersRowStructure={appliedFiltersRowStructure}
            setAppliedFiltersRowStructure={this.setAppliedFiltersRowStructure}
            updateAttributes={this.updateJsonExt}
            getDefaultAppliedCustomFilters={this.getDefaultAppliedCustomFilters}
            readOnly={readOnly}
          />
        )}
        <Grid container className={classes.item}>
          <Grid item xs={3} className={classes.item}>
            <TextInput
              module="payroll"
              label={formatMessage(intl, "payroll", "paymentPoint.name")}
              value={payroll?.name}
              required
              onChange={(name) => this.updateAttribute('name', name)}
              readOnly={readOnly}
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
                  required
                  filterLabels={false}
                  onChange={(benefitPlan) => this.updateAttribute('benefitPlan', benefitPlan)}
                  value={payroll?.benefitPlan}
                  readOnly={readOnly}
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
                  required
                  filterLabels={false}
                  onChange={(paymentPoint) => this.updateAttribute('paymentPoint', paymentPoint)}
                  value={payroll?.paymentPoint}
                  readOnly={readOnly}
                />
              </Grid>
            )}
          />
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="core.DatePicker"
              module="payroll"
              label="dateValidFrom"
              required
              value={!!payroll.dateValidFrom ? payroll.dateValidFrom : null}
              onChange={(v) => this.updateAttribute("dateValidFrom", v)}
              readOnly={readOnly}
            />
            </Grid>
            <Grid item xs={3} className={classes.item}>
              <PublishedComponent
                pubRef="core.DatePicker"
                module="payroll"
                label="dateValidTo"
                value={!!payroll.dateValidTo ? payroll.dateValidTo : null}
                onChange={(v) => this.updateAttribute("dateValidTo", v)}
                readOnly={readOnly}
              />
          </Grid>
        </Grid>
      </>
    );
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(PayrollHeadPanel))));
