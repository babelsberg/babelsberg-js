Babelsberg/JS
=============

A LivelyKernel implementation of Babelsberg licensed under [MIT](https://github.com/timfel/babelsberg-js/blob/master/LICENSE)


See also [Babelsberg/R](https://github.com/timfel/babelsberg-r)

It allows you to do stuff like this
```javascript
z3 = new ServerZ3()
z3.reset()
a = lively.morphic.Morph.makeRectangle(0, 0, 10, 10)
b = lively.morphic.Morph.makeCircle(pt(0,0), 10)
always: {
    solver: z3
    a.getPosition().dist(b.getPosition()) == 200
}
a.getPosition() // lively.pt(0.5,-200.0)
b.getPosition() // lively.pt(0.0,0.0)

a.setPosition(pt(100, 100))
a.getPosition() // lively.pt(100.0,100.0)
b.getPosition() // lively.pt(99.9,300.0)
```

Basically, you can write constraints using the `always` primitive that you always want to be true,
using existing object-oriented abstractions (I am using the methods `getPosition` and
`dist` in the example above), and the system will maintain them. The extent to which the
system is able to keep constraints satisfied depends on the solver that is used. This
implementation provides Z3, DeltaBlue, and Cassowary.

We have used this to implement electrical simulations, a simulation of the Lively Engine,
and some graphical layouting examples. The implementation is available to try at [lively-web.org](http://lively-web.org/users/robertkrahn/2013-10-16_first-constrained-steps.html).
At any given time it may be broken, though, because the code is changing fairly often.

Papers about this implementation are forthcoming and a freely accessible technical report
will be published shortly.
