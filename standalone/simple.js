//////////////////////////////////////////////////////////////////////////////
// these functions fake the Lively module and class system
// just enough so the loading of Babelsberg/JS succeeds
//////////////////////////////////////////////////////////////////////////////

window.Global = window.Global || window;
window.URL = window.URL || {};
URL.codeBase = URL.codeBase || "!not running in Lively!";
window.Config = window.Config || {};
window.cop = window.cop || {};
window.lively = window.lively || window;
lively.Class = {
    isClass: function Class$isClass(object) {
        if (object === Object
            || object === Array
            || object === Function
            || object === String
            || object === Boolean
            || object === Date
            || object === RegExp
            || object === Number) {
            return true;
        }
        return (object instanceof Function) && (object.superclass !== undefined);
    },
};
lively.morphic = lively.morphic || {};
Global.Functions = Global.Functions || {get Null() { return function() { return null; }; }};
lively.morphic.Morph = lively.morphic.Morph || Functions.Null;
lively.morphic.DragHalo = lively.morphic.DragHalo || Functions.Null;
Global.ObjectLinearizerPlugin = Global.ObjectLinearizerPlugin || Functions.Null;
lively.persistence = {};
lively.persistence.pluginsForLively = [];
lively.Module = Functions.Null;

Global.dbgOn = (function (b) {
    if (b) {
	debugger
    }
})

var loadedURLs = [];
Global.JSLoader = {
    loadJs: function(url, callback) {
        // var match = url.match(/http:\/\/[^\/]+(\/?.*)/);
        // if (match && match[1]) url = match[1];
        loadedURLs.push(url);
        try { importScripts(url); } catch(e) {
            // console.error(url + ' could not be loaded in worker: ' + e);
        }
    },
    currentDir: function () { return options.locationDirectory; },
    isLoading: function(url) { return loadedURLs.indexOf(url) !== -1; }
}

module = function(dottedPath) {
    if (dottedPath == "") return window;
    var path = dottedPath.split("."),

        name = path.pop(),
        parent = module(path.join("."));
    if (!parent[name]) parent[name] = {
        requires: function(ignored) { return this; },
        toRun: function(code) { code(); },
	uri: function() { return path; }
    };
    return parent[name];
};


Object.extend = function(obj /* + more args */ ) {
    // skip arg 0, copy properties of other args to obj
    for (var i = 1; i < arguments.length; i++)
        for (name in arguments[i])
            obj[name] = arguments[i][name];
    return obj;
};


Object.extend(Function.prototype, {
    subclass: function(/*... */) {
	// Main method of the LK class system.

	// {className} is the name of the new class constructor which this method synthesizes
	// and binds to {className} in the Global namespace.
	// Remaining arguments are (inline) properties and methods to be copied into the prototype
	// of the newly created constructor.

	// modified from prototype.js

	var args = $A(arguments),
	className = args.shift(),
	targetScope = Global,
	shortName = null;

	if (className) {
	    targetScope = Class.namespaceFor(className);
	    shortName = Class.unqualifiedNameFor(className);
	}  else {
	    shortName = "anonymous_" + (Class.anonymousCounter++);
	    className = shortName;
	}

	var klass;
	if (className && targetScope[shortName] && (targetScope[shortName].superclass === this)) {
	    // preserve the class to allow using the subclass construct in interactive development
	    klass = targetScope[shortName];
	} else {
	    klass = function() {
		if (this.initialize) this.initialize.apply(this, arguments);
		return this;
	    };
	    klass.superclass = this;
	    var protoclass = function() { }; // that's the constructor of the new prototype object
	    protoclass.prototype = this.prototype;
	    klass.prototype = new protoclass();
	    klass.prototype.constructor = klass;
	    klass.prototype.constructor.type = className; // KP: .name would be better but js ignores .name on anonymous functions
	    klass.prototype.constructor.displayName = className; // for debugging, because name can not be assigned
	    if (className) targetScope[shortName] = klass; // otherwise it's anonymous

	    // remember the module that contains the class def
	    if (Global.lively && lively.lang && lively.lang.Namespace)
		klass.sourceModule = lively.lang.Namespace.current();
	};

	// the remaining args should be category strings or source objects
	this.addMethods.apply(klass, args);

	if (!klass.prototype.initialize)
	    klass.prototype.initialize = function () {};

	return klass;
    },

    addMethods: function(/*...*/) {
	var args = arguments,
	category = this.defaultCategoryName,
	traits = [];
	for (var i = 0; i < args.length; i++) {
	    if (!Object.isString(args[i])) {
		this.addCategorizedMethods(category, args[i] instanceof Function ? (args[i])() : args[i]);
	    }
	}
	for (var i = 0; i < traits.length; i++)
	    traits[i].applyTo(this);
    },

    addCategorizedMethods: function(categoryName, source) {
        // first parameter is a category name
        // copy all the methods and properties from {source} into the
        // prototype property of the receiver, which is intended to be
        // a class constructor.     Method arguments named '$super' are treated
        // specially, see Prototype.js documentation for "Class.create()" for details.
        // derived from Class.Methods.addMethods() in prototype.js

        // prepare the categories
        if (!this.categories) this.categories = {};
        if (!this.categories[categoryName]) this.categories[categoryName] = [];
        var currentCategoryNames = this.categories[categoryName];

        if (!source)
            throw dbgOn(new Error('no source in addCategorizedMethods!'));

        var ancestor = this.superclass && this.superclass.prototype;

        var className = this.type || "Anonymous";

        for (var property in source) {

            if (property == 'constructor') continue;

            var getter = source.__lookupGetter__(property);
            if (getter) this.prototype.__defineGetter__(property, getter);
            var setter = source.__lookupSetter__(property);
            if (setter) this.prototype.__defineSetter__(property, setter);
            if (getter || setter) continue;

            currentCategoryNames.push(property);

            var value = source[property];
            // weirdly, RegExps are functions in Safari, so testing for
            // Object.isFunction on regexp field values will return true.
            // But they're not full-blown functions and don't
            // inherit argumentNames from Function.prototype

            var hasSuperCall = ancestor && Object.isFunction(value) &&
                value.argumentNames && value.argumentNames().first() == "$super";
            if (hasSuperCall) {
                // wrapped in a function to save the value of 'method' for advice
                (function() {
                    var method = value;
                    var advice = (function(m) {
                        return function callSuper() {
                            var method = ancestor[m];
                            if (!method)
                                throw new Error(Strings.format('Trying to call super of' +
							       '%s>>%s but super method non existing in %s',
							       className, m, ancestor.constructor.type));
                            return method.apply(this, arguments);
                        };
                    })(property);

                    advice.methodName = "$super:" + (this.superclass ? this.superclass.type + ">>" : "") + property;

                    value = Object.extend(advice.wrap(method), {
                        valueOf:  function() { return method },
                        toString: function() { return method.toString() },
                        originalFunction: method,
                    });
                    // for lively.Closures
                    method.varMapping = {$super: advice};
                })();
            }

            this.prototype[property] = value;

            if (property === "formals") { // rk FIXME remove this cruft
                // special property (used to be pins, but now called formals to disambiguate old and new style
                Class.addPins(this, value);
            } else if (Object.isFunction(value)) {
                // remember name for profiling in WebKit
                value.displayName = className + "$" + property;

                // remember where it was defined
                if (Global.lively && lively.lang && lively.lang.Namespace)
                    value.sourceModule = lively.lang.Namespace.current();

                for (; value; value = value.originalFunction) {
                    if (value.methodName) {
                        //console.log("class " + this.prototype.constructor.type
                        // + " borrowed " + value.qualifiedMethodName());
                    }
                    value.declaredClass = this.prototype.constructor.type;
                    value.methodName = property;
                }
            }
        } // end of for (var property in source)

        return this;
    },


    addProperties: function(spec, recordType) {
	Class.addMixin(this, recordType.prototype.create(spec).prototype);
    },

    wrap: function(wrapper) {
        var __method = this;
        var wrappedFunc = function wrapped() {
                var wrapperArgs = wrapper.isWrapper ? Array.from(arguments) : [__method.bind(this)].concat(Array.from(arguments));
                return wrapper.apply(this, wrapperArgs);
            }
        wrappedFunc.isWrapper = true;
        wrappedFunc.originalFunction = __method;
        return wrappedFunc;
    },

    parameterNames: function(methodString) {
        var parameterRegex = /function\s*\(([^\)]*)\)/,
            regexResult = parameterRegex.exec(methodString);
        if (!regexResult || !regexResult[1]) return [];
        var parameterString = regexResult[1];
        if (parameterString.length == 0) return [];
        var parameters = parameterString.split(',').map(function(str) {
            return str.trim();
        }, this);
        return parameters;
    },

    argumentNames: function() {
	return this.parameterNames(String(this));
    },

    firstParameter: function(src) {
        return this.parameterNames(src)[0] || null;
    },

    curry: function() {
        if (!arguments.length) return this;
        var __method = this,
            args = Array.from(arguments),
            wrappedFunc = function curried() {
                return __method.apply(this, args.concat(Array.from(arguments)));
            }
        wrappedFunc.isWrapper = true;
        wrappedFunc.originalFunction = __method;
        return wrappedFunc;
    },

    binds: function(varMapping) {
	return this;
	// var funcSource = String(this);
        // var closureVars = [],
        //     thisFound = false,
        //     specificSuperHandling = this.firstParameter(funcSource) === '$super';
        // for (var name in this.varMapping) {
        //     if (!this.varMapping.hasOwnProperty(name)) continue;
        //     if (name == 'this') {
        //         thisFound = true;
        //         continue;
        //     }
        //     closureVars.push(name + '=this.varMapping["' + name + '"]');
        // }
        // var src = closureVars.length > 0 ? 'var ' + closureVars.join(',') + ';\n' : '';
        // if (specificSuperHandling) src += '(function superWrapperForClosure() { return ';
        // src += '(' + funcSource + ')';
        // if (specificSuperHandling) src += '.apply(this, [$super.bind(this)].concat(Array.from(arguments))) })';
        // try {
        //     var func = eval(src) || this.couldNotCreateFunc(src);
        //     // this.addFuncProperties(func);
        //     this.originalFunc = func;
        //     return func;
        // } catch (e) {
        //     alert('Cannot create function ' + e + ' src: ' + src);
        //     throw e;
        // }
    },

    getVarMapping: function() {
	return this.varMapping;
    }
});

Object.extend(Array, {
    from: function(iterable) {
        if (!iterable) return [];
        if (iterable.toArray) return iterable.toArray();
        var length = iterable.length,
            results = new Array(length);
        while (length--) results[length] = iterable[length];
        return results;
    }
});
Object.extend(Array.prototype, {
    all: function(fn) {
	return this.every(fn);
    },
    compact: function() { return this.select(function (a) { return a }); },
    first: function() {
	return this[0];
    },
    last: function() {
	return this[this.length - 1];
    },
    select: function(fn) {
	return this.filter(fn);
    },
    invoke: function(method, arg1, arg2, arg3, arg4, arg5, arg6) {
        var result = new Array(this.length);
        for (var i = 0, len = this.length; i < len; i++) {
            result[i] = this[i][method].call(this[i], arg1, arg2, arg3, arg4, arg5, arg6);
        }
        return result;
    },
    collect: function(fn, binding) {
	if (binding) fn = fn.bind(binding);
	return this.map(fn);
    },
    withoutAll: function(ary) {
	return this.filter(function (ea) {
	    return ary.indexOf(ea) == -1;
	});
    },
    each: function(fn) {
	this.forEach(fn);
	return this;
    },
    include: function(el) {
	return this.indexOf(el) !== -1;
    },
    clone: function() {
	return this.concat([]);
    },
    flatten: function() {
        return this.inject([], function(array, value) {
            return array.concat(Object.isArray(value) ? value.flatten() : [value]);
        });
    },
    uniq: function(sorted) {
        return this.inject([], function(array, value, index) {
            if (0 === index || (sorted ? array.last() != value : !array.include(value))) array.push(value);
            return array;
        });
    },
    uniqueElements: function() { return this.uniq(); },
    inject: (function () {
        return Array.prototype.reduce ?
            function(memo, iterator, context) {
                if (context) iterator = iterator.bind(context);
                return this.reduce(iterator, memo);
            } : function(memo, iterator, context) {
                this.forEach(function(value, index) {
                    memo = iterator.call(context, memo, value, index); });
                return memo;
            }
    })()
});
$A = Array.from

Object.extend(Object, {
    isElement: function(object) {
        return object && object.nodeType == 1;
    },

    isArray: function(object) {
        return object && Array.isArray(object);
    },

    isFunction: function(object) {
        return object instanceof Function;
    },

    isBoolean: function(object) {
        return typeof object == "boolean";
    },

    isString: function(object) {
        return typeof object == "string";
    },

    isNumber: function(object) {
        return typeof object == "number";
    },

    isUndefined: function(object) {
        return typeof object == "undefined";
    },

    isRegExp: function(object) {
        return object instanceof RegExp;
    },

    isObject: function(object) {
        return typeof object == "object";
    },

    isEmpty: function(object) {
        for (var key in object)
            if (object.hasOwnProperty(key)) return false;
        return true;
    }
});

function __oldNamespace(spec, context) {
	var	 i,N;
	context = context || Global;
	spec = spec.valueOf();
	if (typeof spec === 'object') {
		if (typeof spec.length === 'number') {//assume an array-like object
			for (i = 0,N = spec.length; i < N; i++) {
				return namespace(spec[i], context);
			}
		} else {//spec is a specification object e.g, {com: {trifork: ['model,view']}}
			for (i in spec) if (spec.hasOwnProperty(i)) {
				context[i] = context[i] || new lively.lang.Namespace(context, i);
					return namespace(spec[i], context[i]);//recursively descend tree
			}
		}
	} else if (typeof spec === 'string') {
		(function handleStringCase() {
			var parts;
			parts = spec.split('.');
			for (i = 0, N = parts.length; i<N; i++) {
				spec = parts[i];
				context[spec] = context[spec] || new lively.lang.Namespace(context, spec);
				context = context[spec];
			}
		})();
		return context;
	} else {
		throw new TypeError();
	}
}

