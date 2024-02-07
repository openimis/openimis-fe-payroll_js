/* eslint-disable import/prefer-default-export */
/* eslint-disable camelcase */

import React from 'react';

import { PinDrop } from '@material-ui/icons';

import { FormattedMessage } from '@openimis/fe-core';
import { RIGHT_PAYMENT_POINT_SEARCH, RIGHT_PAYROLL_SEARCH } from './constants';
import reducer from './reducer';
import messages_en from './translations/en.json';
import PaymentPointPage from './pages/payment-point/PaymentPointPage';
import PaymentPointsPage from './pages/payment-point/PaymentPointsPage';
import PayrollPage from './pages/payroll/PayrollPage';
import PayrollsPage from './pages/payroll/PayrollsPage';
import ApprovedPayrollsPage from './pages/payroll/ApprovedPayrollsPage';
import PaymentPointPicker from './components/payment-point/PaymentPointPicker';
import {
  PayrollTaskItemFormatters,
  PayrollTaskTableHeaders,
} from './components/tasks/PayrollTasks';
import {
  PayrollReconciliationTaskItemFormatters,
  PayrollReconciliationTaskTableHeaders,
} from './components/tasks/PayrollReconciliationTasks';
import {BenefitConsumptionsTabLabel, BenefitConsumptionsTabPanel} from "./pages/payroll/BenefitConsumptionTabPanel";

const ROUTE_PAYMENT_POINTS = 'paymentPoints';
const ROUTE_PAYMENT_POINT = 'paymentPoints/paymentPoint';
const ROUTE_PAYROLLS = 'payrolls';
const ROUTE_PAYROLLS_APPROVED = 'payrollsApproved';
const ROUTE_PAYROLL = 'payrolls/payroll';

const DEFAULT_CONFIG = {
  translations: [{ key: 'en', messages: messages_en }],
  reducers: [{ key: 'payroll', reducer }],
  refs: [
    { key: 'payroll.route.paymentPoints', ref: ROUTE_PAYMENT_POINTS },
    { key: 'payroll.route.paymentPoint', ref: ROUTE_PAYMENT_POINT },
    { key: 'payroll.route.payrolls', ref: ROUTE_PAYROLLS },
    { key: 'payroll.route.payrollsApproved', ref: ROUTE_PAYROLLS_APPROVED },
    { key: 'payroll.route.payroll', ref: ROUTE_PAYROLL },
    { key: 'payroll.PaymentPointPicker', ref: PaymentPointPicker },
    { key: 'payroll.PaymentPointPicker.projection', ref: ['id', 'name', 'location'] },
  ],
  'core.Router': [
    { path: ROUTE_PAYMENT_POINTS, component: PaymentPointsPage },
    { path: `${ROUTE_PAYMENT_POINT}/:payment_point_uuid?`, component: PaymentPointPage },
    { path: ROUTE_PAYROLLS, component: PayrollsPage },
    { path: ROUTE_PAYROLLS_APPROVED, component: ApprovedPayrollsPage },
    { path: `${ROUTE_PAYROLL}/:payroll_uuid?`, component: PayrollPage },
  ],
  'invoice.MainMenu': [
    {
      text: <FormattedMessage module="payroll" id="payroll.paymentPoint.route" />,
      icon: <PinDrop />,
      route: `/${ROUTE_PAYMENT_POINTS}`,
      filter: (rights) => rights.includes(RIGHT_PAYMENT_POINT_SEARCH),
    },
    {
      text: <FormattedMessage module="payroll" id="payroll.payroll.route" />,
      icon: <PinDrop />,
      route: `/${ROUTE_PAYROLLS}`,
      filter: (rights) => rights.includes(RIGHT_PAYROLL_SEARCH),
    },
    {
      text: <FormattedMessage module="payroll" id="payroll.route.payrollsApproved" />,
      icon: <PinDrop />,
      route: `/${ROUTE_PAYROLLS_APPROVED}`,
      filter: (rights) => rights.includes(RIGHT_PAYROLL_SEARCH),
    },
  ],
  'payroll.TabPanel.label': [BenefitConsumptionsTabLabel],
  'payroll.TabPanel.panel': [BenefitConsumptionsTabPanel],
  'tasksManagement.tasks': [{
    text: <FormattedMessage module="payroll" id="payroll.tasks.update.title" />,
    tableHeaders: PayrollTaskTableHeaders,
    itemFormatters: PayrollTaskItemFormatters,
    taskSource: ['payroll'],
  },
  {
    text: <FormattedMessage module="payroll" id="payroll.tasks.reconciliation.title" />,
    tableHeaders: PayrollReconciliationTaskTableHeaders,
    itemFormatters: PayrollReconciliationTaskItemFormatters,
    taskSource: ['payroll_reconciliation'],
  }],
};

export const PayrollModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });
