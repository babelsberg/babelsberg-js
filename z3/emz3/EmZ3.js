module('users.timfelgentreff.z3.emz3.EmZ3').requires().toRun(function() {

    Object.subclass("EmZ3", {
        initialize: function () {
            var prefixUrl; //new URL(module('users.timfelgentreff.z3.emz3.EMZ3').uri()).dirname();
            // A little hackery to find the URL of this very file.
            // Throw an error, then parse the stack trace looking for filenames.
            var errlines = (new Error()).stack.split("\n");
            for (var i = 0; i < errlines.length; i++) {
              var match = /(https?:\/\/.+\/)EmZ3.js/.exec(errlines[i]);
              if (match) {
                prefixUrl = match[1];
                break;
              }
            }
            
            var self = this;
            var request = new XMLHttpRequest();
            request.onreadystatechange = function () {
                var DONE = request.DONE || 4;
                if (request.readyState === DONE){
                    // Initialize the Module object.
                    var Module = {};
                    self.Module = Module;
                    Module.TOTAL_MEMORY = 128 * 1024 * 1024;
                    Module.memoryInitializerPrefixURL = prefixUrl;
                    Module.arguments = ["-smt2", "problem.smt2"];
                    // Don't start or stop the program, just set it up.
                    // We'll call the API functions ourself.
                    Module.noInitialRun = true;
                    Module.noExitRuntime = true;
                    // Route stdout to an overridable method on the object.
                    // Module.stdin = (function stdin() {
                    //     return self.stdin();
                    // });
                
                    // Route stdout to an overridable method on the object.
                    // Module.stdout = (function stdout(x) {
                    //     console.log(x);
                    //     self.stdout(x);
                    // });
                    
                    // Route stderr to an overridable method on the object.
                    Module.stderr = (function stderr(x) {
                        self.stderr(x);
                    });
                    
                    // Eval the code.  This will probably take quite a while in Firefox
                    // as it parses and compiles all the functions.  The result is that
                    // our "Module" object is populated with all the exported VM functions.
                    console.log("evaluating asmjs code...");
                    eval(request.responseText);
                    self.FS = FS;
                }
            };
            request.open("GET", prefixUrl + "z3.js", true);
            request.send();
        },
        
        run: function (code) {
            this.stdout = [];
            this.FS.createDataFile("/", "problem.smt2", code, true, true);
            try {
                this.Module.callMain(["-smt2", "/problem.smt2"]);
            } finally {
                this.FS.unlink("/problem.smt2");
            }
            return this.stdout.join("");
        },
        
        stdin: function () {
            debugger
        },
        stdout: function (c) {
            console.log(String.fromCharCode(c));
            this.stdout.push(String.fromCharCode(c));
        },
        stderr: function (c) {
            this.stdout.push(String.fromCharCode(c));
        }
    });
}) // end of module
