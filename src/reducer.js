/* eslint-disable default-param-last */

import {
  dispatchMutationErr,
  dispatchMutationReq,
  dispatchMutationResp,
  formatGraphQLError,
  formatServerError,
  pageInfo,
  parseData,
  decodeId,
} from '@openimis/fe-core';
import {
  CLEAR, ERROR, REQUEST, SUCCESS,
} from './utils/action-type';

export const ACTION_TYPE = {
  MUTATION: 'PAYROLL_MUTATION',
  CREATE_PAYMENT_POINT: 'PAYROLL_MUTATION_CREATE_PAYMENT_POINT',
  DELETE_PAYMENT_POINT: 'PAYROLL_MUTATION_DELETE_PAYMENT_POINT',
  UPDATE_PAYMENT_POINT: 'PAYROLL_MUTATION_UPDATE_PAYMENT_POINT',
  SEARCH_PAYMENT_POINTS: 'PAYROLL_PAYMENT_POINTS',
  CREATE_PAYROLL: 'PAYROLL_MUTATION_CREATE_PAYROLL',
  DELETE_PAYROLL: 'PAYROLL_MUTATION_DELETE_PAYROLL',
  SEARCH_PAYROLLS: 'PAYROLL_PAYROLLS',
  GET_PAYMENT_POINT: 'PAYROLL_PAYMENT_POINT',
  GET_PAYROLL: 'PAYROLL_PAYROLL',
};

export const MUTATION_SERVICE = {
  PAYMENT_POINT: {
    CREATE: 'createPaymentPoint',
    DELETE: 'deletePaymentPoint',
    UPDATE: 'updatePaymentPoint',
  },
  PAYROLL: {
    CREATE: 'createPayroll',
    DELETE: 'deletePayroll',
  },
};

const STORE_STATE = {
  submittingMutation: false,
  mutation: {},
  fetchingPaymentPoints: false,
  fetchedPaymentPoints: false,
  errorPaymentPoints: null,
  paymentPoints: [],
  paymentPointsPageInfo: {},
  paymentPointsTotalCount: 0,
  fetchingPaymentPoint: false,
  fetchedPaymentPoint: false,
  paymentPoint: {},
  errorPaymentPoint: null,

  fetchingPayrolls: false,
  fetchedPayrolls: false,
  errorPayrolls: null,
  payrolls: [],
  payrollsPageInfo: {},
  payrollsTotalCount: 0,
  fetchingPayroll: false,
  fetchedPayroll: false,
  payroll: null,
  payrollBills: [],
  payrollBillsTotalCount: 0,
  errorPayroll: null,

  fetchingPayrollBills: true,
  fetchedPayrollBills: false,
  errorPayrollBills: null,
  payrollBillsPageInfo: {},
  payrollBillsTotalCount: 0,
};

const getEnumValue = (enumElement) => enumElement?.substring(ENUM_PREFIX_LENGTH);

