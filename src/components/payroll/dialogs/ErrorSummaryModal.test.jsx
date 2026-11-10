import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// fe-core's barrel imports itself, so the real helpers come from their defining modules.
vi.mock('@openimis/fe-core', async () => {
  const modules = await vi.importActual('@openimis/fe-core/helpers/modules');
  const i18n = await vi.importActual('@openimis/fe-core/helpers/i18n');
  return { useModulesManager: modules.useModulesManager, useTranslations: i18n.useTranslations };
});

const { default: ErrorSummaryModal } = await import('./ErrorSummaryModal');
const { default: messages } = await import('../../../translations/en.json');
const { renderWithProviders, screen, userEvent } = await import('@openimis/fe-core/testing');

const NO_INFO = /There is no information from payment gateway/;
const attachment = (jsonExt) => ({ benefit: { jsonExt } });

const renderModal = (props = {}) => renderWithProviders(
  <ErrorSummaryModal open onClose={() => {}} {...props} />,
  { messages },
);

describe('ErrorSummaryModal', () => {
  it('shows what the payment gateway said about the invoice', () => {
    renderModal({ benefitAttachment: attachment('{"output_gateway":"Account closed"}') });

    expect(screen.getByText('Error summary')).toBeInTheDocument();
    expect(screen.getByText('Account closed')).toBeInTheDocument();
    expect(screen.queryByText(NO_INFO)).not.toBeInTheDocument();
  });

  it.each([
    ['the benefit has no json_ext', attachment(null)],
    ['the gateway left no output', attachment('{"other":1}')],
    ['there is no attachment', undefined],
  ])('says there is no gateway information when %s', (_label, benefitAttachment) => {
    renderModal({ benefitAttachment });

    expect(screen.getByText(NO_INFO)).toBeInTheDocument();
  });

  // Currently fails: the output is interpolated into a template string before it is
  // compared, so a null output_gateway becomes the text "null" and is shown
  // instead of the no-information message.
  it.fails('says there is no gateway information when the output is null', () => {
    renderModal({ benefitAttachment: attachment('{"output_gateway":null}') });

    expect(screen.getByText(NO_INFO)).toBeInTheDocument();
  });

  it('renders nothing while closed', () => {
    renderModal({ open: false, benefitAttachment: attachment('{"output_gateway":"Account closed"}') });

    expect(screen.queryByText('Account closed')).not.toBeInTheDocument();
  });

  it('closes from its button', async () => {
    const onClose = vi.fn();
    renderModal({ onClose, benefitAttachment: attachment(null) });

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
