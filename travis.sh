set -x
if [ "$TYPE" == "Lively" ]; then
    git clone git://github.com/LivelyKernel/LivelyKernel.git
    mkdir LivelyKernel/users
    ln -s $PWD LivelyKernel/users/timfelgentreff
	
    npm install jsdoc@"<=3.3.0"
	./node_modules/.bin/jsdoc jsdoc_test.js babelsberg/constraintinterpreter.js -d docs
	cd docs
	curl -T index.html http://www.lively-kernel.org/babelsberg/docs/
	cd ..
	
	for i in $(find docs -type f -name '*.html'); do
		echo $i
	done
	find docs -type f -name '*.html' -exec echo {};
    
	cd LivelyKernel
    Xvfb :1 -screen 0 800x600x24 &
    npm install
    node bin/lk-server --no-partsbin-check &
    sleep 15
    sed -i 's/var testList = baseTests;/var testList = [\"users.timfelgentreff.babelsberg.tests\"]; browserTests = [];/' run_tests.js
    DISPLAY=:1 npm test
    exitcode=$?

    if [ $exitcode -eq 0 ]; then
	curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.mini.js http://www.lively-kernel.org/babelsberg/
	curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.mini.prototype.js http://www.lively-kernel.org/babelsberg/
	fi
    exit $exitcode
else
    npm install zombie
    node $TRAVIS_BUILD_DIR/standalone/zombietest.js
    exitcode=$?
    exit $exitcode
fi
