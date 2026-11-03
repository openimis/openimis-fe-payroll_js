/* eslint-disable import/no-extraneous-dependencies -- Vitest runs from the frontend assembly */
import React, { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { makeStore, renderWithProviders } from '@openimis/fe-core/testing';
import { createPayroll, fetchPayrollSystemStatus } from '../../actions';
import { RIGHT_PAYROLL_CREATE, RIGHT_PAYROLL_SEARCH } from '../../constants';
import PayrollPage from './PayrollPage';

// The props the page last gave its Form, to drive edits and the save from a test.
const form = vi.hoisted(() => ({ props: null }));

// The fe-core barrel cannot be loaded from a test (see FilterDialog.test.jsx): stub only the
// exports this page reaches.
vi.mock('@openimis/fe-core', () => ({
  Form: (props) => {
    form.props = props;
    return null;
  },
  useHistory: () => ({ goBack: () => {} }),
  useModulesManager: () => ({}),
  useTranslations: () => ({
    formatMessage: (id) => id,
    formatMessageWithValues: (id, values) => `${id} ${JSON.stringify(values ?? {})}`,
  }),
  coreConfirm: () => ({ type: 'TEST_CONFIRM' }),
  journalize: () => ({ type: 'TEST_JOURNALIZE' }),
  GetIconComponent: () => () => null,
}));
vi.mock('../../actions', () => ({
  fetchPayroll: () => ({ type: 'TEST_FETCH_PAYROLL' }),
  clearPayroll: () => ({ type: 'TEST_CLEAR_PAYROLL' }),
  createPayroll: vi.fn(() => ({ type: 'TEST_CREATE_PAYROLL' })),
  retriggerPayroll: () => ({ type: 'TEST_RETRIGGER_PAYROLL' }),
  fetchPayrollSystemStatus: vi.fn(() => ({ type: 'TEST_FETCH_SYSTEM_STATUS' })),
}));
vi.mock('../../components/payroll/PayrollHeadPanel', () => ({ default: () => null }));
vi.mock('../../components/payroll/PayrollTab', () => ({ default: () => null }));

function renderPage(rights) {
  const store = makeStore({
    reducers: { payroll: (state = {}) => state },
    preloadedState: { core: { user: { i_user: { rights } } }, payroll: {} },
  });
  renderWithProviders(<PayrollPage match={{ params: {} }} />, { store });
}

describe('PayrollPage', () => {
  // OP-3268: creation is blocked while the code triggers are not synced, so a user who
  // may create but not search payrolls needs the status as much as anyone.
  it('checks the system status for a user who may only create payrolls', () => {
    renderPage([RIGHT_PAYROLL_CREATE]);

    expect(fetchPayrollSystemStatus).toHaveBeenCalled();
  });

  it('checks the system status for a user who may search payrolls', () => {
    renderPage([RIGHT_PAYROLL_SEARCH]);

    expect(fetchPayrollSystemStatus).toHaveBeenCalled();
  });

  // OP-3278: on create the loaded payroll is still empty, so a label built from it named
  // nothing ("Create Payroll "). The journal entry must name the payroll being saved.
  it('names the payroll being created in the mutation label', () => {
    renderPage([RIGHT_PAYROLL_CREATE]);

    act(() => form.props.onEditedChanged({ name: 'UAT Payroll X' }));
    act(() => form.props.save());

    expect(createPayroll).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'UAT Payroll X' }),
      expect.stringContaining('UAT Payroll X'),
    );
  });
});
