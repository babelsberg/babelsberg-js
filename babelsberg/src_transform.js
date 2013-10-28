module('users.timfelgentreff.babelsberg.src_transform').requires("cop.Layers", "lively.ide.CodeEditor", "lively.morphic.Halos").toRun(function() {
    JSLoader.loadJs(module('users.timfelgentreff.babelsberg.uglify').uri())
    
    Object.subclass("BabelsbergSrcTransform", {
        isAlways: function (node) {
            return ((node instanceof UglifyJS.AST_Call) &&
                    (node.expression && node.expression.expression &&
                    (node.expression.expression.name === "bbb") &&
                    (node.expression.property === "always")));
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
            debugger
            var enclosed = ast.enclosed;
            if (alwaysNode.args.last() instanceof UglifyJS.AST_Function) {
                enclosed = alwaysNode.args.last().enclosed;
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
                            name: ea.name
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
            if (!this.hasContextInArgs(alwaysNode)) {
                this.createContextFor(ast, alwaysNode);
            }
        },
        
        getContextTransformerFor: function(ast) {
            var self = this;
            return new UglifyJS.TreeTransformer(null, function (node) {
                if (self.isAlways(node)) {
                    if (node.args.length != 1 && node.args.length != 2) {
                        throw SyntaxError("call to `always' must have 1..2 arguments");
                    }
                    self.ensureContextFor(ast, node);
                    self.isTransformed = true;
                    return node;
                }
            });
        },
        
        transform: function (code) {
            var ast = UglifyJS.parse(code);
            ast.figure_out_scope();
            var transformedAst = ast.transform(this.getContextTransformerFor(ast)),
                stream = UglifyJS.OutputStream({beautify: true});
            if (this.isTransformed) {
                transformedAst.print(stream);
                return stream.toString();
            } else {
                return code;
            }
        }
});
    
    cop.create("ConstraintSyntaxLayer").refineClass(lively.morphic.CodeEditor, {
        boundEval: function (code) {
            return cop.proceed(new BabelsbergSrcTransform().transform(code));
        }
    });

    cop.create("ConstraintEditorHaloLayer").refineClass(lively.morphic.ScriptEditorHalo, {
        clickAction: function(evt) {
            this.targetMorph.removeHalos();
            var editor = this.targetMorph.world().openObjectEditorFor(this.targetMorph, evt);
            editor.setWithLayers(editor.getWithLayers().concat([ConstraintSyntaxLayer]));
        }
    });
    ConstraintEditorHaloLayer.beGlobal();
}) // end of module
