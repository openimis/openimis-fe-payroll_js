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
import { ENUM_PREFIX_LENGTH } from './constants';
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
  GET_PAYROLL: 'PAYROLL_GET_PAYROLL',
  GET_BENEFIT_CONSUMPTION: 'PAYROLL_BENEFIT_CONSUMPTION',
  GET_BENEFIT_ATTACHMENT: 'PAYROLL_BENEFIT_ATTACHMENT',
  GET_PAYMENT_METHODS: 'PAYROLL_PAYMENT_METHODS',
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
  payroll: {},
  errorPayroll: null,

  fetchingBenefitConsumptions: true,
  benefitConsumption: [],
  benefitConsumptionTotalCount: 0,
  fetchedBenefitConsumption: false,
  errorBenefitConsumption: null,
  benefitConsumptionsPageInfo: {},

  fetchingBenefitAttachments: false,
  benefitAttachments: [],
  benefitAttachmentsTotalCount: 0,
  fetchedBenefitAttachments: false,
  errorBenefitAttachments: null,
  benefitAttachmentsPageInfo: {},

  fetchingPaymentMethods: true,
  paymentMethods: [],
  fetchedPaymentMethods: false,
  errorPaymentMethods: null,
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
        payroll: {},
        errorPayroll: null,
      };
    case SUCCESS(ACTION_TYPE.GET_PAYROLL):
      return {
        ...state,
        fetchingPayroll: false,
        fetchedPayroll: true,
        payroll: parseData(action.payload.data.payroll)?.map((payroll) => ({
          ...payroll,
          id: decodeId(payroll.id),
        }))?.[0],
        errorPayroll: formatGraphQLError(action.payload),
      };
    case ERROR(ACTION_TYPE.GET_PAYROLL):
      return {
        ...state,
        fetchingPayroll: false,
        errorPayroll: formatServerError(action.payload),
      };
    case CLEAR(ACTION_TYPE.GET_PAYROLL):
      return {
        ...state,
        fetchingPayroll: true,
        fetchedPayroll: false,
        payroll: null,
        errorPayroll: null,
        payrollBills: [],
      };
    case REQUEST(ACTION_TYPE.GET_BENEFIT_CONSUMPTION):
      return {
        ...state,
        fetchingBenefitConsumptions: true,
        fetchedBenefitConsumptions: false,
        benefitConsumptions: [],
        errorBenefitConsumptions: null,
        benefitConsumptionsPageInfo: {},
        benefitConsumptionsTotalCount: 0,
      };
    case SUCCESS(ACTION_TYPE.GET_BENEFIT_CONSUMPTION):
      return {
        ...state,
        fetchingBenefitConsumptions: false,
        fetchedBenefitConsumptions: true,
        benefitConsumptions: parseData(action.payload.data.benefitConsumptionByPayroll)?.map((benefitConsumption) => ({
          ...benefitConsumption,
          id: decodeId(benefitConsumption.id),
        })),
        benefitConsumptionsPageInfo: pageInfo(action.payload.data.benefitConsumptionByPayroll),
        benefitConsumptionsTotalCount: action.payload.data.benefitConsumptionByPayroll?.totalCount ?? 0,
        errorBenefitConsumptions: formatGraphQLError(action.payload),
      };
    case ERROR(ACTION_TYPE.GET_BENEFIT_CONSUMPTION):
      return {
        ...state,
        fetchingBenefitConsumptions: false,
        errorPayroll: formatServerError(action.payload),
      };
    case CLEAR(ACTION_TYPE.GET_BENEFIT_CONSUMPTION):
      return {
        ...state,
        fetchingBenefitConsumptions: false,
        fetchedBenefitConsumptions: false,
        errorBenefitConsumptions: null,
        benefitConsumptions: [],
      };

    case REQUEST(ACTION_TYPE.GET_BENEFIT_ATTACHMENT):
      console.log('request');
      return {
        ...state,
        fetchingBenefitAttachments: true,
        fetchedBenefitAttachments: false,
        benefitAttachments: [],
        errorBenefitAttachments: null,
        benefitAttachmentsPageInfo: {},
        benefitAttachmentsTotalCount: 0,
      };
    case SUCCESS(ACTION_TYPE.GET_BENEFIT_ATTACHMENT):
      console.log('success');
      return {
        ...state,
        fetchingBenefitAttachments: false,
        fetchedBenefitAttachments: true,
        benefitAttachments: parseData(action.payload.data.benefitAttachmentByPayroll)?.map((benefitAttachment) => ({
          ...benefitAttachment,
        })),
        benefitAttachmentsPageInfo: pageInfo(action.payload.data.benefitAttachmentByPayroll),
        benefitAttachmentsTotalCount: action.payload.data.benefitAttachmentByPayroll?.totalCount ?? 0,
        errorBenefitAttachments: formatGraphQLError(action.payload),
      };
    case ERROR(ACTION_TYPE.GET_BENEFIT_ATTACHMENT):
      return {
        ...state,
        fetchingBenefitAttachments: false,
        errorBenefitAttachments: formatServerError(action.payload),
      };
    case CLEAR(ACTION_TYPE.GET_BENEFIT_ATTACHMENT):
      return {
        ...state,
        fetchingBenefitAttachments: false,
        fetchedBenefitAttachments: false,
        errorBenefitAttachments: null,
        benefitAttachments: [],
      };

    case REQUEST(ACTION_TYPE.GET_PAYMENT_METHODS):
      return {
        ...state,
        fetchingPaymentMethods: true,
        fetchedPaymentMethods: false,
        paymentMethods: [],
        errorPaymentMethods: null,
      };
    case SUCCESS(ACTION_TYPE.GET_PAYMENT_METHODS):
      return {
        ...state,
        fetchingPaymentMethods: false,
        fetchedPaymentMethods: true,
        paymentMethods: action.payload.data.paymentMethods ? action.payload.data.paymentMethods.paymentMethods : [],
        errorPaymentMethods: formatGraphQLError(action.payload),
      };
    case ERROR(ACTION_TYPE.GET_PAYMENT_METHODS):
      return {
        ...state,
        fetchingPaymentMethods: false,
        errorPaymentMethods: formatServerError(action.payload),
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
