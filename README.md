Babelsberg/JS
=============
[![Build Status](https://travis-ci.org/babelsberg/babelsberg-js.png?branch=master)](https://travis-ci.org/babelsberg/babelsberg-js)

For more information, please visit our [gh-pages](http://babelsberg.github.io/babelsberg-js/)

Basically, you can write constraints using the `always` primitive that you always want to be true,
using existing object-oriented abstractions (I am using the methods `getPosition` and
`dist` in the example above), and the system will maintain them. The extent to which the
system is able to keep constraints satisfied depends on the solver that is used. This
implementation provides Z3, DeltaBlue, and Cassowary.

We have used this to implement electrical simulations, a simulation of the Lively Engine,
and some graphical layouting examples. The implementation is available to try at [lively-web.org](http://lively-web.org/users/robertkrahn/2013-10-16_first-constrained-steps.html).
At any given time it may be broken, though, because the code is changing fairly often.


Created under a grant from Hasso Plattner Institute <img src="http://upload.wikimedia.org/wikipedia/de/c/c9/Hpi_logo.png" alt="HPI Logo" width="50" height="50"/>

