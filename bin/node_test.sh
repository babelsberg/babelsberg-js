#!/bin/bash
CWD="$(readlink -f `dirname "$0"`)"
cd $CWD/..

node $TRAVIS_BUILD_DIR/standalone/zombietest.js
exitcode=$?
exit $exitcode
