module('users.timfelgentreff.z3.Z3ServerInterface').requires().toRun(function() {

Object.subclass("Z3ServerInterface");

Object.extend(Z3ServerInterface, {
    createEvalExpression: function(code) {
        return code.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    },
    
    evalSync: function(expr, callback) {
        return this.eval(this.getZ3WR(callback).beSync(), expr);
    },
    eval: function(wr, expr) {
        var sanitizedExpr = this.createEvalExpression(expr);
        return wr.post(JSON.stringify({expr: sanitizedExpr, timeout: 3000}), 'application/json');
    },
    getZ3WR: function(callback) {
        var url = new URL(Config.nodeJSURL + '/').withFilename('Z3Server/eval');
        return url.asWebResource().withJSONWhenDone(function(json, status) {
            var err = status.isSuccess() ? null : json.error || json.message || json.result || 'unknown error';
            callback(err, String(json.result).trim());
        })
    },
    evalAsync: function(expr, callback) {
        return this.eval(this.getZ3WR(callback).beAsync(), expr);
    },
    
    resetZ3Server: function() {
        new URL((Config.nodeJSWebSocketURL || Config.nodeJSURL) + '/Z3Server/reset')
            .asWebResource().beAsync().post();
    }
});

}) // end of module
