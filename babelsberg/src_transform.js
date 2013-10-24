module('users.timfelgentreff.babelsberg.src_transform').requires("cop.Layers", "lively.ide.CodeEditor", "lively.morphic.Halos").toRun(function() {
    JSLoader.loadJs(module('users.timfelgentreff.babelsberg.uglify').uri())
    
    Object.subclass("BabelsbergSrcTransform", {});

    Object.extend(BabelsbergSrcTransform, {
        isAlways: function (node) {
            return (node instanceof UglifyJS.AST_Call) && (node.expression.name === "always");
        },
        
        transform: function (code) {
            var fixed_code = code.replace(/always\s*\((.*)\)(\s*{.*)?/, "always($1);$2"),
                ast = UglifyJS.parse(fixed_code),
                lastAlwaysFunc = null,
                lastAlwaysCtx = null;

            ast.figure_out_scope();

            var thisToSelfTransformer = new UglifyJS.TreeTransformer(null, function (node) {
                if (node instanceof UglifyJS.AST_This) {
                    return new UglifyJS.AST_SymbolRef({
                        start: node.start,
                        end: node.end,
                        name: "self"
                    })
                }
            })
            
            var transformer = new UglifyJS.TreeTransformer(function(node){
                if (lastAlwaysFunc) {
                    // next statement after always-call
                    // should be a block statement
                    if (!(node instanceof UglifyJS.AST_BlockStatement)) {
                        throw "Expected a block after `always'"
                    }
                    lastAlwaysFunc.body = node.transform(thisToSelfTransformer).body;
                    ast.enclosed.each(function (ea) {
			if (ea.name == "always") return; // skip always symbol, it isn't defined
                        lastAlwaysCtx.properties.push(new UglifyJS.AST_ObjectKeyVal({
                            start: node.start,
                            end: node.end,
                            key: ea.name,
                            value: new UglifyJS.AST_SymbolRef({
                                start: lastAlwaysCtx.start,
                                end: lastAlwaysCtx.end,
                                name: ea.name
                            })
                        }))
                    });
                    lastAlwaysFunc = null;
                    lastAlwaysCtx = null;
                    return new UglifyJS.AST_EmptyStatement({start: node.start, end: node.end});
                }
            }, function (node) {
                if (BabelsbergSrcTransform.isAlways(node)) {
                    lastAlwaysFunc = new UglifyJS.AST_Function({
                        start: node.start,
                        end: node.end,
                        argnames: [],
                        body: []
                    });
                    lastAlwaysCtx = new UglifyJS.AST_Object({
                        start: node.start,
                        end: node.end,
                        properties: [
                            new UglifyJS.AST_ObjectKeyVal({
                                start: node.start,
                                end: node.end,
                                key: "self",
                                value: new UglifyJS.AST_This({
                                    start: node.start,
                                    end: node.end,
                                    name: "this"
                                })
                            })
                        ]
                    });
                    return new UglifyJS.AST_Call({
                        start: node.start,
                        end: node.end,
                        args: node.args.concat([lastAlwaysCtx]),
                        expression: new UglifyJS.AST_Dot({
                            start: node.start,
                            end: node.end,
                            property: "shouldBeTrue",
                            expression: lastAlwaysFunc
                        })
                    });
                }
            });
            ast = ast.transform(transformer);
            
            var stream = UglifyJS.OutputStream({beautify: true});
            ast.print(stream);
            return stream.toString();
        }
    });
    
    cop.create("ConstraintSyntaxLayer").refineClass(lively.morphic.CodeEditor, {
        boundEval: function (code) {
            var result = cop.proceed(BabelsbergSrcTransform.transform(code));
            debugger
            if (Object.isFunction(result)) {
                // var funcCode = code.replace(/this.addScript\(/, "")
                //                     .replace(/\).tag\(\[.*\]\);/, "");
                // result.toString = function () {
                //     return funcCode;
                // }
            }
            return result;
        }
    });

    cop.create("ConstraintEditorHaloLayer").refineClass(lively.morphic.ScriptEditorHalo, {
        clickAction: function(evt) {
            if (evt.isShiftDown()) {
                this.targetMorph.removeHalos();
                var editor = this.targetMorph.world().openObjectEditorFor(this.targetMorph, evt);
                editor.setWithLayers(editor.getWithLayers().concat([ConstraintSyntaxLayer]));
            } else {
                return cop.proceed(evt);
            }
        },

        get style() {
            var style = {
                fill: Color.gray.lighter(2),
                enableDragging: false,
                enableGrabbing: false,
                toolTip: 'open script editor'
            }; // XXX: Copied style
            style.toolTip += " (shift+click for constraint script editor)";
            return style;
        }
    });
    ConstraintEditorHaloLayer.beGlobal();
}) // end of module
