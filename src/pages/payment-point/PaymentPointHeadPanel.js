import React from 'react';
import { injectIntl } from 'react-intl';

import { Grid } from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';

import {
  FormPanel,
  withModulesManager,
} from '@openimis/fe-core';

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
    console.log(paymentPoint);
    return (
      <Grid container className={classes.item}>
        <Grid item xs={3} className={classes.item}>
          TextFields
        </Grid>
      </Grid>
    );
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(PaymentPointHeadPanel))));
