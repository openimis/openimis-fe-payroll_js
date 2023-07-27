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
import { ERROR, REQUEST, SUCCESS } from './utils/action-type';

export const ACTION_TYPE = {
  MUTATION: 'PAYROLL_MUTATION',
  CREATE_PAYMENT_POINT: 'PAYROLL_MUTATION_CREATE_PAYMENT_POINT',
  DELETE_PAYMENT_POINT: 'PAYROLL_MUTATION_DELETE_PAYMENT_POINT',
  UPDATE_PAYMENT_POINT: 'PAYROLL_MUTATION_UPDATE_PAYMENT_POINT',
  SEARCH_PAYMENT_POINTS: 'PAYROLL_PAYMENT_POINTS',
  CREATE_PAYROLL: 'PAYROLL_MUTATION_CREATE_PAYROLL',
  DELETE_PAYROLL: 'PAYROLL_MUTATION_DELETE_PAYROLL',
  SEARCH_PAYROLLS: 'PAYROLL_PAYROLLS',
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
  paymentPoint: null,
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
  errorPayroll: null,
};

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
        paymentPoints: parseData(action.payload.data.paymentPoints)?.map((paymentPoint) => ({
          ...paymentPoint,
          id: decodeId(paymentPoint.id),
        })),
        fetchingPaymentPoints: false,
        fetchedPaymentPoints: true,
        errorPaymentPoints: formatGraphQLError(action.payload),
        paymentPointsPageInfo: pageInfo(action.payload.data.paymentPoints),
        paymentPointsTotalCount: action.payload.data.paymentPoints?.totalCount ?? 0,
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
        payrolls: parseData(action.payload.data.payrolls)?.map((payroll) => ({
          ...payroll,
          id: decodeId(payroll.id),
        })),
        fetchingPayrolls: false,
        fetchedPayrolls: true,
        errorPayrolls: formatGraphQLError(action.payload),
        payrollsPageInfo: pageInfo(action.payload.data.payrolls),
        payrollsTotalCount: action.payload.data.payrolls?.totalCount ?? 0,
      };
    case ERROR(ACTION_TYPE.SEARCH_PAYROLLS):
      return {
        ...state,
        fetchingPayrolls: false,
        errorPayrolls: formatServerError(action.payload),
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
