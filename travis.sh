DISPLAY=:1 npm test
exitcode=$?

if [ $exitcode -eq 0 ]; then
    set -x
    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.mini.js http://www.lively-kernel.org/babelsberg/
    curl -T $TRAVIS_BUILD_DIR/standalone/babelsberg.mini.prototype.js http://www.lively-kernel.org/babelsberg/
fi
exit $exitcode
