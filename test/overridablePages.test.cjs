const test = require("node:test");
const assert = require("node:assert/strict");
const { mock, src } = require("./harness.cjs");

// fe-core `overridable(key)` stand-in: tags the wrapper with its key.
mock("@openimis/fe-core", {
  overridable: (key) => (Component) => {
    const Wrapper = () => null;
    Wrapper.overridableKey = key;
    Wrapper.wrapped = Component;
    return Wrapper;
  },
});
const createElement = (type, props, ...children) => ({ type, props: { ...props, children } });
mock("react", { __esModule: true, default: { createElement }, createElement });

const PAGES = ["PayrollPage", "PayrollsPage", "ApprovedPayrollsPage", "PendingPayrollsPage", "ReconciledPayrollsPage"];

test("each payroll page is exported through overridable('payroll.<Page>')", () => {
  PAGES.forEach((page) => {
    assert.equal(src(`pages/payroll/${page}.js`).default.overridableKey, `payroll.${page}`);
  });
});

test("the payroll routes render the overridable pages", () => {
  const routes = src("index.js").PayrollModule({})["core.Router"];
  const keyOf = (pathStart) => routes.find((route) => route.path.startsWith(pathStart)).component.overridableKey;
  assert.equal(keyOf("payrolls/payroll/"), "payroll.PayrollPage");
  assert.equal(keyOf("payrollsApproved"), "payroll.ApprovedPayrollsPage");
  assert.equal(keyOf("payrollsPending"), "payroll.PendingPayrollsPage");
  assert.equal(keyOf("payrollsReconciled"), "payroll.ReconciledPayrollsPage");
  assert.equal(routes.find((route) => route.path === "payrolls").component.overridableKey, "payroll.PayrollsPage");
});

test("the payroll task view renders the overridable payroll page with the task's payroll id", () => {
  const { PayrollTaskItemFormatters } = src("components/tasks/PayrollTasks.js");
  const element = PayrollTaskItemFormatters()[0]({ id: "payroll-uuid" });
  assert.equal(element.type.overridableKey, "payroll.PayrollPage");
  assert.equal(element.props.taskPayrollUuid, "payroll-uuid");
});
