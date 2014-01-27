module('users.timfelgentreff.babelsberg.constraint_syntax').requires("lively.ide.CodeEditor").toRun(function() {
    cop.create("ConstraintSyntaxLayer").refineClass(lively.morphic.Morph, {
        addScript: function (funcOrString, origSource) {
            var result = cop.proceed.apply(this, [funcOrString]);
            result.getOriginal().originalSource = origSource;
            return result;
        },
    }).refineClass(lively.morphic.CodeEditor, {
        boundEval: function (code) {
            var addScriptWithOrigCode = new BabelsbergSrcTransform().transformAddScript(code);
            var constraintCode = new BabelsbergSrcTransform().transform(addScriptWithOrigCode);
            return cop.withLayers([ConstraintSyntaxLayer], function() {
                return cop.proceed.apply(this, [constraintCode]);
            });
        }
    }).refineObject(Function.prototype, {
        getOriginalSource: function () {
            return this.getOriginal().originalSource || this.getOriginal().toString();
        }
    });
}) // end of module
