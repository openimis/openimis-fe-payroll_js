import React from 'react';

import { LinearProgress } from '@mui/material';

import { getProgress } from '../../utils/jsonExt';

function GenerationProgress({ jsonExt }) {
  const progress = getProgress(jsonExt);
  return (
    <LinearProgress
      variant={progress === null ? 'indeterminate' : 'determinate'}
      value={progress ?? 0}
    />
  );
}

export default GenerationProgress;
