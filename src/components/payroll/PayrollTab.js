import React, { useState } from 'react';
import { Paper, Grid } from '@material-ui/core';
import { Contributions } from '@openimis/fe-core';
import { makeStyles } from '@material-ui/styles';
import {
  BENEFIT_CONSUMPTION_LIST_TAB_VALUE,
  PAYROLL_TABS_LABEL_CONTRIBUTION_KEY,
  PAYROLL_TABS_PANEL_CONTRIBUTION_KEY,
} from '../../constants';

const useStyles = makeStyles((theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  tabs: {
    display: 'flex',
    alignItems: 'center',
  },
  selectedTab: {
    borderBottom: '4px solid white',
  },
  unselectedTab: {
    borderBottom: '4px solid transparent',
  },
  button: {
    marginLeft: 'auto',
    padding: theme.spacing(1),
    fontSize: '0.875rem',
    textTransform: 'none',
  },
}));

function PayrollTab({
  rights, setConfirmedAction, payrollUuid, isInTask,
}) {
  const classes = useStyles();

  const [activeTab, setActiveTab] = useState(BENEFIT_CONSUMPTION_LIST_TAB_VALUE);

  const isSelected = (tab) => tab === activeTab;

  const tabStyle = (tab) => (isSelected(tab) ? classes.selectedTab : classes.unselectedTab);

  const handleChange = (_, tab) => setActiveTab(tab);

  return (
    <Paper className={classes.paper}>
      <Grid container className={`${classes.tableTitle} ${classes.tabs}`}>
        <Contributions
          contributionKey={PAYROLL_TABS_LABEL_CONTRIBUTION_KEY}
          rights={rights}
          value={activeTab}
          onChange={handleChange}
          isSelected={isSelected}
          tabStyle={tabStyle}
          payrollUuid={payrollUuid}
          isInTask={isInTask}
        />
      </Grid>
      <Contributions
        contributionKey={PAYROLL_TABS_PANEL_CONTRIBUTION_KEY}
        rights={rights}
        value={activeTab}
        setConfirmedAction={setConfirmedAction}
        payrollUuid={payrollUuid}
        isInTask={isInTask}
      />
    </Paper>
  );
}

export default PayrollTab;
