import React, { Component } from "react";
import { FormattedMessage, withModulesManager, SelectInput } from "@openimis/fe-core";
import { fetchPaymentPoints } from "../../actions";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

class PaymentPointPicker extends Component {
    componentDidMount() {
        this.props.fetchPaymentPoints(this.props.modulesManager, this.queryParams());
    }

    queryParams = () => {
        const { withDeleted = false } = this.props;
        let params = [];
        params.push(`isDeleted: ${withDeleted}`);
        return params;
    }

    render() {
        const { modulesManager, paymentPoints, value, onChange, required = false,
            withNull = false, nullLabel = null, withLabel = true, readOnly = false } = this.props;
        let options = [
            ...paymentPoints.map(v => ({
                value: v,
                label: `${v.code} - ${v.name}`
            }))
        ];
        if (withNull) {
            options.unshift({
                value: null,
                label: nullLabel || <FormattedMessage module="payroll" id="emptyLabel" />
            })
        }
        let paymentPointPickerValue = null;
        const paymentPointPickerProjection = modulesManager.getRef("payroll.PaymentPointPicker.projection");
        if (!!value && !!paymentPointPickerProjection) {
            paymentPointPickerValue = {};
            paymentPointPickerProjection.forEach(key => {
                paymentPointPickerValue[key] = value[key]
            });
        }
        return (
            <SelectInput
                module="payroll"
                label={withLabel ? "paymentPoint.label" : null}
                required={required}
                options={options}
                value={paymentPointPickerValue}
                onChange={onChange}
                readOnly={readOnly}
            />
        )
    }
}

const mapStateToProps = state => ({
    paymentPoints: state.payroll.paymentPoints
});

const mapDispatchToProps = dispatch => {
    return bindActionCreators({ fetchPaymentPoints }, dispatch);
};

export default withModulesManager(connect(mapStateToProps, mapDispatchToProps)(PaymentPointPicker));