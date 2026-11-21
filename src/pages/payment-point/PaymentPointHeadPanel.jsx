import React from 'react';

import { Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

import {
  TextInput,
  FormPanel,
  withModulesManager,
  PublishedComponent,
  GRID_RESPONSIVE_STANDARD,
  injectIntl,
} from '@openimis/fe-core';
import { MAX_LENGTH } from '../../constants';

const StyledPaymentPointHeadPanel = styled('div')(({ theme }) => ({
  '& .item': {
    padding: theme.spacing(1),
    ...(theme.paper?.item ?? {}),
  },
}));

class PaymentPointHeadPanel extends FormPanel {
  render() {
    const { edited, readOnly } = this.props;
    const paymentPoint = { ...edited };
    return (
      <StyledPaymentPointHeadPanel>
        <Grid container>
          <Grid size={12}>
            <PublishedComponent
              pubRef="location.DetailedLocation"
              withNull
              required
              readOnly={readOnly}
              filterLabels={false}
              value={paymentPoint?.location}
              onChange={(locations) => this.updateAttribute('location', locations)}
            />
          </Grid>
          <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
            <PublishedComponent
              pubRef="admin.PaymentPointManagerPicker"
              required
              withPlaceholder
              withLabel
              readOnly={readOnly}
              value={paymentPoint?.ppm}
              onChange={(ppm) => this.updateAttribute('ppm', ppm)}
            />
          </Grid>
          <Grid size={GRID_RESPONSIVE_STANDARD} className="item">
            <TextInput
              module="payroll"
              label="paymentPoint.name"
              required
              readOnly={readOnly}
              inputProps={{ maxLength: MAX_LENGTH.NAME }}
              value={paymentPoint?.name}
              onChange={(name) => this.updateAttribute('name', name)}
            />
          </Grid>
        </Grid>
      </StyledPaymentPointHeadPanel>
    );
  }
}

export { StyledPaymentPointHeadPanel };
export default withModulesManager(injectIntl(PaymentPointHeadPanel));
