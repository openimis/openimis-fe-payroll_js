import { useIntl } from 'react-intl';

import { useModulesManager, useTranslations } from '@openimis/fe-core';
import { MODULE_NAME } from '../../constants';

// Statuses are an open set; the raw value is shown when no translation key matches.
function PayrollStatusLabel({ status }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const intl = useIntl();
  if (!status) return '';
  const key = `payroll.payrollStatusPicker.${status}`;
  return intl.messages[`${MODULE_NAME}.${key}`] ? formatMessage(key) : status;
}

export default PayrollStatusLabel;
