import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tab } from '@material-ui/core';
import { PublishedComponent, useTranslations, useModulesManager } from '@openimis/fe-core';
import {
  MODULE_NAME, PAYROLL_TASK_TAB_VALUE,
} from '../../constants';

function PayrollTaskTabLabel({
  onChange, tabStyle, isSelected, modulesManager, payrollUuid, isInTask,
}) {
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  if (!payrollUuid || isInTask) {
    return null;
  }
  return (
    <Tab
      onChange={onChange}
      className={tabStyle(PAYROLL_TASK_TAB_VALUE)}
      selected={isSelected(PAYROLL_TASK_TAB_VALUE)}
      value={PAYROLL_TASK_TAB_VALUE}
      label={formatMessage('PayrollTaskTab.label')}
    />
  );
}

function PayrollTaskTabPanel({ value, payrollUuid, isInTask }) {
  const modulesManager = useModulesManager();
  const dispatch = useDispatch();
  const fetchTask = modulesManager.getRef('tasksManagement.fetchTask');
  const task = useSelector((state) => state.tasksManagement?.task);
  useEffect(() => {
    dispatch(fetchTask(modulesManager, ['entityType: "Payroll"', `entityId: "${payrollUuid}"`]));
  }, [payrollUuid]);

  if (isInTask) return null;

  return (
    <PublishedComponent
      pubRef="policyHolder.TabPanel"
      module="payroll"
      index={PAYROLL_TASK_TAB_VALUE}
      value={value}
    >
      {
                payrollUuid && (
                  <PublishedComponent
                    pubRef="tasksManagement.taskDetailsPage"
                    module="payroll"
                    task={task}
                    hideBody
                  />
                )
            }
    </PublishedComponent>
  );
}

export { PayrollTaskTabLabel, PayrollTaskTabPanel };
