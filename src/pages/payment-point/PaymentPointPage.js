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
  MODULE_NAME,
  RIGHT_PAYMENT_POINT_UPDATE,
} from '../../constants';
import { ACTION_TYPE } from '../../reducer';
import PaymentPointHeadPanel from './PaymentPointHeadPanel';

const useStyles = makeStyles((theme) => ({
  page: theme.page,
}));

function PaymentPointPage({
  paymentPointUuid,
  rights,
  confirmed,
  submittingMutation,
  mutation,
  paymentPoint,
}) {
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const history = useHistory();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);

  const [editedPaymentPoint, setEditedPaymentPoint] = useState({});
  const [confirmedAction, setConfirmedAction] = useState(() => null);
  const prevSubmittingMutationRef = useRef();

  const back = () => history.goBack();

  useEffect(() => {
    if (paymentPointUuid) {
      // TODO: To be changed after BE implementation
      // fetchPaymentPoint(modulesManager, [`id: "${paymentPointUuid}"`]);
    }
  }, [paymentPointUuid]);

  useEffect(() => {
    if (confirmed) confirmedAction();
    return () => confirmed && clearConfirm(null);
  }, [confirmed]);

  useEffect(() => {
    if (prevSubmittingMutationRef.current && !submittingMutation) {
      journalize(mutation);
      if (mutation?.actionType === ACTION_TYPE.DELETE_PAYMENT_POINT) {
        back();
      }
    }
  }, [submittingMutation]);

  useEffect(() => {
    prevSubmittingMutationRef.current = submittingMutation;
  });

  useEffect(() => setEditedPaymentPoint(paymentPoint), [paymentPoint]);

  // TODO: To be finished after BE
  // useEffect(() => () => clearBenefitPlan(), []);

  const titleParams = (paymentPoint) => ({
    name: paymentPoint?.name,
  });

  const mandatoryFieldsEmpty = () => {
    if (editedPaymentPoint?.name) return false;
    return true;
  };

  const canSave = !mandatoryFieldsEmpty();

  // TODO: Implement when mutation will be ready
  const handleSave = () => {};

  // TODO: Implement when mutation will be ready
  const deletePaymentPointCallback = () => {};

  const openDeletePaymentPointConfirmDialog = () => {
    setConfirmedAction(() => deletePaymentPointCallback);
    coreConfirm(
      formatMessageWithValues('paymentPoint.delete.confirm.title', titleParams(paymentPoint)),
      formatMessage('paymentPoint.delete.confirm.message'),
    );
  };

  const actions = [
    !!paymentPoint && {
      doIt: openDeletePaymentPointConfirmDialog,
      icon: <DeleteIcon />,
      tooltip: formatMessage('tooltip.delete'),
    },
  ];

  return (
    rights.includes(RIGHT_PAYMENT_POINT_UPDATE) && (
    <div className={classes.page}>
      <Form
        module="payroll"
        title={formatMessageWithValues('PaymentPointPage.title', titleParams(paymentPoint))}
        titleParams={titleParams(paymentPoint)}
        openDirty
        benefitPlan={editedPaymentPoint}
        edited={editedPaymentPoint}
        onEditedChanged={setEditedPaymentPoint}
        back={back}
        mandatoryFieldsEmpty={mandatoryFieldsEmpty}
        canSave={canSave}
        save={handleSave}
        HeadPanel={PaymentPointHeadPanel}
        rights={rights}
        actions={actions}
        setConfirmedAction={setConfirmedAction}
        // readOnly={!!benefitPlanUuid}
        saveTooltip={formatMessage('tooltip.save')}
      />
    </div>
    )
  );
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  coreConfirm,
  clearConfirm,
  journalize,
}, dispatch);

const mapStateToProps = (state, props) => ({
  paymentPointUuid: props.match.params.payment_point_uuid,
  rights: state.core?.user?.i_user?.rights ?? [],
  confirmed: state.core.confirmed,
  submittingMutation: state.payroll.submittingMutation,
  mutation: state.payroll.mutation,
  fetchingPaymentPoint: state.payroll.fetchingPaymentPoint,
  fetchedPaymentPoint: state.payroll.fetchedPaymentPoint,
  paymentPoint: state.payroll.paymentPoint,
  errorPaymentPoint: state.payroll.errorPaymentPoint,
});

export default connect(mapStateToProps, mapDispatchToProps)(PaymentPointPage);
