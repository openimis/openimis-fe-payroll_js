import React, { useEffect, useRef, useState } from 'react';
import { injectIntl } from 'react-intl';
import Button from '@mui/material/Button';
import { Grid, Divider, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  decodeId,
  formatMessage,
  fetchCustomFilter,
  PublishedComponent,
  GetIconComponent,
} from '@openimis/fe-core';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';
import AdvancedFiltersRowValue from './AdvancedFiltersRowValue';
import { BENEFIT_PLAN } from '../../constants';
import { isBase64Encoded } from '../../utils/advanced-filters-utils';
import { parseJsonExt } from '../../utils/jsonExt';

const hasFilterValue = (value) => value !== null && value !== undefined && value !== '';

// field__filter__type=value, or field__type=value when no operator was stored.
const parseCustomFilterCondition = (condition) => {
  if (typeof condition !== 'string') return null;
  const separator = condition.indexOf('=');
  if (separator <= 0) return null;
  const left = condition.slice(0, separator);
  const value = condition.slice(separator + 1);
  const parts = left.split('__');
  if (parts.length >= 3) {
    const type = parts.pop();
    const filter = parts.pop();
    const field = parts.join('__');
    if (!field || !type) return null;
    return {
      customFilterCondition: condition, field, filter, type, value,
    };
  }
  if (parts.length === 2) {
    const [field, type] = parts;
    if (!field || !type) return null;
    return {
      customFilterCondition: condition, field, filter: '', type, value,
    };
  }
  return null;
};

const customFilterConditionForRow = (row) => {
  if (!row?.field || !hasFilterValue(row.value)) return null;
  if (row.filter) {
    return `${row.field}__${row.filter}__${row.type}=${row.value}`;
  }
  // Keep a condition that was stored without an operator (field__type=value).
  if (row.customFilterCondition && row.type) {
    return `${row.field}__${row.type}=${row.value}`;
  }
  return null;
};

const AddCircle = GetIconComponent('Add');

const StyledFilterDialog = styled('div')(({ theme }) => ({
  '& .item': theme.paper?.item ?? {},
  '& .section': {
    paddingLeft: '10px',
  },
}));

