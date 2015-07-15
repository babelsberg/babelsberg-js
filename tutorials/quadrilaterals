Quadrilateral Examples (and Running in Standalone Mode)
=========

This small tutorial describes how to run Babelsberg/JS in standalone mode, along with describing a set of examples
that are useful for demos.  The examples are all variations of the classic constraint example of demonstrating a
theorem about quadrilaterals.  The theorem states that, if you start with an arbitrary quadrilateral, bisect each side,
and draw lines between these points, the result is always a parallelogram.  The constraints thus describe the
connectivity of the sides, along with midpoint constraints on the points at the middles of the sides.

###Running Standalone

You'll need to have a local server running on your machine.  On Macintosh, an easy way to do this is using this command:
<script>
python -m SimpleHTTPServer 9001
</script>

Then start a browser (Chrome recommended), and browse to `localhost:9001"`. Navigate to the directory with the examples and 
open the desired `.html` file.  For example, for `quadrilateral.html`, if you've cloned the git repository into
`babelsberg-js`, go to `http://localhost:9001/babelsberg-js/standalone/examples/cassowary/quadrilateral.html`.  Then 
select any point in the diagram with the mouse and move it -- the constraints shoudl be maintained.

###Quadrilateral Variations

Each of these files is a pair, for example `quadrilateral.html` and `quadrilateral.js`.  Browse to the `html` file.  
(Sometime these should be refactored to remove duplication.)

<ul>
<li>quadrilateral -- the basic quadrilateral, done in a naive way with separate objects for the lines and the
points, related using constraints.  This is kind of slow as a result, since the JavaScript hash implementation 
is bad, making Cassowary slow.</li>

<li>simplequad -- a simplified version, with fewer constrained objects and relying on fabric.js for some of the 
propagation.  This is faster.</li>

<li>editquad -- version using edit constraints.  Currently slow due to a bug in edit constraint implementation, but
should be fast once this is fixed.</li>

<li>boundedquad -- quadrilateral using edit constraints at a strong but not required priority, with required 
constraints to keep it within a rectangle.  Also slow at the moment.  Try moving the cursor outside the rectangle,
and notice that the point being moved follows the cursor as well as it can.</li>

<li>pivotquad -- quadrilateral with stronger stays on the midpoints than on the endpoints -- this is useful to
illustrate why we need control over the priorities of stays.</li>