function namespace(spec, context) {
	var codeDB;
	if (spec[0] == '$') {
		codeDB = spec.substring(1, spec.indexOf('.'));
		spec = spec.substring(spec.indexOf('.') + 1);
	}
	var ret = __oldNamespace(spec, context);
	if (codeDB) {
		ret.fromDB = codeDB;
	}
	return ret;
};

Object.extend(Class, {
    namespaceFor: function Class$namespaceFor(className) {
	// get the namespace object given the qualified name
	var lastDot = className.lastIndexOf('.');
	if (lastDot < 0) return Global;
	else return namespace(className.substring(0, lastDot));
    },
    unqualifiedNameFor: function Class$unqualifiedNameFor(name) {
	var lastDot = name.lastIndexOf('.'); // lastDot may be -1
	var unqualifiedName = name.substring(lastDot + 1);
	return unqualifiedName;
    }
});


Global.Strings = {
    newUUID: function() {
        // copied from Martin's UUID class
        var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        }).toUpperCase();
        return id;
    },

    format: function Strings$format() {
        return Strings.formatFromArray(Array.from(arguments));
    },

    // adapted from firebug lite
    formatFromArray: function Strings$formatFromArray(objects) {
        var self = objects.shift();
        if (!self) { console.log("Error in Strings>>formatFromArray, first arg is undefined"); };

        function appendText(object, string) {
            return "" + object;
        }

        function appendInteger(value, string) {
            return value.toString();
        }

        function appendFloat(value, string, precision) {
            if (precision > -1) return value.toFixed(precision);
            else return value.toString();
        }

        function appendObject(value, string) {
            return Objects.inspect(value);
        }

        var appenderMap = {s: appendText, d: appendInteger, i: appendInteger, f: appendFloat, o: appendObject};
        var reg = /((^%|[^\\]%)(\d+)?(\.)([a-zA-Z]))|((^%|[^\\]%)([a-zA-Z]))/;

        function parseFormat(fmt) {
            var oldFmt = fmt;
            var parts = [];

            for (var m = reg.exec(fmt); m; m = reg.exec(fmt)) {
                var type = m[8] || m[5],
                    appender = type in appenderMap ? appenderMap[type] : appendObject,
                    precision = m[3] ? parseInt(m[3]) : (m[4] == "." ? -1 : 0);
                parts.push(fmt.substr(0, m[0][0] == "%" ? m.index : m.index + 1));
                parts.push({appender: appender, precision: precision});

                fmt = fmt.substr(m.index + m[0].length);
            }
            if (fmt)
                parts.push(fmt.toString());

            return parts;
        };

        var parts = parseFormat(self),
            str = "",
            objIndex = 0;

        for (var i = 0; i < parts.length; ++i) {
            var part = parts[i];
            if (part && typeof(part) == "object") {
                var object = objects[objIndex++];
                str += (part.appender || appendText)(object, str, part.precision);
            } else {
                str += appendText(part, str);
            }
        }
        return str;
    },
};

Global.Properties = {
    own: function(object) {
        var a = [];
        for (var name in object) {
            if (object.hasOwnProperty(name) && (object.__lookupGetter__(name) || !Object.isFunction(object[name]))) a.push(name);
        }
        return a;
    }
}

Object.subclass("TestCase", {
    assert: function (bool, msg) {
	if (!bool) {
	    throw new Error("Assertion failed " + msg);
	}
    },
    runAll: function () {
	for (var l in this) {
	    if (l.match(/^test/)) {
		var p = this[l];
		if (typeof(p) == "function") {
		    try {
			console.log(l);
			this.setUp && this.setUp();
			p.apply(this);
			this.tearDown && this.tearDown();
		    } catch (e) {
		    	console.error(e);
		    }
		}
	    }
	}
    }
});

Object.subclass("lively.Point", {
    initialize: function(x, y) {
	this.x = x;
	this.y = y;
	return this;
    },
    addPt: function(p) {
	return pt(this.x + p.x, this.y + p.y);
    },
    equals: function(p) {
	return this.eqPt(p);
    },
    eqPt: function(p) {
	return this.x == p.x && this.y == p.y
    },
    leqPt: function(p) {
	return this.x <= p.x && this.y <= p.y
    },
    scaleBy: function(scalar) {
	return pt(this.x * scalar, this.y * scalar);
    }
});
Global.pt = (function (x, y) {
    return new lively.Point(x,y);
});
lively.pt = pt;


Global.alertOK = (function(msg) {
    console.log(msg);
});

Color = {
    rgb: function(r,g,b) {
	var c = {r: r, g: g, b: b};
	c.equals = function (o) {
	    return o.r == this.r && o.b == this.b && o.b == this.b
	}.bind(c);
    }
}
