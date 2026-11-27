import React from 'react';
import {
  Modal, Backdrop, Fade, Box, Typography, Button,
} from '@mui/material';
import { useTranslations, useModulesManager } from '@openimis/fe-core';

function ErrorSummaryModal({ open, onClose, benefitAttachment }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('payroll', modulesManager);

  const jsonExt = benefitAttachment?.benefit?.jsonExt ? JSON.parse(benefitAttachment.benefit.jsonExt) : {};
  const outputGateway = `${jsonExt?.output_gateway}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{
        backdrop: Backdrop
      }}
      slotProps={{
        backdrop: {
          timeout: 500,
        }
      }}
    >
      <Fade in={open}>
        <Box
          style={{
            backgroundColor: 'white', margin: 'auto', maxWidth: 400, outline: 'none',
          }}
          sx={{
            p: 4
          }}
        >
          <Typography variant="h6">{formatMessage('payroll.errorSummary.title')}</Typography>
          {/* Conditional rendering based on output_gateway */}
          {outputGateway === null || outputGateway === 'undefined' ? (
            <Typography>
              {formatMessage('payroll.errorSummary.outputGateway.noInfo')}
            </Typography>
          ) : (
            <Typography>
              {outputGateway}
            </Typography>
          )}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 2
            }}>
            <Button onClick={onClose} variant="contained" color="primary">
              {formatMessage('payroll.errorSummary.close')}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

export default ErrorSummaryModal;
