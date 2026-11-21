import React, { useState } from 'react';
import { Grid } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {
  formatMessage,
  renderInputComponent,
  createFieldsBasedOnJSON,
  injectIntl,
} from '@openimis/fe-core';
import { styled } from '@mui/material/styles';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { MODULE_NAME } from '../../../constants';

const StyledAdditionalFieldsDialog = styled('div')(({ theme }) => ({
  '& .item': theme.paper?.item ?? {},
}));

function AdditionalFieldsDialog({
  intl,
  jsonExt,
  buttonLabel,
  title,
}) {
  // eslint-disable-next-line no-param-reassign
  if (!jsonExt) jsonExt = '{}';
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };
  const jsonExtFields = createFieldsBasedOnJSON(JSON.stringify(JSON.parse(jsonExt).extra_info));

  return (
    <StyledAdditionalFieldsDialog>
      <Button
        onClick={handleOpen}
        variant="outlined"
        color="#DFEDEF"
        style={{
          border: '0px',
          marginTop: '6px',
        }}
      >
        {formatMessage(intl, 'payroll', buttonLabel)}
      </Button>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        slotProps={{
          paper: {
            style: {
              width: 1200,
              maxWidth: 1200,
              maxHeight: 900,
            },
          }
        }}
      >
        <form noValidate>
          <DialogTitle
            style={{
              marginTop: '10px',
            }}
          >
            {formatMessage(intl, 'payroll', title)}
          </DialogTitle>
          <DialogContent>
            <div
              style={{ backgroundColor: '#DFEDEF', paddingLeft: '10px', paddingBottom: '10px' }}
            >
              <Grid container className="item">
                {jsonExtFields?.map((jsonExtField) => (
                  <Grid size={6} className="item">
                    {renderInputComponent(MODULE_NAME, jsonExtField)}
                  </Grid>
                ))}
              </Grid>
            </div>
          </DialogContent>
          <DialogActions
            style={{
              display: 'inline',
              paddingLeft: '10px',
              marginTop: '25px',
              marginBottom: '15px',
            }}
          >
            <div style={{ maxWidth: '1000px' }}>
              <div style={{ float: 'left' }}>
                <Button
                  onClick={handleClose}
                  variant="outlined"
                  autoFocus
                  style={{
                    margin: '0 16px',
                    marginBottom: '15px',
                  }}
                >
                  {formatMessage(intl, 'payroll', 'payroll.additonalFields.close')}
                </Button>
              </div>
              <div style={{ float: 'right', paddingRight: '16px' }} />
            </div>
          </DialogActions>
        </form>
      </Dialog>
    </StyledAdditionalFieldsDialog>
  );
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
}, dispatch);

export { StyledAdditionalFieldsDialog };
export default injectIntl(
  connect(mapStateToProps, mapDispatchToProps)(AdditionalFieldsDialog),
);
