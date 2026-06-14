// Thin wrapper that exposes underscore under the name the QUnit test modules
// expect (`../../jslib/underscore-mock-es6.js`). The hand-rolled subset in
// node-pre.js mirrors a slice of underscore; here we re-export the real
// library so the tests run against its reference behavior.
module.exports = require("underscore")
