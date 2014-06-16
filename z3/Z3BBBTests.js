module('users.timfelgentreff.z3.Z3BBBTests').requires("users.timfelgentreff.babelsberg.tests", "users.timfelgentreff.z3.ServerZ3").toRun(function() {
    
    TestCase.subclass("users.timfelgentreff.z3.Z3BBBTest", {
        testDisjunction: function () {
            var solver = new ServerZ3("synch"),
                res = {major: 0, minor: 0, patch: 0},
                req = {major: 3, minor: 1, patch: 0};
            solver.reset();
            solver.always({
                ctx: {
                    res: res,
                    req: req,
                    ro: bbb.readonly
                }
            }, function () {
                return (
                    (res.major >= ro(req.major)) ||
                    (res.major == ro(req.major) && res.minor >= ro(req.minor)) ||
                    (res.major == ro(req.major) && res.minor == ro(req.minor) && res.patch >= ro(req.patch))
                );
            });
            
            this.assert((res.major >= req.major) ||
                        (res.major == req.major && res.minor >= req.minor) ||
                        (res.major == req.major && res.minor == req.minor) && res.patch >= req.patch);
        }
    });
    
}) // end of module
