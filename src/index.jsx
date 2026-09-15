/* eslint-disable import/prefer-default-export */
/* eslint-disable camelcase */

import {
  RIGHT_PAYMENT_POINT_CREATE,
  RIGHT_PAYMENT_POINT_SEARCH,
  RIGHT_PAYROLL_CREATE,
  RIGHT_PAYROLL_SEARCH,
} from './constants';
import reducer from './reducer';
import messages_en from './translations/en.json';
import PaymentPointPage from './pages/payment-point/PaymentPointPage';
import PaymentPointsPage from './pages/payment-point/PaymentPointsPage';
import PayrollPage from './pages/payroll/PayrollPage';
import PayrollsPage from './pages/payroll/PayrollsPage';
import ApprovedPayrollsPage from './pages/payroll/ApprovedPayrollsPage';
import ReconciledPayrollsPage from './pages/payroll/ReconciledPayrollsPage';
import PaymentPointPicker from './components/payment-point/PaymentPointPicker';
import BenefitConsumptionPayrollSearcher from './components/payroll/BenefitConsumptionPayrollSearcher';
import {
  PayrollTaskItemFormatters,
  PayrollTaskTableHeaders,
} from './components/tasks/PayrollTasks';
import {
  PayrollReconciliationTaskItemFormatters,
  PayrollReconciliationTaskTableHeaders,
} from './components/tasks/PayrollReconciliationTasks';
import {
  BenefitConsumptionsTabLabel,
  BenefitConsumptionsTabPanel,
} from './components/payroll/BenefitConsumptionTabPanel';
import {
  PayrollRejectedTaskItemFormatters,
  PayrollRejectedTaskTableHeaders,
} from './components/tasks/PayrollRejectedTasks';
import {
  PayrollTaskTabLabel,
  PayrollTaskTabPanel,
} from './components/payroll/PayrollTaskTabPanel';
import { PayrollDeleteTaskItemFormatters, PayrollDeleteTaskTableHeaders } from './components/tasks/PayrollDeleteTasks';
import { PayrollPaymentFilesTabLabel, PayrollPaymentFilesTabPanel } from './components/payroll/PayrollPaymentFilesTab';
import PendingPayrollsPage from './pages/payroll/PendingPayrollsPage';

const ROUTE_PAYMENT_POINTS = 'paymentPoints';
const ROUTE_PAYMENT_POINT = 'paymentPoints/paymentPoint';
const ROUTE_PAYROLLS = 'payrolls';
const ROUTE_PAYROLLS_APPROVED = 'payrollsApproved';
const ROUTE_PAYROLLS_PENDING = 'payrollsPending';
const ROUTE_PAYROLLS_RECONCILED = 'payrollsReconciled';
const ROUTE_PAYROLL = 'payrolls/payroll';

