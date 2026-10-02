import React, { useState, useRef, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { makeStyles } from '@material-ui/styles';
import { Typography } from '@material-ui/core';
import ReplayIcon from '@material-ui/icons/Replay';
import WarningIcon from '@material-ui/icons/Warning';

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
  retriggerPayroll,
  fetchPayrollSystemStatus,
} from '../../actions';
import {
  MODULE_NAME, PAYROLL_FROM_FAILED_INVOICES_URL_PARAM,
  RIGHT_PAYROLL_CREATE, PAYROLL_STATUS,
} from '../../constants';
import { ACTION_TYPE } from '../../reducer';
import { mutationLabel, pageTitle } from '../../utils/string-utils';
import PayrollHeadPanel from '../../components/payroll/PayrollHeadPanel';
import PayrollTab from '../../components/payroll/PayrollTab';

const useStyles = makeStyles((theme) => ({
  page: theme.page,
}));

function PayrollPage({
  statePayrollUuid,
  taskPayrollUuid,
  rights,
  confirmed,
  submittingMutation,
  mutation,
  payroll,
  systemStatus,
  fetchPayroll,
  createPayroll,
  retriggerPayroll,
  fetchPayrollSystemStatus,
  clearPayroll,
  clearConfirm,
  createPayrollFromFailedInvoices,
  journalize,
  benefitPlanId,
}) {
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const history = useHistory();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);

  const [editedPayroll, setEditedPayroll] = useState({});
  const [payrollUuid, setPayrollUuid] = useState(null);
  const [isInTask, setIsInTask] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [isPayrollFromFailedInvoices, setIsPayrollFromFailedInvoices] = useState(false);
  const [confirmedAction, setConfirmedAction] = useState(() => null);
  const [isRetriggering, setIsRetriggering] = useState(false);
  const prevSubmittingMutationRef = useRef();

  const back = () => history.goBack();
  const triggersDown = systemStatus && !systemStatus.triggersSynced;

  useEffect(() => {
    fetchPayrollSystemStatus();
  }, []);

  useEffect(() => {
    if (createPayrollFromFailedInvoices === PAYROLL_FROM_FAILED_INVOICES_URL_PARAM) {
      setIsPayrollFromFailedInvoices(true);
    }
  }, [createPayrollFromFailedInvoices, payrollUuid]);

  useEffect(() => {
    setPayrollUuid(statePayrollUuid ?? taskPayrollUuid);
    setIsInTask(!!taskPayrollUuid);
  }, [taskPayrollUuid, statePayrollUuid]);

  useEffect(() => {
    if (payrollUuid) {
      fetchPayroll(modulesManager, [`id: "${payrollUuid}"`]);
    }
  }, [payrollUuid]);

  useEffect(() => {
    if (confirmed && typeof confirmed === 'function') confirmedAction();
    return () => confirmed && clearConfirm(null);
  }, [confirmed]);

  useEffect(() => {
    if (prevSubmittingMutationRef.current && !submittingMutation) {
      journalize(mutation);
      if (mutation?.actionType === ACTION_TYPE.RETRIGGER_PAYROLL) {
        setIsRetriggering(false);
        if (payrollUuid) {
          fetchPayroll(modulesManager, [`id: "${payrollUuid}"`]);
        }
      }
      if (mutation?.actionType === ACTION_TYPE.DELETE_PAYROLL) {
        back();
      }
      if (mutation?.clientMutationId && (!payrollUuid || isPayrollFromFailedInvoices)) {
        fetchPayroll(modulesManager, [`clientMutationId: "${mutation.clientMutationId}"`]);
        setIsPayrollFromFailedInvoices(false);
      }
    }
  }, [submittingMutation]);

  useEffect(() => {
    prevSubmittingMutationRef.current = submittingMutation;
  });

  useEffect(() => {
    if (payroll) {
      setReadOnly(payroll?.id);
      if (isPayrollFromFailedInvoices) {
        setEditedPayroll({
          ...payroll, id: null, name: null, paymentCycle: null, status: null, fromFailedInvoicesPayrollId: payroll?.id,
        });
      } else {
        setEditedPayroll(payroll);
      }
      if (!payrollUuid && payroll?.id && !isPayrollFromFailedInvoices) {
        const payrollRouteRef = modulesManager.getRef('payroll.route.payroll');
        history.replace(`/${payrollRouteRef}/${payroll.id}`);
      }
    }
  }, [payroll]);

  useEffect(() => () => clearPayroll(), []);

  const mandatoryFieldsEmpty = () => {
    if (
      editedPayroll?.name
      && editedPayroll?.paymentPlan
      && editedPayroll?.paymentCycle
      && editedPayroll?.dateValidFrom
      && editedPayroll?.dateValidTo
      && editedPayroll?.paymentMethod
      && !editedPayroll?.isDeleted) return false;
    return true;
  };

  const canSave = () => !mandatoryFieldsEmpty() && (!readOnly || isPayrollFromFailedInvoices);

  const handleSave = () => {
    createPayroll(
      editedPayroll,
      formatMessageWithValues('payroll.mutation.create', mutationLabel(payroll)),
    );
    if (benefitPlanId) {
      back();
    }
  };

  const actions = [
    payroll?.status === PAYROLL_STATUS.FAILED && {
      icon: <ReplayIcon />,
      tooltip: formatMessage('tooltip.retrigger'),
      disabled: isRetriggering || triggersDown,
      doIt: () => {
        setIsRetriggering(true);
        retriggerPayroll(
          payroll,
          formatMessageWithValues('payroll.mutation.retriggerLabel', mutationLabel(payroll)),
        );
      },
    },
  ].filter(Boolean);

  return (
    rights.includes(RIGHT_PAYROLL_CREATE) && (
      <div className={classes.page}>
        {triggersDown && (
          <div
            style={{
              background: '#fff3e0',
              border: '1px solid #ff9800',
              borderRadius: 4,
              padding: '12px 16px',
              margin: '0 0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <WarningIcon style={{ color: '#ff9800' }} />
            <Typography variant="body2">{systemStatus.message}</Typography>
          </div>
        )}
        <Form
          key={payrollUuid}
          module="payroll"
          title={formatMessageWithValues('payrollPage.title', pageTitle(payroll))}
          titleParams={pageTitle(payroll)}
          openDirty={isPayrollFromFailedInvoices ? true : !payrollUuid}
          benefitPlan={editedPayroll}
          edited={editedPayroll}
          onEditedChanged={setEditedPayroll}
          back={!isInTask && back}
          mandatoryFieldsEmpty={mandatoryFieldsEmpty}
          canSave={() => canSave() && !triggersDown}
          save={handleSave}
          HeadPanel={PayrollHeadPanel}
          Panels={[PayrollTab]}
          rights={rights}
          actions={actions}
          setConfirmedAction={setConfirmedAction}
          payrollUuid={payrollUuid}
          saveTooltip={formatMessage('tooltip.save')}
          isInTask={!!taskPayrollUuid}
          payroll={payroll}
          readOnly={readOnly}
          isPayrollFromFailedInvoices={isPayrollFromFailedInvoices}
          benefitPlanId={benefitPlanId}
        />
      </div>
    )
  );
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchPayroll,
  createPayroll,
  retriggerPayroll,
  fetchPayrollSystemStatus,
  clearPayroll,
  coreConfirm,
  clearConfirm,
  journalize,
}, dispatch);

const mapStateToProps = (state, props) => ({
  statePayrollUuid: props?.match?.params?.payroll_uuid === 'null' ? null : props?.match?.params.payroll_uuid,
  createPayrollFromFailedInvoices: props?.match?.params?.createPayrollFromFailedInvoices,
  benefitPlanId: props?.match?.params?.benefitPlanId,
  rights: state.core?.user?.i_user?.rights ?? [],
  confirmed: state.core.confirmed,
  submittingMutation: state.payroll.submittingMutation,
  mutation: state.payroll.mutation,
  payroll: state.payroll.payroll,
  systemStatus: state.payroll.systemStatus,
});

export default connect(mapStateToProps, mapDispatchToProps)(PayrollPage);
