/* eslint-disable camelcase */
import React from 'react';
import { injectIntl } from 'react-intl';

import { Grid, Divider, LinearProgress } from '@material-ui/core';
import { withStyles, withTheme } from '@material-ui/core/styles';

import {
  formatMessage,
  FormPanel,
  PublishedComponent,
  TextInput,
  withModulesManager,
} from '@openimis/fe-core';
import FilterDialog from './FilterDialog';
import { getProgress } from '../../utils/jsonExt';
import PayrollStatusPicker from './PayrollStatusPicker';
import PaymentMethodPicker from '../../pickers/PaymentMethodPicker';
import { PAYROLL_STATUS } from '../../constants';

const styles = (theme) => ({
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: '100%',
  },
});

class PayrollHeadPanel extends FormPanel {
  render() {
    const {
      edited, classes, intl, readOnly, isPayrollFromFailedInvoices, benefitPlanId,
    } = this.props;
    const payroll = { ...edited };

    let effectiveBenefitPlanId = benefitPlanId;
    if (!effectiveBenefitPlanId && payroll?.paymentPlan?.benefitPlan) {
      const benefitPlan = JSON.parse(payroll.paymentPlan.benefitPlan);
      if (benefitPlan) {
        effectiveBenefitPlanId = JSON.parse(benefitPlan)?.id;
      }
    }
    return (
      <>
        <Grid container className={classes.item}>
          <Grid item xs={3} className={classes.item}>
            <TextInput
              module="payroll"
              label="paymentPoint.name"
              value={payroll?.name}
              required
              onChange={(name) => this.updateAttribute('name', name)}
              readOnly={isPayrollFromFailedInvoices ? !isPayrollFromFailedInvoices : readOnly}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="contributionPlan.PaymentPlanPicker"
              required
              filterLabels={false}
              onChange={(paymentPlan) => this.updateAttribute('paymentPlan', paymentPlan)}
              value={payroll?.paymentPlan}
              readOnly={readOnly}
              benefitPlanId={effectiveBenefitPlanId}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="payroll.PaymentPointPicker"
              withLabel
              withPlaceholder
              filterLabels={false}
              onChange={(paymentPoint) => this.updateAttribute('paymentPoint', paymentPoint)}
              value={payroll?.paymentPoint}
              readOnly={readOnly}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="paymentCycle.PaymentCyclePicker"
              withLabel
              required
              withPlaceholder
              filterLabels={false}
              onChange={(paymentCycle) => this.updateAttribute('paymentCycle', paymentCycle)}
              value={payroll?.paymentCycle}
              readOnly={isPayrollFromFailedInvoices ? !isPayrollFromFailedInvoices : readOnly}
            />
          </Grid>
          {readOnly && !isPayrollFromFailedInvoices && (
            <Grid item xs={3} className={classes.item}>
              <PayrollStatusPicker
                required
                withNull={false}
                readOnly={readOnly}
                value={!!payroll?.status && payroll.status}
              />
            </Grid>
          )}
          <Grid item xs={3} className={classes.item}>
            <PaymentMethodPicker
              required
              withNull={false}
              readOnly={readOnly}
              value={!!payroll?.paymentMethod && payroll.paymentMethod}
              onChange={(paymentMethod) => this.updateAttribute('paymentMethod', paymentMethod)}
              label={formatMessage(intl, 'payroll', 'paymentMethod')}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="core.DatePicker"
              module="payroll"
              label="payroll.dateValidFrom"
              required
              value={payroll.dateValidFrom ? payroll.dateValidFrom : null}
              onChange={(v) => this.updateAttribute('dateValidFrom', v)}
              readOnly={readOnly}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="core.DatePicker"
              module="payroll"
              label="payroll.dateValidTo"
              required
              value={payroll.dateValidTo ? payroll.dateValidTo : null}
              onChange={(v) => this.updateAttribute('dateValidTo', v)}
              readOnly={readOnly}
            />
          </Grid>
        </Grid>
        {payroll?.status === PAYROLL_STATUS.GENERATING && (
          <div style={{ padding: '0 16px 16px 16px' }}>
            <LinearProgress variant="determinate" value={getProgress(payroll.jsonExt)} />
          </div>
        )}
        <Divider />
        {!isPayrollFromFailedInvoices && (
          <FilterDialog
            object={payroll?.paymentPlan?.benefitPlan
              ? JSON.parse(JSON.parse(payroll.paymentPlan.benefitPlan))
              : null}
            objectToSave={payroll}
            moduleName="social_protection"
            objectType="BenefitPlan"
            updateAttribute={this.updateAttribute}
            readOnly={readOnly}
            benefitPlanId={effectiveBenefitPlanId}
          />
        )}
      </>
    );
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(PayrollHeadPanel))));
