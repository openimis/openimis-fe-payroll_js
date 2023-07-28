import React from 'react';
import { injectIntl } from 'react-intl';

import { Grid } from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';

import {
  TextInput,
  FormPanel,
  withModulesManager,
  PublishedComponent,
} from '@openimis/fe-core';
import { MAX_LENGTH } from '../../constants';

const styles = (theme) => ({
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: '100%',
  },
});

class PaymentPointHeadPanel extends FormPanel {
  render() {
    const { edited, classes } = this.props;
    const paymentPoint = { ...edited };
    return (
      <Grid container className={classes.item}>
        <Grid xs={12}>
          <PublishedComponent
            pubRef="location.DetailedLocation"
            withNull
            required
            filterLabels={false}
            value={paymentPoint?.locations}
            onChange={(locations) => this.updateAttribute('locations', locations)}
          />
        </Grid>
        <Grid xs={3} className={classes.item}>
          <TextInput
            module="payroll"
            label="paymentPoint.name"
            required
            inputProps={{ maxLength: MAX_LENGTH.NAME }}
            value={paymentPoint?.name}
            onChange={(name) => this.updateAttribute('name', name)}
          />
        </Grid>
      </Grid>
    );
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(PaymentPointHeadPanel))));
