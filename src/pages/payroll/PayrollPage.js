import React, { useState, useRef, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { makeStyles } from '@material-ui/styles';
import DeleteIcon from '@material-ui/icons/Delete';

import {
  Form,
  useHistory,
  useModulesManager,
  useTranslations,
  coreConfirm,
  clearConfirm,
  journalize,
} from '@openimis/fe-core';
import {
  fetchPayroll,
  clearPayroll,
  createPayroll,
  deletePayrolls,
} from '../../actions';
import {
  MODULE_NAME,
  RIGHT_PAYROLL_CREATE,
} from '../../constants';
import { ACTION_TYPE } from '../../reducer';
import { mutationLabel, pageTitle } from '../../utils/string-utils';
import PayrollHeadPanel from './PayrollHeadPanel';
import PayrollTab from './PayrollTab';

const useStyles = makeStyles((theme) => ({
  page: theme.page,
}));

function PayrollPage({
  payrollUuid,
  rights,
  confirmed,
  submittingMutation,
  mutation,
  payroll,
  fetchPayroll,
  createPayroll,
  clearPayroll,
  deletePayrolls,
  coreConfirm,
  clearConfirm,
  journalize,
}) {
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const history = useHistory();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);

  const [editedPayroll, setEditedPayroll] = useState({});
  const [confirmedAction, setConfirmedAction] = useState(() => null);
  const prevSubmittingMutationRef = useRef();
  const readOnly = Boolean(payroll?.id);

  const back = () => history.goBack();

  useEffect(() => {
    if (payrollUuid) {
      fetchPayroll(modulesManager, [`id: "${payrollUuid}"`]);
    }
  }, [payrollUuid]);

  useEffect(() => {
    if (confirmed) confirmedAction();
    return () => confirmed && clearConfirm(null);
  }, [confirmed]);

  useEffect(() => {
    if (prevSubmittingMutationRef.current && !submittingMutation) {
      journalize(mutation);
      if (mutation?.actionType === ACTION_TYPE.DELETE_PAYROLL) {
        back();
      }
    }
  }, [submittingMutation]);

  useEffect(() => {
    prevSubmittingMutationRef.current = submittingMutation;
  });

  useEffect(() => setEditedPayroll(payroll), [payroll]);

  useEffect(() => () => clearPayroll(), []);

  const mandatoryFieldsEmpty = () => {
    if (
      editedPayroll?.name
      && editedPayroll?.benefitPlan
      && editedPayroll?.dateValidFrom
      && editedPayroll?.dateValidTo
      && !editedPayroll?.isDeleted) return false;
    return true;
  };

  const canSave = () => !mandatoryFieldsEmpty() && !readOnly;

  const handleSave = () => {
    createPayroll(
      editedPayroll,
      formatMessageWithValues('payroll.mutation.createLabel', mutationLabel(editedPayroll)),
    );
  };

  const deletePayrollCallback = () => deletePayrolls(
    payroll,
    formatMessageWithValues('payroll.mutation.deleteLabel', mutationLabel(payroll)),
  );

  const openDeletePayrollConfirmDialog = () => {
    setConfirmedAction(() => deletePayrollCallback);
    coreConfirm(
      formatMessageWithValues('payroll.delete.confirm.title', pageTitle(payroll)),
      formatMessage('payroll.delete.confirm.message'),
    );
  };

  const actions = [
    !!payroll && readOnly && {
      doIt: openDeletePayrollConfirmDialog,
      icon: <DeleteIcon />,
      tooltip: formatMessage('tooltip.delete'),
    },
  ];

  return (
    rights.includes(RIGHT_PAYROLL_CREATE) && (
    <div className={classes.page}>
      <Form
        module="payroll"
        title={formatMessageWithValues('payrollPage.title', pageTitle(payroll))}
        titleParams={pageTitle(payroll)}
        openDirty
        benefitPlan={editedPayroll}
        edited={editedPayroll}
        onEditedChanged={setEditedPayroll}
        back={back}
        mandatoryFieldsEmpty={mandatoryFieldsEmpty}
        canSave={canSave}
        save={handleSave}
        HeadPanel={PayrollHeadPanel}
        Panels={[PayrollTab]}
        rights={rights}
        actions={actions}
        setConfirmedAction={setConfirmedAction}
        saveTooltip={formatMessage('tooltip.save')}
      />
    </div>
    )
  );
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchPayroll,
  createPayroll,
  clearPayroll,
  deletePayrolls,
  coreConfirm,
  clearConfirm,
  journalize,
}, dispatch);

const mapStateToProps = (state, props) => ({
  payrollUuid: props.match.params.payroll_uuid,
  rights: state.core?.user?.i_user?.rights ?? [],
  confirmed: state.core.confirmed,
  submittingMutation: state.payroll.submittingMutation,
  mutation: state.payroll.mutation,
  payroll: state.payroll.payroll,
});

export default connect(mapStateToProps, mapDispatchToProps)(PayrollPage);
