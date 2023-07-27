import React, { useState, useRef, useEffect } from 'react';

import { makeStyles } from '@material-ui/styles';

import {
  Form,
  useHistory,
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';
import {
  MODULE_NAME,
  RIGHT_PAYMENT_POINT_UPDATE,
} from '../constants';

const useStyles = makeStyles((theme) => ({
  page: theme.page,
}));

function PaymentPointPage() {
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const history = useHistory();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const [editedBenefitPlan, setEditedBenefitPlan] = useState({});
  const [confirmedAction, setConfirmedAction] = useState(() => null);
  const prevSubmittingMutationRef = useRef();

  return (
    rights.includes(RIGHT_PAYMENT_POINT_UPDATE) && (
    <div className={classes.page}>
      <Form
        module="payroll"
        title={formatMessageWithValues(intl, 'socialProtection', 'benefitPlan.pageTitle', titleParams(benefitPlan))}
        titleParams={titleParams(benefitPlan)}
        openDirty
        benefitPlan={editedBenefitPlan}
        edited={editedBenefitPlan}
        onEditedChanged={setEditedBenefitPlan}
        back={back}
        mandatoryFieldsEmpty={isMandatoryFieldsEmpty}
        canSave={canSave}
        save={handleSave}
        HeadPanel={BenefitPlanHeadPanel}
        Panels={rights.includes(RIGHT_BENEFICIARY_SEARCH) ? [BenefitPlanTabPanel] : []}
        rights={rights}
        actions={actions}
        setConfirmedAction={setConfirmedAction}
        readOnly={!!benefitPlanUuid}
        saveTooltip={formatMessage(
          intl,
          'socialProtection',
          `benefitPlan.saveButton.tooltip.${canSave() ? 'enabled' : 'disabled'}`,
        )}
      />
    </div>
    )
  );
}

export default PaymentPointPage;
