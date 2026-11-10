import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';

// fe-core's barrel imports itself, so the real helpers come from their defining modules.
vi.mock('@openimis/fe-core', async () => {
  const modules = await vi.importActual('@openimis/fe-core/helpers/modules');
  const i18n = await vi.importActual('@openimis/fe-core/helpers/i18n');
  const history = await vi.importActual('@openimis/fe-core/helpers/history');
  return {
    useModulesManager: modules.useModulesManager,
    useTranslations: i18n.useTranslations,
    useHistory: history.useHistory,
  };
});
// The embedded benefit searcher renders fe-core's Searcher; the totals do not depend on it.
vi.mock('../BenefitConsumptionSearcherModal', () => ({ default: () => null }));
vi.mock('../../../utils/export', () => ({ default: vi.fn() }));

const { PaymentApproveForPaymentDialog } = await import('./PaymentApproveForPaymentSummary');
const { PaymentPendingPayrollPaymentDialog } = await import('./PayrollPendingPayrollSummary');
const { PaymentReconcilationSummarytDialog } = await import('./PaymentReconciliationSummaryDialog');
const { default: downloadPayroll } = await import('../../../utils/export');
const { default: messages } = await import('../../../translations/en.json');
const {
  mockModulesManager, renderWithProviders, screen, userEvent, waitFor,
} = await import('@openimis/fe-core/testing');

const PAYROLL_UUID = '2f6d3a1e-7c4b-4e0a-9a51-0d3c8b7e6f12';
const payrollDetail = (overrides = {}) => ({
  id: PAYROLL_UUID, name: 'October', paymentMethod: 'StrategyCash', ...overrides,
});
const benefit = (status, ...amounts) => ({
  status,
  benefitAttachment: amounts.map((amountTotal) => ({ bill: { amountTotal } })),
});
const PAYROLL = {
  id: PAYROLL_UUID,
  benefitConsumption: [
    benefit('RECONCILED', '100.00'),
    benefit('RECONCILED', '50.00', '25.00'),
    benefit('APPROVE_FOR_PAYMENT', '200.00'),
    benefit('ACCEPTED', '40.00'),
  ],
};

const summaryValue = (heading) => screen.getByText(heading).nextElementSibling.textContent;
const amount = (heading) => Number(summaryValue(heading).replace(/[^\d,.-]/g, '').replace(',', '.'));
const openSummary = () => userEvent.click(screen.getByRole('button', { name: 'View Reconciliation Summary' }));

const DIALOGS = [
  ['approve for payment', PaymentApproveForPaymentDialog],
  ['pending payroll', PaymentPendingPayrollPaymentDialog],
  ['reconciled payroll', PaymentReconcilationSummarytDialog],
];

