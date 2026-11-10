import {
  describe, expect, it, vi,
} from 'vitest';

// fe-core's barrel imports itself, so the real helpers come from their defining modules.
vi.mock('@openimis/fe-core', async () => vi.importActual('@openimis/fe-core/helpers/api'));

const { default: reducer, ACTION_TYPE } = await import('./reducer');
const {
  CLEAR, ERROR, REQUEST, SUCCESS,
} = await import('./utils/action-type');
const {
  globalId, graphqlErrors, relayPage, serverError,
} = await import('@openimis/fe-core/testing');

const initial = () => reducer(undefined, { type: '@@INIT' });
const dispatch = (state, type, { payload, meta } = {}) => reducer(state, { type, payload, meta });
const respond = (state, actionType, data, meta) => dispatch(state, SUCCESS(actionType), { payload: { data }, meta });
const fail = (state, actionType, payload = serverError(500, 'Internal Server Error', 'boom')) => dispatch(
  state,
  ERROR(actionType),
  { payload },
);

const id = (type, value) => globalId(type, value);
const SERVER_ERROR = { code: 500, message: 'Internal Server Error', detail: 'boom' };
const DATA_ERROR = { code: 'Data error', message: 'Server returned data error status', detail: 'bad filter' };

describe('payroll reducer', () => {
  describe('initialisation', () => {
    it('starts with nothing loaded and no mutation in flight', () => {
      const state = initial();

      expect(state.submittingMutation).toBe(false);
      expect(state.mutationInFlight).toBe(false);
      expect(state.mutation).toEqual({});
      expect(state.paymentPoints).toEqual([]);
      expect(state.payrolls).toEqual([]);
      expect(state.payroll).toEqual({});
      expect(state.paymentMethods).toEqual([]);
      expect(state.payrollFiles).toEqual([]);
      expect(state.systemStatus).toBeNull();
      expect(state.systemStatusError).toBeNull();
    });

    it('returns the same state object for an unrelated action', () => {
      const state = initial();

      expect(reducer(state, { type: 'SOMETHING_ELSE' })).toBe(state);
    });
  });

  describe('paged searches', () => {
    const SEARCHES = [
      ['payment points', ACTION_TYPE.SEARCH_PAYMENT_POINTS, 'paymentPoint', 'PaymentPoints', 'paymentPoints'],
      ['payrolls', ACTION_TYPE.SEARCH_PAYROLLS, 'payroll', 'Payrolls', 'payrolls'],
      ['benefit consumptions', ACTION_TYPE.GET_BENEFIT_CONSUMPTION, 'benefitConsumptionByPayroll',
        'BenefitConsumptions', 'benefitConsumptions'],
      ['payroll benefit consumptions', ACTION_TYPE.GET_PAYROLL_BENEFIT_CONSUMPTION, 'payrollBenefitConsumption',
        'PayrollBenefitConsumptions', 'payrollBenefitConsumptions'],
    ];

    it.each(SEARCHES)('empties the %s list and marks it in flight when a search starts', (
      _label,
      actionType,
      _entity,
      suffix,
      field,
    ) => {
      const stale = {
        ...initial(),
        [field]: [{ id: 'stale' }],
        [`${field}TotalCount`]: 7,
        [`${field}PageInfo`]: { totalCount: 7 },
        [`error${suffix}`]: SERVER_ERROR,
      };
      const state = dispatch(stale, REQUEST(actionType));

      expect(state).toMatchObject({
        [field]: [],
        [`${field}TotalCount`]: 0,
        [`${field}PageInfo`]: {},
        [`fetching${suffix}`]: true,
        [`fetched${suffix}`]: false,
        [`error${suffix}`]: null,
      });
    });

    it.each(SEARCHES)('decodes the ids, counts and records the cursors of the %s page', (
      _label,
      actionType,
      entity,
      suffix,
      field,
    ) => {
      const state = respond(dispatch(initial(), REQUEST(actionType)), actionType, {
        [entity]: relayPage(
          [{ id: id('Type', 'row-1'), name: 'A' }, { id: id('Type', 'row-2'), name: 'B' }],
          { totalCount: 12, pageInfo: { hasNextPage: true, endCursor: 'cursor-2' } },
        ),
      });

      expect(state[field]).toEqual([{ id: 'row-1', name: 'A' }, { id: 'row-2', name: 'B' }]);
      expect(state[`${field}TotalCount`]).toBe(12);
      expect(state[`${field}PageInfo`]).toMatchObject({ totalCount: 12, hasNextPage: true, endCursor: 'cursor-2' });
      expect(state[`fetching${suffix}`]).toBe(false);
      expect(state[`fetched${suffix}`]).toBe(true);
      expect(state[`error${suffix}`]).toBeNull();
    });

    it.each(SEARCHES)('reports an empty %s page with a zero count rather than throwing', (
      _label,
      actionType,
      entity,
      _suffix,
      field,
    ) => {
      const state = respond(initial(), actionType, { [entity]: null });

      expect(state[field]).toEqual([]);
      expect(state[`${field}TotalCount`]).toBe(0);
      expect(state[`${field}PageInfo`]).toEqual({});
    });

    it.each(SEARCHES)('surfaces a data error from the %s search', (_label, actionType, entity, suffix) => {
      const state = dispatch(initial(), SUCCESS(actionType), {
        payload: { data: { [entity]: relayPage([]) }, ...graphqlErrors('bad filter') },
      });

      expect(state[`error${suffix}`]).toEqual(DATA_ERROR);
    });

    it.each(SEARCHES.filter(([, actionType]) => actionType !== ACTION_TYPE.GET_BENEFIT_CONSUMPTION))(
      'stops fetching and formats a transport failure of the %s search',
      (_label, actionType, _entity, suffix) => {
        const state = fail(dispatch(initial(), REQUEST(actionType)), actionType);

        expect(state[`fetching${suffix}`]).toBe(false);
        expect(state[`error${suffix}`]).toEqual(SERVER_ERROR);
      },
    );

    it('stops fetching benefit consumptions when the search fails', () => {
      const state = fail(dispatch(initial(), REQUEST(ACTION_TYPE.GET_BENEFIT_CONSUMPTION)),
        ACTION_TYPE.GET_BENEFIT_CONSUMPTION);

      expect(state.fetchingBenefitConsumptions).toBe(false);
    });

    // Currently fails: the failure is written to errorPayroll, so the benefit consumption
    // searcher (which reads errorBenefitConsumptions) shows no error, and the
    // payroll's own error field is overwritten with an unrelated failure.
    it.fails('reports a failed benefit consumption search on its own error field', () => {
      const state = fail(initial(), ACTION_TYPE.GET_BENEFIT_CONSUMPTION);

      expect(state.errorBenefitConsumptions).toEqual(SERVER_ERROR);
      expect(state.errorPayroll).toBeNull();
    });
  });

  describe('benefit attachments', () => {
    const page = {
      benefitAttachmentByPayroll: relayPage(
        [{ benefit: { id: 'benefit-1', amount: '10.00' }, bill: { id: 'bill-1', amountTotal: '10.00' } }],
        { totalCount: 3, pageInfo: { endCursor: 'cursor-1' } },
      ),
    };

    it('keeps the rows as the server sent them, without decoding', () => {
      const state = respond(initial(), ACTION_TYPE.GET_BENEFIT_ATTACHMENT, page);

      expect(state.benefitAttachments).toEqual([
        { benefit: { id: 'benefit-1', amount: '10.00' }, bill: { id: 'bill-1', amountTotal: '10.00' } },
      ]);
      expect(state.benefitAttachmentsTotalCount).toBe(3);
      expect(state.benefitAttachmentsPageInfo).toMatchObject({ totalCount: 3, endCursor: 'cursor-1' });
      expect(state.fetchedBenefitAttachments).toBe(true);
      expect(state.errorBenefitAttachments).toBeNull();
    });

    it('empties the list and marks it in flight when a search starts', () => {
      const stale = { ...initial(), benefitAttachments: [{ id: 'stale' }], benefitAttachmentsTotalCount: 1 };

      expect(dispatch(stale, REQUEST(ACTION_TYPE.GET_BENEFIT_ATTACHMENT))).toMatchObject({
        benefitAttachments: [],
        benefitAttachmentsTotalCount: 0,
        benefitAttachmentsPageInfo: {},
        fetchingBenefitAttachments: true,
        fetchedBenefitAttachments: false,
      });
    });

    it('reports an empty page with a zero count', () => {
      const state = respond(initial(), ACTION_TYPE.GET_BENEFIT_ATTACHMENT, { benefitAttachmentByPayroll: null });

      expect(state.benefitAttachments).toEqual([]);
      expect(state.benefitAttachmentsTotalCount).toBe(0);
    });

    it('surfaces a data error', () => {
      const state = dispatch(initial(), SUCCESS(ACTION_TYPE.GET_BENEFIT_ATTACHMENT), {
        payload: { data: { benefitAttachmentByPayroll: relayPage([]) }, ...graphqlErrors('bad filter') },
      });

      expect(state.errorBenefitAttachments).toEqual(DATA_ERROR);
    });

    it('stops fetching and formats a transport failure', () => {
      const state = fail(dispatch(initial(), REQUEST(ACTION_TYPE.GET_BENEFIT_ATTACHMENT)),
        ACTION_TYPE.GET_BENEFIT_ATTACHMENT);

      expect(state.fetchingBenefitAttachments).toBe(false);
      expect(state.errorBenefitAttachments).toEqual(SERVER_ERROR);
    });

    it('empties the list on clear', () => {
      const loaded = respond(initial(), ACTION_TYPE.GET_BENEFIT_ATTACHMENT, page);

      expect(dispatch(loaded, CLEAR(ACTION_TYPE.GET_BENEFIT_ATTACHMENT))).toMatchObject({
        benefitAttachments: [],
        fetchingBenefitAttachments: false,
        fetchedBenefitAttachments: false,
        errorBenefitAttachments: null,
      });
    });
  });

  describe('benefit consumptions clear', () => {
    it('empties the list without touching anything else', () => {
      const loaded = respond(initial(), ACTION_TYPE.GET_BENEFIT_CONSUMPTION, {
        benefitConsumptionByPayroll: relayPage([{ id: id('BenefitConsumptionGQLType', 'bc-1') }]),
      });
      const state = dispatch(loaded, CLEAR(ACTION_TYPE.GET_BENEFIT_CONSUMPTION));

      expect(state).toMatchObject({
        benefitConsumptions: [],
        fetchingBenefitConsumptions: false,
        fetchedBenefitConsumptions: false,
        errorBenefitConsumptions: null,
      });
      expect(state.payroll).toBe(loaded.payroll);
    });
  });

  describe('payment files', () => {
    const page = {
      csvReconciliationUpload: relayPage(
        [{ fileName: 'payroll-1.csv', status: 'SUCCESS', error: null, jsonExt: '{}' }],
        { totalCount: 4, pageInfo: { endCursor: 'cursor-1' } },
      ),
    };

    it('keeps the uploaded files as sent and counts them', () => {
      const state = respond(initial(), ACTION_TYPE.GET_PAYROLL_PAYMENT_FILES, page);

      expect(state.payrollFiles).toEqual([{
        fileName: 'payroll-1.csv', status: 'SUCCESS', error: null, jsonExt: '{}',
      }]);
      expect(state.payrollFilesTotalCount).toBe(4);
      expect(state.payrollFilesPageInfo).toMatchObject({ totalCount: 4, endCursor: 'cursor-1' });
      expect(state.fetchedPayrollFiles).toBe(true);
      expect(state.errorPayrollFiles).toBeNull();
    });

    it('empties the list and marks it in flight when a search starts', () => {
      const loaded = respond(initial(), ACTION_TYPE.GET_PAYROLL_PAYMENT_FILES, page);

      expect(dispatch(loaded, REQUEST(ACTION_TYPE.GET_PAYROLL_PAYMENT_FILES))).toMatchObject({
        payrollFiles: [],
        payrollFilesTotalCount: 0,
        payrollFilesPageInfo: {},
        fetchingPayrollFiles: true,
        fetchedPayrollFiles: false,
      });
    });

    it('reports an empty page with a zero count', () => {
      const state = respond(initial(), ACTION_TYPE.GET_PAYROLL_PAYMENT_FILES, { csvReconciliationUpload: null });

      expect(state.payrollFiles).toEqual([]);
      expect(state.payrollFilesTotalCount).toBe(0);
    });

    it('surfaces a data error', () => {
      const state = dispatch(initial(), SUCCESS(ACTION_TYPE.GET_PAYROLL_PAYMENT_FILES), {
        payload: { data: { csvReconciliationUpload: relayPage([]) }, ...graphqlErrors('bad filter') },
      });

      expect(state.errorPayrollFiles).toEqual(DATA_ERROR);
    });

    it('stops fetching when the search fails', () => {
      const state = fail(dispatch(initial(), REQUEST(ACTION_TYPE.GET_PAYROLL_PAYMENT_FILES)),
        ACTION_TYPE.GET_PAYROLL_PAYMENT_FILES);

      expect(state.fetchingPayrollFiles).toBe(false);
    });

    // Currently fails: the transport failure is passed to the GraphQL-error formatter,
    // which only looks for payload.errors and so returns null — the searcher
    // is told nothing went wrong.
    it.fails('formats a transport failure of the payment file search', () => {
      expect(fail(initial(), ACTION_TYPE.GET_PAYROLL_PAYMENT_FILES).errorPayrollFiles).toEqual(SERVER_ERROR);
    });

    it('resets everything on clear', () => {
      const loaded = respond(initial(), ACTION_TYPE.GET_PAYROLL_PAYMENT_FILES, page);

      expect(dispatch(loaded, CLEAR(ACTION_TYPE.GET_PAYROLL_PAYMENT_FILES))).toMatchObject({
        payrollFiles: [],
        payrollFilesTotalCount: 0,
        payrollFilesPageInfo: {},
        fetchingPayrollFiles: false,
        fetchedPayrollFiles: false,
        errorPayrollFiles: null,
      });
    });
  });

  describe('single payment point', () => {
    it('unwraps and decodes the first node', () => {
      const state = respond(initial(), ACTION_TYPE.GET_PAYMENT_POINT, {
        paymentPoint: relayPage([
          { id: id('PaymentPointGQLType', 'pp-1'), name: 'Main office' },
          { id: id('PaymentPointGQLType', 'pp-2'), name: 'Other' },
        ]),
      });

      expect(state.paymentPoint).toEqual({ id: 'pp-1', name: 'Main office' });
      expect(state.fetchedPaymentPoint).toBe(true);
      expect(state.fetchingPaymentPoint).toBe(false);
      expect(state.errorPaymentPoint).toBeNull();
    });

    it('holds nothing when no payment point matches', () => {
      expect(respond(initial(), ACTION_TYPE.GET_PAYMENT_POINT, { paymentPoint: relayPage([]) }).paymentPoint)
        .toBeUndefined();
    });

    it('forgets the previous payment point while the next one loads', () => {
      const loaded = { ...initial(), paymentPoint: { id: 'pp-1' }, fetchedPaymentPoint: true };
      const state = dispatch(loaded, REQUEST(ACTION_TYPE.GET_PAYMENT_POINT));

      expect(state.fetchingPaymentPoint).toBe(true);
      expect(state.fetchedPaymentPoint).toBe(false);
      expect(state.paymentPoint).not.toHaveProperty('id');
    });

    it('surfaces a data error', () => {
      const state = dispatch(initial(), SUCCESS(ACTION_TYPE.GET_PAYMENT_POINT), {
        payload: { data: { paymentPoint: relayPage([]) }, ...graphqlErrors('bad filter') },
      });

      expect(state.errorPaymentPoint).toEqual(DATA_ERROR);
    });

    it('stops fetching and formats a transport failure', () => {
      const state = fail(dispatch(initial(), REQUEST(ACTION_TYPE.GET_PAYMENT_POINT)), ACTION_TYPE.GET_PAYMENT_POINT);

      expect(state.fetchingPaymentPoint).toBe(false);
      expect(state.errorPaymentPoint).toEqual(SERVER_ERROR);
    });

    it('returns to the empty payment point on clear', () => {
      const loaded = { ...initial(), paymentPoint: { id: 'pp-1' }, fetchedPaymentPoint: true };

      expect(dispatch(loaded, CLEAR(ACTION_TYPE.GET_PAYMENT_POINT))).toMatchObject({
        paymentPoint: {},
        fetchingPaymentPoint: false,
        fetchedPaymentPoint: false,
        errorPaymentPoint: null,
      });
    });
  });

  describe('single payroll', () => {
    const payrollNode = (overrides = {}) => ({
      id: id('PayrollGQLType', 'payroll-1'),
      name: 'October',
      status: 'PENDING_APPROVAL',
      dateValidFrom: '2026-10-01T00:00:00',
      dateValidTo: '2026-10-31T23:59:59',
      benefitConsumption: [{ status: 'ACCEPTED', benefitAttachment: [{ bill: { amountTotal: '10.00' } }] }],
      ...overrides,
    });

    it('unwraps and decodes the first node', () => {
      const state = respond(initial(), ACTION_TYPE.GET_PAYROLL, { payroll: relayPage([payrollNode()]) });

      expect(state.payroll).toMatchObject({
        id: 'payroll-1',
        name: 'October',
        status: 'PENDING_APPROVAL',
        benefitConsumption: [{ status: 'ACCEPTED', benefitAttachment: [{ bill: { amountTotal: '10.00' } }] }],
      });
      expect(state.fetchedPayroll).toBe(true);
      expect(state.fetchingPayroll).toBe(false);
      expect(state.errorPayroll).toBeNull();
    });

    it('trims the validity dates to the calendar day', () => {
      const { payroll } = respond(initial(), ACTION_TYPE.GET_PAYROLL, { payroll: relayPage([payrollNode()]) });

      expect(payroll.dateValidFrom).toBe('2026-10-01');
      expect(payroll.dateValidTo).toBe('2026-10-31');
    });

    it('keeps a missing validity date as null', () => {
      const { payroll } = respond(initial(), ACTION_TYPE.GET_PAYROLL, {
        payroll: relayPage([payrollNode({ dateValidFrom: null, dateValidTo: undefined })]),
      });

      expect(payroll.dateValidFrom).toBeNull();
      expect(payroll.dateValidTo).toBeNull();
    });

    it('holds nothing when no payroll matches', () => {
      expect(respond(initial(), ACTION_TYPE.GET_PAYROLL, { payroll: relayPage([]) }).payroll).toBeUndefined();
    });

    it('forgets the previous payroll while the next one loads', () => {
      const loaded = respond(initial(), ACTION_TYPE.GET_PAYROLL, { payroll: relayPage([payrollNode()]) });

      expect(dispatch(loaded, REQUEST(ACTION_TYPE.GET_PAYROLL))).toMatchObject({
        payroll: {},
        fetchingPayroll: true,
        fetchedPayroll: false,
        errorPayroll: null,
      });
    });

    it('surfaces a data error', () => {
      const state = dispatch(initial(), SUCCESS(ACTION_TYPE.GET_PAYROLL), {
        payload: { data: { payroll: relayPage([]) }, ...graphqlErrors('bad filter') },
      });

      expect(state.errorPayroll).toEqual(DATA_ERROR);
    });

    it('stops fetching and formats a transport failure', () => {
      const state = fail(dispatch(initial(), REQUEST(ACTION_TYPE.GET_PAYROLL)), ACTION_TYPE.GET_PAYROLL);

      expect(state.fetchingPayroll).toBe(false);
      expect(state.errorPayroll).toEqual(SERVER_ERROR);
    });

    it('drops the payroll on clear', () => {
      const loaded = respond(initial(), ACTION_TYPE.GET_PAYROLL, { payroll: relayPage([payrollNode()]) });
      const state = dispatch(loaded, CLEAR(ACTION_TYPE.GET_PAYROLL));

      expect(state.payroll).toBeNull();
      expect(state.fetchedPayroll).toBe(false);
      expect(state.errorPayroll).toBeNull();
    });
  });

  describe('payment methods', () => {
    it('takes the method list out of its wrapper', () => {
      const state = respond(initial(), ACTION_TYPE.GET_PAYMENT_METHODS, {
        paymentMethods: { paymentMethods: [{ name: 'StrategyOnlinePayment' }, { name: 'StrategyCash' }] },
      });

      expect(state.paymentMethods).toEqual([{ name: 'StrategyOnlinePayment' }, { name: 'StrategyCash' }]);
      expect(state.fetchedPaymentMethods).toBe(true);
      expect(state.fetchingPaymentMethods).toBe(false);
      expect(state.errorPaymentMethods).toBeNull();
    });

    it('falls back to an empty list when the wrapper is absent', () => {
      expect(respond(initial(), ACTION_TYPE.GET_PAYMENT_METHODS, { paymentMethods: null }).paymentMethods)
        .toEqual([]);
    });

    it('empties the list and marks it in flight when a request starts', () => {
      const loaded = { ...initial(), paymentMethods: [{ name: 'StrategyCash' }], fetchedPaymentMethods: true };

      expect(dispatch(loaded, REQUEST(ACTION_TYPE.GET_PAYMENT_METHODS))).toMatchObject({
        paymentMethods: [],
        fetchingPaymentMethods: true,
        fetchedPaymentMethods: false,
        errorPaymentMethods: null,
      });
    });

    it('surfaces a data error', () => {
      const state = dispatch(initial(), SUCCESS(ACTION_TYPE.GET_PAYMENT_METHODS), {
        payload: { data: { paymentMethods: null }, ...graphqlErrors('bad filter') },
      });

      expect(state.errorPaymentMethods).toEqual(DATA_ERROR);
    });

    it('stops fetching and formats a transport failure', () => {
      const state = fail(initial(), ACTION_TYPE.GET_PAYMENT_METHODS);

      expect(state.fetchingPaymentMethods).toBe(false);
      expect(state.errorPaymentMethods).toEqual(SERVER_ERROR);
    });
  });

  describe('benefits summary', () => {
    const summary = { totalAmountDue: '1500.00', totalAmountReceived: '1200.50' };

    it('stores the amounts exactly as the server sent them', () => {
      const state = respond(initial(), ACTION_TYPE.BENEFITS_SUMMARY, { benefitsSummary: summary });

      expect(state.benefitsSummary).toEqual(summary);
      expect(state.fetchedBenefitsSummary).toBe(true);
      expect(state.fetchingBenefitsSummary).toBe(false);
      expect(state.benefitsSummaryError).toBeNull();
    });

    it('drops the previous amounts while they are recalculated', () => {
      const loaded = respond(initial(), ACTION_TYPE.BENEFITS_SUMMARY, { benefitsSummary: summary });
      const state = dispatch(loaded, REQUEST(ACTION_TYPE.BENEFITS_SUMMARY));

      expect(state.benefitsSummary).toEqual({});
      expect(state.fetchingBenefitsSummary).toBe(true);
      expect(state.fetchedBenefitsSummary).toBe(false);
      expect(state.benefitsSummaryError).toBeNull();
    });

    it('surfaces a data error', () => {
      const state = dispatch(initial(), SUCCESS(ACTION_TYPE.BENEFITS_SUMMARY), {
        payload: { data: { benefitsSummary: null }, ...graphqlErrors('bad filter') },
      });

      expect(state.benefitsSummaryError).toEqual(DATA_ERROR);
    });

    it('stops fetching and formats a transport failure', () => {
      const state = fail(initial(), ACTION_TYPE.BENEFITS_SUMMARY);

      expect(state.fetchingBenefitsSummary).toBe(false);
      expect(state.benefitsSummaryError).toEqual(SERVER_ERROR);
    });
  });

  describe('system status', () => {
    it('forgets the previous status while it is re-checked', () => {
      const known = { ...initial(), systemStatus: { triggersSynced: false }, systemStatusError: SERVER_ERROR };

      expect(dispatch(known, REQUEST(ACTION_TYPE.GET_SYSTEM_STATUS))).toMatchObject({
        systemStatus: null,
        systemStatusError: null,
      });
    });

    it('stores the reported status', () => {
      const state = respond(initial(), ACTION_TYPE.GET_SYSTEM_STATUS, {
        payrollSystemStatus: { triggersSynced: false, message: 'Triggers out of sync' },
      });

      expect(state.systemStatus).toEqual({ triggersSynced: false, message: 'Triggers out of sync' });
      expect(state.systemStatusError).toBeNull();
    });

    it('holds no status when the response has no data', () => {
      const state = dispatch(initial(), SUCCESS(ACTION_TYPE.GET_SYSTEM_STATUS), {
        payload: { ...graphqlErrors('unknown field payrollSystemStatus') },
      });

      expect(state.systemStatus).toBeNull();
      expect(state.systemStatusError).toMatchObject({ detail: 'unknown field payrollSystemStatus' });
    });

    it('drops the status and formats a transport failure', () => {
      const known = { ...initial(), systemStatus: { triggersSynced: true } };
      const state = fail(known, ACTION_TYPE.GET_SYSTEM_STATUS);

      expect(state.systemStatus).toBeNull();
      expect(state.systemStatusError).toEqual(SERVER_ERROR);
    });
  });

  describe('mutations', () => {
    const MUTATION_RESULTS = [
      [ACTION_TYPE.CREATE_PAYMENT_POINT, 'createPaymentPoint'],
      [ACTION_TYPE.DELETE_PAYMENT_POINT, 'deletePaymentPoint'],
      [ACTION_TYPE.UPDATE_PAYMENT_POINT, 'updatePaymentPoint'],
      [ACTION_TYPE.CREATE_PAYROLL, 'createPayroll'],
      [ACTION_TYPE.DELETE_PAYROLL, 'deletePayroll'],
      [ACTION_TYPE.RETRIGGER_PAYROLL, 'retriggerPayroll'],
      [ACTION_TYPE.CLOSE_PAYROLL, 'closePayroll'],
      [ACTION_TYPE.REJECT_PAYROLL, 'rejectPayroll'],
      [ACTION_TYPE.MAKE_PAYMENT_PAYROLL, 'makePaymentForPayroll'],
      [ACTION_TYPE.DELETE_BENEFIT_CONSUMPTION, 'deleteBenefitConsumption'],
    ];

    const submitting = () => dispatch(initial(), REQUEST(ACTION_TYPE.MUTATION), {
      meta: {
        actionType: ACTION_TYPE.CLOSE_PAYROLL,
        clientMutationId: 'cmid-1',
        clientMutationLabel: 'Close payroll',
        requestedDateTime: new Date('2026-09-30T10:00:00Z'),
      },
    });

    it('marks a mutation as submitted and in flight, and records its metadata', () => {
      expect(submitting()).toMatchObject({
        submittingMutation: true,
        mutationInFlight: true,
        mutation: {
          id: 'cmid-1',
          actionType: ACTION_TYPE.CLOSE_PAYROLL,
          clientMutationLabel: 'Close payroll',
          requestedDateTime: '2026-09-30T10:00:00.000Z',
        },
      });
    });

    it.each(MUTATION_RESULTS)('finishes %s and keeps the internal id the server returned', (actionType, service) => {
      const state = respond(submitting(), actionType, { [service]: { internalId: 'internal-1' } });

      expect(state.submittingMutation).toBe(false);
      expect(state.mutationInFlight).toBe(false);
      expect(state.mutation).toMatchObject({
        id: 'internal-1',
        actionType: ACTION_TYPE.CLOSE_PAYROLL,
        clientMutationId: 'cmid-1',
      });
    });

    it('does not take the internal id of a different service', () => {
      const state = respond(submitting(), ACTION_TYPE.REJECT_PAYROLL, { closePayroll: { internalId: 'internal-1' } });

      expect(state.mutation.id).not.toBe('internal-1');
    });

    it('lowers the in-flight flag and raises an alert when a mutation fails', () => {
      const state = fail(submitting(), ACTION_TYPE.MUTATION, { status: 500, statusText: 'Internal Server Error' });

      expect(state.mutationInFlight).toBe(false);
      expect(JSON.parse(state.alert)).toEqual({ status: 500, statusText: 'Internal Server Error' });
    });

    // Currently fails: fe-core's dispatchMutationErr only sets the alert, so the flag
    // REQUEST(MUTATION) raised stays true. The payroll pages refresh and journalize
    // on its true -> false edge, so a failed mutation never triggers either.
    it.fails('stops submitting once a mutation has failed', () => {
      const state = fail(submitting(), ACTION_TYPE.MUTATION, { status: 500, statusText: 'Internal Server Error' });

      expect(state.submittingMutation).toBe(false);
    });
  });

  describe('immutability', () => {
    it('does not mutate the state it was given', () => {
      const state = initial();
      const snapshot = JSON.stringify(state);

      respond(state, ACTION_TYPE.SEARCH_PAYROLLS, { payroll: relayPage([{ id: id('PayrollGQLType', 'p-1') }]) });
      dispatch(state, REQUEST(ACTION_TYPE.GET_PAYROLL));
      dispatch(state, REQUEST(ACTION_TYPE.MUTATION), { meta: { clientMutationId: 'cmid-1' } });
      dispatch(state, CLEAR(ACTION_TYPE.GET_PAYROLL));

      expect(JSON.stringify(state)).toBe(snapshot);
    });
  });
});
