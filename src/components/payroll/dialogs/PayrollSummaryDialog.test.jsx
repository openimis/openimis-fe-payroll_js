/* eslint-disable import/no-extraneous-dependencies -- Vitest runs from the frontend assembly */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  renderWithProviders, screen, userEvent, waitFor,
} from '@openimis/fe-core/testing';
import PayrollSummaryDialog, { summarizePayroll } from './PayrollSummaryDialog';

// The fe-core barrel cannot be loaded from a test: stub only the exports this dialog reaches.
vi.mock('@openimis/fe-core', () => ({
  useModulesManager: () => ({}),
  useTranslations: () => ({
    formatMessage: (id) => id,
    formatMessageWithValues: (id, values) => `${id} ${JSON.stringify(values)}`,
  }),
}));
vi.mock('../BenefitConsumptionSearcherModal', () => ({
  default: ({ reconciledMode }) => <div data-testid="searcher" data-reconciled={String(!!reconciledMode)} />,
}));
const downloadPayroll = vi.fn();
vi.mock('../../../utils/export', () => ({ default: (...args) => downloadPayroll(...args) }));

const benefit = (status, ...amounts) => ({
  status,
  benefitAttachment: amounts.map((amountTotal) => ({ bill: { amountTotal } })),
});
const payroll = {
  benefitConsumption: [
    benefit('RECONCILED', '10.5', '2'),
    benefit('APPROVE_FOR_PAYMENT', '4'),
    benefit('PENDING'),
  ],
};
const payrollDetail = { id: 'p1', name: 'November' };

describe('summarizePayroll', () => {
  it('counts the beneficiaries and totals the bills by status', () => {
    expect(summarizePayroll(payroll)).toEqual({
      totalBeneficiaries: 3,
      selectedBeneficiaries: 1,
      approvedBeneficiaries: 1,
      totalBillAmount: 16.5,
      totalReconciledBillAmount: 12.5,
    });
  });

  it('reads a payroll without benefit consumptions as empty', () => {
    expect(summarizePayroll({})).toMatchObject({ totalBeneficiaries: 0, totalBillAmount: 0 });
  });
});

describe('PayrollSummaryDialog', () => {
  const open = async (props = {}) => {
    const fetchPayroll = vi.fn();
    renderWithProviders(
      <PayrollSummaryDialog payroll={payroll} payrollDetail={payrollDetail} fetchPayroll={fetchPayroll} {...props} />,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'payroll.viewReconciliationSummary' }));
    return fetchPayroll;
  };

  it('fetches the payroll and shows its summary when opened', async () => {
    const fetchPayroll = await open();

    expect(fetchPayroll).toHaveBeenCalledWith({}, ['id: "p1"']);
    expect(await screen.findByText('16.5')).toBeInTheDocument();
    expect(screen.getByText('12.5')).toBeInTheDocument();
    expect(screen.getByTestId('searcher').dataset.reconciled).toBe('false');
  });

  it('downloads the payroll', async () => {
    await open();
    await userEvent.setup().click(screen.getByRole('button', { name: 'payroll.summary.download' }));

    expect(downloadPayroll).toHaveBeenCalledWith('p1', 'November');
  });

  it('places the extra actions around the shared ones, with the summary and a way to close', async () => {
    await open({
      reconciledMode: true,
      renderActionsBeforeDownload: ({ selectedBeneficiaries }) => <button type="button">{`before ${selectedBeneficiaries}`}</button>,
      renderActionsAfterDownload: ({ approvedBeneficiaries }) => <button type="button">{`after ${approvedBeneficiaries}`}</button>,
      renderActionsBeforeClose: ({ handleClose }) => <button type="button" onClick={handleClose}>closeIt</button>,
    });

    const names = screen.getAllByRole('button').map((b) => b.textContent);
    expect(names).toEqual(['before 1', 'payroll.summary.download', 'after 1', 'closeIt', 'payroll.summary.close']);
    expect(screen.getByTestId('searcher').dataset.reconciled).toBe('true');

    await userEvent.setup().click(screen.getByRole('button', { name: 'closeIt' }));
    await waitFor(() => expect(screen.queryByText('payroll.summary.download')).not.toBeInTheDocument());
  });
});