const DEFAULT_CONFIG = {
  translations: [{ key: 'en', messages: messages_en }],
  reducers: [{ key: 'payroll', reducer }],
  refs: [
    { key: 'payroll.route.paymentPoints', ref: ROUTE_PAYMENT_POINTS },
    { key: 'payroll.route.paymentPoint', ref: ROUTE_PAYMENT_POINT },
    { key: 'payroll.route.payrolls', ref: ROUTE_PAYROLLS },
    { key: 'payroll.route.payrollsApproved', ref: ROUTE_PAYROLLS_APPROVED },
    { key: 'payroll.route.payrollsPending', ref: ROUTE_PAYROLLS_PENDING },
    { key: 'payroll.route.payrollsReconciled', ref: ROUTE_PAYROLLS_RECONCILED },
    { key: 'payroll.route.payroll', ref: ROUTE_PAYROLL },
    { key: 'payroll.PaymentPointPicker', ref: PaymentPointPicker },
    { key: 'payroll.PaymentPointPicker.projection', ref: ['id', 'name', 'location'] },
    { key: 'payroll.benefitConsumptionPayrollSearcher', ref: BenefitConsumptionPayrollSearcher },
    { key: 'payroll.payrollCreateRight', ref: RIGHT_PAYROLL_CREATE },
  ],
  'core.Router': [
    { 
      path: ROUTE_PAYMENT_POINTS,
      text: "payroll.payroll.paymentPoint.route",
      icon: "PinDrop",
      rights: [RIGHT_PAYMENT_POINT_SEARCH],
      id: 'legalAndFinance.paymentPoint',
      component: PaymentPointsPage 
    },
    {
      path: `${ROUTE_PAYMENT_POINT}/:payment_point_uuid?`,
      icon: "PinDrop",
      rights: [RIGHT_PAYMENT_POINT_SEARCH, RIGHT_PAYMENT_POINT_CREATE],
      id: 'legalAndFinance.paymentPoint.detail',
      component: PaymentPointPage,
    },
    { 
      path: ROUTE_PAYROLLS,
      text: "payroll.payroll.payroll.route",
      icon: "MonetizationOn",
      rights: [RIGHT_PAYROLL_SEARCH],
      id: 'legalAndFinance.payrolls',
      component: PayrollsPage
    },
    { 
      path: ROUTE_PAYROLLS_APPROVED,
      component: ApprovedPayrollsPage,
      text: "payroll.payroll.route.payrollsApproved",
      icon: "MonetizationOn",
      rights:[RIGHT_PAYROLL_SEARCH],
      id: 'legalAndFinance.payrollsApproved',
    },
    { 
      path: ROUTE_PAYROLLS_PENDING,
      text: "payroll.payroll.route.payrollsPending",
      icon: "MonetizationOn",
      rights:[RIGHT_PAYROLL_SEARCH],
      id: 'legalAndFinance.payrollsPending',
      component: PendingPayrollsPage
    },
    { 
      path: ROUTE_PAYROLLS_RECONCILED,
      component: ReconciledPayrollsPage,
      text: "payroll.payroll.route.payrollsReconciled",
      icon: "MonetizationOn",
      rights:[RIGHT_PAYROLL_SEARCH],
      id: 'legalAndFinance.payrollsReconciled',
    },
    {
      path: `${ROUTE_PAYROLL}/:payroll_uuid?/:createPayrollFromFailedInvoices?/:benefitPlanId?`,
      icon: "MonetizationOn",
      rights: [RIGHT_PAYROLL_SEARCH, RIGHT_PAYROLL_CREATE],
      id: 'legalAndFinance.payroll',
      component: PayrollPage,
    },
  ],
  'invoice.MainMenu': [
    {

      route: ROUTE_PAYMENT_POINTS,

    },
    {

      route: ROUTE_PAYROLLS,
    },
    {

      route: ROUTE_PAYROLLS_PENDING,
    },
    {
      route: ROUTE_PAYROLLS_APPROVED,
    },
    {
      route: ROUTE_PAYROLLS_RECONCILED,
      withDivider: true
    },
  ],
  'payroll.TabPanel.label': [BenefitConsumptionsTabLabel, PayrollTaskTabLabel, PayrollPaymentFilesTabLabel],
  'payroll.TabPanel.panel': [BenefitConsumptionsTabPanel, PayrollTaskTabPanel, PayrollPaymentFilesTabPanel],
  'tasksManagement.tasks': [{
    text: "payroll.payroll.tasks.update.title",
    tableHeaders: PayrollTaskTableHeaders,
    itemFormatters: PayrollTaskItemFormatters,
    taskSource: ['payroll'],
  },
  {
    text: "payroll.payroll.tasks.reconciliation.title",
    tableHeaders: PayrollReconciliationTaskTableHeaders,
    itemFormatters: PayrollReconciliationTaskItemFormatters,
    taskSource: ['payroll_reconciliation'],
  },
  {
    text: "payroll.payroll.tasks.rejected.title",
    tableHeaders: PayrollRejectedTaskTableHeaders,
    itemFormatters: PayrollRejectedTaskItemFormatters,
    taskSource: ['payroll_reject'],
  },
  {
    text: "payroll.payroll.tasks.delete.title",
    tableHeaders: PayrollDeleteTaskTableHeaders,
    itemFormatters: PayrollDeleteTaskItemFormatters,
    taskSource: ['payroll_delete'],
  }],
};

export const PayrollModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });
