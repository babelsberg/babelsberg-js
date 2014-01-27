module('users.timfelgentreff.babelsberg.src_transform').requires("cop.Layers", "lively.morphic.Halos").toRun(function() {
    // , "lively.ide.CodeEditor", 
    JSLoader.loadJs(module('users.timfelgentreff.babelsberg.uglify').uri())
    
    Object.subclass("BabelsbergSrcTransform", {
        isAlways: function (node) {
            return ((node instanceof UglifyJS.AST_LabeledStatement) &&
                    (node.label.name === "always") &&
                    (node.body instanceof UglifyJS.AST_BlockStatement))
        },
        
        getThisToSelfTransformer: function() {
            var self = this;
            return new UglifyJS.TreeTransformer(null, function (node) {
                if (node instanceof UglifyJS.AST_This) {
                    self.isTransformed = true;
                    return new UglifyJS.AST_SymbolRef({
                        start: node.start,
                        end: node.end,
                        name: "self"
                    })
                }
            })
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
                debugger
                enclosed = alwaysNode.args.last().enclosed || [];
                // always include this and readonly?
                // enclosed.push({name: "self"});
                // enclosed.push({name: "ro"});
                // var func = node.args.pop();
                // node.args.push(node.transform(this.getThisToSelfTransformer()));
            }
            var ctx = new UglifyJS.AST_Object({
                start: alwaysNode.start,
                end: alwaysNode.end,
                properties: enclosed.collect(function (ea) {
                    return new UglifyJS.AST_ObjectKeyVal({
                        start: alwaysNode.start,
                        end: alwaysNode.end,
                        key: ea.name,
                        value: new UglifyJS.AST_SymbolRef({
                            start: alwaysNode.start,
                            end: alwaysNode.end,
                            name: self.contextMap(ea.name)
                        })
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
                stream = UglifyJS.OutputStream({beautify: false, comments: false});
            if (this.isTransformed) {
                transformedAst.print(stream);
                return stream.toString();
            } else {
                return code;
            }
        },
    transformAddScript: function(code) {
        var ast = UglifyJS.parse(code);
            ast.figure_out_scope();
        var transformedAst = ast.transform(new UglifyJS.TreeTransformer(null, function (node) {
                if (node instanceof UglifyJS.AST_Call &&
                    node.expression instanceof UglifyJS.AST_Dot &&
                    node.expression.property === "addScript" &&
                    node.expression.expression instanceof UglifyJS.AST_This) {
                    assert(node.args.length === 1);
                    node.args.push(new UglifyJS.AST_String({value: code.slice(node.args[0].start.pos, node.args[0].end.endpos)}))
                    return node;
                }
            })),
            stream = UglifyJS.OutputStream({beautify: false, comments: false});
        transformedAst.print(stream);
        return stream.toString();
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
	        args = splitBodyAndArgs.args;
	    this.ensureReturnIn(body);
	    
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
        return {
            "this": "this",
            "self": "this",
            r: "bbb.readonly",
            ro: "bbb.readonly"
        }[name] || name;
    }

});

    cop.create("ConstraintEditorHaloLayer").refineClass(lively.morphic.ScriptEditorHalo, {
        clickAction: function(evt) {
            if (!Global["ConstraintSyntaxLayer"]) {
                module("users.timfelgentreff.babelsberg.constraint_syntax").load(true);
            }
            
            this.targetMorph.removeHalos();
            var editor = this.targetMorph.world().openObjectEditorFor(this.targetMorph, evt);
            editor.setWithLayers(editor.getWithLayers().concat([ConstraintSyntaxLayer]));
        }
    });
    ConstraintEditorHaloLayer.beGlobal();
    
    TestCase.subclass('users.timfelgentreff.babelsberg.src_transform.TransformTest', {
    testObjectEditorTransform1: function () {
        var src = "always: {a < b}";
        var result = new BabelsbergSrcTransform().transform(src);
        result = result.replace(/[ \n\r\t]/g,"");
        this.assert(result === "bbb.always({ctx:{}},function(){returna<b});", result);
    },
    testObjectEditorTransform2: function () {
        var src = "always: {solver: cassowary; priority: 'high'; a < b}";
        var result = new BabelsbergSrcTransform().transform(src);
        result = result.replace(/[ \n\r\t]/g,"");
        this.assert(result === "bbb.always({solver:cassowary,priority:\"high\",ctx:{}},function(){returna<b});", result);
    },
    testConvertAddScript: function() {
        var src = "this.addScript(function () { foo })";
        var result = new BabelsbergSrcTransform().transformAddScript(src);
        result = result.replace(/[ \n\r\t]/g,"");
        this.assert(result === "this.addScript(function(){foo},\"function(){foo}\");", result);
    }
});

}) // end of module
