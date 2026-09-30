import React from 'react';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';

// fe-core's barrel imports itself, so the real helpers come from their defining modules.
vi.mock('@openimis/fe-core', async () => {
  const selectInput = await vi.importActual('@openimis/fe-core/components/inputs/SelectInput');
  return { SelectInput: selectInput.default };
});

const { PaymentMethodPicker } = await import('./PaymentMethodPicker');
const { default: messages } = await import('../translations/en.json');
const {
  renderWithProviders, screen, userEvent,
} = await import('@openimis/fe-core/testing');

const METHODS = [{ name: 'StrategyOnlinePayment' }, { name: 'StrategyCash' }];

const allMessages = { ...messages, 'core.pickerNoOptionsLabel': 'No options' };

describe('PaymentMethodPicker', () => {
  let fetchPaymentMethods;

  const renderPicker = (props = {}) => renderWithProviders(
    <PaymentMethodPicker
      label="payroll.paymentMethod"
      onChange={() => {}}
      paymentMethods={METHODS}
      fetchPaymentMethods={fetchPaymentMethods}
      {...props}
    />,
    { messages: allMessages },
  );

  const openOptions = async () => {
    await userEvent.click(screen.getByRole('combobox'));
    return screen.getAllByRole('option').map((option) => option.textContent);
  };

  beforeEach(() => {
    fetchPaymentMethods = vi.fn();
  });

  it('loads the payment methods once when it mounts', () => {
    const { rerender } = renderPicker();
    rerender(
      <PaymentMethodPicker label="payroll.paymentMethod" paymentMethods={METHODS} fetchPaymentMethods={fetchPaymentMethods} />,
    );

    expect(fetchPaymentMethods).toHaveBeenCalledExactlyOnceWith({});
  });

  it('offers every method by name', async () => {
    renderPicker();

    expect(await openOptions()).toEqual(['StrategyOnlinePayment', 'StrategyCash']);
  });

  it.each([
    ['the list has not loaded', undefined],
    ['the list is null', null],
    ['the response was not a list', { name: 'StrategyCash' }],
  ])('says there is nothing to pick when %s', async (_label, paymentMethods) => {
    renderPicker({ paymentMethods });

    expect(await openOptions()).toEqual(['No options']);
  });

  it('reports the chosen method by its name', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'StrategyCash' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('StrategyCash');
  });

  it('puts an empty choice first when one is allowed', async () => {
    renderPicker({ withNull: true });

    const options = await openOptions();
    expect(options).toHaveLength(3);
    expect(options.slice(1)).toEqual(['StrategyOnlinePayment', 'StrategyCash']);
  });

  it('reports the empty choice as no method', async () => {
    const onChange = vi.fn();
    renderPicker({ withNull: true, value: 'StrategyCash', onChange });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getAllByRole('option')[0]);

    expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
  });

  // Currently fails: the null label is used as the option text verbatim, while callers
  // pass a message key (PayrollFilter passes payroll.tooltip.any), as they do to
  // fe-core's own pickers — so the filter's first option reads
  // "payroll.tooltip.any".
  it.fails("translates the caller's label for the empty choice", async () => {
    renderPicker({ withNull: true, nullLabel: 'payroll.tooltip.any' });

    expect((await openOptions())[0]).toBe('Any');
  });

  it('labels itself from the module translations', () => {
    renderPicker();

    expect(screen.getByText('Payment Method', { selector: 'label' })).toBeInTheDocument();
  });

  it('drops the label when asked to render without one', () => {
    renderPicker({ withLabel: false });

    expect(screen.queryByText('Payment Method', { selector: 'label' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
