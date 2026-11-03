/* eslint-disable import/no-extraneous-dependencies -- Vitest runs from the frontend assembly */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@openimis/fe-core/testing';
import PayrollHeadPanel from './PayrollHeadPanel';

// The fe-core barrel cannot be loaded from a test (see FilterDialog.test.jsx): stub only the
// exports this panel reaches. Published components report the props they were given.
vi.mock('@openimis/fe-core', async () => {
  const ReactActual = (await import('react')).default;

  class FormPanel extends ReactActual.Component {
    updateAttribute = () => {};
  }

  return {
    FormPanel,
    formatMessage: (intl, module, id) => `${module}.${id}`,
    GRID_RESPONSIVE_STANDARD: 4,
    PublishedComponent: ({
      pubRef, benefitPlanType, entityType, entityId,
    }) => ReactActual.createElement('div', {
      'data-testid': pubRef,
      'data-benefit-plan-type': benefitPlanType ?? '',
      'data-entity-type': entityType ?? '',
      'data-entity-id': entityId ?? '',
    }),
    TextInput: ({ label, value, readOnly }) => ReactActual.createElement('input', {
      'aria-label': label,
      value: value ?? '',
      readOnly,
      onChange: () => {},
    }),
    withModulesManager: (component) => component,
  };
});
vi.mock('./FilterDialog', () => ({ default: () => null }));
vi.mock('./GenerationProgress', () => ({ default: () => null }));
vi.mock('./PayrollStatusPicker', () => ({ default: () => null }));
vi.mock('../../pickers/PaymentMethodPicker', () => ({ default: () => null }));

// A payment plan carries its benefit plan as a JSON string, itself JSON-encoded.
const paymentPlanOf = (benefitPlan) => ({
  id: 'pp1',
  code: 'PP1',
  name: 'Monthly',
  benefitPlan: JSON.stringify(JSON.stringify(benefitPlan)),
});

describe('PayrollHeadPanel', () => {
  // OP-3263: a payment plan linked to an insurance product has no programme to pay.
  it('only offers the payment plans of a programme', () => {
    renderWithProviders(<PayrollHeadPanel edited={{}} />);

    expect(screen.getByTestId('contributionPlan.PaymentPlanPicker').dataset.benefitPlanType)
      .toBe('benefitplan');
  });

  it('shows the programme of the picked payment plan, read-only', () => {
    const edited = { paymentPlan: paymentPlanOf({ id: 'bp1', code: 'CT01', name: 'Cash Transfer' }) };

    renderWithProviders(<PayrollHeadPanel edited={edited} />);

    const programme = screen.getByLabelText('payroll.benefitPlan');
    expect(programme).toHaveValue('CT01 - Cash Transfer');
    expect(programme).toHaveAttribute('readonly');
  });

  it('shows no programme until a payment plan is picked', () => {
    renderWithProviders(<PayrollHeadPanel edited={{}} />);

    expect(screen.queryByLabelText('payroll.benefitPlan')).toBeNull();
  });

  // OP-3279: a payroll with a pending task cannot be updated until the task is resolved.
  it('shows the pending tasks of the payroll', () => {
    renderWithProviders(<PayrollHeadPanel edited={{ id: 'payroll-uuid' }} />);

    const count = screen.getByTestId('tasksManagement.PendingTaskCount');
    expect(count.dataset.entityType).toBe('payroll.payroll');
    expect(count.dataset.entityId).toBe('payroll-uuid');
  });
});