describe.each(DIALOGS)('the %s summary', (_label, Dialog) => {
  let fetchPayroll;

  const renderDialog = (props = {}) => renderWithProviders(
    <Dialog
      payroll={PAYROLL}
      payrollDetail={payrollDetail()}
      fetchPayroll={fetchPayroll}
      closePayroll={vi.fn()}
      rejectPayroll={vi.fn()}
      makePaymentForPayroll={vi.fn()}
      {...props}
    />,
    { messages },
  );

  beforeEach(() => {
    fetchPayroll = vi.fn();
  });

  it('stays closed and loads nothing until asked', () => {
    renderDialog();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetchPayroll).not.toHaveBeenCalled();
  });

  it('loads the payroll it summarises when opened', async () => {
    const { modulesManager } = renderDialog();

    await openSummary();

    expect(fetchPayroll).toHaveBeenCalledExactlyOnceWith(modulesManager, [`id: "${PAYROLL_UUID}"`]);
    expect(screen.getByRole('dialog', { name: 'View Reconciliation Summary: October' })).toBeInTheDocument();
  });

  it('counts the reconciled benefits against all benefits', async () => {
    renderDialog();

    await openSummary();

    expect(summaryValue('Selected beneficiaries')).toBe('2 of 4');
  });

  it('totals every bill, and separately the bills of reconciled benefits', async () => {
    renderDialog();

    await openSummary();

    expect(amount('Total Amount for Invoice')).toBe(415);
    expect(amount('Total Delivered Per Reconciliation')).toBe(175);
  });

  it('skips benefits without a bill or without an amount', async () => {
    renderDialog({
      payroll: {
        benefitConsumption: [
          benefit('RECONCILED', '10.00'),
          { status: 'RECONCILED', benefitAttachment: [] },
          { status: 'RECONCILED', benefitAttachment: null },
          { status: 'RECONCILED', benefitAttachment: [{ bill: null }] },
          benefit('RECONCILED', null),
        ],
      },
    });

    await openSummary();

    expect(amount('Total Amount for Invoice')).toBe(10);
    expect(summaryValue('Selected beneficiaries')).toBe('5 of 5');
  });

  it('shows zeros while the payroll is still loading', async () => {
    renderDialog({ payroll: {} });

    await openSummary();

    expect(summaryValue('Selected beneficiaries')).toBe('0 of 0');
    expect(amount('Total Amount for Invoice')).toBe(0);
  });

  it('recalculates when the loaded payroll arrives', async () => {
    const { rerender } = renderDialog({ payroll: {} });
    await openSummary();

    rerender(
      <Dialog payroll={PAYROLL} payrollDetail={payrollDetail()} fetchPayroll={fetchPayroll} />,
    );

    expect(amount('Total Amount for Invoice')).toBe(415);
  });

  it('downloads the reconciliation template for this payroll', async () => {
    renderDialog();
    await openSummary();

    await userEvent.click(screen.getByRole('button', { name: 'Download' }));

    expect(downloadPayroll).toHaveBeenCalledExactlyOnceWith(PAYROLL_UUID, 'October');
  });

  it('closes without acting on the payroll', async () => {
    renderDialog();
    await openSummary();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  // Currently fails: bill amounts are summed as binary floats with parseFloat, so
  // 10.10 + 20.20 is shown as 30.299999999999997 — the invoice total a user
  // approves is not an amount of money.
  it.fails('totals the bill amounts to the cent', async () => {
    renderDialog({ payroll: { benefitConsumption: [benefit('RECONCILED', '10.10', '20.20')] } });

    await openSummary();

    expect(amount('Total Amount for Invoice')).toBe(30.3);
    expect(amount('Total Delivered Per Reconciliation')).toBe(30.3);
  });
});

describe('approving a payroll for payment', () => {
  const actions = () => ({
    closePayroll: vi.fn(), rejectPayroll: vi.fn(), makePaymentForPayroll: vi.fn(),
  });

  const renderDialog = (props = {}) => renderWithProviders(
    <PaymentApproveForPaymentDialog
      payroll={PAYROLL}
      payrollDetail={payrollDetail()}
      fetchPayroll={vi.fn()}
      {...actions()}
      {...props}
    />,
    { messages },
  );

  const button = (name) => screen.getByRole('button', { name });

  it('allows approval of a cash payroll once some benefits are reconciled', async () => {
    renderDialog();
    await openSummary();

    expect(button('Approve and Close')).toBeEnabled();
  });

  it('blocks approval of a cash payroll with nothing reconciled', async () => {
    renderDialog({ payroll: { benefitConsumption: [benefit('APPROVE_FOR_PAYMENT', '10.00')] } });
    await openSummary();

    expect(summaryValue('Selected beneficiaries')).toBe('0 of 1');
    expect(button('Approve and Close')).toBeDisabled();
  });

  it.each([
    ['blocks', [benefit('RECONCILED', '10.00')], false],
    ['allows', [benefit('APPROVE_FOR_PAYMENT', '10.00')], true],
  ])('%s approval of an online payroll by the benefits approved for payment', async (
    _label,
    benefitConsumption,
    enabled,
  ) => {
    renderDialog({ payroll: { benefitConsumption }, payrollDetail: payrollDetail({ paymentMethod: 'StrategyOnlinePayment' }) });
    await openSummary();

    expect(button('Approve and Close').disabled).toBe(!enabled);
  });

  it('offers to make the payment only for an online payroll', async () => {
    const { unmount } = renderDialog();
    await openSummary();
    expect(screen.queryByRole('button', { name: 'Make Payment' })).not.toBeInTheDocument();
    unmount();

    renderDialog({ payrollDetail: payrollDetail({ paymentMethod: 'StrategyOnlinePayment' }) });
    await openSummary();
    expect(button('Make Payment')).toBeInTheDocument();
  });

  it.each([
    ['Approve and Close', 'closePayroll', 'StrategyCash'],
    ['Reject', 'rejectPayroll', 'StrategyCash'],
    ['Make Payment', 'makePaymentForPayroll', 'StrategyOnlinePayment'],
  ])('%s submits %s for exactly this payroll and closes the summary', async (name, creator, paymentMethod) => {
    const spies = actions();
    const detail = payrollDetail({ paymentMethod });
    renderDialog({ ...spies, payrollDetail: detail });
    await openSummary();

    await userEvent.click(button(name));

    expect(spies[creator]).toHaveBeenCalledExactlyOnceWith(detail, expect.any(String));
    Object.entries(spies).filter(([key]) => key !== creator).forEach(([, spy]) => expect(spy).not.toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  // Currently fails: all three decisions are labelled with payroll.mutation.closeLabel,
  // a key the module's translations do not define, so the journal shows the raw
  // message id — and a rejection or payment would read as a close if it did exist.
  it.fails.each([
    ['Approve and Close', 'closePayroll', 'StrategyCash'],
    ['Reject', 'rejectPayroll', 'StrategyCash'],
    ['Make Payment', 'makePaymentForPayroll', 'StrategyOnlinePayment'],
  ])('labels the journal entry of %s with a translated message', async (name, creator, paymentMethod) => {
    const spies = actions();
    renderDialog({ ...spies, payrollDetail: payrollDetail({ paymentMethod }) });
    await openSummary();

    await userEvent.click(button(name));

    expect(spies[creator].mock.calls[0][1]).not.toMatch(/^payroll\.mutation\./);
  });

  // Currently fails: the same closeLabel key is used for all three decisions, so a
  // rejection and a payment are journalled under the same label as a close.
  it.fails('labels each payroll decision differently in the journal', async () => {
    const labels = [];
    for (const [name, creator, paymentMethod] of [
      ['Approve and Close', 'closePayroll', 'StrategyOnlinePayment'],
      ['Reject', 'rejectPayroll', 'StrategyOnlinePayment'],
      ['Make Payment', 'makePaymentForPayroll', 'StrategyOnlinePayment'],
    ]) {
      const spies = actions();
      const { unmount } = renderDialog({
        ...spies,
        payroll: { benefitConsumption: [benefit('APPROVE_FOR_PAYMENT', '10.00')] },
        payrollDetail: payrollDetail({ paymentMethod }),
      });
      // eslint-disable-next-line no-await-in-loop
      await openSummary();
      // eslint-disable-next-line no-await-in-loop
      await userEvent.click(button(name));
      labels.push(spies[creator].mock.calls[0][1]);
      unmount();
    }

    expect(new Set(labels).size).toBe(3);
  });
});

describe('a reconciled payroll with failed invoices', () => {
  function CurrentPath() {
    return <output>{useLocation().pathname}</output>;
  }

  const renderDialog = (payroll) => renderWithProviders(
    <>
      <PaymentReconcilationSummarytDialog payroll={payroll} payrollDetail={payrollDetail()} fetchPayroll={vi.fn()} />
      <CurrentPath />
    </>,
    {
      messages,
      route: '/payrolls',
      modulesManager: mockModulesManager({ getRef: (ref) => (ref === 'payroll.route.payroll' ? 'payroll' : null) }),
    },
  );

  const createButton = () => screen.getByRole('button', { name: 'Create Payment For Failed Invoice' });

  it('offers no follow-up payroll when every benefit was reconciled', async () => {
    renderDialog({ benefitConsumption: [benefit('RECONCILED', '10.00'), benefit('RECONCILED', '5.00')] });
    await openSummary();

    expect(summaryValue('Selected beneficiaries')).toBe('2 of 2');
    expect(createButton()).toBeDisabled();
  });

  it('opens a new payroll prefilled from this one for the unreconciled benefits', async () => {
    renderDialog(PAYROLL);
    await openSummary();

    await userEvent.click(createButton());

    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent(
      `/payroll/${PAYROLL_UUID}/createPayrollFromFailedInvoices=true`,
    );
  });
});
