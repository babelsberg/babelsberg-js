BabelsbergScript Tutorial
=========

Babelsberg offers different approaches for its integration in the browser. The simplest way is to use BabelsbergScript, a small extension of Javascript that facilitates the construction of constraints. For bigger projects it might be preferable to work with plain JavaScript. If you are working in the lively-kernel environment the transformation to regular JavaScript is already done for you.

###What is BabelsbergScript?

BabelsbergScript is the plain old JavaScript that you are used to, but added convenience in the construction of constraints. It offers automatic collection and creation of local context, so that you do not have to take care of it by yourself.

###Using BabelsbergScript

BabelsbergScript code can be loaded just like any other JavaScript using the `script` tag, except for the type being set to `"text/babelsbergscript"`:

```html
&#60!DOCTYPE html&#62
&#60html&#62
&#60head&#62
&#60!-- Load the Babelsberg.js library --&#62
&#60script type="text/javascript" src="js/babelsberg.mini.prototype.js"&#62&#60/script&#62
&#60!-- Define inlined BabelsbergScript --&#62
&#60script type="text/babelsberg"&#62
	// Create a solver and an object to work with.
	var s = new ClSimplexSolver(),
    	pt = {x: 1, y: 2}
	// Define your constraint in the simplified way.
	always: { solver: s
		pt.x + 7 <= pt.y
	}
	// Modify the object.
	pt.x = 10;
	// Check the result.
	console.log(obj.a, obj.b);
&#60/script&#62
&#60/head&#62
&#60body&#62
&#60/body&#62
&#60/html&#62
```

If you want to work with an external file instead, you can copy the inlined code to a file named `myScript.js`. This allows us to rewrite the above example to load the external file instead:

```html
&#60!DOCTYPE html&#62
&#60html&#62
&#60head&#62
&#60!-- Load the Babelsberg.js library --&#62
&#60script type="text/javascript" src="js/babelsberg.mini.prototype.js"&#62&#60/script&#62
&#60!-- Load external BabelsbergScript --&#62
&#60script type="text/babelsberg" src="myScript.js">&#60/script&#62
&#60/head&#62
&#60body&#62
&#60/body&#62
&#60/html&#62
```

Your BabelsbergScript code is transformed to regular JavaScript by Babelsberg under the hood. The generated JavaScript equivalent to the example above would be:

```javascript
// Create a solver and an object to work with.
var s = new ClSimplexSolver(),
    pt = {x: 1, y: 2};

// Define your constraint in the simplified way.
bbb.always({
    solver: s,
    ctx: {
        ClSimplexSolver: ClSimplexSolver,
        s: s,
        pt: pt,
        _$_self: this.doitContext || this
    }
}, function() {
    return pt.x + 7 <= pt.y;;
});

// Modify the object.
pt.x = 10;

// Check the result.
console.log(obj.a, obj.b);
```
