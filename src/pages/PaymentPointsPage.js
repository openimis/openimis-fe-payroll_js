import React from 'react';
import { useSelector } from 'react-redux';

import { makeStyles } from '@material-ui/styles';

import {
  Helmet,
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import PaymentPointSearcher from '../components/payment-point/PaymentPointSearcher';

import {
  MODULE_NAME,
  RIGHT_PAYMENT_POINT_SEARCH,
} from '../constants';

const useStyles = makeStyles((theme) => ({
  page: theme.page,
}));

function PaymentPointsPage() {
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const rights = useSelector((store) => store.core.user.i_user.rights ?? []);
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage('paymentPoint.page.title')} />
      {rights.includes(RIGHT_PAYMENT_POINT_SEARCH)
        && <PaymentPointSearcher />}
    </div>
  );
}

export default PaymentPointsPage;
