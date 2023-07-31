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
  GET_PAYMENT_POINT: 'PAYROLL_PAYMENT_POINT',
};

export const MUTATION_SERVICE = {
  PAYMENT_POINT: {
    CREATE: 'createPaymentPoint',
    DELETE: 'deletePaymentPoint',
    UPDATE: 'updatePaymentPoint',
  },
  PAYROLL: {},
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
        paymentPoint: parseData(action.payload.data.paymentPoints)?.map((paymentPoint) => ({
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
    default:
      return state;
  }
}

export default reducer;
