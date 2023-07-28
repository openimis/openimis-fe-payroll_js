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
} from '@openimis/fe-core';

const styles = (theme) => ({
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: '100%',
  },
});

class PayrollHeadPanel extends FormPanel {
  render() {
    const { edited, classes } = this.props;
    const payroll = { ...edited };
    return (
      <Grid container className={classes.item}>
        <Grid item xs={3} className={classes.item}>
        <TextInput
          module="payroll"
          label="paymentPoint.name"
          value={payroll?.name}
          required
          onChange={(name) => this.updateAttribute('name', name)}
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
            />
          </Grid>
          )}
      />
      <ControlledField
        module="payroll"
        id="PayrollFilter.paymentPlan"
        field={(
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="contributionPlan.PaymentPlanPicker"
              withNull
              required
              filterLabels={false}
              onChange={(paymentPlan) => this.updateAttribute('paymentPlan', paymentPlan)}
              value={payroll?.paymentPlan}
            />
          </Grid>
          )}
      />
      </Grid>
    );
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(PayrollHeadPanel))));
