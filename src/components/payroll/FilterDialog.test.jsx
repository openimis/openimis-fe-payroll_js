/* eslint-disable import/no-extraneous-dependencies -- Vitest runs from the frontend assembly */
import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@openimis/fe-core/testing';
import FilterDialog from './FilterDialog';

// The fe-core barrel imports UserPicker before withModulesManager is initialized,
// so loading it from a test throws. Stub only the exports this dialog reaches.
vi.mock('@openimis/fe-core', async () => {
  const ReactActual = (await import('react')).default;

  const combobox = () => ReactActual.createElement('div', { role: 'combobox' });
  const passthrough = () => ReactActual.createElement('input', {});

  return {
    decodeId: (id) => id,
    fetchCustomFilter: () => ({ type: 'TEST_FETCH_CUSTOM_FILTER' }),
    formatMessage: (intl, module, id) => {
      const prefixed = `${module}.${id}`;
      if (intl?.messages?.[prefixed]) return intl.formatMessage({ id: prefixed });
      return intl?.formatMessage ? intl.formatMessage({ id }) : id;
    },
    GetIconComponent: () => function AddIcon(props) {
      return ReactActual.createElement('span', props);
    },
    PublishedComponent: ({ pubRef, onChange }) => {
      if (pubRef !== 'socialProtection.ProjectPicker') return null;
      const pick = () => onChange([{ id: 'p1' }]);
      return ReactActual.createElement('button', { type: 'button', onClick: pick }, 'pick-project');
    },
    TextInput: passthrough,
    NumberInput: passthrough,
    SelectInput: passthrough,
    CustomFilterFieldStatusPicker: combobox,
    CustomFilterTypeStatusPicker: combobox,
  };
});

const messages = {
  'payroll.payroll.filterCriteria': 'Filter Criteria',
  'payroll.payroll.filterCriteria.tip': 'Select projects and locations.',
  'payroll.payroll.advancedCriteria.tip': 'Add a criterion.',
  'payroll.payroll.advancedFilters.button.addFilters': 'Add Criterion',
  'payroll.payroll.advancedFilters.button.clearAllFilters': 'Clear',
  'contributionPlan.paymentPlan.advancedCriteria': 'Advanced criteria',
};

function renderDialog({ objectToSave, updateAttribute }) {
  return renderWithProviders(
    <FilterDialog object={{}} objectToSave={objectToSave} updateAttribute={updateAttribute} />,
    { messages },
  );
}

describe('FilterDialog', () => {
  it('leaves jsonExt untouched when it is not an object', async () => {
    const updateAttribute = vi.fn();
    renderDialog({
      objectToSave: { jsonExt: '{oops' },
      updateAttribute,
    });

    expect(screen.getByText('Filter Criteria')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add Criterion' }));

    expect(updateAttribute).not.toHaveBeenCalled();
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });

  it('does not store a criterion that has no field or value yet', async () => {
    const updateAttribute = vi.fn();
    renderDialog({
      objectToSave: {
        jsonExt: JSON.stringify({
          advanced_criteria: [{ custom_filter_condition: 'not a condition' }],
        }),
      },
      updateAttribute,
    });

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add Criterion' }));

    expect(updateAttribute).toHaveBeenCalledWith('jsonExt', '{}');
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });

  it('keeps finished criteria, including a value of zero, and drops unfinished ones', async () => {
    const initial = JSON.stringify({
      advanced_criteria: [
        { custom_filter_condition: 'able_bodied__boolean=True' },
        { custom_filter_condition: 'number_of_children__exact__integer=0' },
        { custom_filter_condition: '__=' },
        { custom_filter_condition: 'number_of_children____integer=' },
      ],
    });
    const seen = [];

    function Echo() {
      const [jsonExt, setJsonExt] = useState(initial);
      const updateAttribute = (name, value) => {
        if (name === 'jsonExt') {
          seen.push(value);
          setJsonExt(value);
        }
      };
      return <FilterDialog object={{}} objectToSave={{ jsonExt }} updateAttribute={updateAttribute} />;
    }

    renderWithProviders(<Echo />, { messages });
    const rowsOnScreen = screen.getAllByRole('combobox').length;

    await userEvent.click(screen.getByRole('button', { name: 'pick-project' }));

    const saved = JSON.parse(seen.at(-1));
    expect(saved.filter_criteria).toEqual({ project_ids: ['p1'] });
    expect(saved.advanced_criteria.map((row) => row.custom_filter_condition)).toEqual([
      'able_bodied__boolean=True',
      'number_of_children__exact__integer=0',
    ]);
    // The parent stores the written jsonExt. The empty row must stay on screen.
    expect(screen.getAllByRole('combobox')).toHaveLength(rowsOnScreen);
  });
});
