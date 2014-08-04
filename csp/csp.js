/* 
 * CSP.JS
 *
 * A constraint satisfaction problem solver in Javascript.
 *
 * By Niels Joubert https://github.com/njoubert/csp.js
 */
 
var csp = (function (util, discrete_finite) {
  
  var ret = {
    version: "0.1"
  }

  util.mixin(ret, discrete_finite);

  return ret;
  
})(util, discrete_finite);