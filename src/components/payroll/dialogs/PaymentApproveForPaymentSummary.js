import React, { useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import {
  formatDateFromISO,
  ProgressOrError,
  withModulesManager,
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import {
  TableHead,
  TableBody,
  Table,
  TableCell,
  TableRow,
  TableFooter,
  TableContainer,
  Paper,
} from '@material-ui/core';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { MODULE_NAME } from '../../../constants';
import PhotoCameraOutlinedIcon from '@material-ui/icons/PhotoCameraOutlined';

const styles = (theme) => ({
  item: theme.paper.item,
});

function PaymentApproveForPaymentDialog({
  classes,
  history,
  payroll,
}) {
  console.log(payroll);
  const [isOpen, setIsOpen] = useState(false);
  const [records, setRecords] = useState([]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);

  // const downloadInvalidItemsFromUpload = (uploadId) => {
  //  downloadInvalidItems(uploadId);
  // };

  useEffect(() => {
    if (isOpen) {
      // const params = [`benefitPlan_Id:"${benefitPlan.id}"`];
      // fetchUploadHistory(params);
    }
  }, [isOpen]);

  // useEffect(() => {
  //  setRecords(history);
  // }, [fetchedHistory]);

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="contained"
        color="primary"
        className={classes.button}
      >
        {formatMessage('payroll.viewReconciliationSummary')}
      </Button>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        PaperProps={{
          style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '75%',
            maxWidth: '75%',
          },
        }}
      >
        <DialogTitle
          style={{
            marginTop: '10px',
          }}
        >
          {formatMessageWithValues('payroll.reconciliationSummary', { payrollName: payroll.name })}
        </DialogTitle>
        <DialogContent>
          <div
            style={{ backgroundColor: '#DFEDEF' }}
          >

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead className={classes.header}>
                  <TableRow className={classes.headerTitle}>
                    <TableCell />
                    <TableCell>
                      {formatMessage(
                        'payroll.summary.name',
                      )}
                    </TableCell>
                    <TableCell>
                      {formatMessage(
                        'payroll.summary.amount',
                      )}
                    </TableCell>
                    <TableCell>
                      {formatMessage(
                        'payroll.summary.receipt',
                      )}
                    </TableCell>
                    <TableCell>
                      {formatMessage(
                        'payroll.summary.date',
                      )}
                    </TableCell>
                    <TableCell />
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payroll.benefitConsumption.map((benefit) => (
                    benefit.benefitAttachment.map((attachment) => (
                      <TableRow key={attachment?.bill?.code}>
                        <TableCell>
                          {/* Conditionally render the default photo */}
                          {benefit.receipt ? (
                            <PhotoCameraOutlinedIcon fontSize="large" />
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {`${benefit.individual.firstName} ${benefit.individual.lastName}`}
                        </TableCell>
                        <TableCell>
                          {attachment.bill.amountTotal}
                        </TableCell>
                        <TableCell>
                          {benefit?.receipt ?? ''}
                        </TableCell>
                        <TableCell>
                          {benefit.dateDue}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => {}}
                            variant="contained"
                            color="primary"
                            disabled={benefit.receipt === null || typeof benefit.receipt === 'undefined'}
                          >
                            {formatMessage('payroll.summary.confirm')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
                <TableFooter />
              </Table>
            </TableContainer>
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
                Close
              </Button>
            </div>
          </div>
        </DialogActions>
      </Dialog>
    </>
  );
}

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  confirmed: state.core.confirmed,
  history: state.socialProtection.beneficiaryDataUploadHistory,
  fetchedHistory: state.socialProtection.fetchedBeneficiaryDataUploadHistory,
  fetchingHistory: state.socialProtection.fetchingBeneficiaryDataUploadHistory,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(PaymentApproveForPaymentDialog);
