#!/bin/bash
CWD="$(readlink -f `dirname "$0"`)"
cd $CWD/..

cd LivelyKernel

if [ -z $DISPLAY ]; then
    Xvfb :1 -screen 0 800x600x24 &
    export DISPLAY=:1
fi

npm install
node bin/lk-server --no-partsbin-check &
sleep 15
sed -i 's/var testList = baseTests;/var testList = [\"users.timfelgentreff.babelsberg.tests\", \"users.ohshima.ElectricalCircuitTests\", \"users.ohshima.ElectricalComponentsTests\", \"users.timfelgentreff.reactive.reactive_test\", \"users.timfelgentreff.z3.Z3BBBTests\", \"users.timfelgentreff.backtalk.tests\"]; browserTests = [];/' run_tests.js
npm test
exitcode=$?

if [ $exitcode -eq 0 ]; then
    if [ "$TRAVIS_BRANCH" == "master" ]; then
	if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then
            for script in "standalone/babelsberg.mini.js
standalone/babelsberg.mini.prototype.js
standalone/babelsberg.cassowary.js
standalone/babelsberg.core.js
standalone/babelsberg.csp.js
standalone/babelsberg.deltablue.js
standalone/babelsberg.backtalk.js
standalone/babelsberg.reactive.js
standalone/babelsberg.sutherland.js
standalone/babelsberg.z3.js
z3/emz3/z3.js
z3/emz3/z3.js.map
z3/emz3/z3.js.mem"; do
	    curl -T $TRAVIS_BUILD_DIR/$script http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/$script -utimfel:$BINTRAY_KEY https://api.bintray.com/content/babelsberg/babelsberg-js/Nightlies/latest/$script
	    curl -X POST -utimfel:$BINTRAY_KEY https://api.bintray.com/content/babelsberg/babelsberg-js/Nightlies/latest/publish
	fi
    fi
fi
exit $exitcode
