/* eslint-disable import/prefer-default-export */
/* eslint-disable camelcase */

import React from 'react';

import { PinDrop } from '@material-ui/icons';

import { FormattedMessage } from '@openimis/fe-core';
import { RIGHT_PAYMENT_POINT_SEARCH } from './constants';
import reducer from './reducer';
import messages_en from './translations/en.json';
import PaymentPointPage from './pages/payment-point/PaymentPointPage';
import PaymentPointsPage from './pages/payment-point/PaymentPointsPage';

const ROUTE_PAYMENT_POINTS = 'paymentPoints';
const ROUTE_PAYMENT_POINT = 'paymentPoints/paymentPoint';

const DEFAULT_CONFIG = {
  translations: [{ key: 'en', messages: messages_en }],
  reducers: [{ key: 'payroll', reducer }],
  refs: [
    { key: 'payroll.route.paymentPoints', ref: ROUTE_PAYMENT_POINTS },
    { key: 'payroll.route.paymentPoint', ref: ROUTE_PAYMENT_POINT },
  ],
  'core.Router': [
    { path: ROUTE_PAYMENT_POINTS, component: PaymentPointsPage },
    { path: `${ROUTE_PAYMENT_POINT}/:payment_point_uuid?`, component: PaymentPointPage },
  ],
  'invoice.MainMenu': [
    {
      text: <FormattedMessage module="payroll" id="payroll.paymentPoint.route" />,
      icon: <PinDrop />,
      route: `/${ROUTE_PAYMENT_POINTS}`,
      filter: (rights) => rights.includes(RIGHT_PAYMENT_POINT_SEARCH),
    },
  ],
};

export const PayrollModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });
