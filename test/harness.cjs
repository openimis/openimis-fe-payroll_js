// Loader for the node test runner (`npm test`). The ES sources under src/ are
// compiled on the fly with the babel presets the build already depends on.
//
// `mock(request, exports)` makes `require(request)` return `exports`. Any
// other build external (react, @material-ui/*, ...) resolves to an inert
// proxy: every property is a function returning the proxy, which covers
// module-load-time calls such as withStyles()(), connect()() or JSX.
const path = require("node:path");
const Module = require("node:module");
const babel = require("@babel/core");

const SRC_DIR = path.join(__dirname, "..", "src") + path.sep;
const resolveFilename = Module._resolveFilename;
const loadJs = require.extensions[".js"];
const mocks = new Map();

const inert = new Proxy(function inert() {}, {
  get(target, property) {
    if (property === "__esModule") return true;
    if (typeof property === "symbol") return undefined;
    return inert;
  },
  apply: () => inert,
  construct: () => inert,
});

const EXTERNALS = [/^@material-ui\//, /^@openimis\//, /^react/, /^redux/, /^lodash/, /^clsx$/, /^moment/];

// Exports of a mocked module: the given members, the inert proxy for the rest.
const withFallback = (exports) =>
  new Proxy(exports, {
    get: (target, property) => (property in target ? target[property] : inert),
  });

Module._resolveFilename = function resolve(request, ...rest) {
  if (mocks.has(request)) return `mock:${request}`;
  if (EXTERNALS.some((pattern) => pattern.test(request))) return "mock:inert";
  return resolveFilename.call(this, request, ...rest);
};

const cache = (id, exports) => {
  const module = new Module(id);
  module.loaded = true;
  module.exports = exports;
  require.cache[id] = module;
};
cache("mock:inert", inert);

const compile = (module, filename) => {
  if (!filename.startsWith(SRC_DIR)) return loadJs(module, filename);
  const { code } = babel.transformFileSync(filename, {
    babelrc: false,
    configFile: false,
    presets: [
      ["@babel/preset-env", { targets: { node: "current" } }],
      ["@babel/preset-react", { runtime: "classic" }],
    ],
    plugins: ["@babel/plugin-proposal-class-properties"],
  });
  return module._compile(code, filename);
};
require.extensions[".js"] = compile;

const mock = (request, exports) => {
  mocks.set(request, exports);
  cache(`mock:${request}`, withFallback(exports));
};

const src = (relative) => require(path.join(SRC_DIR, relative));

module.exports = { mock, src };
