module('users.timfelgentreff.babelsberg.crp').requires('users.timfelgentreff.babelsberg.constraintinterpreter').toRun(function() {
    
Object.subclass('FrameOfReference', {
    initialize: function() {
        this.time = 0;
    }
});

FrameOfReference.subclass('SystemFrameOfReference', {
    initialize: function($super) {
        $super();
        this._stepTime = 250;
        this.start();
    },
    step: function() {
        var now = Date.now();
        this.dt = now - (this.lastTime || now)
        this.lastTime = now;
        this.time = (this.time + this.dt) % Number.MAX_SAFE_INTEGER;
    },
    get stepTime() {
        return this._stepTime;
    },
    set stepTime(value) {
        this._stepTime = value;
        this.stop();
        this.start();
    },
    start: function() {
        if (this.stepper) throw 'not good';
        this.stepper = setInterval(this.step.bind(this), this.stepTime);
    },
    stop: function() {
        clearInterval(this.stepper);
        this.stepper = undefined;
    }
});

var _systemFrameOfReference = new SystemFrameOfReference();

Object.extend(bbb, {
    system: function () {
        return _systemFrameOfReference;
    }
});

}) // end of module
