import React, { useState } from "react";

import { TextField } from "@material-ui/core";

import { useGraphqlQuery, useTranslations, Autocomplete, useModulesManager } from "@openimis/fe-core";
import { PAYMENT_POINT_PROJECTION } from "../../actions";

function PaymentPointPicker({
  readOnly,
  value,
  onChange,
  required,
  withLabel,
  withPlaceholder,
  filterOptions,
  filterSelectedOptions,
}) {
  const [searchString, setSearchString] = useState();
  const { formatMessage } = useTranslations("payroll");

  const modulesManager = useModulesManager();

  const formatSuggestion = (paymentPoint) =>
    [paymentPoint?.name].filter(Boolean).join(" ");

  const { isLoading, data, error } = useGraphqlQuery(
    `
    query paymentPoint {
        paymentPoint {
          edges {
            node {
              ${PAYMENT_POINT_PROJECTION(modulesManager).join(" ")}
            }
          }
        }
      }
    `,
    {}
  );

  const paymentPoints = data?.paymentPoint?.edges.map((edge) => edge.node) ?? [];

  return (
    <Autocomplete
      withLabel={withLabel}
      withPlaceholder={withPlaceholder}
      readOnly={readOnly}
      value={value}
      placeholder={formatMessage("paymentPointPicker.placeholder")}
      label={formatMessage("paymentPointPicker.label")}
      isLoading={isLoading}
      options={paymentPoints}
      error={error}
      getOptionLabel={(option) => formatSuggestion(option)}
      onChange={(user) => onChange(user)}
      filterOptions={filterOptions}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={() => setSearchString(searchString)}
      renderInput={(inputProps) => (
        <TextField
          {...inputProps}
          variant="standard"
          required={required}
          label={withLabel && formatMessage("paymentPointPicker.label")}
          placeholder={withPlaceholder && formatMessage("paymentPointPicker.placeholder")}
        />
      )}
    />
  );
}

export default PaymentPointPicker;