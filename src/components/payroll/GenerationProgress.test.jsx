import React from 'react';
import { describe, expect, it } from 'vitest';

const { default: GenerationProgress } = await import('./GenerationProgress');
const { renderWithProviders, screen } = await import('@openimis/fe-core/testing');

describe('GenerationProgress', () => {
  it('shows how far generation has got', () => {
    renderWithProviders(<GenerationProgress jsonExt={{ progress: 40 }} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
  });

  it('spins without a value when the progress is unknown', () => {
    renderWithProviders(<GenerationProgress jsonExt={undefined} />);

    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });
});
