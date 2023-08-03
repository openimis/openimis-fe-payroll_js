import React, { useEffect, useState } from "react";
import { injectIntl } from "react-intl";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import {
  decodeId,
  formatMessage,
  fetchCustomFilter,
} from "@openimis/fe-core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import AdvancedFiltersRowValue from "./AdvancedFiltersRowValue";
import AddCircle from '@material-ui/icons/Add';
import { BENEFIT_PLAN, CLEARED_STATE_FILTER } from "../../constants";
import { isBase64Encoded, isEmptyObject } from "../../utils/advanced-filters-utils";

const styles = (theme) => ({
  item: theme.paper.item,
});

const AdvancedFiltersDialog = ({
  intl,
  classes,
  object,
  objectToSave,
  fetchCustomFilter,
  customFilters,
  moduleName,
  objectType,
  setAppliedCustomFilters,
  appliedFiltersRowStructure,
  setAppliedFiltersRowStructure,
  updateAttributes,
  getDefaultAppliedCustomFilters,
  readOnly,
}) => {

  const [isOpen, setIsOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState({ field: "", filter: "", type: "", value: "", amount: "" })
  const [filters, setFilters] = useState(getDefaultAppliedCustomFilters());

  const createParams = (moduleName, objectTypeName, uuidOfObject=null) => {
    return [
      `moduleName: "${moduleName}"`,
      `objectTypeName: "${objectTypeName}"`,
      uuidOfObject !== null ? `uuidOfObject: "${uuidOfObject}"`: ``,
    ];
  };

  const fetchFilters = (params) => fetchCustomFilter(params);
  
  const handleOpen = () => {
    setFilters(getDefaultAppliedCustomFilters());
    setIsOpen(true);
  };

  const handleClose = () => {
    setCurrentFilter(CLEARED_STATE_FILTER);
    setIsOpen(false);
  };

  const handleRemoveFilter = () => {
    setCurrentFilter(CLEARED_STATE_FILTER);
    setAppliedFiltersRowStructure([CLEARED_STATE_FILTER]);
    setFilters([CLEARED_STATE_FILTER]);
  };

  const handleAddFilter = () => {
    setCurrentFilter(CLEARED_STATE_FILTER);
    setFilters([...filters, CLEARED_STATE_FILTER]);
  };

  function updateJsonExt(inputJsonExt, outputFilters) {
    const existingData = JSON.parse(inputJsonExt || '{}');
    if (!existingData.hasOwnProperty("advanced_criteria")) {
      existingData.advanced_criteria = [];
    }
    const filterData = JSON.parse(outputFilters);
    existingData.advanced_criteria = filterData;
    const updatedJsonExt = JSON.stringify(existingData);
    return updatedJsonExt;
  }

  const saveCriteria = () => {
    setAppliedFiltersRowStructure(filters);
    const outputFilters = JSON.stringify(
      filters.map(({ filter, value, field, type, amount }) => {
        return {
          custom_filter_condition: `${field}__${filter}__${type}=${value}`
        };
      })
    );
    const jsonExt = updateJsonExt(objectToSave.jsonExt, outputFilters)
    updateAttributes(jsonExt);
    setAppliedCustomFilters(outputFilters);
    handleClose();
  };

  useEffect(() => {
    if (object && isEmptyObject(object) === false) {
      let paramsToFetchFilters = [];
      if (objectType === BENEFIT_PLAN) {
        paramsToFetchFilters = createParams(
          moduleName,
          objectType,
          isBase64Encoded(object.id) ? decodeId(object.id) : object.id
        );
      } else {
        paramsToFetchFilters = createParams(
          moduleName,
          objectType,
        );
      }
      fetchFilters(paramsToFetchFilters);
    }
  }, [object]);
 
  useEffect(() => {}, [filters]);

  return (
    <>
      <Button 
        onClick={handleOpen} 
        variant="outlined" 
        color="#DFEDEF" 
        className={classes.button}
        style={{ 
          border: "0px",
          textAlign: "right",
          display: "block",
          marginLeft: "auto",
          marginRight: 0
        }}
      >
        {formatMessage(intl, "payroll", "payroll.advancedFilters")}
      </Button>
      <Dialog 
        open={isOpen} 
        onClose={handleClose} 
        PaperProps={{
          style: {
            width: 900,
            maxWidth: 900,
          },
        }}
      >
        <DialogTitle 
          style={{ 
            marginTop: "10px",
          }}
        >
          {formatMessage(intl, "payroll", "payroll.advancedFilters.button.advancedFilters")}
        </DialogTitle>
        <DialogContent>
          {filters.map((filter, index) => {
            return (<AdvancedFiltersRowValue 
              customFilters={customFilters}
              currentFilter={filter}
              setCurrentFilter={setCurrentFilter}
              index={index}
              filters={filters}
              setFilters={setFilters}
              readOnly={readOnly}
            />)
          })}
          { !readOnly ? ( 
            <div 
              style={{ backgroundColor: "#DFEDEF", paddingLeft: "10px", paddingBottom: "10px" }}
            >
              <AddCircle 
                style={{ 
                  border: "thin solid", 
                  borderRadius: "40px", 
                  width: "16px", 
                  height: "16px" 
                }} 
                onClick={handleAddFilter}
              />
              <Button 
                onClick={handleAddFilter} 
                variant="outlined"
                style={{ 
                  border: "0px", 
                  marginBottom: "6px", 
                  fontSize: "0.8rem" 
                }}
              >
                {formatMessage(intl, "payroll", "payroll.advancedFilters.button.addFilters")}
              </Button>
            </div>
          ) : (<></>) }
        </DialogContent>
        <DialogActions 
          style={{ 
            display: "inline", 
            paddingLeft: "10px",
            marginTop: "25px",
            marginBottom: "15px"  
          }}
        >
          <div>
          { !readOnly ? ( 
            <>
            <div style={{ float: "left" }}>
              <Button 
                onClick={handleRemoveFilter} 
                variant="outlined"
                style={{ 
                  border: "0px"
                }}
              >
                {formatMessage(intl, "payroll", "payroll.advancedFilters.button.clearAllFilters")}
              </Button>
            </div>
            <div style={{ 
                float: "right", 
                paddingRight: "16px" 
              }}
            >
              <Button 
                onClick={handleClose} 
                variant="outlined" 
                autoFocus
                style={{ margin: "0 16px" }} 
              >
                {formatMessage(intl, "payroll", "payroll.advancedFilters.button.cancel")}
              </Button>
              <Button 
                onClick={saveCriteria} 
                variant="contained" 
                color="primary" 
                autoFocus
              >
                {formatMessage(intl, "payroll", "payroll.advancedFilters.button.filter")}
              </Button>
            </div>
            </>
            ) : (
              <div style={{ 
                float: "right", 
                paddingRight: "16px" 
                }}
              >
                <Button 
                  onClick={handleClose} 
                  variant="outlined" 
                  autoFocus
                  style={{ margin: "0 16px" }} 
                >
                  {formatMessage(intl, "payroll", "payroll.advancedFilters.button.cancel")}
                </Button>
              </div>
            ) }
          </div>
        </DialogActions>
      </Dialog>
    </>
  );
};

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  confirmed: state.core.confirmed,
  fetchingCustomFilters: state.core.fetchingCustomFilters,
  errorCustomFilters: state.core.errorCustomFilters,
  fetchedCustomFilters: state.core.fetchedCustomFilters,
  customFilters: state.core.customFilters,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchCustomFilter,
}, dispatch);

export default injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(AdvancedFiltersDialog))));