function FilterDialog({
  intl,
  object,
  objectToSave,
  fetchCustomFilter,
  customFilters,
  moduleName,
  objectType,
  updateAttribute,
  readOnly,
  additionalParams,
  benefitPlanId,
}) {
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [advancedFilters, setAdvancedFilters] = useState([]);
  // The jsonExt string this dialog last wrote. Reloading it would replace the
  // rows on screen, including a criterion the user has started but not finished.
  const writtenJsonExt = useRef(null);

  useEffect(() => {
    const jsonExt = objectToSave?.jsonExt;
    if (!jsonExt || jsonExt === writtenJsonExt.current) {
      return;
    }
    const jsonData = parseJsonExt(jsonExt);
    if (!jsonData || typeof jsonData !== 'object' || Array.isArray(jsonData)) {
      return;
    }

    const filterCriteria = jsonData.filter_criteria || {};
    const projectIds = Array.isArray(filterCriteria.project_ids) ? filterCriteria.project_ids : [];
    setSelectedProjects(projectIds.map((id) => ({ id })));

    const locationIds = Array.isArray(filterCriteria.location_ids) ? filterCriteria.location_ids : [];
    setSelectedLocations(locationIds.map((uuid) => ({ uuid })));

    const advancedCriteria = Array.isArray(jsonData.advanced_criteria)
      ? jsonData.advanced_criteria
      : [];
    setAdvancedFilters(
      advancedCriteria
        .map((criterion) => parseCustomFilterCondition(criterion?.custom_filter_condition))
        .filter(Boolean),
    );
  }, [objectToSave?.jsonExt]);

  const updateJsonExt = (projects, locations, filters) => {
    const parsed = objectToSave?.jsonExt ? parseJsonExt(objectToSave.jsonExt) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return;
    }
    const jsonData = { ...parsed };

    const filterCriteria = {};
    if (projects && projects.length > 0) {
      filterCriteria.project_ids = projects.map((p) => p.id);
    }
    if (locations && locations.length > 0) {
      filterCriteria.location_ids = locations.map((l) => l.uuid);
    }

    if (Object.keys(filterCriteria).length > 0) {
      jsonData.filter_criteria = filterCriteria;
    } else {
      delete jsonData.filter_criteria;
    }

    const conditions = (filters || []).map(customFilterConditionForRow).filter(Boolean);
    if (conditions.length > 0) {
      jsonData.advanced_criteria = conditions.map((customFilterCondition) => ({
        custom_filter_condition: customFilterCondition,
      }));
    } else {
      delete jsonData.advanced_criteria;
    }

    const nextJsonExt = JSON.stringify(jsonData);
    writtenJsonExt.current = nextJsonExt;
    updateAttribute('jsonExt', nextJsonExt);
  };

  // Write jsonExt only on user changes: an effect on this state would race the
  // load from jsonExt above and keep the form re-rendering.
  const handleProjectsChange = (projects) => {
    setSelectedProjects(projects || []);
    updateJsonExt(projects || [], selectedLocations, advancedFilters);
  };

  const handleLocationsChange = (locations) => {
    setSelectedLocations(locations || []);
    updateJsonExt(selectedProjects, locations || [], advancedFilters);
  };

  const handleAdvancedFiltersChange = (filtersOrUpdater) => {
    const filters = typeof filtersOrUpdater === 'function'
      ? filtersOrUpdater(advancedFilters)
      : filtersOrUpdater;
    setAdvancedFilters(filters);
    updateJsonExt(selectedProjects, selectedLocations, filters);
  };

  const handleAddFilter = () => {
    const newFilters = [
      ...advancedFilters,
      {
        field: '', filter: '', type: '', value: '',
      },
    ];
    handleAdvancedFiltersChange(newFilters);
  };

  const handleRemoveAllFilters = () => {
    setSelectedProjects([]);
    setSelectedLocations([]);
    setAdvancedFilters([]);
    updateJsonExt([], [], []);
  };

  const createParams = (moduleName, objectTypeName, uuidOfObject = null, additionalParams = null) => {
    const params = [
      `moduleName: "${moduleName}"`,
      `objectTypeName: "${objectTypeName}"`,
    ];
    if (uuidOfObject) {
      params.push(`uuidOfObject: "${uuidOfObject}"`);
    }
    if (additionalParams) {
      params.push(`additionalParams: ${JSON.stringify(JSON.stringify(additionalParams))}`);
    }
    return params;
  };

  useEffect(() => {
    if (object && _.isEmpty(object) === false) {
      let paramsToFetchFilters = [];
      if (objectType === BENEFIT_PLAN) {
        paramsToFetchFilters = createParams(
          moduleName,
          objectType,
          isBase64Encoded(object.id) ? decodeId(object.id) : object.id,
          additionalParams,
        );
      } else {
        paramsToFetchFilters = createParams(
          moduleName,
          objectType,
          additionalParams,
        );
      }
      fetchCustomFilter(paramsToFetchFilters);
    }
  }, [object?.id]);

  return (
    <StyledFilterDialog>
      <div className="section">
        <div className="item">
          <Typography variant="subtitle2">
            {formatMessage(intl, 'payroll', 'payroll.filterCriteria')}
          </Typography>
          { readOnly
            ? formatMessage(intl, 'payroll', 'payroll.filterCriteria.readonly')
            : formatMessage(intl, 'payroll', 'payroll.filterCriteria.tip') }
        </div>
      </div>
      <Grid container className="item" style={{ paddingTop: 0 }}>
        <Grid size={6} className="item">
          <PublishedComponent
            pubRef="socialProtection.ProjectPicker"
            benefitPlanId={benefitPlanId}
            status="COMPLETED"
            value={selectedProjects}
            onChange={handleProjectsChange}
            readOnly={readOnly}
            multiple
            withLabel
            withPlaceholder
          />
        </Grid>
        <Grid size={6} className="item">
          <PublishedComponent
            pubRef="location.LocationCascader"
            value={selectedLocations}
            onChange={handleLocationsChange}
            readOnly={readOnly}
            multiple
            label={formatMessage(intl, 'payroll', 'filterCriteria.locations')}
          />
        </Grid>
      </Grid>

      <Divider />

      <div className="section">
        <div className="item">
          <Typography variant="subtitle2">
            {formatMessage(intl, 'contributionPlan', 'paymentPlan.advancedCriteria')}
          </Typography>
          {!readOnly && (
            formatMessage(intl, 'payroll', 'payroll.advancedCriteria.tip')
          )}
          {readOnly && advancedFilters.length === 0 && (
            formatMessage(intl, 'payroll', 'payroll.advancedCriteria.none')
          )}
        </div>
      </div>
      {advancedFilters.map((filter, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div className="item" key={index}>
          <AdvancedFiltersRowValue
            customFilters={customFilters}
            currentFilter={filter}
            setCurrentFilter={() => {}}
            index={index}
            filters={advancedFilters}
            setFilters={handleAdvancedFiltersChange}
            readOnly={readOnly}
          />
        </div>
      ))}
      {!readOnly && (
        <div className="item" style={{ backgroundColor: '#DFEDEF', margin: '10px' }}>
          <AddCircle
            style={{
              border: 'thin solid',
              borderRadius: '40px',
              width: '16px',
              height: '16px',
              cursor: 'pointer',
            }}
            onClick={handleAddFilter}
          />
          <Button
            onClick={handleAddFilter}
            variant="outlined"
            style={{
              border: '0px',
              marginBottom: '6px',
              fontSize: '0.8rem',
            }}
          >
            {formatMessage(intl, 'payroll', 'payroll.advancedFilters.button.addFilters')}
          </Button>
          <Button
            onClick={handleRemoveAllFilters}
            variant="outlined"
            style={{
              border: '0px',
              marginBottom: '6px',
              fontSize: '0.8rem',
            }}
          >
            {formatMessage(intl, 'payroll', 'payroll.advancedFilters.button.clearAllFilters')}
          </Button>
        </div>
      )}
    </StyledFilterDialog>
  );
}

const mapStateToProps = (state) => ({
  fetchingCustomFilters: state.core.fetchingCustomFilters,
  errorCustomFilters: state.core.errorCustomFilters,
  fetchedCustomFilters: state.core.fetchedCustomFilters,
  customFilters: state.core.customFilters,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchCustomFilter,
}, dispatch);

export { StyledFilterDialog };
export default injectIntl(
  connect(mapStateToProps, mapDispatchToProps)(FilterDialog),
);
