#!/bin/bash
CWD="$(readlink -f `dirname "$0"`)"
cd $CWD/..

which gjslint
if [ $? -ne 0 ]; then
    echo "Installing Google's closure linter with `sudo easy_install`"
    sudo easy_install http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz
fi

FOLDERS=(babelsberg cassowary csp deltablue standalone sutherland)
EXCLUDE_FILES="uglify.js,\
PerformanceTests.js,\
tests.js,\
src_transform_test.js,\
zombietest.js,\
prototype.js,\
test_harness.js,\
underscore-min.js,\
testsuite.js,\
babelsberg.backtalk.js,\
babelsberg.cassowary.js,\
babelsberg.core.js,\
babelsberg.csp.js,\
babelsberg.deltablue.js,\
babelsberg.mini.js,\
babelsberg.mini.prototype.js,\
babelsberg.reactive.js,\
babelsberg.sutherland.js,\
babelsberg.z3.js,\
cassowaryjs.js,\
rhea.js,\
rhea.emscripten.js"
EXCLUDE_FOLDERS="examples"
CUSTOM_JSDOC_TAGS="example,function,global,name,tutorial"
MAX_LINE_LEN=90
exitcode=0
for i in ${FOLDERS[@]}; do
    gjslint -x $EXCLUDE_FILES -e $EXCLUDE_FOLDERS --custom_jsdoc_tags $CUSTOM_JSDOC_TAGS --nojsdoc --max_line_length $MAX_LINE_LEN -r $i
    exitcode=$[$? + $exitcode]
done
exit $exitcode
