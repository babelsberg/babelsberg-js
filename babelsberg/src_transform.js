module('users.timfelgentreff.babelsberg.src_transform').requires("cop.Layers", "lively.morphic.Halos", "lively.ide.CodeEditor").toRun(function() {
    JSLoader.loadJs(module('users.timfelgentreff.babelsberg.uglify').uri())
    
    Object.subclass("BabelsbergSrcTransform", {
        isAlways: function (node) {
            return ((node instanceof UglifyJS.AST_LabeledStatement) &&
                    (node.label.name === "always") &&
                    (node.body instanceof UglifyJS.AST_BlockStatement))
        },
        
        ensureThisToSelfIn: function(ast) {
            var tr = new UglifyJS.TreeTransformer(function (node) {
                if (node instanceof UglifyJS.AST_This) {
                    return new UglifyJS.AST_SymbolRef({
                        start: node.start,
                        end: node.end,
                        name: "_$_self"
                    })
                }
            }, null);
            ast.transform(tr);
        },
        
        hasContextInArgs: function(alwaysNode) {
            if (alwaysNode.args.length == 2) {
                if (!alwaysNode.args[0] instanceof UglifyJS.AST_Object) {
                    throw new SyntaxError("first argument of call to `always' must be an object")
                }
                return alwaysNode.args[0].properties.any(function (ea) {
                    return ea.key === "ctx"
                });
            } else {
                return false;
            }
        },
        
        createContextFor: function(ast, alwaysNode) {
            var enclosed = ast.enclosed,
                self = this;
            if (alwaysNode.args.last() instanceof UglifyJS.AST_Function) {
                enclosed = alwaysNode.args.last().enclosed || [];
                // TODO: Check if this is correct. This should remove symbols
                // that are not defined yet from the passed ctx
                enclosed = enclosed.reject(function (ea) {
                    return ea.init && (ea.init.start.pos > alwaysNode.start.pos);
                });
                enclosed.push({name: "_$_self"}); // always include this
            }
            var ctx = new UglifyJS.AST_Object({
                start: alwaysNode.start,
                end: alwaysNode.end,
                properties: enclosed.collect(function (ea) {
                    return new UglifyJS.AST_ObjectKeyVal({
                        start: alwaysNode.start,
                        end: alwaysNode.end,
                        key: ea.name,
                        value: self.contextMap(ea.name)
                    })
                })
            });
            
            var ctxkeyval = new UglifyJS.AST_ObjectKeyVal({
                start: alwaysNode.start,
                end: alwaysNode.end,
                key: "ctx",
                value: ctx
            });
            if (alwaysNode.args.length == 2) {
                alwaysNode.args[0].properties.push(ctxkeyval)
            } else {
                alwaysNode.args.unshift(new UglifyJS.AST_Object({
                    start: alwaysNode.start,
                    end: alwaysNode.end,
                    properties: [ctxkeyval]
                }))
            }
        },
        
        ensureContextFor: function(ast, alwaysNode) {
            if (!this.hasContextInArgs(alwaysNode.body)) {
                this.createContextFor(ast, alwaysNode.body);
            }
        },
        
        getContextTransformerFor: function(ast) {
            var self = this;
            return new UglifyJS.TreeTransformer(null, function (node) {
                if (self.isAlways(node)) {
                    var node = self.createCallFor(node);
                    self.ensureContextFor(ast, node);
                    // if (node.args.length != 1 && node.args.length != 2) {
                    //     throw SyntaxError("call to `always' must have 1..2 arguments");
                    // }
                    // self.ensureContextFor(ast, node);
                    self.isTransformed = true;
                    return node;
                }
            });
        },
        
        transform: function (code) {
            var ast = UglifyJS.parse(code);
            ast.figure_out_scope();
            var transformedAst = ast.transform(this.getContextTransformerFor(ast)),
                stream = UglifyJS.OutputStream({beautify: true, comments: true});
            if (this.isTransformed) {
                transformedAst.print(stream);
                return stream.toString();
            } else {
                return code;
            }
        },
    transformAddScript: function(code) {
        var ast = UglifyJS.parse(code);
            ast.figure_out_scope(),
            transformed = false;
        var transformedAst = ast.transform(new UglifyJS.TreeTransformer(null, function (node) {
                if (node instanceof UglifyJS.AST_Call &&
                    node.expression instanceof UglifyJS.AST_Dot &&
                    node.expression.property === "addScript" &&
                    node.expression.expression instanceof UglifyJS.AST_This) {
                    assert(node.args.length === 1);
                    node.args.push(new UglifyJS.AST_String({value: code.slice(node.args[0].start.pos, node.args[0].end.endpos)}));
                    transformed = true;
                    return node;
                }
            })),
            stream = UglifyJS.OutputStream({beautify: true, comments: true});
        if (transformed) {
            transformedAst.print(stream);
            return stream.toString();
        } else {
            return code;
        }
    },

    ensureReturnIn: function(body) {
        var lastStatement = body.last();
	    if (!(lastStatement.body instanceof UglifyJS.AST_Return)) {
	        body[body.length - 1] = new UglifyJS.AST_Return({
	            start: lastStatement.start,
	            end: lastStatement.end,
	            value: lastStatement
	        })
	    }
    },

    extractArgumentsFrom: function(alwaysNode) {
        var body = alwaysNode.body.body,
            newBody = [],
            args = [],
	        extraArgs = [];
	    newBody = body.select(function (ea) {
	        if (ea instanceof UglifyJS.AST_LabeledStatement) {
	            if (!(ea.body instanceof UglifyJS.AST_SimpleStatement)) {
	                throw "Labeled arguments in `always:' have to be simple statements"
	            }
	            extraArgs.push(new UglifyJS.AST_ObjectKeyVal({
	                start: ea.start,
	                end: ea.end,
	                key: ea.label.name,
	                value: ea.body.body
	            }))
	            return false;
	        } else {
	            return true;
	        }
	    })
	    if (extraArgs) {
	        args.push(new UglifyJS.AST_Object({
	            start: alwaysNode.start,
	            end: alwaysNode.end,
	            properties: extraArgs
	        }))
	    }
	    return {body: newBody, args: args}
    },

	createCallFor: function(alwaysNode) {
	    var splitBodyAndArgs = this.extractArgumentsFrom(alwaysNode),
	        body = splitBodyAndArgs.body,
	        args = splitBodyAndArgs.args,
	        self = this;
	    this.ensureReturnIn(body);
	    body.each(function (ea) {
	        self.ensureThisToSelfIn(ea);
	    });
	    
	    return new UglifyJS.AST_SimpleStatement({
    		start: alwaysNode.start,
    		end: alwaysNode.end,
    		body: new UglifyJS.AST_Call({
    		    start: alwaysNode.start,
    		    end: alwaysNode.end,
    		    expression: new UglifyJS.AST_Dot({
        			start: alwaysNode.start,
        			end: alwaysNode.end,
        			property: "always",
        			expression: new UglifyJS.AST_SymbolRef({
        			    start: alwaysNode.start,
        			    end: alwaysNode.end,
        			    name: "bbb"
        			})
    		    }),
    		    args: args.concat([new UglifyJS.AST_Function({
        			start: alwaysNode.body.start,
        			end: alwaysNode.body.end,
        			body: body,
        			enclosed: alwaysNode.label.scope.enclosed,
        			argnames: [],
    		    })])
    		})
	    })
	},

    contextMap: function(name) {
        // map some custom shortnames to bbb functions
        if (name === "_$_self") {
            return new UglifyJS.AST_Binary({
                operator: "||",
                left: new UglifyJS.AST_Dot({
                    expression: new UglifyJS.AST_This({}),
                    property: "doitContext"
                }),
                right: new UglifyJS.AST_This({})
            });
        }
        
        if (name === "ro") {
            name = "bbb.readonly";
        }
        return new UglifyJS.AST_SymbolRef({name: name});
    }

});

    cop.create("AddScriptWithFakeOriginalLayer").refineClass(lively.morphic.Morph, {
        addScript: function (funcOrString, origSource) {
            var originalFunction;
            originalFunction = cop.proceed.apply(this, [origSource]);
            var result = cop.proceed.apply(this, [funcOrString]);
            result.getOriginal().setProperty("originalFunction", originalFunction);
            return result;
        },
    });

    cop.create("ConstraintSyntaxLayer").refineClass(lively.morphic.CodeEditor, {
        doSave: function () {
            if (this.owner instanceof lively.ide.BrowserPanel) {
                // XXX: Ad-hoc fragment search
                debugger
                var t = new BabelsbergSrcTransform(),
                    idx = this.textString.indexOf("always:"),
                    endIdx = this.textString.indexOf("}", idx + 1),
                    fragments = [];
                while (idx !== -1 && endIdx !== -1) {
                    try {
                        var str = t.transform(this.textString.slice(idx, endIdx + 1));
                        fragments.push([idx, endIdx, str]);
                        idx = this.textString.indexOf("always:", idx + 1);
                        endIdx = this.textString.indexOf("}", idx + 1);
                    } catch(e) {
                        // parsing exception
                        endIdx = this.textString.indexOf("}", endIdx + 1);
                    }
                }

                if (fragments.length !== 0) {
                    var textPos = 0;
                    var newTextString = fragments.inject("", function (memo, fragment) {
                        var r = this.textString.slice(textPos, fragment[0]) + fragment[2];
                        textPos = fragment[1] + 1;
                        return memo + r;
                    }.bind(this));
                    newTextString += this.textString.slice(textPos);
                    this.textString = newTextString;
                }
                return cop.withoutLayers([ConstraintSyntaxLayer], function () {
                    return cop.proceed();
                })
            } else {
                return cop.proceed();
            }
        },
        
        boundEval: function (code) {
            debugger
            var t = new BabelsbergSrcTransform(),
                addScriptWithOrigCode = t.transformAddScript(code),
                constraintCode = t.transform(addScriptWithOrigCode);
            if (addScriptWithOrigCode === constraintCode) {
                // no constraints in code
                return cop.proceed.apply(this, [code]);
            } else {
                return cop.withLayers([AddScriptWithFakeOriginalLayer], function() {
                    // If this layer is not global but only on the morph, make sure we use it here
                    return cop.proceed.apply(this, [constraintCode]);
                });
            }
        }
    });
    ConstraintSyntaxLayer.beGlobal();
    
    
}) // end of module