function reducer(
  state = STORE_STATE,
  action,
) {
  switch (action.type) {
    case REQUEST(ACTION_TYPE.SEARCH_PAYMENT_POINTS):
      return {
        ...state,
        fetchingPaymentPoints: true,
        fetchedPaymentPoints: false,
        paymentPoints: [],
        errorPaymentPoints: null,
        paymentPointsPageInfo: {},
        paymentPointsTotalCount: 0,
      };
    case SUCCESS(ACTION_TYPE.SEARCH_PAYMENT_POINTS):
      return {
        ...state,
        paymentPoints: parseData(action.payload.data.paymentPoint)?.map((paymentPoint) => ({
          ...paymentPoint,
          id: decodeId(paymentPoint.id),
        })),
        fetchingPaymentPoints: false,
        fetchedPaymentPoints: true,
        errorPaymentPoints: formatGraphQLError(action.payload),
        paymentPointsPageInfo: pageInfo(action.payload.data.paymentPoint),
        paymentPointsTotalCount: action.payload.data.paymentPoint?.totalCount ?? 0,
      };
    case ERROR(ACTION_TYPE.SEARCH_PAYMENT_POINTS):
      return {
        ...state,
        fetchingPaymentPoints: false,
        errorPaymentPoints: formatServerError(action.payload),
      };
    case REQUEST(ACTION_TYPE.SEARCH_PAYROLLS):
      return {
        ...state,
        fetchingPayrolls: true,
        fetchedPayrolls: false,
        payrolls: [],
        errorPayrolls: null,
        payrollsPageInfo: {},
        payrollsTotalCount: 0,
      };
    case SUCCESS(ACTION_TYPE.SEARCH_PAYROLLS):
      return {
        ...state,
        payrolls: parseData(action.payload.data.payroll)?.map((payroll) => ({
          ...payroll,
          id: decodeId(payroll.id),
        })),
        fetchingPayrolls: false,
        fetchedPayrolls: true,
        errorPayrolls: formatGraphQLError(action.payload),
        payrollsPageInfo: pageInfo(action.payload.data.payroll),
        payrollsTotalCount: action.payload.data.payroll?.totalCount ?? 0,
      };
    case ERROR(ACTION_TYPE.SEARCH_PAYROLLS):
      return {
        ...state,
        fetchingPayrolls: false,
        errorPayrolls: formatServerError(action.payload),
      };  
    case REQUEST(ACTION_TYPE.GET_PAYMENT_POINT):
      return {
        ...state,
        fetchingPaymentPoint: true,
        fetchedPaymentPoint: false,
        paymentPoint: [],
        errorPaymentPoint: null,
      };
    case SUCCESS(ACTION_TYPE.GET_PAYMENT_POINT):
      return {
        ...state,
        fetchingPaymentPoint: false,
        fetchedPaymentPoint: true,
        paymentPoint: parseData(action.payload.data.paymentPoint)?.map((paymentPoint) => ({
          ...paymentPoint,
          id: decodeId(paymentPoint.id),
        }))?.[0],
        errorPaymentPoint: formatGraphQLError(action.payload),
      };
    case ERROR(ACTION_TYPE.GET_PAYMENT_POINT):
      return {
        ...state,
        fetchingPaymentPoint: false,
        errorPaymentPoint: formatServerError(action.payload),
      };
    case CLEAR(ACTION_TYPE.GET_PAYMENT_POINT):
      return {
        ...state,
        fetchingPaymentPoint: false,
        fetchedPaymentPoint: false,
        paymentPoint: {},
        errorPaymentPoint: null,
      };
    case REQUEST(ACTION_TYPE.GET_PAYROLL):
      return {
        ...state,
        fetchingPayroll: true,
        fetchedPayroll: false,
        payroll: [],
        payrollBills: [],
        errorPayroll: null,
        fetchingPayrollBills: true,
        fetchedPayrollBills: false,
      };
    case SUCCESS(ACTION_TYPE.GET_PAYROLL):
      return {
        ...state,
        fetchingPayroll: false,
        fetchedPayroll: true,
        fetchingPayrollBills: false,
        fetchedPayrollBills: true,
        payroll: parseData(action.payload.data.payroll)?.map((payroll) => ({
          ...payroll,
          id: decodeId(payroll.id),
        }))?.[0],
        payrollBills: parseData(action.payload.data.payroll)?.map((payroll) => ({
          ...payroll.bill,
        }))?.[0],
        errorPayroll: formatGraphQLError(action.payload),
      };
    case ERROR(ACTION_TYPE.GET_PAYROLL):
      return {
        ...state,
        fetchingPayroll: false,
        fetchingPayrollBills: false,
        errorPayroll: formatServerError(action.payload),
      };
    case CLEAR(ACTION_TYPE.GET_PAYROLL):
      return {
        ...state,
        fetchingPayroll: true,
        fetchedPayroll: false,
        payroll: null,
        errorPayroll: null,
      };
    case REQUEST(ACTION_TYPE.MUTATION):
      return dispatchMutationReq(state, action);
    case ERROR(ACTION_TYPE.MUTATION):
      return dispatchMutationErr(state, action);
    case SUCCESS(ACTION_TYPE.CREATE_PAYMENT_POINT):
      return dispatchMutationResp(state, MUTATION_SERVICE.PAYMENT_POINT.CREATE, action);
    case SUCCESS(ACTION_TYPE.DELETE_PAYMENT_POINT):
      return dispatchMutationResp(state, MUTATION_SERVICE.PAYMENT_POINT.DELETE, action);
    case SUCCESS(ACTION_TYPE.UPDATE_PAYMENT_POINT):
      return dispatchMutationResp(state, MUTATION_SERVICE.PAYMENT_POINT.UPDATE, action);
    case SUCCESS(ACTION_TYPE.CREATE_PAYROLL):
      return dispatchMutationResp(state, MUTATION_SERVICE.PAYROLL.CREATE, action);
    case SUCCESS(ACTION_TYPE.DELETE_PAYROLL):
      return dispatchMutationResp(state, MUTATION_SERVICE.PAYROLL.DELETE, action);
    default:
      return state;
  }
}

export default reducer;
