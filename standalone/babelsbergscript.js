/**
 * @name Babelsbergscript
 */
(function() {
	var Http = {
		request: function(method, url, callback) {
			var xhr = new (window.ActiveXObject || XMLHttpRequest)(
						'Microsoft.XMLHTTP');
			xhr.open(method.toUpperCase(), url, true);
			if ('overrideMimeType' in xhr)
				xhr.overrideMimeType('text/plain');
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					var status = xhr.status;
					if (status === 0 || status === 200) {
						callback.call(xhr, xhr.responseText);
					} else {
						throw new Error('Could not load ' + url + ' (Error '
								+ status + ')');
					}
				}
			};
			return xhr.send(null);
		}
	};

	/**
	 * Transforms the given Babelsbergscript source code as regular JavaScript.
	 * @function Babelsberg.compile
	 * @public
	 * @param {string} code The source code that should be transformed.
	 * @returns {string} A transformed version of the given source code.
	 */
	Babelsberg.compile = function(code) {
		var t = new BabelsbergSrcTransform();
		return t.transform(code);
	}

	/**
	 * Transforms and executes the given Babelsbergscript source code.
	 * @function Babelsberg.execute
	 * @public
	 * @param {string} code The source code that should be executed.
	 * @param {Object} scope The scope in which the given code is executed.
	 */
	Babelsberg.execute = function(code, scope) {
		var params = [],
			args = [],
			func;
		code = Babelsberg.compile(code);
		var firefox = window.InstallTrigger;
		if (firefox || window.chrome) {
			var script = document.createElement('script'),
				head = document.head;
			if (firefox)
				code = '\n' + code;
			script.appendChild(document.createTextNode(
				'bbb._execute = function(' + params + ') {' + code + '\n}'
			));
			head.appendChild(script);
			func = bbb._execute;
			delete bbb._execute;
			head.removeChild(script);
		} else {
			func = Function(params, code);
		}
		var res = func.apply(scope, args) || {};
	}

	function load() {
		function checkScript(script) {
			if (/^text\/(?:x-|)babelsbergscript$/.test(script.type)
					&& !script.getAttribute('babelsberg-ignore')) {
				var src = script.src;
				if (src) {
					Http.request('get', src, function(code) {
						Babelsberg.execute(code);
					});
				} else {
					Babelsberg.execute(script.innerHTML);
				}
				script.setAttribute('babelsberg-ignore', true);
			}
		};

		var scripts = document.getElementsByTagName('script');
		for(var i = 0; i < scripts.length; i++)
			checkScript(scripts[i]);
	}

	if (document.readyState === 'complete') {
		setTimeout(load);
	} else {
		contentLoaded(window, load);
	}
})();