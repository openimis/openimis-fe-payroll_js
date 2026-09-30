import {
  describe, expect, it, vi,
} from 'vitest';

// Only fe-core's dispatcher is stubbed; the formatters are real, imported from their
// defining modules because fe-core's barrel imports itself.
const core = vi.hoisted(() => ({
  graphql: vi.fn((payload, type, meta) => ({ payload, type, meta })),
}));

vi.mock('@openimis/fe-core', async () => ({
  ...(await vi.importActual('@openimis/fe-core/helpers/api')),
  ...core,
}));

const actions = await import('./actions');
const { ACTION_TYPE } = await import('./reducer');
const {
  CLEAR, ERROR, REQUEST, SUCCESS,
} = await import('./utils/action-type');
const { globalId } = await import('@openimis/fe-core/testing');

const modulesManager = {
  getProjection: (key) => ({
    'location.Location.FlatProjection': '{id, code, name}',
    'admin.UserPicker.projection': '{id, username}',
  })[key],
};

const query = (result) => result.payload.replace(/\s+/g, ' ');
const input = (result) => query(result).match(/input: \{(.*)\} \)/)[1].trim();
const PAYROLL_UUID = '2f6d3a1e-7c4b-4e0a-9a51-0d3c8b7e6f12';

describe('payroll actions', () => {
  describe('searches', () => {
    it.each([
      ['payment points', 'fetchPaymentPoints', ACTION_TYPE.SEARCH_PAYMENT_POINTS, 'paymentPoint'],
      ['a payment point', 'fetchPaymentPoint', ACTION_TYPE.GET_PAYMENT_POINT, 'paymentPoint'],
      ['payrolls', 'fetchPayrolls', ACTION_TYPE.SEARCH_PAYROLLS, 'payroll'],
      ['a payroll', 'fetchPayroll', ACTION_TYPE.GET_PAYROLL, 'payroll'],
      ['payment files', 'fetchPayrollPaymentFiles', ACTION_TYPE.GET_PAYROLL_PAYMENT_FILES, 'csvReconciliationUpload'],
      ['benefit consumptions', 'fetchBenefitConsumptions', ACTION_TYPE.GET_BENEFIT_CONSUMPTION,
        'benefitConsumptionByPayroll'],
      ['benefit attachments', 'fetchBenefitAttachments', ACTION_TYPE.GET_BENEFIT_ATTACHMENT,
        'benefitAttachmentByPayroll'],
      ['payroll benefit consumptions', 'fetchPayrollBenefitConsumptions', ACTION_TYPE.GET_PAYROLL_BENEFIT_CONSUMPTION,
        'payrollBenefitConsumption'],
    ])('asks for a counted page of %s', (_label, creator, actionType, entity) => {
      const result = actions[creator](modulesManager, ['first: 10', 'isDeleted: false']);

      expect(result.type).toBe(actionType);
      expect(query(result)).toContain(`${entity}(first: 10,isDeleted: false) { totalCount`);
      expect(query(result)).toContain('edges { node {');
    });

    it('projects the payment point location and manager from the modules that own them', () => {
      const text = query(actions.fetchPaymentPoints(modulesManager, []));

      expect(text).toContain('location {id, code, name}');
      expect(text).toContain('ppm {id, username}');
    });

    it('asks for the bill totals of every benefit only when loading a single payroll', () => {
      const bills = 'benefitConsumption{status, benefitAttachment{bill{amountTotal}}}';

      expect(query(actions.fetchPayroll(modulesManager, [`id: "${PAYROLL_UUID}"`]))).toContain(bills);
      expect(query(actions.fetchPayrolls(modulesManager, []))).not.toContain('benefitConsumption');
    });

    it('nests the full payment point projection inside a payroll', () => {
      expect(query(actions.fetchPayroll(modulesManager, [])))
        .toContain('paymentPoint { id name isDeleted location {id, code, name} ppm {id, username} }');
    });

    it.each([
      ['benefit consumptions', 'fetchBenefitConsumptions',
        'benefitAttachment {bill {id, code, terms, datePayed}}'],
      ['benefit attachments', 'fetchBenefitAttachments', 'bill{id, code, terms, amountTotal, datePayed}'],
      ['payroll benefit consumptions', 'fetchPayrollBenefitConsumptions',
        'payroll {id, name, status, paymentCycle {code, startDate, endDate}, paymentMethod, benefitPlanNameCode}'],
    ])('asks for the bill and payroll details of %s', (_label, creator, fragment) => {
      expect(query(actions[creator](modulesManager, []))).toContain(fragment);
    });

    it('asks for the reconciliation file status and error', () => {
      expect(query(actions.fetchPayrollPaymentFiles(modulesManager, [])))
        .toContain('edges { node { fileName,status,error,jsonExt } }');
    });

    it('asks for the benefits summary amounts without paging', () => {
      const result = actions.fetchBenefitsSummary([`payrollId: "${PAYROLL_UUID}"`]);

      expect(result.type).toBe(ACTION_TYPE.BENEFITS_SUMMARY);
      expect(query(result)).toContain(`benefitsSummary(payrollId: "${PAYROLL_UUID}") { totalAmountReceived,totalAmountDue }`);
      expect(query(result)).not.toContain('totalCount');
    });

    it('asks for the payment method names', () => {
      const result = actions.fetchPaymentMethods(null);

      expect(result.type).toBe(ACTION_TYPE.GET_PAYMENT_METHODS);
      expect(query(result)).toContain('paymentMethods { paymentMethods {name} }');
    });

    it('asks whether the payroll triggers are in sync', () => {
      const result = actions.fetchPayrollSystemStatus();

      expect(result.type).toBe(ACTION_TYPE.GET_SYSTEM_STATUS);
      expect(query(result)).toContain('payrollSystemStatus { triggersSynced,message }');
    });
  });

  describe('clearing', () => {
    it.each([
      ['clearPaymentPoint', CLEAR(ACTION_TYPE.GET_PAYMENT_POINT)],
      ['clearPayroll', CLEAR(ACTION_TYPE.GET_PAYROLL)],
      ['clearPayrollBills', CLEAR(ACTION_TYPE.GET_BENEFIT_CONSUMPTION)],
    ])('%s dispatches %s', (creator, type) => {
      const dispatch = vi.fn();

      actions[creator]()(dispatch);

      expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type });
    });
  });

  describe('mutations', () => {
    const MUTATIONS = [
      ['createPaymentPoint', 'createPaymentPoint', { name: 'Main office' }, ACTION_TYPE.CREATE_PAYMENT_POINT],
      ['updatePaymentPoint', 'updatePaymentPoint', { id: 'pp-1', name: 'Main office' },
        ACTION_TYPE.UPDATE_PAYMENT_POINT],
      ['deletePaymentPoint', 'deletePaymentPoint', { id: 'pp-1' }, ACTION_TYPE.DELETE_PAYMENT_POINT],
      ['createPayroll', 'createPayroll', { name: 'October' }, ACTION_TYPE.CREATE_PAYROLL],
      ['deletePayrolls', 'deletePayroll', { id: PAYROLL_UUID }, ACTION_TYPE.DELETE_PAYROLL],
      ['retriggerPayroll', 'retriggerPayroll', { id: PAYROLL_UUID }, ACTION_TYPE.RETRIGGER_PAYROLL],
      ['closePayroll', 'closePayroll', { id: PAYROLL_UUID }, ACTION_TYPE.CLOSE_PAYROLL],
      ['rejectPayroll', 'rejectPayroll', { id: PAYROLL_UUID }, ACTION_TYPE.REJECT_PAYROLL],
      ['makePaymentForPayroll', 'makePaymentForPayroll', { id: PAYROLL_UUID }, ACTION_TYPE.MAKE_PAYMENT_PAYROLL],
      ['deleteBenefitConsumption', 'deleteBenefitConsumption', { id: 'bc-1' },
        ACTION_TYPE.DELETE_BENEFIT_CONSUMPTION],
    ];

    it.each(MUTATIONS)('%s calls the %s service', (creator, service, entity) => {
      const text = query(actions[creator](entity, 'Label'));

      expect(text).toContain(`mutation ${service} { ${service}( input: {`);
      expect(text).toContain('clientMutationId internalId');
    });

    it.each(MUTATIONS)('%s routes its answer to the success case the reducer handles', (
      creator,
      _service,
      entity,
      actionType,
    ) => {
      const result = actions[creator](entity, 'Label');

      expect(result.type).toEqual([REQUEST(ACTION_TYPE.MUTATION), SUCCESS(actionType), ERROR(ACTION_TYPE.MUTATION)]);
      expect(result.meta.actionType).toBe(actionType);
    });

    it.each(MUTATIONS)('%s records the same mutation id it sends, with its label and time', (
      creator,
      _service,
      entity,
    ) => {
      const before = Date.now();
      const result = actions[creator](entity, 'Close payroll October');

      expect(query(result)).toContain(`clientMutationId: "${result.meta.clientMutationId}"`);
      expect(query(result)).toContain('clientMutationLabel: "Close payroll October"');
      expect(result.meta.clientMutationLabel).toBe('Close payroll October');
      expect(result.meta.requestedDateTime).toBeInstanceOf(Date);
      expect(result.meta.requestedDateTime.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('gives every mutation a fresh client id', () => {
      const first = actions.closePayroll({ id: PAYROLL_UUID }, 'Close');
      const second = actions.closePayroll({ id: PAYROLL_UUID }, 'Close');

      expect(first.meta.clientMutationId).not.toBe(second.meta.clientMutationId);
    });

    describe('payroll state changes', () => {
      it.each([
        ['closePayroll'],
        ['rejectPayroll'],
        ['makePaymentForPayroll'],
      ])('%s names exactly the payroll it was given', (creator) => {
        expect(input(actions[creator]({ id: PAYROLL_UUID, name: 'October' }, 'Label')))
          .toMatch(new RegExp(`ids: \\["${PAYROLL_UUID}"\\]$`));
      });
    });

    describe('identifying the record to delete or retry', () => {
      it.each([
        ['deletePayrolls', 'PayrollGQLType', 'ids: ["%s"]'],
        ['retriggerPayroll', 'PayrollGQLType', 'id: "%s"'],
        ['deleteBenefitConsumption', 'BenefitConsumptionGQLType', 'ids: ["%s"]'],
      ])('%s decodes a relay id to the uuid', (creator, type, shape) => {
        const result = actions[creator]({ id: globalId(type, PAYROLL_UUID) }, 'Label');

        expect(input(result)).toContain(shape.replace('%s', PAYROLL_UUID));
      });

      it.each([
        ['deletePayrolls', 'ids: ["%s"]'],
        ['retriggerPayroll', 'id: "%s"'],
        ['deleteBenefitConsumption', 'ids: ["%s"]'],
      ])('%s passes a plain uuid through untouched', (creator, shape) => {
        expect(input(actions[creator]({ id: PAYROLL_UUID }, 'Label'))).toContain(shape.replace('%s', PAYROLL_UUID));
      });

      it('deletes a payment point by the id it was given', () => {
        expect(input(actions.deletePaymentPoint({ id: 'pp-1' }, 'Label'))).toContain('ids: ["pp-1"]');
      });
    });

    describe('payment point input', () => {
      const paymentPoint = {
        id: 'pp-1',
        name: 'Main office',
        location: { id: globalId('LocationGQLType', '17') },
        ppm: { id: globalId('UserGQLType', 'user-uuid-1') },
      };

      it('sends the name, the numeric location id and the manager uuid', () => {
        const text = input(actions.createPaymentPoint(paymentPoint, 'Label'));

        expect(text).toContain('name: "Main office"');
        expect(text).toContain('locationId: 17');
        expect(text).toContain('ppmId: "user-uuid-1"');
      });

      it('includes the id only when updating an existing payment point', () => {
        expect(input(actions.updatePaymentPoint(paymentPoint, 'Label'))).toContain('id: "pp-1"');
        expect(input(actions.createPaymentPoint({ ...paymentPoint, id: undefined }, 'Label'))).not.toMatch(/\bid:/);
      });

      it('omits every field it was not given', () => {
        expect(input(actions.createPaymentPoint({}, 'Label'))).toMatch(/clientMutationLabel: "Label"$/);
      });
    });

    describe('payroll input', () => {
      const payroll = {
        name: 'October',
        paymentPoint: { id: globalId('PaymentPointGQLType', 'pp-uuid') },
        paymentPlan: { id: globalId('PaymentPlanGQLType', 'plan-uuid') },
        paymentCycle: { id: globalId('PaymentCycleGQLType', 'cycle-uuid') },
        paymentMethod: 'StrategyOnlinePayment',
        dateValidFrom: '2026-10-01',
        dateValidTo: '2026-10-31',
      };

      it('sends the decoded plan, cycle and point ids with the method and validity', () => {
        const text = input(actions.createPayroll(payroll, 'Label'));

        expect(text).toContain('name: "October"');
        expect(text).toContain('paymentPointId: "pp-uuid"');
        expect(text).toContain('paymentPlanId: "plan-uuid"');
        expect(text).toContain('paymentCycleId: "cycle-uuid"');
        expect(text).toContain('paymentMethod: "StrategyOnlinePayment"');
        expect(text).toContain('dateValidFrom: "2026-10-01"');
        expect(text).toContain('dateValidTo: "2026-10-31"');
      });

      it('omits the optional fields it was not given', () => {
        const text = input(actions.createPayroll({ name: 'October' }, 'Label'));

        expect(text).not.toMatch(/paymentPointId|paymentCycleId|jsonExt|fromFailedInvoicesPayrollId|\bid:/);
      });

      it('sends the advanced criteria json as a GraphQL string', () => {
        const jsonExt = JSON.stringify({ advanced_criteria: [{ custom_filter_condition: 'age__gte__integer=18' }] });
        const text = input(actions.createPayroll({ ...payroll, jsonExt }, 'Label'));

        expect(text).toContain(
          'jsonExt: "{\\"advanced_criteria\\":[{\\"custom_filter_condition\\":\\"age__gte__integer=18\\"}]}"',
        );
      });

      it('links a payroll created from failed invoices to the payroll it came from', () => {
        const text = input(actions.createPayroll({ ...payroll, id: null, fromFailedInvoicesPayrollId: PAYROLL_UUID },
          'Label'));

        expect(text).toContain(`fromFailedInvoicesPayrollId: "${PAYROLL_UUID}"`);
        expect(text).not.toMatch(/\bid:/);
      });
    });

    // Currently fails: formatGQLString escapes quotes before backslashes, so the backslash
    // it adds for the quote is itself doubled and the quote ends up unescaped —
    // the mutation is malformed for any name containing a double quote.
    it.fails.each([
      ['a payroll', 'createPayroll'],
      ['a payment point', 'createPaymentPoint'],
    ])('escapes a double quote in the name of %s', (_label, creator) => {
      expect(input(actions[creator]({ name: 'October "final"' }, 'Label'))).toContain('name: "October \\"final\\""');
    });
  });
});
