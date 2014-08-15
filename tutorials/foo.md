BabelsbergScript Tutorial
=========

Babelsberg offers different approaches for its integration in the browser. The simplest way is to use BabelsbergScript, a small extension of Javascript that facilitates the construction of constraints. For bigger projects it might be preferable to work with plain JavaScript. If you are working in the lively-kernel environment the transformation to regular JavaScript is already done for you.

###What is BabelsbergScript?

BabelsbergScript is the plain old JavaScript that you are used to, but added convenience in the construction of constraints. It offers automatic collection and creation of local context, so that you do not have to take care of it by yourself.

###Using BabelsbergScript

BabelsbergScript code can be loaded just like any other JavaScript using the `<script>` tag, except for the type being set to `"text/babelsbergscript"`:



If you want to work with an external file instead, you can copy the inlined code to a file named `myScript.js`. This allows us to rewrite the above example to load the external file instead:


Your BabelsbergScript code is transformed to regular JavaScript by Babelsberg under the hood. The generated JavaScript equivalent to the example above would be:

