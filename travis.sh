set -x
case "$TYPE" in
    Lively)
	git clone git://github.com/LivelyKernel/LivelyKernel.git
	mkdir LivelyKernel/users
	ln -s $PWD LivelyKernel/users/timfelgentreff
	
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
	sed -i 's/var testList = baseTests;/var testList = [\"users.timfelgentreff.babelsberg.tests\"]; browserTests = [];/' run_tests.js
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
		fi
	    fi
	fi
	exit $exitcode
	;;
    Standalone)
	npm install zombie
	node $TRAVIS_BUILD_DIR/standalone/zombietest.js
	exitcode=$?
	exit $exitcode
	;;
    lint)
	sudo easy_install http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz
	FOLDERS=(babelsberg cassowary csp deltablue standalone sutherland)
	EXCLUDE_FILES="uglify.js,PerformanceTests.js,tests.js,src_transform_test.js,zombietest.js,prototype.js,test_harness.js,underscore-min.js"
	EXCLUDE_FOLDERS="examples"
	CUSTOM_JSDOC_TAGS="example,function,global,name,tutorial"
	MAX_LINE_LEN=150
	exitcode=0
	for i in ${FOLDERS[@]}; do
	    gjslint -x $EXCLUDE_FILES -e $EXCLUDE_FOLDERS --custom_jsdoc_tags $CUSTOM_JSDOC_TAGS --nojsdoc --max_line_length $MAX_LINE_LEN -r $i
	    exitcode=$[$? + $exitcode]
	done
	exit $exitcode
	;;
esac
