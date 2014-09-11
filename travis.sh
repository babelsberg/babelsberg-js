set -x
if [ "$TYPE" == "Lively" ]; then
    git clone git://github.com/LivelyKernel/LivelyKernel.git
    mkdir LivelyKernel/users
    ln -s $PWD LivelyKernel/users/timfelgentreff
    ln -s $PWD/ohshima LivelyKernel/users/ohshima

    npm install jsdoc@"<=3.3.0"
	./node_modules/.bin/jsdoc -c jsdoc_conf.json -d docs
	cd docs
	for f in *.html
	do
	  curl -T $f http://www.lively-kernel.org/babelsberg/docs/
	done
	find . -type f -exec echo '{}' \; -exec cat '{}' \;
	cd ..
    
	cd LivelyKernel
    Xvfb :1 -screen 0 800x600x24 &
    npm install
    node bin/lk-server --no-partsbin-check &
    sleep 15
    sed -i 's/var testList = baseTests;/var testList = [\"users.timfelgentreff.babelsberg.tests\", \"users.ohshima.ElectricalCircuitTests\", \"users.ohshima.ElectricalComponentsTests\"]; browserTests = [];/' run_tests.js
    DISPLAY=:1 npm test
    exitcode=$?

    if [ $exitcode -eq 0 ]; then
    if [ "$TRAVIS_BRANCH" == "master" ]; then
    if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then    
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.mini.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.mini.prototype.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.cassowary.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.core.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.csp.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.deltablue.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.sutherland.js http://www.lively-kernel.org/babelsberg/
	    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.z3.js http://www.lively-kernel.org/babelsberg/
	fi fi fi
    exit $exitcode
else
    npm install zombie
    node $TRAVIS_BUILD_DIR/standalone/zombietest.js
    exitcode=$?
    exit $exitcode
fi
